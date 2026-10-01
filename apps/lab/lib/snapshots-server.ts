import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { repoRoot } from './paths.ts';

export const snapshotsDirectory = join(repoRoot, 'explorations', 'snapshots');
const specimensDirectory = join(repoRoot, 'apps', 'lab', 'specimens');
const stylesDirectory = join(repoRoot, 'explorations', 'styles');
const contexts = ['su-light', 'su-dark', 'yu-dark'] as const;
export type SnapshotContext = (typeof contexts)[number];
const styleIdPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;
const specimenIdPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;
const snapshotIdPattern = /^\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]{0,119}$/;
const maxCaptures = 120;

export interface SnapshotRequest {
  styles: string[];
  specimens: string[];
  contexts: SnapshotContext[];
  slug?: string;
}

export interface SnapshotImage {
  style: string;
  specimen: string;
  context: SnapshotContext;
  file: string;
  url: string;
}

export interface SnapshotManifest {
  id: string;
  private: boolean;
  createdAt: string;
  styles: string[];
  specimens: string[];
  contexts: SnapshotContext[];
  images: SnapshotImage[];
  contactSheetUrl: string;
}

export class SnapshotError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function distinctStrings(value: unknown, label: string, pattern: RegExp): string[] {
  if (
    !Array.isArray(value) ||
    !value.length ||
    value.some((entry) => typeof entry !== 'string' || !pattern.test(entry))
  ) {
    throw new SnapshotError(label + ' must be a non-empty list of valid ids.');
  }
  return [...new Set(value as string[])];
}

export function validateSnapshotRequest(value: unknown): SnapshotRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new SnapshotError('Snapshot request must be an object.');
  const input = value as Record<string, unknown>;
  const styles = distinctStrings(input.styles, 'Styles', styleIdPattern);
  const specimens = distinctStrings(input.specimens, 'Specimens', specimenIdPattern);
  const selectedContexts =
    input.contexts === 'all'
      ? [...contexts]
      : distinctStrings(input.contexts, 'Contexts', /^[a-z-]+$/);
  if (selectedContexts.some((context) => !contexts.includes(context as SnapshotContext)))
    throw new SnapshotError('Contexts must be su-light, su-dark or yu-dark.');
  if (styles.length * specimens.length * selectedContexts.length > maxCaptures)
    throw new SnapshotError('A snapshot job can contain at most 120 images.');
  if (
    input.slug !== undefined &&
    (typeof input.slug !== 'string' ||
      !input.slug.trim() ||
      input.slug.length > 80 ||
      /[\x00-\x1f]/.test(input.slug))
  )
    throw new SnapshotError('Capture name must be 1–80 characters on one line.');
  return {
    styles,
    specimens,
    contexts: selectedContexts as SnapshotContext[],
    ...(input.slug ? { slug: (input.slug as string).trim() } : {}),
  };
}

interface SpecimenSource {
  id: string;
  private: boolean;
}

async function discoverSpecimens(): Promise<SpecimenSource[]> {
  const found: SpecimenSource[] = [];
  const visit = async (directory: string) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(path);
      } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
        const source = await readFile(path, 'utf8');
        const meta = source.slice(source.indexOf('export const meta'));
        const id = meta.match(/\bid:\s*['"]([a-z0-9-]+)['"]/)?.[1];
        if (!id || !specimenIdPattern.test(id))
          throw new SnapshotError(
            'Could not read specimen id from ' + relative(repoRoot, path) + '.',
          );
        if (found.some((candidate) => candidate.id === id))
          throw new SnapshotError('Duplicate specimen id "' + id + '".');
        found.push({ id, private: relative(specimensDirectory, path).startsWith('local/') });
      }
    }
  };
  await visit(specimensDirectory);
  return found;
}

async function validateSelections(request: SnapshotRequest) {
  for (const id of request.styles) {
    if (id === 'su' || id === 'yu') continue;
    const path = join(stylesDirectory, id + '.style.json');
    try {
      const stat = await lstat(path);
      if (!stat.isFile()) throw new SnapshotError('Style "' + id + '" is not a regular file.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        throw new SnapshotError('Style "' + id + '" was not found.', 404);
      throw error;
    }
  }
  const knownSpecimens = await discoverSpecimens();
  for (const id of request.specimens) {
    if (!knownSpecimens.some((specimen) => specimen.id === id))
      throw new SnapshotError('Specimen "' + id + '" was not found.', 404);
  }
  return request.specimens.some(
    (id) => knownSpecimens.find((specimen) => specimen.id === id)?.private,
  );
}

function safeSlug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'styles'
  );
}

function imageUrl(file: string) {
  return '/api/snapshots/files/' + file.split('/').map(encodeURIComponent).join('/');
}

