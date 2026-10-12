---
name: Dialog
status: approved
intent: Present a named modal task with immediate access to its content and explicit dismissal.
use-when:
  - A focused task needs modal focus, a title and explicit completion or cancellation actions.
  - A confirmation needs its complete content available immediately.
avoid-when:
  - A temporary action list belongs in Menu.
  - Essential ongoing content belongs in the page rather than behind a modal.
composes-with:
  - Button
parts:
  - trigger
  - backdrop
  - viewport
  - popup
  - title
  - description
  - close
motions: []
tokens:
  - unit
  - type.heading
  - type.body
  - space.4
  - stroke.hairline
  - radius.facet
  - depth.contact
  - depth.rest.surface
  - depth.lift
  - depth.axis.x
  - depth.axis.y
  - color.bg.canvas
  - color.bg.surface
  - color.fg.default
  - color.fg.muted
  - color.border.subtle
  - color.focus.ring
---

# Dialog

**Reference contract, Oct 11, 2026.** D7 approves the Dialog frame, veil and instant entry/exit; Trigger/Close reuse Button under the separate Oct 8 approval. This [D14 reference format](_template.md) records current finish overrides without changing the website or the inherited primitive API.

## Anatomy

`Dialog` is a compound export: `Root`, `Trigger`, `Portal`, `Backdrop`, `Viewport`, `Popup`, `Title`, `Description`, and `Close`. Root is a Base UI provider with no DOM node. **Popup**, not Root/Trigger/Portal, authors `data-zao-component="dialog"`. Title and Description associate the popup's accessible name and supporting text.

| Literal `data-zao-slot` | Owner and mounting                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `trigger`               | Optional host-rendered BaseDialog.Trigger through shared Button; normally outside popup. |
| `backdrop`              | Host-rendered BaseDialog.Backdrop, in Portal during modal lifecycle.                     |
| `viewport`              | Host-rendered full-screen positioning/scroll viewport.                                   |
| `popup`                 | Host-rendered opaque content frame and Dialog component marker.                          |
| `title`                 | Base UI heading, normally inside Popup.                                                  |
| `description`           | Optional Base UI supporting paragraph inside Popup.                                      |
| `close`                 | Host-rendered BaseDialog.Close through shared Button.                                    |

Root and Portal author no `root`/`portal` slot. Base UI portal wrappers, focus guards, and dismissal attributes are not additional authored parts. The host chooses composition and portal mounting; these children do not appear automatically. Shared Button's face, side, label/loading hooks remain Button-owned. Popup `::before`/`::after` draw banded side planes; the fixed base is their far edge, not a separate element or slot.

Viewport is fixed, scrollable, centered and padded `space.4` (16px), with pointer events disabled except the Popup. Popup is full width up to the existing `max-w-lg` utility, with 16px inset, surface fill, default text, and a subtle `stroke.hairline` (1px) border. Title uses `type-heading` (16px text face), not Newsreader's display/title role; Description uses `type-body` and muted ink. The leading corner uses `radius.facet` (5px) when bevel is supported; other corners and fallback remain square.

The content surface rests a surface depth (4px) above the conceptual base. It has two unblurred side planes with tones from its semantic surface. The shared load-path rule changes plane rest depth by `depth.contact` (1px) on a descendant action press; Dialog overrides that response's transition to keep it instant. This is plane paint, not popup/content translation. Shared plane reach also reads `depth.lift`, not a Dialog hover interaction.

Backdrop uses semantic canvas at 80% opacity. Reduced transparency or `data-zao-transparency="reduced"` makes the veil opaque; Popup is always opaque. Dialog does not use `material-overlay`, glass, backdrop blur, soft shadow, or a Pocket lip.

Metadata covers the Dialog frame/veil and shared surface utilities. Reused action type, heights, seal, pose and bracket tokens belong to the [Button contract](button.md).

Sources: [implementation and exported types](../../packages/react/src/components/dialog.tsx), [frame/veil/surface utilities](../../packages/react/src/styles/theme.css), [structure](../../packages/tokens/src/base/space.tokens.json), [Su finish](../../packages/tokens/src/themes/su.tokens.json), [mode colors](../../packages/tokens/src/modes/light.tokens.json), and [Parts](../parts.md).

## States

