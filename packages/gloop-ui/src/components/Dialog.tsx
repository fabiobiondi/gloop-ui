import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, MotionConfig, motion, type Transition } from 'motion/react'
import ExpandButton from './ExpandButton'
import { GooFilter } from './goo'
import { useThemeVars } from './floating/useThemeVars'
import './theme.css'
import './Dialog.css'

export type DialogAction = {
  label: string
  icon?: ReactNode
  /** Solo icona: la label resta come nome accessibile */
  iconOnly?: boolean
  /** Colore di sfondo del pulsante (default --ui-bg) */
  color?: string
  /** Default: chiude il dialog. Restituisci false per tenerlo aperto. */
  onClick?: () => void | false
  autoFocus?: boolean
}

export type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  children?: ReactNode
  /** Icona in un badge che si stacca dalla parte alta del dialog */
  icon?: ReactNode
  /** Da 0 a N pulsanti, con o senza icona (sono ExpandButton in modalità action) */
  actions?: DialogAction[]
  /** Colore dello sfondo dietro il dialog (default nero) */
  backdropColor?: string
  /** Opacità dello sfondo, da 0 a 1 (default 0.45) */
  backdropOpacity?: number
  /** Sfocatura della pagina dietro il dialog, in px (default 0) */
  backdropBlur?: number
}

// Gli spazi tra badge, scheda e pulsanti: oltre ~12px il filtro goo non li fonde da fermi
const GAP = 14
const BADGE_SIZE = 56
const BUTTON_HEIGHT = 44

// Piccolo rimbalzo: la scheda si gonfia come una goccia e si assesta
const swell: Transition = { type: 'spring', stiffness: 380, damping: 22, mass: 0.9 }
const drip: Transition = { type: 'spring', stiffness: 300, damping: 18 }
const suck: Transition = { type: 'spring', stiffness: 520, damping: 40 }

/*
 * Dialog "liquido". Tre forme dentro un filtro goo:
 * - la scheda, che nasce piccola e schiacciata e si gonfia con un piccolo rimbalzo
 * - il badge con l'icona (facoltativo), che si stacca dalla parte alta
 * - i pulsanti, che colano fuori dal bordo inferiore uno dopo l'altro
 * In chiusura tutto viene risucchiato nella scheda, più in fretta.
 *
 * È renderizzato in un portal su <body>: i colori del tema (--ui-*) vengono letti
 * dal punto in cui il Dialog è usato e riapplicati, così segue il tema locale.
 */
