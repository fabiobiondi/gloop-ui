import { useCallback, useContext, useLayoutEffect, useRef, useState } from 'react'
import { BoundaryContext } from './boundary-context'
import { computePosition, type FloatingAlign, type FloatingPlacement, type FloatingPosition } from './position'

/** Lato del quadrato ruotato che fa da freccia */
export const ARROW = 10
/** Distanza tra trigger e bolla: la freccia sporge di metà diagonale e arriva quasi al trigger */
export const OFFSET = 8
/** Raggio degli angoli della bolla: la freccia non ci finisce sopra */
const ARROW_INSET = 18

type Options = { placement: FloatingPlacement; align: FloatingAlign; offset?: number }

const same = (a: FloatingPosition | null, b: FloatingPosition) =>
  !!a &&
  a.x === b.x &&
  a.y === b.y &&
  a.placement === b.placement &&
  a.arrowOffset === b.arrowOffset &&
  a.width === b.width &&
  a.height === b.height

// Parte del boundary dentro il viewport: se è scrollato fuori, la bolla resta comunque visibile
function visiblePart(rect: DOMRect, viewport: { width: number; height: number }) {
  const top = Math.max(rect.top, 0)
  const left = Math.max(rect.left, 0)
  return {
    top,
    left,
    width: Math.max(0, Math.min(rect.right, viewport.width) - left),
    height: Math.max(0, Math.min(rect.bottom, viewport.height) - top),
  }
}

/*
 * Tiene la bolla (position: fixed) accanto al trigger mentre è aperta:
 * si ricalcola su scroll (anche nei contenitori), resize e cambi di dimensione.
 */
export function useFloating(open: boolean, { placement, align, offset = OFFSET }: Options) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const floatingRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<FloatingPosition | null>(null)
  const boundaryRef = useContext(BoundaryContext)

  const update = useCallback(() => {
    const trigger = triggerRef.current
    const floating = floatingRef.current
    if (!trigger || !floating) return
    const viewport = { width: document.documentElement.clientWidth, height: window.innerHeight }
    const next = computePosition(
      trigger.getBoundingClientRect(),
      // offsetWidth e non getBoundingClientRect: durante l'animazione la bolla è scalata
      { width: floating.offsetWidth, height: floating.offsetHeight },
      {
        placement,
        align,
        offset,
        arrowInset: ARROW_INSET,
        viewport,
        boundary: boundaryRef?.current ? visiblePart(boundaryRef.current.getBoundingClientRect(), viewport) : undefined,
      },
    )
    setPosition((prev) => (same(prev, next) ? prev : next))
  }, [placement, align, offset, boundaryRef])

  // Layout effect: la prima posizione è pronta prima che la bolla venga disegnata
  useLayoutEffect(() => {
    if (!open) return

    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    // Se la bolla non è ancora nel DOM, si riprova al frame successivo
    if (floatingRef.current) update()
    else schedule()
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    const observer = new ResizeObserver(schedule)
    if (triggerRef.current) observer.observe(triggerRef.current)
    if (floatingRef.current) observer.observe(floatingRef.current)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      observer.disconnect()
    }
  }, [open, update])

  return { triggerRef, floatingRef, position }
}
