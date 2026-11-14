---
'@zao/react': minor
---

Button can show the result of its action. Set `result` (for example "Copied") once the host knows the outcome: the face stays seated for one Hold beat while it reads the result, then lifts and shows the action again, and `onResultEnd` tells the host to clear it. The action keeps its accessible name and its width; the result is announced politely (`resultAnnouncement`, or `result` when it is text). Pass `null` from the first render while there is no result. IconButton takes `result` as the announcement and `resultIcon` as the icon to show. With reduced motion the result is read without the face moving.
