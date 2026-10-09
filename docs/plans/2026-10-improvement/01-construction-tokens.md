# Phase 1: construction tokens

_Part of the [ZAO improvement plan](README.md). Read that file first: its rules, definition of done and option-sheet format apply here._

## Goal

The values that make ZAO look constructed (contact edge, lift, axis, side tone) become tokens that every component reads, and the published Su tokens match what the docs show.

## Why

- The contact edge is defined eight times as a private variable and `@zao/tokens` has no depth tokens (F3).
- The side tone follows no single rule (F2).
- A person who installs `@zao/react` gets a different design from the one on the docs site (F4).

Until this phase lands, the architecture claim in `BRIEF.md` ("structure is shared, finish is chosen") cannot be demonstrated for the thing that makes ZAO distinct.

## Read first

- `packages/react/src/styles/theme.css`: `button-construction`, `card-construction`, `menu-construction`, `menu-reveal-edge`.
- `packages/react/src/styles/tabs.css`, `switch.css`, `progress.css`, `composer.css`.
- `explorations/su-studies/quiet-instrument/style.css`.
- `packages/tokens/src/themes/su.tokens.json`, `packages/tokens/src/zao.resolver.json`, `packages/tokens/test/tokens.test.ts`.
- `packages/engine/src/registry/index.ts`.

## WP 1.1: Depth tokens, no visual change

**Gate:** ⛔ D2 (which layer) before you start.

**Build**

1. Add depth tokens with today's values: one contact distance (1px), one lift distance (2px), and the axis (toward the viewer is +x, −y on screen). Names are your choice; explain them in the PR. Every token needs a `$description`.
2. Put them in the layer Yankun chose. If that is finish, add matching entries to `themes/yu.tokens.json` (rule 4 in the README).
3. Expose them in `theme.css` and replace the private definitions: `--button-contact`, `--button-lift`, `--card-contact`, `--menu-contact`, `--switch-contact`, `--progress-contact`, `--composer-contact`, and `--field-contact` in the study CSS.
4. Replace hardcoded direction signs with the axis tokens where the CSS allows it. Where a `clip-path` or logical property makes that unreadable, leave a comment naming the axis token it must follow.
5. `--tabs-hairline` is used as a line weight as well as a depth offset. Separate the two uses. If a stroke-width token is needed, add it and say so.
6. Add the new parameters to the engine registry so the lab and `pnpm lab:promote` know them.
7. Add a Foundations → Depth page to the docs that lists the tokens from the token JSON, like the Space page.

**Acceptance**

- No depth distance is defined outside the token mapping. `grep -rn "space-0-5) / 2" packages/react/src explorations/su-studies` returns only stroke uses that you list in the PR.
- No visual change: a before-and-after pixel comparison of every component page, Su light and dark, at rest, hover, press and focus, shows no difference. Attach the comparison.
- Existing `*-construction.spec.ts` specs pass unchanged.
- A new spec overrides the depth variables on an island (zero, and a larger value) and asserts that each component's layout box and its neighbors' positions do not change.
- Changesets for `@zao/tokens` and `@zao/react`.

## WP 1.2: One side-tone rule

**Gate:** ⛔ D3. Build the option sheet first, then stop.

**Option sheet**

Show Button (primary, secondary, quiet) at rest, hover and press, plus the Switch thumb, the secondary Tabs indicator, Card and Menu, in Su light and dark, for:

- **A, shaded.** The side is always darker than its face, as if lit from the upper right. Note how a near-black face is handled, since a darker side has almost no contrast against it.
- **B, drawn.** The side is linework: an outline in the ink color with an open fill, like the nav figures in `apps/docs/components/nav-section-figure.tsx`. No shading.
- **C, as now.** The side moves toward mid-gray from its face. Write the rule down exactly.

For each option list the side-to-face and side-to-canvas contrast in both modes.

**Build, after the gate**

- Express the chosen rule as semantic tokens or one documented formula. No component may set a side color literal.
- Update `button-construction`, the Switch thumb and the secondary Tabs indicator to read it.
- Add a token or component test that fails if the rule is broken in either mode.

**Acceptance**

- One rule, stated in one place, read by every component that has a side.
- The forced-colors and reduced-motion variants still pass their specs.

## WP 1.3: Promote the study into Su

**Gate:** ⛔ D4. Prepare the proposal, then stop. Only Yankun runs a promotion or asks for one by name.

**Proposal (no shipped changes)**

Write `explorations/snapshots/private/promotion-<yyyymmdd>/review.md` with one row per override in `quiet-instrument/style.css`:

| Study variable | Study value | Published token | Published value | Proposed source change |
| -------------- | ----------- | --------------- | --------------- | ---------------------- |

- **Radius and motion** map directly to `themes/su.tokens.json`.
- **Color** must come from `palette.config.ts` inputs and the role-to-step mapping in `modes/`. Find the inputs that land closest to each study value and report the difference per role. Where the generator cannot reach a value, say so and offer the nearest two steps.
- Run the contrast tests against the proposed values and include the report. F5 and F6 will fail; point to WP 2.1.
- `explorations/styles/` and `pnpm lab:promote help` describe the existing promotion path. Use it in dry-run form if it fits; do not write token sources.

**Build, after the gate**

- Apply the approved groups to the token sources. Run `pnpm palette`, `pnpm tokens`, `pnpm test`.
- Delete each promoted override from the study CSS. What remains in that file is unpromoted study material only.
- Remove the `rounded-none` hardcode from `packages/react/src/components/button.tsx` so Button reads `rounded-action`. Update the Radius row in the `AGENTS.md` table.
- Update the docs so promoted groups no longer depend on the study stylesheet.

**Acceptance**

- With the study stylesheet disabled, the docs render the promoted groups the same as before. State the pixel tolerance you used.
- The study CSS contains no raw hex value for a promoted group.
- The baseline and "real Quiet instrument" cases in the e2e specs still pass, or are merged where they are now identical. Explain any merge.
- A changeset that states this is a visible change for anyone on the published tokens.

## WP 1.4: Prove the architecture

**Gate:** ⛔ D5 before publishing anything. The docs demo needs no gate.

**Build**

- On the Depth page, add a control that scales the depth tokens on a preview island holding Button, Card, Menu, Switch, Tabs, Progress, Composer and a field. Use a continuous slider with a numeric readout, starting at today's value, so no new value is chosen.
- The control is keyboard operable, has a visible label and value, and resets.
- Add a spec: changing the depth variables on the island changes the painted offset of every listed component and no layout box.

**Acceptance**

- Every listed component responds to the same variables with no component-specific code path.
- At zero the island renders flat with all states still distinguishable. If a state is lost at zero, report it; that is a finding, not something to patch around.

## Out of scope

- Changing any depth value. This phase moves values; Yankun changes them.
- New elevation levels, shadows or blur.
- Yu beyond completeness entries.
