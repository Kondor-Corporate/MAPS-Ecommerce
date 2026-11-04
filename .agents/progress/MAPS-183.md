# MAPS-183 — B1 Catálogo público de productos

> Memoria de trabajo de la historia. La lee cualquier sesión (o dev) que retome. Mantener corta.

- **Jira:** [MAPS-183](https://santitalavera.atlassian.net/browse/MAPS-183)
- **Rama:** `feat/MAPS-183-catalogo-publico` (apilada sobre `feat/MAPS-179-scaffold-api-web`, PR #39; rebasear sobre `development` cuando se mergee)
- **PR:** — (pendiente: definir base mientras #39 no esté mergeado)
- **Estado:** implementado, verificaciones en verde; falta PR + revisor
- **Documentos aplicados:** TDD-SW-002 (consulta pública, modelo), TDD-SW-008 (rutas, listados, montos, problem+json), F2 PUB-01, F1 RN-09 / RF-PROD-01 / RF-CAT-01

## Criterio de aceptación → tests
- [x] Un visitante sin login ve el catálogo — `apps/api/tests/catalog.contract.test.ts`, `apps/web/src/app/App.test.tsx`
- [x] Sólo se listan productos publicados — `apps/api/tests/integration/catalogoPublico.prisma.test.ts`
- [x] Nombre, categoría y precio fijo **vigente** — contrato (forma) + integración (revisión vigente, sin precio no se lista, 2 decimales, revisión inmutable)
- [x] El front agrupa por categoría con estados cargando / vacío / error — `apps/web/src/features/catalogo/CatalogoPage.test.tsx`
- [x] Arranca con productos cargados por seed — `apps/api/tests/integration/seed.test.ts`
- [x] Contrato TDD-SW-008: `{items, page}`, defaults 1/20, 400 `PETICION_INVALIDA`, 500 `ERROR_INTERNO`; orden, `categoryId`, `q`, paginación

Resultados: API 16/16, web 8/8, integración 13/13; typecheck, lint y build en verde.

## Hecho
- Plan y tests aprobados por Joaquín (2026-11-04).
- Prisma 7.10.1 (versión estable fijada; `latest` apuntaba a 8.0.0-rc) + `@prisma/adapter-pg`; schema y migración de catálogo con CHECK y trigger de inmutabilidad; seed idempotente.
- `docker-compose.yml` (Postgres 17.6, puerto 5433, bases `maps` y `maps_test`).
- Módulo `catalog`: dominio (vista pública), `CatalogPublicQuery`, `ListPublishedProducts`, adaptador Prisma de lectura, router `GET /api/v1/catalog/products`.
- HTTP transversal mínimo: `problem+json` (`PETICION_INVALIDA`, `ERROR_INTERNO` con `traceId`) y parser de listados.
- `createApp(deps)`: recibe dependencias (test de `/health` ajustado).
- Front: `CatalogoPage` (PUB-01) como página de inicio; se quitó la página base de MAPS-179 (HomePage + servicio health).
- Captura: escritorio y 520px OK. A 390px Edge headless no achica la ventana (límite de Windows); verificar en un celular real.
- Docs: TDD-SW-002 (decisión cerrada + notas de implementación), AGENTS.md (comandos de base, regla "nunca latest"), apps/api/AGENTS.md (Base de datos).

## Decisiones y desvíos
- Nombres en inglés en código, base y API (convención TDD-SW-008); correspondencia con TDD-SW-002 documentada en el TDD.
- Sin `available`: depende de Forms. Con la precondición de publicación no hay "publicado y no disponible" hasta que exista el retiro urgente.
- Productos sin formulario no se publican ni se cargan (decisión de Joaquín, 2026-11-04) → TDD-SW-002 actualizado.
- Seed: textos del prototipo tal cual; `priceText`/`priceNote` no se modelan. Sin `product_attribute` (la ficha la usa B2).
- `q` sólo en la API (sin caja de búsqueda en el front).
- Sin endpoint `GET /catalog/categories` (no lo necesita B1; el front agrupa desde los productos).
- Errores por campo en `errors[]` con códigos `VALOR_INVALIDO` y `PARAMETRO_NO_PERMITIDO` (aditivo a TDD-SW-008).
- No se pudo crear `apps/api/.env.example` (permisos `.env*`); la variable quedó documentada en apps/api/AGENTS.md.

## Defaults configurables asumidos
- Ninguno de negocio. Técnicos (contrato TDD-SW-008): `pageSize` 20 / máx. 100; `q` máx. 100 caracteres.

## Pendientes declarados (para el PR)
- Rate limit y caché del endpoint público (TDD-SW-008).
- Indicador `available` (con Forms).
- CLI-01 catálogo autenticado (con identidad).
- Coordinar con Santiago (A3): ubicación `apps/api/prisma/`, docker-compose, `DATABASE_URL`.

## Próximo paso
- Decidir base del PR (#39 sin mergear), push, PR con plantilla, revisor en contexto nuevo, web link en Jira.
