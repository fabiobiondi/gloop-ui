import { createContext, type RefObject } from 'react'

/** Elemento che fa da viewport per le bolle (FloatingBoundary); null = il viewport */
export const BoundaryContext = createContext<RefObject<HTMLElement | null> | null>(null)
