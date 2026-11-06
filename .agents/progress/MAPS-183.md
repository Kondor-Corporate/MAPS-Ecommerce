# MAPS-183 — B1 Catálogo público de productos

> Memoria de trabajo de la historia. La lee cualquier sesión (o dev) que retome. Mantener corta.

- **Jira:** [MAPS-183](https://santitalavera.atlassian.net/browse/MAPS-183)
- **Rama:** `feat/MAPS-183-catalogo-publico-v2`. #39 ya está mergeado en `development`; la rama se sincronizó con `development` (e7de7a1) y la base del PR pasa a `development`.
- **PR:** [#44](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/44) (reemplaza al #43, cerrado porque se había commiteado sin revisión previa; ver `.agents/aprendizajes.md`).
- **Estado:** en revisión humana. Santiago pidió cambios el 2026-11-04 sobre 20be000; las correcciones van en un bloque nuevo con revisión previa.
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

Resultados: API 106/106 (incluye las pruebas de arquitectura de #39), web 12/12, integración 16/16; typecheck, lint y build en verde.

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

## Revisión de Santiago (#44, 2026-11-04) → correcciones
- (1) Precio vigente de otro producto: FK compuesta `product(current_price_revision_id, id)` → `product_price_revision(id, product_id)` + test negativo.
- (2) Publicación sin Forms: seed declarado demostrativo; reconciliación obligatoria antes de `CreateDraft` documentada en TDD-SW-002.
- (3) Borrado de revisiones: el trigger rechaza `UPDATE` y `DELETE`; FK del vigente con `ON DELETE RESTRICT` + test negativo.
- (4) Handoff A3: una sola historia de migraciones en `apps/api/prisma/` (A3 la extiende), Prisma a ratificar (TDD-SW-002, apps/api/AGENTS.md, comentario en MAPS-180).
- Menores: test de la categoría dentro de la tarjeta; progreso con el #44.

## Pendientes declarados (para el PR)
- Indicador `available` (con Forms) · CLI-01 (con identidad) · `traceparent` entrante · límite distribuido/borde.
- Reconciliación del catálogo semilla con Forms antes de habilitar `CreateDraft` (TDD-SW-002).
- `trust proxy`: el límite cuenta por `req.ip`; detrás de un balanceador o Cloud Run hay que configurar `trust proxy` para no compartir la IP del proxy (A3 / ADR-CLD-001/007).
- Prisma 7 queda adoptado de hecho; ADR-SW-003 lo deja como candidato. Ratificar en A3 (MAPS-180), que extiende las migraciones existentes.
- Decisión "sin formulario no se publica": cerrada por Kondor, pendiente de conformidad de MAPS.
- Verificar la pantalla a 390px en un celular real.

## Próximo paso
- Correcciones de la revisión de Santiago: revisión previa → commit → push → base del #44 a `development` → respuesta en el PR → comentario de handoff en MAPS-180.
