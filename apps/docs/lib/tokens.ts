import suLight from '@zao/tokens/json/su-light';
import suDark from '@zao/tokens/json/su-dark';

export type ContextId = 'su-light' | 'su-dark';

export interface TokenEntry {
  type: string;
  cssVar: string;
  value: unknown;
  aliasOf?: string;
  description?: string;
}

export interface TokenFile {
  context: { id: string; theme: string; mode: string };
  tokens: Record<string, TokenEntry>;
}

export const tokenFiles: Record<ContextId, TokenFile> = {
  'su-light': suLight as TokenFile,
  'su-dark': suDark as TokenFile,
};

/** Token IDs are identical in every context (a test in @zao/tokens guarantees it). */
export const allTokens = tokenFiles['su-light'].tokens;

export function tokensIn(prefix: string) {
  return Object.keys(allTokens).filter((id) => id.startsWith(prefix));
}
