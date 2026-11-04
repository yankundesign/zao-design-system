# Landing sequence: Parts, Built, then the docs, November 2026

_For coding agents working in `yankundesign/zao-design-system`. Written Nov 3, 2026, from Yankun's brief. Owner and decision-maker: Yankun._

**Status: approved Nov 3; Phases 1–3 built Nov 3, with the fallback (WP 4.1) and the first tests.** Yankun approved the plan with every gate's lean (LS1–LS12), then revised LS1 and LS4 after the spike. What remains is Phase 5's cross-engine checks and records. Progress and resume steps are in [PROGRESS.md](PROGRESS.md).

**This plan turns the landing page into one scroll sequence.** The page opens on the North workspace taken apart, full screen. Scrolling builds it, still full screen, and you can use it. Scrolling on, the workspace steps back into its place on the page as the docs arrive around it: the side nav, "ZAO is the foundation for how we build.", and then a room of live components and charts.

The story in one line: you see the parts, you watch them become a product, and then the product steps back to show the system that made it.

It publishes nothing: no tokens, props, hooks, dependencies or changesets.

## What this plan is for

Today the hero puts the idea first and the evidence second. You read the headline, then switch a tab to see Parts or Built. The construction, which is ZAO's argument, waits behind a control.

The sequence puts the evidence first and lets scrolling be the switch. It is a hypothesis that this makes the idea land faster. It is not a claim that people will understand ZAO better.

## Decided (Yankun, Nov 3, 2026)

1. **The room moves onto `/`.** The display room is the gallery's live plates, shown on the landing page.
2. **Built is usable.** From the moment the workspace is built, it is the real working window, not a picture of one.
3. **Scene 3 keeps the current copy.** It has the headline, the subline, View on GitHub and the bracket set, with the bracket set placed as on Oct 11 (A). The room of components and charts follows. "Browse components" becomes a scroll-down hint to the room.
4. **Quiet craft first.** No blur, glow, parallax or perspective. Planes, edges and seating only.
5. **Reduced motion is undecided.** See LS10.

## Reference

- The current hero: `apps/docs/components/landing/hero.tsx`, which holds the copy, the Parts/Built tabs, `ExplodedStage` and the depth tools.
- The exploded view: `apps/docs/components/exploded-stage.tsx` and `exploded-stage.css` (finish plan WP 3.1). It already interpolates one number, `--exploded-x`, from built (0) to parts (1).
- The workspace: `showcase.tsx` (`ShowcaseWindow`). It lays out by its own width (container queries), and its View menu already offers Reset example.
- The room: `apps/docs/components/gallery/`, with `plates.tsx` and `chart-plates.tsx`. **This folder is untracked on `charts/wave-2`.** Land the gallery before Phase 3.
- [The landing plan](../2026-10-landing/README.md) (L1–L18, W1) and [the finish plan](../2026-10-finish/README.md) (V9, V10 and its rule 5).

## How to use this plan

1. Read `AGENTS.md` and this file to the end.
2. Run `landing.spec.ts`, `nav-construction.spec.ts` and `components.spec.ts` before the first change, and record the results in a new `PROGRESS.md`.
3. Phase 1 is a spike. Stop and report its findings before building Phase 2.
4. Work one work package (WP) per pull request, and keep `PROGRESS.md` current.
5. When this plan doesn't settle a visual value, stop and ask. Don't choose one.

| Phase | Outcome                                      | Gates          | Depends on |
| ----- | -------------------------------------------- | -------------- | ---------- |
| 1     | The scroll mechanism proven, the shell split | —              | —          |
| 2     | The sequence: Parts → Built → the docs       | LS1–LS7, LS12  | 1          |
| 3     | The room on `/`                              | LS8, LS9, LS11 | gallery    |
| 4     | Reduced motion, phones and short windows     | LS10           | 2          |
| 5     | Tests and records                            | —              | 2–4        |

Phase 3 can run beside Phase 2.

