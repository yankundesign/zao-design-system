---
name: Card
status: approved
intent: Group related readings and explicit actions on one grounded content surface.
use-when:
  - A record or summary needs a distinct reading surface and a clear boundary.
  - Supporting metadata or data belongs with a leading title and explicit actions.
avoid-when:
  - Ordinary page content can share the canvas without another enclosure.
  - The entire surface is intended to act as a button or navigation link.
composes-with:
  - Button
  - IconButton
  - Progress
  - Table
  - Message
parts: []
motions:
  - seat
  - reveal
  - reveal-exit
  - lift
tokens:
  - unit
  - space.4
  - color.bg.surface
  - color.fg.default
  - color.border.subtle
  - color.border.strong
  - depth.rest.surface
  - depth.contact
  - depth.lift
  - depth.axis.x
  - depth.axis.y
  - radius.facet
  - motion.duration.seat
  - motion.easing.seat
---

# Card

**Approved component; current source contract, Oct 15, 2026.** This spec uses the D14 template. The full contract is repository/agent reference; the website retains its concise guide and working examples. The Oct 11 finish supersedes the older single contact shade and square-only drawing. The Card itself remains a passive reading surface.

## Anatomy

Card is one native `<div>` with `data-zao-component="card"`. It authors **no `data-zao-slot` hooks** and no required title, metadata, data, or action containers. Those elements belong to the host composition; `card-data` and `card-media` hooks in docs specimens are not package hooks.

The root is the content plane and static frame: surface fill, default ink, and 4-fen padding (currently 16px). `card-material` (Oct 15) draws the frame lit and shaded from the depth axis's side: the top and right edges are lit (`border-subtle` in light, `border-strong` in dark), and the left and bottom edges, where the planes start, are in shade (`border-strong` in light, `border-subtle` in dark). It also supplies the plane tones, darker steps of the face's own ink in both modes, in place of `construction-shading`. Place a Card on a ground one tone step behind its face, such as `bg-canvas`, so the face reads as the nearest surface. `construction-planes` draws two side planes on the root's `::before` and `::after`, each in two crisp bands, ending at a conceptual fixed base behind the face. There is no separate `face`, `side`, `base`, or `contact-edge` DOM slot.

The rest depth reads `depth.rest.surface` (4px); the direction reads `depth.axis.x/y` (right/up). The leading top-right corner uses `radius.facet` with `corner-shape: bevel` support and remains square otherwise. Plane paint uses clipped zero-blur spreads instead of larger layout boxes. It introduces no hover lift or scrollable plane overflow. The shared helper reads `depth.lift` for its paint-reach bound; Card does not hover by that value.

Let the title lead the record, with subordinate metadata and an optional data region. Card titles retain the text face through the existing heading role; V7b does not turn them into Newsreader display titles. Place explicit actions in a bottom row and let each action own its target, focus, and interaction.

Sources: [Card and its type](../../packages/react/src/components/card.tsx), [shared construction utilities](../../packages/react/src/styles/theme.css), [Su finish](../../packages/tokens/src/themes/su.tokens.json), [structural tokens](../../packages/tokens/src/base/space.tokens.json), and [Parts](../parts.md).

## States

| State                                  | Current contract                                                                                                                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest                                   | One complete, grounded content plane and two banded planes at surface rest depth.                                                                                                         |
| Hover or focus within                  | Card gains no hover movement, raised border, or focus treatment of its own. Descendant controls keep their own feedback.                                                                  |
| Descendant action press                | The V11 load-path response reduces the painted rest depth by `depth.contact` (currently 4px to 3px). The Card content/native box itself remains stationary.                               |
| Drawing/loading                        | `drawing` marks a still construction drawing, sets `aria-busy`, makes descendants inert/hidden, and announces `drawingLabel`. The host supplies placeholder-shaped or last-known content. |
| Selected, invalid, disabled, read-only | No Card state API. The host owns the content and its semantics; nested controls retain their individual states.                                                                           |
| Narrow layout                          | Host content determines fit, wrapping, and action-row layout. The package does not impose a width or breakpoint.                                                                          |

The press selector observes a descendant button, button role, or link in `:active` or the held-input marker, excluding native `:disabled`. It changes plane paint; it does not activate that descendant or model the host's pending/disabled state. This describes the selector's actual scope, not an additional public state prop.

The storage ring at 68% and the four layout compositions are docs specimens, not Card props. Their quantitative readings and chart inspection remain owned by their local implementations.

## Interaction

`CardProps` accepts `drawing?: boolean` and `drawingLabel?: string` (default `Loading`) in addition to children, className, ref, and native div attributes. `drawing` changes paint and accessibility state only; the host supplies placeholder content and owns fetching. Once drawing changes to built after mount, Card removes `data-zao-building` after the role-derived build sequence. It has no variant, size, `onValueChange`, fetch, or whole-card action API. `className` appends host layout classes to the shared treatment.

The host supplies headings, metadata, content, and the bottom action row. Keep keyboard and pointer activation on an explicit Button, IconButton, or link with its own accessible name. Card does not provide keyboard activation, selection, dismissal, focus trapping, or asynchronous work. A native div event handler does not establish an approved whole-card interaction.

```tsx
import { Button, Card } from '@zao/react';

<Card className="flex flex-col gap-4">
  <h3 className="type-heading">Workspace</h3>
  <p className="type-body text-muted">Review settings for your team.</p>
  <div className="flex flex-wrap justify-end gap-2">
    <Button variant="secondary" onClick={openSettings}>
      Open settings
    </Button>
  </div>
</Card>;
```

