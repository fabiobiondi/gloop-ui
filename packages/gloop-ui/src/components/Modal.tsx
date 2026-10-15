import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useIsPresent, type Transition } from 'motion/react'
import ExpandButton from './ExpandButton'
import { GooFilter } from './goo'
import { useThemeVars } from './floating/useThemeVars'
import { MotionScope, useGloopMotion, type GloopMotion, type MotionProps } from './motion'
import './theme.css'
import './Modal.css'

export type ModalAction = {
  label: string
  icon?: ReactNode
  /** Solo icona: la label resta come nome accessibile */
  iconOnly?: boolean
  /** Colore di sfondo del pulsante (default --ui-bg) */
  color?: string
  /** Default: chiude il modal. Restituisci false per tenerlo aperto. */
  onClick?: () => void | false
  autoFocus?: boolean
  /** Con useModal: il valore con cui si risolve handle.result quando il pulsante chiude il modal */
  value?: unknown
}

export type ModalSize = 'sm' | 'md' | 'lg' | 'full'

export type ModalProps = {
  open: boolean
  onClose: () => void
  /** Titolo: una stringa (diventa un <h2>) o JSX libero. Facoltativo */
  title?: ReactNode
  /** Mostra la X di chiusura nell'header (default true) */
  closeButton?: boolean
  /** Nome accessibile della X (default 'Close') */
  closeLabel?: string
  /** Nome accessibile del modal quando manca un titolo testuale */
  'aria-label'?: string
  /** Contenuto: scorre quando supera l'altezza disponibile */
  children?: ReactNode
  /** Pulsanti del footer (ExpandButton in modalità action) */
  actions?: ModalAction[]
  /** Allineamento dei pulsanti nel footer (default 'end') */
  actionsAlign?: 'start' | 'center' | 'end'
  /** JSX libero nel footer; con actions sta a sinistra dei pulsanti */
  footer?: ReactNode
  /** Larghezza: sm 400px, md 560px, lg 800px, full tutto lo schermo (default 'md') */
  size?: ModalSize
  /** Clic sullo sfondo chiude il modal (default true) */
  closeOnBackdrop?: boolean
  /** Escape chiude il modal (default true) */
  closeOnEscape?: boolean
  /** Chiamata quando l'animazione di chiusura è finita */
  afterClose?: () => void
  /** Colore dello sfondo dietro il modal (default nero) */
  backdropColor?: string
  /** Opacità dello sfondo, da 0 a 1 (default 0.45) */
  backdropOpacity?: number
  /** Sfocatura della pagina dietro il modal, in px (default 0) */
  backdropBlur?: number
  className?: string
} & MotionProps

// La scheda si gonfia come una goccia e si assesta, le gocce satellite colano più lente
const swell: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 24,
  mass: 0.9,
}
const drip: Transition = { type: 'spring', stiffness: 300, damping: 18 }

// Gocce satellite: posizione finale (% della scheda) e diametro in px.
// In apertura partono dal centro e si fondono nei bordi, in chiusura vengono risucchiate
type Drop = { x: number; y: number; size: number }
const DROPS: Drop[] = [
  { x: 8, y: 18, size: 72 },
  { x: 92, y: 26, size: 64 },
  { x: 50, y: 4, size: 60 },
  { x: 16, y: 88, size: 66 },
  { x: 86, y: 84, size: 76 },
  { x: 54, y: 97, size: 52 },
]
// Raggio enorme: la scheda nasce come un'ellisse e si squadra mentre si gonfia
const ROUND = 600
const RADIUS = 28

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

// Modal aperti, dal più vecchio: Escape e Tab li gestisce solo quello in cima
const stack: object[] = []

// Blocco dello scroll della pagina condiviso tra i modal aperti
let locks = 0
let savedOverflow = ''
function lockScroll() {
  if (locks++ === 0) {
    savedOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
  }
}
function unlockScroll() {
  if (--locks === 0) document.documentElement.style.overflow = savedOverflow
}

const CloseIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

