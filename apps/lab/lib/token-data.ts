import {
  baseVariablesFromTokens,
  baselineParameterValues,
  baselineStyles,
  paletteAliasesFromTokens,
  toCssVars,
  type CssContext,
  type StyleFile,
} from '@zao/engine';
import suLight from '@zao/tokens/json/su-light';
import suDark from '@zao/tokens/json/su-dark';
import yuDark from '@zao/tokens/json/yu-dark';
import { finishes } from '../../../packages/tokens/palette.config';

export const contexts = [
  { id: 'su-light', theme: 'su', mode: 'light', label: 'Su · light' },
  { id: 'su-dark', theme: 'su', mode: 'dark', label: 'Su · dark' },
  { id: 'yu-dark', theme: 'yu', mode: 'dark', label: 'Yu · dark' },
] as const;

export type ContextId = (typeof contexts)[number]['id'];

const documents = {
  'su-light': suLight,
  'su-dark': suDark,
  'yu-dark': yuDark,
};

export type ContextVariables = Record<ContextId, Record<string, string>>;

export function isContextId(value: unknown): value is ContextId {
  return contexts.some((context) => context.id === value);
}

export function baselineVariables(contextId: ContextId) {
  return baseVariablesFromTokens(documents[contextId].tokens);
}

export function baselineParameters(contextId: ContextId) {
  const context = contexts.find((entry) => entry.id === contextId)!;
  const tokens = documents[contextId].tokens;
  return baselineParameterValues(
    finishes[context.theme],
    baseVariablesFromTokens(tokens),
    paletteAliasesFromTokens(tokens),
  );
}

export function renderVariables(
  style: StyleFile,
  contextId: ContextId,
  savedStyles: StyleFile[] = [],
) {
  const context = contexts.find((entry) => entry.id === contextId)!;
  const tokens = documents[contextId].tokens;
  const baselines = { ...baselineStyles() } as Record<string, StyleFile>;
  for (const saved of savedStyles) baselines[saved.id] = saved;
  const cssContext: CssContext = {
    theme: context.theme,
    mode: context.mode,
    baseVariables: baseVariablesFromTokens(tokens),
    baselines,
    paletteInput: finishes[context.theme],
    paletteAliases: paletteAliasesFromTokens(tokens),
  };
  return toCssVars(style, cssContext);
}

export function renderAllContexts(style: StyleFile, savedStyles: StyleFile[] = []) {
  return Object.fromEntries(
    contexts.map((context) => [context.id, renderVariables(style, context.id, savedStyles)]),
  ) as ContextVariables;
}
