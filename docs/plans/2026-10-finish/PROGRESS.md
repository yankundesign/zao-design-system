# Finish plan progress

_The working log for [the finish plan](README.md). Update it at every milestone, so work can stop at any point and resume from here._

## How to resume

1. Read this file, then the plan's "Rules for every work package" in [README.md](README.md).
2. Check the milestone table below. The first milestone that is not **Done** is next; its checklist says what is finished and what is left.
3. Run `pnpm build && pnpm --filter @zao/tokens test && pnpm --filter @zao/engine test` to confirm the saved state builds. Browser tests are listed per milestone, because some fail by design until their milestone updates them.
4. When a milestone is done, update its row and checklist, add a dated line to the log at the end, and save.

## Decisions (Yankun, Oct 11, 2026)

Yankun authorized the whole plan on Oct 11 and answered the color gates himself. Every other gate takes the plan's lean.

| Gate | Decision                                                                                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1   | **Both Ink 墨 and Azurite 青, with a switch.** Ink is the default; `data-zao-seal="azurite"` opts in. The docs header has a Seal switch beside the mode switch. Vermilion is out. |
| V1b  | **Warm ink 五墨** neutrals.                                                                                                                                                       |
| V1c  | **Focus stays ink.**                                                                                                                                                              |
| V2   | Two bands per plane, with a toned bottom.                                                                                                                                         |
| V3   | Rest 3px, lift to 5px; Card static at 4px.                                                                                                                                        |
| V4   | One faceted leading corner.                                                                                                                                                       |
| V5   | 举折, 10 rafters, faceted (`linear()`).                                                                                                                                           |
| V6   | Grade height × k, k = 30ms; press stays 80ms.                                                                                                                                     |
| V7   | Newsreader in the display and title roles.                                                                                                                                        |
| V7b  | Card titles keep the text face.                                                                                                                                                   |
| V8   | Drawn → built for Card loading and removal in the docs; Dialog stays instant.                                                                                                     |
| V9   | The hero rests on Parts.                                                                                                                                                          |
| V10  | The bracket set moves to Explore and the nav. Revised later on Oct 11: Yankun put it back beside the headline (A), at 256px.                                                      |
| V11  | Load path dip: yes, 1px.                                                                                                                                                          |
| V12  | Focus brackets, with the forced-colors outline.                                                                                                                                   |

## Milestones

| #   | Milestone                                                                          | Plan WPs         | Status          |
| --- | ---------------------------------------------------------------------------------- | ---------------- | --------------- |
| M1  | Tokens and material: seal, warm ink, planes, facet, wells, brackets, motion tokens | 1.1–1.8, 2.1–2.3 | **Done** Oct 11 |
| M2  | Browser tests and Anatomy follow the new construction                              | Phase 4 (part)   | **Done** Oct 11 |
| M3  | Drawn → built demo and the Motion page port                                        | 2.4, 2.5         | **Done** Oct 11 |
| M4  | Exploded stage and the overview hero; landing plan rows                            | 3.1–3.3          | **Done** Oct 11 |
| M5  | Documentation and records: AGENTS.md, motion.md, Depth page, decision drafts       | Phase 4 (part)   | **Done** Oct 11 |
| M6  | Full verification, screenshots, final write-back                                   | Phase 4          | **Done** Oct 12 |

### M1 Tokens and material — done

- [x] Warm ink neutrals from the generator (`palette.config.ts`: hue 82, chroma 0.015; ink-stone dark anchors so the well is darker than the canvas).
- [x] Ink seal as the default accent ramp; azurite as an extra ramp. Mode files add `color.seal.ink.*` and `color.seal.azurite.*`; accent roles alias the ink seal; `theme.css` swaps them under `data-zao-seal`.
- [x] Promoted colors: new mode mapping for canvas, surface, sunken, hover, active, borders; new `color.border.field`, `color.border.field-invalid`, `color.bg.field-disabled`; focus ring is ink. The Quiet instrument study no longer overrides colors.
- [x] Contrast promises extended (seal text, on-seal, field edges ≥ 3:1). The old input-border todo is now a real check.
- [x] Depth tokens `depth.rest.small|control|surface` (2/3/4px) and `radius.facet` (5px). Su material overlay shadow is drawn, not blurred.
- [x] Motion: `base/grade.tokens.json` (材分八等), `motion.config.ts`, `pnpm motion` → `src/motion/<finish>.generated.tokens.json` with grade durations and the 举折 curves. CSS gets the exact `linear()` curve through a Terrazzo transform; JSON exports it too. Su roles: lift and slide = grade 7, reveal = grade 5, seat and reveal-exit = fast; lift, slide and reveal use fold-enter, exit uses fold-exit.
- [x] `theme.css`: `construction-shading` (two bands per plane), `construction-planes`, `construction-well`, `field-well`, `popup-construction`, `card-shaded-construction` (with the load-path dip and facet), `focus-brackets`, the seal swap, and a rewritten `button-construction` driven by the registered `--zao-face-offset` and `--zao-plane-rest`.
- [x] Components: Button (side slot + brackets), Card, Dialog, Menu/Select/Combobox popups, Switch (thumb planes, grade 8, well, brackets), secondary Tabs (planes, seating, well), primary Tabs selection line in the seal, Progress well, Table frame planes, field wells.
- [x] Docs: Seal switch and init script, ButtonLink planes, depth scale also scales rest depths, charts' accent square moves to ink, decorative accent uses removed, links in ink.
- [x] Su display face is Newsreader (type overrides copied from Yu).
- [x] Changesets added. Token, engine tests pass (91 and 44). Docs typecheck and build pass.
- Known: browser tests that assert the old 1px contact, 2px lift, 80ms/160ms timing, gray accent, outline focus on Button/Switch, or the Anatomy paint paths fail until M2.
- Not in scope for brackets: fields, Tabs, menu items and table cells keep the outline (inputs cannot carry pseudo-elements; Tabs and lists are too tightly packed).

