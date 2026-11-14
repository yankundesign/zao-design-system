# ZAO table upgrades plan, October 2026

_For coding agents working in `yankundesign/zao-design-system`. Written Oct 15, 2026, from the Table Interaction Atlas research and Yankun's picks. Owner and decision-maker: Yankun._

**Status: picks decided Oct 15, with six open gates (G1–G6). Each gate has a lean.** Start when Yankun points you here or adds this plan to "Current work" in `PLAN.md`. If neither has happened, stop and ask. A gated row waits for its gate; everything else can start.

**This plan keeps the basic Table and adds eight upgrades, each opt-in.** Without the new props and parts, Table renders and behaves exactly as it does today. The plan adds:

- `stickyHeader`, `frozenColumn`, `crosshair` and `actionBar` props on `Table.Root`
- a `rowMotion` prop on `Table.Body`
- three new parts: `Table.ActionBar`, `Table.QuestionHead` and `Table.AnswerCell`
- a `useRangeSelection` hook
- a docs-local Table Lens study
- an Upgrades section on the Table page

It changes no other component.

## What this plan is for

Yankun reviewed the Table Interaction Atlas (13 working studies) and picked eight. He wants the Table page to show the basic table first and then these as upgrade options: "so we have a basic table, but we also have these upgrade options to it."

The basic Table stays the still, grounded ledger that was approved. Each upgrade adds one behavior a host turns on, and the upgrades combine. The motion rule from the research applies throughout: motion has to answer a question. Where did that row go? Which group am I in? What did the agent read?

## Reference

