# Component review: progress

Companion to [the plan](README.md). Keep this current so work can stop and resume.

**Status, Nov 13, 2026:** Wave 0 is in pull request 6 (`claude/component-review-wave-0`). Waves 1, 3 and 4 are built on `claude/component-review-wave-1`, stacked on wave 0 and not pushed. Wave 2 is six private studies on the same branch that wait for Yankun's choice. Two rows are open: CR16 and CR12.

## Resume here

1. Wave 0 needs a merge into `main` (pull request 6). `claude/component-review-wave-1` is stacked on it; ask Yankun before pushing it or opening its pull request.
2. Show Yankun `/studies/component-review` and record his choice for S1, CR1, CR18, CR9, CR8 and CR10. Publish a study only after he chooses, one row per commit, with a changeset, and remove its section from the studies page.
3. Ask Yankun what ComposerContextChip gains (CR16), and whether the table upgrades plan starts (CR12).
4. Run the seven-lens review sheet for a part before publishing a study for it, and record it under "Review sheets".

## Every part

"First pass" is the Nov 13 look described in the plan: one mode for most pages, Chromium only. "Full" means all seven lines of the review sheet are answered and recorded under "Review sheets" below.

| Part                | Review                                                   | Improvement                 | Gate       | State                                                                    |
| ------------------- | -------------------------------------------------------- | --------------------------- | ---------- | ------------------------------------------------------------------------ |
| Button              | First pass, plus 3× close-ups                            | Result on the face          | CR1        | Study built; waits for Yankun                                            |
| IconButton          | First pass, plus light, dark and 3× close-ups            | Tooltip construction        | CR2        | Built Nov 13, wave 1                                                     |
| TextField           | First pass, plus light, dark, RTL, forced colors, 360px  | Correction glyph            | CR3        | Built Nov 13, wave 1                                                     |
| Select              | First pass, plus open and closed in light                | Open cue                    | CR4        | Built Nov 13, wave 1                                                     |
| Combobox            | First pass, plus 3× close-ups                            | Matched run                 | CR5        | Built Nov 13, wave 3                                                     |
| Menu                | First pass, plus 3× close-ups                            | Item shortcut               | CR6        | Built Nov 13, wave 3                                                     |
| Dialog              | First pass, plus 3× close-ups                            | `Dialog.Actions`            | CR7        | Built Nov 13, wave 3                                                     |
| Tabs                | First pass, plus 3× close-ups                            | Leading selection line      | CR8        | Study built; waits for Yankun                                            |
| Switch              | First pass, plus 3× close-ups                            | Dragged face                | CR9        | Study built; waits for Yankun                                            |
| Progress            | First pass, plus 3× close-ups                            | Seat at full, or flush      | CR10       | Study built; waits for Yankun                                            |
| Card                | First pass                                               | Bevel sliver fix A          | CR11       | Built Nov 13, wave 0                                                     |
| Table               | Oct 15                                                   | Table upgrades plan         | CR12       | Not started: its own plan and task                                       |
| Conversation        | First pass, plus 3× close-ups                            | Latest counts               | CR13       | Built Nov 13, wave 3                                                     |
| Message             | First pass                                               | Scoped actions rules        | CR14       | Built Nov 13, wave 0                                                     |
| Composer            | First pass, plus 3× close-ups                            | Drop and paste files        | CR15       | Built Nov 13, wave 3                                                     |
| ComposerContextChip | First pass, plus a 67-character name at 1280px and 360px | None yet                    | CR16       | Finding did not hold; not built; needs Yankun                            |
| Plan                | First pass, plus 3× close-ups                            | Run gauge                   | CR17       | Built Nov 13, wave 3                                                     |
| ApprovalGate        | First pass, plus 3× close-ups                            | Hold to approve             | CR18       | Study built; waits for Yankun                                            |
| Ring                | First pass, plus 3× close-ups                            | Larger on its page          | CR19       | Built Nov 13, wave 4                                                     |
| Meter               | First pass                                               | Inspection cost             | CR20       | Built Nov 13, wave 0                                                     |
| Share strip         | First pass                                               | Inspection cost             | CR20       | Built Nov 13, wave 0                                                     |
| Bar                 | First pass, plus 3× close-ups                            | Inspection cost, ruler tick | CR20, CR21 | Built Nov 13, waves 0 and 4                                              |
| Line                | First pass                                               | Inspection cost             | CR20       | Built Nov 13, wave 0; CR21 left out, its guide already crosses the ruler |
| Heatmap             | First pass                                               | Inspection cost             | CR20       | Built Nov 13, wave 0                                                     |
| Histogram           | First pass, plus 3× close-ups                            | Inspection cost, ruler tick | CR20, CR21 | Built Nov 13, waves 0 and 4                                              |
| Loading mark        | First pass, plus 3× close-ups                            | Stepped mark (five parts)   | S1         | Study built; waits for Yankun                                            |

