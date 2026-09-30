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
}

const status = {
  success: { hue: 150, chroma: 0.15, solid: { light: 0.56, dark: 0.62 } },
  warning: { hue: 75, chroma: 0.16, solid: { light: 0.8, dark: 0.8 } },
  danger: { hue: 27, chroma: 0.2, solid: { light: 0.58, dark: 0.64 } },
} satisfies Record<string, RampInput>;

export const finishes: Record<'su' | 'yu', FinishInput> = {
  su: {
    // Cool, nearly colorless neutrals with an ink-blue accent.
    neutral: { hue: 265, chroma: 0.012 },
    accent: { hue: 272, chroma: 0.19, solid: { light: 0.52, dark: 0.54 } },
    ...status,
    contrast: 0.5,
  },
  yu: {
    // Ink-jade neutrals and a jade accent, after the blue-green of 碾玉装.
    neutral: { hue: 172, chroma: 0.028 },
    accent: { hue: 165, chroma: 0.12, solid: { light: 0.5, dark: 0.82 } },
    ...status,
    contrast: 0.5,
  },
};
