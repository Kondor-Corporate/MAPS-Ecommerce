# TDD — Contrato API

| Dato | Valor |
| --- | --- |
| ID | `TDD-SW-008` |
| Título | Contrato API del Portal: recursos, comandos, errores y convenciones HTTP |
| Estado | `BORRADOR` |
| Fecha | 2026-10-29 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera: revisión técnica y revisión cruzada Cloud del 2026-10-30, respondidas en [Seguimiento de revisión PR #33](#seguimiento-de-revisión-pr-33) y pendientes de su verificación |
| Work item | [MAPS-115](https://santitalavera.atlassian.net/browse/MAPS-115) · subtarea [MAPS-145](https://santitalavera.atlassian.net/browse/MAPS-145) |
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

**Estilo de API decidido en este TDD (decisión del owner del 2026-10-29).** El estilo HTTP/JSON orientado a recursos, con comandos explícitos y contrato-primero en OpenAPI, no requiere ADR propio: materializa la API única que [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md) ya acepta, el catálogo de ADR de software no prevé uno para esto y cambiarlo antes de F4 tiene bajo costo. Alternativas descartadas:

- **GraphQL:** agrega esquema, resolvers y control de autorización y de costo por campo para un contrato de comandos y listados acotados; no resuelve ninguna necesidad de F2.
- **RPC tipado (por ejemplo, tRPC):** acopla el frontend a los tipos TypeScript del backend y no deja un contrato neutral para pruebas de contrato, revisión en PR o consumidores futuros. OpenAPI conserva la generación de tipos del frontend sin ese acoplamiento.

Fuera de este documento:

- Reglas, guardas y transiciones de `InsuranceRequest`: [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md). La API no agrega ni reinterpreta reglas.
- Políticas de autorización y `AccessScope`: TDD-SW-004. La API sólo autentica y traduce.
- Esquema de campos de formulario y validación por tipo: [TDD-SW-002](../MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md), condicionado a MAPS-96.
- Flujo interno de adjuntos: TDD-SW-006. Este TDD sólo fija sus endpoints.
- Entrada pública, TLS, dominio y routing del balanceador: ADR-CLD-001. Proveedor de identidad y validación criptográfica de tokens: ADR-CLD-007 y TDD-CLD-006. Autenticación de webhooks del proveedor de email: TDD-CLD-005.
- Eventos de funnel y auditoría: TDD-SW-007 (`BORRADOR`, [PR #32](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/32)). Este TDD sólo fija sus endpoints: el registro público de `product_viewed` y el historial de una solicitud.

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
| Composición de lectura | Armar el detalle de Admin y el historial (TDD-SW-007) con contratos públicos de varios módulos, aplicando el `AccessScope` | Tener datos propios, escribir o ser invocada por un módulo |
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
| Número de solicitud | `number`: identificador legible y único que se asigna al pasar a ENVIADA y se muestra desde la confirmación (CLI-05, [F2 §7](../../../../02-diseno/Fase_2__Design_Handoff.md)); `null` en BORRADOR. Sirve para buscar y para soporte; no se usa en rutas ni para autorizar. Condicionado a la enmienda de TDD-SW-001/003 ([PR #34](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/34)): generación, unicidad, reintentos y huecos se definen allí, no en este contrato |
| Fechas | ISO 8601 en UTC (`2026-10-29T13:45:00Z`); la UI convierte a la zona del usuario |
| Montos | `{ "amount": "12500.00", "currency": "<ISO 4217>" }`; el monto viaja como string decimal para no perder precisión; la moneda la informa Catalog |
| Recurso único | Sin sobre: el cuerpo es la representación. `ETag` cuando el recurso admite comandos con concurrencia optimista. `Location` usa una ruta relativa, sin construir URLs externas desde encabezados reenviados |
| Listados | `{ "items": [...], "page": { "number", "size", "totalItems", "totalPages" } }` |
| Caché | `Cache-Control: no-store` en toda respuesta autenticada; sólo los `GET` del catálogo público pueden declarar caché corta (a coordinar con ADR-CLD-001 si se habilita CDN). Nunca se comparte una respuesta autenticada |

### Autenticación y transporte del token

- **Propuesta:** la SPA obtiene el token del proveedor de identidad y lo envía en `Authorization: Bearer <token>` en cada request. ADR-CLD-007 (`PROPUESTO`) propone Google Cloud Identity Platform; el formato y la validación los fija TDD-CLD-006.
- CSRF no aplica sólo bajo este supuesto: autenticación exclusivamente por encabezado Bearer, sin cookies de sesión ni otras credenciales ambientales que el navegador envíe solo. Si se eligiera un BFF con cookie de sesión, el contrato debe agregar protección CSRF y la decisión vuelve a revisión cruzada. Compartir origen evita CORS, pero no protege por sí mismo de solicitudes maliciosas.
- Cada request autenticada valida el token y relee el estado de cuenta en el Portal (ADR-SW-005, TDD-SW-004): una cuenta en `BAJA` se rechaza desde la siguiente request aunque el token siga vigente.
- Los tokens nunca viajan en una parte de la URL que llegue al servidor ni se registran en logs. El token de invitación de Productor llega a la SPA en el fragmento del enlace y a la API en el cuerpo (ver abajo).

### Token de invitación de Productor

El token es una credencial temporal de un solo uso. Su recorrido es:

1. El email contiene `https://<host>/invitacion#token=<token>`. El fragmento no se envía en las requests HTTP ni en `Referer`, así que no llega al CDN, al balanceador ni a la API.
2. La SPA lo lee al arrancar en esa ruta, antes de inicializar diagnóstico o analytics, y lo borra de la barra y del historial con `history.replaceState`.
3. Lo conserva en memoria y, sólo si el login redirige fuera de la SPA, en `sessionStorage`. Lo elimina al recibir la respuesta de la aceptación o un error definitivo.
4. Lo envía una vez, en el cuerpo de `POST /api/v1/producer-invitations/acceptance`. Los logs de la API no registran cuerpos.

Controles de la ruta `/invitacion`: `Referrer-Policy: no-referrer`, sin analytics ni recursos de terceros, y reportes de error sin URL completa ni `sessionStorage`. La plantilla del email se envía sin seguimiento de clics, porque el proveedor reescribiría el enlace y vería el fragmento (TDD-CLD-005).

Riesgo residual: un script malicioso en la SPA podría leer el token mientras exista. Lo acotan su vida corta y un solo uso, y por sí solo no alcanza: la aceptación también exige el email verificado invitado (TDD-SW-004). El mecanismo se coordina con TDD-SW-004 y TDD-CLD-006.

### Clasificación de rutas

| Clase | Rutas | Regla |
| --- | --- | --- |
| Pública anónima | `GET /api/v1/catalog/*`, `POST .../views` | Sin sesión; límites de frecuencia en la API y en el borde |
| Autenticada sin cuenta | `GET /api/v1/me`, `POST /registrations`, `POST /producer-invitations/acceptance` | Únicos endpoints, además de los públicos, que admiten una identidad sin `UserIdentity` |
| Autenticada con cuenta | `/api/v1/me/*`, `/api/v1/admin/*`, `/api/v1/producer/*`, `/api/v1/documents/*` | Política del caso de uso y `AccessScope`. Una identidad sin cuenta recibe `403 REGISTRO_PENDIENTE` |
| Máquina a máquina | `POST /api/v1/webhooks/*` | Sin sesión de usuario; autenticidad del mensaje según TDD-CLD-005 |
| Operativa | Health checks y diagnóstico | Fuera de este contrato (TDD-CLD-002). Ningún endpoint de diagnóstico público expone configuración, topología ni conectividad detallada |

Una ruta no declarada aquí no se publica. La protección de borde complementa la autorización de Software y no la reemplaza.

### Mapa de recursos

**Público**

| Método y ruta | Caso de uso | Notas |
| --- | --- | --- |
| `GET /api/v1/catalog/categories` | Ver catálogo | Sólo categorías con productos publicados, según TDD-SW-002 |
| `GET /api/v1/catalog/products` | Ver catálogo | Filtros `categoryId`, `q`; paginado; sólo publicados |
| `GET /api/v1/catalog/products/{productId}` | Ver detalle | Ficha, precio vigente y disponibilidad; 404 si no está publicado |
| `POST /api/v1/catalog/products/{productId}/views` | Registrar `product_viewed` (TDD-SW-007) | `204`. Cuerpo vacío; `authenticated` se deriva de si la request trae un token válido, sin guardar la identidad. Sólo Products publicados; sin cookies; límite de frecuencia |

**Identidad y cuenta**

| Método y ruta | Caso de uso | Notas |
| --- | --- | --- |
| `GET /api/v1/me` | Resolver actor | Rol, estado de cuenta y datos mínimos para la navegación de la SPA. No devuelve una lista de permisos: la UI oculta acciones por UX y la API decide. Identidad válida sin cuenta: `200` con `{ "accountStatus": "SIN_CUENTA", "role": null }`, para iniciar el registro o la aceptación de la invitación. Token ausente o inválido: `401 NO_AUTENTICADO`. Cuenta en `BAJA`: `403 CUENTA_INACTIVA` |
| `POST /api/v1/registrations` | `CompleteRegistration` | Identidad autenticada sin cuenta; crea rol `CLIENTE`. Datos del cuerpo condicionados a MAPS-97 |
| `POST /api/v1/producer-invitations/acceptance` | `AcceptProducerInvitation` | Cuerpo `{ "token" }`, según [Token de invitación](#token-de-invitación-de-productor); errores `INVITACION_INVALIDA`, `EMAIL_NO_COINCIDE` |
| `GET /api/v1/me/profile` · `PATCH /api/v1/me/profile` | Ver y editar Mi perfil | Sólo Cliente. Esquema condicionado a MAPS-97 |

**Cliente — solicitudes**

| Método y ruta | Comando / consulta (TDD-SW-003) | Precondición HTTP | Respuesta |
| --- | --- | --- | --- |
| `POST /api/v1/me/requests` | `CreateDraft` `{ productId }` | — | `201`, `Location`, `ETag`, representación |
| `GET /api/v1/me/requests` | Mis solicitudes | — | Listado paginado; filtros `status`, `productId`, `q`; sin BORRADORES descartados |
| `GET /api/v1/me/requests/{requestId}` | Ver solicitud propia | — | `200` + `ETag` |
| `GET /api/v1/me/requests/{requestId}/history` | Historial (`GetRequestHistory`, TDD-SW-007) | — | Eventos visibles para el Cliente, en orden cronológico |
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
| `GET /api/v1/admin/requests/{requestId}` | Detalle con Assignment, intentos de entrega y cancelación | `ETag` compuesto (ver [Concurrencia optimista](#concurrencia-optimista)) |
| `GET /api/v1/admin/requests/{requestId}/history` | Historial (`GetRequestHistory`, TDD-SW-007) | — |
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
| `GET /api/v1/producer/requests/{requestId}` | Expediente read-only | Fuera del alcance responde `404`. Cada `GET` registra `EXPEDIENTE_ABIERTO` antes de responder; si el registro falla, responde `503` sin contenido (TDD-SW-007). Adjuntos por `GetDocumentLink` |

El Productor no tiene endpoints de escritura sobre solicitudes. El enlace del email de derivación apunta a la ruta del Portal de ese expediente, sin token: abrirlo exige iniciar sesión (ADR-SW-005).

**Entrada técnica**

| Método y ruta | Uso | Notas |
| --- | --- | --- |
| `POST /api/v1/webhooks/email-delivery` | Resultados del proveedor de email (TDD-SW-005) | Sin sesión de usuario; autenticado por la firma del proveedor, no por una URL difícil de adivinar. Idempotente por identificador de evento del proveedor. TDD-SW-005 conserva las reglas ante eventos tardíos o contradictorios; TDD-CLD-005 materializa autenticidad, protección contra repetición, orden, tamaño, tiempos y reintentos. Fuera del OpenAPI público |

### Respuestas exitosas

- Los comandos sobre una solicitud devuelven `200` con la representación actualizada y su nuevo `ETag`, para que la UI se actualice sin otra lectura.
- La creación devuelve `201` con `Location`.
- No se usa `202`: cada comando termina su efecto transaccional al responder. Lo asíncrono (entrega, avisos) queda registrado como intención de Outbox ([ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md)) y se refleja en lecturas posteriores.
- Un timeout o un corte de red **no implica rollback**: el commit pudo haberse completado aunque la respuesta se pierda. Con `Idempotency-Key`, el frontend reintenta con la misma clave. Sin ella, recarga el recurso y el usuario decide con el estado actual.

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
| `403` | `CUENTA_INACTIVA`; `REGISTRO_PENDIENTE` cuando una identidad válida sin cuenta invoca un endpoint que la requiere; `ACCESO_DENEGADO` cuando el actor puede ver el recurso pero no ejecutar la operación |
| `404` | `NO_ENCONTRADO`: recurso inexistente **o fuera del `AccessScope`** del actor; no se revela su existencia (TDD-SW-003, TDD-SW-004) |
| `409` | `TRANSICION_INVALIDA`, `BORRADOR_NO_UTILIZABLE`, `PRECIO_NO_CONFIRMADO`, `PRODUCTO_NO_DISPONIBLE`, `PRODUCTOR_NO_DISPONIBLE`, `CANCELACION_YA_SOLICITADA`, `CANCELACION_PENDIENTE`, `REASIGNACION_DERIVADA_NO_PERMITIDA`, `SIN_PRODUCTOR_DISPONIBLE`, `REGISTRO_YA_COMPLETO`, `PRODUCTO_SIN_VERSION_UTILIZABLE`, `PRECIO_NO_CONFIGURADO`, `DOCUMENTO_NO_DISPONIBLE`; `CONFLICTO_CONCURRENCIA` en endpoints que no exigen `If-Match` cuando la escritura detecta un cambio concurrente, o cuando hay una ejecución en curso con la misma clave de idempotencia |
| `412` | `CONFLICTO_CONCURRENCIA` cuando alguna versión de `If-Match` no coincide con la vigente, al validar o al escribir |
| `413` | `CARGA_EXCEDIDA` (cuerpo mayor al límite) |
| `415` | `TIPO_CONTENIDO_NO_SOPORTADO` |
| `422` | `SOLICITUD_INCOMPLETA`, `MOTIVO_REQUERIDO`, `CAMPO_INVALIDO`, `TIPO_NO_PERMITIDO`, `TAMANO_EXCEDIDO`, `DOCUMENTO_INVALIDO`, `DISPOSICION_INCOMPLETA`, `INVITACION_INVALIDA`, `EMAIL_NO_COINCIDE`, `IDEMPOTENCIA_CONFLICTO` |
| `428` | `PRECONDICION_REQUERIDA` (falta `If-Match` o `Idempotency-Key` donde son obligatorios) |
| `429` | `LIMITE_SUBIDAS` y límites de frecuencia de aplicación, con `Retry-After` |
| `500` | `ERROR_INTERNO`, sin detalle |
| `503` | `SERVICIO_NO_DISPONIBLE` (base o proveedor de identidad no disponible), con `Retry-After` cuando se conozca |

`NO_ENCONTRADO`, `PETICION_INVALIDA`, `CARGA_EXCEDIDA`, `TIPO_CONTENIDO_NO_SOPORTADO`, `PRECONDICION_REQUERIDA`, `ERROR_INTERNO` y `SERVICIO_NO_DISPONIBLE` son códigos de la capa HTTP. `REGISTRO_PENDIENTE` es nuevo y se incorpora a TDD-SW-004 (ver [Decisiones abiertas](#decisiones-abiertas)). El resto proviene de TDD-SW-002/003/004/005/006 sin cambios. Para `IDEMPOTENCIA_CONFLICTO` (`422`) y la ejecución concurrente con la misma clave (`409`) se sigue el borrador IETF del encabezado `Idempotency-Key`. `CONFLICTO_CONCURRENCIA` usa `412` sólo cuando falla la precondición `If-Match` (RFC 9110) y `409` en los demás conflictos; la UI reacciona por `code`, no por `status` (decisión del owner del 2026-10-29).

### Idempotencia

| Aspecto | Contrato |
| --- | --- |
| Encabezado | `Idempotency-Key`, UUID generado por el frontend por cada intención del usuario (un clic en "Enviar") y reutilizado en sus reintentos |
| Obligatorio en | `Submit`, `CancelByCustomer`, `RequestCancellation`, `DecideCancellation` (TDD-SW-003). Sin la clave: `428`. No se extiende a `CreateDraft` ni a `RequestUpload` (decisión del owner del 2026-10-29); ver [Riesgo aceptado](#riesgo-aceptado-sin-idempotencia-en-createdraft-y-requestupload) |
| Alcance y huella | Los de TDD-SW-003: `(actorId, operación, requestId, clave)` y hash de los parámetros relevantes del cuerpo |
| Repetición | Misma clave y misma huella: se devuelve el resultado registrado (status y cuerpo), sin nuevos efectos. La verificación de la clave ocurre **antes** de evaluar `If-Match`: un reintento legítimo no falla con `412` porque la versión ya avanzó con su propio efecto |
| Huella distinta | `422 IDEMPOTENCIA_CONFLICTO` |
| Ejecución en curso | `409 CONFLICTO_CONCURRENCIA`; el frontend reintenta con la misma clave |
| Persistencia | El resultado se guarda en la misma unidad de trabajo que el comando, en PostgreSQL, con restricción única sobre el alcance. Nunca en memoria: vale con varias instancias de API y workers. Una respuesta perdida después del commit se recupera reintentando con la misma clave |
| Retención | 24 horas, aceptado por Software (decisión del owner del 2026-10-29). Cubre reintentos de red y pestañas reabiertas; luego un job purga los registros, por lotes y de forma segura ante corridas concurrentes. Configurable; Cloud confirma suficiencia, índices y crecimiento (TDD-CLD-003, ADR-CLD-003 para jobs) |
| Repetición con la clave vencida | Se trata como una intención nueva, sin doble efecto: `If-Match` con la versión vieja responde `412`, o la guarda de estado rechaza el comando. No se recupera la respuesta original: la UI recarga y muestra el estado actual |

#### Riesgo aceptado: sin idempotencia en `CreateDraft` y `RequestUpload`

La UI deshabilita la acción mientras la request está en curso, pero eso no cubre una respuesta perdida después del commit. Los dos casos se tratan distinto:

- **`RequestUpload`:** el documento sobrante nunca queda en uso y lo elimina el job de limpieza de TDD-SW-006.
- **`CreateDraft`:** el BORRADOR sobrante no se limpia solo, porque TDD-SW-003 no prohíbe varios BORRADORES por Product y su retención depende de MAPS-99.

Recuperación de `CreateDraft`: ante un timeout o un error de red, la SPA no repite el `POST` automáticamente. Consulta `GET /api/v1/me/requests?status=BORRADOR&productId=<id>` y, si encuentra BORRADORES, ofrece retomar uno antes de crear otro. Un duplicado queda visible en Mis solicitudes y se puede descartar con `DiscardDraft`.

Criterios de aceptación del riesgo:

- Un duplicado nunca pierde respuestas ni produce un efecto distinto de un BORRADOR de más.
- Cada duplicado genera otro `request_started` e infla esa métrica; se cuenta como limitación conocida del funnel (TDD-SW-007).
- Una señal sin PII cuenta los BORRADORES del mismo Cliente y Product creados en una ventana corta. Si el volumen justifica corregirlo, se revisa esta decisión con un cambio controlado de TDD-SW-003.

### Concurrencia optimista

- **Solicitud del Cliente:** `GET` devuelve `ETag: "<version>"`, con la `version` del agregado de TDD-SW-003. Los cambios de Assignment y entrega no se exponen al Cliente ni invalidan su `ETag`.
- **Detalle de Admin:** `GET` devuelve un `ETag` compuesto, `"<requestVersion>-<assignmentVersion>"`, con la `version` de la solicitud y la del Assignment no cerrado (`0` si no hay). La UI lo trata como opaco. Se usa para precondiciones, no para caché.
- Los comandos exigen `If-Match` con el `ETag` de su representación. Sin `If-Match`: `428 PRECONDICION_REQUERIDA`. Versión distinta: `412 CONFLICTO_CONCURRENCIA`; la UI recarga y el usuario decide de nuevo.

Qué protege cada comando de Admin:

| Comando | Compara en `If-Match` | La escritura se condiciona a | Qué incrementa |
| --- | --- | --- | --- |
| `Assign` | Ambas versiones | `InsuranceRequest.version` e índice único parcial de Assignment | `InsuranceRequest.version`; el Assignment nace con su versión inicial |
| `Reassign` | Ambas versiones | `InsuranceRequest.version` y `Assignment.version` | `InsuranceRequest.version`; cierra el Assignment anterior |
| `RetryDelivery` | Ambas versiones | `Assignment.version` y `estado = 'PENDIENTE_ENTREGA'` | `Assignment.version`; la solicitud no cambia |
| `DecideCancellation` | Ambas versiones | `InsuranceRequest.version`; si cierra el Assignment, también su versión | Las de los agregados que modifica |

Toda escritura sobre un Assignment no cerrado o sobre sus `DeliveryAttempt`, incluidos los resultados de entrega, incrementa `Assignment.version` ([TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md#concurrencia-de-reintentos-resultados-y-vigencia)). Así, un comando sobre una pantalla desactualizada recibe `412` aunque `InsuranceRequest.version` no haya cambiado.

- `SaveDraft` en dos pestañas: la segunda recibe `412` y no pisa lo guardado. El MVP no fusiona respuestas. El mensaje al usuario lo define UX (ver [Decisiones abiertas](#decisiones-abiertas)).
- Los comandos de baja guiada y de ABM que modifican agregados con versión siguen el mismo patrón con su propia versión.

### Precio y reconfirmación

- La representación del BORRADOR incluye `price.current` (`priceRef`, monto, moneda), `price.confirmed` (o `null`) y `price.changed`, que expone la condición derivada "Precio cambiado" de TDD-SW-003. La API no calcula la regla: la toma del caso de uso.
- `ConfirmPrice` recibe el `priceRef` que el Cliente vio. Si ya no es el vigente, responde `409 PRECIO_NO_CONFIRMADO` con `currentPrice`, y la UI muestra el valor nuevo para volver a confirmar.
- `Submit` envía `confirmedPriceRef`. La guarda de TDD-SW-003 compara contra el vigente al momento del commit; el valor del cuerpo forma parte de la huella de idempotencia.
- ENVIADA y posteriores exponen el snapshot de precio (`priceSnapshot`), no el precio vigente.

### Paginación, filtros y orden

- Paginación por número de página: `page` (desde 1) y `pageSize` (por defecto 20, máximo 100). Se elige por coincidir con la UI de F2 (listados paginados con número de página). La paginación por cursor queda como mejora sólo si las mediciones de F4 muestran que el conteo total se vuelve costoso (decisión del owner del 2026-10-29).
- Filtros y orden con listas permitidas por endpoint; un valor fuera de la lista responde `400 PETICION_INVALIDA`. Orden con `sort=-submittedAt`.
- `q` busca sólo sobre las columnas permitidas de cada listado, incluido `number` en los listados de solicitudes.
- El `AccessScope` se aplica dentro de la consulta, antes de paginar y contar (TDD-SW-004): `totalItems` nunca revela registros fuera del alcance.

### Versionado y compatibilidad

- Versión mayor en la ruta (`/api/v1`). Agregar endpoints, propiedades opcionales o códigos de error no cambia la versión.
- Quitar o renombrar propiedades, cambiar tipos o semántica, o volver obligatorio algo opcional es un cambio incompatible: requiere `/api/v2` con período de convivencia, o cambio coordinado expand/contract.
- Durante un despliegue puede haber pestañas con la SPA anterior o recursos en caché: la API nueva acepta las requests de la versión previa de la SPA, también después del rollout, mientras esa versión siga dentro del período de convivencia. Un despliegue simultáneo no elimina esa ventana.
- Un rollback de la API exige que la versión restaurada siga atendiendo a la SPA vigente: los cambios se publican como aditivos y las migraciones siguen expand/contract. Las pruebas de contrato cubren la versión anterior y la nueva. El mecanismo se coordina con ADR-CLD-003 y TDD-CLD-002.

### Contrato OpenAPI

- Un único documento OpenAPI 3.1, versionado en el repositorio junto a la API y revisado en las PR como cualquier contrato. Su ubicación la fija F4.
- CI valida el documento (lint), detecta cambios incompatibles contra `main` y ejecuta pruebas de contrato que comparan rutas y respuestas implementadas con lo documentado.
- Los tipos del cliente HTTP del frontend se generan desde el documento.
- El webhook del proveedor se documenta aparte, fuera del contrato público.

## Datos, consistencia y migraciones

- La API no tiene datos propios. Las representaciones son proyecciones de consultas de cada módulo; no hay tablas "de API".
- El registro de idempotencia pertenece a Requests y se persiste en la misma unidad de trabajo del comando (TDD-SW-003); su purga usa la retención definida arriba.
- Los DTO HTTP se mapean en el adaptador y nunca exponen modelos de persistencia ([ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md)).
- Una migración de base que cambia una representación sigue expand/contract, para que la API siga sirviendo a la SPA anterior durante el rollout.

## Seguridad y privacidad

- Deny by default: ningún endpoint se publica sin política declarada en el catálogo de TDD-SW-004. Una prueba de arquitectura compara el registro de rutas con el de políticas.
- Recurso fuera del alcance → `404`; operación no permitida sobre un recurso visible → `403`.
- Tokens sólo en `Authorization`; el encabezado se enmascara en logs. Ningún token ni dato personal va en rutas ni en query strings. El token de invitación sigue su [recorrido propio](#token-de-invitación-de-productor).
- Cada listado proyecta sólo las columnas que su pantalla de F2 necesita. La vista del Productor se limita al expediente autorizado.
- Los errores no incluyen PII. `traceId` permite al soporte correlacionar sin exponer datos.
- Mismo host para SPA y API según ADR-CLD-001: sin CORS en staging/production. Desarrollo local puede requerir una lista explícita de orígenes, nunca comodín. Si ADR-CLD-001 cambia hacia otro host para la API, CORS pasa a lista explícita por ambiente.
- Límites: cuerpo JSON de 1 MiB por defecto, aceptado por Software y sujeto a la revisión cruzada Cloud, porque los archivos no pasan por la API. Límites de frecuencia de aplicación en registro, aceptación de invitación y subidas (`LIMITE_SUBIDAS`). La protección de borde la decide ADR-CLD-001/ADR-CLD-007.
- Encabezados: `Cache-Control: no-store` en respuestas autenticadas y `X-Content-Type-Options: nosniff`. HSTS y TLS corresponden al borde (Cloud).

## Operación y observabilidad

- Métricas por endpoint usando la plantilla de ruta (`/api/v1/me/requests/{requestId}`), nunca la ruta con IDs: volumen, latencia, familia de status y conteo por `code`. Coinciden con las señales de TDD-SW-003/004.
- `traceId` en cada respuesta de error y en los logs. Permite localizar una operación, pero no acredita su resultado ni reemplaza la auditoría.
- El contexto W3C (`traceparent`) se propaga a workers y Outbox. Un valor enviado por un cliente no es confiable: se valida su formato, no se usa para autorizar y TDD-CLD-007 define si se reemplaza en el borde.
- Señales del registro de idempotencia: tamaño, repeticiones y conflictos.
- Logs sin cuerpos de request ni respuesta; sólo metadatos y códigos.
- Health checks: la ruta y su exposición las define Cloud (TDD-CLD-002), distinguiendo proceso vivo de instancia lista para recibir tráfico, de modo que una falla transitoria de PostgreSQL o del proveedor de identidad no provoque reinicios innecesarios. Como `/api/*` es público por el balanceador, el health check no debe exponer detalle interno.

## Pruebas y criterios de fallo

- **Contrato:** cada ruta implementada está en OpenAPI y viceversa; las respuestas validan contra sus esquemas; CI falla ante un cambio incompatible no declarado.
- **Errores:** cada código de la tabla produce su status y un cuerpo `problem+json` válido; un error inesperado produce `500` sin detalle.
- **Identidad sin cuenta:** `GET /me` responde `200` con `SIN_CUENTA` y `role: null`; token inválido responde `401`; cuenta en `BAJA`, `403 CUENTA_INACTIVA`; cualquier endpoint que requiere cuenta, `403 REGISTRO_PENDIENTE`.
- **Invitación:** la SPA borra el fragmento antes de cualquier request a la API o a terceros, el token no aparece en logs ni en reportes de error, y la ruta responde con `Referrer-Policy: no-referrer`.
- **`CreateDraft`:** con la respuesta perdida después del commit, la SPA encuentra el BORRADOR y ofrece retomarlo sin crear otro; un duplicado se puede descartar.
- **Autorización por endpoint:** matriz endpoint × actor derivada del catálogo de políticas de TDD-SW-004. El Productor recibe `403` en cualquier escritura y `404` sobre solicitudes fuera de su alcance. Un Cliente recibe `404` sobre solicitudes ajenas.
- **Idempotencia:** `Submit` repetido con la misma clave devuelve la misma respuesta con un solo efecto; misma clave con otro cuerpo da `422`; dos ejecuciones concurrentes con la misma clave terminan en una respuesta exitosa y un `409` o el mismo resultado, nunca dos snapshots; el reintento después de que la versión avanzó devuelve el resultado registrado y no `412`.
- **Concurrencia:** sin `If-Match` da `428`; con versión vieja da `412` sin efectos. Con PostgreSQL real: `RetryDelivery` con un `ETag` anterior a un resultado de entrega o a otro reintento da `412` y no crea intento; dos `RetryDelivery` concurrentes crean un solo intento.
- **Clave vencida:** repetir un comando ya aplicado después de purgar su clave no produce un segundo efecto.
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

## Dependencias Cloud

La revisión cruzada del 2026-10-30 es favorable al enfoque. Lo que afecta al contrato Software se incorporó a este documento; lo operativo queda en su artefacto responsable y no bloquea integrar este borrador:

| Tema | Artefacto |
| --- | --- |
| Routing, TLS, encabezados reenviados, caché por ruta, CORS y antiabuso | ADR-CLD-001, TDD-CLD-001 |
| Validación de tokens, sesión de la SPA, MFA y coordinación de invitaciones | ADR-CLD-007, TDD-CLD-006 |
| Límites de borde y aplicación, timeouts, concurrencia, presupuesto de latencia, health checks, despliegue y rollback | ADR-CLD-003, TDD-CLD-002 |
| Suficiencia de 24 horas, purga, índices y crecimiento del registro de idempotencia | TDD-CLD-003 |
| Autenticidad, repetición, orden y reintentos del webhook; plantilla sin seguimiento de clics | TDD-CLD-005 |
| Contexto de trazas entrante, cardinalidad de métricas y correlación | TDD-CLD-007 |

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| Transporte del token: Bearer en encabezado (contrato actual, coherente con Identity Platform que propone ADR-CLD-007) o BFF con cookie | Software + Cloud | Contrato con Bearer | Aceptación de ADR-CLD-007 / TDD-CLD-006 |
| Esquema de respuestas, consentimientos y edición de FormVersion | `PENDIENTE FUNCIONAL MAPS` (MAPS-96) | Rutas, comandos y errores | Contrato de formularios validado con 1–2 formularios reales |
| Campos de registro, Mi perfil y edición de Clientes por Admin | `PENDIENTE FUNCIONAL MAPS` (MAPS-97) | Rutas y autorización | Lista de campos visibles/editables/obligatorios de MAPS |
| Atributo `number` en el modelo y su formato | Software + UX | Contrato de la API con `number` | Integración y ratificación de la enmienda de TDD-SW-001/003 ([PR #34](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/34)); formato acordado con UX |
| Alineación de TDD-SW-004 con este contrato | Software | Este contrato define `REGISTRO_PENDIENTE`, la respuesta `SIN_CUENTA` y el recorrido del token | Al integrarse [PR #27](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/27): agregar el código a su tabla de errores y enlazar este recorrido desde el alta e invitación de Productor |
| Retención de claves (24 h) y límite de cuerpo (1 MiB) | Cloud | Contrato con esos valores | Confirmación en la revisión cruzada Cloud |
| Mensaje al usuario ante `412` en `SaveDraft` | UX | Contrato del error | Texto y comportamiento de F2 ([MAPS-106](https://santitalavera.atlassian.net/browse/MAPS-106)) |
| Contadores de bandeja (`/summary`) | Software + UX | Endpoint propuesto | Confirmar con F2 qué contadores muestra la bandeja ([MAPS-106](https://santitalavera.atlassian.net/browse/MAPS-106)) |

### Decisiones cerradas por el owner (2026-10-29)

| Tema | Decisión | Motivo |
| --- | --- | --- |
| Estilo de API | HTTP/JSON por recursos, con comandos explícitos y OpenAPI 3.1, decidido en este TDD sin ADR propio | Materializa la API única de ADR-SW-001; alternativas descartadas en [Propósito y límites](#propósito-y-límites) |
| Idempotencia en `CreateDraft` y `RequestUpload` | No se extiende en el MVP | TDD-SW-003 está `APROBADO`; el duplicado se mitiga en la UI, con el descarte del BORRADOR y con la limpieza de TDD-SW-006 |
| Retención de claves y límite de cuerpo | 24 h y 1 MiB, aceptados por Software | Cubren reintentos y pestañas reabiertas; los archivos no pasan por la API. Cloud los confirma en la revisión cruzada |
| `CONFLICTO_CONCURRENCIA` con `409` o `412` | Se mantiene | `412` sólo para `If-Match` desactualizado (RFC 9110); `409` para conflictos sin precondición o con ejecución en curso. La UI reacciona por `code` |
| Número de solicitud legible | Se expone `number`, asignado al pasar a ENVIADA | F2 §7 muestra "Número" en CLI-05 y TDD-SW-001 no lo define. Requiere enmienda de TDD-SW-001/003 |
| Paginación | Por número de página en el MVP | Coincide con la UI de F2; cursor sólo si las mediciones de F4 lo justifican |

### Decisiones cerradas por el owner (2026-10-30)

| Tema | Decisión | Motivo |
| --- | --- | --- |
| `ETag` del detalle de Admin | Compuesto por la versión de la solicitud y la del Assignment; `RetryDelivery` y los resultados de entrega incrementan `Assignment.version` | Un reintento no toca `InsuranceRequest.version`; con una sola versión, el comando podría aplicarse sobre una pantalla desactualizada |
| Token de invitación | Fragmento del enlace, borrado por la SPA y enviado en el cuerpo | El fragmento no llega a servidores ni a `Referer` |
| Identidad sin cuenta | `/me` responde `200` con `SIN_CUENTA`; los demás endpoints que requieren cuenta, `403 REGISTRO_PENDIENTE` | Distingue el onboarding de un token inválido, sin inventar rol ni permisos |
| Recuperación de `CreateDraft` | Se mantiene sin idempotencia; la SPA busca el BORRADOR antes de crear otro | Respeta TDD-SW-003 y cubre la respuesta perdida, que la UI no puede evitar |

## Seguimiento de revisión PR #33

| Punto (2026-10-30) | Respuesta en este documento |
| --- | --- |
| Técnica 1: `number` | [Convenciones](#convenciones-generales) y [Decisiones abiertas](#decisiones-abiertas): condicionado a PR #34 |
| Técnica 2: versiones de comandos Admin | [Concurrencia optimista](#concurrencia-optimista) y [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md#reintento-manual-retrydelivery) |
| Técnica 3 y Cloud 2.3: token de invitación | [Token de invitación](#token-de-invitación-de-productor) |
| Técnica 4 y Cloud 2.5: `CreateDraft` | [Riesgo aceptado](#riesgo-aceptado-sin-idempotencia-en-createdraft-y-requestupload) |
| Técnica 5: `/me` sin cuenta | [Identidad y cuenta](#mapa-de-recursos), [Modelo de errores](#modelo-de-errores) y [Clasificación de rutas](#clasificación-de-rutas) |
| Cloud 2.1: entrada pública | [Clasificación de rutas](#clasificación-de-rutas) y [Dependencias Cloud](#dependencias-cloud) |
| Cloud 2.2: transporte del token | [Autenticación](#autenticación-y-transporte-del-token): CSRF limitado al supuesto Bearer |
| Cloud 2.4: límites y tiempos | [Respuestas exitosas](#respuestas-exitosas): timeout no implica rollback. Resto en [Dependencias Cloud](#dependencias-cloud) |
| Cloud 2.5: idempotencia | [Idempotencia](#idempotencia): persistencia, respuesta perdida, clave vencida y purga |
| Cloud 2.6: health checks | [Operación](#operación-y-observabilidad) y TDD-CLD-002 |
| Cloud 2.7: webhook | [Entrada técnica](#mapa-de-recursos) y TDD-CLD-005 |
| Cloud 2.8: trazas | [Operación](#operación-y-observabilidad) y TDD-CLD-007 |
| Cloud 2.9: compatibilidad | [Versionado](#versionado-y-compatibilidad) |

Este documento sigue en `BORRADOR`.

## Referencias y trazabilidad

- ADR y TDD relacionados: [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md), [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-002](../MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md), [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md), [TDD-SW-005](../MAPS-114-assignment-delivery-outbox/TDD-SW-005-assignment-delivery-y-coordinacion-outbox.md); TDD-SW-004 ([PR #27](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/27)); ADR-SW-006 y TDD-SW-006 ([PR #28](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/28)); ADR-CLD-001 ([PR #31](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/31)); ADR-CLD-007 y TDD-CLD-006 ([PR #30](https://github.com/Kondor-Corporate/MAPS-Ecommerce/pull/30)); [ADR-CLD-000](../../../cloud/adr/MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md).
- Fuentes F0/F1/F2: [F1 §3/§4, RF-SOL-01 a 05, RF-ADM-01, RF-PRODUCER-01/02/03, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §3 inventario de pantallas, §6 matriz acción × estado, §13 permisos, §14 handoff](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Estándares: [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457); [RFC 9110 HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (`ETag`, `If-Match`, `412`); [RFC 6585](https://www.rfc-editor.org/rfc/rfc6585) (`428`, `429`); borrador IETF `Idempotency-Key`; OpenAPI 3.1.
- Fila de [traceability.md](../../../traceability.md): contrato API del Portal.
- [Matriz de dependencias](../../../dependency-matrix.md): entrada pública, identidad y adjuntos.
