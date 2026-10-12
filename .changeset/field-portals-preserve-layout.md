---
'@zao/react': patch
---

Keep Select and Combobox portal wrappers out of the field's flex layout, preventing a new gap from shifting neighboring controls during focus, opening, and dismissal. Preserve the existing popup positioning, focus, selection, and public API.
