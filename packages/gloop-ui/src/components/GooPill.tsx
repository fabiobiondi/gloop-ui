import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import { GloopMotionProvider, pickMotionProps, type GloopMotionPreset, type MotionProps } from './motion-context'
import { useGloopMotion } from './gloop-motion'
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
  /** Classe aggiunta al contenitore, es. per colorare le gocce */
  className?: string
} & MotionProps

// Solo per i componenti di gloop-ui che la montano e smontano (vedi usePresence)
type GooPillInternalProps = GooPillProps & {
  /** In uscita: si dissolve, poi chiama onExited */
  closing?: boolean
  onExited?: () => void
  /** false: compare senza dissolvenza (come AnimatePresence initial={false}) */
  initial?: boolean
}

/*
 * Uscite senza AnimatePresence: quando value torna null l'ultimo valore resta (closing)
 * finché l'elemento non ha finito le sue transizioni CSS (useExit), poi exited() lo smonta.
 * instant: smonta subito, senza uscita.
 */
export function usePresence<T>(value: T | null, instant = false) {
  const [kept, setKept] = useState<T | null>(value)
  // Aggiornamento durante il render: il nuovo valore vale già da questo render
  if (value !== null && value !== kept) setKept(value)
  if (value === null && kept !== null && instant) setKept(null)
  const exited = useCallback(() => setKept(null), [])
  const shown = value ?? (instant ? null : kept)
  return { value: shown, closing: value === null && shown !== null, exited }
}

/*
 * Quando closing diventa true aspetta che transizioni e animazioni CSS di el finiscano
 * (Web Animations: getAnimations), poi chiama onExited. Senza animazioni in corso
 * (animated={false}, jsdom) lo chiama subito.
 */
export function useExit(ref: RefObject<Element | null>, closing: boolean, onExited?: () => void, subtree = false) {
  const onExitedRef = useRef(onExited)
  useLayoutEffect(() => {
    onExitedRef.current = onExited
  })
  useLayoutEffect(() => {
    const el = ref.current
    if (!closing || !el) return
    const running = typeof el.getAnimations === 'function' ? el.getAnimations({ subtree }) : []
    if (!running.length) {
      onExitedRef.current?.()
      return
    }
    let live = true
    Promise.allSettled(running.map((a) => a.finished)).then(() => {
      if (live) onExitedRef.current?.()
    })
    return () => {
      live = false
    }
  }, [closing, ref, subtree])
}

/*
 * Molle della testa e della coda (come in Motion): le curve per il CSS sono in GooPill.css,
 * qui servono solo per la velocità della testa, che decide quanto si allunga.
 */
const headSpring = { stiffness: 520, damping: 34 }

// Come tuneTransition: stiffness × s², damping × s; smooth senza rimbalzo, snappy a metà
function tuneSpring({ stiffness, damping }: typeof headSpring, speed: number, preset: GloopMotionPreset) {
  const s = speed * (preset === 'snappy' ? 4 / 3 : 1)
  const k = stiffness * s * s
  let d = damping * s
  const critical = 2 * Math.sqrt(k)
  if (preset === 'smooth') d = Math.max(d, critical)
  if (preset === 'snappy' && d < critical) d = (critical + d) / 2
  return { k, d }
}

/*
 * Squash & stretch: simula la molla della testa su una distanza e campiona la velocità.
 * Come useTransform in Motion: 0 → 1600 px/s diventa scala 1 → 1.3 lungo l'asse e
 * 1 → 0.8 di traverso (oltre resta fermo lì).
 */
function stretchKeyframes(distance: number, k: number, d: number) {
  const dt = 1 / 1000
  let x = 0
  let v = 0
  const samples: number[] = []
  for (let t = 0; t < 2; t += dt) {
    const a = -k * (x - distance) - d * v
    v += a * dt
    x += v * dt
    samples.push(Math.min(1, Math.abs(v) / 1600))
    if (Math.abs(x - distance) < 0.5 && Math.abs(v) < 20) break
  }
  const frames = 24
  const amount = Array.from({ length: frames + 1 }, (_, i) =>
    i === frames ? 0 : samples[Math.round((i / frames) * (samples.length - 1))],
  )
  return { ms: samples.length, amount }
}

/*
 * Pillola "liquida": due gocce seguono l'elemento evidenziato con molle diverse.
 * La testa è rapida e si schiaccia in base alla velocità, la coda è lenta.
 * Un filtro SVG "goo" le fonde: in movimento si allungano come una goccia,
 * da ferme tornano un'unica pillola.
 * Posizione e lunghezza sono transizioni CSS (molle in linear(), GooPill.css);
 * l'allungamento è un'animazione Web Animations calcolata a ogni spostamento.
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
  className,
  closing = false,
  onExited,
  initial = true,
  ...motionProps
}: GooPillInternalProps) {
  const filterId = useId()
  const m = useGloopMotion(motionProps)
  const reduceMotion = m.reduced
  const rootRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLSpanElement>(null)
  // Solo alla nascita: con initial={false} compare già piena
  const [instant] = useState(!initial)

  const target = index * step
  const size = length - inset * 2

  useExit(rootRef, closing, onExited)

  // A ogni spostamento la testa si allunga e si assottiglia, seguendo la sua velocità
  const prevTarget = useRef(target)
  const stretchRef = useRef<Animation | null>(null)
  useEffect(() => {
    const distance = target - prevTarget.current
    prevTarget.current = target
    const head = headRef.current
    if (m.state !== 'on' || !head || typeof head.animate !== 'function' || Math.abs(distance) < 1) return
    const { k, d } = tuneSpring(headSpring, m.speed, m.preset)
    const { ms, amount } = stretchKeyframes(distance, k, d)
    stretchRef.current?.cancel()
    const keyframes = amount.map((a) => {
      const stretch = 1 + 0.3 * a
      const squash = 1 - 0.2 * a
      return { scale: axis === 'x' ? `${stretch} ${squash}` : `${squash} ${stretch}` }
    })
    stretchRef.current = head.animate(keyframes, { duration: ms })
  }, [target, axis, m.state, m.speed, m.preset])

  const box = (): CSSProperties =>
    axis === 'x'
      ? { top: inset, bottom: inset, left: inset, width: size }
      : { left: inset, right: inset, top: inset, height: size }

  const move: CSSProperties = { translate: axis === 'x' ? `${target}px 0` : `0 ${target}px` }

  return (
    <GloopMotionProvider {...pickMotionProps(motionProps)}>
      <div
        {...m.rootProps}
        ref={rootRef}
        className={className ? `goo-pill ${className}` : 'goo-pill'}
        aria-hidden="true"
        data-closing={closing || undefined}
        data-instant={instant || undefined}
        style={
          {
            ...m.rootProps.style,
            '--gp-opacity': opacity,
            '--gp-delay': `${delay}s`,
            filter: reduceMotion ? undefined : `url(#${CSS.escape(filterId)})`,
          } as CSSProperties
        }
      >
        <svg className="goo-pill__defs" aria-hidden="true">
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
            <feColorMatrix mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" />
          </filter>
        </svg>

        {/* Coda: la molla lenta (GooPill.css la riconosce perché non è l'ultima) */}
        {!reduceMotion && <span className="goo-pill__blob" style={{ ...box(), borderRadius: radius, ...move }} />}
        <span ref={headRef} className="goo-pill__blob" style={{ ...box(), borderRadius: radius, ...move }} />
      </div>
    </GloopMotionProvider>
  )
}

export default GooPill
