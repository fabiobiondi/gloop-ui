import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'gloop-ui/styles.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Solo in dev: interruttore Motion / CSS (vedi src/engine.ts). In build il ramo sparisce.
if (import.meta.env.DEV) {
  const { default: EngineSwitch } = await import('./EngineSwitch.tsx')
  const el = document.body.appendChild(document.createElement('div'))
  createRoot(el).render(<EngineSwitch />)
}
