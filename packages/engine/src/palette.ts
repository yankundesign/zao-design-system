/**
 * Generates 12-step OKLCH ramps for every finish from palette.config.ts and
 * writes them as DTCG tokens to src/palettes/<finish>.generated.tokens.json.
 *
 * Run with: pnpm palette
 */
import { converter, formatHex, toGamut, wcagContrast, type Oklch } from 'culori';
import type { FinishInput, RampInput } from './types.ts';

type Mode = 'light' | 'dark';
type RampName = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

// Lightness anchors per step. Step 9 (index 8) is replaced by the ramp's solid lightness.
export const LIGHTNESS: Record<'neutral' | 'color', Record<Mode, number[]>> = {
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
export const CHROMA: Record<'neutral' | 'color', number[]> = {
  neutral: [0.35, 0.45, 0.6, 0.7, 0.8, 0.9, 1, 1, 1, 1, 0.9, 0.75],
  color: [0.12, 0.2, 0.32, 0.42, 0.52, 0.62, 0.72, 0.86, 1, 1, 0.9, 0.5],
};

const toOklch = converter('oklch');
const mapToSrgb = toGamut('rgb', 'oklch');
const WHITE: Oklch = { mode: 'oklch', l: 1, c: 0, h: 0 };

const round = (n: number, digits: number) => Number(n.toFixed(digits));

function lightnessFor(name: RampName, input: RampInput, mode: Mode, contrast: number): number[] {
  const family = name === 'neutral' ? 'neutral' : 'color';
  const l = [...(input.lightness?.[mode] ?? LIGHTNESS[family][mode])];
  if (input.solid?.[mode] !== undefined) {
    const solid = input.solid[mode]!;
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
  const anchor = input.anchor ? toOklch(input.anchor) : undefined;
  const hueBase = anchor?.h ?? input.hue;
  const chromaBase = anchor?.c ?? input.chroma;
  const family = name === 'neutral' ? 'neutral' : 'color';
  return lightnessFor(name, input, mode, contrast).map((l, i) => {
    const chromaCurve = input.chromaCurve ?? CHROMA[family];
    const hue = (hueBase + (input.hueDrift ?? 0) * (i / 11) + 360) % 360;
    const wanted: Oklch = { mode: 'oklch', l, c: chromaBase * chromaCurve[i]!, h: hue };
    const mapped = toOklch(mapToSrgb(wanted));
    // Grays have no meaningful hue; keep them exactly achromatic.
    if (chromaBase === 0 || mapped.c < 0.0005) return { mode: 'oklch', l: mapped.l, c: 0, h: 0 };
    return { mode: 'oklch', l: mapped.l, c: mapped.c, h: mapped.h ?? hueBase };
  });
}

function rampWithPins(name: RampName, input: RampInput, mode: Mode, contrast: number): Oklch[] {
  const steps = ramp(name, input, mode, contrast);
  for (const [stepText, value] of Object.entries(input.pins?.[mode] ?? {})) {
    const step = Number(stepText);
    if (!Number.isInteger(step) || step < 1 || step > 12)
      throw new Error(`Invalid pinned step for ${name}: ${stepText}`);
    const parsed = toOklch(value);
    if (!parsed) throw new Error(`Invalid pinned color for ${name} step ${step}: ${value}`);
    steps[step - 1] = toOklch(mapToSrgb(parsed));
  }
  return steps;
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
  const names: string[] = [
    'neutral',
    'accent',
    'success',
    'warning',
    'danger',
    ...Object.keys(finish.extraRamps ?? {}),
  ];
  const inkLight = rampWithPins('neutral', finish.neutral, 'light', finish.contrast)[11]!;
  for (const name of names) {
    const byMode: Record<string, unknown> = {};
    for (const mode of ['light', 'dark'] as const) {
      const input =
        name in (finish.extraRamps ?? {}) ? finish.extraRamps![name]! : finish[name as RampName];
      const steps = rampWithPins(name as RampName, input, mode, finish.contrast);
      const group: Record<string, unknown> = {};
      steps.forEach((color, i) => {
        group[String(i + 1)] = token(color);
      });
      if (name !== 'neutral' && !name.startsWith('extra:')) {
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

export function generatePaletteDocuments(finishes: Record<string, FinishInput>) {
  const documents: Record<string, unknown> = {};
  const report: string[] = [];
  const warnings: string[] = [];
  for (const [id, finish] of Object.entries(finishes)) {
    const palette = buildFinish(finish);
    const doc = {
      $description: `Generated from palette.config.ts by scripts/generate-palettes.ts. Do not edit by hand; change the inputs and run \`pnpm palette\`.`,
      palette: { $type: 'color', ...palette },
    };
    documents[id] = doc;

    const names = [
      'neutral',
      'accent',
      'success',
      'warning',
      'danger',
      ...Object.keys(finish.extraRamps ?? {}),
    ];
    const inputFor = (name: string) =>
      name in (finish.extraRamps ?? {}) ? finish.extraRamps![name]! : finish[name as RampName];
    const inkLight = rampWithPins('neutral', finish.neutral, 'light', finish.contrast)[11]!;
    for (const mode of ['light', 'dark'] as const) {
      const ramps = Object.fromEntries(
        names.map((name) => [
          name,
          rampWithPins(name as RampName, inputFor(name), mode, finish.contrast),
        ]),
      ) as Record<string, Oklch[]>;
      const n = ramps.neutral!;
      const a = ramps.accent!;
      const bg = mode === 'light' ? n[1]! : n[0]!;
      report.push(
        `${id}-${mode}`.padEnd(9) +
          ` text ${wcagContrast(n[11]!, bg).toFixed(2)}` +
          `  muted ${wcagContrast(n[10]!, bg).toFixed(2)}` +
          `  accent-text ${wcagContrast(a[10]!, bg).toFixed(2)}` +
          `  on-accent ${wcagContrast(onSolid(a[8]!, inkLight), a[8]!).toFixed(2)}`,
      );
      const hasPins =
        names.some((name) => Object.keys(inputFor(name).pins?.[mode] ?? {}).length) ||
        Object.keys(finish.neutral.pins?.light ?? {}).length > 0;
      if (!hasPins) continue;
      for (const name of names) {
        const colors = ramps[name]!;
        for (const stepText of Object.keys(inputFor(name).pins?.[mode] ?? {})) {
          const step = Number(stepText);
          const color = colors[step - 1]!;
          const previous = colors[step - 2];
          const next = colors[step];
          const violatesOrder =
            mode === 'light'
              ? Boolean((previous && color.l > previous.l) || (next && color.l < next.l))
              : Boolean((previous && color.l < previous.l) || (next && color.l > next.l));
          if (violatesOrder)
            warnings.push(
              `${id}.${name}.${mode}.${step}: pinned color breaks the ramp's lightness order.`,
            );
        }
      }
      const surfaces = mode === 'light' ? [n[1]!, n[0]!] : [n[0]!, n[1]!];
      const textChecks: Array<[string, Oklch, number]> = [
        ['neutral.12', n[11]!, 7],
        ['neutral.11', n[10]!, 4.5],
        ...['accent', 'success', 'warning', 'danger'].map((name): [string, Oklch, number] => [
          `${name}.11`,
          ramps[name]![10]!,
          4.5,
        ]),
        ['focus accent.9', a[8]!, 3],
      ];
      for (const [label, color, minimum] of textChecks) {
        for (const [surfaceIndex, surface] of surfaces.entries()) {
          if (wcagContrast(color, surface) < minimum)
            warnings.push(
              `${id}.${mode} ${label} on ${surfaceIndex === 0 ? 'canvas' : 'surface'} falls below the ${minimum}:1 ${label.startsWith('focus') ? 'focus' : 'text'} contrast promise.`,
            );
        }
      }
      if (wcagContrast(onSolid(a[8]!, inkLight), a[8]!) < 4.5)
        warnings.push(`${id}.${mode} on-accent falls below the 4.5:1 contrast promise.`);
    }
  }
  return { documents, report, warnings };
}
