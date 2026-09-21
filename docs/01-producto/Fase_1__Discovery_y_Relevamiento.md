# Fase 1 - Discovery y Relevamiento

> **Documento vivo.** Convierte la baseline funcional vigente en conocimiento funcional verificable. No define wireframes, arquitectura, persistencia, proveedores ni integraciones concretas.

| Dato | Definición |
| --- | --- |
| Proyecto | Portal de Seguros MAPS |
| Fase | 1 - Discovery y Relevamiento |
| Estado | En curso |
| Insumo rector | Fase 0 — baseline funcional vigente |
| Última actualización | 21 de septiembre de 2026 |

## 1. Objetivo y alcance vigente

F1 debe cerrar el contrato funcional del Portal de Solicitudes: Product, formulario dinámico acotado, lifecycle de `InsuranceRequest`, roles, asignación/reasignación, fallos de email, auditoría, analítica y RF/RNF. No exige fichas completas de todos los productos concretos para validar el journey genérico.

No incluye Leads/Potenciales clientes, Recovery, Intranet, Portal del Asegurado, pólizas, PDF ni PostgreSQL como dependencia del MVP. El Database Discovery Pack se preserva como evidencia read-only evaluada y descartada para el alcance actual.

| Estado | Significado |
| --- | --- |
| CONFIRMADO | Decisión funcional aprobada. |
| PENDIENTE MAPS | Requiere definición o aprobación operativa. |
| DIFERIDO F2/F3 | El qué está definido; UX o implementación no corresponden a F1. |
| Histórico | Evidencia o decisión anterior que no define el MVP vigente. |

## 2. Baseline funcional consolidada

- Catálogo público; login/registro obligatorio antes de crear `InsuranceRequest(BORRADOR)`.
- `BORRADOR` es trámite iniciado no presentado; `ENVIADA` es solicitud formal presentada a MAPS.
- Estados confirmados: **BORRADOR**, **ENVIADA**, **ASIGNADA**, **DERIVADA**, **CANCELADA**. Estados de email son técnicos y separados.
- MAPS administra Product y formularios versionados sin cambios de código.
- Admin asigna/reasigna; el productor, desde su cuenta autenticada, sólo ve read-only las solicitudes asignadas a él.
- Email transaccional es el canal inicial; contenido mínimo y trazabilidad funcional obligatorios.
- Cliente autenticado consulta y actualiza los datos de perfil habilitados para autogestión básica.
- Todo Product publicado es un seguro enlatado con precio fijo vigente administrado por Admin; cotizador y simulador están fuera del MVP.
- Analytics de funnel permite evaluar Recovery futuro sin crear una entidad Lead.

## 3. Journey y roles

```text
Catálogo → Producto → Registro/Login → BORRADOR
→ completar / guardar / retomar → ENVIADA → Admin
→ ASIGNADA → derivación/notificación con entrega exitosa → DERIVADA → Productor
```

| Actor | Acción funcional |
| --- | --- |
| Cliente | Registrarse, iniciar, guardar/retomar BORRADOR, completar y enviar; consultar **Mis solicitudes** con borradores/enviadas, producto, fecha y estado funcional; consultar y actualizar los datos de perfil habilitados. |
| Admin | Gestionar ENVIADA, asignar/reasignar, intervenir por email fallido, confirmar o rechazar solicitudes de cancelación DERIVADA, administrar (ABM) productores, clientes, productos, categorías del catálogo y formularios/versiones. |
| Productor | Iniciar sesión y ver en **Mis solicitudes** únicamente las asignadas a él, consultar read-only el expediente autorizado y continuar gestión comercial fuera del Portal. |

No toda ENVIADA es visible al productor. La asignación lleva la solicitud a ASIGNADA; sólo una entrega/derivación requerida exitosa permite `ASIGNADA → DERIVADA`. Todo problema previo a DERIVADA es ownership del Admin: pendiente de asignación, productor incorrecto/inhabilitado, reasignación, email fallido/rebotado o incidencia de producto/formulario.

`CANCELADA` es final y no tiene transiciones salientes. BORRADOR puede descartarse sin ser necesariamente CANCELADA ni requerir motivo obligatorio. Cliente cancela directamente ENVIADA o ASIGNADA, registrando actor, fecha y motivo; ASIGNADA notifica una vez a Admin/Productor y revoca el acceso del productor a esa solicitud. En DERIVADA el cliente solicita cancelación con motivo; esa solicitud es una situación asociada al expediente, no un estado nuevo. Admin la confirma tras considerar gestión externa y recién ocurre `DERIVADA → CANCELADA`, registrando solicitante, Admin, fecha y motivo, notificando una vez al Productor y revocando su acceso a esa solicitud. Si Admin la rechaza, InsuranceRequest permanece DERIVADA; se registra la decisión administrativa y el Cliente puede conocer que su solicitud no fue aceptada. Productor no cancela desde el Portal: comunica la situación a Admin.

