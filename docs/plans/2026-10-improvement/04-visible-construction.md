# Phase 4: visible construction

_Part of the [ZAO improvement plan](README.md). Read that file first: its rules, definition of done and option-sheet format apply here._

## Goal

A first-time visitor to the docs can see how ZAO's components are constructed, in one place, without the working interface becoming louder.

## Why

The direction is "the boundary between 2D and 3D", and at normal size the evidence for it is a 1px edge (F1). The construction is described in long paragraphs and shown only in three small nav figures (F15), which are the most recognizable thing on the site. Yingzao Fashi is a book of drawings (图样) and of standard part names (释名); ZAO uses neither idea yet.

The answer is one clear demonstration, with the everyday components left as quiet as they are. "Care for every detail; keep the number of details small" still applies.

## Depends on

Phase 1. The figures and the toggle read the depth and side-tone tokens, so they stay true when values change.

## Read first

- `apps/docs/components/figures/`: the existing figure language, shared by the nav and the landing page.
- `explorations/snapshots/private/landing-options-20261009/retired/anatomy-figure.tsx` (local, gitignored): context from the Button anatomy retired from the landing page on Oct 10 (L16). Its manual geometry and detached label treatment are retired; WP 4.2 reads the real component instead.
- `explorations/favicon-options/linework-prompts.md`: how the linework was described before.
- The `data-zao-slot` values across `packages/react/src/components/`.

## WP 4.1: Part names (释名)

**No gate for the audit. ⛔ for any rename, since slots are public styling hooks.**

**Completed Oct 11.** The source audit found 71 slot names and 15 component markers, all static literals. [Parts](../../parts.md) defines each role and its source authors, documents inherited Button hooks, and distinguishes construction concepts from literal DOM slots. Shared broad names require component ownership; no rename is proposed. Foundations → Parts renders that file directly. The source contract checks exact names and owners, rejects dynamic hook names, and catches an unlisted fixture without mistaking comments or CSS selectors for attributes. The six focused catalog/page cases pass in Su light and dark at 1440px and 480px, with RTL overflow, keyboard scroll-region focus, and axe checks. The audit and source locations remain in `explorations/snapshots/private/parts-audit-20261011/`.

All six cases also pass in the fresh complete 576-case browser run. Package build, static docs export, lab build, typecheck, formatting and diff checks pass; the final logs and scoped correction evidence are retained in `explorations/snapshots/private/continuation-review-20261011/`.

**Build**

1. List every `data-zao-slot` and `data-zao-component` value, the component that uses it, and what the part does.
2. Compare the list with the words in the README's glossary (face, side, base, contact edge, joint). Flag parts that are the same thing under different names, and names that mean different things in different components. For example, Button and Switch both have a `face`; Menu has a `reveal-edge`; Tabs has `rail`, `tick` and `selection-line`.
3. Write `docs/parts.md`: one table of part names, each with a one-line definition and the components that have it.
4. Propose renames as a list and stop. Renaming a slot is a breaking change for anyone styling by hook, including the study CSS and the e2e specs.

**Acceptance**

- Every slot in the source appears in `docs/parts.md`, and a test fails when a component uses a slot name that is not listed.
- The docs gain a Foundations → Parts page rendered from that file.

## WP 4.2: Anatomy figure

**Gate: D13 passed Oct 11 — A approved.** The two other drawings remain unselected studies.

