---
'@zao/react': minor
---

`Conversation.Latest` counts what arrived while the reader was away from the end of the transcript. Its default label is "1 new message" or "2 new messages" when messages were added to the list since the reader left the end, and stays "Latest response" when none were (a message that only grew adds nothing). A host's own children still replace the label. The control's placement, behavior and announcements are unchanged.
