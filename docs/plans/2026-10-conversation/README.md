# ZAO Conversation and Composer plan: visual and motion, October 2026

_For coding agents working in `yankundesign/zao-design-system`. Written Oct 12, 2026, from the Conversation and Composer sketch and Yankun's review of it. Owner and decision-maker: Yankun._

**Status: decided Oct 12.** Yankun chose **Slip** for the transcript structure and took the sketch's lean on every other row. The decisions table below is settled, not a list of options. Start when Yankun points you here or adds this plan to "Current work" in `PLAN.md`. If neither has happened, stop and ask.

**This plan adds no component.** It changes Conversation, Message, Composer and ComposerContextChip, their docs specimens, the landing workspace that uses them, their tests and their records. A published part for the "sent with this request" chips belongs to the components plan.

## What this plan is for

After the finish plan, Conversation and Composer are the only components still on their Oct 7 construction. The Send button is now the most built thing in the assistant; the tray, the transcript and the messages around it read as linework. Two problems stand out.

1. **Requests and answers blend, and assets make it worse.** Both turns share the left edge, the padding, the type role and the header. The request's only mark is a surface fill one small step from the canvas, with a 1px `border-subtle` rule. Answers are full of Cards and Tables, which are also bounded rectangles on that left edge, so the request reads as one more asset.
2. **A request's life has no form.** Drafting, sending, waiting, streaming, stopping and failing are told by words and a static 4px square. Nothing carries a request from the tray into the record.

The plan turns one idea into the finish: **a request is drafted in the tray, handed over, and built in the transcript.** The tray is a built surface. The request lands as a small built slip on the trailing edge, the same side as Send, carrying what it was sent with. The answer keeps the full width; it is drawn while it is written and built when it is done.

## Reference

