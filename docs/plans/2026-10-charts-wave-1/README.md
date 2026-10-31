# Charts wave 1: shared parts, Meter and Share strip, October 2026

_For coding agents working in `yankundesign/zao-design-system`. Written Oct 31, 2026, from [the Mebius charts research](../../research/mebius-charts.md). Owner and decision-maker: Yankun._

**Status: approved Oct 31.** Yankun approved the plan with every gate's lean (C1–C7). Progress and resume steps are in [PROGRESS.md](PROGRESS.md).

**This plan adds two charts and three shared parts, all docs-local.** It adds:

- a **Meter** chart and a **Share strip** chart, each with a page under Charts
- a **data view** on every chart that opens its numbers in Table
- a **drawn loading state** on every chart
- **fitted dashes**: dashed references that start and end on a whole dash

It publishes nothing: no tokens, props, hooks, dependencies or changesets. The prism bar (P1–P6 in the research) and the rest of the research's list are separate work.

## What this plan is for

Two questions come up on almost every product screen, and ZAO's charts can't answer them yet: how close is this to its limit, and how is this whole divided? The ring shows one share of one whole; it has no limit and no room for several parts. Mebius answers with gauges, cylinders and donuts. ZAO can answer with parts it already has: Progress's recessed well, measured against a limit, and the ring's one-mark-per-part comb, unrolled into a strip.

The shared parts close gaps across all seven charts. The guideline asks for a data view, and no chart has one. No chart has a loading state, and Mebius's Value Locked shows how easily a loading chart reads as zero. Every dashed reference stops wherever the plot ends.

## Reference

- [Mebius charts research](../../research/mebius-charts.md): "Improve the five we have", "New forms" and "Suggested order". This plan is complete without the research's sketches.
- [The data visualization guideline](../../data-visualization.md) and [the Charts plan](../2026-10-data-visualization/README.md). Everything there still holds: the five rules, the four slots, `ChartFrame`, `ChartInspector`, `Ruler` and `useLiveSimulation`.
- The drawing state: `packages/react/src/components/drawing.ts`, the `construction-drawing` utility in `theme.css`, and the docs demo in `apps/docs/components/drawing-state-demo.tsx`.
- Progress's track and face: `packages/react/src/styles/progress.css`.

## How to use this plan

1. Read `AGENTS.md`, the guideline and this file to the end.
2. Run `data-visualization.spec.ts` and `storage-ring-study.spec.ts` before the first change, and record any failures in a new `PROGRESS.md` in this folder.
3. Work one work package (WP) per pull request. Keep `PROGRESS.md` current so work can stop and resume.
4. Every gate is decided. When this plan doesn't settle a visual value, stop and ask. Don't choose one.

| Phase | Outcome                                                     | Gates      | Depends on       |
| ----- | ----------------------------------------------------------- | ---------- | ---------------- |
| 1     | Shared parts: fitted dashes, data view, drawn loading state | C2, C3     | —                |
| 2     | Meter                                                       | C1, C4, C5 | WP 1.2, WP 1.3   |
| 3     | Share strip                                                 | C1, C6     | WP 1.2, WP 1.3   |
| 4     | Guideline, tests and records                                | C7         | what each covers |

Phases 2 and 3 can run at the same time once phase 1 lands.

## Decisions (Yankun, Oct 31, 2026)

Yankun chose every lean. The alternatives are kept for reference.

| Gate | Question                                    | Decision                                                                                                                                                                                                                               | Blocks                  |
| ---- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| C1   | Add Meter and Share strip pages, and where? | Yes, grouped by question: Ring, Share strip, Meter, then Bar, Line, Heatmap, Histogram. The first three answer "how much of a whole?".                                                                                                 | WP 2.2, WP 3.2          |
| C2   | Where the data view opens                   | Inline below the frame, closed by default, from a quiet small Button: "Show data", then "Hide data". A Dialog is the alternative.                                                                                                      | WP 1.2                  |
| C3   | How a chart builds when its data arrives    | Card and Table's timing: placeholder text clears on Reveal exit, then the marks and numbers appear on Reveal. Reduced motion builds at once. Instant is the alternative. Either way, nothing grows from zero.                          | WP 1.3                  |
| C4   | Does Meter show a projection?               | Yes, drawn: a hairline outline from the value to the projected value, only when the data carries a projection and its method. The drawing then also means "not real yet". The alternative is no projection in this wave.               | WP 2.1, projection only |
| C5   | Meter above its capacity                    | The face fills the well, a filled square sits just past the end stop, and the readout and summary state the overage. The overage is written, not drawn to scale. The alternative is a scale that runs to 125% so the overage is drawn. | WP 2.1, over state only |
| C6   | Share strip ink                             | Every stroke the same length. The lead part, or the selected one, in `fg-default`; the rest in `fg-muted`, as Bar emphasizes by ink. The alternative alternates `fg-default` and `fg-muted` part by part.                              | WP 3.1                  |
| C7   | Guideline additions                         | Add Meter and Share strip to "Start with the question" and "Chart grammar", and add "A loading chart is a drawing: structure only, no marks and no numbers" to "Keep the reading honest".                                              | WP 4.1                  |

