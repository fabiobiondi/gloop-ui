import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import type { GloopMotionPreset } from './motion-context'

/** Intensità della gelatina quando la prop jelly è attiva senza un valore (es. <Tooltip jelly>) */
export const DEFAULT_JELLY = 0.5

// Molle della gelatina: larghezza più rigida, altezza più morbida, così rimbalzano fuori fase
// jelly regola lo smorzamento: 0 = smorzamento critico (nessun rimbalzo), 1 = le molle qui sotto
export const JELLY_X = { stiffness: 300, damping: 13, mass: 0.9 }
export const JELLY_Y = { stiffness: 210, damping: 10, mass: 0.9 }

type Spring = typeof JELLY_X

/** Una molla campionata: easing linear() da 0 a 1 e durata (ms, a velocità 1) */
export type SpringCurve = { ease: string; ms: number }

const cache = new Map<string, SpringCurve>()

/*
 * Simula una molla da 0 a 1 e la campiona in un easing linear() (40 tratti) più la durata
 * fino all'assestamento. Le molle fisse stanno già campionate nei CSS, una per preset;
 * questa serve a quelle che dipendono da una prop continua, come jelly.
 * Il preset si applica come tuneTransition: snappy più rapido e con metà rimbalzo,
 * smooth smorzato in modo critico. La velocità la divide il CSS (--ui-motion-speed).
 */
export function springCurve({ stiffness, damping, mass }: Spring, preset: GloopMotionPreset = 'gloop'): SpringCurve {
  const key = `${stiffness}/${damping}/${mass}/${preset}`
  const hit = cache.get(key)
  if (hit) return hit
  const s = preset === 'snappy' ? 4 / 3 : 1
  const k = stiffness * s * s
  let d = damping * s
  const critical = 2 * Math.sqrt(k * mass)
  if (preset === 'smooth') d = Math.max(d, critical)
  if (preset === 'snappy' && d < critical) d = (critical + d) / 2

  const dt = 1 / 1000
  const pts = [0]
  let x = 0
  let v = 0
  let still = 0
  while (pts.length < 3000) {
    v += ((-k * (x - 1) - d * v) / mass) * dt
    x += v * dt
    pts.push(x)
    if (Math.abs(x - 1) < 0.002 && Math.abs(v) < 0.02) {
      if (++still > 30) break
    } else still = 0
  }
  const N = 40
  const out = Array.from({ length: N + 1 }, (_, i) => +pts[Math.round((i / N) * (pts.length - 1))].toFixed(3))
  out[N] = 1
  const curve = { ease: `linear(${out.join(', ')})`, ms: pts.length - 1 }
  cache.set(key, curve)
  return curve
}

/** Molla della gelatina con l'intensità data, già campionata */
export function jellySpring({ stiffness, damping, mass }: Spring, jelly: number, preset?: GloopMotionPreset): SpringCurve {
  const critical = 2 * Math.sqrt(stiffness * mass)
  const amount = Math.min(1, Math.max(0, jelly))
  // Arrotondato: poche curve diverse in cache anche con jelly che cambia di continuo
  const d = Math.round((critical - amount * (critical - damping)) * 10) / 10
  return springCurve({ stiffness, mass, damping: d }, preset)
}

/** Prop jelly booleana o numerica: true → DEFAULT_JELLY, false/assente → undefined (nessuna gelatina) */
export function resolveJelly(jelly: boolean | number | undefined): number | undefined {
  if (jelly === true) return DEFAULT_JELLY
  if (jelly === false || jelly === undefined) return undefined
  return jelly
}

/*
 * Al posto di AnimatePresence (condiviso da bolle, Modal e Dialog): quando open diventa
 * false l'elemento resta montato in chiusura (closing) finché non sono finite le animazioni
 * e transizioni CSS al suo interno (lette con getAnimations, WAAPI), poi si smonta.
 * Le animazioni infinite (es. le gocce) non si aspettano. instant (animazioni spente) o un
 * browser senza getAnimations (jsdom): si smonta subito. Riaprendo durante la chiusura
 * l'elemento resta lì e le transizioni ripartono dal valore corrente.
 */
export function usePresence(
  open: boolean,
  instant: boolean,
  ref: RefObject<HTMLElement | null>,
  onExited?: () => void,
) {
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  const closing = mounted && !open
  const onExitedRef = useRef(onExited)
  useLayoutEffect(() => {
    onExitedRef.current = onExited
  })

  useLayoutEffect(() => {
    if (!closing) return
    let cancelled = false
    const done = () => {
      if (cancelled) return
      setMounted(false)
      onExitedRef.current?.()
    }
    const el = ref.current
    // Le transizioni partono qui: getAnimations ricalcola gli stili con data-state='closing'
    const running = () =>
      instant || !el?.getAnimations
        ? []
        : el
            .getAnimations({ subtree: true })
            .filter((a) => a.playState !== 'finished' && a.effect?.getTiming().iterations !== Infinity)
    // Una transizione interrotta da un'altra rifiuta finished: si ricontrolla finché non resta nulla
    const wait = () => {
      const list = running()
      if (!list.length) return done()
      Promise.all(list.map((a) => a.finished.catch(() => {}))).then(() => !cancelled && wait())
    }
    wait()
    return () => {
      cancelled = true
    }
  }, [closing, instant, ref])

  return { mounted, closing }
}
