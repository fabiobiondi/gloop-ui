import { useState, type ReactNode } from 'react'
import Dialog, { type DialogAction } from '../components/Dialog'
import ExpandButton from '../components/ExpandButton'

// Le demo del Dialog hanno bisogno di uno stato: un ExpandButton apre il dialog
function DialogDemo({
  trigger,
  title,
  body,
  icon,
  actions,
}: {
  trigger: string
  title: string
  body?: ReactNode
  icon?: ReactNode
  actions?: DialogAction[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ExpandButton variant="action" label={trigger} onClick={() => setOpen(true)} />
      <Dialog open={open} onClose={() => setOpen(false)} title={title} icon={icon} actions={actions}>
        {body}
      </Dialog>
    </>
  )
}

export default DialogDemo
