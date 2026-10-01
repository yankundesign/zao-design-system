# AGENTS.md

Guidance for coding agents working in the ZAO repo. Humans are welcome too.

ZAO is a design system built to be used well by agents. The same idea applies here: fewer choices, better defaults, and a reason for every rule. If a rule below blocks something you need, stop and ask instead of working around it.

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
| `PLAN.md`         | The current work plan: Phase 2, tools for finding the style. Read it before starting any work package.                              |
| `study/STUDY.md`  | Yankun's Phase 1 study plan. Not a task list for agents.                                                                            |
| `docs/research`   | Research behind decisions, such as typography.                                                                                      |

## Commands

```sh
pnpm install          # once
pnpm dev              # build packages, then run token watch and docs at http://localhost:3000
pnpm lab              # build packages, then run token watch and private lab at http://localhost:3001
pnpm lab:style help   # file-based style commands for agents and people
pnpm lab:reference help # reference board commands, including image sampling and seed drafts
pnpm lab:check        # validate every saved style and its inheritance
pnpm lab:snap --styles su --specimens settings --contexts all # capture saved styles
pnpm lab:promote help # inspect promotion options; only Yankun invokes a style promotion
pnpm tokens           # rebuild tokens after editing packages/tokens/src
pnpm palette          # regenerate palettes after editing packages/tokens/palette.config.ts
pnpm test             # completeness, shared structure and contrast tests
pnpm typecheck
pnpm format
pnpm changeset        # describe any change to a published package
```

`pnpm dev` keeps the token build live: edits to token sources trigger a rebuild and refresh the exported JSON; edits to `palette.config.ts` or the engine palette generator regenerate palettes first.

Before you finish a change: `pnpm build && pnpm test && pnpm typecheck && pnpm format:check`.

## The one idea: structure is shared, finish is chosen

ZAO has two finishes, **Su 素** (plain) and **Yu 玉** (jade), each in light and dark (Yu is dark only in v0.1).

- **Structure** decides size and layout: the fen unit, spacing, control heights, the text face and every type role's size and line height. It lives in `packages/tokens/src/base/` and is identical in every finish.
- **Finish** decides look: palettes, radius, material (glass or opaque), motion and the display face. It lives in `packages/tokens/src/themes/`.
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

| Need                   | Use                                                                                                                                   | Never                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Color                  | `bg-canvas`, `bg-surface`, `bg-sunken`, `text-default`, `text-muted`, `border-subtle`, `bg-accent`, `text-on-accent`, `text-danger` … | Hex, `rgb()`, `oklch()`, palette steps, arbitrary values like `bg-[#fff]` |
| Type                   | `type-display`, `type-title`, `type-heading`, `type-body`, `type-label`, `type-caption`, `type-code`                                  | Font sizes, raw weights, `text-[15px]`                                    |
| Emphasis inside a role | `font-medium`, `font-strong`                                                                                                          | `font-bold`, numeric weights                                              |
| Spacing                | Fen steps: `0`, `0.5`, `1`, `1.5`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`, `20` (`p-3` = 12px)                                | Off-scale steps like `p-7`, arbitrary values like `p-[13px]`              |
| Control height         | `h-7` (small), `h-8` (default), `h-10` (large)                                                                                        | Other heights for buttons, inputs, tabs                                   |
| Radius                 | `rounded-control` (inputs), `rounded-action` (buttons), `rounded-surface` (cards), `rounded-overlay`, `rounded-pill`                  | Tailwind radius sizes                                                     |
| Floating layers        | `material-overlay` on menus, popovers, dialogs, toasts                                                                                | Glass or blur on content surfaces, or `backdrop-blur` directly            |
| Control labels         | `trim-label`                                                                                                                          | Padding hacks to center text                                              |
| Numbers and IDs        | `figures-tabular` for numbers that line up or change, `figures-id` for IDs and codes                                                  | —                                                                         |

More rules:

- The display face appears only through `type-display` and `type-title`: page titles, empty states, marketing. Never in buttons, inputs, tables or labels.
- Keep the focus outline. If a component styles focus, use `outline-focus` or `ring-focus`.
- Pointer targets are at least 24px.
- Respect `prefers-reduced-motion` and reduced transparency (`material-overlay` already does).
- Apply a finish with data attributes: `data-zao-theme="su|yu"` and optionally `data-zao-mode="light|dark"`. Any element can be an island.

## Writing copy

Sentence case. Active voice. A button says what happens ("Approve 3 changes", not "Submit"), and the result uses the same verb ("Approved 3 changes"). Errors say what went wrong and how to fix it, without apologizing.

## Releasing

Any change to `@zao/tokens` or `@zao/react` needs a changeset (`pnpm changeset`). The docs app is never published.
