import { useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, MotionConfig, motion, type Transition } from 'motion/react'
import GooPill from './GooPill'
import { GooFilter } from './goo'
import { BoundaryContext } from './floating/boundary-context'
import { resolveDirection, type TabMenuPlacement } from './tab-placement'
import {
  TAB_HEIGHT,
  TAB_WIDTH,
  barFilterRegion,
  isVertical,
  pressed,
  tabDrop,
  visualIndex,
  type TabMenuDirection,
} from './tab-drop'
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
  /**
   * Lato del "+" da cui esce la barra. left/right: barra orizzontale da quel lato;
   * top/bottom: colonna sopra/sotto, con il primo tab vicino al "+".
   * 'auto': all'apertura il primo lato in cui entra (left, right, top, bottom)
   */
  direction?: TabMenuPlacement
}

// Molla principale: il "+" si allarga e diventa la barra
const morph: Transition = { type: 'spring', duration: 0.5, bounce: 0.25 }

function TabMenuMotion({ icon, label, tabs, direction: placement = 'left' }: TabMenuMotionProps) {
  const [open, setOpen] = useState(false)
  // Nessun tab selezionato all'apertura
  const [active, setActive] = useState<number | null>(null)
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
        <GooFilter id={filterId} region={barFilterRegion(tabs.length)} />
        <motion.div
          layout
          className="tab-menu-motion"
          data-direction={direction}
          // border-radius nello style: Motion lo corregge durante la morph
          style={{ borderRadius: 26 }}
        >
          <div id={barId} role="tablist" className="tab-menu-motion__tabs">
            {/* Niente uscita animata: chiudendo, la barra scalata la stirerebbe (vedi tabDrop) */}
            {open && active !== null && (
              <GooPill
                index={visualIndex(active, tabs.length, direction)}
                step={vertical ? TAB_HEIGHT : TAB_WIDTH}
                axis={vertical ? 'y' : 'x'}
              />
            )}
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
              if (!open) {
                setActive(null)
                chooseSide()
              }
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