## Approvals this plan changes

| Approval                                                                | What changes                                                                                     | Gate   |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| Charts plan (Oct 9), "Not in scope": scatter, stat tile and meter pages | A Meter page and a Share strip page join Charts. Scatter and stat tile stay out.                 | C1     |
| Guideline, "Explain": "A complex chart may need a data table"           | Every chart gets a data view.                                                                    | C2     |
| Drawing state (finish V8, components plan L1): a part loading           | Charts gain it, docs-local. With C4, Meter's drawing also marks a projected, not-yet-real value. | C3, C4 |
| Guideline, rule 2: dashed means a reference                             | Unchanged. Only the dash pattern fits its length.                                                | —      |

Everything else in those approvals stands.

## Rules for every work package

1. **Docs-local.** Everything lives in `apps/docs/components/charts/` and `apps/docs/app/charts/`. Export nothing new from `@zao/react`; a chart package is still DV5.
2. **Values come from tokens, the guideline's study values or this plan.** The study values are the 1px hairline, the 1.5px needle and trace, the `2 3` dash, the 3px minimum stroke pitch and the 6px accent square. If you need another value, stop and ask.
3. **One source of truth.** Marks, labels, the summary, the readout, accessible names and the data view all derive from the same data object.
4. **Unknown is never zero.** A loading or missing reading shows no mark and no number.
5. **Layout never moves.** The drawing has the same box as the built chart, and opening the data view adds height below the frame without moving the plot.
6. **Discrete updates.** Charts don't tween between readings (rule 5), including Meter, which reuses Progress's paint but not its width transition.
7. **Access.** One tab stop with arrow keys, Home, End, Enter, Space and Escape through `ChartInspector`; touch; reduced motion; forced colors; RTL; Su light and dark; 320px wide.
8. **Copy.** Sentence case; a button says what happens.

## Phase 1: Shared parts

### WP 1.1 Fitted dashes

- Add `fittedDash(length, dash = 2, gap = 3)` beside `crisp` in `chart-frame.tsx`. It keeps the 2px dash and stretches the gap so whole dashes fill the length, starting and ending on a dash: `n = max(2, round((length + gap) / (dash + gap)))`, then `gap′ = (length − n × dash) / (n − 1)`.
- Apply it to the Bar average, the Histogram median and the Line previous-period trace. The trace's length is the sum of its segments in pixels.
- Leave the ring's inspection guide alone: its `pathLength` dash draws a solid arc, not a reference.
- **Done when** each reference's dashes fill its length within 0.5px, and the gap stays between 2.5 and 3.5px for any reference longer than 40px, at 320px and on desktop.

### WP 1.2 Data view (C2)

- `ChartFrame` gains `table: { columns: { label: string; numeric?: boolean }[]; rows: string[][] }`. Each chart builds it from its own data.
- Below the figcaption, a quiet small Button reads "Show data", with `aria-expanded` and `aria-controls`. When open it reads "Hide data", and the published `Table` renders the rows inside the figure, captioned with the chart's title. Numeric columns are right-aligned with `figures-tabular`; units go in column headers ("Calls", "p95 (ms)"); a missing value reads "No reading".
- During live simulation the open table updates with the chart and announces nothing.
- Tables per chart:
  - Ring: Region, Share, Parts
  - Bar: Region, Calls, Difference from average
  - Line: Time, p95 (ms), Previous (ms)
  - Heatmap: Day, then one column per hour, in Table's named horizontal scroll region
  - Histogram: Session length, Sessions
- While you're in Bar: each datum's accessible name gains the readout's comparison, for example "US West: 318 calls, 70 above the 248 average."
- **Done when** every chart's table matches its accessible names, toggling moves nothing above it, and axe passes with the table open in Su light and dark.

### WP 1.3 Drawn loading state (C3)

