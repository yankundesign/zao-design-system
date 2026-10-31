# Charts wave 2: prism bars, line events and forecast, histogram percentiles and comparison, October 2026

_For coding agents working in `yankundesign/zao-design-system`. Written Oct 31, 2026, from [the Mebius charts research](../../research/mebius-charts.md), steps 3 and 4 of its suggested order. Owner and decision-maker: Yankun._

**Status: approved Oct 31.** Yankun approved the plan with every gate's lean (P1–P6, E1–E3, H1, H2). Progress and resume steps are in [PROGRESS.md](PROGRESS.md).

**This plan adds one form and improves two charts, all docs-local.**

- **Bar** gains a **prism form**, the dimensional bar from the research: one shared depth, a true front face, drawn at rest and built when selected.
- **Line** gains **event marks** (deploys, restarts) and a **forecast**, drawn as hollow samples after "now".
- **Histogram** gains **p50, p95 and p99 references** and a **mirrored comparison** with last week.

It publishes nothing: no tokens, props, hooks, dependencies or changesets. Needles stay Bar's default.

## What this plan is for

Yankun likes the 3D character of Mebius's Average Sales. Its bars project one by one and grow from the baseline, which makes heights hard to read; Zacks and colleagues (1998) found depth cues lower the accuracy of bar reading. ZAO already has a narrower kind of depth: front faces in one plane, one receding direction (`depth.axis`, up and to the right), flat plane tones and the drawing → built state. The prism form applies that construction to bars and keeps every reading on a true front face.

The line and histogram changes answer the next questions readers ask of those charts. The line shows that p95 rose, but not that a deploy happened just before it, or where it is heading. The histogram marks the median, but latency and session readers ask about the tail, and how this period compares with the last.

## Reference

- [Mebius charts research](../../research/mebius-charts.md): "Proposal: prism bars", "Decisions for Yankun" (P1–P6) and "Improve the five we have". This plan restates every decision it needs.
- [The data visualization guideline](../../data-visualization.md) and [charts wave 1](../2026-10-charts-wave-1/README.md). Everything there still holds: the five rules, the four slots, `ChartFrame`, `ChartInspector`, `Ruler`, `fittedDash`, the data view, the drawn loading state and `useLiveSimulation`.
- Oblique construction: `depth.axis` in `packages/tokens/src/themes/su.tokens.json`, and `block()` in `apps/docs/components/figures/figure-solid.tsx`, which draws the nav figures' solids.
- Inspection and selection: `useInspection` in `chart-inspector.tsx` already keeps `active` (hover or focus) separate from `selected` (Enter, Space or a tap).

## How to use this plan

1. Read `AGENTS.md`, the guideline and this file to the end.
2. Run `data-visualization.spec.ts` and `storage-ring-study.spec.ts` before the first change (28 of 28 passed on Oct 31), and record any failures in a new `PROGRESS.md` in this folder.
3. Work one work package (WP) per pull request. Keep `PROGRESS.md` current so work can stop and resume.
4. Every gate is decided. When this plan doesn't settle a visual value, stop and ask. Don't choose one.

| Phase | Outcome                              | Gates  | Depends on       |
| ----- | ------------------------------------ | ------ | ---------------- |
| 1     | Prism bars                           | P1–P6  | —                |
| 2     | Line events and forecast             | E1–E3  | —                |
| 3     | Histogram percentiles and comparison | H1, H2 | —                |
| 4     | Guideline, tests and records         | P6     | what each covers |

Phases 1, 2 and 3 touch different charts and can run at the same time.

## Decisions (Yankun, Oct 31, 2026)

Yankun chose every lean. The alternatives are kept for reference.

**Revisions (Yankun, Oct 31, after the first build):** the prism form is flat at rest. Every bar shows only its front face, with no planes and no plane outlines, and the lead bar stays built in ink with the accent square. Hovering or focusing a bar previews it in full: an ink face and P3's flat-toned planes. Clicking, tapping or Enter selects it and keeps it in full, with the accent square, while other bars are previewed and after the pointer leaves; Escape or a second click clears it. Depth appears and leaves at once (P5), and the front faces, labels and native targets never move. This replaces WP 1.1's "Resting bars are drawings" for the planes; no bar shows outlined planes.

