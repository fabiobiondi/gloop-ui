# gloop-ui

## 0.5.0

### Minor Changes

- 9f58e97: **Breaking:** gloop-ui no longer depends on `motion`. Every component is animated with CSS transitions and keyframes (springs sampled into `linear()` easings, one set per preset), with small Web Animations / requestAnimationFrame helpers where a value has to follow the pointer. Props, class names and behavior are unchanged; `speed`, `motion`, `animated`, `reducedMotion` and `GloopMotionProvider` work as before.
  
  - Remove `motion` from your dependencies if you only installed it for gloop-ui.
  - `tuneTransition` is removed (it tuned motion/react transitions).
  - `useGloopMotion` now returns `{ speed, preset, state, reduced, rootProps }`: the motion/react helpers `t` and `v` are gone.
  - Needs browsers with CSS `linear()`, `@property` and `@starting-style` (Chrome 117+, Safari 17.5+, Firefox 129+); older ones skip the entrance animations.
- de203ab: Breaking: `TabMenu` is renamed `TabPop` and `TabMenuMotion` is renamed `TabFab`. Types follow (`TabPopProps`, `TabPopAnimation`, `TabPopTab`, `TabPopDirection`, `TabPopPlacement`, `TabFabProps`, `TabFabTab`, `TabFabItem`), and so do the CSS classes (`.tab-menu*` → `.tab-pop*`, `.tab-menu-motion*` → `.tab-fab*`).
- cf285ed: `Tooltip`: new `jelly` prop, the bubble wobbles like jelly when it opens (width and height bounce out of phase), with the same springs as `Modal`. Pass a number from 0 to 1, or just `jelly` for the Modal default (0.5). Off when omitted.

### Patch Changes

- 66300c7: TabFab, ExpandButton and the ShapeToolbar menus: the JS-driven animations (TabFab re-centering, ExpandButton width, menu layout) were instant in production builds, because minified CSS writes durations in seconds (`.494s`) and they were read as milliseconds. No more grey tap highlight on iOS.
- fc14e2d: The goo filter is now on only while shapes move. `Dialog`, `Toast`, `Tooltip` and `Popover` drop it once their animation has finished (as `Modal` already did) and put it back when they close or move again. At rest the shadow is a regular `box-shadow`, so hovers, focus, typing and scrolling no longer re-run the filter (it runs in software on iOS). The arrow joint of `Tooltip`/`Popover` loses its tiny goo fillet while open.
- f210256: `TabPop`, `TabFab` and gooey `Modal` showed up again on Safari/iOS: the goo filter area is now set relative to the element (objectBoundingBox) instead of `userSpaceOnUse`, which Safari ignores on HTML elements and hid the whole component. `TabPop` also uses a tighter filter area, only on the side the bar opens.
- d78de6f: `Modal` filters a much smaller area while it animates: `swell` covers the card plus a margin (it was 2×3 times the card), `drop` covers the card and the drop's path (it was the whole window). `GooFilter`'s `region` can now be a function of the element's size.
- cb58edc: Smoother animations on iOS: no component animates `filter: blur()` any more (TabFab pages, Modal and Dialog reveal, Toast, Tooltip and Popover content, ExpandButton label, ShapeEditor). Each blur was a filter recomputed on every frame, often nested inside a goo filter. Entrances and exits keep their fade, slide and scale.
- 9c255a0: Infinite animations pause while off-screen: `GloopLoading`, indeterminate or dripping `ProgressBar` and dripping `ExpandButton` stop when scrolled out of view and resume when they come back, instead of re-running their goo filter on every frame for nobody.
- 31df805: TabFab: hovering a tab while the bar is still opening no longer shows a solid circle inside the rollover pill. The tab's drop was painted over the pill while the tab was still moving.
- 41a2e23: `TabFab` no longer uses an SVG goo filter, so it opens, closes and switches sub-menu smoothly on iOS. The bar background is made of three pieces animated with transform only (the "+" circle, a middle stretch that scales, a head that slides), the neck between tab and sub-menu is a CSS shape that moves with the panel, and shadows are regular `box-shadow`s on a layer underneath. Visible change: the tabs slide out with the bar instead of shooting ahead as drops melted by the goo.
- 226fbad: Smooth `TabPop` opening on iOS: no more SVG goo filter, which Safari recomputes in software on every frame (and clipped the neck on iOS). The liquid neck between the "+" and the bar is now a CSS shape with concave sides, and everything animates with transform and opacity on the GPU. The shadow is a regular `box-shadow`, and tabs no longer animate `filter: blur()`. The goo filter shadow of the other gooey components reuses the goo blur instead of a second `feDropShadow` blur (slightly tighter).
- 31df805: `List` and `CircleMenu` ignore hover on touch: a tap no longer leaves the hover pill (or the enlarged blob) stuck, nor animates a second goo layer. `CircleMenu`'s goo shadow reuses the goo blur instead of a second `feDropShadow` blur.

