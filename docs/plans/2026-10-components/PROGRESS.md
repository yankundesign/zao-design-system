# Components plan implementation progress

## Baseline

- **Oct 13, 2026:** Before source changes, `pnpm --filter @zao/docs test` completed its production build and all 654 Playwright cases. **652 passed; 2 failed** in the pre-existing checkout:
  - `e2e/control-height.spec.ts:264`, real Quiet instrument light RTL: after Space focus, the controls' measured `y` changed by 4.671875px.
  - `e2e/landing.spec.ts:316`, workspace view switch: the window height changed from 701.96875px to 1334.9375px.
- Engine (44), token (92), and lab (31) tests passed during the initial `pnpm test` run. Its docs run reached the same production build, then the sandbox denied binding `127.0.0.1:3102` (`EPERM`); the approved local-server rerun above completed.
- The initial working tree already contained uncommitted Conversation and Composer work. It is preserved and remains outside this plan's scope.

## Decisions and gates

- Implement the plan with the stated lean. `ApprovalGate.mark` remains required; the docs specimen passes `准` (G2).
- G1 is unresolved, so hold-to-approve (WP 3.3) is not implemented.

## Implementation

- **Phase 1 complete:** generator-derived Hold and Impress durations and stepped curves export to CSS and JSON, including bands/jump metadata. Impress aliases Reveal. Token coverage is 94 passing tests.
- **Phase 2 complete:** published `Plan.Root` / `Plan.Step`, all seven statuses, completed rail fill, keyed step arrival, mount-time Conversation arrival detection, status announcements, RTL, reduced motion and forced colors.
- **Phase 3 complete except G1:** published host-owned `ApprovalGate`, pending actions, focus-safe decision records, and solid-cut impressions through ink/azurite accent roles. `mark` remains required under G2. No hold variant or bundled font was added.
- **Phase 4 complete:** published Card/Table drawing props and announcements, inert/hidden loading content, still guidelines, role-derived building timing, and rising planes. Card's removal and fen dimensions remain docs-local.
- **Phase 5 complete:** pages and nav entries, working local simulations, Card/Table loading sections, 18-export reference index, motion and Parts records, decision drafts, AGENTS guidance and package changesets.
- Final review corrected non-inheriting Plan paint properties, mount-time arrival capture, shared approval fact columns, mark-only optical alignment, client boundaries for the stateful Card/Table, and the real plane-lift build sequence.

## Verification

- `pnpm build`, `pnpm typecheck`, token tests (94), docs production build, `pnpm format:check` and `git diff --check` passed after the final component changes.
- **37 affected browser cases passed:** Plan/gate/drawing, Parts, docs layout and Motion demos. The subsequently added narrow/forced-colors case passed with all six Plan/gate/drawing cases. These cover Su light/dark, LTR/RTL, ink/azurite, reduced motion, forced colors and 390px containment.
- The 12 Tabs/Select interruption cases that failed or timed out in the full run passed in an isolated rerun. Motion demos also passed all 18 cases in isolation.
- The full `pnpm test` completed engine (44), tokens (94) and lab (31), then **643 of 659 browser cases passed; 16 failed** before the final review fixes. Four failures were the Table page's new fifth section and have been corrected; those four viewport cases now pass. Five Motion failures passed in scoped reruns.
- Older full-run failures remain recorded for separate diagnosis: Anatomy/Menu-to-Dialog page scrolling (light/dark), Quiet RTL control-height geometry (light/dark), landing Explore's stale 14-vs-16 count and dark axe timeout, and a Menu-emphasis mode-click timeout. The light RTL geometry failure was in the pre-change baseline. The landing workspace baseline failure did not recur in this run. No full-suite green result is claimed.
- All 34 review screenshots are saved in `/Users/yankunwang/.codex/visualizations/2026/10/13/01a136e7-a053-7210-9185-0c3325307127/components-evidence/`, with `README.md` as the index and `manifest.json` describing slowed inspection settings. Step and pen mid-arrival values matched between 0 and 1; mid-build plane depths were 0.42–0.47px, between 0 and the 4px rest value. The final Card drawing bar is unfilled.

## Resume

- Authorized, ungated implementation is complete. G1 alone blocks WP 3.3; G2 alone blocks an optional default mark.
- Run hold-to-approve work only after Yankun settles G1. Keep `mark` required until G2 is settled.
- Keep the recorded older full-suite failures separate from this plan's component behavior; the landing and other component interactions remain outside its scope.
