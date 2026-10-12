---
name: ComposerContextChip
status: requested
intent: Name supplied request context and offer an explicit removal action owned by the host.
use-when:
  - Composer includes removable context in the next request.
avoid-when:
  - A selected filter, a setting, or an attachment needs its own state and semantics.
  - Removing context should send a request or mutate the transcript.
composes-with:
  - Composer
  - IconButton
parts:
  - context-chip
  - context-icon
motions:
  - lift
  - seat
tokens:
  - unit
  - type.caption
  - type.button
  - font.family.text
  - size.control.sm
  - size.icon.sm
  - space.1
  - space.1-5
  - space.2
  - radius.none
  - radius.action
  - radius.facet
  - radius.overlay
  - depth.rest.control
  - depth.rest.surface
  - depth.lift
  - depth.axis.x
  - depth.axis.y
  - color.bg.sunken
  - color.bg.surface
  - color.bg.hover
  - color.fg.default
  - color.fg.muted
  - color.fg.disabled
  - color.border.subtle
  - color.focus.ring
  - material.overlay.fill
  - material.overlay.fill-solid
  - material.overlay.border
  - material.overlay.shadow
  - material.overlay.blur
  - motion.duration.lift
  - motion.easing.lift
  - motion.duration.seat
  - motion.easing.seat
  - motion.duration.grade.7
  - motion.easing.fold-enter
  - space.0-5
  - motion.duration.fast
  - motion.easing.standard
---

# ComposerContextChip

**Reference contract, Oct 11, 2026.** This separately exported component follows the requested context/removal refinement within the current Composer family. The raised-tray approval includes its filled context treatment; `requested` preserves the remaining specific focus/removal attribution rather than claiming a separate full component approval. This document adds neither an approval nor website prose.

## Anatomy

ComposerContextChip is a forwarded native `<div>` with a visible caption label and a small quiet IconButton for removal. It is exported from [composer.tsx](../../packages/react/src/components/composer.tsx), not a separate source file. It has **no** `data-zao-component` marker. Its absence does not remove its separate exported ownership.

| Authored `data-zao-slot` | Presence and purpose                                                           |
| ------------------------ | ------------------------------------------------------------------------------ |
| `context-chip`           | Always present on the native container; wraps context name and removal action. |
| `context-icon`           | Optional decorative icon carrier when `icon` is supplied.                      |

The visible name has a class, not a label slot. Composer's `context` is the parent region and is not a chip hook. The removal action's `icon`/`tooltip` and Button `side`/`face` belong to [IconButton](icon-button.md) and [Button](button.md). This chip has no physical face, side, or base slot and no portal of its own; its removal action owns its tooltip portal.

The container is square (`rounded-none`), filled with `bg-sunken`, and retains a transparent border. `gap-1` and `pl-2` establish its inset; `type-caption` uses the text face. An optional icon is `size.icon.sm` (16px), muted when enabled. The quiet removal target is small (28px). Content is constrained with `max-w-full min-w-0`; the label wraps anywhere when the chip is under Composer's CSS owner. A standalone chip does not receive that parent-scoped wrapping rule.

Sources: [component and types](../../packages/react/src/components/composer.tsx), [context label/icon CSS](../../packages/react/src/styles/composer.css), and [shared utilities](../../packages/react/src/styles/theme.css). The inventory includes the removal control's construction and tooltip dependencies; it does not imply that the chip container uses them.

## States

| State                  | Current behavior                                                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Enabled                | Default text names context, the optional icon is muted, and removal is available.                                                                                                                      |
| Disabled               | Own `disabled` or its enclosing Composer's disabled context makes removal native-disabled, text/icon disabled, and adds `data-zao-disabled` on the container. Its filled sunken surface stays present. |
| Pointer/keyboard focus | Only the removal control receives focus or activation; the whole chip is not a selectable control.                                                                                                     |
| Removed                | The host removes its supplied node after `onRemove`. The component owns no retained context state.                                                                                                     |

There are no variant/size props, selected/invalid/read-only state, or pending removal state. Composer sending/responding do not disable the chip by themselves; the next request's context may still be prepared. Outside Composer, only its own `disabled` participates.

## Interaction

