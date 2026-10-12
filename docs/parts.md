# Parts

ZAO names a component’s functional parts with `data-zao-slot` and identifies its authored container with `data-zao-component`. These are existing styling hooks, not a replacement for native semantics or the component API. Qualify a part by its owning component before styling it: the same role can have different native semantics or paint in different components.

This catalog includes all 71 package-authored slot names and all 15 component markers. Names are static; parts may be conditional, portal-mounted, or supplied by a compound component. Host-added hooks and Base UI’s internal focus guards, hidden form fields and positioners are outside this catalog. An icon implementation must forward supplied SVG props to expose its `icon` hook.

The source owners below identify where a hook is authored. Reused Button hooks remain Button-authored even when a component composes Button. No public hooks need renaming for this catalog.

## Component markers

| Value          | Authored marker and ownership                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------- |
| `button`       | Native Base UI action target. The painted face is a child; the loading announcement is a sibling. |
| `card`         | The stationary content frame itself. Card authors no slot attributes.                             |
| `combobox`     | Labeled outer field wrapper, containing editing parts and its locally mounted popup portal.       |
| `composer`     | Native controlled form and stationary writing tray.                                               |
| `conversation` | Named transcript section.                                                                         |
| `dialog`       | Modal `Dialog.Popup`, not the Root provider or its trigger/backdrop/viewport.                     |
| `icon-button`  | Wrapper around a shared `button` target and its locally mounted tooltip.                          |
| `menu`         | Wrapper around the Button trigger and its locally mounted popup portal.                           |
| `message`      | Named article with author and lifecycle.                                                          |
| `progress`     | Base UI progress root containing the header and measured track.                                   |
| `select`       | Labeled outer field wrapper, containing the trigger and locally mounted popup portal.             |
| `switch`       | Base UI native switch target and stationary housing.                                              |
| `table`        | Stationary frame outside the named scroll area and native table.                                  |
| `tabs`         | Base UI tabs root.                                                                                |
| `text-field`   | Base UI field wrapper containing label, control and guidance.                                     |

Shared Button hooks also appear through IconButton, Menu.Trigger, Dialog.Trigger/Close, Conversation.Latest and Composer actions. The table below lists source authors, so these inherited hooks do not change the exact file inventory.

## Part names

