---
name: TextField
status: requested
intent: Enter a single field value through a labeled native input with associated guidance and errors.
use-when:
  - A form needs a single-line text value with a visible label.
  - Native input attributes can express the required editing or constraint behavior.
avoid-when:
  - A fixed choice belongs in Select or a filterable choice belongs in Combobox.
  - A multiline message and its actions belong in Composer.
composes-with: []
parts:
  - root
  - label
  - control
  - error
  - description
motions: []
tokens:
  - unit
  - type.label
  - type.body
  - type.caption
  - font.weight.medium
  - size.control.md
  - space.1
  - space.2
  - radius.control
  - radius.none
  - depth.contact
  - depth.axis.x
  - depth.axis.y
  - color.bg.canvas
  - color.bg.sunken
  - color.bg.field-disabled
  - color.fg.default
  - color.fg.muted
  - color.fg.disabled
  - color.border.field
  - color.border.field-invalid
  - color.border.strong
  - color.border.subtle
  - color.danger.text
  - color.focus.ring
  - motion.duration.fast
---

# TextField

**Reference contract, Oct 11, 2026.** The [D14 template](_template.md) is approved. TextField's whole-component field-family treatment remains requested; D6 approves its field-edge subset. This does not promote the remaining Quiet instrument treatment or approve interactions for other components. This complete reference is not the public component-page layout.

## Anatomy

The Base UI Field wrapper carries `data-zao-component="text-field"`. Its `Field.Control` renders the native `<input>` and receives the forwarded `HTMLInputElement` ref. The field frame, native input target, text, outside focus outline, and neighboring layout stay stationary; the recess is paint rather than a moving face.

| Literal `data-zao-slot` | Owner and presence                                                    |
| ----------------------- | --------------------------------------------------------------------- |
| `root`                  | Always-present Field wrapper; vertical label/control/guidance layout. |
| `label`                 | Always-present Field.Label; visible name associated by Base UI.       |
| `control`               | Always-present native input through Field.Control.                    |
| `error`                 | Field.Error with `match`, mounted when `error` is truthy.             |
| `description`           | Field.Description, mounted when `description` is truthy.              |

`data-zao-field-frame`, `data-zao-invalid`, and `data-zao-disabled` mark the input's existing frame/state; they are not slots. There is no separate face, well-wall, base, or contact-edge element. `construction-well field-well` draws stepped inner walls from the canvas face and `depth.contact` (currently 1px), along the screen axis (right/up). Forced colors remove those walls.

Published structure is full width, a 1-fen (4px) vertical gap, 2-fen (8px) input side padding, and small/default/large heights of 28/34/40px. Default reads `size.control.md` through `h-control`; small/large use `h-7`/`h-10` from `unit` (4px). Labels use `type-label` and medium weight; input text uses `type-body` (14px, 20px line box), and guidance/error uses `type-caption`. The border utility draws the current 1px structural perimeter; depth does not change its width.

Published inputs use `rounded-control` (Su 2px) and canvas fill. The existing [Quiet instrument sheet](../../explorations/su-studies/quiet-instrument/style.css) instead squares the frame with `radius.none`, uses canvas in light and sunken fill in dark, and refines edge/focus/disabled treatment locally. The YAML token list includes those study dependencies; it does not make the study a published default.

Sources: [implementation and public type](../../packages/react/src/components/text-field.tsx), [well and theme utilities](../../packages/react/src/styles/theme.css), [structural tokens](../../packages/tokens/src/base/space.tokens.json), [type roles](../../packages/tokens/src/base/type.tokens.json), [Su finish](../../packages/tokens/src/themes/su.tokens.json), [light](../../packages/tokens/src/modes/light.tokens.json) and [dark](../../packages/tokens/src/modes/dark.tokens.json) mappings, and [Parts](../parts.md).

## States

| Input/state    | Current contract                                                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `size`         | `small`, `default` (default), or `large`; shared heights, same text role.                                                                                                          |
| Rest           | Published canvas well with `border-field`; local study uses its square light/dark well.                                                                                            |
| Enabled hover  | Normal fields use `border-strong`, with fixed geometry. The study also applies that edge on focus-within.                                                                          |
| Keyboard focus | Outside ink outline; there are no Button/Switch focus brackets.                                                                                                                    |
| Error          | Truthy `error` supplies Field.Root invalid state, invalid marker, `border-field-invalid`, and associated error text. Enabled hover does not replace that error edge.               |
| Disabled       | Native disabled input; disabled text/placeholder and `bg-field-disabled`. In the study a noninvalid disabled frame uses `border-subtle`; invalid edge wins when both states apply. |
| Read-only      | Inherited native `readOnly`; editing is prevented without treating the value as disabled. No separate read-only paint recipe.                                                      |
| Empty          | Native empty value and optional placeholder; placeholder is not the label.                                                                                                         |

There is no selection indicator, pressed seating, pending spinner, or intrinsic loading state. Native text selection remains available. The host owns the supplied error and application validation; native constraints remain native input behavior. Published `color.border.field` and `.field-invalid` now promise at least 3:1 on canvas and surface; disabled label ink has no readable-text contrast promise.

**Editorial explanation:** label, guidance, and errors remain separate so the input can retain one stable name while the host explains the value. This is a description of the existing contract, not a measured usability result.

## Interaction

