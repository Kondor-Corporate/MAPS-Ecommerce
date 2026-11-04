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
const ofModule = (type, module) => ({ to: { element: { type, captured: { module } } } });

// Dirección entre módulos (sólo por ports/in del otro). Una dirección nueva se agrega
// cuando un ADR/TDD-SW la fija, en el mismo PR (AGENTS.md §5.8).
const MODULE_DEPENDENCIES = {
  requests: ['catalog', 'forms', 'identity'], // ADR-SW-001
  catalog: ['forms'], // ADR-SW-001, enmienda 2026-10-15 (sólo lectura)
  assignment: ['requests', 'identity'], // ADR-SW-001
  documents: ['requests', 'identity'], // TDD-SW-006
};
// Outbox: cualquier módulo solicita la escritura por el puerto estrecho de notifications (ADR-SW-004).
const OUTBOX_MODULE = 'notifications';

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
        // Archivos sueltos en la raíz de un módulo: nadie los importa (evita barrels que salteen capas).
        { type: 'module-root', pattern: MODULE, capture: ['module'] },
        { type: 'platform', pattern: 'apps/api/src/!(modules)' },
        // Último: lo que queda directo en src/ (app.ts, main.ts).
        { type: 'composition-root', pattern: 'apps/api/src' },
      ],
    },
    rules: {
      'boundaries/no-unknown-dependencies': 'error',
      'boundaries/no-unknown-files': 'error',
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
            // Entre módulos: sólo ports/in, en la dirección fijada por los documentos.
            ...Object.entries(MODULE_DEPENDENCIES).map(([module, deps]) => ({
              from: { element: { types: ['application', 'adapter-in'], captured: { module } } },
              allow: deps.map((dep) => ofModule('port-in', dep)),
            })),
            { from: from('application', 'adapter-in'), allow: [ofModule('port-in', OUTBOX_MODULE)] },
            // Inversión de dependencias: Documents implementa AttachmentCheckPort de Requests (TDD-SW-006).
            {
              from: { element: { type: 'adapter-out', captured: { module: 'documents' } } },
              allow: [ofModule('port-out', 'requests')],
            },
            // Composition roots: app.ts y main.ts cablean todo; http/ y config/ son técnicos.
            {
              from: from('composition-root'),
              allow: ['composition-root', 'platform', 'application', 'port-in', 'port-out', 'adapter-in', 'adapter-out'].map(to),
            },
            { from: from('platform'), allow: [to('platform')] },
          ],
        },
      ],
    },
  },

  // El dominio no importa librerías: sólo código propio por ruta relativa (ADR-SW-002).
  // Si hace falta una librería pura (sin I/O), se agrega como excepción explícita.
  {
    files: ['apps/api/src/modules/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(?!\\.{1,2}/)',
              message: 'domain/ no importa librerías ni infraestructura (ADR-SW-002).',
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

  // Hooks y tests del flujo de agentes (.claude/, .codex/): scripts de Node.
  {
    files: ['.claude/**/*.mjs', '.codex/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
);
