/**
 * Generates 12-step OKLCH ramps for every finish from palette.config.ts and
 * writes them as DTCG tokens to src/palettes/<finish>.generated.tokens.json.
 *
 * Run with: pnpm palette
 */
import { writeFile } from 'node:fs/promises';
import { converter, formatHex, toGamut, wcagContrast, type Oklch } from 'culori';
import { finishes, type FinishInput, type RampInput } from '../palette.config.ts';

type Mode = 'light' | 'dark';
type RampName = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

// Lightness anchors per step. Step 9 (index 8) is replaced by the ramp's solid lightness.
const LIGHTNESS: Record<'neutral' | 'color', Record<Mode, number[]>> = {
  neutral: {
    light: [0.994, 0.983, 0.963, 0.946, 0.929, 0.907, 0.873, 0.803, 0.625, 0.585, 0.505, 0.245],
    dark: [0.17, 0.198, 0.235, 0.262, 0.29, 0.325, 0.38, 0.465, 0.61, 0.655, 0.72, 0.948],
  },
  color: {
    light: [0.993, 0.98, 0.955, 0.93, 0.9, 0.865, 0.815, 0.745, 0.56, 0.52, 0.5, 0.3],
    dark: [0.175, 0.205, 0.26, 0.3, 0.34, 0.385, 0.445, 0.525, 0.62, 0.66, 0.8, 0.93],
  },
};

// Share of the ramp's peak chroma at each step.
const CHROMA: Record<'neutral' | 'color', number[]> = {
  neutral: [0.35, 0.45, 0.6, 0.7, 0.8, 0.9, 1, 1, 1, 1, 0.9, 0.75],
  color: [0.12, 0.2, 0.32, 0.42, 0.52, 0.62, 0.72, 0.86, 1, 1, 0.9, 0.5],
};

const toOklch = converter('oklch');
const mapToSrgb = toGamut('rgb', 'oklch');
const WHITE: Oklch = { mode: 'oklch', l: 1, c: 0, h: 0 };

const round = (n: number, digits: number) => Number(n.toFixed(digits));

function lightnessFor(name: RampName, input: RampInput, mode: Mode, contrast: number): number[] {
  const family = name === 'neutral' ? 'neutral' : 'color';
  const l = [...LIGHTNESS[family][mode]];
  if (input.solid) {
    const solid = input.solid[mode];
    l[8] = solid;
    // Hover moves away from the page: darker in light mode, lighter in dark mode.
    l[9] = mode === 'light' ? solid - 0.04 : Math.min(0.97, solid + 0.04);
  }
  // Contrast pushes the two text steps further from (or closer to) the background.
  const shift = (contrast - 0.5) * 0.1;
  if (mode === 'light') {
    l[10] = l[10]! - shift;
    l[11] = l[11]! - shift;
  } else {
    l[10] = l[10]! + shift;
    l[11] = Math.min(0.99, l[11]! + shift * 0.8);
  }
  return l;
}

function ramp(name: RampName, input: RampInput, mode: Mode, contrast: number): Oklch[] {
  const family = name === 'neutral' ? 'neutral' : 'color';
  return lightnessFor(name, input, mode, contrast).map((l, i) => {
    const wanted: Oklch = { mode: 'oklch', l, c: input.chroma * CHROMA[family][i]!, h: input.hue };
    const mapped = toOklch(mapToSrgb(wanted));
    return { mode: 'oklch', l: mapped.l, c: mapped.c, h: mapped.h ?? input.hue };
  });
}

function token(color: Oklch, description?: string) {
  return {
    $value: {
      colorSpace: 'oklch',
      components: [round(color.l, 4), round(color.c, 4), round(color.h ?? 0, 2)],
      hex: formatHex(color),
    },
    ...(description ? { $description: description } : {}),
  };
}

/** Pick white or the darkest neutral for text on the solid step, whichever reads better. */
function onSolid(solid: Oklch, ink: Oklch): Oklch {
  return wcagContrast(solid, WHITE) >= wcagContrast(solid, ink) ? WHITE : ink;
}

function buildFinish(finish: FinishInput) {
  const out: Record<string, unknown> = {};
  const names: RampName[] = ['neutral', 'accent', 'success', 'warning', 'danger'];
  const inkLight = ramp('neutral', finish.neutral, 'light', finish.contrast)[11]!;
  for (const name of names) {
    const byMode: Record<string, unknown> = {};
    for (const mode of ['light', 'dark'] as const) {
      const steps = ramp(name, finish[name], mode, finish.contrast);
      const group: Record<string, unknown> = {};
      steps.forEach((color, i) => {
        group[String(i + 1)] = token(color);
      });
      if (name !== 'neutral') {
        group.contrast = token(
          onSolid(steps[8]!, inkLight),
          'Text and icons on step 9. Chosen for the higher contrast of white or the darkest neutral.',
        );
      }
      byMode[mode] = group;
    }
    out[name] = byMode;
  }
  return out;
}

const report: string[] = [];
for (const [id, finish] of Object.entries(finishes)) {
  const palette = buildFinish(finish);
  const doc = {
    $description: `Generated from palette.config.ts by scripts/generate-palettes.ts. Do not edit by hand; change the inputs and run \`pnpm palette\`.`,
    palette: { $type: 'color', ...palette },
  };
  const file = new URL(`../src/palettes/${id}.generated.tokens.json`, import.meta.url);
  await writeFile(file, JSON.stringify(doc, null, 2) + '\n');

  for (const mode of ['light', 'dark'] as const) {
    const n = ramp('neutral', finish.neutral, mode, finish.contrast);
    const a = ramp('accent', finish.accent, mode, finish.contrast);
    const bg = mode === 'light' ? n[1]! : n[0]!;
    report.push(
      `${id}-${mode}`.padEnd(9) +
        ` text ${wcagContrast(n[11]!, bg).toFixed(2)}` +
        `  muted ${wcagContrast(n[10]!, bg).toFixed(2)}` +
        `  accent-text ${wcagContrast(a[10]!, bg).toFixed(2)}` +
        `  on-accent ${wcagContrast(onSolid(a[8]!, ramp('neutral', finish.neutral, 'light', finish.contrast)[11]!), a[8]!).toFixed(2)}`,
    );
  }
}
console.log('Palettes written. Contrast against the canvas:\n' + report.join('\n'));
