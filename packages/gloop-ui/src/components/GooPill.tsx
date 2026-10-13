import { useEffect, useId } from 'react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'

export type GooPillProps = {
  /** Indice dell'elemento evidenziato */
  index: number
  /** Distanza tra un elemento e il successivo lungo l'asse, in px */
  step: number
  /** Lunghezza della pillola lungo l'asse (default: step) */
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
}

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
}: GooPillProps) {
  const filterId = useId()
  const reduceMotion = useReducedMotion()

  const target = useMotionValue(index * step)
  const head = useSpring(target, { stiffness: 520, damping: 34 })
  const tail = useSpring(target, { stiffness: 170, damping: 20 })

  // Più va veloce, più la testa si allunga lungo l'asse e si assottiglia (squash & stretch)
  const velocity = useVelocity(head)
  const stretch = useTransform(velocity, [-1600, 0, 1600], [1.3, 1, 1.3])
  const squash = useTransform(velocity, [-1600, 0, 1600], [0.8, 1, 0.8])

  useEffect(() => {
    target.set(index * step)
  }, [index, step, target])

  const box =
    axis === 'x'
      ? { top: inset, bottom: inset, left: inset, width: length - inset * 2 }
      : { left: inset, right: inset, top: inset, height: length - inset * 2 }

  const move = (value: typeof head) => (axis === 'x' ? { x: value } : { y: value })
  const deform = reduceMotion
    ? {}
    : axis === 'x'
      ? { scaleX: stretch, scaleY: squash }
      : { scaleY: stretch, scaleX: squash }

  return (
    <motion.div
      className="goo-pill"
      aria-hidden="true"
      style={{ filter: reduceMotion ? undefined : `url(#${CSS.escape(filterId)})` }}
      initial={{ opacity: 0 }}
      animate={{ opacity, transition: { delay, duration: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <svg className="goo-pill__defs" aria-hidden="true">
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
          <feColorMatrix mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" />
        </filter>
      </svg>

      {!reduceMotion && (
        <motion.span className="goo-pill__blob" style={{ ...box, borderRadius: radius, ...move(tail) }} />
      )}
      <motion.span
        className="goo-pill__blob"
        style={{
          ...box,
          borderRadius: radius,
          ...move(reduceMotion ? target : head),
          ...deform,
        }}
      />
    </motion.div>
  )
}

export default GooPill