| Gate | Question                    | Decision                                                                                                                                                                                                                                                                                                                                                                   | Blocks         |
| ---- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| P1   | Add prism bars, and where?  | Yes, as a "Prism form" section on the Bar page, below the preview, with the same data, controls and data view. Needles stay Bar's default and the overview's. The alternative is a Needles / Prisms switch inside the one preview.                                                                                                                                         | WP 1.1, WP 1.2 |
| P2   | Prism proportions           | The face is half its slot, rounded down to the fen, from 12 to 48px. The depth is a third of the face, rounded down to the fen, at least 4px, and shared by every bar: 16px on desktop, 4px at 320px. The research's alternative is half the face, which reads heavier.                                                                                                    | WP 1.1         |
| P3   | The built bar               | **A:** an ink face (`fg-default`) with its top plane in `border-strong` and its right plane in `fg-muted`, flat, so the planes step toward the canvas in light and dark. **B:** a `bg-surface` face with an ink outline and `construction-shading` planes, like a Button and quieter. Lean A.                                                                              | WP 1.1         |
| P4   | Accent square on prisms     | The built bar is the selected bar, or the lead bar when nothing is selected. The accent square sits a fen to the left of its value label. Still one accent square for one datum.                                                                                                                                                                                           | WP 1.1         |
| P5   | Build motion                | Instant, as rule 5 asks. The alternative is the drawing → built reveal on selection. Reduced motion stays instant either way.                                                                                                                                                                                                                                              | WP 1.1         |
| P6   | Guideline wording           | Replace "never to tilt or extrude marks in a way that distorts magnitude" with: "A bar may recede along the depth axis by one depth shared by every bar in the plot. Its front face carries the reading at true scale on the ruler. Rulers and references stay in the front plane, never on a back wall. Never tilt or rotate a mark, or give it a projection of its own." | WP 4.1         |
| E1   | Line event marks            | A tick through the ruler, from 6px above to 10px below, in `fg-muted`, with a short mono label ("deploy") in a lane below the time labels. The full name goes in the readout, the accessible name and the data view. The alternative is numbered markers with a key under the summary.                                                                                     | WP 2.1         |
| E2   | Line forecast               | Yes, as a drawing: one hollow 5px square per forecast sample in `fg-muted`, with no trace and no sample strokes, in a "Forecast" section on the Line page. As with Meter's projection (wave 1, C4), the drawing also means "not real yet". The alternative is no forecast in this wave.                                                                                    | WP 2.2         |
| E3   | Forecast method and horizon | Same time yesterday, shifted by today's average difference from yesterday over the last 6 hours; 4 hours ahead, 8 samples. The time axis runs from −24 h to +4 h, and "now" stays fixed 4 hours from the right end. The alternative is 2 hours ahead.                                                                                                                      | WP 2.2         |
| H1   | Histogram references        | p50, p95 and p99 as labeled dashed lines on the main histogram. Labels share one row above the comb and step into a second row only where they would touch. The alternative is p50 and p90, the pair the summary names today.                                                                                                                                              | WP 3.1         |
| H2   | Mirrored comparison         | A "Compared with last week" section on the Histogram page: this week above a middle ruler in `fg-default`, last week below it in `fg-muted`, with the same bins and the same scale, and a dashed p50 in each half. The alternative is a "Compare with last week" Switch on the main preview.                                                                               | WP 3.2         |

## Approvals this plan changes

