# Craft references: beyond the wireframe

Research, Oct 15, 2026. A visual board with screenshots is in the Design System project's artifacts.

Yankun's note: the workspace still feels a little wireframe. The system panels, header sections, top navigation and cards need more polish. Look at projects like Hairline and exploded, and at designs, templates and design systems with impressive visual design, motion, effects, texture, detail and lines. Research first; nothing is decided. Color choices stay with Yankun.

## Why it reads as a wireframe (dark workspace screenshot)

1. **One tone.** Canvas, window, cards and assistant share almost the same fill; only 1px lines separate them.
2. **One kind of line.** Frame, card edge, header rule, table rule and tab rail share one weight and ink.
3. **Two header systems.** The main header rule and the Assistant header rule sit at different heights; the tab rail stops partway along the bar.
4. **Empty fields.** The middle of the assistant and the lower half of Seats hold no data, texture or ground.
5. **No marks of identity.** Text-only header; no workspace mark, people or state color.
6. **Depth reads as an outline.** At card size the planes look like a heavier left and bottom border, because face, planes and window are one tone.

## 1. Lines with a job

- **Linear homepage figures (FIG 1.1):** solid visible edges, dotted hidden edges, mono FIG labels, hairline column rules.
- **Tailwind CSS home (1.2):** full-width rules at every line box, hatched gutters, mono class labels annotating the type, frame-in-frame windows.
- **Evervault (1.3):** rules end in + registration marks; icon tiles have inner frames.
- **Zed (1.4):** dotted leaders (name … date), framed column with a hatched strip, buttons with a darker bottom edge.
- **Devouring Details (1.5):** a tick ruler on the left edge is the scroll position; one accent line crosses the page.
- **exploded (1.6):** four corner captions per plate, dashed guides ending in dots, one annotation color with tinted padding. "Nothing is redrawn, and no number is typed."

For ZAO, one job per line, drawn differently: **frame** (strongest), **division** (hairline), **guide** (dotted or dashed), **mark** (ticks, + caps, corner brackets, fishtails), **hatch** (cut, empty or reserved areas).

Counterweight: Linear's March 2026 refresh softened dividers and dimmed the sidebar ("structure should be felt not seen"). Inside a working view, the line hierarchy should mostly make lines quieter so the few strong ones carry meaning.

## 2. Surfaces and depth without blur

- **Linear product mock (2.1):** darkest sidebar, inset content panel one step lighter with its own border; avatars, IDs and status glyphs.
- **Linear stage (2.2):** the window rests on a lighter plate lit from below.
- **Raycast (2.3):** device frame with a lighter top edge, faint dust, warm inner glow.
- **Geist Materials (2.4):** elevation as named presets (base, small, medium, large; tooltip, menu, modal, fullscreen), each fixing radius, fill, stroke and shadow.

For ZAO: four tone steps from the warm ink ramp (canvas, window, panel, face); edge light (leading edge lighter, trailing darker, zero blur); frame in frame; a ground for the window.

## 3. Texture

- **Paper Shaders grain gradient (3.1)** and **dithering (3.2):** GPU grain and ordered 1-bit dither; `@paper-design/shaders-react`.
- **Ghostty (3.3):** ASCII animation as texture.
- **Cursor (3.4):** product windows over oil paintings; texture in the ground.
- **Oxide (3.5):** small working instruments per feature (dot-matrix VM grid, rule list, power trace, quota bar); density is the texture.
- **Daylight (3.6):** paper, leaves and daylight around a paper-like screen.

