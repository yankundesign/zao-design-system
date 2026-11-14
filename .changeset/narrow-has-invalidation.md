---
'@zao/react': patch
---

Make DOM insertions cheaper on pages that use Message or primary Tabs. In Chromium, any element inserted into such a page restyled the whole document because of two `:has()` rules (about 5,500 elements and 13ms on the docs landing). Message drops a redundant `:has()` guard: `grid-column` does nothing until a message with header actions becomes a grid. The pressed rules for the primary Tabs selection line now target a new `tabs-selection-line` class on that span, not its `data-zao-slot` attribute. Rules match the same elements as before, and nothing looks or behaves differently.
