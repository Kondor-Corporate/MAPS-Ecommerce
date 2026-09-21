# Portal de Seguros MAPS

Baseline funcional vigente del Portal de Seguros MAPS. Define alcance, actores, límites y cambios controlados; no prescribe UX, arquitectura, persistencia ni integraciones técnicas.

| Dato | Definición |
| --- | --- |
| Cliente | MAPS - Organización de seguros |
| Equipo de desarrollo | Kondor |
| Proyecto | Portal de Seguros MAPS |
| Fecha | 17 de septiembre de 2026 |

## 0.1 Definición vigente

El producto es un Portal de Solicitudes de Seguros: publica productos, permite iniciar y recuperar trámites, recibir solicitudes formales y derivarlas de modo seguro a un productor. No es un e-commerce: no hay checkout, pagos, contratación, emisión ni cálculo automático de precios.

```text
Catálogo → Producto → Registro/Login → InsuranceRequest(BORRADOR)
→ completar / guardar / retomar → ENVIADA → bandeja Admin
→ ASIGNADA → derivación/notificación con entrega exitosa → DERIVADA → acceso autenticado del Productor
```

`BORRADOR` es un trámite iniciado y no presentado; `ENVIADA` es una solicitud formal presentada a MAPS. El borrador existe sólo para preservar progreso, permitir retomarlo, mantener la `FormVersion` utilizada y habilitar su envío posterior; no inicia un proceso comercial paralelo.

### Principios confirmados

- El catálogo es público. Registro/login es obligatorio antes de crear una `InsuranceRequest(BORRADOR)`; Fase 2 define solamente cómo presentar esa exigencia.
- Los estados funcionales son **BORRADOR**, **ENVIADA**, **ASIGNADA**, **DERIVADA** y **CANCELADA**. Estados de entrega de email no forman parte de la solicitud.
- MAPS administra productos y formularios por producto sin cambios de código. Una `FormVersion` PUBLICADA es inmutable; el borrador conserva su versión de creación sin migración automática o silenciosa. Todo Product disponible/publicado tiene al menos una `FormVersion` utilizable.
- Todo Product publicado del MVP es un seguro enlatado con precio fijo vigente. Admin crea y edita ese precio; el Portal no calcula precios y no admite la alternativa “sujeto a evaluación”.
- La asignación es manual. El email transaccional al email verificado del productor contiene sólo identificador, producto, fecha, nombre autorizado y un enlace de acceso al Portal.
- El productor accede read-only sólo a solicitudes asignadas, desde su propia cuenta autenticada en el Portal, con aislamiento por identidad, accesos auditables y sin navegación a otros casos.
- El Cliente autenticado consulta y actualiza los datos de perfil habilitados para autogestión básica.
- Las notificaciones son mínimas, relevantes, no redundantes y preferentemente accionables.

### Cambios controlados de baseline

Esta baseline conserva los cambios controlados ya aprobados de autenticación obligatoria previa y reemplazo de WhatsApp por email transaccional. Además incorpora:

1. **Leads/Potenciales clientes fuera del MVP.** Se elimina su generación y sincronización. Un `InsuranceRequest(BORRADOR)` es progreso de un usuario autenticado, no una solicitud ni una intención comercial suficientemente confirmada; como ya puede recuperarse desde la cuenta, un ciclo paralelo duplicaría semántica, lifecycle, integración y ownership sin evidencia de valor. Recovery podrá evaluarse en una evolución futura con métricas reales del funnel.
2. **PostgreSQL MAPS fuera del camino funcional del MVP.** Fue relevada read-only y contiene información parcial útil, pero no se usará como dependencia funcional actual por cobertura parcial de identidad, semántica contractual insuficiente, ausencia de PDF vigente/autorizado, renovaciones/reemplazos/endosos y riesgo asegurado, relaciones inferidas y complejidad desproporcionada. El Database Discovery Pack se conserva como evidencia de discovery.
3. **Portal del Asegurado/pólizas diferido.** Sin una fuente funcional y reglas confiables aprobadas, no forma parte del MVP; tampoco se comprometen PDF, vigencia contractual, sincronización con Federación, asociaciones automáticas ni carga manual.
4. **Acceso del productor por cuenta autenticada.** Se reemplaza el enlace seguro por solicitud por un acceso autenticado dentro del Portal. Un productor con varias asignaciones debía abrir un email y un enlace distinto por cada solicitud; esa fricción crece linealmente con el volumen y no aporta seguridad que la autorización por identidad no provea. El productor inicia sesión y consulta en **Mis solicitudes** únicamente las asignadas a él. El enlace vencible por solicitud queda revocado como mecanismo; el email conserva su rol de aviso y enlaza al Portal.