### M2 Browser tests and Anatomy — done

- [x] Run the full browser suite (`apps/docs`, 650 cases) and list failures against the Oct 11 baseline. The baseline already had 26 failures before this work (control-height ×5, field-family select ×2, motion-interruption select/combobox ×6, tabs-construction ×3, tabs-vertical-alignment ×8, switch rapid reversal, conversation streaming).
  - Oct 11 run after M1: 228 cases fail, 205 of them new, 3 baseline failures now pass. New failures by spec: side-tone 20, button-elevation 17, motion-interruption 14, control-height 13, card-construction 12, field-portal-layout 12, motion-demo 12, table-rule-status 12, dialog-construction 10, menu-construction 10, tabs-vertical-alignment 10, button-variants 8, depth-demo 7, icon-button 7, dialog-buttons 6, menu-item-emphasis 6, su-finish-promotion 6, field-edges 5, card-layouts 4, field-family 4, switch-construction 4, tabs-construction 2, and one each in composer, nav-construction, parts, progress-construction. `landing.spec.ts` was not yet run against the M4 hero.
- [x] Update specs that encode replaced values. Shared helpers in `apps/docs/e2e/`: `focus-mark.ts` (brackets, or the outline under forced colors), `construction-values.ts` (seat depths), `study-paint.ts` (recognizes a published-only run by its empty study sheet, now that the study declares no color roles). `side-tone.spec.ts` is rewritten for the banded planes; `landing.spec.ts` for the Parts/Built hero; `motion-demo.spec.ts` for the derived role values.
- [x] Real fixes found by the tests: planes and focus brackets no longer add scrollable overflow (planes cover the box and draw outside it with zero-blur spreads; brackets are the corners of a clipped outline); plane pseudo-elements never transition on their own (reduced motion fired `scrollbar-color` transitions on the Dialog); reduced motion leaves Button faces untransformed; Dialog stays instant even for the load-path dip; a quiet Button pressed by keyboard or touch takes its depth to seat; primary Tabs' selection line uses the system ink in forced colors; the Switch thumb reads the slide role (the Motion page ladder now shows Button and the Switch face at grade 7); the exploded stage returns to Built on `transitionend`.
- [x] `apps/docs/lib/anatomy-measure.ts` draws the banded planes (Button side slot, Card, Menu popup, Switch thumb, secondary Tabs face) back to a base a rest depth behind the box; the Switch face now separates along the depth axis it seats on. `anatomy.spec.ts` mirrors it.
- [x] Results: all updated specs pass except failures that predate this work: control-height timeouts under four workers (pass with two), motion-interruption select/combobox, tabs-construction and tabs-vertical-alignment sub-pixel centering, field-family select reopen, conversation streaming. One control-height dark RTL case flaked once.
- [x] `docs/parts.md` catalogs the Button `side` slot and the new construction concepts.
- [x] Docs nav: the current page marker in the seal (`globals.css`, `.docs-nav-paper::after`).

### M3 Drawn → built and the Motion page — done

- [x] Docs-local Card states on the Card page (`components/construction-states.tsx`, `.css`; rendered by `component-detail.tsx` for Card): Build, Remove, Load. The drawing's lines draw in (`pathLength` 1), the solid Card's planes rise over grade 3 on the fold curves, Load shows the drawing with live fen dimensions. Reduced motion switches instantly.
- [x] Foundations → Motion (`components/motion-rules.tsx`, `.css`): the 举折 fold figure (section, chords, drops 1/10…1/80), enter/exit curves beside the earlier standard curve, the same-600ms race with a Slow ×6 switch, the grade ladder with "Play all". Values read from tokens. `motion-demo.tsx` accepts `linear()` easings and scales the grade durations with playback speed.

### M4 Exploded stage and hero — done

