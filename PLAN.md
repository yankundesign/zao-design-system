# ZAO: Current scope and historical Lab plan

> **Direction update, Oct 6, 2026:** [Quiet construction](BRIEF.md#current-design-direction-quiet-construction) is the shared direction for ZAO's experiment at the boundary of 2D and 3D interfaces. Set the theme first. Yankun will define component interactions one by one; beyond the individual approvals below, gestures, hover behavior, depth ranges, motion values, and implementation choices remain open.

## Current work

**Scope update, Oct 7, 2026: Su first.** Build one coherent design system in Su light and dark and polish its visual form, interaction, and craft. Yu is outside the current build, docs previews, eval, and release scope. It may return in phase 2 after Su is established; no release date or mode scope is committed. Existing Yu token, engine, and lab assets remain deferred groundwork. Do not add Yu exploration or verification requirements to current component tasks.

- **Requested Progress refinement (Oct 7):** Apply the recommended product hierarchy and quiet construction, following the data visualization guideline. Use a fixed square recessed track, one accurate face, and a contact edge, with the label and reading outside. Distinguish unknown completion without a filled fraction or idle motion. Reuse finish motion for real updates; preserve immediate initial readings, reduced motion, Base UI semantics, clamping, formatting, and RTL. Check accurate endpoints, fractional and custom ranges, narrow layouts, and Su light and dark. No tokens, dependencies, or public props change.
- **Requested data visualization guideline and first ring study (Oct 7):** Write [the working guideline](docs/data-visualization.md) and extend the existing 68% Card ring with used/available inspection. The later Oct 7 refinement removes the Illustrative data section and its simulation and particle controls. Keep data geometry and Card stationary, reuse existing finish values, and verify pointer, keyboard, touch, reduced motion, and Su light and dark. The first implementation stays in docs; further chart studies and published library decisions follow evidence and Yankun's requests.
- Maintain the shared direction and reference reasoning in `BRIEF.md`, `AGENTS.md`, and the study notes.
- Apply the shared principle: **Care for every detail; keep the number of details small.** Review visual form, interaction, and craft together. Refine the existing details and explain the purpose of any proposed addition.
- Keep Quiet instrument as the existing Su preview. The docs header offers System, Light, and Dark for Su; Yu is absent from current previews. Preserve current CSS, component behavior, and token values until a specific change is requested.
- **First requested implementation, Button (Oct 6):** Match the [supplied Figma reference](https://www.figma.com/design/N2yXQBswbFVDiCh6WRCUTz/ZAO?node-id=1-2332), retaining ZAO colors. The square face uses 14px Geist at weight 500 with an 18px line box, a 34px default height, and 16px horizontal / 8px vertical padding. The approved refinement connects face, side, and base with a contact edge at rest. Hover keeps the 2px upward-and-right lift and connected side edge, without a stronger hover border or blur. Press seats the face onto its base along the same axis; release returns to hover or rest. Keep the native hit area and neighboring layout stable, retain the outside keyboard focus outline, and reuse the existing finish duration. Check pointer, keyboard, and touch activation, disabled state, reduced motion, and the real Quiet instrument CSS. Other component interactions remain pending.
- **Button simplification (Oct 7):** Replace the three visible offset shadow copies with one face, one continuous joined side, and one fixed base. Preserve approved geometry, the 2px upward-and-right lift, same press axis, and finish duration. Keep the native hit area, focus outline, and neighboring layout stationary, with variants, disabled behavior, and reduced-motion feedback intact.
- Follow Yankun's individual component definitions as they arrive. The shared theme is not an instruction to invent interactions, build a global motion system, or start the earlier proposed component experiments.
- For a requested study, compare alternatives in context and record both visual character and evidence about understanding and control. Usability benefits remain hypotheses until tested.
- Keep structural proportions, component anatomy, interaction meaning, and accessibility consistent across Su light and dark. Preserve the structure/finish/mode separation for future work.
- Yankun chooses visual values and published finish promotion, as before.

**Approved Tabs, Oct 7:** Primary views use the refined ruler rail: one fine guide and a slightly stronger selection line share their centerline, with fine graduations, centered registration ticks, and small end stops. Hover or keyboard focus extends the target tick without moving selection; press compresses the selected line around the same centerline. Secondary views use a square recessed track with one sliding face, a contact edge, and press seating, with no repeated underline. Labels, native targets, focus outlines, and layout stay stationary. Preserve Base UI selection, horizontal and vertical keyboard navigation, disabled behavior, nested state, scrolling, and reduced motion. Reuse semantic colors and existing finish durations; this approval is specific to Tabs and introduces no token changes.

The current scope above takes precedence over the historical planning record below. The release outline remains in `BRIEF.md`. The older work packages are reference material for explicitly requested tool work, not an automatic queue.

**Second requested component, IconButton (Oct 6):** Use Iconoir and Primer's IconButton guidance for accessible labels and tooltips. Reuse the current Button's construction and interaction at the shared square sizes. Keep the native hit area and focus outline stationary, preserve disabled and reduced-motion behavior, and check pointer, keyboard, touch, and finish inheritance.

**Requested Card refinement (Oct 6):** Give Card a static, grounded frame and contact edge in semantic colors around one content plane. Lead with the title, allow an optional recessed data region, and place explicit Button actions in a bottom row. Keep the core Card passive, without hover motion, using existing fen proportions and type roles. Consolidate the storage specimen into one accurate, fully visible 68% chart. Check reading order, chart visibility, and action focus in light and dark modes and narrow layouts. Other component interactions remain pending Yankun's definition.

**Requested Menu implementation and Pocket reveal (Oct 6):** Reuse a secondary Button trigger at the shared 28px, 34px, and 40px sizes, with a clear open state. Anchor one floating frame with a fine semantic border and crisp contact edge. A decorative moving front lip starts at the trigger-adjacent joint, travels with the clipped reveal to become the far frame edge when open, and withdraws on close, following actual collision placement. Keep the full-size popup, labels, and selection targets stationary, without row stagger; retain current row emphasis through closing. Reuse existing `duration-base` for opening and the finish's faster `duration-fast` for closing; reduced motion shows the completed frame immediately. Retain approved semantic row emphasis, meaningful separators, readable disabled items, and Base UI keyboard navigation, dismissal, focus behavior, and collision flip/shift. Su uses `material-overlay` for floating material in light and dark. Further Menu row interactions and other component interactions remain open.

**Requested Table implementation and monochrome refinement (Oct 6):** Build one square grounded frame around an open, stationary canvas from the Table proposal and Hairline reference review. Refine the column hierarchy with a flexible primary column, compact supporting columns, monospace IDs, aligned tabular numbers, matching header roles, and reserved sort-indicator space. Use plain foreground statuses, neutral checkbox and row selection, fine horizontal rules, and shared fen padding. The docs specimen keeps secondary Button and current Menu actions in a compact toolbar, with a concise selected count and detailed live announcements. Preserve native table parts and a named horizontal scroll region. Reuse existing tokens and finish inheritance; keep row geometry stable. Record the requested refinement in the study notes and check native semantics, keyboard use, selection through sorting, narrow overflow, reduced motion, and Su light and dark. The refinement remains under review; other component interactions and finish promotion remain separate decisions.

**Approved Switch, Oct 7:** Use one square stationary housing, a recessed channel, and one connected sliding face. Position and semantic fill identify off and on. Hover changes face emphasis without moving it; press seats the face, and activation travels directly to the opposite endpoint without overshoot. Rapid toggling reverses from the current position. Use a 40px by 24px housing with a 16px square face. Keep the native target, outside focus outline, and neighboring layout fixed during interaction. Associate a clickable visible setting label whose wording stays stable. Base UI owns activation, controlled and uncontrolled state, and form behavior. Preserve disabled and read-only states, keyboard, touch cancellation, and RTL. Reduced motion shows the destination immediately and retains press feedback through fill. Reuse semantic colors and existing finish durations in Su light and dark; this approval is specific to Switch and adds no tokens or public API.

## Historical Phase 2 Lab plan

This earlier “Phase 2” describes Lab tooling, not the possible future Yu phase. It is retained as a historical record; the Oct 7 Su-first scope above supersedes its two-finish work and verification requirements.

> **Direction update, Oct 4, 2026:** Yankun chose to build Button, TextField, and Card first, then use supplied references to make `style.css` and `design.md` studies. Each component has its own docs page. Quiet instrument is the current Su direction shown beside the ZAO baseline in the style menu; Yu remains baseline while its style is explored later. The Phase 2 work packages below remain a record of the earlier Lab plan. Yankun still chooses published finish values.

_For coding agents working in `yankundesign/zao-design-system`. Written Sept 29, 2026. Owner and decision-maker: Yankun._

The Sept 29 plan replaced the earlier plan for phases 2–4 with this sequence. The Oct 4 and Oct 6 direction updates above supersede its order:

1. **Phase 1, study** (Yankun): what a design system is, what one for agents and generative UI is, and the stack. See `study/STUDY.md`. Agents aren't needed for it.
2. **Phase 2, tools** (this plan): tools that help Yankun find the style for Su and Yu.
3. **Components and the agent layer** come after both, and get a new plan then.

The original Phase 2 scope built **no components** and **chose no values**. It described a local lab where Yankun collects references, mixes them, and builds examples until he lands on the style he wants. This remains the historical scope of the work packages below.

---

## Read this first

### Context

1. `BRIEF.md`: goals, thesis, scope and the decision log.
2. `AGENTS.md`: the repo map, commands, and the rules for tokens and UI.
3. `docs/research/typography.md`: why the typefaces are what they are.

### The rule that overrides everything: visual decisions belong to Yankun

Never pick a visual value on your own: colors, hues, lightness, weights, sizes, tracking, radii, shadows, blur, motion, or how anything looks in either finish.

In this phase that also means:

- **No presets.** Don't ship "nice" starting styles, curated palettes or themed demos. The only starting points are the current Su and Yu, which are pure gray. The exception is when Yankun asks you to reproduce one of his references.
- **Tools make options; Yankun chooses.** A variation generator that makes 12 options at his request is fine. Saving one of them as "the" style is not.
- **Label what you make.** Any style an agent creates gets `"author": "agent:<name>"` and shows an "agent-made" badge in the lab.
- **Nothing reaches the token files without him.** Promoting a style into a finish (WP 2.8) is a ⛔ decision gate.

Technical choices (file layout, internal APIs, libraries for private packages) are yours. Explain them in the PR. Ask before adding a runtime dependency to a published package (`@zao/tokens`, `@zao/react`).

### What Phase 2 doesn't do

- No components in `@zao/react`, no agent layer, no MCP server, no evals.
- No change to the published output of `@zao/tokens` or `@zao/react`. The generator refactor in WP 2.2 must produce byte-identical files.
- No changes to the docs site, except the live token rebuild in WP 2.1.
- Nothing is deployed. The lab runs only on Yankun's machine.

### Definition of done for every PR

- `pnpm build && pnpm test && pnpm typecheck && pnpm format:check` pass, and `pnpm --filter @zao/docs build` and `pnpm --filter @zao/lab build` succeed.
- Screenshots or a short screen recording of the lab changes in the PR.
- Tests for anything in `@zao/engine` (the style engine).
- No changeset needed, because `@zao/engine` and `@zao/lab` are private. If a PR changes published output, stop and ask.
- `AGENTS.md` updated when commands or rules change.
- No weakened tests. Signed commits on a branch, merged by PR, never pushed straight to `main`.

### Known gotcha

Until WP 2.1 lands, `pnpm dev` builds tokens only once. After changing `packages/tokens`, restart it or the docs show stale values.

---

## How the tools should work

Yankun's loop will look like this: **collect** references → **seed** a style from one → **tweak** it → **compare** it with others → **mix** the best parts → **snapshot** and **note** why → repeat → **promote** the winner into a finish.

He doesn't know yet which parameters will matter. So flexibility is the main requirement. These principles are how we get it.

1. **A style is data.** A style is a JSON file. The lab renders any style by turning it into CSS variables on an island. Making a new style never needs new code.
2. **Styles store only what differs.** A style `extends` another style (or the current Su or Yu) and lists only the parameters it changes. Forking is cheap, and a diff shows exactly what makes one style different from another.
3. **One registry drives everything.** Every parameter is defined once, with its type, range, unit, layer and the CSS variables it sets. Controls, diffs, mixing, interpolation, variations, validation and promotion are all generated from it. Adding a parameter is one registry entry.
4. **Sketch first, systematize later.** Every style has an `extraCss` field, scoped to its island, for ideas the registry can't express yet (a canvas texture, a gradient, a border treatment). When Yankun uses the same kind of extra CSS in two styles, propose turning it into a parameter.
5. **Explore freely, promote carefully.** In the lab a style can change anything, including structure such as spacing or type size, because a vibe often lives there. Promotion respects the layers: structural and mode changes apply to both finishes and need explicit confirmation.
6. **The lab never lies.** The current Su and Yu rendered by the engine must match the real build exactly. A parity test enforces it, so what Yankun sees in the lab is what ships.
7. **Everything works from the command line too.** Every lab action has a CLI equivalent, so Yankun can ask another agent to "make six variations of style X and snapshot them on the settings form".
8. **Private by default.** The repo is public. Screenshots of other people's products and font files stay out of git.

### Layout

```text
packages/engine/          @zao/engine (private). The style engine, shared by the lab, the CLI and the token scripts.
  src/registry/           Parameter definitions, one file per group.
  src/palette.ts          The palette generator, moved from packages/tokens/scripts.
  src/contrast.ts         The contrast promises, shared with packages/tokens tests.
  src/style.ts            Load, validate, resolve (extends), diff, mix, interpolate, vary.
  src/css.ts              Style + context → CSS variables.
  src/promote.ts          Style → token source files.
  schema/style.schema.json

apps/lab/                 @zao/lab (private, never deployed). Next.js, localhost:3001.
  specimens/              Example screens, one file each.
  specimens/local/        Gitignored. Specimens that recreate someone else's product.

explorations/             Yankun's working material.
  styles/                 *.style.json. Committed.
  references/index.json   URLs, tags, notes, extracted colors. Committed.
  references/files/       Reference images. Gitignored.
  snapshots/              PNGs and contact sheets of his styles. Committed.
  journal/                One markdown file per session or decision. Committed.
  fonts/                  Fonts to try. Gitignored.
```

What gets committed from `explorations/` is ⛔ Yankun's call. The list above is the proposed default. Write it in `explorations/README.md` and `.gitignore`.

### A style file

```json
{
  "$schema": "../../packages/engine/schema/style.schema.json",
  "id": "quiet-ink-03",
  "name": "Quiet ink 03",
  "extends": "su",
  "author": "yankun",
  "modes": ["light", "dark"],
  "tags": ["quiet", "technical"],
  "references": ["ref-0012", "ref-0019"],
  "notes": "Warmer grays than 02. Buttons felt too round.",
  "params": {
    "color.neutral.hue": 60,
    "color.neutral.chroma": 0.008,
    "radius.action": 8
  },
  "extraCss": ""
}
```

The values above only show the format. They aren't suggestions.

---

## Step A: the minimum loop

Build these four first, in order. Then stop at the checkpoint.

### WP 2.1: Rebuild tokens live in `pnpm dev`

**Goal:** editing a token file or `palette.config.ts` updates the running docs site (and later the lab) within a few seconds, without a restart.

**Build:**

- In `@zao/tokens`, add a `dev` script: `tz build --watch`, plus a watcher that re-runs `scripts/export-json.ts` after each build.
- Also watch `palette.config.ts` and the generator, and regenerate palettes before rebuilding.
- Change the root `dev` script to run the watcher and `next dev` in parallel after one full build.
- Update the commands in `README.md` and `AGENTS.md`.

**Acceptance:** with `pnpm dev` running, changing `accent.chroma` in `palette.config.ts`, or a radius in `themes/su.tokens.json`, shows on the docs after a browser refresh. The published build output is unchanged.

### WP 2.2: The style engine (`packages/engine`)

**Goal:** one library that knows every parameter, can turn any style into CSS, and is the single source of truth for palettes and contrast checks.

**Build:**

1. **Move the palette generator** from `packages/tokens/scripts/generate-palettes.ts` into `src/palette.ts`. The script becomes a thin wrapper. Add a test that the generated files are byte-identical before and after.
2. **Extend the generator**, with every new option defaulting to today's behavior:
   - per-ramp lightness and chroma curves, overriding the shared ones;
   - hue drift: how many degrees the hue shifts from step 1 to step 12;
   - pinned steps: set any step to an exact color, for example one sampled from a reference, with a warning when a pin breaks the step's job or a contrast promise;
   - anchor input: define a ramp by one color (hex or OKLCH) instead of hue and chroma;
   - extra ramps beyond the five, usable in the lab. Promoting one needs new semantic roles, which is a decision.
3. **Move the contrast promises** (text 7:1, muted 4.5:1, focus 3:1 and the rest in `tokens.test.ts`) into `src/contrast.ts`. The token tests import them, so the lab and the tests can't disagree.
4. **Parameter registry.** Cover every placeholder in the table at the end of this plan. Each entry has an id, group, label, kind (number, hue, chroma, lightness, color, curve, step, font, easing, duration, enum), range and unit, layer (`finish`, `mode` or `structure`), whether it's per mode, the CSS variables it sets, and the token path it promotes to.
5. **Style functions:** load and validate against the JSON schema; resolve `extends` chains; `diff(a, b)`; `mix(base, { group: sourceStyle })`; `interpolate(a, b, t)` (colors in OKLCH along the shorter hue path, curves per step, fonts and enums switch at 0.5); `vary(style, { params, spread, count, seed })`, deterministic for a given seed; `sweep(style, param, values)`.
6. **CSS output:** `toCssVars(style, context)` returns the complete set of `--zao-*` variables for that context, not only the changed ones. A variable that references another is resolved where it's declared, so partial overrides can silently fail to apply.
7. **Baselines:** `su` and `yu` are virtual, read-only styles computed from the current token build, never copied into files. They always match the repo. Avoid a dependency cycle: `@zao/tokens` uses the engine at build time, so the engine must not depend on `@zao/tokens`. The lab and the CLI load the token build and pass it in.
8. **JSON schema** for style files, generated from the registry, so editors and agents can validate them.

**Acceptance:**

- **Parity test** (in `apps/lab`, which depends on both packages): for su-light, su-dark and yu-dark, `toCssVars(baseline)` equals the variables in `@zao/tokens/css`, value for value.
- Round trip: `extends: "su"` with empty `params` renders identically to the baseline.
- `vary` with the same seed returns the same styles. `mix` and `interpolate` are covered by tests.
- Adding a test parameter to the registry produces a control, a schema entry and CSS output with no other code changes. Show this in the PR.

### WP 2.3: The lab shell and specimens (`apps/lab`)

**Goal:** a local app that renders any style on realistic screens, in every context.

**Build:**

- Next.js app on `localhost:3001`, started with `pnpm lab`, which also runs the WP 2.1 token watcher. It uses `@zao/react/theme.css`, so specimens are built only from ZAO's utilities.
- **Dev-only API routes** that read and write `explorations/`. They refuse to run outside development.
- **Islands:** each specimen renders inside an element with `data-zao-theme`, `data-zao-mode` and the style's CSS variables. `extraCss` is scoped to that island, for example with `@scope` or a prefixed selector.
- **The lab's own UI never changes with the style under test.** Panels and controls render with a frozen copy of today's gray Su variables, so the tool doesn't shift while Yankun explores. The lab's look isn't a ZAO decision.
- **Specimen contract:** each file in `specimens/` exports `meta` (id, title, tags, description) and a component. The lab lists them automatically, through a generated index or a plain array.
- **Specimen rules:** plain HTML elements and ZAO utilities only (no components yet), invented content with no real brands, and copy that follows `AGENTS.md`. Specimens must respond to every parameter, so no hardcoded values.
- **Starter specimens** (⛔ Yankun approves or edits this list before you build them):
  1. Type: every role, in Latin and Chinese, with numbers and IDs.
  2. Color: every ramp and every semantic role in use.
  3. Settings form: labels, inputs, a select, checkboxes, helper and error text, buttons.
  4. Data table: dense rows, IDs, numbers, statuses, hover and selected rows.
  5. Agent approval: an agent proposes three changes; approve or reject, with details and tool-call status.
  6. Chat with a generated card: messages, an inline card, a code block, streaming text.
  7. Overlays: a dialog and a menu over busy content, to test glass.
  8. Empty and error states, where the display face appears.
  9. Dashboard: metric cards and a simple chart using only neutral, accent and status colors.
  10. Hero: display type at large size.
- **Views:** one specimen in one context; one specimen in all three contexts; all specimens for one style.

**Acceptance:** every starter specimen renders in su-light, su-dark and yu-dark with the baselines. Switching style or context doesn't reload the page. Yankun can add a specimen by dropping in one file.

### WP 2.4: The style editor

**Goal:** tweak any parameter of any style and see the result live, on any specimen.

**Build:**

- **Controls generated from the registry**, grouped (color, type, shape, space and density, depth and material, motion), with search. Sliders plus exact number input; color inputs accept hex, `oklch()` and a pick from any reference image (once WP 2.5 exists).
- **Palette panel:** the 12-step ramps for light and dark for every ramp, curve editors, pins, hue drift and anchor color.
- **Live contrast panel**, using `src/contrast.ts`, with each promise passing or failing as values change.
- **Structure warnings:** a structure or mode parameter shows a badge saying it affects both finishes when promoted.
- **Fork, rename, save, delete.** Autosave drafts. Undo and redo for the session.
- **Diff to parent:** only the changed parameters, with a reset per parameter.
- **Extra CSS editor**, scoped to the island, with a note to make it a parameter if it keeps coming back.
- **Fonts:** a font slot can use any family in `@zao/react` or a file in `explorations/fonts/`. Whether to explore typefaces beyond Geist, Newsreader and Geist Mono is ⛔ Yankun's call; the lab should support it either way.

**Acceptance:** every registry parameter is editable. A saved style reloads identically. The contrast panel agrees with `pnpm test` for the same values.

### ⏸ Use checkpoint

Stop here. Yankun uses the lab with his own references for a while. Before starting Step B, ask him what he missed, what he never used, and what got in the way, and rewrite the Step B work packages to match. Expect them to change.

---

## Step B: collect, compare, mix, record, promote

Draft scope, to be revised at the checkpoint. Suggested order: 2.5 and 2.6 in parallel, then 2.7, then 2.8.

### Checkpoint update, Oct 1

Yankun asked to continue Step B. Usage feedback has been requested and remains open; use the work packages below as the working scope and revise them when that feedback arrives. Build the tools without choosing visual values. Implement the promotion command, but keep the separate gate on running it for a saved style.

### WP 2.5: Reference board

**Goal:** a place to collect what Yankun is drawn to, and turn a reference into a starting point.

**Build:**

- **Add references** by dropping or pasting an image, or from a URL (stored as a link, with an optional local screenshot). Images go in `explorations/references/files/`, which is gitignored.
- **Describe them:** free tags (vibe words), notes, and "what I like / what I don't". Group references into boards, such as "Su candidates" and "Yu candidates".
- **Teardown fields** matching the template in `study/STUDY.md`: neutral temperature, contrast, accent use, density, radius family, type contrast, depth, motion.
- **Color extraction:** cluster the image's pixels in OKLab and show swatches with their share of area, separating near-neutrals from colors. Show the neutrals' average hue and chroma, and the lightness spread. Add an eyedropper for exact pixels.
- **Seed a style:** Yankun picks the neutral and accent swatches, plus the mode and palette step each swatch should represent. The lab creates a draft linked to the reference and pins those exact jobs. He decides; the tool doesn't guess.
- **Links both ways:** a style lists its references; a reference lists the styles it inspired.

**Acceptance:** add, tag, filter and delete references; extract swatches from a PNG and a JPG; seed a style whose neutral and accent match the chosen swatches within gamut limits; no reference images end up in git.

### WP 2.6: Compare, mix, sweep and variations

**Goal:** see styles against each other and make new ones from parts of old ones.

**Build:**

- **Compare:** up to four styles side by side on the same specimen and context, with synchronized scrolling and a diff table of the parameters that differ. Give each preview its own island identity so extra CSS cannot cross between styles; make native-finish baseline comparisons legible.
- **Mix:** choose a base style, then a source style for each group (for example color from A, type from B, shape from C). Save the result with its sources recorded.
- **Interpolate:** a slider between two styles. Save any point as a new style.
- **Sweep:** one parameter across N values as a strip of the same specimen, for example action radius or accent chroma.
- **Variations:** pick parameters or a group, a spread and a count, and get a grid of seeded variations. Yankun stars the ones worth keeping and saves them as styles. Variations are labeled "generated" until he saves them. Saved generated styles record their inputs and seed.

**Acceptance:** all five views work with any saved styles and any specimen; results are reproducible from their inputs; saved results record where they came from.

### WP 2.7: Snapshots and journal

**Goal:** a record of the search, as raw material for the case study.

**Build:**

- **Snapshots:** `pnpm lab:snap --styles a,b --specimens settings,table --contexts all` renders PNGs with Playwright, plus a contact sheet page, into `explorations/snapshots/<date>-<slug>/`. A button in the lab does the same. Captures of gitignored local specimens stay in a gitignored private snapshot subtree.
- **Journal:** write a note from the lab, attached to the current styles, specimen, context and an optional snapshot. Stored as markdown with frontmatter in `explorations/journal/`.
- **Timeline:** all journal entries in order, with thumbnails, filterable by style and tag.

**Acceptance:** the snapshot command works on Yankun's Mac after `pnpm exec playwright install chromium`, and on Linux; snapshot PNGs are compressed; journal entries render in the timeline.

### WP 2.8: Promote a style into a finish

**Goal:** when Yankun lands on a style, write it into the real token sources safely.

**Build:** `pnpm lab:promote <style> --finish su|yu [--groups color,shape,…] [--include-shared]`.

- **Finish-layer parameters** go into `palette.config.ts` and `themes/<finish>.tokens.json`.
- **Mode and structure parameters** (role → step mapping, shadows, spacing, type sizes) change `modes/` or `base/`, which affects both finishes. They're skipped unless `--include-shared` is passed, and the command prints what changes in the other finish.
- **Extra CSS is never promoted.** The command lists it as "make this a parameter first".
- Then it runs `pnpm palette`, `pnpm tokens` and `pnpm test`, prints the contrast report and `git diff --stat`, and drafts a decision-log row for `BRIEF.md`. It never commits.

**Acceptance:** promoting a baseline makes no changes; promoting a test style changes only the files and values it should; failing contrast promises stop the command with a clear message.

**⛔ Decision gate:** only Yankun runs this, or asks for it to be run with a specific style.

---

## Driving the lab from the command line

Final names are the implementer's choice. Document them in `AGENTS.md`.

| Command                                                          | Does                                                      |
| ---------------------------------------------------------------- | --------------------------------------------------------- |
| `pnpm lab`                                                       | Start the lab on `localhost:3001`, with the token watcher |
| `pnpm lab:style new <name> --from <style>`                       | Fork a style                                              |
| `pnpm lab:style vary <style> --params <glob> --count 6 --seed 1` | Make seeded variations                                    |
| `pnpm lab:style mix <base> --color a --type b`                   | Mix styles by group                                       |
| `pnpm lab:check`                                                 | Validate every style file against the schema              |
| `pnpm lab:snap …`                                                | Render snapshots (WP 2.7)                                 |
| `pnpm lab:promote …`                                             | Promote a style into a finish (WP 2.8, ⛔)                |

---

## What the lab must be able to vary

Every value in the repo is still a placeholder, except the typefaces and the finish names. The registry covers all of these from WP 2.2.

| Parameter group                  | Layer     | Lives in                                               | Current value                                                            |
| -------------------------------- | --------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| Neutral and accent colors        | finish    | `packages/tokens/palette.config.ts`                    | Hue 0, chroma 0 (pure gray) in both finishes                             |
| Accent solid lightness           | finish    | `palette.config.ts` (`solid`)                          | Su 0.52 / 0.54, Yu 0.50 / 0.82 (light / dark)                            |
| Status hues                      | finish    | `palette.config.ts` (`status`)                         | Success 150, warning 75, danger 27                                       |
| Contrast input                   | finish    | `palette.config.ts` (`contrast`)                       | 0.5                                                                      |
| Ramp lightness and chroma curves | finish    | the generator (`LIGHTNESS`, `CHROMA`)                  | Shared 12-step curves per mode                                           |
| Radii                            | finish    | `themes/*.tokens.json` (`radius.*`)                    | Su 6 / 6 / 8 / 10, Yu 10 / pill / 12 / 14                                |
| Glass material                   | finish    | `themes/yu.tokens.json` (`material.overlay.*`)         | Blur 18px, fill alpha 0.10, border 0.26, highlight 0.18                  |
| Motion                           | finish    | `themes/*.tokens.json` (`motion.*`)                    | Su 100 / 160ms, Yu 140 / 240ms, easing (0.2, 0, 0, 1)                    |
| Display face, weight, tracking   | finish    | `themes/yu.tokens.json` (`type.display`, `type.title`) | Newsreader 520, −0.5px / −0.24px                                         |
| Role → step mapping              | mode      | `modes/*.tokens.json`                                  | For example canvas is step 2 in light, 1 in dark                         |
| Shadows                          | mode      | `modes/*.tokens.json` (`color.shadow.*`)               | Gray, alpha 0.06 / 0.10 (light), 0.30 / 0.45 (dark)                      |
| Font weights                     | structure | `base/type.tokens.json` (`font.weight.*`)              | 400 / 530 / 630                                                          |
| Type scale and tracking          | structure | `base/type.tokens.json` (`type.*`)                     | Display 36, title 24, heading 16, body 14, label 13, caption 12, code 13 |
| Spacing unit and control heights | structure | `base/space.tokens.json`                               | 1 fen = 4px; controls 28 / 32 / 40                                       |

**New parameters from WP 2.2:** per-ramp curves, hue drift, pinned steps, anchor colors and extra ramps. **Likely candidates** once Yankun uses them through extra CSS: border width, focus ring width and offset, canvas backdrop (texture, gradient, bands), glass on more layers.

---

## Decisions waiting on Yankun

| #   | Decision                                                             | Needed by      |
| --- | -------------------------------------------------------------------- | -------------- |
| 1   | The starter specimen list                                            | WP 2.3         |
| 2   | What gets committed from `explorations/` (proposed default above)    | WP 2.3         |
| 3   | Whether to explore typefaces beyond Geist, Newsreader and Geist Mono | WP 2.4         |
| 4   | What Step B should become                                            | The checkpoint |
| 5   | The style of each finish: every row of the table above               | No deadline    |
| 6   | Yu palette direction (open in `BRIEF.md`)                            | With #5        |
| 7   | When to promote, and which style                                     | WP 2.8         |
