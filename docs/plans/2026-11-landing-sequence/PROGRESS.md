# Landing sequence progress

_Resume here. Update at every finished work package._

## Baseline, Nov 3

`next build` in `.next-seq-test`, then `landing.spec.ts`, `nav-construction.spec.ts` and `components.spec.ts` on port 3141. The `components.spec.ts` filter also matches `new-components.spec.ts`. 80 of 80 pass, with no existing failures.

## Work packages

All work is in the working tree on `charts/wave-2`, uncommitted; `git mv` staged WP 1.2's renames. That branch also holds unrelated uncommitted work, including the untracked gallery that Phase 3 needs. Yankun decides how to commit and split it.

| WP  | Status      | Notes                                                                                               |
| --- | ----------- | --------------------------------------------------------------------------------------------------- |
| 1.1 | Done        | Spike below. Chromium only: WebKit and Firefox need a browser download. The spike route is removed. |
| 1.2 | Done        | See below.                                                                                          |
| 2.1 | Done        | See Phase 2 below.                                                                                  |
| 2.2 | Done        | See Phase 2 below.                                                                                  |
| 2.3 | Done        | The hint points at the room (`#components`).                                                        |
| 3.1 | Done        | See Phase 3 below. The gallery was committed first (`645c1e0`).                                     |
| 3.2 | Done        | Hero, room, readers, explore.                                                                       |
| 4.1 | Mostly done | Built with Phase 2, so the sequence never ships without its fallback. See below.                    |
| 5.1 | Started     | `landing.spec.ts` updated and `landing-sequence.spec.ts` added. See below.                          |
| 5.2 | Started     | This file, the plan, `AGENTS.md` and `PLAN.md`.                                                     |

## WP 1.1 spike, Nov 3

**Where it was.** The route was `/spike/sequence`; it was removed on Nov 3 once Phase 2 landed. The measurement scripts in `output/landing-sequence-spike/` need it, so they no longer run as they are. Since Nov 3 the default is the chosen direction: `css`, the docs held still and covered, Built filling the width. The query string restores the variants the first run measured:

- `mode=raf`: the `requestAnimationFrame` reader
- `fit=contain`: Built contained instead of filling the width
- `shell=rising`: the docs page rises by scrolling instead of being held

`hero.tsx` now exports `layers` and `extras` for it.

**How it was measured.** Headless Chromium at 1440 × 900 runs a real wheel scroll of 40px every 16ms, down past docking and back to the top. A per-frame sampler records the stage's painted top and its slot's top. The script is `output/landing-sequence-spike/measure-spike.mjs`, and the screenshots are beside it.

**Provisional values, not approved.** The spike chose these, and Phase 2 needs Yankun's values:

- the gaps close over the assembly's first 70% and the drawing turns flat over the last 30%
- the full-screen fit keeps 8 fen of padding

### Findings

