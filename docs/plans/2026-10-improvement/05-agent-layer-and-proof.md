# Phase 5: agent layer and proof

_Part of the [ZAO improvement plan](README.md). Read that file first: its rules, definition of done and option-sheet format apply here._

## Goal

The components that already exist have machine-readable specs, a validator an agent can run on its own output, and a first measured comparison of agent output with and without ZAO.

## Why

`BRIEF.md` puts "argue a point of view on AI-generated UI" among its three goals and "measure, don't assert" among its principles. `packages/agent` and `evals` hold only a README (F16). Meanwhile the design rationale lives in approval paragraphs copied across five files (F17), which is the opposite of a small, explained choice space.

This phase writes each rule once, in a form both readers can use, and then tests whether it helps.

## Order

WP 5.1 can start at once. WP 5.2–5.4 follow it. WP 5.5 should wait for Phases 1–3 so the eval measures the system Yankun intends to ship. WP 5.6 is last.

## Read first

- `packages/agent/README.md` and `evals/README.md`: the intended scope.
- The "What agent-friendly means here" and "Eval design" sections of `BRIEF.md`.
- `apps/docs/components/component-detail.tsx` and one page under `apps/docs/app/components/`.
- `apps/docs/components/design-notes.tsx`: how the docs already render Markdown.

## WP 5.1: Component specs

**Gate:** ⛔ D14. Write the Button spec and its template, then stop.

**Build**

1. Create `docs/components/button.md` with front matter and fixed sections:
   - Front matter: `name`, `status` (approved, requested, study), `intent` (one sentence), `use-when`, `avoid-when`, `composes-with`, `parts`, `motions`, `tokens`.
   - Sections: Anatomy, States, Interaction, Motion, Accessibility, Decisions.
   - **Decisions** holds the dated approvals for that component, moved word for word from `BRIEF.md`. Each rule keeps its reason.
2. Stop for Yankun's review of the template.
3. After the gate, write a spec for every exported component. Mark each one's real status; several are "requested, under review", not approved.
4. Replace the copied approval paragraphs in `BRIEF.md`, `PLAN.md`, `AGENTS.md`, `docs/style-studies.md` and the study's `design.md` and `styleguide.md` with one link each to the spec. Do this in a separate PR so the diff is reviewable.
5. Render the docs component pages from the specs so the page and the spec cannot disagree.

**Acceptance**

- A test fails when an exported component has no spec, or a spec names a part, motion or token that does not exist.
- Each approval text exists in exactly one file.
- `AGENTS.md` keeps its rules and repo map and loses the per-component paragraphs.

## WP 5.2: Manifest

**Gate:** ⛔ D15 (scope of the agent layer) before starting.

**Build**

- Generate `packages/agent/manifest.json` from the specs' front matter and the components' TypeScript prop types: for each component, its intent, when to use it and when not to, props with allowed values, parts, allowed compositions, and the tokens it reads.
- Generate it in `pnpm build`. Never edit it by hand.
- Add a JSON schema for the manifest.

**Acceptance**

- The manifest validates against its schema in CI and changes only when a spec or a prop type changes.
- Removing a variant from a component's types removes it from the manifest with no other edit.

## WP 5.3: Validator

**Build**

A command, `zao check <paths>`, in `packages/agent`, that reads source files and reports violations with file, line, rule and reason. The package stays private; expose the command as a workspace script. Start with rules that can be checked without running the code:

| Rule                | Flags                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Raw color           | Hex, `rgb()`, `oklch()`, palette steps, arbitrary color utilities                         |
| Off-scale spacing   | Spacing steps outside the fen scale, arbitrary spacing and size values                    |
| Raw type            | Font sizes, numeric weights, families outside the type roles                              |
| Raw depth           | Offset `box-shadow`, `transform` or `clip-path` depth that does not read the depth tokens |
| Raw motion          | Durations and easings that are not role tokens                                            |
| Raw material        | `backdrop-filter` outside `material-overlay`                                              |
| Display face misuse | The display face outside `type-display` and `type-title`                                  |
| Missing focus       | An interactive element that removes the outline without `outline-focus` or `ring-focus`   |
| Hand-rolled control | A native `button`, `input`, `select` or `dialog` where a ZAO component exists             |

