import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type InputHTMLAttributes, type Ref } from 'react'
import { GooFilter } from './goo'
import { GloopMotionProvider, type MotionProps } from './motion-context'
import { useGloopMotion } from './gloop-motion'
import './theme.css'
import './Input.css'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Etichetta: dentro il campo da vuoto, sopra come goccia al focus o con un valore */
  label: string
  ref?: Ref<HTMLInputElement>
} & MotionProps

// Misure in px: devono restare allineate con Input.css
const FIELD_H = 44
const TAB_H = 26
// Quanto la linguetta entra nel campo: il goo ci costruisce sopra il ponte liquido
const OVERLAP = 6
const RAISE = TAB_H - OVERLAP
// Da ferma la linguetta sta centrata dentro il campo (stesso colore: invisibile). Va in Input.css come --input-sunk
const SUNK = RAISE + (FIELD_H - TAB_H) / 2

/*
 * Salita: la goccia "cola" verso l'alto e rimbalza (flow); discesa: risucchiata senza
 * rimbalzo (suck). Le due molle sono easing linear() in Input.css, una coppia per preset.
 */

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
  speed,
  motion: motionPreset,
  animated,
  reducedMotion,
  ...rest
}: InputProps) {
  const motionProps = { speed, motion: motionPreset, animated, reducedMotion }
  const m = useGloopMotion(motionProps)
  const autoId = useId()
  const inputId = id ?? autoId
  const filterId = useId()
  const reduceMotion = m.reduced
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [focused, setFocused] = useState(false)
  const [hasValueState, setHasValue] = useState(() => filled(defaultValue))
  const controlled = value !== undefined
  const floated = focused || (controlled ? filled(value) : hasValueState)

  /*
   * Posizione e dimensione della goccia le anima Input.css (data-floated). Lo squash & stretch
   * in corsa è un'animazione che segue la velocità della molla: il nome cambia a ogni salita
   * e discesa, così riparte. Parte solo dopo il primo cambio, non al montaggio.
   */
  const [toggled, setToggled] = useState(false)
  const [firstFloated] = useState(floated)
  if (!toggled && floated !== firstFloated) setToggled(true)

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
    <GloopMotionProvider {...motionProps}>
      <div
        {...m.rootProps}
        className={className ? `input ${className}` : 'input'}
        style={{ ...m.rootProps.style, '--input-sunk': `${SUNK}px`, ...style } as CSSProperties}
        data-floated={floated || undefined}
        data-toggled={toggled || undefined}
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
          <span className="input__tab-bg">
            {/* Copia invisibile della label: dà alla linguetta la larghezza giusta senza misurare */}
            <span className="input__tab-sizer">{label}</span>
          </span>
        </div>

        <label className="input__label" htmlFor={inputId}>
          {label}
        </label>

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
    </GloopMotionProvider>
  )
}

export default Input
