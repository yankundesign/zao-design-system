---
'@zao/react': minor
---

Render Dialog.Trigger and Dialog.Close through the shared Button. Both parts now accept Button's size and variant props, using the shared 28px, 34px, and 40px heights; their default height changes from 32px to 34px. Trigger defaults to secondary and Close to quiet, with explicit variants available for primary confirmation actions. They inherit Button's construction, focus outline, press feedback, disabled behavior, and reduced-motion protections while preserving Base UI dialog events, refs, and part hooks.

Apply the approved D7 option B to Dialog: a square stationary surface with Card's shared shaded contact edge and a fine semantic border, replacing the rounded material-overlay shadow. A semantic canvas veil at 80% opacity sets the page back and becomes opaque for reduced transparency. Entry and exit remain instant, including reduced motion; Base UI retains focus trapping, dismissal, focus return, title and description associations, and scroll locking. This adds no tokens, dependencies, or public props beyond the Button size and variant support above.
