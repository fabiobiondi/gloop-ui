import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const lib = (path: string) => fileURLToPath(new URL(`../../packages/gloop-ui/${path}`, import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages serve il sito su /gloop-ui/ (anche in dev e preview, per non avere sorprese)
  base: '/gloop-ui/',
  plugins: [react()],
  resolve: {
    // In dev si usano i sorgenti della libreria (HMR immediato, i .css arrivano con i componenti).
    // In build si usa il pacchetto compilato (dist), cioè esattamente quello pubblicato su npm.
    alias:
      command === 'serve' && !isPreview
        ? [
            { find: /^gloop-ui\/styles\.css$/, replacement: lib('src/components/theme.css') },
            { find: /^gloop-ui$/, replacement: lib('src/index.ts') },
          ]
        : [],
  },
}))
