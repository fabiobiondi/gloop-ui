import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import base from './vitest.config'

/*
 * Gli stessi test sulle copie senza motion/react (src/css): ./index punta a ./css/index.
 * motion.test.tsx resta fuori, prova useGloopMotion e tuneTransition, specifici di Motion.
 */
export default mergeConfig(
  base,
  defineConfig({
    resolve: {
      alias: [{ find: /^\.\/index$/, replacement: fileURLToPath(new URL('./src/css/index.ts', import.meta.url)) }],
    },
    test: { exclude: ['**/node_modules/**', 'src/motion.test.tsx'] },
  }),
)
