---
'gloop-ui': patch
---

`Modal` filters a much smaller area while it animates: `swell` covers the card plus a margin (it was 2×3 times the card), `drop` covers the card and the drop's path (it was the whole window). `GooFilter`'s `region` can now be a function of the element's size.
