import { useRef, type HTMLAttributes } from 'react'
import { BoundaryContext } from './floating/boundary-context'

export type FloatingBoundaryProps = HTMLAttributes<HTMLDivElement>

/*
 * Un <div> che fa da viewport per i Tooltip e i Popover al suo interno:
 * flip e shift tengono le bolle dentro i suoi bordi (e comunque dentro il viewport).
 * Utile per pannelli, dialog, aree scrollabili o anteprime.
 */
function FloatingBoundary(props: FloatingBoundaryProps) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <BoundaryContext.Provider value={ref}>
      <div ref={ref} {...props} />
    </BoundaryContext.Provider>
  )
}

export default FloatingBoundary
