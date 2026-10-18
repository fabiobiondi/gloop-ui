import { describe, expect, it } from 'vitest'
import { cssDuration } from './components/css-time'

const css = (value: string) => ({ getPropertyValue: () => value }) as unknown as CSSStyleDeclaration

describe('cssDuration', () => {
  it('reads ms and the s that minifiers write', () => {
    expect(cssDuration(css('494ms'), '--d', 500)).toBe(494)
    expect(cssDuration(css(' .494s'), '--d', 500)).toBe(494)
    expect(cssDuration(css('1s'), '--d', 500)).toBe(1000)
  })

  it('falls back when missing', () => {
    expect(cssDuration(css(''), '--d', 500)).toBe(500)
  })
})
