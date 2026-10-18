import { useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  AnimatePresence,
  motion,
  stagger,
  type Transition,
  type Variants,
} from 'motion/react'
import GooPill from './GooPill'
import { GooFilter } from './goo'
import { BoundaryContext } from './floating/boundary-context'
import { resolveDirection, type TabPopPlacement } from './tab-placement'
import type { TabPopDirection } from './tab-drop'
import { MotionScope, useGloopMotion, type MotionProps } from './motion'
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

const spring: Transition = { type: 'spring', duration: 0.5, bounce: 0.3 }

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

const along = (d: TabPopDirection, value: number) => (AWAY[d].axis === 'y' ? { y: value } : { x: value })

// time: adatta i tempi della cascata alla velocità (stagger è una funzione, m.t non la vede)
type Time = (seconds: number) => number

function barVariants(animation: TabPopAnimation, d: TabPopDirection, barWidth: number, time: Time): Variants {
  if (animation === 'pop') return popBarVariants(barWidth, time)
  if (animation === 'bounce') return bounceBarVariants(barWidth, time)
  return slideBarVariants(d, time)
}

function dripVariants(animation: TabPopAnimation, d: TabPopDirection, attached: boolean): Variants {
  // bounce: la goccia fa lo stesso percorso di pop
  return animation === 'slide' ? slideDripVariants(d, attached) : popDripVariants(d, attached)
}

/*
 * slide. La barra esce dal "+" come una goccia: parte stretta e schiacciata contro il
 * trigger (attaccata a lui grazie al filtro goo), si allontana allargandosi e si stacca.
 * I tab entrano a cascata. In chiusura viene risucchiata, più in fretta.
 */
function slideBarVariants(d: TabPopDirection, time: Time): Variants {
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
        delayChildren: stagger(time(0.04), { startDelay: time(0.06) }),
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

/*
 * slide. Il "collo" tra trigger e barra: va verso di lei, poi si assottiglia e si stacca.
 * attached: si ferma a metà dei 16px di distacco, abbastanza larga da toccare entrambi
 * (24 = centro della goccia a 8px dal "+"; scala 0.7 = 22px, sborda ~3px per lato)
 */
function slideDripVariants(d: TabPopDirection, attached: boolean): Variants {
  const { axis, sign } = AWAY[d]
  const path = attached ? [0, sign * 28, sign * 24] : [0, sign * 28, sign * 44]
  return {
    closed: { x: 0, y: 0, scale: 0.6, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } },
    open: {
      ...(axis === 'y' ? { y: path } : { x: path }),
      scale: attached ? [0.6, 1, 0.7] : [0.6, 1, 0.2],
      transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
    },
  }
}

// pop. La barra parte mentre la goccia è ancora in viaggio (la sua curva copre quasi tutto il
// percorso nei primi ~80ms): le due animazioni si sovrappongono e il filtro goo le fonde
// in un unico movimento, senza pause tra goccia e barra
const POP_DELAY = 0.06

/*
 * pop. La barra non si sposta: nasce già al suo posto, grande come il "+" (un cerchio),
 * e si apre dal centro verso i lati come un popup, superando di poco la misura e
 * tornando indietro (rimbalzo). I tab entrano a cascata dal centro.
 * In chiusura si richiude verso il centro, senza rimbalzo.
 */
function popBarVariants(barWidth: number, time: Time): Variants {
  // Da chiusa è larga quanto il "+"
  const pill = Math.min(1, TRIGGER_SIZE / barWidth)
  return {
    hidden: { opacity: 0, scaleX: pill, scaleY: 0.7 },
    visible: {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      transition: {
        scaleX: { type: 'spring', duration: 0.55, bounce: 0.45, delay: POP_DELAY },
        scaleY: { type: 'spring', duration: 0.45, bounce: 0.25, delay: POP_DELAY },
        opacity: { duration: 0.05, delay: POP_DELAY },
        delayChildren: stagger(time(0.04), { startDelay: time(POP_DELAY + 0.08), from: 'center' }),
      },
    },
    exit: {
      opacity: 0,
      scaleX: pill,
      scaleY: 0.7,
      transition: {
        type: 'spring',
        stiffness: 600,
        damping: 45,
        opacity: { duration: 0.1, delay: 0.1 },
      },
    },
  }
}

/*
 * bounce. Si apre come pop, solo in larghezza, con una curva back-out più marcata del
 * solito (1.8 invece di 1.56): parte decisa, supera bene la sua misura e ci torna.
 * In altezza e in posizione non si muove.
 */
function bounceBarVariants(barWidth: number, time: Time): Variants {
  const pill = Math.min(1, TRIGGER_SIZE / barWidth)
  return {
    hidden: { opacity: 0, scaleX: pill, scaleY: 0.7 },
    visible: {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      transition: {
        scaleX: { duration: 0.45, delay: POP_DELAY, ease: [0.34, 1.8, 0.64, 1] },
        scaleY: { type: 'spring', duration: 0.45, bounce: 0.25, delay: POP_DELAY },
        opacity: { duration: 0.05, delay: POP_DELAY },
        delayChildren: stagger(time(0.04), { startDelay: time(POP_DELAY + 0.08), from: 'center' }),
      },
    },
    exit: {
      opacity: 0,
      scaleX: pill,
      scaleY: 0.7,
      transition: {
        type: 'spring',
        stiffness: 600,
        damping: 45,
        opacity: { duration: 0.1, delay: 0.1 },
      },
    },
  }
}

