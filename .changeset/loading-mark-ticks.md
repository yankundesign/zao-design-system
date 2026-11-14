---
'@zao/react': minor
'@zao/tokens': patch
---

The loading mark is drawn from the system's own parts. In place of a rotating arc, Button, IconButton, Message, Plan and every other pending state show eight hairline ticks, one per motion grade, that fill a tick per step, eight steps per `motion.duration.loading`, and start again. Only transforms move, so the mark keeps stepping while the page is busy. Reduced motion shows the still mark with every tick lit, and forced colors keep the ticks in a system ink. The mark is no longer an `svg`: `[data-zao-slot="spinner"]` is a `span`. `motion.duration.loading` keeps its value; its description now says one fill, not one rotation.
