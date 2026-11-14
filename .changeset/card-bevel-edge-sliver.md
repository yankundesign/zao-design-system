---
'@zao/react': patch
---

Fix a shaded sliver in Chromium along the middle of a Card's top edge when the Card is more than twice as wide as it is tall, and down its right edge when it is more than twice as tall as it is wide. Card's native border is now lit on all four sides, and its planes still paint the shaded left and bottom edges. At zero depth, where the planes are gone, all four edges read lit.
