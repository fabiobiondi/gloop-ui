import { useEffect, useRef, useState, type ReactNode } from 'react'
import changelog from '../../../../packages/gloop-ui/CHANGELOG.md?raw'
import { CodeBlock } from './CodeBlock'
import { Markdown } from './Markdown'
import { Home } from './Home'
import {
  DIALOG_CODE,
  DialogExample,
  EXPAND_BUTTON_CODE,
  ExpandButtonExample,
  REACT_ICONS_INSTALL,
  TAB_BAR_CODE,
  TabBarExample,
} from './ReactIconsDemos'
import {
  MOTION_OFF_CODE,
  MOTION_OVERRIDE_CODE,
  MOTION_PROVIDER_CODE,
  MotionOverrideExample,
  MotionPlayground,
} from './MotionDemos'

export type Guide = {
  id: string
  name: string
  description: string
  content: ReactNode
  /** La pagina disegna da sé titolo e intro (homepage) */
  hideHeader?: boolean
}

const INSTALL = `npm install gloop-ui`

const STYLES = `// main.tsx (once, in your app entry)
import 'gloop-ui/styles.css'`

const USAGE = `import { ExpandButton } from 'gloop-ui'

function LikeButton() {
  return <ExpandButton icon={<HeartIcon />} label="Added" activeColor="#e11d48" />
}`

const THEME_GLOBAL = `:root {
  --ui-bg: #18181b;     /* surface of bars, buttons and blobs */
  --ui-fg: #ffffff;     /* text and icons on the surface */
  --ui-accent: #4f7cff; /* focus, selection and active states */
  /* Optional: Popover and Dialog background.
     Default: --ui-bg mixed 6% toward --ui-fg */
  --ui-surface: #222225;
}`

const THEME_LOCAL = `/* Only the components inside .promo */
.promo {
  --ui-bg: #fff1f2;
  --ui-fg: #881337;
  --ui-accent: #e11d48;
}`

const THEME_INLINE = `<div style={{ '--ui-bg': '#312e81', '--ui-accent': '#f472b6' } as CSSProperties}>
  <TabBar tabs={tabs} />
</div>`

// Pagina statica in public/: vive fuori dall'app React, quindi va caricata in un iframe
const LOGO_DRAFTS_URL = `${import.meta.env.BASE_URL}logo-drafts.html`

// L'iframe prende l'altezza del suo contenuto (stessa origine): niente scroll interno,
// la pagina dei loghi scorre insieme alla pagina docs
function LogoDraftsFrame() {
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(900)
  const observer = useRef<ResizeObserver | null>(null)

  useEffect(() => () => observer.current?.disconnect(), [])

  const onLoad = () => {
    const doc = ref.current?.contentDocument
    if (!doc) return
    // Si fonde con la pagina docs: niente sfondo né margini propri
    const style = doc.createElement('style')
    style.textContent = 'body, .toolbar { background: transparent } .wrap { padding: 24px 0 0 }'
    doc.head.append(style)
    observer.current?.disconnect()
    observer.current = new ResizeObserver(() => setHeight(doc.documentElement.scrollHeight))
    observer.current.observe(doc.body)
  }

  return (
    <iframe
      ref={ref}
      className="pg-frame-full"
      src={LOGO_DRAFTS_URL}
      title="gloop-ui logo drafts"
      scrolling="no"
      style={{ height }}
      onLoad={onLoad}
    />
  )
}

