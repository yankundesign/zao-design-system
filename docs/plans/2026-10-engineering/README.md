# ZAO engineering plan: installable, explicit, checkable

_For coding agents working in `yankundesign/zao-design-system`. Written Oct 14, 2026, from a front-end and design-engineering review of `origin/main` at `ff32ac9`. Owner and decision-maker: Yankun._

**Status: proposed.** This plan is not in scope until Yankun adds it to "Current work" in `PLAN.md`. It replaces WP 5.2–5.6 of the [October improvement plan](../2026-10-improvement/05-agent-layer-and-proof.md). The WP 5.1 component specs in `docs/components/` are inputs here. Where this plan and `AGENTS.md` disagree, stop and ask.

No phase in this plan chooses a visual value.

---

## Part 1: the review

### The test

A design system is a product with two kinds of users: people and agents. What it ships is a contract: names (tokens, utilities, components, props, parts) with guaranteed behavior, in a form anyone can install, that can change without breaking the people using it. Seven questions follow from that:

1. **Source of truth.** Does each fact live in one place, with everything else generated from it?
2. **Installable.** Do `npm install` and the documented imports give the result the docs show?
3. **Explicit surface.** Is the public API small and named, with internals hidden?
4. **Consistent API.** Does the same prop mean the same thing on every component?
5. **Self-enforcing rules.** Do wrong things fail (types, build, lint), or do they rely on prose?
6. **Verification at the right level.** Are behavior contracts tested separately from pixels?
7. **Agent-usable.** Can an agent find the right part, use it, and check its own output? This is ZAO's thesis.

### Scorecard

| #   | Question             | Today                                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | -------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Source of truth      | Strong for tokens, weak for components    | Tokens: DTCG + Resolver + Terrazzo + generated palettes. Component knowledge lives in four places: TypeScript types, `packages/react/README.md`, hand-written props arrays in `apps/docs/components/component-detail.tsx`, and `docs/components/*.md`. The token-to-utility map is written twice (`theme.css` and `apps/docs/lib/tailwind-map.ts`).                                                                                           |
| 2   | Installable          | **Broken**                                | `theme.css` declares no `@source`. Tailwind's automatic source detection skips gitignored paths such as `node_modules`, so classes used inside an installed `@zao/react` (layout utilities and every `@utility` component style) are never generated. The docs only work because `apps/docs/app/globals.css` adds `@source '../../../packages/react/src'`. Never released: version `0.0.0`, 34 pending changesets.                            |
| 3   | Explicit surface     | Weak                                      | 52 `@utility` blocks in `theme.css`. Internals such as `button-construction`, `approval-gate-header` and `focus-brackets` compile as public Tailwind utilities. Four styling conventions coexist (below). `@layer base` sets `html` styles, a global `:focus-visible`, `::selection`, and a global `*` reduced-motion override with `!important` in the host app. 310 of the 681 custom properties `@zao/tokens` emits are raw palette steps. |
| 4   | Consistent API       | Mixed                                     | `className` lands on the button (Button), a wrapper (IconButton, Select, Combobox, Menu), the `<input>` (TextField) or the frame (Table). Select, Combobox, Menu and ApprovalGate take no `ref`; Button's ref is typed `HTMLElement`. Button and Card render a sibling status `<span>`. Menu's trigger is a string on a fixed secondary Button, so a row-actions icon menu is impossible.                                                     |
| 5   | Self-enforcing rules | Partial                                   | Removing Tailwind's defaults works: `bg-blue-500`, `text-sm`, `rounded-lg` and `shadow-md` don't compile. But `p-7`, `p-13`, `m-[13px]`, `bg-[#ff0000]` and `text-[15px]` all compile against the ZAO theme. There is no ESLint, stylelint or validator in the repo.                                                                                                                                                                          |
| 6   | Verification         | Strong for tokens, brittle for components | 92 token tests, including contrast promises and the structure-invariance test. Components: 16,206 lines of Playwright specs that drive docs pages and assert paint values. The Oct 11 finish broke 205 test cases; 21 known failures remain, so CI can't be green on `main`. Chromium only, one worker, no screenshot baselines, no component-level tests.                                                                                    |
| 7   | Agent-usable         | **Not built**                             | `packages/agent` and `evals` hold only a README. No manifest, validator, MCP server, `llms.txt` or consumer guidance. The specs exist but run to about 32,000 words (Button alone is 2,952), mostly decision history.                                                                                                                                                                                                                         |

