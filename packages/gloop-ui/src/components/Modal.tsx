import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import ExpandButton from './ExpandButton'
import { GooFilter, useSettled } from './goo'
import { DEFAULT_JELLY, JELLY_X, JELLY_Y, jellySpring, usePresence } from './jelly'
import { useThemeVars } from './floating/useThemeVars'
import { GloopMotionProvider, pickMotionProps, type MotionProps } from './motion-context'
import { useGloopMotion, type GloopMotion } from './gloop-motion'
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

/*
 * Animato in CSS (Modal.css): le molle fisse sono easing linear() per preset, quelle
 * della gelatina (dipendono dalla prop jelly) le campiona jelly.ts e arrivano come variabili.
 * enter="drop" dipende da misure fatte all'apertura: lì le animazioni sono WAAPI (element.animate).
 * Rigonfiamenti dei lati (ampiezze e tempi) e i pulsanti del footer: vedi Modal.css.
 */

// Lati che ondeggiano: prima i lati lunghi (alto e basso), poi quelli corti (ritardi nel CSS)
const SIDES = ['top', 'bottom', 'left', 'right'] as const

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
 * Il percorso è un keyframe in Modal.css, l'ampiezza (--modal-jelly) la scrive il blob.
 */
function JellySides({ sides }: { sides: ReturnType<typeof jellySides> }) {
  return sides.map((side) => <span key={side} className="modal__bulge" data-side={side} />)
}

/*
 * Area del filtro di swell: la scheda più il margine per il goo (blur 14), i rigonfiamenti
 * dei lati, il rimbalzo della gelatina e l'ombra. Senza, il filtro coprirebbe 2×3 volte la
 * scheda (e su Safari/iOS il costo va con l'area)
 */
const swellRegion = (w: number, h: number) => {
  const mx = 60 + w * 0.12
  const my = 60 + h * 0.12
  return { x: -mx, y: -my, width: w + 2 * mx, height: h + 2 * my }
}

// Le due molle della gelatina, già campionate, come variabili per il CSS
function jellyVars(m: GloopMotion, jelly: number) {
  const x = jellySpring(JELLY_X, jelly, m.preset)
  const y = jellySpring(JELLY_Y, jelly, m.preset)
  return {
    '--modal-jelly-x': x.ease,
    '--modal-jelly-x-ms': `${x.ms}ms`,
    '--modal-jelly-y': y.ease,
    '--modal-jelly-y-ms': `${y.ms}ms`,
    '--modal-jelly': Math.min(1, jelly),
  } as CSSProperties
}

/*
 * Il fondo della scheda è un blob in un filtro goo, separato dal contenuto (che resta
 * nitido e non passa dal filtro). Apertura: una pillola piccola si gonfia come gelatina,
 * con larghezza e altezza che rimbalzano fuori fase, e si squadra nello stesso tempo
 * (angoli sulla stessa molla della scala). Intanto i lati ondeggiano: un rigonfiamento
 * al centro di ciascuno esce e rientra un paio di volte, fuso dal goo con la scheda.
 * Chiusura: lo stesso movimento al contrario: la scheda si gonfia appena, si arrotonda
 * in una goccia e si sgonfia fino a sparire.
 * La pillola ha il raggio pari a metà del lato corto: 50cqmin (il blob è un container).
 */
