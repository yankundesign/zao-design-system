# Component contracts

Full reference contracts for the existing `@zao/react` exports, using the [approved template](_template.md). These files describe intent, appropriate use, actual parts, state and interaction, motion, accessibility, and decision history. The website uses a concise curated view alongside its working examples; it does not display these complete contracts.

## Coverage

The [package entry point](../../packages/react/src/index.ts) exports **16 UI components**. Compound members are documented in their parent's spec. ComposerContextChip has its own spec because it is a separate export, even though its implementation shares the Composer source file. The `finish` function is a finish utility, not another UI component.

| Export              | Spec                                            | Implementation                                                           |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| Button              | [Button](button.md)                             | [button.tsx](../../packages/react/src/components/button.tsx)             |
| IconButton          | [IconButton](icon-button.md)                    | [icon-button.tsx](../../packages/react/src/components/icon-button.tsx)   |
| Card                | [Card](card.md)                                 | [card.tsx](../../packages/react/src/components/card.tsx)                 |
| Table               | [Table](table.md)                               | [table.tsx](../../packages/react/src/components/table.tsx)               |
| TextField           | [TextField](text-field.md)                      | [text-field.tsx](../../packages/react/src/components/text-field.tsx)     |
| Select              | [Select](select.md)                             | [select.tsx](../../packages/react/src/components/select.tsx)             |
| Combobox            | [Combobox](combobox.md)                         | [combobox.tsx](../../packages/react/src/components/combobox.tsx)         |
| Menu                | [Menu](menu.md)                                 | [menu.tsx](../../packages/react/src/components/menu.tsx)                 |
| Dialog              | [Dialog](dialog.md)                             | [dialog.tsx](../../packages/react/src/components/dialog.tsx)             |
| Switch              | [Switch](switch.md)                             | [switch.tsx](../../packages/react/src/components/switch.tsx)             |
| Tabs                | [Tabs](tabs.md)                                 | [tabs.tsx](../../packages/react/src/components/tabs.tsx)                 |
| Progress            | [Progress](progress.md)                         | [progress.tsx](../../packages/react/src/components/progress.tsx)         |
| Composer            | [Composer](composer.md)                         | [composer.tsx](../../packages/react/src/components/composer.tsx)         |
| ComposerContextChip | [ComposerContextChip](composer-context-chip.md) | [composer.tsx](../../packages/react/src/components/composer.tsx)         |
| Conversation        | [Conversation](conversation.md)                 | [conversation.tsx](../../packages/react/src/components/conversation.tsx) |
| Message             | [Message](message.md)                           | [message.tsx](../../packages/react/src/components/message.tsx)           |

## Reading status and ownership

- `approved` records an existing named component/family approval. Read Decisions for its scope and the later finish rules that supersede older values.
- `requested` records a current requested contract or refinement still under review. Approved subsets, such as field edges, item emphasis, and Table status glyphs, are called out separately.
- `study` records an existing implementation without a separate standalone approval. It does not establish a system-wide interaction rule.

Published behavior, local Quiet instrument recipes, and docs-only simulations are identified separately. Inherited Button or IconButton hooks retain their source owner; a physical base, side, or joint does not create a new public slot. Metadata names actual token IDs and motion roles, not private CSS variables or invented hooks.

## Maintenance and next steps

Read the current source and its approved decisions when updating a spec. Keep the six sections in order, preserve original approval wording, attribute later decisions to their actual source, and distinguish recorded reasons from editorial explanations. The complete specs are reference/agent input; public introductions and guidance should remain short.

These documents do not introduce component behavior. Original approval records remain in place for the separate migration; component-page source integration, generated manifests, validators, and evals are later work under [Phase 5](../plans/2026-10-improvement/05-agent-layer-and-proof.md). D15 still gates agent-layer scope, and D16 gates eval setup and runs. No fresh runtime test results are claimed by this source-grounded documentation pass.
