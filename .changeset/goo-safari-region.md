---
'gloop-ui': patch
---

`TabPop`, `TabFab` and gooey `Modal` showed up again on Safari/iOS: the goo filter area is now set relative to the element (objectBoundingBox) instead of `userSpaceOnUse`, which Safari ignores on HTML elements and hid the whole component. `TabPop` also uses a tighter filter area, only on the side the bar opens.
