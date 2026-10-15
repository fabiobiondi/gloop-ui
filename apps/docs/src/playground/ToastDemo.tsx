import { useState, type ReactNode } from 'react'
import { ExpandButton, Toast, type ToastProps } from 'gloop-ui'

// Le demo del Toast hanno bisogno di uno stato: un ExpandButton lo apre
function ToastDemo({
  trigger,
  children,
  ...props
}: { trigger: string; children?: ReactNode } & Omit<ToastProps, 'open' | 'onClose'>) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ExpandButton variant="action" label={trigger} onClick={() => setOpen((o) => !o)} />
      <Toast open={open} onClose={() => setOpen(false)} {...props}>
        {children}
      </Toast>
    </>
  )
}

export default ToastDemo
