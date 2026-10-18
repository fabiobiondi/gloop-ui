import { useLayoutEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Item, MenuRoot, Popover, ToolButton } from './menu'
import { AnimatedValue, ColorPicker, OptionList, PopLayout, StrokeLine, SwatchRow } from './controls'
import { setStagger, usePresence } from './menu-shared'
import {
  Caret,
  CopyIcon,
  CopyPlusIcon,
  CornerIcon,
  DropletIcon,
  GripIcon,
  LayersIcon,
  LinkIcon,
  MoreIcon,
  PencilIcon,
  RotateIcon,
  SquareIcon,
  TrashIcon,
} from '../shape-toolbar/icons'
import { GloopMotionProvider, pickMotionProps, type MotionProps } from '../motion-context'
import { useGloopMotion } from '../gloop-motion'
import '../theme.css'
import './ShapeEditor.css'

export type ShapeEditorProps = MotionProps

type Pattern = 'solid' | 'hatch' | 'cross' | 'dots' | 'lines'

const PATTERNS: { value: Pattern; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'hatch', label: 'Hatch' },
  { value: 'cross', label: 'Cross-hatch' },
  { value: 'dots', label: 'Dots' },
  { value: 'lines', label: 'Lines' },
]

const FONT_SIZES = [12, 14, 16, 20, 24, 32, 48, 64]
const STROKE_WIDTHS = [1, 2, 3, 4, 6, 8, 12]

/*
 * Le molle sono easing linear() in ShapeEditor.css, una per preset.
 *
 * Apertura della barra:
 * 1. la barra si "srotola" dal centro (clip-path) salendo verso l'alto
 * 2. i controlli sbocciano dal centro verso i lati (ritardi a cascata dal centro)
 * Chiusura: rapida, tutto insieme.
 */
function BarItem({ children }: { children: ReactNode }) {
  return <div className="st-item">{children}</div>
}

/* Maniglie di selezione, in ordine orario: compaiono a giro */
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const

