import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useIsPresent, type Transition } from 'motion/react'
import ExpandButton from './ExpandButton'
import { GooFilter } from './goo'
import { DEFAULT_JELLY, JELLY_X, JELLY_Y, jellySpring } from './jelly'
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

/**
 * swell: una goccia che si gonfia al centro.
 * drop: una goccia vola dal pulsante che ha aperto il modal, si spiaccica e si allarga come
 * gelatina; in chiusura torna volando al pulsante.
 */
export type ModalEnter = 'swell' | 'drop'

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
  /** Animazione di apertura (default 'swell') */
  enter?: ModalEnter
  /**
   * Quanto la scheda trema come gelatina all'apertura, da 0 a 1 (default 0.5).
   * 0: si gonfia senza rimbalzi e i lati restano fermi. 1: rimbalzi ampi e lati che ondeggiano.
   */
  jelly?: number
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

const drip: Transition = { type: 'spring', stiffness: 300, damping: 18 }

// Rigonfiamenti al centro dei lati: quanto escono (px) nei vari momenti, e quando
const BULGE = [0, 14, -3, 6, 0]
const BULGE_TIMES = [0, 0.28, 0.55, 0.78, 1]
// Prima i lati lunghi (alto e basso), poi quelli corti, appena sfasati
const SIDES = [
  { side: 'top', delay: 0.1 },
  { side: 'bottom', delay: 0.12 },
  { side: 'left', delay: 0.16 },
  { side: 'right', delay: 0.18 },
] as const

// enter="drop": diametro della goccia in volo e durata del volo (s)
const FLY_SIZE = 56
// Volo a velocità quasi costante: la durata cresce con la distanza dal centro (entro dei limiti),
// e più la goccia arriva da lontano più va forte, quindi si allunga di più
type Point = { x: number; y: number }
const flightTime = (dist: number) => Math.min(0.38, Math.max(0.1, 0.05 + dist / 3000))
const flightStretch = (dist: number) => 1.3 + Math.min(dist / 900, 1) * 0.7
// Senza pulsante di partenza la goccia cade dall'alto, da sopra la finestra
const fallFrom = () => ({ x: 0, y: -(innerHeight / 2 + 80) })
// Ultimo punto toccato dal puntatore: da lì parte la goccia di enter="drop"
// (in Safari il pulsante cliccato non prende il focus, quindi activeElement non basta)
let lastPointer = { x: 0, y: 0, time: -Infinity }
if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    (e) => {
      lastPointer = { x: e.clientX, y: e.clientY, time: performance.now() }
    },
    { capture: true, passive: true },
  )
}

