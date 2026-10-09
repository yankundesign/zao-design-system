# Su / Quiet instrument

**Status:** Current local Su study, selected on Oct 4, 2026. The approved Oct 8 radius and fast-motion subset now inherits published Su tokens: action radius 0px, control/surface/overlay radii 2px, and fast duration 80ms. The remaining [scoped CSS](style.css) records local palette and component treatments. Yankun still chooses their promotion.

**Direction update, Oct 6, 2026:** [Quiet construction](../../../BRIEF.md#current-design-direction-quiet-construction) is the current design direction across ZAO. It explores the boundary of 2D clarity and 3D presence through clean, measured, coherent physical construction and a quiet responsive feeling. Yingzao Fashi informs proportion, parts, assembly, and finish. Current work focuses on Su in light and dark; Yu is deferred as a possible phase 2. Rest may already be a designed spatial composition.

This direction is not a third finish or a rename of Quiet instrument. The study ID and finish timing remain unchanged; palette refinements are recorded below. Yankun defines individual component interactions one by one; Button, Card, Menu, and Dialog follow their specific approvals below. The remaining principles and recipes record the current study, not instructions for new interactions or system-wide motion commitments. Usability benefits remain hypotheses that need evidence.

## Current study character

**Operational calm.** The interface should feel like a dependable measurement instrument: direct controls, legible readings, precise edges, and immediate feedback. Its interest comes from the relationship between a control and its consequence, not a dashboard full of invented data.

The working lineage is **Ulm functionalism + Swiss information design + contemporary instrument UI**. “Quiet instrument” is our shorthand for the synthesis, not the name of a historical movement.

**Palette decision, 2026-10-06:** Remove the green tint for now. Canvas, surfaces, wells, text, borders, and action colors use achromatic grays in both modes. Their luminance relationships remain close to the previous study, so controls keep their separation. Success and error colors remain semantic.

**Requested light background refinement, Oct 7:** The shared light component previews inherit ZAO's published semantic page canvas, removing their separate grey backing. Light has no local `--canvas` or `--zao-color-bg-canvas` override; dark keeps its local canvas mapping. Surface, recessed control, state, and floating material fills retain their existing treatments. This request changes light canvas inheritance and does not promote study values into tokens.

The [Hairline figures reference](https://hairline.lucasmarkes.com/figures) initially sharpened the study's clarity goal: generous open space, precise fine strokes, and darker emphasis where it helps reading or interaction. The current direction draws on [Hairline's source](https://github.com/lucasmarkes/hairline) for feeling and the process of testing and refining rules. Its figure-specific artwork rules and timings are not prescriptions for ZAO components.

## Current study principles

These describe the study's intended character. Their usability claims still need evidence; the current direction does not adopt these specific treatments as universal rules.

1. **Each surface has a job.** Canvas is the work area, surface groups a record, and a recessed well holds an editable value. Card readings stay open within the content plane.
2. **Contrast precedes color.** One action can lead a group. Status colors retain their semantic meaning; red is not a decorative brand signal.
3. **States aim for a restrained physical feeling.** Button's connected side and contact edge establish its construction at rest; hover lifts its face over a stable base, press seats it along the same axis, and release returns to hover or rest. Focus retains an unmistakable outside outline. Other component interactions remain open.
4. **Data marks are accountable.** A scale can frame a value; a filled arc or bar would need actual data rather than a sample number encoded in a reusable stylesheet.
5. **Rest is quiet.** The study uses opaque materials, without an ambient pulse, glass, decorative telemetry, or a shadow intended to make a content card “float.”

## What is already in the CSS

The study applies to the real `@zao/react` Button, field family, Card, Menu, and Dialog inside `.study[data-study='quiet-instrument']`. The existing `/components` previews discover it automatically. Light and dark modes use the same grammar with different trial colors.

| Layer              | Current treatment                                                                                                  | Reason                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Canvas and surface | Achromatic, opaque planes; the card is slightly distinct from the canvas                                           | Keep the work area and its records easy to separate                                                                |
| Recessed well      | Deeper value field with a single perimeter line                                                                    | Signal where a value is entered                                                                                    |
| Card data          | Open, unfilled radial gauge or ruled stat columns                                                                  | Let markings and alignment organize readings without a nested filled panel                                         |
| Borders            | Firm perimeter, finer internal divisions                                                                           | Establish hierarchy without multiple shadows                                                                       |
| Corners            | Buttons: published Su `0px`. Fields: `0px`; Card and Dialog: approved square `0px`; choice-study overlays: `0px`   | Square corners follow Card's Oct 8 refinement and Dialog's Oct 9 B approval; other surfaces retain Su's 2px radius |
| Accent             | High-contrast neutral action, not a colorful brand wash                                                            | Let meaning and state carry the hierarchy                                                                          |
| Motion             | Published Su `80ms` fast duration; Button hover lifts its face `2px` up and right, with same-axis contact on press | Explore quiet physical feedback while keeping the native hit area stable                                           |

The private `--surface`, `--well`, dark-only `--canvas`, and related variables in [style.css](style.css) are study values. Light canvas already inherits ZAO's published semantic mapping; other published colors must eventually come from ZAO's palette generator and semantic mode mappings.

## Shared ZAO structure

- **Type:** Geist for all interface text and Su titles. Geist Mono only for IDs, code, and keyboard labels. Use ZAO's `type-*` roles; do not set raw font sizes or change role metrics in this finish.
- **Size and layout:** Keep the shared fen spacing and control heights. Button and the field family default to the approved 34px size; small and large remain 28px and 40px. Button's stationary shell and moving face are shared across finishes.
- **Focus:** Retain `outline-focus` or `ring-focus`. A stronger single border can reinforce focus but cannot replace the outside indicator.
- **Numbers:** Use `figures-tabular` for changing readings and aligned columns; use `figures-id` for identifiers.
- **Accessibility:** Every state must remain readable in Su light and dark, with reduced motion, keyboard navigation, and a disabled or invalid control.

## Current component observations and open questions

The descriptions below record the current implementation and its study intent. Future treatments and interactions are pending Yankun's individual definitions.

### Button

**Approved reference and refinement, Oct 6:** [ZAO Figma, node 1:2332](https://www.figma.com/design/N2yXQBswbFVDiCh6WRCUTz/ZAO?node-id=1-2332). Use the shared `type-button` role (14px Geist at weight 500 / 18px line box), square corners, and default 16px horizontal / 8px vertical padding (34px height). Colors come from ZAO's semantic roles and this study's local palette mappings. The refinement adds connected construction, quieter hover, and same-axis contact on press; it does not define other component interactions.

**Approved simplification, Oct 7:** One face, one continuous joined side, and one fixed base replace the three visible offset shadow copies. The states below retain their approved geometry, 2px upward-and-right lift, press axis, and finish duration. The native hit area, focus outline, and neighboring layout remain stationary; variants, disabled behavior, and reduced-motion feedback stay intact.

**Requested dark side refinement, Oct 8:** Dark secondary and filled quiet Buttons use the existing `border-subtle` semantic color for the joined side and fixed base. This lighter edge separates the construction from near-black surface backing. Light mode and primary Buttons retain the shared face shade; geometry and interaction stay unchanged.

**Variant expansion, Oct 9:** [Primer's Button reference](https://primer.style/product/components/button/) informs the additional emphasis, content, width, and loading choices below. They reuse ZAO's approved construction and semantic roles in Su light and dark; they do not copy Primer's geometry or introduce popup behavior.

- **Primary:** The most luminous/solid key in a group, intended to emphasize one action.
- **Secondary:** Framed key on a surface, intended to keep its label and border legible in both modes.
- **Quiet:** A text-forward control whose face gains a surface on hover, with a full pointer target and a visible focus outline.
- **Danger:** A neutral framed face with semantic danger text names a destructive action. It uses the same connected side, hit area, and input poses as secondary.
- **Content and width:** `leadingIcon`, `trailingIcon`, and `trailingAction` accept decorative Iconoir-compatible SVG components at existing 16px / 20px icon sizes. Keep a visible action label. Trailing action content shares the native target and only supplies an indicator; use Menu for popup behavior. `block` fills the available width without changing height or padding.
- **Loading:** Controlled `loading` preserves width and accessible name, keeps focus, exposes busy and disabled semantics, and blocks repeat activation. Pass `loading={isPending}` from the initial render, including `false`, so the live region precedes its message. Replace the first available icon slot in leading → trailing → trailing action order; leave other icons in place. With no icon slot, overlay the visually hidden label while keeping its space and accessible name. A polite status uses `loadingAnnouncement`, defaulting to “Loading”; the host controls completion and result announcements. Yankun approved one rotation per second through `motion.duration.loading`; reduced motion keeps the indicator still. Explicit disabled state keeps its native behavior and skips the tab order.
- **Rest:** The face stays at `(0, 0)`. Primary, secondary, and danger show a 1px contact edge above a stationary seat 1px left and 1px down; face, connected side, and seat form one construction. Quiet remains text-only, with transparent side and base; its constructed surface and side appear on hover.
- **Hover:** On a fine pointer that supports hover, the face moves to `(+2px, -2px)` relative to rest; one continuous joined side connects it to the stationary seat. Primary, secondary, and danger keep their resting fill and border, while quiet reveals a surface. The treatment adds no stronger hover border or blur. The native hit area and neighboring layout remain stationary. Finish timing remains 80 ms in this study.
- **Press and release:** Press moves the face to `(-1px, +1px)`, onto its seat along the same axis, collapsing the side. Release returns to the hovered pose if the pointer is still over the button, otherwise to rest. Pointer, keyboard, and touch retain native activation; feedback acknowledges the input, not the success of the action. The earlier movement of the native shell stays removed.
- **Reduced motion:** Keeps the face stationary and removes transitions while preserving semantic hover/press fill feedback and the outside focus outline.
- **Disabled:** Remains visibly present without hover, press, or focus behavior. The copy model uses a concrete action and result: “Save changes,” then “Saved changes.”
- **Open review questions:** How do all three sizes read in a dense toolbar and at the end of a form? Is the primary too bright in dark mode, or the secondary frame too heavy in light mode?

### TextField, Combobox, and Select

**Requested working study, Oct 7:** One consistent field family in the existing component previews. The shared sizes are 28px, 34px, and 40px; the 34px default reuses the existing base value while the general control token stays 32px.

- **Rest, approved A (Oct 8, D6):** Square stationary enclosure, one value plane, and one fine `border-field` perimeter. Light keeps the existing resting edge; dark uses the generated restrained edge. Both meet at least 3:1 against canvas and surface. Light invalid uses the generated red `border-field-invalid`; dark invalid retains the semantic danger border. Invalid is no weaker than the normal edge at rest. Disabled fields use a subtle border and `bg-field-disabled`: the grey well in light and the surface fill in dark. Keep shared type roles, label spacing, and `px-2` content inset. These values remain local pending color promotion; the published utility fallbacks retain the existing palette mappings.
- **Hover and focus:** Enabled fields strengthen the perimeter without moving. Keyboard focus retains the outside outline around the full enclosure, including Combobox's auxiliary controls. Invalid borders remain semantic error borders during hover and focus; disabled fields remain readable and inactive.
- **Disabled and invalid together:** Retain the invalid edge and use the disabled fill. Disabling a field does not erase its existing error indication.
- **Parts:** TextField accepts native editable text and preserves read-only inputs. Combobox filters predefined choices and reserves clear-action space. Select opens a fixed choice list. No new public props or free-form Combobox values are added.
- **Choice panels:** One stationary floating frame owns a separate scroll viewport and a decorative front lip. The local Pocket study reuses Menu's progress, contact geometry, placement direction, `duration-base` opening, and `duration-fast` closing. Labels and option targets do not scale, translate, or stagger. Reduced motion displays the complete frame immediately; Base UI instant paths remain instant.
- **Options, approved B and square corners (Oct 9, D8):** Value text aligns with field text. Long labels wrap. Enabled hovered or highlighted options use the existing semantic fill without an inset navigation mark, sharing Menu's fill-only cue and square corners through `radius.none` / `rounded-none`. Reserved checkmark space identifies the committed value independently of navigation. Select keeps native item keyboard outlines; Combobox keeps its input outline and virtual option focus. Disabled rows remain readable without active emphasis, and forced colors retain a visible system-color highlight. Preserve the last highlighted fill while closing. D8 is resolved.
- **Review:** The three docs pages share one mixed workspace-settings form and small/default/large comparisons. Judge coherence, text editing, clear actions, focus/error distinction, collision flips, scrolling, and repeated pointer/keyboard/touch use in light and dark. Square field and option-panel geometry, material, and reveal remain scoped to this study; published semantic values remain intact, and Yu is outside the current study scope.

### Card

**Approved construction and specimen, Oct 6:** The Card is a grounded reading surface with explicit actions, using existing fen proportions, type roles, and semantic colors. This approval does not establish interactions for other components.

**Requested dark contact refinement, Oct 9:** Use the existing `border-subtle` semantic color for Card's contact edge in dark mode, matching the dark Button refinement and separating the edge from near-black backing. Light mode retains the shared face shade. The square frame, depth, passive behavior, and explicit action interactions remain intact; Dialog keeps its separate approved shade.

- **Rest:** Following the Oct 8 refinement, one square static frame with a subtle semantic perimeter and A's filled shaded contact edge ground one content plane. The core Card remains passive, with no hover motion. Its construction stays readable without implying that the whole enclosure is a button.
- **Hierarchy:** The title leads the record. Supporting metadata, status, and readings remain subordinate; aligned values use tabular figures where they update.
- **Data region:** Optional open, unfilled regions organize measurements within the content plane. Stacked uses ruled stat columns instead of a nested filled panel. Data remains in semantic colors, with no invented waveform, motion, or glow.
- **Storage gauge:** Split uses 100 fine graduated radial marks and restrained concentric inner rings. One specimen storage value determines the 68 active marks and the single 68% readout. The complete gauge remains fully visible, with a readable label; reusable styles do not encode a sample measurement or imply an unsupported capacity.
- **Actions:** Explicit Buttons occupy a bottom row. Each retains its own approved interaction, native activation, and outside focus outline. The passive frame does not lift when an action is hovered or pressed.
- **Open review questions:** Does the hierarchy remain clear with no data region, several readings, a long title, or an error or warning? Is the complete chart visible in both modes and narrow layouts, and are the bottom actions easy to identify and reach by keyboard?

**Approved layout compositions, Oct 6:** The wrapping Layout tabs choose among four compositions of the unchanged passive Card. The selected composition appears at exact card widths of **640px** and **480px** together, with labeled samples stacked vertically. Split responds to container width: content and data sit side by side at 640px and stack at 480px. On narrow docs views, each sample retains its width in its own focusable horizontal scroll region; the overall page and selectors fit the viewport. These comparison dimensions do not define published Card structure or tokens. Layout remains independent of finish and study selection, with no published Card variant props or hover motion. Explicit actions retain Button's approved behavior.

| Layout  | Use when                                          | Composition                                                                                                       |
| ------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Split   | A record has a supporting measurement             | Storage specimen, with record content and the complete radial gauge arranged by container width and actions below |
| Stacked | Content benefits from a vertical reading sequence | Content followed by open ruled stat columns and bottom actions                                                    |
| Compact | Repeated workspace summaries need brief content   | A short summary and one small Button action                                                                       |
| Media   | A schematic helps explain the record              | Illustration above the title-led content and bottom actions; the illustration does not imply a measurement        |

### Menu

**Approved construction and Pocket reveal, Oct 6:** Menu uses depth to identify one temporary floating panel anchored to its trigger. Su light and dark share structure and interaction meaning, with floating material provided by `material-overlay`. Other component interactions remain open.

- **Trigger:** Reuse the secondary Button at shared 28px, 34px, and 40px sizes, with a visible label and clear open state. Preserve its stationary target and focus outline.
- **Frame and reveal:** Use a fine semantic border and crisp contact edge around one floating frame. A decorative moving front lip starts at the trigger-adjacent joint and travels with the clipped reveal, becoming the far frame edge when open (the bottom edge for a bottom-placed popup). It withdraws on close and follows actual collision placement. The full-size popup, labels, and selection targets retain their position, without scaling, translation, or row stagger. The lip stays attached to the frame while a long list scrolls.
- **Timing:** Reuse existing `duration-base` for opening: 160ms in Su and Quiet instrument. Close with the finish's faster `duration-fast`: 80ms in both, following the approved Oct 8 Su promotion. This selects existing overlay timings without changing tokens or global values. Durations apply when animated; Base UI instant paths (`data-instant`, which keyboard/Escape can set) remain immediate.
- **Rows, approved B and square corners (Oct 9, D8, WP 2.3):** Enabled hovered or highlighted items use the existing semantic fill without an inset navigation mark. Menu, Select, and Combobox share this cue and square corners through the existing `radius.none` / `rounded-none`; D8 is resolved. Keep native Menu/Select keyboard outlines; Combobox retains input focus and virtual option highlighting. Committed-value checkmarks stay separate from navigation. Preserve meaningful separators and readable disabled items without active emphasis. The highlighted fill stays steady until closing completes; targets, labels, RTL, Base UI behavior, reduced motion, and forced-color identification remain intact. Motion on neighboring rows and new press treatments remain open. No tokens, values, or public API are added.
- **Behavior:** Preserve Base UI keyboard navigation, dismissal, focus behavior, and collision flip/shift. Reduced motion shows the completed frame immediately while retaining readable states and the panel's relationship to its trigger.
- **Open review questions:** Is the trigger's open state clear, and does the frame still feel attached when positioning flips or shifts? Can repeated pointer and keyboard choices proceed without distracting row motion?

### Dialog

**Approved B, Oct 9 (D7, WP 2.2 and WP 3.5):** Yankun selected a square static frame, a page veil, and instant entry and exit. The Oct 8 WP 2.2 step 1 established shared Button actions; D7 chooses Dialog's own construction, backdrop, and entry/exit.

- **Frame:** Reuse Card's square stationary `bg-surface` content plane, `stroke.hairline` subtle semantic border, and shaded contact edge from the existing depth tokens. Labels, actions, and the frame stay stationary. Use no blur or soft shadow.
- **Page veil:** Paint the semantic canvas at 80% opacity over the page. The existing reduced-transparency preference and opt-in use an opaque veil; the popup is always opaque. The same treatment applies in Su light and dark through semantic inheritance.
- **Entry and exit:** Show and remove the completed frame and veil immediately. Reduced motion is also immediate; no reveal lip or content translation is part of B.
- **Actions:** Trigger and Close reuse Button's primary, secondary, and quiet variants at small 28px, default 34px, and large 40px sizes. Trigger defaults to secondary and Close to quiet. Use a real primary Button for the principal specimen action and preserve each action's approved feedback and outside focus outline.
- **Access:** Base UI owns initial focus, focus trapping, Escape and outside-press dismissal, focus return, scroll locking, and accessible title/description relationships. Include a visible close action. Portal content must inherit the trigger's finish island.
- **Scope:** This individual approval adds no global tokens or interactions. The private alternatives record the decision process; other component interactions and remaining color promotion retain their own gates.

### Tabs

**Approved ruler rail and secondary selector, Oct 7:** The ruler belongs to primary views. Its fine guide and stronger selection line share their centerline; graduations, tab registration ticks, and end stops give it the measured character of a scale. Hover or keyboard focus extends the target tick. Press compresses the selected line around the same centerline, without adding thickness, a shadow, or label motion.

Secondary views use one sliding surface face in a square recessed track, with a fine semantic border and contact edge. Press seats the face; there is no repeated underline. Native targets, labels, focus outlines, and layout stay fixed in both treatments. Base UI retains independent nested selection, automatic or manual keyboard activation, vertical navigation, disabled behavior, and measured indicator placement. Lists scroll within a padded viewport on narrow views. Existing finish durations and semantic colors supply the treatment; reduced motion makes the feedback immediate. The benefits of the ruler detail for orientation remain hypotheses to judge in use.

**Approved vertical B, Oct 9 (WP 2.4):** Vertical primary labels share the edge nearest the rail: right in LTR and left in RTL. Draw one minor graduation at the measured midpoint of each actual gap between adjacent native tabs (`n − 1` marks). Reuse `--zao-space-0-5` for the 2px length, `--zao-stroke-hairline` for the 1px stroke, the existing outward offset, `border-subtle` ink, and half opacity. Retain the guide, end stops, registration ticks, and selection line. The geometry follows the actual tab layout; labels and native targets stay stationary during interaction.

The WP 2.4 graduation gate is resolved. Preserve outside focus outlines, layout, hover/focus tick extension, selection-line compression on press, Base UI selection and keyboard navigation, disabled states, nested state, scrolling, and reduced motion under the Oct 7 approval. Horizontal and secondary drawings keep their current treatment. This approval adds no tokens, values, public API, dependencies, or interactions.

**Forced colors:** Primary ruler decorations use local semantic ink mappings to system `CanvasText`, with `forced-color-adjust: none` scoped to the rail, registration ticks, and selection line. Keep native target states and outside focus outlines. This accessibility protection preserves the normal-mode drawing and geometry.

### Table

**Requested implementation and monochrome refinement, Oct 6:** A grounded ledger extends the existing Card, Button, and Menu construction. [Hairline's process](https://hairline.lucasmarkes.com/inspo) informs economical linework, deliberate assembly, and a composed resting state. The current requested refinement is under review; usability benefits remain hypotheses.

- **Rest:** One square stationary frame and contact edge contain an open `bg-canvas` reading plane. Fine horizontal rules separate rows and column labels. Heads and cells share `px-3 py-2` fen padding; the docs preview exposes the Table's own frame directly.
- **Hierarchy:** Static and sortable column labels use `type-label`. The primary column takes the available width; supporting columns stay compact. Names use `type-body` with medium emphasis, IDs use `type-code` with `figures-id`, and numeric readings align right with tabular figures. Statuses use plain `type-caption` foreground text.
- **States:** Hover and focus-within use neutral semantic emphasis. Foreground checkboxes use square corners with no radius, visible checked/mixed marks, a 24px label target, and intact native state and keyboard focus, following the Oct 7 refinement. Persistent `bg-active` fill stays tied to record IDs through sorting. The frame, cells, and rules stay stationary; sort indicators retain their space when inactive.
- **Text contrast:** Statuses use default foreground in every state. IDs and owner metadata use muted foreground at rest and default foreground during hover, focus, and selection. Judge their readability against each finish's neutral emphasis fills.
- **Actions and copy:** A compact toolbar groups secondary comparison and current Menu reset/clear actions above the frame. A concise selected count appears below; assistive technology receives the detailed count and sort announcement. Existing actions retain their approved feedback, dismissal, focus, and reduced-motion protections.
- **Access and scope:** Native table parts preserve header relationships. A named, focusable horizontal scroll region keeps all columns available on narrow views. This Table supplies composition; consumers own sorting and selection state. Editable cells, resizing, and a spreadsheet keyboard model need a separate task.
- **What to judge:** Does the column hierarchy support repeated scanning, and does selected fill remain distinct from hover in each finish? Do narrow layouts preserve control access and focus visibility? Construction benefits remain hypotheses to judge in use.

### Progress

**Requested refinement, Oct 7:** Combine clear product hierarchy with quiet construction, following the [data visualization guideline](../../../docs/data-visualization.md).

- **Rest:** One square stationary recessed track, one quantitative face, and a crisp contact edge. Paint the frame over the track so its reference span stays intact. Put the task label and tabular reading outside; use shared type roles, fen spacing, and semantic colors.
- **Known completion:** Base UI derives the proportion, formatted reading, and accessible value from one clamped input. Zero leaves the face empty; full fills the complete span. Fractional values retain their geometry, and custom totals and units remain explicit in surrounding text. No hover response or inspection gesture is needed to discover essential information.
- **Unknown completion:** Hide the quantitative face and use a full-span interrupted reference with “In progress.” Null, non-finite readings, and invalid ranges cannot supply a percentage. The reference stays still and carries no measured fraction.
- **Update:** Show the initial value immediately. Actual changes transition the face width with existing `duration-base` and `easing-standard`; an interrupted update reverses from its current width. Frame, label, and layout stay fixed. Reduced motion shows the new width immediately. No idle loop, initial count-up, particles, or automatic simulation is added.
- **Access:** Retain Base UI labeling and range semantics, RTL anchoring, and forced-color readability. Provide a visible reading nearby when hiding the built-in value. The host owns meaningful milestone announcements and actions that control the task.
- **What to judge:** Can readers distinguish zero from unknown, understand the total and remaining work, and read the same proportion in each finish and narrow layout? Does the contact edge aid construction clarity without competing with the amount?

## Reference shelf

These are prompts for studying details, not templates to copy.

| Look at                                                                                                                                                                           | Inspect for                                                                  | Study relevance                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [Braun ET 55 calculator, Dieter Rams and Dietrich Lubs](https://www.moma.org/collection/works/3697) and [Rams's principles at Vitsœ](https://www.vitsoe.com/us/about/good-design) | Grouping and color that explain a control's purpose                          | Button hierarchy and meaningful state color                                   |
| [Otl Aicher at HfG Ulm](https://hfg-archiv.museumulm.de/hfg-sammlung/werknachlaesse/nachlass-otl-aicher/)                                                                         | A coherent family of symbols and labels                                      | Future icon and status language                                               |
| [Müller-Brockmann's SBB information manual](https://eshop.museum-gestaltung.ch/?id=9177&lang=en&op=product)                                                                       | Consistent information hierarchy under real-world complexity                 | Dense forms, tables, and navigation                                           |
| [Wim Crouwel's systematic graphic work](https://designmuseum.org/designers/wim-crouwel)                                                                                           | How a strict grid can still have character                                   | Typography and alignment without decorative rules                             |
| [Hairline figures, Lucas Marques](https://hairline.lucasmarkes.com/figures) and [source](https://github.com/lucasmarkes/hairline)                                                 | Open space, fine strokes, and contrast between subject and supporting detail | Initial clarity cues; current direction studies its quiet feeling and process |
| [Teenage Engineering TX–6](https://teenage.engineering/products/tx-6)                                                                                                             | Relationship of tactile control, labeling, and tiny readout                  | Button press and compact status; do not copy miniature type                   |
| [Ableton Live 12](https://www.ableton.com/en/live-manual/12/first-steps/)                                                                                                         | Dense working surfaces, adjustable contrast, and light/dark behavior         | Field, panel, and focus hierarchy during long use                             |
| [Adobe Spectrum states](https://spectrum.adobe.com/page/states/) and [Action button](https://spectrum.adobe.com/page/action-button/)                                              | A complete distinction between hover, press, focus, selection, and disabled  | State coverage, not Spectrum's shape or palette                               |
| [Primer ActionMenu](https://primer.style/product/components/action-menu/guidelines/) and [TextInput](https://primer.style/product/components/text-input/guidelines/)              | Menu grouping, keyboard flow, field anatomy, and validation                  | Menu review and future TextField detail                                       |
| [GOV.UK error guidance](https://design-system.service.gov.uk/components/error-message/)                                                                                           | Specific corrections and recovery language                                   | Error copy and field recovery, not visual styling                             |

The first three are the strongest historical anchors. TX–6 and Live show how instrument logic behaves in current products. The design systems are component-state references; ZAO should keep its own visual voice.

## Decisions still open

1. **Value separation:** With the base palette now achromatic, are canvas, surface, and well distinct enough? Is the dark canvas too near black?
2. **Edge family:** Su's surface radius is `2px`; the Oct 8 Card refinement and Oct 9 Dialog B approval use square corners. Other fully square enclosures need their own component decision.
3. **Primary key:** Should dark mode use a pale key, or a restrained chromatic signal?
4. **Field depth:** Does the recessed fill still read clearly with a single border in both modes?
5. **Card data region:** Do the open gauge and ruled columns support reading without crowding the title or bottom actions? Judge the approved complete storage gauge alongside cards without a chart.
6. **Menu readability:** Judge the approved frame, row emphasis, and disabled labels in both modes, including collision repositioning and keyboard dismissal.

Future component studies begin from Yankun's individual interaction definitions. These open questions preserve the earlier study's review agenda without selecting or authorizing the next pass. Any claim that a detail improves use needs evidence before it becomes a system rule or a promoted value.
