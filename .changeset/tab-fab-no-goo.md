---
'gloop-ui': patch
---

`TabFab` no longer uses an SVG goo filter, so it opens, closes and switches sub-menu smoothly on iOS. The bar background is made of three pieces animated with transform only (the "+" circle, a middle stretch that scales, a head that slides), the neck between tab and sub-menu is a CSS shape that moves with the panel, and shadows are regular `box-shadow`s on a layer underneath. Visible change: the tabs slide out with the bar instead of shooting ahead as drops melted by the goo.
