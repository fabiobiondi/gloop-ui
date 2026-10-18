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
import { GooFilter } from './goo'
import { useThemeVars } from './floating/useThemeVars'
import { GloopMotionProvider, pickMotionProps, type MotionProps } from './motion-context'
import { useGloopMotion, type GloopMotion } from './gloop-motion'
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

/*
 * Tutte le animazioni sono in Toast.css: la goccia cola dal bordo, poi si gonfia (l'asse
 * verticale arriva prima, l'orizzontale si allarga dopo); in chiusura forma e goccia
 * risalgono insieme verso il bordo. Le molle sono easing linear(), una serie per preset.
 */

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
function ToastBlob({ size, dir }: { size: Size; dir: 1 | -1 }) {
  const filterId = useId()
  // Distanza tra il centro del toast e il bordo dello schermo (dir: -1 in alto, 1 in basso)
  const toEdge = dir * (size.height / 2 + OFFSET)
  // Da goccia: la forma è scalata a un cerchio grande quanto DROP
  const from = { scaleX: Math.min(1, DROP / size.width), scaleY: Math.min(1, DROP / size.height) }
  // Ellisse grande quanto la scheda: scalata a goccia diventa un cerchio vero. Un raggio
  // in px enorme verrebbe ridotto dal browser in proporzione e, scalato, sembrerebbe un quadrato
  const round = `${size.width / 2}px / ${size.height / 2}px`

  return (
    <div
      className="toast__goo"
      aria-hidden="true"
      style={
        {
          filter: `url(#${CSS.escape(filterId)})`,
          '--toast-to-edge': `${toEdge}px`,
          '--toast-from-sx': from.scaleX,
          '--toast-from-sy': from.scaleY,
          '--toast-round': round,
        } as CSSProperties
      }
    >
      <GooFilter id={filterId} blur={8} color="var(--toast-surface)" />
      <span className="toast__source" />
      {/* Allungata nel verso del moto, si arrotonda quando arriva */}
      <span className="toast__drop" />
      <span className="toast__shape" />
    </div>
  )
}

