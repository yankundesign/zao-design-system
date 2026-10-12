---
name: Composer
status: approved
intent: Prepare a controlled multiline request with optional context and local files before the host accepts it.
use-when:
  - A person prepares a request and the host owns its acceptance and response lifecycle.
  - Draft text, included context, and local attachments need one compact writing tray.
avoid-when:
  - A single setting or ordinary form value needs TextField.
  - The component would be expected to upload files, send a network request, or generate a response itself.
composes-with:
  - ComposerContextChip
  - Conversation
  - Message
  - IconButton
parts:
  - context
  - attachments
  - attachment-preview
  - attachment-name
  - writing
  - label
  - input
  - guidance
  - error
  - actions
motions:
  - lift
  - seat
tokens:
  - unit
  - type.body
  - type.label
  - type.caption
  - type.button
  - font.family.text
  - size.control.sm
  - size.icon.sm
  - size.icon.md
  - space.1
  - space.1-5
  - space.2
  - space.3
  - space.4
  - space.6
  - space.8
  - space.20
  - radius.none
  - radius.action
  - radius.facet
  - radius.overlay
  - depth.contact
  - depth.rest.control
  - depth.rest.surface
  - depth.lift
  - depth.axis.x
  - depth.axis.y
  - color.bg.canvas
  - color.bg.surface
  - color.bg.sunken
  - color.bg.hover
  - color.bg.active
  - color.fg.default
  - color.fg.muted
  - color.fg.disabled
  - color.fg.on-accent
  - color.border.subtle
  - color.border.default
  - color.border.strong
  - color.accent.solid
  - color.accent.solid-hover
  - color.danger.text
  - color.focus.ring
  - material.overlay.fill
  - material.overlay.fill-solid
  - material.overlay.border
  - material.overlay.shadow
  - material.overlay.blur
  - motion.duration.lift
  - motion.easing.lift
  - motion.duration.seat
  - motion.easing.seat
  - motion.duration.grade.7
  - motion.easing.fold-enter
  - space.0-5
  - motion.duration.fast
  - motion.easing.standard
---

# Composer

