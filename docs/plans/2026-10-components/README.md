# ZAO components plan: Plan, ApprovalGate and drawings, October 2026

_For coding agents working in `yankundesign/zao-design-system`. Written Oct 13, 2026, from the Plan, Seal and Drawing sketch and Yankun's review of it. Owner and decision-maker: Yankun._

**Status: decided Oct 13, with two open gates (G1, G2).** Start when Yankun points you here or adds this plan to "Current work" in `PLAN.md`. If neither has happened, stop and ask.

**This plan adds two components and one state.** It adds the `Plan` and `ApprovalGate` exports, a `drawing` state on the existing `Card` and `Table.Root`, and two motion roles (`hold`, `impress`). It also covers their docs pages, specimens, tests and records. It changes no other component.

## What this plan is for

After the finish and Conversation plans, ZAO's construction story (parts drawn, then built, layered on a depth axis, moving on the 举折 curves) shows mostly in the hero and in hover and press. Yankun asked for components people look at and say "this is really cool". This plan puts the construction story where it means something: in the three processes an AI workspace runs all day.

1. **A plan gets done.** An agent proposes a plan as a drawing on a ruler. Each step fills in as it finishes.
2. **An approval gets given.** The decision becomes its own record, sealed with the seal's impression.
3. **Data arrives.** While it loads, a part shows its construction drawing instead of a shimmer, then it's built.

Each uses only existing tokens, roles and utilities, plus the two motion roles below. No new color.

## Reference