## 0.2 Alcance consolidado del MVP

### Incluido

- Catálogo público y detalle de productos.
- Administración de productos por MAPS: crear, editar información comercial, definir precio fijo vigente y publicar.
- Administración de categorías del catálogo por MAPS (ABM: crear, editar y renombrar) para organizar los productos sin cambios de código.
- Administración de clientes por MAPS (ABM: alta, edición y baja) y su consulta desde el panel Admin.
- Administración de productores por MAPS (ABM: alta, edición y baja) y habilitación/inhabilitación para recibir asignaciones.
- Formularios dinámicos, versionados y configurables por producto.
- Registro/login, borradores recuperables y envío formal de `InsuranceRequest`.
- Perfil básico autogestionable del Cliente, limitado a los datos habilitados.
- Bandeja Admin; asignación y reasignación manual de productores.
- Email transaccional, trazabilidad de derivación e incidencias conocidas.
- Cuenta autenticada del productor y consulta read-only de sus solicitudes asignadas desde **Mis solicitudes**.
- Auditoría y analítica básica del funnel.

### Fuera del MVP actual

- Checkout, pagos, contratación o emisión automática.
- Cotizador, simulador, pricing personalizado o evaluación automática de riesgo.
- Leads/Potenciales clientes, recovery de abandonos e integración con Intranet.
- PostgreSQL MAPS como dependencia funcional.
- Portal del Asegurado, pólizas, PDF, renovaciones/endosos, vigencia contractual y riesgo asegurado.
- Panel general de productores con cartera, métricas, comisiones o gestión comercial. El productor sólo dispone de la consulta read-only de las solicitudes asignadas a él.
- Constructor universal de formularios, lógica tipo Typeform, condicionales complejos y dependencias arbitrarias entre campos.

## 0.3 Productos y formularios

MAPS administra productos y formularios; el equipo no realiza una carga manual inicial como condición de desarrollo. El journey es genérico y no se bloquea por el cierre de fichas de productos concretos.

La lista **preliminar/candidata** para el contrato funcional acotado contempla `text`, `number`, `date`, `select`, `radio`, `checkbox`, `textarea` y `file`, con `required/optional`, opciones, `min/max` cuando corresponda, placeholder, orden, sección/paso, label y help text. Antes del cierre de F1 debe validarse contra uno o dos formularios reales y representativos de seguros enlatados. Condicionales complejos, builder visual avanzado y dependencias arbitrarias quedan fuera del MVP, salvo que un formulario validado demuestre una condición obligatoria.

Fase 1 define capacidad funcional; Fase 2 define UX y autonomía administrativa; Fase 3 define schema, persistencia e implementación.

## 0.4 Actores, roles y ownership

Los roles operativos internos de MAPS en el MVP son **ADMIN** y **PRODUCTOR**. El cliente es actor del Portal, no rol interno.

