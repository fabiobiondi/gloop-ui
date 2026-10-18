import { useId, useRef, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { createPortal } from 'react-dom'
import { GooFilter, useSettled } from '../goo'
import { JELLY_X, JELLY_Y, jellySpring, usePresence } from '../jelly'
import { GloopMotionProvider, pickMotionProps, type MotionProps } from '../motion-context'
import type { GloopMotion } from '../gloop-motion'
import type { FloatingPosition, FloatingSide } from '../floating/position'
import { ARROW } from '../floating/useFloating'
import '../theme.css'
import './Floating.css'

type FloatingBubbleProps = {
  open: boolean
  variant: 'tooltip' | 'popover'
  position: FloatingPosition | null
  floatingRef: Ref<HTMLDivElement>
  themeVars: CSSProperties
  /** Attributi della bolla (role, id, aria-*) */
  bubbleProps?: HTMLAttributes<HTMLDivElement>
  /** Eventi del livello: coprono bolla e freccia */
  layerProps?: HTMLAttributes<HTMLDivElement>
  style?: CSSProperties
  /** Animazioni risolte dal Tooltip/Popover che usa la bolla */
  m: GloopMotion
  motionProps: MotionProps
  /** Gelatina all'apertura, da 0 a 1: larghezza e altezza rimbalzano fuori fase. Assente: nessuna */
  jelly?: number
  children: ReactNode
}

// Dimensione della goccia da cui parte la bolla, in px
const DROP = 18

const isVertical = (p: FloatingSide) => p === 'top' || p === 'bottom'

/*
 * Scala della goccia iniziale. La bolla parte da una goccia di DROP px attaccata alla freccia
 * e si gonfia fino alla dimensione piena; in chiusura viene risucchiata nella stessa goccia.
 * Dipende dalla posizione misurata: finché non c'è, la bolla resta "hidden".
 */
function drop(pos: FloatingPosition | null) {
  return {
    x: pos ? Math.min(1, DROP / pos.width) : 0,
    y: pos ? Math.min(1, DROP / pos.height) : 0,
  }
}

// Punto da cui si gonfia la bolla: la base della freccia, sul bordo verso il trigger
function origin(pos: FloatingPosition | null) {
  if (!pos) return '50% 50%'
  const along = (pos.arrowOffset / (isVertical(pos.placement) ? pos.width : pos.height)) * 100
  switch (pos.placement) {
    case 'top':
      return `${along}% 100%`
    case 'bottom':
      return `${along}% 0%`
    case 'left':
      return `100% ${along}%`
    case 'right':
      return `0% ${along}%`
  }
}

/*
 * Bolla "liquida" con freccia, condivisa da Tooltip e Popover.
 * Freccia e bolla stanno in un filtro goo: mentre la bolla si gonfia dalla freccia,
 * le due forme si fondono in un collo liquido. Da aperta il filtro si toglie (useSettled). Il filtro ridisegna l'originale sopra,
 * quindi testo e campi dei form restano nitidi.
 * Animata in CSS (Floating.css): data-state sceglie apertura (hidden → open, keyframe dalla
 * goccia misurata) o chiusura (closing, transizioni che partono dal valore corrente).
 * È in un portal su <body>, renderizzato solo nel browser (SSR-safe).
 */
function FloatingBubble({
  open,
  variant,
  position,
  floatingRef,
  themeVars,
  bubbleProps,
  layerProps,
  style,
  m,
  motionProps,
  jelly,
  children,
}: FloatingBubbleProps) {
  const filterId = useId()
  const layerRef = useRef<HTMLDivElement>(null)
  // Resta montata durante la chiusura, finché le transizioni non sono finite
  const { mounted, closing } = usePresence(open, m.state === 'off', layerRef)
  // Filtro goo solo mentre si gonfia o viene risucchiata: da aperta il contenuto (campi,
  // scroll, hover) non deve passare dal filtro a ogni repaint
  const settled = useSettled(layerRef, mounted && !closing && !!position)
  // Sul server non c'è <body> né portal: la bolla esiste solo nel browser
  if (typeof document === 'undefined') return null

  const placement = position?.placement ?? 'top'
  const d = drop(position)
  // Con jelly: l'asse che parte dal trigger usa la molla più rigida, l'altro la più morbida
  const along = jelly === undefined ? undefined : jellySpring(JELLY_X, jelly, m.preset)
  const across = jelly === undefined ? undefined : jellySpring(JELLY_Y, jelly, m.preset)

  return createPortal(
    <GloopMotionProvider {...pickMotionProps(motionProps)}>
      {mounted && (
        <div
          ref={layerRef}
          {...layerProps}
          {...m.rootProps}
          className={`floating floating--${variant}`}
          data-placement={placement}
          data-state={closing ? 'closing' : position ? 'open' : 'hidden'}
          data-settled={settled || undefined}
          style={
            {
              ...m.rootProps.style,
              ...themeVars,
              ...style,
              transform: position ? `translate3d(${position.x}px, ${position.y}px, 0)` : undefined,
              // Il primo frame serve solo a misurare
              visibility: position ? undefined : 'hidden',
              filter: settled ? undefined : `url(#${CSS.escape(filterId)})`,
              '--floating-arrow': `${ARROW}px`,
              '--floating-arrow-offset': `${position?.arrowOffset ?? 0}px`,
              '--floating-drop-x': d.x,
              '--floating-drop-y': d.y,
              ...(along &&
                across && {
                  '--floating-along': along.ease,
                  '--floating-along-ms': `${along.ms}ms`,
                  '--floating-across': across.ease,
                  '--floating-across-ms': `${across.ms}ms`,
                }),
            } as CSSProperties
          }
        >
          <GooFilter id={filterId} blur={variant === 'tooltip' ? 4 : 6} />

          <div
            ref={floatingRef}
            {...bubbleProps}
            className="floating__bubble"
            style={{ transformOrigin: origin(position) }}
          >
            <div className="floating__content">{children}</div>
          </div>

          {/* Dopo la bolla: copre il suo bordo interno nel punto di attacco */}
          <span className="floating__arrow" aria-hidden="true" />
        </div>
      )}
    </GloopMotionProvider>,
    document.body,
  )
}

export default FloatingBubble
