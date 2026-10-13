import { useCallback, useLayoutEffect, useRef, useState } from 'react'
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

/*
 * Tiene la bolla (position: fixed) accanto al trigger mentre è aperta:
 * si ricalcola su scroll (anche nei contenitori), resize e cambi di dimensione.
 */
export function useFloating(open: boolean, { placement, align, offset = OFFSET }: Options) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const floatingRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<FloatingPosition | null>(null)

  const update = useCallback(() => {
    const trigger = triggerRef.current
    const floating = floatingRef.current
    if (!trigger || !floating) return
    const next = computePosition(
      trigger.getBoundingClientRect(),
      // offsetWidth e non getBoundingClientRect: durante l'animazione la bolla è scalata
      { width: floating.offsetWidth, height: floating.offsetHeight },
      {
        placement,
        align,
        offset,
        arrowInset: ARROW_INSET,
        viewport: { width: document.documentElement.clientWidth, height: window.innerHeight },
      },
    )
    setPosition((prev) => (same(prev, next) ? prev : next))
  }, [placement, align, offset])

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
