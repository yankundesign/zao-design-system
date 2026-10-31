# Charts wave 1 progress

_Resume here. Update at every finished work package._

## Baseline, Oct 31

`pnpm build`, `next build` and `data-visualization.spec.ts` with `storage-ring-study.spec.ts`: 16 of 16 pass. No existing failures.

## Work packages

All work is in the working tree on `craft/workspace-pass`, uncommitted, as one change rather than one pull request per WP. Yankun decides how to commit and split it.

| WP  | Status | Notes                                                                                                                                                                                                                                                                                             |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Done   | `fittedDash` and `polylineLength` in `chart-frame.tsx`; the Bar average, Histogram median, Line previous trace and Meter alert use it.                                                                                                                                                            |
| 1.2 | Done   | `chart-data-view.tsx`. Full chart pages only; the overview gallery's compact charts and Card's ring have no data view. The table is named "{title} data" by `aria-label` rather than a visible caption. Bar's datum names now carry the comparison.                                               |
| 1.3 | Done   | `ChartFrame` `drawing`; `use-chart-drawing.ts` mirrors the package hook. The ring's drawn reading swaps digits for figure spaces to keep its width; a fallback font can leave a sub-pixel difference. Chart pages gain "Reload readings" and "Keep loading" in the preview (`chart-preview.tsx`). |
| 2.1 | Done   | `meter-chart.tsx` with Base UI `Meter` and Progress's paint; States grid in `MeterStates`.                                                                                                                                                                                                        |
| 2.2 | Done   | `/charts/meter`, definition and nav link.                                                                                                                                                                                                                                                         |
| 3.1 | Done   | `share-strip.tsx`. A part under one stroke is named under the ruler's end when the labels sit over their groups, and in the list otherwise. The drawing keeps the built layout, so a loading strip reserves its label row or list.                                                                |
| 3.2 | Done   | `/charts/share`, definition and nav link; nav order per C1.                                                                                                                                                                                                                                       |
| 4.1 | Done   | `docs/data-visualization.md`: both charts in "Start with the question" and "Chart grammar", the loading drawing and fitted dashes in "Keep the reading honest", the data view in "Explain".                                                                                                       |
| 4.2 | Done   | `data-visualization.spec.ts`: 28 cases with the ring spec, all passing in the chart run. Full-suite result below.                                                                                                                                                                                 |
| 4.3 | Done   | `PLAN.md` and `AGENTS.md` entries; decision-log draft below.                                                                                                                                                                                                                                      |

## Verification

Chart run, Oct 31: `data-visualization.spec.ts` and `storage-ring-study.spec.ts`, 28 of 28 pass.

Full run, Oct 31: `pnpm build` passes; tokens 94, engine 44 and lab 31 tests pass; docs browser suite 679 of 680. The one failure, `landing.spec.ts` "tabs, Menu and IconButton switch views without resizing the window", passed 10 of 10 alone and 25 of 25 with its spec, so it is intermittent; the workspace window measured 1397px tall instead of 765px once after switching to Members. `pnpm typecheck` passes. `pnpm format:check` flags only the untracked `docs/plans/2026-10-table-upgrades/` files, which predate this work.

## Decision-log draft for `BRIEF.md`

Yankun adds decision-log rows. Suggested row:

| Date       | Decision                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-31 | **Charts wave 1:** every chart gets fitted dashes, a "Show data" view in Table, and a drawn loading state built on Card and Table's timing. Meter (a measure against its limit, with a dashed alert, drawn projection and written overage) and Share strip (one stroke per percentage point, grouped by part) join Charts after Ring. All docs-local; prism bars remain open. |
