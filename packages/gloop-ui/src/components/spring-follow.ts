import { useLayoutEffect, useRef } from 'react'
import type { GloopMotionPreset } from './motion-context'

/*
 * Molle fisiche senza motion/react, per i componenti animati in CSS che devono inseguire
 * un valore che cambia di continuo (drag dello Slider, avanzamento della ProgressBar)
 */

export type Spring = { stiffness: number; damping: number }

// Come tuneTransition per le molle fisiche: speed e preset cambiano rigidità e smorzamento
export function tune({ stiffness, damping }: Spring, speed: number, preset: GloopMotionPreset): Spring {
  const s = speed * (preset === 'snappy' ? 4 / 3 : 1)
  const k = stiffness * s * s
  let d = damping * s
  const critical = 2 * Math.sqrt(k)
  if (preset === 'smooth') d = Math.max(d, critical)
  // snappy: dimezza il rimbalzo
  if (preset === 'snappy' && d < critical) d = (critical + d) / 2
  return { stiffness: k, damping: d }
}

/*
 * Molle che inseguono lo stesso valore, integrate in requestAnimationFrame come useSpring.
 * Una transizione CSS ripartirebbe da ferma a ogni passo del drag; qui la velocità resta
 * quando il bersaglio cambia a metà corsa, e serve anche allo squash & stretch.
 * draw riceve posizioni e velocità a ogni frame; con instant saltano subito al bersaglio.
 */
export function useFollow(target: number, springs: Spring[], instant: boolean, draw: (x: number[], v: number[]) => void) {
  const state = useRef<{ x: number[]; v: number[] } | null>(null)
  const latest = useRef({ springs, draw })
  useLayoutEffect(() => {
    latest.current = { springs, draw }
  })

  useLayoutEffect(() => {
    const st = (state.current ??= { x: latest.current.springs.map(() => target), v: latest.current.springs.map(() => 0) })
    if (instant || typeof requestAnimationFrame === 'undefined') {
      st.x = st.x.map(() => target)
      st.v = st.v.map(() => 0)
      latest.current.draw(st.x, st.v)
      return
    }
    latest.current.draw(st.x, st.v)
    let last = performance.now()
    let frame = 0
    function tick(now: number) {
      const dt = Math.min(0.05, Math.max(0, now - last) / 1000)
      last = now
      // Passi da 1ms: stabile anche con le molle più rigide (snappy, speed alto)
      const steps = Math.max(1, Math.ceil(dt * 1000))
      const h = dt / steps
      let moving = false
      latest.current.springs.forEach(({ stiffness, damping }, i) => {
        let x = st.x[i]
        let v = st.v[i]
        for (let n = 0; n < steps; n++) {
          v += (-stiffness * (x - target) - damping * v) * h
          x += v * h
        }
        if (Math.abs(x - target) < 0.01 && Math.abs(v) < 0.1) {
          x = target
          v = 0
        } else moving = true
        st.x[i] = x
        st.v[i] = v
      })
      latest.current.draw(st.x, st.v)
      if (moving) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, instant])
}