## 4. Productos y formularios

MAPS crea, edita y publica Products con precio fijo vigente, configura formularios y publica nuevas `FormVersion`. El journey no cambia entre productos. MAPS también administra (ABM) las categorías del catálogo —crear, editar y renombrar— para agrupar los productos sin cambios de código. Si cambia el precio de un Product con BORRADOR, el cliente debe ser informado al retomar o antes de enviar y confirmar el nuevo valor; ENVIADA conserva como snapshot funcional el precio confirmado. La estrategia técnica del snapshot es F3.

Contrato funcional **preliminar/candidato**: `text`, `number`, `date`, `select`, `radio`, `checkbox`, `textarea` y `file`; propiedades candidatas `required/optional`, opciones, min/max, placeholder, orden, sección/paso, label y help text. Antes de cerrar F1 debe validarse contra uno o dos formularios reales y representativos de seguros enlatados, para comprobar que expresa casos reales sin builder universal.

| Tema | Estado |
| --- | --- |
| Formulario schema-driven y versionado | CONFIRMADO |
| Gestión de categorías del catálogo (ABM) por MAPS | CONFIRMADO |
| FormVersion PUBLICADA inmutable | CONFIRMADO |
| BORRADOR conserva FormVersion sin migración automática | CONFIRMADO |
| Retiro de versión legal/seguridad/comercial/vigencia | CONFIRMADO: Product disponible/publicado requiere al menos una versión utilizable. El retiro normal de la última se bloquea; el retiro urgente aprobado la permite sólo si Product queda no disponible hasta publicar reemplazo. El BORRADOR afectado deja de ser utilizable e inicia uno nuevo sin migración, reutilización ni copia; retención/eliminación/auditoría DIFERIDO F3 + MAPS |
| Condicionales complejos, builder visual avanzado, dependencias arbitrarias | Fuera del MVP, salvo condición obligatoria demostrada por formulario real validado |

## 5. Email, seguridad y auditoría

Luego de asignar, el sistema intenta la notificación/derivación transaccional al email verificado del productor con identificador, producto, fecha, nombre autorizado y un enlace de acceso al Portal. El email es un aviso: no otorga acceso por sí mismo y exige sesión autenticada. No contiene fotografías, archivos, documentos, respuestas completas ni información sensible innecesaria. Una entrega requerida exitosa es precondición funcional de `ASIGNADA → DERIVADA`; si falla, InsuranceRequest permanece ASIGNADA, Admin visualiza la incidencia y puede reintentar.

Se registra destinatario, fecha/hora, resultado conocido, fallas y reintentos. Pendiente, aceptado/enviado, entregado, rebotado y fallido son estados técnicos separados de F3; no crean estados nuevos de `InsuranceRequest`.

El acceso del productor es por cuenta autenticada y read-only: se restringe por identidad a las solicitudes asignadas, no permite navegar a otros casos, puede revocarse por solicitud o por cuenta, usa transporte cifrado y registra accesos relevantes. El mecanismo de autenticación, RBAC y auditoría corresponde a F3.

## 6. Analítica de funnel

Eventos conceptuales: `product_viewed`, `request_started`, `request_saved`, `request_submitted`.

Métricas: Product view → Start, Start → BORRADOR, BORRADOR → ENVIADA, tiempo mediano de completado y porcentaje de borradores nunca enviados. Abandono puede ser una métrica derivada; no es Lead ni evento de negocio. Analytics no registra respuestas, documentos, adjuntos, DNI, CUIT, teléfono, datos de riesgo ni PII innecesaria; no crea Leads/oportunidades, no dispara notificaciones comerciales y no sustituye auditoría. Proveedor, SDK, instrumentación, persistencia, estrategia y retención técnica son **DIFERIDO F3**.

## 7. Modelo conceptual activo

