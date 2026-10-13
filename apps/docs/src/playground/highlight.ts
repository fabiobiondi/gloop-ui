import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import bash from 'shiki/langs/bash.mjs'
import css from 'shiki/langs/css.mjs'
import tsx from 'shiki/langs/tsx.mjs'
import githubDark from 'shiki/themes/github-dark-default.mjs'

export type Lang = 'tsx' | 'css' | 'bash'

// Solo le grammatiche usate dalla doc e il motore regex JS (niente WASM):
// l'highlighter è sincrono, quindi il codice esce già colorato al primo render
const highlighter = createHighlighterCoreSync({
  themes: [githubDark],
  langs: [tsx, css, bash],
  engine: createJavaScriptRegexEngine(),
})

export function tokenize(code: string, lang: Lang) {
  return highlighter.codeToTokens(code, { lang, theme: 'github-dark-default' }).tokens
}
