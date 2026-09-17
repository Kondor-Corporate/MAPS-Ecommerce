# Fase 2 — Design Handoff

> **Estado:** Primera versión para revisión interna / propuesta para revisión interna.  
> **Baseline:** Fase 0 y Fase 1 vigentes; el prototipo standalone es referencia visual e interactiva.  
> **Propósito:** especificar cómo se experimenta el Portal de Solicitudes sin definir su implementación técnica.

## 1. Objetivo y alcance de F2

F2 transforma el contrato funcional vigente en una especificación UX revisable: pantallas, navegación, journeys, permisos, validaciones, errores y comportamiento visible. No define stack, base de datos, APIs, arquitectura, proveedor de autenticación/email, object storage ni persistencia.

El producto es un Portal de Solicitudes de Seguros, no un e-commerce. Se mantienen fuera del MVP checkout, pagos, contratación o emisión automática, cotizador, simulador, Leads/Potenciales clientes, Recovery, Intranet, PostgreSQL MAPS como dependencia, Portal del Asegurado, pólizas, PDF y builder universal de formularios.

## 2. Principios UX que hereda F2

- Los únicos estados funcionales de `InsuranceRequest` son **BORRADOR**, **ENVIADA**, **ASIGNADA**, **DERIVADA** y **CANCELADA**.
- Los estados de entrega/email son técnicos y se muestran como incidencia o trazabilidad; no agregan estados a la solicitud.
- El Productor accede con cuenta autenticada, únicamente a solicitudes autorizadas y en modo read-only.
- Todo Product publicado tiene precio fijo. Un BORRADOR con precio desactualizado exige aviso y reconfirmación antes de enviar; ENVIADA conserva su precio confirmado.
- La `FormVersion` publicada es inmutable y un BORRADOR conserva la versión con la que comenzó.
- La autogestión del perfil del Cliente es distinta del ABM de Clientes del Admin.

## 3. Inventario de pantallas

| ID | Pantalla | Actor | Objetivo | Entrada / salida | Prototipo | Prioridad |
| --- | --- | --- | --- | --- | --- | --- |
| PUB-01 | Catálogo | Público | Explorar Products publicados | Inicio → detalle/login | Presente | MVP |
| PUB-02 | Detalle Product | Público | Comprender producto y precio | Catálogo → login/registro o solicitud | Presente | MVP |
| PUB-03 | Login | Público | Autenticarse | Guardas → destino solicitado | Presente | MVP |
| PUB-04 | Registro | Público | Crear cuenta | Guardas → BORRADOR/destino | Presente | MVP |
| PUB-05 | Recuperar contraseña | Público | Recuperar acceso | Login → confirmación | Parcial | MVP |
| CLI-01 | Catálogo autenticado | Cliente | Iniciar una solicitud | Catálogo → detalle/formulario | Presente | MVP |
| CLI-02 | Mi perfil | Cliente | Consultar y editar datos habilitados | Menú → guardar/volver | Presente | MVP |
| CLI-03 | Formulario de solicitud | Cliente | Completar y guardar BORRADOR | Detalle/retomar → revisión | Presente | MVP |
| CLI-04 | Revisión y precio | Cliente | Validar datos, consentimiento y precio | Formulario → envío o volver | Presente | MVP |
| CLI-05 | Confirmación de envío | Cliente | Confirmar ENVIADA | Envío → Mis solicitudes/detalle | Presente | MVP |
| CLI-06 | Mis solicitudes | Cliente | Consultar solicitudes propias | Menú → detalle/retomar | Presente | MVP |
| CLI-07 | Detalle solicitud | Cliente | Ver estado y acciones permitidas | Lista → lista/cancelación | Presente | MVP |
| CLI-08 | Solicitud de cancelación DERIVADA | Cliente | Pedir revisión a MAPS | Detalle → detalle DERIVADA | Presente | MVP |
| ADM-01 | Bandeja de solicitudes | Admin | Priorizar y filtrar operación | Sesión → detalle | Presente | MVP |
| ADM-02 | Detalle solicitud | Admin | Gestionar solicitud y trazabilidad | Bandeja → bandeja/acciones | Presente | MVP |
| ADM-03 | Asignación/reasignación | Admin | Seleccionar Productor habilitado | Detalle → ASIGNADA | Presente | MVP |
| ADM-04 | Incidencia de derivación | Admin | Ver fallo y reintentar/reasignar | Detalle ASIGNADA → detalle | Presente | MVP |
| ADM-05 | Solicitud de cancelación | Admin | Confirmar o rechazar pedido DERIVADA | Detalle → DERIVADA/CANCELADA | Presente | MVP |
| ADM-06 | Categorías | Admin | Administrar categorías | Backoffice → guardar/lista | Presente | MVP |
| ADM-07 | Productos | Admin | Administrar Product y precio | Backoffice → formularios/lista | Presente | MVP |
| ADM-08 | Formularios | Admin | Editar borrador por Product | Producto → versiones/publicar | Presente | MVP |
| ADM-09 | Versiones | Admin | Consultar publicada e histórico | Formularios → formulario | Parcial | MVP |
| ADM-10 | Clientes | Admin | ABM y consulta de clientes | Backoffice → detalle/lista | Presente | MVP |
| ADM-11 | Productores | Admin | ABM y disponibilidad | Backoffice → lista | Presente | MVP |
| PRO-01 | Login | Productor | Acceder con cuenta propia | Guarda → Mis solicitudes | Presente | MVP |
| PRO-02 | Mis solicitudes | Productor | Consultar asignadas | Sesión → detalle read-only | Presente | MVP |
| PRO-03 | Detalle read-only | Productor | Consultar expediente autorizado | Lista → lista | Presente | MVP |

