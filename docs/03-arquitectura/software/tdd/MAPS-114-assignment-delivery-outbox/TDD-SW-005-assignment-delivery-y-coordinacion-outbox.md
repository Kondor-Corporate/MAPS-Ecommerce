# TDD — Assignment, DeliveryAttempt y coordinación con Outbox

| Dato | Valor |
| --- | --- |
| ID | `TDD-SW-005` |
| Título | Assignment, DeliveryAttempt y coordinación con Outbox |
| Estado | `BORRADOR` |
| Fecha | 2026-10-15 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera (revisión cruzada cloud sobre proveedor de email, webhooks y procesador); pendiente de validación final |
| Work item | [MAPS-114](https://santitalavera.atlassian.net/browse/MAPS-114) · subtarea pendiente de identificar. Relacionado con [MAPS-110](https://santitalavera.atlassian.net/browse/MAPS-110) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-114 |
| Fase origen | [F0 §0.4/0.5](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §3/5, RN-04/05/06/07/10/16/19, RF-DELIVERY-01, RF-ADM-01, RF-PRODUCER-02](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §5/6/12](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md); [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md); [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md); [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); ADR-CLD-003, TDD-CLD-003, TDD-CLD-005 (previstos, sin redactar) |
| Depende de | ADR-SW-003 (`ACEPTADO`); ADR-SW-004 y ADR-SW-005 (`PROPUESTO`); TDD-SW-003 (`EN REVISIÓN`). Estado técnico que acredita la entrega: decisión abierta 1 |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `BORRADOR`, `EN REVISIÓN`, `APROBADO`, `REEMPLAZADO`.

## Propósito y límites

Diseña el módulo **Assignment**: el vínculo entre una `InsuranceRequest` y un Productor, los intentos técnicos de derivación (`DeliveryAttempt`), su integración con el outbox ([ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md)) y la coordinación con Requests para cambiar el estado de la solicitud.

No fija:

- el proveedor de email, su configuración ni el runtime del procesador (ADR-CLD-003, TDD-CLD-005);
- los valores concretos de reintentos y espera (TDD-CLD-005);
- la tabla física genérica de `OutboxEvent`, que la define el TDD de Outbox junto con TDD-CLD-003;
- la autorización detallada del Productor (TDD-SW-004), que aquí sólo se consume como regla de [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md).

## Baseline y dependencias

| Regla / dependencia | Fuente y estado | Impacto en el diseño |
| --- | --- | --- |
| Admin asigna desde ENVIADA. Si la entrega falla, la solicitud permanece ASIGNADA | RN-04, RN-06, F2 §5 — CONFIRMADO | Fallo de entrega no cambia el estado de la solicitud |
| Sólo una entrega requerida exitosa habilita `ASIGNADA → DERIVADA` | RN-07, RF-DELIVERY-01 — CONFIRMADO | La transición depende del resultado de entrega, revalidado en el módulo owner |
| Registro de destinatario, fecha/hora, resultado, fallas y reintentos. Estados técnicos: pendiente, aceptado/enviado, entregado, rebotado, fallido | F1 §5 — CONFIRMADO | `DeliveryAttempt` con estado técnico separado de `InsuranceRequest` |
| El email minimiza datos, no concede acceso y no contiene documentos ni respuestas | F1 §5, RNF-COM-01 — CONFIRMADO | Payload del outbox sólo con identificadores; el contenido se arma en el procesamiento |
| Productor: sólo DERIVADAS asignadas a su identidad, read-only y revocable | RN-05/16, RF-PRODUCER-01/02 — CONFIRMADO | Acceso derivado de un Assignment `EFECTIVO` (ADR-SW-005) |
| Reasignación de DERIVADA: se cierra la asignación anterior, la solicitud permanece DERIVADA y la nueva asignación es efectiva tras entrega exitosa | RN-19 (decisión de alcance Kondor MVP, 2026-10-09) | Nuevo estado `PENDIENTE_ENTREGA` en Assignment; sin transición en `InsuranceRequest` |
| Baja de Productor: el Admin trata toda ASIGNADA o DERIVADA antes de completar la baja | RN-19, ADR-SW-005 §4 | Ver [Baja de Productor](#baja-de-productor) |
| Cancelación de ASIGNADA inmediata; cancelación de DERIVADA con decisión del Admin | RN-10, RF-SOL-05 — CONFIRMADO | Coordinación Assignment → Requests en una unidad de trabajo ([TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md)) |
| La incidencia de derivación es una vista, no un estado | F2 §12 — CONFIRMADO | Incidencia derivada del último `DeliveryAttempt`; no se persiste como estado |

## Vista de componentes y responsabilidades

```text
Assignment (owner de Assignment y DeliveryAttempt)
├── domain/
│   ├── Assignment               agregado: estado PENDIENTE_ENTREGA / EFECTIVO / CERRADO, motivo de cierre
│   ├── DeliveryAttempt          intento técnico y su estado
│   └── AssignmentPolicy         reglas puras de cierre, elegibilidad y acceso
├── application/
│   ├── AssignProducer           ENVIADA → ASIGNADA (iniciador de la transacción)
│   ├── ReassignProducer         reasignación de ASIGNADA y de DERIVADA
│   ├── RetryDelivery            reintento manual del Admin
│   ├── CancelAssignment         coordina cancelación de ASIGNADA y decisión sobre DERIVADA
│   ├── RecordDeliveryResult     recibe el resultado del procesador y aplica la regla de entrega
│   └── DerivationEventHandler   handler de delivery.derivation_requested.v1
├── ports/in/
│   ├── AssignmentQueryPort      asignación no cerrada, acceso del Productor, incidencias (Admin y Productor)
│   └── DeliveryResultPort       entrada del procesador de outbox
└── ports/out/
    ├── InsuranceRequestAssignmentPort   puerto de Requests (ports/in de Requests, TDD-SW-003)
    ├── ProducerAccountPort              consulta de elegibilidad de la cuenta de Productor (Identity, sólo lectura)
    ├── ProducerDeliveryContactPort      resuelve transitoriamente la dirección vigente y la referencia de contacto (Identity, sólo lectura)
    ├── EmailProviderPort                envío con clave de idempotencia (adaptador cloud)
    ├── OutboxPort                       escritura de OutboxEvent en la misma unidad de trabajo (ADR-SW-004)
    ├── AuditPort
    ├── AssignmentRepository
    └── DeliveryAttemptRepository
```

**Dirección de dependencias.** Assignment depende de Requests e Identity, que es la dirección fijada por [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md). Requests **no** llama a Assignment (ver TDD-SW-003) e Identity tampoco. Identity es owner de la cuenta del Productor y de su baja; Assignment sólo la consulta.

**Iniciador de transacciones.** Assignment inicia `AssignProducer`, `ReassignProducer` y `CancelAssignment`. Cada una abre una única unidad de trabajo que incluye las escrituras de Requests a través de su puerto, según el punto 4 de la decisión de [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md). Assignment nunca escribe en Identity.

## Modelo de datos y estados

### Assignment

| Campo | Regla |
| --- | --- |
| `id` | Identificador interno |
| `requestId` | `InsuranceRequest` asignada |
| `producerId` | Productor vinculado |
| `estado` | `PENDIENTE_ENTREGA`, `EFECTIVO` o `CERRADO` |
| `motivoCierre` | `REASIGNACION`, `CANCELACION` o `BAJA_PRODUCTOR`; sólo si `CERRADO` |
| `creadaPor`, `creadaAt` | Admin que asignó y fecha |
| `efectivaAt` | Fecha en que pasó a `EFECTIVO` |
| `cerradoPor`, `cerradoAt`, `motivo` | Cierre con fecha, Admin y motivo (RN-19 b) |
| `version` | Control optimista de concurrencia |

**Estados.** Un Assignment está **no cerrado** si su estado es `PENDIENTE_ENTREGA` o `EFECTIVO`. Es **efectivo** sólo en `EFECTIVO`, y sólo ese estado autoriza al Productor ([ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md)). Los nombres coinciden con los de TDD-SW-003; "vigente" no se usa como estado. Un `DeliveryAttempt` duplicado, tardío o de un Assignment `CERRADO` nunca concede ni restaura acceso.

```text
            Assign / Reassign                 entrega requerida exitosa
(nuevo) ─────────────────────────→ PENDIENTE_ENTREGA ─────────────────→ EFECTIVO
                                       │                                   │
                                       │ Reassign / Cancel / Baja          │ DecideCancellation (aprobada),
                                       ▼                                   │ Reassign de DERIVADA, Baja
                                    CERRADO ◀──────────────────────────────┘
```

**Invariantes:**

- A lo sumo un Assignment no cerrado por `requestId`. Se garantiza con índice único parcial sobre `requestId` cuando `estado IN ('PENDIENTE_ENTREGA', 'EFECTIVO')`.
- `CERRADO` es final y siempre tiene `motivoCierre`, `cerradoPor` y `cerradoAt`.
- Una solicitud `DERIVADA` tiene un Assignment `EFECTIVO` salvo durante una reasignación de DERIVADA, en la que tiene uno `PENDIENTE_ENTREGA` y ninguno efectivo.

### DeliveryAttempt

| Campo | Regla |
| --- | --- |
| `id`, `assignmentId`, `requestId` | Identificadores |
| `numero` | Intento n-ésimo del Assignment; único por `(assignmentId, numero)` |
| `tipo` | `DERIVACION` |
| `destinatarioProducerId` | Productor destinatario |
| `emailEnmascarado` | Última dirección usada, enmascarada (p. ej. `j***@dominio`). La dirección completa sólo vive transitoriamente en Identity y en el proveedor |
| `estadoTecnico` | `PENDIENTE`, `ACEPTADO`, `ENTREGADO`, `REBOTADO` o `FALLIDO` |
| `providerMessageId` | Identificador del mensaje en el proveedor. Es **nulo al crear el intento** y puede llegar después del resultado síncrono; no es garantizado por todos los proveedores. Único junto con el proveedor cuando no es nulo |
| `codigoError` | Código controlado, sin texto libre del proveedor |
| `outboxIdempotencyKey` | Clave del `OutboxEvent` que lo originó |
| `createdAt`, `resultAt` | Auditoría temporal |

**Estados técnicos** (F1 §5). El paso a `ACEPTADO` como criterio de entrega es **provisional** hasta cerrar la decisión abierta 1:

| Desde | Hacia | Condición | Efecto |
| --- | --- | --- | --- |
| `PENDIENTE` | `ACEPTADO` | Resultado síncrono del proveedor: aceptó el envío | Puede acreditar la entrega según la decisión 1 |
| `PENDIENTE` | `FALLIDO` | Fallo permanente o agotamiento de reintentos automáticos | Incidencia para Admin |
| `ACEPTADO` | `ENTREGADO` / `REBOTADO` | Sólo por webhook del proveedor | Si la decisión 1 es (B), `ENTREGADO` acredita la entrega |
| `PENDIENTE` | `ENTREGADO` / `REBOTADO` | Webhook que llega antes que el resultado síncrono | Sólo se acepta si el proveedor expone un correlador temprano, autenticado y persistible (por ejemplo, `providerEventId` más metadata/custom args o la clave de idempotencia propagada) que permita asociarlo de forma unívoca al `DeliveryAttempt`; el contrato se confirma en TDD-CLD-005 |
| `ENTREGADO`, `REBOTADO`, `FALLIDO` | — | Estados terminales del intento | Un webhook posterior se registra en `delivery_provider_event` sin cambiar el intento |

Un webhook tardío o duplicado se guarda para auditoría. Si contradice un estado terminal (p. ej. `ENTREGADO` después de `REBOTADO`), se marca como **contradictorio** y genera una incidencia visible para Admin; no se corrige en silencio. Los reintentos crean un `DeliveryAttempt` nuevo, nunca reabren el anterior.

**Correlación temprana.** Si el webhook llega antes de que se persista `providerMessageId`, no se supone que pueda correlacionarse por ese dato. Sólo se procesa cuando TDD-CLD-005 haya confirmado el correlador temprano del proveedor y su autenticidad. Si el proveedor no lo ofrece, el webhook se registra como evento pendiente de correlación, sin mutar `DeliveryAttempt`, `Assignment` ni `InsuranceRequest`; una vez persistido `providerMessageId`, un proceso de correlación lo asocia si la evidencia es unívoca. Si no puede asociarse, queda como incidencia auditada y no acredita entrega.

Los reintentos automáticos de transporte **no** crean nuevos `DeliveryAttempt`: quedan en el `OutboxEvent` (`attempts`, `nextAttemptAt`). Cada `DeliveryAttempt` representa una decisión del Admin o de la asignación, no un reintento de red.

## Contratos y flujos

### Asignar (`ENVIADA → ASIGNADA`)

Una unidad de trabajo iniciada por Assignment:

1. Verificar que el actor es Admin (ADR-SW-005) y que no hay un Assignment no cerrado para la solicitud.
2. Verificar elegibilidad del Productor con `ProducerAccountPort`: cuenta `ACTIVA` (`PRODUCTOR_NO_DISPONIBLE` si no). ADR-SW-005 no modela todavía un estado de inhabilitación separado porque RN-20 sigue pendiente de MAPS; si MAPS lo confirma, la elegibilidad lo incorpora en Identity sin cambiar este flujo.
3. Insertar `Assignment` en `PENDIENTE_ENTREGA`.
4. Llamar a `InsuranceRequestAssignmentPort.asignar(requestId, versionLeida)` para pasar a ASIGNADA (TDD-SW-003, `Assign`).
5. Insertar `DeliveryAttempt` `PENDIENTE` con `numero = 1`.
6. Insertar `OutboxEvent` `delivery.derivation_requested.v1` con `idempotencyKey = derivacion:<assignmentId>:<attemptId>`.
7. Registrar `AuditEvent`.

Si cualquier paso falla, no queda ningún cambio: ni solicitud asignada, ni outbox, ni intento.

### Procesar la derivación (fuera de la unidad de trabajo)

El handler `DerivationEventHandler` procesa el evento:

1. **Revalidar que el Assignment sigue abierto** con `AssignmentQueryPort` y `InsuranceRequestAssignmentPort`. Si el Assignment ya no está en `PENDIENTE_ENTREGA`, si el `DeliveryAttempt` ya tiene resultado, o si el Productor no está `ACTIVA`, el evento pasa a `DESCARTADO` **sin enviar nada**. Así una reasignación, una cancelación, una baja o un reprocesamiento reducen los emails obsoletos o duplicados.

   **Limitación.** Entre esta revalidación y la llamada al proveedor puede ocurrir una cancelación o reasignación; el aviso puede salir igual. La garantía que este diseño ofrece es **no duplicar el resultado funcional** (la transición de estado ocurre una vez), no que el envío sea único. El envío duplicado residual se mitiga con la clave de idempotencia si el proveedor la respeta (TDD-CLD-005). La limitación debe reflejarse en ADR-SW-004 al revisarlo; esta enmienda no modifica ADR-SW-004.
2. Resolver mediante `ProducerDeliveryContactPort` la dirección **vigente** del Productor en ese instante. Cada envío —incluidos los reintentos automáticos de transporte— usa la dirección actual de Identity, no una dirección almacenada en Outbox o reutilizada desde un envío anterior. Se registra una resolución append-only con la dirección enmascarada, la referencia/version de contacto de Identity y la fecha; nunca la dirección completa.
3. Armar el contenido mínimo (identificador de la solicitud, producto, fecha, nombre autorizado y enlace de acceso) con datos leídos en el momento, no del payload.
4. Llamar a `EmailProviderPort.enviar(..., idempotencyKey)`.
5. Llamar a `DeliveryResultPort.registrarResultado(attemptId, resultado)` con el resultado obtenido.

El procesador **no** decide transiciones: sólo reporta. Ver [Aplicar el resultado](#aplicar-el-resultado).

### Aplicar el resultado

`RecordDeliveryResult` corre en su propia unidad de trabajo, en el módulo Assignment:

| Resultado | Condición | Efecto en la misma transacción |
| --- | --- | --- |
| Éxito (`ACEPTADO`, provisional según decisión 1) | Assignment `PENDIENTE_ENTREGA` y solicitud `ASIGNADA` | `DeliveryAttempt` `ACEPTADO`; Assignment → `EFECTIVO` (`UPDATE ... WHERE version = :leida AND estado = 'PENDIENTE_ENTREGA'`); `InsuranceRequestAssignmentPort.marcarDerivada` (ASIGNADA → DERIVADA); auditoría |
| Éxito (`ACEPTADO`, provisional según decisión 1) | Assignment `PENDIENTE_ENTREGA` y solicitud `DERIVADA` (reasignación de DERIVADA) | `DeliveryAttempt` `ACEPTADO`; Assignment → `EFECTIVO` con la misma condición de versión; la solicitud **no** cambia; auditoría |
| Éxito obsoleto | Assignment ya `CERRADO` o solicitud en otro estado | `DeliveryAttempt` registrado como resultado obsoleto para diagnóstico; sin transiciones; auditoría técnica. El email ya salió hacia un Productor que dejó de estar asignado: no le concede acceso ni expone datos más allá del mínimo de F1 §5, pero es un aviso sobrante que la revalidación previa al envío reduce y no elimina |
| Fallo permanente o agotamiento | Cualquier caso | `DeliveryAttempt` `FALLIDO` (o `REBOTADO` si el proveedor lo informa); la solicitud **permanece** ASIGNADA o DERIVADA; incidencia visible para Admin |

**Rebote posterior.** Si el proveedor informa un rebote después de `DERIVADA` (webhook), el `DeliveryAttempt` pasa a `REBOTADO` y **no** revierte la solicitud: no hay transición de salida desde DERIVADA (ADR-SW-004). La baseline no define qué puede hacer el Admin en ese caso: F2 §6 y ADM-04 sólo prevén reintentar o reasignar en ASIGNADA. Este documento registra el rebote y lo deja consultable, pero no inventa una acción; ver decisiones abiertas 1 y 6. **Mientras la decisión 6 no esté cerrada, esta incidencia no tiene tratamiento en el diseño y se mantiene como bloqueante, no como resuelta.**

**Idempotencia del resultado.** Aplicar dos veces el mismo `(attemptId, resultado)` no cambia nada. La transición `ASIGNADA → DERIVADA` sólo ocurre si la solicitud sigue ASIGNADA y el Assignment sigue `PENDIENTE_ENTREGA`.

### Reintento manual (`RetryDelivery`)

Permitido cuando el último `DeliveryAttempt` es `FALLIDO` (o `REBOTADO` informado antes de acreditar la entrega) y el Assignment sigue `PENDIENTE_ENTREGA`, con solicitud ASIGNADA o con DERIVADA en reasignación por baja. No aplica a un Assignment `EFECTIVO`. Crea `DeliveryAttempt` con `numero + 1` y un `OutboxEvent` nuevo con su propia clave. **No reactiva** el evento agotado (ADR-SW-004 §5).

### Reasignar ASIGNADA (`ASIGNADA → ASIGNADA`)

Una unidad de trabajo:

1. Cerrar el Assignment actual como `CERRADO` con `motivoCierre = REASIGNACION`.
2. Insertar el nuevo Assignment en `PENDIENTE_ENTREGA` para el Productor elegido (elegibilidad como en Asignar).
3. Llamar a `InsuranceRequestAssignmentPort.reasignar` (sin cambio de estado; TDD-SW-003, `Reassign`).
4. Insertar `DeliveryAttempt` y `OutboxEvent` nuevos.
5. Auditoría.

Los `OutboxEvent` pendientes del Assignment anterior quedan en `DESCARTADO` al procesarse, por la regla de revalidación.

### Reasignar DERIVADA (RN-19, decisión de alcance Kondor)

La baseline sólo habilita reasignar una DERIVADA cuando su Productor fue dado de baja (RN-19, F2 §12). Fuera de ese caso, F2 §6 no le da al Admin la acción de reasignar en DERIVADA, y este documento no la agrega.

Precondiciones: la cuenta del Productor actual está en `BAJA`; no hay `CancellationRequest` pendiente para la solicitud (RN-19 a); el Productor elegido tiene cuenta `ACTIVA`.

Una unidad de trabajo:

1. Cerrar el Assignment abierto de la solicitud (`EFECTIVO` o `PENDIENTE_ENTREGA`, por ejemplo si el Productor anterior todavía no había recibido la entrega) como `CERRADO` con `motivoCierre = BAJA_PRODUCTOR`, fecha, Admin y motivo.
2. Insertar el nuevo Assignment en `PENDIENTE_ENTREGA`.
3. Llamar a `InsuranceRequestAssignmentPort.reasignarDerivada(requestId, versionLeida)`: Requests valida que la solicitud siga `DERIVADA` y que no exista una `CancellationRequest` `SOLICITADA`, e incrementa `InsuranceRequest.version` sin cambiar `status`. Así serializa esta reasignación con cancelaciones y otras operaciones concurrentes, dentro de la misma UoW.
4. Insertar `DeliveryAttempt` y `OutboxEvent`.
5. Auditoría.

Efectos:

- El Productor anterior pierde el acceso **en el mismo commit**, porque el acceso exige Assignment `EFECTIVO`.
- El nuevo Productor obtiene acceso sólo cuando su entrega es exitosa y el Assignment pasa a `EFECTIVO` (regla de [Aplicar el resultado](#aplicar-el-resultado)).
- Entre ambos momentos la solicitud está DERIVADA sin Productor efectivo. Eso es una incidencia visible para el Admin, no un estado nuevo (F2 §12).

### Cancelar ASIGNADA (`CancelByCustomer`)

Una unidad de trabajo iniciada por `CancelAssignment` (TDD-SW-003):

1. `InsuranceRequestAssignmentPort.cancelar` (ASIGNADA → CANCELADA).
2. Assignment `PENDIENTE_ENTREGA` → `CERRADO` con `motivoCierre = CANCELACION`.
3. Un único `OutboxEvent` de aviso a Admin y Productor (ADR-SW-004 §7).
4. Auditoría.

Un resultado de entrega posterior se descarta por la revalidación previa y la guarda de estado.

### Decidir cancelación de DERIVADA

- **Aprobada:** misma coordinación; el Assignment no cerrado (`EFECTIVO` o `PENDIENTE_ENTREGA`, por ejemplo durante una reasignación de DERIVADA) → `CERRADO` con `motivoCierre = CANCELACION`. El aviso al Productor y la revocación de acceso ocurren en el commit. Un resultado de Delivery posterior se registra como obsoleto y nunca vuelve a otorgar acceso.
- **Rechazada:** no hay cambios en Assignment. La solicitud permanece DERIVADA; el aviso va al Cliente desde Requests (TDD-SW-003).

### Baja de Productor

La baja de la cuenta es un caso de uso de **Identity** ([ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) §4), no de Assignment. Esta es la **secuencia única** propuesta para el tratamiento de asignaciones:

1. **Corte de acceso (Identity, commit propio).** La cuenta pasa a `BAJA`. El Productor pierde el acceso a sus DERIVADAS en ese mismo commit porque la regla de acceso exige cuenta `ACTIVA`. Assignment no escribe nada en esta transacción. Las derivaciones pendientes hacia ese Productor quedan `DESCARTADO` al procesarse.
2. **Tratamiento de asignaciones (Admin, flujos de Assignment).** Cada ASIGNADA se reasigna con el flujo de reasignación de ASIGNADA; cada DERIVADA, con el flujo de reasignación de DERIVADA por baja.
3. **Baja completada (vista derivada).** `AssignmentQueryPort.asignacionesAbiertas(producerId)` lista los Assignment abiertos del Productor, con el estado de su solicitud. La baja se considera **completada** cuando esa lista está vacía. Esta comprobación la hace la consulta de Admin en la capa que compone Identity y Assignment; **no** se escribe nada en Identity y no existe dependencia Identity → Assignment (ADR-SW-001).

El prototipo de PR #19 bloquea la baja mientras haya ASIGNADAS, lo que contradice el paso 1. Eso no está confirmado por MAPS: se trata como pendiente en la decisión 2. Si se confirma el bloqueo, la verificación se hace en la misma capa de composición del paso 3, sin llevarla a Identity. Ver [Decisiones abiertas](#decisiones-abiertas).

### Errores observables

| Código | Cuándo |
| --- | --- |
| `TRANSICION_INVALIDA` | Acción no permitida para el estado de Assignment o de la solicitud |
| `PRODUCTOR_NO_DISPONIBLE` | Cuenta del Productor elegido no `ACTIVA` |
| `REASIGNACION_DERIVADA_NO_PERMITIDA` | Reasignación de DERIVADA cuyo Productor actual no está en `BAJA` |
| `ASIGNACION_NO_CERRADO_EXISTENTE` | Ya existe un Assignment no cerrado para la solicitud |
| `CANCELACION_PENDIENTE` | Reasignación de DERIVADA con `CancellationRequest` pendiente (RN-19 a) |
| `REINTENTO_NO_PERMITIDO` | Reintento sin último intento fallido o sin Assignment `PENDIENTE_ENTREGA` |
| `CONFLICTO_CONCURRENCIA` | `version` leída distinta de la actual |

## Datos, consistencia y migraciones

### Tablas lógicas

`assignment`, `delivery_attempt`, `delivery_recipient_resolution` (auditoría append-only de la dirección enmascarada y referencia/version de contacto usada en cada envío), `delivery_provider_event` (webhooks); `outbox_event` pertenece al componente Outbox ([ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md) §2).

### Restricciones

- `assignment`: índice único parcial sobre `request_id` con `estado IN ('PENDIENTE_ENTREGA','EFECTIVO')`.
- `delivery_attempt`: único por `(assignment_id, numero)`; único por `providerMessageId` cuando no es nulo.
- `delivery_provider_event`: deduplicación por identidad real del evento cuando el proveedor la expone (`providerEventId`). **No** se usa `(proveedor, providerMessageId, tipoEvento)` como clave única por defecto: si el proveedor emite un ID por evento, esa clave colapsaría dos eventos legítimos del mismo tipo para el mismo mensaje. Si el proveedor no expone ID de evento, la clave y la deduplicación se fijan en TDD-CLD-005 (decisión 5).
- `outbox_event`: único por `idempotency_key` (ADR-SW-004 §4).

### Transacciones

Cada flujo de la sección [Contratos y flujos](#contratos-y-flujos) es una unidad de trabajo. El envío de email **nunca** ocurre dentro de ellas (punto 5 de la decisión de ADR-SW-003).

### Concurrencia de reintentos, resultados y vigencia

Las garantías se apoyan en la base de datos, no en locks locales al proceso:

- **Transición atómica a efectivo.** `PENDIENTE_ENTREGA → EFECTIVO` es un `UPDATE` condicionado por `version` y `estado`; si no afecta una fila, el resultado se descarta como obsoleto.
- **Claim del outbox.** Dos workers con el lease vencido no pueden procesar el mismo evento a la vez: el reclamo del evento usa un token de lease que se verifica al registrar el resultado (TDD-CLD-005 define tiempos).
- **Acciones Admin concurrentes.** Dos reasignaciones o un reintento y una cancelación sobre la misma solicitud: la segunda recibe `CONFLICTO_CONCURRENCIA` o `TRANSICION_INVALIDA` por la condición de versión y el índice único parcial.
- **Resultado tardío.** Un resultado que llega tras baja o cancelación se registra y no muta el Assignment cerrado.

### Migraciones

Esquema versionado con expand/contract. Los valores de `estado` se guardan como texto con restricción `CHECK`. Agregar un valor exige primero desplegar código que lo tolere. Sin migración desde el PostgreSQL histórico de MAPS.

### Retención

Los `DeliveryAttempt` y los Assignment cerrados se conservan junto con la solicitud. Su retención funcional es `PENDIENTE FUNCIONAL MAPS`. Los `OutboxEvent` procesados se depuran por retención técnica, independiente de la funcional (ADR-SW-004).

## Seguridad y privacidad

- **Email minimizado.** Sólo identificador de la solicitud, producto, fecha, nombre autorizado y enlace de acceso (F1 §5). Nunca respuestas, documentos ni datos sensibles.
- **El enlace no da acceso.** El Productor debe autenticarse y el acceso se decide por Assignment `EFECTIVO` (ADR-SW-005).
- **Sin dirección completa en la base del Portal.** `emailEnmascarado` y `delivery_recipient_resolution` conservan sólo la dirección enmascarada y la referencia/version de contacto. La dirección completa vive transitoriamente en Identity y en el proveedor.
- **Payload del outbox sin PII.** Sólo identificadores; los datos se leen al procesar (ADR-SW-004 §2).
- **Webhooks autenticados.** La verificación de firma del proveedor la define TDD-CLD-005.
- **Auditoría** de asignación, reasignación, cierre, intento, resultado, descarte por obsolescencia, reintento manual y baja. Con actor, acción, entidad y fecha, sin contenido del email.

## Operación y observabilidad

- Métricas: intentos por resultado; antigüedad del outbox en `PENDIENTE`; eventos `AGOTADO`; rebotes posteriores a DERIVADA; descartes por obsolescencia; incidencias abiertas.
- Alertas (TDD-CLD-007): evento `AGOTADO`, rebote y antigüedad del outbox sobre umbral.
- Recuperación: un Assignment `PENDIENTE_ENTREGA` sin intento activo es una incidencia detectable por consulta, no sólo por alerta.

## Pruebas y criterios de fallo

Unitarias, sobre `AssignmentPolicy` y las transiciones de Assignment y DeliveryAttempt:

- Como máximo un Assignment no cerrado por solicitud.
- Reasignar cierra el Assignment anterior con fecha, Admin y motivo.
- `PENDIENTE_ENTREGA` no otorga acceso al Productor; `EFECTIVO` sí.
- `CERRADO` rechaza cualquier transición.

De aplicación (con dobles de puertos):

- Asignar exitoso crea Assignment, intento, outbox y auditoría en la misma unidad de trabajo.
- Si falla la escritura del outbox, no queda Assignment ni cambio de estado.
- Asignar a un Productor con cuenta no `ACTIVA` devuelve `PRODUCTOR_NO_DISPONIBLE` sin efectos.
- Reasignar una DERIVADA cuyo Productor sigue `ACTIVA` devuelve `REASIGNACION_DERIVADA_NO_PERMITIDA`.
- Evento de un Assignment ya `EFECTIVO` (reprocesamiento): `DESCARTADO` sin llamar al proveedor.
- Resultado de éxito con ASIGNADA: Assignment `EFECTIVO` y `marcarDerivada` llamados una vez.
- Resultado de éxito con DERIVADA (reasignación): Assignment `EFECTIVO` y solicitud sin cambios.
- Resultado de fallo: la solicitud permanece ASIGNADA o DERIVADA.
- Resultado duplicado: segunda aplicación sin efecto.
- Evento de Assignment cerrado o de Productor en `BAJA`: `DESCARTADO` sin llamar al proveedor.
- Reasignar DERIVADA: el Productor anterior pierde acceso en el mismo commit; el nuevo no lo tiene hasta el éxito.
- Cancelación aprobada de DERIVADA durante una reasignación pendiente: cierra el Assignment `PENDIENTE_ENTREGA`; un resultado posterior queda obsoleto y no restaura acceso.
- Reintento manual crea intento y clave nuevos; no reactiva el evento agotado.
- Reintento automático o manual luego de un cambio de email: resuelve la dirección vigente, conserva sólo su máscara y referencia/version en la auditoría, y no replica la dirección completa en Outbox ni DeliveryAttempt.
- Cancelar ASIGNADA produce un único aviso.
- Rechazo de cancelación DERIVADA no cambia el Assignment.

De integración, con base real y proveedor simulado:

- Carrera asignar vs. cancelar: sólo una gana; la otra recibe error de concurrencia o transición inválida.
- Índice único parcial impide dos Assignment no cerrados para la misma solicitud.
- Webhook duplicado: un solo registro y un solo cambio.
- Webhook que llega antes que el resultado síncrono: sólo aplica resultado cuando existe el correlador temprano validado por TDD-CLD-005; sin él queda pendiente de correlación y no duplica ni adelanta el cambio funcional.
- Webhook contradictorio sobre un intento terminal: queda registrado como contradictorio y genera incidencia, sin cambiar el intento.
- Procesamiento doble de un mismo evento: el resultado funcional se aplica una sola vez. El envío duplicado residual se valida con el proveedor simulado y la clave de idempotencia, no se afirma como imposible.
- Dos workers con el lease vencido sobre el mismo evento: sólo uno registra resultado; el otro queda descartado por el token de lease.
- Dos acciones Admin concurrentes (reasignar y cancelar, o reintentar y reasignar): una sola tiene efecto.
- Resultado de entrega que llega después de baja o cancelación: Assignment cerrado sin cambios; el resultado queda auditado.
- Pruebas de integración contra base real. Las comprobaciones con locks locales al proceso no cuentan como evidencia.

La entrega real de email se valida en TDD-CLD-005, no aquí.

## Implementación y handoff a F4

Secuencia sugerida: `AssignmentPolicy` y máquinas de estado con pruebas → `AssignProducer` y `DerivationEventHandler` (con proveedor simulado) → `RecordDeliveryResult` → `RetryDelivery` → reasignación de ASIGNADA → cancelaciones → reasignación de DERIVADA por baja y consulta de asignaciones abiertas → webhooks.

Dependencias: TDD-SW-003 (ya en PR #17), ADR-SW-004 (PR #17) para el componente Outbox, TDD-CLD-005 para proveedor y reintentos, TDD-SW-004 para ports de Identity. No se definen Epic ni Issues F4 en este documento.

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| **1. Estado técnico que acredita la entrega requerida** (**bloqueante de `EN REVISIÓN`**) | Software + Cloud; MAPS/Kondor para la regla funcional | Estados, separación de solicitud y entrega | Elegir entre **(A)** `ACEPTADO` con `providerMessageId` (propuesta de este documento, provisional): habilita la derivación sin esperar webhook, pero una solicitud puede quedar DERIVADA con un email que después rebota, y la baseline no le da al Admin ninguna acción en DERIVADA para corregirlo; **(B)** `ENTREGADO` por webhook: cumple RN-07 de forma más estricta, pero la solicitud queda ASIGNADA mientras no llegue la confirmación. Con (B), si la confirmación nunca llega, el intento queda con incidencia visible para Admin y el plazo y la acción son la decisión 5. Cierra con las capacidades del proveedor en TDD-CLD-005. Aceptación del proveedor no equivale a entrega al destinatario. Si se elige (A), la decisión 6 pasa a ser bloqueante |
| **2. Alcance de la baja de Productor** (bloqueante de `EN REVISIÓN`) | Kondor + MAPS | Corte de acceso derivado y reasignación | El prototipo (PR #19) bloquea la baja con ASIGNADAS; ADR-SW-005 separa el corte de acceso de la baja completada. En el relevamiento, a "¿el sistema debe impedir la baja si el Productor todavía tiene solicitudes activas?" MAPS respondió "debe informar a la Org para analizar cada caso": pide aviso y análisis, no un bloqueo. Eso respalda la secuencia propuesta aquí y contradice el bloqueo del prototipo. Confirmar con Kondor y, si igual se bloquea, dónde vive esa verificación sin crear la dependencia Identity → Assignment |
| **3. Bandeja de solicitudes sin Productor efectivo** | Kondor (F2) | Incidencia derivada de Assignment `PENDIENTE_ENTREGA` | Diseño de la bandeja del Admin |
| **4. Política de reintentos automáticos y manuales** | Cloud | Límite de intentos y espera como parámetros | Valores definidos en TDD-CLD-005 |
| **5. Tratamiento operativo de incidencias y SLA de derivación** | `PENDIENTE FUNCIONAL MAPS` | Registro, separación de estados y recuperación técnica. Incluye: plazo sin confirmación de webhook con opción (B) de la decisión 1, y clave de deduplicación de eventos de proveedor (ver Restricciones) | Plazos, acciones operativas y capacidades del proveedor confirmadas en TDD-CLD-005 |
| **6. Rebote posterior a DERIVADA** | MAPS + Kondor (F2) | Registro del rebote sin revertir la solicitud | Definir si el Admin puede reenviar el aviso o reasignar una DERIVADA con Productor activo. Hoy F2 §6 no lo permite; habilitarlo es un cambio controlado de F1/F2 |
| **7. Inhabilitación de Productor en la elegibilidad** | MAPS (RN-20) | Elegibilidad por cuenta `ACTIVA` | RN-15 y F2 ADM-03 mencionan no asignar a inhabilitados, pero ADR-SW-005 §5 no modela ese estado hasta que MAPS cierre RN-20. MAPS respondió "no van a existir casos inhabilitados" a las tres preguntas sobre inhabilitación del relevamiento, lo que apunta a quitarla del MVP; falta el cambio controlado en F1/F2 |

## Referencias y trazabilidad

- ADR y TDD relacionados: [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md), [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); previstos TDD-SW-004, TDD-SW-006, ADR-CLD-003, TDD-CLD-003, TDD-CLD-005.
- Fuentes F0/F1/F2: [F1 §3/5, RN-04/05/06/07/10/16/19, RF-DELIVERY-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §5/6/12](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Filas de [traceability.md](../../../traceability.md): Admin asigna; fallo conserva ASIGNADA; entrega requerida exitosa precede DERIVADA; acceso del Productor; reasignación de DERIVADA.

## Respuesta a la revisión cruzada

Revisión de Santiago Talavera en la PR #20 (Software–Cloud, TDD-SW-005). Cada punto y dónde quedó atendido:

| # | Punto | Respuesta en este documento |
| --- | --- | --- |
| 1 | Semántica de "entrega requerida exitosa" | Marcada como provisional en el flujo y en la tabla de estados técnicos; decisión 1 bloqueante, con la opción (B) y su caso de webhook que nunca llega |
| 2 | Rebote posterior a DERIVADA | Marcado como bloqueante, no resuelto, mientras no se cierre la decisión 6 |
| 3 | Secuencia de baja de Productor | [Baja de Productor](#baja-de-productor): secuencia única en tres pasos; precondición de reasignación corregida (`EFECTIVO` o `PENDIENTE_ENTREGA`) |
| 4 | Garantía de descarte y entrega única | [Procesar la derivación](#procesar-la-derivación-fuera-de-la-unidad-de-trabajo): limitación documentada; garantía reformulada como no duplicar el resultado funcional |
| 5 | Máquina de resultados y webhooks | Tabla de transiciones y estados terminales; `providerMessageId` nulo al inicio; clave de `delivery_provider_event` corregida |
| 6 | Concurrencia de reintentos, resultados y vigencia | [Concurrencia de reintentos, resultados y vigencia](#concurrencia-de-reintentos-resultados-y-vigencia) y pruebas de integración correspondientes |
| — | Dependencias Cloud y funcionales | Decisiones 1, 2, 5 y 6 explícitas; ADR-SW-004 se revisa aparte para reflejar la limitación de envío |

### Seguimiento de revisión 2026-10-22

| Punto | Respuesta en este documento |
| --- | --- |
| Reconciliación con `main` | La rama se reconcilia preservando ADR-SW-004 y el contrato integrado de TDD-SW-003; este TDD usa sus estados `PENDIENTE_ENTREGA` / `EFECTIVO` / `CERRADO` |
| `ReassignDerived` y Requests | [Reasignar DERIVADA](#reasignar-derivada-rn-19-decisión-de-alcance-kondor) invoca `InsuranceRequestAssignmentPort.reasignarDerivada` en la misma UoW; Requests valida y avanza `InsuranceRequest.version` sin cambiar `DERIVADA` |
| Cancelación durante reasignación pendiente | [Decidir cancelación de DERIVADA](#decidir-cancelación-de-derivada) cierra el Assignment no cerrado, incluido `PENDIENTE_ENTREGA`; el resultado posterior queda obsoleto |
| Webhook previo al resultado síncrono | [Estados técnicos](#deliveryattempt) y [Correlación temprana](#deliveryattempt) lo condicionan a un correlador auténtico que TDD-CLD-005 debe confirmar; sin él no hay transición funcional |
| Dirección en reintentos | [Procesar la derivación](#procesar-la-derivación-fuera-de-la-unidad-de-trabajo) resuelve la dirección vigente por envío y registra sólo máscara + referencia/version de contacto |

Pendiente, fuera de este documento: la revisión de ADR-SW-004 (limitación de envío y semántica de resultado) y la decisión 1, que depende de las capacidades del proveedor en TDD-CLD-005.

## Criterio de aprobación

Puede pasar a `EN REVISIÓN` cuando Santiago complete la revisión cruzada del proveedor, los webhooks y el procesador (TDD-CLD-005 y ADR-CLD-003), y las decisiones 1 y 2 estén registradas. Pasa a `APROBADO` cuando ADR-SW-004/005 estén `ACEPTADO`, TDD-SW-003 esté `APROBADO` y las decisiones 1 y 2 estén cerradas.
