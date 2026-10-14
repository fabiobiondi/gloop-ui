import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

const THEME_VARS = ['--ui-bg', '--ui-fg', '--ui-accent', '--ui-surface']

/*
 * I componenti in un portal su <body> perdono il tema del punto in cui sono usati:
 * le variabili --ui-* vengono lette dall'elemento di riferimento e riapplicate.
 * Si leggono prima del primo frame (niente lampo di colori).
 */
export function useThemeVars(ref: RefObject<Element | null>, active: boolean) {
  const [vars, setVars] = useState<CSSProperties>({})

  useLayoutEffect(() => {
    if (!active || !ref.current) return
    const style = getComputedStyle(ref.current)
    // Solo le variabili definite: --ui-surface di solito non lo è e vale il default del CSS
    const entries = THEME_VARS.map((v) => [v, style.getPropertyValue(v).trim()]).filter(([, value]) => value)
    setVars(Object.fromEntries(entries) as CSSProperties)
  }, [active, ref])

  return vars
}
