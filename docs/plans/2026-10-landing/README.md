# Landing page, October 2026

_For coding agents working in `yankundesign/zao-design-system`. Written Oct 9, 2026. Owner and decision-maker: Yankun._

**Status: WP 1–3, 7 and 8 built; the hero became the exploded workspace on Oct 11 (finish plan V9, V10); L12 and L13 open.** Yankun chose to keep the docs sidebar, use the bracket set as the hero figure, put the Construction section on a dark band, and redesign the landing page before the section overviews (Oct 9). On Oct 10 he chose the split hero at 56px with the redrawn bracket set (L5–L7), asked for the bracket set to answer the pointer like Hairline's exploded figures with a 6 fen maximum gap (L14), replaced the thin Construction section with a working workspace and assistant built from ZAO (L15), and dropped the Button close-up (L16). He then chose the showcase stage in the main column (L8), the showcase in the page's own light or dark mode (L9, replacing L3's dark band) and ghosted parts for the bracket set (L17). With no options left, the review panel is retired. Notes are in `explorations/snapshots/private/landing-options-20261009/review.md`. Do not pick a value for him.

This plan only covers `/` (Start → Overview). Overview pages for Foundations, Components and Charts get a separate plan later.

## Read first

1. `AGENTS.md`, the root and `apps/docs` versions.
2. The Quiet construction direction in `BRIEF.md`.
3. `docs/plans/2026-10-improvement/README.md`, for its rules, option sheets and definition of done. They apply here unchanged.
4. This file, to the end.

## Progress, Oct 21: the sheet (W1, kept)

Yankun asked for proposal W1 from the [context.dev research](../../research/context-dev.md): rule the landing as one sheet, after a woodblock's frame (版框) and column rules (界行). In `landing.css` ("0. The sheet"):

- **Rails.** Two hairlines run the main column's height, midway in the gutters: 2 fen out on a phone, 4 fen from md (between the nav and the content, and in the trailing padding).
- **Rules.** A hairline crosses the column at the head, midway between every two sections and at the foot. The head and foot sit midway in the main column's block padding, so the header's rule and the sheet's head stand an equal step apart.
- **Marks.** A `+` in `border-strong` stands on every crossing, and both lines stop a fen short of it, as on `docs-rule-capped`. Lines use `border-default`, a step above the divisions inside the content (`border-subtle`), so the frame reads as the frame; forced colors draw marks in `CanvasText` and lines in `GrayText`.
- **Paint only.** Each section's `::after` draws its rule, marks and rails behind its content (`isolation: isolate`), and the root's `::after` draws the foot. Nothing moves, content keeps its place and width, and nothing scrolls sideways at 390. The hero's controls rule and the Explore tile rules stay as divisions inside the content.
- **Known crossing.** With the bracket set fully opened and its top course picked, the beam rises past the head rule and covers it, standing in front of the sheet.

Yankun kept it on Oct 21, after the lines moved from `border-subtle` to `border-default` so the frame shows in dark mode. Checked in light, dark, RTL and at 390; `e2e/landing.spec.ts` covers the geometry and forced colors.

## Progress, Oct 15: the workspace craft pass

Yankun chose header A, top nav A, side panel C, and cards A and C from the [craft references](../../research/visual-craft.md). In `components/landing/showcase.tsx` and `landing.css`:

- **Header.** An identity block (a north-arrow mark in a hairline frame, `Workspace · 001` above `North`) and mono readings (members, open requests, last sync) beside the View menu. Open counts down as requests are approved.
- **Rail.** The tabs move into the body's first row; the rail runs the main column from the window edge, and the assistant's heading rule meets it on one line (subgrid). Boundary marks and fishtails come from Tabs itself.
- **Body.** Panels and the assistant sit in `bg-canvas` behind the `bg-surface` header band and Cards. A fen ruler runs down the transcript's leading edge and scrolls with it (Oct 16, replacing a dot field Yankun found cheap); the Composer rests in a `construction-well`.
- **Cards.** Seats uses `docs-leaders`; the Seats and Storage rules use `docs-rule-capped`.
- **Layout.** The window lays out by its own width: the assistant sits beside the work from 56rem, below it under that.
- **Oct 16, centring.** The bar's padding is even, and a fen above the tabs balances the rail's half fen below the guide, so the bar's contents and the tab and assistant labels sit midway between their rules.
- **Oct 16, the character field.** Yankun asked for a subtle character texture like his reference: the ruler alone was not enough. `components/landing/character-field.ts` paints a seamless 1440 × 1008 tile of faint drafting marks in clusters, once, as a mask on the landing root (`--landing-field`). Yankun turned down hex bytes (no numbers); the field is a 3-fen grid of `·` and `+` whose crosses close in toward each cluster's core, with `hatch` and `lines` kept as unselected alternates. The stage fills it with `border-strong`, quieter toward the drawing's middle and at three quarters size on a phone; the transcript, beside the work only, fills a cluster above the Composer with `border-default`. Copies in the Parts drawing carry it; nothing moves; forced colors omit it.
- **Oct 16, the assistant's head.** The bar closes with a rule across the whole window, and the assistant's divider starts from it. Both columns share one inset: parts 4 fen in from the column edge, text 7 fen, so the heading lines up with its messages as the tab labels do over the cards. The column is 84 fen wide so a one-line question still fits its slip.

## Progress, Oct 11: the exploded hero (finish plan V9, V10)

- **The hero is the workspace taken apart.** [The finish plan](../2026-10-finish/README.md) WP 3.2: the copy sits above (headline left, sentence and actions right), then one Parts/Built control with a caption cell, then the stage. It rests on **Parts** (V9). `components/exploded-stage.tsx` hides the live window and shows static copies of it, one per layer: canvas, surface, cards, controls, overlay and focus. Pointer height or Up and Down pick a layer, which rises a little further while the others ghost (as L17); Escape clears. The caption names the picked layer, its grade and its depth. **Built** puts the working window back together, and it works as before.
- **The showcase merged into the hero.** `components/landing/showcase.tsx` now exports `ShowcaseWindow`, the window alone. Its section copy and the dashed "Show parts" switch are retired; the depth scale and "Reset example" sit under the stage.
- **The bracket set moved to Explore** (V10), beside the line about 营造法式, and it still opens on the pointer and keyboard (L14).
- **Later on Oct 11, Yankun brought it back to the top (A, split).** It stands beside the headline at 256px (64 fen) from 64rem, aligned with the eyebrow, and follows the actions on narrow screens. The room its opened courses need hangs above the drawing (a negative top margin of the reserve), so it adds no space above the copy; the highest opened part stays below the sticky header. Explore keeps the 营造法式 caption under the tiles.
- **Nothing plays on its own.** The first pose is applied without motion; only the Parts/Built control, the pick and the keyboard move anything. Reduced motion switches poses instantly.
- Layers come from the published components' `data-zao-component` names, read by the docs stage, so no published attribute was added.

## Progress, Oct 10

- **L5–L7 applied.** The hero is split from 64rem, the headline is 56px from 48rem, and the hero figure is the redrawn bracket set with a hairline. The 56px size lives in `landing.css`; it is not a published `type-hero` role (see WP 4).
- **WP 7 built: the bracket set answers.** `components/landing/bracket-instrument.tsx`. Details under "The page, in order".
- **WP 8 built: the showcase.** `components/landing/showcase.tsx` replaces `construction-band.tsx`, `anatomy-figure.tsx` and `depth-section.tsx`. Those three files are kept, unused, in `explorations/snapshots/private/landing-options-20261009/retired/` as a starting point for improvement WP 4.1.
- **Seat and Scrub are retired** with the Button close-up, and L10 and L11 with them. The hero no longer animates on load.
- `table-specimen.tsx` now exports its `requests` and `RequestStatus`, so the Table page and the showcase read the same records and status glyphs.
- **L8, L9 and L17 applied (later Oct 10).** The showcase is a stage in the main column, ruled by hairlines, in the page's own mode: it sets no finish or mode of its own and inherits the landing island's, so it is right before first paint. Parts not picked take the rule ink. `landing-options.ts` and the review panel moved to the private `retired/` folder.
- **Tab strip fix.** In the showcase bar, Tabs' viewport is capped at its container's width while it reaches 1 fen past each side for focus room, so it scrolled by 2 fen and showed a scrollbar. `landing.css` lifts the cap for this strip and hides its scrollbar; on phones it still pans by touch and arrow keys. The same cap affects any Tabs inside a shrink-to-fit container; fixing it in `@zao/react` is a published change and needs its own go-ahead.

## Progress, Oct 9

- **WP 1 done.** The nav drawings live in `apps/docs/components/figures/`. Nav screenshots are byte-identical to the previous build at 2×, light and dark, at rest, hover and keyboard focus.
- **WP 2 done.** `app/page.tsx` renders the five sections from `components/landing/`. `OverviewExhibition` and its spec are retired. Foundations → Depth shares `components/depth-scale.tsx` with the landing page; its markup is unchanged. `lib/docs-sections.ts` feeds both the nav and the Explore counts.
- **WP 3 built.** A docs-only review panel at `/?review=landing` switches L5–L11 on the real page and writes them to the link. L7 B (the bracket set redrawn in fen) and both L10 drawings exist so they can be compared. L11's three presets drive both Seat and Scrub. L12 A (`components/landing/button-link.tsx`) is the hero's link implementation.
- **Changes from the plan.** The anatomy has four parts, not five: Button's code has a base, one joined side, a face and a label, and the contact edge is the side at rest. The motion sheet is live in the panel, with recordings as backup. The landing page is one Quiet instrument island whose mode is set before first paint by an inline script, so dark-mode readers never see a light hero.

## Why the landing page changes

Review of the Oct 9 build at 1440×900 and 390×844, in Su light and dark.

| ID   | Finding                                                                                                                                                                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-F1 | The first viewport reads as a docs page. The largest type role is `type-display` (36px). The first object is a specimen labelled "Card · Storage study" and "Quiet instrument · Local Su study · Sample data", so visitors see the working process before the idea. |
| L-F2 | The strongest brand assets are too small to notice. The four construction drawings appear only at 48×40px in the nav. The depth model appears only on Foundations → Depth.                                                                                          |
| L-F3 | Nothing outranks anything else. The page has three bordered groups and 13 underlined text links. The "Shared foundations" row (12.00 / 68.00 / 100.00, and a second "North workspace") needs context before it can be read.                                         |
| L-F4 | There is no story and no next step. The page never explains Yingzao Fashi, structure and finish, or why ZAO is written for agents. It offers nothing to do next.                                                                                                    |
| L-F5 | On mobile, the "Browse docs" disclosure comes before the headline. The sidebar is kept (L1), so this stays as it is for now. Note it for the layout plan.                                                                                                           |

## The idea

**Show the way of building, then something built with it.** An Apple product page gives each screen one idea and makes the product the hero image, and the page ends with the lineup. ZAO's product is a way of building, so the hero object is the bracket set (斗拱), drawn with the same pen as the nav figures, and it comes apart under the pointer to show its standard parts. The next screen shows what those rules make: a working workspace and its assistant, built only from ZAO components, with a switch that names every part.

## The page, in order

Every section follows the same hierarchy rules:

- One idea per section: an optional eyebrow, a heading, one sentence, then one figure or one live sample.
- At most one primary Button per section. Only the hero's primary Button is the page's main action.
- No internal study labels ("Quiet instrument", "Local Su study", "Sample data") on the landing page. They stay on component pages.
- Text links appear only in Explore and in body copy.
- Sections sit in the main column beside the kept sidebar, separated by the largest fen step (`space-20`, 80px). More space between sections would need a structural decision, so ask before adding it.

### 1. Hero

| Part     | Content                                                                                                                                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eyebrow  | `v0.1 · Su 素 · In progress` (`type-caption text-muted`)                                                                                                                                                               |
| Headline | Proposed (L13): "ZAO is the foundation for how we build." Set in the hero type role (L6) with `text-balance`. This is the page's only `h1`.                                                                            |
| Subline  | Proposed (L13): "An experimental design system at the boundary of 2D clarity and 3D presence, built for people and agents." (`type-body text-muted`, one sentence)                                                     |
| Actions  | Primary: "Browse components" → `/components/button`. Secondary: "View on GitHub" → the repo. Both use ZAO Button construction, so a visitor's first hover shows the approved lift (L12 decides how they become links). |
| Figure   | The bracket set (L2, L7), an inline SVG with `aria-hidden`, standing on a fen ruler: a hairline baseline with end stops and graduations, drawn like the Tabs and chart rulers.                                         |
| Caption  | Proposed (L13): "斗拱 Bracket set. Standard parts, assembled by rule." (`type-caption text-muted`)                                                                                                                     |

Composition is L5 B: copy left, figure right, from 64rem. At 1440×900 the first viewport shows the whole hero and the showcase window's tab bar and first row. Below 64rem the hero stacks; below 48rem the headline falls back to `type-display` and the figure scales to the column width.

**The bracket set answers (L14, WP 7).** Based on Hairline's exploded figures; the rest pose is the picture.

- **Pointer.** Moving across the drawing opens every gap between courses by the same amount, from closed at the left to 6 fen at the right: course _k_ rises _k_ × the gap, the share rule of the nav's exploded figures. Moving up and down picks the course nearest the pointer. The picked course, and everything resting on it, lifts half a step (3 fen) further; it keeps full ink while the others are ghosted in `border-subtle` (L17 B).
- **Measure.** The ruler becomes a dimension line: a 2px selection line with end ticks, as on Tabs, under each part of the picked course. The caption names the part and its size in fen, for example "慢栱 Long arm · 92 × 15 fen". All captions share one grid cell, so naming a part never moves the page.
- **Leaving** settles the parts back with the seat role (standard easing, no overshoot). While the pointer moves, parts follow with the lift role. Pointer input is coalesced to one style write per animation frame; there is no running loop and no library.
- **Room.** The space above the drawing holds the opened courses (33 fen). It overlaps the hero gap on narrow screens and the page's top padding beside the copy, so the hero is no taller than before.
- **Keyboard.** The drawing is one focusable group. Up and Down pick a course, Left and Right open and close by 1 fen, Home and End close and fully open, and Escape returns it to rest. A polite live region reads the part and size, or how far the set is open. Blur rests it.
- **Touch.** A press picks by height and a horizontal drag opens; vertical drags still scroll the page. Lifting the finger settles it.
- **Reduced motion.** The parts stay seated; the pick, the dimension line and the readout still answer.

### 2. Showcase (L15, WP 8)

- **Stage (L8 A, L9).** A square stage in the main column, ruled by a subtle hairline, in the page's own mode: light on a light page, dark on a dark page. It inherits the landing island's finish and mode instead of setting its own. No new colors or tokens. Its ground and the 00 canvas plate are `bg-sunken` (L18, Oct 13).
- **Copy.** Eyebrow "Built with ZAO". Heading "One workspace, built from shared parts." Sentence: "A working workspace and its assistant, made from 11 ZAO components. Approve the waiting requests, then show the parts." The count comes from the same list that labels the parts. From 64rem the heading and sentence sit side by side, so the window starts high.
- **Window.** One Card-built frame (`card-shaded-construction`, subtle border, `bg-surface`). The bar holds the workspace name, primary Tabs (Overview, Requests, Members, Settings), a View Menu and a settings IconButton; Menu and IconButton switch views or reset the example.
- **Overview.** A Storage Card with the 68% ring, a Seats Card with Progress (48 of 60), a short reading list and an Email updates Switch, and the six requests in a Table with D10's status glyphs. Other views take the overview's height, so switching tabs never resizes the window.
- **Assistant.** A Conversation with two exchanges. Its last Message offers "Approve 2 requests"; approving sets both requests to Ready in every table and replies "Approved 2 requests. …". The same Button then reads "Reopen 2 requests", so focus stays on it. The Composer accepts a written request: one that asks to approve does the same; anything else gets a short reply that the preview answers from local sample data.
- **Show parts.** A Switch below the window outlines each component with a dashed hairline and names it on the outline, like a fieldset legend. Nothing moves or resizes.
- **Depth.** The shared `DepthScaleControl` scales contact and lift on the window only.
- **Phones.** One column: the assistant follows the workspace with a 320px transcript, Tabs scroll in their own viewport and the Table in its scroll region.
- **Components used (11):** Tabs, Menu, IconButton, Card, Progress, Switch, Table, Button, Conversation, Message, Composer. The storage ring is the docs-local chart study.

### Retired: Construction close-up and Depth (Oct 10, L16)

The Button anatomy band and the standalone Depth section are gone. The depth control moved into the showcase; Foundations → Depth keeps the full demonstration.

### 3. Two readers

- **Heading.** "Written for two readers."
- **For people.** A real Card with its approved bottom-row Buttons.
- **For agents.** The same component's usage rules in `type-code`, read from the `button` entry in `components/component-detail.tsx`. Do not copy the prose into the page.
- **Status line** (`type-caption text-muted`): "Component manifests and a validator are planned for v0.1." Make no claims beyond what exists today.

### 4. Explore

- Three tiles: Foundations, Components and Charts. Each has its nav drawing at a larger size, a title and one line. The whole tile is one link with an accessible name.
- Link to `/foundations/color`, `/components/button` and `/charts` until the overview pages exist.
- Hover or keyboard focus lifts the same part that lifts in the nav, using the existing `--docs-nav-figure-lift` behavior and values.
- Below the tiles, one caption: "Named for 营造法式 Yingzao Fashi, the Song building manual of 1103."

### Removed from the landing page

- `OverviewExhibition`, the "Shared foundations" row and the trailing foundation links. Keep `CardSpecimen` and `StorageRingStudy`, because component pages use them.

## Motion: two moves, each based on one already approved

| Move   | When                      | What                                                                                   | Based on                       |
| ------ | ------------------------- | -------------------------------------------------------------------------------------- | ------------------------------ |
| Answer | Hero, pointer or keyboard | The bracket set's courses open evenly and one course lifts; leaving settles them back. | Nav exploded figures; Hairline |
| Lift   | Explore tiles             | Hover or focus lifts one part of the drawing.                                          | Nav section figures            |

Rules:

- **Oct 11:** the hero's moves are the Parts/Built change, the layer pick and the keyboard (finish plan V9). They read the grade 1 duration and the 举折 curves.
- Only drawings and controls move. Text never animates. Do not add fade-up-on-scroll, parallax, loops, autoplay or smooth-scroll hijacking.
- Nothing plays on its own. The resting state is complete before any script runs.
- Reuse the finish's lift, seat and slide roles; add no durations or curves.
- **Retired Oct 10:** Seat (load-in assembly) and Scrub (scroll-driven explode of the Button anatomy), with L10 and L11.

## Decisions

### Decided Oct 9

| #   | Decision                    | Outcome                                                                                                                                       |
| --- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | Docs sidebar on the landing | **Keep it.** The landing page uses the existing docs layout; header and nav are unchanged.                                                    |
| L2  | Hero object                 | **The bracket set 斗拱**, drawn in the nav figures' language.                                                                                 |
| L3  | Construction background     | **A dark band, Apple-style**: a Su dark-mode island with Quiet instrument's existing dark mapping and no new colors. Superseded Oct 10 by L9. |
| L4  | Scope                       | **Landing page first.** Overviews for Foundations, Components and Charts come in a later plan.                                                |

### Decided Oct 10

| #   | Decision                      | Outcome                                                                                                                                          |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| L5  | Hero composition              | **B, split.** Copy left, figure right, from 64rem, so the content and the example show without scrolling.                                        |
| L6  | Hero type size                | **56px (14 fen)**, line height plus one fen, −0.025em. Applied in `landing.css`; a published `type-hero` role is a separate token change (WP 4). |
| L7  | Bracket set                   | **B, redrawn in fen, with a hairline.**                                                                                                          |
| L10 | Anatomy drawing               | **Retired** with the Button close-up (L16).                                                                                                      |
| L11 | Motion values                 | **Retired.** Seat and Scrub are gone; the bracket set's answer reuses existing roles.                                                            |
| L14 | Bracket set answer            | **Hairline's exploded-figure behavior, with a 6 fen maximum gap** between courses.                                                               |
| L15 | First impression after hero   | **A working workspace plus assistant**, built from ZAO components, replacing the Construction section.                                           |
| L16 | Button close-up               | **Dropped now**, with the standalone Depth section.                                                                                              |
| L8  | Showcase extent               | **A, a stage in the main column.**                                                                                                               |
| L9  | Showcase mode                 | **Follows the page:** light on a light page, dark on a dark page. Replaces L3's dark band.                                                       |
| L17 | Bracket set, parts not picked | **B, ghosted** in `border-subtle`; the picked part keeps full ink.                                                                               |

### Decided Oct 11 (finish plan)

| #   | Decision                   | Outcome                                                                                                                                                                                               |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V9  | Hero rest pose             | **Parts.** The exploded workspace is the first image; Built restores the working window. Supersedes L2 (bracket set as hero) and L5 (split hero).                                                     |
| V10 | Bracket set                | **Beside the headline (A, Oct 11, later).** First moved to Explore and the nav; Yankun then put it back at the top, smaller (256px), split beside the copy. It keeps L14's answer and L17's ghosting. |
| —   | Showcase                   | **Merged into the hero.** Supersedes L15's separate section; the window, its components and its sample data are unchanged. L8 (stage in the main column) and L9 stay.                                 |
| —   | Motion on the landing page | The hero's moves are the Parts/Built change (grade 1, 举折 enter and exit curves), the pick and the keyboard. The bracket set keeps its own answer beside the headline.                               |

### Decided Oct 13

| #   | Decision     | Outcome                                                                                                                                                                                                       |
| --- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L18 | Stage ground | **A, sunken.** The stage and its 00 canvas plate use `bg-sunken`, a step below the window's surface, so the parts stand off the ground in both poses. Existing role, no new colors; L9 stays. B–E unselected. |

### Still open

| #   | Decision              | Options                                                                                              | Agent suggestion   |
| --- | --------------------- | ---------------------------------------------------------------------------------------------------- | ------------------ |
| L12 | Hero actions as links | A: docs-local `ButtonLink` (current). B: link rendering in `@zao/react` Button, a public API change. | A for now.         |
| L13 | Copy                  | The strings in this plan, including the showcase copy and assistant lines.                           | Yankun edits them. |

### Open on Oct 9 (history)

| #   | Decision                               | Options to compare                                                                                                                                                                                                  | Reviewer's lean                                                                 |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| L5  | Hero composition                       | A: centred stack (eyebrow, headline, subline, actions, figure below). B: split (copy left, figure right).                                                                                                           | A. It is closest to the reference and gives the figure the column's full width. |
| L6  | Hero type size                         | A new structural role, `type-hero`, in `base/type.tokens.json`. Show 56, 64 and 72px (14, 16 and 18 fen), each with line height and tracking derived like `type-display`. Below `md`, fall back to `type-display`.  | Compare all three in context.                                                   |
| L7  | Bracket set at hero scale              | A: the nav figure scaled up as it is. B: a redrawn hero figure with more parts, in the same pen. Show each with a hairline stroke and with a 1.5px stroke.                                                          | B with a hairline, because the 48×40 geometry looks coarse at 400px.            |
| L8  | Band extent                            | A: a square stage inside the main column. B: from the main column's left edge to the right edge of the viewport.                                                                                                    | A. It matches Card's square frame and never runs under the sidebar.             |
| L9  | The band when the page is in dark mode | A: stays dark, with its edges marked by hairline rules. B: flips to a light island.                                                                                                                                 | A.                                                                              |
| L10 | Anatomy drawing (shared with D13)      | A: flat plates offset along the depth axis. B: a true axonometric projection.                                                                                                                                       | A, because it uses the same right-and-up axis as the depth tokens.              |
| L11 | Motion values                          | Seat: stagger and travel distance. Scrub: pinned length in viewport heights and the exploded spacing. Show two or three recordings of each.                                                                         | Reuse `duration-base` and `easing-standard`; choose the rest from recordings.   |
| L12 | How hero actions become links          | A: a docs-local `ButtonLink` that reuses the published `button-construction` utilities and face slot on an `<a>`. B: add link rendering to `@zao/react` Button, which is a public API change and needs a changeset. | A for now. B needs its own decision.                                            |
| L13 | Copy                                   | The proposed strings in this plan.                                                                                                                                                                                  | Yankun edits them.                                                              |

Put the sheets in `explorations/snapshots/private/landing-<topic>-<yyyymmdd>/`, following the existing `review.md` format. Use three sheets:

- **Hero:** L5, L6 and L7, rendered on the real landing page in Su light and dark at 1440 and 390.
- **Band:** L8, L9 and L10, with the page in light and in dark.
- **Motion:** L11, as short recordings.

Label every option "agent-made". You may add a one-sentence suggestion, marked as a suggestion.

## Work packages

Do one work package per PR, in order. Work on a branch and merge by PR. Never push to `main`.

### WP 1: Shared figures (no visual change)

Move the four drawings out of `components/nav-section-figure.tsx` into `components/figures/`. Group each drawing's parts with a data attribute and an order index, so a figure can render at any size and animate per part. The nav must render pixel-identically: compare nav screenshots before and after in Su light and dark, at rest, on hover and on keyboard focus.

### WP 2: Page structure with current values

Rewrite `app/page.tsx` with sections 1–5. Put the section components and `landing.css` in `components/landing/`. Use the current values everywhere a decision is open: `type-display` for the headline, the scaled nav bracket set, the band inside the column, a static exploded Button and no motion. Remove the exhibition. This WP is the stage the option sheets are judged on.

### WP 3: Option sheets ⛔

Build the hero, band and motion sheets. Stop until Yankun chooses.

### WP 4: Apply the chosen values

- **Done Oct 10:** L5–L9 and L17 are the page's values; the review panel is retired.
- **Waiting for a go-ahead:** publishing L6 as a `type-hero` role. Put it in `base/type.tokens.json` with a `$description`, add a `type-hero` utility to `theme.css` and a changeset, and update the type table in `AGENTS.md`. Every finish shares structural tokens, and the existing test fails if a finish overrides one. Until then the 56px value stays in `landing.css`.
- Build the actions as links (L12).

### WP 5: Motion (superseded Oct 10)

Seat and Scrub were retired with the Button close-up. WP 7 replaces them.

### WP 7: The bracket set answers (built Oct 10)

Implements L14 as described under the hero. Covered by `e2e/landing.spec.ts`: rest pose, even opening to 6 fen, the half-step lift, the 92-fen dimension line for the long arm, settling on leave, keyboard picking, opening, Escape and announcements, and reduced motion.

### WP 8: The showcase (built Oct 10)

Implements L15 and L16 as described under section 2. Covered by `e2e/landing.spec.ts`: approval through the Button and through the Composer, Reopen keeping focus, views switching without resizing, Show parts naming 11 components without moving anything, depth changing paint but not layout, and no sideways scroll at 390 with parts shown.

### WP 6: Verify and polish

- **Screenshots:** 1440×900, 1024×768 and 390×844, in Su light and dark, at rest, with the bracket set open, and with Show parts on. Attach them to the PR.
- **Reduced motion:** the bracket set stays seated while its pick, measure and readout answer.
- **Keyboard order:** hero actions → bracket set → Parts/Built → stage → depth slider → Explore tiles.
- **Other states:** forced colors keep every figure visible; axe is clean in light and dark; nothing scrolls horizontally at 390; there is one `h1`.
- **Static export:** `pnpm docs:build` succeeds.
- **Dependencies:** none added.

## Tests

- Retire `e2e/overview-exhibition.spec.ts`, because its UI is removed, not because a test was weakened. Say so in the PR.
- `e2e/landing.spec.ts` (18 cases) covers:
  - section order and headings, and that the retired sections are gone;
  - the hero actions' destinations and hover;
  - the bracket set's pointer and keyboard behavior, and reduced motion;
  - the showcase following the page's mode, including before hydration;
  - the workspace: approval, Reopen focus, views, Show parts and depth;
  - the window's tab strip fitting without a scrollbar at 1440, 1280 and 1024, and panning without one at 390;
  - the keyboard order, axe in light and dark, and no horizontal scroll at 390;
  - the sheet's rails, rules and marks at 1440 in light and dark, at 390, and in forced colors (Oct 21).
- Keep the `components.spec.ts` check that `/` loads Su with no Yu controls.
- Add an assertion to `nav-construction.spec.ts` that WP 1 left the nav unchanged.

## Out of scope

- Overview pages for Foundations, Components and Charts (L4).
- Any sidebar or header change, including the mobile disclosure order (L-F5).
- New colors, an accent, Yu, glass or blur.
- New dependencies, and published API changes unless L12 chooses B.
- Changing how the nav figures look or behave.

## Authorizing this plan

Following the improvement plan's rule, this becomes current work when Yankun adds a line like this to "Current work" in `PLAN.md`:

> **Requested landing page (Oct 9):** Implement [the landing plan](docs/plans/2026-10-landing/README.md). Keep the sidebar (L1), use the bracket set as the hero (L2), put Construction on a Su dark-mode band (L3), and redesign the landing page first (L4). L5–L13 are gated by option sheets. No new colors, dependencies or published API.