The four styling conventions in `@zao/react`:

1. Tailwind utility strings in TSX (`button.tsx` size classes, field classes).
2. `@utility` component blocks in `theme.css` (`button-construction`, `zao-plan`, `approval-gate-*`).
3. Class-based CSS inside `@layer components` (`tabs.css`, `switch.css`, `progress.css`).
4. Unlayered CSS keyed by data attributes or `zao-` classes (`composer.css`, `conversation.css`). Unlayered rules beat every layer, so an app's utilities can't override them.

### Keep these

- **Tokens.** DTCG 2025.10 with the Resolver, Terrazzo, OKLCH generation from `palette.config.ts`, a typed `TokenId` union, per-context JSON with descriptions, contrast promises as tests, and a test that no finish changes a structural token. This is better than most production systems.
- **Base UI** for behavior; `'use client'` per file; ESM output with `.js` specifiers.
- **The parts contract.** `data-zao-component` and `data-zao-slot`, catalogued in `docs/parts.md` and checked against source.
- **Accessibility work.** Forced colors, reduced motion and transparency, live regions, RTL, and focus that survives the construction.
- **Closed variant unions** (`ButtonVariant`, `SelectSize`): fewer choices for agents.

### Five problems, in order of consequence

1. **Nobody outside the monorepo can use ZAO yet.** The missing `@source`, global base styles, unlayered CSS, and no release. Separately, npm reports that an organization named `zao` already exists (`registry.npmjs.org/-/org/zao/package` returns 200; a made-up org returns 404). Confirm it is Yankun's before anything is published as `@zao/*`.
2. **The thesis layer doesn't exist.** The agent layer slipped behind visual work twice: milestone 5, then improvement Phase 5. Plan and ApprovalGate shipped in the meantime.
3. **The public surface is accidental.** Internals are public utilities, there are four styling conventions, and raw palette steps are nearly half of the emitted variables.
4. **Rules live in prose, and the prose contradicts the build.** `AGENTS.md` is about 5,700 words, 34 of its paragraphs open with a dated approval or request, and `CLAUDE.md` loads it into every session. Line 147 says lift is 80ms on `cubic-bezier(0.2, 0, 0, 1)`; the token build ships `motion.duration.lift` at 157.5ms on a `linear()` 举折 curve. An agent that follows `AGENTS.md` gets it wrong.
5. **Tests guard pixels through the docs site, not contracts.** Each finish change means rewriting hundreds of numeric assertions, and the known failures keep CI red.

### MCP from first principles

An agent using a design system fails in three ways. In order of cost: it hand-rolls something the system already has, it picks the wrong part, and it gets a detail wrong. TypeScript already catches most detail errors. So an MCP server earns its place by **checking output** first, **choosing by need** second, and **recalling details** last. Most design-system MCP servers are built in the reverse order, starting with a props dump.

That leads to four rules for ZAO:

- **Data and checker first, transport last.** Manifest, then `zao check`, then generated `llms.txt` and agent guidance, then MCP. The server holds no knowledge of its own.
- **Version-matched.** Ship the manifest inside `@zao/react` and run the server locally (`npx @zao/mcp`), so it reads the version the project has installed. A hosted docs MCP answers for the latest version, not the installed one.
- **Few, task-shaped tools.** `find_component(need)`, `get_component(name)`, `get_tokens(intent)`, `check(code)`. Each answer is short and gives the rule, the reason and the fix.
- **No Storybook just for its MCP.** The docs site already does Storybook's job. Adding Storybook only to feed an MCP creates a second docs surface to keep in sync.

The same ordering applies to enforcement generally: agents iterate on errors, so a build or lint failure steers them more reliably than any guidance text.

---

## Part 2: the plan

### Target architecture

