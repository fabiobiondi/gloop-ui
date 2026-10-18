import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const lib = (path: string) => fileURLToPath(new URL(`../../packages/gloop-ui/${path}`, import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages serve il sito su /gloop-ui/ (anche in dev e preview, per non avere sorprese)
  base: '/gloop-ui/',
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Shiki (grammatiche + motore regex) in un chunk a parte: cambia di rado, resta in cache tra un deploy e l'altro
        codeSplitting: {
          groups: [{ name: 'shiki', test: /node_modules[\\/](shiki|@shikijs|oniguruma-)/ }],
        },
      },
    },
  },
  resolve: {
    // In dev si usano i sorgenti della libreria (HMR immediato, i .css arrivano con i componenti).
    // In build si usa il pacchetto compilato (dist), cioè esattamente quello pubblicato su npm.
    alias:
      command === 'serve' && !isPreview
        ? [
            { find: /^gloop-ui\/styles\.css$/, replacement: lib('src/components/theme.css') },
            // gloop-ui passa da src/engine.ts: Motion o le copie in CSS (?engine=css)
            { find: /^gloop-ui$/, replacement: fileURLToPath(new URL('./src/engine.ts', import.meta.url)) },
            { find: /^gloop-ui-motion$/, replacement: lib('src/index.ts') },
            { find: /^gloop-ui-css$/, replacement: lib('src/css/index.ts') },
          ]
        : [],
  },
}))
