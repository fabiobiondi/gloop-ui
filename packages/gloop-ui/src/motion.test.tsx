import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { GloopMotionProvider, TabBar, useGloopMotion, type MotionProps } from './index'

// useGloopMotion legge prefers-reduced-motion con matchMedia: lo pilotiamo da qui
const os = { reduced: false }
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: query.includes('reduce') && os.reduced,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
}))

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

  it('animated=false turns the animations off', () => {
    const { result } = renderHook(() => useGloopMotion(), { wrapper: wrap({ animated: false }) })
    expect(result.current.state).toBe('off')
    expect(result.current.rootProps['data-motion']).toBe('off')
  })

  it('falls back to speed 1 for invalid values', () => {
    const { result } = renderHook(() => useGloopMotion({ speed: -1 }))
    expect(result.current.speed).toBe(1)
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

  it('exposes state, preset and speed on the component root', () => {
    const { container } = render(
      <GloopMotionProvider speed={2} motion="snappy">
        <TabBar tabs={[{ icon: null, label: 'Home' }]} reducedMotion="always" />
      </GloopMotionProvider>,
    )
    const nav = container.querySelector('nav')!
    expect(nav.dataset.motion).toBe('reduced')
    expect(nav.dataset.motionPreset).toBe('snappy')
    expect(nav.style.getPropertyValue('--ui-motion-speed')).toBe('2')
  })
})
