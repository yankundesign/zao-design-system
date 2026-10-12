---
name: Switch
status: approved
intent: Change one persistent binary setting through a labeled switch with visible endpoint state.
use-when:
  - A stable setting can be either on or off.
  - Changing the setting should use a direct binary control with a clickable visible label.
avoid-when:
  - An action needs Button or a view choice needs Tabs.
  - A choice has more than two states or needs an indeterminate state.
composes-with:
  - Card
parts:
  - root
  - thumb
  - face
motions:
  - slide
  - seat
tokens:
  - unit
  - space.0-5
  - space.1
  - space.1-5
  - space.2
  - space.4
  - space.6
  - space.10
  - stroke.hairline
  - radius.none
  - depth.rest.small
  - depth.rest.surface
  - depth.lift
  - depth.contact
  - depth.axis.x
  - depth.axis.y
  - color.bg.surface
  - color.bg.sunken
  - color.bg.hover
  - color.bg.active
  - color.border.default
  - color.border.subtle
  - color.fg.disabled
  - color.accent.solid
  - color.accent.border
  - color.focus.ring
  - motion.duration.slide
  - motion.easing.slide
  - motion.duration.seat
  - motion.easing.seat
  - motion.duration.fast
  - motion.easing.standard
  - motion.duration.grade.7
  - motion.easing.fold-enter
---

# Switch

**Reference spec, Oct 11, 2026.** This follows the approved D14 template and the current source. Switch's individual approval stands with the finish changes described below. This is the full reference contract, not a website page layout.

## Anatomy

Base UI renders the interactive housing as a focusable `<span role="switch">` plus a hidden native checkbox for label association and form behavior. The housing carries `data-zao-component="switch"` and the `root` slot. The forwarded ref points to that housing; inherited `inputRef` addresses the hidden checkbox. These native helper fields are Base UI-owned, not ZAO slots.

| Authored `data-zao-slot` | Role and presence                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `root`                   | Stationary interactive housing and recessed channel; always present.                                                                 |
| `thumb`                  | Noninteractive moving assembly containing its face and banded side-plane paint; always present and hidden from assistive technology. |
| `face`                   | Front plane inside the thumb; seats along the depth axis without moving the housing.                                                 |

The housing is 10 × 6 fen (40 × 24px); the face is 4 × 4 fen (16px). Its endpoint travel is the housing width minus the face and two 1-fen margins: currently 16px. The border uses `stroke.hairline`; the channel uses `construction-well`, the face's perimeter remains square, and `construction-planes` paints its two stepped sides at `depth.rest.small` (2px). There is no authored base, label, side, or contact-edge slot. The conceptual thumb base travels with the thumb; the housing stays fixed.

`construction-shading` derives bands from the face's surface color. Checked state changes the channel to the active seal and changes endpoint position; the face itself remains a neutral surface. Focus brackets belong to the root's `::after`, separately from thumb planes. `depth.rest.surface` and `depth.lift` in the metadata bound shared plane paint reach, not Switch's pose.

Sources: [implementation and public props](../../packages/react/src/components/switch.tsx), [Switch paint](../../packages/react/src/styles/switch.css), [planes, wells and focus](../../packages/react/src/styles/theme.css), [structure](../../packages/tokens/src/base/space.tokens.json), [Su finish](../../packages/tokens/src/themes/su.tokens.json), [semantic mapping](../../packages/tokens/src/modes/light.tokens.json), and [Parts](../parts.md).

## States

| State or prop          | Current contract                                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Off                    | Face at the starting endpoint; sunken channel and default perimeter. `defaultChecked` defaults false.                                               |
| On                     | Face at the opposite endpoint; channel uses accent/seal fill and accent edge. State changes immediately even while paint is traveling.              |
| Fine-pointer hover     | Enabled, editable face gains hover fill; it does not lift or move position.                                                                         |
| Held press             | Editable face gains active fill and seats by its small rest depth; activation remains Base UI-owned.                                                |
| Release / cancellation | Clear the held pose, retaining the checked destination selected by Base UI.                                                                         |
| Keyboard focus         | Outside ink brackets register to the fixed housing.                                                                                                 |
| `disabled`             | No user activation; default is false. Planes flatten, channel stays sunken, and edges use disabled/subtle treatment.                                |
| `readOnly`             | State remains readable and focusable according to Base UI, but user activation, hover emphasis, and press seating are suppressed; default is false. |

There are no size/variant, loading, empty, or indeterminate props. The fixed geometry does not become Button's 34px control height. Field-derived validation attributes may be inherited from Base UI, but ZAO defines no Switch-specific invalid paint or error-message lifecycle.

## Interaction

Use `checked` plus `onCheckedChange` for controlled state, or `defaultChecked` for an uncontrolled initial value. Base UI owns toggling, form resets, required state, and its checked change details. The host owns persistence, async saving, errors, and any confirmation required by the setting.

| Public input                                         | Contract                                                                                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `checked`, `defaultChecked`                          | Boolean endpoint state; the initial uncontrolled value defaults false.                                                                      |
| `onCheckedChange`                                    | Receives the next Boolean and Base UI event details. It is not a save/persistence callback supplied by ZAO.                                 |
| `disabled`, `readOnly`, `required`                   | Inherited Booleans, each default false. Required applies to the native form value.                                                          |
| `name`, `form`, `value`, `uncheckedValue`            | Inherited hidden-input form behavior; on submits `on` unless changed, off normally submits no value.                                        |
| `id`, `inputRef`, accessible naming attributes       | Base UI associates the hidden checkbox and accessible switch with the visible label; `inputRef` is separate from the forwarded housing ref. |
| `className`, handlers and other inherited attributes | Layout and native/Base UI integration; `render`, `nativeButton`, and `style` are omitted.                                                   |

