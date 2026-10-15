---
'gloop-ui': minor
---

Global motion settings. `GloopMotionProvider` sets the speed (`speed`), the character (`motion`: `'gloop' | 'smooth' | 'snappy'`), on/off (`animated`) and reduced-motion handling (`reducedMotion`: `'user' | 'always' | 'never'`) of every component inside it. Every component accepts the same props to override the provider. `speed` on `ProgressBar` and `GloopLoading` now scales all their animations, not only the loop.