1. **Use `ScrollTimeline`.** Driving every transform from the root scroll timeline through the Web Animations API held the stage exactly: 0px off while pinned and 0px off at docking. A passive `requestAnimationFrame` reader with a fixed stage was one frame late at each handover: 33px at docking and 20px on the way back into the step back. Those figures are main-thread measurements; on real hardware, where scrolling runs on the compositor, the script path lags further. Chromium supports `ScrollTimeline`.
2. **Hold the docs page still.** If the docs page rises by ordinary scrolling (the plan's first mechanism), the window has to drop about 300px to its slot below the copy while the page moves up under it. The top half of the screen goes empty, and the copy stays covered until the last frame (`3a-step-back-page-rises.png`). Holding the docs grid still with a linear scroll-linked translate gives LS5's picture: the window shrinks and settles while the nav and the headline sit still around it (`3b-step-back-page-held.png`). The headline's top stayed at 225px until docking and then scrolled 1:1. In the spike only the hero section is held correctly; the nav uses a stand-in that jumps after docking. WP 1.2 holds the real grid.
3. **LS4's scale was wrong.** The docked stage is 1156 × 845, about the screen's own height. Contained, Built is 0.91× (`2a-built-contain-0.91x.png`): smaller than docked, so the window grows 10% while it "steps back". Filling the width, Built is 1.19× (`2b-built-width-1.19x.png`) and the step back shrinks it, but the bottom of the window, including the Composer, is below the fold during the hold. **Decided (Yankun, Nov 3): fill the width.**
4. **The ground is its own backdrop.** The stage's box covers only its fit, so the nav showed beside the Parts drawing (`1-parts.png`). Scene 1 needs a full-screen `bg-sunken` ground behind the stage.
5. **The swap must be instant.** `ExplodedStage` waits for its transition before showing the live window. Under scroll there is no transition, so it falls back to a 670ms timer, and the overlay and focus copies stayed visible over Built for that long. Swap frames ran up to about 50ms. WP 2.1 swaps in the same frame and keeps the copies alive.
6. **Long frames need a real GPU.** Headless Chromium renders in software. It showed 45–80ms frames while the six copies turned flat (scroll 1000–1320) in the `css` mode, and at the swaps in both modes. That is not a verdict on real hardware; take a trace in a real browser before Phase 2 closes.
7. **The spacer was undersized.** It must cover the assembly, the hold and the step back. The plan said only the first two; it is corrected.

### Not measured

- **WebKit and Firefox.** Playwright 1.63 wants `webkit-2359` and a newer Firefox than the cached `webkit-2227` and `firefox-1497`, which don't start under it. Installing them is a download, so it waits for Yankun.
- **Visual jitter on real hardware.** A headless run can't see compositor jitter; it needs a person scrolling a real browser.

## Nov 3, after Yankun tried the spike

Yankun asked for four changes. The first three are in the spike, which is the only place the sequence exists until Phase 2. The fourth is in `ExplodedStage`, so today's hero has it too.

1. **No header first (LS1, revised).** The stage and a full-screen `bg-sunken` ground with the character field cover the whole screen, header included. The header, nav and copy are inert while covered. The window uncovers them as it steps back, and they become usable at docking. The grid sits above the sticky header until docking; at that frame nothing overlaps the header, so the switch doesn't show.
2. **Scroll hint.** At the foot of the first screen, Iconoir's `ArrowDown` with "Scroll to build" in `type-caption` `text-muted`. It is still, hides once the page has scrolled 8px, and returns at the top.
3. **Smoother picking.** A layer rises and settles on grade 1 (270ms), the drawing's own grade, instead of grade 7 (157.5ms): it rises on `fold-enter` and settles on `fold-exit`. The ghosting follows the same curves instead of a linear fade. A picked layer holds until the pointer is a quarter band past its edge.
4. **Inactive layers at 50%** instead of 22%, so the workspace still reads while a layer is picked.

**Checked** in headless Chromium at 1440 × 900, light and dark (`output/landing-sequence-spike/verify-v2.mjs`):

- The hint is visible at 0, hidden from 20px, and visible again at the top.
- The header is covered and inert until docking at 2505px, then on top and usable.
- The nav and the headline stay at 113px and 225px until docking, then scroll 1:1.
- A picked layer is at opacity 1 and the other five at 0.5.

The screenshots are `v2-*.png` beside the first run's.

**Spike bug found and fixed.** A keyframe list that stops before the end of the scroll timeline gains an implicit final keyframe at the underlying value. That made the hint visible again further down and caused the nav jump in the first run. Every list now holds its last value to offset 1. Phase 2 must do the same.

**A smaller Built ground detail for Phase 2.** At the moment of build, the screen ground hands over to the stage's own ground. Their character-field tiles are at different scales, so the texture changes in that frame.

## WP 1.2, Nov 3

- **The move.** Every docs route moved into `app/(docs)/`, which renders the grid through `components/docs-grid.tsx`. The root layout keeps the header, the finish script and the footer. `/` renders the same `DocsGrid` itself; the sequence will go before it in WP 2.2. URLs, the DOM and the static export are unchanged.
- **Stale route types.** Stale `.next/types/app` files from an Oct 31 build pointed at the old paths and failed `tsc`. `next typegen` doesn't write that folder, so it was removed; typecheck passes.
- **Two side effects.** Client navigation between `/` and a docs page now remounts the nav, because the two use different layout trees. The default 404 renders without the grid.
- **Results.** In `.next-seq-test` on port 3141, the full docs browser suite passed 686 of 688. The two failures were in `motion-interruption.spec.ts` (Select and Combobox reveal reversal, timing). That spec re-run alone passes 28 of 28. The static export (`ZAO_DOCS_STATIC_EXPORT=1`, in `.next-seq-export`) succeeds.

## Phase 2, Nov 3

### WP 2.1 `ExplodedStage` driven by scroll

- **The props.** `scrub` takes `{ timeline, start, end, ease }`, and the drawing is in Parts at `start` and Built at `end`. `pickable` lets the sequence allow picking only at Parts' rest. Without `scrub`, the stage behaves exactly as before, which is the fallback's switch.
- **The animations.** The assembly's transform, each layer's depth (the `translate` property, so a layer's own `transform` keeps only the pick's lift) and each tag's visibility are keyframed on the timeline. They use LS2's ground-up seating from `components/landing/sequence-timing.ts`, which both the stage and the sequence share. Every keyframe list holds its last value to offset 1.
- **The swap.** Driven, a pose change swaps in the same frame. The copies stay alive between swaps; a `MutationObserver` marks them stale whenever the live window changes, and they are redrawn only then.

### WP 2.2 `LandingSequence`

- **Where it lives.** `components/landing/landing-sequence.tsx`. `LandingSequence` wraps the docs frame on `/` (as `display: contents`), decides the mode and renders the spacer before the frame. `useSequenceStage` in the hero measures, keyframes and switches state. Script never writes a transform per frame: the frame's hold, the stage's path and the hint's visibility all run on one root `ScrollTimeline`. A passive listener only switches the pose, picking and covering.
- **Covering is geometric.** A part (the header, the nav, the copy) is inert exactly while the window's painted box, or the first screen's ground, overlaps it. The frame sits above the sticky header only while the window overlaps the header. This fixed a real problem: at the dock, a small scroll back re-enters the step back, and with all-or-nothing covering the copy went inert while still visible. The browser does this when it brings a focused part out from under the sticky header.
- **Waiting for the first scene.** On desktop the page waits, hidden, until the first scene is in place, so the docs never flash first. A 4s reveal keeps the page readable if the script never runs. **The 4s is my value, not a motion value; Yankun may set another.**
- **Resizing** keeps the reader in the same scene: proportionally inside the sequence, and by the same offset past it.

### WP 2.3 Scene 3's copy

- **The copy.** It holds the headline, the subline, View on GitHub (secondary) and the bracket set, unchanged, followed by the "Browse components" hint: a quiet text link with `ArrowDown`. It points at `#landing-explore-heading` until the room exists. **Visual values I chose:** `fg-muted`, turning `fg-default` on hover, a fen of side padding and the 34px control height, following the nav links. Yankun may revise them.
- **One more fix.** The window's name, "North", is now its `h2`, so its card titles (`h3`) no longer skip a level once the window is visible after the sequence. axe flagged this, and the old hero had the same problem in Built, untested. There is no visual change.

### WP 4.1, built early

- **When the fallback runs.** `sequenceQuery` is `(prefers-reduced-motion: no-preference) and (min-width: 64rem) and (min-height: 40rem)`. A browser without `ScrollTimeline` also gets the fallback: today's hero with its Parts/Built switch, depth control and Reset example, and no spacer. The server renders the fallback; desktop hides it until the client chooses.
- **Switching modes mid-page** (a media change) keeps the reader near the same content: the docs offset is carried across, with the spacer added or removed.
- **Not yet checked:** RTL and forced colors on the sequence itself.

### WP 5.1, so far

- **`landing.spec.ts`.**
  - `open()` docks past the sequence and sets the mode by emulating the color scheme. Clicking the sticky header's switch made Playwright scroll it "into view", back into the sequence.
  - `build()` works in both modes.
  - The Parts/Built and depth tests run under reduced motion (the fallback).
  - The bracket set and workspace tests run at 1440 × 620, a short window: the fallback with motion allowed. When a click target is briefly covered, as by a tooltip, Playwright retries with other scroll alignments, and at the dock those land back in the sequence. A person doesn't do that.
  - The keyboard order test has a docked variant and a fallback variant.
- **`landing-sequence.spec.ts`**, new, 14 cases:
  - the first screen: the header covered and inert, the hint, nothing running on its own
  - mid-assembly tags, Built at full width and usable (approve and reopen)
  - the step back holding the docs still
  - docking at 1:1 with the header reachable
  - a small scroll back keeping the copy usable
  - scrolling back and picking: a picked layer at 1 and the others at 0.5, cleared by scrolling
  - no scroll hijacking (wheel, keys)
  - a reload mid-sequence matching its scene, with no layout shift
  - focus starting on the drawing
  - the fallback under reduced motion, a short window and a phone
  - axe at Parts and docked, in light and dark
- **Results.** Both specs pass, 37 of 37.

### Still open

- **The 70/30 split** of the assembly, and Parts growing from contained to Built's width, are carried over from the spike. Yankun tried them without changing them, but never chose them.
- **The ground handover.** At the build frame, the screen's ground hands over to the stage's, and their character-field tiles are at different scales.
- **WebKit and Firefox** are unmeasured. Firefox without `ScrollTimeline` gets the fallback by design.

## Phase 3, Nov 3

- **The commit.** Yankun asked to commit the gallery first: `645c1e0` on `charts/wave-2` holds the two gallery routes, `components/gallery/`, the recorder and the three small changes they need (two exports and the Ring's `framed` layout). The 29MB of recorded GIFs in `output/gallery/` stay uncommitted. WP 1.2's staged renames were left out of that commit.
- **WP 3.1.** `Plate` moved to `components/gallery/plate.tsx`, shared by `/gallery` and the landing. `components/landing/room.tsx` is section 2: `id="components"`, the h2 "Every part, live." with LS9's draft note, and one `.gallery-wall` of 13 plates in LS8's order. Each row pairs a part with a chart, and the components wall's Storage ring is left out. Chart plates arrive as their drawing when they come into view, as on `/gallery`. `/gallery`, `/gallery/charts` and the recorder are unchanged.
- **WP 3.2.** The order is now hero, room, readers, explore, and the hint points at `#components`.
- **Fitting the plates.** On its own wall a chart gets a 38rem-wide plate. In the room's two columns, Line and Histogram spilled out of their 4:3 plates, and at phone widths several charts did. **My layout choices, which Yankun may revise:**
  - A plate keeps 4:3 and grows only when its part needs more, and the plates in a row share one height. Stage bottoms can differ by one caption line where the notes wrap differently.
  - Under 30rem, the plate's side padding drops to 2 fen and parts fill its width.
  - Under 22.5rem (320px phones), the five charts on Cards draw at 0.85 zoom, because a chart on its Card needs a 320px card, as wide as the screen.
  - The plate body's grid track is pinned to the plate's width. Each chart sizes itself to its container, so a content-sized track kept whatever width the chart first measured (594px at 390).
- **A gallery bug.** `/gallery/charts` itself scrolls 259px sideways at 375px. It is the committed gallery, not the room; it is not fixed here.
- **Tests.** `landing.spec.ts` checks the new order, the room's 13 plates in order, the hint landing on the room, a live Switch toggling, and at 1280, 390 and 320px that every part stays on its plate with no sideways scroll. The workspace tests now query inside the window, because the room's Tabs and Composer plates repeat names such as "Members" and "Send". Both landing specs pass, 41 of 41.

## One-time, Nov 3

**Why.** Yankun found the hero cramped under the header "at the top of the page". That was a scroll carried about 75px past the dock: docked, the headline sits at 145px at every width checked; 75px further it sits at 70px. The page had no stable top. Scrolling a little too far cropped the hero, and scrolling back a little re-entered the step back. Yankun chose one-time over adding friction.

**What it does.**

- **The phases.** `LandingSequence` has three: `sequence`, `done` and `fallback`.
- **The collapse.** When the reader reaches the dock, by scrolling, a key or focus, `collapse()` runs in one frame. It cancels every scroll-timeline animation, uncovers everything, sets `done` with `flushSync` (the spacer unmounts; the hero keeps its docked layout with the window built, and no ground, foot or Parts/Built switch), and scrolls back by the spacer's height.
- **The session.** `sessionStorage` (`zao-landing-sequence`) remembers it for the tab. A reload or a return through the logo or Back opens on `done`; a new tab plays the sequence again. Before the dock, every scene still reverses.

**Checked.**

- **Real wheel input in headless Chromium.** In the collapse frame the scroll goes from 2505 to 0 while the headline stays at 145px and the window at 415px. The next wheel step scrolls the docs normally, with momentum kept. Safari's momentum through the collapse is not checked.
- **Tests.**
  - `landing-sequence.spec.ts` checks the collapse: no spacer, scroll 0, the same headline position, scrolling up stopping at the docs' top, and reload staying `done` while a new context plays again.
  - Reversal is now checked before the dock.
  - axe runs at Parts and after the dock.
  - In `landing.spec.ts`, docking waits for `done`, and the bracket set and workspace tests are back at 1440 × 900.
  - The character field test reads the copies at Parts in a fresh sequence for each mode.
  - Both specs pass, 42 of 42.
