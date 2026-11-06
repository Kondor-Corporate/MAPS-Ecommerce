# ADR — Seguridad cloud

| Dato | Valor |
| --- | --- |
| ID | `ADR-CLD-007` |
| Título | Seguridad cloud |
| Estado | `PROPUESTO` |
| Fecha | 2026-10-28 |
| Autor | Santiago Talavera |
| Revisores | Joaquin Rodriguez — revisión cruzada pendiente |
| Work item | [MAPS-152](https://santitalavera.atlassian.net/browse/MAPS-152), relacionado con [MAPS-123](https://santitalavera.atlassian.net/browse/MAPS-123) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-152 |
| Fase origen | [F0 §0.4/0.5/0.6/0.8](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 RN-02/04/05/14/15/16/17/18/19/20, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §6/11/12/13/14/16](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-CLD-000](../MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md) (`ACEPTADO`, GCP); [ADR-SW-001](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-005](../../../software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) (`ACEPTADO`, baseline formal vigente hasta eventual aceptación de SW-007); [ADR-SW-007](../../../software/adr/MAPS-216-identidad-multirol-mfa/ADR-SW-007-identidad-multirol-y-mfa-fuera-del-mvp.md) (`PROPUESTO`, target bajo revisión); [TDD-SW-004](../../../software/tdd/MAPS-111-identidad-rbac-ownership/TDD-SW-004-identidad-rbac-y-ownership.md) y [TDD-SW-008](../../../software/tdd/MAPS-115-contrato-api/TDD-SW-008-contrato-api.md) (`BORRADOR`, alineados al target); [TDD-CLD-006](../../tdd/MAPS-158-iam-secret-manager/TDD-CLD-006-iam-y-secret-manager.md) (`BORRADOR`, condicionado) |
| Depende de | Aceptación eventual de ADR-SW-007 para alinear el target MFA/multirol; revisión cruzada; decisiones pendientes de C1/C3/C4/C8 y RN-20 |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `PROPUESTO`, `ACEPTADO`, `RECHAZADO`, `REEMPLAZADO`. Este ADR permanece `PROPUESTO`; no registra aceptación ni aprobación.

## Contexto y problema

GCP está adoptado como plataforma del MVP por [ADR-CLD-000](../MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md). Eso no acepta servicios ni controles concretos. MAPS necesita una postura de seguridad que proteja usuarios, workloads, secretos, recursos y cambios operativos con un equipo pequeño y sin introducir controles que no tengan un riesgo o requisito asociado.

[ADR-SW-005](../../../software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) ya define identidad externa gestionada y la autorización funcional local. La aplicación conserva como fuente de verdad `UserIdentity`, rol, estado `ACTIVA/BAJA`, vínculos Customer/Producer, Assignment y ownership. Cloud elige y opera el proveedor de identidad y protege recursos GCP; no redefine permisos del Portal.

Pregunta arquitectónica: **¿qué postura de identidad, secretos, privilegios, credenciales, cifrado y acceso administrativo adopta MAPS en GCP para reducir superficie de ataque sin introducir complejidad desproporcionada para el MVP?**

Este ADR fija principios y candidatos de seguridad. [TDD-CLD-006](../../tdd/MAPS-158-iam-secret-manager/TDD-CLD-006-iam-y-secret-manager.md) diseña su materialización. C2 no decide topología completa, proyectos/ambientes, entrada pública, pipeline íntegro, autorización funcional, observabilidad completa, Cloud SQL ni Storage.

## Drivers y criterios

| Driver o criterio | Importancia | Evidencia / fuente |
| --- | --- | --- |
| El equipo es pequeño y managed-first | Alta | [ADR-CLD-000](../MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md); costo operativo también es TCO |
| Identidad externa estándar detrás del puerto `IdentityProviderPort` | Alta | [ADR-SW-005](../../../software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) |
| Separar IAM Cloud de roles y ownership funcionales | Alta | ADR-SW-005: el token acredita identidad; el Portal consulta `UserIdentity` y aplica políticas |
| Bajas efectivas desde la siguiente request | Alta | ADR-SW-005 §2; no depende de invalidación criptográfica inmediata del JWT |
| Identidad del Portal según baseline Software vigente; el target propuesto SW-007 deja MFA obligatorio del Portal fuera del MVP | Alta | ADR-SW-005 (`ACEPTADO`) y ADR-SW-007 (`PROPUESTO`) |
| Evitar claves persistentes y secretos en repositorios/pipelines | Alta | Riesgo de exfiltración y escalamiento; alternativas de credenciales temporales disponibles en GCP |
| Privilegio mínimo por persona, workload, recurso y ambiente | Alta | Cloud Run service identity, IAM resource policies y aislamiento exigido a C3 |
| Ejecución auditable con complejidad y costo proporcionales | Media | Equipo sin operación demostrada de IAM avanzado; Data Access logs pueden agregar costo/volumen |
| Reversibilidad del IdP y de la gestión de secretos | Media | Puerto de aplicación y credenciales desacopladas; políticas específicas GCP permanecen acopladas |

## Alternativas consideradas

### Proveedor de identidad de aplicación

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| Google Cloud Identity Platform | Gestionado; integra email/password, verificación y recuperación por email, Admin SDK, verificación OIDC/JWT y capacidad MFA TOTP para una etapa futura; alineado a GCP | Dependencia del formato/operación Firebase; recuperación MFA no integrada; costo y cuotas deben recalcularse; la política MFA del Portal sigue la decisión Software vigente | **Propuesta**, detrás de `IdentityProviderPort`; no implica MFA obligatorio del Portal en el MVP |
| Auth0 | Servicio gestionado compatible OIDC, MFA y opciones de recuperación/códigos; independencia del plano de control GCP | Otro proveedor y consola; precios/entitlements de MFA y entornos dependen del plan vigente; menor integración operativa GCP | Descartada para el MVP por integración y complejidad adicional; reabrir ante requisito de identidad que GCP no cubra |
| Keycloak autogestionado | OIDC, TOTP y códigos de recuperación; control de configuración y despliegue | MAPS opera parches, disponibilidad, escalado, copias, base, recuperación y exposición del propio IdP; agrega infraestructura permanente | Descartada para el MVP sin driver que justifique operación propia |
| Autenticación propia del Portal | Control directo | Construir y mantener contraseñas, recuperación, MFA, abuso y endurecimiento; descartada por ADR-SW-005 | Descartada; decisión Software ya aceptada |

No se atribuye superioridad general a un proveedor. La comparación es proporcional al MVP y a los contratos existentes; la factibilidad concreta debe comprobarse en un spike de integración autorizado cuando corresponda.

### Modelo de identidad y autorización

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| Roles/ownership en custom claims del IdP | Reduce lecturas locales | Claims quedan en tokens ya emitidos; duplica fuente de verdad y demora revocación | Descartada como autoridad funcional |
| Identidad verificada por IdP + estado/políticas locales del Portal | Preserva ADR-SW-005 y permite baja local por request | Consulta local por request; el costo de latencia/carga se gestiona dentro del diseño Software/DB | **Propuesta**; es baseline ya aceptada por Software |
| Cliente/Producer/Admin como IAM principals de GCP | Ninguna ventaja para autorización de seguros | Expone infraestructura y mezcla dominios de autorización | Descartada explícitamente |

### Credenciales de workload y automatización

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| JSON key persistente de service account | Compatible con herramientas que sólo consumen archivos | Credencial exportable de larga vida; filtración, rotación y atribución débiles; no revocable por sesión como credencial temporal | Descartada como práctica normal; excepción futura exige ADR/justificación |
| WIF con principal federado y acceso directo al recurso | Credenciales temporales; no requiere SA de conveniencia; scope por recurso | Compatibilidad de cada API/permiso y expresión del principal deben verificarse | **Preferida** si API admite acceso directo seguro |
| WIF con impersonation de SA específica | Temporales; patrón compatible con herramientas que necesitan identidad SA | Agrega vínculo `roles/iam.workloadIdentityUser` y control del impersonador | Fallback cuando haya una razón comprobada |
| Usuario humano autenticado para pipeline | Sin clave de SA | No automatizable/estable; mezcla operador y ejecución | Descartada como identidad de pipeline |

### Cifrado y claves

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| Cifrado administrado por Google + TLS | Controles gestionados y operación sencilla | Menor control directo del ciclo de claves | **Propuesta para MVP** |
| CMEK con Cloud KMS | Control de ciclo de vida, separación y evidencia de uso de claves | Permisos, disponibilidad, rotación y recuperación adicionales; costo y dependencia operativa | No por defecto; reabrir ante obligación legal/contractual o driver de control explícito |

## Decisión

La postura permanece **PROPUESTA**, pendiente de revisión cruzada y aceptación.

1. **Identidad de usuarios:** proponer Google Cloud Identity Platform detrás de `IdentityProviderPort`, con email/password, email verificado, recuperación por email y gestión administrativa mediante SDK/API. La capacidad futura de MFA TOTP se conserva para una etapa posterior; el proveedor sigue siendo candidato, no servicio aceptado.
2. **IAM Cloud y Portal RBAC son dominios distintos.** IAM protege servicios, secretos, APIs e infraestructura. La aplicación resuelve `AccountRole`, estado, Customer/Producer links, Assignment, AccessScope y ownership. Los roles funcionales no se crean como roles IAM ni como autoridad de claims del IdP.
3. **MFA del Portal:** el target de ADR-SW-007 (`PROPUESTO`) deja MFA obligatorio fuera del MVP, condicionado a su aceptación formal. Hasta entonces ADR-SW-005 (`ACEPTADO`) sigue siendo la baseline formal vigente. Esta propuesta no elimina ni debilita MFA fuerte para desarrolladores, administradores Cloud, break-glass, GitHub o CI/CD.
4. **Cuentas/email y roles:** proponer `allowDuplicateEmails=false` como política del IdP, no como control RBAC. Es compatible con una misma identidad Admin+Productor; el Cliente permanece separado según Software. El email no es identificador de autorización: `issuer + subject` es el vínculo externo estable. No se duplican cuentas IdP ni se usa el email para impedir/permitir combinaciones de roles.
5. **Privilegios:** deny by default, roles predefinidos estrechos cuando alcancen, roles custom cuando los predefinidos sean demasiado amplios, nunca roles básicos por comodidad. Las grants se atan al recurso más bajo posible. `Owner` no es un rol de runtime ni de acceso cotidiano.
6. **Workloads:** proponer identidad separada por responsabilidad (`api-runtime`, `outbox-runtime`, `migration-runtime`, `scheduler-invoker`) y por ambiente, sin traducir módulo Software a workload Cloud. C1 (PR #29) está integrado y sus documentos conservan ADR-CLD-003 `PROPUESTO` y TDD-CLD-003 `BORRADOR`; los nombres siguen siendo responsabilidades conceptuales, no una aceptación implícita de servicios.
7. **Secretos:** credenciales, tokens, passwords y claves privadas residen en Secret Manager. Configuración no secreta va en configuración normal. `roles/secretmanager.secretAccessor` se concede por secreto al consumidor requerido, no a nivel proyecto salvo justificación explícita.
8. **Credenciales:** no usar service-account keys persistentes para runtime o GitHub Actions. En GCP, identidad adjunta/ADC; fuera de GCP, WIF con acceso directo como preferencia y service-account impersonation sólo como fallback documentado. Para GitHub se restringen claims de organización/repositorio y rama/ambiente/workflow, priorizando IDs inmutables.
9. **Personas:** una identidad individual por persona, grupos por función cuando exista Cloud Identity/Workspace; si no, principals individuales. Impersonation temporal de una SA específica puede habilitar operaciones puntuales; nunca se concede por defecto a desarrolladores una identidad de mayor privilegio. Definir break-glass separado, con MFA fuerte, acceso acotado, evidencia de cada uso y revisión posterior, sin asignar `Owner` automáticamente.
10. **Cifrado:** proponer cifrado administrado por Google en reposo y TLS en tránsito. CMEK no se añade sin un requisito o driver de control explícito.
11. **Ambientes y red:** exigir que identidades, secretos y permisos de staging y producción sean distintos. C3 decidirá separación de proyectos/recursos; C2 sólo requiere aislamiento efectivo. Exigir private-by-default y negar ingress innecesario; C2 no selecciona VPC, subnet, PSC/PSA, load balancer ni DNS.
12. **Auditoría:** Cloud Audit Logs para cambios privilegiados y grants; definir Data Access logs por servicio, sensibilidad, necesidad y costo. El AuditEvent de negocio, accesos a expedientes y resultado de autorización permanece en el Portal según Software. Cloud logs no reemplazan la auditoría funcional.
13. **Operación IdP:** el API no recibe permisos de configuración global del proveedor. Las operaciones de usuario indispensables se limitan por permisos; administración de proyecto, configuración MFA y recuperación de factor son tareas humanas privilegiadas y auditadas. El role/permissions exacto queda condicionado a matriz IAM y pruebas.

### Precedente técnico WIF — MAPS-LandingPage

El módulo build-identity de [MAPS-LandingPage, commit 65814e2](https://github.com/Kondor-Corporate/MAPS-Landingpage/blob/65814e2/infra/terraform/modules/build-identity/main.tf#L30) demuestra un patrón operacional reutilizable/adaptable: GitHub OIDC federado mediante Workload Identity Federation, condiciones con los claims numéricos e inmutables `repository_owner_id` y `repository_id`, credenciales temporales y principals separados con privilegios mínimos. Esto es evidencia de un patrón, no una configuración para copiar. C2 no traslada IDs/proveedores/proyectos, service accounts, roles concretos, ramas ni workflows de LandingPage; C8 define la confianza y el pipeline de MAPS.

## Reconciliación con la propuesta Software actual

La baseline formal de identidad sigue siendo [ADR-SW-005](../../../software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) (`ACEPTADO`). [ADR-SW-007](../../../software/adr/MAPS-216-identidad-multirol-mfa/ADR-SW-007-identidad-multirol-y-mfa-fuera-del-mvp.md) está integrado en PR #42 y permanece `PROPUESTO`; su aceptación no se infiere del merge. C2 conserva esa diferencia: alinea su target propuesto con SW-007, pero la parte de MFA fuera del MVP y el modelo multirol sólo rigen si SW-007 se acepta formalmente. [TDD-SW-004](../../../software/tdd/MAPS-111-identidad-rbac-ownership/TDD-SW-004-identidad-rbac-y-ownership.md) y [TDD-SW-008](../../../software/tdd/MAPS-115-contrato-api/TDD-SW-008-contrato-api.md) están en `BORRADOR` y alineados con ese target.

### MFA del Portal

El target propuesto de C2 deja MFA obligatorio del Portal fuera del MVP, condicionado a la aceptación de ADR-SW-007. No implementa enforcement TOTP por rol, requisito de claim de segundo factor ni un gate de API para Admin en MVP. SW-007 documenta el riesgo de que el compromiso de email/password de una cuenta con `ADMIN` habilite operaciones privilegiadas; C2 lo referencia y no lo acepta nuevamente desde Cloud. La revisión previa al primer despliegue con datos reales sigue siendo una propuesta/pendiente de SW-007, no un requisito MAPS confirmado.

La capacidad MFA futura de Identity Platform y la opción de habilitarla después del MVP se conservan. La exclusión de MFA se limita a usuarios del Portal conforme al target Software: no reduce MFA fuerte ni controles de identidad individual para desarrolladores, administradores Cloud, break-glass, GitHub o CI/CD. `MFA del Portal fuera del MVP` no significa `retirar MFA de administración Cloud`.

### Identidad multirol y autorización

El target de Software representa roles funcionales como `AccountRole[]` local, con `{ADMIN}`, `{PRODUCTOR}`, `{ADMIN, PRODUCTOR}` y `{CLIENTE}`; `CLIENTE` es excluyente y `ADMIN_PRODUCTOR` no existe. El contrato sigue siendo propuesta mientras SW-007 no se acepte. Identity Platform autentica una identidad externa; el Portal mantiene roles, estado de cuenta, vínculos Customer/Producer, ownership, Assignment y AccessScope. No se delega autoridad funcional a custom claims, IAM roles ni grupos del IdP.

Una identidad externa `(issuer, subject)` corresponde a una `UserIdentity` y puede asociarse a varias entradas locales `AccountRole`; Admin+Productor no requiere dos cuentas de Identity Platform ni dos emails. `allowDuplicateEmails=false` permanece política propuesta del IdP y no controla autorización ni combinaciones de roles; Cliente continúa como identidad separada bajo el target Software. El email es un atributo, no el identificador de autorización.

El flujo propuesto es: API valida token → resuelve `issuer + subject` → consulta `UserIdentity` y estado local → Software evalúa capacidad requerida y ownership. Retirar un rol debe impedir su capacidad desde la siguiente request, aunque el ID token siga siendo criptográficamente válido. No se cachean roles ni estado de cuenta en el MVP; cualquier caché futura deberá limitar su TTL a la demora de revocación que MAPS acepte.

## Consecuencias y trade-offs

### Positivas

- Mantiene autorización funcional dentro de Software y baja local verificable aunque un JWT siga vigente.
- Evita operar un IdP propio y elimina claves de larga vida del flujo normal de despliegue.
- Limita el impacto de un compromiso al separar workloads, secretos, ambientes y personas.
- Permite que C1 evolucione su runtime conservando identidad por responsabilidad.
- Usa controles administrados sin añadir KMS, un broker o una capa IAM de negocio sin driver.

### Negativas y riesgos

- Identity Platform y controles IAM crean lock-in consciente; el puerto de aplicación reduce pero no elimina costo de salida.
- La capacidad de MFA del proveedor no elimina el riesgo de credenciales del Portal mientras MFA no se exija; la aceptación de ese riesgo corresponde a Software/MAPS.
- La revocación de refresh tokens no invalida criptográficamente ID tokens ya emitidos; la consulta local de cuenta y roles permite denegar la siguiente request.
- La transición de rol único a roles locales múltiples depende de la aceptación de ADR-SW-007 y de la implementación Software.
- El aislamiento entre ambientes depende de decisiones C3 aún abiertas; la separación lógica debe demostrarse antes de operar producción.
- Data Access logs pueden elevar volumen/costo y requerir filtrado de PII.

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| MFA futuro del Portal | Software + MAPS + Cloud | Mantener capacidad del proveedor y el riesgo documentado por SW-007; antes del primer despliegue con datos reales revisar si se acepta MFA, como propuesta de SW-007 y no requisito confirmado |
| Aceptación del modelo multirol/MFA fuera del MVP | Software + MAPS | ADR-SW-007 `PROPUESTO`; C2 alinea el target, pero no modifica la baseline SW-005 hasta aceptación formal |
| MULTIROL + MFA SPIKE | Software + Cloud, condicionado a formalizar multirol y requerir validar step-up | Validar enrolamiento, sign-in, refresh/session, claims verificables, reauthentication, posibilidad real de step-up, UX, revocación y downgrade/remoción Admin; hasta demostrar step-up, asumir MFA durante autenticación completa de identidad enrolada |
| Permisos de Admin SDK necesarios para altas, invitación, baja/reactivación y revocación | Cloud + Software | Mapear cada método a permisos IAM vigentes; no dar rol `identitytoolkit.admin` o `firebaseauth.admin` al runtime sin demostrar necesidad |
| `allowDuplicateEmails=false` y email reutilizado | MAPS + Software | Mantener como política propuesta de IdP; no usar email como autorización; roles se resuelven localmente |
| RN-20 e identidad de Productor | MAPS | C2 cubre baja existente; efecto adicional de inhabilitación espera contrato funcional |
| C1 runtime y DB | Software + Cloud | PR #29 está integrada; conservar estados ADR-CLD-003 `PROPUESTO` y TDD-CLD-003 `BORRADOR` |
| Separación real staging/producción | C3 + Cloud | Decidir proyectos/recursos e impedir compartir SAs, secrets o grants |
| Pipeline y trust GitHub | C8 + Cloud | Definir workflows, environment approvals, claims y permisos WIF; C2 define constraints |
| Conectividad/autenticación Cloud SQL | C1/C4 + Cloud | Probar IAM DB Auth con driver/connector/pooling; resolver sin imponer un cambio al adaptador Software |
| Requisitos para CMEK, audit retention o residencia | MAPS + Cloud | Incorporar sólo tras requisito contractual/legal/operacional verificable |

## Criterios de revisión futura

Revisar si MAPS exige SSO corporativo, verificación de identidad fuerte, MFA obligatorio a todos, reutilización de email entre roles, aislamiento regulatorio, CMEK, residencia, operación sin Identity Platform o gestión de usuarios desacoplada del API. Revisar también ante cambios documentados de MFA, tokens, permisos Admin SDK, WIF o costo. Un ADR aceptado se reemplaza mediante un nuevo ADR, sin reescribir su contexto histórico.

## Referencias y trazabilidad

- Fuentes F0/F1/F2: referencias de metadata; reglas funcionales de identity/auth y RN-20 se mantienen según F1/F2.
- ADR/TDD: [ADR-SW-005](../../../software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-001](../../../software/tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-003](../../../software/tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md), [ADR-CLD-000](../MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md); [TDD-CLD-006](../../tdd/MAPS-158-iam-secret-manager/TDD-CLD-006-iam-y-secret-manager.md) es el diseño propuesto.
- Fila de [traceability.md](../../../traceability.md): identidad del usuario, autorización funcional, seguridad de workloads e IAM.
- PR #42 integró ADR-SW-007 y los TDD Software alineados; ADR-SW-007 permanece `PROPUESTO` y ADR-SW-005 `ACEPTADO` sigue siendo la baseline formal hasta su aceptación.
- Fuentes oficiales consultadas el 2026-10-28: [Identity Platform — Admin API y OIDC](https://docs.cloud.google.com/identity-platform/docs/concepts-admin-auth-api), [TOTP MFA](https://docs.cloud.google.com/identity-platform/docs/admin/enabling-totp-mfa), [MFA y recuperación](https://docs.cloud.google.com/identity-platform/docs/work-with-mfa-users), [email enumeration protection](https://docs.cloud.google.com/identity-platform/docs/admin/email-enumeration-protection), [usuarios duplicados](https://docs.cloud.google.com/config-connector/docs/reference/resource-docs/identityplatform/identityplatformconfig), [precios Identity Platform](https://cloud.google.com/identity-platform/pricing), [Auth0 pricing](https://auth0.com/pricing), [Keycloak Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/), [WIF](https://docs.cloud.google.com/iam/docs/workload-identity-federation), [GitHub pipeline federation](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines), [Cloud Run service identity](https://docs.cloud.google.com/run/docs/securing/service-identity), [service-account key best practices](https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys), [audit logs](https://docs.cloud.google.com/logging/docs/audit).
