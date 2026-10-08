# Su CSS studies

Three scoped CSS studies for the real ZAO components in the existing `/components` docs. [Quiet instrument](quiet-instrument/styleguide.md) is the current local Su study, selected on Oct 4, 2026; its finish values are still trials.

**Direction update, Oct 6, 2026:** [Quiet construction](../../BRIEF.md#current-design-direction-quiet-construction) is the current direction across ZAO, not a third finish or a rename of this study. The experiment explores the boundary of 2D and 3D through measured physical construction and a quiet responsive feeling. Yingzao Fashi informs proportion, parts, assembly, and finish. Su and Yu share structure and interaction meaning.

[Hairline](https://github.com/lucasmarkes/hairline) is a reference for feeling and process, not copied artwork rules or timings. Rest can already be a designed spatial composition. Yankun will define component interactions one by one; existing recipes remain study observations, and usability hypotheses need evidence before becoming system rules.

| Study                                            | Character                                                  |
| ------------------------------------------------ | ---------------------------------------------------------- |
| [Calibration sheet](calibration-sheet/design.md) | Measured rules, registration blue, contained drafting grid |
| [Quiet instrument](quiet-instrument/design.md)   | Recessed readings, tactile keys, explicit readout          |
| [Living folio](living-folio/design.md)           | Warm paper, open writing lines, section rules              |

Each folder contains `style.css` and `design.md`. The docs discover complete folders automatically. Apply a style through the existing `/components/button`, `/components/text-field`, and `/components/card` previews. CSS selectors are scoped under `.study[data-study='<slug>']` and target the components' `data-zao-*` hooks. The only specimen-specific selectors decorate the current Card's record content.

All studies use the shared Geist type roles, fen spacing, and control heights. Geist Mono appears only on the record ID. Button corners are square. The direction update itself leaves existing study values unchanged. The subsequent individual Button approval adds its shared 14px / 18px, weight-500 type role, 34px default height, and 16px horizontal / 8px vertical padding. Its approved refinement connects face, side, and base with a contact edge at rest; keeps the 2px upward-and-right hover lift without a stronger border or blur; and seats the face onto its base on press along that same axis. Release returns to hover or rest. Quiet instrument inherits that behavior and its stationary native hit area, keyboard focus, disabled and reduced-motion protections; the earlier shell press translation stays removed. Other component interactions remain open. Study IDs, trial colors, and finish timing stay local until Yankun selects values for promotion.
