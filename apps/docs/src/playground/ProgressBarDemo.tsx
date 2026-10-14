import { useEffect, useState } from 'react'
import { ProgressBar, Slider } from 'gloop-ui'

const COLORS: { name: string; value?: string | [string, string] }[] = [
  { name: 'Accent' },
  { name: 'Bubblegum', value: ['#ff7ab6', '#7b5cff'] },
  { name: 'Ocean', value: ['#38bdf8', '#2563eb'] },
  { name: 'Lime', value: ['#a3e635', '#16a34a'] },
]

const swatch = (value?: string | [string, string]) =>
  value == null ? 'var(--ui-accent)' : typeof value === 'string' ? value : `linear-gradient(135deg, ${value[0]}, ${value[1]})`

const button = {
  padding: '6px 14px',
  border: 0,
  borderRadius: 999,
  background: 'var(--ui-bg)',
  color: 'var(--ui-fg)',
  font: 'inherit',
  fontSize: 13,
  cursor: 'pointer',
} as const

// Upload simulato: il valore avanza a scatti irregolari, così si vede la molla a ogni passo
export function ProgressBarAutoDemo() {
  const [value, setValue] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || value >= 100) return
    const t = setTimeout(() => setValue((v) => Math.min(100, v + 5 + Math.round(Math.random() * 15))), 700)
    return () => clearTimeout(t)
  }, [value, paused])

  return (
    <div style={{ display: 'grid', gap: 16, width: 'min(100%, 360px)' }}>
      <ProgressBar label="Upload" value={value} showValue="bubble" color={['#ff7ab6', '#7b5cff']} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button type="button" style={button} onClick={() => setValue(0)}>
          Restart
        </button>
        <button type="button" style={button} onClick={() => setPaused((p) => !p)} disabled={value >= 100}>
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>
    </div>
  )
}

// Prova dal vivo: valore, spessore, colore, drip e modalità indeterminata
export function ProgressBarPlayground() {
  const [value, setValue] = useState(45)
  const [thickness, setThickness] = useState(10)
  const [color, setColor] = useState(0)
  const [drip, setDrip] = useState(false)
  const [indeterminate, setIndeterminate] = useState(false)

  return (
    <div style={{ display: 'grid', gap: 24, width: 'min(100%, 360px)' }}>
      <ProgressBar
        label="Progress"
        value={indeterminate ? undefined : value}
        thickness={thickness}
        color={COLORS[color].value}
        drip={drip}
        showValue="bubble"
      />
      <div style={{ display: 'grid', gap: 16 }}>
        <Slider label="Value" value={value} onChange={setValue} showValue="always" formatValue={(v) => `${v}%`} disabled={indeterminate} />
        <Slider label="Thickness" min={4} max={24} value={thickness} onChange={setThickness} showValue="always" formatValue={(v) => `${v}px`} />
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 13 }}>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={drip} onChange={(e) => setDrip(e.target.checked)} /> Drip
          </label>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={indeterminate} onChange={(e) => setIndeterminate(e.target.checked)} /> Indeterminate
          </label>
        </div>
        <div role="radiogroup" aria-label="Color" style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {COLORS.map((c, i) => (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={i === color}
              aria-label={c.name}
              title={c.name}
              onClick={() => setColor(i)}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                border: 0,
                borderRadius: 999,
                background: swatch(c.value),
                cursor: 'pointer',
                outline: i === color ? '2px solid currentColor' : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
