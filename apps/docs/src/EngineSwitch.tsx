import { engine, type Engine } from './engine'
import './EngineSwitch.css'

/*
 * Solo in dev: passa dai componenti con Motion alle copie animate in CSS e ritorno.
 * Ricarica la pagina (stesso hash) perché si può caricare un solo motore alla volta.
 */
function EngineSwitch() {
  function pick(next: Engine) {
    if (next === engine) return
    const url = new URL(location.href)
    if (next === 'css') url.searchParams.set('engine', 'css')
    else url.searchParams.delete('engine')
    location.assign(url)
  }

  return (
    <div className="engine-switch" role="group" aria-label="Animation engine">
      {(['motion', 'css'] as const).map((e) => (
        <button key={e} type="button" aria-pressed={engine === e} onClick={() => pick(e)}>
          {e === 'motion' ? 'Motion' : 'CSS'}
        </button>
      ))}
    </div>
  )
}

export default EngineSwitch
