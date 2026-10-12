---
name: Menu
status: approved
intent: Open a temporary labeled panel of actions anchored to its owning button.
use-when:
  - Related explicit actions need a compact labeled trigger.
  - Action groups can be separated with meaningful dividers.
avoid-when:
  - Choosing a form value belongs in Select or Combobox.
  - A persistent view or setting belongs in Tabs or Switch.
composes-with:
  - Button
  - Table
parts:
  - root
  - trigger
  - menu-indicator
  - portal
  - popup
  - items
  - separator
  - item
  - reveal-edge
motions:
  - reveal
  - reveal-exit
tokens:
  - unit
  - type.body
  - size.control.md
  - space.0-5
  - space.1
  - space.1-5
  - space.3
  - radius.none
  - radius.overlay
  - radius.facet
  - depth.contact
  - depth.rest.control
  - depth.rest.surface
  - depth.lift
  - depth.axis.x
  - depth.axis.y
  - color.bg.active
  - color.bg.hover
  - color.fg.default
  - color.fg.muted
  - color.border.subtle
  - color.border.default
  - color.focus.ring
  - material.overlay.fill
  - material.overlay.fill-solid
  - material.overlay.border
  - material.overlay.shadow
  - material.overlay.blur
  - motion.duration.reveal
  - motion.easing.reveal
  - motion.duration.reveal-exit
  - motion.easing.exit
---

# Menu

**Reference contract, Oct 11, 2026.** Menu's Oct 6 construction and D8 item treatment are approved. This [D14 reference format](_template.md) records the current finish and the exact older approval; it changes no website presentation or interaction.

## Anatomy

The outer wrapper carries `data-zao-component="menu"`. Its trigger reuses the native [Button](button.md), with Button-authored face/side/focus construction. Base UI owns the menu popup, focus, item navigation and dismissal.

| Literal `data-zao-slot` | Menu ownership and presence                                             |
| ----------------------- | ----------------------------------------------------------------------- |
| `root`                  | Always-present local wrapper and portal container.                      |
| `trigger`               | BaseMenu.Trigger rendered through shared secondary Button.              |
| `menu-indicator`        | Decorative 16px caret inside the trigger, always present.               |
| `portal`                | Base UI portal locally mounted into the wrapper during popup lifecycle. |
| `popup`                 | Floating frame, conditional on Base UI lifecycle.                       |
| `items`                 | Inner scrolling wrapper; frame/lip are not scrolling rows.              |
| `separator`             | Conditional Base UI separator for `{ separator: true }` entries.        |
| `item`                  | Base UI action target for each nonseparator entry.                      |
| `reveal-edge`           | Decorative front lip, sibling of the scrolling content.                 |

Button's reused slots remain Button-owned; they are not added to Menu's `parts`. Popup `::before`/`::after` draw two banded side planes. The base is their fixed far edge, not a DOM node. The joint is the collision-resolved trigger/popup relationship. `reveal-edge::after` draws the lip; `data-side` is Base UI placement, not a physical part name. Item-index and exit-highlight attributes are presentation markers, not API.

Trigger sizes follow Button's 28/34/40px structure. Default action rows use `min-h-control` (34px), `type-body`, 3-fen (12px) horizontal and 1.5-fen (6px) vertical padding, with square corners. The items wrapper has 1-fen padding and maximum height `available-height - space.0-5`. Separators use subtle semantic rules and 1-fen margins. Disabled rows use readable `text-muted`, rather than disabled-only label ink.

Placement defaults below/start with literal 4px offset, flip/shift collision avoidance, available-width/height caps and an anchor-width minimum. Su overlay material is opaque with zero blur. The final popup uses control rest depth (3px), two flat bands per side plane, and one 5px leading bevel when supported; fallback stays square. Material radius/shadow are intermediate utility dependencies overridden by popup construction. Shared plane reach reads surface rest/lift without adding popup hover travel. Native rows/content remain full-size and stationary during reveal.

Metadata lists Menu-owned/shared-utility dependencies. Reused Button's type, size, seal, lift/seat and focus tokens remain in the [Button contract](button.md).

