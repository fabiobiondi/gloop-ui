# gloop-ui

Soft, blobby, fluid React components with liquid "goo" animations.

**[Documentation & live demos →](https://fabiobiondi.github.io/gloop-ui/)**

## Install

```sh
npm install gloop-ui motion
```

`react` and `react-dom` 19 and `motion` 14 are peer dependencies.

## Usage

Import the stylesheet once, for example in your app entry:

```tsx
import 'gloop-ui/styles.css'
```

Then use the components:

```tsx
import { ExpandButton, TabBar } from 'gloop-ui'

<ExpandButton icon={<HeartIcon />} label="Added" activeColor="#e11d48" />
```

## Components

| Component | What it does |
| --- | --- |
| `ExpandButton` | Icon button that expands into a label with a pop and a burst |
| `Search` | Magnifier that stretches into a search field |
| `Input` | Text field whose label drips out on top as a liquid tab |
| `Slider` | Range slider with a liquid thumb that stretches while dragged and a dripping value |
| `CircleMenu` | A "+" that throws icons around itself, with optional sub-menus |
| `TabPop` · `TabFab` | Liquid tab menus that drop out of a trigger; `TabFab` tabs can open sub-menus |
| `TabBar` | Navigation bar with a liquid selection pill: fixed at the bottom or inline, with optional counters |
| `ProgressBar` | Liquid progress bar: a blob head springs ahead and the fill catches up; indeterminate mode, optional drip |
| `Dialog` | Liquid modal with icon badge and dripping actions |
| `Tooltip` | Hover/focus tooltip that drips out of its arrow, with delay, flip and shift |
| `Popover` | Liquid popover for forms and components: outside click, Escape, `close()` / `usePopover()`, rollout |
| `FloatingBoundary` | Area that keeps tooltips, popovers and tab menus within its edges |
| `ShapeEditor` | Excalidraw-style shape toolbar with nested popovers |
| `GooPill` · `GooFilter` | Building blocks of the liquid effect |

## Theming

All components read three CSS variables, plus an optional fourth. Set them globally or on any ancestor:

```css
:root {
  --ui-bg: #18181b;     /* surface of bars, buttons and blobs */
  --ui-fg: #ffffff;     /* text and icons */
  --ui-accent: #4f7cff; /* focus, selection, active states */
  --ui-surface: #222225; /* optional: Popover and Dialog background (default: --ui-bg mixed 6% toward --ui-fg) */
}

.my-area { --ui-bg: #fff; --ui-fg: #18181b; --ui-accent: #e11d48; }
```

## Next.js

The bundle is marked `'use client'`, so the components work directly in Server Components files of the App Router.

## Versioning

gloop-ui follows [SemVer](https://semver.org). While the version is `0.x`, minor releases may contain breaking changes; they are always listed in the [changelog](./packages/gloop-ui/CHANGELOG.md).

## License

MIT © Fabio Biondi

## Development

This repository is an npm workspaces monorepo:

- `packages/gloop-ui` — the library published on npm
- `apps/docs` — the documentation site, deployed to GitHub Pages on every push to `main`

```sh
npm install
npm run dev        # docs site with the library sources (HMR)
npm test           # library tests
npm run build      # library + docs
npm run changeset  # describe a change for the changelog
```