- `ChartFrame` gains `drawing?: boolean` and `drawingLabel?: string` (default "Loading readings"). While drawing:
  - **Known slots stay.** The series, scale, title and unit are known before data and stay as text.
  - **Unknown slots are drawn.** The summary and readout show placeholder text in the `construction-drawing` style (transparent text with hairline over- and underlines), never a number.
  - **The plot draws only structure known before data**, in `border-default`. Ring: scale ring and graduations. Bar, Line and Histogram: the ruler, graduations and end stops. Heatmap: the 7 × 24 cells as hairline squares, and the legend. No marks, accent square, references or value labels.
  - **The figure is busy.** `aria-busy="true"`, and a polite status announces `drawingLabel` once. The inspector, the data view button and the simulation switch are inert.
- **Building.** Mirror `useDrawingState`'s timer in a docs-local `use-chart-drawing.ts` that reads the same motion roles. Don't export the package hook; note the copy under DV5.
- **Docs.** Each chart page's preview gains a "Reload readings" secondary Button and a "Keep loading" Switch, as `drawing-state-demo.tsx` has.
- **Done when**, while drawing, the plot has no data ink, the summary and readout contain no digits, and `aria-busy` is set; after building, the chart matches its resting state; reduced motion builds at once; and forced colors draw the structure in CanvasText.

## Phase 2: Meter

### WP 2.1 `MeterChart`

**The question:** how close is a measure to its limit?

**Illustrative data** in `data.ts`: October cloud spend is $3,720 by Oct 20, against a $6,000 budget, with an alert at $5,400. The projection uses the month-to-date rate, $186 a day: $5,766 by Oct 31, crossing the alert on Oct 30. The data names its method, `month-to-date rate`.

**Construction.**

- **Semantics.** Base UI's `Meter` (already in `@base-ui/react`) gives `role="meter"`, the label and the value text.
- **Well and face.** Reuse Progress's paint: render the `track` and `indicator` slots inside `progress-construction`, so the meter has the same recessed well, ink face and contact edge as Progress. Turn off the indicator's width transition (rule 6). If a Progress selector depends on Progress-only state, stop and ask.
- **Ruler.** Below the well: graduations at 0, 25, 50, 75 and 100% of capacity, end stops, and mono labels at 0 and at the capacity.
- **Alert reference.** A dashed tick across the well at the alert, in `fg-muted`, labeled above: "alert $5,400". Drawn only when the data has an alert.
- **Projection (C4).** A hairline `fg-muted` outline inside the well, from the value to the projected value, never filled. The summary states it; the plot doesn't label it.
- **Accent square.** On the ruler, under the face's end: the current reading.

**Slots.**

- Series `budget.spend`; scale `Oct 1–31 · budget $6,000`.
- Title "Cloud spend, October".
- Summary: "$3,720 spent, 62% of the $6,000 budget. At the month-to-date rate, spend reaches $5,766 by Oct 31 and crosses the $5,400 alert on Oct 30."
- Readout at rest "62% used · $2,280 left"; unit `USD`.

**Inspection.** Native region buttons through `ChartInspector`, like the ring's Used and Available: Used and Left, plus Over when spend passes the budget. Inspecting writes "Used · $3,720 · 62%" into the readout.

**States.** Each one appears in a States grid on the Meter page, which also serves as the test fixture.

| State      | Drawing                                                 | Readout                 |
| ---------- | ------------------------------------------------------- | ----------------------- |
| Zero       | An empty well, accent square at 0                       | "0% used · $6,000 left" |
| Fractional | Face width rounded to the pixel                         | Exact cents             |
| Full       | Face meets the end stop                                 | "100% used · $0 left"   |
| Over (C5)  | Face fills the well; filled square past the end stop    | "Over by $310"          |
| Unknown    | The WP 1.3 drawing: well and ruler, no face, no numbers | Drawn placeholder       |
| No budget  | The drawing, as Progress treats an invalid range        | "No budget set"         |

**Live simulation.** The standard switch. Each tick adds one discrete spend step, which also moves the projection. Spend never runs past 125% of the budget.

### WP 2.2 The Meter page (C1)

Follow the other chart pages: Preview in the Quiet instrument study, When to use, Anatomy, Accessibility, plus the States grid. Add the definition to `chartDefinitions`, `meter` to `ChartId` and `chartOrder`, and the link to `docs-sections.ts` in C1's order.

When to use: a single measure against a known limit, such as a budget, quota or capacity. For task completion, use Progress. For one share of a total with no limit, use the ring.

## Phase 3: Share strip

### WP 3.1 `ShareStrip`

**The question:** how is a whole divided?

**Illustrative data** in `data.ts`: 2.48 TB in use, by kind. Media 1.02 TB, Backups 0.69 TB, Documents 0.45 TB, Logs 0.31 TB, Other 0.01 TB. It isn't the ring's 68%, and the page doesn't say it is.

