export type FloatingSide = 'top' | 'bottom' | 'left' | 'right'
/** Un lato, oppure 'auto': il primo lato in cui la bolla entra (top, bottom, right, left) */
export type FloatingPlacement = FloatingSide | 'auto'
export type FloatingAlign = 'start' | 'center' | 'end'

export type RectLike = { top: number; left: number; width: number; height: number }
export type Size = { width: number; height: number }

export type PositionOptions = {
  placement: FloatingPlacement
  align: FloatingAlign
  /** Distanza tra trigger e bolla, in px */
  offset: number
  viewport: Size
  /** Area in cui deve restare la bolla, in coordinate del viewport (default: tutto il viewport) */
  boundary?: RectLike
  /** Distanza minima dai bordi del viewport */
  padding?: number
  /** Distanza minima della freccia dagli angoli della bolla (raggio + metà freccia) */
  arrowInset?: number
}

export type FloatingPosition = {
  x: number
  y: number
  /** Lato effettivo, dopo l'eventuale flip o la scelta di 'auto' */
  placement: FloatingSide
  /** Posizione della freccia lungo il bordo della bolla, in px dal suo inizio */
  arrowOffset: number
  width: number
  height: number
}

const OPPOSITE: Record<FloatingSide, FloatingSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

// Ordine di preferenza di 'auto': sopra o sotto disturba meno di un lato
const AUTO_ORDER: FloatingSide[] = ['top', 'bottom', 'right', 'left']

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

/*
 * Posizione di una bolla accanto al trigger, in coordinate del viewport (position: fixed).
 * - flip: se il lato scelto non ha spazio si gira sull'opposto, poi su un lato perpendicolare
 * - auto: il primo lato in cui entra (top, bottom, right, left)
 * - se non entra da nessuna parte: il lato che ne lascia fuori meno
 * - shift: sull'asse trasversale la bolla resta dentro il viewport (o dentro boundary)
 * - la freccia punta sempre al centro del trigger, anche dopo lo shift, senza uscire dagli angoli
 */
export function computePosition(trigger: RectLike, size: Size, opts: PositionOptions): FloatingPosition {
  const { align, offset, viewport, padding = 8, arrowInset = 0 } = opts
  const bottom = trigger.top + trigger.height
  const right = trigger.left + trigger.width
  const bounds = opts.boundary ?? { top: 0, left: 0, ...viewport }

  const space: Record<FloatingSide, number> = {
    top: trigger.top - bounds.top - padding,
    bottom: bounds.top + bounds.height - bottom - padding,
    left: trigger.left - bounds.left - padding,
    right: bounds.left + bounds.width - right - padding,
  }

  const needed = (side: FloatingSide) => (side === 'top' || side === 'bottom' ? size.height : size.width) + offset
  const missing = (side: FloatingSide) => needed(side) - space[side]

  // Lati da provare: con un lato scelto prima lui, poi l'opposto, poi i due perpendicolari
  const preferred = opts.placement
  const order =
    preferred === 'auto'
      ? AUTO_ORDER
      : [preferred, OPPOSITE[preferred], ...AUTO_ORDER.filter((s) => s !== preferred && s !== OPPOSITE[preferred])]
  // Il primo in cui entra; se non entra da nessuna parte, quello che ne lascia fuori meno
  const placement =
    order.find((side) => missing(side) <= 0) ?? order.reduce((best, side) => (missing(side) < missing(best) ? side : best))
  const vertical = placement === 'top' || placement === 'bottom'

  // Asse principale: dal lato del trigger
  const main = {
    top: trigger.top - offset - size.height,
    bottom: bottom + offset,
    left: trigger.left - offset - size.width,
    right: right + offset,
  }[placement]

  // Asse trasversale: allineamento, poi shift dentro il viewport
  const start = vertical ? trigger.left : trigger.top
  const length = vertical ? trigger.width : trigger.height
  const extent = vertical ? size.width : size.height
  const min = (vertical ? bounds.left : bounds.top) + padding
  const max = (vertical ? bounds.left + bounds.width : bounds.top + bounds.height) - extent - padding
  const aligned = align === 'start' ? start : align === 'end' ? start + length - extent : start + (length - extent) / 2
  // Se la bolla è più grande dell'area resta attaccata al padding iniziale
  const cross = Math.max(min, Math.min(aligned, max))

  const center = start + length / 2 - cross
  const arrowOffset = extent > arrowInset * 2 ? clamp(center, arrowInset, extent - arrowInset) : extent / 2

  return {
    x: vertical ? cross : main,
    y: vertical ? main : cross,
    placement,
    arrowOffset,
    width: size.width,
    height: size.height,
  }
}
