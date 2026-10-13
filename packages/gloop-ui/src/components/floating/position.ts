export type FloatingPlacement = 'top' | 'bottom' | 'left' | 'right'
export type FloatingAlign = 'start' | 'center' | 'end'

export type RectLike = { top: number; left: number; width: number; height: number }
export type Size = { width: number; height: number }

export type PositionOptions = {
  placement: FloatingPlacement
  align: FloatingAlign
  /** Distanza tra trigger e bolla, in px */
  offset: number
  viewport: Size
  /** Distanza minima dai bordi del viewport */
  padding?: number
  /** Distanza minima della freccia dagli angoli della bolla (raggio + metà freccia) */
  arrowInset?: number
}

export type FloatingPosition = {
  x: number
  y: number
  /** Lato effettivo, dopo l'eventuale flip */
  placement: FloatingPlacement
  /** Posizione della freccia lungo il bordo della bolla, in px dal suo inizio */
  arrowOffset: number
  width: number
  height: number
}

const OPPOSITE: Record<FloatingPlacement, FloatingPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

/*
 * Posizione di una bolla accanto al trigger, in coordinate del viewport (position: fixed).
 * - flip: se il lato scelto non ha spazio e quello opposto ne ha di più, si gira
 * - shift: sull'asse trasversale la bolla resta dentro il viewport
 * - la freccia punta sempre al centro del trigger, anche dopo lo shift, senza uscire dagli angoli
 */
export function computePosition(trigger: RectLike, size: Size, opts: PositionOptions): FloatingPosition {
  const { align, offset, viewport, padding = 8, arrowInset = 0 } = opts
  const bottom = trigger.top + trigger.height
  const right = trigger.left + trigger.width

  const space: Record<FloatingPlacement, number> = {
    top: trigger.top - padding,
    bottom: viewport.height - bottom - padding,
    left: trigger.left - padding,
    right: viewport.width - right - padding,
  }

  let placement = opts.placement
  const vertical = placement === 'top' || placement === 'bottom'
  const needed = (vertical ? size.height : size.width) + offset
  if (space[placement] < needed && space[OPPOSITE[placement]] > space[placement]) {
    placement = OPPOSITE[placement]
  }

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
  const room = vertical ? viewport.width : viewport.height
  const aligned = align === 'start' ? start : align === 'end' ? start + length - extent : start + (length - extent) / 2
  // Se la bolla è più grande del viewport resta attaccata al padding (mai coordinate negative)
  const cross = Math.max(padding, Math.min(aligned, room - extent - padding))

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
