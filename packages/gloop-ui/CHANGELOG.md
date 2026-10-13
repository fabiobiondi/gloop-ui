# gloop-ui

## 0.1.0

First public release: soft, blobby, fluid React components with liquid "goo" animations.

### Minor Changes

- **Components**
  - `ExpandButton`: icon button that expands into a label with a pop and a burst. `toggle` and `action` variants.
  - `Search`: a magnifier that stretches into a field; the lens morphs into a close icon.
  - `CircleMenu`: a "+" that throws icons around itself with a blob effect. Full circle or arc, optional sub-menus.
  - `TabMenu`, `TabMenuMotion`, `TabMenuSubmenu`: liquid tab menus that drop out of a trigger, with optional sub-menus.
  - `TabBar`: bottom navigation bar with a liquid selection pill.
  - `Dialog`: liquid modal dialog with an optional icon badge and actions that drip out of the card.
  - `ShapeEditor`: Excalidraw-style shape toolbar with nested popovers.
  - `GooPill` and `GooFilter`: the building blocks of the liquid effect, for your own components.
- **Theming** through three CSS variables: `--ui-bg`, `--ui-fg`, `--ui-accent`. They can be set globally or on any ancestor.
- **Accessibility**: keyboard and screen reader support, and `prefers-reduced-motion` is respected.
- **Packaging**: ESM bundle with bundled TypeScript types and a single `gloop-ui/styles.css`. Marked `'use client'` for React Server Components (Next.js App Router).
- **Requirements**: `react` and `react-dom` ^19, `motion` ^14 as peer dependencies.
