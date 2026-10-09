# Phase 2: fix list

_Part of the [ZAO improvement plan](README.md). Read that file first: its rules, definition of done and option-sheet format apply here._

## Goal

Every shipped component passes the contrast minimums and follows the same construction. Nothing on the docs site contradicts the direction in `BRIEF.md`.

## Why

The review measured two contrast failures in the field family (F5, F6) and found one component, Dialog, that follows none of the construction rules (F7). The smaller items (F8–F12) are each minor, and together they are what makes a careful system look unfinished.

## Order

WP 2.1, 2.5 (the rule fix) and 2.6 do not depend on Phase 1 and can start at once. WP 2.2 needs WP 1.1 so Dialog reads depth tokens from the start.

Until WP 1.3 promotes the study, the values for 2.1 live in `explorations/su-studies/quiet-instrument/style.css`. Fix them where they live at the time, and carry the fix through promotion.

## WP 2.1: Field edges that meet 3:1

**Gate:** ⛔ D6. Build the option sheet first, then stop.

**Reproduce**

- Light, invalid field: edge against canvas 1.85:1. Normal field: 6.86:1.
- Dark, any field: edge against canvas 2.03:1, fill against canvas 1.04:1.
- Dark, disabled field: same fill and edge as an enabled field.

**Option sheet**

Show the TextField specimen and the "Fields together" row in Su light and dark, with two or three edge treatments for each of: dark rest, light invalid, dark disabled. Give the contrast ratio beside every option. Every option must meet these minimums:

- The edge of an enabled field is at least 3:1 against the surface behind it, at rest, in both modes.
- The invalid edge is at least 3:1 and is not weaker than the normal edge.
- A disabled field differs from an enabled one by more than text color.

**Build, after the gate**

- Apply the chosen values through semantic tokens. If no existing role fits, propose a role in the PR; do not add a component-specific color.
- Add the three minimums above as tests. Use `packages/engine/src/contrast.ts` if the values are tokens by then, or a Playwright spec that reads computed colors if they still live in the study.

**Acceptance**

- The new tests pass in Su light and dark and fail when the old values are restored.
- TextField, Select and Combobox show the same edge behavior at rest, hover, focus, invalid and disabled.

## WP 2.2: Bring Dialog into the system

**Gate:** ⛔ D7 for construction, backdrop and motion. Step 1 needs no gate.

**Step 1, no gate: reuse the approved Button**

- `Dialog.Trigger` and `Dialog.Close` in `packages/react/src/components/dialog.tsx` style their own 32px buttons. Render them through `Button` with Base UI's `render` prop, the way `menu.tsx` renders its trigger. Trigger defaults to secondary; Close takes a `variant`.
- Update the specimen in `apps/docs/components/component-specimens.tsx` so the primary action is a real primary Button, with no hand-applied `bg-accent` classes.
- This changes the public shape of two parts. Write a changeset and update the docs API table.

**Step 2, option sheet**

Dialog has no approved construction. Propose two or three options built only from parts that are already approved:

- **Frame:** Card's static frame and contact edge, in place of the soft `material-overlay` shadow.
- **Backdrop:** none as now, a tone over the page, or another way of setting the page back. Report text contrast inside the dialog and how well the page behind is suppressed.
- **Entry and exit:** instant as now, or Menu's reveal from a stated joint. Coordinate with WP 3.5.

**Build, after the gate**

- Implement the chosen construction with depth tokens from WP 1.1. Keep Base UI focus trapping, Escape, outside-press dismissal, the accessible title and description, and scroll locking.
- Reduced motion shows the completed dialog at once.

**Acceptance**

- No blurred shadow remains on Dialog unless Yankun chose one.
- Trigger, Close and action heights match Button at every size.
- An axe-clean spec in Su light and dark, plus a keyboard spec: open, Tab cycle, Escape, focus returns to the trigger.

