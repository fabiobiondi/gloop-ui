import { defineConfig } from 'rolldown'
import { dts } from 'rolldown-plugin-dts'

// Tipi in un unico dist/index.d.ts: niente import relativi senza estensione né import .css,
// che non si risolvono con moduleResolution node16/nodenext dei progetti che usano la libreria
export default defineConfig({
  input: 'src/index.ts',
  output: { dir: 'dist' },
  external: [/^react($|\/)/, /^react-dom($|\/)/, /^motion($|\/)/, /\.css$/],
  plugins: [
    dts({ emitDtsOnly: true, tsconfig: 'tsconfig.json' }),
    {
      // Gli import .css dei componenti non hanno senso nei tipi: il CSS è in styles.css
      name: 'strip-css-imports',
      renderChunk: (code) => code.replace(/^import "[^"]+\.css";\n/gm, ''),
    },
  ],
})
