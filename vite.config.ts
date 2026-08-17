/// <reference types="vitest" />
/**
 * @file vite.config.ts
 * @description Vite configuration file for the React 19 E-Commerce application.
 *
 * @why-it-exists
 * This file configures the build tooling, dev server, plugins, and testing settings (Vitest) for the project.
 * It serves as the single source of truth for compile-time configuration in our Vite-based environment.
 *
 * @why-this-approach
 * - We use `@tailwindcss/vite` plugin which compiles Tailwind CSS v4 directives directly inside the Vite pipeline,
 *   making CSS builds faster and removing the need for a separate PostCSS config.
 * - We integrate Vitest configurations inside the same Vite config to share alias definitions and loader setups,
 *   ensuring development and testing environments run on identical transpilation paths.
 *
 * @alternative-approaches
 * - Webpack: Traditional but slower due to bundle-based dev serving instead of ESM-based hot module replacement.
 * - Separate Vitest config (`vitest.config.ts`): Keeps test configs isolated, but duplicates alias and plugin definitions.
 *
 * @enterprise-considerations
 * - Path Aliases: We map `@/` to `src/` to prevent brittle relative path imports (e.g., `../../components`).
 * - Security Headers: Can be injected into Vite's dev server to simulate production-like security.
 * - Target Build: Production builds target modern browsers supporting native ESM.
 */

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    server: {
      deps: {
        inline: [/@exodus\/bytes/],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/tests/'],
    },
  },
})
