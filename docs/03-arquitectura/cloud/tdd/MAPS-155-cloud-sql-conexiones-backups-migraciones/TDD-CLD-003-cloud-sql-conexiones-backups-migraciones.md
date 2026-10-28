# TDD — Cloud SQL, conexiones, backups y migraciones

| Dato | Valor |
| --- | --- |
| ID | `TDD-CLD-003` |
| Título | Cloud SQL, conexiones, backups y migraciones |
| Estado | `BORRADOR` |
| Fecha | 2026-10-28 |
| Autor | Santiago Talavera |
| Revisores | Joaquin Rodriguez — revisión cruzada pendiente |
| Work item | [MAPS-155](https://santitalavera.atlassian.net/browse/MAPS-155) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-155 |
| Fase origen | [F0 §0.1/0.8](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §3/5/7, RN-06/07/10](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §5/9/10/12](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-CLD-000](../../adr/MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md) (`ACEPTADO`, GCP para el MVP); [ADR-CLD-003](../../adr/MAPS-148-runtime-api-worker-jobs-migraciones/ADR-CLD-003-runtime-api-worker-jobs-migraciones.md) (`PROPUESTO`); [ADR-SW-001](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-003](../../../software/adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md); [ADR-SW-004](../../../software/adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md); [ADR-SW-005](../../../software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md); [TDD-SW-001](../../../software/tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); [TDD-SW-003](../../../software/tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md) |
| Depende de | ADR-CLD-003 mientras permanezca `PROPUESTO`; [MAPS-167](https://santitalavera.atlassian.net/browse/MAPS-167) para necesidad de negocio RPO/RTO, HA y latencia Outbox; decisiones de región/topología en paquetes C2–C4 |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `BORRADOR`, `EN REVISIÓN`, `APROBADO`, `REEMPLAZADO`. Este TDD es un diseño en borrador, no una aprobación de Cloud SQL ni una autorización de infraestructura.

## Propósito y límites

Diseña la materialización operativa de la base PostgreSQL nueva del Portal: servicio candidato, conectividad, presupuesto de conexiones, proceso de migraciones, backups/PITR/restore, HA condicional, recuperación, seguridad mínima, señales operativas y plan de validación.

La aplicación ya decidió en [ADR-SW-003](../../../software/adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md) una base relacional PostgreSQL nueva, inicialmente única, con ACID/FK, ownership lógico por módulo, UoW y migraciones versionadas expand/contract. Este TDD no cambia esos contratos.

La elección de runtime se mantiene en [ADR-CLD-003](../../adr/MAPS-148-runtime-api-worker-jobs-migraciones/ADR-CLD-003-runtime-api-worker-jobs-migraciones.md), todavía `PROPUESTO`. Este documento puede permanecer `BORRADOR` mientras el ADR no se acepte; si el ADR cambia, se revisan los supuestos de ejecución y conectividad.

Fuera de alcance: topología final y configuración detallada de Cloud Run (C4), IAM/Secret Manager (C2), ambientes y entrada pública (C3), observabilidad completa (C5), email (C6), storage (C7), IaC/CI-CD completo (C8), región y sizing definitivos. Este TDD deja contratos que esos paquetes deberán consumir.

## Baseline y dependencias

| Regla / dependencia | Fuente y estado | Impacto en el diseño |
| --- | --- | --- |
| GCP como plataforma del MVP; servicios concretos no aceptados por ADR-CLD-000 | ADR-CLD-000 — `ACEPTADO` | Cloud SQL for PostgreSQL es una materialización propuesta, no decisión de plataforma aceptada |
| PostgreSQL nuevo y único para Portal, ACID/FK, ownership lógico por módulo | [ADR-SW-003](../../../software/adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md) — `ACEPTADO` | No separar base por módulo ni alterar el modelo relacional |
| UoW local; efectos externos fuera de la transacción | ADR-SW-003 — `ACEPTADO` | Transacciones cortas; el proceso de email/storage no se ejecuta dentro de ellas |
| Outbox durable, at-least-once, handlers idempotentes, claims/leases y fencing | [ADR-SW-004](../../../software/adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md) — `ACEPTADO` | Base es la fuente durable; jobs/workers deben soportar retry, duplicación y recuperación |
| Assignment, DeliveryAttempt, resultados tardíos y concurrencia coordinados sobre DB | [TDD-SW-003](../../../software/tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md) — `APROBADO`; [TDD-SW-002](../../../software/tdd/MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md) y [TDD-SW-005](../../../software/tdd/MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md) — `BORRADOR` en `main`, integrados por PR #20 | C1 usa los documentos integrados en `main`; su estado `BORRADOR` no equivale a aprobación |
| Migraciones versionadas expand/contract; app rollback no revierte DB | ADR-SW-003 — `ACEPTADO` | Migración ejecutada como operación separada; compatibilidad entre versiones desplegadas |
| PostgreSQL histórico de MAPS fuera de la dependencia funcional del MVP | ADR-SW-003 — `ACEPTADO` | Cloud SQL sólo alberga la base nueva del Portal |
| Latencia máxima entre asignación y comienzo de la derivación | MAPS-167 — `PENDIENTE MAPS` | Determina si el polling propuesto por ADR-CLD-003 sirve; no se inventa un SLA |
| RPO/RTO en términos de negocio, necesidad zonal y tolerancia a indisponibilidad | MAPS-167 — `PENDIENTE MAPS` | No se asignan RPO/RTO numéricos, HA obligatoria ni retención final |
| Tráfico, concurrencia, volumen, crecimiento, tamaño de DB, patrón de consultas y carga Outbox | No medido / pendiente de evidencia | El tamaño y los pools se determinan mediante sizing y pruebas, no por intuición |

## Alternativas de base de datos

| Alternativa | Compatibilidad/operación | Backups, PITR, HA y capacidad | Costo, complejidad, reversibilidad | Resultado |
| --- | --- | --- | --- | --- |
| Cloud SQL for PostgreSQL | PostgreSQL gestionado; encaja con contrato SQL/ACID/FK. Google opera host/servicio y ofrece opciones gestionadas de mantenimiento | Backups, PITR y HA dependen de configuración/edición; requiere presupuestar conexiones, almacenamiento, mantenimiento y pruebas de restore | Menor carga de operación que autogestionar; lock-in de operación/plataforma, aunque mantiene PostgreSQL y APIs estándar | **Materialización preferida propuesta** para validar en este TDD |
| AlloyDB for PostgreSQL | Servicio administrado y compatible con PostgreSQL, orientado por Google a cargas exigentes de rendimiento/disponibilidad | Opciones propias de alta disponibilidad, backups y recuperación; las capacidades y semánticas deben evaluarse ante una necesidad demostrada | Mayor complejidad/costo potencial sin carga probada que lo justifique; requiere nueva evaluación de TCO | Reservado para evidencia futura de performance, carga o continuidad |
| PostgreSQL autogestionado en Compute Engine | Mantiene PostgreSQL, pero el equipo es responsable de sistema operativo, parcheo, HA, backup, monitoreo, upgrade y recovery | Todas las garantías de operación deben componerse y probarse por el equipo | Costos de cómputo más operación humana; mayor control y mayor carga, reversibilidad de engine razonable | Descartado para MVP managed-first sin driver operativo |
| PostgreSQL autogestionado sobre GKE | Mantiene PostgreSQL y contenedores, pero agrega Kubernetes/operator, storage persistente, upgrades y recuperación | HA/backup dependen de componentes, operator y procesos del equipo; hay más piezas de fallo | Mayor complejidad operacional y de diagnóstico; no hay requerimiento de orquestación de base | Descartado por desproporción para equipo pequeño |

NoSQL/Spanner no se consideran equivalentes para esta decisión: implicarían cambiar el modelo relacional, ACID/FK y la unidad de trabajo aceptados por ADR-SW-003. No se crea un ADR separado para Cloud SQL salvo que la verificación de alternativas revele un trade-off arquitectónico de primer orden no cubierto por ADR-CLD-000/003 y este TDD.

### Propuesta de materialización

Proponer **Cloud SQL for PostgreSQL** por: PostgreSQL y semántica relacional ya aceptados por Software; GCP ya adoptado por ADR-CLD-000; enfoque managed-first; equipo pequeño; y ausencia de evidencia que justifique AlloyDB o autogestión. Esto no acepta servicio, edición, región, tier, red, flags ni configuración.

AlloyDB queda como alternativa futura si pruebas reproducibles muestran que Cloud SQL no satisface carga, rendimiento, conexiones, disponibilidad o costo bajo requisitos aprobados. No se extrapola rendimiento desde marketing ni desde una prueba sin workload representativo.

### Frontera con el PostgreSQL histórico MAPS

La nueva base del Portal no debe migrar, sincronizar, replicar ni consultar el PostgreSQL histórico de MAPS, ni depender funcionalmente de él. El historial y eventual integración con ese sistema permanecen fuera de esta propuesta.

## Vista de componentes y responsabilidades

| Componente | Responsabilidad | Contrato / owner |
| --- | --- | --- |
| Cloud SQL PostgreSQL (candidato) | Base única administrada del Portal | PostgreSQL nuevo, ownership lógico y constraints de ADR-SW-003 |
| API Cloud Run Service (propuesta de ADR-CLD-003) | Solicitudes síncronas y UoW de la aplicación | Stateless; conexiones limitadas por instancia |
| Outbox processor (Job + Scheduler propuestos) | Reclamar eventos elegibles, procesar handlers y registrar resultado | Lease/fencing/idempotencia; sin transición funcional propia |
| Migration Job (propuesta de ADR-CLD-003) | Aplicar una migración explícita desde un artefacto inmutable | Identidad y permisos separados; ejecución auditable y serializada |
| Administración/maintenance | Operaciones autorizadas de diagnóstico y recuperación | Reserva explícita de conexiones; acceso controlado por C2/C4 |

Todos los workloads que accedan a la DB deberán quedar en una red habilitada y compartir región sólo cuando la decisión de topología lo confirme. Este documento no dibuja ni fija VPC, subnet, Shared VPC, PSA/PSC o proyectos por ambiente.

## Contratos y flujos

### Conectividad de workloads

Se propone Cloud SQL con conectividad privada y acceso desde workloads Cloud Run por **Direct VPC egress** cuando C4 lo habilite. Google recomienda IP privada salvo requisito específico de acceso externo y Direct VPC egress sobre Serverless VPC Access connector cuando sea compatible. Cloud SQL ofrece dos formas de IP privada: **Private Service Connect (PSC)** y **Private Services Access (PSA)**; PSC es la opción predeterminada para proyectos nuevos y permite endpoints desde varias VPC, mientras PSA usa peering privado. C4 debe elegir entre PSC/PSA según topología y operación. Este TDD no cierra VPC, método de endpoint ni región.

| Opción | Ventajas | Costos/limitaciones | Tratamiento propuesto |
| --- | --- | --- | --- |
| Private IP + Direct VPC egress | Comunicación por IP interna; no requiere connector dedicado; Direct VPC egress puede escalar a cero y evita su overhead ocioso | Requiere VPC y asignación de rangos; hay eventos de mantenimiento de red que pueden cortar conexiones; sizing y límites de egress quedan en C4. Una vez configurada IP privada en una instancia Cloud SQL, Google indica que no puede deshabilitarse; cambiar esa decisión puede requerir migración/recreación | Preferida para workload-to-DB, condicionada a compatibilidad de topología C4 |
| Private IP + Serverless VPC Access connector | Conecta runtimes serverless a VPC cuando Direct VPC egress no sea viable | Connector añade recurso/capacidad y costo base; Google lo plantea como alternativa cuando Direct VPC egress no es opción | Fallback documentado, sujeto a evidencia técnica |
| Public IP + authorized networks / connector o proxy | Permite clientes que no están dentro de VPC; Cloud SQL connector puede cifrar y autorizar conexiones | Aumenta exposición/configuración; una allowlist no equivale a red privada; no se debe habilitar por conveniencia operativa | No se asume en producción; sólo reconsiderar con requisito y controles explícitos |

**Administración:** los accesos humanos o automatizados se resolverán en C2/C4 con método temporal, autenticado y auditable. No se habilita IP pública para simplificar acceso administrativo. La ruta exacta para acceso de emergencia debe probarse en diseño de red. PSC y PSA tienen requisitos y límites distintos; una instancia con PSC no admite IP pública ni permite cambiar libremente su tipo de conectividad. Además, `gcloud sql connect` y Cloud Shell no conectan a instancias PSC; C4 debe elegir y probar un cliente administrativo soportado antes de crear la instancia.

**Resiliencia de conexión:** clientes deben tolerar reset, restart, maintenance, failover y cortes transitorios con timeout, retry acotado con backoff y reobtención de conexión. Un retry de DB no debe duplicar efectos externos ni extender transacciones abiertas. Los conectores/egress no reemplazan autorización del motor ni rol de aplicación.

### Connection budgeting

El escalado de Cloud Run no se diseña separado de la capacidad de PostgreSQL. La condición de sizing es:

```text
API max instances × pool máximo por instancia
+ Outbox concurrency × conexiones máximas por worker/task
+ migration-job conexiones
+ administración / mantenimiento / monitoreo
< presupuesto operativo seguro de conexiones de Cloud SQL
```

El presupuesto operativo debe reservar margen por debajo de `max_connections` para procesos internos, mantenimiento y picos transitorios. El límite efectivo depende de la instancia y configuración PostgreSQL, por lo que se verificará en el recurso creado. El máximo técnico del proveedor no es objetivo operacional. Si se utiliza la integración Cloud SQL integrada en Cloud Run, Google documenta un máximo de 100 conexiones a una misma base Cloud SQL por instancia de contenedor. Es un límite propio de ese modo, no se asume para todos los transports ni sustituye el presupuesto de conexiones de DB.

| Factor | Regla de diseño |
| --- | --- |
| Instancias de API | Configurar un máximo explícito; el valor se deriva del límite de conexiones y del costo global, no de la cuota máxima del servicio |
| Pool por instancia | Acotado, con overflow controlado o inexistente; tamaño final mediante prueba de carga y medición de espera/uso |
| Processor/jobs | Definir paralelismo/concurrency de forma que no exceda su asignación de conexiones; no confundir tasks del proveedor con workers lógicos |
| Revisiones de despliegue | Usar máximo de servicio como guardrail primario; prever excesos temporales y, si se configuran máximos por revisión, límites separados y reparto de tráfico durante rollout. El máximo no es un hard cap matemático; incluir margen y prueba de rollout |
| Ejecuciones solapadas | Claims/leases hacen correcto el dominio; paralelismo se limita para proteger DB y coordinar operaciones |
| Conexiones idle | Configurar idle/lifetime, adquirir bajo demanda y devolver siempre al pool; conexiones abiertas consumen recursos incluso sin query activa |
| Timeouts | Pool acquisition, conexión, query y transacción con límites definidos; no mantener una transacción durante llamadas externas |
| Cierre/restart | Graceful shutdown drena requests y suelta conexiones; tras restart se verifica reconexión sin duplicar resultado funcional |
| Migraciones/admin | Reservar conexiones y coordinar; evitar correr mantenimiento intensivo durante picos o promoción crítica |

Pools, `max instances`, concurrencia de processor y reserva numérica quedan abiertos hasta sizing y pruebas. El TDD prohíbe fijarlos arbitrariamente. Configurar el máximo a nivel de servicio es el guardrail primario recomendado; puede haber exceso temporal ante picos, y límites a nivel de revisión/traffic split pueden afectar el total durante rollout. El diseño de conexiones debe contemplar esas ventanas.

### Migraciones operativas

Flujo conceptual, sin especificar pipeline completo:

```text
build artifact inmutable
→ ejecutar migration job explícito sobre schema compatible (expand)
→ verificar resultado y versión aplicada
→ desplegar/promover aplicación compatible
→ contract posterior cuando las versiones consumidoras ya no dependan del esquema anterior
```

El orden exacto puede variar por cambio, pero rigen estos invariantes:

- No ejecutar migraciones en startup ni en cada réplica de API.
- Un cambio versionado, revisado y trazable tiene identificador, inicio/fin, resultado y versión de esquema.
- Sólo una ejecución puede aplicar migraciones al mismo entorno a la vez; el mecanismo de lock/control se implementará en el migrator o en la herramienta, con prueba de doble ejecución.
- Si falla la migración, se detiene la promoción y se conserva evidencia del error; no se continúa como si hubiera sido exitosa.
- Una migración expansiva mantiene compatibilidad con la versión previa; una migración contract/destructiva espera que ninguna versión soportada requiera la estructura anterior.
- Rollback de aplicación no revierte automáticamente schema ni datos. Reparación/forward-fix y recuperación se deciden explícitamente.
- Backup no sustituye migraciones compatibles; restore puede perder cambios posteriores al punto recuperado y exige validar consistencia funcional.

**Contrato para C8:** recibir artifact/version inmutable, entorno destino, identidad mínima, operación explícita, exclusión de concurrencia, logs/resultado consultables y condición de bloquear promoción si falla. C8 decide herramientas, aprobaciones y pipeline.

## Datos, consistencia y migraciones

### Límites de datos

- Una instancia lógica y base PostgreSQL nueva para el Portal al inicio; ownership de tablas por módulo o componente técnico como fija ADR-SW-003.
- Se permiten claves foráneas entre owners para integridad; una FK no habilita acceso cruzado a repositorios ni joins usados como atajo.
- La tabla Outbox pertenece al componente técnico Outbox; productores escriben por el puerto aprobado dentro de la misma UoW.
- No hay dependencia con la base histórica de MAPS ni se define réplica para lectura.

**Acceso y mantenimiento del Outbox:** las consultas de eventos pendientes, reintentables y con lease vencido requieren índices alineados al patrón real del processor (p. ej. estado y próximos tiempos de reintento/lease). No se fija ahora un DDL ni se indexa por intuición: Software y Cloud verificarán query plan y costo de escritura con volumen representativo. La depuración de `OutboxEvent` procesados es retención técnica, separada de retención funcional de solicitudes/Delivery; deberá ejecutarse en lotes acotados, con evidencia y sin borrar eventos aún reclamables o necesarios para diagnóstico. Los campos, estados e idempotencia siguen siendo los de ADR-SW-004; esta sección sólo recoge sus implicancias de operación PostgreSQL.

### Backups, PITR y restore

Son controles distintos y no equivalen entre sí:

| Capacidad | Qué ofrece en el diseño | Límite que debe conservarse |
| --- | --- | --- |
| Backup automatizado | Copia recuperable conforme a configuración del servicio | No demuestra que restore sea operable ni fija RPO/RTO de MAPS |
| PITR | Recuperación a un instante dentro de la ventana configurada, si edición/configuración lo soportan; siempre crea una instancia nueva | Requiere habilitación y retención de logs; restaurar un backup sobre una instancia existente elimina sus logs PITR previos; no define por sí sola RTO ni pérdida de negocio aceptable |
| Restore | Restaurar backup hacia una instancia existente o nueva; PITR crea una instancia nueva | Puede tomar tiempo, requiere validar datos/conectividad y puede necesitar promoción/cambio de configuración posterior |
| HA regional | Failover administrado ante ciertos fallos zonales | No sustituye backup, PITR, recuperación ante corrupción lógica ni decisión de continuidad de negocio |

Propuesta de baseline para producción, a ratificar con requisitos de MAPS:

- backups automatizados habilitados;
- PITR habilitado si la edición/configuración elegida lo permite y el costo se acepta;
- política de retención, almacenamiento de logs y protección contra borrado definidas al cerrar el requisito;
- procedimiento de restore hacia recurso separado y verificación de integridad/datos;
- prueba de restore como evidencia operacional antes de declarar recuperación comprobada.

No se fijan frecuencia final, retención exacta, RPO, RTO ni coste. Según la documentación vigente, PITR viene habilitado por defecto en Enterprise Plus; en Enterprise depende de si se crea desde la consola (predeterminado habilitado) o por CLI/Terraform/API (predeterminado deshabilitado). La retención de logs WAL es configurable: Enterprise admite 1–7 días (predeterminado 7) y Enterprise Plus 1–35 días (predeterminado 14). Son defaults del producto, no política aceptada por MAPS; C8 debe declarar la configuración efectiva. Backup diario de comparación no implica RPO de 24 horas.

### HA y disponibilidad

| Modelo | Comportamiento y riesgo | Costo/operación | Estado |
| --- | --- | --- | --- |
| Zonal / standalone | Sin failover automático ante una interrupción de zona; recovery puede requerir restore/PITR o promoción configurada | Menor costo relativo y diseño más simple; mayor dependencia del procedimiento de recuperación | Alternativa base para evaluación, no elegida |
| Regional HA | Primario y standby en zonas distintas de una región; failover administrado para ciertos fallos | Recursos redundantes y costo adicional; hay failover/reconexión y no reemplaza backup/restores | Recomendación condicional sólo si objetivos de disponibilidad/RPO/RTO y presupuesto lo justifican |

HA regional no se cierra en este TDD. MAPS-167 debe describir cuánto tiempo puede permanecer indisponible el Portal y cuánta información reciente puede tolerarse perder; Cloud lo traduce luego a opción de HA, backup, PITR y recuperación. Tampoco se selecciona recuperación regional/DR.

### Sizing

Proceso: comenzar con baseline pequeña que respete límites soportados → ejecutar carga representativa y escenarios de concurrencia → medir CPU, memoria, storage, latencia de queries, conexiones, locks y tasa de crecimiento → ajustar tier, pool y escala → repetir costo y pruebas. La baseline no se declara productivamente suficiente hasta medirla.

Inputs no disponibles todavía: requests/tráfico, simultaneidad, crecimiento, tamaño inicial y crecimiento de base, patrón/mezcla de consultas, retención, eventos Outbox por intervalo, frecuencia y duración de procesamiento, ventanas de entrega, crecimiento de logs/backups. No sobredimensionar por presunción ni elegir tier dev/test para producción sólo por precio sin documentar límites y validar capacidades.

## Seguridad y privacidad

Sin resolver IAM y secretos de C2, el diseño exige:

- conectividad no pública por defecto;
- workload identity por workload, sin claves de service account embebidas;
- credenciales fuera del repositorio y sin incluirlas en la imagen o logs;
- permisos mínimos para conectar, migrar, respaldar/restaurar y administrar, separados cuando los roles de base lo permitan;
- identidad IAM de infraestructura separada de roles/usuarios SQL de aplicación; privilegios SQL mínimos por aplicación y migrator;
- cifrado administrado por proveedor en tránsito y reposo, sujeto a configuración efectiva y decisión posterior de CMEK si corresponde;
- acceso humano de administración controlado, temporal cuando sea posible y auditable;
- no copiar datos reales o PII a restore de prueba sin la política de privacidad correspondiente.

La selección exacta de IAM, Secret Manager, rotación, roles de servicio y trust boundaries corresponde a C2.

## Operación y observabilidad

Señales mínimas para el handoff a C5, sin definir dashboards completos:

| Área | Señales mínimas |
| --- | --- |
| Base | Conexiones actuales/uso frente al presupuesto; CPU/memoria/storage; crecimiento de disco; latencia de query relevante; locks; conexiones rechazadas; mantenimiento/incidentes |
| Backup/recovery | Resultado y edad del último backup; configuración efectiva PITR; resultado/fecha del restore de prueba y validación asociada |
| Migración | Identificador/versión, inicio, fin, duración, estado, error verificable y quién/qué identidad la ejecutó |
| Runtime que afecta DB | Conexiones/pool pressure, instancias API activas frente a max, paralelismo de job, saturación y reinicios |
| Outbox para dimensionar | Eventos pendientes/edad, claims/leases recuperados, tasa de procesamiento y presión de conexiones; no rediseñar semántica del Outbox |

Los logs y métricas no deben incluir credenciales, payload sensible ni PII innecesaria. Incidentes y alertas se diseñan en C5.

## Pruebas y criterios de fallo

Este documento especifica un **PLAN DE VALIDACIÓN**. No se ejecutó infraestructura ni se presenta evidencia medida.

| Área | Prueba mínima | Evidencia / fallo |
| --- | --- | --- |
| Conectividad | Workload autorizado se conecta por ruta privada y ejecuta query simple; ruta no autorizada es rechazada | Configuración observada, identidad usada, resultado de conexión permitida/rechazada; sin IP pública añadida como atajo |
| Connection budget | Pool alcanza saturación controlada, timeouts no dejan transacciones abiertas; máximo de instancias y concurrencia protegen el presupuesto | Conexiones observadas vs. presupuesto; error legible/backpressure; sin superar umbral seguro |
| Restart/recovery de cliente | Reiniciar workload y simular corte transitorio; pool vuelve a conectar | Éxito de reconexión, sin conexiones zombis ni doble efecto funcional |
| Transacciones/UoW | Verificar commit/rollback local y concurrencia que usa la aplicación | Integridad/FK mantenida, sólo una operación concurrente incompatible confirma |
| Migración expand | Aplicar migración expansiva con versión previa todavía compatible; probar código viejo + schema nuevo y código nuevo + schema expandido | Versiones y resultado trazables, ambas combinaciones compatibles |
| Migración fallida | Provocar error controlado en entorno aislado; verificar que no se promueva runtime | Estado no exitoso, error visible y procedimiento de recuperación/forward-fix; no rollback automático de schema |
| Migración duplicada | Lanzar doble ejecución concurrente en ambiente aislado | Lock/control impide segunda aplicación concurrente; versión no queda parcialmente aplicada sin señal |
| Backup | Confirmar backup automatizado habilitado y resultado observado | Evidencia de configuración y ejecución real; captura temporal sin credenciales |
| Restore | Restaurar a instancia/recurso separado, conectar y validar consistencia de datos de prueba | Duración técnica, punto recuperado, checks y limpieza controlada; no etiquetar tiempo como RTO |
| PITR | Ejecutar sólo si aplica y está habilitado; restaurar un instante de prueba y validar operaciones antes/después del punto | Configuración, instante y resultado; no derivar RPO aceptado por MAPS |
| HA/failover | Si se elige HA en fase posterior, probar reconexión controlada y registrar interrupción | Evidencia de failover técnico; no equivale a SLA/RTO organizacional |
| Job/Outbox | Restart de job, ejecución duplicada, expiración de lease, idempotencia y solapamiento | Resultado funcional único; claims/fencing verificados y presión DB dentro de presupuesto |

No usar locks en memoria local como prueba de exclusión entre instancias. Para restore real, usar dataset sintético y recurso separado. Restaurar producción o usar datos reales requiere procedimiento, permiso y salvaguardas propios; no se ejecuta en este trabajo documental.

## Implementación y handoff a F4

1. Aceptar ADR-CLD-003 y acordar, mediante MAPS-167, latencia de derivación y objetivos de recuperación en lenguaje de negocio.
2. En C2–C4 decidir identidad de workloads, red, región/proyectos por ambiente y topología habilitante; convertir Direct VPC egress + IP privada en configuración reproducible.
3. C8 entrega una ruta para provisionar DB y ejecutar migraciones explícitas desde artifacts inmutables, bloqueando promoción ante fallo.
4. Implementar pools, máximos y límites de concurrency a partir del presupuesto y pruebas de carga; registrar el sizing utilizado.
5. Configurar backups/PITR según política aprobada, y ejecutar restore de prueba a recurso aislado antes de declarar recuperabilidad.
6. Entregar a C5 las señales mínimas de base, migración y presión de Outbox, sin adelantar dashboards/alertas completos.

Este handoff no crea Epic ni Issues de F4 y no aprueba los documentos mencionados.

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| Aceptación del modelo Cloud Run propuesto | Revisión Cloud/Software | Cloud SQL y flujo operativo permanecen como diseño condicionado | ADR-CLD-003 aceptado tras revisión |
| Latencia de inicio de derivación | MAPS ([MAPS-167](https://santitalavera.atlassian.net/browse/MAPS-167)) | Diseñar job/claim/recovery sin intervalo fijado | Máximo tolerable desde asignación hasta comienzo efectivo del procesamiento |
| Pérdida de información tolerable / RPO | MAPS ([MAPS-167](https://santitalavera.atlassian.net/browse/MAPS-167)) | Comparar backup/PITR como capacidades | MAPS expresa necesidad de negocio; Cloud traduce a configuración |
| Indisponibilidad tolerable / RTO | MAPS ([MAPS-167](https://santitalavera.atlassian.net/browse/MAPS-167)) | Describir recuperación zonal y restore | MAPS expresa impacto/tiempo máximo; Cloud traduce a plan y pruebas |
| Volumen, concurrencia, crecimiento y consultas | Software + MAPS; mide Cloud | Proceso de sizing, esquema relacional y métricas candidatas | Perfil representativo y pruebas de carga medibles |
| Índices y depuración técnica de Outbox | Software + Cloud | Diseñar índices para pendientes/leases vencidos y lotes de limpieza independientes de retención funcional | Query plan, carga real/representativa y retención técnica definida con TDD-CLD-005/007 |
| Tier, edición, CPU/RAM/storage y pool | Cloud | Presupuesto de conexiones y pruebas | Resultados de sizing más reconciliación del guardrail USD 200/mes |
| HA regional y recuperación ante desastre | MAPS + Cloud | Comparar costo y comportamientos zonales | Necesidad de negocio, objetivos de recuperación, costo y prueba de failover/restauración |
| Región y networking detallado | C4/C2 | Preferencia por ruta privada; contraste Direct egress / connector | Topología de red y ubicación acordadas; no asumir una región por origen de usuarios |
| Frecuencia/retención backup, retención PITR y protección de borrado | MAPS + Cloud | Definir capacidades y preguntas de negocio | Política aprobada y valor efectivo verificable en configuración |
| Roles SQL, WIF/IAM, secretos y rotación | C2 | Requisito de separación y mínimo privilegio | Diseño C2, sin credenciales en repo |
| Migrator y exclusión de concurrencia | Software + C8 | Contrato de job explícito y resultado auditable | Herramienta elegida y doble ejecución/fallo probados |

MAPS debe responder necesidades, no escoger tier, HA zonal/regional, herramienta, pool ni servicio. En particular, [MAPS-167](https://santitalavera.atlassian.net/browse/MAPS-167) consulta: **¿cuánta información reciente podría perderse ante una falla grave? ¿Cuánto tiempo puede permanecer indisponible el Portal antes de afectar seriamente la operación? ¿Cuánto tiempo máximo es aceptable entre asignación por Admin e inicio efectivo del proceso de derivación/notificación?**

## Referencias y trazabilidad

- ADR/TDD relacionados: [ADR-CLD-000](../../adr/MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md), [ADR-CLD-003](../../adr/MAPS-148-runtime-api-worker-jobs-migraciones/ADR-CLD-003-runtime-api-worker-jobs-migraciones.md), ADR-SW-001/002/003/004/005, [TDD-SW-001](../../../software/tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-002](../../../software/tdd/MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md), [TDD-SW-003](../../../software/tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md), [TDD-SW-005](../../../software/tdd/MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md). TDD-SW-002/005 están integrados en `main` y permanecen `BORRADOR`; la integración de PR #20 no equivale a aprobación.
- Fuentes F0/F1/F2: [F0 §0.1/0.8](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md); [F1 §3/5/7, RN-06/07/10](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §5/9/10/12](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Fila de [traceability.md](../../../traceability.md): base PostgreSQL nueva, ejecución y recuperación de datos, procesamiento Outbox y derivación.
- Documentación oficial consultada (2026-10-28): [Cloud SQL PostgreSQL overview](https://docs.cloud.google.com/sql/docs/postgres), [private IP and connection choices](https://docs.cloud.google.com/sql/docs/postgres/connection-options), [Private Service Connect for Cloud SQL](https://docs.cloud.google.com/sql/docs/postgres/configure-private-service-connect), [configure private IP and limitations](https://docs.cloud.google.com/sql/docs/postgres/configure-private-ip), [Cloud Run Direct VPC egress](https://docs.cloud.google.com/run/docs/configuring/vpc-direct-vpc), [Cloud Run service/revision maximum instances](https://docs.cloud.google.com/run/docs/configuring/max-instances), [VPC serverless connectivity recommendation](https://docs.cloud.google.com/vpc/docs/configure-serverless-vpc-access), [Cloud SQL connection management](https://docs.cloud.google.com/sql/docs/postgres/manage-connections), [Cloud SQL quotas and PostgreSQL max_connections](https://docs.cloud.google.com/sql/docs/postgres/quotas), [Cloud SQL backups](https://docs.cloud.google.com/sql/docs/postgres/backup-recovery/backups), [Cloud SQL PITR](https://docs.cloud.google.com/sql/docs/postgres/backup-recovery/configure-pitr), [Cloud SQL restore and PITR behavior](https://docs.cloud.google.com/sql/docs/postgres/backup-recovery/restore), [Cloud SQL HA](https://docs.cloud.google.com/sql/docs/postgres/high-availability), [Cloud SQL availability](https://docs.cloud.google.com/sql/docs/postgres/availability), [AlloyDB overview](https://docs.cloud.google.com/alloydb/docs/overview).