**Approved A; implemented and verified.** Yankun selected A from [the three private drawings](http://127.0.0.1:3254/), generated from one measured current secondary Button. The docs-only `Anatomy` defaults are 18× measured contact separation, 0° rigid 2D rotation and 1× measured hairline. Keep the square face and level label in one plane, the continuous joined side, fixed base and dashed named native-target reference; preserve existing semantic face, ink, edge and side paint. B's 20° rotation and C's 8× contact / 1.5× stroke remain unselected. The private source, exact prop JSON and review evidence are in `explorations/snapshots/private/button-anatomy-options-20261011/`. This resolves the drawing-style decision and authorizes the docs-only implementation below; it changes no published tokens, hooks, API or component interactions. [The decision draft](decision-drafts/anatomy-screen-axis-a.md) is ready for the BRIEF owner.

**Private proof complete:** All 12 figures across 1440px/480px and Su light/dark preserve measured geometry and semantic paint, contained annotations, visible part alternatives and fixed native geometry during depth changes. Additional narrow RTL, keyboard, reduced-motion and forced-color probes pass. Six axe scans report zero violations, with 16 contrast-incomplete nodes per scan retained; this is not a complete automated contrast proof. Source hashes, raw results, initial defects and final cleared captures remain with the review. B is a rigid 2D drawing rotation, not a new physical projection or component transform.

**Build**

- A docs-only `Anatomy` component that draws one ZAO component as an exploded view: its parts separated along the axis and labeled with the names from WP 4.1.
- The figure is generated, not illustrated by hand: part sizes come from the component's real geometry, offsets from the depth tokens, tones from semantic colors and the side-tone rule. It is inline SVG, with a text alternative that lists the parts in order.
- Parameters such as explode distance, projection angle and stroke weight are props. For the option sheet, vary them to produce two or three candidates in the linework language of the nav figures, in Su light and dark.

**Build, after the gate**

- Fix A's approved 18× / 0° / 1× style as the docs-only component's defaults. Generate distances from the measured contact/axis and strokes from the existing structural hairline; keep the reading part of its face.
- Add figures for Button, Card, Menu (with its joint), Switch, secondary Tabs, a field, and Progress. Place each at the top of its component page.

**Implementation proof, Oct 11:** Seven measured figures now appear before their working previews. Actual component specimens run in hidden, inert same-origin iframe documents with their own JavaScript realm, protecting parent focus, scrolling and modal behavior. Geometry, readings and semantic paint come from those specimens; explanatory separation reads existing depth tokens. Card's contact shadow, Menu's collision-resolved joint, the field perimeter and Progress end paint are identified without inventing physical bases. All 74 Anatomy cases pass in the fresh complete 650-case browser run. Package build, static docs export, lab build, typecheck, formatting and diff checks pass. The coverage includes measured drawing and ordered alternatives, local depth changes, 1440px/480px Su light/dark layouts, narrow RTL, reduced motion, forced colors and Menu/modal isolation. Implementation evidence is in `explorations/snapshots/private/anatomy-implementation-20261011/`; the earlier private comparison proof remains separate.

**Acceptance**

- Changing a depth token changes every figure without editing a figure.
- Each figure has an accessible name and a text alternative, passes axe, and holds its layout at 480px wide.
- No figure uses a color, distance or stroke that is not a token or a prop default approved at the gate.

## WP 4.3: A construction toggle on the landing workspace

**Skipped Oct 11 by Yankun.** The finish plan's new Parts/Built overview showcase and workspace depth control supersede this review. Do not implement the old toggle or reopen its wording, initial-state or depth choices. The private files remain historical evidence. WP 5.1's Button spec and template may proceed to D14; WP 4.4's thesis copy gate remains open.

**Archived private review.** The review at port 3262 uses a private copy of the earlier landing `Showcase`, preserving its 11 components, sample data and local actions. It compared A “Show construction”, B “Show component parts” and C “Inspect assembly”, Off or On as the initial state, and 2×, 3× or 4× contact/lift scaling. Off used the then-published 1px contact / 2px lift. The initial A / Off / 3× combination was a review setting, not an approved default. Source hashes, captures, measurements and recordings remain in `explorations/snapshots/private/construction-toggle-options-20261011/`.

**Private preparation evidence:** Native targets and layout boxes remain fixed in 18 depth contexts; normalized off and return-off workspace crops match the current source in four viewport/theme contexts. Pointer, Space, Enter, focus and immediate reduced-motion paths are covered. Ten normal/RTL axe scans report zero violations, with contrast-incomplete findings retained. Supplemental forced-color evidence has an unresolved axe/computed-paint discrepancy. The existing landing View Menu's narrow, wrapped popup is preserved and limits that example's readability. This proof prepares the review; it does not complete the canonical toggle implementation.

**Historical build scope (skipped)**

- Add one visibly labeled toggle button with a stable label and pressed state for the landing workspace. Keep wording, initial state and depth unresolved until Yankun chooses.
- Change depth only on the workspace island and show measured, owner-qualified part labels. Reuse actual slots and CSS paint; components without spatial depth retain their reading geometry. Store nothing.
- Entering and leaving use the existing Lift role tokens. Reduced motion switches immediately.
- Present the private wording, starting-state and depth alternatives, then stop for Yankun's choice.

**Historical acceptance (skipped)**

- With the toggle off, the workspace's component paint and geometry match the source. Compare workspace crops at the same document origin; added controls and review chrome are outside that pixel-parity claim.
- With it on, the workspace's existing components receive truthful part labels, quantitative spans remain accurate, and native targets and layout boxes stay fixed.
- Canonical implementation includes pointer, keyboard and reduced-motion coverage. Private review probes are preparation evidence, not completion of that implementation.

## WP 4.4: One sentence that joins the two theses

**Gate:** ⛔. The thesis is Yankun's position; agents draft, he writes.

**Build**

`BRIEF.md` argues that agents need a small choice space with reasons, and separately that ZAO explores constructed depth (F18). The construction grammar is an example of the first claim: a few depth values, one axis, one side-tone rule and four motions are things an agent can follow and a validator can check.

Draft three versions of a two-sentence statement that connects them, for the overview hero and the top of `BRIEF.md`. Stop for Yankun's edit. Do not change the hero or the brief until he returns the text.

**Acceptance:** the approved text appears in the overview and in `BRIEF.md`, and nowhere else is it paraphrased.

## Out of scope

- Depth changes to the working components. Visibility comes from the figures and the toggle, not from heavier edges.
- Scroll-driven animation, 3D transforms on real components, WebGL.
- Illustrations that are not generated from tokens.
- Marketing pages.
