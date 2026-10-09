# @zao/react

ZAO for React and Tailwind CSS v4. Milestone 1 ships the foundation: the Tailwind theme, the fonts and a small helper. Components built on [Base UI](https://base-ui.com) arrive in milestone 2.

## Use

In your app's main CSS file:

```css
@import 'tailwindcss';
@import '@zao/react/fonts.css';
@import '@zao/react/theme.css';
```

Then set a finish on `<html>` or any element:

```tsx
import { finish } from '@zao/react';

<html {...finish('su')}>           // Su, follows the OS light/dark setting
<section {...finish('yu')}>        // a Yu island, dark first
```

## Button

**Construction refinement, Oct 7:** Button has one face, one continuous joined side, and one fixed base, replacing the three visible offset shadow copies. The approved 2px upward-and-right hover lift, same press axis, geometry, and finish duration remain unchanged. The native hit area, focus outline, and neighboring layout stay stationary; all variants, disabled behavior, and reduced-motion feedback are preserved.

Use `primary` for the main action, `secondary` or `quiet` for supporting actions, and `danger` for destructive actions. Danger retains a neutral face and frame with semantic danger text. All four variants reuse the approved construction in Su light and dark, at `small` (28px), `default` (34px), and `large` (40px) sizes.

Following [Primer's Button guidance](https://primer.style/product/components/button/), visible labels can include decorative SVG components in `leadingIcon`, `trailingIcon`, and `trailingAction`. Iconoir components fit these slots; icons use 16px, or 20px for a large Button. A trailing action icon indicates an affordance without adding a separate target or popup behavior. Use Menu when an action opens a choice list. Set `block` to fill the available width.

```tsx
import { Button } from '@zao/react';
import { Copy, NavArrowRight, Plus, Trash } from 'iconoir-react';

<Button leadingIcon={Plus}>Create workspace</Button>;
<Button variant="danger" leadingIcon={Trash}>
  Delete workspace
</Button>;
<Button variant="secondary" trailingAction={NavArrowRight}>
  Read guide
</Button>;
<Button block>Continue setup</Button>;
<Button leadingIcon={Copy} loading={saving} loadingAnnouncement="Saving draft.">
  Save draft
</Button>;
```

The host controls `loading` and announces completion or failure. For asynchronous actions, pass `loading={isPending}` from the initial render, including `false`, so the live region exists before its message changes. While loading, Button preserves its width and accessible action name, retains focus, exposes `aria-busy` and `aria-disabled`, and blocks pointer, keyboard, and click-driven form activation. The spinner replaces the first supplied slot in this order: leading icon, trailing icon, trailing action. With no icon slot, it overlays the visually hidden label while retaining that label's space and accessible name. Other icons stay in place. `loadingAnnouncement` supplies a polite status message and defaults to “Loading”. The approved spinner turns once per second through `motion.duration.loading`; reduced motion shows it still. Explicit `disabled` remains native, skips the tab order, and takes precedence over loading focusability.

## IconButton

Use [Iconoir](https://iconoir.com/) for ZAO's icons. Install `iconoir-react` in the app that uses them and pass an icon component to IconButton:

```tsx
import { IconButton } from '@zao/react';
import { Settings } from 'iconoir-react';

<IconButton icon={Settings} aria-label="Open settings" />;
```

The action label is required and also appears in a tooltip on hover or keyboard focus. Choose a recognizable icon; use Button when the action needs a visible text label. The tooltip can be hovered and dismissed with Escape.

IconButton shares Button's construction and input feedback. Its square target is 28px for `small`, 34px for `default`, and 40px for `large`. Icons use the existing 16px size, or 20px for a large button. `variant` accepts `primary`, `secondary` (the default), `quiet`, and `danger`. Disabled and reduced-motion behavior follow Button. Layout classes apply to the outer wrapper; the forwarded ref points to the native button.

## Switch

Switch uses one square stationary housing and a connected 16px sliding face in a 40px by 24px footprint. Position and semantic fill carry off/on state. Hover changes face emphasis without movement; press seats the face, and activation travels directly to the opposite endpoint with existing finish motion. The target, focus outline, and layout stay fixed. Reduced motion makes state changes immediate and keeps press feedback in the fill.

Wrap Switch in a native label so its visible setting name is clickable:

```tsx
<label>
  Email updates
  <Switch name="email-updates" defaultChecked />
</label>
```

Keep the setting name stable across states. Base UI owns activation, controlled or uncontrolled checked state, and form integration. Disabled and read-only switches preserve their state; RTL reverses the endpoints. The shared construction inherits Su/Yu semantic colors and duration values.

## Menu

Menu presents a labeled set of actions through a secondary Button trigger. Its `small`, `default`, and `large` sizes reuse Button's 28px, 34px, and 40px heights, with a clear open state. One floating frame anchors to the trigger, using a fine semantic border and crisp contact edge. Pocket reveal adds a decorative moving front lip that travels from the trigger-adjacent joint with the clipping, becomes the far frame edge when open, and withdraws on close. Its direction follows actual collision placement. The full-size popup, labels, and selection targets stay stationary, without scaling, translation, or row stagger; the lip remains attached to the frame while items scroll. Timing uses existing `duration-base` for opening and the finish's faster `duration-fast` for closing. Keep approved semantic row emphasis, meaningful separators, and readable disabled actions; current row emphasis stays steady through closing.

Base UI owns keyboard navigation, dismissal, focus behavior, and collision flip/shift. Durations apply when animated; Base UI instant paths (`data-instant`, which keyboard/Escape can set) remain immediate. Reduced motion shows the completed frame immediately. Su and Yu share structure and interaction meaning; `material-overlay` supplies the floating material and its reduced-transparency fallback.

## Tabs

`Tabs.List` defaults to `variant="primary"`: a fine ruler rail with a selection line centered on its guide, registration ticks, graduations, and end stops. Hover or keyboard focus extends the target tick; pressing compresses the selected line around the same centerline. Choose `variant="secondary"` for a nested view or a compact layout selector. It uses one sliding face in a square recessed track, with a contact edge and press feedback, and no underline.

```tsx
<Tabs.Root defaultValue="summary">
  <Tabs.List variant="secondary" aria-label="Overview views">
    <Tabs.Tab value="summary">Summary</Tabs.Tab>
    <Tabs.Tab value="members">Members</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="summary">Workspace summary</Tabs.Panel>
  <Tabs.Panel value="members">Workspace members</Tabs.Panel>
</Tabs.Root>
```

Put a nested root inside its owning panel. `keepMounted` on that panel retains its local selection when another primary view opens. Base UI owns selection and indicator measurement. Arrow keys activate by default; `activateOnFocus={false}` on List enables Enter/Space activation, and `orientation="vertical"` on Root preserves vertical navigation. Long strips scroll inside a padded viewport. Labels, native targets, focus outlines, and layout stay fixed while the decoration moves. Reduced motion keeps feedback immediate. Both treatments use semantic colors and the finish's existing motion values.

## Progress

Progress uses a square stationary recessed track and one accurately sized face, with a contact edge. The task label and formatted reading stay outside the track. The first reading appears immediately; actual updates use existing finish motion, and reduced motion makes them immediate. Unknown completion has an interrupted reference and “In progress,” with no filled fraction or idle animation.

```tsx
<Progress label="Upload files" value={68} />
```

Use a finite `min < max` range and pass `null` when completion is unknown. Base UI clamps finite readings and derives the width, text, and accessible value together. Non-finite values and invalid ranges show unknown completion. `format`, `locale`, and `getAriaValueText` support units and fractional readings. Keep totals and remaining work visible when known; if `showValue={false}`, supply a visible reading nearby. The host owns actual updates, task actions, and milestone announcements. The [data visualization guideline](../../docs/data-visualization.md) guides composition; this component measures task completion.

## Field family

TextField, Combobox, and Select share 28px / 34px / 40px sizes. The default uses the existing Button-height base value, keeping mixed form rows aligned without changing the general 32px control token. Public props, native form values, TextField refs, and Base UI editing/selection behavior remain unchanged.

Combobox reserves space for its clear action. Both choice components expose an internal popup frame, inner scrolling viewport, reveal edge, reserved selection-indicator space, and last-highlight presentation state for dismissal. These hooks do not enable new motion in published baseline styling. Quiet instrument's square recessed fields and Pocket reveal are a local working study; Yu retains its baseline finish.

## Table

Table places one square frame and a crisp contact edge around an open canvas. Fine horizontal rules and shared `px-3 py-2` cell padding organize its native reading plane. Foreground roles and neutral state fills keep the current Table treatment monochrome. Its frame and rows stay stationary; explicit Button and Menu actions keep their own behavior. A named, keyboard-accessible horizontal scroll area keeps columns available on narrow views.

```tsx
import { Table } from '@zao/react';

<Table.Root aria-label="Requests">
  <Table.Caption>Current workspace requests</Table.Caption>
  <Table.Header>
    <Table.Row>
      <Table.Head>Request</Table.Head>
      <Table.Head numeric>Items</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Head scope="row" className="text-default">
        Infrastructure review
      </Table.Head>
      <Table.Cell numeric>12</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table.Root>;
```

`Root` requires an `aria-label`. Its `className` applies to the outer frame; `tableClassName`, other native table props, and `ref` apply to the `<table>`. Finish attributes on Root apply to the whole frame. `Caption`, `Header`, `Body`, `Footer`, `Row`, `Head`, and `Cell` forward their native props and refs. Head defaults to `scope="col"`; use `scope="row"` for a row heading. `numeric` on Head or Cell aligns numbers to the right with tabular figures.

Consumers own sorting and selection. Put a Button in a sortable Head, match the label to the column heading's `type-label` role, reserve space for its sort indicator, and set its native `aria-sort` only on the sorted column. Use a labeled checkbox for selection, with `selected` on Row supplying the persistent `bg-active` fill. The native table keeps normal tab order; individual controls own their keyboard behavior.

The docs specimen gives Request the available width, keeps supporting columns compact, sets IDs in `type-code` with `figures-id`, and presents statuses as plain foreground text. A compact secondary action toolbar sits above the frame; a concise selected count sits below it, with a detailed live announcement for assistive technology. This is the current requested refinement; its usability benefits remain under review.

## Composer and Conversation

Composer is a compact, controlled native form with a multiline textarea inside one square, stationary raised tray. A `border-subtle` perimeter and `border-default` lower contact edge frame the clear writing plane. Textarea focus strengthens that contact edge to `border-strong`; focus on toolbar controls keeps the tray at rest. The required `label` remains accessible and is visually hidden; a one-line writing plane grows immediately to eight body lines, then scrolls. The icon-only toolbar uses IconButtons with accessible names and focus/hover tooltips for file selection, Send, and Stop. Enter adds a line; Cmd/Ctrl+Enter and Send use one guarded submission path. Supply `label`, `value`, `onValueChange`, and `onSend`. Pending sends block duplicates. Rejected sends retain the draft and show retry guidance; the host clears the draft after accepting it.

`ComposerAttachment` contains a stable `id` and native `file`. Supply controlled `attachments`, `onFilesSelect`, and `onRemoveAttachment` to select and remove local files in wrapping file tiles. Complete filenames wrap within each tile; image previews use temporary object URLs, revoked on file changes and unmount. Files are never uploaded or parsed. Native `accept` and validation remain the host’s responsibility. The `context` and `actions` slots accept React content.

Use filled `bg-sunken` `ComposerContextChip` tags in the context slot for each included item, with a visible `label` and host-owned `onRemove`. Its optional `icon` accepts an `IconButtonIcon`, such as Folder or Database from `iconoir-react`; the icon is decorative and the visible label names the context. Its named removal action returns focus to the draft without changing its contents or submitting. Omit the context slot when no items remain. Pointer entry leaves the writing plane unframed; keyboard entry retains the semantic focus outline.

Set `responding` while a reply runs. Writing and attachment preparation remain available; another send is blocked. `onStop` can return a promise; it requests a stop and the host confirms the outcome. Keep `responding` true until confirmation. Pending Send and Stop controls block duplicates in their existing action slot without adding a caption row. Stopping response generation does not imply cancellation of a consequential agent action.

```tsx
import { Composer, ComposerContextChip, Conversation, Message } from '@zao/react';
import { Database } from 'iconoir-react';

<Composer
  label="Request"
  value={draft}
  onValueChange={setDraft}
  onSend={acceptRequest}
  responding={responding}
  onStop={stopResponse}
  context={snapshotIncluded ? (
    <ComposerContextChip
      label="Storage snapshot"
      icon={Database}
      onRemove={() => setSnapshotIncluded(false)}
    />
  ) : undefined}
/>

<Conversation.Root aria-label="Workspace assistant" className="h-dvh">
  <Conversation.Viewport>
    <Conversation.List>
      <Conversation.Item>
        <Message.Root author="Assistant" kind="assistant">
          <Message.Content><p>Here is the result.</p></Message.Content>
        </Message.Root>
      </Conversation.Item>
    </Conversation.List>
  </Conversation.Viewport>
  <Conversation.Latest />
</Conversation.Root>
```

Give Conversation a bounded height and stable keys for chronological items. The named viewport follows content while the reader is at the bottom; scroll-back suspends following. Latest response returns to the end without taking keyboard focus. A separate polite region announces lifecycle changes rather than individual tokens. Root’s optional `announcement` supplies host-owned feedback; otherwise Message status transitions provide it.

Message requires visible `author` and `kind="user|assistant"`, with `complete`, `streaming`, `stopped`, or `error` status and optional metadata. Use `Message.Content` for ordinary React content, including sources, Cards, and Tables, and `Message.Actions` for host-owned actions. Markdown rendering, uploads, model calls, storage, and history edits remain outside these components.

## What the theme gives you

Tailwind's defaults are removed. Only ZAO's values compile.

| Need            | Utilities                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Backgrounds     | `bg-canvas` `bg-surface` `bg-sunken` `bg-overlay` `bg-hover` `bg-active` `bg-accent` `bg-accent-subtle` `bg-success` `bg-warning` `bg-danger` … |
| Text            | `text-default` `text-muted` `text-disabled` `text-on-accent` `text-accent` `text-success` `text-warning` `text-danger`                          |
| Borders         | `border-subtle` `border-default` `border-strong` `border-accent` …                                                                              |
| Type roles      | `type-display` `type-title` `type-heading` `type-body` `type-label` `type-caption` `type-code`                                                  |
| Spacing         | Tailwind numbers are fen (1 fen = 4px): `p-3` is 12px                                                                                           |
| Radius          | `rounded-control` `rounded-action` `rounded-surface` `rounded-overlay` `rounded-pill`                                                           |
| Floating layers | `material-overlay`: opaque in Su, glass in Yu, with reduced-transparency fallbacks                                                              |
| Details         | `trim-label` (trim control labels to cap height), `figures-tabular`, `figures-id`                                                               |
| Motion          | `duration-fast` `duration-base` `ease-standard`                                                                                                 |

## Fonts

`fonts.css` self-hosts Geist and Geist Mono (from the `geist` package, with all 26 OpenType features) and Newsreader (Latin and Latin Extended, with optical sizes). Fallback faces are sized with [Capsize](https://seek-oss.github.io/capsize/) so the swap doesn't shift layout. All three fonts are under the SIL Open Font License 1.1.
