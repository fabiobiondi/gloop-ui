import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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
  Slider,
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
    ['Slider', () => <Slider label="Volume" marks />],
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

describe('CircleMenu controlled', () => {
  it('opens from outside and reports closing through onOpenChange', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { rerender } = render(<CircleMenu open={false} onOpenChange={onOpenChange} items={[{ icon, label: 'Copy' }]} />)
    expect(screen.getByRole('button', { name: 'Open Menu' })).toBeTruthy()

    rerender(<CircleMenu open onOpenChange={onOpenChange} items={[{ icon, label: 'Copy' }]} />)
    expect(screen.getByRole('button', { name: 'Close Menu' })).toBeTruthy()

    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    // Controllato: resta aperto finché il genitore non cambia open
    expect(screen.getByRole('button', { name: 'Close Menu' })).toBeTruthy()
  })

  it('closes on outside pointerdown', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <div>
        <p>outside</p>
        <CircleMenu defaultOpen onOpenChange={onOpenChange} items={[{ icon, label: 'Copy' }]} />
      </div>,
    )
    await user.click(screen.getByText('outside'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('button', { name: 'Open Menu' })).toBeTruthy()
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

  it('keeps focus in an input while typing, with an inline onClose', async () => {
    function Form() {
      const [open, setOpen] = useState(false)
      const [value, setValue] = useState('')
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <Dialog open={open} onClose={() => setOpen(false)} title="Invite">
            <Input label="Email" value={value} onChange={(e) => setValue(e.target.value)} />
          </Dialog>
        </>
      )
    }
    render(<Form />)
    // Il focus parte dal trigger: è lì che tornava a ogni tasto
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const input = screen.getByRole('textbox', { name: 'Email' })
    await userEvent.click(input)
    await userEvent.keyboard('ada@example.com')
    expect(input).toHaveProperty('value', 'ada@example.com')
    expect(document.activeElement).toBe(input)
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

describe('Slider', () => {
  const root = (thumb: HTMLElement) => thumb.closest('.slider') as HTMLElement

  it('exposes an accessible slider with formatted value text', () => {
    render(<Slider label="Opacity" defaultValue={40} formatValue={(v) => `${v}%`} />)
    const thumb = screen.getByRole('slider', { name: 'Opacity' })
    expect(thumb.getAttribute('aria-valuenow')).toBe('40')
    expect(thumb.getAttribute('aria-valuemin')).toBe('0')
    expect(thumb.getAttribute('aria-valuemax')).toBe('100')
    expect(thumb.getAttribute('aria-valuetext')).toBe('40%')
  })

  it('moves with the keyboard when uncontrolled and reports the end of the gesture', async () => {
    const onChange = vi.fn()
    const onChangeEnd = vi.fn()
    render(<Slider label="Volume" defaultValue={50} step={5} onChange={onChange} onChangeEnd={onChangeEnd} />)
    const thumb = screen.getByRole('slider')
    thumb.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(thumb.getAttribute('aria-valuenow')).toBe('55')
    expect(onChange).toHaveBeenLastCalledWith(55)
    expect(onChangeEnd).toHaveBeenLastCalledWith(55)
    await userEvent.keyboard('{PageDown}')
    expect(thumb.getAttribute('aria-valuenow')).toBe('45')
    await userEvent.keyboard('{End}')
    expect(thumb.getAttribute('aria-valuenow')).toBe('100')
    await userEvent.keyboard('{Home}')
    expect(thumb.getAttribute('aria-valuenow')).toBe('0')
    // Già al minimo: nessun nuovo onChange
    onChange.mockClear()
    await userEvent.keyboard('{ArrowLeft}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('stays on the controlled value until the parent updates it', async () => {
    const onChange = vi.fn()
    render(<Slider label="Volume" value={20} onChange={onChange} />)
    const thumb = screen.getByRole('slider')
    thumb.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith(21)
    expect(thumb.getAttribute('aria-valuenow')).toBe('20')
  })

  it('jumps to the pointer, follows the drag and ends on release', () => {
    const onChange = vi.fn()
    const onChangeEnd = vi.fn()
    const { container } = render(<Slider label="Volume" step={10} onChange={onChange} onChangeEnd={onChangeEnd} />)
    const rail = container.querySelector('.slider__rail') as HTMLElement
    rail.getBoundingClientRect = () => ({ left: 100, width: 200 }) as DOMRect
    const thumb = screen.getByRole('slider')
    const el = root(thumb)

    fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: 150 })
    expect(thumb.getAttribute('aria-valuenow')).toBe('30')
    expect(el.hasAttribute('data-dragging')).toBe(true)
    expect(el.hasAttribute('data-active')).toBe(true)
    expect(document.activeElement).toBe(thumb)

    fireEvent.pointerMove(el, { pointerId: 1, clientX: 400 })
    expect(thumb.getAttribute('aria-valuenow')).toBe('100')
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 400 })
    expect(onChangeEnd).toHaveBeenCalledWith(100)
    expect(el.hasAttribute('data-dragging')).toBe(false)
    expect(onChange.mock.calls).toEqual([[30], [100]])
  })

  it('ignores pointer and keys when disabled', async () => {
    const onChange = vi.fn()
    render(<Slider label="Volume" defaultValue={10} disabled onChange={onChange} />)
    const thumb = screen.getByRole('slider')
    expect(thumb.getAttribute('aria-disabled')).toBe('true')
    expect(thumb.getAttribute('tabindex')).toBe('-1')
    fireEvent.pointerDown(root(thumb), { button: 0, pointerId: 1, clientX: 50 })
    thumb.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('submits through a hidden input and renders marks', () => {
    const { container } = render(
      <Slider label="Size" name="size" defaultValue={2} min={0} max={4} marks={[0, { value: 2, label: 'M' }, 4, 9]} />,
    )
    expect((container.querySelector('input[name="size"]') as HTMLInputElement).value).toBe('2')
    expect(container.querySelectorAll('.slider__mark')).toHaveLength(3)
    expect(container.querySelectorAll('.slider__mark[data-active]')).toHaveLength(2)
    expect(screen.getByText('M')).toBeTruthy()
    expect(root(screen.getByRole('slider')).hasAttribute('data-mark-labels')).toBe(true)
  })

  it('places the value drop on top by default or below with valuePlacement', () => {
    render(
      <>
        <Slider label="Top" showValue="always" />
        <Slider label="Bottom" showValue="always" valuePlacement="bottom" />
      </>,
    )
    expect(root(screen.getByRole('slider', { name: 'Top' })).dataset.bubble).toBe('top')
    expect(root(screen.getByRole('slider', { name: 'Bottom' })).dataset.bubble).toBe('bottom')
  })

  it('hides the value bubble with showValue="never"', () => {
    const { container } = render(<Slider label="Volume" showValue="never" />)
    expect(container.querySelector('.slider__bubble')).toBeNull()
    expect(container.querySelector('.slider__value')).toBeNull()
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