/*
 * pop. Il "collo" parte per primo, più in fretta che in slide, e si gonfia mentre
 * attraversa lo spazio, così si vede che lega la "×" alla barra.
 * attached: si ferma a metà del distacco come in slide; staccata: finisce dentro la barra, assorbita.
 * In chiusura aspetta che la barra si richiuda, poi torna nella "×".
 */
function popDripVariants(d: TabPopDirection, attached: boolean): Variants {
  const { axis, sign } = AWAY[d]
  const path = attached ? [0, sign * 30, sign * 24] : [0, sign * 30, sign * 44]
  return {
    closed: { x: 0, y: 0, scale: 0.6, transition: { duration: 0.25, delay: 0.1, ease: [0.23, 1, 0.32, 1] } },
    open: {
      ...(axis === 'y' ? { y: path } : { x: path }),
      scale: attached ? [0.6, 1.15, 0.7] : [0.6, 1.15, 0.2],
      transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
    },
  }
}

// La goccia parte dal bordo del "+" rivolto verso la barra
const DRIP_MID = (TRIGGER_SIZE - DRIP_SIZE) / 2
const DRIP_START: Record<TabPopDirection, { left: number; top: number }> = {
  top: { left: DRIP_MID, top: 0 },
  bottom: { left: DRIP_MID, top: TRIGGER_SIZE - DRIP_SIZE },
  left: { left: 0, top: DRIP_MID },
  right: { left: TRIGGER_SIZE - DRIP_SIZE, top: DRIP_MID },
}

// Centrata sul "+" sull'altro asse, ancorata dal lato del "+": cresce da lì
const BAR_STYLE: Record<TabPopDirection, object> = {
  top: { x: '-50%', originX: 0.5, originY: 1 },
  bottom: { x: '-50%', originX: 0.5, originY: 0 },
  left: { y: '-50%', originX: 1, originY: 0.5 },
  right: { y: '-50%', originX: 0, originY: 0.5 },
}

// pop e bounce: si apre sempre dal suo centro, anche di fianco al "+"
const barStyle = (animation: TabPopAnimation, d: TabPopDirection) =>
  animation === 'slide' ? BAR_STYLE[d] : { ...BAR_STYLE[d], originX: 0.5 }

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

const tabVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 6, filter: 'blur(4px)' },
  visible: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: spring },
}

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
  const staggerTime = (seconds: number) => m.t({ delay: seconds }).delay ?? 0
  const [open, setOpen] = useState(false)
  // Nessun tab selezionato all'apertura
  const [active, setActive] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
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
    <MotionScope m={m} props={motionProps} transition={spring}>
      {/* Filtro goo su trigger, goccia e barra: si fondono come liquido */}
      <div
        {...m.rootProps}
        ref={rootRef}
        className="tab-pop"
        data-direction={direction}
        style={{ ...m.rootProps.style, filter: `url(#${CSS.escape(filterId)})` }}
      >
        {/* Area ampia: la barra sta fuori dal riquadro del trigger, su qualsiasi lato */}
        <GooFilter id={filterId} region={filterRegion(direction, barWidth)} />
        <motion.span
          className="goo-drop"
          aria-hidden="true"
          style={{ ...DRIP_START[direction], width: DRIP_SIZE, height: DRIP_SIZE }}
          variants={m.v(dripVariants(animation, direction, attached))}
          initial={false}
          animate={open ? 'open' : 'closed'}
        />
        <AnimatePresence>
          {open && (
            <motion.div
              id={barId}
              role="tablist"
              className="tab-pop__bar"
              style={{ ...barStyle(animation, direction), paddingInline: barPadding }}
              variants={m.v(barVariants(animation, direction, barWidth, staggerTime))}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Contenitore spostato di pillOffset: la pillola si allinea alle tab, oltre il margine della barra */}
              <span className="tab-pop__pill" style={{ left: pillOffset, right: -pillOffset }}>
                <AnimatePresence initial={false}>
                  {active !== null && <GooPill index={active} step={tabWidth} length={pillLength} />}
                </AnimatePresence>
              </span>
              {tabs.map((tab, i) => (
                <motion.button
                  key={tab.label}
                  type="button"
                  role="tab"
                  className="tab-fab__tab"
                  aria-selected={active === i}
                  aria-label={iconOnly ? tab.label : undefined}
                  style={tabWidth === TAB_WIDTH ? undefined : { width: tabWidth }}
                  variants={m.v(tabVariants)}
                  whileTap={{ scale: 0.95 }}
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
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          ref={triggerRef}
          type="button"
          className="tab-pop__trigger"
          aria-label={label}
          aria-expanded={open}
          aria-controls={open ? barId : undefined}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            if (!open) {
              setActive(null)
              chooseSide()
            }
            setOpen(!open)
          }}
        >
          {/* Il "+" ruota e diventa una "×" */}
          <motion.span
            className="tab-fab__trigger-icon"
            aria-hidden="true"
            animate={{ rotate: open ? 45 : 0 }}
          >
            {icon}
          </motion.span>
        </motion.button>
      </div>
    </MotionScope>
  )
}

export default TabPop