```text
User -> Customer
User -> Producer
Category -> agrupa Product
Product -> FormVersion
Customer -> InsuranceRequest
Customer -> consulta/actualiza datos de perfil habilitados
Admin administra Category, Customer y Producer (ABM)

InsuranceRequest
  - estado BORRADOR / ENVIADA / ASIGNADA / DERIVADA / CANCELADA
  - referencia FormVersion
  - contiene RequestAnswer, Document, Consent
  - puede ser asignada a Producer
  - registra Delivery/Derivación y solicitudes de cancelación como trazabilidad asociada

Producer -> recibe solicitudes asignadas
AuditEvent -> registra eventos relevantes
```

El modelo no introduce clases técnicas adicionales. Cardinalidades, esquema y persistencia son F3.

## 8. Reglas de negocio

| ID | Regla | Estado |
| --- | --- | --- |
| RN-01 | El Portal no ejecuta pagos, contratación ni emisión. | CONFIRMADO |
| RN-02 | Login/registro precede a la creación de BORRADOR. | CONFIRMADO |
| RN-03 | BORRADOR preserva progreso y FormVersion; ENVIADA formaliza la solicitud. | CONFIRMADO |
| RN-04 | Sólo Admin gestiona ENVIADA y asigna/reasigna productores. | CONFIRMADO |
| RN-05 | Productor accede desde su cuenta autenticada y únicamente a las solicitudes asignadas a él. | CONFIRMADO |
| RN-06 | Incidencias previas a DERIVADA son responsabilidad de Admin; ante falla de entrega, InsuranceRequest permanece ASIGNADA. | CONFIRMADO |
| RN-07 | Email de derivación minimiza datos y registra resultado/fallas/reintentos; sólo entrega requerida exitosa habilita `ASIGNADA → DERIVADA`. | CONFIRMADO; técnico F3 |
| RN-08 | FormVersion publicada es inmutable; cambios producen nueva versión. | CONFIRMADO |
| RN-09 | Todo Product publicado tiene precio fijo vigente. Ante cambio con BORRADOR se informa y reconfirma; ENVIADA preserva precio confirmado como snapshot funcional. | CONFIRMADO / técnico F3 |
| RN-10 | BORRADOR se descarta sin pasar a CANCELADA ni requerir motivo obligatorio. ENVIADA y ASIGNADA pueden ser canceladas directamente por Cliente; DERIVADA requiere solicitud con motivo y decisión de Admin: confirmar lleva a CANCELADA y rechazar conserva DERIVADA, con trazabilidad y comunicación al Cliente. | CONFIRMADO |
| RN-11 | El funnel se mide sin crear Lead, PII innecesaria ni automatismos comerciales. | CONFIRMADO; técnico F3 |
| RN-12 | Recovery/Potenciales clientes se reevalúa sólo con evidencia real de abandono. | Evolución futura |
| RN-13 | MAPS administra (ABM) las categorías del catálogo para agrupar productos, sin cambios de código. | CONFIRMADO |
| RN-14 | El Admin administra (ABM) los clientes (alta, edición y baja) y los consulta desde el panel. | CONFIRMADO |
| RN-15 | El Admin administra (ABM) los productores (alta, edición y baja) y habilita o inhabilita su disponibilidad para recibir asignaciones. | CONFIRMADO |
| RN-16 | El acceso del productor no depende de un enlace vencible: exige sesión autenticada y autorización por identidad sobre las solicitudes asignadas. | CONFIRMADO |
| RN-17 | Cliente autenticado consulta y actualiza sólo los datos de perfil habilitados para autogestión básica; identidad avanzada, sincronización y reglas técnicas se difieren a F3. | CONFIRMADO / técnico F3 |

## 9. Requerimientos preliminares