For ZAO: faint rice-paper grain on the canvas only; hatch for reserved and empty areas; mark fields for data (extend the storage ring's marks); fill empty fields with real readings before any effect.

## 4. Detail and annotation

- **Oxide hero (4.1):** boxed FIG. 1 label, elbow leader line, dot-matrix field as ground.
- **Oxide console (4.2):** two-line identity block (SILO over maze-war) with a mark, mono caps section labels, shortcut shown in the jump field.
- **Evervault ledger (4.3):** mono IDs, processor chips, APPROVED checks, small caps label over a large total.
- **Linear intake board (4.4):** a thread panel overlaps a board that fades out; cards carry ID, title, chips and avatar.
- **Teenage Engineering nav (4.5):** each item is a line drawing with a tiny three-line label.

## 5. Motion

- **Hairline (5.1):** 50ms stagger, one 700ms curve `cubic-bezier(.32, .72, 0, 1)`, pointer falloff 1 → ~.31 at 42% radius → ~.09 at the edge; corrections become written rules.
- **Anatomy by Ryan (5.2):** the figure is the running model (wind the crown, slow it, take it apart). exploded credits it.
- **Rauno Freiberg, Designing Depth (5.3):** foreground objects, dimmed or blurred backdrops, choreography (nearest the trigger first), stagger, affordance through what moves.
- **Family Values (Benji Taylor):** "we fly instead of teleport"; labels morph (Continue → Confirm); trays of distinct heights; delight saved for infrequent moments.
- **Emil Kowalski:** animations.dev; Sonner and Vaul.
- **Devouring Details:** 23 chapters on interaction detail.
- **Jakub Krehel, make-interfaces-feel-better:** concentric radii, optical alignment, shadows vs borders, tabular numbers, enter, exit and stagger.

For ZAO, candidates using existing grades and fold curves: assembly (frame, then rules, then content, one grade apart); directional tab travel; label morph ("Approve 2 requests" → "Approved 2 requests"); readings tick only when data changes.

## 6. ZAO's own source

Woodblock folio layout (Peking University guide to 古籍版式; Korean woodblock design overview):

| Term        | Meaning                                                                           | Option for ZAO                                                |
| ----------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 版框 / 边栏 | Frame around the block: single, double left and right, or double all round        | Window frame as a double border: strong outer, hairline inner |
| 界行        | Rule between every column of characters                                           | Table and transcript rules                                    |
| 版心        | Center fold of the sheet                                                          | The fold between main view and assistant                      |
| 鱼尾        | Fishtail mark in the center fold; helped align the pages                          | Marks at both ends of the current tab                         |
| 象鼻        | Black line from fishtail to frame                                                 | Connector from the tab mark to the rail                       |
| 书耳        | Small box sticking out at the frame's upper left, often holding the section title | Panel and card labels in a tab cut into the frame             |
| 天头 / 地脚 | Head and foot margins; head notes go in 天头                                      | Header as a head margin with one line of notes                |

界画 jiehua: painting of buildings with a guide ruler (界尺); ruled lines for architecture, free brush for landscape and figures. As a rule for ZAO: ruled hairlines for built parts, a softer hand (tone, grain, ink) for ground and content. Liang Sicheng and the Society for Research in Chinese Architecture's 1930s measured drawings of bracket sets are worth studying for line weight.

## 7. Options for the four areas

| Area        | A                                                                                             | B                                                                                               | C                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Header      | Identity block: kind over name, small mark, mono reading strip (4.2, 4.3)                     | Book ear: name in a tab cut into the top frame; head margin with notes (6.1)                    | Construction labels shown when Parts is on (1.2, 1.6)                                     |
| Top nav     | Rail with a job: full width, ticks at tab boundaries, fishtails on the current tab (1.5, 6.1) | Readouts in tabs: mono counts and state marks (4.4)                                             | Directional travel (5.3, Family Values)                                                   |
| Side panels | Inset sheet: tone step, frame in frame, header rule aligned with main header (2.1, 1.2)       | Transcript on column rules: author and time gutter, tool results as instruments (3.5, 4.3, 6.1) | Ground and well: grain or mark field; composer seated in a well (3.1, 3.2, 2.2)           |
| Cards       | Line hierarchy: stronger frame, hairline divisions, dotted leaders, + caps (1.1, 1.3, 1.4)    | Plates: figure captions and four-corner readings (1.6, 4.1)                                     | Material: face a tone step lighter, lit top edge, darker planes of the same ink (2.1–2.4) |

Color: every reference uses some color for state. Status color for Ready, Running, Needs review and Blocked would be the largest single step away from a wireframe. Yankun's call; bring options when asked.

## Avoid

Glowing border beams, cursor spotlights, purple-to-blue glows, glass everywhere, gradient text, bento grids of made-up metrics. Magic UI and Aceternity UI collect many of these; use them to recognize the look, not as a source.

## Decisions, Oct 15

Yankun chose **header A**, **top nav A**, **side panel C**, and **cards A and C**. Built on the landing workspace, Card and Tabs on branch `craft/workspace-pass`; see `AGENTS.md` ("Approved workspace craft pass"). Still open: the dark plane depth, the light body step and the field's strength.

## Suggested next step (superseded)

The research proposed drawing the workspace three ways before choosing. Yankun chose per area directly instead (see Decisions).

## Sources

- exploded: https://github.com/diip3sh/exploded · https://diip3sh.github.io/exploded/
- Hairline: https://hairline.lucasmarkes.com/inspo · https://hairline.lucasmarkes.com/figures
- Anatomy: https://skills.wheresryan.sh/anatomy
- Linear: https://linear.app · https://linear.app/now/behind-the-latest-design-refresh
- Tailwind CSS: https://tailwindcss.com
- Evervault: https://evervault.com
- Zed: https://zed.dev
- Devouring Details: https://devouringdetails.com
- Raycast: https://www.raycast.com
- Geist Materials: https://vercel.com/geist/materials
- Paper Shaders: https://shaders.paper.design/grain-gradient · https://shaders.paper.design/dithering
- Ghostty: https://ghostty.org
- Oxide: https://oxide.computer · https://console-preview.oxide.computer
- Cursor: https://cursor.com
- Daylight: https://daylightcomputer.com
- Teenage Engineering: https://teenage.engineering
- Rauno Freiberg, Designing Depth: https://rauno.me/craft/depth
- Family Values: https://benji.org/family-values
- Emil Kowalski: https://emilkowal.ski · https://animations.dev
- Jakub Krehel: https://github.com/jakubkrehel/make-interfaces-feel-better
- 古籍版式 (Peking University): https://gwh.pku.edu.cn/info/1159/1203.htm
- Korean printing woodblocks, design: https://mokpan.ugyo.net/en/overview/design.html
- Jiehua: https://en.wikipedia.org/wiki/Jiehua
- Surveying Chinese architecture in the 1930s (Intervalla): https://www.fus.edu/intervalla/volume-5-from-loss-to-survivals-on-the-reconstruction-and-transmission-of-artistic-gestures/reformulating-architecture-s-past-through-drawing-surveying-chinese-architecture-in-the-1930s
