---
'@zao/react': patch
---

Make appends cheaper on pages that use Message. In Chromium, appending an element after a container's last child restyled every part with a `data-zao-slot` attribute below that child (about 3,000 parts and 7ms on the docs landing), because the three rules that reveal an earlier message's header actions ended in that attribute. `Message.Actions` now carries a `zao-message-actions` class and those rules name it. They match the same elements as before, and nothing looks or behaves differently.
