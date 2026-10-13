type GooFilterProps = {
  id: string
  /** Più alto = gocce più "appiccicose" */
  blur?: number
  /**
   * Area del filtro, in px rispetto all'angolo in alto a sinistra dell'elemento.
   * Serve quando i figli escono dall'elemento (es. una barra in position: absolute sopra).
   * Senza, l'area è il riquadro dell'elemento ±50% in larghezza e ±100% in altezza (per l'ombra).
   */
  region?: { x: number; y: number; width: number; height: number }
  /** Ombra sotto le forme già fuse */
  shadow?: boolean
}

/*
 * Filtro "goo": sfoca e poi taglia netto la trasparenza, così le forme vicine si
 * fondono come liquido. L'originale viene poi ridisegnato sopra ("over"): testo,
 * icone e focus restano nitidi, il liquido si vede solo nei ponti tra le forme.
 * Ombre e contorni esterni non vanno messi sugli elementi filtrati: verrebbero fusi
 * con la forma (alone attorno ai bordi).
 */
export function GooFilter({ id, blur = 8, region, shadow = true }: GooFilterProps) {
  const area = region
    ? { filterUnits: 'userSpaceOnUse' as const, ...region }
    : { x: '-50%', y: '-100%', width: '200%', height: '300%' }

  return (
    <svg className="goo-filter" aria-hidden="true" width="0" height="0">
      <filter id={id} {...area}>
        <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
        {/* Soglia a 0.5: la forma fusa non esce mai dal bordo vero degli elementi */}
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="goo" />
        {/*
          La forma si riempie con un colore pieno: i colori sfocati (icone, testo, focus)
          darebbero aloni chiari e, con blur ampi, scalini a bassa risoluzione
        */}
        <feFlood style={{ floodColor: 'var(--ui-bg)' }} result="color" />
        <feComposite in="color" in2="goo" operator="in" result="solid" />
        <feComposite in="SourceGraphic" in2="solid" operator="over" />
        {/* L'ombra va aggiunta qui, dopo la fusione: un box-shadow verrebbe "fuso" con la forma */}
        {shadow && <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000" floodOpacity="0.25" />}
      </filter>
    </svg>
  )
}
