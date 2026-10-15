import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type Transition } from 'motion/react'
import { GooFilter } from './goo'
import { useThemeVars } from './floating/useThemeVars'
import { MotionScope, useGloopMotion, type GloopMotion, type MotionProps } from './motion'
import './theme.css'
import './Toast.css'

export type ToastPosition = 'top' | 'bottom'

export type ToastProps = {
  open: boolean
  onClose: () => void
  /** Messaggio del toast */
  children?: ReactNode
  /** Titolo in grassetto sopra il messaggio. Facoltativo */
  title?: ReactNode
  /** Icona a sinistra del testo */
  icon?: ReactNode
  /** Millisecondi prima della chiusura automatica (default 4000). Infinity: resta aperto */
  duration?: number
  /** Bordo dello schermo da cui cola il toast (default 'top') */
  position?: ToastPosition
  /** Allineamento orizzontale (default 'center') */
  align?: 'start' | 'center' | 'end'
  /** Mostra la X di chiusura (default true) */
  closeButton?: boolean
  /** Nome accessibile della X (default 'Close') */
  closeLabel?: string
  /** Chiamata quando l'animazione di chiusura è finita */
  afterClose?: () => void
  className?: string
} & MotionProps

// La goccia cola dal bordo, poi si gonfia: l'asse verticale arriva prima, l'orizzontale si allarga dopo
const flow: Transition = { type: 'spring', stiffness: 460, damping: 26 }
const spread: Transition = { type: 'spring', stiffness: 300, damping: 21 }
const suck: Transition = { type: 'spring', stiffness: 520, damping: 40 }

// Diametro della goccia che viaggia dal bordo al toast, in px (uguale a --toast-drop)
const DROP = 28
// Spazio tra toast e bordo dello schermo, in px (uguale a --toast-offset)
const OFFSET = 16
// Raggio enorme: la forma nasce tonda e si "squadra" in pillola mentre si gonfia
const ROUND = 400
const RADIUS = 22

const CloseIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

type Size = { width: number; height: number }

/*
 * Fondo liquido del toast, in un filtro goo. Apertura: il bordo dello schermo si gonfia
 * (source), ne cola una goccia (drop) che scende fino al centro del toast tirandosi
 * dietro un collo liquido; lì si gonfia nella pillola (shape) mentre il bordo si ritira
 * e il collo si strappa. Chiusura: la pillola si richiude nella goccia, che risale
 * e viene risucchiata nel bordo.
 */
function ToastBlob({ m, size, dir }: { m: GloopMotion; size: Size; dir: 1 | -1 }) {
  const filterId = useId()
  // Distanza tra il centro del toast e il bordo dello schermo (dir: -1 in alto, 1 in basso)
  const toEdge = dir * (size.height / 2 + OFFSET)
  const from = { scaleX: Math.min(1, DROP / size.width), scaleY: Math.min(1, DROP / size.height) }

  return (
    <div className="toast__goo" aria-hidden="true" style={{ filter: `url(#${CSS.escape(filterId)})` }}>
      <GooFilter id={filterId} blur={8} color="var(--toast-surface)" />

      <motion.span
        className="toast__source"
        initial={{ scale: 0 }}
        animate={{
          scale: [0, 1, 1, 0],
          transition: m.t({ duration: 0.6, times: [0, 0.25, 0.4, 1], ease: 'easeInOut' }),
        }}
        exit={{
          scale: [0, 1, 0],
          transition: m.t({ duration: 0.4, delay: 0.16, times: [0, 0.5, 1], ease: 'easeInOut' }),
        }}
      />

      <motion.span
        className="toast__drop"
        // Allungata nel verso del moto, si arrotonda quando arriva
        initial={{ y: toEdge, scaleX: 0.7, scaleY: 1.5 }}
        animate={{
          y: 0,
          scaleX: 1,
          scaleY: 1,
          transition: m.t({ ...flow, delay: 0.06 }),
        }}
        exit={{
          y: toEdge,
          scaleX: [1, 0.7, 0],
          scaleY: [1, 1.5, 0],
          transition: m.t({
            y: { duration: 0.28, delay: 0.14, ease: [0.6, 0, 0.8, 0.4] },
            scaleX: { duration: 0.42, delay: 0.14, times: [0, 0.6, 1] },
            scaleY: { duration: 0.42, delay: 0.14, times: [0, 0.6, 1] },
          }),
        }}
      />

      <motion.span
        className="toast__shape"
        initial={{ ...from, borderRadius: ROUND, opacity: 0 }}
        animate={{
          scaleX: 1,
          scaleY: 1,
          borderRadius: RADIUS,
          opacity: 1,
          transition: m.t({
            scaleY: { ...flow, delay: 0.16 },
            scaleX: { ...spread, delay: 0.2 },
            // Resta tonda finché è quasi gonfia
            borderRadius: { duration: 0.45, delay: 0.16, ease: [0.5, 0, 0.2, 1] },
            opacity: { duration: 0.01, delay: 0.16 },
          }),
        }}
        exit={{
          ...from,
          borderRadius: ROUND,
          transition: m.t({ ...suck, delay: 0.04, borderRadius: { duration: 0.2, delay: 0.04, ease: 'easeIn' } }),
        }}
      />
    </div>
  )
}

