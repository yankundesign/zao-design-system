# Typography research

> **Scope update, Oct 7, 2026:** Current work focuses on Su in light and dark. Yu and its display-face research below are deferred as possible phase 2 reference material.

_ZAO · Sept 29, 2026 · Status: decided_

Live comparison: [ZAO Type Lab](https://claude.ai/artifact/MaKy8YdS6t1LX9U7ymAKV9). It sets every option on the same agent-approval screen in Su and Yu and includes the tests described below.

## Decision

| Role              | Face                                           | Source                                                                   | Used for                                                   |
| ----------------- | ---------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Text (Su and Yu)  | **Geist**                                      | `geist` npm package (Vercel, v1.7.2, OFL)                                | All interface text in both finishes, including Su's titles |
| Display (Yu only) | **Newsreader**, with Noto Serif SC for Chinese | `@fontsource-variable/newsreader`, or a subset of the foundry file (OFL) | Yu page titles, empty states, marketing                    |
| Mono              | **Geist Mono**                                 | `geist` npm package                                                      | Code, keyboard keys, IDs, token names                      |

### What this means in practice

1. **Self-host from the `geist` npm package.** Its Geist has 26 OpenType features, including 11 stylistic sets, tabular figures and case forms. The Google Fonts file has 8. For Geist Mono it's 21 against 5.
2. **The type scale does the optical sizing.** Geist has no optical-size axis, so each step of the scale carries its own tracking: tighter for titles, neutral or slightly open for small labels. This lives in the typography tokens.
3. **Dark mode softens color, not weight.** Geist has no grade axis, and its weight axis changes width (a lighter weight would reflow text when modes switch). Dark mode uses a slightly softer text color instead.
4. **Disambiguation for IDs and codes.** Geist's ss03 (alternate l) and ss05 (alternate I) together separate I, l and 1. Geist Mono already has a slashed zero; its ss09 removes it.
5. **A quiet signature.** Geist is the default in new Next.js projects, so Su's character has to come from tuning: the tracking scale, trimmed control labels, and possibly one or two stylistic sets on by default, such as ss04 (alternate R) or ss06 (alternate G). Decide by eye in the Type Lab.
6. **Newsreader stays at 20px and up.** Its x-height is small (0.426). Leave `font-optical-sizing: auto` on, so a 30px title uses the 30 optical size.
7. **Balance Chinese against Newsreader.** Noto Serif SC will look large beside Newsreader's small lowercase. Declare it with `size-adjust` and tune mixed titles by eye.
8. **Newsreader's features are modest.** The foundry file has 8 (including `case`); the Fontsource Latin file keeps 4 (tabular and proportional figures, ligatures). For display-only use either is fine.

### Stylistic sets available

| Set  | Geist                        | Geist Mono                   |
| ---- | ---------------------------- | ---------------------------- |
| ss01 | No-tail a                    | No-tail a                    |
| ss02 | Alternate a                  | Alternate a                  |
| ss03 | Alternate l                  | Alternate l                  |
| ss04 | Alternate R                  | Alternate R                  |
| ss05 | Alternate I                  | —                            |
| ss06 | Alternate G                  | Alternate G                  |
| ss07 | Alternate arrows             | Alternate arrows             |
| ss08 | Rounded dot                  | Rounded dot                  |
| ss09 | Alternate numbers            | Non-slashed zero             |
| ss10 | Alternative enclosing shapes | Alternative enclosing shapes |
| ss11 | Contextual brand styles      | Coding ligatures             |

### Next steps

- Define the type roles and scale as tokens in milestone 1: display, title, heading, body, label, caption, code, each with size, line height, weight and tracking.
- Pick ZAO's default stylistic sets, if any.
- Set up the `@font-face` declarations with fallback metric overrides so the swap doesn't shift layout.

---

The research below led to this decision.

## The principle

**The text face is structure. The display face is finish.**

Su and Yu share one text face with identical metrics, so no component changes size between themes. This is the only way to pass the brief's architecture test ("adding Yu requires zero component changes"). A theme may change only:

- the **display face**, which is used in display roles only (page titles, empty states, marketing), never in buttons, inputs, tables or labels;
- **width-neutral axes** on the text face, such as grade or roundness;
- color.

## Text face candidates

All five use the OFL license, so they can be bundled in an npm package. Commercial faces (Söhne, Neue Montreal, Suisse) can't ship inside an open-source package. x-height is measured from the font files as a share of the em.

| Face                 | Axes                                                               | x-height | Strength                                                                                                       | Risk                                                                               |
| -------------------- | ------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Inter**            | opsz 14–32, wght 100–900                                           | 0.546    | Built for screens. Optical sizes cover 12px labels up to titles. Richest feature set (39 in the foundry build) | The default face of AI-generated UI. It only reads as a choice if it's tuned       |
| **Mona Sans**        | wdth 75–125, wght 200–900, italic                                  | 0.517    | Adoptable but less expected. The width axis gives Yu expanded titles without a second family                   | No optical sizes. Carries some GitHub flavor                                       |
| **IBM Plex Sans**    | wdth 75–100, wght 100–700                                          | 0.516    | The only family with a matching Chinese sans (Plex Sans SC, released Nov 2024 on npm, not on Google Fonts)     | Reads as IBM/Carbon. The width axis only condenses                                 |
| **Google Sans Flex** | opsz 6–144, wdth 25–151, wght 1–1000, GRAD 0–100, ROND 0–100, slnt | 0.510    | Roundness and grade don't change width (tested), so a theme can be an axis value                               | It's Google's product face, so ZAO looks Google-adjacent. Six-axis files are heavy |
| **Geist**            | wght 100–900                                                       | 0.530    | Crisp, easy to adopt, matched Geist Mono                                                                       | Default in new Next.js projects, so nearly as common as Inter, with fewer axes     |

## Yu display directions

| Direction         | Faces                          | Why                                                                                                                                                                            | Risk                                                                                              |
| ----------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **Song serif**    | Source Serif 4 + Noto Serif SC | Songti (宋体) is named after the Song dynasty, the era of Yingzao Fashi. Noto Serif SC (Source Han Serif) takes its Latin from Source Serif, so the pair was designed together | A serif display on cream is a stock AI look. On dark jade it reads differently; keep it to titles |
| Newsreader        | Newsreader + Noto Serif SC     | Warmer, editorial, optical sizes to 72                                                                                                                                         | No design link to the Chinese serif. Small x-height (0.426)                                       |
| Fraunces, soft    | Fraunces (SOFT 100)            | The soft axis suits a jade finish. Already used on yankun.design                                                                                                               | ZAO would look like the portfolio. A very common editorial pick                                   |
| Same family, wide | The text face at a wide width  | No second font to load                                                                                                                                                         | Weakest story. Inter, Plex and Geist have no width axis                                           |

## Findings worth keeping

1. **Google Fonts drops most OpenType features.** Inter from Google Fonts has 8 substitution features. The Inter 4.1 foundry release has 39, including `case`, `zero`, `ss01`–`ss08` and `cv01`–`cv14`. ZAO should self-host foundry builds from npm. (IBM Plex Sans's digits are tabular by default, so it doesn't need the feature.)
2. **Grade and roundness are width-neutral.** For Google Sans Flex, the advance width of a test string was identical (50,261 units) at ROND 0 and 100 and at GRAD 0 and 100, while weight 450 widened it to 50,851. A theme can change these axes without reflowing layout.
3. **Leading trim is now usable everywhere.** `text-box: trim-both cap alphabetic` ships in Chrome 133, Edge 132, Safari 18.2 and Firefox 154. In the lab, a 24px button label goes from a 36px box to 17px, so padding values mean what they say.
4. **Dark mode needs weight compensation.** Light text on dark backgrounds looks heavier. Use grade where the face has it. Lowering weight also works, but on most faces it changes width.
5. **Glass fallbacks need a user setting.** `prefers-reduced-transparency` only works in Chromium (from version 119), so Yu also needs its own toggle.

## Rules ZAO will enforce

1. One text face for both finishes. Themes may change its color, grade or roundness, never its width or metrics.
2. The display face stays in display roles.
3. Agents set type by role (display, title, body, label, caption, code), never by raw size, weight or family.
4. Self-host foundry builds from npm, with fallback metrics tuned so the swap doesn't shift layout.
5. Numbers that line up or change use tabular figures. IDs and codes use the disambiguation set.
6. Control labels trim their line box to cap height and baseline.
7. Dark mode compensates for light text looking heavier, without changing width. With Geist, that means a slightly softer text color.
8. Chinese falls back to the system first (PingFang SC, then Noto Sans SC). A Chinese webfont ships only for display roles, and only on request.

## Original shortlist

Before the decision, the recommended shortlist was Inter or Mona Sans for text, the Song serif (Source Serif 4 + Noto Serif SC) for Yu, and JetBrains Mono, with IBM Plex Sans as the alternative for heavy Chinese UI. Geist and Newsreader were chosen instead after comparing them in the Type Lab.

## Sources

- [Inter](https://rsms.me/inter/) and its [v4.1 release](https://github.com/rsms/inter/releases)
- [Mona Sans & Hubot Sans](https://github.com/mona-sans)
- [IBM Plex](https://github.com/IBM/plex) and [Plex Sans SC release](https://github.com/IBM/plex/releases/tag/@ibm/plex-sans-sc@1.1.0)
- [Google Sans Flex (Google Design)](https://design.google/library/google-sans-flex-font)
- [Geist](https://vercel.com/font) and the [`geist` npm package](https://www.npmjs.com/package/geist)
- [Newsreader (Production Type)](https://github.com/productiontype/Newsreader) and [`@fontsource-variable/newsreader`](https://www.npmjs.com/package/@fontsource-variable/newsreader)
- [Source Han Serif](https://en.wikipedia.org/wiki/Source_Han_Serif)
- [Adjusting variable font weight in dark mode (CSS-Tricks)](https://css-tricks.com/using-css-custom-properties-to-adjust-variable-font-weights-in-dark-mode/)
- [text-box support (caniuse)](https://caniuse.com/css-text-box-trim)
- [prefers-reduced-transparency support (caniuse)](https://caniuse.com/wf-prefers-reduced-transparency)
- Google Fonts family metadata, pulled Sept 29, 2026