Each rule's message gives the reason and the fix, taken from `AGENTS.md` or the spec.

- Output is readable text by default and JSON with `--json`.
- Run it on `apps/docs` and `packages/react` in CI. Record legitimate exceptions in an allowlist file with a reason beside each. `explorations/` is excluded.

**Acceptance**

- A fixtures folder holds one failing and one passing file per rule, and the test suite checks both.
- CI runs `zao check`. The allowlist is short enough to read, and each entry has a reason.
- The validator needs no network and no build of the checked project.

## WP 5.4: Guidance for projects that use ZAO

**Build**

- `packages/agent/AGENTS.template.md`: the rules an agent needs when building with ZAO in another repo. Generate the component section from the manifest. Keep it under 200 lines.
- `apps/docs/public/llms.txt`, generated from the specs: one line per page with a link.
- Both state how to run `zao check` and say the agent should run it before finishing.

**Acceptance:** both files are generated in `pnpm build` and a test fails if they are stale.

## WP 5.5: Eval v1

**Gate:** ⛔ D16 before running anything: the task list, the agent and model, and the number of runs.

**Build**

1. **Tasks.** Write the five prompts from `BRIEF.md` (a settings page, an empty state, a filterable table, a destructive-action confirmation, a multi-step form) as files in `evals/tasks/`. Each states the content and the behavior, and no styling.
2. **Conditions.** A: a fresh Next.js and Tailwind project. B: the same plus `@zao/react`. C: B plus the manifest, `AGENTS.template.md` and `zao check`.
3. **Harness.** A script that runs each task in each condition the agreed number of times, saves the generated source and a log to `evals/runs/<date>/`, builds it, and renders it in Su light and dark. For condition A, render light and dark with the project's own theme.
4. **Automated metrics.** Whether it builds; `zao check` violations by rule; axe violations per mode; the share of interactive elements that are ZAO components; whether it renders correctly in both modes.
5. **Human metric.** A gallery page in the docs with a blind mode that hides the condition and shuffles the order. Yankun scores hierarchy, restraint, copy and state coverage, and the scores are saved beside the run.
6. **Report.** `evals/runs/<date>/report.md` with the table of results, every run included.

**Rules for the eval**

- Report every run. No run is dropped or re-rolled because its result is poor.
- If condition C does not beat A on a metric, say so in the report. That is a finding about ZAO's guidance, and it goes back into the specs.
- Fix the prompts, model and settings before the first run, and record them in the report.

**Acceptance**

- The harness reruns from one command and produces the same folder structure.
- The gallery shows all runs side by side with scores and metrics, and states its sample size.
- The report lists at least three changes to the specs or validator that the results suggest.

## WP 5.6: A shorter brief

**Gate:** ⛔. `BRIEF.md` is Yankun's document. Propose the edit as a PR and wait.

**Build**

With approvals moved to specs (WP 5.1) and the joined thesis approved (WP 4.4), cut `BRIEF.md` to: the thesis, the direction and its principles, scope, the stack table, milestones, the decision log and open decisions. Move the current-scope prose in `PLAN.md` to a short list of links. Update the scope section to the 15 components that exist and say which are approved.

**Acceptance**

- `BRIEF.md` fits on roughly two screens above the decision log.
- No sentence that states a rule appears in more than one file.
- Every link in `BRIEF.md`, `PLAN.md` and `AGENTS.md` resolves.

## Out of scope

- An MCP server, unless D15 says otherwise.
- Publishing `packages/agent` to npm.
- Storybook and its MCP.
- Model fine-tuning or prompt tuning beyond the three conditions.
- Evaluating components that do not exist.
