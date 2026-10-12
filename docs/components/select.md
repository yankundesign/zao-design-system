---
name: Select
status: requested
intent: Choose one value from a fixed labeled set without editing free text.
use-when:
  - A field has a fixed set of named choices.
  - Keyboard typeahead is sufficient to find a choice.
avoid-when:
  - A long list needs typed filtering through Combobox.
  - An action list belongs in Menu rather than a form-value picker.
composes-with: []
parts:
  - root
  - label
  - trigger
  - value
  - icon
  - portal
  - popup
  - viewport
  - list
  - item
  - item-text
  - indicator-space
  - item-indicator
  - reveal-edge
  - error
  - description
motions:
  - reveal
  - reveal-exit
tokens:
  - unit
  - type.label
  - type.body
  - type.caption
  - font.weight.medium
  - size.control.md
  - space.0-5
  - space.1
  - space.2
  - radius.control
  - radius.none
  - radius.overlay
  - radius.facet
  - depth.contact
  - depth.rest.control
  - depth.rest.surface
  - depth.lift
  - depth.axis.x
  - depth.axis.y
  - color.bg.canvas
  - color.bg.sunken
  - color.bg.field-disabled
  - color.bg.hover
  - color.fg.default
  - color.fg.muted
  - color.fg.disabled
  - color.border.field
  - color.border.field-invalid
  - color.border.strong
  - color.border.subtle
  - color.border.default
  - color.danger.text
  - color.focus.ring
  - material.overlay.fill
  - material.overlay.fill-solid
  - material.overlay.border
  - material.overlay.shadow
  - material.overlay.blur
  - motion.duration.fast
  - motion.duration.reveal
  - motion.easing.reveal
  - motion.duration.reveal-exit
  - motion.easing.exit
---

# Select

**Reference contract, Oct 11, 2026.** The [D14 template](_template.md) is approved. The whole field-family treatment remains requested. D6 approves field edges and D8 approves item emphasis/corners; Select's Pocket reveal and square/dark enclosure remain the existing local study. The full reference is not the website page layout.

## Anatomy

The labeled outer wrapper carries `data-zao-component="select"`. Base UI Select owns the single selected string/null value, a native button trigger with combobox semantics, option list, and hidden form input when applicable. This is not a native HTML `<select>` and is not a shared raised Button trigger. The recessed field and its target remain stationary.

| Literal `data-zao-slot`    | Owner and presence                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `root`, `label`            | Outer field and BaseSelect.Label, always rendered.                                                           |
| `trigger`, `value`, `icon` | Native trigger, committed-value/placeholder carrier, and decorative caret.                                   |
| `portal`                   | BaseSelect.Portal mounts floating content into the local outer wrapper; `contents` avoids a flex-layout box. |
| `popup`                    | Floating frame, mounted through Base UI's open/close lifecycle.                                              |
| `viewport`, `list`         | Bounded scrolling region and named BaseSelect.List.                                                          |
| `item`, `item-text`        | One option and label per supplied option.                                                                    |
| `indicator-space`          | A permanent 4-fen (16px) carrier per option, retaining row geometry.                                         |
| `item-indicator`           | Base UI mounts the committed-value checkmark as appropriate.                                                 |
| `reveal-edge`              | Decorative sibling of the viewport; authored in the package, but moving-lip styling is study-only.           |
| `error`, `description`     | Outer guidance siblings, each mounted when its corresponding content is truthy.                              |

Base UI positioners, focus guards, and hidden form inputs are not additional authored slots. `data-zao-field-frame`, invalid/disabled markers, `data-zao-option-value`, and the transient exit-highlight marker are existing attributes, not parts or props. Popup `::before`/`::after` paint the two banded planes; no separate side/base/joint slot exists.

Fields use a 1-fen vertical gap, 2-fen horizontal padding/gap, `type-label` labels, `type-body` value/options, and `type-caption` guidance. Heights are 28/34/40px; default reads `size.control.md`, other sizes use `h-7`/`h-10` from the 4px `unit`. Published trigger corners use `radius.control` (2px Su), canvas fill, and stepped `construction-well field-well`. Published option rows have `min-h-7` (28px), square corners, and 8px horizontal padding. The study adds 4px row padding, removes viewport side padding, and wraps option text; published value/item labels truncate instead.

The popup defaults below/start with a literal 4px positioning offset and flip/shift collision avoidance; width is `min(anchor-width, available-width)`, with available-height scrolling. Its opaque Su material uses shared shading, control rest depth (3px), two unblurred side planes, and a 5px leading bevel where supported; fallback is square. `depth.rest.surface` and `depth.lift` bound shared plane paint reach, not popup hover travel. `radius.overlay`/material shadow are utility dependencies whose final popup treatment is overridden by construction.

