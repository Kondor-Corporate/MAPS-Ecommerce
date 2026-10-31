# TDD — InsuranceRequest, snapshots y máquina de estados

| Dato | Valor |
| --- | --- |
| ID | `TDD-SW-003` |
| Título | InsuranceRequest, snapshots y máquina de estados |
| Estado | `APROBADO` |
| Fecha | 2026-10-01 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera — revisión cruzada Cloud favorable con cambios; conformidad final `APPROVED` en PR #17 el 2026-10-17, constancia incorporada 2026-10-22 |
| Work item | [MAPS-113](https://santitalavera.atlassian.net/browse/MAPS-113) · subtarea [MAPS-140](https://santitalavera.atlassian.net/browse/MAPS-140) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-113 |
| Fase origen | [F1 §2/3/4, RN-02/03/06/07/08/09/10/18/19, RF-SOL-01 a 05](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §5/6/8/10/12](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md); [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md); [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md); [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); TDD-SW-002 y TDD-SW-005 (previstos, sin redactar) |
| Depende de | ADR-SW-001/002/003/004/005 (`ACEPTADO`) y TDD-SW-001 (`APROBADO`) |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `BORRADOR`, `EN REVISIÓN`, `APROBADO`, `REEMPLAZADO`.

## Propósito y límites

Diseña el agregado `InsuranceRequest` del módulo Requests: comandos, guardas, transiciones, efectos, snapshots, concurrencia y errores observables. Profundiza la tabla de transiciones de [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md) sin cambiarla.

No define el esquema de campos ni la validación por tipo de campo (TDD-SW-002, condicionado al contrato de formularios MAPS), ni el ciclo de vida de Assignment/DeliveryAttempt ni qué estado técnico acredita la entrega exitosa (TDD-SW-005), ni la autorización detallada por rol (TDD-SW-004). Los consume como puertos.

## Baseline y dependencias

| Regla / dependencia | Fuente y estado | Impacto en el diseño |
| --- | --- | --- |
| Cinco estados funcionales; ningún estado técnico se suma | [F1 §2](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §8](../../../../02-diseno/Fase_2__Design_Handoff.md) — CONFIRMADO | Enum cerrado de cinco valores |
| Guardado manual de BORRADOR admite incompletitud | RN-03, [F2 §9](../../../../02-diseno/Fase_2__Design_Handoff.md) — CONFIRMADO | `SaveDraft` sin validación de completitud |
| Envío exige completitud y precio vigente confirmado/reconfirmado | RN-09, RF-SOL-04 — CONFIRMADO | Guarda de `Submit` |
| ENVIADA preserva snapshot del precio confirmado | RN-09 — CONFIRMADO | Snapshot inmutable al enviar |
| Descarte de BORRADOR no es CANCELADA | RN-10 — CONFIRMADO | Marca de descarte, no transición |
| Cancelación por estado; DERIVADA con solicitud y decisión de Admin | RN-10, RF-SOL-05 — CONFIRMADO | `CancellationRequest` asociada |
| CANCELADA es final | [F1 §3](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) — CONFIRMADO | Sin transiciones salientes |
| Entrega exitosa antes de DERIVADA; falla conserva ASIGNADA | RN-06/07 — CONFIRMADO | Transición disparada por resultado de Delivery, revalidada |
| Versión retirada vuelve no utilizable al BORRADOR | [F2 §5/10](../../../../02-diseno/Fase_2__Design_Handoff.md) — CONFIRMADO | Condición derivada, no estado |
| Baja de Cliente: las solicitudes ENVIADA, ASIGNADA y DERIVADA siguen su ciclo | RN-18 — CONFIRMADO; baja lógica sin borrado | Ninguna transición de esas solicitudes depende del estado de cuenta del Cliente; RN-18 no define comportamiento adicional para BORRADOR |
| Baja de Productor: ASIGNADAS y DERIVADAS requieren tratamiento por Admin antes de completar la baja | RN-19, [F2 §12](../../../../02-diseno/Fase_2__Design_Handoff.md) — decisión de alcance Kondor MVP | ASIGNADA: `Reassign`. DERIVADA: `ReassignDerived`, que conserva el estado y crea una nueva asignación auditable, efectiva tras entrega exitosa |
| Tipos/propiedades de campos de formulario | `PENDIENTE FUNCIONAL MAPS` | Completitud se delega a un puerto de Forms |
| Retención de BORRADORES descartados y no utilizables | `PENDIENTE FUNCIONAL MAPS` | Sin borrado físico |

## Vista de componentes y responsabilidades

```text
Requests (owner de InsuranceRequest, RequestAnswer, Consent, CancellationRequest)
├── domain/
│   ├── InsuranceRequest          agregado raíz: estado, snapshots, versión de concurrencia
│   ├── RequestStateMachine       tabla de transiciones permitidas y guardas puras
│   ├── PriceSnapshot, ProductSnapshot   value objects inmutables
│   └── CancellationRequest       situación asociada (solicitada/aprobada/rechazada)
├── application/                  casos de uso (comandos de la tabla siguiente)
├── ports/in/
│   └── InsuranceRequestAssignmentPort  validar y cambiar el vínculo de la solicitud (invocado por Assignment)
└── ports/out/
    ├── FormsQueryPort            versión utilizable, validación de completitud (Forms)
    ├── CatalogQueryPort          precio vigente y disponibilidad del Product (Catalog)
    ├── OutboxPort                avisos ([ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md))
    ├── AuditPort                 eventos de auditoría (Audit)
    └── InsuranceRequestRepository
```

`RequestStateMachine` es código de dominio puro. Recibe el estado actual, el comando y los datos ya consultados, y devuelve la transición o un error. Los casos de uso consultan los puertos, invocan al dominio y persisten en una unidad de trabajo ([ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md)).

## Contratos y flujos

### Diagrama de estados

```text
               ┌───────────── Discard (marca, no transición)
               │
 CreateDraft → BORRADOR ──Submit──→ ENVIADA ──Assign──→ ASIGNADA ──DeliverySucceeded──→ DERIVADA
                                      │                  │  ▲   │                         │
                                      │      CancelByCustomer  └─Reassign               DecideCancellation
                                      │                  │                              (aprobada)
                                      └─CancelByCustomer─┴──────────→ CANCELADA ←───────────┘
                                                                     (final)
```

`ReassignDerived` no aparece en el diagrama porque no cambia el estado: la DERIVADA reasignada por baja de su Productor sigue DERIVADA (RN-19).

### Comandos

| Comando | Actor | Estado origen → destino | Guardas | Efectos en la misma transacción |
| --- | --- | --- | --- | --- |
| `CreateDraft` | Cliente | — → BORRADOR | Product disponible; FormVersion utilizable (Forms) | Fija `formVersionId` y `draftPriceRef`; auditoría |
| `SaveDraft` | Cliente propietario | BORRADOR → BORRADOR | BORRADOR utilizable y no descartado; respuestas corresponden a campos de su FormVersion | Persiste respuestas parciales; no valida completitud |
| `DiscardDraft` | Cliente propietario | BORRADOR (sin cambio de estado) | No descartado | `discardedAt`, `discardedBy`; auditoría; sin motivo |
| `ConfirmPrice` | Cliente propietario | BORRADOR → BORRADOR | Precio enviado por el cliente == precio vigente (Catalog) | `confirmedPrice` + identificador de precio vigente + fecha |
| `Submit` | Cliente propietario | BORRADOR → ENVIADA | Utilizable; completitud (Forms); consentimientos; `confirmedPrice` coincide con el precio vigente actual | Snapshots de precio y Product; `submittedAt`; `number` ([enmienda 2026-10-29](#enmienda-2026-10-29-número-de-solicitud)); auditoría |
| `Assign` | Admin, coordinado por Assignment | ENVIADA → ASIGNADA | Productor con cuenta activa (Identity) | Assignment crea el vínculo y solicita a Requests el cambio de estado dentro de la misma UoW; intención de entrega y auditoría |
| `Reassign` | Admin, coordinado por Assignment | ASIGNADA → ASIGNADA | Productor distinto con cuenta activa | Assignment cierra el vínculo anterior, solicita a Requests el cambio y crea el nuevo vínculo/intención de entrega dentro de la misma UoW; auditoría |
| `ReassignDerived` | Admin, coordinado por Assignment | DERIVADA → DERIVADA | Sólo dentro del tratamiento de la baja del Productor vigente (RN-19); no hay CancellationRequest `SOLICITADA` (el Admin la resuelve antes); Productor nuevo distinto, con cuenta activa; motivo no vacío | Requests valida estado y cancelaciones por puerto, sin cambiar `status`. Assignment cierra el vínculo anterior (fecha, Admin, motivo), crea el nuevo como pendiente de entrega y registra la intención de entrega en la misma UoW; auditoría. El Productor anterior pierde el acceso al cerrarse su vínculo ([ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md)) |
| `MarkDerived` | Sistema | ASIGNADA → DERIVADA | Sigue ASIGNADA; resultado pertenece al Assignment `PENDIENTE_ENTREGA` de la solicitud; entrega acreditada como exitosa (TDD-SW-005) | En la misma UoW, Assignment pasa ese vínculo a `EFECTIVO`; auditoría; acceso del Productor queda derivado ([ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md)) |
| `CancelByCustomer` | Cliente propietario; coordinado por Assignment si existe un Assignment no cerrado | ENVIADA/ASIGNADA → CANCELADA | Motivo no vacío; confirmación explícita | Actor, fecha y motivo; el coordinador persiste la cancelación en Requests y, sólo si corresponde, cierra el Assignment de su propiedad en la misma UoW; un único evento/intención lógica de aviso (outbox); auditoría |
| `RequestCancellation` | Cliente propietario | DERIVADA (sin cambio) | Motivo; no hay otra CancellationRequest pendiente | CancellationRequest `SOLICITADA`; aviso a Admin; auditoría |
| `DecideCancellation` | Admin; coordinado por Assignment si se aprueba | DERIVADA → CANCELADA (aprueba) o sin cambio (rechaza) | CancellationRequest `SOLICITADA` | Decisión, Admin y fecha; si aprueba, el coordinador persiste CANCELADA en Requests y cierra el Assignment de su propiedad en la misma UoW, con evento/intención lógica de aviso al Productor; si rechaza queda DERIVADA y se registra un evento/intención lógica de aviso al Cliente; auditoría |

Cualquier combinación no listada es inválida y devuelve `TRANSICION_INVALIDA` sin efectos. CANCELADA no acepta comandos.

### Condiciones derivadas (no son estados)

| Condición | Cálculo | Efecto |
| --- | --- | --- |
| BORRADOR no utilizable | Su FormVersion está retirada (Forms) | Rechaza `SaveDraft`, `ConfirmPrice`, `Submit`; UX ofrece iniciar uno nuevo sin copiar respuestas |
| BORRADOR descartado | `discardedAt` no nulo | Fuera de Mis solicitudes; rechaza todos los comandos |
| Precio cambiado | `confirmedPriceRef` está ausente o difiere de la referencia vigente | UX muestra aviso; `Submit` exige `ConfirmPrice` con la referencia vigente. `draftPriceRef` se conserva sólo como dato histórico/UX y no mantiene activa la alerta después de una reconfirmación válida |
| Incidencia de derivación | ASIGNADA con último DeliveryAttempt fallido/rebotado | Visible al Admin; el estado sigue ASIGNADA |
| Reasignación de DERIVADA pendiente o fallida | DERIVADA cuya nueva asignación todavía no tiene entrega exitosa | Visible al Admin, que reintenta o vuelve a reasignar; el estado sigue DERIVADA y ningún Productor tiene acceso hasta que la entrega sea exitosa |

### Resultado de entrega (integración con ADR-SW-004)

Assignment es el módulo iniciador de `Assign` y `Reassign`; Requests sólo expone `InsuranceRequestAssignmentPort` para validar y aplicar el cambio de estado de `InsuranceRequest`. Las cancelaciones que deben afectar ambos owners se coordinan también desde la aplicación de Assignment: el coordinador invoca un puerto de Requests para cancelar la solicitud y el repositorio de Assignment para cerrarlo, en una única UoW. Requests nunca crea, cierra ni comanda un Assignment directamente, por lo que no depende de Assignment ni se crea un ciclo entre módulos. Assignment recibe el resultado del procesador de outbox y, en su transacción, invoca `MarkDerived` sólo ante un resultado exitoso. `MarkDerived` es idempotente y tolera resultados obsoletos: si la solicitud ya no está ASIGNADA (cancelada, ya derivada) o el Assignment del resultado está `CERRADO` (reasignada), no hace nada y registra el descarte en auditoría técnica. Un resultado fallido no invoca ningún comando de Requests.

En una reasignación de DERIVADA (`ReassignDerived`), el resultado exitoso no invoca `MarkDerived`: Assignment pasa la nueva asignación de `PENDIENTE_ENTREGA` a `EFECTIVO` en su propia transacción y, desde ese momento, el nuevo Productor obtiene acceso por la política de [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md). La entrega exitosa se acredita con el mismo criterio que para `ASIGNADA → DERIVADA` (RN-07, TDD-SW-005). Un resultado fallido deja visible la reasignación pendiente para el Admin. Si mientras tanto se aprueba una cancelación de la DERIVADA, el coordinador cierra también la asignación pendiente y el resultado posterior se descarta como obsoleto.

### Estados conceptuales de Assignment y autorización

Para que autorización, entrega y reasignación usen la misma semántica, este TDD fija tres estados conceptuales de Assignment. Son de Assignment, no de `InsuranceRequest`, y su representación física la define TDD-SW-005:

| Estado de Assignment | Significado | ¿Autoriza al Productor? |
| --- | --- | --- |
| `PENDIENTE_ENTREGA` | Creado por `Assign`, `Reassign` o `ReassignDerived`; su entrega todavía no fue acreditada como exitosa | No |
| `EFECTIVO` | Entrega exitosa acreditada para **ese** Assignment | Sí, si además la solicitud es DERIVADA y la cuenta del Productor está activa |
| `CERRADO` | Terminal, con motivo: reasignada, cancelada o baja del Productor | No |

Reglas:

- Sólo `PENDIENTE_ENTREGA → EFECTIVO` (por un resultado exitoso de ese mismo Assignment) y `PENDIENTE_ENTREGA | EFECTIVO → CERRADO`. `CERRADO` no tiene salida.
- Un resultado duplicado o tardío nunca reactiva un Assignment `CERRADO` ni aplica efectos sobre una solicitud CANCELADA: se registra como descarte.
- En una solicitud hay a lo sumo un Assignment no cerrado (`PENDIENTE_ENTREGA` o `EFECTIVO`). Ver Concurrencia.
- [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) usa `EFECTIVO` como condición de acceso del Productor y [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md) usa `CERRADO` para descartar eventos y resultados obsoletos.

### Errores observables

| Código | Cuándo |
| --- | --- |
| `TRANSICION_INVALIDA` | Comando no permitido para el estado actual |
| `BORRADOR_NO_UTILIZABLE` | FormVersion retirada |
| `SOLICITUD_INCOMPLETA` | Faltan requeridos, pasos, documentos o consentimientos (detalle por campo desde Forms) |
| `PRECIO_NO_CONFIRMADO` | El precio vigente cambió y no fue reconfirmado |
| `PRODUCTO_NO_DISPONIBLE` | Product no disponible al crear el BORRADOR |
| `PRODUCTOR_NO_DISPONIBLE` | Cuenta del Productor no activa al asignar |
| `CANCELACION_YA_SOLICITADA` | Existe una CancellationRequest pendiente |
| `MOTIVO_REQUERIDO` | Cancelación sin motivo |
| `CONFLICTO_CONCURRENCIA` | La solicitud cambió desde que se leyó (ver Concurrencia) |
| `IDEMPOTENCIA_CONFLICTO` | Se reutilizó una clave de idempotencia con parámetros distintos (ver Idempotencia) |

El contrato HTTP de estos errores lo fija TDD-SW-008.

## Datos, consistencia y migraciones

### Atributos del agregado

| Atributo | Momento en que se fija | Mutable |
| --- | --- | --- |
| `customerId`, `productId`, `formVersionId` | `CreateDraft` | No |
| `status` | Cada transición | Sólo por comandos |
| `draftPriceRef` | `CreateDraft` | No |
| `confirmedPrice`, `confirmedPriceRef`, `confirmedAt` | `ConfirmPrice` | Sí, mientras BORRADOR |
| `priceSnapshot` (monto, moneda, referencia de precio) | `Submit` | No |
| `productSnapshot` (nombre y datos comerciales mostrados) | `Submit` | No |
| `submittedAt` | `Submit` | No |
| `number` (número de solicitud) | `Submit` | No |
| `discardedAt`, `discardedBy` | `DiscardDraft` | No |
| `cancelledAt`, `cancelledBy`, `cancellationReason` | Transición a CANCELADA | No |
| `version` | Cada escritura | Incremental |

El precio se compara por la referencia de precio vigente que provee Catalog. Comparar sólo el monto no detectaría un cambio que vuelve a un valor anterior. Cómo versiona Catalog el precio se define en TDD-SW-002.

### Concurrencia

Control optimista con `version`: cada comando lee la solicitud, valida y escribe condicionado a la versión leída. Si otra operación escribió antes (p. ej. el Cliente cancela una ENVIADA mientras el Admin la asigna), la segunda falla con `CONFLICTO_CONCURRENCIA` y se reintenta con el estado nuevo, donde la guarda decidirá. No se usan bloqueos pesimistas de larga duración.

**Invariantes entre agregados.** `InsuranceRequest.version` resuelve conflictos sobre la solicitud, pero por sí sola no garantiza invariantes que viven en otras entidades. Para ellas se combinan dos controles, cada uno en el owner de su tabla ([ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md)):

| Invariante | Control transaccional | Restricción de respaldo en la base | Owner |
| --- | --- | --- | --- |
| A lo sumo una `CancellationRequest` `SOLICITADA` por solicitud | `RequestCancellation` y `DecideCancellation` escriben también `InsuranceRequest` condicionado a `version`, así que dos solicitudes concurrentes se serializan | Índice único parcial sobre la solicitud cuando la `CancellationRequest` está `SOLICITADA`, o condición equivalente | Requests |
| A lo sumo un Assignment no cerrado por solicitud | Todo comando que crea o cierra un Assignment invoca a Requests por `InsuranceRequestAssignmentPort` en la misma UoW, que incrementa `version` aunque `status` no cambie (`Reassign`, `ReassignDerived`) | Índice único parcial sobre la solicitud cuando el Assignment está `PENDIENTE_ENTREGA` o `EFECTIVO`, o condición equivalente | Assignment |

Si dos operaciones compiten, una gana y la otra recibe `CONFLICTO_CONCURRENCIA`; la restricción de base es la última barrera ante un error de coordinación. Los nombres físicos y las pruebas concurrentes de Assignment los fija TDD-SW-005.

**Consistencia de `Submit` con Catalog y Forms.** Consultar precio, Product disponible y FormVersion utilizable no basta si Catalog o Forms cambian entre la consulta y el commit. La garantía funcional es:

- Un cambio de precio, de disponibilidad o un retiro urgente **confirmado antes** del commit de `Submit` hace que `Submit` falle (`PRECIO_NO_CONFIRMADO`, `PRODUCTO_NO_DISPONIBLE` o `BORRADOR_NO_UTILIZABLE`).
- Un cambio confirmado **después** queda ordenado después de `Submit`: la solicitud queda ENVIADA con el snapshot que el Cliente confirmó (RN-09).

Como todos los módulos comparten la misma base PostgreSQL y la misma UoW ([ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md)), el mecanismo es un bloqueo corto dentro de la transacción: `CatalogQueryPort` y `FormsQueryPort` leen la referencia de precio, la disponibilidad y la FormVersion con un bloqueo compartido, y los comandos de Catalog/Forms que las cambian toman un bloqueo exclusivo sobre esas mismas filas. Un mecanismo equivalente (por ejemplo, revalidar versiones al commit) es válido si sostiene la misma garantía. El bloqueo dura sólo la transacción, así que es compatible con evitar bloqueos de larga duración. Cómo versiona y serializa Catalog el precio vigente y Forms la disponibilidad lo detalla TDD-SW-002. Un lock en memoria de una instancia no es una garantía válida con varias instancias (TDD-CLD-003/005).

### Idempotencia de comandos del usuario

`Submit`, `CancelByCustomer`, `RequestCancellation` y `DecideCancellation` aceptan una clave de idempotencia de request: un doble clic o reintento de red devuelve el resultado ya registrado sin duplicar efectos ni avisos.

| Aspecto | Contrato |
| --- | --- |
| Alcance de la clave | `(actorId, operación, requestId, clave)`. La misma clave en otra operación, otro recurso u otro actor es independiente |
| Huella de parámetros | Se guarda un hash de los parámetros relevantes del comando (p. ej. motivo, decisión, referencia de precio confirmada) |
| Misma clave, misma huella | Devuelve el resultado registrado, sin nuevos efectos, avisos ni auditoría |
| Misma clave, huella distinta | Rechazo con `IDEMPOTENCIA_CONFLICTO`, sin efectos |
| Atomicidad | El registro de la clave se persiste en la misma UoW que el cambio de estado, la auditoría y las intenciones de Outbox: o queda todo o nada |
| Reintento concurrente | Una restricción única sobre el alcance de la clave hace que sólo una ejecución confirme; la otra devuelve el resultado de la ganadora o, si todavía no está confirmado, `CONFLICTO_CONCURRENCIA` para reintentar |
| Retención | Ventana técnica acotada, suficiente para cubrir reintentos de red; su valor lo fija TDD-SW-008 |

### Migraciones

Sin migración de datos desde el PostgreSQL histórico de MAPS. El enum de estados se crea con los cinco valores. Agregar uno exige antes un cambio funcional aprobado en F1/F2.

## Seguridad y privacidad

- Cada comando evalúa la política de [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) antes de cualquier lectura de negocio; un Cliente que no es propietario recibe "no encontrado" en lugar de "prohibido", así no se revela que la solicitud existe.
- El estado de cuenta del Cliente no altera el lifecycle de las solicitudes ENVIADA, ASIGNADA y DERIVADA definido por RN-18; RN-18 no fija efectos adicionales para BORRADOR.
- Auditoría con actor, acción, solicitud y fecha; sin respuestas, documentos ni PII innecesaria.

## Operación y observabilidad

- Métrica técnica de comandos rechazados por código de error (incluido rechazo por guarda) y de `CONFLICTO_CONCURRENCIA` (señal de contención).
- Resultados de entrega descartados por obsoletos quedan registrados para diagnóstico y como métrica.
- Las métricas y registros no incluyen PII ni respuestas de formularios (TDD-CLD-007).
- Integración con telemetría: TDD-SW-007 y TDD-CLD-007.

## Revisión cruzada Cloud — 14/10/2026

**Revisor:** Santiago Talavera. **Resultado:** favorable con cambios solicitados, incorporados antes de la conformidad final `APPROVED` del 2026-10-17 en la [PR #17](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/17). **Constancia formal:** [PR #24](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/24), incorporada el 2026-10-22.

El análisis detallado y la distinción entre observaciones originales y correcciones ya incorporadas se publican como comentario individual en la PR #24. Los contratos de Catalog/Forms, Assignment/Delivery, concurrencia de PostgreSQL, resultados externos e idempotencia operativa continúan en TDD-SW-002/005 y TDD-CLD-003/005; la aprobación no los cierra.

## Pruebas y criterios de fallo

Unitarias sobre `RequestStateMachine` (sin infraestructura):

- Cada par estado × comando de la matriz: permitido o `TRANSICION_INVALIDA`; CANCELADA rechaza todo.
- `DiscardDraft` no cambia `status` y no exige motivo.
- `Submit` rechazado por: incompleto, consentimiento faltante, precio cambiado sin reconfirmar, versión retirada.
- `priceSnapshot` intacto tras cambiar el precio vigente.
- Tras confirmar un precio nuevo, `confirmedPriceRef` coincide con el vigente y `Submit` no vuelve a exigir reconfirmación sólo porque `draftPriceRef` sea histórico.
- `DecideCancellation` rechazada conserva DERIVADA y registra decisión.

De aplicación (con dobles de puertos) e integración (con base real):

- `MarkDerived` duplicado: segunda invocación sin efecto.
- `MarkDerived` de un Assignment reemplazado o tras cancelación: descartado.
- Carrera cancelación vs. asignación: exactamente una gana; la otra recibe `CONFLICTO_CONCURRENCIA` o `TRANSICION_INVALIDA`.
- Cancelación de ASIGNADA y aprobación de cancelación de DERIVADA se coordinan desde Assignment: se actualiza Requests por puerto y se cierra el Assignment owner en la misma UoW, sin dependencia Requests → Assignment.
- `Submit` repetido con la misma clave de idempotencia: un solo snapshot y una sola auditoría.
- Dos `Submit` concurrentes con la misma clave: uno confirma; el otro devuelve el mismo resultado o `CONFLICTO_CONCURRENCIA`, nunca un segundo snapshot.
- Clave reutilizada con parámetros distintos (p. ej. otro motivo de cancelación): `IDEMPOTENCIA_CONFLICTO` sin efectos.
- Carrera `Submit` vs. cambio de precio: si el cambio confirma antes, `Submit` falla con `PRECIO_NO_CONFIRMADO`; si confirma después, la ENVIADA conserva el snapshot confirmado.
- Carrera `Submit` vs. retiro urgente de FormVersion: si el retiro confirma antes, `Submit` falla con `BORRADOR_NO_UTILIZABLE`; nunca queda una ENVIADA sobre una versión retirada antes de su commit.
- Dos `RequestCancellation` concurrentes: a lo sumo una `CancellationRequest` `SOLICITADA`.
- Dos reasignaciones concurrentes de la misma solicitud: a lo sumo un Assignment no cerrado.
- `ReassignDerived`: la solicitud sigue DERIVADA; el vínculo anterior queda `CERRADO` con fecha, Admin y motivo, y el Productor anterior pierde el acceso; se rechaza con una CancellationRequest `SOLICITADA`.
- Entrega fallida de la nueva asignación de una DERIVADA: la reasignación queda `PENDIENTE_ENTREGA` y visible para el Admin, y el nuevo Productor no tiene acceso. Con entrega exitosa, la asignación pasa a `EFECTIVO` sin invocar `MarkDerived`.
- Resultado exitoso duplicado o tardío para un Assignment `CERRADO`: descartado; no devuelve acceso ni cambia estado.
- Cliente dado de baja: sus solicitudes ENVIADA, ASIGNADA y DERIVADA continúan su ciclo según RN-18; sus comandos son rechazados por el estado de cuenta local. Este TDD no infiere comportamiento adicional para BORRADOR.

Las pruebas con proveedor de email simulado verifican semántica; la entrega real se valida en TDD-CLD-005.

## Implementación y handoff a F4

Secuencia sugerida: dominio y `RequestStateMachine` con pruebas → `CreateDraft`/`SaveDraft`/`DiscardDraft` → `ConfirmPrice`/`Submit` (requiere Catalog y Forms) → `Assign`/`Reassign`/`MarkDerived` (requiere TDD-SW-005) → cancelaciones → `ReassignDerived` para la baja de Productor (requiere TDD-SW-005). No se definen Epic/Issues F4 en este documento.

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| Bandeja de solicitudes afectadas por la baja de un Productor | Kondor (UX, F2/F4) | `Reassign`, `ReassignDerived` y el listado de ASIGNADAS y DERIVADAS del Productor | Definir cómo el Admin ve y trabaja esa bandeja, incluidas las reasignaciones de DERIVADA pendientes o fallidas |
| Estado técnico que acredita entrega exitosa | Software + Cloud | Guarda de `MarkDerived` como contrato | TDD-SW-005 |
| Representación de Assignment y sus invariantes | Software | Estados conceptuales y reglas de este TDD | TDD-SW-005: actualización atómica de Assignment y resultado, restricciones de asignación no cerrada, resultados obsoletos, reintentos y pruebas concurrentes |
| Versionado del precio y de la disponibilidad del formulario | Software | Garantía de consistencia de `Submit` | TDD-SW-002: cómo se versiona y serializa el precio vigente y la disponibilidad de FormVersion durante `Submit` |
| Conexiones y transacciones concurrentes | Cloud | Transacciones cortas y bloqueos acotados | TDD-CLD-003/005: transacciones acotadas en PostgreSQL con API y workers concurrentes |
| Completitud por tipo de campo | `PENDIENTE FUNCIONAL MAPS` | Puerto `FormsQueryPort` y códigos de error | TDD-SW-002 tras validar 1–2 formularios reales |
| Retención de BORRADORES descartados/no utilizables | `PENDIENTE FUNCIONAL MAPS` | Marcas sin borrado físico | Plazos y eliminación aprobados |

## Enmienda 2026-10-29: número de solicitud

La [enmienda 2026-10-29 de TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md#enmienda-2026-10-29-número-de-solicitud) incorpora el atributo `number`. Esta enmienda fija cuándo lo asigna la máquina de estados; no cambia estados, comandos, guardas ni errores.

- **Qué se añade:** `Submit` asigna `number` en la misma UoW que el cambio a ENVIADA, los snapshots y la auditoría. El valor se toma de la secuencia después de validar las guardas, así que un `Submit` rechazado por guarda no consume número. `nextval` no se revierte: un fallo posterior o una carrera dentro de la transacción puede dejar un hueco. Por eso `number` no sirve para contar envíos exitosos ni para métricas, y no se exige correlativo.
- **Idempotencia:** un reintento de `Submit` con la misma clave devuelve el resultado registrado, con el mismo número; nunca asigna uno nuevo.
- **Concurrencia y restricciones:** `UNIQUE (number)` impide duplicados y `CHECK ((status = 'BORRADOR') = (number IS NULL))` ata el número al estado, incluidos los BORRADORES descartados. La secuencia no requiere bloqueos adicionales ni interfiere con el bloqueo corto sobre Catalog y Forms descrito en [Concurrencia](#concurrencia).
- **Pruebas de integración con PostgreSQL real:** el `CHECK` rechaza un BORRADOR o un descartado con número y una solicitud de otro estado sin número; dos `Submit` concurrentes sobre la misma solicitud y un reintento con la misma clave dejan un solo número persistido y devuelven ese número; un `Submit` revertido después de `nextval` no deja número en la solicitud y admite el hueco.
- **Qué no cambia:** ningún otro comando modifica `number`; `DiscardDraft` no lo asigna; CANCELADA lo conserva. La búsqueda aplica RBAC y `AccessScope`.
- **Migraciones:** como todavía no hay datos productivos, la columna, la secuencia, el índice único y el `CHECK` entran en la migración inicial. Si se incorporaran sobre datos existentes, se seguiría expand/contract: columna nula, backfill por orden de `submittedAt` y luego las restricciones.
- **Impacto Cloud (TDD-CLD-003):** no cambia topología, dimensionamiento ni estrategia de backup, pero amplía el esquema que esos mecanismos deben cubrir: ownership de la secuencia y `USAGE` para el rol de la aplicación, restricciones e índices, y restauración consistente del estado de la secuencia. Una prueba de recuperación verifica que el próximo valor supere `MAX(number)`. Una restauración a un punto anterior o una intervención manual puede reutilizar números ya comunicados a un Cliente, incluso de solicitudes perdidas con esa restauración: el procedimiento debe avanzar la secuencia antes de reabrir el servicio.
- **Trazabilidad:** contrato HTTP y búsqueda por `q` en TDD-SW-008 ([PR #33](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/33)), cuya dependencia del atributo resuelve esta enmienda; formato visible pendiente con UX. Registrada bajo [MAPS-115](https://santitalavera.atlassian.net/browse/MAPS-115).
- **Ratificación:** Joaquin Rodriguez, responsable de Software, ratifica esta enmienda el 2026-10-30 en la [conversación de PR #34](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/34), donde se solicita además la conformidad de la revisión cruzada. El historial de aprobación original se conserva y el documento no vuelve a `BORRADOR`.

## Referencias y trazabilidad

- ADR y TDD relacionados: [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md), [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); previstos TDD-SW-002/004/005/008.
- Fuentes F0/F1/F2: [F1 §2/3/4, RN-02/03/06/07/08/09/10/18/19, RF-SOL-01 a 05](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §5/6/8/10/12](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Filas de [traceability.md](../../../traceability.md): lifecycle de InsuranceRequest; precio y cancelación; entrega requerida exitosa.

## Criterio de aprobación

`APROBADO` mediante formalización documental del 2026-10-22 basada en la aceptación explícita de PR #17 y en la conformidad final de la revisión cruzada Cloud, registrada como `APPROVED` el 2026-10-17. No se atribuye al owner una nueva intervención. La aprobación no cierra las decisiones abiertas ni acepta anticipadamente TDD-SW-002/005 o los ADR/TDD Cloud derivados. Si una decisión posterior cambia la máquina de estados, se actualiza este TDD o se crea uno que lo reemplace. La [enmienda 2026-10-29](#enmienda-2026-10-29-número-de-solicitud) agrega la asignación del número de solicitud en `Submit`. No forma parte de la aprobación del 2026-10-22: el responsable de Software la ratificó de forma expresa el 2026-10-30, sin cambio de estado ni de la máquina de estados.
