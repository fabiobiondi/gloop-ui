const dropSpring = { type: 'spring', stiffness: 260, damping: 18, mass: 0.9 } as const

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
 * si vede e il filtro goo la lega al resto.
 * La distanza punta al centro del "+" com'era da chiuso: all'apertura Motion disegna la
 * barra partendo dal riquadro di prima (il solo "+"), quindi il punto di partenza è
 * mezzo "+" dall'inizio della barra, qualunque sia il lato. Misurata dall'inizio del
 * contenitore dei tab:
 * - 'left' / 'top': i tab iniziano dove inizia la barra, il "+" chiuso è a mezzo "+";
 * - 'right' / 'bottom': i tab iniziano dopo il "+", che è mezzo "+" prima del loro inizio.
 *
 * In chiusura i tab spariscono subito: la barra si restringe nel "+" con un'animazione
 * di layout che la scala, e i tab in uscita (popLayout, fuori dal flusso) non vengono
 * compensati. Visibili, si vedrebbero stirati e lanciati lontano dalla barra.
 */
export function tabDrop(i: number, count: number, direction: TabMenuDirection = 'left') {
  const vertical = isVertical(direction)
  const size = vertical ? TAB_HEIGHT : TAB_WIDTH
  const before = direction === 'left' || direction === 'top'
  const v = visualIndex(i, count, direction)
  const center = v * size + size / 2
  const closedTrigger = before ? TRIGGER_SIZE / 2 : -TRIGGER_SIZE / 2
  // Prima parte la goccia più vicina al "+"
  const delay = (before ? count - 1 - v : v) * 0.04
  // Spostamento e molla sull'asse della barra
  const along = <T,>(value: T) => (vertical ? { y: value } : { x: value })

  return {
    initial: { ...along(closedTrigger - center), scale: 0.5, opacity: 0 },
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
    exit: { opacity: 0, transition: { duration: 0 } },
  }
}

/*
 * Area del filtro goo delle barre che nascono dal "+", in px rispetto all'angolo del contenitore.
 * Simmetrica attorno al "+": in chiusura il riquadro del contenitore si riduce subito al "+",
 * mentre la barra disegnata (animazione di layout) è ancora lunga e si restringe verso di lui.
 * Un'area in percentuale seguirebbe il riquadro e taglierebbe la barra dal lato in cui cresce.
 * extra: margine in più su ogni lato (ombra, gocce, pannelli dei sottomenu).
 */
export function barFilterRegion(count: number, extra = 60) {
  const x = count * TAB_WIDTH + extra
  const y = count * TAB_HEIGHT + extra
  return { x: -x, y: -y, width: 2 * x + TRIGGER_SIZE, height: 2 * y + TRIGGER_SIZE }
}

// Feedback di pressione per il contenuto dei tab (vedi whileTap="pressed")
export const pressed = { pressed: { scale: 0.95 } }
