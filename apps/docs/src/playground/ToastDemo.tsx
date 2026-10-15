import { useRef, useState, type ReactNode } from 'react'
import { ExpandButton, Toast, type ToastProps, type ToastVariant } from 'gloop-ui'

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

type Shown = { label: string; variant: ToastVariant; color?: string; title: string; message: string }

const VARIANTS: Shown[] = [
  { label: 'Info', variant: 'info', title: 'New version', message: 'Reload to get the latest features.' },
  { label: 'Success', variant: 'success', title: 'Saved', message: 'Your changes are live.' },
  { label: 'Warning', variant: 'warning', title: 'Storage almost full', message: '92% of your space is used.' },
  { label: 'Error', variant: 'error', title: 'Upload failed', message: 'Check your connection and retry.' },
  { label: 'Custom', variant: 'default', color: '#7c3aed', title: 'Custom color', message: 'Any CSS color via color.' },
]

// Un toast alla volta: se uno è aperto, il successivo arriva quando il primo è rientrato nel bordo
export function ToastVariantsDemo() {
  const [shown, setShown] = useState<Shown>(VARIANTS[1])
  const [open, setOpen] = useState(false)
  const next = useRef<Shown | null>(null)

  function show(item: Shown) {
    if (open) {
      next.current = item
      setOpen(false)
    } else {
      setShown(item)
      setOpen(true)
    }
  }

  function afterClose() {
    if (!next.current) return
    setShown(next.current)
    next.current = null
    setOpen(true)
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
      {VARIANTS.map((item) => (
        <ExpandButton key={item.label} variant="action" label={item.label} onClick={() => show(item)} />
      ))}
      <Toast
        open={open}
        onClose={() => setOpen(false)}
        afterClose={afterClose}
        variant={shown.variant}
        color={shown.color}
        title={shown.title}
      >
        {shown.message}
      </Toast>
    </div>
  )
}

export default ToastDemo
