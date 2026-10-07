# Evidencia ADR-CLD-000 — Baseline y comparación de plataformas

| Dato | Valor |
| --- | --- |
| Estado | **EN ELABORACIÓN** — evidencia de apoyo; no acepta plataforma ni servicios |
| Corte | 2026-10-07 |
| Work items | Historia [MAPS-161](https://santitalavera.atlassian.net/browse/MAPS-161); subtask [MAPS-162](https://santitalavera.atlassian.net/browse/MAPS-162) |
| Decisión relacionada | [ADR-CLD-000 — Selección de plataforma cloud](./ADR-CLD-000-seleccion-plataforma-cloud.md) (`PROPUESTO`) |
| Fuentes de alcance | [F0](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2](../../../../02-diseno/Fase_2__Design_Handoff.md) y [Cloud Strategy](../../STRATEGY.md) |

Este anexo congela una baseline comparable para reunir evidencia de `ADR-CLD-000`. **No es un ADR ni un TDD**, no reemplaza requisitos de MAPS y no convierte los supuestos de dimensionamiento en compromisos funcionales o de nivel de servicio.

## 1. Reglas de comparación

- Aplicar el mismo workload y los mismos límites funcionales a GCP, AWS y Azure.
- Separar `CONFIRMADO`, `SUPUESTO DE COMPARACIÓN` y `PENDIENTE MAPS`.
- Comparar costo bruto sin créditos; registrar créditos o descuentos por separado.
- Incluir infraestructura, operación humana, complejidad, incidentes, riesgo y costo de salida en el TCO.
- No premiar cantidad de servicios ni familiaridad sin evidencia operacional.
- No desplegar recursos para esta etapa documental. Cualquier spike posterior tendrá alcance, presupuesto, teardown y datos sintéticos explícitos.
- Registrar fuente y fecha de cada precio o disponibilidad regional; una lista de regiones no prueba disponibilidad conjunta ni cuota efectiva en una cuenta.

## 2. Baseline congelada v0

### 2.1 Datos confirmados

| Dimensión | Baseline |
| --- | --- |
| Usuarios | Personas ubicadas sólo en Argentina. |
| Tipo de cliente | PyME; volumen real todavía no medido. |
| Adjuntos | Entre 1 y 4 archivos por solicitud. |
| Ambientes | `development`, `staging` y `production`. |
| Experiencia | Una persona con experiencia GCP limitada a despliegue de staging; no se informó experiencia operativa en AWS o Azure. |
| Antecedente | Existe un proyecto staging de MAPS-Landingpage en GCP; acceso de lectura y facturación histórica pendientes. |
| Presupuesto | Máximo USD 200/mes para cloud. Objetivo operativo de comparación: USD 120–150/mes para conservar margen. |
| Créditos | Potencial crédito inicial GCP de USD 300; no reduce el costo bruto ni determina la decisión. |

### 2.2 Escenarios de workload

Los escenarios no son una proyección comercial. Sólo permiten comparar plataformas con entradas comunes hasta obtener métricas reales.

| Dimensión | Bajo | Esperado | Alto | Estado |
| --- | ---: | ---: | ---: | --- |
| Usuarios activos/mes | 500 | 2.000 | 10.000 | `SUPUESTO DE COMPARACIÓN` |
| Usuarios simultáneos | 5 | 25 | 100 | `SUPUESTO DE COMPARACIÓN` |
| Requests API/mes | 100.000 | 500.000 | 2.000.000 | `SUPUESTO DE COMPARACIÓN` |
| Solicitudes enviadas/mes | 100 | 500 | 2.500 | `SUPUESTO DE COMPARACIÓN` |
| Ejecuciones worker/mes | 100 | 500 | 2.500 | `SUPUESTO DE COMPARACIÓN` |
| Emails/mes | 300 | 1.500 | 7.500 | `SUPUESTO DE COMPARACIÓN`; proveedor de email fuera del costo cloud |
| Tamaño inicial PostgreSQL | 5 GB | 10 GB | 25 GB | `SUPUESTO DE COMPARACIÓN` |
| Crecimiento PostgreSQL/mes | 1 GB | 3 GB | 10 GB | `SUPUESTO DE COMPARACIÓN` |
| Conexiones de aplicación | 10 | 25 | 50 | `SUPUESTO DE COMPARACIÓN`; validar pooling |
| Archivos por solicitud | promedio 2; máximo 4 | promedio 2; máximo 4 | promedio 2; máximo 4 | Máximo confirmado; promedio supuesto |
| Tamaño promedio/máximo por archivo | 2 MB / 10 MB | 2 MB / 10 MB | 2 MB / 10 MB | `SUPUESTO DE COMPARACIÓN` |
| Storage nuevo/mes | 0,4 GB | 2 GB | 10 GB | Derivado de solicitudes y tamaño promedio |
| Logs y telemetría/mes | 2 GB | 10 GB | 50 GB | `SUPUESTO DE COMPARACIÓN`; sin payloads ni PII |

### 2.3 Continuidad provisional

| Dimensión | Baseline v0 | Estado |
| --- | --- | --- |
| Backup | Diario, automatizado | `SUPUESTO DE COMPARACIÓN` |
| Retención de backup | 14 días | `SUPUESTO DE COMPARACIÓN` |
| RPO | 24 horas | `PENDIENTE MAPS` |
| RTO | 8 horas laborables | `PENDIENTE MAPS` |
| Restore | Prueba obligatoria antes de producción | Principio estratégico; procedimiento por diseñar |
| Alta disponibilidad | Sin HA zonal en baseline de costo; cotizarla separadamente | `PENDIENTE MAPS`; trade-off explícito |
| Multi-región | Fuera de baseline | Sin driver confirmado |

El escenario esperado debe respetar el máximo de USD 200/mes. Si no lo hace, la alternativa no supera el gate económico salvo que se reduzca alcance operacional de forma explícita o MAPS cambie el presupuesto/requisito.

## 3. Estrategia de ambientes

| Ambiente | Política baseline | Motivo |
| --- | --- | --- |
| `production` | Runtime disponible según demanda y datos persistentes; activo de forma continua donde el servicio lo requiera. | Es el ambiente operativo. |
| `staging` | Datos sintéticos; runtime con scale-to-zero o activación programada; persistencia mínima o reconstruible. | Evitar pagar una copia completa 24x7 sin actividad continua. |
| `development` | Ejecución local por defecto; integración cloud compartida o efímera sólo cuando la prueba lo requiera. | Reducir costo y carga de gobierno. |
| Preview por PR | No incluido en v0. | Su aislamiento, datos, IAM y teardown añaden complejidad sin evidencia de necesidad. |

Los tres ambientes existen como límites de configuración, identidad y promoción. Eso no exige tres réplicas permanentes de toda la infraestructura.

## 4. Gates y criterios

### 4.1 Gates obligatorios

1. Escenario esperado dentro de USD 200/mes, sin contar créditos temporales.
2. Región candidata razonable para usuarios en Argentina y conjunto crítico disponible en esa región.
3. Runtime de contenedores para API y alternativa viable para worker/jobs.
4. PostgreSQL administrado candidato, sin aceptar todavía un producto.
5. Object storage privado con control de acceso y ciclo de vida.
6. Identidad de workload sin claves estáticas para runtime y CI/CD.
7. Backup y restore verificables.
8. Logs, métricas y alertas básicas sin PII innecesaria.
9. Separación de ambientes y reconstrucción mediante IaC viable.

### 4.2 Ponderación posterior a gates

| Criterio | Peso |
| --- | ---: |
| TCO para los tres escenarios | 30% |
| Carga operacional y aprendizaje | 25% |
| Seguridad e IAM | 15% |
| Encaje regional y disponibilidad conjunta | 15% |
| Reversibilidad y lock-in | 10% |
| Experiencia previa verificable | 5% |

La puntuación se aplicará sólo después de reunir evidencia. No se asignan puntos en este corte.

## 5. Arquitectura mínima equivalente

La tabla normaliza responsabilidades. No acepta productos y deja visibles los componentes adicionales que afectan costo u operación.

| Responsabilidad | GCP candidato | AWS candidato | Azure candidato | Validación pendiente |
| --- | --- | --- | --- | --- |
| Entrada HTTPS y API | Cloud Run service con ingreso gestionado | ECS/Fargate service; incluir ALB, VPC, subnets y security groups en costo/operación | Container Apps app con ingress | TLS, dominio, WAF/CDN no incluidos sin driver |
| Worker de larga duración | Cloud Run worker pool o service sin ingreso | ECS/Fargate service | Container Apps app sin ingreso | Confirmar si Delivery requiere poller permanente |
| Trabajo finito/programado | Cloud Run job | ECS task disparada/programada | Container Apps job | Definir trigger, reintentos e idempotencia |
| Registro de imágenes | Artifact Registry | ECR | Azure Container Registry | Retención y promoción de imágenes |
| PostgreSQL | Cloud SQL for PostgreSQL | RDS for PostgreSQL | Azure Database for PostgreSQL Flexible Server | Tier mínimo, conexiones, backup, stop/start y HA |
| Object storage | Cloud Storage | S3 | Blob Storage | Acceso privado, cifrado, lifecycle, egreso y borrado |
| Secrets | Secret Manager | Secrets Manager | Key Vault | Rotación, auditoría y costo por operaciones |
| Identidad runtime | Service account | IAM task role | Managed identity | Mínimo privilegio y separación por ambiente |
| CI/CD sin claves | Workload Identity Federation | GitHub OIDC / IAM role | GitHub OIDC / federated credential | Repositorios, approvals y promoción |
| Observabilidad | Cloud Logging/Monitoring | CloudWatch | Azure Monitor / Log Analytics | Retención, volumen, alertas y costo |
| IaC | Terraform | Terraform o CloudFormation; elegir una fuente | Terraform o Bicep; elegir una fuente | Cobertura, drift y teardown |

Para el worker se cotizarán dos patrones: proceso continuo y ejecución finita/event-driven. No deben mezclarse sus costos ni asumir que `scale-to-zero` satisface ambos.

## 6. Región candidata para comparación

La comparación primaria usa la geografía de São Paulo para reducir una variable entre proveedores:

| Plataforma | Región candidata | Evidencia inicial al 2026-10-07 | Estado |
| --- | --- | --- | --- |
| GCP | `southamerica-east1` — São Paulo | Cloud Run services/jobs, Cloud SQL PostgreSQL y Cloud Storage figuran disponibles. | Conjunto base documentalmente viable; falta cuota, pricing y prueba desde Argentina. |
| AWS | `sa-east-1` — São Paulo | ECS/Fargate y Amazon RDS figuran disponibles. | Conjunto base documentalmente viable; falta verificar cada servicio complementario, pricing y prueba. |
| Azure | `brazilsouth` — Brazil South | Container Apps y PostgreSQL Flexible Server figuran disponibles. | Conjunto base documentalmente viable; falta verificar modalidad/tier, pricing y prueba. |

Santiago/Chile permanece como alternativa secundaria donde exista el conjunto completo. No se elige región hasta medir latencia y revisar costo, residencia, cuotas y disponibilidad conjunta.

## 7. Costeo comparable

Cada estimación debe registrar configuración, región, precio unitario, cantidad, costo mensual, fecha y URL/export de calculadora.

### 7.1 Convenciones de la preestimación v0

Esta primera pasada sólo prueba el gate presupuestario del escenario **Esperado**. No es una cotización y todavía no puntúa alternativas.

| Entrada de cálculo | Valor v0 |
| --- | --- |
| Mes de referencia | 730 horas para recursos permanentes; precios on-demand en USD, sin impuestos ni soporte pago |
| API | 500.000 requests/mes y 400 ms de ejecución facturable por request como supuesto conservador; 1 vCPU/512 MiB bajo demanda en GCP/Azure y 0,25 vCPU/0,5 GB permanente en AWS |
| Worker finito | 500 ejecuciones/mes de 1 minuto; no se incluye un poller 24x7 |
| PostgreSQL productivo | 730 h/mes, Single-Zone/sin HA, 10 GB lógicos, backup diario y 14 días de retención |
| PostgreSQL staging | 160 h/mes de cómputo; almacenamiento persistente mínimo facturable |
| Almacenamiento DB facturado | GCP 10 GB; AWS 20 GiB mínimo `gp3`; Azure 32 GiB mínimo |
| Adjuntos | 2 GB nuevos/mes en object storage privado; operaciones y egreso bajos |
| Imágenes | 1 GB en registry privado con política de retención |
| Observabilidad | 10 GB/mes de logs; retención incluida básica; sin APM avanzado ni SIEM |
| Franquicias | Se aplican franquicias mensuales publicadas cuando corresponden; se muestran rangos si son compartidas por cuenta/suscripción |
| Créditos | No se aplican los USD 300 potenciales de GCP ni promociones temporales |

La equivalencia es funcional, no de capacidad exacta: los tiers mínimos no ofrecen la misma RAM, CPU ni SLA. En particular, `db-g1-small` de Cloud SQL no está cubierto por el SLA de Cloud SQL, por lo que se muestra sólo como sensibilidad económica y no como candidato productivo equivalente.

### 7.2 Preestimación del escenario Esperado

Valores redondeados a USD/mes. Los rangos cubren consumo bajo de operaciones/red y franquicias compartidas; no cubren un cambio de arquitectura.

| Componente | GCP `southamerica-east1` | AWS `sa-east-1` | Azure `brazilsouth` |
| --- | ---: | ---: | ---: |
| Runtime API | 0–2 | 15,48 | 0–2 |
| Worker/jobs finitos | 0–1 | 0,18 | 0–1 |
| PostgreSQL productivo + storage + backup | 77,75 | 54,75 | 32,54 |
| Object storage + operaciones | 0–1 | 0–1 | 0–1 |
| Egreso/red/balanceo | 0–2 | 24,82–32,85 | 0–2 |
| Registry + secrets | 0–1 | 1–2 | 5–6 |
| Logs/métricas/alertas | 0 | 4,50–9 | 23–46 |
| Staging/dev cloud | 6–7 | 19–21 | 12–13 |
| **Total bruto preestimado** | **85–90** | **120–135** | **73–100** |
| Holgura contra tope USD 200 | 110–115 | 65–80 | 100–127 |
| Créditos/descuentos temporales | USD 300 potenciales, excluidos | Excluidos | Excluidos |

#### Lectura por plataforma

- **GCP:** usa para producción una forma dedicada de Cloud SQL de 1 vCPU y 3,75 GiB (aprox. USD 74 de cómputo), no el shared-core económico. Cloud Run y 10 GB de logs permanecen dentro de las franquicias mensuales publicadas bajo este workload. Como sensibilidad, `db-g1-small` reduciría el total a aproximadamente USD 50–55, pero no tiene SLA de Cloud SQL y exige una justificación de riesgo explícita.
- **AWS:** usa una tarea Fargate de 0,25 vCPU/0,5 GB activa 730 horas, RDS `db.t4g.small` Single-AZ y 20 GiB `gp3`. El ALB representa al menos USD 24,82/mes más LCU; staging agrega otra ventana de ALB, Fargate y RDS. Una topología que cree y destruya staging mediante IaC puede reducir costo, pero aumenta tiempo y complejidad operativa.
- **Azure:** usa Container Apps consumption, PostgreSQL Flexible Server `B1ms` y el mínimo de 32 GiB. El rango depende principalmente de Log Analytics: en Brazil South la ingestión observada es USD 4,60/GB y la franquicia de 5 GB/mes es compartida por cuenta; 10 GB cuestan USD 23 si está disponible o hasta USD 46 si ya fue consumida. ACR Basic agrega cerca de USD 5,07/mes.

### 7.3 Precios unitarios que sostienen el cálculo

| Plataforma | Unidad relevante observada al 2026-10-07 |
| --- | --- |
| GCP | Cloud SQL São Paulo: CPU dedicada USD 0,062/vCPU-h, memoria USD 0,0105/GiB-h; `db-g1-small` USD 0,0525/h; SSD USD 0,000349315/GiB-h; backup usado USD 0,000164384/GiB-h. Cloud Run: USD 0,000024/vCPU-s, USD 0,0000025/GiB-s y USD 0,40/millón de requests, con franquicia mensual publicada. Cloud Logging incluye 50 GiB/proyecto/mes. |
| AWS | Fargate São Paulo x86: USD 0,0696/vCPU-h y USD 0,0076/GB-h. RDS PostgreSQL: `db.t4g.micro` USD 0,034/h, `db.t4g.small` USD 0,069/h y `gp3` USD 0,219/GB-mes. ALB USD 0,034/h + USD 0,011/LCU-h. CloudWatch Logs Standard USD 0,90/GB en São Paulo, con 5 GB de franquicia mensual compartida. |
| Azure | PostgreSQL Flexible Server Brazil South: `B1ms` USD 0,035/h, storage USD 0,2185/GiB-mes y backup excedente LRS USD 0,095/GB-mes; hasta 100% del storage provisionado tiene backup incluido. ACR Basic USD 0,1666/día. Container Apps consumption publica franquicia mensual; Log Analytics Analytics Logs USD 4,60/GB y 5 GB/mes de franquicia compartida. |

### 7.4 Alcance y sensibilidad aún abiertos

- Recalcular Bajo y Alto después de exportar o capturar las tres calculadoras con la misma fecha de corte.
- Cotizar HA zonal por separado; no inferir que el costo sin HA satisface el RPO/RTO pendiente.
- Validar SLA, capacidad, conexiones y comportamiento de CPU burstable de cada tier mediante documentación y spike sintético.
- Verificar el ciclo real de stop/start de cada PostgreSQL administrado: las 160 h de staging requieren automatización o reconstrucción si el proveedor fuerza reinicios periódicos.
- Medir latencia desde Argentina; la presencia en São Paulo no demuestra experiencia equivalente para usuarios reales.
- Agregar transferencia a Internet cuando exista una estimación de descargas; hoy no hay volumen confirmado.
- Verificar si las franquicias de cuenta/proyecto están disponibles en la organización real. Si otro workload las consume, debe usarse el extremo superior del rango.
- Excluir por ahora dominio/DNS, proveedor de email, WAF/CDN, SIEM, soporte pago, impuestos, tipo de cambio y trabajo humano. Deben registrarse antes de cerrar TCO.

Una alternativa supera por ahora únicamente el **gate aritmético preliminar** si su rango esperado queda bajo USD 200. Esto no prueba suficiencia técnica, SLA, madurez operativa ni conveniencia global.

## 8. Evidencia operacional GCP pendiente

El acceso al staging de MAPS-Landingpage debe relevar, sin cambiar recursos:

- proyecto, región y servicios realmente creados;
- configuración efectiva de runtime, DB, storage, jobs e identidades;
- períodos activos y costo histórico bruto;
- despliegues, errores, incidentes y tiempo humano;
- backups configurados y evidencia de restore, si existe;
- permisos, secretos, red y observabilidad;
- recursos documentados pero nunca desplegados.

La evidencia se registrará como `VERIFICADO`, `DOCUMENTADO NO VERIFICADO` o `NO DISPONIBLE`. No se copiarán datos personales, secretos ni contenido de buckets.

## 9. Pendientes de MAPS

- Confirmar volumen real o un rango comercial esperado.
- Confirmar RPO/RTO y tolerancia a indisponibilidad.
- Confirmar retención y eliminación de adjuntos y solicitudes.
- Confirmar si existe requisito de residencia de datos.
- Confirmar si staging necesita disponibilidad continua.
- Validar presupuesto y tratamiento de impuestos/moneda.

## 10. Fuentes oficiales del corte

- GCP: [regiones Cloud Run](https://cloud.google.com/run/docs/locations), [regiones Cloud SQL PostgreSQL](https://docs.cloud.google.com/sql/docs/postgres/region-availability-overview), [ubicaciones Cloud Storage](https://docs.cloud.google.com/storage/docs/locations), [pricing Cloud SQL](https://cloud.google.com/sql/pricing), [pricing Cloud Run](https://cloud.google.com/run/pricing), [pricing Cloud Logging](https://cloud.google.com/logging#pricing) y [Pricing Calculator](https://cloud.google.com/products/calculator).
- AWS: [regiones ECS/Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate-Regions.html), [regiones Amazon RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RegionsAndAvailabilityZones.html), [pricing Fargate](https://aws.amazon.com/fargate/pricing/), [pricing RDS PostgreSQL](https://aws.amazon.com/rds/postgresql/pricing/), [pricing CloudWatch](https://aws.amazon.com/cloudwatch/pricing/), [pricing ECR](https://aws.amazon.com/ecr/pricing/) y [Pricing Calculator](https://calculator.aws/). Los valores regionales se verificaron además en el catálogo público de precios de AWS.
- Azure: [Container Apps y facturación](https://learn.microsoft.com/en-us/azure/container-apps/billing), [PostgreSQL Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/overview), [storage PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/compute-storage/concepts-storage), [backup PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-backup-restore), [costos Log Analytics](https://learn.microsoft.com/en-us/azure/log-analytics/log-analytics-manage-cost-storage), [regiones Azure](https://learn.microsoft.com/en-us/azure/reliability/regions-list), [API pública Retail Prices](https://prices.azure.com/api/retail/prices) y [Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/).

## 11. Control de cambios de la baseline

Esta es la baseline `v0`, congelada el 2026-10-07. Una corrección de fuente puede editarse dejando constancia en Git. Un cambio de workload, presupuesto, continuidad o alcance crea `v1` con fecha, motivo y efecto sobre estimaciones; no se sobrescriben silenciosamente supuestos usados para una comparación previa.
