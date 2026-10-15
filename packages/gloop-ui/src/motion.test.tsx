import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
// useReducedMotion di motion legge la media query una volta sola: lo pilotiamo da qui
const os = vi.hoisted(() => ({ reduced: false }))
vi.mock('motion/react', async (importActual) => ({
  ...(await importActual<typeof import('motion/react')>()),
  useReducedMotion: () => os.reduced,
}))

import { GloopMotionProvider, TabBar, tuneTransition, useGloopMotion, type MotionProps } from './index'

describe('tuneTransition', () => {
  it('divides durations and delays by speed', () => {
    expect(tuneTransition({ duration: 0.4, delay: 0.2, ease: 'easeOut' }, { speed: 2 })).toEqual({
      duration: 0.2,
      delay: 0.1,
      ease: 'easeOut',
    })
  })

  it('scales physical springs keeping the damping ratio', () => {
    const out = tuneTransition({ type: 'spring', stiffness: 100, damping: 10, mass: 1 }, { speed: 2 })
    expect(out).toMatchObject({ stiffness: 400, damping: 20, mass: 1 })
  })

  it('tunes nested per-property transitions', () => {
    const out = tuneTransition({ duration: 1, opacity: { duration: 0.5, ease: [0.2, 0, 0, 1] } }, { speed: 2 })
    expect(out).toEqual({ duration: 0.5, opacity: { duration: 0.25, ease: [0.2, 0, 0, 1] } })
  })

  it('smooth removes the bounce', () => {
    expect(tuneTransition({ type: 'spring', duration: 0.5, bounce: 0.3 }, { preset: 'smooth' })).toMatchObject({
      bounce: 0,
      duration: 0.5,
    })
    const physical = tuneTransition({ stiffness: 400, damping: 10 }, { preset: 'smooth' }) as {
      damping: number
    }
    expect(physical.damping).toBe(40) // smorzamento critico: 2·√(400·1)
  })

  it('snappy halves the bounce and shortens durations', () => {
    expect(tuneTransition({ type: 'spring', duration: 0.6, bounce: 0.3 }, { preset: 'snappy' })).toMatchObject({
      bounce: 0.15,
      duration: expect.closeTo(0.45),
    })
  })

  it('falls back to speed 1 for invalid values', () => {
    expect(tuneTransition({ duration: 0.4 }, { speed: 0 })).toEqual({ duration: 0.4 })
    expect(tuneTransition({ duration: 0.4 }, { speed: -1 })).toEqual({ duration: 0.4 })
  })
})

function wrap(...configs: MotionProps[]) {
  return ({ children }: { children: ReactNode }) =>
    configs.reduceRight<ReactNode>((acc, c) => <GloopMotionProvider {...c}>{acc}</GloopMotionProvider>, children)
}

describe('useGloopMotion', () => {
  afterEach(() => {
    os.reduced = false
  })

  it('uses defaults without a provider', () => {
    const { result } = renderHook(() => useGloopMotion())
    expect(result.current).toMatchObject({ speed: 1, preset: 'gloop', state: 'on', reduced: false })
  })

  it('props override the nearest provider, which overrides outer ones', () => {
    const { result } = renderHook(() => useGloopMotion({ motion: 'snappy' }), {
      wrapper: wrap({ speed: 0.5, motion: 'smooth' }, { speed: 3 }),
    })
    expect(result.current).toMatchObject({ speed: 3, preset: 'snappy' })
  })

  it('animated=false makes every transition instant', () => {
    const { result } = renderHook(() => useGloopMotion(), { wrapper: wrap({ animated: false }) })
    expect(result.current.state).toBe('off')
    expect(result.current.t({ type: 'spring', duration: 0.5, delay: 1 })).toEqual({ duration: 0 })
  })

  it.each([
    ['user', false, 'on'],
    ['user', true, 'reduced'],
    ['always', false, 'reduced'],
    ['never', true, 'on'],
  ] as const)('reducedMotion=%s with OS reduced=%s → %s', (reducedMotion, osReduced, state) => {
    os.reduced = osReduced
    const { result } = renderHook(() => useGloopMotion({ reducedMotion }))
    expect(result.current.state).toBe(state)
  })

  it('exposes state and speed on the component root', () => {
    const { container } = render(
      <GloopMotionProvider speed={2}>
        <TabBar tabs={[{ icon: null, label: 'Home' }]} reducedMotion="always" />
      </GloopMotionProvider>,
    )
    const nav = container.querySelector('nav')!
    expect(nav.dataset.motion).toBe('reduced')
    expect(nav.style.getPropertyValue('--ui-motion-speed')).toBe('2')
  })
})
