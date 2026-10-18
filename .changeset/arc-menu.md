---
'gloop-ui': minor
---

New `ArcMenu` (experimental): a copy of `CircleMenu` with the same props, animated with CSS only (springs sampled into `linear()` easings, no Motion). Animation config (`GloopMotionProvider`, `MotionProps`) now lives in a module that does not import `motion`.
