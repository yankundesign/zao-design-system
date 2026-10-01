import { randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseStyle } from '@zao/engine';
import {
  analyzeImage,
  imageMimeType,
  type ImageAnalysis,
  type ImageMimeType,
} from './image-analysis.ts';
import { repoRoot } from './paths.ts';

const fixtureRoot =
  process.env.NODE_ENV === 'test' ? process.env.ZAO_REFERENCE_TEST_ROOT : undefined;
export const referencesDirectory = fixtureRoot
  ? join(resolve(fixtureRoot), 'references')
  : join(repoRoot, 'explorations', 'references');
export const referenceFilesDirectory = join(referencesDirectory, 'files');
const indexPath = join(referencesDirectory, 'index.json');
const idPattern = /^ref-[a-z0-9-]{4,80}$/;
const filePattern = /^ref-[a-z0-9-]{4,80}-[a-f0-9]{8}\.(png|jpg)$/;

export interface ReferenceTeardown {
  neutralTemperature: string;
  contrast: string;
  accentUse: string;
  density: string;
  radiusFamily: string;
  typeContrast: string;
  depth: string;
  motion: string;
}

export interface ReferenceInput {
  title: string;
  sourceUrl?: string;
  tags: string[];
  boards: string[];
  notes: string;
  likes: string;
  dislikes: string;
  teardown: ReferenceTeardown;
}

export interface ReferenceRecord extends ReferenceInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  imageFile?: string;
  analysis?: ImageAnalysis;
}

export class ReferenceStoreError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const teardownFields = [
  'neutralTemperature',
  'contrast',
  'accentUse',
  'density',
  'radiusFamily',
  'typeContrast',
  'depth',
  'motion',
] as const;

function limitedString(value: unknown, label: string, max: number) {
  if (typeof value !== 'string' || value.length > max)
    throw new ReferenceStoreError(`${label} must be text under ${max} characters.`);
  return value.trim();
}

function stringList(value: unknown, label: string) {
  if (
    !Array.isArray(value) ||
    value.length > 30 ||
    value.some((item) => typeof item !== 'string' || !item.trim() || item.length > 60)
  )
    throw new ReferenceStoreError(`${label} must contain up to 30 short text entries.`);
  return [...new Set(value.map((item: string) => item.trim()))];
}

function sourceUrl(value: unknown) {
  if (value === undefined || value === '') return undefined;
  const text = limitedString(value, 'Source URL', 2048);
  try {
    const url = new URL(text);
    if (url.protocol === 'http:' || url.protocol === 'https:') return text;
  } catch {
    // Report one stable error for malformed and unsupported URLs.
  }
  throw new ReferenceStoreError('Enter an http or https source URL.');
}

export function parseReferenceInput(value: unknown): ReferenceInput {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ReferenceStoreError('Reference details must be a JSON object.');
  const input = value as Record<string, unknown>;
  const title = limitedString(input.title, 'Title', 160);
  if (!title) throw new ReferenceStoreError('Enter a reference title.');
  const teardown = input.teardown;
  if (!teardown || typeof teardown !== 'object' || Array.isArray(teardown))
    throw new ReferenceStoreError('Reference teardown must be an object.');
  const fields = teardown as Record<string, unknown>;
  const url = sourceUrl(input.sourceUrl);
  return {
    title,
    ...(url ? { sourceUrl: url } : {}),
    tags: stringList(input.tags, 'Tags'),
    boards: stringList(input.boards, 'Boards'),
    notes: limitedString(input.notes, 'Notes', 10_000),
    likes: limitedString(input.likes, 'What I like', 5_000),
    dislikes: limitedString(input.dislikes, "What I don't like", 5_000),
    teardown: Object.fromEntries(
      teardownFields.map((field) => [field, limitedString(fields[field], field, 2_000)]),
    ) as unknown as ReferenceTeardown,
  };
}

function assertId(id: string) {
  if (!idPattern.test(id)) throw new ReferenceStoreError('Invalid reference id.');
}

function assertImageFile(name: string, id: string) {
  if (!filePattern.test(name) || !name.startsWith(`${id}-`))
    throw new ReferenceStoreError('Invalid reference image filename.');
}

function parseRecord(value: unknown): ReferenceRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ReferenceStoreError('Reference index contains an invalid entry.');
  const entry = value as Record<string, unknown>;
  if (typeof entry.id !== 'string') throw new ReferenceStoreError('Reference id is missing.');
  assertId(entry.id);
  const input = parseReferenceInput(entry);
  if (typeof entry.createdAt !== 'string' || typeof entry.updatedAt !== 'string')
    throw new ReferenceStoreError(`Reference ${entry.id} is missing timestamps.`);
  if (entry.imageFile !== undefined) {
    if (typeof entry.imageFile !== 'string')
      throw new ReferenceStoreError(`Reference ${entry.id} has an invalid image filename.`);
    assertImageFile(entry.imageFile, entry.id);
  }
  return {
    ...input,
    id: entry.id,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    ...(entry.imageFile ? { imageFile: entry.imageFile } : {}),
    ...(entry.analysis ? { analysis: entry.analysis as ImageAnalysis } : {}),
  };
}