The [Conversation and Composer sketch](https://claude.ai/artifact/Q9MuCg95MtKUqi7XMfSLcU) runs the real `@zao/react` components with each row layered on as a toggle, plus ¼ speed, light and dark, and both seals. Its source is in [`sketch/`](sketch/): `sketch.css` holds the recipes, each scoped under `.sk[data-sk-<row>='<option>']`, and `main.tsx` is the host. The sketch fakes some component behavior in the host; each work package says where. Port the recipes into the components. Do not copy the sketch's selectors, host code or `aria-label` hooks. If you cannot open the artifact, this file and `sketch/` are complete without it.

Where this plan and the sketch differ, this plan wins. The known differences:

- Placed tiles rise on the Lift role, not grade 8: components read roles, never grades (finish plan rule 4).
- The Responding mark reuses Button's loading SVG, not a CSS border circle.
- `Message.Actions` keeps its place after the content. Only actions marked for the header move into the author row. The sketch moves every action, which would lift the landing's "Approve 2 requests" into the header.
- `Conversation.Item` keeps one message per item. The sketch groups a request and its answer into one item; Slip does not need that.
- Hooks are classes, slots and data attributes. The sketch selects Send and Stop by `aria-label`; labels are localizable, so never do that.

## How to use this plan

1. Read `AGENTS.md`, especially "Authorized finish plan (Oct 11, V1–V12)", then this file to the end.
2. Run the full browser suite before the first change and record the existing failures in `PROGRESS.md` in this folder. The finish plan's M6 run left 21 failures that predate it.
3. Work one work package (WP) per pull request, or one milestone per write-back as the finish plan did. Either way, keep `PROGRESS.md` current so work can stop and resume.
4. When this plan does not settle a visual value, stop and ask. Do not choose one.

| Phase | Outcome                                                        | Rows  | Depends on                  |
| ----- | -------------------------------------------------------------- | ----- | --------------------------- |
| 1     | The transcript: slip, rhythm, construction line, Latest, eaves | T1–T5 | —                           |
| 2     | The tray: material, focus, Send and Stop, files and context    | C1–C4 | —                           |
| 3     | Specimens, landing, tests and records                          | all   | the WPs each part relies on |

Phases 1 and 2 can run in parallel. WP 1.3's reveal looks right only with WP 1.1's slip in place.

## Decisions (Yankun, Oct 12, 2026)

| Row | Decision                                                                                                 | How it was decided                          |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| T1  | **Slip.** Requests sit at the trailing edge as small built slips; answers keep the full width.           | Chosen over Today, Ledger, Tray and Spine   |
| T2  | **Ink line.** A dashed ink line marks an unfinished response; Responding uses Button's loading arc.      | Lean                                        |
| T3  | **Reveal.** A new request reveals upward from its bottom edge with Menu's Reveal and front edge.         | Lean                                        |
| T4  | **Docked.** Latest response floats over the transcript's bottom edge with a face, and reveals from it.   | Lean                                        |
| T5  | **Eaves.** A hairline appears at a transcript edge only while content is hidden past it.                 | Lean                                        |
| C1  | **Raised.** Card's surface recipe on the tray: 4px banded planes, surface face, facet.                   | Lean; carries forward the Oct 7 raised tray |
| C2  | **Brackets.** Keyboard focus in the draft shows focus brackets around the whole tray.                    | Lean                                        |
| C3  | **Seat and rise.** A draft raises Send; it stays seated while accepted, then rises as Stop.              | Lean                                        |
| C4  | **Placed.** Files rest as small built parts and rise when added; removal shows the drawing for one beat. | Lean                                        |

Slip, as reviewed in the sketch, also brings: muted author ink, "You" kept as the accessible name only, an exchange rhythm, code in a well, response utilities such as Copy in the author row (shown on hover or focus for older responses), and the request's context and files recorded on its slip.

## Approvals this plan replaces

| Approval                                                                                                                       | What changes                                                                                                                                       | Row    |
| ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Oct 7 Composer and Conversation implementation: shared reading alignment, restrained user surface, explicit visible authorship | Requests move to the trailing edge as built slips. "You" stays as the accessible name, not visible text. The assistant's authorship stays visible. | T1     |
| Oct 7 raised Composer tray: subtle perimeter and joined contact edge, strengthened only by draft focus                         | Banded planes at `depth.rest.surface`, a surface face and the facet replace the contact edge. Draft focus strengthens the perimeter.               | C1     |
| `AGENTS.md`, finish V12: "Every other control keeps `outline-focus`"                                                           | The draft's keyboard focus shows brackets on the tray.                                                                                             | C2     |
| Conversation spec: Root, list and entries have no intrinsic transition; Latest is always quiet and sits in the flow            | New requests reveal. Latest is docked over the transcript with a face and reveals.                                                                 | T3, T4 |
| Message spec: no spatial motion; a static Responding square                                                                    | The construction line; Button's loading arc while responding.                                                                                      | T2     |
| Composer spec: the tray, tiles and context have no intrinsic transition; Send and Stop only carry Button's own response        | Send and Stop carry the request's lifecycle. Placed tiles rise; removals show their drawing.                                                       | C3, C4 |

Everything else in those approvals stands: host ownership of requests, transport, uploads and storage; the controlled draft; IME guards; following at the bottom with immediate `scrollTop` writes; separate lifecycle announcements and no streamed live region; preserved partial output; the textarea growing without animation.

## Rules for every work package

These add to `AGENTS.md` and the finish plan's rules. Where they disagree, `AGENTS.md` wins and you say so in the PR.

1. **Visual values come from this plan or from existing tokens.** If you need a value this plan doesn't give, stop and ask.
2. **Components read roles and utilities.** Durations and curves come from `motion.duration.*` and `motion.easing.*` roles (`lift`, `seat`, `reveal`, `reveal-exit`, `exit`, `loading`), depth from `depth.rest.*` and `depth.contact`, construction from `construction-planes`, `construction-shading`, `construction-well` and `focus-brackets`, the facet from `radius.facet`. Never type a duration, curve, distance or color; never read a grade directly.
3. **Depth is drawn, never blurred.**
4. **Nothing plays on load.** Motion answers an action: sending, adding or removing a file or context, scrolling back. A restored conversation or draft renders at rest.
5. **Layout never moves because of motion.** Reveals clip, rises are paint, and the transcript keeps its height. A removal reflows once, after its beat.
6. **Hooks are classes, slots and data attributes,** never `aria-label` or visible text.
7. **Access is part of the construction.** Keyboard; reduced motion (end states, no travel, pending fills still show); forced colors (planes, lines and eaves drop, borders stay, focus falls back to a solid system outline); RTL (slips and Latest follow logical sides, while the depth axis and the facet stay screen-fixed); touch (no hover-only actions on coarse pointers).
8. **The host keeps ownership.** Components still never send, upload, stop, retry or store.

## Phase 1: The transcript

### WP 1.1 The slip and the reading rhythm (T1)

**Message, user kind: the slip.**

- Construction: `construction-shading construction-planes` on the article, `position: relative; isolation: isolate`, `--zao-construction-face: var(--zao-color-bg-surface)`, Card's plane strength (6%), `--zao-plane-rest: var(--zao-depth-rest-small)`, `--zao-face-offset: 0px`. A hairline `border-subtle` perimeter replaces today's single logical-start rule. The facet: `border-top-right-radius: var(--zao-radius-facet)` with `corner-shape: bevel` inside `@supports (corner-shape: bevel)`.
- Placement: `margin-inline-start: auto` puts the slip on the trailing edge (right in LTR, left in RTL). `max-inline-size: min(85%, calc(var(--zao-space-1) * 136))`, the sketch's 544px on the fen scale. Text stays start-aligned inside.
- "You": the author span stays and still names the article through `aria-labelledby`, but it is visually hidden for `kind="user"`. When the header then holds nothing visible (no metadata, no status), it takes no space.
- Forced colors: planes drop, the perimeter stays.

**Message, both kinds.**

- The assistant's author uses `text-muted`, keeping `type-label font-medium`.
- `pre` inside `Message.Content` gets `construction-well`. The host keeps its border, fill and named scroll region.
- **Response utilities in the author row.** Add `placement?: 'end' | 'header'` to `Message.Actions`, defaulting to `'end'` (today's behavior). Make the article a two-column grid (`minmax(0, 1fr) auto`): the header in column 1 of row 1, `placement="header"` actions in column 2 of row 1, and every other child across both columns in DOM order. Use the header placement for compact response utilities such as Copy. Task actions (Retry, Approve) stay at the end. The sketch fakes this with absolute positioning.
- **Older responses.** Header-placed actions in any Item other than the list's last are `opacity: 0` and appear on `:hover` or `:focus-within` of their Item, with a fast, standard state change. This applies only under `(hover: hover) and (pointer: fine)`. They stay focusable, and coarse pointers always see them.

**Conversation: the exchange rhythm.**

- The list gap becomes `space.4`. An Item whose message is a user message, except the first Item, adds `margin-block-start: var(--zao-space-4)`. A request then sits 16px from its answer, and exchanges sit 32px apart. Match `li:has(> .zao-message[data-zao-kind='user'])`, and document that Message should be the Item's direct child for the rhythm to apply.

Sketch: the T1 row, Slip, and the "Around the slip" notes. The sketch's request chips are the WP 3.1 docs recipe.

### WP 1.2 Under construction (T2)

- An assistant message with status `streaming`, `stopped` or `error` draws a dashed line on its inline-start edge: `::before`, `inline-size: var(--zao-stroke-hairline)`, full height, dashes of `space.1` with `space.1` gaps as a hard-stop repeating gradient. Ink: `fg-default` while streaming, `fg-muted` when stopped, `danger.text` when failed. `complete` draws nothing. Forced colors use CanvasText.
- While streaming, the status mark becomes Button's loading indicator. Export `LoadingIndicator` from `button.tsx` for internal use and size it to the caption (`space.3`). It keeps the `button-loading-indicator` utility, `motion.duration.loading`, and its static reduced-motion state. Stopped and failed keep today's square. The system keeps one pending animation, not two.
- Announcements do not change.

Sketch: the T2 row, Ink line.

### WP 1.3 Request hand-off (T3)

- `Conversation.Item` learns whether it mounted after its Root's first committed render: Root sets a context flag in its first layout effect, and an Item mounting after that sets `data-zao-entering`. Add `entering?: boolean` to Item so a host can override, for example `false` for a history restored after mount.
- A user message inside an entering Item reveals upward from its bottom edge on the Reveal role (`motion.duration.reveal`, `motion.easing.reveal`). Register a Conversation-owned `<number>` property (initial 1) and start it at 0 with `@starting-style`. Clip with `inset(calc((1 − p) × 100% − hairline) …)` and outset the other three sides by `space.1` so the planes show. A front edge in `border-strong` rides the clip edge and fades out as p reaches 1; the sketch paints it as a hard-stop background gradient so the slip's `::before` and `::after` stay free for its planes.
- Assistant messages don't reveal; their construction line is their entrance. Following still writes `scrollTop` immediately; the native box never moves.
- Reduced motion: no reveal.

Sketch: the T3 row. The sketch fakes `data-zao-entering` with a host `data-sk-new`.

### WP 1.4 Latest response, docked (T4)

- Root becomes the positioning context. Latest is absolutely placed over the viewport's bottom edge at `inset-block-end: var(--zao-space-3)` and `inset-inline-start: var(--zao-space-3)`, above the transcript content. The transcript keeps its height when Latest appears; assert that in a test.
- Face: the secondary Button construction (surface face, `depth.rest.control`, `border-default` edge), with a trailing down arrow. Draw it as a local SVG from Iconoir's `ArrowDown` geometry, the way `composer-icons.tsx` does, so `@zao/react` gains no icon dependency. Today `ConversationLatestProps` omits `variant` and Latest is always quiet. Either default it to `'secondary'` and allow `'quiet' | 'secondary'`, or keep `variant` omitted and fix the face. This is an API decision: ask Yankun.
- Motion: on mount, Latest reveals upward from its bottom edge on the Reveal role. Before unmount, it withdraws on Reveal exit, so it stays mounted through its exit. The existing focus rule stands: it stays while focused.
- Reduced motion: Latest appears and disappears at rest.

Sketch: the T4 row, Docked.

### WP 1.5 Scroll edges (T5)

- The viewport's `::before` (sticky, `top: 0`) and `::after` (sticky, `bottom: 0`) are `block-size: var(--zao-stroke-hairline)` with a negative margin of the same, `background: var(--zao-color-border-subtle)` and `pointer-events: none`.
- Their opacity follows the scroll position through `animation-timeline: scroll(nearest block)`: the top eave goes from 0 to 1 over the first `space.4` of scroll, and the bottom eave from 1 to 0 over the last `space.4`. There is no duration; nothing is timed.
- Put it all inside `@supports (animation-timeline: scroll())`. Without support there are no eaves. Forced colors: none.
- Hosts that draw their own rule at the transcript's top edge drop it. The docs specimen does in WP 3.1.

Sketch: the T5 row, Eaves.

## Phase 2: The tray

### WP 2.1 The raised tray (C1)

- Add a decorative `side` slot to Composer, as Button has: an `aria-hidden` span, first child of the form, `position: absolute; inset: 0; z-index: -1; pointer-events: none`, carrying `construction-shading construction-planes`. The form supplies the face (`--zao-construction-face: var(--zao-color-bg-surface)`), Card's plane strength, `--zao-plane-rest: var(--zao-depth-rest-surface)` and `--zao-face-offset: 0px`. This keeps the form's own `::after` free for the focus brackets.
- The form: `position: relative; isolation: isolate`, `bg-surface` (today `bg-canvas`), a `border-subtle` perimeter, and the facet on its leading corner. Remove `composer.css`'s contact `box-shadow` and `--composer-contact-color`. The textarea's background becomes `transparent` (today `bg-canvas`).
- Pointer focus in the draft: the perimeter goes to `border-default`, as a fast, standard state change. Focus on a toolbar control or a chip does not change it, as today.
- Invalid (`data-zao-invalid`): the perimeter becomes `border-field-invalid`.
- Disabled: `--zao-plane-rest: 0px`, so the tray sits flat like a disabled Button, with today's `bg-sunken` fill and a `border-subtle` perimeter.
- Forced colors: planes drop, the border stays.
- Hosts need room for the planes and brackets: at least `space.2` around the tray. Say so in `composer.md`.

Sketch: the C1 row, Raised. The sketch draws the planes on the form and puts the brackets on a wrapper; use the side slot instead.

### WP 2.2 Focus brackets on the tray (C2)

- The form takes `focus-brackets`. Show the brackets when `.composer-input` matches `:focus-visible` without `data-zao-pointer-focus`, that is, on keyboard entry. Remove the textarea's own keyboard outline. Pointer entry keeps only the perimeter emphasis from WP 2.1.
- Toolbar controls and chips keep their own brackets.
- Forced colors: the textarea's solid 2px system outline returns.

Sketch: the C2 row, Brackets.

### WP 2.3 Send and Stop (C3)

Give the submit control a hook: class `composer-submit` and `data-zao-action="send"` or `"stop"`. Keep Send and Stop as the same element type in the same position so React reuses one node; the motion depends on that, so add a test for it.

- **A draft raises Send.** Transition `--zao-plane-rest` on `motion.duration.lift`: on `motion.easing.lift` when Send becomes enabled (0 → `depth.rest.control`), on `motion.easing.exit` when it becomes disabled.
- **Press seats it,** with Button's existing seat.
- **Accepted.** While the form has `data-zao-pending` and Send is `aria-busy`, the face stays seated (`--zao-face-offset: calc(-1 * rest)`) with its plane rest kept, fill `accent-solid-hover`, ink `fg-on-accent` and edge `accent-solid`, instead of today's flat disabled gray. It moves on the seat role.
- **Responding.** The same node becomes Stop (secondary) and rises from its seat to rest on the Lift role.
- **Stopping.** While Stop is `aria-busy`, it stays seated with `bg-active`.
- **The response ends.** The node becomes Send again, flat if the draft is empty.
- Reduced motion: no travel. The pending fills still show.

Sketch: the C3 row, Seat and rise. The sketch hooks Send and Stop by `aria-label`; don't.

### WP 2.4 Placed files and context (C4)

- **Tiles.** Attachment tiles rest at `depth.rest.small` with planes (face `bg-surface`) and the facet.
- **Added.** A tile added after the tray mounted rises from 0 to rest on the Lift role. Tiles present at mount render at rest.
- **Removed.** When a tile's id leaves `attachments`, Composer keeps it mounted for one Lift duration as its drawing (`data-zao-removing`: no face fill, a dashed `border-default` edge, contents `visibility: hidden`, planes to 0 on `motion.easing.exit`), then drops it. The host's array stays the truth. Keep the ghost `inert` and out of the accessibility tree. Read the duration from the computed role, never a constant. Reduced motion: immediate.
- **Context chips.** On removal, ComposerContextChip shows the same drawing for one Lift duration, then calls `onRemove` and returns focus to the draft. Guard against a second activation during the beat. Reduced motion: immediate, as today. `onRemove` now follows the beat; say so in `composer-context-chip.md`.
- **Focus.** Removing an attachment can drop focus to the body today. Keep that unless sending focus to the draft is trivial, and ask before changing it.

Sketch: the C4 row, Placed. The sketch fakes the removal beat in the host with a DOM query; build it into Composer and the chip.

## Phase 3: Specimens, landing, tests and records

### WP 3.1 Docs specimens and the landing workspace

- `conversation-specimen.tsx`:
  - Copy uses `placement="header"`. Retry stays at the end.
  - User messages carry the context and files they were sent with as flat chips inside the slip: a list labelled "Sent with this request", each item `inline-flex items-center gap-1.5 min-h-6 px-2 bg-sunken type-caption` with a 16px muted icon (the context's own icon, or Iconoir `Page` for a file). Snapshot them when the host accepts the request. Drop the "Selected files: …" metadata.
  - Drop the panel header's bottom rule; the eave draws it when content is above.
  - Show the problem being solved: answers with a Table, a Card with Progress, and a two-card approval grid with a primary action, as in the sketch.
- `composer-specimen.tsx`: the empty, disabled and error states show the raised tray.
- The landing workspace (`landing/showcase.tsx`, `landing/hero.tsx`):
  - User lines become slips. The summary's "Approve 2 requests" stays at the end of its message.
  - The exploded stage: the Composer tray is now a 4px surface, so move `[data-zao-component="composer"]` from layer 03 (controls) to 02 (cards); its Send and attach buttons stay in 03 through the Button selectors. Slips join 02 as well. Propose the new layer caption; Yankun edits the strings (landing L13).

### WP 3.2 Browser tests

Update the specs that encode replaced behavior:

- `composer.spec.ts`: the `contactShadow` assertions for resting, writing and disabled trays become plane and perimeter assertions (side slot present, `--zao-plane-rest` of `depth.rest.surface` or 0 when disabled, perimeter `border-subtle` → `border-default` on pointer entry). The textarea's background becomes transparent and the tray face `bg-surface`. The form's `transition-duration: 0s` becomes the fast perimeter transition with no spatial transition. Keyboard focus moves from the textarea's outline to `expectFocusBrackets` on the form.
- `conversation.spec.ts`: the docked Composer's keyboard outline assertions become brackets. Latest assertions also check that the viewport keeps its height.
- `landing.spec.ts`: the new layer membership.

Add coverage, in Su light and dark, LTR and RTL:

- The slip sits on the trailing edge; the article's accessible name is still "You"; no visible "You" text.
- The rhythm: 16px from a request to its answer, 32px between exchanges.
- Header actions sit in the author row; older ones appear on hover and focus; coarse pointers always see them; end actions stay at the end.
- The construction line for each status; the loading arc while streaming; a static arc with reduced motion.
- The reveal plays only for requests added after mount, never for the first render or with `entering={false}`, and never with reduced motion.
- Latest: docked, the viewport height unchanged, reveal on entry, stays mounted through its exit and while focused.
- Eaves: opacity at the top, middle and end of the scroll; none without scroll-timeline support.
- The raised tray, invalid and disabled; brackets on keyboard entry only; forced-colors outline.
- Send rises with a draft, stays seated while pending, and the same node becomes Stop and rises; Stop stays seated while stopping; reduced motion keeps the fills without travel.
- Tiles rise only when added after mount; removal keeps an inert ghost for one Lift duration; chip removal calls `onRemove` after the beat and returns focus to the draft; reduced motion is immediate.
- No horizontal overflow at 390px.

### WP 3.3 Specs, motion, parts and records

- Update `docs/components/conversation.md`, `message.md`, `composer.md` and `composer-context-chip.md`: anatomy, states, interaction, motion and decisions, following the template.
- `docs/motion.md`: add the new uses under the Oct 11 rules (Reveal for the hand-off and Latest, Reveal exit for Latest, Lift for Send's rise and placed tiles, Seat for the accepted hold, the exit curve for sinking and removal, the loading arc while responding, scroll-driven eaves with no duration).
- `docs/parts.md`: Composer's `side` slot, `Message.Actions` placement, `data-zao-entering`, `data-zao-removing`, and Latest's icon.
- `AGENTS.md`: an "Authorized Conversation and Composer plan (Oct 12)" section with the rules above, and the focus rule updated for Composer.
- `decision-drafts.md` in this folder: one BRIEF decision-log row per decision, for Yankun to add.
- A changeset for `@zao/react`.

## Verification

- `pnpm build && pnpm test && pnpm typecheck && pnpm format:check`.
- Su light and dark, both seals, LTR and RTL, reduced motion, forced colors, and 390px wide.
- For Yankun: screenshots of the docs Conversation page at rest with rich answers, mid-stream, stopped, failed and scrolled back; the Composer states; and the landing workspace in Built and Parts.

## Out of scope

- New components: a published sent-item part, attachment previews inside slips, upload progress.
- Ledger, Tray and Spine, which Yankun did not choose.
- Smooth-scrolling the transcript or animating the textarea's height.
- Yu.

## Words used in this plan

| Word               | Meaning                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| Slip               | A user request drawn as a small built part on the trailing edge             |
| Exchange           | One request and the answer that follows it                                  |
| Construction line  | The dashed ink line on an unfinished response                               |
| Hand-off           | A sent request revealing into the transcript                                |
| Placed             | A file resting in the tray as a small built part                            |
| Drawing            | A part shown as its outline during removal: dashed edge, no face            |
| Eave               | A hairline at a transcript edge, drawn only while content is hidden past it |
| Response utilities | Compact actions on a response, such as Copy, placed in the author row       |