| Approval                                                                   | What changes                                                                                                 | Gate       |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------- |
| Guideline, "Keep the reading honest": depth never tilts or extrudes a mark | Replaced by P6's wording: one shared depth along the axis, a true front face, references in the front plane. | P6         |
| Guideline, Bar: "Draw each bar as a needle with a square head"             | Needles stay the default; the prism form joins them.                                                         | P1, P3, P4 |
| Guideline, Line: the "now" end stays fixed                                 | Still fixed. With a forecast it sits 4 hours from the right end.                                             | E3         |
| Guideline, Histogram: "A dashed line marks the median"                     | p50, p95 and p99 are marked.                                                                                 | H1         |
| Wave 1, C4: a drawing also means "not real yet" for Meter's projection     | The Line forecast uses the same meaning.                                                                     | E2         |
| Guideline, rule 1: one stroke per datum                                    | Unchanged. A prism is one mark per datum; a forecast square is one mark per forecast sample.                 | —          |

Everything else in those approvals stands.

## Rules for every work package

1. **Docs-local.** Everything lives in `apps/docs/components/charts/` and `apps/docs/app/charts/`. Export nothing new from `@zao/react`; a chart package is still DV5.
2. **Values come from tokens, the guideline's study values or this plan.** The study values are the 1px hairline, the 1.5px needle and trace, the `2 3` dash fitted to its length, the 3px minimum stroke pitch and the 6px accent square. This plan adds the prism proportions (P2), the event tick (E1) and the 5px forecast square (E2), the size of Line's inspection square. If you need another value, stop and ask.
3. **Depth only along `depth.axis`.** Never perspective, rotation, gradients, blur or shadows.
4. **One source of truth.** Marks, labels, the summary, the readout, accessible names and the data view all derive from the same data object.
5. **Unknown is never zero.** A loading or missing reading shows no mark and no number. A forecast is never shown as an observation.
6. **Layout never moves.** The drawing has the same box as the built chart; selecting, inspecting and simulating never change a length, the scale or the plot's size.
7. **Discrete updates.** Nothing tweens between readings (rule 5).
8. **Access.** One tab stop with arrow keys, Home, End, Enter, Space and Escape through `ChartInspector`; touch; reduced motion; forced colors; RTL; Su light and dark; 320px wide.
9. **Copy.** Sentence case; a button says what happens.

## Phase 1: Prism bars

### WP 1.1 `PrismBarChart`

**The question:** which is larger, when a few categories are a screen's main figure?

**Data.** The Bar chart's data: calls by region over the last 24 hours, the 248 average, Europe leading with 412. Same slots, summary, readout, accessible names and data view as Bar.

**Construction.**

- **Geometry (P2).** Each face is centered in its slot. The front face stands on the ruler at true height. The top and right planes recede by one shared depth along `depth.axis` (right and up), so the back face sits up and to the right. The right plane stays inside the bar's own slot, so prisms never overlap. The plot reserves the depth above the scale's top, so the tallest possible bar keeps its planes and label inside the plot.
- **Resting bars are drawings.** The front face is a 1px `fg-muted` outline, a data mark at 3:1 or more. The planes are 1px `border-default` outlines, as construction. Faces and planes are filled with the ground the chart sits on (`bg-canvas` on the chart pages), so hidden edges never show through and are never drawn.
- **The built bar (P3, P4).** The selected bar, or the lead bar when nothing is selected, is built: lean A's ink face and flat planes. Its value label is strong, with the accent square to its left.
- **Labels.** Each value label is centered over the front face, a fen clear of the top plane. Region IDs sit under the ruler, as in Bar.
- **References in the front plane.** The dashed average is drawn after the prisms, over every face and plane, with its label at the right end. No gridlines, and nothing on a back wall.
- **Strokes stay inside their face.** Clip each plane's outline to the plane, so shared edges never double up (the research's "smaller craft").

**Inspection and selection.** Hover and focus write the readout, strengthen that bar's outline to `fg-default` and make its label strong; the geometry doesn't change. Enter, Space or a tap selects the bar and builds it, and the previously built bar returns to a drawing at once (P5). Escape clears the selection and the lead bar is built again. Selection is announced as in every chart.

**States.** The drawing state, from wave 1: the ruler only, with no prisms, numbers or reference. Live simulation steps every face to its new height; the built bar follows the lead when nothing is selected.

**Forced colors.** Outlines in `CanvasText` and fills in `Canvas`; the built face fills with `CanvasText`.

### WP 1.2 The Bar page (P1)

