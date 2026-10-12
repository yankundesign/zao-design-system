---
'@zao/tokens': patch
'@zao/react': patch
---

Name the existing construction motion through finish duration and easing roles for lift, seat, slide, reveal, and reveal exit. Each role initially aliases the existing fast/base timing or standard easing, preserving all values and interactions. Keep the generic fast/base roles for state changes and functional loading timing unchanged. Deferred Yu entries preserve its existing values for token completeness.

Route Button and IconButton spatial travel through lift or seat according to their existing pressed state, Switch and secondary Tabs seating through seat, track movement through slide, and floating reveals through opening and exit roles. Keep native targets, labels, focus outlines, reduced motion, and current timing intact. Register the roles in the private style engine for local tuning; changing role values requires its separate decision.
