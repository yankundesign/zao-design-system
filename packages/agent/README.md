# packages/agent (planned, milestone 5)

The layer that makes ZAO agent-friendly outside this repo:

- **Manifest**: one entry per component with props, intent, when to use it, when not to, and allowed compositions. Generated from the components and their docs.
- **Guidance**: an agent skill and an `AGENTS.md` for projects that use ZAO.
- **MCP server**: lets an agent list components, read tokens and guidance, and check its own output.
- **Validator**: flags raw values, off-scale spacing, glass on content surfaces, the display face outside display roles, and missing focus styles.

Storybook's MCP already gives agents stories, props and tests. This package adds what it lacks: intent, anti-slop rules and the validator.
