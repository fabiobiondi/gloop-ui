---
'gloop-ui': minor
---

`CircleMenu` no longer uses Motion: every animation is a CSS transition or keyframe (springs sampled into `linear()` easings, one set per preset). Same props and behavior. Animation config (`GloopMotionProvider`, `MotionProps`) now lives in a module that does not import `motion`.