function htmlEscape(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character]!;
  });
}

const contactSheetTokens = JSON.parse(
  readFileSync(join(repoRoot, 'apps', 'lab', 'lib', 'frozen-shell-vars.json'), 'utf8'),
) as Record<string, string>;
const contactSheetVariableNames = [
  '--zao-color-bg-canvas',
  '--zao-color-bg-surface',
  '--zao-color-fg-default',
  '--zao-color-fg-muted',
  '--zao-color-border-subtle',
  '--zao-type-body-font-family',
  '--zao-space-3',
  '--zao-space-5',
  '--zao-space-6',
  '--zao-radius-surface',
];
const contactSheetVariables = contactSheetVariableNames
  .map((name) => `${name}:${contactSheetTokens[name]};`)
  .join('');

export function contactSheetHtml(manifest: SnapshotManifest) {
  const items = manifest.images
    .map(
      (image) =>
        '<figure><img loading="lazy" src="./' +
        htmlEscape(image.file.split('/').at(-1)!) +
        '" alt="' +
        htmlEscape(image.style + ' · ' + image.specimen + ' · ' + image.context) +
        '"><figcaption>' +
        htmlEscape(image.style + ' · ' + image.specimen + ' · ' + image.context) +
        '</figcaption></figure>',
    )
    .join('\n');
  return (
    '<!doctype html><html lang="en"><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>ZAO snapshot · ' +
    htmlEscape(manifest.id) +
    '</title><style>:root{' +
    contactSheetVariables +
    '}' +
    'body{margin:0;background:var(--zao-color-bg-canvas);color:var(--zao-color-fg-default);font-family:var(--zao-type-body-font-family)}' +
    'header{padding:var(--zao-space-6);max-width:90rem;margin:auto}h1{margin:0 0 var(--zao-space-3)}' +
    'p{margin:0;color:var(--zao-color-fg-muted)}.grid{max-width:90rem;margin:auto;padding:0 var(--zao-space-6) var(--zao-space-6);' +
    'display:grid;grid-template-columns:repeat(auto-fit,minmax(24rem,1fr));gap:var(--zao-space-5)}' +
    'figure{margin:0;background:var(--zao-color-bg-surface);border:1px solid var(--zao-color-border-subtle);border-radius:var(--zao-radius-surface);overflow:hidden}' +
    'img{display:block;width:100%;height:auto}figcaption{padding:var(--zao-space-3);border-top:1px solid var(--zao-color-border-subtle)}' +
    '</style><header><h1>ZAO snapshot</h1><p>' +
    htmlEscape(manifest.createdAt) +
    ' · ' +
    manifest.images.length +
    ' images</p></header><main class="grid">' +
    items +
    '</main></html>'
  );
}