`TextFieldProps` extends native input props, omitting `children`, `ref`, and native numeric `size`. Required `label: string` supplies the visible name. Optional `description` and `error` are React content. Component `size` defaults to `default`; `className` is appended to the input, not the outer field. Native attributes and handlers, including `type`, `value`, `defaultValue`, `onChange`, `name`, `required`, `disabled`, `readOnly`, `placeholder`, autocomplete and constraints, are inherited. Unlike Select/Combobox, this type retains native `style`; ordinary usage should keep paint and geometry in ZAO utilities.

Use native controlled `value` with `onChange`, or `defaultValue` for uncontrolled input. Text editing, selection, keyboard input, pointer placement, and touch cancellation stay with the input/Base UI primitive. The label targets the control. The host owns storage, submission, validation rules, asynchronous work, and success/error outcomes; this wrapper does not start an action or render a submit control.

```tsx
import { TextField } from '@zao/react';

<TextField
  label="Workspace name"
  name="workspaceName"
  value={name}
  onChange={(event) => setName(event.currentTarget.value)}
  description="Shown to everyone in the workspace."
  error={error}
/>;
```

Do not treat placeholder text as a name or disable a field merely to prevent editing; use the native read-only contract where appropriate.

## Motion

There is no spatial motion role. The input's `transition-colors duration-fast` changes edge/fill/ink only, currently 80ms from `motion.duration.fast`. Its generated easing remains Tailwind's `cubic-bezier(0.4, 0, 0.2, 1)`, **not** `motion.easing.standard` or a fold role. This source difference is recorded in [motion inventory](../motion.md#additional-generated-state-changes); the current finish does not rewrite that generated emphasis easing.

The well walls do not animate independently. The global reduced-motion safeguard reduces generated durations to 0.01ms; Quiet instrument additionally removes the field-frame transition. No loading rotation, lift, press, reveal, or release choreography is introduced. Forced colors remove inset wall paint while leaving the native control and focus semantics. TextField has no overlay or reduced-transparency treatment.

## Accessibility

- A visible `label` is required by the type. Base UI associates Label, Control, Error, and Description; the native input supplies its appropriate semantics and form value.
- Error text is externally supplied and associated, not a separate automatic live announcement. Preserve the label while providing a clear correction through the host's error copy.
- Native disabled prevents ordinary focus/editing; read-only preserves focus and reading. Keep essential information out of disabled-only ink.
- Focus remains the outside ink outline in either seal. Changing finish, mode, hover, or error does not resize the native frame.
- RTL follows native input direction and layout inheritance; the screen depth axis remains right/up. The wrapper does not add a writing-direction policy.
- Long labels/guidance use surrounding layout; this is a single native input, not a multiline editor or ellipsis component.

Existing coverage: [field family, names, errors, disabled states and sizes](../../apps/docs/e2e/field-family.spec.ts), [field-edge contrast/state assertions](../../apps/docs/e2e/field-edges.spec.ts), [control heights](../../apps/docs/e2e/control-height.spec.ts), and [measured Anatomy](../../apps/docs/e2e/anatomy.spec.ts). These links describe existing coverage. No tests were rerun for this reference-only document and no new accessibility result is claimed.

## Decisions

There is no standalone TextField approval paragraph in [BRIEF.md](../../BRIEF.md#current-design-direction-quiet-construction) to transcribe. Preserve the actual attribution of later decisions rather than create a retrospective BRIEF approval.

| Date / record                                                                                                                                                                   | Present rule and supersession                                                                                                                                                                       | Source reason (summary) or spec scope note                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Oct 7, [field-family request](../../explorations/su-studies/quiet-instrument/design.md)                                                                                         | Square enclosure, local light/dark recess and enabled focus/hover treatment remain requested study material; D9 replaces its earlier default-height split.                                          | Spec scope note: Judge coherence, focus visibility and repeated use before adopting a default.                                                                                    |
| Oct 8, D6, [AGENTS](../../AGENTS.md#the-one-idea-structure-is-shared-finish-is-chosen) and [WP 2.1](../plans/2026-10-improvement/02-fix-list.md#wp-21-field-edges-that-meet-31) | Shared normal/invalid edges and disabled fill; preserve stationary frames, enabled emphasis, outside focus and reduced motion.                                                                      | Source reason (summary): Fix observed field contrast failures; invalid must not be weaker than normal, and disabled differs beyond text. Original values were local study values. |
| Oct 10, D9, [height decision](../plans/2026-10-improvement/decision-drafts/default-height-c.md)                                                                                 | Default control height is 34px; small/large remain 28/40px.                                                                                                                                         | Source reason (summary): Preserve the shared control reference without changing the fen scale.                                                                                    |
| Oct 11, V1b/V2, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                                                                                                  | Field color roles are now published through generated warm neutrals; wells have stepped, unblurred walls. This supersedes D6's pending-color-promotion qualification, not its semantic protections. | Source reason (summary): Warm paper/ink ground and construction without blur; remaining square/dark field recipes stay local.                                                     |
| Oct 11, V1c/V12, [finish authorization](../../AGENTS.md#current-design-direction-quiet-construction)                                                                            | Focus stays ink in either seal; TextField retains `outline-focus`.                                                                                                                                  | Spec scope note: Brackets apply only to Button, IconButton and Switch.                                                                                                            |

Source approvals remain in place. This spec changes no input behavior, token, public prop, or website text; approval migration is separate work.
