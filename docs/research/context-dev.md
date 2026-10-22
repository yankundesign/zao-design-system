# context.dev: one mark, product stories

Research, Oct 21, 2026. Yankun asked what ZAO can learn from [context.dev](https://www.context.dev) for the website, component design, motion and visuals. Nothing is decided. Every proposal below that touches the landing, a component's API, motion values or tokens needs its own go-ahead.

Measured in the browser at 1280×800: a light page in one blue, Rethink Sans for text and Doto (a dot-matrix face) for data, 52 canvases, about 200 SVGs and 64 running animations on load.

## What the site does well

1. **One mark draws everything.** The dot is the unit of every figure: the hero field, the feature illustrations (canvas), the icons (SVG circles), the free-credits numerals, the blog covers and the footer wordmark. Filled and hollow dots carry state. Fifty figures read as one hand because they share the mark and the pitch.
2. **Figures tell the product's story.** Each feature card plays a short input → output sequence. A question is typed into a speech bubble, which becomes JSON braces with fields. A bell sits beside a "change detected" slip showing a price change. A URL frame fills with a page skeleton. The figure explains the API before the copy does.
3. **A trace instead of an adjective.** Reliability is shown as a request log: a time gutter (0.0s to 2.4s), a filled or hollow state dot, the step, a right-aligned reading (403, automatic, 200), and a summary row with total time and cost.
4. **The page is one ruled sheet.** Two rails run the page's full height. Every section boundary is a full-width rule that meets the rails at a small registration dot.
5. **Frame in frame.** Feature cards nest three levels: a 7px tinted mat, a white face with an 8% ring, and an inset tinted well holding the figure, whose edge is drawn in dots.
6. **Motion by mark, staggered from geometry.** Each SVG dot carries `--dot-delay`. Hover and `:focus-visible` start the same sweep (scale 1.45, opacity 0.55, 1.4s). Active job glyphs pop in over 240ms on `cubic-bezier(.22, 1, .36, 1)`.
7. **Protections are specific.** Reduced motion redefines the keyframes to opacity only instead of deleting them. The footer pointer effect is removed for reduced motion, narrow screens and coarse pointers. Hover animation is gated by `(hover: hover) and (pointer: fine)`.
8. **The product is the hero.** A working search box with modes sits directly under the calls to action; its placeholder types example queries.

## What not to take

- **One color on everything.** Headline words, cards, icons, figures, links and buttons share the same blue, so it no longer marks anything. ZAO's seal rule (primary action, current selection, focus, approved impression) is stronger; keep it. Two-tone headlines would also put the seal on copy.
- **Tabs that grow.** The selected hero tab lengthens its label (Search → Search Web), and its neighbors shift. ZAO keeps labels, targets and layout stationary.
- **Idle loops.** Many glyphs wave forever and figures loop while in view. Together they compete for attention and keep 52 canvases running. ZAO moves from data or from the reader.
- **Pointer distortion on the footer wordmark.** The cursor-spotlight family that [the craft research](visual-craft.md#avoid) already lists under Avoid.

## Where ZAO already stands

- The character field (a 3-fen lattice of `·` with `+` at every fourth mark) is the same idea as context.dev's dot field, and it is already quieter and follows the mode.
- Explore tiles and the bracket set lift by course on hover and on keyboard focus, the same parity as context.dev's glyph sweep.
- The storage ring already draws one mark per datum.
- `docs-rule-capped` already ends rules in `+` marks, but only inside content, not as the page's frame.
- Plan already has a rail, a fill and a written status per step, and a "Finished" summary.

## Proposals

### Website

- **W1. Rule the landing as one sheet (版框 and 界行).** Draw the main column as a frame: two rails the height of the page, and each section boundary a full-width hairline meeting the rails at a `+` mark. Today the Two readers and Explore sections rest on the canvas with only a heading and tile top rules. Reuses `stroke.hairline`, `border-subtle` and the docs `+` mark. (§4) **Kept Oct 21**; see the [landing plan](../plans/2026-10-landing/README.md#progress-oct-21-the-sheet-w1-kept).
- **W2. A story plate per component family.** After the hero, the landing shows one card and three line figures; context.dev shows every capability working. Each plate is a small live specimen with one before → after: ApprovalGate waiting → approved with the seal impression; Composer typed → sent as a slip; Plan steps arriving on the rail; Table drawing → built. It plays once on entering view and replays on hover or focus; reduced motion shows the end state. Needs the L4 section decision. (§2)
- **W3. Show the agent reader as a trace.** The "For agents" column could show a manifest lookup or validator run as rows: step gutter, Table status B glyph, the rule, and a right-aligned `figures-tabular` reading, closed by a summary row. (§3)

### Components

- **C1. Plan readings.** An optional right-aligned reading per step (elapsed time or result count) in `figures-tabular`, with the existing summary row gaining a total. This adds a public prop, so it needs its own decision. (§3)
- **C2. Wells drawn on the lattice.** The Card `drawing` state and the recessed data region could draw their well edge as fen-pitch marks, the "guide" line type from the craft research, instead of a solid rule. (§5)

### Motion

- **M1. Stagger from geometry.** Give each mark a delay from its position along the assembly axis (frame, then rules, then marks), as a fraction of a grade on the fold curves, with the whole sweep within grade 8. Candidates: the drawing → built loading transition, the storage ring's first reading and the Explore figures. Extends the existing `--course` pattern. (§6)
- **M2. Play once, replay on intent.** No idle loops. A figure plays when it first enters view, or not at all, and replays on hover or focus. Write it beside "motion only from data" so new figures follow it.

### Visuals

- **V1. One mark, one pitch, two hands.** Today ZAO's figures mix hairline outlines (bracket set, section figures), the `·` and `+` field, the fen ruler and the ring's marks. Following 界画 (ruled lines for built parts, a softer hand for ground), make the split a rule: hairline outlines for built parts; fen-lattice marks for ground, data, empty states and drawing states. context.dev's figures read as one because every one shares a mark and pitch. (§1)

## Found in passing

The landing logs six React duplicate-key errors: `bracket-set.tsx` keys parts by name, and courses 2 and 4 both create "Small block (散斗)" left, centre and right.

## Sources

- context.dev: https://www.context.dev
- Doto: https://fonts.google.com/specimen/Doto
- Rethink Sans: https://fonts.google.com/specimen/Rethink+Sans
