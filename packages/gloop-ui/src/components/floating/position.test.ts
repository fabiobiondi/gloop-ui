import { describe, expect, it } from 'vitest'
import { computePosition, type PositionOptions } from './position'

const viewport = { width: 1000, height: 800 }
// Trigger 100×40 al centro del viewport
const trigger = { top: 380, left: 450, width: 100, height: 40 }
const size = { width: 200, height: 60 }
const base: PositionOptions = { placement: 'top', align: 'center', offset: 10, viewport, padding: 8, arrowInset: 20 }

describe('computePosition', () => {
  it.each([
    ['top', { x: 400, y: 310 }],
    ['bottom', { x: 400, y: 430 }],
    ['left', { x: 240, y: 370 }],
    ['right', { x: 560, y: 370 }],
  ] as const)('places the bubble on the %s side, centered', (placement, expected) => {
    const pos = computePosition(trigger, size, { ...base, placement })
    expect(pos).toMatchObject({ ...expected, placement })
  })

  it.each([
    ['start', 450, 50],
    ['center', 400, 100],
    ['end', 350, 150],
  ] as const)('aligns to %s and keeps the arrow on the trigger center', (align, x, arrowOffset) => {
    const pos = computePosition(trigger, size, { ...base, align })
    expect(pos.x).toBe(x)
    expect(pos.arrowOffset).toBe(arrowOffset)
  })

  it('aligns on the vertical axis for left/right placements', () => {
    const pos = computePosition(trigger, size, { ...base, placement: 'right', align: 'start' })
    expect(pos.y).toBe(380)
    expect(pos.arrowOffset).toBe(20)
  })

  it('flips to the bottom when there is no room on top', () => {
    const pos = computePosition({ ...trigger, top: 20 }, size, base)
    expect(pos.placement).toBe('bottom')
    expect(pos.y).toBe(70)
  })

  it('flips to the top when there is no room below', () => {
    const pos = computePosition({ ...trigger, top: 740 }, size, { ...base, placement: 'bottom' })
    expect(pos.placement).toBe('top')
    expect(pos.y).toBe(670)
  })

  it('flips left/right too', () => {
    const pos = computePosition({ ...trigger, left: 900 }, size, { ...base, placement: 'right' })
    expect(pos.placement).toBe('left')
  })

  it('keeps the side when the opposite one has even less room', () => {
    const tall = { width: 200, height: 500 }
    const pos = computePosition({ ...trigger, top: 500 }, tall, base)
    expect(pos.placement).toBe('top')
  })

  it('shifts inside the viewport and moves the arrow toward the trigger', () => {
    const pos = computePosition({ ...trigger, left: 0, width: 40 }, size, base)
    expect(pos.x).toBe(8)
    // Centro del trigger = 20, bolla da 8: la freccia sarebbe a 12, limitata dall'angolo a 20
    expect(pos.arrowOffset).toBe(20)

    const right = computePosition({ ...trigger, left: 940, width: 40 }, size, base)
    expect(right.x).toBe(1000 - 200 - 8)
    expect(right.arrowOffset).toBe(960 - 792)
  })

  it('sticks to the padding when the bubble is wider than the viewport', () => {
    const pos = computePosition(trigger, { width: 1200, height: 60 }, base)
    expect(pos.x).toBe(8)
  })

  it('centers the arrow on bubbles too small for the inset', () => {
    const pos = computePosition(trigger, { width: 30, height: 30 }, base)
    expect(pos.arrowOffset).toBe(15)
  })

  it('returns the measured size', () => {
    expect(computePosition(trigger, size, base)).toMatchObject(size)
  })
})
