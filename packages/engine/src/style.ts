import { converter, formatHex, formatHex8, parse, type Oklch } from 'culori';
import { registryById, parameterRegistry } from './registry/index.ts';
import { generatePaletteDocuments } from './palette.ts';
import type { CssContext, Parameter, RampInput, StyleFile } from './types.ts';

const toOklch = converter('oklch');
const clone = <T>(value: T): T => structuredClone(value);
const formatOklch = (color: Oklch) =>
  (color.alpha ?? 1) < 1 ? formatHex8(color) : formatHex(color);

const nonEmptyString = { type: 'string', minLength: 1 } as const;
const sourceMap = { type: 'object', additionalProperties: nonEmptyString } as const;
const provenanceSchema = {
  oneOf: [
    {
      type: 'object',
      required: ['operation', 'base', 'groups'],
      properties: { operation: { const: 'mix' }, base: nonEmptyString, groups: sourceMap },
      additionalProperties: false,
    },
    {
      type: 'object',
      required: ['operation', 'from', 'to', 't'],
      properties: {
        operation: { const: 'interpolate' },
        from: nonEmptyString,
        to: nonEmptyString,
        t: { type: 'number', minimum: 0, maximum: 1 },
      },
      additionalProperties: false,
    },
    {
      type: 'object',
      required: ['operation', 'source', 'parameter', 'values', 'index'],
      properties: {
        operation: { const: 'sweep' },
        source: nonEmptyString,
        parameter: nonEmptyString,
        values: { type: 'array', minItems: 1, items: {} },
        index: { type: 'integer', minimum: 0 },
      },
      additionalProperties: false,
    },
    {
      type: 'object',
      required: ['operation', 'source', 'params', 'spread', 'count', 'seed', 'index'],
      properties: {
        operation: { const: 'vary' },
        source: nonEmptyString,
        params: { type: 'array', minItems: 1, items: nonEmptyString },
        spread: { type: 'number', minimum: 0, maximum: 1 },
        count: { type: 'integer', minimum: 1 },
        seed: { type: 'integer' },
        index: { type: 'integer', minimum: 0 },
      },
      additionalProperties: false,
    },
  ],
} as const;

const paramSchema = (parameter: Parameter) => {
  if (parameter.perMode && parameter.layer === 'mode' && parameter.kind === 'step') {
    const step = {
      type: 'number',
      ...(parameter.range ? { minimum: parameter.range[0], maximum: parameter.range[1] } : {}),
    };
    return {
      oneOf: [
        step,
        {
          type: 'object',
          properties: { light: step, dark: step },
          minProperties: 1,
          additionalProperties: false,
        },
      ],
    };
  }
  if (
    parameter.kind === 'number' ||
    parameter.kind === 'hue' ||
    parameter.kind === 'chroma' ||
    parameter.kind === 'lightness' ||
    parameter.kind === 'step' ||
    parameter.kind === 'duration'
  ) {
    return {
      type: 'number',
      ...(parameter.range ? { minimum: parameter.range[0], maximum: parameter.range[1] } : {}),
    };
  }
  if (parameter.kind === 'curve')
    return {
      type: 'array',
      minItems: 12,
      maxItems: 12,
      items: {
        type: 'number',
        ...(parameter.range ? { minimum: parameter.range[0], maximum: parameter.range[1] } : {}),
      },
    };
  if (parameter.kind === 'color') return { type: 'string', format: 'color' };
  if (parameter.kind === 'font')
    return { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] };
  if (parameter.kind === 'easing')
    return { type: 'array', minItems: 4, maxItems: 4, items: { type: 'number' } };
  return { type: 'string' };
};

