import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import FloatingBubble from './floating/FloatingBubble'
import type { FloatingAlign, FloatingPlacement } from './floating/position'
import { Trigger } from './floating/trigger'
import { forwardTriggerProps } from './floating/trigger-props'
import { useFloating } from './floating/useFloating'
import { useThemeVars } from './floating/useThemeVars'

export type TooltipProps = {
  /** Testo o JSX */
  content: ReactNode
  /** Il trigger: un solo elemento che accetta ref (es. un <button>) */
  children: ReactElement
  placement?: FloatingPlacement
  align?: FloatingAlign
  /** Ritardo prima di aprirsi al passaggio del mouse, in ms */
  delay?: number
  /** Ritardo prima di chiudersi quando il mouse esce, in ms */
  closeDelay?: number
  disabled?: boolean
  /** Larghezza massima, in px */
  maxWidth?: number
}

// Il focus apre subito solo se arriva dalla tastiera: il clic del mouse non deve riaprirlo
function isFocusVisible(el: Element) {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

/*
 * Tooltip "liquido": al passaggio del mouse (dopo un ritardo) o al focus da tastiera
 * una goccia esce dal trigger e si gonfia in una bolla con freccia.
 * Il mouse può passare sopra il tooltip senza chiuderlo (WCAG 1.4.13).
 */
function Tooltip(props: TooltipProps) {
  const {
    content,
    children,
    placement = 'top',
    align = 'center',
    delay = 400,
    closeDelay = 100,
    disabled = false,
    maxWidth = 240,
    // Ref ed eventi di un trigger esterno (es. un Popover attorno al Tooltip)
    ...outer
  } = props as TooltipProps & Record<string, unknown>
  const [open, setOpen] = useState(false)
  const shown = open && !disabled
  const timer = useRef<number | undefined>(undefined)
  const id = useId()
  const { triggerRef, floatingRef, position } = useFloating(shown, { placement, align })
  const themeVars = useThemeVars(triggerRef, shown)

  function schedule(next: boolean, ms: number) {
    window.clearTimeout(timer.current)
    if (ms <= 0) setOpen(next)
    else timer.current = window.setTimeout(() => setOpen(next), ms)
  }
  const cancel = () => window.clearTimeout(timer.current)

  useEffect(() => cancel, [])

  useEffect(() => {
    if (!shown) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') schedule(false, 0)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [shown])

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') schedule(true, delay)
  }
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') schedule(false, closeDelay)
  }

  return (
    <>
      <Trigger
        element={forwardTriggerProps(children, outer, 'Tooltip')}
        triggerRef={triggerRef}
        owner="Tooltip"
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        onPointerDown={() => schedule(false, 0)}
        onFocus={(e: FocusEvent) => {
          if (isFocusVisible(e.currentTarget)) schedule(true, 0)
        }}
        onBlur={() => schedule(false, 0)}
        aria-describedby={shown ? id : undefined}
      />
      <FloatingBubble
        open={shown}
        variant="tooltip"
        position={position}
        floatingRef={floatingRef}
        themeVars={themeVars}
        style={{ '--floating-max-width': `${maxWidth}px` } as CSSProperties}
        bubbleProps={{ id, role: 'tooltip' }}
        layerProps={{
          // Sopra il tooltip resta aperto; uscendo si chiude con lo stesso ritardo
          onPointerEnter: cancel,
          onPointerLeave: onLeave,
        }}
      >
        {content}
      </FloatingBubble>
    </>
  )
}

export default Tooltip
