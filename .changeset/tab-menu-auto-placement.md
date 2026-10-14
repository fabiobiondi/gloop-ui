---
'gloop-ui': minor
---

Add `direction="auto"` to `TabMenu`, `TabMenuMotion` and `TabMenuSubmenu`: on open the bar takes the first side with room inside the nearest `FloatingBoundary` (or the viewport). `TabMenuSubmenu` sub-menus now flip by themselves, below the bar or to the left of a column, when there is no room, and follow scroll and resize while open.
