/**
 * Measure, don't assert. These tests check the promises the token docs make:
 * every finish is complete, structure never changes between finishes, and text
 * meets its stated contrast minimums in every shipped context.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { wcagContrast, type Color } from 'culori';
import type { TokenNormalized, TokenNormalizedSet } from '@terrazzo/parser';
import { contexts } from '../contexts.ts';
import { loadResolver } from '../scripts/export-json.ts';
import { contrastCases, contrastPromises } from '@zao/engine/contrast';

const resolved: Record<string, TokenNormalizedSet> = {};

beforeAll(async () => {
  const resolver = await loadResolver();
  for (const ctx of contexts) {
    resolved[ctx.id] = resolver.apply({ theme: ctx.theme, mode: ctx.mode });
  }
});

const ids = (set: TokenNormalizedSet) =>
  Object.keys(set)
    .filter((id) => !id.startsWith('palette.'))
    .sort();

function toColor(token: TokenNormalized | undefined): Color {
  if (!token || token.$type !== 'color') throw new Error(`Not a color token: ${token?.id}`);
  const { colorSpace, components } = token.$value as { colorSpace: string; components: number[] };
  const [a = 0, b = 0, c = 0] = components;
  if (colorSpace === 'oklch') return { mode: 'oklch', l: a, c: b, h: c };
  if (colorSpace === 'srgb') return { mode: 'rgb', r: a, g: b, b: c };
  throw new Error(`Unsupported color space ${colorSpace} in ${token.id}`);
}

function contrast(set: TokenNormalizedSet, fg: string, bg: string) {
  return wcagContrast(toColor(set[fg]), toColor(set[bg]));
}

describe('every finish is complete', () => {
  it('ships the same semantic tokens in every context', () => {
    const reference = ids(resolved['su-light']!);
    for (const ctx of contexts) {
      expect(ids(resolved[ctx.id]!), ctx.id).toEqual(reference);
    }
  });
});

describe('structure is shared, finish is chosen', () => {
  // Anything that decides size or layout must be identical across finishes.
  const structural = (id: string) =>
    /^(unit|space\.|size\.|stroke\.|radius\.(none|pill)|font\.family\.(text|mono)|font\.weight\.)/.test(
      id,
    ) || /^type\.(heading|body|button|label|caption|code)$/.test(id);

  it('keeps every structural token identical', () => {
    const base = resolved['su-light']!;
    for (const ctx of contexts) {
      const set = resolved[ctx.id]!;
      for (const id of Object.keys(base).filter(structural)) {
        expect(set[id]?.$value, `${id} in ${ctx.id}`).toEqual(base[id]?.$value);
      }
    }
  });

  it('lets display roles change face but never size or line height', () => {
    const base = resolved['su-light']!;
    for (const ctx of contexts) {
      for (const role of ['type.display', 'type.title']) {
        const a = base[role]?.$value as { fontSize: unknown; lineHeight: unknown };
        const b = resolved[ctx.id]![role]?.$value as { fontSize: unknown; lineHeight: unknown };
        expect(b.fontSize, `${role} size in ${ctx.id}`).toEqual(a.fontSize);
        expect(b.lineHeight, `${role} line height in ${ctx.id}`).toEqual(a.lineHeight);
      }
    }
  });
});

describe('construction token contract', () => {
  const depth = {
    'depth.contact': { type: 'dimension', value: { value: 1, unit: 'px' } },
    'depth.lift': { type: 'dimension', value: { value: 2, unit: 'px' } },
    'depth.rest.small': { type: 'dimension', value: { value: 2, unit: 'px' } },
    'depth.rest.control': { type: 'dimension', value: { value: 3, unit: 'px' } },
    'depth.rest.surface': { type: 'dimension', value: { value: 4, unit: 'px' } },
    'depth.axis.x': { type: 'number', value: 1 },
    'depth.axis.y': { type: 'number', value: -1 },
  };

  it('ships the existing construction distances and unitless screen axis in every context', () => {
    for (const ctx of contexts) {
      for (const [id, expected] of Object.entries(depth)) {
        const token = resolved[ctx.id]![id];
        expect(token?.$type, `${id} type in ${ctx.id}`).toBe(expected.type);
        expect(token?.$value, `${id} value in ${ctx.id}`).toEqual(expected.value);
        expect(token?.$description?.trim(), `${id} description in ${ctx.id}`).toBeTruthy();
      }
      expect(resolved[ctx.id]!['stroke.hairline']?.$value, ctx.id).toEqual({
        value: 1,
        unit: 'px',
      });
    }
  });

  it('keeps depth in finish sources and independent stroke width in structure', () => {
    const source = (path: string) =>
      JSON.parse(readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8'));
    const base = source('base/space.tokens.json');
    expect(base.depth).toBeUndefined();
    expect(base.stroke.hairline.$description.trim()).toBeTruthy();
    for (const finish of ['su', 'yu']) {
      const theme = source(`themes/${finish}.tokens.json`);
      expect(theme.stroke).toBeUndefined();
      expect(theme.depth.$description).toMatch(/paint only/i);
      if (finish === 'yu') {
        for (const path of ['contact', 'lift'])
          expect(theme.depth[path].$description).toMatch(/completeness entry/i);
        expect(theme.depth.rest.$description).toMatch(/completeness entry/i);
        for (const axis of ['x', 'y'])
          expect(theme.depth.axis[axis].$description).toMatch(/completeness entry/i);
      }
    }
  });
});

describe('approved shared control height', () => {
  it('resolves the 34px default and preserves small, large, and fen spacing in every context', () => {
    for (const ctx of contexts) {
      const set = resolved[ctx.id]!;
      for (const [id, value] of Object.entries({
        'size.control.sm': 28,
        'size.control.md': 34,
        'size.control.lg': 40,
        'size.button.default': 34,
        'space.8': 32,
        unit: 4,
      })) {
        expect(set[id]?.$type, `${id} type in ${ctx.id}`).toBe('dimension');
        expect(set[id]?.$value, `${id} value in ${ctx.id}`).toEqual({ value, unit: 'px' });
      }
      expect(set['size.control.md']?.$description, ctx.id).toMatch(/34px|34 px|8\.5 fen/);
    }
  });

  it('keeps the default in structure with the existing Button token as its alias', () => {
    const base = JSON.parse(
      readFileSync(new URL('../src/base/space.tokens.json', import.meta.url), 'utf8'),
    );
    expect(base.size.control.md.$value).toEqual({ value: 34, unit: 'px' });
    expect(base.size.button.default.$value).toBe('{size.control.md}');
    expect(base.space['8'].$value).toEqual({ value: 32, unit: 'px' });
    expect(base.size.control.md.$description.trim()).toBeTruthy();
    expect(base.size.button.default.$description.trim()).toBeTruthy();
  });
});

describe('approved Quiet instrument finish values', () => {
  it('resolves the promoted Su radius and fast motion subset in both modes', () => {
    for (const mode of ['light', 'dark']) {
      const set = resolved[`su-${mode}`]!;
      for (const [role, value] of Object.entries({
        action: 0,
        control: 2,
        surface: 2,
        overlay: 2,
      })) {
        expect(set[`radius.${role}`]?.$type, `${role} type in Su ${mode}`).toBe('dimension');
        expect(set[`radius.${role}`]?.$value, `${role} in Su ${mode}`).toEqual({
          value,
          unit: 'px',
        });
      }
      expect(set['motion.duration.fast']?.$value, `fast duration in Su ${mode}`).toEqual({
        value: 80,
        unit: 'ms',
      });
      expect(set['motion.duration.base']?.$value, `base duration in Su ${mode}`).toEqual({
        value: 160,
        unit: 'ms',
      });
      expect(set['motion.easing.standard']?.$value, `easing in Su ${mode}`).toEqual([0.2, 0, 0, 1]);
    }
  });
});

describe('loading indicator timing', () => {
  it('resolves one-second loading rotations with reduced-motion guidance in every context', () => {
    for (const ctx of contexts) {
      const token = resolved[ctx.id]!['motion.duration.loading'];
      expect(token?.$type, `loading duration type in ${ctx.id}`).toBe('duration');
      expect(token?.$value, `loading duration in ${ctx.id}`).toEqual({
        value: 1000,
        unit: 'ms',
      });
      expect(token?.$description, `loading usage in ${ctx.id}`).toMatch(
        /linear.*loading|loading.*linear/i,
      );
      expect(token?.$description, `reduced-motion guidance in ${ctx.id}`).toMatch(
        /reduced motion.*static/i,
      );
      if (ctx.theme === 'yu') expect(token?.$description).toMatch(/completeness entry.*deferred/i);
    }
  });
});

describe('motion comes from rules (finish plan V5, V6)', () => {
  const suDurations = {
    lift: '{motion.duration.grade.7}',
    seat: '{motion.duration.fast}',
    slide: '{motion.duration.grade.7}',
    reveal: '{motion.duration.grade.5}',
    'reveal-exit': '{motion.duration.fast}',
  } as const;
  const suEasings = {
    lift: '{motion.easing.fold-enter}',
    seat: '{motion.easing.standard}',
    slide: '{motion.easing.fold-enter}',
    reveal: '{motion.easing.fold-enter}',
    exit: '{motion.easing.fold-exit}',
  } as const;
  const source = (path: string) =>
    JSON.parse(readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8'));

  it('derives every grade duration from the structural grade table and the finish unit', () => {
    const grades = source('base/grade.tokens.json').grade;
    for (const ctx of contexts) {
      const set = resolved[ctx.id]!;
      const unit = (set['motion.grade-unit']?.$value as { value: number }).value;
      expect(unit, ctx.id).toBeGreaterThan(0);
      for (let grade = 1; grade <= 8; grade++) {
        const height = grades[String(grade)].$value as number;
        expect(set[`grade.${grade}`]?.$value, `grade ${grade} in ${ctx.id}`).toBe(height);
        expect(
          set[`motion.duration.grade.${grade}`]?.$value,
          `grade ${grade} in ${ctx.id}`,
        ).toEqual({
          value: Number((height * unit).toFixed(1)),
          unit: 'ms',
        });
      }
    }
  });

  it('keeps grades heavier as they go up: grade 1 is the slowest part', () => {
    const set = resolved['su-light']!;
    const ms = (g: number) =>
      (set[`motion.duration.grade.${g}`]?.$value as { value: number }).value;
    for (let grade = 1; grade < 8; grade++) expect(ms(grade)).toBeGreaterThan(ms(grade + 1));
  });

  it('derives the 举折 curves: monotone, no overshoot, enter is exit turned 180°', () => {
    const set = resolved['su-light']!;
    const points = (id: string) =>
      (set[id]?.$extensions?.['dev.zao.motion'] as { points: { x: number; y: number }[] }).points;
    const enter = points('motion.easing.fold-enter');
    const exit = points('motion.easing.fold-exit');
    for (const curve of [enter, exit]) {
      expect(curve[0]).toEqual({ x: 0, y: 0 });
      expect(curve.at(-1)).toEqual({ x: 1, y: 1 });
      for (let i = 1; i < curve.length; i++) {
        expect(curve[i]!.y).toBeGreaterThan(curve[i - 1]!.y);
        expect(curve[i]!.y).toBeLessThanOrEqual(1);
      }
    }
    exit.forEach((p, i) => {
      const q = enter[enter.length - 1 - i]!;
      expect(q.x).toBeCloseTo(1 - p.x, 4);
      expect(q.y).toBeCloseTo(1 - p.y, 4);
    });
    // The fold rule: the purlin below the ridge sits one tenth of the rise below the chord.
    expect(exit.at(-2)!.y).toBeCloseTo(exit.at(-2)!.x - 0.1, 4);
  });

  it('points Su roles at the grades and curves, with press shorter than release', () => {
    const theme = source('themes/su.tokens.json');
    for (const [role, alias] of Object.entries(suDurations))
      expect(theme.motion.duration[role].$value, role).toBe(alias);
    for (const [role, alias] of Object.entries(suEasings))
      expect(theme.motion.easing[role].$value, role).toBe(alias);
    for (const mode of ['light', 'dark']) {
      const set = resolved[`su-${mode}`]!;
      const ms = (id: string) => (set[id]?.$value as { value: number }).value;
      expect(ms('motion.duration.seat')).toBeLessThan(ms('motion.duration.lift'));
      expect(set['motion.duration.fast']?.$value).toEqual({ value: 80, unit: 'ms' });
      expect(set['motion.easing.standard']?.$value).toEqual([0.2, 0, 0, 1]);
      for (const role of Object.keys(suEasings)) {
        expect(set[`motion.easing.${role}`]?.$type, role).toBe('cubicBezier');
        expect(set[`motion.easing.${role}`]?.$description?.trim(), role).toBeTruthy();
      }
    }
  });

  it(
    'keeps the generated motion files in step with motion.config.ts',
    { timeout: 30_000 },
    async () => {
      const { motionDocument } = await import('../scripts/generate-motion.ts');
      for (const finish of ['su', 'yu'] as const) {
        const checkedIn = readFileSync(
          new URL(`../src/motion/${finish}.generated.tokens.json`, import.meta.url),
          'utf8',
        );
        expect(JSON.stringify(motionDocument(finish), null, 2) + '\n', finish).toBe(checkedIn);
      }
    },
  );

  it('marks deferred Yu motion roles as completeness entries', () => {
    const theme = source('themes/yu.tokens.json');
    for (const role of Object.keys(suDurations))
      expect(theme.motion.duration[role].$description).toMatch(/completeness entry.*deferred/i);
    for (const role of Object.keys(suEasings))
      expect(theme.motion.easing[role].$description).toMatch(/completeness entry.*deferred/i);
  });
});

describe('depth is drawn, never blurred (finish plan rule 2)', () => {
  it('gives every Su shadow and material zero blur', () => {
    for (const ctx of contexts.filter((context) => context.theme === 'su')) {
      const set = resolved[ctx.id]!;
      for (const token of Object.values(set)) {
        if (token.$type === 'shadow') {
          const layers = Array.isArray(token.$value) ? token.$value : [token.$value];
          for (const layer of layers as { blur: { value: number } }[]) {
            expect(layer.blur.value, `${ctx.id} ${token.id}`).toBe(0);
          }
        }
        if (token.$type === 'dimension' && /(^|\.)blur$/.test(token.id)) {
          expect((token.$value as { value: number }).value, `${ctx.id} ${token.id}`).toBe(0);
        }
      }
    }
  });
});

describe('contrast', () => {
  for (const ctx of contexts) {
    describe(ctx.id, () => {
      for (const [fg, min] of contrastCases) {
        for (const bg of contrastPromises.surfaces) {
          it(`${fg} on ${bg} is at least ${min}:1`, () => {
            expect(contrast(resolved[ctx.id]!, fg, bg)).toBeGreaterThanOrEqual(min);
          });
        }
      }
      for (const pair of contrastPromises.onSeal) {
        it(`${pair.foreground} on ${pair.background} is at least ${pair.minimum}:1`, () => {
          expect(
            contrast(resolved[ctx.id]!, pair.foreground, pair.background),
          ).toBeGreaterThanOrEqual(pair.minimum);
        });
      }
      it('color.fg.on-accent on color.accent.solid is at least 4.5:1', () => {
        expect(
          contrast(
            resolved[ctx.id]!,
            contrastPromises.onAccent.foreground,
            contrastPromises.onAccent.background,
          ),
        ).toBeGreaterThanOrEqual(contrastPromises.onAccent.minimum);
      });
    });
  }

  // The former todo: input borders meet 3:1 (WCAG 1.4.11). color.border.field and
  // color.border.field-invalid now carry that promise and are checked with the cases above.
});
