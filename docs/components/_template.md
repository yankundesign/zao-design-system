---
name: ComponentName
status: study
intent: Describe the user action or reading this component supports in one sentence.
use-when:
  - Describe a concrete task or context where this component fits.
avoid-when:
  - Describe a concrete task that needs a different existing component.
composes-with: []
parts: []
motions: []
tokens: []
---

# ComponentName

**Template approved Oct 11, 2026 (D14).** Yankun accepted the structure after reviewing the [Button pilot](button.md). Copy this file for the remaining existing exports. `status` records the component's design approval, not the template's approval. Use `approved`, `requested`, or `study`; record any unresolved behavior in the relevant section.

Front matter is YAML. Keep `name`, `status`, and `intent` as strings; keep the other six fields as lists of strings, including empty lists. `name` is the exact exported component name. `composes-with` names existing exports used together or through reuse; describe the direction and ownership in Interaction. `parts` lists only its literal authored `data-zao-slot` names, including conditional or sibling hooks. `motions` names existing spatial roles, such as `lift` or `seat`; functional loading belongs under Motion and its token under `tokens`. `tokens` uses existing DTCG token IDs, including dependencies read through shared utilities. Do not substitute CSS variable names, palette steps, or invented hooks.

Use the six sections below in this order. Optional tables, examples, and source/evidence notes stay inside them. Describe the present contract; keep proposed changes and unresolved approvals visibly separate.

**Website use.** This is the complete reference contract, not the public page layout. Component pages derive a short introduction from `intent` and a few selected usage notes, alongside their existing live examples and useful code. Keep metadata, exhaustive inventories, source/evidence notes, and decision history in the reference/agent documents. Do not render all six sections on the website.

## Anatomy

- Name the native target or reading region and the actual component marker.
- List the literal parts, their source owner, purpose, and condition for mounting. Identify portals and siblings explicitly.
- Describe CSS paint and physical concepts separately: a conceptual base, joint, or contact edge does not create a DOM slot.
- Record structural type, spacing, dimensions, and token dependencies. Numbers illustrate the current resolved tokens; implementations read the tokens.
- Link the component source, shared utilities, and relevant token sources.

## States

- List the current variants, sizes, and defaults from the public types.
- Describe rest, hover, focus, press, selection, disabled, loading, read-only, invalid, and empty states where applicable. Say which states do not apply.
- Separate visible treatment from native semantics. Record combined-state precedence and what remains stationary.
- Give each existing rule its recorded reason or a source-grounded explanation. Label a new rationale or claimed usability benefit as a hypothesis.

## Interaction

- Explain pointer, keyboard, and touch activation and cancellation using the actual primitive and handlers.
- State controlled/uncontrolled behavior, form behavior, and what the host owns.
- Record relevant public props, allowed values, and defaults; link their TypeScript source. Do not invent props or expose internal CSS state as API.
- Describe existing compositions and ownership of popup, modal, or asynchronous behavior.
- Add a short example using only existing exports and props when it helps explain the contract.

## Motion

- Map each actual transition to its duration and easing tokens. Include release and interrupted/reversed motion.
- Distinguish spatial roles, generic state emphasis, focus feedback, and functional loading.
- Describe reduced motion and unsupported-feature fallbacks from the implementation.
- Link existing motion decisions and evidence. Do not promise untested timing, performance, or behavior.

## Accessibility

- State native semantics, accessible name requirements, focus behavior, keyboard behavior, and announcements.
- Explain disabled and pending semantics, decorative parts, focus return, and dismissal where applicable.
- Record existing reduced-motion, forced-color, reduced-transparency, and RTL behavior where relevant.
- Link existing coverage and state its scope. A source review is not a fresh test pass.

## Decisions

Keep dated approvals and their reasons with exact source links. Transcribe the component's approval paragraphs from `BRIEF.md` word for word; identify the original text as historical where later approvals supersede it. Later approvals that have not reached `BRIEF.md` retain their actual source attribution.

For each later decision, name the date and decision ID, what remains current, what it supersedes, and its recorded reason. Distinguish an approved reason from an agent's explanation; preserve stated hypotheses.

The Button pilot leaves source approvals in place. The later migration replaces duplicated approvals with spec links in a separate reviewable change; docs rendering, manifests, and validation are also later work. Record a passed gate only after Yankun's choice.
