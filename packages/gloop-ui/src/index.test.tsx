import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  CircleMenu,
  Dialog,
  ExpandButton,
  GloopLoading,
  GooPill,
  Input,
  List,
  ProgressBar,
  Search,
  ShapeEditor,
  Slider,
  TabBar,
  TabPop,
  TabFab,
  Toast,
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
    ['GloopLoading', () => <GloopLoading title="Loading" description="Almost there" />],
    ['GooPill', () => <GooPill index={0} step={40} />],
    ['Input', () => <Input label="Email" />],
    ['List', () => <List items={[{ id: 'a', label: 'A' }]} />],
    ['ProgressBar', () => <ProgressBar label="Upload" value={40} drip showValue="bubble" />],
    ['Search', () => <Search />],
    ['ShapeEditor', () => <ShapeEditor />],
    ['Slider', () => <Slider label="Volume" marks />],
    ['TabBar', () => <TabBar tabs={tabs} />],
    ['TabPop', () => <TabPop icon={icon} label="Menu" tabs={tabs} />],
    ['TabPop pop', () => <TabPop icon={icon} label="Menu" tabs={tabs} animation="pop" />],
    ['TabPop bounce', () => <TabPop icon={icon} label="Menu" tabs={tabs} animation="bounce" />],
    ['TabFab', () => <TabFab icon={icon} label="Menu" tabs={tabs} />],
    ['Toast', () => <Toast open={false} onClose={() => {}} />],
    [
      'TabFab with sub-menus',
      () => <TabFab icon={icon} label="Menu" tabs={tabs.map((t) => ({ ...t, items: ['A', 'B'] }))} />,
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

  it('shows the value inside the tab in the inline layout', () => {
    render(<TabBar layout="inline" position="static" tabs={[{ icon, label: 'Links', value: 2 }]} />)
    expect(screen.getByRole('navigation').dataset.layout).toBe('inline')
    expect(screen.getByRole('button', { name: 'Links 2' })).toBeTruthy()
  })
})

describe('GloopLoading', () => {
  it('is a status region named by its title, or by label without one', () => {
    const { rerender } = render(<GloopLoading title="Uploading" />)
    expect(screen.getByRole('status').textContent).toBe('Uploading')
    rerender(<GloopLoading label="Fetching data" />)
    expect(screen.getByRole('status', { name: 'Fetching data' })).toBeTruthy()
  })

  it('sizes the blob from size', () => {
    render(<GloopLoading size={48} />)
    expect(screen.getByRole('status').style.getPropertyValue('--gloop-loading-size')).toBe('48px')
  })
})

