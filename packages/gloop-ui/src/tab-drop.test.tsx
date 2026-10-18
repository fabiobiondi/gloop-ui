import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TabPop, TabFab, type TabPopDirection } from './index'
import { tabDrop, visualIndex } from './components/tab-drop'

const icon = <svg aria-hidden="true" />
const tabs = [
  { icon, label: 'Home' },
  { icon, label: 'Search' },
  { icon, label: 'User' },
]
const directions: TabPopDirection[] = ['top', 'bottom', 'left', 'right']

describe('tabDrop', () => {
  it('left: tabs come from the closed "+", half a trigger from the start of the bar', () => {
    // All'apertura Motion parte dal riquadro chiuso (il solo "+"): tab 0 al centro a 34px, "+" a 26
    expect(tabDrop(0, 3, 'left').initial).toMatchObject({ x: -8 })
    expect(tabDrop(2, 3, 'left').initial).toMatchObject({ x: 26 - 170 })
  })

  it('on close tabs vanish at once, without moving (the shrinking bar would stretch them)', () => {
    for (const dir of ['left', 'right', 'top', 'bottom'] as const) {
      expect(tabDrop(1, 3, dir).exit).toEqual({ opacity: 0, transition: { duration: 0 } })
    }
  })

  it('right: the "+" is always half a trigger before the tabs', () => {
    const d = tabDrop(1, 3, 'right')
    // Centro del tab 1: 102px; "+" a -26
    expect(d.initial).toMatchObject({ x: -128 })
  })

  it('top: column with the first tab next to the "+" (visual order reversed)', () => {
    expect(visualIndex(0, 3, 'top')).toBe(2)
    const d = tabDrop(0, 3, 'top')
    // Visivamente ultimo: centro a 2*52+26 = 130; "+" chiuso a 26
    expect(d.initial).toMatchObject({ y: -104 })
    expect(d.initial).not.toHaveProperty('x')
  })

  it('bottom: moves on y from the "+" above the tabs', () => {
    const d = tabDrop(0, 3, 'bottom')
    expect(d.initial).toMatchObject({ y: -52 })
  })
})

describe('TabPop direction', () => {
  it.each(directions)('TabPop %s opens its bar', async (direction) => {
    const user = userEvent.setup()
    const { container } = render(<TabPop icon={icon} label="Menu" tabs={tabs} direction={direction} />)
    expect(container.querySelector('.tab-pop')?.getAttribute('data-direction')).toBe(direction)
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it.each(directions.flatMap((d) => (['pop', 'bounce'] as const).map((a) => [a, d] as const)))(
    'TabPop %s %s opens its bar',
    async (animation, direction) => {
      const user = userEvent.setup()
      const { container } = render(
        <TabPop icon={icon} label="Menu" tabs={tabs} direction={direction} animation={animation} />,
      )
      expect(container.querySelector('.tab-pop')?.getAttribute('data-direction')).toBe(direction)
      await user.click(screen.getByRole('button', { name: 'Menu' }))
      expect(screen.getAllByRole('tab')).toHaveLength(3)
    },
  )

  it.each(directions)('TabFab %s opens its tabs', async (direction) => {
    const user = userEvent.setup()
    const { container } = render(<TabFab icon={icon} label="Menu" tabs={tabs} direction={direction} />)
    expect(container.querySelector('.tab-fab')?.getAttribute('data-direction')).toBe(direction)
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('TabFab with sub-menus in a column opens the sub-menu next to the tab', async () => {
    const user = userEvent.setup()
    render(
      <TabFab
        icon={icon}
        label="Menu"
        direction="bottom"
        tabs={tabs.map((t) => ({ ...t, items: ['A', 'B'] }))}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(screen.getByRole('button', { name: /Search/ }))
    // Il wrap del pannello porta posizione e larghezza: sotto il "+" (52px) e dopo un tab (52px)
    const wrap = screen.getByRole('menu').parentElement!
    expect(wrap.style.translate).toBe('0 104px')
    expect(wrap.style.width).toBe('200px')
  })

  it('defaults keep the previous layouts', () => {
    const { container } = render(
      <>
        <TabPop icon={icon} label="A" tabs={tabs} />
        <TabFab icon={icon} label="B" tabs={tabs} />
        <TabFab icon={icon} label="C" tabs={tabs} />
      </>,
    )
    expect(container.querySelector('.tab-pop')?.getAttribute('data-direction')).toBe('top')
    expect([...container.querySelectorAll('.tab-fab')].map((e) => e.getAttribute('data-direction'))).toEqual([
      'left',
      'left',
    ])
  })
})
