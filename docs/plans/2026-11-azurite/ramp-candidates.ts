// Generates candidate azurite ramps with the real palette generator, without writing tokens.
// Prints each candidate's seal roles and contrast, and writes ramp-candidates.json for the
// option sheet (study.mjs injects them as --zao-color-seal-azurite-* on the page).
//
// Usage: node docs/plans/2026-11-azurite/ramp-candidates.ts
import { writeFileSync } from 'node:fs';
import { wcagContrast } from '../../../packages/engine/node_modules/culori/src/index.js';
import { generatePaletteDocuments } from '../../../packages/engine/src/palette.ts';
import { finishes } from '../../../packages/tokens/palette.config.ts';

type Step = { $value: { hex: string; components: number[] } };
type Ramp = Record<'light' | 'dark', Record<string, Step>>;

export const candidates = {
  today: { hue: 261, chroma: 0.1, solid: { light: 0.42, dark: 0.75 } },
  mineral: { hue: 259, chroma: 0.13, solid: { light: 0.4, dark: 0.72 } },
  vivid: { hue: 259, chroma: 0.16, solid: { light: 0.4, dark: 0.72 } },
  deep: { hue: 259, chroma: 0.13, solid: { light: 0.4, dark: 0.52 } },
  qing: { hue: 245, chroma: 0.12, solid: { light: 0.42, dark: 0.74 } },
};

/** The mode files' mapping from seal roles to ramp steps. */
const roles = {
  solid: '9',
  'solid-hover': '10',
  subtle: '3',
  'subtle-hover': '4',
  border: '10',
  text: '11',
  on: 'contrast',
};

const out: Record<string, Record<string, Record<string, string>>> = {};
for (const [name, input] of Object.entries(candidates)) {
  const { documents } = generatePaletteDocuments({
    su: { ...finishes.su, extraRamps: { azurite: input } },
  });
  const palette = (documents.su as { palette: Record<string, Ramp> }).palette;
  out[name] = {};
  console.log(`\n${name}  hue ${input.hue}  chroma ${input.chroma}`);
  for (const mode of ['light', 'dark'] as const) {
    const ramp = palette.azurite![mode];
    const neutral = palette.neutral![mode];
    const canvas = neutral[mode === 'light' ? '2' : '2']!.$value.hex;
    const surface = neutral[mode === 'light' ? '1' : '3']!.$value.hex;
    const seal = Object.fromEntries(
      Object.entries(roles).map(([role, step]) => [role, ramp[step]!.$value.hex]),
    );
    out[name]![mode] = seal;
    const ratio = (a: string, b: string) => wcagContrast(a, b).toFixed(2);
    console.log(
      `  ${mode.padEnd(5)} solid ${seal.solid} hover ${seal['solid-hover']} subtle ${seal.subtle}/${seal['subtle-hover']} text ${seal.text} on ${seal.on}`,
    );
    console.log(
      `        solid:canvas ${ratio(seal.solid!, canvas)}  solid:surface ${ratio(seal.solid!, surface)}  on:solid ${ratio(seal.on!, seal.solid!)}  on:hover ${ratio(seal.on!, seal['solid-hover']!)}  text:canvas ${ratio(seal.text!, canvas)}  text:surface ${ratio(seal.text!, surface)}  text:subtle ${ratio(seal.text!, seal.subtle!)}`,
    );
  }
}
writeFileSync(
  new URL('./ramp-candidates.json', import.meta.url),
  JSON.stringify(out, null, 2) + '\n',
);
