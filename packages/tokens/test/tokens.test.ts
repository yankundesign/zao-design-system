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
        for (const axis of ['x', 'y'])
          expect(theme.depth.axis[axis].$description).toMatch(/completeness entry/i);
      }
    }
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

  it.todo(
    'input borders meet 3:1 against the canvas (WCAG 1.4.11). Decide with the TextField design in milestone 2: a stronger border, or a fill that identifies the field.',
  );
});
