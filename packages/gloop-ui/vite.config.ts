import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Library mode: un solo bundle ESM + un solo styles.css (gli import .css dei componenti
// vengono raccolti qui e tolti dal JS, l'utente importa 'gloop-ui/styles.css' una volta)
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'styles',
    },
    cssCodeSplit: false,
    sourcemap: true,
    rolldownOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/],
      output: {
        // Next.js App Router: i componenti usano hook ed eventi, sono client components
        banner: "'use client';",
      },
    },
  },
})
