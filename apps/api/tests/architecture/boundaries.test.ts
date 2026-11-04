// Pruebas de las reglas de arquitectura (ADR-SW-001, ADR-SW-002, ADR-SW-004, TDD-SW-006, TDD-SW-007).
// Lintea un archivo virtual con un import dentro del árbol de fixtures, usando las mismas
// reglas que `npm run lint` aplica a apps/api/src (eslint/architecture.mjs).
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { notAllowedSpecifier } from '../../../../eslint/architecture.mjs';

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
  /** Carpeta del archivo que importa, relativa a fixtures/src (o a la raíz del repo si `inRepo`). */
  from: string;
  inRepo?: boolean;
  code: string;
  /** Reglas que tienen que fallar; vacío = el import está permitido. */
  fails: string[];
};

async function lint({ from, code, inRepo }: Case): Promise<string[]> {
  const filePath = join(inRepo ? repoRoot : fixturesSrc, from, '__case__.ts');
  const [result] = await eslint.lintText(code, { filePath });
  if (!result) throw new Error('ESLint no devolvió resultado');
  // "regla: mensaje", para que una falla muestre por qué se bloqueó o se permitió.
  return result.messages.map((m) => `${m.ruleId ?? 'fatal'}: ${m.message}`);
}

const rulesOf = (messages: string[]) => messages.map((m) => m.slice(0, m.indexOf(':')));

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
  'application → import x = require(fs)': {
    from: 'modules/requests/application',
    code: "import fs = require('fs');\nexport const f = fs;",
    fails: [LIBRARY],
  },
  'application → export * from express': {
    from: 'modules/requests/application',
    code: "export * from 'express';",
    fails: [LIBRARY],
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
  'domain → tipo inline import(../application).T': {
    from: 'modules/requests/domain',
    code: "export type T = typeof import('../application/SubmitRequest.js').submitRequest;",
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

  // TDD-SW-007: @maps/types es un paquete de sólo tipos; desde las capas puras sólo con import type.
  'application → valor de @maps/types': {
    from: 'modules/requests/application',
    code: "import { AuditRecord } from '@maps/types';\nexport const r = AuditRecord;",
    fails: [LIBRARY],
  },
  'domain → @maps/types (el dominio no usa contratos compartidos)': {
    from: 'modules/requests/domain',
    code: "import type { AuditRecord } from '@maps/types';\nexport type R = AuditRecord;",
    fails: [BOUNDARIES],
  },
  'application → export (valor) from @maps/types': {
    from: 'modules/requests/application',
    code: "export { AuditRecord } from '@maps/types';",
    fails: [LIBRARY],
  },
  'application → import() dinámico de @maps/types': {
    from: 'modules/requests/application',
    code: "export const load = () => import('@maps/types');",
    fails: [SYNTAX],
  },
  'application → paquete con nombre parecido (@maps/types-extra)': {
    from: 'modules/requests/application',
    code: "import type { X } from '@maps/types-extra';\nexport type Y = X;",
    fails: [LIBRARY],
  },
  'packages/types → valor (const)': {
    from: 'packages/types/src',
    inRepo: true,
    code: "export const AUDIT_ACTIONS = ['SUBMIT'];",
    fails: [SYNTAX],
  },
  'packages/types → función': {
    from: 'packages/types/src',
    inRepo: true,
    code: 'export function isAction(value: string): boolean { return value.length > 0; }',
    fails: [SYNTAX],
  },
  'packages/types → clase': { from: 'packages/types/src', inRepo: true, code: 'export class AuditRecord {}', fails: [SYNTAX] },
  'packages/types → enum': { from: 'packages/types/src', inRepo: true, code: 'export enum Category { NEGOCIO }', fails: [SYNTAX] },
  'packages/types → librería (express)': {
    from: 'packages/types/src',
    inRepo: true,
    code: "import type { Request } from 'express';\nexport type R = Request;",
    fails: [LIBRARY],
  },
  'packages/types → código de la API': {
    from: 'packages/types/src',
    inRepo: true,
    code: "import type { AuditPort } from '../../../apps/api/tests/architecture/fixtures/src/modules/audit/ports/in/AuditPort.js';\nexport type A = AuditPort;",
    fails: [BOUNDARIES],
  },

  // TDD-SW-007: la composición de lectura (GetRequestHistory) está fuera de los módulos y ningún módulo la invoca.
  'requests/application → read-composition': {
    from: 'modules/requests/application',
    code: "import { getRequestHistory } from '../../../read-composition/GetRequestHistory.js';\nexport const g = getRequestHistory;",
    fails: [BOUNDARIES],
  },
  'requests/adapters/in → read-composition': {
    from: 'modules/requests/adapters/in',
    code: "import { getRequestHistory } from '../../../../read-composition/GetRequestHistory.js';\nexport const g = getRequestHistory;",
    fails: [BOUNDARIES],
  },
  'read-composition → requests/ports/in (no fijado por TDD-SW-007)': {
    from: 'read-composition',
    code: "import type { RequestQueryPort } from '../modules/requests/ports/in/RequestQueryPort.js';\nexport type R = RequestQueryPort;",
    fails: [BOUNDARIES],
  },
  'read-composition → audit/adapters/out': {
    from: 'read-composition',
    code: "import { auditEventRepository } from '../modules/audit/adapters/out/AuditEventRepositoryAdapter.js';\nexport const a = auditEventRepository;",
    fails: [BOUNDARIES],
  },
  'read-composition → express': {
    from: 'read-composition',
    code: "import type { Request } from 'express';\nexport type R = Request;",
    fails: [LIBRARY],
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

  'ports/out → import type de @maps/types (AuditPort, TDD-SW-007)': {
    from: 'modules/requests/ports/out',
    code: "import type { AuditRecord } from '@maps/types';\nexport type AuditPort = { record(event: AuditRecord): Promise<void> };",
    fails: [],
  },
  'application → export type from y tipo inline de @maps/types': {
    from: 'modules/audit/application',
    code: "export type { AuditRecord } from '@maps/types';\nexport type R = import('@maps/types').AuditRecord;",
    fails: [],
  },
  'packages/types → sólo tipos e interfaces': {
    from: 'packages/types/src',
    inRepo: true,
    code: "export type AuditCategory = 'NEGOCIO' | 'IDENTIDAD';\nexport interface AuditRecord { id: string; category: AuditCategory }\nexport type { AuditRecord as Record } from './index.js';",
    fails: [],
  },
  'read-composition → ports/in de audit, assignment e identity (TDD-SW-007)': {
    from: 'read-composition',
    code: [
      "import type { AuditPort } from '../modules/audit/ports/in/AuditPort.js';",
      "import type { AssignmentQueryPort } from '../modules/assignment/ports/in/AssignmentQueryPort.js';",
      "import type { AccessScopePort } from '../modules/identity/ports/in/AccessScopePort.js';",
      'export type Deps = [AuditPort, AssignmentQueryPort, AccessScopePort];',
    ].join('\n'),
    fails: [],
  },
  'composition root → read-composition': {
    from: '',
    code: "import { getRequestHistory } from './read-composition/GetRequestHistory.js';\nexport const g = getRequestHistory;",
    fails: [],
  },
};

describe('reglas de arquitectura: imports prohibidos fallan', () => {
  it.each(Object.entries(blocked))('%s', async (_name, testCase) => {
    const messages = await lint(testCase);
    for (const rule of testCase.fails) expect(rulesOf(messages), messages.join('\n')).toContain(rule);
  });
});

describe('reglas de arquitectura: lista permitida de librerías', () => {
  it('escapa los nombres: una excepción "lodash.get" no abre "lodashXget"', () => {
    const blocked = new RegExp(notAllowedSpecifier(['lodash.get']));
    expect(blocked.test('lodash.get')).toBe(false);
    expect(blocked.test('lodash.get/sub')).toBe(false);
    expect(blocked.test('./relativo.js')).toBe(false);
    expect(blocked.test('lodashXget')).toBe(true);
    expect(blocked.test('lodash.getter')).toBe(true);
  });
});

describe('reglas de arquitectura: imports permitidos pasan', () => {
  it.each(Object.entries(allowed))('%s', async (_name, testCase) => {
    expect(await lint(testCase)).toEqual([]);
  });
});
