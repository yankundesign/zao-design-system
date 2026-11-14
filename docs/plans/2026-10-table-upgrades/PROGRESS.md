# Table upgrades plan: progress

## Start

- **Nov 13, 2026:** Yankun started this plan through the component review (CR12: Table's improvement is this plan's first work package). The session was asked for WP 1.1 only, on `claude/wizardly-snyder-2ff7ec`, branched from `main`. The plan folder was untracked in the main checkout and is committed with this work.

## Baseline

- **Nov 13, before any source change:** `pnpm build` and the full `pnpm test` passed on `main` at `fbd867d`: engine 44, tokens 94, lab 31, and all **714** docs browser cases (14.8 minutes, one worker). There are no existing failures to carry.

## Gates

No gate is answered. WP 1.1 has no gate, so nothing here builds on a lean.

| Gate | State | Waits                                  |
| ---- | ----- | -------------------------------------- |
| G1   | Open  | The role WP 2.1 reads                  |
| G2   | Open  | WP 3.3                                 |
| G3   | Open  | The roll in WP 3.3 and WP 6.1          |
| G4   | Open  | WP 4.2's arrival                       |
| G5   | Open  | WP 5.1's location                      |
| G6   | Open  | The column map in WP 1.2's demo (docs) |

## Done

### WP 1.1 `stickyHeader` (U1), Nov 13

- **API.** `stickyHeader?: boolean` on `Table.Root`. The frame gets `data-zao-sticky-header` and becomes a flex column; the scroll area fills it and scrolls both ways; the host bounds the height with `className`.
- **Rules.** The table uses the new `table-sticky-header` utility: separated borders with no spacing, and the same hairline rules drawn on the cells. Header cells are sticky on the frame's face (`--zao-construction-face`, so a drawing table keeps them transparent).
- **Stuck.** `zao-table-header-stuck` runs on `scroll(nearest block)` over the first `space.4`, inside `@supports`: the rule goes to `fg-default` and a bottom plane at `depth.rest.small` appears as two zero-blur bands in the frame's `--zao-plane-y-near` and `--zao-plane-y-far`. The plane follows `depth.axis.y`.
- **Group heads.** Under a held header, a `Table.Head` with `scope="rowgroup"` and a `colSpan` carries `data-zao-group-head`, paints `bg-sunken` with `type-label font-medium text-default`, and sticks at `--zao-table-header-size`, which a `ResizeObserver` keeps on the scroll area.
- **Mark.** Scroll-state queries do apply to a sticky table cell (Chromium 153): the stuck group head shows the `space.0-5` `fg-default` mark with no script.
- **Docs.** The Table page has an Upgrades section after Loading with one block, Stuck header: a Basic | Upgraded switch, 26 sample requests in five day groups in a `max-h-96` frame, a readout of the header's state and the current group (host logic), and a Try line. Sample data is in `apps/docs/components/table-upgrades-data.ts`; the block is in `table-upgrades.tsx`, so the landing page's bundle, which imports the basic specimen's requests, doesn't grow.
- **Records.** `docs/components/table.md` (Upgrades section), `docs/parts.md` (non-slot hooks), `docs/motion.md` (the eave), the docs API table and usage, and a minor changeset for `@zao/react`.
- **Tests.** `apps/docs/e2e/table-upgrades.spec.ts`, 18 cases: the basic Table's DOM and collapsed rules; a paint comparison of the header strip and five rows against the basic Table; the stuck rule and plane following the scroll; group heads stacking and the mark; keyboard scrolling with reduced motion; forced colors; no scroll timelines or scroll-state queries; the drawing state; 390px. Su light and dark, LTR and RTL. `docs-layout.spec.ts` now expects the Table page's sixth section.

### Choices made inside WP 1.1, for Yankun to check

These are places where the plan left room. Each uses an existing token or precedent; none takes a gate's lean.

