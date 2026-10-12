---
name: Button
status: approved
intent: Perform one explicit action through a stationary native button with a readable label.
use-when:
  - A person commits an action such as saving, creating, or deleting.
  - A labeled action opens an existing Menu or Dialog through its owning trigger.
avoid-when:
  - Navigation requires a link with an href.
  - An icon-only action needs IconButton's required label and tooltip.
  - A persistent setting or view needs Switch or Tabs.
composes-with:
  - Card
  - Dialog
  - Menu
  - IconButton
  - Conversation
  - Message
parts:
  - side
  - face
  - button-content
  - button-label
  - leading-icon
  - trailing-icon
  - trailing-action
  - spinner
  - loading-overlay
  - loading-announcement
motions:
  - lift
  - seat
tokens:
  - unit
  - type.button
  - font.family.text
  - size.control.md
  - size.icon.sm
  - size.icon.md
  - space.0-5
  - space.1
  - space.1-5
  - space.2
  - space.4
  - stroke.hairline
  - radius.action
  - radius.facet
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
  - color.border.default
  - color.border.subtle
  - color.danger.text
  - color.focus.ring
  - motion.duration.lift
  - motion.easing.lift
  - motion.duration.seat
  - motion.easing.seat
  - motion.duration.fast
  - motion.easing.standard
  - motion.duration.grade.7
  - motion.easing.fold-enter
  - motion.duration.loading
---

# Button

**Template approved Oct 11, 2026 (D14).** Yankun accepted the structure of this pilot and the [reusable template](_template.md). Button's design status comes from its existing component and finish approvals. The current contract below follows the authorized Oct 11 finish. Earlier approval text is preserved in Decisions with explicit supersession. Source approvals have not been removed or migrated.

## Anatomy

The native `<button>` carries `data-zao-component="button"`. It owns activation, the hit target, and keyboard focus. The face carries the label and icons; these travel together while the native box and neighbors stay fixed. This preserves a predictable target while the paint supplies feedback.

| Literal `data-zao-slot`         | Role and presence                                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `side`                          | Always present, decorative and noninteractive. Its `::before` and `::after` paint the two joined side planes, each with two flat bands. |
| `face`                          | Always present. The reading plane and its semantic perimeter; the only content plane that moves.                                        |
| `button-content`                | Label and leading/trailing icon group; mounted when any icon prop is supplied or `loading` is defined.                                  |
| `button-label`                  | Children within that group. Plain children otherwise sit directly in `face`.                                                            |
| `leading-icon`, `trailing-icon` | Decorative icon carriers, mounted when the corresponding prop is supplied.                                                              |
| `trailing-action`               | Decorative indicator pinned to the logical end. It does not create another action or target.                                            |
| `spinner`                       | One decorative pending indicator, present while loading.                                                                                |
| `loading-overlay`               | Centered pending indicator when no icon carrier exists; overlays the retained label.                                                    |
| `loading-announcement`          | Visually hidden sibling after the native button, mounted whenever `loading` is defined, including `false`.                              |

The **base is a construction concept**, not a `base` slot or a separately painted element. It is the fixed far edge where the planes end, one rest depth behind the resting face. The root's `::after` draws focus brackets; it does not draw a side plane. Qualify hooks by their Button owner, including when another component reuses Button.

Structure uses the fen unit and `type-button`: currently 14px Geist, weight 500, an untrimmed 18px line box, and zero tracking. The default face has 16px horizontal and 8px vertical padding. Small/default icons use `size.icon.sm` (16px); large uses `size.icon.md` (20px). Content gaps use `space.2` (8px). The native minimum width is 7 fen (28px).

The face uses `rounded-action` (Su: 0px). Its leading top-right corner uses `radius.facet` (5px) only with `corner-shape: bevel` support; otherwise it stays square. The screen axis stays right/up in RTL. Side paint reads `construction-shading` through `--zao-construction-face` and `construction-planes`: crisp bands and zero-blur spreads, with no larger DOM box or scrollable plane overflow. Primary side tones step toward black in both modes; other faces follow the shared light/dark shade rule.

