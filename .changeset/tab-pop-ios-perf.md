---
'gloop-ui': patch
---

Smoother `TabPop` opening on iOS. The goo filter now covers only the neck between the "+" and the bar: the real trigger and bar sit above it, outside the filter, and animate on the GPU, while plain shapes underneath carry the liquid bridge. The shadow is a regular `box-shadow`. The goo filter shadow of other components reuses the goo blur instead of a second `feDropShadow` blur (slightly tighter), and `TabPop` tabs no longer animate `filter: blur()`.
