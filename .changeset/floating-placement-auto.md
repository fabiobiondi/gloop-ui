---
'gloop-ui': minor
---

Tooltip and Popover positioning:

- `placement="auto"` (also for CircleMenu tooltips and panels): the bubble opens on the first side where it fits (top, bottom, right, left). New `FloatingSide` type for the resolved side.
- New `FloatingBoundary` component: a `<div>` that acts as the viewport for the tooltips and popovers inside it, so they flip and shift to stay within its edges.
- When neither the chosen side nor its opposite has room, the bubble now falls back to a perpendicular side instead of overflowing.
