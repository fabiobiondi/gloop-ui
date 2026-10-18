import { useContext, useSyncExternalStore, type CSSProperties } from 'react'
import { GloopMotionContext, type GloopMotionPreset, type MotionProps, type MotionState } from './motion-context'

/*
 * Risolve la configurazione delle animazioni di un componente (props > provider > default)
 * e la espone come attributi e variabili sulla radice: le transizioni CSS leggono
 * data-motion, data-motion-preset e --ui-motion-speed.
 */

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

const getReduced = () => typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches

export type GloopMotion = {
  speed: number
  preset: GloopMotionPreset
  state: MotionState
  reduced: boolean
  rootProps: { 'data-motion': MotionState; 'data-motion-preset': GloopMotionPreset; style: CSSProperties }
}

export function useGloopMotion(props: MotionProps = {}): GloopMotion {
  const ctx = useContext(GloopMotionContext)
  const osReduced = useSyncExternalStore(subscribe, getReduced, () => false)
  const rawSpeed = props.speed ?? ctx.speed ?? 1
  const speed = rawSpeed > 0 ? rawSpeed : 1
  const preset = props.motion ?? ctx.motion ?? 'gloop'
  const animated = props.animated ?? ctx.animated ?? true
  const reducedMotion = props.reducedMotion ?? ctx.reducedMotion ?? 'user'

  const state: MotionState = !animated
    ? 'off'
    : reducedMotion === 'always' || (reducedMotion === 'user' && osReduced)
      ? 'reduced'
      : 'on'

  return {
    speed,
    preset,
    state,
    reduced: state !== 'on',
    rootProps: {
      'data-motion': state,
      'data-motion-preset': preset,
      style: { '--ui-motion-speed': speed } as CSSProperties,
    },
  }
}
