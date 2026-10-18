// Variante senza motion/react: stesse esportazioni di ../index.ts, componenti animati solo in CSS.
// Copie temporanee per confrontarle nella doc (?engine=css); poi sostituiranno quelle in components/.
export { default as CircleMenu } from './CircleMenu'
export type {
  CircleMenuProps,
  CircleMenuItem,
  CircleMenuDirection,
  CircleMenuTooltip,
  CircleMenuPanel,
  CircleMenuPanelApi,
  CircleMenuPanelContent,
} from './CircleMenu'

export { default as Dialog } from './Dialog'
export type { DialogProps, DialogAction } from './Dialog'

export { default as Modal } from './Modal'
export type { ModalProps, ModalAction, ModalSize, ModalEnter } from './Modal'
export { default as ModalProvider } from './ModalProvider'
export type { ModalProviderProps } from './ModalProvider'
export { useModal } from './modal-context'
export type { ModalApi, ModalHandle, ModalOptions } from './modal-context'

export { default as ExpandButton } from './ExpandButton'
export type { ExpandButtonProps } from './ExpandButton'

export { default as GloopLoading } from './GloopLoading'
export type { GloopLoadingProps } from './GloopLoading'

export { default as GooPill } from './GooPill'
export type { GooPillProps } from './GooPill'

export { default as ProgressBar } from './ProgressBar'
export type { ProgressBarProps } from './ProgressBar'

export { GooFilter } from '../components/goo'
export type { GooFilterProps } from '../components/goo'

export { default as Search } from './Search'
export type { SearchProps } from './Search'

export { default as Input } from './Input'
export type { InputProps } from './Input'

export { default as List } from './List'
export type { ListProps, ListItem, ListEntry, ListGroup, ListDivider } from './List'

export { default as Slider } from './Slider'
export type { SliderProps, SliderMark } from './Slider'

export { default as Popover } from './Popover'
export type { PopoverProps } from './Popover'
export { usePopover } from '../components/floating/popover-context'
export type { PopoverApi } from '../components/floating/popover-context'

export { default as TabBar } from './TabBar'
export type { TabBarProps, TabBarEnter, Tab as TabBarTab } from './TabBar'

export { default as TabPop } from './TabPop'
export type { TabPopProps, TabPopAnimation, Tab as TabPopTab } from './TabPop'
export type { TabPopDirection } from '../components/tab-drop'
export type { TabPopPlacement } from '../components/tab-placement'

export { default as TabFab } from './TabFab'
export type {
  TabFabProps,
  Tab as TabFabTab,
  SubmenuItem as TabFabItem,
} from './TabFab'

export { default as ShapeEditor } from './shape-toolbar/ShapeEditor'
export type { ShapeEditorProps } from './shape-toolbar/ShapeEditor'

export { default as Toast } from './Toast'
export type { ToastProps, ToastPosition, ToastVariant } from './Toast'

export { default as Tooltip } from './Tooltip'
export type { TooltipProps } from './Tooltip'

export { default as FloatingBoundary } from '../components/FloatingBoundary'
export type { FloatingBoundaryProps } from '../components/FloatingBoundary'

export type { FloatingPlacement, FloatingSide, FloatingAlign } from '../components/floating/position'

// useGloopMotion e tuneTransition sono specifici di motion/react: qui c'è useCssMotion
export { GloopMotionProvider } from '../components/motion-context'
export { useCssMotion } from '../components/css-motion'
export type { CssMotion } from '../components/css-motion'
export type {
  GloopMotionProviderProps,
  GloopMotionPreset,
  GloopReducedMotion,
  MotionProps,
  MotionState,
} from '../components/motion-context'
