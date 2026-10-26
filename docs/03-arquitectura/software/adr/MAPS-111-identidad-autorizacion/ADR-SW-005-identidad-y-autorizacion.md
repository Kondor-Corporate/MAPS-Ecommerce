# ADR — Identidad y autorización de la aplicación

| Dato | Valor |
| --- | --- |
| ID | `ADR-SW-005` |
| Título | Identidad, autenticación y autorización funcional (RBAC + ownership) |
| Estado | `ACEPTADO` |
| Fecha | 2026-10-01 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera — revisión cruzada Cloud/seguridad favorable con cambios; conformidad final `APPROVED` en PR #17 el 2026-10-17, constancia incorporada 2026-10-22 |
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

También hay que definir qué implica técnicamente dar de baja una cuenta. Las respuestas del relevamiento MAPS ([transcripción del relevamiento](../../../../01-producto/Relevamiento-MAPS-bajas-e-inhabilitacion.md)) quedaron incorporadas como cambio controlado en RN-18, RN-19 y RN-20.

Límite software/cloud: este ADR decide el modelo de identidad de la aplicación, el de autorización y dónde se aplica cada uno. La elección y configuración del proveedor de identidad gestionado, secretos, IAM de infraestructura y políticas de red corresponden a ADR-CLD-007 y TDD-CLD-006 (previstos). El IAM cloud protege recursos de infraestructura; qué solicitud puede ver un Productor lo decide el RBAC de aplicación.

## Baseline funcional y pendientes

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

El relevamiento de bajas e inhabilitación quedó registrado como cambio controlado de F1/F2 mediante RN-18, RN-19 y RN-20; sus preguntas y respuestas originales están en la [transcripción del relevamiento](../../../../01-producto/Relevamiento-MAPS-bajas-e-inhabilitacion.md). Los pendientes se mantienen sólo donde esas reglas no fijan el detalle funcional o técnico.

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
| Proveedor de identidad gestionado compatible con OIDC, detrás de un puerto | Credenciales, verificación de email y recuperación delegadas; MFA disponible si se requiere | Dependencia externa; mapeo entre identidad externa y cuenta del Portal; costo por usuario según proveedor | Elegida; proveedor a decidir con Cloud |
| Roles y permisos dentro de claims del proveedor | Menos consultas a la base | Revocación diferida hasta que expire el token; reglas de ownership igual requieren datos del Portal | Descartada como fuente de autorización |

### Autorización

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| RBAC puro (permiso por rol) | Simple | No expresa "sólo sus solicitudes" ni "sólo DERIVADAS asignadas y vigentes" | Descartada |
| RBAC + políticas de ownership/relación evaluadas en la capa de aplicación | Expresa todas las reglas F1/F2; testeable sin HTTP; un solo punto de enforcement | Requiere disciplina para no saltear políticas en consultas | Elegida |
| Motor de políticas externo (ABAC/ReBAC como servicio) | Flexibilidad y auditoría de políticas | Complejidad desproporcionada para tres roles | Descartada para el MVP |

## Decisión

Se **decide**:

### 1. Identidad

- La autenticación se delega en un proveedor de identidad gestionado compatible con OIDC, accedido sólo mediante el puerto `IdentityProviderPort` del módulo Identity ([ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md)). El proveedor concreto lo decide ADR-CLD-007.
- La cuenta del Portal (`UserIdentity`, [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md)) es la fuente de verdad de rol, estado de cuenta y vínculos con Customer/Producer. Se vincula con la identidad externa por su identificador estable: el par `issuer + subject`, que admite más de un emisor sin colisiones. El email no se usa como vínculo.
- En el MVP cada cuenta tiene un único rol: Cliente, Productor o Admin. Es una **restricción propuesta del MVP, condicionada a la factibilidad que confirme ADR-CLD-007**: una persona que necesite dos roles usa dos cuentas independientes y no se modelan cuentas multirol en esta etapa.
  - Cada cuenta se vincula a un único `issuer + subject` y un mismo `issuer + subject` no puede vincularse a dos cuentas. Como la mayoría de los proveedores OIDC asocian una identidad por email, la consecuencia práctica esperada es que esa persona necesite **dos emails distintos**; si el proveedor elegido no lo admite o MAPS no lo acepta, la restricción se revisa antes de cerrar TDD-SW-004.
  - Revertirla es de bajo costo: el modelo de TDD-SW-001 (`UserIdentity → Customer 0..1`, `UserIdentity → Producer 0..1`) ya admite ambos vínculos; lo que cambiaría es la selección de rol activo en la sesión y las políticas.
  - El Cliente se registra por sí mismo. El Productor no tiene autorregistro: el Admin lo da de alta mediante invitación al email verificado.
  - Admin: cuenta de rol único, sin vínculos a Customer ni Producer, con su propio `issuer + subject`, creada por un procedimiento controlado fuera del flujo público. Una persona Admin que también sea Cliente o Productor usa otra cuenta. **MFA obligatorio para Admin** como requisito mínimo de seguridad, a verificar en soporte y enforcement del IdP elegido (ADR-CLD-007).

