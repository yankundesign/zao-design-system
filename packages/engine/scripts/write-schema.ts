import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { styleSchema } from '../src/style.ts';

const output = new URL('../schema/style.schema.json', import.meta.url);
await mkdir(new URL('../schema/', import.meta.url), { recursive: true });
const config = await resolveConfig(fileURLToPath(output));
await writeFile(output, await format(JSON.stringify(styleSchema), { ...config, parser: 'json' }));
