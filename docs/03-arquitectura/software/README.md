# F3 — Software y dominio

> **Estado:** en curso. Redactados sin aprobar: [ADR-SW-001](./adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](./adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md) y [ADR-SW-003](./adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md) (`PROPUESTO`); [TDD-SW-001](./tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md) (`BORRADOR`). El resto del catálogo sigue previsto.

**Owner principal:** Joaquin Rodriguez. Santiago realiza revisión cruzada cuando la decisión afecta cloud, runtime, datos, seguridad, operaciones o despliegue. La [baseline F0/F1/F2](../README.md) y la [trazabilidad](../traceability.md) rigen el alcance.

El área diseña límites de módulos, dominio, transacciones, persistencia desde la aplicación, API, identidad y autorización funcional, adjuntos, Delivery/Outbox, auditoría y analytics. Monolito modular, arquitectura hexagonal, TypeScript, API única, PostgreSQL y Prisma como adaptador son **propuestas a evaluar**, no decisiones aceptadas.

## Catálogo de ADR previstos

| Ola | ID previsto | Decisión por trabajar |
| --- | --- | --- |
| 1 | ADR-SW-001 | Monolito modular y límites. |
| 1 | ADR-SW-002 | Arquitectura hexagonal y separación domain/application/ports/adapters. |
| 1 | ADR-SW-003 | Persistencia y transacciones. |
| 2 | ADR-SW-004 | Outbox, asincronía e idempotencia. |
| 2 | ADR-SW-005 | Identidad y autorización de la aplicación. |
| 2 | ADR-SW-006 | Archivos y adjuntos desde software. |

## Catálogo de TDD previstos

| Ola | ID previsto | Diseño por trabajar |
| --- | --- | --- |
| 2 | TDD-SW-001 | Modelo de dominio y datos. |
| 3 | TDD-SW-002 | Product, catálogo y FormVersion. |
| 3 | TDD-SW-003 | InsuranceRequest y máquina de estados. |
| 3 | TDD-SW-004 | Identidad, RBAC y ownership. |
| 3 | TDD-SW-005 | Assignment, Delivery y Outbox. |
| 3 | TDD-SW-006 | Adjuntos y documentos. |
| 4 | TDD-SW-007 | Auditoría y analytics. |
| 4 | TDD-SW-008 | Contrato API. |

Los IDs de catálogo no sustituyen al work item real. Cada documento nuevo se crea dentro de una carpeta de unidad de trabajo bajo [adr/](./adr/) o [tdd/](./tdd/), con ID permanente independiente. Empezar con las plantillas compartidas de [ADR](../templates/ADR-template.md) y [TDD](../templates/TDD-template.md), y enlazar ADR/TDD cloud relacionados.

Las reglas funcionales ya definidas se conservan: cinco estados de `InsuranceRequest`; acceso del Productor sólo a DERIVADAS asignadas y autorizadas; guardado manual de BORRADOR; precio confirmado en ENVIADA; versiones retiradas sin migración de respuestas; entrega exitosa antes de DERIVADA. No decidir por MAPS los campos definitivos del perfil, el contrato definitivo de formularios, el alcance de la inhabilitación. La reasignación de DERIVADA se modela según la decisión de alcance Kondor del MVP en F1 RN-19. Las bajas de Cliente y Productor son lógicas, sin borrado de información (RN-18/RN-19). La retención funcional sigue pendiente MAPS; MAPS indicó una futura solicitud de alta del Cliente, diferida por alcance del MVP.
