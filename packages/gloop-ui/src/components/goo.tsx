import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

/*
 * Il filtro goo serve solo mentre le forme si muovono: da ferme sono forme normali, e il
 * filtro (su Safari/iOS calcolato in software) si ricalcolerebbe a ogni repaint, per un
 * hover, un focus o uno scroll. true quando sono finite tutte le animazioni dentro ref
 * partite da quando ready è diventato true o key è cambiata: a quel punto il componente
 * toglie il filtro (e mette un box-shadow al posto dell'ombra di GooFilter).
 * Le animazioni infinite non contano. Senza Web Animations (jsdom) resta false.
 */
export function useSettled(ref: RefObject<Element | null>, ready: boolean, key?: unknown) {
  const [done, setDone] = useState<{ key: unknown } | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!ready || !el || typeof el.getAnimations !== 'function') return
    let live = true
    const running = el
      .getAnimations({ subtree: true })
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
    Promise.allSettled(running.map((a) => a.finished)).then(() => {
      if (live) setDone({ key })
    })
    return () => {
      live = false
    }
  }, [ref, ready, key])
  return ready && done !== null && Object.is(done.key, key)
}

export type GooFilterProps = {
  id: string
  /** Più alto = gocce più "appiccicose" */
  blur?: number
  /**
   * Area del filtro, in px rispetto all'angolo in alto a sinistra dell'elemento.
   * Serve quando i figli escono dall'elemento (es. una barra in position: absolute sopra).
   * Va messo dentro l'elemento filtrato: ne misura il riquadro per convertire l'area in frazioni.
   * Senza, l'area è il riquadro dell'elemento ±50% in larghezza e ±100% in altezza (per l'ombra).
   */
  region?: { x: number; y: number; width: number; height: number }
  /** Ombra sotto le forme già fuse */
  shadow?: boolean
  /** Colore della forma fusa (default --ui-bg) */
  color?: string
}

/*
 * Filtro "goo": sfoca e poi taglia netto la trasparenza, così le forme vicine si
 * fondono come liquido. L'originale viene poi ridisegnato sopra ("over"): testo,
 * icone e focus restano nitidi, il liquido si vede solo nei ponti tra le forme.
 * Ombre e contorni esterni non vanno messi sugli elementi filtrati: verrebbero fusi
 * con la forma (alone attorno ai bordi).
 */
export function GooFilter({ id, blur = 8, region, shadow = true, color = 'var(--ui-bg)' }: GooFilterProps) {
  const filterRef = useRef<SVGFilterElement>(null)
  const { x, y, width, height } = region ?? {}

  /*
   * L'area in px diventa una frazione del riquadro dell'elemento filtrato (objectBoundingBox):
   * Safari/iOS non applica filterUnits="userSpaceOnUse" ai filtri CSS sugli elementi HTML e
   * li nasconde. Si riscrive a ogni cambio di misura, prima del paint: l'area resta ferma
   * in px anche quando il riquadro si allarga o si stringe di colpo
   */
  useLayoutEffect(() => {
    const filter = filterRef.current
    const el = filter?.closest('svg')?.parentElement
    if (x === undefined || !filter || !el) return
    const fit = () => {
      const w = el.offsetWidth || 1
      const h = el.offsetHeight || 1
      filter.setAttribute('x', String(x / w))
      filter.setAttribute('y', String(y! / h))
      filter.setAttribute('width', String(width! / w))
      filter.setAttribute('height', String(height! / h))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [x, y, width, height])

  // Con region gli attributi li scrive l'effetto
  const area = region ? {} : { x: '-50%', y: '-100%', width: '200%', height: '300%' }

  return (
    <svg className="goo-filter" aria-hidden="true" width="0" height="0">
      <filter ref={filterRef} id={id} {...area}>
        <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
        {/* Soglia a 0.5: la forma fusa non esce mai dal bordo vero degli elementi */}
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="goo" />
        {/*
          La forma si riempie con un colore pieno: i colori sfocati (icone, testo, focus)
          darebbero aloni chiari e, con blur ampi, scalini a bassa risoluzione
        */}
        <feFlood style={{ floodColor: color }} result="color" />
        <feComposite in="color" in2="goo" operator="in" result="solid" />
        <feComposite in="SourceGraphic" in2="solid" operator="over" result="shape" />
        {/*
          L'ombra va aggiunta qui, dopo la fusione: un box-shadow verrebbe "fuso" con la forma.
          Riusa il blur già calcolato invece di un feDropShadow: un secondo blur gaussiano
          sull'intera area, che su Safari/iOS (filtri in software) costa quanto la fusione
        */}
        {shadow && (
          <>
            <feOffset in="blur" dy="10" result="offset" />
            <feColorMatrix in="offset" mode="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.25 0" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="shape" />
            </feMerge>
          </>
        )}
      </filter>
    </svg>
  )
}
