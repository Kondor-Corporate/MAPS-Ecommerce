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
- Mantener `TCO` como concepto general: costo monetario directo, esfuerzo humano, complejidad, incidentes, riesgo y salida. Para un scoring futuro, separar esos componentes en criterios no superpuestos.
- No premiar cantidad de servicios ni familiaridad sin evidencia operacional.
- No desplegar recursos para esta etapa documental. Cualquier spike posterior tendrá alcance, presupuesto, teardown y datos sintéticos explícitos.
- Registrar fuente y fecha de cada precio o disponibilidad regional; una lista de regiones no prueba disponibilidad conjunta ni cuota efectiva en una cuenta.

## 2. Baseline congelada v1

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
| Connection budget anterior | 10 | 25 | 50 | `REEMPLAZADO EN v1`: no se relacionaba con instancias ni pool |
| Archivos por solicitud | promedio 2; máximo 4 | promedio 2; máximo 4 | promedio 2; máximo 4 | Máximo confirmado; promedio supuesto |
| Tamaño promedio/máximo por archivo | 2 MB / 10 MB | 2 MB / 10 MB | 2 MB / 10 MB | `SUPUESTO DE COMPARACIÓN` |
| Storage nuevo/mes | 0,4 GB | 2 GB | 10 GB | Derivado de solicitudes y tamaño promedio |
| Logs y telemetría/mes | 2 GB | 10 GB | 50 GB | `SUPUESTO DE COMPARACIÓN`; sin payloads ni PII |

### 2.3 Perfil temporal y presupuesto de conexiones v1

Requests mensuales distribuidas uniformemente producen medias muy bajas y no representan el tráfico interactivo. Los picos siguientes son `SUPUESTO DE COMPARACIÓN`, no una previsión comercial.

| Dimensión | Bajo | Esperado | Alto |
| --- | ---: | ---: | ---: |
| Requests promedio/segundo | 0,039 | 0,193 | 0,772 |
| Pico sostenido | 2 RPS × 5 min | 10 RPS × 15 min | 40 RPS × 30 min |
| Burst sintético | 5 RPS × 60 s | 25 RPS × 120 s | 100 RPS × 300 s |
| Duración HTTP p50 asumida | 250 ms | 250 ms | 250 ms |
| Duración HTTP p95 asumida | 800 ms | 800 ms | 800 ms |
| Máximo runtime instances | 2 | 4 | 10 |
| Pool máximo por instancia | 4 | 4 | 4 |
| Connection budget de aplicación | 8 | 16 | 40 |
| Margen operacional/administrativo MAPS | 20 | 20 | 20 |
| Demanda total de contraste | 28 | 36 | 60 |

La restricción que debe cumplir cualquier diseño posterior es:

```text
(max_runtime_instances × pool_size) + reserved_connections
< safe_database_connection_capacity
```

El budget no equivale a usuarios simultáneos. Azure documenta 50 conexiones máximas y 35 conexiones de usuario para `B1ms`, y 429/414 respectivamente para `B2s`. La diferencia de 15 ya está reservada por Azure para replicación física y monitoreo; por eso no se vuelve a sumar como reserva MAPS. Nuestro margen adicional protege conexiones administrativas, migraciones, health checks, jobs, despliegues solapados y variación del pool.

Sensibilidad Esperado (`max_instances = 4`, `pool_size = 4`, conexiones de aplicación = 16):

| Margen MAPS | Demanda de conexiones de usuario | B1ms: capacidad publicada 35 | B2s: capacidad publicada 414 | Interpretación |
| ---: | ---: | --- | --- | --- |
| 5 | 21 | Dentro del límite | Dentro del límite | B1ms es posible por conexiones, todavía sujeto a CPU/RAM y benchmark. |
| 10 | 26 | Dentro del límite | Dentro del límite | B1ms conserva 9 slots; sigue siendo una hipótesis de capacidad. |
| 20 | 36 | Fuera del límite conservador | Dentro del límite | B2s es necesario sólo si se exige este margen antes del benchmark. |

Conclusión metodológica: el salto `B1ms → B2s` no está probado como técnicamente necesario por carga; es la variante **conservadora** de la baseline mientras el margen MAPS permanezca en 20. `B1ms` queda como sensibilidad provisional, no como tier validado. AWS calcula `max_connections` desde memoria y GCP lo gestiona según memoria/configuración; sus capacidades efectivas también se deben leer y probar.

### 2.4 Continuidad provisional

| Dimensión | Baseline v1 | Estado |
| --- | --- | --- |
| Backup | Diario, automatizado | `SUPUESTO DE COMPARACIÓN` |
| Retención de backup | 14 días | `SUPUESTO DE COMPARACIÓN` |
| RPO | No definido por MAPS | `PENDIENTE MAPS` |
| RTO | No definido por MAPS | `PENDIENTE MAPS` |
| Restore | Prueba obligatoria antes de producción | Principio estratégico; procedimiento por diseñar |
| Alta disponibilidad | Sin HA zonal en baseline de costo; cotizarla separadamente | `PENDIENTE MAPS`; trade-off explícito |
| Multi-región | Fuera de baseline | Sin driver confirmado |

El backup diario no implica que MAPS haya aceptado un RPO de 24 horas. Del mismo modo, `restore_elapsed_time` del spike mide el tiempo técnico del mecanismo candidato y no equivale a un RTO MAPS. RPO y RTO sólo podrán convertirse en constraints arquitectónicos cuando MAPS los defina explícitamente; hasta entonces tampoco determinan la sensibilidad HA ni el costeo principal.

La definición preparada para el gate económico usa el máximo mensual del escenario Esperado durante Año 1. Todavía no se aplica ni elimina alternativas en este corte.

## 3. Estrategia de ambientes

