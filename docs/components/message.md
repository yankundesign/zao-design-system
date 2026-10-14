---
name: Message
status: study
intent: Present one authored message with ordinary content, explicit lifecycle status, and optional recovery actions.
use-when:
  - Conversation needs readable user requests and assistant responses with visible authorship.
  - A host preserves partial response content while reporting streaming, stopped, or failed work.
avoid-when:
  - A generic Card, notification, or task item does not represent an authored message.
  - The component should generate, sanitize, fetch, persist, stop, or retry response content itself.
composes-with:
  - Conversation
  - Composer
  - Button
  - Card
  - Table
parts:
  - root
  - header
  - author
  - metadata
  - status
  - error
  - content
  - actions
motions:
  - reveal
tokens:
  - type.body
  - type.label
  - type.caption
  - font.family.text
  - font.weight.medium
  - space.1
  - space.1-5
  - space.2
  - space.3
  - space.4
  - color.fg.default
  - color.fg.muted
  - color.bg.surface
  - color.border.subtle
  - color.danger.text
  - radius.facet
  - depth.rest.small
  - stroke.hairline
  - motion.duration.reveal
  - motion.duration.loading
  - motion.easing.reveal
---

# Message

**Reference contract, Oct 12, 2026.** The authorized [Conversation and Composer plan](../plans/2026-10-conversation/README.md) refines this separate export within its existing family scope. The complete contract supports reference/agent use, not additional website sections or a new published component.

## Anatomy

Message exports `Root`, `Content`, and `Actions`. Root is a native article with `data-zao-component="message"`; it generates a visible author header and renders supplied children and optional error. It supplies neither a conversation list item nor a request transport. Nest it in [Conversation.Item](conversation.md) when it belongs to the chronological transcript.

| Authored `data-zao-slot` | Owner, presence, and purpose                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`                   | Message.Root; article with kind/status markers and default author-based name.                                                                  |
| `header`                 | Root; wrapping native header for author, optional metadata, and optional status.                                                               |
| `author`                 | Root; generated label. Assistant authors are visible and muted; the user author remains the article's accessible name but is visually hidden.  |
| `metadata`               | Root; truthy metadata React node with a decorative leading separator.                                                                          |
| `status`                 | Root; visible Responding, Stopped, or Response failed label when status is not complete.                                                       |
| `error`                  | Root; truthy recovery React node after children, independent of the selected status.                                                           |
| `content`                | Message.Content; native div for ordinary React content.                                                                                        |
| `actions`                | Message.Actions; wrapping native div for explicit host-owned controls; `placement="header"` aligns compact response utilities with the author. |

The metadata's fine separator and status mark are CSS paint, not additional parts. Streaming uses Button's loading arc; unfinished assistant responses also carry a dashed construction line on the article edge. The article has `space.1-5` internal gaps and `space.2 space.3` padding. A header-placed action shares the author row; all other children retain DOM order below it. Older header utilities show on fine-pointer hover/focus, while coarse pointers keep them visible.

User messages are built slips at the trailing edge: a subtle perimeter, two banded planes at small rest depth, a faceted corner, and a max width of 85% or 136 fen. Their text remains start-aligned. Assistant prose stays full-width on the open canvas; its `pre` uses the stepped construction well while retaining the host's border, fill, and named scroll region. Code still preserves whitespace and scrolls horizontally.

Sources: [component and types](../../packages/react/src/components/message.tsx), [message CSS](../../packages/react/src/styles/conversation.css), and [Conversation's announcement bridge](../../packages/react/src/components/conversation.tsx). Metadata includes Message's own styles, not tokens consumed by arbitrary Cards, Tables, or Buttons in its content. The user border and metadata rule use literal 1px drawing in the current CSS; this reference does not falsely attribute them to a structural token.

## States

| Input/state                  | Current treatment                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `kind="user"`                | Trailing-edge built slip; “You” remains the accessible author name without visible author text.         |
| `kind="assistant"`           | Full-width open prose; assistant author is visible in muted ink.                                        |
| `status="complete"`          | Default. No status label or decorative status square.                                                   |
| `status="streaming"`         | Visible Responding label and Button loading arc; an ink construction line marks the article edge.       |
| `status="stopped"`           | Visible Stopped label and muted construction line; supplied partial content remains mounted.            |
| `status="error"`             | Visible Response failed label and danger construction line. Recovery guidance still comes from `error`. |
| `error` outside error status | Any truthy error node still renders; the component does not infer status from it.                       |
| Empty content                | Header remains; no generated placeholder or empty-state response is inserted.                           |

Message has no size/variant, native disabled, read-only, invalid, selected, pressed, or pending-action state. A streaming status is information, not `aria-busy` on the article or a lock on inner controls. Supplied actions and rich content own their actual states.

## Interaction

| Export / public input         | Type and default                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `Root author`                 | Required string; visible for Assistant and visually hidden for You, while still naming the article and lifecycle reports. |
| `Root kind`                   | Required `user \| assistant`.                                                                                             |
| `Root status`                 | `complete \| streaming \| stopped \| error`; default `complete`.                                                          |
| `Root metadata`, `Root error` | Optional React nodes.                                                                                                     |
| `Root` native props/ref       | Article attributes/children with forwarded HTMLElement ref. `aria-labelledby` overrides the generated author association. |
| `Content`                     | Native div attributes/children with forwarded HTMLDivElement ref.                                                         |
| `Actions`                     | Native div props/ref plus `placement`, `end` by default or `header` for compact utilities.                                |

Use ordinary React content, explicit sources, and existing components. The host owns message identity/order, author strings, stream updates, status changes, stopping, and retries. Root never truncates partial children on error or stop, but it cannot prevent the host from replacing them. There is no Markdown parser, sanitizer, link policy, clipboard operation, stream buffering, request cancellation, or retry action built into Message.

Content and Actions do not require a Message context to render, though their intended composition is inside Root. Buttons in Actions use their own native activation and cancellation; the article itself has no click/keyboard handler or composite focus model. Author controls should not be inferred from a visible author label.

When under Conversation.Root and that root omits its `announcement` prop, an effect reports status transitions through the shared internal bridge. Initial `streaming` also reports; initial complete/stopped/error does not. The messages are `${author} is responding.`, `${author} response ready.`, `${author} response stopped.`, and `${author} response failed. Review the message for recovery options.` Updates to body text, metadata, or author alone do not report a new lifecycle event. Author changes during a simultaneous status change affect the reported string.

Outside Conversation, or when Conversation supplies any defined `announcement`, the automatic bridge is unavailable and Message adds no substitute live region. The host owns lifecycle feedback there. The bridge stores the latest report, not a durable queue; it should not be used as a transport or guaranteed notification system.

```tsx
import { Message, Button } from '@zao/react';