Here `openSettings` is owned by the product. Progress, Table, and rich Message content retain their own semantics when composed with the surface; a chart is not implicitly supplied by Card.

## Motion

The Card face does not move on hover or press. Its V11 load-path paint transitions `--zao-plane-rest` with `motion.duration.seat` / `motion.easing.seat` (currently fast 80ms / standard), both on press and release. The planes follow that rest-depth value without their own independent transition. This change is paint only; reading geometry and neighboring layout remain fixed.

Reduced motion removes the transition, making the rest-depth paint change immediate. Drawing itself is still; after loading, the guidelines withdraw on Reveal exit, then ink and face arrive on Reveal and planes rise on Lift. The total build duration is read from those computed roles. Forced colors suppress the decorative planes through the shared utility, retaining the native content and border. The unsupported facet stays square.

The Card page uses the published `drawing` state for Load and Build. Its Remove phase and fen dimensions stay docs-local; the package exports no fetch or removal behavior.

Sources: [motion rules](../motion.md), [Card construction CSS](../../packages/react/src/styles/theme.css), and the [docs-only states demonstration](../../apps/docs/components/construction-states.tsx).

## Accessibility

- Card is an ordinary content div, not an interactive control or landmark by default. The host supplies a meaningful heading, reading order, and named regions where useful.
- Card is not a tab stop. Explicit descendant actions use their own accessible names, keyboard support, and visible focus treatment; keep their target geometry stationary.
- Decorative side planes have no accessibility nodes. Keep quantitative data and essential readings in real content; inspection is not a prerequisite for reading a summary.
- Use text for important status and distinguish essential data without relying on decorative depth or a seal color.
- RTL content follows native layout and logical utilities. The physical screen axis and leading facet retain their right/up direction.
- The host owns text overflow, responsive action wrapping, chart accessibility, busy announcements, and recovery. Card's native props alone do not implement those behaviors.

Coverage: [Card construction](../../apps/docs/e2e/card-construction.spec.ts), [layout compositions](../../apps/docs/e2e/card-layouts.spec.ts), [storage ring study](../../apps/docs/e2e/storage-ring-study.spec.ts), [Anatomy](../../apps/docs/e2e/anatomy.spec.ts), and [drawing/loading](../../apps/docs/e2e/plan-gate-drawing.spec.ts). Fresh drawing-state verification and full-suite limits are recorded in the [components progress](../plans/2026-10-components/PROGRESS.md). No measured usability improvement is claimed.

## Decisions

### Oct 6: exact BRIEF approval

From [BRIEF.md](../../BRIEF.md#current-design-direction-quiet-construction), transcribed word for word. Source approvals remain in place until the separate migration.

> **Approved Card, Oct 6:** Make Card a static, grounded reading surface: a frame and contact edge in semantic colors surround one content plane. The title leads, with metadata and an optional recessed data region supporting it. Explicit Button actions occupy a bottom row and keep their own interaction and focus behavior; the core Card remains passive, with no hover motion. The shared storage specimen consolidates its reading into one accurate, fully visible 68% chart. Keep existing fen proportions and type roles. This approval defines Card's construction and specimen composition, without selecting interactions for other components or claiming a measured usability benefit.

### Later records and current precedence

| Source                                                                                                                                                                                    | What applies                                                                                                                                                         | Source reason or spec scope note                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Oct 8 D3 and Card refinement, [AGENTS.md](../../AGENTS.md#the-one-idea-structure-is-shared-finish-is-chosen) and [study record](../../explorations/su-studies/quiet-instrument/design.md) | The trial outline was replaced by a shaded contact with square corners. That single-shade paint is historical under V2, and square-only treatment is adjusted by V4. | Spec scope note: preserve the passive reading plane and explicit action composition across finish changes.       |
| Oct 9 dark Card contact, [AGENTS.md](../../AGENTS.md#the-one-idea-structure-is-shared-finish-is-chosen)                                                                                   | The dark `border-subtle` contact exception is superseded by V2's shared banded planes.                                                                               | Spec scope note: this was a Card-specific visibility refinement, not a global interaction rule.                  |
| Oct 11 V2/V3/V4, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                                                                                                           | Two banded planes, surface rest depth, and one supported leading bevel. Card retains no hover lift.                                                                  | Source reason (summary): visible rest construction, depth without blur, and one detail marking the leading edge. |
| Oct 11 V7b, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                                                                                                                | Card titles keep the text face.                                                                                                                                      | Source reason (summary): retain Card's existing type role.                                                       |
| Oct 11 V8, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                                                                                                                 | Drawn → built/removal/loading is demonstrated locally on the Card page.                                                                                              | Source reason (summary): the drawing explains a loading state; it does not add a Card state API.                 |
| Oct 11 V11, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                                                                                                                | Descendant action press reduces contact/rest paint; core content and targets remain fixed.                                                                           | Source reason: the surface answers the weight of its actions.                                                    |
| Oct 15 cards A and C, [craft references](../research/visual-craft.md)                                                                                                                     | Lit top and right edges, shaded left and bottom edges, and planes darker than the face in both modes. Hosts place Cards one tone step in front of their ground.      | Source reason (summary): the workspace read as a wireframe because every surface shared one tone and one line.   |

The authorized [finish rules](../../AGENTS.md#current-design-direction-quiet-construction) take precedence only where they reopen earlier choices. This spec records existing construction and composition; it proposes no new Card interaction or claim about better understanding.

Oct 13 L1–L2, [components plan](../plans/2026-10-components/README.md): `drawing` becomes a published loading treatment; Card remains passive, and the host keeps data ownership. The old local-only finish V8 restriction no longer applies.
