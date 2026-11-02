# TDD — Auditoría y analytics

| Dato | Valor |
| --- | --- |
| ID | `TDD-SW-007` |
| Título | Auditoría de negocio y accesos, y analytics del funnel |
| Estado | `BORRADOR` |
| Fecha | 2026-10-29 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera: revisión técnica, revisión cruzada Cloud y aporte de instrumentación del 2026-10-30, respondidos en [Seguimiento de revisión PR #32](#seguimiento-de-revisión-pr-32) y pendientes de su verificación |
| Work item | [MAPS-115](https://santitalavera.atlassian.net/browse/MAPS-115) · subtarea [MAPS-144](https://santitalavera.atlassian.net/browse/MAPS-144) |
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
- Proveedor externo de analytics: no se adopta ninguno en el MVP (decisión del owner del 2026-10-29). Incorporarlo requiere un ADR propio y revisión de privacidad y consentimiento.

## Baseline y dependencias

| Regla / dependencia | Fuente y estado | Impacto en el diseño |
| --- | --- | --- |
| Auditoría y analítica básica del funnel en el MVP | [F0 §0.5](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md) — CONFIRMADO | Ambas capacidades entran en el MVP |
| Consentimientos, respuestas, documentos y versión de formulario auditables | [F0 §0.6](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md) — CONFIRMADO | El evento de envío referencia la `FormVersion`, los consentimientos y el snapshot inmutable; no copia respuestas ni documentos |
| El acceso del Productor registra accesos relevantes | [F0 §0.6](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §5](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) — CONFIRMADO | Cada apertura de expediente por un Productor se audita (ADR-SW-005 §6) |
| Eventos `product_viewed`, `request_started`, `request_saved`, `request_submitted` y sus métricas | [F0 §0.7](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §6, RN-11, RF-ANALYTICS-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) — CONFIRMADO / técnico F3 | Catálogo cerrado de cuatro eventos; abandono es métrica derivada, no evento |
| Analytics no registra respuestas, documentos, adjuntos, DNI, CUIT, teléfono, datos de riesgo ni PII innecesaria; no crea Leads; no sustituye auditoría | [F0 §0.7](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §6](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) — CONFIRMADO | Payload en lista blanca; sin identificadores de persona |
| Proveedor, SDK, instrumentación, persistencia y retención técnica de analytics | [F0 §0.7/0.9](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md) — DIFERIDO F3 | Persistencia propia en la base del Portal, sin proveedor externo (decisión del owner del 2026-10-29); la retención técnica sigue abierta |
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
│   ├── RecordAccessEvent        denegaciones, en transacción propia
│   ├── ListRequestEvents        implementa AuditHistoryQuery: eventos de una solicitud según HistoryVisibility
│   ├── RecordFunnelEvent        posterior al commit, best effort
│   └── FunnelMetricsQuery       métricas agregadas de F0 §0.7
├── ports/in/                    AuditPort, FunnelPort, AuditHistoryQuery
└── ports/out/                   AuditEventRepository, FunnelEventRepository
adapters/
├── in/http                      POST de product_viewed (público)
└── out/persistence              tablas audit_event y funnel_event en la base del Portal

composición de lectura (fuera de los módulos, sin datos propios)
└── GetRequestHistory            historial de CLI-07 / ADM-02: aplica AccessScope y compone Audit, Assignment e Identity
```

- **Escritura de auditoría.** Requests, Assignment, Catalog, Forms, Identity y Documents ya declaran un `AuditPort` de salida (TDD-SW-002/003/005). El contrato (`AuditRecord`, tipos y catálogo) vive en un paquete compartido de sólo tipos; Audit provee la implementación, que la composición inyecta. Ningún módulo importa repositorios ni tablas de Audit, y Audit no llama a ningún otro módulo al escribir.
- **Lectura del historial.** `GetRequestHistory` vive en una capa de composición de lectura externa a los módulos, que también sirve al detalle de Admin (TDD-SW-008). Autoriza con la política y el `AccessScope` de TDD-SW-004, pide a Audit los eventos visibles para el rol (`AuditHistoryQuery`) y agrega, según el rol, los intentos de entrega de Assignment y los nombres de actor de Identity. Audit no llama a ningún módulo, ni al escribir ni al leer. La capa no es un módulo de negocio: no tiene datos ni escrituras, sólo usa contratos públicos y ningún módulo la invoca, así que el mapa de [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md) se mantiene sin ciclos. Se descarta registrar una excepción: Assignment e Identity escriben por `AuditPort`, que Audit implementa, de modo que una consulta de Audit hacia ellos cerraría un ciclo en ejecución. Las lecturas no comparten transacción: un intento registrado entre ambas aparece en la consulta siguiente.
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
| `correlationId` | Id de la request HTTP, del `OutboxEvent` o de la corrida del job que originó la acción; se propaga a workers y jobs y enlaza con logs y trazas de TDD-CLD-007. No transporta tokens, emails, nombres ni otra PII. Localiza una operación: no acredita su resultado ni se usa para autorizar |
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

`EXPEDIENTE_ABIERTO` y `ACCESO_DENEGADO` ocurren en lecturas, sin cambio de negocio.

**Apertura por Productor.** Si la escritura falla, no se sirve el contenido (*fail-closed*), porque F0 exige registrar el acceso (decisión del owner del 2026-10-29). Autorización, registro y lectura ocurren en una única transacción corta, iniciada por Assignment, que ya depende de Requests e Identity:

1. Relee la cuenta del Productor con `FOR SHARE` por `ProducerAccountPort`, el mismo bloqueo compartido que serializa con el `FOR UPDATE` de `DeactivateProducer` ([TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md)). Si no está `ACTIVA`: `CUENTA_INACTIVA`.
2. Lee con `FOR SHARE` el Assignment `EFECTIVO` del Productor sobre esa solicitud, que debe seguir DERIVADA. Una baja, una reasignación o una cancelación aprobada lo cierra con un `UPDATE` sobre esa fila, así que hace falta bloquearla: bloquear sólo la cuenta no serializa con la cancelación. Si no hay fila: `404`, sin revelar la existencia de la solicitud.
3. Inserta `EXPEDIENTE_ABIERTO` por `AuditPort`.
4. Lee el expediente por el puerto de Requests.
5. Hace commit y recién entonces responde. Si falla cualquier paso, no se entrega contenido.

El orden de bloqueo (cuenta, luego Assignment) coincide con el de la baja guiada. Una revocación que confirma antes hace fallar la apertura; una que empieza después espera el commit de la apertura.

Límites de la garantía:

- El evento acredita que se autorizó y registró una apertura, no que los bytes llegaron al destinatario.
- Queda una ventana residual: una revocación confirmada después del commit no detiene una respuesta ya en curso. La garantía es de TDD-SW-004: toda request iniciada después del commit de la baja se rechaza.
- Cada `GET` del expediente es una apertura y genera un evento; el listado no. La respuesta es `no-store` y la SPA no precarga el expediente.
- Una falla de escritura deja al Productor sin ver el expediente. El costo y la contención de escribir en cada apertura se miden con los patrones reales (TDD-CLD-003), y las fallas generan alerta (TDD-CLD-007).
- Los adjuntos no quedan cubiertos por esta transacción: cada enlace se autoriza y audita por separado, y sobre las URL ya emitidas rige la ventana residual de ADR-SW-006.

**Denegación.** Se escribe en una transacción propia, sin alterar la respuesta (403/404 según TDD-SW-004). Si la escritura falla, la denegación se mantiene y queda una señal técnica.

### Historial (CLI-07, ADM-02)

| Rol | Qué ve | Qué no ve |
| --- | --- | --- |
| Cliente propietario | Cambios de estado de su solicitud con fecha, cancelación solicitada y su decisión | Identidad de Admin o Productor, eventos de acceso, configuración, intentos de entrega |
| Admin | Todos los eventos `NEGOCIO` de la solicitud, intentos de entrega (de TDD-SW-005) y actor | Eventos de acceso: el MVP no incluye una vista de accesos (TDD-SW-004) |
| Productor | Sin historial: PRO-03 muestra el expediente DERIVADO y avisos | — |

La autorización usa el `AccessScope` de TDD-SW-004: ninguna consulta del historial saltea el filtro de ownership. La visibilidad por rol se define en el catálogo por acción, no por evento. La visibilidad del Cliente se adopta como diseño y se valida con MAPS junto con el prototipo ([MAPS-105](https://santitalavera.atlassian.net/browse/MAPS-105)) antes de pasar el TDD a `EN REVISIÓN`.

### Funnel

Contrato de instrumentación por evento. `product_viewed` es una interacción de navegación; los otros tres registran un hecho de negocio ya confirmado.

| Evento | Fuente e instante | Payload (lista blanca) | Duplicados y reintentos |
| --- | --- | --- | --- |
| `product_viewed` | Frontend, al mostrar PUB-02 de un Product publicado; `POST` público a la API | `productId`; `authenticated` lo deriva la API, nunca lo envía el cliente | Cada `POST` aceptado es una vista. Sin deduplicación; el frontend no reintenta |
| `request_started` | Backend, después del commit de `CreateDraft` | `productId`, `requestId`, `formVersionId` | Un `CreateDraft` duplicado crea otro `requestId` y otro evento (TDD-SW-008) |
| `request_saved` | Backend, después del commit de cada `SaveDraft` exitoso | `productId`, `requestId`, `formVersionId` | Cada guardado emite un evento; las métricas cuentan solicitudes distintas |
| `request_submitted` | Backend, después del commit de `Submit` | `productId`, `requestId`, `formVersionId` | Un reintento idempotente devuelve el resultado registrado y no emite otro evento |

Todos agregan `eventId`, `occurredAt` del servidor y `schemaVersion`. No se guardan `customerId`, IP, user agent, cookies ni identificadores de visitante. `requestId` es un id interno necesario para tiempo de completado y conversión por solicitud. Es seudónimo, no anónimo: puede vincularse con una persona a través de otras tablas, así que `funnel_event` se trata con acceso mínimo y sólo se exportan agregados.

- **Inicio de solicitud.** `request_started` se emite en el servidor al confirmarse `CreateDraft`, con `requestId` (decisión del owner del 2026-10-29). Como el login es previo a crear el BORRADOR, la fricción del login queda dentro de Product view → Start; medirla por separado requiere un evento nuevo y un cambio controlado de F0/F1.
- **Entrega best effort.** `FunnelPort` inserta en su propia transacción, después del commit del negocio, sin reintentos. Un fallo o una saturación de la base descarta el evento con señal técnica y nunca afecta `CreateDraft`, `SaveDraft` ni `Submit`. Las métricas son aproximadas por diseño.
- **Endpoint público de `product_viewed`.** Valida que el `productId` exista y esté publicado, rechaza campos desconocidos y aplica límites de tasa en la API y en la entrada pública (coordinación con ADR-CLD-001). No requiere sesión ni setea cookies. `authenticated` es `true` sólo si la request trae un token que la API valida; un token ausente, inválido o vencido cuenta como `false` y nunca responde `401`. La identidad no se guarda.
- **Validez del conteo.** Cada vista repetida o automatizada que supere los controles cuenta como una vista. Los límites de tasa reducen el abuso, pero no deduplican. La métrica es un conteo aproximado de vistas, no de visitantes únicos.

Métricas de F0 §0.7. Salvo Product view → Start, se calculan por **cohorte**: las solicitudes cuyo `request_started` cae en el período, con cada hito contado dentro de una ventana de observación configurable desde ese inicio (30 días como valor inicial). Una cohorte se informa como definitiva cuando termina su ventana.

| Métrica | Cálculo |
| --- | --- |
| Product view → Start | Por Product y período: `request_started` / `product_viewed`. Es un **cociente agregado, no una conversión**: sin identificador de visitante no se puede seguir a la misma persona, las vistas y los inicios de un período pueden no corresponderse y el valor puede superar 100 % |
| Start → BORRADOR | Solicitudes de la cohorte con al menos un `request_saved` / solicitudes de la cohorte. El BORRADOR existe desde `CreateDraft`; este hito mide quién llegó a guardar |
| BORRADOR → ENVIADA | Solicitudes de la cohorte con `request_saved` y `request_submitted` / solicitudes de la cohorte con `request_saved` |
| Envíos sin guardado previo | Solicitudes de la cohorte con `request_submitted` y sin `request_saved`. Se informa aparte porque TDD-SW-003 no exige `SaveDraft` antes de `Submit`; también incluye guardados cuyo evento se perdió |
| Tiempo mediano de completado | Mediana de `request_submitted.occurredAt − request_started.occurredAt` entre las solicitudes de la cohorte enviadas dentro de la ventana |
| % de borradores nunca enviados | Solicitudes de la cohorte sin `request_submitted` al terminar la ventana; incluye las descartadas |

Un `request_submitted` sin `request_started` (evento perdido) queda fuera de las cohortes y se cuenta como señal de calidad del dato.

F2 no define una pantalla de métricas. En el MVP se exponen como vistas de sólo lectura para un reporte técnico que Kondor prepara para MAPS (decisión del owner del 2026-10-29). El reporte usa sólo agregados, sin eventos individuales de identidad ni de acceso, y sus consultas quedan fuera del camino crítico. Una pantalla Admin requiere cambio controlado de F2.

## Datos, consistencia y migraciones

| Tabla | Columnas principales | Índices |
| --- | --- | --- |
| `audit_event` | `id`, `occurred_at`, `action`, `category`, `actor_type`, `actor_id`, `entity_type`, `entity_id`, `request_id`, `correlation_id`, `data` (jsonb), `data_schema_version` | (`request_id`, `occurred_at`); (`entity_type`, `entity_id`, `occurred_at`); (`actor_id`, `occurred_at`); (`occurred_at`) para purga |
| `funnel_event` | `id`, `type`, `occurred_at`, `schema_version`, `product_id`, `request_id`, `form_version_id`, `authenticated` | (`type`, `occurred_at`); (`request_id`); (`product_id`, `occurred_at`) |

- Viven en la base del Portal ([ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md)), con ownership lógico de Audit. Nada se toma del PostgreSQL histórico de MAPS.
- **Append-only**: la aplicación sólo inserta y lee. Los roles se materializan en TDD-CLD-003/006 con este contrato:
  - **Runtime:** `INSERT` y `SELECT` sobre ambas tablas, sin `UPDATE`, `DELETE`, `TRUNCATE` ni permisos de alteración.
  - **Migraciones y mantenimiento:** rol separado, owner de tablas e índices. La aplicación nunca usa sus credenciales.
  - **Purga:** rol independiente, habilitado sólo cuando exista una política de retención aprobada; sus operaciones quedan registradas.
- **Evolución**: el catálogo sólo crece; un cambio de forma de `data` sube `data_schema_version` y los lectores toleran versiones anteriores. Migraciones expand/contract según ADR-SW-003.
- **Volumen y carga**: no se requiere particionado de entrada. Si TDD-CLD-003 lo justifica, se particiona por mes para purgar sin borrar fila por fila. Si los datos crudos crecen, se agregan resúmenes diarios por Product y tipo de evento. `funnel_event` comparte recursos con las operaciones transaccionales: TDD-CLD-003/007 evalúan índices, crecimiento, conexiones, escrituras concurrentes y el costo de las consultas agregadas. Esto no incorpora por sí solo Pub/Sub ni otro servicio; cambiar de estrategia requiere una decisión formal.
- **Retención**:
  - `audit_event`: `PENDIENTE FUNCIONAL MAPS` (MAPS-99). Restricción técnica para llevar a esa decisión: como el historial se construye desde la auditoría, los eventos de una solicitud deben conservarse al menos mientras se conserve la solicitud. La baja de una cuenta no borra eventos (RN-18/RN-19).
  - `funnel_event`: la retención técnica es decisión F3 (F0 §0.7). Propuesta a confirmar: conservar los eventos crudos por un plazo técnico acotado, según necesidad de medición, volumen y costo, y mantener sólo agregados sin `requestId` después.
  - **Copias:** purgar una tabla no borra de inmediato los datos de backups ni de PITR, y una restauración puede devolver filas ya purgadas. TDD-CLD-003 define ese tratamiento junto con los plazos.
- **Ambientes**: no se copian datos de auditoría ni de funnel de production a otros ambientes ([Cloud Strategy](../../../cloud/STRATEGY.md)).

## Seguridad y privacidad

- Minimización: identificadores internos y nada de textos libres, ni de los datos excluidos por F0 §0.7/F1 §6. Los nombres se resuelven al leer, así que un cambio de perfil no reescribe la auditoría.
- La lista blanca de `data` por acción es código revisable. Una prueba automática falla si una acción declara campos prohibidos.
- Append-only por privilegios de base, no sólo por convención de código. Esto no equivale a inmutabilidad criptográfica ni resiste a un administrador de la base. Una cadena de hashes o una exportación inmutable no entran en el MVP: se incorporan sólo si MAPS o un requisito legal lo exige (decisión abierta).
- La consulta general de auditoría (por actor, rango o entidad) no tiene pantalla en el MVP. La investigación de incidentes la hace Kondor con acceso humano mínimo, de sólo lectura, con consultas privilegiadas auditadas y restricciones de exportación, definido por TDD-CLD-006.
- El endpoint de `product_viewed` es la única escritura anónima del módulo: no acepta identificadores, valida el Product y tiene límites de tasa.
- Sin cookies ni identificadores de visitante, analytics no introduce seguimiento entre sesiones ni comparte datos con terceros. Atribución UTM o por canal, dashboards externos, seguimiento anónimo→autenticado o un proveedor quedan fuera del MVP y requieren una decisión nueva con evaluación de privacidad y consentimiento.
- Los logs técnicos no replican el contenido de `audit_event` ni de `funnel_event`, ni los cuerpos HTTP (TDD-CLD-007).

## Operación y observabilidad

Señales sin PII que el módulo ofrece a TDD-CLD-007:

- Fallos de inserción de auditoría, con alerta: cada uno revierte una operación o impide abrir un expediente (se espera cero).
- Eventos de funnel descartados por fallo de escritura o saturación, y `request_submitted` sin `request_started`.
- Volumen de `ACCESO_DENEGADO` y de `EXPEDIENTE_ABIERTO` por período.
- Crecimiento de `audit_event` y `funnel_event`; resultado de la purga cuando exista.
- `correlationId` en cada evento, para enlazar auditoría con logs y trazas sin copiar datos.

Backups y restore de ambas tablas siguen los de la base (TDD-CLD-003). Un restore restaura también la auditoría, incluidas las filas purgadas después del punto restaurado.

## Pruebas y criterios de fallo

- Cada comando del catálogo produce exactamente un `AuditEvent` con acción, actor, entidad y `requestId` esperados.
- Si el cambio de negocio se revierte, no queda evento; si la inserción del evento falla, el cambio de negocio se revierte.
- Reintento idempotente: sin auditoría duplicada.
- Comandos rechazados por guarda: sin `AuditEvent`.
- Lista blanca: un `data` con campos no declarados o prohibidos falla en prueba unitaria.
- Integración con PostgreSQL real, conectada con el rol real de la aplicación: no puede `UPDATE`, `DELETE`, `TRUNCATE` ni alterar `audit_event` ni `funnel_event`.
- Apertura de expediente: un Productor con acceso vigente genera `EXPEDIENTE_ABIERTO`. Un fallo de escritura impide servir el contenido (fail-closed).
- Apertura contra revocación, con PostgreSQL real y ambos órdenes forzados: contra `DeactivateProducer` y contra una cancelación aprobada, o la apertura confirma antes y la revocación espera, o la revocación confirma antes y la apertura falla sin evento ni contenido.
- Historial: el Cliente ve sólo las acciones permitidas y no ve eventos de otra solicitud; el Admin no ve eventos `ACCESO`.
- Funnel: una falla de `FunnelPort` no altera el resultado de `CreateDraft`, `SaveDraft` ni `Submit`. `product_viewed` rechaza Products no publicados y campos extra. Un `authenticated` enviado por el cliente se rechaza; un token inválido cuenta como `false` sin `401`. Un reintento idempotente de `Submit` no emite otro evento. No se persiste ningún identificador de persona.
- Métricas: sobre un conjunto fijo de eventos, todas las métricas devuelven los valores esperados, incluidos la mediana, un envío sin guardado previo, un cociente mayor a 100 % y un hito fuera de la ventana.
- Extremo a extremo: acción real → emisión → persistencia → vista de métricas, para cada evento, incluidos fallos de escritura, reintentos y ausencia de PII. La configuración de un emisor no cuenta como evidencia de medición.

## Implementación y handoff a F4

1. Contrato `AuditRecord`, `AuditPort`, tabla `audit_event`, privilegios y adaptador transaccional.
2. Incorporación del catálogo por módulo, a medida que cada módulo se implementa: cada módulo incluye sus acciones y pruebas en su propia definición de terminado.
3. `AuditHistoryQuery` y `GetRequestHistory`, en la capa de composición de lectura, para CLI-07 y ADM-02.
4. Eventos de acceso, junto con la autorización de TDD-SW-004.
5. `funnel_event`, emisión posterior al commit, endpoint de `product_viewed` y vistas de métricas.
6. Purga de auditoría sólo cuando MAPS-99 fije plazos; purga técnica de funnel cuando se confirme su plazo.

Dependencias: TDD-SW-004 (catálogo de identidad y accesos), TDD-SW-006 (acceso a documentos), TDD-CLD-003 (dimensionamiento, backups, particionado), TDD-CLD-006 (roles de base y acceso humano), TDD-CLD-007 (señales y correlación) y ADR-CLD-001 (límites de tasa en la entrada pública). No se definen Epic/Issues F4 en este documento.

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| 1. Retención y eliminación de `audit_event` | `PENDIENTE FUNCIONAL MAPS` ([MAPS-99](https://santitalavera.atlassian.net/browse/MAPS-99)) | Esquema, índices y mecanismo de purga sin plazos | Respuesta de MAPS en la Ronda MAPS A ([MAPS-167](https://santitalavera.atlassian.net/browse/MAPS-167)) |
| 2. Plazo técnico de los eventos crudos de funnel | Software + Cloud | Agregados y purga parametrizable | Plazo acordado con costo estimado de Cloud |
| 3. Eventos y textos del historial visible al Cliente | Software + UX (F2) | Diseño adoptado: estados y fechas, sin identidad de Admin ni de Productor | Validación con MAPS junto con el prototipo ([MAPS-105](https://santitalavera.atlassian.net/browse/MAPS-105)) |
| 4. Evidencia de inmutabilidad más allá de privilegios (hash chain, exportación) | Software + Cloud | Privilegios de base | Requisito de MAPS o legal, si existe |
| 5. Nombres de eventos de identidad y acceso; volumen o agrupación de `ACCESO_DENEGADO` | Software + Cloud | Contrato genérico de acceso | TDD-SW-004 en `EN REVISIÓN` |
| 6. Login fallidos | Cloud | — | ADR-CLD-007 confirma si el IdP los expone de forma integrable |

### Decisiones cerradas por el owner (2026-10-29)

| Tema | Decisión | Motivo |
| --- | --- | --- |
| Emisión de `request_started` | En el servidor, tras el commit de `CreateDraft` | Evento confiable y con `requestId`, sin instrumentación anónima adicional. La fricción del login queda dentro de Product view → Start; medirla aparte requiere cambio controlado F0/F1 |
| Apertura de expediente sin registro | *Fail-closed*: no se sirve el contenido | F0 §0.6 exige registrar los accesos del Productor. La revisión cruzada Cloud del 2026-10-30 lo considera razonable con los límites de [Eventos de acceso](#eventos-de-acceso) |
| Persistencia de analytics | Propia, en la base del Portal; sin proveedor externo en el MVP | Sin cookies ni terceros. Un proveedor externo requiere ADR propio y revisión de privacidad y consentimiento |
| Consumo de métricas | Reporte técnico de Kondor sobre vistas de sólo lectura | F2 no define pantalla de métricas; una pantalla Admin requiere cambio controlado de F2 |

### Decisiones cerradas por el owner (2026-10-30)

| Tema | Decisión | Motivo |
| --- | --- | --- |
| Composición del historial | Capa de lectura externa a Audit, sin excepción a ADR-SW-001 | Audit no consulta módulos; una excepción dejaría un ciclo en ejecución con `AuditPort` |
| Apertura contra revocación | Una transacción corta con `FOR SHARE` sobre cuenta y Assignment, registro y lectura; respuesta después del commit | Serializa con la baja y con la cancelación usando los bloqueos existentes; la ventana residual queda documentada |
| Funnel | Cohortes por `request_started`, ventana inicial de 30 días y envíos sin guardado informados aparte | `Submit` no exige `SaveDraft`; el valor es configurable y se ajusta con datos reales |
| Aporte de instrumentación de Kondor | Se adoptan el contrato por evento, la semántica de métricas y la validación extremo a extremo; la atribución queda fuera del MVP | Refuerza el contrato sin agregar productos externos ni ampliar el alcance |

## Seguimiento de revisión PR #32

| Punto (2026-10-30) | Respuesta en este documento |
| --- | --- |
| Técnica 1: límite de módulos | [Vista de componentes](#vista-de-componentes-y-responsabilidades): composición externa a Audit, sin ciclos |
| Técnica 2 y Cloud 2.4: `product_viewed` | [Funnel](#funnel): `authenticated` derivado por la API y conteo aproximado. Controles antiabuso y capacidad de entrada: ADR-CLD-001/TDD-CLD-001 |
| Técnica 3: fórmulas | [Funnel](#funnel): cohortes, ventana, envíos sin guardado y cociente agregado |
| Técnica 4 y Cloud 2.2: apertura y revocación | [Eventos de acceso](#eventos-de-acceso): secuencia, límites de la garantía, alertas y pruebas de carrera |
| Cloud 2.1: privilegios | [Datos](#datos-consistencia-y-migraciones) y [Seguridad](#seguridad-y-privacidad): roles, pruebas con el rol real y límite frente a administradores. Materialización: TDD-CLD-003/006 |
| Cloud 2.3: correlación | [Contrato `AuditRecord`](#contrato-auditrecord): `correlationId`. Contrato común de telemetría: ADR-CLD-006/TDD-CLD-007 |
| Cloud 2.5: carga de analytics | [Funnel](#funnel) y [Datos](#datos-consistencia-y-migraciones): degradación y evaluación de carga en TDD-CLD-003/007 |
| Cloud 2.6: retención y copias | [Datos](#datos-consistencia-y-migraciones): purga, backups y PITR. Plazos: MAPS-99 y TDD-CLD-003 |
| Cloud 2.7: privacidad | [Funnel](#funnel) y [Seguridad](#seguridad-y-privacidad): seudónimo no es anónimo, acceso mínimo y exportación restringida |
| Aporte de instrumentación | [Funnel](#funnel) y [Pruebas](#pruebas-y-criterios-de-fallo). Puntos 1 a 3 adoptados; punto 4 fuera del MVP |

Siguen abiertos, sin ser defectos técnicos: MAPS-99, MAPS-105, el cierre del catálogo con TDD-SW-004 (PR #27) y los contratos de documentos (PR #28). Este documento sigue en `BORRADOR`.

## Referencias y trazabilidad

- ADR y TDD relacionados: [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md), [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-002](../MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md), [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md), [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md); TDD-SW-004 (PR #27), ADR-SW-006/TDD-SW-006 (PR #28), ADR-CLD-006/TDD-CLD-007 (previstos).
- Fuentes F0/F1/F2: [F0 §0.5/0.6/0.7/0.9](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §5/6/7, RN-11/18/19, RF-ANALYTICS-01, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §7/14](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Coordinación: [DEP-11 y DEP-12 de la matriz de dependencias](../../../dependency-matrix.md).
- Fila de [traceability.md](../../../traceability.md): funnel y auditoría con minimización de PII.
