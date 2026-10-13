import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { PipetteIcon } from './icons'
import { glide, itemVariants, useDismiss, useMountId } from './menu-shared'

/* ---------- Valore numerico che scorre su/giù quando cambia ---------- */

const valueVariants: Variants = {
  enter: (dir: number) => ({ y: dir * 10, opacity: 0, filter: 'blur(2px)' }),
  center: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.3, bounce: 0.2 },
  },
  exit: (dir: number) => ({
    y: dir * -10,
    opacity: 0,
    filter: 'blur(2px)',
    transition: { duration: 0.12 },
  }),
}

export function AnimatedValue({ value }: { value: number }) {
  const [prev, setPrev] = useState(value)
  const [dir, setDir] = useState(1)
  if (value !== prev) {
    setPrev(value)
    setDir(value > prev ? 1 : -1)
  }

  return (
    <span className="st-value">
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.span
          key={value}
          custom={dir}
          variants={valueVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {value}
        </motion.span>
      </AnimatePresence>
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
          <motion.button
            key={c}
            type="button"
            className="st-swatch-btn"
            aria-label={c === 'transparent' ? 'No color' : c}
            aria-pressed={value === c}
            data-none={c === 'transparent' || undefined}
            style={{ background: c === 'transparent' ? undefined : c }}
            variants={itemVariants}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(c)}
          >
            {value === c && (
              <motion.span layoutId={ringId} className="st-ring" transition={glide} />
            )}
          </motion.button>
        ))}
        {EyeDropper && (
          <motion.button
            type="button"
            className="st-swatch-btn st-swatch-btn--tool"
            aria-label="Eyedropper"
            variants={itemVariants}
            whileTap={{ scale: 0.9 }}
            onClick={() =>
              new EyeDropper()
                .open()
                .then((r) => onChange(r.sRGBHex))
                .catch(() => {})
            }
          >
            <PipetteIcon />
          </motion.button>
        )}
      </div>
      <motion.input
        className="st-hex"
        aria-label="Hex color"
        placeholder="#rrggbb"
        spellCheck={false}
        value={text === 'transparent' ? '' : text}
        variants={itemVariants}
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
        <motion.button
          key={o.value}
          type="button"
          className="st-option-tile"
          aria-label={o.label}
          aria-pressed={value === o.value}
          variants={itemVariants}
          whileTap={{ scale: 0.92 }}
          onClick={() => onChange(o.value)}
        >
          {value === o.value && (
            <motion.span layoutId={ringId} className="st-ring" transition={glide} />
          )}
          {o.render}
        </motion.button>
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
        <motion.button
          key={o}
          type="button"
          className="st-option"
          aria-pressed={value === o}
          variants={itemVariants}
          onPointerEnter={() => setHovered(o)}
          onFocus={() => setHovered(o)}
          onClick={() => {
            onChange(o)
            dismiss()
          }}
        >
          {hovered === o && (
            <motion.span
              layoutId={hoverId}
              className="st-option__hover"
              transition={{ type: 'spring', duration: 0.25, bounce: 0 }}
            />
          )}
          <span className="st-option__content">{render(o)}</span>
        </motion.button>
      ))}
    </div>
  )
}
