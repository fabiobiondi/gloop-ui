import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { PipetteIcon } from '../shape-toolbar/icons'
import { useGloopMotion } from '../gloop-motion'
import { afterAnimations, useDismiss, useMountId, useSharedLayout } from './menu-shared'

/* ---------- Cambio di contenuto: il vecchio esce mentre il nuovo entra ---------- */

type PopEntry<K> = { key: K; id: number; exiting: boolean; enter: boolean }

/*
 * Al posto di AnimatePresence mode="popLayout" initial={false}: a ogni cambio di value
 * il contenuto vecchio resta montato fuori dal flusso (data-pop="exit", position absolute)
 * finché la sua animazione di uscita non finisce, e il nuovo entra (data-pop="enter").
 * Al montaggio nessuna animazione; con animated={false} il vecchio sparisce subito.
 */
export function PopLayout<K extends string | number>({
  value,
  className,
  children,
}: {
  value: K
  className?: string
  children: (value: K) => ReactNode
}) {
  const { state } = useGloopMotion()
  const [entries, setEntries] = useState<PopEntry<K>[]>(() => [{ key: value, id: 0, exiting: false, enter: false }])
  const [prev, setPrev] = useState(value)
  if (value !== prev) {
    setPrev(value)
    const id = Math.max(...entries.map((e) => e.id)) + 1
    const exiting = state === 'off' ? [] : entries.filter((e) => e.key !== value).map((e) => ({ ...e, exiting: true }))
    setEntries([...exiting, { key: value, id, exiting: false, enter: true }])
  }

  return entries.map((e) => (
    <PopItem
      key={e.id}
      className={className}
      exiting={e.exiting}
      enter={e.enter}
      onExited={() => setEntries((list) => list.filter((x) => x.id !== e.id))}
    >
      {children(e.key)}
    </PopItem>
  ))
}

function PopItem({
  className,
  exiting,
  enter,
  onExited,
  children,
}: {
  className?: string
  exiting: boolean
  enter: boolean
  onExited: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const onExitedRef = useRef(onExited)
  useLayoutEffect(() => {
    onExitedRef.current = onExited
  })
  useLayoutEffect(() => {
    if (exiting) return afterAnimations(ref.current, () => onExitedRef.current())
  }, [exiting])

  return (
    <span ref={ref} className={className} data-pop={exiting ? 'exit' : enter ? 'enter' : undefined}>
      {children}
    </span>
  )
}

/* ---------- Valore numerico che scorre su/giù quando cambia ---------- */

export function AnimatedValue({ value }: { value: number }) {
  const [prev, setPrev] = useState(value)
  const [dir, setDir] = useState(1)
  if (value !== prev) {
    setPrev(value)
    setDir(value > prev ? 1 : -1)
  }

  return (
    // --dir: verso dello scorrimento, vale sia per chi entra sia per chi esce
    <span className="st-value" style={{ '--dir': dir } as CSSProperties}>
      <PopLayout value={value}>{(v) => v}</PopLayout>
    </span>
  )
}

export function StrokeLine({ width }: { width: number }) {
  return <span className="st-line" style={{ height: Math.min(width, 10) }} />
}

/* ---------- Color picker ---------- */

const COLORS = [
  'transparent',
  '#ffffff',
  '#f4f4f5',
  '#d4d4d8',
  '#71717a',
  '#3f3f46',
  '#18181b',
  '#fecaca',
  '#fbcfe8',
  '#e9d5ff',
  '#c7d2fe',
  '#bfdbfe',
  '#a5f3fc',
  '#a7f3d0',
  '#bbf7d0',
  '#d9f99d',
  '#fef08a',
  '#fed7aa',
  '#e7e5e4',
]

type EyeDropperCtor = new () => { open(): Promise<{ sRGBHex: string }> }
const EyeDropper = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper

type ColorPickerProps = {
  value: string
  onChange: (color: string) => void
  allowNone?: boolean
}

export function ColorPicker({ value, onChange, allowNone = true }: ColorPickerProps) {
  const ringId = useMountId()
  const [text, setText] = useState(value)
  const [prev, setPrev] = useState(value)
  if (value !== prev) {
    setPrev(value)
    setText(value)
  }

  const colors = allowNone ? COLORS : COLORS.slice(1)

  return (
    <div className="st-colors">
      <div className="st-colors__grid">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            className="st-swatch-btn"
            aria-label={c === 'transparent' ? 'No color' : c}
            aria-pressed={value === c}
            data-none={c === 'transparent' || undefined}
            style={{ background: c === 'transparent' ? undefined : c }}
            onClick={() => onChange(c)}
          >
            {value === c && <Shared id={ringId} className="st-ring" curve="glide" />}
          </button>
        ))}
        {EyeDropper && (
          <button
            type="button"
            className="st-swatch-btn st-swatch-btn--tool"
            aria-label="Eyedropper"
            onClick={() =>
              new EyeDropper()
                .open()
                .then((r) => onChange(r.sRGBHex))
                .catch(() => {})
            }
          >
            <PipetteIcon />
          </button>
        )}
      </div>
      <input
        className="st-hex"
        aria-label="Hex color"
        placeholder="#rrggbb"
        spellCheck={false}
        value={text === 'transparent' ? '' : text}
        onChange={(e) => {
          setText(e.target.value)
          if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value)
        }}
      />
    </div>
  )
}

/* ---------- Griglia di opzioni (motivi) ---------- */

type SwatchRowProps<T extends string> = {
  options: { value: T; label: string; render: ReactNode }[]
  value: T
  onChange: (value: T) => void
}

export function SwatchRow<T extends string>({ options, value, onChange }: SwatchRowProps<T>) {
  const ringId = useMountId()

  return (
    <div className="st-row">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="st-option-tile"
          aria-label={o.label}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {value === o.value && <Shared id={ringId} className="st-ring" curve="glide" />}
          {o.render}
        </button>
      ))}
    </div>
  )
}

/* ---------- Lista a tendina: la pillola di hover scivola sotto il cursore ---------- */

type OptionListProps = {
  options: number[]
  value: number
  onChange: (value: number) => void
  render?: (value: number) => ReactNode
}

export function OptionList({ options, value, onChange, render = (v) => v }: OptionListProps) {
  const dismiss = useDismiss()
  const hoverId = useMountId()
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="st-options" onPointerLeave={() => setHovered(null)}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className="st-option"
          aria-pressed={value === o}
          onPointerEnter={() => setHovered(o)}
          onFocus={() => setHovered(o)}
          onClick={() => {
            onChange(o)
            dismiss()
          }}
        >
          {hovered === o && <Shared id={hoverId} className="st-option__hover" curve="hover" />}
          <span className="st-option__content">{render(o)}</span>
        </button>
      ))}
    </div>
  )
}

/* ---------- Elemento condiviso (anello, pillola): scivola da un'opzione all'altra ---------- */

function Shared({ id, className, curve }: { id: string; className: string; curve: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useSharedLayout(id, ref, curve)
  return <span ref={ref} className={className} />
}
