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

- `apps/docs/components/nav-section-figure.tsx`: the existing figure language.
- `apps/docs/components/overview-exhibition.tsx`: the overview page.
- `explorations/favicon-options/linework-prompts.md`: how the linework was described before.
- The `data-zao-slot` values across `packages/react/src/components/`.

## WP 4.1: Part names (释名)

**No gate for the audit. ⛔ for any rename, since slots are public styling hooks.**

**Build**

1. List every `data-zao-slot` and `data-zao-component` value, the component that uses it, and what the part does.
2. Compare the list with the words in the README's glossary (face, side, base, contact edge, joint). Flag parts that are the same thing under different names, and names that mean different things in different components. For example, Button and Switch both have a `face`; Menu has a `reveal-edge`; Tabs has `rail`, `tick` and `selection-line`.
3. Write `docs/parts.md`: one table of part names, each with a one-line definition and the components that have it.
4. Propose renames as a list and stop. Renaming a slot is a breaking change for anyone styling by hook, including the study CSS and the e2e specs.

**Acceptance**

- Every slot in the source appears in `docs/parts.md`, and a test fails when a component uses a slot name that is not listed.
- The docs gain a Foundations → Parts page rendered from that file.

## WP 4.2: Anatomy figure

**Gate:** ⛔ D13. Build the Button figure in two or three styles, then stop.

**Build**

- A docs-only `Anatomy` component that draws one ZAO component as an exploded view: its parts separated along the axis and labeled with the names from WP 4.1.
- The figure is generated, not illustrated by hand: part sizes come from the component's real geometry, offsets from the depth tokens, tones from semantic colors and the side-tone rule. It is inline SVG, with a text alternative that lists the parts in order.
- Parameters such as explode distance, projection angle and stroke weight are props. For the option sheet, vary them to produce two or three candidates in the linework language of the nav figures, in Su light and dark.

**Build, after the gate**

- Fix the approved style as the component's defaults.
- Add figures for Button, Card, Menu (with its joint), Switch, secondary Tabs, a field, and Progress. Place each at the top of its component page.

**Acceptance**

- Changing a depth token changes every figure without editing a figure.
- Each figure has an accessible name and a text alternative, passes axe, and holds its layout at 480px wide.
- No figure uses a color, distance or stroke that is not a token or a prop default approved at the gate.

## WP 4.3: A construction toggle on the overview

**Gate:** ⛔ on the wording, the default state and the depth value the toggle uses. The mechanism needs no gate.

**Build**

- On the overview exhibition, add one control, off by default, that shows the construction of the components already on that page: it raises the depth tokens on the exhibition island and shows part labels beside each component. Build it with the depth value as one variable so Yankun can set it.
- It is a real toggle button with a visible label and pressed state. It changes nothing outside the island and stores nothing.
- Entering and leaving uses the Lift motion and its role tokens. Reduced motion switches at once.
- Prepare three candidate labels for the control and one line of supporting copy, following the copy rules in `AGENTS.md`. Show the exhibition at two or three depth values. Stop for Yankun's choice.

**Acceptance**

- With the toggle off, the overview is pixel-identical to today's.
- With it on, every component in the exhibition shows its parts, and no layout box moves.
- A spec covers pointer, keyboard, and reduced motion.

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
