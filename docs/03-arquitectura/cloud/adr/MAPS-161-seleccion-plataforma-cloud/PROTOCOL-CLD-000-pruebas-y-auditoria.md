# Protocolo ADR-CLD-000 — Pruebas sintéticas y auditoría GCP

| Dato | Valor |
| --- | --- |
| Estado | **PREPARADO — NO AUTORIZADO PARA EJECUCIÓN** |
| Corte | 2026-10-07 |
| Evidencia relacionada | [EVIDENCE-CLD-000](./EVIDENCE-CLD-000-comparacion-plataformas.md) |
| Decisión relacionada | [ADR-CLD-000](./ADR-CLD-000-seleccion-plataforma-cloud.md) (`PROPUESTO`) |

Este protocolo reduce incertidumbre técnica de MAPS; no intenta demostrar qué proveedor es «más rápido». No autoriza despliegues, cambios en cuentas existentes ni acceso a datos reales.

## 1. Condiciones previas de ejecución

Antes de ejecutar un spike deben existir:

- autorización explícita para crear recursos en cada plataforma;
- cuenta/proyecto/subscripción de prueba separados o resource group/proyecto etiquetado y aislado;
- presupuesto máximo de **USD 20 por proveedor** y alertas de costo; antes de autorizar, una preestimación debe incluir DB restaurada temporal, storage, backup/PITR, tiempo mínimo facturable y 48 h de costo residual;
- owner, fecha de expiración y procedimiento de teardown;
- regiones primarias congeladas: GCP `southamerica-east1`, AWS `sa-east-1`, Azure `brazilsouth`;
- imagen OCI común fijada por digest `sha256`, arquitectura `linux/amd64` y código fuente versionado;
- dataset sintético sin PII ni documentos de clientes;
- IaC revisada y plan de destrucción probado sobre un entorno vacío;
- resultados, logs y capturas sanitizados antes de incorporarlos al repositorio.

## 2. Artefactos reproducibles a implementar en una iteración autorizada

Ruta propuesta, todavía no creada:

```text
tests/cloud-platform/
├── app/                     # API y job sintéticos comunes
├── k6/
│   ├── warm.js
│   ├── cold-request.js
│   ├── provisioning.js
│   └── burst.js
├── db/
│   ├── schema.sql
│   ├── seed.sql
│   └── transaction.sql
├── objects/
│   ├── generate-fixtures.ps1
│   └── checksums.json
├── terraform/
│   ├── gcp/
│   ├── aws/
│   └── azure/
├── config/
│   ├── workload-low.json
│   ├── workload-expected.json
│   └── workload-high.json
└── results/
    └── YYYY-MM-DD/<provider>/
```

La implementación debe usar variables equivalentes y producir un manifiesto con commit, digest, región, SKU, configuración, timestamp UTC y versión de cada herramienta.

El tope USD 20/proveedor continúa siendo una restricción, no una estimación validada. Es plausible para recursos pequeños y teardown rápido, pero la nueva restauración puede exigir una instancia adicional, storage y espera de disponibilidad del backup. La autorización del spike queda condicionada a una preestimación por proveedor; si no cabe, se consulta presupuesto o se reduce alcance de forma explícita.

## 3. Workload HTTP congelado para el spike

Todos los valores son `SUPUESTO DE COMPARACIÓN`, no previsiones comerciales.

| Parámetro | Bajo | Esperado | Alto |
| --- | ---: | ---: | ---: |
| Requests promedio/segundo del mes | 0,039 | 0,193 | 0,772 |
| Pico sostenido | 2 RPS durante 5 min | 10 RPS durante 15 min | 40 RPS durante 30 min |
| Burst | 5 RPS durante 60 s | 25 RPS durante 120 s | 100 RPS durante 300 s |
| Duración HTTP p50 asumida | 250 ms | 250 ms | 250 ms |
| Duración HTTP p95 asumida | 800 ms | 800 ms | 800 ms |
| Máximo de instancias | 2 | 4 | 10 |
| Pool máximo por instancia | 4 | 4 | 4 |
| Presupuesto de conexiones de aplicación | 8 | 16 | 40 |
| Margen operacional/administrativo MAPS | 20 | 20 | 20 |
| Demanda total a contrastar con capacidad segura | 28 | 36 | 60 |

