---
'gloop-ui': patch
---

Infinite animations pause while off-screen: `GloopLoading`, indeterminate or dripping `ProgressBar` and dripping `ExpandButton` stop when scrolled out of view and resume when they come back, instead of re-running their goo filter on every frame for nobody.