| ID | Requerimiento | Estado |
| --- | --- | --- |
| RF-SOL-01 | Iniciar, guardar, retomar y enviar `InsuranceRequest` desde cuenta autenticada. | CONFIRMADO |
| RF-SOL-02 | Distinguir BORRADOR de ENVIADA y conservar la FormVersion utilizada. | CONFIRMADO |
| RF-SOL-03 | Mis solicitudes permite consultar BORRADOR y enviadas con producto, fecha y estado, y retomar BORRADOR. | CONFIRMADO; UX F2 |
| RF-SOL-04 | Ante precio modificado en BORRADOR se informa y confirma el nuevo valor antes de enviar; ENVIADA conserva el precio confirmado. | CONFIRMADO / técnico F3 |
| RF-SOL-05 | Cancelación responde a estado: BORRADOR se descarta sin motivo obligatorio y sin pasar a CANCELADA; es inmediata en ENVIADA/ASIGNADA; en DERIVADA se solicita con motivo y Admin confirma o rechaza, conservando DERIVADA ante rechazo e informando al Cliente. | CONFIRMADO |
| RF-FORM-01 | MAPS configura y publica formularios por producto con contrato acotado preliminar, validado contra uno o dos casos reales antes del cierre F1. | CONFIRMADO / detalle PENDIENTE MAPS |
| RF-PROD-01 | MAPS administra productos, precio fijo vigente, información comercial y publicación. | CONFIRMADO |
| RF-CAT-01 | MAPS administra (ABM) las categorías del catálogo: crear, editar y renombrar. | CONFIRMADO |
| RF-CLI-01 | El Admin administra (ABM) clientes: alta, edición y baja, y su consulta desde el panel. | CONFIRMADO |
| RF-CLI-PROFILE-01 | El Cliente autenticado puede consultar y actualizar los datos de perfil habilitados para autogestión básica. | CONFIRMADO; detalle técnico F3 |
| RF-ADM-01 | Admin consulta ENVIADA, asigna/reasigna, opera incidencias previas a DERIVADA y decide solicitudes de cancelación DERIVADA. | CONFIRMADO |
| RF-PRODUCER-01 | Productor inicia sesión y consulta read-only, desde **Mis solicitudes**, únicamente las asignadas a él. | CONFIRMADO |
| RF-PRODUCER-02 | El productor recibe aviso cuando una solicitud asignada a él se cancela y pierde el acceso a esa solicitud. | CONFIRMADO |
| RF-PRODUCER-03 | MAPS administra (ABM) productores: alta, edición, baja y habilitación para recibir asignaciones. | CONFIRMADO |
| RF-DELIVERY-01 | Se registra derivación, resultado conocido, fallas y reintentos; DERIVADA sólo se alcanza después de la entrega requerida exitosa. | CONFIRMADO |
| RF-ANALYTICS-01 | Se miden eventos y conversiones del funnel sin entidad Lead, PII innecesaria ni automatismos comerciales. | CONFIRMADO / técnico F3 |
| RF-GOV-01 | Cambios controlados, pendientes y criterios de cierre preservan dueño, fase destino, condición de cierre e histórico. | CONFIRMADO |
| RNF-SEC-01 | Autorización, aislamiento, transporte cifrado y auditoría protegen solicitudes/documentos. | CONFIRMADO / técnico F3 |
| RNF-COM-01 | Email minimiza datos expuestos y evita notificaciones redundantes. | CONFIRMADO |

## 10. Criterios de salida de F1

F1 podrá cerrarse cuando estén definidos: contrato funcional de Product; precio fijo, cambio en BORRADOR y snapshot en ENVIADA; contrato de formulario y validación contra uno o dos casos reales; versionado/publicación; lifecycle completo, descarte de BORRADOR y CANCELADA; Mis solicitudes y perfil autogestionable básico; matriz Admin/Productor; asignación/reasignación; precondición de entrega exitosa para DERIVADA y fallos de email; decisión administrativa sobre cancelación DERIVADA; analytics acotado; gobierno mínimo; RF/RNF actualizados e inputs explícitos para F2/F3.

No son blockers de F1: fichas completas de productos concretos, Leads, Intranet, PostgreSQL, Portal del Asegurado, semántica contractual, PDF o pólizas.

## 11. Gobierno mínimo de F1

MAPS confirma decisiones funcionales, reglas de negocio y cambios de alcance; Kondor releva, analiza, documenta y propone solución. Todo cambio posterior a una baseline consolidada se registra como cambio controlado con fecha, decisión, motivo y consecuencia, sin reinterpretar silenciosamente el pasado. Cada pendiente debe indicar dueño, fase destino y condición de cierre. El cierre de F1 se evalúa contra los criterios explícitos de este documento; la bitácora distingue decisión previa, cambio controlado y baseline vigente.

## 12. Inputs para F2 y F3

F2 puede diseñar catálogo, detalle, login/register, formulario, aviso/confirmación de precio, revisión, envío, confirmación, Mis solicitudes, retomar o descartar BORRADOR sin motivo obligatorio, cancelar ENVIADA/ASIGNADA, solicitar cancelación DERIVADA y conocer la decisión administrativa, y perfil de autogestión básica; Admin puede diseñar bandeja, asignación/reasignación, incidencia y reintento de entrega, productos/precio/formularios/publicación, categorías del catálogo, administración (ABM) de clientes y de productores, y confirmación o rechazo de cancelación DERIVADA; Productor login, **Mis solicitudes** asignadas, detalle read-only, estado y aviso de cancelación. Quedan fuera: Lead recovery, Intranet Lead UI, pólizas, vigencia y PDF.

