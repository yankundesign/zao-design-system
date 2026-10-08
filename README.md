# ZAO 造

> ZAO is the foundation for how we build.
> Inspired by the principles of Yingzao Fashi, it defines the shared materials, patterns, and rules that help teams construct consistent digital experiences.

ZAO is a design system built to be used well by people and by coding agents. It shrinks the choice space, explains itself in a form machines can read, and measures its own promises in tests.

Its current design direction is **Quiet construction**: an experiment at the boundary of 2D and 3D interfaces, combining clear information with measured physical presence and quiet response. Yingzao Fashi informs proportion, parts, assembly, and finish; Hairline informs the feeling and the experimental method. Usability benefits remain hypotheses to test. Read the [direction brief](./BRIEF.md#current-design-direction-quiet-construction).

**Care for every detail; keep the number of details small.** Give visual form, interaction, and craft equal attention, refining a small, coherent set of purposeful details before adding more.

The shared theme comes first. Yankun will define interactions one component at a time. Exact gestures, depth, motion values, and component treatments remain open.

The current scope is one finish: **Su 素**, plain, in light and dark. Build one coherent design system and polish its visual form, interaction, and craft first. **Yu 玉** is deferred as a possible phase 2, with no committed release date or mode scope.

Spacing, control sizes, type sizes, component anatomy, and interaction meaning stay consistent across Su's modes. The token architecture still separates structure, finish, and mode so future finishes can build on the same foundation. Quiet construction names the design direction. See [BRIEF.md](./BRIEF.md) for the thinking, scope and decision log.

## Status

v0.1 in progress. Milestone 1 (foundation) is done: tokens, palettes, the Tailwind theme, fonts, tests, CI and the docs shell. The component library includes Button, TextField, Card, Combobox, Dialog, Menu, Progress, Select, Switch, and Tabs. Button, TextField, and Card were the first components for studying the Su finish.

Open `/components` in the docs for a separate page for each component. Each page uses the Quiet instrument study for Su. Foundations → Design notes reads the study's `design.md`. The header mode switcher offers System, Light, and Dark for Su. Yu is absent from the current docs previews; existing Yu token, engine, and lab assets remain deferred groundwork. The existing study name, CSS, and trial values remain the current preview; they do not prescribe the new direction's interactions. See the [Su CSS study](./docs/style-studies.md) for the source files and styling hooks.

## Getting started

You need Node 24 (see `.nvmrc`) and pnpm 10.

```sh
corepack enable        # installs the pnpm version pinned in package.json
pnpm install
pnpm dev               # builds the packages and opens the docs at http://localhost:3000
```

## Commands

| Command              | What it does                                                                      |
| -------------------- | --------------------------------------------------------------------------------- |
| `pnpm dev`           | Build the packages, then run the docs site with live token rebuilding             |
| `pnpm lab`           | Build the packages, then run the private style lab on localhost:3001              |
| `pnpm lab:style`     | Inspect and edit saved styles from the command line                               |
| `pnpm lab:reference` | Collect references and print explicitly seeded style drafts from the command line |
| `pnpm lab:journal`   | List and write journal notes from the command line                                |
| `pnpm lab:check`     | Validate saved styles, inheritance and the generated style schema                 |
| `pnpm lab:snap`      | Capture saved styles and specimens as PNGs with a contact sheet                   |
| `pnpm lab:promote`   | Promote a chosen style into token sources after Yankun's decision                 |
| `pnpm build`         | Build `@zao/engine`, `@zao/tokens` and `@zao/react`                               |
| `pnpm docs:build`    | Build packages and export the public docs to `apps/docs/out`                      |
| `pnpm tokens`        | Rebuild tokens after editing `packages/tokens/src`                                |
| `pnpm palette`       | Regenerate palettes after editing `packages/tokens/palette.config.ts`             |
| `pnpm test`          | Token, engine, lab and component browser tests                                    |
| `pnpm typecheck`     | TypeScript across the workspace                                                   |
| `pnpm format`        | Prettier                                                                          |
| `pnpm changeset`     | Describe a change to a published package                                          |

Use `pnpm lab:style compare <id1> <id2> [id3 id4] [--context su-dark]` to print parameter differences across 2–4 styles in one context. Use `pnpm lab:journal help` for filtered journal listing and file-based note writing.

## Hosting the docs on Cloudflare Pages

Run `pnpm docs:build` from the repository root. It enables Next.js static export
and generates `apps/docs/out`, including the current Quiet instrument stylesheet.
The exported `_headers` file gives that stylesheet route its CSS content type.
Local development and component tests keep the Node.js server and read live study files.

Use these Pages build settings:

| Setting                | Value                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| Root directory         | Repository root (leave blank)                                      |
| Build command          | `pnpm docs:build`                                                  |
| Build output directory | `apps/docs/out`                                                    |
| Framework preset       | Next.js (Static HTML Export), with the command and directory above |
| Node version           | 24, matching `.nvmrc`                                              |

Choose a production branch that contains the current docs and static-export setup.
After the first successful deployment, add `zaoui.dev` under the Pages project's
custom domains.

## Packages

| Package                              | Description                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| [`@zao/tokens`](./packages/tokens)   | W3C DTCG tokens with a resolver for every finish and mode, built to CSS variables and JSON |
| [`@zao/engine`](./packages/engine)   | Private style engine, parameter registry, palette generator and contrast promises          |
| [`@zao/react`](./packages/react)     | Tailwind CSS v4 theme, self-hosted fonts, and components built on Base UI                  |
| [`packages/agent`](./packages/agent) | Planned: manifests, an MCP server and a validator for agents                               |
| [`apps/docs`](./apps/docs)           | The docs site (Next.js)                                                                    |
| [`apps/lab`](./apps/lab)             | Local style lab with specimens and a parameter editor                                      |
| [`explorations`](./explorations)     | Saved styles and working material; reference images and trial fonts stay local             |
| [`evals`](./evals)                   | Planned: agent output with and without ZAO                                                 |

## For agents

Read [AGENTS.md](./AGENTS.md). It covers the repo, the commands and the rules for tokens and UI.

## License

MIT. The bundled fonts (Geist, Geist Mono, Newsreader) are under the SIL Open Font License 1.1.
