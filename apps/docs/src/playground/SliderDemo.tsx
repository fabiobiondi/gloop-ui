import { useState } from 'react'
import { Slider } from 'gloop-ui'

// Demo controllata: il valore vive qui e si legge sotto lo slider
export function ControlledSliderDemo() {
  const [volume, setVolume] = useState(40)
  const [saved, setSaved] = useState(40)
  return (
    <div style={{ display: 'grid', gap: 12, width: 280 }}>
      <Slider label="Volume" value={volume} onChange={setVolume} onChangeEnd={setSaved} />
      <small style={{ opacity: 0.7 }}>
        value: {volume} · onChangeEnd: {saved}
      </small>
    </div>
  )
}
