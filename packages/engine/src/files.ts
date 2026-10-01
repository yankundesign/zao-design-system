import { readFile } from 'node:fs/promises';
import { parseStyle } from './style.ts';

export async function loadStyle(path: string | URL) {
  return parseStyle(await readFile(path, 'utf8'));
}
