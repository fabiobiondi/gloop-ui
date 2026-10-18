import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import FloatingBubble from './floating/FloatingBubble'
import type { FloatingAlign, FloatingPlacement } from '../components/floating/position'
import { PopoverContext, usePopover, type PopoverApi } from '../components/floating/popover-context'
import { Trigger } from '../components/floating/trigger'
import { forwardTriggerProps } from '../components/floating/trigger-props'
import { useFloating } from '../components/floating/useFloating'
import { useThemeVars } from '../components/floating/useThemeVars'
import type { MotionProps } from '../components/motion-context'
import { useCssMotion } from '../components/css-motion'

export type PopoverProps = {
  /** Contenuto, oppure una funzione che riceve { close } (es. per un pulsante "Salva") */
  content: ReactNode | ((api: PopoverApi) => ReactNode)
  /** Il trigger: un solo elemento che accetta ref (es. un <button>). Il clic apre e chiude. */
  children: ReactElement
  /** Modalità controllata */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: FloatingPlacement
  align?: FloatingAlign
  /** Si chiude con un clic fuori da trigger e popover */
  closeOnOutsideClick?: boolean
  closeOnEscape?: boolean
  /** Si chiude quando il mouse esce da trigger e popover */
  closeOnLeave?: boolean
  /** Ritardo della chiusura al rollout, in ms */
  leaveDelay?: number
  /** Nome accessibile del popover */
  label?: string
} & MotionProps

// La render-prop riceve l'api dal context, come usePopover
function Content({ content }: { content: PopoverProps['content'] }) {
  const api = usePopover()
  return typeof content === 'function' ? content(api) : content
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/*
 * Popover "liquido" non modale: al clic sul trigger una goccia esce dalla freccia
 * e si gonfia in una bolla che può contenere form e altri componenti.
 * Si chiude con un clic fuori, con Esc, dal codice (close / usePopover / open)
 * o, con closeOnLeave, quando il mouse esce.
 */
function Popover(props: PopoverProps) {
  const {
    content,
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    placement = 'bottom',
    align = 'center',
    closeOnOutsideClick = true,
    closeOnEscape = true,
    closeOnLeave = false,
    leaveDelay = 250,
    label,
    speed,
    motion,
    animated,
    reducedMotion,
    // Ref ed eventi di un trigger esterno (es. un Tooltip attorno al Popover)
    ...outer
  } = props as PopoverProps & Record<string, unknown>
  // Esplicite: il resto (outer) va al trigger
  const motionProps = { speed, motion, animated, reducedMotion }
  const m = useCssMotion(motionProps)
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const open = openProp ?? uncontrolled
  const panelId = useId()
  const { triggerRef, floatingRef, position } = useFloating(open, { placement, align })
  const themeVars = useThemeVars(triggerRef, open)

  // pointerdown "dentro" (trigger, bolla o un popover annidato) visto prima del listener su document
  const inside = useRef(false)
  const leaveTimer = useRef<number | undefined>(undefined)
  const hovering = useRef(false)

  function setOpen(next: boolean) {
    if (openProp === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }
  // I listener su document leggono sempre l'ultima versione
  const setOpenRef = useRef(setOpen)
  useLayoutEffect(() => {
    setOpenRef.current = setOpen
  })

  function close(focusTrigger = true) {
    window.clearTimeout(leaveTimer.current)
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }
  const api: PopoverApi = { close: () => close() }

  useEffect(() => () => window.clearTimeout(leaveTimer.current), [])

  /*
   * Clic fuori. Gli eventi sintetici di React risalgono l'albero dei componenti anche
   * attraverso i portal: un clic in un popover annidato (o in un tooltip) dentro questo
   * passa da onPointerDownCapture e non lo chiude. Il focus resta dove si è cliccato.
   */
  useEffect(() => {
    if (!open || !closeOnOutsideClick) return
    inside.current = false
    function onPointerDown() {
      if (inside.current) inside.current = false
      else setOpenRef.current(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, closeOnOutsideClick])

  // All'apertura il focus va al primo elemento focusabile, altrimenti alla bolla
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      const panel = floatingRef.current
      if (!panel || panel.contains(document.activeElement)) return
      ;(panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [open, floatingRef])

  // Esc chiude solo il popover più interno
  function onKeyDown(e: KeyboardEvent) {
    if (!open || !closeOnEscape || e.key !== 'Escape') return
    e.stopPropagation()
    close()
  }

  /*
   * Rollout: uscendo da trigger e bolla parte il ritardo, rientrare lo annulla.
   * Con un pulsante premuto (es. trascinando uno slider fuori) si aspetta il rilascio.
   */
  function scheduleLeave() {
    window.clearTimeout(leaveTimer.current)
    leaveTimer.current = window.setTimeout(() => setOpenRef.current(false), leaveDelay)
  }
  const hoverProps = closeOnLeave
    ? {
        onPointerEnter: () => {
          hovering.current = true
          window.clearTimeout(leaveTimer.current)
        },
        onPointerLeave: (e: PointerEvent) => {
          hovering.current = false
          if (!open || e.pointerType === 'touch') return
          if (!e.buttons) return scheduleLeave()
          document.addEventListener('pointerup', () => !hovering.current && scheduleLeave(), { once: true })
        },
      }
    : {}

  const markInside = () => {
    inside.current = true
  }

  return (
    <>
      <Trigger
        element={forwardTriggerProps(children, outer, 'Popover')}
        triggerRef={triggerRef}
        owner="Popover"
        onClick={() => setOpen(!open)}
        onPointerDownCapture={markInside}
        onKeyDown={onKeyDown}
        {...hoverProps}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
      />
      <FloatingBubble
        open={open}
        variant="popover"
        position={position}
        floatingRef={floatingRef}
        themeVars={themeVars}
        m={m}
        motionProps={motionProps}
        bubbleProps={{ id: panelId, role: 'dialog', 'aria-label': label, tabIndex: -1 }}
        layerProps={{ onPointerDownCapture: markInside, onKeyDown, ...hoverProps }}
      >
        <PopoverContext.Provider value={api}>
          <Content content={content} />
        </PopoverContext.Provider>
      </FloatingBubble>
    </>
  )
}

export default Popover