**Reference contract, Oct 11, 2026.** `approved` records the Oct 7 family implementation and raised-tray approvals in [Quiet instrument's design](../../explorations/su-studies/quiet-instrument/design.md#current-study-idea). Later compact, focus, and spacing refinements retain their actual requested status; metadata is not a blanket approval of those details or a release decision. The complete reference supports agents; it is not extra website prose. No runtime or fresh test result is introduced here.

## Anatomy

The root is a native `<form>` with `data-zao-component="composer"`, a forwarded `HTMLFormElement` ref, and a controlled native textarea. It is a stationary square writing tray with one semantic perimeter and a joined contact edge. Its own contact is a zero-blur shadow at `−axis × depth.contact`; it is not Button's banded planes or a moving face. Only focusing the textarea strengthens that contact from `border-default` to `border-strong`; focusing a toolbar control or context chip does not. Disabled changes it to `border-subtle`.

| Authored `data-zao-slot` | Owner, presence, and purpose                                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context`                | Composer; wrapping supplied context region, mounted only when the `context` node is truthy.                                                                 |
| `attachments`            | Composer; native labeled list, mounted when the supplied attachment array is nonempty.                                                                      |
| `attachment-preview`     | The local `AttachmentPreview` helper; image element only after an image object URL is available and has not failed. The FileIcon fallback has no such slot. |
| `attachment-name`        | Composer; visible full filename inside every attachment tile.                                                                                               |
| `writing`                | Composer; groups the native label, textarea, hidden guidance, and conditional error.                                                                        |
| `label`                  | Composer; visually hidden native label associated with the textarea ID.                                                                                     |
| `input`                  | Composer; controlled one-row textarea with no inner border or padding.                                                                                      |
| `guidance`               | Composer; visually hidden keyboard instruction associated with the textarea.                                                                                |
| `error`                  | Composer; conditional alert for the displayed host or local error.                                                                                          |
| `actions`                | Composer; wrapping toolbar containing optional attachment selection and host actions, plus Send or Stop.                                                    |

`context-chip` and `context-icon` belong to the separately exported [ComposerContextChip](composer-context-chip.md). `icon`, `tooltip`, and the side/face slots on toolbar controls belong to [IconButton](icon-button.md) and its [Button](button.md); they are not Composer parts. A hidden file input has no authored slot. IconButton tooltip portals remain inside their own wrapper and inherit its island.

The tray uses `px-4 py-3`, an internal `gap-2`, and one extra fen before its actions. The textarea uses `type-body`; filenames use `type-label`; context, sizes, guidance, and errors use `type-caption`. The current compact writing minimum is 24px or the body line box, whichever is larger. Layout measurement grows from the one-line rest to eight line boxes, then scrolls vertically. Width changes and loaded fonts trigger a remeasurement; text can wrap anywhere. Attachment tiles wrap, cap their inline size at the lesser of their container and three `space.20` units, and show 32px square previews. Their names are not truncated.

Built-in actions are small 28px IconButtons. Attach alone draws its icon at `size.icon.md` (20px); a logical margin computed from icon and control size aligns its plus drawing with the text without shrinking its target. Other action icons keep the small size. The fixed local SVGs reuse Iconoir geometry; Composer adds no icon runtime dependency.

Sources: [implementation and exported types](../../packages/react/src/components/composer.tsx), [Composer CSS](../../packages/react/src/styles/composer.css), [local icons](../../packages/react/src/components/composer-icons.tsx), and [shared theme](../../packages/react/src/styles/theme.css). The token inventory includes direct tray dependencies and the shared Button/material dependencies of its built-in actions. It does not declare the tokens of arbitrary host-supplied content.

## States

Composer has no `size` or `variant` prop and no persistent selected state. Its draft and files are always supplied by the host.

| State              | Current behavior and precedence                                                                                                                                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty              | Send is disabled when trimmed text is empty and there are no files. A file-only request is valid for this guard; actual native validation still applies.                                                                                                                                                    |
| Ready              | Send is available when not disabled, responding, or internally sending, and either text or files are present.                                                                                                                                                                                               |
| Sending            | A synchronous ref guard prevents duplicate sends before React updates. Send is native-disabled and busy; the root has `data-zao-pending`. The textarea, file preparation, and context removal remain editable unless `disabled` is set.                                                                     |
| Responding         | Stop replaces Send. The host owns `responding`; request acceptance alone does not change it. The next draft and attachments remain editable. Sending is blocked while responding.                                                                                                                           |
| Stopping           | Stop is native-disabled and busy until its callback settles. Missing `onStop` also disables Stop. The component does not declare the response stopped or clear `responding`.                                                                                                                                |
| Disabled           | Native textarea, built-in actions, hidden file input, attachment removal, and nested ComposerContextChip controls are disabled. Host-supplied `actions` and arbitrary context must implement their own disabled behavior.                                                                                   |
| Error              | A truthy host `error` takes precedence over the local send/stop failure. The textarea becomes invalid and describes the visible alert. Errors do not independently block submission. Editing, file selection, attachment removal, or a new send/stop clears the local error; the host clears its own error. |
| Read-only textarea | `textareaProps.readOnly` preserves native read-only editing behavior. It is not a Composer-wide read-only state and does not by itself block Send or attachment preparation.                                                                                                                                |
| Focus              | Pointer entry suppresses the textarea's outside outline while retaining the caret and stronger tray contact. Keyboard entry retains `outline-focus`. Blur clears pointer treatment; toolbar controls retain their own focus treatment.                                                                      |

The component does not expose loading as a Button spinner, upload progress, generated response content, or a local success state. Send and Stop represent different host lifecycle actions; a completed callback is not proof that a network operation was canceled or a response arrived.

## Interaction

Use the compact draft for a request, keep work-state prose outside the tray, and show named context before the writing area. The host owns request acceptance, clearing accepted drafts, uploads, attachment validation, response state, and transcript changes. These ownership rules preserve the next draft while earlier work is pending.

| Public input                          | Type and default                                                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`, `value`, `onValueChange`     | Required string, controlled string, and `(value: string) => void`.                                                                                      |
| `onSend`                              | Required `(draft: ComposerDraft) => void \| Promise<void>`.                                                                                             |
| `responding`, `onStop`                | Boolean, default `false`; optional `() => void \| Promise<void>`.                                                                                       |
| `disabled`, `error`                   | Boolean, default `false`; optional React node.                                                                                                          |
| `context`, `actions`                  | Optional React nodes; the host chooses existing controls and state.                                                                                     |
| `attachments`                         | Readonly array of `{ id: string; file: File }`, default empty. Stable IDs, not filenames, identify tiles.                                               |
| `onFilesSelect`, `onRemoveAttachment` | Optional `(files: File[]) => void` and `(id: string) => void`.                                                                                          |
| `accept`, `multiple`                  | Optional native file filter; Boolean default `true`. `accept` is a picker hint, not validation.                                                         |
| `placeholder`                         | Explicit string wins over `textareaProps.placeholder`; otherwise `Ask anything…`.                                                                       |
| `textareaProps`                       | Native textarea attributes/events except children, value/defaultValue, onChange, disabled, and rows. Default empty.                                     |
| Other form props / ref                | Native form props except children and onSubmit; forwarded `HTMLFormElement` ref. The form name defaults to `label` unless its `aria-label` is supplied. |

Plain Enter inserts a line. Ctrl or Cmd + Enter prevents the newline and calls the native form's `requestSubmit()` once, ignoring repeats. The Send control uses native submit activation, so both paths use the same form validation and guarded handler. `textareaProps.onKeyDown` runs first and may cancel with `preventDefault()`. Composition start/end and blur maintain an IME guard; `isComposing` and key code 229 also block shortcut submission. The guard also stops a Send submission while composition is active.

An accepted send receives the original text, including whitespace and line breaks, plus a new array of attachment identity/File pairs from that activation. Later edits do not rewrite that snapshot. The component never clears text or files; the host should distinguish that submitted snapshot from a newer draft before clearing anything. A rejected/thrown `onSend` displays “Could not send your request. Your draft is preserved. Try sending again.” The component itself retains the controlled draft; a host mutation inside a failed callback cannot be undone by it.

Stop calls `onStop` once while responding. Its click prevents default submission, including when a synchronous host update reuses the button as Send. A failed callback displays “Could not stop the response. Try stopping again.” The host must keep `responding` true until it confirms its actual result. No AbortSignal, network cancellation, upload, or retry scheduling is implemented. Unmount suppresses local error/state writes after pending callbacks settle; it does not cancel those callbacks.

Selecting files clears the hidden input's value before invoking `onFilesSelect`, allowing the same file to be picked again. Cancellation/no files invokes no callback. Selection and removal callbacks are synchronous host hooks; unlike send/stop, their exceptions are not caught here. Image previews create one temporary object URL per File, retain it across unrelated draft edits, and revoke it on replacement/removal/unmount. Unsupported object URLs, non-images, and failed images fall back to FileIcon while retaining metadata. There is no upload or file-content processing.

```tsx
import { Composer, ComposerContextChip } from '@zao/react';

<Composer
  label="Request"
  value={draft}
  onValueChange={setDraft}
  onSend={acceptRequest}
  responding={responding}
  onStop={requestStop}
  attachments={files}
  onFilesSelect={addFiles}
  onRemoveAttachment={removeFile}
  context={
    contextIncluded ? (
      <ComposerContextChip label="Snapshot" onRemove={() => setContextIncluded(false)} />
    ) : undefined
  }
/>;
```

## Motion

The writing plane changes height immediately through layout measurement; it has `transition: none`. Contact focus emphasis is also immediate. The tray, filenames, attachment tiles, and context regions have no intrinsic spatial transition or idle motion. A file preview becoming available is an ordinary mount, not an animated reveal.

The `lift` and `seat` entries describe the existing shared IconButton faces, not a lift of the tray. Those faces read `motion.duration.lift` / `motion.easing.lift` for hover/release and `motion.duration.seat` / `motion.easing.seat` for seating; the authorized finish currently derives lift from grade 7 and fold-enter, and seat from fast/standard. Their focus brackets use grade 7 and fold-enter. Details and interrupted/released input remain owned by [Button](button.md). Disabled actions suppress ordinary spatial feedback. Reduced motion keeps those faces stationary with their existing fill feedback; textarea growth and native submission remain immediate.

There is no special reduced-transparency surface or blur on Composer itself. Tooltip material and any transparency fallback belong to IconButton's shared overlay utility. No performance claim or new motion decision is made by this source review.

## Accessibility

Supply a meaningful `label`. The visually hidden native label names the textarea; hidden guidance describes its shortcut. The named form and textarea retain native editing and constraint validation. A host description is appended to guidance and error IDs. Displayed errors use `role="alert"`; pending Send and Stop expose `aria-busy` on their native-disabled controls. Composer does not add a live region for successful acceptance or response completion; that feedback belongs to the host and Conversation.

Each built-in icon action has a required visible tooltip and accessible name, with Escape dismissal through IconButton. Attachment previews identify their filename; full filename text and metadata remain present even if an image fails. Removal is an explicit named action. Context-chip removal returns focus to the draft with `preventScroll`, retaining pointer versus keyboard treatment; attachment removal does not implement that focus-return bridge.

Native keyboard and touch activation/cancellation belong to the underlying textarea, file picker, and Buttons. The tray never turns its whole area into an extra action. Its named inputs, semantic text, and native disabled states remain available in forced colors; Composer has no custom forced-color override or standalone guarantee for its contact shadow. Shared action focus falls back to a system outline. Logical margins support RTL, while Button's screen depth axis remains unchanged. The host must name and constrain custom controls and richly rendered context itself.

Existing [Composer coverage](../../apps/docs/e2e/composer.spec.ts) exercises semantics, growth, focus, context removal, IME, native validation, failure/retry, pending Stop, files/object URLs, reduced motion, narrow layouts, and touch. [Conversation coverage](../../apps/docs/e2e/conversation.spec.ts) exercises the embedded family. These are source pointers, not new test results; no suite was rerun for this reference-only change.

## Decisions

No Composer approval paragraph appears in `BRIEF.md`. The actual component-family records are in [Quiet instrument's design](../../explorations/su-studies/quiet-instrument/design.md#current-study-idea), not a new BRIEF approval. They remain in that source; this spec performs no approval migration.

| Record                                                                                                                                                        | Scope and current precedence                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Oct 7 approved Composer and Conversation implementation                                                                                                       | Approves the working transcript family and local simulations: controlled requests, local previews, host lifecycle ownership, preserved failures, chronological reading, and separate feedback. Its three-line rest and action-row rule precede the compact request below.                                   |
| Oct 7 requested compact assistant refinement                                                                                                                  | Replaces the default footprint with the current one-line, at-least-24px writing plane, hidden label, 32px file previews, and 28px icon toolbar without a divider or visible shortcut row. This is a request, not a blanket approval of the complete current component.                                      |
| Oct 7 requested focus/context refinement, alignment, and hint removal                                                                                         | Records pointer/keyboard focus distinction, context removal with draft focus return, plus alignment, and retained accessible shortcut guidance. The later raised-tray approval replaces the earlier surface/bordered context chips with filled sunken chips.                                                |
| Oct 7 approved raised Composer tray refinement                                                                                                                | Approves the stationary square canvas tray, subtle perimeter, default contact strengthened only by textarea focus, disabled subtle contact, filled sunken context, optional decorative icons, and icon-only work controls. It explicitly preserves host draft behavior and introduces no new motion values. |
| Oct 7 requested neutral display and plus spacing                                                                                                              | The standalone docs scene becomes a neutral component display. Attach uses the existing 20px icon within its 28px control, and the tray uses 16px horizontal / 12px vertical inset plus one fen before actions. These remain specifically attributed requests.                                              |
| Oct 11 authorized finish, [AGENTS.md](../../AGENTS.md#current-design-direction-quiet-construction) and [finish progress](../plans/2026-10-finish/PROGRESS.md) | Publishes the inherited warm semantic colors, seals, and shared action planes, facet, brackets, and motion. It does not turn Composer's separate contact edge into those planes or grant new request behavior.                                                                                              |

**Editorial scope note:** keep the tray complete but let work-state prose remain outside it. Context understanding, writing comfort, and recovery benefits remain hypotheses, as the study records state. The approved base contract and template do not silently approve outstanding requested refinements.
