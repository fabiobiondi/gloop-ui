import { useId, type CSSProperties, type ReactNode } from 'react'
import { useGloopMotion, type MotionProps } from './motion'
import './theme.css'
import './GloopLoading.css'

export type GloopLoadingProps = {
  /** Testo sotto la bolla (es. "Loading") */
  title?: ReactNode
  /** Testo secondario, più tenue, sotto il titolo */
  description?: ReactNode
  /** Nome accessibile quando manca il title (default "Loading") */
  label?: string
  /** Larghezza della bolla in px; l'altezza segue in proporzione (default 96) */
  size?: number
  /** Colore pieno o gradiente [inizio, fine] (default rosa → viola, come il logo) */
  color?: string | [string, string]
  /** La goccia cade dall'alto, rimbalza e si gonfia prima di colare (default true) */
  intro?: boolean
  className?: string
  style?: CSSProperties
} & MotionProps

// Durate a velocità 1, in secondi
const INTRO = 1.2
const DRIP = 2.8

const GRADIENT: [string, string] = ['#ff7ab6', '#7b5cff']

/*
 * La bolla: una goccia cade dall'alto, si schiaccia sul fondo, rimbalza e si gonfia
 * fino al blob; poi una goccia cola di continuo dal fondo. Animata in SMIL e fusa con
 * un filtro goo SVG, così scala con size senza ricalcolare nulla.
 */
function Blob({
  color,
  speed,
  intro,
  animated,
}: {
  color: string | [string, string]
  speed: number
  intro: boolean
  /** false con movimento ridotto o animazioni spente: bolla ferma */
  animated: boolean
}) {
  const id = useId()
  const [from, to] = typeof color === 'string' ? [color, color] : color
  const introDur = intro ? INTRO / speed : 0
  const drip = `${DRIP / speed}s`
  const ease = { calcMode: 'spline', keySplines: '.45 0 .55 1;.45 0 .55 1', repeatCount: 'indefinite' } as const
  const fall = {
    dur: `${introDur}s`,
    fill: 'freeze',
    calcMode: 'spline',
    keyTimes: '0;.4;.52;.78;.9;1',
    // caduta accelerata, schiacciata, gonfiata in salita, assestamento
    keySplines: '.55 0 1 .45;0 0 .2 1;.2 .8 .3 1;.45 0 .55 1;.45 0 .55 1',
  } as const
  const falling = animated && intro

  return (
    <svg className="gloop-loading__blob" viewBox="0 0 100 120" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <filter id={`${id}-goo`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" />
        </filter>
      </defs>
      <g filter={`url(#${id}-goo)`} fill={`url(#${id}-g)`}>
        {falling ? (
          <ellipse cx="50" cy="0" rx="9" ry="9" opacity="0">
            <animate attributeName="opacity" values="0;1" dur={`${0.15 / speed}s`} fill="freeze" />
            <animate attributeName="cy" values="0;96;100;36;44;42" {...fall} />
            <animate attributeName="rx" values="9;8;18;29;34;32" {...fall} />
            <animate attributeName="ry" values="9;11;9;36;30;32" {...fall} />
          </ellipse>
        ) : (
          <ellipse cx="50" cy="42" rx="32" ry="32" />
        )}
        {/* Nascosta (r=0) finché il blob non è formato; ogni ciclo parte da dentro il blob */}
        {animated && (
          <circle cx="50" cy="56" r="0">
            <animate attributeName="cy" values="56;102;56" dur={drip} begin={`${introDur}s`} {...ease} />
            <animate attributeName="r" values="13;10;13" dur={drip} begin={`${introDur}s`} {...ease} />
          </circle>
        )}
      </g>
      <ellipse
        cx="38"
        cy="28"
        rx="9"
        ry="5"
        fill="#fff"
        opacity={falling ? 0 : 0.45}
        transform="rotate(-30 38 28)"
      >
        {falling && (
          <animate attributeName="opacity" values="0;.45" begin={`${introDur * 0.75}s`} dur={`${0.3 / speed}s`} fill="freeze" />
        )}
      </ellipse>
    </svg>
  )
}

function GloopLoading({
  title,
  description,
  label = 'Loading',
  size = 96,
  color = GRADIENT,
  intro = true,
  className,
  style,
  ...motionProps
}: GloopLoadingProps) {
  // Durate SMIL divise per m.speed; con movimento ridotto o spento niente <animate>: bolla statica
  const m = useGloopMotion(motionProps)
  const rate = m.speed
  return (
    <div
      {...m.rootProps}
      role="status"
      // Con un titolo il lettore di schermo annuncia il testo; senza, la label
      aria-label={title == null ? label : undefined}
      className={className ? `gloop-loading ${className}` : 'gloop-loading'}
      style={{ ...m.rootProps.style, '--gloop-loading-size': `${size}px`, ...style } as CSSProperties}
    >
      {/* key: cambiando la velocità le animazioni SMIL ripartono con le nuove durate */}
      <Blob key={`${rate}-${intro}-${m.state}`} color={color} speed={rate} intro={intro} animated={!m.reduced} />
      {title != null && <p className="gloop-loading__title">{title}</p>}
      {description != null && <p className="gloop-loading__description">{description}</p>}
    </div>
  )
}

export default GloopLoading
