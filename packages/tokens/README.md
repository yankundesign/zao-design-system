# @zao/tokens

ZAO's design tokens in the [W3C Design Tokens (DTCG) 2025.10](https://www.designtokens.org/tr/2025.10/) format, with a [resolver](https://www.designtokens.org/tr/drafts/resolver/) for every finish and mode.

## Use

```css
@import '@zao/tokens/css';
```

```text
<html data-zao-theme="su">                       Su, follows the OS light/dark setting
<html data-zao-theme="su" data-zao-mode="dark">  Su, always dark
<section data-zao-theme="yu">                    a Yu island, dark first
```

Every token is a CSS variable named after its ID: `color.bg.canvas` → `--zao-color-bg-canvas`.

For tools and agents, resolved values for each context are in `@zao/tokens/json/su-light`, `su-dark` and `yu-dark`, and `@zao/tokens` exports the context list and every token ID as a TypeScript type.

## How it's built

```
src/
  zao.resolver.json        resolution order: structure → theme → mode
  base/                    structure, shared by every finish
    space.tokens.json        the fen unit, spacing, control sizes
    type.tokens.json         families, weights, type roles
  themes/                  finish: radius, material, motion, display face
    su.tokens.json
    yu.tokens.json
  modes/                   semantic colors mapped to palette steps
    light.tokens.json
    dark.tokens.json
  palettes/                generated; do not edit
palette.config.ts          palette inputs per finish
scripts/
  generate-palettes.ts     OKLCH ramps from palette.config.ts
  export-json.ts           resolved JSON and the TypeScript index
terrazzo.config.ts         CSS output, one block per context
test/tokens.test.ts        the promises, measured
```

- **Structure** (`base/`) decides size and layout and is identical in every finish.
- **Finish** (`themes/`) decides look. It may not change the size of anything.
- **Mode** (`modes/`) maps roles to palette steps. Each step has one job: 1–2 backgrounds, 3–5 component fills, 6–8 borders, 9–10 solid fills, 11 secondary text, 12 primary text.

## Palettes

Palettes are generated, not hand-picked. Each finish sets a hue and chroma per ramp, the lightness of the solid step in each mode, and a contrast level. `pnpm palette` writes 12-step ramps for light and dark, gamut-mapped to sRGB, and prints the resulting contrast.

## Tests

`pnpm test` checks that:

- every finish ships the same semantic tokens;
- structural tokens are identical across finishes, and display roles change face but never size or line height;
- text, accent, status and focus colors meet the contrast minimums their descriptions promise, in every shipped context.

Input border contrast (WCAG 1.4.11) is an open todo, to decide with the TextField design.
