# ADR — Identidad con roles múltiples (Admin + Productor) y MFA del Portal fuera del MVP

| Dato | Valor |
| --- | --- |
| ID | `ADR-SW-007` |
| Título | Cuenta con conjunto de roles (Admin + Productor) y MFA del Portal fuera del MVP; reemplaza a ADR-SW-005 |
| Estado | `PROPUESTO` |
| Fecha | 2026-11-04 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera — revisión cruzada Cloud/seguridad pendiente |
| Work item | [MAPS-111](https://santitalavera.atlassian.net/browse/MAPS-111) · subtarea [MAPS-216](https://santitalavera.atlassian.net/browse/MAPS-216) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-111 |
| Fase origen | [F1 §3/5, RN-02/04/05/14/15/16/17/18/19/20, RF-CLI-01, RF-PRODUCER-01/02/03, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §6/11/12/13](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-001](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-004](../MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md); [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); [TDD-SW-003](../../tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); [TDD-SW-004](../../tdd/MAPS-111-identidad-rbac-ownership/TDD-SW-004-identidad-rbac-y-ownership.md) (`BORRADOR`); [TDD-SW-005](../../tdd/MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md) (`BORRADOR`); [TDD-SW-007](../../tdd/MAPS-115-auditoria-analytics/TDD-SW-007-auditoria-y-analytics.md) (`BORRADOR`); [TDD-SW-008](../../tdd/MAPS-115-contrato-api/TDD-SW-008-contrato-api.md) (`BORRADOR`); [ADR-CLD-007](../../../cloud/adr/MAPS-152-seguridad-cloud/ADR-CLD-007-seguridad-cloud.md) (`PROPUESTO`) y [TDD-CLD-006](../../../cloud/tdd/MAPS-158-iam-secret-manager/TDD-CLD-006-iam-y-secret-manager.md) (`BORRADOR`) |
| Depende de | ADR-SW-001 y ADR-SW-002 (`ACEPTADO`); alineación Cloud con ADR-CLD-007 y TDD-CLD-006; RN-20 y campos de Mi perfil (`PENDIENTE FUNCIONAL MAPS`) |
| Reemplaza | [ADR-SW-005](../MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) |
| Reemplazado por | No aplica |

> Estados válidos: `PROPUESTO`, `ACEPTADO`, `RECHAZADO`, `REEMPLAZADO`. Este ADR es una propuesta: no constituye una decisión aceptada. Mientras esté `PROPUESTO`, ADR-SW-005 sigue vigente; al aceptarse este ADR, ADR-SW-005 pasa a `REEMPLAZADO` (ver [Registro de decisión](#registro-de-decisión)).

## Contexto y problema

[ADR-SW-005](../MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) (`ACEPTADO`) fijó dos cosas que ya no se sostienen para el MVP:

1. **Un único rol por cuenta**, presentado como restricción propuesta y condicionada a la factibilidad del proveedor de identidad.
2. **MFA obligatorio para Admin**, a verificar en el proveedor elegido.

En la revisión de seguridad Cloud ([PR #30](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/30), comentarios del 2026-10-29 y del 2026-11-01) el owner de Software confirmó dos decisiones de alcance del MVP:

- **MFA del Portal queda fuera del MVP.** La decisión es postergar el MFA a una etapa posterior; no queda pendiente decidir si se implementa ahora. Alcanza sólo al acceso al Portal; no retira controles de acceso a GCP ni a CI/CD.
- **Admin + Productor en una misma cuenta individual forma parte del MVP.** Los administradores también atienden clientes como Productores y necesitan un único login. Cliente sigue con cuenta y correo separados; no hay cuentas administrativas compartidas.

Cloud respetó el contrato vigente en lugar de modificarlo unilateralmente (ADR-CLD-007 y TDD-CLD-006 conservan hoy MFA de Admin y rol único) y dejó explícito el delta de Software que debía formalizarse: retiro de cada rol, baja total, reactivación sin restitución automática de roles y tratamiento de Assignments. ADR-SW-005 es `ACEPTADO` y su criterio de revisión futura exige crear un ADR nuevo si cambia; no se edita su decisión histórica.

Límite software/cloud: este ADR decide el modelo de cuenta y roles de la aplicación y el alcance de MFA del Portal. La configuración del proveedor, la validación de tokens, los secretos y el IAM de infraestructura siguen en ADR-CLD-007 y TDD-CLD-006.

## Qué cambia respecto de ADR-SW-005

| Tema | ADR-SW-005 | Este ADR |
| --- | --- | --- |
| Roles por cuenta | Uno solo | Conjunto de roles; `ADMIN` y `PRODUCTOR` pueden coexistir |
| Cliente | Cuenta de rol único | Sin cambios: cuenta separada, no se combina con otro rol |
| MFA | Obligatorio para Admin | Fuera del MVP para todo el Portal; riesgo aceptado y registrado |
| Retiro de acceso | Baja de cuenta | Baja de cuenta **y** retiro independiente de cada rol |
| Reactivación | Cuenta vuelve a `ACTIVA` | Idem; no restaura roles retirados |
| Invitación de Productor | Siempre crea la cuenta | Puede agregar el rol a una identidad que ya existe como Admin |

El resto de ADR-SW-005 se conserva sin cambios de fondo y se reproduce abajo para que este ADR sea autosuficiente: proveedor OIDC detrás de `IdentityProviderPort`, vínculo por `issuer + subject`, verificación y revocación por request, RBAC + ownership con deny by default, estados de cuenta `ACTIVA` y `BAJA`, y auditoría de acceso.

## Drivers y criterios

| Driver o criterio | Importancia | Evidencia / fuente |
| --- | --- | --- |
| Una persona, un login, aunque administre y atienda como Productor | Alta | Decisión del owner, [PR #30](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/30) (2026-11-01) |
| Aislamiento por identidad y ownership, no sólo por rol | Alta | RN-05/16, RNF-SEC-01 |
| Ningún permiso nuevo por tener dos roles: cada capacidad conserva su autorización y alcance | Alta | Decisión del owner, [PR #30](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/30) |
| Revocación inmediata de acceso (baja, retiro de rol, cancelación DERIVADA, reasignación) | Alta | RF-PRODUCER-02, RN-18, RN-19 |
| Una sola fuente de verdad de roles, sin pseudo-roles ni claims del proveedor | Alta | ADR-SW-005; Cloud lo ratifica en ADR-CLD-007 |
| Reducir trabajo inicial de implementación, enrolamiento y recuperación de MFA | Media | Decisión del owner, [PR #30](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/30) |
| Reversibilidad de ambas decisiones | Media | El modelo de datos admite volver a exigir MFA o a restringir roles sin migración destructiva |

## Alternativas consideradas

### Cuentas con más de un rol

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| Mantener rol único: dos cuentas y dos emails para quien administra y atiende | Sin cambios de modelo | Dos logins por persona; con `allowDuplicateEmails=false` exige dos emails; contradice la necesidad de MAPS | Descartada |
| Pseudo-rol `ADMIN_PRODUCTOR` | Un solo valor de rol | Combinatoria de roles; cada combinación nueva exige otro valor; oculta qué capacidad se usó y complica retirar un rol | Descartada |
| Conjunto de roles de la cuenta (`ADMIN`, `PRODUCTOR`), con Cliente excluyente | Refleja lo que la persona puede hacer; cada rol se retira por separado; las políticas ya consultan el rol que exigen | Requiere definir retiro, baja, reactivación e invitación para el caso combinado | Elegida |
| Roles dentro de claims del proveedor | Menos consultas | Revocación diferida hasta que expire el token; el Portal es la fuente de verdad de roles | Descartada |
| Cuentas administrativas compartidas | Sin cambios de modelo | Pérdida de trazabilidad individual | Descartada por decisión del owner |

### MFA del Portal

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| MFA obligatorio para Admin (ADR-SW-005) | Mitiga la toma de cuentas privilegiadas | Enrolamiento y recuperación a cargo del equipo; la opción `MANDATORY` del proveedor se aplica a todo el proyecto y obligaría a implementar *enforcement* por rol y a verificar la señal de segundo factor | Descartada para el MVP |
| MFA para todos | Postura de seguridad más fuerte | Mayor costo de implementación y soporte | Descartada para el MVP |
| MFA fuera del MVP, con riesgo aceptado, mitigaciones y revisión posterior | Reduce el trabajo inicial; el diseño no lo impide después | Una cuenta privilegiada depende sólo de email y contraseña | **Elegida** |

## Decisión

Esta es la opción propuesta. Se **propone decidir**:

### 1. Modelo de cuenta y roles

- La cuenta del Portal (`UserIdentity`) tiene un **conjunto de roles** del que forman parte `CLIENTE`, `PRODUCTOR` y `ADMIN`. Es la fuente de verdad de roles, estado de cuenta y vínculos con Customer/Producer. Se vincula con la identidad externa por `issuer + subject`; el email no es vínculo, y un mismo `issuer + subject` no puede vincularse a dos cuentas.
- Combinaciones válidas: `{CLIENTE}`, `{PRODUCTOR}`, `{ADMIN}` y `{ADMIN, PRODUCTOR}`. **`CLIENTE` no se combina con otro rol:** el Cliente conserva cuenta y correo propios.
- **No existe un rol `ADMIN_PRODUCTOR`.** Cada rol es independiente; que una cuenta tenga ambos no crea un permiso nuevo.
- Cada rol tiene su propio registro de concesión y retiro: estado `ACTIVO` o `RETIRADO`, fecha, quién y motivo. Una cuenta `ACTIVA` tiene al menos un rol `ACTIVO`. **Un rol sólo se retira si la cuenta conserva otro rol activo.** Si es su único rol activo, la operación es la baja de cuenta, que deja el rol `ACTIVO` para que la reactivación lo recupere (RN-19: la baja es reversible).
- Los vínculos del modelo no cambian: `UserIdentity → Customer 0..1` y `UserIdentity → Producer 0..1` ([TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md)). `ADMIN` sigue sin vínculo con Customer ni Producer; el vínculo con `Producer` lo aporta el rol `PRODUCTOR`.
- El Cliente se registra por sí mismo. El Productor no tiene autorregistro: el Admin lo da de alta mediante invitación. `ADMIN` se concede por un procedimiento controlado fuera del flujo público, que crea la cuenta; agregarlo a una cuenta que ya es `PRODUCTOR` (nunca a una `CLIENTE`) es una **propuesta de Kondor sujeta a confirmación**, porque el owner pidió la dirección inversa (la invitación de Productor a un Admin).

### 2. Autorización por rol y capacidad, más ownership

- Deny by default. Cada caso de uso declara el rol (capacidad) que exige y su política; las políticas viven en la capa `application` del módulo owner y se evalúan antes de ejecutarlo. Los adaptadores HTTP sólo autentican y traducen.
- **La capacidad la elige el caso de uso, no se acumula.** Una cuenta `{ADMIN, PRODUCTOR}` que ejecuta un caso de uso de Productor se evalúa con la política y el `AccessScope` de Productor (sólo DERIVADAS con Assignment `EFECTIVO` propio, lectura); al ejecutar uno de Admin, con los de Admin. Tener `ADMIN` no amplía el alcance del Productor ni al revés.
- La regla de acceso a `InsuranceRequest` no cambia:

| Rol | Regla de acceso a `InsuranceRequest` |
| --- | --- |
| Cliente | `request.customerId == actor.customerId`; acciones según estado ([F2 §6](../../../../02-diseno/Fase_2__Design_Handoff.md)) |
| Productor | `estado == DERIVADA`, Assignment **`EFECTIVO`** con `producerId == actor.producerId` y rol `PRODUCTOR` `ACTIVO` en una cuenta `ACTIVA`; sólo lectura |
| Admin | Operaciones de [F2 §13](../../../../02-diseno/Fase_2__Design_Handoff.md) con rol `ADMIN` `ACTIVO`; no crea ni edita BORRADORES de Clientes |

- El acceso del Productor se calcula a partir de estado y Assignment efectivo, sin un permiso guardado aparte. Un Assignment `PENDIENTE_ENTREGA` o `CERRADO` no autoriza; un resultado de entrega duplicado o tardío nunca vuelve `EFECTIVO` un Assignment `CERRADO` ([TDD-SW-003](../../tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md), [TDD-SW-005](../../tdd/MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md)).
- Los listados filtran por el alcance de la capacidad en la propia consulta a la base.
- **Auditoría y capacidad.** Un evento de acceso o de negocio registra la capacidad (rol) con la que se ejecutó la operación, no una propiedad única de la cuenta. Una apertura de expediente hecha como Productor se audita como tal aunque la cuenta también sea Admin ([TDD-SW-007](../../tdd/MAPS-115-auditoria-analytics/TDD-SW-007-auditoria-y-analytics.md)).

### 3. Sesión y verificación por request

- Cada request autenticado valida el token del proveedor (firma, emisor, audiencia y expiración; el detalle lo fijan TDD-SW-004 y TDD-CLD-006) y consulta en el Portal el estado de la cuenta **y sus roles `ACTIVO`**. Ni el estado ni los roles se cachean en el MVP; si Cloud introduce una caché, su TTL máximo es la demora aceptada de revocación y debe documentarse en TDD-CLD-006.
- Toda request que empieza después del commit de una baja o de un retiro de rol es rechazada para esa capacidad, aunque el token siga vigente. Los comandos de escritura y la apertura de expediente releen cuenta y roles dentro de su propia unidad de trabajo.
- La revocación de sesión en el IdP se solicita cuando el proveedor lo permita y no es la garantía de aplicación. Los tokens ya emitidos siguen siendo criptográficamente válidos hasta expirar; el chequeo local los vuelve inútiles para operar. Se recomienda un TTL corto de access token.
- El email de derivación contiene un enlace al Portal sin credenciales ni tokens de acceso: abrirlo exige iniciar sesión.

### 4. Baja, retiro de rol y reactivación

Estados de cuenta: `ACTIVA` y `BAJA` (reversible). Pertenecen a la cuenta, no modifican ninguna `InsuranceRequest` y son distintos del retiro de un rol.

| Evento | Efecto |
| --- | --- |
| **Baja de cuenta** | Cuenta `BAJA`: ningún rol puede operar desde la siguiente request, sin perder el registro de qué roles estaban `ACTIVO`. Revocación de sesión en el IdP cuando lo permita. Aviso por outbox ([ADR-SW-004](../MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md)) y auditoría. Para una cuenta con `PRODUCTOR` como único rol activo, la baja de cuenta es la baja guiada (abajo) y deja `PRODUCTOR` `ACTIVO` para que la reactivación lo recupere. La baja de una cuenta con `ADMIN` está pendiente y se rechaza (*deny by default*; ver [pendientes](#riesgos-y-pendientes)); la intención es coordinar sus Assignments sin retirar `PRODUCTOR` |
| **Retiro del rol `ADMIN`** | Se retira sólo esa capacidad y sólo si la cuenta conserva `PRODUCTOR` activo; si `ADMIN` es su único rol, corresponde la baja de cuenta. Sin efecto sobre Assignments. Auditoría. Se ejecuta por un procedimiento de operación Kondor (propuesta sujeta a confirmación), porque según TDD-SW-004 la gestión de Admins desde el Portal está fuera del MVP |
| **Retiro del rol `PRODUCTOR`** (baja de Productor, RN-19) | El Admin trata antes toda ASIGNADA o DERIVADA afectada con la baja guiada de TDD-SW-005: reasignación mediante una nueva asignación, efectiva tras entrega exitosa, y corte de acceso de inmediato. **Si la cuenta conserva `ADMIN` `ACTIVO`:** se retira sólo esa capacidad: el rol `PRODUCTOR` pasa a `RETIRADO` y la cuenta sigue `ACTIVA` como Admin. **Si `PRODUCTOR` es su único rol activo:** la baja de Productor es la baja de cuenta (`BAJA`) con el rol aún `ACTIVO`, y se revierte con la reactivación (RN-19). El Productor permanece en historial y auditoría. Aviso y auditoría |
| **Reactivación de cuenta** | La cuenta de un Cliente o de un Productor vuelve a `ACTIVA` por acción del Admin, con auditoría y aviso. La baja y la reactivación de una cuenta con `ADMIN` no están definidas (ver pendientes). **No restaura roles retirados** ni acceso a solicitudes ya reasignadas: recupera sólo los roles que seguían `ACTIVO` al momento de la baja |
| **Reconceder un rol retirado** | Acción explícita y nueva: para `PRODUCTOR`, una invitación del Admin; para `ADMIN`, el procedimiento de operación. No ocurre como efecto de reactivar la cuenta |
| Solicitud de alta de Cliente en `BAJA` | Sin cambios respecto de ADR-SW-005: journey diferido fuera del MVP por decisión de alcance Kondor (RN-18) |

RN-19 fija como decisión de alcance Kondor para el MVP que una DERIVADA afectada se reasigna con una nueva asignación, efectiva tras la entrega exitosa. [TDD-SW-003](../../tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md) y [TDD-SW-005](../../tdd/MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md) detallan la coordinación sin estado funcional nuevo.

### 5. Invitación de Productor con identidad preexistente

La invitación sigue vinculada por token de un solo uso y por email verificado igual al invitado, no sólo por email. Al aceptar:

- **Identidad sin cuenta:** se crea la cuenta con rol `PRODUCTOR`, como antes.
- **Identidad con cuenta `ACTIVA` que ya es `ADMIN` y no tiene `PRODUCTOR` activo:** se **agrega** (o se concede de nuevo, si estaba `RETIRADO`) el rol `PRODUCTOR` a esa cuenta y se vincula al `Producer`, en la misma operación que consume la invitación. No se crea otra cuenta ni se pide otro email.
- **Cualquier otra identidad con cuenta** (`CLIENTE`, `PRODUCTOR` ya activo o cuenta en `BAJA`) no puede aceptar y recibe un error de dominio explícito; ninguna invitación convierte una cuenta de Cliente en otra cosa.

### 6. MFA del Portal fuera del MVP

- El Portal **no exige MFA** en el MVP, para ningún rol. Se conservan autenticación gestionada por el proveedor, email verificado, cuentas individuales y toda la autorización de este ADR.
- La decisión se limita al Portal: no retira MFA, controles de acceso ni federación de identidades de GCP o CI/CD (ADR-CLD-007, TDD-CLD-006).
- El diseño no lo impide después: la identidad es de un proveedor gestionado compatible con MFA y la autorización vive en el Portal. Habilitarlo más adelante no cambia el modelo de cuenta y roles.
- **Riesgo aceptado:** una cuenta con `ADMIN` (y, por la cuenta combinada, con acceso a datos de Productor) queda protegida sólo por email y contraseña. Un compromiso de esas credenciales da acceso a operaciones de alto impacto sobre usuarios, catálogo y asignaciones.
- **Mitigaciones que se mantienen:** cuentas individuales sin cuentas compartidas, email verificado, alta de Admin por procedimiento controlado, revocación inmediata por consulta local, auditoría de operaciones de Admin y de aperturas de expediente, y minimización de PII en logs.
- **Revisión.** El riesgo se revisa antes del primer despliegue con datos reales de MAPS y ante cualquier incidente de acceso. Ese hito es propuesta de Kondor y queda sujeto a confirmación; este ADR no la cierra por MAPS.

### 7. Qué no decide

Este ADR no elige proveedor de identidad, formato de token ni duración de sesión; no define los campos de Mi perfil; no modela un estado de inhabilitación de Productor mientras RN-20 siga pendiente de MAPS; y no cambia F1/F2.

## Consecuencias y trade-offs

### Positivas

- Una persona que administra y atiende como Productor usa un solo login, sin cuentas duplicadas ni emails adicionales.
- Cada rol se retira por separado: se puede dejar de administrar y seguir como Productor, o a la inversa, sin una baja total.
- Ningún permiso se suma por tener dos roles: el caso de uso decide qué capacidad usa y las políticas existentes siguen valiendo.
- Se reduce el trabajo inicial de enrolamiento y recuperación de MFA.

### Negativas y riesgos

- **Seguridad:** sin MFA, las cuentas con `ADMIN` dependen de la fortaleza de la contraseña y de la protección del buzón de email. Aceptado de forma explícita en este ADR.
- **Complejidad:** la baja de cuenta, el retiro de rol y la baja guiada de Productor deben componerse sin dejar estados inconsistentes, por ejemplo una cuenta `ACTIVA` sin roles `ACTIVO`.
- **Autoasignación:** un Admin que también es Productor podría asignarse casos a sí mismo. Este ADR no introduce una separación de funciones; ver pendientes.
- Un cambio de rol exige releer roles en cada request; es una consulta más por request, que ya se hacía para el estado de cuenta.
- El frontend ve un conjunto de roles en lugar de un rol; los contratos de API (TDD-SW-008) y de auditoría (TDD-SW-007) cambian en consecuencia.
- Cloud debe retirar de ADR-CLD-007 y TDD-CLD-006 el requisito de MFA de Admin y la restricción de rol único, para que no queden requisitos contradictorios.

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Alinear ADR-CLD-007 y TDD-CLD-006 (MFA de Admin, rol único, *spike* de MFA por rol) | Cloud + Software | Una vez aceptado este ADR, Cloud actualiza sus referencias; hasta entonces sus documentos contradicen esta propuesta |
| Hito de revisión del riesgo de no tener MFA | Kondor + MAPS | Confirmar el hito propuesto (antes del primer despliegue con datos reales) |
| Autoasignación de un Admin que también es Productor | Kondor + MAPS | Decidir si se permite, se registra con una marca de auditoría o se prohíbe; este ADR no la restringe, así que queda permitida por defecto |
| Baja y reactivación de una cuenta con `ADMIN` (¿puede un Admin hacerlo a otro Admin o a sí mismo?) y quién solicita `create-admin` y su retiro | Kondor + MAPS | Sin política definida (deny by default) hasta decidirlo; decidir el procedimiento y registrarlo en TDD-SW-004; definir en TDD-SW-004/005 el caso de uso y el puerto que coordinan los Assignments sin retirar `PRODUCTOR` |
| Retiro o baja del último Admin activo | Kondor | Decidir si se bloquea; hoy TDD-SW-004 prevé dos o tres Admins y gestión por operación |
| Procedimiento de operación para agregar y retirar `ADMIN` | Software + Cloud | Se detalla en TDD-SW-004 (`create-admin` y su complemento de retiro) |
| Aceptación de este ADR | Joaquin Rodriguez + Santiago Talavera | Revisión cruzada Cloud/seguridad favorable y conformidad del owner |
| Alcance de inhabilitación de Productor | MAPS | Cerrar RN-20 antes de modelar un estado adicional |
| Journey de "solicitud de alta" de Cliente dado de baja | Kondor + MAPS | Diferido fuera del MVP (RN-18); no condiciona este ADR |
| Campos de Mi perfil | `PENDIENTE FUNCIONAL MAPS` | Se cierran en TDD-SW-004 |
| Factibilidad de varios roles por cuenta frente al IdP | Software + Cloud | El Portal es la fuente de verdad de roles y el IdP autentica una sola identidad; ADR-CLD-007 lo confirma |

### Documentos que se ajustan al aceptar este ADR

Mientras este ADR esté `PROPUESTO`, estos textos siguen en su redacción actual y deben revisarse al aceptarlo: [TDD-SW-003](../../tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md) (`APROBADO`; `PRODUCTOR_NO_DISPONIBLE`: la elegibilidad pasa a ser cuenta `ACTIVA` con rol `PRODUCTOR` `ACTIVO`). TDD-SW-004, TDD-SW-005, TDD-SW-006, TDD-SW-007 y TDD-SW-008 (`BORRADOR`) ya siguen esta propuesta, pero no pasan a `EN REVISIÓN` ni `APROBADO` hasta que este ADR esté `ACEPTADO`.

## Criterios de revisión futura

Revisar si aparecen requisitos de MFA o de verificación de identidad avanzada, SSO corporativo, roles adicionales o sub-roles de Admin, necesidad de que un Cliente comparta cuenta con otro rol, acceso de sistemas externos de MAPS, un incidente de acceso a una cuenta con `ADMIN`, o la proximidad del primer despliegue con datos reales. Si cambia este ADR aceptado, crear uno nuevo que lo reemplace.

## Registro de decisión

| Fecha | Decisión | Participantes | Observaciones |
| --- | --- | --- | --- |
| 2026-10-29 | Propuesta de ajuste | Joaquin Rodriguez | Propone en la [PR #30](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/30) diferir MFA de Admin y permitir Admin + Productor en una cuenta |
| 2026-10-30 | Cloud mantiene la baseline | Santiago Talavera | C2 conserva ADR-SW-005 y registra ambos puntos como delta de Software pendiente; enumera lo que Software debe resolver |
| 2026-11-01 | Decisiones de alcance del MVP | Joaquin Rodriguez (owner de Software) | Confirma MFA del Portal fuera del MVP y Admin + Productor en una misma cuenta; pide actualizar ADR-SW-005 formalmente |
| 2026-11-04 | `PROPUESTO` | Joaquin Rodriguez | Este ADR formaliza ambas decisiones como reemplazo de ADR-SW-005. Pendientes: revisión cruzada de Santiago Talavera y aceptación. Al aceptarse, ADR-SW-005 pasa a `REEMPLAZADO` en el mismo cambio |

## Referencias y trazabilidad

- Fuentes F0/F1/F2: [F1 §3/5, RN-02/04/05/14/15/16/17/18/19/20, RF-CLI-01, RF-PRODUCER-01/02/03, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §6/11/12/13](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Decisión que reemplaza: [ADR-SW-005](../MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md).
- Origen de las decisiones: [PR #30](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/30), comentarios del 2026-10-29, 2026-10-30 y 2026-11-01.
- Documentos de Software alineados con este ADR: [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md) (enmienda), [TDD-SW-004](../../tdd/MAPS-111-identidad-rbac-ownership/TDD-SW-004-identidad-rbac-y-ownership.md), [TDD-SW-005](../../tdd/MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md), [TDD-SW-007](../../tdd/MAPS-115-auditoria-analytics/TDD-SW-007-auditoria-y-analytics.md), [TDD-SW-008](../../tdd/MAPS-115-contrato-api/TDD-SW-008-contrato-api.md).
- Filas de [traceability.md](../../../traceability.md): acceso del Productor; ABM de Clientes y Productores; Mi perfil.
