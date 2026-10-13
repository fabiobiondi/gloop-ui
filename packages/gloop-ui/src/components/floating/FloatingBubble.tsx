import { useId, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, MotionConfig, motion, type Transition, type Variants } from 'motion/react'
import { GooFilter } from '../goo'
import type { FloatingPlacement, FloatingPosition } from './position'
import { ARROW } from './useFloating'
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
  children: ReactNode
}

// Dimensione della goccia da cui parte la bolla, in px
const DROP = 18

// L'asse che parte dal trigger è più rigido: la goccia prima cola, poi si allarga
const flow: Transition = { type: 'spring', stiffness: 460, damping: 26 }
const spread: Transition = { type: 'spring', stiffness: 300, damping: 21, delay: 0.03 }
const suck: Transition = { type: 'spring', stiffness: 520, damping: 40 }
const drip: Transition = { type: 'spring', stiffness: 600, damping: 26 }

const isVertical = (p: FloatingPlacement) => p === 'top' || p === 'bottom'

/*
 * Scala della goccia iniziale. La bolla parte da una goccia di DROP px attaccata alla freccia
 * e si gonfia fino alla dimensione piena; in chiusura viene risucchiata nella stessa goccia.
 * Le varianti dipendono dalla posizione misurata (custom): finché non c'è, la bolla resta "hidden".
 */
function drop(pos: FloatingPosition | null) {
  return {
    scaleX: pos ? Math.min(1, DROP / pos.width) : 0,
    scaleY: pos ? Math.min(1, DROP / pos.height) : 0,
  }
}

const bubbleVariants: Variants = {
  hidden: { scaleX: 0, scaleY: 0, opacity: 0 },
  open: (pos: FloatingPosition | null) => {
    const d = drop(pos)
    const vertical = isVertical(pos?.placement ?? 'top')
    return {
      // Keyframe esplicito: parte dalla goccia calcolata sulla dimensione reale
      scaleX: [d.scaleX, 1],
      scaleY: [d.scaleY, 1],
      opacity: 1,
      transition: {
        scaleX: vertical ? spread : flow,
        scaleY: vertical ? flow : spread,
        opacity: { duration: 0.08 },
      },
    }
  },
  exit: (pos: FloatingPosition | null) => ({
    ...drop(pos),
    opacity: 0,
    transition: { ...suck, delay: 0.04, opacity: { duration: 0.1, delay: 0.1 } },
  }),
}

// La freccia esce per prima dal trigger e rientra per ultima
const arrowVariants: Variants = {
  hidden: { scale: 0 },
  open: { scale: 1, transition: drip },
  exit: { scale: 0, transition: { ...suck, delay: 0.1 } },
}

// Il contenuto arriva quando la goccia ha quasi preso forma (non si vede deformato dalla scala)
const contentVariants: Variants = {
  hidden: { opacity: 0, filter: 'blur(4px)' },
  open: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.22, delay: 0.1, ease: [0.23, 1, 0.32, 1] },
  },
  exit: { opacity: 0, filter: 'blur(4px)', transition: { duration: 0.08 } },
}

// Punto da cui si gonfia la bolla: la base della freccia, sul bordo verso il trigger
function origin(pos: FloatingPosition | null) {
  if (!pos) return { originX: 0.5, originY: 0.5 }
  const along = pos.arrowOffset / (isVertical(pos.placement) ? pos.width : pos.height)
  switch (pos.placement) {
    case 'top':
      return { originX: along, originY: 1 }
    case 'bottom':
      return { originX: along, originY: 0 }
    case 'left':
      return { originX: 1, originY: along }
    case 'right':
      return { originX: 0, originY: along }
  }
}

/*
 * Bolla "liquida" con freccia, condivisa da Tooltip e Popover.
 * Freccia e bolla stanno in un filtro goo: mentre la bolla si gonfia dalla freccia,
 * le due forme si fondono in un collo liquido. Il filtro ridisegna l'originale sopra,
 * quindi testo e campi dei form restano nitidi.
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
  children,
}: FloatingBubbleProps) {
  const filterId = useId()
  // Sul server non c'è <body> né portal: la bolla esiste solo nel browser
  if (typeof document === 'undefined') return null

  const placement = position?.placement ?? 'top'
  const shown = position ? 'open' : 'hidden'

  return createPortal(
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && (
          <div
            key="floating"
            {...layerProps}
            className={`floating floating--${variant}`}
            data-placement={placement}
            style={
              {
                ...themeVars,
                ...style,
                transform: position ? `translate3d(${position.x}px, ${position.y}px, 0)` : undefined,
                // Il primo frame serve solo a misurare
                visibility: position ? undefined : 'hidden',
                filter: `url(#${CSS.escape(filterId)})`,
                '--floating-arrow': `${ARROW}px`,
                '--floating-arrow-offset': `${position?.arrowOffset ?? 0}px`,
              } as CSSProperties
            }
          >
            <GooFilter id={filterId} blur={variant === 'tooltip' ? 4 : 6} />

            <motion.div
              ref={floatingRef}
              {...(bubbleProps as object)}
              className="floating__bubble"
              style={origin(position)}
              custom={position}
              variants={bubbleVariants}
              initial="hidden"
              animate={shown}
              exit="exit"
            >
              <motion.div className="floating__content" variants={contentVariants}>
                {children}
              </motion.div>
            </motion.div>

            {/* Dopo la bolla: copre il suo bordo interno nel punto di attacco */}
            <motion.span
              className="floating__arrow"
              aria-hidden="true"
              style={{ x: '-50%', y: '-50%', rotate: 45 }}
              variants={arrowVariants}
              initial="hidden"
              animate={shown}
              exit="exit"
            />
          </div>
        )}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  )
}

export default FloatingBubble
