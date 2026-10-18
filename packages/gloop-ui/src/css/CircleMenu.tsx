import {
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import Popover from './Popover'
import { GloopMotionProvider, pickMotionProps, type MotionProps } from '../components/motion-context'
import { useCssMotion } from '../components/css-motion'
import Tooltip from './Tooltip'
import type { FloatingPlacement } from '../components/floating/position'
import '../components/theme.css'
import './CircleMenu.css'

export type CircleMenuTooltip = {
  content: ReactNode
  /** Default: il lato rivolto verso l'esterno del menu, così non copre le altre icone */
  placement?: FloatingPlacement
  /** Ritardo prima di aprirsi al passaggio del mouse, in ms */
  delay?: number
}

export type CircleMenuPanelApi = {
  /** Chiude pannello e menu, e riporta il focus sul "+" (es. dopo una scelta) */
  close: () => void
  /** Chiude solo il pannello: si torna alle icone */
  back: () => void
}

/** Qualsiasi contenuto, oppure una funzione che riceve { close, back } */
export type CircleMenuPanelContent = ReactNode | ((api: CircleMenuPanelApi) => ReactNode)

export type CircleMenuPanel = {
  content: CircleMenuPanelContent
  /** Default: il lato rivolto verso l'esterno del menu */
  placement?: FloatingPlacement
  /** Nome accessibile del pannello (default: la label dell'item) */
  label?: string
}

export type CircleMenuItem = {
  icon: ReactNode
  label: string
  onSelect?: () => void
  /**
   * Pannello personalizzato (slider, liste, colori, form…) che si apre accanto all'icona
   * al clic, al posto di onSelect. Contenuto/render-prop oppure { content, placement, label }.
   * Su un item con sottomenu viene ignorato: vale per le foglie.
   */
  panel?: CircleMenuPanelContent | CircleMenuPanel
  /**
   * Tooltip dell'icona: true mostra la label, oppure testo/JSX,
   * oppure { content, placement, delay }
   */
  tooltip?: ReactNode | CircleMenuTooltip
  /** Sottomenu: da 2 a 5 icone che escono ad arco da questa */
  items?: Omit<CircleMenuItem, 'items'>[]
}

export type CircleMenuDirection =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'

export type CircleMenuProps = {
  /** Da 1 a 6 icone attorno al bottone centrale */
  items: CircleMenuItem[]
  label?: string
  /**
   * Verso dove si apre l'arco. Senza direction (e senza angle) le icone
   * si distribuiscono su tutto il cerchio.
   */
  direction?: CircleMenuDirection
  /** Direzione libera, in gradi (0 = destra, 90 = basso): ha la precedenza su direction */
  angle?: number
  /** Ampiezza dell'arco, in gradi (default: 90 in diagonale, 180 sui lati, 360 senza direzione) */
  arc?: number
  /**
   * Distanza delle icone dal centro, in px. Di default è la minima perché
   * le icone non si tocchino (mai sotto 68 fino a 3 icone, 76 oltre). Se è più
   * piccola, l'arco si allarga quanto basta perché le icone non si tocchino
   */
  radius?: number
  /** Distanza delle icone del sottomenu dalla loro icona, in px */
  subRadius?: number
  /**
   * true: il riquadro del menu aperto è già riservato nel layout.
   * false: occupa solo il "+" e le icone si aprono su un livello sopra il contenuto vicino.
   */
  reserveSpace?: boolean
  /**
   * Modalità controllata: apre e chiude il menu dall'esterno
   * (es. un menu contestuale aperto con il tasto destro)
   */
  open?: boolean
  defaultOpen?: boolean
  /** Chiamata quando il menu si apre o si chiude (dal "+", Esc, clic fuori, scelta fatta) */
  onOpenChange?: (open: boolean) => void
} & MotionProps

const CENTER_SIZE = 56
const ITEM_SIZE = 48
const CHILD_SIZE = 40
/** Spazio minimo tra due icone vicine, in px: sotto ~16 il filtro goo le unisce */
const ITEM_GAP = 18
/** Margine attorno al menu per il filtro goo e l'ombra, in px */
const PAD = 16
/** Indicatore di sottomenu: diametro e distanza dal centro dell'icona, in px */
const MORE_SIZE = 12
const MORE_OFFSET = 18
/** Spazio minimo tra due icone vicine del sottomenu, in px */
const SUB_GAP = 6
/** Ampiezza massima dell'arco del sottomenu, in gradi: oltre, cresce la distanza */
const SUB_MAX_ARC = 130

/*
 * Le molle sono easing linear() in CircleMenu.css (una curva per
 * apertura, chiusura, hover e coda, per ogni preset). Qui restano solo i ritardi e la
 * scala della coda: ogni blob ha una "coda" che insegue la testa con una molla più lenta,
 * e il filtro goo le fonde; in movimento la goccia si allunga verso il centro.
 */
const TAIL_SCALE = 0.8

// Angoli nel sistema dello schermo: 0 = destra, 90 = basso, 180 = sinistra, -90 = alto
const DIRECTION_ANGLE: Record<CircleMenuDirection, number> = {
  right: 0,
  'bottom-right': 45,
  bottom: 90,
  'bottom-left': 135,
  left: 180,
  'top-left': -135,
  top: -90,
  'top-right': -45,
}

const rad = (deg: number) => (deg * Math.PI) / 180
const polar = (r: number, deg: number) => ({ x: Math.cos(rad(deg)) * r, y: Math.sin(rad(deg)) * r })

// Lato del tooltip che guarda fuori dal menu, nella stessa direzione dell'icona
function outward(deg: number): FloatingPlacement {
  const { x, y } = polar(1, deg)
  if (Math.abs(x) > Math.abs(y) + 1e-6) return x > 0 ? 'right' : 'left'
  return y > 0 ? 'bottom' : 'top'
}

function tooltipOf(item: Omit<CircleMenuItem, 'items'>): CircleMenuTooltip | null {
  const t = item.tooltip
  if (t === undefined || t === null || t === false || t === '') return null
  if (t === true) return { content: item.label }
  if (typeof t === 'object' && !isValidElement(t) && 'content' in t) return t as CircleMenuTooltip
  return { content: t as ReactNode }
}

function panelOf(item: CircleMenuItem): CircleMenuPanel | null {
  const p = item.panel
  if (item.items?.length || p === undefined || p === null || p === false) return null
  if (typeof p === 'object' && !isValidElement(p) && 'content' in p) return p as CircleMenuPanel
  return { content: p as CircleMenuPanelContent }
}

/*
 * Due livelli sovrapposti, animati con le stesse identiche molle:
 * - "blob": cerchi scuri con un filtro SVG goo che li fonde come liquido
 *   (escono dal centro allungandosi, rientrano facendosi riassorbire)
 * - "icone": i bottoni veri, nitidi e cliccabili, nelle stesse posizioni
 */
function CircleMenu({
  items,
  label = 'Menu',
  direction,
  angle,
  arc,
  radius,
  subRadius = 60,
  reserveSpace = true,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...motionProps
}: CircleMenuProps) {
  const m = useCssMotion(motionProps)
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const open = openProp ?? uncontrolled
  // I listener su document leggono sempre l'ultima onOpenChange
  const onOpenChangeRef = useRef(onOpenChange)
  useLayoutEffect(() => {
    onOpenChangeRef.current = onOpenChange
  })
  function setOpen(next: boolean) {
    if (openProp === undefined) setUncontrolled(next)
    onOpenChangeRef.current?.(next)
  }
  const [sub, setSub] = useState<number | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  /** Item con il pannello aperto: "i" nel primo livello, "i-j" nel sottomenu */
  const [panel, setPanel] = useState<string | null>(null)
  // pointerdown "dentro" il menu, anche nei pannelli e tooltip in portal (vedi Popover)
  const inside = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const filterId = useId()
  const reduceMotion = m.reduced

  const n = Math.min(items.length, 6)

  /*
   * Cerchio o arco: con un cerchio le icone partono dall'alto e si dividono 360°;
   * con un arco si distribuiscono da un estremo all'altro, centrate sulla direzione.
   */
  const center = angle ?? (direction ? DIRECTION_ANGLE[direction] : -90)
  const span = arc ?? (angle === undefined && !direction ? 360 : direction?.includes('-') ? 90 : 180)
  const full = span >= 360
  const arcStep = full ? 360 / n : n > 1 ? span / (n - 1) : 0

  // Raggio minimo perché due icone vicine non si tocchino (archi stretti → più lontane)
  const minRadius =
    n > 1 && arcStep > 0 ? (ITEM_SIZE + ITEM_GAP) / (2 * Math.sin(rad(Math.min(arcStep, 180) / 2))) : 0
  const r = radius ?? Math.max(n <= 3 ? 68 : 76, Math.ceil(minRadius))

  /*
   * Con un radius esplicito più piccolo del minimo, l'arco si allarga (sempre centrato
   * sulla direzione) quanto basta perché le icone non si tocchino
   */
  const fitStep = (2 * Math.asin(Math.min(1, (ITEM_SIZE + ITEM_GAP) / (2 * r))) * 180) / Math.PI
  const step = full || n < 2 ? arcStep : Math.max(arcStep, fitStep)
  const angleOf = (i: number) => (full ? center + i * step : center - ((n - 1) * step) / 2 + i * step)

  /*
   * Arco del sottomenu con m icone: l'angolo tra due icone è quello minimo perché
   * non si tocchino; se l'arco totale supera SUB_MAX_ARC, si allontanano invece di allargarsi
   */
  function subArc(m: number) {
    const chord = CHILD_SIZE + SUB_GAP
    const step = (2 * Math.asin(Math.min(1, chord / (2 * subRadius))) * 180) / Math.PI
    if (m < 2 || (m - 1) * step <= SUB_MAX_ARC) return { dist: subRadius, step }
    const maxStep = SUB_MAX_ARC / (m - 1)
    return { dist: chord / (2 * Math.sin(rad(maxStep / 2))), step: maxStep }
  }

  /*
   * Ingombro: un riquadro che contiene centro, icone e sottomenu aperti (più il margine).
   * Con un arco il bottone centrale non è al centro del riquadro: sta in (originX, originY).
   */
  const extents = [{ x: 0, y: 0, s: CENTER_SIZE }]
  items.slice(0, n).forEach((item, i) => {
    const p = polar(r, angleOf(i))
    extents.push({ ...p, s: ITEM_SIZE * 1.12 })
    const m = item.items?.length ?? 0
    const { dist, step: subStep } = subArc(m)
    for (let j = 0; j < m; j++) {
      const c = polar(dist, angleOf(i) + (j - (m - 1) / 2) * subStep)
      extents.push({ x: p.x + c.x, y: p.y + c.y, s: CHILD_SIZE * 1.12 })
    }
  })
  const minX = Math.min(...extents.map((e) => e.x - e.s / 2)) - PAD
  const maxX = Math.max(...extents.map((e) => e.x + e.s / 2)) + PAD
  const minY = Math.min(...extents.map((e) => e.y - e.s / 2)) - PAD
  const maxY = Math.max(...extents.map((e) => e.y + e.s / 2)) + PAD

  function closeAll(focusTrigger = false) {
    setOpen(false)
    setSub(null)
    setPanel(null)
    setHovered(null)
    if (focusTrigger) triggerRef.current?.focus()
  }

  /*
   * Chiuso dall'esterno (modalità controllata): sottomenu e pannello ripartono da zero.
   * Si aggiorna durante il render, senza un effect che farebbe un render in più.
   */
  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== open) {
    setWasOpen(open)
    if (!open) {
      setSub(null)
      setPanel(null)
      setHovered(null)
    }
  }

  // I listener su document chiamano sempre l'ultima closeAll
  const closeAllRef = useRef(closeAll)
  useLayoutEffect(() => {
    closeAllRef.current = closeAll
  })

  /*
   * Clic fuori. Gli eventi sintetici di React risalgono anche dai portal: un clic dentro
   * un pannello passa da onPointerDownCapture sulla radice e non chiude il menu.
   */
  useEffect(() => {
    if (!open) return
    inside.current = false

    function onPointerDown() {
      if (inside.current) inside.current = false
      else closeAllRef.current()
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      // Esc chiude prima il pannello, poi il sottomenu, poi tutto
      if (panel !== null) setPanel(null)
      else if (sub !== null) setSub(null)
      else closeAllRef.current(true)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, sub, panel])

  // Icona del primo livello "in primo piano": quella con il sottomenu o il pannello aperto
  const focused = sub ?? (panel !== null && !panel.includes('-') ? Number(panel) : null)

  /*
   * Avvolge il bottone in Popover (se l'item ha un pannello) e Tooltip (se ne ha uno).
   * shown: l'icona è visibile; quiet: il tooltip non deve comparire.
   */
  function decorate(
    item: CircleMenuItem,
    key: string,
    deg: number,
    shown: boolean,
    quiet: boolean,
    button: ReactElement,
  ) {
    let el = button
    const p = panelOf(item)
    if (p) {
      el = (
        <Popover
          key={key}
          open={shown && panel === key}
          onOpenChange={(next) => setPanel((cur) => (next ? key : cur === key ? null : cur))}
          placement={p.placement ?? outward(deg)}
          label={p.label ?? item.label}
          content={(api) =>
            typeof p.content === 'function' ? p.content({ close: () => closeAll(true), back: api.close }) : p.content
          }
        >
          {el}
        </Popover>
      )
    }
    const t = tooltipOf(item)
    if (t) {
      el = (
        <Tooltip
          key={key}
          content={t.content}
          placement={t.placement ?? outward(deg)}
          delay={t.delay}
          disabled={!shown || quiet || panel === key}
        >
          {el}
        </Tooltip>
      )
    }
    return el
  }

  /* ---------- Posizioni e transizioni (condivise dai due livelli) ---------- */

  /*
   * Ogni elemento animato riceve solo variabili CSS: --x/--y (translate), --s (scale),
   * --o (opacità) e --delay. data-phase sceglie la curva: open (molla elastica)
   * o close (rapida, poco rimbalzo). Le transizioni CSS fanno il resto, e se lo stato
   * cambia a metà ripartono dal valore corrente.
   */
  type Target = { x: number; y: number; s: number; o: number; delay: number; phase: 'open' | 'close' }

  const vars = (t: Target, size: number, extra?: CSSProperties) =>
    ({
      width: size,
      height: size,
      marginLeft: -size / 2,
      marginTop: -size / 2,
      '--x': `${t.x}px`,
      '--y': `${t.y}px`,
      '--s': t.s,
      '--o': t.o,
      '--delay': `${t.delay}s`,
      ...extra,
    }) as CSSProperties

  function itemState(i: number): Target {
    const p = polar(r, angleOf(i))
    const key = String(i)
    const s = !open
      ? 0.4
      : focused !== null && focused !== i
        ? 0.8 // con un sottomenu o un pannello aperto, le altre icone si fanno da parte
        : hovered === key
          ? 1.12
          : 1
    return {
      x: open ? p.x : 0,
      y: open ? p.y : 0,
      s,
      o: open ? 1 : 0,
      delay: open ? i * 0.035 : (n - 1 - i) * 0.02,
      phase: open ? 'open' : 'close',
    }
  }

  function childState(i: number, j: number, m: number): Target & { shown: boolean } {
    const parent = polar(r, angleOf(i))
    const { dist, step: subStep } = subArc(m)
    const offset = (j - (m - 1) / 2) * subStep
    const p = polar(dist, angleOf(i) + offset)
    const shown = open && sub === i
    const key = `${i}-${j}`
    // Da nascosti, i figli stanno dentro il genitore (o dentro il centro se tutto è chiuso)
    const home = open ? parent : { x: 0, y: 0 }
    return {
      shown,
      x: shown ? parent.x + p.x : home.x,
      y: shown ? parent.y + p.y : home.y,
      s: shown ? (hovered === key ? 1.12 : 1) : 0.3,
      o: shown ? 1 : 0,
      delay: shown ? j * 0.03 : 0,
      phase: shown ? 'open' : 'close',
    }
  }

  const hoverProps = (key: string) => ({
    onPointerEnter: () => setHovered(key),
    onPointerLeave: () => setHovered((h) => (h === key ? null : h)),
    onFocus: () => setHovered(key),
    onBlur: () => setHovered((h) => (h === key ? null : h)),
  })

  // Il "sussulto" del centro parte solo dopo il primo cambio, non al montaggio
  const [toggled, setToggled] = useState(false)
  const [firstOpen] = useState(open)
  if (!toggled && open !== firstOpen) setToggled(true)

  return (
    <GloopMotionProvider {...pickMotionProps(motionProps)}>
      <div
        {...m.rootProps}
        ref={rootRef}
        className="circle-menu"
        onPointerDownCapture={() => {
          inside.current = true
        }}
        data-overlay={reserveSpace ? undefined : true}
        data-open={open || undefined}
        data-toggled={toggled || undefined}
        style={
          {
            ...m.rootProps.style,
            width: reserveSpace ? maxX - minX : CENTER_SIZE,
            height: reserveSpace ? maxY - minY : CENTER_SIZE,
            '--origin-x': `${-minX}px`,
            '--origin-y': `${-minY}px`,
          } as CSSProperties
        }
      >
        {/*
          Senza reserveSpace la radice è grande quanto il "+": il livello ha l'ingombro
          del menu aperto ed è spostato perché il suo origin coincida con il centro della radice
        */}
        <div
          className="circle-menu__layer"
          style={
            reserveSpace
              ? undefined
              : {
                  left: CENTER_SIZE / 2 + minX,
                  top: CENTER_SIZE / 2 + minY,
                  width: maxX - minX,
                  height: maxY - minY,
                }
          }
        >
          {/* ---------- Livello blob (decorativo) ---------- */}
          <svg className="circle-menu__defs" aria-hidden="true">
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
              {/*
                La forma si riempie con un colore pieno invece dei colori sfocati: con un blur
                così ampio il browser li calcola a bassa risoluzione e si vedrebbero scalini
              */}
              <feFlood style={{ floodColor: 'var(--ui-bg)' }} result="color" />
              <feComposite in="color" in2="goo" operator="in" />
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000" floodOpacity="0.25" />
            </filter>
          </svg>

          <div
            className="circle-menu__blobs"
            aria-hidden="true"
            style={{ filter: reduceMotion ? undefined : `url(#${CSS.escape(filterId)})` }}
          >
            {items.slice(0, n).map((item, i) =>
              item.items?.map((_, j, all) => {
                const c = childState(i, j, all.length)
                return [
                  !reduceMotion && (
                    <span
                      key={`${i}-${j}-tail`}
                      className="circle-menu__blob circle-menu__blob--tail"
                      style={vars({ ...c, s: c.shown ? TAIL_SCALE : 0.3 }, CHILD_SIZE)}
                    />
                  ),
                  <span
                    key={`${i}-${j}`}
                    className="circle-menu__blob"
                    data-phase={c.phase}
                    style={vars(c, CHILD_SIZE)}
                  />,
                ]
              }),
            )}
            {items.slice(0, n).map((_, i) => {
              const s = itemState(i)
              return [
                !reduceMotion && (
                  <span
                    key={`${i}-tail`}
                    className="circle-menu__blob circle-menu__blob--tail"
                    style={vars({ ...s, s: open ? TAIL_SCALE : 0.4 }, ITEM_SIZE)}
                  />
                ),
                <span key={i} className="circle-menu__blob" data-phase={s.phase} style={vars(s, ITEM_SIZE)} />,
              ]
            })}
            <span
              className="circle-menu__blob circle-menu__blob--center"
              style={vars({ x: 0, y: 0, s: 1, o: 1, delay: 0, phase: 'open' }, CENTER_SIZE)}
            />
          </div>

          {/* ---------- Livello icone (interattivo) ---------- */}
          <div className="circle-menu__icons">
            <button
              ref={triggerRef}
              type="button"
              className="circle-menu__btn circle-menu__btn--center"
              style={vars({ x: 0, y: 0, s: 1, o: 1, delay: 0, phase: open ? 'open' : 'close' }, CENTER_SIZE)}
              data-phase={open ? 'open' : 'close'}
              aria-label={open ? `Close ${label}` : `Open ${label}`}
              aria-expanded={open}
              onClick={() => (open ? closeAll() : setOpen(true))}
            >
              {/* Il "+" ruota e diventa una "×" */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>

            {items.slice(0, n).map((item, i) => {
              const s = itemState(i)
              const hasSub = !!item.items?.length
              const hasPanel = !!panelOf(item)
              return decorate(
                item,
                String(i),
                angleOf(i),
                open,
                sub !== null,
                <button
                  key={i}
                  type="button"
                  className="circle-menu__btn"
                  style={vars(s, ITEM_SIZE)}
                  data-phase={s.phase}
                  aria-label={item.label}
                  aria-hidden={!open}
                  tabIndex={open ? 0 : -1}
                  aria-haspopup={hasSub ? 'menu' : undefined}
                  aria-expanded={hasSub ? sub === i : undefined}
                  data-hidden={!open || undefined}
                  {...hoverProps(String(i))}
                  onClick={() => {
                    if (hasSub) {
                      setHovered(null)
                      setSub(sub === i ? null : i)
                      return
                    }
                    // Il pannello lo apre e chiude il Popover attorno al bottone
                    if (hasPanel) {
                      setHovered(null)
                      return
                    }
                    item.onSelect?.()
                    closeAll(true)
                  }}
                >
                  {item.icon}
                  {/*
                    Ha un sottomenu: freccina sul bordo dell'icona, dal lato da cui usciranno
                    i figli, e rivolta verso di loro. Sparisce quando sono fuori.
                  */}
                  {hasSub && (
                    <span
                      className="circle-menu__more"
                      aria-hidden="true"
                      data-off={sub === i || undefined}
                      style={{
                        left: ITEM_SIZE / 2 + polar(MORE_OFFSET, angleOf(i)).x - MORE_SIZE / 2,
                        top: ITEM_SIZE / 2 + polar(MORE_OFFSET, angleOf(i)).y - MORE_SIZE / 2,
                        rotate: `${angleOf(i)}deg`,
                      }}
                    >
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 3 7.5 6l-3 3" />
                      </svg>
                    </span>
                  )}
                </button>,
              )
            })}

            {items.slice(0, n).map((item, i) =>
              item.items?.map((child, j, all) => {
                const c = childState(i, j, all.length)
                const hasPanel = !!panelOf(child)
                return decorate(
                  child,
                  `${i}-${j}`,
                  angleOf(i) + (j - (all.length - 1) / 2) * subArc(all.length).step,
                  c.shown,
                  false,
                  <button
                    key={`${i}-${j}`}
                    type="button"
                    className="circle-menu__btn circle-menu__btn--child"
                    style={vars(c, CHILD_SIZE)}
                    data-phase={c.phase}
                    aria-label={child.label}
                    aria-hidden={!c.shown}
                    tabIndex={c.shown ? 0 : -1}
                    data-hidden={!c.shown || undefined}
                    {...hoverProps(`${i}-${j}`)}
                    // Scelta fatta: tutto rientra nel centro
                    onClick={() => {
                      if (hasPanel) return setHovered(null)
                      child.onSelect?.()
                      closeAll(true)
                    }}
                  >
                    {child.icon}
                  </button>,
                )
              }),
            )}
          </div>
        </div>
      </div>
    </GloopMotionProvider>
  )
}

export default CircleMenu