| Part name              | One-line definition                                                                                             | Source authors                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `actions`              | Explicit action row in a Composer tray or beneath a Message.                                                    | Composer, Message                                                                |
| `announcement`         | Visually hidden polite transcript lifecycle feedback.                                                           | Conversation                                                                     |
| `attachment-name`      | Visible filename of an included Composer attachment.                                                            | Composer                                                                         |
| `attachment-preview`   | Loaded image preview of an included attachment; the fallback file icon has no slot.                             | Composer                                                                         |
| `attachments`          | Named list of included attachments.                                                                             | Composer                                                                         |
| `author`               | Visible authorship that names a Message article.                                                                | Message                                                                          |
| `backdrop`             | Semantic page veil behind a modal Dialog.                                                                       | Dialog                                                                           |
| `body`                 | Native table body group (`tbody`).                                                                              | Table                                                                            |
| `button-content`       | Inline group for a Button label and optional leading/trailing icons.                                            | Button                                                                           |
| `button-label`         | Visible Button children when visual/loading content requires a group; plain children may have no label wrapper. | Button                                                                           |
| `caption`              | Native table caption (`caption`).                                                                               | Table                                                                            |
| `cell`                 | Native table data cell (`td`).                                                                                  | Table                                                                            |
| `clear`                | Named action that clears the committed Combobox value.                                                          | Combobox                                                                         |
| `clear-space`          | Reserved width for the Combobox clear action, preserving input geometry.                                        | Combobox                                                                         |
| `close`                | Dialog dismissal action rendered through the shared Button.                                                     | Dialog                                                                           |
| `content`              | Ordinary React content within a Message.                                                                        | Message                                                                          |
| `context`              | Optional container for host-supplied Composer context.                                                          | Composer                                                                         |
| `context-chip`         | Removable Composer context tag provided by ComposerContextChip.                                                 | Composer                                                                         |
| `context-icon`         | Optional decorative icon identifying a context tag.                                                             | Composer                                                                         |
| `control`              | Native text input rendered by Base UI Field.Control.                                                            | TextField                                                                        |
| `description`          | Optional accessible guidance for a field or modal Dialog.                                                       | Combobox, Dialog, Select, TextField                                              |
| `empty`                | No-match message in the Combobox popup.                                                                         | Combobox                                                                         |
| `error`                | Visible field, send or response failure and recovery guidance.                                                  | Combobox, Composer, Message, Select, TextField                                   |
| `face`                 | Front painted plane: Button content surface or Switch thumb surface.                                            | Button, Switch                                                                   |
| `footer`               | Native table footer group (`tfoot`).                                                                            | Table                                                                            |
| `graduation`           | Minor primary vertical Tabs mark at an actual adjacent-tab gap midpoint.                                        | Tabs                                                                             |
| `guidance`             | Visually hidden Composer keyboard instructions associated with the draft.                                       | Composer                                                                         |
| `head`                 | Native table header cell (`th`) with row or column scope.                                                       | Table                                                                            |
| `header`               | Heading group: Table column section, Message authorship row or Progress label/readout row.                      | Message, Progress, Table                                                         |
| `icon`                 | Decorative IconButton action glyph or Select trigger caret.                                                     | IconButton, Select                                                               |
| `indicator`            | Measured state carrier: Tabs selection decoration or Progress quantitative span.                                | Progress, Tabs                                                                   |
| `indicator-space`      | Reserved item width for a choice component's committed-value checkmark.                                         | Combobox, Select                                                                 |
| `input`                | Editable Combobox query input or Composer draft textarea.                                                       | Combobox, Composer                                                               |
| `input-group`          | Stationary Combobox field frame around input, clear space and trigger.                                          | Combobox                                                                         |
| `item`                 | One Menu action, choice option or native Conversation list item.                                                | Combobox, Conversation, Menu, Select                                             |
| `item-indicator`       | Checkmark for a choice component's committed value, independent of navigation emphasis.                         | Combobox, Select                                                                 |
| `item-text`            | Visible label of a choice option.                                                                               | Combobox, Select                                                                 |
| `items`                | Scrollable Menu action container inside its popup frame.                                                        | Menu                                                                             |
| `label`                | Accessible field/task name; Composer's required label is visually hidden.                                       | Combobox, Composer, Progress, Select, TextField                                  |
| `latest`               | Shared Button returning the Conversation viewport to the latest response.                                       | Conversation                                                                     |
| `leading-icon`         | Optional decorative Button glyph before its visible label.                                                      | Button                                                                           |
| `list`                 | Base UI options/tabs list or native ordered Conversation list.                                                  | Combobox, Conversation, Select, Tabs                                             |
| `loading-announcement` | Polite Button loading feedback outside the native target; present when loading is supplied.                     | Button                                                                           |
| `loading-overlay`      | Centered spinner plane replacing visible Button label ink during label-based loading.                           | Button                                                                           |
| `menu-indicator`       | Decorative caret identifying Menu's labeled trigger.                                                            | Menu                                                                             |
| `metadata`             | Optional Message supporting information such as time or source count.                                           | Message                                                                          |
| `panel`                | Base UI Tabs content panel associated with a tab.                                                               | Tabs                                                                             |
| `popup`                | Popup content frame: floating Menu/choice content or a modal Dialog.                                            | Combobox, Dialog, Menu, Select                                                   |
| `portal`               | Local portal wrapper mounting Menu/choice floating content.                                                     | Combobox, Menu, Select                                                           |
| `rail`                 | Primary Tabs guide carrying end stops and graduations.                                                          | Tabs                                                                             |
| `reveal-edge`          | Decorative lip following popup reveal clipping toward the far frame edge.                                       | Combobox, Menu, Select                                                           |
| `root`                 | Owning native/provider wrapper for the component's parts and semantics.                                         | Combobox, Conversation, Menu, Message, Progress, Select, Switch, Tabs, TextField |
| `row`                  | Native table row (`tr`), optionally marked as visually selected.                                                | Table                                                                            |
| `scroll-area`          | Named keyboard-focusable horizontal scroll region around the native table.                                      | Table                                                                            |
| `selection-line`       | Primary Tabs selected line centered on the ruler guide.                                                         | Tabs                                                                             |
| `separator`            | Semantic divider between Menu action groups.                                                                    | Menu                                                                             |
| `side`                 | Decorative Button layer carrying the two banded side planes between face and fixed base.                        | Button                                                                           |
| `spinner`              | Decorative loading SVG using Button's functional loading motion.                                                | Button                                                                           |
| `status`               | Visible non-complete Message lifecycle wording.                                                                 | Message                                                                          |
| `tab`                  | Native Base UI tab target with stationary label and focus outline.                                              | Tabs                                                                             |
| `table`                | Native table reading plane inside the outer frame.                                                              | Table                                                                            |
| `thumb`                | Connected Switch moving assembly carrying its face and shaded side.                                             | Switch                                                                           |
| `tick`                 | Decorative primary Tabs registration mark for one target.                                                       | Tabs                                                                             |
| `title`                | Accessible Dialog title.                                                                                        | Dialog                                                                           |
| `tooltip`              | IconButton's hover/focus label, with Base UI dismissal and hover behavior.                                      | IconButton                                                                       |
| `track`                | Stationary recessed Progress scale and frame.                                                                   | Progress                                                                         |
| `trailing-action`      | Decorative Button indicator pinned to the end of its face; not a second actionable target.                      | Button                                                                           |
| `trailing-icon`        | Optional decorative Button glyph after its visible label.                                                       | Button                                                                           |
| `trigger`              | Native owner action opening Menu, choice or Dialog content.                                                     | Combobox, Dialog, Menu, Select                                                   |
| `value`                | Visible committed Select value or formatted Progress reading.                                                   | Progress, Select                                                                 |
| `viewport`             | Bounded view/scroll wrapper for choices, Tabs or Conversation; Dialog's modal positioning and scroll viewport.  | Combobox, Conversation, Dialog, Select, Tabs                                     |
| `writing`              | Composer group containing its label, draft input and guidance/error feedback.                                   | Composer                                                                         |