- [x] `ExplodedStage` (`components/exploded-stage.tsx`, `.css`, docs-local): layers by selector, one inert copy per layer, picking by pointer band, tap, or Up/Down/Escape, live caption through `onPick`. The stage measures a fit (scale, turn, offset) so every layer stays inside it; wide stages keep the window's height in both poses, narrow stages draw the parts compact and switch without travel.
- [x] Hero (`landing/hero.tsx`): copy above, Parts/Built radiogroup, rests on Parts; the showcase window (`ShowcaseWindow`) is the Built pose, with the depth scale and Reset example below. The separate Showcase section is gone; the bracket set moved to Explore (`landing/explore.tsx`), then back beside the headline on Oct 11 (A, see the log).
- [x] Landing plan (`docs/plans/2026-10-landing/README.md`): Oct 11 progress section and a decisions table superseding L2, L5, L14, L15, L17 and the motion section.
- Checked in light, dark and at 390px: no horizontal overflow, the drawing stays inside the stage, Built works.

### M5 Documentation and records — done

- [x] `AGENTS.md`: an "Authorized finish plan (Oct 11, V1–V12)" section with the rules for the seal, warm ink, planes, facet, wells, focus brackets, motion roles, display face and docs; the focus rule and floating-layer row updated.
- [x] `docs/motion.md`: "Rules since October 11" (举折 curves, 材分八等 grades, Su roles, construction distances); the Oct 10 inventory is kept as a dated record.
- [x] Foundations → Depth: new copy, rest depths in the token list, "Side planes" and "Wells" sections.
- [x] `decision-drafts.md`: BRIEF decision-log rows for V1–V12, for the BRIEF owner to add.
- [x] Token test: no Su shadow or material uses blur (plan rule 2).
- Fallbacks (plan Phase 4): `corner-shape` ships in Chromium 139+ only; Safari and Firefox keep square corners by design. `linear()` easing and `@property` are supported in current Chrome, Safari and Firefox.
- Not done: the 60fps check of the exploded stage on a mid-range laptop needs real hardware. Layers by data attribute (WP 3.1) are done as selectors in the hero instead of attributes on components. The nav keeps its existing Start figure, already a small bracket set.

### M6 Verification — done

- [x] `pnpm build`, `pnpm typecheck` and `pnpm format:check` pass. Token tests 92, engine 44 and lab 31 pass; `pnpm lab:check` passes after regenerating `packages/engine/schema/style.schema.json` (the registry gained mode parameters for the field roles and both seals, which the lab parity test requires).
- [x] Full browser suite (650 cases, three workers): 627 pass. Of the 23 failures, 2 were the nav marker spec, now updated (it expected the old ink edge; the current page now carries the seal) and passing. The other 21 predate this work: motion-interruption select/combobox reversal (7) and one vertical Tabs reversal, tabs-construction (3) and tabs-vertical-alignment (8) sub-pixel centering, switch rapid reversal, and one control-height timeout. Two baseline failures (conversation streaming, field-family select reopen) now pass.
- [x] Docs static export (`ZAO_DOCS_STATIC_EXPORT=1`) builds.
- [x] Screenshots in light and dark with both seals: hero (Parts and Built), Button, Card states, Motion figure. One fix from them: Progress readings are data, so they keep the ink seal under azurite (plan rule 3).
- [x] Final write-back to `~/design-system`.

## Where the work happens

The implementation runs in a cloud copy of the repo and is written back to `~/design-system` at each milestone. Nothing is committed: the files land in the working tree beside the existing uncommitted work on `codex/construction-depth-tokens`. Each write-back checks that the files on the computer have not changed since they were copied.

## Log

- 2026-10-11 15:10 — M1 done and written back. Seal, warm ink, planes, facet, wells, brackets, display face and motion tokens are in. Browser tests not yet updated (M2).
- 2026-10-11 22:50 — M3 and M4 done and written back: Card drawn → built states, the Motion page rules, the exploded stage and the Parts/Built hero. Browser suite run after M1: 205 new failures, listed under M2. M2 (test updates and Anatomy) is next.
- 2026-10-11 23:40 — M2 and M5 done and written back. Browser specs, Anatomy, AGENTS.md, motion.md, Depth page and decision drafts follow the new construction. M6 (full verification) is next.
- 2026-10-12 00:30 — M6 done and written back. The finish plan is implemented; remaining items are human checks: Yankun's review, the BRIEF rows in `decision-drafts.md`, and a 60fps check of the exploded stage on real hardware.
- 2026-10-12 — After M6, at Yankun's request: the docs frame is capped at 1440px and centred; the bracket set returns to the top of the overview beside the headline (option A of three prototypes), 256px wide on desktop, with its opening room hung above the drawing so no space is added above the copy. Explore keeps the 营造法式 caption. `landing.spec.ts` checks the hero for stillness and the new keyboard order.
