# Azurite 青: improve the seal and use it in more places

Requested by Yankun on Nov 14, 2026: "improve the Azurite styles, apply the colors to more components and places, including the charts".

Azurite is Su's second seal (finish plan V1). `data-zao-seal="azurite"` points the accent roles at `color.seal.azurite.*`. The rules it reopens are: the seal appears only on the primary action, the current selection, focus and the approved ApprovalGate record (V1, A1); focus stays ink (V1c); Progress's reading stays ink (finish plan rule 3); a chart's accent square is ink and data never carries the seal (guideline rule 4).

**Status: built (Nov 14).** Yankun took every gate's lean. What changed is in the table below; progress and what was not verified are in [PROGRESS.md](PROGRESS.md).

## Azurite today

Captured on Nov 14 from `main` at `8e4cf45`, on every component page, every Charts page, Foundations → Color and Data visualization, and the landing page, in light and dark (`capture.mjs`, which also lists every blue paint on each page).

- **Where it appears.** Primary Button (with Composer's Send and ApprovalGate's approve), the Switch's on channel and its edge, the primary Tabs selection line and fishtails, ApprovalGate's impression and seal well, the docs nav's current-page mark, and text selection.
- **Where it is absent.** Menu, Select, Combobox, TextField, Dialog, Table, Plan, Progress, Card, Conversation, secondary Tabs and all seven charts. Ten of the sixteen component pages show azurite only in the nav.
- **Where it reads weak.** The ramp's chroma is 0.10, so the light face (`#2c4c83`) reads as slate and its 2px marks are close to ink. The dark face (`#8aafee`) is a different, lighter blue. The `subtle`, `subtle-hover`, `border` and `text` roles exist, but only the Switch's edge and text selection use one.
- **What holds.** The label is 8.5:1 on the light face and 7.3:1 on the dark one; the face stands 8.1:1 and 8.5:1 off the canvas; planes step toward black from the seal face in both modes; focus is ink.
- **One fix that is not a gate.** On the ApprovalGate page the "Ink seal record" specimens set no seal, so they turn azurite with the page and both columns look the same. They will be pinned to `data-zao-seal="ink"`.

## Gates

Each gate has rendered options in the [option sheet](option-sheet.html) (private page: https://claude.ai/artifact/EeKwYB4CWWbTUWNKV9nbCt). The options are study CSS injected into the built docs (`study.mjs`); candidate ramps come from the real generator (`ramp-candidates.ts`). Leans are the agent's; Yankun chooses.

| Gate | Question                                | Options                                                                                                                    | Lean                  |
| ---- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Z1   | Which azurite?                          | Today (hue 261, chroma 0.10) · Mineral (259, 0.13) · Vivid (259, 0.16) · Qing 青 (245, 0.12)                               | Mineral               |
| Z2   | The seal face in dark mode              | Light face with an ink label · Deep face with a white label (3.4:1 on canvas)                                              | Light face            |
| S1   | Committed value in Select and Combobox  | Today (ink check) · A: the check takes `accent-text`                                                                       | A                     |
| S2   | Table selection                         | Today · A: checkbox in the seal · B: A and the row in `accent-subtle` · C: A and the row washed with 8% of the seal        | A                     |
| S3   | Secondary Tabs' selected face           | Today · A: label in `accent-text` · B: neutral face on seal planes · C: seal face                                          | Today, or A           |
| S4   | Plan's step in progress                 | Today · A: the running marker · B: A, finished markers and their gauge ticks                                               | A                     |
| S5   | Progress's reading (Meter follows)      | Today (ink) · A: the active seal                                                                                           | Today                 |
| S6   | Focus                                   | Today (ink) · A: the seal                                                                                                  | Today                 |
| S7   | Links                                   | Today (ink) · A: `accent-text`                                                                                             | Today                 |
| C1   | How far the seal goes into a chart      | Today · A: the accent square · B: A and the emphasized datum (Bar's lead, Share strip's lead part) · C: A and all data ink | A                     |
| C2   | The inspected or selected datum         | Today · A: seal square beside an ink datum · B: the datum in the seal, prism planes stepping from it                       | A                     |
| C3   | Heatmap                                 | Today · A: seal brackets · B: the ramp mixes the seal into the canvas, seal brackets                                       | A (B is the bold one) |
| L1   | The landing bracket set's picked course | Today (ink) · A: the picked course and its ruler measure in the seal                                                       | A                     |
| L2   | The header's Seal switch                | Today · A: 青 set in azurite's text role                                                                                   | A                     |

Not proposed, and unchanged in every option: status colors, Card, Dialog, Message, the Composer tray, chart references and loading drawings, and the default ink seal.

## What was built

| Gate           | Result                                                                                                                                                                                                             | Where                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Z1, Z2         | Mineral, with the light dark-mode face. The input is hue 259, chroma 0.131: at exactly 0.13 an unused near-white step rounds differently in the shipped CSS than in the token JSON. Solid `#14448d` and `#71a5f6`. | `packages/tokens/palette.config.ts`, generated palettes  |
| S1             | The committed check reads `accent-text`; a disabled option's check stays `fg-disabled`.                                                                                                                            | `select.tsx`, `combobox.tsx`                             |
| S2             | A checked or mixed box fills with `accent-solid`, mark in `fg-on-accent`. Rows keep `bg-active`.                                                                                                                   | `table-checkbox` in `theme.css`                          |
| S4             | The running station's edge reads `accent-solid`.                                                                                                                                                                   | `zao-plan` in `theme.css`                                |
| S3, S5, S6, S7 | Unchanged: neutral secondary Tabs face, ink Progress reading, ink focus, ink links.                                                                                                                                | —                                                        |
| C1, C2         | The accent square, the share strip's chip and the ring's centre square read `accent-solid`. Data ink, inspected and selected data and prism planes are unchanged.                                                  | `apps/docs/components/charts/`, `storage-ring-study.tsx` |
| C3             | The heatmap's corner brackets read `accent-solid`; the ramp is unchanged.                                                                                                                                          | `heatmap-chart.tsx`                                      |
| L1             | The picked course and its ruler measure read `accent-solid`.                                                                                                                                                       | `apps/docs/components/landing/landing.css`               |
| L2             | 青 reads `color.seal.azurite.text` in both seals.                                                                                                                                                                  | `finish-switcher.tsx`, `apps/docs/app/globals.css`       |
| Fix            | The ApprovalGate page's ink record specimens are pinned to `data-zao-seal="ink"`.                                                                                                                                  | `workflow-specimens.tsx`                                 |

Under the default ink seal these roles resolve to the ink seal, which is one 8-bit step from `fg-default` (`#242018` beside `#23201a` in light, `#f3ede3` beside `#f2ede6` in dark), and the box's mark is white where it was the canvas. They read as ink.

## Captures

- **Before:** each gate's `today` capture in `study/` (`study/<gate>-<view>-today-<mode>.png`), taken from `main` at `8e4cf45`.
- **After:** the same views as built, in `screenshots/after/parts/` (`<gate>-<view>-<mode>.png`), from `node study.mjs <baseURL> "" after`.
- `screenshots/before/seal-map.json` and `screenshots/after/seal-map.json` list every blue paint per page. The full-page and close-up sets from `capture.mjs` and `closeups.mjs` are not committed; regenerate them with those scripts.
