import { useId } from 'react'
import type { Guide } from './guides'
import './upcoming.css'

// Una goccia che si stacca e rientra (filtro goo SVG, come il logo)
function Drop() {
  const id = useId()
  const ease = { calcMode: 'spline', keySplines: '.45 0 .55 1;.45 0 .55 1', repeatCount: 'indefinite' } as const
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
        <circle cx="50" cy="42" r="32" />
        <circle cx="50" cy="78" r="12">
          <animate attributeName="cy" values="74;102;74" dur="2.8s" {...ease} />
          <animate attributeName="r" values="13;10;13" dur="2.8s" {...ease} />
        </circle>
      </g>
      <ellipse cx="38" cy="28" rx="9" ry="5" fill="#fff" opacity=".45" transform="rotate(-30 38 28)" />
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
