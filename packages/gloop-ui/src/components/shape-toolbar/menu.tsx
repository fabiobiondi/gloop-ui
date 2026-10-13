import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, MotionConfig, motion, type HTMLMotionProps } from 'motion/react'
import {
  MenuContext,
  glide,
  itemVariants,
  panelVariants,
  triggerId,
  useMenu,
  type MenuContextValue,
} from './menu-shared'

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
    <MotionConfig reducedMotion="user">
      <MenuContext.Provider value={value}>
        <div ref={rootRef} className={className} role="toolbar">
          {children}
        </div>
      </MenuContext.Provider>
    </MotionConfig>
  )
}

type ToolButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children?: ReactNode
  active?: boolean
  wide?: boolean
}

export function ToolButton({ active, wide, className, children, ...props }: ToolButtonProps) {
  const { rootId, depth } = useMenu()

  return (
    <motion.button
      type="button"
      className={['st-btn', wide && 'st-btn--wide', className].filter(Boolean).join(' ')}
      whileTap={{ scale: 0.94 }}
      {...props}
    >
      {/* Un solo evidenziatore per livello: scivola da un trigger all'altro */}
      {active && (
        <motion.span
          layoutId={`${rootId}-active-${depth}`}
          className="st-btn__active"
          transition={glide}
          style={{ borderRadius: 8 }}
        />
      )}
      <span className="st-btn__content">{children}</span>
    </motion.button>
  )
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

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="dialog"
            aria-label={label}
            className="st-popover"
            data-placement={placement}
            data-align={align}
            // Il pannello si apre dal lato del trigger
            style={{
              originX: originX[align],
              originY: placement === 'top' ? 1 : 0,
              x: align === 'center' ? '-50%' : 0,
            }}
            variants={panelVariants(placement)}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <MenuContext.Provider value={inner}>{children}</MenuContext.Provider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Wrapper per far entrare a cascata qualsiasi contenuto di un popover */
export function Item({ children }: { children: ReactNode }) {
  return (
    <motion.div className="st-item" variants={itemVariants}>
      {children}
    </motion.div>
  )
}
