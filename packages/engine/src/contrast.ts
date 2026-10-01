import { parse, wcagContrast } from 'culori';

export const contrastPromises = {
  surfaces: ['color.bg.canvas', 'color.bg.surface'],
  text: { 'color.fg.default': 7, 'color.fg.muted': 4.5 },
  semanticText: {
    'color.accent.text': 4.5,
    'color.success.text': 4.5,
    'color.warning.text': 4.5,
    'color.danger.text': 4.5,
  },
  focus: { token: 'color.focus.ring', minimum: 3 },
  onAccent: { foreground: 'color.fg.on-accent', background: 'color.accent.solid', minimum: 4.5 },
} as const;

export const contrastCases = [
  ...Object.entries(contrastPromises.text),
  ...Object.entries(contrastPromises.semanticText),
  [contrastPromises.focus.token, contrastPromises.focus.minimum],
] as const;

export interface ContrastResult {
  label: string;
  ratio: number;
  minimum: number;
  pass: boolean;
}

/** The same token pairs and minimums checked by the token tests, for live previews. */
export function evaluateContrast(variables: Record<string, string>): ContrastResult[] {
  const results: ContrastResult[] = [];
  const check = (foreground: string, background: string, minimum: number) => {
    const fg = parse(variables[`--zao-${foreground.replaceAll('.', '-')}`] ?? '');
    const bg = parse(variables[`--zao-${background.replaceAll('.', '-')}`] ?? '');
    const ratio = fg && bg ? wcagContrast(fg, bg) : 0;
    results.push({
      label: `${foreground} on ${background}`,
      ratio,
      minimum,
      pass: ratio >= minimum,
    });
  };
  for (const [foreground, minimum] of contrastCases)
    for (const background of contrastPromises.surfaces) check(foreground, background, minimum);
  check(
    contrastPromises.onAccent.foreground,
    contrastPromises.onAccent.background,
    contrastPromises.onAccent.minimum,
  );
  return results;
}