The metadata lists token dependencies used directly or through shared utilities. `depth.rest.surface` bounds the shared plane paint reach; it is **not** Button's rest depth. Button's current face perimeter is a literal 1px inset drawing in `theme.css`; the spinner reads `stroke.hairline`. `size.button.default` remains a compatibility alias, while Button reads `size.control.md` through `h-control`. Small and large use `h-7` / `h-10`, derived from `unit`.

Sources: [Button implementation and types](../../packages/react/src/components/button.tsx), [construction, focus, and loading utilities](../../packages/react/src/styles/theme.css), [structural tokens](../../packages/tokens/src/base/space.tokens.json), [type roles](../../packages/tokens/src/base/type.tokens.json), [Su finish](../../packages/tokens/src/themes/su.tokens.json), [mode mappings](../../packages/tokens/src/modes/light.tokens.json), and [Parts](../parts.md).

## States

| Prop      | Allowed values                            | Default   |
| --------- | ----------------------------------------- | --------- |
| `variant` | `primary`, `secondary`, `quiet`, `danger` | `primary` |
| `size`    | `small`, `default`, `large`               | `default` |
| `block`   | Boolean; fill the available width         | `false`   |

Small/default/large heights are currently 28/34/40px. Small horizontal padding is 8px; default and large use 16px. Size changes preserve the same type role. Use the explicit small size for a compact toolbar; retain the shared 34px default elsewhere.

| Variant     | Current semantic treatment and use                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `primary`   | Main action in a group. Seal face and on-accent ink; Ink is default, Azurite is inherited from `data-zao-seal="azurite"`. |
| `secondary` | Supporting action. Surface face, default ink and default edge.                                                            |
| `quiet`     | Low-emphasis action. Transparent at rest, with no resting side planes; hover or press supplies its face and planes.       |
| `danger`    | Destructive action. Secondary construction with danger text; it is not a filled primary seal.                             |

| State                           | Paint and behavior                                                                                                                                                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest                            | Primary, secondary, and danger sit `depth.rest.control` (currently 3px) above the fixed base. Quiet has zero resting depth.                                                                                                                   |
| Fine-pointer hover              | Face and content lift by `depth.lift` (2px), making 5px face-to-base separation. Primary/secondary/danger use spatial feedback without a stronger border or a hover fill change in normal motion. Quiet gains a surface face and subtle edge. |
| Held press                      | Face and content seat onto the same fixed base. Primary uses solid-hover fill; secondary/danger use active fill; quiet uses hover fill. Keyboard/touch press supplies quiet's control rest depth before seating.                              |
| Release                         | Return from the current pose to hover or rest, according to the native pointer/input state.                                                                                                                                                   |
| Keyboard focus                  | Four outside ink brackets register to the native box, independently of the face. Both seals retain the same ink focus role.                                                                                                                   |
| Native disabled                 | No activation or ordinary tab stop. Face sits flat, with sunken fill and disabled ink; secondary/danger retain a subtle perimeter, quiet stays transparent.                                                                                   |
| Loading, without `disabled`     | Busy and unavailable but focusable. Blocks repeated activation and hover/press motion; retains the variant's resting paint rather than the native-disabled flat treatment.                                                                    |
| `disabled` and loading together | Explicit disabled takes precedence over loading's focus retention.                                                                                                                                                                            |

There is no intrinsic selected, invalid, or read-only state. A popup owner's open state belongs to that component; Menu adds its own trigger emphasis. Do not use Button paint as a persistent setting or view-selection model.

## Interaction

