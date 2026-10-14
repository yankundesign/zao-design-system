# Motion

ZAO's component motions use **Lift**, **Seat**, **Slide**, **Reveal**, **Hold**, and **Impress**. Spatial motion changes a painted part while its native target, focus outline, labels where approved, and neighboring layout remain fixed. Color emphasis, registration-tick growth, and selection-line compression are **state changes**.

Since October 11, 2026, motion comes from rules ([finish plan](plans/2026-10-finish/README.md), V5 and V6). Curves come from the Song roof-fold rule, 举折; durations come from the eight timber grades, 材分八等. The roles below point at them. The declaration inventory further down is the WP 3.1 record of the October 10 baseline, kept for history: its durations, curves and paint paths are superseded where this section says so.

## Rules since October 11

### Curves: 举折

Raise the ridge, then fold each purlin below the chord from the eave to the purlin above it, each fold half the previous one: 1/10, 1/20, 1/40 and 1/80 of the rise for a ten-rafter hall. The roof profile from eave to ridge is the **exit** curve; turned 180° it is the **enter** curve. Both are faceted, five straight segments, drawn exactly with CSS `linear()`. `motion.config.ts` holds the rafter count; `pnpm motion` writes the curves into `src/motion/<finish>.generated.tokens.json`. The DTCG `$value` keeps a cubic fit for tools that cannot read `linear()`; the CSS and JSON exports carry the exact curve.

| Token                              | CSS custom property              | Su value                                                   |
| ---------------------------------- | -------------------------------- | ---------------------------------------------------------- |
| Enter (`motion.easing.fold-enter`) | `--zao-motion-easing-fold-enter` | `linear(0, 0.3 20%, 0.525 40%, 0.7083 60%, 0.8667 80%, 1)` |
| Exit (`motion.easing.fold-exit`)   | `--zao-motion-easing-fold-exit`  | `linear(0, 0.1333 20%, 0.2917 40%, 0.475 60%, 0.7 80%, 1)` |

### Durations: 材分八等

A part's duration is its grade's 材 height in 寸 times one unit, k = 30ms (`motion.grade-unit`). Heavier timber arrives later. Press is the exception: a seat is shorter than its release, so it stays at the fast duration.

| Grade  | 材 height | Duration | Example                                                        |
| ------ | --------- | -------- | -------------------------------------------------------------- |
| 1 一等 | 9 寸      | 270ms    | The exploded stage taking apart a whole workspace              |
| 2 二等 | 8.25 寸   | 247.5ms  | —                                                              |
| 3 三等 | 7.5 寸    | 225ms    | A Card's drawn → built states                                  |
| 4 四等 | 7.2 寸    | 216ms    | —                                                              |
| 5 五等 | 6.6 寸    | 198ms    | Reveal: Menu and field popups                                  |
| 6 六等 | 6 寸      | 180ms    | —                                                              |
| 7 七等 | 5.25 寸   | 157.5ms  | Lift and Slide: Button, Switch, Tabs, Progress; focus brackets |
| 8 八等 | 4.5 寸    | 135ms    | —                                                              |

### Su roles

Components read the role tokens, never a grade or a curve directly (finish plan rule 4). The exceptions are docs-local demonstrations and the focus brackets, which close in over grade 7 on the enter curve.

| Role        | Duration            | Curve                  | Used by                                                                            |
| ----------- | ------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| Lift        | Grade 7, 157.5ms    | Enter                  | Button and IconButton hover; Composer Send rise and placed tiles                   |
| Seat        | Fast, 80ms          | Standard               | Every press; accepted Composer Send hold; Card's 1px load-path dip                 |
| Slide       | Grade 7, 157.5ms    | Enter                  | Switch thumb, Tabs indicator, Progress span                                        |
| Reveal      | Grade 5, 198ms      | Enter                  | Menu, Select and Combobox popups; entering Conversation requests and docked Latest |
| Reveal exit | Fast, 80ms          | Exit                   | Closing popups; withdrawing docked Latest                                          |
| Hold        | 4 × grade 1, 1080ms | `steps(4, jump-end)`   | Press-and-hold safety delay; the duration remains under reduced motion             |
| Impress     | Grade 5, 198ms      | `steps(3, jump-start)` | ApprovalGate seal impression; first ink band lands at once                         |