| Package / entry                      | What it is                                                                                     | Public      |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- | ----------- |
| `@zao/tokens` `./css` `./json/*` `.` | Unchanged                                                                                      | Yes         |
| `@zao/react` `.`                     | Components                                                                                     | Yes         |
| `@zao/react/theme.css`               | Tailwind v4 preset: public utilities only, plus `@source` for the package's own classes (G2-A) | Yes         |
| `@zao/react/base.css`                | Opt-in global base: `html`, selection, global focus                                            | Yes, opt-in |
| `@zao/react/fonts.css`               | Unchanged                                                                                      | Yes         |
| `@zao/react/manifest.json`           | Generated agent contract                                                                       | Yes         |
| `@zao/eslint-plugin` + `zao check`   | Validator: ESLint rules plus a CLI with JSON output                                            | Yes (G5)    |
| `@zao/mcp`                           | Local stdio MCP server over the manifest and `zao check`                                       | Yes (G5)    |
| `@zao/engine`                        | Private build-time generators: palette, contrast, motion                                       | Private     |
| `apps/docs`                          | zaoui.dev; also serves `llms.txt`                                                              | —           |
| `apps/lab`                           | Archived (G4)                                                                                  | —           |

How facts flow:

```text
token sources ─ Terrazzo ─▶ zao.css, json, TokenId
      │
      └─ utility table ─▶ theme.css @theme block, docs token map, manifest tokens

spec front matter ─┐
TS prop types ─────┼─▶ manifest.json ─▶ docs props tables, llms.txt, consumer AGENTS.md, MCP
parts in source ───┘
```

### Rules for every work package

1. **Visual decisions belong to Yankun.** Never choose a color, tone, distance, duration, curve, radius or drawing style. A new component's look goes through an option sheet, in the format from the improvement plan.
2. **Refactors change no pixels,** proven by the WP 0.2 baselines: `pnpm test:visual` passes with no updated baseline. If a baseline has to change, the WP isn't a refactor. Stop and ask.
3. **One WP per PR,** on a branch, merged by PR, never pushed to `main`. Keep the hand-written diff under about 800 lines (generated files, lockfiles and baseline images excluded); split anything larger.
4. **Ask before adding a runtime dependency** to a published package.
5. **Every generated file has a staleness test.**
6. **A rule is written once.** Link to it; don't copy it.
7. **Definition of done:** `pnpm build && pnpm test && pnpm typecheck && pnpm format:check && pnpm docs:build`; from WP 0.3, `pnpm test:consumer`; from WP 3.3, `pnpm check`. A changeset for any change to a published package.

### Decisions waiting on Yankun

| #   | Decision                                   | Options                                                                                                                                                                                                  | Lean                                                                                                         | Needed by |
| --- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------- |
| G1  | npm scope                                  | Confirm the `zao` npm org is yours, or pick another scope (for example `@zaoui`, matching zaoui.dev)                                                                                                     | Check now; a rename later touches every import                                                               | WP 1.5    |
| G2  | How component styles reach an app          | **A.** Tailwind-native: apps use Tailwind v4 and import `theme.css`, which declares `@source` for the package; internals become layered CSS. **B.** Precompiled `styles.css`; Tailwind optional for apps | A. It matches the BRIEF's Tailwind decision and the stacks agents already use. B if non-Tailwind apps matter | WP 1.1    |
| G3  | Global base styles                         | Move to an opt-in `base.css`, or keep them in `theme.css`                                                                                                                                                | Opt-in                                                                                                       | WP 1.3    |
| G4  | The lab                                    | Archive `apps/lab` and the engine's style, promote and registry code (tag, then remove), keeping the palette, contrast and motion generators; or keep it in CI                                           | Archive. It's unused, and its parity test makes every token change also update the lab registry              | WP 0.5    |
| G5  | Agent layer scope for v0.1 (was D15)       | Manifest, validator and guidance only; or those plus MCP                                                                                                                                                 | All four, MCP last                                                                                           | Phase 4   |
| G6  | Eval setup (was D16)                       | Tasks, agent and model, runs per condition                                                                                                                                                               | 5 tasks × 3 conditions × 3 runs, fixed before the first run                                                  | WP 6.1    |
| G7  | First missing primitives                   | Checkbox, RadioGroup or SegmentedControl, link-rendering Button, standalone Tooltip, Toast                                                                                                               | The first three; the docs already hand-roll them                                                             | WP 2.5    |
| G8  | Pause new components until Phases 0–2 land | Yes or no                                                                                                                                                                                                | Yes for new components; polish of existing ones can continue                                                 | Now       |
| G9  | Storybook in the BRIEF's stack             | Keep or drop                                                                                                                                                                                             | Drop, and record it in the decision log                                                                      | Phase 5   |

