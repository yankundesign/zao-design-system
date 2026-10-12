---
'@zao/tokens': patch
'@zao/react': patch
---

Unify the structural default control height at 34px following the approved D9 option C. Default Tabs and Menu row minimums grow from 32px to 34px. Button, IconButton, TextField, Select, Combobox, and shared Menu/Dialog actions retain their existing 34px default geometry; Button keeps its 18px line box and 8px block padding. Explicit small and large sizes remain 28px and 40px, and the 8-fen spacing step remains 32px.

Make `size.button.default` an alias of `size.control.md`. Add semantic `h-control`, `min-h-control`, and `w-control` utilities; retain `h-button` as a compatibility alias. Default controls read the shared structural token, preserving native focus, activation, selection, disabled state, reduced motion, and RTL behavior.