| Part/state           | Current contract                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root closed/open     | Base UI owns uncontrolled state or follows the host's controlled `open`; default closed.                                                                                                             |
| Modal                | Root defaults `modal=true`: focus trap, outside interaction restriction and document scroll lock. Inherited nonmodal/trap-focus options change those semantics and must be deliberate host choices.  |
| Trigger              | Button default `size="default"`, `variant="secondary"`.                                                                                                                                              |
| Close                | Button default `size="default"`, `variant="quiet"`; primary confirmation may use `variant="primary"`.                                                                                                |
| Enter/exit           | Full frame and veil appear/disappear instantly; no delayed focus or reveal.                                                                                                                          |
| Focus                | Base UI moves focus inside according to initialFocus/input type, traps it for modal use, and restores it on dismissal. Popup uses the outside ink outline when focused; action Buttons use brackets. |
| Descendant press     | Shared surface planes dip by one contact step immediately; face/content/native popup remain stationary.                                                                                              |
| Disabled action      | Inherited action disabled behavior; does not create a global disabled-dialog state.                                                                                                                  |
| Reduced transparency | Opaque veil, unchanged opaque popup and immediate access.                                                                                                                                            |

The Dialog frame has no intrinsic selected, invalid, read-only, empty, loading, success or error state. Those belong to its composed content/host task. Trigger/Close expose Button sizes/variants, not a full Button loading/icon API. Use an ordinary Button for a separately managed pending action.

**Editorial explanation:** instant entry makes the complete task available when modal focus arrives; the veil changes page priority without moving or fading the reading plane. This reflects D7's recorded intent and does not establish a measured task benefit.

## Interaction

| Public surface              | Current API                                                                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Dialog.Root`               | Unmodified BaseDialog.Root; exposes `open`/`defaultOpen`, `onOpenChange`, completion callback, `modal`, pointer-dismissal policy, action ref and inherited handle/trigger association. |
| `Dialog.Portal`             | Unmodified BaseDialog.Portal; accepts container, keepMounted (default false), and its inherited primitive props. Default destination is body.                                          |
| Trigger / Close             | Styled Base UI parts with additional Button `size` and `variant`; native refs are `HTMLButtonElement`.                                                                                 |
| Backdrop / Viewport / Popup | Styled Base UI parts with div refs and string layout `className`. Popup retains primitive initialFocus/finalFocus props.                                                               |
| Title / Description         | Styled Base UI heading/paragraph parts and refs.                                                                                                                                       |

Styled parts omit Base UI `render` and `style` and replace its flexible className with a string; Root/Portal are unchanged aliases. Do not describe all nine exports as the same restricted prop type. No published motion, depth, finish, or content-state prop is added by this wrapper.

Default modal behavior preserves Tab/Shift+Tab confinement, Escape/outside-press dismissal, scroll locking and focus return. Initial focus normally goes to the first tabbable descendant; touch opening may focus the popup instead to avoid opening a virtual keyboard. Base UI's Popup focus props permit an explicit task-appropriate target. The host owns controlled open state, task effects, form submission, validation, confirmation policy, pending/outcome announcements and dismissal cancellation when required.

Unlike Menu/Select/Combobox, Portal is **not** automatically mounted inside a local wrapper. For a local finish island, supply a container or an appropriate finish/mode wrapper so portaled content inherits the intended variables; the docs specimens explicitly use a local container. Do not assume provider context alone carries CSS inheritance through a body portal.

```tsx
import { Dialog } from '@zao/react';

<Dialog.Root>
  <Dialog.Trigger>Review access</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Viewport>
      <Dialog.Popup>
        <Dialog.Title>Review workspace access</Dialog.Title>
        <Dialog.Description>Check access before continuing.</Dialog.Description>
        <Dialog.Close>Done</Dialog.Close>
      </Dialog.Popup>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog.Root>;
