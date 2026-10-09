# ZAO improvement plan, October 2026

_For coding agents working in `yankundesign/zao-design-system`. Written Oct 8, 2026, from a design review of the Oct 8 docs build. Owner and decision-maker: Yankun._

**Status: proposed.** This plan is not part of the current scope until Yankun adds it to "Current work" in `PLAN.md`. `AGENTS.md` tells agents not to infer a global interaction system from the brief; this plan is how that work gets authorized, one work package at a time. If you were not pointed here by Yankun or by `PLAN.md`, stop and ask.

## What this plan is for

The review found careful craft and a thesis that is hard to see. Three outcomes fix that:

1. **The construction language lives in the system.** Depth, side tone and motion become tokens that every component reads, and the published tokens match what the docs show.
2. **The thesis is visible.** A reader can see how a component is constructed, and one control proves that the whole system responds to the same few values.
3. **The agent claim is measured.** Component specs, a validator and a first eval exist for the components that are already built.

No phase adds a component.

## How to use this plan

1. Read `AGENTS.md`, then the direction section of `BRIEF.md`.
2. Read this file to the end.
3. Open only the phase file you were assigned. Each phase file is self-contained.
4. Do one work package (WP) per pull request.
5. Stop at every ⛔ gate and wait for Yankun.

| Phase | File                                                       | Outcome                                                        | Depends on                                    |
| ----- | ---------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------- |
| 1     | [01-construction-tokens.md](01-construction-tokens.md)     | Depth tokens, one side-tone rule, study values promoted        | —                                             |
| 2     | [02-fix-list.md](02-fix-list.md)                           | Contrast failures and off-system components fixed              | WP 1.1. WP 2.1, 2.5 and 2.6 can start at once |
| 3     | [03-motion-grammar.md](03-motion-grammar.md)               | Four named motions, role tokens, a motion page                 | WP 1.1                                        |
| 4     | [04-visible-construction.md](04-visible-construction.md)   | Anatomy figures, a construction toggle, shared part names      | Phase 1                                       |
| 5     | [05-agent-layer-and-proof.md](05-agent-layer-and-proof.md) | Component specs, manifest, validator, eval v1, a shorter brief | WP 5.1 can start at once; the eval needs 1–3  |

Phases 2, 3 and 5.1 can run in parallel once WP 1.1 has merged.

## Rules for every work package

These add to `AGENTS.md`. Where they disagree, `AGENTS.md` wins and you should say so in the PR.

1. **Visual decisions belong to Yankun.** Never choose a color, tone, distance, duration, curve, radius or drawing style. When a WP needs one, build an option sheet (below) and stop.
2. **Refactors change no pixels.** A WP marked "no visual change" must prove it with a before-and-after comparison of every component page in Su light and dark, at rest, hover, press and keyboard focus.
3. **Approved behavior stays.** The approvals recorded in `BRIEF.md` (Button, IconButton, Card, Menu, Tabs, Switch) and in the study's `design.md` (Composer, Conversation) hold unless a WP names the approval it changes and Yankun has passed its gate.
4. **Layers hold.** Structure lives in `packages/tokens/src/base/`, finish in `themes/`, mode in `modes/`. A token test requires every context to ship the same token IDs, so a token added to `themes/su.tokens.json` also needs an entry in `themes/yu.tokens.json`. Copy Su's value there and note that it is a completeness entry, not Yu design work.
5. **Colors come from the generator.** Change `packages/tokens/palette.config.ts` or the role-to-step mapping in `modes/`. Never hand-pick a hex value.
6. **Access is part of the construction.** Keep keyboard support, the outside focus outline, reduced motion, forced colors and RTL working in every change, and keep their tests.
7. **No new components, props or dependencies** unless the WP says so. Ask before adding a runtime dependency to `@zao/tokens` or `@zao/react`.

### Definition of done for every PR

