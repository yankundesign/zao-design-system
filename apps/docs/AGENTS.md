# Docs guidance

Read the [root agent guidance](../../AGENTS.md) and the [current design direction](../../BRIEF.md#current-design-direction-quiet-construction) before starting work here.

## Direction and scope as of October 7, 2026

**Quiet construction** is ZAO's overarching experimental direction for the boundary between 2D and 3D interfaces. It is not a third finish. Aim for clear, measured, physically coherent forms and quiet responsiveness. A designed resting state may already contain depth. Focus current work on Su in light and dark and polish one coherent system. Yu is deferred as a possible phase 2; existing assets are groundwork, not an active task or release requirement.

**Care for every detail; keep the number of details small.** Give visual form, interaction, and craft equal attention. Use a small, coherent set of details, each with a clear purpose. Refine the details already present before adding more.

Set the theme first. Yankun will define interactions one by one. Until a specific component task is requested, keep work to documentation and research. Do not prescribe hover gestures, depth values, motion timing, or a global motion system. Treat proposed usability benefits as hypotheses to investigate.

## Documentation sources

When another local docs build or test run is active, isolate verification with `ZAO_DOCS_DIST_DIR=.next-<task>-test ZAO_DOCS_TEST_PORT=<free-port> pnpm test` from the repo root. Both the build and browser server inherit that directory; browser results also stay inside it. Defaults remain `.next` and port 3102.

The docs site consumes study notes from Markdown, including [Quiet instrument's design notes](../../explorations/su-studies/quiet-instrument/design.md). Update the source notes when their content changes; do not duplicate the prose in page code.

Keep the existing `quiet-instrument` preview slug, study CSS, and token values. Quiet instrument remains a study, and its appearance or behavior is not approval for system-wide adoption. Documentation should distinguish the current direction, study evidence, and interactions that Yankun has specifically approved.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