| Actor | Responsabilidad confirmada |
| --- | --- |
| Cliente | Registrarse/iniciar sesión, iniciar, guardar, retomar y enviar una solicitud; consultar **Mis solicitudes** (borradores y enviadas con producto, fecha y estado funcional) y actualizar los datos de perfil habilitados. |
| Admin | Gestionar ENVIADA, asignar/reasignar productor, intervenir ante fallos de email, administrar productores, clientes, productos, categorías del catálogo y formularios/versiones, operar incidencias previas a DERIVADA y decidir solicitudes de cancelación DERIVADA. |
| Productor | Iniciar sesión en el Portal y consultar en **Mis solicitudes** únicamente las solicitudes asignadas a él, acceder read-only al expediente autorizado y continuar la gestión comercial fuera del Portal. |

**Regla de ownership:** todo problema previo a la correcta entrega al productor es responsabilidad del Admin: ENVIADA sin asignar, productor incorrecto/inhabilitado, reasignación, email fallido o rebotado y cambios de producto/formulario. Después de DERIVADA, la gestión comercial es responsabilidad del Productor fuera del Portal.

No toda solicitud ENVIADA es visible al productor. Sólo se habilita su acceso tras la asignación y la entrega requerida exitosa que permite `ASIGNADA → DERIVADA`.

## 0.5 Solicitudes, derivación y estados

| Estado | Significado |
| --- | --- |
| BORRADOR | Trámite asociado a cuenta autenticada, todavía no presentado formalmente. |
| ENVIADA | Solicitud formal visible y gestionable por Admin; espera asignación. |
| ASIGNADA | Admin seleccionó productor; puede iniciarse o reintentarse la entrega. |
| DERIVADA | Se registró la correcta derivación al productor. |
| CANCELADA | Estado final sin transiciones salientes. Registra actor, fecha y motivo. |

La trazabilidad de entrega registra destinatario, fecha/hora, resultado conocido, fallas y reintentos. Pendiente/aceptado-enviado/entregado/rebotado/fallido son estados técnicos diferidos a Fase 3; si la entrega requerida falla, la solicitud permanece ASIGNADA y Admin puede intervenir o reintentar.

### Cancelación

- **BORRADOR:** el cliente puede descartarlo; no es solicitud formal, descartarlo no implica necesariamente `CANCELADA` y no requiere motivo obligatorio.
- **ENVIADA:** el cliente puede cancelar directamente (`ENVIADA → CANCELADA`); se registra actor, fecha y motivo y se notifica una sola vez al Admin.
- **ASIGNADA:** el cliente puede cancelar directamente (`ASIGNADA → CANCELADA`); se registra actor, fecha y motivo, se notifica una sola vez a Admin y Productor y se revoca el acceso del productor a esa solicitud.
- **DERIVADA:** el cliente sólo puede solicitar cancelación con motivo. Admin confirma o rechaza tras considerar la gestión comercial externa. Al confirmar ocurre `DERIVADA → CANCELADA`; se registra solicitante, Admin confirmante, fecha y motivo, se notifica una vez al Productor y se revoca su acceso a esa solicitud. Al rechazar, la solicitud permanece `DERIVADA`, se registra la decisión y el Cliente puede conocer el resultado.
- El Productor no cancela desde el Portal; comunica la situación al Admin.

### Precio y solicitud

Si Admin modifica el precio mientras existe un BORRADOR, el cliente es informado al retomar o antes de enviar y confirma expresamente el nuevo valor; sin esa confirmación no puede enviar. Al pasar a ENVIADA, la solicitud conserva como snapshot funcional el precio confirmado, que no cambia aunque cambie el Product. La estrategia técnica (`priceSnapshot`, `ProductVersion` u otra) corresponde a F3.

## 0.6 Seguridad y versionado

