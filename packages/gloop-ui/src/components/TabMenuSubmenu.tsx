import { useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Transition,
  type Variants,
} from 'motion/react'
import GooPill from './GooPill'
import ListCore from './list/ListCore'
import { GooFilter } from './goo'
import { BoundaryContext } from './floating/boundary-context'
import { availableArea, pickSide, resolveDirection, type Box, type TabMenuPlacement } from './tab-placement'
import {
  TAB_HEIGHT,
  TAB_WIDTH,
  TRIGGER_SIZE,
  barFilterRegion,
  isVertical,
  pressed,
  tabDrop,
  visualIndex,
  type TabMenuDirection,
} from './tab-drop'
import './theme.css'
import './TabMenuMotion.css'
import './TabMenuSubmenu.css'

/** Voce del sottomenu: solo testo, o testo con icona opzionale */
export type SubmenuItem = string | { label: string; icon?: ReactNode }

export type Tab = {
  icon: ReactNode
  label: string
  items?: SubmenuItem[]
}

export type TabMenuSubmenuProps = {
  icon: ReactNode
  label: string
  tabs: Tab[]
  /**
   * Lato del "+" da cui esce la barra. left/right: barra orizzontale, sottomenu sopra;
   * top/bottom: colonna sopra/sotto, sottomenu a destra del tab.
   * 'auto': all'apertura il primo lato in cui entra (left, right, top, bottom)
   */
  direction?: TabMenuPlacement
  /**
   * true: la goccia resta tra tab e sottomenu, come un collo che li tiene uniti.
   * false: niente goccia, il sottomenu compare separato senza fondersi col tab
   */
  attached?: boolean
}

const DRIP_SIZE = 28
/** Distanza tra barra e pannello: oltre ~12px il filtro goo non li fonde da fermi */
const PANEL_GAP = 14
const PANEL_WIDTH = 200
/*
 * La goccia resta ferma nello spazio tra barra e pannello, un po' sovrapposta a entrambi:
 * il filtro goo la fonde con loro in un "collo" liquido e il pannello sembra attaccato al tab.
 * 28 × 0.75 = 21px > 14px di spazio: sporge di ~3.5px per lato.
 */
const NECK_SCALE = 0.75
// Altezza stimata del pannello (misure di ListCore e padding del pannello), per scegliere il lato
const ITEM_HEIGHT = 40
const ITEM_GAP = 2
const PANEL_PADDING = 6
const panelHeight = (count: number) => PANEL_PADDING * 2 + count * ITEM_HEIGHT + Math.max(0, count - 1) * ITEM_GAP

const morph: Transition = { type: 'spring', duration: 0.5, bounce: 0.25 }
const exitFast: Transition = { duration: 0.12, ease: 'easeOut' }

/*
 * Uscita della goccia. Se si chiude solo il sottomenu torna nel tab; se si chiude tutta
 * la barra sparisce subito: la sua posizione è relativa all'angolo della barra, che si
 * restringe fino al "+", e durante l'uscita resterebbe fuori, oltre il "+".
 */
const dropVariants: Variants = {
  gone: (barOpen: boolean) =>
    barOpen ? { x: 0, y: 0, scale: 0.4, transition: exitFast } : { opacity: 0, transition: { duration: 0 } },
}

