import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

const THEME_VARS = ['--ui-bg', '--ui-fg', '--ui-accent']

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
    setVars(Object.fromEntries(THEME_VARS.map((v) => [v, style.getPropertyValue(v).trim()])) as CSSProperties)
  }, [active, ref])

  return vars
}
