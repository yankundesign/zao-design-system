# Azurite plan: progress

Branch `claude/azurite-seal`, cut from `main` at `8e4cf45`, in the worktree `.claude/worktrees/azurite-seal`. Committed on the branch; not pushed, no pull request.

## Decisions (Nov 14)

Yankun answered "Take all leans". The gate table and the leans are in [README.md](README.md).

| Gate | Chosen                                                 |
| ---- | ------------------------------------------------------ |
| Z1   | Mineral                                                |
| Z2   | Light face with an ink label                           |
| S1   | A: the committed check takes `accent-text`             |
| S2   | A: the checkbox in the seal; rows stay neutral         |
| S3   | Today. The lean read "Today, or A", so nothing changed |
| S4   | A: the running marker                                  |
| S5   | Today: Progress and Meter stay ink                     |
| S6   | Today: focus stays ink                                 |
| S7   | Today: links stay ink                                  |
| C1   | A: the accent square                                   |
| C2   | A: a seal square beside an ink datum                   |
| C3   | A: seal brackets, ink ramp                             |
| L1   | A: the picked course and its ruler measure             |
| L2   | A: 青 set in azurite                                   |

## Done

- [x] Audit and option sheet (`capture.mjs`, `closeups.mjs`, `ramp-candidates.ts`, `study.mjs`, `sheet.mjs`). The sheet is published privately at https://claude.ai/artifact/EeKwYB4CWWbTUWNKV9nbCt.
- [x] Ramp through `palette.config.ts` and `pnpm palette`; palette test hashes updated. The input is chroma 0.131, not 0.13: at 0.13 the unused light step 1 sat on the sRGB edge and the shipped CSS rounded its hue 0.3° from the token JSON, which `apps/lab/test/parity.test.ts` rejects. The solid moved one 8-bit step from the sheet's Mineral (`#15448c` to `#14448d`, `#72a5f5` to `#71a5f6`).
- [x] Published placements: Select and Combobox check, `table-checkbox`, Plan's running station. Changeset `.changeset/azurite-seal-placements.md`.
- [x] Docs-local placements: chart accent square, share strip chip, ring centre square, heatmap brackets, the landing bracket set's picked course and ruler measure, the Seal switch's 青. The ApprovalGate page's ink record specimens are pinned to ink.
- [x] Records: `AGENTS.md`, `docs/components/{select,combobox,table,plan}.md`, `docs/data-visualization.md`, the Charts page's rule 4 copy, the seal `$description`s in both mode files.
- [x] Tests: `apps/docs/e2e/azurite-seal.spec.ts` (27 cases: each placement in light and dark under both seals, the ramp's contrast, focus and Progress staying ink, forced colors). `landing.spec.ts` gains the picked course under azurite in light and dark, and its ink case now reads the ink seal.
- [x] Full check on Nov 14: `pnpm build && pnpm test && pnpm typecheck && pnpm format:check` passed. Engine 44, tokens 94, lab 31, docs browser 777 of 777 (14.3 minutes, one worker, `ZAO_DOCS_DIST_DIR=.next-azurite ZAO_DOCS_TEST_PORT=3187`).
- [x] Captures: before is each gate's `today` image in `study/`; after is `screenshots/after/parts/`. `seal-map.json` in `screenshots/before/` and `screenshots/after/` lists every blue paint per page.

## Not built

- S3 A (the selected secondary Tabs label in the seal's text role). The lean named two answers; the first, "Today", was taken. Say so if you want A.
- Everything the leans left as it was: a row tint in Table, the seal on Progress and Meter, on focus, on links, on a lead series or a selected datum, and the heatmap's seal ramp (C3 B).

## Not verified

- RTL and widths under 1280px for the new placements. They are paint-only changes on existing boxes, and the existing suites for those parts pass, but no new case covers them.
- Hover and pressed states under azurite other than the primary Button's were not captured.
- The dark-mode `accent-text` check on a highlighted Select row was read in a capture, not measured for contrast against the hover fill.
- The ink seal: the three published marks moved by one 8-bit step (`#23201a` to `#242018` in light, `#f2ede6` to `#f3ede3` in dark), and the checked box's mark is white where it was the canvas color. This was not compared pixel by pixel.
- Yu: its completeness ramp follows Su's input; nothing renders it.

## To resume

```sh
pnpm build
cd apps/docs
ZAO_DOCS_DIST_DIR=.next-azurite pnpm exec next build --webpack
ZAO_DOCS_DIST_DIR=.next-azurite ZAO_STYLE_STUDIES_DIR="$PWD/e2e/fixtures/studies/" pnpm exec next start --hostname 127.0.0.1 --port 3187
cd ../../docs/plans/2026-11-azurite
node study.mjs http://127.0.0.1:3187 "" after   # the built parts
node capture.mjs http://127.0.0.1:3187 after    # full pages and the paint map
```

Run one spec with `pnpm exec playwright test "azurite-seal\.spec"`: the bare name matches every spec, because this worktree's folder has the same name.
