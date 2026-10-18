/*
 * Durata in ms di una variabile CSS (es. --tf-morph-ms), per le animazioni Web Animations.
 * Va letta con l'unità: nella build i minificatori riscrivono 494ms come .494s, e un
 * parseFloat da solo darebbe 0.494 ms (animazione istantanea, un salto).
 */
export function cssDuration(css: CSSStyleDeclaration, name: string, fallback: number) {
  const value = css.getPropertyValue(name).trim()
  const n = parseFloat(value)
  if (!Number.isFinite(n)) return fallback
  return /\ds$/.test(value) ? n * 1000 : n
}
