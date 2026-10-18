import { createContext, useMemo, useContext, type ReactNode } from 'react'

/*
 * Configurazione globale delle animazioni. Un GloopMotionProvider imposta velocità,
 * carattere e on/off per tutti i componenti al suo interno; le stesse props sui
 * singoli componenti hanno la precedenza (prop > provider più vicino > default).
 */

/** Carattere delle transizioni: gloop (rimbalzo originale), smooth (senza rimbalzo), snappy (rapido, rimbalzo ridotto) */
export type GloopMotionPreset = 'gloop' | 'smooth' | 'snappy'

/** 'user': segue l'impostazione del sistema operativo. 'always': sempre ridotto. 'never': ignora l'OS */
export type GloopReducedMotion = 'user' | 'always' | 'never'

export type MotionProps = {
  /** Moltiplicatore di velocità delle animazioni: 2 = doppia velocità, 0.5 = metà (default 1) */
  speed?: number
  /** Carattere delle transizioni (default 'gloop') */
  motion?: GloopMotionPreset
  /** false: nessuna animazione, i cambi di stato sono istantanei (default true) */
  animated?: boolean
  /** Come rispettare la preferenza "riduci movimento" (default 'user') */
  reducedMotion?: GloopReducedMotion
}

/**
 * on: animazioni complete. reduced: varianti accessibili (niente goo, niente spostamenti
 * vistosi). off: nessuna animazione.
 */
export type MotionState = 'on' | 'reduced' | 'off'

export const GloopMotionContext = createContext<MotionProps>({})

export type GloopMotionProviderProps = MotionProps & { children?: ReactNode }

/** Imposta le animazioni di tutti i componenti gloop-ui al suo interno; i provider annidati si fondono */
export function GloopMotionProvider({ children, ...config }: GloopMotionProviderProps) {
  const parent = useContext(GloopMotionContext)
  const { speed, motion, animated, reducedMotion } = config
  const value = useMemo(
    () => ({ ...parent, ...defined({ speed, motion, animated, reducedMotion }) }),
    [parent, speed, motion, animated, reducedMotion],
  )
  return <GloopMotionContext.Provider value={value}>{children}</GloopMotionContext.Provider>
}

function defined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>
}

/** Estrae le props di animazione, ad esempio per inoltrarle a un MotionScope */
export function pickMotionProps({ speed, motion, animated, reducedMotion }: MotionProps): MotionProps {
  return defined({ speed, motion, animated, reducedMotion })
}