/*
 * Il fondo della scheda è un blob in un filtro goo, separato dal contenuto (che resta
 * nitido e non passa dal filtro). Apertura: un'ellisse piccola si gonfia con un rimbalzo
 * e si squadra, le gocce schizzano dal centro verso i bordi e ci si fondono dentro.
 * Chiusura: lo stesso movimento al contrario, senza gocce: la scheda si gonfia appena,
 * si arrotonda in una goccia e si sgonfia fino a sparire.
 */
function ModalBlob({ m }: { m: GloopMotion }) {
  const filterId = useId()
  // Il filtro goo serve solo mentre la forma si muove: da ferma la scheda è un rettangolo
  // e il filtro su un'area così grande costerebbe a ogni repaint (anche durante lo scroll)
  const [settled, setSettled] = useState(false)
  const isPresent = useIsPresent()
  const gooey = !settled || !isPresent

  // Movimento ridotto: niente goo né gocce, il fondo compare in dissolvenza
  if (m.reduced) {
    return (
      <motion.div
        className="modal__blob"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: m.t({ duration: 0.15 }) }}
        exit={{ opacity: 0, transition: m.t({ duration: 0.12 }) }}
      >
        <div className="modal__blob-shape" style={{ borderRadius: RADIUS }} />
      </motion.div>
    )
  }

  return (
    <div
      className="modal__blob"
      aria-hidden="true"
      data-settled={!gooey || undefined}
      style={gooey ? { filter: `url(#${CSS.escape(filterId)})` } : undefined}
    >
      <GooFilter id={filterId} blur={14} color="var(--modal-surface)" />
      <motion.div
        className="modal__blob-shape"
        onAnimationComplete={() => isPresent && setSettled(true)}
        initial={{ scaleX: 0.16, scaleY: 0.2, borderRadius: ROUND, opacity: 0 }}
        animate={{
          scaleX: 1,
          scaleY: 1,
          borderRadius: RADIUS,
          opacity: 1,
          transition: m.t({
            ...swell,
            // Si squadra quando è quasi gonfia: resta una goccia più a lungo
            borderRadius: { duration: 0.5, ease: [0.5, 0, 0.2, 1] },
            opacity: { duration: 0.08 },
          }),
        }}
        // Chiusura speculare all'apertura: un piccolo gonfiore (il rimbalzo al contrario),
        // poi si arrotonda in una goccia e si sgonfia, tutta in un pezzo
        exit={{
          scaleX: [1, 1.03, 0.16],
          scaleY: [1, 1.04, 0.2],
          borderRadius: [RADIUS, RADIUS, ROUND],
          opacity: [1, 1, 0],
          transition: m.t({
            duration: 0.42,
            delay: 0.04,
            times: [0, 0.22, 1],
            ease: ['easeOut', [0.55, 0, 0.75, 0.2]],
            borderRadius: { duration: 0.42, delay: 0.04, times: [0, 0.3, 1], ease: ['linear', [0.4, 0, 0.6, 1]] },
            opacity: { duration: 0.42, delay: 0.04, times: [0, 0.82, 1] },
          }),
        }}
      />
      {DROPS.map((drop, i) => {
        // La traccia è grande quanto la scheda: le percentuali di x/y sono quelle della scheda
        const fromCenter = { x: `${50 - drop.x}%`, y: `${50 - drop.y}%` }
        return (
          <motion.span
            key={i}
            className="modal__drop-track"
            initial={fromCenter}
            animate={{
              x: '0%',
              y: '0%',
              transition: m.t({
                duration: 0.55,
                delay: i * 0.02,
                ease: [0.2, 0.9, 0.3, 1],
              }),
            }}
          >
            <motion.span
              className="modal__drop"
              // Dimensione e posizione le calcola il CSS: restano dentro la scheda anche se è piccola
              style={
                {
                  '--drop-x': `${drop.x}%`,
                  '--drop-y': `${drop.y}%`,
                  '--drop-size': `${drop.size}px`,
                } as CSSProperties
              }
              // Gonfie a metà strada, poi si sciolgono nel bordo
              initial={{ scale: 0.3 }}
              animate={{
                scale: [0.3, 1, 0],
                transition: m.t({
                  duration: 0.7,
                  delay: i * 0.02,
                  times: [0, 0.55, 1],
                }),
              }}
              // In chiusura le gocce non si vedono: si sgonfia solo la scheda
              exit={{ scale: 0, transition: { duration: 0 } }}
            />
          </motion.span>
        )
      })}
    </div>
  )
}

