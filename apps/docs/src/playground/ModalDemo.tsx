import { useState, type ReactNode } from 'react'
import {
  ExpandButton,
  Input,
  Modal,
  ModalProvider,
  useModal,
  type ModalAction,
  type ModalHandle,
  type ModalProps,
} from 'gloop-ui'
import { AlertIcon, CheckIcon, TrashIcon, XIcon } from './icons'
import './ModalDemo.css'

// Testo lungo per mostrare il contenuto che scorre
export const LOREM = Array.from({ length: 8 }, (_, i) => (
  <p key={i}>
    Paragraph {i + 1}. Liquid interfaces feel alive when every shape behaves like a drop: it swells, wobbles and settles.
    The content of this modal scrolls on its own while the header and the footer stay put, and a thin line appears
    when there is more text above or below.
  </p>
))

// Le demo del Modal hanno bisogno di uno stato: un ExpandButton apre il modal
function ModalDemo({
  trigger,
  body,
  actions,
  ...props
}: {
  trigger: string
  body?: ReactNode
  actions?: ModalAction[]
} & Omit<ModalProps, 'open' | 'onClose' | 'children' | 'actions'>) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ExpandButton variant="action" label={trigger} onClick={() => setOpen(true)} />
      <Modal open={open} onClose={() => setOpen(false)} actions={actions} {...props}>
        {body}
      </Modal>
    </>
  )
}

// Footer in JSX: un link a sinistra e i pulsanti a destra
export function ModalCustomFooterDemo() {
  const [open, setOpen] = useState(false)
  const [agree, setAgree] = useState(false)
  return (
    <>
      <ExpandButton variant="action" label="Terms of service" onClick={() => setOpen(true)} />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Terms of service"
        footer={
          <label className="md-check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />I agree
          </label>
        }
        actions={[
          { label: 'Decline', icon: XIcon },
          { label: 'Accept', icon: CheckIcon, color: 'var(--ui-accent)', onClick: () => (agree ? undefined : false) },
        ]}
      >
        {LOREM}
      </Modal>
    </>
  )
}

// Pulsanti che aprono modal da codice: useModal() funziona dentro un ModalProvider
function ProgrammaticButtons() {
  const modal = useModal()
  const [last, setLast] = useState('')

  async function confirmDelete() {
    const ok = await modal.open<boolean>({
      title: 'Delete 3 files?',
      size: 'sm',
      content: <p>They will be moved to the trash.</p>,
      actions: [
        { label: 'Cancel', value: false },
        { label: 'Delete', icon: TrashIcon, color: '#e11d48', value: true },
      ],
    }).result
    setLast(ok ? 'Deleted' : 'Cancelled')
  }

  // L'handle restituito da open() chiude il modal con il nome scritto
  function rename() {
    let name = 'Untitled'
    const handle: ModalHandle<string> = modal.open<string>({
      title: 'Rename',
      size: 'sm',
      content: (
        <form
          className="md-form"
          onSubmit={(e) => {
            e.preventDefault()
            handle.close(name)
          }}
        >
          <Input label="Name" defaultValue={name} autoFocus onChange={(e) => (name = e.target.value)} />
        </form>
      ),
      actions: [
        { label: 'Cancel' },
        // false: chiude già handle.close(name), il pulsante non deve chiudere con undefined
        {
          label: 'Save',
          icon: CheckIcon,
          color: 'var(--ui-accent)',
          onClick: () => {
            handle.close(name)
            return false
          },
        },
      ],
      onClose: (name) => name && setLast(`Renamed to ${name}`),
    })
  }

  return (
    <div className="md-stack">
      <div className="md-row">
        <ExpandButton variant="action" label="Confirm" icon={AlertIcon} onClick={confirmDelete} />
        <ExpandButton variant="action" label="Rename" onClick={rename} />
      </div>
      {last && <p className="md-note">{last}</p>}
    </div>
  )
}

export function ModalProgrammaticDemo() {
  return (
    <ModalProvider>
      <ProgrammaticButtons />
    </ModalProvider>
  )
}

export default ModalDemo
