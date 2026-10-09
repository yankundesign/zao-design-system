# Landing page, October 2026

_For coding agents working in `yankundesign/zao-design-system`. Written Oct 9, 2026. Owner and decision-maker: Yankun._

**Status: direction approved Oct 9.** Yankun chose to keep the docs sidebar, use the bracket set as the hero figure, put the Construction section on a dark band, and redesign the landing page before the section overviews. The open decisions below are ⛔ gates. Build their option sheets and stop. Do not pick a value for him.

This plan only covers `/` (Start → Overview). Overview pages for Foundations, Components and Charts get a separate plan later.

## Read first

1. `AGENTS.md`, the root and `apps/docs` versions.
2. The Quiet construction direction in `BRIEF.md`.
3. `docs/plans/2026-10-improvement/README.md`, for its rules, option sheets and definition of done. They apply here unchanged.
4. This file, to the end.

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

**Show the whole building, then its parts.** An Apple product page gives each screen one idea and makes the product the hero image. Scrolling shows how the product is built, and the page ends with the lineup. ZAO's product is a way of building, so the hero object is something built: the bracket set (斗拱), drawn with the same pen as the nav figures. The Construction section then takes one Button apart along the depth axis, using the shared part names.

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

Composition is L5. At 1440×900 the first viewport shows everything from the eyebrow to the ruler. Below `md`, the hero stacks, the headline falls back to `type-display`, and the figure scales to the column width.

### 2. Construction (dark band)

- **Band (L3, L8, L9).** A Su dark-mode island: a `.study` element with `data-study="quiet-instrument"`, `finish('su', 'dark')` and the study stylesheet loaded. Quiet instrument already maps `.study[data-zao-mode='dark']`. Add no new colors and no new tokens.
- **Copy.** Eyebrow "Construction". Heading "Every part has a job." (`type-title`). Body: "A Button is a face, a side and a base. Only the face moves. The hit area and focus outline stay fixed."
- **Figure (L10).** One Button pulled apart along the depth axis (right and up) into five parts, using the names from the improvement plan: Base (hit area and focus outline, dashed), Contact edge, Side, Face, Label. Labels are real HTML text with leader lines, not SVG text.
- **Real part.** Below the figure, a real primary Button in the dark island. "Press the real one." is optional copy (L13).
- **Scrub.** On `md` and wider, with motion allowed and scroll-driven animation supported, the stage pins with `position: sticky` and scroll position drives how far apart the parts are (L11). Otherwise the figure renders already exploded, with labels visible.

This figure is also the first anatomy figure from improvement WP 4.1. L10 and D13 share one answer.

### 3. Depth

- **Copy.** Heading "Turn the depth." One sentence: "One control moves the same painted distances in every part. Layout never moves."
- **Sample.** A slider plus Button, Card and Switch only. Extract the depth math from `components/depth-demo.tsx` into a shared hook or component, so the landing page and Foundations → Depth use one source. Foundations → Depth must look and behave exactly as it does now.
- The range, reset and readout follow `DepthDemo`. The landing version adds no new controls.

### 4. Two readers

- **Heading.** "Written for two readers."
- **For people.** A real Card with its approved bottom-row Buttons.
- **For agents.** The same component's usage rules in `type-code`, read from the `button` entry in `components/component-detail.tsx`. Do not copy the prose into the page.
- **Status line** (`type-caption text-muted`): "Component manifests and a validator are planned for v0.1." Make no claims beyond what exists today.

### 5. Explore

- Three tiles: Foundations, Components and Charts. Each has its nav drawing at a larger size, a title and one line. The whole tile is one link with an accessible name.
- Link to `/foundations/color`, `/components/button` and `/charts` until the overview pages exist.
- Hover or keyboard focus lifts the same part that lifts in the nav, using the existing `--docs-nav-figure-lift` behavior and values.
- Below the tiles, one caption: "Named for 营造法式 Yingzao Fashi, the Song building manual of 1103."

### Removed from the landing page

- `OverviewExhibition`, the "Shared foundations" row and the trailing foundation links. Keep `CardSpecimen` and `StorageRingStudy`, because component pages use them.

## Motion: three moves, each based on one already approved

| Move  | When                    | What                                                                                                                                              | Based on                  |
| ----- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Seat  | Hero load, once         | Bracket-set parts travel along the depth axis onto their seats, bottom to top, in sequence.                                                       | Button press seating      |
| Scrub | Construction, on scroll | Scroll position sets how far apart the Button's parts are. There is no duration or easing, it reverses with scroll, and nothing plays on its own. | Lift along the depth axis |
| Lift  | Explore tiles           | Hover or focus lifts one part of the drawing.                                                                                                     | Nav section figures       |

Rules:

- Only drawings and controls move. Text never animates. Do not add fade-up-on-scroll, parallax, loops, autoplay or smooth-scroll hijacking.
- **Seat** uses CSS keyframes and a `--part-index` per part. The finished figure is the default state, so no part is hidden before CSS loads. With reduced motion, the figure is simply assembled.
- **Scrub** is progressive enhancement: use `@supports (animation-timeline: view())` with `@media (prefers-reduced-motion: no-preference) and (min-width: 48rem)`. Use no JavaScript scroll listeners and no libraries. Without support, show the exploded state with labels.
- Reuse `duration-base` and `easing-standard` where a duration or curve is needed. Stagger, travel distance and pinned length are new values (L11).

## Decisions

### Decided Oct 9

| #   | Decision                    | Outcome                                                                                                              |
| --- | --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| L1  | Docs sidebar on the landing | **Keep it.** The landing page uses the existing docs layout; header and nav are unchanged.                           |
| L2  | Hero object                 | **The bracket set 斗拱**, drawn in the nav figures' language.                                                        |
| L3  | Construction background     | **A dark band, Apple-style**: a Su dark-mode island with Quiet instrument's existing dark mapping and no new colors. |
| L4  | Scope                       | **Landing page first.** Overviews for Foundations, Components and Charts come in a later plan.                       |

### Open: build option sheets and stop

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

- If L6 adds `type-hero`, put it in `base/type.tokens.json` with a `$description`, add a `type-hero` utility to `theme.css` and a changeset, and update the type table in `AGENTS.md`. Every finish shares structural tokens, and the existing test fails if a finish overrides one.
- Draw the chosen bracket set (L7) and anatomy figure (L10).
- Apply the band extent and dark-page behavior (L8, L9).
- Build the actions as links (L12).

### WP 5: Motion

Implement Seat, Scrub and Lift with the L11 values and the rules above.

### WP 6: Verify and polish

- **Screenshots:** 1440×900, 1024×768 and 390×844, in Su light and dark, at rest and mid-scrub. Attach them to the PR.
- **Reduced motion:** the hero is assembled, the Construction figure is exploded with labels, and nothing moves.
- **Keyboard order:** hero actions → band Button → depth slider → Card actions → Explore tiles. The pinned stage never traps focus or scrolling.
- **Other states:** forced colors keep every figure visible; axe is clean in light and dark; nothing scrolls horizontally at 390; there is one `h1`.
- **Static export:** `pnpm docs:build` succeeds.
- **Dependencies:** none added.

## Tests

- Retire `e2e/overview-exhibition.spec.ts`, because its UI is removed, not because a test was weakened. Say so in the PR.
- Add `e2e/landing.spec.ts`. It covers:
  - section order and headings;
  - the hero actions' destinations;
  - the band carrying `data-zao-mode="dark"` in both page modes, or following L9;
  - reduced-motion final states;
  - the keyboard order;
  - axe;
  - no horizontal scroll at 390.
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