Sources: [implementation/types](../../packages/react/src/components/select.tsx), [exit-highlight helper](../../packages/react/src/components/use-field-popup.ts), [shared utilities](../../packages/react/src/styles/theme.css), [local field study](../../explorations/su-studies/quiet-instrument/style.css), [structure](../../packages/tokens/src/base/space.tokens.json), [Su finish](../../packages/tokens/src/themes/su.tokens.json), [mode colors](../../packages/tokens/src/modes/light.tokens.json), and [Parts](../parts.md).

## States

| State/input        | Current contract                                                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Size               | `small`, `default` (default), `large`; same text roles and option-row size.                                                                                                                                 |
| Empty value        | `null` or no selection shows `placeholder`, default `Select an option`; placeholder does not replace the label.                                                                                             |
| Rest/hover/focus   | Published canvas well with `border-field`; enabled, noninvalid hover uses `border-strong`. Outside ink keyboard outline stays fixed. Study adds square light/dark enclosure and focus-within edge emphasis. |
| Invalid            | Truthy `error` supplies invalid marker, `aria-invalid`, invalid edge, and associated error text. Invalid wins over normal hover.                                                                            |
| Disabled field     | Base UI blocks opening/selection; disabled label/value and field-disabled fill. Local noninvalid disabled border is subtle; invalid edge still wins.                                                        |
| Disabled option    | Visible disabled label, no active fill and no value commitment. Focus/navigation details remain Base UI's behavior.                                                                                         |
| Highlighted option | Enabled navigation uses fill only, with no inset mark. Keyboard focus outline remains independent.                                                                                                          |
| Selected option    | Committed value retains its checkmark independently of the currently highlighted row.                                                                                                                       |
| Closing            | The last highlighted option's fill is retained through dismissal using presentation state.                                                                                                                  |

No public read-only, loading, clear-action, invalid Boolean, or controlled-open prop is exposed. An empty `options` array yields no options; there is no authored empty-results message. D6's published field roles promise at least 3:1 on canvas/surface for normal and invalid edges, rather than a minimum for disabled ink.

**Editorial explanation:** the checkmark answers which value is committed while fill answers which row is being navigated. This describes the source/approval distinction and claims no measured usability gain.

## Interaction

| Public input                   | Contract                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `label`, `options`             | Required visible name and readonly `{ value: string; label: string; disabled?: boolean }[]`. Use unique values. |
| `value`, `defaultValue`        | Optional string or null; controlled selection or uncontrolled initial selection.                                |
| `onValueChange`                | Callback receiving the committed string/null; Base UI event details are not exposed by this wrapper type.       |
| `placeholder`                  | Defaults to `Select an option`.                                                                                 |
| `description`, `error`         | Optional associated React content; error truthiness controls explicit invalid treatment.                        |
| `name`, `required`, `disabled` | Optional form/native-primitive behavior delegated to Base UI.                                                   |
| `size`, `className`            | Default size; string layout classes on the outer field.                                                         |

There is no forwarded ref, arbitrary native-prop spread, `style`, renderer, multiple selection, custom item content, or popup-position API. Base UI owns pointer/touch activation, keyboard arrows and typeahead, selection, dismissal, and trigger focus. Escape dismisses without committing a different highlighted value. A label names the trigger/list. The host owns option data, persistence, form submission, external validation, and result announcements.

The popup remains locally mounted so finish/mode/direction inherit. `useFieldPopup` stores only exit-emphasis presentation state; it does not implement selection or filtering. Portal `display: contents` prevents opening from adding a flex gap or shifting neighboring controls.

```tsx
import { Select } from '@zao/react';

<Select
  label="Region"
  name="region"
  value={region}
  onValueChange={setRegion}
  options={[
    { value: 'west', label: 'West' },
    { value: 'central', label: 'Central' },
  ]}
/>;
```

## Motion

The published field only generates color emphasis through `transition-colors duration-fast`: 80ms, with retained generated `cubic-bezier(0.4, 0, 0.2, 1)` easing. It does not use a fold curve for that emphasis. Published popup planes are static; the package does **not** apply `menu-construction` or a reveal transition to Select.

The metadata's `reveal`/`reveal-exit` roles describe the existing Quiet instrument recipe only. It clips the stationary popup on registered progress and moves the decorative lip from the collision-resolved joint: `motion.duration.reveal`/`motion.easing.reveal` resolve to grade 5, 198ms/fold-enter; closing uses `motion.duration.reveal-exit`/`motion.easing.exit`, 80ms/fold-exit. `depth.contact` gives the lip thickness. There is no row stagger or independent label movement. The CSS may reverse unfinished progress; no fresh reversal result is claimed here.

