---
name: Tabs
status: approved
intent: Select one related view while keeping its label and associated panel connected.
use-when:
  - Related views share one context and one selected panel.
  - A primary ruler rail or a secondary recessed selector expresses the view hierarchy.
avoid-when:
  - A destination needs a link or a setting needs Switch.
  - The choices need multiple simultaneous selection or a popup of actions.
composes-with:
  - Tabs
parts:
  - root
  - viewport
  - list
  - rail
  - graduation
  - indicator
  - selection-line
  - tab
  - tick
  - panel
motions:
  - slide
  - seat
tokens:
  - unit
  - type.label
  - type.body
  - font.family.text
  - font.weight.medium
  - font.weight.regular
  - size.control.md
  - space.0-5
  - space.1
  - space.2
  - space.3
  - space.4
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
  - color.fg.default
  - color.fg.muted
  - color.fg.disabled
  - color.border.subtle
  - color.border.default
  - color.accent.solid
  - color.focus.ring
  - motion.duration.slide
  - motion.easing.slide
  - motion.duration.seat
  - motion.easing.seat
  - motion.duration.fast
  - motion.easing.standard
---

# Tabs

**Reference spec, Oct 11, 2026.** Tabs is approved. This follows the D14 template, the vertical B approval, and the current finish; the full reference is not the website page layout. Source approvals remain in place pending the separate migration.

## Anatomy

`Tabs.Root` is the Base UI group and carries `data-zao-component="tabs"`. Its native tab buttons and labels stay stationary; Base UI associates each selected tab with its panel. `Tabs.List` adds a bounded scrolling viewport and owns the decorative drawing. Nested roots keep their own state and measured indicators.

| Authored `data-zao-slot` | Role and presence                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `root`                   | Base UI root for a supplied Tabs group.                                              |
| `viewport`               | Wrapper around every list, with fen-sized clearance and scrolling.                   |
| `list`                   | Base UI tablist and variant owner.                                                   |
| `rail`                   | Decorative primary guide, horizontal or vertical; absent in secondary.               |
| `graduation`             | Decorative primary marks at actual visible adjacent-tab gap midpoints.               |
| `indicator`              | Base UI-measured selection decoration; primary paints its fishtails on it.           |
| `selection-line`         | Primary selection stroke, with a painted registration tick; absent in secondary.     |
| `tab`                    | Native Base UI tab button and its stationary visible children.                       |
| `tick`                   | Decorative per-tab registration mark; mounted in both variants, hidden in secondary. |
| `panel`                  | Base UI panel supplied by the host, with associated selected value.                  |

Primary draws one hairline guide, end stops, fine graduations, and a stronger selection line on one centerline. Each actual visible adjacent gap has one graduation, `n − 1`: a full-height boundary mark on a horizontal rail (Oct 15) and a half-fen mark on a vertical one. The selection line ends in two seal fishtails (鱼尾, Oct 15), notches facing the tab, painted on the indicator's `::before` and `::after`; no slot is added. A ResizeObserver/MutationObserver measures native gaps, rather than inventing a repeated pitch. Vertical labels align toward the rail: right in LTR, left in RTL.

Secondary draws a square sunken track and one surface-colored indicator with small rest depth (2px), a perimeter, and banded plane paint. There is no authored face/base/side slot on Tabs: the indicator is the painted face. Its label remains on the native tab, independent of the selection decoration; pressing the selected tab seats only the indicator, not its label. The indicator's conceptual base follows the selected cell; it stays registered there during seating.

Tabs use `h-control` (34px) with a 7-fen minimum width, 3-fen horizontal padding, `type-label`, `trim-label`, and medium text emphasis. Panels use `type-body`; the horizontal panel has a 4-fen top gap. Root vertical layout separates list and panel by 4 fen. Secondary track gap/padding is half a fen; the primary horizontal tab gap is 4 fen and the vertical gap is 2 fen.

Sources: [implementation and props](../../packages/react/src/components/tabs.tsx), [Tabs drawing and transitions](../../packages/react/src/styles/tabs.css), [shared construction/focus](../../packages/react/src/styles/theme.css), [structure](../../packages/tokens/src/base/space.tokens.json), [type](../../packages/tokens/src/base/type.tokens.json), [Su finish](../../packages/tokens/src/themes/su.tokens.json), and [Parts](../parts.md).

## States

