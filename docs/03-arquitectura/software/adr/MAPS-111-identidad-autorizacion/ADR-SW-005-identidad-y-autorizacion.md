# ADR — Identidad y autorización de la aplicación

| Dato | Valor |
| --- | --- |
| ID | `ADR-SW-005` |
| Título | Identidad, autenticación y autorización funcional (RBAC + ownership) |
| Estado | `PROPUESTO` |
| Fecha | 2026-10-01 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera (revisión cruzada cloud/seguridad); pendiente de validación final |
| Work item | [MAPS-111](https://santitalavera.atlassian.net/browse/MAPS-111) · subtarea [MAPS-136](https://santitalavera.atlassian.net/browse/MAPS-136) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-111 |
| Fase origen | [F1 §3/5, RN-02/04/05/14/15/16/17/18/19/20, RF-CLI-01, RF-PRODUCER-01/02/03, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §6/11/12/13](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-001](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-004](../MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md); [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); [TDD-SW-003](../../tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); TDD-SW-004, ADR-CLD-007 y TDD-CLD-006 (previstos, sin redactar) |
| Depende de | [ADR-SW-001](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); proveedor de identidad a confirmar con ADR-CLD-007 |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `PROPUESTO`, `ACEPTADO`, `RECHAZADO`, `REEMPLAZADO`.

## Contexto y problema

El Portal tiene tres roles autenticados (Cliente, Admin, Productor) con reglas de acceso que no se resuelven sólo con el rol:

- El Cliente accede sólo a sus propias solicitudes y a su perfil ([F2 §13](../../../../02-diseno/Fase_2__Design_Handoff.md)).
- El Productor accede sólo a DERIVADAS asignadas a su identidad, con autorización vigente y read-only (RN-05/16). No ve ASIGNADAS ni ENVIADAS; pierde el acceso cuando una DERIVADA se cancela (RF-PRODUCER-02).
- El email de derivación es un aviso. Para ver el expediente hace falta sesión autenticada ([F1 §5](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md)).
- El Admin opera ENVIADAS, asignaciones, incidencias, cancelaciones DERIVADA y el ABM de catálogo, formularios, Clientes y Productores (RN-04/13/14/15).

También hay que definir qué implica técnicamente dar de baja una cuenta. Las respuestas del relevamiento MAPS quedaron incorporadas como cambio controlado en RN-18, RN-19 y RN-20.

Límite software/cloud: este ADR decide el modelo de identidad de la aplicación, el de autorización y dónde se aplica cada uno. La elección y configuración del proveedor de identidad gestionado, secretos, IAM de infraestructura y políticas de red corresponden a ADR-CLD-007 y TDD-CLD-006 (previstos). El IAM cloud protege recursos de infraestructura; qué solicitud puede ver un Productor lo decide el RBAC de aplicación.

## Input funcional condicionado — no baseline vigente

| Regla | Fuente y estado |
| --- | --- |
| Login/registro antes de crear BORRADOR | RN-02 — CONFIRMADO |
| Productor sólo ve DERIVADAS asignadas, read-only, por identidad; no depende de enlace vencible | RN-05/16 — CONFIRMADO |
| Email no otorga acceso | [F1 §5](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) — CONFIRMADO |
| Matriz de permisos UX | [F2 §6/13](../../../../02-diseno/Fase_2__Design_Handoff.md) — CONFIRMADO; enforcement técnico F3 |
| Baja de Cliente = desactivar acceso operativo, conservando los datos personales | RN-18 — CONFIRMADO |
| Cliente dado de baja: pierde login de inmediato; sus ENVIADA/ASIGNADA/DERIVADA siguen su ciclo; el Admin conserva su historial; se le notifica | RN-18 — CONFIRMADO |
| Cliente dado de baja puede enviar una solicitud de alta para ser analizada | Respuesta MAPS registrada en RN-18; decisión de alcance Kondor: journey diferido fuera del MVP |
| Productor dado de baja: pierde acceso inmediato al Portal, incluido a sus DERIVADAS; se le notifica | RN-19 — CONFIRMADO |
| Sus ASIGNADAS y DERIVADAS requieren análisis/intervención de la organización; para el MVP, Kondor define que un Admin las trata antes de completar la baja | RN-19 — confirmado por MAPS y decisión de alcance Kondor MVP |
| Baja reversible (reactivación); Productor conservado en historial y auditoría | RN-19 — CONFIRMADO |
| Alcance de la inhabilitación de Productor | RN-20 — PENDIENTE MAPS |
| Campos de Mi perfil | `PENDIENTE FUNCIONAL MAPS` |

El relevamiento quedó registrado como cambio controlado de F1/F2 mediante RN-18, RN-19 y RN-20. Los pendientes se mantienen sólo donde esas reglas no fijan el detalle funcional o técnico.

## Drivers y criterios

| Driver o criterio | Importancia | Evidencia / fuente |
| --- | --- | --- |
| Aislamiento por identidad y ownership, no sólo por rol | Alta | RN-05/16, RNF-SEC-01 |
| Revocación inmediata de acceso (baja, cancelación DERIVADA, reasignación) | Alta | RF-PRODUCER-02, RN-18 y RN-19 |
| No operar credenciales propias si no es necesario | Alta | Riesgo de seguridad de almacenar y recuperar contraseñas |
| Autorización verificable sin infraestructura | Alta | [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md) |
| Deny by default; una sola fuente de verdad de permisos | Alta | Evitar reglas duplicadas en frontend, HTTP y consultas |
| Auditoría de accesos relevantes | Media | [F1 §5](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) |
| Independencia del proveedor de identidad | Media | Proveedor de auth no decidido ([F2 §14](../../../../02-diseno/Fase_2__Design_Handoff.md)) |

## Alternativas consideradas

### Autenticación

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| Autenticación propia (hash de contraseñas, recuperación, verificación de email en el código del Portal) | Control total; sin dependencia externa | Superficie de ataque y mantenimiento de seguridad a cargo del equipo; recuperación y verificación de email a construir | Descartada |
| Proveedor de identidad gestionado compatible con OIDC, detrás de un puerto | Credenciales, verificación de email y recuperación delegadas; MFA disponible si se requiere | Dependencia externa; mapeo entre identidad externa y cuenta del Portal; costo por usuario según proveedor | Propuesta elegida; proveedor a decidir con Cloud |
| Roles y permisos dentro de claims del proveedor | Menos consultas a la base | Revocación diferida hasta que expire el token; reglas de ownership igual requieren datos del Portal | Descartada como fuente de autorización |

### Autorización

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| RBAC puro (permiso por rol) | Simple | No expresa "sólo sus solicitudes" ni "sólo DERIVADAS asignadas y vigentes" | Descartada |
| RBAC + políticas de ownership/relación evaluadas en la capa de aplicación | Expresa todas las reglas F1/F2; testeable sin HTTP; un solo punto de enforcement | Requiere disciplina para no saltear políticas en consultas | Propuesta elegida |
| Motor de políticas externo (ABAC/ReBAC como servicio) | Flexibilidad y auditoría de políticas | Complejidad desproporcionada para tres roles | Descartada para el MVP |

## Decisión

Se **propone**:

### 1. Identidad

- La autenticación se delega en un proveedor de identidad gestionado compatible con OIDC, accedido sólo mediante el puerto `IdentityProviderPort` del módulo Identity ([ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md)). El proveedor concreto lo decide ADR-CLD-007.
- La cuenta del Portal (`UserIdentity`, [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md)) es la fuente de verdad de rol, estado de cuenta y vínculos con Customer/Producer. Se vincula con la identidad externa por su identificador estable (`subject`); el email no se usa como vínculo.
- En el MVP cada cuenta representa un único tipo de actor operativo: Cliente o Productor. Es una restricción explícita adoptada para simplificar el MVP: una misma persona que necesite ambos roles deberá utilizar dos cuentas independientes; no se modelan cuentas multirol en esta etapa. Cada cuenta del Portal se vincula a un único `subject` OIDC y un mismo `subject` no puede vincularse a dos cuentas; por lo tanto, las dos cuentas requieren identidades externas diferenciadas o un mecanismo equivalente que el proveedor permita y TDD-SW-004 debe precisar. El Cliente se registra por sí mismo. El Productor y el Admin no tienen autorregistro: el Admin da de alta Productores (invitación al email verificado) y las cuentas Admin se crean por un procedimiento controlado fuera del flujo público.

### 2. Sesión y verificación por request

- Cada request autenticado valida el token del proveedor y además consulta el estado de la cuenta en el Portal. Una cuenta dada de baja recibe rechazo en el siguiente request, aunque su token no haya expirado. La revocación de sesiones o tokens en el proveedor se solicita cuando sus capacidades lo permitan; la garantía efectiva para MAPS es el chequeo del estado local de la cuenta.
- El email de derivación contiene un enlace al Portal sin credenciales ni tokens de acceso: abrirlo exige iniciar sesión.

### 3. Autorización: RBAC + ownership

- Deny by default: cada caso de uso declara su política y, si no la tiene, se rechaza.
- Las políticas viven en la capa `application` del módulo owner y se evalúan antes de ejecutar el caso de uso. Los adaptadores HTTP sólo autentican y traducen. El frontend oculta acciones por UX, pero el control real está en la aplicación.
- Los listados filtran por ese mismo alcance en la propia consulta a la base.

| Rol | Regla de acceso a `InsuranceRequest` |
| --- | --- |
| Cliente | `request.customerId == actor.customerId`; acciones según estado ([F2 §6](../../../../02-diseno/Fase_2__Design_Handoff.md)) |
| Productor | `estado == DERIVADA`, Assignment vigente con `producerId == actor.producerId`, acceso no revocado y cuenta activa; sólo lectura |
| Admin | Operaciones de [F2 §13](../../../../02-diseno/Fase_2__Design_Handoff.md); no crea ni edita BORRADORES de Clientes |

El acceso del Productor se calcula a partir de estado, Assignment vigente y revocaciones, sin un permiso guardado aparte que pueda desincronizarse. Por eso cancelar una DERIVADA, reasignarla o dar de baja al Productor le quita el acceso sin pasos adicionales.

### 4. Estado de cuenta y efectos de baja propuestos

Estados de cuenta propuestos: `ACTIVA` y `BAJA` (reversible). Pertenecen a la cuenta y no modifican el estado de ninguna `InsuranceRequest`.

| Evento | Efecto en la aplicación |
| --- | --- |
| Baja de Cliente | Cuenta `BAJA`; sesiones revocadas; sin login. Los datos personales se conservan. ENVIADA/ASIGNADA/DERIVADA siguen su ciclo sin cambios. El Admin sigue viendo su historial. Aviso al Cliente por outbox ([ADR-SW-004](../MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md)). Auditoría |
| Baja de Productor | Cuenta `BAJA`; sesiones revocadas; acceso derivado a sus DERIVADAS deja de existir de inmediato. No recibe nuevas asignaciones. Antes de completar la baja, un Admin trata toda ASIGNADA o DERIVADA afectada; la DERIVADA conserva su estado y se reasigna mediante una nueva asignación, efectiva tras entrega exitosa. El Productor permanece en historial y auditoría. Aviso al Productor. Auditoría |
| Reactivación | Cuenta vuelve a `ACTIVA` por acción del Admin; auditoría y aviso. No restaura acceso a solicitudes ya reasignadas |
| Solicitud de alta de Cliente en `BAJA` | Respuesta MAPS registrada en RN-18; por decisión de alcance Kondor, el journey, canal y datos se difieren fuera del MVP actual. El modelo no presupone reactivación automática. |

RN-19 fija como decisión de alcance Kondor para el MVP que una DERIVADA afectada por la baja conserva su estado y se reasigna mediante una nueva asignación, efectiva tras la entrega exitosa al nuevo Productor. [TDD-SW-003](../../tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md) detalla su coordinación sin introducir un estado funcional nuevo; este ADR garantiza que el Productor dado de baja pierde el acceso de inmediato.

### 5. Inhabilitación de Productor

RN-20 mantiene pendiente de confirmación el alcance de la inhabilitación. Por eso, este ADR no modela un estado de inhabilitación separado hasta que MAPS cierre esa definición.

### 6. Auditoría de acceso

La aplicación audita los eventos que observa: alta/baja/reactivación de cuentas, cambios de rol, asignaciones, decisiones de autorización y cada apertura de expediente por un Productor. Los intentos de login fallidos sólo se incorporan cuando el IdP los expone mediante logs o eventos integrables; ADR-CLD-007/TDD-CLD-006 deben verificar esa capacidad. Los registros no incluyen respuestas, documentos ni PII innecesaria.

Esta decisión **no** elige proveedor de identidad, formato de token, duración de sesión ni política de MFA (ver pendientes), y no define los campos de Mi perfil.

## Consecuencias y trade-offs

### Positivas

- Las reglas de acceso de F1/F2 quedan en un solo lugar y se prueban sin infraestructura.
- La baja y la cancelación quitan acceso de inmediato, sin depender de la expiración de tokens.
- El acceso del Productor no puede quedar desincronizado con Assignment y estado.
- El equipo no almacena ni recupera contraseñas.

### Negativas y riesgos

- Una consulta de estado de cuenta por request (mitigable con caché corta, a evaluar con cloud).
- Dependencia de un proveedor externo para iniciar sesión; su caída impide nuevos logins.
- Las consultas de listado deben aplicar siempre el filtro de alcance; un descuido expone datos.
- La baja de Productor exige tratamiento operativo de ASIGNADAS y DERIVADAS antes de completarse; el detalle de interfaz se deriva en F2/F4.

## Revisión cruzada cloud

| Impacto | Documento cloud afectado | Estado de revisión |
| --- | --- | --- |
| Elección y configuración del proveedor de identidad gestionado; revocación de sesiones | ADR-CLD-007, TDD-CLD-006 (previstos) | Pendiente — Santiago Talavera |
| Secretos de integración con el proveedor y validación de tokens en la API | TDD-CLD-006 (previsto) | Pendiente — Santiago Talavera |
| Separación entre IAM de infraestructura y RBAC de aplicación | ADR-CLD-007 (previsto) | Pendiente — Santiago Talavera |
| Registro de auditoría de acceso sin PII en telemetría | TDD-CLD-007 (previsto) | Pendiente — Santiago Talavera |

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Alcance de inhabilitación de Productor | MAPS | Cerrar RN-20 antes de modelar un estado o efecto adicional de inhabilitación |
| Contradicción sobre inhabilitación de Productor | MAPS + Kondor | Confirmar que se elimina del MVP; si no, aplicar la alternativa del punto 5 |
| Journey de "solicitud de alta" de Cliente dado de baja | Kondor (F2) + MAPS | Definir canal, datos y pantalla; el modelo técnico se cierra en TDD-SW-004 |
| Reasignación de DERIVADA por baja de Productor | Kondor | Aplicar la decisión de alcance MVP de RN-19 y detallarla en [TDD-SW-003](../../tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md) |
| Campos de Mi perfil | `PENDIENTE FUNCIONAL MAPS` | Ownership y autorización avanzan; lista de campos se cierra en TDD-SW-004 |
| Política de MFA para Admin | Software + Cloud | Evaluar en ADR-CLD-007; recomendación: obligatorio para Admin por su alcance |
| Revisión cruzada cloud sin completar | Santiago Talavera | Completar la tabla antes de pasar a `ACEPTADO` |

## Criterios de revisión futura

Revisar si aparecen roles adicionales o sub-roles de Admin, cuentas con más de un rol, acceso de sistemas externos de MAPS o requisitos de identidad avanzada (verificación de identidad, SSO corporativo). Si cambia un ADR aceptado, crear uno nuevo que reemplace a `ADR-SW-005`.

## Registro de decisión

| Fecha | Decisión | Participantes | Observaciones |
| --- | --- | --- | --- |
| — | Pendiente: `ACEPTADO` o `RECHAZADO` | — | Requiere validar modelo de identidad, políticas de acceso, efectos de baja registrados y revisión cruzada cloud |

## Referencias y trazabilidad

- Fuentes F0/F1/F2: [F1 §3/5, RN-02/04/05/14/15/16/17/18/19/20, RF-CLI-01, RF-PRODUCER-01/02/03, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §6/11/12/13](../../../../02-diseno/Fase_2__Design_Handoff.md).
- ADR/TDD relacionados: [ADR-SW-001](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-004](../MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md), [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-003](../../tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); previstos TDD-SW-004, ADR-CLD-007, TDD-CLD-006.
- Filas de [traceability.md](../../../traceability.md): acceso del Productor; ABM de Clientes y Productores; Mi perfil.