function ShapeEditor(motionProps: ShapeEditorProps) {
  const m = useGloopMotion(motionProps)
  const [fill, setFill] = useState('#c7d2fe')
  const [pattern, setPattern] = useState<Pattern>('hatch')
  const [text, setText] = useState(true)
  const [fontSize, setFontSize] = useState(20)
  const [stroke, setStroke] = useState('#ffffff')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [round, setRound] = useState(true)
  const [opacity, setOpacity] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [selected, setSelected] = useState(false)

  // Al posto di AnimatePresence: restano montati finché l'uscita non finisce
  const bar = usePresence<HTMLDivElement>(selected)
  const hint = usePresence<HTMLParagraphElement>(!selected)
  const frame = usePresence<HTMLDivElement>(selected)
  const label = usePresence<HTMLSpanElement>(text)

  // I controlli sbocciano dal centro verso i lati: 60ms, poi 25ms per ogni passo dal centro
  useLayoutEffect(() => {
    const el = bar.ref.current
    if (!el || !selected) return
    const items = [...el.querySelectorAll<HTMLElement>(':scope > .st-bar > .st-item')]
    setStagger(items, (i, n) => 60 + Math.abs(i - (n - 1) / 2) * 25)
  }, [bar.ref, selected])

  return (
    // Click sul canvas vuoto: deseleziona
    <GloopMotionProvider {...pickMotionProps(motionProps)}>
      <div {...m.rootProps} className="st-canvas" onClick={() => setSelected(false)}>
        <div className="st-bar-slot" onClick={(e) => e.stopPropagation()}>
          {bar.mounted && (
            <div ref={bar.ref} className="st-bar-reveal" data-closing={bar.closing || undefined}>
                <MenuRoot className="st-bar">
                  <BarItem>
                    <span className="st-deco" aria-hidden="true">
                      <GripIcon />
                    </span>
                  </BarItem>
                  <BarItem>
                    <span className="st-deco" aria-hidden="true">
                      <SquareIcon />
                    </span>
                  </BarItem>
                  <BarItem>
                    <Popover
                      id="fill"
                      label="Fill color"
                      align="start"
                      trigger={
                        <span
                          className="st-swatch"
                          data-none={fill === 'transparent' || undefined}
                          style={{ background: fill === 'transparent' ? undefined : fill }}
                        />
                      }
                    >
                      <ColorPicker value={fill} onChange={setFill} />
                    </Popover>
                  </BarItem>
                  <BarItem>
                    <Popover
                      id="pattern"
                      label="Fill pattern"
                      placement="top"
                      trigger={<span className={`st-pattern st-fill--${pattern}`} />}
                    >
                      <SwatchRow
                        value={pattern}
                        onChange={setPattern}
                        options={PATTERNS.map((p) => ({
                          ...p,
                          render: <span className={`st-pattern st-fill--${p.value}`} />,
                        }))}
                      />
                    </Popover>
                  </BarItem>
                  <BarItem>
                    <ToolButton
                      aria-label="Show text"
                      aria-pressed={text}
                      className="st-btn--toggle"
                      onClick={() => setText((t) => !t)}
                    >
                      <span className="st-t">T</span>
                    </ToolButton>
                  </BarItem>
                  <BarItem>
                    <Popover
                      id="font-size"
                      label="Font size"
                      align="start"
                      wide
                      trigger={
                        <>
                          <span>
                            <AnimatedValue value={fontSize} />
                            px
                          </span>
                          <Caret />
                        </>
                      }
                    >
                      <OptionList options={FONT_SIZES} value={fontSize} onChange={setFontSize} />
                    </Popover>
                  </BarItem>
                  <BarItem>
                    <Popover
                      id="stroke"
                      label="Stroke"
                      placement="top"
                      wide
                      trigger={<StrokeLine width={strokeWidth} />}
                    >
                      {/* Popover dentro un popover: colore e spessore si aprono a loro volta */}
                      <div className="st-stroke-panel">
                        <Item>
                          <span className="st-label">Stroke:</span>
                        </Item>
                        <Item>
                          <Popover
                            id="stroke-color"
                            label="Stroke color"
                            align="start"
                            trigger={<span className="st-swatch" style={{ background: stroke }} />}
                          >
                            <ColorPicker value={stroke} onChange={setStroke} allowNone={false} />
                          </Popover>
                        </Item>
                        <Item>
                          <ToolButton
                            aria-label={round ? 'Rounded corners' : 'Sharp corners'}
                            onClick={() => setRound((r) => !r)}
                          >
                            <PopLayout value={String(round)} className="st-swap">
                              {(r) => <CornerIcon round={r === 'true'} />}
                            </PopLayout>
                          </ToolButton>
                        </Item>
                        <Item>
                          <Popover
                            id="stroke-width"
                            label="Stroke width"
                            align="start"
                            wide
                            trigger={
                              <>
                                <StrokeLine width={strokeWidth} />
                                <AnimatedValue value={strokeWidth} />
                                <Caret />
                              </>
                            }
                          >
                            <OptionList
                              options={STROKE_WIDTHS}
                              value={strokeWidth}
                              onChange={setStrokeWidth}
                              render={(w) => (
                                <>
                                  <StrokeLine width={w} />
                                  {w}
                                </>
                              )}
                            />
                          </Popover>
                        </Item>
                      </div>
                    </Popover>
                  </BarItem>
                  <BarItem>
                    <span className="st-sep" />
                  </BarItem>
                  <BarItem>
                    <ToolButton aria-label="Link">
                      <LinkIcon />
                    </ToolButton>
                  </BarItem>
                  <BarItem>
                    <ToolButton aria-label="Edit">
                      <PencilIcon />
                    </ToolButton>
                  </BarItem>
                  <BarItem>
                    <Popover id="more" label="More actions" align="end" trigger={<MoreIcon />}>
                      <div className="st-row">
                        <Item>
                          <ToolButton aria-label="Duplicate">
                            <CopyIcon />
                          </ToolButton>
                        </Item>
                        <Item>
                          <ToolButton aria-label="Copy">
                            <CopyPlusIcon />
                          </ToolButton>
                        </Item>
                        <Item>
                          <ToolButton aria-label="Delete">
                            <TrashIcon />
                          </ToolButton>
                        </Item>
                        <span className="st-sep" />
                        <Item>
                          <ToolButton aria-label="Rotate 90°" onClick={() => setRotation((r) => r + 90)}>
                            <RotateIcon />
                          </ToolButton>
                        </Item>
                        <Item>
                          <Popover id="opacity" label="Opacity" align="start" trigger={<DropletIcon />}>
                            <div className="st-opacity">
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={opacity}
                                aria-label="Opacity"
                                onChange={(e) => setOpacity(Number(e.target.value))}
                              />
                              <span className="st-opacity__value">{opacity}%</span>
                            </div>
                          </Popover>
                        </Item>
                        <Item>
                          <ToolButton aria-label="Layers">
                            <LayersIcon />
                          </ToolButton>
                        </Item>
                      </div>
                    </Popover>
                  </BarItem>
                </MenuRoot>
            </div>
          )}
          {hint.mounted && (
            <p ref={hint.ref} className="st-hint" data-closing={hint.closing || undefined}>
              Click the rectangle
            </p>
          )}
        </div>

        {/* Anteprima: la forma riflette i controlli */}
        <div className="st-stage" style={{ '--c': fill } as CSSProperties}>
          {/* Rotazione, opacità e raggio seguono la stessa molla (transizioni CSS) */}
          <div className="st-shape-wrap" style={{ rotate: `${rotation}deg` }}>
            <div
              role="button"
              tabIndex={0}
              aria-label="Rectangle"
              aria-pressed={selected}
              className={`st-shape st-fill--${pattern}`}
              style={{
                borderColor: stroke,
                borderWidth: strokeWidth,
                opacity: opacity / 100,
                borderRadius: round ? 28 : 4,
              }}
              onClick={(e) => {
                e.stopPropagation()
                setSelected(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelected(true)
                }
                if (e.key === 'Escape') setSelected(false)
              }}
            >
              {label.mounted && (
                <span
                  ref={label.ref}
                  className="st-shape__text"
                  data-closing={label.closing || undefined}
                  style={{ fontSize, color: stroke }}
                >
                  Text
                </span>
              )}
            </div>

            {frame.mounted && (
              // Le maniglie compaiono a giro, 25ms l'una dopo l'altra (--st-i)
              <div ref={frame.ref} className="st-frame" aria-hidden="true" data-closing={frame.closing || undefined}>
                {HANDLES.map((h, i) => (
                  <span key={h} className={`st-handle st-handle--${h}`} style={{ '--st-i': i } as CSSProperties} />
                ))}
                <span className="st-handle st-handle--rotate" style={{ '--st-i': HANDLES.length } as CSSProperties} />
              </div>
            )}
          </div>
        </div>
      </div>
    </GloopMotionProvider>
  )
}

export default ShapeEditor
