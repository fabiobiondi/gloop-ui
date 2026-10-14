import { useState } from 'react'
import { entries, type Entry } from './demos'
import './ComponentGrid.css'

/*
 * Una card: l'anteprima è sempre visibile ma inerte; al primo rollover (o focus/tap) diventa
 * utilizzabile e resta tale, così menu, popover e dialog aperti non spariscono quando il
 * puntatore esce dalla card.
 */
function ComponentCard({ entry }: { entry: Entry }) {
  const [live, setLive] = useState(false)
  const wake = () => setLive(true)
  const preview = entry.card ?? entry.demos[0]?.preview

  return (
    <li className="cgrid-card" onPointerEnter={wake} onFocus={wake}>
      <div className="cgrid-stage" data-live={live || undefined}>
        {/* inert: niente click né focus finché la card non è attiva */}
        <div className="cgrid-preview" inert={!live}>
          {preview}
        </div>
        {!live && (
          <span className="cgrid-hint" aria-hidden="true">
            Hover to try
          </span>
        )}
      </div>
      <a className="cgrid-info" href={`#${entry.id}`}>
        <span className="cgrid-name">
          {entry.name}
          {entry.status === 'experimental' && <span className="cgrid-badge">experimental</span>}
        </span>
        <span className="cgrid-desc">{entry.description}</span>
      </a>
    </li>
  )
}

// ShapeEditor è pensato a tutta pagina: nella griglia non ci sta
const HIDDEN = new Set(['shape-editor'])

// I componenti della libreria, nell'ordine della sidebar
export function ComponentGrid() {
  return (
    <section className="cgrid" aria-labelledby="cgrid-title">
      <h2 id="cgrid-title" className="cgrid-title">
        Components
      </h2>
      <ul className="cgrid-list">
        {entries
          .filter((entry) => !HIDDEN.has(entry.id))
          .map((entry) => (
            <ComponentCard key={entry.id} entry={entry} />
          ))}
      </ul>
    </section>
  )
}
