import { useContext, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import GooPill, { useExit, usePresence } from './GooPill'
import { BoundaryContext } from './floating/boundary-context'
import { resolveDirection, type TabPopPlacement } from './tab-placement'
import type { TabPopDirection } from './tab-drop'
import { GloopMotionProvider, pickMotionProps, type MotionProps } from './motion-context'
import { useGloopMotion } from './gloop-motion'
import './theme.css'
import './TabFab.css'
import './TabPop.css'

export type Tab = {
  icon: ReactNode
  label: string
}

/**
 * slide: la barra esce dal "+" come una goccia e si allontana allargandosi.
 * pop: prima la goccia raggiunge il posto della barra, poi la barra si apre dal centro
 * verso i lati come un popup, con un leggero rimbalzo.
 * bounce: si apre come pop, in larghezza con una curva back-out (supera la misura e ci torna)
 */
export type TabPopAnimation = 'slide' | 'pop' | 'bounce'

export type TabPopProps = {
  icon: ReactNode
  label: string
  tabs: Tab[]
  /**
   * Lato del "+" su cui compare la barra (sempre orizzontale): sopra, sotto o di fianco.
   * 'auto': all'apertura il primo lato in cui entra (top, bottom, right, left), dentro
   * il FloatingBoundary più vicino o il viewport
   */
  direction?: TabPopPlacement
  /**
   * true: da aperta la goccia resta tra "+" e barra, come un collo che li tiene uniti.
   * false: la goccia si stacca e la barra resta separata dal "+"
   */
  attached?: boolean
  /** Solo icone: i testi delle tab non si vedono, restano come nome accessibile */
  iconOnly?: boolean
  /**
   * Spazio tra un'icona e la successiva, in px (default 50: tab larghe 68px).
   * 0: icone attaccate. Sotto il default i testi non ci stanno più: meglio con iconOnly
   */
  tabGap?: number
  /** Come si apre la barra (default 'slide') */
  animation?: TabPopAnimation
} & MotionProps

const TAB_WIDTH = 68
const ICON_SIZE = 18
const DEFAULT_TAB_GAP = TAB_WIDTH - ICON_SIZE
// Pillola della tab scelta: mai più stretta di così, anche con le icone attaccate
const PILL_MIN = 44
const TRIGGER_SIZE = 52

/*
 * Verso in cui la barra si allontana dal "+": asse e segno.
 * top: sale, bottom: scende, left/right: si sposta di lato.
 */
const AWAY: Record<TabPopDirection, { axis: 'x' | 'y'; sign: 1 | -1 }> = {
  top: { axis: 'y', sign: -1 },
  bottom: { axis: 'y', sign: 1 },
  left: { axis: 'x', sign: -1 },
  right: { axis: 'x', sign: 1 },
}

// Spostamento della barra da nascosta, per asse (si somma alla centratura in TabPop.css)
const tuck = (d: TabPopDirection, value: number) => ({
  '--bar-tuck-x': `${AWAY[d].axis === 'x' ? value : 0}px`,
  '--bar-tuck-y': `${AWAY[d].axis === 'y' ? value : 0}px`,
})

/*
 * Le tre aperture sono in TabPop.css (data-animation sulla radice); qui restano le misure
 * che dipendono da lato, larghezza e attached, passate come variabili CSS.
 *
 * slide. La barra esce dal "+" come una goccia: parte stretta e schiacciata contro il
 * trigger (sovrapposta a lui), si allontana allargandosi e si stacca.
 * I tab entrano a cascata. In chiusura viene risucchiata, più in fretta.
 *
 * pop. La barra non si sposta: nasce già al suo posto, grande come il "+" (un cerchio),
 * e si apre dal centro verso i lati come un popup, superando di poco la misura e
 * tornando indietro (rimbalzo). I tab entrano a cascata dal centro.
 * In chiusura si richiude verso il centro, senza rimbalzo.
 *
 * bounce. Si apre come pop, solo in larghezza, con una curva back-out più marcata del
 * solito (1.8 invece di 1.56): parte decisa, supera bene la sua misura e ci torna.
 */
function barVars(animation: TabPopAnimation, d: TabPopDirection, barWidth: number) {
  // pop e bounce: da chiusa è larga quanto il "+"
  const pill = Math.min(1, TRIGGER_SIZE / barWidth)
  return (
    animation === 'slide'
      ? // Da nascosta sta 52px più vicina al "+"
        { ...tuck(d, -AWAY[d].sign * 52), '--bar-sx': 0.25, '--bar-sy': 0.6 }
      : { ...tuck(d, 0), '--bar-sx': pill, '--bar-sy': 0.7 }
  ) as CSSProperties
}

// pop. La barra parte mentre il collo sta ancora crescendo verso di lei: i due movimenti
// si sovrappongono, senza pause tra collo e barra
const POP_DELAY = 0.06

// Ritardo del tab i nella cascata, in secondi: slide dal primo, pop e bounce dal centro
function tabDelay(animation: TabPopAnimation, i: number, count: number) {
  if (animation === 'slide') return 0.06 + i * 0.04
  return POP_DELAY + 0.08 + Math.abs(i - (count - 1) / 2) * 0.04
}

// Ancorata dal lato del "+": cresce da lì (la centratura sull'altro asse è in TabPop.css)
const BAR_ORIGIN: Record<TabPopDirection, string> = {
  top: '50% 100%',
  bottom: '50% 0%',
  left: '100% 50%',
  right: '0% 50%',
}

// pop e bounce: si apre sempre dal suo centro, anche di fianco al "+"
const barOrigin = (animation: TabPopAnimation, d: TabPopDirection) =>
  animation === 'slide' ? BAR_ORIGIN[d] : BAR_ORIGIN[d].replace(/^\S+/, '50%')

/*
 * Animata solo in CSS (TabPop.css): collo, barra e tab in cascata. La barra resta
 * montata finché non è finita la sua uscita (usePresence/useExit).
 * Niente filtri SVG: su Safari/iOS si ricalcolano in software a ogni frame e l'apertura
 * scatta. Il collo liquido tra "+" e barra è un elemento CSS con i fianchi concavi;
 * tutto si anima con transform e opacity, sulla GPU.
 */
function TabPop({
  icon,
  label,
  tabs,
  direction: placement = 'top',
  attached = true,
  iconOnly = false,
  tabGap = DEFAULT_TAB_GAP,
  animation = 'slide',
  ...motionProps
}: TabPopProps) {
  const m = useGloopMotion(motionProps)
  const [open, setOpen] = useState(false)
  // Nessun tab selezionato all'apertura
  const [active, setActive] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  // direction="auto": il lato si sceglie all'apertura, misurando lo spazio attorno al "+"
  const [autoSide, setAutoSide] = useState<TabPopDirection>('top')
  const direction = placement === 'auto' ? autoSide : placement
  const boundaryRef = useContext(BoundaryContext)
  // Ogni tab è larga un'icona più tabGap: tra due icone resta proprio tabGap
  const tabWidth = ICON_SIZE + Math.max(0, tabGap)
  // Tab strette: la barra prende un margine, così le icone ai lati non finiscono nella curva
  const barPadding = Math.max(0, (TRIGGER_SIZE - tabWidth) / 2)
  const barWidth = tabs.length * tabWidth + 2 * barPadding
  // Pillola centrata sulla tab, anche quando è più larga di lei
  const pillLength = Math.max(tabWidth, PILL_MIN)
  const pillOffset = barPadding - (pillLength - tabWidth) / 2
  const chooseSide = () => {
    // Ingombro della barra espresso in tab da TAB_WIDTH
    if (placement === 'auto')
      setAutoSide(
        resolveDirection('auto', triggerRef.current, boundaryRef?.current, barWidth / TAB_WIDTH, 'detached'),
      )
  }
  const barId = useId()

  // La barra resta durante l'uscita; la pillola si dissolve se la scelta si azzera
  const bar = usePresence(open ? true : null)
  useExit(barRef, bar.closing, bar.exited)
  const pill = usePresence(active)

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
    <GloopMotionProvider {...pickMotionProps(motionProps)}>
      <div
        {...m.rootProps}
        ref={rootRef}
        className="tab-pop"
        data-direction={direction}
        data-animation={animation}
        data-open={open || undefined}
        data-attached={attached || undefined}
      >
        {/* Collo tra "+" e barra: sotto entrambi, se ne vede solo il tratto nel distacco */}
        <span className="tab-pop__neck" aria-hidden="true" />
        {bar.value && (
          <div
            ref={barRef}
            id={barId}
            role="tablist"
            className="tab-pop__bar"
            data-closing={bar.closing || undefined}
            style={{
              transformOrigin: barOrigin(animation, direction),
              paddingInline: barPadding,
              ...barVars(animation, direction, barWidth),
            }}
          >
            {/* Contenitore spostato di pillOffset: la pillola si allinea alle tab, oltre il margine della barra */}
            <span className="tab-pop__pill" style={{ left: pillOffset, right: -pillOffset }}>
              {pill.value !== null && (
                <GooPill
                  index={pill.value}
                  step={tabWidth}
                  length={pillLength}
                  closing={pill.closing}
                  onExited={pill.exited}
                />
              )}
            </span>
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                className="tab-fab__tab"
                aria-selected={active === i}
                aria-label={iconOnly ? tab.label : undefined}
                style={
                  {
                    ...(tabWidth === TAB_WIDTH ? undefined : { width: tabWidth }),
                    '--tab-delay': `${tabDelay(animation, i, tabs.length)}s`,
                  } as CSSProperties
                }
                // Scelta fatta: si chiude subito, con la sua animazione di uscita
                onClick={() => {
                  setActive(i)
                  setOpen(false)
                  triggerRef.current?.focus()
                }}
              >
                <span className="tab-fab__tab-icon" aria-hidden="true">
                  {tab.icon}
                </span>
                {!iconOnly && <span className="tab-fab__tab-label">{tab.label}</span>}
              </button>
            ))}
          </div>
        )}

        <button
          ref={triggerRef}
          type="button"
          className="tab-pop__trigger"
          aria-label={label}
          aria-expanded={open}
          aria-controls={open ? barId : undefined}
          onClick={() => {
            if (!open) {
              setActive(null)
              chooseSide()
            }
            setOpen(!open)
          }}
        >
          {/* Il "+" ruota e diventa una "×" */}
          <span className="tab-fab__trigger-icon" aria-hidden="true">
            {icon}
          </span>
        </button>
      </div>
    </GloopMotionProvider>
  )
}

export default TabPop
