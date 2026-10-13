import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  CircleMenu,
  Dialog,
  ExpandButton,
  GooPill,
  Input,
  List,
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
    ['Input', () => <Input label="Email" />],
    ['List', () => <List items={[{ id: 'a', label: 'A' }]} />],
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

describe('CircleMenu', () => {
  const items = [
    { icon, label: 'Email' },
    { icon, label: 'Copy link' },
  ]

  it('reserves the open menu area by default', () => {
    const { container } = render(<CircleMenu direction="bottom-left" items={items} />)
    const root = container.firstChild as HTMLElement
    expect(parseFloat(root.style.width)).toBeGreaterThan(56)
    expect(root.dataset.overlay).toBeUndefined()
  })

  it('takes only the "+" size with reserveSpace={false} and flags itself open', async () => {
    const { container } = render(<CircleMenu direction="bottom-left" reserveSpace={false} items={items} />)
    const root = container.firstChild as HTMLElement
    expect(root.style.width).toBe('56px')
    expect(root.style.height).toBe('56px')
    expect(root.dataset.overlay).toBe('true')
    expect(root.dataset.open).toBeUndefined()
    await userEvent.click(screen.getByRole('button', { name: 'Open Menu' }))
    expect(root.dataset.open).toBe('true')
  })
})

describe('CircleMenu tooltip', () => {
  it('shows the item tooltip on hover only while the menu is open', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <CircleMenu
        items={[
          { icon, label: 'Email', tooltip: { content: 'Send by email', delay: 0 } },
          { icon, label: 'Copy', tooltip: true },
        ]}
      />,
    )
    // Da chiuso il bottone è aria-hidden: lo si cerca per aria-label
    const email = container.querySelector<HTMLElement>('[aria-label="Email"]')!
    await user.hover(email)
    expect(screen.queryByRole('tooltip')).toBeNull()

    await user.unhover(email)
    await user.click(screen.getByRole('button', { name: 'Open Menu' }))
    await user.hover(email)
    expect((await screen.findByRole('tooltip')).textContent).toBe('Send by email')
  })

  it('shows sub-menu tooltips and hides the parent one while its sub-menu is open', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <CircleMenu
        items={[
          {
            icon,
            label: 'Share',
            tooltip: { content: 'Share with…', delay: 0 },
            items: [
              { icon, label: 'Email', tooltip: { content: 'Email', delay: 0 } },
              { icon, label: 'Copy', tooltip: { content: 'Copy link', delay: 0 } },
            ],
          },
        ]}
      />,
    )
    const byLabel = (l: string) => container.querySelector<HTMLElement>(`[aria-label="${l}"]`)!

    await user.click(screen.getByRole('button', { name: 'Open Menu' }))
    await user.click(byLabel('Share'))
    await user.hover(byLabel('Share'))
    expect(byLabel('Share').getAttribute('aria-describedby')).toBeNull()

    await user.unhover(byLabel('Share'))
    await user.hover(byLabel('Copy'))
    const id = byLabel('Copy').getAttribute('aria-describedby')!
    expect(document.getElementById(id)?.textContent).toBe('Copy link')
  })
})

