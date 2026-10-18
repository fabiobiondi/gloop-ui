import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { GooFilter, useOffscreen } from './goo'
import { GloopMotionProvider, pickMotionProps, type MotionProps } from './motion-context'
import { useGloopMotion } from './gloop-motion'
import { usePresence } from './jelly'
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

/*
 * Animato in CSS (ExpandButton.css): molle campionate in easing linear(), una per preset.
 * La morph della larghezza (al posto del layout di Motion) è una piccola FLIP con WAAPI:
 * legge la stessa molla dal CSS (--expand-morph).
 */

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
  return (
    <span className="expand-button__burst" aria-hidden="true">
      {Array.from({ length: PARTICLES }, (_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2
        return (
          <span
            key={i}
            className="expand-button__particle"
            style={
              {
                background: color,
                '--particle-x': `${Math.cos(angle) * 24}px`,
                '--particle-y': `${Math.sin(angle) * 24}px`,
              } as CSSProperties
            }
          />
        )
      })}
    </span>
  )
}

/*
 * La label: entra lettera per lettera; in uscita resta montata finché non è svanita,
 * fuori dal flusso (come popLayout), così il bottone si richiude subito.
 * left: dove stava la label, misurato finché era visibile.
 */
function Label({ label, shown, instant, left }: { label: string; shown: boolean; instant: boolean; left: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const { mounted, closing } = usePresence(shown, instant, ref)
  if (!mounted) return null
  return (
    <span
      ref={ref}
      className="expand-button__label"
      aria-hidden="true"
      data-state={closing ? 'closing' : undefined}
      style={closing ? { left } : undefined}
    >
      {[...label].map((char, i) => (
        <span key={i} className="expand-button__char" style={{ '--i': i } as CSSProperties}>
          {char === ' ' ? '\u00a0' : char}
        </span>
      ))}
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

  /*
   * Morph della larghezza quando la label entra o esce: dopo il commit si confronta la
   * larghezza nuova con la precedente (o con quella a metà animazione, se ce n'è una in corso)
   * e si anima width con la molla del CSS. Movimento ridotto o spento: cambio istantaneo.
   */
  const buttonRef = useRef<HTMLButtonElement>(null)
  const wrapRef = useRef<HTMLSpanElement>(null)
  // Le gocce colano all'infinito: fuori dallo schermo si fermano
  const offscreen = useOffscreen(wrapRef, !!dripping)
  const width = useRef<number | null>(null)
  const morph = useRef<Animation | null>(null)
  // Posizione della label finché è visibile: in uscita esce dal flusso restando lì
  const labelLeft = useRef(0)
  useLayoutEffect(() => {
    const btn = buttonRef.current
    if (!btn) return
    const from = morph.current ? btn.offsetWidth : width.current
    morph.current?.cancel()
    morph.current = null
    const to = btn.offsetWidth
    width.current = to
    const label = btn.querySelector<HTMLElement>('.expand-button__label:not([data-state])')
    if (label) labelLeft.current = label.offsetLeft
    if (from === null || Math.abs(from - to) < 0.5 || m.reduced || !btn.animate) return
    const css = getComputedStyle(btn)
    const ms = parseFloat(css.getPropertyValue('--expand-morph-ms')) || 416
    const anim = btn.animate([{ width: `${from}px` }, { width: `${to}px` }], {
      duration: ms / m.speed,
      easing: css.getPropertyValue('--expand-morph').trim() || 'ease-out',
    })
    morph.current = anim
    anim.onfinish = () => {
      if (morph.current === anim) morph.current = null
    }
  }, [showLabel, label, iconOnly, !!icon, m.reduced, m.speed])

  return (
    // Movimento ridotto: niente spostamenti, solo dissolvenze
    <GloopMotionProvider {...pickMotionProps(motionProps)}>
      <span
        {...m.rootProps}
        ref={wrapRef}
        className="expand-button-wrap"
        data-filled={filled || undefined}
        data-offscreen={offscreen || undefined}
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
          <button
            ref={buttonRef}
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
            // Il colore di sfondo (--expand-fill, vedi CSS) cambia con una transition CSS
            style={{ borderRadius: 999 }}
          >
            {/* Icona: "pop" con un piccolo dondolio quando si attiva (keyframe nel CSS) */}
            {icon && (
              <span className="expand-button__icon" aria-hidden="true">
                {icon}
              </span>
            )}

            {/* In modalità action la label entra lettera per lettera anche alla comparsa */}
            <Label label={label} shown={showLabel} instant={m.state === 'off'} left={labelLeft.current} />
          </button>
        </span>

        {open && color && <Burst color={color} />}
      </span>
    </GloopMotionProvider>
  )
}

export default ExpandButton
