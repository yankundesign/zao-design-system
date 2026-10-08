# AGENTS.md

Guidance for coding agents working in the ZAO repo. Humans are welcome too.

ZAO is a design system built to be used well by agents. The same idea applies here: fewer choices, better defaults, and a reason for every rule. If a rule below blocks something you need, stop and ask instead of working around it.

## Current design direction: Quiet construction

**Direction update, Oct 6, 2026:** ZAO is an experiment at the boundary of 2D and 3D interfaces. Its character is clean, measured, physically coherent, and quietly responsive. Read the [current direction in BRIEF.md](BRIEF.md#current-design-direction-quiet-construction) and the current scope at the top of [PLAN.md](PLAN.md) before proposing design work.

- **Theme first.** Establish the shared direction; Yankun will define component interactions one by one. Follow the specific component task he gives. Do not infer hover behaviors, gestures, depth ranges, motion values, or a global interaction system from this brief.
- **Construction has a purpose.** Explore how proportion, parts, assembly, and finish can support understanding and use. Keep readability, predictable control, keyboard access, and reduced motion intact. Usability benefits are hypotheses until supported by evidence.
- **Quiet does not require flatness.** The resting interface should already be composed and complete; it may have restrained spatial presence before interaction.
- **Care for every detail; keep the number of details small.** Give visual form, interaction, and craft equal attention. Use a small, coherent set of details, each with a clear purpose. Refine the details already present before adding more.
- **References inform original work.** Hairline is a reference for economical drawing, coherent construction, quiet response, and the process of testing assumptions. Its figure-specific rules, geometry, timings, and code are not ZAO requirements.
- **One system first.** Build and polish **Su 素** in light and dark. **Yu 玉** is outside the current scope and may return in phase 2 after Su's craft is established. Quiet construction remains the direction for Su; do not expand finish exploration or component requirements to Yu.
- **Existing studies remain studies.** The Quiet instrument preview name, slug, CSS, and trial values remain the current Su study. Its recipes describe the existing preview, not approved interactions for every component. This pivot alone does not authorize changes to UI code, CSS, tokens, dependencies, or published defaults.

**Requested light preview refinement, Oct 7:** Quiet instrument's light canvas inherits ZAO's published semantic page canvas, removing the separate grey backing across component previews. The local dark canvas mapping and the existing surface, recessed control, state, and floating material roles retain their current treatments. This request covers the light preview backing and does not promote study values into tokens.

**First approved component, Button (Oct 6):** Follow [Yankun's Figma reference](https://www.figma.com/design/N2yXQBswbFVDiCh6WRCUTz/ZAO?node-id=1-2332) for the square face, 14px Geist at weight 500, an 18px line box, and default 16px horizontal / 8px vertical padding (34px height). Use ZAO's semantic colors. The approved refinement connects face, side, and base with a contact edge at rest. Pointer hover retains the 2px upward-and-right lift and exposes the connected side edge, without a stronger hover border or blur. Press seats the face onto its base along that same axis; release returns it to the hovered or resting pose. Only the face moves: the native hit area, neighboring layout, and outside keyboard focus outline stay fixed. Use the existing finish duration. Disabled and reduced-motion buttons keep their existing protections. This approval is specific to Button; other component interactions remain open.

**Approved Button simplification, Oct 7:** Show one face, one continuous joined side, and one fixed base, replacing the three visible offset shadow copies. Preserve the approved geometry, 2px upward-and-right lift, same press axis, and finish duration. Keep the native hit area, focus outline, and neighboring layout stationary; retain all variants, disabled behavior, and reduced-motion feedback.

**Approved IconButton, Oct 6:** Use Iconoir and follow [Primer's IconButton guidance](https://primer.style/product/components/icon-button/) for an icon-only action with a required accessible label and a hoverable, Escape-dismissible tooltip on hover and keyboard focus. Reuse the current Button's construction and interaction, including its stationary hit area and focus outline, connected edge, hover lift, press/release feedback, disabled state, and reduced-motion protections. Keep its square dimensions tied to Button's existing small, default, and large sizes. This approval is specific to IconButton; other component interactions remain open.

**Approved Card, Oct 6:** Use a static, grounded frame and contact edge with ZAO semantic colors around one content plane. Let the title lead the hierarchy; supporting metadata and an optional recessed data region remain subordinate. Put explicit Button actions in a bottom row. The core Card stays passive, with no hover motion; its actions retain their own approved behavior. In the shared storage specimen, consolidate the reading into one fully visible chart that accurately represents 68%. Use existing fen proportions and type roles. This approval is specific to Card; other component interactions remain open.

**Approved Menu and Pocket reveal, Oct 6:** Reuse the secondary Button for a labeled trigger at its shared 28px, 34px, and 40px sizes, with a clear open state. Anchor one floating frame to the trigger, using a fine semantic border and crisp contact edge. A decorative moving front lip starts at the trigger-adjacent joint, travels with the clipped reveal, and becomes the far frame edge when open; it withdraws on close and adapts to actual collision placement. The full-size popup, labels, and selection targets stay stationary, without row stagger. Use existing `duration-base` for opening and the finish's faster `duration-fast` for closing; reduced motion shows the completed frame immediately. Keep the approved semantic hover and keyboard emphasis, meaningful separators, and readable disabled items. Row emphasis stays steady through closing. Preserve Base UI keyboard navigation, dismissal, focus behavior, and collision flip/shift. Su uses `material-overlay` for its floating material in light and dark. Other component interactions remain open.

**Requested Table and monochrome refinement, Oct 6:** Build the grounded ledger direction after reviewing Button, Card, Menu, and Hairline. Use one square stationary frame and contact edge around an open canvas, fine horizontal rules, and shared `px-3 py-2` cell padding. Give the primary column the available width; keep supporting columns compact, IDs monospace, numeric readings right aligned with tabular figures, and statuses in plain foreground text. Match static and sortable headings with `type-label` and reserve sort-indicator space. Reuse secondary Button and current Menu actions in a compact toolbar, with a concise selected count. Keep native table semantics, labeled checkboxes, detailed live announcements, and a named, keyboard-focusable horizontal scroll region. The Oct 7 checkbox refinement uses square corners with no radius, visible checked/mixed marks, a 24px label target, and intact native state and keyboard focus. Neutral hover, focus, and `bg-active` selection keep geometry fixed. Hairline informs economical construction and a composed resting state. This requested refinement remains under review; it does not approve interactions for other components or promote finish values.

**Requested data visualization guideline and first ring study, Oct 7:** Follow [the working guideline](docs/data-visualization.md). Start with the existing 68% storage ring: inspect meaningful used/available regions through pointer, keyboard, and touch; keep quantitative geometry and the passive Card fixed. The later Oct 7 refinement removes the Illustrative data section and its simulation and particle controls. Keep the reading at 68% used and 32% available. Use existing semantic colors and finish motion, with reduced-motion protections. This is a local docs study, not approval for all chart interactions, published chart APIs, dependencies, or new tokens.

**Approved Tabs, Oct 7:** Primary views use the refined ruler rail: one fine guide and a slightly stronger selection line share their centerline, with fine graduations, centered registration ticks, and small end stops. Hover or keyboard focus extends the target tick without moving selection; press compresses the selected line around the same centerline. Secondary views use a square recessed track with one sliding face, a contact edge, and press seating, with no repeated underline. Labels, native targets, focus outlines, and layout stay stationary. Preserve Base UI selection, horizontal and vertical keyboard navigation, disabled behavior, nested state, scrolling, and reduced motion. Reuse semantic colors and existing finish durations; this approval is specific to Tabs and introduces no token changes.

**Approved Switch, Oct 7:** Use one square stationary housing, a recessed channel, and one connected sliding face. Position and semantic fill identify off and on. Hover changes face emphasis without moving it; press seats the face, and activation travels directly to the opposite endpoint without overshoot. Rapid toggling reverses from the current position. Use a 40px by 24px housing with a 16px square face. Keep the native target, outside focus outline, and neighboring layout fixed during interaction. Associate a clickable visible setting label whose wording stays stable. Base UI owns activation, controlled and uncontrolled state, and form behavior. Preserve disabled and read-only states, keyboard, touch cancellation, and RTL. Reduced motion shows the destination immediately and retains press feedback through fill. Reuse semantic colors and existing finish durations in Su light and dark; this approval is specific to Switch and adds no tokens or public API.

**Requested Progress refinement, Oct 7:** Follow the data visualization guideline and the recommended combination of clear product hierarchy and quiet construction. Use one square stationary recessed track, one quantitative face, and a contact edge; put the task label and formatted value outside the track. Keep the measured span accurate at zero, full, fractional, and custom-range values. Unknown completion uses an interrupted reference without a filled fraction or idle motion. Show the first reading immediately; actual updates use existing finish motion, with immediate reduced-motion changes. Essential readings need no inspection gesture. Preserve Base UI semantics, formatting, clamping, and RTL; invalid ranges remain unknown. This request is specific to Progress and introduces no tokens, dependencies, or public props.

## Repo map

| Path              | What it is                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `packages/tokens` | `@zao/tokens`. DTCG token sources, the resolver, the build (Terrazzo) and the tests. The source of truth for every published value. |
| `packages/engine` | `@zao/engine`. Private palette generator, contrast logic, parameter registry, style validation and transformations.                 |
| `packages/react`  | `@zao/react`. The Tailwind v4 theme, self-hosted fonts and (from milestone 2) components built on Base UI.                          |
| `packages/agent`  | Planned: component manifests, the MCP server and the validator for agents using ZAO in other repos.                                 |
| `apps/docs`       | `@zao/docs`. The Next.js docs site. It renders from the token JSON, so it can't drift from the source.                              |
| `apps/lab`        | `@zao/lab`. Private, local style workbench with specimens and a registry-driven editor.                                             |
| `explorations`    | Working styles, reference metadata, snapshots and journal. Reference images and trial fonts are gitignored.                         |
| `evals`           | Planned: agent output with and without ZAO, compared on the same prompts.                                                           |
| `BRIEF.md`        | Goals, scope, milestones and the decision log. Read it before proposing structural changes.                                         |
| `PLAN.md`         | Current exploration scope, followed by the historical Phase 2 Lab plan. Read the current scope before starting work.                |
| `study/STUDY.md`  | Yankun's Phase 1 study plan. Not a task list for agents.                                                                            |
| `docs/research`   | Research behind decisions, such as typography.                                                                                      |

## Commands

```sh
pnpm install          # once
pnpm dev              # build packages, then run token watch and docs at http://localhost:3000
pnpm lab              # build packages, then run token watch and private lab at http://localhost:3001
pnpm lab:style help   # file-based style commands for agents and people
pnpm lab:style compare <id1> <id2> --context su-dark # compare 2-4 Su studies by registry parameter
pnpm lab:reference help # reference board commands, including image sampling and seed drafts
pnpm lab:journal help # list and write journal notes from the command line
pnpm lab:check        # validate every saved style and its inheritance
pnpm lab:snap --styles su --specimens settings --contexts all # capture saved styles
pnpm lab:promote help # inspect promotion options; only Yankun invokes a style promotion
pnpm tokens           # rebuild tokens after editing packages/tokens/src
pnpm palette          # regenerate palettes after editing packages/tokens/palette.config.ts
pnpm test             # token, engine, lab and component browser tests
pnpm typecheck
pnpm format
pnpm changeset        # describe any change to a published package
```

`pnpm dev` keeps the token build live: edits to token sources trigger a rebuild and refresh the exported JSON; edits to `palette.config.ts` or the engine palette generator regenerate palettes first.

Before you finish a change: `pnpm build && pnpm test && pnpm typecheck && pnpm format:check`.

## The one idea: structure is shared, finish is chosen

ZAO's current scope is **Su 素** (plain), in light and dark. Build one coherent design system and polish its craft first. **Yu 玉** (jade) is deferred as a possible phase 2, with no committed release or mode scope. Existing Yu token, engine, and lab assets remain deferred groundwork; their presence does not authorize Yu work or make it a current release requirement.

- **Structure** decides size and layout: the fen unit, spacing, control heights, the text face and every type role's size and line height. It lives in `packages/tokens/src/base/` and is identical in every finish.
- **Finish** decides look: palettes, radius, material (glass or opaque), motion character and the display face. It lives in `packages/tokens/src/themes/`.
- **Mode** maps semantic colors to palette steps. It lives in `packages/tokens/src/modes/`.

A test fails if any finish changes a structural token. Don't weaken that test to make a change pass; move the change to the right layer.

## Editing tokens

- Edit `packages/tokens/src`. Never edit `dist/` or `src/palettes/*.generated.tokens.json`.
- To change colors, edit `palette.config.ts` (hue, chroma, solid lightness, contrast) and run `pnpm palette`. Don't hand-pick hex values.
- Palette steps each have one job: 1–2 backgrounds, 3–5 component fills, 6–8 borders, 9–10 solid fills, 11 secondary text, 12 primary text. Modes map roles to steps by job.
- Every token needs a `$description` that says when to use it and any minimum it promises (for example "At least 4.5:1 on canvas and surface"). The contrast tests check those promises.
- Anything that would change the size of a component belongs in `base/`, never in a theme.

## Writing UI

Use only what `@zao/react/theme.css` defines. Tailwind's defaults are removed, so `bg-blue-500`, `text-sm` and `rounded-lg` don't compile.

| Need                   | Use                                                                                                                                                 | Never                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Color                  | `bg-canvas`, `bg-surface`, `bg-sunken`, `text-default`, `text-muted`, `border-subtle`, `bg-accent`, `text-on-accent`, `text-danger` …               | Hex, `rgb()`, `oklch()`, palette steps, arbitrary values like `bg-[#fff]` |
| Type                   | `type-display`, `type-title`, `type-heading`, `type-body`, `type-label`, `type-button`, `type-caption`, `type-code`                                 | Font sizes, raw weights, `text-[15px]`                                    |
| Emphasis inside a role | `font-medium`, `font-strong`                                                                                                                        | `font-bold`, numeric weights                                              |
| Spacing                | Fen steps: `0`, `0.5`, `1`, `1.5`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`, `20` (`p-3` = 12px)                                              | Off-scale steps like `p-7`, arbitrary values like `p-[13px]`              |
| Control height         | `h-7` (small), `h-8` (default), `h-10` (large); Button's approved default uses `h-button` (34px)                                                    | Raw control heights                                                       |
| Radius                 | `rounded-control` (inputs), `rounded-action` (other action controls), `rounded-none` (Button), `rounded-surface`, `rounded-overlay`, `rounded-pill` | Tailwind radius sizes                                                     |
| Floating layers        | `material-overlay` on menus, popovers, dialogs, toasts                                                                                              | Glass or blur on content surfaces, or `backdrop-blur` directly            |
| Control labels         | `trim-label`; Button uses the untrimmed `type-button` line box and reference padding                                                                | Padding hacks to center text                                              |
| Numbers and IDs        | `figures-tabular` for numbers that line up or change, `figures-id` for IDs and codes                                                                | —                                                                         |

More rules:

- The display face appears only through `type-display` and `type-title`: page titles, empty states, marketing. Never in buttons, inputs, tables or labels.
- Keep the focus outline. If a component styles focus, use `outline-focus` or `ring-focus`.
- Pointer targets are at least 24px.
- Respect `prefers-reduced-motion` and reduced transparency (`material-overlay` already does).
- Apply a finish with data attributes: `data-zao-theme="su"` and optionally `data-zao-mode="light|dark"`. Any element can be an island.

## Writing copy

Sentence case. Active voice. A button says what happens ("Approve 3 changes", not "Submit"), and the result uses the same verb ("Approved 3 changes"). Errors say what went wrong and how to fix it, without apologizing.

## Releasing

Any change to `@zao/tokens` or `@zao/react` needs a changeset (`pnpm changeset`). The docs app is never published.
