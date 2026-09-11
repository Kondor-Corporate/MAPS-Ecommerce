# Portal de Seguros MAPS

Baseline funcional vigente del Portal de Seguros MAPS. Define alcance, actores, límites y cambios controlados; no prescribe UX, arquitectura, persistencia ni integraciones técnicas.

| Dato | Definición |
| --- | --- |
| Cliente | MAPS - Organización de seguros |
| Equipo de desarrollo | Kondor |
| Proyecto | Portal de Seguros MAPS |
| Versión | Baseline funcional v8 - MVP simplificado |
| Fecha | 11 de septiembre de 2026 |

## 0.1 Definición vigente

El producto es un Portal de Solicitudes de Seguros: publica productos, permite iniciar y recuperar trámites, recibir solicitudes formales y derivarlas de modo seguro a un productor. No es un e-commerce: no hay checkout, pagos, contratación, emisión ni cálculo automático de precios.

```text
Catálogo → Producto → Registro/Login → InsuranceRequest(BORRADOR)
→ completar / guardar / retomar → ENVIADA → bandeja Admin
→ ASIGNADA → email transaccional → acceso seguro del Productor → DERIVADA
```

`BORRADOR` es un trámite iniciado y no presentado; `ENVIADA` es una solicitud formal presentada a MAPS. El borrador existe sólo para preservar progreso, permitir retomarlo, mantener la `FormVersion` utilizada y habilitar su envío posterior; no inicia un proceso comercial paralelo.

### Principios confirmados

- El catálogo es público. Registro/login es obligatorio antes de crear una `InsuranceRequest(BORRADOR)`; Fase 2 define solamente cómo presentar esa exigencia.
- Los estados funcionales son **BORRADOR**, **ENVIADA**, **ASIGNADA**, **DERIVADA** y **CANCELADA**. Estados de entrega de email no forman parte de la solicitud.
- MAPS administra productos y formularios por producto sin cambios de código. Una `FormVersion` PUBLICADA es inmutable; el borrador conserva su versión de creación sin migración automática o silenciosa.
- Un precio fijo sólo se muestra si MAPS aporta un valor vigente, confiable y aplicable. De otro modo, el producto queda sujeto a evaluación; no hay cotizador ni simulador.
- La asignación es manual. El email transaccional al email verificado del productor contiene sólo identificador, producto, fecha, nombre autorizado y enlace seguro.
- El productor accede read-only sólo a solicitudes asignadas, mediante enlace vencible, revocable, no adivinable, auditable y sin navegación a otros casos.
- Las notificaciones son mínimas, relevantes, no redundantes y preferentemente accionables.

### Cambios controlados de baseline

Esta baseline conserva los cambios controlados ya aprobados de autenticación obligatoria previa y reemplazo de WhatsApp por email transaccional. Además incorpora:

1. **Leads/Potenciales clientes fuera del MVP.** Se elimina la generación y sincronización de Leads/Potenciales clientes a partir de borradores. Sin checkout ni pagos, el abandono no justifica un ciclo comercial independiente. Los borradores preservan y recuperan progreso; Recovery/Potenciales clientes podrá evaluarse en una evolución futura con métricas reales del funnel.
2. **PostgreSQL MAPS fuera del camino funcional del MVP.** Fue relevada read-only y contiene información parcial útil, pero no se usará como dependencia funcional actual por cobertura parcial de identidad, semántica contractual insuficiente, ausencia de PDF vigente/autorizado, renovaciones/reemplazos/endosos y riesgo asegurado, relaciones inferidas y complejidad desproporcionada. El Database Discovery Pack se conserva como evidencia de discovery.
3. **Portal del Asegurado/pólizas diferido.** Sin una fuente funcional y reglas confiables aprobadas, no forma parte del MVP; tampoco se comprometen PDF, vigencia contractual, sincronización con Federación, asociaciones automáticas ni carga manual.

## 0.2 Alcance consolidado del MVP

### Incluido

- Catálogo público y detalle de productos.
- Administración de productos por MAPS: crear, editar información comercial, definir precio fijo o sujeto a evaluación y publicar.
- Formularios dinámicos, versionados y configurables por producto.
- Registro/login, borradores recuperables y envío formal de `InsuranceRequest`.
- Bandeja Admin; asignación y reasignación manual de productores.
- Email transaccional, trazabilidad de derivación e incidencias conocidas.
- Acceso seguro read-only del productor a solicitudes asignadas.
- Auditoría y analítica básica del funnel.

