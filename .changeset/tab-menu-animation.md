---
'gloop-ui': minor
---

`TabMenu`: new `animation` prop (`'slide' | 'pop' | 'bounce'`, default `'slide'`). With `'pop'` the liquid drop reaches out from the "×" first, then the bar pops open from its center toward the sides with a slight bounce, tabs cascading from the center. `'bounce'` opens like pop, with a back-out ease on its width: it overshoots its size, then settles.

`TabMenu`: new `iconOnly` (tabs show only their icon, the label stays as accessible name) and `tabGap` (space between icons in px, default 50, down to 0) props.