## The sequence (desktop)

The values below are for a 1440 × 900 window and LS3's lean. "Screen" means the viewport below the sticky header.

| Scroll          | Scene             | What you see                                                                                                                                                                                      | What you can do                                                |
| --------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 0               | 1 · Parts         | The workspace's six layers along the depth axis, filling the whole screen on the `bg-sunken` ground, with no site header (LS1, revised). A still "Scroll to build" hint sits at the foot.         | Pick a layer with the pointer or the arrow keys, as today.     |
| 0 → 1.5 screens | 2 · Building      | The layers seat from the ground up: 01 onto 00, then 02, through 05 (LS2). Each tag retires as its layer lands. The drawing then turns flat to face you.                                          | Scroll either way. Every frame reverses.                       |
| 1.5 → 2 screens | 2 · Built         | The working window, whole and flat, scaled to fill the screen (LS4).                                                                                                                              | Use it: approve the requests, switch tabs, open the View menu. |
| 2 → 3 screens   | 3 · Stepping back | The docs page rises from below as ordinary scrolling. The window shrinks into its slot under the copy, uncovering the side nav, the headline, the subline, the actions and the bracket set (LS5). | The window stays usable.                                       |
| 3 screens on    | 3 · The docs      | The window rests at 1:1 in the main column. The pin is gone and the page scrolls normally.                                                                                                        | Everything, as on any docs page.                               |
| Further         | 4 · The room      | The live plates, then Two readers and Explore (LS11).                                                                                                                                             | Point, press, type and tab through the real parts.             |

Only the workspace moves. The nav, the copy and the room arrive by ordinary scrolling, so nothing else needs its own motion.

## Gates

Yankun approved every lean on Nov 3. The alternatives are kept for reference.

