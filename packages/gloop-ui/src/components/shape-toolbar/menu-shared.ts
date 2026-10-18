import { createContext, useContext, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { cssDuration } from '../css-time'

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

/** Id nuovo a ogni montaggio: evita che un elemento condiviso "voli" dalla posizione della volta precedente */
export function useMountId() {
  const [id] = useState(() => Math.random().toString(36).slice(2))
  return id
}

export const triggerId = (rootId: string, id: string) => `${rootId}-${id}-trigger`

/*
 * Le molle sono easing linear() in ShapeEditor.css (--st-spring, --st-glide, ...),
 * una curva per preset. Il JS le legge da lì quando anima con element.animate().
 */

/** Chiama done quando sono finite le animazioni CSS dell'elemento e dei figli (subito se non ce ne sono) */
export function afterAnimations(el: Element | null, done: () => void) {
  let live = true
  const check = () => {
    if (!live) return
    const running = el?.getAnimations?.({ subtree: true }).filter((a) => a.playState !== 'finished') ?? []
    if (!running.length) return done()
    // Un'animazione interrotta (o sostituita) non deve bloccare l'uscita: si ricontrolla
    Promise.allSettled(running.map((a) => a.finished)).then(check)
  }
  check()
  return () => {
    live = false
  }
}

/*
 * Al posto di AnimatePresence: l'elemento resta montato con closing = true finché le
 * transizioni di uscita (data-closing nel CSS) non finiscono. Con animated={false} il CSS
 * non ha transizioni, quindi si smonta subito. Se si riapre a metà, le transizioni CSS
 * ripartono dal valore corrente.
 */
export function usePresence<T extends HTMLElement>(show: boolean) {
  const ref = useRef<T>(null)
  const [mounted, setMounted] = useState(show)
  if (show && !mounted) setMounted(true)
  const closing = mounted && !show

  useLayoutEffect(() => {
    if (!closing) return
    return afterAnimations(ref.current, () => setMounted(false))
  }, [closing])

  return { ref, mounted: mounted || show, closing }
}

/** Ritardi a cascata: --st-delay su ogni elemento, in ms (il CSS li divide per la velocità) */
export function setStagger(els: HTMLElement[], delay: (i: number, n: number) => number) {
  els.forEach((el, i) => el.style.setProperty('--st-delay', `${delay(i, els.length)}ms`))
}

/** Ultima posizione degli elementi condivisi appena smontati, per chiave */
const lastRects = new Map<string, DOMRect>()

/*
 * Al posto di layoutId: un solo elemento per chiave (evidenziatore, anello, pillola di hover).
 * Quando sparisce da un punto e compare in un altro nello stesso commit, il nuovo parte
 * dalla posizione e dalla misura del vecchio e ci arriva con la molla `curve` (FLIP).
 * Si anima width/height e non scale, così il bordo arrotondato non si deforma.
 */
export function useSharedLayout(key: string, ref: RefObject<HTMLElement | null>, curve: string) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const from = lastRects.get(key)
    lastRects.delete(key)

    // Come Motion con movimento ridotto: niente animazioni di layout
    if (from && el.animate && el.closest('[data-motion]')?.getAttribute('data-motion') === 'on') {
      const to = el.getBoundingClientRect()
      const css = getComputedStyle(el)
      const easing = css.getPropertyValue(`--st-${curve}`).trim() || 'ease-out'
      const ms = cssDuration(css, `--st-${curve}-ms`, 350)
      const speed = parseFloat(css.getPropertyValue('--ui-motion-speed')) || 1
      el.animate(
        [
          {
            translate: `${from.left - to.left}px ${from.top - to.top}px`,
            width: `${from.width}px`,
            height: `${from.height}px`,
          },
          { translate: '0px 0px', width: `${to.width}px`, height: `${to.height}px` },
        ],
        { duration: ms / speed, easing },
      )
    }

    return () => {
      // Il cleanup gira prima che React tolga il nodo dal DOM: la misura è ancora valida
      if (!el.isConnected) return
      const rect = el.getBoundingClientRect()
      lastRects.set(key, rect)
      // Vale solo per chi monta nello stesso commit: se nessuno lo sostituisce, si dimentica
      queueMicrotask(() => {
        if (lastRects.get(key) === rect) lastRects.delete(key)
      })
    }
  }, [key, ref, curve])
}
