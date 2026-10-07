# ADR — Monolito modular y límites de módulos

| Dato | Valor |
| --- | --- |
| ID | `ADR-SW-001` |
| Título | Monolito modular y límites de módulos |
| Estado | `PROPUESTO` |
| Fecha | 2026-09-30 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera (revisión cruzada cloud); pendiente de validación final |
| Work item | [MAPS-107](https://santitalavera.atlassian.net/browse/MAPS-107) · subtarea [MAPS-132](https://santitalavera.atlassian.net/browse/MAPS-132) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-107 |
| Fase origen | [F0 §0.2/0.4/0.8](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §2/3/7, RN-01/04/13/14/15](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §5/12/13](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-002](./ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-003](../MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md); [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); ADR-CLD-003 (previsto, sin redactar) |
| Depende de | Ninguna decisión previa. Condicionado por pendientes funcionales MAPS de baja/inhabilitación y perfil (ver Riesgos) |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `PROPUESTO`, `ACEPTADO`, `RECHAZADO`, `REEMPLAZADO`.

## Contexto y problema

El Portal MVP debe soportar catálogo, formularios versionados, solicitudes de seguros (`InsuranceRequest`), asignación y derivación a productores, documentos adjuntos, administración (ABM) y trazabilidad ([F1 §2/3](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md)). El dominio es acotado, lo opera un equipo chico y sus capacidades comparten reglas y transacciones: enviar una solicitud toca catálogo, formulario y solicitud; asignar toca solicitud y entrega.

Hay que decidir la **forma de organizar una única aplicación lógica/codebase modular** y los **límites entre módulos**, dejando la topología de runtime y la cantidad de workloads/entrypoints para Cloud. La estructura documentada en [estructura.md](../../../../estructura.md) y el scaffold actual de `apps/api/src/modules/` están organizados por capas horizontales (rutas, controladores, servicios, repositorios con acceso directo al ORM) e incluyen módulos fuera del MVP (`checkout`, `payments`, `policies`, `contracts`, `leads`), que [F0 §0.2](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md) y [F1 §1](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) excluyen expresamente.

La organización interna de cada módulo (hexagonal, capas y dirección de dependencias) se decide aparte en [ADR-SW-002](./ADR-SW-002-arquitectura-hexagonal-y-capas.md). La persistencia y las transacciones, en [ADR-SW-003](../MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md). La topología de runtime (API, worker, jobs) pertenece a cloud (ADR-CLD-003, previsto).

## Drivers y criterios

| Driver o criterio | Importancia | Evidencia / fuente |
| --- | --- | --- |
| Operación inicial simple | Alta | Dominio acotado, equipo chico, un único journey para todos los productos ([F1 §4](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md)) |
| Límites coherentes con el modelo conceptual F1 | Alta | [F1 §7](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md): User, Customer, Producer, Category, Product, FormVersion, InsuranceRequest, AuditEvent |
| Consistencia local entre capacidades | Alta | Envío, asignación y cancelación requieren atomicidad entre datos de varias capacidades |
| Evitar acoplamiento y alcance fuera del MVP | Alta | Scaffold horizontal con módulos de pagos, pólizas y leads fuera de alcance |
| Reversibilidad | Media | Poder extraer un módulo sólo si aparece evidencia operativa |

## Alternativas consideradas

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| Microservicios desde el inicio | Escalado y despliegue independientes | Consistencia distribuida, más infraestructura, coordinación y observabilidad desproporcionadas para el MVP | Descartada |
| Monolito por capas horizontales (scaffold actual) | Estructura conocida, arranque rápido | Dependencias implícitas entre funcionalidades, acceso cruzado a datos, módulos fuera de alcance | Descartada |
| Monolito modular por capacidad de negocio | Una aplicación lógica/codebase modular, límites explícitos, transacciones locales | Requiere disciplina y controles para que los límites no se erosionen | Propuesta elegida |

## Decisión

Se **propone** construir la API del Portal como una **única aplicación lógica/codebase modular**: una base de código dividida en módulos por capacidad de negocio, con ownership explícito de sus datos y reglas. La cantidad de workloads, entrypoints y unidades de despliegue queda abierta para ADR-CLD-003.

### Mapa de módulos propuesto

| Módulo | Responsabilidad | Entidades F1 de las que es owner |
| --- | --- | --- |
| Identity | Identidades, sesiones, roles (Cliente, Admin, Productor), estado de cuenta, perfil autogestionable del Cliente | User, Customer, Producer |
| Catalog | Categorías, productos, precio fijo vigente, publicación y disponibilidad | Category, Product |
| Forms | Formularios por producto, versiones, publicación y retiro normal/urgente | FormDefinition, FormVersion |
| Requests | Ciclo de vida de `InsuranceRequest`, respuestas, consentimientos, snapshots, cancelación | InsuranceRequest, RequestAnswer, Consent, CancellationRequest |
| Assignment | Asignación/reasignación a productor y registro de derivación/entrega | Assignment, DeliveryAttempt |
| Documents | Metadatos de documentos adjuntos y autorización de acceso | Document |
| Audit | Auditoría de negocio y eventos de funnel sin PII innecesaria | AuditEvent, eventos de analytics |

El ABM administrativo (RN-13/14/15) no es un módulo aparte: cada operación la resuelve el módulo owner y la exposición para el rol Admin es un adaptador de entrada. Notificaciones y outbox son un mecanismo transversal cuya semántica se decide en ADR-SW-004 (previsto).

Quedan **fuera** del mapa y no deben crearse en el MVP: `checkout`, `payments`, `policies`, `contracts`, `leads` y `metrics` como módulo de negocio (el funnel vive en Audit sin entidad Lead, [RN-11](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md)).

### Reglas de límites

- Un módulo escribe sólo sus propios datos y no importa repositorios, modelos de persistencia ni tablas de otro módulo.
- La comunicación entre módulos se hace por contratos públicos de aplicación (consultas y comandos) o eventos de dominio definidos; nunca por acceso directo a su almacenamiento.
- No se permiten dependencias circulares entre módulos. Dirección esperada: Requests depende de Catalog, Forms e Identity; Assignment depende de Requests e Identity; Audit recibe eventos de todos y no es dependido por ninguno.
- Los módulos comparten proceso y, inicialmente, base de datos como infraestructura; el ownership lógico de cada tabla es de un solo módulo ([ADR-SW-003](../MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md)).
- Un caso de uso que necesita atomicidad entre módulos se coordina desde el módulo que inicia la operación, usando los contratos de los demás dentro de la misma unidad de trabajo.

Esta decisión **no** resuelve la estructura interna de cada módulo (ADR-SW-002), el mecanismo de persistencia (ADR-SW-003) ni si API y worker se despliegan como uno o varios servicios (ADR-CLD-003).

## Consecuencias y trade-offs

### Positivas

- Una única aplicación lógica/codebase y una operación inicial más simple; la topología de despliegue queda abierta a Cloud.
- Transacciones locales para operaciones que cruzan capacidades.
- Límites funcionales alineados con F1 y trazables a los TDD de F3.
- Camino de extracción si un módulo necesita escalar u operar por separado.

### Negativas y riesgos

- Los límites pueden erosionarse si no se controlan con revisión y herramientas (reglas de imports en lint).
- Los módulos comparten codebase y base cuando la topología elegida por Cloud así lo determine; una falla o migración de esos componentes puede impactar a varios módulos.
- El scaffold actual de `apps/api` debe reorganizarse antes de F4.

## Revisión cruzada cloud

| Impacto | Documento cloud afectado | Estado de revisión |
| --- | --- | --- |
| Una única aplicación lógica/codebase modular; la separación de API, worker y jobs en workloads o entrypoints queda abierta | ADR-CLD-003, TDD-CLD-002 (previstos) | Pendiente — Santiago Talavera |
| Una base relacional compartida por los módulos: conexiones y concurrencia de los workloads/entrypoints que accedan a ella | TDD-CLD-003 (previsto) | Pendiente — Santiago Talavera |
| Documentos privados accedidos sólo mediante el módulo Documents | TDD-CLD-004 (previsto) | Pendiente — Santiago Talavera |

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Ownership ambiguo entre Identity y Assignment sobre disponibilidad del Productor | Software | Confirmar en TDD-SW-001 que Identity es owner y Assignment la consulta |
| Efectos de baja de Cliente/Productor e inhabilitación más allá de nuevas asignaciones | `PENDIENTE FUNCIONAL MAPS` | Los límites pueden definirse; los efectos sobre casos existentes quedan condicionados |
| Campos de Mi perfil | `PENDIENTE FUNCIONAL MAPS` | Identity queda definido como owner; los campos esperan aprobación MAPS |
| Scaffold con módulos fuera de alcance | Software | Reorganizar `apps/api/src/modules` según este mapa al aceptarse el ADR |
| Revisión cruzada cloud sin completar | Santiago Talavera | Completar la tabla de revisión antes de pasar a `ACEPTADO` |

## Criterios de revisión futura

Revisar si un módulo necesita escalar, desplegarse, protegerse u operarse de forma independiente, o si aparecen límites de datos y transacciones autónomos. Si cambia un ADR aceptado, crear uno nuevo que reemplace a `ADR-SW-001`.

## Registro de decisión

| Fecha | Decisión | Participantes | Observaciones |
| --- | --- | --- | --- |
| — | Pendiente: `ACEPTADO` o `RECHAZADO` | — | Requiere validar mapa de módulos, reglas de dependencia y revisión cruzada cloud |

## Referencias y trazabilidad

- Fuentes F0/F1/F2: [F0 §0.2](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md) alcance; [F1 §3/7](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md) roles y modelo conceptual; [F2 §13](../../../../02-diseno/Fase_2__Design_Handoff.md) matriz de permisos.
- ADR/TDD relacionados: [ADR-SW-002](./ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-003](../MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md).
- Filas de [traceability.md](../../../traceability.md): Product/FormVersion; lifecycle de InsuranceRequest; ABM de categorías, Clientes y Productores.
