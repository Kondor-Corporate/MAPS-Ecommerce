// Reglas de arquitectura de la API (ADR-SW-001, ADR-SW-002, ADR-SW-004, TDD-SW-006, TDD-SW-007).
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

// Paquetes de sólo tipos que las capas puras importan únicamente con `import type`.
const TYPE_ONLY_PACKAGES = ['@maps/types']; // TDD-SW-007: contrato AuditRecord compartido

// Composición de lectura (TDD-SW-007, GetRequestHistory): fuera de los módulos, sin datos ni
// escrituras; sólo consume estos ports/in y sólo la importa el composition root.
const READ_COMPOSITION_DEPENDENCIES = ['audit', 'assignment', 'identity'];

// Selectores de boundaries v7: una capa, opcionalmente del mismo módulo que el origen.
const from = (...types) => ({ element: { types } });
const to = (type) => ({ to: { element: { type } } });
const sameModule = (type) => ({
  to: { element: { type, captured: { module: '{{ from.element.captured.module }}' } } },
});
const ofModule = (type, module) => ({ to: { element: { type, captured: { module } } } });

// Los nombres se escapan para que un `.` o `+` del paquete no amplíe la excepción.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const packageName = (lib) => `${escapeRegex(lib)}(/|$)`;

/** Regex de todo specifier que no sea relativo ni uno de `allowed` (exportada para sus tests). */
export function notAllowedSpecifier(allowed = []) {
  return `^(?!\\.{1,2}/${allowed.map((lib) => `|${packageName(lib)}`).join('')})`;
}

// Valores (import, require, import()): sólo relativos y librerías puras.
const valueSpecifier = notAllowedSpecifier(PURE_LIBRARIES);
// Tipos: además, los paquetes de sólo tipos.
const typeSpecifier = notAllowedSpecifier([...PURE_LIBRARIES, ...TYPE_ONLY_PACKAGES]);
const asSelectorRegex = (regex) => `/${regex.replaceAll('/', '\\/')}/`;

const LAYER_MESSAGE =
  'domain/, application/, ports/ y read-composition/ no importan librerías, frameworks ni infraestructura: eso va en adapters/ (ADR-SW-002).';
const TYPE_ONLY_MESSAGE = '@maps/types es de sólo tipos: importalo con `import type` (TDD-SW-007).';

/**
 * @param {{ root?: string, tsconfig?: string, typesPackage?: string }} [options]
 *   root: carpeta `src` de la API; typesPackage: carpeta de @maps/types (relativas a la raíz del repo).
 */
export function apiArchitecture({
  root = 'apps/api/src',
  tsconfig = 'apps/api/tsconfig.json',
  typesPackage = 'packages/types',
} = {}) {
  const MODULE = `${root}/modules/*`;
  const READ_COMPOSITION = `${root}/read-composition`;
  const pureLayers = [
    ...['domain', 'application', 'ports/in', 'ports/out'].map((layer) => `${MODULE}/${layer}/**/*.ts`),
    `${READ_COMPOSITION}/**/*.ts`,
  ];

  return [
    // Límites de módulos y capas (ADR-SW-001, ADR-SW-002).
    {
      files: [`${root}/**/*.ts`, `${typesPackage}/**/*.ts`],
      plugins: { boundaries },
      settings: {
        'boundaries/root-path': REPO_ROOT,
        'import/resolver': { typescript: { project: join(REPO_ROOT, tsconfig) } },
        'boundaries/include': [`${root}/**/*.ts`, `${typesPackage}/**/*.ts`],
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
          { type: 'read-composition', pattern: READ_COMPOSITION },
          { type: 'platform', pattern: `${root}/!(modules|read-composition)` },
          // Último: lo que queda directo en src/ (app.ts, main.ts).
          { type: 'composition-root', pattern: root },
          { type: 'shared-types', pattern: typesPackage },
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
              // Composición de lectura (TDD-SW-007): sólo los ports/in que compone.
              {
                from: from('read-composition'),
                allow: [to('read-composition'), ...READ_COMPOSITION_DEPENDENCIES.map((dep) => ofModule('port-in', dep))],
              },
              // Contratos compartidos de sólo tipos (TDD-SW-007): los usan puertos, casos de uso y
              // adaptadores, no el dominio. El paquete no importa nada de la API.
              {
                from: from('port-in', 'port-out', 'application', 'adapter-in', 'adapter-out', 'read-composition', 'composition-root'),
                allow: [to('shared-types')],
              },
              { from: from('shared-types'), allow: [to('shared-types')] },
              // Composition roots: app.ts y main.ts cablean todo; http/ y config/ son técnicos.
              {
                from: from('composition-root'),
                allow: [
                  'composition-root',
                  'platform',
                  'read-composition',
                  'application',
                  'port-in',
                  'port-out',
                  'adapter-in',
                  'adapter-out',
                ].map(to),
              },
              { from: from('platform'), allow: [to('platform')] },
            ],
          },
        ],
      },
    },

    // domain/, application/, ports/ y read-composition/ no importan librerías: sólo código propio
    // por ruta relativa (ADR-SW-002), y @maps/types sólo como tipo. Cubre import, import type,
    // export ... from, import x = require(), require(), import() dinámico y tipos inline import('x').T.
    {
      files: pureLayers,
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            patterns: [
              { regex: typeSpecifier, message: LAYER_MESSAGE },
              {
                regex: `^(${TYPE_ONLY_PACKAGES.map(packageName).join('|')})`,
                allowTypeImports: true,
                message: TYPE_ONLY_MESSAGE,
              },
            ],
          },
        ],
        'no-restricted-syntax': [
          'error',
          ...['ImportExpression > Literal', "CallExpression[callee.name='require'] > Literal"].map((node) => ({
            selector: `${node}[value=${asSelectorRegex(valueSpecifier)}]`,
            message: LAYER_MESSAGE,
          })),
          ...['TSImportType > TSLiteralType > Literal', 'TSImportType > Literal'].map((node) => ({
            selector: `${node}[value=${asSelectorRegex(typeSpecifier)}]`,
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

    // @maps/types: sólo declaraciones de tipos, sin código ejecutable ni dependencias (TDD-SW-007).
    {
      files: [`${typesPackage}/**/*.ts`],
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          { patterns: [{ regex: notAllowedSpecifier(), message: '@maps/types no importa librerías (TDD-SW-007).' }] },
        ],
        'no-restricted-syntax': [
          'error',
          ...[
            'VariableDeclaration',
            'FunctionDeclaration',
            'ClassDeclaration',
            'TSEnumDeclaration',
            'TSModuleDeclaration',
            'ExportDefaultDeclaration',
            'ExpressionStatement',
            "ImportDeclaration[importKind!='type']",
            "ExportNamedDeclaration[source][exportKind!='type']",
            "ExportAllDeclaration[exportKind!='type']",
          ].map((selector) => ({
            selector,
            message: '@maps/types sólo declara `type` e `interface` (TDD-SW-007).',
          })),
        ],
      },
    },
  ];
}
