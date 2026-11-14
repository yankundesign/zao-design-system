---
'@zao/react': minor
---

ApprovalGate can ask for more than one press. `confirm="hold"` makes the primary action a hold: pressed with the pointer, Space or Enter, its face seats in the Hold role's steps while the seal fills a drawn place at the end of the row, and the approval is sent when it is full; releasing early cancels. `confirm="dialog"` opens a confirming Dialog on a press. A hold falls back to that Dialog with reduced motion, and for an activation that cannot be held, such as one from a screen reader. `holdLabel` names the held action and `cancelLabel` the Dialog's cancel. Without `confirm`, ApprovalGate behaves as before. This decides gate G1.
