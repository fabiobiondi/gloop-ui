import { useState, type ReactNode } from 'react'
import { ExpandButton, FloatingBoundary, Input, Popover, Tooltip, usePopover, type FloatingAlign, type FloatingPlacement } from 'gloop-ui'
import { CheckIcon, CopyIcon, DotsVerticalIcon, ShareIcon, TrashIcon, UserIcon, XIcon } from './icons'
import './FloatingDemos.css'

// Trigger semplici: Tooltip e Popover clonano il figlio, che deve accettare un ref
export function DemoButton({ children, ...props }: { children: ReactNode; 'aria-label'?: string }) {
  return (
    <button type="button" className="fd-btn" {...props}>
      {children}
    </button>
  )
}

const placements: FloatingPlacement[] = ['top', 'right', 'bottom', 'left']

export function TooltipPlacements() {
  return (
    <div className="fd-row">
      {placements.map((p) => (
        <Tooltip key={p} content={`Placement: ${p}`} placement={p}>
          <DemoButton>{p}</DemoButton>
        </Tooltip>
      ))}
    </div>
  )
}

/* ---------- Popover ---------- */

// Un componente dentro il popover lo chiude con usePopover()
function SaveButton({ onSave }: { onSave: () => void }) {
  const { close } = usePopover()
  return (
    <ExpandButton
      variant="action"
      label="Save"
      icon={CheckIcon}
      activeColor="var(--ui-accent)"
      onClick={() => {
        onSave()
        close()
      }}
    />
  )
}

export function ProfilePopover() {
  const [name, setName] = useState('')
  const [draft, setDraft] = useState(name)

  return (
    <Popover
      label="Edit profile"
      onOpenChange={(open) => open && setDraft(name)}
      content={({ close }) => (
        <form
          className="fd-form"
          onSubmit={(e) => {
            e.preventDefault()
            setName(draft)
            close()
          }}
        >
          <Input label="Name" placeholder="Your name" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <Input label="Email" type="email" placeholder="ada@example.com" />
          <div className="fd-form__actions">
            <ExpandButton variant="action" label="Cancel" icon={XIcon} onClick={close} />
            <SaveButton onSave={() => setName(draft)} />
          </div>
        </form>
      )}
    >
      <DemoButton>
        {UserIcon}
        {name || 'Edit profile'}
      </DemoButton>
    </Popover>
  )
}

export function HoverCard() {
  return (
    <Popover
      closeOnLeave
      placement="top"
      label="Ada Lovelace"
      content={
        <div className="fd-card">
          <strong>Ada Lovelace</strong>
          <span>First programmer · London</span>
        </div>
      }
    >
      <DemoButton>@ada</DemoButton>
    </Popover>
  )
}

export function ControlledPopover() {
  const [open, setOpen] = useState(false)
  return (
    <div className="fd-row">
      <Popover open={open} onOpenChange={setOpen} placement="right" content={<p className="fd-text">Opened from outside.</p>}>
        <DemoButton>Popover</DemoButton>
      </Popover>
      <button type="button" className="fd-btn fd-btn--ghost" onClick={() => setOpen((o) => !o)}>
        {open ? 'Close it' : 'Open it'}
      </button>
    </div>
  )
}

const colors = ['#e11d48', '#f59e0b', '#16a34a', '#2563eb', '#7c3aed']

export function NestedPopover() {
  const [color, setColor] = useState(colors[3])
  return (
    <Popover
      label="Style"
      content={
        <div className="fd-form">
          <span className="fd-text">Nested popover and tooltips inside a popover:</span>
          <Popover
            label="Color"
            placement="right"
            content={({ close }) => (
              <div className="fd-swatches">
                {colors.map((c) => (
                  <Tooltip key={c} content={c} placement="bottom">
                    <button
                      type="button"
                      className="fd-swatch"
                      aria-label={c}
                      style={{ background: c }}
                      onClick={() => {
                        setColor(c)
                        close()
                      }}
                    />
                  </Tooltip>
                ))}
              </div>
            )}
          >
            <button type="button" className="fd-btn">
              <span className="fd-swatch fd-swatch--small" style={{ background: color }} /> Color
            </button>
          </Popover>
        </div>
      }
    >
      <DemoButton>Style</DemoButton>
    </Popover>
  )
}

