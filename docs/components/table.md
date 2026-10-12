---
name: Table
status: requested
intent: Read and compare structured records in a stationary native table with explicit controls for sorting and selection.
use-when:
  - Records share columns that people need to scan or compare.
  - A narrow view must retain all columns within a named horizontal scroll region.
avoid-when:
  - A simple list communicates the content without column comparisons.
  - A grid of interactive cells requires behaviors this native table does not implement.
composes-with:
  - Button
  - Menu
parts:
  - scroll-area
  - table
  - caption
  - header
  - body
  - footer
  - row
  - head
  - cell
motions: []
tokens:
  - unit
  - type.body
  - type.label
  - type.caption
  - font.family.text
  - font.weight.regular
  - font.weight.medium
  - space.2
  - space.3
  - space.4
  - radius.none
  - depth.rest.surface
  - depth.lift
  - depth.axis.x
  - depth.axis.y
  - color.bg.canvas
  - color.bg.hover
  - color.bg.active
  - color.fg.default
  - color.fg.muted
  - color.border.subtle
  - color.border.default
  - color.focus.ring
---

# Table

**Reference spec, Oct 11, 2026.** Table's grounded-ledger refinement remains requested and under review. D10 approves the status treatment specifically, not all Table interactions. This follows the approved D14 template and current finish; the full reference is not a website page layout.

## Anatomy

`Table.Root` creates one stationary square frame with `data-zao-component="table"`, a named keyboard-focusable horizontal scroll region, and the native `<table>`. Its children supply the normal table groups, rows and cells. The package does not create a toolbar, column model, checkbox, status component, or data store.

| Authored `data-zao-slot`   | Native owner and presence                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| `scroll-area`              | Always-present wrapper with `role="region"`, `${aria-label} scroll area`, and `tabIndex={0}`. |
| `table`                    | Always-present native table receiving Root's native table props/ref.                          |
| `caption`                  | Native caption supplied through `Table.Caption`.                                              |
| `header`, `body`, `footer` | Native thead/tbody/tfoot supplied through corresponding parts.                                |
| `row`                      | Native tr supplied through `Table.Row`; optional visual `data-selected`.                      |
| `head`                     | Native th supplied through `Table.Head`, with explicit scope.                                 |
| `cell`                     | Native td supplied through `Table.Cell`.                                                      |

There is no Table-authored `root`, `status`, `checkbox`, `sort`, `face`, `side`, or `base` slot. The frame's `construction-planes` paints two banded sides at `depth.rest.surface` (4px) with canvas-face shading; the far edge is a conceptual base. The frame does not inherit Card's load-path dip. `depth.lift` bounds shared plane paint reach, not a Table hover lift.

The native table spans its frame, uses collapsed borders, and remains an open canvas. Fine horizontal rules divide header/body/footer groups and rows. Heads/cells share 3-fen horizontal and 2-fen vertical padding. Column headings use `type-label`; row/rowgroup headings and cells use `type-body`; captions use `type-caption` and 4/3-fen padding. `numeric` gives right alignment and tabular figures. ID monospace, compact supporting columns, primary-column width, and reserved sort-indicator space are host composition choices demonstrated in the docs specimen, not new Table props.

Sources: [implementation and props](../../packages/react/src/components/table.tsx), [frame, table-plane and checkbox utilities](../../packages/react/src/styles/theme.css), [structure](../../packages/tokens/src/base/space.tokens.json), [type](../../packages/tokens/src/base/type.tokens.json), [Su depth](../../packages/tokens/src/themes/su.tokens.json), [semantic mapping](../../packages/tokens/src/modes/light.tokens.json), [Parts](../parts.md), and [host-owned docs specimen](../../apps/docs/components/table-specimen.tsx).

## States

| Prop or state            | Current contract                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Root label               | Required `aria-label` string names the native table and its scroll region.                                             |
| Row `selected`           | Boolean, default false; adds visual active fill only. It does not set native selection semantics or manage a checkbox. |
| Head/Cell `numeric`      | Boolean, default false; right alignment and tabular numbers.                                                           |
| Head `scope`             | Native th scope; default `col`. `row`/`rowgroup` use the body type role.                                               |
| Hover / focus within row | Neutral hover fill without geometry or depth motion.                                                                   |
| Selected row             | Active fill overrides ordinary hover/focus-within fill.                                                                |

There is no package sorting, selection store, loading, empty, error, disabled, read-only, or invalid state. Native controls placed in cells own their own disabled/focus behavior. A host-supplied empty-state row can span the actual columns; no automatic empty copy or skeleton is created.

The D10 docs status treatment keeps each word visible with a supplementary decorative glyph: Check/Ready, Play/Running, WarningTriangle/Needs review, Prohibition/Blocked. All use default ink, no status color or animation. The specimen's `status` slot is docs-owned and is therefore absent from the package metadata.

## Interaction

| Public part                                    | Current contract                                                                                                                                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Table.Root`                                   | Native table props plus required `aria-label`, outer layout `className`, native-table `tableClassName`, and optional inherited finish/mode attributes. Native props/ref apply to `<table>`; layout classes apply to the outer frame. |
| `Table.Caption`, `.Header`, `.Body`, `.Footer` | Corresponding native element attributes, children and refs.                                                                                                                                                                          |
| `Table.Row`                                    | Native tr attributes plus visual `selected`.                                                                                                                                                                                         |
| `Table.Head`, `.Cell`                          | Native cell attributes plus `numeric`; Head defaults `scope` to col.                                                                                                                                                                 |

No Base UI table state machine or ARIA grid keyboard model is added. The host owns records, column widths, sort comparators, row keys, selection state, comparison output, form controls, action handlers, and announcements. Use shared small Button and Menu actions for a compact toolbar, and explicit controls inside sortable headings; do not make the entire row a second action.

The docs specimen uses stable record IDs so selection survives sorting, native labeled checkboxes with a mixed select-all state, meaningful `aria-sort` on active headings, a concise visible count, and a detailed live selection/sort summary. Compare and reset/clear actions are host logic, not Table API. Their inherited Button hooks remain Button-authored; Menu popup hooks remain Menu-authored.

```tsx
import { Table } from '@zao/react';

