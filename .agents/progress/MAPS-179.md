# MAPS-179 — A2 — Scaffold de API (monolito modular) y front React con healthcheck

> Memoria de trabajo de la historia. La lee cualquier sesión (o dev) que retome. Mantener corta.

- **Jira:** [MAPS-179](https://santitalavera.atlassian.net/browse/MAPS-179)
- **Rama:** `feat/MAPS-179-scaffold-api-web` (base `development`)
- **PR:** <link cuando exista>
- **Estado:** en curso
- **Documentos aplicados:** ADR-SW-001 (mapa de módulos, reglas de límites), ADR-SW-002 (capas hexagonales, reglas de imports en lint), CONTRIBUTING §4-6

## Criterio de aceptación → tests
- [x] `GET /health` responde OK — `apps/api/tests/health.contract.test.ts` (3 tests)
- [x] El front muestra una página base que consume la API — `apps/web/src/app/routes/HomePage.test.tsx` (4 tests: ok, cargando, error HTTP, sin conexión)

## Hecho
- PR #36: harness de agentes (parte previa de esta misma clave).
- PR #37: sincroniza `development` con `main` (era un commit huérfano vacío). Mergeado como merge commit.
- Tests escritos primero; fallaron por falta de implementación (`Cannot find module ../src/app.js`, `Failed to resolve ./HomePage`).
- API Express 5 con `createApp()` + `main.ts`; carpetas hexagonales en los 8 módulos.
- Web React + Vite con proxy `/api`; `HomePage` con estados cargando / ok / error.
- Reglas de límites verificadas con imports prohibidos temporales (borrados): Express en domain, domain→application, application→adapters/out de otro módulo y domain→ports/in de otro módulo fallan; application→ports/in de otro módulo pasa.
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
  y ADR-SW-004 (cualquier módulo → `notifications/ports/in` para el outbox); nadie importa Audit.
  `boundaries/no-unknown-files` y `no-unknown-dependencies` activos.
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
- La dirección `* → notifications/ports/in` interpreta ADR-SW-004 ("puerto estrecho" del outbox); TDD-SW-005 puede precisarla.
- Postgres/Prisma en A3.

## Próximo paso
- PR contra `development` → subagente `revisor` en contexto nuevo → review humana.
