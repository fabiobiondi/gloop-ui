import { createContext, useContext } from 'react'

export type PopoverApi = {
  /** Chiude il popover e riporta il focus sul trigger */
  close: () => void
}

export const PopoverContext = createContext<PopoverApi | null>(null)

/** Per i componenti dentro un Popover: { close } chiude il popover più vicino */
export function usePopover(): PopoverApi {
  const api = useContext(PopoverContext)
  if (!api) throw new Error('usePopover must be used inside a <Popover>')
  return api
}
