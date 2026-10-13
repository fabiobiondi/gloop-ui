import type { ReactNode, Ref } from 'react'
import { cloneTrigger } from './trigger-props'

type TriggerProps = {
  /** Il figlio da usare come trigger */
  element: ReactNode
  triggerRef: Ref<HTMLElement>
  /** Nome del componente, per il messaggio d'errore */
  owner: string
  [prop: string]: unknown
}

/** Il trigger come componente: ref ed handler arrivano come props */
export function Trigger({ element, triggerRef, owner, ...props }: TriggerProps) {
  return cloneTrigger(element, triggerRef, props, owner)
}
