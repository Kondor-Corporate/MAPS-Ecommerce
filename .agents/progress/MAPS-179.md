# MAPS-179 — A2 — Scaffold de API (monolito modular) y front React con healthcheck

> Memoria de trabajo de la historia. La lee cualquier sesión (o dev) que retome. Mantener corta.

- **Jira:** [MAPS-179](https://santitalavera.atlassian.net/browse/MAPS-179)
- **Rama:** `feat/MAPS-179-scaffold-api-web` (base `development`)
- **PR:** <link cuando exista>
- **Estado:** en curso
- **Documentos aplicados:** ADR-SW-001 (mapa de módulos, reglas de límites), ADR-SW-002 (capas hexagonales, reglas de imports en lint), CONTRIBUTING §4-6

## Criterio de aceptación → tests
- [ ] `GET /health` responde OK — `apps/api/tests/health.contract.test.ts`
- [ ] El front muestra una página base que consume la API — `apps/web/src/app/routes/HomePage.test.tsx`

## Hecho
- PR #36: harness de agentes (parte previa de esta misma clave).
- PR #37: sincroniza `development` con `main` (era un commit huérfano vacío). Mergeado como merge commit.

## Decisiones y desvíos
- Health montado en `/health` (sonda de plataforma, sin dependencias, PROTOCOL-CLD-000) y en `/api/v1/health` (lo consume la SPA vía proxy `/api`, base de TDD-SW-008 aún sin mergear). Sin CORS: mismo host, como ADR-CLD-001.
- El health vive en `apps/api/src/http/` (técnico y transversal), no en un módulo de negocio.
- Reglas de imports de ADR-SW-002 con `eslint-plugin-boundaries`.
- `engines.node` sube a `>=22.12`: Node 20 está fuera de soporte desde 2026-04 y Vitest/Vite actuales lo exigen. Actualiza AGENTS.md §3.
- TypeScript 6.0 (typescript-eslint todavía no soporta 7.x).
- `common/`, `database/`, `integrations/` de `apps/api/src` quedan intactos (A3 / fuera de alcance).

## Defaults configurables asumidos
- `PORT` = 3000 (técnico, no de negocio).

## Bloqueos / dudas
- Ninguno.

## Próximo paso
- Tests de API y web primero; luego implementación.
