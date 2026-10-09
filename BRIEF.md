# ZAO: Project Brief

> ZAO is the foundation for how we build.
> Inspired by the principles of Yingzao Fashi, it defines the shared materials, patterns, and rules that help teams construct consistent digital experiences.

_Owner: Yankun · Started Sept 2026 · Status: v0.1 in progress · Repo: [github.com/yankundesign/zao-design-system](https://github.com/yankundesign/zao-design-system)_

## Current design direction: Quiet construction

_Established Oct 6, 2026. Scope updated Oct 7: build and polish Su in light and dark first. Yu is deferred as a possible phase 2._

ZAO is an experimental design system exploring the boundary between 2D and 3D interfaces. It combines the clarity of a two-dimensional interface with the physical presence of constructed objects. Its character is clean, measured, and quietly responsive. Surfaces and components should feel intentionally formed, proportioned, and connected.

The experiment explores how depth, material, and motion can become a coherent language across an interface. The aim is to discover whether that language improves understanding, orientation, feedback, and control while making digital experiences feel more tangible. Those usability benefits are hypotheses to test.

**Yingzao Fashi provides the conceptual foundation:** proportion, modular parts, construction methods, and the relationship between structure and finish. The interface should express this heritage through how its parts belong together and how consistently they behave.

**Hairline provides a reference for the feeling and the method.** Its economical linework, legible silhouettes, selective emphasis, coherent spatial construction, and responsive assemblies show how a small vocabulary can establish physical presence. Its resting figures are already composed and dimensional. Its process makes assumptions adjustable, judges them in context, and turns corrections into reusable rules. ZAO will develop an original language informed by those qualities. Hairline's figure-specific choices, including projection, rounding, highlight restrictions, and timing values, do not become ZAO requirements.

Material's treatment of the z-axis provides a precedent for turning a physical model into a system of design rules. ZAO will explore its own model through construction and assembly.

### Principles of the direction

1. **Clarity comes first.** Typography, hierarchy, alignment, and content remain easy to read and use.
2. **Construction is coherent.** Depth, overlap, edges, and connections follow understandable relationships.
3. **Stillness is designed.** The resting interface already feels composed and complete. It may have spatial presence before anyone interacts.
4. **Response is quiet and meaningful.** Interactivity should feel attentive and connected to what the person is doing.
5. **Expression earns its place.** Judge spatial treatments by both their character and their contribution to use.
6. **Care for every detail; keep the number of details small.** Give visual form, interaction, and craft equal attention. Use a small, coherent set of details, each with a clear purpose. Refine the details already present before adding more.

This direction applies to Su's working interface: controls, tables, cards, navigation, and data visualization. Light and dark share component anatomy, interaction meaning, accessibility, and structural proportions. Focus on one coherent system and polish its craft before exploring another finish.

### Current scope and ownership

**Set the theme first. Yankun will define interactions one by one.** Beyond the specific Button, IconButton, Card, Menu, Tabs, and Switch approvals below, exact gestures, hover behavior, depth ranges, motion values, component treatments, and implementation choices remain open. The direction does not prescribe a flat resting UI, a global hover treatment, or an interaction grammar.

The existing Quiet instrument preview remains the current Su study, with its name, slug, achromatic palette, and trial finish values intact. Button, IconButton, Card, Menu, Tabs, and Switch follow their individual approvals; the other recipes document the study's existing implementation. They do not define the new system's component interactions. Yu is outside the current scope; existing assets are retained as deferred groundwork.

**Approved Button refinement, Oct 6:** Keep the supplied Figma geometry: a square face, 14px Geist at weight 500 with an 18px line box, and default 16px horizontal / 8px vertical padding (34px height). Connect the face, side, and stationary base with a contact edge at rest. Hover retains the 2px upward-and-right lift and reveals the connected side edge, without a stronger hover border or blur. Press seats the face onto its base along that same axis; release returns it to hover or rest. The native hit area, neighboring layout, and outside keyboard focus outline remain fixed. Use the existing finish duration, preserve disabled and reduced-motion behavior, and provide input feedback across pointer, keyboard, and touch. This approval applies to Button alone; whether the construction improves use remains a hypothesis to test.

**Approved Button simplification, Oct 7:** Make the construction read as one face, one continuous joined side, and one fixed base, replacing the three visible offset shadow copies. The approved geometry, 2px upward-and-right lift, press axis, and finish duration stay unchanged. Preserve the stationary native hit area, focus outline, and neighboring layout, along with every variant, disabled state, and reduced-motion behavior.

**Approved Tabs, Oct 7:** Primary views use the refined ruler rail: one fine guide and a slightly stronger selection line share their centerline, with fine graduations, centered registration ticks, and small end stops. Hover or keyboard focus extends the target tick without moving selection; press compresses the selected line around the same centerline. Secondary views use a square recessed track with one sliding face, a contact edge, and press seating, with no repeated underline. Labels, native targets, focus outlines, and layout stay stationary. Preserve Base UI selection, horizontal and vertical keyboard navigation, disabled behavior, nested state, scrolling, and reduced motion. Reuse semantic colors and existing finish durations; this approval is specific to Tabs and introduces no token changes.

As Yankun specifies each component, explore alternatives, make assumptions adjustable where useful, judge them in context, and record the learning. Check understanding and control alongside visual character, including keyboard, touch, and reduced motion. Successful decisions can become clear rules that people and agents apply reliably. Published values still follow the existing selection and promotion process.

**Approved IconButton, Oct 6:** Use Iconoir as ZAO's icon family and follow Primer's IconButton reference for an icon-only action with an accessible action label and a hoverable tooltip on hover and keyboard focus that dismisses on Escape. IconButton reuses the current Button's construction and input feedback. Its square dimensions follow Button's shared 28px, 34px, and 40px sizes; icon sizing uses the existing structural icon tokens. This approval applies to IconButton specifically and does not establish interactions for other components.

**Approved Card, Oct 6:** Make Card a static, grounded reading surface: a frame and contact edge in semantic colors surround one content plane. The title leads, with metadata and an optional recessed data region supporting it. Explicit Button actions occupy a bottom row and keep their own interaction and focus behavior; the core Card remains passive, with no hover motion. The shared storage specimen consolidates its reading into one accurate, fully visible 68% chart. Keep existing fen proportions and type roles. This approval defines Card's construction and specimen composition, without selecting interactions for other components or claiming a measured usability benefit.

**Approved Menu and Pocket reveal, Oct 6:** Menu's depth identifies a temporary floating panel owned by its trigger. Reuse the secondary Button at shared 28px, 34px, and 40px sizes, with a clear open state. Anchor one frame with a fine semantic border and crisp contact edge. A decorative moving front lip starts at the trigger-adjacent joint, travels with the clipped reveal to become the far frame edge when open, and withdraws on close. Its direction follows actual collision placement. The full-size popup, labels, and selection targets remain stationary, without row stagger. Reuse existing `duration-base` for opening and `duration-fast` for closing (160ms / 80ms in Quiet instrument), without changing tokens or global timings. Reduced motion shows the completed frame immediately. Keep the approved semantic row emphasis, meaningful separators, and readable disabled items; current row emphasis remains steady through closing. Preserve Base UI keyboard navigation, dismissal, focus behavior, and collision flip/shift. Su uses `material-overlay` for floating material in light and dark. Other component interactions remain open.

**Requested Table implementation and monochrome refinement, Oct 6:** Yankun asked for a crafted monochrome table with inspiration from Hairline. One square stationary frame and contact edge define an open canvas; fine horizontal rules and shared fen padding organize the records. The primary column receives the available width, IDs use monospace, supporting columns stay compact, and numeric readings align with tabular figures. Statuses use plain foreground words. Matching header roles and reserved sort-indicator space keep the composition steady. A compact secondary toolbar and concise selected count support explicit sorting, checkbox selection, and comparison. Native table parts, detailed live announcements, and a named scroll region retain reading and keyboard access. Neutral row emphasis stays stationary. [Hairline's process](https://hairline.lucasmarkes.com/inspo) informs economical construction and a complete resting composition. Existing structural and semantic tokens supply the treatment. This requested refinement remains under review; finish promotion and measured usability benefits remain separate decisions.

**Requested data visualization guideline and first ring study, Oct 7:** Develop [working data visualization guidance](docs/data-visualization.md) from the Quiet construction direction and begin with Card's 68% storage ring. The local docs study inspects used/available capacity and keeps the quantitative geometry and Card stationary. The later Oct 7 refinement removes the Illustrative data section and its simulation and particle controls; the ring stays at 68% used and 32% available. Reuse semantic colors and existing finish motion; preserve keyboard, touch, summaries, and reduced motion. Further chart interactions and a published library remain open, with benefits to judge in use.

**Requested data visualization section and ring refinement, Oct 9:** Follow [the data visualization plan](docs/plans/2026-10-data-visualization/README.md) and [the revised guideline](docs/data-visualization.md). A new Charts nav section after Components holds an overview and Ring, Bar, Line, Heatmap, and Histogram pages; the guideline stays at Foundations → Data visualization. Every chart applies five rules: one stroke per datum; solid structure with dashed, labeled references; four slots (series and scale, summary, readout and unit); one accent square in `accent-solid`, which stays Su gray (DV2); and motion only from data, through a labeled, off-by-default simulation with discrete updates. The storage ring separates a fine scale ring from its 100 data marks, draws used marks long and available marks short with non-scaling hairlines, and adds the frame slots while keeping the 68% reading, region controls, readout strings, and passive Card. The charts are docs-local in `apps/docs/components/charts/`. The heatmap ramp mixes default ink into the canvas pending DV3; stroke weights reuse the hairline and the ring's 1.5px pending DV4; publishing a chart package is gated by DV5. No tokens, dependencies, or published props change.

**Approved Switch, Oct 7:** Use one square stationary housing, a recessed channel, and one connected sliding face. Position and semantic fill identify off and on. Hover changes face emphasis without moving it; press seats the face, and activation travels directly to the opposite endpoint without overshoot. Rapid toggling reverses from the current position. Use a 40px by 24px housing with a 16px square face. Keep the native target, outside focus outline, and neighboring layout fixed during interaction. Associate a clickable visible setting label whose wording stays stable. Base UI owns activation, controlled and uncontrolled state, and form behavior. Preserve disabled and read-only states, keyboard, touch cancellation, and RTL. Reduced motion shows the destination immediately and retains press feedback through fill. Reuse semantic colors and existing finish durations in Su light and dark; this approval is specific to Switch and adds no tokens or public API.

**Requested Progress refinement, Oct 7:** Apply clear task hierarchy to one square stationary recessed track, one advancing quantitative face, and a contact edge. Follow the [data visualization guideline](docs/data-visualization.md): derive geometry and readings from the same value, expose essential information directly, and show unknown completion without a filled fraction. The first reading appears immediately; actual changes use existing finish motion and reduced motion shows the destination immediately. Preserve Base UI semantics, formatting, clamping, and RTL; invalid ranges remain unknown. This component request adds no tokens, dependencies, or public props. Its usability benefits remain to be judged in context.

## Why

Three goals, in priority order:

1. **Learn** how to design and ship a design system in production-grade code: tokens, component APIs, accessibility, testing and releases.
2. **Showcase** design engineering craft with a public, working system rather than a mockup.
3. **Argue a point of view** on how to keep AI-generated UI from turning into slop.

## Why the name

_Yingzao Fashi_ (营造法式, "Treatise on Architectural Methods") is the building manual Li Jie compiled for the Song court, published in 1103. It turned construction into a rule-based system that any crew could follow at any scale. 造 (zào) means to build or make. The manual's structure maps closely onto a design system:

| Yingzao Fashi        | What it was                                                                                  | ZAO equivalent                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 释名 Terminology     | Standard names for every building part                                                       | Shared vocabulary: token and component names that humans and agents use the same way                                                    |
| 材分 Module          | One timber unit (_cai_), 15 × 10 _fen_, in eight grades. Every dimension is written in _fen_ | A base unit that spacing, sizing and type are derived from. Later, density grades that scale the whole UI while keeping its proportions |
| 制度 Standards       | Rules for each trade                                                                         | Guidelines, lint rules, component contracts                                                                                             |
| 料例 Materials       | Material specifications per job                                                              | Tokens                                                                                                                                  |
| 功限 Labor           | Work quotas per task                                                                         | Budgets and evals: how quality is measured                                                                                              |
| 图样 Drawings        | Illustrated reference drawings                                                               | Patterns, examples, docs                                                                                                                |
| 彩画 Painting grades | The same timber frame, finished anywhere from plain (丹粉刷饰) to lavish (五彩遍装)          | Themes: shared structure, swappable finish                                                                                              |

## Thesis

Agents produce slop when a design system gives them too many choices and too little reasoning. An agent-friendly system does three things: it **shrinks the choice space**, it **explains itself in a form machines can read**, and it **proves its effect** with evals instead of just claiming it.

## What "agent-friendly" means here

| Layer           | What it is                                   | How it shows up                                                                                                                                                                      |
| --------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Contract**    | A machine-readable definition of the system  | Tokens in the W3C DTCG format (stable since Oct 2025). A manifest for each component covering props, intent, when to use it, when _not_ to use it, and allowed compositions          |
| **Constraints** | Wrong things are hard to do                  | Semantic tokens only. Tailwind's default palette removed. Closed variant APIs. Lint rules that fail on raw hex values, off-scale spacing, arbitrary values and raw `backdrop-filter` |
| **Guidance**    | Rules written for agents, each with a reason | AGENTS.md and an agent skill. Docs that pair every rule with its rationale. llms.txt                                                                                                 |
| **Proof**       | Evidence that it works                       | An eval harness comparing agent output with and without the system (see below)                                                                                                       |

**Don't rebuild what already exists.** Storybook's MCP (for React, since Storybook 10.3) already gives agents stories, props and tests. Use it as the baseline, then add what it lacks: intent, anti-slop rules, and a validator an agent can run on its own output.

## Current finish: Su first

Song buildings could share a timber frame and still be painted at very different grades. ZAO retains that separation of structure and finish, while the current work focuses on Su alone. Components use semantic tokens so a future finish can reuse the foundation.

| Shared (structure)                                                                                                                                         | Themed (finish)                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base unit and spacing scale, type scale steps, the text face and its metrics, layout, component anatomy, states, behavior, keyboard support, accessibility | Color, material (surface fill, translucency, blur, border, highlight, shadow), radius, motion character, the display face used for titles, and width-neutral font axes such as grade or roundness |

**Su 素: the plain finish**
Quiet, precise and easy to adopt. Su expresses Quiet construction through a restrained plain finish. The existing Quiet instrument study provides an achromatic starting point with opaque surfaces and clear edge hierarchy. Its component treatments remain trials; Yankun will define future interactions individually. Structural sizing, legible states, tabular numerals, and keyboard access remain shared requirements.

**Yu 玉: deferred, possible phase 2**
Yu is outside the current build, docs previews, eval, and release scope. Revisit it only after Su's visual form, interaction, and craft are established, and only when Yankun requests it. Existing tokens and engine/lab support remain deferred groundwork, not a requirement for v0.1.

The earlier proposal was an expressive finish of the same Quiet construction direction, with palette and material expression still open. It drew from 碾玉装 ("polished jade"), a painting grade in the manual, explores a cool blue-green palette and stepped color bands (叠晕), with translucent glass on floating layers. It remains a reference proposal, not a chosen finish. Spatial presence may belong to either finish; Yu does not own the system's depth or interaction meaning.

**Deferred expressive-finish considerations.** These are reference material for a possible phase 2, not current implementation work:

- Glass appears only on floating layers: popover, menu, dialog, toast, command bar. Never on content surfaces or behind body text.
- Text contrast is checked against the worst-case backdrop, not an average one.
- There is an opaque fallback through `@supports` and `prefers-reduced-transparency`. That media query only works in Chromium today, so there is also a user-facing setting.
- Components use material tokens (`material.overlay.*`), never `backdrop-filter` directly.

**How themes are built**

- **Generated, not hand-picked.** A script derives each theme from a few inputs (base, accent, contrast) in OKLCH. Linear does the same thing in LCH, using three inputs where it used to need 98 variables per theme.
- **Expressed with the DTCG Resolver module.** The current docs use `theme: su` and `mode: light | dark`, output as CSS variables scoped by `[data-zao-theme][data-zao-mode]`. Existing Yu resolver support is retained as deferred groundwork.
- **Future architecture check.** If Yu is resumed, test whether it can reuse component code through finish tokens. It is not a current completion gate.

## Scope

**v0.1: in scope**

- A base unit, plus tokens for color, type, space, radius, elevation, motion and **material**.
- One finish: Su in light and dark. Prioritize a coherent system and polished craft.
- 7 components: Button, TextField, Select, Dialog, Tooltip, Tabs, Toast. Each ships with every state, full keyboard support, an axe-clean test in Su light and dark, a docs page and a manifest entry.
- The agent layer described above, for those 7 components.
- Eval v1.
- One real page built on the system (dogfooding).
- A case study write-up.

**Next (v0.2 and later)**

- Possible phase 2: revisit Yu as a second finish after Su is established; palette, material, modes, and release remain open.
- Density grades, following the _cai_ grades.
- Agentic UX patterns as the signature set: PlanSteps, ToolCallLog, ApprovalGate, Citation, ConfidenceIndicator, DiffReview, StreamingText.
- A shadcn-style registry for patterns and page blocks, so agents can install them through the shadcn MCP.
- A Figma library synced from the tokens.

**Out of scope**

- Component count as a goal.
- Additional finishes, including Yu, during the current phase.
- Frameworks other than React.

## Stack

| Concern                  | Choice                                                                                                                                                                                         | Alternative                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Repo                     | pnpm monorepo: `packages/tokens`, `packages/react`, `packages/agent` (manifest, MCP server, validator), `apps/docs`, `evals/`                                                                  | Single package                           |
| Behavior & accessibility | **Base UI** (decided; v1 stable since Dec 2025)                                                                                                                                                | React Aria Components (considered)       |
| Styling                  | **Tailwind v4** (decided), with the default theme cleared so only ZAO tokens exist                                                                                                             | CSS Modules + CSS variables (considered) |
| Fonts                    | **Geist** and **Geist Mono** from the `geist` npm package, **Newsreader** from Fontsource (decided). Self-hosted, never Google Fonts at runtime, because its files drop most OpenType features | —                                        |
| Tokens                   | DTCG JSON plus a Resolver file for themes and modes → **Terrazzo** (decided; it supports the Resolver module natively) → CSS variables, TypeScript types, and JSON for agents                  | Style Dictionary (considered)            |
| Theme generation         | A script that generates themes in OKLCH                                                                                                                                                        | Hand-tuned palettes                      |
| Workbench                | Storybook, with its MCP as the baseline                                                                                                                                                        | —                                        |
| Docs                     | Custom site (**Next.js 16**) with a live light/dark/system mode switcher. This is where the showcase lives                                                                                     | Storybook docs only                      |
| Tests                    | Vitest + Testing Library, Playwright (interaction + visual snapshots for each theme), axe-core                                                                                                 | —                                        |
| Release                  | Changesets → npm under the **@zao** scope, **MIT** license, with GitHub Actions for CI                                                                                                         | —                                        |
| Toolchain                | Node 24, pnpm 10, TypeScript 7, Tailwind CSS 4.3, Vitest 5                                                                                                                                     | —                                        |

## Eval design

- **Tasks:** 5 realistic UI prompts, for example a settings page, an empty state, a filterable table, a confirmation for a destructive action, and a multi-step form.
- **Conditions:** (A) an agent with a generic stack, (B) the agent plus the package, (C) the agent plus the package and the agent layer.
- **Modes:** every output is rendered in Su light and dark. If the agent's code only works in one mode, that counts as a failure. Yu is deferred from the current eval scope.
- **Automated metrics:** token and material violations, axe violations in each Su mode, and the share of UI built from system components rather than hand-rolled.
- **Human metric:** a blind rubric review covering hierarchy, restraint, copy and state coverage.
- **Output:** a side-by-side gallery on the docs site. This is the centerpiece of the case study.

## Milestones

Each takes roughly one or two weekends.

1. **Foundation:** repo, base unit, token architecture and Resolver file, theme generator, Su in light and dark, docs shell, CI. **Done Sept 29, 2026** (existing Yu groundwork is deferred).

   The original study-then-tools sequence was superseded by the Oct 4 component study decision. The Oct 6 pivot establishes the shared design direction first, with further interactions defined by Yankun one component at a time. Follow the current scope in `PLAN.md`; the milestones below remain the release outline.

2. **Inputs:** Button, TextField, Select.
3. **Overlays & navigation:** Dialog, Tooltip, Tabs, Toast.
4. **Agent layer:** manifests, AGENTS.md, skill, MCP server, validator.
5. **Proof:** eval run in Su light and dark, and the dogfood page.
6. **Ship:** v0.1 published to npm, docs site live, case study written.

**Possible phase 2:** revisit Yu after Su's craft is established. The second finish and its architecture check are not prerequisites for the current milestones.

## Done means

- v0.1 is on npm and the docs site is live, with a light/dark/system mode switcher for Su.
- Every component passes keyboard and axe tests in CI, in Su light and dark.
- Su forms one coherent system with polished visual form, interaction, and craft. Yu is not a completion requirement.
- Condition C has zero token violations and clearly beats condition A on component reuse and accessibility.
- The case study explains at least five real decisions and their trade-offs.

## Principles

1. **Fewer choices, better defaults.** Every option is another way for slop to get in.
2. **Every rule has a reason.** Agents and people both follow rules better when they know why.
3. **Measure, don't assert.** Any claim about quality comes with evidence.
4. **Two readers.** Everything is written for both a human and an agent.
5. **Structure is shared, finish is chosen.** Themes change how ZAO looks, never how it works.
6. **Care for every detail; keep the number of details small.** Apply the [design principle](#principles-of-the-direction) across visual form, interaction, and craft.

## Decision log

Earlier entries record decisions at the time. The Oct 7 Su-first scope decision supersedes the earlier two-finish release requirements.

| Date       | Decision                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-29 | Name: **ZAO**, inspired by Yingzao Fashi                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-09-29 | Two themes from the start: a minimal, Linear-like finish and an expressive finish with color and glass                                                                                                                                                                                                                                                                                                                           |
| 2026-09-29 | Theme names: **Su 素** (plain) and **Yu 玉** (jade)                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-09-29 | Headless layer: **Base UI**. Styling: **Tailwind v4** with a locked theme                                                                                                                                                                                                                                                                                                                                                        |
| 2026-09-29 | Typography: **Geist** for text in both finishes, **Newsreader** for Yu's titles (with Noto Serif SC for Chinese), **Geist Mono** for code. See `docs/research/typography.md`                                                                                                                                                                                                                                                     |
| 2026-09-29 | npm scope **@zao**, **MIT** license. Tokens built with **Terrazzo**; palettes generated in OKLCH from `palette.config.ts`                                                                                                                                                                                                                                                                                                        |
| 2026-09-29 | Both finishes are **pure gray** (neutrals and accent) until their colors are chosen. Status colors keep their hues                                                                                                                                                                                                                                                                                                               |
| 2026-09-29 | **Slow down before components:** study first (`study/STUDY.md`), then build tools for finding the style (`PLAN.md`). Visual values are chosen by Yankun, never by agents                                                                                                                                                                                                                                                         |
| 2026-10-04 | **Start with components:** build Button, TextField, and Card using the existing tokens. Reference studies produce `style.css` and `design.md`; compare them on each component's docs page. Yankun chooses finish values.                                                                                                                                                                                                         |
| 2026-10-04 | **Choose a Su direction for component study:** show Quiet instrument beside the ZAO baseline in the component docs. The other Su studies remain exploration records. Yu shows only the baseline until its direction is explored. No study values are promoted into tokens yet.                                                                                                                                                   |
| 2026-10-06 | **Quiet construction:** explore the boundary of 2D and 3D working interfaces through clean, measured, coherent construction and quiet response. Yingzao Fashi supplies the conceptual foundation; Hairline supplies a feeling and experimental method. Set the shared theme first; Yankun defines interactions one by one. Su and Yu retain shared structure and meaning. Existing study values remain trials.                   |
| 2026-10-06 | **Refine Button construction:** preserve its approved Figma geometry and 2px upward-and-right hover lift. Add a connected side and contact edge at rest, quiet the hover treatment, and seat the face onto its base on press along the same axis. Release returns to hover or rest. Keep the native hit area, focus, disabled and reduced-motion behavior intact; reuse finish timing. Other component interactions remain open. |
| 2026-10-06 | **Ground Card construction:** use a static frame and contact edge in semantic colors around one content plane. Lead with the title, allow a recessed data region, and place explicit Button actions in a bottom row. Keep the core Card passive with no hover motion. Consolidate the storage specimen into one accurate, fully visible 68% chart. Other component interactions remain open.                                     |
| 2026-10-06 | **Refine Pocket reveal for Menu:** a decorative moving front lip travels from the trigger-adjacent joint with the clipped reveal, becomes the far frame edge when open, and withdraws on close. The popup, labels, and selection targets stay stationary; row emphasis stays steady through closing. Keep existing overlay timings, placement-aware direction, completed reduced-motion frame, and Base UI behavior.             |
| 2026-10-07 | **Simplify Button construction:** one face, one continuous joined side, and one fixed base replace the three visible offset shadow copies. Preserve approved geometry, the 2px upward-and-right lift, press axis, finish duration, stationary native hit area and focus, variants, disabled behavior, and reduced-motion feedback.                                                                                               |
| 2026-10-07 | **Care for every detail; keep the number of details small:** give visual form, interaction, and craft equal attention. Use a small, coherent set of purposeful details, refining what is present before adding more.                                                                                                                                                                                                             |
| 2026-10-07 | **Su first:** focus the current build, docs, eval, and release scope on Su in light and dark, polishing one coherent design system. Remove Yu from the docs header and previews. Retain existing Yu groundwork; revisit it only as a possible phase 2 after Su is established.                                                                                                                                                   |

## Open decisions

- [ ] **Component interactions.** Yankun defines each separately, including its purpose, physical expression, gestures, depth, and motion values. Button is the first approved implementation and refinement: connected face, side, and base at rest; a quiet 2px upward-and-right hover lift; and same-axis contact on press, followed by release to hover or rest. It retains the supplied Figma geometry and ZAO colors. IconButton reuses that behavior with its accessible label and tooltip. Card has a static grounded frame, one content plane, and explicit bottom Button actions; its core remains passive. Menu has an anchored floating frame and stationary rows, opened by a secondary Button and revealed through trigger-adjacent clipping with a decorative moving front lip. Further Menu row interactions, other components, and any shared interaction grammar remain open.
- [ ] **Evidence for spatial behavior.** Decide how each requested study will judge understanding, control, feedback, and visual character before claiming a usability improvement.
- [ ] **Possible phase 2: Yu.** Decide whether to resume a second finish after Su's craft is established. Palette, material, mode coverage, and release timing remain deferred.
- [ ] **Distribution.** An npm package alone keeps the API constrained. Adding a shadcn-style registry lets agents install components via MCP, but copied source can drift from the original.
- [ ] **Dogfood target.** yankun.design, Taste Builder, or a demo "agent console" that also shows off the v0.2 patterns.

## References

- [Hairline repository](https://github.com/lucasmarkes/hairline)
- [Hairline design rules, studied revision](https://github.com/lucasmarkes/hairline/blob/bc782244216620434b14736df1d74daed2d05046/skills/hairline-create/rules.md)
- [Hairline drawing engine, studied revision](https://github.com/lucasmarkes/hairline/blob/bc782244216620434b14736df1d74daed2d05046/packages/hairline/src/core/iso.ts)
- [How Hairline was made](https://hairline.lucasmarkes.com/inspo)
- [Hairline figures](https://hairline.lucasmarkes.com/figures)
- [Material Design elevation](https://m2.material.io/design/environment/elevation.html)
- [Yingzao Fashi (Wikipedia)](https://en.wikipedia.org/wiki/Yingzao_Fashi)
- [Modular construction in Chinese timber architecture (ArchDaily)](https://www.archdaily.com/949479/from-ancient-to-modern-modular-construction-in-chinese-timber-architecture)
- [《营造法式》彩画制度术语辨析](https://www.gujianchina.cn/news/show-8436.html)
- [How we redesigned the Linear UI, part II](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Design Tokens Format Module 2025.10 (W3C DTCG)](https://www.designtokens.org/tr/drafts/format/)
- [Design Tokens Resolver Module 2025.10](https://www.designtokens.org/tr/drafts/resolver/)
- [prefers-reduced-transparency support (caniuse)](https://caniuse.com/wf-prefers-reduced-transparency)
- [Base UI releases](https://base-ui.com/react/overview/releases)
- [Storybook MCP for React](https://storybook.js.org/blog/storybook-mcp-for-react/)
- [shadcn CLI 3.0 and MCP server](https://ui.shadcn.com/docs/changelog/2025-08-cli-3-mcp)
