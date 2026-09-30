/**
 * The theme × mode combinations ZAO ships. Yu light is planned for v0.2, so it is
 * not built yet even though the resolver can produce it.
 */
export const contexts = [
  { id: 'su-light', theme: 'su', mode: 'light' },
  { id: 'su-dark', theme: 'su', mode: 'dark' },
  { id: 'yu-dark', theme: 'yu', mode: 'dark' },
] as const;

export type Context = (typeof contexts)[number];
export type Theme = Context['theme'];
export type Mode = Context['mode'];

/** CSS custom property for a token ID, e.g. color.bg.canvas → --zao-color-bg-canvas */
export const cssVar = (id: string) => `--zao-${id.replaceAll('.', '-')}`;
