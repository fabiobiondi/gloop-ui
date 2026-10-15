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
import { AnimatePresence, motion, useIsPresent, type Transition } from 'motion/react'
import { GooFilter } from './goo'
import { useThemeVars } from './floating/useThemeVars'
import { MotionScope, useGloopMotion, type GloopMotion, type MotionProps } from './motion'
import './theme.css'
import './Toast.css'

export type ToastPosition = 'top' | 'bottom'
export type ToastVariant = 'default' | 'info' | 'success' | 'warning' | 'error'

export type ToastProps = {
  open: boolean
  onClose: () => void
  /** Messaggio del toast */
  children?: ReactNode
  /** Titolo in grassetto sopra il messaggio. Facoltativo */
  title?: ReactNode
  /** Colore del toast: i colorati riempiono tutto il blob liquido (default 'default', i colori del tema) */
  variant?: ToastVariant
  /** Colore custom del blob (qualsiasi colore CSS): ha la precedenza su variant */
  color?: string
  /** Icona a sinistra del testo. Senza, info/success/warning/error usano la loro; null la toglie */
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
// Chiusura: forma e goccia risalgono insieme verso il bordo, piano mentre si stringono e poi sempre più veloci
const rise: Transition = { duration: 0.38, delay: 0.06, ease: [0.55, 0, 0.75, 0.3] }

// Diametro della goccia che viaggia dal bordo al toast, in px (uguale a --toast-drop)
const DROP = 28
// Spazio tra toast e bordo dello schermo, in px (uguale a --toast-offset)
const OFFSET = 16
const RADIUS = 22

const CloseIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const icon = (path: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {path}
  </svg>
)

// Icone di default delle varianti colorate
const VARIANT_ICONS: Record<ToastVariant, ReactNode> = {
  default: null,
  info: icon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>,
  ),
  success: icon(<path d="m5 12.5 4.5 4.5L19 7.5" />),
  warning: icon(
    <>
      <path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4M12 17h.01" />
    </>,
  ),
  error: icon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>,
  ),
}

type Size = { width: number; height: number }

type ToastAlign = NonNullable<ToastProps['align']>

/*
 * Tutti i Toast con lo stesso bordo e allineamento stanno in una pila condivisa su <body>,
 * così due toast aperti insieme non si sovrappongono. Creata alla prima richiesta, resta lì
 * (vuota non occupa spazio né intercetta il puntatore).
 */
function getStack(position: ToastPosition, align: ToastAlign) {
  const selector = `.toast-stack[data-position="${position}"][data-align="${align}"]`
  let stack = document.body.querySelector<HTMLElement>(selector)
  if (!stack) {
    stack = document.createElement('div')
    stack.className = 'toast-stack'
    stack.dataset.position = position
    stack.dataset.align = align
    document.body.appendChild(stack)
  }
  return stack
}

// Ordine di apertura: il toast aperto per ultimo sta attaccato al bordo, da dove cola la goccia
let openings = 0

/*
 * Fondo liquido del toast, in un filtro goo. Apertura: il bordo dello schermo si gonfia
 * (source), ne cola una goccia (drop) che scende fino al centro del toast tirandosi
 * dietro un collo liquido; lì si gonfia nella pillola (shape) mentre il bordo si ritira
 * e il collo si strappa. Chiusura: la pillola si richiude nella goccia, che risale
 * e viene risucchiata nel bordo.
 */
