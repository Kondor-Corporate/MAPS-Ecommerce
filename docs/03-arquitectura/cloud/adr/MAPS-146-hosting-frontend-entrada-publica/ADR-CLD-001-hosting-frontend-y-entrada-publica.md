# ADR — Hosting frontend y entrada pública

| Dato | Valor |
| --- | --- |
| ID | ADR-CLD-001 |
| Título | Hosting frontend y entrada pública |
| Estado | PROPUESTO |
| Fecha | 2026-10-28 |
| Autor | Santiago Talavera |
| Revisores | Joaquin Rodriguez — revisión cruzada pendiente |
| Work item | [MAPS-146](https://santitalavera.atlassian.net/browse/MAPS-146) / [MAPS-116](https://santitalavera.atlassian.net/browse/MAPS-116) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-146 |
| Fase origen | [F0 §0.4/0.5/0.8](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §3/5, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §5/6/12](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-CLD-000](../MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md) (ACEPTADO, GCP); [ADR-SW-001](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-005](../../../software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) |
| Depende de | Revisión y aceptación de este ADR; condiciones operativas de C1/C2/C4/C5/C8; DNS administrado por MAPS aún no confirmado |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Este ADR permanece PROPUESTO. No acepta proveedor de frontend, servicio, configuración de red ni infraestructura.

## Contexto y problema

ADR-CLD-000 adopta GCP como plataforma del MVP, pero no selecciona servicios concretos. El Portal necesita una superficie web pública para el frontend y rutas controladas hacia la API. La entrada debe permitir TLS y dominio propio, evitar accesos que eludan los controles de borde previstos y sostener despliegues reversibles. La opción debe ser proporcionada para un equipo pequeño y compatible con la aplicación modular y sus contratos de identidad.

La pregunta es: **¿qué modelo de hosting y entrada pública se propone para exponer el frontend y la API del Portal con operación proporcional, routing explícito y límites de acceso verificables?**

Este ADR decide el patrón de hosting y entrada pública. No fija framework frontend, región final, tamaños de Cloud Run, VPC, topología de base de datos, roles IAM, CDN habilitada, política Cloud Armor, Terraform ni pipeline. Esos límites corresponden a C1/C2/C4/C5/C8. La autorización funcional de la API sigue siendo responsabilidad de Software.

## Baseline y frontera de responsabilidades

- GCP está ACEPTADO como plataforma del MVP por ADR-CLD-000; eso no acepta ningún servicio.
- ADR-SW-001/002 aceptan un monolito modular y separación hexagonal; la división en workloads cloud no crea módulos de dominio ni microservicios conceptuales.
- ADR-SW-005 define autenticación/autorización de aplicación. La API debe validar token, UserIdentity activa, RBAC y ownership en sus operaciones. La red o el balanceador no sustituyen esos controles.
- La PR [#29](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/29) (C1 Runtime + Database) y la PR [#30](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/30) (C2 Security / IAM) permanecen abiertas. Sus documentos son deltas candidatos, no baseline integrada ni decisiones aceptadas.
- El discovery read-only de MAPS-LandingPage confirmó un patrón productivo de balanceador global, serverless NEGs, routing por paths e ingress Cloud Run restringido. Se usa como evidencia de experiencia y operabilidad; no constituye arquitectura aprobada para MAPS Portal.

## Drivers y criterios

| Driver o criterio | Importancia | Evidencia / fuente |
| --- | --- | --- |
| Una entrada pública productiva clara para frontend y API | Alta | Superficie pública del Portal; objetivo de reducir rutas de bypass |
| Operación asumible y complejidad proporcional | Alta | Equipo pequeño; managed-first de Cloud Strategy |
| Rutas SPA y API bajo dominio controlado | Alta | Necesidad de servir frontend y exponer API |
| TLS y dominio propio con readiness verificable | Alta | La administración del DNS MAPS aún no está confirmada |
| Seguridad por capas | Alta | ADR-SW-005 y controles de ingress Cloud Run |
| Costos y TCO proporcionales | Alta | Guardrail GCP de USD 200/mes; comparar consumo y carga humana, no sólo precio nominal |
| Reversibilidad de despliegues | Media | Recuperar una versión conocida sin alterar datos |
| Evolución sin obligación inmediata | Media | Cloud CDN y Cloud Armor deben poder añadirse si un driver aparece |
| Paridad de ambientes | Alta | La frontera pública no debe variar estructuralmente entre staging y producción |

## Alternativas consideradas

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| A. Firebase Hosting con rewrite a Cloud Run | Hosting estático gestionado, TLS/dominio, previews y rollback; configuración sencilla. Rewrites pueden enviar rutas a un contenedor Cloud Run. | Introduce la abstracción y configuración de Hosting además de Cloud Run; la integración depende del endpoint operativo de Cloud Run. La documentación vigente indica timeout de request de 60 s para rewrites a Cloud Run; el default run.app no puede deshabilitarse sin romper esa integración. Verificar routing, límites y promoción multiambiente. | Válida y más simple; no propuesta preferida para el patrón Portal. |
| B. Cloud Run frontend con Global External HTTPS Application Load Balancer | Un único entrypoint y una URL map para frontend/API; serverless NEG; ingress Cloud Run restringible a internal-and-cloud-load-balancing; habilita TLS gestionado y evolución a CDN/Armor. Frontend/API pueden ser contenedores inmutables. | Balanceador y recursos asociados agregan costo fijo, configuración y operación; frontend estático usa compute de Cloud Run. Requiere IaC/runbook y verificación de DNS/TLS. | Propuesta preferida, sujeta a validar costo y operación antes de aceptar. |
| C. Cloud Storage backend bucket con Load Balancer/CDN | Adecuado para archivos estáticos; evita servir assets desde un proceso frontend; backend bucket y CDN opcional. | Cloud Storage por sí solo no sirve dominio personalizado con HTTPS: requiere LB. Puede requerir manejo explícito de fallback SPA, publicación/versionado y routing al backend API. El bucket frontend y su exposición deben configurarse correctamente. | Alternativa viable si el empaquetado estático y el flujo de publicación resultan más simples; pendiente de evaluar durante materialización. |
| D. Firebase App Hosting | Flujo gestionado de build/rollout y backend apoyado en Cloud Run, Load Balancer y Cloud CDN; dominios y operación integrados. | Requiere Blaze y configura abstracciones/build/rollout propios; su encaje con una SPA servida desde contenedor y con el contrato de artefacto promovido entre ambientes debe demostrarse. Puede introducir una superficie de operación distinta al patrón elegido para API. | Válida para aplicaciones/frameworks compatibles; no propuesta inicial para este frontend hasta validar ajuste y promoción. |
| E. Domain mapping directo de Cloud Run | Pocas piezas para prototipo y dominio. | No proporciona por sí mismo routing común frontend/API ni las capacidades de borde elegidas; las capacidades y restricciones de domain mapping deben validarse y no reemplazan ingress. | No cubre el objetivo de entrada común; no propuesta. |

Cloud Run + LB no se elige sólo por consistencia con Landing. La diferencia que inclina provisionalmente la evaluación es el requisito conjunto de una entrada pública por ambiente Cloud persistente, routing por paths y capacidad de impedir el acceso público directo a los servicios backend. Firebase Hosting sigue siendo razonable si una validación operativa demuestra que su menor complejidad y costo superan ese beneficio para el Portal.

## Decisión

**Opción propuesta, aún no aceptada:** usar un External HTTPS Application Load Balancer por cada ambiente Cloud persistente, staging y production. Los recursos son completamente separados; ambos ambientes conservan la misma forma de entrypoint, routing, ingress y protección contra bypass directo. Pueden diferir en capacidad, dominio, certificados, límites, observabilidad, HA y costo.

En ambos ambientes, la URL map usa un path matcher simple: su backend por defecto sirve el frontend; los paths exactos /api y /api/* se enrutan al backend API. El resto del tráfico va al frontend:

- default backend → serverless NEG → servicio Cloud Run que sirve la SPA estática, inicialmente como contenedor Nginx;
- /api y /api/* → serverless NEG → servicio Cloud Run API.

No se requieren routeRules, regex ni URL masks avanzadas. Este patrón no obliga a Software a un framework concreto.

Cloud Run frontend y API usarían ingress internal-and-cloud-load-balancing. Para aceptar tráfico web público a través del balanceador, la invocación de Cloud Run se configura como allow unauthenticated a nivel de IAM invoker para tráfico web, mientras el ingress restringe el acceso externo al balanceador y permite las rutas internas que correspondan. Internet no debe poder invocar directamente run.app. La autenticación del invoker de Cloud Run ≠ autenticación del usuario Portal ≠ RBAC/ownership funcional.

Para una solicitud API: el balanceador enruta la petición; Cloud Run acepta la invocación HTTP por el entrypoint permitido; la API valida el token Identity/IdP según la baseline vigente, consulta UserIdentity y verifica estado ACTIVA, RBAC y ownership. Que IAM permita la invocación HTTP del balanceador no hace que la operación de negocio sea anónima.

Deshabilitar la URL default run.app queda como hardening opcional sólo tras probar monitores y dependencias operativas. La documentación actual advierte que algunos servicios de Google, entre ellos Firebase Hosting y App Hosting, dependen de esa URL; la decisión requiere comprobar el grafo de dependencias.

DNS y TLS propuestos para cada ambiente: dominio/hostname propio → IP del balanceador del ambiente → certificado administrado de Google → HTTPS. No se asume Cloud DNS; el administrador DNS actual de MAPS debe confirmarse. Antes de habilitar usuarios en cada ambiente: DNS correcto, certificado ACTIVE y redirección HTTP→HTTPS validada. Para production, completar además smoke test de frontend, smoke test /api y aprobación explícita GO LIVE. En Landing, certificados FAILED_NOT_VISIBLE coincidieron con DNS oficial aún sin apuntar al balanceador; esto se registra como gate operativo, no como defecto del servicio.

Cloud CDN queda como capacidad disponible, no requisito inicial. Si se activa, se limita al frontend estático tras validar TCO y comportamiento de caché. Assets con hash deben poder usar public, max-age largo e immutable; index.html debe revalidarse (no-cache/must-revalidate o política equivalente segura). API autenticada debe responder private/no-store y no debe compartirse en CDN. El catálogo público no se cachea inicialmente en una CDN compartida sin evidencia de seguridad y frescura.

No se exige Cloud Armor para el MVP: no hay driver actual que lo haga obligatorio. Se podrá incorporar ante necesidad demostrada de WAF, rate limiting en el borde, hallazgos de amenazas, requisito contractual o abuso real; este ADR no inventa una política.

## Consecuencias y trade-offs

**Beneficios esperados:** entrypoint y routing explícitos; ingress backend controlado; DNS/TLS y readiness como condiciones observables; posibilidad de añadir CDN/Armor/SSL policies; promoción por artefactos; reutilización de experiencia existente sin copiar su topología.

**Costos y riesgos:** el balanceador aumenta costo base y configuración frente a Firebase Hosting; requiere administración de certificados/DNS y smoke tests; el frontend en contenedor requiere runtime aunque sea estático; el bloqueo de run.app puede afectar integraciones no identificadas. Un único entrypoint reduce superficies públicas, pero no reemplaza autenticación ni controles de aplicación.

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Costo del balanceador y operación bajo el guardrail USD 200/mes | Cloud | Comparar costo base/TCO y confirmar viabilidad antes de aceptar o desplegar |
| Routing y SPA fallback con frontend/API reales | Cloud + Software | Probar paths, headers, errores, CORS si aplica y comportamiento de rutas profundas |
| Dependencias que usan run.app | Cloud/C2/C5/C8 | Inventariar health checks, Scheduler y servicios integrados; decidir disable sólo tras pruebas |
| Propiedad y control de DNS | MAPS/Cloud | Confirmar administrador y ventana de cambio antes de habilitar dominio productivo |
| Certificado y GO LIVE | Cloud/Operación | Completar el gate DNS → ACTIVE → HTTPS → smoke tests |
| Cookies, token, cache y autorización | Software + Cloud | Validar que respuestas privadas no se cacheen y auth funcional permanezca en API |
| Elección concreta entre Cloud Run y otras opciones | Cloud | Aceptar sólo tras validar costo, routing, promoción y capacidades actuales |
| C1/C2 siguen en revisión | Cloud y revisores | Revisar este ADR contra decisiones aceptadas si #29/#30 cambian antes de integrar C3 |

## Criterios de revisión futura

Reconsiderar si: Firebase Hosting/App Hosting demuestra menor TCO y operación manteniendo el nivel de aislamiento requerido; cambia la forma de entrega frontend; aparecen requerimientos de Cloud Armor/CDN; restricciones de routing/cache; costo del balanceador excede el guardrail; la prueba demuestra incompatibilidad de ingress o dependencias con run.app.

## Referencias y trazabilidad

- Baseline: [F0](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Cloud: [ADR-CLD-000](../MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md), [Cloud Strategy](../../STRATEGY.md).
- Software: [ADR-SW-001](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../../../software/adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-005](../../../software/adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md).
- PRs candidatas no integradas: [#29 C1](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/29), [#30 C2](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/30).
- Fuentes oficiales actuales: [Firebase Hosting](https://firebase.google.com/docs/hosting), [Firebase Hosting → Cloud Run](https://firebase.google.com/docs/hosting/cloud-run), [Hosting configuration/rewrites/headers](https://firebase.google.com/docs/hosting/full-config), [Firebase App Hosting](https://firebase.google.com/docs/app-hosting), [App Hosting costs](https://firebase.google.com/docs/app-hosting/costs), [Cloud Storage static website](https://docs.cloud.google.com/storage/docs/hosting-static-website), [Cloud Load Balancing URL maps](https://docs.cloud.google.com/load-balancing/docs/https), [serverless NEGs](https://docs.cloud.google.com/load-balancing/docs/negs/serverless-neg-concepts), [Cloud Run ingress](https://docs.cloud.google.com/run/docs/securing/ingress), [disable Cloud Run default URL](https://docs.cloud.google.com/run/docs/securing/ingress), [Cloud CDN with serverless backends](https://docs.cloud.google.com/cdn/docs/setting-up-cdn-with-serverless).
- Fila de trazabilidad: despliegue del Portal y exposición pública; los índices se actualizarán después de la revisión/sincronización C3.
