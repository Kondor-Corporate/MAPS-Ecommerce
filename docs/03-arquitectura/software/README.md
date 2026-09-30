# F3 — Software y dominio

> **Estado:** catálogo previsto; todavía no hay ADR/TDD de software redactados o aprobados en esta estructura.

**Owner principal:** compañero de Santiago. Santiago realiza revisión cruzada cuando la decisión afecta cloud, runtime, datos, seguridad, operaciones o despliegue. La [baseline F0/F1/F2](../README.md) y la [trazabilidad](../traceability.md) rigen el alcance.

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

Las reglas funcionales ya definidas se conservan: cinco estados de `InsuranceRequest`; acceso del Productor sólo a DERIVADAS asignadas y autorizadas; guardado manual de BORRADOR; precio confirmado en ENVIADA; versiones retiradas sin migración de respuestas; entrega exitosa antes de DERIVADA. No decidir por MAPS los campos definitivos del perfil, el contrato definitivo de formularios ni los efectos de baja/inhabilitación. La retención funcional también sigue pendiente MAPS.
