import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  useVelocity,
  type Variants,
} from 'motion/react'
import './theme.css'
import './Search.css'

export type SearchProps = {
  placeholder?: string
  /** Larghezza da aperto, in px */
  width?: number
  onSearch?: (query: string) => void
}

const CLOSED_WIDTH = 44
// Spazio extra a destra: la molla può "sforare" e rientrare senza essere tagliata
const OVERSHOOT = 28

/*
 * Niente animazione di width (ricalcola il layout a ogni frame e sfarfalla):
 * il campo ha sempre la larghezza piena e si rivela con un clip-path.
 * Una sola molla ("progress" 0 → 1) guida tutto.
 */
const openSpring = { type: 'spring', stiffness: 170, damping: 15, mass: 1 } as const
const closeSpring = { type: 'spring', stiffness: 420, damping: 40 } as const

// Il placeholder compare lettera per lettera, mentre il campo si allarga
const placeholderVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.02, delayChildren: 0.15 } },
}

const charVariants: Variants = {
  hidden: { opacity: 0, x: -6 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', duration: 0.35, bounce: 0.2 },
  },
}

const iconSpring = { type: 'spring', duration: 0.45, bounce: 0.25 } as const

/*
 * Lente → X in un unico SVG:
 * - il manico della lente si allunga e diventa la prima diagonale della X
 * - il cerchio si stringe e sparisce
 * - la seconda diagonale si "disegna" (pathLength)
 * - tutto ruota di 90° per dare un piccolo giro
 */
function SearchCloseIcon({ open }: { open: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      initial={false}
      animate={{ rotate: open ? 90 : 0 }}
      transition={iconSpring}
    >
      <motion.circle
        cx="11"
        cy="11"
        initial={false}
        animate={open ? { r: 0, opacity: 0 } : { r: 7, opacity: 1 }}
        transition={iconSpring}
      />
      <motion.line
        initial={false}
        animate={
          open
            ? { x1: 6, y1: 6, x2: 18, y2: 18 }
            : { x1: 16.5, y1: 16.5, x2: 20, y2: 20 }
        }
        transition={iconSpring}
      />
      <motion.line
        x1="18"
        y1="6"
        x2="6"
        y2="18"
        initial={false}
        animate={open ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={open ? { ...iconSpring, delay: 0.08 } : { duration: 0.12 }}
      />
    </motion.svg>
  )
}

function Search({ placeholder = 'Search…', width = 280, onSearch }: SearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const reduceMotion = useReducedMotion()

  const progress = useMotionValue(0)
  const hidden = width - CLOSED_WIDTH
  const clipPath = useTransform(
    progress,
    (p) => `inset(0px ${OVERSHOOT + (1 - p) * hidden}px 0px 0px round 22px)`,
  )
  // Gelatina: più la molla corre, più il campo si schiaccia; da fermo torna normale
  const velocity = useVelocity(progress)
  const scaleY = useTransform(velocity, [-8, 0, 8], [0.86, 1, 0.86])

  useEffect(() => {
    if (open) inputRef.current?.focus()
    const controls = animate(
      progress,
      open ? 1 : 0,
      reduceMotion ? { duration: 0 } : open ? openSpring : closeSpring,
    )
    return () => controls.stop()
  }, [open, progress, reduceMotion])

  function close() {
    setOpen(false)
    setQuery('')
  }

  return (
    <MotionConfig reducedMotion="user">
      {/* Lo slot ha già la larghezza da aperto: il campo cresce solo verso destra */}
      <div className="search-slot" style={{ width: width + OVERSHOOT }}>
        <motion.form
          ref={rootRef}
          role="search"
          className="search"
          data-open={open || undefined}
          style={{
            width: width + OVERSHOOT,
            paddingRight: OVERSHOOT,
            clipPath,
            scaleY: reduceMotion ? 1 : scaleY,
          }}
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
          <motion.button
            ref={triggerRef}
            type="button"
            className="search__trigger"
            aria-label={open ? 'Close search' : 'Search'}
            aria-expanded={open}
            onClick={() => (open ? close() : setOpen(true))}
            whileTap={{ scale: 0.9 }}
          >
            <span className="search__icon">
              <SearchCloseIcon open={open} />
            </span>
          </motion.button>

          <AnimatePresence>
            {open && (
              <motion.div
                className="search__field"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
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
                  <motion.span
                    className="search__placeholder"
                    aria-hidden="true"
                    variants={placeholderVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {[...placeholder].map((char, i) => (
                      <motion.span key={i} className="search__char" variants={charVariants}>
                        {char === ' ' ? ' ' : char}
                      </motion.span>
                    ))}
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>
      </div>
    </MotionConfig>
  )
}

export default Search
