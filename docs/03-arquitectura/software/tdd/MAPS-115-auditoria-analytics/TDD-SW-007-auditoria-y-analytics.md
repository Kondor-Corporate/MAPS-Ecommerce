# TDD — Auditoría y analytics

| Dato | Valor |
| --- | --- |
| ID | `TDD-SW-007` |
| Título | Auditoría de negocio y accesos, y analytics del funnel |
| Estado | `BORRADOR` |
| Fecha | 2026-10-29 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera (revisión cruzada Cloud pendiente: privilegios de base, purga, correlación con telemetría, entrada pública del evento de vista) |
| Work item | [MAPS-115](https://santitalavera.atlassian.net/browse/MAPS-115) · subtarea a confirmar |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-115 |
| Fase origen | [F0 §0.5/0.6/0.7/0.9](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md); [F1 §5/6/7, RN-11/18/19, RF-ANALYTICS-01, RF-DELIVERY-01, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §7 (CLI-07, ADM-02, PRO-03) y §14](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md); [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md); [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md); [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); [TDD-SW-002](../MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md); [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md); TDD-SW-004 y TDD-SW-006 (en PR abiertas); ADR-CLD-006 y TDD-CLD-007 (previstos) |
| Depende de | ADR-SW-001/002/003/004/005 (`ACEPTADO`); catálogo de identidad y accesos de TDD-SW-004 (`BORRADOR`, PR #27); acceso a documentos de ADR-SW-006 (`PROPUESTO`, PR #28); retención y eliminación `PENDIENTE FUNCIONAL MAPS` ([MAPS-99](https://santitalavera.atlassian.net/browse/MAPS-99)) |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `BORRADOR`, `EN REVISIÓN`, `APROBADO`, `REEMPLAZADO`.

## Propósito y límites

Diseña el módulo Audit que [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md) define como owner de `AuditEvent` y de los eventos de analytics. Cubre dos capacidades separadas:

1. **Auditoría de negocio y de accesos**: qué acciones se registran, con qué datos, en qué transacción, quién puede consultarlas y cómo alimentan el historial que F2 muestra en CLI-07 y ADM-02.
2. **Analytics del funnel** (RF-ANALYTICS-01): emisión, persistencia y cálculo de los cuatro eventos conceptuales y las métricas de F0 §0.7, sin entidad Lead ni PII innecesaria.

Sigue la separación de [Cloud Strategy §14](../../../cloud/STRATEGY.md): **auditoría ≠ analytics ≠ observabilidad operacional**. Logs técnicos, métricas de salud, trazas, alertas y su retención pertenecen a ADR-CLD-006/TDD-CLD-007; este documento sólo define qué señales sin PII ofrece el módulo y cómo se correlacionan.

No define:

- Los eventos de identidad y acceso en sí: los fija TDD-SW-004 (PR #27). Este TDD los incorpora por referencia y define su almacenamiento y consulta, como ese documento delega.
- El trazado técnico de la entrega: `DeliveryAttempt` ([TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md)) ya registra destinatario, fecha, resultado, fallas y reintentos (RF-DELIVERY-01). La auditoría no lo duplica.
- Plazos de retención o eliminación física: `PENDIENTE FUNCIONAL MAPS`.
- Proveedor externo de analytics: no se adopta ninguno (ver [Decisiones abiertas](#decisiones-abiertas)).

## Baseline y dependencias

| Regla / dependencia | Fuente y estado | Impacto en el diseño |
| --- | --- | --- |
| Auditoría y analítica básica del funnel en el MVP | [F0 §0.5](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md) — CONFIRMADO | Ambas capacidades entran en el MVP |
| Consentimientos, respuestas, documentos y versión de formulario auditables | [F0 §0.6](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md) — CONFIRMADO | El evento de envío referencia la `FormVersion`, los consentimientos y el snapshot inmutable; no copia respuestas ni documentos |
| El acceso del Productor registra accesos relevantes | [F0 §0.6](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §5](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) — CONFIRMADO | Cada apertura de expediente por un Productor se audita (ADR-SW-005 §6) |
| Eventos `product_viewed`, `request_started`, `request_saved`, `request_submitted` y sus métricas | [F0 §0.7](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §6, RN-11, RF-ANALYTICS-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) — CONFIRMADO / técnico F3 | Catálogo cerrado de cuatro eventos; abandono es métrica derivada, no evento |
| Analytics no registra respuestas, documentos, adjuntos, DNI, CUIT, teléfono, datos de riesgo ni PII innecesaria; no crea Leads; no sustituye auditoría | [F0 §0.7](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §6](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) — CONFIRMADO | Payload en lista blanca; sin identificadores de persona |
| Proveedor, SDK, instrumentación, persistencia y retención técnica de analytics | [F0 §0.7/0.9](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md) — DIFERIDO F3 | Este TDD propone persistencia propia (ver Decisiones abiertas) |
| `AuditEvent` registra eventos relevantes | [F1 §7](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) — CONFIRMADO | Entidad del módulo Audit |
| Historial visible en el detalle de Cliente y Admin | [F2 §7 CLI-07, ADM-02](../../../../02-diseno/Fase_2__Design_Handoff.md) — CONFIRMADO | Proyección de lectura sobre `AuditEvent` filtrada por rol |
| Baja lógica: el Admin conserva el historial | [F1 RN-18/RN-19](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) — CONFIRMADO | La baja de cuentas no borra ni oculta auditoría |
| Auditoría dentro de la transacción; eventos de funnel fuera | [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md) — `ACEPTADO` | Consistencia fuerte para auditoría; best effort para funnel |
| Funnel fuera del outbox | [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md) — `ACEPTADO` | No se crean `OutboxEvent` para analytics |
| Audit recibe eventos de todos y ningún módulo depende de él | [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md) — `ACEPTADO` | Contrato de escritura como puerto de salida de cada módulo; Audit lo implementa |
| Retención, eliminación física y conservación | [F0 §0.9](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [DEP-11](../../../dependency-matrix.md) — `PENDIENTE FUNCIONAL MAPS` | Puede avanzar el esquema y el mecanismo de purga; los plazos quedan condicionados |
| Intentos de login fallidos | [ADR-SW-005 §6](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) — condicionado al IdP | Se incorporan sólo si ADR-CLD-007 confirma que el IdP los expone |

## Vista de componentes y responsabilidades

```text
audit/
├── domain/
│   ├── AuditEvent               registro inmutable de una acción
│   ├── AuditAction              catálogo cerrado de acciones (ver Catálogo)
│   ├── AuditActor               tipo + id: CLIENTE, ADMIN, PRODUCTOR, SISTEMA, OPERACION_KONDOR
│   ├── HistoryVisibility        qué acciones ve cada rol en el historial
│   └── FunnelEvent              product_viewed | request_started | request_saved | request_submitted
├── application/
│   ├── RecordAuditEvent         implementa AuditPort dentro de la UoW del módulo que llama
│   ├── RecordAccessEvent        aperturas y denegaciones, en transacción propia
│   ├── GetRequestHistory        historial de CLI-07 / ADM-02, filtrado por rol y AccessScope
│   ├── RecordFunnelEvent        posterior al commit, best effort
│   └── FunnelMetricsQuery       métricas agregadas de F0 §0.7
├── ports/in/                    AuditPort, FunnelPort, AuditHistoryQuery
└── ports/out/                   AuditEventRepository, FunnelEventRepository
adapters/
├── in/http                      GET historial de una solicitud; POST de product_viewed (público)
└── out/persistence              tablas audit_event y funnel_event en la base del Portal
```

- **Escritura de auditoría.** Requests, Assignment, Catalog, Forms, Identity y Documents ya declaran un `AuditPort` de salida (TDD-SW-002/003/005). El contrato (`AuditRecord`, tipos y catálogo) vive en un paquete compartido de sólo tipos; Audit provee la implementación, que la composición inyecta. Ningún módulo importa repositorios ni tablas de Audit, y Audit no llama a ningún otro módulo al escribir.
- **Lectura del historial.** `GetRequestHistory` combina eventos de Audit con los datos que expone el puerto de consulta de Assignment (intentos de entrega) y resuelve nombres de actor por el puerto de Identity al momento de leer. Es el único punto donde Audit consulta otros módulos, siempre en lectura y por contrato público.
- **Funnel.** Los servicios de aplicación de Requests emiten `request_started`, `request_saved` y `request_submitted` a `FunnelPort` después del commit. `product_viewed` llega desde el frontend por un endpoint propio de la API, porque la ficha pública puede servirse desde caché o CDN (ADR-CLD-001) y un conteo en el servidor la subestimaría.

## Contratos y flujos

### Contrato `AuditRecord`

| Campo | Regla |
| --- | --- |
| `id` | UUID generado por la aplicación |
| `occurredAt` | Hora del servidor (UTC) de la UoW; nunca la informa el cliente |
| `action` | Valor del catálogo cerrado; una acción no se reutiliza con otro significado |
| `category` | `NEGOCIO`, `IDENTIDAD`, `ACCESO` o `CONFIGURACION` |
| `actorType`, `actorId` | `actorId` es el id interno de la cuenta; `SISTEMA` identifica el procesador o job; `OPERACION_KONDOR` identifica comandos de operación (`create-admin`, cambio manual de email de TDD-SW-004) |
| `entityType`, `entityId` | Entidad afectada (`InsuranceRequest`, `Assignment`, `CancellationRequest`, `Product`, `FormVersion`, `Category`, `Customer`, `Producer`, `UserIdentity`, `Document`) |
| `requestId` | Id de la `InsuranceRequest` relacionada, si existe; habilita el historial sin recorrer otras tablas |
| `correlationId` | Id de request HTTP o del `OutboxEvent` que originó la acción; enlaza con logs y trazas de TDD-CLD-007 sin PII |
| `data` | JSON con atributos tipados **por acción** según lista blanca (por ejemplo `fromStatus`, `toStatus`, `priceRevisionId`, `formVersionId`, `consentIds`); `dataSchemaVersion` acompaña cada cambio de forma |

Reglas de contenido: sólo identificadores internos y valores de configuración del negocio (por ejemplo, monto anterior y nuevo de un precio, como pide TDD-SW-002). Nunca nombres, emails, DNI, CUIT, teléfono, respuestas, contenido de documentos, datos de riesgo ni textos libres. Los motivos escritos por un Cliente o un Admin (cancelación, retiro urgente, reasignación de DERIVADA) quedan en su entidad owner; el evento sólo guarda la referencia.

### Escritura transaccional

1. El servicio de aplicación del módulo owner abre la UoW ([ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md)).
2. Aplica el cambio de negocio y llama a `AuditPort.record(...)` con el mismo contexto transaccional.
3. El commit confirma ambos; si falla la inserción de auditoría, la UoW se revierte completa. No hay cambio de negocio sin su evento ni evento sin cambio.
4. Un reintento con la misma clave de idempotencia y la misma huella devuelve el resultado registrado sin nueva auditoría ([TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md)).
5. Un comando rechazado por guarda de negocio (estado inválido, precio no confirmado, etc.) no produce `AuditEvent`: no hubo cambio. Sí se registra como señal técnica sin PII (TDD-CLD-007).

### Catálogo de acciones auditables

| Módulo owner | Acciones | Origen |
| --- | --- | --- |
| Requests | `SOLICITUD_CREADA` (`CreateDraft`), `BORRADOR_DESCARTADO`, `PRECIO_RECONFIRMADO`, `SOLICITUD_ENVIADA` (con `formVersionId`, `priceRevisionId` y consentimientos), `SOLICITUD_CANCELADA`, `CANCELACION_SOLICITADA`, `CANCELACION_APROBADA`, `CANCELACION_RECHAZADA` | TDD-SW-003 |
| Assignment | `SOLICITUD_ASIGNADA`, `SOLICITUD_REASIGNADA`, `DERIVADA_REASIGNADA` (baja de Productor, RN-19), `SOLICITUD_DERIVADA` (actor `SISTEMA`), `ENTREGA_REINTENTADA` (acción del Admin) | TDD-SW-003, TDD-SW-005 |
| Catalog / Forms | `CATEGORIA_CREADA`, `CATEGORIA_EDITADA`, `PRODUCTO_PUBLICADO`, `PRODUCTO_DESPUBLICADO`, `PRECIO_CAMBIADO`, `FORMVERSION_PUBLICADA`, `FORMVERSION_RETIRADA` (`tipoRetiro`) | TDD-SW-002, RF-CAT-01, RF-PROD-01 |
| Identity | Altas, bajas y reactivaciones de cuentas; cambios de rol; creación de Admin; invitaciones; sincronización de email; ABM de Cliente y Productor (sólo nombres de campos modificados, no valores); actualización de perfil del Cliente (campos sujetos a [MAPS-97](https://santitalavera.atlassian.net/browse/MAPS-97)) | TDD-SW-004 (PR #27), RN-14/15/17/18/19 |
| Acceso | `EXPEDIENTE_ABIERTO` (Productor), `ACCESO_DENEGADO` (actor, acción, recurso y motivo) | ADR-SW-005 §6, TDD-SW-004 |
| Documents | `DOCUMENTO_ACCEDIDO` por Admin o Productor | Condicionado a ADR-SW-006 (`PROPUESTO`) y TDD-SW-006 |

Los nombres de la fila Identity y de la fila Acceso se alinean con los que fije TDD-SW-004 antes de pasar ambos a `EN REVISIÓN`. `SaveDraft` no se audita: no cambia estado y su volumen es alto; se mide como `request_saved`. Las respuestas quedan auditables por la inmutabilidad posterior a ENVIADA y la referencia del evento `SOLICITUD_ENVIADA`, no por copia.

### Eventos de acceso

`EXPEDIENTE_ABIERTO` y `ACCESO_DENEGADO` ocurren en lecturas, sin UoW de negocio, y se escriben en una transacción propia:

- **Apertura por Productor**: se registra antes de devolver el expediente. Propuesta: si la escritura falla, no se sirve el contenido (*fail-closed*), porque F0 exige registrar el acceso. Queda como decisión abierta.
- **Denegación**: se registra sin alterar la respuesta (403/404 según TDD-SW-004). Si la escritura falla, la denegación se mantiene y queda una señal técnica.

### Historial (CLI-07, ADM-02)

| Rol | Qué ve | Qué no ve |
| --- | --- | --- |
| Cliente propietario | Cambios de estado de su solicitud con fecha, cancelación solicitada y su decisión | Identidad de Admin o Productor, eventos de acceso, configuración, intentos de entrega |
| Admin | Todos los eventos `NEGOCIO` de la solicitud, intentos de entrega (de TDD-SW-005) y actor | Eventos de acceso: el MVP no incluye una vista de accesos (TDD-SW-004) |
| Productor | Sin historial: PRO-03 muestra el expediente DERIVADO y avisos | — |

La autorización usa el `AccessScope` de TDD-SW-004: ninguna consulta del historial saltea el filtro de ownership. La visibilidad por rol se define en el catálogo por acción, no por evento.

### Funnel

| Evento | Punto de emisión | Payload (lista blanca) |
| --- | --- | --- |
| `product_viewed` | Frontend, al mostrar PUB-02 de un Product publicado; `POST` público a la API | `productId`, `authenticated` (booleano) |
| `request_started` | Después del commit de `CreateDraft` (ver decisión abierta 1) | `productId`, `requestId`, `formVersionId` |
| `request_saved` | Después del commit de cada `SaveDraft` exitoso | `productId`, `requestId`, `formVersionId` |
| `request_submitted` | Después del commit de `Submit` | `productId`, `requestId`, `formVersionId` |

Todos agregan `eventId` y `occurredAt` del servidor. No se guardan `customerId`, IP, user agent, cookies ni identificadores de visitante. `requestId` es un id interno seudónimo, necesario para tiempo de completado y conversión por solicitud.

- **Entrega best effort.** `FunnelPort` inserta en su propia transacción, después del commit del negocio. Un fallo se descarta con señal técnica y nunca afecta la operación del usuario. Las métricas son aproximadas por diseño.
- **Endpoint público de `product_viewed`.** Valida que el `productId` exista y esté publicado, rechaza campos desconocidos y aplica límites de tasa en la API y en la entrada pública (coordinación con ADR-CLD-001). No requiere sesión ni setea cookies.

Métricas de F0 §0.7:

| Métrica | Cálculo |
| --- | --- |
| Product view → Start | Por Product y período: `request_started` / `product_viewed`. Es una **tasa agregada**: sin identificador de visitante no se puede seguir a la misma persona entre la vista y el inicio |
| Start → BORRADOR | Solicitudes con al menos un `request_saved` / solicitudes con `request_started` |
| BORRADOR → ENVIADA | Solicitudes con `request_submitted` / solicitudes con al menos un `request_saved` |
| Tiempo mediano de completado | Mediana de `request_submitted.occurredAt − request_started.occurredAt` por solicitud |
| % de borradores nunca enviados | Solicitudes iniciadas sin `request_submitted` luego de una ventana de observación configurable; incluye las descartadas |

F2 no define una pantalla de métricas. En el MVP se exponen como vistas de sólo lectura para el reporte que Kondor prepare para MAPS; una pantalla Admin requiere cambio controlado de F2.

## Datos, consistencia y migraciones

| Tabla | Columnas principales | Índices |
| --- | --- | --- |
| `audit_event` | `id`, `occurred_at`, `action`, `category`, `actor_type`, `actor_id`, `entity_type`, `entity_id`, `request_id`, `correlation_id`, `data` (jsonb), `data_schema_version` | (`request_id`, `occurred_at`); (`entity_type`, `entity_id`, `occurred_at`); (`actor_id`, `occurred_at`); (`occurred_at`) para purga |
| `funnel_event` | `id`, `type`, `occurred_at`, `product_id`, `request_id`, `form_version_id`, `authenticated` | (`type`, `occurred_at`); (`request_id`); (`product_id`, `occurred_at`) |

- Viven en la base del Portal ([ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md)), con ownership lógico de Audit. Nada se toma del PostgreSQL histórico de MAPS.
- **Append-only**: la aplicación sólo inserta y lee. Las migraciones otorgan `INSERT`/`SELECT` al rol de la aplicación sobre ambas tablas, sin `UPDATE` ni `DELETE`. La purga, cuando exista, corre con un rol separado (revisión cruzada con TDD-CLD-003/006).
- **Evolución**: el catálogo sólo crece; un cambio de forma de `data` sube `data_schema_version` y los lectores toleran versiones anteriores. Migraciones expand/contract según ADR-SW-003.
- **Volumen**: no se requiere particionado de entrada. Si TDD-CLD-003 lo justifica, se particiona por mes para purgar sin borrar fila por fila. Si los datos crudos crecen, se agregan resúmenes diarios por Product y tipo de evento.
- **Retención**:
  - `audit_event`: `PENDIENTE FUNCIONAL MAPS` (MAPS-99). Restricción técnica para llevar a esa decisión: como el historial se construye desde la auditoría, los eventos de una solicitud deben conservarse al menos mientras se conserve la solicitud. La baja de una cuenta no borra eventos (RN-18/RN-19).
  - `funnel_event`: la retención técnica es decisión F3 (F0 §0.7). Propuesta a confirmar: conservar los eventos crudos por un plazo técnico acotado y mantener sólo agregados sin `requestId` después.
- **Ambientes**: no se copian datos de auditoría ni de funnel de production a otros ambientes ([Cloud Strategy](../../../cloud/STRATEGY.md)).

## Seguridad y privacidad

- Minimización: identificadores internos y nada de textos libres, ni de los datos excluidos por F0 §0.7/F1 §6. Los nombres se resuelven al leer, así que un cambio de perfil no reescribe la auditoría.
- La lista blanca de `data` por acción es código revisable. Una prueba automática falla si una acción declara campos prohibidos.
- Inmutabilidad por privilegios de base, no sólo por convención de código. Una cadena de hashes o una exportación inmutable no entran en el MVP: se incorporan sólo si MAPS o un requisito legal lo exige (decisión abierta).
- La consulta general de auditoría (por actor, rango o entidad) no tiene pantalla en el MVP. La investigación de incidentes la hace Kondor con acceso humano controlado y de sólo lectura, definido por TDD-CLD-006.
- El endpoint de `product_viewed` es la única escritura anónima del módulo: no acepta identificadores, valida el Product y tiene límites de tasa.
- Sin cookies ni identificadores de visitante, analytics no introduce seguimiento entre sesiones ni comparte datos con terceros.
- Los logs técnicos no replican el contenido de `audit_event` ni de `funnel_event` (TDD-CLD-007).

## Operación y observabilidad

Señales sin PII que el módulo ofrece a TDD-CLD-007:

- Fallos de inserción de auditoría (cada uno revierte una operación; se espera cero).
- Eventos de funnel descartados por fallo de escritura.
- Volumen de `ACCESO_DENEGADO` y de `EXPEDIENTE_ABIERTO` por período.
- Crecimiento de `audit_event` y `funnel_event`; resultado de la purga cuando exista.
- `correlationId` en cada evento, para enlazar auditoría con logs y trazas sin copiar datos.

Backups y restore de ambas tablas siguen los de la base (TDD-CLD-003). Un restore restaura también la auditoría.

## Pruebas y criterios de fallo

- Cada comando del catálogo produce exactamente un `AuditEvent` con acción, actor, entidad y `requestId` esperados.
- Si el cambio de negocio se revierte, no queda evento; si la inserción del evento falla, el cambio de negocio se revierte.
- Reintento idempotente: sin auditoría duplicada.
- Comandos rechazados por guarda: sin `AuditEvent`.
- Lista blanca: un `data` con campos no declarados o prohibidos falla en prueba unitaria.
- Integración con base real (no simulada): el rol de la aplicación no puede `UPDATE` ni `DELETE` sobre `audit_event` ni `funnel_event`.
- Apertura de expediente: un Productor con acceso vigente genera `EXPEDIENTE_ABIERTO`. Si se adopta fail-closed, un fallo de escritura impide servir el contenido.
- Historial: el Cliente ve sólo las acciones permitidas y no ve eventos de otra solicitud; el Admin no ve eventos `ACCESO`.
- Funnel: una falla de `FunnelPort` no altera el resultado de `SaveDraft` ni de `Submit`. `product_viewed` rechaza Products no publicados y campos extra. No se persiste ningún identificador de persona.
- Métricas: sobre un conjunto fijo de eventos, las cinco métricas devuelven los valores esperados, incluida la mediana.

## Implementación y handoff a F4

1. Contrato `AuditRecord`, `AuditPort`, tabla `audit_event`, privilegios y adaptador transaccional.
2. Incorporación del catálogo por módulo, a medida que cada módulo se implementa: cada módulo incluye sus acciones y pruebas en su propia definición de terminado.
3. `GetRequestHistory` para CLI-07 y ADM-02.
4. Eventos de acceso, junto con la autorización de TDD-SW-004.
5. `funnel_event`, emisión posterior al commit, endpoint de `product_viewed` y vistas de métricas.
6. Purga de auditoría sólo cuando MAPS-99 fije plazos; purga técnica de funnel cuando se confirme su plazo.

Dependencias: TDD-SW-004 (catálogo de identidad y accesos), TDD-SW-006 (acceso a documentos), TDD-CLD-003 (dimensionamiento, backups, particionado), TDD-CLD-006 (roles de base y acceso humano), TDD-CLD-007 (señales y correlación) y ADR-CLD-001 (límites de tasa en la entrada pública). No se definen Epic/Issues F4 en este documento.

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| 1. Punto de emisión de `request_started`: tras `CreateDraft` (propuesta) o al pulsar el CTA de PUB-02 antes del login. Medir la fricción del login por separado requeriría un evento nuevo | Software (owner); MAPS si cambia la definición de la métrica | Los otros tres eventos y la persistencia | Confirmación del owner. Un evento nuevo requiere cambio controlado F0/F1 |
| 2. Retención y eliminación de `audit_event` | `PENDIENTE FUNCIONAL MAPS` ([MAPS-99](https://santitalavera.atlassian.net/browse/MAPS-99)) | Esquema, índices y mecanismo de purga sin plazos | Respuesta de MAPS en la Ronda MAPS A ([MAPS-167](https://santitalavera.atlassian.net/browse/MAPS-167)) |
| 3. Plazo técnico de los eventos crudos de funnel | Software + Cloud | Agregados y purga parametrizable | Plazo acordado con costo estimado de Cloud |
| 4. Fail-closed en la apertura de expediente del Productor | Software (owner) + Cloud | El registro de la apertura | Decisión del owner |
| 5. Persistencia propia de analytics frente a un proveedor externo | Software (owner) | Diseño con persistencia propia | Confirmación del owner. Un proveedor externo requiere ADR y revisión de privacidad y consentimiento |
| 6. Consumo de métricas: reporte técnico (propuesta) o pantalla Admin | MAPS + Kondor | Vistas de sólo lectura | Una pantalla requiere cambio controlado de F2 |
| 7. Eventos y textos del historial visible al Cliente | Software + UX (F2) | Filtro por rol en el catálogo | Validación contra F2 y el prototipo |
| 8. Evidencia de inmutabilidad más allá de privilegios (hash chain, exportación) | Software + Cloud | Privilegios de base | Requisito de MAPS o legal, si existe |
| 9. Nombres de eventos de identidad y acceso; volumen o agrupación de `ACCESO_DENEGADO` | Software + Cloud | Contrato genérico de acceso | TDD-SW-004 en `EN REVISIÓN` |
| 10. Login fallidos | Cloud | — | ADR-CLD-007 confirma si el IdP los expone de forma integrable |

## Referencias y trazabilidad

- ADR y TDD relacionados: [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md), [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-002](../MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md), [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md), [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md); TDD-SW-004 (PR #27), ADR-SW-006/TDD-SW-006 (PR #28), ADR-CLD-006/TDD-CLD-007 (previstos).
- Fuentes F0/F1/F2: [F0 §0.5/0.6/0.7/0.9](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §5/6/7, RN-11/18/19, RF-ANALYTICS-01, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §7/14](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Coordinación: [DEP-11 y DEP-12 de la matriz de dependencias](../../../dependency-matrix.md).
- Fila de [traceability.md](../../../traceability.md): funnel y auditoría con minimización de PII.
