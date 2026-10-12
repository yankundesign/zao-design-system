---
name: Conversation
status: approved
intent: Keep chronological messages readable while following new content only when the reader remains at the end.
use-when:
  - A host-owned transcript needs a named scroll region and separate lifecycle feedback.
  - A reader may inspect earlier content while later responses or rich results change size.
avoid-when:
  - A component should own model requests, stream transport, message storage, or retry scheduling.
  - A flat static list does not need following or lifecycle feedback.
composes-with:
  - Message
  - Composer
  - Button
  - Card
  - Table
parts:
  - root
  - viewport
  - list
  - item
  - latest
  - announcement
motions:
  - lift
  - seat
tokens:
  - unit
  - type.button
  - font.family.text
  - space.3
  - space.5
  - radius.action
  - radius.facet
  - stroke.hairline
  - depth.rest.control
  - depth.rest.surface
  - depth.lift
  - depth.axis.x
  - depth.axis.y
  - color.fg.default
  - color.fg.disabled
  - color.bg.surface
  - color.bg.hover
  - color.bg.sunken
  - color.border.subtle
  - color.focus.ring
  - motion.duration.lift
  - motion.easing.lift
  - motion.duration.seat
  - motion.easing.seat
  - motion.duration.grade.7
  - motion.easing.fold-enter
  - space.0-5
  - space.1
  - space.1-5
  - space.2
  - motion.duration.fast
  - motion.easing.standard
---

# Conversation

