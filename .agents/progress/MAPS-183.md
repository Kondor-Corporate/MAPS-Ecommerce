# MAPS-183 — B1 Catálogo público de productos

> Memoria de trabajo de la historia. La lee cualquier sesión (o dev) que retome. Mantener corta.

- **Jira:** [MAPS-183](https://santitalavera.atlassian.net/browse/MAPS-183)
- **Rama:** `feat/MAPS-183-catalogo-publico-v2` (apilada sobre `feat/MAPS-179-scaffold-api-web`, PR #39, ya sincronizada con `development`; rebasear/cambiar base a `development` cuando se mergee #39)
- **PR:** — (el #43 de la rama `feat/MAPS-183-catalogo-publico` se cierra: se commiteó sin revisión previa; ver `.agents/aprendizajes.md`)
- **Estado:** bloque 1 (API y datos) aprobado y commiteado (f8a7c5d); bloque 2 (front, menores de la revisión, progreso) en revisión
- **Documentos aplicados:** TDD-SW-002 (consulta pública, modelo), TDD-SW-008 (rutas, listados, montos, problem+json, 429/503), F2 PUB-01, F1 RN-09 / RF-PROD-01 / RF-CAT-01

## Criterio de aceptación (literal, de la tarjeta)

> Listado público (sin login) de productos publicados, agrupados por categoría.
>
> **Criterio de aceptación:** un visitante ve los productos publicados con nombre, categoría y precio fijo vigente. Arranca con productos cargados por seed.

Documentos de contexto: F1 §4, RN-09, RF-PROD-01, RF-CAT-01 · F2 PUB-01 y CLI-01 (§3) · TDD-SW-002 · prototipo `docs/02-diseno/ui-ux/prototipos/maps-seguros-portal-standalone.html`.

## Criterio de aceptación → tests
- [x] Un visitante sin login ve el catálogo — `apps/api/tests/catalog.contract.test.ts`, `apps/web/src/app/App.test.tsx`
- [x] Sólo se listan productos publicados — `apps/api/tests/integration/catalogoPublico.prisma.test.ts`
- [x] Nombre, categoría y precio fijo **vigente** — contrato (forma) + integración (revisión vigente, sin precio no se lista, 2 decimales, revisión inmutable)
- [x] Agrupados por categoría, con estados cargando / vacío / error — `apps/web/src/features/catalogo/CatalogoPage.test.tsx`
- [x] Arranca con productos cargados por seed — `apps/api/tests/integration/seed.test.ts`
- [x] Contrato TDD-SW-008: `{items, page}`, 400 `PETICION_INVALIDA` con `CAMPO_INVALIDO`, 429 `LIMITE_FRECUENCIA`, 503 `SERVICIO_NO_DISPONIBLE`, 500 `ERROR_INTERNO`, `traceId` por request

Resultados: API 41/41, web 9/9, integración 14/14; typecheck, lint y build en verde.

## Hecho
- Plan y tests aprobados por Joaquín (2026-11-04).
- Prisma 7.10.1 + `@prisma/adapter-pg`; schema y migración de catálogo con CHECK y trigger de inmutabilidad; seed idempotente; `docker-compose.yml` (Postgres 17.6, 5433, `maps`/`maps_test`).
- Módulo `catalog` y `GET /api/v1/catalog/products`; HTTP transversal: problem+json, correlación (`traceId`), límite de frecuencia, 503.
- Front `CatalogoPage` (PUB-01) como inicio; pide todas las páginas si hay más de 100.
- Correcciones de la primera revisión (sobre #43): Ahorro publicado en el seed; `CAMPO_INVALIDO`; 503; guarda de base local antes de migrar; paginación del front; `traceId` por request; límite de frecuencia; TDD-SW-008 y TDD-SW-002 actualizados.
- #39 sincronizado con `development` y lint de hooks corregido ahí.

## Decisiones y desvíos
- Nombres en inglés en código/BD/API; correspondencia documentada en TDD-SW-002.
- Sin `available`: depende de Forms (documentado en TDD-SW-002).
- Sin formulario no se publica ni se carga (decisión de Joaquín Rodriguez, Kondor, 2026-11-04; sin conformidad explícita de MAPS) → TDD-SW-002.
- Seed con la publicación del prototipo: 4 publicados (Combinado, Incendio, Mascotas, Ahorro); Accidentes Personales sin publicar; RC no se carga.
- `LIMITE_FRECUENCIA` (429) agregado a TDD-SW-008; `errors[]` de parámetros con `CAMPO_INVALIDO`.
- `q` sólo en la API; sin `GET /catalog/categories`; CLI-01 fuera de alcance.
- `traceparent` entrante no se usa todavía (TDD-CLD-007).

## Defaults configurables asumidos
- `PUBLIC_RATE_LIMIT_PER_MINUTE` = 120 por IP (env; pendiente módulo de parámetros MAPS-182). Ventana fija en memoria por instancia; el borde lo decide ADR-CLD-001/007.
- Técnicos del contrato: `pageSize` 20 / máx. 100; `q` máx. 100 caracteres.

## Pendientes declarados (para el PR)
- Indicador `available` (con Forms) · CLI-01 (con identidad) · `traceparent` entrante · límite distribuido/borde.
- `trust proxy`: el límite cuenta por `req.ip`; detrás de un balanceador o Cloud Run hay que configurar `trust proxy` para no compartir la IP del proxy (A3 / ADR-CLD-001/007).
- Prisma 7 queda adoptado de hecho; ADR-SW-003 lo deja como candidato (el ORM es detalle del adaptador). Ratificar con Santiago en A3.
- Coordinar con Santiago (A3): `apps/api/prisma/`, docker-compose, `DATABASE_URL`.
- Decisión "sin formulario no se publica": cerrada por Kondor, pendiente de conformidad de MAPS.
- Verificar la pantalla a 390px en un celular real.

## Próximo paso
- Bloque 2: revisión previa → commit → push → PR nuevo; cerrar #43 con comentario; web link nuevo en Jira.
