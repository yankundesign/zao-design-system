# Conversation and Composer implementation progress

## Baseline

- **Oct 12, 2026:** Before source changes, the isolated full docs browser suite passed: `650 passed (3.8m)`. The baseline build and TypeScript phase also passed.
- The first sandboxed Playwright launch was denied when binding `127.0.0.1`; the plan-required run then completed with the approved localhost test server and four workers.
- Initial working tree contained only the user-provided untracked plan folder.

## Implementation

- Latest API decision: preserve the public props and give the control the secondary face.
- Phase 1 (T1–T5): implemented: user slips/rhythm, status construction/loading arc, entering-request reveal, docked Latest, and scroll eaves.
- Phase 2 (C1–C4): implemented: raised tray and brackets, Send/Stop lifecycle, added/removing attachment tiles, delayed context-chip removal.
- Phase 3: implemented: docs specimen sent-context snapshots, landing layer membership, browser coverage, component references, motion/parts/AGENTS records, decision drafts, and `@zao/react` changeset.
- L13 caption gate remains with Yankun. The Composer and request slips are in layer 02; current layer captions are unchanged. A concrete wording suggestion is in `decision-drafts.md`.
- Scoped regression run: Conversation, Composer, and landing specs passed **54 tests**, including four-mode light/dark and forced-color, reduced-motion, touch, RTL, eaves, and removal-lifecycle coverage.
- Plan screenshots are saved under `screenshots/`: [Conversation at rest](screenshots/conversation-rest.png), [streaming](screenshots/conversation-streaming.png), [stopped](screenshots/conversation-stopped.png), [failed](screenshots/conversation-failed.png), [scrolled back](screenshots/conversation-scrolled-back.png), [Composer states](screenshots/composer-states.png) and [pending](screenshots/composer-pending.png), and the landing workspace in [Parts](screenshots/landing-parts.png) and [Built](screenshots/landing-built.png).
- Verification: `pnpm build`, package tests (engine 44, tokens 92, lab 31), `pnpm typecheck`, `pnpm format:check`, and `git diff --check` passed. The complete docs browser run passed all 654 tests with 4 workers and one retry; the modal wheel-scroll probe was flaky on its first attempt but passed on retry and in isolation. The direct one-worker package test command passed 652 of 654 browser cases; its control-height and landing window-layout probes passed on focused reruns (three repeats for landing).

## Resume

WP 1–3 are implemented. The remaining L13 caption wording is intentionally left for Yankun to decide; its suggested copy is in `decision-drafts.md`. Add accepted decision rows to `BRIEF.md` when ready.