| Ambiente | Política baseline | Motivo |
| --- | --- | --- |
| `production` | Runtime disponible según demanda y datos persistentes; activo de forma continua donde el servicio lo requiera. | Es el ambiente operativo. |
| `staging` | Datos sintéticos; runtime con scale-to-zero o activación programada; persistencia mínima o reconstruible. | Evitar pagar una copia completa 24x7 sin actividad continua. |
| `development` | Ejecución local por defecto; integración cloud compartida o efímera sólo cuando la prueba lo requiera. | Reducir costo y carga de gobierno. |
| Preview por PR | No incluido en v1. | Su aislamiento, datos, IAM y teardown añaden complejidad sin evidencia de necesidad. |

Los tres ambientes existen como límites de configuración, identidad y promoción. Eso no exige tres réplicas permanentes de toda la infraestructura.

## 4. Gates y criterios

### 4.1 Gates obligatorios

1. Máximo costo mensual modelado del escenario Esperado durante Año 1 menor o igual a USD 200 bajo baseline list-price.
2. Región candidata razonable para usuarios en Argentina y conjunto crítico disponible en esa región.
3. Runtime de contenedores para API y alternativa viable para worker/jobs.
4. PostgreSQL administrado candidato, sin aceptar todavía un producto.
5. Object storage privado con control de acceso y ciclo de vida.
6. Identidad de workload sin claves estáticas para runtime y CI/CD.
7. Backup y restore verificables.
8. Logs, métricas y alertas básicas sin PII innecesaria.
9. Separación de ambientes y reconstrucción mediante IaC viable.

Definición formal preparada, **no aplicada**:

```text
economic_gate_value = max(month_1 ... month_12)
economic_gate_condition = economic_gate_value <= USD 200
```

La evaluación usa list-price bruto. Créditos, promociones y la sensibilidad optimista `net-of-allowance` no pueden utilizarse para superar el gate. El script expone `MaxMonthlyYear1USD` y `MonthOfMaxCost` para cada proveedor y escenario.

### 4.2 Ponderación posterior a gates

Problema detectado: usar `TCO` como criterio de 30% y volver a puntuar operación/aprendizaje en 25% puede contar dos veces horas humanas, complejidad y mantenimiento. La redefinición propuesta preserva los pesos, pero separa las bases de medición:

| Criterio | Peso |
| --- | ---: |
| Cloud spend / costo monetario para los tres escenarios | 30% |
| Carga operacional y aprendizaje | 25% |
| Seguridad e IAM | 15% |
| Encaje regional y disponibilidad conjunta | 15% |
| Reversibilidad y lock-in | 10% |
| Experiencia previa verificable | 5% |

La puntuación se aplicará sólo después de reunir evidencia. No se asignan puntos en este corte.

- **Cloud spend / costo monetario — 30%:** únicamente gasto directo de plataforma dentro del horizonte: runtime, DB, storage, networking, logs, backups, staging y servicios necesarios. Excluye horas humanas, experiencia del equipo y costo de salida/migración.
- **Carga operacional y aprendizaje — 25%:** complejidad estructural y operativa de la solución: componentes, automatización requerida, mantenimiento, troubleshooting, procedimientos y carga diaria. Excluye experiencia histórica del equipo y factura cloud.
- **Seguridad e IAM — 15%:** mínimo privilegio, identidades temporales, separación de ambientes, auditabilidad, rotación y superficie de exposición. No vuelve a puntuar cantidad general de componentes salvo su efecto de seguridad.
- **Encaje regional y disponibilidad conjunta — 15%:** latencia observada desde Argentina, disponibilidad conjunta de los servicios necesarios, cuotas y características regionales. No incorpora precio ni familiaridad.
- **Reversibilidad y lock-in — 10%:** acoplamientos específicos, reconstrucción en otro proveedor, migración de datos, IAM, observabilidad e infraestructura. Un costo de salida monetizado se muestra como evidencia o sensibilidad de este criterio, nunca se suma otra vez a Cloud spend.
- **Experiencia previa verificable — 5%:** exclusivamente recursos realmente desplegados, operación efectuada, incidentes gestionados, deploys, tiempo de uso y conocimiento demostrable del equipo. No se vuelve a contabilizar dentro de carga operacional.
- **TCO:** permanece como lectura integral para discusión y riesgos, pero no será el nombre del criterio numérico de 30%.

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

### 5.1 Public entry architecture sensitivity

La entrada usada por `ADR-CLD-000` es el mínimo público necesario para comparar responsabilidades del TARGET. No decide frontend hosting, same-origin, dominio personalizado, path routing, CDN, load balancer/edge ni exposición pública o privada del backend, que corresponden al futuro `ADR-CLD-001`.

No se agregan esos costos en esta baseline. Si `ADR-CLD-001` introduce runtime de frontend, balanceadores, CDN, routing, WAF, endpoints privados u otros componentes, puede alterar el costo monetario y la carga operacional de GCP/AWS/Azure. El TCO de plataforma deberá recalcularse antes de considerarse definitivo; esta dependencia no acepta todavía ninguna arquitectura de entrada.

## 6. Región candidata para comparación

La comparación primaria usa la geografía de São Paulo para reducir una variable entre proveedores:

| Plataforma | Región candidata | Evidencia inicial al 2026-10-07 | Estado |
| --- | --- | --- | --- |
| GCP | `southamerica-east1` — São Paulo | Cloud Run services/jobs, Cloud SQL PostgreSQL y Cloud Storage figuran disponibles. | Conjunto base documentalmente viable; falta cuota, pricing y prueba desde Argentina. |
| AWS | `sa-east-1` — São Paulo | ECS/Fargate y Amazon RDS figuran disponibles. | Conjunto base documentalmente viable; falta verificar cada servicio complementario, pricing y prueba. |
| Azure | `brazilsouth` — Brazil South | Container Apps y PostgreSQL Flexible Server figuran disponibles. | Conjunto base documentalmente viable; falta verificar modalidad/tier, pricing y prueba. |

Santiago/Chile permanece como alternativa secundaria donde exista el conjunto completo. No se elige región hasta medir latencia y revisar costo, residencia, cuotas y disponibilidad conjunta.