Add a "Prism form" section after the preview, with its own preview controls (Reload readings, Keep loading and the simulation switch), and a short note on when to use it. Add the form to the Bar definition's Anatomy and Accessibility text. The overview gallery and nav don't change.

When to use: the prism form where a few categories are a screen's main figure, such as a report's cover or a summary header. Use needles in dense dashboards and wherever several charts sit together. Whether the depth helps comprehension is a hypothesis until a comparison supports it.

## Phase 2: Line events and forecast

### WP 2.1 Event marks (E1)

**Data.** `latencyEvents` in `data.ts`, each with a time, a short label and a full name:

- −14 h: "restart", "Metrics collector restarted" (the two missing samples follow it)
- −5 h: "deploy", "Deployed api 4.12" (p95 steps up after it)

**Construction.**

- **Tick.** A 1px `fg-muted` tick at the event's exact time, crossing the ruler from 6px above to 10px below, longer than the 6px major graduations.
- **Label lane.** Short labels in mono caption, in a lane below the time labels. The plot grows by that lane only when the series has events, and it keeps the lane while loading.
- **Collisions.** When two event labels would touch each other or a time label, the later event keeps its label and the earlier shows only its tick. Its name stays in the readout, accessible name and data view.

**Inspection.** Events attach to the nearest sample. Inspecting that sample appends the event to the readout: "−5 h · 122 ms · prev 114 ms · deploy". Its accessible name ends with the full name: "…, Deployed api 4.12". The data view gains an "Event" column.

**Summary.** When an event falls in the period, the summary names the latest one: "p95 latency is 182 ms now, 34 ms above the same time yesterday. It rose after the api 4.12 deploy 5 hours ago."

**Live simulation.** Events scroll left with their samples and leave with them.

### WP 2.2 Forecast (E2, E3)

**Construction.**

- **Axis.** The time axis runs from −24 h to +4 h. "now" is a major tick 4 hours from the right end and stays there while the series scrolls.
- **Forecast samples.** After "now", one hollow 5px square per 30-minute sample: a 1px `fg-muted` outline, no fill, no trace between them and no faint sample strokes. The previous-period dashed trace stops at "now".
- **Method (E3).** Each forecast is the value from the same time yesterday, shifted by today's mean difference from yesterday over the last 6 hours (12 samples). It is computed from the series, never typed. If any of those 12 samples is missing, the method uses the ones that exist; if fewer than 6 exist, there is no forecast and the summary says so.

**Slots.**

- Scale: `30 min samples · 4 h forecast`.
- Summary adds the method and range: "The forecast follows yesterday's curve, shifted by today's average difference over the last 6 hours, and stays between 137 and 178 ms through +4 h." Today's data gives a shift of 19 ms.

**Inspection.** Forecast samples are inspectable: "+1.5 h · forecast 153 ms". Their accessible names say "forecast", and the data view adds a "Forecast (ms)" column, empty for past samples.

**States.** The drawing state shows no forecast. With live simulation each tick recomputes the forecast; it never tweens.

**The Line page.** The main preview gains the events. A "Forecast" section after it shows the same chart with the forecast and its own preview controls. When to use: only from a stated method on real history; never extend a line by eye.

## Phase 3: Histogram percentiles and comparison

### WP 3.1 Percentiles (H1)

**Construction.** p50, p95 and p99 as dashed `fg-muted` lines at the bins' upper edges, each fitted to its length and labeled "p95 26 min". Labels sit in one row above the comb. Only where two would touch does the later one step into a second row. The plot always reserves both rows, so nothing moves when the data changes.

**Slots.** Summary: "Half of sessions end within 11.5 minutes, 95% within 26 and 99% within 35." The readout is unchanged.

**Data check.** The illustrative sessions all end within 60 minutes: the generator's tail stops near 62 and today's seed gives none past 60. If a series ever has observations past the last bin, they must count in the percentiles. Stop and ask how to show them.

### WP 3.2 Mirrored comparison (H2)

**Data.** A second deterministic series for last week in `data.ts`, about the same size and a little shorter. Last week is finished, so it never changes.

