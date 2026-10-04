# ADR — Selección de plataforma cloud

| Dato | Valor |
| --- | --- |
| ID | `ADR-CLD-000` |
| Título | Selección de plataforma cloud |
| Estado | `PROPUESTO` — decisión pendiente |
| Fecha | 2026-10-04 |
| Autor | Santiago Talavera |
| Revisores | Joaquin Rodriguez — revisión cruzada Software/Domain pendiente |
| Work item | Historia [MAPS-161](https://santitalavera.atlassian.net/browse/MAPS-161); subtask documental [MAPS-162](https://santitalavera.atlassian.net/browse/MAPS-162), ambas «Por hacer» al redactar |
| URL del work item | [MAPS-161](https://santitalavera.atlassian.net/browse/MAPS-161); [MAPS-162](https://santitalavera.atlassian.net/browse/MAPS-162) |
| Fase origen | [F3 — Arquitectura](../../../README.md), [F0](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2](../../../../02-diseno/Fase_2__Design_Handoff.md), [Cloud Strategy](../../STRATEGY.md) |
| Decisiones relacionadas | `ADR-CLD-001` a `ADR-CLD-007` previstos, no redactados; `ADR-SW-001/002/003` **PROPUESTO** y `TDD-SW-001` **BORRADOR** en [PR #14](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/14), sin aceptación ni aprobación |
| Depende de | Baseline F0/F1/F2 y [Cloud Strategy](../../STRATEGY.md); no depende de un ADR Cloud aceptado previo |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Este ADR compara **plataformas**, no elige servicios ni topología. GCP es una dirección de trabajo de la Strategy, **no** una plataforma seleccionada. La aceptación requiere revisión cruzada y decisión explícita registrada aquí.

## Contexto y problema

**Pregunta:** ¿por qué elegir una determinada plataforma cloud para MAPS frente a las demás alternativas viables?

El Portal del MVP necesita alojar el journey de solicitudes, la autorización por identidad, la persistencia de progreso y estados, adjuntos privados, derivación con entrega verificable, auditoría y métricas con PII minimizada. F0/F1/F2 excluyen Leads, checkout, pólizas y dependencia funcional del PostgreSQL histórico de MAPS. Retención, volumen, niveles de servicio y objetivos de recuperación no están cerrados; este ADR no los inventa.

El [TARGET conceptual](../../STRATEGY.md) a soportar es: Internet → entrada pública → frontend → API → base relacional, object storage y outbox/estado → worker asíncrono → proveedor de email. IAM, secrets, observabilidad, CI/CD, IaC, ambientes, backup/recuperación y controles de costo son transversales. El TARGET **no** prescribe una relación uno-a-uno entre cajas y productos cloud.

Software define semántica, contratos, datos y fronteras transaccionales; Cloud seleccionará y operará su materialización. Los ADR Software de [PR #14](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/14) siguen `PROPUESTO`, y su TDD `BORRADOR`: son contexto de integración, no restricciones aceptadas. `ADR-CLD-000` es gate para aceptar decisiones dependientes del proveedor; los análisis neutrales pueden continuar.

## Drivers y criterios

La importancia expresa el impacto en esta elección, **no** una ponderación numérica. «Requerido» se refiere a capacidad del TARGET, no a un producto elegido. Las fuentes internas se enlazan al final.

| Driver o criterio | Importancia | Evidencia / fuente y validación pendiente |
| --- | --- | --- |
| Managed-first y operación proporcional para equipo pequeño | Alta | [Strategy](../../STRATEGY.md); comparar tareas retenidas por el equipo, no sólo servicios disponibles. |
| Runtime de contenedores para API, worker y jobs | Alta | TARGET de Strategy; patrón real de ejecución y volumen aún por medir. |
| Persistencia relacional nueva; PostgreSQL gestionado como hipótesis | Alta | [F1](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) excluye PostgreSQL histórico; `ADR-SW-003` aún `PROPUESTO` en PR #14. |
| Object storage privado y control de adjuntos | Alta | [F0](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F2](../../../../02-diseno/Fase_2__Design_Handoff.md); retención MAPS pendiente. |
| IAM, identidades de workload y secretos | Alta | Aislamiento de Cliente/Productor/Admin y protección operacional; detalle de identidad de aplicación corresponde a Software. |
| Seguridad, auditoría y observabilidad sin PII innecesaria | Alta | F0/F1/F2 y Strategy; definir señales y retención técnica después. |
| IaC y aislamiento/promoción de ambientes | Alta | Strategy; evaluar repetibilidad, permisos y costo operativo. |
| Backup, restore y recuperación | Alta | Strategy; RPO/RTO y pruebas de restore pendientes de MAPS. |
| Región, latencia y residencia de datos | Media/alta | Ubicación de usuarios en Argentina; validar disponibilidad por servicio, mediciones y requisito legal/comercial antes de decidir. |
| Experiencia del equipo y MAPS-Landingpage | Media/alta | Experiencia en GCP informada para el mismo cliente; evidencia operativa verificable, permisos y lecciones aún por relevar. No determina el resultado. |
| TCO y modelo de precios | Media/alta | Estimar con workloads comparables y esfuerzo humano; no hay sizing ni tarifas contractuales validadas. |
| CI/CD con GitHub, portabilidad, reversibilidad y lock-in consciente | Media/alta | Strategy y convenciones del repo; evaluar costo de salida de aplicación **y** de infraestructura. |

## Alternativas consideradas

Las tres plataformas ofrecen familias de capacidades aptas para evaluar el TARGET, según sus documentaciones oficiales consultadas el 2026-10-04. **Que exista una capacidad no prueba que la configuración requerida, la región, el costo o la operación encajen en MAPS.**

| Alternativa | Ventajas para evaluar | Fricción, costo o riesgo por validar | Resultado |
| --- | --- | --- | --- |
| Google Cloud Platform (GCP) | Runtime de contenedores con servicios/jobs/worker pools; experiencia en GCP informada para MAPS-Landingpage podría acortar aprendizaje. | Verificar evidencia operacional, patrón del worker, conexión a DB, región, configuración de red, costos de mínimos y egreso; evitar seleccionar por familiaridad. | Pendiente; sin recomendación definitiva. |
| Amazon Web Services (AWS) | ECS/Fargate cubre servicios y tareas; ecosistema amplio e integración modular. | Evaluar número de componentes de red/ingreso/identidad que deberá operar el equipo, su costo fijo y curva de aprendizaje; no inferir que la amplitud implique mejor ajuste. | Pendiente; viable para evaluación. |
| Microsoft Azure | Container Apps y jobs cubren API y tareas; identidad administrada e integración con servicios Azure. | Validar disponibilidad regional del conjunto, redes/ingreso, configuración de identidad, costos y experiencia efectiva del equipo; no asumir ventaja sin evidencia de uso MAPS. | Pendiente; viable para evaluación. |

### Comparación de ajuste y consecuencias

Las observaciones de integración son **hipótesis de diseño** derivadas del TARGET; no son mediciones ni una clasificación ganadora. Las capacidades citadas se respaldan en la [documentación oficial](#fuentes-externas-consultadas), pero su disponibilidad/configuración concreta debe verificarse para el diseño candidato.

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

`TCO = infraestructura + operación + tiempo humano + complejidad + incidentes + riesgo + downtime`. Preparar **tres escenarios de carga iguales** para los tres proveedores, con patrón HTTP, frecuencia de worker/jobs, tamaño/conexiones de DB, objetos/egreso, emails, logs/retención, ambientes y backups. Separar costos fijos potenciales (DB, mínimos, balanceo/red), variables (CPU, solicitudes, almacenamiento, transferencia, observabilidad), aprendizaje/operación y costo de salida. Usar calculadoras oficiales y tarifa contractual vigente cuando exista; hoy no hay datos para afirmar un ganador económico ni fijar precios. El sizing y precio exactos pertenecen a TDD/estimación posterior.

La lista oficial de regiones acredita existencia de regiones potencialmente cercanas, **no** disponibilidad conjunta de todos los productos, latencia, residencia requerida ni cumplimiento. Antes de seleccionar, comprobar por servicio y región la colocalización de runtime/DB/storage, ruta del usuario argentino, egreso, backup/restore y cualquier requisito de residencia que MAPS confirme. No se asigna región aquí.

Contenedores, PostgreSQL, object storage tras puertos y límites hexagonales **propuestos** favorecen portabilidad de **aplicación**. IaC ayuda a reproducir la infraestructura de un proveedor, pero no hace portables sus políticas IAM, servicios gestionados, redes ni observabilidad. El criterio es aceptar lock-in cuando compre valor explícito y exista plan de salida proporcional; no prometer portabilidad total.

## Decisión

**Pendiente.** `ADR-CLD-000` permanece `PROPUESTO`: ninguna plataforma es elegida, recomendada como ganadora ni rechazada con la evidencia disponible. El antecedente GCP informado para MAPS-Landingpage reduce incertidumbre potencial, pero exige prueba de operación real y comparación de TCO/ajuste con AWS y Azure. La plataforma se decidirá tras revisión cruzada y cierre de las validaciones de abajo; el registro pasará explícitamente a `ACEPTADO` o `RECHAZADO` según corresponda.

Este gate condiciona la aceptación de decisiones cuya justificación dependa materialmente de GCP/AWS/Azure. **No bloquea** investigación o diseño proveedor-neutral. Tampoco elige Cloud Run, Cloud SQL, Cloud Storage, RDS, S3, Container Apps ni equivalentes.

### Relación con Software y derivaciones posteriores

Si `ADR-SW-003` llega a `ACEPTADO` y confirma una base PostgreSQL **nueva**, la plataforma elegida más managed-first permitirán que `TDD-CLD-003` compare y justifique el servicio PostgreSQL administrado, conexiones, backup y migraciones. Si el contrato Software de Documents llega a estar `ACEPTADO`, plataforma elegida más object storage privado permitirán que `TDD-CLD-004` compare y justifique storage y controles. Son **derivaciones condicionadas**, no elecciones de Cloud SQL/Cloud Storage ni de sus equivalentes. Si aparece un trade-off arquitectónico de primer orden, corresponderá un ADR específico.

## Consecuencias y trade-offs

- **Positivas del proceso propuesto:** evita sesgo de proveedor, hace visible la carga operativa y conserva coherencia con F0/F1/F2 y la Strategy antes de fijar servicios.
- **Negativas/costo:** posterga la aceptación de ADR/TDD dependientes del proveedor y requiere recolectar datos de carga, precio y experiencia; los diseños neutros pueden avanzar en paralelo.
- **Trade-off futuro:** una elección managed-first puede reducir operación directa pero aumentar acoplamiento, costos variables o dependencia de habilidades. Sólo se aceptará al demostrar valor frente a las otras opciones viables.
- **Operación y seguridad:** cualquier plataforma elegida dejará al equipo responsabilidad por IAM, configuración, protección de datos, observabilidad, pruebas de recuperación y control de costos.

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Volumen, simultaneidad y patrón API/worker desconocidos | MAPS + Software + Cloud | Medir/estimar escenarios comparables y verificar límites, escalado y conexiones. |
| RPO/RTO, retención y residencia sin definición | MAPS + Cloud | Confirmar requisitos; probar backup/restore y revisar región/servicios. No asumir exigencia legal. |
| Experiencia GCP en MAPS-Landingpage sólo informada | Cloud + equipo de MAPS-Landingpage | Relevar despliegue, recursos, incidentes, permisos, costos y esfuerzo real; no confundir configuración documentada con operación verificada. |
| TCO no cuantificado | Cloud + MAPS | Presupuestar mismo workload en calculadoras oficiales, incluir operación y salida; registrar supuestos y fecha. |
| Compatibilidad regional y latencia no demostradas | Cloud | Verificar disponibilidad de cada capacidad crítica en región candidata y medir rutas desde Argentina. |
| Contratos Software aún propuestos | Software + Cloud | Revisar PR #14 y decisiones posteriores sin tratarlas como aceptadas; adaptar mapeo sólo al contrato validado. |
| Seguridad/IAM y costo de salida | Cloud + Software | Prototipo acotado de identidad, secrets, acceso privado y export/reconstrucción; revisión cruzada pendiente. |

## Criterios de revisión futura

Cuando exista una decisión `ACEPTADO`, revisar ante cambio de requisitos de residencia o recuperación, volumen/TCO observado, indisponibilidad regional, incidente de seguridad, límites del proveedor que afecten el TARGET, o una nueva capacidad que cambie materialmente carga operativa/reversibilidad. Si cambia un ADR aceptado, crear otro que indique `Reemplaza` y marcar éste `REEMPLAZADO`; no reescribir la decisión histórica.

## Referencias y trazabilidad

### Fuentes internas

- [F0 — baseline](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 — Discovery](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 — Design Handoff](../../../../02-diseno/Fase_2__Design_Handoff.md): alcance, roles, solicitud, datos y pendientes funcionales.
- [Cloud Strategy](../../STRATEGY.md): TARGET, principios, gate y derivaciones condicionadas; permanece `BORRADOR ESTRATÉGICO`.
- [PR #14 de Software](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/14): `ADR-SW-001/002/003` propuestos y `TDD-SW-001` borrador, consultada el 2026-10-04. No se modificó aquí.
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
| `PROPUESTO` | **Pendiente** — elegir o rechazar explícitamente tras comparar escenarios y evidencia. | Joaquin Rodriguez: pendiente. | — |
