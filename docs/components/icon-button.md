---
name: IconButton
status: approved
intent: Perform one explicit action with an icon and a required accessible action label.
use-when:
  - A familiar icon can name an action in a compact toolbar.
  - The same concise action name should appear to assistive technology and in a tooltip.
avoid-when:
  - The action needs visible explanatory text in a Button.
  - A destination needs a link or a persistent setting needs Switch.
composes-with:
  - Button
  - Composer
parts:
  - icon
  - tooltip
motions:
  - lift
  - seat
tokens:
  - unit
  - type.button
  - type.caption
  - font.family.text
  - font.weight.regular
  - size.control.sm
  - size.control.md
  - size.control.lg
  - size.icon.sm
  - size.icon.md
  - space.0-5
  - space.1
  - space.1-5
  - space.2
  - space.4
  - radius.action
  - radius.facet
  - radius.overlay
  - depth.rest.control
  - depth.rest.surface
  - depth.lift
  - depth.axis.x
  - depth.axis.y
  - color.accent.solid
  - color.accent.solid-hover
  - color.fg.on-accent
  - color.fg.default
  - color.fg.disabled
  - color.bg.surface
  - color.bg.hover
  - color.bg.active
  - color.bg.sunken
  - color.bg.overlay
  - color.border.default
  - color.border.subtle
  - color.danger.text
  - color.focus.ring
  - material.overlay.fill
  - material.overlay.fill-solid
  - material.overlay.border
  - material.overlay.blur
  - material.overlay.shadow
  - motion.duration.lift
  - motion.easing.lift
  - motion.duration.seat
  - motion.easing.seat
  - motion.duration.fast
  - motion.easing.standard
  - motion.duration.grade.7
  - motion.easing.fold-enter
---

# IconButton

**Reference spec, Oct 11, 2026.** This uses the approved D14 template and the current finish. The component is approved; the decision transcriptions remain duplicated in their original sources pending the separate migration. This full reference is not a website page layout.

## Anatomy

An inline wrapper carries `data-zao-component="icon-button"` and contains a shared [Button](button.md), which remains the one native action target. The wrapper receives layout classes; the forwarded ref points to the Button, not the wrapper.

| Authored `data-zao-slot` | Role and presence                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `icon`                   | The supplied SVG action glyph, mounted inside Button's face. Decorative and nonfocusable. The icon implementation must forward the supplied SVG props. |
| `tooltip`                | Base UI popup showing the required action label while the tooltip is open. Mounted through a portal inside the local wrapper.                          |

Button owns its inherited `side`, `face`, and other conditional Button hooks; they are not IconButton-authored parts. Its face and icon travel together, while its native box, focus target, fixed conceptual base, and surrounding layout remain fixed. Side planes are Button paint; there is no separate IconButton base or joint slot.

The square small/default/large targets read `size.control.sm|md|lg`, currently 28/34/40px. Small/default artwork reads `size.icon.sm` (16px), large reads `size.icon.md` (20px). `icon-button-sizing` removes the face padding without changing Button construction. The tooltip uses `type-caption`, 2-fen horizontal and 1.5-fen vertical padding, a maximum width, and `material-overlay`; its bottom placement starts with the existing 4px offset and Base UI can resolve collisions. Su's overlay is opaque and has no blur.

Token metadata includes the inherited Button construction, type, state and focus dependencies and local tooltip material. `depth.rest.surface` bounds shared plane paint reach; the action itself rests at `depth.rest.control`. The supported leading bevel is Button's `radius.facet`; unsupported engines keep its square corner.

Sources: [implementation and props](../../packages/react/src/components/icon-button.tsx), [Button source](../../packages/react/src/components/button.tsx), [sizing, construction, material and focus utilities](../../packages/react/src/styles/theme.css), [structure](../../packages/tokens/src/base/space.tokens.json), [Su finish](../../packages/tokens/src/themes/su.tokens.json), [semantic colors](../../packages/tokens/src/modes/light.tokens.json), and [Parts](../parts.md).

## States

| Prop or state                  | Current contract                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `variant`                      | `primary`, `secondary`, `quiet`, or `danger`; default `secondary`. It inherits Button's semantic treatment.                                                  |
| `size`                         | `small`, `default`, or `large`; default `default`. Both dimensions use the corresponding control size.                                                       |
| Rest / hover / press / release | Shared Button construction: control rest depth, fine-pointer lift, same-axis seating, and return from the current pose. Quiet has no resting face or planes. |
| Keyboard focus                 | Ink brackets outside the native target. Focus also opens the action-label tooltip.                                                                           |
| `disabled`                     | Native Button is unavailable; the tooltip root and trigger are also disabled. Disabled paint follows Button.                                                 |
| Tooltip open                   | Hoverable label owned by Base UI, independent of the action's activation. Escape dismisses it.                                                               |

There is no local loading, selected, read-only, invalid, or empty-state API. Unlike Button, IconButton omits `loading` and `loadingAnnouncement`; do not infer a pending lifecycle from an icon. A host may supply native ARIA attributes for an existing action's semantics, but IconButton does not implement persistent toggle state.

## Interaction

Required `icon` is a Button-compatible SVG component, such as an Iconoir icon. Required `aria-label` is one concise action name; it supplies both the accessible name and the visible tooltip. The TypeScript string requirement does not reject an empty string at runtime. Keep the label meaningful.

