import { useState, type ReactNode } from 'react'
import { MotionConfig, motion, type Transition } from 'motion/react'
import GooPill from './GooPill'
import './theme.css'
import './TabMenuMotion.css'
import './TabBar.css'

export type Tab = {
  icon: ReactNode
  label: string
}

export type TabBarProps = {
  tabs: Tab[]
  /** Nome della navigazione per i lettori di schermo */
  label?: string
  onChange?: (index: number) => void
  /** Lato da cui la barra entra al caricamento; false la mostra senza animazione */
  enterFrom?: TabBarEnter | false
}

export type TabBarEnter = 'bottom' | 'top' | 'left' | 'right'

const enterOffset: Record<TabBarEnter, { x?: number; y?: number }> = {
  bottom: { y: 100 },
  top: { y: -100 },
  left: { x: -100 },
  right: { x: 100 },
}

const spring: Transition = { type: 'spring', duration: 0.5, bounce: 0.3 }

/*
 * Barra di navigazione sempre visibile, fissa in basso.
 * Entra al caricamento dal lato scelto (enterFrom); la selezione è una pillola liquida
 * nel colore accent e l'icona del tab scelto fa un piccolo salto.
 */
function TabBar({ tabs, label = 'Main', onChange, enterFrom = 'bottom' }: TabBarProps) {
  const [active, setActive] = useState(0)

  return (
    <MotionConfig transition={spring} reducedMotion="user">
      <motion.nav
        aria-label={label}
        className="tab-bar"
        initial={enterFrom ? { ...enterOffset[enterFrom], opacity: 0 } : false}
        animate={{ x: 0, y: 0, opacity: 1, transition: { ...spring, delay: 0.2 } }}
      >
        <GooPill index={active} step={68} opacity={0.3} />
        {tabs.map((tab, i) => (
          <motion.button
            key={tab.label}
            type="button"
            className="tab-menu-motion__tab"
            aria-current={active === i ? 'page' : undefined}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActive(i)
              onChange?.(i)
            }}
          >
            <motion.span
              // key cambia a ogni selezione: l'animazione riparte anche sullo stesso tab
              key={active === i ? 'on' : 'off'}
              className="tab-menu-motion__tab-icon"
              aria-hidden="true"
              initial={active === i ? { scale: 1, y: 0 } : false}
              animate={active === i ? { scale: [1, 1.3, 1], y: [0, -4, 0] } : { scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {tab.icon}
            </motion.span>
            <span className="tab-menu-motion__tab-label">{tab.label}</span>
          </motion.button>
        ))}
      </motion.nav>
    </MotionConfig>
  )
}

export default TabBar