## 7. Costeo comparable

El modelo congelado se reproduce con [COST-MODEL-CLD-000.ps1](./COST-MODEL-CLD-000.ps1). Usa precios on-demand/list price, sin impuestos, soporte pago, compromisos, créditos ni franquicias compartidas. Esta sigue siendo la vista principal. Una sensibilidad separada descuenta sólo franquicias permanentes publicadas suponiendo que están completamente disponibles para MAPS; no usa créditos promocionales.

### 7.1 Modelo v1 y horizonte

| Categoría | Regla congelada | Tipo |
| --- | --- | --- |
| Mes | 730 horas para recursos permanentes | `SUPUESTO` |
| Dataset DB | `inicial + crecimiento × (mes - 1)` en GB decimales | `SUPUESTO` |
| Conversión | `GiB = GB × 1.000.000.000 / 1.073.741.824` | `CÁLCULO` |
| Headroom | DB lógica no debe superar 70% del storage provisionado | `SUPUESTO`; 30% libre para crecimiento/WAL/operación |
| Storage requerido | `ceil(dataset_GiB / 0,70)` | `CÁLCULO` |
| Storage facturado | máximo entre requerido y mínimo/escalón del proveedor | `CÁLCULO` |
| Backup | GCP: footprint v1 igual al dataset lógico; AWS/Azure: sin excedente mientras no supere storage provisionado incluido | `SUPUESTO` sujeto a WAL real |
| Object storage | acumulación lineal del crecimiento mensual; dos objetos por solicitud | `SUPUESTO` |
| Egreso a Internet | USD 0 en total base porque no hay descargas confirmadas | `PENDIENTE MAPS`; componente visible, no afirmación de gratuidad |
| Logs | flujo mensual, sin acumulación más allá de la retención incluida | `SUPUESTO` |
| Franquicias | no descontadas del total base porque se comparten por billing account/cuenta/subscripción | `SUPUESTO conservador` |
| Gate económico | `max(month_1 ... month_12)` del escenario Esperado list-price | `DEFINICIÓN PREPARADA`; no aplicada |

Los GB funcionales no se tratan como GiB de billing. GCP y AWS admiten crecimiento granular en el modelo; Azure Premium SSD se redondea al siguiente escalón `32/64/128/256... GiB` documentado. El storage sólo crece: una reducción posterior requeriría recreación/migración y no se presume.

#### Inputs de runtime congelados v1.2

Estos inputs son `SUPUESTO DE COSTEO`; describen la carga económica ejecutada por el script, no capacidad validada ni productos aceptados.

| Proveedor | Modalidad modelada | API CPU / memoria | Ejecución API productiva | Duración por request usada para costo | Job modelado | Scaling/minimum asumido |
| --- | --- | --- | --- | ---: | --- | --- |
| GCP | Cloud Run request-based | 1 vCPU / 0,5 GiB | CPU/memoria facturadas durante requests | 0,4 s | 1 vCPU / 0,5 GiB durante 60 s por ejecución | `min instances = 0`; scale-to-zero; sin idle productivo facturado |
| AWS | ECS/Fargate | 0,25 vCPU / 0,5 GB | Una task API permanente, 730 h/mes | No modifica el costo de la task API 24x7 | 0,25 vCPU / 0,5 GB durante 60 s por ejecución | `desired count = 1` para API productiva; jobs finitos separados |
| Azure | Container Apps Consumption | 0,25 vCPU / 0,5 GiB | CPU/memoria activas durante requests | 0,4 s | 0,25 vCPU / 0,5 GiB durante 60 s por ejecución | `min replicas = 0`; scale-to-zero; sin idle productivo facturado |

Los `0,4 s` de GCP/Azure son una duración facturable promedio supuesta exclusivamente para `COST-MODEL-CLD-000.ps1`. No son la media observada de MAPS. Los valores p50 = 250 ms y p95 = 800 ms de la sección 2.3 pertenecen al perfil/protocolo de performance y no se usan como sustitutos de esos `0,4 s` en el costeo. El spike autorizado deberá medir duración activa/facturable real y reemplazar el supuesto sólo mediante una nueva baseline trazable.

La revisión script ↔ Evidence también confirmó como visibles: 730 h/mes, conversión GB/GiB, 30% de headroom DB, dos objetos por solicitud, egress base en USD 0 pendiente, crecimiento/logs de cada escenario, mínimos y escalones DB, bundle de registry/secrets, topología y networking AWS, staging y allowances. Los precios unitarios permanecen centralizados en “Snapshot de precios” y no se duplican aquí.

### 7.2 Registro de correcciones: Antes → Después

| Elemento | Antes v0 | Después v1 | Motivo e impacto Esperado Mes 1 |
| --- | --- | --- | --- |
| Azure Container Apps | `1 vCPU / 512 MiB` | `0,25 vCPU / 0,5 GiB` | El par anterior no es válido; Azure Consumption exige relación 1:2. Runtime list price queda USD 1,70 más USD 0,23 de jobs. |
| Azure PostgreSQL Esperado | `B1ms`, USD 25,55 compute | `B2s`, USD 102,20 compute | La demanda conservadora v1 es 36 frente a 35 conexiones de usuario; con margen MAPS 5/10, B1ms vuelve a ser candidato provisional. Impacto B2s: **+USD 76,65/mes** hasta benchmark/pool definitivo. |
| DB storage Esperado | 10 GB lógicos facturados casi literalmente | 10 GB = 9,313 GiB; 14 GiB requeridos con headroom; mínimos GCP 14, AWS 20, Azure 32 | GCP **+USD 1,02**; AWS/Azure sin cambio Mes 1 por mínimos. |
| Horizonte | Sólo un mes inicial | Mes 1, Mes 12 y suma de meses 1–12 | Expone crecimiento DB/object storage y escalones Azure. |
| Franquicias | Aplicadas o expresadas como rango | Excluidas del total base; inventariadas como reducción potencial | Sube runtime/logs, pero elimina dependencia de consumo de otras cargas. |
| AWS networking | ALB USD 24,82–32,85; resto implícito | ALB USD 24,82 + 0,1 LCU USD 0,80 + 2 IPv4 ALB USD 7,30 + 1 IPv4 task USD 3,65 | Networking fijo v1: **USD 36,57/mes**; NAT/endpoints no ocultos, pero no usados en referencia. |
| Staging | GCP 6–7; AWS 19–21; Azure 12–13 | GCP 14,94; AWS 22,94; Azure 17,29 | Agrega configuración, logs, IPv4 y mecanismo operativo explícito; GCP factura la IPv4 durante 570 h detenido. |
| Total Esperado | GCP 85–90; AWS 120–135; Azure 73–100 | GCP **104,99**; AWS **140,30**; Azure **179,56** | Los tres quedan bajo USD 200 en Mes 1; esto no aplica el gate, que usa el máximo M1–M12. |

