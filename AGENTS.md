# AGENTS.md — Portal de Solicitudes MAPS

Mapa del repositorio para agentes de código (Claude Code, Codex, etc.) y para personas.
Es un **mapa, no el proyecto**: dice dónde está cada cosa. El detalle se lee recién cuando hace falta.

## 1. Qué es (y qué no)

Portal donde MAPS publica seguros enlatados con precio fijo. Una persona autenticada inicia una
`InsuranceRequest` (BORRADOR), la envía (ENVIADA), un Admin la asigna a un Productor (ASIGNADA)
y, tras el email exitoso, queda DERIVADA. El Productor la ve read-only.

**No es un e-commerce:** no hay checkout, pagos, cotizador, pólizas, PDF ni leads. Si una tarea
parece necesitar algo de eso, frená y preguntá. Alcance completo: [README](./README.md).

## 2. Mapa de documentos

| Necesitás… | Leé |
| --- | --- |
| Reglas de negocio (RN-xx) y requisitos (RF-xx) | [F1 — Discovery](./docs/01-producto/Fase_1__Discovery_y_Relevamiento.md) |
| Pantallas, estados de UI, matriz de permisos | [F2 — Design Handoff](./docs/02-diseno/Fase_2__Design_Handoff.md) |
| Límites de módulos | [ADR-SW-001](./docs/03-arquitectura/software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md) |
| Estructura interna (hexagonal) | [ADR-SW-002](./docs/03-arquitectura/software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md) |
| Persistencia y transacciones | [ADR-SW-003](./docs/03-arquitectura/software/adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md) |
| Outbox, asincronía, idempotencia | [ADR-SW-004](./docs/03-arquitectura/software/adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md) |
| Identidad y autorización | [ADR-SW-005](./docs/03-arquitectura/software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) |
| Modelo de dominio y datos | [TDD-SW-001](./docs/03-arquitectura/software/tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md) |
| Product, Category, FormVersion | [TDD-SW-002](./docs/03-arquitectura/software/tdd/MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md) |
| InsuranceRequest y máquina de estados | [TDD-SW-003](./docs/03-arquitectura/software/tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md) |
| Assignment, Delivery y outbox | [TDD-SW-005](./docs/03-arquitectura/software/tdd/MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md) |
| Plataforma cloud (GCP) | [ADR-CLD-000](./docs/03-arquitectura/cloud/adr/MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md), [STRATEGY](./docs/03-arquitectura/cloud/STRATEGY.md) |
| Workflow Jira ↔ GitHub, ramas, commits | [CONTRIBUTING](./CONTRIBUTING.md) |

Cada tarjeta Jira del backlog F4 (`f4-backlog`) lista sus documentos en "Documentos de contexto".
Leé **esos**, no todos. `docs/estructura.md` y `docs/tdd/` son históricos: no rigen si contradicen F0/F1.

**Nombres:** en este repo **TDD-SW / TDD-CLD = Technical Design Document**. A la práctica de
escribir tests antes del código la llamamos **"tests primero"**, nunca "TDD".

## 3. Stack y estructura

Monorepo npm workspaces · TypeScript estricto · Node ≥ 22.12.
API: Node + Express 5 (`apps/api`) · Web: React + Vite (`apps/web`) · PostgreSQL · Prisma (candidato, ver A3).
Tests con Vitest (API con supertest; web con Testing Library).

```
apps/api/src/main.ts · app.ts     entrypoint y composition root HTTP
apps/api/src/http/                endpoints técnicos transversales (health)
apps/api/src/modules/<modulo>/   identity · catalog · forms · requests · assignment · documents · audit
apps/api/src/modules/notifications/   mecanismo transversal de outbox (ADR-SW-004)
apps/web/src/features/            auth · catalogo · solicitudes · admin · productor
```

Los límites entre módulos y capas se controlan en el lint (`eslint.config.mjs`, `eslint-plugin-boundaries`):
un import que rompe ADR-SW-001/002 hace fallar `npm run lint`.

Reglas específicas: [apps/api/AGENTS.md](./apps/api/AGENTS.md) · [apps/web/AGENTS.md](./apps/web/AGENTS.md).

## 4. Comandos

Desde la raíz:

```
npm install         instala todo el monorepo
npm run dev         API (:3000) y web (:5173) juntas; también dev:api / dev:web
npm run typecheck   npm run lint   npm run build   npm test
```

Un solo workspace: `npm test -w @maps/api` · `npm run dev -w @maps/web`.
La web llama a la API por `/api/v1` (proxy de Vite en local, mismo host en los ambientes).
`GET /health` y `GET /api/v1/health` responden `{ "status": "ok" }` sin dependencias.

Base de datos local (Postgres en docker, puerto 5433; detalle en [apps/api/AGENTS.md](./apps/api/AGENTS.md)):

```
docker compose up -d --wait                 Postgres con las bases maps y maps_test
npm run db:migrate -w @maps/api             aplica migraciones (necesita DATABASE_URL)
npm run db:seed -w @maps/api                carga el catálogo semilla
npm run test:integration -w @maps/api       migra y corre la integración (DATABASE_URL a maps_test)
```

## 5. Reglas no negociables

1. Un módulo no importa repositorios, modelos ni tablas de otro módulo: usa sus `ports/in` (ADR-SW-001).
2. `domain/` no importa Express, Prisma, SDKs ni nada de infraestructura (ADR-SW-002).
3. Las transiciones de `InsuranceRequest` sólo ocurren por la máquina de estados de TDD-SW-003.
4. Todo efecto externo (email) sale por outbox, idempotente (ADR-SW-004).
5. Toda lectura de solicitudes filtra por ownership/rol (ADR-SW-005).
6. Valores de negocio que MAPS no definió (retención, límites, reintentos) van al módulo de
   parámetros configurables (MAPS-182), nunca hardcodeados.
