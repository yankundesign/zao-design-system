---
'@zao/react': minor
---

IconButton's tooltip joins the floating construction. It now rests a small depth (`depth.rest.small`) above its base with two drawn side planes and one faceted leading corner, like Menu, Select and Combobox popups, in place of the overlay material's rounded corners and drawn shadow. A new `tooltip-construction` utility carries it. The tooltip's content, placement, hover and keyboard behavior, and Escape dismissal are unchanged, and it still appears and leaves in place.