## Waves 1 to 4 (Nov 13)

On Nov 13 Yankun said to continue with waves 1–4. Each built row takes its gate's lean; a "study first" row is a private comparison. All of it is on `claude/component-review-wave-1`, cut from the wave 0 branch, one commit per row or pair of rows.

| Wave | Row                           | Outcome                                                                         |
| ---- | ----------------------------- | ------------------------------------------------------------------------------- |
| 1    | CR2 IconButton tooltip        | Built. `tooltip-construction construction-planes` at `depth.rest.small`.        |
| 1    | CR3 field correction          | Built. A warning glyph before the message in TextField, Select and Combobox.    |
| 1    | CR4 field open cue            | Built. The caret turns while the list is open, in Select and Combobox.          |
| 1    | CR16 context chip             | **Not built.** The finding did not hold: a long name already wraps, under test. |
| 3    | CR5 Combobox match            | Built. The matched run in `font-medium`; a committed value marks nothing.       |
| 3    | CR6 Menu shortcut             | Built, with `keyShortcuts` added for `aria-keyshortcuts`.                       |
| 3    | CR7 `Dialog.Actions`          | Built. Stacks in DOM order under 20rem, not primary first.                      |
| 3    | CR13 Latest count             | Built. Says "message", not "result".                                            |
| 3    | CR15 Composer drop and paste  | Built. A dashed perimeter at rest while files are held over the tray.           |
| 3    | CR17 Plan gauge               | Built. Finished steps are full ticks; the rest are half ticks.                  |
| 4    | CR19 Ring size                | Built. 256px on the Ring page.                                                  |
| 4    | CR21 ruler tick               | Built for Bar and Histogram. Line left out.                                     |
| 4    | CR12 Table                    | **Not started.** It follows its own plan, which has six open gates.             |
| 2    | S1, CR1, CR18, CR9, CR8, CR10 | Studies built at `/studies/component-review`. None published.                   |

**Where the build departs from a lean, and why.**

- **CR6.** `keyShortcuts` was added: "⌘K" is what people read but is not valid `aria-keyshortcuts`.
- **CR7.** Stacked actions keep their DOM order (primary last). Primary first would need a reversed visual order, which breaks the match between focus order and reading order.
- **CR13.** The count is of list items, which includes the reader's own request, so the label says "message".
- **CR15.** The tray uses the dashed drawing a removing context tag uses. The whole `construction-drawing` utility would also redraw the tray's buttons.
- **CR17.** Unfinished steps are half height as well as muted. Two inks alone are hard to tell apart at one hairline.
- **CR21.** Line already draws its inspection guide through the ruler, so a tick there would be hidden.

**What the studies found.**

- **CR8.** The lean named the roles the wrong way round. Slide is 157.5ms and Reveal is 198ms in Su, so the leading end must travel on Slide for the line to stretch and close. The study does that.
- **CR10.** Seating the face by `depth.contact` is one pixel and barely reads. The study adds B, where the face fills its frame at full, for comparison.
- **CR18.** The hold timing has to hang on the press itself (`:active`), not on host state: a frame of React latency started the face on the 80ms Seat role instead. A published version needs the same care.
- **CR18.** The row must keep its actions still while held. A note that changed width moved the button from under the pointer and cancelled the hold.

