import { randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseDocument } from 'yaml';
import { repoRoot } from './paths.ts';

export const journalDirectory = join(repoRoot, 'explorations', 'journal');
const idPattern = /^[a-z0-9][a-z0-9-]{0,99}$/;
const attachmentPattern = /^(?:private\/)?[a-z0-9-]+\/[a-z0-9-]+\.png$/;
const contextIds = new Set(['su-light', 'su-dark', 'yu-dark']);

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  body: string;
  styles: string[];
  specimen?: string;
  context?: string;
  snapshot?: string;
  tags: string[];
}

export interface JournalInput {
  title: string;
  body: string;
  styles: string[];
  specimen?: string;
  context?: string;
  snapshot?: string;
  tags?: string[];
}

export interface JournalReadError {
  file: string;
  message: string;
}

export interface JournalReadResult {
  entries: JournalEntry[];
  errors: JournalReadError[];
}

type NormalizedJournalInput = Omit<JournalInput, 'tags'> & { tags: string[] };

function isId(value: unknown): value is string {
  return typeof value === 'string' && idPattern.test(value);
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

export function validateJournalInput(value: unknown): NormalizedJournalInput {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Journal entry must be an object.');
  const input = value as Record<string, unknown>;
  if (typeof input.title !== 'string' || !input.title.trim() || input.title.length > 160)
    throw new Error('Add a title of up to 160 characters.');
  if (typeof input.body !== 'string' || !input.body.trim())
    throw new Error('Write a note before saving it.');
  if (!isStringList(input.styles) || input.styles.some((id) => !isId(id)))
    throw new Error('Styles must be a list of style ids.');
  if (input.specimen !== undefined && !isId(input.specimen))
    throw new Error('Specimen must be a valid specimen id.');
  if (input.context !== undefined && !contextIds.has(String(input.context)))
    throw new Error('Choose su-light, su-dark or yu-dark.');
  if (
    input.snapshot !== undefined &&
    (typeof input.snapshot !== 'string' || !attachmentPattern.test(input.snapshot))
  )
    throw new Error('Snapshot must be a PNG path from explorations/snapshots.');
  if (
    input.tags !== undefined &&
    (!isStringList(input.tags) ||
      input.tags.some((tag) => !tag.trim() || tag.length > 60 || tag.includes('\n')))
  )
    throw new Error('Tags must be short non-empty strings.');
  return {
    title: input.title.trim(),
    body: input.body.trim(),
    styles: [...new Set(input.styles)],
    ...(input.specimen ? { specimen: input.specimen as string } : {}),
    ...(input.context ? { context: input.context as string } : {}),
    ...(input.snapshot ? { snapshot: input.snapshot as string } : {}),
    tags: [...new Set((input.tags as string[] | undefined) ?? [])],
  };
}

export function serializeJournal(entry: JournalEntry) {
  const fields: Record<string, unknown> = {
    id: entry.id,
    date: entry.date,
    title: entry.title,
    styles: entry.styles,
    ...(entry.specimen ? { specimen: entry.specimen } : {}),
    ...(entry.context ? { context: entry.context } : {}),
    ...(entry.snapshot ? { snapshot: entry.snapshot } : {}),
    tags: entry.tags,
  };
  const frontmatter = Object.entries(fields)
    .map(([key, value]) => key + ': ' + JSON.stringify(value))
    .join('\n');
  return '---\n' + frontmatter + '\n---\n\n' + entry.body.trim() + '\n';
}

export function parseJournal(source: string): JournalEntry {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n(?:\r?\n)?([\s\S]*)$/);
  if (!match) throw new Error('Journal entry needs YAML frontmatter between --- lines.');
  const document = parseDocument(match[1]!, { uniqueKeys: true, version: '1.2' });
  if (document.errors.length)
    throw new Error('Invalid journal frontmatter: ' + document.errors[0]!.message);
  const parsed: unknown = document.toJS({ maxAliasCount: 20 });
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('Journal frontmatter must be a YAML mapping.');
  const fields = parsed as Record<string, unknown>;
  if (
    !isId(fields.id) ||
    typeof fields.date !== 'string' ||
    !Number.isFinite(Date.parse(fields.date))
  )
    throw new Error('Journal entry needs a valid id and date.');
  const validated = validateJournalInput({ ...fields, body: match[2]!.trim() });
  return { id: fields.id, date: fields.date, ...validated };
}

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'note'
  );
}

export async function createJournalEntry(value: unknown): Promise<JournalEntry> {
  const input = validateJournalInput(value);
  const date = new Date().toISOString();
  const id = date.slice(0, 10) + '-' + slug(input.title) + '-' + randomUUID().slice(0, 8);
  const entry: JournalEntry = { id, date, ...input };
  await mkdir(journalDirectory, { recursive: true });
  await writeFile(join(journalDirectory, id + '.md'), serializeJournal(entry), { flag: 'wx' });
  return entry;
}

export async function listJournalEntriesWithErrors(
  filters: { style?: string; tag?: string } = {},
  directory = journalDirectory,
): Promise<JournalReadResult> {
  let names: string[];
  try {
    names = (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { entries: [], errors: [] };
    throw error;
  }
  const results = await Promise.allSettled(
    names.map(async (name) => {
      const path = join(directory, name);
      const stat = await lstat(path);
      if (!stat.isFile()) throw new Error(name + ' must be a regular journal file.');
      const entry = parseJournal(await readFile(path, 'utf8'));
      if (name !== entry.id + '.md') throw new Error(name + ' does not match its journal id.');
      return entry;
    }),
  );
  const entries: JournalEntry[] = [];
  const errors: JournalReadError[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      entries.push(result.value);
    } else {
      errors.push({
        file: names[index]!,
        message: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  });
  return {
    entries: entries
      .filter((entry) => !filters.style || entry.styles.includes(filters.style))
      .filter((entry) => !filters.tag || entry.tags.includes(filters.tag))
      .sort((left, right) => right.date.localeCompare(left.date)),
    errors,
  };
}

export async function listJournalEntries(filters: { style?: string; tag?: string } = {}) {
  const result = await listJournalEntriesWithErrors(filters);
  for (const error of result.errors) {
    console.error('Could not read journal file ' + error.file + ': ' + error.message);
  }
  return result.entries;
}