// Il contenuto del sottomenu scorre nella direzione del tab scelto (in colonna, in verticale)
type Slide = { dir: number; axis: 'x' | 'y' }
const shift = ({ axis }: Slide, value: number) => (axis === 'y' ? { y: value } : { x: value })
const slide: Variants = {
  enter: (s: Slide) => ({ opacity: 0, ...shift(s, s.dir * 24), filter: 'blur(4px)' }),
  center: { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' },
  exit: (s: Slide) => ({
    opacity: 0,
    ...shift(s, s.dir * -24),
    filter: 'blur(4px)',
    transition: exitFast,
  }),
}

function TabMenuSubmenu({ icon, label, tabs, direction: placement = 'left', attached = true }: TabMenuSubmenuProps) {
  const [open, setOpen] = useState(false)
  // Nessun tab selezionato all'apertura
  const [active, setActive] = useState<number | null>(null)
  const [submenu, setSubmenu] = useState<number | null>(null)
  const [slideDir, setDirection] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  // direction="auto": il lato si sceglie all'apertura, misurando lo spazio attorno al "+"
  const [autoSide, setAutoSide] = useState<TabMenuDirection>('left')
  const direction = placement === 'auto' ? autoSide : placement
  const boundaryRef = useContext(BoundaryContext)
  const chooseSide = () => {
    if (placement === 'auto')
      setAutoSide(resolveDirection('auto', triggerRef.current, boundaryRef?.current, tabs.length, 'morph'))
  }
  const vertical = isVertical(direction)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const barId = useId()
  const submenuId = useId()
  const filterId = useId()

  function close() {
    setOpen(false)
    setSubmenu(null)
  }

  /*
   * Dove sta il tab i lungo la barra, rispetto al suo angolo: in riga il pannello
   * copre tutta la barra, in colonna si allinea al tab.
   */
  const tabStartOf = (i: number) => {
    const v = visualIndex(i, tabs.length, direction)
    return vertical
      ? (direction === 'bottom' ? TRIGGER_SIZE : 0) + v * TAB_HEIGHT
      : (direction === 'right' ? TRIGGER_SIZE : 0) + v * TAB_WIDTH
  }

  /*
   * Sottomenu girato sul lato opposto se non c'è spazio: in riga sotto la barra invece
   * che sopra, in colonna a sinistra invece che a destra. Si misura la barra aperta
   * e l'area disponibile (FloatingBoundary più vicino o viewport).
   */
  const [flipped, setFlipped] = useState(false)
  function shouldFlip(i: number) {
    const bar = rootRef.current?.getBoundingClientRect()
    if (!bar) return false
    const h = panelHeight(tabs[i].items?.length ?? 0)
    const top = bar.top + tabStartOf(i)
    const footprint = (side: 'near' | 'far'): Box =>
      vertical
        ? side === 'near'
          ? { left: bar.right, right: bar.right + PANEL_GAP + PANEL_WIDTH, top, bottom: top + h }
          : { left: bar.left - PANEL_GAP - PANEL_WIDTH, right: bar.left, top, bottom: top + h }
        : side === 'near'
          ? { left: bar.left, right: bar.right, top: bar.top - PANEL_GAP - h, bottom: bar.top }
          : { left: bar.left, right: bar.right, top: bar.bottom, bottom: bar.bottom + PANEL_GAP + h }
    return pickSide(['near', 'far'] as const, footprint, availableArea(boundaryRef?.current)) === 'far'
  }

  // Mentre il sottomenu è aperto il lato si ricalcola con scroll (anche nei contenitori) e resize
  useEffect(() => {
    if (submenu === null) return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setFlipped(shouldFlip(submenu)))
    }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  })

  function onTabClick(i: number) {
    setActive(i)
    // Tab senza sottomenu: scelta fatta, si chiude tutto
    if (!tabs[i].items?.length) {
      close()
      triggerRef.current?.focus()
      return
    }
    if (submenu !== null && submenu !== i) {
      // Verso visivo: in colonna con 'top' l'ordine è rovesciato
      const n = tabs.length
      setDirection(Math.sign(visualIndex(i, n, direction) - visualIndex(submenu, n, direction)))
    }
    if (submenu !== i) setFlipped(shouldFlip(i))
    setSubmenu(submenu === i ? null : i)
  }

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      // Esc chiude prima il sottomenu, poi la barra
      if (submenu !== null) {
        tabRefs.current[submenu]?.focus()
        setSubmenu(null)
      } else {
        close()
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, submenu])

  const items = submenu !== null ? tabs[submenu].items : undefined

  /*
   * Geometria del sottomenu aperto, rispetto all'angolo della barra.
   * Lato del pannello: in riga sopra (o sotto, se girato), in colonna a destra (o a sinistra).
   */
  const n = tabs.length
  const tabStart = submenu !== null ? tabStartOf(submenu) : 0
  const panelSide = vertical ? (flipped ? 'left' : 'right') : flipped ? 'bottom' : 'top'
  // Verso che va dalla barra al pannello, sull'asse del pannello
  const away = panelSide === 'top' || panelSide === 'left' ? -1 : 1
  /*
   * La goccia parte dentro il tab, schizza un po' oltre il centro dello spazio
   * tra barra e pannello e torna lì, dove resta come collo liquido.
   */
  const neck = vertical
    ? away * (TAB_WIDTH / 2 + PANEL_GAP / 2) // dal centro della colonna al centro dello spazio
    : away * (PANEL_GAP / 2 + DRIP_SIZE / 2) // dal bordo della barra al centro dello spazio
  const overshoot = neck + away * 8
  const drip = vertical
    ? {
        style: { left: TAB_WIDTH / 2 - DRIP_SIZE / 2, top: tabStart + TAB_HEIGHT / 2 - DRIP_SIZE / 2 },
        to: { x: [0, overshoot, neck] },
      }
    : {
        // Parte dal bordo della barra rivolto verso il pannello
        style: { left: tabStart + TAB_WIDTH / 2 - DRIP_SIZE / 2, top: flipped ? TAB_HEIGHT - DRIP_SIZE : 0 },
        to: { y: [0, overshoot, neck] },
      }
  // Il pannello si gonfia dal punto più vicino al tab
  const panelStyle = vertical
    ? { top: tabStart, width: PANEL_WIDTH, transformOrigin: `${flipped ? PANEL_WIDTH : 0}px ${TAB_HEIGHT / 2}px` }
    : { transformOrigin: `${tabStart + TAB_WIDTH / 2}px ${flipped ? '0%' : '100%'}` }
  /*
   * Unito: il pannello parte schiacciato verso il tab. Staccato: arriva da più lontano,
   * così non si avvicina mai abbastanza alla barra da fondersi col goo
   */
  const panelShift = attached ? -away * 16 : away * 10
  const panelFrom = vertical ? { x: panelShift, y: 0 } : { x: 0, y: panelShift }
  // Area del filtro goo: simmetrica attorno al "+" (vedi barFilterRegion), con spazio per il pannello
  const longest = Math.max(0, ...tabs.map((t) => t.items?.length ?? 0))
  const region = barFilterRegion(n, PANEL_GAP + Math.max(PANEL_WIDTH, panelHeight(longest)) + 60)

  return (
    <MotionConfig transition={morph} reducedMotion="user">
      {/* Filtro goo su barra, pannello e gocce: si fondono come liquido */}
      <div
        ref={rootRef}
        className="tab-menu-submenu"
        data-direction={direction}
        data-panel={panelSide}
        style={{ filter: `url(#${CSS.escape(filterId)})` }}
      >
        {/* Area ampia: il pannello sta sopra la barra, fuori dal suo riquadro */}
        <GooFilter id={filterId} region={region} />

        {/* Goccia che sale dal tab al pannello e resta tra i due come un collo liquido */}
        <AnimatePresence custom={open}>
          {attached && open && submenu !== null && (
            <motion.span
              key={submenu}
              className="goo-drop"
              aria-hidden="true"
              style={{ ...drip.style, width: DRIP_SIZE, height: DRIP_SIZE }}
              initial={{ x: 0, y: 0, scale: 0.6 }}
              animate={{
                ...drip.to,
                scale: [0.6, 1, NECK_SCALE],
                transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] },
              }}
              variants={dropVariants}
              exit="gone"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {items && (
            <motion.div
              id={submenuId}
              role="menu"
              layout
              className="tab-menu-submenu__panel"
              // Il pannello nasce dal tab che lo ha aperto
              style={{ borderRadius: 20, ...panelStyle }}
              // Come una goccia: parte stretta e schiacciata sul tab, poi si allarga
              initial={{ opacity: 0, scaleX: 0.4, scaleY: 0.3, ...panelFrom }}
              animate={{
                opacity: 1,
                scaleX: 1,
                scaleY: 1,
                x: 0,
                y: 0,
                transition: { ...morph, opacity: { duration: 0.12 } },
              }}
              exit={{
                opacity: 0,
                scaleX: 0.4,
                scaleY: 0.3,
                ...panelFrom,
                transition: exitFast,
              }}
            >
              <AnimatePresence mode="popLayout" initial={false} custom={{ dir: slideDir, axis: vertical ? 'y' : 'x' }}>
                <motion.div
                  key={submenu}
                  layout="position"
                  className="tab-menu-submenu__list-wrap"
                  custom={{ dir: slideDir, axis: vertical ? 'y' : 'x' }}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {/* Stesse voci di List, con la pillola liquida che segue il cursore */}
                  <ListCore
                    items={items.map((item) =>
                      typeof item === 'string' ? { id: item, label: item } : { id: item.label, ...item },
                    )}
                    hover
                    // Qui la pillola è l'unico indicatore: più marcata che in List
                    hoverOpacity={0.1}
                    itemRole="menuitem"
                    onItemClick={() => {
                      close()
                      triggerRef.current?.focus()
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          layout
          className="tab-menu-motion"
          data-direction={direction}
          style={{ borderRadius: 26 }}
        >
          <div id={barId} className="tab-menu-motion__tabs">
            {/* Niente uscita animata: chiudendo, la barra scalata la stirerebbe (vedi tabDrop) */}
            {open && active !== null && (
              <GooPill
                index={visualIndex(active, n, direction)}
                step={vertical ? TAB_HEIGHT : TAB_WIDTH}
                axis={vertical ? 'y' : 'x'}
              />
            )}
            <AnimatePresence mode="popLayout" initial={false}>
              {open &&
                tabs.map((tab, i) => (
                  <motion.button
                    key={tab.label}
                    ref={(el) => {
                      tabRefs.current[i] = el
                    }}
                    layout="position"
                    type="button"
                    className="tab-menu-motion__tab"
                    aria-pressed={active === i}
                    aria-haspopup={tab.items?.length ? 'menu' : undefined}
                    aria-expanded={tab.items?.length ? submenu === i : undefined}
                    aria-controls={submenu === i ? submenuId : undefined}
                    onClick={() => onTabClick(i)}
                    {...tabDrop(i, tabs.length, direction)}
                    // La pressione scala solo il contenuto: un transform sul bottone porterebbe
                    // la goccia (z-index -1) sopra la pillola, come un cerchio scuro
                    whileTap="pressed"
                  >
                    <span className="tab-menu-motion__drop" aria-hidden="true" />
                    <motion.span className="tab-menu-motion__tab-content" variants={pressed}>
                      <span className="tab-menu-motion__tab-icon" aria-hidden="true">
                        {tab.icon}
                      </span>
                      <span className="tab-menu-motion__tab-label">{tab.label}</span>
                    </motion.span>
                  </motion.button>
                ))}
            </AnimatePresence>
          </div>

          <motion.button
            ref={triggerRef}
            layout="position"
            type="button"
            className="tab-menu-motion__trigger"
            aria-label={label}
            aria-expanded={open}
            aria-controls={barId}
            onClick={() => {
              if (open) return close()
              setActive(null)
              chooseSide()
              setOpen(true)
            }}
            whileTap={{ scale: 0.92 }}
          >
            <motion.span
              className="tab-menu-motion__trigger-icon"
              aria-hidden="true"
              animate={{ rotate: open ? 45 : 0 }}
            >
              {icon}
            </motion.span>
          </motion.button>
        </motion.div>
      </div>
    </MotionConfig>
  )
}

export default TabMenuSubmenu
