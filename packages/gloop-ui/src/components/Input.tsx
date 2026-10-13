import { useEffect, useId, useLayoutEffect, useRef, useState, type InputHTMLAttributes, type Ref } from 'react'
import {
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  useVelocity,
} from 'motion/react'
import { GooFilter } from './goo'
import './theme.css'
import './Input.css'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Etichetta: dentro il campo da vuoto, sopra come goccia al focus o con un valore */
  label: string
  ref?: Ref<HTMLInputElement>
}

// Misure in px: devono restare allineate con Input.css
const FIELD_H = 44
const TAB_H = 26
// Quanto la linguetta entra nel campo: il goo ci costruisce sopra il ponte liquido
const OVERLAP = 6
const RAISE = TAB_H - OVERLAP
// Da ferma la linguetta sta centrata dentro il campo (stesso colore: invisibile)
const SUNK = RAISE + (FIELD_H - TAB_H) / 2

// Salita: la goccia "cola" verso l'alto e rimbalza; discesa: risucchiata senza rimbalzo
const flow = { type: 'spring', stiffness: 460, damping: 26 } as const
const suck = { type: 'spring', stiffness: 520, damping: 40 } as const

const filled = (v: unknown) => v != null && String(v) !== ''

/*
 * Campo con label "liquida": la label vive dentro il campo e, al focus o con un valore,
 * sale sopra come una linguetta fusa al bordo dal filtro goo. Solo allora compare il placeholder.
 * Label e <input> stanno fuori dal livello filtrato: caret, selezione e autofill restano nativi.
 */
function Input({
  label,
  id,
  className,
  style,
  ref,
  value,
  defaultValue,
  disabled,
  onChange,
  onFocus,
  onBlur,
  onAnimationStart,
  ...rest
}: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const filterId = useId()
  const reduceMotion = useReducedMotion()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [focused, setFocused] = useState(false)
  const [hasValueState, setHasValue] = useState(() => filled(defaultValue))
  const controlled = value !== undefined
  const floated = focused || (controlled ? filled(value) : hasValueState)

  // Una molla per la posizione (y) e una per la dimensione della goccia
  const y = useMotionValue(floated ? 0 : SUNK)
  const size = useMotionValue(floated ? 1 : 0.6)
  // Squash & stretch: in corsa la goccia si allunga in verticale e si assottiglia
  const velocity = useVelocity(y)
  const stretch = useTransform(velocity, [-500, 0, 500], [1.3, 1, 1.3])
  const squash = useTransform(velocity, [-500, 0, 500], [0.82, 1, 0.82])
  const scaleX = useTransform(() => size.get() * squash.get())
  const scaleY = useTransform(() => size.get() * stretch.get())

  useEffect(() => {
    const transition = reduceMotion ? { duration: 0 } : floated ? flow : suck
    const controls = [
      animate(y, floated ? 0 : SUNK, transition),
      animate(size, floated ? 1 : 0.6, transition),
    ]
    return () => controls.forEach((c) => c.stop())
  }, [floated, reduceMotion, y, size])

  // L'autofill (e il ripristino del form dal browser) non sempre scatena onChange
  function syncValue() {
    if (inputRef.current) setHasValue(inputRef.current.value !== '')
  }
  useLayoutEffect(syncValue, [])

  function setRefs(node: HTMLInputElement | null) {
    inputRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={className ? `input ${className}` : 'input'}
        style={style}
        data-floated={floated || undefined}
        data-focused={focused || undefined}
        data-disabled={disabled || undefined}
      >
        <GooFilter id={filterId} blur={5} shadow={false} />
        <div
          className="input__shape"
          aria-hidden="true"
          style={{ filter: reduceMotion ? undefined : `url(#${CSS.escape(filterId)})` }}
        >
          <span className="input__field-bg" />
          <motion.span className="input__tab-bg" style={{ y, scaleX, scaleY }}>
            {/* Copia invisibile della label: dà alla linguetta la larghezza giusta senza misurare */}
            <span className="input__tab-sizer">{label}</span>
          </motion.span>
        </div>

        <motion.label
          className="input__label"
          htmlFor={inputId}
          initial={false}
          animate={floated ? { x: 24, y: 0, scale: 0.8 } : { x: 18, y: SUNK, scale: 1 }}
          transition={reduceMotion ? { duration: 0 } : floated ? flow : suck}
        >
          {label}
        </motion.label>

        <input
          {...rest}
          ref={setRefs}
          id={inputId}
          className="input__control"
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={(e) => {
            setHasValue(e.currentTarget.value !== '')
            onChange?.(e)
          }}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            syncValue()
            onBlur?.(e)
          }}
          // Vedi @keyframes gloop-input-autofill in Input.css
          onAnimationStart={(e) => {
            if (e.animationName === 'gloop-input-autofill') syncValue()
            onAnimationStart?.(e)
          }}
        />
      </div>
    </MotionConfig>
  )
}

export default Input
