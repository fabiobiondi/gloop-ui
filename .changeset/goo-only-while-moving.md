---
'gloop-ui': patch
---

The goo filter is now on only while shapes move. `Dialog`, `Toast`, `Tooltip` and `Popover` drop it once their animation has finished (as `Modal` already did) and put it back when they close or move again. At rest the shadow is a regular `box-shadow`, so hovers, focus, typing and scrolling no longer re-run the filter (it runs in software on iOS). The arrow joint of `Tooltip`/`Popover` loses its tiny goo fillet while open.
