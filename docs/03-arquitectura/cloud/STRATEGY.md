# F3 — Cloud Strategy

| Dato | Definición |
| --- | --- |
| Estado | **BORRADOR ESTRATÉGICO** |
| Owner principal | Santiago Talavera; revisión cruzada de Software/Dominio: Joaquin Rodriguez |
| Naturaleza | Documento estratégico transversal; **no es un ADR ni un TDD**. Refleja las decisiones aceptadas por los ADR sin sustituirlas. |
| Fuente de alcance | [Baseline F0](../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [Discovery F1](../../01-producto/Fase_1__Discovery_y_Relevamiento.md) y [Design Handoff F2](../../02-diseno/Fase_2__Design_Handoff.md). |
| Propósito | Reducir el espacio de solución y establecer principios, responsabilidades y capacidades de plataforma antes de elegir servicios. |

Esta estrategia ordena preguntas y dependencias para los [ADR/TDD Cloud](./README.md). `ADR-CLD-000` adopta GCP como plataforma del MVP; los servicios y el diseño concreto pertenecen a los artefactos derivados. No cierra F1/F2, no modifica la baseline funcional y no sustituye la [trazabilidad por artefacto](../traceability.md). En `main`, `ADR-SW-001/002/003/004/005` están **ACEPTADOS** y `TDD-SW-001/003` están **APROBADOS**. `ADR-SW-001/002/003` y `TDD-SW-001` fueron aceptados/aprobados por decisión del owner registrada en la [PR #23](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/23). Para `ADR-SW-004/005`, la revisión cruzada Cloud quedó aprobada en la PR #17; la PR #24 formalizó sus estados y registró las constancias, junto con las revisiones cruzadas de los siete documentos Software.

La [PR #17](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/17), la [PR #24](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/24) y la [PR #20](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/20) están integradas en `main`. `TDD-SW-002/005` permanecen **BORRADOR** en la baseline; su integración no implica aprobación y sus bloqueantes funcionales siguen abiertos.

```text
F0 / F1 / F2                  qué producto construimos
        ↓
Cloud Strategy               qué capacidades y propiedades necesita la plataforma
        ↓
ADR                          qué alternativa elegimos y por qué
        ↓
TDD                          cómo la materializamos
        ↓
IaC / código / pipelines      cómo la implementamos
        ↓
Runbooks / observabilidad     cómo la operamos
```

## 1. Problema de plataforma

MAPS no necesita sólo «hostear una web». El Portal de Solicitudes de Seguros combina catálogo público, autenticación, `InsuranceRequest(BORRADOR)` recuperable, envío formal a `ENVIADA`, operación Admin, asignación manual, Delivery requerido antes de `DERIVADA`, acceso autenticado y read-only del Productor, documentos privados, auditoría y analytics con minimización de PII. La plataforma debe sostener esas fronteras y fallos sin alterar los cinco estados funcionales confirmados.

Siguen **fuera del MVP** checkout, pagos, contratación, emisión, cotizador, pricing dinámico/personalizado, Leads/Potenciales clientes, Recovery, Portal del Asegurado, pólizas/PDF y el PostgreSQL histórico de MAPS como dependencia funcional. La necesidad de una base nueva para el Portal es distinta de reutilizar esa base histórica.

## 2. Drivers arquitectónicos

| Driver de F0/F1/F2 o condición de trabajo | Consecuencia que Cloud debe resolver, sin elegir servicio todavía |
| --- | --- |
| Superficie pública y autenticada | Separar entrada pública de operaciones protegidas; definir TLS, routing y controles sin sumar saltos injustificados. |
| Cliente, Admin y Productor | Proteger sesiones y workloads; Software define RBAC y acceso por identidad, Cloud limita permisos de infraestructura. |
| Datos operacionales persistentes | Diseñar consistencia, conexiones, migraciones y recuperación para una base propia del Portal, condicionada por ADR-SW-003. |
| Adjuntos privados | Separar metadata y binario; diseñar acceso autorizado, aislamiento y recuperación sin URLs públicas permanentes. |
| Delivery/email con efecto funcional | Ejecutar trabajo asíncrono con reintentos e idempotencia; el fallo conserva `ASIGNADA`. |
| Auditoría | Conservar evidencia de acciones relevantes sin confundirla con logs técnicos. |
| Analytics con minimización de PII | Medir funnel sin respuestas, documentos ni datos personales innecesarios. |
| Equipo pequeño | Favorecer operación asumible y automatización proporcional; contabilizar carga humana. |
| Escala inicial moderada/no demostrada | Medir antes de sobredimensionar. No hay volumen, tráfico ni concurrencia aprobados. |
| Pendientes legales y de retención | No fijar plazos de borrado/conservación ni mecanismos irreversibles antes de la definición MAPS. |
| PostgreSQL histórico fuera del MVP | No diseñar integración, sincronización o migración funcional desde esa fuente. |

No hay SLA, RPO, RTO, tráfico, volumen o concurrencia cuantificados en la baseline; son inputs por obtener, no números a inferir aquí.

## 3. Principios estratégicos

| Principio | Implicación para MAPS |
| --- | --- |
| Managed-first, no managed-at-all-costs | Preferir delegar operación indiferenciada si reduce riesgo/TCO, pero comparar costo, control, límites y reversibilidad. |
| Complejidad proporcional | Cada componente, proxy o servicio necesita un driver del Portal y un beneficio verificable. |
| Shared Responsibility Model | El proveedor puede operar infraestructura subyacente; Kondor conserva configuración, datos, accesos, código, recuperación y operación de la aplicación. |
| Responsabilidad vs. control | No asumir responsabilidad operativa de una capa sin capacidad real de configurarla, observarla y recuperarla. |
| Stateless cuando sea razonable; compute no es fuente de verdad | Workloads pueden reiniciar o escalar; BORRADORES, estado, outbox y archivos deben sobrevivir fuera del proceso. |
| Private by default y least privilege | Documentos y datos privados no se publican; cada actor y workload obtiene sólo el acceso necesario. |
| Identidad por workload cuando corresponda | Evitar credenciales compartidas de larga vida si la plataforma elegida ofrece identidad de servicio apropiada. |
| IAM Cloud ≠ RBAC de aplicación; defense in depth | IAM limita acceso a recursos; Software verifica actor, estado y ownership de cada solicitud. Red, identidad y datos aportan defensas complementarias. |
| Infraestructura reproducible y observabilidad desde diseño | Ambientes, configuración, señales de Delivery y recuperación deben poder revisarse y reproducirse; el detalle se decide en ADR/TDD. |
| Build once / promote cuando sea viable | Evaluar promover el mismo artefacto entre ambientes, con configuración separada y controles de promoción. |
| TCO sobre precio nominal | Incluir operación, tiempo humano, incidentes y complejidad, además de consumo del servicio. |
| RPO/RTO como inputs | Dimensionar backup, restore y disponibilidad tras recibir objetivos de negocio; no asignar valores arbitrarios. |
| Medir antes de optimizar; lock-in consciente | Aceptar dependencia de proveedor sólo si compra valor claro; evitar optimización prematura. |
| Escalabilidad ≠ elasticidad | Más instancias de compute no garantizan más capacidad: DB, email y dependencias externas pueden convertirse en el cuello de botella. |

## 4. TARGET conceptual por responsabilidades

Es un **mapa de capacidades**, no una topología aprobada. La base relacional refleja el contrato aceptado de `ADR-SW-003`; su materialización cloud, el mecanismo asíncrono y cada servicio permanecen abiertos.

```text
Internet
   ↓
Entrada pública (DNS, TLS, edge, routing/cache según driver)
   ├──→ Frontend ──→ API autenticada/autorizada
   └────────────────→ API pública controlada
                         ├──→ Relational Database* (estado y outbox transaccional)
                         └──→ Object Storage privado (binarios)

Estado/outbox ──→ Async Worker ──→ Email provider

Transversal: Identity / IAM · Secrets · Observability · Audit · CI/CD · IaC
             Environments · Backup / Recovery · Cost controls

* Forma relacional aceptada en ADR-SW-003; outbox definido en ADR-SW-004 **ACEPTADO**, integrado a `main` mediante PR #17 y formalizado junto con su revisión cruzada en PR #24. Ningún servicio Cloud queda aceptado aquí.
```

## 5. Flujo mínimo de una request

```text
Usuario → DNS → TLS → entrada pública / edge → frontend o API
        → autenticación/autorización → aplicación → persistencia/storage → respuesta
```

El frontend puede iniciar llamadas separadas a la API; el esquema no afirma que ambos vivan en el mismo runtime. **Cada salto adicional debe comprar una propiedad concreta.** WAF, API Gateway, service mesh, Kubernetes o múltiples proxies no se agregan por inercia; un ADR debe justificar cualquier capa adicional por amenaza, contrato, operación o escala demostrados.

## 6. Trust boundaries

| Frontera | Preguntas que ADR/TDD deben responder |
| --- | --- |
| Navegador / Internet ↔ entrada pública | ¿Quién inicia? ¿Qué origen y transporte se permiten? ¿Qué se autentica, limita y registra? ¿Qué ve el usuario ante fallo? |
| Entrada pública ↔ workloads de aplicación | ¿Qué rutas alcanzan cada workload? ¿Qué identidad y autorización aplican? ¿Qué cabeceras/datos cruzan? ¿Cómo se propagan errores sin filtrar información? |
| Workloads ↔ datos privados | ¿Qué identidad de workload accede a DB o binarios? ¿Qué operaciones mínimas permite IAM y qué valida RBAC? ¿Qué se audita? ¿Cómo se recupera un fallo parcial? |
| Workloads ↔ sistemas externos | ¿Qué datos mínimos salen hacia email u otro proveedor? ¿Cómo se autentica el workload, se reintenta y se registra el resultado conocido? |

En cada frontera debe constar quién inicia, autenticación, autorización, datos que atraviesan, registro y comportamiento ante fallo. El diagrama no reemplaza ese análisis.

## 7. Modelo de responsabilidad

No hay evidencia actual que justifique que Kondor opere directamente SO, hypervisors, servidores, orquestación Kubernetes, un clúster PostgreSQL autogestionado, object storage propio o certificados manuales. Una necesidad futura demostrada podría reabrir esa evaluación; no es una prohibición abstracta.

Aunque use servicios gestionados, el equipo sigue siendo responsable de código y dependencias, configuración, IAM, autorización funcional, schema y migraciones, backups correctamente configurados y restore probado, datos, secrets, observabilidad, costos, capacidad e incidentes de aplicación. El ADR de plataforma debe precisar qué delega al proveedor y qué controles conserva el equipo.

## 8. Datos, criticidad y recuperación

| Clase | Ejemplos | Implicación |
| --- | --- | --- |
| Reconstruible | Código, imágenes/builds, frontend estático, IaC | Reproducir desde fuentes/versiones; no tratar una instancia efímera como fuente de verdad. |
| Persistente y crítico | Cuentas, Clientes, Productores, `InsuranceRequest`, respuestas, snapshots, Delivery/outbox, auditoría y documentos | Definir respaldo, consistencia, restauración, acceso y protección según criticidad. |
| Operacional o descartable según caso | Logs técnicos, métricas, traces y cache futuro | Definir valor, minimización, retención y recuperación por tipo; no asumir que todos son descartables. |

**RPO/RTO productivos = INPUT PENDIENTE.** Backups sin prueba de restore no demuestran recuperabilidad. Los objetivos, ventanas y compromisos de disponibilidad se acuerdan antes de cerrar los TDD operativos; aquí no se asignan números. La baseline comparativa y sus supuestos no funcionales se mantienen en [EVIDENCE-CLD-000](./adr/MAPS-161-seleccion-plataforma-cloud/EVIDENCE-CLD-000-comparacion-plataformas.md), sin convertirlos en requisitos MAPS.

## 9. Ambientes

`development != staging != production`: especialmente **datos, secrets e identidades de staging ≠ production**. Evitar copiar PII productiva a ambientes no productivos sin una decisión y controles explícitos. `ADR-CLD-002` decidirá el grado concreto de aislamiento (proyectos/cuentas, recursos, dominios, pipelines y promoción) conforme a riesgo, costo y operabilidad; esta estrategia no fija esa topología.

## 10. Compute y workloads

| Workload | Necesidades a diseñar |
| --- | --- |
| API | HTTP; stateless cuando sea razonable; containerizable; configuración externa; graceful shutdown; escalado verificable y acceso controlado a DB, storage y secrets. |
| Worker | Independiente del request HTTP; tareas retryable e idempotentes; resultado y fallos observables, sin cambiar silenciosamente el estado funcional. |
| Jobs | Migraciones y tareas one-shot/programadas cuando correspondan; identidad, permisos y ejecución controlados. |

`ADR-CLD-003` elegirá runtime y límites entre API, worker y jobs. Cloud Run figura en el catálogo como **candidato**, no como servicio aceptado. Para asincronía, Cloud Run Jobs + Cloud Scheduler es la alternativa inicial preferida a evaluar; debe compararse con Pub/Sub y con un worker/servicio permanente según frecuencia, latencia, solapamiento, claims/leases, retries, idempotencia y recuperación.

## 11. Persistencia

`ADR-SW-003` **ACEPTADO** define una base PostgreSQL nueva, relacional y única inicialmente, con ACID, integridad referencial, ownership lógico por módulo y migraciones versionadas. El PostgreSQL histórico de MAPS queda fuera del MVP. La revisión cruzada Cloud quedó registrada en PR #24; la materialización concreta sigue pendiente de `TDD-CLD-003`.

Como `ADR-CLD-000` acepta GCP, un PostgreSQL administrado podría derivarse de `ADR-SW-003`, la plataforma elegida y managed-first sin ADR de servicio independiente. `TDD-CLD-003` deberá validar brevemente alternativas de implementación y justificar el servicio concreto, conexiones/pooling, sizing, región, HA si aplica, backups, PITR, restore, migraciones, compatibilidad expand/contract y capacidad. **Cloud SQL es propuesta/derivación condicionada, no decisión aceptada.** Si emergen trade-offs estructurales, se eleva un ADR nuevo.

## 12. Object Storage

El contrato de Software de `TDD-SW-001` **APROBADO** define `Document` como metadata más referencia, binario fuera de la DB, acceso privado/autorizado y sin URLs públicas permanentes. La revisión cruzada Cloud fue favorable con observaciones y quedó registrada en PR #24. La retención sigue pendiente de MAPS y la materialización Cloud queda pendiente de `TDD-CLD-004`.

Con GCP adoptado por `ADR-CLD-000`, Cloud Storage continúa como candidato a validar en `TDD-CLD-004`, no como elección automática. Ese TDD debe comparar brevemente alternativas y justificar buckets, aislamiento por ambiente, IAM, lifecycle, modalidad de acceso (signed URLs, streaming por backend u otra), uploads, auditoría y retención cuando MAPS la defina. **Cloud Storage es propuesta/derivación condicionada, no decisión aceptada.** Esta Strategy no fija esos mecanismos ni crea un ADR específico del servicio.

## 13. Procesamiento asíncrono

La asincronía tiene un driver funcional concreto:

```text
ASIGNADA → Delivery requerido
          ├── fallo: permanece ASIGNADA; Admin ve incidencia y puede reintentar
          └── éxito requerido: puede pasar a DERIVADA
```

Software define la semántica de `Delivery`, `DeliveryAttempt`, outbox, claims/leases, idempotencia y transición funcional. `ADR-SW-004` está **ACEPTADO** en `main` (integrado mediante PR #17 y formalizado en PR #24); `TDD-SW-005` permanece **BORRADOR** en `main` y mantiene abierta la decisión entre aceptación del proveedor con `providerMessageId` y entrega confirmada por webhook como evidencia requerida. Cloud evalúa runtime, triggers, retries/backoff, mensajes fallidos, recuperación operativa, observabilidad, capacidades del proveedor, autenticidad de webhooks, bounces y garantías reales (`ADR-CLD-003` / `TDD-CLD-005`, previstos). No se elige aquí ninguna semántica: la resolución corresponde a Software/MAPS/Kondor y su materialización posterior a `TDD-CLD-005`.

## 14. Observabilidad

**Audit ≠ Analytics ≠ Operational observability.** Audit registra acciones de negocio y acceso relevantes; Analytics mide el funnel; observabilidad operacional registra salud, errores, latencias y fallos de workloads/entrega. Ninguna señal técnica sustituye otra. La telemetría debe minimizar PII y no guardar respuestas ni documentos. Señales, retención, alertas, acceso y costos quedan para `ADR-CLD-006` y `TDD-CLD-007`, en coordinación con `TDD-SW-007` previsto.

## 15. Seguridad

```text
Usuario final → auth/RBAC de aplicación → workload → IAM cloud → recursos
```

Networking controla rutas y exposición; IAM controla identidades de workloads y permisos sobre recursos; autorización de DB limita operaciones sobre datos; autorización de aplicación verifica actor, ownership y estado funcional. `ADR-SW-005` está **ACEPTADO** en `main` (integrado mediante PR #17 y formalizado en PR #24) y define la frontera de identidad/autorización de negocio; `TDD-SW-005` mantiene abiertas dependencias para revocación efectiva, Productor autorizado, Assignment efectiva y acceso posterior a Delivery. Cloud debe comprobar que entrada, identidades de workload, recursos y revocación soportan esos contratos sin copiarlos ni resolverlos, mediante `ADR-CLD-007` y los TDD aplicables.

## 16. Modelo económico y TCO

`TCO = infraestructura + operación + tiempo humano + complejidad + incidentes + riesgo + downtime`. Los TDD compararán escenarios GCP con supuestos verificables, no sólo precios nominales. La comparación multiproveedor, sus gates y costos se conservan como antecedente histórico reproducible en [EVIDENCE-CLD-000](./adr/MAPS-161-seleccion-plataforma-cloud/EVIDENCE-CLD-000-comparacion-plataformas.md); las pruebas, auditoría y autorización de financiación se gobiernan mediante [PROTOCOL-CLD-000](./adr/MAPS-161-seleccion-plataforma-cloud/PROTOCOL-CLD-000-pruebas-y-auditoria.md). El máximo de USD 200/mes es un guardrail de viabilidad GCP, no un mecanismo automático para reabrir proveedor.

| Componente conceptual | Comportamiento de costo a validar |
| --- | --- |
| Frontend/edge | Normalmente bajo o variable; depende de tráfico y arquitectura elegida. |
| Compute; worker/jobs | Variable con uso, concurrencia y tiempo de ejecución. |
| DB | Probable principal costo fijo inicial; confirmar con sizing y disponibilidad requeridos. |
| Object storage; egress; email | Consumo y patrón de acceso/envío. |
| Secrets | Usualmente bajo, pero sujeto a proveedor y patrón de uso. |
| Observabilidad | Puede crecer con volumen y retención de señales. |
| Networking sofisticado | Puede introducir costos fijos y carga operacional. |

No se fijan precios actuales, presupuestos ni ahorros supuestos.

## 17. Evolución guiada por evidencia

```text
MVP → medir → ajustar concurrencia/capacidad → mejorar observabilidad
    → HA si negocio lo exige → reforzar edge si el riesgo lo exige
    → otras evoluciones justificadas
```

No se introduce multi-region, Kubernetes, microservicios ni service mesh como roadmap implícito. Cada evolución exige driver, evidencia, costo y decisión proporcional.

## 18. GCP como constraint de plataforma del MVP

GCP es una **DECISIÓN ACEPTADA DE PLATAFORMA** para el MVP. La decisión organizacional fue tomada por mayoría verbal 3/4 para sostener continuidad con MAPS-LandingPage y concentrar el aprendizaje en la plataforma donde existe experiencia interna. No afirma superioridad técnica, económica u operacional, ni unanimidad.

El [ADR-CLD-000 — Selección de plataforma cloud](./adr/MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md) es el **gate fundacional** de la historia [MAPS-161](https://santitalavera.atlassian.net/browse/MAPS-161), documentado en la subtask [MAPS-162](https://santitalavera.atlassian.net/browse/MAPS-162). Está `ACEPTADO` para la plataforma. Cloud Run, Cloud SQL, Cloud Storage, Secret Manager, Artifact Registry, Cloud Logging/Monitoring, Terraform y GitHub Actions con OIDC/WIF forman una arquitectura candidata de referencia; no quedan aceptados por figurar aquí.

El análisis conceptual proveedor-neutral puede continuar cuando aporte valor. Antes de aceptar un ADR/TDD dependiente de GCP se deben resolver sus trade-offs concretos de servicios, límites, IAM, costo, operación y recuperación.

## 19. Derivaciones condicionadas

Una elección de servicio no requiere ADR propio si deriva suficientemente de decisiones **aceptadas** y no introduce una alternativa arquitectónica de primer orden. El TDD todavía debe validar alternativas y justificar la materialización.

```text
ADR-SW-003 ACEPTADO + ADR-CLD-000 acepta GCP + managed-first
    → TDD-CLD-003 evalúa y justifica Cloud SQL for PostgreSQL

Contrato base de `Document` en `TDD-SW-001` APROBADO (acceso detallado pendiente de `ADR-SW-006`) + ADR-CLD-000 acepta GCP
    + object storage gestionado/privado
    → TDD-CLD-004 evalúa y justifica Cloud Storage
```

Son ejemplos **condicionados**, no decisiones actuales. Si aparecen restricciones fuertes, trade-offs estructurales o alternativas no equivalentes, elevar la elección a un ADR nuevo en vez de esconderla en el TDD.

## 20. Mapa de decisiones Cloud

| ID previsto | Decisión por trabajar | Dependencia principal |
| --- | --- | --- |
| [ADR-CLD-000](./adr/MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md) (`ACEPTADO`) | GCP como plataforma cloud del MVP | Gate fundacional de [MAPS-161](https://santitalavera.atlassian.net/browse/MAPS-161) / [MAPS-162](https://santitalavera.atlassian.net/browse/MAPS-162); servicios y topología siguen abiertos. |
| `ADR-CLD-001` | Hosting frontend y entrada pública | Drivers de exposición, identidad y plataforma elegida cuando aplique. |
| `ADR-CLD-002` | Ambientes, aislamiento y promoción | Separación de datos, secrets e identidades. |
| `ADR-CLD-003` | Runtime API / worker / jobs / migraciones | Contratos de Software y plataforma elegida cuando aplique. |
| `ADR-CLD-004` | Infrastructure as Code | Topología/operación por definir. |
| `ADR-CLD-005` | CI/CD y promoción | Ambientes y artefactos por definir. |
| `ADR-CLD-006` | Observabilidad | Señales y retención por definir. |
| `ADR-CLD-007` | Seguridad cloud | Fronteras, identidad e IAM por definir. |

Salvo `ADR-CLD-000`, los IDs son reservas de catálogo, no ADR redactados ni aceptados. La aceptación de GCP habilita materializaciones dependientes del proveedor, pero cada una conserva su propia revisión y decisión.

## 21. Relación con Software/Dominio

| Artefacto Software | Dependencia o revisión Cloud | Frontera de responsabilidad |
| --- | --- | --- |
| `ADR-SW-001` **ACEPTADO** | `ADR-CLD-003` / `TDD-CLD-002` previstos | Software define unidad/límites; Cloud diseña despliegue/runtime. Revisión cruzada Cloud registrada en PR #24. |
| `ADR-SW-002` **ACEPTADO** | Configuración de adapters, identidades y secrets | Software define puertos/adaptadores; Cloud provee configuración e identidades de workload. Revisión cruzada Cloud registrada en PR #24. |
| `ADR-SW-003` **ACEPTADO** | `TDD-CLD-003` previsto | Software define transacciones y persistencia lógica; Cloud diseña servicio, conexiones y recuperación. Revisión cruzada Cloud registrada en PR #24. |
| `ADR-SW-004` **ACEPTADO** | `ADR-CLD-003` / `TDD-CLD-005` previstos | Software define outbox/Delivery; Cloud ejecuta worker y reintentos. Revisión cruzada Cloud aprobada en PR #17; estado formalizado y constancia registrada en PR #24. |
| `ADR-SW-005` **ACEPTADO** | `ADR-CLD-001` / `ADR-CLD-007` previstos | Software define auth/RBAC; Cloud protege entrada, workloads y recursos. Revisión cruzada Cloud aprobada en PR #17; estado formalizado y constancia registrada en PR #24. |
| `ADR-SW-006` previsto | `TDD-CLD-004` previsto | Software completa/detalla el contrato base de `Document`/acceso establecido en `TDD-SW-001`; Cloud materializa storage privado. |
| `TDD-SW-002` **BORRADOR** | `TDD-CLD-003` / `TDD-CLD-004` previstos | Software define Product/Category/FormVersion; Cloud valida publicación, almacenamiento y consistencia. Revisión cruzada Cloud pendiente de validación final. |
| `TDD-SW-005` **BORRADOR** | `ADR-CLD-003` / `TDD-CLD-005` previstos | Software define Assignment/Delivery/outbox; Cloud valida proveedor de email, webhooks y procesador. Revisión cruzada Cloud pendiente de validación final. |
| `TDD-SW-007` previsto | `ADR-CLD-006` / `TDD-CLD-007` previstos | Software define eventos de negocio; Cloud opera telemetría. |
| `TDD-SW-008` previsto | Entrada pública/API | Software define contrato API; Cloud define exposición/routing. |

`TDD-SW-001/003` están **APROBADOS** en `main`; `TDD-SW-003` fue integrado mediante PR #17 y formalizado junto con su revisión cruzada en PR #24. `TDD-SW-002/005` permanecen **BORRADOR** en `main`; la integración de la PR #20 no implica aprobación. **Software define semántica; Cloud define materialización y operación.** Los documentos deberán enlazarse entre sí sin duplicar decisiones ni confundir estado borrador con aprobación.

## 22. Pendientes funcionales MAPS

Permanecen abiertos el contrato definitivo de formularios, los campos de Mi perfil, efectos de baja de Cliente/Productor, efectos adicionales de inhabilitación, retención/eliminación y SLA/tratamiento operativo de derivación cuando corresponda. La [matriz de trazabilidad](../traceability.md) indica responsables y partes condicionadas. Esta Strategy puede orientar capacidades alrededor de esos huecos, pero **ninguna decisión técnica los cierra silenciosamente** ni habilita inventar comportamiento funcional.