type ToastCardProps = Omit<ToastProps, 'open' | 'afterClose' | 'duration' | 'align' | keyof MotionProps> & {
  m: GloopMotion
  themeVars: CSSProperties
  onPause: (paused: boolean) => void
  /** In uscita: resta montato finché le animazioni di chiusura non sono finite */
  exiting?: boolean
  onExited?: () => void
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
  exiting = false,
  onExited,
}: ToastCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size | null>(null)
  const dir = position === 'top' ? -1 : 1


  /*
   * Uscita: 'edge' se il toast tocca il bordo e ci risale, 'away' se si asciuga sul posto.
   * Si decide alla chiusura, prima che il toast esca dal flusso.
   */
  const [exit, setExit] = useState<'edge' | 'away' | null>(null)
  const onExitedRef = useRef(onExited)
  useLayoutEffect(() => {
    onExitedRef.current = onExited
  })

  // Riaperto mentre questo sta ancora uscendo: il nuovo toast prende il suo posto e questo
  // finisce l'uscita lì dov'è, fuori dal flusso (altrimenti starebbero affiancati)
  useLayoutEffect(() => {
    const el = ref.current
    if (!exiting || !el) return
    // Con più toast impilati solo il più recente tocca il bordo: gli altri non ci risalgono
    const rect = el.getBoundingClientRect()
    const atEdge = dir < 0 ? rect.top <= OFFSET + 1 : rect.bottom >= window.innerHeight - OFFSET - 1
    setExit(atEdge ? 'edge' : 'away')
    const { offsetLeft, offsetWidth } = el
    Object.assign(el.style, { position: 'absolute', top: '0', left: `${offsetLeft}px`, width: `${offsetWidth}px` })
  }, [exiting, dir])

  // Smonta quando tutte le animazioni di chiusura (anche quelle annidate) sono finite
  useEffect(() => {
    const el = ref.current
    if (!exit || !el) return
    let cancelled = false
    const animations = typeof el.getAnimations === 'function' ? el.getAnimations({ subtree: true }) : []
    Promise.all(animations.map((a) => a.finished.catch(() => undefined))).then(() => {
      if (!cancelled) onExitedRef.current?.()
    })
    return () => {
      cancelled = true
    }
  }, [exit])

  // Prima del primo frame: la forma deve sapere quanto gonfiarsi
  useLayoutEffect(() => {
    if (ref.current) setSize({ width: ref.current.offsetWidth, height: ref.current.offsetHeight })
  }, [])

  // undefined: l'icona della variante; null: nessuna icona
  const shownIcon = icon === undefined ? VARIANT_ICONS[variant] : icon

  function onBlur(e: FocusEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onPause(false)
  }

  return (
    <div
      ref={ref}
      {...m.rootProps}
      className={className ? `toast ${className}` : 'toast'}
      data-variant={variant}
      data-exit={exit ?? undefined}
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
    >
      {/* Movimento ridotto: niente goccia, solo una dissolvenza (Toast.css) */}
      {m.reduced ? (
        <span className="toast__shape" aria-hidden="true" style={{ borderRadius: RADIUS }} />
      ) : (
        size && <ToastBlob size={size} dir={dir} />
      )}

      {/* Il contenuto arriva quando la goccia ha quasi preso forma */}
      <div className="toast__content">
        {shownIcon != null && <span className="toast__icon">{shownIcon}</span>}
        <div className="toast__text">
          {title != null && <div className="toast__title">{title}</div>}
          {children != null && <div className="toast__message">{children}</div>}
        </div>
        {closeButton && (
          <button type="button" className="toast__close" aria-label={closeLabel} onClick={onClose}>
            {CloseIcon}
          </button>
        )}
      </div>
    </div>
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
  /*
   * Toast in uscita, uno per apertura (al posto di AnimatePresence): restano montati con
   * le props della chiusura finché le animazioni non sono finite. Con le animazioni spente
   * non c'è uscita: afterClose arriva subito (closedOff).
   */
  const [exiting, setExiting] = useState<{ key: number; props: typeof cardProps }[]>([])
  const [closedOff, setClosedOff] = useState(0)
  if (open !== wasOpen) {
    setWasOpen(open)
    setPaused(false)
    if (open) setOrder(++openings)
    else if (m.state === 'off') setClosedOff((n) => n + 1)
    else setExiting((list) => [...list, { key: order, props: cardProps }])
  }

  // afterClose: quando l'ultimo toast in uscita è finito (come onExitComplete)
  const afterCloseRef = useRef(afterClose)
  useEffect(() => {
    afterCloseRef.current = afterClose
  })
  const hadExiting = useRef(false)
  useEffect(() => {
    if (hadExiting.current && exiting.length === 0) afterCloseRef.current?.()
    hadExiting.current = exiting.length > 0
  }, [exiting.length])
  useEffect(() => {
    if (closedOff) afterCloseRef.current?.()
  }, [closedOff])

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
            <GloopMotionProvider {...pickMotionProps(motionProps)}>
              {/*
                Una chiave per apertura: ogni apertura è un toast nuovo, misurato sul suo
                contenuto. Con una chiave fissa, riaprire a fine uscita riusava il toast
                uscente con le sue misure e la forma ancora spostata verso il bordo.
                Un solo array: chiudendo, il toast passa nella lista di uscita senza rimontarsi
              */}
              {[
                ...exiting.map(({ key, props }) => (
                  <ToastCard
                    key={key}
                    m={m}
                    themeVars={themeVars}
                    onClose={onClose}
                    position={position}
                    onPause={setPaused}
                    {...props}
                    exiting
                    onExited={() => setExiting((list) => list.filter((e) => e.key !== key))}
                  />
                )),
                open && (
                  <ToastCard
                    key={order}
                    m={m}
                    themeVars={themeVars}
                    onClose={onClose}
                    position={position}
                    onPause={setPaused}
                    {...cardProps}
                  />
                ),
              ]}
            </GloopMotionProvider>
          </div>,
          getStack(position, align),
        )}
    </>
  )
}

export default Toast
