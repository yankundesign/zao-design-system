# Data visualization

_Working guideline · Revised October 9, 2026 · See every chart in the [Charts](/charts) section._

ZAO charts are quiet instruments. They are complete at rest, exact when inspected, and they move only when their data moves. They share the construction of the rest of the interface: hairline drawing, square parts, mono labels, and one point of emphasis. A clear question and an accurate encoding come first; character follows from how carefully the chart is built.

## Where the language comes from

Yankun shared a short recording of an audio instrument: fine radial strokes around a fixed center, mono labels in each corner, one red point, and a running timecode. The first ring study (Oct 7) borrowed its parts and read as a watch bezel. This revision keeps what transfers to any chart: every stroke is a datum, a frame names and measures the reading, one point carries emphasis, and motion belongs to a live signal. The instrument's rounded card, blurred shadow, and constant waveform do not transfer.

## Five rules

1. **One stroke per datum.** Draw thin strokes only when each one is a real observation, a bin, or one part of a whole. A dense comb of strokes is a histogram, not a texture. Never fill a mark with decorative hatching.
2. **Solid for structure, dashed for comparison.** Baselines and axes are solid hairlines with graduations and end stops, like the Tabs ruler. A dashed line always means a reference value: an average, a previous period, a target, or a median. Label it.
3. **Four slots around the plot.** The top row names the series in mono: on the left, the identifier a person or agent would query (`latency.p95`); on the right, the scale, sampling, or period. Below the plot, a summary sentence in sans says what the chart shows. The bottom row is the readout on the left and the unit on the right, in mono. Inspection writes into the readout; there is no floating tooltip.
4. **One accent square.** Mark the value that matters most: the latest value, the current period, the selected item, or the one reading a ring shows. Use a square, never a dot, in `accent-solid`. Everything else stays in neutral ink. Su keeps the accent gray until Yankun chooses colors.
5. **Motion only from data.** Charts are still at rest and never loop. Real live data, or a simulation that says it is one, may update them: a line scrolls left, a histogram fills, the current heatmap cell darkens, bars step to new values. Updates are discrete; nothing tweens between readings, and nothing moves when the data has not changed.

## Start with the question

Choose the encoding that answers the reader's question with the least effort.

- **How much of a whole?** A capacity ring, or a linear meter. Make the total and the remainder clear.
- **Which is larger?** Bars on a shared baseline, in an explicit order.
- **How did it change?** A line on a time axis, with units and a named period. Keep gaps where observations are missing.
- **When does it happen?** A heatmap across two cycles, such as days and hours.
- **How is it spread?** A histogram with a named bin width.

Use a radial form only when the data cycles: hours of a day, days of a week, a compass direction, or a single share of a whole. Wrapping bars or lines around a circle makes lengths harder to compare.

## Chart grammar

Each chart below applies the five rules. The [Charts](/charts) section shows them working in Su light and dark.

### Ring: one share of a whole

- One mark per part. The storage ring has 100 marks, one per percentage point.
- Structure and data are separate. A fine inner scale carries graduations every 10% and a registration tick at zero. The marks carry the data: used marks are long and in `fg-default`, available marks are short and in `border-default`, so the outline steps at the reading.
- The center square is the accent. In a single-reading ring it belongs to the reading as a whole.
- Name the regions. Used and Available are native controls; the readout states the region and its share of the total.
- A storage reading is static. The ring never simulates updates or animates from zero.

### Bar: a few categories

- Draw each bar as a needle with a square head, and write the value at the head. Keep needles on one solid baseline with end stops.
- Emphasize by ink: the bar the story is about in `fg-default` with the accent head, the rest in `fg-muted`.
- A dashed line marks the average or target, with its value as a label.
- Segmented bars, like a level meter, fit only when the data is a level or comes in steps. Otherwise they round away precision.
- Live updates step the needles to new values.

### Line: change over time

- A 1.5px trace over one faint stroke per sample. The strokes show the sampling cadence, and a missing observation is a missing stroke and a break in the trace. Never bridge a gap.
- The previous period is a dashed trace.
- The accent square sits on the latest sample.
- Inspection draws a vertical guide and a small square on the trace and writes the time, the value, and the previous value into the readout.
- Live updates scroll the trace left one sample at a time, like a strip chart. The "now" end stays fixed.

### Heatmap: two cycles

- Square cells with a small gap; no borders around cells.
- At most five gray steps, with a legend. Past five steps readers can no longer tell them apart; use a table.
- The current cell gets accent corner brackets, because a gray ramp cannot also carry an accent fill.
- "No data yet" is a small dot, different from a light zero cell. Unknown is not zero.
- Arrow keys move by cell; Up and Down move by row.
- Live updates darken the current cell as its period fills.

### Histogram: a distribution

- A comb of hairlines, one per bin, on a solid baseline. This is the instrument's ring unrolled.
- Keep at least 3px between strokes. Tighter combs shimmer at small sizes and while scrolling.
- A dashed line marks the median, labeled with its value.
- The accent square marks the bin of the latest observation.
- Live updates add observations; the comb grows and the median moves.

### Other forms

