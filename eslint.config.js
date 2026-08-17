/**
 * @file eslint.config.js
 * @description Flat configuration file for ESLint in the React 19 E-Commerce application.
 * 
 * @why-it-exists
 * ESLint enforces consistent coding styles, detects bugs, and prevents code smells before commit.
 * 
 * @why-this-approach
 * - ESLint Flat Config (v9+) is the default standard, replacing legacy .eslintrc files. It is faster, has native 
 *   ESM support, and offers direct arrays of rule objects.
 * - We extend recommended configurations from `@eslint/js`, `typescript-eslint`, and `eslint-plugin-react-hooks`.
 * - We append `eslint-config-prettier` at the end to disable any rules that conflict with Prettier.
 * 
 * @alternative-approaches
 * - Legacy config (.eslintrc.json): Obsolete in ESLint v9+, more complex to configure with plugins.
 * - Monolithic eslint rules: Harder to maintain. Keeping configurations modular and extending defaults is cleaner.
 * 
 * @enterprise-considerations
 * - Strictness: In production, warnings can block builds to maintain high-quality code.
 * - Integration: Integrated with husky/lint-staged to run pre-commit.
 */

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules', '*.tsbuildinfo']),
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  eslintConfigPrettier,
])