### 2. Sesión y verificación por request

- Cada request autenticado valida el token del proveedor (firma, emisor, audiencia y expiración; el detalle lo fijan TDD-SW-004 y TDD-CLD-006) y además consulta el estado de la cuenta en el Portal.
- La revocación tiene tres capas distintas, con garantías distintas:

| Capa | Garantía |
| --- | --- |
| Permisos locales del Portal | **Garantía verificable para MAPS:** toda request que empieza después del commit de la baja es rechazada, aunque el token siga vigente. Para sostenerla, el estado de cuenta no se cachea en el MVP; si Cloud introduce una caché, su TTL máximo es la demora aceptada y debe documentarse en TDD-CLD-006. Las operaciones sensibles (comandos de escritura y apertura de expediente) releen el estado de cuenta dentro de su propia unidad de trabajo, sin caché. Una lectura ya autorizada que estaba en curso puede terminar; un comando en curso que relee una cuenta en `BAJA` se rechaza |
| Sesión en el IdP | Se solicita su revocación cuando el proveedor lo permita (ADR-CLD-007/TDD-CLD-006); no es la garantía de aplicación |
| Tokens ya emitidos | Siguen siendo criptográficamente válidos hasta expirar; se recomienda un TTL corto de access token. El chequeo local los vuelve inútiles para operar en el Portal |

- El email de derivación contiene un enlace al Portal sin credenciales ni tokens de acceso: abrirlo exige iniciar sesión.

### 3. Autorización: RBAC + ownership

- Deny by default: cada caso de uso declara su política y, si no la tiene, se rechaza.
- Las políticas viven en la capa `application` del módulo owner y se evalúan antes de ejecutar el caso de uso. Los adaptadores HTTP sólo autentican y traducen. El frontend oculta acciones por UX, pero el control real está en la aplicación.
- Los listados filtran por ese mismo alcance en la propia consulta a la base.

| Rol | Regla de acceso a `InsuranceRequest` |
| --- | --- |
| Cliente | `request.customerId == actor.customerId`; acciones según estado ([F2 §6](../../../../02-diseno/Fase_2__Design_Handoff.md)) |
| Productor | `estado == DERIVADA`, Assignment **`EFECTIVO`** con `producerId == actor.producerId` y cuenta activa; sólo lectura |
| Admin | Operaciones de [F2 §13](../../../../02-diseno/Fase_2__Design_Handoff.md); no crea ni edita BORRADORES de Clientes |

El acceso del Productor se calcula a partir de estado y Assignment efectivo, sin un permiso guardado aparte que pueda desincronizarse. Por eso cancelar una DERIVADA, reasignarla o dar de baja al Productor le quita el acceso sin pasos adicionales.

**Asignación autorizante (RN-19).** "Assignment vigente" no alcanza como regla: en `ReassignDerived` la solicitud ya es DERIVADA mientras la nueva asignación todavía espera su entrega, así que la condición de estado no protege. Por eso la política exige un Assignment `EFECTIVO`:

- `PENDIENTE_ENTREGA` (asignación creada, entrega aún no exitosa) **no autoriza**: el nuevo Productor no obtiene acceso antes de la entrega exitosa.
- `EFECTIVO` (entrega exitosa acreditada) autoriza.
- `CERRADO` (reasignada, cancelada o baja del Productor) **no autoriza**: el Productor anterior pierde el acceso al cerrarse su asignación.

