# Data visualization

_Working guideline · October 7, 2026 · First implementation: the storage ring in Card._

ZAO charts are quiet instruments: composed at rest, attentive during inspection, and expressive when the data changes. They use the same measured construction as the rest of the interface. Clarity and accurate encoding come first; physical presence and motion must earn their place.

Yankun requested this guideline and the first ring study after reviewing a recording of an audio instrument with fine radial strokes around a fixed center. The transferable idea is contained response around a steady reference. Its fluctuating waveform belongs to a changing signal; it does not prescribe a waveform for storage or a global chart interaction system.

## Scope and status

This is guidance for developing a general data visualization library, beginning with one local docs specimen. The ring's used/available inspection is the requested first study. The later Oct 7 refinement removes the Illustrative data section, including simulation and particle controls. Other chart interactions, spatial treatments, numeric motion values, package APIs, and published defaults remain open. Usability benefits are hypotheses until tested.

The Card remains passive. Its frame, contact edge, content plane, neighboring layout, and bottom actions retain their approved behavior. The first study changes the chart inside the Card, not Card's own interaction.

## Start with the question

Choose an encoding that answers the reader's question with the least effort.

- **How much of a whole?** Use a capacity ring or a linear part-to-whole bar. Make the total and remaining share understandable.
- **Which is larger?** Use aligned bars on a shared baseline. Keep the scale and category order explicit.
- **How did it change?** Use a line with a time axis, units, and a named period. Preserve gaps where observations are missing.
- **Where does it go?** Use a flow view only when relationships and direction are real data. Define any mapping from particle speed or density to quantity.

Chart families can share inspection, selection, formatting, summaries, and update handling. Their gestures and spatial responses require individual studies; a ring's interaction is not automatically appropriate for a line or bar chart.

## Keep the reading honest

- Derive every quantitative mark and its text from the same data. Keep category identities and scales stable across updates.
- State units, totals, time ranges, and comparison periods when known. Distinguish observations, estimates, stale readings, missing data, and illustrative data.
- Do not invent category breakdowns, capacities, thresholds, trends, or forecasts. A percentage alone cannot supply those facts.
- Keep data geometry steady during inspection. Hover does not change angles, lengths, occupied proportion, ordering, or scale.
- Use depth to clarify construction or grouping. Do not tilt or extrude marks in a way that changes apparent magnitude or hides another observation.
- Use semantic colors. Pair color with readable text, positions, or shapes; reserve status meaning for actual status data.
- Directly label important readings. Offer an accessible summary and a data view appropriate to the data; do not require hover to discover essential values.

## Compose the resting state

A chart should be complete before interaction. Use existing fen proportions and type roles, tabular figures for aligned or changing readings, fine reference lines, and a small number of coherent parts. Let marks lead and reference structure support them. Keep chart regions open; use the Card's content plane rather than nesting another decorative panel.

Spatial presence belongs to the shared Quiet construction direction. Su light and dark share data geometry, reading order, interaction meaning, and accessibility. Current studies focus on Su; Yu is deferred as a possible phase 2. Glass belongs to temporary floating layers through `material-overlay`, not behind chart readings.

## Inspect, select, compare, update, explain

### Inspect

Reveal a meaningful datum or region, not an arbitrary decorative part. Explain its name, exact value, unit, and relevant context. A single capacity ratio has used and available regions; its percentage ticks are not individual records.

Prefer an anchored or reserved readout that keeps both the selected mark and explanation visible. Keep hit regions steady. Pointer movement should not make the chart chase the cursor or shift adjacent content. Keyboard focus and touch must provide the same information.

### Select

An explicit click, tap, or keyboard activation can keep a reading selected for closer inspection. Distinguish transient inspection from committed selection. Provide an obvious way to clear it, including Escape. Do not launch an action or navigate merely because someone hovers or focuses a mark.

### Compare

Show a difference only against a named reference with known data. Keep units explicit. A change from 68% to 72% is **4 percentage points**; it is not a 4% relative increase. Do not manufacture an earlier reading to make a static chart seem informative.

### Update

Respond to an actual data change or an explicitly labeled simulation. Preserve the reader's orientation through stable parts and identities. Keep tick coordinates fixed and update the value and occupied tick count together. The first study remains at 68% used; it does not simulate updates, animate from zero on initial appearance, or loop an idle waveform.