async function makeOutputDirectory(request: SnapshotRequest, isPrivate: boolean) {
  const parent = join(snapshotsDirectory, ...(isPrivate ? ['private'] : []));
  await mkdir(parent, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const base = safeSlug(request.slug ?? request.styles.join('-'));
  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = randomUUID().slice(0, 6);
    const id = date + '-' + base + '-' + suffix;
    const directory = join(parent, id);
    try {
      await mkdir(directory);
      return { id, directory };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
  }
  throw new SnapshotError('Could not create a unique snapshot directory.', 500);
}

export async function createSnapshot(value: unknown, baseUrl = 'http://127.0.0.1:3001') {
  const request = validateSnapshotRequest(value);
  const isPrivate = await validateSelections(request);
  const { id, directory } = await makeOutputDirectory(request, isPrivate);
  const prefix = (isPrivate ? 'private/' : '') + id + '/';
  const manifest: SnapshotManifest = {
    id,
    private: isPrivate,
    createdAt: new Date().toISOString(),
    ...request,
    images: [],
    contactSheetUrl: imageUrl(prefix + 'contact-sheet.html'),
  };
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    try {
      browser = await chromium.launch({ headless: true });
    } catch (error) {
      throw new SnapshotError(
        'Could not launch Chromium. Run pnpm exec playwright install chromium, then retry. ' +
          (error instanceof Error ? error.message : ''),
        503,
      );
    }
    const context = await browser.newContext({
      viewport: { width: 1000, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    for (const style of request.styles) {
      for (const specimen of request.specimens) {
        for (const selectedContext of request.contexts) {
          const pathname =
            '/capture/' +
            encodeURIComponent(style) +
            '/' +
            encodeURIComponent(specimen) +
            '/' +
            encodeURIComponent(selectedContext);
          let ready = false;
          for (let attempt = 0; attempt < 2 && !ready; attempt++) {
            const response = await page.goto(new URL(pathname, baseUrl).toString(), {
              waitUntil: 'domcontentloaded',
              timeout: 30000,
            });
            if (!response?.ok())
              throw new SnapshotError(
                'Could not render ' + style + ' / ' + specimen + ' / ' + selectedContext + '.',
                502,
              );
            try {
              await page
                .locator('[data-capture-specimen-ready="true"]')
                .waitFor({ state: 'attached', timeout: 10000 });
              ready = true;
            } catch {
              if (attempt === 1)
                throw new SnapshotError(
                  'Specimen "' + specimen + '" did not finish loading in the snapshot preview.',
                  502,
                );
            }
          }
          await page
            .locator('[data-capture-ready="true"]')
            .waitFor({ state: 'attached', timeout: 30000 });
          await page.evaluate(async () => {
            await document.fonts.ready;
          });
          const rawPng = await page.locator('[data-lab-island="capture"]').screenshot({
            type: 'png',
            animations: 'disabled',
            timeout: 30000,
          });
          const optimizedPng = await sharp(rawPng)
            .png({ compressionLevel: 9, effort: 8, adaptiveFiltering: true })
            .toBuffer();
          const filename = style + '--' + specimen + '--' + selectedContext + '.png';
          await writeFile(
            join(directory, filename),
            optimizedPng.length < rawPng.length ? optimizedPng : rawPng,
          );
          const file = prefix + filename;
          manifest.images.push({
            style,
            specimen,
            context: selectedContext,
            file,
            url: imageUrl(file),
          });
        }
      }
    }
    await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    await writeFile(join(directory, 'contact-sheet.html'), contactSheetHtml(manifest));
    return manifest;
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  } finally {
    await browser?.close();
  }
}

async function readManifest(directory: string): Promise<SnapshotManifest> {
  const value: unknown = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
  const manifest = value as SnapshotManifest | null;
  if (
    !manifest ||
    typeof manifest !== 'object' ||
    Array.isArray(value) ||
    typeof manifest.id !== 'string' ||
    typeof manifest.private !== 'boolean' ||
    typeof manifest.createdAt !== 'string' ||
    !Array.isArray(manifest.styles) ||
    !manifest.styles.every((item) => typeof item === 'string') ||
    !Array.isArray(manifest.specimens) ||
    !manifest.specimens.every((item) => typeof item === 'string') ||
    !Array.isArray(manifest.contexts) ||
    !manifest.contexts.every((item) => contexts.includes(item)) ||
    !Array.isArray(manifest.images) ||
    !manifest.images.every(
      (item) =>
        item &&
        typeof item.style === 'string' &&
        typeof item.specimen === 'string' &&
        contexts.includes(item.context) &&
        typeof item.file === 'string' &&
        typeof item.url === 'string',
    ) ||
    typeof manifest.contactSheetUrl !== 'string'
  )
    throw new Error('Snapshot manifest is missing required fields.');
  return manifest;
}

export async function listSnapshotsWithErrors(directory = snapshotsDirectory): Promise<{
  snapshots: SnapshotManifest[];
  errors: { file: string; message: string }[];
}> {
  const manifests: SnapshotManifest[] = [];
  const errors: { file: string; message: string }[] = [];
  for (const privatePath of [false, true]) {
    const parent = join(directory, ...(privatePath ? ['private'] : []));
    let directories;
    try {
      directories = await readdir(parent, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw error;
    }
    for (const entry of directories) {
      if (!entry.isDirectory() || !snapshotIdPattern.test(entry.name)) continue;
      try {
        manifests.push(await readManifest(join(parent, entry.name)));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
          errors.push({
            file: `${privatePath ? 'private/' : ''}${entry.name}/manifest.json`,
            message: error instanceof Error ? error.message : 'Could not read snapshot manifest.',
          });
      }
    }
  }
  return {
    snapshots: manifests.sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    errors,
  };
}

export async function listSnapshots(): Promise<SnapshotManifest[]> {
  return (await listSnapshotsWithErrors()).snapshots;
}

export async function readSnapshotAsset(parts: string[]) {
  const privatePath = parts[0] === 'private';
  const names = privatePath ? parts.slice(1) : parts;
  if (names.length !== 2) return null;
  const [id, name] = names;
  if (
    !id ||
    !snapshotIdPattern.test(id) ||
    !name ||
    !/^(?:[a-z0-9-]+--[a-z0-9-]+--(?:su-light|su-dark|yu-dark)\.png|contact-sheet\.html)$/.test(
      name,
    )
  )
    return null;
  const path = join(snapshotsDirectory, ...(privatePath ? ['private'] : []), id, name);
  try {
    const stat = await lstat(path);
    if (!stat.isFile()) return null;
    return {
      bytes: await readFile(path),
      contentType: name.endsWith('.png') ? 'image/png' : 'text/html; charset=utf-8',
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