Estos estados son de Assignment, no de `InsuranceRequest`; los define [TDD-SW-003](../../tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md) y su vigencia, efectividad y concurrencia se detallan en TDD-SW-005. Un resultado de entrega duplicado o tardío nunca vuelve `EFECTIVO` un Assignment `CERRADO`.

### 4. Estado de cuenta y efectos de baja

Estados de cuenta: `ACTIVA` y `BAJA` (reversible). Pertenecen a la cuenta y no modifican el estado de ninguna `InsuranceRequest`.

| Evento | Efecto en la aplicación |
| --- | --- |
| Baja de Cliente | Cuenta `BAJA`; rechazo desde la siguiente request y revocación de sesión en el IdP cuando lo permita; sin login. Los datos personales se conservan. ENVIADA/ASIGNADA/DERIVADA siguen su ciclo sin cambios. El Admin sigue viendo su historial. Aviso al Cliente por outbox ([ADR-SW-004](../MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md)). Auditoría |
| Baja de Productor | Cuenta `BAJA`; rechazo desde la siguiente request y revocación de sesión en el IdP cuando lo permita; acceso derivado a sus DERIVADAS deja de existir de inmediato. No recibe nuevas asignaciones. Antes de completar la baja, un Admin trata toda ASIGNADA o DERIVADA afectada; la DERIVADA conserva su estado y se reasigna mediante una nueva asignación, efectiva tras entrega exitosa. El Productor permanece en historial y auditoría. Aviso al Productor. Auditoría |
| Reactivación | Cuenta vuelve a `ACTIVA` por acción del Admin; auditoría y aviso. No restaura acceso a solicitudes ya reasignadas |
| Solicitud de alta de Cliente en `BAJA` | Respuesta MAPS registrada en RN-18; por decisión de alcance Kondor, el journey, canal y datos se difieren fuera del MVP actual. El modelo no presupone reactivación automática. |

RN-19 fija como decisión de alcance Kondor para el MVP que una DERIVADA afectada por la baja conserva su estado y se reasigna mediante una nueva asignación, efectiva tras la entrega exitosa al nuevo Productor. [TDD-SW-003](../../tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md) detalla su coordinación sin introducir un estado funcional nuevo; este ADR garantiza que el Productor dado de baja pierde el acceso de inmediato.

### 5. Inhabilitación de Productor

RN-20 mantiene pendiente de confirmación el alcance de la inhabilitación. Por eso, este ADR no modela un estado de inhabilitación separado hasta que MAPS cierre esa definición.

### 6. Auditoría de acceso

La aplicación audita los eventos que observa: alta/baja/reactivación de cuentas, cambios de rol, asignaciones, decisiones de autorización y cada apertura de expediente por un Productor. Los intentos de login fallidos sólo se incorporan cuando el IdP los expone mediante logs o eventos integrables; ADR-CLD-007/TDD-CLD-006 deben verificar esa capacidad. Los registros no incluyen respuestas, documentos ni PII innecesaria.

Esta decisión **no** elige proveedor de identidad, formato de token ni duración de sesión (ver pendientes), y no define los campos de Mi perfil. Sí fija MFA obligatorio para Admin como requisito, sujeto a verificación en el IdP elegido.

## Consecuencias y trade-offs

### Positivas

- Las reglas de acceso de F1/F2 quedan en un solo lugar y se prueban sin infraestructura.
- La baja y la cancelación quitan acceso desde la siguiente request, sin depender de la expiración de tokens.
- El acceso del Productor no puede quedar desincronizado con Assignment y estado.
- El equipo no almacena ni recupera contraseñas.

### Negativas y riesgos

- Una consulta de estado de cuenta por request. Una caché reduce la carga pero agrega su TTL a la demora de revocación; sólo se introduce si Cloud la justifica y documenta ese límite.
- Una persona con dos roles necesita dos cuentas y, probablemente, dos emails (restricción propuesta del MVP).
- Dependencia de un proveedor externo para iniciar sesión; su caída impide nuevos logins.
- Las consultas de listado deben aplicar siempre el filtro de alcance; un descuido expone datos.
- La baja de Productor exige tratamiento operativo de ASIGNADAS y DERIVADAS antes de completarse; el detalle de interfaz se deriva en F2/F4.

