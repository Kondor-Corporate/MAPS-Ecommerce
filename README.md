# MAPS - Portal de Solicitudes de Seguros

Portal para publicar productos aseguradores, permitir que una persona autenticada inicie y recupere una `InsuranceRequest`, y derivar de forma segura una solicitud formal a un productor. No es un e-commerce: no incluye checkout, pagos, contratación ni emisión automática.

El catálogo es público y todos los Products publicados del MVP son seguros enlatados con precio fijo vigente, administrado por Admin. Al iniciar una solicitud, el usuario se registra o inicia sesión y se crea una `InsuranceRequest` en **BORRADOR**; al enviar pasa a **ENVIADA** y conserva como snapshot funcional el precio confirmado. Si el precio cambia mientras existe un BORRADOR, el usuario debe ser informado y confirmar el nuevo valor antes de enviar. Un Admin la gestiona y asigna manualmente a un Productor. El sistema envía una notificación transaccional con información mínima y enlace al Portal, que no concede autenticación ni acceso por sí mismo; sólo tras la entrega requerida exitosa la solicitud pasa a **DERIVADA**. Desde su cuenta autenticada, y con autorización vigente por identidad, el Productor accede read-only únicamente a las solicitudes que le fueron derivadas y continúa la gestión comercial fuera del Portal.

## Alcance del MVP

- Catálogo y administración de productos por MAPS.
- Formularios dinámicos/versionados por producto, con contrato funcional acotado preliminar a validar con formularios reales.
- Registro/login, borradores recuperables, **Mis solicitudes** y envío formal.
- Bandeja Admin, asignación/reasignación, email transaccional y acceso seguro del Productor.
- Auditoría, cancelación por estado y analítica básica del funnel sin PII innecesaria ni automatismos comerciales.

Fuera del MVP: Leads/Potenciales clientes e integración con Intranet, PostgreSQL MAPS como dependencia funcional, Portal del Asegurado/pólizas/PDF, checkout, pagos, cotizador, simulador, cálculo personalizado, panel general de productores y constructor universal de formularios. Recovery de abandonos sólo podrá evaluarse en una evolución futura con métricas reales del funnel.

## Estado actual

Fase 4 en curso. El monorepo tiene el esqueleto de la API (monolito modular con capas hexagonales, ADR-SW-001/002) y del front React, conectados por un healthcheck. Todavía no hay funcionalidad de negocio. El prototipo UX/UI es una referencia visual/interactiva y el Design Handoff de Fase 2 documenta su comportamiento funcional sin definir implementación.

## Correr localmente

Requiere Node ≥ 22.12.

```bash
npm install
npm run dev        # API en http://localhost:3000 y web en http://localhost:5173
```

La web muestra "API operativa" cuando llega a `GET /api/v1/health`. Verificaciones: `npm run typecheck`, `npm run lint`, `npm run build`, `npm test`.

## Estructura del código

```
apps/api/src/
├── main.ts · app.ts       entrypoint y composition root HTTP
├── http/ · config/        health y configuración técnica
├── read-composition/      lecturas que componen varios módulos (GetRequestHistory, TDD-SW-007)
└── modules/<modulo>/      identity · catalog · forms · requests · assignment · documents · audit · notifications
    ├── domain/            reglas de negocio, sin librerías
    ├── application/       casos de uso
    ├── ports/in · out     lo que el módulo ofrece / lo que necesita
    └── adapters/in · out  HTTP, persistencia, proveedores
packages/types/            @maps/types: contratos compartidos de sólo tipos (AuditRecord, TDD-SW-007)
apps/web/src/              React + Vite; llama a la API por /api/v1
```

`npm run lint` hace cumplir los límites de [ADR-SW-001](./docs/03-arquitectura/software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md) y [ADR-SW-002](./docs/03-arquitectura/software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md) (reglas en `eslint/architecture.mjs`):

- Dentro de un módulo, las dependencias van hacia adentro.
- `domain/`, `application/`, `ports/` y `read-composition/` no importan librerías, frameworks ni infraestructura (Express, Prisma, `node:*`…): sólo código propio por ruta relativa. Vale para `import`, `import type`, `export … from`, `require()` e `import()` (que sólo aceptan un string literal) y tipos inline `import('x').T`. Las librerías van en `adapters/`.
- Entre módulos sólo se usa `ports/in`, en la dirección que fijan los documentos: Requests → Catalog, Forms, Identity · Catalog → Forms · Assignment → Requests, Identity · Documents → Requests, Identity.
- Única excepción hacia el `ports/out` de otro módulo: `documents/adapters/out` implementa `AttachmentCheckPort` de Requests ([TDD-SW-006](./docs/03-arquitectura/software/tdd/MAPS-115-adjuntos-documentos/TDD-SW-006-adjuntos-y-documentos.md)).
- Ningún módulo importa Audit ni Notifications. Cada módulo declara `OutboxPort` en su propio `ports/out` ([ADR-SW-004](./docs/03-arquitectura/software/adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md)) y la implementación se cablea en `app.ts`/`main.ts`, que son los únicos que importan todo.
- Audit ([TDD-SW-007](./docs/03-arquitectura/software/tdd/MAPS-115-auditoria-analytics/TDD-SW-007-auditoria-y-analytics.md)): el contrato `AuditRecord` va en `@maps/types` (`packages/types`), que sólo declara `type`/`interface` y no importa nada. Puertos, casos de uso y adaptadores lo importan sólo con `import type`; el dominio no lo usa. `read-composition/` sólo consume los `ports/in` de Audit, Assignment e Identity, y sólo la importa el composition root: ningún módulo la invoca.
- Una dirección nueva se agrega a `MODULE_DEPENDENCIES` en el mismo PR que actualiza el ADR/TDD-SW que la justifica.

Cada regla tiene casos permitidos y prohibidos en `apps/api/tests/architecture/boundaries.test.ts`, y la integración web ↔ API por el proxy de Vite se prueba en `apps/web/src/test/api-proxy.integration.test.ts`. Los dos corren con `npm test` y en CI (`.github/workflows/ci.yml`).

## Documentación vigente

- [Fase 0 — Baseline funcional vigente](./docs/00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md)
- [Fase 1 — Discovery y Relevamiento](./docs/01-producto/Fase_1__Discovery_y_Relevamiento.md)
- [Fase 2 — Design Handoff](./docs/02-diseno/Fase_2__Design_Handoff.md)
- [Fase 3 — Arquitectura (estructura y trabajo en curso)](./docs/03-arquitectura/README.md)

`docs/estructura.md`, `docs/tdd/` y el material UI/UX previo se conservan como históricos: no definen el alcance vigente cuando contradicen Fase 0/Fase 1.

Fase 3 organiza las decisiones y diseños técnicos a partir de F0/F1/F2. La estructura documental no implica que una propuesta arquitectónica esté aceptada ni que F1/F2 estén cerradas.

## Convenciones

- Commits y PRs: `tipo(scope): descripcion`.
- [Guía de contribución y workflow Jira → GitHub](./CONTRIBUTING.md): ramas, commits, PR, reviews y criterios de cierre de Historias.
- Mapa del repo para personas y agentes de código: [AGENTS.md](./AGENTS.md).
