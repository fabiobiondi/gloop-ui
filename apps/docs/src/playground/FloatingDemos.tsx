import { useState, type ReactNode } from 'react'
import { Popover, Tooltip, usePopover, type FloatingPlacement } from 'gloop-ui'
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
    <button
      type="submit"
      className="fd-btn fd-btn--primary"
      onClick={(e) => {
        e.preventDefault()
        onSave()
        close()
      }}
    >
      Save
    </button>
  )
}

export function ProfilePopover() {
  const [name, setName] = useState('Ada Lovelace')
  const [draft, setDraft] = useState(name)

  return (
    <Popover
      label="Edit profile"
      onOpenChange={(open) => open && setDraft(name)}
      content={({ close }) => (
        <form className="fd-form">
          <label>
            Name
            <input value={draft} onChange={(e) => setDraft(e.target.value)} />
          </label>
          <label>
            Role
            <select defaultValue="admin">
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
          <div className="fd-form__actions">
            <button type="button" className="fd-btn" onClick={close}>
              Cancel
            </button>
            <SaveButton onSave={() => setName(draft)} />
          </div>
        </form>
      )}
    >
      <DemoButton>{name}</DemoButton>
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
