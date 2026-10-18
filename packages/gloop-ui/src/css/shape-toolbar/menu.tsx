import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import {
  MenuContext,
  setStagger,
  triggerId,
  useMenu,
  usePresence,
  useSharedLayout,
  type MenuContextValue,
} from './menu-shared'

/** Elementi di un popover che entrano a cascata (in ShapeEditor.css la stessa lista) */
const STAGGERED = '.st-item, .st-swatch-btn, .st-hex, .st-option-tile, .st-option'

export function MenuRoot({ className, children }: { className?: string; children: ReactNode }) {
  const rootId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [path, setPath] = useState<string[]>([])

  useEffect(() => {
    if (!path.length) return

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setPath([])
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      // Esc chiude solo il livello più interno
      const last = path[path.length - 1]
      setPath(path.slice(0, -1))
      document.getElementById(triggerId(rootId, last))?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [path, rootId])

  const value: MenuContextValue = {
    rootId,
    depth: 0,
    path,
    toggle: (id, depth) =>
      setPath((p) => (p[depth] === id ? p.slice(0, depth) : [...p.slice(0, depth), id])),
    dismiss: () => setPath([]),
  }

  return (
    // Animazioni: le decide il GloopMotionProvider di ShapeEditor
    <MenuContext.Provider value={value}>
      <div ref={rootRef} className={className} role="toolbar">
        {children}
      </div>
    </MenuContext.Provider>
  )
}

type ToolButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
  children?: ReactNode
  active?: boolean
  wide?: boolean
}

export function ToolButton({ active, wide, className, children, ...props }: ToolButtonProps) {
  const { rootId, depth } = useMenu()

  return (
    // La pressione (scale 0.94) è in CSS, su :active
    <button
      type="button"
      className={['st-btn', wide && 'st-btn--wide', className].filter(Boolean).join(' ')}
      {...props}
    >
      {/* Un solo evidenziatore per livello: scivola da un trigger all'altro */}
      {active && <ActiveMark id={`${rootId}-active-${depth}`} />}
      <span className="st-btn__content">{children}</span>
    </button>
  )
}

function ActiveMark({ id }: { id: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useSharedLayout(id, ref, 'glide')
  return <span ref={ref} className="st-btn__active" style={{ borderRadius: 8 }} />
}

type PopoverProps = {
  id: string
  label: string
  trigger: ReactNode
  children: ReactNode
  placement?: 'top' | 'bottom'
  align?: 'start' | 'center' | 'end'
  wide?: boolean
}

const originX = { start: 0, center: 0.5, end: 1 }

export function Popover({
  id,
  label,
  trigger,
  children,
  placement = 'bottom',
  align = 'center',
  wide,
}: PopoverProps) {
  const ctx = useMenu()
  const open = ctx.path[ctx.depth] === id
  const panel = usePresence<HTMLDivElement>(open)
  const panelId = `${ctx.rootId}-${id}`
  const tId = triggerId(ctx.rootId, id)

  const inner: MenuContextValue = {
    ...ctx,
    depth: ctx.depth + 1,
    dismiss: () => {
      ctx.toggle(id, ctx.depth)
      document.getElementById(tId)?.focus()
    },
  }

  /*
   * I contenuti entrano a cascata (staggerChildren 12ms, dopo 20ms). Solo quelli di
   * questo pannello: i popover annidati fanno la loro cascata quando si aprono.
   */
  useLayoutEffect(() => {
    const el = panel.ref.current
    if (!el || !open) return
    const items = [...el.querySelectorAll<HTMLElement>(STAGGERED)].filter((item) => item.closest('.st-popover') === el)
    setStagger(items, (i) => 20 + i * 12)
  })

  return (
    <div className="st-anchor">
      <ToolButton
        id={tId}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        active={open}
        wide={wide}
        onClick={() => ctx.toggle(id, ctx.depth)}
      >
        {trigger}
      </ToolButton>

      {panel.mounted && (
        <div
          ref={panel.ref}
          id={panelId}
          role="dialog"
          aria-label={label}
          className="st-popover"
          data-placement={placement}
          data-align={align}
          data-closing={panel.closing || undefined}
          // Il pannello si apre dal lato del trigger (lo spostamento -50% del centro è nel CSS)
          style={{ transformOrigin: `${originX[align] * 100}% ${placement === 'top' ? 100 : 0}%` }}
        >
          <MenuContext.Provider value={inner}>{children}</MenuContext.Provider>
        </div>
      )}
    </div>
  )
}

/** Wrapper per far entrare a cascata qualsiasi contenuto di un popover */
export function Item({ children }: { children: ReactNode }) {
  return <div className="st-item">{children}</div>
}