type ToastCardProps = Omit<ToastProps, 'open' | 'afterClose' | 'duration' | 'align' | keyof MotionProps> & {
  m: GloopMotion
  themeVars: CSSProperties
  onPause: (paused: boolean) => void
}

/*
 * La scheda del toast: un componente a sé, così ogni apertura misura il proprio contenuto
 * prima di partire (la forma si gonfia dalla goccia fino alla dimensione reale).
 */
function ToastCard({
  m,
  themeVars,
  onClose,
  children,
  title,
  icon,
  position = 'top',
  closeButton = true,
  closeLabel = 'Close',
  className,
  onPause,
}: ToastCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size | null>(null)
  const dir = position === 'top' ? -1 : 1

  // Prima del primo frame: la forma deve sapere quanto gonfiarsi
  useLayoutEffect(() => {
    if (ref.current) setSize({ width: ref.current.offsetWidth, height: ref.current.offsetHeight })
  }, [])

  // Il contenuto arriva quando la goccia ha quasi preso forma
  const reveal = {
    initial: { opacity: 0, filter: 'blur(4px)' },
    animate: {
      opacity: 1,
      filter: 'blur(0px)',
      transition: m.t({ duration: 0.25, delay: m.reduced ? 0 : 0.28, ease: [0.23, 1, 0.32, 1] as const }),
    },
    exit: { opacity: 0, filter: 'blur(4px)', transition: m.t({ duration: 0.08 }) },
  }

  function onBlur(e: FocusEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onPause(false)
  }

  return (
    <motion.div
      ref={ref}
      {...m.rootProps}
      className={className ? `toast ${className}` : 'toast'}
      style={{ ...m.rootProps.style, ...themeVars, visibility: size ? undefined : 'hidden' }}
      onPointerEnter={() => onPause(true)}
      onPointerLeave={() => onPause(false)}
      onFocus={() => onPause(true)}
      onBlur={onBlur}
      // Movimento ridotto: niente goccia, solo una dissolvenza con un piccolo spostamento
      {...(m.reduced && {
        initial: { opacity: 0, y: dir * 8 },
        animate: { opacity: 1, y: 0, transition: m.t({ duration: 0.18 }) },
        exit: { opacity: 0, transition: m.t({ duration: 0.12 }) },
      })}
    >
      {m.reduced ? (
        <span className="toast__shape" aria-hidden="true" style={{ borderRadius: RADIUS }} />
      ) : (
        size && <ToastBlob m={m} size={size} dir={dir} />
      )}

      <motion.div className="toast__content" {...reveal}>
        {icon != null && <span className="toast__icon">{icon}</span>}
        <div className="toast__text">
          {title != null && <div className="toast__title">{title}</div>}
          {children != null && <div className="toast__message">{children}</div>}
        </div>
        {closeButton && (
          <motion.button
            type="button"
            className="toast__close"
            aria-label={closeLabel}
            onClick={onClose}
            whileHover={{ scale: 1.08, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={m.t({ type: 'spring', duration: 0.4, bounce: 0.3 })}
          >
            {CloseIcon}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  )
}

/*
 * Toast liquido: cola dal bordo dello schermo come una goccia e si gonfia in una pillola.
 * Si chiude da solo dopo `duration` ms; il timer si ferma finché il puntatore o il focus
 * sono sul toast.
 *
 * È in un portal su <body>: i colori del tema (--ui-*) vengono letti dal punto in cui
 * il Toast è usato e riapplicati. La regione live (role="status") resta sempre montata,
 * così gli screen reader annunciano il messaggio quando compare.
 */
function Toast({
  open,
  onClose,
  duration = 4000,
  position = 'top',
  align = 'center',
  afterClose,
  speed,
  motion: preset,
  animated,
  reducedMotion,
  ...cardProps
}: ToastProps) {
  const motionProps = { speed, motion: preset, animated, reducedMotion }
  const m = useGloopMotion(motionProps)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const themeVars = useThemeVars(anchorRef, open)
  const [paused, setPaused] = useState(false)
  // Ogni apertura riparte senza pausa (il puntatore può essere rimasto sul toast chiuso)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    setPaused(false)
  }

  // onClose arriva spesso inline: il timer la legge da qui senza ripartire a ogni render
  const latest = useRef(onClose)
  useEffect(() => {
    latest.current = onClose
  })

  // Tempo che manca alla chiusura: si ricarica a ogni apertura, la pausa lo conserva
  const remaining = useRef(duration)
  useEffect(() => {
    remaining.current = duration
  }, [open, duration])

  useEffect(() => {
    if (!open || paused || !Number.isFinite(remaining.current) || remaining.current <= 0) return
    const start = Date.now()
    const timer = setTimeout(() => latest.current(), remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current -= Date.now() - start
    }
  }, [open, paused, duration])

  return (
    <>
      <span ref={anchorRef} hidden />
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="toast-layer" role="status" aria-live="polite" aria-atomic="true" data-position={position} data-align={align}>
            <MotionScope m={m} props={motionProps}>
              <AnimatePresence onExitComplete={afterClose}>
                {open && (
                  <ToastCard
                    key="toast"
                    m={m}
                    themeVars={themeVars}
                    onClose={onClose}
                    position={position}
                    onPause={setPaused}
                    {...cardProps}
                  />
                )}
              </AnimatePresence>
            </MotionScope>
          </div>,
          document.body,
        )}
    </>
  )
}

export default Toast
