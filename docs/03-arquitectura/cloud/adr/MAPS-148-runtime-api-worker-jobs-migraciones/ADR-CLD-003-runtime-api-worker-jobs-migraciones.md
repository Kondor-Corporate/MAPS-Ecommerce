# ADR — Runtime de API, worker, jobs y migraciones

| Dato | Valor |
| --- | --- |
| ID | `ADR-CLD-003` |
| Título | Runtime de API, worker, jobs y migraciones |
| Estado | `PROPUESTO` |
| Fecha | 2026-10-28 |
| Autor | Santiago Talavera |
| Revisores | Joaquin Rodriguez — revisión cruzada Software/Dominio pendiente |
| Work item | [MAPS-148](https://santitalavera.atlassian.net/browse/MAPS-148) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-148 |
| Fase origen | [F0 §0.4/0.5/0.8](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §3/5, RN-06/07/10, RF-DELIVERY-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §5/12](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-CLD-000](../MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md) (`ACEPTADO`, GCP para el MVP); [ADR-SW-001](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-003](../../../software/adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md); [ADR-SW-004](../../../software/adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md); [ADR-SW-005](../../../software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md); [TDD-CLD-003](../../tdd/MAPS-155-cloud-sql-conexiones-backups-migraciones/TDD-CLD-003-cloud-sql-conexiones-backups-migraciones.md) |
| Depende de | Aceptación de este ADR; latencia máxima de inicio de derivación pendiente de [MAPS-167](https://santitalavera.atlassian.net/browse/MAPS-167); diseño de materialización en TDD-CLD-003 y paquetes C2–C8 |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `PROPUESTO`, `ACEPTADO`, `RECHAZADO`, `REEMPLAZADO`. Este documento permanece `PROPUESTO`; no registra aceptación ni revisión favorable.

## Contexto y problema

[ADR-CLD-000](../MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md) adoptó GCP como plataforma del MVP, sin aceptar servicios concretos. [ADR-SW-001](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md) acepta una aplicación lógica modular y deja a Cloud la cantidad de workloads y entrypoints. [ADR-SW-002](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md) permite que HTTP, jobs y consumers sean adaptadores de entrada.

Falta proponer un modelo operativo para la API, el procesador de Outbox, los trabajos de una sola ejecución y las migraciones. Debe mantener los contratos de [ADR-SW-003](../../../software/adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md) y [ADR-SW-004](../../../software/adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md): PostgreSQL nuevo y único para el Portal; transacciones locales; Outbox durable; entrega *at-least-once*; claims/leases recuperables; fencing; handlers idempotentes; estados técnicos separados de estados funcionales.

La pregunta de decisión es: **¿qué modelo de runtime utiliza MAPS para API, procesamiento Outbox, jobs y migraciones, manteniendo baja complejidad operativa, costo proporcional y compatibilidad con los contratos Software aceptados?**

Este ADR decide patrones y candidatos de runtime. No fija topología de red, despliegue por ambiente, IAM, secretos, balanceo público, proveedor de email, telemetría completa, IaC ni pipeline; esos límites corresponden a C2–C8. El diseño de base, conexiones, backup y recuperación se desarrolla en [TDD-CLD-003](../../tdd/MAPS-155-cloud-sql-conexiones-backups-migraciones/TDD-CLD-003-cloud-sql-conexiones-backups-migraciones.md).

## Drivers y criterios

| Driver o criterio | Importancia | Evidencia / fuente |
| --- | --- | --- |
| Equipo pequeño y MVP con tráfico todavía no cuantificado | Alta | [F0](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md); input de escala pendiente de MAPS |
| Managed-first y operación proporcional | Alta | Estrategia Cloud; evitar operar nodos/OS sin driver |
| Contener costos ociosos y escalar con guardrails | Alta | USD 200/mes es guardrail global de viabilidad GCP en ADR-CLD-000/EVIDENCE-CLD-000, no sizing de este ADR |
| API stateless y capacidad de despliegue/rollback independiente | Alta | [ADR-SW-001](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md) y [ADR-SW-002](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md) |
| Outbox de PostgreSQL como fuente durable | Alta | [ADR-SW-003](../../../software/adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [ADR-SW-004](../../../software/adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md) |
| Reintentos y ejecución duplicada no alteran resultados funcionales | Alta | ADR-SW-004: *at-least-once*, idempotencia, lease y recuperación |
| Trabajos acotados y migraciones explícitas | Alta | ADR-SW-003: esquema versionado expand/contract; rollback de app no revierte datos |
| Reversibilidad y ausencia de infraestructura permanente sin driver | Media | Volumen, latencia de derivación y crecimiento aún no definidos por MAPS |
| Separación de despliegue sin fragmentar el dominio | Alta | ADR-SW-001: monolito modular con ownership lógico por módulo |

## Alternativas consideradas

### API

| Alternativa | Operación, escala y costo ocioso | Contenedores, red, observabilidad y entrega | Resultado |
| --- | --- | --- | --- |
| Cloud Run Service | Servicio gestionado con autoscaling por demanda y posibilidad de scale-to-zero; request-based billing disponible. Instancias mínimas y tráfico sostenido pueden cambiar el costo | Ejecuta contenedores; integración con VPC; revisiones, logs/métricas y despliegue por revisión. Requiere dimensionar concurrencia y límite de instancias junto con PostgreSQL | **Propuesta**: runtime de API |
| GKE / GKE Autopilot | Google administra más infraestructura en Autopilot, pero siguen existiendo clústeres, recursos Kubernetes, configuración y modelo de operación; costo depende de recursos/capacidad reservada | Contenedores y red flexibles; observabilidad y rollout configurables; aporta control que hoy no tiene driver | Descartada para el arranque; reabrir si aparecen necesidades de plataforma/orquestación |
| Compute Engine | VMs, sistema operativo, parcheo, capacidad y escalado quedan como carga operativa del equipo; capacidad permanente puede generar costo ocioso | Contenedores posibles, pero deploy/rollback, health y observabilidad se ensamblan y operan | Descartada por carga operativa sin necesidad demostrada |
| App Engine | Plataforma gestionada con escalado; modalidad Standard tiene runtimes/sandbox específicos y Flexible admite custom runtime en contenedor | Tiene convenciones y ciclo de despliegue propios; menos directo que mantener un contenedor portable en Cloud Run para los workloads de este paquete | Descartada: no compensa introducir otra plataforma de aplicación |

### Procesador Outbox

| Alternativa | Latencia, escala y costo ocioso | Claims, retries, recuperación y complejidad | Resultado |
| --- | --- | --- | --- |
| Cloud Run Job + Cloud Scheduler | Inicio periódico; latencia de inicio depende del intervalo configurado y del tiempo de arranque. Sin procesador permanente entre ejecuciones | El job consulta y reclama en PostgreSQL. Debe tolerar ejecuciones solapadas, reintentos y restart mediante leases/fencing e idempotencia | **Propuesta para MVP**, condicionada a latencia aceptable para MAPS |
| Cloud Run Worker Pool / consumidor continuo | Proceso de fondo no HTTP; necesita al menos una instancia activa y genera costo mientras corre. No escala automáticamente por sí solo; Cloud Run External Metrics Autoscaling (CREMA) permite escalar con métricas externas | Adecuado para pull-consumers; agrega un proceso continuo y, si se automatiza el escalado, métricas/CREMA. Mantiene la coordinación durable en PostgreSQL | Pendiente si polling no cumple el requisito funcional o demuestra ineficiencia |
| Relay Outbox → Pub/Sub → consumer Cloud Run | Puede reducir latencia de despacho y facilitar fan-out; la señal durable nace en Outbox y debe publicarse después del commit | Requiere relay, publicación duplicable/reintentable, broker, suscripción y consumer idempotente; Pub/Sub no reemplaza Outbox ni sus claims del lado de negocio | No adoptar sin evidencia de latencia, fan-out o volumen que lo justifique |
| Cloud Run Service always-on / instance-based para background | Puede asignar CPU durante el ciclo de vida y mantener instancias; costo ocioso y configuración de min instances | Background comparte ciclo de vida de servicio; scaling y concurrencia deben coordinarse con la base. No elimina claims/leases | Descartada como baseline frente a Job periódico; reconsiderar ante requisito continuo |

### Jobs y migraciones

Cloud Run Jobs ofrece ejecución de contenedores hasta completar, con parámetros de tareas, concurrencia, timeout y retry. Cloud Scheduler puede reintentar una invocación fallida; esos reintentos de disparo son distintos de los reintentos de tareas de Cloud Run Jobs y pueden producir más de una ejecución. Claims en PostgreSQL, idempotencia y control de solapamiento siguen siendo obligatorios. Un mismo modelo permite tareas puntuales y una ejecución explícita de migraciones sin agregar un worker permanente. La operación concreta de base se define en TDD-CLD-003; configuración de promoción e IaC pertenece a C8.

## Decisión

La decisión sigue **PROPUESTA**, pendiente de aceptación organizacional y revisión cruzada Software/Dominio.

1. **API:** proponer Cloud Run Service para ejecutar el contenedor stateless del monolito modular. El diseño posterior debe configurar un máximo al nivel del servicio como guardrail primario para costo y capacidad de DB. El límite puede excederse brevemente ante picos; los límites configurados por revisión y el reparto de tráfico durante rollout también deben considerarse al presupuestar conexiones. No es un hard cap matemático. No se fijan CPU, RAM, concurrencia, `min instances`, valor de máximo ni timeout.
2. **Outbox en el MVP:** proponer Cloud Run Job invocado inicialmente por Cloud Scheduler. La propuesta queda condicionada a que MAPS acepte la latencia máxima de inicio que resulte del intervalo y de las ejecuciones, mediante MAPS-167. Un minuto no se considera aceptado funcionalmente.
3. **Jobs one-shot:** proponer Cloud Run Jobs para operaciones acotadas, repetibles/controladas y ejecutadas a demanda o por un flujo explícito.
4. **Migraciones:** proponer un Cloud Run Job de migración separado, con identidad operativa propia y permisos mínimos. La ejecución es explícita, serializada/controlada, auditable y su resultado verificable. No se ejecutan migraciones al iniciar la API ni se aplican cambios destructivos automáticamente.
5. **No adoptar ahora:** GKE, VMs, broker externo ni worker permanente. No se descartan como opciones futuras si evidencia de carga, SLA, fan-out, costo o capacidad operativa cambia los drivers.

La secuencia de esquema conserva **expand → desplegar aplicación compatible → contract posterior**, con orden concreto según compatibilidad. Rollback del runtime no implica rollback de datos.

**Separación física API / processor / migration job no crea microservicios conceptuales.** Son entrypoints/workloads que pueden reutilizar el mismo código modular, imagen base o composition roots donde corresponda; el ownership del dominio y los datos sigue siendo el aprobado por Software.

## Consecuencias y trade-offs

### Positivas

- Pocas primitivas administradas y sin plataforma de nodos para el arranque.
- La API puede escalar por request y reducir instancias ociosas, con límites que se ajustarán a partir del presupuesto de conexiones de TDD-CLD-003.
- El procesamiento periódico usa la tabla Outbox durable existente; no agrega un broker como requisito de persistencia.
- Jobs y migraciones terminan y reportan resultado en lugar de depender de un proceso de aplicación siempre activo.
- Runtime del processor y API pueden evolucionar sin cambiar la semántica de Outbox ni dividir el modelo Software.

### Negativas y riesgos

- Polling introduce latencia y el Scheduler no satisface automáticamente un SLA de segundos.
- Puede haber arranques fríos y demora de escalado en la API.
- La autoscaling de API puede multiplicar conexiones, sobre todo durante picos o coexistencia temporal de revisiones; un `max instances` no elimina por sí solo la necesidad de pools acotados y margen.
- Jobs pueden reiniciarse, reintentarse o solaparse; leases, fencing e idempotencia son obligatorios.
- DB continúa siendo cuello de botella compartido de API y processor.
- La decisión utiliza servicios de GCP y crea dependencia consciente de plataforma; no implica superioridad respecto de AWS/Azure ni aceptación de SKUs/configuraciones.
- Varios workloads desplegables pertenecen a la misma aplicación lógica modular.

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Latencia máxima entre asignación y comienzo de derivación | MAPS ([MAPS-167](https://santitalavera.atlassian.net/browse/MAPS-167)); Cloud materializa | MAPS expresa la necesidad de negocio. Si Job + Scheduler no cabe en el límite, comparar Worker Pool o flujo event-driven; no pedir a MAPS escoger tecnología |
| Tráfico y concurrencia no medidos | Software + Cloud | Definir baseline mediante pruebas de carga antes de fijar CPU/RAM, concurrencia, instancias o pools |
| Runtime puede exceder presupuesto global de USD 200/mes | Cloud + owner | Reconciliar sizing/arquitectura/costo de plataforma completa; el guardrail no es un presupuesto unitario de este runtime |
| Migración concurrente o incompatible | Software + Cloud | TDD-CLD-003 define serialización/resultado; C8 define promoción que consume el contrato |
| Escalado de aplicación presiona la capacidad de PostgreSQL | Cloud | TDD-CLD-003 enlaza máximo de instancias, pools, jobs y reserva administrativa |
| Operación de identidades, redes y ambientes | C2/C3/C4 | ADR/TDD de esos paquetes; no se resuelve aquí |

## Criterios de revisión futura

Revisar el patrón Outbox cuando MAPS defina un SLA de inicio incompatible con el intervalo viable de polling, cuando el volumen/fan-out haga ineficiente reclamar desde PostgreSQL, cuando los spikes muestren presión sostenida de DB o costo desproporcionado, o cuando un requisito real necesite capacidades de orquestación ausentes. La revisión debe preservar contratos Software y puede proponer reemplazo formal si el ADR ya fue aceptado.

## Referencias y trazabilidad

- Fuentes F0/F1/F2: [F0 §0.4/0.5/0.8](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md); [F1 §3/5, RN-06/07/10, RF-DELIVERY-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §5/12](../../../../02-diseno/Fase_2__Design_Handoff.md).
- ADR/TDD relacionados: ADR-CLD-000, ADR-SW-001/002/003/004/005; [TDD-SW-001](../../../software/tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-003](../../../software/tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md), [TDD-CLD-003](../../tdd/MAPS-155-cloud-sql-conexiones-backups-migraciones/TDD-CLD-003-cloud-sql-conexiones-backups-migraciones.md).
- Fila de trazabilidad: [traceability.md](../../../traceability.md), ejecución de Outbox, derivación y estado de solicitud.
- Documentación oficial consultada (2026-10-28): [Cloud Run resource comparison](https://docs.cloud.google.com/run/docs/resource-model), [Cloud Run billing settings](https://docs.cloud.google.com/run/docs/configuring/billing-settings), [Cloud Run autoscaling](https://docs.cloud.google.com/run/docs/about-instance-autoscaling), [Cloud Run maximum instances and rollout behavior](https://docs.cloud.google.com/run/docs/configuring/max-instances-limits), [Cloud Run Jobs](https://docs.cloud.google.com/run/docs/create-jobs), [Jobs on a schedule](https://docs.cloud.google.com/run/docs/execute/jobs-on-schedule), [Cloud Scheduler retry behavior](https://docs.cloud.google.com/scheduler/docs/configuring/retry-jobs), [Worker Pools y escalado CREMA](https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run), [GKE Autopilot](https://docs.cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview), [App Engine Flexible custom runtimes](https://docs.cloud.google.com/appengine/docs/flexible/custom-runtimes/about-custom-runtimes).
