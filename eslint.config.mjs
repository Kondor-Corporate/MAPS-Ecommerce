import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const MODULE = 'apps/api/src/modules/*';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', 'docs/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // API: Node.
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  // Límites de módulos y capas (ADR-SW-001, ADR-SW-002).
  {
    files: ['apps/api/src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['apps/api/src/**/*.ts'],
      'boundaries/elements': [
        { type: 'domain', pattern: `${MODULE}/domain`, capture: ['module'] },
        { type: 'application', pattern: `${MODULE}/application`, capture: ['module'] },
        { type: 'port-in', pattern: `${MODULE}/ports/in`, capture: ['module'] },
        { type: 'port-out', pattern: `${MODULE}/ports/out`, capture: ['module'] },
        { type: 'adapter-in', pattern: `${MODULE}/adapters/in`, capture: ['module'] },
        { type: 'adapter-out', pattern: `${MODULE}/adapters/out`, capture: ['module'] },
        { type: 'platform', pattern: 'apps/api/src/*', mode: 'folder' },
      ],
    },
    rules: {
      'boundaries/no-unknown': 'off',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          message: '${file.type} de "${file.module}" no puede importar ${dependency.type} de "${dependency.module}" (ADR-SW-001/002)',
          rules: [
            // Dentro del mismo módulo, las dependencias van hacia adentro.
            { from: 'domain', allow: [['domain', { module: '${from.module}' }]] },
            {
              from: 'application',
              allow: [
                ['domain', { module: '${from.module}' }],
                ['application', { module: '${from.module}' }],
                ['port-in', { module: '${from.module}' }],
                ['port-out', { module: '${from.module}' }],
              ],
            },
            {
              from: ['port-in', 'port-out'],
              allow: [
                ['domain', { module: '${from.module}' }],
                ['port-in', { module: '${from.module}' }],
                ['port-out', { module: '${from.module}' }],
              ],
            },
            {
              from: 'adapter-in',
              allow: [
                ['domain', { module: '${from.module}' }],
                ['application', { module: '${from.module}' }],
                ['port-in', { module: '${from.module}' }],
                'platform',
              ],
            },
            {
              from: 'adapter-out',
              allow: [
                ['domain', { module: '${from.module}' }],
                ['port-out', { module: '${from.module}' }],
                'platform',
              ],
            },
            // Entre módulos: sólo los ports/in del otro módulo.
            { from: ['application', 'adapter-in'], allow: ['port-in'] },
            // Composition roots (app.ts, main.ts, http/, config/) cablean todo.
            { from: 'platform', allow: ['platform', 'port-in', 'port-out', 'adapter-in', 'adapter-out', 'application'] },
          ],
        },
      ],
    },
  },

  // El dominio no conoce infraestructura (ADR-SW-002).
  {
    files: ['apps/api/src/modules/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['express', 'express/*', '@prisma/*', 'prisma', '@google-cloud/*', 'firebase-admin', 'firebase-admin/*', 'node:*'],
              message: 'domain/ no importa infraestructura (ADR-SW-002).',
            },
          ],
        },
      ],
    },
  },

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
);