<Message.Root author="Assistant" kind="assistant" status="error" error="Try again.">
  <Message.Content>{partialResult}</Message.Content>
  <Message.Actions>
    <Button size="small" variant="secondary" onClick={retryResponse}>
      Retry
    </Button>
  </Message.Actions>
</Message.Root>;
```

Here `retryResponse` is a host callback. It must manage actual pending semantics and preserve or replace content intentionally; the example does not imply that Message performs the retry.

## Motion

An entering user slip reveals upward on Conversation's Reveal role; the initial history, `entering={false}`, and assistant messages stay at rest. The assistant's dashed construction line appears with its status, and Responding uses Button's existing loading arc. Stream updates render ordinary host content; they are not a token-by-token reveal. Header utilities on older messages appear on fine-pointer hover/focus with a fast standard opacity change; coarse pointers keep them visible. These effects belong to the Conversation/Message family, not a new Message prop or motion role.

Reduced motion does not need to disable Message's own motion because none is present. Inner Buttons, Charts, Cards, or other supplied components retain their own approved motion and protections; their dependencies are not declared as Message roles. Message has no transparency layer or reduced-transparency treatment. No timing, new curve, or performance result is inferred from the family study.

## Accessibility

Keep the author meaningful. The article defaults to `aria-labelledby` pointing at that label; a supplied `aria-labelledby` owns the alternative relationship. “You” is visually hidden but still names user slips. The assistant author remains visible. The content remains ordinary semantic React content. Do not mark streamed body text as a live region: separate Conversation feedback announces lifecycle transitions rather than every token. Message's error is visible guidance without its own alert role; Conversation's status bridge or explicit host feedback supplies announcements.

Status words remain visible independently of the dashed construction line/loading arc, so color is not the only lifecycle cue. Decorative separators and the construction line carry no new accessible object. User versus assistant kind controls paint; authored names supply the actual identity even when “You” is visually hidden. Stopped/failed partial content remains available unless the host removes it. Recovery needs explicit, named, keyboard-operable actions.

Rich content authors must preserve headings, links, source labels, table semantics, image names, and named focusable horizontal scroll regions for wide code/data. Content's `pre` overflow style alone is insufficient for the latter. Message does not sanitize unsafe host HTML or auto-label complex content. Word wrapping, logical-start user rules, and wrapping action rows support RTL/narrow use. There is no custom forced-color palette or focus decoration on the passive article; native/system adjustments and each actual control's focus treatment remain in effect.

The [Conversation browser tests](../../apps/docs/e2e/conversation.spec.ts) cover authored content, status drawing, request reveal, action placement, lifecycle feedback, preserved stop/failure output, rich content, narrow layout, RTL, and reduced motion. The docs specimen also exercises host-owned sent-context snapshots; those host behaviors are outside Message's own responsibility.

## Decisions

No Message approval paragraph exists in `BRIEF.md`; do not attribute the working family record to that file. The source is [Quiet instrument's design](../../explorations/su-studies/quiet-instrument/design.md#current-study-idea). The spec keeps source approvals intact and adds no migration.

| Record                                                                                                                | Scope and current precedence                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Oct 7 approved Composer and Conversation implementation                                                               | Includes explicit authorship, restrained user surfaces, open assistant prose, existing Card/Table rich results, separate polite lifecycle feedback, and preserved partial stopped/failed content within the two-family study and local simulations. It does not give Message transport ownership or approve new response animation. |
| Oct 7 requested compact assistant refinement                                                                          | Describes deliberate turn spacing, subordinate metadata, and open assistant prose inside an embedded working transcript. Its usability questions remain open.                                                                                                                                                                       |
| Oct 11 authorized finish, [AGENTS.md](../../AGENTS.md#current-design-direction-quiet-construction)                    | Message inherits published warm semantic ink and surfaces. Inner controls inherit their own current construction and motion; Message gains no facet, raised base, seal background, or new focus treatment.                                                                                                                          |
| Oct 12 authorized Conversation and Composer plan, [decision drafts](../plans/2026-10-conversation/decision-drafts.md) | User messages become trailing-edge slips; assistant lifecycle gets a dashed line and the existing loading arc. Header-placed utilities remain opt-in, and request Reveal is driven by Conversation.Item. No new Message component or lifecycle ownership is added.                                                                  |

**Editorial scope note:** authorship identifies the message; status describes host-owned work; explicit actions control it. Reading comfort and recovery benefits are hypotheses in the study, not new measured claims. `study` reflects that family scope and the lack of a separate standalone component approval.
