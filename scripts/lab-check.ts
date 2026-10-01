/** Validate the committed style library without changing any files. */
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  baselineStyles,
  resolveStyle,
  styleSchema,
  validateStyle,
  type StyleFile,
} from '../packages/engine/src/index.ts';
import { listReferences } from '../apps/lab/lib/references-server.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const stylesDirectory = join(root, 'explorations/styles');
const schemaPath = join(root, 'packages/engine/schema/style.schema.json');
const styleIdPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;

function reason(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function main() {
  const errors: string[] = [];
  let referenceIds = new Set<string>();
  try {
    referenceIds = new Set((await listReferences()).map((reference) => reference.id));
  } catch (error) {
    errors.push(`explorations/references/index.json: ${reason(error)}`);
  }
  try {
    const generatedSchema: unknown = JSON.parse(await readFile(schemaPath, 'utf8'));
    if (JSON.stringify(generatedSchema) !== JSON.stringify(styleSchema)) {
      errors.push(
        `${relative(root, schemaPath)}: generated schema is out of date; run pnpm --filter @zao/engine schema.`,
      );
    }
  } catch (error) {
    errors.push(`${relative(root, schemaPath)}: ${reason(error)}`);
  }

  let files: string[] = [];
  try {
    files = (await readdir(stylesDirectory, { withFileTypes: true }))
      .filter((entry) => entry.name.endsWith('.style.json'))
      .map((entry) => {
        if (!entry.isFile()) {
          errors.push(`${relative(root, join(stylesDirectory, entry.name))}: not a regular file.`);
          return null;
        }
        return entry.name;
      })
      .filter((name): name is string => name !== null)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
      errors.push(`${relative(root, stylesDirectory)}: ${reason(error)}`);
  }

  const styles: Record<string, StyleFile> = {};
  for (const file of files) {
    const path = join(stylesDirectory, file);
    const label = relative(root, path);
    try {
      const value: unknown = JSON.parse(await readFile(path, 'utf8'));
      validateStyle(value);
      const style = value as StyleFile;
      const filenameId = file.slice(0, -'.style.json'.length);
      if (!styleIdPattern.test(filenameId) || filenameId === 'su' || filenameId === 'yu') {
        throw new Error(
          'Style filename must use a lowercase id of up to 80 letters, numbers or hyphens, excluding su and yu.',
        );
      }
      if (style.id !== filenameId)
        throw new Error(`Style id "${style.id}" must match filename id "${filenameId}".`);
      styles[style.id] = style;
    } catch (error) {
      errors.push(`${label}: ${reason(error)}`);
    }
  }

  const library = { ...baselineStyles(), ...styles };
  for (const [id, style] of Object.entries(styles)) {
    for (const referenceId of style.references ?? [])
      if (!referenceIds.has(referenceId))
        errors.push(
          `${relative(root, join(stylesDirectory, `${id}.style.json`))}: reference "${referenceId}" was not found.`,
        );
    try {
      resolveStyle(style, library);
    } catch (error) {
      errors.push(`${relative(root, join(stylesDirectory, `${id}.style.json`))}: ${reason(error)}`);
    }
  }

  if (errors.length) {
    for (const error of errors) console.error(`✗ ${error}`);
    console.error(`Found ${errors.length} validation error${errors.length === 1 ? '' : 's'}.`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `Validated ${Object.keys(styles).length} style${Object.keys(styles).length === 1 ? '' : 's'} and the generated schema.`,
  );
}

main().catch((error: unknown) => {
  console.error(`Could not check styles: ${reason(error)}`);
  process.exitCode = 1;
});
