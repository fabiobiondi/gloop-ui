// Calcoli dello Slider: puri, così si testano senza layout (jsdom non ne ha)

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

// Cifre decimali di un numero, anche in notazione esponenziale (1e-7)
function decimals(n: number) {
  if (!Number.isFinite(n)) return 0
  const [mantissa, exp] = String(n).toLowerCase().split('e')
  const frac = mantissa.split('.')[1]?.length ?? 0
  return Math.max(0, frac - Number(exp ?? 0))
}

/*
 * Porta il valore sul passo più vicino partendo da min (min + k·step), poi lo limita.
 * L'arrotondamento finale ai decimali di step e min evita 0.30000000000000004.
 */
export function snap(v: number, min: number, max: number, step: number) {
  if (max <= min) return min
  const precision = Math.max(decimals(step), decimals(min))
  const snapped = step > 0 ? min + Math.round((v - min) / step) * step : v
  // L'ultimo passo può superare max quando (max - min) non è multiplo di step
  return clamp(Number(snapped.toFixed(precision)), min, max)
}

export function toPercent(v: number, min: number, max: number) {
  if (max <= min) return 0
  return ((clamp(v, min, max) - min) / (max - min)) * 100
}

export function fromPointer(
  clientX: number,
  rect: { left: number; width: number },
  min: number,
  max: number,
  step: number,
) {
  const ratio = rect.width > 0 ? clamp((clientX - rect.left) / rect.width, 0, 1) : 0
  return snap(min + ratio * (max - min), min, max, step)
}

/** Un valore per ogni passo; oltre `limit` nessuno (migliaia di puntini non si leggono) */
export function stepMarks(min: number, max: number, step: number, limit = 50) {
  if (max <= min || step <= 0) return []
  const count = Math.floor((max - min) / step + 1e-9) + 1
  if (count > limit) return []
  const values = Array.from({ length: count }, (_, i) => snap(min + i * step, min, max, step))
  if (values[values.length - 1] !== max) values.push(max)
  return values
}

/** Nuovo valore per un tasto, o null se il tasto non riguarda lo slider */
export function keyValue(key: string, value: number, min: number, max: number, step: number) {
  const big = Math.max(step, snap(min + (max - min) / 10, min, max, step) - min)
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return snap(value + step, min, max, step)
    case 'ArrowLeft':
    case 'ArrowDown':
      return snap(value - step, min, max, step)
    case 'PageUp':
      return snap(value + big, min, max, step)
    case 'PageDown':
      return snap(value - big, min, max, step)
    case 'Home':
      return min
    case 'End':
      return max
    default:
      return null
  }
}