- **Scatter:** small crosshair marks, nearest-point inspection.
- **Stat tile:** a proportional figure, a mono readout row, and an optional hairline sparkline.
- **Meter and progress:** a recessed track with graduations, as in Progress and the Tabs ruler.

## Keep the reading honest

- Derive every mark and its text from the same data. Keep category identities and scales stable across updates.
- State units, totals, time ranges, bin widths, and comparison periods. Distinguish observations, estimates, stale readings, missing data, and illustrative data. Every chart in the docs says its data is illustrative.
- Do not invent breakdowns, capacities, thresholds, trends, or forecasts. A percentage alone cannot supply them.
- Keep geometry steady during inspection. Hover never changes lengths, angles, ordering, or scale.
- Use depth to clarify construction, never to tilt or extrude marks in a way that distorts magnitude.
- Use semantic colors. Pair color with text, position, or shape; status colors are only for status.
- Label the important values directly. The summary sentence and a data view must carry every essential value; nothing requires hover.

## Compose the resting state

A chart is complete before anyone touches it. Use fen proportions and type roles, `figures-tabular` for readings that align or change, solid hairline structure, and a small number of parts. Keep chart regions open on the Card's content plane; do not nest another decorative panel. Su light and dark share geometry, reading order, interaction meaning, and accessibility. Glass belongs to floating layers through `material-overlay`, never behind a reading.

## Inspect, select, compare, update, explain

### Inspect

Reveal a meaningful datum: its name, exact value, unit, and context. Write it into the readout slot so the mark and the explanation are both visible. Pointer inspection finds the nearest datum across the whole plot, so there are no tiny targets. Keyboard focus enters the chart once; arrow keys move between data and Home and End jump to the ends. Touch uses taps. All three reach the same information.

### Select

Enter, Space, or a tap keeps a datum selected after the pointer leaves or focus moves. Distinguish transient inspection from committed selection, and clear selection with Escape. Selecting never launches an action or navigates.

### Compare

Show a difference only against a named reference with known data. Keep units explicit: a change from 68% to 72% is 4 percentage points, not a 4% relative increase. Never manufacture an earlier reading.

### Update

Respond only to real data or a labeled simulation. In the docs, a "Simulate live updates" switch starts the simulation; it is off by default, stops when switched off or when the chart leaves the page, and never runs on the ring. Keep tick positions, category order, and identities fixed while values change. Updates are discrete and need no reduced-motion variant; any transition that a future study adds must be removed under reduced motion.

### Explain

Each chart states its question and reading in the summary sentence. A complex chart may need a data table or expanded detail. Keep actions that change real data separate from inspection.

## Access and resilience

- Give every chart an accessible name and a summary. Keep interactive controls out of an image role that hides their semantics.
- Data marks need at least 3:1 contrast against their surface (WCAG 1.4.11). Draw data in text colors (`fg-default`, `fg-muted`); keep border colors for structure.
- Keep focus outlines visible on the inspected datum, and keep pointer targets at least 24px across.
- Announce selections and explicit updates politely. Never announce hover, pointer movement, or each simulated update.
- Anything that updates on its own for more than five seconds needs a visible way to stop it (WCAG 2.2.2). The simulation switch is that control.
- Respect reduced motion, reduced transparency, and forced colors. Static meaning survives without color or motion.
- Before accepting a chart input API, define zero, full, out-of-range, fractional, unknown, and missing values. Unknown is not zero.
- Verify narrow layouts, Su light and dark, keyboard, touch, focus, and interrupted updates.

## Open decisions

- **Data ramp:** the heatmap borrows five ordered neutral roles (`border-subtle`, `border-default`, `border-strong`, `fg-muted`, `fg-default`). A published sequential ramp is Yankun's choice.
- **Accent color:** Su gray for now. Signal red and vermilion 朱 remain options.
- **Stroke weights:** the hairline (1px) for structure and combs, and the ring's existing 1.5px for needles and traces, until Yankun chooses data stroke values.
- **Publishing:** the charts are docs-local. A package API, props, and tokens need their own decision.

## Grow the library from evidence

The section now holds a ring, bars, a line, a heatmap, and a histogram. They share one frame, one inspector, one ruler, and one simulation switch; extract those into a package only after the charts are used in a real screen. Before promoting a pattern, check whether readers can find the value, understand its denominator, explain a change, inspect it with any input, and keep their place. Compare the still and live versions for comprehension and repeated use. Record what was learned rather than claiming a measured benefit.

## References

- [Quiet construction design notes](/foundations/design): the shared direction; the repository brief is `BRIEF.md`.
- [Hairline's process](https://hairline.lucasmarkes.com/inspo): give each figure a job, test assumptions, and turn corrections into rules.
- [HUDS+GUIS](https://www.hudsandguis.com/fui-media): film and game interfaces, the wider family of instrument UI.
- [LiveKit Agents UI audio visualizers](https://docs.livekit.io/frontends/agents-ui/audio-visualizer): visualizers driven by real agent state rather than idle loops.
- [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): 3:1 for graphical objects.
- [W3C pause, stop, hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html): a way to stop content that updates on its own.
- [W3C content on hover or focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html): readable, hoverable, and dismissible temporary content.
