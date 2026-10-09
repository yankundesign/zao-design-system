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

**Requested data visualization section and ring refinement, Oct 9:** Follow [the data visualization plan](docs/plans/2026-10-data-visualization/README.md) and [the revised guideline](docs/data-visualization.md). A new Charts nav section after Components holds an overview and Ring, Bar, Line, Heatmap, and Histogram pages; the guideline stays at Foundations → Data visualization. Every chart applies five rules: one stroke per datum; solid structure with dashed, labeled references; four slots (series and scale, summary, readout and unit); one accent square in `accent-solid`, which stays Su gray (DV2); and motion only from data, through a labeled, off-by-default simulation with discrete updates. The storage ring separates a fine scale ring from its 100 data marks, draws used marks long and available marks short with non-scaling hairlines, and adds the frame slots while keeping the 68% reading, region controls, readout strings, and passive Card. The charts are docs-local in `apps/docs/components/charts/`. The heatmap ramp mixes default ink into the canvas pending DV3; stroke weights reuse the hairline and the ring's 1.5px pending DV4; publishing a chart package is gated by DV5. No tokens, dependencies, or published props change.

**Approved Tabs, Oct 7:** Primary views use the refined ruler rail: one fine guide and a slightly stronger selection line share their centerline, with fine graduations, centered registration ticks, and small end stops. Hover or keyboard focus extends the target tick without moving selection; press compresses the selected line around the same centerline. Secondary views use a square recessed track with one sliding face, a contact edge, and press seating, with no repeated underline. Labels, native targets, focus outlines, and layout stay stationary. Preserve Base UI selection, horizontal and vertical keyboard navigation, disabled behavior, nested state, scrolling, and reduced motion. Reuse semantic colors and existing finish durations; this approval is specific to Tabs and introduces no token changes.

**Approved vertical Tabs B (Oct 9, WP 2.4):** Vertical primary labels share the edge toward the rail: right in LTR and left in RTL. Yankun selected B: draw one minor graduation at each actual gap midpoint between adjacent native tabs, giving `n − 1` marks for `n` tabs. Each mark reuses the existing 2px length (`--zao-space-0-5`), 1px structural stroke (`--zao-stroke-hairline`), outward offset, `border-subtle` ink, and half opacity. Keep the guide, end stops, registration ticks, and selection line. Native targets, focus outlines, layout, and labels remain stationary during interaction; preserve the Oct 7 tick extension, selection-line press compression, Base UI selection and navigation, scrolling, disabled states, nested state, and reduced motion. Horizontal and secondary drawings retain their existing treatment. The WP 2.4 graduation gate is resolved; this approval adds no tokens, values, public API, dependencies, or interactions.

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

**Construction tokens (Oct 8, WP 1.1):** Yankun selected the finish layer for `depth.contact`, `depth.lift`, and the unitless screen direction `depth.axis.x` / `depth.axis.y`. These tokens control painted offsets and transforms only; changing them on an island must not resize native targets, borders, content boxes, or neighboring layout. Components read `--zao-depth-*` directly. The independent structural `stroke.hairline` / `--zao-stroke-hairline` keeps the existing 1px drawing and borders intact at zero depth. Yu's matching depth entries are completeness entries only. This extraction preserves existing values and interactions; study promotion remains a separate decision.

**Approved side tone (Oct 8, WP 1.2, D3):** Yankun chose option A. The later Oct 8 Card refinement replaces the trial open ink outline with A's shaded contact edge and square corners. Filled sides read `construction-shading`, whose single formula lives in `theme.css`; each component supplies its current semantic face through `--zao-construction-face`. Button, Card, Switch, secondary Tabs, Menu, and the existing study field popups share it. Near-black faces retain the same shade rule and existing perimeter. Transparent quiet buttons have no side at rest; disabled and forced-color treatments retain their protections. Card uses one subtle semantic perimeter and one filled contact edge beneath a stationary square content plane; its passive behavior and action interactions remain intact. Other semantic rules and recessed strokes remain drawing marks. Preserve approved depth, native targets, focus outlines, motion, and component behavior.

**Approved Su promotion (Oct 8, WP 1.3, D4):** Yankun requested promotion of the study's radius values and fast motion first. Su publishes action radius 0px, control/surface/overlay radii 2px, and fast duration 80ms. Button reads `rounded-action`; its square Su face now comes from the finish token. These groups inherit published tokens in the docs and have no study custom-property overrides. Color and component-specific study treatments remain local material, pending their own decisions. Keep the base duration and easing at their existing values.

**Depth demonstration (WP 1.4):** Foundations → Depth scales contact and lift together on a docs-only island. Its reset restores the published values. It reuses existing component paint paths and publishes no depth attribute or API; a published control requires D5. At zero depth with normal motion, primary and secondary Button lose their spatial pointer-hover cue because their resting and hovered fills and borders are identical. Record that finding; any substitute hover treatment needs a separate interaction decision.

**Requested dark Button side refinement (Oct 8):** Dark secondary and filled quiet Buttons use the existing `border-subtle` semantic color for their joined side and fixed base, keeping the construction visible against near-black surface backing. This Button-specific refinement supersedes the shared shade on those dark faces; light mode, primary Buttons, and other components keep their existing side rule. Preserve geometry, motion, native targets, focus outlines, and disabled protections.

