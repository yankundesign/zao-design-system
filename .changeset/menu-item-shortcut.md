---
'@zao/react': minor
---

A Menu item can show its keyboard shortcut. `shortcut` is the shortcut as people read it, such as "⌘K", drawn in the mono caption face and the muted ink at the item's trailing edge. `keyShortcuts` is the same shortcut in ARIA's form, such as "Meta+K": it sets `aria-keyshortcuts`, and the visible keys are then hidden from assistive technology so they are read once. Both are optional, and the host still binds the key. Items without a shortcut are unchanged.