| Gate | Question                         | Options                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Lean                                                                                                                                            |
| ---- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| LS1  | What scene 1 shows               | **A:** the site header stays (mark, finish switcher, GitHub). The stage fills the screen below it, and the existing caption cell at its foot reads: "One workspace, built from shared parts: six layers along the depth axis. Scroll to build it." **B:** the header leaves too, and only the ZAO 造 mark floats over the drawing.                                                                                                                                                               | A. The mode switch stays reachable, and the header and nav stay unchanged (L1).                                                                 |
| LS2  | How the layers seat              | **A:** from the ground up, in turn. Each gap closes in order, from 00–01 to 04–05, while the layers above hover at their gaps; the tilt then turns flat. This is a frame raised from its base. **B:** together, as today's Built transition does, scrubbed.                                                                                                                                                                                                                                      | A. It shows the construction order the layer names already state.                                                                               |
| LS3  | Scroll distances and curve       | **A:** assembly over 1.5 screens, Built held for half a screen, and the step back over one screen. The step back is fixed by layout, because it is exactly the docs page rising into view. The assembly and the step back are shaped by `motion.easing.fold-enter`. **B:** assembly over one screen and no hold.                                                                                                                                                                                 | A. It gives Built a moment of its own at full size.                                                                                             |
| LS4  | Built's full-screen size         | **A:** the window keeps its docked layout and is scaled up to fit inside the stage's padding, contained, so the whole window is visible. At 1440 × 900 the width allows up to about 1.24×; a tall window gets less. **B:** fill the width and let the window run below the fold.                                                                                                                                                                                                                 | A. The window never reflows between scenes, so the step back is one continuous object.                                                          |
| LS5  | How the side nav arrives         | **A:** it is uncovered. The docs page rises by ordinary scrolling, and the shrinking window stops covering it. Nothing but the window moves. **B:** the nav slides in from the leading edge as the window shrinks.                                                                                                                                                                                                                                                                               | A. One moving object, and the nav is exactly as on every page.                                                                                  |
| LS6  | Where the window ends            | **A:** it docks under the copy at 1:1, where today's stage sits, and stays usable. **B:** it shrinks and leaves, and the room follows the copy directly.                                                                                                                                                                                                                                                                                                                                         | A. The page keeps one working example, and the docked state is today's tested hero.                                                             |
| LS7  | The "Browse components" hint     | **A:** a quiet text link, "Browse components", with Iconoir's `ArrowDown`, after View on GitHub in the actions row. It moves to the room's heading through a native anchor. View on GitHub stays secondary, so the first screen has no primary action. **B:** the primary Button stays, with its `href` changed to `#components` and an `ArrowDown` icon.                                                                                                                                        | A. A hint reads as a hint, and the seal stays for real actions.                                                                                 |
| LS8  | The room's contents and order    | Thirteen plates: seven components (Button, Switch, Tabs, Menu, Composer, Plan, ApprovalGate) and six charts (Prism bars, Ring, Line, Heatmap, Histogram, Bar). The components wall's Storage ring plate is dropped, because the charts wall has its own. **A:** interleaved, so each row pairs a part with a chart: Button, Ring, Switch, Line, Tabs, Prism bars, Menu, Heatmap, Composer, Histogram, Plan, Bar, ApprovalGate. **B:** components first, then charts, in one wall numbered 01–13. | A. It is the mix Yankun named.                                                                                                                  |
| LS9  | The room's heading and note      | **A:** "Every part, live." with the note "Point, press, type and tab through them. Each plate runs the real component or chart." **B:** Yankun writes it.                                                                                                                                                                                                                                                                                                                                        | A, as a draft for Yankun's copy.                                                                                                                |
| LS10 | Reduced motion                   | **A:** no pin and no scroll-linked motion. The page keeps today's hero: the copy first, then the workspace resting on Parts with the Parts/Built switch, which already switches instantly under reduced motion. The room follows. **B:** the same order as the sequence, as still screens in flow: the Parts drawing, then the Built window, then the docs. **C:** keep the pin and cut between scenes at fixed points, with nothing travelling.                                                 | A. Large scroll-linked scaling and 3D turns are the motion WCAG 2.3.3 (Animation from Interactions) warns about. A is already built and tested. |
| LS11 | Two readers and Explore          | **A:** keep both after the room, unchanged. **B:** keep Two readers and retire Explore, since the nav is now in view.                                                                                                                                                                                                                                                                                                                                                                            | A. Refine what is present before removing it.                                                                                                   |
| LS12 | Phones, narrow and short windows | **A:** below 64rem wide or 40rem tall, use LS10's choice. A tall window scaled to fit a phone screen would be too small to read. **B:** run the pinned sequence at every size.                                                                                                                                                                                                                                                                                                                   | A.                                                                                                                                              |

**LS4 revised (Yankun, Nov 3): fill the width.** The spike showed that the docked stage (1156 × 845 at 1440 × 900) is about the screen's own height, so a contained Built would be 0.91×, smaller than docked. Built instead fills the screen's width inside the stage's padding (1.19× at 1440 × 900), top-aligned below the header, and the bottom of the window, including the Composer, waits below the fold during the hold. The step back shrinks it to 1:1. This replaces LS4's lean (A) with its alternative (B).

**LS1 revised (Yankun, Nov 3, after trying the spike): the header waits too.** Scene 1 opens with no site header: the stage and its ground fill the whole screen, and the header is uncovered with the nav and the copy during the step back. While covered, the header is inert, like the nav and the copy. A still hint at the foot of the first screen, Iconoir's `ArrowDown` with "Scroll to build", leaves once the reader scrolls and returns at the top. This replaces LS1's lean (A) with B, with the mark covered too.

**Picking (Yankun, Nov 3).** In Parts, a picked layer rises and settles on grade 1 (270ms), the drawing's own grade, instead of grade 7: it rises on the enter fold and settles on the exit fold, and the ghosting follows the same curves instead of a linear fade. Inactive layers stay at 50% instead of 22%, so the drawing still reads as one workspace while a layer is picked. The pointer keeps its layer until it is a quarter band past the edge, so a boundary never flickers. This applies to `ExplodedStage` everywhere, including today's hero.

