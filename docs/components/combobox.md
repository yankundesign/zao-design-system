---
name: Combobox
status: requested
intent: Filter a labeled set by typing and commit one existing option.
use-when:
  - A single-choice field needs text filtering to find an existing option.
  - The person must distinguish a search query from the committed form value.
avoid-when:
  - A short fixed list needs only Select and its typeahead.
  - Arbitrary text entry belongs in TextField rather than a closed option set.
composes-with: []
parts:
  - root
  - label
  - input-group
  - input
  - clear-space
  - clear
  - trigger
  - portal
  - popup
  - viewport
  - empty
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

# Combobox

**Reference contract, Oct 11, 2026.** The [D14 template](_template.md) is approved. Combobox's whole field-family treatment remains requested. D6 approves field edges and D8 approves item emphasis/corners; grouped focus, enclosure and Pocket reveal remain the existing local study. This full reference is not the public page layout.

## Anatomy

The outer field carries `data-zao-component="combobox"`. A native label targets the generated input ID. Base UI owns the editable combobox, the selected string/null, auxiliary native actions and option list. The input-group frame and native targets stay fixed; the input text does not ride a lifted face.

| Literal `data-zao-slot`             | Owner and presence                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `root`, `label`                     | Always-present wrapper and native label associated by `htmlFor`.                                       |
| `input-group`, `input`              | Stationary recessed group and native BaseCombobox.Input.                                               |
| `clear-space`                       | Always-present 7-fen (28px) carrier, retaining input width when Clear is absent.                       |
| `clear`                             | Base UI clear button, mounted as the selected-value lifecycle requires; no `keepMounted` override.     |
| `trigger`                           | Native button named `Open ${label} options`, with decorative caret.                                    |
| `portal`                            | Local Base UI portal wrapper using `contents` to avoid a flex-layout box.                              |
| `popup`, `viewport`, `list`         | Conditional floating frame, available-height scroll viewport and named option list.                    |
| `empty`                             | Base UI empty-filter result; visible text is `No matches found.`                                       |
| `item`, `item-text`                 | Filtered option target and its label.                                                                  |
| `indicator-space`, `item-indicator` | Reserved 16px mark carrier and conditionally mounted committed-value checkmark.                        |
| `reveal-edge`                       | Decorative sibling of viewport; package hook whose moving-lip styling exists only in Quiet instrument. |
| `error`, `description`              | Associated guidance siblings when the corresponding content is truthy.                                 |

Input-group frame markers, option values, last exit highlight, Base UI focus guards and hidden form inputs are not additional slots or public props. The popup's own pseudo-elements draw its two banded planes; physical side/base/joint and recessed wall concepts create no elements.

The outer field uses a 1-fen (4px) gap. Heights are 28/34/40px; default reads `size.control.md`, others use `h-7`/`h-10` from `unit` (4px). Labels use `type-label` with medium weight; input/options `type-body` (14px, 20px line box); guidance and empty state `type-caption`. Input side padding is 2 fen (8px). Clear/trigger use 28px minimum width and 24px minimum height, with 16px decorative SVGs; they are Base UI native actions, not IconButton or Button construction.

Published group corners are `radius.control` (Su 2px), canvas fill, and stepped `construction-well field-well`. Quiet instrument squares the group, maps its light/dark wells, makes the input backing transparent, and draws one outside group outline. Published options use square corners and `min-h-7` (28px); the study adds row padding and wrapping labels instead of published truncation.

Popup placement is below/start with literal 4px offset and flip/shift; width is capped to anchor and available space. Static Su popup paint uses opaque material, two unblurred side planes at control rest depth (3px), and a 5px leading bevel where supported; fallback stays square. Shared plane reach also reads surface rest/lift without granting popup hover travel. Material overlay radius/shadow are intermediate utility dependencies overridden by popup construction. Metadata includes the study's motion and field-role dependencies as well as published ones.

Sources: [implementation/types](../../packages/react/src/components/combobox.tsx), [highlight helper](../../packages/react/src/components/use-field-popup.ts), [theme utilities](../../packages/react/src/styles/theme.css), [local study CSS](../../explorations/su-studies/quiet-instrument/style.css), [structure](../../packages/tokens/src/base/space.tokens.json), [Su finish](../../packages/tokens/src/themes/su.tokens.json), [light](../../packages/tokens/src/modes/light.tokens.json) / [dark](../../packages/tokens/src/modes/dark.tokens.json) colors, and [Parts](../parts.md).

