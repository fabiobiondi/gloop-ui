import { useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { CircleMenu, type CircleMenuItem, type CircleMenuPanelApi } from 'gloop-ui'
import './CircleMenuPanels.css'

/* ---------- Icone ---------- */

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const PaletteIcon = svg(
  <>
    <circle cx="13.5" cy="6.5" r="1" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r="1" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r="1" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r="1" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.56-2.5 5.56-5.55C21.97 6.01 17.46 2 12 2Z" />
  </>,
)
const OpacityIcon = svg(
  <>
    <path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0Z" />
    <path d="M12 2.7v18.3" />
  </>,
)
const TypeIcon = svg(<path d="M4 7V4h16v3M9 20h6M12 4v16" />)
const SizeIcon = svg(<path d="M3 7V5h10v2M8 5v14M6 19h4M14 13v-2h7v2M17.5 11v8M16 19h3" />)
const LineIcon = svg(<path d="M4 20 20 4" />)
const DashIcon = svg(<path d="M4 12h3M10.5 12h3M17 12h3" />)
const WidthIcon = svg(
  <>
    <path d="M4 6h16" strokeWidth="1" />
    <path d="M4 12h16" strokeWidth="2.5" />
    <path d="M4 18h16" strokeWidth="4" />
  </>,
)
const CheckIcon = svg(<path d="M20 6 9 17l-5-5" />)

/* ---------- Valori ---------- */

const COLORS = ['#f4f4f5', '#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6', '#18181b']
const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40]
const STROKE_WIDTHS = [1, 2, 3, 4, 6, 8, 12]
const STROKE_STYLES = [
  { value: 'solid', label: 'Solid', dash: undefined },
  { value: 'dashed', label: 'Dashed', dash: '10 6' },
  { value: 'dotted', label: 'Dotted', dash: '1 6' },
] as const

type StrokeStyle = (typeof STROKE_STYLES)[number]['value']

type Style = {
  color: string
  opacity: number
  fontSize: number
  strokeStyle: StrokeStyle
  strokeWidth: number
}

const INITIAL: Style = { color: '#60a5fa', opacity: 100, fontSize: 20, strokeStyle: 'solid', strokeWidth: 2 }

/* ---------- Pannelli: componenti qualsiasi, ricevono { close, back } dal menu ---------- */

type PanelProps<T> = { value: T; onChange: (v: T) => void; api: CircleMenuPanelApi }

function ColorPanel({ value, onChange, api }: PanelProps<string>) {
  return (
    <div className="cmp-colors" role="radiogroup" aria-label="Color">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={c === value}
          aria-label={c}
          className="cmp-swatch"
          style={{ '--swatch': c } as CSSProperties}
          onClick={() => {
            onChange(c)
            api.back()
          }}
        />
      ))}
    </div>
  )
}

// Lo slider resta aperto: si chiude con un clic fuori o con Esc
function OpacityPanel({ value, onChange }: PanelProps<number>) {
  return (
    <label className="cmp-slider">
      <span>Opacity</span>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <output>{value}%</output>
    </label>
  )
}

