import { useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { GloopMotionProvider, pickMotionProps, type MotionProps } from './motion-context'
import { useGloopMotion } from './gloop-motion'
import { tune, useFollow, type Spring } from './spring-follow'
import { toPercent } from './slider-math'
import './theme.css'
import './ProgressBar.css'

/**
 * speed (da MotionProps) moltiplica tutte le animazioni del componente: molle della testa,
 * blob indeterminati, gocce e pulsazione. 2 = il doppio più veloce (default 1)
 */
export type ProgressBarProps = {
  /** Valore corrente; senza (undefined o null) la barra è indeterminata e scorre all'infinito */
  value?: number | null
  min?: number
  max?: number
  /** Nome accessibile; in alternativa aria-labelledby */
  label?: string
  'aria-labelledby'?: string
  /**
   * none (default): nessun testo. inside: il valore dentro la barra (spessore minimo 18px).
   * bubble: il valore in una goccia sopra la testa del blob. Ignorato se indeterminata.
   */
  showValue?: 'none' | 'inside' | 'bubble'
  /** Testo del valore e per gli screen reader (aria-valuetext). Default: percentuale arrotondata */
  formatValue?: (value: number, percent: number) => string
  /** Colore pieno o gradiente [inizio, fine] (default --ui-accent) */
  color?: string | [string, string]
  /** Spessore della barra in px (default 10) */
  thickness?: number
  /** Gocce che colano dal riempimento (o dai blob, se indeterminata) */
  drip?: boolean
  className?: string
  style?: CSSProperties
} & MotionProps


// Testa rapida con un po' di rimbalzo, coda gommosa in ritardo: in mezzo il goo crea il collo
const head: Spring = { stiffness: 140, damping: 14 }
const tail: Spring = { stiffness: 80, damping: 17 }

const INSIDE_MIN = 18

type Drop = { at: number; size: number; delay: number; duration: number }

// Gocce: posizione (% della lunghezza del riempimento), diametro (× spessore), ritardo e durata in s
const FILL_DROPS: Drop[] = [
  { at: 22, size: 1.2, delay: 0, duration: 2.6 },
  { at: 58, size: 1.5, delay: 1.1, duration: 3 },
  { at: 86, size: 1.1, delay: 2, duration: 2.4 },
]

const defaultFormat = (_: number, percent: number) => `${Math.round(percent)}%`

/* Una goccia: nasce dentro il bordo inferiore e cade, il goo la fonde con la barra */
function DripDrop({ drop, thickness, color }: { drop: Drop; thickness: number; color: string }) {
  return (
    <span
      className="progress__drop"
      style={
        {
          left: `${drop.at}%`,
          background: color,
          '--drop-size': `${Math.max(10, drop.size * thickness)}px`,
          animationDelay: `calc(${drop.delay}s / var(--progress-speed))`,
          animationDuration: `calc(${drop.duration}s / var(--progress-speed))`,
        } as CSSProperties
      }
    />
  )
}

/*
 * Barra di avanzamento liquida. Determinata: una testa a blob scatta avanti a ogni
 * aggiornamento e il riempimento la raggiunge con una molla più lenta, fusi dal goo
 * in un collo che si allunga e si ricompone. Indeterminata: blob che scorrono lungo
 * il binario, si fondono quando si sfiorano e si separano. Testo e binario stanno
 * fuori dal livello filtrato e restano nitidi.
 */
function ProgressBar({
  value,
  min = 0,
  max = 100,
  label,
  'aria-labelledby': labelledBy,
  showValue = 'none',
  formatValue = defaultFormat,
  color,
  thickness = 10,
  drip = false,
  className,
  style,
  ...motionProps
}: ProgressBarProps) {
  const filterId = useId()
  const m = useGloopMotion(motionProps)
  const rootRef = useRef<HTMLDivElement>(null)
  const reduceMotion = m.reduced
  const indeterminate = value == null
  const current = indeterminate ? min : Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min
  const percent = toPercent(current, min, max)
  const text = formatValue(current, percent)
  const mode = indeterminate ? 'none' : showValue
  const h = mode === 'inside' ? Math.max(thickness, INSIDE_MIN) : thickness
  const dripping = drip && !reduceMotion
  const complete = !indeterminate && percent >= 100

  /*
   * Testa e coda scrivono variabili CSS sulla radice a ogni frame, senza render di React.
   * Vicino a 0 la testa sparisce (--progress-grow): niente pallina ferma all'inizio della barra
   */
  const springs = useMemo(() => [tune(head, m.speed, m.preset), tune(tail, m.speed, m.preset)], [m.speed, m.preset])
  useFollow(percent, springs, reduceMotion, ([lead, trail], [velocity]) => {
    const el = rootRef.current
    if (!el) return
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
    // Squash & stretch: in corsa la testa si allunga lungo la barra e si assottiglia
    const run = Math.min(1, Math.abs(velocity) / 200)
    const grow = clamp01(lead / 3)
    el.style.setProperty('--progress-lead', `${lead}%`)
    el.style.setProperty('--progress-trail', `${trail}%`)
    // Collo: un filo sottile dalla fine del riempimento alla testa, il goo lo rende liquido
    el.style.setProperty('--progress-neck', `${Math.max(0, lead - trail)}%`)
    // Il riempimento parte mezzo spessore prima della corsia; vicino a 0 si ritira del tutto
    el.style.setProperty('--progress-fill-grow', String(clamp01(trail / 3)))
    el.style.setProperty('--progress-grow', String(grow))
    el.style.setProperty('--progress-head-sx', String(grow * (1 + 0.4 * run)))
    el.style.setProperty('--progress-head-sy', String(grow * (1 - 0.2 * run)))
  })

  /*
   * Arrivata al 100%: un piccolo "gulp" della testa, una volta sola (non al montaggio).
   * L'animazione è in ProgressBar.css, su data-gulp.
   */
  const [wasComplete, setWasComplete] = useState(complete)
  const [gulp, setGulp] = useState(false)
  if (wasComplete !== complete) {
    setWasComplete(complete)
    setGulp(complete && !reduceMotion)
  }

  // Gradiente: il riempimento lo stende su tutta la corsia, testa e gocce prendono il colore del loro punto
  const [from, to] = color == null ? ['var(--ui-accent)', 'var(--ui-accent)'] : typeof color === 'string' ? [color, color] : color
  const at = (p: number) => (from === to ? from : `color-mix(in oklab, ${to} ${p.toFixed(1)}%, ${from})`)

  const classes = className ? `progress ${className}` : 'progress'

  return (
    <GloopMotionProvider {...pickMotionProps(motionProps)}>
      <div
        {...m.rootProps}
        ref={rootRef}
        className={classes}
        role="progressbar"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : current}
        aria-valuetext={indeterminate ? undefined : text}
        data-indeterminate={indeterminate || undefined}
        data-value={mode === 'none' ? undefined : mode}
        data-drip={dripping || undefined}
        data-complete={complete || undefined}
        data-gulp={gulp || undefined}
        style={
          {
            ...m.rootProps.style,
            '--progress-h': `${h}px`,
            '--progress-speed': m.speed,
            '--progress-from': from,
            '--progress-to': to,
            '--progress-head-fill': at(percent),
            ...style,
          } as CSSProperties
        }
      >
        {/*
          Filtro proprio senza feFlood: le forme fuse tengono il loro colore (anche il gradiente).
          Sfocatura contenuta: con una più ampia le gocce staccate scenderebbero sotto la soglia e sparirebbero
        */}
        <svg className="progress__defs" aria-hidden="true" width="0" height="0">
          <filter id={filterId} x="-10%" y="-200%" width="120%" height="600%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={Math.min(6, Math.max(2.5, h * 0.3))} />
            <feColorMatrix mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" />
          </filter>
        </svg>

        <div className="progress__rail">
          <span className="progress__track" aria-hidden="true" />

          <div
            className="progress__goo"
            aria-hidden="true"
            style={{ filter: reduceMotion ? undefined : `url(#${CSS.escape(filterId)})` }}
          >
            <div className="progress__lane">
              {indeterminate
                ? [0, 1, 2].map((i) => (
                    <span key={i} className="progress__runner" data-runner={i}>
                      <span className="progress__runner-blob" />
                      {dripping && <span className="progress__runner-drop" />}
                    </span>
                  ))
                : (
                    <>
                      <span className="progress__fill">
                        {dripping &&
                          percent > 3 &&
                          FILL_DROPS.map((d, i) => (
                            <DripDrop key={i} drop={d} thickness={h} color={at((d.at * percent) / 100)} />
                          ))}
                      </span>
                      {!reduceMotion && <span className="progress__neck" />}
                      {!reduceMotion && <span className="progress__tail" />}
                      <span className="progress__head-pos">
                        <span className="progress__head">
                          <span className="progress__head-gulp" />
                        </span>
                        {mode === 'bubble' && (
                          <span className="progress__bubble">
                            {/* Copia invisibile del valore: dà alla goccia la larghezza giusta senza misurare */}
                            <span className="progress__bubble-sizer">{text}</span>
                          </span>
                        )}
                      </span>
                    </>
                  )}
            </div>
          </div>

          {mode !== 'none' && (
            <div className="progress__lane" aria-hidden="true">
              {mode === 'bubble' ? (
                <span className="progress__value" data-placement="bubble">
                  {text}
                </span>
              ) : (
                <span className="progress__value" data-placement="inside">
                  {text}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </GloopMotionProvider>
  )
}

export default ProgressBar
