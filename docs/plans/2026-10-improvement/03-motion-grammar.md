# Phase 3: motion grammar

_Part of the [ZAO improvement plan](README.md). Read that file first: its rules, definition of done and option-sheet format apply here._

## Goal

ZAO has a small, named set of motions. Each component uses one of them, each motion has its own duration and easing roles, and Yankun can tune those roles in one place.

## Why

The direction is about physical response, and the motion vocabulary is two durations and one curve used for everything (F13). Button moves its label on hover while every other component keeps labels still (F14). Dialog does not move at all (F7). The best motion in the system, Menu's reveal, runs too fast to inspect and is documented only in prose.

This phase does not make ZAO move more. "Response is quiet and meaningful" in `BRIEF.md` still holds.

## The four motions

These names describe what the approved components already do. They are a vocabulary, not new behavior.

| Motion     | What happens                                                    | Used by today                                              | Distance comes from      |
| ---------- | --------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------ |
| **Lift**   | A face travels along the axis toward the viewer                 | Button and IconButton hover                                | The lift token           |
| **Seat**   | A face travels along the axis onto its base                     | Button, Switch thumb and secondary Tabs indicator on press | The contact token        |
| **Slide**  | A face travels within a fixed track                             | Switch, Tabs indicator, Progress                           | The track's own geometry |
| **Reveal** | A stationary plane is uncovered from its joint by a moving edge | Menu, Select, Combobox                                     | The popup's own size     |

Hover color changes and tick growth are state changes, not motions. They keep the existing fast duration.

## Read first

- Every `transition` in `packages/react/src/styles/` and in `explorations/su-studies/quiet-instrument/style.css`.
- `@property --zao-menu-reveal-progress` and `menu-construction` in `theme.css`.
- The reduced-motion blocks in each stylesheet, and the base-layer rule at the end of `theme.css`.
- The motion entries in `packages/tokens/src/themes/su.tokens.json`.

## WP 3.1: Motion inventory

**No gate. No code change.**

Write `docs/motion.md` with one row per transition: component, state change, property, distance, duration token, easing, which of the four motions it is (or "state change"), and its reduced-motion behavior. Flag anything that fits none of the four, anything that animates a layout property, and any pair of components that do the same thing with different timing.

**Acceptance:** every `transition` and `animation` declaration in the two locations above appears in the table.

## WP 3.2: Role tokens, no visual change

**Depends on:** WP 3.1.

**Build**

1. Add a duration role and an easing role for each of the four motions, plus an exit easing. Set every one to today's value, so nothing changes on screen. Names are your choice. Add completeness entries for Yu (rule 4 in the README).
2. Keep `motion.duration.fast` and `motion.duration.base` for state changes and as the values the roles start from.
3. Point each component transition at its role. Menu, Select and Combobox closing use the exit easing role.
4. Add the roles to the engine registry.

**Acceptance**

- No component stylesheet references `duration-fast` or `duration-base` for one of the four motions.
- No visual or timing change: computed `transition-duration` and `transition-timing-function` for every component match the inventory from WP 3.1. Attach the comparison.
- All reduced-motion specs pass unchanged.

## WP 3.3: Motion page and tuner

**Gate:** ⛔ D11. The page ships without a gate. Token values change only after Yankun gives them.

**Build**

A Foundations → Motion page in the docs with:

- The four motions, each with a live specimen built from the real components and a one-line rule.
- A speed control (for example 1×, 0.5×, 0.25×, 0.1×) that slows the specimens, so a reader can inspect the Reveal's edge and the Button's seat. Implement it for the page's islands only.
- A tuner: one duration slider and one easing editor per role, writing CSS variables on the page. Start every control at the current token value. Add a "copy values" output Yankun can paste back.
- The inventory table from WP 3.1, rendered from `docs/motion.md`.

Directions from the review for Yankun to try in the tuner (suggestions, not values): a press that is shorter than its release; an exit curve that accelerates where the enter curve decelerates; a hover lift slightly longer than the press.

**Build, after the gate**

Write the values Yankun returns into the role tokens. Changeset.

**Acceptance**

- The page works with the keyboard, and with reduced motion on it explains that specimens are shown at their end state.
- The tuner changes nothing outside the page.
- After the gate: tokens equal the returned values exactly.

## WP 3.4: Button label stillness

**Gate:** ⛔ D12. This touches the approved Button. Option sheet first.

**Option sheet**

Build each option as docs-only CSS and show it in a dense toolbar of six to eight Buttons and IconButtons, plus the standard Button specimen, with a recording at normal speed and at 0.25×:

- **A, as now.** Face and label lift together, 2px up and right.
- **B, base moves.** Face and label stay where they are; the base and side extend down and left to show the same depth.
- **C, face moves, label stays.** The face lifts and the label is held still.

For each, note what happens to the hit area, the focus outline, the icon in IconButton, and the reduced-motion fallback.

**Build, after the gate**

Implement the choice in `button-construction` and update the Button approval text in the component's spec (or `BRIEF.md` if specs do not exist yet).

**Acceptance**

- `button-elevation.spec.ts` is updated to assert the chosen behavior and still asserts a stationary hit area, focus outline and neighbors.
- The stillness rule is stated once and is true for Button, Tabs, Switch and Menu.

## WP 3.5: Dialog entry and exit

**Gate:** ⛔ D7, shared with WP 2.2.

Implement the entry and exit Yankun chose for Dialog using the existing motions and their role tokens. Interrupting an opening dialog reverses it from its current position. Reduced motion shows the end state.

**Acceptance:** a spec opens and closes the dialog mid-transition and finds no jump in position or opacity.

## WP 3.6: Interruption coverage

**No gate.**

Switch and Menu already reverse from their current position. Add the same check for the Tabs indicator, Progress, Select and Combobox: start a transition, reverse it midway, and assert the animated value continues from where it was.

## Out of scope

- Springs, overshoot, stagger, ambient or looping motion. The approvals in `BRIEF.md` rule out overshoot (Switch), row stagger (Menu) and idle motion (Progress).
- Page transitions and scroll-linked effects, except the construction toggle in Phase 4.
- A JavaScript animation library.
