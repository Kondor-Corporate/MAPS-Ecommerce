import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const MODULE = 'apps/api/src/modules/*';

// Selectores de boundaries v7: una capa, opcionalmente del mismo módulo que el origen.
const from = (...types) => ({ element: { types } });
const to = (type) => ({ to: { element: { type } } });
const sameModule = (type) => ({
  to: { element: { type, captured: { module: '{{ from.element.captured.module }}' } } },
});

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
      'import/resolver': {
        typescript: { project: 'apps/api/tsconfig.json' },
      },
      'boundaries/include': ['apps/api/src/**/*.ts'],
      'boundaries/elements': [
        { type: 'domain', pattern: `${MODULE}/domain`, capture: ['module'] },
        { type: 'application', pattern: `${MODULE}/application`, capture: ['module'] },
        { type: 'port-in', pattern: `${MODULE}/ports/in`, capture: ['module'] },
        { type: 'port-out', pattern: `${MODULE}/ports/out`, capture: ['module'] },
        { type: 'adapter-in', pattern: `${MODULE}/adapters/in`, capture: ['module'] },
        { type: 'adapter-out', pattern: `${MODULE}/adapters/out`, capture: ['module'] },
        { type: 'platform', pattern: 'apps/api/src/*' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            '{{ from.element.types.[0] }} de "{{ from.element.captured.module }}" no puede importar {{ to.element.types.[0] }} de "{{ to.element.captured.module }}" (ADR-SW-001/002)',
          policies: [
            // Dentro del mismo módulo, las dependencias van hacia adentro.
            { from: from('domain'), allow: [sameModule('domain')] },
            {
              from: from('application'),
              allow: [sameModule('domain'), sameModule('application'), sameModule('port-in'), sameModule('port-out')],
            },
            {
              from: from('port-in', 'port-out'),
              allow: [sameModule('domain'), sameModule('port-in'), sameModule('port-out')],
            },
            {
              from: from('adapter-in'),
              allow: [sameModule('domain'), sameModule('application'), sameModule('port-in'), to('platform')],
            },
            {
              from: from('adapter-out'),
              allow: [sameModule('domain'), sameModule('port-out'), to('platform')],
            },
            // Entre módulos: sólo los ports/in del otro módulo.
            { from: from('application', 'adapter-in'), allow: [to('port-in')] },
            // Composition roots (app.ts, main.ts, http/, config/) cablean todo.
            {
              from: from('platform'),
              allow: ['platform', 'application', 'port-in', 'port-out', 'adapter-in', 'adapter-out'].map(to),
            },
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