1. **A later group head sticks one hairline higher** than `--zao-table-header-size`, so its own top rule tucks under the header's rule. Without this the two rules sit together as a 2px line. The first group head has no top rule and sticks at the plan's offset.
2. **A group head keeps a rule under it** (a `::after` hairline in `border-subtle`). At rest it covers the next row's own rule, so nothing changes; while stuck, rows pass under a ruled edge.
3. **The stuck plane is two 1px bands** (near and far), as the frame's planes are banded.
4. **The scroll mapping is linear.** Conversation's eaves use the default easing on opacity; here the plane's depth is drawn, so it follows the scroll evenly.
5. **Scroll padding.** The scroll area sets its block-start scroll padding to the header's and the tallest group head's measured sizes, so a focused control or a row scrolled into view isn't left under the stuck parts. The plan didn't ask for this.
6. **`data-zao-sticky-header` and `data-zao-group-head`** are new hooks the plan's WP 6.3 list doesn't name.
7. **One header row.** Every header cell sticks at the block start, so a second header row would overlap the first. The spec says so.
8. **The docs block is a first, plain version of WP 6.1's `TableUpgrade`.** It sits outside the Quiet instrument preview, as the Loading section does, and its description is working copy. The section intro, the index, the notes list and the block's final copy remain for WP 6.1 and Yankun's approval.
9. **The row paint comparison allows one 8-bit step.** The header strip matches the basic Table exactly. Row rules and fills match exactly too; glyph edges round one step apart because sticky cells change how the text is composited.

## Verification

- **Nov 13–14, after WP 1.1:** `pnpm build`, `pnpm typecheck` and `pnpm format:check` pass. Engine 44, tokens 94 and lab 31 pass.
- **Docs browser suite, 732 cases (714 + 18 new), two full runs, 731 passed in each.** No single run was fully green; every case passed in at least one run and on its own.
  - Run 1: the one failure was this plan's new keyboard case. Its colour probe was reading a role mid-transition; the test was fixed and all 18 new cases pass.
  - Run 2: the one failure was `e2e/data-visualization.spec.ts:193` (the Charts page's live simulation: one animation still running when the test counts them). It passed in the baseline and in run 1, and three times out of three on its own afterwards. WP 1.1 doesn't touch that page; treat it as a timing flake to diagnose separately.
- **Nov 14, pull request 8's first CI run (on the merge with `main` at `8e4cf45`):** every shard passed except `e2e/performance.spec.ts:90`, a guard that arrived on `main` after this branch was cut. Appending to the landing's `main` restyled 4,533 parts (limit 500). Cause: the held header's rules tested `tr:first-child` and `tr:last-child` on an ancestor and ended in `*`; Chromium shares one invalidation set between every such rule on the page, so the landing paid for a Table it doesn't hold.
  - Fix: `main` was merged into the branch, and `table-sticky-header` now tests no `:first-child` or `:last-child`. The header's rule sits under every header row (a held header has one), a later body's rows all take a top rule (the same result as before), and a second footer row gives its rule back with a zero width. Paint is unchanged.
  - Naming the cell's tag (`th`, `td`) instead of `*` was tried first: it passed at 347 parts, but `main` alone measures 109, so it was dropped. The fix measures 109.
  - After the fix, on the merged branch: `performance.spec.ts`, `table-upgrades.spec.ts`, `table-construction.spec.ts`, `table-rule-status.spec.ts` and `docs-layout.spec.ts` pass (68 cases), with `pnpm build`, `pnpm typecheck` and `pnpm format:check`. The full suite was not rerun locally; CI runs it.
- `prettier` now skips `sketch/atlas.html`, the reference copy of the atlas; the plan README was reformatted (table alignment and blank lines only).
- Not done: the recordings and screenshots the plan's Verification section asks for Yankun, and any check outside the Playwright Chromium (Safari and Firefox were not opened).

## Resume

- **Next:** WP 1.2 `frozenColumn` and the edge eaves. Its column map is docs-local under G6's lean; say so here if you build it before G6 is answered.
- Phases 2, 3 (except WP 3.3) and 4 can also start. WP 2.1 reads Slide only as G1's lean; WP 3.3 waits for G2.
- WP 6.3's `AGENTS.md` section and `decision-drafts.md` are not written yet.
- **Nov 14:** pushed at Yankun's go-ahead as pull request 8. The branch was built and tested on `fbd867d`; it merges into the current `main` without conflicts but the suite was not rerun on the merged result, so the pull request's CI is the first run against it.
