/**
 * @zao/react
 *
 * Milestone 1 ships the foundation only: the Tailwind theme (`@zao/react/theme.css`),
 * the fonts (`@zao/react/fonts.css`) and the helpers below. Components arrive in
 * milestone 2, built on Base UI.
 */

export type Theme = 'su' | 'yu';
export type Mode = 'light' | 'dark';

/**
 * Data attributes that apply a finish to an element and its children.
 * Leave `mode` out to follow the reader's OS setting (Su) or the finish's default (Yu is dark first).
 *
 * @example
 * <html {...finish('su')}>
 * <section {...finish('yu', 'dark')}>
 */
export function finish(theme: Theme, mode?: Mode) {
  return {
    'data-zao-theme': theme,
    ...(mode ? { 'data-zao-mode': mode } : {}),
  } as const;
}
