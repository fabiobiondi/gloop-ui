import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Popover, Tooltip, usePopover } from './index'

/*
 * Solo i timer dei ritardi sono finti: le animazioni di Motion girano col tempo reale.
 * Con i fake timer di Vitest user-event resta in attesa (Testing Library riconosce solo
 * quelli di Jest): qui si usano eventi sincroni.
 */
function fakeDelays() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  return {
    hover: (el: Element) => fireEvent.pointerOver(el, { pointerType: 'mouse' }),
    unhover: (el: Element) => fireEvent.pointerOut(el, { pointerType: 'mouse' }),
    click: (el: Element) => {
      fireEvent.pointerDown(el, { pointerType: 'mouse' })
      fireEvent.click(el)
    },
  }
}

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('Tooltip', () => {
  afterEach(() => vi.useRealTimers())

  it('renders the trigger without crashing', () => {
    render(
      <Tooltip content="Hi">
        <button>Trigger</button>
      </Tooltip>,
    )
    expect(screen.getByRole('button', { name: 'Trigger' })).toBeTruthy()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('opens after the delay on hover and closes after leaving', async () => {
    const user = fakeDelays()
    render(
      <Tooltip content="Copy link" delay={300} closeDelay={100}>
        <button>Share</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: 'Share' })

    await user.hover(trigger)
    await advance(200)
    expect(screen.queryByRole('tooltip')).toBeNull()
    await advance(150)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.textContent).toBe('Copy link')
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id)

    await user.unhover(trigger)
    await advance(150)
    vi.useRealTimers()
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
    expect(trigger.getAttribute('aria-describedby')).toBeNull()
  })

  it('stays open while the pointer is over the tooltip', async () => {
    const user = fakeDelays()
    render(
      <Tooltip content="Details" delay={0} closeDelay={100}>
        <button>Info</button>
      </Tooltip>,
    )
    await user.hover(screen.getByRole('button'))
    await advance(1)
    await user.hover(screen.getByRole('tooltip'))
    await advance(500)
    expect(screen.getByRole('tooltip')).toBeTruthy()
  })

  it('renders JSX content', async () => {
    const user = fakeDelays()
    render(
      <Tooltip
        content={
          <span>
            Press <kbd>⌘K</kbd>
          </span>
        }
        delay={0}
      >
        <button>Search</button>
      </Tooltip>,
    )
    await user.hover(screen.getByRole('button'))
    await advance(1)
    expect(screen.getByRole('tooltip').querySelector('kbd')?.textContent).toBe('⌘K')
  })

  it('ignores touch pointers', () => {
    render(
      <Tooltip content="Hi" delay={0}>
        <button>Tap</button>
      </Tooltip>,
    )
    fireEvent.pointerOver(screen.getByRole('button'), { pointerType: 'touch' })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('opens on keyboard focus and closes on Escape', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Keyboard">
        <button>Focus me</button>
      </Tooltip>,
    )
    await user.tab()
    expect(screen.getByRole('tooltip')).toBeTruthy()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
  })

  it('keeps the aria-describedby of the trigger', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Hint">
        <button aria-describedby="own">Btn</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button')
    expect(trigger.getAttribute('aria-describedby')).toBe('own')
    await user.tab()
    expect(trigger.getAttribute('aria-describedby')).toBe(`own ${screen.getByRole('tooltip').id}`)
  })

  it('does not open when disabled', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Hi" disabled>
        <button>Btn</button>
      </Tooltip>,
    )
    await user.tab()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('throws a clear error when children is not an element', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Tooltip content="Hi">{'text' as never}</Tooltip>)).toThrow(/single element/)
    vi.restoreAllMocks()
  })
})

describe('Popover', () => {
  let user: ReturnType<typeof userEvent.setup>
  beforeEach(() => {
    user = userEvent.setup()
  })

  const renderPopover = (props: Partial<Parameters<typeof Popover>[0]> = {}) =>
    render(
      <>
        <Popover label="Settings" content={<input aria-label="Name" />} {...props}>
          <button>Open</button>
        </Popover>
        <button>Outside</button>
      </>,
    )

  it('toggles on click and wires aria attributes', async () => {
    renderPopover()
    const trigger = screen.getByRole('button', { name: 'Open' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')

    await user.click(trigger)
    const panel = screen.getByRole('dialog', { name: 'Settings' })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id)

    await user.click(trigger)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('moves focus to the first field on open', async () => {
    renderPopover()
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Name' })))
  })

  it('closes on outside click but not on clicks inside', async () => {
    renderPopover()
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('textbox', { name: 'Name' }))
    expect(screen.getByRole('dialog')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Outside' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('stays open on outside click when closeOnOutsideClick is false', async () => {
    renderPopover({ closeOnOutsideClick: false })
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    renderPopover()
    const trigger = screen.getByRole('button', { name: 'Open' })
    await user.click(trigger)
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox')))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(trigger)
  })

  it('closes from the render-prop api', async () => {
    renderPopover({ content: ({ close }) => <button onClick={close}>Save</button> })
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('closes from usePopover in a nested component', async () => {
    function SaveButton() {
      const { close } = usePopover()
      return <button onClick={close}>Save</button>
    }
    renderPopover({ content: <SaveButton /> })
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('does not close the parent when clicking inside a nested popover', async () => {
    render(
      <>
        <Popover
          label="Parent"
          content={
            <Popover label="Child" content={<button>Deep</button>}>
              <button>Open child</button>
            </Popover>
          }
        >
          <button>Open parent</button>
        </Popover>
        <button>Outside</button>
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Open parent' }))
    await user.click(screen.getByRole('button', { name: 'Open child' }))
    await user.click(screen.getByRole('button', { name: 'Deep' }))
    expect(screen.getByRole('dialog', { name: 'Parent' })).toBeTruthy()
    expect(screen.getByRole('dialog', { name: 'Child' })).toBeTruthy()

    // Esc chiude solo il più interno
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Child' })).toBeNull())
    expect(screen.getByRole('dialog', { name: 'Parent' })).toBeTruthy()
  })

  it('in controlled mode only reports changes', async () => {
    const onOpenChange = vi.fn()
    renderPopover({ open: true, onOpenChange })
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('works controlled with state', async () => {
    function Controlled() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <Popover open={open} onOpenChange={setOpen} content="Body">
            <button>Toggle</button>
          </Popover>
          <span data-testid="state">{String(open)}</span>
        </>
      )
    }
    render(<Controlled />)
    await user.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(screen.getByTestId('state').textContent).toBe('true')
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  describe('closeOnLeave', () => {
    afterEach(() => vi.useRealTimers())

    it('closes after leaving trigger and panel, re-entering cancels', async () => {
      const user = fakeDelays()
      render(
        <Popover closeOnLeave leaveDelay={200} content={<p>Body</p>}>
          <button>Hover menu</button>
        </Popover>,
      )
      const trigger = screen.getByRole('button', { name: 'Hover menu' })
      await user.click(trigger)
      await user.unhover(trigger)
      await advance(100)
      // Passa nella bolla prima che scada il ritardo
      await user.hover(screen.getByRole('dialog'))
      await advance(300)
      expect(screen.getByRole('dialog')).toBeTruthy()

      await user.unhover(screen.getByRole('dialog'))
      await advance(250)
      vi.useRealTimers()
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })
  })
})
