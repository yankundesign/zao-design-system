import { describe, expect, it } from 'vitest';
import { generatePaletteDocuments } from '../src/palette.ts';
import type { FinishInput } from '../src/types.ts';

const finish = (): FinishInput => ({
  neutral: { hue: 0, chroma: 0 },
  accent: { hue: 0, chroma: 0, solid: { light: 0.52, dark: 0.54 } },
  success: { hue: 150, chroma: 0.15 },
  warning: { hue: 75, chroma: 0.16 },
  danger: { hue: 27, chroma: 0.2 },
  contrast: 0.5,
});

describe('extended palette generation', () => {
  it('supports curves, hue drift, anchor colors, exact pins and extra ramps', () => {
    const input = finish();
    input.neutral.anchor = '#6a4c93';
    input.neutral.hueDrift = 20;
    input.neutral.lightness = {
      light: [0.99, 0.97, 0.95, 0.93, 0.91, 0.89, 0.86, 0.8, 0.62, 0.58, 0.5, 0.24],
      dark: [0.17, 0.2, 0.24, 0.27, 0.3, 0.33, 0.38, 0.46, 0.61, 0.65, 0.72, 0.94],
    };
    input.neutral.chromaCurve = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1, 0.9, 0.8];
    input.neutral.pins = { light: { 3: '#00ff00' } };
    input.extraRamps = { custom: { hue: 250, chroma: 0.12 } };
    const { documents } = generatePaletteDocuments({ su: input });
    const palette = (documents.su as { palette: Record<string, any> }).palette;
    expect(palette.neutral.light[3].$value.hex).toBe('#00ff00');
    expect(palette.neutral.light[1].$value.components[1]).toBeGreaterThan(0);
    expect(palette.custom.light[1]).toBeDefined();
  });

  it('warns when a pinned text step breaks its contrast promise', () => {
    const input = finish();
    input.neutral.pins = { light: { 12: '#ffffff' } };
    const { warnings } = generatePaletteDocuments({ su: input });
    expect(warnings.some((warning) => warning.includes('text contrast promise'))).toBe(true);
  });

  it('reports pinned colors and warns when a pinned canvas breaks text contrast', () => {
    const input = finish();
    input.neutral.pins = { light: { 2: '#000000' } };
    const { report, warnings } = generatePaletteDocuments({ su: input });
    expect(report.find((line) => line.startsWith('su-light'))).toMatch(/text 1\./);
    expect(
      warnings.some((warning) =>
        warning.includes('neutral.12 on canvas falls below the 7:1 text contrast promise'),
      ),
    ).toBe(true);
  });

  it('rejects pins outside the twelve palette steps', () => {
    const input = finish();
    input.neutral.pins = { light: { 13: '#000000' } };
    expect(() => generatePaletteDocuments({ su: input })).toThrow(/Invalid pinned step/);
  });
});
