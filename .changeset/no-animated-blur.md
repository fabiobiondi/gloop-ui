---
'gloop-ui': patch
---

Smoother animations on iOS: no component animates `filter: blur()` any more (TabFab pages, Modal and Dialog reveal, Toast, Tooltip and Popover content, ExpandButton label, ShapeEditor). Each blur was a filter recomputed on every frame, often nested inside a goo filter. Entrances and exits keep their fade, slide and scale.