Use a visible label that names the result, such as “Save draft.” Use primary for the main action and secondary/quiet for support. Use IconButton for an icon-only action, Menu for a real popup, and Dialog's shared trigger/close for modal actions. Card and Message contain explicit Button actions; IconButton, Menu, Dialog, and Conversation.Latest reuse the shared Button contract. Do not nest interactive children inside a Button.

| Public input                                    | Contract                                                                                                                                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`                                      | React content forming the visible action label; keep the label stable during pending work.                                                                                                     |
| `leadingIcon`, `trailingIcon`, `trailingAction` | Optional SVG component types compatible with Iconoir. All are decorative; `trailingAction` is an indicator.                                                                                    |
| `loading`                                       | Optional controlled Boolean. Button does not await a callback or start an async action itself. Supply `false` from the first render for an async action so its live region is already mounted. |
| `loadingAnnouncement`                           | Polite pending text; default `Loading`. Prefer a task name such as “Saving draft.”                                                                                                             |
| `disabled`                                      | Inherited Boolean; false when omitted. Explicit disabled also prevents focus retention while loading.                                                                                          |
| `type`                                          | `button`, `submit`, or `reset`; defaults to `button`, preserving explicit form intent.                                                                                                         |
| `className`                                     | Layout classes, such as width. Keep construction, type, focus, and state paint in the shared utilities.                                                                                        |
| Native attributes and handlers                  | Inherited Base UI button attributes, events, and form behavior. The forwarded ref is typed `HTMLElement`; the rendered action is a native button.                                              |

The public type omits `render`, `nativeButton`, `focusableWhenDisabled`, and `style`. Use a link for navigation; these omitted escape hatches are not ZAO Button API.

Native/Base UI behavior owns pointer clicks and Enter/Space activation. Button's held-input flags provide visual poses only. Preventing the supplied key/pointer-down event prevents that held pose. Key release, blur/window blur, pointer release/cancellation/lost capture/leave, or movement outside the native target clears it; becoming unavailable clears it too. Touch/nonmouse primary input receives held feedback without waiting for a browser's deferred `:active` state.

Loading replaces one visual in this order: leading icon, trailing icon, trailing action, then a centered label overlay. Other icons remain present. The retained label keeps the accessible name and, with stable content, width. The host owns pending state, the actual action, completion/error messages, and retry; Button does not supply an error lifecycle.

```tsx
import { Button } from '@zao/react';
import { Copy } from 'iconoir-react';

<Button leadingIcon={Copy} loading={saving} loadingAnnouncement="Saving draft." onClick={saveDraft}>
  Save draft
