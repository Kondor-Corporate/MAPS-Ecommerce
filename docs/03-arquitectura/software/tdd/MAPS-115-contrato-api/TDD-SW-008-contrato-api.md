# TDD — Contrato API

| Dato | Valor |
| --- | --- |
| ID | `TDD-SW-008` |
| Título | Contrato API del Portal: recursos, comandos, errores y convenciones HTTP |
| Estado | `BORRADOR` |
| Fecha | 2026-10-29 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera — revisión cruzada Cloud pendiente (entrada pública, CORS/dominios, límites de tamaño y tiempos, health checks, webhooks) |
| Work item | [MAPS-115](https://santitalavera.atlassian.net/browse/MAPS-115) · subtarea a confirmar |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-115 |
| Fase origen | [F1 RF-SOL-01 a 05, RF-ADM-01, RF-CAT-01, RF-PROD-01, RF-FORM-01, RF-CLI-01, RF-PRODUCER-01/02/03, RF-DELIVERY-01, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §3/5/6/10/13/14](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md), [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) (`ACEPTADO`); [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md) (`APROBADO`); [TDD-SW-002](../MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md), [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md) (`BORRADOR`); TDD-SW-004 (`BORRADOR`, [PR #27](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/27)); ADR-SW-006 (`PROPUESTO`) y TDD-SW-006 (`BORRADOR`, [PR #28](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/28)); ADR-CLD-001 (`PROPUESTO`, [PR #31](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/31)); ADR-CLD-007 y TDD-CLD-006 ([PR #30](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/30)) |
| Depende de | Contrato definitivo de formularios (MAPS-96) y campos de Mi perfil (MAPS-97): `PENDIENTE FUNCIONAL MAPS`. Routing `/api/*` de ADR-CLD-001 y proveedor de identidad/transporte del token de ADR-CLD-007, ambos `PROPUESTO`. TDD-SW-004 y TDD-SW-006 en PR abiertas. Autenticación de webhooks en TDD-CLD-005 (previsto) |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `BORRADOR`, `EN REVISIÓN`, `APROBADO`, `REEMPLAZADO`.

## Propósito y límites

[ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md) acepta una **API única** sobre un monolito modular, y [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md) ubica HTTP en `adapters/in`. [F2 §14](../../../../02-diseno/Fase_2__Design_Handoff.md) deja explícitamente a F3 los endpoints y las APIs. Este TDD diseña ese contrato:

- Convenciones HTTP comunes: rutas, formato, identificadores, fechas y montos.
- Mapa de recursos por actor (público, Cliente, Admin, Productor) y traducción de los comandos de dominio a endpoints.
- Modelo único de errores y su correspondencia con los códigos de dominio ya definidos.
- Idempotencia, concurrencia optimista, paginación, filtros y orden.
- Versionado de la API y gestión del contrato como OpenAPI.

**Propuesta, no decisión aceptada.** El estilo HTTP/JSON orientado a recursos, con comandos explícitos y contrato-primero en OpenAPI, se propone aquí como diseño. No hay ADR que lo acepte. Si la revisión considera que el estilo de API es una decisión de nivel ADR, se eleva antes de pasar este TDD a `EN REVISIÓN` (ver [Decisiones abiertas](#decisiones-abiertas)).

Fuera de este documento:

- Reglas, guardas y transiciones de `InsuranceRequest`: [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md). La API no agrega ni reinterpreta reglas.
- Políticas de autorización y `AccessScope`: TDD-SW-004. La API sólo autentica y traduce.
- Esquema de campos de formulario y validación por tipo: [TDD-SW-002](../MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md), condicionado a MAPS-96.
- Flujo interno de adjuntos: TDD-SW-006. Este TDD sólo fija sus endpoints.
- Entrada pública, TLS, dominio y routing del balanceador: ADR-CLD-001. Proveedor de identidad y validación criptográfica de tokens: ADR-CLD-007 y TDD-CLD-006. Autenticación de webhooks del proveedor de email: TDD-CLD-005.
- Eventos de funnel y auditoría: TDD-SW-007 (previsto).

## Baseline y dependencias

| Regla / dependencia | Fuente y estado | Impacto en el diseño |
| --- | --- | --- |
| API única, módulos con contratos públicos de aplicación | [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md) — `ACEPTADO` | Un solo contrato HTTP; cada módulo expone su adaptador de entrada, sin acceso cruzado a datos |
| HTTP como adaptador de entrada; DTO separados del dominio | [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md) — `ACEPTADO` | Los controladores invocan casos de uso; no exponen modelos de persistencia |
| Login antes de BORRADOR; catálogo público | RN-02, RF-SOL-01 — CONFIRMADO | Sólo el catálogo es anónimo |
| Comandos, guardas, errores, concurrencia e idempotencia de `InsuranceRequest` | [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md) — `APROBADO` | Un endpoint por comando; códigos de error reutilizados; TDD-SW-003 delega en este TDD el contrato HTTP de errores y la ventana de retención de las claves de idempotencia |
| Deny by default; políticas en `application`; adaptadores HTTP sólo autentican | [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) — `ACEPTADO`; TDD-SW-004 — `BORRADOR` | Ningún endpoint sin política declarada; el prefijo de ruta no es frontera de seguridad |
| Productor ve sólo DERIVADAS asignadas, read-only, por identidad; el email no concede acceso | RN-05/16, RF-PRODUCER-01, ADR-SW-005 — CONFIRMADO | Endpoints del Productor sólo de lectura y con sesión; el enlace del email apunta a una ruta del Portal que exige login |
| Precio fijo, reconfirmación en BORRADOR y snapshot en ENVIADA | RN-09, RF-SOL-04, [F2 §10](../../../../02-diseno/Fase_2__Design_Handoff.md) — CONFIRMADO | La representación del BORRADOR expone precio vigente y confirmado; comando explícito de reconfirmación |
| Cancelación según estado | RN-10, RF-SOL-05 — CONFIRMADO | Endpoints distintos para cancelar (ENVIADA/ASIGNADA) y para solicitar cancelación (DERIVADA) |
| Archivos fuera de la API; URL firmadas | ADR-SW-006 — `PROPUESTO` | Los bytes no pasan por la API; los endpoints de adjuntos quedan condicionados a su aceptación |
| Frontend y API bajo el mismo host; `/api` y `/api/*` al servicio API | ADR-CLD-001 — `PROPUESTO` | Prefijo `/api/v1`; sin CORS en staging/production si se acepta |
| Contrato definitivo de formularios | `PENDIENTE FUNCIONAL MAPS` (MAPS-96) | Puede avanzar la forma de los endpoints; queda condicionado el esquema del payload de respuestas y de edición de FormVersion |
| Campos de Mi perfil | `PENDIENTE FUNCIONAL MAPS` (MAPS-97) | Pueden avanzar rutas y autorización; queda condicionado el esquema de perfil, registro y edición de Clientes por Admin |

## Vista de componentes y responsabilidades

```text
apps/api
├── http/ (transversal)
│   ├── Autenticación         extrae el token y resuelve el actor vía IdentityProviderPort (TDD-SW-004)
│   ├── Correlación           requestId/traceId por request, propagado a logs y errores
│   ├── Límites               tamaño de cuerpo, tipo de contenido, límites de frecuencia de aplicación
│   ├── Idempotencia          lee Idempotency-Key y la entrega al caso de uso
│   ├── Precondiciones        lee If-Match y la entrega como versión esperada
│   ├── Paginación            parsea page/pageSize/sort/filtros contra listas permitidas
│   └── Mapeador de errores   código de dominio → status HTTP + problem+json
└── modules/<módulo>/adapters/in/http
    └── controladores         validan forma del cuerpo, arman el comando/consulta,
                              invocan el caso de uso y serializan el DTO
```

| Componente | Responsabilidad | No hace |
| --- | --- | --- |
| Controlador del módulo owner | Traducir HTTP ↔ comando/consulta de su módulo; validar sintaxis del cuerpo contra el esquema OpenAPI | Decidir permisos, evaluar guardas, leer tablas de otro módulo |
| Caso de uso (`application`) | Evaluar política (TDD-SW-004), ejecutar el comando y devolver resultado o error de dominio | Conocer status HTTP |
| Mapeador de errores | Única tabla de correspondencia código → status; arma `application/problem+json` | Inventar códigos fuera de la tabla |
| Documento OpenAPI | Fuente de verdad del contrato; genera tipos del frontend y alimenta pruebas de contrato | Definir reglas de negocio |

Admin, Cliente y Productor usan prefijos separados (`/admin`, `/me`, `/producer`) porque consumen proyecciones distintas de los mismos datos (el detalle del Admin incluye Assignment e intentos de entrega; el del Cliente no). El prefijo ordena el contrato. La autorización la decide igualmente la política del caso de uso.

## Contratos y flujos

### Convenciones generales

| Aspecto | Contrato propuesto |
| --- | --- |
| Base | `/api/v1`, bajo el mismo host que la SPA (ADR-CLD-001, `PROPUESTO`) |
| Formato | JSON UTF-8; `Content-Type: application/json`; errores en `application/problem+json` |
| Nombres | Rutas en inglés y plural según las entidades de TDD-SW-001 (`requests`, `products`); propiedades en `camelCase` |
| Enumeraciones | Valores del dominio sin traducir: `BORRADOR`, `ENVIADA`, `ASIGNADA`, `DERIVADA`, `CANCELADA`; códigos de error de TDD-SW-003/004/005/006 |
| Identificadores | Opacos (UUID como string); no secuenciales ni enumerables |
| Fechas | ISO 8601 en UTC (`2026-10-29T13:45:00Z`); la UI convierte a la zona del usuario |
| Montos | `{ "amount": "12500.00", "currency": "<ISO 4217>" }`; el monto viaja como string decimal para no perder precisión; la moneda la informa Catalog |
| Recurso único | Sin sobre: el cuerpo es la representación. `ETag` cuando el recurso admite comandos con concurrencia optimista |
| Listados | `{ "items": [...], "page": { "number", "size", "totalItems", "totalPages" } }` |
| Caché | `Cache-Control: no-store` en toda respuesta autenticada; el catálogo público puede declarar caché corta (a coordinar con ADR-CLD-001 si se habilita CDN) |

### Autenticación y transporte del token

- **Propuesta:** la SPA obtiene el token del proveedor de identidad y lo envía en `Authorization: Bearer <token>` en cada request. ADR-CLD-007 (`PROPUESTO`) propone Google Cloud Identity Platform; el formato y la validación los fija TDD-CLD-006.
- Con Bearer en encabezado y sin cookies de sesión emitidas por la API, CSRF no aplica. Si se eligiera un BFF con cookie de sesión, el contrato debe agregar protección CSRF y la decisión vuelve a revisión cruzada.
- Cada request autenticada valida el token y relee el estado de cuenta en el Portal (ADR-SW-005, TDD-SW-004): una cuenta en `BAJA` se rechaza desde la siguiente request aunque el token siga vigente.
- Los tokens nunca viajan en la URL ni se registran en logs. El token de invitación de Productor va en el cuerpo, no en la ruta.

### Mapa de recursos

**Público**

| Método y ruta | Caso de uso | Notas |
| --- | --- | --- |
| `GET /api/v1/catalog/categories` | Ver catálogo | Sólo categorías con productos publicados, según TDD-SW-002 |
| `GET /api/v1/catalog/products` | Ver catálogo | Filtros `categoryId`, `q`; paginado; sólo publicados |
| `GET /api/v1/catalog/products/{productId}` | Ver detalle | Ficha, precio vigente y disponibilidad; 404 si no está publicado |

**Identidad y cuenta**

| Método y ruta | Caso de uso | Notas |
| --- | --- | --- |
| `GET /api/v1/me` | Resolver actor | Rol, estado de cuenta y datos mínimos para la navegación de la SPA. No devuelve una lista de permisos: la UI oculta acciones por UX y la API decide |
| `POST /api/v1/registrations` | `CompleteRegistration` | Identidad autenticada sin cuenta; crea rol `CLIENTE`. Datos del cuerpo condicionados a MAPS-97 |
| `POST /api/v1/producer-invitations/acceptance` | `AcceptProducerInvitation` | Cuerpo `{ "token" }`; errores `INVITACION_INVALIDA`, `EMAIL_NO_COINCIDE` |
| `GET /api/v1/me/profile` · `PATCH /api/v1/me/profile` | Ver y editar Mi perfil | Sólo Cliente. Esquema condicionado a MAPS-97 |

**Cliente — solicitudes**

| Método y ruta | Comando / consulta (TDD-SW-003) | Precondición HTTP | Respuesta |
| --- | --- | --- | --- |
| `POST /api/v1/me/requests` | `CreateDraft` `{ productId }` | — | `201`, `Location`, `ETag`, representación |
| `GET /api/v1/me/requests` | Mis solicitudes | — | Listado paginado; filtros `status`, `productId`, `q`; sin BORRADORES descartados |
| `GET /api/v1/me/requests/{requestId}` | Ver solicitud propia | — | `200` + `ETag` |
| `PUT /api/v1/me/requests/{requestId}/answers` | `SaveDraft` | `If-Match` | `200` + nuevo `ETag`. Reemplaza el conjunto guardado; los campos `file` envían la lista completa de `documentId` del campo (TDD-SW-006) |
| `POST /api/v1/me/requests/{requestId}/price-confirmation` | `ConfirmPrice` `{ priceRef }` | `If-Match` | `200` + nuevo `ETag` |
| `POST /api/v1/me/requests/{requestId}/submission` | `Submit` `{ confirmedPriceRef, consents }` | `If-Match` + `Idempotency-Key` | `200` con la solicitud ENVIADA |
| `POST /api/v1/me/requests/{requestId}/discard` | `DiscardDraft` | `If-Match` | `200` |
| `POST /api/v1/me/requests/{requestId}/cancellation` | `CancelByCustomer` `{ reason }` | `If-Match` + `Idempotency-Key` | `200` con la solicitud CANCELADA |
| `POST /api/v1/me/requests/{requestId}/cancellation-requests` | `RequestCancellation` `{ reason }` | `If-Match` + `Idempotency-Key` | `201` con la `CancellationRequest` `SOLICITADA` |

Cancelar y solicitar cancelación usan endpoints distintos a propósito. Si la solicitud pasó de ASIGNADA a DERIVADA mientras el Cliente miraba la pantalla, un endpoint único elegiría por el Cliente un efecto distinto del que confirmó. Con endpoints explícitos, el cambio de estado devuelve `TRANSICION_INVALIDA` y la UI muestra la acción que corresponde.

La lista de consentimientos y su texto dependen del contrato de formularios (MAPS-96). Hasta entonces `consents` se modela como lista de identificadores de consentimiento aceptados.

**Cliente — adjuntos** (condicionado a ADR-SW-006 `PROPUESTO`; flujo en TDD-SW-006)

| Método y ruta | Caso de uso | Respuesta |
| --- | --- | --- |
| `POST /api/v1/me/requests/{requestId}/uploads` | `RequestUpload` `{ fieldKey, fileName, contentType, size }` | `201` `{ documentId, uploadUrl, uploadExpiresAt, requiredHeaders }` |
| `POST /api/v1/documents/{documentId}/confirmation` | `ConfirmUpload` | `200`; idempotente si ya está `DISPONIBLE` |
| `GET /api/v1/documents/{documentId}/link` | `GetDocumentLink` | `200` `{ url, expiresAt }`; lo usan Cliente, Admin y Productor según su política |

`GetDocumentLink` responde JSON con la URL en lugar de redirigir: el frontend controla la descarga y la respuesta lleva `Cache-Control: no-store`.

**Admin — operación de solicitudes**

| Método y ruta | Comando / consulta | Precondición HTTP |
| --- | --- | --- |
| `GET /api/v1/admin/requests` | Bandeja (desde ENVIADA) | Filtros `status`, `productId`, `producerId`, `hasDeliveryIncident`, `hasPendingCancellation`, `q`; orden permitido |
| `GET /api/v1/admin/requests/summary` | Contadores de la bandeja | Conteos por estado/condición calculados dentro del `AccessScope` |
| `GET /api/v1/admin/requests/{requestId}` | Detalle con Assignment, intentos de entrega y cancelación | `ETag` |
| `POST /api/v1/admin/requests/{requestId}/assignment` | `Assign` `{ producerId }` | `If-Match` |
| `POST /api/v1/admin/requests/{requestId}/reassignment` | `Reassign` `{ producerId }` | `If-Match` |
| `POST /api/v1/admin/requests/{requestId}/delivery-retries` | `RetryDelivery` (TDD-SW-005) | `If-Match` |
| `POST /api/v1/admin/requests/{requestId}/cancellation-requests/{cancellationRequestId}/decision` | `DecideCancellation` `{ decision: "APROBAR" \| "RECHAZAR" }` | `If-Match` + `Idempotency-Key` |

`Assign` responde `200` con la solicitud ASIGNADA. La transición a DERIVADA ocurre después, cuando se acredita la entrega (TDD-SW-005); en el MVP la UI la observa al volver a consultar el detalle, sin canal de notificación en tiempo real.

`ReassignDerived` no tiene endpoint propio: sólo existe dentro de la baja guiada del Productor (TDD-SW-004, RN-19).

**Admin — catálogo, formularios y cuentas**

| Recurso | Endpoints | Condicionado |
| --- | --- | --- |
| Categorías | `GET/POST /api/v1/admin/categories`, `PATCH /api/v1/admin/categories/{id}` | — |
| Productos | `GET/POST /api/v1/admin/products`, `PATCH /api/v1/admin/products/{id}` (ficha), `POST .../{id}/price-revisions` (nuevo precio vigente), `POST .../{id}/publication`, `POST .../{id}/unpublication` | — |
| Formularios | `GET/POST /api/v1/admin/products/{id}/form-versions`, `PUT /api/v1/admin/form-versions/{id}/schema` (sólo versión en borrador), `POST .../{id}/publication`, `POST .../{id}/retirement` `{ mode: "NORMAL" \| "URGENTE" }` | Esquema del cuerpo de `schema`: MAPS-96 |
| Clientes | `GET /api/v1/admin/customers`, `GET/PATCH /api/v1/admin/customers/{id}`, `POST .../{id}/deactivation`, `POST .../{id}/reactivation` | Campos editables: MAPS-97. No hay alta por Admin ni edición de email (TDD-SW-004) |
| Productores | `GET/POST /api/v1/admin/producers` (alta con invitación), `PATCH /api/v1/admin/producers/{id}`, `POST .../{id}/invitation-resend`, `GET .../{id}/deactivation-impact`, `POST .../{id}/deactivation`, `POST .../{id}/reactivation` | — |

La baja guiada usa dos pasos. `GET .../deactivation-impact` lista las ASIGNADAS y DERIVADAS afectadas y las `CancellationRequest` pendientes. `POST .../deactivation` recibe `{ reason, dispositions: [{ requestId, targetProducerId, reason }] }` y ejecuta todo en una unidad de trabajo, o falla completa con `SIN_PRODUCTOR_DISPONIBLE`, `DISPOSICION_INCOMPLETA`, `CANCELACION_PENDIENTE` o `CONFLICTO_CONCURRENCIA` (TDD-SW-004).

**Productor — sólo lectura**

| Método y ruta | Consulta | Notas |
| --- | --- | --- |
| `GET /api/v1/producer/requests` | Mis solicitudes del Productor | Sólo DERIVADAS con Assignment `EFECTIVO` propio y cuenta `ACTIVA`; filtros `productId`, `q`; paginado |
| `GET /api/v1/producer/requests/{requestId}` | Expediente read-only | Fuera del alcance responde `404`. Adjuntos por `GetDocumentLink` |

El Productor no tiene endpoints de escritura sobre solicitudes. El enlace del email de derivación apunta a la ruta del Portal de ese expediente, sin token: abrirlo exige iniciar sesión (ADR-SW-005).

**Entrada técnica**

| Método y ruta | Uso | Notas |
| --- | --- | --- |
| `POST /api/v1/webhooks/email-delivery` | Resultados del proveedor de email (TDD-SW-005) | Sin sesión de usuario; autenticado por la firma del proveedor (TDD-CLD-005). Idempotente por identificador de evento del proveedor. Fuera del OpenAPI público |

### Respuestas exitosas

- Los comandos sobre una solicitud devuelven `200` con la representación actualizada y su nuevo `ETag`, para que la UI se actualice sin otra lectura.
- La creación devuelve `201` con `Location`.
- No se usa `202`: cada comando termina su efecto transaccional al responder. Lo asíncrono (entrega, avisos) queda registrado como intención de Outbox ([ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md)) y se refleja en lecturas posteriores.

### Modelo de errores

Se propone [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) (`application/problem+json`) como forma única:

```json
{
  "type": "urn:maps-portal:problem:precio-no-confirmado",
  "title": "El precio vigente cambió",
  "status": 409,
  "code": "PRECIO_NO_CONFIRMADO",
  "detail": "Confirmá el nuevo precio antes de enviar.",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "errors": [],
  "currentPrice": { "priceRef": "…", "amount": "13100.00", "currency": "…" }
}
```

- `code` es el contrato estable para el frontend: la UI decide por `code`, no por `status` ni por `title`.
- `errors` lista problemas por campo (`{ "field": "<key>", "code": "<código>" }`) para `SOLICITUD_INCOMPLETA`, validación de cuerpo y adjuntos. Usa la `key` del campo de la FormVersion.
- Extensiones por código, sólo cuando la UI las necesita: `currentPrice` para `PRECIO_NO_CONFIRMADO`, `affectedRequests` para `SIN_PRODUCTOR_DISPONIBLE`, `rejectedDocumentIds` para `DOCUMENTO_INVALIDO`.
- `detail` no incluye PII, SQL, trazas ni nombres internos. El texto definitivo para el usuario lo define la UI a partir de `code`.
- Un código nuevo es un cambio aditivo: el frontend trata un `code` desconocido con un mensaje genérico según la familia de `status`.

| Status | Códigos |
| --- | --- |
| `400` | `PETICION_INVALIDA` (JSON mal formado, tipos incorrectos, propiedades desconocidas, filtro u orden no permitido) |
| `401` | `NO_AUTENTICADO` (con `WWW-Authenticate: Bearer`) |
| `403` | `CUENTA_INACTIVA`; `ACCESO_DENEGADO` cuando el actor puede ver el recurso pero no ejecutar la operación |
| `404` | `NO_ENCONTRADO`: recurso inexistente **o fuera del `AccessScope`** del actor; no se revela su existencia (TDD-SW-003, TDD-SW-004) |
| `409` | `TRANSICION_INVALIDA`, `BORRADOR_NO_UTILIZABLE`, `PRECIO_NO_CONFIRMADO`, `PRODUCTO_NO_DISPONIBLE`, `PRODUCTOR_NO_DISPONIBLE`, `CANCELACION_YA_SOLICITADA`, `CANCELACION_PENDIENTE`, `REASIGNACION_DERIVADA_NO_PERMITIDA`, `SIN_PRODUCTOR_DISPONIBLE`, `REGISTRO_YA_COMPLETO`, `PRODUCTO_SIN_VERSION_UTILIZABLE`, `PRECIO_NO_CONFIGURADO`, `DOCUMENTO_NO_DISPONIBLE`; `CONFLICTO_CONCURRENCIA` cuando la request no trajo `If-Match` o hay una ejecución en curso con la misma clave de idempotencia |
| `412` | `CONFLICTO_CONCURRENCIA` cuando la versión de `If-Match` no coincide con la vigente, al validar o al escribir |
| `413` | `CARGA_EXCEDIDA` (cuerpo mayor al límite) |
| `415` | `TIPO_CONTENIDO_NO_SOPORTADO` |
| `422` | `SOLICITUD_INCOMPLETA`, `MOTIVO_REQUERIDO`, `CAMPO_INVALIDO`, `TIPO_NO_PERMITIDO`, `TAMANO_EXCEDIDO`, `DOCUMENTO_INVALIDO`, `DISPOSICION_INCOMPLETA`, `INVITACION_INVALIDA`, `EMAIL_NO_COINCIDE`, `IDEMPOTENCIA_CONFLICTO` |
| `428` | `PRECONDICION_REQUERIDA` (falta `If-Match` o `Idempotency-Key` donde son obligatorios) |
| `429` | `LIMITE_SUBIDAS` y límites de frecuencia de aplicación, con `Retry-After` |
| `500` | `ERROR_INTERNO`, sin detalle |
| `503` | `SERVICIO_NO_DISPONIBLE` (base o proveedor de identidad no disponible), con `Retry-After` cuando se conozca |

`NO_ENCONTRADO`, `PETICION_INVALIDA`, `CARGA_EXCEDIDA`, `TIPO_CONTENIDO_NO_SOPORTADO`, `PRECONDICION_REQUERIDA`, `ERROR_INTERNO` y `SERVICIO_NO_DISPONIBLE` son códigos de la capa HTTP. El resto proviene de TDD-SW-002/003/004/005/006 sin cambios. Para `IDEMPOTENCIA_CONFLICTO` (`422`) y la ejecución concurrente con la misma clave (`409`) se sigue el borrador IETF del encabezado `Idempotency-Key`.

### Idempotencia

| Aspecto | Contrato |
| --- | --- |
| Encabezado | `Idempotency-Key`, UUID generado por el frontend por cada intención del usuario (un clic en "Enviar") y reutilizado en sus reintentos |
| Obligatorio en | `Submit`, `CancelByCustomer`, `RequestCancellation`, `DecideCancellation` (TDD-SW-003). Sin la clave: `428` |
| Alcance y huella | Los de TDD-SW-003: `(actorId, operación, requestId, clave)` y hash de los parámetros relevantes del cuerpo |
| Repetición | Misma clave y misma huella: se devuelve el resultado registrado (status y cuerpo), sin nuevos efectos. La verificación de la clave ocurre **antes** de evaluar `If-Match`: un reintento legítimo no falla con `412` porque la versión ya avanzó con su propio efecto |
| Huella distinta | `422 IDEMPOTENCIA_CONFLICTO` |
| Ejecución en curso | `409 CONFLICTO_CONCURRENCIA`; el frontend reintenta con la misma clave |
| Retención | Propuesta: 24 horas. Cubre reintentos de red y pestañas reabiertas; luego un job purga los registros. Configurable; se confirma con Cloud (ADR-CLD-003 para jobs) |

### Concurrencia optimista

- `GET` del detalle devuelve `ETag: "<version>"`, con la `version` del agregado de TDD-SW-003. Se usa para precondiciones, no para caché.
- Los comandos sobre una solicitud exigen `If-Match` con esa versión. Sin `If-Match`: `428 PRECONDICION_REQUERIDA`. Versión distinta: `412 CONFLICTO_CONCURRENCIA`; la UI recarga y el usuario decide de nuevo.
- `SaveDraft` en dos pestañas: la segunda recibe `412` y no pisa lo guardado. El MVP no fusiona respuestas. El mensaje al usuario lo define UX (ver [Decisiones abiertas](#decisiones-abiertas)).
- Los comandos de baja guiada y de ABM que modifican agregados con versión siguen el mismo patrón con su propia versión.

### Precio y reconfirmación

- La representación del BORRADOR incluye `price.current` (`priceRef`, monto, moneda), `price.confirmed` (o `null`) y `price.changed`, que expone la condición derivada "Precio cambiado" de TDD-SW-003. La API no calcula la regla: la toma del caso de uso.
- `ConfirmPrice` recibe el `priceRef` que el Cliente vio. Si ya no es el vigente, responde `409 PRECIO_NO_CONFIRMADO` con `currentPrice`, y la UI muestra el valor nuevo para volver a confirmar.
- `Submit` envía `confirmedPriceRef`. La guarda de TDD-SW-003 compara contra el vigente al momento del commit; el valor del cuerpo forma parte de la huella de idempotencia.
- ENVIADA y posteriores exponen el snapshot de precio (`priceSnapshot`), no el precio vigente.

### Paginación, filtros y orden

- Paginación por número de página: `page` (desde 1) y `pageSize` (por defecto 20, máximo 100). Se elige por coincidir con la UI de F2 (listados paginados con número de página). La paginación por cursor queda como mejora si el conteo total se vuelve costoso.
- Filtros y orden con listas permitidas por endpoint; un valor fuera de la lista responde `400 PETICION_INVALIDA`. Orden con `sort=-submittedAt`.
- `q` busca sólo sobre las columnas permitidas de cada listado.
- El `AccessScope` se aplica dentro de la consulta, antes de paginar y contar (TDD-SW-004): `totalItems` nunca revela registros fuera del alcance.

### Versionado y compatibilidad

- Versión mayor en la ruta (`/api/v1`). Agregar endpoints, propiedades opcionales o códigos de error no cambia la versión.
- Quitar o renombrar propiedades, cambiar tipos o semántica, o volver obligatorio algo opcional es un cambio incompatible: requiere `/api/v2` con período de convivencia, o cambio coordinado expand/contract.
- Durante un despliegue puede haber pestañas con la SPA anterior: la API nueva acepta las requests de la versión previa de la SPA hasta que termine el rollout. Coordinar con la estrategia de despliegue de ADR-CLD-003.

### Contrato OpenAPI

- Un único documento OpenAPI 3.1, versionado en el repositorio junto a la API y revisado en las PR como cualquier contrato. Su ubicación la fija F4.
- CI valida el documento (lint), detecta cambios incompatibles contra `main` y ejecuta pruebas de contrato que comparan rutas y respuestas implementadas con lo documentado.
- Los tipos del cliente HTTP del frontend se generan desde el documento.
- El webhook del proveedor se documenta aparte, fuera del contrato público.

## Datos, consistencia y migraciones

- La API no tiene datos propios. Las representaciones son proyecciones de consultas de cada módulo; no hay tablas "de API".
- El registro de idempotencia pertenece a Requests y se persiste en la misma unidad de trabajo del comando (TDD-SW-003); su purga usa la retención propuesta arriba.
- Los DTO HTTP se mapean en el adaptador y nunca exponen modelos de persistencia ([ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md)).
- Una migración de base que cambia una representación sigue expand/contract, para que la API siga sirviendo a la SPA anterior durante el rollout.

## Seguridad y privacidad

- Deny by default: ningún endpoint se publica sin política declarada en el catálogo de TDD-SW-004. Una prueba de arquitectura compara el registro de rutas con el de políticas.
- Recurso fuera del alcance → `404`; operación no permitida sobre un recurso visible → `403`.
- Tokens sólo en `Authorization`; el encabezado se enmascara en logs. Ningún token ni dato personal va en la URL ni en query strings.
- Cada listado proyecta sólo las columnas que su pantalla de F2 necesita. La vista del Productor se limita al expediente autorizado.
- Los errores no incluyen PII. `traceId` permite al soporte correlacionar sin exponer datos.
- Mismo host para SPA y API según ADR-CLD-001: sin CORS en staging/production. Desarrollo local puede requerir una lista explícita de orígenes, nunca comodín. Si ADR-CLD-001 cambia hacia otro host para la API, CORS pasa a lista explícita por ambiente.
- Límites: cuerpo JSON de 1 MiB por defecto (propuesta), porque los archivos no pasan por la API. Límites de frecuencia de aplicación en registro, aceptación de invitación y subidas (`LIMITE_SUBIDAS`). La protección de borde la decide ADR-CLD-001/ADR-CLD-007.
- Encabezados: `Cache-Control: no-store` en respuestas autenticadas y `X-Content-Type-Options: nosniff`. HSTS y TLS corresponden al borde (Cloud).

## Operación y observabilidad

- Métricas por endpoint usando la plantilla de ruta (`/api/v1/me/requests/{requestId}`), nunca la ruta con IDs: volumen, latencia, familia de status y conteo por `code`. Coinciden con las señales de TDD-SW-003/004.
- `traceId` en cada respuesta de error y en los logs. Se propaga el contexto de trazas W3C (`traceparent`) que llegue desde el borde (TDD-CLD-007).
- Logs sin cuerpos de request ni respuesta; sólo metadatos y códigos.
- Health checks: la ruta y su exposición las define Cloud (TDD-CLD-002). Como `/api/*` es público por el balanceador, el health check no debe exponer detalle interno.

## Pruebas y criterios de fallo

- **Contrato:** cada ruta implementada está en OpenAPI y viceversa; las respuestas validan contra sus esquemas; CI falla ante un cambio incompatible no declarado.
- **Errores:** cada código de la tabla produce su status y un cuerpo `problem+json` válido; un error inesperado produce `500` sin detalle.
- **Autorización por endpoint:** matriz endpoint × actor derivada del catálogo de políticas de TDD-SW-004. El Productor recibe `403` en cualquier escritura y `404` sobre solicitudes fuera de su alcance. Un Cliente recibe `404` sobre solicitudes ajenas.
- **Idempotencia:** `Submit` repetido con la misma clave devuelve la misma respuesta con un solo efecto; misma clave con otro cuerpo da `422`; dos ejecuciones concurrentes con la misma clave terminan en una respuesta exitosa y un `409` o el mismo resultado, nunca dos snapshots; el reintento después de que la versión avanzó devuelve el resultado registrado y no `412`.
- **Concurrencia:** sin `If-Match` da `428`; con versión vieja da `412` sin efectos.
- **Precio:** `ConfirmPrice` con `priceRef` viejo da `409` con `currentPrice`; `Submit` tras un cambio de precio no reconfirmado da `409 PRECIO_NO_CONFIRMADO`.
- **Paginación:** `pageSize` mayor al máximo da `400`; filtros fuera de la lista dan `400`; los totales no cuentan registros fuera del `AccessScope`.
- **Privacidad:** con datos de prueba que contienen emails y nombres, ningún log ni error los contiene.
- **Límites:** cuerpo mayor al límite da `413`; el contenido distinto de JSON da `415`.

## Implementación y handoff a F4

1. Pipeline HTTP transversal: autenticación, correlación, límites, mapeador de errores y `problem+json`.
2. Esqueleto OpenAPI con lint y detección de cambios incompatibles en CI.
3. Catálogo público.
4. Solicitudes del Cliente (comandos y consultas); adjuntos cuando ADR-SW-006 esté `ACEPTADO`.
5. Bandeja y comandos del Admin; dependen de que TDD-SW-005 avance.
6. ABM de categorías, productos, formularios y cuentas; el esquema de formularios espera MAPS-96 y los campos de perfil MAPS-97.
7. Lectura del Productor.
8. Registro, invitación y Mi perfil (este último condicionado a MAPS-97).
9. Webhook del proveedor de email, cuando TDD-CLD-005 fije su autenticación.

El scaffold actual de `apps/api` se reorganiza antes de F4 según [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md). No se crean Epic/Issues F4 desde este documento.

## Revisión cruzada Cloud requerida

Pendiente con Santiago Talavera:

1. Mismo host para SPA y API con `/api/*` (ADR-CLD-001) y consecuencia de no requerir CORS fuera de desarrollo.
2. Transporte del token como `Authorization: Bearer` y su validación (ADR-CLD-007, TDD-CLD-006).
3. Límite de cuerpo de 1 MiB y tiempos máximos de request frente a los del balanceador y Cloud Run.
4. Ruta y exposición de health checks (TDD-CLD-002).
5. Autenticación e idempotencia del webhook del proveedor de email (TDD-CLD-005).
6. Retención de 24 horas de claves de idempotencia y job de purga (ADR-CLD-003).
7. Propagación de `traceparent` y uso de plantillas de ruta en métricas (TDD-CLD-007).

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| Estilo de API (HTTP/JSON por recursos + OpenAPI 3.1) como decisión de TDD o de ADR | Joaquin Rodriguez | Todo el diseño de este TDD | Revisión del owner; si se eleva, ADR aceptado |
| Transporte del token: Bearer en encabezado o BFF con cookie | Software + Cloud | Contrato con Bearer | ADR-CLD-007 / TDD-CLD-006 |
| Esquema de respuestas, consentimientos y edición de FormVersion | `PENDIENTE FUNCIONAL MAPS` (MAPS-96) | Rutas, comandos y errores | Contrato de formularios validado con 1–2 formularios reales |
| Campos de registro, Mi perfil y edición de Clientes por Admin | `PENDIENTE FUNCIONAL MAPS` (MAPS-97) | Rutas y autorización | Lista de campos visibles/editables/obligatorios de MAPS |
| Idempotencia también en `CreateDraft` y `RequestUpload` (doble clic crea dos BORRADORES o dos documentos) | Software | Contrato actual de TDD-SW-003 | Decidir si se extiende; requiere ajustar TDD-SW-003/006 |
| Retención de claves de idempotencia (propuesta 24 h) | Software + Cloud | Contrato | Revisión cruzada Cloud |
| Identificador visible de solicitud para búsqueda y soporte | Software + UX | Búsqueda por producto y cliente | Definir en TDD-SW-001/003 si existe un número legible |
| Mensaje al usuario ante `412` en `SaveDraft` | UX | Contrato del error | Texto y comportamiento de F2 |
| Contadores de bandeja (`/summary`) | Software + UX | Endpoint propuesto | Confirmar con F2 qué contadores muestra la bandeja |
| Paginación por página o por cursor | Software | Por página en el MVP | Mediciones de volumen en F4 |

## Referencias y trazabilidad

- ADR y TDD relacionados: [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md), [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-002](../MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md), [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md), [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md); TDD-SW-004 ([PR #27](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/27)); ADR-SW-006 y TDD-SW-006 ([PR #28](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/28)); ADR-CLD-001 ([PR #31](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/31)); ADR-CLD-007 y TDD-CLD-006 ([PR #30](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/30)); [ADR-CLD-000](../../../cloud/adr/MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md).
- Fuentes F0/F1/F2: [F1 §3/§4, RF-SOL-01 a 05, RF-ADM-01, RF-PRODUCER-01/02/03, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §3 inventario de pantallas, §6 matriz acción × estado, §13 permisos, §14 handoff](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Estándares: [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457); [RFC 9110 HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (`ETag`, `If-Match`, `412`); [RFC 6585](https://www.rfc-editor.org/rfc/rfc6585) (`428`, `429`); borrador IETF `Idempotency-Key`; OpenAPI 3.1.
- Fila de [traceability.md](../../../traceability.md): contrato API del Portal.
- [Matriz de dependencias](../../../dependency-matrix.md): entrada pública, identidad y adjuntos.
