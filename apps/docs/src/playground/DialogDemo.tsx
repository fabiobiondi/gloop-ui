import { useState, type ReactNode } from 'react'
import { Dialog, ExpandButton, type DialogAction, type DialogProps } from 'gloop-ui'

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

export default DialogDemo