`ADM-09` es parcial porque el prototipo muestra borrador/publicada, pero la revisión de histórico y sus estados UX requiere validación de equipo. `PUB-05` es MVP por dependencia del login, sin definir el mecanismo técnico.

## 4. Sitemap conceptual

```text
Público
Inicio
├── Catálogo
│   └── Detalle producto
├── Login
├── Registro
└── Recuperar contraseña

Cliente
Portal cliente
├── Catálogo
├── Mis solicitudes
│   └── Detalle solicitud
├── Mi perfil
└── Cerrar sesión

Admin
Backoffice
├── Solicitudes
│   └── Detalle
├── Categorías
├── Productos
│   └── Formularios
│       └── Versiones
├── Clientes
├── Productores
└── Sesión/perfil

Productor
Portal productor
├── Mis solicitudes
│   └── Detalle read-only
└── Sesión/perfil
```

Es arquitectura de información; no prescribe rutas HTTP.

## 5. Journeys operativos

### Cliente — nueva solicitud y retoma

```text
Catálogo → Detalle Product → Login/Registro → crear BORRADOR
→ formulario → guardar / retomar → revisión → validar precio
→ reconfirmar si cambió → enviar → ENVIADA → confirmación → Mis solicitudes

Mis solicitudes → BORRADOR → misma FormVersion → continuar → revisión → confirmar precio → enviar
```

El BORRADOR es editable y recuperable. Si su versión fue retirada, se informa que no puede continuar y se inicia con la vigente; reutilización de datos compatibles queda para F3.

### Cliente — descartar BORRADOR

```text
BORRADOR → descartar → confirmar → deja de estar disponible
```

No pide motivo obligatorio y no cambia a `CANCELADA`.

### Admin — asignar y derivar

```text
ENVIADA → seleccionar Productor → ASIGNADA → intento de derivación/email

éxito: ASIGNADA → DERIVADA
fallo: ASIGNADA → incidencia visible → reintentar o reasignar
```

El fallo no crea `email_failed` ni otro estado de `InsuranceRequest`.

### Cancelaciones

```text
ENVIADA → Cliente cancela → CANCELADA → aviso Admin
ASIGNADA → Cliente cancela → CANCELADA → aviso Admin + Productor → revocar acceso
DERIVADA → Cliente solicita cancelación → Admin revisa
  ├── aprueba → CANCELADA → aviso Productor → revocar acceso
  └── rechaza → permanece DERIVADA → informar Cliente
```

## 6. Matriz acción × estado

| Estado | Cliente | Admin | Productor |
| --- | --- | --- | --- |
| BORRADOR | Editar, guardar, retomar, descartar | — | — |
| ENVIADA | Ver, cancelar | Ver, asignar | — |
| ASIGNADA | Ver, cancelar | Ver, reasignar, reintentar derivación | Ver sólo si está autorizado; acceso se revoca al cancelar |
| DERIVADA | Ver, solicitar cancelación | Ver, aprobar/rechazar cancelación | Ver read-only |
| CANCELADA | Ver | Ver | Sin acceso operativo |

## 7. Matriz detallada de pantallas