F3 recibe auth/identity, Product/precio/snapshot histórico, Category, Customer administrable y perfil autogestionable habilitado, FormDefinition/FormVersion, state machine/cancellation flow y trazabilidad de solicitud/decisión de cancelación, RequestAnswer, documentos/object storage, email/DeliveryAttempt con el estado técnico separado que acredita entrega, Producer administrable, RBAC Admin/Productor/Cliente, auditoría de accesos, analytics, APIs y observabilidad. PostgreSQL, Lead, Policy/PDF y sus integraciones no forman parte del Architecture Decision Pack del MVP.

## 13. Bitácora de decisiones de F1

| Fecha | Tema | Decisión/evidencia | Estado |
| --- | --- | --- | --- |
| 2026-09-02 | Inicio F1 | Documento vivo creado desde baseline previa. | Histórico |
| 2026-09-03 | Autenticación, borrador, email y versionado | Cambios controlados consolidados en baseline v7. | Histórico confirmado |
| 2026-09-11 | Leads/Potenciales clientes | Cambio controlado: retirados del MVP; borrador no genera oportunidad comercial. | CONFIRMADO |
| 2026-09-11 | PostgreSQL MAPS | Fuente read-only evaluada y descartada como dependencia del alcance actual; pack preservado. | CONFIRMADO |
| 2026-09-11 | Portal del Asegurado | Diferido hasta fuente funcional y reglas confiables aprobadas. | CONFIRMADO |
| 2026-09-11 | Productos/formularios | MAPS los administra; journey genérico y formulario schema-driven acotado. | CONFIRMADO |
| 2026-09-11 | Roles/ownership | Admin y Productor son roles internos; Admin responde por incidencias previas a DERIVADA. | CONFIRMADO |
| 2026-09-11 | Analytics | Funnel mide abandono para decidir una evolución futura de Recovery. | CONFIRMADO / F3 |
| 2026-09-15 | Precio, CANCELADA y Mis solicitudes | Precio fijo obligatorio/snapshot, cancelación por estado y Mis solicitudes confirmada. | CONFIRMADO |
| 2026-09-15 | Formularios, gobierno y analytics | Contrato de campos preliminar validable con casos reales, gobierno mínimo y analítica con minimización de datos. | CONFIRMADO / PENDIENTE MAPS / F3 |
| 2026-09-16 | Categorías y Clientes (ABM) | Cambio controlado: se incorporan al MVP la administración (ABM) de categorías del catálogo y de clientes como capacidades del Admin (RF-CAT-01, RF-CLI-01, RN-13, RN-14). | CONFIRMADO |
| 2026-09-16 | Acceso del productor | Cambio controlado: se revoca el enlace seguro por solicitud; el productor accede desde cuenta autenticada y consulta en **Mis solicitudes** sólo las asignadas a él (RF-PRODUCER-01, RF-PRODUCER-02, RN-05, RN-16). Motivo: fricción creciente de un enlace por asignación; el aislamiento se resuelve por autorización de identidad. | CONFIRMADO |
| 2026-09-16 | Productores (ABM) | Cambio controlado: se explicita el ABM de productores como capacidad del Admin (RF-PRODUCER-03, RN-15), ya implícita en la asignación y en la gestión de roles internos. | CONFIRMADO |
| 2026-09-21 | Retiro urgente de última FormVersion | Cambio controlado: el retiro normal de la última versión utilizable se bloquea; por urgencia aprobada puede retirarse y el Product pasa a no disponible hasta publicar reemplazo. BORRADORES afectados no se migran, reutilizan ni copian. La representación, retención, eliminación, auditoría e historial quedan para F3 y reglas MAPS. | CONFIRMADO / técnico F3 |
| 2026-09-17 | Alineación F1 y UX previa a F2 | Se formalizan descarte de BORRADOR sin motivo obligatorio, entrega exitosa como precondición de DERIVADA, confirmación/rechazo de cancelación DERIVADA y perfil básico autogestionable del Cliente. | CONFIRMADO / técnico F3 |

## 14. Evidencia histórica

El Database Discovery Pack, `docs/estructura.md`, TDDs y el prototipo UI/UX existente se conservan como evidencia o artefactos históricos. No definen el MVP vigente si contradicen esta baseline; su eventual realineación debe hacerse en una tarea separada.