---

### Phase 0: safety net

Do this phase first. Later phases depend on its tests.

#### WP 0.1: Make CI honest (S)

- Mark the 21 known failing browser cases with `test.fail()` and a one-line reason. `test.fail` keeps them running and turns red when one starts passing, so nothing is hidden. List them in `apps/docs/e2e/KNOWN-FAILURES.md`.
- Remove the duplicate docs build: the docs `test` script runs `next build`, then CI runs `pnpm docs:build` again.
- Write the branch-protection settings for `main` (require CI and a PR) in the PR description. Yankun applies them on GitHub.

**Acceptance:** CI passes on a PR from current `main`; the number of `test.fail` calls equals the list.

#### WP 0.2: Screenshot baselines (M)

- Add a fixtures route to the docs (for example `/_fixtures/[component]`, not linked from the nav) that renders each exported component in each state that matters: rest, hover, press, focus-visible, disabled, loading, invalid, open.
- Add `toHaveScreenshot` for each component × state × context (su-light and su-dark; yu-dark as a smoke check). Load fonts, disable animations, fix the viewport.
- Add `pnpm test:visual` and `pnpm test:visual:update`. Commit the baselines. Generate them only in the Playwright Docker image so Mac and Linux font rendering don't disagree, and document `pnpm test:visual:docker` for local runs.

**Acceptance:** two consecutive runs pass, and every exported component has baselines. This is the proof for rule 2.

#### WP 0.3: Consumer smoke test, written to fail (M)

