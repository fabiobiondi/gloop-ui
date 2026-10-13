import { createContext, useContext, useState } from 'react'
import type { Transition, Variants } from 'motion/react'

/*
 * Menu annidabile a qualsiasi profondità.
 * Lo stato è un "percorso" di popover aperti, es. ['stroke', 'stroke-width']:
 * aprire un popover a profondità N chiude i fratelli e tutto ciò che sta sotto.
 */

export type MenuContextValue = {
  rootId: string
  depth: number
  path: string[]
  toggle: (id: string, depth: number) => void
  dismiss: () => void
}

export const MenuContext = createContext<MenuContextValue | null>(null)

export function useMenu() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('Menu components must be used inside <MenuRoot>')
  return ctx
}

/** Chiude il popover che contiene il componente e riporta il focus sul suo trigger */
export function useDismiss() {
  return useMenu().dismiss
}

/** Id nuovo a ogni montaggio: evita che un layoutId "voli" dalla posizione della volta precedente */
export function useMountId() {
  const [id] = useState(() => Math.random().toString(36).slice(2))
  return id
}

export const triggerId = (rootId: string, id: string) => `${rootId}-${id}-trigger`

export const spring: Transition = { type: 'spring', duration: 0.35, bounce: 0.2 }
export const glide: Transition = { type: 'spring', duration: 0.35, bounce: 0.15 }
export const exitFast: Transition = { duration: 0.12, ease: 'easeOut' }

/** Variante per gli elementi dentro un popover: entrano a cascata */
export const itemVariants: Variants = {
  closed: { opacity: 0, y: 4, transition: { duration: 0.08 } },
  open: { opacity: 1, y: 0, transition: spring },
}

export function panelVariants(placement: 'top' | 'bottom'): Variants {
  const y = placement === 'top' ? 6 : -6
  return {
    closed: { opacity: 0, scale: 0.96, y, filter: 'blur(2px)', transition: exitFast },
    open: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { ...spring, staggerChildren: 0.012, delayChildren: 0.02 },
    },
  }
}
