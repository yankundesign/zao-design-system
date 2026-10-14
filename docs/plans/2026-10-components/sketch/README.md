# Plan, seal and drawing: sketch

Reference only. The host and recipes behind the Oct 13 review sketch
([artifact](https://claude.ai/artifact/6b4NM1z9ap77RuSuX88TGZ)) for three proposals:

| Row | Proposal                         | Options                               | Decided Oct 13 |
| --- | -------------------------------- | ------------------------------------- | -------------- |
| P1  | Plan: step construction          | List · Rail · Built                   | Rail           |
| P2  | Plan: arrival                    | Instant · Drawn in                    | Drawn in       |
| A1  | ApprovalGate: approve action     | Button · Button + seal · Stamp · Hold | Button + seal  |
| A2  | ApprovalGate: impression         | Solid 白文 · Outline 朱文             | Solid (lean)   |
| L1  | Loading state for Card and Table | Today · Shimmer · Drawing             | Drawing        |
| L2  | Dimensions in fen while loading  | Off · On                              | Off            |

- `main.tsx` is the host: the three components are sketched there on top of the real
  `@zao/react` parts. The plan runner, timings and network are simulated.
- `sketch.css` holds the recipes, each scoped under `.sk[data-sk-<row>='<option>']`. Port the
  recipes, not the selectors.
- `seal-glyph.woff2` is the one-glyph subset (准) of Noto Serif SC Bold, SIL OFL, used by the seal.

It was built with Vite, `@tailwindcss/vite` and `vite-plugin-singlefile` in a scratch app next to
`apps/docs`; it is not part of the workspace build.

The plan is [../README.md](../README.md). Hold's duration became its own motion role; whether a
hold variant ships and what the seal says by default are still open (gates G1 and G2).
