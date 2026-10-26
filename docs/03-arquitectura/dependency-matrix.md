# Matriz de dependencias Software ↔ Cloud

Estado: EN USO — F3

Owner de coordinación: Santiago Talavera

Ámbito: Software ↔ Cloud ↔ pendientes funcionales ↔ Jira

Naturaleza: artefacto transversal de coordinación; no es ADR ni TDD

Corte de estados consultados: 2026-10-26

`traceability.md` conserva la trazabilidad vertical F0/F1/F2 → ADR/TDD → F4. Esta matriz responde la pregunta horizontal: qué necesita cada frente de los demás para avanzar o cerrar sus diseños, qué puede continuar en paralelo y qué queda realmente condicionado. No reemplaza ni duplica la trazabilidad.

La baseline es el contenido integrado en `main`; las PR abiertas son deltas y no se consideran baseline hasta integrarse. PR #20 y PR #24 ya están integradas. `TDD-SW-002` y `TDD-SW-005` forman parte de `main` y permanecen `BORRADOR`; su integración no implica aprobación. El estado Jira, el estado documental y el estado de una PR son registros distintos y no se sustituyen entre sí.

Una dependencia abierta no implica por sí sola un bloqueo. Las filas identifican el artefacto concreto que queda condicionado; el trabajo que explícitamente puede avanzar se conserva en la columna correspondiente.

## Taxonomía y estados

Tipos de relación:

- `DURA`: el consumidor no puede cerrar el diseño sin un contrato o decisión concreta del proveedor.
- `COORDINACIÓN`: ambos lados pueden avanzar, pero deben revisar consistencia antes de formalizar.
- `PENDIENTE MAPS`: falta una decisión funcional o de negocio; puede condicionar sólo una parte del diseño.

Estados, independientes del tipo:

- `SATISFECHA`
- `ABIERTA — NO BLOQUEA AVANCE`
- `ABIERTA — BLOQUEA CIERRE`
- `PENDIENTE MAPS`

Los IDs `DEP-01` a `DEP-15` sólo identifican filas de esta matriz; no son Jira IDs ni identificadores arquitectónicos. Los enlaces Jira muestran el estado observado al corte indicado.

## Matriz principal — Resumen

Seleccioná una dependencia para consultar sus contratos, decisiones, límites y referencias.

