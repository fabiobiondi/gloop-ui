import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
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
import {
  TAB_HEIGHT,
  TAB_WIDTH,
  TRIGGER_SIZE,
  isVertical,
  pressed,
  tabDrop,
  visualIndex,
  type TabMenuDirection,
} from './tab-drop'
import './theme.css'
import './TabMenuMotion.css'
import './TabMenuSubmenu.css'

export type Tab = {
  icon: ReactNode
  label: string
  items?: string[]
}

export type TabMenuSubmenuProps = {
  icon: ReactNode
  label: string
  tabs: Tab[]
  /**
   * Lato del "+" da cui esce la barra. left/right: barra orizzontale, sottomenu sopra;
   * top/bottom: colonna sopra/sotto, sottomenu a destra del tab
   */
  direction?: TabMenuDirection
}

const DRIP_SIZE = 28
/** Distanza tra barra e pannello: oltre ~12px il filtro goo non li fonde da fermi */
const PANEL_GAP = 14
const PANEL_WIDTH = 200

const morph: Transition = { type: 'spring', duration: 0.5, bounce: 0.25 }
const exitFast: Transition = { duration: 0.12, ease: 'easeOut' }

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

function TabMenuSubmenu({ icon, label, tabs, direction = 'left' }: TabMenuSubmenuProps) {
  const vertical = isVertical(direction)
  const [open, setOpen] = useState(false)
  // Nessun tab selezionato all'apertura
  const [active, setActive] = useState<number | null>(null)
  const [submenu, setSubmenu] = useState<number | null>(null)
  const [slideDir, setDirection] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const barId = useId()
  const submenuId = useId()
  const filterId = useId()

  function close() {
    setOpen(false)
    setSubmenu(null)
  }

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
   * Geometria del tab che apre il sottomenu, rispetto all'angolo della barra.
   * In riga il pannello sta sopra tutta la barra; in colonna a destra, all'altezza del tab.
   */
  const n = tabs.length
  const v = submenu !== null ? visualIndex(submenu, n, direction) : 0
  const tabStart = vertical
    ? (direction === 'bottom' ? TRIGGER_SIZE : 0) + v * TAB_HEIGHT
    : (direction === 'right' ? TRIGGER_SIZE : 0) + v * TAB_WIDTH
  const drip = vertical
    ? {
        style: { left: TAB_WIDTH / 2 - DRIP_SIZE / 2, top: tabStart + TAB_HEIGHT / 2 - DRIP_SIZE / 2 },
        to: { x: [0, 30, 48] },
      }
    : { style: { left: tabStart + TAB_WIDTH / 2 - DRIP_SIZE / 2, top: 0 }, to: { y: [0, -26, -42] } }
  const panelStyle = vertical
    ? { top: tabStart, width: PANEL_WIDTH, transformOrigin: `0px ${TAB_HEIGHT / 2}px` }
    : { transformOrigin: `${tabStart + TAB_WIDTH / 2}px 100%` }
  // Il pannello parte schiacciato verso il tab
  const panelFrom = vertical ? { x: -16, y: 0 } : { x: 0, y: 16 }
  const region = vertical
    ? { x: -80, y: -120, width: TAB_WIDTH + PANEL_GAP + PANEL_WIDTH + 160, height: (n + 1) * TAB_HEIGHT + 440 }
    : { x: -80, y: -280, width: n * TAB_WIDTH + TRIGGER_SIZE + 160, height: 400 }

  return (
    <MotionConfig transition={morph} reducedMotion="user">
      {/* Filtro goo su barra, pannello e gocce: si fondono come liquido */}
      <div
        ref={rootRef}
        className="tab-menu-submenu"
        data-direction={direction}
        style={{ filter: `url(#${CSS.escape(filterId)})` }}
      >
        {/* Area ampia: il pannello sta sopra la barra, fuori dal suo riquadro */}
        <GooFilter id={filterId} region={region} />

        {/* Goccia che sale dal tab al pannello quando si apre un sottomenu */}
        <AnimatePresence>
          {open && submenu !== null && (
            <motion.span
              key={submenu}
              className="goo-drop"
              aria-hidden="true"
              style={{ ...drip.style, width: DRIP_SIZE, height: DRIP_SIZE }}
              initial={{ x: 0, y: 0, scale: 0.6 }}
              animate={{
                ...drip.to,
                scale: [0.6, 1, 0.2],
                transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] },
              }}
              exit={{ x: 0, y: 0, scale: 0.4, transition: exitFast }}
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
                    items={items.map((item) => ({ id: item, label: item }))}
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
            <AnimatePresence initial={false}>
              {open && active !== null && (
                <GooPill
                  index={visualIndex(active, n, direction)}
                  step={vertical ? TAB_HEIGHT : TAB_WIDTH}
                  axis={vertical ? 'y' : 'x'}
                />
              )}
            </AnimatePresence>
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
