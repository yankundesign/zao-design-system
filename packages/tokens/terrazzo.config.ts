import { defineConfig } from '@terrazzo/cli';
import css from '@terrazzo/plugin-css';
import { cssVar } from './contexts.ts';

/**
 * Builds dist/zao.css from the resolver.
 *
 * Every context is emitted as its own block, so a finish can be applied to any
 * element, not only :root:
 *
 *   <html data-zao-theme="su">                    Su, follows the OS light/dark setting
 *   <html data-zao-theme="su" data-zao-mode="dark">  Su, always dark
 *   <section data-zao-theme="yu">                 a Yu island (dark first)
 */
export default defineConfig({
  tokens: ['./src/zao.resolver.json'],
  outDir: './dist/',
  plugins: [
    css({
      filename: 'zao.css',
      variableName: (token) => cssVar(token.id),
      permutations: [
        {
          input: { theme: 'su', mode: 'light' },
          prepare: (contents) =>
            `:root,\n[data-zao-theme="su"],\n[data-zao-theme="su"][data-zao-mode="light"] {\n  color-scheme: light;\n  ${contents}\n}`,
        },
        {
          input: { theme: 'su', mode: 'dark' },
          prepare: (contents) =>
            `@media (prefers-color-scheme: dark) {\n  :root:not([data-zao-mode]),\n  [data-zao-theme="su"]:not([data-zao-mode]) {\n    color-scheme: dark;\n    ${contents}\n  }\n}\n\n[data-zao-theme="su"][data-zao-mode="dark"] {\n  color-scheme: dark;\n  ${contents}\n}`,
        },
        {
          input: { theme: 'yu', mode: 'dark' },
          prepare: (contents) =>
            `[data-zao-theme="yu"]:not([data-zao-mode]),\n[data-zao-theme="yu"][data-zao-mode="dark"] {\n  color-scheme: dark;\n  ${contents}\n}`,
        },
      ],
    }),
  ],
});
