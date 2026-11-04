// Reglas de arquitectura de la API (ADR-SW-001, ADR-SW-002, ADR-SW-004).
// Es una función para aplicar exactamente las mismas reglas al código real (eslint.config.mjs)
// y a los fixtures de apps/api/tests/architecture, que prueban que bloquean lo prohibido.
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import boundaries from 'eslint-plugin-boundaries';

// Raíz del repo: los patrones son relativos a ella, sin depender del cwd de quien lintea.
const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

// Dirección entre módulos (sólo por ports/in del otro). Una dirección nueva se agrega
// cuando un ADR/TDD-SW la fija, en el mismo PR (AGENTS.md §5.8). Nadie importa audit ni
// notifications: sus contratos se declaran en el ports/out de quien los usa
// (AuditPort, TDD-SW-007; OutboxPort, ADR-SW-004) y se cablean en el composition root.
const MODULE_DEPENDENCIES = {
  requests: ['catalog', 'forms', 'identity'], // ADR-SW-001
  catalog: ['forms'], // ADR-SW-001, enmienda 2026-10-15 (sólo lectura)
  assignment: ['requests', 'identity'], // ADR-SW-001
  documents: ['requests', 'identity'], // TDD-SW-006
};

// Librerías que domain/, application/ y ports/ pueden importar. Cada excepción lleva su
// justificación (sólo librerías puras, sin I/O ni framework). Hoy: ninguna.
const PURE_LIBRARIES = [];

// Selectores de boundaries v7: una capa, opcionalmente del mismo módulo que el origen.
const from = (...types) => ({ element: { types } });
const to = (type) => ({ to: { element: { type } } });
const sameModule = (type) => ({
  to: { element: { type, captured: { module: '{{ from.element.captured.module }}' } } },
});
const ofModule = (type, module) => ({ to: { element: { type, captured: { module } } } });

// Todo specifier que no sea relativo ni una librería pura permitida.
const nonRelative = `^(?!\\.{1,2}/${PURE_LIBRARIES.map((lib) => `|${lib}(/|$)`).join('')})`;
const LAYER_MESSAGE =
  'domain/, application/ y ports/ no importan librerías, frameworks ni infraestructura: eso va en adapters/ (ADR-SW-002).';

/**
 * @param {{ root?: string, tsconfig?: string }} [options]
 *   root: carpeta `src` de la API (relativa a la raíz del repo).
 */
export function apiArchitecture({ root = 'apps/api/src', tsconfig = 'apps/api/tsconfig.json' } = {}) {
  const MODULE = `${root}/modules/*`;
  const pureLayers = ['domain', 'application', 'ports/in', 'ports/out'].map(
    (layer) => `${MODULE}/${layer}/**/*.ts`,
  );

  return [
    // Límites de módulos y capas (ADR-SW-001, ADR-SW-002).
    {
      files: [`${root}/**/*.ts`],
      plugins: { boundaries },
      settings: {
        'boundaries/root-path': REPO_ROOT,
        'import/resolver': { typescript: { project: join(REPO_ROOT, tsconfig) } },
        'boundaries/include': [`${root}/**/*.ts`],
        // También analiza import() dinámicos y tipos inline import('x').T, no sólo import/export.
        'boundaries/dependency-nodes': ['import', 'export', 'dynamic-import', 'require'],
        'boundaries/elements': [
          { type: 'domain', pattern: `${MODULE}/domain`, capture: ['module'] },
          { type: 'application', pattern: `${MODULE}/application`, capture: ['module'] },
          { type: 'port-in', pattern: `${MODULE}/ports/in`, capture: ['module'] },
          { type: 'port-out', pattern: `${MODULE}/ports/out`, capture: ['module'] },
          { type: 'adapter-in', pattern: `${MODULE}/adapters/in`, capture: ['module'] },
          { type: 'adapter-out', pattern: `${MODULE}/adapters/out`, capture: ['module'] },
          // Archivos sueltos en la raíz de un módulo: nadie los importa (evita barrels que salteen capas).
          { type: 'module-root', pattern: MODULE, capture: ['module'] },
          { type: 'platform', pattern: `${root}/!(modules)` },
          // Último: lo que queda directo en src/ (app.ts, main.ts).
          { type: 'composition-root', pattern: root },
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
              // Inversión de dependencias: Documents implementa AttachmentCheckPort de Requests
              // con AttachmentCheckAdapter (TDD-SW-006). Única excepción hacia un ports/out ajeno.
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

    // domain/, application/ y ports/ no importan librerías: sólo código propio por ruta relativa
    // (ADR-SW-002). Cubre import, import type, export ... from, import x = require(), require(),
    // import() dinámico y tipos inline import('x').T.
    {
      files: pureLayers,
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          { patterns: [{ regex: nonRelative, message: LAYER_MESSAGE }] },
        ],
        'no-restricted-syntax': [
          'error',
          ...[
            'ImportExpression > Literal',
            'TSImportType > TSLiteralType > Literal',
            'TSImportType > Literal',
            "CallExpression[callee.name='require'] > Literal",
          ].map((node) => ({
            selector: `${node}[value=/${nonRelative.replaceAll('/', '\\/')}/]`,
            message: LAYER_MESSAGE,
          })),
          {
            // Un import() con specifier calculado o con template no se puede verificar.
            selector: "ImportExpression[source.type!='Literal']",
            message: 'import() sólo con un string literal (ADR-SW-002).',
          },
          {
            // Lo mismo para require(): con template o specifier calculado no se puede verificar.
            selector: "CallExpression[callee.name='require'][arguments.0.type!='Literal']",
            message: 'require() sólo con un string literal (ADR-SW-002).',
          },
        ],
      },
    },
  ];
}
