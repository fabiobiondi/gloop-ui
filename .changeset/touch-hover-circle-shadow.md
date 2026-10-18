---
'gloop-ui': patch
---

`List` and `CircleMenu` ignore hover on touch: a tap no longer leaves the hover pill (or the enlarged blob) stuck, nor animates a second goo layer. `CircleMenu`'s goo shadow reuses the goo blur instead of a second `feDropShadow` blur.
