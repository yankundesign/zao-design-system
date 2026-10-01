import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { converter } from 'culori';
import sharp from 'sharp';
import { baselineStyles, type StyleFile } from '@zao/engine';
import { analyzeImage, imageMimeType, sampleImagePixel } from '../lib/image-analysis';
import { makeReferenceSeedDraft } from '../lib/reference-seed';
import { parseReferenceInput } from '../lib/references-server';
import { renderVariables } from '../lib/token-data';
import { writeStyleFile } from '../lib/styles-server';

function rawImage(
  width: number,
  height: number,
  colorAt: (x: number, y: number) => [number, number, number, number],
) {
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const color = colorAt(x, y);
      const offset = (y * width + x) * 4;
      for (let channel = 0; channel < 4; channel++) data[offset + channel] = color[channel]!;
    }
  return sharp(data, { raw: { width, height, channels: 4 } });
}

const emptyTeardown = {
  neutralTemperature: '',
  contrast: '',
  accentUse: '',
  density: '',
  radiusFamily: '',
  typeContrast: '',
  depth: '',
  motion: '',
};

describe('reference image analysis', () => {
  it('separates PNG near-neutrals from colors and reports their area', async () => {
    const image = await rawImage(64, 32, (x) =>
      x < 32 ? [208, 208, 208, 255] : [192, 41, 66, 255],
    )
      .png()
      .toBuffer();
    expect(imageMimeType(image)).toBe('image/png');
    const result = await analyzeImage(image);
    expect(result.width).toBe(64);
    expect(result.height).toBe(32);
    expect(result.neutrals?.share).toBeCloseTo(0.5, 2);
    expect(result.swatches.some((swatch) => swatch.kind === 'neutral')).toBe(true);
    expect(result.swatches.some((swatch) => swatch.kind === 'color')).toBe(true);
    expect(result.swatches.reduce((sum, swatch) => sum + swatch.share, 0)).toBeCloseTo(1, 3);
    expect(await analyzeImage(image)).toEqual(result);
  });

  it('extracts colors from JPG and rejects unsupported bytes', async () => {
    const image = await rawImage(48, 48, () => [46, 119, 182, 255])
      .jpeg({ quality: 95 })
      .toBuffer();
    expect(imageMimeType(image)).toBe('image/jpeg');
    const result = await analyzeImage(image);
    expect(result.swatches[0]?.kind).toBe('color');
    expect(result.swatches[0]?.share).toBeGreaterThan(0.99);
    await expect(analyzeImage(Buffer.from('<svg/>'))).rejects.toThrow('PNG or JPG');
  });

  it('ignores fully transparent pixels', async () => {
    const image = await rawImage(20, 10, (x) => (x < 10 ? [255, 0, 0, 0] : [128, 128, 128, 255]))
      .png()
      .toBuffer();
    const result = await analyzeImage(image);
    expect(result.neutrals?.share).toBeCloseTo(1);
  });

  it('samples an exact source pixel by coordinate', async () => {
    const image = await rawImage(2, 2, (x, y) =>
      x === 1 && y === 0 ? [18, 52, 86, 255] : [0, 0, 0, 0],
    )
      .png()
      .toBuffer();
    expect(await sampleImagePixel(image, 1, 0)).toEqual({
      x: 1,
      y: 0,
      hex: '#123456',
      alpha: 1,
    });
    await expect(sampleImagePixel(image, 2, 0)).rejects.toThrow('fit within');
  });
});

