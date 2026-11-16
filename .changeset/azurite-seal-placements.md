---
'@zao/tokens': minor
'@zao/react': minor
---

Azurite 青 is a clearer blue, and the seal marks more of the current selection.

- `@zao/tokens`: the azurite ramp moves to hue 259 at chroma 0.131 (from 261 at 0.10), with the solid at 0.40 lightness in light and 0.72 in dark. `color.seal.azurite.solid` is now `#14448d` in light and `#71a5f6` in dark. Label contrast on the solid is 9.4:1 in light and 6.5:1 in dark, and the seal's text role stays above 4.5:1 on canvas and surface. The ink seal and every other ramp are unchanged.
- `@zao/react`: the committed check in Select and Combobox reads `accent-text`; a checked or mixed `table-checkbox` fills with `accent-solid` and draws its mark in `fg-on-accent`; Plan's running station is drawn in `accent-solid`. With the default ink seal these read as ink, as before; on a `data-zao-seal="azurite"` island they are azurite. Focus, Progress's reading, a selected Table row and forced colors are unchanged.
