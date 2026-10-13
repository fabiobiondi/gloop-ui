const dropSpring = { type: 'spring', stiffness: 260, damping: 18, mass: 0.9 } as const
const dropExit = { type: 'spring', stiffness: 520, damping: 40 } as const

/** Lato del "+" da cui esce la barra */
export type TabMenuDirection = 'top' | 'bottom' | 'left' | 'right'

export const TAB_WIDTH = 68
export const TAB_HEIGHT = 52
export const TRIGGER_SIZE = 52

export const isVertical = (d: TabMenuDirection) => d === 'top' || d === 'bottom'

/*
 * Posizione visiva del tab i lungo la barra, contata dall'inizio del contenitore dei tab.
 * In colonna il primo tab è sempre il più vicino al "+": con 'top' (tab sopra il "+")
 * l'ordine visivo è rovesciato.
 */
export const visualIndex = (i: number, count: number, d: TabMenuDirection) => (d === 'top' ? count - 1 - i : i)

/*
 * Animazione dei tab nelle tabbar che nascono dal "+": ogni tab viaggia su una goccia
 * (.tab-menu-motion__drop, dietro lo sfondo della barra). All'apertura schizza dal "+"
 * verso il suo posto, più veloce della barra che si allarga: fuori dalla barra la goccia
 * si vede e il filtro goo la lega al resto. In chiusura viene risucchiata nel "+".
 * Le distanze puntano al centro del "+", misurato dall'inizio del contenitore dei tab:
 * - 'left' / 'top': i tab stanno prima del "+", che da aperta è dopo tutti i tab
 *   e da chiusa (contenitore vuoto) subito all'inizio;
 * - 'right' / 'bottom': il "+" sta prima dei tab, sempre mezzo "+" prima dell'inizio.
 */
export function tabDrop(i: number, count: number, direction: TabMenuDirection = 'left') {
  const vertical = isVertical(direction)
  const size = vertical ? TAB_HEIGHT : TAB_WIDTH
  const before = direction === 'left' || direction === 'top'
  const v = visualIndex(i, count, direction)
  const center = v * size + size / 2
  const openTrigger = before ? count * size + TRIGGER_SIZE / 2 : -TRIGGER_SIZE / 2
  const closedTrigger = before ? TRIGGER_SIZE / 2 : -TRIGGER_SIZE / 2
  // Prima parte la goccia più vicina al "+"
  const delay = (before ? count - 1 - v : v) * 0.04
  // Spostamento e molla sull'asse della barra
  const along = <T,>(value: T) => (vertical ? { y: value } : { x: value })

  return {
    initial: { ...along(openTrigger - center), scale: 0.5, opacity: 0 },
    animate: {
      ...along(0),
      scale: 1,
      opacity: 1,
      transition: {
        ...along({ ...dropSpring, delay }),
        scale: { ...dropSpring, delay },
        opacity: { duration: 0.15, delay },
      },
    },
    exit: {
      ...along(closedTrigger - center),
      scale: 0.4,
      opacity: 0,
      transition: { ...dropExit, opacity: { duration: 0.2 } },
    },
  }
}

// Feedback di pressione per il contenuto dei tab (vedi whileTap="pressed")
export const pressed = { pressed: { scale: 0.95 } }
