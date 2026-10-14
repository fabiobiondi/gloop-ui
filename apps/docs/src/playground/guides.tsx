import type { ReactNode } from 'react'
import changelog from '../../../../packages/gloop-ui/CHANGELOG.md?raw'
import { CodeBlock } from './CodeBlock'
import { Markdown } from './Markdown'

export type Guide = {
  id: string
  name: string
  description: string
  content: ReactNode
}

const INSTALL = `npm install gloop-ui motion`

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

export const guides: Guide[] = [
  {
    id: 'getting-started',
    name: 'Getting started',
    description: 'Install gloop-ui, import the stylesheet once, and use the components.',
    content: (
      <div className="pg-prose">
        <h2>Install</h2>
        <p>
          <code>react</code> and <code>react-dom</code> 19 and <code>motion</code> 14 are peer dependencies.
        </p>
        <CodeBlock code={INSTALL} lang="bash" />

        <h2>Import the styles</h2>
        <p>All the CSS ships in a single file. Import it once, before your own styles.</p>
        <CodeBlock code={STYLES} />

        <h2>Use a component</h2>
        <p>
          Icons are plain <code>ReactNode</code>s: use any icon set you like (Lucide, Heroicons, your own SVGs).
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
          (<code>prefers-reduced-motion</code>), the liquid effects and springs are toned down.
        </p>
      </div>
    ),
  },
  {
    id: 'theming',
    name: 'Theming',
    description: 'Three CSS variables color every component. Try them in the Theme panel on the left.',
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
    id: 'logo-draft',
    name: 'Logo Draft',
    description: 'Ideas for a gloop-ui logo. Work in progress: none of them is the official logo yet.',
    content: (
      <div className="pg-prose">
        <p className="pg-callout">
          <strong>Work in progress.</strong> These are early drafts we are still choosing from. Shapes, colors and
          names may change, and some drafts will be dropped. Please don't use them as the gloop-ui logo yet.
        </p>
        <p>
          Eight soft, blob-style concepts. Switch palette and background to compare them, and check how each one
          reads at favicon size.{' '}
          <a href={LOGO_DRAFTS_URL} target="_blank" rel="noreferrer">
            Open in a new tab
          </a>
        </p>
        <iframe className="pg-frame" src={LOGO_DRAFTS_URL} title="gloop-ui logo drafts" loading="lazy" />
      </div>
    ),
  },
  {
    id: 'changelog',
    name: 'Changelog',
    description: 'Every release of gloop-ui. Versions follow SemVer; while in 0.x, minor releases may break.',
    content: <Markdown source={changelog} />,
  },
]
