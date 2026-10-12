# Phase 3: motion grammar

_Part of the [ZAO improvement plan](README.md). Read that file first: its rules, definition of done and option-sheet format apply here._

## Goal

ZAO has a small, named set of motions. Each component uses one of them, each motion has its own duration and easing roles, and Yankun can tune those roles in one place.

## Why

The direction is about physical response, and the motion vocabulary is two durations and one curve used for everything (F13). Button moves its label on hover while every other component keeps labels still (F14). Dialog does not move at all (F7). The best motion in the system, Menu's reveal, runs too fast to inspect and is documented only in prose.

This phase does not make ZAO move more. "Response is quiet and meaningful" in `BRIEF.md` still holds.

## The four motions

These names describe what the approved components already do. They are a vocabulary, not new behavior.

| Motion     | What happens                                                    | Used by today                                              | Distance comes from      |
| ---------- | --------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------ |
| **Lift**   | A face travels along the axis toward the viewer                 | Button and IconButton hover                                | The lift token           |
| **Seat**   | A face travels along the axis onto its base                     | Button, Switch thumb and secondary Tabs indicator on press | The contact token        |
| **Slide**  | A face travels within a fixed track                             | Switch, Tabs indicator, Progress                           | The track's own geometry |
| **Reveal** | A stationary plane is uncovered from its joint by a moving edge | Menu, Select, Combobox                                     | The popup's own size     |

Hover color changes and tick growth are state changes, not motions. They keep the existing fast duration.

## Read first

- Every `transition` in `packages/react/src/styles/` and in `explorations/su-studies/quiet-instrument/style.css`.
- `@property --zao-menu-reveal-progress` and `menu-construction` in `theme.css`.
- The reduced-motion blocks in each stylesheet, and the base-layer rule at the end of `theme.css`.
- The motion entries in `packages/tokens/src/themes/su.tokens.json`.

## WP 3.1: Motion inventory

**No gate. No code change.**

**Completed Oct 10.** `docs/motion.md` records every transition, animation, timing override, and suppression in the required stylesheets, including the existing functional loading exception and generated field/Tabs color transitions. Its baseline line references and source hashes are preserved in private review evidence. No timing or interaction choice is made by the inventory.

Write `docs/motion.md` with one row per transition: component, state change, property, distance, duration token, easing, which of the four motions it is (or "state change"), and its reduced-motion behavior. Flag anything that fits none of the four, anything that animates a layout property, and any pair of components that do the same thing with different timing.

**Acceptance:** every `transition` and `animation` declaration in the two locations above appears in the table.

## WP 3.2: Role tokens, no visual change

**Depends on:** WP 3.1.

**Implemented Oct 10.** `motion.duration.{lift,seat,slide,reveal,reveal-exit}` and `motion.easing.{lift,seat,slide,reveal,exit}` alias current finish values. The additional reveal-exit duration preserves the existing faster close. Runtime component and local study spatial transitions use those roles, while state changes, generated color easing, functional loading, and reduced-motion suppression retain their current behavior. Engine registry, schema, and promotion routing recognize the roles; Yu entries preserve its deferred existing values for completeness. A changeset covers the extraction.

