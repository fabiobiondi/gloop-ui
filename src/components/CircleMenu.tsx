import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { MotionConfig, motion, useReducedMotion, type Variants } from 'motion/react'
import './theme.css'
import './CircleMenu.css'

export type CircleMenuItem = {
  icon: ReactNode
  label: string
  onSelect?: () => void
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

type CircleMenuProps = {
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
   * le icone non si tocchino (mai sotto 68 fino a 3 icone, 76 oltre)
   */
  radius?: number
  /** Distanza delle icone del sottomenu dalla loro icona, in px */
  subRadius?: number
}

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

// Apertura: molla elastica che "schizza" fuori. Chiusura: più rapida, poco rimbalzo.
const openSpring = { type: 'spring', stiffness: 300, damping: 17, mass: 0.9 } as const
const closeSpring = { type: 'spring', stiffness: 420, damping: 32 } as const
const hoverSpring = { type: 'spring', stiffness: 420, damping: 18 } as const
/*
 * Come nella GooPill della tabbar: ogni blob ha una "coda" che insegue la testa con una
 * molla più lenta. Il filtro goo le fonde: in movimento la goccia si allunga verso
 * il centro, da ferma la coda torna sotto la testa.
 */
const tailSpring = { type: 'spring', stiffness: 170, damping: 20 } as const
const TAIL_SCALE = 0.8

// Il centro si "strizza" quando lancia fuori le icone, e sussulta quando le riassorbe
const centerVariants: Variants = {
  closed: { scale: [1, 0.9, 1], transition: { duration: 0.3 } },
  open: { scale: [1, 0.84, 1.08, 1], transition: { duration: 0.45, ease: 'easeOut' } },
}

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
}: CircleMenuProps) {
  const [open, setOpen] = useState(false)
  const [sub, setSub] = useState<number | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const filterId = useId()
  const reduceMotion = useReducedMotion()

  const n = Math.min(items.length, 6)

  /*
   * Cerchio o arco: con un cerchio le icone partono dall'alto e si dividono 360°;
   * con un arco si distribuiscono da un estremo all'altro, centrate sulla direzione.
   */
  const center = angle ?? (direction ? DIRECTION_ANGLE[direction] : -90)
  const span = arc ?? (angle === undefined && !direction ? 360 : direction?.includes('-') ? 90 : 180)
  const full = span >= 360
  const step = full ? 360 / n : n > 1 ? span / (n - 1) : 0
  const angleOf = (i: number) => (full ? center + i * step : center - span / 2 + i * step)

  // Raggio minimo perché due icone vicine non si tocchino (archi stretti → più lontane)
  const minRadius = n > 1 && step > 0 ? (ITEM_SIZE + ITEM_GAP) / (2 * Math.sin(rad(Math.min(step, 180) / 2))) : 0
  const r = radius ?? Math.max(n <= 3 ? 68 : 76, Math.ceil(minRadius))

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
    setHovered(null)
    if (focusTrigger) triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) closeAll()
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      // Esc chiude prima il sottomenu, poi tutto
      if (sub !== null) setSub(null)
      else closeAll(true)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, sub])

  /* ---------- Posizioni e transizioni (condivise dai due livelli) ---------- */

  function itemState(i: number) {
    const p = polar(r, angleOf(i))
    const key = String(i)
    const scale = !open
      ? 0.4
      : sub !== null && sub !== i
        ? 0.8 // con un sottomenu aperto, le altre icone si fanno da parte
        : hovered === key
          ? 1.12
          : 1
    const delay = open ? i * 0.035 : (n - 1 - i) * 0.02
    const move = open ? { ...openSpring, delay } : { ...closeSpring, delay }
    return {
      target: { x: open ? p.x : 0, y: open ? p.y : 0, scale },
      transition: { x: move, y: move, scale: hoverSpring, opacity: { duration: open ? 0.2 : 0.1 } },
    }
  }

  function childState(i: number, j: number, m: number) {
    const parent = polar(r, angleOf(i))
    const { dist, step: subStep } = subArc(m)
    const offset = (j - (m - 1) / 2) * subStep
    const p = polar(dist, angleOf(i) + offset)
    const shown = open && sub === i
    const key = `${i}-${j}`
    // Da nascosti, i figli stanno dentro il genitore (o dentro il centro se tutto è chiuso)
    const home = open ? parent : { x: 0, y: 0 }
    const delay = shown ? j * 0.03 : 0
    const move = shown ? { ...openSpring, delay } : closeSpring
    return {
      shown,
      target: {
        x: shown ? parent.x + p.x : home.x,
        y: shown ? parent.y + p.y : home.y,
        scale: shown ? (hovered === key ? 1.12 : 1) : 0.3,
      },
      transition: { x: move, y: move, scale: hoverSpring, opacity: { duration: shown ? 0.2 : 0.08 } },
    }
  }


  // La coda parte insieme alla testa (stesso ritardo) ma con la molla lenta
  function tailTransition(t: { x: object }) {
    const move = { ...tailSpring, delay: 'delay' in t.x ? (t.x.delay as number) : 0 }
    return { x: move, y: move, scale: tailSpring }
  }

  const hoverProps = (key: string) => ({
    onPointerEnter: () => setHovered(key),
    onPointerLeave: () => setHovered((h) => (h === key ? null : h)),
    onFocus: () => setHovered(key),
    onBlur: () => setHovered((h) => (h === key ? null : h)),
  })

  const blobStyle = (s: number) => ({ width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2 })

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={rootRef}
        className="circle-menu"
        style={
          {
            width: maxX - minX,
            height: maxY - minY,
            '--origin-x': `${-minX}px`,
            '--origin-y': `${-minY}px`,
          } as CSSProperties
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
                  <motion.span
                    key={`${i}-${j}-tail`}
                    className="circle-menu__blob"
                    style={blobStyle(CHILD_SIZE)}
                    initial={false}
                    animate={{ ...c.target, scale: c.shown ? TAIL_SCALE : 0.3 }}
                    transition={tailTransition(c.transition)}
                  />
                ),
                <motion.span
                  key={`${i}-${j}`}
                  className="circle-menu__blob"
                  style={blobStyle(CHILD_SIZE)}
                  initial={false}
                  animate={c.target}
                  transition={c.transition}
                />,
              ]
            }),
          )}
          {items.slice(0, n).map((_, i) => {
            const s = itemState(i)
            return [
              !reduceMotion && (
                <motion.span
                  key={`${i}-tail`}
                  className="circle-menu__blob"
                  style={blobStyle(ITEM_SIZE)}
                  initial={false}
                  animate={{ ...s.target, scale: open ? TAIL_SCALE : 0.4 }}
                  transition={tailTransition(s.transition)}
                />
              ),
              <motion.span
                key={i}
                className="circle-menu__blob"
                style={blobStyle(ITEM_SIZE)}
                initial={false}
                animate={s.target}
                transition={s.transition}
              />,
            ]
          })}
          <motion.span
            className="circle-menu__blob"
            style={blobStyle(CENTER_SIZE)}
            variants={centerVariants}
            initial={false}
            animate={open ? 'open' : 'closed'}
          />
        </div>

        {/* ---------- Livello icone (interattivo) ---------- */}
        <div className="circle-menu__icons">
          <motion.button
            ref={triggerRef}
            type="button"
            className="circle-menu__btn circle-menu__btn--center"
            style={blobStyle(CENTER_SIZE)}
            aria-label={open ? `Close ${label}` : `Open ${label}`}
            aria-expanded={open}
            variants={centerVariants}
            initial={false}
            animate={open ? 'open' : 'closed'}
            whileTap={{ scale: 0.9 }}
            onClick={() => (open ? closeAll() : setOpen(true))}
          >
            {/* Il "+" ruota e diventa una "×" */}
            <motion.svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              initial={false}
              animate={{ rotate: open ? 135 : 0 }}
              transition={open ? openSpring : closeSpring}
            >
              <path d="M12 5v14M5 12h14" />
            </motion.svg>
          </motion.button>

          {items.slice(0, n).map((item, i) => {
            const s = itemState(i)
            const hasSub = !!item.items?.length
            return (
              <motion.button
                key={i}
                type="button"
                className="circle-menu__btn"
                style={blobStyle(ITEM_SIZE)}
                aria-label={item.label}
                aria-hidden={!open}
                tabIndex={open ? 0 : -1}
                aria-haspopup={hasSub ? 'menu' : undefined}
                aria-expanded={hasSub ? sub === i : undefined}
                data-hidden={!open || undefined}
                initial={false}
                animate={{ ...s.target, opacity: open ? 1 : 0 }}
                transition={s.transition}
                whileTap={{ scale: 0.9 }}
                {...hoverProps(String(i))}
                onClick={() => {
                  if (hasSub) {
                    setHovered(null)
                    setSub(sub === i ? null : i)
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
                  <motion.span
                    className="circle-menu__more"
                    aria-hidden="true"
                    style={{
                      left: ITEM_SIZE / 2 + polar(MORE_OFFSET, angleOf(i)).x - MORE_SIZE / 2,
                      top: ITEM_SIZE / 2 + polar(MORE_OFFSET, angleOf(i)).y - MORE_SIZE / 2,
                      rotate: angleOf(i),
                    }}
                    initial={false}
                    animate={{ opacity: sub === i ? 0 : 1, scale: sub === i ? 0.5 : 1 }}
                    transition={hoverSpring}
                  >
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 3 7.5 6l-3 3" />
                    </svg>
                  </motion.span>
                )}
              </motion.button>
            )
          })}

          {items.slice(0, n).map((item, i) =>
            item.items?.map((child, j, all) => {
              const c = childState(i, j, all.length)
              return (
                <motion.button
                  key={`${i}-${j}`}
                  type="button"
                  className="circle-menu__btn circle-menu__btn--child"
                  style={blobStyle(CHILD_SIZE)}
                  aria-label={child.label}
                  aria-hidden={!c.shown}
                  tabIndex={c.shown ? 0 : -1}
                  data-hidden={!c.shown || undefined}
                  initial={false}
                  animate={{ ...c.target, opacity: c.shown ? 1 : 0 }}
                  transition={c.transition}
                  whileTap={{ scale: 0.9 }}
                  {...hoverProps(`${i}-${j}`)}
                  // Scelta fatta: tutto rientra nel centro
                  onClick={() => {
                    child.onSelect?.()
                    closeAll(true)
                  }}
                >
                  {child.icon}
                </motion.button>
              )
            }),
          )}
        </div>
      </div>
    </MotionConfig>
  )
}

export default CircleMenu
