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
| Decisiones relacionadas | [ADR-CLD-000](../MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md) (`ACEPTADO`, GCP); [ADR-SW-001](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-005](../../../software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) (`ACEPTADO`); [TDD-CLD-006](../../tdd/MAPS-158-iam-secret-manager/TDD-CLD-006-iam-y-secret-manager.md) (`BORRADOR`, condicionado) |
| Depende de | Revisión cruzada; prueba de enforcement MFA Admin por aplicación; decisiones pendientes de C1/C3/C4/C8 y RN-20 |
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
| MFA obligatorio para Admin, sin exigirlo al resto del MVP | Alta | ADR-SW-005; capacidad por rol debe verificarse en integración |
| Evitar claves persistentes y secretos en repositorios/pipelines | Alta | Riesgo de exfiltración y escalamiento; alternativas de credenciales temporales disponibles en GCP |
| Privilegio mínimo por persona, workload, recurso y ambiente | Alta | Cloud Run service identity, IAM resource policies y aislamiento exigido a C3 |
| Ejecución auditable con complejidad y costo proporcionales | Media | Equipo sin operación demostrada de IAM avanzado; Data Access logs pueden agregar costo/volumen |
| Reversibilidad del IdP y de la gestión de secretos | Media | Puerto de aplicación y credenciales desacopladas; políticas específicas GCP permanecen acopladas |

## Alternativas consideradas

### Proveedor de identidad de aplicación

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| Google Cloud Identity Platform | Gestionado; integra email/password, verificación y recuperación por email, Admin SDK, verificación OIDC/JWT y MFA TOTP; alineado a GCP | Dependencia del formato/operación Firebase; recuperación MFA no integrada; costo y cuotas deben recalcularse; MFA global `MANDATORY` no permite exigirlo sólo a Admin | **Propuesta**, detrás de `IdentityProviderPort`; enforcement por rol queda condicionado a claim validado por API |
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