**Approved field edges (Oct 8, WP 2.1, D6):** Yankun chose A. TextField, Select, and Combobox share `border-field`, `border-field-invalid`, and `bg-field-disabled`. Their CSS roles are `--zao-color-border-field`, `--zao-color-border-field-invalid`, and `--zao-color-bg-field-disabled`; until remaining color promotion, the theme utilities fall back to the existing default border, danger border, and sunken fill. Quiet instrument supplies the approved local values: its resting and invalid edges meet at least 3:1 against canvas and surface, invalid is no weaker than normal at rest, and disabled fields differ beyond text. Preserve stationary native frames, existing enabled emphasis, outside keyboard outlines, and reduced motion. These local values do not change the published palette or promise that the inherited published border defaults meet the study's minimums.

**Dialog Button reuse (Oct 8, WP 2.2, step 1):** `Dialog.Trigger` and `Dialog.Close` render the shared Button through Base UI. Both accept Button's `size` and `variant`: small 28px, default 34px, large 40px. Trigger defaults to secondary, Close to quiet; use `variant="primary"` for a primary confirmation action. Preserve Button's construction and stationary native target and Base UI's focus, dismissal, and ref behavior. The frame, backdrop, and entry/exit follow the separate Oct 9 D7 approval below.

**Approved Dialog B (Oct 9, D7, WP 2.2 and WP 3.5):** Yankun selected B: reuse Card's square static `bg-surface` frame, `stroke.hairline` subtle semantic border, and shaded contact edge from the existing depth tokens. The frame and content stay stationary, with no blur or soft shadow. A veil of the semantic canvas at 80% opacity sets the page back; the existing reduced-transparency preference and opt-in use an opaque veil. The popup remains opaque. Entry and exit are instant, including reduced motion. Preserve Base UI's accessible title and description, immediate initial focus, focus trap, Escape and outside-press dismissal, focus return, and scroll locking. Retain the shared Button sizes and variants for trigger, close, and primary actions. This component approval adds no global tokens or interactions.

**Requested dark Card contact refinement (Oct 9):** Card uses the existing `border-subtle` semantic color for its contact edge in dark mode, matching the dark Button refinement and staying visible against near-black backing. Light mode retains the shared shade. Preserve Card's stationary square frame, existing depth, passive behavior, and explicit actions. This refinement is specific to Card; Dialog keeps its separately approved contact shade.

**Approved Menu items (Oct 9, D8, WP 2.3):** Yankun selected B: fill only for enabled hovered or highlighted Menu, Select, and Combobox items, using the existing semantic hover fill without an inset navigation mark. All three share square item corners through the existing `radius.none` / `rounded-none`; D8 is resolved. Keep native keyboard focus outlines on Menu and Select items. Combobox retains input focus and virtual option highlighting; do not add an item focus outline. Select and Combobox checkmarks still identify the committed value independently of navigation. Preserve readable disabled items without active emphasis, stationary targets, RTL, Base UI navigation and dismissal, steady fill through closing, reduced-motion paths, and a visible system-color highlight in forced colors. This approval reuses existing values and adds no tokens or public API.

A test fails if any finish changes a structural token. Don't weaken that test to make a change pass; move the change to the right layer.

## Editing tokens

- Edit `packages/tokens/src`. Never edit `dist/` or `src/palettes/*.generated.tokens.json`.
- To change colors, edit `palette.config.ts` (hue, chroma, solid lightness, contrast) and run `pnpm palette`. Don't hand-pick hex values.
- Palette steps each have one job: 1–2 backgrounds, 3–5 component fills, 6–8 borders, 9–10 solid fills, 11 secondary text, 12 primary text. Modes map roles to steps by job.
- Every token needs a `$description` that says when to use it and any minimum it promises (for example "At least 4.5:1 on canvas and surface"). The contrast tests check those promises.
- Anything that would change the size of a component belongs in `base/`, never in a theme.

## Writing UI

Use only what `@zao/react/theme.css` defines. Tailwind's defaults are removed, so `bg-blue-500`, `text-sm` and `rounded-lg` don't compile.

| Need                   | Use                                                                                                                                                                          | Never                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Color                  | `bg-canvas`, `bg-surface`, `bg-sunken`, `text-default`, `text-muted`, `border-subtle`, `bg-accent`, `text-on-accent`, `text-danger` …                                        | Hex, `rgb()`, `oklch()`, palette steps, arbitrary values like `bg-[#fff]` |
| Type                   | `type-display`, `type-title`, `type-heading`, `type-body`, `type-label`, `type-button`, `type-caption`, `type-code`                                                          | Font sizes, raw weights, `text-[15px]`                                    |
| Emphasis inside a role | `font-medium`, `font-strong`                                                                                                                                                 | `font-bold`, numeric weights                                              |
| Spacing                | Fen steps: `0`, `0.5`, `1`, `1.5`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`, `20` (`p-3` = 12px)                                                                       | Off-scale steps like `p-7`, arbitrary values like `p-[13px]`              |
| Control height         | `h-7` (small), `h-8` (default), `h-10` (large); Button's approved default uses `h-button` (34px)                                                                             | Raw control heights                                                       |
| Radius                 | `rounded-control` (inputs), `rounded-action` (Button and other action controls), `rounded-none` (approved square Card), `rounded-surface`, `rounded-overlay`, `rounded-pill` | Tailwind radius sizes                                                     |
| Floating layers        | `material-overlay` on menus, popovers, toasts; Dialog uses its approved square surface frame and page veil                                                                   | Glass or blur on content surfaces, or `backdrop-blur` directly            |
| Control labels         | `trim-label`; Button uses the untrimmed `type-button` line box and reference padding                                                                                         | Padding hacks to center text                                              |
| Numbers and IDs        | `figures-tabular` for numbers that line up or change, `figures-id` for IDs and codes                                                                                         | —                                                                         |

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