### 7.3 Topología AWS de referencia

```text
Internet
  → ALB público (2 subnets públicas / 2 AZ, TLS)
  → Security Group: sólo ALB → puerto de la task
  → ECS/Fargate task en subnet pública, public IPv4, sin SSH
  → RDS PostgreSQL en subnets privadas, sin IP pública

Fargate → Internet Gateway → ECR / Secrets Manager / CloudWatch
Fargate → S3 Gateway Endpoint (sin cargo) → S3 privado
Fargate → Security Group privado → RDS
```

Se elige como referencia **A: tasks con public IP y Security Groups**, no por ser la opción más barata sino porque es proporcional al TARGET PyME y evita un NAT Gateway o varios endpoints de interfaz permanentes. La task tiene IP pública para salida, pero no acepta ingreso directo: el security group sólo permite tráfico desde el security group del ALB; RDS y S3 permanecen privados, no hay SSH y la identidad se obtiene mediante task role.

| Opción | Superficie y operación | Costo fijo relevante | Resultado metodológico |
| --- | --- | --- | --- |
| A. Public task IP + SG | IP pública por task; egress directo; reglas y task role obligatorios | USD 3,65/IP-mes + ALB/IPv4 | **Referencia v1**; validar riesgo en revisión de seguridad. |
| B. Private subnets + NAT Gateway | Tasks sin IP pública; salida centralizada; NAT por AZ para tolerancia zonal | NAT-hora, GB procesado e IPv4; material para este presupuesto | Sensibilidad pendiente de export regional; no incluido. |
| C. Private subnets + endpoints | ECR API/DKR, Logs y Secrets requieren endpoints de interfaz por AZ; S3 usa gateway endpoint gratuito | Cada interfaz en São Paulo: USD 0,021/h/AZ + USD 0,01/GB | Puede superar a A con pocos workloads; sensibilidad pendiente. |
| D. IPv6/dualstack sin IPv4 por task | Reduce IPv4, exige soporte extremo a extremo y validación de dependencias | Menor IPv4; mayor incertidumbre actual | Candidato futuro, no referencia sin spike. |

El modelo incluye un task productivo 24x7 de 0,25 vCPU/0,5 GB, ALB 24x7, 0,1 LCU promedio como supuesto, tres IPv4 públicas y un S3 Gateway Endpoint sin cargo. No incluye NAT Gateway ni endpoints de interfaz porque no son necesarios para esta topología; tampoco afirma que A superará la revisión de seguridad.

### 7.4 Staging reproducible

Staging está disponible 8 horas × 20 días = 160 h/mes, usa datos sintéticos y automatización. Development es local y no agrega una cuarta copia persistente.

| Plataforma | Servicio/SKU | Región | Horas/cantidad | Costo unitario | USD/mes |
| --- | --- | --- | ---: | ---: | ---: |
| GCP | Cloud SQL `db-f1-micro` | `southamerica-east1` | 160 h | 0,0158/h | 2,53 |
| GCP | SSD 10 GiB + backup lógico 5 GB | idem | mes completo | 0,255/GiB-mes + 0,12/GiB-mes backup usado | 3,11 |
| GCP | Cloud Run/API/jobs de prueba | idem | 20k req + 20 jobs | tarifas list price | 0,24 |
| GCP | Logging + objetos/ops | idem | 1 GB + bajo uso | 0,50/GB + operaciones | 0,51 |
| GCP | IPv4 Cloud SQL detenida | idem | 570 h | 0,015/h | 8,55 |
| GCP | **Total staging** |  |  |  | **14,94** |
| AWS | RDS `db.t4g.micro` + 20 GiB gp3 | `sa-east-1` | 160 h compute; storage mes completo | 0,034/h + 0,219/GiB-mes | 9,82 |
| AWS | Fargate 0,25 vCPU/0,5 GB | idem | 160 h | 0,0212/h | 3,39 |
| AWS | ALB + 0,1 LCU + 3 IPv4 | idem | 160 h | tarifas regionales | 7,22 |
| AWS | CloudWatch + secrets/objetos | idem | 1 GB + bajo uso | 0,90/GB + operaciones | 2,51 |
| AWS | **Total staging** |  |  |  | **22,94** |
| Azure | PostgreSQL `B1ms` + 32 GiB | `brazilsouth` | 160 h compute; storage mes completo | 0,035/h + 0,2185/GiB-mes | 12,59 |
| Azure | Container Apps API/jobs | idem | 20k req + 20 jobs | tarifas consumption | 0,08 |
| Azure | Log Analytics + Key Vault/Blob | idem | 1 GB + bajo uso | 4,60/GB + operaciones | 4,62 |
| Azure | **Total staging** |  |  |  | **17,29** |

Implementación operacional v1:

