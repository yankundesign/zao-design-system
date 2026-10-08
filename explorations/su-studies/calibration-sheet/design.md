# Calibration sheet

**Status:** CSS candidate for Su. No published tokens or components change.

## Idea

Treat the interface as a measured sheet: clear alignments, fine registration rules, and one drafting-blue signal. The construction drawings suggest how to explain relationships; the Swiss and Rams references keep the result direct and useful.

## Component decisions

- **Button:** Square corners in every size. Primary is solid blue; secondary is a blue keyline; quiet stays typographic. Hover adds a short inset rule. Press never shifts the shared control height.
- **TextField:** A complete rectangular cell. Hover and focus strengthen the boundary; the existing outside focus outline remains. Invalid state keeps its error border and correction text.
- **Card:** A ruled record with a slim blue registration edge. The grid appears only inside the data figure. The rest of the content remains plain and readable.

## Shared Su constraints

Geist remains the text and display face. Geist Mono is used only for the record ID; type sizes, weights, line heights, spacing, and control heights come from ZAO's shared structure. Surfaces are opaque. Button corners are zero. Motion is a 100 ms state response and disappears with reduced motion.

The CSS includes light and dark trial palettes so the same components can be inspected in both Su modes. These are exploratory values, not changes to the palette source.

## What to judge

The grid and blue should help a person scan a real settings or data view. If they become decoration, reduce them. The study styles the current Button, TextField, and Card hooks. A future Menu should use the same keylines and opaque sheet material when that component exists.
