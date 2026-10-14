---
name: ApprovalGate
status: approved
intent: Present a consequential request and replace its actions with the host's decision record.
use-when:
  - A person must explicitly approve or decline an agent-proposed change.
avoid-when:
  - The action does not need a separate decision or can be reversed without a review.
composes-with:
  - Card supplies the passive surface and construction.
  - Button supplies the explicit approve and decline actions.
  - Plan can contain the gate as a waiting step result.
parts:
  - header
  - title
  - reference
  - facts
  - actions
  - note
  - record
  - record-text
  - impression
motions:
  - seat
  - impress
tokens:
  - motion.duration.fast
  - motion.duration.impress
  - motion.easing.impress
  - color.accent.solid
  - color.bg.surface
  - radius.facet
  - size.control.md
  - space.0-5
  - space.1
  - space.2
  - space.3
  - space.4
  - stroke.hairline
  - type.caption
  - type.label
---

# ApprovalGate

## Anatomy

ApprovalGate marks its wrapper `data-zao-component="approval-gate"` and composes a Card. Its slots are `header`, `title`, optional `reference`, `facts`, `actions`, `note`, `record`, `record-text`, and `impression`. The facts use a native `dl`; action controls are shared Buttons. The approved impression is flat paint inside the record. Source: [approval-gate.tsx](../../packages/react/src/components/approval-gate.tsx), [Card](card.md), and [construction styles](../../packages/react/src/styles/theme.css).

## States

The host supplies `decision: null | { kind: 'approved' | 'declined'; by: string; at: string }`. Before decision, the action row contains Decline and primary Approve. While pending, Approve uses Button loading and Decline is disabled. Once decided, the record replaces the actions in the same row. Only approved records carry the mark. `mark` is required until G2 is decided.

## Interaction

The host owns decision-making. ApprovalGate calls `onApprove` or `onDecline`; it never commits a decision itself. The host supplies both action and result labels, optional reference/facts/note, pending and disabled state, and a one- or two-character mark. Native `div` props are forwarded to the component wrapper.

```tsx
<ApprovalGate
  title="Remove 38 seats"
  approveLabel="Approve removal"
  approvedLabel="Approved removal"
  declineLabel="Decline"
  declinedLabel="Declined removal"
  mark="准"
  decision={decision}
  onApprove={approve}
  onDecline={decline}
/>
```

## Motion

Card retains its approved surface construction and press load path. A decision arriving after mount fades the record in as a fast state change. An approved impression inks over the Impress duration using `steps(3, jump-start)`. Restored decisions render at rest. Reduced motion shows the complete record immediately.

## Accessibility

Approve and Decline are native Buttons with visible labels. Pending state keeps Button's loading announcement and disables the other action. A record uses `role="status"`. Focus moves to the record only when a decision replaces a focused action; mounting a pre-decided record does not move focus. The seal is hidden from assistive technology because its mark is decorative. Forced colors use system CanvasText and Canvas paint. Coverage is in [plan-gate-drawing.spec.ts](../../apps/docs/e2e/plan-gate-drawing.spec.ts).

## Decisions

- **A1, Oct 13, 2026:** Yankun chose primary Button approval and an approved record carrying the seal impression. The seal remains limited to primary action, current selection, focus, and this approved record.
- **A2, Oct 13, 2026:** Yankun chose the solid cut 白文 impression: accent fill with the surface showing through as the mark.
- **G2 remains open:** Until the host-default mark is decided, `mark` is required; docs pass 准.
- **WP 3.1–3.2:** [Components plan](../plans/2026-10-components/README.md) records the resolved rows and remaining gate.
