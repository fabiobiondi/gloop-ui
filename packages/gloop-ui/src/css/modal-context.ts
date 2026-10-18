import { createContext, useContext, type ReactNode } from 'react'
import type { ModalProps } from './Modal'

/** Un modal aperto da useModal().open() */
export type ModalHandle<T = unknown> = {
  /** Chiude il modal; result risolve handle.result */
  close: (result?: T) => void
  /** Cambia le opzioni del modal aperto (si fondono con quelle attuali) */
  update: (options: Partial<ModalOptions<T>>) => void
  /**
   * Si risolve alla chiusura: con il value del pulsante premuto o il valore passato
   * a close(); undefined con la X, Escape o il clic sullo sfondo
   */
  result: Promise<T | undefined>
}

export type ModalOptions<T = unknown> = Omit<ModalProps, 'open' | 'onClose' | 'children' | 'footer'> & {
  /** Contenuto; come funzione riceve l'handle, ad esempio per chiudere il modal da un form */
  content?: ReactNode | ((modal: ModalHandle<T>) => ReactNode)
  /** JSX libero nel footer; come funzione riceve l'handle */
  footer?: ReactNode | ((modal: ModalHandle<T>) => ReactNode)
  /** Chiamata alla chiusura, con lo stesso valore di handle.result */
  onClose?: (result: T | undefined) => void
}

export type ModalApi = {
  /** Apre un modal e restituisce il suo handle */
  open: <T = unknown>(options: ModalOptions<T>) => ModalHandle<T>
  /** Chiude tutti i modal aperti da questo provider */
  closeAll: () => void
}

export const ModalContext = createContext<ModalApi | null>(null)

/** Apre modal da codice. Va usato dentro un <ModalProvider> */
export function useModal(): ModalApi {
  const api = useContext(ModalContext)
  if (!api) throw new Error('useModal() must be used inside a <ModalProvider>')
  return api
}