function ToastBlob({ m, size, dir, atEdge }: { m: GloopMotion; size: Size; dir: 1 | -1; atEdge: () => boolean }) {
  const filterId = useId()
  // Distanza tra il centro del toast e il bordo dello schermo (dir: -1 in alto, 1 in basso)
  const toEdge = dir * (size.height / 2 + OFFSET)
  const from = { scaleX: Math.min(1, DROP / size.width), scaleY: Math.min(1, DROP / size.height) }
  // Ellisse grande quanto la scheda: scalata a goccia diventa un cerchio vero. Un raggio
  // in px enorme verrebbe ridotto dal browser in proporzione e, scalato, sembrerebbe un quadrato
  const round = `${size.width / 2}px / ${size.height / 2}px`
  const pill = `${RADIUS}px / ${RADIUS}px`

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
        // Le uscite si decidono alla chiusura: solo il toast attaccato al bordo ci risale
        variants={m.v({
          exit: () =>
            atEdge()
              ? {
                  scale: [0, 1, 0],
                  // Il bordo si gonfia incontro al blob che risale e lo risucchia
                  transition: { duration: 0.44, delay: 0.12, times: [0, 0.55, 1], ease: 'easeInOut' },
                }
              : { scale: 0, transition: { duration: 0 } },
        })}
        exit="exit"
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
        variants={m.v({
          exit: () =>
            atEdge()
              ? {
                  y: toEdge,
                  // Resta tonda, nascosta dentro la forma che si stringe: si allunga solo quando
                  // la forma ha preso la sua misura, così salgono sovrapposte come un unico blob
                  scaleX: [1, 1, 0.7, 0],
                  scaleY: [1, 1, 1.5, 0],
                  transition: {
                    y: rise,
                    scaleX: { duration: 0.5, delay: 0.06, times: [0, 0.4, 0.7, 1] },
                    scaleY: { duration: 0.5, delay: 0.06, times: [0, 0.4, 0.7, 1] },
                  },
                }
              : // Lontano dal bordo (altri toast in mezzo): la goccia si asciuga sul posto
                { scale: [1, 1, 0], transition: { duration: 0.42, delay: 0.06, times: [0, 0.5, 1] } },
        })}
        exit="exit"
      />

      <motion.span
        className="toast__shape"
        initial={{ ...from, borderRadius: round, opacity: 0 }}
        animate={{
          scaleX: 1,
          scaleY: 1,
          borderRadius: pill,
          opacity: 1,
          transition: m.t({
            scaleY: { ...flow, delay: 0.16 },
            scaleX: { ...spread, delay: 0.2 },
            // Resta tonda finché è quasi gonfia
            borderRadius: { duration: 0.45, delay: 0.16, ease: [0.5, 0, 0.2, 1] },
            opacity: { duration: 0.01, delay: 0.16 },
          }),
        }}
        variants={m.v({
          exit: () => {
            const edge = atEdge()
            return {
              ...from,
              // Si stringe mentre risale insieme alla goccia: un unico blob che torna nel bordo
              y: edge ? toEdge : 0,
              borderRadius: round,
              // Lascia il posto alla goccia, che viene risucchiata (o si asciuga sul posto)
              opacity: 0,
              transition: {
                ...suck,
                delay: 0.04,
                y: rise,
                borderRadius: { duration: 0.2, delay: 0.04, ease: 'easeIn' },
                opacity: { duration: 0.01, delay: edge ? 0.32 : 0.28 },
              },
            }
          },
        })}
        exit="exit"
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
  variant = 'default',
  color,
  position = 'top',
  closeButton = true,
  closeLabel = 'Close',
  className,
  onPause,
}: ToastCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size | null>(null)
  const dir = position === 'top' ? -1 : 1

  // Con più toast impilati solo il più recente tocca il bordo: gli altri non ci risalgono
  function atEdge() {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return true
    return dir < 0 ? rect.top <= OFFSET + 1 : rect.bottom >= window.innerHeight - OFFSET - 1
  }

  // Riaperto mentre questo sta ancora uscendo: il nuovo toast prende il suo posto e questo
  // finisce l'uscita lì dov'è, fuori dal flusso (altrimenti starebbero affiancati)
  const isPresent = useIsPresent()
  useLayoutEffect(() => {
    const el = ref.current
    if (isPresent || !el) return
    const { offsetLeft, offsetWidth } = el
    Object.assign(el.style, { position: 'absolute', top: '0', left: `${offsetLeft}px`, width: `${offsetWidth}px` })
  }, [isPresent])

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

  // undefined: l'icona della variante; null: nessuna icona
  const shownIcon = icon === undefined ? VARIANT_ICONS[variant] : icon

  function onBlur(e: FocusEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onPause(false)
  }

  return (
    <motion.div
      ref={ref}
      {...m.rootProps}
      className={className ? `toast ${className}` : 'toast'}
      data-variant={variant}
      data-custom-color={color ? '' : undefined}
      style={
        {
          ...m.rootProps.style,
          ...themeVars,
          // Colore custom: riempie il blob come le varianti colorate (vedi Toast.css)
          '--toast-color': color,
          visibility: size ? undefined : 'hidden',
        } as CSSProperties
      }
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
        size && <ToastBlob m={m} size={size} dir={dir} atEdge={atEdge} />
      )}

      <motion.div className="toast__content" {...reveal}>
        {shownIcon != null && <span className="toast__icon">{shownIcon}</span>}
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
  const layerRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [order, setOrder] = useState(() => (open ? ++openings : 0))
  // Ogni apertura riparte senza pausa (il puntatore può essere rimasto sul toast chiuso)
  // e va in cima alla pila, contro il bordo
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    setPaused(false)
    if (open) setOrder(++openings)
  }

  /*
   * Quando nella pila entra o esce un toast, gli altri cambiano posto: invece di saltare
   * scivolano nella nuova posizione (FLIP). offsetTop ignora i transform, quindi una
   * scivolata interrotta riparte da dove si trova davvero.
   */
  const motionRef = useRef(m)
  useEffect(() => {
    motionRef.current = m
  })
  useLayoutEffect(() => {
    const layer = layerRef.current
    const stack = layer?.parentElement
    if (!layer || !stack) return
    let lastTop = layer.offsetTop
    let wasFilled = layer.childElementCount > 0
    let slide: Animation | undefined
    const observer = new ResizeObserver(() => {
      const top = layer.offsetTop
      const filled = layer.childElementCount > 0
      const delta = lastTop - top
      // Il toast appena aperto non scivola: cola dal bordo
      if (delta && wasFilled && filled && motionRef.current.state === 'on' && layer.animate) {
        const matrix = getComputedStyle(layer).transform
        const current = matrix && matrix !== 'none' ? new DOMMatrixReadOnly(matrix).m42 : 0
        slide?.cancel()
        slide = layer.animate([{ transform: `translateY(${delta + current}px)` }, { transform: 'none' }], {
          duration: 420 / motionRef.current.speed,
          easing: 'cubic-bezier(0.34, 1.25, 0.64, 1)',
        })
      }
      lastTop = top
      wasFilled = filled
    })
    observer.observe(stack)
    return () => {
      observer.disconnect()
      slide?.cancel()
    }
  }, [position, align])

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
          <div
            ref={layerRef}
            className="toast-layer"
            // Gli errori interrompono lo screen reader, gli altri aspettano il suo turno
            role={cardProps.variant === 'error' ? 'alert' : 'status'}
            aria-live={cardProps.variant === 'error' ? 'assertive' : 'polite'}
            aria-atomic="true"
            data-position={position}
            data-align={align}
            // Il più recente sta anche sopra: cola dal bordo passando davanti a quelli che scivolano via
            style={{ order, zIndex: order }}
          >
            <MotionScope m={m} props={motionProps}>
              <AnimatePresence onExitComplete={afterClose}>
                {open && (
                  <ToastCard
                    // Una chiave per apertura: ogni apertura è un toast nuovo, misurato sul suo
                    // contenuto. Con una chiave fissa, riaprire a fine uscita riusava il toast
                    // uscente con le sue misure e la forma ancora spostata verso il bordo
                    key={order}
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
          getStack(position, align),
        )}
    </>
  )
}

export default Toast
