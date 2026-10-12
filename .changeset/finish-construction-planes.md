---
'@zao/react': minor
---

Draw depth as two side planes in two flat bands (叠晕) instead of a single contact edge. Button and IconButton rest 3px above their base, lift to 5px and seat on press, driven by one registered `--zao-face-offset`; the planes live on a new `side` slot. Card, Dialog, Table and popups carry static planes at their rest depth; a press inside a Card seats it by one contact step. Switch and secondary Tabs faces rest 2px above their base. Lifted faces get one bevelled leading corner where `corner-shape` is supported. Switch, Progress, secondary Tabs and fields gain stepped well walls. Planes and brackets add paint but never scrollable overflow: planes draw outside the box with zero-blur spreads, and brackets are the corners of an outline. Switch's thumb follows the slide role. Reduced motion leaves Button faces untransformed.

Add `focus-brackets`: Button, IconButton and Switch show four ink brackets that close in over grade 7, with a solid outline in forced colors. Primary Tabs mark the selection in the seal; Progress readings are data and keep ink under either seal. `data-zao-seal="azurite"` swaps the accent roles for the azurite seal on any element, including nested finish islands.
