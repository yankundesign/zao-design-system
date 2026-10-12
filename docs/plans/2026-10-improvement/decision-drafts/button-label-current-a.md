# Current Button label behavior A — approved D12 draft

Yankun selected A on October 11, 2026, after reviewing the private Button and IconButton comparison. This row is ready for Yankun to add to `BRIEF.md`; this file does not edit the brief.

| Date       | Decision                                                                                                                                                                                                                                                                                                                                                     | Reason                                                                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-11 | D12 / WP 3.4: retain A, the current Button and IconButton behavior. Labels and icons travel with the face during hover lift, press seating, and release; the base, native hit area, outside keyboard focus outline, and neighboring layout stay fixed. Keep existing motion-role aliases and values, disabled protections, and reduced-motion fill feedback. | Yankun selected the current face and reading relationship after the private A/B/C comparison in Su light and dark. A matches the reviewed production components and requires no new runtime pose, timing, token, or public API. |

## Scope

- Button and IconButton keep their approved connected construction and current face/content travel.
- B's moving base and C's inverse ink translation remain private, unselected studies.
- The choice retains D11's current role values and aliases.
- Continue WP 3.6 interruption coverage and the ungated WP 4.1 part-name audit. Any public slot rename remains a separate human decision.