- **The atlas:** [Table Interaction Atlas](https://claude.ai/artifact/Dk9novHWyUMP5RJkWu3DN2). A copy of its source is in [`sketch/atlas.html`](sketch/atlas.html). It's a standalone page with its own CSS and sample data; it doesn't run `@zao/react`. Port the behavior. Don't copy its selectors, colors or timings.
- **The research note:** `claude/research/table-interactions.md` in the Design System project, with sources for each study.

Where this plan and the atlas differ, this plan wins. The known differences:

- **Shadows become drawn depth.** The atlas uses soft gradient shadows under the stuck header and beside the frozen column. ZAO never blurs depth. This plan uses drawn planes and eaves (hairlines that appear at a scroll edge only while content is hidden past it), as Conversation's transcript does.
- **Timings come from roles.** The atlas types grade durations (270, 225, 180 and 135 ms). Components read the motion roles instead (G1).
- **No stagger.** The atlas staggers arriving rows by 24 ms. The approved Menu says "without row stagger", and Plan's arrival is the system's one staggered reveal, so arriving rows fade in together.
- **One pending animation.** The atlas's reading cell has a sweeping line. The system keeps one pending animation, Button's `LoadingIndicator`, so a reading cell shows that.
- **The answer arrival** is typed in the atlas. This plan's lean draws it in with Plan's pen (G4).
- **No arrow-key crosshair.** The atlas moves the crosshair with arrow keys. In ZAO the arrows scroll the Table's region and Table is not a grid, so the crosshair follows the pointer and focus-within.
- **The action bar's material.** The atlas's action bar is an inverted ink strip. This plan uses the system's floating material and the ApprovalGate record pattern (G2).
- **Table Lens follows the data visualization guideline** where the atlas differs.

Atlas plate → row: 1.1 → U1, 1.2 → U2, 2.1 → U3, 2.2 → U4, 3.1 → U5, 3.2 → U6, 5.1 → U7, 6.1 → U8.

## How to use this plan

1. Read `AGENTS.md`, especially the finish, Conversation and components plan sections. Then read this file to the end.
2. Run the full browser suite before the first change and record the existing failures in `PROGRESS.md` in this folder.
3. Work one work package (WP) per pull request, or one phase per write-back, as the earlier plans did. Keep `PROGRESS.md` current so work can stop and resume.
4. Stop at every ⛔ gate. When this plan doesn't settle a visual value, stop and ask. Don't choose one.

| Phase | Outcome                                              | Rows   | Depends on       |
| ----- | ---------------------------------------------------- | ------ | ---------------- |
| 1     | Scroll: stuck header, frozen column, eaves           | U1, U2 | —                |
| 2     | Row motion: travel on reorder, fold on add or remove | U3, U4 | —                |
| 3     | Point and select: crosshair, range, action bar       | U5, U6 | WP 3.3 waits G2  |
| 4     | Agent work: question heads and answer cells          | U7     | —                |
| 5     | Table Lens study                                     | U8     | G5 for its home  |
| 6     | Upgrades section, tests and records                  | all    | what each covers |

Phases 1, 2, 3 (except WP 3.3) and 4 can start at once.

## Decisions (Yankun, Oct 15, 2026)

| Row | Decision                                                                                        | API                                      |
| --- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| D1  | **Basic plus upgrades.** The Table page shows the basic table, then an Upgrades section.        | Docs                                     |
| U1  | **Stuck header.** The header changes once it sticks; group heads stack under it.                | `stickyHeader`                           |
| U2  | **Edge cues and a frozen column.** The first column stays put; eaves show what's hidden.        | `frozenColumn`                           |
| U3  | **Sort glide.** Rows travel to their new places; keyboard sorts land at once.                   | `rowMotion`                              |
| U4  | **Filter fold.** Leaving rows fade, the rest close the gap, arriving rows fade in.              | `rowMotion`                              |
| U5  | **Crosshair.** Pointing at a cell lights its row, its column and both headings.                 | `crosshair`                              |
| U6  | **Range select and action bar.** Shift-click and drag-paint; a bar with the count and actions.  | `useRangeSelection`, `Table.ActionBar`   |
| U7  | **Agent fills the columns.** Cells go queued → reading → answered, each answer with its source. | `Table.QuestionHead`, `Table.AnswerCell` |
| U8  | **Table Lens.** Rows compress to bars; a lens opens readable rows around the pointer.           | Docs-local study                         |

Not picked, and out of scope: marked scroll rail (1.3), cell cursor (3.3), Peek (3.4), change flash (4.1), live tail (4.2), and the atlas's "More patterns".

U3 and U4 share one prop. Both follow one rule: when rows change order or membership, show where they went. Fewer choices, better defaults.

### Open gates

| Gate  | Question                                                                                                                                                                                                                                | Lean                                                                                           | Blocks                     |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------- |
| ⛔ G1 | How long does a row travel? The atlas used 270 ms (grade 1). The Slide role is grade 7 (157.5 ms in Su).                                                                                                                                | **Slide**, an existing role. The alternative adds a `travel` role on grade 1 (a token change). | The role WP 2.1 reads      |
| ⛔ G2 | Where does the action bar sit? **A** inside the frame at its bottom edge, over the last rows. **B** a tray that slides out under the frame, outside it. **C** no bar; the host's toolbar above the table carries the count and actions. | **A**, as in the atlas                                                                         | WP 3.3                     |
| ⛔ G3 | Do counts roll? The atlas rolls the digits of the selected count and the filter count.                                                                                                                                                  | **Roll**, with an internal `RollingFigures` (not exported) on Slide                            | The roll in WP 3.3 and 6.1 |
| ⛔ G4 | How does an answer arrive? **Pen**: drawn in from the inline-start edge with Plan's pen, on Reveal. **Typed**: characters appear one by one, as in the atlas.                                                                           | **Pen**, so the system has one way of drawing things in                                        | WP 4.2's arrival only      |
| ⛔ G5 | Where does Table Lens live? **A** a docs-local study inside the Upgrades section. **B** its own page under Charts. **C** a published export.                                                                                            | **A**                                                                                          | WP 5.1's location          |
| ⛔ G6 | Does the column map from atlas 1.2 ship? **A** docs-local, in the frozen-column demo only. **B** publish `Table.ColumnMap`.                                                                                                             | **A**                                                                                          | Nothing in the package     |

Until a gate is answered, build with its lean only where the "Blocks" column allows it, and say so in `PROGRESS.md`.

## Approvals this plan changes

| Approval                                                                                                                                             | What changes                                                                                                                                                                                                                     | Row        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Requested Table refinement (Oct 6): "keep row geometry stable", "Neutral row emphasis stays stationary". Table status B (Oct 10): "stationary rows". | Unchanged by default. With `rowMotion`, rows travel on reorder and fold in and out on add and remove. Hover, focus, selection and crosshair still keep geometry fixed.                                                           | U3, U4     |
| Table spec, Motion: "Table authors no sorting, selection, or row travel".                                                                            | Table still owns no sort, filter or selection state. It animates the order and membership changes the host renders when `rowMotion` is set, and offers selection gestures through `useRangeSelection`. The host keeps the state. | U3, U4, U6 |
| Table usage: "Keep the main action visible outside the frame".                                                                                       | With G2 A, a bulk-action bar sits inside the frame's bottom edge while rows are selected. The page's main action stays outside.                                                                                                  | U6         |
| Approved Menu (Oct 6): "without row stagger".                                                                                                        | Unchanged. Arriving rows in a fold appear together.                                                                                                                                                                              | U4         |
| Table spec: "Table does not add grid navigation".                                                                                                    | Unchanged. The crosshair follows the pointer and focus-within; there's no arrow-key grid model.                                                                                                                                  | U5         |

Everything else in those approvals stands.

## Rules for every work package

These add to `AGENTS.md` and the earlier plans' rules. Where they disagree, `AGENTS.md` wins and you say so in the PR.

1. **The basic Table doesn't change.** Without upgrade props or parts, Table renders the same DOM, slots and computed paint as before, and the existing Table tests pass unchanged.
2. **Visual values come from this plan or from existing tokens.** If you need a value this plan doesn't give, stop and ask.
3. **Components read roles and utilities.** Durations and curves come from the `motion.duration.*` and `motion.easing.*` roles. Never type a duration, curve, distance or color; never read a grade directly.
4. **Depth is drawn, never blurred.** Planes are zero-blur spreads, as the frame's are.
5. **Nothing plays on load.** Rows rendered at mount are at rest. An answer mounted as answered is at rest. A bar mounted open is open.
6. **Layout never moves because of motion.** Travel and fold are transforms and opacity over the final layout. The action bar paints over rows and doesn't push them.
7. **Frequent actions land at once.** A reorder or fold that follows keyboard input lands without travel. Pointer-driven paint (crosshair, selection) changes immediately.
8. **Hooks are classes, slots and data attributes,** never `aria-label` or visible text.
9. **Access is part of the construction.** This covers:
   - keyboard
   - screen readers: visible status words, `aria-sort`, `aria-busy` and polite announcements
   - reduced motion: end states, no travel
   - forced colors: planes and fills drop, rules and marks use system colors
   - RTL: frozen column, eaves and pens follow logical sides
   - touch: no hover-only state carries meaning
10. **The host keeps ownership.** Table never sorts, filters, selects or runs an agent. It shows and animates what the host renders.

## Phase 1: Scroll

### WP 1.1 `stickyHeader` (U1)

**API.** `stickyHeader?: boolean` on `Table.Root`.

```tsx
<Table.Root aria-label="Requests by day" stickyHeader className="max-h-96">
```

- **Bounded height.** The scroll area already scrolls inline, so the header can't stick to the page. With `stickyHeader`, the frame becomes a flex column, the scroll area fills it and scrolls in both axes, and the host bounds the height with `className`. Without a bound nothing sticks. The docs say so.
- **The header.** Header cells are `position: sticky; inset-block-start: 0` on the `bg-canvas` face, so rows pass beneath them. Sticky cells lose their rules under `border-collapse: collapse`. With `stickyHeader`, the native table switches to `border-collapse: separate; border-spacing: 0` and draws the same rules on the cells. At rest it must look identical to the basic Table; add a paint comparison.
- **Stuck (an eave).** Once rows scroll under the header, its bottom rule goes from `border-subtle` to `fg-default`, and a bottom plane at `depth.rest.small` appears, drawn as a zero-blur spread in the frame's plane shading.
  - Drive both with `animation-timeline: scroll(nearest block)` over the first `space.4` of scroll, inside `@supports (animation-timeline: scroll())`. This is how Conversation's eaves work (Conversation plan WP 1.5). There is no duration.
  - Without support, the header still sticks with its resting rule.
- **Group heads.** A `Table.Body` may begin with a row whose only cell is `Table.Head scope="rowgroup"` with a `colSpan`. That cell sticks under the column header at `inset-block-start: var(--zao-table-header-size)`. Measure the header with a `ResizeObserver` and set the property on the scroll area.
  - A later group head slides over the earlier one.
  - Group head paint: `bg-sunken`, `type-label font-medium text-default`, and the host's count in `type-caption figures-tabular text-muted`.
- **The current group's mark.** A stuck group head shows a `space.0-5` inline-start mark in `fg-default`, through `@container scroll-state(stuck: top)` inside `@supports`. If scroll-state queries can't apply to a sticky table cell, drop the mark and record it in `PROGRESS.md`. Don't add script for it.
- Reduced motion: nothing is timed. Forced colors: the stuck rule is CanvasText; the plane drops.

Atlas: 1.1.

### WP 1.2 `frozenColumn` and edge eaves (U2)

**API.** `frozenColumn?: boolean` on `Table.Root`. The first cell of every row sticks to the inline-start edge.

- **Frozen cells.** `position: sticky; inset-inline-start: 0` on the `bg-canvas` face. Hover, selection and crosshair fills still apply. Frozen cells stack above body cells. With `stickyHeader`, the corner cell stacks above both.
- **At rest,** the frozen column's inline-end edge carries a `border-subtle` rule.
- **Start eave.** Once content has scrolled under the column (the first `space.4` of inline scroll):
  - its inline-end rule goes to `fg-default`
  - a side plane at `depth.rest.small` appears on that edge, drawn with zero blur

  The column then reads as a part lifted over the rows that pass beneath it.

- **End eave.** While columns remain hidden past the inline-end edge, a `border-default` hairline stands at that edge. It goes from opacity 1 to 0 over the last `space.4` of inline scroll: Conversation's bottom eave, turned on its side. Keep it out of the table's layout. Use either:
  - a named scroll timeline on the scroll area (`scroll-timeline`, with `timeline-scope` on the frame) and an overlay hairline on the frame, or
  - a sticky pseudo-element.
- Both eaves live inside `@supports (animation-timeline: scroll())`. Without support, the column still sticks with its resting rule.
- RTL: start and end are logical. Test that inline scroll progress runs from the start edge in RTL.
- Forced colors: rules in CanvasText; planes drop.
- **Column map (G6, lean A).** Docs-local. The frozen-column demo draws a row of blocks under the frame, one per column, sized by column width:
  - the frozen column shows as pinned
  - columns in view show solid
  - partly visible columns show muted
  - hidden columns show in `border-subtle`

  Clicking a block scrolls that column into view. The map is `aria-hidden` and a pointer convenience only; the region is already keyboard-scrollable.

Atlas: 1.2.

## Phase 2: Row motion

### WP 2.1 `rowMotion`: travel on reorder (U3, ⛔ G1 for the role)

**API.** `rowMotion?: boolean` on `Table.Body`. Children must be keyed `Table.Row` elements.

```tsx
<Table.Body rowMotion>
  {rows.map((row) => (
    <Table.Row key={row.id}>…</Table.Row>
  ))}
</Table.Body>
```

- **Identity.** Body reads each child's React key (`Children.toArray`) and passes it on as `data-zao-row-key`. `Table.Row` forwards it to the `tr`. A row without a key, or wrapped in a component that drops the attribute, simply doesn't travel.
- **Travel (FLIP).** In a layout effect, before paint:
  - compare each keyed row's offset from the last commit with its new offset
  - play `transform: translateY(Δ) → none` on the Slide role (G1's lean)
  - cancel any running travel first and measure from the painted position, so rapid sorts continue from where rows are
- **Keyboard lands at once.** Track the last input type once per document (pointerdown vs keydown, capture phase). When the commit that reordered rows followed a keydown, skip travel. Sort buttons and filter controls usually sit outside the frame, so a Root-only listener isn't enough.
- Sticky headers and group heads stay above travelling rows. Only order changes travel; content that changes in place doesn't animate.
- While `drawing`, nothing travels. Reduced motion: no travel.

Atlas: 2.1.

### WP 2.2 `rowMotion`: fold on add and remove (U4)

- **Leaving rows.** When a keyed row leaves the children, Body keeps it rendered at its previous place for one Reveal exit duration and fades it out on `motion.easing.exit`. The row carries `data-zao-leaving`, `inert` and `aria-hidden`. Composer's removed tiles are the precedent (Conversation plan WP 2.4). The host's array stays the truth.
- **Three beats, read from the computed roles:**
  1. leaving rows fade (Reveal exit)
  2. staying rows travel to close the gap (Slide, or G1's choice)
  3. arriving rows fade in on Reveal, all together, with no stagger
- **Interruptions.** A new change mid-sequence:
  - drops any leaving rows at once
  - restarts travel from the painted positions
  - lets arriving rows continue from their current opacity
- The same keyboard rule as WP 2.1: a fold that follows keyboard input lands at once.
- Reduced motion: rows appear and disappear at once.

Atlas: 2.2.

## Phase 3: Point and select

### WP 3.1 `crosshair` (U5)

**API.** `crosshair?: boolean` on `Table.Root`.

- **Pointing.** Under `@media (hover: hover) and (pointer: fine)`, pointing at a body cell marks:
  - its row with `data-zao-crosshair-row`
  - every cell in its column with `data-zao-crosshair-col`, matched by `cellIndex`

  Cells with `colSpan > 1` don't take part; document the limit. The marks clear on pointer leave.

- **Paint.**
  - The row's and column's cells take `bg-hover`.
  - The cell itself takes `bg-active` with a `stroke.hairline` inset edge in `fg-default`.
  - The row's head and the column's head go from `text-muted` to `text-default`, and the column head gains a `stroke.hairline` bottom rule in `fg-default`.
- **Keyboard.** When focus is inside a cell (a button, link or checkbox), the crosshair follows that cell through `focus-within`. There's no arrow-key model; arrows keep scrolling the region.
- **Selected rows** keep `bg-active`. Over a selected row, the crosshair adds only the hit cell's edge.
- Paint changes immediately, with no transitions.
- Touch: off. Forced colors: the hit cell's edge uses Highlight; fills drop.

Atlas: 3.1.

### WP 3.2 `useRangeSelection` (U6)

**API.** A hook exported from `@zao/react`. The host owns `selected`.

```tsx
const range = useRangeSelection({
  ids: rows.map((row) => row.id), // in display order
  selected,
  onSelectedChange: setSelected,
});

<Table.Cell {...range.cell(row.id)}>
  <input type="checkbox" className="table-checkbox" aria-label={`Select ${row.name}`} {...range.checkbox(row.id)} />
</Table.Cell>
// Select all:
<input type="checkbox" className="table-checkbox" aria-label="Select all requests" {...range.all} />
```

- **Click** toggles one row and sets the anchor.
- **Shift+click** sets every row between the anchor and the target to the anchor's state.
- **Press and drag** down the checkbox cells to paint. Every row the pointer passes takes the state the first row took, and fast drags fill the rows in between.
- **Keyboard:** Space toggles the native checkbox and sets the anchor. There's no keyboard range.
- `range.all` sets `checked`, sets `indeterminate` through a ref, and selects or clears all `ids`.
- The hook only computes the next array and calls `onSelectedChange`. Selection survives sorting because ids are stable.
- Paint is unchanged: the host passes `selected` to `Table.Row` (`bg-active`).
- Touch: `range.cell` sets `touch-action: none` on the checkbox cells only, so painting works there and the rest of the table still scrolls.
- The host keeps its detailed live summary.

Atlas: 3.2 (range and paint).

### WP 3.3 `Table.ActionBar` (U6, ⛔ G2; G3 for the roll)

**API.**

```tsx
<Table.Root
  aria-label="Requests to approve"
  actionBar={
    <Table.ActionBar open={selected.length > 0} count={selected.length} countLabel="selected" result={result}>
      <Button size="small" variant="secondary" onClick={clear}>Clear</Button>
      <Button size="small" loading={pending} onClick={approve}>Approve {selected.length}</Button>
    </Table.ActionBar>
  }
>
```

- **Props:**
  - `open`
  - `count` (a number)
  - `countLabel`
  - `result?: string`: the host's past-tense record, such as "Approved 3 requests". ZAO can't derive a past tense; the ApprovalGate precedent applies.
  - `children`: the actions
- **Placement (G2 lean A).** Inside the frame at its bottom edge, inset `space.2` on the inline sides and the block end. While open, the scroll area gains bottom padding equal to the bar's height, so the last row can scroll clear. The bar paints over rows and moves none of them.
- **Material.** The floating layer, as Menu's popup has: `material-overlay`, square, a hairline frame and a contact edge.
- **Opening and closing.** It rises from the frame's bottom edge as a clipped reveal on Reveal and withdraws on Reveal exit. Reduced motion: at once.
- **Count.** `type-label figures-tabular`, with `aria-live="polite"`. With G3's lean, the digits roll on Slide through an internal `RollingFigures` while visually hidden text carries the value. Reduced motion swaps the figures at once.
- **Pending.** The host passes Button's existing `loading`.
- **Result.** When `result` is set, the record replaces the count and actions at the same minimum height: the text in `type-label font-medium`, fading in as a fast, standard state change.
  - If focus was on an action that unmounts, move focus to the record (`tabIndex={-1}`), as ApprovalGate does.
  - The host closes the bar by setting `open={false}`. The docs demo closes it after one `motion.duration.hold`, read from the computed role.
- The atlas's label sequence (Approve 3 → Approving → Approved 3) comes from Button's `loading` plus the record. Button gains no label morph.
- Forced colors: the bar's frame is CanvasText.

Atlas: 3.2 (bar).

## Phase 4: Agent work

### WP 4.1 `Table.QuestionHead` (U7)

**API.** `<Table.QuestionHead question="Renewal date" answered={4} total={8} />`, plus native `th` props. It renders `th scope="col"`.

- **First line:**
  - the question in `type-label font-medium text-default`
  - "{answered}/{total}" in `type-caption figures-tabular text-muted`, at the inline-end of the same line
- **Under it, a progress rule drawn like Plan's rail segment.** It's dashed in `border-default` (`space.1` dashes and gaps, a hard-stop repeating gradient). It fills solid `fg-default` from the inline-start edge in proportion to `answered`. Register `--zao-table-question-fill` and transition it on Slide.
- When `answered` reaches `total` after mount, a visually hidden polite status says "{question}: {total} of {total} answered."
- Mounted complete: at rest. Reduced motion: the fill is immediate.

### WP 4.2 `Table.AnswerCell` (U7, ⛔ G4 for the arrival)

**API.**

```tsx
<Table.AnswerCell state="queued" />
<Table.AnswerCell state="reading" progress="p. 3" />
<Table.AnswerCell
  state="answered"
  source={{ mark: 'p. 2', reference: 'Halden order form.pdf · p. 2 · §3.1', quote: 'The Subscription Term starts on March 1, 2026 and runs for twelve (12) months.' }}
>
  Mar 1, 2027
</Table.AnswerCell>
<Table.AnswerCell state="not-stated" reason="Checked 14 pages. Quantities are set in each order form." />
<Table.AnswerCell state="failed" reason="The file couldn't be opened." />
```

`AnswerCellState = 'queued' | 'reading' | 'answered' | 'not-stated' | 'failed'`. Export the type.

| State      | Shows                                       | Paint                                                                                                          |
| ---------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| queued     | "Queued"                                    | `type-caption text-muted`                                                                                      |
| reading    | `LoadingIndicator` and "Reading {progress}" | `type-caption figures-tabular text-muted`; the system's one pending animation                                  |
| answered   | the host's value and its source mark        | `type-body`; mark in `type-caption figures-id`, a square `stroke.hairline` `border-default` box on `bg-sunken` |
| not-stated | "Not stated" and a ? mark                   | `text-muted`; the mark's edge is dashed                                                                        |
| failed     | "Failed" and a ? mark                       | `danger.text`, as Plan's failed status                                                                         |

- `aria-busy` on the cell while reading. Every state's words are visible.
- **The source mark** is a native button labelled "Source: {reference}" (or "Why: {reason}"). It opens a Base UI Popover, with `openOnHover` for fine pointers, Enter and Space to toggle, Escape to close and tap on touch.
  - The popover uses `material-overlay`.
  - The reference sits in `type-caption figures-id text-muted` above the quote, which is in `type-body` with curly quotes.
  - For `not-stated` and `failed`, it shows the `reason`.
- **Arrival (G4 lean).** A cell that becomes `answered` after mount draws in with Plan's pen recipe on Reveal: `--zao-table-answer-draw` runs from 0 to 1, clipping from the inline-start edge behind a hairline pen, and the mark appears with the end of it. A cell mounted as `answered` is at rest. Reduced motion: at rest.
- Forced colors: marks and the pen in CanvasText. RTL: the pen starts at the inline-start edge.
- Table runs nothing: the host passes every state.

Atlas: 5.1.

## Phase 5: Table Lens

### WP 5.1 The Table Lens study (U8, ⛔ G5 for its home)

- **Home (G5 lean A).** Docs-local in `apps/docs/components/table-lens.tsx`, shown in the Upgrades section with the tag "Exploration · docs only".
- **Guideline.** It follows [the data visualization guideline](../../data-visualization.md):
  - one stroke per datum
  - solid structure
  - the four slots: series and scale, summary, readout and unit
  - motion only from data and the person's input

  Bars are `fg-muted` in context and `fg-default` on the focus row, with no accent. Where the atlas differs, the guideline wins.

- **Layout.** Rows share the body height.
  - The focus row has the basic Table's row height, so it reads as a Table row.
  - Its neighbors are `space.4` and `space.2` tall.
  - The rest share what remains.
  - Text shows only on rows tall enough to read.
- **Focus.** The focus is the row whose center lands nearest the pointer under the current layout. Choose it this way, not by a uniform mapping, so the lens doesn't jump.
- **Sorting.** Sort headings are Buttons. Sorting travels rows on Slide unless reduced; moving the pointer never animates.
- **Keyboard.** The lens is a focusable region. Up and down move the focus; Escape clears it. A polite readout names the focus row's values.
- **Access.** A "Show as table" Switch renders the same records in a basic `Table`. The bars are `aria-hidden`; the readout and the Switch carry the data.
- **Touch.** Tap and drag move the focus; `touch-action: pan-y` keeps the page scrolling.

Atlas: 6.1.

## Phase 6: Docs, tests and records

### WP 6.1 The Upgrades section (D1)

**Page order.** Title → Anatomy → Preview (the basic table, unchanged) → Loading → **Upgrades** → Usage → API → Example → Accessibility.

**Intro**, for Yankun to approve: "The table above is the basic Table. It holds still: rows don't move and the host owns sorting and selection. Each upgrade adds one behavior you turn on, and they combine."

**Index.** The eight upgrades in five groups, as anchor links:

- Scroll: Stuck header, Frozen column
- Reorder: Sort glide, Filter fold
- Point and select: Crosshair, Range select
- Agent work: Answer columns
- Focus and context: Table Lens

**Each upgrade is one block** (a docs-local `TableUpgrade` component), ported from the atlas's plate:

- **Head:** the name, the API as a code chip (`stickyHeader`, `rowMotion`, …), and a tag: Published, or Docs only for the lens.
- **Basic | Upgraded:** a secondary Tabs switch (Upgraded selected) that swaps the same demo with and without the upgrade, so the difference shows in place.
- **The live demo:** real `@zao/react` parts in the shared Quiet instrument preview, with sample data labelled as sample data.
- **A Try line** in `type-caption`.
- **Notes,** a short `dl`:
  - What it does
  - Turn it on, with a short code example
  - Access: keyboard, reduced motion, touch
  - Seen in: the atlas's credits, linked

**Demos.**

| Upgrade        | Demo                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stuck header   | 26 requests in five day groups, height-bounded; a readout names the current group (host logic)                                                             |
| Frozen column  | Nine columns, with the column map (G6)                                                                                                                     |
| Sort glide     | Seven rows, sortable headings; a readout says whether the last sort travelled or landed (pointer or keyboard)                                              |
| Filter fold    | A secondary Tabs filter (All, Running, Needs review, Blocked) with counts; "Showing {n} of 20", rolling per G3                                             |
| Crosshair      | Seats by department and month                                                                                                                              |
| Range select   | Nine rows with `useRangeSelection` and the action bar; Approve → Approved; a Reset rows link                                                               |
| Answer columns | Eight sample contracts × three questions as a labelled local simulation, with Run again. The atlas's sample answers and quotes are in `sketch/atlas.html`. |
| Table Lens     | 60 sample sites                                                                                                                                            |

Extend the shared sample `requests` in a docs-local file for the longer demos. Keep the basic specimen's six requests unchanged.

### WP 6.2 Browser tests

Add `apps/docs/e2e/table-upgrades.spec.ts`. Cover Su light and dark, LTR and RTL, reduced motion, forced colors, 390px wide, and touch emulation where touch matters.

- **Basic unchanged:** the existing Table specs pass as they are, and a Table without upgrades keeps its slots, attributes and computed rules.
- **U1:**
  - the header sticks in a bounded frame
  - rules at rest match the basic Table
  - the stuck rule and plane appear only after scroll, with support
  - group heads stack under the header
  - there's no plane without support
- **U2:**
  - the first column stays at the inline-start edge in LTR and RTL
  - the start eave appears only after inline scroll
  - the end eave disappears at the end of scroll
  - the column map scrolls a column into view
- **U3:**
  - rows travel on a pointer sort and land at once on a keyboard sort
  - rapid sorts continue from painted positions
  - no travel with reduced motion
  - the layout box is unchanged during travel
- **U4:**
  - leaving rows are inert and hidden from the accessibility tree, then removed
  - the three beats run in order
  - arriving rows have no stagger
  - interruption works
- **U5:**
  - row, column, heads and hit cell paint on a fine pointer
  - focus-within follows focus
  - nothing on touch
  - selected rows keep `bg-active`
- **U6:**
  - click, Shift-click and drag-paint, with fast drags filling the gap
  - the indeterminate select-all state
  - selection survives sorting
  - the bar opens without moving rows, and the scroll padding lets the last row clear
  - the record replaces the actions at the same height, and focus moves only when it was on an action
- **U7:**
  - each state's words and paint
  - `aria-busy` while reading
  - the source popover by hover, keyboard and tap
  - the pen only for answers that arrive after mount
  - the completion announcement
- **U8:**
  - the focus follows the pointer without jumping
  - keyboard focus and the readout
  - "Show as table" renders a basic Table
- No horizontal overflow at 390px.

### WP 6.3 Specs and records

- `docs/components/table.md`: an Upgrades section, plus the new props, parts, motions (Slide, Reveal, Reveal exit, eaves) and tokens.
- `docs/parts.md`: new slots (`action-bar`, `action-bar-record`, `question`, `answer`, `source`) and data attributes:
  - `data-zao-row-key`
  - `data-zao-leaving`
  - `data-zao-crosshair-row`
  - `data-zao-crosshair-col`
  - `data-zao-answer-state`
- `docs/motion.md`: row travel, the fold's three beats, the answer's pen, and the table eaves (no duration).
- `component-detail.tsx`: the API table gains the new props and parts.
- `AGENTS.md`: an "Authorized table upgrades plan (Oct 15)" section with the rules above. Add one line to the Table refinement: upgrades are opt-in, and the basic Table is unchanged.
- `decision-drafts.md` in this folder: one BRIEF decision-log row per decision, for Yankun to add.
- A changeset for `@zao/react` (minor).

## Verification

- `pnpm build && pnpm test && pnpm typecheck && pnpm format:check`.
- Su light and dark, LTR and RTL, reduced motion, forced colors, and 390px wide.
- For Yankun: a short screen recording of each upgrade's Basic and Upgraded states, and screenshots of the Upgrades section on desktop and at 390px.

## Out of scope

- The atlas plates not picked (1.3, 3.3, 3.4, 4.1, 4.2) and its "More patterns".
- Arrow-key grid navigation, editable cells, virtualization, column resizing and drag to reorder.
- Upgrades in the landing workspace's table. Ask first, because the landing's layer captions are Yankun's (L13).
- Yu.

## Words used in this plan

| Word          | Meaning                                                                       |
| ------------- | ----------------------------------------------------------------------------- |
| Basic         | Table with no upgrade props or parts: the approved still ledger               |
| Upgrade       | One opt-in behavior added to the basic Table                                  |
| Eave          | A hairline at a scroll edge that appears only while content is hidden past it |
| Stuck         | A sticky header with rows passing beneath it                                  |
| Group head    | A `rowgroup` heading at the top of a body that sticks under the column header |
| Frozen column | The first column, held at the inline-start edge while the rest scroll         |
| Travel        | A row moving from its old place to its new one after a reorder                |
| Fold          | Leaving rows fade, the rest close the gap, arriving rows fade in              |
| Crosshair     | The pointed cell's row, column and headings, lit together                     |
| Anchor        | The row a range starts from                                                   |
| Paint         | Selecting by pressing and dragging down the checkboxes                        |
| Action bar    | The bar with the selected count and bulk actions                              |
| Record        | What replaces the bar's actions once the host reports the result              |
| Question head | A column heading that asks a question and shows how many cells are answered   |
| Answer cell   | A cell an agent fills: queued, reading, answered, not stated or failed        |
| Source mark   | The small button on an answer that shows the passage it came from             |
| Pen           | The hairline that leads a draw-in, as in Plan                                 |
| Lens          | Table Lens: rows as bars, with readable rows around the focus                 |
