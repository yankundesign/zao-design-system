---
name: Plan
status: approved
intent: Show a host-owned run as ordered steps whose statuses and results stay visible.
use-when:
  - A multi-step agent run needs current progress and a place for produced work.
  - A person needs to see which step is waiting for them.
avoid-when:
  - A compact background status or a single Message lifecycle is sufficient.
composes-with:
  - Conversation contains a Plan when its lifecycle changes belong in the transcript.
  - ApprovalGate can be shown as the result of a waiting step.
parts:
  - root
  - header
  - label
  - summary
  - steps
  - step
  - index
  - title
  - detail
  - status
  - body
  - pen
motions:
  - reveal
  - reveal-exit
  - slide
tokens:
  - motion.duration.fast
  - motion.duration.reveal
  - motion.duration.slide
  - motion.easing.reveal
  - motion.easing.slide
  - color.bg.canvas
  - color.border.default
  - color.border.subtle
  - color.danger.border
  - color.danger.subtle
  - color.danger.text
  - color.fg.default
  - color.fg.muted
  - stroke.hairline
  - space.0-5
  - space.1
  - space.1-5
  - space.2
  - space.3
  - space.5
  - space.6
  - type.caption
  - type.label
---

# Plan

## Anatomy

`Plan.Root` renders a named `section` marked `data-zao-component="plan"`, a header, and a native ordered list. Its `root`, `header`, `label`, `summary`, and `steps` hooks name those elements. Each `Plan.Step` is an `li` with `data-zao-status`; `step`, `index`, `title`, `detail`, `status`, `body`, and `pen` name its authored parts. The station and segment are CSS paint on each step, not DOM slots. Source: [plan.tsx](../../packages/react/src/components/plan.tsx) and [Plan rail styles](../../packages/react/src/styles/theme.css).

The header counts `done` and `declined` as complete. The rail sits at inline start. The title and detail align with the body content; the two-digit index is decorative because `ol` supplies position semantics. Existing Button loading paint supplies the running arc.

## States

`status` is `planned | running | waiting | done | declined | failed | skipped`. Planned and skipped steps use muted text; running and waiting use the default ink; failed uses danger semantics. Done and declined fill their station and segment. Running and waiting expose `aria-current="step"`. When no step is planned, running, waiting, or failed, the summary begins “Finished”.

`entering` on Root controls the drawn arrival. When omitted, only a Plan mounted after its Conversation's first committed render enters. Restored plans can pass `entering={false}`. A step added later draws alone without the initial stagger. The host owns every status and result; Plan does not execute a step.

## Interaction

Plan has no interactive target. Its native section and list-item attributes and refs are forwarded. The host changes `status`, children, and `entering`; `announce` defaults to true for lifecycle messages inside Conversation. Outside Conversation the host owns announcements.

```tsx
<Plan.Root label="Remove inactive seats" entering={isNewRun}>
  <Plan.Step status="done" title="Read seat assignments" />
  <Plan.Step status="waiting" title="Review the removal list">
    <ApprovalGate {...request} />
  </Plan.Step>
</Plan.Root>
```

## Motion

Initial steps reveal one at a time on Reveal, spaced by the existing Fast duration. A later step reveals without delay. Completed rail fill uses Slide. Status changes do not restart arrival. Reduced motion removes the arrival and makes rail changes immediate. The pen is decoration, not a control.

## Accessibility

Root's visible label names the section. The native ordered list exposes step position; visible status words carry state. Running and waiting are the current step. Status changes after mount use Conversation's existing polite announcement region when available; `announce={false}` opts out. RTL follows logical inline start. Forced colors use CanvasText for the rail, and reduced motion keeps the settled content visible without travel. Browser coverage: [plan-gate-drawing.spec.ts](../../apps/docs/e2e/plan-gate-drawing.spec.ts).

## Decisions

- **P1, Oct 13, 2026:** Yankun chose the flat ruler rail with a station and segment per step. Finished and declined steps fill their station and segment.
- **P2, Oct 13, 2026:** Yankun chose the drawn-in arrival, one Fast interval apart. Existing Menu row behavior remains unchanged.
- **WP 2.1–2.2:** [Components plan](../plans/2026-10-components/README.md) records the implementation recipe and host ownership.
