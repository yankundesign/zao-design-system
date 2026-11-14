# Component review: one improvement for every part, November 2026

_For coding agents working in `yankundesign/zao-design-system`. Written Nov 13, 2026, from a first pass over the 18 published parts and 7 charts: frame measurements, a look at every page, the source, and the interface references at [recent.design](https://recent.design/?category=interface). Owner and decision-maker: Yankun._

**Status: wave 0 approved and built Nov 13. Waves 1–4 are proposed.** Yankun approved wave 0 on Nov 13: the `:has()` fix, CR11, CR20 and CR14. It is on `claude/component-review-wave-0` and not merged. Every other improvement is a gate with a lean. Start a row when Yankun approves it or adds this plan to "Current work" in `PLAN.md`. If neither has happened, stop and ask. Progress and resume steps are in [PROGRESS.md](PROGRESS.md).

**This plan gives every part one full review and at least one improvement.**

- **25 parts:** 18 published components and 7 charts.
- **8 parts have theirs** (wave 0, built Nov 13). Six charts no longer re-render every control on each pointer step. Card loses its bevel sliver. Message no longer makes an append restyle every slotted part.
- **17 parts have one proposed.** 16 are below, each with a finding, a lens, a lean and an alternative. Table's comes from its own plan.
- **One shared change**, the loading mark, reaches five parts.

No tokens or dependencies are added. Three rows are docs-local; the others change `@zao/react` and need a changeset.

## What this plan is for

On Nov 13 Yankun asked that every component be reviewed and gain at least one improvement in UI, visual form, motion, interaction, creativity, craft or performance.

The first pass found that the parts already hold 60 FPS, so most improvements here are craft, not speed. They follow `AGENTS.md`: "Care for every detail; keep the number of details small. Refine the details already present before adding more." Each row reuses a detail ZAO already has (the planes, the seat, the ruler tick, the drawing, the Hold role). None adds a new kind of detail.

## What the first pass found

**Frames.** Measured Nov 13 on a production build in headless Chromium with the M3 Pro GPU, at full speed and at 4× CPU slowdown, with [`measure-frames.mjs`](measure-frames.mjs).

- Every hover, press, focus move and chart sweep holds 60 FPS at full speed.
- At 4× slowdown, component motion stays inside the frame: under 8ms of main-thread work per frame.
- The long frames in the baseline (150–700ms on Button, Card, Table, Conversation and Plan) did not repeat when the same control was pressed five times. They are GPU warm-up.
- Two real costs turned up. Chart inspection re-rendered every datum control (fixed, CR20). Insertions on `/` restyled the whole page (fixed in wave 0, with CR14).

**Limits of the first pass.** It was one pass, in Chromium only. Most pages were seen in light mode and three in dark. Menu and Select were opened; Dialog, Combobox and the tooltip were read from source. Touch, RTL, reduced motion and forced colors were not exercised. So each row's first step is the full review sheet below, and its finding may change.

**References.** The recent.design interface set on Nov 13 showed a few patterns worth answering in ZAO's own terms:

- An action that confirms in place: a "Copied" chip, a "Your invite is ready" pill.
- A destructive action that must be held.
- A selection that travels between tools or times.
- Loading drawn from parts: a ring of dots, "4 of 15 documents".
- An exploded isometric drawing of one key, which is ZAO's own subject.

## The review sheet

Run this on a part before building its row, and record the result in `PROGRESS.md`. A part is reviewed when all seven lines have an answer.

| Lens        | Question                                                                                            | How to check                                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| UI          | Does every state read without help: rest, hover, focus, pressed, open, invalid, disabled, loading?  | The part's page in light and dark, both seals, at 1440px and 480px, in RTL and in forced colors.                      |
| Visual      | Is it drawn with the system's parts: planes, facet, well, hairline, the type roles?                 | Compare with `docs/components/<part>.md` and Foundations → Parts. Look for one-off paint.                             |
| Motion      | Does each movement come from a motion role and answer a question?                                   | Foundations → Motion at quarter speed. Reduced motion must end in the same state.                                     |
| Interaction | Do pointer, keyboard and touch all reach every state, and can each be interrupted?                  | Use it with each input. Reverse mid-travel. Press, drag off and release.                                              |
| Creativity  | Is there one thing here that could only be ZAO?                                                     | Name it. If nothing, look at what the part measures, counts or records.                                               |
| Craft       | Do the small things hold: alignment to the fen, long text, empty content, the first and last frame? | Long labels, no content, 320px, zoom to 200%.                                                                         |
| Performance | Does it stay inside the frame at 4× slowdown?                                                       | `measure-frames.mjs` before and after: no frame over 20ms at full speed, and no long animation frame it causes at 4×. |

## The parts

Lens names the main lens of the improvement. "Published" rows change `@zao/react` and need a changeset.

### Components

| Part                | Finding (Nov 13)                                                                                                                                                                                                                                                           | Improvement                                                                                                                                | Lens        | Scope     | Gate |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------- | ---- |
| Button              | Success is silent. The face returns to rest and the label never changes, though the copy rule says the result reuses the verb.                                                                                                                                             | The face holds its result: seated for the Hold beat while the label becomes the result, then it lifts.                                     | Interaction | Published | CR1  |
| IconButton          | Its tooltip is plain `material-overlay`, with no planes and no facet, unlike every other floating layer.                                                                                                                                                                   | The tooltip joins the construction at the small rest depth.                                                                                | Visual      | Published | CR2  |
| TextField           | An invalid field differs from a valid one by the hue of its edge and message alone.                                                                                                                                                                                        | The correction carries Table's warning glyph. Reaches Select and Combobox.                                                                 | UI          | Published | CR3  |
| Select              | The trigger looks the same open and closed. Menu's indicator turns.                                                                                                                                                                                                        | The indicator turns while the list is open, as Menu's does. Reaches Combobox.                                                              | UI          | Published | CR4  |
| Combobox            | A filtered option doesn't show what matched.                                                                                                                                                                                                                               | The matched run of each option is set in `font-medium`.                                                                                    | Interaction | Published | CR5  |
| Menu                | An item is a label and nothing else, so a keyboard shortcut can't be shown.                                                                                                                                                                                                | An optional shortcut on an item, in mono at the trailing edge.                                                                             | UI          | Published | CR6  |
| Dialog              | There is no action row. Each host lays out its own, and they differ.                                                                                                                                                                                                       | `Dialog.Actions`: ApprovalGate's action row, shared.                                                                                       | UI          | Published | CR7  |
| Tabs                | The selection line slides as one block. Nothing says which way it is going until it arrives.                                                                                                                                                                               | The line leads with its fishtail: the leading end moves first and the trailing end closes behind it.                                       | Motion      | Published | CR8  |
| Switch              | The face can be pressed but not moved. A drag does nothing until release.                                                                                                                                                                                                  | The face follows the pointer between its ends and settles on the nearer one.                                                               | Interaction | Published | CR9  |
| Progress            | 100% looks like 99%. Only the caption says "Complete".                                                                                                                                                                                                                     | At full, the face seats one contact step into its well.                                                                                    | Craft       | Published | CR10 |
| Card                | In Chromium a shade sliver shows on the top edge of a card wider than twice its height.                                                                                                                                                                                    | **Built Nov 13.** Fix A: the native border stays lit all round where the planes paint the shade.                                           | Visual      | Published | CR11 |
| Table               | Reviewed on Oct 15 for [the table upgrades plan](../2026-10-table-upgrades/README.md), which picks eight upgrades.                                                                                                                                                         | That plan's first work package is Table's improvement. This plan adds nothing to Table.                                                    | —           | —         | CR12 |
| Conversation        | Latest says "Latest response" whether one result arrived or five.                                                                                                                                                                                                          | Latest counts what arrived while the reader was away: "2 new results".                                                                     | Interaction | Published | CR13 |
| Message             | Measured Nov 13 after the `:has()` fix. Appending a message is cheap (132 parts, 0.6ms on `/`). An append to a page-level container still restyled every slotted part below it (3,006 parts, 7.7ms), because three `:last-child` rules styled `[data-zao-slot='actions']`. | **Built Nov 13.** `Message.Actions` carries a `zao-message-actions` class and the three rules name it: 109 parts, 0.6ms. No visual change. | Performance | Published | CR14 |
| Composer            | Files attach only through the + control. Dropping or pasting a file does nothing.                                                                                                                                                                                          | Drop or paste a file onto the tray. While a file is over it, the tray is drawn as a construction drawing.                                  | Interaction | Published | CR15 |
| ComposerContextChip | The label has no rule for a long name. Confirm what a 60-character file name does first.                                                                                                                                                                                   | A long name stays on one line and shortens in the middle, so the extension stays readable.                                                 | Craft       | Published | CR16 |
| Plan                | Progress through the run is a sentence: "2 of 7 done".                                                                                                                                                                                                                     | A run gauge beside the count: one hairline tick per step, as the Share strip draws one stroke per point.                                   | Creativity  | Published | CR17 |
| ApprovalGate        | A destructive approval takes one press, like any other action. G1 has been open since Oct 13.                                                                                                                                                                              | Hold to approve: the face seats as it is held and the seal impression fills. Decides G1.                                                   | Interaction | Published | CR18 |

### Charts

| Part                                              | Finding (Nov 13)                                                                            | Improvement                                                                               | Lens        | Scope      | Gate |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- | ---------- | ---- |
| Ring                                              | On its own page the ring is drawn at the Card's size, about a third of the preview's width. | On the Ring page the ring is drawn large enough to count its 100 marks.                   | Visual      | Docs-local | CR19 |
| Meter, Share strip, Bar, Line, Heatmap, Histogram | Each pointer step re-rendered every datum control and, when open, the whole data table.     | **Built Nov 13.** A control re-renders only when its own state changes.                   | Performance | Docs-local | CR20 |
| Bar, Line, Histogram                              | Tabs' ruler answers the pointer by extending a tick. The charts' rulers do nothing.         | The ruler tick nearest the inspected datum extends. One ruler behaves one way everywhere. | Craft       | Docs-local | CR21 |

CR20's measured effect, in script milliseconds per second of sweeping: Histogram 83 → 56, Line 55 → 46, Heatmap 36 → 33, Bar 16 → 11, Share strip 13 → 12, Meter 13 → 9.

### One shared change

| Change       | Finding                                                                                                                           | Improvement                                                        | Reaches                                       | Gate |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------- | ---- |
| Loading mark | The pending indicator is a rotating arc: the one drawing in the set that could belong to any system. All pending states share it. | A mark built from the system's own parts, stepped instead of spun. | Button, Message, Plan, ApprovalGate, Composer | S1   |

## Gates

Wave 0's gates (CR11, CR14 and CR20) were decided on Nov 13. Every other gate is open. "Study first" means a private docs-local comparison, as D12 and D13 were decided, before anything is published.

| Gate | Question                                | Lean                                                                                                                                                                                                                                                                                                  | Alternative                                                                         |
| ---- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| CR1  | Does Button show its result?            | Study first, on the Button page and on Message's copy action. After the host reports success, the face stays seated for `motion.duration.hold`, the label becomes the result ("Copied"), then the face lifts. Publish a result prop only after the study.                                             | No new state. Document that a host swaps the label, and leave the face alone.       |
| CR2  | Does the tooltip get planes?            | Yes: `popup-construction construction-planes` with `depth.rest.small`, still instant. Check both studies' CSS first.                                                                                                                                                                                  | Keep it flat, and record the tooltip in `AGENTS.md` as the one flat floating layer. |
| CR3  | How is a correction marked?             | Iconoir `WarningTriangle` at the small icon size before the message, in `text-danger`, hidden from assistive technology. The same glyph as Table's "Needs review".                                                                                                                                    | The glyph inside the field at its trailing edge.                                    |
| CR4  | What shows that a field's list is open? | The trailing indicator turns half a turn while open, as Menu's does.                                                                                                                                                                                                                                  | The open trigger takes `bg-active`, as Menu's trigger does.                         |
| CR5  | How is a match shown?                   | The first matched run in `font-medium`, case-insensitive. Nothing else changes.                                                                                                                                                                                                                       | Mute the unmatched text instead.                                                    |
| CR6  | Does a Menu item take a shortcut?       | `shortcut?: string`, drawn in mono `type-caption` and `text-muted` at the trailing edge, and exposed through `aria-keyshortcuts`. The host still binds the key.                                                                                                                                       | No prop. The host passes a node as the label.                                       |
| CR7  | Does Dialog get an action row?          | `Dialog.Actions`: a hairline rule above, an optional note at the leading edge, actions at the trailing edge with the primary last. Under 20rem the actions stack full width, primary first. The frame stays instant (D7).                                                                             | A docs recipe only.                                                                 |
| CR8  | How does the selection line travel?     | Study first. The leading end moves on Reveal and the trailing end on Slide, so the line stretches toward the new tab and closes. No overshoot. Reduced motion stays instant.                                                                                                                          | Keep the block slide.                                                               |
| CR9  | Can the Switch face be dragged?         | Study first. While pressed, the face follows the pointer between its ends; on release it settles on the nearer end on Slide. A press without travel toggles as today.                                                                                                                                 | Keep press only.                                                                    |
| CR10 | What marks a finished Progress?         | When the value reaches its maximum, the face seats by `depth.contact` on Seat, once. Unknown completion and the values in between are unchanged.                                                                                                                                                      | The end stop turns ink at full.                                                     |
| CR11 | Land the Card sliver fix?               | **Decided Nov 13: fix A.** `card-material` keeps the native border lit all round where the planes already paint the shade. At zero depth the trailing edges read lit.                                                                                                                                 | Wait for a Chromium fix and keep the gallery's 2:1 workaround.                      |
| CR12 | —                                       | Decided in the table upgrades plan.                                                                                                                                                                                                                                                                   | —                                                                                   |
| CR13 | What does Latest say?                   | The count of results added since the reader left the latest: "1 new result", "2 new results". "Latest response" when the count is zero. A host's own children still win.                                                                                                                              | A small ink square on the control, with no count.                                   |
| CR14 | Scope the Message actions rules?        | **Decided Nov 13: yes.** Measured first. The cost was confirmed for an append to a page-level container, not for an append of a message. Built.                                                                                                                                                       | Leave it: 7ms is inside one frame at full speed.                                    |
| CR15 | Does Composer take dropped files?       | Drop and paste call the same host path as the + control. While a file is dragged over the tray, its perimeter and writing plane are drawn with `construction-drawing`. The host still validates.                                                                                                      | Paste only.                                                                         |
| CR16 | How does a long context name shorten?   | One line. The middle is replaced by an ellipsis and the last characters, including the extension, stay. The full name stays in the accessible name.                                                                                                                                                   | End ellipsis.                                                                       |
| CR17 | Does Plan draw its count?               | One hairline tick per step beside "2 of 7 done": `fg-default` for done, `fg-muted` for the rest, and `text-danger` for a failed step. Decorative; the sentence stays.                                                                                                                                 | Keep the sentence only.                                                             |
| CR18 | Does hold-to-approve ship? (G1)         | Study first. Holding the primary action seats its face through the rest depth over `motion.duration.hold` while the seal impression fills. Releasing early returns it on Fold exit. Space and Enter can be held. A host prop turns the hold into a Dialog confirm, and reduced motion uses that path. | No hold. A destructive approval opens a Dialog.                                     |
| CR19 | How large is the ring on its own page?  | Twice the Card's size, with the same 100 marks and scale ring. The Card and the overview keep theirs.                                                                                                                                                                                                 | Keep the size and set the frame's slots beside the ring.                            |
| CR20 | —                                       | Built and committed.                                                                                                                                                                                                                                                                                  | —                                                                                   |
| CR21 | Does a chart's ruler answer inspection? | The tick nearest the inspected datum extends to the major length, instantly. Hover is inspection, not data, so rule 5 holds.                                                                                                                                                                          | Leave the rulers still.                                                             |
| S1   | What is the loading mark?               | Study first. **A:** eight ticks, one per motion grade, filling in eight steps per `motion.duration.loading`. **B:** the four focus-bracket corners drawn in turn. Lean A. Reduced motion shows the still mark, as today.                                                                              | Keep the arc.                                                                       |

## Decisions already waiting

These are not new. The review found them written and unmerged. Wave 0 landed the first three on `claude/component-review-wave-0` on Nov 13.

| Item                               | Where                                                                           | What it needs                                    |
| ---------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| Insertion cost in Tabs and Message | `7ef24b7`, cherry-picked to `claude/component-review-wave-0` with its changeset | Approved Nov 13. The branch needs a merge.       |
| Card's bevel sliver (CR11)         | `eed4a67`, cherry-picked to `claude/component-review-wave-0` with its changeset | Fix A approved Nov 13. The branch needs a merge. |
| Chart inspection (CR20)            | Committed on `claude/component-review-wave-0`                                   | The branch needs a merge.                        |
| Hold to approve (CR18)             | G1 in [the components plan](../2026-10-components/README.md)                    | A decision, after the study.                     |

## Approvals this plan would change

| Approval                                                                                           | What would change                                                                         | Gate       |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------- |
| Approved Button (Oct 6, Oct 7) and label behavior A (Oct 11, D12)                                  | Button gains a result state. The label still travels with the face.                       | CR1        |
| Button spec: the pending indicator is a linear rotation                                            | The mark's drawing and stepping change. The system still keeps one pending animation.     | S1         |
| Approved IconButton (Oct 6): a hoverable, Escape-dismissible tooltip                               | The tooltip gains planes and a facet. Its behavior is unchanged.                          | CR2        |
| Approved field edges (Oct 8, D6)                                                                   | The correction gains a glyph. Edge roles and values are unchanged.                        | CR3        |
| Approved Menu and Pocket reveal (Oct 6) and Menu items (Oct 9, D8)                                 | Select and Combobox triggers gain Menu's open cue. Menu items may carry a shortcut.       | CR4, CR6   |
| Approved Dialog B (Oct 9, D7)                                                                      | Dialog gains one part. The frame, veil and instant entry stay.                            | CR7        |
| Approved Tabs (Oct 7) and the fishtails (Oct 15)                                                   | The selection line's two ends travel on different roles.                                  | CR8        |
| Approved Switch (Oct 7): "activation travels directly to the opposite endpoint"                    | A drag can carry the face. Press, keyboard and rapid toggling stay as approved.           | CR9        |
| Requested Progress refinement (Oct 7)                                                              | One seat at full. No idle motion is added.                                                | CR10       |
| Workspace craft pass (Oct 15): Card material                                                       | The native border is lit all round under the planes. Approved Nov 13.                     | CR11       |
| Conversation and Composer plan (Oct 12): "docked secondary Latest (existing public API unchanged)" | Latest's default label changes with the count. Composer accepts dropped and pasted files. | CR13, CR15 |
| Components plan (Oct 13): Plan's rail; G1                                                          | Plan's header gains a gauge. G1 is decided.                                               | CR17, CR18 |
| Data visualization guideline: rule 5, motion only from data                                        | Unchanged. An extended ruler tick is an instant inspection state.                         | CR21       |

## Order

Each wave can stop after any row. Within a wave, rows touch different parts and can run at the same time.

| Wave | Outcome                                      | Rows                             | Why first                                                                                |
| ---- | -------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| 0    | Waiting work lands                           | `7ef24b7`, CR11, CR20, then CR14 | Approved and built Nov 13. Already written or measured; no design decision beyond a yes. |
| 1    | Consistency: the parts agree with each other | CR2, CR3, CR4, CR16              | Small, visible, and each removes a difference between two parts.                         |
| 2    | Studies: how the parts feel                  | S1, CR1, CR18, CR9, CR8, CR10    | Each needs Yankun to see it before it is published.                                      |
| 3    | Reach: what the parts can do                 | CR5, CR6, CR7, CR13, CR15, CR17  | Each adds a prop, a part or a default.                                                   |
| 4    | Charts and Table                             | CR19, CR21, CR12                 | Docs-local, and Table follows its own plan.                                              |

## Each work package

One row per pull request. A row is done when:

1. The part's review sheet is recorded in `PROGRESS.md`, and its finding still holds. If the full review finds something more important, stop and ask before swapping the improvement.
2. A "study first" gate has been shown to Yankun as a docs-local comparison, and he has chosen.
3. The change uses existing tokens, motion roles and utilities. Never type a duration, a curve or a color. Keep host ownership, native geometry, reduced motion, forced colors, RTL and touch.
4. The part's spec file in `apps/docs/e2e/` covers the new behavior, and `measure-frames.mjs` shows no frame over 20ms at full speed and no new long animation frame at 4× slowdown.
5. `docs/components/<part>.md`, the part's docs page, `AGENTS.md` and this plan's `PROGRESS.md` record the decision. A published row has a changeset.
6. `pnpm build && pnpm test && pnpm typecheck && pnpm format:check` pass.

## Out of scope

- **Rolling digits in readings.** A reading whose changed digits roll would be new motion in charts and needs its own ruling against rule 5.
- **Focus brackets that travel between neighbors.** It needs positioning that no part has today.
- **Dialog entry or exit motion.** D7 keeps Dialog instant.
- **Yu, new tokens and new dependencies.**
- **The landing page.** It follows [the landing sequence plan](../2026-11-landing-sequence/README.md).