## States

| State/input        | Current contract                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Size               | `small`, `default` (default), `large`; same label/text roles and option-row minimum.                                                                                      |
| No selection       | Optional placeholder, default `Choose an option`; Clear is absent but reserved space remains.                                                                             |
| Filtering          | Input query filters the existing option set; typing alone does not create a new selected value.                                                                           |
| No matches         | `No matches found.`; this is an empty result, not automatic invalid/error state.                                                                                          |
| Rest/hover/focus   | Published canvas well and field edge; normal enabled hover uses `border-strong`. Study adds square light/dark frame, focus-within emphasis and one outside group outline. |
| Invalid            | Truthy external error supplies group marker, input `aria-invalid`, invalid edge and associated error. Invalid overrides normal hover.                                     |
| Disabled field     | Base UI prevents editing/opening/clearing; disabled ink and fill. In the study the noninvalid disabled edge is subtle; invalid wins when combined.                        |
| Disabled option    | Identified, without active emphasis or value commitment.                                                                                                                  |
| Highlighted option | Enabled navigation fill only; input retains focus and virtual option highlighting.                                                                                        |
| Selected option    | Independent checkmark identifies the committed value; highlighting a different row does not replace it.                                                                   |
| Closing            | Last highlight paint persists through dismissal using presentation-only state.                                                                                            |

There is no exposed read-only, loading, freeform creation, multiple-selection, input-query state, or controlled-open API. The host supplies options and externally validated error content; the wrapper does not implement async search or a fetching state. Published field-role contrast promises apply to normal/invalid edges on canvas and surface, not disabled-only ink.

**Editorial explanation:** reserved clear space lets value clearing change content without changing the editing area; virtual highlighting keeps text entry and option navigation in one focus model. These are source-grounded explanations, not measured usability benefits.

## Interaction

| Public input                   | Contract                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `label`, `options`             | Required string name and readonly `{ value: string; label: string; disabled?: boolean }[]`; values must be unique. |
| `value`, `defaultValue`        | Optional selected string/null, controlled or initial uncontrolled value. These are not query text.                 |
| `onValueChange`                | Receives the committed string/null; wrapper type does not expose Base UI event details.                            |
| `placeholder`                  | Defaults to `Choose an option`.                                                                                    |
| `description`, `error`         | Optional associated React content; truthy error controls explicit invalid treatment.                               |
| `name`, `required`, `disabled` | Delegated form and availability behavior.                                                                          |
| `size`, `className`            | Default size; outer field layout classes.                                                                          |

The wrapper exposes no forwarded ref, native input prop spread, `style`, arbitrary renderer, filter function, custom item renderer or popup-position props. `createItems` memoizes options with their existing value/label and leaves filtering, input query, keyboard navigation, selection and cancellation to Base UI.

Typing filters; arrows highlight options; Enter commits the highlighted enabled option. Pointer/touch can select the same native targets. Escape dismisses without treating unmatched text as a committed option. Clear is named `Clear ${label}` and clears selection; its fixed carrier prevents the input from growing when the button unmounts. Trigger toggles the option panel. The host owns data loading, persistence, form submission, external validation, and outcome announcements.

Local portal inheritance preserves finish/mode/direction. `useFieldPopup` tracks the virtual/pointer highlighted value solely to retain closing fill; it does not select a value. Portal `contents` prevents an opening flex gap.

```tsx
import { Combobox } from '@zao/react';

<Combobox
  label="Workspace"
  name="workspace"
  value={workspace}
  onValueChange={setWorkspace}
  options={workspaces}
  description="Choose an existing workspace."
/>;
```

## Motion

Published group emphasis is generated `transition-colors duration-fast`, currently 80ms, retaining Tailwind's `cubic-bezier(0.4, 0, 0.2, 1)` rather than a ZAO fold/standard easing token. It does not move the group or input. Published popup planes are static: Combobox's package popup does not apply `menu-construction` or its reveal transition.

Front matter lists `reveal`/`reveal-exit` for the **local Quiet instrument recipe only**. Registered progress clips a full-size stationary panel and carries the noninteractive lip with collision placement. Opening reads reveal/reveal easing (grade 5, 198ms/fold-enter); closing reads reveal-exit/exit easing (80ms/fold-exit). Lip thickness reads `depth.contact` (1px). Labels/targets do not stagger or travel, and the lip is outside the scrolling viewport. CSS supports changing the unfinished target; this source review supplies no fresh interruption result.