1. **Identidad de usuarios:** proponer Google Cloud Identity Platform detrás de `IdentityProviderPort`, con email/password, email verificado, recuperación por email, MFA TOTP y gestión administrativa mediante SDK/API. No se sustituye el contrato de Software ni se concede autoridad al email.
2. **IAM Cloud y Portal RBAC son dominios distintos.** IAM protege servicios, secretos, APIs e infraestructura. La aplicación autoriza Customer, Productor, Admin, InsuranceRequest, Assignment y ownership. Esos roles no se crean como roles de IAM para decidir acceso al Portal.
3. **MFA:** Admin requiere TOTP antes de operar. Cliente y Productor no tienen MFA obligatorio en el MVP. La documentación vigente indica que `MANDATORY` se aplica al proyecto completo; por ello se propone MFA disponible (`ENABLED`) y el backend exige una señal server-verificable de autenticación con segundo factor para toda operación Admin. La representación exacta de esa señal pertenece al TDD y a la integración con el IdP. La decisión sólo se reabre si no puede sostenerse la garantía de que Admin no opera sin autenticación MFA válida. MFA no se configura como obligatorio para todos por defecto.
4. **Cuentas/email:** proponer allowDuplicateEmails = false. Es política de MVP, no limitación técnica de Identity Platform. Mientras rija la baseline Software de rol único, se mantienen identidades/login diferenciados por rol. Si Software formaliza Admin + Productor en una misma UserIdentity, esa combinación no requiere duplicar identidad/email en el IdP. El email no es identificador de autorización: el vínculo externo permanece issuer + subject.
5. **Privilegios:** deny by default, roles predefinidos estrechos cuando alcancen, roles custom cuando los predefinidos sean demasiado amplios, nunca roles básicos por comodidad. Las grants se atan al recurso más bajo posible. `Owner` no es un rol de runtime ni de acceso cotidiano.
6. **Workloads:** proponer identidad separada por responsabilidad (`api-runtime`, `outbox-runtime`, `migration-runtime`, `scheduler-invoker`) y por ambiente, sin traducir módulo Software a workload Cloud. C1 está propuesto en [PR #29](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/29), no integrado; los nombres son conceptos compatibles, no aceptación de Cloud Run/Jobs/Scheduler.
7. **Secretos:** credenciales, tokens, passwords y claves privadas residen en Secret Manager. Configuración no secreta va en configuración normal. `roles/secretmanager.secretAccessor` se concede por secreto al consumidor requerido, no a nivel proyecto salvo justificación explícita.
8. **Credenciales:** no usar service-account keys persistentes para runtime o GitHub Actions. En GCP, identidad adjunta/ADC; fuera de GCP, WIF con acceso directo como preferencia y service-account impersonation sólo como fallback documentado. Para GitHub se restringen claims de organización/repositorio y rama/ambiente/workflow, priorizando IDs inmutables.
9. **Personas:** una identidad individual por persona, grupos por función cuando exista Cloud Identity/Workspace; si no, principals individuales. Impersonation temporal de una SA específica puede habilitar operaciones puntuales; nunca se concede por defecto a desarrolladores una identidad de mayor privilegio. Definir break-glass separado, con MFA fuerte, acceso acotado, evidencia de cada uso y revisión posterior, sin asignar `Owner` automáticamente.
10. **Cifrado:** proponer cifrado administrado por Google en reposo y TLS en tránsito. CMEK no se añade sin un requisito o driver de control explícito.
11. **Ambientes y red:** exigir que identidades, secretos y permisos de staging y producción sean distintos. C3 decidirá separación de proyectos/recursos; C2 sólo requiere aislamiento efectivo. Exigir private-by-default y negar ingress innecesario; C2 no selecciona VPC, subnet, PSC/PSA, load balancer ni DNS.
12. **Auditoría:** Cloud Audit Logs para cambios privilegiados y grants; definir Data Access logs por servicio, sensibilidad, necesidad y costo. El AuditEvent de negocio, accesos a expedientes y resultado de autorización permanece en el Portal según Software. Cloud logs no reemplazan la auditoría funcional.
13. **Operación IdP:** el API no recibe permisos de configuración global del proveedor. Las operaciones de usuario indispensables se limitan por permisos; administración de proyecto, configuración MFA y recuperación de factor son tareas humanas privilegiadas y auditadas. El role/permissions exacto queda condicionado a matriz IAM y pruebas.

## Observaciones funcionales de revisión 2026-10-29

### MFA Admin

El reviewer propone diferir MFA para Admin del Portal. C2 conserva la baseline vigente de ADR-SW-005 (ACEPTADO), que exige MFA obligatorio para Admin; no registra que la propuesta haya sido rechazada organizacionalmente. Diferir MFA sería un cambio del contrato Software y una aceptación explícita de riesgo, no una optimización Cloud que C2 pueda aplicar unilateralmente.

Admin es un principal funcional privilegiado y puede ejecutar operaciones de mayor impacto sobre usuarios, catálogo, asignaciones y operación del Portal; por ello C2 conserva el requisito MFA vigente mientras no exista un cambio formal de Software y aceptación explícita de riesgo. Identity Platform soporta TOTP y la aplicación puede exigir la señal de segundo factor en capacidades Admin. Postergar MFA no simplifica la arquitectura de identidad: difiere enrolamiento, recuperación y enforcement.

### Admin + Productor

El reviewer propone una sola identidad individual con roles Admin y Productor, manteniendo Cliente separado. C2 considera la dirección compatible conceptualmente con un IdP gestionado, pero no adopta el cambio: ADR-SW-005 mantiene rol único y TDD-SW-001 modela UserIdentity 1 → 0..1 Producer. La fuente de roles, estado y permisos sigue siendo el Portal; no se usan custom claims de IdP como roles, no se introduce ADMIN_PRODUCTOR ni se crean identidades duplicadas por conveniencia.

Antes de un cambio Software debe confirmarse con MAPS que los Admin también operan como Productores. Software deberá definir roles múltiples o modelo equivalente y resolver: retirar Admin conservando Productor y viceversa; la baja revoca todos los accesos; reactivar la cuenta no restaura roles retirados; retirar Productor coordina el tratamiento de Assignments. Cada capacidad conserva su política: Admin no amplía permisos Productor ni viceversa.

MFA y multirol son independientes: ADMIN + PRODUCTOR no elimina MFA. Si Software formaliza una cuenta Admin + Productor, una identidad enrolada en MFA debe considerarse, por defecto, MFA durante su autenticación completa: password/primer factor → TOTP/segundo factor → sesión autenticada. Después el Portal aplica RBAC/ownership a capacidades Admin o Productor. Un patrón real de step-up que permita ingresar sin segundo factor para operar como Productor y completarlo sólo al ejecutar capacidades Admin queda como hipótesis técnica del MULTIROL + MFA SPIKE; C2 no lo presupone ni elige la UX.

### Landing — Workload Identity Federation

El módulo build-identity de MAPS-Landingpage en el commit 65814e2 constituye un **precedente operacional reutilizable / adaptar**: muestra GitHub OIDC → WIF, atributos numéricos repository_owner_id/repository_id, condiciones para workflow/ref/event, credenciales temporales, service account de submit separada de la SA de build, roles/iam.workloadIdentityUser acotado, custom roles estrechos, grants a recursos concretos y ausencia de grants a la Compute Engine default service account para ese flujo. C2 reutiliza el patrón de confianza e identidad, no decide el pipeline. No se copian project IDs, nombres de SA, Cloud Build, buckets, repositorios Artifact Registry, permisos custom exactos, workflow_dispatch, ramas ni nombre de workflow; C8 decide esos detalles.

## Consecuencias y trade-offs

### Positivas

- Mantiene autorización funcional dentro de Software y baja local verificable aunque un JWT siga vigente.
- Evita operar un IdP propio y elimina claves de larga vida del flujo normal de despliegue.
- Limita el impacto de un compromiso al separar workloads, secretos, ambientes y personas.
- Permite que C1 evolucione su runtime conservando identidad por responsabilidad.
- Usa controles administrados sin añadir KMS, un broker o una capa IAM de negocio sin driver.

### Negativas y riesgos

- Identity Platform y controles IAM crean lock-in consciente; el puerto de aplicación reduce pero no elimina costo de salida.
- La recuperación MFA exige operación y prueba de identidad; no existe un recovery TOTP integrado.
- MFA por rol requiere enforcement en la API y prueba de la señal de segundo factor; la opción `MANDATORY` del proveedor afectaría a todos.
- Gestión programática de Productores puede requerir permisos IAM de usuario más amplios que la operación normal del API; dividir/limitar esas capacidades exige evaluación de permisos real.
- La revocación de refresh tokens no invalida criptográficamente ID tokens ya emitidos; el estado local `BAJA` es la garantía del Portal.
- El aislamiento entre ambientes depende de decisiones C3 aún abiertas; la separación lógica debe demostrarse antes de operar producción.
- Data Access logs pueden elevar volumen/costo y requerir filtrado de PII.

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| MFA Admin con política diferenciada por rol | Cloud + Software | Spike verifica claim servidor, enrollment incompleto bloqueado, Cliente/Productor sin MFA obligatorio y rechazo de Admin sin segundo factor |
| Recuperación de Admin sin segundo factor | Cloud + owner MAPS | Procedimiento de prueba fuerte, doble control cuando sea viable, registro de ticket/actor/resultado y re-enrollment; sin preguntas de seguridad ni canal informal |
| Permisos de Admin SDK necesarios para altas, invitación, baja/reactivación y revocación | Cloud + Software | Mapear cada método a permisos IAM vigentes; no dar rol `identitytoolkit.admin` o `firebaseauth.admin` al runtime sin demostrar necesidad |
| Número de cuentas por rol y email único | MAPS + Software | Mantener política propuesta de un email por identidad/login; reabrir ADR-SW-005/TDD-SW-004 si MAPS exige email repetido |
| RN-20 e identidad de Productor | MAPS | C2 cubre baja existente; efecto adicional de inhabilitación espera contrato funcional |
| C1 runtime aún no aceptado | Software + Cloud | PR #29 aporta delta propuesto; identidades se atan a responsabilidades sin asumir servicio físico |
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
- [C1 PR #29](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/29): delta no integrado al 2026-10-28; ADR-CLD-003 `PROPUESTO`, TDD-CLD-003 `BORRADOR`.
- Fuentes oficiales consultadas el 2026-10-28: [Identity Platform — Admin API y OIDC](https://docs.cloud.google.com/identity-platform/docs/concepts-admin-auth-api), [TOTP MFA](https://docs.cloud.google.com/identity-platform/docs/admin/enabling-totp-mfa), [MFA y recuperación](https://docs.cloud.google.com/identity-platform/docs/work-with-mfa-users), [email enumeration protection](https://docs.cloud.google.com/identity-platform/docs/admin/email-enumeration-protection), [usuarios duplicados](https://docs.cloud.google.com/config-connector/docs/reference/resource-docs/identityplatform/identityplatformconfig), [precios Identity Platform](https://cloud.google.com/identity-platform/pricing), [Auth0 pricing](https://auth0.com/pricing), [Keycloak Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/), [WIF](https://docs.cloud.google.com/iam/docs/workload-identity-federation), [GitHub pipeline federation](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines), [Cloud Run service identity](https://docs.cloud.google.com/run/docs/securing/service-identity), [service-account key best practices](https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys), [audit logs](https://docs.cloud.google.com/logging/docs/audit).
