import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type Ref,
} from 'react'
import {
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import { fromPointer, keyValue, snap, stepMarks, toPercent } from './slider-math'
import './theme.css'
import './Slider.css'

export type SliderMark = number | { value: number; label?: string }

export type SliderProps = {
  value?: number
  /** Valore iniziale quando non è controllato (default: min) */
  defaultValue?: number
  onChange?: (value: number) => void
  /** A fine gesto: rilascio del drag o del tasto. Utile per salvare senza farlo a ogni passo */
  onChangeEnd?: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** true = un segno per ogni passo (fino a 50); oppure valori specifici, con label opzionale */
  marks?: boolean | SliderMark[]
  /** 'auto' = la goccia col valore sale solo durante drag o focus da tastiera */
  showValue?: 'auto' | 'always' | 'never'
  /** Da che lato del thumb esce la goccia col valore */
  valuePlacement?: 'top' | 'bottom'
  /** Testo del valore nella goccia e per gli screen reader (aria-valuetext) */
  formatValue?: (value: number) => string
  /** Nome accessibile; in alternativa aria-labelledby */
  label?: string
  'aria-labelledby'?: string
  /** Con name il valore viaggia nei form tramite un input hidden */
  name?: string
  disabled?: boolean
  className?: string
  style?: CSSProperties
  /** Ref all'elemento focusabile (role="slider") */
  ref?: Ref<HTMLDivElement>
}

// Misure in px: devono restare allineate con Slider.css
const THUMB = 22
const BUBBLE_H = 26
const BUBBLE_GAP = 4
// Da ferma la goccia del valore sta nascosta al centro del thumb (in negativo se esce sotto)
const SUNK = BUBBLE_H + BUBBLE_GAP + THUMB / 2 - BUBBLE_H / 2

const head = { stiffness: 520, damping: 34 }
const tail = { stiffness: 170, damping: 20 }
// Salita: la goccia "cola" verso l'alto e rimbalza; discesa: risucchiata senza rimbalzo
const flow = { type: 'spring', stiffness: 460, damping: 26 } as const
const suck = { type: 'spring', stiffness: 520, damping: 40 } as const

const defaultFormat = (v: number) => String(v)

/*
 * Slider "liquido": il thumb è una goccia con una coda più lenta che, fusa dal filtro goo,
 * si allunga in corsa e si ricompone da ferma; il riempimento la segue come un filo.
 * Il valore sale dal thumb come una goccia (stesso gesto della label di Input).
 * Testi, segni e l'elemento focusabile stanno fuori dal livello filtrato: restano nitidi.
 */
function Slider({
  value,
  defaultValue,
  onChange,
  onChangeEnd,
  min = 0,
  max = 100,
  step = 1,
  marks,
  showValue = 'auto',
  valuePlacement = 'top',
  formatValue = defaultFormat,
  label,
  'aria-labelledby': labelledBy,
  name,
  disabled,
  className,
  style,
  ref,
}: SliderProps) {
  const filterId = useId()
  const reduceMotion = useReducedMotion()
  const railRef = useRef<HTMLDivElement | null>(null)
  const thumbRef = useRef<HTMLDivElement | null>(null)

  const [internal, setInternal] = useState(() => snap(defaultValue ?? min, min, max, step))
  const controlled = value !== undefined
  const current = snap(controlled ? value : internal, min, max, step)
  // L'ultimo valore emesso: i gesti (drag, tasti ripetuti) leggono questo, non quello del render
  const latest = useRef(current)
  useLayoutEffect(() => {
    latest.current = current
  }, [current])

  const [dragging, setDragging] = useState(false)
  const [keyboard, setKeyboard] = useState(false)
  const bubble = showValue !== 'never'
  const active = showValue === 'always' || (showValue === 'auto' && (dragging || keyboard))
  const sunk = valuePlacement === 'bottom' ? -SUNK : SUNK

  // Posizione in % lungo il binario: la testa è rapida, la coda in ritardo crea la scia
  const percent = toPercent(current, min, max)
  const target = useMotionValue(percent)
  const headX = useSpring(target, head)
  const tailX = useSpring(target, tail)
  const lead = reduceMotion ? target : headX
  const trail = reduceMotion ? target : tailX

  useEffect(() => {
    target.set(percent)
  }, [percent, target])

  // Squash & stretch: in corsa la goccia si allunga lungo il binario e si assottiglia
  const velocity = useVelocity(headX)
  const stretch = useTransform(velocity, [-300, 0, 300], [1.35, 1, 1.35])
  const squash = useTransform(velocity, [-300, 0, 300], [0.8, 1, 0.8])

  const leadLeft = useTransform(lead, (p) => `${p}%`)
  const tailLeft = useTransform(tailX, (p) => `${p}%`)
  // Il riempimento parte da sotto il bordo sinistro del thumb e finisce sulla coda
  const fillWidth = useTransform(trail, (p) => `calc(${p}% + ${THUMB / 2}px)`)

  // Goccia del valore: posizione verticale e dimensione, come la linguetta di Input
  const y = useMotionValue(active ? 0 : sunk)
  const size = useMotionValue(active ? 1 : 0.4)
  const yVelocity = useVelocity(y)
  const bubbleStretch = useTransform(yVelocity, [-500, 0, 500], [1.25, 1, 1.25])
  const bubbleSquash = useTransform(yVelocity, [-500, 0, 500], [0.85, 1, 0.85])
  const bubbleScaleX = useTransform(() => size.get() * bubbleSquash.get())
  const bubbleScaleY = useTransform(() => size.get() * bubbleStretch.get())
  const textOpacity = useTransform(size, [0.6, 1], [0, 1])

  useEffect(() => {
    const transition = reduceMotion ? { duration: 0 } : active ? flow : suck
    const controls = [animate(y, active ? 0 : sunk, transition), animate(size, active ? 1 : 0.4, transition)]
    return () => controls.forEach((c) => c.stop())
  }, [active, sunk, reduceMotion, y, size])

  const markList = useMemo(() => {
    if (!marks) return []
    const list = marks === true ? stepMarks(min, max, step) : marks
    return list
      .map((m) => (typeof m === 'number' ? { value: m } : m))
      .filter((m) => m.value >= min && m.value <= max)
      .sort((a, b) => a.value - b.value)
  }, [marks, min, max, step])
  const hasMarkLabels = markList.some((m) => m.label)

  function commit(next: number) {
    if (next === latest.current) return
    latest.current = next
    if (!controlled) setInternal(next)
    onChange?.(next)
  }

  function valueAt(clientX: number) {
    const rect = railRef.current?.getBoundingClientRect()
    return rect ? fromPointer(clientX, rect, min, max, step) : latest.current
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (disabled || e.button !== 0) return
    // Niente selezione del testo né focus "rubato" dal root: il focus va al thumb
    e.preventDefault()
    try {
      // Il drag continua anche uscendo dal binario
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      // Puntatore non più attivo (eventi sintetici): il drag funziona finché resta sopra
    }
    thumbRef.current?.focus({ preventScroll: true })
    setKeyboard(false)
    setDragging(true)
    commit(valueAt(e.clientX))
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (dragging) commit(valueAt(e.clientX))
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
    onChangeEnd?.(latest.current)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    const next = keyValue(e.key, latest.current, min, max, step)
    if (next === null) return
    e.preventDefault()
    setKeyboard(true)
    commit(next)
  }

  function handleKeyUp(e: KeyboardEvent<HTMLDivElement>) {
    if (!disabled && keyValue(e.key, latest.current, min, max, step) !== null) onChangeEnd?.(latest.current)
  }

  function setRefs(node: HTMLDivElement | null) {
    thumbRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  const text = formatValue(current)
  const classes = className ? `slider ${className}` : 'slider'

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={classes}
        style={style}
        data-disabled={disabled || undefined}
        data-dragging={dragging || undefined}
        data-active={active || undefined}
        data-bubble={bubble ? valuePlacement : undefined}
        data-mark-labels={hasMarkLabels || undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/*
          Filtro proprio, senza riempimento col colore di superficie (GooFilter usa --ui-bg):
          qui le forme fuse sono tutte color accent e i "ponti" devono restare accent
        */}
        <svg className="slider__defs" aria-hidden="true" width="0" height="0">
          <filter id={filterId} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
            <feColorMatrix mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" />
          </filter>
        </svg>

        <div className="slider__rail" ref={railRef}>
          <span className="slider__track" />
          {/* Riempimento nitido: nel filtro una linea così sottile sparirebbe sotto la soglia */}
          <motion.span className="slider__fill" style={{ width: fillWidth }} />

          {/* Il livello copre anche lo spazio della goccia: l'area del filtro si misura su di lui */}
          <div
            className="slider__goo"
            aria-hidden="true"
            style={{ filter: reduceMotion ? undefined : `url(#${CSS.escape(filterId)})` }}
          >
            <div className="slider__goo-rail">
              {/* Copia nel goo: vicino alla goccia si fonde e crea il "collo" liquido */}
              <motion.span className="slider__fill" style={{ width: fillWidth }} />
              {!reduceMotion && <motion.span className="slider__tail" style={{ left: tailLeft, x: '-50%' }} />}
              <motion.span
                className="slider__blob"
                style={{
                  left: leadLeft,
                  x: '-50%',
                  ...(reduceMotion ? {} : { scaleX: stretch, scaleY: squash }),
                }}
              />
              {bubble && (
                <motion.span
                  className="slider__bubble"
                  style={{ left: leadLeft, x: '-50%', y, scaleX: bubbleScaleX, scaleY: bubbleScaleY }}
                >
                  {/* Copia invisibile del valore: dà alla goccia la larghezza giusta senza misurare */}
                  <span className="slider__bubble-sizer">{text}</span>
                </motion.span>
              )}
            </div>
          </div>

          {markList.length > 0 && (
            <div className="slider__marks" aria-hidden="true">
              {markList.map((m) => (
                <span
                  key={m.value}
                  className="slider__mark"
                  data-active={m.value <= current || undefined}
                  style={{ left: `${toPercent(m.value, min, max)}%` }}
                >
                  {m.label && <span className="slider__mark-label">{m.label}</span>}
                </span>
              ))}
            </div>
          )}

          {bubble && (
            <motion.span
              className="slider__value"
              aria-hidden="true"
              style={{ left: leadLeft, x: '-50%', y, scale: size, opacity: textOpacity }}
            >
              {text}
            </motion.span>
          )}

          <motion.div
            ref={setRefs}
            className="slider__thumb"
            style={{ left: leadLeft, x: '-50%' }}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={labelledBy ? undefined : label}
            aria-labelledby={labelledBy}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={current}
            aria-valuetext={text}
            aria-orientation="horizontal"
            aria-disabled={disabled || undefined}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onFocus={(e) => {
              // Solo il focus da tastiera fa salire la goccia (quello dal click è coperto dal drag)
              try {
                if (e.currentTarget.matches(':focus-visible')) setKeyboard(true)
              } catch {
                // Selettore non supportato: la goccia sale al primo tasto
              }
            }}
            onBlur={() => setKeyboard(false)}
          />
        </div>

        {name && <input type="hidden" name={name} value={current} disabled={disabled} />}
      </div>
    </MotionConfig>
  )
}

export default Slider