- **GCP:** start/stop programado de Cloud SQL; Google documenta que queda detenido hasta inicio manual. Storage e IPv4 continúan facturando y están incluidos. Cloud Run escala a cero.
- **AWS:** EventBridge/automatización inicia y detiene RDS cada jornada; RDS reinicia automáticamente tras siete días, por lo que no sirve dejarlo parado indefinidamente. ECS queda en desired count 0. El ALB de staging se crea/destruye con IaC durante la ventana; si queda 730 h, staging sube aproximadamente USD 25/mes. Esta automatización y el endpoint resultante deben probarse.
- **Azure:** Automation Task inicia/detiene Flexible Server cada jornada; Azure lo reinicia automáticamente tras siete días, por lo que la tarea debe re-detenerlo. Container Apps escala a cero.

Destruir/recrear DB con IaC permanece como alternativa para staging totalmente reconstruible, pero no se mezcla en el total v1: podría bajar storage y subir tiempo operativo/tiempo de recuperación.

### 7.5 Snapshot de precios v1

| Plataforma | Precios principales consultados el 2026-10-07 |
| --- | --- |
| GCP | Cloud SQL São Paulo: USD 0,062/vCPU-h + 0,0105/GiB-h; SSD aprox. 0,255/GiB-mes; backup usado aprox. 0,12/GiB-mes. Cloud Run request-based: 0,000024/vCPU-s, 0,0000025/GiB-s, 0,40/millón requests. Cloud Logging: 0,50/GiB. Cloud Storage Standard São Paulo: 0,035/GiB-mes usado en el modelo. |
| AWS | Fargate: 0,0696/vCPU-h + 0,0076/GB-h. RDS Single-AZ: `t4g.micro` 0,034/h, `small` 0,069/h, `medium` 0,137/h; Multi-AZ `small` 0,137/h. gp3: 0,219/GiB-mes Single-AZ, 0,438 Multi-AZ. ALB 0,034/h + 0,011/LCU-h. IPv4 0,005/IP-h. S3 Standard 0,0405/GB-mes. CloudWatch Logs 0,90/GB. |
| Azure | Container Apps: 0,000024/vCPU-s activo, 0,000003/GiB-s y 0,40/millón requests. PostgreSQL: `B1ms` 0,035/h, `B2s` 0,14/h; General Purpose 0,12/vCore-h; storage 0,2185/GiB-mes; backup excedente 0,095/GB-mes. ACR Basic 0,1666/día. Blob Hot LRS 0,0326/GB-mes. Log Analytics 4,60/GB. |

Las franquicias publicadas —por ejemplo Cloud Logging 50 GiB/proyecto, CloudWatch 5 GB/cuenta y Log Analytics 5 GB/billing account— no se descuentan en el total v1. Si están libres en las cuentas reales, se calculará una vista `net-of-allowance` separada sin alterar el list-price base.

### 7.6 Escenario Esperado recalculado

| Categoría | GCP M1 | GCP M12 | AWS M1 | AWS M12 | Azure M1 | Azure M12 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Runtime API | 5,25 | 5,25 | 15,48 | 15,48 | 1,70 | 1,70 |
| Jobs | 0,76 | 0,76 | 0,18 | 0,18 | 0,23 | 0,23 |
| DB compute | 74,00 | 74,00 | 50,37 | 50,37 | 102,20 | 102,20 |
| DB storage | 3,57 | 14,79 | 4,38 | 12,70 | 6,99 | 13,98 |
| DB backup excedente/modelado | 1,12 | 4,81 | 0 | 0 | 0 | 0 |
| Object storage + ops | 0,07 | 0,79 | 0,09 | 0,98 | 0,07 | 0,79 |
| Networking/ingress fijo | 0 | 0 | 36,57 | 36,57 | 0 | 0 |
| Registry + secrets | 0,28 | 0,28 | 1,30 | 1,30 | 5,08 | 5,08 |
| Observabilidad | 5,00 | 5,00 | 9,00 | 9,00 | 46,00 | 46,00 |
| Staging | 14,94 | 14,94 | 22,94 | 22,94 | 17,29 | 17,29 |
| **Total USD/mes** | **104,99** | **120,61** | **140,30** | **149,52** | **179,56** | **187,27** |
| **Acumulado Año 1** | **1.353,62** |  | **1.732,80** |  | **2.207,96** |  |

Composición Mes 1: GCP concentra 80% aproximadamente en DB; AWS combina DB, networking y staging; Azure queda dominado por DB `B2s` y Log Analytics. Esta composición importa más que una diferencia puntual del total porque muestra qué variable exige benchmark u optimización.

### 7.7 Sensibilidad Azure: B1ms provisional versus B2s conservador

Esta sensibilidad modifica sólo el compute de PostgreSQL Esperado; conserva storage, runtime, logs, staging y el resto del modelo.

| Variante Azure Esperado | Margen MAPS asumido | Mes 1 list-price | Mes 12 list-price | Diferencia mensual | Estado |
| --- | ---: | ---: | ---: | ---: | --- |
| `B1ms` provisional | 5 o 10 | 102,91 | 110,62 | −76,65 frente a B2s | Conexiones dentro del límite publicado; CPU/RAM y comportamiento sin validar. |
| `B2s` conservador | 20 | 179,56 | 187,27 | baseline | Conserva el margen de 20; tampoco está validado por benchmark. |

No se reemplaza la baseline principal: `B2s` continúa en el total v1 por prudencia. El benchmark de conexiones concurrentes, CPU/RAM, pool, jobs y despliegues solapados determinará si el margen MAPS puede reducirse y si `B1ms` es realmente suficiente.

### 7.8 Sensibilidad net-of-allowance

La vista `allowance unavailable` es el list-price principal: asume que otros workloads consumieron toda franquicia compartida. La vista `allowance available` supone que las franquicias permanentes publicadas están completamente disponibles para MAPS y se aplican una sola vez al consumo combinado de production más el uso incluido dentro de staging.

