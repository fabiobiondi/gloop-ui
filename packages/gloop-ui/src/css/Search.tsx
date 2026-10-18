import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { GloopMotionProvider, pickMotionProps, type MotionProps } from '../components/motion-context'
import { useCssMotion } from '../components/css-motion'
import '../components/theme.css'
import './Search.css'

export type SearchProps = {
  placeholder?: string
  /** Larghezza da aperto, in px */
  width?: number
  onSearch?: (query: string) => void
  /**
   * true: lo spazio da aperto è riservato subito, il contenuto a destra resta fermo.
   * false: lo slot cresce con il campo e spinge il contenuto a destra.
   */
  reserveSpace?: boolean
} & MotionProps

const CLOSED_WIDTH = 44
// Spazio extra a destra: la molla può "sforare" e rientrare senza essere tagliata
const OVERSHOOT = 28

/*
 * Niente animazione di width sul campo (ricalcola il layout a ogni frame e sfarfalla):
 * il campo ha sempre la larghezza piena e si rivela con un clip-path. Clip-path, slot e
 * "gelatina" seguono la stessa molla: easing linear() in Search.css, una coppia
 * (apertura elastica, chiusura rapida) per preset.
 */

/*
 * Lente → X in un unico SVG:
 * - il manico della lente si allunga e diventa la prima diagonale della X
 *   (un tratteggio lungo la diagonale: cambiano inizio e lunghezza del tratto)
 * - il cerchio si stringe e sparisce
 * - la seconda diagonale si "disegna" (stroke-dashoffset)
 * - tutto ruota di 90° per dare un piccolo giro
 * Le transizioni sono in Search.css, guidate da data-open sul form.
 */
function SearchCloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="4" y1="4" x2="22" y2="22" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

function Search({
  placeholder = 'Search…',
  width = 280,
  onSearch,
  reserveSpace = true,
  ...motionProps
}: SearchProps) {
  const m = useCssMotion(motionProps)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const hidden = width - CLOSED_WIDTH

  /*
   * Il campo resta montato finché la dissolvenza d'uscita non è finita (onAnimationEnd);
   * con le animazioni spente sparisce subito
   */
  const [fieldMounted, setFieldMounted] = useState(open)
  if (open && !fieldMounted) setFieldMounted(true)
  const showField = open || (fieldMounted && m.state !== 'off')

  // La gelatina parte solo dopo il primo cambio, non al montaggio
  const [toggled, setToggled] = useState(false)
  if (open && !toggled) setToggled(true)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function close() {
    setOpen(false)
    setQuery('')
  }

  return (
    <GloopMotionProvider {...pickMotionProps(motionProps)}>
      {/*
       * reserveSpace: lo slot ha già la larghezza da aperto, il campo cresce solo verso destra.
       * Altrimenti lo slot coincide con il bordo del clip-path e taglia il resto del form.
       */}
      <div
        {...m.rootProps}
        className="search-slot"
        data-push={reserveSpace ? undefined : true}
        style={
          {
            ...m.rootProps.style,
            // Il bordo destro visibile del campo: lo slot lo segue (molla compresa) e spinge i vicini
            width: reserveSpace ? width + OVERSHOOT : open ? width : CLOSED_WIDTH,
            '--search-hidden': `${hidden}px`,
          } as CSSProperties
        }
      >
        <form
          ref={rootRef}
          role="search"
          className="search"
          data-open={open || undefined}
          data-toggled={toggled || undefined}
          style={{ width: width + OVERSHOOT, paddingRight: OVERSHOOT }}
          onSubmit={(e) => {
            e.preventDefault()
            onSearch?.(query)
          }}
          // Se il focus esce dal campo vuoto, si richiude
          onBlur={(e) => {
            if (!query && !rootRef.current?.contains(e.relatedTarget as Node)) close()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              close()
              triggerRef.current?.focus()
            }
          }}
        >
          {/* Un solo bottone: lente da chiuso, X da aperto */}
          <button
            ref={triggerRef}
            type="button"
            className="search__trigger"
            aria-label={open ? 'Close search' : 'Search'}
            aria-expanded={open}
            onClick={() => (open ? close() : setOpen(true))}
          >
            <span className="search__icon">
              <SearchCloseIcon />
            </span>
          </button>

          {showField && (
            <div
              className="search__field"
              data-closing={!open || undefined}
              onAnimationEnd={(e) => {
                if (e.target === e.currentTarget && !open) setFieldMounted(false)
              }}
            >
              <input
                ref={inputRef}
                type="search"
                className="search__input"
                aria-label={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {!query && (
                <span className="search__placeholder" aria-hidden="true">
                  {/* Il placeholder compare lettera per lettera, mentre il campo si allarga */}
                  {[...placeholder].map((char, i) => (
                    <span key={i} className="search__char" style={{ '--i': i } as CSSProperties}>
                      {char === ' ' ? ' ' : char}
                    </span>
                  ))}
                </span>
              )}
            </div>
          )}
        </form>
      </div>
    </GloopMotionProvider>
  )
}

export default Search