## Revisión cruzada cloud

**Revisor:** Santiago Talavera. **Revisión original:** 2026-10-14. **Resultado:** favorable con cambios solicitados, incorporados antes de la conformidad final `APPROVED` del 2026-10-17 en la [PR #17](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/17). **Constancia formal:** [PR #24](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/24), incorporada el 2026-10-22.

El análisis detallado y la distinción entre observaciones originales y correcciones ya incorporadas se publican como comentario individual en la PR #24. IdP, MFA, cuentas/roles, secretos, revocación efectiva y auditoría permanecen bajo ADR-CLD-007 y TDD-CLD-006/007; RN-20 y demás condiciones funcionales identificadas continúan pendientes de MAPS.

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Alcance de inhabilitación de Productor | MAPS | Cerrar RN-20 antes de modelar un estado o efecto adicional de inhabilitación |
| Journey de "solicitud de alta" de Cliente dado de baja | Kondor + MAPS | Diferido fuera del MVP por decisión de alcance Kondor (RN-18); no condiciona este ADR. Si se incorpora, se registra como cambio controlado en F1/F2 y se modela en TDD-SW-004 |
| Campos de Mi perfil | `PENDIENTE FUNCIONAL MAPS` | Ownership y autorización avanzan; lista de campos se cierra en TDD-SW-004 |
| Factibilidad de una cuenta por rol frente al IdP | Software + Cloud | ADR-CLD-007 confirma si el proveedor admite identidades diferenciadas para una misma persona (p. ej. dos emails); si no, o si MAPS no lo acepta, se revisa la restricción antes de cerrar TDD-SW-004 |
| MFA obligatorio para Admin | Software + Cloud | Requisito fijado por este ADR; ADR-CLD-007 verifica soporte y enforcement en el IdP elegido |
| Validación de tokens | Software + Cloud | TDD-SW-004 / TDD-CLD-006: firma, emisor, audiencia, expiración, rotación de claves y rechazo por cuenta inactiva |
| Operación de identidad | Cloud + Software | ADR-CLD-007 / TDD-CLD-006: disponibilidad del IdP, invitaciones y altas de Productores, creación controlada de Admin, gestión y revocación de sesiones, recuperación de acceso y manejo de fallos |
| Autorización de consultas y auditoría | Software + Cloud | TDD-SW-004: ninguna lectura optimizada saltea el filtro de ownership. TDD-CLD-007: minimizar PII en AuditEvent, logs y trazas |

## Criterios de revisión futura

Revisar si aparecen roles adicionales o sub-roles de Admin, cuentas con más de un rol, acceso de sistemas externos de MAPS o requisitos de identidad avanzada (verificación de identidad, SSO corporativo). Si cambia un ADR aceptado, crear uno nuevo que reemplace a `ADR-SW-005`.

## Registro de decisión

| Fecha | Decisión | Participantes | Observaciones |
| --- | --- | --- | --- |
| 2026-10-14 | `PROPUESTO` | Joaquin Rodriguez (owner de software) | Propuesto en el PR #17 (modelo de identidad, políticas de acceso y efectos de baja de RN-18/RN-19). La revisión cruzada cloud de Santiago Talavera (2026-10-14) dictaminó favorable al enfoque con cambios solicitados; su conformidad y la aceptación se registran cuando se cierren |
| 2026-10-22 | `ACEPTADO` | Formalización documental basada en PR #17 | Se registra el estado resultante de la aceptación explícita y de las correcciones incorporadas en PR #17. No se atribuye al owner una nueva intervención ni al reviewer Cloud la autoría de la decisión Software. |

## Referencias y trazabilidad

- Fuentes F0/F1/F2: [F1 §3/5, RN-02/04/05/14/15/16/17/18/19/20, RF-CLI-01, RF-PRODUCER-01/02/03, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §6/11/12/13](../../../../02-diseno/Fase_2__Design_Handoff.md).
- ADR/TDD relacionados: [ADR-SW-001](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-004](../MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md), [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-003](../../tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); previstos TDD-SW-004, ADR-CLD-007, TDD-CLD-006.
- Filas de [traceability.md](../../../traceability.md): acceso del Productor; ABM de Clientes y Productores; Mi perfil.
