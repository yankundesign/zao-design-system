# ZAO 造

> ZAO is the foundation for how we build.
> Inspired by the principles of Yingzao Fashi, it defines the shared materials, patterns, and rules that help teams construct consistent digital experiences.

ZAO is a design system built to be used well by people and by coding agents. It shrinks the choice space, explains itself in a form machines can read, and measures its own promises in tests.

It ships two finishes on one structure:

- **Su 素**, plain: quiet, precise and easy to adopt, in light and dark.
- **Yu 玉**, jade: color, depth and glass on floating layers, dark first.

Spacing, control sizes and type sizes are shared by both, so components never change size between finishes. See [BRIEF.md](./BRIEF.md) for the thinking, scope and decision log.

## Status

v0.1 in progress. Milestone 1 (foundation) is done: tokens, palettes, the Tailwind theme, fonts, tests, CI and the docs shell. Components arrive in milestone 2.

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
| `pnpm lab:check`     | Validate saved styles, inheritance and the generated style schema                 |
| `pnpm lab:snap`      | Capture saved styles and specimens as PNGs with a contact sheet                   |
| `pnpm lab:promote`   | Promote a chosen style into token sources after Yankun's decision                 |
| `pnpm build`         | Build `@zao/engine`, `@zao/tokens` and `@zao/react`                               |
| `pnpm tokens`        | Rebuild tokens after editing `packages/tokens/src`                                |
| `pnpm palette`       | Regenerate palettes after editing `packages/tokens/palette.config.ts`             |
| `pnpm test`          | Completeness, shared-structure and contrast tests                                 |
| `pnpm typecheck`     | TypeScript across the workspace                                                   |
| `pnpm format`        | Prettier                                                                          |
| `pnpm changeset`     | Describe a change to a published package                                          |

## Packages

| Package                              | Description                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| [`@zao/tokens`](./packages/tokens)   | W3C DTCG tokens with a resolver for every finish and mode, built to CSS variables and JSON |
| [`@zao/engine`](./packages/engine)   | Private style engine, parameter registry, palette generator and contrast promises          |
| [`@zao/react`](./packages/react)     | Tailwind CSS v4 theme, self-hosted fonts, and (soon) components built on Base UI           |
| [`packages/agent`](./packages/agent) | Planned: manifests, an MCP server and a validator for agents                               |
| [`apps/docs`](./apps/docs)           | The docs site (Next.js)                                                                    |
| [`apps/lab`](./apps/lab)             | Local style lab with specimens and a parameter editor                                      |
| [`explorations`](./explorations)     | Saved styles and working material; reference images and trial fonts stay local             |
| [`evals`](./evals)                   | Planned: agent output with and without ZAO                                                 |

## For agents

Read [AGENTS.md](./AGENTS.md). It covers the repo, the commands and the rules for tokens and UI.

## License

MIT. The bundled fonts (Geist, Geist Mono, Newsreader) are under the SIL Open Font License 1.1.