Estados generales aplicables: loading, empty, error, unauthorized y forbidden. Todo dato sensible se limita al actor autorizado; el detalle exacto de autorización, fuente y persistencia corresponde a F3.

| Pantalla | Datos y objetivo | Acciones / validaciones | Precondiciones, permisos y navegación | Estados / errores | Trazabilidad F1 y pendiente F3 |
| --- | --- | --- | --- | --- | --- |
| PUB-01 / CLI-01 Catálogo | Products publicados, categoría, precio fijo y disponibilidad | Buscar/filtrar, abrir detalle | Público o Cliente; entrada inicio, salida detalle | Loading, vacío, error, no disponible | RF-PROD-01, RN-09; fuente y consulta F3 |
| PUB-02 Detalle | Información comercial, precio vigente y CTA | Iniciar solicitud; CTA exige login antes de crear BORRADOR | Product publicado; salida login/registro o formulario | Producto no disponible, precio actualizado | RN-02, RN-09; disponibilidad F3 |
| PUB-03/04/05 Acceso | Login, registro y recuperación | Validar campos, mostrar error, volver al destino solicitado | Público; no mostrar sesión ajena | Inválido, credenciales erróneas, recuperación solicitada | RN-02, RN-17; auth y recuperación F3 |
| CLI-02 Perfil | Datos habilitados de Cliente | Editar, validar inline, guardar, feedback éxito/error | Cliente autenticado; menú → volver | Loading, inválido, guardando, éxito, error, forbidden | RF-CLI-PROFILE-01, RN-17; campos no editables y sincronización F3 |
| CLI-03 Formulario | Product, FormVersion, pasos, progreso, campos y adjuntos | Avanzar/volver, validación inline, guardar BORRADOR, descartar | Cliente, Product disponible; salida revisión o Mis solicitudes | Loading, guardado, error guardado, inválido, versión retirada | RF-SOL-01/02, RF-FORM-01, RN-03/08; contrato y storage F3 |
| CLI-04 Revisión | Resumen de respuestas, consentimientos, precio actual o aviso de cambio | Volver, confirmar precio nuevo, enviar | BORRADOR válido; no enviar sin reconfirmar precio cambiado | Incompleto, precio actualizado, error envío | RF-SOL-04, RN-09; snapshot F3 |
| CLI-05 Confirmación | Número, Product, fecha y estado ENVIADA | Ir a Mis solicitudes/detalle | Envío exitoso; no declara derivación | Error de confirmación recuperable | RF-SOL-01/03; entrega de datos F3 |
| CLI-06 Mis solicitudes | Solicitudes propias, Product, fecha, estado y filtros | Abrir, retomar BORRADOR | Cliente autenticado; menú → detalle/formulario | Loading, vacío, error, forbidden | RF-SOL-03, RN-05; consulta F3 |
| CLI-07 Detalle | Estado, precio confirmado cuando corresponda, historial y acciones permitidas | Retomar, descartar, cancelar o solicitar cancelación según estado | Propietario autenticado; lista → lista/cancelación | No encontrada, forbidden, CANCELADA read-only | RF-SOL-05, RN-10; auditoría F3 |
| CLI-08 Cancelación DERIVADA | Contexto, motivo y resultado de decisión si existe | Enviar solicitud con motivo; ver aprobada/rechazada | DERIVADA propia; detalle → detalle | Motivo requerido, ya solicitada, error | RF-SOL-05, RN-10; trazabilidad/notificación F3 |
| ADM-01 Bandeja | Solicitudes, estado, Product, cliente, filtros y paginado | Buscar, filtrar, abrir detalle | Admin autenticado; backoffice → detalle | Loading, vacío, error, forbidden | RF-ADM-01; consulta/paginado F3 |
| ADM-02 Detalle | Expediente autorizado, Product, historial, Productor y entrega | Abrir asignación, reintentar, reasignar, decidir cancelación | Admin; bandeja → bandeja/acciones | No encontrada, error, forbidden | RF-ADM-01, RF-DELIVERY-01; auditoría F3 |
| ADM-03 Asignación | Productores habilitados y asignación actual | Seleccionar, confirmar, reasignar | ENVIADA/ASIGNADA; no asignar inhabilitado | Sin productores, inválido, error | RN-04, RN-15; reglas de disponibilidad F3 |
| ADM-04 Incidencia derivación | Productor, último intento, resultado/error conocido | Reintentar o reasignar | ASIGNADA; volver al detalle | Procesando, fallida, reintento, error | RN-06/07, RF-DELIVERY-01; delivery técnico F3 |
| ADM-05 Cancelación DERIVADA | Motivo, fecha y solicitante | Confirmar o rechazar; feedback trazable | DERIVADA con solicitud; detalle → DERIVADA/CANCELADA | Sin solicitud, error, acción ya resuelta | RN-10, RF-SOL-05; notificación F3 |
| ADM-06 Categorías | Nombre, estado y asociación visible | Crear, editar, renombrar | Admin; backoffice → lista | Vacío, inválido, conflicto de uso, error | RF-CAT-01, RN-13; persistencia F3 |
| ADM-07 Productos | Información comercial, categoría, precio y publicación | Crear/editar, precio, publicar, abrir formularios | Admin; backoffice → formularios | Inválido, precio requerido, error | RF-PROD-01, RN-09; Product F3 |
| ADM-08 Formularios | Campos candidatos, borrador y versión publicada | Editar DRAFT, validar, publicar | Admin y Product seleccionado; producto → versiones | Sin campos, inválido, sin cambios, error | RF-FORM-01, RN-08; schema F3 |
| ADM-09 Versiones | Versión publicada e histórico disponible | Consultar; crear nueva desde flujo de formulario | Admin; formularios → formulario | Vacío, error | RN-08; no incluye rollback/diff/restore MVP |
| ADM-10 Clientes | Cliente y solicitudes asociadas autorizadas | Alta, edición, baja, buscar, abrir detalle | Admin; backoffice → lista/detalle | Vacío, inválido, error | RF-CLI-01, RN-14; modelo F3 |
| ADM-11 Productores | Datos, disponibilidad y asignaciones | Alta, edición, baja, habilitar/inhabilitar | Admin; backoffice → lista | Vacío, inválido, no eliminable si corresponde, error | RF-PRODUCER-03, RN-15; modelo F3 |
| PRO-01 Login | Acceso de Productor | Autenticarse y salir a Mis solicitudes | Productor; guarda → lista | Credenciales inválidas, unauthorized | RN-05/16; auth F3 |
| PRO-02 Mis solicitudes | Solicitudes asignadas y estado | Abrir detalle | Productor autenticado; menú → detalle | Loading, vacío, error, forbidden | RF-PRODUCER-01, RN-05/16; autorización F3 |
| PRO-03 Detalle read-only | Expediente autorizado y avisos relevantes | Volver; no editar ni cancelar | Solicitud asignada y acceso vigente | Forbidden/revocado, no encontrada, error | RF-PRODUCER-01/02, RN-05/16; RBAC/auditoría F3 |

