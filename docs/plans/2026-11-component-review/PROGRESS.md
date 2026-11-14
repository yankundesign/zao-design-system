# Component review: progress

Companion to [the plan](README.md). Keep this current so work can stop and resume.

**Status, Nov 14, 2026:** Waves 0 to 4 are built. Wave 0 is in pull request 6 (`claude/component-review-wave-0`). Waves 1 to 4, and the docs page-switching fix, are on `claude/component-review-wave-1`, stacked on it and not pushed. ComposerContextChip was left as it is by Yankun's decision, and Table runs in its own session.

## Resume here

1. Wave 0 needs a merge into `main` (pull request 6). `claude/component-review-wave-1` is stacked on it; ask Yankun before pushing it or opening its pull request.
2. Table (CR12) is in its own session, on the table upgrades plan.
3. Open for Yankun: the forced-colors Button boundary (see "Review sheets"), and whether `Dialog.Actions` should stack primary first.

## Every part

"First pass" is the Nov 13 look described in the plan: one mode for most pages, Chromium only. "Full" means all seven lines of the review sheet are answered and recorded under "Review sheets" below.

| Part                | Review                                                   | Improvement                 | Gate       | State                                                                    |
| ------------------- | -------------------------------------------------------- | --------------------------- | ---------- | ------------------------------------------------------------------------ |
| Button              | First pass, the study, and 3× close-ups                  | Result on the face          | CR1        | Published Nov 14, wave 2                                                 |
| IconButton          | First pass, plus light, dark and 3× close-ups            | Tooltip construction        | CR2        | Built Nov 13, wave 1                                                     |
| TextField           | First pass, plus light, dark, RTL, forced colors, 360px  | Correction glyph            | CR3        | Built Nov 13, wave 1                                                     |
| Select              | First pass, plus open and closed in light                | Open cue                    | CR4        | Built Nov 13, wave 1                                                     |
| Combobox            | First pass, plus 3× close-ups                            | Matched run                 | CR5        | Built Nov 13, wave 3                                                     |
| Menu                | First pass, plus 3× close-ups                            | Item shortcut               | CR6        | Built Nov 13, wave 3                                                     |
| Dialog              | First pass, plus 3× close-ups                            | `Dialog.Actions`            | CR7        | Built Nov 13, wave 3                                                     |
| Tabs                | First pass, the study, and 3× close-ups                  | Leading selection line      | CR8        | Published Nov 14, wave 2                                                 |
| Switch              | First pass, the study, and 3× close-ups                  | Dragged face                | CR9        | Published Nov 14, wave 2                                                 |
| Progress            | First pass, the study, and 3× close-ups                  | Flush at full (B)           | CR10       | Published Nov 14, wave 2                                                 |
| Card                | First pass                                               | Bevel sliver fix A          | CR11       | Built Nov 13, wave 0                                                     |
| Table               | Oct 15                                                   | Table upgrades plan         | CR12       | In its own session (started Nov 14)                                      |
| Conversation        | First pass, plus 3× close-ups                            | Latest counts               | CR13       | Built Nov 13, wave 3                                                     |
| Message             | First pass                                               | Scoped actions rules        | CR14       | Built Nov 13, wave 0                                                     |
| Composer            | First pass, plus 3× close-ups                            | Drop and paste files        | CR15       | Built Nov 13, wave 3                                                     |
| ComposerContextChip | First pass, plus a 67-character name at 1280px and 360px | None                        | CR16       | Closed Nov 14: left as it is, by decision                                |
| Plan                | First pass, plus 3× close-ups                            | Run gauge                   | CR17       | Built Nov 13, wave 3                                                     |
| ApprovalGate        | First pass, the study, and 3× close-ups                  | Hold to approve             | CR18       | Published Nov 14, wave 2                                                 |
| Ring                | First pass, plus 3× close-ups                            | Larger on its page          | CR19       | Built Nov 13, wave 4                                                     |
| Meter               | First pass                                               | Inspection cost             | CR20       | Built Nov 13, wave 0                                                     |
| Share strip         | First pass                                               | Inspection cost             | CR20       | Built Nov 13, wave 0                                                     |
| Bar                 | First pass, plus 3× close-ups                            | Inspection cost, ruler tick | CR20, CR21 | Built Nov 13, waves 0 and 4                                              |
| Line                | First pass                                               | Inspection cost             | CR20       | Built Nov 13, wave 0; CR21 left out, its guide already crosses the ruler |
| Heatmap             | First pass                                               | Inspection cost             | CR20       | Built Nov 13, wave 0                                                     |
| Histogram           | First pass, plus 3× close-ups                            | Inspection cost, ruler tick | CR20, CR21 | Built Nov 13, waves 0 and 4                                              |
| Loading mark        | First pass, the study, and 3× close-ups                  | Grade ticks (A), five parts | S1         | Published Nov 14, wave 2                                                 |

