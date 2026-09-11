# Fase 1 - Discovery y Relevamiento

> **Documento vivo.** Convierte la baseline v8 en conocimiento funcional verificable. No define wireframes, arquitectura, persistencia, proveedores ni integraciones concretas.

| Dato | Definición |
| --- | --- |
| Proyecto | Portal de Seguros MAPS |
| Fase | 1 - Discovery y Relevamiento |
| Estado | En curso |
| Insumo rector | Fase 0 baseline v8 |
| Última actualización | 11 de septiembre de 2026 |

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
- Admin asigna/reasigna; el productor sólo ve solicitudes asignadas mediante enlace seguro read-only.
- Email transaccional es el canal inicial; contenido mínimo y trazabilidad funcional obligatorios.
- Precio fijo sólo con valor vigente/confiable/aplicable; cotizador y simulador están fuera del MVP.
- Analytics de funnel permite evaluar Recovery futuro sin crear una entidad Lead.

## 3. Journey y roles

```text
Catálogo → Producto → Registro/Login → BORRADOR
→ completar / guardar / retomar → ENVIADA → Admin
→ ASIGNADA → email → Productor → DERIVADA
```

| Actor | Acción funcional |
| --- | --- |
| Cliente | Registrarse, iniciar, guardar/retomar BORRADOR, completar y enviar; consultar sus solicitudes si F2 conserva esa capacidad. |
| Admin | Gestionar ENVIADA, asignar/reasignar, intervenir por email fallido, administrar productores, productos y formularios/versiones. |
| Productor | Ver únicamente solicitudes asignadas, consultar expediente autorizado y continuar gestión comercial fuera del Portal. |

No toda ENVIADA es visible al productor. Todo problema previo a DERIVADA es ownership del Admin: pendiente de asignación, productor incorrecto/inhabilitado, reasignación, email fallido/rebotado o incidencia de producto/formulario.

`CANCELADA` se mantiene como estado funcional, pero actor autorizado, transiciones y condiciones están **PENDIENTE MAPS**. No se presume botón o acción de cancelación para cliente o productor.

## 4. Productos y formularios

MAPS crea, edita y publica Products, define precio fijo o sujeto a evaluación, configura formularios y publica nuevas `FormVersion`. El journey no cambia entre productos.

Contrato funcional acotado candidato: `text`, `number`, `date`, `select`, `radio`, `checkbox`, `textarea` y `file`; propiedades `required/optional`, opciones, min/max, placeholder, orden, sección/paso, label y help text.

| Tema | Estado |
| --- | --- |
| Formulario schema-driven y versionado | CONFIRMADO |
| FormVersion PUBLICADA inmutable | CONFIRMADO |
| BORRADOR conserva FormVersion sin migración automática | CONFIRMADO |
| Retiro de versión legal/seguridad/comercial/vigencia | CONFIRMADO; UX y reutilización de datos DIFERIDO F2/F3 |
| Condicionales complejos, builder visual avanzado, dependencias arbitrarias | PENDIENTE MAPS |

## 5. Email, seguridad y auditoría

Luego de asignar, el sistema envía email transaccional al email verificado del productor con identificador, producto, fecha, nombre autorizado y enlace seguro. No contiene fotografías, archivos, documentos, respuestas completas ni información sensible innecesaria.

Se registra destinatario, fecha/hora, resultado conocido, fallas y reintentos. Pendiente, aceptado/enviado, entregado, rebotado y fallido son estados técnicos de F3, no estados de `InsuranceRequest`.

El enlace es por solicitud/asignación, read-only, vencible, revocable, difícil de adivinar, sin acceso a otros casos, no indexable, con transporte cifrado y auditoría relevante. Su mecanismo exacto corresponde a F3.

## 6. Analítica de funnel

Eventos conceptuales: `product_viewed`, `request_started`, `request_draft_created`/`request_saved`, `request_submitted`.

Métricas: Product view → Start, Start → BORRADOR, BORRADOR → ENVIADA, tiempo mediano de completado y porcentaje de borradores nunca enviados. Abandono puede ser una métrica derivada; no es Lead ni evento de negocio. Proveedor, instrumentación y persistencia son **DIFERIDO F3**.

## 7. Modelo conceptual activo