</Button>;
```

Here `saving` starts false and `saveDraft` updates the host's state. For form submission, use `type="submit"` and let the form own the action.

## Motion

| Response                      | Duration token            | Easing token                           | Current Su resolution         |
| ----------------------------- | ------------------------- | -------------------------------------- | ----------------------------- |
| Hover lift and return/release | `motion.duration.lift`    | `motion.easing.lift`                   | Grade 7, 157.5ms; fold-enter  |
| Press seating                 | `motion.duration.seat`    | `motion.easing.seat`                   | Fast, 80ms; standard          |
| Face fill/perimeter emphasis  | `motion.duration.fast`    | `motion.easing.standard`               | 80ms; standard                |
| Focus bracket approach        | `motion.duration.grade.7` | `motion.easing.fold-enter`             | 157.5ms; fold-enter           |
| Focus bracket opacity         | `motion.duration.fast`    | `motion.easing.standard`               | 80ms; standard                |
| Functional pending indicator  | `motion.duration.loading` | Linear rotation in the loading utility | 1000ms per turn while pending |

Lift aliases grade 7: the structural grade height is 5.25 and Su's grade unit is 30ms. The exact faceted `linear()` fold is generated from the roof-fold rule. Seat remains shorter than release. Component code reads the tokens; these numbers describe the present resolution, not independent values to copy. Button return uses lift/fold-enter, not fold-exit.

The registered face-offset transition can reverse from its current pose. The side planes follow that same value without an independent animation; labels and icons stay on the face. Native geometry, neighboring layout, and the focus target remain fixed.

Reduced motion removes spatial travel and transitions, including bracket travel, and shows a static pending indicator. Immediate semantic fill provides hover/press feedback; primary hover mixes its two solid fills while press uses solid-hover. Forced colors remove plane paint and face transforms. Unsupported bevel keeps the square face.

Sources: [motion rules and inventory](../motion.md), [grade tokens](../../packages/tokens/src/base/grade.tokens.json), [motion generator configuration](../../packages/tokens/motion.config.ts), and [shared utilities](../../packages/react/src/styles/theme.css).

## Accessibility

- Native button semantics provide activation and form behavior. The host must supply a meaningful accessible name; neither the type nor runtime enforces nonempty children. Prefer visible action text, and use IconButton's required label/tooltip for icon-only actions.
- Face and side have no independent hit target. Side paint, icons, and the spinner are decorative. The label overlay uses opacity, not `aria-hidden`, so pending work keeps the name.
- Ordinary disabled uses native disabled semantics. Loading without explicit disabled instead uses Base UI's focusable-disabled path (`aria-disabled`, `data-disabled`, and `aria-busy`) and suppresses repeat activation. Tab can leave it; explicit disabled wins when both are true.
- The mounted loading sibling is polite and atomic, with `role="status"` only while loading. Supply the controlled loading prop from the initial render. The host announces the outcome rather than leaving pending text as completion feedback.
- Focus brackets stay outside and registered to the native target; they approach once and then hold. Forced colors hide the brackets and restore a solid CanvasText outline. Both seals retain ink focus.
- RTL reverses logical content/icon placement and the pinned trailing indicator. It does not reverse the screen depth axis or facet corner.
- The face is fixed-height and single-line. It does not implement wrapping or truncation; keep labels concise and let the surrounding layout fit the complete target.

Existing coverage includes [construction and input](../../apps/docs/e2e/button-elevation.spec.ts), [variants, icons, pending work, RTL, and names](../../apps/docs/e2e/button-variants.spec.ts), [shared control heights](../../apps/docs/e2e/control-height.spec.ts), and [Anatomy](../../apps/docs/e2e/anatomy.spec.ts). This draft was grounded in source; those suites were not rerun for this documentation change, and no new runtime or verification result is claimed.

## Decisions

**Current precedence.** The authorized Oct 11 finish overrides only the earlier details it reopens. Label/face travel, native targets, input semantics, structural type/size, fixed layout, and disabled/reduced-motion protections remain. This section separates exact historical approval text from the later records; no new interaction decision is proposed.

### Oct 6–7: exact BRIEF approvals

From [BRIEF.md](../../BRIEF.md#current-design-direction-quiet-construction), transcribed word for word for the pilot. These remain in the source until the separate post-D14 migration. Their old rest/focus/finish details read through the later decisions below.

> **Approved Button refinement, Oct 6:** Keep the supplied Figma geometry: a square face, 14px Geist at weight 500 with an 18px line box, and default 16px horizontal / 8px vertical padding (34px height). Connect the face, side, and stationary base with a contact edge at rest. Hover retains the 2px upward-and-right lift and reveals the connected side edge, without a stronger hover border or blur. Press seats the face onto its base along that same axis; release returns it to hover or rest. The native hit area, neighboring layout, and outside keyboard focus outline remain fixed. Use the existing finish duration, preserve disabled and reduced-motion behavior, and provide input feedback across pointer, keyboard, and touch. This approval applies to Button alone; whether the construction improves use remains a hypothesis to test.

> **Approved Button simplification, Oct 7:** Make the construction read as one face, one continuous joined side, and one fixed base, replacing the three visible offset shadow copies. The approved geometry, 2px upward-and-right lift, press axis, and finish duration stay unchanged. Preserve the stationary native hit area, focus outline, and neighboring layout, along with every variant, disabled state, and reduced-motion behavior.

The [BRIEF decision log](../../BRIEF.md#decision-log) also records those decisions in condensed form. The paragraphs provide their intent and protections, not a separate measured-usability claim.

### Oct 8–11: later approved records

| Decision and source                                                                                                  | What is current or superseded                                                                                                                                      | Source reason or spec scope note                                                                                        |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Oct 8 depth extraction, [AGENTS.md](../../AGENTS.md#the-one-idea-structure-is-shared-finish-is-chosen)               | Depth and screen axis are finish paint; independent hairline remains structural. No target or layout resizing.                                                     | Spec scope note: preserve existing geometry while sharing the construction values.                                      |
| Oct 8 D3/D4 and dark side refinement, [AGENTS.md](../../AGENTS.md#the-one-idea-structure-is-shared-finish-is-chosen) | Historical single-shade/dark-side exceptions are replaced by V2; square-only action finish is adjusted by V4. Fast stays 80ms, but spatial aliases follow V5/V6.   | Spec scope note: earlier finish selections are preserved as history, not concurrent paint instructions.                 |
| Oct 10 D9, [shared default height](../plans/2026-10-improvement/decision-drafts/default-height-c.md)                 | Default controls share 34px; `size.button.default` remains an alias. Small and large stay 28/40px.                                                                 | Source reason (summary): preserve the approved 18px line box plus 8px vertical padding and the independent fen scale.   |
| Oct 10 D11, [motion record](../plans/2026-10-improvement/decision-drafts/motion-values-current.md)                   | Role extraction remains; old lift duration and common curve choices are superseded by V5/V6.                                                                       | Spec scope note: keep the role contract while the later finish sets its values.                                         |
| Oct 11 D12 A, [label decision](../plans/2026-10-improvement/decision-drafts/button-label-current-a.md)               | Label and icons travel with the face; native target, base, and layout stay fixed. Old timing/focus references follow V5/V6/V12. This approval is not yet in BRIEF. | Source reason (summary): Yankun selected the reviewed current face/reading relationship; B/C remain unselected studies. |

The following current finish decisions and their reasons are recorded in the [authorized finish decision draft](../plans/2026-10-finish/decision-drafts.md) and take precedence through [AGENTS.md](../../AGENTS.md#current-design-direction-quiet-construction):

| Gates      | Current Button rule                                                                     | Source reason (summary)                                                                                  |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| V1/V1b/V1c | Generated warm neutrals; primary Ink seal or inherited Azurite; focus stays ink.        | Yankun chose both seals and warm ink; focus reads the same whichever seal an island uses.                |
| V2         | Two banded side planes replace a single side shade and the former dark-side exceptions. | Describe depth without blur; a bottom close to the side does not read as a detached shadow.              |
| V3         | Rest at control depth, hover adds lift, press seats onto the fixed base.                | A visible rest pose makes construction legible before interaction.                                       |
| V4         | One leading bevel with square unsupported fallback.                                     | One small detail marks the leading edge.                                                                 |
| V5/V6      | Derived fold-enter lift, grade 7 duration, fast standard-curve seat.                    | The curve comes from the building rule; heavier parts arrive later and press stays shorter than release. |
| V11        | A Button press inside Card also dips Card by contact depth; Card owns that response.    | The surface answers the weight of its actions.                                                           |
| V12        | Outside ink brackets; forced colors restore a solid system outline.                     | Focus is drawn with the construction and remains outside and registered to the target.                   |

**D14 passed Oct 11.** Yankun accepted the template with “the template works.” The metadata and six-section structure may now be applied to the remaining exports. Spec migration and component-page rendering remain WP 5.1 work; agent-layer scope waits for D15 and eval setup for D16. None of those integrations is implemented by this pilot. [Decision draft](../plans/2026-10-improvement/decision-drafts/component-spec-template.md).