describe('ProgressBar', () => {
  it('exposes the value as a progressbar', () => {
    render(<ProgressBar label="Upload" value={40} />)
    const bar = screen.getByRole('progressbar', { name: 'Upload' })
    expect(bar.getAttribute('aria-valuenow')).toBe('40')
    expect(bar.getAttribute('aria-valuetext')).toBe('40%')
    expect(bar.getAttribute('aria-valuemin')).toBe('0')
    expect(bar.getAttribute('aria-valuemax')).toBe('100')
  })

  it('clamps the value and follows min and max', () => {
    const { rerender } = render(<ProgressBar label="Upload" value={150} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('100')
    rerender(<ProgressBar label="Upload" value={-5} />)
    expect(bar.getAttribute('aria-valuenow')).toBe('0')
    rerender(<ProgressBar label="Upload" value={5} min={0} max={10} />)
    expect(bar.getAttribute('aria-valuetext')).toBe('50%')
    rerender(<ProgressBar label="Upload" value={Number.NaN} />)
    expect(bar.getAttribute('aria-valuenow')).toBe('0')
  })

  it('is indeterminate without a value', () => {
    render(<ProgressBar label="Loading" showValue="bubble" />)
    const bar = screen.getByRole('progressbar', { name: 'Loading' })
    expect(bar.hasAttribute('aria-valuenow')).toBe(false)
    expect(bar.hasAttribute('aria-valuetext')).toBe(false)
    expect(bar.dataset.indeterminate).toBe('true')
    expect(bar.textContent).toBe('')
  })

  it('uses aria-labelledby and formatValue', () => {
    render(
      <>
        <span id="pb-label">Files</span>
        <ProgressBar aria-labelledby="pb-label" value={3} max={12} formatValue={(v, p) => `${v} of 12 (${p}%)`} />
      </>,
    )
    const bar = screen.getByRole('progressbar', { name: 'Files' })
    expect(bar.getAttribute('aria-valuetext')).toBe('3 of 12 (25%)')
  })

  it('shows the value only when asked', () => {
    const { rerender } = render(<ProgressBar label="Upload" value={60} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.textContent).toBe('')
    rerender(<ProgressBar label="Upload" value={60} showValue="bubble" />)
    expect(bar.textContent).toContain('60%')
    rerender(<ProgressBar label="Upload" value={60} showValue="inside" thickness={8} />)
    expect(bar.textContent).toBe('60%')
    // Con il valore dentro la barra lo spessore non scende sotto i 18px
    expect(bar.style.getPropertyValue('--progress-h')).toBe('18px')
  })

  it('renders hidden drops with drip', () => {
    const { container, rerender } = render(<ProgressBar label="Upload" value={60} />)
    expect(container.querySelectorAll('.progress__drop')).toHaveLength(0)
    rerender(<ProgressBar label="Upload" value={60} drip />)
    expect(container.querySelectorAll('.progress__drop').length).toBeGreaterThan(0)
    expect(container.querySelector('.progress__drop')?.closest('[aria-hidden="true"]')).not.toBeNull()
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

  it('renders groups and dividers and selects across them', async () => {
    const onChange = vi.fn()
    render(
      <List
        defaultValue="inbox"
        onChange={onChange}
        items={[
          { type: 'group', id: 'mail', label: 'Mail', items: [{ id: 'inbox', label: 'Inbox' }] },
          { type: 'divider' },
          { type: 'group', id: 'more', label: 'More', items: [{ id: 'settings', label: 'Settings' }] },
        ]}
      />,
    )
    expect(screen.getByRole('group', { name: 'Mail' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'More' })).toBeTruthy()
    expect(screen.getByRole('separator')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(onChange).toHaveBeenCalledWith('settings', { id: 'settings', label: 'Settings' })
    expect(screen.getByRole('button', { name: 'Settings' }).getAttribute('aria-current')).toBe('true')
  })
})

describe('TabFab sub-menus', () => {
  it('is a tablist when no tab has items', async () => {
    render(<TabFab icon={icon} label="Menu" tabs={tabs} />)
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getByRole('tablist')).toBeTruthy()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })
  it('opens a sub-menu and closes it on item click', async () => {
    render(<TabFab icon={icon} label="Menu" tabs={[{ icon, label: 'Home', items: ['Dashboard', 'Activity'] }]} />)
    const trigger = screen.getByRole('button', { name: 'Menu' })
    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('button', { name: 'Home' }))
    expect(screen.getAllByRole('menu')).toHaveLength(1)
    expect(screen.getAllByRole('menuitem').map((el) => el.textContent)).toEqual(['Dashboard', 'Activity'])
    await userEvent.click(screen.getByRole('menuitem', { name: 'Activity' }))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })
  it('shows optional icons in sub-menu items', async () => {
    const itemIcon = <svg data-testid="item-icon" />
    render(
      <TabFab
        icon={icon}
        label="Menu"
        tabs={[{ icon, label: 'Home', items: [{ label: 'Saved', icon: itemIcon }, 'Activity'] }]}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
    await userEvent.click(screen.getByRole('button', { name: 'Home' }))
    expect(screen.getAllByRole('menuitem').map((el) => el.textContent)).toEqual(['Saved', 'Activity'])
    expect(screen.getByRole('menuitem', { name: 'Saved' }).contains(screen.getByTestId('item-icon'))).toBe(true)
  })

})

describe('Toast', () => {
  it('keeps the live region mounted and shows the message only when open', () => {
    const { rerender } = render(<Toast open={false} onClose={() => {}}>Saved</Toast>)
    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.queryByText('Saved')).toBeNull()
    rerender(
      <Toast open onClose={() => {}} title="Done">
        Saved
      </Toast>,
    )
    expect(screen.getByRole('status').textContent).toContain('Saved')
    expect(screen.getByText('Done')).toBeTruthy()
  })

  it('closes itself after duration', () => {
    vi.useFakeTimers()
    try {
      const onClose = vi.fn()
      render(
        <Toast open onClose={onClose} duration={1000}>
          Saved
        </Toast>,
      )
      vi.advanceTimersByTime(999)
      expect(onClose).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(onClose).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  it('stays open with duration={Infinity}', () => {
    vi.useFakeTimers()
    try {
      const onClose = vi.fn()
      render(
        <Toast open onClose={onClose} duration={Infinity}>
          Saved
        </Toast>,
      )
      vi.advanceTimersByTime(60_000)
      expect(onClose).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('pauses the timer while hovered and resumes with the remaining time', () => {
    vi.useFakeTimers()
    try {
      const onClose = vi.fn()
      render(
        <Toast open onClose={onClose} duration={1000}>
          Saved
        </Toast>,
      )
      vi.advanceTimersByTime(600)
      const toast = document.querySelector<HTMLElement>('.toast')!
      fireEvent.pointerEnter(toast)
      vi.advanceTimersByTime(5000)
      expect(onClose).not.toHaveBeenCalled()
      fireEvent.pointerLeave(toast)
      vi.advanceTimersByTime(399)
      expect(onClose).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(onClose).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes from the X, which can be hidden', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <Toast open onClose={onClose} duration={Infinity}>
        Saved
      </Toast>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
    rerender(
      <Toast open onClose={onClose} duration={Infinity} closeButton={false}>
        Saved
      </Toast>,
    )
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('drops the goo with reduced motion', () => {
    render(
      <Toast open onClose={() => {}} reducedMotion="always">
        Saved
      </Toast>,
    )
    expect(document.querySelector('.toast__goo')).toBeNull()
    expect(document.querySelector('.toast__shape')).not.toBeNull()
  })

  it('fills the blob with the variant color and shows its default icon', () => {
    render(
      <Toast open onClose={() => {}} variant="success">
        Saved
      </Toast>,
    )
    const toast = document.querySelector<HTMLElement>('.toast')!
    expect(toast.dataset.variant).toBe('success')
    expect(toast.querySelector('.toast__icon svg')).not.toBeNull()
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('announces errors assertively', () => {
    render(
      <Toast open onClose={() => {}} variant="error">
        Upload failed
      </Toast>,
    )
    const region = screen.getByRole('alert')
    expect(region.getAttribute('aria-live')).toBe('assertive')
    expect(region.textContent).toContain('Upload failed')
  })

  it('applies a custom color and hides the icon with icon={null}', () => {
    render(
      <Toast open onClose={() => {}} variant="info" color="#7c3aed" icon={null}>
        Custom
      </Toast>,
    )
    const toast = document.querySelector<HTMLElement>('.toast')!
    expect(toast.style.getPropertyValue('--toast-color')).toBe('#7c3aed')
    expect(toast.hasAttribute('data-custom-color')).toBe(true)
    expect(toast.querySelector('.toast__icon')).toBeNull()
  })

  it('stacks toasts open at the same time, the newest against the edge', () => {
    const { rerender } = render(
      <>
        <Toast open onClose={() => {}}>
          First
        </Toast>
        <Toast open={false} onClose={() => {}}>
          Second
        </Toast>
      </>,
    )
    rerender(
      <>
        <Toast open onClose={() => {}}>
          First
        </Toast>
        <Toast open onClose={() => {}}>
          Second
        </Toast>
      </>,
    )
    const stacks = document.querySelectorAll('.toast-stack[data-position="top"][data-align="center"]')
    expect(stacks).toHaveLength(1)
    const [first, second] = screen.getAllByRole('status')
    expect(first.parentElement).toBe(stacks[0])
    expect(second.parentElement).toBe(stacks[0])
    // In alto la pila è column-reverse: order più alto = più vicino al bordo
    expect(Number(second.style.order)).toBeGreaterThan(Number(first.style.order))
  })

  it('mounts a fresh toast on every opening, measured on the new content', () => {
    const { rerender } = render(
      <Toast open onClose={() => {}} variant="success">
        Saved
      </Toast>,
    )
    const first = document.querySelector('.toast')
    rerender(
      <Toast open={false} onClose={() => {}} variant="success">
        Saved
      </Toast>,
    )
    rerender(
      <Toast open onClose={() => {}} variant="warning">
        Storage almost full
      </Toast>,
    )
    const toasts = document.querySelectorAll<HTMLElement>('.toast')
    const latest = toasts[toasts.length - 1]
    expect(latest).not.toBe(first)
    expect(latest.dataset.variant).toBe('warning')
    expect(latest.textContent).toContain('Storage almost full')
  })

  it('uses a separate stack per position', () => {
    render(
      <>
        <Toast open onClose={() => {}}>
          Top
        </Toast>
        <Toast open onClose={() => {}} position="bottom" align="end">
          Bottom
        </Toast>
      </>,
    )
    expect(screen.getByText('Top').closest('.toast-stack')?.getAttribute('data-position')).toBe('top')
    expect(screen.getByText('Bottom').closest('.toast-stack')?.getAttribute('data-align')).toBe('end')
  })

  it('renders the liquid blob with full motion', () => {
    render(
      <Toast open onClose={() => {}} reducedMotion="never">
        Saved
      </Toast>,
    )
    expect(document.querySelector('.toast__goo')).not.toBeNull()
    expect(document.querySelector('.toast__drop')).not.toBeNull()
  })
})