- `pnpm build && pnpm test && pnpm typecheck && pnpm format:check` pass, and `pnpm docs:build` succeeds.
- A changeset for any change to `@zao/tokens` or `@zao/react`.
- Screenshots of Su light and dark in the PR, or a short recording for motion.
- New behavior has a Playwright spec in `apps/docs/e2e/`. No existing test is weakened.
- `AGENTS.md` is updated when a rule, utility or command changes.
- A draft decision-log row for `BRIEF.md` when a gate was passed. Yankun adds it.
- Work on a branch and merge by PR. Never push to `main`.

### Option sheets

An option sheet is how an agent hands a visual decision to Yankun.

- Put it in `explorations/snapshots/private/<slug>-<yyyymmdd>/` with a `review.md`, following the existing Button review in that folder.
- Show two to four options on the real components, in Su light and dark, at the states that matter. Include the current behavior as one option.
- For each option, state what changes, what it costs, and any measured numbers such as contrast ratios.
- Label every option "agent-made". You may say which one you would pick and why, in one sentence, clearly marked as a suggestion.
- Change no shipped code or tokens in the same PR. Build options as local study CSS or docs-only controls.

## Decisions waiting on Yankun

"Reviewer's lean" is a suggestion from the Oct 8 review, not a decision.

| #   | Decision                                                             | Options to compare                                                                                                                               | Reviewer's lean                                            | Needed by |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | --------- |
| D1  | Authorize this plan, and freeze new components until Phase 5 is done | Yes, no, or selected phases                                                                                                                      | Yes, with the freeze                                       | Start     |
| D2  | Which layer depth tokens belong to                                   | Finish (paint only, never layout) or structure                                                                                                   | Finish, with a test that depth never changes a layout box  | WP 1.1    |
| D3  | The side-tone rule                                                   | A: side always darker than its face. B: side is drawn as linework, with no shading. C: keep today's "toward mid-gray" behavior and write it down | Compare all three; B matches the nav figures               | WP 1.2    |
| D4  | Which study values are promoted into Su tokens                       | Radius, motion, color, or a subset                                                                                                               | All three, color last                                      | WP 1.3    |
| D5  | Whether the depth control is a docs demo or a published attribute    | Docs only, or published                                                                                                                          | Docs only for v0.1                                         | WP 1.4    |
| D6  | Field edge values: dark rest, light invalid, dark disabled           | Option sheet with contrast numbers                                                                                                               | Any option at or above 3:1                                 | WP 2.1    |
| D7  | Dialog construction, backdrop and motion                             | Option sheet built from Card's frame and Menu's reveal                                                                                           | —                                                          | WP 2.2    |
| D8  | Menu item emphasis                                                   | Fewer simultaneous cues; square or 2px corners                                                                                                   | Fill plus inset mark; focus outline for keyboard only      | WP 2.3    |
| D9  | The default control height                                           | One default (34px or 32px), or keep both and document why                                                                                        | One default                                                | WP 2.7    |
| D10 | Status in a monochrome table                                         | Plain words as now, a glyph or shape per status, or status color                                                                                 | A non-color cue                                            | WP 2.5    |
| D11 | Motion role values                                                   | Tuned by Yankun on the motion page                                                                                                               | Press shorter than release; an exit curve that accelerates | WP 3.3    |
| D12 | Whether the Button label moves with its face                         | A: as now. B: label and face stay, base moves. C: face moves, label stays                                                                        | Compare in a dense toolbar                                 | WP 3.4    |
| D13 | The anatomy drawing style                                            | Two or three figures in the language of the nav figures                                                                                          | —                                                          | WP 4.1    |
| D14 | The component spec template                                          | One spec, for Button, reviewed before the rest are written                                                                                       | —                                                          | WP 5.1    |
| D15 | Agent layer scope for v0.1                                           | Manifest, validator and guidance now; MCP server later. Or all four now                                                                          | MCP server later                                           | WP 5.2    |
| D16 | Eval setup                                                           | The task list, which agent and model, how many runs per condition                                                                                | 5 tasks, 3 conditions, 3 runs                              | WP 5.5    |

Two findings need Yankun alone and have no work package: whether Su gets an accent that is not ink, and how Geist gets a signature (the typography research suggests stylistic sets).

## Findings this plan answers

