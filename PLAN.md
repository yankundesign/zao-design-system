# ZAO: Phase 2 plan, tools for finding the style

_For coding agents working in `yankundesign/zao-design-system`. Written Sept 29, 2026. Owner and decision-maker: Yankun._

This replaces the earlier plan for phases 2–4. The order is now:

1. **Phase 1, study** (Yankun): what a design system is, what one for agents and generative UI is, and the stack. See `study/STUDY.md`. Agents aren't needed for it.
2. **Phase 2, tools** (this plan): tools that help Yankun find the style for Su and Yu.
3. **Components and the agent layer** come after both, and get a new plan then.

Phase 2 builds **no components** and **chooses no values**. It builds a local lab where Yankun collects references, mixes them, and builds examples until he lands on the style he wants.

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
