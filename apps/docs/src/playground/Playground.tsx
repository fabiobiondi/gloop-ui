import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { List, Tooltip } from 'gloop-ui'
import { version } from 'gloop-ui/package.json'
import { CodeBlock } from './CodeBlock'
import { GloopMark } from './GloopMark'
import { entries, type Demo, type Entry } from './demos'
import { guides, type Guide } from './guides'
import { propsById, type PropDoc } from './props'
import { upcoming } from './upcoming'
import './Playground.css'

const REPO_URL = 'https://github.com/fabiobiondi/gloop-ui'
const NPM_URL = 'https://www.npmjs.com/package/gloop-ui'

type Page = Guide | Entry
const pages: Page[] = [...guides, ...entries, ...upcoming]

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

// Chiuso di default: si vede solo "Change theme", al click si apre e resta fisso in fondo
function ThemePanel({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="pg-theme" data-open={open || undefined} aria-labelledby="pg-theme-title">
      <div className="pg-theme__head">
        <button
          id="pg-theme-title"
          type="button"
          className="pg-theme__toggle"
          aria-expanded={open}
          aria-controls="pg-theme-body"
          onClick={() => setOpen((o) => !o)}
        >
          {/* Tavolozza con i colori del logo */}
          <svg className="pg-theme__palette" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
            <circle cx="13.5" cy="6.5" r="1.7" fill="#ff7ab6" />
            <circle cx="17.5" cy="10.5" r="1.7" fill="#7b5cff" />
            <circle cx="8.5" cy="7.5" r="1.7" fill="#facc15" />
            <circle cx="6.5" cy="12.5" r="1.7" fill="#34d399" />
          </svg>
          <svg className="pg-theme__chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 15 6-6 6 6" />
          </svg>
          Change theme
        </button>
        {open && (
          <Tooltip content="RESET THEME" placement="top">
            <button
              type="button"
              className="pg-theme__reset"
              aria-label="Reset theme"
              // aria-disabled, non disabled: un bottone disabled non riceve l'hover e il tooltip non si aprirebbe
              aria-disabled={same(theme, DEFAULT_THEME)}
              onClick={() => !same(theme, DEFAULT_THEME) && onChange(DEFAULT_THEME)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </Tooltip>
        )}
      </div>

      {/* Righe della griglia da 0fr a 1fr: l'altezza si anima senza misurarla. inert: chiuso non si raggiunge col Tab */}
      <div id="pg-theme-body" className="pg-theme__body" inert={!open}>
        <div className="pg-theme__inner">
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
        </div>
      </div>
    </section>
  )
}

// Id delle sezioni per la ToC: l'hash resta alla pagina, quindi niente #ancore
const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
const sectionId = (pageId: string, title: string) => `${pageId}--${slug(title)}`

type TocItem = { id: string; label: string }

// Sezione attiva: l'ultima il cui inizio ha superato la soglia in alto
const ACTIVE_OFFSET = 120

function useActiveSection(items: TocItem[]) {
  const [active, setActive] = useState(items[0]?.id)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      let current = items[0]?.id
      for (const item of items) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = item.id
      }
      setActive(atBottom ? items[items.length - 1]?.id : current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [items])

  return active
}

