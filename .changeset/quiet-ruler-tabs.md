---
'@zao/react': patch
---

Give Tabs a primary ruler rail and a secondary recessed selector through `Tabs.List variant`. The primary selection line shares the guide's centerline, with fine graduations, tab registration ticks, and small end stops. Hover and keyboard focus extend the target tick; pressing compresses the selection line around the same centerline. The secondary selector has one sliding face and a contact edge, with no underline; pressing seats the face.

Keep native targets, labels, focus outlines, and neighboring layout stationary. Base UI owns selection, indicator measurements, disabled behavior, and horizontal or vertical keyboard navigation. Long lists scroll within a padded viewport, nested roots retain independent selection, and reduced motion makes visual feedback immediate. Reuse semantic colors and existing finish motion without changing tokens.
