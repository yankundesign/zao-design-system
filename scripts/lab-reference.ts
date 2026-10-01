/** File-based companion to the private reference board. Run with `pnpm lab:reference`. */
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  baselineStyles,
  parseStyle,
  validateStyle,
  type StyleFile,
} from '../packages/engine/src/index.ts';
import { MAX_IMAGE_BYTES, sampleImagePixel } from '../apps/lab/lib/image-analysis.ts';
import { makeReferenceSeedDraft } from '../apps/lab/lib/reference-seed.ts';
import {
  createReference,
  deleteReference,
  listReferences,
  readReference,
  readReferenceImage,
  updateReference,
  type ReferenceInput,
} from '../apps/lab/lib/references-server.ts';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));

const emptyTeardown = {
  neutralTemperature: '',
  contrast: '',
  accentUse: '',
  density: '',
  radiusFamily: '',
  typeContrast: '',
  depth: '',
  motion: '',
};

function help() {
  console.log(`Commands:
  help
  list [--tag <tag>] [--board <board>] [--query <text>]
  show <reference-id>
  sample <reference-id> <x> <y>
  add-url <url> <title> [--tags <a,b>] [--boards <a,b>] [--metadata <json-file>]
  add-file <image-path> <title> [--url <url>] [--tags <a,b>] [--boards <a,b>] [--metadata <json-file>]
  update <reference-id> <metadata.json> [--image <image-path>]
  delete <reference-id>
  seed <reference-id> <base-style-id> <draft-name> --mode <light|dark>
       --neutral <swatch-id|#hex> --neutral-step <1..12>
       --accent <swatch-id|#hex> --accent-step <1..12> [--author <name>]

Metadata JSON uses the board's title, sourceUrl, tags, boards, notes, likes,
dislikes and teardown fields. The show command prints a record you can edit
and pass to update; generated id, dates, image and analysis fields are ignored.
Seed prints an unsaved style draft. It does not save or promote a style.
The default CLI author is agent:lab-reference-cli; use --author yankun when
Yankun creates the draft himself. PNG and JPG files are copied to the ignored
local reference image directory; source URLs are stored as links only.`);
}

function parseOptions(args: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (let index = 0; index < args.length; index++) {
    const argument = args[index]!;
    if (!argument.startsWith('--')) {
      positional.push(argument);
      continue;
    }
    const key = argument.slice(2);
    const value = args[++index];
    if (!key || !value || value.startsWith('--') || key in flags)
      throw new Error(`Option --${key} needs one value and may appear only once.`);
    flags[key] = value;
  }
  return { positional, flags };
}

function onlyFlags(flags: Record<string, string>, allowed: string[]) {
  for (const flag of Object.keys(flags))
    if (!allowed.includes(flag)) throw new Error(`Unknown option --${flag}.`);
}

