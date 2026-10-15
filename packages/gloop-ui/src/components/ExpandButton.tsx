import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion, type Transition, type Variants } from 'motion/react'
import { GooFilter } from './goo'
import { MotionScope, useGloopMotion, type MotionProps } from './motion'
import './theme.css'
import './ExpandButton.css'

export type ExpandButtonProps = {
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
  /**
   * Gocce che colano dal fondo del bottone, fuse con il filtro goo.
   * true: di continuo. 'hover': solo al passaggio del mouse; all'uscita ogni goccia finisce la sua caduta.
   */
  drip?: boolean | 'hover'
  onClick?: () => void
  autoFocus?: boolean
} & MotionProps

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

type Drop = { left: number; size: number; delay: number; duration: number }

// Gocce che colano: posizione orizzontale (% della larghezza), diametro, ritardo e durata in s
const DROPS: Drop[] = [
  { left: 30, size: 10, delay: 0, duration: 2.6 },
  { left: 64, size: 13, delay: 1, duration: 3 },
  { left: 47, size: 8, delay: 1.9, duration: 2.3 },
]

// Al rollover: un blob grande al centro parte subito, due più piccoli lo seguono
const HOVER_DROPS: Drop[] = [
  { left: 50, size: 15, delay: 0, duration: 1.9 },
  { left: 28, size: 9, delay: 0.3, duration: 1.6 },
  { left: 70, size: 10, delay: 0.6, duration: 1.8 },
]

/*
 * Una goccia: nasce dentro il bordo inferiore del bottone e cade, il goo la fonde col bottone.
 * Quando active diventa false non si interrompe: si ferma alla fine del ciclo, di nuovo
 * nascosta sotto il bottone, così non sparisce a metà caduta.
 */
function DripDrop({ drop, active }: { drop: Drop; active: boolean }) {
  const [running, setRunning] = useState(active)
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    if (active) setRunning(true)
  }, [active])

  return (
    <span
      className="expand-button__drop"
      aria-hidden="true"
      data-running={running || undefined}
      onAnimationIteration={() => !activeRef.current && setRunning(false)}
      style={
        {
          left: `${drop.left}%`,
          '--drop-size': `${drop.size}px`,
          animationDelay: `calc(${drop.delay}s / var(--ui-motion-speed, 1))`,
          animationDuration: `calc(${drop.duration}s / var(--ui-motion-speed, 1))`,
        } as CSSProperties
      }
    />
  )
}

function Drips({ hover, active }: { hover: boolean; active: boolean }) {
  return (hover ? HOVER_DROPS : DROPS).map((drop, i) => <DripDrop key={i} drop={drop} active={active} />)
}

/* Esplosione di particelle attorno all'icona, solo all'attivazione */
function Burst({ color }: { color: string }) {
  const m = useGloopMotion()
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
            transition={m.t({ duration: 0.5, ease: [0.23, 1, 0.32, 1] })}
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
  drip,
  onClick,
  autoFocus,
  ...motionProps
}: ExpandButtonProps) {
  const m = useGloopMotion(motionProps)
  // Riduzione del movimento: niente gocce
  const dripping = m.reduced ? false : drip
  const [open, setOpen] = useState(false)
  const filterId = useId()
  const [hovered, setHovered] = useState(false)
  const isAction = variant === 'action'
  const color = activeColor ?? (isAction ? undefined : '#e11d48')
  // Azione: label sempre visibile, colorata se c'è activeColor. Toggle: solo da attivo.
  const showLabel = !iconOnly && (isAction || open)
  const filled = isAction ? !!color : open
  // Colore della superficie: activeColor da pieno, --ui-bg altrimenti. Lo usano bottone e gocce
  const surface = filled && color ? color : 'var(--ui-bg)'

  return (
    // Movimento ridotto: niente spostamenti, solo dissolvenze
    <MotionScope m={m} props={motionProps}>
      <span
        {...m.rootProps}
        className="expand-button-wrap"
        data-filled={filled || undefined}
        style={{ ...m.rootProps.style, '--expand-surface': surface } as CSSProperties}
        // Solo mouse e penna: al tocco l'hover resterebbe "appeso"
        onPointerEnter={(e) => e.pointerType !== 'touch' && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {/* Con drip, bottone e gocce passano insieme dal filtro goo; il burst resta fuori */}
        <span
          className="expand-button__goo"
          style={
            dripping
              ? { filter: `url(#${CSS.escape(filterId)})` }
              : undefined
          }
        >
          {dripping && <GooFilter id={filterId} blur={5} shadow={false} color="var(--expand-fill)" />}
          {dripping && <Drips hover={dripping === 'hover'} active={dripping !== 'hover' || hovered} />}
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
            // Il colore di sfondo (--expand-fill, vedi CSS) cambia con una transition CSS.
            style={{ borderRadius: 999 }}
            transition={m.t({ layout: morph })}
            whileHover={{ scale: 1.02, transition: m.t({ type: 'spring', duration: 0.6, bounce: 0.15 }) }}
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
                transition={m.t({ duration: 0.5, ease: 'easeOut' })}
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
                  variants={m.v(labelVariants)}
                  initial="hidden"
                  animate="visible"
                  // Uscita rapida e tutta insieme: il bottone si richiude subito
                  exit={{ opacity: 0, filter: 'blur(4px)', transition: m.t({ duration: 0.1 }) }}
                >
                  {[...label].map((char, i) => (
                    <motion.span key={i} className="expand-button__char" variants={m.v(charVariants)}>
                      {char === ' ' ? ' ' : char}
                    </motion.span>
                  ))}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </span>

        {open && color && <Burst color={color} />}
      </span>
    </MotionScope>
  )
}

export default ExpandButton