describe('CircleMenu panel', () => {
  function setup() {
    const user = userEvent.setup()
    const utils = render(
      <CircleMenu
        items={[
          {
            icon,
            label: 'Opacity',
            tooltip: { content: 'Opacity', delay: 0 },
            panel: ({ close }) => (
              <div>
                <input aria-label="Opacity value" type="range" />
                <button type="button" onClick={close}>
                  Done
                </button>
              </div>
            ),
          },
          {
            icon,
            label: 'Text',
            items: [
              { icon, label: 'Size', panel: { content: <p>Sizes</p>, label: 'Font sizes' } },
              { icon, label: 'Bold' },
            ],
          },
        ]}
      />,
    )
    const byLabel = (l: string) => utils.container.querySelector<HTMLElement>(`[aria-label="${l}"]`)!
    return { user, byLabel, ...utils }
  }

  it('opens the custom panel next to the item and keeps the menu open while using it', async () => {
    const { user, byLabel } = setup()
    await user.click(screen.getByRole('button', { name: 'Open Menu' }))
    await user.click(byLabel('Opacity'))
    expect(screen.getByRole('dialog', { name: 'Opacity' })).toBeTruthy()

    await user.click(screen.getByLabelText('Opacity value'))
    expect(screen.getByRole('dialog', { name: 'Opacity' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close Menu' })).toBeTruthy()
  })

  it('close() from the panel closes panel and menu', async () => {
    const { user, byLabel } = setup()
    await user.click(screen.getByRole('button', { name: 'Open Menu' }))
    await user.click(byLabel('Opacity'))
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByRole('button', { name: 'Open Menu' })).toBeTruthy()
  })

  it('Escape closes only the panel', async () => {
    const { user, byLabel } = setup()
    await user.click(screen.getByRole('button', { name: 'Open Menu' }))
    await user.click(byLabel('Opacity'))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Close Menu' })).toBeTruthy()
  })

  it('works on sub-menu leaves', async () => {
    const { user, byLabel } = setup()
    await user.click(screen.getByRole('button', { name: 'Open Menu' }))
    await user.click(byLabel('Text'))
    await user.click(byLabel('Size'))
    expect(screen.getByRole('dialog', { name: 'Font sizes' }).textContent).toBe('Sizes')
  })
})

describe('Dialog', () => {
  it('applies backdrop color, opacity and blur', () => {
    render(<Dialog open onClose={() => {}} title="Hi" backdropColor="#312e81" backdropOpacity={2} backdropBlur={8} />)
    const backdrop = document.querySelector<HTMLElement>('.dialog-backdrop')!
    expect(backdrop.style.getPropertyValue('--dialog-backdrop-color')).toBe('#312e81')
    expect(backdrop.style.getPropertyValue('--dialog-backdrop-opacity')).toBe('1')
    expect(backdrop.style.getPropertyValue('--dialog-backdrop-blur')).toBe('8px')
  })

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

describe('Input', () => {
  const root = (input: HTMLElement) => input.closest('.input')!

  it('links the label, passes native attributes and the ref to the input', () => {
    const ref = { current: null as HTMLInputElement | null }
    render(<Input label="Email" name="email" type="email" placeholder="name@mail.com" ref={ref} />)
    const input = screen.getByLabelText('Email')
    expect(input.tagName).toBe('INPUT')
    expect(input.getAttribute('name')).toBe('email')
    expect(input.getAttribute('type')).toBe('email')
    expect(input.getAttribute('placeholder')).toBe('name@mail.com')
    expect(ref.current).toBe(input)
  })

  it('floats the label on focus and drops it on blur when empty', async () => {
    render(<Input label="Email" />)
    const input = screen.getByLabelText('Email')
    expect(root(input).hasAttribute('data-floated')).toBe(false)
    await userEvent.click(input)
    expect(root(input).hasAttribute('data-floated')).toBe(true)
    await userEvent.tab()
    expect(root(input).hasAttribute('data-floated')).toBe(false)
  })

  it('keeps the label up while the field has a value', async () => {
    const onChange = vi.fn()
    render(<Input label="Name" onChange={onChange} />)
    const input = screen.getByLabelText('Name')
    await userEvent.type(input, 'Ada')
    await userEvent.tab()
    expect(onChange).toHaveBeenCalled()
    expect(root(input).hasAttribute('data-floated')).toBe(true)
  })

  it('starts floated with a controlled or default value', () => {
    render(
      <>
        <Input label="Controlled" value="a@b.c" onChange={() => {}} />
        <Input label="Default" defaultValue="Ada" />
      </>,
    )
    expect(root(screen.getByLabelText('Controlled')).hasAttribute('data-floated')).toBe(true)
    expect(root(screen.getByLabelText('Default')).hasAttribute('data-floated')).toBe(true)
  })
})

describe('List', () => {
  const items = [
    { id: 'inbox', label: 'Inbox' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'spam', label: 'Spam', disabled: true },
  ]

  it('calls onChange and moves the selection when uncontrolled', async () => {
    const onChange = vi.fn()
    render(<List items={items} defaultValue="inbox" onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Inbox' }).getAttribute('aria-current')).toBe('true')
    await userEvent.click(screen.getByRole('button', { name: 'Drafts' }))
    expect(onChange).toHaveBeenCalledWith('drafts', items[1])
    expect(screen.getByRole('button', { name: 'Drafts' }).getAttribute('aria-current')).toBe('true')
    expect(screen.getByRole('button', { name: 'Inbox' }).getAttribute('aria-current')).toBeNull()
  })

  it('keeps the selection when controlled', async () => {
    const onChange = vi.fn()
    render(<List items={items} value="inbox" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Drafts' }))
    expect(onChange).toHaveBeenCalledWith('drafts', items[1])
    expect(screen.getByRole('button', { name: 'Inbox' }).getAttribute('aria-current')).toBe('true')
  })

  it('ignores disabled items', async () => {
    const onChange = vi.fn()
    render(<List items={items} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Spam' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders links inside a nav', () => {
    render(
      <List
        label="Pages"
        value="b"
        items={[
          { id: 'a', label: 'A', href: '#a' },
          { id: 'b', label: 'B', href: '#b', meta: 3 },
        ]}
      />,
    )
    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeTruthy()
    const link = screen.getByRole('link', { name: /B/ })
    expect(link.getAttribute('href')).toBe('#b')
    expect(link.getAttribute('aria-current')).toBe('page')
  })
})

describe('TabMenuSubmenu', () => {
  it('opens a sub-menu and closes it on item click', async () => {
    render(<TabMenuSubmenu icon={icon} label="Menu" tabs={[{ icon, label: 'Home', items: ['Dashboard', 'Activity'] }]} />)
    const trigger = screen.getByRole('button', { name: 'Menu' })
    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('button', { name: 'Home' }))
    expect(screen.getAllByRole('menu')).toHaveLength(1)
    expect(screen.getAllByRole('menuitem').map((el) => el.textContent)).toEqual(['Dashboard', 'Activity'])
    await userEvent.click(screen.getByRole('menuitem', { name: 'Activity' }))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })
})
