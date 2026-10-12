---
name: Progress
status: requested
intent: Show a named task's actual completion against its range without implying a known fraction when completion is unknown.
use-when:
  - A task has an actual current value and a valid minimum and maximum.
  - Completion is unknown and needs an explicit nonquantitative in-progress reading.
avoid-when:
  - A decorative animation would imply invented activity or completion.
  - A comparative dataset needs a chart rather than task progress.
composes-with:
  - Card
parts:
  - root
  - header
  - label
  - value
  - track
  - indicator
motions:
  - slide
tokens:
  - unit
  - type.label
  - font.family.text
  - font.weight.medium
  - space.1
  - space.2
  - space.3
  - stroke.hairline
  - radius.none
  - depth.contact
  - depth.axis.x
  - depth.axis.y
  - color.bg.sunken
  - color.fg.default
  - color.fg.muted
  - color.border.subtle
  - color.border.default
  - color.seal.ink.solid
  - color.seal.ink.border
  - motion.duration.slide
  - motion.easing.slide
---

# Progress

**Reference spec, Oct 11, 2026.** The refinement is requested, not independently approved. This records the current implementation with the authorized finish; the D14 template approval does not approve Progress's interaction or publish a chart API. This is a full reference, not the public page layout.

## Anatomy

Base UI's progress root carries `data-zao-component="progress"` and progressbar semantics. A header keeps the visible task name and formatted reading outside one stationary square recessed track. The quantitative span and visible/accessible readings derive from the same Base UI range, rather than separate specimen values.

| Authored `data-zao-slot` | Role and presence                                                   |
| ------------------------ | ------------------------------------------------------------------- |
| `root`                   | Base UI progress root and full-width layout; always present.        |
| `header`                 | Task-label/readout row, always present.                             |
| `label`                  | Base UI-associated visible task name, always present.               |
| `value`                  | Base UI formatted reading; mounted when `showValue` is true.        |
| `track`                  | Stationary full-range reference and recessed walls, always present. |
| `indicator`              | Base UI quantitative face; mounted but hidden when indeterminate.   |

The track is 2 fen (8px) high and uses `radius.none`. Its hairline perimeter and stepped inner walls paint over the quantitative area without subtracting border width from the data denominator. Indicator depth/contact paint and its end edge remain inside the measured span, including small fractions. Unknown completion replaces the face with a static interrupted full-span reference. There are no separate face, base, end-edge, or reference slots; these are paint on the track and indicator.

The root/header gaps are 2/3 fen. Label/readout use `type-label` with medium label emphasis and tabular value figures; the label can break long text. The quantitative face deliberately reads `color.seal.ink.solid` and `.border`, so an Azurite island does not recolor task data as a primary action. Track, text and reference use semantic neutral roles.

Sources: [implementation and props](../../packages/react/src/components/progress.tsx), [quantitative paint and motion](../../packages/react/src/styles/progress.css), [structure](../../packages/tokens/src/base/space.tokens.json), [type](../../packages/tokens/src/base/type.tokens.json), [Su motion](../../packages/tokens/src/themes/su.tokens.json), [semantic colors](../../packages/tokens/src/modes/light.tokens.json), [Parts](../parts.md), and [data visualization guidance](../data-visualization.md).

## States

| Input or state        | Current contract                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `label`               | Required string, visible and associated with progressbar semantics. Runtime does not enforce nonempty text.                            |
| `value`               | Required `number` or `null`; controlled by the host. A finite value produces a clamped fraction. Null/nonfinite completion is unknown. |
| `min`, `max`          | Default 0 and 100. A usable range requires both finite and `max > min`.                                                                |
| Zero / partial / full | No occupied fraction at minimum; accurate normalized fraction between endpoints; complete at the clamped maximum.                      |
| Indeterminate         | No quantitative face or idle motion. Default visible reading is “In progress.”                                                         |
| Invalid range         | ZAO passes null and a safe 0–100 semantic range to Base UI, rather than inventing zero or dividing by an unusable denominator.         |
| `showValue`           | Defaults true; false removes the visible formatted reading, not the task label or progress semantics.                                  |

There are no variant, size, disabled, read-only, hover, focus, press, selected, error, or loading-lifecycle props. Progress itself is passive; the host owns task status and any completion/failure/empty-state content around it.

## Interaction

The host supplies actual data through `value`, `min`, and `max`; Progress does not simulate updates, time a task, or estimate completion. No inspection gesture is needed to read the task and value. Numeric data is clamped to the valid range, normalized for indicator width, and formatted by Base UI.

