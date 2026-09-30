# evals (planned, milestone 6)

Measures whether ZAO actually improves what agents build.

- **Tasks**: 5 realistic UI prompts, such as a settings page, an empty state, a filterable table, a destructive-action confirmation and a multi-step form.
- **Conditions**: (A) an agent with a generic stack, (B) the agent plus `@zao/react`, (C) the agent plus the package and the agent layer.
- **Finishes**: every output is rendered in Su and Yu. Code that only works in one finish fails.
- **Automated metrics**: token and material violations, axe violations per finish, and the share of UI built from ZAO components.
- **Human metric**: a blind rubric covering hierarchy, restraint, copy and state coverage.

Results become a side-by-side gallery in the docs.
