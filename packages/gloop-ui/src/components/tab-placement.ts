import { TAB_HEIGHT, TAB_WIDTH, type TabPopDirection } from './tab-drop'
import type { RectLike } from './floating/position'
import { visiblePart } from './floating/useFloating'

/** Un lato fisso, oppure 'auto': il primo lato in cui la barra entra nello spazio disponibile */
export type TabPopPlacement = TabPopDirection | 'auto'

/** Riquadro in coordinate del viewport */
export type Box = { top: number; left: number; right: number; bottom: number }

/** Distanza minima dai bordi dell'area disponibile, in px */
const PADDING = 8

// Ordini di 'auto': TabPop come Tooltip/Popover (sopra o sotto disturba meno di un lato),
// le barre che nascono dal "+" prima in orizzontale, come il loro default
export const DETACHED_ORDER: TabPopDirection[] = ['top', 'bottom', 'right', 'left']
export const MORPH_ORDER: TabPopDirection[] = ['left', 'right', 'top', 'bottom']

/** Quanti px del riquadro escono dall'area (somma sui quattro lati) */
export function overflow(box: Box, bounds: RectLike, padding = PADDING) {
  return (
    Math.max(0, bounds.left + padding - box.left) +
    Math.max(0, box.right - (bounds.left + bounds.width - padding)) +
    Math.max(0, bounds.top + padding - box.top) +
    Math.max(0, box.bottom - (bounds.top + bounds.height - padding))
  )
}

/** Il primo lato in cui il riquadro entra; se non entra da nessuna parte, quello che esce meno */
export function pickSide<S extends string>(order: S[], footprint: (side: S) => Box, bounds: RectLike): S {
  let best = order[0]
  let least = Infinity
  for (const side of order) {
    const out = overflow(footprint(side), bounds)
    if (out === 0) return side
    if (out < least) {
      best = side
      least = out
    }
  }
  return best
}

/*
 * Ingombro della barra aperta attorno al "+" (trigger), per ogni lato.
 * - 'detached' (TabPop): una riga di tab a `gap` px dal "+", centrata sull'altro asse
 * - 'morph' (TabFab): la barra comprende il "+" e cresce da lì;
 *   in colonna è larga un tab e centrata sul "+"
 */
export function barFootprint(
  trigger: RectLike,
  side: TabPopDirection,
  count: number,
  kind: 'detached' | 'morph',
  gap = 16,
): Box {
  const t = { top: trigger.top, left: trigger.left, right: trigger.left + trigger.width, bottom: trigger.top + trigger.height }
  const cx = trigger.left + trigger.width / 2
  const cy = trigger.top + trigger.height / 2

  if (kind === 'detached') {
    const w = count * TAB_WIDTH
    const h = TAB_HEIGHT
    switch (side) {
      case 'top':
        return { top: t.top - gap - h, bottom: t.top, left: cx - w / 2, right: cx + w / 2 }
      case 'bottom':
        return { top: t.bottom, bottom: t.bottom + gap + h, left: cx - w / 2, right: cx + w / 2 }
      case 'left':
        return { left: t.left - gap - w, right: t.left, top: cy - h / 2, bottom: cy + h / 2 }
      case 'right':
        return { left: t.right, right: t.right + gap + w, top: cy - h / 2, bottom: cy + h / 2 }
    }
  }

  switch (side) {
    case 'left':
      return { ...t, left: t.left - count * TAB_WIDTH }
    case 'right':
      return { ...t, right: t.right + count * TAB_WIDTH }
    case 'top':
      return { top: t.top - count * TAB_HEIGHT, bottom: t.bottom, left: cx - TAB_WIDTH / 2, right: cx + TAB_WIDTH / 2 }
    case 'bottom':
      return { top: t.top, bottom: t.bottom + count * TAB_HEIGHT, left: cx - TAB_WIDTH / 2, right: cx + TAB_WIDTH / 2 }
  }
}

/** Area disponibile: il FloatingBoundary più vicino (la sua parte visibile) o il viewport */
export function availableArea(boundary: HTMLElement | null | undefined): RectLike {
  const viewport = { width: document.documentElement.clientWidth, height: window.innerHeight }
  return boundary ? visiblePart(boundary.getBoundingClientRect(), viewport) : { top: 0, left: 0, ...viewport }
}

/** Lato effettivo: con 'auto' si misura lo spazio attorno al "+" (solo all'apertura) */
export function resolveDirection(
  placement: TabPopPlacement,
  trigger: HTMLElement | null,
  boundary: HTMLElement | null | undefined,
  count: number,
  kind: 'detached' | 'morph',
): TabPopDirection {
  const order = kind === 'detached' ? DETACHED_ORDER : MORPH_ORDER
  if (placement !== 'auto') return placement
  if (!trigger) return order[0]
  const rect = trigger.getBoundingClientRect()
  return pickSide(order, (side) => barFootprint(rect, side, count, kind), availableArea(boundary))
}
