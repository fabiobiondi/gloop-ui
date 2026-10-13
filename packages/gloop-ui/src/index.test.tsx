import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  CircleMenu,
  Dialog,
  ExpandButton,
  GooPill,
  Search,
  ShapeEditor,
  TabBar,
  TabMenu,
  TabMenuMotion,
  TabMenuSubmenu,
} from './index'

const icon = <svg aria-hidden="true" />
const tabs = [
  { icon, label: 'Home' },
  { icon, label: 'Search' },
]

describe('render', () => {
  it.each([
    ['CircleMenu', () => <CircleMenu items={[{ icon, label: 'Share' }, { icon, label: 'Copy' }]} />],
    ['ExpandButton', () => <ExpandButton icon={icon} label="Like" />],
    ['GooPill', () => <GooPill index={0} step={40} />],
    ['Search', () => <Search />],
    ['ShapeEditor', () => <ShapeEditor />],
    ['TabBar', () => <TabBar tabs={tabs} />],
    ['TabMenu', () => <TabMenu icon={icon} label="Menu" tabs={tabs} />],
    ['TabMenuMotion', () => <TabMenuMotion icon={icon} label="Menu" tabs={tabs} />],
    [
      'TabMenuSubmenu',
      () => <TabMenuSubmenu icon={icon} label="Menu" tabs={tabs.map((t) => ({ ...t, items: ['A', 'B'] }))} />,
    ],
  ])('%s renders without crashing', (_, Component) => {
    const { container } = render(<Component />)
    expect(container.firstChild).not.toBeNull()
  })
})

describe('Dialog', () => {
  it('shows the title only when open', () => {
    const { rerender } = render(<Dialog open={false} onClose={() => {}} title="Delete file?" />)
    expect(screen.queryByText('Delete file?')).toBeNull()
    rerender(<Dialog open onClose={() => {}} title="Delete file?" />)
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Delete file?')).toBeTruthy()
  })

  it('runs the action and closes', async () => {
    const onClose = vi.fn()
    const onClick = vi.fn()
    render(<Dialog open onClose={onClose} title="Delete?" actions={[{ label: 'Delete', onClick }]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalled()
  })
})

describe('TabBar', () => {
  it('calls onChange with the tab index', async () => {
    const onChange = vi.fn()
    render(<TabBar tabs={tabs} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /Search/ }))
    expect(onChange).toHaveBeenCalledWith(1)
  })
})

describe('ExpandButton', () => {
  it('calls onClick in the action variant', async () => {
    const onClick = vi.fn()
    render(<ExpandButton variant="action" label="Save" onClick={onClick} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
