import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  AnimatePresence,
  MotionConfig,
  motion,
  stagger,
  type Transition,
  type Variants,
} from 'motion/react'
import GooPill from './GooPill'
import { GooFilter } from './goo'
import type { TabMenuDirection } from './tab-drop'
import './theme.css'
import './TabMenuMotion.css'
import './TabMenu.css'

export type Tab = {
  icon: ReactNode
  label: string
}

export type TabMenuProps = {
  icon: ReactNode
  label: string
  tabs: Tab[]
  /** Lato del "+" su cui compare la barra (sempre orizzontale): sopra, sotto o di fianco */
  direction?: TabMenuDirection
}

const spring: Transition = { type: 'spring', duration: 0.5, bounce: 0.3 }

const TAB_WIDTH = 68
const TRIGGER_SIZE = 52
const DRIP_SIZE = 32

/*
 * Verso in cui la barra si allontana dal "+": asse e segno.
 * top: sale, bottom: scende, left/right: si sposta di lato.
 */
const AWAY: Record<TabMenuDirection, { axis: 'x' | 'y'; sign: 1 | -1 }> = {
  top: { axis: 'y', sign: -1 },
  bottom: { axis: 'y', sign: 1 },
  left: { axis: 'x', sign: -1 },
  right: { axis: 'x', sign: 1 },
}

const along = (d: TabMenuDirection, value: number) => (AWAY[d].axis === 'y' ? { y: value } : { x: value })

/*
 * La barra esce dal "+" come una goccia: parte stretta e schiacciata contro il
 * trigger (attaccata a lui grazie al filtro goo), si allontana allargandosi e si stacca.
 * I tab entrano a cascata. In chiusura viene risucchiata, più in fretta.
 */
function barVariants(d: TabMenuDirection): Variants {
  // Da nascosta sta 52px più vicina al "+"
  const tucked = along(d, -AWAY[d].sign * 52)
  return {
    hidden: { opacity: 0, scaleX: 0.25, scaleY: 0.6, ...tucked },
    visible: {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      ...along(d, 0),
      transition: {
        ...spring,
        opacity: { duration: 0.1 },
        delayChildren: stagger(0.04, { startDelay: 0.06 }),
      },
    },
    exit: {
      opacity: 0,
      scaleX: 0.25,
      scaleY: 0.6,
      ...tucked,
      transition: {
        type: 'spring',
        stiffness: 520,
        damping: 40,
        opacity: { duration: 0.12, delay: 0.08 },
      },
    },
  }
}

// Il "collo" tra trigger e barra: va verso di lei, poi si assottiglia e si stacca
function dripVariants(d: TabMenuDirection): Variants {
  const { axis, sign } = AWAY[d]
  const path = [0, sign * 28, sign * 44]
  return {
    closed: { x: 0, y: 0, scale: 0.6, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } },
    open: {
      ...(axis === 'y' ? { y: path } : { x: path }),
      scale: [0.6, 1, 0.2],
      transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
    },
  }
}

// La goccia parte dal bordo del "+" rivolto verso la barra
const DRIP_MID = (TRIGGER_SIZE - DRIP_SIZE) / 2
const DRIP_START: Record<TabMenuDirection, { left: number; top: number }> = {
  top: { left: DRIP_MID, top: 0 },
  bottom: { left: DRIP_MID, top: TRIGGER_SIZE - DRIP_SIZE },
  left: { left: 0, top: DRIP_MID },
  right: { left: TRIGGER_SIZE - DRIP_SIZE, top: DRIP_MID },
}

// Centrata sul "+" sull'altro asse, ancorata dal lato del "+": cresce da lì
const BAR_STYLE: Record<TabMenuDirection, object> = {
  top: { x: '-50%', originX: 0.5, originY: 1 },
  bottom: { x: '-50%', originX: 0.5, originY: 0 },
  left: { y: '-50%', originX: 1, originY: 0.5 },
  right: { y: '-50%', originX: 0, originY: 0.5 },
}

const tabVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 6, filter: 'blur(4px)' },
  visible: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: spring },
}

function TabMenu({ icon, label, tabs, direction = 'top' }: TabMenuProps) {
  const [open, setOpen] = useState(false)
  // Nessun tab selezionato all'apertura
  const [active, setActive] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const barId = useId()
  const filterId = useId()

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <MotionConfig transition={spring} reducedMotion="user">
      {/* Filtro goo su trigger, goccia e barra: si fondono come liquido */}
      <div
        ref={rootRef}
        className="tab-menu"
        data-direction={direction}
        style={{ filter: `url(#${CSS.escape(filterId)})` }}
      >
        {/* Area ampia: la barra sta fuori dal riquadro del trigger, su qualsiasi lato */}
        <GooFilter
          id={filterId}
          region={{
            x: -(tabs.length * TAB_WIDTH) - 60,
            y: -160,
            width: 2 * tabs.length * TAB_WIDTH + TRIGGER_SIZE + 120,
            height: 2 * 160 + TRIGGER_SIZE,
          }}
        />
        <motion.span
          className="goo-drop"
          aria-hidden="true"
          style={{ ...DRIP_START[direction], width: DRIP_SIZE, height: DRIP_SIZE }}
          variants={dripVariants(direction)}
          initial={false}
          animate={open ? 'open' : 'closed'}
        />
        <AnimatePresence>
          {open && (
            <motion.div
              id={barId}
              role="tablist"
              className="tab-menu__bar"
              style={BAR_STYLE[direction]}
              variants={barVariants(direction)}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatePresence initial={false}>
                {active !== null && <GooPill index={active} step={68} />}
              </AnimatePresence>
              {tabs.map((tab, i) => (
                <motion.button
                  key={tab.label}
                  type="button"
                  role="tab"
                  className="tab-menu-motion__tab"
                  aria-selected={active === i}
                  variants={tabVariants}
                  whileTap={{ scale: 0.95 }}
                  // Scelta fatta: si chiude subito, con la sua animazione di uscita
                  onClick={() => {
                    setActive(i)
                    setOpen(false)
                    triggerRef.current?.focus()
                  }}
                >
                  <span className="tab-menu-motion__tab-icon" aria-hidden="true">
                    {tab.icon}
                  </span>
                  <span className="tab-menu-motion__tab-label">{tab.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          ref={triggerRef}
          type="button"
          className="tab-menu__trigger"
          aria-label={label}
          aria-expanded={open}
          aria-controls={open ? barId : undefined}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            if (!open) setActive(null)
            setOpen(!open)
          }}
        >
          {/* Il "+" ruota e diventa una "×" */}
          <motion.span
            className="tab-menu-motion__trigger-icon"
            aria-hidden="true"
            animate={{ rotate: open ? 45 : 0 }}
          >
            {icon}
          </motion.span>
        </motion.button>
      </div>
    </MotionConfig>
  )
}

export default TabMenu
