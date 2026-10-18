---
'gloop-ui': patch
---

Smoother `TabPop` opening on iOS: the goo filter shadow reuses the goo blur instead of a second `feDropShadow` blur (cheaper for every gooey component, the shadow is slightly tighter), and `TabPop` tabs no longer animate `filter: blur()` in their cascade.
