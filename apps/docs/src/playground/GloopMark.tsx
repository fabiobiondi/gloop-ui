import { useId } from 'react'

// Il marchio piccolo "Squircle Splat" (bozza #8 di logo-drafts.html): la "g" in un quadrato che cola.
// Fermo, senza animazione: nella sidebar resta sempre visibile e non deve distrarre
export function GloopMark({ className }: { className?: string }) {
  // Id unici: gradiente e filtro vivono nel documento, non nell'SVG
  const id = useId()
  const gradient = `${id}-g`
  const goo = `${id}-goo`

  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1="20" y1="20" x2="180" y2="190">
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
        <rect x="30" y="12" width="140" height="132" rx="50" />
        <circle cx="68" cy="156" r="13" />
        <circle cx="118" cy="160" r="16" />
        <circle cx="148" cy="148" r="9" />
      </g>
      <text
        x="100"
        y="104"
        textAnchor="middle"
        fontFamily="Fredoka, Nunito, ui-rounded, sans-serif"
        fontWeight="700"
        fontSize="100"
        fill="#fff"
      >
        g
      </text>
      <ellipse cx="60" cy="36" rx="14" ry="8" fill="#fff" opacity=".4" transform="rotate(-25 60 36)" />
    </svg>
  )
}