```

This example assumes the page's global finish reaches the body portal. Include a visible Close inside modal Popup so pointer, keyboard and touch-screen-reader users have explicit dismissal.

## Motion

Dialog has **no entry/exit spatial role**. `dialog-construction` sets transition and animation to none, opacity to one, transform to none, and removes backdrop filtering. The veil also has no transition or animation. The shared Card load-path utility declares seat motion, but Dialog's effective transition is none, including reduced motion; its immediate plane-depth change does not create a Dialog Seat duration.

Trigger and Close retain [Button lift/seat/focus motion](button.md#motion); do not make their existing response instant merely because the frame is instant. Reduced motion retains complete modal content immediately and removes action spatial travel through Button's own protections. The global 0.01ms safety duration does not imply an active animation when transition property/animation name are none.

Forced colors remove surface plane paint; native/system border and focus behavior remain. The bevel fallback stays square. Reduced transparency changes the veil end value, not entry/exit timing. There is no interruption queue, backdrop fade, blur ramp, lip or label stagger.

Sources: [D7 instant response](../plans/2026-10-improvement/decision-drafts/dialog-b.md), [current motion rules and dated inventory](../motion.md), and shared CSS above.

## Accessibility

- Render Title to supply the modal name and Description when supporting text helps. Base UI associates those parts; the type does not enforce a complete host composition.
- Default modal focus moves immediately, stays trapped, and returns to the trigger or prior focus according to Base UI/finalFocus. Retain explicit dismissal, including a Close inside Popup for touch screen readers.
- Escape and outside press are primitive behavior; root policy and controlled cancellation can alter dismissal. A form submission or pending task must be handled by the host rather than inferred from closing.
- Background document scroll is locked in default modal mode. Viewport permits internal available-space scrolling; portal placement must preserve the intended finish and accessibility context.
- Popup outline is stationary ink in either seal; reused action Buttons use their own brackets. Decorative planes are not targets or announcements.
- Inherited RTL affects composed content/control order; the screen depth/facet direction remains right/up. Dialog introduces no custom keyboard direction mapping.
- Keep essential errors/outcomes in the task's readable content and host announcements. Dialog supplies no spinner, result live region, validation model, or automatic confirmation semantics.

Existing coverage: [frame, veil, focus trap/return, scroll lock, instant motion and preferences](../../apps/docs/e2e/dialog-construction.spec.ts), [shared action sizes/variants](../../apps/docs/e2e/dialog-buttons.spec.ts), [basic focus/dismissal](../../apps/docs/e2e/new-components.spec.ts), and [control-height integration](../../apps/docs/e2e/control-height.spec.ts). No suites were rerun for this reference-only document; no fresh pass or global accessibility claim is made.

## Decisions

No standalone Dialog construction approval paragraph exists in [BRIEF.md](../../BRIEF.md#current-design-direction-quiet-construction). The later component decision keeps its actual [AGENTS](../../AGENTS.md#the-one-idea-structure-is-shared-finish-is-chosen) and decision-draft attribution instead of inventing a BRIEF quotation.

| Date / source                                                                                        | Current rule or supersession                                                                                                                                                                                                   | Source reason (summary) or spec scope note                                                                                          |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Oct 8, [Dialog Button reuse](../../AGENTS.md#the-one-idea-structure-is-shared-finish-is-chosen)      | Trigger/Close reuse shared Button sizes and variants, secondary/quiet defaults and preserved primitive focus/ref behavior.                                                                                                     | Spec scope note: Reuse approved action construction; frame approval remained a separate decision.                                   |
| Oct 9, D7 B, [decision record](../plans/2026-10-improvement/decision-drafts/dialog-b.md)             | Opaque static surface frame, subtle hairline edge, canvas veil at 80% with opaque preference fallback, instant entry/exit.                                                                                                     | Source reason (summary): Reuse construction parts and set the page back while retaining immediate access and Base UI semantics.     |
| Oct 10, D9, [height decision](../plans/2026-10-improvement/decision-drafts/default-height-c.md)      | Shared 34px default actions; small/large 28/40px.                                                                                                                                                                              | Source reason (summary): Preserve one structural default and Button's reference line box/padding.                                   |
| Oct 11, V2–V4/V8/V11, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                 | Banded planes at surface rest depth and one supported leading facet replace D7's single shaded contact and square-only detail. Descendant press dips plane rest depth by contact immediately. D7's instant frame/veil remains. | Source reason (summary): Unblurred construction visible at rest; surface responds to its actions; Dialog instant entry is retained. |
| Oct 11, V1c/V12, [finish authorization](../../AGENTS.md#current-design-direction-quiet-construction) | Focus remains ink. Trigger/Close use Button brackets; Popup/content controls retain their appropriate outlines.                                                                                                                | Spec scope note: Apply brackets only to their approved controls while retaining fixed focus ownership.                              |

Source approvals remain in place. This reference performs no approval migration, popup behavior change, token edit, API expansion or public page rewrite.