Reduced motion removes study group/reveal transitions and shows the full frame immediately; published generated color emphasis uses the existing global 0.01ms safeguard. Base UI instant paths skip study reveal. Forced colors hide plane paint, preserve native/system outlines and use Highlight/HighlightText for enabled navigation fill. Reduced transparency and unsupported backdrop filtering select solid overlay fill; Su is already opaque, with zero blur. Bevel fallback is square.

Sources: [current motion rules, study inventory and generated emphasis](../motion.md) and [motion configuration](../../packages/tokens/motion.config.ts).

## Accessibility

- Required native label names the editable input. Base UI supplies combobox/listbox relationships and virtual active-descendant navigation; keyboard option navigation keeps input focus rather than adding an item focus outline.
- Published input, Clear and Trigger keep `outline-focus`. Quiet instrument deliberately replaces their individual focus outlines with one outside group outline covering auxiliary actions. Neither treatment uses brackets.
- Clear and Trigger have generated accessible action labels; caret/cross/check SVGs and the reveal lip are decorative. Selected checkmarks remain distinct from navigated fill.
- Error and description are linked by `aria-describedby`, with error also setting input `aria-invalid`. They do not automatically announce async search or action outcomes.
- `name` and `required` integrate the selected value with Base UI form behavior; typed unmatched query text is not a new option value. The host must not infer a committed value from the displayed query.
- Local portals inherit direction and finish; collision flip/shift and scrolling use available space. RTL changes logical order, not the screen depth/facet direction. Trigger's current padding uses physical `pl-1 pr-2`; the wrapper has no additional RTL padding override.

Existing coverage: [filtering/clear/selection/form/field geometry](../../apps/docs/e2e/field-family.spec.ts), [edges](../../apps/docs/e2e/field-edges.spec.ts), [portal layout](../../apps/docs/e2e/field-portal-layout.spec.ts), [emphasis/forced colors/RTL](../../apps/docs/e2e/menu-item-emphasis.spec.ts), [primitive interaction](../../apps/docs/e2e/new-components.spec.ts), and [interruption probes](../../apps/docs/e2e/motion-interruption.spec.ts). No tests were rerun for this reference-only change, and no new pass or complete contrast verification is claimed.

## Decisions

No standalone Combobox approval paragraph exists in [BRIEF.md](../../BRIEF.md#current-design-direction-quiet-construction). The requested whole-component treatment and approved subsets keep their original source attribution.

| Date / source                                                                                                                                                                 | Present rule or supersession                                                                                                                                                                      | Source reason (summary) or spec scope note                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Oct 7, [field-family request](../../explorations/su-studies/quiet-instrument/design.md)                                                                                       | Square recessed enclosure, reserved clear space, group focus, Pocket reveal, stationary wrapping labels and closing emphasis are local studies. Earlier general-height split is superseded by D9. | Spec scope note: Judge coherence, focus, selection, narrow layouts and repeated use before adopting the recipe as a default. |
| Oct 8, D6, [AGENTS](../../AGENTS.md#the-one-idea-structure-is-shared-finish-is-chosen) / [WP 2.1](../plans/2026-10-improvement/02-fix-list.md#wp-21-field-edges-that-meet-31) | Approves shared normal/invalid field edges and disabled fill, preserving native frame and outside focus.                                                                                          | Source reason (summary): Correct measured contrast failures and distinguish disabled beyond text.                            |
| Oct 9, D8, [item decision](../plans/2026-10-improvement/decision-drafts/menu-item-b.md)                                                                                       | Approves fill-only enabled navigation, square rows, input focus/virtual highlighting and independent committed marks.                                                                             | Source reason (summary): One navigation cue while keeping focus and committed selection distinct.                            |
| Oct 10, [portal correction](../../AGENTS.md#the-one-idea-structure-is-shared-finish-is-chosen) / [D9](../plans/2026-10-improvement/decision-drafts/default-height-c.md)       | No portal flex box; shared 34px default.                                                                                                                                                          | Source reason (summary): Prevent measured opening gaps without changing field targets.                                       |
| Oct 11, V1b/V2–V6/V12, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                                                                                         | Published field roles, stepped wells, banded popup planes and leading facet. Study reveals use derived role values, replacing D11's old timings/curves. Fields keep outlines, not brackets.       | Source reason (summary): Warm ink, no blurred depth, rule-derived motion; shared tokens do not promote every local recipe.   |

Approvals stay in their source files. This reference adds no prop, hook, interaction, token, dependency, or public page content.