La media mensual resulta de `requests / (30 × 24 × 3600)`. Su valor bajo demuestra por qué los requests mensuales no sustituyen una prueba de pico.

El margen MAPS de 20 no representa conexiones reservadas por el proveedor. Es headroom propio para administración, migraciones, health checks, jobs, despliegues solapados y variación del pool. En Azure Esperado se contrastarán también márgenes de 5 y 10, sin reducir automáticamente la baseline conservadora.

## 4. Imagen y endpoints comunes

La misma imagen debe exponer:

- `GET /health`: respuesta sin dependencias;
- `GET /db/ping`: conexión y `SELECT 1`;
- `POST /db/transaction`: transacción pequeña idempotente sobre datos sintéticos;
- `POST /objects/{size}`: upload de fixture y checksum;
- `GET /objects/{id}`: download y verificación de checksum;
- comando `job-success`: trabajo finito exitoso;
- comando `job-failure`: fallo controlado para probar reintento, backoff y observabilidad.

La imagen no contiene credenciales. DB, object storage y secrets se acceden mediante identidad de workload y configuración externa.

## 5. Matriz de pruebas

| Prueba | Procedimiento común | Repeticiones y métricas | Criterio de evidencia |
| --- | --- | --- | --- |
| Argentina → API warm | Mantener al menos una réplica caliente; ejecutar desde el mismo runner argentino. | 1.000 requests por escenario; p50, p95, p99, errores, bytes. | CSV bruto + resumen; ISP, ubicación aproximada y horario registrados. |
| Argentina → API cold request | Sólo para runtimes con startup request-driven y scale-to-zero: confirmar cero réplicas y disparar una request aislada. | 20 ciclos; `cold_request_latency`, startup informado, error y tiempo hasta warm. | Cloud Run y Container Apps cuando la configuración admita esa semántica; estado previo/posterior verificable. |
| Provisioning / scale-from-zero | Para topologías sin startup request-driven equivalente: llevar capacidad deseada a 0, solicitar capacidad y esperar readiness. | 20 ciclos; `provisioning_time`, tiempo hasta healthy/ready, registro en LB y primera recepción de tráfico. | Aplica a ECS/Fargate baseline y a cualquier topología equivalente; registrar cada transición y control usado. |
| API → PostgreSQL | Ejecutar conexión nueva, `SELECT 1` y transacción pequeña. | 100 iteraciones reutilizando pool y 20 aperturas de conexión nueva; connect, query, commit, rollback, errores. | Pool y TLS idénticos conceptualmente; registrar conexiones observadas. |
| Pico sostenido | Aplicar RPS y duración de la tabla congelada. | p50/p95/p99, instancias, CPU/RAM, conexiones DB, 4xx/5xx. | Registrar tiempo de escalado y estabilización. |
| Burst | Aplicar burst congelado después de 15 min de reposo. | mismos percentiles, cold starts, throttling, errores y recovery. | No aumentar límites durante la prueba. |
| Job corto | Ejecutar `job-success` con 60 s de trabajo sintético. | 30 ejecuciones; queue/startup/run/total y resultado. | Misma CPU/RAM y payload. |
| Job con fallo | Ejecutar `job-failure` en el mismo punto determinístico. | 10 ejecuciones; intentos, intervalos, estado final y alerta. | Retries/backoff declarados en configuración. |
| Object storage pequeño | Upload/download de 2 MiB y checksum. | 30 ciclos; latencia y throughput. | Bucket privado; borrar fixtures al terminar. |
| Object storage medio | Upload/download de 10 MiB y checksum. | 30 ciclos; latencia y throughput. | Mismo origen argentino y misma ventana. |
| Workload identity | Leer un secret, escribir/leer objeto y conectar a DB sin clave estática. | 1 flujo positivo y 3 negativos por permiso removido. | Audit log y denegaciones esperadas. |
| CI/CD federado | Desde GitHub Actions, intercambiar OIDC por identidad temporal del proveedor y ejecutar un deploy mínimo. | 3 autenticaciones; acción permitida, acción denegada, expiración y evento de auditoría. | Sin secret estático; principal y permisos mínimos verificables; no almacenar token. |
| Deploy y rollback | Aplicar IaC, publicar digest, promover revisión y volver al digest anterior. | 5 ciclos; pasos, tiempo humano, tiempo total, fallos. | Checklist ejecutada y estado final verificado. |
| Observabilidad | Correlacionar request, transacción, objeto, job y error por trace/correlation id. | 10 flujos completos. | Consulta reproducible y ausencia de PII/payload sensible. |
| Backup y restore PostgreSQL | Crear dataset conocido, generar backup/snapshot/PITR, alterar datos y restaurar a una DB temporal independiente. | Un ciclo completo por plataforma; tiempos técnicos, pasos manuales, errores y validación. | Schema, conteos, checksums e integridad coinciden; recurso restaurado destruido. |

