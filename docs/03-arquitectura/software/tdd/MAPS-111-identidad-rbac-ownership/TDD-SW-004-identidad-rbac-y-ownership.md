# TDD — Identidad, RBAC y ownership

| Dato | Valor |
| --- | --- |
| ID | `TDD-SW-004` |
| Título | Identidad, RBAC y ownership |
| Estado | `BORRADOR` |
| Fecha | 2026-10-26 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera — revisión cruzada Cloud/seguridad pendiente |
| Work item | [MAPS-111](https://santitalavera.atlassian.net/browse/MAPS-111) · subtarea [MAPS-141](https://santitalavera.atlassian.net/browse/MAPS-141) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-111 |
| Fase origen | [F1 §3/5, RN-02/04/05/14/15/16/17/18/19/20, RF-CLI-01, RF-PRODUCER-01/02/03, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §6/7/11/12/13](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md); [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md); [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md) (`BORRADOR`); TDD-SW-007, ADR-CLD-007, TDD-CLD-006 y TDD-CLD-007 (previstos, sin redactar) |
| Depende de | ADR-SW-001, ADR-SW-002 y ADR-SW-005, todos `ACEPTADO`; ADR-CLD-007 y TDD-CLD-006 para proveedor de identidad, MFA y validación de tokens; RN-20 y campos de Mi perfil (`PENDIENTE FUNCIONAL MAPS`) |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `BORRADOR`, `EN REVISIÓN`, `APROBADO`, `REEMPLAZADO`. Este documento es un borrador: no constituye un diseño aprobado.

## Propósito y límites

Este TDD baja a diseño ejecutable las decisiones de [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) (`ACEPTADO`): modelo de cuenta y vinculación con el proveedor de identidad, registro del Cliente, alta e invitación del Productor, creación del Admin, verificación por request, catálogo de políticas, alcance de acceso (`AccessScope`), baja y reactivación de cuentas, y auditoría de identidad y accesos.

**Fuera de este documento:**

- Elección y configuración del proveedor de identidad, MFA, validación criptográfica de tokens, secretos e IAM de infraestructura: ADR-CLD-007 y TDD-CLD-006 (Cloud).
- Almacenamiento, consulta y retención de la auditoría: TDD-SW-007 y TDD-CLD-007.
- Semántica de Assignment, entrega y reintentos: [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md) y [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md).
- Lista definitiva de campos de Mi perfil y alcance de la inhabilitación de Productor: `PENDIENTE FUNCIONAL MAPS`.

### Aclaraciones respecto del ADR-SW-005

Este TDD no modifica el ADR. Concreta cuatro puntos que el ADR dejó abiertos al diseño:

1. **Baja de Productor como operación guiada única.** El ADR pide que el Admin trate las ASIGNADAS y DERIVADAS "antes de completar la baja" y que el acceso se corte de inmediato (RN-19). Se diseña como una sola operación: en el mismo momento en que se corta el acceso, el Admin elige los casos y los reasigna (ver [Baja guiada de Productor](#baja-guiada-de-productor)). Es decisión de alcance Kondor del 2026-10-28, alineada con [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md). **No está validada por MAPS:** modifica la secuencia documentada antes y el comportamiento del prototipo de PR #19. Es un pendiente funcional, no un defecto técnico, y cierra con la ratificación de MAPS (DEP-07, MAPS-167) y, si corresponde, un cambio controlado de F1/F2 y la actualización del prototipo. Si la revisión considera que implica un trade-off de primer orden, se eleva a un ADR.
2. **Registro explícito del Cliente.** El ADR dice que el Cliente se registra por sí mismo; este TDD fija que lo hace en un paso explícito de "completar registro".
3. **Invitación de Productor propia**, vinculada por token y no por email.
4. **Un único email por cuenta**, el verificado por el proveedor de identidad, sin edición desde el Portal en el MVP.

## Baseline y dependencias

| Regla / dependencia | Fuente y estado | Impacto en el diseño |
| --- | --- | --- |
| Login/registro antes de crear BORRADOR | RN-02 — CONFIRMADO | Sin cuenta del Portal no hay acceso a comandos de Requests |
| Productor sólo ve DERIVADAS asignadas a su identidad, autorizadas y read-only; el enlace del email no concede acceso | RN-05/16, [F1 §5](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) — CONFIRMADO | `AccessScope` del Productor derivado de estado + Assignment `EFECTIVO` + cuenta `ACTIVA` |
| Matriz de permisos UX | [F2 §6/13](../../../../02-diseno/Fase_2__Design_Handoff.md) — CONFIRMADO | Fuente del catálogo de políticas; el enforcement técnico es de este TDD |
| Baja de Cliente: pierde el login de inmediato, sus solicitudes siguen su ciclo, se conserva el historial y se le notifica | RN-18 — CONFIRMADO | Cuenta `BAJA` sin tocar `InsuranceRequest` |
| Baja de Productor: pierde el acceso de inmediato; el Admin trata ASIGNADAS y DERIVADAS antes de completar la baja; baja lógica y reversible | RN-19 — CONFIRMADO; secuencia: decisión de alcance Kondor MVP (2026-10-28), sin validación de MAPS (DEP-07) | Operación guiada única: corte de acceso y reasignación en el mismo commit |
| Inhabilitar a un Productor sólo impide nuevas asignaciones | RN-15 — CONFIRMADO; MAPS respondió que no habrá casos inhabilitados, lo que apunta a quitarla del MVP (decisión 7 de TDD-SW-005) | No se modela inhabilitación: la elegibilidad es sólo cuenta `ACTIVA` |
| Alcance de la inhabilitación y su efecto sobre casos existentes | RN-20 — `PENDIENTE FUNCIONAL MAPS` | No se modela ningún estado de inhabilitación |
| Campos de Mi perfil | RN-17 — `PENDIENTE FUNCIONAL MAPS` | Se define sólo la frontera de autorización; el perfil básico es propuesta Kondor |
| Alta de Cliente por Admin (F2 ADM-10) | Discrepancia con ADR-SW-005 (el Cliente se registra por sí mismo) | Fuera del MVP; ver [Decisiones abiertas](#decisiones-abiertas) |
| Consentimientos aplicables | `PENDIENTE FUNCIONAL MAPS` | El paso de registro admite aceptación de textos versionados |

## Vista de componentes y responsabilidades

| Componente | Módulo owner | Responsabilidad |
| --- | --- | --- |
| `IdentityProviderPort` | Identity | Valida credenciales/tokens del proveedor y entrega `issuer`, `subject` y email verificado. Su implementación concreta depende de ADR-CLD-007 |
| Resolución del actor | Identity | Convierte la identidad externa en un `Actor` (cuenta, rol, `customerId`/`producerId`) y rechaza cuentas `BAJA` |
| Evaluador de políticas | `application` de cada módulo owner | Una política por caso de uso; deny by default; calcula el `AccessScope` |
| `AccessScope` | Identity (tipo), consumido por los repositorios | Alcance de lectura obligatorio para toda consulta de solicitudes |
| Registro y cuentas | Identity | `CompleteRegistration`, `AcceptProducerInvitation`, baja y reactivación de Cliente |
| Invitaciones | Identity | Entidad `ProducerInvitation` y su ciclo de vida |
| Baja guiada de Productor | Assignment (`DeactivateProducer`, [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md)) | Inicia la unidad de trabajo: cierra y crea asignaciones y pasa la cuenta a `BAJA` a través de un puerto de entrada de Identity |
| Adaptadores HTTP | Entrada | Sólo autentican y traducen; no deciden permisos. El frontend oculta acciones por UX, pero el control real está en la aplicación |

El rol Admin es un rol de `UserIdentity`, no una entidad aparte ([TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md)). Que Assignment coordine la baja sigue el mismo patrón que `Assign`, `Reassign` y `ReassignDerived`, y respeta la dirección de dependencias de ADR-SW-001 (Assignment → Identity). Identity sigue siendo owner del estado de la cuenta y no llama a Assignment.

## Contratos y flujos

### Resolución del actor por request

1. El adaptador HTTP pasa el token a `IdentityProviderPort`, que lo valida (firma, emisor, audiencia y expiración; el detalle es de TDD-CLD-006) y devuelve `issuer`, `subject` y email verificado.
2. Identity busca la `UserIdentity` por el par `issuer + subject`. Si no existe, la identidad sólo puede ejecutar `CompleteRegistration` o `AcceptProducerInvitation`.
3. Si la cuenta está en `BAJA`, se rechaza con `CUENTA_INACTIVA`.
4. Se construye el `Actor` y se evalúa la política del caso de uso.

**Contrato de revocación.** La revocación es inmediata y se apoya en una consulta local, no en el proveedor: el estado de cuenta no se cachea, toda request que empieza después del commit de una baja es rechazada aunque el token siga vigente, y los comandos de escritura y la apertura de expediente releen el estado de cuenta dentro de su propia unidad de trabajo.

Lo que depende del proveedor (MFA, bloqueo del cambio de email, revocación de sesiones, eventos de login) no se da por garantizado hasta ADR-CLD-007 y TDD-CLD-006. Si Cloud incorpora una caché del estado de cuenta, es un debilitamiento de este contrato: se registra explícitamente como desvío aceptado, con su TTL máximo como demora de revocación, en TDD-CLD-006 y en este TDD.

Cada vez que un Cliente inicia sesión, si el email verificado que informa el proveedor difiere del que guarda el Portal, se actualiza la copia y se audita. Que el proveedor impida al usuario final cambiar su email es una hipótesis condicionada al proveedor (ver [Decisiones abiertas](#decisiones-abiertas)), no una garantía de este diseño. Por eso existe esta sincronización y la cuenta se vincula por `issuer + subject`, no por email.

### Registro del Cliente

Una identidad autenticada sin cuenta del Portal ve el paso "completar registro". `CompleteRegistration` crea en una única operación la `UserIdentity` (rol `CLIENTE`, estado `ACTIVA`) y el `Customer`, copiando el email verificado del proveedor, y registra la aceptación de los textos de consentimiento vigentes cuando MAPS los defina.

- Sólo crea Clientes. Productores y Admins nunca pasan por este paso.
- Es idempotente por `issuer + subject`: repetirlo devuelve `REGISTRO_YA_COMPLETO` sin duplicar cuentas.
- Una identidad sin cuenta no puede ejecutar ningún otro comando.
- Exige email verificado.

### Alta e invitación de Productor

1. El Admin crea el `Producer` desde el ABM, con sus datos y su email. El Productor existe como registro, sin `UserIdentity` y sin acceso. Sin cuenta `ACTIVA` no puede recibir asignaciones.
2. El sistema crea una `ProducerInvitation` y registra una intención de aviso por outbox ([ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md)) con un enlace al Portal. El enlace contiene el token de la invitación y ninguna credencial.
3. La persona abre el enlace, se autentica con el proveedor y ejecuta `AcceptProducerInvitation`.
4. La aceptación exige a la vez: token válido (existente, no usado, no vencido, no invalidado) y email verificado de la identidad **igual** al email invitado, ambos normalizados. Si se cumplen, en una sola operación se crea la `UserIdentity` (rol `PRODUCTOR`, `ACTIVA`), se vincula al `Producer` y se marca la invitación como `ACEPTADA`. Desde ese momento el Productor puede recibir asignaciones.

Reglas de la invitación:

- El token es de un solo uso y de alta entropía. Sólo se guarda su hash.
- Vence a los 7 días como valor inicial configurable.
- **Reemisión.** Reenviar emite un token nuevo e invalida el anterior en la misma operación. Editar el email del Productor con una invitación `PENDIENTE` también la invalida y emite una nueva a la dirección nueva. Una invitación vencida o invalidada sólo se reemplaza con una reemisión del Admin.
- **Normalización.** El email invitado y el email verificado se comparan sin espacios al inicio o al final y en minúsculas. No se aplican otras equivalencias (puntos, sufijos `+`), porque dependen de cada proveedor de correo.
- Una identidad que ya tiene cuenta del Portal no puede aceptar (`REGISTRO_YA_COMPLETO`): cada cuenta tiene un único rol.
- Estados: `PENDIENTE`, `ACEPTADA`, `INVALIDADA`. El vencimiento se calcula con `expiresAt`.
- Toda la lógica va detrás de un puerto del módulo Identity, para no depender del mecanismo de invitaciones del proveedor.

Cambios de email o recuperación de cuenta entre la emisión y la aceptación:

- La comparación usa el email verificado que informa el proveedor **al aceptar**, no uno anterior. Si la persona cambió su email verificado en el proveedor después de la emisión, la aceptación falla con `EMAIL_NO_COINCIDE`; el Admin corrige el email del Productor, lo que reemite la invitación.
- Si la persona recupera su cuenta en el proveedor, acepta como cualquier identidad: con el email verificado vigente y la invitación todavía `PENDIENTE`. El diseño no supone que la recuperación conserve el `subject`.
- Quien controle el buzón invitado mientras la invitación está vigente puede aceptarla: es el límite de una invitación por email. Se acota con el token de un solo uso, el vencimiento y la verificación de email del proveedor.
- Después de la aceptación la cuenta queda vinculada por `issuer + subject`; un cambio posterior del email en el proveedor no rompe el vínculo.

**Concurrencia.** La aceptación consume la invitación con un `UPDATE` condicionado (`estado = 'PENDIENTE'` y `expiresAt` futuro); si no afecta una fila, falla con `INVITACION_INVALIDA`. La reemisión y la edición del email invalidan con la misma condición, así que entre aceptar y reemitir gana sólo una. Los índices únicos sobre `issuer + subject` y sobre la `UserIdentity` del `Producer` impiden dos cuentas aunque compitan identidades distintas.

### Creación de Admin

El Admin se crea con un comando de operación (`create-admin`) que ejecuta Kondor. No existe pantalla ni endpoint público. La cuenta tiene rol `ADMIN`, sin vínculo a Customer ni Producer, con su propio `issuer + subject`, y queda auditada. El MFA obligatorio es un requisito fijado por ADR-SW-005; su enforcement lo define ADR-CLD-007 y no se da por garantizado antes. La gestión de Admins desde el Portal queda fuera del MVP. Se espera que MAPS tenga dos o tres Admins.

### Catálogo de políticas

Toda operación sin política declarada se rechaza con `ACCESO_DENEGADO`.

| Caso de uso | Actor | Condición de autorización |
| --- | --- | --- |
| Ver catálogo y detalle | Público | Sólo productos publicados |
| `CompleteRegistration` | Identidad autenticada sin cuenta | Email verificado; crea siempre rol `CLIENTE` |
| `AcceptProducerInvitation` | Identidad autenticada | Token válido y email verificado igual al invitado |
| `CreateDraft`, `SaveDraft`, `ConfirmPrice`, `Submit`, `DiscardDraft` | Cliente | Cuenta `ACTIVA`, es el dueño, BORRADOR utilizable |
| Ver solicitud propia | Cliente | Es el dueño |
| Ver solicitud | Admin | Desde ENVIADA en adelante; no ve BORRADORES |
| Ver solicitud | Productor | Estado DERIVADA, Assignment `EFECTIVO` con su `producerId` y cuenta `ACTIVA`; sólo lectura |
| `CancelByCustomer` | Cliente | Es el dueño; ENVIADA o ASIGNADA; motivo y confirmación |
| `RequestCancellation` | Cliente | Es el dueño; DERIVADA; sin otra solicitud pendiente |
| `DecideCancellation` | Admin | Existe una solicitud `SOLICITADA` |
| `Assign`, `Reassign`, reintentar entrega | Admin | Productor destino con cuenta `ACTIVA` (`PRODUCTOR_NO_DISPONIBLE` si no) |
| `ReassignDerived` | Admin | Sólo dentro de la baja guiada (`REASIGNACION_DERIVADA_NO_PERMITIDA` fuera de ella); sin cancelación `SOLICITADA` |
| `MarkDerived` | Sistema | Entrega exitosa acreditada (TDD-SW-005); no es un actor humano |
| ABM de categorías, productos y formularios | Admin | — |
| ABM de Productores (alta con invitación, edición, baja guiada, reactivación) | Admin | La baja sigue el flujo guiado |
| ABM de Clientes (edición, baja, reactivación) | Admin | No edita el email; sólo los datos permitidos |
| Ver y editar Mi perfil | Cliente | Sólo el propio; campos pendientes de MAPS |
| Crear Admin | Kondor | Comando de operación fuera del Portal |

El Admin no crea ni edita BORRADORES de Clientes ([ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md)).

### AccessScope

Ningún repositorio de solicitudes puede consultarse sin recibir un `AccessScope`, y sólo el evaluador de políticas lo construye:

| Actor | Alcance |
| --- | --- |
| Cliente | Solicitudes con `customerId` propio; sin los BORRADORES descartados |
| Productor | Solicitudes DERIVADAS con un Assignment `EFECTIVO` de su `producerId`, con su cuenta `ACTIVA` |
| Admin | Solicitudes desde ENVIADA en adelante |

Los listados filtran en la propia consulta, no después de traer los datos. Una consulta que intente leer sin scope falla en compilación o en las pruebas de arquitectura. Row Level Security en la base de datos queda fuera del MVP y se anota como posible mejora.

El acceso del Productor se calcula siempre a partir de estado y Assignment, sin un permiso guardado aparte. Un Assignment `PENDIENTE_ENTREGA` o `CERRADO` no autoriza. Un resultado de entrega duplicado o tardío nunca vuelve `EFECTIVO` un Assignment `CERRADO` ([TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md)).

### Baja guiada de Productor

La baja y la reasignación ocurren **en el mismo momento**: no hay un corte de acceso previo ni una baja "pendiente de completar". El Admin inicia la baja de un Productor; el sistema muestra las ASIGNADAS y DERIVADAS afectadas y exige, por cada una:

1. Resolver antes cualquier `CancellationRequest` en estado `SOLICITADA` (`DecideCancellation`).
2. Elegir un Productor destino distinto, con cuenta `ACTIVA`, y un motivo. El Admin **no** cancela solicitudes por su cuenta: las cancelaciones las inicia el Cliente ([F2 §12](../../../../02-diseno/Fase_2__Design_Handoff.md)).

Mientras el Admin prepara la baja, nada cambia: el Productor conserva su acceso. La confirmación ejecuta, en una única unidad de trabajo iniciada por Assignment ([TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md)):

- Cierre de cada Assignment del Productor con motivo "baja del Productor" y creación del nuevo en `PENDIENTE_ENTREGA`, con su intención de entrega por outbox. Las DERIVADAS mantienen su estado (`ReassignDerived`); las ASIGNADAS se reasignan (`Reassign`).
- Cuenta del Productor en `BAJA`, con registro de fecha, Admin y motivo.
- Aviso al Productor por outbox y auditoría.

Consecuencias:

- El corte de acceso y la reasignación quedan en el mismo commit: el Productor pierde el acceso desde la siguiente request. El nuevo Productor lo obtiene recién cuando su entrega se acredita como exitosa; entre ambos momentos nadie del lado Productor ve el caso, como ya establece TDD-SW-003.
- Si no existe otro Productor con cuenta `ACTIVA`, la baja se bloquea con `SIN_PRODUCTOR_DISPONIBLE` y la lista de casos afectados. Es una validación defensiva: con la cantidad de Productores esperada es un caso improbable.
- Si otra operación modifica un caso afectado o asigna un caso nuevo al Productor mientras tanto (por ejemplo, el Cliente cancela una ASIGNADA o se acredita una entrega), la operación falla completa con `CONFLICTO_CONCURRENCIA` y el Admin reintenta sobre el estado nuevo. Decisión de diseño: no se reintentan parcialmente los casos que cambiaron; es lo más simple y seguro para el MVP.
- Si la entrega al nuevo Productor falla, la incidencia queda visible para el Admin, que reintenta la entrega (TDD-SW-005).
- Un Productor sin casos abiertos se da de baja con la misma operación, con la lista vacía.
- Se acepta que todos los casos viajen en una sola transacción: con el volumen esperado por Productor es razonable para el MVP.

**Concurrencia.** La validación al preparar la pantalla no alcanza: la confirmación revalida todo dentro de su unidad de trabajo. La serialización con `AssignProducer`, `ReassignProducer` y `RecordDeliveryResult` la detalla [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md#baja-de-productor). Identity aporta el bloqueo de la fila de cuenta, siempre a través de sus puertos de entrada: `ProducerAccountPort` lee la elegibilidad con bloqueo compartido (`FOR SHARE`) y `ProducerAccountCommandPort` bloquea en modo exclusivo (`FOR UPDATE`) la cuenta que pasa a `BAJA`. La reactivación de Productor toma el mismo bloqueo exclusivo.

### Baja y reactivación de Cliente

- **Baja:** cuenta en `BAJA`; sin login desde la siguiente request y revocación de la sesión en el proveedor cuando lo permita. Los datos personales se conservan y las solicitudes ENVIADA, ASIGNADA y DERIVADA siguen su ciclo sin cambios. El Admin sigue viendo el historial. Aviso al Cliente por outbox y auditoría.
- **Reactivación:** la ejecuta el Admin; la cuenta vuelve a `ACTIVA`, con auditoría y aviso. No restaura acceso a solicitudes ya reasignadas.
- La "solicitud de alta" de un Cliente en `BAJA` queda diferida fuera del MVP (decisión de alcance Kondor, RN-18).

### Reactivación de Productor

La reactivación vuelve la cuenta a `ACTIVA` con auditoría y aviso. No devuelve al Productor las solicitudes que ya fueron reasignadas; vuelve a ser elegible para nuevas asignaciones.

### Códigos de error

| Código | Cuándo |
| --- | --- |
| `NO_AUTENTICADO` | Token ausente o inválido |
| `CUENTA_INACTIVA` | La cuenta está en `BAJA` |
| `ACCESO_DENEGADO` | Ninguna política autoriza la operación |
| `REGISTRO_YA_COMPLETO` | La identidad ya tiene cuenta |
| `INVITACION_INVALIDA` | Token inexistente, usado, vencido o invalidado |
| `EMAIL_NO_COINCIDE` | El email verificado no es el invitado |
| `PRODUCTOR_NO_DISPONIBLE` | El Productor destino no tiene cuenta `ACTIVA` (reutilizado de TDD-SW-005) |
| `REASIGNACION_DERIVADA_NO_PERMITIDA` | Reasignación de DERIVADA fuera de la baja guiada (reutilizado de TDD-SW-005) |
| `SIN_PRODUCTOR_DISPONIBLE` | Baja de Productor sin otro Productor con cuenta `ACTIVA` |
| `DISPOSICION_INCOMPLETA` | La baja guiada deja algún caso sin Productor destino |
| `CANCELACION_PENDIENTE` | La baja guiada encuentra una `CancellationRequest` sin resolver (reutilizado de TDD-SW-005) |
| `CONFLICTO_CONCURRENCIA` | Otra operación modificó el caso (reutilizado de TDD-SW-003) |

## Datos, consistencia y migraciones

El modelo lógico parte de [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); este TDD agrega el detalle de identidad. La base es la nueva del Portal: no hay migración desde el PostgreSQL histórico de MAPS, que no es dependencia funcional.

| Entidad | Datos relevantes | Restricciones |
| --- | --- | --- |
| `UserIdentity` | `issuer`, `subject`, rol (`CLIENTE`, `PRODUCTOR`, `ADMIN`), estado (`ACTIVA`, `BAJA`), fecha, Admin y motivo de baja o reactivación | Par `issuer + subject` único; un único rol por cuenta; sin vínculos a Customer/Producer para `ADMIN` |
| `Customer` | Email (copia del verificado, sólo lectura), datos del perfil básico (campos a confirmar) | A lo sumo una `UserIdentity`; los datos sensibles de cada solicitud viven en sus respuestas y no en el perfil |
| `Producer` | Datos, email, referencia a `UserIdentity` (vacía hasta aceptar la invitación) | A lo sumo una `UserIdentity` (índice único); sin `UserIdentity` activa no es asignable |
| `ProducerInvitation` | `producerId`, email invitado (normalizado), hash del token, `expiresAt`, estado | A lo sumo una `PENDIENTE` por Productor; el token no se guarda en claro |

Invariantes:

- Una persona con dos roles usa dos cuentas y, probablemente, dos emails: es la restricción propuesta del MVP de ADR-SW-005, condicionada a la factibilidad que confirme ADR-CLD-007.
- El estado de cuenta (`ACTIVA` o `BAJA`) es independiente del estado de cualquier `InsuranceRequest`.
- No se modela inhabilitación: la elegibilidad para asignar depende sólo de la cuenta `ACTIVA`. Si MAPS mantiene RN-20, se incorpora en Identity sin cambiar los flujos de Assignment (decisión 7 de TDD-SW-005).
- El email del Cliente no es editable en el Portal ni por el Cliente ni por el Admin. Un cambio excepcional lo resuelve Kondor con un procedimiento manual y auditado que actualiza el proveedor y el Portal juntos.

Transacciones:

- `CompleteRegistration`, `AcceptProducerInvitation` y la baja guiada se ejecutan en una única unidad de trabajo.
- Los efectos externos (avisos, entregas) se registran por outbox en esa misma transacción ([ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md)).
- Los comandos que modifican solicitudes usan control optimista con `version` (TDD-SW-003).

## Seguridad y privacidad

- Deny by default en todos los casos de uso; una sola fuente de verdad de permisos.
- Tokens de invitación de un solo uso, con hash y vencimiento, y doble verificación (token y email). El enlace del email nunca concede acceso por sí mismo.
- MFA obligatorio para Admin como requisito, sujeto a verificación en el proveedor elegido (ADR-CLD-007).
- La cuenta de Admin se crea sólo por procedimiento controlado y no se puede escalar desde el Portal.
- El Admin no puede modificar el email de nadie, lo que elimina el riesgo de apropiarse de una cuenta cambiando la dirección de recuperación.
- Minimización de datos personales: los eventos de auditoría y los logs guardan identificadores, no respuestas, documentos, DNI, CUIT, teléfono ni datos de riesgo ([F1 §6](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md)).

### Auditoría de identidad y accesos

| Grupo | Eventos |
| --- | --- |
| Siempre | Alta, baja y reactivación de cuentas; cambios de rol; creación de Admin; invitaciones (creación, reenvío, invalidación por edición del email, aceptación); asignaciones y reasignaciones; actualización de email por sincronización |
| Apertura de expediente | Cada apertura por un Productor: actor, solicitud y fecha |
| Denegaciones | Accesos denegados con actor, acción, recurso y motivo |

Los accesos permitidos del resto de los roles no se registran. Los intentos de login fallidos sólo se incorporan si el proveedor los expone de forma integrable (ADR-CLD-007). El MVP no incluye una vista de consulta de accesos: quedan registrados para investigar incidentes. Cómo se almacenan y consultan lo define TDD-SW-007.

## Operación y observabilidad

La operación de identidad (disponibilidad del proveedor, gestión de sesiones, recuperación de acceso, invitaciones y altas de Productores) se coordina con ADR-CLD-007 y TDD-CLD-006. Este TDD aporta señales mínimas que Cloud puede recolectar sin PII:

- Conteo de `ACCESO_DENEGADO` y `CUENTA_INACTIVA`.
- Resultado de `AcceptProducerInvitation` (aceptadas, `INVITACION_INVALIDA`, `EMAIL_NO_COINCIDE`).
- Fallas de la baja guiada por tipo de error.

Si el proveedor de identidad no está disponible, se pierden nuevos logins; las sesiones vigentes siguen sujetas a la expiración del token y al chequeo local de cuenta.

## Pruebas y criterios de fallo

Las pruebas de política se ejecutan sin infraestructura (ADR-SW-002); las de integración con el proveedor se distinguen de las simuladas.

- **Matriz de políticas:** para cada fila del catálogo, un caso permitido y al menos uno denegado por rol y por estado.
- **AccessScope:** un Cliente nunca lista solicitudes ajenas; un Productor nunca ve ASIGNADAS, ENVIADAS, CANCELADAS ni DERIVADAS de otro; el Admin no ve BORRADORES. Una prueba de arquitectura falla si un repositorio acepta una consulta sin scope.
- **Revocación:** token criptográficamente válido con cuenta en `BAJA` es rechazado en la siguiente request; un comando en curso que relee la cuenta ya en `BAJA` se rechaza.
- **Assignment y acceso:** `PENDIENTE_ENTREGA` y `CERRADO` no autorizan al Productor; un resultado de entrega tardío no revive un Assignment `CERRADO`.
- **Registro:** doble `CompleteRegistration` concurrente crea una sola cuenta; una identidad sin cuenta no ejecuta otros comandos.
- **Invitación:** token usado, vencido, invalidado o con email distinto es rechazado; reenviar o editar el email invalida la anterior; el email con mayúsculas o espacios distintos coincide; una identidad con cuenta no acepta; un email verificado cambiado en el proveedor después de la emisión falla con `EMAIL_NO_COINCIDE`.
- **Invitación, integración con PostgreSQL real:** dos aceptaciones concurrentes del mismo token (misma identidad o identidades distintas) crean una sola cuenta; aceptar y reemitir en paralelo tiene un solo efecto.
- **Baja guiada:** con casos sin destino se rechaza; con `CancellationRequest` pendiente se rechaza; sin otro Productor habilitado se bloquea; ante conflicto de concurrencia no queda ningún cambio parcial; tras el commit el Productor pierde el acceso y el nuevo no lo obtiene hasta la entrega exitosa. Las carreras con asignaciones, reasignaciones y resultados de entrega se prueban contra PostgreSQL real (TDD-SW-005).
- **Reactivación:** no devuelve solicitudes ya reasignadas.
- **Auditoría:** cada evento del catálogo se registra sin datos personales innecesarios.

## Implementación y handoff a F4

Secuencia sugerida, sin crear Epic ni Issues F4:

1. Módulo Identity: `UserIdentity`, `IdentityProviderPort` con un adaptador simulado y resolución del actor.
2. Evaluador de políticas y `AccessScope` con las pruebas de arquitectura.
3. `CompleteRegistration`, `Customer`, baja y reactivación de Cliente.
4. `Producer`, `ProducerInvitation` y `AcceptProducerInvitation`; comando `create-admin`.
5. Baja guiada de Productor, junto con los flujos de reasignación de [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md).
6. Auditoría de identidad, con TDD-SW-007.

Dependencias entre equipos: ADR-CLD-007 y TDD-CLD-006 antes de integrar un proveedor real. Las áreas condicionadas por MAPS (Mi perfil, inhabilitación, consentimientos) se excluyen de un primer tramo de F4 hasta que se cierren.

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| Alcance de la inhabilitación de Productor (RN-20) | MAPS | Elegibilidad sólo por cuenta `ACTIVA`, sin estado nuevo | MAPS cierra RN-20 o se quita del MVP con cambio controlado de F1/F2 |
| Campos de Mi perfil (MAPS-97) | MAPS; Kondor propone | Frontera de autorización y propuesta de perfil básico (nombre y datos de contacto, sin datos sensibles) | Aprobación de MAPS |
| Alta de Cliente por Admin (F2 ADM-10) | Kondor + MAPS | Fuera del MVP; la invitación puede generalizarse a otros roles | Confirmar con MAPS si se requiere |
| Carga inicial de unos 200 Productores | Kondor + MAPS | Decidido: alta e invitación individual en el MVP | Importación e invitación masivas se evalúan en F4 |
| Textos y versión de consentimientos del registro | MAPS | Paso de registro con punto de extensión | Textos aprobados |
| Factibilidad en el proveedor: cuenta única por rol, MFA de Admin, bloqueo del cambio de email por el usuario, revocación de sesiones, eventos de login | Software + Cloud | Diseño detrás de `IdentityProviderPort` | ADR-CLD-007 |
| Validación de tokens y TTL de una eventual caché | Software + Cloud | Contrato del puerto; revocación inmediata por consulta local | TDD-CLD-006; una caché se registra como desvío aceptado del contrato de revocación, con su TTL máximo |
| Confirmación de la secuencia de baja RN-19 (operación única) | Kondor + MAPS | Decidido por Kondor el 2026-10-28, sin validación de MAPS; diseño coherente con TDD-SW-005. Pendiente funcional, no defecto técnico | Ratificación de MAPS (DEP-07, MAPS-167) y, si corresponde, cambio controlado de F1/F2 y actualización del prototipo de PR #19 |
| Vencimiento de la invitación | Kondor | Decidido: 7 días iniciales, configurable | Ajustar con la operación si hace falta |
| Almacenamiento y consulta de la auditoría | Software + Cloud | Catálogo de eventos de este TDD | TDD-SW-007 y TDD-CLD-007 |

## Referencias y trazabilidad

- ADR y TDD relacionados: [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md), [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md), [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md); previstos TDD-SW-007, ADR-CLD-007, TDD-CLD-006, TDD-CLD-007.
- Fuentes F0/F1/F2: [F1 §3/5, RN-02/04/05/14/15/16/17/18/19/20, RF-CLI-01, RF-PRODUCER-01/02/03, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §6/7/11/12/13](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Filas de [traceability.md](../../../traceability.md): acceso del Productor; ABM de Clientes y Productores; Mi perfil.

## Respuesta a la revisión

Revisión técnica Software de Santiago Talavera en la PR #27. La revisión cruzada Cloud/seguridad y la aprobación documental quedan aparte.

| Punto | Respuesta en este documento |
| --- | --- |
| RN-19 / decisión funcional pendiente | [Aclaraciones](#aclaraciones-respecto-del-adr-sw-005), baseline y [Decisiones abiertas](#decisiones-abiertas): decisión de alcance Kondor sin validación de MAPS, pendiente funcional distinto de un defecto técnico; cierra con DEP-07/MAPS-167 y, si corresponde, cambio controlado de F1/F2 y del prototipo |
| Concurrencia de baja guiada | [Baja guiada de Productor](#baja-guiada-de-productor): bloqueos de cuenta que aporta Identity por sus puertos; la serialización completa y las pruebas con PostgreSQL real, en [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md#baja-de-productor) |
| Contrato de revocación / IdP | [Resolución del actor](#resolución-del-actor-por-request): revocación inmediata por consulta local; MFA, bloqueo del cambio de email, revocación de sesiones y TTL de caché sin garantizar hasta ADR-CLD-007/TDD-CLD-006; una caché se registra como desvío aceptado |
| Invitaciones y consistencia | [Alta e invitación de Productor](#alta-e-invitación-de-productor): reemisión, normalización, cambio de email o recuperación antes de aceptar, concurrencia y pruebas de aceptación concurrente |