<Table.Root aria-label="Recent requests">
  <Table.Caption>Requests available for review</Table.Caption>
  <Table.Header>
    <Table.Row>
      <Table.Head>Request</Table.Head>
      <Table.Head numeric>Items</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Head scope="row">Access review</Table.Head>
      <Table.Cell numeric>24</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table.Root>;
```

## Motion

Table authors no motion role, transition, or row travel. Resting frame planes, rules, cells, targets, and neighboring layout stay fixed. Selection and neutral emphasis change paint immediately. The shared construction utility draws planes without its own animation.

Composed Button/Menu actions retain their separately approved motion and reduced-motion paths. A Table action does not make the Table frame dip like Card. Native horizontal scrolling is available through the named scroll region; no scroll hijacking or scripted snap behavior is authored.

Reduced motion needs no special Table transition suppression because Table adds none. Shared plane paint disappears in forced colors; native semantics, focus outlines, and browser/system color adjustment remain. The docs checkbox utility explicitly restores system-colored checked/mixed marks. Table itself defines no special status-color mapping, facet, or translucent material fallback.

## Accessibility

- Keep native caption, header groups, row/column scopes and cells so assistive technology can read the ledger as a table. It is not an interactive grid.
- Root's required label names both the table and its focusable scroll region. Give it a meaningful nonempty value; the type does not validate its text. Keep every column accessible by horizontal scrolling at narrow widths.
- Visual `selected` is insufficient to expose selection. Use labeled native checkboxes, set mixed state on select-all where applicable, and let keyboard/touch operate the actual controls.
- Sorting belongs to a named button with truthful `aria-sort` on its heading. Reserve the indicator's width to avoid relayout, and announce sorting/selection results through host content.
- D10 status glyphs remain decorative and hidden from assistive technology; every status word stays visible. Neither color nor motion supplies a necessary state meaning.
- Preserve outside focus outlines on the scroll region and native controls. `numeric` deliberately uses physical right alignment for comparison; RTL does not convert it into start alignment. Browser direction handles table flow and scroll direction.

Existing [Table construction coverage](../../apps/docs/e2e/table-construction.spec.ts) and [rule/status coverage](../../apps/docs/e2e/table-rule-status.spec.ts) address native reading, sorting, selection, Menu keyboard dismissal, stationary rows, desktop/narrow frame rules, RTL, scrolling, status words/glyphs and forced colors. Most interaction cases exercise the host specimen. These links describe existing scope, not a fresh verification result; no tests were run for this reference.

## Decisions

### Oct 6: exact BRIEF request

From [BRIEF.md](../../BRIEF.md#current-design-direction-quiet-construction), unchanged. The requested overall refinement remains under review.

> **Requested Table implementation and monochrome refinement, Oct 6:** Yankun asked for a crafted monochrome table with inspiration from Hairline. One square stationary frame and contact edge define an open canvas; fine horizontal rules and shared fen padding organize the records. The primary column receives the available width, IDs use monospace, supporting columns stay compact, and numeric readings align with tabular figures. Statuses use plain foreground words. Matching header roles and reserved sort-indicator space keep the composition steady. A compact secondary toolbar and concise selected count support explicit sorting, checkbox selection, and comparison. Native table parts, detailed live announcements, and a named scroll region retain reading and keyboard access. Neutral row emphasis stays stationary. [Hairline's process](https://hairline.lucasmarkes.com/inspo) informs economical construction and a complete resting composition. Existing structural and semantic tokens supply the treatment. This requested refinement remains under review; finish promotion and measured usability benefits remain separate decisions.

### Later records and current precedence

| Date and source                                                                                          | Current effect                                                                                                                        | Source reason or spec scope note                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Oct 7 checkbox refinement, [AGENTS request](../../AGENTS.md#current-design-direction-quiet-construction) | Square native checkbox drawing, visible checked/mixed marks, and a 24px clickable label target in the specimen.                       | Spec scope note: preserve native state, keyboard focus, and independent target geometry; no package selection API is added.                                                                     |
| Oct 10 D10, [status B decision](../plans/2026-10-improvement/decision-drafts/table-status-b.md)          | Written statuses plus distinct decorative Iconoir glyphs, default ink, no animation; retain frame/rule paint and regression coverage. | Source scope, summarized: no state depends on color/motion; preserve native sorting, selection, scrolling and stationary rows. This draft has no separate Reason field and is not yet in BRIEF. |
| Oct 10 D9, [height decision](../plans/2026-10-improvement/decision-drafts/default-height-c.md)           | Shared default controls are 34px; Table's explicit small toolbar remains 28px.                                                        | Source reason, summarized: preserve approved Button geometry and meaningful density choices.                                                                                                    |
| Oct 11 V2/V3, [finish decisions](../plans/2026-10-finish/decision-drafts.md)                             | Shared frame drawing uses banded planes and surface rest depth, without changing native layout.                                       | Source reasons, summarized: describe depth without blur and make resting construction visible.                                                                                                  |

Spec scope note: D10 resolves only the status choice. The Table request, host-owned sorting/selection, and measured-usability claims retain their actual status; the finish authorization does not approve a new table interaction system. Source text remains in place for the separate approval migration.