export const styleSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'ZAO style',
  type: 'object',
  required: ['id', 'name', 'extends', 'author', 'modes', 'params'],
  properties: {
    $schema: { type: 'string' },
    id: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    extends: { type: 'string', minLength: 1 },
    author: { type: 'string', minLength: 1 },
    modes: { type: 'array', items: { enum: ['light', 'dark'] }, minItems: 1 },
    tags: { type: 'array', items: { type: 'string' } },
    references: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
    extraCss: { type: 'string' },
    sources: { type: 'object', additionalProperties: { type: 'string' } },
    generated: { type: 'boolean' },
    provenance: provenanceSchema,
    params: {
      type: 'object',
      properties: Object.fromEntries(
        parameterRegistry.map((parameter) => [parameter.id, paramSchema(parameter)]),
      ),
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

export function validateStyle(value: unknown): asserts value is StyleFile {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Style must be a JSON object.');
  const style = value as Record<string, unknown>;
  for (const key of styleSchema.required)
    if (!(key in style)) throw new Error(`Style is missing required field "${key}".`);
  for (const key of Object.keys(style))
    if (!(key in styleSchema.properties)) throw new Error(`Unknown style field "${key}".`);
  for (const key of ['id', 'name', 'extends', 'author'] as const)
    if (typeof style[key] !== 'string' || !style[key])
      throw new Error(`Style field "${key}" must be a non-empty string.`);
  if (
    !Array.isArray(style.modes) ||
    !style.modes.length ||
    style.modes.some((mode) => mode !== 'light' && mode !== 'dark')
  )
    throw new Error('Style modes must include light and/or dark.');
  if (style.$schema !== undefined && typeof style.$schema !== 'string')
    throw new Error('Style field "$schema" must be a string.');
  for (const key of ['notes', 'extraCss'] as const)
    if (style[key] !== undefined && typeof style[key] !== 'string')
      throw new Error(`Style field "${key}" must be a string.`);
  for (const key of ['tags', 'references'] as const)
    if (
      style[key] !== undefined &&
      (!Array.isArray(style[key]) || style[key].some((entry) => typeof entry !== 'string'))
    )
      throw new Error(`Style field "${key}" must be a list of strings.`);
  if (style.generated !== undefined && typeof style.generated !== 'boolean')
    throw new Error('Style field "generated" must be a boolean.');
  if (
    style.sources !== undefined &&
    (!style.sources ||
      typeof style.sources !== 'object' ||
      Array.isArray(style.sources) ||
      Object.values(style.sources).some((entry) => typeof entry !== 'string'))
  )
    throw new Error('Style field "sources" must map names to strings.');
  if (style.provenance !== undefined) validateProvenance(style.provenance);
  if (!style.params || typeof style.params !== 'object' || Array.isArray(style.params))
    throw new Error('Style params must be an object.');
  for (const [id, param] of Object.entries(style.params as Record<string, unknown>)) {
    const definition = registryById.get(id);
    if (!definition) throw new Error(`Unknown style parameter "${id}".`);
    validateParameter(definition, param);
  }
}

function validateProvenance(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Style provenance must be an object.');
  const entry = value as Record<string, unknown>;
  const operation = entry.operation;
  const required: Record<string, string[]> = {
    mix: ['operation', 'base', 'groups'],
    interpolate: ['operation', 'from', 'to', 't'],
    sweep: ['operation', 'source', 'parameter', 'values', 'index'],
    vary: ['operation', 'source', 'params', 'spread', 'count', 'seed', 'index'],
  };
  if (typeof operation !== 'string' || !(operation in required))
    throw new Error('Style provenance has an unknown operation.');
  const keys = required[operation]!;
  if (Object.keys(entry).some((key) => !keys.includes(key)) || keys.some((key) => !(key in entry)))
    throw new Error(`Style provenance for ${operation} has missing or unknown fields.`);
  const text = (key: string) => typeof entry[key] === 'string' && entry[key] !== '';
  const integer = (key: string, minimum: number) =>
    Number.isInteger(entry[key]) && Number(entry[key]) >= minimum;
  const unit = (key: string) =>
    typeof entry[key] === 'number' &&
    Number.isFinite(entry[key]) &&
    Number(entry[key]) >= 0 &&
    Number(entry[key]) <= 1;
  if (operation === 'mix') {
    if (
      !text('base') ||
      !entry.groups ||
      typeof entry.groups !== 'object' ||
      Array.isArray(entry.groups)
    )
      throw new Error('Mix provenance needs a base and group sources.');
    for (const [group, source] of Object.entries(entry.groups))
      if (
        !parameterRegistry.some((parameter) => parameter.group === group) ||
        typeof source !== 'string' ||
        !source
      )
        throw new Error(`Mix provenance has an invalid group source for "${group}".`);
  } else if (operation === 'interpolate') {
    if (!text('from') || !text('to') || !unit('t'))
      throw new Error('Interpolation provenance needs two styles and t from 0 to 1.');
  } else if (operation === 'sweep') {
    const parameter = registryById.get(String(entry.parameter));
    if (
      !text('source') ||
      !parameter ||
      !Array.isArray(entry.values) ||
      !entry.values.length ||
      !integer('index', 0) ||
      Number(entry.index) >= entry.values.length
    )
      throw new Error('Sweep provenance needs a source, parameter, values and valid index.');
    for (const item of entry.values) validateParameter(parameter, item);
  } else if (operation === 'vary') {
    if (
      !text('source') ||
      !Array.isArray(entry.params) ||
      !entry.params.length ||
      entry.params.some((item) => typeof item !== 'string' || !item) ||
      !unit('spread') ||
      !integer('count', 1) ||
      !integer('seed', -Infinity) ||
      !integer('index', 0) ||
      Number(entry.index) >= Number(entry.count)
    )
      throw new Error(
        'Variation provenance needs valid parameters, spread, count, seed and index.',
      );
  }
}

export function parseStyle(source: string): StyleFile {
  const value: unknown = JSON.parse(source);
  validateStyle(value);
  return value;
}

/** Virtual roots. Their rendered token values always come from the token build passed to toCssVars. */
export function baselineStyles(): Record<'su' | 'yu', StyleFile> {
  return {
    su: {
      id: 'su',
      name: 'Su baseline',
      extends: 'su',
      author: 'system:tokens',
      modes: ['light', 'dark'],
      params: {},
    },
    yu: {
      id: 'yu',
      name: 'Yu baseline',
      extends: 'yu',
      author: 'system:tokens',
      modes: ['dark'],
      params: {},
    },
  };
}

export function paletteAliasesFromTokens(
  tokens: Record<string, { cssVar: string; aliasOf?: string }>,
) {
  const aliases: NonNullable<CssContext['paletteAliases']> = {};
  for (const token of Object.values(tokens)) {
    const match = token.aliasOf?.match(/^palette\.([^.]+)\.(light|dark)\.(\d+|contrast)$/);
    if (match)
      aliases[token.cssVar] = {
        ramp: match[1]!,
        mode: match[2] as 'light' | 'dark',
        step: match[3] === 'contrast' ? 'contrast' : Number(match[3]),
      };
  }
  return aliases;
}

function validateParameter(definition: Parameter, value: unknown) {
  if (definition.id === 'color.ramp.extra') {
    parseExtraRamps(value);
    return;
  }
  if (
    definition.perMode &&
    definition.layer === 'mode' &&
    definition.kind === 'step' &&
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    const steps = Object.entries(value);
    if (
      !steps.length ||
      steps.some(
        ([mode, step]) =>
          (mode !== 'light' && mode !== 'dark') ||
          typeof step !== 'number' ||
          !Number.isInteger(step) ||
          (definition.range && (step < definition.range[0] || step > definition.range[1])),
      )
    )
      throw new Error(`${definition.id} needs light and/or dark palette steps.`);
    return;
  }
  if (
    definition.kind === 'number' ||
    definition.kind === 'hue' ||
    definition.kind === 'chroma' ||
    definition.kind === 'lightness' ||
    definition.kind === 'step' ||
    definition.kind === 'duration'
  ) {
    if (typeof value !== 'number' || !Number.isFinite(value))
      throw new Error(`${definition.id} must be a finite number.`);
    if (definition.range && (value < definition.range[0] || value > definition.range[1]))
      throw new Error(
        `${definition.id} must be within ${definition.range.join('–')}${definition.unit}.`,
      );
    if (definition.kind === 'step' && !Number.isInteger(value))
      throw new Error(`${definition.id} must be a whole palette step.`);
  } else if (definition.kind === 'curve') {
    if (
      !Array.isArray(value) ||
      value.length !== 12 ||
      value.some(
        (entry) =>
          typeof entry !== 'number' ||
          !Number.isFinite(entry) ||
          (definition.range && (entry < definition.range[0] || entry > definition.range[1])),
      )
    )
      throw new Error(`${definition.id} must contain 12 finite numbers.`);
  } else if (definition.kind === 'color') {
    if (typeof value !== 'string' || !parse(value))
      throw new Error(`${definition.id} must be a CSS color.`);
  } else if (
    definition.kind === 'font' &&
    typeof value !== 'string' &&
    (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string'))
  ) {
    throw new Error(`${definition.id} must be a font family or family list.`);
  } else if (
    definition.kind === 'easing' &&
    (!Array.isArray(value) ||
      value.length !== 4 ||
      value.some((entry) => typeof entry !== 'number'))
  ) {
    throw new Error(`${definition.id} must be four cubic-bezier numbers.`);
  } else if (definition.kind === 'enum' && typeof value !== 'string') {
    throw new Error(`${definition.id} must be a string.`);
  }
}

function parseExtraRamps(value: unknown): Record<string, RampInput> {
  if (typeof value !== 'string') throw new Error('Extra ramps must be a JSON object string.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('Extra ramps must contain valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('Extra ramps must be a JSON object.');
  for (const [name, ramp] of Object.entries(parsed)) {
    if (
      !/^[a-z][a-z0-9-]*$/.test(name) ||
      ['neutral', 'accent', 'success', 'warning', 'danger'].includes(name)
    )
      throw new Error(`Invalid extra ramp name "${name}".`);
    if (!ramp || typeof ramp !== 'object' || Array.isArray(ramp))
      throw new Error(`Extra ramp "${name}" must be an object.`);
    const input = ramp as Record<string, unknown>;
    if (
      typeof input.hue !== 'number' ||
      !Number.isFinite(input.hue) ||
      input.hue < 0 ||
      input.hue > 360 ||
      typeof input.chroma !== 'number' ||
      !Number.isFinite(input.chroma) ||
      input.chroma < 0 ||
      input.chroma > 0.4
    )
      throw new Error(`Extra ramp "${name}" needs a hue from 0–360 and chroma from 0–0.4.`);
    if (input.anchor !== undefined && (typeof input.anchor !== 'string' || !parse(input.anchor)))
      throw new Error(`Extra ramp "${name}" has an invalid anchor color.`);
  }
  return parsed as Record<string, RampInput>;
}

export function resolveStyle(
  style: StyleFile,
  baselines: Record<string, StyleFile> = {},
  seen = new Set<string>(),
): StyleFile {
  validateStyle(style);
  if (style.id === style.extends && style.id !== 'su' && style.id !== 'yu')
    throw new Error(`Style inheritance cycle at "${style.id}".`);
  if (seen.has(style.id)) throw new Error(`Style inheritance cycle at "${style.id}".`);
  seen.add(style.id);
  const parent = baselines[style.extends];
  if (!parent && Object.keys(baselines).length && style.id !== style.extends)
    throw new Error(`Parent style "${style.extends}" was not found.`);
  const resolvedParent = !parent
    ? undefined
    : parent.id === style.id
      ? { ...parent, params: clone(parent.params) }
      : resolveStyle(parent, baselines, seen);
  const result = {
    ...(resolvedParent ?? {}),
    ...clone(style),
    params: { ...(resolvedParent?.params ?? {}), ...clone(style.params) },
    extraCss: style.extraCss || resolvedParent?.extraCss || '',
  } as StyleFile;
  seen.delete(style.id);
  return result;
}

export function diff(a: StyleFile, b: StyleFile) {
  const ids = new Set([...Object.keys(a.params), ...Object.keys(b.params)]);
  return [...ids]
    .filter((id) => JSON.stringify(a.params[id]) !== JSON.stringify(b.params[id]))
    .map((id) => ({
      id,
      before: a.params[id],
      after: b.params[id],
    }));
}

type TransformContext = {
  baselines?: Record<string, StyleFile>;
  baselineParams?: Record<string, unknown>;
  baselineParamsByRoot?: Partial<Record<'su' | 'yu', Record<string, unknown>>>;
};

function resolvedInput(style: StyleFile, context: TransformContext) {
  return context.baselines ? resolveStyle(style, context.baselines) : style;
}

function rootFor(style: StyleFile, context: TransformContext) {
  let id = style.extends;
  const seen = new Set([style.id]);
  while (id !== 'su' && id !== 'yu' && context.baselines?.[id]) {
    if (seen.has(id)) throw new Error(`Style inheritance cycle at "${id}".`);
    seen.add(id);
    id = context.baselines[id]!.extends;
  }
  return id;
}

function baselineFor(style: StyleFile, context: TransformContext) {
  const root = rootFor(style, context);
  if (root === 'su' || root === 'yu')
    return context.baselineParamsByRoot?.[root] ?? context.baselineParams ?? {};
  return context.baselineParams ?? {};
}

export function mix(
  base: StyleFile,
  sources: Record<string, StyleFile>,
  context: TransformContext = {},
) {
  const effectiveBase = resolvedInput(base, context);
  const params = clone(effectiveBase.params);
  const outputBaseline = baselineFor(base, context);
  const origins: Record<string, string> = {};
  const groups: Record<string, string> = {};
  for (const [group, source] of Object.entries(sources)) {
    if (!parameterRegistry.some((parameter) => parameter.group === group))
      throw new Error(`Unknown parameter group "${group}".`);
    const effectiveSource = resolvedInput(source, context);
    const sourceBaseline = baselineFor(source, context);
    groups[group] = source.id;
    for (const parameter of parameterRegistry) {
      if (parameter.group !== group) continue;
      const sourceValue = effectiveSource.params[parameter.id] ?? sourceBaseline[parameter.id];
      if (
        sourceValue !== undefined &&
        JSON.stringify(sourceValue) !== JSON.stringify(outputBaseline[parameter.id])
      ) {
        params[parameter.id] = clone(sourceValue);
        origins[parameter.id] = source.id;
      } else if (parameter.id in params) {
        delete params[parameter.id];
        origins[parameter.id] = source.id;
      }
    }
  }
  const result: StyleFile = {
    ...base,
    id: `${base.id}-mix`,
    name: `${base.name} mix`,
    extends: rootFor(base, context),
    params,
    sources: origins,
    provenance: { operation: 'mix', base: base.id, groups },
  };
  if (effectiveBase.extraCss) result.extraCss = effectiveBase.extraCss;
  return result;
}

function interpolateValue(parameter: Parameter, a: unknown, b: unknown, t: number): unknown {
  if (parameter.kind === 'color' && typeof a === 'string' && typeof b === 'string') {
    const start = toOklch(a) as Oklch | undefined;
    const end = toOklch(b) as Oklch | undefined;
    if (!start || !end) return t < 0.5 ? a : b;
    const h1 = start.h ?? 0;
    const h2 = end.h ?? h1;
    const delta = ((h2 - h1 + 540) % 360) - 180;
    const color: Oklch = {
      mode: 'oklch',
      l: start.l + (end.l - start.l) * t,
      c: start.c + (end.c - start.c) * t,
      h: (h1 + delta * t + 360) % 360,
      alpha: (start.alpha ?? 1) + ((end.alpha ?? 1) - (start.alpha ?? 1)) * t,
    };
    return formatOklch(color);
  }
  if (
    (parameter.kind === 'curve' || parameter.kind === 'easing') &&
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length
  )
    return a.map((value, index) => Number(value) + (Number(b[index]) - Number(value)) * t);
  if (parameter.kind === 'step' && parameter.perMode) {
    const asModes = (value: unknown): Record<string, number> | undefined => {
      if (typeof value === 'number') return { light: value, dark: value };
      if (value && typeof value === 'object' && !Array.isArray(value))
        return value as Record<string, number>;
      return undefined;
    };
    const left = asModes(a);
    const right = asModes(b);
    if (left && right && (typeof a === 'object' || typeof b === 'object')) {
      const steps: Record<string, number> = {};
      for (const mode of new Set([...Object.keys(left), ...Object.keys(right)])) {
        const start = left[mode];
        const end = right[mode];
        if (start !== undefined && end !== undefined)
          steps[mode] = Math.round(start + (end - start) * t);
        else if (t < 0.5 && start !== undefined) steps[mode] = start;
        else if (t >= 0.5 && end !== undefined) steps[mode] = end;
      }
      return steps;
    }
  }
  if (typeof a === 'number' && typeof b === 'number') {
    const shorterHue = parameter.kind === 'hue' && parameter.range?.[0] === 0;
    const delta = shorterHue ? ((b - a + 540) % 360) - 180 : b - a;
    const value = shorterHue ? (a + delta * t + 360) % 360 : a + delta * t;
    return parameter.kind === 'step' ? Math.round(value) : value;
  }
  return t < 0.5 ? clone(a) : clone(b);
}

export function interpolate(
  a: StyleFile,
  b: StyleFile,
  t: number,
  context: TransformContext = {},
): StyleFile {
  if (!Number.isFinite(t)) throw new Error('Interpolation position must be a finite number.');
  const amount = Math.max(0, Math.min(1, t));
  const leftStyle = resolvedInput(a, context);
  const rightStyle = resolvedInput(b, context);
  const leftBaseline = baselineFor(a, context);
  const rightBaseline = baselineFor(b, context);
  const params: Record<string, unknown> = {};
  const ids = new Set([...Object.keys(leftStyle.params), ...Object.keys(rightStyle.params)]);
  for (const parameter of parameterRegistry)
    if (JSON.stringify(leftBaseline[parameter.id]) !== JSON.stringify(rightBaseline[parameter.id]))
      ids.add(parameter.id);
  for (const id of ids) {
    const definition = registryById.get(id)!;
    const left = leftStyle.params[id] ?? leftBaseline[id];
    const right = rightStyle.params[id] ?? rightBaseline[id];
    if (left === undefined || right === undefined) {
      // Without the inherited value, there is no numeric endpoint to blend.
      // Keep the appropriate sparse override at each side of the midpoint.
      const chosen = amount < 0.5 ? left : right;
      if (chosen !== undefined) params[id] = clone(chosen);
    } else {
      const value =
        amount === 0
          ? clone(left)
          : amount === 1
            ? clone(right)
            : interpolateValue(definition, left, right, amount);
      if (JSON.stringify(value) !== JSON.stringify(leftBaseline[id])) params[id] = value;
    }
  }
  const result: StyleFile = {
    ...a,
    id: `${a.id}-to-${b.id}-${amount}`,
    name: `${a.name} to ${b.name} ${amount}`,
    extends: rootFor(a, context),
    modes: [...(amount < 0.5 ? a.modes : b.modes)],
    params,
    extraCss: (amount < 0.5 ? leftStyle.extraCss : rightStyle.extraCss) ?? '',
    provenance: { operation: 'interpolate', from: a.id, to: b.id, t: amount },
  };
  delete result.sources;
  return result;
}

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function variedValue(parameter: Parameter, current: unknown, spread: number, random: () => number) {
  const offset = () => random() * 2 - 1;
  if (typeof current === 'number' && parameter.range) {
    const [minimum, maximum] = parameter.range;
    const raw = current + offset() * (maximum - minimum) * spread;
    const value =
      parameter.kind === 'hue' && minimum === 0
        ? ((raw % 360) + 360) % 360
        : clamp(raw, minimum, maximum);
    return parameter.kind === 'step' ? Math.round(value) : value;
  }
  if (
    parameter.kind === 'step' &&
    parameter.perMode &&
    current &&
    typeof current === 'object' &&
    !Array.isArray(current) &&
    parameter.range
  ) {
    const [minimum, maximum] = parameter.range;
    return Object.fromEntries(
      Object.entries(current).map(([mode, value]) => [
        mode,
        Math.round(
          clamp(Number(value) + offset() * (maximum - minimum) * spread, minimum, maximum),
        ),
      ]),
    );
  }
  if (parameter.kind === 'curve' && Array.isArray(current) && parameter.range) {
    const [minimum, maximum] = parameter.range;
    return current.map((value) =>
      clamp(Number(value) + offset() * (maximum - minimum) * spread, minimum, maximum),
    );
  }
  if (parameter.kind === 'easing' && Array.isArray(current) && current.length === 4)
    return current.map((value) => clamp(Number(value) + offset() * spread, 0, 1));
  if (parameter.kind === 'color' && typeof current === 'string') {
    const color = toOklch(current) as Oklch | undefined;
    if (!color) return undefined;
    return formatOklch({
      ...color,
      l: clamp(color.l + offset() * spread, 0, 1),
      c: clamp(color.c + offset() * 0.4 * spread, 0, 0.4),
      h: ((color.h ?? 0) + offset() * 180 * spread + 360) % 360,
    });
  }
  if ((parameter.kind === 'enum' || parameter.kind === 'font') && parameter.options?.length)
    return parameter.options[Math.floor(random() * parameter.options.length)];
  return undefined;
}

export function vary(
  style: StyleFile,
  options: {
    params: string[];
    spread: number;
    count: number;
    seed: number;
    /** Current resolved values, supplied by the caller for inherited parameters. */
    baselineParams?: Record<string, unknown>;
    baselines?: Record<string, StyleFile>;
  },
) {
  if (!Number.isInteger(options.count) || options.count < 1 || options.count > 100)
    throw new Error('Variation count must be a whole number from 1 to 100.');
  if (!Number.isInteger(options.seed)) throw new Error('Variation seed must be a whole number.');
  if (!Number.isFinite(options.spread) || options.spread < 0 || options.spread > 1)
    throw new Error('Variation spread must be from 0 to 1.');
  if (!options.params.length) throw new Error('Choose at least one parameter or group to vary.');
  const random = seeded(options.seed);
  const selected = options.params.flatMap((pattern) => {
    const regex = new RegExp(
      `^${pattern
        .split('*')
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*')}$`,
    );
    return parameterRegistry
      .filter((parameter) => parameter.group === pattern || regex.test(parameter.id))
      .map((parameter) => parameter.id);
  });
  if (!selected.length) throw new Error('No parameters matched the variation selection.');
  const effective = resolvedInput(style, options);
  const root = rootFor(style, options);
  const baseline = baselineFor(style, options);
  const unique = [...new Set(selected)];
  if (
    !unique.some((id) => {
      const parameter = registryById.get(id)!;
      const current = effective.params[id] ?? baseline[id];
      return (
        current !== undefined &&
        ((typeof current === 'number' && !!parameter.range) ||
          (parameter.kind === 'step' && typeof current === 'object') ||
          (parameter.kind === 'curve' && Array.isArray(current)) ||
          (parameter.kind === 'easing' && Array.isArray(current)) ||
          (parameter.kind === 'color' && typeof current === 'string' && !!toOklch(current)) ||
          !!parameter.options?.length)
      );
    })
  )
    throw new Error('The selected parameters have no values that can vary.');
  return Array.from({ length: options.count }, (_, index) => {
    const params = clone(effective.params);
    for (const id of unique) {
      const parameter = registryById.get(id)!;
      const current = params[id] ?? baseline[id];
      const varied = variedValue(parameter, current, options.spread, random);
      if (varied !== undefined) params[id] = varied;
    }
    const result: StyleFile = {
      ...style,
      id: `${style.id}-variation-${index + 1}`,
      name: `${style.name} variation ${index + 1}`,
      extends: root,
      author: `agent:zao-engine`,
      generated: true,
      params,
      ...(effective.extraCss ? { extraCss: effective.extraCss } : {}),
      provenance: {
        operation: 'vary' as const,
        source: style.id,
        params: [...options.params],
        spread: options.spread,
        count: options.count,
        seed: options.seed,
        index,
      },
    };
    delete result.sources;
    return result;
  });
}

export function sweep(style: StyleFile, parameterId: string, values: unknown[]) {
  const parameter = registryById.get(parameterId);
  if (!parameter) throw new Error(`Unknown style parameter "${parameterId}".`);
  if (!values.length) throw new Error('A sweep needs at least one value.');
  for (const value of values) validateParameter(parameter, value);
  return values.map((value, index) => {
    const result: StyleFile = {
      ...style,
      id: `${style.id}-sweep-${index + 1}`,
      name: `${style.name} sweep ${index + 1}`,
      author: 'agent:zao-engine',
      generated: true,
      params: { ...style.params, [parameterId]: clone(value) },
      provenance: {
        operation: 'sweep',
        source: style.id,
        parameter: parameterId,
        values: clone(values),
        index,
      },
    };
    delete result.sources;
    return result;
  });
}

function cssValue(value: unknown, kind?: Parameter['kind']): string {
  if (kind === 'easing' && Array.isArray(value)) return `cubic-bezier(${value.join(', ')})`;
  if (kind === 'font' && Array.isArray(value))
    return value
      .map((family) =>
        typeof family === 'string' && /\s/.test(family) ? `"${family}"` : String(family),
      )
      .join(', ');
  if (kind === 'font' && typeof value === 'string' && /\s/.test(value) && !/[,'"]/.test(value))
    return `"${value}"`;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object' && 'value' in value && 'unit' in value)
    return `${String(value.value)}${String(value.unit)}`;
  return JSON.stringify(value);
}

export function toCssVars(style: StyleFile, context: CssContext) {
  const resolved = resolveStyle(style, context.baselines);
  const vars = { ...context.baseVariables };
  const paletteParams = Object.entries(resolved.params).filter(([id]) => id.startsWith('color.'));
  const modeParams = Object.entries(resolved.params).filter(([id]) => id.startsWith('mode.'));
  if ((paletteParams.length || modeParams.length) && context.paletteInput) {
    const finish = structuredClone(context.paletteInput);
    for (const [id, value] of paletteParams) {
      const [, ramp, property, modeOrStep, maybeStep] = id.split('.');
      if (id === 'color.contrast' && typeof value === 'number') finish.contrast = value;
      else if (id === 'color.ramp.extra') finish.extraRamps = parseExtraRamps(value);
      else if (ramp && ['neutral', 'accent', 'success', 'warning', 'danger'].includes(ramp)) {
        const input = finish[ramp as keyof typeof finish];
        if (!input || typeof input !== 'object' || !('hue' in input)) continue;
        const rampInput = input as import('./types.ts').RampInput;
        if (property === 'hue' && typeof value === 'number') rampInput.hue = value;
        else if (property === 'chroma' && typeof value === 'number') rampInput.chroma = value;
        else if (property === 'hue-drift' && typeof value === 'number') rampInput.hueDrift = value;
        else if (property === 'anchor' && typeof value === 'string') rampInput.anchor = value;
        else if (
          property === 'solid' &&
          (modeOrStep === 'light' || modeOrStep === 'dark') &&
          typeof value === 'number'
        ) {
          rampInput.solid = {
            ...(rampInput.solid ?? {}),
            [modeOrStep]: value,
          };
        } else if (property === 'curve' && modeOrStep === 'chroma' && Array.isArray(value))
          rampInput.chromaCurve = value as number[];
        else if (
          property === 'curve' &&
          modeOrStep === 'lightness' &&
          (maybeStep === 'light' || maybeStep === 'dark') &&
          Array.isArray(value)
        ) {
          rampInput.lightness = {
            ...(rampInput.lightness ?? { light: [], dark: [] }),
            [maybeStep]: value as number[],
          };
        } else if (
          property === 'pin' &&
          (modeOrStep === 'light' || modeOrStep === 'dark') &&
          maybeStep &&
          typeof value === 'string'
        ) {
          const pinMode = modeOrStep as 'light' | 'dark';
          const pins = rampInput.pins ?? {};
          rampInput.pins = { ...pins, [pinMode]: { ...(pins[pinMode] ?? {}), [maybeStep]: value } };
        }
      }
    }
    const { documents } = generatePaletteDocuments({ [context.theme]: finish });
    const palette = (
      documents[context.theme] as {
        palette: Record<
          string,
          {
            [mode: string]: Record<
              string,
              { $value: { colorSpace: string; components: number[] } }
            >;
          }
        >;
      }
    ).palette;
    const cssColor = (value: { colorSpace: string; components: number[] }) =>
      `${value.colorSpace}(${value.components.map((part) => Number(part.toFixed(4))).join(' ')})`;
    for (const [ramp, modes] of Object.entries(palette)) {
      if (!modes || typeof modes !== 'object') continue;
      for (const [mode, steps] of Object.entries(modes)) {
        if (!steps || typeof steps !== 'object') continue;
        for (const [step, token] of Object.entries(steps)) {
          if (token?.$value?.components)
            vars[`--zao-palette-${ramp}-${mode}-${step}`] = cssColor(token.$value);
        }
      }
    }
    const aliases = { ...(context.paletteAliases ?? {}) };
    for (const [id, value] of modeParams) {
      const step =
        typeof value === 'number'
          ? value
          : value && typeof value === 'object' && !Array.isArray(value)
            ? (value as Record<string, unknown>)[context.mode]
            : undefined;
      if (typeof step !== 'number') continue;
      const parameter = registryById.get(id);
      const semanticVariable = parameter?.cssVariables[0];
      const alias = semanticVariable ? aliases[semanticVariable] : undefined;
      if (alias) aliases[semanticVariable!] = { ...alias, step };
    }
    for (const [variable, alias] of Object.entries(aliases)) {
      const token = palette[alias.ramp]?.[alias.mode]?.[String(alias.step)];
      if (token?.$value) vars[variable] = cssColor(token.$value);
    }
  }
  const directParams = Object.entries(resolved.params).sort(
    ([left], [right]) =>
      Number(/^type\.(display|title)\.weight$/.test(left)) -
      Number(/^type\.(display|title)\.weight$/.test(right)),
  );
  for (const [id, value] of directParams) {
    const definition = registryById.get(id);
    if (!definition) continue;
    if (id.startsWith('color.') || id.startsWith('mode.')) continue;
    for (const variable of definition.cssVariables) {
      if (
        id.startsWith('font.weight.') &&
        variable.startsWith('--zao-type-') &&
        context.baseVariables[variable] !== context.baseVariables[definition.cssVariables[0]!]
      )
        continue;
      vars[variable] =
        typeof value === 'number' && definition.unit
          ? `${value}${definition.unit}`
          : cssValue(value, definition.kind);
    }
  }
  if (resolved.params['space.unit'] !== undefined) {
    const unit = resolved.params['space.unit'] as number;
    for (const step of [
      '0',
      '0.5',
      '1',
      '1.5',
      '2',
      '3',
      '4',
      '5',
      '6',
      '8',
      '10',
      '12',
      '16',
      '20',
    ])
      vars[`--zao-space-${step.replace('.', '-')}`] = `${unit * Number(step)}px`;
  }
  if (
    resolved.params['shadow.soft'] ||
    resolved.params['shadow.strong'] ||
    resolved.params['material.overlay.highlight']
  ) {
    let shadow = context.baseVariables['--zao-material-overlay-shadow'] ?? '';
    for (const variable of [
      '--zao-color-shadow-soft',
      '--zao-color-shadow-strong',
      '--zao-material-overlay-highlight',
    ]) {
      const original = context.baseVariables[variable];
      const replacement = vars[variable];
      if (original && replacement) shadow = shadow.replaceAll(original, replacement);
    }
    vars['--zao-material-overlay-shadow'] = shadow;
  }
  if (Object.keys(resolved.params).some((id) => id.startsWith('font.') || id.startsWith('type.')))
    for (const role of [
      'display',
      'title',
      'heading',
      'body',
      'button',
      'label',
      'caption',
      'code',
    ]) {
      const prefix = `--zao-type-${role}`;
      const family = vars[`${prefix}-font-family`];
      const size = vars[`${prefix}-font-size`];
      const weight = vars[`${prefix}-font-weight`];
      const lineHeight = vars[`${prefix}-line-height`];
      if (family && size && weight && lineHeight)
        vars[prefix] = `${weight} ${size}/${lineHeight} ${family}`;
    }
  return vars;
}
