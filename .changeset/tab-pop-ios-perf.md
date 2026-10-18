---
'gloop-ui': patch
---

Smooth `TabPop` opening on iOS: no more SVG goo filter, which Safari recomputes in software on every frame (and clipped the neck on iOS). The liquid neck between the "+" and the bar is now a CSS shape with concave sides, and everything animates with transform and opacity on the GPU. The shadow is a regular `box-shadow`, and tabs no longer animate `filter: blur()`. The goo filter shadow of the other gooey components reuses the goo blur instead of a second `feDropShadow` blur (slightly tighter).
