import { useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion, stagger, type Variants } from 'motion/react'
import { Item, MenuRoot, Popover, ToolButton } from './menu'
import { AnimatedValue, ColorPicker, OptionList, StrokeLine, SwatchRow } from './controls'
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
} from './icons'
import { MotionScope, useGloopMotion, type MotionProps } from '../motion'
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

const shapeSpring = { type: 'spring', duration: 0.5, bounce: 0.25 } as const

/*
 * Apertura della barra:
 * 1. la barra si "srotola" dal centro (clip-path) salendo verso l'alto
 * 2. i controlli sbocciano dal centro verso i lati (stagger from: 'center')
 * Chiusura: rapida, tutto insieme.
 */
const barVariants: Variants = {
  hidden: {
    clipPath: 'inset(0% 50% 0% 50% round 12px)',
    y: 16,
    opacity: 0,
  },
  visible: {
    clipPath: 'inset(0% 0% 0% 0% round 12px)',
    y: 0,
    opacity: 1,
    transition: {
      clipPath: { type: 'spring', duration: 0.6, bounce: 0.15 },
      y: { type: 'spring', duration: 0.5, bounce: 0.3 },
      opacity: { duration: 0.15 },
      delayChildren: stagger(0.025, { from: 'center', startDelay: 0.06 }),
    },
    // A fine apertura il clip va tolto, altrimenti taglierebbe i popover
    transitionEnd: { clipPath: 'none' },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.96,
    filter: 'blur(4px)',
    transition: { duration: 0.15, ease: 'easeOut' },
  },
}

const barItemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.45, bounce: 0.35 },
  },
}

function BarItem({ children }: { children: ReactNode }) {
  const m = useGloopMotion()
  return (
    <motion.div className="st-item" variants={m.v(barItemVariants)}>
      {children}
    </motion.div>
  )
}

/* Maniglie di selezione, in ordine orario: compaiono a giro */
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const

const frameVariants: Variants = {
  hidden: { opacity: 0, scale: 1.06 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      duration: 0.4,
      bounce: 0.2,
      delayChildren: stagger(0.025),
    },
  },
  exit: { opacity: 0, scale: 1.03, transition: { duration: 0.12, ease: 'easeOut' } },
}

const handleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', duration: 0.4, bounce: 0.5 },
  },
}

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

  return (
    // Click sul canvas vuoto: deseleziona
    <MotionScope m={m} props={motionProps}>
      <div {...m.rootProps} className="st-canvas" onClick={() => setSelected(false)}>
        <div className="st-bar-slot" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence>
            {selected ? (
              <motion.div
                key="bar"
                className="st-bar-reveal"
                variants={m.v(barVariants)}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
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
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.span
                                key={String(round)}
                                className="st-swap"
                                initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.6, transition: m.t({ duration: 0.1 }) }}
                              >
                                <CornerIcon round={round} />
                              </motion.span>
                            </AnimatePresence>
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
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                className="st-hint"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: m.t({ delay: 0.15 }) }}
                exit={{ opacity: 0, y: -6, transition: m.t({ duration: 0.1 }) }}
              >
                Click the rectangle
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Anteprima: la forma riflette i controlli */}
        <div className="st-stage" style={{ '--c': fill } as CSSProperties}>
          <motion.div
            className="st-shape-wrap"
            animate={{ rotate: rotation }}
            transition={m.t(shapeSpring)}
          >
            <motion.div
              role="button"
              tabIndex={0}
              aria-label="Rectangle"
              aria-pressed={selected}
              className={`st-shape st-fill--${pattern}`}
              style={{ borderColor: stroke, borderWidth: strokeWidth }}
              animate={{ opacity: opacity / 100, borderRadius: round ? 28 : 4 }}
              transition={m.t(shapeSpring)}
              whileTap={{ scale: 0.98 }}
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
              <AnimatePresence>
                {text && (
                  <motion.span
                    className="st-shape__text"
                    style={{ fontSize, color: stroke }}
                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      filter: 'blur(4px)',
                      transition: m.t({ duration: 0.12 }),
                    }}
                  >
                    Text
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {selected && (
                <motion.div
                  className="st-frame"
                  aria-hidden="true"
                  variants={m.v(frameVariants)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {HANDLES.map((h) => (
                    <motion.span
                      key={h}
                      className={`st-handle st-handle--${h}`}
                      variants={m.v(handleVariants)}
                    />
                  ))}
                  <motion.span className="st-handle st-handle--rotate" variants={m.v(handleVariants)} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </MotionScope>
  )
}

export default ShapeEditor
