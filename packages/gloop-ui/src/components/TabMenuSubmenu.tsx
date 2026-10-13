import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Transition,
  type Variants,
} from 'motion/react'
import GooPill from './GooPill'
import { GooFilter } from './goo'
import { pressed, tabDrop } from './tab-drop'
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
}

const TAB_WIDTH = 68
const TRIGGER_SIZE = 52
const DRIP_SIZE = 28
// Devono combaciare con altezza e gap delle voci in TabMenuSubmenu.css
const ITEM_HEIGHT = 40
const ITEM_GAP = 2

const morph: Transition = { type: 'spring', duration: 0.5, bounce: 0.25 }
const exitFast: Transition = { duration: 0.12, ease: 'easeOut' }

// Il contenuto del sottomenu scorre nella direzione del tab scelto
const slide: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24, filter: 'blur(4px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -24,
    filter: 'blur(4px)',
    transition: exitFast,
  }),
}

function TabMenuSubmenu({ icon, label, tabs }: TabMenuSubmenuProps) {
  const [open, setOpen] = useState(false)
  // Nessun tab selezionato all'apertura
  const [active, setActive] = useState<number | null>(null)
  const [submenu, setSubmenu] = useState<number | null>(null)
  const [direction, setDirection] = useState(0)
  const [hovered, setHovered] = useState<number | null>(null)
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
    if (submenu !== null && submenu !== i) setDirection(Math.sign(i - submenu))
    setHovered(null)
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

  return (
    <MotionConfig transition={morph} reducedMotion="user">
      {/* Filtro goo su barra, pannello e gocce: si fondono come liquido */}
      <div
        ref={rootRef}
        className="tab-menu-submenu"
        style={{ filter: `url(#${CSS.escape(filterId)})` }}
      >
        {/* Area ampia: il pannello sta sopra la barra, fuori dal suo riquadro */}
        <GooFilter
          id={filterId}
          region={{ x: -80, y: -280, width: tabs.length * TAB_WIDTH + TRIGGER_SIZE + 160, height: 400 }}
        />

        {/* Goccia che sale dal tab al pannello quando si apre un sottomenu */}
        <AnimatePresence>
          {open && submenu !== null && (
            <motion.span
              key={submenu}
              className="goo-drop"
              aria-hidden="true"
              style={{
                left: submenu * TAB_WIDTH + TAB_WIDTH / 2 - DRIP_SIZE / 2,
                top: 0,
                width: DRIP_SIZE,
                height: DRIP_SIZE,
              }}
              initial={{ y: 0, scale: 0.6 }}
              animate={{
                y: [0, -26, -42],
                scale: [0.6, 1, 0.2],
                transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] },
              }}
              exit={{ y: 0, scale: 0.4, transition: exitFast }}
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
              style={{
                borderRadius: 20,
                transformOrigin: `${submenu! * TAB_WIDTH + TAB_WIDTH / 2}px 100%`,
              }}
              // Come una goccia: parte stretta e schiacciata sul tab, poi si allarga
              initial={{ opacity: 0, scaleX: 0.4, scaleY: 0.3, y: 16 }}
              animate={{
                opacity: 1,
                scaleX: 1,
                scaleY: 1,
                y: 0,
                transition: { ...morph, opacity: { duration: 0.12 } },
              }}
              exit={{
                opacity: 0,
                scaleX: 0.4,
                scaleY: 0.3,
                y: 16,
                transition: exitFast,
              }}
            >
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div
                  key={submenu}
                  layout="position"
                  className="tab-menu-submenu__list-wrap"
                  custom={direction}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  onPointerLeave={() => setHovered(null)}
                >
                  {/* Stessa pillola liquida della tabbar, in verticale, che segue il cursore */}
                  <AnimatePresence>
                    {hovered !== null && (
                      <GooPill
                        index={hovered}
                        step={ITEM_HEIGHT + ITEM_GAP}
                        length={ITEM_HEIGHT}
                        inset={0}
                        axis="y"
                        radius={14}
                        opacity={0.1}
                      />
                    )}
                  </AnimatePresence>
                  <ul className="tab-menu-submenu__list">
                    {items.map((item, i) => (
                      <li key={item}>
                        <motion.button
                          type="button"
                          role="menuitem"
                          className="tab-menu-submenu__item"
                          onClick={() => {
                            close()
                            triggerRef.current?.focus()
                          }}
                          onPointerEnter={() => setHovered(i)}
                          onFocus={() => setHovered(i)}
                          onBlur={() => setHovered(null)}
                          whileTap={{ scale: 0.97 }}
                        >
                          {item}
                        </motion.button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          layout
          className="tab-menu-motion"
          style={{ borderRadius: 26 }}
        >
          <div id={barId} className="tab-menu-motion__tabs">
            <AnimatePresence initial={false}>
              {open && active !== null && <GooPill index={active} step={68} />}
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
                    {...tabDrop(i, tabs.length)}
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
