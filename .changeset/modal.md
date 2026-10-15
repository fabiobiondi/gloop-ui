---
'gloop-ui': minor
---

New `Modal`: full-size modal that oozes open as a soft blob (goo shape with satellite drops) and deflates back into a drop when it closes. Optional title (string or JSX) with close button, content that adapts to the available height and scrolls, and an optional footer with buttons (`actions`, ExpandButton) and/or custom JSX (`footer`). Sizes `sm | md | lg | full`, `closeOnBackdrop`, `closeOnEscape`, `afterClose`, backdrop color/opacity/blur. Open it programmatically with `useModal().open(options)` inside a `ModalProvider`: the handle has `close(result)`, `update(options)` and a `result` promise that resolves with the `value` of the button pressed.
