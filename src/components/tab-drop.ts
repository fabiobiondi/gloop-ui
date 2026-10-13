const dropSpring = { type: 'spring', stiffness: 260, damping: 18, mass: 0.9 } as const
const dropExit = { type: 'spring', stiffness: 520, damping: 40 } as const

/*
 * Animazione dei tab nelle tabbar che nascono dal "+": ogni tab viaggia su una goccia
 * (.tab-menu-motion__drop, dietro lo sfondo della barra). All'apertura schizza dal "+"
 * verso il suo posto, più veloce della barra che si allarga: fuori dalla barra la goccia
 * si vede e il filtro goo la lega al resto. In chiusura viene risucchiata nel "+".
 * Le distanze puntano alla posizione finale del "+": a destra da aperta, a sinistra da chiusa.
 */
export function tabDrop(i: number, count: number, tabWidth = 68, triggerSize = 52) {
  const center = i * tabWidth + tabWidth / 2
  const delay = (count - 1 - i) * 0.04 // prima parte la goccia più vicina al "+"
  return {
    initial: { x: count * tabWidth + triggerSize / 2 - center, scale: 0.5, opacity: 0 },
    animate: {
      x: 0,
      scale: 1,
      opacity: 1,
      transition: {
        x: { ...dropSpring, delay },
        scale: { ...dropSpring, delay },
        opacity: { duration: 0.15, delay },
      },
    },
    exit: {
      x: triggerSize / 2 - center,
      scale: 0.4,
      opacity: 0,
      transition: { ...dropExit, opacity: { duration: 0.2 } },
    },
  }
}

// Feedback di pressione per il contenuto dei tab (vedi whileTap="pressed")
export const pressed = { pressed: { scale: 0.95 } }