**Construction.**

- **Ruler.** It runs along the middle of the plot, with its graduations; the minute labels sit below the lower comb.
- **Combs.** This week's comb rises above the ruler in `fg-default`, and last week's hangs below it in `fg-muted`. Both use the same bins and the same scale, so equal counts are equal lengths.
- **Labels.** "this week" and "last week" in mono caption at the right of each half.
- **References.** A dashed p50 in each half, within its half.
- **Accent square.** On the bin of this week's latest observation.

**Slots.** The numbers come from the last-week series once it exists.

- Series `session.length`; scale `30 s bins · this week vs last`.
- Summary: "Half of sessions end within 11.5 minutes this week, {difference} than last week."
- Readout at rest: "1,400 this week · {count} last week".

**Inspection.** One datum per bin, covering both halves: "10–10.5 min · {n} this week · {n} last week". The data view has three columns: Session length, This week, Last week.

**Live simulation.** It adds observations to this week only.

**The Histogram page.** A "Compared with last week" section after the preview, with its own preview controls.

## Phase 4: Guideline, tests and records

### WP 4.1 Guideline (P6)

In `docs/data-visualization.md`:

- **"Keep the reading honest":** P6's wording replaces the depth line.
- **Bar:** add the prism form: one shared depth, a true front face, drawings at rest, the selected or lead bar built, and the accent square beside its label.
- **Line:** add event marks, and a forecast drawn as hollow samples only from a stated method.
- **Histogram:** p50, p95 and p99, and the mirrored comparison for two periods.
- **"Grow the library from evidence":** name the prism form as a hypothesis to compare against needles.

### WP 4.2 Tests

Extend `apps/docs/e2e/data-visualization.spec.ts`:

- **Prism.**
  - Every front face's height matches the scale within 0.5px.
  - Every prism has the same depth, and no right plane overlaps the next face, on desktop and at 320px.
  - The average line is drawn after the prisms.
  - Exactly one bar is built: the lead at rest, the selected one after Enter.
  - Hover changes no geometry.
- **Line.**
  - Event ticks sit at their exact times.
  - Event names appear in the readout, accessible names and data view.
  - Event labels never overlap each other or the time labels.
- **Forecast.**
  - Eight hollow squares after "now", and no trace path after "now".
  - The scale names the forecast, and forecast samples are inspectable.
  - The drawing state shows no forecast.
- **Histogram.**
  - Each percentile line sits at its computed bin, and labels never overlap.
- **Mirrored comparison.**
  - Equal counts draw equal lengths in both halves, and last week is muted.
  - The data view has three columns.
- **Every new form.** axe in Su light and dark; no horizontal page scroll at 320px; no running animations under reduced motion; structure visible in forced colors.

Don't weaken an existing assertion.

### WP 4.3 Records

- `PLAN.md` "Current work" and `AGENTS.md`: a short entry once Yankun approves, naming the gates' outcomes.
- A decision-log draft row for `BRIEF.md`. Yankun adds decision-log rows himself.
- `PROGRESS.md` in this folder, kept current at every merged WP.

## Definition of done

- `pnpm build && pnpm test && pnpm typecheck && pnpm format:check` pass, and the docs build succeeds.
- Screenshots in Su light and dark:
  - the prism form at rest and with a selected bar
  - the line with events, and the forecast
  - the histogram with percentiles
  - the mirrored comparison
  - each at 320px
- No new tokens, dependencies, published props or changesets.

## Not in scope

- Prisms in the overview gallery, or as Bar's default.
- Step 5 and later in the research:
  - the readings panel, dumbbell and trace
  - diverging needles, scatter and the calendar heatmap
- The other "Improve the five we have" items:
  - Bar: the comparative tick, horizontal bars and stated order
  - Line: the marginal comb and small multiples
  - Histogram: the cumulative trace, and an overflow for observations past the last bin
  - Heatmap: marginal totals
  - Ring: the threshold reference
  - Every chart: datum notes
- DV3 (data ramp), DV4 (stroke weights) and DV5 (a chart package).
- Yu.