## 8. Estados UX específicos

| Área | Estados UX | Regla de presentación |
| --- | --- | --- |
| Producto | Publicado, no disponible, precio actualizado | No iniciar sobre producto no disponible; mostrar precio vigente sin cálculo personalizado. |
| Formulario | Loading, guardado, error de guardado, inválido, versión retirada, cambio de precio | Errores inline; conservar progreso cuando sea posible; versión retirada impide continuar con esa versión. |
| Solicitud | BORRADOR, ENVIADA, ASIGNADA, DERIVADA, CANCELADA | Mostrar estado funcional y acciones permitidas, sin sexto estado. |
| Derivación | Procesando, exitosa, fallida, reintento | Es trazabilidad/incidencia de entrega, no estado de `InsuranceRequest`. |
| Cancelación | Disponible, solicitada, aprobada, rechazada, cancelada | “Solicitada”, “aprobada” y “rechazada” son situación/resultados asociados al expediente; no agregan estados funcionales. |

## 9. Formulario dinámico — UX contract

- La experiencia usa secciones o pasos, progreso, navegación avanzar/volver, requeridos/opcionales, validación inline, adjuntos, guardado, retoma y revisión final.
- Guardar conserva el BORRADOR y su `FormVersion`; retomar restituye esa versión sin que el Cliente pueda elegir otra.
- Antes de enviar se revisan datos, consentimiento aplicable y precio. Un cambio de precio exige aviso explícito, nuevo valor visible y reconfirmación.
- Ante error de guardado/envío, se informa el problema y se conserva el contexto visible; la estrategia de recuperación es F3.
- **Los tipos exactos y propiedades definitivas permanecen sujetos a validación F1 con 1–2 formularios reales.** Los candidatos actuales son `text`, `number`, `date`, `select`, `radio`, `checkbox`, `textarea` y `file`.

## 10. Versionado y precio — UX MVP

### Versionado

```text
Versión publicada → crear nueva versión → DRAFT → editar → publicar
```

