import { useState, type ReactNode } from 'react'
import { Dialog, ExpandButton, Input, type DialogAction, type DialogProps } from 'gloop-ui'
import { CheckIcon, UserIcon, XIcon } from './icons'
import './DialogDemo.css'

// Le demo del Dialog hanno bisogno di uno stato: un ExpandButton apre il dialog
function DialogDemo({
  trigger,
  title,
  body,
  icon,
  actions,
  ...backdrop
}: {
  trigger: string
  title: string
  body?: ReactNode
  icon?: ReactNode
  actions?: DialogAction[]
} & Pick<DialogProps, 'backdropColor' | 'backdropOpacity' | 'backdropBlur'>) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ExpandButton variant="action" label={trigger} onClick={() => setOpen(true)} />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        icon={icon}
        actions={actions}
        {...backdrop}
      >
        {body}
      </Dialog>
    </>
  )
}

// Form dentro il Dialog: i pulsanti stanno fuori dal <form>, quindi Invite e Invio chiamano la stessa funzione
export function DialogFormDemo() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [invited, setInvited] = useState('')

  function openDialog() {
    setName('')
    setEmail('')
    setOpen(true)
  }

  // false tiene aperto il dialog finché manca l'email
  function invite() {
    if (!email.trim()) return false
    setInvited(name.trim() || email.trim())
  }

  return (
    <div className="dd-stack">
      <ExpandButton variant="action" label="Invite teammate" icon={UserIcon} onClick={openDialog} />
      {invited && <p className="dd-note">Invite sent to {invited}</p>}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Invite a teammate"
        icon={UserIcon}
        actions={[
          { label: 'Cancel', icon: XIcon },
          { label: 'Invite', icon: CheckIcon, color: 'var(--ui-accent)', onClick: invite },
        ]}
      >
        <form
          className="dd-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (invite() !== false) setOpen(false)
          }}
        >
          <Input label="Name" placeholder="Your teammate's name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Email"
            type="email"
            placeholder="name@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {/* Invio in un campo invia il form */}
          <button type="submit" hidden />
        </form>
      </Dialog>
    </div>
  )
}

export default DialogDemo