| Prop or state                | Current contract                                                                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| List `variant`               | `primary` (default) or `secondary`; hierarchy and drawing choice, not selection behavior.                                                       |
| Root `orientation`           | `horizontal` (default) or `vertical`; Base UI keyboard axis and authored layout.                                                                |
| Active                       | Primary's selection line or secondary's single face identifies the selected value. Active label uses default ink.                               |
| Primary hover / focus        | Enabled target tick extends and darkens; selection does not move merely from hovering.                                                          |
| Primary held press           | The selected line compresses around its centerline. Native label/target/focus box remain fixed.                                                 |
| Secondary hover / held press | Nonactive enabled tabs gain hover fill. Pressing the selected tab seats its indicator and changes its face emphasis without a second underline. |
| Disabled tab                 | Disabled ink, no active hover/held emphasis or user selection; Base UI owns roving navigation and uncontrolled fallback.                        |

There is no root disabled, read-only, invalid, loading, or empty-state API. A root may have `value={null}` and therefore no active tab. The host owns panel loading/errors and decides whether those states should preserve or disable a view. Tab children remain single-line; the viewport scrolls rather than removing options.

## Interaction

| Public part  | Current contract                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tabs.Root`  | Inherits Base UI `value`, `defaultValue`, `onValueChange`, and `orientation`. Uncontrolled default is inherited (0), with Base UI fallback for missing/disabled selections except that an explicit `defaultValue` can retain an initially disabled matching tab. Controlled roots retain the supplied value, even if disabled or missing; the host owns their fallback. Prefer an explicit enabled initial value. |
| `Tabs.List`  | `variant` defaults primary. ZAO sets `activateOnFocus` true by default; false makes arrow navigation manual until Enter/Space. Inherited `loopFocus` defaults true. Supply a meaningful tablist accessible name.                                                                                                                                                                                                  |
| `Tabs.Tab`   | Required Base UI `value`, children, inherited `disabled`, action attributes and handlers. Match panel values.                                                                                                                                                                                                                                                                                                     |
| `Tabs.Panel` | Required matching `value`; inherited `keepMounted` defaults false. The host supplies panel content and owns its data lifecycle.                                                                                                                                                                                                                                                                                   |

Each part accepts layout `className`; `render` and `style` are omitted, and Tab also omits `nativeButton`. Refs point to the corresponding Base UI element; Tab is typed `HTMLElement`, the other parts `HTMLDivElement`.

Base UI owns click selection, roving focus, orientation-aware arrow navigation, RTL direction, panel association, and automatic/manual activation. ZAO's held flags affect the marker or face only. Keyboard press is limited to Enter/Space on the tab itself; touch/nonmouse primary pointer down gets a held pose. Supplied handlers can prevent the pose. Release, blur/window blur, pointer cancellation/leave/lost capture, motion outside the native bounds, or disabling clears it.

```tsx
import { Tabs } from '@zao/react';

<Tabs.Root defaultValue="summary">
  <Tabs.List aria-label="Project views">
    <Tabs.Tab value="summary">Summary</Tabs.Tab>
    <Tabs.Tab value="members">Members</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="summary">Project summary</Tabs.Panel>
  <Tabs.Panel value="members">Project members</Tabs.Panel>