Plan arrival draws each initial step on Reveal, staggered by one Fast duration. The rail's completed segment fills on Slide. A step added later draws without the stagger. ApprovalGate's record replaces its actions in the same row; an approved impression uses Impress. A part's drawing stays still while loading; when it becomes built, guidelines withdraw on Reveal exit, ink and face arrive on Reveal, and planes rise on Lift. The build duration is reveal exit + half Reveal + Lift, read from the computed roles.

Conversation requests reveal upward from the slip's lower edge without changing the native item box. Latest uses the same Reveal/Reveal exit roles while docked over the viewport. Composer's accepted Send seats on Seat and rises as Stop on Lift; added tiles rise on Lift, while tile and context-chip removal draw away on the exit curve for one Lift duration. The streaming Message reuses Button's existing loading role. Scroll eaves are driven by scroll position, with no duration or timed animation.

Dialog stays instant (V8). Reduced motion keeps every end state and removes travel, as before.

### Construction distances

| Short name    | CSS custom property        | Su value                                           |
| ------------- | -------------------------- | -------------------------------------------------- |
| Rest, small   | `--zao-depth-rest-small`   | 2px: Switch thumb, Tabs face                       |
| Rest, control | `--zao-depth-rest-control` | 3px: Button, popups                                |
| Rest, surface | `--zao-depth-rest-surface` | 4px: Card, Dialog, Table                           |
| Lift distance | `--zao-depth-lift`         | 2px, so a hovered Button stands 5px above its base |
| Contact       | `--zao-depth-contact`      | 1px: well steps and the load-path dip              |

A face rests its rest depth above a fixed base along the axis; hover lifts it by `lift`; press seats it onto the base, moving it back by its rest depth. The two banded planes between face and base move with the face on one registered value, `--zao-face-offset`.

## Reading planes

Keep each label and icon attached to its approved reading plane. Native targets, outside focus outlines, and neighboring layout stay fixed. Under D12 A, approved October 11, Button and IconButton ink travels with the face through hover, press, and release; their base stays fixed. Tabs labels, Switch setting labels, and Menu item labels belong to stationary reading planes, so their ink stays still while the selection face, switch face, or reveal edge moves. Reduced motion retains each component's existing stationary feedback. This rule describes those component approvals; it defines no interaction for another component.

## October 10 baseline values and notation

