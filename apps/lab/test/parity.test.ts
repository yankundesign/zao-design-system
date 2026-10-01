import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { baselineStyles, parameterRegistry, paletteAliasesFromTokens } from '@zao/engine';
import suLight from '@zao/tokens/json/su-light';
import { baselineVariables, contexts, renderVariables } from '../lib/token-data';

const css = readFileSync(
  resolve(import.meta.dirname, '../../../packages/tokens/dist/zao.css'),
  'utf8',
);

function shippedDeclarations(contextId: string) {
  const selector =
    contextId === 'su-light'
      ? '[data-zao-theme="su"][data-zao-mode="light"] {'
      : `[data-zao-theme="${contextId.split('-')[0]}"][data-zao-mode="dark"] {`;
  const marker = css.indexOf(selector);
  if (marker < 0) throw new Error(`Could not find ${selector} in the token CSS.`);
  const start = marker + selector.length;
  const end = css.indexOf('\n}', start);
  if (end < 0) throw new Error(`Could not find the end of ${selector}.`);
  return Object.fromEntries(
    [...css.slice(start, end).matchAll(/(--zao-[\w-]+):\s*([^;]+);/g)].map((match) => [
      match[1]!,
      match[2]!.trim(),
    ]),
  );
}

function resolveAliases(
  declarations: Record<string, string>,
  variable: string,
  seen = new Set<string>(),
): string {
  const raw = declarations[variable];
  if (raw === undefined) throw new Error(`Missing ${variable} from token CSS.`);
  if (seen.has(variable)) throw new Error(`CSS alias cycle at ${variable}.`);
  seen.add(variable);
  const value = raw.replace(/var\((--zao-[\w-]+)\)/g, (_match, referenced: string) =>
    resolveAliases(declarations, referenced, seen),
  );
  seen.delete(variable);
  return value.replace(/\s+/g, ' ').trim();
}

function oklchParts(value: string) {
  const match = value.match(/^oklch\(([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/);
  if (!match) throw new Error(`Invalid OKLCH value: ${value}`);
  const lightness = match[1]!.endsWith('%')
    ? Number(match[1]!.slice(0, -1)) / 100
    : Number(match[1]);
  return [lightness, Number(match[2]), Number(match[3]), Number(match[4] ?? 1)];
}

function expectEquivalentCss(actual: string, expected: string, variable: string) {
  const colors = /oklch\([^)]+\)/g;
  const actualColors = actual.match(colors) ?? [];
  const expectedColors = expected.match(colors) ?? [];
  expect(actualColors.length, variable).toBe(expectedColors.length);
  for (let index = 0; index < actualColors.length; index++) {
    const left = oklchParts(actualColors[index]!);
    const right = oklchParts(expectedColors[index]!);
    // Terrazzo rounds CSS hue and lightness more than the resolved token JSON.
    expect(Math.abs(left[0]! - right[0]!), variable).toBeLessThanOrEqual(0.0001);
    expect(Math.abs(left[1]! - right[1]!), variable).toBeLessThanOrEqual(0.0001);
    expect(Math.abs(left[2]! - right[2]!), variable).toBeLessThanOrEqual(0.1);
    expect(Math.abs(left[3]! - right[3]!), variable).toBeLessThanOrEqual(0.0001);
  }
  const scaffold = (value: string) =>
    value
      .replace(colors, '@color')
      .replace(
        /rgb\(([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\s*\/\s*([\d.]+)\)/g,
        (_match, red: string, green: string, blue: string, alpha: string) =>
          `color(srgb ${Number(red) / 100} ${Number(green) / 100} ${Number(blue) / 100} / ${alpha})`,
      )
      .replace(/"([A-Za-z][A-Za-z0-9-]*)"/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  expect(scaffold(actual), variable).toBe(scaffold(expected));
}

describe('lab baseline parity with the published token build', () => {
  it('has an editor parameter for every semantic palette step role', () => {
    const aliases = paletteAliasesFromTokens(suLight.tokens);
    const editable = new Set(
      parameterRegistry
        .filter((parameter) => parameter.layer === 'mode')
        .map((parameter) => parameter.cssVariables[0]),
    );
    for (const [variable, alias] of Object.entries(aliases)) {
      if (!variable.startsWith('--zao-color-')) continue;
      if (alias.step === 'contrast') continue;
      expect(editable.has(variable), variable).toBe(true);
    }
  });
  for (const context of contexts) {
    it(`${context.id} renders every built variable exactly`, () => {
      const style = baselineStyles()[context.theme];
      const output = renderVariables(style, context.id);
      const resolved = baselineVariables(context.id);
      const declarations = shippedDeclarations(context.id);
      expect(output).toEqual(resolved);
      for (const [variable, value] of Object.entries(output)) {
        expectEquivalentCss(resolveAliases(declarations, variable), value, variable);
      }
    });
  }
});
