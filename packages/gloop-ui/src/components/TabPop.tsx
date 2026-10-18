import { useContext, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import GooPill, { useExit, usePresence } from './GooPill'
import { GooFilter } from './goo'
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
const DRIP_SIZE = 32

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

// Spostamento lungo il verso della barra, come valore di translate
const along = (d: TabPopDirection, value: number) => (AWAY[d].axis === 'y' ? `0px ${value}px` : `${value}px 0px`)

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
 * trigger (attaccata a lui grazie al filtro goo), si allontana allargandosi e si stacca.
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

// pop. La barra parte mentre la goccia è ancora in viaggio (la sua curva copre quasi tutto il
// percorso nei primi ~80ms): le due animazioni si sovrappongono e il filtro goo le fonde
// in un unico movimento, senza pause tra goccia e barra
const POP_DELAY = 0.06

// Ritardo del tab i nella cascata, in secondi: slide dal primo, pop e bounce dal centro
function tabDelay(animation: TabPopAnimation, i: number, count: number) {
  if (animation === 'slide') return 0.06 + i * 0.04
  return POP_DELAY + 0.08 + Math.abs(i - (count - 1) / 2) * 0.04
}

/*
 * Il "collo" tra trigger e barra: va verso di lei, poi si assottiglia e si stacca.
 * attached: si ferma a metà dei 16px di distacco, abbastanza larga da toccare entrambi
 * (24 = centro della goccia a 8px dal "+"; scala 0.7 = 22px, sborda ~3px per lato).
 * pop e bounce: parte per primo, più in fretta che in slide, e si gonfia mentre
 * attraversa lo spazio, così si vede che lega la "×" alla barra; staccata finisce
 * dentro la barra, assorbita. In chiusura aspetta che la barra si richiuda.
 */
function dripVars(animation: TabPopAnimation, d: TabPopDirection, attached: boolean) {
  const { sign } = AWAY[d]
  const slide = animation === 'slide'
  return {
    '--drip-mid': along(d, sign * (slide ? 28 : 30)),
    '--drip-end': along(d, sign * (attached ? 24 : 44)),
    '--drip-mid-s': slide ? 1 : 1.15,
    '--drip-end-s': attached ? 0.7 : 0.2,
  } as CSSProperties
}

// La goccia parte dal bordo del "+" rivolto verso la barra
const DRIP_MID = (TRIGGER_SIZE - DRIP_SIZE) / 2
const DRIP_START: Record<TabPopDirection, { left: number; top: number }> = {
  top: { left: DRIP_MID, top: 0 },
  bottom: { left: DRIP_MID, top: TRIGGER_SIZE - DRIP_SIZE },
  left: { left: 0, top: DRIP_MID },
  right: { left: TRIGGER_SIZE - DRIP_SIZE, top: DRIP_MID },
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

// Distanza tra "+" e barra (vedi TabPop.css) e margine per goo, ombra e rimbalzo di pop/bounce
const BAR_GAP = 16
const REGION_MARGIN = 40

/*
 * Area del filtro goo, in px dall'angolo del "+": solo il lato in cui si apre la barra.
 * Stretta di proposito: su Safari/iOS un'area molto più grande del necessario
 * (dipende anche dalla posizione nello schermo) fa sparire tutto il componente
 */
function filterRegion(d: TabPopDirection, barWidth: number) {
  const m = REGION_MARGIN + barWidth * 0.1
  // Barra + distacco + "+", sull'asse in cui si allontana
  const reach = TRIGGER_SIZE + BAR_GAP + barWidth
  if (d === 'left' || d === 'right')
    return {
      x: d === 'left' ? -BAR_GAP - barWidth - m : -m,
      y: -REGION_MARGIN,
      width: reach + 2 * m,
      height: TRIGGER_SIZE + 2 * REGION_MARGIN,
    }
  const height = 2 * TRIGGER_SIZE + BAR_GAP
  return {
    x: TRIGGER_SIZE / 2 - barWidth / 2 - m,
    y: d === 'top' ? -TRIGGER_SIZE - BAR_GAP - REGION_MARGIN : -REGION_MARGIN,
    width: barWidth + 2 * m,
    height: height + 2 * REGION_MARGIN,
  }
}

/*
 * Animata solo in CSS (TabPop.css): goccia, barra e tab in cascata. La barra resta
 * montata finché non è finita la sua uscita (usePresence/useExit).
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
  const filterId = useId()

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
      {/* Filtro goo su trigger, goccia e barra: si fondono come liquido */}
      <div
        {...m.rootProps}
        ref={rootRef}
        className="tab-pop"
        data-direction={direction}
        data-animation={animation}
        data-open={open || undefined}
        style={{ ...m.rootProps.style, filter: `url(#${CSS.escape(filterId)})` }}
      >
        {/* Area ampia: la barra sta fuori dal riquadro del trigger, su qualsiasi lato */}
        <GooFilter id={filterId} region={filterRegion(direction, barWidth)} />
        <span
          className="goo-drop"
          aria-hidden="true"
          style={{
            ...DRIP_START[direction],
            width: DRIP_SIZE,
            height: DRIP_SIZE,
            ...dripVars(animation, direction, attached),
          }}
        />
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