The [Plan, Seal and Drawing sketch](https://claude.ai/artifact/6b4NM1z9ap77RuSuX88TGZ) runs the real `@zao/react` parts with each row as a toggle, plus ¼ speed, light and dark, and both seals. Rows marked **Decided** show Yankun's choices. Its source is in [`sketch/`](sketch/): `sketch.css` holds the recipes, scoped under `.sk[data-sk-<row>='<option>']`, and `main.tsx` is the host. Port the recipes into the components. Do not copy the sketch's selectors or host code. If you cannot open the artifact, this file and `sketch/` are complete without it.

Where this plan and the sketch differ, this plan wins. The known differences:

- The sketch runs the plan in the host and draws the plan, gate and drawing state there. In the system, `Plan` only draws the statuses the host passes, `ApprovalGate` only renders the decision the host passes, and `drawing` is a prop.
- The sketch reads the build duration through a host timer. Components read it from the computed roles.
- The sketch's seal glyph uses a one-glyph subset of Noto Serif SC. The component adds no font (see WP 3.2).
- The sketch's rail draws on each step's `::before` and `::after`. Keep that, but name the custom properties `--zao-plan-*`.
- The sketch's options that Yankun did not choose (List, Built, Instant, Stamp, Hold, Outline, Today, Shimmer, dimensions On) are references only.

## How to use this plan

1. Read `AGENTS.md`, especially the finish plan and Conversation plan sections, then this file to the end.
2. Run the full browser suite before the first change and record the existing failures in `PROGRESS.md` in this folder.
3. Work one work package (WP) per pull request, or one phase per write-back, as the earlier plans did. Keep `PROGRESS.md` current so work can stop and resume.
4. Stop at every ⛔ gate. When this plan does not settle a visual value, stop and ask. Do not choose one.

| Phase | Outcome                                                     | Rows   | Depends on       |
| ----- | ----------------------------------------------------------- | ------ | ---------------- |
| 1     | Motion roles: `hold` and `impress`                          | M1     | —                |
| 2     | `Plan`: the rail and the drawn-in arrival                   | P1, P2 | —                |
| 3     | `ApprovalGate`: the decision, the record and the impression | A1, A2 | WP 1.1           |
| 4     | `drawing` on `Card` and `Table.Root`                        | L1, L2 | —                |
| 5     | Docs pages, specimens, tests and records                    | all    | what each covers |

Phases 2 and 4 can start at once. WP 3.3 waits for G1.

## Decisions (Yankun, Oct 13, 2026)

| Row | Decision                                                                                                        | How it was decided                             |
| --- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| P1  | **Rail.** Steps stay flat on a ruler. Each has a station; a finished step fills it and draws its segment solid. | Chosen over List and Built                     |
| P2  | **Drawn in.** A proposed plan is drawn step by step, one `motion.duration.fast` apart.                          | Chosen over Instant; the stagger comes with it |
| A1  | **Button, sealed record.** Approve is the primary Button; the approved record carries the seal's impression.    | Yankun's combination of the sketch's options   |
| A2  | **Solid cut 白文.** The mark is cut out of a filled seal square.                                                | The sketch's lean, unchanged in review         |
| L1  | **Drawing.** A loading part shows its construction drawing, then is built.                                      | Chosen over Today and Shimmer                  |
| L2  | **No dimensions** in published parts. Docs demos keep theirs.                                                   | Chosen Off                                     |
| M1  | **Hold is its own motion role**, `motion.duration.hold`.                                                        | Yankun                                         |

### Open gates

| Gate  | Question                                                                                                                                                                                                        | Blocks              |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| ⛔ G1 | Does a hold-to-approve variant ship in this plan? If yes: how a held primary Button shows its four bands, and the path for people who can't press and hold (a setting that turns it into a press, or a Dialog). | WP 3.3              |
| ⛔ G2 | What the seal says when the host passes no `mark`: the approver's initials, a product mark, or nothing. Until Yankun decides, `mark` is required and the docs pass 准 ("approved").                             | WP 3.2 default only |

## Approvals this plan changes

| Approval                                                                                               | What changes                                                                                                             | Row    |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| `AGENTS.md`, finish V1: "The seal appears only on the primary action, the current selection and focus" | The seal also appears as the impression in an approved ApprovalGate record. Nothing else gains the seal.                 | A1     |
| Approved Menu and Pocket reveal (Oct 6): "without row stagger"                                         | Unchanged for Menu, Select and Combobox. Plan's arrival is the one staggered reveal, because its order is the run order. | P2     |
| Approved Card (Oct 6): a passive, static frame                                                         | Card gains `drawing`. Drawing → built is a state change the host causes, not a hover or idle motion; Card stays passive. | L1     |
| Finish V8: Card drawn → built is docs-only                                                             | Loading becomes published behavior. The docs demo's Remove phase and fen dimensions stay docs-local.                     | L1, L2 |
| Approved motion roles (D11, finish V5–V6)                                                              | Two new roles, `hold` and `impress`, derived like the others. Existing roles keep their values.                          | M1     |

Everything else in those approvals stands.

## Rules for every work package

These add to `AGENTS.md` and the earlier plans' rules. Where they disagree, `AGENTS.md` wins and you say so in the PR.

1. **Visual values come from this plan or from existing tokens.** If you need a value this plan doesn't give, stop and ask.
2. **Components read roles and utilities.** Durations and curves come from `motion.duration.*` and `motion.easing.*` roles, including the stepped curves in WP 1.1. Never type a duration, curve, distance or color; never read a grade directly.
3. **Depth is drawn, never blurred.**
4. **Nothing plays on load.** A plan restored with a conversation renders at rest. An approval decided before mount renders at rest. A part mounted built is built; a part mounted drawing stays a still drawing.
5. **Layout never moves because of motion.** The arrival clips, the rail fills are paint, a drawing has the same box as the part it becomes, and the record replaces the actions in a row of the same minimum height.
6. **Hooks are classes, slots and data attributes,** never `aria-label` or visible text.
7. **Access is part of the construction.** Keyboard; screen readers (visible status words, `aria-current`, `aria-busy`, polite announcements); reduced motion (end states, no travel); forced colors (paint drops, system colors carry state); RTL (the rail and the pen follow the inline-start side); touch (no hover-only states).
8. **The host keeps ownership.** Plan never runs a step. ApprovalGate never approves or declines on its own; it calls `onApprove` and `onDecline` and renders the `decision` it's given. `drawing` never fetches.

## Phase 1: Motion roles

### WP 1.1 `hold` and `impress` (M1)

Both roles are stepped, like 叠晕 color bands: a value lands in bands instead of a smooth curve.

- **Inputs.** Add `bands: { hold: 4, impress: 3 }` to each finish in `packages/tokens/motion.config.ts`, with a comment. `pnpm motion` derives the roles into `src/motion/<finish>.generated.tokens.json`, so they follow the grade unit.
- **`motion.duration.hold`**: `bands.hold` grade-1 beats, 4 × 270ms = 1080ms in Su. `$description`: press-and-hold confirmation, one band per grade-1 beat. It's a safety delay, so reduced motion keeps the duration and drops only the fill's travel.
- **`motion.easing.hold`**: `steps(4, jump-end)`: a band lands at the end of each beat.
- **`motion.duration.impress`**: aliases `motion.duration.reveal` (grade 5). `$description`: a seal impression inking onto a record.
- **`motion.easing.impress`**: `steps(3, jump-start)`: the ink lands in three bands, the first at once.
- **CSS and JSON.** The step curves reach CSS the way the fold curves do, through a Terrazzo transform next to `foldCurve` in `packages/tokens/contexts.ts`. The JSON export carries the band count and jump position. If the resolver, Terrazzo or the token tests can't carry a `steps()` value, stop and ask.
- **Tests.** Hold equals `bands.hold` × grade 1; both step curves export; no structural token changes.
- **Records.** Add both roles to the role list on Foundations → Motion and to `docs/motion.md` (WP 5.3).

## Phase 2: Plan

### WP 2.1 `Plan.Root` and `Plan.Step` (P1)

**API.**

```tsx
<Plan.Root label="Remove inactive seats">
  <Plan.Step
    status="done"
    title="Read seat assignments"
    detail="North workspace · 412 assigned seats"
  />
  <Plan.Step status="running" title="Prepare the removal list" detail="38 seats · 6 owners">
    {/* What the step produced: a Table, an ApprovalGate, a Card */}
  </Plan.Step>
</Plan.Root>
```

- `Plan.Root`: `label` (required, visible, names the section), `entering?: boolean` (WP 2.2), `announce?: boolean` (default `true`), native `section` props.
- `Plan.Step`: `title` (required), `detail?: ReactNode`, `status: PlanStepStatus`, `children` for what the step produced, native `li` props.
- `PlanStepStatus = 'planned' | 'running' | 'waiting' | 'done' | 'declined' | 'failed' | 'skipped'`. `waiting` is a step that needs the person, usually an approval. `declined` is an approval step resolved with a decline.
- Export `Plan` and its types from `packages/react/src/index.ts`. Mark the component `data-zao-component="plan"`.

**Anatomy.** Slots: `root` (section), `header`, `label`, `summary`, `steps` (ol), `step` (li, with `data-zao-status`), `index`, `title`, `detail`, `status`, `body`, and `pen` (WP 2.2). The rail's stations and segments are paint on each step's `::before` and `::after`, not slots.

- Header: `label` in `type-label font-medium`; `summary` in `type-caption figures-tabular text-muted`, "{n} of {total} done", counting `done` and `declined`. When no step is planned, running, waiting or failed, it reads "Finished · {n} of {total} done". Flex, wrapped, baseline-aligned, space-between, gap `space.1` by `space.3`. `space.2` between the header and the steps.
- Steps: no gap between steps. Each step has `padding-inline-start: space.6` for the rail and `padding-block-end: space.1`.
- A step's row: grid `space.5 | minmax(0, 1fr) | auto`, column gap `space.3`, `padding-block: space.2`, items aligned to the start.
  - `index`: two digits (01, 02), `type-caption figures-id text-muted`, `aria-hidden`. The `ol` already gives the position to assistive technology.
  - `title`: `type-label font-medium`. `detail`: `type-caption text-muted`, `space.0-5` below the title.
  - `status`: `type-caption`, no wrapping, `space.1-5` gap. While running it shows Button's `LoadingIndicator` at `space.3`, imported from `button.tsx` as Message does. The system keeps one pending animation.
- `body`: under the row, `padding-inline-start: calc(space.5 + space.3)` so it aligns with the title. `space.2` above it.

**The rail.**

- **Station**: a `space.2` square with a `stroke.hairline` border, at the inline-start edge, level with the title's first line (`inset-block-start: calc(space.2 + (space.5 − space.2) / 2)`). It sits above the segment.
- **Segment**: a `stroke.hairline` line centered under the station (`inset-inline-start: calc(space.1 − stroke.hairline / 2)`), from the station's bottom to the next station's top, so it runs past any body. Dashes of `space.1` with `space.1` gaps, drawn as a hard-stop repeating gradient. The last step has none.
- **Fill**: when a step is `done` or `declined`, a solid `fg-default` line draws its segment from the top. Register `--zao-plan-fill` (`<percentage>`, initial 0%) and transition it on the Slide role. Stations change fill and edge as a fast, standard state change.

| Status   | Station edge     | Station fill    | Segment                  | Title   | Status text                     |
| -------- | ---------------- | --------------- | ------------------------ | ------- | ------------------------------- |
| planned  | `border-default` | `bg-canvas`     | dashed `border-default`  | muted   | "Planned", muted                |
| running  | `fg-default`     | `bg-canvas`     | dashed `border-default`  | default | "Running", default, medium, arc |
| waiting  | `fg-default`     | `bg-canvas`     | dashed `border-default`  | default | "Needs you", default, medium    |
| done     | `fg-default`     | `fg-default`    | fills solid `fg-default` | default | "Done", muted                   |
| declined | `fg-default`     | `fg-default`    | fills solid `fg-default` | default | "Declined", muted               |
| failed   | `danger.border`  | `danger.subtle` | dashed `border-default`  | default | "Failed", `danger.text`, medium |
| skipped  | `border-subtle`  | `bg-canvas`     | dashed `border-subtle`   | muted   | "Skipped", muted                |

- Status words are visible and are what screen readers read. Keep them in English like Message's status labels; localization is later work.
- `aria-current="step"` on the running or waiting step.
- **Announcements.** When a step's status changes after mount, announce "Step {n} {status}." through `useConversationAnnouncement` when the Plan is inside a Conversation and `announce` is on. Outside a Conversation, the host announces.
- Reduced motion: the fill and station changes are immediate; the arc is static, as Button's is.
- Forced colors: stations and segments in CanvasText, done and declined stations filled with CanvasText, the failed station keeps a CanvasText edge (its word says Failed).
- RTL: the rail sits at the inline-start edge (right in RTL). Use logical properties throughout.

Sketch: the P1 row, Rail.

### WP 2.2 Drawn in (P2)

- **When it plays.** `Plan.Root` learns whether it mounted after its Conversation.Root's first committed render, the way `Conversation.Item` does (`didCommit`), and sets `data-zao-entering`. `entering` overrides it, for example `false` for a plan restored after mount. Outside a Conversation, the default is `false`. A step added to an already mounted Plan draws in by itself, with no stagger delay.
- **The reveal.** Register `--zao-plan-draw` (`<number>`, initial 1) and start each entering step at 0 with `@starting-style`. Transition it on the Reveal role (`motion.duration.reveal`, `motion.easing.reveal`), delayed by the step's index × `motion.duration.fast`. Plan sets the index on each step as a custom property. Clip the step with `inset(−space.1, calc((1 − p) × (100% + space.1) − space.1), −space.1, −space.1)` so the station, the planes of anything in its body, and the pen stay visible. Under `:dir(rtl)`, swap the two side insets.
- **The pen.** A decorative `pen` span in each step (`aria-hidden`), shown only while entering: a `stroke.hairline` line in `fg-default`, `inset-block: −stroke.hairline`, placed at `p × 100%` from the inline-start edge, with `opacity: clamp(0, (1 − p) × 6, 1)` so it fades only at the end.
- Status changes during the arrival don't interrupt it.
- Reduced motion: no arrival. Forced colors: the pen is CanvasText.

Sketch: the P2 row, Drawn in.

## Phase 3: ApprovalGate

### WP 3.1 The gate and its record (A1)

**API.** One component. Fewer choices, better defaults.

```tsx
<ApprovalGate
  title="Remove 38 seats"
  reference="REQ-2291"
  facts={[
    { label: 'Seats', value: '38 with no sign-in since Jul 15' },
    { label: 'Owners', value: '6 get an email' },
    { label: 'Licenses', value: 'Return to the pool' },
  ]}
  note="Nothing changes until you approve."
  approveLabel="Approve removal"
  approvedLabel="Approved removal"
  declineLabel="Decline"
  declinedLabel="Declined removal"
  mark="准"
  decision={decision} // null | { kind: 'approved' | 'declined'; by: string; at: string }
  pending={pending}
  onApprove={approve}
  onDecline={decline}
/>
```

- Required: `title`, `approveLabel`, `approvedLabel`, `declineLabel`, `declinedLabel`, `decision`, `onApprove`, `onDecline`, and `mark` until G2. Optional: `reference`, `facts`, `note`, `pending`, `disabled`, native `div` props. ZAO can't derive a past tense, so the host passes both verbs (copy rule: the result uses the same verb).
- Mark it `data-zao-component="approval-gate"`. Export it and its types.

**Anatomy.** It renders a `Card`, so it keeps Card's surface, planes, facet and load-path dip on press.

- Slots: `header`, `title`, `reference`, `facts`, `actions`, `note`, `record`, `record-text`, `impression`.
- Card content: flex column, gap `space.3`.
- Header: `title` in `type-label font-medium`; `reference` in `type-caption figures-id text-muted`. Wrapped, baseline-aligned, space-between, gap `space.1` by `space.3`.
- Facts: a `dl` grid of `auto minmax(0, 1fr)`, gap `space.1` by `space.4`. `dt` in `type-caption text-muted`; `dd` in `type-caption text-default`.
- Actions row: a `stroke.hairline` `border-subtle` rule above it, `padding-block-start: space.3`, `min-block-size: size.control.md`. Flex, wrapped, centered, space-between, gap `space.2` by `space.3`. `note` in `type-caption text-muted` at the start. At the end, gap `space.2`: Decline (secondary Button), then Approve (primary Button).
- **Pending.** While `pending`, Approve shows Button's `loading` with the announcement "{approveLabel}", and Decline is disabled. The host sets `decision` when its request is accepted.

**The record.** When `decision` is set, the record replaces everything in the actions row, at the same minimum height.

- End-aligned flex, centered, gap `space.3`, `text-align: end`. `record-text` is a column with gap `space.0-5`: the verb (`approvedLabel` or `declinedLabel`) in `type-label font-medium`, then "{by} · {at}" in `type-caption figures-tabular text-muted`. An approved record ends with the `impression` (WP 3.2); a declined record has none.
- When the decision arrives after mount and focus was inside the gate's actions, move focus to the record (`tabIndex={-1}`, `outline-focus` on `:focus-visible`), because the focused button has unmounted. Never move focus at mount or from elsewhere.
- When the decision arrives after mount, the record fades in as a fast, standard state change. Reduced motion: at rest.
- `role="status"` on the record, so a decision made after mount is announced.

### WP 3.2 The impression (A1, A2)

- A `size.control.md` square, `aria-hidden`, flat (no planes: it's a print on the face). Its leading corner carries the facet, as the seal's face would: `border-top-right-radius: radius.facet` with `corner-shape: bevel` inside `@supports`.
- **Solid cut 白文.** Fill `accent-solid`: the seal, so azurite works through the accent roles with no component change. The mark is in `bg-surface`, the Card's face, so the paper shows through.
- **The mark.** The host's `mark`, meant for one or two characters, centered. Set it in the display family with CJK serif fallbacks (`'Songti SC', 'Noto Serif SC', 'Source Han Serif SC', serif`), at 0.62 × `size.control.md`, `font-strong`, `line-height: 1`, lowered by 0.02 × `size.control.md` for optical center. Add no font file. If Yankun wants a bundled CJK face, that's a new dependency: ask.
- **Ink.** When `decision` becomes approved after mount, the impression inks in with opacity on the Impress role (`motion.duration.impress`, `motion.easing.impress`): three stepped bands. A restored approval renders at rest. Reduced motion: at rest.
- Forced colors: `forced-color-adjust: none`, CanvasText fill, Canvas mark.
- No `cut` prop: the outline cut 朱文 is not part of this plan.

Sketch: the A1 row, Button + seal; the A2 row, Solid.

### WP 3.3 Hold to approve (⛔ G1)

The `hold` role exists after WP 1.1. Don't start this WP until Yankun answers G1. For reference, the sketch's Hold option behaves like this: holding starts on pointer down or on a Space or Enter keydown that isn't a repeat, and seats the face. The fill adds one band per beat on the Hold role and completes after `motion.duration.hold`; the timer reads the token, never a constant. Releasing early drains the fill on the Exit curve at the fast duration. The touch context menu is suppressed, and a visually hidden hint says "Press and hold". In the sketch, that behavior is on the seal button; on a primary Button it needs G1's visual.

## Phase 4: Drawing

### WP 4.1 `drawing` on Card and Table.Root (L1, L2)

**API.** `drawing?: boolean` and `drawingLabel?: string` (default "Loading") on `Card` and `Table.Root`. The host renders placeholder content of the expected shape while it loads, as it would for a skeleton, or the last-known content. ZAO draws it.

- While drawing: `data-zao-drawing`, `aria-busy="true"` and `inert` on the root, with the content hidden from assistive technology. A sibling announces `drawingLabel` politely, the way Button's loading announcement does (reuse or generalize `button-loading-announcement`; it's fixed-position, so it adds no layout).
- **Paint**, as a new `construction-drawing` utility in `theme.css`, keyed on `[data-zao-drawing]`:
  - Frame: `--zao-plane-rest: 0px`, the border in `fg-default`, a transparent face, no transitions.
  - Text: every descendant gets `color: transparent` and `text-decoration-line: underline overline` (solid, `border-default`, `stroke.hairline` thick, `text-decoration-skip-ink: none`, `text-underline-offset: 0.18em`). Each line of text is drawn as its lettering guidelines, cut from its real line box.
  - Icons drawn with `currentColor`: `border-default`.
  - Recesses inside the part (wells, Progress tracks, meters): a `stroke.hairline` `border-default` outline, no fill, no walls.
  - Table: rules stay `border-subtle`; row hover, focus and selection fills are suppressed.
  - Controls inside the part are inert. A Button inside draws as an outline: transparent face, `border-default` edge, no planes.
- **Built.** When `drawing` turns false after mount, the root keeps `data-zao-building` for one build duration, then drops it:
  1. The guidelines withdraw (`text-decoration-color` to transparent) on Reveal exit.
  2. Then the ink and the face arrive (text color, background, borders, inset walls) on Reveal.
  3. Halfway through that, the planes rise to rest on Lift.
  - The build duration is reveal exit + reveal ÷ 2 + lift, read from the computed roles.
- Nothing animates while drawing. A part mounted drawing is a still drawing; a part mounted built is built.
- Reduced motion: drawing and built swap with no transition. Forced colors: the frame and the guidelines in CanvasText.
- **L2.** The published state has no dimensions.

Sketch: the L1 row, Drawing.

### WP 4.2 The Card page's drawn → built demo

`construction-states.tsx` keeps its three phases. Load and Build use the published `drawing` state. Remove ("returns to its drawing, then to nothing") and the fen dimension lines during Load stay docs-local. Delete the docs-local SVG placeholder rows once the published drawing replaces them.

## Phase 5: Docs, specimens, tests and records

### WP 5.1 Docs pages and specimens

- New pages `/components/plan` and `/components/approval-gate`, in `docs-sections.ts` after Conversation, with the assistant parts.
- Plan page: a plan in every step state; a Plan inside a Conversation with a labelled "Local simulation" run, "Propose again" for the arrival, and a "Fail step 2" switch, as in the sketch's working assistant.
- ApprovalGate page: waiting (working, with Reset), pending, approved and declined, in both seals.
- Card and Table pages: a Loading section with Load and a "Keep loading" switch, labelled as a simulation, plus how to pass placeholder rows.
- The landing workspace doesn't change in this plan (see Out of scope).

### WP 5.2 Browser tests

Add coverage in Su light and dark, LTR and RTL, with both seals where the seal appears:

- Plan: every status's station, segment, words and `aria-current`; the fill on done and declined; one arc while running; the body aligned with the title; announcements inside a Conversation only after mount.
- Arrival: plays only for a Plan mounted after its Conversation's first commit, never on first render, with `entering={false}`, or with reduced motion; the stagger reads the fast role; the layout box doesn't change during the reveal.
- ApprovalGate: the record replaces the actions at the same minimum height; focus moves to the record only when focus was in the actions; pending shows Button's loading and disables Decline; the impression appears only for approved; it inks only after mount; azurite applies through the seal; forced colors.
- Drawing: `aria-busy`, `inert` and the announcement; guidelines on text; no planes and an ink frame while drawing; the built sequence only after mount; the layout box is the same in both states; reduced motion swaps instantly; no transitions while drawing.
- Motion tokens: `hold` and `impress` export to CSS and JSON (token tests).
- No horizontal overflow at 390px.

### WP 5.3 Specs, motion, parts and records

- `docs/components/plan.md` and `approval-gate.md` from the template; `card.md` and `table.md` gain the drawing state; the README coverage table goes from 16 to 18 exports.
- `docs/motion.md`: the bands (`hold`, `impress`), Plan's arrival and its stagger, the rail fill on Slide, and the build sequence.
- `docs/parts.md`: the new slots, `data-zao-entering` on Plan, `data-zao-drawing`, `data-zao-building`.
- `AGENTS.md`: an "Authorized components plan (Oct 13)" section with the rules above. Update the seal rule (V1) for the impression and the floating-layer table if needed.
- `decision-drafts.md` in this folder: one BRIEF decision-log row per decision, for Yankun to add.
- Changesets for `@zao/tokens` and `@zao/react`.

## Verification

- `pnpm build && pnpm test && pnpm typecheck && pnpm format:check`.
- Su light and dark, both seals, LTR and RTL, reduced motion, forced colors, and 390px wide.
- For Yankun: screenshots of the Plan page mid-arrival, mid-run and finished; the ApprovalGate states in both seals; and a Card and Table drawing, mid-build and built.

## Out of scope

- The hold variant, until G1.
- The options Yankun didn't choose: List and Built steps, Instant arrival, the Stamp and Hold seal buttons, the outline cut, Shimmer, and dimensions in published parts.
- Drawing for Progress and the charts, and a published Plan inside the landing workspace. Both are natural next steps; ask first, because the landing's layer captions are Yankun's (L13).
- A bundled CJK face, localization of status words, and Yu.

## Words used in this plan

| Word       | Meaning                                                                                |
| ---------- | -------------------------------------------------------------------------------------- |
| Rail       | The ruler at a plan's inline-start edge                                                |
| Station    | A step's square on the rail                                                            |
| Segment    | The rail line from one station to the next; dashed until the step is done              |
| Arrival    | A proposed plan drawn in, step by step                                                 |
| Pen        | The hairline that leads each step's reveal                                             |
| Gate       | An ApprovalGate waiting for a decision                                                 |
| Record     | What replaces the gate's actions once decided: the verb, who, when                     |
| Impression | The seal's print on an approved record                                                 |
| Mark       | What the impression says, from the host                                                |
| Drawing    | A part shown as its construction drawing while it loads: ink frame, no face, no planes |
| Guidelines | The overline and underline that stand in for a line of text in a drawing               |
| Built      | The sequence from drawing to the finished part                                         |
| Bands      | Stepped values, as in 叠晕 color bands: the hold fill and the impression's ink         |
