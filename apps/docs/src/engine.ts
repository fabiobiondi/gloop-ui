import type * as Lib from 'gloop-ui'

/*
 * Solo in dev: "gloop-ui" punta qui (vedi vite.config.ts) e sceglie, a ogni caricamento,
 * i componenti con Motion (default) o le copie animate solo in CSS (?engine=css).
 * Se ne carica uno solo: i due hanno gli stessi nomi di classe e il loro CSS si scontrerebbe.
 */
export type Engine = 'motion' | 'css'

export const engine: Engine = new URLSearchParams(location.search).get('engine') === 'css' ? 'css' : 'motion'

const lib = (engine === 'css' ? await import('gloop-ui-css') : await import('gloop-ui-motion')) as typeof Lib

export const {
  CircleMenu,
  Dialog,
  Modal,
  ModalProvider,
  useModal,
  ExpandButton,
  GloopLoading,
  GooPill,
  ProgressBar,
  GooFilter,
  Search,
  Input,
  List,
  Slider,
  Popover,
  usePopover,
  TabBar,
  TabPop,
  TabFab,
  ShapeEditor,
  Toast,
  Tooltip,
  FloatingBoundary,
  GloopMotionProvider,
  // Solo nella versione Motion: con ?engine=css sono undefined
  useGloopMotion,
  tuneTransition,
} = lib