function Dialog({
  open,
  onClose,
  title,
  children,
  icon,
  actions = [],
  backdropColor,
  backdropOpacity,
  backdropBlur,
}: DialogProps) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  // Colori del tema dal punto di utilizzo (il dialog è in un portal)
  const themeVars = useThemeVars(anchorRef, open)
  const titleId = useId()
  const bodyId = useId()
  const filterId = useId()
  // onClose arriva spesso inline (nuova a ogni render): l'effetto sotto la legge da qui,
  // altrimenti ripartirebbe a ogni tasto premuto in un input e il focus salterebbe via
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Solo i valori passati: per gli altri valgono i default del CSS
  const backdropVars = {
    '--dialog-backdrop-color': backdropColor,
    '--dialog-backdrop-opacity': backdropOpacity === undefined ? undefined : Math.min(1, Math.max(0, backdropOpacity)),
    '--dialog-backdrop-blur': backdropBlur === undefined ? undefined : `${Math.max(0, backdropBlur)}px`,
  } as CSSProperties


  useEffect(() => {
    if (!open) return

    // Focus dentro il dialog; alla chiusura torna dove era
    const previous = document.activeElement as HTMLElement | null
    const frame = requestAnimationFrame(() => {
      if (!rootRef.current?.contains(document.activeElement)) cardRef.current?.focus()
    })

    // La pagina sotto non scorre
    const overflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      // Il Tab gira solo tra gli elementi del dialog
      if (e.key !== 'Tab' || !rootRef.current) return
      const focusables = [
        ...rootRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ]
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === cardRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      document.documentElement.style.overflow = overflow
      previous?.focus()
    }
  }, [open])

  return (
    <>
      <span ref={anchorRef} hidden />
      {createPortal(
        <MotionConfig reducedMotion="user">
          <AnimatePresence>
            {open && (
              <div key="dialog" className="dialog-layer" style={themeVars}>
                <motion.div
                  className="dialog-backdrop"
                  aria-hidden="true"
                  style={backdropVars}
                  onClick={onClose}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.2 } }}
                  exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.05 } }}
                />

                <div
                  ref={rootRef}
                  className="dialog-goo"
                  style={{ gap: GAP, filter: `url(#${CSS.escape(filterId)})` }}
                >
                  <GooFilter id={filterId} blur={9} />

                  {icon && (
                    <motion.div
                      className="dialog__badge"
                      aria-hidden="true"
                      style={{ width: BADGE_SIZE, height: BADGE_SIZE }}
                      // Parte dentro la scheda e si stacca verso l'alto
                      initial={{ y: BADGE_SIZE / 2 + GAP + 8, scale: 0.4 }}
                      animate={{ y: 0, scale: 1, transition: { ...drip, delay: 0.08 } }}
                      exit={{
                        y: BADGE_SIZE / 2 + GAP + 8,
                        scale: 0.4,
                        opacity: 0,
                        transition: { ...suck, opacity: { duration: 0.12, delay: 0.08 } },
                      }}
                    >
                      <motion.span
                        className="dialog__badge-icon"
                        initial={{ scale: 0.5, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0, transition: { ...drip, delay: 0.16 } }}
                      >
                        {icon}
                      </motion.span>
                    </motion.div>
                  )}

                  <motion.div
                    ref={cardRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    aria-describedby={children ? bodyId : undefined}
                    tabIndex={-1}
                    className="dialog"
                    initial={{ scaleX: 0.35, scaleY: 0.2, opacity: 0 }}
                    animate={{
                      scaleX: 1,
                      scaleY: 1,
                      opacity: 1,
                      transition: { ...swell, opacity: { duration: 0.1 } },
                    }}
                    exit={{
                      scaleX: 0.35,
                      scaleY: 0.2,
                      opacity: 0,
                      transition: { ...suck, delay: 0.06, opacity: { duration: 0.12, delay: 0.1 } },
                    }}
                  >
                    {/* Il contenuto arriva quando la goccia ha quasi preso forma */}
                    <motion.div
                      initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        transition: { duration: 0.25, delay: 0.12, ease: [0.23, 1, 0.32, 1] },
                      }}
                      exit={{ opacity: 0, transition: { duration: 0.08 } }}
                    >
                      <h2 id={titleId} className="dialog__title">
                        {title}
                      </h2>
                      {children && (
                        <div id={bodyId} className="dialog__body">
                          {children}
                        </div>
                      )}
                    </motion.div>
                  </motion.div>

                  {actions.length > 0 && (
                    <div className="dialog__actions">
                      {actions.map((action, i) => (
                        <motion.div
                          key={action.label}
                          // Colano giù dal bordo della scheda, uno dopo l'altro
                          initial={{ y: -(BUTTON_HEIGHT / 2 + GAP + 8), scale: 0.4 }}
                          animate={{ y: 0, scale: 1, transition: { ...drip, delay: 0.1 + i * 0.05 } }}
                          exit={{
                            y: -(BUTTON_HEIGHT / 2 + GAP + 8),
                            scale: 0.4,
                            opacity: 0,
                            transition: { ...suck, opacity: { duration: 0.12, delay: 0.08 } },
                          }}
                        >
                          <ExpandButton
                            variant="action"
                            label={action.label}
                            icon={action.icon}
                            iconOnly={action.iconOnly}
                            activeColor={action.color}
                            autoFocus={action.autoFocus}
                            onClick={() => {
                              if (action.onClick?.() !== false) onClose()
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </AnimatePresence>
        </MotionConfig>,
        document.body,
      )}
    </>
  )
}

export default Dialog
