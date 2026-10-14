---
'gloop-ui': minor
---

Add the optional `--ui-surface` token for the Popover and Dialog background. By default it is `--ui-bg` mixed 6% toward `--ui-fg`, so inputs and buttons inside them stand out. Popover scrollbars are now thin.

Fix Dialog: an input inside it no longer loses focus after each keystroke when `onClose` is an inline function.