/*
 * Modal a tutta scheda: header (titolo e X), contenuto che scorre e footer facoltativi.
 * Il fondo è un blob liquido (ModalBlob); il contenuto arriva quando ha quasi preso
 * forma e i pulsanti del footer salgono uno dopo l'altro.
 *
 * È renderizzato in un portal su <body>: i colori del tema (--ui-*) vengono letti
 * dal punto in cui il Modal è usato e riapplicati, così segue il tema locale.
 * Per aprirlo da codice, senza stato, c'è useModal() (vedi ModalProvider).
 */
function Modal({
  open,
  onClose,
  title,
  closeButton = true,
  closeLabel = 'Close',
  'aria-label': ariaLabel,
  children,
  actions = [],
  actionsAlign = 'end',
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  afterClose,
  backdropColor,
  backdropOpacity,
  backdropBlur,
  className,
  ...motionProps
}: ModalProps) {
  const m = useGloopMotion(motionProps)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  // Colori del tema dal punto di utilizzo (il modal è in un portal)
  const themeVars = useThemeVars(anchorRef, open)
  const titleId = useId()
  // onClose arriva spesso inline (nuova a ogni render): l'effetto sotto la legge da qui,
  // altrimenti ripartirebbe a ogni tasto premuto in un input e il focus salterebbe via
  const latest = useRef({ onClose, closeOnEscape })
  useEffect(() => {
    latest.current = { onClose, closeOnEscape }
  })

  const hasHeader = title != null || closeButton
  const hasFooter = footer != null || actions.length > 0
  const textTitle = typeof title === 'string' || typeof title === 'number'

  // Il contenuto scorre: bordi su header e footer quando c'è altro sopra o sotto
  const [edges, setEdges] = useState({
    scrollable: false,
    top: false,
    bottom: false,
  })
  function measure() {
    const el = bodyRef.current
    if (!el) return
    const next = {
      scrollable: el.scrollHeight > el.clientHeight + 1,
      top: el.scrollTop > 0,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    }
    setEdges((prev) =>
      prev.scrollable === next.scrollable && prev.top === next.top && prev.bottom === next.bottom ? prev : next,
    )
  }
  useLayoutEffect(() => {
    if (!open || !bodyRef.current) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(bodyRef.current)
    if (bodyRef.current.firstElementChild) observer.observe(bodyRef.current.firstElementChild)
    return () => observer.disconnect()
  }, [open])

  useEffect(() => {
    if (!open) return
    const token = {}
    stack.push(token)
    lockScroll()

    // Focus dentro il modal; alla chiusura torna dove era
    const previous = document.activeElement as HTMLElement | null
    const frame = requestAnimationFrame(() => {
      if (!cardRef.current?.contains(document.activeElement)) cardRef.current?.focus()
    })

    function onKeyDown(e: KeyboardEvent) {
      if (stack[stack.length - 1] !== token) return
      if (e.key === 'Escape') {
        if (!latest.current.closeOnEscape) return
        e.stopPropagation()
        latest.current.onClose()
        return
      }
      // Il Tab gira solo tra gli elementi del modal
      if (e.key !== 'Tab' || !cardRef.current) return
      const focusables = [...cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (!focusables.length) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === cardRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      stack.splice(stack.indexOf(token), 1)
      unlockScroll()
      previous?.focus()
    }
  }, [open])

  // Solo i valori passati: per gli altri valgono i default del CSS
  const backdropVars = {
    '--modal-backdrop-color': backdropColor,
    '--modal-backdrop-opacity': backdropOpacity === undefined ? undefined : Math.min(1, Math.max(0, backdropOpacity)),
    '--modal-backdrop-blur': backdropBlur === undefined ? undefined : `${Math.max(0, backdropBlur)}px`,
  } as CSSProperties

  // Il contenuto arriva quando la goccia ha quasi preso forma
  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 6, filter: 'blur(4px)' },
    animate: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: m.t({
        duration: 0.25,
        delay,
        ease: [0.23, 1, 0.32, 1] as const,
      }),
    },
    exit: { opacity: 0, transition: m.t({ duration: 0.08 }) },
  })

  return (
    <>
      <span ref={anchorRef} hidden />
      {createPortal(
        <MotionScope m={m} props={motionProps}>
          <AnimatePresence onExitComplete={afterClose}>
            {open && (
              <div key="modal" {...m.rootProps} className="modal-layer" style={{ ...m.rootProps.style, ...themeVars }}>
                <motion.div
                  className="modal-backdrop"
                  aria-hidden="true"
                  style={backdropVars}
                  onClick={() => closeOnBackdrop && onClose()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: m.t({ duration: 0.2 }) }}
                  exit={{
                    opacity: 0,
                    transition: m.t({ duration: 0.25, delay: 0.12 }),
                  }}
                />

                <div
                  ref={cardRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={title != null ? titleId : undefined}
                  aria-label={title != null ? undefined : ariaLabel}
                  tabIndex={-1}
                  className={className ? `modal ${className}` : 'modal'}
                  data-size={size}
                  data-scroll-top={edges.top || undefined}
                  data-scroll-bottom={edges.bottom || undefined}
                  data-no-header={!hasHeader || undefined}
                  data-no-footer={!hasFooter || undefined}
                >
                  <ModalBlob m={m} />

                  {hasHeader && (
                    <motion.header className="modal__header" {...reveal(0.2)}>
                      {title != null &&
                        (textTitle ? (
                          <h2 id={titleId} className="modal__title">
                            {title}
                          </h2>
                        ) : (
                          <div id={titleId} className="modal__title-custom">
                            {title}
                          </div>
                        ))}
                      {closeButton && (
                        <motion.button
                          type="button"
                          className="modal__close"
                          aria-label={closeLabel}
                          onClick={onClose}
                          whileHover={{ scale: 1.08, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          transition={m.t({
                            type: 'spring',
                            duration: 0.4,
                            bounce: 0.3,
                          })}
                        >
                          {CloseIcon}
                        </motion.button>
                      )}
                    </motion.header>
                  )}

                  <motion.div
                    ref={bodyRef}
                    className="modal__body"
                    // Scorrevole: raggiungibile da tastiera per scorrere con le frecce
                    tabIndex={edges.scrollable ? 0 : undefined}
                    onScroll={measure}
                    {...reveal(0.24)}
                  >
                    <div className="modal__content">{children}</div>
                  </motion.div>

                  {hasFooter && (
                    <footer className="modal__footer" data-align={actionsAlign}>
                      {footer != null && (
                        <motion.div className="modal__footer-custom" {...reveal(0.26)}>
                          {footer}
                        </motion.div>
                      )}
                      {actions.length > 0 && (
                        <div className="modal__actions">
                          {actions.map((action, i) => (
                            <motion.div
                              key={action.label}
                              // Salgono dal bordo inferiore, uno dopo l'altro
                              initial={{ y: 14, scale: 0.6, opacity: 0 }}
                              animate={{
                                y: 0,
                                scale: 1,
                                opacity: 1,
                                transition: m.t({
                                  ...drip,
                                  delay: 0.24 + i * 0.05,
                                  opacity: {
                                    duration: 0.1,
                                    delay: 0.24 + i * 0.05,
                                  },
                                }),
                              }}
                              exit={{
                                opacity: 0,
                                scale: 0.8,
                                transition: m.t({ duration: 0.1 }),
                              }}
                            >
                              <ExpandButton
                                variant="action"
                                label={action.label}
                                icon={action.icon}
                                iconOnly={action.iconOnly}
                                activeColor={action.color}
                                autoFocus={action.autoFocus}
                                onClick={() => {
                                  if (action.onClick?.() !== false) onClose()
                                }}
                              />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </footer>
                  )}
                </div>
              </div>
            )}
          </AnimatePresence>
        </MotionScope>,
        document.body,
      )}
    </>
  )
}

export default Modal
