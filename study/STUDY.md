# ZAO: Phase 1 study plan

_For Yankun. Written Sept 29, 2026._

Before building components, study three things: what a design system is, what a design system for AI agents and generative UI is, and the stack ZAO is built on. A fourth track, on seeing style, feeds the style search in Phase 2 (`PLAN.md`).

## How to use this

- **Pace:** about 55 hours in total. At around seven hours a week, that's roughly eight weeks. It's a suggested pace, not a schedule; take longer wherever something is interesting.
- **Each unit has four parts:** _Read_ (sources, all checked in Sept 2026), _Do_ (hands-on, mostly in the ZAO repo), _Write_ (a short note), and _Done when_ (what you should be able to explain).
- **Keep notes** in a learning log and a glossary. `docs/study/` in the repo works if you want them public for the case study; anywhere private works too.
- **Use an agent as a tutor.** Ask it to walk you through a file line by line, to quiz you on a unit, or to explain an error before it fixes it. Ask it not to write the _Write_ notes for you; they're where the learning sticks.
- **Phase 2 can overlap.** If agents start building the Step A tools while you study, reviewing their pull requests is good practice for Track C. If you'd rather keep things strictly in order, let them wait.

## What you'll have at the end

1. Your own definition of a design system, and ZAO's principles in your words.
2. A one-page position: what a design system for agents is. It updates the thesis in `BRIEF.md`.
3. A map of the generative UI landscape, with ZAO placed on it.
4. Five to ten reference teardowns and a vibe glossary, ready for the Phase 2 lab.
5. Confidence in the repo: change a token, write a test, run the build, review a pull request.

## Suggested order

| Week | Units      | Focus                                 |
| ---- | ---------- | ------------------------------------- |
| 1    | A1, A2, C1 | What a design system is; the repo map |
| 2    | A3, C2, D1 | Tokens, CSS, how a look is built      |
| 3    | B1, B2     | Why agents make slop; giving context  |
| 4    | B3, D2     | Generative UI; start teardowns        |
| 5    | A4, C3     | How good systems document; React      |
| 6    | C4, C5     | Headless components; the token build  |
| 7    | A5, C6, C7 | Releasing; tests; Next.js and PRs     |
| 8    | B4, B5, D3 | A mini eval; your position; glossary  |

---

## Track A: What a design system is

### A1. Definitions and parts (2 h)

