# ADR — Selección de plataforma cloud

| Dato | Valor |
| --- | --- |
| ID | `ADR-CLD-000` |
| Título | Selección de plataforma cloud |
| Estado | `ACEPTADO` — GCP como plataforma del MVP |
| Fecha | 2026-10-04 |
| Autor | Santiago Talavera |
| Revisores | Joaquin Rodriguez — `CHANGES_REQUESTED` el 2026-10-15 para alinear el ADR con la decisión organizacional de GCP; `APPROVED` el 2026-10-19 tras verificar la reorientación |
| Work item | Historia [MAPS-161](https://santitalavera.atlassian.net/browse/MAPS-161); subtask documental [MAPS-162](https://santitalavera.atlassian.net/browse/MAPS-162), ambas «En curso» |
| URL del work item | [MAPS-161](https://santitalavera.atlassian.net/browse/MAPS-161); [MAPS-162](https://santitalavera.atlassian.net/browse/MAPS-162) |
| Fase origen | [F3 — Arquitectura](../../../README.md), [F0](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2](../../../../02-diseno/Fase_2__Design_Handoff.md), [Cloud Strategy](../../STRATEGY.md) |
| Decisiones relacionadas | `ADR-CLD-001` a `ADR-CLD-007` previstos, no redactados; `ADR-SW-001/002/003/004/005` **ACEPTADO** y `TDD-SW-001/003` **APROBADO**, con revisión cruzada Cloud formalizada en cada documento |
| Depende de | Baseline F0/F1/F2 y [Cloud Strategy](../../STRATEGY.md); no depende de un ADR Cloud aceptado previo |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Este ADR acepta **GCP como plataforma cloud del MVP**. No acepta automáticamente servicios, SKUs, regiones, topología ni configuraciones: esas decisiones permanecen en los ADR/TDD Cloud derivados.

## Contexto y problema

**Pregunta:** ¿qué plataforma cloud adopta Kondor para el MVP de MAPS, con qué fundamento organizacional y bajo qué límites, riesgos y condiciones de revisión?

El Portal del MVP necesita alojar el journey de solicitudes, la autorización por identidad, la persistencia de progreso y estados, adjuntos privados, derivación con entrega verificable, auditoría y métricas con PII minimizada. F0/F1/F2 excluyen Leads, checkout, pólizas y dependencia funcional del PostgreSQL histórico de MAPS. Retención, volumen, niveles de servicio y objetivos de recuperación no están cerrados; este ADR no los inventa.

El [TARGET conceptual](../../STRATEGY.md) a soportar es: Internet → entrada pública → frontend → API → base relacional, object storage y outbox/estado → worker asíncrono → proveedor de email. IAM, secrets, observabilidad, CI/CD, IaC, ambientes, backup/recuperación y controles de costo son transversales. El TARGET **no** prescribe una relación uno-a-uno entre cajas y productos cloud.

Software define semántica, contratos, datos y fronteras transaccionales; Cloud seleccionará y operará su materialización. Los ADR Software `ADR-SW-001/002/003/004/005` están `ACEPTADO` y `TDD-SW-001/003` están `APROBADO`, con revisión cruzada Cloud formalizada en cada documento. Como contexto no integrado, la [PR #20](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/20) está abierta —no Draft en GitHub— y mantiene `TDD-SW-002/005` **BORRADOR**. La aceptación de GCP habilita decisiones dependientes del proveedor, pero no resuelve sus trade-offs de servicio o diseño.

## Drivers y criterios

La importancia expresa el impacto en esta elección, **no** una ponderación numérica. «Requerido» se refiere a capacidad del TARGET, no a un producto elegido. Las fuentes internas se enlazan al final.

| Driver o criterio | Importancia | Evidencia / fuente y validación pendiente |
| --- | --- | --- |
| Managed-first y operación proporcional para equipo pequeño | Alta | [Strategy](../../STRATEGY.md); comparar tareas retenidas por el equipo, no sólo servicios disponibles. |
| Runtime de contenedores para API, worker y jobs | Alta | TARGET de Strategy; patrón real de ejecución y volumen aún por medir. |
| Persistencia relacional nueva; PostgreSQL gestionado como hipótesis | Alta | [F1](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) excluye PostgreSQL histórico; `ADR-SW-003` está `ACEPTADO` en `main`, con materialización y revisión Cloud pendientes. |
| Object storage privado y control de adjuntos | Alta | [F0](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F2](../../../../02-diseno/Fase_2__Design_Handoff.md); retención MAPS pendiente. |
| IAM, identidades de workload y secretos | Alta | Aislamiento de Cliente/Productor/Admin y protección operacional; detalle de identidad de aplicación corresponde a Software. |
| Seguridad, auditoría y observabilidad sin PII innecesaria | Alta | F0/F1/F2 y Strategy; definir señales y retención técnica después. |
| IaC y aislamiento/promoción de ambientes | Alta | Strategy; evaluar repetibilidad, permisos y costo operativo. |
| Backup, restore y recuperación | Alta | Strategy; RPO/RTO y pruebas de restore pendientes de MAPS. |
| Región, latencia y residencia de datos | Media/alta | Ubicación de usuarios en Argentina; validar disponibilidad por servicio, mediciones y requisito legal/comercial antes de decidir. |
| Experiencia del equipo y MAPS-Landingpage | Media/alta | Una persona del equipo tiene experiencia acotada en GCP y MAPS-LandingPage ya usa esa plataforma. La continuidad reduce dispersión organizacional, aunque la evidencia operativa, permisos y lecciones aún deben relevarse. |
| TCO y modelo de precios | Media/alta | Estimar con workloads comparables y esfuerzo humano; no hay sizing ni tarifas contractuales validadas. |
| CI/CD con GitHub, portabilidad, reversibilidad y lock-in consciente | Media/alta | Strategy y convenciones del repo; evaluar costo de salida de aplicación **y** de infraestructura. |

## Alternativas consideradas

Las tres plataformas ofrecen familias de capacidades aptas para evaluar el TARGET, según sus documentaciones oficiales consultadas el 2026-10-04. **Que exista una capacidad no prueba que la configuración requerida, la región, el costo o la operación encajen en MAPS.**

| Alternativa | Ventajas para evaluar | Fricción, costo o riesgo por validar | Resultado |
| --- | --- | --- | --- |
| Google Cloud Platform (GCP) | Runtime de contenedores con servicios/jobs/worker pools; continuidad con MAPS-LandingPage y experiencia existente en una persona del equipo. | Verificar operación real, patrón del worker, conexión a DB, región, red, costos y egreso. La familiaridad no demuestra superioridad técnica o económica. | **Adoptada para el MVP por decisión organizacional.** |
| Amazon Web Services (AWS) | ECS/Fargate cubre servicios y tareas; ecosistema amplio e integración modular. | Evaluar número de componentes de red/ingreso/identidad que debería operar el equipo, su costo fijo y curva de aprendizaje. | Antecedente comparativo; no rechazada por inviabilidad. |
| Microsoft Azure | Container Apps y jobs cubren API y tareas; identidad administrada e integración con servicios Azure. | Validar disponibilidad regional del conjunto, redes/ingreso, configuración de identidad, costos y experiencia efectiva del equipo. | Antecedente comparativo; no rechazada por inviabilidad. |

### Comparación de ajuste y consecuencias

Las observaciones de integración son **hipótesis de diseño** derivadas del TARGET; no son mediciones ni una clasificación ganadora. Las 25 dimensiones describen principalmente cobertura potencial/documental: no demuestran superioridad, performance, disponibilidad, SLA ni TCO real. Las capacidades citadas se respaldan en la [documentación oficial](#fuentes-externas-consultadas), pero su disponibilidad/configuración concreta debe verificarse para el diseño candidato.

| Dimensión | GCP | AWS | Azure |
| --- | --- | --- | --- |
| 1. Encaje con TARGET | Posible con servicios gestionados; validar cadena completa y fallos entre componentes. | Posible; validar composición y ownership de cada integración. | Posible; validar composición y límites del entorno. |
| 2. Managed/serverless | Reduce operación de hosts, pero no elimina límites ni configuración. | Fargate elimina gestión de servidores para tareas; quedan orquestación y red. | Container Apps gestiona infraestructura de contenedores; quedan entorno y escalado. |
| 3. Runtime API | Cloud Run admite endpoint HTTP; verificar concurrencia, mínimos y acceso a datos. | ECS/Fargate admite servicio; evaluar ingress, balanceo y red asociados. | Container Apps admite ingreso HTTP; evaluar reglas, revisiones y red. |
| 4. Worker/jobs | Jobs/worker pools son rutas distintas; elegir según semántica real de Delivery. | Tareas ECS y scheduling posibles; evaluar disparo, reintento e idempotencia. | Apps/jobs posibles; evaluar disparo por evento y reintentos. |
| 5. PostgreSQL gestionado | Cloud SQL for PostgreSQL es capacidad candidata, no elegida. | RDS for PostgreSQL es capacidad candidata, no elegida. | Azure Database for PostgreSQL Flexible Server es capacidad candidata, no elegida. |
| 6. Object storage privado | Cloud Storage puede servir; validar permisos, cifrado y ciclo de vida. | S3 puede servir; validar políticas, cifrado y ciclo de vida. | Blob Storage puede servir; validar RBAC, cifrado y ciclo de vida. |
| 7. IAM/workload identity | Identidad de servicio por workload; revisar alcance mínimo y federación CI. | Roles de tarea IAM; revisar trust y permisos mínimos. | Managed identity; revisar asignación y RBAC mínimos. |
| 8. Secrets | Secret Manager candidato; validar acceso, rotación y auditoría. | Secrets Manager candidato; validar acceso, rotación y auditoría. | Key Vault candidato; validar acceso, rotación y auditoría. |
| 9. Observabilidad | Stack nativo posible; controlar PII y volumen de logs/traces. | Stack nativo posible; controlar correlación entre componentes y costos. | Stack nativo posible; controlar retención, PII y costos. |
| 10. IaC | Terraform viable; probar cobertura de recursos y drift. | Terraform/CloudFormation viables; evitar doble fuente de verdad. | Terraform/Bicep viables; evitar doble fuente de verdad. |
| 11. CI/CD y GitHub | Validar federación de identidad y promoción sin claves estáticas. | Validar OIDC, permisos y promoción entre cuentas/ambientes. | Validar OIDC, permisos y promoción entre suscripciones/ambientes. |
| 12. Regiones relevantes | São Paulo y Santiago figuran como regiones GCP; confirmar **cada** servicio. | São Paulo figura como región AWS; confirmar **cada** servicio. | Brazil South y Chile Central figuran en lista Azure; confirmar **cada** servicio. |
| 13. Latencia esperable | Cercanía regional puede ayudar, sin garantía; medir rutas reales desde Argentina. | Igual: probar desde usuarios y entre runtime/DB/storage. | Igual: probar desde usuarios y entre runtime/DB/storage. |
| 14. Experiencia del equipo | Experiencia GCP informada; auditar tareas realmente operadas y personas disponibles. | Experiencia AWS específica MAPS no documentada; relevarla. | Experiencia Azure específica MAPS no documentada; relevarla. |
| 15. MAPS-Landingpage | Antecedente GCP informado para el cliente; checkout local no demuestra despliegue/operación. | No se documentó antecedente del cliente en AWS. | No se documentó antecedente del cliente en Azure. |
| 16. Complejidad operacional | Mapear guardias, permisos, conexión DB, workers y restore; no asumir costo cero. | Mapear recursos de red/ingreso, permisos, workers y restore. | Mapear entorno, identidades, workers y restore. |
| 17. TCO | Puede reducir aprendizaje; faltan consumo y tarifas para calcular. | Puede variar por composición y cargos fijos; faltan cargas y tarifas. | Puede variar por entorno y telemetría; faltan cargas y tarifas. |
| 18. Pricing model | Medir mínimos, CPU/memoria/solicitudes, DB, storage, red y observabilidad. | Medir capacidad/tareas, DB, storage, red, balanceo y observabilidad. | Medir réplicas/consumo, DB, storage, red y observabilidad. |
| 19. Lock-in | IAM, eventos, observabilidad y despliegue pueden quedar acoplados. | Lo mismo; sumar composición propia de servicios AWS. | Lo mismo; sumar integración con identidad y entorno Azure. |
| 20. Portabilidad | Contenedores/PostgreSQL/puertos reducen acoplamiento de app, no de IaC. | Misma distinción; adapters no portan políticas ni red. | Misma distinción; managed identity requiere otro binding. |
| 21. Reversibilidad | Probar export de datos/objetos, reconstrucción IaC y reemplazo de integraciones. | Misma prueba, incluyendo políticas y componentes de red. | Misma prueba, incluyendo identidad y observabilidad. |
| 22. Seguridad/shared responsibility | El proveedor opera infraestructura gestionada; MAPS conserva configuración, acceso y datos. | Igual; revisar perímetro efectivo y roles. | Igual; revisar RBAC, red y protección de datos. |
| 23. Ecosistema/madurez | Amplio; la pregunta es soporte de este patrón y equipo, no cantidad de productos. | Amplio; su granularidad da opciones pero puede añadir ensamblaje. | Amplio; evaluar ajustes sin introducir dependencias innecesarias. |
| 24. Riesgos | Familiaridad podría sesgar elección; validar costos, red y disponibilidad. | Complejidad de ensamblaje y aprendizaje podrían elevar carga. | Experiencia no demostrada y variación regional podrían elevar incertidumbre. |
| 25. Evolución sin sobrediseño | Empezar con configuración mínima; escalar con métricas, no multirregión implícita. | Igual; no introducir EKS ni servicios extra sin driver. | Igual; no introducir AKS ni capas extra sin driver. |

### Mapeo ilustrativo de capacidades

Sólo normaliza vocabulario para comparar; **ninguna celda selecciona un producto**. Runtime del worker y servicio de DB/storage se decidirán en ADR/TDD posteriores con cargas y contratos confirmados.

| Responsabilidad | GCP | AWS | Azure |
| --- | --- | --- | --- |
| Contenedores/API/jobs | Cloud Run | ECS con Fargate | Container Apps |
| PostgreSQL gestionado | Cloud SQL for PostgreSQL | RDS for PostgreSQL | Azure Database for PostgreSQL Flexible Server |
| Object storage | Cloud Storage | S3 | Blob Storage |
| Secrets | Secret Manager | Secrets Manager | Key Vault |
| Observabilidad | Cloud Monitoring/Logging | CloudWatch | Azure Monitor |
| Identidad de workload | Service account | IAM task role | Managed identity |
| Registry | Artifact Registry | ECR | Azure Container Registry |
| IaC | Terraform | Terraform / CloudFormation | Terraform / Bicep |

### Costo, región y portabilidad: cómo cerrar la comparación

`TCO = infraestructura + operación + tiempo humano + complejidad + incidentes + riesgo + downtime`. La [baseline y comparación de plataformas](./EVIDENCE-CLD-000-comparacion-plataformas.md) conserva, como antecedente reproducible, tres escenarios de carga iguales para los tres proveedores y el marco histórico de gates, ponderación y sensibilidades. No se aplicó scoring ni se demostró un ganador económico. Desde esta decisión, el modelo se usa principalmente para verificar la viabilidad y el guardrail de costo de la arquitectura GCP que definan los ADR/TDD posteriores. El sizing y precio exactos pertenecen a esos diseños y estimaciones.

La lista oficial de regiones acredita existencia de regiones potencialmente cercanas, **no** disponibilidad conjunta de todos los productos, latencia, residencia requerida ni cumplimiento. Antes del go-live se debe comprobar por servicio y región la colocalización de runtime/DB/storage, ruta del usuario argentino, egreso, backup/restore y cualquier requisito de residencia que MAPS confirme. No se asigna región aquí.

Contenedores, PostgreSQL, object storage tras puertos y límites hexagonales **propuestos** favorecen portabilidad de **aplicación**. IaC ayuda a reproducir la infraestructura de un proveedor, pero no hace portables sus políticas IAM, servicios gestionados, redes ni observabilidad. El criterio es aceptar lock-in cuando compre valor explícito y exista plan de salida proporcional; no prometer portabilidad total.

## Decisión

**Se adopta Google Cloud Platform (GCP) como plataforma cloud del MVP de MAPS.** La decisión fue tomada por mayoría verbal de tres de cuatro integrantes del equipo, priorizando continuidad con MAPS-LandingPage y concentración de aprendizaje en la única plataforma sobre la que existe experiencia interna, aunque sea acotada a staging.

La aceptación es **organizacional y de dirección tecnológica**. No afirma que GCP haya ganado un scoring, benchmark o comparación concluyente de superioridad técnica, económica u operacional. Quedó registrada una objeción técnica: la selección podía considerarse prematura mientras la comparación no produjera evidencia concluyente. Esa limitación se acepta conscientemente; la comparación AWS/Azure se conserva como antecedente histórico reproducible, no como requisito pendiente para adoptar GCP ni como prueba de inviabilidad de las alternativas.

Esta decisión acepta la plataforma, no la arquitectura concreta. Para orientar los siguientes diseños se adopta como **arquitectura candidata de referencia**, sujeta a justificación en ADR/TDD: Cloud Run para API; Cloud SQL for PostgreSQL; Cloud Storage privado; Secret Manager; Artifact Registry; Cloud Logging/Monitoring; Terraform; y GitHub Actions con OIDC/Workload Identity Federation. Ninguno de esos productos, regiones, SKUs, mínimos, políticas o topologías queda aceptado por esta lista.

Para el procesamiento asíncrono, **Cloud Run Jobs + Cloud Scheduler** es la alternativa inicial preferida a evaluar, no una decisión aceptada. `ADR-CLD-003` y `TDD-CLD-005` deben contrastarla con Pub/Sub y con un worker/servicio permanente según latencia, frecuencia, solapamiento, claims/leases, retries, idempotencia, recuperación, webhooks, resultados tardíos y la semántica de Delivery definida por Software.

El tope de **USD 200/mes** pasa a ser guardrail de viabilidad interna para GCP. Superarlo no reabre automáticamente la selección de proveedor: primero obliga a revisar sizing, arquitectura, estrategia de ambientes, presupuesto y alcance, sin degradar seguridad, recuperación ni requisitos obligatorios. La política experimental de USD 0 out-of-pocket permanece sin cambios.

| Nivel | Alcance | Estado después de este ADR |
| --- | --- | --- |
| 1 — Plataforma | `ADR-CLD-000`: proveedor cloud del MVP | **GCP aceptado**. |
| 2 — Arquitectura | `ADR-CLD-001` a `ADR-CLD-007`: entrada, ambientes, runtime, IaC, CI/CD, observabilidad y seguridad | Pendiente; debe justificar decisiones dentro del constraint GCP. |
| 3 — Diseño | `TDD-CLD-001` a `TDD-CLD-008`: servicios, configuración, red, pooling, backups, IAM, workers, storage, pipelines y operación | Pendiente; ningún servicio o ajuste queda aprobado por este ADR. |

### Relación con Software y derivaciones posteriores

`ADR-SW-003` y `TDD-SW-001` ya fijan respectivamente las fronteras PostgreSQL/Unit of Work y Document/adjuntos. La PR #17, integrada a `main`, aporta claims, leases y retries del Outbox junto con la frontera de identidad/revocación; la PR #20 mantiene en borrador detalles de `FormVersion`, documentos, Assignment y Delivery. Para este ADR sólo importan sus consecuencias Cloud: capacidades de persistencia y transacción, ejecución recuperable de workers, identidad/revocación efectiva, storage privado y soporte operacional a Assignment/Delivery. No se replica ni resuelve la semántica Software.

GCP, junto con managed-first, permite que `TDD-CLD-003` compare y justifique el servicio PostgreSQL administrado, conexiones, backup y migraciones; GCP junto con object storage privado permite que `TDD-CLD-004` compare y justifique storage y controles. Son **derivaciones condicionadas**, no elecciones automáticas de Cloud SQL o Cloud Storage. Si aparece un trade-off arquitectónico de primer orden, corresponderá un ADR específico.

## Consecuencias y trade-offs

- **Positivas:** reduce dispersión de aprendizaje, alinea el Portal con el antecedente MAPS-LandingPage y habilita cerrar diseños dependientes del proveedor.
- **Negativas/costo:** acepta una dirección antes de contar con evidencia comparativa concluyente y concentra lock-in, aprendizaje y riesgos operativos en GCP.
- **Servicios todavía abiertos:** la plataforma aceptada no evita comparar alternativas internas de GCP ni justificar cada servicio, configuración y topología.
- **Operación y seguridad:** el proveedor no asume la responsabilidad del equipo sobre IAM, configuración, autorización funcional, protección de datos, observabilidad, recuperación y costos.

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Decisión tomada sin comparación concluyente y posible sesgo de familiaridad | Equipo | Conservar el antecedente, declarar la limitación y exigir evidencia GCP para cada diseño y condición de go-live; no atribuir superioridad no demostrada. |
| Volumen, simultaneidad y patrón API/worker desconocidos | MAPS + Software + Cloud | Medir/estimar escenarios comparables y verificar límites, escalado y conexiones. |
| RPO/RTO, retención y residencia sin definición | MAPS + Cloud | Confirmar requisitos; probar backup/restore y revisar región/servicios. No asumir exigencia legal. |
| Experiencia GCP en MAPS-Landingpage sólo informada | Cloud + equipo de MAPS-Landingpage | Relevar despliegue, recursos, incidentes, permisos, costos y esfuerzo real; no confundir configuración documentada con operación verificada. |
| TCO GCP no validado con arquitectura final | Cloud + MAPS | Reconciliar el modelo con calculators y la arquitectura resultante de ADR/TDD; controlar el guardrail de USD 200/mes. |
| Compatibilidad regional y latencia no demostradas | Cloud | Verificar disponibilidad de cada capacidad crítica en región candidata y medir rutas desde Argentina. |
| Revisión cruzada y contratos Software | Software + Cloud | Mantener trazabilidad con `ADR-SW-001/002/003/004/005` aceptados y `TDD-SW-001/003` aprobados, cuya revisión cruzada Cloud está formalizada; seguir PR #20 (`TDD-SW-002/005` BORRADOR) sin presentarla como integrada. |
| Runtime de Delivery todavía no resuelto | Software + Cloud | Evaluar Jobs + Scheduler, Pub/Sub y worker permanente contra los contratos de Outbox/Delivery y sus fallos antes de aceptar ADR-CLD-003/TDD-CLD-005. |
| Seguridad/IAM y costo de salida | Cloud + Software | Prototipo acotado de identidad, secrets, acceso privado y export/reconstrucción; revisión cruzada pendiente. |
| Límites concretos y lock-in de servicios GCP no verificados | Cloud | Validar cuotas, integración, reversibilidad y alternativas dentro de GCP en los ADR/TDD antes de aceptar la materialización. |

## Criterios de revisión futura

Revisar ante incapacidad de satisfacer un requisito obligatorio; incompatibilidad de seguridad, compliance o residencia; indisponibilidad material de capacidades requeridas; límites operativos incompatibles; costo estructuralmente inaceptable después de ajustes razonables; o un cambio organizacional explícito. Exceder USD 200/mes por sí solo no cambia de proveedor: primero se revisan arquitectura, sizing, ambientes, presupuesto y alcance. Si finalmente se abandona GCP, crear otro ADR que indique `Reemplaza` y marcar éste `REEMPLAZADO`; no reescribir esta decisión histórica.

## Referencias y trazabilidad

### Fuentes internas

- [F0 — baseline](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 — Discovery](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 — Design Handoff](../../../../02-diseno/Fase_2__Design_Handoff.md): alcance, roles, solicitud, datos y pendientes funcionales.
- [Cloud Strategy](../../STRATEGY.md): TARGET, principios, gate y derivaciones condicionadas; permanece `BORRADOR ESTRATÉGICO`.
- [Evidencia ADR-CLD-000](./EVIDENCE-CLD-000-comparacion-plataformas.md): baseline documental `v1.3`, arquitectura mínima equivalente y registro de costeo todavía en elaboración; conserva la comparación como antecedente y no acepta servicios.
- [PR #14 de Software](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/14), incorporada a `main`: `ADR-SW-001/002/003` aceptados y `TDD-SW-001` aprobado; revisión cruzada Cloud formalizada posteriormente en cada documento.
- [PR #17 de Software](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/17), integrada a `main`: `ADR-SW-004/005` aceptados y `TDD-SW-003` aprobado mediante formalización documental posterior; revisión cruzada Cloud registrada en cada documento.
- [PR #20 de Software](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/20), abierta, no Draft en GitHub y no integrada: `TDD-SW-002/005` permanecen `BORRADOR`.
- MAPS-Landingpage: antecedente de uso GCP **informado** para el mismo cliente; el checkout local revisado no contiene evidencia suficiente para afirmar despliegue, operación ni costos actuales. Validación pendiente.
- [Fila transversal en traceability.md](../../../traceability.md): «Desplegar el Portal con aislamiento, seguridad y operación verificables».

### Fuentes externas consultadas

Documentación oficial consultada el **2026-10-04**. Los ejemplos de productos y regiones son vigentes a esa consulta; confirmar disponibilidad y precios al decidir.

| Tema | GCP | AWS | Azure |
| --- | --- | --- | --- |
| Runtime y jobs | [Cloud Run overview](https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run) | [ECS/Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/getting-started-fargate.html), [scheduling tasks](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/scheduling_tasks.html) | [Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/overview), [jobs](https://learn.microsoft.com/en-us/azure/container-apps/jobs) |
| PostgreSQL | [Cloud SQL for PostgreSQL](https://docs.cloud.google.com/sql/docs/postgres) | [RDS for PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html) | [Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/overview) |
| Object storage | [Cloud Storage](https://docs.cloud.google.com/storage/docs) | [Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) | [Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction) |
| Secrets | [Secret Manager](https://docs.cloud.google.com/secret-manager/docs/overview) | [Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html) | [Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/general/overview) |
| Observabilidad | [Cloud Monitoring](https://cloud.google.com/monitoring/docs/monitoring-overview) | [CloudWatch](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html) | [Azure Monitor](https://learn.microsoft.com/en-us/azure/azure-monitor/overview) |
| Identidad de workload | [Cloud Run service identity](https://cloud.google.com/run/docs/securing/service-identity) | [ECS task IAM role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html) | [Container Apps managed identity](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity) |
| Registry | [Artifact Registry](https://docs.cloud.google.com/artifact-registry/docs/overview) | [Amazon ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html) | [Azure Container Registry](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-intro) |
| IaC y federación CI | [Terraform en GCP](https://docs.cloud.google.com/docs/terraform/terraform-overview), [federación de pipelines](https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines) | [CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html), [OIDC con GitHub](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html) | [Bicep](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview), [OIDC con GitHub](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect) |
| Regiones | [Regiones Cloud SQL](https://docs.cloud.google.com/sql/docs/postgres/region-availability-overview) y [regiones GCP](https://cloud.google.com/about/locations) | [Regiones AWS](https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html) | [Regiones y zonas Azure](https://learn.microsoft.com/en-us/azure/reliability/availability-zones-region-support) |
| Estimación de costos | [Google Cloud Pricing Calculator](https://cloud.google.com/products/calculator) | [AWS Pricing Calculator](https://docs.aws.amazon.com/pricing-calculator/latest/userguide/getting-started.html) | [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/) |

### Registro de decisión

| Estado | Resolución | Revisión cruzada | Fecha de resolución |
| --- | --- | --- | --- |
| `ACEPTADO` | GCP adoptado para el MVP por mayoría verbal 3/4, continuidad con MAPS-LandingPage y concentración del aprendizaje. No implica superioridad comparativa ni aceptación de servicios. | Joaquin Rodriguez: `CHANGES_REQUESTED` el 2026-10-15 para alinear el documento con la decisión GCP ya acordada; `APPROVED` el 2026-10-19 tras verificar la reorientación. | 2026-10-17 / 2026-10-19 |
