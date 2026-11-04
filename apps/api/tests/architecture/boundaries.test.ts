// Pruebas de las reglas de arquitectura (ADR-SW-001, ADR-SW-002, ADR-SW-004, TDD-SW-006).
// Lintea un archivo virtual con un import dentro del árbol de fixtures, usando las mismas
// reglas que `npm run lint` aplica a apps/api/src (eslint/architecture.mjs).
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../../..');
const fixturesSrc = join(here, 'fixtures/src');

const eslint = new ESLint({
  cwd: repoRoot,
  overrideConfigFile: join(here, 'fixtures/eslint.config.mjs'),
});

const BOUNDARIES = 'boundaries/dependencies';
const LIBRARY = '@typescript-eslint/no-restricted-imports';
const SYNTAX = 'no-restricted-syntax';

type Case = {
  /** Carpeta del archivo que importa, relativa a fixtures/src. */
  from: string;
  code: string;
  /** Reglas que tienen que fallar; vacío = el import está permitido. */
  fails: string[];
};

async function lint({ from, code }: Case): Promise<string[]> {
  const filePath = join(fixturesSrc, from, '__case__.ts');
  const [result] = await eslint.lintText(code, { filePath });
  if (!result) throw new Error('ESLint no devolvió resultado');
  return result.messages.map((m) => m.ruleId ?? `fatal: ${m.message}`);
}

const blocked: Record<string, Case> = {
  // ADR-SW-002: domain/, application/ y ports/ no importan frameworks, ORM ni infraestructura.
  'domain → express': { from: 'modules/requests/domain', code: "import express from 'express';", fails: [LIBRARY] },
  'application → express': { from: 'modules/requests/application', code: "import express from 'express';", fails: [LIBRARY] },
  'application → @prisma/client': {
    from: 'modules/requests/application',
    code: "import { PrismaClient } from '@prisma/client';",
    fails: [LIBRARY],
  },
  'application → node:fs': { from: 'modules/requests/application', code: "import { readFile } from 'node:fs/promises';", fails: [LIBRARY] },
  'application → fs (sin node:)': { from: 'modules/requests/application', code: "import fs from 'fs';", fails: [LIBRARY] },
  'application → import type de express': {
    from: 'modules/requests/application',
    code: "import type { Request } from 'express';",
    fails: [LIBRARY],
  },
  'application → export ... from express': {
    from: 'modules/requests/application',
    code: "export { Router } from 'express';",
    fails: [LIBRARY],
  },
  'application → import() dinámico de express': {
    from: 'modules/requests/application',
    code: "export const load = () => import('express');",
    fails: [SYNTAX],
  },
  'application → import() con specifier calculado': {
    from: 'modules/requests/application',
    code: "const lib = 'express';\nexport const load = () => import(lib);",
    fails: [SYNTAX],
  },
  'application → require(express)': {
    from: 'modules/requests/application',
    code: "export const lib: unknown = require('express');",
    fails: [SYNTAX],
  },
  'application → require con template literal': {
    from: 'modules/requests/application',
    code: 'export const lib: unknown = require(`express`);',
    fails: [SYNTAX],
  },
  'application → require con specifier calculado': {
    from: 'modules/requests/application',
    code: "const name = 'express';\nexport const lib: unknown = require(name);",
    fails: [SYNTAX],
  },
  'application → tipo inline import(express).Request': {
    from: 'modules/requests/application',
    code: "export type Req = import('express').Request;",
    fails: [SYNTAX],
  },
  'domain → tipo inline import(express).Request': {
    from: 'modules/requests/domain',
    code: "export type Req = import('express').Request;",
    fails: [SYNTAX],
  },
  'ports/in → express': { from: 'modules/requests/ports/in', code: "import type { Request } from 'express';", fails: [LIBRARY] },
  'ports/out → @prisma/client': {
    from: 'modules/requests/ports/out',
    code: "import type { PrismaClient } from '@prisma/client';",
    fails: [LIBRARY],
  },

  // ADR-SW-002: las dependencias van hacia adentro.
  'domain → application del mismo módulo': {
    from: 'modules/requests/domain',
    code: "import { submitRequest } from '../application/SubmitRequest.js';",
    fails: [BOUNDARIES],
  },
  'domain → import() dinámico de application': {
    from: 'modules/requests/domain',
    code: "export const load = () => import('../application/SubmitRequest.js');",
    fails: [BOUNDARIES],
  },
  'application → adapters/out del mismo módulo': {
    from: 'modules/requests/application',
    code: "import { requestRepository } from '../adapters/out/RequestRepositoryAdapter.js';",
    fails: [BOUNDARIES],
  },
  'adapters/out → application del mismo módulo': {
    from: 'modules/requests/adapters/out',
    code: "import { submitRequest } from '../../application/SubmitRequest.js';",
    fails: [BOUNDARIES],
  },

  // ADR-SW-001: entre módulos sólo ports/in, en la dirección fijada.
  'requests/application → catalog/adapters/out': {
    from: 'modules/requests/application',
    code: "import { productRepository } from '../../catalog/adapters/out/ProductRepositoryAdapter.js';",
    fails: [BOUNDARIES],
  },
  'catalog/application → requests/ports/in (dirección invertida)': {
    from: 'modules/catalog/application',
    code: "import type { RequestQueryPort } from '../../requests/ports/in/RequestQueryPort.js';",
    fails: [BOUNDARIES],
  },
  'requests/domain → catalog/ports/in': {
    from: 'modules/requests/domain',
    code: "import type { CatalogQueryPort } from '../../catalog/ports/in/CatalogQueryPort.js';",
    fails: [BOUNDARIES],
  },
  'requests/application → audit/ports/in': {
    from: 'modules/requests/application',
    code: "import type { AuditPort } from '../../audit/ports/in/AuditPort.js';",
    fails: [BOUNDARIES],
  },

  // ADR-SW-004: el outbox se usa por el OutboxPort del ports/out propio, no importando notifications.
  'requests/application → notifications/ports/in': {
    from: 'modules/requests/application',
    code: "import type { OutboxWriterPort } from '../../notifications/ports/in/OutboxWriterPort.js';",
    fails: [BOUNDARIES],
  },
  'requests/adapters/in → notifications/ports/in': {
    from: 'modules/requests/adapters/in',
    code: "import type { OutboxWriterPort } from '../../../notifications/ports/in/OutboxWriterPort.js';",
    fails: [BOUNDARIES],
  },
  'notifications/adapters/out → requests/ports/out': {
    from: 'modules/notifications/adapters/out',
    code: "import type { OutboxPort } from '../../../requests/ports/out/OutboxPort.js';",
    fails: [BOUNDARIES],
  },

  // TDD-SW-006: la excepción hacia un ports/out ajeno es sólo documents/adapters/out → requests/ports/out.
  'catalog/adapters/out → requests/ports/out': {
    from: 'modules/catalog/adapters/out',
    code: "import type { AttachmentCheckPort } from '../../../requests/ports/out/AttachmentCheckPort.js';",
    fails: [BOUNDARIES],
  },
  'documents/application → requests/ports/out': {
    from: 'modules/documents/application',
    code: "import type { AttachmentCheckPort } from '../../requests/ports/out/AttachmentCheckPort.js';",
    fails: [BOUNDARIES],
  },

  // Archivos sueltos en la raíz de un módulo y composition root: nadie los importa.
  'application → archivo suelto en la raíz de otro módulo': {
    from: 'modules/catalog/application',
    code: "import '../../requests/index.js';",
    fails: [BOUNDARIES],
  },
  'domain → app.ts (composition root)': {
    from: 'modules/requests/domain',
    code: "import { createApp } from '../../../app.js';",
    fails: [BOUNDARIES],
  },
  'http/ (platform) → app.ts': {
    from: 'http',
    code: "import { createApp } from '../app.js';",
    fails: [BOUNDARIES],
  },
  'http/ (platform) → adapters/in de un módulo': {
    from: 'http',
    code: "import { requestsRouter } from '../modules/requests/adapters/in/requestsRouter.js';",
    fails: [BOUNDARIES],
  },
};

