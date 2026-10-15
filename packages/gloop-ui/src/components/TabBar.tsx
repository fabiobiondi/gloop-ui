import { AnimatePresence, motion, type Transition } from 'motion/react'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import GooPill from './GooPill'
import { MotionScope, useGloopMotion, type MotionProps } from './motion'
import './theme.css'
import './TabFab.css'
import './TabBar.css'

export type Tab = {
  icon: ReactNode
  label: string
  /** Contatore o badge accanto alla label (es. 3, "new") */
  value?: ReactNode
}

export type TabBarProps = {
  tabs: Tab[]
  /** Nome della navigazione per i lettori di schermo */
  label?: string
  onChange?: (index: number) => void
  /** Lato da cui la barra entra al caricamento (default: bottom, left in verticale); false la mostra senza animazione */
  enterFrom?: TabBarEnter | false
  /** horizontal: tab in riga. vertical: tab in colonna (fixed: sul lato sinistro dello schermo) */
  orientation?: 'horizontal' | 'vertical'
  /** stacked: icona sopra la label, tab di larghezza fissa. inline: icona, label e value in riga */
  layout?: 'stacked' | 'inline'
  /** fixed: fissa in basso allo schermo (a sinistra in verticale). static: nel flusso della pagina (header, toolbar) */
  position?: 'fixed' | 'static'
} & MotionProps

export type TabBarEnter = 'bottom' | 'top' | 'left' | 'right'

const enterOffset: Record<TabBarEnter, { x?: number; y?: number }> = {
  bottom: { y: 100 },
  top: { y: -100 },
  left: { x: -100 },
  right: { x: 100 },
}

const spring: Transition = { type: 'spring', duration: 0.5, bounce: 0.3 }

/*
 * Barra di navigazione con una pillola liquida nel colore accent sul tab scelto,
 * la cui icona fa un piccolo salto. Entra al caricamento dal lato scelto (enterFrom).
 * I tab possono avere larghezze diverse (layout inline): la pillola segue posizione
 * e larghezza misurate dal DOM.
 */
function TabBar({
  tabs,
  label = 'Main',
  onChange,
  orientation = 'horizontal',
  enterFrom = orientation === 'vertical' ? 'left' : 'bottom',
  layout = 'stacked',
  position = 'fixed',
  ...motionProps
}: TabBarProps) {
  const m = useGloopMotion(motionProps)
  const [active, setActive] = useState(0)
  // Tab sotto il cursore: una seconda pillola liquida, tenue, lo segue (come in TabFab)
  const [hovered, setHovered] = useState<number | null>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const vertical = orientation === 'vertical'
  // Posizione e lunghezza di ogni tab lungo l'asse, misurate dal DOM
  const [rects, setRects] = useState<{ offset: number; length: number }[]>([])

  // Prima del paint: la pillola nasce già sul tab, senza scivolare da 0
  useLayoutEffect(() => {
    const measure = () => {
      const next = tabRefs.current
        .slice(0, tabs.length)
        .map((tab) =>
          vertical
            ? { offset: tab?.offsetTop ?? 0, length: tab?.offsetHeight ?? 0 }
            : { offset: tab?.offsetLeft ?? 0, length: tab?.offsetWidth ?? 0 },
        )
      // Stesse misure: niente render (il ResizeObserver scatta anche all'avvio)
      setRects((prev) =>
        prev.length === next.length &&
        prev.every((r, i) => r.offset === next[i].offset && r.length === next[i].length)
          ? prev
          : next,
      )
    }
    measure()
    // Font caricati in ritardo, label o value che cambiano: i tab cambiano larghezza
    const observer = new ResizeObserver(measure)
    for (const tab of tabRefs.current) if (tab) observer.observe(tab)
    return () => observer.disconnect()
  }, [tabs, layout, vertical])

  const pillProps = (i: number) => ({
    // step 1: l'indice passato alla pillola è già la distanza in px
    index: rects[i].offset,
    step: 1,
    length: rects[i].length,
    axis: vertical ? ('y' as const) : ('x' as const),
    radius: layout === 'inline' ? 16 : 22,
  })

  return (
    <MotionScope m={m} props={motionProps} transition={spring}>
      <motion.nav
        {...m.rootProps}
        aria-label={label}
        className="tab-bar"
        data-layout={layout}
        data-position={position}
        data-orientation={orientation}
        onPointerLeave={() => setHovered(null)}
        initial={enterFrom ? { ...enterOffset[enterFrom], opacity: 0 } : false}
        animate={{ x: 0, y: 0, opacity: 1, transition: m.t({ ...spring, delay: 0.2 }) }}
      >
        {rects[active] && <GooPill {...pillProps(active)} className="tab-bar__pill" opacity={0.3} />}
        {/* Rollover: stessa pillola tenue di TabFab, nel colore del testo */}
        <AnimatePresence>
          {hovered !== null && rects[hovered] && <GooPill key="hover" {...pillProps(hovered)} opacity={0.08} />}
        </AnimatePresence>
        {tabs.map((tab, i) => (
          <motion.button
            key={tab.label}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            className="tab-fab__tab"
            aria-current={active === i ? 'page' : undefined}
            whileTap={{ scale: 0.95 }}
            // Solo mouse e penna: al tocco l'hover resterebbe "appeso"
            onPointerEnter={(e) => e.pointerType !== 'touch' && setHovered(i)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            onClick={() => {
              setActive(i)
              onChange?.(i)
            }}
          >
            <motion.span
              // key cambia a ogni selezione: l'animazione riparte anche sullo stesso tab
              key={active === i ? 'on' : 'off'}
              className="tab-fab__tab-icon"
              aria-hidden="true"
              initial={active === i ? { scale: 1, y: 0 } : false}
              animate={active === i ? { scale: [1, 1.3, 1], y: [0, -4, 0] } : { scale: 1, y: 0 }}
              transition={m.t({ duration: 0.4, ease: 'easeOut' })}
            >
              {tab.icon}
            </motion.span>
            <span className="tab-fab__tab-label">{tab.label}</span>
            {/* Lo spazio sparisce nel flex ma separa label e value nel nome accessibile */}
            {tab.value != null && (
              <>
                {' '}
                <span className="tab-bar__value">{tab.value}</span>
              </>
            )}
          </motion.button>
        ))}
      </motion.nav>
    </MotionScope>
  )
}

export default TabBar