| Plataforma | Mes | List-price | Net-of-allowance | Diferencia |
| --- | ---: | ---: | ---: | ---: |
| GCP | 1 | 104,99 | 94,66 | −10,33 |
| GCP | 12 | 120,61 | 110,29 | −10,33 |
| AWS | 1 | 140,30 | 135,80 | −4,50 |
| AWS | 12 | 149,52 | 145,02 | −4,50 |
| Azure | 1 | 179,56 | 154,56 | −25,00 |
| Azure | 12 | 187,27 | 162,27 | −25,00 |

Aplicación congelada de la sensibilidad:

- **GCP:** Cloud Logging, primeros 50 GiB/proyecto/mes; Cloud Run request-based, 180.000 vCPU-s, 360.000 GiB-s y 2 millones de requests agregados por billing account. Con el consumo modelado quedan facturables aproximadamente 59.200 vCPU-s; memoria, requests y 11 GB modelados de logs quedan dentro de allowance aun convirtiendo unidades. El script aproxima el descuento por cantidades a las tarifas congeladas; la facturación real aplica el free tier como descuento basado en precios Tier 1 y debe verificarse.
- **AWS:** CloudWatch ofrece 5 GB de datos en el free tier. La sensibilidad asigna los 5 GB a la ingestión modelada; Fargate no tiene franquicia permanente aplicable a esta topología.
- **Azure:** Container Apps ofrece por subscription 180.000 vCPU-s, 360.000 GiB-s y 2 millones de requests; el runtime modelado queda dentro. Log Analytics descuenta 5 GB por billing account/mes del tier Pay-As-You-Go.
- No se descuentan créditos GCP de USD 300 ni promociones temporales. Tampoco se aplican franquicias de object storage que no correspondan a São Paulo o cuyo alcance permanente no esté confirmado.

Esta es una frontera optimista, no una factura esperada. La disponibilidad real depende del consumo compartido del proyecto, billing account, cuenta o subscription y debe verificarse durante la auditoría.

### 7.9 Bajo, Esperado y Alto

| Carga | Plataforma | Mes 1 | Mes 12 | Máximo mensual Año 1 | Mes del máximo | Año 1 acumulado | DB provisionada M1 → M12 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Bajo | GCP | 94,55 | 98,98 | 98,98 | 12 | 1.157,35 | 10 → 22 GiB |
| Bajo | AWS | 107,34 | 107,96 | 107,96 | 12 | 1.289,61 | 20 → 22 GiB |
| Bajo | Azure | 64,51 | 64,66 | 64,66 | 12 | 775,00 | 32 → 32 GiB |
| Esperado | GCP | 104,99 | 120,61 | 120,61 | 12 | 1.353,62 | 14 → 58 GiB |
| Esperado | AWS | 140,30 | 149,52 | 149,52 | 12 | 1.732,80 | 20 → 58 GiB |
| Esperado | Azure | 179,56 | 187,27 | 187,27 | 12 | 2.207,96 | 32 → 64 GiB |
| Alto | GCP | 224,83 | 277,94 | 277,94 | 12 | 3.016,64 | 34 → 180 GiB |
| Alto | AWS | 230,07 | 266,50 | 266,50 | 12 | 2.979,43 | 34 → 180 GiB |
| Alto | Azure | 376,84 | 422,38 | 422,38 | 12 | 4.781,36 | 64 → 256 GiB |

Sizing provisional por carga: GCP usa Cloud SQL dedicado 1 vCPU/3,75 GiB para Bajo/Esperado y 2 vCPU/7,5 GiB para Alto; AWS usa `t4g.micro/small/medium`; Azure mantiene `B1ms/B2s/B2s` en la baseline y muestra `B1ms` Esperado sólo como sensibilidad. Los tiers de Alto y el CPU burstable permanecen sujetos a benchmark; no se afirma capacidad sólo porque el connection budget cierre.

### 7.10 Sensibilidad: tolerancia a falla de una zona

Este eje no se mezcla con carga y no afirma cumplimiento de RPO/RTO.

| Plataforma | Propiedad modelada para Esperado | Mes 1 | Mes 12 | Año 1 | Diferencia principal |
| --- | --- | ---: | ---: | ---: | --- |
| GCP | Cloud SQL HA regional; Cloud Run regional | 182,56 | 209,41 | 2.351,83 | Cloud SQL duplica CPU, RAM y storage. |
| AWS | RDS Multi-AZ + mínimo 2 Fargate tasks en AZ distintas; ALB ya multi-AZ | 213,45 | 230,99 | 2.654,35 | Standby RDS, doble storage DB y segunda task/IP. |
| Azure | PostgreSQL General Purpose 2 vCores primario + standby zone-redundant; 2 réplicas mínimas de Container Apps | 446,06 | 460,76 | 5.454,91 | Burstable no soporta HA; salto a General Purpose y standby facturado. |

Resultado descriptivo: con el modelo v1, tolerar la pérdida de una zona supera USD 200/mes en AWS desde Mes 1, en Azure ampliamente y en GCP desde aproximadamente Mes 12. Esto es un **riesgo económico serio**, no un gate fallido, porque la tolerancia zonal y RPO/RTO siguen `PENDIENTE MAPS`.

### 7.11 Inventario de calculadoras y evidencia reproducible

| Plataforma | Calculator/share link | Export/estimate ID | Captura | Evidencia disponible |
| --- | --- | --- | --- | --- |
| GCP | No generado; calculator dinámica requiere una estimación guardada | No disponible | No guardada | Pricing oficial + parámetros congelados + script local. |
| AWS | No generado | No disponible | No guardada | AWS Price List público para RDS, S3, CloudWatch, ELB/VPC y parámetros congelados. |
| Azure | No generado | API Retail Prices no produce estimate ID | No guardada | Respuestas de Retail Prices API + parámetros congelados + script local. |

La falta de exports/share links queda visible y debe cerrarse antes de congelar evidencia. El script local reconstruye fórmulas, no sustituye un estimate oficial guardado ni una factura real.

