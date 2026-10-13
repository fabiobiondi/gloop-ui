import { Fragment, cloneElement, isValidElement, type ReactNode, type Ref, type SyntheticEvent } from 'react'

export type AnyProps = Record<string, unknown>

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value)
  else if (ref) ref.current = value
}

/*
 * Il trigger è il figlio stesso (un solo elemento che accetta ref): gli si aggiungono
 * ref, eventi e attributi ARIA. Gli handler dell'utente girano prima dei nostri e
 * possono fermarli con preventDefault().
 */
export function cloneTrigger(child: ReactNode, ref: Ref<HTMLElement>, props: AnyProps, owner: string) {
  if (!isValidElement(child) || child.type === Fragment) {
    throw new Error(`${owner}: children must be a single element that accepts a ref (e.g. a <button>)`)
  }
  const own = child.props as AnyProps
  const merged: AnyProps = { ...props }

  for (const [key, handler] of Object.entries(props)) {
    const theirs = own[key]
    // Le descrizioni si sommano a quelle del trigger
    if (key === 'aria-describedby') merged[key] = joinIds(theirs, handler)
    if (!/^on[A-Z]/.test(key) || typeof theirs !== 'function' || typeof handler !== 'function') continue
    merged[key] = (e: SyntheticEvent) => {
      theirs(e)
      if (!e.defaultPrevented) handler(e)
    }
  }

  // React 19: il ref è una prop come le altre
  const childRef = own.ref as Ref<HTMLElement> | undefined
  merged.ref = (node: HTMLElement | null) => {
    setRef(childRef, node)
    setRef(ref, node)
  }

  return cloneElement(child, merged)
}

/*
 * Tooltip e Popover possono essere a loro volta il figlio di un altro trigger
 * (es. <Tooltip><Popover><button/></Popover></Tooltip>): ref, eventi e ARIA che
 * ricevono dall'esterno passano al loro figlio, uniti a quelli che ha già.
 */
export function forwardTriggerProps(element: ReactNode, props: AnyProps, owner: string) {
  const { ref, ...rest } = props
  if (ref === undefined && Object.keys(rest).length === 0) return element
  return cloneTrigger(element, ref as Ref<HTMLElement>, rest, owner)
}

/** Unisce più liste di id per aria-describedby */
const joinIds = (...ids: unknown[]) => ids.filter((id) => typeof id === 'string' && id).join(' ') || undefined
