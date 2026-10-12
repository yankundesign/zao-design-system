/**
 * Palette inputs for each finish.
 *
 * Themes are generated, not hand-picked: each ramp comes from a hue, a chroma and
 * a few lightness anchors, in OKLCH. Change a number here, run `pnpm palette`,
 * and the 12-step ramps for light and dark are regenerated and gamut-mapped to sRGB.
 *
 * Ramp steps follow a fixed job per step, so modes can map roles to steps:
 *   1–2  backgrounds        3–5  component fills (rest, hover, active)
 *   6–8  borders            9–10 solid fills (rest, hover)
 *   11   secondary text     12   primary text
 */

export interface RampInput {
  /** OKLCH hue, 0–360 */
  hue: number;
  /** Peak OKLCH chroma. Neutrals stay low (under 0.03); accents go higher. */
  chroma: number;
  /** Lightness of step 9 (the solid fill) in each mode. Defaults to the neutral curve. */
  solid?: { light: number; dark: number };
  /** Lightness anchors for all 12 steps, per mode. Defaults to the family curve. */
  lightness?: { light: number[]; dark: number[] };
  /** Share of the peak chroma at each step. Defaults to the family curve. */
  chromaCurve?: number[];
}

export interface FinishInput {
  neutral: RampInput;
  accent: RampInput;
  success: RampInput;
  warning: RampInput;
  danger: RampInput;
  /**
   * 0 to 1. How far text steps (11 and 12) sit from the background.
   * 0.5 is the default; higher is crisper, lower is softer.
   */
  contrast: number;
  /** Additional ramps, such as a second seal. Each gets a `contrast` step for text on step 9. */
  extraRamps?: Record<string, RampInput>;
}

/** Warm ink: a small hue toward raw timber and paper, with a very low chroma. */
const warmInk = { hue: 82, chroma: 0.015 } satisfies RampInput;

/** Paper: the generator's default light neutral curve, repeated so the ink seal shares it. */
const paperLight = [
  0.994, 0.983, 0.963, 0.946, 0.929, 0.907, 0.873, 0.803, 0.625, 0.585, 0.505, 0.245,
];

/** The generator's default neutral chroma shares, so the ink seal matches the neutrals. */
const neutralChroma = [0.35, 0.45, 0.6, 0.7, 0.8, 0.9, 1, 1, 1, 1, 0.9, 0.75];

/** Ink stone: the dark neutral curve, lowered at the background end only. */
const inkStoneDark = [
  0.145, 0.178, 0.222, 0.255, 0.285, 0.325, 0.38, 0.465, 0.61, 0.655, 0.72, 0.948,
];

const status = {
  success: { hue: 150, chroma: 0.15, solid: { light: 0.56, dark: 0.62 } },
  warning: { hue: 75, chroma: 0.16, solid: { light: 0.8, dark: 0.8 } },
  danger: { hue: 27, chroma: 0.2, solid: { light: 0.58, dark: 0.64 } },
} satisfies Record<string, RampInput>;

export const finishes: Record<'su' | 'yu', FinishInput> = {
  su: {
    // Warm ink 五墨 (V1b, Oct 11): paper in light mode, ink stone in dark mode.
    // Dark anchors sit a little lower so the recessed well (step 1) is darker than the
    // canvas (step 2) and the surface (step 3), as the stepped construction needs.
    neutral: { ...warmInk, lightness: { light: paperLight, dark: inkStoneDark } },
    // The ink seal 墨 (V1, Oct 11) is the default accent: full-strength ink on the neutral
    // curve, so its fills and borders match the neutrals exactly.
    accent: {
      ...warmInk,
      lightness: { light: paperLight, dark: inkStoneDark },
      chromaCurve: neutralChroma,
      solid: { light: paperLight[11]!, dark: inkStoneDark[11]! },
    },
    ...status,
    contrast: 0.5,
    // The azurite seal 青 (V1, Oct 11): the mineral blue of 碾玉装. Opt in with
    // data-zao-seal="azurite"; the mode files map it to color.seal.azurite.*.
    extraRamps: {
      azurite: { hue: 261, chroma: 0.1, solid: { light: 0.42, dark: 0.75 } },
    },
  },
  yu: {
    // Pure gray for now: no hue in the neutrals or the accent until Yu's colors are chosen.
    neutral: { hue: 0, chroma: 0 },
    accent: { hue: 0, chroma: 0, solid: { light: 0.5, dark: 0.82 } },
    ...status,
    contrast: 0.5,
    // Completeness entry so every finish ships the same seal tokens; not Yu design work.
    extraRamps: {
      azurite: { hue: 261, chroma: 0.1, solid: { light: 0.42, dark: 0.75 } },
    },
  },
};