### Fuera del MVP actual

- Checkout, pagos, contratación o emisión automática.
- Cotizador, simulador, pricing personalizado o evaluación automática de riesgo.
- Leads/Potenciales clientes, recovery de abandonos e integración con Intranet.
- PostgreSQL MAPS como dependencia funcional.
- Portal del Asegurado, pólizas, PDF, renovaciones/endosos, vigencia contractual y riesgo asegurado.
- Panel general de productores.
- Constructor universal de formularios, lógica tipo Typeform, condicionales complejos y dependencias arbitrarias entre campos.

## 0.3 Productos y formularios

MAPS administra productos y formularios; el equipo no realiza una carga manual inicial como condición de desarrollo. El journey es genérico y no se bloquea por el cierre de fichas de productos concretos.

El contrato funcional acotado de formularios candidato para MVP contempla `text`, `number`, `date`, `select`, `radio`, `checkbox`, `textarea` y `file`, con `required/optional`, opciones, `min/max` cuando corresponda, placeholder, orden, sección/paso, label y help text. Condicionales complejos, builder visual avanzado y dependencias arbitrarias permanecen **PENDIENTE MAPS**.

Fase 1 define capacidad funcional; Fase 2 define UX y autonomía administrativa; Fase 3 define schema, persistencia e implementación.

## 0.4 Actores, roles y ownership

Los roles operativos internos de MAPS en el MVP son **ADMIN** y **PRODUCTOR**. El cliente es actor del Portal, no rol interno.

| Actor | Responsabilidad confirmada |
| --- | --- |
| Cliente | Registrarse/iniciar sesión, iniciar, guardar, retomar y enviar una solicitud; consultar sus solicitudes si esa capacidad se conserva en F2. |
| Admin | Gestionar ENVIADA, asignar/reasignar productor, intervenir ante fallos de email, administrar productores, productos y formularios/versiones, y operar incidencias previas a DERIVADA. |
| Productor | Consultar sólo solicitudes asignadas mediante mecanismo seguro/read-only, acceder al expediente autorizado y continuar la gestión comercial fuera del Portal. |

**Regla de ownership:** todo problema previo a la correcta entrega al productor es responsabilidad del Admin: ENVIADA sin asignar, productor incorrecto/inhabilitado, reasignación, email fallido o rebotado y cambios de producto/formulario. Después de DERIVADA, la gestión comercial es responsabilidad del Productor fuera del Portal.

No toda solicitud ENVIADA es visible al productor. Sólo se habilita su acceso tras la asignación.

## 0.5 Solicitudes, derivación y estados

| Estado | Significado |
| --- | --- |
| BORRADOR | Trámite asociado a cuenta autenticada, todavía no presentado formalmente. |
| ENVIADA | Solicitud formal visible y gestionable por Admin; espera asignación. |
| ASIGNADA | Admin seleccionó productor; puede iniciarse o reintentarse la entrega. |
| DERIVADA | Se registró la correcta derivación al productor. |
| CANCELADA | Estado funcional confirmado; actor autorizado, transiciones y condiciones siguen **PENDIENTE MAPS**. No se presume una acción de UI para cliente ni productor. |

La trazabilidad de entrega registra destinatario, fecha/hora, resultado conocido, fallas y reintentos. Pendiente/aceptado-enviado/entregado/rebotado/fallido son estados técnicos diferidos a Fase 3.

## 0.6 Seguridad y versionado

- Aislamiento de solicitudes por identidad y autorización.
- Consentimientos, respuestas, documentos y versión de formulario auditables.
- El email no expone fotografías, archivos, respuestas completas, documentos ni datos sensibles innecesarios.
- Un enlace de productor vence, puede revocarse, usa transporte cifrado, evita indexación pública y registra accesos relevantes.
- Si una `FormVersion` se retira por razones legales, de seguridad, comerciales o de vigencia, el borrador no puede seguir utilizándola: el usuario será informado e iniciará con la versión vigente. UX y eventual reutilización de datos compatibles son F2/F3.