### 5.1 Prueba comparable de backup y restore

Servicios candidatos, todavía no aceptados: Cloud SQL for PostgreSQL, RDS for PostgreSQL y Azure Database for PostgreSQL Flexible Server. En cada plataforma se usa el mecanismo administrado equivalente disponible —backup bajo demanda, snapshot o PITR— y se documenta cualquier diferencia semántica.

Flujo obligatorio:

1. Crear un dataset sintético versionado con schema, conteos, relaciones y checksums conocidos.
2. Registrar manifiesto inicial y timestamp UTC.
3. Disparar o identificar el backup/snapshot/punto de recuperación candidato.
4. Modificar o eliminar controladamente una porción del dataset original.
5. Restaurar hacia una instancia o base temporal independiente; nunca sobrescribir el origen.
6. Validar schema, conteos, checksums, datos e integridad referencial contra el manifiesto.
7. Registrar tiempos, pasos manuales y errores.
8. Destruir el recurso temporal y verificar costo residual.

Campos específicos:

```text
backup_method, backup_trigger_time, restore_start_time,
restore_ready_time, restore_elapsed_time, validation_time,
validation_result, manual_steps, errors, temporary_resource_deleted
```

`restore_elapsed_time` es tiempo técnico observado del mecanismo, **no RTO MAPS**. RPO y RTO no están definidos por MAPS y continúan `PENDIENTE MAPS`; el backup diario de comparación tampoco establece un RPO. Si la preestimación total, incluyendo la base restaurada y el tiempo requerido para disponer del backup/PITR, supera USD 20, se detiene la autorización y se plantea una pregunta presupuestaria; el protocolo no aumenta el tope silenciosamente.

### 5.2 Prueba de identidad CI/CD federada

Flujos candidatos:

```text
GCP:   GitHub Actions → OIDC → Workload Identity Federation → identidad temporal
AWS:   GitHub Actions → OIDC → IAM Role → credenciales temporales
Azure: GitHub Actions → OIDC → federated credential → identidad temporal
```

Para cada proveedor:

1. Autenticar el workflow sin secret estático del proveedor.
2. Ejecutar un deploy mínimo permitido con el principal de menor privilegio diseñado para el spike.
3. Intentar una operación explícitamente no permitida y comprobar la denegación.
4. Registrar lifetime/expiración de la credencial temporal y comprobar que no funciona fuera de su vigencia.
5. Localizar el evento de auditoría y correlacionarlo con workflow, repositorio, commit y principal.
6. Ejecutar rollback usando el mismo patrón federado.

Campos específicos:

```text
auth_method, principal, token_type, credential_lifetime,
allowed_action, denied_action, audit_event
```

No se guardan tokens, assertions OIDC completas ni credenciales temporales en logs o artifacts. No se crean claves estáticas para simplificar el spike.

## 6. Ventana y orden de ejecución

1. Cerrar preestimación bajo USD 20 y configurar OIDC/federación sin credenciales estáticas.
2. Ejecutar smoke test y verificar teardown en cada plataforma.
3. Ejecutar Bajo, Esperado y Alto en ventanas equivalentes, evitando incidentes globales conocidos.
4. Ejecutar backup/restore sólo cuando exista punto recuperable y tiempo/costo restante suficiente.
5. Alternar el orden de proveedores entre rondas para reducir sesgo horario.
6. Repetir una ronda completa otro día.
7. Conservar mediciones brutas; cualquier exclusión debe indicar motivo y no eliminar el dato original.
8. Destruir recursos y verificar costo residual durante 48 horas.

