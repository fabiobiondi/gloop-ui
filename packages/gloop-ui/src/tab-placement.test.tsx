import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TabMenu, TabMenuMotion } from './index'
import { barFootprint, overflow, pickSide, MORPH_ORDER, DETACHED_ORDER } from './components/tab-placement'

const icon = <svg aria-hidden="true" />
const tabs = [
  { icon, label: 'Home' },
  { icon, label: 'Search' },
  { icon, label: 'User' },
]
const area = { top: 0, left: 0, width: 1000, height: 800 }
const trigger = (top: number, left: number) => ({ top, left, width: 52, height: 52 })

describe('tab placement (pure)', () => {
  it('overflow sums what goes out on every side, padding included', () => {
    expect(overflow({ top: 20, left: 20, right: 100, bottom: 100 }, area)).toBe(0)
    expect(overflow({ top: -10, left: 0, right: 1010, bottom: 100 }, area)).toBe(18 + 8 + 18)
  })

  it('detached bar: top if it fits, otherwise bottom', () => {
    const fp = (top: number) => (side: (typeof DETACHED_ORDER)[number]) => barFootprint(trigger(top, 400), side, 3, 'detached')
    expect(pickSide(DETACHED_ORDER, fp(400), area)).toBe('top')
    expect(pickSide(DETACHED_ORDER, fp(30), area)).toBe('bottom')
  })

  it('morph bar: left if it fits, then right, then the columns', () => {
    const fp = (left: number) => (side: (typeof MORPH_ORDER)[number]) => barFootprint(trigger(400, left), side, 3, 'morph')
    expect(pickSide(MORPH_ORDER, fp(500), area)).toBe('left')
    expect(pickSide(MORPH_ORDER, fp(20), area)).toBe('right')
    // In una striscia stretta e alta: non entra in riga, entra in colonna
    const narrow = { top: 0, left: 0, width: 120, height: 800 }
    const fpNarrow = (side: (typeof MORPH_ORDER)[number]) => barFootprint(trigger(400, 34), side, 3, 'morph')
    expect(pickSide(MORPH_ORDER, fpNarrow, narrow)).toBe('top')
  })

  it('falls back to the side that overflows least', () => {
    const tiny = { top: 0, left: 0, width: 100, height: 100 }
    const fp = (side: (typeof DETACHED_ORDER)[number]) => barFootprint(trigger(10, 24), side, 3, 'detached')
    // Nessun lato entra: il "+" è vicino al bordo alto, quindi sotto esce meno che sopra o di lato
    expect(pickSide(DETACHED_ORDER, fp, tiny)).toBe('bottom')
  })
})

describe('direction="auto"', () => {
  // jsdom non ha layout: tutti gli elementi misurano come un "+" a 10px dal bordo alto
  beforeEach(() => {
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 1024, configurable: true })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      left: 500,
      width: 52,
      height: 52,
      right: 552,
      bottom: 62,
      x: 500,
      y: 10,
      toJSON: () => ({}),
    } as DOMRect)
  })
  afterEach(() => vi.restoreAllMocks())

  it('TabMenu opens below when there is no room above', async () => {
    const user = userEvent.setup()
    const { container } = render(<TabMenu icon={icon} label="Menu" tabs={tabs} direction="auto" />)
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    expect(container.querySelector('.tab-menu')?.getAttribute('data-direction')).toBe('bottom')
  })

  it('TabMenuMotion keeps its preferred side when it fits', async () => {
    const user = userEvent.setup()
    const { container } = render(<TabMenuMotion icon={icon} label="Menu" tabs={tabs} direction="auto" />)
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    expect(container.querySelector('.tab-menu-motion')?.getAttribute('data-direction')).toBe('left')
  })

  it('TabMenuMotion with sub-menus flips the sub-menu below the bar when there is no room above', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TabMenuMotion icon={icon} label="Menu" tabs={tabs.map((t) => ({ ...t, items: ['A', 'B', 'C'] }))} />,
    )
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(screen.getByRole('button', { name: /Search/ }))
    expect(container.querySelector('.tab-menu-motion-wrap')?.getAttribute('data-panel')).toBe('bottom')
  })
})
