---
'gloop-ui': minor
---

Add `panel` to `CircleMenu` items (sub-menu leaves included): clicking the icon opens a liquid panel next to it with any custom content, such as sliders, lists, swatches or forms. Pass content, a render function receiving `{ close, back }`, or `{ content, placement, label }`. `Tooltip` and `Popover` can now wrap each other on the same trigger.