## 0.7 Analítica de funnel

El MVP registra conceptualmente `product_viewed`, `request_started`, `request_draft_created`/`request_saved` y `request_submitted`. El abandono puede derivarse analíticamente, no es una entidad de negocio.

Métricas deseadas: Product view → Start, Start → BORRADOR, BORRADOR → ENVIADA, tiempo mediano de completado y porcentaje de borradores nunca enviados. Esto permitirá evaluar en V2 si Recovery/Potenciales clientes tiene valor real. Proveedor e implementación de analytics quedan diferidos a F3.

## 0.8 Frontera entre fases

| Fase | Alcance |
| --- | --- |
| F1 | Contrato funcional de Product, formularios acotados, lifecycle de InsuranceRequest, estados, roles, asignación/reasignación, incidencias y RF/RNF. |
| F2 | Catálogo, detalle, login/register, formulario, revisión, confirmación, Mis solicitudes, bandeja Admin, productos, formularios y acceso Productor. Excluye recovery, Leads, Intranet, pólizas y PDF. |
| F3 | Auth/identity, Product/FormDefinition/FormVersion, state machine, respuestas, documentos, email/DeliveryAttempt, enlace seguro, RBAC, auditoría, analytics, APIs y observabilidad. PostgreSQL, Lead, Policy/PDF y sus integraciones quedan fuera del Architecture Decision Pack del MVP. |

## 0.9 Riesgos y decisiones pendientes

| Tema | Estado | Pendiente |
| --- | --- | --- |
| Formulario dinámico | PENDIENTE MAPS | Condicionales complejos, builder avanzado y dependencias arbitrarias. |
| CANCELADA | PENDIENTE MAPS | Actor autorizado, transiciones y condiciones. |
| Operación | PENDIENTE MAPS | SLA de asignación/reasignación y tratamiento funcional de fallos de email. |
| Legal/retención | PENDIENTE MAPS | Textos, consentimientos, retención y eliminación de solicitudes/archivos. |
| Analytics | DIFERIDO F3 | Proveedor, instrumentación y persistencia técnica. |
| Recovery | Evolución futura | Sólo si las métricas reales justifican reintroducir Leads/Potenciales clientes. |

## 0.10 Bitácora de cambios controlados

| Fecha | Tema | Decisión/evidencia | Estado |
| --- | --- | --- | --- |
| 2026-09-03 | Autenticación previa | Login obligatorio antes de crear BORRADOR; F2 conserva UX. | Histórico confirmado |
| 2026-09-03 | Canal inicial | Email transaccional reemplaza WhatsApp; WhatsApp queda como evolución. | Histórico confirmado |
| 2026-09-03 | Versionado | BORRADOR conserva FormVersion; no hay migración automática. | Histórico confirmado |
| 2026-09-11 | Leads/Potenciales clientes | Cambio controlado: se retiran del MVP generación, sincronización, deduplicación, ciclo de vida y conversión de Leads. El borrador no genera oportunidad comercial. | CONFIRMADO |
| 2026-09-11 | PostgreSQL MAPS | Decisión posterior al discovery: fuente read-only evaluada y descartada como dependencia funcional del MVP; el pack se conserva como evidencia. | CONFIRMADO |
| 2026-09-11 | Portal del Asegurado/pólizas | Cambio controlado: se difiere hasta tener fuente funcional y reglas confiables aprobadas. | CONFIRMADO |
| 2026-09-11 | Productos y formularios | MAPS administra productos/formularios; journey genérico y contrato schema-driven acotado. | CONFIRMADO |
| 2026-09-11 | Roles y ownership | Roles internos Admin/Productor; incidencias previas a DERIVADA son responsabilidad de Admin. | CONFIRMADO |
| 2026-09-11 | Funnel | Se agrega analítica de funnel para evaluar recovery futuro sin crear Lead. | CONFIRMADO / técnico F3 |

## 0.11 Documentación histórica

El Database Discovery Pack conserva evidencia read-only útil y no se elimina. `docs/estructura.md`, TDDs y el prototipo UI/UX existente contienen propuestas o artefactos anteriores a esta baseline; no son fuente de alcance vigente. Si contradicen este documento, prevalece la baseline v8 hasta una nueva decisión explícita.