Click, label activation, Enter, Space, and touch route through Base UI rather than a second state implementation. ZAO's held-input state is decorative. Supplied handlers run before a press flag is set; preventing key/pointer down suppresses that held pose. Key release, blur/window blur, pointer release, cancellation, leaving/moving outside the housing, lost capture, or becoming disabled/read-only clears it.

```tsx
import { Switch } from '@zao/react';

<label className="inline-flex items-center gap-2 type-label text-default">
  <Switch checked={enabled} onCheckedChange={setEnabled} />
  Email summaries
</label>;
```

Keep the visible wording stable between endpoints. The label is host content and has no Switch-authored slot.

## Motion

| Response                              | Duration and easing tokens                                                | Current Su resolution         |
| ------------------------------------- | ------------------------------------------------------------------------- | ----------------------------- |
| Thumb endpoint travel                 | `motion.duration.slide`, `motion.easing.slide`                            | Grade 7, 157.5ms; fold-enter. |
| Face seat and return                  | `motion.duration.seat`, `motion.easing.seat`                              | 80ms; standard.               |
| Channel/edge/face emphasis            | `motion.duration.fast`, `motion.easing.standard`                          | 80ms; standard.               |
| Root focus bracket approach / opacity | `motion.duration.grade.7` / `motion.duration.fast`, fold-enter / standard | 157.5ms / 80ms.               |

The thumb reverses from its current CSS transform when the checked endpoint changes; no overshoot is authored. Its face offset seats along the screen axis. Side planes follow the same pose without a separate animation. The housing, focus target and neighboring layout remain fixed.

**Source/record limit:** the finish plan's illustrative grade table and the slide token's description mention a grade 8 Switch (135ms). The current Switch CSS reads the shared `slide` alias, which resolves to grade 7, and explicitly comments that value. This reference describes the shipped source; it does not claim a grade 8 override or change a token to reconcile the records.

Reduced motion removes transitions, switches endpoints immediately, and keeps press feedback through fill without depth seating. Forced colors remove the side planes through the shared utility, keep visible system-colored housing/face edges, show Highlight for checked, and replace brackets with a solid system outline. Switch does not use translucent material or a bevel fallback.

Sources: [Switch transitions](../../packages/react/src/styles/switch.css), [current alias and description](../../packages/tokens/src/themes/su.tokens.json), [finish plan and grade table](../plans/2026-10-finish/README.md), and [motion inventory](../motion.md).

## Accessibility

- Base UI supplies `role="switch"`, Boolean `aria-checked`, read-only/required semantics, keyboard activation, and native form linkage. Provide a clickable visible label or a meaningful `aria-label`; the component does not create label text.
- Position and channel fill together identify state; neither color alone nor motion is necessary. The decorative thumb/face add no competing accessible target.
- Keep the whole 40 × 24px housing target and its outside focus paint stationary. The native hidden checkbox is not another tab stop.
- Disabled/read-only suppress user state changes and decorative held feedback. The host owns any explanatory text, errors and saved-state announcement.
- RTL reverses logical start/end and endpoint travel. The right/up depth axis remains a screen direction. Reduced motion and forced colors retain immediate state and visible focus.

Existing [Switch coverage](../../apps/docs/e2e/switch-construction.spec.ts) addresses endpoint travel, labels, checked semantics, keyboard/touch cancellation, rapid reversal, RTL, narrow settings, reduced motion and forced colors. These are existing coverage links, not a fresh pass or a new usability claim; no tests were run for this spec.

## Decisions

### Oct 7: exact BRIEF approval

From [BRIEF.md](../../BRIEF.md#current-design-direction-quiet-construction), unchanged. The outside-outline and finish timing references are historical where Oct 11 reopens them.

> **Approved Switch, Oct 7:** Use one square stationary housing, a recessed channel, and one connected sliding face. Position and semantic fill identify off and on. Hover changes face emphasis without moving it; press seats the face, and activation travels directly to the opposite endpoint without overshoot. Rapid toggling reverses from the current position. Use a 40px by 24px housing with a 16px square face. Keep the native target, outside focus outline, and neighboring layout fixed during interaction. Associate a clickable visible setting label whose wording stays stable. Base UI owns activation, controlled and uncontrolled state, and form behavior. Preserve disabled and read-only states, keyboard, touch cancellation, and RTL. Reduced motion shows the destination immediately and retains press feedback through fill. Reuse semantic colors and existing finish durations in Su light and dark; this approval is specific to Switch and adds no tokens or public API.

### Later approvals and current precedence

| Date and source                                                                                                         | Current effect                                                                                                                 | Source reason or spec scope note                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Oct 8 D3 and Oct 10 D11, [AGENTS historical records](../../AGENTS.md#the-one-idea-structure-is-shared-finish-is-chosen) | Shared shade and motion roles were extracted; their old single tone and values read through V2/V5/V6.                          | Spec scope note: retain the independent structural geometry and token-based paint contract.                                  |
| Oct 11 V1/V2/V3, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                                         | Checked channel carries the chosen seal; thumb uses small rest depth and banded planes; channel uses stepped wells.            | Source reasons, summarized: a legible rest pose and depth without blur.                                                      |
| Oct 11 V5/V6/V12, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                                        | Derived curves and grade-based aliases replace earlier values; root focus uses ink brackets, with the system-outline fallback. | Source reasons, summarized: motion derives from the building rule; focus is drawn with the construction and remains outside. |

Spec scope note: the current grade-7 implementation/grade-8 record discrepancy is identified under Motion rather than silently rewritten into an approval. All non-reopened keyboard, label, cancellation, state, fixed-layout and reduced-motion rules remain. Source approval text stays in place for the later separate migration; this spec proposes no interaction or API change.
