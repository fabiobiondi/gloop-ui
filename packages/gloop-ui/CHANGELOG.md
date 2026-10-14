# gloop-ui

## 0.2.0

New form controls and floating bubbles, a much more flexible `CircleMenu`, and tab menus that open on any side.

### Minor Changes

- **New components**
  - `Input`: a text field whose label sits inside while empty and, on focus or with a value, drips out on top as a liquid tab fused to the field; the placeholder shows up only then. Accepts every native input attribute and a `ref`, works controlled or uncontrolled and picks up browser autofill.
  - `Slider`: a single-value range slider whose thumb is a liquid drop with a slower trail, so it stretches while dragged and settles back into a drop. The value drips out on top while dragging or focused from the keyboard (or always, with `showValue`), above or below the thumb with `valuePlacement`. Supports `min`/`max`/`step` (decimals too), step or custom labelled `marks`, `formatValue`, `onChangeEnd`, forms via `name`, keyboard (arrows, Page Up/Down, Home/End), controlled or uncontrolled.
  - `Tooltip` and `Popover`: liquid bubbles with an arrow that drip out of the trigger. Tooltip opens on hover (with delay) or keyboard focus and accepts text or JSX. Popover holds forms and components and closes on outside click, Escape, from code (`close` render-prop, `usePopover()`, controlled `open`) or on rollout (`closeOnLeave`). They can wrap each other on the same trigger.
  - `FloatingBoundary`: a `<div>` that acts as the viewport for the tooltips, popovers and tab menus inside it, so they flip and shift to stay within its edges.
- **Floating placement**
  - `placement="auto"` for `Tooltip` and `Popover` (and `CircleMenu` tooltips and panels): the bubble opens on the first side where it fits (top, bottom, right, left). New `FloatingSide` type for the resolved side.
  - When neither the chosen side nor its opposite has room, the bubble falls back to a perpendicular side instead of overflowing.
- **CircleMenu**
  - `reserveSpace={false}`: the menu takes only the size of the "+"; icons and sub-menus open on a layer above the surrounding content. Defaults to `true`.
  - `tooltip` on items, sub-menu items included: `true` shows the label, or pass text/JSX, or `{ content, placement, delay }`. By default it opens on the side facing away from the menu.
  - `panel` on items (sub-menu leaves included): clicking the icon opens a liquid panel next to it with any custom content, such as sliders, lists, swatches or forms. Pass content, a render function receiving `{ close, back }`, or `{ content, placement, label }`.
  - `open`, `defaultOpen` and `onOpenChange`: open it from outside, e.g. as a context menu at the right-click point.
- **TabMenu, TabMenuMotion, TabMenuSubmenu**
  - `direction` (`'top' | 'bottom' | 'left' | 'right'`): `TabMenu` places its bar above, below or beside the "+" (default `top`); `TabMenuMotion` and `TabMenuSubmenu` grow a horizontal bar on the chosen side, or a column for `top`/`bottom`, where sub-menus open to the right of the tab (default `left`). Defaults keep the previous layouts.
  - `direction="auto"`: on open the bar takes the first side with room inside the nearest `FloatingBoundary` (or the viewport).
  - `TabMenuSubmenu` sub-menus flip by themselves when there is no room (below the bar, or to the left of a column) and follow scroll and resize while open.
  - `attached` on `TabMenu` and `TabMenuSubmenu` (default `true`): while open, a liquid neck keeps the bar joined to the "+" and the sub-menu joined to its tab. Pass `attached={false}` to let the drop break away.
- **TabBar**: `enterFrom` (`'bottom' | 'top' | 'left' | 'right' | false`) chooses the side of the entrance animation or disables it. The selection pill now uses `--ui-accent`.
- **Search**: `reserveSpace={false}` keeps content right next to the magnifier and pushes it aside with the same spring that opens the field. Defaults to `true`.
- **Dialog**: `backdropColor`, `backdropOpacity` and `backdropBlur` customize the layer behind the dialog. Defaults are unchanged (black at 0.45, no blur).

### Patch Changes

- `TabMenuMotion` and `TabMenuSubmenu`: tabs drop out of the "+" from where it sits when closed, so they no longer fly in from outside the bar when it grows to the left or upwards; on close they vanish at once instead of being stretched by the shrinking bar. The liquid filter now covers the bar on every side of the "+", so closing a bar that grows to the left no longer clips it.
- `ExpandButton`: the drops share the button's current color, hover included, and fade with the same transition; at rest they stay hidden, so they no longer peek out of a round icon-only button.

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