Measured on the Oct 8 static export, 1440×900, with the Quiet instrument study applied. Reproduce a number before you change it, and report the new number in the PR.

| ID  | Finding                                                                                                                                                                                                            | Phase |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| F1  | Depth reads as a heavier border at 1x: the contact edge is 1px and the hover lift is 2px                                                                                                                           | 1, 4  |
| F2  | Side tone is not one lighting model. Light: primary side `#434343` is lighter than its face `#292929`; secondary side `#575757` is darker than its face `#f7f7f7`. Dark mode flips both                            | 1     |
| F3  | The 1px contact edge is defined eight times as a private variable (button, card, composer, field, menu, progress, switch, tabs). `@zao/tokens` has no depth tokens                                                 | 1     |
| F4  | Published Su tokens (radius 6/6/8/10, 100ms, soft 24px shadow) differ from the docs, where the study overrides about 30 variables with 28 raw hex values (radius 0/2, 80ms). `button.tsx` hardcodes `rounded-none` | 1     |
| F5  | Light mode: the invalid field edge is 1.85:1 against the canvas; a normal field edge is 6.86:1                                                                                                                     | 2     |
| F6  | Dark mode: the field edge is 2.03:1 and the fill is 1.04:1 against the canvas. Enabled and disabled fields share the same fill and edge                                                                            | 2     |
| F7  | Dialog: soft `0 8px 24px` shadow, transparent backdrop, 0s transition, 32px trigger and close beside 34px Buttons. The docs specimen styles its primary action by hand                                             | 2     |
| F8  | Menu item: fill, an inset mark and a 2px-rounded focus outline all mark one state                                                                                                                                  | 2     |
| F9  | Vertical Tabs: labels are centered in a shared 75px column. The 16px graduations do not relate to tab positions                                                                                                    | 2     |
| F10 | Table: the table is 832px wide in an 842px scroll container, so row rules stop 10px short of the right frame. Statuses are plain words of equal weight                                                             | 2     |
| F11 | Docs nav: 908px of links in a 788px scroll region. Switch, Table and Tabs are hidden with no cue                                                                                                                   | 2     |
| F12 | Two default heights: `size.control.md` is 32px; Button and the field family are 34px                                                                                                                               | 2     |
| F13 | Motion has two durations and one curve, `cubic-bezier(0.2, 0, 0, 1)`, for enter and exit, hover and press                                                                                                          | 3     |
| F14 | Button's label moves 2px with its face on hover. Tabs, Switch and Menu keep labels stationary                                                                                                                      | 3     |
| F15 | The construction is named in the brief but not shown anywhere except three nav figures                                                                                                                             | 4     |
| F16 | `packages/agent` and `evals` hold only a README. There is no lint or validator. 15 components are exported; the brief planned 7                                                                                    | 5     |
| F17 | The same approval paragraphs are copied into `BRIEF.md`, `PLAN.md`, `AGENTS.md`, `docs/style-studies.md` and the study's `design.md`                                                                               | 5     |
| F18 | The brief argues "agent-friendly" and "Quiet construction" separately and never connects them                                                                                                                      | 4, 5  |

## Out of scope

- Yu, in any form beyond the completeness entries in rule 4.
- New components, including Tooltip and Toast as standalone exports.
- An accent color, a second typeface, or stylistic-set choices.
- A Figma library, a registry, Storybook.
- Publishing to npm. That stays with milestone 6 in `BRIEF.md`.

## Words used in this plan

| Word         | Meaning                                                                             |
| ------------ | ----------------------------------------------------------------------------------- |
| Face         | The front plane of a part: the surface a person reads and presses                   |
| Side         | The plane that joins a lifted face to its base                                      |
| Base         | The stationary seat a face rests on. It holds the native hit area and focus outline |
| Contact edge | The thin offset that grounds a part on what is behind it                            |
| Lift         | The distance a face travels toward the viewer on hover                              |
| Seat         | The pose where a face sits on its base, during press                                |
| Axis         | The screen direction that stands for "toward the viewer". Today: right and up       |
| Joint        | Where a floating part attaches to its owner, such as a Menu to its trigger          |
