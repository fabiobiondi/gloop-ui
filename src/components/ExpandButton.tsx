import { useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, MotionConfig, motion, type Transition, type Variants } from 'motion/react'
import './theme.css'
import './ExpandButton.css'

type ExpandButtonProps = {
  icon?: ReactNode
  /** Nome accessibile; è anche il testo mostrato, se non è iconOnly */
  label: string
  /** Solo icona: il bottone non si allarga, la label resta per i lettori di schermo */
  iconOnly?: boolean
  /**
   * toggle (default): al clic si attiva, si colora e mostra la label.
   * action: label sempre visibile, il clic esegue onClick (es. pulsanti di un Dialog).
   */
  variant?: 'toggle' | 'action'
  /** toggle: colore da attivo (default #e11d48). action: colore di sfondo (default --ui-bg) */
  activeColor?: string
  onClick?: () => void
  autoFocus?: boolean
}

const morph: Transition = { type: 'spring', duration: 0.45, bounce: 0.3 }

// La label entra lettera per lettera
const labelVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.014, delayChildren: 0.05 } },
}

const charVariants: Variants = {
  hidden: { opacity: 0, y: 6, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.35, bounce: 0.3 },
  },
}

const PARTICLES = 8

/* Esplosione di particelle attorno all'icona, solo all'attivazione */
function Burst({ color }: { color: string }) {
  return (
    <span className="expand-button__burst" aria-hidden="true">
      {Array.from({ length: PARTICLES }, (_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2
        return (
          <motion.span
            key={i}
            className="expand-button__particle"
            style={{ background: color }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * 24,
              y: Math.sin(angle) * 24,
              scale: 0,
              opacity: 0,
            }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          />
        )
      })}
    </span>
  )
}

function ExpandButton({
  icon,
  label,
  iconOnly,
  variant = 'toggle',
  activeColor,
  onClick,
  autoFocus,
}: ExpandButtonProps) {
  const [open, setOpen] = useState(false)
  const isAction = variant === 'action'
  const color = activeColor ?? (isAction ? undefined : '#e11d48')
  // Azione: label sempre visibile, colorata se c'è activeColor. Toggle: solo da attivo.
  const showLabel = !iconOnly && (isAction || open)
  const filled = isAction ? !!color : open

  return (
    // reducedMotion="user": con prefers-reduced-motion niente movimento, solo dissolvenze
    <MotionConfig reducedMotion="user">
      <span className="expand-button-wrap">
        <motion.button
          layout
          type="button"
          className="expand-button"
          data-open={filled || undefined}
          data-icon-only={iconOnly || undefined}
          aria-label={label}
          aria-pressed={isAction ? undefined : open}
          autoFocus={autoFocus}
          onClick={() => {
            if (!isAction) setOpen((open) => !open)
            onClick?.()
          }}
          // border-radius nello style: Motion lo corregge durante la morph.
          // Il colore di sfondo passa da --ui-bg ad activeColor con una transition CSS.
          style={{ borderRadius: 999, '--expand-active': color } as CSSProperties}
          transition={{ layout: morph }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Icona: "pop" con un piccolo dondolio quando si attiva */}
          {icon && (
            <motion.span
              layout="position"
              className="expand-button__icon"
              aria-hidden="true"
              animate={
                open
                  ? { scale: [1, 1.35, 0.9, 1], rotate: [0, -12, 8, 0] }
                  : { scale: 1, rotate: 0 }
              }
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {icon}
            </motion.span>
          )}

          {/* In modalità action la label entra lettera per lettera anche alla comparsa */}
          <AnimatePresence mode="popLayout" initial={isAction}>
            {showLabel && (
              <motion.span
                layout="position"
                className="expand-button__label"
                aria-hidden="true"
                variants={labelVariants}
                initial="hidden"
                animate="visible"
                // Uscita rapida e tutta insieme: il bottone si richiude subito
                exit={{ opacity: 0, filter: 'blur(4px)', transition: { duration: 0.1 } }}
              >
                {[...label].map((char, i) => (
                  <motion.span key={i} className="expand-button__char" variants={charVariants}>
                    {char === ' ' ? ' ' : char}
                  </motion.span>
                ))}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {open && color && <Burst color={color} />}
      </span>
    </MotionConfig>
  )
}

export default ExpandButton
