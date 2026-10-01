import { CHROMA, LIGHTNESS } from './palette.ts';
import { parameterRegistry } from './registry/index.ts';
import type { CssContext, FinishInput, Parameter } from './types.ts';

export interface ResolvedToken {
  type: string;
  cssVar: string;
  value: unknown;
  aliasOf?: string;
}

function cssValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value))
    return value.map((part) => (/\s/.test(String(part)) ? `"${part}"` : String(part))).join(', ');
  if (value && typeof value === 'object' && 'value' in value && 'unit' in value)
    return `${String(value.value)}${String(value.unit)}`;
  throw new Error('A resolved token has no CSS value.');
}

/** Use the resolved token JSON, including the longhand variables Terrazzo emits for type roles. */
export function baseVariablesFromTokens(tokens: Record<string, ResolvedToken>) {
  const variables: Record<string, string> = {};
  for (const token of Object.values(tokens)) {
    if (token.type !== 'typography') {
      variables[token.cssVar] = cssValue(token.value);
      continue;
    }
    const type = token.value as Record<string, unknown>;
    const family = cssValue(type.fontFamily);
    const size = cssValue(type.fontSize);
    const weight = cssValue(type.fontWeight);
    const lineHeight = cssValue(type.lineHeight);
    const tracking = cssValue(type.letterSpacing);
    variables[`${token.cssVar}-font-family`] = family;
    variables[`${token.cssVar}-font-size`] = size;
    variables[`${token.cssVar}-font-weight`] = weight;
    variables[`${token.cssVar}-line-height`] = lineHeight;
    variables[`${token.cssVar}-letter-spacing`] = tracking;
    variables[token.cssVar] = `${weight} ${size}/${lineHeight} ${family}`;
  }
  return variables;
}

/** Values shown by editor controls before a style overrides them. */
export function baselineParameterValues(
  palette: FinishInput,
  variables: Record<string, string>,
  aliases: CssContext['paletteAliases'] = {},
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const parameter of parameterRegistry) {
    const id = parameter.id;
    if (id === 'color.contrast') {
      values[id] = palette.contrast;
      continue;
    }
    if (id === 'color.ramp.extra') {
      values[id] = JSON.stringify(palette.extraRamps ?? {}, null, 2);
      continue;
    }
    const rampMatch = id.match(/^color\.(neutral|accent|success|warning|danger)\.(.+)$/);
    if (rampMatch) {
      const name = rampMatch[1] as keyof Pick<
        FinishInput,
        'neutral' | 'accent' | 'success' | 'warning' | 'danger'
      >;
      const input = palette[name];
      const field = rampMatch[2]!;
      if (field === 'hue' || field === 'chroma') values[id] = input[field];
      else if (field === 'hue-drift') values[id] = input.hueDrift ?? 0;
      else if (field === 'anchor') values[id] = input.anchor ?? '';
      else if (field === 'curve.chroma')
        values[id] = [...(input.chromaCurve ?? CHROMA[name === 'neutral' ? 'neutral' : 'color'])];
      else if (field.startsWith('curve.lightness.')) {
        const mode = field.split('.').at(-1) as 'light' | 'dark';
        values[id] = [
          ...(input.lightness?.[mode] ?? LIGHTNESS[name === 'neutral' ? 'neutral' : 'color'][mode]),
        ];
      } else if (field.startsWith('solid.')) {
        const mode = field.split('.').at(-1) as 'light' | 'dark';
        values[id] =
          input.solid?.[mode] ?? LIGHTNESS[name === 'neutral' ? 'neutral' : 'color'][mode][8];
      } else if (field.startsWith('pin.')) values[id] = '';
      continue;
    }
    if (id.startsWith('mode.')) {
      const alias = aliases?.[parameter.cssVariables[0]!];
      if (alias) values[id] = alias.step;
      continue;
    }
    const raw = variables[parameter.cssVariables[0]!];
    if (raw === undefined) continue;
    values[id] = parameterValue(raw, parameter);
  }
  return values;
}

function parameterValue(raw: string, parameter: Parameter): unknown {
  if (
    parameter.kind === 'number' ||
    parameter.kind === 'hue' ||
    parameter.kind === 'chroma' ||
    parameter.kind === 'lightness' ||
    parameter.kind === 'step' ||
    parameter.kind === 'duration'
  )
    return Number.parseFloat(raw);
  if (parameter.kind === 'easing')
    return raw
      .replace(/^cubic-bezier\(/, '')
      .replace(/\)$/, '')
      .split(',')
      .map((part) => Number.parseFloat(part));
  return raw;
}
