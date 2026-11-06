# MAPS-179 — A2 — Scaffold de API (monolito modular) y front React con healthcheck

> Memoria de trabajo de la historia. La lee cualquier sesión (o dev) que retome. Mantener corta.

- **Jira:** [MAPS-179](https://santitalavera.atlassian.net/browse/MAPS-179)
- **Rama:** `feat/MAPS-179-scaffold-api-web` (base `development`)
- **PR:** [#39](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/39)
- **Estado:** en curso — corrigiendo la review de Santiago (REQUEST_CHANGES sobre `b8591cb`)
- **Documentos aplicados:** ADR-SW-001 (mapa de módulos, reglas de límites), ADR-SW-002 (capas hexagonales, reglas de imports en lint), ADR-SW-004 §1 (`OutboxPort` de salida), TDD-SW-005/006/007 (ubicación de puertos), CONTRIBUTING §4-6

## Criterio de aceptación → tests
- [x] `GET /health` responde OK — `apps/api/tests/health.contract.test.ts` (3 tests)
- [x] El front muestra una página base que consume la API — `apps/web/src/app/routes/HomePage.test.tsx` (4 tests: ok, cargando, error HTTP, sin conexión)

## Hecho
- PR #36: harness de agentes (parte previa de esta misma clave).
- PR #37: sincroniza `development` con `main` (era un commit huérfano vacío). Mergeado como merge commit.
- Tests escritos primero; fallaron por falta de implementación (`Cannot find module ../src/app.js`, `Failed to resolve ./HomePage`).
- API Express 5 con `createApp()` + `main.ts`; carpetas hexagonales en los 8 módulos.
- Web React + Vite con proxy `/api`; `HomePage` con estados cargando / ok / error.
- Reglas de límites probadas con fixtures automatizados: `apps/api/tests/architecture/boundaries.test.ts` (52 prohibidos + 12 permitidos + 1 test del escape), que usan las mismas reglas que el lint (`eslint/architecture.mjs`). Contra las reglas anteriores fallaban 15 (librerías en application/ports, import() dinámico, require, tipos inline y `* → notifications/ports/in`).
- Prueba manual: `npm run dev`, `curl :3000/health` y `:5173/api/v1/health` → 200 `{"status":"ok"}`; la página muestra "API operativa".
- AGENTS.md §3/§4 y README actualizados.

## Decisiones y desvíos
- Health montado en `/health` (sonda de plataforma, sin dependencias, PROTOCOL-CLD-000) y en `/api/v1/health` (lo consume la SPA vía proxy `/api`, base de TDD-SW-008, `BORRADOR` en `development`). Sin CORS: mismo host, como ADR-CLD-001.
- El health vive en `apps/api/src/http/` (técnico y transversal), no en un módulo de negocio.
- Reglas de imports de ADR-SW-002 con `eslint-plugin-boundaries`.
- Revisor (PR #39): APROBAR con 5 menores, todos atendidos. Lint de límites endurecido:
  `app.ts`/`main.ts` como composition root (nadie los importa); archivos sueltos en la raíz de un
  módulo no se pueden importar; `domain/` sólo importa por ruta relativa; dirección entre módulos
  según ADR-SW-001 (Requests→Catalog/Forms/Identity, Catalog→Forms, Assignment→Requests/Identity),
  TDD-SW-006 (Documents→Requests/Identity; Documents implementa `AttachmentCheckPort` de Requests)
  y ADR-SW-004 (cualquier módulo → `notifications/ports/in` para el outbox, **reemplazado**: ver la
  review de Santiago abajo); nadie importa Audit.
  `boundaries/no-unknown-files` y `no-unknown-dependencies` activos.
- Review de Santiago (PR #39, REQUEST_CHANGES), atendida:
  - Bloqueante 1 (ADR-SW-002): `domain/`, `application/` y `ports/` sólo importan por ruta relativa
    (lista permitida, hoy sin excepciones), incluyendo `import type`, `export from`, `require`,
    `import()` dinámico (literal obligatorio) y tipos inline `import('x').T`.
  - Bloqueante 2 (ADR-SW-004): se quita la excepción `* → notifications/ports/in`. Cada módulo
    declara `OutboxPort` en su `ports/out` y el composition root cablea la implementación de
    Notifications. Si hace falta un contrato `OutboxEvent` compartido, se decide en la historia del
    outbox (TDD-SW-005), p. ej. en `packages/types` como excepción acotada.
  - TDD-SW-006 corregido: `AttachmentCheckAdapter` pasa de `ports/in` a `adapters/out` de Documents
    (coincide con la única excepción del lint hacia un `ports/out` ajeno).
  - Reglas extraídas a `eslint/architecture.mjs` (función) para aplicarlas igual a `src` y a los
    fixtures; `boundaries/root-path` fijo en la raíz del repo (no depende del cwd).
  - CI nuevo: `.github/workflows/ci.yml` (typecheck, lint, build, test en PR y push a development/main;
    `actions/checkout` y `actions/setup-node` en v7, que ya no usan Node 20).
- Pendientes declarados en la respuesta a la review, resueltos en este PR:
  - TDD-SW-007: `@maps/types` (`packages/types`), paquete de sólo tipos (el lint rechaza valores,
    funciones, clases, enums y librerías); las capas puras lo importan sólo con `import type` y el
    dominio no lo usa. `apps/api/src/read-composition/` sólo consume `ports/in` de Audit, Assignment e
    Identity y sólo la importa el composition root. TDD-SW-007 anota la ubicación en el código.
  - Integración web ↔ API vía proxy automatizada: `apps/web/src/test/api-proxy.integration.test.ts`
    levanta la API real (tsx, puerto libre) y el dev server de Vite con su config, y pide
    `/api/v1/health` (200 `{ status: "ok" }`) y una ruta inexistente (404 de la API, no la SPA).
  - Test del escape de la lista permitida (`notAllowedSpecifier`): `lodash.get` no abre `lodashXget`.
- `engines.node` sube a `>=22.12`: Node 20 está fuera de soporte desde 2026-04 y Vitest/Vite actuales lo exigen. Actualiza AGENTS.md §3.
- TypeScript 6.0 (typescript-eslint todavía no soporta 7.x).
- `common/`, `database/`, `integrations/` de `apps/api/src` quedan intactos (A3 / fuera de alcance).

## Defaults configurables asumidos
- `PORT` = 3000 (técnico, no de negocio).

## Bloqueos / dudas
- Ninguno.

## Pendiente (fuera de esta historia)
- `npm audit` reporta 12 vulnerabilidades moderadas en dependencias de desarrollo; sin tratar acá.
- Logger/requestId y errores `problem+json` de TDD-SW-008 (hoy `BORRADOR`).
- El contenido de `AuditRecord` en `@maps/types` y `GetRequestHistory` los implementa la historia de Audit (acá sólo su lugar y sus reglas).
- Postgres/Prisma en A3.

## Próximo paso
- Responder la review de Santiago (general + 2 hilos inline) y pedir re-review del diff `b8591cb..HEAD`.