| ID | Tema / frontera | Tipo | Estado | Owner actual | Siguiente acción |
| --- | --- | --- | --- | --- | --- |
| [DEP-01](#dep-01) | Persistencia ↔ base de datos | COORDINACIÓN | ABIERTA — NO BLOQUEA AVANCE | Cloud + Software | Avanzar sizing; RPO/RTO siguen abiertos. |
| [DEP-02](#dep-02) | Monolito modular / hexagonal ↔ topología y runtime materializado | COORDINACIÓN | ABIERTA — NO BLOQUEA AVANCE | Cloud + Software | C1 produce constraints; C4 materializa topología. |
| [DEP-03](#dep-03) | Outbox ↔ ejecución asíncrona | COORDINACIÓN | ABIERTA — NO BLOQUEA AVANCE | Software + Cloud | Diseñar runtime Outbox; mantener Delivery abierta. |
| [DEP-04](#dep-04) | Delivery exitosa ↔ infraestructura de email | COORDINACIÓN | ABIERTA — NO BLOQUEA AVANCE | Software/Cloud; MAPS compensación | Software y Cloud resuelven evidencia y callbacks. |
| [DEP-05](#dep-05) | Auth/RBAC ↔ seguridad e IAM Cloud | COORDINACIÓN | ABIERTA — NO BLOQUEA AVANCE | Software permisos; Cloud IAM | Avanzar C2 y coordinar ambientes con C3. |
| [DEP-06](#dep-06) | Mi perfil | PENDIENTE MAPS | PENDIENTE MAPS | MAPS + Software | Resolver con MAPS los campos de Mi perfil. |
| [DEP-07](#dep-07) | Baja e inhabilitación de Productor | PENDIENTE MAPS | PENDIENTE MAPS | MAPS alcance; Software/Cloud técnico | Confirmar RN-20 y secuencia funcional RN-19. |
| [DEP-08](#dep-08) | Public entry / environments ↔ frontend, API y exposición | COORDINACIÓN | ABIERTA — NO BLOQUEA AVANCE | Cloud; coord. Software/C2/C4 | Avanzar C3; preparar constraints para C4. |
| [DEP-09](#dep-09) | Formularios reales ↔ Product/FormVersion | PENDIENTE MAPS | PENDIENTE MAPS | MAPS; Software | Validar Products sin formulario y casos reales. |
| [DEP-10](#dep-10) | Adjuntos ↔ almacenamiento privado | COORDINACIÓN | ABIERTA — NO BLOQUEA AVANCE | Software + Cloud | Evaluar almacenamiento y coordinar staging. |
| [DEP-11](#dep-11) | Retención y eliminación | PENDIENTE MAPS | PENDIENTE MAPS | MAPS; Software/Cloud | Definir retención, eliminación y conservación. |
| [DEP-12](#dep-12) | Auditoría/analytics ↔ observabilidad | COORDINACIÓN | ABIERTA — NO BLOQUEA AVANCE | Software + Cloud | Diseñar telemetría sin ampliar eventos funcionales. |
| [DEP-13](#dep-13) | IaC / CI-CD ↔ topología y ambientes | COORDINACIÓN | ABIERTA — NO BLOQUEA AVANCE | Cloud; revisión Software | Iniciar Wave 2 con contratos estables. |
| [DEP-14](#dep-14) | SLA de derivación | PENDIENTE MAPS | PENDIENTE MAPS | MAPS; Software/Cloud | Definir SLA y consecuencias de incumplimiento. |
| [DEP-15](#dep-15) | RPO/RTO y recuperación | PENDIENTE MAPS | PENDIENTE MAPS | MAPS + Cloud | Obtener necesidades MAPS para derivar RPO/RTO. |

## Detalle por dependencia

<a id="dep-01"></a>
### DEP-01 — Persistencia ↔ base de datos

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | PostgreSQL nuevo del Portal; ACID, FK, ownership de tablas por módulo, UoW local y migraciones expand/contract. |
| Decisión / diseño Cloud | C1 evalúa Cloud SQL / PostgreSQL administrado, presupuesto de conexiones/pooling, ejecución de migraciones y backups/recovery cualitativos. |
| Input funcional MAPS | RPO/RTO siguen sin definir; ver DEP-15. |
| Owner actual | Cloud con revisión Software |
| Puede avanzar | C1 puede avanzar conexiones, concurrencia, migraciones y alternativas de base sobre el modelo lógico aceptado. |
| Bloquea | Cierre de objetivos y parámetros finales de backup/HA/recovery que dependan de RPO/RTO. |
| No bloquea | Evaluación del servicio de base y la mayor parte de TDD-CLD-003. |
| ADR/TDD relacionados | [ADR-SW-003](./software/adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [TDD-SW-001](./software/tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-003](./software/tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); previstos ADR-CLD-003, TDD-CLD-003. |
| Jira verificado (estado) | [MAPS-120 Cloud SQL (En curso)](https://santitalavera.atlassian.net/browse/MAPS-120), [MAPS-155 TDD-CLD-003 (En curso)](https://santitalavera.atlassian.net/browse/MAPS-155). |
| Siguiente acción | Continuar sizing de conexiones, migraciones y recuperación cualitativa; mantener objetivos cuantificados condicionados a DEP-15. |

<a id="dep-02"></a>
### DEP-02 — Monolito modular / hexagonal ↔ topología y runtime materializado

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | El monolito modular conserva su unidad lógica aunque API, worker y jobs se desplieguen por separado. |
| Decisión / diseño Cloud | C1 genera constraints desde las alternativas de runtime; C4 define topología GCP y materializa API/worker/jobs. |
| Input funcional MAPS | Ninguno para decidir límites lógicos o comparar runtimes. |
| Owner actual | Cloud con revisión Software |
| Puede avanzar | C1 puede comparar alternativas de runtime API/worker/jobs y producir constraints; C4 consume C1/C2/C3 para topología. |
| Bloquea | Cierre de topología y runtime materializado en TDD-CLD-001/002. |
| No bloquea | La decisión de límites lógicos Software y la comparación de runtimes API/worker/jobs. |
| ADR/TDD relacionados | [ADR-SW-001](./software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](./software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-CLD-000](./cloud/adr/MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md) acepta GCP; previstos ADR-CLD-003, TDD-CLD-001/002. |
| Jira verificado (estado) | [MAPS-118 runtime (En curso)](https://santitalavera.atlassian.net/browse/MAPS-118), [MAPS-119 topología (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-119), [MAPS-148 ADR-CLD-003 (En curso)](https://santitalavera.atlassian.net/browse/MAPS-148), [MAPS-153 TDD-CLD-001 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-153), [MAPS-154 TDD-CLD-002 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-154). |
| Siguiente acción | C1 documenta constraints de runtime; C4 resuelve topología/materialización cuando inputs C1/C2/C3 estén coordinados. |

<a id="dep-03"></a>
### DEP-03 — Outbox ↔ ejecución asíncrona

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | Outbox aceptado; entrega al menos una vez, claims/leases, fencing, retry y recuperación. `TDD-SW-005` está integrado en `main` con estado `BORRADOR`. |
| Decisión / diseño Cloud | Runtime de worker, scheduler/jobs, leases, backoff, recuperación y señales operativas. |
| Input funcional MAPS | El criterio de Delivery exitosa se separa en DEP-04. |
| Owner actual | Software define semántica; Cloud materializa ejecución |
| Puede avanzar | C1 puede avanzar el runtime Outbox y su coordinación transaccional; definir límites de concurrencia y recuperación. |
| Bloquea | Cierre de la integración de envío depende del contrato de Delivery de DEP-04. |
| No bloquea | El trabajo de runtime Outbox y el resto de C1. |
| ADR/TDD relacionados | [ADR-SW-004](./software/adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md), [TDD-SW-003](./software/tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); [TDD-SW-005](./software/tdd/MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md) `BORRADOR` en `main`; previstos ADR-CLD-003, TDD-CLD-005. |
| Jira verificado (estado) | [MAPS-114 Assignment/Delivery/Outbox (En revisión)](https://santitalavera.atlassian.net/browse/MAPS-114), [MAPS-142 TDD-SW-005 (En revisión)](https://santitalavera.atlassian.net/browse/MAPS-142), [MAPS-125 worker/email (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-125), [MAPS-157 TDD-CLD-005 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-157). |
| Siguiente acción | Diseñar claims, fencing, retry y recuperación como runtime; no asumir cerrada la semántica final de Delivery. |

<a id="dep-04"></a>
### DEP-04 — Delivery exitosa ↔ infraestructura de email

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | `TDD-SW-005` debe resolver qué evidencia (`ACEPTADO` vs `ENTREGADO`) habilita `DERIVADA`. ADR-SW-004 ya establece que un bounce informado después de `DERIVADA` se registra y NO revierte el estado; no existe transición funcional `DERIVADA → ASIGNADA`. |
| Decisión / diseño Cloud | Evaluar capacidades de proveedor, webhook/callbacks, reintentos/backoff, registro de callbacks tardíos/duplicados y tratamiento operativo. |
| Input funcional MAPS | MAPS puede definir si quiere una acción o notificación compensatoria ante un bounce posterior a `DERIVADA`; MAPS no decide evidencia técnica ni tratamiento de callbacks. |
| Owner actual | Software define evidencia y semántica técnica; Cloud valida capacidades; MAPS define sólo compensación funcional. |
| Puede avanzar | Software + Cloud pueden evaluar capacidades de proveedor, definir evidencia técnica y diseñar manejo de callbacks; MAPS puede decidir en paralelo una acción o notificación compensatoria. |
| Bloquea | Cierre técnico de `TDD-SW-005` y `TDD-CLD-005` / C6 una vez que Software + Cloud resuelvan criterios de evidencia y callbacks; no hay bloqueo funcional de MAPS. |
| No bloquea | Runtime Outbox de DEP-03, C1 y la máquina de estados aceptada; no se reabre DERIVADA. |
| ADR/TDD relacionados | [ADR-SW-004](./software/adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md); [TDD-SW-005](./software/tdd/MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md) `BORRADOR` en `main`; previsto TDD-CLD-005. |
| Jira verificado (estado) | [MAPS-114 (En revisión)](https://santitalavera.atlassian.net/browse/MAPS-114), [MAPS-142 TDD-SW-005 (En revisión)](https://santitalavera.atlassian.net/browse/MAPS-142), [MAPS-125 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-125), [MAPS-157 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-157), [MAPS-167 Ronda MAPS A (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-167). |
| Siguiente acción | Software y Cloud resuelven evidencia de entrega y callbacks tardíos/duplicados según capacidades del proveedor; MAPS decide sólo si necesita acción o notificación compensatoria. |

<a id="dep-05"></a>
### DEP-05 — Auth/RBAC ↔ seguridad e IAM Cloud

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | RBAC y ownership son reglas de aplicación; `IAM Cloud != RBAC de aplicación`. `TDD-SW-004` está previsto. |
| Decisión / diseño Cloud | C2 puede diseñar workload identities, service accounts, least privilege, Secret Manager como candidato, WIF/OIDC para workloads/pipelines cuando corresponda y trust boundaries. |
| Input funcional MAPS | No se necesitan campos finales de perfil para diseñar IAM; ver DEP-06. |
| Owner actual | Software para permisos funcionales; Cloud para seguridad/IAM |
| Puede avanzar | C2 puede avanzar identidades de workload, secretos y límites de confianza sin resolver permisos funcionales. |
| Bloquea | Cierre de autorización funcional corresponde a Software; materialización de IAM a TDD-CLD-006. |
| No bloquea | Estrategia de ambientes, separación por ambiente y promotion strategy, que pertenecen a C3. |
| ADR/TDD relacionados | [ADR-SW-005](./software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md); previstos TDD-SW-004, ADR-CLD-007, TDD-CLD-006. |
| Jira verificado (estado) | [MAPS-123 seguridad/IAM (En curso)](https://santitalavera.atlassian.net/browse/MAPS-123), [MAPS-152 ADR-CLD-007 (En curso)](https://santitalavera.atlassian.net/browse/MAPS-152), [MAPS-158 TDD-CLD-006 (En curso)](https://santitalavera.atlassian.net/browse/MAPS-158). |
| Siguiente acción | Avanzar C2 en identidades, mínimo privilegio, secretos candidatos, WIF/OIDC y trust boundaries; coordinar requisitos por ambiente con C3. |

<a id="dep-06"></a>
### DEP-06 — Mi perfil

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | `TDD-SW-004` debe definir los datos visibles, editables, requeridos y su propagación autorizada. |
| Decisión / diseño Cloud | Sólo ajustes de identidad/integración si el contrato funcional los afecta. |
| Input funcional MAPS | MAPS debe resolver los campos exactos de Mi perfil. |
| Owner actual | MAPS define; Software formaliza |
| Puede avanzar | Diseño general de autenticación y IAM puede continuar. |
| Bloquea | Cierre del contrato de perfil y de la parte correspondiente de `TDD-SW-004`. |
| No bloquea | IAM Cloud de C2, separación de ambientes y estrategia general de entrada pública. |
| ADR/TDD relacionados | [ADR-SW-005](./software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md); previsto TDD-SW-004. |
| Jira verificado (estado) | [MAPS-97 Mi perfil (En curso)](https://santitalavera.atlassian.net/browse/MAPS-97). |
| Siguiente acción | Incluir en MAPS-167 los campos visibles/editables/obligatorios; no convertirlos en requisito de IAM. |

<a id="dep-07"></a>
### DEP-07 — Baja e inhabilitación de Productor

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | RN-19 y TDD-SW-005 en `main` (`BORRADOR`) definen la mecánica técnica: cerrar Assignment anterior; mantener InsuranceRequest en `DERIVADA`; crear Assignment `PENDIENTE_ENTREGA`, que pasa a `EFECTIVO` tras Delivery exitosa. Sigue pendiente la confirmación funcional del alcance/secuencia de baja: el prototipo bloqueaba baja con solicitudes activas y MAPS respondió “informar a la Org para analizar cada caso”; confirmar antes de pasar TDD-SW-005 a `EN REVISIÓN`. |
| Decisión / diseño Cloud | Revocación/identidad se diseña sólo donde haya impacto de seguridad real; no condicionar toda la estrategia Cloud. |
| Input funcional MAPS | MAPS debe confirmar si la inhabilitación se mantiene en el MVP y su efecto sobre nuevas asignaciones. F1 registra que no habrá casos inhabilitados con solicitudes en curso. TDD-SW-005 indica que lo relevado apunta a retirar la inhabilitación del MVP, pero falta el cambio controlado en F1/F2. |
| Owner actual | MAPS define alcance funcional pendiente; Software/Cloud definen y materializan mecanismos técnicos afectados. |
| Puede avanzar | Mantener RN-19 y diseñar baja lógica/controles ya definidos; avanzar seguridad Cloud general. |
| Bloquea | Contrato aplicativo de inhabilitación y los cambios de revocación que dependan de RN-20. |
| No bloquea | Diseño base de C2 para IAM de workloads, secretos y trust boundaries; baja lógica ya establecida y diseños Cloud no afectados por la semántica de inhabilitación. Los mecanismos de revocación de identidad de usuario quedan sujetos al contrato aplicativo de RN-20. |
| ADR/TDD relacionados | [ADR-SW-005](./software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-003](./software/tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md), [TDD-SW-005](./software/tdd/MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md) (`BORRADOR` en `main`); previstos ADR-CLD-007/TDD-CLD-006. |
| Jira verificado (estado) | [MAPS-98 baja/inhabilitación (En revisión)](https://santitalavera.atlassian.net/browse/MAPS-98), [MAPS-123 seguridad/IAM (En curso)](https://santitalavera.atlassian.net/browse/MAPS-123), [MAPS-142 TDD-SW-005 (En revisión)](https://santitalavera.atlassian.net/browse/MAPS-142). |
| Siguiente acción | Confirmar con MAPS en MAPS-167 si RN-20 se mantiene en el MVP y su efecto sobre nuevas asignaciones; conservar como abierto el alcance/secuencia funcional de baja de RN-19 antes de revisar TDD-SW-005. |

<a id="dep-08"></a>
### DEP-08 — Public entry / environments ↔ frontend, API y exposición

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | `TDD-SW-008` está previsto; catálogo/FormVersion y contrato de caché/header requieren coordinación con `TDD-SW-002`. |
| Decisión / diseño Cloud | C3 define hosting frontend, public entry, DNS/TLS, routing/exposición, aislamiento de dev/staging/prod e integración de identities/secrets por ambiente con C2; promotion strategy a nivel de ambientes. C4 materializa topología en TDD-CLD-001/002. |
| Input funcional MAPS | Ninguno para estrategia general; formularios reales afectan sólo detalles de caché, ver DEP-09. |
| Owner actual | Cloud; coordinación C2/C4 y revisión Software |
| Puede avanzar | C3 puede avanzar estrategia pública y de ambientes, límites de exposición y promoción; definir constraints para C4. |
| Bloquea | Cierre de cache/headers y comportamiento API que dependan del contrato Software; topología materializada queda a C4. |
| No bloquea | Estrategia general de public entry, DNS/TLS, routing, aislamiento y promoción de ambientes. |
| ADR/TDD relacionados | Previstos `TDD-SW-008`, ADR-CLD-001/002; [TDD-SW-002](./software/tdd/MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md) `BORRADOR` en `main`; TDD-CLD-001/002 para C4. |
| Jira verificado (estado) | [MAPS-116 entrada pública (En curso)](https://santitalavera.atlassian.net/browse/MAPS-116), [MAPS-117 ambientes (En curso)](https://santitalavera.atlassian.net/browse/MAPS-117), [MAPS-146 ADR-CLD-001 (En curso)](https://santitalavera.atlassian.net/browse/MAPS-146), [MAPS-147 ADR-CLD-002 (En curso)](https://santitalavera.atlassian.net/browse/MAPS-147), [MAPS-139 TDD-SW-002 (En revisión)](https://santitalavera.atlassian.net/browse/MAPS-139), [MAPS-153 TDD-CLD-001 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-153), [MAPS-154 TDD-CLD-002 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-154). |
| Siguiente acción | Avanzar C3 en public entry y environments; luego C4 integra constraints de C1/C2/C3 y materializa topología. |

<a id="dep-09"></a>
### DEP-09 — Formularios reales ↔ Product/FormVersion

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | `TDD-SW-002` está integrado en `main` con estado `BORRADOR`; debe concretar esquema, validaciones, versionado y retiro. La obligatoriedad/cardinalidad Product–FormVersion no está cerrada. |
| Decisión / diseño Cloud | Impacto indirecto sobre catálogo público y caché; no define selección de plataforma ni runtime general. |
| Input funcional MAPS | MAPS debe resolver si todo Product publicado requiere FormVersion/formulario o si Products informativos como Incendio/Retiro pueden publicarse sin formulario; además validar 1–2 formularios reales. |
| Owner actual | MAPS define/valida; Software diseña |
| Puede avanzar | Puede avanzar el mecanismo de versionado, inmutabilidad, retiro y modelado del catálogo; obligatoriedad/cardinalidad Product–FormVersion queda condicionada a la decisión sobre Products sin formulario. |
| Bloquea | Regla final de publicación/cardinalidad Product–FormVersion, propiedades/validaciones finales del formulario y detalles de caché que dependan de ellas. |
| No bloquea | Selección de plataforma, runtime, topología y estrategia general de public entry. |
| ADR/TDD relacionados | ADR-SW-001/003; [TDD-SW-002](./software/tdd/MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md) `BORRADOR` en `main`; Cloud ADR-CLD-001/TDD-CLD-001 sólo por impacto indirecto. |
| Jira verificado (estado) | [MAPS-96 formularios reales (En curso)](https://santitalavera.atlassian.net/browse/MAPS-96), [MAPS-112 Product/formularios (En revisión)](https://santitalavera.atlassian.net/browse/MAPS-112), [MAPS-139 TDD-SW-002 (En revisión)](https://santitalavera.atlassian.net/browse/MAPS-139). |
| Siguiente acción | Llevar ambas preguntas —Products sin formulario como Incendio/Retiro y 1–2 formularios reales— a MAPS-167; no inferir una regla hasta validar el contrato funcional. |

<a id="dep-10"></a>
### DEP-10 — Adjuntos ↔ almacenamiento privado

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | ADR-SW-006/TDD-SW-006 están previstos; TDD-SW-001 modela `Document` como metadata y referencia a un archivo privado, deja el storage físico bajo ownership Cloud y reserva el detalle de documentos para TDD-SW-006. La consistencia detallada del flujo queda para TDD-SW-006. |
| Decisión / diseño Cloud | TDD-CLD-004 debe evaluar privacidad por defecto, aislamiento, autorización y modalidad de acceso; Storage sigue candidato. |
| Input funcional MAPS | La retención/eliminación final se separa en DEP-11. |
| Owner actual | Software define modelo/consistencia; Cloud almacenamiento/IAM |
| Puede avanzar | Puede avanzar el análisis de almacenamiento privado, aislamiento, IAM, modalidades de acceso y alternativas de staging/cleanup, que deberán reconciliarse con TDD-SW-006. |
| Bloquea | Cierre de lifecycle/eliminación y cualquier plazo sujeto a DEP-11; consistencia detallada del flujo documental hasta acordarla con TDD-SW-006. |
| No bloquea | Diseño conceptual de almacenamiento privado, IAM y separación metadata/binario; no se acepta aquí un mecanismo de staging/cleanup. |
| ADR/TDD relacionados | [TDD-SW-001](./software/tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); previstos ADR-SW-006/TDD-SW-006, TDD-CLD-004, ADR-CLD-007. |
| Jira verificado (estado) | [MAPS-124 Cloud Storage (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-124), [MAPS-156 TDD-CLD-004 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-156), [MAPS-115 adjuntos/auditoría/analytics/API (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-115). |
| Siguiente acción | Evaluar alternativas de almacenamiento y acceso; coordinar staging/cleanup con Software antes de fijar mecanismos en TDD-SW-006/TDD-CLD-004. |

<a id="dep-11"></a>
### DEP-11 — Retención y eliminación

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | Contratos de datos/adjuntos deben soportar reglas aprobadas; no inferir un periodo desde el almacenamiento técnico. |
| Decisión / diseño Cloud | Lifecycle, eliminación física y conservación de copias deben seguir reglas funcionales/legalmente aplicables. |
| Input funcional MAPS | MAPS debe definir retención, eliminación y conservación. |
| Owner actual | MAPS decide; Software y Cloud materializan |
| Puede avanzar | Preparar opciones y controles; separar borrado lógico, eliminación física y ciclo de backups. |
| Bloquea | Cierre de lifecycle de TDD-CLD-004 y contrato de datos/adjuntos afectado. |
| No bloquea | Diseño de almacenamiento privado y controles no dependientes de los plazos. |
| ADR/TDD relacionados | Previsto ADR-SW-006/TDD-SW-006 y TDD-CLD-004; [TDD-SW-001](./software/tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md) no fija plazo funcional. |
| Jira verificado (estado) | [MAPS-99 F1 — Definir retención, eliminación y SLA operativo de derivación (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-99), [MAPS-124 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-124), [MAPS-156 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-156). |
| Siguiente acción | Preguntar a MAPS plazos y conservación; traducir la respuesta en reglas de datos y lifecycle sin editar F1 silenciosamente. |

<a id="dep-12"></a>
### DEP-12 — Auditoría/analytics ↔ observabilidad

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | `TDD-SW-007` está previsto; separar auditoría de negocio, eventos de producto y telemetría operacional. |
| Decisión / diseño Cloud | Cloud puede definir métricas, logs, trazas, alertas, retención técnica y controles de PII operativa. |
| Input funcional MAPS | No se requieren nuevos eventos de negocio para diseñar telemetría operacional. |
| Owner actual | Software define eventos de negocio; Cloud telemetría |
| Puede avanzar | C5 puede diseñar observabilidad operacional y minimización de datos. |
| Bloquea | Cierre de taxonomía de eventos de negocio/analytics depende de Software y requisitos MAPS pertinentes. |
| No bloquea | Alertas, métricas y trazas de operación que no dependan del catálogo funcional de eventos. |
| ADR/TDD relacionados | Previstos TDD-SW-007, ADR-CLD-006/TDD-CLD-007. |
| Jira verificado (estado) | [MAPS-122 observabilidad (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-122), [MAPS-151 ADR-CLD-006 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-151), [MAPS-159 TDD-CLD-007 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-159). |
| Siguiente acción | Diseñar telemetría operacional con protección de datos; no inventar eventos de auditoría o producto. |

<a id="dep-13"></a>
### DEP-13 — IaC / CI-CD ↔ topología y ambientes

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | Software entrega artefactos/versiones y contratos de configuración; no impone herramienta IaC ni pipeline. |
| Decisión / diseño Cloud | ADR-CLD-004/005 y TDD-CLD-008 deben materializar infraestructura, promoción y WIF coherentes con runtime/ambientes. |
| Input funcional MAPS | No depende de una decisión funcional MAPS para empezar la base técnica. |
| Owner actual | Cloud; revisión Software sobre artefactos |
| Puede avanzar | Wave 2 puede iniciar plantillas y pipeline una vez estabilizados los contratos principales de Wave 1. |
| Bloquea | Cierre de despliegue reproducible hasta estabilizar topología, ambientes e IAM. |
| No bloquea | Diseño de IaC/CI-CD inicial no dependiente de cada servicio final. |
| ADR/TDD relacionados | Previstos ADR-CLD-004/005, TDD-CLD-008; coordinación con ADR-CLD-002/003/007. |
| Jira verificado (estado) | [MAPS-121 IaC/CI-CD (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-121), [MAPS-149 ADR-CLD-004 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-149), [MAPS-150 ADR-CLD-005 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-150), [MAPS-160 TDD-CLD-008 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-160). |
| Siguiente acción | Iniciar Wave 2 con contratos estables; actualizar referencias tras definir runtime, ambientes y flujo de identidad. |

<a id="dep-14"></a>
### DEP-14 — SLA de derivación

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | Delivery debe distinguir estado de negocio de aceptación técnica del proveedor y exponer señales operativas útiles. |
| Decisión / diseño Cloud | Definir SLO/alertas/operación del worker sin inventar un plazo de negocio. |
| Input funcional MAPS | MAPS debe definir SLA/expectativa temporal de derivación. |
| Owner actual | MAPS decide; Software y Cloud especifican efectos |
| Puede avanzar | Instrumentación, retry y manejo técnico pueden diseñarse sin fijar SLA. |
| Bloquea | Umbrales/alertas de incumplimiento de negocio y cierre operacional de Delivery que dependan del SLA. |
| No bloquea | Runtime Outbox, mecanismo de retry y observabilidad base. |
| ADR/TDD relacionados | ADR-SW-004; [TDD-SW-005](./software/tdd/MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md) `BORRADOR` en `main`; previstos TDD-CLD-005/TDD-CLD-007. |
| Jira verificado (estado) | [MAPS-99 F1 — Definir retención, eliminación y SLA operativo de derivación (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-99), [MAPS-125 worker/email (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-125), [MAPS-157 TDD-CLD-005 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-157). |
| Siguiente acción | Preguntar expectativa temporal y consecuencias de incumplimiento en MAPS-167; mantener los retries sin un SLA inventado. |

<a id="dep-15"></a>
### DEP-15 — RPO/RTO y recuperación

| Aspecto | Detalle |
| --- | --- |
| Contrato / input Software | No hay requisito MAPS cuantificado; los valores de comparación anteriores no constituyen acuerdo. |
| Decisión / diseño Cloud | Diseñar backups y opciones de HA/restore; convertir objetivos en parámetros sólo después de decisión MAPS. |
| Input funcional MAPS | MAPS debe expresar necesidades de pérdida de datos y tiempo de recuperación; no proponerlas como ya acordadas. |
| Owner actual | MAPS define objetivos; Cloud diseña recuperación |
| Puede avanzar | Mayor parte de TDD-CLD-003, backups y análisis de alternativas puede avanzar cualitativamente. |
| Bloquea | Cierre de objetivos de HA/recovery y parámetros finales de backup/restore. |
| No bloquea | Diseño inicial de Cloud SQL, conexión, migraciones y análisis de opciones de recuperación. |
| ADR/TDD relacionados | [ADR-SW-003](./software/adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md); previsto TDD-CLD-003. |
| Jira verificado (estado) | [MAPS-167 Ronda MAPS A (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-167), [MAPS-120 Cloud SQL (En curso)](https://santitalavera.atlassian.net/browse/MAPS-120), [MAPS-155 TDD-CLD-003 (En curso)](https://santitalavera.atlassian.net/browse/MAPS-155). |
| Siguiente acción | Obtener necesidades expresadas por MAPS en MAPS-167; no asignar números de RPO/RTO antes de esa respuesta. |

## Bloqueos reales actuales

- La decisión técnica sobre evidencia de Delivery (`ACEPTADO` vs `ENTREGADO`) y callbacks tardíos/duplicados corresponde a Software + Cloud; MAPS sólo define si necesita acción/notificación compensatoria ante un bounce posterior a `DERIVADA` (DEP-04). Puede condicionar el cierre técnico de TDD-SW-005/TDD-CLD-005, pero no bloquea runtime Outbox/C1.
- Cierre de lifecycle/eliminación final de adjuntos depende de retención y conservación definidas por MAPS (DEP-11); privacidad, acceso y arquitectura general de Storage pueden avanzar.
- Las decisiones finales de HA/recovery y parámetros de recuperación dependen de RPO/RTO de negocio aún no definidos (DEP-15); no bloquea la mayor parte de TDD-CLD-003.
- Cierre de SLA/alertas de negocio depende de una expectativa de derivación definida por MAPS (DEP-14); instrumentación y operación técnica base pueden avanzar.
- Contrato final de Product/FormVersion depende de resolver si existen Products publicables sin formulario y de validar 1–2 formularios reales; campos finales de Mi perfil dependen de MAPS; RN-20 limita sólo el diseño aplicativo afectado (DEP-06/07/09).
- Detalles de cache/headers quedan condicionados al contrato API/Product, sin bloquear la estrategia general de entrada pública (DEP-08/09).

## Trabajo que puede avanzar ahora

- **C1 — Runtime + Database (ADR-CLD-003 / TDD-CLD-003):** evaluar alternativas de runtime API/worker/jobs y Cloud SQL / PostgreSQL administrado; avanzar ejecución Outbox, concurrency/leases/fencing, conexiones/pooling, migraciones y backups/recovery cualitativo. C1 puede producir constraints para topología, pero no es el paquete de topología.
- **C2 — Security / IAM (ADR-CLD-007 / TDD-CLD-006):** avanzar workload identities, service accounts, least privilege, Secret Manager como candidato, WIF/OIDC para workloads/pipelines cuando corresponda y trust boundaries. No asignar a C2 promotion ni estrategia de ambientes.
- **C3 — Public Entry + Environments (ADR-CLD-001 / ADR-CLD-002):** avanzar frontend/public entry, DNS/TLS, routing, exposición, aislamiento dev/staging/prod, identities/secrets separados por ambiente en coordinación con C2 y promotion strategy de ambientes.
- **C4 — Topology + materialized runtime (TDD-CLD-001 / TDD-CLD-002):** puede avanzar cuando integre principalmente constraints de C1, C2 y C3; materializa la topología, sin reinterpretar límites del monolito modular.

La selección de servicios GCP sigue sujeta a los ADR/TDD correspondientes; esta matriz no acepta Cloud Run, Cloud SQL, Cloud Storage ni otra tecnología.

## Inputs derivados para MAPS-167 — Ronda MAPS A

1. Resolver si todo Product publicado requiere FormVersion/formulario o si pueden publicarse Products informativos sin formulario; además validar el contrato con 1–2 formularios reales (MAPS-96).
2. Definir campos visibles, editables y obligatorios de Mi perfil (MAPS-97).
3. Confirmar si la inhabilitación RN-20 se mantiene en el MVP y qué efecto tiene sobre nuevas asignaciones (MAPS-98); F1 ya registra que no habrá casos inhabilitados con solicitudes en curso. Mantener abierta la confirmación funcional del alcance/secuencia de baja RN-19 antes de pasar TDD-SW-005 a `EN REVISIÓN`.
4. Definir si MAPS quiere una acción o notificación compensatoria ante un bounce posterior a `DERIVADA`, sin revertir ese estado (TDD-SW-005 / MAPS-114, MAPS-142). La evidencia que habilita `DERIVADA` (`ACEPTADO` o `ENTREGADO`) y los callbacks tardíos/duplicados son decisiones técnicas de Software + Cloud, no inputs para MAPS.
5. Definir retención, eliminación física y conservación aplicables a solicitudes y archivos (MAPS-99).
6. Definir expectativa/SLA de derivación y consecuencia operativa de su incumplimiento (MAPS-99).
7. Expresar necesidades de negocio de pérdida de datos y tiempo de recuperación para que Cloud derive RPO/RTO; no presentar cifras previas como requisito (MAPS-167).

No se pregunta a MAPS por selección de servicios Cloud: las preguntas de esta ronda son entradas de negocio; la selección y materialización técnica siguen su proceso ADR/TDD.

## Regla de mantenimiento

Actualizar esta matriz cuando se integre un ADR/TDD relevante; cambie su estado documental; MAPS resuelva un input; aparezca, cambie o se cierre una dependencia dura; antes de la revisión cruzada Cloud Wave 1 de [MAPS-165 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-165); y antes del gate F3 → F4 Tranche 1 de [MAPS-169 (Por hacer)](https://santitalavera.atlassian.net/browse/MAPS-169). Al actualizar, revisar `main` como baseline, tratar las PR abiertas sólo como deltas hasta su integración y verificar por separado los estados Jira y documentales.
