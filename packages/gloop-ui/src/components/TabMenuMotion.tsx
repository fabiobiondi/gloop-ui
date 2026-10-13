import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, MotionConfig, motion, type Transition } from 'motion/react'
import GooPill from './GooPill'
import { GooFilter } from './goo'
import { pressed, tabDrop } from './tab-drop'
import './theme.css'
import './TabMenuMotion.css'

export type Tab = {
  icon: ReactNode
  label: string
}

export type TabMenuMotionProps = {
  icon: ReactNode
  label: string
  tabs: Tab[]
}

// Molla principale: il "+" si allarga e diventa la barra
const morph: Transition = { type: 'spring', duration: 0.5, bounce: 0.25 }

function TabMenuMotion({ icon, label, tabs }: TabMenuMotionProps) {
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
    // reducedMotion="user": con prefers-reduced-motion restano solo le dissolvenze
    <MotionConfig transition={morph} reducedMotion="user">
      {/* Filtro goo sull'insieme: barra e gocce si fondono come liquido */}
      <div
        ref={rootRef}
        className="tab-menu-motion-wrap"
        style={{ filter: `url(#${CSS.escape(filterId)})` }}
      >
        <GooFilter id={filterId} />
        <motion.div
          layout
          className="tab-menu-motion"
          // border-radius nello style: Motion lo corregge durante la morph
          style={{ borderRadius: 26 }}
        >
          <div id={barId} role="tablist" className="tab-menu-motion__tabs">
            <AnimatePresence initial={false}>
              {open && active !== null && <GooPill index={active} step={68} />}
            </AnimatePresence>
            <AnimatePresence mode="popLayout" initial={false}>
              {open &&
                tabs.map((tab, i) => (
                  <motion.button
                    key={tab.label}
                    layout="position"
                    type="button"
                    role="tab"
                    className="tab-menu-motion__tab"
                    aria-selected={active === i}
                    // Scelta fatta: si chiude subito, con la sua animazione di uscita
                    onClick={() => {
                      setActive(i)
                      setOpen(false)
                      triggerRef.current?.focus()
                    }}
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
              if (!open) setActive(null)
              setOpen(!open)
            }}
            whileTap={{ scale: 0.92 }}
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
        </motion.div>
      </div>
    </MotionConfig>
  )
}

export default TabMenuMotion
