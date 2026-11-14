---
'@zao/react': minor
---

The Switch face can be dragged. Press the face and move, and it follows the pointer between its ends; on release it settles on the nearer end on the Slide role. A press without travel, the label, the keyboard and rapid toggling behave as before, and Base UI still owns the state: a drag that ends where it began changes nothing. The housing, target and focus brackets stay still. Horizontal touches on an enabled Switch now belong to it (`touch-action: pan-y`).
