import { useState, type ReactNode } from 'react'
import {
  ExpandButton,
  GloopMotionProvider,
  ProgressBar,
  Slider,
  TabBar,
  type GloopMotionPreset,
  type GloopReducedMotion,
} from 'gloop-ui'
import { LuBell, LuHeart, LuHouse, LuSearch, LuStar, LuUser } from 'react-icons/lu'

// Esempi della guida "Motion": i controlli restano fuori dal provider, così non cambiano con lui

export const MOTION_PROVIDER_CODE = `import { GloopMotionProvider } from 'gloop-ui'

export function App() {
  return (
    <GloopMotionProvider speed={0.8} motion="smooth">
      <Routes />
    </GloopMotionProvider>
  )
}`

export const MOTION_OVERRIDE_CODE = `<GloopMotionProvider speed={0.5}>
  <ExpandButton icon={<LuHeart />} label="Slow" />
  {/* The prop wins over the provider */}
  <ExpandButton icon={<LuStar />} label="Fast" speed={2} />
</GloopMotionProvider>`

export const MOTION_OFF_CODE = `// No animations at all, e.g. in end-to-end tests or visual snapshots
<GloopMotionProvider animated={false}>
  <App />
</GloopMotionProvider>

// Follow the OS setting (default), always reduce, or ignore it
<GloopMotionProvider reducedMotion="user" />
<GloopMotionProvider reducedMotion="always" />
<GloopMotionProvider reducedMotion="never" />`

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <small style={{ opacity: 0.7 }}>{label}</small>
      <div role="radiogroup" aria-label={label} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={option === value}
            onClick={() => onChange(option)}
            style={{
              padding: '4px 10px',
              border: '1px solid color-mix(in srgb, currentColor 40%, transparent)',
              borderRadius: 999,
              color: 'inherit',
              background: option === value ? 'color-mix(in srgb, currentColor 18%, transparent)' : 'transparent',
              font: 'inherit',
              fontSize: 13,
              fontWeight: option === value ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>{children}</div>
}

const PRESETS = ['gloop', 'smooth', 'snappy'] as const satisfies readonly GloopMotionPreset[]
const REDUCED = ['user', 'always', 'never'] as const satisfies readonly GloopReducedMotion[]

// Prova dal vivo: tutte le opzioni del provider applicate a più componenti insieme
export function MotionPlayground() {
  const [speed, setSpeed] = useState(1)
  const [preset, setPreset] = useState<GloopMotionPreset>('gloop')
  const [animated, setAnimated] = useState(true)
  const [reducedMotion, setReducedMotion] = useState<GloopReducedMotion>('user')
  const [volume, setVolume] = useState(40)

  return (
    <div style={{ display: 'grid', gap: 28, width: 'min(100%, 460px)' }}>
      <GloopMotionProvider speed={speed} motion={preset} animated={animated} reducedMotion={reducedMotion}>
        <div style={{ display: 'grid', gap: 24, justifyItems: 'center' }}>
          <TabBar
            layout="inline"
            position="static"
            enterFrom={false}
            tabs={[
              { icon: <LuHouse />, label: 'Home' },
              { icon: <LuSearch />, label: 'Search' },
              { icon: <LuBell />, label: 'Alerts', value: 3 },
              { icon: <LuUser />, label: 'Profile' },
            ]}
          />
          <Row>
            <ExpandButton icon={<LuHeart />} label="Liked" />
            <ExpandButton icon={<LuStar />} label="Starred" drip="hover" />
          </Row>
          <div style={{ display: 'grid', gap: 20, width: '100%' }}>
            <Slider label="Volume" value={volume} onChange={setVolume} />
            <ProgressBar label="Loading" />
          </div>
        </div>
      </GloopMotionProvider>

      <div style={{ display: 'grid', gap: 16 }}>
        <Slider
          label="speed"
          min={0.25}
          max={3}
          step={0.25}
          value={speed}
          onChange={setSpeed}
          showValue="always"
          formatValue={(v) => `${v}×`}
        />
        <Segmented label="motion" options={PRESETS} value={preset} onChange={setPreset} />
        <Segmented label="reducedMotion" options={REDUCED} value={reducedMotion} onChange={setReducedMotion} />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={animated} onChange={(e) => setAnimated(e.target.checked)} /> animated
        </label>
      </div>
    </div>
  )
}

// Il provider rallenta tutto, la prop speed del secondo bottone ha la precedenza
export function MotionOverrideExample() {
  return (
    <GloopMotionProvider speed={0.5}>
      <Row>
        <ExpandButton icon={<LuHeart />} label="Slow" />
        <ExpandButton icon={<LuStar />} label="Fast" speed={2} />
      </Row>
    </GloopMotionProvider>
  )
}