export async function listReferences(): Promise<ReferenceRecord[]> {
  let source: string;
  try {
    source = await readFile(indexPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new ReferenceStoreError('The reference index is not valid JSON.');
  }
  if (!Array.isArray(parsed)) throw new ReferenceStoreError('The reference index must be a list.');
  const records = parsed.map(parseRecord);
  if (new Set(records.map((record) => record.id)).size !== records.length)
    throw new ReferenceStoreError('The reference index contains duplicate ids.');
  return records;
}

export async function readReference(id: string): Promise<ReferenceRecord> {
  assertId(id);
  const record = (await listReferences()).find((entry) => entry.id === id);
  if (!record) throw new ReferenceStoreError(`Reference "${id}" was not found.`, 404);
  return record;
}

async function saveIndex(records: ReferenceRecord[]) {
  await mkdir(referencesDirectory, { recursive: true });
  const temporary = join(referencesDirectory, `.index-${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, `${JSON.stringify(records, null, 2)}\n`, { flag: 'wx' });
    await rename(temporary, indexPath);
  } finally {
    await unlink(temporary).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

async function ensureFilesDirectory() {
  await mkdir(referenceFilesDirectory, { recursive: true });
  const info = await lstat(referenceFilesDirectory);
  if (!info.isDirectory() || info.isSymbolicLink())
    throw new ReferenceStoreError('Reference image directory must be a regular directory.');
}

function imageFilename(id: string, mimeType: ImageMimeType) {
  return `${id}-${randomUUID().slice(0, 8)}.${mimeType === 'image/png' ? 'png' : 'jpg'}`;
}

async function saveImage(id: string, buffer: Buffer) {
  const analysis = await analyzeImage(buffer);
  const mimeType = imageMimeType(buffer);
  await ensureFilesDirectory();
  const imageFile = imageFilename(id, mimeType);
  await writeFile(join(referenceFilesDirectory, imageFile), buffer, { flag: 'wx' });
  return { imageFile, analysis };
}

let previousMutation: Promise<unknown> = Promise.resolve();
function serializeMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = previousMutation.then(operation, operation);
  previousMutation = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export async function createReference(value: unknown, image?: Buffer): Promise<ReferenceRecord> {
  const input = parseReferenceInput(value);
  if (!image && !input.sourceUrl) throw new ReferenceStoreError('Add an image or source URL.');
  return serializeMutation(async () => {
    const records = await listReferences();
    const id = `ref-${randomUUID()}`;
    const timestamp = new Date().toISOString();
    const savedImage = image ? await saveImage(id, image) : undefined;
    const record: ReferenceRecord = {
      ...input,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(savedImage ?? {}),
    };
    try {
      await saveIndex([...records, record]);
    } catch (error) {
      if (savedImage) await unlink(join(referenceFilesDirectory, savedImage.imageFile));
      throw error;
    }
    return record;
  });
}

export async function updateReference(
  id: string,
  value: unknown,
  image?: Buffer,
): Promise<ReferenceRecord> {
  assertId(id);
  const input = parseReferenceInput(value);
  return serializeMutation(async () => {
    const records = await listReferences();
    const index = records.findIndex((entry) => entry.id === id);
    if (index < 0) throw new ReferenceStoreError(`Reference "${id}" was not found.`, 404);
    const previous = records[index]!;
    if (!image && !previous.imageFile && !input.sourceUrl)
      throw new ReferenceStoreError('Keep an image or source URL.');
    const savedImage = image ? await saveImage(id, image) : undefined;
    const updated: ReferenceRecord = {
      ...input,
      id,
      createdAt: previous.createdAt,
      updatedAt: new Date().toISOString(),
      ...(savedImage ??
        (previous.imageFile ? { imageFile: previous.imageFile, analysis: previous.analysis } : {})),
    };
    records[index] = updated;
    try {
      await saveIndex(records);
    } catch (error) {
      if (savedImage) await unlink(join(referenceFilesDirectory, savedImage.imageFile));
      throw error;
    }
    if (savedImage && previous.imageFile)
      await unlink(join(referenceFilesDirectory, previous.imageFile)).catch(() => undefined);
    return updated;
  });
}

export async function deleteReference(id: string): Promise<void> {
  assertId(id);
  return serializeMutation(async () => {
    const records = await listReferences();
    const record = records.find((entry) => entry.id === id);
    if (!record) throw new ReferenceStoreError(`Reference "${id}" was not found.`, 404);
    const linked = await stylesReferencing(id);
    if (linked.length)
      throw new ReferenceStoreError(
        `Unlink this reference from ${linked.map((style) => style.name).join(', ')} before deleting it.`,
        409,
      );
    await saveIndex(records.filter((entry) => entry.id !== id));
    if (record.imageFile)
      await unlink(join(referenceFilesDirectory, record.imageFile)).catch(() => undefined);
  });
}

async function stylesReferencing(id: string) {
  const stylesDirectory = join(repoRoot, 'explorations', 'styles');
  let names: string[];
  try {
    names = (await readdir(stylesDirectory)).filter((name) => name.endsWith('.style.json'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  const styles = await Promise.all(
    names.map(async (name) => parseStyle(await readFile(join(stylesDirectory, name), 'utf8'))),
  );
  return styles.filter((style) => style.references?.includes(id));
}

export async function readReferenceImage(id: string) {
  const record = await readReference(id);
  if (!record.imageFile) throw new ReferenceStoreError('This reference has no local image.', 404);
  assertImageFile(record.imageFile, id);
  const path = join(referenceFilesDirectory, record.imageFile);
  try {
    const directory = await lstat(referenceFilesDirectory);
    if (!directory.isDirectory() || directory.isSymbolicLink())
      throw new ReferenceStoreError('Reference image directory must be a regular directory.');
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink())
      throw new ReferenceStoreError('Reference image must be a regular file.');
    return {
      buffer: await readFile(path),
      mimeType: record.imageFile.endsWith('.png') ? 'image/png' : 'image/jpeg',
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      throw new ReferenceStoreError('The local image is missing on this machine.', 404);
    throw error;
  }
}