## Construction concepts and DOM paint

| Concept      | Actual current implementation                                                                                                                                                                                                                                                                                                                                                | Audit conclusion                                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Face         | Button and Switch have a literal `face` slot. Secondary Tabs paints its selection `indicator` as a face. Progress paints its quantitative `indicator` as a face. Card's content plane is the component element.                                                                                                                                                              | Definition is consistent. Functional carrier names may differ from anatomical names; no replacement hooks are needed.                              |
| Side         | Two banded planes between a face's trailing edges and its base (finish plan V2, Oct 11). Button paints them on its `side` slot (`::before` across the axis's x component, `::after` across y). Card, Dialog, Table, Menu, Select and Combobox popups, the Switch `thumb` and the secondary Tabs `indicator` paint them on their own pseudo-elements (`construction-planes`). | Button's `side` slot exists so its own `::after` can carry the focus brackets. Elsewhere the planes are CSS paint; avoid fictional DOM nodes.      |
| Base         | The native box moved a rest depth (`depth.rest.small`, `control` or `surface`) back along the axis. No element paints it alone; the planes end at its edges. The native Button element owns the hit area; its focus brackets (`::after`) stay outside the part. Switch's stationary root is the housing.                                                                     | The README's physical “base holds target/focus” description is conceptual; clarify ownership in docs. Do not rename Switch thumb to base.          |
| Contact edge | The banded planes replace the drawn contact on Button, Card, Dialog, Table, Menu, Select and Combobox popups, the Switch thumb and the secondary Tabs face. Fields, Progress, the Switch channel and the secondary Tabs list are recessed wells with stepped inner walls (`construction-well`). Composer keeps its tray contact.                                             | No `contact-edge` slot exists. Drawing and structure remain independent of depth; naming a conceptual edge need not add a hook.                    |
| Joint        | The relationship between an owner trigger and the floating popup's collision-resolved placement. `reveal-edge` begins there, then becomes the far edge.                                                                                                                                                                                                                      | No `joint` slot exists. The reveal edge is a moving part, not another name for the joint. Base UI `[data-side]` is placement, not anatomical Side. |

Source pointers: `theme.css` utilities `construction-shading`, `construction-planes`, `construction-well`, `popup-construction`, `card-shaded-construction`, `focus-brackets` and `button-construction`; Menu joint and reveal placement in `menu-construction`; `switch.css` thumb assembly; `tabs.css` secondary indicator face; `progress.css` frame and measured face; `composer.css` tray contact.

## Shared and different names

- `header`, `item`, `list`, `value`, `icon`, `viewport`, `input`, `trigger`, `popup`, and `indicator` name broad roles. Their native element, semantics and approved paint remain component-specific. Always qualify ownership before styling.
- `button-label` and `label` are not the same accessible relationship: Button's visible ink supplies its action name; fields and Progress use associated labeling primitives.
- `button-content` is an inline layout group; Message `content` is the message reading region. These are not equivalent planes.
- Menu `items` is its scrolling content wrapper; Select/Combobox `viewport` contains a separate named `list`. Renaming them would hide a real structural difference.
- TextField `control` and Combobox `input` both edit text, but preserve their Base UI field/editing primitive roles. A common editing-plane concept can be documented without rewriting hooks.
- Button `trailing-action` is decorative and aria-hidden; its name does not create a separate interactive action. Document this explicitly rather than imply another native target.