7. Sin datos personales en logs ni en eventos de analítica.
8. Si el código necesita apartarse de un ADR/TDD-SW, se actualiza el documento **en el mismo PR**
   y se declara en la descripción. Nunca desvíos silenciosos.

## 6. Zonas sensibles (tests primero obligatorio)

Máquina de estados · snapshot y reconfirmación de precio · permisos/ownership · idempotencia del
outbox. En estas zonas los tests salen del criterio de aceptación y un humano los aprueba **antes**
de implementar.

## 7. Flujo de una historia

```
Tarjeta Jira (criterio de aceptación + documentos de contexto)
  → rama/worktree propio:  <tipo>/MAPS-<id>-<desc>   (base: ver CONTRIBUTING §4)
  → .agents/progress/MAPS-<id>.md   (memoria entre sesiones)
  → tests desde el criterio de aceptación  →  STOP: aprobación humana
  → implementar hasta verde
  → git add  →  revisor independiente sobre lo stageado  →  CAMBIOS: corregir y re-revisar (máx. 3)
  → APROBAR  →  commit  →  push  →  PR con el veredicto  →  review del otro dev  →  merge
```

**Nada se commitea sin que un revisor independiente apruebe exactamente ese contenido.** El
hook vigente exime los commits que sólo tocan `docs/` (trabajo documental de F3). Los cambios
que llegan después del PR vuelven a pasar por la revisión.

**Trazabilidad Jira ↔ GitHub (obligatoria):** la descripción del PR enlaza la tarjeta con su link
completo, `[MAPS-<id> — título](https://santitalavera.atlassian.net/browse/MAPS-<id>)`, nunca sólo
la clave. Y la tarjeta enlaza el PR en sus *Web links*.

Detalle paso a paso (fuente única del flujo): `.claude/skills/nueva-historia/SKILL.md`.
Claude la descubre en `.claude/skills/`; Codex la descubre mediante el adaptador
`.agents/skills/nueva-historia/`, que remite a la misma fuente.

**Mejora continua:** lo que se escapó o se repitió se anota en [`.agents/aprendizajes.md`](./.agents/aprendizajes.md)
y, si vuelve a pasar, se promueve de texto a checklist del revisor y de ahí a lint, test o hook.

## 8. Límites del agente

- Si el mismo test o comando falla **3 veces** con el mismo error: frená, resumí lo que intentaste
  y devolvé el control. No sigas probando variantes a ciegas.
- No inventes comportamiento funcional para destrabar algo pendiente de MAPS: usá un default
  configurable y declaralo en el PR.
- No pushees a `main` ni a `development`, no fuerces push, no toques `.env`, no corras nada contra
  bases que no sean locales o de test. Claude agrega límites en `.claude/settings.json` y Codex
  en `.codex/config.toml`, `.codex/rules/` y `.codex/hooks.json`.
- Nunca instales dependencias con `latest` ni sin versión (`npm i paquete`, `paquete@latest`, `npx paquete`):
  fijá siempre una versión estable explícita (`paquete@1.2.3`, sin `-rc`, `-beta`, `-next` ni `-dev`).

## 9. Definición de terminado

Criterio de aceptación cubierto por tests que pasan · typecheck/lint/build en verde · cada commit
aprobado por el revisor antes de commitearse, sin hallazgos bloqueantes · documentos actualizados si
hubo desvío · progreso y PR describen qué quedó pendiente. Una PR mergeada no cierra la Historia por sí sola (CONTRIBUTING §9).

## 10. Uso con Codex

- La sesión principal implementa con GPT-6.1 Sol (`.codex/config.toml`); para cada bloque stageado
  convocá **un revisor nuevo** con GPT-6 Astra (`.codex/agents/revisor.toml`). El revisor sigue la
  guía y el formato comunes de `.claude/agents/revisor.md`, registra la huella sólo con APROBAR y
  la sesión principal hace el commit. En zonas sensibles, respetá antes el STOP humano de §6.
- Al abrir este proyecto en Codex local, confiá en el proyecto y revisá/activá el hook en `/hooks`;
  ejecutá `npm run prepare` para instalar también `.githooks/pre-commit` y verificá el modelo y
  los permisos efectivos con `/status` o `/debug-config`. El hook de Codex da feedback antes de
  ejecutar un comando; el de Git comprueba el índice real al commitear desde una sesión Codex,
  incluso si el shell invoca Git indirectamente. Los commits humanos y de Claude conservan su
  comportamiento previo. El perfil local
  `maps-desarrollo` bloquea lecturas de `.env*` en las raíces de trabajo hasta profundidad 8;
  en Linux/WSL/Windows los patrones se expanden al iniciar cada proceso, por lo que uno ya abierto
  puede leer archivos creados después. Puede requerir aprobación para escribir la huella bajo
  `.git/`. Si otro `sandbox_mode` está activo, el perfil beta no aplica.
- Las reglas `.codex/rules/` controlan comandos que salen del sandbox, y el hook de Codex
  intercepta los comandos shell; cotejan prefijos concretos, no todas las variantes de `git push`.
  En Codex Cloud o al operar mediante conectores, los permisos y hooks locales pueden no aplicar:
  respetá igualmente §8 y exigí protección de ramas, revisión humana y CI en GitHub.
- Comprobá la adaptación con `node --test .codex/tests/flujo.test.mjs` y
  `codex execpolicy check --rules .codex/rules/seguridad.rules -- <comando>`.
