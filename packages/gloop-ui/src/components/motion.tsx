import { useContext, useMemo, type CSSProperties, type ReactNode } from 'react'
import { MotionConfig, useReducedMotion, type Transition, type Variants } from 'motion/react'
import {
  GloopMotionContext,
  GloopMotionProvider,
  pickMotionProps,
  type GloopMotionPreset,
  type GloopReducedMotion,
  type MotionProps,
  type MotionState,
} from './motion-context'

// Configurazione e provider stanno in motion-context, senza dipendenze da motion/react
export { GloopMotionProvider, pickMotionProps }
export type { GloopMotionPreset, GloopReducedMotion, MotionProps, MotionState }
export type { GloopMotionProviderProps } from './motion-context'

// Chiavi che misurano tempo (secondi): si dividono per la velocità
const TIME_KEYS = ['duration', 'delay', 'visualDuration', 'staggerChildren', 'delayChildren', 'repeatDelay'] as const

// Chiavi che contengono oggetti ma non sono transizioni annidate
const NON_NESTED = new Set(['ease', 'times'])

type AnyTransition = Record<string, unknown>

/**
 * Adatta una transizione di motion/react a velocità e preset. Le durate si dividono per
 * speed; nelle molle fisiche stiffness × speed² e damping × speed accorciano il tempo
 * lasciando invariato il rapporto di smorzamento (quindi il carattere del rimbalzo).
 * Gestisce anche le transizioni per proprietà ({ opacity: { duration } }).
 */
export function tuneTransition<T extends Transition | undefined>(
  transition: T,
  { speed = 1, preset = 'gloop' }: { speed?: number; preset?: GloopMotionPreset } = {},
): T {
  if (!transition || typeof transition !== 'object') return transition
  // snappy: anche un po' più rapido (durate × 0.75)
  const s = (speed > 0 ? speed : 1) * (preset === 'snappy' ? 4 / 3 : 1)
  const src = transition as AnyTransition
  const out: AnyTransition = { ...src }

  for (const key of Object.keys(src)) {
    const value = src[key]
    if (value && typeof value === 'object' && !Array.isArray(value) && !NON_NESTED.has(key)) {
      out[key] = tuneTransition(value as Transition, { speed, preset })
    }
  }
  for (const key of TIME_KEYS) {
    if (typeof src[key] === 'number') out[key] = (src[key] as number) / s
  }

  const isPhysical = typeof src.stiffness === 'number' || typeof src.damping === 'number'
  if (isPhysical) {
    const mass = typeof src.mass === 'number' ? src.mass : 1
    // Default di motion per le molle fisiche
    const k = (typeof src.stiffness === 'number' ? src.stiffness : 100) * s * s
    let d = (typeof src.damping === 'number' ? src.damping : 10) * s
    const critical = 2 * Math.sqrt(k * mass)
    if (preset === 'smooth') d = Math.max(d, critical)
    // snappy: dimezza il rimbalzo (bounce ≈ 1 - ζ, quindi ζ' = (1 + ζ) / 2)
    if (preset === 'snappy' && d < critical) d = (critical + d) / 2
    out.stiffness = k
    out.damping = d
  } else if (typeof src.bounce === 'number' || src.type === 'spring') {
    const bounce = typeof src.bounce === 'number' ? src.bounce : 0.25
    if (preset === 'smooth') out.bounce = 0
    else if (preset === 'snappy') out.bounce = bounce / 2
  }
  return out as T
}

const INSTANT: Transition = { duration: 0 }

export type GloopMotion = {
  speed: number
  preset: GloopMotionPreset
  state: MotionState
  /** true se state non è 'on': i componenti usano la loro variante accessibile */
  reduced: boolean
  /** Transizione adattata a velocità e preset; istantanea se le animazioni sono spente */
  t: <T extends Transition | undefined>(transition: T) => T
  /** Come t, applicata alle transition dentro ogni variante */
  v: (variants: Variants) => Variants
  /** Da spalmare sulla root del componente: lo stato per il CSS e la velocità per le durate CSS */
  rootProps: { 'data-motion': MotionState; style: CSSProperties }
}

/** Risolve la configurazione delle animazioni di un componente: props > provider > default */
export function useGloopMotion(props: MotionProps = {}): GloopMotion {
  const ctx = useContext(GloopMotionContext)
  const osReduced = useReducedMotion() ?? false
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

  return useMemo(() => {
    const t = <T extends Transition | undefined>(transition: T): T =>
      state === 'off' ? (INSTANT as T) : tuneTransition(transition, { speed, preset })
    const tuneVariant = (variant: unknown): unknown => {
      if (typeof variant === 'function') return (...args: unknown[]) => tuneVariant(variant(...args))
      if (!variant || typeof variant !== 'object' || !('transition' in variant)) return variant
      return { ...variant, transition: t((variant as { transition?: Transition }).transition) }
    }
    const v = (variants: Variants): Variants =>
      Object.fromEntries(Object.entries(variants).map(([k, variant]) => [k, tuneVariant(variant)])) as Variants
    return {
      speed,
      preset,
      state,
      reduced: state !== 'on',
      t,
      v,
      rootProps: { 'data-motion': state, style: { '--ui-motion-speed': speed } as CSSProperties },
    }
  }, [speed, preset, state])
}

type MotionScopeProps = {
  m: GloopMotion
  /** Props di animazione del componente: passano ai componenti gloop-ui annidati */
  props: MotionProps
  /** Transizione di default per gli elementi motion al suo interno (già da adattare) */
  transition?: Transition
  children?: ReactNode
}

/*
 * Avvolge l'albero di ogni componente: il MotionConfig interno segue la decisione di
 * useGloopMotion (non più la media query: così 'never' e 'always' funzionano), e le
 * props locali passano ai componenti annidati (es. la GooPill dentro la TabBar).
 */
export function MotionScope({ m, props, transition, children }: MotionScopeProps) {
  return (
    <GloopMotionProvider {...pickMotionProps(props)}>
      <MotionConfig
        reducedMotion={m.state === 'on' ? 'never' : 'always'}
        skipAnimations={m.state === 'off'}
        transition={transition ? m.t(transition) : undefined}
      >
        {children}
      </MotionConfig>
    </GloopMotionProvider>
  )
}
