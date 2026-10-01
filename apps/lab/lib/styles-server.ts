import { randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseStyle, validateStyle, type StyleFile } from '@zao/engine';
import { stylesDirectory } from './paths';
import { listReferences } from './references-server';

const styleIdPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;

export class StyleStoreError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export function assertStyleId(id: string) {
  if (!styleIdPattern.test(id) || id === 'su' || id === 'yu') {
    throw new StyleStoreError('Use a lowercase style id with letters, numbers or hyphens.', 400);
  }
}

function stylePath(id: string) {
  assertStyleId(id);
  return join(stylesDirectory, `${id}.style.json`);
}

export async function listStyleFiles(): Promise<StyleFile[]> {
  let entries;
  try {
    entries = await readdir(stylesDirectory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  const names = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.style.json'))
    .map((entry) => entry.name)
    .sort();
  return Promise.all(
    names.map(async (name) => {
      const id = name.slice(0, -'.style.json'.length);
      assertStyleId(id);
      const style = parseStyle(await readFile(stylePath(id), 'utf8'));
      if (style.id !== id) {
        throw new StyleStoreError(`${name} must use "${id}" as its style id.`, 400);
      }
      return style;
    }),
  );
}

export async function readStyleFile(id: string): Promise<StyleFile> {
  const path = stylePath(id);
  try {
    const info = await lstat(path);
    if (!info.isFile()) throw new StyleStoreError('Style file must be a regular file.', 400);
    const style = parseStyle(await readFile(path, 'utf8'));
    if (style.id !== id)
      throw new StyleStoreError('The style id does not match its filename.', 400);
    return style;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new StyleStoreError(`Style "${id}" was not found.`, 404);
    }
    throw error;
  }
}

export async function writeStyleFile(value: unknown, createOnly: boolean): Promise<StyleFile> {
  validateStyle(value);
  const style = value as StyleFile;
  if (style.references?.length) {
    const ids = new Set((await listReferences()).map((reference) => reference.id));
    const missing = style.references.find((id) => !ids.has(id));
    if (missing)
      throw new StyleStoreError(
        `Reference "${missing}" was not found. Remove the link or restore the reference before saving.`,
        400,
      );
  }
  const path = stylePath(style.id);
  const existing = await listStyleFiles();
  if (!createOnly && !existing.some((entry) => entry.id === style.id))
    throw new StyleStoreError(`Style "${style.id}" was not found.`, 404);
  const byId = new Map(existing.map((entry) => [entry.id, entry]));
  let parentId = style.extends;
  const visited = new Set([style.id]);
  while (parentId !== 'su' && parentId !== 'yu') {
    if (visited.has(parentId)) throw new StyleStoreError('Style inheritance has a cycle.', 400);
    visited.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) throw new StyleStoreError(`Parent style "${parentId}" was not found.`, 400);
    parentId = parent.extends;
  }
  await mkdir(stylesDirectory, { recursive: true });
  const source = `${JSON.stringify(style, null, 2)}\n`;
  if (createOnly) {
    try {
      await writeFile(path, source, { flag: 'wx' });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new StyleStoreError(`Style "${style.id}" already exists.`, 409);
      }
      throw error;
    }
  } else {
    const temporary = join(stylesDirectory, `.${style.id}-${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, source, { flag: 'wx' });
      await rename(temporary, path);
    } finally {
      await unlink(temporary).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }
  return style;
}

export async function deleteStyleFile(id: string) {
  const path = stylePath(id);
  await readStyleFile(id);
  const child = (await listStyleFiles()).find((style) => style.extends === id);
  if (child)
    throw new StyleStoreError(`Delete "${child.name}" first; it inherits from "${id}".`, 409);
  await unlink(path);
}