function Toc({ items }: { items: TocItem[] }) {
  const active = useActiveSection(items)

  const go = (id: string) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <nav className="pg-toc" aria-labelledby="pg-toc-title">
      <p id="pg-toc-title" className="pg-toc__title">
        On this page
      </p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              aria-current={item.id === active ? 'location' : undefined}
              onClick={() => go(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function DemoCard({ demo, id }: { demo: Demo; id: string }) {
  const { minHeight = 200, align = 'center', device, bleed } = demo.stage ?? {}

  return (
    <section id={id} className="pg-demo">
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

function PropsTable({ props, id }: { props: PropDoc[]; id: string }) {
  return (
    <section id={id} className="pg-props" aria-labelledby="pg-props-title">
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

// Sottogruppi dei componenti
const COMPONENT_GROUPS = [
  { title: 'Menus & Buttons', items: entries.filter((e) => e.group === 'menus') },
  { title: 'Overlays', items: entries.filter((e) => e.group === 'overlays') },
  { title: 'Forms', items: entries.filter((e) => e.group === 'forms') },
  { title: 'Various', items: entries.filter((e) => e.group === 'various') },
].filter((g) => g.items.length > 0)

// Voci della sidebar: ogni gruppo è una List, con la pillola fissa solo se la pagina è lì
function NavGroup({
  title,
  items,
  current,
  sub = false,
}: {
  title: string
  items: Page[]
  current: Page
  sub?: boolean
}) {
  return (
    <>
      <p className={sub ? 'pg-sidebar__subtitle' : 'pg-sidebar__title'}>{title}</p>
      <List
        label={title}
        className="pg-nav"
        itemHeight={36}
        radius={10}
        value={items.includes(current) ? current.id : null}
        items={items.map((p) => ({
          id: p.id,
          label: p.name,
          href: `#${p.id}`,
          meta: 'demos' in p ? p.demos.length : undefined,
        }))}
      />
    </>
  )
}

// Schermi stretti: la sidebar diventa un menu a cassetto aperto dall'hamburger
function useMobileMenu(pageId: string) {
  const [open, setOpen] = useState(false)

  // Scelta una pagina il menu si chiude (anche dal browser: indietro/avanti)
  useEffect(() => setOpen(false), [pageId])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    // Tornati su schermo largo il cassetto non esiste più: niente stato appeso
    const wide = window.matchMedia('(min-width: 761px)')
    const onWide = () => wide.matches && setOpen(false)
    // La pagina sotto non scorre
    const overflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    wide.addEventListener('change', onWide)
    return () => {
      document.documentElement.style.overflow = overflow
      document.removeEventListener('keydown', onKeyDown)
      wide.removeEventListener('change', onWide)
    }
  }, [open])

  return [open, setOpen] as const
}

function Playground() {
  const page = useHashPage()
  const [theme, setTheme] = useTheme()
  const [menuOpen, setMenuOpen] = useMobileMenu(page.id)

  // Le variabili ereditate da tutti i componenti (vedi gloop-ui, theme.css)
  const themeVars = Object.fromEntries(
    THEME_FIELDS.map(({ key, variable }) => [variable, theme[key]]),
  ) as CSSProperties

  const props = 'demos' in page ? propsById[page.id] : undefined
  const hasProps = !!props && props.length > 0
  const propsId = sectionId(page.id, 'props')

  // Solo le pagine dei componenti hanno la ToC: una voce per demo, più le props
  const toc = useMemo<TocItem[]>(
    () =>
      'demos' in page
        ? [
            ...page.demos.map((d) => ({ id: sectionId(page.id, d.title), label: d.title })),
            ...(hasProps ? [{ id: propsId, label: 'Props' }] : []),
          ]
        : [],
    [page, hasProps, propsId],
  )

  return (
    <div className="pg" style={themeVars}>
      {/* Solo su schermi stretti (CSS): marchio e hamburger */}
      <header className="pg-topbar">
        <a href="#what-is-gloop" className="pg-brand__name">
          <GloopMark className="pg-brand__mark" />
          gloop-ui
        </a>
        <button
          type="button"
          className="pg-topbar__menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="pg-sidebar"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" data-open={menuOpen || undefined}>
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        </button>
      </header>
      <div className="pg-scrim" data-open={menuOpen || undefined} aria-hidden="true" onClick={() => setMenuOpen(false)} />

      <aside
        id="pg-sidebar"
        className="pg-sidebar"
        data-open={menuOpen || undefined}
        // Un link interno chiude il menu anche se porta alla pagina già aperta (l'hash non cambia)
        onClick={(e) => {
          if ((e.target as Element).closest('a[href^="#"]')) setMenuOpen(false)
        }}
      >
        <header className="pg-brand">
          <a href="#what-is-gloop" className="pg-brand__name">
            <GloopMark className="pg-brand__mark" />
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
        <hr className="pg-sidebar__divider" />
        <p className="pg-sidebar__title">Components</p>
        {COMPONENT_GROUPS.map((g) => (
          <NavGroup key={g.title} title={g.title} items={g.items} current={page} sub />
        ))}
        <div className="pg-sidebar__gap" />
        <hr className="pg-sidebar__divider" />
        <NavGroup title="Coming soon" items={upcoming} current={page} />

        <ThemePanel theme={theme} onChange={setTheme} />
      </aside>

      <main className="pg-main">
        {/* key: cambiando pagina le demo ripartono da zero (menu chiusi) */}
        <div key={page.id} className="pg-page" data-toc={toc.length > 0 || undefined}>
          {!('hideHeader' in page && page.hideHeader) && (
            <header className="pg-page__header">
              <h1>
                {page.name}
                {'status' in page && page.status === 'experimental' && <span className="pg-badge">Experimental</span>}
              </h1>
              <p>{page.description}</p>
              {'notice' in page && page.notice && (
                <p className="pg-notice" role="note">
                  {page.notice}
                </p>
              )}
            </header>
          )}
          {toc.length > 0 && <Toc items={toc} />}
          <div className="pg-page__body">
            {'demos' in page
              ? page.demos.map((demo) => (
                  <DemoCard key={demo.title} demo={demo} id={sectionId(page.id, demo.title)} />
                ))
              : page.content}
            {hasProps && <PropsTable props={props} id={propsId} />}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Playground
