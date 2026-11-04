# Mebius charts: what transfers to ZAO

Research, Oct 31, 2026. Source: [Mebius free charts](https://www.mebius.design/freebies/charts), 62 dashboard charts in React and Tailwind. Yankun's note: "I like this 3D vibe of a chart," about Average Sales. Nothing here is decided.

## Access

The Code tab, the .fig download and "Copy AI prompt" need a Mebius account, and this study didn't sign up. Each chart's live preview is a public page (`/demo/charts-<slug>?canvas=none`), so the findings below come from its rendered SVG and markup, not from the source or the prompt. Nothing is copied.

## How Average Sales is built

- **Boxes in two layers.** Each month is a box of three faces (left, right, top) drawn as SVG paths. A frame layer fills the faces with the card surface and draws dashed edges at 50% opacity. A solid layer fills them with three linear gradients from the brand green toward white; the top fades to transparent. Only the selected month's solid has height; the others collapse to the baseline. Rest is a drawing, selection is built.
- **Fitted dashes.** Each edge gets its own dash length, about 7px, so it holds a whole number of dashes, offset by half a dash so every corner meets cleanly. Each face's edges are clipped to that face, so shared edges never double up.
- **A projection per bar.** The box is two-sided, front corner forward, and the top diamond's depth is about 5.6% of the bar's height. Taller bars show more top, and the side faces' bottom corners sit at different heights, so the bars don't stand on one ground plane. The reading edge is ambiguous: the front corner, or the back corner of the top, about 11% higher.
- **A sliding window.** Thirteen months are drawn and six show; axis labels fade with the window.
- **Native targets.** An invisible button covers each column, with roving tabindex, `aria-pressed` and labels like "April 2026: $2,891.12, up 14% from March 2026". The SVG ignores the pointer.
- **Hover selects.** Selection rewrites the header: the total ticks to the new value, the change pill and goal line update, and a per-month note replaces the caption ("January was quiet after the holidays").
- **Siblings.** Spending Overview Cylinder fills glass vessels to a level, and the selected vessel glows with sparkles. Global DeFi fills the area under a curve with a dot grid, with one marker per year.

## What ZAO already has

The charts are the flattest part of ZAO. The components and figures already have a dimensional language:

- **Oblique construction.** Front faces in one plane and one receding direction, up and to the right: the nav figures, the bracket set and `depth.axis`.
- **Flat plane tones.** Stepped bands (叠晕) through `construction-shading`, never a gradient or blur.
- **Drawing → built.** Card and Table draw their parts as hairlines, then build them (V8).
- **Ghosting.** The landing bracket set ghosts the courses it isn't measuring.

So the 3D character can come from ZAO's own parts. Mebius shows the effect; ZAO supplies a coherent construction.

## Proposal: prism bars

A dimensional form of the Bar chart, built from the parts above.

1. **One projection per plot.** Every bar recedes by the same depth, showing its top and right planes. The back face sits up and to the right, as in the nav figures. Lifted components use the same screen direction the other way round: their face sits up and to the right of its base.
2. **The front face carries the reading.** It stands on the ruler at true height, and the value label sits at its front top edge. The planes add the same depth to every bar, so differences between bars stay exact.
3. **Rulers and references stay in the front plane.** Never put gridlines on a back wall: the back wall reads lower than the front face, which is how 3D bars usually mislead.
4. **Resting bars are drawings.** The front face is outlined in `fg-muted`, a data mark at 3:1 or more, and the planes in `border-default`, as construction. Hidden edges aren't drawn, so dashed lines stay reserved for references.
5. **The emphasized bar is built.** A solid face with its two planes in flat tone steps.
6. **Building adds paint, never geometry.** The outline is already at full height, so a bar never grows from the baseline.
7. **Inspection and selection stay separate.** Hover and focus write the readout; Enter, Space or a tap builds the bar.

Evidence: Zacks and colleagues (1998) found that 3D perspective cues lowered the accuracy of bar height estimates. The effect shrank after a short delay, and nearby graphic elements had a much larger effect. A constant oblique depth with a true front face and front-plane references is the narrowest form of 3D. Any benefit to comprehension is a hypothesis until a comparison supports it ("Grow the library from evidence" in the guideline).

## Smaller craft that transfers now

- **Fitted dashes, every chart.** Compute a reference line's dash pattern from its length so it starts and ends on a whole dash. Today's `2 3` stops wherever the plot ends.
- **Strokes clipped to their face, prisms.** Keeps hairlines inside the geometry and stops shared edges doubling.
- **Comparisons in accessible names.** Each datum button's name could carry the readout's comparison: "Europe: 412 calls, 164 above the 248 average."
- **Datum notes.** When the data has a note for a datum, selecting the datum could write the note into the summary slot. Only real notes, never generated ones.

## What doesn't transfer

- Gradient faces and glow: ZAO steps flat tones and never blurs depth.
- A projection per bar.
- Hover as selection.
- Number tickers and growing from zero: nothing tweens between readings (rule 5).
- Glass vessels and sparkles: glass belongs to floating layers.
- Dots that fill an area without counting anything: one stroke per datum (rule 1).
- A seal-colored selected bar: data never carries the seal (V1) unless Yankun reopens it.

## Decisions for Yankun

| #   | Question                | Lean                                                                                                                                                                                                                   |
| --- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | Add prism bars?         | Yes, as a docs-local form on the Bar page beside the needles. Needles stay the default.                                                                                                                                |
| P2  | Prism depth             | One depth per plot: half the face width, rounded to the fen. A docs-local study value, like DV4.                                                                                                                       |
| P3  | Built face              | **A:** an ink face (`fg-default`) with planes stepping toward the canvas, the strongest emphasis. **B:** a `bg-surface` face with an ink outline and `construction-shading` planes, like a Button and quieter. Lean A. |
| P4  | Accent square on prisms | The built bar is the one emphasis, and the accent square moves beside its value label. Rule 4 changes for this form.                                                                                                   |
| P5  | Build motion            | Instant, as rule 5 asks. The drawing → built reveal is the alternative; reduced motion stays instant either way.                                                                                                       |
| P6  | Guideline wording       | Replace "never to tilt or extrude marks in a way that distorts magnitude" with the draft below.                                                                                                                        |

Draft for P6: "A bar may recede along the depth axis by one depth shared by every bar in the plot. Its front face carries the reading at true scale on the ruler. Rulers and references stay in the front plane, never on a back wall. Never tilt or rotate a mark, or give it a projection of its own."

## The rest of the gallery

Beyond Average Sales, the 62 charts are mostly highlighted columns, gradient areas and donuts. The useful ideas are in a handful: limits and targets (Budget, Sales Target, Budget Health, Saving Progress, Total Balance), composition as a strip of thin strokes (Category Breakdown, Options Portfolio), ranges (Spending Overview Range, Finance Analytics), a line with its distribution on the value axis (Price Range), small multiples with one shared guide (Growth Trends, Profit Margin Analysis), and in-and-out bars around a midline (Diverging Bar).

## Improve the five we have

**Ring**

- **Threshold reference.** A labeled dashed tick on the scale ring for a real limit, such as a 90% quota warning. The ring has no reference yet.
- **A linear sibling.** The same marks unrolled into a meter, for places a ring doesn't fit, like a table cell.

**Bar**

- **Prism form.** See the proposal above.
- **Comparative tick.** A short dashed tick across each needle at the previous period or the target, as in a bullet graph. Mebius draws targets as ghost bars behind the data; a tick keeps one stroke per datum.
- **Horizontal orientation** for long category names, written in full rather than as IDs.
- **Stated order.** Name the sort (by value, by name, fixed) in the scale slot.

**Line**

- **Event marks.** Registration ticks on the ruler for deploys, incidents or config changes, named in the readout. They explain a change without a note in the plot.
- **Forecast as a drawing.** After "now", future samples are drawn as hollow marks with no trace, and the scale slot names the method. The past is built; the future is drawn. Only from a real model.
- **Marginal comb.** A histogram of the period's readings along the value axis, as in Price Range. It shows where the measure spent its time without a second chart.
- **Small multiples.** Several lines on one time axis, with one inspection guide across all and one readout listing each.

**Heatmap**

- **Marginal totals.** A comb of row totals at the right edge and column totals along the bottom, so "which day" and "which hour" read at rest.
- **Calendar layout.** Weeks by weekday across a year, with the same cells and ramp. The ramp itself is still DV3.

**Histogram**

- **Percentile references.** p50, p95 and p99 as labeled dashed lines; latency readers ask about the tail.
- **Mirrored comparison.** This period's comb above the baseline and the previous period's below, in the shape of Mebius's Diverging Bar. Same bins, same scale.
- **Cumulative trace.** An optional 1.5px trace of the share of observations at or below each bin.

**Every chart**

- **A data view.** A "Show data" control that opens the chart's numbers in Table. The guideline already asks for one, and Table exists.
- **A drawn loading state.** The frame, ruler and slots drawn with no marks and no numbers, through the drawing state Card and Table already have. Mebius's Value Locked enters at "$0.00", which shows unknown as zero.
- **Empty and error states that say which:** "No readings yet" is not "Couldn't load readings".
- Fitted dashes, comparisons in accessible names and datum notes, from above.

## New forms

Each answers a question the guideline's "Start with the question" list doesn't cover yet. Ordered by need and by how much they reuse.

| Form              | Question                                  | ZAO construction                                                                                                                                                                                                                                                | Mebius reference                                     |
| ----------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Meter             | How close to a limit?                     | A recessed well (`construction-well`) holding the quantitative face, graduations, a dashed limit or target tick, and an optional drawn projection ("Reaches limit Nov 18"). Progress, measured. Stood upright, one well per category, it is the cylinder chart. | Budget, Sales Target, Budget Health, Saving Progress |
| Share strip       | How is a whole divided?                   | One row of strokes, one per unit (1% or 2%), grouped by part with a gap and end stops; each group labeled with its name and share. Parts differ by ink, position and label, not hue. The ring unrolled for 2–5 parts, in place of donuts.                       | Category Breakdown, Options Portfolio                |
| Dumbbell or range | How did each item change? How wide is it? | A hairline per category between a hollow square (before) and a filled one (after); or a low–high span with a tick at the typical value, such as p50–p99 per endpoint.                                                                                           | Spending Overview Range, Finance Analytics           |
| Readings panel    | Where do several measures stand now?      | Stat tiles (figure, mono readout, hairline sparkline) on one time axis, with one inspection guide across all. The guideline's stat tile, made into a chart.                                                                                                     | Growth Trends, Profit Margin Analysis                |
| Diverging needles | Above or below a baseline?                | Needles up and down from a zero ruler, with the sign written beside the value. Ink, not hue.                                                                                                                                                                    | Diverging Bar                                        |
| Scatter           | How do two measures relate?               | Crosshair marks, nearest-point inspection, and a dashed fit only from a stated method. Already listed under "Other forms".                                                                                                                                      | Spending Overview Scatter                            |
| Trace             | What ran when, and for how long?          | Spans on a time ruler, one row per step, nested by parent. Finished steps are built and the running step is drawn. Agent runs and tool calls, next to Plan and Conversation.                                                                                    | Finance Overview Timeline, loosely                   |

**Later, with evidence:** a flow (Sankey) drawn as combed strokes, each a fixed number of units; an overview strip with a brushed window that sets the detail chart's range (Mebius Overview).

**Not adding:**

- Donuts and pies: the share strip answers the same question with lengths.
- Gauges and radial bars: the ring covers one share, and radial forms are for cycles.
- Stacked areas and streams: only the bottom layer has a baseline.
- Dual-axis combos: two scales need two charts.
- Hex bins and dot fills that don't count anything.
- Candlesticks, unless the data is trading data; the range form covers spread.

## Suggested order

1. **Shared parts:** data view, drawn loading state, fitted dashes. Every chart gains, and only the loading drawing needs a look.
2. **Meter and share strip:** the most common product questions, limits and composition. Both reuse the ring's marks and Progress.
3. **Prism bars**, after P1–P6.
4. **Line events and forecast; histogram percentiles and mirrored comparison.**
5. **Readings panel, dumbbell and trace.**
6. **Diverging needles, scatter and the calendar heatmap.**

The Oct 9 Charts plan kept scatter, stat tile and meter pages out of scope, so any new page needs Yankun's go-ahead and its own plan. Forecasts drawn as drawings would give the drawing state a second meaning (not yet real, as well as not yet loaded); that is Yankun's call too.

Steps 1 and 2 are drafted as [charts wave 1](../plans/2026-10-charts-wave-1/README.md), and steps 3 and 4 as [charts wave 2](../plans/2026-10-charts-wave-2/README.md). Wave 2 takes up the line's events and forecast and the histogram's percentiles and mirrored comparison; the line's marginal comb and small multiples and the histogram's cumulative trace wait.

## Sources

- [Mebius free charts](https://www.mebius.design/freebies/charts) and the [Average Sales live demo](https://www.mebius.design/demo/charts-average-sales?canvas=none)
- Zacks, Levy, Tversky and Schiano (1998), [Reading bar graphs: effects of extraneous depth cues and graphical context](https://profiles.wustl.edu/en/publications/reading-bar-graphs-effects-of-extraneous-depth-cues-and-graphical/), _Journal of Experimental Psychology: Applied_ 4(2), 119–138
- Stephen Few, [Is the avoidance of 3-D bar graphs a knee-jerk reaction?](https://www.perceptualedge.com/blog/?p=2362), a critique of how that study is cited
