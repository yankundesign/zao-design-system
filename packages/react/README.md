# @zao/react

ZAO for React and Tailwind CSS v4. Milestone 1 ships the foundation: the Tailwind theme, the fonts and a small helper. Components built on [Base UI](https://base-ui.com) arrive in milestone 2.

## Use

In your app's main CSS file:

```css
@import 'tailwindcss';
@import '@zao/react/fonts.css';
@import '@zao/react/theme.css';
```

Then set a finish on `<html>` or any element:

```tsx
import { finish } from '@zao/react';

<html {...finish('su')}>           // Su, follows the OS light/dark setting
<section {...finish('yu')}>        // a Yu island, dark first
```

## What the theme gives you

Tailwind's defaults are removed. Only ZAO's values compile.

| Need            | Utilities                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Backgrounds     | `bg-canvas` `bg-surface` `bg-sunken` `bg-overlay` `bg-hover` `bg-active` `bg-accent` `bg-accent-subtle` `bg-success` `bg-warning` `bg-danger` … |
| Text            | `text-default` `text-muted` `text-disabled` `text-on-accent` `text-accent` `text-success` `text-warning` `text-danger`                          |
| Borders         | `border-subtle` `border-default` `border-strong` `border-accent` …                                                                              |
| Type roles      | `type-display` `type-title` `type-heading` `type-body` `type-label` `type-caption` `type-code`                                                  |
| Spacing         | Tailwind numbers are fen (1 fen = 4px): `p-3` is 12px                                                                                           |
| Radius          | `rounded-control` `rounded-action` `rounded-surface` `rounded-overlay` `rounded-pill`                                                           |
| Floating layers | `material-overlay`: opaque in Su, glass in Yu, with reduced-transparency fallbacks                                                              |
| Details         | `trim-label` (trim control labels to cap height), `figures-tabular`, `figures-id`                                                               |
| Motion          | `duration-fast` `duration-base` `ease-standard`                                                                                                 |

## Fonts

`fonts.css` self-hosts Geist and Geist Mono (from the `geist` package, with all 26 OpenType features) and Newsreader (Latin and Latin Extended, with optical sizes). Fallback faces are sized with [Capsize](https://seek-oss.github.io/capsize/) so the swap doesn't shift layout. All three fonts are under the SIL Open Font License 1.1.
