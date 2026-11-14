---
'@zao/react': minor
---

A field's correction now carries a warning glyph before its message, so an invalid TextField, Select or Combobox no longer differs from a valid one by the hue of its edge and message alone. The glyph is Iconoir's warning triangle at the small icon size, in the message's `text-danger` ink, decorative and hidden from assistive technology. The message wraps beside it. The `error` part is now a flex row holding the glyph (`data-zao-slot="error-icon"`) and the message; edge roles, values and the accessible description are unchanged.