La publicada es inmutable, el histórico se conserva y el Cliente no selecciona versiones. Quedan fuera rollback, restore, diff, branching y comparación de versiones.

### Precio

Admin visualiza, edita y publica el precio fijo. Cliente visualiza el precio vigente; al retomar un BORRADOR con precio viejo recibe aviso, ve el nuevo valor y debe reconfirmarlo. Desde ENVIADA se muestra el precio histórico confirmado cuando corresponda, no el precio vigente que lo haya reemplazado.

## 11. Perfil de Cliente

**Mi perfil** permite consultar y actualizar sólo los datos habilitados para autogestión básica. La pantalla define datos visibles/editables, validación inline, guardar, confirmación de éxito y error; no presume verificación de identidad, cambio complejo de email, MFA ni reglas de propagación a solicitudes históricas.

La autogestión del Cliente no reemplaza el ABM de Clientes del Admin.

## 12. Incidencia de derivación y cancelación

Ante fallo de email/derivación, la solicitud **permanece ASIGNADA**. Admin visualiza Productor asignado, último intento, error conocido y acciones de reintento o reasignación. Sólo una entrega requerida exitosa habilita `ASIGNADA → DERIVADA`.

En cancelación, BORRADOR se descarta sin motivo obligatorio; ENVIADA y ASIGNADA se cancelan directamente; DERIVADA exige solicitud con motivo y revisión de Admin. `CANCELADA` es final y read-only. El Productor no cancela desde el Portal.

## 13. Matriz de permisos UX

| Capacidad | Público | Cliente | Admin | Productor |
| --- | --- | --- | --- | --- |
| Ver catálogo/detalle | Sí | Sí | Sí | Sí |
| Crear solicitud / editar BORRADOR | No | Propia | No | No |
| Ver solicitudes propias | No | Sí | Operación autorizada | Sólo asignadas |
| Editar perfil básico | No | Sí | Sesión/perfil propio | Sesión/perfil propio |
| Cancelar ENVIADA/ASIGNADA | No | Propia | No como flujo de Cliente | No |
| Solicitar cancelación DERIVADA | No | Propia | No | No |
| Asignar, reasignar, reintentar | No | No | Sí | No |
| Confirmar/rechazar cancelación | No | No | Sí | No |
| Administrar Category/Product/FormVersion/Customer/Producer | No | No | Sí | No |
| Ver expediente asignado | No | Propio | Sí | Read-only autorizado |

Esta matriz expresa permisos UX; RBAC técnico y enforcement quedan en F3.

## 14. Handoff F2 → F3

### F2 entrega a F3

- Actores, inventario de pantallas, sitemap y navegación.
- Journeys, lifecycle visible, acciones por estado y matriz de permisos.
- Validaciones, errores, estados UX, formulario dinámico, versionado y precio.
- Autogestión de perfil, cancelaciones e incidencia de derivación.

### F2 no decide

- Stack, framework, DB, schema físico, endpoints, APIs ni transacciones.
- Proveedor de auth, sesiones/JWT, email, retries/queues, storage o analytics.
- Modelo técnico de versionado, persistencia, auditoría o integraciones.

## 15. Gate de salida de F2

Esta primera versión no declara F2 cerrada. Para cierre requiere:

- [x] Inventario, sitemap, journeys y matriz acción × estado.
- [x] Matriz de pantallas, estados UX, permisos y handoff F3.
- [x] Contrato UX de formulario, versionado, precio, perfil, derivación y cancelación.
- [ ] Validación del contrato dinámico con 1–2 formularios reales.
- [ ] Revisión interna del equipo y validación visual/funcional de MAPS sobre el prototipo.
- [ ] Confirmación de que no quedan decisiones de negocio abiertas ocultas en UX.

## 16. Trazabilidad y observaciones

Las referencias rectoras de este handoff son RN-02 a RN-10, RN-13 a RN-17; RF-SOL-01 a RF-SOL-05, RF-FORM-01, RF-PROD-01, RF-CAT-01, RF-CLI-01, RF-CLI-PROFILE-01, RF-ADM-01, RF-PRODUCER-01 a RF-PRODUCER-03, RF-DELIVERY-01 y RNF-SEC-01/RNF-COM-01 de Fase 1.

No se detectaron contradicciones funcionales sin resolver durante esta primera versión. Las definiciones pendientes se mantienen explícitas: validación del contrato de formulario con MAPS y decisiones técnicas propias de F3.
