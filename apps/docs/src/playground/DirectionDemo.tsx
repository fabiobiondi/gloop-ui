import { useState, type ReactNode } from 'react'
import { FloatingBoundary, type TabMenuDirection } from 'gloop-ui'
import './DirectionDemo.css'

const DIRECTIONS: TabMenuDirection[] = ['top', 'bottom', 'left', 'right']

/*
 * Selettore della direction sopra l'anteprima. Cambiando direzione il componente
 * si rimonta (key): riparte chiuso e senza tab selezionati.
 * options e label lo riusano per altre prop a scelta (es. enterFrom della TabBar).
 */
export function DirectionDemo<T extends string = TabMenuDirection>({
  initial,
  options = DIRECTIONS as T[],
  label = 'direction',
  children,
}: {
  initial: T
  options?: T[]
  label?: string
  children: (direction: T) => ReactNode
}) {
  const [direction, setDirection] = useState(initial)

  return (
    <div className="dd">
      <div className="dd__picker" role="radiogroup" aria-label={label}>
        {options.map((d) => (
          <button key={d} type="button" role="radio" aria-checked={d === direction} onClick={() => setDirection(d)}>
            {d}
          </button>
        ))}
      </div>
      <div className="dd__stage" key={direction}>
        {children(direction)}
      </div>
    </div>
  )
}

const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const
type Corner = (typeof CORNERS)[number]

/*
 * direction="auto": il menu sta in un angolo di un FloatingBoundary (l'area tratteggiata)
 * e all'apertura sceglie il lato in cui c'è spazio. Ancorato all'angolo, cresce verso l'interno.
 */
export function AutoPlacementDemo({ children }: { children: ReactNode }) {
  const [corner, setCorner] = useState<Corner>('top-left')
  const [v, h] = corner.split('-') as ['top' | 'bottom', 'left' | 'right']

  return (
    <div className="dd">
      <div className="dd__picker" role="radiogroup" aria-label="corner">
        {CORNERS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={c === corner} onClick={() => setCorner(c)}>
            {c}
          </button>
        ))}
      </div>
      <FloatingBoundary className="dd__area">
        <div key={corner} className="dd__corner" style={{ [v]: 16, [h]: 16 }}>
          {children}
        </div>
      </FloatingBoundary>
    </div>
  )
}