The public type inherits Button's action attributes, variants, sizes, disabled state, form `type`, and event handlers. It omits `children`, `aria-labelledby`, leading/trailing icon props, `trailingAction`, `block`, and loading props. Button's omitted `render`, `nativeButton`, `focusableWhenDisabled`, and `style` remain unavailable. `className` styles the outer wrapper's layout.

Native Button/Base UI owns click and Enter/Space activation. The inherited held-input handlers own decorative press poses and cancellation only; the host owns the action and any async outcome. Touch gets Button's held feedback without making the tooltip essential to understanding or activation.

Tooltip open state, hover delay, focus opening, pointer transit, Escape, and dismissal are internal Base UI behavior. IconButton supplies no public tooltip-control or timing props. Its popup is hoverable; it contains plain label text, not a second action or interactive content.

```tsx
import { IconButton } from '@zao/react';
import { Settings } from 'iconoir-react';

<IconButton icon={Settings} aria-label="Open settings" onClick={openSettings} />;
```

## Motion

| Response                         | Duration and easing                                                       | Current Su resolution            |
| -------------------------------- | ------------------------------------------------------------------------- | -------------------------------- |
| Face/icon lift and return        | `motion.duration.lift`, `motion.easing.lift`                              | Grade 7, 157.5ms, fold-enter.    |
| Face/icon seating                | `motion.duration.seat`, `motion.easing.seat`                              | Fast, 80ms, standard.            |
| State fill/perimeter             | `motion.duration.fast`, `motion.easing.standard`                          | 80ms, standard.                  |
| Focus bracket approach / opacity | `motion.duration.grade.7` / `motion.duration.fast`, fold-enter / standard | 157.5ms travel and 80ms opacity. |

The side planes follow Button's registered face offset without a separate animation. Reversals follow the current pose. Return uses Button's lift/fold-enter role, not fold-exit. The tooltip adds no ZAO entry/exit transition; Base UI's hover delay is disclosure timing, not a ZAO spatial motion role.

Reduced motion retains immediate fill feedback and removes face and bracket travel. Forced colors remove the spatial planes and restore Button's solid system focus outline. The tooltip's material utility retains reduced-transparency and unsupported-backdrop-filter fallbacks; Su already resolves to opaque fill and zero blur.

Sources: [Button motion contract](button.md#motion), [motion rules](../motion.md), and [current finish aliases](../../packages/tokens/src/themes/su.tokens.json).

## Accessibility

- The shared native button has the supplied action name before a tooltip opens. The icon is `aria-hidden` and nonfocusable, so the tooltip is not the only way to discover the name.
- Keep the action label stable and meaningful. Prefer a visible Button label when the icon or result is unfamiliar.
- Base UI owns the tooltip's accessible relationship, focus/hover disclosure and Escape dismissal. Keep the popup hoverable and noninteractive.
- The native target and focus brackets stay registered to the square box. Disabled actions retain Button's native disabled behavior; their tooltip is disabled too.
- RTL inherits Button's logical layout; the right/up screen depth axis and top-right facet do not reverse.

Existing [IconButton coverage](../../apps/docs/e2e/icon-button.spec.ts) addresses square targets, labels, construction, hoverable/Escape-dismissible tooltips, reduced motion, and touch cancellation. [Button coverage](../../apps/docs/e2e/button-elevation.spec.ts) covers the shared action implementation. These links describe existing scope; no suites were rerun and no fresh accessibility, timing, or visual result is claimed for this documentation work.

## Decisions

### Oct 6: exact BRIEF approval

From [BRIEF.md](../../BRIEF.md#current-design-direction-quiet-construction), transcribed unchanged. Its reference to the current Button reads through the later Button and finish approvals.

> **Approved IconButton, Oct 6:** Use Iconoir as ZAO's icon family and follow Primer's IconButton reference for an icon-only action with an accessible action label and a hoverable tooltip on hover and keyboard focus that dismisses on Escape. IconButton reuses the current Button's construction and input feedback. Its square dimensions follow Button's shared 28px, 34px, and 40px sizes; icon sizing uses the existing structural icon tokens. This approval applies to IconButton specifically and does not establish interactions for other components.

### Later records and current precedence

| Date and source                                                                                        | Current effect                                                                                                                                                            | Source reason or spec scope note                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Oct 10 D9, [height decision](../plans/2026-10-improvement/decision-drafts/default-height-c.md)         | Square dimensions follow the shared 28/34/40px structural sizes.                                                                                                          | Source reason, summarized: preserve approved Button geometry and make default controls consistent while leaving the fen scale independent.                         |
| Oct 11 D12 A, [label decision](../plans/2026-10-improvement/decision-drafts/button-label-current-a.md) | Icon travels with Button's face; base/native target/layout remain fixed. Old motion/focus references are superseded below.                                                | Source reason, summarized: Yankun selected the current face/reading relationship after the private comparison; B and C remain unselected. D12 is not yet in BRIEF. |
| Oct 11 V1–V6/V12, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                       | Current seals, banded planes, control rest depth, supported leading facet, derived lift/seat timing and ink focus brackets replace the specifically reopened old details. | Source reasons, summarized: legible rest construction without blur; one purposeful corner; derived curves and grade durations; focus drawn with the construction.  |

Spec scope note: IconButton inherits Button's approved construction rather than defining another pose, hit target, or timing system. The [current AGENTS precedence](../../AGENTS.md#current-design-direction-quiet-construction) retains keyboard, disabled, reduced-motion, forced-color, and layout protections. Source approvals remain in place pending the separate migration; this reference proposes no new component behavior.
