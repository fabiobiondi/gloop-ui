import { useId } from 'react'
import { ExpandButton } from 'gloop-ui'
import { HeartIcon } from './icons'
import './Home.css'

// Il logo "Splat Button" (bozza #9 di logo-drafts.html): la scritta dentro un bottone che cola
function SplatLogo() {
  // Id unici: gradiente e filtro vivono nel documento, non nell'SVG
  const id = useId()
  const gradient = `${id}-g`
  const goo = `${id}-goo`
  const ease = { calcMode: 'spline', keySplines: '.45 0 .55 1;.45 0 .55 1', repeatCount: 'indefinite' } as const

  return (
    <svg className="home-logo" viewBox="0 0 360 170" role="img" aria-label="gloop-ui">
      <defs>
        <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1="14" y1="14" x2="346" y2="160">
          <stop offset="0" stopColor="#ff7ab6" />
          <stop offset=".55" stopColor="#c86bfa" />
          <stop offset="1" stopColor="#7b5cff" />
        </linearGradient>
        <filter id={goo} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b" />
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
        </filter>
      </defs>
      <g filter={`url(#${goo})`} fill={`url(#${gradient})`}>
        <rect x="14" y="14" width="332" height="104" rx="48" />
        {/* Ogni goccia parte tutta dentro il bottone (fondo a y=118) e ne esce colando: al caricamento è un bottone pulito, poi inizia a colare */}
        <circle cx="74" cy="100" r="12">
          <animate attributeName="cy" values="100;140;100" dur="3.6s" begin=".8s" {...ease} />
        </circle>
        <circle cx="132" cy="96" r="17">
          <animate attributeName="cy" values="96;152;96" dur="4.4s" begin="1.5s" {...ease} />
        </circle>
        <circle cx="214" cy="104" r="10">
          <animate attributeName="cy" values="104;134;104" dur="3s" begin="1.1s" {...ease} />
        </circle>
        <circle cx="272" cy="98" r="15">
          <animate attributeName="cy" values="98;148;98" dur="3.9s" begin="1.9s" {...ease} />
        </circle>
        <circle cx="318" cy="106" r="8">
          <animate attributeName="cy" values="106;126;106" dur="2.7s" begin="1.3s" repeatCount="indefinite" />
        </circle>
      </g>
      <text
        x="180"
        y="86"
        textAnchor="middle"
        fontFamily="Fredoka, Nunito, ui-rounded, sans-serif"
        fontWeight="700"
        fontSize="60"
        letterSpacing="-1"
        fill="#fff"
      >
        gloop<tspan opacity=".75">-ui</tspan>
      </text>
      <ellipse cx="56" cy="34" rx="18" ry="7" fill="#fff" opacity=".4" transform="rotate(-14 56 34)" />
    </svg>
  )
}

const FEATURES = [
  {
    title: 'Liquid by design',
    text: 'Every shape is made of blobs that merge and split, driven by an SVG goo filter and springs.',
  },
  {
    title: 'Real components',
    text: 'Menus, dialogs, popovers, inputs, sliders. Keyboard and screen reader friendly, calm with reduced motion.',
  },
  {
    title: 'Themed in three lines',
    text: 'Three CSS variables color everything. Set yours and every component follows.',
  },
]

export function Home() {
  return (
    <div className="home">
      <section className="home-hero">
        <SplatLogo />
        <h1 className="home-title">What is Gloop?</h1>
        <p className="home-lead">
          React components that move like liquid. Menus drip out of buttons, dialogs swell open like a drop, tabs melt
          into each other.
        </p>
        <div className="home-cta">
          <a className="home-btn home-btn--primary" href="#getting-started">
            Get started
          </a>
          <a className="home-btn" href="#circle-menu">
            Browse components
          </a>
        </div>
        <div className="home-try">
          <ExpandButton icon={HeartIcon} label="Gloopy!" activeColor="#ff7ab6" drip />
          <span>Tap it</span>
        </div>
      </section>

      <ul className="home-features">
        {FEATURES.map((f) => (
          <li key={f.title}>
            <h2>{f.title}</h2>
            <p>{f.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