- Aislamiento de solicitudes por identidad y autorización.
- Consentimientos, respuestas, documentos y versión de formulario auditables.
- El email no expone fotografías, archivos, respuestas completas, documentos ni datos sensibles innecesarios.
- El acceso del productor exige sesión autenticada, se restringe por identidad a sus solicitudes asignadas, puede revocarse por solicitud o por cuenta, usa transporte cifrado y registra accesos relevantes.
- El retiro normal de la última `FormVersion` utilizable está bloqueado: Admin crea, publica y confirma una versión de reemplazo antes de retirarla. Excepcionalmente, por razón urgente legal, de seguridad, vigencia u otra situación crítica aprobada, Admin puede retirar esa última versión mediante confirmación fuerte; el Product pasa inmediatamente a no disponible y no admite nuevas solicitudes hasta que exista otra `FormVersion` utilizable. Un Product disponible/publicado nunca queda sin versión utilizable, aunque un Product no disponible puede quedar temporalmente sin ella.
- Si una `FormVersion` se retira, el borrador deja de ser utilizable por el Cliente: será informado e iniciará un BORRADOR nuevo con la versión vigente, sin migración, reutilización ni copia de respuestas. La versión retirada se conserva históricamente y no se restaura/reactiva en el MVP. Retención, eliminación, auditoría e historial quedan diferidos a F3 y a las reglas legales/retención que MAPS confirme.

## 0.7 Analítica de funnel

El MVP registra conceptualmente `product_viewed`, `request_started`, `request_saved` y `request_submitted`. El abandono puede derivarse analíticamente, no es una entidad de negocio.

Métricas deseadas: Product view → Start, Start → BORRADOR, BORRADOR → ENVIADA, tiempo mediano de completado y porcentaje de borradores nunca enviados. Analytics no registra respuestas, documentos, adjuntos, DNI, CUIT, teléfono, datos de riesgo ni PII innecesaria; no genera Leads, oportunidades ni notificaciones comerciales y no sustituye auditoría. Esto permitirá evaluar en V2 si Recovery/Potenciales clientes tiene valor real. Proveedor, SDK, instrumentación, persistencia, retención técnica e implementación quedan diferidos a F3.

## 0.8 Frontera entre fases

| Fase | Alcance |
| --- | --- |
| F1 | Contrato funcional de Product, formularios acotados, lifecycle de InsuranceRequest, estados, roles, asignación/reasignación, incidencias y RF/RNF. |
| F2 | Cliente: catálogo, producto, login/register, formulario, aviso/confirmación de precio, revisión, envío, Mis solicitudes, retomar o descartar BORRADOR sin motivo obligatorio, cancelar ENVIADA/ASIGNADA, solicitar cancelación DERIVADA, conocer la decisión administrativa y editar perfil básico. Admin: bandeja, asignación/reasignación, incidencias y reintentos de entrega, productos/precio/formularios, categorías del catálogo, administración de clientes y confirmación o rechazo de cancelación DERIVADA. Productor: login, **Mis solicitudes** asignadas, detalle read-only y aviso de cancelación. Excluye recovery, Leads, Intranet, pólizas y PDF. |
| F3 | Auth/identity, Product/precio/snapshot histórico, Category, Customer administrable y perfil autogestionable habilitado, FormDefinition/FormVersion, state machine y cancellation flow con trazabilidad de solicitud/decisión, respuestas, documentos, email/Delivery con estado técnico separado, RBAC Admin/Productor/Cliente, auditoría, analytics, APIs y observabilidad. PostgreSQL, Lead, Policy/PDF y sus integraciones quedan fuera del Architecture Decision Pack del MVP. |

## 0.9 Riesgos y decisiones pendientes

| Tema | Estado | Pendiente |
| --- | --- | --- |
| Formulario dinámico | PENDIENTE MAPS | Validar contrato preliminar contra uno o dos formularios reales; confirmar condiciones obligatorias. |
| Precio | CONFIRMADO / DIFERIDO F3 | Precio fijo obligatorio, aviso/reconfirmación de BORRADOR y snapshot de ENVIADA; estrategia técnica F3. |
| Operación | PENDIENTE MAPS | SLA de asignación/reasignación y tratamiento funcional de fallos de email. |
| Legal/retención | PENDIENTE MAPS | Textos, consentimientos, retención y eliminación de solicitudes/archivos. |
| Analytics | DIFERIDO F3 | Proveedor, instrumentación y persistencia técnica. |
| Recovery | Evolución futura | Sólo si las métricas reales justifican reintroducir Leads/Potenciales clientes. |

