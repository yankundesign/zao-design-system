# Component review: progress

Companion to [the plan](README.md). Keep this current so work can stop and resume.

**Status, Nov 13, 2026:** Yankun approved wave 0. It is built on `claude/component-review-wave-0` (not pushed, not merged). Every other row waits for its gate.

## Resume here

1. Wave 0 needs a merge into `main`. Ask Yankun before pushing or opening a pull request.
2. Ask Yankun which rows of waves 1–4 he approves.
3. For an approved row, run the review sheet on its part and fill in that part's line below before building.
4. Build one row per pull request, and update the row's state here.

## Every part

"First pass" is the Nov 13 look described in the plan: one mode for most pages, Chromium only. "Full" means all seven lines of the review sheet are answered and recorded under "Review sheets" below.

| Part                | Review     | Improvement                 | Gate       | State                                    |
| ------------------- | ---------- | --------------------------- | ---------- | ---------------------------------------- |
| Button              | First pass | Result on the face          | CR1        | Proposed, study first                    |
| IconButton          | First pass | Tooltip construction        | CR2        | Proposed                                 |
| TextField           | First pass | Correction glyph            | CR3        | Proposed                                 |
| Select              | First pass | Open cue                    | CR4        | Proposed                                 |
| Combobox            | First pass | Matched run                 | CR5        | Proposed                                 |
| Menu                | First pass | Item shortcut               | CR6        | Proposed                                 |
| Dialog              | First pass | `Dialog.Actions`            | CR7        | Proposed                                 |
| Tabs                | First pass | Leading selection line      | CR8        | Proposed, study first                    |
| Switch              | First pass | Dragged face                | CR9        | Proposed, study first                    |
| Progress            | First pass | Seat at full                | CR10       | Proposed                                 |
| Card                | First pass | Bevel sliver fix A          | CR11       | Built Nov 13, wave 0                     |
| Table               | Oct 15     | Table upgrades plan         | CR12       | Follows that plan                        |
| Conversation        | First pass | Latest counts               | CR13       | Proposed                                 |
| Message             | First pass | Scoped actions rules        | CR14       | Built Nov 13, wave 0                     |
| Composer            | First pass | Drop and paste files        | CR15       | Proposed                                 |
| ComposerContextChip | First pass | Middle shortening           | CR16       | Proposed, confirm the finding first      |
| Plan                | First pass | Run gauge                   | CR17       | Proposed                                 |
| ApprovalGate        | First pass | Hold to approve             | CR18       | Proposed, study first                    |
| Ring                | First pass | Larger on its page          | CR19       | Proposed                                 |
| Meter               | First pass | Inspection cost             | CR20       | Built Nov 13, wave 0                     |
| Share strip         | First pass | Inspection cost             | CR20       | Built Nov 13, wave 0                     |
| Bar                 | First pass | Inspection cost, ruler tick | CR20, CR21 | CR20 built Nov 13, wave 0; CR21 proposed |
| Line                | First pass | Inspection cost, ruler tick | CR20, CR21 | CR20 built Nov 13, wave 0; CR21 proposed |
| Heatmap             | First pass | Inspection cost             | CR20       | Built Nov 13, wave 0                     |
| Histogram           | First pass | Inspection cost, ruler tick | CR20, CR21 | CR20 built Nov 13, wave 0; CR21 proposed |
| Loading mark        | First pass | Stepped mark (five parts)   | S1         | Proposed, study first                    |

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
- **Tests.** `performance.spec.ts` appends to `body` and to `main` on `/` and reads the restyled count from Chromium's trace; it must stay under 500. Without CR14 the `main` case reads 2,319 at the test's window size and fails. `conversation.spec.ts` checks that an earlier response's header actions wait for hover or focus and the latest response's stay.

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
