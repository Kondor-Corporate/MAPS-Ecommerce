import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { apiArchitecture } from './eslint/architecture.mjs';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'docs/**',
      // Fixtures de las pruebas de arquitectura: los lintea su test con sus propias reglas.
      'apps/api/tests/architecture/fixtures/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // API: Node.
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  // Límites de módulos y capas e infraestructura por capa (ADR-SW-001/002/004).
  ...apiArchitecture(),

  // Web: navegador + React.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['apps/web/vite.config.ts'],
    languageOptions: { globals: globals.node },
  },

  // Scripts de Node: hooks y tests del flujo de agentes (.claude/, .codex/) y config de lint.
  {
    files: ['.claude/**/*.mjs', '.codex/**/*.mjs', 'eslint/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
);
