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
| `CircleMenu` | A "+" that throws icons around itself, with optional sub-menus |
| `TabMenu` · `TabMenuMotion` · `TabMenuSubmenu` | Liquid tab menus that drop out of a trigger |
| `TabBar` | Bottom navigation bar with a liquid selection pill |
| `Dialog` | Liquid modal with icon badge and dripping actions |
| `ShapeEditor` | Excalidraw-style shape toolbar with nested popovers |
| `GooPill` · `GooFilter` | Building blocks of the liquid effect |

## Theming

All components read three CSS variables. Set them globally or on any ancestor:

```css
:root {
  --ui-bg: #18181b;     /* surface of bars, buttons and blobs */
  --ui-fg: #ffffff;     /* text and icons */
  --ui-accent: #4f7cff; /* focus, selection, active states */
}

.my-area { --ui-bg: #fff; --ui-fg: #18181b; --ui-accent: #e11d48; }
```

## Next.js

The bundle is marked `'use client'`, so the components work directly in Server Components files of the App Router.

## Versioning

gloop-ui follows [SemVer](https://semver.org). While the version is `0.x`, minor releases may contain breaking changes; they are always listed in the [changelog](./CHANGELOG.md).

## License

MIT © Fabio Biondi
