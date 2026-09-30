# ADR — Persistencia y fronteras transaccionales

| Dato | Valor |
| --- | --- |
| ID | `ADR-SW-003` |
| Título | Persistencia y fronteras transaccionales |
| Estado | `PROPUESTO` |
| Fecha | 2026-09-30 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera; pendiente de validación final |
| Work item | [MAPS-108](https://santitalavera.atlassian.net/browse/MAPS-108) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-108 |
| Fase origen | F3 — Arquitectura; baseline F0/F1/F2 |
| Decisiones relacionadas | ADR-SW-001; ADR-SW-004 |
| Depende de | ADR-SW-001 |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `PROPUESTO`, `ACEPTADO`, `RECHAZADO`, `REEMPLAZADO`.

## Contexto y problema

MAPS necesita persistir catálogo, formularios versionados, solicitudes, respuestas, asignaciones, intentos de entrega, adjuntos y auditoría. Algunas operaciones deben ser atómicas; otras producen efectos externos y requieren asincronía, idempotencia y reintentos.

La persistencia debe respetar los límites del monolito modular y no permitir que los casos de uso dependan directamente del ORM. También debe diferenciarse el rollback de una aplicación del rollback de los datos.

## Drivers y criterios

| Driver o criterio | Importancia | Evidencia / fuente |
| --- | --- | --- |
| Consistencia de los datos de negocio | Alta | Solicitudes, respuestas, precios y versiones deben conservar su significado histórico |
| Ownership por módulo | Alta | Cada capacidad debe controlar sus tablas e invariantes |
| Transacciones explícitas | Alta | Algunas operaciones requieren confirmación atómica |
| Evolución controlada del esquema | Alta | Migraciones versionadas y compatibles |
| Separación de efectos externos | Alta | Email y storage se coordinan mediante outbox |

## Alternativas consideradas

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| PostgreSQL único con ownership lógico por módulo | Consistencia y operación inicial simple | Requiere disciplina para evitar acceso cruzado | Propuesta elegida |
| Base de datos por módulo | Mayor aislamiento futuro | Complejidad de consistencia y operación distribuida | Reservada para una extracción futura |
| Acceso directo a Prisma desde servicios | Implementación rápida | Acoplamiento tecnológico y pérdida de ownership | Descartada |

## Decisión

Se propone PostgreSQL como persistencia relacional principal, inicialmente única para la aplicación. Prisma será el ORM de infraestructura y sólo se utilizará mediante adaptadores y repositorios que implementen puertos definidos por los módulos.

Cada módulo tendrá ownership lógico sobre sus tablas, invariantes y operaciones de escritura. Un módulo sólo escribe sus propios datos; la lectura de datos ajenos se realiza mediante contratos del módulo owner.

Una transacción abarcará todas las modificaciones que deban confirmarse o rechazarse juntas dentro de un caso de uso. Los efectos externos —correo, almacenamiento u otros proveedores— no forman parte de una transacción PostgreSQL y se coordinarán mediante outbox.

Cuando una solicitud dependa de información que pueda cambiar, se conservarán snapshots, como mínimo del precio confirmado y de la versión de formulario utilizada. Los cambios posteriores del catálogo o de formularios no modificarán retroactivamente una solicitud enviada.

Las migraciones serán versionadas, revisadas y compatibles con el despliegue. Un rollback de contenedor no implica rollback automático de base de datos.

## Consecuencias y trade-offs

### Positivas

- Consistencia de datos de negocio.
- Transacciones locales y límites claros.
- Evolución controlada del esquema.
- Trazabilidad entre reglas, datos y casos de uso.

### Negativas y riesgos

- La base compartida puede convertirse en un punto de acoplamiento.
- PostgreSQL será un componente crítico de operación.
- Las transacciones demasiado amplias pueden reducir concurrencia.
- Las migraciones requieren coordinación entre código y despliegue.

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Acoplamiento por base compartida | Software | Aplicar ownership y prohibición de acceso a tablas ajenas |
| Migración destructiva incompatible | Software + Cloud | Diseñar migraciones por etapas y recuperación |
| Contrato final de formularios | MAPS + Kondor | Confirmar casos reales antes de cerrar TDD-SW-002 |
| Retención funcional | MAPS | Definir plazos antes del diseño definitivo de archivos |

## Criterios de revisión futura

La decisión podrá revisarse si aparecen necesidades de bases por módulo, persistencia especializada, límites de escalabilidad o requisitos de aislamiento. Si cambia, deberá crearse un nuevo ADR que reemplace a `ADR-SW-003`.

## Referencias y trazabilidad

- Fuentes F0/F1/F2: catálogo, formularios versionados, solicitudes, precios y derivación.
- TDD relacionados: `TDD-SW-001`, `TDD-SW-002`, `TDD-SW-003` y `TDD-SW-005`.
- Matriz: [traceability.md](../../../../traceability.md).

## Criterio de aceptación

El ADR puede pasar a `ACEPTADO` cuando se valide PostgreSQL, ownership, acceso a repositorios, límites transaccionales, snapshots y estrategia general de migraciones.
