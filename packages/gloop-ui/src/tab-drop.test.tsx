import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TabMenu, TabMenuMotion, TabMenuSubmenu, type TabMenuDirection } from './index'
import { tabDrop, visualIndex } from './components/tab-drop'

const icon = <svg aria-hidden="true" />
const tabs = [
  { icon, label: 'Home' },
  { icon, label: 'Search' },
  { icon, label: 'User' },
]
const directions: TabMenuDirection[] = ['top', 'bottom', 'left', 'right']

describe('tabDrop', () => {
  it('left: tabs come from the "+" after the bar and go back to it at the start', () => {
    // Tab 0: centro a 34px; "+" aperto a 3*68+26 = 230, chiuso a 26
    const d = tabDrop(0, 3, 'left')
    expect(d.initial).toMatchObject({ x: 196 })
    expect(d.exit).toMatchObject({ x: -8 })
  })

  it('right: the "+" is always half a trigger before the tabs', () => {
    const d = tabDrop(1, 3, 'right')
    // Centro del tab 1: 102px; "+" a -26
    expect(d.initial).toMatchObject({ x: -128 })
    expect(d.exit).toMatchObject({ x: -128 })
  })

  it('top: column with the first tab next to the "+" (visual order reversed)', () => {
    expect(visualIndex(0, 3, 'top')).toBe(2)
    const d = tabDrop(0, 3, 'top')
    // Visivamente ultimo: centro a 2*52+26 = 130; "+" aperto a 3*52+26 = 182
    expect(d.initial).toMatchObject({ y: 52 })
    expect(d.initial).not.toHaveProperty('x')
  })

  it('bottom: moves on y from the "+" above the tabs', () => {
    const d = tabDrop(0, 3, 'bottom')
    expect(d.initial).toMatchObject({ y: -52 })
  })
})

describe('TabMenu direction', () => {
  it.each(directions)('TabMenu %s opens its bar', async (direction) => {
    const user = userEvent.setup()
    const { container } = render(<TabMenu icon={icon} label="Menu" tabs={tabs} direction={direction} />)
    expect(container.querySelector('.tab-menu')?.getAttribute('data-direction')).toBe(direction)
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it.each(directions)('TabMenuMotion %s opens its tabs', async (direction) => {
    const user = userEvent.setup()
    const { container } = render(<TabMenuMotion icon={icon} label="Menu" tabs={tabs} direction={direction} />)
    expect(container.querySelector('.tab-menu-motion')?.getAttribute('data-direction')).toBe(direction)
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('TabMenuSubmenu in a column opens the sub-menu next to the tab', async () => {
    const user = userEvent.setup()
    render(
      <TabMenuSubmenu
        icon={icon}
        label="Menu"
        direction="bottom"
        tabs={tabs.map((t) => ({ ...t, items: ['A', 'B'] }))}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(screen.getByRole('button', { name: /Search/ }))
    const panel = screen.getByRole('menu')
    // Sotto il "+" (52px) e dopo un tab (52px)
    expect(panel.style.top).toBe('104px')
    expect(panel.style.width).toBe('200px')
  })

  it('defaults keep the previous layouts', () => {
    const { container } = render(
      <>
        <TabMenu icon={icon} label="A" tabs={tabs} />
        <TabMenuMotion icon={icon} label="B" tabs={tabs} />
        <TabMenuSubmenu icon={icon} label="C" tabs={tabs} />
      </>,
    )
    expect(container.querySelector('.tab-menu')?.getAttribute('data-direction')).toBe('top')
    expect([...container.querySelectorAll('.tab-menu-motion')].map((e) => e.getAttribute('data-direction'))).toEqual([
      'left',
      'left',
    ])
  })
})
