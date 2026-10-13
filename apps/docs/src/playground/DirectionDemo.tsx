import { useState, type ReactNode } from 'react'
import type { TabMenuDirection } from 'gloop-ui'
import './DirectionDemo.css'

const DIRECTIONS: TabMenuDirection[] = ['top', 'bottom', 'left', 'right']

/*
 * Selettore della direction sopra l'anteprima. Cambiando direzione il componente
 * si rimonta (key): riparte chiuso e senza tab selezionati.
 */
export function DirectionDemo({
  initial,
  children,
}: {
  initial: TabMenuDirection
  children: (direction: TabMenuDirection) => ReactNode
}) {
  const [direction, setDirection] = useState(initial)

  return (
    <div className="dd">
      <div className="dd__picker" role="radiogroup" aria-label="direction">
        {DIRECTIONS.map((d) => (
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