// Scelta fatta: close() chiude anche il menu
function FontSizePanel({ value, onChange, api }: PanelProps<number>) {
  return (
    <ul className="cmp-list cmp-list--sizes" role="listbox" aria-label="Font size">
      {FONT_SIZES.map((size) => (
        <li key={size}>
          <button
            type="button"
            role="option"
            aria-selected={size === value}
            onClick={() => {
              onChange(size)
              api.close()
            }}
          >
            <span style={{ fontSize: Math.min(size, 28) }}>Aa</span>
            <span className="cmp-list__value">{size}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function StrokeStylePanel({ value, onChange, api }: PanelProps<StrokeStyle>) {
  return (
    <div className="cmp-segments" role="radiogroup" aria-label="Stroke style">
      {STROKE_STYLES.map((s) => (
        <button
          key={s.value}
          type="button"
          role="radio"
          aria-checked={s.value === value}
          aria-label={s.label}
          onClick={() => {
            onChange(s.value)
            api.back()
          }}
        >
          <svg viewBox="0 0 40 8" aria-hidden="true">
            <line x1="4" y1="4" x2="36" y2="4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray={s.dash} />
          </svg>
        </button>
      ))}
    </div>
  )
}

function StrokeWidthPanel({ value, onChange, api }: PanelProps<number>) {
  return (
    <ul className="cmp-list" role="listbox" aria-label="Stroke width">
      {STROKE_WIDTHS.map((w) => (
        <li key={w}>
          <button
            type="button"
            role="option"
            aria-selected={w === value}
            onClick={() => {
              onChange(w)
              api.back()
            }}
          >
            <span className="cmp-line" style={{ height: w }} />
            <span className="cmp-list__value">{w}</span>
            {w === value && <span className="cmp-list__check">{CheckIcon}</span>}
          </button>
        </li>
      ))}
    </ul>
  )
}

/* ---------- Demo ---------- */

function Sample({ style }: { style: Style }) {
  const dash = STROKE_STYLES.find((s) => s.value === style.strokeStyle)?.dash
  return (
    <svg className="cmp-sample" viewBox="0 0 200 120" role="img" aria-label="Preview of the selected style">
      <rect
        x="10"
        y="10"
        width="180"
        height="100"
        rx="16"
        fill="none"
        stroke={style.color}
        strokeWidth={style.strokeWidth}
        strokeDasharray={dash}
        strokeLinecap="round"
        opacity={style.opacity / 100}
      />
      <text
        x="100"
        y="60"
        textAnchor="middle"
        dominantBaseline="central"
        fill={style.color}
        fontSize={style.fontSize}
        fontWeight="600"
        opacity={style.opacity / 100}
      >
        Hello
      </text>
    </svg>
  )
}

// Stile della forma di prova e un item con pannello per ogni proprietà
function useStyleItems() {
  const [style, setStyle] = useState(INITIAL)
  const set =
    <K extends keyof Style>(key: K) =>
    (v: Style[K]) =>
      setStyle((s) => ({ ...s, [key]: v }))

  const items = {
    color: {
      icon: PaletteIcon,
      label: 'Color',
      tooltip: true,
      panel: (api) => <ColorPanel value={style.color} onChange={set('color')} api={api} />,
    },
    opacity: {
      icon: OpacityIcon,
      label: 'Opacity',
      tooltip: true,
      panel: (api) => <OpacityPanel value={style.opacity} onChange={set('opacity')} api={api} />,
    },
    fontSize: {
      icon: SizeIcon,
      label: 'Font size',
      tooltip: true,
      panel: (api) => <FontSizePanel value={style.fontSize} onChange={set('fontSize')} api={api} />,
    },
    strokeStyle: {
      icon: DashIcon,
      label: 'Stroke style',
      tooltip: true,
      panel: (api) => <StrokeStylePanel value={style.strokeStyle} onChange={set('strokeStyle')} api={api} />,
    },
    strokeWidth: {
      icon: WidthIcon,
      label: 'Stroke width',
      tooltip: true,
      panel: (api) => <StrokeWidthPanel value={style.strokeWidth} onChange={set('strokeWidth')} api={api} />,
    },
  } satisfies Record<string, CircleMenuItem>

  return { style, items }
}

/*
 * variant 'circle': tutti i pannelli al primo livello.
 * variant 'arc': i pannelli stanno nell'ultimo ramo, dentro i sottomenu.
 */
export function CircleMenuPanelsDemo({ variant }: { variant: 'circle' | 'arc' }) {
  const { style, items: it } = useStyleItems()
  const items: CircleMenuItem[] =
    variant === 'circle'
      ? [it.color, it.opacity, it.fontSize, it.strokeStyle, it.strokeWidth]
      : [
          it.color,
          { icon: TypeIcon, label: 'Text', tooltip: true, items: [it.fontSize, it.opacity] },
          { icon: LineIcon, label: 'Line', tooltip: true, items: [it.strokeStyle, it.strokeWidth] },
        ]

  return (
    <div className="cmp-demo" data-variant={variant}>
      <CircleMenu label="style" items={items} direction={variant === 'arc' ? 'right' : undefined} />
      <Sample style={style} />
    </div>
  )
}

/* ---------- Menu contestuale: si apre dove si clicca con il tasto destro ---------- */

const CENTER = 56

export function CircleMenuContextDemo() {
  const { style, items: it } = useStyleItems()
  const items = [it.color, it.opacity, it.fontSize, it.strokeStyle, it.strokeWidth]
  const areaRef = useRef<HTMLDivElement>(null)
  // Il menu è sempre montato (nascosto da chiuso): spostarlo e aprirlo nello stesso render
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [open, setOpen] = useState(false)

  function onContextMenu(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault()
    // Tasto destro sul menu già aperto: resta dov'è
    if (open && (e.target as Element).closest('.cmp-context')) return
    const el = e.currentTarget
    const area = el.getBoundingClientRect()
    // Da tastiera (tasto Menu, Maiusc+F10) non c'è un punto: si apre al centro
    const fromKeyboard = e.clientX === 0 && e.clientY === 0
    // left/top del menu partono dal bordo interno: si toglie lo spessore del bordo
    setPos({
      x: fromKeyboard ? el.clientWidth / 2 : e.clientX - area.left - el.clientLeft,
      y: fromKeyboard ? el.clientHeight / 2 : e.clientY - area.top - el.clientTop,
    })
    /*
     * Le icone sono posizionate rispetto al "+", quindi escono dal nuovo punto.
     * Se il menu era aperto, il pointerdown del tasto destro lo ha appena chiuso (clic fuori).
     */
    setOpen(true)
  }

  // Chiuso, il "+" sparisce: se aveva il focus, torna all'area
  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) return
    requestAnimationFrame(() => {
      const area = areaRef.current
      if (area && area !== document.activeElement && area.contains(document.activeElement)) area.focus()
    })
  }

  return (
    <div className="cmp-demo">
      <div
        ref={areaRef}
        className="cmp-canvas"
        tabIndex={0}
        aria-label="Canvas: right-click, or press Shift+F10, to open the style menu"
        onContextMenu={onContextMenu}
      >
        {!pos && <span className="cmp-canvas__hint">Right-click anywhere</span>}
        <div
          className="cmp-context"
          data-open={open || undefined}
          style={pos ? { left: pos.x - CENTER / 2, top: pos.y - CENTER / 2 } : { left: 0, top: 0 }}
        >
          <CircleMenu label="style" items={items} reserveSpace={false} open={open} onOpenChange={onOpenChange} />
        </div>
      </div>
      <Sample style={style} />
    </div>
  )
}