export const guides: Guide[] = [
  {
    id: 'what-is-gloop',
    name: 'What is Gloop?',
    description: 'React components that move like liquid.',
    hideHeader: true,
    content: <Home />,
  },
  {
    id: 'getting-started',
    name: 'Getting started',
    description: 'Install gloop-ui, import the stylesheet once, and use the components.',
    content: (
      <div className="pg-prose">
        <h2>Install</h2>
        <p>
          <code>react</code> and <code>react-dom</code> 19 are peer dependencies. No animation library needed: everything is animated with CSS.
        </p>
        <p>
          It needs browsers with CSS <code>linear()</code>, <code>@property</code> and <code>@starting-style</code>:
          Chrome 117+, Safari 17.5+, Firefox 129+. Older browsers skip the entrance animations.
        </p>
        <CodeBlock code={INSTALL} lang="bash" />

        <h2>Import the styles</h2>
        <p>All the CSS ships in a single file. Import it once, before your own styles.</p>
        <CodeBlock code={STYLES} />

        <h2>Use a component</h2>
        <p>
          Icons are plain <code>ReactNode</code>s: use any icon set you like (Lucide, Heroicons, your own SVGs). See{' '}
          <a href="#react-icons">With React Icons</a>.
        </p>
        <CodeBlock code={USAGE} />

        <h2>Next.js and Server Components</h2>
        <p>
          The bundle is marked <code>'use client'</code>, so you can render the components straight from a Server
          Component in the App Router.
        </p>

        <h2>Accessibility and motion</h2>
        <p>
          Every component works with the keyboard and screen readers. When the user asks for reduced motion
          (<code>prefers-reduced-motion</code>), the liquid effects and springs are toned down. Speed, character and
          reduced motion can be configured for the whole app: see <a href="#motion">Motion</a>.
        </p>
      </div>
    ),
  },
  {
    id: 'theming',
    name: 'Theming',
    description: 'Three CSS variables color every component. Try them in the Theme panel in the sidebar.',
    content: (
      <div className="pg-prose">
        <h2>The variables</h2>
        <p>Shades (muted text, borders, hover) are derived from these three with <code>color-mix</code>.</p>
        <CodeBlock code={THEME_GLOBAL} lang="css" />
        <p>
          <code>--ui-surface</code> is optional. It is the background of <code>Popover</code> and <code>Dialog</code>,
          a shade lighter than <code>--ui-bg</code> by default, so the inputs and buttons inside them stand out.
        </p>

        <h2>Scoped themes</h2>
        <p>The variables are inherited, so you can redefine them on any ancestor to theme just one area.</p>
        <CodeBlock code={THEME_LOCAL} lang="css" />
        <p>Or inline, right around a component:</p>
        <CodeBlock code={THEME_INLINE} />
        <p>
          <code>Dialog</code> renders in a portal on <code>&lt;body&gt;</code>, but it reads the variables from where
          you place it, so it follows the local theme too.
        </p>
      </div>
    ),
  },
  {
    id: 'motion',
    name: 'Motion',
    description: 'Speed up, slow down or turn off the animations of every component, globally or one at a time.',
    content: (
      <div className="pg-prose">
        <h2>Try it</h2>
        <p>Every component below sits inside the same provider. Change the options and play with them.</p>
        <div className="pg-stage" style={{ minHeight: 420 }}>
          <MotionPlayground />
        </div>

        <h2>Global settings</h2>
        <p>
          Wrap your app (or any area of it) in <code>GloopMotionProvider</code>. Every gloop-ui component inside it
          follows its settings, portals included (<code>Dialog</code>, <code>Popover</code>, <code>Tooltip</code>).
        </p>
        <CodeBlock code={MOTION_PROVIDER_CODE} />
        <div className="pg-props">
        <div className="pg-props__scroll">
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>Default</th>
              <th>What it does</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>speed</code></td>
              <td><code>1</code></td>
              <td>Speed multiplier: <code>2</code> is twice as fast, <code>0.5</code> half as fast. Every transition and animation scales, and the bouncy presets keep their bounce.</td>
            </tr>
            <tr>
              <td><code>motion</code></td>
              <td><code>'gloop'</code></td>
              <td>Character of the transitions (see below).</td>
            </tr>
            <tr>
              <td><code>animated</code></td>
              <td><code>true</code></td>
              <td><code>false</code> turns every animation off: state changes are instant.</td>
            </tr>
            <tr>
              <td><code>reducedMotion</code></td>
              <td><code>'user'</code></td>
              <td><code>'user'</code> follows the OS setting, <code>'always'</code> always uses the reduced variant, <code>'never'</code> ignores the OS.</td>
            </tr>
          </tbody>
        </table>
        </div>
        </div>

        <h2>Presets</h2>
        <ul>
          <li><code>gloop</code>: the original springs, bouncy and liquid.</li>
          <li><code>smooth</code>: the same timing with no bounce, for calmer interfaces.</li>
          <li><code>snappy</code>: about 25% faster with half the bounce.</li>
        </ul>

        <h2>Override a single component</h2>
        <p>
          Every component accepts the same four props. A prop wins over the nearest provider, and nested providers
          merge with the outer ones, so you only set what changes.
        </p>
        <div className="pg-stage" style={{ minHeight: 140 }}>
          <MotionOverrideExample />
        </div>
        <CodeBlock code={MOTION_OVERRIDE_CODE} />

        <h2>Turning motion off and reduced motion</h2>
        <p>
          With reduced motion the components keep working but drop the liquid effects: no goo, no drops, no
          stretching, softer transitions. With <code>animated={'{false}'}</code> nothing moves at all, which is handy
          for end-to-end tests and visual snapshots.
        </p>
        <CodeBlock code={MOTION_OFF_CODE} />
        <p>
          Prefer <code>'user'</code> in production: <code>'never'</code> overrides a choice the user made for
          accessibility reasons.
        </p>
      </div>
    ),
  },
  {
    id: 'react-icons',
    name: 'With React Icons',
    description: 'Use any React Icons set: pass the icon element to the icon prop.',
    content: (
      <div className="pg-prose">
        <h2>Install</h2>
        <CodeBlock code={REACT_ICONS_INSTALL} lang="bash" />

        <h2>How it works</h2>
        <p>
          Every <code>icon</code> prop takes a <code>ReactNode</code>, so pass the element:{' '}
          <code>{'icon={<FaHeart />}'}</code>, not <code>{'icon={FaHeart}'}</code>. The component sizes the icon and
          colors it through <code>currentColor</code>, so you don't need <code>size</code> or <code>color</code>.
          Outline sets (Lucide, Feather) and filled sets (Font Awesome, Material) both work.
        </p>

        <h2>ExpandButton with Font Awesome</h2>
        <p>
          When active, the button fills the icon. That effect shows on outline icons only, so use the <code>Reg</code>{' '}
          variant here.
        </p>
        <div className="pg-stage" style={{ minHeight: 160 }}>
          <ExpandButtonExample />
        </div>
        <CodeBlock code={EXPAND_BUTTON_CODE} />

        <h2>TabBar with Lucide</h2>
        <div className="pg-stage" style={{ minHeight: 160 }}>
          <TabBarExample />
        </div>
        <CodeBlock code={TAB_BAR_CODE} />

        <h2>Dialog with Material Design</h2>
        <p>The badge and each action take an icon too.</p>
        <div className="pg-stage" style={{ minHeight: 160 }}>
          <DialogExample />
        </div>
        <CodeBlock code={DIALOG_CODE} />

        <h2>Limits</h2>
        <p>
          A few icons are drawn inside the components and can't be replaced: the toolbar icons of{' '}
          <code>ShapeEditor</code> and the submenu chevron of <code>CircleMenu</code>. They keep a Lucide-like style.
        </p>
      </div>
    ),
  },
  {
    id: 'logo-draft',
    name: 'Logo Draft',
    description: 'Ideas for a gloop-ui logo. Work in progress: none of them is the official logo yet.',
    // La pagina statica ha già titolo e intro
    hideHeader: true,
    content: (
      <>
        <div className="pg-prose">
          <p className="pg-callout">
            <strong>Work in progress.</strong> These are early drafts we are still choosing from. Shapes, colors and
            names may change, and some drafts will be dropped. Please don't use them as the gloop-ui logo yet.
          </p>
        </div>
        <LogoDraftsFrame />
      </>
    ),
  },
  {
    id: 'changelog',
    name: 'Changelog',
    description: 'Every release of gloop-ui. Versions follow SemVer; while in 0.x, minor releases may break.',
    content: <Markdown source={changelog} />,
  },
]
