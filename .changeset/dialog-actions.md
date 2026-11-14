---
'@zao/react': minor
---

Dialog gains `Dialog.Actions`, the row that closes a dialog: a hairline rule above, an optional `note` at the leading edge, and the actions at the trailing edge. Put the primary action last. When the row is narrower than 20rem the actions stack at full width in the same order, so reading order and focus order agree. It is the same row ApprovalGate draws; the Dialog frame, veil, instant entry and focus behavior are unchanged, and existing dialogs that lay out their own actions keep working.