The depth-scale control and the Reset example button leave the landing on desktop. Depth stays on Foundations → Depth, and Reset example stays in the window's View menu. The fallback (LS10 A) keeps both, as today.

## Approvals this plan changes

| Approval                                                                     | What changes                                                                                                                                        | Gate      |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| L1: the docs sidebar stays; header and nav unchanged                         | Both are unchanged. On desktop the landing opens with the workspace covering the screen, and the nav is uncovered in scene 3.                       | LS1, LS5  |
| Oct 11 (A): the copy at the top, the bracket set beside the headline         | The copy and the bracket set are unchanged, but on desktop they arrive after the sequence. The fallback keeps them first.                           | LS6, LS10 |
| Finish plan V9 and V10: the hero rests on Parts; Parts/Built tabs            | Parts is still the rest. On desktop, scrolling replaces the tabs; the fallback keeps them.                                                          | LS2, LS10 |
| This plan's rule 1, Nov 3: every scene reverses                              | Until the window docks. After that the sequence is done for the session, and the docs' top is the page's top.                                       | —         |
| Finish plan rule 5: "no autoplay, no load-in sequence, no scroll hijacking"  | Scroll-linked motion is allowed, because scrolling is a person's action. Scroll hijacking stays forbidden; see rule 1 below. Nothing plays on load. | —         |
| L12 A: the hero actions are links; "Browse components" is the primary Button | "Browse components" becomes an in-page hint to the room.                                                                                            | LS7       |
| Landing order: hero → readers → explore                                      | Hero → room → readers → explore.                                                                                                                    | LS8, LS11 |
| The gallery (Oct 31): `/gallery` unlinked until Yankun decides               | Its plates join `/`. `/gallery` and `/gallery/charts` stay, unlinked, for the recorder.                                                             | LS8       |

Everything else in those approvals stands.

## Rules for every work package

These add to `AGENTS.md` and the finish plan's rules. Where they disagree, `AGENTS.md` wins and you say so in the PR.

1. **Scroll-linked, never scroll-jacked.** Native scrolling drives everything. Never intercept wheel, touch or keys, never call `preventDefault` on them, and never add scroll snapping or a smooth-scroll library. Never set the scroll position, except for a native anchor the person activates or to keep the reader's place when the layout changes under them (a mode switch, a resize, the collapse at the dock). Every scene reverses when you scroll back, until the window docks. **One-time (Yankun, Nov 3):** once the window docks, the sequence is done for the tab's session. The spacer goes and the scroll moves back by its height in the same frame, so nothing visibly moves and the docs' top becomes the page's real top. Reloading in the same tab, or coming back to `/` through the logo or Back, opens on the docs; a new tab plays it again.
2. **One object moves.** The workspace, and its layer copies while they show, are the only things that change with scroll. No parallax, no fading text, no blur, no glow and no perspective: the drawing keeps today's orthographic tilt.
3. **Motion from rules.** Scroll position maps to progress through the fold curve (LS3). Never type a curve or a duration. Discrete swaps, such as copies to the live window, happen at a frame where nothing visibly changes.
4. **Layout never moves.** The slot reserves the window's box from first paint, and the scenes are paint over it. Cumulative layout shift stays 0.
5. **Nothing plays on its own.** Scene 1 is a resting composition at scroll 0. A reload or a back navigation at any scroll position renders that position's scene before first paint, without animating to it.
6. **Usable when built.** While copies show, the live window is inert and hidden, as today. From the end of the assembly it is the real window, at any scale.
7. **Focus never lands on something hidden.** The DOM keeps the docs reading order: nav, copy, window, room. Focus moving into the docs scrolls natively, which advances the sequence to the docked state. Picking layers works only at scene 1's rest.
8. **Smooth on ordinary hardware.** Hold 60 frames a second on a mid-range laptop in Chromium, WebKit and Firefox. Write transforms to the few moving elements; never change an inherited custom property on the window's subtree per frame. The fixed stage must never jitter against scrolling.
9. **Access.** Reduced motion and phones follow LS10 and LS12, and switching either preference mid-page keeps the reader's place. Also cover forced colors; RTL (the nav is on the leading edge); keyboard; touch; Su light and dark; and 320px with no horizontal scroll.
10. **Docs-local.** Everything lives in `apps/docs`. No tokens, dependencies, published props or changesets.
11. **Copy.** Sentence case, and a link says where it goes.

