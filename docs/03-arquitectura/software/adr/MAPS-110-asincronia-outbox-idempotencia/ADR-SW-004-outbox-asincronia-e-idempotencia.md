# ADR — Outbox, asincronía e idempotencia

| Dato | Valor |
| --- | --- |
| ID | `ADR-SW-004` |
| Título | Outbox transaccional, asincronía e idempotencia de efectos externos |
| Estado | `PROPUESTO` |
| Fecha | 2026-10-01 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera (revisión cruzada cloud); pendiente de validación final |
| Work item | [MAPS-110](https://santitalavera.atlassian.net/browse/MAPS-110) · subtarea [MAPS-135](https://santitalavera.atlassian.net/browse/MAPS-135) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-110 |
| Fase origen | [F0 §0.4/0.5](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §3/5, RN-06/07/10, RF-DELIVERY-01, RNF-COM-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §5/12](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-001](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-003](../MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md); [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); [TDD-SW-003](../../tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); TDD-SW-005, ADR-CLD-003 y TDD-CLD-005 (previstos, sin redactar) |
| Depende de | [ADR-SW-003](../MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md) (`PROPUESTO`) |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `PROPUESTO`, `ACEPTADO`, `RECHAZADO`, `REEMPLAZADO`.

## Contexto y problema

[ADR-SW-003](../MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md) fija que los efectos externos (email, storage) no se ejecutan dentro de la transacción de negocio: se registra su intención en la misma transacción y se procesan después. Falta decidir la semántica de ese mecanismo: cómo se registra la intención, qué garantías de entrega tiene, cómo se evitan duplicados y cómo vuelve el resultado al dominio.

El caso principal es la derivación ([F1 §5](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md)): al asignar, la solicitud pasa a ASIGNADA y el sistema intenta notificar al Productor. Sólo una entrega requerida exitosa habilita `ASIGNADA → DERIVADA` (RN-07); si falla, la solicitud **permanece ASIGNADA** y el Admin ve la incidencia y puede reintentar o reasignar (RN-06). Otros efectos con la misma necesidad: avisos de cancelación (RN-10), avisos de retiro urgente de FormVersion y avisos de baja de cuenta ([ADR-SW-005](../MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md)).

Sin un mecanismo explícito pueden pasar dos cosas. La primera es un cambio sin efecto: se confirma ASIGNADA, el proceso cae antes de encolar el email y nadie lo reintenta. La segunda es un efecto sin cambio: se envía el email, la transacción hace rollback y el Productor recibe el aviso de una asignación que no existe.

Límite software/cloud: este ADR define qué se registra, con qué garantías, cómo se evitan duplicados, cómo se reintenta y cómo vuelve el resultado al dominio. Quién ejecuta el procesamiento (worker, scheduler o cola gestionada), con qué proveedor de email, credenciales y escalado lo deciden ADR-CLD-003 y TDD-CLD-005 (previstos). El detalle de Assignment y DeliveryAttempt corresponde a TDD-SW-005 (previsto).

## Drivers y criterios

| Driver o criterio | Importancia | Evidencia / fuente |
| --- | --- | --- |
| Atomicidad entre cambio de negocio e intención de efecto | Alta | Ni cambio sin efecto ni efecto sin cambio ([ADR-SW-003](../MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md)) |
| DERIVADA sólo tras entrega exitosa; falla conserva ASIGNADA | Alta | RN-06/07, RF-DELIVERY-01 |
| Trazabilidad de intentos, resultados y reintentos | Alta | [F1 §5](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md): destinatario, fecha/hora, resultado, fallas y reintentos |
| Evitar notificaciones redundantes | Alta | RNF-COM-01; ASIGNADA cancelada notifica una sola vez ([F1 §3](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md)) |
| Separar semántica de negocio y mecanismo cloud | Alta | Criterio de aceptación de MAPS-110; CONTRIBUTING §7 |
| Infraestructura proporcional al MVP | Media | Equipo chico; base PostgreSQL única propuesta |
| Independencia del proveedor de email | Media | Proveedor no decidido ([F2 §14](../../../../02-diseno/Fase_2__Design_Handoff.md)) |

## Alternativas consideradas

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| Envío síncrono dentro del caso de uso | Simple; resultado inmediato | Efecto sin cambio ante rollback; latencia y fallas del proveedor bloquean la operación del Admin; sin reintento confiable | Descartada |
| Envío después del commit, en memoria (fire-and-forget) | Simple; no bloquea | Cambio sin efecto si el proceso cae entre commit y envío; sin reintento ni trazabilidad | Descartada |
| Publicar directamente a una cola/broker externo desde el caso de uso | Desacople y escalado | Escritura dual base + broker sin atomicidad; agrega infraestructura antes de necesitarla | Descartada para el MVP |
| Outbox transaccional en la base del Portal + procesador asíncrono | Atomicidad con la transacción local; reintentos y trazabilidad en la misma base; mecanismo de ejecución intercambiable | Entrega *at-least-once*: exige idempotencia; tabla adicional a operar y depurar; latencia de procesamiento | Propuesta elegida |
| Event sourcing | Historia completa por diseño | Complejidad desproporcionada; cambia todo el modelo de persistencia | Descartada |

## Decisión

Se **propone** adoptar el patrón outbox transaccional con entrega *at-least-once* y consumidores idempotentes.

### 1. Registro de la intención

- Todo caso de uso que produce un efecto externo inserta un `OutboxEvent` en la misma unidad de trabajo que el cambio de negocio ([ADR-SW-003](../MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), punto 4). Si la transacción hace rollback, el evento no existe; si confirma, el evento queda garantizado.
- El caso de uso escribe a través del puerto de salida `OutboxPort` y el dominio no conoce la tabla ([ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md)). El componente técnico Outbox es owner exclusivo de su tabla y repositorio; los módulos sólo pueden solicitar la escritura mediante ese puerto estrecho dentro de la misma unidad de trabajo. No existe un repositorio compartido escribible directamente por todos los módulos ([ADR-SW-001](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md)).
- Ningún caso de uso invoca al proveedor de email o storage directamente.

### 2. Contrato lógico de `OutboxEvent`

| Campo | Propósito |
| --- | --- |
| `id` | Identificador único del evento |
| `type` | Tipo de efecto, versionado (`delivery.derivation_requested.v1`) |
| `aggregateType`, `aggregateId` | Entidad que originó el evento (p. ej. `Assignment`, id) |
| `idempotencyKey` | Clave de negocio única para deduplicar el efecto (ver punto 4) |
| `payload` | Identificadores y datos mínimos, sin respuestas, documentos ni PII innecesaria |
| `status` | `PENDIENTE`, `EN_PROCESO`, `PROCESADO`, `AGOTADO`, `DESCARTADO` |
| `attempts`, `nextAttemptAt`, `lastError` | Control de reintentos y diagnóstico |
| `lockedAt`, `leaseUntil`, `claimedBy` | Reclamo exclusivo y recuperación de eventos abandonados |
| `createdAt`, `processedAt` | Trazabilidad temporal |

Los estados del `OutboxEvent` son técnicos e internos. No se reflejan en el estado de `InsuranceRequest` y el usuario no los ve. El nombre físico de la tabla y el esquema exacto los fija el TDD correspondiente.

### 3. Procesamiento y garantías

- Un procesador toma eventos `PENDIENTE` con `nextAttemptAt` vencido o eventos `EN_PROCESO` cuyo `leaseUntil` expiró, los reclama de forma exclusiva y ejecuta el handler del `type`.
- El reclamo registra `lockedAt`, `leaseUntil` y `claimedBy`. Si el procesador cae o no renueva el lease, otro procesamiento puede recuperar el evento vencido y volverlo a procesar; un claim abandonado nunca queda atascado indefinidamente.
- La garantía es *at-least-once*. Si el proceso cae después de enviar y antes de marcar `PROCESADO`, el evento se vuelve a procesar, por eso todo handler tiene que ser idempotente.
- No hay orden global entre eventos. Lo que sí se asegura es que un evento de un `Assignment` que ya no está vigente se descarta (punto 6).
- El procesador no decide transiciones de negocio: reporta el resultado al módulo owner, que aplica la transición en su propia transacción.

### 4. Idempotencia

| Nivel | Regla |
| --- | --- |
| Registro | `idempotencyKey` único por efecto de negocio. Ejemplos: `derivacion:<assignmentId>:<deliveryAttemptId>`, `aviso-cancelacion:<requestId>:<destinatario>`. Reintentar un caso de uso no duplica el evento |
| Envío | Se pasa una clave de idempotencia al proveedor cuando lo soporte. Si no la soporta, consultar `DeliveryAttempt` reduce duplicaciones, pero no elimina la duplicación residual si el proveedor aceptó el email y el proceso cayó antes de registrar el éxito |
| Resultado | Aplicar dos veces el mismo resultado no cambia nada: `ASIGNADA → DERIVADA` sólo ocurre si la solicitud sigue ASIGNADA y el `Assignment` sigue vigente |
| Callbacks del proveedor | Si el proveedor informa entregas/rebotes por webhook, se deduplican por el identificador de mensaje del proveedor |

### 5. Reintentos automáticos y manuales

- Ante fallas transitorias (timeout, error 5xx, límite de tasa) el procesador reintenta con espera creciente hasta un máximo de intentos. Los valores concretos los define TDD-CLD-005 porque son operativos.
- Una falla permanente (destinatario inválido, rechazo definitivo) o el agotamiento de los reintentos marcan el evento `AGOTADO` y el `DeliveryAttempt` como fallido o rebotado. El Admin ve la incidencia y la solicitud sigue ASIGNADA (RN-06).
- El reintento manual del Admin crea otro `DeliveryAttempt` y otro `OutboxEvent` con su propia `idempotencyKey`, sin reactivar el evento agotado. Así cada intento queda trazado por separado ([F1 §5](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md)).

### 6. Consistencia entre transición de estado y eventos

| Operación | En la transacción de negocio | Después (asíncrono) |
| --- | --- | --- |
| Asignar / reasignar | Assignment vigente, `ASIGNADA`, `DeliveryAttempt` pendiente, `OutboxEvent` de derivación, auditoría | Envío al Productor |
| Resultado exitoso | `DeliveryAttempt` exitoso, `ASIGNADA → DERIVADA`, acceso habilitado, auditoría (transacción del módulo Assignment/Requests) | — |
| Resultado fallido | `DeliveryAttempt` fallido; la solicitud sigue ASIGNADA | Reintento automático o incidencia |
| Reasignación con evento en curso | Assignment anterior cerrado | El handler verifica vigencia: evento de un Assignment no vigente → `DESCARTADO`, sin envío ni transición |
| Cancelación de ASIGNADA | `CANCELADA`, `OutboxEvent` de aviso único a Admin y Productor | Aviso; un resultado de derivación posterior se ignora |

El resultado de un efecto externo no dispara una transición por sí mismo. Al recibirlo, el módulo owner revalida estado y vigencia dentro de su transacción y descarta los resultados obsoletos.

### 7. Catálogo inicial de eventos del MVP

| Tipo | Origen | Destinatario | Afecta estado funcional |
| --- | --- | --- | --- |
| Derivación al Productor | Asignar/reasignar | Productor asignado | Sí: su éxito habilita `ASIGNADA → DERIVADA` |
| Aviso de cancelación ENVIADA/ASIGNADA | Cancelación del Cliente | Admin (+ Productor si ASIGNADA) | No |
| Aviso de solicitud de cancelación DERIVADA | Cliente | Admin | No |
| Aviso de decisión de cancelación DERIVADA | Admin | Cliente; Productor si se confirma | No |
| Aviso de retiro urgente de FormVersion | Admin | Clientes con BORRADOR afectado | No; propuesta pendiente de validación funcional MAPS |
| Aviso de baja / reactivación de cuenta | Admin | Cliente o Productor afectado | No; condicionado al relevamiento y a su incorporación controlada |

Los textos, plantillas y datos exactos de cada aviso se definen en TDD-SW-005 y en el contenido funcional que MAPS apruebe. Los eventos de funnel y analytics quedan fuera de este outbox y se tratan en TDD-SW-007.

Esta decisión **no** elige proveedor de email, cola gestionada ni runtime del procesador, ni define qué estado técnico del proveedor acredita la "entrega requerida exitosa" (ver Riesgos y pendientes).

## Consecuencias y trade-offs

### Positivas

- Una transacción local evita tanto el cambio sin efecto como el efecto sin cambio.
- Reintentos, incidencias y trazabilidad de entrega quedan en la base del Portal y son consultables por el Admin.
- El proveedor de email y el runtime del procesador son reemplazables sin tocar dominio.
- Resultados obsoletos (reasignación, cancelación) no pueden producir transiciones inválidas.

### Negativas y riesgos

- Con *at-least-once*, un handler que no sea idempotente puede duplicar avisos.
- Sin una clave de idempotencia soportada por el proveedor externo puede existir duplicación residual de emails; la garantía de "aviso único" no se puede afirmar desde Software solamente.
- Latencia entre la asignación y la derivación efectiva (depende del intervalo de procesamiento).
- La tabla de outbox crece y requiere depuración de eventos procesados; su retención técnica es independiente de la retención funcional pendiente MAPS.
- Agrega un componente a operar y monitorear (eventos atascados, agotados).

## Revisión cruzada cloud

| Impacto | Documento cloud afectado | Estado de revisión |
| --- | --- | --- |
| Runtime del procesador (worker dedicado, job programado o mismo artefacto con otro entrypoint) y su escalado | ADR-CLD-003, TDD-CLD-002 (previstos) | Pendiente — Santiago Talavera |
| Proveedor de email, credenciales, webhooks de resultado, valores de reintento y espera | TDD-CLD-005, TDD-CLD-006 (previstos) | Pendiente — Santiago Talavera |
| Carga adicional sobre la base (lectura periódica del outbox, bloqueo de filas) y depuración | TDD-CLD-003 (previsto) | Pendiente — Santiago Talavera |
| Alertas sobre eventos atascados o agotados | TDD-CLD-007 (previsto) | Pendiente — Santiago Talavera |

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Estado técnico que acredita "entrega requerida exitosa" (aceptado por el proveedor vs. entregado confirmado por webhook) | Software + Cloud | Definir en TDD-SW-005 según capacidades del proveedor elegido en TDD-CLD-005; la regla RN-07 no cambia |
| Rebote informado después de DERIVADA | Software | TDD-SW-005 define cómo se registra sin revertir DERIVADA (no hay transición de salida a ASIGNADA en la baseline) |
| SLA de derivación y tratamiento operativo de incidencias | `PENDIENTE FUNCIONAL MAPS` | Reintentos técnicos e incidencia visible avanzan; plazos y acciones operativas adicionales quedan condicionados |
| Handlers no idempotentes | Software | Pruebas de doble procesamiento obligatorias por handler |
| Revisión cruzada cloud sin completar | Santiago Talavera | Completar la tabla antes de pasar a `ACEPTADO` |

## Criterios de revisión futura

Revisar si el volumen de eventos o la latencia requerida justifican un broker gestionado (el outbox seguiría siendo la fuente y se agregaría un relay), si aparecen integraciones externas adicionales (sistemas de MAPS, otros canales) o si se adopta un proveedor con garantías distintas. Si cambia un ADR aceptado, crear uno nuevo que reemplace a `ADR-SW-004`.

## Registro de decisión

| Fecha | Decisión | Participantes | Observaciones |
| --- | --- | --- | --- |
| — | Pendiente: `ACEPTADO` o `RECHAZADO` | — | Requiere validar contrato de outbox, idempotencia, reintentos, descarte de eventos obsoletos y revisión cruzada cloud |

## Referencias y trazabilidad

- Fuentes F0/F1/F2: [F1 §3/5, RN-06/07/10, RF-DELIVERY-01, RNF-COM-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §5/12](../../../../02-diseno/Fase_2__Design_Handoff.md).
- ADR/TDD relacionados: [ADR-SW-001](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-003](../MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [ADR-SW-005](../MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-003](../../tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); previstos TDD-SW-005, ADR-CLD-003, TDD-CLD-005.
- Fila de [traceability.md](../../../traceability.md): Admin asigna; fallo conserva ASIGNADA; entrega requerida exitosa precede DERIVADA.