| Public input      | Type and default                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| `label`           | Required visible string. Also forms the removal action name.                                      |
| `icon`            | Optional `IconButtonIcon` SVG component type, decorative.                                         |
| `onRemove`        | Required synchronous `() => void`; the host removes this context.                                 |
| `disabled`        | Boolean, default `false`; combined with the enclosing Composer's disabled state.                  |
| Other props / ref | Native div attributes except `children`; forwarded `HTMLDivElement` ref. `className` is appended. |

Pointer, Space, Enter, and touch activate the existing IconButton. The click prevents the form's default submission, calls `onRemove`, then asks the enclosing Composer to focus its draft with `preventScroll`. Click detail/native pointer type distinguishes pointer from keyboard focus treatment. The chip does not mutate text, files, or conversation history and never submits a request.

The focus bridge exists only inside Composer's provider. Standalone removal still calls the host but has no draft to focus. `onRemove` is synchronous and not caught or awaited: a thrown callback prevents the subsequent focus call, and an asynchronous mutation requires host-managed completion/focus. There is no cancellation, confirmation dialog, network operation, or optimistic rollback here. If the host leaves the chip mounted, it remains visible.

```tsx
import { ComposerContextChip } from '@zao/react';
import { Database } from 'iconoir-react';

<ComposerContextChip
  label="Storage snapshot"
  icon={Database}
  onRemove={() => setSnapshotIncluded(false)}
/>;
```

Place it in Composer's `context` node for the current intended composition and focus-return behavior. The host supplies its label and decides whether its presence affects the next request.

## Motion

The chip and caption have no spatial transition, mount/remove animation, or idle motion. `lift` and `seat` name only the inherited removal IconButton's face response. Those use the shared duration/easing roles, while its outside focus brackets use grade 7/fold-enter. The container stays stationary. See [Button](button.md) and [IconButton](icon-button.md) for release, interrupted input, disabled, forced-color, and tooltip ownership.

Reduced motion leaves the action face stationary and keeps its fill feedback; removal and draft focus return remain immediate. The chip itself uses no translucent material; reduced-transparency treatment concerns the action's tooltip only. No new motion value is selected by this reference.

## Accessibility

The context name stays visible. The optional icon is hidden from assistive technology and marked unfocusable. Removal is named `Remove ${label} context`; IconButton uses the same label for its tooltip and supports Escape dismissal. Native disabled prevents activation and its ordinary tab stop. The container is a plain div, with no invented checkbox, pressed, listbox, or status semantics.

Inside Composer, keyboard removal restores the draft's keyboard outline; pointer removal restores the pointer writing treatment. The chip does not announce removal itself. If confirmation needs to be announced, or a standalone chip disappears while focused, the host supplies that feedback and destination. Long labels under Composer wrap without losing their text. The current chip uses physical left padding (`pl-2`) without an RTL padding override; inherited Button depth remains on its screen axis. Forced colors use the platform and the removal Button's existing system-outline fallback; the chip has no custom forced-color override.

Existing [Composer tests](../../apps/docs/e2e/composer.spec.ts) include context names, optional icons, pointer/keyboard removal, focus return, disabled handling, and narrow wrapping. [Conversation tests](../../apps/docs/e2e/conversation.spec.ts) exercise preservation of draft/files/history after context removal. This documentation did not rerun those tests or prove standalone focus recovery.

## Decisions

No ComposerContextChip approval paragraph exists in `BRIEF.md`. The actual family record is [Quiet instrument's Oct 7 study](../../explorations/su-studies/quiet-instrument/design.md#current-study-idea); no source approval is moved here.

| Record                                                                                             | Scope and current precedence                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Oct 7 requested compact and context-focus refinements                                              | Context becomes compact and removable; pointer/keyboard focus treatment is retained when returning to the draft. The initially requested bordered surface chips precede the raised-tray treatment.                                    |
| Oct 7 approved raised Composer tray refinement                                                     | Explicitly includes filled `bg-sunken` context chips with transparent dimension-preserving borders, readable default text, and optional host-supplied decorative icons. It preserves native draft behavior and existing action sizes. |
| Oct 11 authorized finish, [AGENTS.md](../../AGENTS.md#current-design-direction-quiet-construction) | Current semantic materials and the shared removal action's planes, facet, motion, and focus brackets inherit the finish. They add no chip-level setting, selection, or removal lifecycle.                                             |

**Editorial scope note:** the separate export deserves its own contract even though it shares a source file and has no component marker. Its label describes supplied context; its IconButton performs removal. Context recognition and focus-return comfort remain study hypotheses, not measured outcomes.
