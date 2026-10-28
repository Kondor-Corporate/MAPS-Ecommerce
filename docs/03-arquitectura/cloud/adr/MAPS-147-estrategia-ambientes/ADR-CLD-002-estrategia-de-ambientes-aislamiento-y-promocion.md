# ADR — Estrategia de ambientes, aislamiento y promoción

| Dato | Valor |
| --- | --- |
| ID | ADR-CLD-002 |
| Título | Estrategia de ambientes, aislamiento y promoción |
| Estado | PROPUESTO |
| Fecha | 2026-10-28 |
| Autor | Santiago Talavera |
| Revisores | Joaquin Rodriguez — revisión cruzada pendiente |
| Work item | [MAPS-147](https://santitalavera.atlassian.net/browse/MAPS-147) / [MAPS-117](https://santitalavera.atlassian.net/browse/MAPS-117) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-147 |
| Fase origen | [F0 §0.4/0.5/0.8](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §3/5, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §5/9/12/14](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-CLD-000](../MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md) (ACEPTADO, GCP); [ADR-CLD-001](../MAPS-146-hosting-frontend-entrada-publica/ADR-CLD-001-hosting-frontend-y-entrada-publica.md) (PROPUESTO); [ADR-SW-001](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-005](../../../software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) |
| Depende de | Revisión y aceptación de este ADR; adopción de entrypoint pendiente de ADR-CLD-001; IAM C2; red/database C4; IaC y promoción C8 |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Este ADR permanece PROPUESTO. No crea ni configura proyectos o ambientes.

## Contexto y problema

El Portal necesita desarrollo, staging y producción, pero aún no requiere tres stacks Cloud persistentes. El equipo debe validar cambios en datos y servicios aislados de producción, minimizar costo ocioso y promover versiones con control explícito. La decisión debe permitir paridad arquitectónica donde importa, sin imponer capacidad, retención o costo idénticos.

La pregunta es: **¿cómo separa MAPS sus ambientes y promueve cambios desde desarrollo hasta producción con aislamiento suficiente, evidencia de validación y una carga operativa proporcional al MVP?**

La documentación oficial de Firebase recomienda proyectos separados por ambiente. En Google Cloud, los proyectos son una unidad central de recursos, acceso y costos y funcionan como frontera de aislamiento. Esto sustenta el modelo de proyectos separados para staging y producción, sujeto al inventario y factibilidad de cuentas/proyectos MAPS.

## Drivers y criterios

| Driver o criterio | Importancia | Evidencia / fuente |
| --- | --- | --- |
| Evitar contaminación o exposición de datos productivos | Alta | RNF-SEC-01, Cloud Strategy; datos productivos no deben copiarse a staging |
| Identidades, secretos y recursos separados | Alta | ADR-SW-005 y dependencia de C2 |
| Staging representativo de las fronteras productivas | Alta | Discovery Landing mostró diferencias de exposición entre sus ambientes; no reproducirlas como baseline |
| Costo y carga del equipo proporcionales | Alta | Equipo pequeño; no crear ambientes Cloud ociosos sin driver |
| Promoción verificable y reversible | Alta | Necesidad de pruebas antes de GO LIVE y rollback conocido |
| Reproducibilidad del artefacto | Alta | Evitar divergencia entre build validado y producción |
| Efectos externos controlados | Alta | Email y futuras integraciones no deben alcanzar sistemas productivos desde staging |
| Escalabilidad del flujo de trabajo | Media | Preview de frontend no equivale a un ambiente full con datos y backend aislados |
| Reversibilidad | Media | Empezar con límites claros y agregar ambientes temporales cuando haya necesidad medible |

## Alternativas consideradas

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| A. Un solo proyecto para todos los ambientes | Menos proyectos y administración inicial; recursos compartidos fáciles de inspeccionar. | Alto riesgo de mezclar identidad, secretos, DB, storage, side effects, políticas y costos; errores de configuración pueden afectar producción. | Descartada para staging y producción. |
| B. Desarrollo local + proyecto Cloud nonprod compartido + proyecto production | Separa producción del conjunto no productivo; costo moderado. | Puede mezclar desarrollo persistente y staging si ambos se alojan allí; requiere límites internos para servicios y datos. | Alternativa posible si en el futuro se necesita un entorno Cloud dev; no es la baseline propuesta. |
| C. Desarrollo local + proyecto staging + proyecto production | Aislamiento de producción, costos proporcionales, staging persistente para integración/aceptación; coincide con recomendación oficial de entornos por proyectos separados. | Dos proyectos Cloud requieren administrar IAM, secrets, presupuesto, DNS y recursos; staging debe tener capacidad suficiente para pruebas representativas. | Propuesta preferida para MVP. |
| D. Dev, staging y producción Cloud persistentes | Ambientes remotos disponibles para el equipo y más pruebas contra servicios reales. | Tercer stack permanente sin driver actual; aumenta costo, superficie y operación; puede inducir divergencia. | No propuesto inicialmente. |
| E. Entorno full efímero por cada PR | Aislamiento temporal y validación paralela; útil con automatización madura. | Duplica DB, identidades, secrets, storage y side effects; exige IaC, limpieza, costos de coordinación y secretos; C8 aún debe definir la automatización. | Diferido; no requerido por el MVP. |

## Decisión

**Opción propuesta, aún no aceptada:**

- **Development:** local por defecto, con emulators/mocks cuando corresponda, PostgreSQL local/test y datos sintéticos. No exige proyecto Cloud persistente.
- **Staging:** proyecto GCP independiente, persistente, destinado a integración, smoke, validación funcional y evidencia preproducción.
- **Production:** proyecto GCP independiente, destinado a usuarios y datos reales, con accesos y side effects productivos controlados.

Staging y Production deben conservar la **misma forma arquitectónica en fronteras críticas**, aunque puedan diferir en capacidad, dominio, certificados, límites, observabilidad, HA, retención y costo. Ambos usan External HTTPS Application Load Balancer como entrypoint, el mismo routing default frontend + /api y /api/* hacia API, el mismo modelo de ingress y ninguna ruta de bypass Internet directo. Recursos de cada ambiente están separados. Identidad de usuarios STG != PROD, workload identities STG != PROD y secrets STG != PROD; DB, storage y side effects también quedan separados. La conectividad privada debe ser equivalente. C3 fija el constraint; C1/C2/C4/C5/C6/C7/C8 resuelven los mecanismos de cada área. #30 sigue abierta y sus servicios propuestos no son baseline integrada.

El patrón de staging de MAPS-LandingPage con Cloud Run público directo y Cloud SQL con IP pública no se adopta. La paridad propuesta no significa que se copien servicios de Landing, ni que capacidad o configuración sean iguales. Región southamerica-east1 es precedente organizacional, no región aceptada para Portal.

## Aislamiento, datos y efectos externos

| Frontera | Regla propuesta | Paquete que concreta |
| --- | --- | --- |
| Proyecto / facturación | STG y PROD en proyectos independientes para separar recursos, acceso, políticas y costos. | C8/C4 |
| Identidad de usuario | Identidad de usuarios STG != PROD; no compartir usuarios ni configuración de autenticación por defecto. Si C2 formaliza Google Identity Platform, separar configuración y usuarios entre ambientes. | C2 |
| Workloads | Workload identities STG != PROD. Si C2 formaliza service accounts por workload, ninguna identidad se comparte entre ambientes y C2 define los permisos mínimos. | C2 |
| Secretos | Secrets STG != PROD; no copiar credenciales productivas a STG. Si C2 formaliza Secret Manager, separar secretos y grants por ambiente. | C2/C8 |
| DB y storage | Recursos y datos separados; no conexión de staging a DB/storage productivos. | C4/C7 |
| Red y entrypoint | Misma forma de publicación y conectividad privada equivalente; no acceso directo alternativo en STG. | C3/C4 |
| Datos | Prohibido copiar PII productiva a staging. Usar fixtures, datos sintéticos, identidades de prueba y datasets anonimizados sólo con necesidad y aprobación. No copiar la DB productiva completa. | Software/Cloud |
| Side effects | STG nunca envía correo o webhooks productivos. C6 elegirá sandbox, allowlist, mail sink o envío deshabilitado; integrar externos futuros también requiere destino de prueba. | C6 |
| Logs/telemetría | No promover datos ni secrets entre ambientes; aplicar minimización y acceso separado. | C5 |

Las carpetas de preview de frontend no se consideran ambientes completos. El MVP no crea una DB, proveedor de identidad, secretos y recursos por PR. Si más adelante se habilitan previews, por defecto consumirán staging y nunca recursos de producción.

## Artefactos y promoción

Objetivo de promoción: **BUILD ONCE → artefacto inmutable → staging → validación → aprobación explícita → producción**.

Cuando frontend y API se distribuyan como contenedores, se prefiere promover el mismo digest validado en staging a producción, en vez de reconstruirlo. La configuración específica del ambiente debe externalizarse cuando sea razonable. Si el framework exige configuración de build, la excepción debe quedar documentada y el build de producción debe ser reproducible desde el mismo commit y con parámetros revisados. C8 decidirá repositorios, registry, workflow, firma/provenance y permisos.

Flujo contractual propuesto:

1. Cambio en rama y validaciones de desarrollo.
2. Pull request y CI; resultado revisable antes de promoción.
3. Build de artefacto versionado/inmutable una vez.
4. Despliegue en STG y ejecución de pruebas, smoke, migración compatible y revisión de señales.
5. Aprobación explícita para PROD.
6. Promoción del mismo artefacto/configuración autorizada a PROD y verificación posterior.

El push a main no habilita por sí mismo un despliegue productivo automático. El mecanismo concreto de aprobación —por ejemplo, GitHub Environments, Cloud Deploy u otra alternativa— pertenece a C8.

## Migraciones y rollback

Preservar el contrato Software de migraciones expand/contract: aplicar expansión compatible, desplegar versión compatible y hacer contract después de demostrar que versiones y datos permiten retirar el esquema anterior. No ejecutar migraciones en el arranque de la aplicación. El fallo de migración detiene la promoción. El rollback del runtime o frontend restaura un artefacto/revisión conocida; no revierte automáticamente datos ni ejecuta un rollback destructivo del schema. Rollback de configuración y secretos debe ser explícito y versionado según C2/C8. Cloud C1 queda en PR #29 abierta, por lo que su propuesta no se trata como baseline aceptada.

## Consecuencias y trade-offs

**Beneficios esperados:** desarrollo local evita un tercer costo Cloud por defecto; proyectos separados establecen frontera clara entre staging y datos/side effects productivos; paridad de topología crítica permite que staging pruebe restricciones reales; promoción de artefacto inmutable y aprobación explícita hacen trazable el paso a producción.

**Costos y riesgos:** dos proyectos requieren gobierno y controles IAM separados; un staging económico puede no demostrar capacidad/HA de producción; configuración build-time puede limitar promoción del mismo digest; mantener la misma forma de entrada/conectividad cuesta más que exponer directamente staging. Estos costos se aceptan provisionalmente y deben medirse contra el guardrail global.

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Disponibilidad y gobierno de proyectos GCP separados | MAPS/Cloud | Confirmar ownership, billing, permisos y posibilidad de crear/administrar los proyectos |
| Costo de staging persistente y guardrails | Cloud/C8 | Estimar y monitorear costo; apagar o reducir capacidad sin desarmar fronteras críticas |
| Paridad de entrypoint y networking | C3/C4 | Probar rutas e ingress en ambos ambientes; equivalencia privada queda concretada por C4 |
| Separación de identidades, secrets y recursos | C2/C4/C7 | Diseñar y verificar controles efectivos antes de conectar ambientes |
| Side effects desde staging | C6 | Probar que correo e integraciones se enrutan a destinos de prueba |
| Build-time configuration | Software/C8 | Identificar frameworks y configuración antes de decidir la promoción exacta del digest |
| Regla de aprobación y despliegue | C8 | Definir identidad autorizante, evidencia y mecanismo; esta propuesta no configura pipeline |
| Datos para pruebas | MAPS/Software | Acordar fixtures y anonimización si se justifica; nunca importar una DB productiva completa |

## Criterios de revisión futura

Reconsiderar desarrollo local como único modelo si aparecen necesidades de colaboración remota, integración que no se puede emular o feedback de stakeholders; reconsiderar ambientes efímeros cuando IaC/limpieza/presupuesto estén automatizados y un driver de paralelismo lo justifique; revisar paridad si restricciones regulatorias, de servicio o costos impiden repetir una frontera crítica, documentando el control compensatorio sin permitir exposición inadvertida.

## Referencias y trazabilidad

- Baseline: [F0](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Cloud: [ADR-CLD-000](../MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md), [ADR-CLD-001](../MAPS-146-hosting-frontend-entrada-publica/ADR-CLD-001-hosting-frontend-y-entrada-publica.md), [Cloud Strategy](../../STRATEGY.md).
- Software: [ADR-SW-001](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-005](../../../software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-001](../../../software/tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-003](../../../software/tdd/MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md).
- PRs candidatas no integradas: [#29 C1](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/29), [#30 C2](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/30).
- Fuentes oficiales: [Google Cloud resource hierarchy](https://docs.cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy), [Firebase project workflow best practices](https://firebase.google.com/docs/projects/dev-workflows/general-best-practices), [Firebase launch checklist](https://firebase.google.com/support/guides/launch-checklist), [Firebase App Hosting environments](https://firebase.google.com/docs/app-hosting/multiple-environments).
- Fila de trazabilidad: despliegue y aislamiento de ambientes del Portal; los índices se actualizarán después de la revisión/sincronización C3.
