import { describe, expect, it } from 'vitest'
import { clamp, fromPointer, keyValue, snap, stepMarks, toPercent } from './components/slider-math'

describe('slider-math', () => {
  it('clamps', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('snaps to steps counted from min, without float noise', () => {
    expect(snap(0.30000000000000004, 0, 1, 0.1)).toBe(0.3)
    expect(snap(0.26, 0, 1, 0.1)).toBe(0.3)
    expect(snap(7, 2, 20, 5)).toBe(7)
    expect(snap(9, 2, 20, 5)).toBe(7)
    expect(snap(-7, -10, 10, 5)).toBe(-5)
    // Ultimo passo oltre max: si ferma a max
    expect(snap(19, 0, 20, 7)).toBe(20)
    expect(snap(5, 3, 3, 1)).toBe(3)
  })

  it('maps values to percent, also with an empty range', () => {
    expect(toPercent(25, 0, 100)).toBe(25)
    expect(toPercent(0, -10, 10)).toBe(50)
    expect(toPercent(5, 5, 5)).toBe(0)
  })

  it('maps the pointer to a snapped value, clamped outside the rail', () => {
    const rect = { left: 100, width: 200 }
    expect(fromPointer(100, rect, 0, 100, 1)).toBe(0)
    expect(fromPointer(300, rect, 0, 100, 1)).toBe(100)
    expect(fromPointer(50, rect, 0, 100, 1)).toBe(0)
    expect(fromPointer(500, rect, 0, 100, 1)).toBe(100)
    expect(fromPointer(163, rect, 0, 100, 10)).toBe(30)
    expect(fromPointer(150, { left: 0, width: 0 }, 0, 100, 1)).toBe(0)
  })

  it('lists step marks up to a limit', () => {
    expect(stepMarks(0, 1, 0.25)).toEqual([0, 0.25, 0.5, 0.75, 1])
    expect(stepMarks(0, 10, 4)).toEqual([0, 4, 8, 10])
    expect(stepMarks(0, 1000, 1)).toEqual([])
    expect(stepMarks(0, 10, 0)).toEqual([])
  })

  it('computes the value for each key', () => {
    expect(keyValue('ArrowRight', 5, 0, 10, 1)).toBe(6)
    expect(keyValue('ArrowUp', 5, 0, 10, 1)).toBe(6)
    expect(keyValue('ArrowLeft', 0, 0, 10, 1)).toBe(0)
    expect(keyValue('ArrowDown', 5, 0, 10, 1)).toBe(4)
    expect(keyValue('PageUp', 50, 0, 100, 1)).toBe(60)
    expect(keyValue('PageDown', 50, 0, 100, 25)).toBe(25)
    expect(keyValue('Home', 50, 0, 100, 1)).toBe(0)
    expect(keyValue('End', 50, 0, 100, 1)).toBe(100)
    expect(keyValue('Enter', 50, 0, 100, 1)).toBeNull()
  })
})