## 0.4.0

### Minor Changes

- 897df3a: Global motion settings. `GloopMotionProvider` sets the speed (`speed`), the character (`motion`: `'gloop' | 'smooth' | 'snappy'`), on/off (`animated`) and reduced-motion handling (`reducedMotion`: `'user' | 'always' | 'never'`) of every component inside it. Every component accepts the same props to override the provider. `speed` on `ProgressBar` and `GloopLoading` now scales all their animations, not only the loop.
- d72ce0a: New `Modal`: a full-size modal that opens as a soft blob of jelly — the card swells with width and height bouncing out of phase while its sides wobble — and deflates back into a drop when it closes. Optional title (string or JSX) with close button, content that adapts to the available height and scrolls, and an optional footer with buttons (`actions`, ExpandButton) and/or custom JSX (`footer`). Sizes `sm | md | lg | full`; opening animation `enter` (`swell`, or `drop`: a drop flies out of the button that opened it, faster and more stretched the farther it comes from, squashes in the middle and spreads into the card, then flies back on close); how much it wobbles with `jelly` (0–1, default 0.5); `closeOnBackdrop`, `closeOnEscape`, `afterClose`, backdrop color/opacity/blur. Open it programmatically with `useModal().open(options)` inside a `ModalProvider`: the handle has `close(result)`, `update(options)` and a `result` promise that resolves with the `value` of the button pressed.
- 2921dbd: TabBar: `orientation="vertical"` for a column of tabs (fixed bars pin to the left edge), and a liquid rollover pill that follows the cursor. TabMenuMotion gets the same rollover pill.
- 192448b: `TabMenu`: new `animation` prop (`'slide' | 'pop' | 'bounce'`, default `'slide'`). With `'pop'` the liquid drop reaches out from the "×" first, then the bar pops open from its center toward the sides with a slight bounce, tabs cascading from the center. `'bounce'` opens like pop, with a back-out ease on its width: it overshoots its size, then settles.
  
  `TabMenu`: new `iconOnly` (tabs show only their icon, the label stays as accessible name) and `tabGap` (space between icons in px, default 50, down to 0) props.
- 2921dbd: `TabMenuSubmenu` merged into `TabMenuMotion`: tabs accept optional `items` to open a sub-menu, plus the `attached` prop. Without `items` the bar stays a `tablist`. Switching between sub-menus, the liquid neck slides from one tab to the other instead of popping out and back in.
- 78ea004: `Toast`: new toast that drips from the screen edge as a liquid drop and swells into a pill; auto-dismiss with pause on hover and focus, top/bottom positions, start/center/end alignment, `variant` (info, success, warning, error) and custom `color` that fill the whole blob, toasts open at the same time stack (newest against the edge, the others slide away), reduced-motion fallback.

## 0.3.0

### Minor Changes

- 3c01c37: New `GloopLoading`: a liquid loader where a drop falls in, bounces, swells into a blob and keeps dripping, with an optional `title` and `description`. `size`, `color` (solid or `[from, to]` gradient) and `speed` are configurable; `intro={false}` skips the fall. Static with `prefers-reduced-motion`.
- 2a2871d: `List` accepts groups with a title (`{ type: 'group', id, label, items }`) and dividers (`{ type: 'divider' }`) among its items. The liquid pill moves across groups and dividers. New exported types: `ListEntry`, `ListGroup`, `ListDivider`.
- a383020: New `ProgressBar`: a liquid progress bar whose blob head springs ahead on every update while the fill catches up, fused by the goo filter. Without `value` it is indeterminate, with blobs that run, merge and split. Optional `drip`, `showValue` (`'inside'` or `'bubble'`), `formatValue`, `color` (solid or `[from, to]` gradient), `thickness` and `speed`. Calm with `prefers-reduced-motion`.
- 3c01c37: `TabBar`: `layout="inline"` puts icon, label and value on one row, with tabs as wide as their content; `value` on each tab shows a counter or badge (next to the label inline, on the icon when stacked); `position="static"` keeps the bar in the page flow instead of fixed to the bottom. `GooPill` now animates its `length` with the same springs, so the pill stretches between items of different widths.
- d9bd842: Add the optional `--ui-surface` token for the Popover and Dialog background. By default it is `--ui-bg` mixed 6% toward `--ui-fg`, so inputs and buttons inside them stand out. Popover scrollbars are now thin.
  
  Fix Dialog: an input inside it no longer loses focus after each keystroke when `onClose` is an inline function.

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
