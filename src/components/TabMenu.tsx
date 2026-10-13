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
import './theme.css'
import './TabMenuMotion.css'
import './TabMenu.css'

type Tab = {
  icon: ReactNode
  label: string
}

type TabMenuProps = {
  icon: ReactNode
  label: string
  tabs: Tab[]
}

const spring: Transition = { type: 'spring', duration: 0.5, bounce: 0.3 }

const TAB_WIDTH = 68
const TRIGGER_SIZE = 52
const DRIP_SIZE = 32

/*
 * La barra esce dal "+" come una goccia: parte stretta e schiacciata sopra il
 * trigger (attaccata a lui grazie al filtro goo), sale allargandosi e si stacca.
 * I tab entrano a cascata. In chiusura viene risucchiata, più in fretta.
 */
const barVariants: Variants = {
  hidden: { opacity: 0, scaleX: 0.25, scaleY: 0.6, y: 52 },
  visible: {
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    y: 0,
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
    y: 52,
    transition: {
      type: 'spring',
      stiffness: 520,
      damping: 40,
      opacity: { duration: 0.12, delay: 0.08 },
    },
  },
}

// Il "collo" tra trigger e barra: sale con lei, poi si assottiglia e si stacca
const dripVariants: Variants = {
  closed: { y: 0, scale: 0.6, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } },
  open: {
    y: [0, -28, -44],
    scale: [0.6, 1, 0.2],
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
}

const tabVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 6, filter: 'blur(4px)' },
  visible: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: spring },
}

function TabMenu({ icon, label, tabs }: TabMenuProps) {
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
        style={{ filter: `url(#${CSS.escape(filterId)})` }}
      >
        {/* Area ampia: la barra sta sopra il trigger, fuori dal suo riquadro */}
        <GooFilter
          id={filterId}
          region={{
            x: -(tabs.length * TAB_WIDTH) / 2 - 60,
            y: -160,
            width: tabs.length * TAB_WIDTH + TRIGGER_SIZE + 120,
            height: 260,
          }}
        />
        <motion.span
          className="goo-drop"
          aria-hidden="true"
          style={{
            left: (TRIGGER_SIZE - DRIP_SIZE) / 2,
            top: 0,
            width: DRIP_SIZE,
            height: DRIP_SIZE,
          }}
          variants={dripVariants}
          initial={false}
          animate={open ? 'open' : 'closed'}
        />
        <AnimatePresence>
          {open && (
            <motion.div
              id={barId}
              role="tablist"
              className="tab-menu__bar"
              // Centrata sul trigger e ancorata in basso: cresce da lì
              style={{ x: '-50%', originX: 0.5, originY: 1 }}
              variants={barVariants}
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
