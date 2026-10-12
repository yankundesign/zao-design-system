# ZAO finish plan: visual and motion, October 2026

_For coding agents working in `yankundesign/zao-design-system`. Written Oct 11, 2026, from the finish sketches canvas and Yankun's review of it. Owner and decision-maker: Yankun._

**Status: proposed.** Nothing here is in scope until Yankun adds it to "Current work" in `PLAN.md`. It reopens several approved decisions, listed below; until a gate is passed, the existing approval holds. If you were not pointed here by Yankun or by `PLAN.md`, stop and ask.

A companion plan for new components comes separately. **This plan adds no component.**

## What this plan is for

People reading the Oct 11 docs build see wireframes. The cause is the finish, not the number of components: a mid-gray primary, one 1px outline on every surface, a 2px lift in 80ms that barely registers, outline-only figures, and one easing curve for everything. More components in the same finish would look like wireframes too.

The plan turns one idea into the finish: **drawn, then built (图 → 造).** Every part has a drawing and a built object. The built state must read as unmistakably solid, so the linework can become a deliberate state (loading, inspecting, removed) instead of the default look.

Four outcomes:

1. **Material.** Lifted parts show two-step side planes (叠晕), one faceted corner (卷杀) and recessed wells. Depth is drawn, never blurred.
2. **One seal.** Su gets exactly one color, used only for the primary action, the current selection and focus. Everything else is ink.
3. **Motion from rules.** The easing comes from the Song roof-fold rule (举折) and durations come from timber grades (材分八等), not hand-picked values.
4. **Show the parts.** The exploded view becomes the overview's hero moment.

## Reference

