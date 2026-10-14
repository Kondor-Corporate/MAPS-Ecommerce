# TDD — InsuranceRequest, snapshots y máquina de estados

| Dato | Valor |
| --- | --- |
| ID | `TDD-SW-003` |
| Título | InsuranceRequest, snapshots y máquina de estados |
| Estado | `BORRADOR` |
| Fecha | 2026-10-01 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera (revisión cruzada cloud); pendiente de validación final |
| Work item | [MAPS-113](https://santitalavera.atlassian.net/browse/MAPS-113) · subtarea [MAPS-140](https://santitalavera.atlassian.net/browse/MAPS-140) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-113 |
| Fase origen | [F1 §2/3/4, RN-02/03/06/07/08/09/10/18/19, RF-SOL-01 a 05](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §5/6/8/10/12](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md); [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md); [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md); [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); TDD-SW-002 y TDD-SW-005 (previstos, sin redactar) |
| Depende de | ADR-SW-001/002/003/004/005 (`PROPUESTO`) y TDD-SW-001 (`BORRADOR`): este TDD queda condicionado a su aceptación |
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
| Baja de Productor: ASIGNADAS y DERIVADAS requieren tratamiento por Admin antes de completar la baja | RN-19 — decisión de alcance Kondor MVP | Reasignación de ASIGNADA cubierta; la DERIVADA conserva su estado y se reasigna mediante una nueva asignación auditable, efectiva tras entrega exitosa |
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

### Comandos

| Comando | Actor | Estado origen → destino | Guardas | Efectos en la misma transacción |
| --- | --- | --- | --- | --- |
| `CreateDraft` | Cliente | — → BORRADOR | Product disponible; FormVersion utilizable (Forms) | Fija `formVersionId` y `draftPriceRef`; auditoría |
| `SaveDraft` | Cliente propietario | BORRADOR → BORRADOR | BORRADOR utilizable y no descartado; respuestas corresponden a campos de su FormVersion | Persiste respuestas parciales; no valida completitud |
| `DiscardDraft` | Cliente propietario | BORRADOR (sin cambio de estado) | No descartado | `discardedAt`, `discardedBy`; auditoría; sin motivo |
| `ConfirmPrice` | Cliente propietario | BORRADOR → BORRADOR | Precio enviado por el cliente == precio vigente (Catalog) | `confirmedPrice` + identificador de precio vigente + fecha |
| `Submit` | Cliente propietario | BORRADOR → ENVIADA | Utilizable; completitud (Forms); consentimientos; `confirmedPrice` coincide con el precio vigente actual | Snapshots de precio y Product; `submittedAt`; auditoría |
| `Assign` | Admin, coordinado por Assignment | ENVIADA → ASIGNADA | Productor con cuenta activa (Identity) | Assignment crea el vínculo y solicita a Requests el cambio de estado dentro de la misma UoW; intención de entrega y auditoría |
| `Reassign` | Admin, coordinado por Assignment | ASIGNADA → ASIGNADA | Productor distinto con cuenta activa | Assignment cierra el vínculo anterior, solicita a Requests el cambio y crea el nuevo vínculo/intención de entrega dentro de la misma UoW; auditoría |
| `MarkDerived` | Sistema | ASIGNADA → DERIVADA | Sigue ASIGNADA; resultado pertenece al Assignment vigente; entrega acreditada como exitosa (TDD-SW-005) | Auditoría; acceso del Productor queda derivado ([ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md)) |
| `CancelByCustomer` | Cliente propietario; coordinado por Assignment si existe Assignment vigente | ENVIADA/ASIGNADA → CANCELADA | Motivo no vacío; confirmación explícita | Actor, fecha y motivo; el coordinador persiste la cancelación en Requests y, sólo si corresponde, cierra el Assignment de su propiedad en la misma UoW; un único evento/intención lógica de aviso (outbox); auditoría |
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

### Resultado de entrega (integración con ADR-SW-004)

Assignment es el módulo iniciador de `Assign` y `Reassign`; Requests sólo expone `InsuranceRequestAssignmentPort` para validar y aplicar el cambio de estado de `InsuranceRequest`. Las cancelaciones que deben afectar ambos owners se coordinan también desde la aplicación de Assignment: el coordinador invoca un puerto de Requests para cancelar la solicitud y el repositorio de Assignment para cerrarlo, en una única UoW. Requests nunca crea, cierra ni comanda un Assignment directamente, por lo que no depende de Assignment ni se crea un ciclo entre módulos. Assignment recibe el resultado del procesador de outbox y, en su transacción, invoca `MarkDerived` sólo ante un resultado exitoso. `MarkDerived` es idempotente y tolera resultados obsoletos: si la solicitud ya no está ASIGNADA (cancelada, ya derivada) o el Assignment del resultado no es el vigente (reasignada), no hace nada y registra el descarte en auditoría técnica. Un resultado fallido no invoca ningún comando de Requests.

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
| `discardedAt`, `discardedBy` | `DiscardDraft` | No |
| `cancelledAt`, `cancelledBy`, `cancellationReason` | Transición a CANCELADA | No |
| `version` | Cada escritura | Incremental |

El precio se compara por la referencia de precio vigente que provee Catalog. Comparar sólo el monto no detectaría un cambio que vuelve a un valor anterior. Cómo versiona Catalog el precio se define en TDD-SW-002.

### Concurrencia

Control optimista con `version`: cada comando lee la solicitud, valida y escribe condicionado a la versión leída. Si otra operación escribió antes (p. ej. el Cliente cancela una ENVIADA mientras el Admin la asigna), la segunda falla con `CONFLICTO_CONCURRENCIA` y se reintenta con el estado nuevo, donde la guarda decidirá. No se usan bloqueos pesimistas de larga duración.

### Idempotencia de comandos del usuario

`Submit`, `CancelByCustomer` y `DecideCancellation` aceptan una clave de idempotencia de request: un doble clic o reintento de red devuelve el resultado ya registrado sin duplicar efectos ni avisos.

### Migraciones

Sin migración de datos desde el PostgreSQL histórico de MAPS. El enum de estados se crea con los cinco valores. Agregar uno exige antes un cambio funcional aprobado en F1/F2.

## Seguridad y privacidad

- Cada comando evalúa la política de [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) antes de cualquier lectura de negocio; un Cliente que no es propietario recibe "no encontrado" en lugar de "prohibido", así no se revela que la solicitud existe.
- El estado de cuenta del Cliente no altera el lifecycle de las solicitudes ENVIADA, ASIGNADA y DERIVADA definido por RN-18; RN-18 no fija efectos adicionales para BORRADOR.
- Auditoría con actor, acción, solicitud y fecha; sin respuestas, documentos ni PII innecesaria.

## Operación y observabilidad

- Métrica técnica de comandos rechazados por código de error y de `CONFLICTO_CONCURRENCIA` (señal de contención).
- Resultados de entrega descartados por obsoletos quedan registrados para diagnóstico.
- Integración con telemetría: TDD-SW-007 y TDD-CLD-007.

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
- Cliente dado de baja: sus solicitudes ENVIADA, ASIGNADA y DERIVADA continúan su ciclo según RN-18; sus comandos son rechazados por el estado de cuenta local. Este TDD no infiere comportamiento adicional para BORRADOR.

Las pruebas con proveedor de email simulado verifican semántica; la entrega real se valida en TDD-CLD-005.

## Implementación y handoff a F4

Secuencia sugerida: dominio y `RequestStateMachine` con pruebas → `CreateDraft`/`SaveDraft`/`DiscardDraft` → `ConfirmPrice`/`Submit` (requiere Catalog y Forms) → `Assign`/`Reassign`/`MarkDerived` (requiere TDD-SW-005) → cancelaciones → reasignación por baja de Productor (tras cerrar la decisión abierta). No se definen Epic/Issues F4 en este documento.

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| Reasignación de una DERIVADA por baja del Productor | Kondor + MAPS | Reasignación de ASIGNADA; revocación de acceso del Productor dado de baja | Elegir entre (A) mantener DERIVADA, cerrar Assignment, crear uno nuevo y habilitar al nuevo Productor tras entrega exitosa, con incidencia visible mientras tanto; o (B) nueva transición `DERIVADA → ASIGNADA`, que es un cambio funcional a registrar en F1/F2. Se propone (A) por no agregar transiciones; requiere validación |
| Solicitudes pendientes de reasignación tras baja de Productor | Kondor (F2) | Listado de afectadas al dar de baja | Definir cómo el Admin ve y trabaja esa bandeja |
| Estado técnico que acredita entrega exitosa | Software + Cloud | Guarda de `MarkDerived` como contrato | TDD-SW-005 |
| Completitud por tipo de campo | `PENDIENTE FUNCIONAL MAPS` | Puerto `FormsQueryPort` y códigos de error | TDD-SW-002 tras validar 1–2 formularios reales |
| Retención de BORRADORES descartados/no utilizables | `PENDIENTE FUNCIONAL MAPS` | Marcas sin borrado físico | Plazos y eliminación aprobados |

## Referencias y trazabilidad

- ADR y TDD relacionados: [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md), [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); previstos TDD-SW-002/004/005/008.
- Fuentes F0/F1/F2: [F1 §2/3/4, RN-02/03/06/07/08/09/10/18/19, RF-SOL-01 a 05](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §5/6/8/10/12](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Filas de [traceability.md](../../../traceability.md): lifecycle de InsuranceRequest; precio y cancelación; entrega requerida exitosa.

## Criterio de aprobación

Puede pasar a `EN REVISIÓN` cuando se verifique su alineación con RN-18/RN-19 y Santiago complete la revisión cruzada, y a `APROBADO` cuando los ADR de los que depende estén `ACEPTADO`.
