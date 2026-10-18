---
'gloop-ui': patch
---

TabFab, ExpandButton and the ShapeToolbar menus: the JS-driven animations (TabFab re-centering, ExpandButton width, menu layout) were instant in production builds, because minified CSS writes durations in seconds (`.494s`) and they were read as milliseconds. No more grey tap highlight on iOS.