/** Centro dell'elemento che ha aperto il modal: punto del clic recente o elemento col focus */
function openerPoint(): Point | null {
  if (performance.now() - lastPointer.time < 1000) return { x: lastPointer.x, y: lastPointer.y }
  const el = document.activeElement
  if (!el || el === document.body) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

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

/** Lati che ondeggiano (prop jelly): nessuno con jelly a 0 */
const jellySides = (jelly: number) => (jelly > 0 ? SIDES : [])

/*
 * Rigonfiamenti al centro dei lati, dentro la forma (crescono con lei): escono dal lato
 * e rientrano, sempre meno; il goo li fonde con la scheda e il lato ondeggia come gelatina.
 */
function JellySides({
  m,
  sides,
  jelly,
  delay = 0,
  onDone,
}: {
  m: GloopMotion
  sides: ReturnType<typeof jellySides>
  jelly: number
  /** Ritardo in più, ad esempio il volo della goccia con enter="drop" */
  delay?: number
  onDone: () => void
}) {
  return sides.map(({ side, delay: sideDelay }) => {
    const vertical = side === 'top' || side === 'bottom'
    const sign = side === 'top' || side === 'left' ? -1 : 1
    const path = BULGE.map((out) => out * sign * Math.min(1, jelly))
    return (
      <motion.span
        key={side}
        className="modal__bulge"
        data-side={side}
        onAnimationComplete={onDone}
        initial={{ x: 0, y: 0, opacity: 1 }}
        animate={{
          x: vertical ? 0 : path,
          y: vertical ? path : 0,
          // Alla fine sparisce: da fermo coprirebbe il bordo sottile della scheda
          opacity: [1, 1, 1, 1, 0],
          transition: m.t({ duration: 0.85, delay: delay + sideDelay, times: BULGE_TIMES, ease: 'easeInOut' }),
        }}
        exit={{ opacity: 0, transition: { duration: 0 } }}
      />
    )
  })
}

/*
 * Il fondo della scheda è un blob in un filtro goo, separato dal contenuto (che resta
 * nitido e non passa dal filtro). Apertura: una pillola piccola si gonfia come gelatina,
 * con larghezza e altezza che rimbalzano fuori fase, e si squadra nello stesso tempo
 * (angoli sulla stessa molla della scala). Intanto i lati ondeggiano: un rigonfiamento
 * al centro di ciascuno esce e rientra un paio di volte, fuso dal goo con la scheda.
 * Chiusura: lo stesso movimento al contrario: la scheda si gonfia appena, si arrotonda
 * in una goccia e si sgonfia fino a sparire.
 */
function ModalBlob({ m, jelly }: { m: GloopMotion; jelly: number }) {
  // Con jelly a 0 i lati restano fermi
  const sides = jellySides(jelly)
  const ref = useRef<HTMLDivElement>(null)
  const filterId = useId()
  // Il filtro goo serve solo mentre la forma si muove: da ferma la scheda è un rettangolo
  // e il filtro su un'area così grande costerebbe a ogni repaint (anche durante lo scroll)
  const [settled, setSettled] = useState(false)
  const isPresent = useIsPresent()
  const gooey = !settled || !isPresent
  // Scala e lati finiscono in momenti diversi: il filtro si toglie quando hanno finito tutti
  const pending = useRef(1 + sides.length)
  const done = () => {
    if (--pending.current === 0 && isPresent) setSettled(true)
  }
  // Dimensioni della scheda: la pillola iniziale ha il raggio pari a metà del lato corto
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    if (m.reduced) return
    const r = ref.current!.getBoundingClientRect()
    pending.current = 1 + sides.length
    setSize({ w: r.width, h: r.height })
  }, [m.reduced, sides.length])

  // Movimento ridotto: niente goo né rimbalzi, il fondo compare in dissolvenza
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

  if (!size) return <div ref={ref} className="modal__blob" aria-hidden="true" />
  const pill = Math.min(size.w, size.h) / 2

  return (
    <div
      ref={ref}
      className="modal__blob"
      aria-hidden="true"
      data-settled={!gooey || undefined}
      style={gooey ? { filter: `url(#${CSS.escape(filterId)})` } : undefined}
    >
      <GooFilter id={filterId} blur={14} color="var(--modal-surface)" />
      <motion.div
        className="modal__blob-shape"
        onAnimationComplete={done}
        initial={{ scaleX: 0.16, scaleY: 0.2, borderRadius: pill, opacity: 0 }}
        animate={{
          scaleX: 1,
          scaleY: 1,
          borderRadius: RADIUS,
          opacity: 1,
          transition: m.t({
            // Gelatina: molle diverse per larghezza e altezza, oscillano fuori fase
            scaleX: jellySpring(JELLY_X, jelly),
            scaleY: jellySpring(JELLY_Y, jelly),
            // Angoli insieme alla scala, senza rimbalzo (sotto RADIUS diventerebbero spigoli)
            borderRadius: { type: 'spring', stiffness: 300, damping: 32 },
            opacity: { duration: 0.08 },
          }),
        }}
        // Chiusura speculare all'apertura: un piccolo gonfiore (il rimbalzo al contrario),
        // poi si arrotonda in una goccia e si sgonfia, tutta in un pezzo
        exit={{
          scaleX: [1, 1.03, 0.16],
          scaleY: [1, 1.04, 0.2],
          borderRadius: [RADIUS, RADIUS, pill],
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
      >
        <JellySides m={m} sides={sides} jelly={jelly} onDone={done} />
      </motion.div>
    </div>
  )
}

/*
 * enter="drop": una goccia parte dal pulsante che ha aperto il modal (o cade dall'alto se
 * non c'è), vola verso il centro allungata dalla velocità, all'impatto si schiaccia e
 * la scheda si allarga dalla goccia come una gelatina (larghezza e altezza rimbalzano
 * fuori fase, i lati ondeggiano come in swell).
 * Chiusura: la scheda si sgonfia nella goccia, che torna volando al pulsante.
 */
function DropBlob({ m, origin, jelly }: { m: GloopMotion; origin: Point | null; jelly: number }) {
  const sides = jellySides(jelly)
  const ref = useRef<HTMLDivElement>(null)
  const filterId = useId()
  const [settled, setSettled] = useState(false)
  const isPresent = useIsPresent()
  const gooey = !settled || !isPresent
  // Scala e lati finiscono in momenti diversi: il filtro si toglie quando hanno finito tutti
  const pending = useRef(1 + sides.length)
  const done = () => {
    if (--pending.current === 0 && isPresent) setSettled(true)
  }
  const [geo, setGeo] = useState<{
    from: { x: number; y: number }
    w: number
    h: number
    region: { x: number; y: number; width: number; height: number }
  } | null>(null)

  // Prima del primo frame: posizione della scheda e del pulsante (il focus non si è ancora spostato)
  useLayoutEffect(() => {
    const r = ref.current!.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    pending.current = 1 + sides.length
    setGeo({
      from: origin ? { x: origin.x - cx, y: origin.y - cy } : fallFrom(),
      w: r.width,
      h: r.height,
      // Il filtro copre tutta la finestra: la goccia vola anche fuori dalla scheda
      region: { x: -r.left - 40, y: -r.top - 40, width: innerWidth + 80, height: innerHeight + 80 },
    })
    // origin resta lo stesso per tutta l'apertura: in pratica si misura una volta sola
  }, [origin, sides.length])

  if (!geo) return <div ref={ref} className="modal__blob" aria-hidden="true" />

  const { from, w, h } = geo
  const dist = Math.hypot(from.x, from.y)
  const fly = flightTime(dist)
  const stretch = flightStretch(dist)
  // Più si allunga, più si assottiglia (il volume resta circa lo stesso)
  const thin = 1.3 / stretch
  // Direzione del volo (dal pulsante al centro): la goccia si allunga lungo questa
  const angle = (Math.atan2(-from.y, -from.x) * 180) / Math.PI
  // La scheda parte (e torna) grande quanto la goccia, tonda
  const sx = FLY_SIZE / w
  const sy = FLY_SIZE / h
  const round = Math.max(w, h) / 2
  const flyIn = fly + 0.2
  const impact = fly / flyIn
  // Chiusura: sgonfiamento (come swell), poi il volo di ritorno
  const deflate = 0.46
  const flyOut = deflate + fly * 1.3
  const leave = deflate / flyOut

  return (
    <div
      ref={ref}
      className="modal__blob"
      aria-hidden="true"
      data-settled={!gooey || undefined}
      style={gooey ? { filter: `url(#${CSS.escape(filterId)})` } : undefined}
    >
      <GooFilter id={filterId} blur={14} color="var(--modal-surface)" region={geo.region} />
      <motion.div
        className="modal__blob-shape"
        onAnimationComplete={done}
        initial={{ scaleX: sx, scaleY: sy, borderRadius: round, opacity: 0 }}
        animate={{
          scaleX: 1,
          scaleY: 1,
          borderRadius: RADIUS,
          opacity: 1,
          // Gelatina: larghezza e altezza con molle diverse, oscillano fuori fase
          transition: m.t({
            scaleX: jellySpring(JELLY_X, jelly, fly),
            scaleY: jellySpring(JELLY_Y, jelly, fly + 0.03),
            borderRadius: { duration: 0.55, delay: fly + 0.05, ease: [0.5, 0, 0.2, 1] },
            opacity: { duration: 0.01, delay: fly },
          }),
        }}
        exit={{
          scaleX: [1, 1.03, sx],
          scaleY: [1, 1.04, sy],
          borderRadius: [RADIUS, RADIUS, round],
          opacity: [1, 1, 0],
          transition: m.t({
            duration: 0.42,
            delay: 0.04,
            times: [0, 0.22, 1],
            ease: ['easeOut', [0.55, 0, 0.75, 0.2]],
            borderRadius: { duration: 0.42, delay: 0.04, times: [0, 0.3, 1], ease: ['linear', [0.4, 0, 0.6, 1]] },
            opacity: { duration: 0.42, delay: 0.04, times: [0, 0.96, 1] },
          }),
        }}
      >
        {/* Dopo l'impatto i lati ondeggiano come nella gelatina di swell */}
        <JellySides m={m} sides={sides} jelly={jelly} delay={fly - 0.02} onDone={done} />
      </motion.div>

      {/* La goccia in volo: fuori lo spostamento, dentro la rotazione e lo stiramento */}
      <motion.span
        className="modal__fly modal__fly--carrier"
        style={{ '--drop-size': `${FLY_SIZE}px` } as CSSProperties}
        initial={{ x: from.x, y: from.y }}
        // Parte subito veloce e arriva ancora lanciata: l'impatto si sente
        animate={{ x: 0, y: 0, transition: m.t({ duration: fly, ease: [0.3, 0.2, 0.7, 1] }) }}
        exit={{
          x: [0, 0, from.x],
          y: [0, 0, from.y],
          transition: m.t({ duration: flyOut, times: [0, leave, 1], ease: ['linear', [0.3, 0, 0.6, 1]] }),
        }}
      >
        {/*
          Rotazione su un elemento a parte: Motion scrive scaleX(...) rotate(...) nello stesso
          transform, cioè ruota e poi stira lungo l'asse dello schermo (sempre in orizzontale).
          Così invece lo stiramento avviene lungo la direzione del volo.
        */}
        <span className="modal__fly-rotor" style={{ transform: `rotate(${angle}deg)` }}>
          <motion.span
            className="modal__fly-body"
            // Si allunga subito (velocità), resta tesa in volo, all'impatto si schiaccia e si scioglie
            initial={{ scaleX: 0.6, scaleY: 0.6 }}
            animate={{
              scaleX: [0.6, stretch, stretch, 0.55, 0],
              scaleY: [0.6, thin, thin, 1.5, 0],
              transition: m.t({
                duration: flyIn,
                times: [0, impact * 0.3, impact * 0.85, impact, 1],
                ease: ['easeOut', 'linear', 'easeOut', 'easeIn'],
              }),
            }}
            exit={{
              scaleX: [0, 0, 1, stretch * 0.95, 0.5],
              scaleY: [0, 0, 1, thin, 0.5],
              transition: m.t({ duration: flyOut, times: [0, leave - 0.04, leave, (leave + 1) / 2, 1] }),
            }}
          />
        </span>
      </motion.span>

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
  enter = 'swell',
  jelly = DEFAULT_JELLY,
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
  // enter="drop": il punto da cui parte la goccia, letto una volta quando il modal si apre
  // (prima che il focus si sposti). Serve anche a ritardare il contenuto fino all'impatto
  // (stato aggiornato durante il render, il pattern di React per derivare da un cambio di prop)
  const [wasOpen, setWasOpen] = useState(false)
  const [origin, setOrigin] = useState<Point | null>(null)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open && enter === 'drop' && typeof document !== 'undefined') setOrigin(openerPoint())
  }

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
  const lag =
    enter === 'drop' && open
      ? flightTime(
          origin
            ? Math.hypot(origin.x - innerWidth / 2, origin.y - innerHeight / 2)
            : Math.hypot(fallFrom().x, fallFrom().y),
        ) + 0.12
      : 0
  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 6, filter: 'blur(4px)' },
    animate: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: m.t({
        duration: 0.25,
        delay: delay + lag,
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
                  {enter === 'drop' && !m.reduced ? (
                    <DropBlob m={m} origin={origin} jelly={jelly} />
                  ) : (
                    <ModalBlob m={m} jelly={jelly} />
                  )}

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
                                  delay: lag + 0.24 + i * 0.05,
                                  opacity: {
                                    duration: 0.1,
                                    delay: lag + 0.24 + i * 0.05,
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