## Wave 2, published (Nov 14)

On Nov 14 Yankun chose from the studies: publish CR1, CR8, CR9 and CR18 as studied; S1 A; CR10 B; leave ComposerContextChip as it is (CR16). The private studies page and its tests are removed.

| Row               | What was published                                                                                 | Notes from building it                                                                                                                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 loading mark   | Eight grade ticks in place of the arc, in every pending state. The mark is a `span`, not an `svg`. | A first version animated a custom property and cost 23ms of style work per second with five marks in view. The published one moves only transforms and costs under 1ms.                                                                                             |
| CR10 Progress     | At full, the frame and well walls take the face's ink.                                             | B, not the lean.                                                                                                                                                                                                                                                    |
| CR8 Tabs          | The primary line's leading end on Slide, trailing end on Reveal.                                   | A first version placed the indicator by insets and drifted by 1/64px at rest, which the existing geometry tests caught. The published one keeps the translation and size and transitions four registered lengths. The interruption tests now watch the leading end. |
| CR9 Switch        | The face follows a drag and settles on the nearer end.                                             | Stopping the click after a drag that ends where it began also needs `preventDefault`, or a wrapping label toggles the Switch anyway.                                                                                                                                |
| CR1 Button        | `result`, `resultAnnouncement`, `onResultEnd`; IconButton `result`, `resultIcon`.                  | The action keeps its name and width; the result is an overlay hidden from assistive technology, with a polite announcement.                                                                                                                                         |
| CR18 ApprovalGate | `confirm="hold" \| "dialog"`, `holdLabel`, `cancelLabel`; a drawn `seal-well`.                     | G1 is decided. An activation with no hold behind it (a screen reader's) opens the Dialog. The row must not move under a held pointer, and the hold timing hangs on `:active`.                                                                                       |

**Checked.** The specs for the affected parts pass on a production build (110 cases). The full suite result is recorded under "Final checks" below.

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

## Page switching (Nov 13)

Yankun asked for faster switching between docs pages. Measured on the static export, served as Cloudflare Pages serves it (clean URLs, compressed text, long cache only for hashed assets), in headless Chromium at 1440 × 900. Eleven switches through the nav, each pressed 0.8s after its link came into view. The figure is the time from the press to the new page's heading.

| Network profile                 | Before, median | After, median | Before, worst | After, worst |
| ------------------------------- | -------------- | ------------- | ------------- | ------------ |
| 4G: 80ms latency, 9 Mbit/s      | 299ms          | 46ms          | 326ms         | 111ms        |
| Slow: 300ms latency, 1.6 Mbit/s | 805ms          | 60ms          | 1,316ms       | 113ms        |

- **Cause.** Every component link carried the study's `?style=quiet-instrument` suffix once the nav had read the address. A link with a query cannot use the page Next has prefetched, so each press fetched the page first. On arrival the preview then called `router.replace` to restore the suffix, which fetched and rendered the page again. Pages reached from a suffixed address paid as well.
- **Fix, docs-local.** Nav links are plain paths (`components/nav.tsx`). The preview still adds the suffix to the address, with `history.replaceState` a task after its effect, so Next's router hears of it and Back and Forward keep working (`components/component-preview.tsx`). A first attempt that rewrote the address inside the effect ran before Next had taken over `history.replaceState` on first load, and Back to that page then did nothing; the test caught it.
- **Tests.** `performance.spec.ts`: nav links have no query, a switch makes no request that carries the style, the address still gains the suffix, and Back and Forward work. `nav-construction.spec.ts` was rewritten for plain links.
- **Still slow.** An anatomy drawing settles about 0.5s after its page on 4G and 1.4s on the slow profile, down from 0.6s and 2.0s. Its source document is not cacheable, so every visit fetches it and boots its own bundle.
- **Not measured.** The first load of a page (153 requests, 932kB on a component page, most of it prefetching the other pages), and the deployed site itself.

## Frames after waves 1, 3 and 4 (Nov 13)

`measure-frames.mjs` on a production build, every page, at full speed and at 4× CPU slowdown. Each cell is late frames / frames, then the longest frame, for the pages whose parts changed.

| Page         | Hover       | Press       | Tab         | Chart sweep | Press at 4×  |
| ------------ | ----------- | ----------- | ----------- | ----------- | ------------ |
| IconButton   | 0/116, 17ms | 1/211, 33ms | 0/115, 17ms | —           | 1/219, 33ms  |
| Menu         | 1/49, 33ms  | 0/80, 17ms  | 0/117, 17ms | —           | 2/84, 50ms   |
| Select       | 0/387, 17ms | 1/378, 33ms | 1/117, 33ms | —           | 4/385, 117ms |
| Combobox     | 1/609, 33ms | 0/509, 17ms | 0/118, 17ms | —           | 4/527, 50ms  |
| TextField    | 0/271, 17ms | 0/148, 17ms | 0/120, 17ms | —           | 2/150, 50ms  |
| Dialog       | 0/84, 17ms  | 1/147, 33ms | 0/119, 17ms | —           | 2/155, 83ms  |
| Conversation | 1/203, 33ms | 0/311, 17ms | 0/121, 17ms | —           | 2/335, 33ms  |
| Composer     | 0/184, 17ms | 0/213, 17ms | 0/118, 17ms | —           | 1/220, 50ms  |
| Plan         | 0/83, 17ms  | 1/79, 33ms  | 0/121, 17ms | —           | 1/82, 50ms   |
| Ring         | 1/113, 33ms | 0/146, 17ms | 0/119, 17ms | —           | 0/154, 17ms  |
| Bar          | 0/218, 17ms | 0/146, 17ms | 0/119, 17ms | 0/384, 17ms | 0/153, 17ms  |
| Histogram    | 1/219, 33ms | 0/146, 17ms | 1/116, 33ms | 0/384, 17ms | 0/154, 17ms  |

- At full speed no phase has more than one late frame, and none is longer than 33ms. That matches the Nov 13 baseline; no built row added a long frame.
- At 4× slowdown a list or dialog opening costs one or two long frames (Select 117ms at worst). There is no per-row 4× baseline from before these waves to compare with.
- Across all 92 measured rows the one frame over 40ms at full speed was a single 67ms frame on the Button page, which the baseline also showed as warm-up.

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

### Built rows, Nov 13 (second pass)

Every built row was captured at 3× in four more settings: RTL, forced colors, 360px wide, and dark. What was looked at: the open tooltip (CR2), a field's correction (CR3), an open Select (CR4), a filtered Combobox (CR5), the open shortcuts Menu (CR6), a Dialog's action row (CR7), a Composer with files held over it (CR15), a Plan header (CR17), the large ring (CR19) and an inspected Bar (CR21). No page gained horizontal overflow in any setting.

| Lens        | Result                                                                                                                                                                                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UI          | Every new state reads in light, dark and forced colors. The correction glyph, the gauge's tick lengths and the dashed tray all survive forced colors.                                                                                                                                                        |
| Visual      | Each row is drawn with existing parts: planes and facet (CR2), the Table warning glyph (CR3), Menu's caret turn (CR4), the mono caption (CR6), ApprovalGate's row (CR7), the dashed drawing (CR15), hairline ticks (CR17, CR21).                                                                             |
| Motion      | No built row adds motion. The caret turn, the dragging tray and the ruler tick are instant, so reduced motion changes nothing.                                                                                                                                                                               |
| Interaction | Pointer and keyboard were exercised by the new browser cases. **Touch was not exercised.** Drop and paste were driven with synthetic events, not a real drag from the desktop.                                                                                                                               |
| Creativity  | The run gauge and the ruler tick are the two rows that could only be ZAO's; the rest bring parts into agreement.                                                                                                                                                                                             |
| Craft       | **Found and fixed:** in RTL a Menu shortcut's keys were reordered by bidi ("⌘Z" drew as "Z⌘"); the shortcut is now isolated left to right. A wrapped correction hangs beside its glyph. At 360px the Dialog actions stack, the ring wraps its reading below, and the shortcuts Menu stays inside the window. |
| Performance | See "Frames after waves 1, 3 and 4" below.                                                                                                                                                                                                                                                                   |

**Seen in passing, not changed.** In forced colors a Button has no visible boundary: its edge is paint that forced colors remove, so a secondary or quiet action reads as plain text until it is focused. This is how Button behaved before the review. It is a published change and needs Yankun's go-ahead.