Sources: [implementation/types](../../packages/react/src/components/menu.tsx), [construction/material/reveal/item utilities](../../packages/react/src/styles/theme.css), [structure](../../packages/tokens/src/base/space.tokens.json), [Su finish](../../packages/tokens/src/themes/su.tokens.json), [mode colors](../../packages/tokens/src/modes/light.tokens.json), and [Parts](../parts.md).

## States

| State/input               | Current contract                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Size                      | `small`, `default` (default), `large` changes trigger height, not the 34px default row minimum.                          |
| Closed                    | Secondary Button trigger at its own resting pose.                                                                        |
| Open                      | Trigger uses `bg-active`; decorative caret turns 180° immediately. Floating frame reveals from its joint.                |
| Trigger hover/press/focus | Shared Button poses, label/face travel and outside ink brackets; native hit area remains fixed.                          |
| Highlighted row           | Enabled pointer or keyboard navigation uses `bg-hover`, no inset navigation mark. Keyboard focus outline is independent. |
| Disabled item             | Readable muted text, no active fill and no callback activation; Base UI may focus it during keyboard navigation.         |
| Disabled Menu             | Unavailable trigger cannot open through normal activation.                                                               |
| Closing                   | Last highlighted row keeps fill through ending style; local presentation state resets after completion.                  |
| Empty items               | No authored empty-state message or placeholder action.                                                                   |

Menu has no committed-value checkmark, selected setting, invalid, read-only, or loading state. Do not substitute its highlighted action for form selection. **Editorial explanation:** one owner trigger and grouped actions describe a temporary action choice; meaningful separators explain groups without moving targets. No measured understanding benefit is claimed.

## Interaction

Required `trigger: string` supplies visible text. Required `items` is a readonly array of `{ label: string; onSelect?: () => void; disabled?: boolean }` or `{ separator: true }`. Optional `disabled`, `size` and outer `className` complete the public API. There is no controlled-open/value prop, forwarded ref, variant choice, custom item renderer, submenu, checkbox item, icon prop, `style`, or positioning prop.

The wrapper passes each action's `onSelect` to BaseMenu.Item's click handler; it does not await work, manage a pending operation, or invent success/error state. Base UI owns trigger activation, arrow/Home/End navigation, item activation, dismissal on action/Escape/outside press, focus return and collision flip/shift. Pointer and touch use the same action targets; disabled items cannot activate even if highlighted/focused.

On close, Menu snapshots the currently highlighted item index only to preserve paint. This does not represent a selected value. The local portal inherits finish/mode/direction from its wrapper. The host owns callback effects, action permissions, outcome announcements, and meaningful grouping; labels are plain strings rather than nested links or interactive children.

```tsx
import { Menu } from '@zao/react';

<Menu
  trigger="Workspace actions"
  items={[
    { label: 'Rename workspace', onSelect: renameWorkspace },
    { separator: true },
    { label: 'Archive workspace', onSelect: archiveWorkspace, disabled: locked },
  ]}
/>;
```

## Motion

| Response       | Duration/easing tokens                              | Current Su                |
| -------------- | --------------------------------------------------- | ------------------------- |
| Pocket opening | `motion.duration.reveal`, `motion.easing.reveal`    | Grade 5, 198ms/fold-enter |
| Pocket closing | `motion.duration.reveal-exit`, `motion.easing.exit` | Fast, 80ms/fold-exit      |
| Trigger poses  | Shared Button lift/seat roles                       | See [Button](button.md)   |
| Caret open cue | No transition declared                              | Immediate rotation        |

One registered reveal progress drives the clip and lip. Only paint changes: popup dimensions, labels and selection targets do not translate, scale, fade or stagger. Reveal direction follows actual top/bottom/left/right collision placement, independently of the screen depth axis. Lip thickness reads `depth.contact` (1px); the lip is noninteractive and outside inner scrolling. Changing the target can reverse the CSS transition from its current value; no fresh interruption result is claimed here.

Base UI instant paths have no transition. Reduced motion fixes progress at the completed frame and removes reveal travel; dismissal remains available. Forced colors hide side planes and show enabled highlighted rows using Highlight/HighlightText with system-color adjustment protections. Su overlay already has opaque fill/zero blur; reduced transparency, the explicit transparency preference and unsupported backdrop filtering select solid material. Unsupported bevel stays square. Trigger focus/disabled/reduced-motion behavior remains Button's own contract.

