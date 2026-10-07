# TDD — Modelo de dominio y datos del MVP

| Dato | Valor |
| --- | --- |
| ID | `TDD-SW-001` |
| Título | Modelo de dominio y datos del MVP |
| Estado | `BORRADOR` |
| Fecha | 2026-09-30 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera (revisión cruzada cloud); pendiente de validación final |
| Work item | [MAPS-109](https://santitalavera.atlassian.net/browse/MAPS-109) · subtarea [MAPS-138](https://santitalavera.atlassian.net/browse/MAPS-138) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-109 |
| Fase origen | [F0 §0.4/0.5/0.6](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §2/3/4/5/7, RN-02 a RN-17](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §5/6/8/9/10/12/13](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md); TDD-SW-002/003/004/005/006 y TDD-CLD-003/004 (previstos, sin redactar) |
| Depende de | ADR-SW-001, ADR-SW-002 y ADR-SW-003, todos `PROPUESTO`: este TDD queda condicionado a su aceptación |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `BORRADOR`, `EN REVISIÓN`, `APROBADO`, `REEMPLAZADO`.

## Propósito y límites

Traduce el modelo conceptual de [F1 §7](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) a un modelo de dominio y datos implementable: entidades, ownership por módulo, relaciones, estados, invariantes, snapshots y fronteras transaccionales.

No fija nombres definitivos de tablas ni el esquema de campos de formularios, que depende de validación MAPS. El detalle por agregado se profundiza en TDD-SW-002 (Product/FormVersion), TDD-SW-003 (máquina de estados), TDD-SW-004 (identidad), TDD-SW-005 (Assignment/Delivery/Outbox) y TDD-SW-006 (documentos). Instancia de base, backups y storage físico pertenecen a cloud y se **enlazan** en lugar de duplicarse (ver [Dependencias cloud](#dependencias-cloud)).

## Baseline y dependencias

| Regla / dependencia | Fuente y estado | Impacto en el diseño |
| --- | --- | --- |
| Cinco estados funcionales de InsuranceRequest | [F1 §2](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §2/8](../../../../02-diseno/Fase_2__Design_Handoff.md) — CONFIRMADO | Sólo BORRADOR, ENVIADA, ASIGNADA, DERIVADA, CANCELADA; ningún estado técnico se suma |
| Login antes de BORRADOR; guardado incompleto; envío completo | RN-02/03, [F2 §9](../../../../02-diseno/Fase_2__Design_Handoff.md) — CONFIRMADO | BORRADOR siempre tiene Customer; validación de completitud sólo al enviar |
| FormVersion publicada inmutable; retiro normal/urgente | RN-08, [F2 §10](../../../../02-diseno/Fase_2__Design_Handoff.md) — CONFIRMADO | Versión inmutable; Product disponible requiere versión utilizable |
| Precio fijo; reconfirmación en BORRADOR; snapshot en ENVIADA | RN-09, RF-SOL-04 — CONFIRMADO | Snapshot de precio confirmado en la solicitud |
| Cancelación por estado; solicitud en DERIVADA | RN-10, RF-SOL-05 — CONFIRMADO | CancellationRequest como situación asociada, no estado |
| Entrega exitosa antes de DERIVADA; falla conserva ASIGNADA | RN-06/07, RF-DELIVERY-01 — CONFIRMADO | DeliveryAttempt con estado técnico separado |
| Productor ve sólo DERIVADAS asignadas y autorizadas | RN-05/16, RF-PRODUCER-01/02 — CONFIRMADO | Acceso derivado de Assignment vigente + estado + no revocado |
| Productor inhabilitado no recibe nuevas asignaciones | RN-15, [F2 §12](../../../../02-diseno/Fase_2__Design_Handoff.md) — CONFIRMADO | Flag de disponibilidad en Producer |
| Campos definitivos de formularios | `PENDIENTE FUNCIONAL MAPS` | Se modela estructura y versionado, no el contrato final |
| Campos de Mi perfil | `PENDIENTE FUNCIONAL MAPS` | Customer con perfil extensible; campos a confirmar |
| Baja de Cliente/Productor y efectos adicionales de inhabilitación | `PENDIENTE FUNCIONAL MAPS` | Sin borrado físico; efectos sobre casos existentes condicionados |
| Retención y eliminación de solicitudes/archivos; textos de consentimiento | `PENDIENTE FUNCIONAL MAPS` | Sin borrado físico en el MVP hasta definir plazos |
| PostgreSQL histórico MAPS | Descartado como dependencia ([ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md)) | El modelo vive en la base nueva del Portal |

## Vista de componentes y responsabilidades

| Entidad | Módulo owner | Responsabilidad |
| --- | --- | --- |
| UserIdentity | Identity | Cuenta, credenciales/sesión, rol (Cliente, Admin, Productor) y estado de cuenta |
| Customer | Identity | Datos del Cliente y perfil autogestionable habilitado |
| Producer | Identity | Datos del Productor, email verificado y disponibilidad para nuevas asignaciones |
| Category | Catalog | Agrupación de productos (ABM) |
| Product | Catalog | Seguro enlatado: información comercial, precio fijo vigente, publicación y disponibilidad |
| FormDefinition | Forms | Formulario asociado a un Product |
| FormVersion | Forms | Versión del formulario con su esquema; borrador editable, publicada inmutable o retirada |
| InsuranceRequest | Requests | Solicitud: Customer, Product, FormVersion, estado funcional y snapshots |
| RequestAnswer | Requests | Respuestas a los campos de la FormVersion referenciada |
| Consent | Requests | Consentimiento otorgado: texto/versión aceptada, actor y fecha |
| CancellationRequest | Requests | Solicitud de cancelación de una DERIVADA y la decisión del Admin |
| Document | Documents | Metadata y referencia a un archivo privado vinculado a una solicitud |
| Assignment | Assignment | Asignación de una solicitud a un Productor; historial de reasignaciones |
| DeliveryAttempt | Assignment | Intento técnico de derivación/notificación y su resultado |
| AuditEvent | Audit | Registro de acciones de negocio relevantes (actor, acción, entidad, fecha) |
| OutboxEvent | Owner técnico pendiente; lo define ADR-SW-004 | Intención de efecto externo registrada en la misma transacción del cambio; este TDD no asume un repositorio compartido escribible por todos los módulos |

El rol Admin es un rol de `UserIdentity`, no una entidad aparte. No se modelan Lead, Policy, Payment ni Contract ([F0 §0.2](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md)).

## Relaciones y cardinalidades

```text
UserIdentity 1 ── 0..1 Customer
UserIdentity 1 ── 0..1 Producer
Category     1 ── *    Product
Product      1 ── 0..1 FormDefinition        (obligatorio para publicar Product)
FormDefinition 1 ── * FormVersion
Customer     1 ── *    InsuranceRequest
Product      1 ── *    InsuranceRequest
FormVersion  1 ── *    InsuranceRequest      (versión fija desde la creación del BORRADOR)
InsuranceRequest 1 ── * RequestAnswer
InsuranceRequest 1 ── * Consent
InsuranceRequest 1 ── * Document
InsuranceRequest 1 ── * Assignment            (a lo sumo una vigente)
Producer     1 ── *    Assignment
Assignment   1 ── *    DeliveryAttempt
InsuranceRequest 1 ── 0..* CancellationRequest (sólo desde DERIVADA; a lo sumo una pendiente simultánea)
```

## Contratos y flujos

### Estados funcionales de InsuranceRequest

| Transición | Actor | Condición | Efectos registrados |
| --- | --- | --- | --- |
| (inicio) → BORRADOR | Cliente autenticado | Product disponible con FormVersion utilizable | FormVersion vigente queda fijada |
| BORRADOR → ENVIADA | Cliente | Requeridos, pasos, documentos y consentimientos completos; FormVersion utilizable; precio vigente confirmado | Snapshot de precio, fecha de envío, auditoría |
| ENVIADA → ASIGNADA | Admin | Productor disponible | Assignment vigente, intención de entrega, auditoría |
| ASIGNADA → ASIGNADA (reasignación) | Admin | Productor disponible | Assignment anterior cerrado, nuevo vigente, auditoría |
| ASIGNADA → DERIVADA | Sistema | DeliveryAttempt con entrega requerida exitosa | Acceso del Productor habilitado, auditoría |
| ENVIADA → CANCELADA | Cliente | Motivo y confirmación | Actor, fecha, motivo; aviso a Admin |
| ASIGNADA → CANCELADA | Cliente | Motivo y confirmación | Actor, fecha, motivo; aviso a Admin y Productor |
| DERIVADA → CANCELADA | Admin | CancellationRequest pendiente confirmada | Solicitante, Admin, fecha, motivo; revocación de acceso; aviso a Productor |

`CANCELADA` es final. Cualquier otra transición es inválida. El descarte de un BORRADOR **no** es una transición a CANCELADA: se representa como marca de descarte (fecha y actor) sobre el BORRADOR, sin motivo obligatorio. Un BORRADOR cuya FormVersion fue retirada es **no utilizable** por condición derivada de la versión, no por un estado nuevo. Ninguno de los dos implica borrado físico (retención pendiente MAPS).

### Situaciones asociadas que no son estados

| Situación | Dónde vive | Valores |
| --- | --- | --- |
| Solicitudes de cancelación DERIVADA | CancellationRequest | Historial de solicitudes solicitadas, aprobadas o rechazadas ([F2 §8](../../../../02-diseno/Fase_2__Design_Handoff.md)); puede existir como máximo una pendiente simultánea. Un rechazo conserva DERIVADA y no impide una nueva solicitud posterior |
| Entrega/derivación | DeliveryAttempt | Estados técnicos de [F1 §5](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md): pendiente, aceptado/enviado, entregado, rebotado, fallido |
| Incidencia de derivación | Derivada del último DeliveryAttempt fallido/rebotado en una ASIGNADA | Visible al Admin; la solicitud sigue ASIGNADA |

Qué estado técnico acredita la "entrega requerida exitosa" se define en TDD-SW-005 junto con ADR-SW-004; este TDD sólo fija que la transición a DERIVADA depende de él y no al revés.

### Estados de FormVersion y disponibilidad de Product

FormVersion: borrador (editable) → publicada (inmutable) → retirada (histórica, no seleccionable, no restaurable). Product disponible exige al menos una FormVersion publicada no retirada. El retiro normal de la última se rechaza; el retiro urgente la retira y deja el Product no disponible en la misma transacción ([F2 §10](../../../../02-diseno/Fase_2__Design_Handoff.md)).

## Datos, consistencia y migraciones

### Snapshots

| Dato | Momento | Motivo |
| --- | --- | --- |
| Precio confirmado | BORRADOR → ENVIADA | RN-09: ENVIADA conserva el precio aunque cambie el vigente |
| Referencia a FormVersion | Creación del BORRADOR | RN-03/08: la versión es inmutable, basta la referencia |
| Nombre/datos comerciales del Product mostrados al enviar | BORRADOR → ENVIADA | **Decisión técnica propuesta**, no requisito confirmado por F0/F1/F2; los campos concretos y su justificación quedan para TDD-SW-002 |
| Texto/versión del consentimiento aceptado | Al otorgarse | Auditabilidad ([F0 §0.6](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md)) |

Para mostrar el aviso de cambio de precio, el BORRADOR guarda el último precio que el Cliente vio o confirmó.

### Invariantes

- Un BORRADOR no puede crearse sin Customer autenticado ni sin FormVersion utilizable.
- Una FormVersion publicada no se modifica; un cambio produce una versión nueva.
- Las RequestAnswer corresponden a campos de la FormVersion referenciada; no se migran ni copian entre versiones.
- Una ENVIADA tiene snapshot de precio y FormVersion; nunca se recalculan.
- Hay a lo sumo un Assignment vigente por solicitud, y sólo con un Producer disponible al asignar.
- DERIVADA exige un DeliveryAttempt exitoso del Assignment vigente.
- El Productor accede sólo si la solicitud está DERIVADA, el Assignment vigente es suyo y el acceso no fue revocado.
- Una InsuranceRequest puede conservar un historial de CancellationRequest (`0..*`), sólo para solicitudes DERIVADA; hay como máximo una pendiente simultánea. Un rechazo no impide un nuevo intento, salvo decisión funcional explícita de MAPS.
- Assignment, DeliveryAttempt, OutboxEvent e InsuranceRequest no se colapsan en un único campo de estado.

### Fronteras transaccionales

Las operaciones atómicas y las asíncronas se listan en [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md#operaciones-atómicas-y-asíncronas); este TDD las adopta sin repetirlas. Efectos externos (email, storage) se procesan fuera de la transacción según ADR-SW-004.

### Migraciones

Esquema versionado en el repositorio con estrategia expand/contract ([ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md)). No hay migración de datos desde el PostgreSQL histórico de MAPS.

### Dependencias cloud

| Tema | Owner | Documento | Qué toma de este TDD |
| --- | --- | --- | --- |
| Capacidad PostgreSQL administrada / relacional gestionada, conexiones, backups, restore y ejecución de migraciones | Cloud | ADR-CLD-000 y TDD-CLD-003 (previstos) | Base única del Portal, ownership lógico, migraciones expand/contract |
| Object storage privado administrado, permisos y ciclo de vida | Cloud | ADR-CLD-000 y TDD-CLD-004 (previstos) | Document guarda metadata y referencia; el acceso pasa por el módulo Documents |
| Worker de entrega, email y reintentos | Cloud | TDD-CLD-005 (previsto) | DeliveryAttempt y OutboxEvent como contrato de datos |

Este TDD no decide servicio, tamaño, región ni configuración; al redactarse esos documentos se reemplaza "previsto" por el enlace real.

## Seguridad y privacidad

- Ownership por actor: el Cliente accede sólo a sus solicitudes; el Productor según la regla de acceso anterior; el Admin según RBAC (TDD-SW-004).
- Documentos privados: la base guarda metadata y referencia, nunca el binario; no hay URLs públicas permanentes.
- AuditEvent y eventos de funnel no incluyen respuestas completas, documentos, DNI, CUIT, teléfono ni datos de riesgo ([F1 §6](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md)).
- El email de derivación sólo usa los datos mínimos de [F1 §5](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md).

## Operación y observabilidad

Cada transición de estado, asignación, intento de entrega y decisión de cancelación genera un AuditEvent consultable por el Admin. Métricas e integración con telemetría quedan para TDD-SW-007 y TDD-CLD-007.

## Pruebas y criterios de fallo

- Transiciones válidas e inválidas de InsuranceRequest, incluido que CANCELADA no tenga salidas y que descartar un BORRADOR no lo lleve a CANCELADA.
- Envío rechazado si falta un requerido, consentimiento o reconfirmación de precio.
- Snapshot de precio intacto tras cambiar el precio vigente del Product.
- Inmutabilidad de FormVersion publicada; retiro normal de la última rechazado; retiro urgente deja Product no disponible y BORRADORES no utilizables.
- Entrega fallida conserva ASIGNADA; sólo una entrega exitosa pasa a DERIVADA.
- Productor sin acceso en ASIGNADA, con acceso en DERIVADA propia y sin acceso tras cancelación.
- Rechazo de cancelación DERIVADA conserva DERIVADA y registra la decisión.
- Asignación rechazada a Productor inhabilitado.

## Implementación y handoff a F4

Secuencia sugerida: Identity y Catalog → Forms → Requests (BORRADOR/ENVIADA) → Assignment/Delivery → cancelación → Audit. Cada paso depende de que los ADR relacionados estén `ACEPTADO` y del TDD de detalle correspondiente. No se definen Epic/Issues F4 en este documento.

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| Propiedades definitivas de formularios | MAPS + Kondor | Versionado, ownership, relaciones y referencia de respuestas | Validar 1–2 casos reales (TDD-SW-002) |
| Campos de Mi perfil | MAPS | Identity, roles y ownership | Lista aprobada de campos visibles/editables |
| Baja de Cliente/Productor e inhabilitación ampliada | MAPS | Disponibilidad para nuevas asignaciones | Efectos sobre cuenta, casos existentes e historial |
| Retención de solicitudes, BORRADORES descartados/no utilizables y documentos | MAPS | Metadata, marcas y autorización | Plazos y eliminación física |
| Textos y versiones de consentimiento | MAPS (legal) | Entidad Consent y su snapshot | Textos aprobados |
| Estado técnico que acredita entrega exitosa | Software | Separación DeliveryAttempt/InsuranceRequest | ADR-SW-004 y TDD-SW-005 |

## Referencias y trazabilidad

- ADR y TDD relacionados: [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md); previstos TDD-SW-002 a 007, TDD-CLD-003/004/005.
- Fuentes F0/F1/F2: [F0 §0.5/0.6](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md); [F1 §3/4/5/7 y RN-02 a RN-17](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §5/6/8/10/12](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Filas de [traceability.md](../../../traceability.md): lifecycle de InsuranceRequest; precio y cancelación; ABM de Clientes y Productores; adjuntos.

## Criterio de aprobación

Puede pasar a `EN REVISIÓN` cuando Santiago complete la revisión cruzada de las dependencias cloud, y a `APROBADO` cuando ADR-SW-001/002/003 estén `ACEPTADO` y el equipo valide entidades, estados, invariantes, snapshots y pendientes explícitos.