- Add `examples/consumer/`: a Vite + React + Tailwind v4 app that installs **packed tarballs** of `@zao/tokens` and `@zao/react` (`pnpm pack`), not workspace links.
- It renders every component exactly as `packages/react/README.md` says to set them up.
- A Playwright test checks computed styles that prove the component CSS arrived (for example, Button's root is `inline-flex`, its face height equals `--zao-size-control-md`, the Menu popup has planes), runs axe, and compares a screenshot with the WP 0.2 fixture.
- Add `pnpm test:consumer` to CI.

**Acceptance:** the test fails on today's code because the styles are missing. Record that failure in the PR. WP 1.1 makes it pass.

#### WP 0.4: `AGENTS.md` becomes rules (M) ⛔

- Rewrite `AGENTS.md` to 1,500 words or fewer (it is about 5,700 today): repo map, commands, the structure/finish/mode rule, token rules, the Writing UI table, copy, releasing, and a short "where decisions live" section that links to the specs' Decisions sections and the BRIEF decision log.
- Move each of the 34 dated "Approved…", "Requested…" and "Authorized…" paragraphs, word for word, to the matching spec's Decisions section or to the decision log. This is step 4 of improvement WP 5.1, which was never done.
- `AGENTS.md` names tokens and never states their values, so it can't drift from the build. Fix line 147 by removing the values.
- Do the same for `apps/docs/AGENTS.md`.
- Add a test: `AGENTS.md` is 1,500 words or fewer and contains no dates such as `Oct 9`.

**Gate:** Yankun reviews the new `AGENTS.md` before merge, because it changes how every agent behaves.

#### WP 0.5: Archive the lab (S), after G4

- Tag `lab-archive-2026-10`. Remove `apps/lab`, `scripts/lab-*.ts`, and the engine's `style.ts`, `promote.ts`, `registry/`, `baseline.ts`, `files.ts` and `schema/`, with their tests. Keep `palette.ts`, `contrast.ts` and `motion.ts`.
- Remove lab commands from `AGENTS.md`, `README.md` and `package.json`.
- List what the Quiet instrument study (`?style=quiet-instrument`, `/api/style-studies`) still overrides after the Oct 11 promotion. If nothing that ships, propose dropping the study axis from the browser tests, which currently doubles them (⛔ Yankun).

**Acceptance:** `pnpm build && pnpm test` pass, and the token `dist/` output is byte-identical before and after.

---

### Phase 1: make it installable

#### WP 1.1: Component styles reach the app (S for G2-A, L for G2-B)

- **G2-A:** add an `@source` in `theme.css` that points at the package's own component output, relative to that file (from `src/styles/` that is `../../dist`). Remove the hand-added `@source` lines for `packages/react/src` from the docs and lab `globals.css`, so the docs consume ZAO the way an app does.
- **G2-B:** add a Tailwind build step to `@zao/react` that compiles the component CSS and the classes used in `src/` into `dist/styles.css` inside a named layer, and document the layer order apps must declare.

**Acceptance:** WP 0.3 passes, the docs build without their own `@source`, and baselines are unchanged.

#### WP 1.2: Everything in a cascade layer (M)

- Put all component internals in Tailwind's `components` layer, so an app's utilities override them and they override base. Move `composer.css` and `conversation.css` into it.
- Moving `@utility` internals from the utilities layer to the components layer can change which rule wins against utilities in the same component. The baselines catch this; fix any diff before merging.

**Acceptance:** a test parses the published CSS and finds no rule outside a layer. In the consumer app, `className="p-2"` on Card and a padding override on `Conversation.Root` both win. Baselines are unchanged.

#### WP 1.3: Opt-in global base (S), after G3

- Move the `html` defaults, the global `:focus-visible` outline and `::selection` into `base.css`. The docs import it.
- Replace the global `*` reduced-motion rule (`theme.css`, near line 1620) with rules scoped to ZAO components and their parts. Today it stops every animation in the host app.

**Acceptance:** in the consumer app without `base.css`, the host's `html` font and one host animation are untouched under `reducedMotion: 'reduce'`, while ZAO components still respect reduced motion.

#### WP 1.4: Package hygiene (M)

- Rewrite `packages/react/README.md` as a consumer quick start: install, imports, finish and seal attributes, one short example per component, and a link to the docs. Remove the dated design history and the "components arrive in milestone 2" text; that history lives in the specs.
- Add `./base.css` to `exports` now and `./manifest.json` in Phase 4.
- Run `publint` and `@arethetypeswrong/cli` on both packages in CI.
- Use a pnpm `catalog:` for shared versions (react, `@base-ui/react`, tailwindcss, typescript, vitest). The docs pin `@base-ui/react` to `1.8.0` while `@zao/react` asks for `^1.8.0`.
- Extend `finish(theme, mode?)` to `finish(theme, mode?, seal?)`, and re-export the `Theme` and `Mode` types from `@zao/tokens` instead of declaring them twice.

**Acceptance:** `publint` and `attw` report nothing; the consumer test still passes.

#### WP 1.5: Release pipeline (M), ⛔ G1 before publishing

- Enter Changesets pre mode (`alpha`) and collapse the 34 pending changesets into a readable 0.1.0-alpha changelog, grouped by component.
- Add the `changesets/action` workflow, which opens a "Version packages" PR and publishes from CI with npm provenance.
- Publishing the first alpha is Yankun's action.

**Acceptance:** `npm publish --dry-run` for each package lists only the intended files; tarball sizes are recorded in the PR.

---

### Phase 2: an explicit, consistent API

#### WP 2.1: One styling convention, private internals (L, one PR per component group)

- **Public utilities** stay as `@utility` in `theme.css`: semantic colors, type roles, radius, spacing, control and icon sizes, `material-overlay`, `trim-label`, `figures-*`, motion. Write the list into the conventions doc (WP 2.2).
- **Component internals** move to one convention: `packages/react/src/styles/components/<component>.css`, inside `@layer components`, selected by `[data-zao-component]` and `[data-zao-slot]`, the parts contract that already exists. Shared construction pieces (planes, shading, well, brackets) go in `styles/construction.css` as `zao-`-prefixed classes.
- The docs' `ButtonLink` uses the planes on its own, so some construction pieces may deserve to be public. Propose that list in the PR (⛔ Yankun approves it).
- TSX keeps layout utilities only; a component's look never lives in a TSX class string.
- Add a small `cx()` helper to replace the repeated `[...].filter(Boolean).join(' ')`.

**Acceptance:** a compile test against `theme.css` shows that internal names (`button-construction`, `approval-gate-header`, `focus-brackets`, …) produce no CSS as utilities. Baselines are unchanged, and the parts test still passes.

#### WP 2.2: Component API conventions (M for the document, L for the refactor)

Write `docs/conventions/component-api.md` (150 lines or fewer), then refactor to it:

1. **`className`** always lands on the element with `data-zao-component`, and is for layout only. Today TextField sends it to the `<input>`, while Select and Combobox send it to the field wrapper.
2. **`ref`** points to the native interactive element (or the root, for non-interactive components), typed exactly (`HTMLButtonElement`, not `HTMLElement`). Every component takes one; Select, Combobox, Menu and ApprovalGate don't today. Use React 19's ref-as-prop and remove `forwardRef` (29 uses).
3. **One root element.** Replace the sibling status `<span>` in Button (`button.tsx:280`) and Card (`card.tsx:45`) with one shared live-region announcer.
4. **The field family** shares one internal `FieldFrame` built on Base UI `Field` (label, description, error and their ids). Select currently wires `aria-describedby` by hand.
5. **Config or compound:** arrays for closed sets of plain items (Select options, Menu actions); compound components when the content is arbitrary (Dialog, Table, Conversation, Message). Write the rule down.
6. **Icons:** one internal module for the chevron, check, remove and other glyphs now inlined per component.
7. **Motion timing in JavaScript** waits on the actual animation (`element.getAnimations()` or `transitionend`) instead of parsing CSS durations with `getComputedStyle` and `setTimeout` (`composer.tsx:84` and `:354`).

**Acceptance:** a test enumerates every export and asserts that it accepts `ref`, renders exactly one root, the root has `data-zao-component`, and `className` lands on that root. Baselines are unchanged. The changeset notes TextField's `className` change.

#### WP 2.3: Portals and the finish provider (M), tests first

Popups portal into a wrapper beside their trigger (`menu.tsx:67`, `select.tsx:122`, `combobox.tsx:155`, `icon-button.tsx:67`). That makes them inherit the island's finish, but probably also its `overflow` clipping and stacking context (Card sets `isolation: isolate`).

- Write these tests first:
  1. A Menu in a row of a horizontally scrolling Table opens fully visible.
  2. A Select in a Card, with a second Card below it, paints its popup above the second Card.
  3. A Menu inside `data-zao-theme="su" data-zao-mode="dark"` renders dark.
- If test 1 or 2 fails, add a `ZaoProvider` that owns a document-level portal root. Popups portal there and copy the nearest island's `data-zao-theme`, `data-zao-mode` and `data-zao-seal` onto their portal container. `finish()` stays for plain markup.

**Acceptance:** all three tests pass, and baselines are unchanged.

#### WP 2.4: Icon trigger for Menu (S) ⛔ API only

The most common product menu, "more actions" in a table row or card header, isn't possible today. Add `trigger={{ icon, label }}`, which renders IconButton. It reuses IconButton's approved look, so no visual decision is needed.

#### WP 2.5: Primitives the docs already hand-roll (L), ⛔ G7 and option sheets

- Evidence: native checkboxes in `apps/docs/components/table-specimen.tsx`; Tabs re-roled as radiogroups (`role="radiogroup"` on the list, `role="radio"` and `aria-checked` on each tab) in `finish-switcher.tsx` and `landing/hero.tsx`, which also reach into Tabs' internals with `[&>.tabs-viewport]:max-w-none`; a direct Base UI Select in `style-select.tsx`; and a docs-only `ButtonLink` built from Button's internal classes.
- Build Checkbox, RadioGroup (or SegmentedControl) and a link-rendering Button, each through an option sheet for its look. Then replace the docs' hand-rolled versions; that swap is the dogfooding check.
- Extract IconButton's tooltip into a public Tooltip.

---

### Phase 3: rules that enforce themselves

#### WP 3.1: Generate the theme mapping (M)

- Keep one table, beside the tokens: token ID, utility name, public or private (for example `color.fg.muted` → `text-muted`, public).
- Generate from it the `@theme inline` block in `theme.css`, `apps/docs/lib/tailwind-map.ts` (hand-written today), and the token section of the manifest.
- Mark palette tokens `"$extensions": { "dev.zao.visibility": "internal" }`. They must still be emitted, because semantic variables alias them, but they're left out of the manifest and the MCP.

**Acceptance:** renaming a utility is a one-line change, and a staleness test covers every generated output.

#### WP 3.2: Spacing steps that can't go off-scale (M, no pixel change)

- Replace Tailwind's `--spacing` multiplier with named steps for the fen scale (0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20), plus named sizes: `control-sm`, `control-md`, `control-lg`, `icon-sm`, `icon-md`, `target-min`. A scratch compile during the review confirmed that without the multiplier `p-7` and `h-7` stop compiling, while `p-3` and named sizes still work.
- ZAO's own components use off-scale `h-7`, `min-h-7`, `min-w-7` and `w-7` for the 28px small control, and `size-4` for icons. Replace them with the named sizes.

**Acceptance:** a compile test asserts that off-scale steps produce no CSS. Baselines are unchanged.

#### WP 3.3: `zao check` (L)

Start from the rule table in improvement WP 5.3 (raw color, off-scale spacing, raw type, raw depth, raw motion, raw material, display-face misuse, missing focus, hand-rolled control). Add four rules:

| Rule                    | Flags                                                                                                                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unknown class           | A class that compiles to nothing under the ZAO theme, such as `text-sm` or a typo. Today these fail silently: the agent gets no style and no error. Check by compiling each candidate against `theme.css` with Tailwind's `compile()`. |
| Arbitrary value         | Any `[...]` value. Tailwind can't switch these off, so lint must.                                                                                                                                                                      |
| Look on a ZAO component | Color, type, radius or depth utilities passed in `className` to a ZAO component.                                                                                                                                                       |
| Internal utility        | Any class not on the public list from WP 2.1.                                                                                                                                                                                          |

- Deliver the rules as an ESLint plugin (`@zao/eslint-plugin`), because agents and editors already run ESLint, and as a CLI, `zao check <paths> [--json]`, that runs the same rules plus checks on CSS files.
- Every message gives the rule, the reason, the fix and a link.
- Run it on `apps/docs` and `packages/react` in CI, with a short allowlist where each entry has a reason.

**Acceptance:** one passing and one failing fixture per rule, CI runs it, and it needs no network.

---

### Phase 4: one source for component knowledge

#### WP 4.1: Spec drift tests (S)

These are the guards that improvement WP 5.1 deferred. The test fails when an exported component has no spec; when a spec names a part, motion, token or prop that doesn't exist; or when a part in source is missing from its spec.

#### WP 4.2: Generate `manifest.json` (M)

- **Inputs:** spec front matter (intent, use-when, avoid-when, composes-with, parts, motions, tokens); prop types from TypeScript (the compiler API or `react-docgen-typescript`, as a dev dependency); and one example per component, added to each spec as a code block and type-checked by a test.
- **Output:** `packages/react/dist/manifest.json` with a JSON schema. Two levels per component: `summary` (about 300 tokens at most: intent, use and avoid, props with allowed values, one example) and `detail` (adds parts, states and accessibility notes). It never includes decision history.

**Acceptance:** removing a variant from a type removes it from the manifest with no other edit; the manifest validates; a size test enforces the summary budget.

#### WP 4.3: Generate everything else from the manifest (M)

- Replace the hand-written props arrays in `component-detail.tsx` with manifest data.
- Generate `apps/docs/public/llms.txt` and `llms-full.txt`.
- Generate consumer guidance shipped in `@zao/react`: an `AGENTS.md` (or an agent skill at `skills/zao/SKILL.md`) of 200 lines or fewer, covering imports, finish attributes, the Writing UI table, the component list with intent and avoid-when, and "run `zao check` before you finish".

**Acceptance:** every generated file has a staleness test.

---

### Phase 5: MCP server, ⛔ G5

#### WP 5.1: `@zao/mcp` (M)

- A stdio server on the official TypeScript MCP SDK, run with `npx @zao/mcp`. It resolves `@zao/react/manifest.json` from the project's `node_modules`. If none is installed it falls back to its bundled copy and says so in every answer.
- Tools:

| Tool             | Input                  | Returns                                                                                                   |
| ---------------- | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `find_component` | `need`, in plain words | One to three components ranked by intent and use-when, each with its avoid-when and the next tool to call |
| `get_component`  | `name`, `detail?`      | The manifest summary (or detail) and the example                                                          |
| `get_tokens`     | `intent?`, `group?`    | Semantic tokens with utility class and description; never palette steps                                   |
| `check`          | `code` or `paths`      | `zao check` results: rule, line, reason, fix                                                              |

- One resource, `zao://guide`, serves the consumer `AGENTS.md`.
- `find_component` ranks with keyword scoring over intent and use-when. No embeddings, no network.
- Tool descriptions say when to call each tool, for example "Call `check` before you finish."

**Acceptance:** an integration test with the SDK client calls every tool; every response stays under 1,500 tokens.

#### WP 5.2: Client setup (S)

Add setup snippets for Claude Code, Cursor and Codex to the docs and the package README.

---

### Phase 6: proof

#### WP 6.1: Eval v1 (L), ⛔ G6

Run improvement WP 5.5 as written, with condition C defined as the package plus the generated guidance and the MCP server. Report every run.

---

### Phase 7: test architecture

This phase can start once WP 0.2 lands and run in parallel with Phases 2–4.

#### WP 7.1: Split tests by what they protect (L)

- **Contract tests** cover keyboard, ARIA, focus order, form integration, layout stability, reduced motion and forced colors. They run against the WP 0.2 fixtures, not docs pages, with one spec file per component.
- **Paint** is covered by the screenshot baselines. Move numeric paint assertions (`side-tone`, `construction-values`, `button-elevation` and similar) to baselines when they only check the look. Keep geometry assertions that guard behavior, such as a stationary hit area or no layout shift.
- **Docs tests** cover docs features only: nav, landing, Anatomy, the Motion page.
- Run contract tests in Chromium, WebKit and Firefox, because the construction relies on `corner-shape` (Chromium only, with fallbacks), `light-dark()`, `@property` and `text-box`. Use parallel workers.

**Acceptance:** a change to a token value is absorbed by updating baselines with one command, with no spec edits. Record suite runtime before and after.

---

### Order and size

S fits one sitting, M is one real PR, and L should be split into several PRs.

| Step | Work packages                          | Why this order                                                             |
| ---- | -------------------------------------- | -------------------------------------------------------------------------- |
| 1    | 0.1, 0.2, 0.3, 0.4, 0.5                | Tests that prove later changes are safe, and a rules file agents can trust |
| 2    | 1.1–1.4                                | ZAO works outside the monorepo                                             |
| 3    | 2.1, 2.2, 2.3, 2.4, with 7.1 alongside | The surface is small and consistent before anything describes it           |
| 4    | 3.1–3.3                                | Wrong code fails                                                           |
| 5    | 4.1–4.3, then 1.5                      | One source of component knowledge; then the first alpha                    |
| 6    | 5.1, 5.2                               | MCP over finished data                                                     |
| 7    | 6.1                                    | Measure the thesis                                                         |
| Any  | 2.5                                    | Gated on G7 and option sheets                                              |

### Out of scope

- Visual direction, colors and motion values. Those are Yankun's.
- Yu beyond completeness entries.
- A shadcn-style registry. For primitives, an npm package keeps the constraints that copied source loses. Revisit for patterns and page blocks after the eval.
- Figma sync.

### How the review checked its findings

- **Tailwind:** compiled candidates against `theme.css` and the token build with Tailwind 4.3's `compile()`, one fresh compiler per candidate. A second compile, without the spacing multiplier, confirmed the WP 3.2 approach.
- **npm:** `registry.npmjs.org/-/org/zao/package` returned 200 with an empty package list; a made-up org name returned 404. No `@zao/*` package is public.
- **Counts:** `wc`, `grep` and `git` on `ff32ac9`. The failure counts come from `docs/plans/2026-10-finish/PROGRESS.md`.