- **Read:** [Design Systems 101](https://www.nngroup.com/articles/design-systems-101/) (Nielsen Norman Group). [Atomic Design](https://atomicdesign.bradfrost.com/) by Brad Frost, chapters 1 and 2 (free online).
- **Do:** list what ZAO has today (tokens, two finishes, the Tailwind theme, fonts, docs, tests, CI, `AGENTS.md`) and what it doesn't yet (components, usage guidance, contribution rules, the agent layer).
- **Write:** your definition of a design system in three sentences.
- **Done when:** you can explain the difference between a style guide, a component library and a design system.

### A2. Design language: functional and perceptual patterns (3 h)

- **Read:** [_Design Systems_](https://www.smashingmagazine.com/design-systems-book/) by Alla Kholmatova (paid book), especially the chapters on functional patterns, perceptual patterns and shared language. [Principles of Designing Systems](https://medium.com/eightshapes-llc/principles-of-designing-systems-294ee45dcf81) by Nathan Curtis (Medium may ask you to sign in).
- **Do:** pick one product you admire. List five of its perceptual patterns (how it feels) and what produces each one.
- **Write:** three to five principles for ZAO in your own words. Compare them with the principles in `BRIEF.md`.
- **Done when:** you can say which parts of ZAO are functional (structure) and which are perceptual (finish), and why ZAO keeps them in separate layers.

### A3. Tokens, color and theming (3 h)

- **Read:**
  - [Design tokens specification reaches first stable version](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) (W3C, Oct 2025), then skim the [Format module](https://www.designtokens.org/tr/drafts/format/) (tokens, groups, aliases, types) and the [Resolver module](https://www.designtokens.org/tr/drafts/resolver/), which ZAO uses for finishes and modes.
  - [Color in Design Systems](https://medium.com/eightshapes-llc/color-in-design-systems-a1c80f65fa3) by Nathan Curtis.
  - [Understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) (Radix Colors). ZAO's 12 steps follow the same idea.
- **Do:** trace one token end to end: `color.fg.muted` in `packages/tokens/src/modes/light.tokens.json` → `palette.neutral.light.11` → `--zao-color-fg-muted` in `packages/tokens/dist/zao.css` → `text-muted` in `packages/react/src/styles/theme.css` → a pixel on the docs site. Draw it.
- **Done when:** you can explain primitive and semantic tokens, aliases, modes, and why each of ZAO's palette steps has one job.

### A4. How mature systems document things (3 h)

- **Read:** browse [The Component Gallery](https://component.gallery/), which collects components from many public design systems.
- **Do:** pick one component (Button or Select) and compare how three systems document it: anatomy, variants, when to use and when not to, accessibility, code API, and which tokens it uses. Make a table.
- **Write:** what a ZAO component page must include, for both readers: a person and an agent.
- **Done when:** you have a draft template for ZAO's component docs.

### A5. Releasing and versioning (2 h)

- **Read:** [Releasing Design Systems](https://medium.com/eightshapes-llc/releasing-design-systems-57fca91a23f6) by Nathan Curtis. The [Changesets](https://github.com/changesets/changesets) README.
- **Do:** read `.changeset/config.json`. On a scratch branch, run `pnpm changeset` and look at the file it creates. Don't commit it.
- **Write:** what ZAO promises the people who use it. Is renaming a token breaking? Is changing a color?
- **Done when:** you can say what a major, minor and patch release means for a token change.

---

## Track B: Design systems for agents and generative UI

### B1. Why agents make slop (2 h)

- **Read:** [Improving frontend design through Skills](https://claude.com/blog/improving-frontend-design-through-skills) (Anthropic, Nov 2025), on distributional convergence and why generated UI looks the same. [Agentic Design Systems in 2026](https://bradfrost.com/blog/post/agentic-design-systems-in-2026/) by Brad Frost (Dec 2025), with the linked talk.
- **Do:** in a blank project with no guidance, ask an agent to build a small screen, such as notification settings. List every choice it made that you'd call slop.
- **Write:** your list of slop patterns, and for each one the ZAO rule that prevents it, or the rule that's missing.
- **Done when:** you can explain why constraints and defaults improve what agents build.

### B2. Giving agents design context (4 h)

- **Read:**
  - [What is the Model Context Protocol?](https://modelcontextprotocol.io/docs/getting-started/intro) and the architecture page it links to.
  - [Design Systems and AI: Why MCP Servers Are the Unlock](https://www.figma.com/blog/design-systems-ai-mcp/) (Figma). The [Figma MCP server guide](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) and [Code Connect](https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect).
  - [Storybook MCP](https://storybook.js.org/docs/ai/mcp/overview) (in preview), which serves a component manifest, stories and tests to agents.
  - [The shadcn/ui MCP server](https://ui.shadcn.com/docs/registry/mcp), which lets agents browse and install from registries.
  - OpenAI's [`apps-sdk-ui` AGENTS.md](https://github.com/openai/apps-sdk-ui/blob/main/AGENTS.md). Compare it with ZAO's `AGENTS.md`.
- **Do:** set one of these up in a scratch project (the shadcn MCP server is the quickest) and ask an agent to build the same screen as in B1. Compare the two results.
- **Write:** a checklist of what an agent needs from a design system.
- **Done when:** you can explain MCP's parts (client, server, tools, resources) and what a component manifest or Code Connect adds.

### B3. Generative UI: the landscape (4 h)

- **Read:**
  - [Generative UI](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/) (Google Research, Nov 2025), and skim the paper, [Generative UI: LLMs are Effective UI Generators](https://generativeui.github.io/). Note PAGEN, their dataset for evaluating generated UI.
  - [Generative user interfaces](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces) (Vercel AI SDK): tools that return components.
  - [json-render](https://github.com/vercel-labs/json-render) (Vercel Labs): the model writes JSON limited to a catalog you define.
  - [What is A2UI?](https://a2ui.org/introduction/what-is-a2ui/) and [Introducing A2UI](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/) (Google): a declarative UI format with a component catalog.
  - [AG-UI](https://docs.ag-ui.com/): an event protocol between agents and front ends. [AG-UI and A2UI: understanding the differences](https://www.copilotkit.ai/ag-ui-and-a2ui) (CopilotKit).
  - [MCP Apps](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/) (Jan 2026): the official MCP extension for interactive UI inside AI clients.
  - [UI guidelines](https://developers.openai.com/apps-sdk/concepts/ui-guidelines) (OpenAI Apps SDK). Notice they ask apps to inherit the host's system fonts and colors.
- **Do:** draw a map from "the agent writes code using a design system" (ZAO with Claude Code), to "tools return prebuilt components" (AI SDK), to "the agent composes JSON from a catalog" (json-render, A2UI), to "the model generates the whole interface" (Google's Generative UI). Then add the layers that carry UI: AG-UI (events), MCP Apps and the Apps SDK (hosting UI inside a chat). Place ZAO on it.
- **Write:** a paragraph on each part of the map, and which one ZAO should serve first, and why. Include an answer to: when your UI renders inside someone else's product, whose design system wins?
- **Done when:** you can explain the difference between a protocol for events (AG-UI), a format for UI (A2UI) and a way to host UI in a chat (MCP Apps).

### B4. A mini eval (3 h)

- **Read:** "Eval design" in `BRIEF.md`.
- **Do:** give an agent the same prompt twice, with the same model: once in a plain Next.js and Tailwind project, and once in the ZAO repo with `AGENTS.md`. Take screenshots. Score both on hierarchy, restraint, copy, states and accessibility.
- **Write:** what differed, what ZAO's rules missed, and three ideas for the real eval.
- **Done when:** you have one before-and-after pair and a list of rules or guidance to add.

### B5. Your position (2 h)

- **Write:** one page on what a design system for agents is. It becomes part of ZAO's README and the case study. Update the thesis in `BRIEF.md` if your view changed.
- **Done when:** you'd be comfortable presenting it to your design team.

---

## Track C: The stack, in the ZAO repo

### C1. How the repo fits together (2 h)

- **Read:** ZAO's `README.md` and `AGENTS.md`. [Workspace](https://pnpm.io/workspaces) (pnpm).
- **Do:** run `pnpm install` and `pnpm dev`. Open each `package.json` and follow its scripts. Draw the pipeline: token JSON → Terrazzo → `zao.css` and JSON → `theme.css` → Tailwind → a docs page.
- **Done when:** you can explain what happens when you run `pnpm dev`, and what each top-level folder is for.

### C2. The CSS a design system relies on (3 h)

- **Read:** [Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties) (MDN). [OKLCH in CSS: why we moved from RGB and HSL](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) (Evil Martians). [Theme variables](https://tailwindcss.com/docs/theme) (Tailwind CSS).
- **Do:** in the browser's developer tools on the docs site, change `--zao-palette-neutral-light-2` and watch the canvas change. Add `data-zao-theme="yu"` to any element. Find where `bg-canvas` gets its value.
- **Done when:** you can explain how custom properties cascade and inherit, why OKLCH makes palettes easier to generate, and what `@theme inline` does in `theme.css`.

### C3. React and TypeScript, enough to read and write components (4 h)

- **Read:** [Thinking in React](https://react.dev/learn/thinking-in-react) and [Adding Interactivity](https://react.dev/learn/adding-interactivity) (React). [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) (TypeScript handbook).
- **Do:** read `apps/docs/components/finish-sample.tsx` and `finish-switcher.tsx`. Make one small change to the sample using only ZAO utilities, then revert it.
- **Done when:** you can explain props, state and effects, and read a component's types.

### C4. Headless components and accessibility (3 h)

- **Read:** [Quick start](https://base-ui.com/react/overview/quick-start) and [Styling](https://base-ui.com/react/handbook/styling) (Base UI). [Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) in the ARIA Authoring Practices Guide: button, dialog and listbox. [Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) (WCAG 2.2).
- **Do:** use Base UI's Select demo with only the keyboard, then with VoiceOver (Cmd+F5 on a Mac). Compare what it does with the APG pattern.
- **Done when:** you can explain what "headless" means, what Base UI gives ZAO and what ZAO must add, and the 4.5:1 and 3:1 contrast rules.

### C5. The token build (3 h)

- **Read:** [Terrazzo docs](https://terrazzo.app/docs/) and its [Modes and theming guide](https://terrazzo.app/docs/guides/modes/).
- **Do:** read `packages/tokens/scripts/generate-palettes.ts` from top to bottom, with an agent explaining. Change `contrast` in `palette.config.ts`, run `pnpm palette && pnpm test`, look at how the ramps changed, then set it back and run `pnpm palette` again.
- **Done when:** you can explain what the resolver does, and how a 12-step ramp is generated from hue, chroma and lightness.

### C6. Tests and CI (3 h)

- **Read:** [Getting Started](https://vitest.dev/guide/) (Vitest). [Installation](https://playwright.dev/docs/intro) (Playwright), which ZAO will use for snapshots and keyboard tests.
- **Do:** read `packages/tokens/test/tokens.test.ts`. On a branch, write one new test, see it fail, then make it pass. Read `.github/workflows/ci.yml` and one CI log on GitHub.
- **Done when:** you can write a test, run it, and read a CI failure.

### C7. Next.js and pull requests (3 h)

- **Read:** the first chapters of the [Next.js App Router course](https://nextjs.org/learn/dashboard-app).
- **Do:** add a page to the docs locally, then remove it. Practice the loop: branch, commit, push, open a pull request. If Phase 2 has started, review one of the agents' pull requests.
- **Done when:** you can explain routes, layouts, and server and client components at a basic level, and leave a useful review.

---

## Track D: Seeing style

### D1. How a look is built from a few parameters (2 h)

- **Read:** [How we redesigned the Linear UI, part II](https://linear.app/now/how-we-redesigned-the-linear-ui) (Linear). Their themes come from three inputs: base color, accent color and contrast. Revisit perceptual patterns in Kholmatova's book (A2) and Radix's scale (A3).
- **Do:** map Linear's three inputs to the inputs in ZAO's `palette.config.ts`.
- **Done when:** you can say which few parameters carry most of a style's feel.

### D2. Reference teardowns (4 h, spread across weeks)

- **Do:** collect references for Su and Yu, and tear down five to ten of them with the template below. When the lab's reference board exists (`PLAN.md`, WP 2.5), move them there.
- **Done when:** you start seeing patterns across your references.

**Teardown template**

| Field               | What to note                                                            |
| ------------------- | ----------------------------------------------------------------------- |
| Source              | Link or screenshot, and why it caught your eye                          |
| Vibe words          | Three words for how it feels                                            |
| Neutral temperature | Cool, neutral or warm grays, and how tinted                             |
| Contrast            | Soft, medium or crisp; light first or dark first                        |
| Accent use          | Where the accent appears, and roughly how much of the screen it covers  |
| Density             | Control heights, spacing, how much fits on one screen                   |
| Shape               | Sharp, soft or round, and how consistent                                |
| Type                | Faces, weight contrast, size contrast between titles and body, tracking |
| Depth               | Borders, shadows, glass, or flat; how many layers                       |
| Motion              | Quick or soft, if you can see it                                        |
| Borrow / avoid      | What you'd take, and what you wouldn't                                  |

### D3. Your vibe glossary (2 h)

- **Write:** for each vibe word you keep using, the parameters that produce it and in which direction, with a reference that shows it. Aim for 8–12 words.
- **Why it matters beyond Phase 2:** agents handle vibe words poorly. A mapping from words to parameters, in your own taste, is exactly the kind of context ZAO can give them later.
- **Done when:** you can hand the glossary to someone else and they'd tweak a style in the direction you meant.