</Tabs.Root>;
```

Nested Tabs use another complete root/list/panel group; a decorative indicator does not share state between groups.

## Motion

| Response                                                      | Tokens                                                           | Current Su resolution                                             |
| ------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| Indicator position and size                                   | `motion.duration.slide`, `motion.easing.slide`                   | Grade 7, 157.5ms, fold-enter.                                     |
| Secondary seat and rest-depth change                          | `motion.duration.seat`, `motion.easing.seat`                     | 80ms, standard.                                                   |
| Tick extent/color, primary line compression, face state paint | `motion.duration.fast`, `motion.easing.standard`                 | 80ms, standard.                                                   |
| Label color                                                   | Generic `duration-fast` utility with generated transition easing | The existing label color-transition path, not a new spatial role. |

Actual selected-tab measurements drive the indicator's transform, width and height. A new selection reverses from current CSS paint rather than resetting the native target; side planes follow the secondary rest value without a separate animation. Targets, labels, panels' layout, and outside focus outlines do not follow the marker.

Reduced motion removes indicator/tick/line transitions and shows the selected or pressed endpoint immediately. Forced colors use CanvasText for the primary ruler/selection marks, shared system focus outlines, and omit secondary plane paint. Secondary seating remains decorative; no reduced-transparency material or bevel is authored for Tabs.

Sources: [Tabs CSS](../../packages/react/src/styles/tabs.css), [current role aliases](../../packages/tokens/src/themes/su.tokens.json), and [motion inventory](../motion.md).

## Accessibility

- Base UI supplies native tab buttons, tablist/tabpanel roles, `aria-selected`, associated IDs, roving focus and selection. Name each list and give each tab concise visible text.
- Disabled options remain readable and are skipped for activation/navigation according to Base UI. Controlled roots must own an appropriate fallback; ZAO does not create one independently.
- The rail, graduations, indicator, selection line and ticks are decorative. The native tabs carry the accessible state even when marker movement is suppressed.
- Native focus outlines and tab labels remain fixed. The bounded viewport keeps every option available at narrow widths; preserve focus clearance when adding layout classes.
- RTL and vertical navigation retain Base UI behavior and logical rail alignment. Nested roots and panel content retain separate state and focus relationships. Hidden panels follow Base UI mounting rules; the host owns any panel-specific autofocus or data announcement.

Existing [Tabs construction coverage](../../apps/docs/e2e/tabs-construction.spec.ts), [vertical alignment/graduation coverage](../../apps/docs/e2e/tabs-vertical-alignment.spec.ts), [interruption coverage](../../apps/docs/e2e/motion-interruption.spec.ts), and [Anatomy coverage](../../apps/docs/e2e/anatomy.spec.ts) address selection, stationary geometry, nested/manual/vertical/RTL navigation, focus, touch, reduced motion, forced colors, and gap measurements. No tests were rerun for this reference; the links are existing scope, not a fresh pass.

## Decisions

### Oct 7: exact BRIEF approval

From [BRIEF.md](../../BRIEF.md#current-design-direction-quiet-construction), unchanged. Its finish motion and contact treatment are historical where Oct 11 supersedes them.

> **Approved Tabs, Oct 7:** Primary views use the refined ruler rail: one fine guide and a slightly stronger selection line share their centerline, with fine graduations, centered registration ticks, and small end stops. Hover or keyboard focus extends the target tick without moving selection; press compresses the selected line around the same centerline. Secondary views use a square recessed track with one sliding face, a contact edge, and press seating, with no repeated underline. Labels, native targets, focus outlines, and layout stay stationary. Preserve Base UI selection, horizontal and vertical keyboard navigation, disabled behavior, nested state, scrolling, and reduced motion. Reuse semantic colors and existing finish durations; this approval is specific to Tabs and introduces no token changes.

### Later records and current precedence

| Date and source                                                                                        | Current effect                                                                                                                                    | Source reason or spec scope note                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Oct 9 WP 2.4 B, [vertical decision](../plans/2026-10-improvement/decision-drafts/vertical-tabs-b.md)   | Labels face the vertical rail and each visible adjacent gap supplies one minor graduation. No new interaction.                                    | Source reason, summarized: relate marks to actual tab layout while retaining the drawing vocabulary; orientation/usability benefits remain hypotheses. This later row is not yet in BRIEF. |
| Oct 10 D9, [height decision](../plans/2026-10-improvement/decision-drafts/default-height-c.md)         | Default tabs grow from 32px to shared 34px. Spacing's 32px step stays independent.                                                                | Source reason, summarized: preserve Button geometry and make default controls consistent.                                                                                                  |
| Oct 10 D11, [historical motion](../plans/2026-10-improvement/decision-drafts/motion-values-current.md) | Role vocabulary survives; its old duration/curve values read through V5/V6.                                                                       | Spec scope note: the historical retained values are not concurrent finish instructions.                                                                                                    |
| Oct 11 V1/V2/V3/V5/V6, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                  | Primary selection line carries the active seal; secondary uses banded planes and small rest depth; spatial roles use the derived current aliases. | Source reasons, summarized: depth without blur, legible rest construction, and curves/timing derived from building rules.                                                                  |
| Oct 15 top nav A, [craft references](../research/visual-craft.md)                                      | Horizontal rails mark each tab boundary; the selection line ends in two fishtails, notches facing the tab. No new interaction or slot.            | Source reason, summarized: give each line on the rail a job, using the woodblock folio's fishtail as the current mark.                                                                     |

Spec scope note: Tabs retains the ordinary outside focus outline; V12 brackets apply to Button, IconButton and Switch only. The independent stationary label/marker topology remains approved. Source texts stay in place until the separate migration; this spec adds no public props, tokens, drawing defaults, or interaction.
