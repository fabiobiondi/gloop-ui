import { useEffect, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import GooPill from '../components/GooPill'
import { entries, type Demo } from './demos'
import './Playground.css'

// Devono combaciare con altezza e gap delle voci in Playground.css
const NAV_ITEM_HEIGHT = 36
const NAV_ITEM_GAP = 2

// Il componente scelto sta nell'hash (#circle-menu): sopravvive al reload e si può linkare
function useHashEntry() {
  const read = () => entries.find((e) => `#${e.id}` === window.location.hash) ?? entries[0]
  const [entry, setEntry] = useState(read)

  useEffect(() => {
    const onHashChange = () => setEntry(read())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return entry
}

type Theme = { bg: string; fg: string; accent: string }

// Corrispondono ai default di components/theme.css
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

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1400)
    return () => clearTimeout(t)
  }, [copied])

  return (
    <div className="pg-code">
      <pre>
        <code>{code}</code>
      </pre>
      <button
        type="button"
        className="pg-code__copy"
        onClick={() => navigator.clipboard.writeText(code).then(() => setCopied(true))}
      >
        {/* Le due scritte si scambiano con una dissolvenza sfocata */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? 'copied' : 'copy'}
            initial={{ opacity: 0, filter: 'blur(2px)', y: 4 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(2px)', y: -4 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          >
            {copied ? 'Copied' : 'Copy'}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
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

function Playground() {
  const entry = useHashEntry()
  const activeIndex = entries.indexOf(entry)
  const [theme, setTheme] = useTheme()

  // Le variabili ereditate da tutti i componenti (vedi components/theme.css)
  const themeVars = Object.fromEntries(
    THEME_FIELDS.map(({ key, variable }) => [variable, theme[key]]),
  ) as CSSProperties

  return (
    <div className="pg" style={themeVars}>
      <aside className="pg-sidebar">
        <p className="pg-sidebar__title">Components</p>
        <nav aria-label="Components" className="pg-nav">
          {/* Stessa pillola liquida della tabbar, in verticale */}
          <GooPill
            index={activeIndex}
            step={NAV_ITEM_HEIGHT + NAV_ITEM_GAP}
            length={NAV_ITEM_HEIGHT}
            inset={0}
            axis="y"
            radius={10}
            opacity={0.1}
          />
          {entries.map((e) => (
            <a
              key={e.id}
              href={`#${e.id}`}
              className="pg-nav__item"
              aria-current={e === entry ? 'page' : undefined}
            >
              {e.name}
              <span className="pg-nav__count">{e.demos.length}</span>
            </a>
          ))}
        </nav>

        <ThemePanel theme={theme} onChange={setTheme} />
      </aside>

      <main className="pg-main">
        {/* key: cambiando componente le demo ripartono da zero (menu chiusi) */}
        <div key={entry.id} className="pg-page">
          <header className="pg-page__header">
            <h1>{entry.name}</h1>
            <p>{entry.description}</p>
          </header>
          {entry.demos.map((demo) => (
            <DemoCard key={demo.title} demo={demo} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default Playground
