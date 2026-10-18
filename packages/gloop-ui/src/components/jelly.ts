import type { Transition } from 'motion/react'

/** Intensità della gelatina quando la prop jelly è attiva senza un valore (es. <Tooltip jelly>) */
export const DEFAULT_JELLY = 0.5

// Molle della gelatina: larghezza più rigida, altezza più morbida, così rimbalzano fuori fase
// jelly regola lo smorzamento: 0 = smorzamento critico (nessun rimbalzo), 1 = le molle qui sotto
export const JELLY_X = { stiffness: 300, damping: 13, mass: 0.9 }
export const JELLY_Y = { stiffness: 210, damping: 10, mass: 0.9 }

export function jellySpring({ stiffness, damping, mass }: typeof JELLY_X, jelly: number, delay = 0): Transition {
  const critical = 2 * Math.sqrt(stiffness * mass)
  const amount = Math.min(1, Math.max(0, jelly))
  return { type: 'spring', stiffness, mass, delay, damping: critical - amount * (critical - damping) }
}

/** Prop jelly booleana o numerica: true → DEFAULT_JELLY, false/assente → undefined (nessuna gelatina) */
export function resolveJelly(jelly: boolean | number | undefined): number | undefined {
  if (jelly === true) return DEFAULT_JELLY
  if (jelly === false || jelly === undefined) return undefined
  return jelly
}
