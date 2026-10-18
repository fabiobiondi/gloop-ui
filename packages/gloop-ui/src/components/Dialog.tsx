import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import ExpandButton from './ExpandButton'
import { GooFilter, useSettled } from './goo'
import { useThemeVars } from './floating/useThemeVars'
import { GloopMotionProvider, pickMotionProps, type MotionProps } from './motion-context'
import { useGloopMotion } from './gloop-motion'
import { usePresence } from './jelly'
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
} & MotionProps

// Gli spazi tra badge, scheda e pulsanti: oltre ~12px il filtro goo non li fonde da fermi
const GAP = 14
const BADGE_SIZE = 56
const BUTTON_HEIGHT = 44

/*
 * Le molle (swell: la scheda si gonfia con un piccolo rimbalzo; drip: badge e pulsanti
 * che colano; suck: il risucchio della chiusura) sono easing linear() in Dialog.css.
 * Qui restano le distanze, passate come variabili CSS.
 */

/*
 * Dialog "liquido". Tre forme dentro un filtro goo:
 * - la scheda, che nasce piccola e schiacciata e si gonfia con un piccolo rimbalzo
 * - il badge con l'icona (facoltativo), che si stacca dalla parte alta
 * - i pulsanti, che colano fuori dal bordo inferiore uno dopo l'altro
 * In chiusura tutto viene risucchiato nella scheda, più in fretta: il dialog resta montato
 * (data-state="closing") finché le transizioni non sono finite.
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
  ...motionProps
}: DialogProps) {
  const m = useGloopMotion(motionProps)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const { mounted, closing } = usePresence(open, m.state === 'off', layerRef)
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  // Colori del tema dal punto di utilizzo (il dialog è in un portal)
  const themeVars = useThemeVars(anchorRef, open)
  const titleId = useId()
  const bodyId = useId()
  const filterId = useId()
  // Filtro goo solo in apertura e chiusura: da fermo il contenuto resta fuori dal filtro
  const settled = useSettled(rootRef, mounted && !closing)
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
        <GloopMotionProvider {...pickMotionProps(motionProps)}>
          {mounted && (
            <div
              ref={layerRef}
              {...m.rootProps}
              className="dialog-layer"
              data-state={closing ? 'closing' : 'open'}
              style={
                {
                  ...m.rootProps.style,
                  ...themeVars,
                  // Badge e pulsanti partono dentro la scheda (y) e si staccano
                  '--dialog-badge-from': `${BADGE_SIZE / 2 + GAP + 8}px`,
                  '--dialog-action-from': `${-(BUTTON_HEIGHT / 2 + GAP + 8)}px`,
                } as CSSProperties
              }
            >
              <div className="dialog-backdrop" aria-hidden="true" style={backdropVars} onClick={onClose} />

              <div
                ref={rootRef}
                className="dialog-goo"
                data-settled={settled || undefined}
                style={{ gap: GAP, filter: settled ? undefined : `url(#${CSS.escape(filterId)})` }}
              >
                <GooFilter id={filterId} blur={9} />

                {icon && (
                  <div className="dialog__badge" aria-hidden="true" style={{ width: BADGE_SIZE, height: BADGE_SIZE }}>
                    <span className="dialog__badge-icon">{icon}</span>
                  </div>
                )}

                <div
                  ref={cardRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  aria-describedby={children ? bodyId : undefined}
                  tabIndex={-1}
                  className="dialog"
                >
                  {/* Il contenuto arriva quando la goccia ha quasi preso forma */}
                  <div>
                    <h2 id={titleId} className="dialog__title">
                      {title}
                    </h2>
                    {children && (
                      <div id={bodyId} className="dialog__body">
                        {children}
                      </div>
                    )}
                  </div>
                </div>

                {actions.length > 0 && (
                  <div className="dialog__actions">
                    {actions.map((action, i) => (
                      // Colano giù dal bordo della scheda, uno dopo l'altro
                      <div key={action.label} style={{ '--i': i } as CSSProperties}>
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </GloopMotionProvider>,
        document.body,
      )}
    </>
  )
}

export default Dialog
