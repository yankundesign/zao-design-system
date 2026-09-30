# ZAO: Project Brief

> ZAO is the foundation for how we build.
> Inspired by the principles of Yingzao Fashi, it defines the shared materials, patterns, and rules that help teams construct consistent digital experiences.

_Owner: Yankun · Started Sept 2026 · Status: pre-v0.1_

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

## Themes: one structure, two finishes

Song buildings could share a timber frame and still be painted at very different grades. ZAO's themes work the same way: they share everything structural and differ only in finish. Components never know which theme they're in.

| Shared (structure)                                                                                                                                         | Themed (finish)                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base unit and spacing scale, type scale steps, the text face and its metrics, layout, component anatomy, states, behavior, keyboard support, accessibility | Color, material (surface fill, translucency, blur, border, highlight, shadow), radius, motion character, the display face used for titles, and width-neutral font axes such as grade or roundness |

**Su 素: the plain finish**
Linear-like: quiet, precise and easy to adopt. A neutral base with one accent, opaque surfaces, hairline borders and restrained motion. The craft is in the details: focus rings, hover and press timing, tabular numerals, keyboard hints, optical icon alignment.

**Yu 玉: the expressive finish**
Memorable, with more color, depth and translucency. The proposed direction comes from 碾玉装 ("polished jade"), a painting grade in the manual: a cool blue-green palette and stepped color bands (叠晕) instead of generic smooth gradients, with translucent glass on floating layers.

**Rules for the expressive finish.** These become agent guidance and lint rules:

- Glass appears only on floating layers: popover, menu, dialog, toast, command bar. Never on content surfaces or behind body text.
- Text contrast is checked against the worst-case backdrop, not an average one.
- There is an opaque fallback through `@supports` and `prefers-reduced-transparency`. That media query only works in Chromium today, so there is also a user-facing setting.
- Components use material tokens (`material.overlay.*`), never `backdrop-filter` directly.

**How themes are built**

- **Generated, not hand-picked.** A script derives each theme from a few inputs (base, accent, contrast) in OKLCH. Linear does the same thing in LCH, using three inputs where it used to need 98 variables per theme.
- **Expressed with the DTCG Resolver module.** Two modifiers, `theme: su | yu` and `mode: light | dark`, are output as CSS variables scoped by `[data-theme][data-mode]`.
- **The architecture test.** Adding Yu must require zero changes to component code. If a change is needed, that's a bug in the token architecture.

## Scope

**v0.1: in scope**

- A base unit, plus tokens for color, type, space, radius, elevation, motion and **material**.
- Themes: Su in light and dark. Yu in dark first, with light mode in v0.2 (proposed).
- 7 components: Button, TextField, Select, Dialog, Tooltip, Tabs, Toast. Each ships with every state, full keyboard support, an axe-clean test in every theme, a docs page and a manifest entry.
- The agent layer described above, for those 7 components.
- Eval v1.
- One real page built on the system (dogfooding).
- A case study write-up.

**Next (v0.2 and later)**

- Yu in light mode. Density grades, following the _cai_ grades.
- Agentic UX patterns as the signature set: PlanSteps, ToolCallLog, ApprovalGate, Citation, ConfidenceIndicator, DiffReview, StreamingText.
- A shadcn-style registry for patterns and page blocks, so agents can install them through the shadcn MCP.
- A Figma library synced from the tokens.

**Out of scope**

- Component count as a goal.
- Themes beyond the two.
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
| Docs                     | Custom site (**Next.js 16**) with a live theme switcher. This is where the showcase lives                                                                                                      | Storybook docs only                      |
| Tests                    | Vitest + Testing Library, Playwright (interaction + visual snapshots for each theme), axe-core                                                                                                 | —                                        |
| Release                  | Changesets → npm under the **@zao** scope, **MIT** license, with GitHub Actions for CI                                                                                                         | —                                        |
| Toolchain                | Node 24, pnpm 10, TypeScript 7, Tailwind CSS 4.3, Vitest 5                                                                                                                                     | —                                        |

## Eval design

- **Tasks:** 5 realistic UI prompts, for example a settings page, an empty state, a filterable table, a confirmation for a destructive action, and a multi-step form.
- **Conditions:** (A) an agent with a generic stack, (B) the agent plus the package, (C) the agent plus the package and the agent layer.
- **Themes:** every output is rendered in both Su and Yu. If the agent's code only works in one theme, that counts as a failure.
- **Automated metrics:** token and material violations, axe violations in each theme, and the share of UI built from system components rather than hand-rolled.
- **Human metric:** a blind rubric review covering hierarchy, restraint, copy and state coverage.
- **Output:** a side-by-side gallery on the docs site. This is the centerpiece of the case study.

## Milestones

Each takes roughly one or two weekends.

1. **Foundation:** repo, base unit, token architecture and Resolver file, theme generator, Su in light and dark, docs shell, CI. **Done Sept 29, 2026** (Yu dark is set up too).
2. **Inputs:** Button, TextField, Select.
3. **Overlays & navigation:** Dialog, Tooltip, Tabs, Toast.
4. **Yu:** the second finish, and the zero-component-change test.
5. **Agent layer:** manifests, AGENTS.md, skill, MCP server, validator.
6. **Proof:** eval run and the dogfood page.
7. **Ship:** v0.1 published to npm, docs site live, case study written.

## Done means

- v0.1 is on npm and the docs site is live, with a theme switcher.
- Every component passes keyboard and axe tests in CI, in every theme and mode.
- Yu shipped without any changes to component code.
- Condition C has zero token violations and clearly beats condition A on component reuse and accessibility.
- The case study explains at least five real decisions and their trade-offs.

## Principles

1. **Fewer choices, better defaults.** Every option is another way for slop to get in.
2. **Every rule has a reason.** Agents and people both follow rules better when they know why.
3. **Measure, don't assert.** Any claim about quality comes with evidence.
4. **Two readers.** Everything is written for both a human and an agent.
5. **Structure is shared, finish is chosen.** Themes change how ZAO looks, never how it works.

## Decision log

| Date       | Decision                                                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-29 | Name: **ZAO**, inspired by Yingzao Fashi                                                                                                                                     |
| 2026-09-29 | Two themes from the start: a minimal, Linear-like finish and an expressive finish with color and glass                                                                       |
| 2026-09-29 | Theme names: **Su 素** (plain) and **Yu 玉** (jade)                                                                                                                          |
| 2026-09-29 | Headless layer: **Base UI**. Styling: **Tailwind v4** with a locked theme                                                                                                    |
| 2026-09-29 | Typography: **Geist** for text in both finishes, **Newsreader** for Yu's titles (with Noto Serif SC for Chinese), **Geist Mono** for code. See `docs/research/typography.md` |
| 2026-09-29 | npm scope **@zao**, **MIT** license. Tokens built with **Terrazzo**; palettes generated in OKLCH from `palette.config.ts`                                                    |

## Open decisions

- [ ] **Yu palette direction.** Proposed: the cool blue-green of 碾玉装 with stepped 叠晕 bands, or a different expressive direction.
- [ ] **Yu light mode.** Proposed for v0.2, to keep v0.1 at three theme-mode combinations.
- [ ] **Distribution.** An npm package alone keeps the API constrained. Adding a shadcn-style registry lets agents install components via MCP, but copied source can drift from the original.
- [ ] **Dogfood target.** yankun.design, Taste Builder, or a demo "agent console" that also shows off the v0.2 patterns.

## References

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