Checklist obligatoria previa a declarar `evidence frozen`:

- [ ] **GCP:** saved estimate/share link o export/captura, inputs completos y fecha de consulta.
- [ ] **AWS:** saved estimate/share link/export/captura, inputs completos y fecha de consulta.
- [ ] **Azure:** calculator estimate/captura cuando sea posible, respuesta o query relevante de Retail Prices API, inputs completos y fecha de consulta.
- [ ] Los tres artifacts usan el mismo workload, horizonte, región y criterio de inclusión.
- [ ] Toda diferencia entre calculator, API y script queda reconciliada o registrada como incertidumbre.
- [ ] Los artifacts no contienen IDs sensibles, secretos ni datos de facturación que no deban versionarse.

En esta iteración la checklist permanece abierta: no se operaron calculators ni se generaron nuevos artifacts externos.

## 8. Protocolo de pruebas sintéticas

El [protocolo reproducible](./PROTOCOL-CLD-000-pruebas-y-auditoria.md) queda `PREPARADO — NO AUTORIZADO PARA EJECUCIÓN`. Define:

- misma imagen OCI, código, digest y datasets sintéticos;
- regiones primarias y configuraciones versionadas;
- warm desde Argentina; `cold_request_latency` sólo para runtimes request-driven y `provisioning_time` para scale-from-zero como ECS/Fargate; además DB, burst, jobs, object storage, workload identity, deploy/rollback y observabilidad;
- backup/restore sintético hacia una base temporal independiente, midiendo tiempo técnico sin llamarlo RTO MAPS;
- identidad CI/CD federada desde GitHub Actions mediante OIDC, con acción permitida, acción denegada, expiración y auditoría, sin secrets estáticos;
- Bajo/Esperado/Alto con igual cantidad de iteraciones y ventanas comparables;
- esquema CSV de resultados, correlation id y manifiesto de herramientas;
- presupuesto, teardown y prohibición de datos reales.

No se desplegó ningún recurso ni se ejecutó ningún benchmark en esta iteración. Los SKUs de capacidad continúan provisionales hasta obtener mediciones.

## 9. Auditoría GCP staging pendiente