describe('reference seed draft', () => {
  it('pins the chosen swatches to the chosen mode and steps within gamut rounding', () => {
    const draft = makeReferenceSeedDraft({
      referenceId: 'ref-0012',
      referenceTitle: 'Sample',
      name: 'Sample study',
      currentStyle: baselineStyles().su,
      savedStyles: [],
      mode: 'light',
      neutralStep: 2,
      accentStep: 9,
      neutralHex: '#c8bfb1',
      accentHex: '#5182b4',
    });
    expect(draft.references).toEqual(['ref-0012']);
    expect(draft.params['color.neutral.pin.light.2']).toBe('#c8bfb1');
    expect(draft.params['color.accent.pin.light.9']).toBe('#5182b4');
    const vars = renderVariables(draft, 'su-light');
    const toRgb = converter('rgb');
    for (const [step, source] of [
      ['neutral-light-2', '#c8bfb1'],
      ['accent-light-9', '#5182b4'],
    ] as const) {
      const actual = toRgb(vars[`--zao-palette-${step}`]!);
      const expected = toRgb(source);
      if (!actual || !expected) throw new Error('Pinned swatch did not produce an RGB color.');
      expect(Math.abs(actual.r - expected.r)).toBeLessThan(0.005);
      expect(Math.abs(actual.g - expected.g)).toBeLessThan(0.005);
      expect(Math.abs(actual.b - expected.b)).toBeLessThan(0.005);
    }
  });

  it('keeps unsaved parent changes and rejects an unsupported target mode', () => {
    const parent: StyleFile = {
      id: 'working-draft',
      name: 'Working draft',
      extends: 'yu',
      author: 'yankun',
      modes: ['dark'],
      params: { 'radius.action': 12 },
    };
    const choice = {
      referenceId: 'ref-0012',
      referenceTitle: 'Sample',
      name: 'Working draft',
      currentStyle: parent,
      savedStyles: [],
      mode: 'dark' as const,
      neutralStep: 3,
      accentStep: 9,
      neutralHex: '#b1b0ae',
      accentHex: '#5182b4',
    };
    const draft = makeReferenceSeedDraft(choice);
    expect(draft.extends).toBe('yu');
    expect(draft.params['radius.action']).toBe(12);
    expect(draft.id).toBe('working-draft-2');
    expect(() => makeReferenceSeedDraft({ ...choice, mode: 'light' })).toThrow('mode');
  });

  it('preserves unsaved visual edits on an existing saved style', () => {
    const saved: StyleFile = {
      id: 'saved-study',
      name: 'Saved study',
      extends: 'su',
      author: 'yankun',
      modes: ['light', 'dark'],
      params: { 'radius.action': 8 },
      extraCss: '.sample { opacity: 0.8; }',
    };
    const working: StyleFile = {
      ...saved,
      params: { 'radius.action': 12 },
      extraCss: '.sample { opacity: 0.6; }',
    };
    const draft = makeReferenceSeedDraft({
      referenceId: 'ref-0012',
      referenceTitle: 'Sample',
      name: 'Derived study',
      currentStyle: working,
      savedStyles: [saved],
      mode: 'light',
      neutralStep: 2,
      accentStep: 9,
      neutralHex: '#b1b0ae',
      accentHex: '#5182b4',
    });
    expect(draft.extends).toBe('su');
    expect(draft.params['radius.action']).toBe(12);
    expect(draft.extraCss).toBe('.sample { opacity: 0.6; }');
  });

  it('reserves other unsaved draft ids without treating them as saved parents', () => {
    const draft = makeReferenceSeedDraft({
      referenceId: 'ref-0012',
      referenceTitle: 'Sample',
      name: 'Sample study',
      currentStyle: baselineStyles().su,
      savedStyles: [],
      reservedStyleIds: ['sample-study'],
      mode: 'light',
      neutralStep: 2,
      accentStep: 9,
      neutralHex: '#b1b0ae',
      accentHex: '#5182b4',
    });
    expect(draft.id).toBe('sample-study-2');
    expect(draft.extends).toBe('su');
  });
});

describe('reference metadata', () => {
  it('accepts URL-only entries and rejects non-web URLs', () => {
    const input = {
      title: 'Reference',
      sourceUrl: 'https://example.com/work',
      tags: ['warm'],
      boards: ['Su candidates'],
      notes: '',
      likes: '',
      dislikes: '',
      teardown: emptyTeardown,
    };
    expect(parseReferenceInput(input).sourceUrl).toBe(input.sourceUrl);
    expect(() => parseReferenceInput({ ...input, sourceUrl: 'file:///tmp/secret' })).toThrow(
      'http or https',
    );
  });

  it('rejects a style that links to a missing reference before writing a file', async () => {
    const missingId = `ref-${randomUUID()}`;
    const style: StyleFile = {
      id: `missing-reference-${randomUUID().slice(0, 8)}`,
      name: 'Missing reference',
      extends: 'su',
      author: 'agent:test',
      modes: ['light'],
      references: [missingId],
      params: {},
    };
    await expect(writeStyleFile(style, true)).rejects.toThrow(
      `Reference "${missingId}" was not found`,
    );
  });
});