## WP 2.3: One emphasis rule for Menu items

**Gate:** ⛔ D8. This changes an approved treatment ("approved semantic row emphasis"), so show options first.

**Option sheet**

A highlighted Menu item currently shows a fill, an inset mark and, on keyboard focus, a 2px-rounded outline. Show the Menu open with pointer hover and with keyboard focus, in both modes, for: the current treatment; fill plus mark with the outline on keyboard focus only; and one cue only. Show square and 2px item corners.

**Build, after the gate**

- Apply the choice in `menu-item-construction` and to Select and Combobox items, which reuse the reveal.
- Item corners follow one radius token. Remove the per-item `rounded-control` if square was chosen.

**Acceptance**

- Menu, Select and Combobox items share one emphasis rule and one radius.
- The highlighted item is still identifiable in forced-colors mode.

## WP 2.4: Vertical Tabs alignment

**Gate:** ⛔ for the graduation spacing. The label alignment fix needs no gate.

**Build**

- Vertical primary Tabs center their labels in a shared column, which leaves ragged edges beside the rail. Align label edges toward the rail in LTR and RTL.
- The rail's graduations repeat every 4 fen regardless of where tabs sit, so registration ticks land between them. Prepare two options (graduations derived from tab positions, or end stops and registration ticks only) next to the current rail, and stop.

**Acceptance**

- Labels share one edge in both directions.
- The approved Tabs behavior in `BRIEF.md` (ticks extend on hover or focus, selection line compresses on press, stationary labels) is unchanged.

## WP 2.5: Table rule and status

**No gate for the rule. ⛔ D10 for status.**

**Build**

- The table is 832px wide inside an 842px scroll container, so row rules stop 10px short of the right frame while they meet the left. Find the cause in `packages/react/src/components/table.tsx` and make the rules meet the frame on both sides at every width, including when the table scrolls horizontally.
- For status, prepare an option sheet on the Table specimen: plain words as now, a small glyph or shape per status, and status color from the existing success, warning and danger roles. State how each reads in forced-colors mode and without color.

**Acceptance**

- A spec asserts the first body row's rule spans the frame's inner width at 1440px and at a narrow width.
- Status is not conveyed by color alone in any option that ships.

## WP 2.6: Docs chrome

**No gate.** These are docs bugs, not design decisions.

**Build**

- **Nav.** At 1440×900 the desktop nav holds 908px of links in a 788px scroll region, and Switch, Table and Tabs are hidden with no cue. Make every link reachable without the reader having to discover a hidden scroll area. Letting the nav scroll with the page is the simplest fix.
- **Menu preview.** The open Menu overlaps the text below its preview frame. Give overlay previews enough room.
- **Corners.** Code blocks and preview frames use `rounded-surface` while the components inside are square. After WP 1.3 they follow the promoted radius. If WP 1.3 has not landed, leave them and note it.

**Acceptance**

- `nav-construction.spec.ts` gains a case: at 1440×900 every nav link can be brought into view with the keyboard and the pointer.
- No preview overlaps content outside its frame when its overlay is open.

## WP 2.7: One default control height

**Gate:** ⛔ D9. This is a structural token and affects every finish.

**Prepare**

List every use of `size.control.md` (32px) and of the 34px height (`size.button.default`, the field family's default). Show the two candidate outcomes on the "Fields together" specimen and on the Dialog and Table toolbars.

**Build, after the gate**

- Apply the chosen default in `packages/tokens/src/base/space.tokens.json`. Update `h-8`/`h-button` guidance in `AGENTS.md`.
- A changeset that calls out the size change.

**Acceptance**

- A Button, a TextField, a Select and a Combobox at the default size share one height, proven by a spec.
- No component sets a raw control height.

## Out of scope

- Accent color. Status color, if chosen in D10, uses existing roles only.
- New Dialog features such as sizes, sheets or nested dialogs.
- Table sorting, selection or density changes.