On October 10, Su light and dark, including Quiet instrument, inherited these published values from [Su's finish tokens](../packages/tokens/src/themes/su.tokens.json). Fast, Base, Loading, Standard, Contact, Lift and Axis keep these values today; the roles that used them now follow the rules above.

| Short name    | CSS custom property                        | Current Su value             |
| ------------- | ------------------------------------------ | ---------------------------- |
| Fast          | `--zao-motion-duration-fast`               | 80ms                         |
| Base          | `--zao-motion-duration-base`               | 160ms                        |
| Loading       | `--zao-motion-duration-loading`            | 1000ms per rotation          |
| Standard      | `--zao-motion-easing-standard`             | `cubic-bezier(0.2, 0, 0, 1)` |
| Contact       | `--zao-depth-contact`                      | 1px                          |
| Lift distance | `--zao-depth-lift`                         | 2px                          |
| Axis          | `--zao-depth-axis-x`, `--zao-depth-axis-y` | `(1, -1)`; right and up      |

These are baseline values, not a proposed retuning. Distances below are per screen axis, not Euclidean path lengths. A pressed Button travels 3px per axis from hover to seat, or 1px per axis from rest to seat.

**Reduced motion:** “None” below means a local `transition: none` or `animation: none` removes the animated property/name. The shared base-layer safety rule still sets computed transition and animation durations to `0.01ms !important`; a nonzero computed duration alone does not mean an animation runs. Utility color transitions have no local removal and complete at that safety duration. Tabs adds `transition: none !important`. Instant Dialog entry and exit are an explicit component approval, not a fifth motion.

## Declaration inventory

Each identifier corresponds to one source declaration. Where one shorthand serves several states or roles, repeated identifiers split those states/properties without omitting any entry. `T` is [theme.css](../packages/react/src/styles/theme.css), `S` is [switch.css](../packages/react/src/styles/switch.css), `P` is [progress.css](../packages/react/src/styles/progress.css), `A` is [tabs.css](../packages/react/src/styles/tabs.css), `C` is [composer.css](../packages/react/src/styles/composer.css), and `Q` is [Quiet instrument's style.css](../explorations/su-studies/quiet-instrument/style.css). Every source shorthand and timing override, including explicit suppression, is represented.

### Shared theme, Button, IconButton, and Menu

| ID / source | Component and state                                                            | Animated property or declaration                  | Distance or change                                                                                                       | Duration      | Easing                      | Motion                                                 | Reduced-motion behavior                                                     |
| ----------- | ------------------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------- | --------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| T01 · T:205 | Consumers of `duration-fast`; field/Tabs emphasis                              | `transition-duration`                             | Timing utility only; no geometry                                                                                         | Fast          | Does not set easing         | State change utility                                   | Shared `0.01ms` safety duration; study fields also remove transitions       |
| T02 · T:208 | Consumers of `duration-base`                                                   | `transition-duration`                             | Timing utility only; no geometry                                                                                         | Base          | Does not set easing         | Utility; role depends on consumer                      | Shared `0.01ms` safety duration                                             |
| T03 · T:242 | Dialog popup; enter, exit, interruption                                        | `transition: none`                                | Opaque stationary plane; no movement                                                                                     | No transition | Not used                    | None; approved instant appearance                      | Same instant appearance                                                     |
| T04 · T:243 | Dialog popup; enter, exit                                                      | `animation: none`                                 | No keyframe motion                                                                                                       | No animation  | Not used                    | None; approved instant appearance                      | Same                                                                        |
| T05 · T:252 | Dialog backdrop; enter, exit                                                   | `transition: none`                                | Canvas veil appears at 0.8 opacity; reduced transparency uses 1                                                          | No transition | Not used                    | None; approved instant appearance                      | Same; transparency preference is separate                                   |
| T06 · T:253 | Dialog backdrop; enter, exit                                                   | `animation: none`                                 | No keyframe motion                                                                                                       | No animation  | Not used                    | None; approved instant appearance                      | Same                                                                        |
| T07 · T:411 | Button pending/loading visual                                                  | `animation: zao-button-loading … linear infinite` | `transform: rotate(360deg)` in T:404–407; repeats only while pending                                                     | Loading       | `linear`                    | **Outside the four:** functional pending-work rotation | T08 removes animation; static loading mark remains                          |
| T08 · T:419 | Loading visual; reduced motion                                                 | `animation: none`                                 | Cancels T07                                                                                                              | No animation  | Not used                    | Suppression                                            | Static mark, not a shortened loop                                           |
| T09 · T:517 | Button/IconButton connected side; hover enter/leave                            | `clip-path`                                       | Polygon's moving vertices follow `(x, y)` from `(0, 0)` to `(axis.x × lift, axis.y × lift)`; fixed vertices stay on base | Fast          | Standard                    | Lift                                                   | T11 hides side and removes transition                                       |
| T09 · T:517 | Button/IconButton connected side; press/release                                | `clip-path`                                       | Same polygon follows pressed pose `(-axis.x × contact, -axis.y × contact)`; release returns to hover or rest             | Fast          | Standard                    | Seat; return uses destination pose                     | T11 hides side and removes transition                                       |
| T09 · T:517 | Button/IconButton connected side; enabled/disabled, quiet hover, press/release | `background-color`, `box-shadow`                  | Semantic side tone changes; shadow spread stays `lift` at normal depth                                                   | Fast          | Standard                    | State change accompanying Lift/Seat                    | T11 hides side; no transition                                               |
| T10 · T:532 | Button/IconButton face; hover enter/leave                                      | `transform`                                       | `translate(x, y)`; rest `(0, 0)`, hover `(axis.x × lift, axis.y × lift)`                                                 | Fast          | Standard                    | Lift                                                   | T12 removes transition and keeps transform `none`; hover uses fill feedback |
| T10 · T:532 | Button/IconButton face; press/release                                          | `transform`                                       | Seat `(-axis.x × contact, -axis.y × contact)`; 3px per axis from hover, 1px from rest at current depth                   | Fast          | Standard                    | Seat; return uses destination pose                     | T12 keeps face stationary; press feedback remains through fill              |
| T10 · T:532 | Button/IconButton face; semantic emphasis and state                            | `background-color`, `box-shadow`                  | Fill and inset semantic edge; no target/layout change                                                                    | Fast          | Standard                    | State change                                           | T12 removes transition; semantic fills still distinguish feedback           |
| T11 · T:590 | Button/IconButton side; reduced motion                                         | `transition: none`                                | Cancels all T09 entries; side `display: none`                                                                            | No transition | Not used                    | Suppression                                            | Fixed base retains contact edge                                             |
| T12 · T:594 | Button/IconButton face; reduced motion                                         | `transition: none`                                | Cancels all T10 entries; face transform `none`                                                                           | No transition | Not used                    | Suppression                                            | Fill-only hover/press feedback; target and outline stationary               |
| T13 · T:657 | Menu popup; opening/reopening                                                  | `--zao-menu-reveal-progress`                      | Registered number `p`: 0→1; derived clip inset and front lip traverse actual popup dimension                             | Base          | Standard                    | Reveal                                                 | T16 sets `p = 1` for all lifecycle states and removes transition            |
| T14 · T:683 | Menu popup `[data-ending-style]`; closing/reversal                             | `transition-duration` override of T13             | `p`: current value→0; no new duration on lip                                                                             | Fast          | Standard inherited from T13 | Reveal exit                                            | T16 shows completed frame until dismissal                                   |
| T15 · T:686 | Menu popup `[data-instant]`                                                    | `transition: none`                                | No reveal interpolation for instant lifecycle path                                                                       | No transition | Not used                    | Reveal suppression                                     | Same; T16 also fixes `p = 1`                                                |
| T16 · T:692 | Menu popup; reduced motion, including starting/ending states                   | `transition: none`                                | Cancels T13/T14; `p = 1`, popup transform `none`                                                                         | No transition | Not used                    | Suppression                                            | Whole completed frame, no lip travel                                        |
| T17 · T:823 | All elements and `::before`/`::after`; reduced motion                          | `transition-duration: 0.01ms !important`          | Shared safety override; does not itself remove properties                                                                | 0.01ms        | Existing easing retained    | Safety override                                        | Local suppression still owns spatial end states                             |
| T18 · T:824 | All elements and `::before`/`::after`; reduced motion                          | `animation-duration: 0.01ms !important`           | Shared safety override; does not set name or iteration count                                                             | 0.01ms        | Existing easing retained    | Safety override                                        | Loading's local `animation: none` prevents a fast repeating loop            |

Button and IconButton share these declarations; IconButton introduces no independent motion. The Menu trigger and Dialog actions reuse Button, so their action poses are covered by T09/T10. Menu's chevron changes to `rotate(180deg)` without a transition (T:612–621): that orientation change is instant and is not Reveal.

### Switch, Progress, Tabs, and Composer

| ID / source | Component and state                                                     | Animated property or declaration         | Distance or change                                                                           | Duration      | Easing   | Motion                                                                  | Reduced-motion behavior                                                                 |
| ----------- | ----------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- | ------------- | -------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| S01 · S:23  | Switch housing; off/on, enabled/disabled                                | `background-color`, `border-color`       | Semantic on/off fill/edge; stationary housing                                                | Fast          | Standard | State change                                                            | S04 removes transition; destination fill is immediate                                   |
| S02 · S:47  | Switch complete thumb; toggle/reverse                                   | `transform`                              | `translateX(position)`; travel `space.10 − space.4 − 2 × space.1` = 16px; RTL negates travel | Base          | Standard | Slide                                                                   | S04 removes transition; thumb goes directly to endpoint                                 |
| S03 · S:58  | Switch face; press/release                                              | `transform`                              | Rest `translateY(axis.y × contact)` = −1px; press `none` seats face by 1px                   | Fast          | Standard | Seat                                                                    | S04 removes transition; pressed face retains resting transform                          |
| S03 · S:58  | Switch face; enabled hover/press/release                                | `background-color`                       | Surface→hover/active semantic fill; no hover displacement                                    | Fast          | Standard | State change                                                            | Immediate fill feedback; no press movement                                              |
| S04 · S:95  | Switch housing, thumb, face; reduced motion                             | `transition: none`                       | Cancels S01/S02/S03                                                                          | No transition | Not used | Suppression                                                             | Direct on/off destination; fill identifies press                                        |
| P01 · P:39  | Progress indicator; actual determinate value update/reversal            | `width`                                  | Clamped fraction × track width; custom ranges use `(value − min) / (max − min)`              | Base          | Standard | Slide / quantitative span change; **layout property on absolute paint** | P02 removes transition; value span updates immediately                                  |
| P02 · P:76  | Progress indicator; reduced motion                                      | `transition: none`                       | Cancels P01                                                                                  | No transition | Not used | Suppression                                                             | Immediate measured span                                                                 |
| A01 · A:94  | Horizontal primary Tabs tick; enabled hover/focus enter/leave           | `block-size`, `background-color`         | Tick 4px→8px about fixed centerline; subtle→default edge ink                                 | Fast          | Standard | State change; **size property on absolute mark**                        | A06 removes transition; tick changes immediately                                        |
| A02 · A:111 | Primary/secondary Tabs indicator; selection/reversal/measurement update | `transform`, `inline-size`, `block-size` | Position and dimensions from Base UI `--active-tab-left/top/width/height`                    | Base          | Standard | Slide; **size properties on absolute indicator**                        | A06 removes transition; indicator uses destination geometry                             |
| A02 · A:111 | Secondary Tabs indicator; selected-tab press/release                    | `translate`                              | Rest has no individual translation; press `0 (-axis.y × contact)` = 1px down                 | Fast          | Standard | Seat                                                                    | A06 removes interpolation; current CSS still changes to pressed translation immediately |
| A02 · A:111 | Secondary Tabs indicator; selected-tab press/release                    | `background-color`, `box-shadow`         | Surface→hover fill; contact shadow→none                                                      | Fast          | Standard | State change accompanying Seat                                          | A06 removes transition; paint changes immediately                                       |
| A03 · A:127 | Horizontal primary Tabs selection line; selected-tab press/release      | `block-size`                             | 2px→hairline 1px around shared centerline                                                    | Fast          | Standard | State change; **size property on absolute mark**                        | A06 removes transition; compression is immediate                                        |
| A04 · A:234 | Vertical primary Tabs tick; enabled hover/focus enter/leave             | `inline-size`, `background-color`        | Replaces A01's property list: tick 4px→8px, subtle→default edge ink; block-size stays 1px    | Fast          | Standard | State change; **size property on absolute mark**                        | A06 removes transition; tick changes immediately                                        |
| A05 · A:251 | Vertical primary Tabs selection line; selected-tab press/release        | `inline-size`                            | Replaces A03: 2px→hairline 1px around shared centerline                                      | Fast          | Standard | State change; **size property on absolute mark**                        | A06 removes transition; compression is immediate                                        |
| A06 · A:295 | Tabs indicator, selection line, tick; reduced motion                    | `transition: none !important`            | Cancels A01–A05                                                                              | No transition | Not used | Suppression                                                             | Destination/pressed state immediate; targets/labels stay fixed                          |
| C01 · C:28  | Composer input; focus, typing, intrinsic textarea height                | `transition: none`                       | No animated resizing; input min/max line geometry uses current body type and fen scale       | No transition | Not used | None; deliberate stillness                                              | Same; actions retain their own Button motions                                           |

Progress first mounts at its first reading; unknown or invalid-range completion hides the occupied fraction and draws a stationary interrupted reference. There is no indeterminate animation declaration. Tabs' secondary tick is hidden; the inherited tick transition exists in the source but paints no secondary tick. Tabs' primary indicator also inherits color/shadow/individual-translation entries whose properties do not change in its ordinary primary states; declaration presence does not imply visible motion.

### Quiet instrument fields

These declarations apply only inside `.study[data-study='quiet-instrument']`. Published Select and Combobox popups have no independent reveal transition; the study installs this recipe. They use the same registered progress as Menu but their own selector and clip variables.

| ID / source | Component and state                                                           | Animated property or declaration      | Distance or change                                                | Duration      | Easing                      | Motion                   | Reduced-motion behavior                   |
| ----------- | ----------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------- | ------------- | --------------------------- | ------------------------ | ----------------------------------------- |
| Q01 · Q:146 | Study Select/Combobox popup; opening/reopening                                | `--zao-menu-reveal-progress`          | Registered `p`: 0→1; clip and lip traverse actual popup dimension | Base          | Standard                    | Reveal                   | Q05 fixes `p = 1` and removes transition  |
| Q02 · Q:172 | Study Select/Combobox popup `[data-ending-style]`; closing/reversal           | `transition-duration` override of Q01 | Current `p`→0                                                     | Fast          | Standard inherited from Q01 | Reveal exit              | Q05 shows completed frame until dismissal |
| Q03 · Q:175 | Study Select/Combobox popup `[data-instant]`                                  | `transition: none`                    | No interpolation for instant lifecycle path                       | No transition | Not used                    | Reveal suppression       | Same; Q05 also fixes `p = 1`              |
| Q04 · Q:240 | Study TextField/Select/Combobox field frames; reduced motion                  | `transition: none`                    | Removes the component's generated color transition                | No transition | Not used                    | State change suppression | Semantic edge/fill changes are immediate  |
| Q05 · Q:248 | Study Select/Combobox popup; reduced motion, including starting/ending states | `transition: none`                    | Cancels Q01/Q02; `p = 1`, transform `none`                        | No transition | Not used                    | Suppression              | Whole completed frame, no lip travel      |

## Geometry and cascade details

### One Reveal progress value

`@property --zao-menu-reveal-progress` is declared at T:625–629 with `<number>` syntax, `inherits: true`, and initial value 1. The popup transitions that number. Its descendants inherit each intermediate value; neither the clip path nor the lip needs a second transition. This is how reversal continues from the current uncovered fraction.

For Menu (T:632–696) and study fields (Q:124–177), let `p` be that number, `u = space.1` (4px), and `D` the full popup dimension on the collision side:

- Outset is `−u`; near inset is `−p × u`; far inset is `(1 − p) × 100% − p × u`.
- Bottom uses the far inset at the bottom; top swaps it to the top; left/right swap it to the corresponding horizontal side. Full-size popup and option targets do not scale or translate.
- The lip's enclosing box has `inset: −contact`. Its translation is `(p − 1) × 100%` at bottom/right, `(1 − p) × 100%` at top/left. Percentages resolve against that lip box, including the contact outset. The painted front edge has thickness `contact`; its top/bottom/left/right placement follows `data-side`.
- Popup closing changes duration to Fast and keeps Standard easing. `[data-instant]` removes transition. Reduced motion additionally forces `p = 1` even while Base UI has starting/ending attributes.

Actual formulas for Menu's lip are at T:704–746; the field counterpart is Q:195–235. The edge only paints, with `pointer-events: none`. Viewport scrolling and option selection do not move the lip independently.

### Input modality, disablement, and color preferences

- Button hover lift requires `(hover: hover) and (pointer: fine)`. Pointer press requires active+hover there; coarse/nonhover press uses `:active`. Keyboard/touch bookkeeping also applies `[data-zao-pressed]`. Disabled/data-disabled selectors do not acquire those poses. Filled primary/secondary normal-motion hover retains its resting face fill; quiet hover fills its transparent face. Reduced-motion hover has an explicit semantic fill path.
- Switch hover fill requires fine hover and excludes disabled/read-only states; press also excludes them. RTL negates only channel travel. Reduced motion retains the face's resting contact transform while changing pressed fill.
- Tabs hover/focus tick extension excludes disabled tabs. Press compression/seating follows the active tab's `:active` or `[data-zao-pressed]`. RTL changes tick/rail drawing alignment but does not add a timing override. The measurement-driven indicator uses Base UI's actual tab geometry.
- Forced colors alter Switch, Progress, primary Tabs marks, and highlighted Menu/Select/Combobox item colors. They introduce no transition/animation timing declaration. In the Switch forced-color recipe, the normal hover face fill becomes Canvas, so a color interpolation may have identical endpoints. Progress loses its contact shadows but retains quantitative geometry. Menu items use system-color Highlight/HighlightText.
- Reduced transparency changes overlay material and the Dialog veil's opacity end value. It introduces no animation or timing change. Material is separate from Reveal's registered progress.
- Card, Table's status glyphs and row emphasis, and Conversation contain no animated declaration of their own. `conversation.css` also fixes `scroll-behavior: auto`; this is not a transition or keyframe animation. Explicit actions in their specimens retain shared Button behavior.

## Additional generated state changes

The source inventory above is exhaustive for the two stylesheet locations named by WP 3.1. Four component class lists additionally ask Tailwind to generate `transition-colors duration-fast`; that generated declaration must be included in WP 3.2's computed comparison, even though it is outside the requested stylesheet scan.

| Component source                                                                             | State and property family                                      | Duration | Current generated easing       | Reduced motion                                                                   |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------- | ------------------------------ | -------------------------------------------------------------------------------- |
| [text-field.tsx](../packages/react/src/components/text-field.tsx), `transition-colors` class | Input/frame edge, fill, text emphasis; no geometry             | Fast     | `cubic-bezier(0.4, 0, 0.2, 1)` | Shared 0.01ms safety duration; Q04 removes study frame transition                |
| [select.tsx](../packages/react/src/components/select.tsx), trigger                           | Field edge/fill/text emphasis; no geometry                     | Fast     | `cubic-bezier(0.4, 0, 0.2, 1)` | Same                                                                             |
| [combobox.tsx](../packages/react/src/components/combobox.tsx), input group                   | Field edge/fill/text emphasis; no geometry                     | Fast     | `cubic-bezier(0.4, 0, 0.2, 1)` | Same                                                                             |
| [tabs.tsx](../packages/react/src/components/tabs.tsx), native tab                            | Label color and secondary inactive-tab hover fill; no geometry | Fast     | `cubic-bezier(0.4, 0, 0.2, 1)` | Shared 0.01ms safety duration; A06 covers indicators/marks, not native-tab color |

The generated property list is `color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to`. Its timing function reads `--tw-ease` or Tailwind's `--default-transition-timing-function`. Removing `--ease-*` utilities in the theme does not remove that separate default variable. No `ease-standard` class is applied by these four components. This baseline difference must be preserved during a no-visual-change extraction; changing state-change easing needs a separate value decision.

## Findings and role extraction notes

1. **Spatial timing is coherent at today's values.** Button/IconButton Lift and Seat, Switch Seat, and secondary Tabs Seat use Fast/Standard. Switch, Tabs indicator geometry, and Progress Slide use Base/Standard. Menu and study-field Reveal enter uses Base/Standard; their exit uses Fast/Standard. The four spatial motions have no pair with different current timing for the same direction.
2. **Enter and exit differ in duration, not easing.** Reveal is 160ms in and 80ms out. A role extraction must retain both values. A single Reveal duration used for both directions would change behavior.
3. **Lift and Seat share declarations in Button.** Both its face transform and connected-side clip path serve hover and press. Their spatial duration/ease uses a private pair selected by the destination state; their color/shadow entries remain state changes. Both roles retain 80ms/Standard under D11's Oct 10 approval. A future approved tuning can give press and hover independent values without editing the approved poses.
4. **Size transitions are explicit.** Progress animates `width`; Tabs animates `inline-size`/`block-size` on its indicator, ticks, and selection lines. These are layout-affecting CSS properties on absolutely positioned paint, so they can perform layout work even though native targets and neighboring flow are fixed. Keep them for a no-visual-change extraction; do not silently replace them with scale transforms.
5. **The loading indicator is outside the four motions.** It uses an existing 1000ms linear repeating rotation during pending work. It is functional loading feedback, not new ambient motion. Keep its loading role and reduced-motion cancellation; do not assign it to Slide or Reveal or add a new motion as part of WP 3.2.
6. **Primary Tabs compression is a state change.** It changes a drawing mark's thickness, rather than seating a face. Tick growth is likewise a state change. Keep Fast/Standard there. Secondary Tabs' separate `translate` is Seat, while its measured position/dimensions are Slide.
7. **Reduced motion differs by component intentionally.** Button and Switch replace displacement with fill feedback. Tabs still immediately changes pressed translation/line thickness; Progress immediately changes measured span. Reveal shows the complete frame. Dialog is already instant. Preserve these existing protections and report computed properties as well as timing numbers.
8. **Color easing has a baseline mismatch.** Generated field/native-tab color transitions use Tailwind's `(0.4, 0, 0.2, 1)` default, while explicit housing/face/tick color transitions use Standard `(0.2, 0, 0, 1)`. Their Fast durations agree. Do not normalize this discrepancy in the role extraction.

WP 3.2 uses `motion.duration.lift`, `.seat`, `.slide`, `.reveal`, and `.reveal-exit`, with `motion.easing.lift`, `.seat`, `.slide`, `.reveal`, plus `.exit`. Each is an alias of the baseline Fast/Base/Standard value as appropriate; Reveal exit retains its own Fast duration. Fast/Base/Standard remain available for state changes. D11 was resolved Oct 10 by retaining these current values: lift, seat, and reveal exit 80ms; slide and reveal 160ms; all role curves `cubic-bezier(0.2, 0, 0, 1)`. Future value changes require separate approval. Yu's completeness aliases retain its deferred existing values. The Oct 13 components plan adds Hold (four grade-1 beats) and Impress (grade-5 duration); their separate `steps()` curves preserve the band counts and jump positions in the JSON export.

## WP 3.2 computed comparison checklist

Capture the baseline before runtime edits, and attach the before/after result, not just token equality:

- Every real component page in Su light/dark, both published and actual Quiet instrument: rest, hover, held pointer press, and outside keyboard focus. Include all Button variants and IconButton; shared action consumers Menu trigger, Dialog actions, Card/Table/Composer actions keep the same construction.
- Record matched selector/slot, full ordered `transition-property`, `transition-duration`, `transition-timing-function`, and `transition-delay` lists. Record animation name/duration/ease/iteration/direction/play-state for loading. Include `::before`/`::after`, transformed faces, Switch thumb+face, both Tabs variants/orientations/tick+line, and Progress indicator.
- For Button, compare both hover→seat and rest→seat and the destination state's release. Capture the connected side's clip path and the face transform. Preserve disabled and reduced-motion states separately.
- For Reveal, compare open/rest, starting, ending, interrupted/reversed, `[data-instant]`, and all collision sides. Sample the registered progress, derived clip path, and lip transform with the popup and row rectangles to prove they remain synchronized while native boxes stay fixed. Include Menu and **actual study** Select/Combobox; published field popups are instant and need their own baseline entries.
- For Slide, compare Switch endpoints/reversal in LTR/RTL, Tabs selection between unequal tab dimensions and both orientations, and Progress zero/full/fractional/custom range/unknown. Capture the destination geometry as well as timing; no retiming of state-color entries.
- Emulate reduced motion and forced colors. `transition-property: none` with a computed 0.01ms duration is expected for local suppression. A loading animation name must be `none` under reduced motion. Retain the existing reduced-motion specs unchanged.

## Completeness evidence

The baseline scan strips CSS comments, then records every `transition`, `animation`, and prefixed timing longhand declaration in `packages/react/src/styles/*.css` and the study stylesheet. There are **36 declarations**, including suppression and shared timing utilities. The tables above cover all 36 identifiers; shared shorthand entries are expanded by state/role where needed.

| File                                                 | Declaration count | Identifiers |
| ---------------------------------------------------- | ----------------- | ----------- |
| `packages/react/src/styles/theme.css`                | 18                | T01–T18     |
| `packages/react/src/styles/switch.css`               | 4                 | S01–S04     |
| `packages/react/src/styles/progress.css`             | 2                 | P01–P02     |
| `packages/react/src/styles/tabs.css`                 | 6                 | A01–A06     |
| `packages/react/src/styles/composer.css`             | 1                 | C01         |
| `packages/react/src/styles/conversation.css`         | 0                 | None        |
| `explorations/su-studies/quiet-instrument/style.css` | 5                 | Q01–Q05     |

Private supporting files live in `explorations/snapshots/private/motion-inventory-20261010/`: `declarations.json` contains the exact baseline declarations and line numbers; `source-manifest.json` records file hashes/counts; `sources/` preserves the scanned source. These files are evidence, not published defaults or an additional runtime style.

### WP 3.2 comparison

The comparison uses immutable production builds after D9 C, before and after the role extraction. It injects the corresponding saved/current Quiet instrument stylesheet so the baseline server's live style API cannot accidentally supply the later recipe.

| Comparison                          | Scope                                                                                                                                                                              | Result                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Normal computed styles and geometry | 14 existing component pages × published/study × light/dark × rest/hover/held pointer press/native keyboard state = 224 records                                                     | Exact match for every record, including ordered timing/property lists and painted geometry |
| Normal preview pixels               | Same 224 complete preview regions, excluding the separately changed docs nav                                                                                                       | All 224 images exactly equal; zero changed pixels and no tolerance                         |
| Supplemental timing states          | 168 records: existing Button/IconButton variants, opened Dialog actions, Reveal open/ending/instant, Switch's opposite and RTL endpoint, both Tabs variants, Progress span updates | All ordered computed timing lists exactly equal                                            |
| Accessibility preferences           | All 14 pages × published/study × light/dark, with reduced motion and forced colors separately = 112 records                                                                        | All ordered computed timing lists exactly equal                                            |
| Opened Dialog frame pixels          | Published/study × light/dark = 4 frames                                                                                                                                            | All four images exactly equal                                                              |

Progress is a passive reading and has no native keyboard target; its keyboard-state row records the unchanged reading during native document navigation. No artificial focus target is added. Loading's existing infinite animation is paused at angle zero for repeatable pictures while its computed name, duration, linear easing, and iteration count are compared. Reveal end-state measurements explicitly wait for registered progress 1. Early probe samples at different live animation frames are preserved as rejected measurement attempts, not runtime defects.

Supplemental exit/instant checks deterministically replay lifecycle attributes on mounted real popups to compare the CSS cascade. Progress updates use the existing spec's direct indicator-width fixture; they check transition timing without claiming a new published update API. These comparisons supplement the unchanged browser interaction/reduced-motion specs.

`verification.json`, `before-computed.json`, `after-computed.json`, `pixel-comparison.json`, and the supplemental timing JSON files are in the private evidence folder. `compare.cjs`, `extra.cjs`, and `verify-result.cjs` reproduce the comparison.