## Phase 1: Mechanism and shell

### WP 1.1 Spike

**The question:** can a fixed, full-screen stage scrub the exploded drawing and then hand over to a slot in the page, without jitter, on all three engines?

Build a throwaway route that has a spacer, a fixed stage running today's `ExplodedStage` at full screen, and a slot further down. Try both mechanisms:

- **CSS scroll-driven animations** (`view-timeline` on the spacer and the slot, `animation-range`), which run on the compositor.
- **A passive `requestAnimationFrame` reader** that writes transforms directly.

Measure frame times with a performance trace at 1440 × 900 and at 1280 × 720. Record the support, the jitter, the frame times and the choice in `PROGRESS.md`. If neither holds rule 8, stop and report.

### WP 1.2 The shell

The sequence's spacer must come before the docs grid, or the nav would scroll away during the pin. **Spike finding (Nov 3):** the grid is also held still under the window until it docks, with a linear scroll-linked translate on the same scroll timeline. Without the hold, the docs page scrolls up under the window: the top half of the screen goes empty and the copy stays covered until the last frame.

- Move the grid (the aside with `Nav`, and `main`) from `app/layout.tsx` into `app/(docs)/layout.tsx`, using a shared `DocsGrid` component, and move every docs route into the group. URLs don't change.
- The root layout keeps `html`, `body`, the header, the finish script and the footer.
- `app/page.tsx` renders the sequence, then the same `DocsGrid`.
- Every existing route, test and the static export must stay exactly as they are.

## Phase 2: The sequence

### WP 2.1 `ExplodedStage` takes a progress

Add a `progress` input (1 = parts, 0 = built) beside `pose`, and keep the `pose` path unchanged for the fallback.

- **Seating (LS2).** Each layer's depth comes from its own span of the progress.
- **Tags.** Each layer's tag retires as its layer lands.
- **Picking.** It works only at progress 1, and stops as soon as the progress moves.
- **The swap.** The copies give way to the live window at progress 0, and come back the moment the progress rises above 0. Both happen in the same frame. Today's path waits for the assembly's transition to end, and with that transition removed it falls back to a 670ms timer; in the spike the overlay and focus copies stayed visible over Built for that long. Keep the copies alive between swaps and re-snapshot only when the live window has changed, because the swap frames ran up to about 50ms in headless Chromium.

### WP 2.2 `LandingSequence`

- **The spacer.** An empty, `aria-hidden` block sized for the assembly, the hold and the step back (LS3).
- **The mechanism (spike, Nov 3).** Every scroll-linked transform runs on the root `ScrollTimeline` through the Web Animations API, and none is written per frame from script. A passive reader only switches discrete state, such as the copies and the live window. The `requestAnimationFrame` path is a fallback only where `ScrollTimeline` is missing.
- **The stage.** It stays in its slot. A scroll-linked translate holds it below the header during scenes 1 and 2, on a full-screen `bg-sunken` ground with the character field. That ground is its own backdrop, because the stage's box covers only its fit. The fit is recomputed for the full screen (LS1, LS4).
- **The step back (LS5, LS6).** The docs grid is held still (WP 1.2), so the stage interpolates from the screen to its slot's final rect while the nav and the copy sit still around it. From then on the window is static in the slot, with no transform, and the page scrolls normally.
- **Covered content.** The nav and the copy are inert while the window covers them, and become focusable as it docks (rule 7).
- **The caption.** The caption cell names each scene at its rest. Live updates are announced only at rests, never per frame.
- **Resize, mode and font loading.** Each one re-fits the stage without a jump.

