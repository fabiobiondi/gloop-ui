---
'gloop-ui': minor
---

Add `direction` (`'top' | 'bottom' | 'left' | 'right'`) to `TabMenu`, `TabMenuMotion` and `TabMenuSubmenu`. `TabMenu` places its bar above, below or beside the "+" (default `top`). `TabMenuMotion` and `TabMenuSubmenu` grow a horizontal bar on the chosen side, or a column for `top`/`bottom`, where sub-menus open to the right of the tab (default `left`). Defaults keep the previous layouts.
