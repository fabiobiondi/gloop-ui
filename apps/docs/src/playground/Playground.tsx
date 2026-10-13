import { useEffect, useState, type CSSProperties } from 'react'
import { GooPill } from 'gloop-ui'
import { version } from 'gloop-ui/package.json'
import { CodeBlock } from './CodeBlock'
import { entries, type Demo, type Entry } from './demos'
import { guides, type Guide } from './guides'
import { propsById, type PropDoc } from './props'
import './Playground.css'

const REPO_URL = 'https://github.com/fabiobiondi/gloop-ui'
const NPM_URL = 'https://www.npmjs.com/package/gloop-ui'

// Devono combaciare con altezza e gap delle voci in Playground.css
const NAV_ITEM_HEIGHT = 36
const NAV_ITEM_GAP = 2

type Page = Guide | Entry
const pages: Page[] = [...guides, ...entries]

// La pagina scelta sta nell'hash (#circle-menu): sopravvive al reload e si può linkare
function useHashPage() {
  const read = () => pages.find((p) => `#${p.id}` === window.location.hash) ?? pages[0]
  const [page, setPage] = useState(read)

  useEffect(() => {
    const onHashChange = () => {
      setPage(read())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return page
}

type Theme = { bg: string; fg: string; accent: string }

// Corrispondono ai default di gloop-ui (theme.css)
const DEFAULT_THEME: Theme = { bg: '#18181b', fg: '#ffffff', accent: '#4f7cff' }

const PRESETS: { name: string; theme: Theme }[] = [
  { name: 'Dark', theme: DEFAULT_THEME },
  { name: 'Light', theme: { bg: '#ffffff', fg: '#18181b', accent: '#2563eb' } },
  { name: 'Indigo', theme: { bg: '#312e81', fg: '#e0e7ff', accent: '#f472b6' } },
  { name: 'Forest', theme: { bg: '#14532d', fg: '#dcfce7', accent: '#facc15' } },
  { name: 'Rose', theme: { bg: '#fff1f2', fg: '#881337', accent: '#e11d48' } },
]

const THEME_FIELDS: { key: keyof Theme; label: string; variable: string }[] = [
  { key: 'bg', label: 'Background', variable: '--ui-bg' },
  { key: 'fg', label: 'Text', variable: '--ui-fg' },
  { key: 'accent', label: 'Accent', variable: '--ui-accent' },
]

const STORAGE_KEY = 'playground-theme'

// Tema scelto, salvato in localStorage per ritrovarlo al reload
function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return { ...DEFAULT_THEME, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
    } catch {
      return DEFAULT_THEME
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
  }, [theme])

  return [theme, setTheme] as const
}

const same = (a: Theme, b: Theme) => THEME_FIELDS.every(({ key }) => a[key] === b[key])

function ThemePanel({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  return (
    <section className="pg-theme" aria-labelledby="pg-theme-title">
      <p id="pg-theme-title" className="pg-sidebar__title">
        Theme
      </p>

      <div className="pg-theme__presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className="pg-theme__preset"
            aria-label={preset.name}
            aria-pressed={same(theme, preset.theme)}
            title={preset.name}
            style={{ background: preset.theme.bg, color: preset.theme.fg }}
            onClick={() => onChange(preset.theme)}
          >
            <span style={{ background: preset.theme.accent }} />
          </button>
        ))}
      </div>

      {THEME_FIELDS.map(({ key, label, variable }) => (
        <label key={key} className="pg-theme__field">
          <input
            type="color"
            value={theme[key]}
            onChange={(e) => onChange({ ...theme, [key]: e.target.value })}
          />
          <span className="pg-theme__label">
            {label}
            <code>{variable}</code>
          </span>
          <span className="pg-theme__hex">{theme[key]}</span>
        </label>
      ))}

      <button
        type="button"
        className="pg-theme__reset"
        disabled={same(theme, DEFAULT_THEME)}
        onClick={() => onChange(DEFAULT_THEME)}
      >
        Reset
      </button>
    </section>
  )
}