**Construction.**

- **One stroke per percentage point**, 100 strokes, using the largest-remainder method so the strokes always total 100. Here that gives 41, 28, 18, 13 and 0. When the plot is too narrow to keep 3px between strokes, merge pairs into 50 strokes and say "1 stroke = 2%" in the scale slot, as the histogram merges bins.
- **Groups.** Parts are ordered by size, with Other last. One pitch of gap between parts. A registration tick on the ruler at each boundary, and end stops at both ends.
- **Ink (C6).** Every stroke is the same length. The lead part in `fg-default`, the rest in `fg-muted`. Selecting a part moves the ink, never a length.
- **Labels.** Above each group, in mono caption: "media 41%". If any label is wider than its group, every label moves to a list below the strip, in the same order. Labels never collide or truncate.
- **Parts under one stroke.** Other, at 0.4%, has no strokes. It appears in the labels as "other <1%" and stays in the inspector's order, reachable by keyboard.
- **Accent square** beside the lead part's label.
- **Limits.** Two to five parts, plus Other. Fold any more into Other, named with its count: "other (4 kinds)".

**Slots.**

- Series `storage.by_kind`; scale `1 stroke = 1% · 2.48 TB`.
- Title "Storage by kind".
- Summary: "Media takes 41% of the 2.48 TB in use, and backups take 28%."
- Readout at rest "5 kinds · 2.48 TB"; unit `TB`.

**Inspection.** One native button per part. Inspecting writes "Backups · 0.69 TB · 27.8%" into the readout: whole percentages on the strip, one decimal in the readout.

**States.** In a States grid on the page: a two-part strip; a part under 1%; the narrow 50-stroke merge; labels moved to the list; unknown, as the WP 1.3 drawing. Shares are never negative. The data module throws in development if one is.

**No live simulation.** Like the ring, a composition is a static reading.

### WP 3.2 The Share strip page (C1)

As WP 2.2, with `share` as the ID and `/charts/share` as the route.

When to use: how a known whole divides among two to five parts. For one share of a whole, use the ring. For six or more parts, or when exact values matter more than proportion, use Table. Use a strip instead of a donut or pie.

## Phase 4: Guideline, tests and records

### WP 4.1 Guideline (C7)

In `docs/data-visualization.md`:

- **"Start with the question":** "How close to a limit? A meter, with the limit and any alert as labeled references." Also extend "How much of a whole?" with "For two to five parts, a share strip."
- **"Chart grammar":** add Meter and Share strip sections in the style of the others.
- **"Keep the reading honest":** add "A loading chart is a drawing: structure only, no marks and no numbers."
- **"Explain":** every chart offers its numbers in a data view.
- **Charts overview:** add both to the gallery.

### WP 4.2 Tests

Extend `apps/docs/e2e/data-visualization.spec.ts`:

- The nav lists seven charts in C1's order.
- Both new pages render one chart with its four slots, and inspect, select, clear with Escape and announce selection.
- Meter: every row of the States grid, including no face and no digits while unknown.
- Share strip: 100 strokes (50 when merged), whole shares in labels and one decimal in the readout, the part under 1% reachable by keyboard, and labels that never overlap.
- Data view, drawing state and fitted dashes, per WP 1.1–1.3, on all seven charts.
- axe in Su light and dark; no horizontal page scroll at 320px; no running animations under reduced motion; structure visible in forced colors.

Update the ring spec only if the data view or drawing state changes its page; don't weaken an existing assertion.

### WP 4.3 Records

- `PLAN.md` "Current work" and `AGENTS.md`: a short entry once Yankun approves, naming the gates' outcomes.
- A decision-log draft row for `BRIEF.md`; Yankun adds decision-log rows.
- `PROGRESS.md` in this folder, current at every merged WP.

## Definition of done

- `pnpm build && pnpm test && pnpm typecheck && pnpm format:check` pass, and the docs build succeeds.
- Screenshots in Su light and dark: the Meter and Share strip pages, their States grids, and one chart of each existing kind in the drawing state and with the data view open.
- No new tokens, dependencies, published props or changesets.

## Not in scope

- Prism bars (research P1–P6).
- The rest of the research: line events and forecasts, histogram percentiles and mirrored comparison, heatmap totals and calendar, the readings panel, dumbbell, trace, diverging needles and scatter.
- A list of meters, upright capacity wells and datum notes.
- DV3 (data ramp), DV4 (stroke weights) and DV5 (a chart package).
- Yu.
