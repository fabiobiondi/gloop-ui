import { useEffect, useId } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import { MotionScope, useGloopMotion, type MotionProps } from './motion'
import './theme.css'
import './GooPill.css'

export type GooPillProps = {
  /** Indice dell'elemento evidenziato */
  index: number
  /** Distanza tra un elemento e il successivo lungo l'asse, in px */
  step: number
  /** Lunghezza della pillola lungo l'asse (default: step); se cambia si allunga con la stessa molla */
  length?: number
  /** Distanza della pillola dai bordi dell'elemento, in px */
  inset?: number
  /** Direzione: orizzontale (tabbar) o verticale (liste) */
  axis?: 'x' | 'y'
  radius?: number
  /** Opacità del livello: il filtro rende il colore pieno, la trasparenza va data qui */
  opacity?: number
  /** Ritardo della comparsa, in secondi */
  delay?: number
} & MotionProps

const headSpring = { stiffness: 520, damping: 34 }
const tailSpring = { stiffness: 170, damping: 20 }

/*
 * Pillola "liquida": due gocce seguono l'elemento evidenziato con molle diverse.
 * La testa è rapida e si schiaccia in base alla velocità, la coda è lenta.
 * Un filtro SVG "goo" le fonde: in movimento si allungano come una goccia,
 * da ferme tornano un'unica pillola.
 */
function GooPill({
  index,
  step,
  length = step,
  inset = 4,
  axis = 'x',
  radius = 22,
  opacity = 0.16,
  delay = 0,
  ...motionProps
}: GooPillProps) {
  const filterId = useId()
  const m = useGloopMotion(motionProps)
  const reduceMotion = m.reduced

  const target = useMotionValue(index * step)
  const head = useSpring(target, m.t(headSpring))
  const tail = useSpring(target, m.t(tailSpring))

  // Elementi di larghezza diversa (TabBar inline): anche la lunghezza segue testa e coda
  const size = useMotionValue(length - inset * 2)
  const headSize = useSpring(size, m.t(headSpring))
  const tailSize = useSpring(size, m.t(tailSpring))

  // Più va veloce, più la testa si allunga lungo l'asse e si assottiglia (squash & stretch)
  const velocity = useVelocity(head)
  const stretch = useTransform(velocity, [-1600, 0, 1600], [1.3, 1, 1.3])
  const squash = useTransform(velocity, [-1600, 0, 1600], [0.8, 1, 0.8])

  useEffect(() => {
    target.set(index * step)
  }, [index, step, target])

  useEffect(() => {
    size.set(length - inset * 2)
  }, [length, inset, size])

  const box = (value: typeof size) =>
    axis === 'x'
      ? { top: inset, bottom: inset, left: inset, width: value }
      : { left: inset, right: inset, top: inset, height: value }

  const move = (value: typeof head) => (axis === 'x' ? { x: value } : { y: value })
  const deform = reduceMotion
    ? {}
    : axis === 'x'
      ? { scaleX: stretch, scaleY: squash }
      : { scaleY: stretch, scaleX: squash }

  return (
    <MotionScope m={m} props={motionProps}>
    <motion.div
      {...m.rootProps}
      className="goo-pill"
      aria-hidden="true"
      style={{ ...m.rootProps.style, filter: reduceMotion ? undefined : `url(#${CSS.escape(filterId)})` }}
      initial={{ opacity: 0 }}
      animate={{ opacity, transition: m.t({ delay, duration: 0.2 }) }}
      exit={{ opacity: 0, transition: m.t({ duration: 0.15 }) }}
    >
      <svg className="goo-pill__defs" aria-hidden="true">
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
          <feColorMatrix mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" />
        </filter>
      </svg>

      {!reduceMotion && (
        <motion.span className="goo-pill__blob" style={{ ...box(tailSize), borderRadius: radius, ...move(tail) }} />
      )}
      <motion.span
        className="goo-pill__blob"
        style={{
          ...box(reduceMotion ? size : headSize),
          borderRadius: radius,
          ...move(reduceMotion ? target : head),
          ...deform,
        }}
      />
    </motion.div>
    </MotionScope>
  )
}

export default GooPill
