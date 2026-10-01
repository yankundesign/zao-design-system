/** Thin CLI wrapper around the palette implementation in @zao/engine. */
import { mkdir, writeFile } from 'node:fs/promises';
import { generatePaletteDocuments } from '@zao/engine/palette';
import { finishes } from '../palette.config.ts';

const output = new URL('../src/palettes/', import.meta.url);
const { documents, report, warnings } = generatePaletteDocuments(finishes);
await mkdir(output, { recursive: true });
for (const [finish, document] of Object.entries(documents)) {
  await writeFile(
    new URL(`${finish}.generated.tokens.json`, output),
    JSON.stringify(document, null, 2) + '\n',
  );
}
console.log('Palettes written. Contrast against the canvas:\n' + report.join('\n'));
for (const warning of warnings) console.warn(`Warning: ${warning}`);
