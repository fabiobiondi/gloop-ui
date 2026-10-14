import { useId } from 'react'
import type { Guide } from './guides'
import './upcoming.css'

// Ingresso: una gocciolina cade dall'alto, si schiaccia sul fondo, rimbalza
// e si gonfia fino al blob; poi inizia a colare (filtro goo SVG, come il logo)
const INTRO = 1.2
const intro = {
  dur: `${INTRO}s`,
  fill: 'freeze',
  calcMode: 'spline',
  keyTimes: '0;.4;.52;.78;.9;1',
  // caduta accelerata, schiacciata, gonfiata in salita, assestamento
  keySplines: '.55 0 1 .45;0 0 .2 1;.2 .8 .3 1;.45 0 .55 1;.45 0 .55 1',
} as const

function Drop() {
  const id = useId()
  const ease = { calcMode: 'spline', keySplines: '.45 0 .55 1;.45 0 .55 1', repeatCount: 'indefinite', begin: `${INTRO}s` } as const
  return (
    <svg className="soon__blob" viewBox="0 0 100 120" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7ab6" />
          <stop offset="1" stopColor="#7b5cff" />
        </linearGradient>
        <filter id={`${id}-goo`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" />
        </filter>
      </defs>
      <g filter={`url(#${id}-goo)`} fill={`url(#${id}-g)`}>
        <ellipse cx="50" cy="0" rx="9" ry="9" opacity="0">
          <animate attributeName="opacity" values="0;1" dur=".15s" fill="freeze" />
          <animate attributeName="cy" values="0;96;100;36;44;42" {...intro} />
          <animate attributeName="rx" values="9;8;18;29;34;32" {...intro} />
          <animate attributeName="ry" values="9;11;9;36;30;32" {...intro} />
        </ellipse>
        {/* Nascosta (r=0) finché il blob non è formato; ogni ciclo parte da dentro il blob */}
        <circle cx="50" cy="56" r="0">
          <animate attributeName="cy" values="56;102;56" dur="2.8s" {...ease} />
          <animate attributeName="r" values="13;10;13" dur="2.8s" {...ease} />
        </circle>
      </g>
      <ellipse cx="38" cy="28" rx="9" ry="5" fill="#fff" opacity="0" transform="rotate(-30 38 28)">
        <animate attributeName="opacity" values="0;.45" begin={`${INTRO - 0.3}s`} dur=".3s" fill="freeze" />
      </ellipse>
    </svg>
  )
}

// Segnaposto dei componenti in arrivo
function ComingSoon({ ideas }: { ideas: string[] }) {
  return (
    <div className="soon">
      <Drop />
      <p className="soon__title">Coming soon</p>
      <p className="soon__text">This component is still dripping out of the lab.</p>
      <ul className="soon__ideas" aria-label="Planned">
        {ideas.map((idea) => (
          <li key={idea}>{idea}</li>
        ))}
      </ul>
    </div>
  )
}

const soon = (id: string, name: string, description: string, ideas: string[]): Guide => ({
  id,
  name,
  description,
  content: <ComingSoon ideas={ideas} />,
})

export const upcoming: Guide[] = [
  soon('progress-bar', 'ProgressBar', 'A bar that fills up like liquid.', [
    'Determinate and indeterminate',
    'Drops that run ahead of the fill',
  ]),
  soon('bar-chart', 'Bar Chart', 'Bars that rise and wobble like jelly when the data changes.', [
    'Animated updates',
    'Tooltips on every bar',
  ]),
  soon('form-components', 'Forms components', 'More form controls in the same liquid style as Input.', [
    'Checkbox and radio',
    'Switch',
    'Select',
  ]),
  soon('modals', 'Modals', 'Full-size modals and sheets, beyond the compact Dialog.', [
    'Bottom sheet on mobile',
    'Scrollable content',
  ]),
  soon('side-panel', 'SidePanel', 'A panel that oozes in from the edge of the screen.', [
    'Left or right',
    'Drag to close',
  ]),
]