### WP 2.3 Scene 3's copy

- The headline, the subline, View on GitHub and the bracket set, unchanged in content and placement (Oct 11, A).
- The "Browse components" hint (LS7), which points to the room's heading (`id="components"`).
- The Parts/Built tabs, the depth-scale control and the Reset example button render only in the fallback.

## Phase 3: The room

### WP 3.1 Plates on `/`

- Move `Plate` and the plate definitions into a shared module used by both `/gallery` and the landing.
- The room is a `data-landing-section="room"` section with an `h2` (LS9) and one wall in LS8's order, on the landing sheet's rails and rules.
- Chart plates arrive as their drawing when they come into view, as they do today.
- `/gallery` and the recorder keep working (`?plate=<id>&record`), and the GIFs need no re-recording.

### WP 3.2 Order

Make the sections hero, room, readers, explore (LS11).

## Phase 4: Fallbacks

### WP 4.1 Reduced motion, phones and short windows (LS10, LS12)

- Below the thresholds, or under `prefers-reduced-motion: reduce`, render the fallback: today's hero with its tabs and tools, then the room, readers and explore. There is no spacer and no fixed stage.
- Switching between the sequence and the fallback mid-page keeps the reader near the same content.

## Phase 5: Tests and records

### WP 5.1 Tests

Update `landing.spec.ts`, keeping every assertion that still describes the page:

- the section order
- the hint replacing the primary "Browse components" link
- the Parts rest
- the depth control, which now lives in the fallback only

Add `landing-sequence.spec.ts` at 1440 × 900 and 1280 × 720, in Su light and dark:

- **Checkpoints.** At Parts, mid-assembly, Built, mid-step-back and docked, check the pose, each layer's depth, which tags show, and whether the live window is inert.
- **The nav.** It is covered at scroll 0 and uncovered when docked, checked with `elementFromPoint`.
- **Built is usable.** Approving the waiting requests works at full scale, and the Menu popup stays attached to its trigger.
- **No hijacking.** Wheel and key events are never `defaultPrevented`, and the scroll position after a wheel step equals the native distance.
- **Reversal and reload.** Scrolling back returns to Parts. A reload at each checkpoint renders that scene with no running animation.
- **Layout.** Layout shift is 0 across the whole sequence.
- **Focus.** Tabbing into the nav or the copy from scene 1 ends in the docked state with focus visible.
- **Fallbacks.** Under reduced motion, at 375px and at 1280 × 600, there is no spacer and the Parts/Built tabs work.
- **Every scene.** axe finds no violations, forced colors draw the structure, RTL works, and there is no horizontal scroll at 320px.

Don't weaken an existing assertion.

### WP 5.2 Records

- Mark the landing plan's L1, the Oct 11 (A) placement and L12 as changed by this plan.
- Add `PLAN.md` "Current work" and `AGENTS.md` entries once Yankun approves, naming the gates' outcomes.
- Draft a decision-log row for `BRIEF.md`. Yankun adds decision-log rows himself.
- Keep `PROGRESS.md` current at every merged WP.

## Definition of done

- `pnpm build && pnpm test && pnpm typecheck && pnpm format:check` pass, and the docs build and static export succeed.
- A screen recording of the full sequence in Su light and dark at 1440 × 900, scrolling down and back up.
- Screenshots of each scene, of the fallback at 375px and of the fallback under reduced motion.
- A performance trace from WP 1.1's method on the finished page, within rule 8.
- No new tokens, dependencies, published props or changesets.

## Not in scope

- Changes to the header, the nav, or the docs pages' own layout.
- New components, WebGL, canvas rendering, sound, or animation libraries.
- Changes to the workspace's content, or to the bracket set's interaction (L14, L17).
- Section overviews (L4), the L13 caption and a published `type-hero` role.
- Yu.
