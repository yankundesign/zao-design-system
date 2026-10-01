import { lstat, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fontsDirectory } from './paths';

const fontNamePattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(woff2?|otf|ttf)$/i;
const mimeTypes: Record<string, string> = {
  woff: 'font/woff',
  woff2: 'font/woff2',
  otf: 'font/otf',
  ttf: 'font/ttf',
};

export async function listFontFiles() {
  try {
    const entries = await readdir(fontsDirectory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && fontNamePattern.test(entry.name))
      .map((entry) => ({ name: entry.name, url: `/api/fonts/${encodeURIComponent(entry.name)}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

export async function readFontFile(name: string) {
  if (!fontNamePattern.test(name) || name.includes('..')) return null;
  const path = join(fontsDirectory, name);
  try {
    const info = await lstat(path);
    if (!info.isFile()) return null;
    return {
      bytes: await readFile(path),
      mimeType: mimeTypes[name.split('.').at(-1)!.toLowerCase()]!,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