function commaList(value: string | undefined) {
  return value
    ? [
        ...new Set(
          value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ]
    : undefined;
}

async function metadataFile(path: string | undefined): Promise<Partial<ReferenceInput>> {
  if (!path) return {};
  let value: unknown;
  try {
    value = JSON.parse(await readFile(path, 'utf8'));
  } catch {
    throw new Error(`Could not read metadata JSON from ${path}.`);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Metadata file must contain a JSON object.');
  return value as Partial<ReferenceInput>;
}

async function imageFile(path: string) {
  const info = await stat(path);
  if (!info.isFile()) throw new Error('Choose a regular PNG or JPG file.');
  if (info.size > MAX_IMAGE_BYTES) throw new Error('Choose an image under 16 MB.');
  return readFile(path);
}

async function listStyles() {
  const directory = join(repoRoot, 'explorations', 'styles');
  let names: string[];
  try {
    names = (await readdir(directory)).filter((name) => name.endsWith('.style.json'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  return Promise.all(
    names.map(async (name) => parseStyle(await readFile(join(directory, name), 'utf8'))),
  );
}

async function addInput(
  title: string,
  flags: Record<string, string>,
  sourceUrl?: string,
): Promise<ReferenceInput> {
  const metadata = await metadataFile(flags.metadata);
  return {
    title,
    ...(sourceUrl || metadata.sourceUrl ? { sourceUrl: sourceUrl ?? metadata.sourceUrl } : {}),
    tags: commaList(flags.tags) ?? metadata.tags ?? [],
    boards: commaList(flags.boards) ?? metadata.boards ?? [],
    notes: metadata.notes ?? '',
    likes: metadata.likes ?? '',
    dislikes: metadata.dislikes ?? '',
    teardown: { ...emptyTeardown, ...metadata.teardown },
  };
}

function required(flags: Record<string, string>, name: string) {
  const value = flags[name];
  if (!value) throw new Error(`Option --${name} is required.`);
  return value;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === 'help') return help();
  const { positional, flags } = parseOptions(args);
  if (command === 'list') {
    onlyFlags(flags, ['tag', 'board', 'query']);
    if (positional.length) throw new Error('Usage: list [--tag T] [--board B] [--query Q]');
    const query = flags.query?.toLowerCase();
    const references = (await listReferences()).filter(
      (reference) =>
        (!flags.tag || reference.tags.includes(flags.tag)) &&
        (!flags.board || reference.boards.includes(flags.board)) &&
        (!query ||
          [
            reference.title,
            reference.notes,
            reference.sourceUrl ?? '',
            ...reference.tags,
            ...reference.boards,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)),
    );
    console.log(JSON.stringify(references, null, 2));
    return;
  }
  if (command === 'show') {
    onlyFlags(flags, []);
    if (positional.length !== 1) throw new Error('Usage: show <reference-id>');
    console.log(JSON.stringify(await readReference(positional[0]!), null, 2));
    return;
  }
  if (command === 'sample') {
    onlyFlags(flags, []);
    if (positional.length !== 3) throw new Error('Usage: sample <reference-id> <x> <y>');
    const { buffer } = await readReferenceImage(positional[0]!);
    console.log(
      JSON.stringify(
        await sampleImagePixel(buffer, Number(positional[1]), Number(positional[2])),
        null,
        2,
      ),
    );
    return;
  }
  if (command === 'add-url') {
    onlyFlags(flags, ['tags', 'boards', 'metadata']);
    if (positional.length !== 2) throw new Error('Usage: add-url <url> <title>');
    const input = await addInput(positional[1]!, flags, positional[0]!);
    console.log(JSON.stringify(await createReference(input), null, 2));
    return;
  }
  if (command === 'add-file') {
    onlyFlags(flags, ['url', 'tags', 'boards', 'metadata']);
    if (positional.length !== 2) throw new Error('Usage: add-file <image-path> <title>');
    const input = await addInput(positional[1]!, flags, flags.url);
    console.log(
      JSON.stringify(await createReference(input, await imageFile(positional[0]!)), null, 2),
    );
    return;
  }
  if (command === 'update') {
    onlyFlags(flags, ['image']);
    if (positional.length !== 2) throw new Error('Usage: update <reference-id> <metadata.json>');
    const metadata = await metadataFile(positional[1]!);
    const image = flags.image ? await imageFile(flags.image) : undefined;
    console.log(JSON.stringify(await updateReference(positional[0]!, metadata, image), null, 2));
    return;
  }
  if (command === 'delete') {
    onlyFlags(flags, []);
    if (positional.length !== 1) throw new Error('Usage: delete <reference-id>');
    await deleteReference(positional[0]!);
    console.log(`Deleted ${positional[0]}.`);
    return;
  }
  if (command === 'seed') {
    onlyFlags(flags, ['mode', 'neutral', 'neutral-step', 'accent', 'accent-step', 'author']);
    if (positional.length !== 3)
      throw new Error('Usage: seed <reference-id> <base-style-id> <draft-name> --mode …');
    const [referenceId, baseId, name] = positional as [string, string, string];
    const reference = await readReference(referenceId);
    const savedStyles = await listStyles();
    const roots = baselineStyles();
    const currentStyle =
      savedStyles.find((style) => style.id === baseId) ?? roots[baseId as 'su' | 'yu'];
    if (!currentStyle) throw new Error(`Base style "${baseId}" was not found.`);
    const mode = required(flags, 'mode');
    if (mode !== 'light' && mode !== 'dark') throw new Error('Mode must be light or dark.');
    const color = (flag: string) => {
      const chosen = required(flags, flag);
      if (/^#[0-9a-f]{6}$/i.test(chosen)) return chosen;
      const swatch = reference.analysis?.swatches.find((entry) => entry.id === chosen);
      if (!swatch) throw new Error(`Swatch "${chosen}" was not found on ${referenceId}.`);
      return swatch.hex;
    };
    const draft: StyleFile = {
      ...makeReferenceSeedDraft({
        referenceId,
        referenceTitle: reference.title,
        name,
        currentStyle,
        savedStyles,
        mode,
        neutralStep: Number(required(flags, 'neutral-step')),
        accentStep: Number(required(flags, 'accent-step')),
        neutralHex: color('neutral'),
        accentHex: color('accent'),
      }),
      author: flags.author ?? 'agent:lab-reference-cli',
    };
    validateStyle(draft);
    console.log(JSON.stringify(draft, null, 2));
    return;
  }
  throw new Error(`Unknown command "${command}". Run help for usage.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