```text
User -> Customer
Product -> FormVersion
Customer -> InsuranceRequest

InsuranceRequest
  - estado BORRADOR / ENVIADA / ASIGNADA / DERIVADA / CANCELADA
  - referencia FormVersion
  - contiene RequestAnswer, Document, Consent
  - puede ser asignada a Producer
  - genera Delivery/Derivación

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
| RN-05 | Productor accede únicamente a solicitudes asignadas. | CONFIRMADO |
| RN-06 | Incidencias previas a DERIVADA son responsabilidad de Admin. | CONFIRMADO |
| RN-07 | Email de derivación minimiza datos y registra resultado/fallas/reintentos. | CONFIRMADO; técnico F3 |
| RN-08 | FormVersion publicada es inmutable; cambios producen nueva versión. | CONFIRMADO |
| RN-09 | CANCELADA requiere actor, condiciones y transiciones aprobadas. | PENDIENTE MAPS |
| RN-10 | El funnel se mide sin crear Lead. | CONFIRMADO; técnico F3 |
| RN-11 | Recovery/Potenciales clientes se reevalúa sólo con evidencia real de abandono. | Evolución futura |

## 9. Requerimientos preliminares

| ID | Requerimiento | Estado |
| --- | --- | --- |
| RF-SOL-01 | Iniciar, guardar, retomar y enviar `InsuranceRequest` desde cuenta autenticada. | CONFIRMADO |
| RF-SOL-02 | Distinguir BORRADOR de ENVIADA y conservar la FormVersion utilizada. | CONFIRMADO |
| RF-FORM-01 | MAPS configura y publica formularios por producto con contrato acotado. | CONFIRMADO / detalle PENDIENTE MAPS |
| RF-PROD-01 | MAPS administra productos, información comercial, precio y publicación. | CONFIRMADO |
| RF-ADM-01 | Admin consulta ENVIADA, asigna/reasigna y opera incidencias previas a DERIVADA. | CONFIRMADO |
| RF-PRODUCER-01 | Productor accede read-only sólo a solicitudes asignadas. | CONFIRMADO |
| RF-DELIVERY-01 | Se registra derivación, resultado conocido, fallas y reintentos. | CONFIRMADO |
| RF-ANALYTICS-01 | Se miden eventos y conversiones del funnel sin entidad Lead. | CONFIRMADO / técnico F3 |
| RNF-SEC-01 | Autorización, aislamiento, transporte cifrado y auditoría protegen solicitudes/documentos. | CONFIRMADO / técnico F3 |
| RNF-COM-01 | Email minimiza datos expuestos y evita notificaciones redundantes. | CONFIRMADO |

## 10. Criterios de salida de F1

F1 podrá cerrarse cuando estén definidos: contrato funcional de Product y formulario dinámico; tipos soportados; versionado/publicación; lifecycle de InsuranceRequest; actor/condición de CANCELADA; matriz Admin/Productor; asignación/reasignación; fallos de email; RF/RNF actualizados e inputs explícitos para F2/F3.

No son blockers de F1: fichas completas de productos concretos, Leads, Intranet, PostgreSQL, Portal del Asegurado, semántica contractual, PDF o pólizas.

## 11. Inputs para F2 y F3

F2 puede diseñar catálogo, detalle, login/register, formulario, revisión, confirmación, Mis solicitudes, bandeja Admin, asignación/reasignación, gestión de productos/formularios y acceso Productor. Quedan fuera: Lead recovery, Intranet Lead UI, pólizas, vigencia y PDF.

F3 recibe auth/identity, Product/FormDefinition/FormVersion, state machine, RequestAnswer, documentos/object storage, email/DeliveryAttempt, secure producer link, RBAC Admin/Productor/Cliente, auditoría, analytics, APIs y observabilidad. PostgreSQL, Lead, Policy/PDF y sus integraciones no forman parte del Architecture Decision Pack del MVP.

## 12. Bitácora de decisiones de F1

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

## 13. Evidencia histórica

El Database Discovery Pack, `docs/estructura.md`, TDDs y el prototipo UI/UX existente se conservan como evidencia o artefactos históricos. No definen el MVP vigente si contradicen esta baseline; su eventual realineación debe hacerse en una tarea separada.