Base UI instant paths suppress the study reveal. Reduced motion shows the completed frame immediately and removes study frame/reveal transitions; published generated color emphasis retains the global 0.01ms safeguard. Forced colors remove plane paint and keep highlighted enabled options visible with Highlight/HighlightText. Material reduced-transparency/unsupported-backdrop-filter paths use solid fill; Su is already opaque with zero blur. Unsupported bevel stays square.

Sources: [current motion rules and dated field inventory](../motion.md), [motion configuration](../../packages/tokens/motion.config.ts), and the package/study CSS above.

## Accessibility

- Required visible label names the trigger; Base UI supplies combobox/listbox/option relationships and keyboard navigation. Disabled items stay identified and cannot commit values.
- The native trigger has an outside ink outline. Keyboard-focused Select items keep their own outline; committed checkmarks and highlighted fill remain distinct.
- Error/description IDs are supplied through `aria-describedby`; error also sets `aria-invalid`. These are associated text, not automatic live result announcements.
- The host uses `name`/`required` for Base UI form integration. Do not equate the custom button trigger with a native HTML select or expose hidden form inputs as parts.
- Local portal inheritance and flip/shift positioning retain mode/finish, RTL placement and available-space scrolling. The screen depth/facet direction is not mirrored by RTL.
- Published labels truncate; the existing study wraps option labels without moving their targets. Keep the full accessible label intact when choosing concise visible copy.

Existing coverage: [field family/input/selection](../../apps/docs/e2e/field-family.spec.ts), [field edges](../../apps/docs/e2e/field-edges.spec.ts), [portal layout](../../apps/docs/e2e/field-portal-layout.spec.ts), [item emphasis/forced colors/RTL](../../apps/docs/e2e/menu-item-emphasis.spec.ts), [primitive behavior](../../apps/docs/e2e/new-components.spec.ts), and [interruption coverage](../../apps/docs/e2e/motion-interruption.spec.ts). No suites were rerun for this reference-only document; links do not assert a new pass.

## Decisions

No standalone Select approval paragraph exists in [BRIEF.md](../../BRIEF.md#current-design-direction-quiet-construction). The whole-component status remains requested, with these attributed subsets:

| Date / source                                                                                                                                                                 | Current rule or supersession                                                                                                                                                                                      | Source reason (summary) or spec scope note                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Oct 7, [field-family request](../../explorations/su-studies/quiet-instrument/design.md)                                                                                       | Square enclosure, recessed light/dark treatment, grouped focus, collision-aware Pocket reveal and wrapping labels remain local study treatments. Its earlier split control-height discussion is superseded by D9. | Spec scope note: Judge coherence, focus visibility, selection and repeated use before adopting the recipe as a default.   |
| Oct 8, D6, [AGENTS](../../AGENTS.md#the-one-idea-structure-is-shared-finish-is-chosen) / [WP 2.1](../plans/2026-10-improvement/02-fix-list.md#wp-21-field-edges-that-meet-31) | Approves shared field-edge and disabled-fill roles, stationary geometry and invalid precedence.                                                                                                                   | Source reason (summary): Address observed contrast failures without making disabled rely on text alone.                   |
| Oct 9, D8, [item decision](../plans/2026-10-improvement/decision-drafts/menu-item-b.md)                                                                                       | Approves fill-only enabled navigation and square rows; keep keyboard outline and independent committed checkmark.                                                                                                 | Source reason (summary): One navigation cue, consistent corners, focus/selection remain distinct.                         |
| Oct 10, [portal protection](../../AGENTS.md#the-one-idea-structure-is-shared-finish-is-chosen) / [D9](../plans/2026-10-improvement/decision-drafts/default-height-c.md)       | Portal wrapper has no flex box; default height is shared 34px.                                                                                                                                                    | Source reason (summary): Correct a measured opening gap and preserve the shared native target.                            |
| Oct 11, V1b/V2–V6/V12, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                                                                                         | Promotes field colors; wells/planes/facet follow shared construction; study reveal reads derived role values, superseding D11's 160ms/common-curve values. Select focus remains an outline.                       | Source reason (summary): Generated warm ink, unblurred depth, rule-derived motion; brackets do not apply to fields/items. |

The finish authorizes shared values without promoting every local component recipe. Source approvals remain in place; this document changes no runtime, prop, token, or website text.