**Comparison attached:** [the inventory's comparison](../../motion.md#wp-32-comparison) records 224/224 exact computed and pixel matches, 280/280 exact supplemental timing matches, and 4/4 exact opened Dialog images. Reproducible scripts and rejected early live-frame samples remain in `explorations/snapshots/private/motion-inventory-20261010/`. No pixel tolerance or timing normalization was applied.

**Build**

1. Add a duration role and an easing role for each of the four motions, plus an exit easing. Set every one to today's value, so nothing changes on screen. Names are your choice. Add completeness entries for Yu (rule 4 in the README).
2. Keep `motion.duration.fast` and `motion.duration.base` for state changes and as the values the roles start from.
3. Point each component transition at its role. Menu, Select and Combobox closing use the exit easing role.
4. Add the roles to the engine registry.

**Acceptance**

- No component stylesheet references `duration-fast` or `duration-base` for one of the four motions.
- No visual or timing change: computed `transition-duration` and `transition-timing-function` for every component match the inventory from WP 3.1. Attach the comparison.
- All reduced-motion specs pass unchanged.

## WP 3.3: Motion page and tuner

**Gate:** ⛔ D11. The page ships without a gate. Token values change only after Yankun gives them.

**Completed Oct 10; D11 resolved.** Yankun chose “Keep current values”: lift, seat, and reveal exit remain 80ms; slide and reveal remain 160ms; every role keeps `cubic-bezier(0.2, 0, 0, 1)`. Existing finish aliases already resolve to these approved values and remain intact, so this confirmation changes no token value or component timing. The [decision-log draft](decision-drafts/motion-values-current.md) is ready for Yankun to add to `BRIEF.md`.

Foundations → Motion uses the real Button, Switch, and Menu to inspect the four existing motions. Its playback speed, duration sliders, and validated easing editors write only on the specimen island. Reset restores published values, reduced motion explains and shows immediate destinations, and the copy output reports unscaled values. The inventory renders directly from `docs/motion.md` into native tables and named keyboard-focusable scroll regions. Future tuner edits remain previews until separately approved. WP 3.4's comparison led to the Oct 11 D12 A approval below.

**Verified Oct 10:** All 18 Motion page cases pass in the full 536-case browser run. They cover real pointer timing and native target geometry, independent role tuning, keyboard controls, local playback, reset, unscaled copy output, invalid easing that retains the last valid curve, reduced motion, RTL, narrow layouts, both popup placements, and inventory accessibility. Package build, docs static export, lab build, typecheck, and formatting also pass. The private review and D11 handoff are in `explorations/snapshots/private/motion-review-20261010/`.

**Build**

A Foundations → Motion page in the docs with:

- The four motions, each with a live specimen built from the real components and a one-line rule.
- A speed control (for example 1×, 0.5×, 0.25×, 0.1×) that slows the specimens, so a reader can inspect the Reveal's edge and the Button's seat. Implement it for the page's islands only.
- A tuner: one duration slider and one easing editor per role, writing CSS variables on the page. Start every control at the current token value. Add a "copy values" output Yankun can paste back.
- The inventory table from WP 3.1, rendered from `docs/motion.md`.

Directions from the review for Yankun to try in the tuner (suggestions, not values): a press that is shorter than its release; an exit curve that accelerates where the enter curve decelerates; a hover lift slightly longer than the press.

**Build, after the gate**

Write the values Yankun returns into the role tokens. Changeset.

**Acceptance**

- The page works with the keyboard, and with reduced motion on it explains that specimens are shown at their end state.
- The tuner changes nothing outside the page.
- After the gate: tokens equal the returned values exactly.

## WP 3.4: Button label stillness

**Gate:** ⛔ D12. This touches the approved Button. Option sheet first.

**D12 resolved Oct 11: A, current behavior.** Yankun selected labels and icons traveling with the Button and IconButton face through the approved hover lift, press seating, and release. The base, native target, outside keyboard focus outline, and neighboring layout remain fixed. Existing motion-role aliases and values, disabled protections, and reduced-motion fill feedback stay intact. No runtime pose or timing change is needed for A. The [decision-log draft](decision-drafts/button-label-current-a.md) is ready for Yankun to add to `BRIEF.md`; B and C remain private, unselected studies.

**Private comparison built Oct 10.** The [D12 review](http://127.0.0.1:3248/) mounts real eight-control Button/IconButton toolbars and size, icon, and block specimens in Su light and dark. Local controls select direction and normal/quarter speed; four recordings follow actual pointer input. The option sheet and evidence are in `explorations/snapshots/private/button-stillness-options-20261010/`. A matches 46 paired current-component states. Across 180 state records and 2,192 animation frames, targets and neighboring layout stay fixed; B's base/side joint and C's ink remain synchronized. A separate 24-condition rapid-reversal trace confirms stationary ink before motion completes. Forced colors expose a tradeoff: B and C have no pointer hover/press paint change in the sampled primary crop, while A retains ink movement; all keep visible keyboard focus. The comparison is retained as the review record for the Oct 11 A choice.

**Handoff verified Oct 10.** A fresh full run passes all 536 browser cases, plus 57 token, 44 engine, and 31 lab tests with one existing token todo. Package build, docs static export, typecheck, formatting, and diff checks pass. A reproduced transition-start race in the existing Progress test was corrected by awaiting its actual CSS transition before the original 40ms sample, preserving its checks and adding explicit unfinished-motion assertions. All four Progress cases pass five repetitions. Published component behavior is unchanged by this handoff; candidate CSS remains private.

**Option sheet**

Build each option as docs-only CSS and show it in a dense toolbar of six to eight Buttons and IconButtons, plus the standard Button specimen, with a recording at normal speed and at 0.25×:

- **A, as now.** Face and label lift together, 2px up and right.
- **B, base moves.** Face and label stay where they are; the base and side extend down and left to show the same depth.
- **C, face moves, label stays.** The face lifts and the label is held still.

For each, note what happens to the hit area, the focus outline, the icon in IconButton, and the reduced-motion fallback.

**Build, after the gate**

Implement the choice in `button-construction` and update the Button approval text in the component's spec (or `BRIEF.md` if specs do not exist yet).

**Acceptance**

- `button-elevation.spec.ts` is updated to assert the chosen behavior and still asserts a stationary hit area, focus outline and neighbors.
- The stillness rule is stated once and is true for Button, Tabs, Switch and Menu.

## WP 3.5: Dialog entry and exit

**Gate:** ⛔ D7, shared with WP 2.2.

**D7 already resolved Oct 9; instant behavior implemented.** Yankun's Dialog B approval specifies instant entry and exit, with a stationary frame and content. That approval supersedes this work package's generic transition proposal below. Keep the existing opaque popup, semantic page veil, focus behavior, dismissal, and reduced-motion path. No role animation or mid-transition reversal applies to an instant Dialog; cover immediate close/reopen without inventing motion.

Implement the entry and exit Yankun chose for Dialog using the existing motions and their role tokens. Interrupting an opening dialog reverses it from its current position. Reduced motion shows the end state.

**Acceptance:** a spec opens and closes the dialog mid-transition and finds no jump in position or opacity.

## WP 3.6: Interruption coverage

**No gate.**

**Completed Oct 11 after D12 A.** `apps/docs/e2e/motion-interruption.spec.ts` adds 28 cases across Su light/dark and LTR/RTL: 12 primary/secondary/vertical Tabs cases, eight bidirectional native Select/Combobox reversals, four Progress width-paint cases, and four reduced-motion context cases. All 28 pass, followed by all 140 five-repeat executions with no skips, retries or flaky results. Native targets, frames, rows and neighboring layout remain fixed (0 CSS px residual). Natural transition cancellation occurs before the outgoing response completes; the reversal starts at that outgoing paint value. Maximum continuity residuals are 0.000545 CSS px for Tabs, 0.000000488 unitless reveal progress, and 0.012057 CSS px for Progress within its 0.02px layout-quantization allowance.

Published field popups are instant; these checks use the actual Quiet instrument study's animated Reveal. Progress's existing specimen has no data-editing control, so its cases explicitly exercise the real CSS width paint path rather than claim controlled React data-update coverage. Existing Progress semantics and formatting tests remain intact. D7's approved instant Dialog entry/exit requires no animated reversal; its 31 existing dedicated cases remain unchanged. Evidence, attachments and scope limits are in `explorations/snapshots/private/motion-interruption-20261011/`. This work changes no component runtime, CSS, token or dependency. WP 4.1 is complete without renames; D13 anatomy remains the next gate.

**Existing Switch probe corrected:** A full run exposed an obsolete test-local generic duration override: it was 2s while the actual slide remained 160ms. The revised probe uses natural published timing, native fixed-target input and actual cancellation/keyframe continuity. Its original intermediate position, checked state and endpoint assertions remain. Corrected reversal passes 10 repetitions, then all seven Switch cases pass ten repetitions (70/70), with a maximum continuity residual of 0.000049085 CSS px. The original isolated case also passed 10/10, so the loaded failure's precise scheduling remains an inference. Before measurements, raw attachments and scope limits are retained in the interruption evidence's `switch-reversal/` folder.

**Final continuation verification:** The fresh complete run passes all 576 browser cases, including these interruption checks, the strengthened Button/IconButton readings and all existing Dialog cases. Package build, static docs export, lab build, typecheck, formatting and diff checks pass. Token/engine/lab tests pass with one existing token todo. Full-run logs and the separate docs Table gutter and landing test corrections are recorded in `explorations/snapshots/private/continuation-review-20261011/`.

Switch and Menu already reverse from their current position. Add the same check for the Tabs indicator, Progress, Select and Combobox: start a transition, reverse it midway, and assert the animated value continues from where it was.

## Out of scope

- Springs, overshoot, stagger, ambient or looping motion. The approvals in `BRIEF.md` rule out overshoot (Switch), row stagger (Menu) and idle motion (Progress).
- Page transitions and scroll-linked effects, except the construction toggle in Phase 4.
- A JavaScript animation library.
