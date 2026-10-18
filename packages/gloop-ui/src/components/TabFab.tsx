import {
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import GooPill, { useExit, usePresence } from './GooPill'
import ListCore from './list/ListCore'
import { GooFilter } from './goo'
import { BoundaryContext } from './floating/boundary-context'
import { availableArea, pickSide, resolveDirection, type Box, type TabPopPlacement } from './tab-placement'
import {
  TAB_HEIGHT,
  TAB_WIDTH,
  TRIGGER_SIZE,
  barFilterRegion,
  isVertical,
  tabDrop,
  visualIndex,
  type TabPopDirection,
} from './tab-drop'
import { GloopMotionProvider, pickMotionProps, type MotionProps } from './motion-context'
import { useGloopMotion } from './gloop-motion'
import './theme.css'
import './TabFab.css'

/** Voce del sottomenu: solo testo, o testo con icona opzionale */
export type SubmenuItem = string | { label: string; icon?: ReactNode }

export type Tab = {
  icon: ReactNode
  label: string
  items?: SubmenuItem[]
}

export type TabFabProps = {
  icon: ReactNode
  label: string
  /** Tab della barra; con items il tab apre un sottomenu invece di chiudere la barra */
  tabs: Tab[]
  /**
   * Lato del "+" da cui esce la barra. left/right: barra orizzontale, sottomenu sopra;
   * top/bottom: colonna sopra/sotto (primo tab vicino al "+"), sottomenu a destra del tab.
   * 'auto': all'apertura il primo lato in cui entra (left, right, top, bottom)
   */
  direction?: TabPopPlacement
  /**
   * true: la goccia resta tra tab e sottomenu, come un collo che li tiene uniti.
   * false: niente goccia, il sottomenu compare separato senza fondersi col tab
   */
  attached?: boolean
} & MotionProps

const DRIP_SIZE = 28
/** Distanza tra barra e pannello: oltre ~12px il filtro goo non li fonde da fermi */
const PANEL_GAP = 14
const PANEL_WIDTH = 200
/*
 * La goccia resta ferma nello spazio tra barra e pannello, un po' sovrapposta a entrambi:
 * il filtro goo la fonde con loro in un "collo" liquido e il pannello sembra attaccato al tab.
 * 28 × 0.75 = 21px > 14px di spazio: sporge di ~3.5px per lato.
 */
const NECK_SCALE = 0.75
// Altezza stimata del pannello (misure di ListCore e padding del pannello), per scegliere il lato
const ITEM_HEIGHT = 40
const ITEM_GAP = 2
const PANEL_PADDING = 6
const panelHeight = (count: number) => PANEL_PADDING * 2 + count * ITEM_HEIGHT + Math.max(0, count - 1) * ITEM_GAP

// Molla morph (TabFab.css) per le animazioni Web Animations: curva e durata lette dal CSS
function morphTiming(el: Element, speed: number): KeyframeAnimationOptions {
  const css = getComputedStyle(el)
  return {
    duration: (parseFloat(css.getPropertyValue('--tf-morph-ms')) || 500) / speed,
    easing: css.getPropertyValue('--tf-morph').trim() || 'ease-out',
  }
}

type PanelPageProps = {
  closing: boolean
  /** Il primo contenuto del pannello compare con lui, senza scorrere */
  initial: boolean
  onExited: () => void
  style: CSSProperties
  children: ReactNode
}

// Un contenuto del sottomenu: resta montato finché non è finita la sua uscita
function PanelPage({ closing, initial, onExited, style, children }: PanelPageProps) {
  const ref = useRef<HTMLDivElement>(null)
  useExit(ref, closing, onExited)
  return (
    <div
      ref={ref}
      className="tab-fab__list-wrap"
      data-closing={closing || undefined}
      data-initial={initial || undefined}
      style={style}
    >
      {children}
    </div>
  )
}

/*
 * Barra che nasce dal "+" come un liquido. I tab con items aprono un sottomenu
 * in un pannello che si fonde con la barra; gli altri chiudono la barra.
 * Animata solo in CSS (TabFab.css): lo sfondo della barra cresce dal "+", i tab
 * escono sulle loro gocce; due piccoli FLIP con Web Animations seguono gli spostamenti
 * del "+" nella pagina e l'altezza del pannello quando cambia sottomenu.
 */
function TabFab({
  icon,
  label,
  tabs,
  direction: placement = 'left',
  attached = true,
  ...motionProps
}: TabFabProps) {
  const m = useGloopMotion(motionProps)
  const [open, setOpenState] = useState(false)
  // Nessun tab selezionato all'apertura
  const [active, setActive] = useState<number | null>(null)
  // Tab sotto il cursore: una seconda pillola liquida lo segue
  const [hovered, setHovered] = useState<number | null>(null)
  const [submenu, setSubmenu] = useState<number | null>(null)
  const [slideDir, setDirection] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  // direction="auto": il lato si sceglie all'apertura, misurando lo spazio attorno al "+"
  const [autoSide, setAutoSide] = useState<TabPopDirection>('left')
  const direction = placement === 'auto' ? autoSide : placement
  const boundaryRef = useContext(BoundaryContext)
  const chooseSide = () => {
    if (placement === 'auto')
      setAutoSide(resolveDirection('auto', triggerRef.current, boundaryRef?.current, tabs.length, 'morph'))
  }
  const vertical = isVertical(direction)
  const n = tabs.length
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const barId = useId()
  const submenuId = useId()
  const filterId = useId()

  /*
   * Aprendo e chiudendo, il layout cambia subito (come in Motion) e il "+" può spostarsi
   * nella pagina (es. barra centrata). Si misura il "+" prima del cambio: dopo, la barra
   * parte da lì e scivola al suo posto con la molla morph (FLIP).
   */
  const barFrom = useRef<DOMRect | null>(null)
  const barAnim = useRef<Animation | null>(null)
  function setOpen(next: boolean) {
    if (next !== open) barFrom.current = triggerRef.current?.getBoundingClientRect() ?? null
    setOpenState(next)
  }
  useLayoutEffect(() => {
    const from = barFrom.current
    barFrom.current = null
    const bar = barRef.current
    const trigger = triggerRef.current
    if (!from || !bar || !trigger || m.state !== 'on' || typeof bar.animate !== 'function') return
    barAnim.current?.cancel()
    const to = trigger.getBoundingClientRect()
    const dx = from.left - to.left
    const dy = from.top - to.top
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
    barAnim.current = bar.animate({ translate: [`${dx}px ${dy}px`, '0px 0px'] }, morphTiming(bar, m.speed))
  }, [open, m.state, m.speed])

  /*
   * Tab i: parte dal centro del "+" (vedi tabDrop). Qui il layout è già quello aperto,
   * quindi con 'left' e 'top' (tab prima del "+") la distanza si conta dalla fine dei tab.
   */
  const tabStyleOf = (i: number) => {
    const d = tabDrop(i, n, direction)
    const before = direction === 'left' || direction === 'top'
    const shift = before ? n * (vertical ? TAB_HEIGHT : TAB_WIDTH) : 0
    const start = d.initial as { x?: number; y?: number }
    const along = (vertical ? start.y : start.x) ?? 0
    const from = along + shift
    return {
      '--tab-from': vertical ? `0 ${from}px` : `${from}px 0`,
      '--tab-delay': `${d.animate.transition.scale.delay}s`,
    } as CSSProperties
  }

  function close() {
    setOpen(false)
    setSubmenu(null)
    setHovered(null)
  }
  /*
   * Senza sottomenu i tab sono una tablist (role="tab", aria-selected);
   * con almeno un sottomenu sono bottoni che aprono un menu (aria-pressed, aria-haspopup)
   */
  const hasSubmenus = tabs.some((t) => t.items?.length)

  /*
   * Dove sta il tab i lungo la barra, rispetto al suo angolo: in riga il pannello
   * copre tutta la barra, in colonna si allinea al tab.
   */
  const tabStartOf = (i: number) => {
    const v = visualIndex(i, tabs.length, direction)
    return vertical
      ? (direction === 'bottom' ? TRIGGER_SIZE : 0) + v * TAB_HEIGHT
      : (direction === 'right' ? TRIGGER_SIZE : 0) + v * TAB_WIDTH
  }

  /*
   * Sottomenu girato sul lato opposto se non c'è spazio: in riga sotto la barra invece
   * che sopra, in colonna a sinistra invece che a destra. Si misura la barra aperta
   * e l'area disponibile (FloatingBoundary più vicino o viewport).
   */
  const [flipped, setFlipped] = useState(false)
  function shouldFlip(i: number) {
    const bar = rootRef.current?.getBoundingClientRect()
    if (!bar) return false
    const h = panelHeight(tabs[i].items?.length ?? 0)
    const top = bar.top + tabStartOf(i)
    const footprint = (side: 'near' | 'far'): Box =>
      vertical
        ? side === 'near'
          ? { left: bar.right, right: bar.right + PANEL_GAP + PANEL_WIDTH, top, bottom: top + h }
          : { left: bar.left - PANEL_GAP - PANEL_WIDTH, right: bar.left, top, bottom: top + h }
        : side === 'near'
          ? { left: bar.left, right: bar.right, top: bar.top - PANEL_GAP - h, bottom: bar.top }
          : { left: bar.left, right: bar.right, top: bar.bottom, bottom: bar.bottom + PANEL_GAP + h }
    return pickSide(['near', 'far'] as const, footprint, availableArea(boundaryRef?.current)) === 'far'
  }

  // Mentre il sottomenu è aperto il lato si ricalcola con scroll (anche nei contenitori) e resize
  useEffect(() => {
    if (submenu === null) return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setFlipped(shouldFlip(submenu)))
    }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  })

  function onTabClick(i: number) {
    setActive(i)
    // Tab senza sottomenu: scelta fatta, si chiude tutto
    if (!tabs[i].items?.length) {
      close()
      triggerRef.current?.focus()
      return
    }
    if (submenu !== null && submenu !== i) {
      // Verso visivo: in colonna con 'top' l'ordine è rovesciato
      setDirection(Math.sign(visualIndex(i, n, direction) - visualIndex(submenu, n, direction)))
    }
    if (submenu !== i) setFlipped(shouldFlip(i))
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

  // Pannello, collo e pillola di rollover restano montati durante la loro uscita
  const panel = usePresence(submenu)
  // Ultimo sottomenu aperto: pannello e collo in uscita restano sul suo tab
  const [lastSubmenu, setLastSubmenu] = useState<number | null>(null)
  if (submenu !== null && submenu !== lastSubmenu) setLastSubmenu(submenu)
  const shownSubmenu = submenu ?? lastSubmenu

  /*
   * Geometria del sottomenu aperto, rispetto all'angolo della barra.
   * Lato del pannello: in riga sopra (o sotto, se girato), in colonna a destra (o a sinistra).
   */
  const tabStart = shownSubmenu !== null ? tabStartOf(shownSubmenu) : 0
  const panelSide = vertical ? (flipped ? 'left' : 'right') : flipped ? 'bottom' : 'top'
  // Verso che va dalla barra al pannello, sull'asse del pannello
  const away = panelSide === 'top' || panelSide === 'left' ? -1 : 1
  /*
   * La goccia parte dentro il tab, schizza un po' oltre il centro dello spazio
   * tra barra e pannello e torna lì, dove resta come collo liquido.
   */
  const neck = vertical
    ? away * (TAB_WIDTH / 2 + PANEL_GAP / 2) // dal centro della colonna al centro dello spazio
    : away * (PANEL_GAP / 2 + DRIP_SIZE / 2) // dal bordo della barra al centro dello spazio
  const overshoot = neck + away * 8
  /*
   * Lungo la barra la goccia segue il tab con la molla (transizione su left/top): cambiando
   * sottomenu il collo scivola da un tab all'altro invece di sparire e ricomparire.
   * Alla prima comparsa nasce già sul tab.
   */
  const neckAlong = tabStart + (vertical ? TAB_HEIGHT : TAB_WIDTH) / 2 - DRIP_SIZE / 2
  const neckShown = attached && open && submenu !== null
  // Se si chiude tutta la barra sparisce subito (vedi sotto)
  const neckPresence = usePresence(neckShown ? true : null, !open)
  const neckRef = useRef<HTMLSpanElement>(null)
  useExit(neckRef, neckPresence.closing, neckPresence.exited)
  const along = (value: number) => (vertical ? `${value}px 0` : `0 ${value}px`)
  const drip = vertical
    ? { left: TAB_WIDTH / 2 - DRIP_SIZE / 2, top: neckAlong }
    : // Parte dal bordo della barra rivolto verso il pannello
      { left: neckAlong, top: flipped ? TAB_HEIGHT - DRIP_SIZE : 0 }
  // Il pannello si gonfia dal punto più vicino al tab
  const panelStyle = vertical
    ? { top: tabStart, width: PANEL_WIDTH, transformOrigin: `${flipped ? PANEL_WIDTH : 0}px ${TAB_HEIGHT / 2}px` }
    : { transformOrigin: `${tabStart + TAB_WIDTH / 2}px ${flipped ? '0%' : '100%'}` }
  /*
   * Unito: il pannello parte schiacciato verso il tab. Staccato: arriva da più lontano,
   * così non si avvicina mai abbastanza alla barra da fondersi col goo
   */
  const panelShift = attached ? -away * 16 : away * 10
  const panelFrom = vertical ? `${panelShift}px 0px` : `0px ${panelShift}px`
  // Area del filtro goo: simmetrica attorno al "+" (vedi barFilterRegion), con spazio per il pannello
  const longest = Math.max(0, ...tabs.map((t) => t.items?.length ?? 0))
  const region = longest
    ? barFilterRegion(n, PANEL_GAP + Math.max(PANEL_WIDTH, panelHeight(longest)) + 60)
    : barFilterRegion(n)

  const panelRef = useRef<HTMLDivElement>(null)
  useExit(panelRef, panel.closing, panel.exited)

  /*
   * Contenuti del pannello (come AnimatePresence mode="popLayout"): quello del sottomenu
   * attuale e quelli che stanno uscendo. first: il contenuto con cui il pannello è nato.
   */
  const [pages, setPages] = useState<{ current: number | null; first: number | null; leaving: number[] }>({
    current: null,
    first: null,
    leaving: [],
  })
  if (panel.value !== pages.current) {
    const next = panel.value
    setPages(
      next === null
        ? { current: null, first: null, leaving: [] }
        : pages.current === null
          ? { current: next, first: next, leaving: [] }
          : { current: next, first: pages.first, leaving: [...pages.leaving.filter((k) => k !== next), pages.current] },
    )
  }
  const dropPage = (key: number) => setPages((p) => ({ ...p, leaving: p.leaving.filter((k) => k !== key) }))
  const slideAlong = (value: number) => (vertical ? `0 ${value}px` : `${value}px 0`)
  const pageStyle = {
    '--page-in': slideAlong(slideDir * 24),
    '--page-out': slideAlong(slideDir * -24),
  } as CSSProperties

  /*
   * Cambiando sottomenu il pannello prende subito l'altezza del nuovo contenuto (quello
   * in uscita è fuori dal flusso): si anima l'altezza dalla vecchia alla nuova (FLIP).
   */
  const panelH = useRef(0)
  const panelAnim = useRef<Animation | null>(null)
  useLayoutEffect(() => {
    const el = panelRef.current
    if (!el) {
      panelH.current = 0
      return
    }
    const from = panelAnim.current ? el.offsetHeight : panelH.current
    panelAnim.current?.cancel()
    panelAnim.current = null
    const to = el.offsetHeight
    panelH.current = to
    if (!from || from === to || m.state !== 'on' || typeof el.animate !== 'function') return
    // L'altezza di style è senza padding
    const content = (h: number) => `${h - PANEL_PADDING * 2}px`
    const anim = el.animate({ height: [content(from), content(to)] }, morphTiming(el, m.speed))
    panelAnim.current = anim
    anim.onfinish = () => {
      if (panelAnim.current === anim) panelAnim.current = null
    }
  }, [pages.current, m.state, m.speed])

  const hover = usePresence(open && hovered !== null ? hovered : null, !open)

  return (
    <GloopMotionProvider {...pickMotionProps(motionProps)}>
      {/* Filtro goo su barra, pannello e gocce: si fondono come liquido */}
      <div
        {...m.rootProps}
        ref={rootRef}
        className="tab-fab-wrap"
        data-direction={direction}
        data-panel={panelSide}
        style={{ ...m.rootProps.style, filter: `url(#${CSS.escape(filterId)})` }}
      >
        {/* Area ampia: il pannello sta sopra la barra, fuori dal suo riquadro */}
        <GooFilter id={filterId} region={region} />

        {/* Goccia che sale dal tab al pannello e resta tra i due come un collo liquido */}
        {neckPresence.value && (
          <span
            ref={neckRef}
            className="goo-drop"
            aria-hidden="true"
            data-closing={neckPresence.closing || undefined}
            style={
              {
                ...drip,
                width: DRIP_SIZE,
                height: DRIP_SIZE,
                '--neck': along(neck),
                '--neck-over': along(overshoot),
                '--neck-scale': NECK_SCALE,
              } as CSSProperties
            }
          />
        )}

        {panel.value !== null && (
          <div
            ref={panelRef}
            id={submenuId}
            role="menu"
            className="tab-fab__panel"
            data-closing={panel.closing || undefined}
            // Il pannello nasce dal tab che lo ha aperto
            style={{ borderRadius: 20, ...panelStyle, ...({ '--panel-from': panelFrom } as CSSProperties) }}
          >
            {[...pages.leaving, pages.current].map((key) => {
              const items = key !== null ? tabs[key]?.items : undefined
              if (key === null || !items) return null
              return (
                <PanelPage
                  key={key}
                  closing={key !== pages.current}
                  initial={key === pages.first}
                  onExited={() => dropPage(key)}
                  style={pageStyle}
                >
                  {/* Stesse voci di List, con la pillola liquida che segue il cursore */}
                  <ListCore
                    items={items.map((item) =>
                      typeof item === 'string' ? { id: item, label: item } : { id: item.label, ...item },
                    )}
                    hover
                    // Qui la pillola è l'unico indicatore: più marcata che in List
                    hoverOpacity={0.1}
                    itemRole="menuitem"
                    onItemClick={() => {
                      close()
                      triggerRef.current?.focus()
                    }}
                  />
                </PanelPage>
              )
            })}
          </div>
        )}

        <div
          ref={barRef}
          className="tab-fab"
          data-direction={direction}
          // Misura dello sfondo (::before): il "+" da chiusa, tutta la barra da aperta
          style={
            {
              borderRadius: 26,
              '--tab-fab-w': `${open && !vertical ? TRIGGER_SIZE + n * TAB_WIDTH : open ? TAB_WIDTH : TRIGGER_SIZE}px`,
              '--tab-fab-h': `${open && vertical ? TRIGGER_SIZE + n * TAB_HEIGHT : TRIGGER_SIZE}px`,
            } as CSSProperties
          }
        >
          <div
            id={barId}
            role={hasSubmenus ? undefined : 'tablist'}
            className="tab-fab__tabs"
            onPointerLeave={() => setHovered(null)}
          >
            {/* Niente uscita animata: chiudendo, i tab spariscono subito */}
            {open && active !== null && (
              <GooPill
                index={visualIndex(active, n, direction)}
                step={vertical ? TAB_HEIGHT : TAB_WIDTH}
                axis={vertical ? 'y' : 'x'}
              />
            )}
            {/* Rollover: pillola più tenue che scorre da un tab all'altro */}
            {open && hover.value !== null && (
              <GooPill
                key="hover"
                index={visualIndex(hover.value, n, direction)}
                step={vertical ? TAB_HEIGHT : TAB_WIDTH}
                axis={vertical ? 'y' : 'x'}
                opacity={0.08}
                closing={hover.closing}
                onExited={hover.exited}
              />
            )}
            {open &&
              tabs.map((tab, i) => (
                <button
                  key={tab.label}
                  ref={(el) => {
                    tabRefs.current[i] = el
                  }}
                  type="button"
                  className="tab-fab__tab"
                  role={hasSubmenus ? undefined : 'tab'}
                  aria-selected={hasSubmenus ? undefined : active === i}
                  aria-pressed={hasSubmenus ? active === i : undefined}
                  aria-haspopup={tab.items?.length ? 'menu' : undefined}
                  aria-expanded={tab.items?.length ? submenu === i : undefined}
                  aria-controls={submenu === i ? submenuId : undefined}
                  style={tabStyleOf(i)}
                  onClick={() => onTabClick(i)}
                  // Solo mouse e penna: al tocco l'hover resterebbe "appeso"
                  onPointerEnter={(e) => e.pointerType !== 'touch' && setHovered(i)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                >
                  <span className="tab-fab__drop" aria-hidden="true" />
                  {/* La pressione scala solo il contenuto (TabFab.css) */}
                  <span className="tab-fab__tab-content">
                    <span className="tab-fab__tab-icon" aria-hidden="true">
                      {tab.icon}
                    </span>
                    <span className="tab-fab__tab-label">{tab.label}</span>
                  </span>
                </button>
              ))}
          </div>

          <button
            ref={triggerRef}
            type="button"
            className="tab-fab__trigger"
            aria-label={label}
            aria-expanded={open}
            aria-controls={barId}
            onClick={() => {
              if (open) return close()
              setActive(null)
              chooseSide()
              setOpen(true)
            }}
          >
            {/* Il "+" ruota e diventa una "×" */}
            <span className="tab-fab__trigger-icon" aria-hidden="true">
              {icon}
            </span>
          </button>
        </div>
      </div>
    </GloopMotionProvider>
  )
}

export default TabFab
