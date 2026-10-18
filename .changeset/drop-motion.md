---
'gloop-ui': minor
---

**Breaking:** gloop-ui no longer depends on `motion`. Every component is animated with CSS transitions and keyframes (springs sampled into `linear()` easings, one set per preset), with small Web Animations / requestAnimationFrame helpers where a value has to follow the pointer. Props, class names and behavior are unchanged; `speed`, `motion`, `animated`, `reducedMotion` and `GloopMotionProvider` work as before.

- Remove `motion` from your dependencies if you only installed it for gloop-ui.
- `tuneTransition` is removed (it tuned motion/react transitions).
- `useGloopMotion` now returns `{ speed, preset, state, reduced, rootProps }`: the motion/react helpers `t` and `v` are gone.
- Needs browsers with CSS `linear()`, `@property` and `@starting-style` (Chrome 117+, Safari 17.5+, Firefox 129+); older ones skip the entrance animations.
