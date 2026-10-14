import { useState } from 'react'
import { GloopLoading, Slider } from 'gloop-ui'

const COLORS: { name: string; value: string | [string, string] }[] = [
  { name: 'Bubblegum', value: ['#ff7ab6', '#7b5cff'] },
  { name: 'Ocean', value: ['#38bdf8', '#2563eb'] },
  { name: 'Lime', value: ['#a3e635', '#16a34a'] },
  { name: 'Cherry', value: '#e11d48' },
]

const swatch = (value: string | [string, string]) =>
  typeof value === 'string' ? value : `linear-gradient(135deg, ${value[0]}, ${value[1]})`

// Prova dal vivo: dimensione, colore e velocità della bolla
export function GloopLoadingPlayground() {
  const [size, setSize] = useState(96)
  const [speed, setSpeed] = useState(1)
  const [color, setColor] = useState(0)
  return (
    <div style={{ display: 'grid', gap: 24, justifyItems: 'center', width: 'min(100%, 320px)' }}>
      <GloopLoading
        size={size}
        speed={speed}
        color={COLORS[color].value}
        title="Loading"
        description="Fetching your data…"
      />
      <div style={{ display: 'grid', gap: 16, width: '100%' }}>
        <Slider label="Size" min={40} max={160} step={4} value={size} onChange={setSize} showValue="always" formatValue={(v) => `${v}px`} />
        <Slider label="Speed" min={0.25} max={3} step={0.25} value={speed} onChange={setSpeed} showValue="always" formatValue={(v) => `${v}×`} />
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