const allowed: Record<string, Case> = {
  'application → domain y ports del mismo módulo': {
    from: 'modules/requests/application',
    code: [
      "import type { InsuranceRequest } from '../domain/InsuranceRequest.js';",
      "import type { OutboxPort } from '../ports/out/OutboxPort.js';",
      "import type { RequestQueryPort } from '../ports/in/RequestQueryPort.js';",
      'export type Deps = [InsuranceRequest, OutboxPort, RequestQueryPort];',
    ].join('\n'),
    fails: [],
  },
  'requests/application → catalog/ports/in (ADR-SW-001)': {
    from: 'modules/requests/application',
    code: "import type { CatalogQueryPort } from '../../catalog/ports/in/CatalogQueryPort.js';\nexport type D = CatalogQueryPort;",
    fails: [],
  },
  'domain → import() dinámico de su propio domain': {
    from: 'modules/requests/domain',
    code: "export const load = () => import('./InsuranceRequest.js');",
    fails: [],
  },
  'adapters/in → application del mismo módulo y express': {
    from: 'modules/requests/adapters/in',
    code: "import { submitRequest } from '../../application/SubmitRequest.js';\nimport { Router } from 'express';\nexport const deps = [submitRequest, Router];",
    fails: [],
  },
  'adapters/out → ports/out del mismo módulo y librería de infraestructura': {
    from: 'modules/requests/adapters/out',
    code: "import type { OutboxPort } from '../../ports/out/OutboxPort.js';\nimport { readFile } from 'node:fs/promises';\nexport const deps: [OutboxPort?, typeof readFile?] = [];",
    fails: [],
  },
  'documents/adapters/out → requests/ports/out (AttachmentCheckPort, TDD-SW-006)': {
    from: 'modules/documents/adapters/out',
    code: "import type { AttachmentCheckPort } from '../../../requests/ports/out/AttachmentCheckPort.js';\nexport type D = AttachmentCheckPort;",
    fails: [],
  },
  'composition root → adapters de cualquier módulo y ports/out ajenos (cableado del outbox)': {
    from: '',
    code: [
      "import { outbox } from './modules/notifications/adapters/out/OutboxAdapter.js';",
      "import type { OutboxPort } from './modules/requests/ports/out/OutboxPort.js';",
      "import { healthRouter } from './http/health.js';",
      'export const requestsOutbox: OutboxPort = outbox;',
      'export const deps = [healthRouter];',
    ].join('\n'),
    fails: [],
  },
};

describe('reglas de arquitectura: imports prohibidos fallan', () => {
  it.each(Object.entries(blocked))('%s', async (_name, testCase) => {
    const rules = await lint(testCase);
    for (const rule of testCase.fails) expect(rules).toContain(rule);
  });
});

describe('reglas de arquitectura: imports permitidos pasan', () => {
  it.each(Object.entries(allowed))('%s', async (_name, testCase) => {
    expect(await lint(testCase)).toEqual([]);
  });
});