**Checked Nov 13.** `pnpm build`, `pnpm typecheck` and `pnpm format:check` pass. `pnpm test` ran in full once after waves 1, 3 and 4: tokens 94, engine 44 and lab 31 pass, and 734 of 736 docs browser cases passed. Both failures were in new tests (one expected Latest to unmount while it held focus; one hard-coded a medium weight of 500 where Su's is 530). Both tests were fixed, and the affected specs then passed (125 cases), as did the three studies cases, twice. The full suite was not run again after those test fixes or after the studies page was added.

**Not done.**

- The seven-lens review sheets were not run in full. Each built row was checked in light and dark at 3× and by its new browser cases; RTL, forced colors and 360px were checked for the field correction only. Touch was not exercised for any row.
- The studies cover left-to-right only for CR8, and no study was checked on a touch device.
- Frame measurements (`measure-frames.mjs`) were not repeated for the built rows.
- Nothing on `claude/component-review-wave-1` is pushed.

## Wave 0 (approved and built Nov 13)

Yankun approved wave 0 on Nov 13. It is on `claude/component-review-wave-0`, cut from `main` at `fbd867d`, in its own worktree so the uncommitted landing work in the main checkout stays untouched.

| Commit                              | Row                  | Source                                                         |
| ----------------------------------- | -------------------- | -------------------------------------------------------------- |
| Message and Tabs: `:has()` rules    | The `:has()` fix     | `7ef24b7` from `claude/quirky-blackwell-d2c55a`, cherry-picked |
| Card: native border lit             | CR11                 | `eed4a67` from `claude/peaceful-hertz-d5508e`, cherry-picked   |
| Charts: inspecting a datum          | CR20                 | The two chart files from the main checkout's working tree      |
| Message: actions rules name a class | CR14, with this plan | Written Nov 13                                                 |

**CR14, measured first.** Production build, headless Chromium, 1440 × 900, on `/` (5,420 elements) after the `:has()` fix. Each cell is the parts one style recalculation visited, then the time per insertion or removal.

| Insertion                                 | Before CR14        | After CR14       |
| ----------------------------------------- | ------------------ | ---------------- |
| A message appended to a Conversation list | 132 parts, 0.6ms   | 123 parts, 0.6ms |
| An empty `div` appended to `body`         | 100 parts, 0.5ms   | 100 parts, 0.5ms |
| An empty `div` appended to `main`         | 3,006 parts, 7.7ms | 109 parts, 0.6ms |

- **The plan's finding was worded wrongly.** Appending a message was already cheap. The cost was an append to a container whose previous last child holds the page: when a part stops being a last child, Chromium restyles whatever below it a `:last-child` rule could reach. Three rules in `conversation.css` ended in `[data-zao-slot='actions']`, which reached every slotted part.
- **Why it matters outside the docs.** `main` on `/` has one child, the whole landing. A host whose app root is `body`'s last child is in the same position each time a popup's portal is appended after it. This is an inference from the mechanism; it was not measured in a host app.
- **The fix.** `Message.Actions` carries a `zao-message-actions` class and the three rules name it. They match the same elements. Changeset: `message-actions-class` (patch).
- **Tests.** `performance.spec.ts` appends to `body` and to `main` on `/` and reads the restyled count from Chromium's trace; it must stay under 500. Two marks bound the appends, because the landing restyles itself (up to 4,510 parts) shortly after it loads; that belongs to the landing sequence, not to this guard. Without CR14 the `main` case reads 2,319 at the test's window size and fails. `conversation.spec.ts` checks that an earlier response's header actions wait for hover or focus and the latest response's stay.

**Checked Nov 13.** `pnpm build`, `pnpm typecheck` and `pnpm format:check` pass. `pnpm test` ran in full once: tokens 94, engine 44 and lab 31 pass, and 720 of 721 docs browser cases pass. The one failure was the new guard reading the landing's own after-load restyle; the marks fixed it, and `performance.spec.ts` then passed five runs in a row. The full suite was not run again after that test-only change.

**Not done in wave 0.**

- The seven-lens review sheets for Card, Message and the six charts were not run. These rows are fixes written or measured before the plan; their "Review" column stays "First pass".
- Nothing is pushed, and no pull request is open.
- The source branches and their worktrees (`claude/quirky-blackwell-d2c55a`, `claude/peaceful-hertz-d5508e`) are untouched.
- The gallery's 2:1 workaround for ApprovalGate, which CR11 makes unnecessary, is in the main checkout's uncommitted gallery work and was left alone.
- The main checkout on `perf/docs-load` still holds uncommitted copies of the two chart files and an older copy of this plan folder. Discard them there once this branch is merged.

## CR20: chart inspection (built Nov 13)

- `apps/docs/components/charts/chart-inspector.tsx`: each datum's button is a memoized `DatumControl`, and `useInspection` returns stable `toggle`, `clear` and `undismiss`. A hover re-renders no control; an arrow key re-renders the two that trade focus. Arrow keys find the next button through the group's children instead of a ref array.
- `apps/docs/components/charts/chart-data-view.tsx`: `ChartDataView` is memoized on its cells, so an open table does not re-render while the pointer crosses the plot.
- Checked: 124 browser cases pass (`data-visualization`, `storage-ring-study`, `performance`, `landing`, `new-components`, and the Menu and TextField anatomy cases); the docs type-check passes. The full suite was not run.
- Committed in wave 0.

## Baseline frames, Nov 13

Full speed, production build, before CR20. Each cell is late frames / frames, then the longest frame. A late frame is over 20ms. The long frames marked \* did not repeat when the same press was run five times, so they are GPU warm-up, not the part.

| Page         | Hover          | Press          | Tab         | Chart sweep |
| ------------ | -------------- | -------------- | ----------- | ----------- |
| Button       | 3/362, 300ms\* | 4/621, 217ms\* | 0/120, 17ms | —           |
| IconButton   | 0/118, 17ms    | 1/211, 33ms    | 0/119, 17ms | —           |
| Card         | 1/288, 150ms\* | 2/185, 417ms\* | 0/118, 17ms | —           |
| Menu         | 1/33, 33ms     | 0/47, 17ms     | 0/121, 17ms | —           |
| Select       | 0/389, 17ms    | 1/377, 33ms    | 0/117, 17ms | —           |
| Combobox     | 0/611, 17ms    | 0/509, 17ms    | 0/121, 17ms | —           |
| TextField    | 0/270, 17ms    | 1/179, 33ms    | 0/171, 17ms | —           |
| Dialog       | 1/111, 33ms    | 2/149, 67ms    | 1/136, 33ms | —           |
| Tabs         | 1/187, 33ms    | 0/426, 17ms    | 0/115, 17ms | —           |
| Switch       | 1/117, 33ms    | not pressed    | 0/115, 17ms | —           |
| Progress     | no controls    | no controls    | 0/116, 17ms | —           |
| Table        | 0/236, 17ms    | 1/143, 150ms\* | 0/115, 17ms | —           |
| Conversation | 2/201, 150ms\* | 0/312, 17ms    | 0/115, 17ms | —           |
| Composer     | 0/184, 17ms    | 3/214, 50ms    | 0/114, 17ms | —           |
| Plan         | 0/83, 17ms     | 1/70, 200ms\*  | 0/116, 17ms | —           |
| ApprovalGate | 0/49, 17ms     | 1/80, 33ms     | 0/116, 17ms | —           |
| Ring         | 1/116, 33ms    | 0/146, 17ms    | 0/115, 17ms | —           |
| Meter        | 0/117, 17ms    | 0/80, 17ms     | 0/119, 17ms | 0/944, 17ms |
| Share strip  | 0/84, 17ms     | 1/79, 33ms     | 0/115, 17ms | 0/756, 17ms |
| Bar          | 0/220, 17ms    | 0/146, 17ms    | 0/116, 17ms | 0/387, 17ms |
| Line         | 0/219, 17ms    | 0/146, 17ms    | 0/117, 17ms | 0/387, 17ms |
| Heatmap      | 0/117, 17ms    | 1/79, 33ms     | 0/115, 17ms | 0/200, 17ms |
| Histogram    | 0/220, 17ms    | 0/147, 17ms    | 0/116, 17ms | 0/384, 17ms |

Gaps in this baseline to close when a part's row starts:

- The script presses buttons and tabs only, so Switch was hovered and focused but not toggled, and Progress has no control to drive.
- Select, Combobox and Menu lists were opened by a press and closed by Escape; arrow-key travel inside them was not measured.
- Composer typing and Conversation scrolling were not measured.

## Review sheets

Add one block per part when its row starts: the date, what was looked at (modes, seals, widths, inputs), and one line for each of the seven lenses.
