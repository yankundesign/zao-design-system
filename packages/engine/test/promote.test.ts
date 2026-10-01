import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { finishes } from '../../tokens/palette.config.ts';
import { parameterRegistry } from '../src/registry/index.ts';
import { baselineStyles } from '../src/style.ts';
import {
  planPromotion,
  promotionMapping,
  promotionPaths,
  type PromotionSources,
} from '../src/promote.ts';
import type { StyleFile } from '../src/types.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const sources = Object.fromEntries(
  promotionPaths.map((path) => [path, readFileSync(new URL(path, `file://${root}`), 'utf8')]),
) as PromotionSources;
const library = baselineStyles();
const style = (params: Record<string, unknown>, extraCss = ''): StyleFile => ({
  id: 'promotion-fixture',
  name: 'Promotion fixture',
  extends: 'su',
  author: 'yankun',
  modes: ['light', 'dark'],
  params,
  extraCss,
});
const plan = (candidate: StyleFile, includeShared = false) =>
  planPromotion({
    style: candidate,
    library,
    finish: 'su',
    includeShared,
    sources,
    paletteInput: finishes,
  });

describe('promotion planner', () => {
  it('classifies every registry parameter, including explicit unsupported parameters', () => {
    const unsupported = parameterRegistry
      .filter((entry) => promotionMapping(entry.id).kind === 'unsupported')
      .map((entry) => entry.id);
    expect(unsupported).toEqual(['color.ramp.extra']);
  });

  it('has a working source path for every supported registry parameter', () => {
    for (const parameter of parameterRegistry) {
      const value =
        parameter.id === 'color.ramp.extra'
          ? '{}'
          : parameter.kind === 'color'
            ? '#123456'
            : parameter.kind === 'curve'
              ? Array(12).fill(0.5)
              : parameter.kind === 'easing'
                ? [0.2, 0, 0.8, 1]
                : parameter.kind === 'font'
                  ? 'Example'
                  : parameter.kind === 'enum'
                    ? 'example'
                    : parameter.kind === 'step'
                      ? 3
                      : parameter.range
                        ? (parameter.range[0] + parameter.range[1]) / 2
                        : 1;
      const output = plan(style({ [parameter.id]: value }), true);
      expect(
        output.unsupported.map((item) => item.id),
        parameter.id,
      ).toEqual(parameter.id === 'color.ramp.extra' ? ['color.ramp.extra'] : []);
    }
  });

  it('makes no edits for a virtual baseline and does not mutate source inputs', () => {
    const before = JSON.stringify(sources);
    expect(plan(baselineStyles().su).files).toEqual([]);
    expect(JSON.stringify(sources)).toBe(before);
    expect(JSON.stringify(finishes.su)).toBe(JSON.stringify(finishes.su));
  });

  it('maps finish values into palette config and theme tokens only', () => {
    const output = plan(
      style({
        'color.accent.hue': 205,
        'radius.action': 12,
        'material.overlay.blur': 16,
        'motion.duration.fast': 120,
        'font.family.display': ['Example Serif', 'serif'],
        'type.display.weight': 550,
      }),
    );
    expect(output.unsupported).toEqual([]);
    expect(output.files.map((file) => file.path)).toEqual([
      'packages/tokens/palette.config.ts',
      'packages/tokens/src/themes/su.tokens.json',
    ]);
    expect(output.files[0]?.after).toContain('"hue": 205');
    const theme = JSON.parse(output.files[1]!.after);
    expect(theme.radius.action.$value.value).toBe(12);
    expect(theme.material.overlay.blur.$value.value).toBe(16);
    expect(theme.motion.duration.fast.$value.value).toBe(120);
    expect(theme.font.family.display.$value).toEqual(['Example Serif', 'serif']);
    expect(theme.type.display.$value.fontWeight).toBe(550);
    expect(theme.type.display.$value.fontSize.value).toBe(36);
  });

  it('edits a leaf token without reformatting its whole JSON file', () => {
    const output = plan(style({ 'radius.action': 12 }));
    expect(output.files).toHaveLength(1);
    expect(output.files[0]?.path).toBe('packages/tokens/src/themes/su.tokens.json');
    expect(output.files[0]!.after.length - output.files[0]!.before.length).toBe(1);
  });

  it('skips shared values by default and maps them into both modes or base sources when included', () => {
    const candidate = style({
      'mode.canvas': { light: 3 },
      'font.weight.medium': 540,
      'space.unit': 5,
    });
    const skipped = plan(candidate);
    expect(skipped.files).toEqual([]);
    expect(skipped.skippedShared).toEqual(['mode.canvas', 'font.weight.medium', 'space.unit']);
    const output = plan(candidate, true);
    expect(output.unsupported).toEqual([]);
    expect(output.files.map((file) => file.path)).toEqual([
      'packages/tokens/src/modes/light.tokens.json',
      'packages/tokens/src/base/type.tokens.json',
      'packages/tokens/src/base/space.tokens.json',
    ]);
    const light = JSON.parse(output.files[0]!.after);
    const type = JSON.parse(output.files[1]!.after);
    const space = JSON.parse(output.files[2]!.after);
    expect(light.color.bg.canvas.$value).toBe('{palette.neutral.light.3}');
    expect(type.font.weight.medium.$value).toBe(540);
    expect(space.unit.$value.value).toBe(5);
    expect(space.space['0-5'].$value.value).toBe(2.5);
    expect(output.sharedEffects.map((effect) => effect.affectedFinish)).toEqual(['yu', 'yu', 'yu']);
  });

  it('keeps theme typography composites aligned when a shared display size changes', () => {
    const output = plan(style({ 'type.display.size': 40 }), true);
    expect(output.unsupported).toEqual([]);
    expect(output.files.map((file) => file.path)).toEqual([
      'packages/tokens/src/themes/yu.tokens.json',
      'packages/tokens/src/base/type.tokens.json',
    ]);
    const yu = JSON.parse(output.files[0]!.after);
    const base = JSON.parse(output.files[1]!.after);
    expect(yu.type.display.$value.fontSize.value).toBe(40);
    expect(base.type.display.$value.fontSize.value).toBe(40);
  });

  it('writes advanced ramp options with compatible source types', async () => {
    const curve = Array.from({ length: 12 }, (_, index) => 0.1 + index * 0.05);
    const output = plan(
      style({
        'color.neutral.curve.chroma': curve,
        'color.neutral.hue-drift': 20,
        'color.neutral.pin.light.9': '#123456',
      }),
    );
    expect(output.unsupported).toEqual([]);
    const config = output.files[0]!.after;
    expect(config).toContain('chromaCurve?: number[]');
    expect(config).toContain('hueDrift?: number');
    expect(config).toContain("pins?: Partial<Record<'light' | 'dark', Record<number, string>>>");
    expect(config).toContain('"chromaCurve": [');
    expect(config).toContain('"9": "#123456"');
    const generated = await import(
      `data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(config))}`
    );
    expect(generated.finishes.su.neutral.pins.light[9]).toBe('#123456');
  });

  it('adds a finish-specific status ramp after the shared status spread', async () => {
    const output = plan(style({ 'color.success.hue': 152 }));
    const generated = await import(
      `data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(output.files[0]!.after))}`
    );
    expect(generated.finishes.su.success.hue).toBe(152);
    expect(generated.finishes.yu.success.hue).toBe(150);
  });

  it('reports unsupported extra CSS and extra ramps rather than dropping them', () => {
    const output = plan(style({ 'color.ramp.extra': '{}' }, '.card { filter: blur(2px); }'));
    expect(output.unsupported).toEqual([
      { id: 'extraCss', reason: 'Make this a registry parameter first.' },
      { id: 'color.ramp.extra', reason: 'Extra ramps need new semantic roles before promotion.' },
    ]);
  });
});