Inherited `format` and `locale` control `Intl.NumberFormat`; the default is percentage formatting of the normalized fraction. Inherited `getAriaValueText`/`aria-valuetext` support a meaningful accessible reading. Keep custom formatting truthful to the actual range; an explicit format can show the clamped numeric value rather than a percentage. `className` is layout-only by convention; the type omits `children`, `render`, and `style`. The forwarded ref points to the Base UI div root.

```tsx
import { Progress } from '@zao/react';

<Progress label="Upload" value={uploadedBytes} min={0} max={totalBytes} />;
```

When the denominator or completion is unknown, pass `value={null}`. A separate cancel/retry Button belongs to the host task UI, not inside the progressbar. No Base UI control activation or pointer/key/touch handler is authored here.

## Motion

| Response                          | Tokens                                         | Current Su resolution         |
| --------------------------------- | ---------------------------------------------- | ----------------------------- |
| Actual quantitative width updates | `motion.duration.slide`, `motion.easing.slide` | Grade 7, 157.5ms, fold-enter. |

The first render shows the current width directly. Later data changes transition the indicator width while the track, frame, task label, and neighbors remain fixed. An interruption reverses from the current CSS width; there is no overshoot, simulated data, or indeterminate animation. Role aliases describe data paint, not a promise that the host task takes this duration.

Reduced motion removes the width transition and shows the current fraction immediately. Forced colors use Canvas/CanvasText for the frame/reference and Highlight for the quantitative face, dropping recessed/contact shadows. The track is square and opaque; no facet or reduced-transparency fallback is involved.

Sources: [Progress CSS](../../packages/react/src/styles/progress.css), [role aliases](../../packages/tokens/src/themes/su.tokens.json), and [motion inventory](../motion.md).

## Accessibility

- Base UI supplies the progressbar role, associated visible label, range, clamped `aria-valuenow`, and formatted value text. Unknown completion has no invented numeric reading.
- Keep the task label nonempty and visible. The optional value controls visible composition; it does not remove essential progress semantics.
- The quantitative face, frame and interrupted reference are passive decoration. Do not put controls inside the progressbar or make its reading depend on hover/focus/touch inspection.
- Progress is not a live-announcement lifecycle. The host owns consequential task updates, completion/errors, and a separately named cancel/retry action.
- Logical inset properties make the fraction start at inline start in RTL. Reduced motion and forced colors preserve the same data and unknown-state meaning.

Existing [Progress construction coverage](../../apps/docs/e2e/progress-construction.spec.ts), [interruption coverage](../../apps/docs/e2e/motion-interruption.spec.ts), and [Anatomy coverage](../../apps/docs/e2e/anatomy.spec.ts) address zero/full/fractional/custom/invalid ranges, readable unknown state, quantitative span, RTL, reduced motion, forced colors and width reversal. These links are existing coverage, not a fresh result; no tests were run for this reference.

## Decisions

### Oct 7: exact BRIEF request

From [BRIEF.md](../../BRIEF.md#current-design-direction-quiet-construction), unchanged. This is a request, not an independent component approval.

> **Requested Progress refinement, Oct 7:** Apply clear task hierarchy to one square stationary recessed track, one advancing quantitative face, and a contact edge. Follow the [data visualization guideline](docs/data-visualization.md): derive geometry and readings from the same value, expose essential information directly, and show unknown completion without a filled fraction. The first reading appears immediately; actual changes use existing finish motion and reduced motion shows the destination immediately. Preserve Base UI semantics, formatting, clamping, and RTL; invalid ranges remain unknown. This component request adds no tokens, dependencies, or public props. Its usability benefits remain to be judged in context.

The link inside that exact source quotation is relative to BRIEF's location. The current reference's usable link is [data visualization guideline](../data-visualization.md); the original wording is preserved rather than rewriting its source attribution.

### Later records and scope

| Date and source                                                                                               | Current effect                                                                                  | Source reason or spec scope note                                                                                      |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Oct 10 D11, [historical motion record](../plans/2026-10-improvement/decision-drafts/motion-values-current.md) | The slide vocabulary survives; old 160ms/common easing values read through V5/V6.               | Spec scope note: preserve the role contract without treating the superseded finish values as concurrent requirements. |
| Oct 11 V1/V5/V6, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                               | Data keeps ink rather than the optional action seal; width updates use the derived slide alias. | Source reasons, summarized: the chosen seal's restricted role and motion derived from the building rule.              |

Spec scope note: the finish's stepped wells refine the existing recessed track without creating another quantitative plane. The implementation and request preserve truthful data and passive semantics, but do not establish measured usability benefits, a chart library API, or approval of other chart interactions. Source request text remains in place for the separate migration.