`cold_request_latency` y `provisioning_time` son métricas distintas. No se promedian, no se ordenan en una misma columna como si midieran el mismo mecanismo y no se fuerza scale-to-zero request-driven sobre ECS/Fargate. La comparación posterior evaluará su impacto en experiencia y operación, explicando la semántica de cada plataforma.

No comparar una medición obtenida desde un runner distinto, con un dataset distinto o bajo límites modificados sin marcarla como no equivalente.

## 7. Esquema mínimo de resultados

Cada observación debe incluir:

```text
run_id, provider, region, scenario, test, iteration,
started_at_utc, duration_ms, status_code, error_type,
runtime_instances, db_connections, bytes_in, bytes_out,
metric_kind, cold_request_latency_ms, provisioning_time_ms,
image_digest, git_commit, config_hash, runner_network
```

Las pruebas de backup/restore y CI/CD anexan sus campos específicos definidos en 5.1 y 5.2. Valores sensibles se registran por tipo, hash o identificador sanitizado, nunca como token o secreto.

Las métricas de proveedor se exportan con el mismo `run_id`. Las inferencias se escriben después y nunca sustituyen la medición bruta.

## 8. Checklist read-only para GCP staging

Esta sección queda preparada pero **no se ejecuta sin acceso**.

### 8.1 Alcance y permisos

- [ ] Confirmar proyecto y organización correctos sin copiar IDs innecesarios al repositorio.
- [ ] Confirmar roles efectivos de lectura y acceso a Billing sólo si fue autorizado.
- [ ] Verificar que no existen permisos de escritura requeridos para el relevamiento.
- [ ] Registrar período observado y zonas sin visibilidad como `NO DISPONIBLE`.

### 8.2 Inventario técnico

- [ ] Regiones y servicios realmente desplegados.
- [ ] Cloud Run: servicios, jobs, revisiones, CPU/RAM, concurrencia, min/max instances, ingress y service identity.
- [ ] Cloud SQL: motor/versión, tier, storage, HA, red, backups, PITR, retención y flags relevantes.
- [ ] Cloud Storage: ubicación, clase, acceso público efectivo, IAM, lifecycle y volumen agregado; no listar ni descargar objetos.
- [ ] Secret Manager: existencia, rotación y bindings; no leer valores.
- [ ] Service accounts y bindings efectivos; detectar claves estáticas sin descargarlas.
- [ ] VPC, conectores, firewall, IP pública/privada y DNS relevante.
- [ ] Logging, Monitoring, alertas, retención, volumen y exclusiones.
- [ ] Artifact Registry, políticas de limpieza y consumo.

### 8.3 Evidencia operacional

- [ ] Costos históricos brutos por servicio y mes; separar créditos/descuentos.
- [ ] Períodos activos e inactivos que expliquen el costo.
- [ ] Historial de despliegues y rollbacks disponible.
- [ ] Errores/incidentes observables y su resolución documentada.
- [ ] Tiempo humano aproximado informado por quien operó staging.
- [ ] Evidencia de backup y, si existe, restore probado; no ejecutar un restore sin autorización.
- [ ] Diferenciar recursos desplegados de recursos sólo documentados.

### 8.4 Clasificación

Cada fila del relevamiento se marca exactamente como:

- `VERIFICADO`: observado directamente con acceso read-only y fecha;
- `DOCUMENTADO NO VERIFICADO`: consta en documentación o testimonio, no en el proyecto observado;
- `NO DISPONIBLE`: el permiso o la fuente no permiten comprobarlo.

No copiar secretos, PII, contenido de buckets, tokens, variables sensibles ni logs con payloads de cliente.

## 9. Condiciones de salida

El protocolo se considera ejecutado sólo cuando existen resultados equivalentes de las tres plataformas, teardown verificado, costo real del spike y registro de desviaciones. Hasta entonces aporta un diseño de prueba, no una medición ni un criterio de selección.
