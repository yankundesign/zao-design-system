import { describe, expect, it } from 'vitest';
import {
  baselineStyles,
  diff,
  interpolate,
  mix,
  resolveStyle,
  sweep,
  styleSchema,
  toCssVars,
  validateStyle,
  vary,
} from '../src/style.ts';
import { parameterRegistry } from '../src/registry/index.ts';
import { baseVariablesFromTokens, baselineParameterValues } from '../src/baseline.ts';
import { evaluateContrast } from '../src/contrast.ts';
import type { StyleFile } from '../src/types.ts';

const style = (id: string, params: Record<string, unknown> = {}): StyleFile => ({
  id,
  name: id,
  extends: 'su',
  author: 'yankun',
  modes: ['light', 'dark'],
  params,
});

describe('style engine', () => {
  it('validates known values and rejects unknown parameters', () => {
    expect(() => validateStyle(style('a', { 'radius.action': 8 }))).not.toThrow();
    expect(() => validateStyle(style('a', { unknown: 1 }))).toThrow(/Unknown style parameter/);
  });

  it('creates schema properties and variable mappings from the registry', () => {
    const params = (styleSchema.properties.params as { properties: Record<string, unknown> })
      .properties;
    for (const parameter of parameterRegistry) {
      expect(params[parameter.id]).toBeDefined();
      expect(parameter.cssVariables.length).toBeGreaterThan(0);
    }
    expect(new Set(parameterRegistry.map((parameter) => parameter.id)).size).toBe(
      parameterRegistry.length,
    );
  });

  it('resolves inheritance, reports parameter diffs and mixes groups with provenance', () => {
    const parent = style('su', { 'radius.action': 6 });
    const child = style('soft', { 'radius.surface': 10 });
    const resolved = resolveStyle(child, { su: parent });
    expect(resolved.params).toEqual({ 'radius.action': 6, 'radius.surface': 10 });
    expect(diff(parent, resolved)).toEqual([
      { id: 'radius.surface', before: undefined, after: 10 },
    ]);
    const mixed = mix(parent, { shape: style('jade', { 'radius.action': 16 }) });
    expect(mixed.params['radius.action']).toBe(16);
    expect(mixed.sources?.['radius.action']).toBe('jade');
  });

  it('inherits extra CSS through an empty child and clears base overrides when mixing a sparse group', () => {
    const parent = { ...style('su'), extraCss: '.card { border-style: dashed; }' };
    const child = { ...style('child'), extraCss: '' };
    expect(resolveStyle(child, { su: parent }).extraCss).toBe(parent.extraCss);

    const base = style('base', { 'radius.action': 14, 'radius.surface': 16 });
    const source = style('source', { 'radius.action': 8 });
    const mixed = mix(base, { shape: source });
    expect(mixed.params).toEqual({ 'radius.action': 8 });
    expect(mixed.sources?.['radius.surface']).toBe('source');
  });

  it('interpolates colors on the shorter hue path and switches fonts at the midpoint', () => {
    const a = style('a', { 'material.overlay.fill': '#ff0000', 'font.family.display': 'A' });
    const b = style('b', { 'material.overlay.fill': '#0000ff', 'font.family.display': 'B' });
    expect(interpolate(a, b, 0.25).params['material.overlay.fill']).toMatch(/^#/);
    expect(interpolate(a, b, 0.49).params['font.family.display']).toBe('A');
    expect(interpolate(a, b, 0.5).params['font.family.display']).toBe('B');
    const transparent = interpolate(
      style('transparent', { 'material.overlay.fill': '#00000000' }),
      style('opaque', { 'material.overlay.fill': '#ffffffff' }),
      0.5,
    );
    expect(transparent.params['material.overlay.fill']).toMatch(/^#[a-f0-9]{8}$/i);
  });

  it('keeps sparse interpolation endpoints and whole palette steps valid', () => {
    const a = style('a', { 'mode.canvas': 2, 'radius.action': 8 });
    const b = style('b', { 'mode.canvas': 3, 'radius.surface': 12 });
    expect(interpolate(a, b, 0).params).toEqual(a.params);
    expect(interpolate(a, b, 1).params).toEqual(b.params);
    const midpoint = interpolate(a, b, 0.5);
    expect(midpoint.params['mode.canvas']).toBe(3);
    expect(() => validateStyle(midpoint)).not.toThrow();
  });

  it('mixes inherited groups and interpolates distinct virtual baselines', () => {
    const roots = baselineStyles();
    const parent = style('parent', { 'radius.action': 14 });
    const sourceParent = style('source-parent', { 'radius.action': 10 });
    const base = { ...style('base'), extends: 'parent' };
    const source = { ...style('source'), extends: 'source-parent' };
    const baselines = { ...roots, parent, 'source-parent': sourceParent, base, source };
    const baselineParamsByRoot = {
      su: { 'radius.action': 6, 'color.accent.hue': 350 },
      yu: { 'radius.action': 10, 'color.accent.hue': 10 },
    };
    const mixed = mix(base, { shape: source }, { baselines, baselineParamsByRoot });
    expect(mixed.extends).toBe('su');
    expect(mixed.params['radius.action']).toBe(10);
    expect(mixed.provenance).toEqual({
      operation: 'mix',
      base: 'base',
      groups: { shape: 'source' },
    });
    expect(() => validateStyle(mixed)).not.toThrow();

    const between = interpolate(roots.su, roots.yu, 0.5, {
      baselines,
      baselineParamsByRoot,
    });
    expect(between.params['radius.action']).toBe(8);
    expect(between.params['color.accent.hue']).toBe(0);
    expect(between.extends).toBe('su');
    expect(() => validateStyle(between)).not.toThrow();
  });

  it('interpolates per-mode steps and records reproducible provenance', () => {
    const a = style('a', { 'mode.canvas': { light: 2, dark: 1 } });
    const b = style('b', { 'mode.canvas': { light: 4, dark: 5 } });
    const middle = interpolate(a, b, 0.5);
    expect(middle.params['mode.canvas']).toEqual({ light: 3, dark: 3 });
    expect(middle.provenance).toEqual({ operation: 'interpolate', from: 'a', to: 'b', t: 0.5 });
    expect(() => validateStyle(middle)).not.toThrow();
  });

  it('varies deterministically from a seed and emits CSS variables over a complete baseline', () => {
    const source = style('a', { 'radius.action': 8 });
    const options = { params: ['radius.action'], spread: 0.2, count: 5, seed: 17 };
    expect(vary(source, options)).toEqual(vary(source, options));
    const vars = toCssVars(source, {
      theme: 'su',
      mode: 'light',
      baseVariables: { '--zao-color-bg-canvas': '#fff', '--zao-radius-action': '6px' },
    });
    expect(vars).toEqual({ '--zao-color-bg-canvas': '#fff', '--zao-radius-action': '8px' });
  });

  it('can vary an inherited palette step without writing fractional steps', () => {
    const source = style('sparse');
    const variants = vary(source, {
      params: ['mode.canvas'],
      spread: 0.4,
      count: 6,
      seed: 17,
      baselineParams: { 'mode.canvas': 4 },
    });
    expect(variants.some((variant) => variant.params['mode.canvas'] !== 4)).toBe(true);
    for (const variant of variants) {
      expect(Number.isInteger(variant.params['mode.canvas'])).toBe(true);
      expect(() => validateStyle(variant)).not.toThrow();
    }
  });

  it('varies colors, curves, easing and mode objects deterministically', () => {
    const source = style('full', {
      'color.accent.anchor': '#808080',
      'color.accent.curve.chroma': Array(12).fill(0.5),
      'mode.canvas': { light: 2, dark: 3 },
      'motion.easing.standard': [0.2, 0, 0, 1],
    });
    const options = {
      params: [
        'color.accent.anchor',
        'color.accent.curve.chroma',
        'mode.canvas',
        'motion.easing.standard',
      ],
      spread: 0.1,
      count: 3,
      seed: 42,
    };
    const first = vary(source, options);
    expect(first).toEqual(vary(source, options));
    expect(first[0]?.params['color.accent.anchor']).not.toBe('#808080');
    expect(first[0]?.params['color.accent.curve.chroma']).not.toEqual(
      source.params['color.accent.curve.chroma'],
    );
    expect(first[0]?.provenance).toEqual({
      operation: 'vary',
      source: 'full',
      ...options,
      index: 0,
    });
    for (const variant of first) expect(() => validateStyle(variant)).not.toThrow();
  });

  it('validates sweep inputs and provenance', () => {
    const variants = sweep(style('base'), 'radius.action', [6, 10, 14]);
    expect(variants.map((variant) => variant.params['radius.action'])).toEqual([6, 10, 14]);
    expect(variants[1]?.provenance).toEqual({
      operation: 'sweep',
      source: 'base',
      parameter: 'radius.action',
      values: [6, 10, 14],
      index: 1,
    });
    for (const variant of variants) expect(() => validateStyle(variant)).not.toThrow();
    expect(() => sweep(style('base'), 'radius.action', [99999])).toThrow(/within/);
    expect(() =>
      validateStyle({
        ...variants[0],
        provenance: {
          operation: 'sweep',
          source: 'base',
          parameter: 'radius.action',
          values: [99999],
          index: 0,
        },
      }),
    ).toThrow(/within/);
  });

  it('rebuilds palette variables and semantic aliases when a palette or mode parameter changes', () => {
    const source = style('colorful', { 'color.neutral.chroma': 0.02, 'mode.canvas': 3 });
    const vars = toCssVars(source, {
      theme: 'su',
      mode: 'light',
      baseVariables: { '--zao-color-bg-canvas': 'old' },
      paletteInput: {
        neutral: { hue: 0, chroma: 0 },
        accent: { hue: 0, chroma: 0 },
        success: { hue: 150, chroma: 0.15 },
        warning: { hue: 75, chroma: 0.16 },
        danger: { hue: 27, chroma: 0.2 },
        contrast: 0.5,
      },
      paletteAliases: { '--zao-color-bg-canvas': { ramp: 'neutral', mode: 'light', step: 2 } },
    });
    expect(vars['--zao-color-bg-canvas']).not.toBe('old');
    expect(vars['--zao-palette-neutral-light-1']).toMatch(/^oklch\(/);
  });

  it('applies mode mappings only to the selected mode', () => {
    const source = style('mode-study', { 'mode.canvas': { light: 3, dark: 4 } });
    const context = {
      theme: 'su' as const,
      baseVariables: { '--zao-color-bg-canvas': 'old' },
      paletteInput: {
        neutral: { hue: 0, chroma: 0 },
        accent: { hue: 0, chroma: 0 },
        success: { hue: 150, chroma: 0.15 },
        warning: { hue: 75, chroma: 0.16 },
        danger: { hue: 27, chroma: 0.2 },
        contrast: 0.5,
      },
    };
    const light = toCssVars(source, {
      ...context,
      mode: 'light',
      paletteAliases: { '--zao-color-bg-canvas': { ramp: 'neutral', mode: 'light', step: 2 } },
    });
    const dark = toCssVars(source, {
      ...context,
      mode: 'dark',
      paletteAliases: { '--zao-color-bg-canvas': { ramp: 'neutral', mode: 'dark', step: 1 } },
    });
    expect(light['--zao-color-bg-canvas']).toBe(light['--zao-palette-neutral-light-3']);
    expect(dark['--zao-color-bg-canvas']).toBe(dark['--zao-palette-neutral-dark-4']);
    expect(() => validateStyle(style('bad-mode', { 'mode.canvas': { dusk: 2 } }))).toThrow(
      /light and\/or dark/,
    );
  });

  it('generates extra ramps and propagates font changes to role variables', () => {
    const source = style('extended', {
      'color.ramp.extra': JSON.stringify({ custom: { hue: 220, chroma: 0.12 } }),
      'font.family.display': 'Example Serif',
      'font.weight.strong': 640,
    });
    const vars = toCssVars(source, {
      theme: 'su',
      mode: 'light',
      baseVariables: {},
      paletteInput: {
        neutral: { hue: 0, chroma: 0 },
        accent: { hue: 0, chroma: 0 },
        success: { hue: 150, chroma: 0.15 },
        warning: { hue: 75, chroma: 0.16 },
        danger: { hue: 27, chroma: 0.2 },
        contrast: 0.5,
      },
    });
    expect(vars['--zao-palette-custom-light-1']).toMatch(/^oklch\(/);
    expect(vars['--zao-type-title-font-family']).toBe('"Example Serif"');
    expect(vars['--zao-type-heading-font-weight']).toBe('640');
    expect(() => validateStyle(style('invalid', { 'color.ramp.extra': '{not JSON}' }))).toThrow(
      /valid JSON/,
    );
  });

  it('propagates structural spacing and shadow colors into resolved variables', () => {
    const source = style('shared', {
      'space.unit': 5,
      'shadow.soft': '#123456',
      'material.overlay.highlight': '#ffffff',
    });
    const vars = toCssVars(source, {
      theme: 'su',
      mode: 'light',
      baseVariables: {
        '--zao-space-3': '12px',
        '--zao-space-0-5': '2px',
        '--zao-space-1-5': '6px',
        '--zao-color-shadow-soft': 'oklch(0.2 0 0 / 0.06)',
        '--zao-color-shadow-strong': 'oklch(0.2 0 0 / 0.1)',
        '--zao-material-overlay-highlight': 'color(srgb 1 1 1 / 0.18)',
        '--zao-material-overlay-shadow':
          'inset 0px 1px 0px 0px color(srgb 1 1 1 / 0.18), 0px 1px 2px 0px oklch(0.2 0 0 / 0.06), 0px 8px 24px 0px oklch(0.2 0 0 / 0.1)',
      },
    });
    expect(vars['--zao-unit']).toBe('5px');
    expect(vars['--zao-space-0-5']).toBe('2.5px');
    expect(vars['--zao-space-1-5']).toBe('7.5px');
    expect(vars['--zao-space-3']).toBe('15px');
    expect(vars['--zao-material-overlay-shadow']).toContain('#123456');
    expect(vars['--zao-material-overlay-shadow']).toContain('#ffffff');
  });

  it('keeps finish-specific display weights when shared strong weight changes', () => {
    const shared = style('weight-study', { 'font.weight.strong': 640 });
    const baseVariables = {
      '--zao-font-weight-strong': '630',
      '--zao-type-display-font-weight': '520',
      '--zao-type-title-font-weight': '520',
      '--zao-type-heading-font-weight': '630',
    };
    const context = { theme: 'yu' as const, mode: 'dark' as const, baseVariables };
    const vars = toCssVars(shared, context);
    expect(vars['--zao-font-weight-strong']).toBe('640');
    expect(vars['--zao-type-display-font-weight']).toBe('520');
    expect(vars['--zao-type-title-font-weight']).toBe('520');
    expect(vars['--zao-type-heading-font-weight']).toBe('640');

    const display = style('display-study', {
      'type.display.weight': 540,
      'font.weight.strong': 640,
    });
    expect(toCssVars(display, context)['--zao-type-display-font-weight']).toBe('540');
  });

  it('applies local font slots to every matching type role', () => {
    const source = style('font-study', {
      'font.family.text': 'Trial Sans',
      'font.family.mono': 'Trial Mono',
    });
    const vars = toCssVars(source, { theme: 'su', mode: 'light', baseVariables: {} });
    expect(vars['--zao-font-family-text']).toBe('"Trial Sans"');
    for (const role of ['heading', 'body', 'label', 'caption'])
      expect(vars[`--zao-type-${role}-font-family`]).toBe('"Trial Sans"');
    expect(vars['--zao-font-family-mono']).toBe('"Trial Mono"');
    expect(vars['--zao-type-code-font-family']).toBe('"Trial Mono"');
  });

  it('flattens token typography and derives baseline editor values', () => {
    const variables = baseVariablesFromTokens({
      'type.display': {
        type: 'typography',
        cssVar: '--zao-type-display',
        value: {
          fontFamily: ['Geist', 'system-ui'],
          fontSize: { value: 36, unit: 'px' },
          fontWeight: 630,
          lineHeight: 1.1111,
          letterSpacing: { value: -0.9, unit: 'px' },
        },
      },
      'radius.action': { type: 'dimension', cssVar: '--zao-radius-action', value: '6px' },
      unit: { type: 'dimension', cssVar: '--zao-unit', value: '4px' },
    });
    expect(variables['--zao-type-display-font-size']).toBe('36px');
    expect(variables['--zao-type-display-font-family']).toBe('Geist, system-ui');
    const baseline = baselineParameterValues(
      {
        neutral: { hue: 0, chroma: 0 },
        accent: { hue: 0, chroma: 0 },
        success: { hue: 150, chroma: 0.15 },
        warning: { hue: 75, chroma: 0.16 },
        danger: { hue: 27, chroma: 0.2 },
        contrast: 0.5,
      },
      variables,
    );
    expect(baseline['radius.action']).toBe(6);
    expect(baseline['space.unit']).toBe(4);
    expect(baseline['color.neutral.curve.lightness.light']).toHaveLength(12);
  });

  it('evaluates the live contrast panel using the shared promises', () => {
    const variables = {
      '--zao-color-bg-canvas': '#ffffff',
      '--zao-color-bg-surface': '#ffffff',
      '--zao-color-fg-default': '#000000',
      '--zao-color-fg-muted': '#555555',
      '--zao-color-accent-text': '#000000',
      '--zao-color-success-text': '#000000',
      '--zao-color-warning-text': '#000000',
      '--zao-color-danger-text': '#000000',
      '--zao-color-focus-ring': '#000000',
      '--zao-color-fg-on-accent': '#ffffff',
      '--zao-color-accent-solid': '#000000',
    };
    const results = evaluateContrast(variables);
    expect(results).toHaveLength(15);
    expect(results.every((result) => result.pass)).toBe(true);
  });
});
