# TDD — Modelo de dominio y datos del MVP

| Dato | Valor |
| --- | --- |
| ID | `TDD-SW-001` |
| Título | Modelo de dominio y datos del MVP |
| Estado | `BORRADOR` |
| Fecha | 2026-09-30 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera; pendiente de validación final |
| Work item | [MAPS-109](https://santitalavera.atlassian.net/browse/MAPS-109) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-109 |
| Fase origen | F3 — Arquitectura; baseline F0/F1/F2 |
| Decisiones relacionadas | ADR-SW-001; ADR-SW-003 |
| Depende de | ADR-SW-001, ADR-SW-003 |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `BORRADOR`, `EN REVISIÓN`, `APROBADO`, `REEMPLAZADO`.

## Propósito y límites

Este TDD define el modelo conceptual inicial del Portal MAPS y sus responsabilidades de datos. Detalla entidades, ownership, relaciones, invariantes, snapshots y límites transaccionales sin fijar todavía nombres definitivos de tablas ni propiedades de formularios que permanezcan pendientes de validación funcional.

## Baseline y dependencias

| Regla / dependencia | Fuente y estado | Impacto en el diseño |
| --- | --- | --- |
| Product publicado y FormVersion utilizable | F1/F2 | Product debe referenciar una versión válida |
| FormVersion publicada inmutable | F1/F2 | Una solicitud conserva la versión utilizada |
| Cinco estados de InsuranceRequest | F1/F2 | No confundir estados de negocio con estados técnicos de delivery |
| Precio confirmado en ENVIADA | F1/F2 | La solicitud conserva un snapshot del precio |
| Campos definitivos de formularios | `PENDIENTE FUNCIONAL MAPS` | Se diseña la estructura general, no el contrato final |

## Entidades y ownership

| Entidad | Owner lógico | Responsabilidad |
| --- | --- | --- |
| UserIdentity | Identity | Identidad, cuenta, sesión y estado |
| Customer | Identity | Datos y ownership del cliente |
| Producer | Identity | Datos, disponibilidad y vínculo del productor |
| Category | Catalog | Clasificación de productos |
| Product | Catalog | Seguro enlatado, precio y disponibilidad |
| FormDefinition | Forms | Definición lógica del formulario |
| FormVersion | Forms | Versión publicable e inmutable |
| InsuranceRequest | Requests | Solicitud, actor y estado de negocio |
| RequestAnswer | Requests | Respuestas de la solicitud |
| Attachment | Files | Metadata y referencia a archivos privados |
| Assignment | Assignment / Delivery | Asignación a productor |
| DeliveryAttempt | Assignment / Delivery | Resultado técnico de entrega |
| AuditEvent | Audit | Historial de acciones relevantes |
| OutboxEvent | Assignment / Delivery | Efectos externos pendientes de procesamiento |

## Relaciones principales

```text
Category 1 ── * Product
Product 1 ── 1 FormDefinition
FormDefinition 1 ── * FormVersion
Customer 1 ── * InsuranceRequest
Product 1 ── * InsuranceRequest
InsuranceRequest 1 ── * RequestAnswer
InsuranceRequest 1 ── * Attachment
InsuranceRequest 1 ── * Assignment
Assignment 1 ── * DeliveryAttempt
```

Una solicitud enviada debe conservar referencias o snapshots suficientes para reconstruir el producto, precio y formulario utilizados en ese momento.

## Invariantes principales

- Un Product no puede utilizar una FormVersion no publicada o retirada para nuevas solicitudes.
- Una FormVersion publicada es inmutable; un cambio produce una nueva versión.
- Una solicitud `ENVIADA` conserva el precio confirmado y la FormVersion utilizada.
- `BORRADOR` puede guardarse incompleto; `ENVIADA` requiere las validaciones correspondientes.
- `CANCELADA` es un estado final de negocio.
- El Productor sólo puede acceder a solicitudes `DERIVADA` que estén autorizadas y asignadas a su identidad.
- `Assignment`, `DeliveryAttempt`, `OutboxEvent` e `InsuranceRequest` son conceptos distintos y no deben representarse como un único estado.

## Límites transaccionales

Las operaciones que requieran atomicidad deben coordinarse dentro de un caso de uso, entre ellas:

- envío de solicitud, respuestas, snapshot de precio y versión de formulario;
- publicación de FormVersion y actualización de disponibilidad relacionada;
- asignación de solicitud y creación del evento outbox;
- registro de una cancelación y su auditoría.

La entrega de correo y otros efectos externos se procesa fuera de la transacción mediante outbox, reintentos e idempotencia.

## Seguridad y privacidad

El modelo debe almacenar únicamente los datos necesarios para operar el Portal, aplicar ownership por actor y mantener adjuntos privados. Los eventos de auditoría y analytics no deben incluir respuestas completas ni PII innecesaria.

## Pruebas y criterios de fallo

- Verificar invariantes de Product y FormVersion.
- Verificar snapshots de precio y formulario.
- Verificar transiciones inválidas de InsuranceRequest.
- Verificar aislamiento de Customer y Producer.
- Verificar idempotencia de eventos outbox.
- Verificar que fallos de entrega no alteren indebidamente el estado de negocio.

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| Propiedades definitivas de formularios | MAPS + Kondor | Versionado, ownership y relaciones | Validar 1–2 casos reales |
| Campos de Mi perfil | MAPS | Identity, roles y ownership | Confirmar campos visibles/editables |
| Retención de solicitudes y archivos | MAPS | Metadata y autorización | Definir plazos y eliminación |

## Referencias y trazabilidad

- ADR: `ADR-SW-001` y `ADR-SW-003`.
- Fuentes F0/F1/F2: catálogo, formularios, solicitudes, derivación y permisos.
- Matriz: [traceability.md](../../../../traceability.md).

## Criterio de aprobación

El TDD puede pasar a `APROBADO` cuando el equipo valide el modelo conceptual, ownership, relaciones, invariantes, snapshots, límites transaccionales y pendientes funcionales explícitos.