The [finish sketches canvas](https://claude.ai/artifact/4UUmhUi1JrLR1KtSLbLRpy) holds six interactive boards: 01 Material, 02 Ink and seal, 03 Drawn then built, 04 举折 curve and 材 grades, 05 Exploded view, 06 Overview hero. Every value on it is agent-made. Treat it as the reference for intent; the values below are starting points for option sheets, not approvals. If you cannot open the canvas, this file is complete without it.

Yankun's review, Oct 11: "I love the direction." Two changes were made on the canvas: the bottom side plane was toned down to sit with the left plane, because a darker bottom read as a shadow falling away from the part; and Vermilion was removed from the seal options, because it reads as a critical or error red.

## How to use this plan

1. Read `AGENTS.md`, then the direction section of `BRIEF.md`.
2. Read this file to the end.
3. Do one work package (WP) per pull request.
4. Stop at every ⛔ gate and wait for Yankun. Build the option sheet the gate names, following the option-sheet rules in `docs/plans/2026-10-improvement/README.md`.

| Phase | Outcome                     | Boards | Depends on                                      |
| ----- | --------------------------- | ------ | ----------------------------------------------- |
| 1     | Material and the seal       | 01, 02 | —                                               |
| 2     | Motion from rules           | 03, 04 | WP 1.3 for drawn → built; otherwise independent |
| 3     | Show the parts as the hero  | 05, 06 | WP 1.3, WP 2.1, WP 2.2                          |
| 4     | Verify, document and record | all    | Each phase's last WP                            |

Phases 1 and 2 can run in parallel.

## Approvals this plan reopens

Each row stays as approved until its gate is passed.

| Approval                                              | What would change                                                      | Gate    |
| ----------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| DV2, accent-solid stays Su gray                       | The seal replaces the gray accent                                      | V1      |
| D3 side tone A, and the Oct 8–9 dark side refinements | One shade becomes two bands per plane; dark sides become lighter bands | V2      |
| Button Oct 6–7: 1px contact at rest, 2px hover lift   | A visible rest pose and a larger lift                                  | V3      |
| D4 radius: action 0px, square Card                    | One faceted corner on lifted faces                                     | V4      |
| D11 motion values: 80/160ms, one curve                | The 举折 curves and grade durations                                    | V5, V6  |
| Type rule: display face only in display and title     | Su's display face becomes Newsreader; whether Card titles use it       | V7      |
| D7 Dialog: instant entry and exit                     | Only if V8 extends drawn → built to Dialog                             | V8      |
| Landing L2, L5, L14, L15, L17, and the motion rules   | The exploded workspace becomes the hero; the bracket set moves         | V9, V10 |
| "Outside focus outline" in every component approval   | Focus arrives as four corner brackets, still outside and stationary    | V12     |

## Rules for every work package

These add to `AGENTS.md` and to the improvement plan's rules. Where they disagree, `AGENTS.md` wins and you say so in the PR.

1. **Visual decisions belong to Yankun.** Never choose a color, tone, distance, duration, curve, radius or drawing style. Build an option sheet and stop.
2. **Depth is drawn, never blurred.** No blurred `box-shadow`, no `filter: drop-shadow`, no soft gradients. Planes and wells use flat fills or hard-stop bands.
3. **One seal per screen.** The seal color appears only on the primary action, the current selection and focus. Status, data and decoration never use it.
4. **Motion comes from rules.** Durations come from a part's grade and curves from the 举折 tokens. Never type a millisecond value or a curve into a component.
5. **Nothing plays on its own.** Keep the landing rule: no autoplay, no load-in sequence, no scroll hijacking. Motion answers a person's action.
6. **Layout never moves.** Planes, facets, lifts and exploded layers are paint. Native hit areas, focus targets, borders' layout boxes and neighbors stay fixed.
7. **Access is part of the construction.** Keep keyboard support, reduced motion (end states, no travel), reduced transparency, forced colors (planes drop to system colors or disappear; borders stay) and RTL.
8. **Colors come from the generator.** Change `palette.config.ts` or the mode mapping. Never hand-pick a hex value, including in planes.

## Phase 1: Material and the seal

### WP 1.1 The seal ⛔ V1, V1c

**Finding.** The docs primary renders `#696969`: `accent-solid` maps to the generated accent step 9 at 52% lightness. Quiet instrument's `#292929` never reaches Button. This mid gray is the strongest wireframe signal on the site.

1. Build an option sheet with the three seal options on real components in Su light and dark: primary Button, selected Tabs line, a selected list row's check, focus, Progress fill, Switch on.
   - **Ink 墨.** No hue; the primary becomes full-strength ink.
   - **Red ochre 丹.** The earth red of 丹粉刷饰, the plainest painted grade.
   - **Azurite 青.** The mineral blue of 碾玉装 and the 青绿 grades.
   - Report text contrast on the seal and the seal against canvas and surface in both modes.
2. After V1, express the seal through `palette.config.ts` (an accent hue and chroma, or achromatic for Ink) and the mode mapping. Rename nothing public without a decision; `accent-solid` can carry the seal.
3. Audit every use of the accent roles. Anything that is not the primary action, the current selection or focus moves to ink roles.
4. V1c decides whether focus uses the seal or stays ink.

Canvas starting values (agent-made): Ink uses the neutral ink; Red ochre `#8E4630` light, `#D39176` dark; Azurite `#2B4C84` light, `#93B0E3` dark. Text contrast on each is 6.8:1 or better.

### WP 1.2 Warm ink neutrals ⛔ V1b

Option sheet: today's pure gray beside a warm ink scale named for the five ink tones (焦 burnt, 浓 thick, 重 heavy, 淡 light, 清 clear), generated with a small warm hue and low chroma. Light reads as paper, dark as ink stone. Report every contrast promise in the mode files. Implement only through the generator.

### WP 1.3 Stepped side planes (叠晕) ⛔ V2

Replace the single `construction-shading` side with two planes, each drawn in two flat bands.

- **Geometry.** Two pseudo-elements on the base. The left plane joins the face's left edge to the base's left edge; the bottom plane joins the bottom edges. Each is a `clip-path` polygon built from `--zao-depth-*` and the axis tokens, with a hard-stop gradient sized to the depth, so the bands stay parallel to the face edges at every pose. The canvas's `.ex` recipe is the reference implementation.
- **Tone.** Both planes are shades of the semantic face. The bottom is only slightly darker than the left: Yankun's review found that a much darker bottom reads as a detached shadow. Remove the separate base contact shadow wherever planes exist.
- **Dark mode.** Bands step lighter than the face, so they stay visible against near-black backing. This generalizes the Oct 8 Button and Oct 9 Card dark refinements.
- **Applies to** Button, IconButton, Card, Menu and Select popups, the Switch face, the secondary Tabs face and the Dialog frame.
- **Forced colors.** Planes disappear; the existing border and focus protections stay.

Canvas starting values, as `color-mix` toward black (light) or white (dark) from the face, near band then far band:

| Face            | Left plane | Bottom plane |
| --------------- | ---------- | ------------ |
| Secondary light | 8%, 14%    | 12%, 16%     |
| Primary light   | 14%, 24%   | 22%, 28%     |
| Card light      | 6%, 11%    | 9%, 12%      |
| Secondary dark  | +14%, +9%  | +11%, +7%    |
| Card dark       | +11%, +7%  | +8%, +5%     |

If a mix percentage becomes a token, it is finish, in `themes/su.tokens.json`, with a Yu completeness entry.

### WP 1.4 Rest pose and lift ⛔ V3

Today a Button rests with a 1px contact and lifts 2px. The sketch rests at 3px, lifts to 5px on hover and seats to 0 on press; Card rests at 4px and never moves. Option sheet: today, 2 → 4, 3 → 5, on a dense toolbar and a Card's action row, at 1× and ¼ speed. A rest depth needs a token (`depth.rest` or similar, finish layer). Hit areas, focus and neighbors stay fixed.

### WP 1.5 The faceted corner (卷杀) ⛔ V4

One bevelled corner on lifted faces, at the corner that leads along the depth axis (top-right with today's axis, in LTR and RTL alike, because the axis is a screen direction). The sketch uses 5px.

- Use `corner-shape: bevel` with a matching single-corner radius, inside `@supports (corner-shape: bevel)`. Browsers without it keep today's square corner; never fall back to a rounded corner.
- The facet size is a finish radius token.
- Option sheet: none, one corner, all four.

### WP 1.6 Recessed wells

Switch channel, Progress track, field value planes and the secondary Tabs track get two-step inner walls on the edges facing away from the light (top and right with today's axis), using inset hard shadows. Values come from the same shade rule as WP 1.3. No gate if the values reuse WP 1.3's approved steps; otherwise ⛔ V2.

### WP 1.7 Focus brackets ⛔ V12

Focus arrives as four corner brackets in the focus color, sliding from a few pixels out to their resting position over the part's grade duration, then holding still. They stay outside the part and never move with the face. Keep a 2px solid outline in forced colors. Check 3:1 against canvas and surface.

### WP 1.8 Display face ⛔ V7

Set Su's `font.family.display` to Newsreader, self-hosted like Geist. Under the current rule it appears only through `type-display` and `type-title`. The sketch also set Card titles in Newsreader; that would change which roles use the display face, a structural decision (V7b). Do not change `base/type.tokens.json` without it.

## Phase 2: Motion from rules

### WP 2.1 The 举折 curves ⛔ V5

The rule, from Yingzao Fashi: raise the ridge one third of the span between the eave purlins (举). Then fold (折): the purlin below the ridge drops one tenth of the rise below the straight chord, and each purlin further down drops half as much as the one above (1/10, 1/20, 1/40, 1/80), measured from a new chord each time.

For a hall of ten rafters (five per side), the normalized profile from eave to ridge is 0, 0.1333, 0.2917, 0.475, 0.7, 1 at even steps. That gives two curves:

- **Enter**, the profile turned 180°: `linear(0, 0.3 20%, 0.525 40%, 0.7083 60%, 0.8667 80%, 1)`.
- **Exit**, the profile as built: `linear(0, 0.1333 20%, 0.2917 40%, 0.475 60%, 0.7 80%, 1)`.

Steps:

1. Write a small script in `packages/tokens` that computes both curves from the rule (rafter count as its one input) and emits the `linear()` strings. The curve must be derived, never typed.
2. DTCG's `cubicBezier` type cannot hold `linear()`. Check how the resolver and Terrazzo handle a string token with an extension. Ask before adding a custom transform or a dependency.
3. Option sheet: today's `cubic-bezier(0.2, 0, 0, 1)`, 举折 with eight rafters, 举折 with ten rafters, and a smoothed cubic fit of the ten-rafter curve. Show real Button, Switch, Menu and Tabs at 1× and ¼ speed. Note for Yankun that the fold curve is gentler and more even than today's, and faceted.
4. After V5, point the role aliases (`easing-lift`, `-slide`, `-reveal`, `-exit`) at the chosen curves. `easing-seat` stays fast and simple unless V5 says otherwise.

### WP 2.2 Grade durations ⛔ V6

The manual sizes timber in eight grades. A part's motion duration is its grade's 材 height in 寸 times a constant _k_:

| Grade | 材 height (寸) | Part                      | At k = 30ms |
| ----- | -------------- | ------------------------- | ----------- |
| 8     | 4.5            | Switch face               | 135ms       |
| 7     | 5.25           | Button, IconButton, Tabs  | 158ms       |
| 5     | 6.6            | Menu, Select, Combobox    | 198ms       |
| 3     | 7.5            | Card                      | 225ms       |
| 1     | 9              | Dialog, the exploded view | 270ms       |

- The grade table is structural data; _k_ is finish.
- Each component's spec names its grade, so agents can derive its timing.
- Press seating stays fast (80ms today) for every grade: press is shorter than release.
- Option sheet: today, and k = 25, 30 and 35ms, with Board 04's "Play all" as the model.

### WP 2.3 Load path ⛔ V11

Pressing a control inside a Card makes the Card's depth dip by 1px for the press, then return. CSS `:has(:active)` on the Card, seat duration. Paint only.

### WP 2.4 Drawn → built ⛔ V8

Three states for surfaces: **drawn** (outline only; hidden edges dashed), **built** (solid) and **removed**.

- **Build:** the lines draw on, then faces fill and the part rises from 0 to its rest depth.
- **Remove:** the reverse.
- **Loading:** the drawing, static, with dimensions in fen, until data arrives. No idle animation.
- **Reduced motion:** states switch instantly; the loading drawing stays.

V8 decides where it applies. Lean: Card loading and removal in the docs first; Dialog keeps D7's instant entry. A published Skeleton or loading component belongs to the components plan.

### WP 2.5 Foundations → Motion

Port Board 04: the fold figure, the resulting curves beside today's, the same-duration race, a slow-motion switch and the grade "Play all". Values read from the tokens, never copied.

## Phase 3: Show the parts as the hero

### WP 3.1 The exploded stage (docs-local)

A docs component, `ExplodedStage`, that separates a real composition into named layers along the depth axis.

- **Layers by attribute.** Components carry a layer name in a data attribute: canvas, surface, card, control, overlay, focus. This also names the parts for agents.
- **One tree, several copies.** Render the composition once per layer, with every element outside that layer hidden by `visibility` so geometry stays identical. Only the first copy is in the accessibility tree; the others are `aria-hidden` and `inert`. Interaction happens in the Built pose.
- **Projection.** Orthographic: no `perspective`, `transform-style: preserve-3d`, one registered number `--x` from 0 (built) to 1 (parts). Canvas values (agent-made): `rotateX(54deg × x)`, `rotateZ(-36deg × x)`, `scale(1 − 0.24x)`, 56px between layers. These are options for V9's sheet, not approvals.
- **Picking,** like L14's bracket set: pointer height picks the nearest layer; Up and Down pick with the keyboard; Escape clears. The picked layer lifts a little further and the others ghost (L17). A polite live region names the layer, its grade and its depth; all captions share one grid cell.
- **Motion:** `--x` uses the grade 1 duration and the 举折 enter curve. Reduced motion switches poses instantly.

### WP 3.2 The overview hero ⛔ V9, V10

Board 06 is the reference.

- **Composition.** The copy sits above: eyebrow, the 56px headline at left, subline and actions at right. The stage spans the main column below. This supersedes L5's split. L1 (sidebar), L8 (stage in the main column) and L9 (follows the page's mode) stay.
- **Control.** A Parts and Built segmented control, built like the secondary Tabs track, with one caption cell beside it.
- **The hero is the showcase.** The exploded workspace is the same workspace L15 built. Merge the showcase section into the hero and retire its dashed "Show parts" outline switch. "One workspace, built from shared parts" can become the caption.
- **Rest pose (V9):** Parts, the exploded picture, or Built, the working workspace. Either way nothing moves until a person acts.
- **The bracket set (V10):** keep it as a smaller hero figure, move it to Explore and the nav, or retire it from the landing page.
- **Copy** stays with L13: Yankun edits the strings.
- **Phones:** the stage scales to the column; below 48rem the Parts pose may become a static, labelled image.

### WP 3.3 Update the landing plan

When V9 and V10 are decided, add rows to `docs/plans/2026-10-landing/README.md` that supersede L2, L5, L14, L15 and L17 as decided, and update its motion section: the hero's moves are the Parts and Built switch, the pick and the keyboard.

## Phase 4: Verify, document and record

- **Tests.** Contrast promises for the seal and neutrals; a test that no finish uses a blurred shadow; Playwright specs for hover, press, focus, reduced motion, forced colors, RTL and dark mode on every changed component; a performance check that the exploded stage holds 60fps on a mid-range laptop.
- **Fallbacks.** Without `corner-shape`, corners stay square. `linear()` and `@property` are needed; confirm current Safari and Firefox and record the result.
- **Docs.** Update `AGENTS.md` with the new rules, `docs/motion.md` with the curves and grades, and Foundations → Depth with the planes.
- **Record.** Draft a `BRIEF.md` decision-log row for each passed gate. Yankun adds it.

## Decisions waiting on Yankun

"Lean" is the reviewer's suggestion. Color leans are left blank on purpose.

| #   | Decision            | Options                                                                 | Lean                                                |
| --- | ------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| V1  | The seal            | Ink 墨, Red ochre 丹, Azurite 青 (Vermilion removed Oct 11)             | —                                                   |
| V1b | Neutrals            | Su gray, or warm ink 五墨                                               | —                                                   |
| V1c | Focus color         | The seal, or ink                                                        | —                                                   |
| V2  | Side planes         | Today's one shade, one step per plane, or two bands with a toned bottom | Two bands, toned bottom                             |
| V3  | Rest and lift       | Today (1 → 2px), 2 → 4px, 3 → 5px; Card static at its rest depth        | 3 → 5px                                             |
| V4  | Faceted corner      | None, one leading corner, all four; size                                | One leading corner                                  |
| V5  | Easing              | Today's curve, 举折 8 or 10 rafters, a smoothed fit                     | 举折, 10 rafters, faceted                           |
| V6  | Durations           | Today, or grade height × k with k = 25, 30 or 35ms; press stays fast    | k = 30ms                                            |
| V7  | Display face        | Geist, or Newsreader in display and title roles                         | Newsreader in display and title                     |
| V7b | Card titles         | Text face, or the display face (a structural change)                    | Text face, to keep the rule                         |
| V8  | Drawn → built scope | Loading, removal, Dialog entry                                          | Loading and removal; Dialog stays instant           |
| V9  | Hero rest pose      | Parts or Built                                                          | Parts: the strongest first image, and nothing plays |
| V10 | Bracket set         | Smaller hero figure, Explore and nav, or retired from the landing page  | Explore and nav                                     |
| V11 | Load path dip       | Yes, 1px; or no                                                         | Yes                                                 |
| V12 | Focus brackets      | Brackets, or today's outline                                            | Brackets, with the forced-colors outline            |

## Out of scope

- New components. They get their own plan.
- Yu, glass, the light-source or sundial idea, the ⌥ x-ray view and sound. They are candidates for later.
- Chart motion. The data visualization rule "motion only from data" stands.
- Geist stylistic sets, a Figma library and npm publishing.

## Words used in this plan

| Word  | Meaning                                                                                    |
| ----- | ------------------------------------------------------------------------------------------ |
| Seal  | Su's one color. Only the primary action, the current selection and focus use it            |
| Plane | A side joining a lifted face to its base. Today's axis shows the left and bottom planes    |
| Band  | One flat tone step within a plane (叠晕)                                                   |
| Facet | The bevelled leading corner of a lifted face (卷杀)                                        |
| Well  | A recessed track or value plane with stepped inner walls                                   |
| Grade | One of the eight timber sizes (材分八等); it sets a part's motion duration                 |
| Fold  | The 举折 profile and the curves derived from it                                            |
| Drawn | A part shown as its construction drawing: outline, hidden edges dashed                     |
| Built | A part shown solid, at its rest depth                                                      |
| Layer | One named depth level in the exploded view: canvas, surface, card, control, overlay, focus |
| Pick  | Choosing one layer to name it; the others ghost                                            |