Reuse the active finish's existing `duration-base` and `easing-standard` for this study. These choices do not create new global motion tokens. A new timing or physical model needs its own review.

### Explain

Make the chart's question, data scope, and reading available in text. A complex chart may need a data table or expanded detail; this two-part ring needs a concise summary and explicitly named region controls. Keep actions that change real data separate from inspection.

## Use particles for a reason

Particles are an optional study layer. They do not carry the primary reading and do not make an unchanged chart appear live.

- An increase can gather a small group of flecks at the changed boundary.
- A decrease can withdraw flecks from that boundary.
- A flow view can move particles along real connections, with a documented encoding if they represent quantity.
- Keep particles brief, local, non-interactive, hidden from assistive technology, and clear of labels and hit targets.
- Particle count and speed are decorative unless an explicit scale defines them. Do not imply bytes, records, or events from decorative flecks.
- Compare the same update with and without particles. Keep the effect only if it adds useful feedback or character without distracting from reading.

## First study: storage ring

The existing ring shows **68% used and 32% available**. It retains 100 graduated radial ticks, the two inner references, and the center square. Longer marks calibrate five and ten percentage increments. The value is illustrative; total storage size, category breakdown, history, and thresholds are unknown.

- **Rest:** One primary used reading, its available complement, and the complete ring. No idle motion or particles.
- **Pointer inspection:** Inspect the used or available arc. The inner reference traces that region; available ticks gain semantic emphasis. Quantitative geometry and the Card remain fixed.
- **Keyboard inspection:** Focus the named Used or Available native control to inspect its region. Enter or Space selects it; Escape clears selection and transient inspection without moving focus.
- **Touch:** Tap the same named controls to select a region. No tiny individual tick targets or hover dependency.
- **Selection:** Keep the chosen region available after the pointer leaves or focus moves elsewhere. The control exposes its selected state, while the readout names the region and its share of 100 parts.
- **Reduced motion:** Show completed semantic emphasis immediately. Skip the tracing animation and tick transition.

The ring is a local docs study, not an exported component from `@zao/react`. Its geometry comes from the existing specimen and its materials and durations from existing tokens. No new dependencies or published values are required.

## Access and resilience

- Keep essential values visible, with a named chart summary. Do not place interactive controls inside an image role that hides their semantics.
- Use native, labeled controls and preserve their stationary focus outlines. Provide targets at least 24px across and keep labels readable in narrow layouts.
- If a later study uses temporary hover content, it must be hoverable, remain available for reading, and be dismissible when it obscures content. The first ring uses a reserved inline readout instead of an overlay.
- Announce meaningful selections and explicit updates politely. Do not announce every pointer movement, hover, or animation frame.
- Respect reduced motion and reduced transparency. Preserve static meaning when animation is removed.
- Before accepting a chart input API, define handling for zero, full capacity, out-of-range values, fractional values, unknown totals, and missing data. Unknown is not zero. The current demonstration has one fixed valid reading; it is not a general input API.
- Verify narrow layouts, light and dark Su, keyboard, touch, focus, and interrupted updates. Stop finite effects when replaced or when their owner disappears; never leave an idle animation loop.

## Grow the library from evidence

Start with the ring. Next, test the same information capabilities on category bars and a time series. Extract shared formatting, meaningful datum identity, inspection and selection state, accessible summaries, and finite update handling when a second chart demonstrates reuse. Keep particle feedback optional and separate from the quantitative marks.

Before promoting a pattern, judge whether readers can identify the value, understand its denominator, explain a change, inspect it with different inputs, and keep their place. Compare the static version and the motion version for comprehension, repeated use, and visual character. Record the learning rather than claiming a measured benefit from a finished animation.

## References

- [Quiet construction design notes](/foundations/design): shared direction and ownership of component decisions; the repository brief is `BRIEF.md`.
- [Hairline's process](https://hairline.lucasmarkes.com/inspo): give each figure a job, test assumptions in an adjustable instrument, and turn corrections into rules. Its geometry and timings remain references.
- [W3C content on hover or focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html): readable, hoverable, and dismissible temporary content.
- [W3C animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html): support disabling non-essential interaction animation.