Sources: [motion rules/inventory](../motion.md), [motion configuration](../../packages/tokens/motion.config.ts), and theme utilities above.

## Accessibility

- Visible trigger text names the native Button and its menu relationship. Base UI provides menu/menuitem roles, keyboard navigation, disabled identification and dismissal.
- Trigger brackets register outside its native box. Popup/items retain `outline-focus`; item focus is separate from pointer highlight and there is no selected-value model.
- Disabled rows remain readable and cannot activate; they may still receive roving focus, so do not document disabled rows as always skipped.
- Separators use the Base UI separator primitive. Decorative caret, lip and side paint do not create targets or announcements.
- Local portals preserve theme/direction; collision shift/flip and bounded scrolling retain available-space access. RTL aligns the popup through logical start; screen depth/facet direction remains right/up.
- The host must announce long-running action outcomes and provide dialogs/confirmation through their owning components when needed; Menu itself has no pending/result lifecycle.

Existing coverage: [construction, keyboard/pointer/touch, collision and reduced motion](../../apps/docs/e2e/menu-construction.spec.ts), [fill-only emphasis, forced colors and RTL](../../apps/docs/e2e/menu-item-emphasis.spec.ts), [basic actions and disabled behavior](../../apps/docs/e2e/new-components.spec.ts), [shared heights](../../apps/docs/e2e/control-height.spec.ts), and [measured Anatomy](../../apps/docs/e2e/anatomy.spec.ts). These existing sources were not rerun for this reference-only change; no fresh accessibility or timing pass is claimed.

## Decisions

### Oct 6: exact BRIEF approval

From [BRIEF.md](../../BRIEF.md#current-design-direction-quiet-construction), retained word for word. Its historical timing/contact details read through the later finish authorization.

> **Approved Menu and Pocket reveal, Oct 6:** Menu's depth identifies a temporary floating panel owned by its trigger. Reuse the secondary Button at shared 28px, 34px, and 40px sizes, with a clear open state. Anchor one frame with a fine semantic border and crisp contact edge. A decorative moving front lip starts at the trigger-adjacent joint, travels with the clipped reveal to become the far frame edge when open, and withdraws on close. Its direction follows actual collision placement. The full-size popup, labels, and selection targets remain stationary, without row stagger. Reuse existing `duration-base` for opening and `duration-fast` for closing (160ms / 80ms in Quiet instrument), without changing tokens or global timings. Reduced motion shows the completed frame immediately. Keep the approved semantic row emphasis, meaningful separators, and readable disabled items; current row emphasis remains steady through closing. Preserve Base UI keyboard navigation, dismissal, focus behavior, and collision flip/shift. Su uses `material-overlay` for floating material in light and dark. Other component interactions remain open.

| Date / source                                                                                                                | Current rule or supersession                                                                                                                                                                        | Source reason (summary) or spec scope note                                                              |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Oct 9, D8, [item decision](../plans/2026-10-improvement/decision-drafts/menu-item-b.md)                                      | Fill only, square item corners, native Menu focus outlines and steady closing emphasis. No inset mark.                                                                                              | Source reason (summary): Yankun selected one navigation cue while keeping focus distinct.               |
| Oct 10, D9, [height decision](../plans/2026-10-improvement/decision-drafts/default-height-c.md)                              | Default row minimum grows to shared 34px; trigger sizes remain 28/34/40px.                                                                                                                          | Source reason (summary): Preserve coherent default target size without changing fen spacing.            |
| Oct 11, V2–V6, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                                                | Banded side planes at control rest depth and leading facet replace the old single contact; opening becomes grade 5/fold-enter, closing fast/fold-exit, superseding D11's old duration/curve values. | Source reason (summary): Unblurred depth visible at rest and motion derived from rules.                 |
| Oct 11, D12/V12, [Button](button.md) and [finish authorization](../../AGENTS.md#current-design-direction-quiet-construction) | Trigger label rides its Button face; trigger brackets remain registered to its native target. Menu items keep outlines.                                                                             | Spec scope note: Preserve the approved face/reading relationship while applying control-specific focus. |

The old BRIEF approval is not a simultaneous instruction to restore 160ms opening or single-shade contact. Source approvals remain in place; this spec performs no migration, hook rename, runtime or website change.
