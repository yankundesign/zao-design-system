/** File-based companion to the lab journal. Run with `pnpm lab:journal`. */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { baselineStyles, parseStyle } from '../packages/engine/src/index.ts';
import {
  createJournalEntry,
  listJournalEntriesWithErrors,
  validateJournalInput,
} from '../apps/lab/lib/journal-server.ts';
import { stylesDirectory } from '../apps/lab/lib/paths.ts';

function help() {
  console.log(`Commands:
  list [--style <id>] [--tag <tag>]
  write --title <title> --body-file <path> --styles <a,b>
        [--specimen <id>] [--context <su-light|su-dark|yu-dark>]
        [--snapshot <path>] [--tags <a,b>]

List prints entries in reverse chronological order and reports unreadable files.
Write creates one Markdown file in explorations/journal. The body comes from a
UTF-8 file. Snapshot paths are relative to explorations/snapshots, for example
2026-10-01-session/settings-su-light.png.`);
}

function parseOptions(args: string[]) {
  const flags: Record<string, string> = {};
  for (let index = 0; index < args.length; index++) {
    const flag = args[index]!;
    if (!flag.startsWith('--')) throw new Error(`Unexpected argument "${flag}".`);
    const key = flag.slice(2);
    const value = args[++index];
    if (!key || !value || value.startsWith('--') || key in flags)
      throw new Error(`Option --${key} needs one value and may appear only once.`);
    flags[key] = value;
  }
  return flags;
}

function onlyFlags(flags: Record<string, string>, allowed: string[]) {
  for (const flag of Object.keys(flags))
    if (!allowed.includes(flag)) throw new Error(`Unknown option --${flag}.`);
}

function required(flags: Record<string, string>, key: string) {
  const value = flags[key];
  if (!value) throw new Error(`Option --${key} is required.`);
  return value;
}

function commaList(value: string) {
  const items = value.split(',').map((item) => item.trim());
  if (items.some((item) => !item)) throw new Error('Comma lists need a value between commas.');
  return items;
}

async function assertSavedStyles(ids: string[]) {
  const baselineIds = new Set(Object.keys(baselineStyles()));
  for (const id of ids) {
    if (baselineIds.has(id)) continue;
    let source: string;
    try {
      source = await readFile(join(stylesDirectory, `${id}.style.json`), 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        throw new Error(`Style "${id}" was not found. Save it before writing a note.`);
      throw error;
    }
    if (parseStyle(source).id !== id)
      throw new Error(`Style file ${id}.style.json does not match its style id.`);
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === 'help' || command === '--help') return help();
  const flags = parseOptions(args);
  if (command === 'list') {
    onlyFlags(flags, ['style', 'tag']);
    console.log(
      JSON.stringify(
        await listJournalEntriesWithErrors({ style: flags.style, tag: flags.tag }),
        null,
        2,
      ),
    );
    return;
  }
  if (command === 'write') {
    onlyFlags(flags, ['title', 'body-file', 'styles', 'specimen', 'context', 'snapshot', 'tags']);
    const input = validateJournalInput({
      title: required(flags, 'title'),
      body: await readFile(required(flags, 'body-file'), 'utf8'),
      styles: commaList(required(flags, 'styles')),
      ...(flags.specimen ? { specimen: flags.specimen } : {}),
      ...(flags.context ? { context: flags.context } : {}),
      ...(flags.snapshot ? { snapshot: flags.snapshot } : {}),
      ...(flags.tags ? { tags: commaList(flags.tags) } : {}),
    });
    await assertSavedStyles(input.styles);
    console.log(JSON.stringify(await createJournalEntry(input), null, 2));
    return;
  }
  throw new Error(`Unknown command "${command}". Run pnpm lab:journal help for usage.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