**Reference contract, Oct 11, 2026.** `approved` records the Oct 7 working transcript family approval in [Quiet instrument's design](../../explorations/su-studies/quiet-instrument/design.md#current-study-idea). The later compact presentation is still a specifically attributed request; metadata does not approve every later treatment or a release. This complete reference is for agents and maintainers, not an expanded website page.

## Anatomy

Conversation exports a compound object: `Root`, `Viewport`, `List`, `Item`, and `Latest`. The named Root is a native section with `data-zao-component="conversation"`. It provides scroll registration and a separate Message-announcement bridge. The host supplies a bounded height; the component supplies no window, drawer, Composer, frame planes, persistence, or network connection.

| Authored `data-zao-slot` | Owner, element, and presence                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `root`                   | Conversation.Root; native named section.                                                                                      |
| `viewport`               | Conversation.Viewport; named, keyboard-focusable native div scroll region.                                                    |
| `list`                   | Conversation.List; native ordered list with explicit list role.                                                               |
| `item`                   | Conversation.Item; native list item for a host-owned chronological entry.                                                     |
| `latest`                 | Conversation.Latest; conditional shared quiet Button root. Its own Button marker and face/side hooks retain Button ownership. |
| `announcement`           | Root's always-mounted visually hidden atomic polite status region.                                                            |

Viewport, List, and Latest require Root and throw when used outside it. Item is a native list item wrapper and does not read that context. Message is a separate export with its own hooks; Composer is a sibling preparation control, not a Conversation part. There are no portals in Conversation itself.

Root is a shrinking flex column with `space.3` between children. Viewport grows within it, has `min-height: 0`, vertical scrolling, hidden horizontal overflow, `overflow-anchor: none`, and `scroll-behavior: auto`. List is a column with `space.5` turn gaps and `space.3` padding; chronological list order is the DOM order provided by the host. Latest is a small (28px) quiet Button by default. The transcript's own structure is stationary and uses default semantic ink. [Message](message.md) and rich content own their type roles and surfaces.

Sources: [component and types](../../packages/react/src/components/conversation.tsx), [transcript/message CSS](../../packages/react/src/styles/conversation.css), [Button](button.md), and [current study](../../explorations/su-studies/quiet-instrument/design.md#current-study-idea). Token metadata includes the shared Latest Button dependencies but not arbitrary rich-content tokens. Button controls remain independent of transcript scroll geometry.

## States

Conversation has no variant/size, loading, disabled, selected, read-only, or invalid state on Root. Message and host controls own their own states.

| State                           | Current behavior                                                                                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| At latest                       | Following starts enabled. Measured content changes keep the viewport at the end; Latest is absent unless it still holds focus.                                                            |
| Reading earlier messages        | Upward reader input suspends following. Content growth or contraction does not intentionally force the reader back to the end. Latest is available.                                       |
| Return to latest                | Activating Latest directly writes scrollTop to the end and reenables following without taking focus elsewhere. Scrolling to within the 1px tolerance of the end also reenables following. |
| Latest focused after activation | The control stays mounted even at latest until blur, retaining the keyboard target that was activated.                                                                                    |
| Empty list                      | Ordinary empty content; no generated empty state, placeholder response, or request control is added.                                                                                      |
| Host announcement supplied      | A defined `announcement`, including an empty string, disables automatic Message reports and owns the live-region text.                                                                    |

There is no exposed `following`, `atLatest`, scroll position, or scroll-command prop. Those internal values manage the one registered viewport/list pair. Multiple competing Viewports or Lists are not a supported ownership model: their callbacks would overwrite the Root registration.

## Interaction

The host supplies chronological entries with stable keys and preserves response content, including partial results. Render rich content using existing components. Requests, acceptance, stream transport, stopping, retry, IDs, and storage are host responsibilities; Conversation only follows geometry and presents lifecycle feedback.

| Export / public input | Type and default                                                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Root`                | Native section attributes/ref plus required `aria-label: string` and optional `announcement: string`.                                                 |
| `Viewport`            | Native div attributes/ref. `tabIndex` defaults to `0`; name defaults to `${Root label} messages`, with its own `aria-label` override. Role is region. |
| `List`                | Native ol attributes/ref with explicit list role.                                                                                                     |
| `Item`                | Native li attributes/ref; host children define the entry.                                                                                             |
| `Latest`              | Button props except `variant`; always quiet, size defaults to small, children default to `Latest response`.                                           |

Root observes the registered viewport and list with `ResizeObserver`, batching measurements into one requestAnimationFrame. When following, a measurement scrolls directly to the current end. When not following, it measures whether the reader has reached the end. Geometry tracks scrollTop, scrollHeight, and clientHeight, with 1px tolerance for fractional values.

Upward wheel input, a downward-moving finger during touch scroll-back, or viewport-targeted ArrowUp/PageUp/Home/Shift+Space suspends following before the layout observer reacts. Default-prevented keyboard input is ignored. Keys from nested controls are not intercepted as viewport scroll commands. Native scrolling continues; no gesture is canceled. A recorded programmatic write and layout-height changes are distinguished from deliberate scroll-back, so growth or contraction does not by itself disable following. The browser may still clamp position when content shrinks; the component is not a virtualized list or a persistent scroll-position store.

Latest uses Button's native pointer/keyboard/touch activation. A supplied `onClick` runs first and can prevent its scroll action. It does not move focus to a message, Composer, or viewport. Focus bookkeeping retains the mounted button until blur. Disabled/loading/native props may be supplied through Button, but they do not disable Root's geometry tracking.

Event listeners, ResizeObserver, and pending animation frames are cleaned up when registration changes or Root unmounts. Ref composition respects ordinary forwarded refs and React 19 callback-ref cleanup. Conversation expects browser `ResizeObserver`; it has no fallback for missing ResizeObserver, no virtualization, and no transport cancellation.

```tsx
import { Conversation, Message } from '@zao/react';

<Conversation.Root aria-label="Workspace assistant" className="h-dvh">
  <Conversation.Viewport>
    <Conversation.List>
      <Conversation.Item>
        <Message.Root author="Assistant" kind="assistant">
          <Message.Content>Here is the result.</Message.Content>
        </Message.Root>
      </Conversation.Item>
    </Conversation.List>
  </Conversation.Viewport>
  <Conversation.Latest />
</Conversation.Root>;
```

## Motion

Following and Latest scroll directly through `scrollTop`, with CSS `scroll-behavior: auto`; they never use smooth scrolling, an easing curve, or a timed reveal. RequestAnimationFrame batches measurement rather than animating a response. Root, list, entries, and lifecycle status text have no intrinsic transition or idle animation.

The `lift`/`seat` inventory concerns only the inherited Latest Button. It reads the shared duration and easing roles for its face, with grade 7/fold-enter focus brackets; the transcript does not move with those controls. Reduced motion preserves immediate scroll behavior and the Button's existing stationary-face/fill feedback. Rich Cards, Tables, and other controls retain their own separately owned behavior. Conversation has no translucent layer or reduced-transparency override.

## Accessibility

Name Root meaningfully and retain Viewport's keyboard target. The viewport is a named region, messages are in a native ordered list, and Message supplies explicit authorship and ordinary content semantics. Do not make streamed transcript content an `aria-live` region. The separate `role="status"`, polite, atomic `announcement` slot reports lifecycle changes instead.

When `announcement` is omitted, Message reports an initial streaming state and later status transitions through Root's internal bridge. The bridge stores the most recent reported string; it is not a queued announcer or a replay of all historical messages. A supplied announcement overrides that bridge. Repeated identical text may not produce a new announcement. The host should coordinate simultaneous responses or richer notification requirements.

Latest retains its existing focus on activation and stays present while focused. The scroll region retains `outline-focus`; Latest uses Button's outside brackets and system-outline forced-color fallback. Root itself is not an extra keyboard control. Wide code and tables need their own named, focusable horizontal scroll regions within rich content: Viewport clips horizontal overflow and does not automatically add those labels or targets.

Native touch/keyboard scrolling, semantic ink, and logical message spacing continue in RTL and reduced motion. Conversation has no separate forced-color palette; inner controls and surfaces retain their own system adjustments. The host must preserve sensible chronology, accessible rich content, and suitable height constraints.

Existing [Conversation tests](../../apps/docs/e2e/conversation.spec.ts) cover named native content, following and scroll-back, rich-content growth/contraction, keyboard Latest focus, lifecycle announcements, partial output, narrow layouts, RTL, and reduced motion. [Composer tests](../../apps/docs/e2e/composer.spec.ts) cover the request-preparation sibling. Those are existing coverage pointers, not freshly rerun evidence or a guarantee of transport behavior.

## Decisions

No Conversation approval paragraph appears in `BRIEF.md`. The local family approval belongs to [Quiet instrument's design](../../explorations/su-studies/quiet-instrument/design.md#current-study-idea), whose exact scope covers the two families and their local docs simulations. Source text remains in place.

| Record                                                                                             | Scope and reason                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Oct 7 approved Composer and Conversation implementation                                            | Establishes shared reading alignment, explicit authorship, restrained user surfaces/open assistant prose, existing rich-result components, native chronological lists, named keyboard viewport, follow-at-bottom, preserved scroll-back, Latest without focus theft, separate lifecycle feedback, and readable stopped/failed partial output. It adds no global interaction or motion values. |
| Oct 7 requested compact assistant refinement                                                       | Places the transcript with a docked compact Composer inside a working local assistant specimen; simulation controls stay outside that surface. This presentation does not add transport or request ownership to Conversation.                                                                                                                                                                 |
| Oct 11 authorized finish, [AGENTS.md](../../AGENTS.md#current-design-direction-quiet-construction) | Changes inherited materials and shared Button motion/focus, including Latest. Immediate transcript following and the viewport outline remain separate behaviors.                                                                                                                                                                                                                              |

**Editorial scope note:** separate geometry following from message transport and announcements from streamed text. Comfort in long reading and recovery remain explicitly stated study hypotheses, not measured improvements or an overall release approval.
