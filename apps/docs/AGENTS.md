# Docs guidance

Read the [root agent guidance](../../AGENTS.md) and the [current design direction](../../BRIEF.md#current-design-direction-quiet-construction) before starting work here.

## Direction and scope as of October 7, 2026

**Quiet construction** is ZAO's overarching experimental direction for the boundary between 2D and 3D interfaces. It is not a third finish. Aim for clear, measured, physically coherent forms and quiet responsiveness. A designed resting state may already contain depth. Focus current work on Su in light and dark and polish one coherent system. Yu is deferred as a possible phase 2; existing assets are groundwork, not an active task or release requirement.

**Care for every detail; keep the number of details small.** Give visual form, interaction, and craft equal attention. Use a small, coherent set of details, each with a clear purpose. Refine the details already present before adding more.

Set the theme first. Yankun will define interactions one by one. Until a specific component task is requested, keep work to documentation and research. Do not prescribe hover gestures, depth values, motion timing, or a global motion system. Treat proposed usability benefits as hypotheses to investigate.

## Documentation sources

**Motion page, WP 3.3 (Oct 10):** Foundations → Motion renders its inventory from `docs/motion.md` and uses real components for Lift, Seat, Slide, and Reveal. Playback speed and the role editor write only on `data-motion-island`; the docs shell, navigation, tuner controls, and other pages retain their published values. Copy output excludes playback scaling. Invalid easing retains the last valid curve with an associated error. Reduced motion completes the existing spatial responses immediately and explains the preference. D11 is resolved with the current role values: lift, seat, and reveal exit 80ms; slide and reveal 160ms; the current standard curve throughout. Future tuner edits remain local previews until separately approved.

**Parts page, WP 4.1 (Oct 11):** Foundations → Parts renders `docs/parts.md` directly. The source contract checks every authored slot and component marker, including source ownership, and rejects dynamic hook names. Shared role names require owner qualification; inherited Button hooks remain Button-authored. Side, base, contact edge and joint can describe CSS paint or placement relationships without literal DOM slots. The audit proposes no renames; a future public hook rename requires its own decision.

**Anatomy figures, WP 4.2 (Oct 11, D13 A):** The seven component pages draw measured specimens with the approved docs-only defaults: 18× contact separation, 0° rigid 2D rotation, and 1× structural hairline. Preserve the actual semantic paint and keep each reading with its authored face. Source specimens run in finite, hidden, inert same-origin iframe documents with their own component bundle; sharing the parent's React/Base UI realm can interfere with modal scroll locking. Measure after fonts, positioning and finish paint settle, and clean up observers and listeners. `.docs-anatomy` inherits the study's variable declarations; `.study` remains the working preview selector. Keep reference and leader strokes clear of measured reading ink. Secondary Tabs retain their separate stationary readings; clear the separated indicator's stroke beneath those readings while preserving its full measured fill and geometry. The dashed native reference is a placement aid. Card's contact shadow, Menu's collision-resolved joint, field perimeter and Progress end paint must not be recast as additional physical bases. Native geometry and the working previews stay unchanged.

**Docs frame (Oct 11):** Yankun chose a 1440px maximum. The header row, the sidebar and content grid, and the footer share `.docs-shell`, capped at 1440px (360 fen) including the side gutters and centred. At 1440px and narrower the layout fills the window as before; wider screens gain margin. The header rule and page background stay full width. Prose keeps its own `max-w-2xl` limit.

**Docs chrome, WP 2.6 (Oct 10):** Desktop navigation scrolls with the page; do not restore an independently clipped or hidden sidebar scroll region. Keep all links reachable by pointer and keyboard, with room for the sticky header and outside focus outlines. Menu previews reserve token-derived room on both sides of the trigger for collision placement and put result text below the pocket. Check that the real popup stays inside its preview and away from subsequent documentation; do not alter the component's reveal or native targets to fit a preview.

**Table scroll gutter correction (Oct 11):** The docs Table's horizontal scroll region uses `scrollbar-gutter: auto`. A stable vertical gutter reserved an unused 11px column under classic scrollbars and shortened the ledger rules. Keep native horizontal scrolling and existing thumb styling, with frame-edge geometry and pixel assertions intact. This docs-only exception does not change Table's published paint path or the other scroll regions.

When another local docs build or test run is active, isolate verification with `ZAO_DOCS_DIST_DIR=.next-<task>-test ZAO_DOCS_TEST_PORT=<free-port> pnpm test` from the repo root. Both the build and browser server inherit that directory; browser results also stay inside it. Defaults remain `.next` and port 3102.

The docs site consumes study notes from Markdown, including [Quiet instrument's design notes](../../explorations/su-studies/quiet-instrument/design.md). Update the source notes when their content changes; do not duplicate the prose in page code.

Keep the existing `quiet-instrument` preview slug, study CSS, and token values. Quiet instrument remains a study, and its appearance or behavior is not approval for system-wide adoption. Documentation should distinguish the current direction, study evidence, and interactions that Yankun has specifically approved.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
