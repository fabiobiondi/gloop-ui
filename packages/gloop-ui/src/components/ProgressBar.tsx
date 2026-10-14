import { useEffect, useId, useRef, type CSSProperties } from 'react'
import { MotionConfig, animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform, useVelocity } from 'motion/react'
import { toPercent } from './slider-math'
import './theme.css'
import './ProgressBar.css'

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
  /** Moltiplicatore di velocità di blob indeterminati e gocce: 2 = il doppio più veloce (default 1) */
  speed?: number
  className?: string
  style?: CSSProperties
}

// Testa rapida con un po' di rimbalzo, coda gommosa in ritardo: in mezzo il goo crea il collo
const head = { stiffness: 140, damping: 14 }
const tail = { stiffness: 80, damping: 17 }

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
  speed = 1,
  className,
  style,
}: ProgressBarProps) {
  const filterId = useId()
  const reduceMotion = useReducedMotion()
  const indeterminate = value == null
  const current = indeterminate ? min : Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min
  const percent = toPercent(current, min, max)
  const text = formatValue(current, percent)
  const mode = indeterminate ? 'none' : showValue
  const h = mode === 'inside' ? Math.max(thickness, INSIDE_MIN) : thickness
  const dripping = drip && !reduceMotion
  const complete = !indeterminate && percent >= 100

  const target = useMotionValue(percent)
  const headX = useSpring(target, head)
  const tailX = useSpring(target, tail)
  const lead = reduceMotion ? target : headX
  const trail = reduceMotion ? target : tailX

  useEffect(() => {
    target.set(percent)
  }, [percent, target])

  // Squash & stretch: in corsa la testa si allunga lungo la barra e si assottiglia
  const velocity = useVelocity(headX)
  const stretch = useTransform(velocity, [-200, 0, 200], [1.4, 1, 1.4])
  const squash = useTransform(velocity, [-200, 0, 200], [0.8, 1, 0.8])
  // Vicino a 0 la testa sparisce: niente pallina ferma all'inizio della barra
  const grow = useTransform(lead, [0, 3], [0, 1])
  const headScaleX = useTransform(() => grow.get() * (reduceMotion ? 1 : stretch.get()))
  const headScaleY = useTransform(() => grow.get() * (reduceMotion ? 1 : squash.get()))

  const leadLeft = useTransform(lead, (p) => `${p}%`)
  const tailLeft = useTransform(tailX, (p) => `${p}%`)
  // Collo: un filo sottile dalla fine del riempimento alla testa, il goo lo rende liquido
  const neckLeft = useTransform(trail, (p) => `${p}%`)
  const neckWidth = useTransform(() => `${Math.max(0, lead.get() - trail.get())}%`)
  // Il riempimento parte mezzo spessore prima della corsia; vicino a 0 si ritira del tutto
  const fillWidth = useTransform(trail, (p) => `calc(${p}% + ${(h * Math.min(1, Math.max(0, p) / 3)).toFixed(2)}px)`)

  // Arrivata al 100%: un piccolo "gulp" della testa, una volta sola
  const gulp = useMotionValue(1)
  const wasComplete = useRef(complete)
  useEffect(() => {
    if (complete && !wasComplete.current && !reduceMotion) {
      const c = animate(gulp, [1, 1.25, 0.95, 1], { duration: 0.6, ease: 'easeInOut', delay: 0.25 })
      wasComplete.current = complete
      return () => c.stop()
    }
    wasComplete.current = complete
  }, [complete, reduceMotion, gulp])

  // Gradiente: il riempimento lo stende su tutta la corsia, testa e gocce prendono il colore del loro punto
  const [from, to] = color == null ? ['var(--ui-accent)', 'var(--ui-accent)'] : typeof color === 'string' ? [color, color] : color
  const at = (p: number) => (from === to ? from : `color-mix(in oklab, ${to} ${p.toFixed(1)}%, ${from})`)

  const classes = className ? `progress ${className}` : 'progress'

  return (
    <MotionConfig reducedMotion="user">
      <div
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
        style={
          {
            '--progress-h': `${h}px`,
            '--progress-speed': speed > 0 ? speed : 1,
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
                      <motion.span className="progress__fill" style={{ width: fillWidth }}>
                        {dripping &&
                          percent > 3 &&
                          FILL_DROPS.map((d, i) => (
                            <DripDrop key={i} drop={d} thickness={h} color={at((d.at * percent) / 100)} />
                          ))}
                      </motion.span>
                      {!reduceMotion && <motion.span className="progress__neck" style={{ left: neckLeft, width: neckWidth }} />}
                      {!reduceMotion && (
                        <motion.span className="progress__tail" style={{ left: tailLeft, x: '-50%', scale: grow }} />
                      )}
                      <motion.span className="progress__head-pos" style={{ left: leadLeft }}>
                        <motion.span className="progress__head" style={{ scaleX: headScaleX, scaleY: headScaleY }}>
                          <motion.span className="progress__head-gulp" style={{ scale: gulp }} />
                        </motion.span>
                        {mode === 'bubble' && (
                          <span className="progress__bubble">
                            {/* Copia invisibile del valore: dà alla goccia la larghezza giusta senza misurare */}
                            <span className="progress__bubble-sizer">{text}</span>
                          </span>
                        )}
                      </motion.span>
                    </>
                  )}
            </div>
          </div>

          {mode !== 'none' && (
            <div className="progress__lane" aria-hidden="true">
              {mode === 'bubble' ? (
                <motion.span className="progress__value" data-placement="bubble" style={{ left: leadLeft }}>
                  {text}
                </motion.span>
              ) : (
                <motion.span className="progress__value" data-placement="inside" style={{ width: fillWidth }}>
                  {text}
                </motion.span>
              )}
            </div>
          )}
        </div>
      </div>
    </MotionConfig>
  )
}

export default ProgressBar