/* ---------- Card menu: popover sotto i tre puntini, sopra se in basso non c'è spazio ---------- */

const cardActions = [
  { label: 'Share', icon: ShareIcon },
  { label: 'Copy link', icon: CopyIcon },
  { label: 'Delete', icon: TrashIcon, danger: true },
]

const cards = [
  { title: 'Weekly report', meta: 'Edited 2 hours ago' },
  { title: 'Design review', meta: 'Edited yesterday' },
  { title: 'Release notes', meta: 'Edited 3 days ago' },
]

function CardMenu({ title }: { title: string }) {
  return (
    <Popover
      label={`${title} actions`}
      placement="bottom"
      align="end"
      content={({ close }) => (
        <div className="fd-menu" role="menu">
          {cardActions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              className="fd-menu__item"
              data-danger={a.danger || undefined}
              onClick={close}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    >
      <button type="button" className="fd-card-menu__trigger" aria-label={`${title} actions`}>
        {DotsVerticalIcon}
      </button>
    </Popover>
  )
}

// Il riquadro tratteggiato fa da viewport: la card in fondo non ha spazio sotto e il menu si apre sopra
export function CardMenuPopover() {
  return (
    <FloatingBoundary className="fd-card-menu">
      {cards.map((c) => (
        <article key={c.title} className="fd-card-menu__card">
          <div className="fd-card">
            <strong>{c.title}</strong>
            <span>{c.meta}</span>
          </div>
          <CardMenu title={c.title} />
        </article>
      ))}
    </FloatingBoundary>
  )
}

/* ---------- Edge test: trigger negli angoli, sui bordi e al centro di un'area chiusa ---------- */

// FloatingBoundary fa da viewport: fuori dal riquadro non c'è spazio, le bolle girano e scorrono dentro
const spots = [
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
] as const
type Spot = (typeof spots)[number]

const aligns: FloatingAlign[] = ['start', 'center', 'end']

export function EdgeTest({ kind }: { kind: 'tooltip' | 'popover' }) {
  const [placement, setPlacement] = useState<FloatingPlacement>('auto')
  const [align, setAlign] = useState<FloatingAlign>('center')
  const [opened, setOpened] = useState<Partial<Record<Spot, boolean>>>({})

  const trigger = (spot: Spot) =>
    kind === 'tooltip' ? (
      <Tooltip content={`Tooltip at ${spot}, a bit longer to need some room`} placement={placement} align={align}>
        <DemoButton>{spot}</DemoButton>
      </Tooltip>
    ) : (
      <Popover
        label={spot}
        placement={placement}
        align={align}
        open={opened[spot] ?? false}
        onOpenChange={(open) => setOpened((o) => ({ ...o, [spot]: open }))}
        content={
          <div className="fd-card fd-card--wide">
            <strong>{spot}</strong>
            <span>
              placement {placement} · align {align}. A wide bubble that has to flip and shift to stay inside the
              viewport.
            </span>
          </div>
        }
      >
        <DemoButton>{spot}</DemoButton>
      </Popover>
    )

  return (
    <FloatingBoundary className="fd-edge">
      {spots.map((spot) => (
        <div key={spot} className="fd-edge__spot" data-spot={spot}>
          {trigger(spot)}
          {spot === 'top' && (
            <div className="fd-edge__controls">
              <div className="fd-row">
                {(['auto', ...placements] as FloatingPlacement[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="fd-btn fd-btn--ghost"
                    aria-pressed={placement === p}
                    onClick={() => setPlacement(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="fd-row">
                {aligns.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className="fd-btn fd-btn--ghost"
                    aria-pressed={align === a}
                    onClick={() => setAlign(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="fd-row">
                {kind === 'popover' && (
                  <button
                    type="button"
                    className="fd-btn fd-btn--ghost"
                    // Un clic fuori li chiude tutti: qui si apre soltanto
                    onClick={() => setOpened(Object.fromEntries(spots.map((s) => [s, true])))}
                  >
                    Open all
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </FloatingBoundary>
  )
}