function DemoCard({ demo }: { demo: Demo }) {
  const { minHeight = 200, align = 'center', device, bleed } = demo.stage ?? {}

  return (
    <section className="pg-demo">
      <header className="pg-demo__header">
        <h3>{demo.title}</h3>
        {demo.description && <p>{demo.description}</p>}
      </header>
      <div
        className="pg-stage"
        data-align={align}
        data-device={device || undefined}
        data-bleed={bleed || undefined}
        style={{ minHeight }}
      >
        {demo.preview}
      </div>
      <CodeBlock code={demo.code} />
    </section>
  )
}

function PropsTable({ props }: { props: PropDoc[] }) {
  return (
    <section className="pg-props" aria-labelledby="pg-props-title">
      <h2 id="pg-props-title">Props</h2>
      <div className="pg-props__scroll">
        <table>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {props.map((p) => (
              <tr key={p.name}>
                <td>
                  <code>{p.name}</code>
                  {p.required && <span className="pg-props__required" title="Required">*</span>}
                </td>
                <td>
                  <code>{p.type}</code>
                </td>
                <td>{p.default ? <code>{p.default}</code> : '—'}</td>
                <td>{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// Voci della sidebar: ogni gruppo ha la sua pillola liquida, visibile solo se la pagina è lì
function NavGroup({ title, items, current }: { title: string; items: Page[]; current: Page }) {
  const activeIndex = items.indexOf(current)

  return (
    <>
      <p className="pg-sidebar__title">{title}</p>
      <nav aria-label={title} className="pg-nav">
        {activeIndex >= 0 && (
          <GooPill
            index={activeIndex}
            step={NAV_ITEM_HEIGHT + NAV_ITEM_GAP}
            length={NAV_ITEM_HEIGHT}
            inset={0}
            axis="y"
            radius={10}
            opacity={0.1}
          />
        )}
        {items.map((p) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            className="pg-nav__item"
            aria-current={p === current ? 'page' : undefined}
          >
            {p.name}
            {'demos' in p && <span className="pg-nav__count">{p.demos.length}</span>}
          </a>
        ))}
      </nav>
    </>
  )
}

function Playground() {
  const page = useHashPage()
  const [theme, setTheme] = useTheme()

  // Le variabili ereditate da tutti i componenti (vedi gloop-ui, theme.css)
  const themeVars = Object.fromEntries(
    THEME_FIELDS.map(({ key, variable }) => [variable, theme[key]]),
  ) as CSSProperties

  const props = 'demos' in page ? propsById[page.id] : undefined

  return (
    <div className="pg" style={themeVars}>
      <aside className="pg-sidebar">
        <header className="pg-brand">
          <a href="#getting-started" className="pg-brand__name">
            gloop-ui
          </a>
          <a href="#changelog" className="pg-brand__version" title="Changelog">
            v{version}
          </a>
        </header>
        <div className="pg-brand__links">
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={NPM_URL} target="_blank" rel="noreferrer">
            npm
          </a>
        </div>

        <NavGroup title="Guide" items={guides} current={page} />
        <div className="pg-sidebar__gap" />
        <NavGroup title="Components" items={entries} current={page} />

        <ThemePanel theme={theme} onChange={setTheme} />
      </aside>

      <main className="pg-main">
        {/* key: cambiando pagina le demo ripartono da zero (menu chiusi) */}
        <div key={page.id} className="pg-page">
          <header className="pg-page__header">
            <h1>{page.name}</h1>
            <p>{page.description}</p>
          </header>
          {'demos' in page ? page.demos.map((demo) => <DemoCard key={demo.title} demo={demo} />) : page.content}
          {props && props.length > 0 && <PropsTable props={props} />}
        </div>
      </main>
    </div>
  )
}

export default Playground