function ModalBlob({ m, jelly, closing }: { m: GloopMotion; jelly: number; closing: boolean }) {
  // Con jelly a 0 i lati restano fermi
  const sides = jellySides(jelly)
  const ref = useRef<HTMLDivElement>(null)
  const filterId = useId()
  const gooey = !useSettled(ref, !m.reduced && !closing)

  // Movimento ridotto: niente goo né rimbalzi, il fondo compare in dissolvenza
  if (m.reduced) {
    return (
      <div className="modal__blob" aria-hidden="true">
        <div className="modal__blob-shape" style={{ borderRadius: RADIUS }} />
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="modal__blob"
      aria-hidden="true"
      data-settled={!gooey || undefined}
      style={{ ...jellyVars(m, jelly), filter: gooey ? `url(#${CSS.escape(filterId)})` : undefined }}
    >
      <GooFilter id={filterId} blur={14} color="var(--modal-surface)" region={swellRegion} />
      <div className="modal__blob-shape">
        <JellySides sides={sides} />
      </div>
    </div>
  )
}

type Geo = {
  from: { x: number; y: number }
  w: number
  h: number
  region: { x: number; y: number; width: number; height: number }
}

/*
 * enter="drop": una goccia parte dal pulsante che ha aperto il modal (o cade dall'alto se
 * non c'è), vola verso il centro allungata dalla velocità, all'impatto si schiaccia e
 * la scheda si allarga dalla goccia come una gelatina (larghezza e altezza rimbalzano
 * fuori fase, i lati ondeggiano come in swell).
 * Chiusura: la scheda si sgonfia nella goccia, che torna volando al pulsante.
 * Partenza, tempi e stiramento dipendono dalle misure: le animazioni sono WAAPI, avviate
 * prima del primo frame. La larghezza sulla proprietà scale e l'altezza su transform
 * (scaleY), così ognuna ha la sua molla.
 */
/*
 * Area del filtro di drop, in px dall'angolo della scheda: la scheda più il punto di partenza
 * della goccia (la traiettoria è una retta), con il margine per la goccia stirata, il goo e
 * l'ombra, tagliata alla finestra. Prima copriva tutta la finestra
 */
function flightRegion(r: DOMRect, from: Point) {
  const M = FLY_SIZE + 60
  const sx = r.width / 2 + from.x
  const sy = r.height / 2 + from.y
  const left = Math.max(Math.min(0, sx) - M, -r.left - 40)
  const top = Math.max(Math.min(0, sy) - M, -r.top - 40)
  const right = Math.min(Math.max(r.width, sx) + M, innerWidth - r.left + 40)
  const bottom = Math.min(Math.max(r.height, sy) + M, innerHeight - r.top + 40)
  return { x: left, y: top, width: right - left, height: bottom - top }
}

function DropBlob({ m, origin, jelly, closing }: { m: GloopMotion; origin: Point | null; jelly: number; closing: boolean }) {
  const sides = jellySides(jelly)
  const ref = useRef<HTMLDivElement>(null)
  const shapeRef = useRef<HTMLDivElement>(null)
  const carrierRef = useRef<HTMLSpanElement>(null)
  const bodyRef = useRef<HTMLSpanElement>(null)
  const filterId = useId()
  const [geo, setGeo] = useState<Geo | null>(null)
  const gooey = !useSettled(ref, !!geo && !closing)

  // Prima del primo frame: posizione della scheda e del pulsante (il focus non si è ancora spostato)
  useLayoutEffect(() => {
    const r = ref.current!.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const from = origin ? { x: origin.x - cx, y: origin.y - cy } : fallFrom()
    setGeo({
      from,
      w: r.width,
      h: r.height,
      region: flightRegion(r, from),
    })
    // origin resta lo stesso per tutta l'apertura: in pratica si misura una volta sola
  }, [origin])

  const dist = geo ? Math.hypot(geo.from.x, geo.from.y) : 0
  const fly = flightTime(dist)

  useLayoutEffect(() => {
    const shape = shapeRef.current
    const carrier = carrierRef.current
    const body = bodyRef.current
    if (!geo || !shape?.animate || !carrier || !body) return
    const { from, w, h } = geo
    const stretch = flightStretch(dist)
    // Più si allunga, più si assottiglia (il volume resta circa lo stesso)
    const thin = 1.3 / stretch
    // La scheda parte (e torna) grande quanto la goccia, tonda
    const sx = FLY_SIZE / w
    const sy = FLY_SIZE / h
    const round = `${Math.max(w, h) / 2}px`
    const radius = `${RADIUS}px`
    const flyIn = fly + 0.2
    const impact = fly / flyIn
    // Chiusura: sgonfiamento (come swell), poi il volo di ritorno
    const deflate = 0.46
    const flyOut = deflate + fly * 1.3
    const leave = deflate / flyOut
    // Secondi → ms, divisi per la velocità
    const t = (s: number) => (s * 1000) / m.speed
    const anims: Animation[] = []

    if (!closing) {
      // Gelatina: larghezza e altezza con molle diverse, oscillano fuori fase
      const jx = jellySpring(JELLY_X, jelly, m.preset)
      const jy = jellySpring(JELLY_Y, jelly, m.preset)
      anims.push(
        shape.animate({ scale: [`${sx} 1`, '1 1'] }, { duration: jx.ms / m.speed, delay: t(fly), easing: jx.ease, fill: 'backwards' }),
        shape.animate(
          { transform: [`scaleY(${sy})`, 'none'] },
          { duration: jy.ms / m.speed, delay: t(fly + 0.03), easing: jy.ease, fill: 'backwards' },
        ),
        shape.animate(
          { borderRadius: [round, radius] },
          { duration: t(0.55), delay: t(fly + 0.05), easing: 'cubic-bezier(0.5, 0, 0.2, 1)', fill: 'backwards' },
        ),
        shape.animate({ opacity: [0, 1] }, { duration: t(0.01), delay: t(fly), fill: 'backwards' }),
        // Parte subito veloce e arriva ancora lanciata: l'impatto si sente
        carrier.animate(
          { translate: [`${from.x}px ${from.y}px`, '0px 0px'] },
          { duration: t(fly), easing: 'cubic-bezier(0.3, 0.2, 0.7, 1)', fill: 'backwards' },
        ),
        // Si allunga subito (velocità), resta tesa in volo, all'impatto si schiaccia e si scioglie
        body.animate(
          [
            { scale: '0.6', offset: 0, easing: 'ease-out' },
            { scale: `${stretch} ${thin}`, offset: impact * 0.3, easing: 'linear' },
            { scale: `${stretch} ${thin}`, offset: impact * 0.85, easing: 'ease-out' },
            { scale: '0.55 1.5', offset: impact, easing: 'ease-in' },
            { scale: '0', offset: 1 },
          ],
          { duration: t(flyIn), fill: 'forwards' },
        ),
      )
    } else {
      // Chiusura speculare all'apertura: un piccolo gonfiore, poi si arrotonda e si sgonfia
      const exit = { duration: t(0.42), delay: t(0.04), fill: 'both' } as const
      anims.push(
        shape.animate(
          [
            { scale: '1 1', easing: 'ease-out' },
            { scale: '1.03 1.04', offset: 0.22, easing: 'cubic-bezier(0.55, 0, 0.75, 0.2)' },
            { scale: `${sx} ${sy}` },
          ],
          exit,
        ),
        shape.animate(
          [
            { borderRadius: radius, easing: 'linear' },
            { borderRadius: radius, offset: 0.3, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' },
            { borderRadius: round },
          ],
          exit,
        ),
        shape.animate([{ opacity: 1 }, { opacity: 1, offset: 0.96 }, { opacity: 0 }], exit),
        carrier.animate(
          [
            { translate: '0px 0px', easing: 'linear' },
            { translate: '0px 0px', offset: leave, easing: 'cubic-bezier(0.3, 0, 0.6, 1)' },
            { translate: `${from.x}px ${from.y}px` },
          ],
          { duration: t(flyOut), fill: 'forwards' },
        ),
        body.animate(
          [
            { scale: '0', easing: 'ease-in-out' },
            { scale: '0', offset: leave - 0.04, easing: 'ease-in-out' },
            { scale: '1', offset: leave, easing: 'ease-in-out' },
            { scale: `${stretch * 0.95} ${thin}`, offset: (leave + 1) / 2, easing: 'ease-in-out' },
            { scale: '0.5' },
          ],
          { duration: t(flyOut), fill: 'forwards' },
        ),
      )
    }
    return () => anims.forEach((a) => a.cancel())
  }, [geo, closing, dist, fly, jelly, m.speed, m.preset])

  if (!geo) return <div ref={ref} className="modal__blob" aria-hidden="true" data-enter="drop" />

  // Direzione del volo (dal pulsante al centro): la goccia si allunga lungo questa
  const angle = (Math.atan2(-geo.from.y, -geo.from.x) * 180) / Math.PI

  return (
    <div
      ref={ref}
      className="modal__blob"
      aria-hidden="true"
      data-enter="drop"
      data-settled={!gooey || undefined}
      style={
        {
          ...jellyVars(m, jelly),
          // Dopo l'impatto i lati ondeggiano come nella gelatina di swell
          '--modal-bulge-delay': `${Math.round((fly - 0.02) * 1000)}ms`,
          filter: gooey ? `url(#${CSS.escape(filterId)})` : undefined,
        } as CSSProperties
      }
    >
      <GooFilter id={filterId} blur={14} color="var(--modal-surface)" region={geo.region} />
      <div ref={shapeRef} className="modal__blob-shape">
        <JellySides sides={sides} />
      </div>

      {/* La goccia in volo: fuori lo spostamento, dentro la rotazione e lo stiramento */}
      <span
        ref={carrierRef}
        className="modal__fly modal__fly--carrier"
        style={{ '--drop-size': `${FLY_SIZE}px` } as CSSProperties}
      >
        {/*
          Rotazione su un elemento a parte: lo stiramento (scale) avviene così lungo la
          direzione del volo, non lungo l'asse dello schermo.
        */}
        <span className="modal__fly-rotor" style={{ transform: `rotate(${angle}deg)` }}>
          <span ref={bodyRef} className="modal__fly-body" />
        </span>
      </span>
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
  const layerRef = useRef<HTMLDivElement>(null)
  // Resta montato durante la chiusura, finché le animazioni non sono finite; poi afterClose
  const { mounted, closing } = usePresence(open, m.state === 'off', layerRef, afterClose)
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

  return (
    <>
      <span ref={anchorRef} hidden />
      {createPortal(
        <GloopMotionProvider {...pickMotionProps(motionProps)}>
          {mounted && (
            <div
              ref={layerRef}
              {...m.rootProps}
              className="modal-layer"
              data-state={closing ? 'closing' : 'open'}
              style={{ ...m.rootProps.style, ...themeVars, '--modal-lag': `${Math.round(lag * 1000)}ms` } as CSSProperties}
            >
              <div
                className="modal-backdrop"
                aria-hidden="true"
                style={backdropVars}
                onClick={() => closeOnBackdrop && onClose()}
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
                  <DropBlob m={m} origin={origin} jelly={jelly} closing={closing} />
                ) : (
                  <ModalBlob m={m} jelly={jelly} closing={closing} />
                )}

                {/* Header, corpo e footer arrivano quando la goccia ha quasi preso forma (Modal.css) */}
                {hasHeader && (
                  <header className="modal__header">
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
                      <button type="button" className="modal__close" aria-label={closeLabel} onClick={onClose}>
                        {CloseIcon}
                      </button>
                    )}
                  </header>
                )}

                <div
                  ref={bodyRef}
                  className="modal__body"
                  // Scorrevole: raggiungibile da tastiera per scorrere con le frecce
                  tabIndex={edges.scrollable ? 0 : undefined}
                  onScroll={measure}
                >
                  <div className="modal__content">{children}</div>
                </div>

                {hasFooter && (
                  <footer className="modal__footer" data-align={actionsAlign}>
                    {footer != null && <div className="modal__footer-custom">{footer}</div>}
                    {actions.length > 0 && (
                      <div className="modal__actions">
                        {actions.map((action, i) => (
                          // Salgono dal bordo inferiore, uno dopo l'altro
                          <div key={action.label} style={{ '--i': i } as CSSProperties}>
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
                          </div>
                        ))}
                      </div>
                    )}
                  </footer>
                )}
              </div>
            </div>
          )}
        </GloopMotionProvider>,
        document.body,
      )}
    </>
  )
}

export default Modal
