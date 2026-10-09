# Charts section, October 2026

_For coding agents working in `yankundesign/zao-design-system`. Written Oct 9, 2026. Owner and decision-maker: Yankun._

**Status: approved Oct 9.** Yankun asked for a data visualization section in the docs, a refined storage ring in Card, and a rewritten guideline. He chose a new nav section and kept the Su gray accent. Claude builds the first pass directly from this plan; later passes follow the same rules.

## Where this comes from

Yankun shared a short recording of an audio instrument: thin radial strokes around a fixed center, mono labels in the corners, one red point, a timecode readout. The Oct 7 ring borrowed its parts but read as a watch bezel. The Oct 9 review separated the look into five rules that apply to any chart, not only rings. Those rules are the core of this plan and of the rewritten guideline.

## The five rules

1. **One stroke per datum.** Thin strokes only when each stroke is a real observation, bin or part of a whole. Never decorative hatching.
2. **Solid for structure, dashed for comparison.** Axes and baselines are solid hairlines with graduations and end stops, like the Tabs ruler. Dashed lines are only for reference values: average, previous period, target, median.
3. **Four slots around the plot.** Top: the series identifier a person or agent would query (`latency.p95`) and the scale or period, in mono. Below the plot: a title and one summary sentence in sans. Bottom: the readout and the unit, in mono. Inspection writes into the readout slot instead of a floating tooltip.
4. **One accent square.** The value that matters most: the latest value, the current period, the selected item, or a single reading. Square, because ZAO is square. It uses `accent-solid`, which stays gray until Yankun chooses colors.
5. **Motion only from data.** Charts are still at rest. A labeled simulation or real live data may update them: the line scrolls, the histogram fills, the current heatmap cell darkens, bars step. Nothing moves when data has not changed.

## Decisions

| #   | Decision                            | Outcome                                                                                                                                                                                                                                                   |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DV1 | Where charts live in the docs       | **Decided Oct 9:** a new **Charts** nav section after Components (first proposed as "Data visualization"; renamed so the title fits beside its figure and does not repeat the Foundations link). The guideline stays at Foundations → Data visualization. |
| DV2 | Accent for the one emphasized point | **Decided Oct 9:** keep Su gray (`accent-solid`). Signal red and vermilion 朱 remain options for a later color decision.                                                                                                                                  |
| DV3 | Sequential ramp for heatmaps        | ⛔ **Open.** The first pass mixes `fg-default` into `bg-canvas` at 14, 32, 52, 74 and 100%. Borrowed semantic roles were not ordered: Quiet instrument's dark `border-strong` is brighter than `fg-muted`. A published data ramp needs Yankun's choice.   |
| DV4 | Stroke weights                      | ⛔ **Open.** The first pass reuses the hairline (1px) for structure and combs and the ring's existing 1.5px for needles and traces.                                                                                                                       |
| DV5 | Publish charts from `@zao/react`    | ⛔ **Open.** The first pass is docs-local. No package API, props, tokens or dependencies.                                                                                                                                                                 |

## Work packages

Do them in order. Each keeps Su light and dark, keyboard, touch, reduced motion, forced colors and narrow layouts working.

### WP 1: Rewrite the guideline

Rewrite `docs/data-visualization.md` around the five rules. Keep what still holds from Oct 7: start with the reader's question, keep the reading honest, inspect/select/compare/update/explain, access and resilience. Add per-chart guidance (ring, bar, line, heatmap, histogram, plus a short note for scatter, stat tiles and meters), the radial-only-for-cycles rule, and the watch-outs (light-mode contrast, stroke pitch, gray-step limit). Remove the particle section; particles were dropped on Oct 7 and the five rules replace them.

### WP 2: Shared chart parts (docs-local)

In `apps/docs/components/charts/`:

- **`ChartFrame`**: the four slots and the summary row. Slots are plain text; the readout is not a live region.
- **`useChartWidth`**: draw in pixel coordinates from the measured width, so hairlines stay 1px and labels stay at their type role's size.
- **`ChartInspector`**: one keyboard tab stop with roving focus across native buttons, one per datum (arrows move; Up and Down move by row in a grid). Pointer uses the nearest datum across the whole plot, so no tiny targets. Focus or hover inspects; Enter, Space or tap selects; Escape clears. Selection is announced politely; hover is not announced.
- **`Ruler`**: solid baseline, end stops and graduations.
- **`useLiveSimulation`**: a labeled, off-by-default Switch. Updates are discrete, stop when switched off or unmounted, and never animate between values.

### WP 3: Refine the storage ring

Apply the rules to `StorageRingStudy`, used by Card and the overview exhibition.

- Separate structure from data: a fine scale ring with graduations every 10% and a registration tick at 0; the 100 data marks stay one mark per percentage point.
- Used marks are long and drawn in `fg-default`; available marks are short and drawn in `border-default`. The outline steps at 68%, so the data shapes the silhouette.
- Hairline strokes that do not scale with the SVG.
- Frame slots: `storage.used` and `1 mark = 1 part` on top, the readout and `parts` at the bottom. The readout keeps the existing strings.
- Keep 68% used / 32% available, the named Used and Available controls, Escape, selection announcements, the accessible name, the center square in `accent-solid`, and the Card's passive behavior.

### WP 4: The Charts section

- Nav section "Charts" with its own construction figure and links: Overview, Ring, Bar, Line, Heatmap, Histogram.
- **Overview** (`/charts`): the five rules and a gallery of the five charts, each linking to its page.
- **One page per chart** (`/charts/<chart>`): Preview (in the Quiet instrument study, like component pages), When to use, Anatomy, Accessibility. Bar, line, heatmap and histogram offer the live simulation switch; the ring does not, because storage is a static reading.
- All values are illustrative and say so.

### WP 5: Tests

- Update the ring specs to the refined construction without weakening them.
- Add `apps/docs/e2e/data-visualization.spec.ts`: nav reachability, each page renders one chart with its four slots, keyboard inspection writes the readout, Escape clears, selection announces, live simulation starts and stops, reduced motion has no running animations, axe passes in Su light and dark, and 320px widths have no horizontal page scroll.

### WP 6: Records

Add the Oct 9 request to `PLAN.md` (current work), `AGENTS.md` and `BRIEF.md`, and draft a decision-log row for DV1 and DV2.

## Build notes, Oct 9

- The heatmap's first ramp borrowed semantic roles and came out unordered in dark mode; the color mix fixed it (DV3).
- Base UI names a Switch from its wrapping label. Keep the simulation switch's description outside the label and link it with `aria-describedby`, or its accessible name repeats.
- On narrow screens the histogram merges 30 s bins into 1 or 2 min bins to keep at least 3px between strokes, and says so in the scale slot.

## Decision-log draft for `BRIEF.md`

Yankun adds decision-log rows. Suggested row:

| Date       | Decision                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-09 | **Charts section:** add a Charts nav section after Components with an overview and Ring, Bar, Line, Heatmap, and Histogram pages; keep the guideline in Foundations. Every chart follows five rules: one stroke per datum, solid structure with dashed references, four slots, one accent square, and motion only from data. Keep the accent Su gray until colors are chosen. |

## Definition of done

- `pnpm build && pnpm test && pnpm typecheck && pnpm format:check` pass, and `pnpm docs:build` succeeds.
- Screenshots of every new page and the Card ring in Su light and dark.
- No new tokens, dependencies, published props or changesets. The docs app is not published.

## Not in scope

Yu; a published chart package; new color or stroke tokens; scatter, stat tile and meter pages; particles.