La checklist read-only detallada está en el mismo [protocolo](./PROTOCOL-CLD-000-pruebas-y-auditoria.md#8-checklist-read-only-para-gcp-staging). **No se ejecutó porque el acceso todavía no está disponible.**

Cuando exista acceso, relevará proyecto/región, Cloud Run, Cloud SQL, Storage, Secret Manager, service accounts, jobs, networking, observabilidad, backups, costos históricos, despliegues, incidentes, errores y tiempo humano. Cada evidencia será `VERIFICADO`, `DOCUMENTADO NO VERIFICADO` o `NO DISPONIBLE`; no se copiarán secretos, PII, logs sensibles ni contenido de buckets.

## 10. Estado de gates, scoring y sesgo

- `ADR-CLD-000` permanece `PROPUESTO` y este anexo `EN ELABORACIÓN`.
- Los gates **no se aplicaron**: sólo se calculó la distancia aritmética al tope para detectar riesgos.
- No se asignaron puntos ni se agregaron resultados ponderados.
- Los pesos permanecen congelados en 30/25/15/15/10/5 antes de ver scoring.
- Experiencia GCP no equivale a decisión GCP; la auditoría sólo puede reducir incertidumbre o aprendizaje demostrados.
- Ninguna ventaja secundaria podrá compensar en el futuro un gate incumplido.

Riesgos visibles sin eliminar alternativas:

- **Azure Esperado:** B2s conservador deja sólo USD 20,44 en Mes 1 y USD 12,73 en Mes 12 frente a USD 200; B1ms reduce USD 76,65/mes, pero todavía no tiene capacidad validada por benchmark.
- **Carga Alta:** los tres proveedores superan USD 200/mes con los supuestos v1; el gate formal aplica hoy a Esperado, pero la escala exige una revisión de presupuesto/tier.
- **Tolerancia zonal:** supera USD 200 para AWS y Azure desde Mes 1, y para GCP cerca de Mes 12; su obligatoriedad sigue pendiente de MAPS.
- **AWS referencia:** evita NAT/endpoints usando public task IP; puede no superar una revisión de seguridad y su alternativa privada elevaría TCO.
- **Capacity risk:** CPU burstable, latencia, conexiones y autoscaling no están probados; un precio bajo no demuestra suficiencia.
- **Presupuesto del spike:** USD 20/proveedor continúa como tope, pero su suficiencia no está demostrada después de agregar restore temporal; requiere preestimación y autorización antes de ejecutar.

## 11. Incertidumbres abiertas exactas

1. Volumen comercial real, estacionalidad, distribución horaria y geografías dentro de Argentina.
2. RPO, RTO y necesidad o no de tolerar pérdida de una zona.
3. Retención/eliminación de solicitudes, adjuntos, logs y backups.
4. Requisito contractual o regulatorio de residencia de datos.
5. Frecuencia y volumen de descarga de adjuntos; egress está visible pero en USD 0 en el total base.
6. Patrón del worker: job finito/event-driven versus poller permanente.
7. CPU/RAM real de API, tiempo p50/p95 y concurrencia segura.
8. Pool definitivo, capacidad real y comportamiento bajo CPU burstable de cada DB.
9. WAL/backup incremental real; el footprint GCP de 1× dataset es sólo supuesto.
10. Consumo compartido de franquicias en las cuentas reales.
11. Necesidad de IP privada/PrivateLink/Private Endpoint y costo de networking asociado.
12. Disponibilidad de cuotas y SKUs en cuentas/subscripciones concretas.
13. Facturación histórica y prácticas operativas del staging GCP existente.
14. Impuestos, moneda de pago, soporte y costo humano.
15. Share links/exports/capturas oficiales de calculator todavía no generados.
16. Arquitectura pública de entrada definida por el futuro `ADR-CLD-001`; frontend, dominio, routing, CDN, LB/edge o backend privado pueden exigir recalcular costos.
17. Duración mínima, almacenamiento y costo residual de la prueba backup/restore en cada proveedor frente al tope USD 20.
18. Políticas reales de organización/repositorio necesarias para habilitar OIDC y principals temporales de CI/CD.

## 12. Fuentes oficiales del corte

- GCP: [regiones Cloud Run](https://cloud.google.com/run/docs/locations), [pricing Cloud Run](https://cloud.google.com/run/pricing), [CPU Cloud Run](https://docs.cloud.google.com/run/docs/configuring/services/cpu), [regiones Cloud SQL](https://docs.cloud.google.com/sql/docs/postgres/region-availability-overview), [crear/tamaños Cloud SQL](https://docs.cloud.google.com/sql/docs/postgres/create-instance), [pricing Cloud SQL](https://cloud.google.com/sql/pricing), [restore Cloud SQL](https://docs.cloud.google.com/sql/docs/postgres/backup-recovery/restore), [HA Cloud SQL](https://docs.cloud.google.com/sql/docs/postgres/high-availability), [start/stop Cloud SQL](https://docs.cloud.google.com/sql/docs/postgres/start-stop-restart-instance), [WIF para pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines), [pricing VPC/IP](https://cloud.google.com/vpc/network-pricing), [pricing Cloud Storage](https://cloud.google.com/storage/pricing), [pricing Artifact Registry](https://cloud.google.com/artifact-registry/pricing), [pricing Cloud Logging](https://cloud.google.com/logging#pricing) y [Pricing Calculator](https://cloud.google.com/products/calculator).
- AWS: [networking Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-task-networking.html), [salida ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/networking-outbound.html), [pricing Fargate](https://aws.amazon.com/fargate/pricing/), [pricing RDS PostgreSQL](https://aws.amazon.com/rds/postgresql/pricing/), [restore RDS](https://docs.aws.amazon.com/AmazonRDS/latest/gettingstartedguide/managing-backup-restore.html), [stop/start RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_StopInstance.html), [límites RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Limits.html), [OIDC IAM role](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html), [pricing ELB](https://aws.amazon.com/elasticloadbalancing/pricing/), [pricing VPC/IPv4](https://aws.amazon.com/vpc/pricing/), [S3 Gateway Endpoint](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html), [pricing CloudWatch](https://aws.amazon.com/cloudwatch/pricing/), [pricing ECR](https://aws.amazon.com/ecr/pricing/), [Pricing Calculator](https://calculator.aws/) y catálogos públicos Price List regionales consultados el 2026-10-07.
- Azure: [pares CPU/RAM Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/containers), [pricing y franquicia Container Apps](https://azure.microsoft.com/en-us/pricing/details/container-apps/), [billing Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/billing), [PostgreSQL compute](https://learn.microsoft.com/en-us/azure/postgresql/compute-storage/concepts-compute), [storage PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/compute-storage/concepts-storage), [límites/conexiones](https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/concepts-limits), [backup PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-backup-restore), [restore PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/backup-restore/how-to-restore-custom-restore-point), [GitHub Actions con OIDC](https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/how-to-deploy-github-action?tabs=openid), [stop/start](https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/how-to-stop-server), [HA PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/high-availability/concepts-high-availability), [pricing Azure Monitor](https://azure.microsoft.com/en-us/pricing/details/monitor/), [costos Log Analytics](https://learn.microsoft.com/en-us/azure/log-analytics/log-analytics-manage-cost-storage), [API Retail Prices](https://prices.azure.com/api/retail/prices) y [Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/).
- CI/CD común: [OIDC de GitHub Actions](https://docs.github.com/en/actions/concepts/security/openid-connect) y [hardening de deployments](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments).

## 13. Control de cambios de la baseline

| Versión | Fecha | Cambio | Efecto |
| --- | --- | --- | --- |
| `v0` | 2026-10-07 | Baseline de workload, continuidad, ambientes, gates y preestimación Esperado. | Punto de partida; varios costos eran rangos y topologías implícitas. |
| `v1` | 2026-10-07 | Mantiene workload y presupuesto; agrega horizonte, conversión GB/GiB, headroom 30%, peaks, conexiones, topología AWS, staging reproducible, tiers corregidos, Bajo/Alto y sensibilidad zonal. | Reemplaza sólo el modelo de cálculo v0; no cambia requisitos MAPS ni acepta plataforma. |
| `v1.1` | 2026-10-07 | Explicita sensibilidad de conexiones Azure, separa cloud spend de carga operacional, corrige cold/provisioning, calcula net-of-allowance y registra dependencia con ADR-CLD-001. | No cambia workload, totales list-price principales, gates, pesos ni estado de decisión. |
| `v1.2` | 2026-10-07 | Agrega restore y CI/CD federado, congela el gate económico y las fronteras de scoring, explicita RPO/RTO no definidos e inputs de runtime, y cierra controles de reproducibilidad. | No aplica gates/scoring ni cambia workloads, pesos o totales principales. |

Una corrección de fuente debe registrar su efecto. Un cambio futuro de workload, presupuesto, continuidad o alcance crea `v2` con fecha y motivo; no se sobrescriben silenciosamente supuestos usados para una comparación anterior.

## 14. Madurez metodológica

Con `v1.2`, el modelo documental se considera **suficientemente maduro para pasar a obtención de evidencia real**: auditoría GCP read-only, artifacts de calculators y spikes sintéticos autorizados. Nuevos refinamientos basados sólo en supuestos deberían evitarse salvo que corrijan un error demostrado; las próximas variaciones de sizing, costo o capacidad deben originarse en mediciones, configuración observada, estimates guardados o decisiones MAPS pendientes.

Esto no congela evidencia, no aplica gates ni convierte la comparación en una recomendación. `ADR-CLD-000` permanece `PROPUESTO` y este anexo `EN ELABORACIÓN`.
