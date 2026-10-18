// API pubblica di gloop-ui: tutto ciò che non è esportato qui resta interno
export { default as CircleMenu } from './components/CircleMenu'
export type {
  CircleMenuProps,
  CircleMenuItem,
  CircleMenuDirection,
  CircleMenuTooltip,
  CircleMenuPanel,
  CircleMenuPanelApi,
  CircleMenuPanelContent,
} from './components/CircleMenu'

export { default as Dialog } from './components/Dialog'
export type { DialogProps, DialogAction } from './components/Dialog'

export { default as Modal } from './components/Modal'
export type { ModalProps, ModalAction, ModalSize, ModalEnter } from './components/Modal'
export { default as ModalProvider } from './components/ModalProvider'
export type { ModalProviderProps } from './components/ModalProvider'
export { useModal } from './components/modal-context'
export type { ModalApi, ModalHandle, ModalOptions } from './components/modal-context'

export { default as ExpandButton } from './components/ExpandButton'
export type { ExpandButtonProps } from './components/ExpandButton'

export { default as GloopLoading } from './components/GloopLoading'
export type { GloopLoadingProps } from './components/GloopLoading'

export { default as GooPill } from './components/GooPill'
export type { GooPillProps } from './components/GooPill'

export { default as ProgressBar } from './components/ProgressBar'
export type { ProgressBarProps } from './components/ProgressBar'

export { GooFilter } from './components/goo'
export type { GooFilterProps } from './components/goo'

export { default as Search } from './components/Search'
export type { SearchProps } from './components/Search'

export { default as Input } from './components/Input'
export type { InputProps } from './components/Input'

export { default as List } from './components/List'
export type { ListProps, ListItem, ListEntry, ListGroup, ListDivider } from './components/List'

export { default as Slider } from './components/Slider'
export type { SliderProps, SliderMark } from './components/Slider'

export { default as Popover } from './components/Popover'
export type { PopoverProps } from './components/Popover'
export { usePopover } from './components/floating/popover-context'
export type { PopoverApi } from './components/floating/popover-context'

export { default as TabBar } from './components/TabBar'
export type { TabBarProps, TabBarEnter, Tab as TabBarTab } from './components/TabBar'

export { default as TabPop } from './components/TabPop'
export type { TabPopProps, TabPopAnimation, Tab as TabPopTab } from './components/TabPop'
export type { TabPopDirection } from './components/tab-drop'
export type { TabPopPlacement } from './components/tab-placement'

export { default as TabFab } from './components/TabFab'
export type {
  TabFabProps,
  Tab as TabFabTab,
  SubmenuItem as TabFabItem,
} from './components/TabFab'

export { default as ShapeEditor } from './components/shape-toolbar/ShapeEditor'
export type { ShapeEditorProps } from './components/shape-toolbar/ShapeEditor'

export { default as Toast } from './components/Toast'
export type { ToastProps, ToastPosition, ToastVariant } from './components/Toast'

export { default as Tooltip } from './components/Tooltip'
export type { TooltipProps } from './components/Tooltip'

export { default as FloatingBoundary } from './components/FloatingBoundary'
export type { FloatingBoundaryProps } from './components/FloatingBoundary'

export type { FloatingPlacement, FloatingSide, FloatingAlign } from './components/floating/position'

export { GloopMotionProvider } from './components/motion-context'
export { useGloopMotion } from './components/gloop-motion'
export type { GloopMotion } from './components/gloop-motion'
export type {
  GloopMotionProviderProps,
  GloopMotionPreset,
  GloopReducedMotion,
  MotionProps,
  MotionState,
} from './components/motion-context'
