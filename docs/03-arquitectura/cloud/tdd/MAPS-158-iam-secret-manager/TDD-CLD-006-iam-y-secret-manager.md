# TDD — IAM y Secret Manager

| Dato | Valor |
| --- | --- |
| ID | `TDD-CLD-006` |
| Título | IAM y Secret Manager |
| Estado | `BORRADOR` |
| Fecha | 2026-10-28 |
| Autor | Santiago Talavera |
| Revisores | Joaquin Rodriguez — revisión cruzada pendiente |
| Work item | [MAPS-158](https://santitalavera.atlassian.net/browse/MAPS-158), relacionado con [MAPS-123](https://santitalavera.atlassian.net/browse/MAPS-123) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-158 |
| Fase origen | [F0 §0.4/0.5/0.6/0.8](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 RN-02/04/05/14/15/16/17/18/19/20, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §6/11/12/13/14/16](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-CLD-007](../../adr/MAPS-152-seguridad-cloud/ADR-CLD-007-seguridad-cloud.md) (`PROPUESTO`, condicionante); [ADR-SW-005](../../../software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) (`ACEPTADO`); [TDD-SW-001](../../../software/tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); [TDD-SW-003](../../../software/tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md) |
| Depende de | ADR-CLD-007; RN-20 y perfil pendientes; C1 aún propuesto en PR #29; topología/ambientes C3/C4; pipeline C8; prueba DB auth |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `BORRADOR`, `EN REVISIÓN`, `APROBADO`, `REEMPLAZADO`. Este diseño es borrador y queda condicionado mientras ADR-CLD-007 siga `PROPUESTO`.

## Propósito y límites

Diseña la materialización inicial de IAM, proveedor de identidad, identidades de workloads, Secret Manager, federación CI/CD y acceso humano que derivan de [ADR-CLD-007](../../adr/MAPS-152-seguridad-cloud/ADR-CLD-007-seguridad-cloud.md). El objetivo es dejar límites y criterios implementables; no registrar infraestructura desplegada ni pruebas ejecutadas.

C2 puede definir responsabilidades de principals, scopes, controles de token, uso de secretos, trust boundaries y pruebas de acceso. No decide topología de red, proyectos por ambiente, ingress/DNS, pipeline completo, permisos funcionales, roles definitivos de Cloud SQL/Storage, plataforma de observabilidad ni infraestructura real.

C1 PR #29 sigue abierta y no es baseline. Sus candidatos Cloud Run Service/Jobs/Scheduler se usan sólo para dar nombres conceptuales a `api-runtime`, `outbox-runtime`, `migration-runtime` y `scheduler-invoker`. Si cambia C1, se conserva el modelo de identidad por responsabilidad y se reasocian los principals a los workloads aceptados.

**Regla de frontera:** IAM Cloud gobierna acceso a recursos y APIs GCP. RBAC + ownership del Portal gobierna Customer, Productor, Admin, solicitudes, Assignment y acciones funcionales. Cliente, Productor y Admin no reciben roles IAM GCP para resolver autorización de negocio.

## Baseline y dependencias

| Regla / dependencia | Fuente y estado | Impacto en el diseño |
| --- | --- | --- |
| GCP es la plataforma del MVP | ADR-CLD-000 `ACEPTADO` en main | C2 diseña controles en GCP; no acepta servicios por anticipado |
| IdP gestionado OIDC tras puerto de software | ADR-SW-005 `ACEPTADO` | Identity Platform es candidato C2; `issuer + subject` enlaza la cuenta |
| Token valida identidad; Portal resuelve rol, estado y ownership | ADR-SW-005 `ACEPTADO` | Claims del IdP no son fuente de verdad funcional |
| Request tras baja es denegada desde la siguiente request | ADR-SW-005 `ACEPTADO` | Leer estado local sin cache MVP; revocación IdP es refuerzo, no garantía primaria |
| Admin exige MFA; RN-20 y perfil siguen pendientes | ADR-SW-005; RN-20 `PENDIENTE MAPS`; perfil `PENDIENTE FUNCIONAL MAPS` | Admin usa TOTP y gate de API propuesto; no modelar inhabilitación nueva ni campos perfil |
| API, Outbox y migraciones pueden ser entradas/runtime separados | ADR-SW-001/002 aceptados; C1 PR #29 propuesta | Principals distintos por responsabilidad; no implica microservicios ni aceptación C1 |
| Identity Platform MFA `MANDATORY` opera a nivel de proyecto | Documentación API oficial vigente | Proponer `ENABLED` y enforcement de Admin en API; prueba obligatoria de claim y enrolamiento |
| Automatic IAM DB Auth cuenta con Cloud SQL Node.js Connector oficial y `authType: 'IAM'` | Cloud SQL Connection Options y documentación/repositorio oficial del Node.js Connector; integración Prisma no establecida aún | Capacidad Node.js confirmada; Prisma/adaptador real, pool y lifecycle se validan mediante spike antes de decidir |
| Ambientes requieren identidades y secretos aislados | Constraint C2; distribución de recursos depende C3 | Separación staging/prod independientemente de proyecto único o múltiple |

## Vista de componentes y responsabilidades

### Principales conceptuales

La identidad runtime es administrada por GCP y se resuelve con ADC/credencial temporal. En la matriz, “Puede” describe la capacidad mínima propuesta, no permisos ya otorgados.

| Principal | Tipo | Responsabilidad | Puede acceder a | No debe acceder a | Autenticación | Ambiente |
| --- | --- | --- | --- | --- | --- | --- |
| `api-runtime` | Service account adjunta al servicio API | Requests HTTP, validación token, lectura local `UserIdentity`, operaciones Admin SDK estrictamente necesarias | DB Portal con rol aplicativo; secretos asignados; APIs GCP explícitas que use | Secrets Outbox/migration; cambiar config global IdP; ejecutar migraciones; IAM/roles; otros ambientes | Service identity + ADC; sin key descargable | Una identidad por ambiente; staging y prod distintas |
| `outbox-runtime` | SA adjunta al processor/job candidato C1 | Reclamar/procesar Outbox de acuerdo con ADR-SW-004, email cuando C6 decida proveedor | DB con permisos de aplicación requeridos; secret email cuando exista; APIs necesarias de salida | API-only secrets; migraciones; configuración IdP; IAM; otro ambiente | Service identity + ADC | Una por ambiente |
| `migration-runtime` | SA usada sólo por job explícito | Ejecutar schema migration compatible, serializada y auditable | DB schema/DDL y secret de conexión si el fallback aplica; lectura de artefacto por mecanismo C8 | Secretos API/email, gestión usuario IdP, despliegue/IAM no requeridos | Credencial temporal GCP y DB auth definida por C1/C4 | Una por ambiente; producción con autorización de promoción de C8 |
| `scheduler-invoker` | SA de invocación | Disparar el job programado permitido, si C1 se acepta | `run.jobs.run` del job puntual y token/endpoint asociado | Acceso DB/secrets; operación como runtime; cambios sobre otros jobs | Identidad de ejecución de Cloud Scheduler con OIDC/credencial GCP soportada | Una por ambiente |
| GitHub federated principal | Principal externo WIF, limitado a repo/workflow/ref/environment | Solicitar credencial temporal para tareas CI/CD expresamente autorizadas | Recursos específicos que el pipeline requiera; acceso directo preferido | Secretos/runtime, DB de aplicación, APIs ajenas; roles de administración amplios | GitHub OIDC → WIF; claims/condiciones | Separado por workflow y ambiente permitido |
| `deployer` SA (sólo si necesaria) | SA impersonada desde WIF | Fallback para herramienta/API que no acepta grants directos al principal | Operaciones de deploy autorizadas en C8 sobre recursos indicados | Runtime API/DB/secretos de aplicación; administración global | WIF + short-lived impersonation; `roles/iam.workloadIdentityUser` acotado | Identidad por pipeline/ambiente |
| Human developer | Usuario individual IAM / miembro de grupo | Desarrollo, lectura, operación de bajo riesgo y troubleshooting asignado | Recursos de desarrollo/staging que la función requiera; logs sin PII innecesaria | Producción por defecto; `Owner`; claves; datos de negocio sin necesidad | Cuenta individual con MFA fuerte donde esté disponible; IAM binding/grupo | Sin principal humano compartido; acceso temporal prod sujeto a operación aprobada |
| Human Cloud admin | Usuario individual privilegiado | Cambios IAM/recursos en su ámbito | Recursos bajo responsabilidad y administración necesaria | Acceso cotidiano con Owner; impersonation indiscriminada | Cuenta individual, MFA fuerte, permisos limitados y auditados | Privilegio segregado por ámbito/ambiente |
| Break-glass | Identidad humana de emergencia separada | Recuperación de control cuando acceso normal falla | Sólo operaciones definidas por runbook y recursos críticos | Uso cotidiano; acceso sin logging; `Owner` asignado sin análisis | MFA fuerte y custodia controlada; activación registrada | Emergencia; revisar y retirar elevación tras uso |
| Usuarios Identity Platform | Identidades de aplicación Cliente/Productor/Admin | Autenticarse ante MAPS | Endpoints Portal según autorización local | IAM GCP, consola, secretos o APIs Cloud | OIDC ID token verificado por API; Admin con TOTP gate | Cuenta local por entorno según solución C3; sin rol IAM por rol Portal |

**Implicaciones del invoker:** si el patrón Job + Scheduler sigue propuesto, quien invoca no reutiliza `outbox-runtime`. Se concede sólo la capacidad para ejecutar el Job correspondiente; el job usa su propia SA al acceder a DB/secrets. El nombre de permiso exacto se verifica con el recurso Cloud Run elegido y C1.

### No compartir permisos

- Cada workload tiene una SA propia por responsabilidad; no una SA compartida por “módulo Software”.
- El runtime de API no migra el esquema ni accede al secreto del worker por defecto.
- Identidad GitHub que despliega no es la identidad de runtime que opera tras el deploy.
- La SA asignada a un workload no se usa como principal humano.
- Los principals staging/prod, sus grants y sus secretos son distintos aunque C3 termine con un proyecto común.

### Identidad de usuario, token y autorización

1. Usuario inicia sesión/verifica email en Identity Platform.
2. Cliente envía ID token por HTTPS al Portal.
3. API valida firma, `iss`, `aud`, `exp`, `sub`, `iat/auth_time` y reglas de rotación/cache JWKS con librería soportada. Rechaza token ausente, malformado o de otro proyecto.
4. API resuelve `issuer + subject` en `UserIdentity`; email sólo es atributo y nunca identificador de vinculación/autorización.
5. API lee estado local de cuenta. `BAJA` rechaza, aunque firma/token sea válido. En MVP no se cachea el estado.
6. La capa application evalúa rol, ownership, Assignment `EFECTIVO` y política de caso de uso según ADR-SW-005.
7. Auditoría de autorización/acceso relevante la registra Software en `AuditEvent`, minimizando datos personales.

No se colocan rol, estado ACTIVA/BAJA, `customerId`, `producerId`, Assignment ni permisos de dominio en custom claims para decidir el acceso. Si se usa un claim técnico, su origen y alcance no lo convierten en autoridad de negocio.

### MFA y ciclo de vida de cuentas

| Tipo | Alta | MFA propuesto | Condición de acceso |
| --- | --- | --- | --- |
| Cliente | Autorregistro, email verificado | No obligatorio MVP | Token válido + `UserIdentity` local activa + políticas |
| Productor | Alta/invitación por Admin; email verificado | No obligatorio MVP | Token válido + cuenta activa + solicitudes DERIVADAS con Assignment `EFECTIVO` |
| Admin | Procedimiento controlado; no signup público | TOTP obligatorio antes de activación | API valida señal de segundo factor del token en servidor y estado local activo |

Identity Platform requiere email verificado para MFA y permite TOTP. El setting `MANDATORY` exige segundo factor para el proyecto; no se adopta para mantener Cliente/Productor sin requerimiento. Con `ENABLED`, el servidor exige a toda cuenta local con rol Admin una señal server-verificable de segundo factor y valida que corresponda a TOTP. Para Identity Platform/Firebase, la implementación vigente utiliza `firebase.sign_in_second_factor` —o la representación equivalente expuesta por el SDK servidor— y confirma que el valor indica TOTP. Si falta una señal válida, se deniega el acceso administrativo y la cuenta no opera hasta completar enrollment. El frontend no puede ser la única barrera. El spike verifica enrolamiento, login, token inicial y renovado y comportamiento de refresh/sesión. Un cambio de nombre o representación del claim no requiere reabrir la decisión si el servidor sigue verificando MFA válida; sólo se reabre si no puede sostenerse la garantía de que Admin no opera sin ella.

**Recuperación MFA Admin:** solicitud registrada; identidad de la persona verificada con prueba fuerte y datos independientes del email/canal informal; autorización por un operador distinto cuando sea viable; factor removido mediante acción administrativa autorizada; sesión/token revocado según soporte; evento con quién, cuándo, por qué y resultado; Admin re-enrola TOTP y completa login MFA antes de recuperar operación. No usar preguntas de seguridad, email informal, WhatsApp o conocimiento trivial como prueba suficiente. No existe bypass permanente.

### Provisionamiento Identity Platform

- Cliente puede iniciar su alta, pero el email debe verificarse y la cuenta local debe estar activa. La protección anti-enumeración se habilita; UX responde de forma genérica en login/recuperación y controla abusos. Identity Platform todavía puede devolver un error de email existente en algunos casos de signup; no se afirma que todos los endpoints eliminen toda señal.
- Admin crea/invita a Productor mediante operación autorizada. No se marca email verificado por conveniencia; la persona debe completar verificación propia.
- Admin se crea fuera del flujo público y queda localmente inactivo/no operativo hasta completar TOTP y vinculación controlada a `issuer + subject`.
- En baja de Cliente/Productor, Portal marca `BAJA` en su propia transacción y solicita deshabilitar identidad/revocar refresh tokens si corresponde. Fallo del IdP genera operación/reintento auditable; no revierte autorización local ya denegada.
- En reactivación, Portal sólo devuelve cuenta local a `ACTIVA` por acción Admin. IdP sólo se habilita conforme a un flujo controlado y no restaura Assignment ni ownership por sí mismo.
- `allowDuplicateEmails=false` es la configuración propuesta. Una persona con cuenta independiente por rol debe usar email/login diferenciados; la configuración no reemplaza el vínculo estable `issuer + subject`.

### IAM de Identity Platform para runtime

Los roles predefinidos `roles/firebaseauth.admin`, `roles/identityplatform.admin` y `roles/identitytoolkit.admin` pueden abarcar configuración y administración amplia de usuarios. No se los concede automáticamente al API.

| Operación MAPS candidata | Permiso/documentación oficial asociada | Tratamiento propuesto |
| --- | --- | --- |
| Verificar firma/claims con llave pública | SDK de verificación valida ID token; no equivale a administrar configuración | Verificar si el método de SDK utilizado requiere API/credencial adicional; no asumir admin role |
| Crear usuario Producer | `firebaseauth.users.create` figura para creación de usuario | Sólo si la operación permanece en runtime; grant mínimo validado y separado por ambiente |
| Enviar/generar acción de invitación/verificación | `firebaseauth.users.sendEmail` cubre operaciones de email en matriz oficial | Confirmar método concreto y scope; no conceder `configs.update` |
| Deshabilitar/habilitar o actualizar atributos | `firebaseauth.users.update` | Otorgar sólo si ciclo de baja/reactivación requiere sincronización en IdP; Portal conserva su estado fuente |
| Revocar sesiones / consulta de cuenta | `firebaseauth.users.update` / `get` según método del API y matriz vigente | Verificar llamada y necesidad; no tratar revocación como control funcional principal |
| MFA recovery / cambios de factores | Admin SDK opera sobre usuario; permisos exactos deben mapearse | Fuera de API normal; principal humano controlado o herramienta excepcional separada |
| Configurar providers/MFA/emails/proyecto | `firebaseauth.configs.*` | Sólo operador Identity Platform; jamás permiso runtime por default |

Antes de fijar role bindings, confirmar permisos por método/API en matriz oficial actual. Si un predefined role es demasiado amplio, probar custom role con el conjunto mínimo que realmente funciona. Un custom role no se presume suficiente hasta validar endpoints, SDK y logs. Si no se puede aislar la gestión de usuarios del runtime, registrar ese riesgo y considerar interfaz de administración separada como futura decisión; no inventar microservicios en este TDD.

## Contratos y flujos

### Tabla de secretos

No se escriben valores reales en este documento. Cada valor es propiedad del ambiente y consumidor que necesita operar con él.

| Secreto conceptual | Consumer | Owner operativo | Ambiente | Entrega propuesta | Rotación / ciclo | Scope IAM |
| --- | --- | --- | --- | --- | --- | --- |
| Credencial proveedor de email (cuando C6 elija proveedor) | `outbox-runtime` | Cloud/C6 + owner del proveedor | Uno por ambiente que envíe | Secret Manager; env var con versión explícita para nueva revisión o volumen montado si app soporta reload | Crear en alta; rotar por política del proveedor/incidente; desplegar o recargar; rollback a versión previa habilitada; deshabilitar antigua tras validar | `secretAccessor` al secreto del worker exclusivamente |
| Password DB de fallback si IAM DB Auth no pasa spike | API y/o migration runtime estrictamente necesario | Cloud/C1/C4 | Un valor distinto por ambiente/workload cuando DB users separados | Secret Manager; env var con versión explícita por startup/revisión | Rotación coordinada con DB user y rollout; validar conexión; mantener rollback acotado y deshabilitar versión previa según runbook | Grant por secreto a consumer que conecta; migration secret separado si credenciales distintas |
| Webhook signing secret futuro | Handler de webhook sólo si se incorpora | C6/Software | Separado por ambiente y emisor | Secret Manager; archivo montado sólo si el handler relee seguro | Rotar con ventana de validación y versionado del emisor; sin período supuesto | Sólo workload consumidor del webhook |
| API key de proveedor externo futuro | Módulo/worker que lo consuma | Owner de la integración | Por ambiente | Secret Manager | Según ventana/incidente del proveedor, sin intervalo inventado | Sólo consumidor de integración |
| Credencial de servicio gestionada por GCP | Ninguno como archivo de key persistente | Cloud | N/A | No generar key; attached identity/ADC o WIF | No se almacena/rota key de usuario; revocar bindings/identidad cuando corresponda | Permisos IAM específicos del principal |

**Configuración no secreta** (URLs públicas, feature flags no sensibles, timeouts aprobados) va en configuración del workload. API keys públicas que el proveedor identifica expresamente como públicas no deben confundirse con credenciales servidor ni usarse como autorización.

### Secret Manager: lectura y versionado

- Crear un secreto separado por credencial y ambiente; evitar un “bundle” que obligue a varios workloads a leer lo mismo.
- Grant `roles/secretmanager.secretAccessor` al nivel del secreto a cada workload necesario. No dar el rol en proyecto como default.
- **Environment variable:** preferir versión numérica explícita; el valor se resuelve al iniciar cada instancia y una versión inaccesible puede impedir que inicie. La rotación requiere una nueva instancia/revisión según el rollout elegido.
- **Mounted volume:** puede referenciar `latest` o una versión numérica. Si refiere `latest`, una lectura posterior puede obtener la versión que esté marcada como latest y facilitar la rotación sin redeploy; si refiere un número, permanece fijado a esa versión. Sólo usar `latest` cuando el consumer soporte y pruebe reload seguro; manejar cambios, errores parciales y lecturas concurrentes. No se prescribe `latest` para todos los secretos.
- Verificar que no se registren valores, headers de autorización, contraseñas ni payloads sensibles en logs/traces/crash dumps.
- Ciclo operable: crear versión → distribuir al consumer mínimo → verificar health/conexión → promover versión → observar → deshabilitar versión anterior cuando exista ventana de retorno → destruir sólo según política aprobada. No establecer una cadencia universal no acordada.
- Exposición confirmada en runtime es incidente: revocar/rotar, revisar logs de acceso, identificar consumers y validar que la credencial anterior no funciona. Esto no altera retención funcional de documentos/datos MAPS.

### GitHub Actions y Workload Identity Federation

1. Un workflow obtiene un GitHub OIDC token por permisos mínimos y sólo en el job que necesita GCP.
2. El provider WIF valida issuer, audience, firma y condiciones de atributos; rechaza cualquier repo/branch/environment fuera de allowlist.
3. Se mapean claims estables. Priorizar `repository_id` y `repository_owner_id` numéricos; combinar con `ref`, `environment`, `workflow` o `job_workflow_ref` cuando el evento/pipeline los emita y sea necesario. Verificar claims reales antes de escribir CEL.
4. No confiar sólo en el issuer compartido ni permitir todo el pool. La identidad federada recibe acceso directo al recurso con rol acotado cuando el producto lo admite. Si la API/herramienta necesita una SA, WIF puede impersonar una SA de deploy dedicada; sólo los principals/atributos explícitamente necesarios obtienen `roles/iam.workloadIdentityUser`.
5. No se almacena JSON de service account en GitHub Secrets, Secret Manager, artefactos ni repositorio. WIF entrega credencial temporal; expiración y revocación se verifican en pruebas.
6. C8 define workflow/build/deploy/promotion exactos y los approvals de GitHub Environment; este TDD sólo fija su contrato de confianza y credenciales.

### Acceso humano, impersonation y break-glass

- Una persona = una identidad individual. No compartir cuentas, MFA, service account o key. Usar grupos por función si existe Cloud Identity/Workspace; caso contrario, bindings individuales son válidos para arrancar.
- Acceso diario mediante roles estrechos y a recursos pertinentes; Cloud Developer/Admin no usa roles básicos como atajo.
- Impersonation se concede a persona/grupo específico sobre SA específica, con finalidad, alcance y auditabilidad. Un desarrollador no impersona por defecto `migration-runtime`, production deployer ni una SA de permisos mayores.
- Break-glass tiene identidad/procedimiento separado, MFA fuerte, custodia y documentación de activación; revisar logs y grants tras cada uso. No asignar `Owner` automáticamente; el nivel se determina cuando C3/C4 definan jerarquía y recursos.
- Elevación temporal o acceso de producción debe usar mecanismo de aprobación/expiración que se defina operativamente, no una grant permanente por comodidad. El mecanismo concreto de PAM/JIT no se decide aquí.

### Trust boundaries

| Origen → destino | Identidad / autenticación | Autorización y dato | Fallo esperado | Evidencia/auditoría |
| --- | --- | --- | --- | --- |
| Usuario → Identity Platform | Cuenta; password; email verification; TOTP según rol | IdP verifica credencial y emite token; mensaje UX no revela existencia más de lo necesario | Credencial/MFA inválido, cuenta IdP deshabilitada, IdP no disponible | Eventos IdP disponibles; no asumir integración de logs hasta probar |
| Identity Platform → Portal API | OIDC-compatible signed JWT; HTTPS; issuer/audience/expiry/subject y signing key validada | API identifica principal; no acepta claims del cliente ni email como RBAC | Firma/issuer/aud/exp inválidos; llave no disponible; token no confiable | Rechazo controlado sin token completo ni secretos |
| Portal API → UserIdentity/DB | `api-runtime`; identidad DB definida por C1/C4 | DB autentica SA/token o secret de fallback; software consulta estado/rol/ownership | Denegación DB, pool agotado, credencial expirada/rotada | Métrica de conexión/error; AuditEvent de acceso funcional separado |
| Workload → Secret Manager | Attached SA/ADC del workload | `secretAccessor` al ID de secreto y ambiente precisos; dato secreto sólo en memoria/archivo controlado | Secret no existe, versión deshabilitada, permiso negado o API caída | Cloud audit de acceso cuando habilitado; log del workload sólo ID/version sin valor |
| Scheduler → Job (candidato C1) | Principal de scheduler y token/identidad de invocación GCP | Puede disparar el Job específico, sin acceso a runtime secrets/DB | Sin permiso, audience inválida, job inexistente | Audit log de invocación + resultado de ejecución |
| Job → recurso DB/API | `outbox-runtime` o `migration-runtime`, distintos | Sólo recursos/policies correspondientes a processor o migration | Recurso ajeno rechazado; credencial inválida | Cloud logs + logs de trabajo sin payload sensible |
| GitHub → WIF → recurso GCP | OIDC del job; claims issuer/aud/repo/ref/environment/workflow | Conditions + principal directo o impersonation SA dedicada; permisos de build/deploy acordados por C8 | Claim/repo/branch incorrecto, audience/provider no válido, token expirado | IAM audit logs registran principal federado/delegación; no loguear token |
| Human → GCP IAM | Cuenta humana individual + MFA conforme al proveedor | Binding/grupo de función, tiempo y recurso mínimo | MFA ausente, binding retirado, impersonation fuera de scope | Admin Activity/PAM o evidencia operacional; ticket para privilegio extraordinario |
| Break-glass → GCP | Identidad de emergencia con MFA y custodia | Procedimiento explícito, privilegio derivado del recurso; sin acceso diario | Credencial de emergencia inaccesible o uso no autorizado | Registro de quién/por qué/ventana/acciones; revisión posterior |

### Cifrado y protección de datos

- TLS se requiere para token en tránsito, llamadas al Admin API/Secret Manager y conexión DB. La conectividad privada, ingress y VPC se materializan en C3/C4; no se infiere que “private” elimine TLS.
- Para servicios GCP del MVP, cifrado administrado por Google en reposo es baseline propuesta. CMEK requiere necesidad contractual/legal o control específico aprobado, más diseño de disponibilidad/rotación/recovery de clave.
- No incluir ID token, refresh token, MFA seed, recovery evidence, secretos, email completo ni información del expediente en logs Cloud. Logging de autenticación e intentos relevantes se minimiza y limita.
- Datos financieros/identificatorios del Portal permanecen bajo política de dominio y retención MAPS. IAM y cifrado no autorizan usos analíticos ni eliminan datos.

## Datos, consistencia y migraciones

Este TDD no cambia tablas, transacciones, políticas RBAC ni migraciones de Software. El token verificado se transforma a un actor de aplicación por `issuer + subject`; `UserIdentity` local se consulta en cada request autenticada del MVP. La baja se confirma en PostgreSQL del Portal antes de intentar efectos externos; deshabilitar usuario/revocar refresh token en IdP es efecto posterior reintentable con Outbox si Software lo determina. Nunca se revierte `BAJA` local sólo porque el proveedor no respondió.

El orden y persistencia de eventos técnicos de sincronización/revocación pertenece a la implementación Software/Outbox y requerirá TDD-SW-004/005. C2 sólo fija que fallo de revocación externa no devuelve acceso al Portal.

## Operación y observabilidad

Mínimas señales que C5/operación debe considerar, sin diseñar dashboards completos:

| Área | Señal | Cuidado |
| --- | --- | --- |
| IAM | cambios de policy, grants de roles básicos, key creation/upload, impersonations, WIF rejection | Alertar cambios inesperados; mantener actor y recurso; no guardar credenciales |
| Secrets | lectura/denegación por principal y versión; rotación; disable/destroy | Data Access logs pueden requerir activación y agregar costo/volumen; probar primero servicios críticos |
| Identity Platform | signup/login failures, enrollment/recovery Admin, user disable/revoke y errores API | Confirmar disponibilidad de eventos exportables y manejo de PII; audit funcional Portal separado |
| Token/API | issuer/audience/signature/expiry failures y Admin sin MFA claim | Registrar categoría y correlación, no bearer token ni credenciales |
| WIF | principal/subject/ref/environment autorizado y denegado | Log de delegación debe permitir atribuir workflow y usuario; rotación/claim mapping revisados |
| Workload/DB | acceso a secreto/DB denegado, credencial/pool failure | C1/C4 determinan métrica de conexión; evitar valores en error detail |
| Break-glass | inicio y fin, actor, motivo, grants, recurso, revisión | Evidencia obligatoria tras cada uso |

Cloud Audit Logs distingue Admin Activity, Data Access, System Event y Policy Denied. Admin Activity siempre está activo; Data Access normalmente debe habilitarse y puede generar volumen/costo. C5/owner debe definir por API crítica y nivel de sensibilidad qué Data Access habilita, su retención y controles de acceso. Logs Cloud no reemplazan AuditEvent de solicitud ni decisión RBAC.

## Seguridad y privacidad

### Permisos de identidad

- Un principal federado o SA no recibe permisos globales por pertenecer a un proyecto/pool.
- Preferir predefined roles estrechos; usar custom roles si roles predefinidos incluyen permisos de configuración o administración no requeridos.
- Conceder `roles/secretmanager.secretAccessor` por secreto; otros roles de invoker/deployer por workload y recurso puntual.
- Nunca conceder basic roles `Owner`, `Editor`, `Viewer` a runtime/pipeline como sustituto de diseño de permisos.
- Prohibir user-managed service-account keys para uso normal. Si no hay Organization Policy, mantener política documentada, quitar `serviceAccountKeyAdmin`/permiso de creación de grants no requeridos, revisar eventos/auditoría y gestionar excepciones de forma explícita. No guardar keys en Secret Manager como mitigación.
- Restricción `iam.disableServiceAccountKeyCreation`/`iam.disableServiceAccountKeyUpload` depende de jerarquía organizacional y permisos; comprobar aplicabilidad real. Si no hay organización, el control no se presume disponible.

### Comportamiento de fallos

| Fallo | Respuesta de seguridad | Categoría y recuperación |
| --- | --- | --- |
| Token expirado, firma inválida, issuer/audience incorrecta | Rechazar antes de aplicación; no consultar rol por email | Autenticación; renovar login/token; log técnico minimizado |
| JWKS/llave temporalmente no recuperable | Usar cache conforme a TTL publicado cuando válida; no aceptar token cuya firma no se puede validar; 503 controlado si falla proveedor/token endpoint | Autenticación/infra; retry con límite; alertar disponibilidad |
| IdP válido pero `UserIdentity` `BAJA` | Rechazar siguiente request aunque JWT válido | Autorización Portal; estado local es fuente de verdad |
| Admin autenticado sin señal server-verificable válida de MFA TOTP | Denegar acciones Portal y exigir enrollment/login MFA; no confiar en frontend | Requisito Admin; revisar token/claim equivalente del SDK y recuperación |
| IdP temporalmente caído | Sesión/token existente puede verificarse mientras checks locales/llaves estén disponibles; nuevas sesiones y llamadas admin API pueden fallar; no fallar abierto | Disponibilidad; retry controlado y operación; no deshabilitar MFA |
| Workload sin permiso | GCP responde permission denied; workload falla closed y emite error sin dato sensible | IAM; revisar principal, grant y recurso esperado; no escalar rol global por urgencia |
| Secret inexistente/deshabilitado/versión inaccesible | Instancia no inicia si env secret; volumen falla al leer; no sustituir con `.env` ni fallback oculto | Configuración/secret; revisar versión, policy y rotación; rollback explícito |
| Secreto rotado mientras instancia usa valor anterior | Environment variable conserva el valor de inicio hasta nueva instancia; volumen refleja la versión configurada: con alias `latest` puede observar una nueva versión en lecturas posteriores, mientras una versión numérica permanece pinneada | Operación; verificar rollout/reload y conexión; no asumir actualización instantánea |
| Credencial DB inválida/token expirado o connector no compatible | Rechazar DB; no reintentar infinitamente ni aflojar TLS; alerta y recuperación por rotación/connector | Infraestructura; fallo closed; C1/C4 evalúa IAM auth vs Secret Manager |
| WIF repo/ref/environment/claim incorrecto | STS/provider rechaza; no impersonar ni emitir credencial | Autenticación pipeline; validar claims reales/config, no quitar condition como atajo |
| Impersonation no autorizada | API IAM deniega; investigar actor, SA y audit trail | Privilegio; retirar binding indebido y analizar incidente |
| MFA Admin perdido | Denegar acceso Admin hasta recuperación verificada por operador autorizado; reset factor, revocar refresh, re-enroll | Recuperación privilegiada; registrar evidencia y no bypass persistente |
| Administrador no enroló TOTP | Cuenta no queda habilitada para usar Portal; la API no crea excepción de rol | Provisionamiento; terminar enrollment controlado |

Separar error de autenticación (identidad/token no válida) del error de autorización (identidad válida sin cuenta activa/permisos del caso). Mensajes externos no exponen detalle de usuarios existentes, secretos o políticas internas.

## Pruebas y criterios de fallo

**PLAN DE VALIDACIÓN — no ejecutado.** No hay evidencia de infraestructura ni de Identity Platform real asociada a este TDD. El spike, cuando se autorice, usa entorno de prueba aislado y registra fecha, configuración, versiones, resultados y costo; no usa cuentas productivas ni consume créditos sin autorización.

| Caso | Verificación | Criterio de fallo |
| --- | --- | --- |
| Signup Cliente | Puede registrarse, verifica email, recibe token con issuer/audience esperados y no obtiene rol por claim controlado por cliente | Usuario no verificado opera; issuer/audience incorrectos aceptados; señal de email existente revela dato innecesario |
| Password reset | Flujo de acción válido, respuesta pública genérica y abuso controlado | Endpoint enumera cuenta o enlace reutilizable/inseguro |
| Productor administrado | API/procedimiento crea e invita; email se verifica por el usuario; permisos API sólo los necesarios | Autorregistro Producer; email marcado verificado sin prueba; runtime obtiene permisos de config global |
| Admin controlado | Cuenta fuera del signup público, vinculada localmente y no activa antes de TOTP | Admin opera antes de enrollment o por self-signup |
| MFA Admin | Probar Admin enrolado; login con TOTP; señal server-verificable en token inicial, token renovado y refresh/session; ausencia de señal con login sin MFA; validar representación exacta en Admin SDK. Cliente/Productor deben operar sin requisito MFA obligatorio | MFA obligatorio inadvertido para todos, señal no verificable o Admin se salta con token de primer factor |
| Recuperación MFA | Prueba de identidad fuerte, operador autorizado, factor removido, revocación/reenrollment y audit completo | Seguridad se basa sólo en email/canal informal/pregunta; bypass permanece |
| Token inválido | Firma, expiración, `iss`, `aud`, `sub`, key rotation y claims no confiables | Token alterado, otro proyecto o expirado es aceptado |
| Cuenta BAJA con token firmado | Segunda request tras commit se deniega; el mismo JWT no recupera acceso | Caché autoriza luego de BAJA; estado local no consultado |
| IdP caída | Ruta protegida no permite cuenta no validada; capacidad acotada con JWKS cache no acepta firma dudosa | Fallo abierto, error técnico expone secreto o alta parcial |
| API → recurso autorizado | API accede a DB/API realmente requerida | Requiere grant de proyecto amplio o basic role sin justificación |
| API → migration resource | `api-runtime` no puede ejecutar migration job ni usar secret migration | Permiso cruzado aceptado |
| Outbox → recurso | `outbox-runtime` sólo puede usar DB y credenciales del worker requeridas | Secret API/migration accesible |
| Migration → recurso | `migration-runtime` usa sólo DB/schema y artefacto requerido | Acceso a email/user admin/secret ajeno |
| Scheduler → Job | Invoker ejecuta Job permitido pero no accede a recursos runtime | Scheduler SA puede leer secret o conectarse DB |
| Secret scope | Cada workload lee su secreto; otro principal y otro ambiente reciben denegación | Acceso proyecto-wide o staging lee prod |
| Secret rotation | Env pinned requiere nueva revisión; volume reload probado si elegido; versión deshabilitada deniega | Credencial antigua permanece sin control; rollout no recuperable |
| WIF repo correcto | Job permitido en repo/ref/environment produce principal correcto/temporal | Token con branch/event no autorizado recibe credencial |
| WIF repo incorrecto | Repo/owner ID distinto es rechazado | Issuer compartido basta para entrar |
| WIF claim mapping | Claims numéricos y de workflow/ref verificados desde token real; cambios mapping revisados | Condición usa claim inexistente o nombre mutable sin mitigación |
| No long-lived SA key | Inventario muestra cero key descargada en secrets/repo/local pipeline para estos flows; policy organizacional comprobada si existe | JSON key requerido por pipeline normal o policy se afirma sin jerarquía compatible |
| Impersonation | Sólo principal permitido puede asumir SA específica; actor queda atribuible | Developer asume SA productiva/más privilegiada sin necesidad |
| Cloud SQL IAM DB Auth | La capacidad oficial del Node.js Connector con `authType: 'IAM'` está confirmada. Spike con Prisma/adaptador real verifica connection factory, pooling/reuse, token refresh, reconexiones, lifecycle Cloud Run, SSL/network path, permisos PostgreSQL y comportamiento ante revocación | Prisma/adaptador requiere cambio no aceptado, el pool/conector falla con refresh o reconexiones, o no se sostienen permisos y TLS requeridos |
| Password fallback DB | Secret por ambiente y rotación ensayada; password anterior invalidado al completar ventana | Credencial fallback en imagen, env fija manual o logs |

No simular ninguna prueba. Criterios de salida futuros: fallos negativos son denegados, auditoría atribuible, secretos no filtrados, no hay grants amplios sin excepción aprobada, y el plan de recuperación está documentado.

## Implementación y handoff a F4

1. Confirmar aceptación de ADR-CLD-007 y resolver revisión cruzada de Software.
2. Verificar con spike Identity Platform OIDC token, TOTP enrollment/claim, cuenta por rol/email, email privacy y Admin SDK permissions.
3. Decidir identidades y recursos por ambiente en C3/C4; no aplicar bindings hasta conocer esa jerarquía.
4. Definir C8: WIF pool/provider, claim mapping y CEL conditions, build/deploy roles, direct access vs deployer SA, aprobaciones por environment y auditoría.
5. Crear workload identities por responsabilidad; aplicar roles mínimos en recurso puntual; separar invoker y runtime.
6. Configurar Secret Manager con separación por secret/ambiente, version pinning o volumen según consumer; verificar rotación y log hygiene.
7. Ejecutar pruebas de acceso positivo/negativo y revocación; registrar evidencia real de prueba y no cerrar Jira por la sola existencia del documento.
8. En despliegue progresivo, comprobar una muestra de bindings en staging y hacer revisión Cloud antes de promoción a producción.

El orden exacto de IaC/pipeline pertenece a C8. No se crean recursos Cloud ni IAM bindings en esta entrega documental.

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| MFA Admin con IdP y política por rol | Cloud + Software | Diseñar TOTP, gate servidor y recovery | Prueba demuestra Admin sin señal server-verificable de TOTP rechazado y Cliente/Productor no forzados; reabrir ADR sólo si no puede sostenerse que Admin no opera sin MFA válida |
| RN-20 | MAPS | Principals/trust boundaries y baja RN-19 existente | MAPS define si existe efecto adicional de inhabilitación |
| Campos Mi perfil | MAPS + Software | Identidad local/ownership y IAM Cloud | TDD-SW-004 recibe contrato de campos aprobado |
| C1 runtime y DB | Software + Cloud | Principals lógicos por responsabilidad | PR #29 se revisa/integra y ADR-CLD-003/TDD-CLD-003 cambian estado conforme a decisión real |
| Topología y environments | C3/C4 | Exigir isolation y principals/secret distintos | C3 decide proyectos/recursos; C4 networking/Cloud SQL |
| Pipeline exacto | C8 | Trust contract GitHub→WIF | Workflow/build/deploy/promotion y scopes quedan definidos |
| Admin SDK custom role | Cloud + Software | Mapeo inicial de permisos por operación | Pruebas de cada método confirman role mínimo efectivo y no config global |
| IAM DB authentication | C1/C4 | Capacidad Node.js Connector + `authType: 'IAM'` confirmada; preservar alternativa DB user/password en Secret Manager | Spike con Prisma/adaptador real valida connection factory, pooling/reuse, token refresh, reconexiones, Cloud Run lifecycle, SSL/network path, permisos PostgreSQL y revocación sin obligar un cambio no aceptado al adaptador |
| Privilegios break-glass/JIT | Cloud + owner | Reglas de MFA, atribución y revisión posterior | Recursos y jerarquía disponibles; runbook con roles exactos aprobado |
| Data Access logs/costo | C5 + Cloud | Admin Activity siempre disponible; identificar APIs sensibles | Selección por servicio, retención/costo, PII y acceso definidos |
| CMEK | MAPS + Cloud | Google-managed encryption + TLS como baseline | Requisito contractual/legal/operacional documentado y plan de KMS/recovery |
| Precio/limites Identity Platform y Auth0 | Cloud + owner | Comparar modelo de consumo sin congelar cifra | Estimar con MAU/SMS/MFA y plan vigente al seleccionar |

## Referencias y trazabilidad

- ADR/TDD relacionados: [ADR-CLD-007](../../adr/MAPS-152-seguridad-cloud/ADR-CLD-007-seguridad-cloud.md), [ADR-SW-005](../../../software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-001](../../../software/tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-003](../../../software/tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md), [ADR-CLD-000](../../adr/MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md).
- Fila de [traceability.md](../../../traceability.md): autorización de usuario, baja de cuenta, IAM, secretos y ambientes.
- [PR #29](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/29) permanece delta C1 no integrado al 2026-10-28.
- Documentación oficial consultada el 2026-10-28:
  - Identity Platform: [Admin Auth API/OIDC](https://docs.cloud.google.com/identity-platform/docs/concepts-admin-auth-api), [Admin SDK](https://docs.cloud.google.com/identity-platform/docs/install-admin-sdk), [management users](https://docs.cloud.google.com/identity-platform/docs/admin/manage-users), [TOTP](https://docs.cloud.google.com/identity-platform/docs/admin/enabling-totp-mfa), [MFA recovery](https://docs.cloud.google.com/identity-platform/docs/work-with-mfa-users), [programmatic MFA](https://docs.cloud.google.com/identity-platform/docs/admin/manage-mfa-users), [email enumeration protection](https://docs.cloud.google.com/identity-platform/docs/admin/email-enumeration-protection), [config `allowDuplicateEmails`](https://docs.cloud.google.com/config-connector/docs/reference/resource-docs/identityplatform/identityplatformconfig), [pricing](https://cloud.google.com/identity-platform/pricing).
  - Token validation: [Firebase ID token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [decoded ID token claims](https://firebase.google.com/docs/reference/admin/node/firebase-admin.auth.decodedidtoken), [OIDC claims and MFA signal](https://firebase.google.com/docs/reference/admin/node/firebase-admin.auth.decodedidtoken).
  - IAM/credentials: [Firebase Authentication roles and permissions](https://docs.cloud.google.com/iam/docs/roles-permissions/firebaseauth), [Cloud Run service identity](https://docs.cloud.google.com/run/docs/securing/service-identity), [WIF overview](https://docs.cloud.google.com/iam/docs/workload-identity-federation), [GitHub Actions federation](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines), [WIF best practices](https://docs.cloud.google.com/iam/docs/best-practices-for-using-workload-identity-federation), [service-account keys](https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys), [service-account impersonation](https://docs.cloud.google.com/iam/docs/service-account-impersonation).
  - Secrets/audit/cipher: [Secret Manager overview](https://docs.cloud.google.com/secret-manager/docs/overview), [Cloud Run secret delivery](https://docs.cloud.google.com/run/docs/configuring/services/secrets), [Cloud Audit Logs](https://docs.cloud.google.com/logging/docs/audit), [Data Access audit logs](https://docs.cloud.google.com/logging/docs/audit/configure-data-access), [Google-managed encryption](https://cloud.google.com/security/encryption).
  - Cloud SQL: [IAM database authentication](https://docs.cloud.google.com/sql/docs/postgres/iam-authentication), [automatic IAM login](https://docs.cloud.google.com/sql/docs/postgres/iam-logins), [connection options including the Node.js Connector](https://docs.cloud.google.com/sql/docs/postgres/connection-options), [official Node.js Connector and automatic IAM authentication](https://github.com/GoogleCloudPlatform/cloud-sql-nodejs-connector), [Language Connectors](https://docs.cloud.google.com/sql/docs/postgres/connect-connectors).
  - Alternatives: [Auth0 OIDC](https://auth0.com/intro-to-iam/what-is-openid-connect-oidc), [Auth0 MFA recovery code](https://auth0.com/docs/api/authentication/multi-factor-authentication/verify-with-recovery-code), [Auth0 pricing](https://auth0.com/pricing), [Keycloak Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/).
