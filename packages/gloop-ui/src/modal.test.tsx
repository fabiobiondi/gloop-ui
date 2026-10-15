import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal, ModalProvider, useModal, type ModalApi } from './index'

describe('Modal', () => {
  it('renders title, close button, body and footer only when open', () => {
    const { rerender } = render(
      <Modal open={false} onClose={() => {}} title="Settings" footer={<span>Saved 2m ago</span>}>
        <p>Body</p>
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(
      <Modal open onClose={() => {}} title="Settings" footer={<span>Saved 2m ago</span>}>
        <p>Body</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy()
    expect(screen.getByText('Body')).toBeTruthy()
    expect(screen.getByText('Saved 2m ago')).toBeTruthy()
  })

  it('accepts a custom JSX title and can hide the close button', () => {
    render(
      <Modal open onClose={() => {}} closeButton={false} title={<strong>Custom</strong>}>
        x
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Custom' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('closes with the X, Escape and the backdrop', async () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="Hi" />)
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await userEvent.keyboard('{Escape}')
    await userEvent.click(document.querySelector<HTMLElement>('.modal-backdrop')!)
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('respects closeOnEscape and closeOnBackdrop', async () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="Hi" closeOnEscape={false} closeOnBackdrop={false} />)
    await userEvent.keyboard('{Escape}')
    await userEvent.click(document.querySelector<HTMLElement>('.modal-backdrop')!)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('runs footer actions; false keeps it open', async () => {
    const onClose = vi.fn()
    const save = vi.fn(() => false as const)
    render(
      <Modal open onClose={onClose} title="Edit" actions={[{ label: 'Cancel' }, { label: 'Save', onClick: save }]} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(save).toHaveBeenCalledOnce()
    expect(onClose).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('only the topmost modal reacts to Escape', async () => {
    const outer = vi.fn()
    const inner = vi.fn()
    render(
      <>
        <Modal open onClose={outer} title="Outer" />
        <Modal open onClose={inner} title="Inner" />
      </>,
    )
    await userEvent.keyboard('{Escape}')
    expect(inner).toHaveBeenCalledOnce()
    expect(outer).not.toHaveBeenCalled()
  })

  it('keeps focus in an input while typing, with an inline onClose', async () => {
    function Form() {
      const [open, setOpen] = useState(false)
      const [value, setValue] = useState('')
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <Modal open={open} onClose={() => setOpen(false)} title="Invite">
            <input aria-label="Email" value={value} onChange={(e) => setValue(e.target.value)} />
          </Modal>
        </>
      )
    }
    render(<Form />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const input = screen.getByRole('textbox', { name: 'Email' })
    await userEvent.click(input)
    await userEvent.keyboard('ada@example.com')
    expect(input).toHaveProperty('value', 'ada@example.com')
    expect(document.activeElement).toBe(input)
  })
})

describe('useModal', () => {
  function setup() {
    let api!: ModalApi
    function Grab() {
      api = useModal()
      return null
    }
    render(
      <ModalProvider animated={false}>
        <Grab />
      </ModalProvider>,
    )
    return () => api
  }

  it('opens programmatically and resolves with the action value', async () => {
    const api = setup()
    let result!: Promise<unknown>
    act(() => {
      result = api().open({
        title: 'Delete?',
        content: <p>Gone forever</p>,
        actions: [
          { label: 'Cancel', value: false },
          { label: 'Delete', value: true },
        ],
      }).result
    })
    expect(screen.getByRole('dialog', { name: 'Delete?' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await expect(result).resolves.toBe(true)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('closes from the handle, passes it to content and supports update', async () => {
    const api = setup()
    const onClose = vi.fn()
    act(() => {
      const handle = api().open<string>({
        title: 'Step 1',
        onClose,
        content: (modal) => <button onClick={() => modal.close('done')}>Finish</button>,
      })
      handle.update({ title: 'Step 2' })
    })
    expect(screen.getByRole('dialog', { name: 'Step 2' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }))
    expect(onClose).toHaveBeenCalledWith('done')
  })

  it('throws outside a provider', () => {
    function Bad() {
      useModal()
      return null
    }
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Bad />)).toThrow(/ModalProvider/)
  })
})