## 0.10 Gobierno mínimo

| Aspecto | Regla |
| --- | --- |
| Responsables | MAPS confirma decisiones funcionales, reglas y cambios de alcance. Kondor releva, analiza, documenta y propone solución. |
| Control de cambios | Toda modificación posterior a baseline consolidada se registra como cambio controlado con fecha, decisión, motivo y consecuencia; no se reinterpretan decisiones anteriores silenciosamente. |
| Pendientes | Cada pendiente identifica dueño, fase destino y condición de cierre. |
| Cierre F1 | Ocurre contra criterios explícitos, no por sensación de completitud documental. |
| Bitácora | Preserva histórico y distingue decisión previa, cambio controlado y baseline vigente. |

## 0.11 Bitácora de cambios controlados

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
| 2026-09-15 | Precio fijo y snapshot | Cambio controlado: seguros enlatados publicados usan precio fijo; cambio en BORRADOR exige reconfirmación y ENVIADA conserva precio confirmado. | CONFIRMADO / técnico F3 |
| 2026-09-15 | CANCELADA y Mis solicitudes | Se define cancelación por estado y se confirma Mis solicitudes como capacidad del MVP. | CONFIRMADO |
| 2026-09-15 | Gobierno y formularios | Se recupera gobierno mínimo; contrato de formularios queda preliminar y se valida contra casos reales. | CONFIRMADO / PENDIENTE MAPS |
| 2026-09-16 | Categorías y Clientes (ABM) | Cambio controlado: se incorporan al MVP la administración (ABM) de categorías del catálogo y de clientes como capacidades del Admin. Motivo: consecuencia funcional de la gestión autónoma del catálogo sin cambios de código y de la operación de solicitudes; ambas ya presentes en el prototipo y no explicitadas en la baseline. Consecuencia: F2 diseña su UX y F3 su modelo (Category, Customer administrable). | CONFIRMADO |
| 2026-09-16 | Acceso del productor | Cambio controlado: se revoca el enlace seguro por solicitud y el productor pasa a acceder desde su cuenta autenticada, consultando en **Mis solicitudes** sólo las asignadas a él. Motivo: la fricción de abrir un email y un enlace distinto por cada asignación crece con el volumen y el aislamiento se resuelve por autorización de identidad. Consecuencia: se agrega el login de Productor, F2 diseña su UX y F3 reemplaza el mecanismo de enlace vencible por RBAC y auditoría de accesos. | CONFIRMADO |
| 2026-09-16 | Administración de productores | Cambio controlado: se explicita el ABM de productores (alta, edición y baja) como capacidad del Admin, ya implícita en su responsabilidad de asignación y en la administración de roles internos. Consecuencia: F2 diseña su UX y F3 su modelo (Producer administrable). | CONFIRMADO |
| 2026-09-17 | Alineación F1 y UX previa a F2 | Se alinean descarte de BORRADOR sin motivo obligatorio, entrega exitosa como precondición de DERIVADA, confirmación/rechazo de cancelación DERIVADA y perfil básico autogestionable del Cliente. | CONFIRMADO / técnico F3 |
| 2026-09-21 | Retiro urgente de última FormVersion | Cambio controlado: el retiro normal de la última versión utilizable se bloquea; por urgencia legal, seguridad, vigencia u otra situación crítica aprobada, puede retirarse mediante confirmación fuerte y el Product pasa a no disponible hasta publicar reemplazo. BORRADORES afectados no se reutilizan ni migran. | CONFIRMADO / técnico F3 |

## 0.12 Documentación histórica

El Database Discovery Pack conserva evidencia read-only útil y no se elimina. `docs/estructura.md`, TDDs y el prototipo UI/UX existente contienen propuestas o artefactos anteriores a esta baseline; no son fuente de alcance vigente. Si contradicen este documento, prevalece esta baseline funcional vigente hasta una nueva decisión explícita.
