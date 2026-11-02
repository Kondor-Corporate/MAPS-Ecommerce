## Estructura técnica del proyecto MAPS E-commerce

El proyecto **MAPS E-commerce** se organizará como un sistema web modular orientado a la venta de seguros enlatados. La plataforma deberá permitir que un cliente visualice productos disponibles, consulte coberturas, exclusiones, requisitos y precios, cargue sus datos personales, avance en el proceso de contratación, realice el pago y acceda posteriormente a la póliza correspondiente. Además, el sistema deberá registrar los procesos abandonados o incompletos para que MAPS pueda recuperar comercialmente esos potenciales clientes desde un panel interno.

La estructura propuesta será la de un **monorepo ordenado**, separando claramente la aplicación frontend, la API backend, los paquetes compartidos, la documentación, la configuración de infraestructura y los archivos relacionados con la base de datos.

```txt
maps-ecommerce/
│
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── validators/
│   ├── config/
│   └── emails/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── docs/
│   ├── 00-proyecto/
│   ├── 01-producto/
│   ├── 02-diseno/
│   ├── 03-tecnico/
│   ├── 04-operacion/
│   ├── 05-comercial/
│   └── tdd/
│       └── tdd-example.md
│
├── infra/
│   ├── docker/
│   ├── scripts/
│   └── deployment/
│
├── .github/
│   └── workflows/
│
├── .env.example
├── package.json
├── README.md
└── tsconfig.base.json
```

### Tecnologías principales

El frontend se desarrollará con **React**, preferentemente utilizando **Vite** como herramienta de construcción por su simplicidad, velocidad y bajo costo de configuración inicial. Esta aplicación contendrá tanto la parte pública del e-commerce como el panel administrador interno.

El backend se desarrollará con **Node.js**, **Express** y **TypeScript**, exponiendo una API REST para administrar productos, clientes, contrataciones, pagos, pólizas, potenciales clientes, autenticación, notificaciones y métricas.

Para la persistencia de datos se utilizará **Prisma ORM**, permitiendo modelar las entidades principales del sistema, versionar migraciones y trabajar con una base de datos relacional. La base recomendada para este proyecto será **PostgreSQL**, por su robustez, compatibilidad con Prisma y buena capacidad para manejar relaciones entre clientes, productos, pagos, pólizas y procesos comerciales.

La autenticación será propia del sistema, basada en login con email y contraseña. El backend deberá gestionar registro, inicio de sesión, recuperación de contraseña, roles, permisos y sesiones seguras. Para el MVP se recomienda utilizar JWT con access token y refresh token, junto con contraseñas hasheadas mediante bcrypt o una librería equivalente.

La integración de pagos queda pendiente de definición. El sistema deberá dejar preparada una capa de integración para conectar posteriormente con la pasarela que MAPS defina, por ejemplo Mercado Pago, MODO, transferencia bancaria u otro proveedor. El backend no deberá almacenar datos sensibles de tarjetas, sino delegar el procesamiento del pago en el proveedor externo.

---

### Estructura del frontend

La aplicación frontend estará ubicada dentro de:

```txt
apps/web/
```

Esta aplicación contendrá la experiencia pública del cliente, el flujo de contratación, la sección de pólizas y el panel administrador.

```txt
apps/web/
│
├── src/
│   ├── app/
│   │   ├── routes/
│   │   ├── layouts/
│   │   └── providers/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── catalogo/
│   │   ├── productos/
│   │   ├── checkout/
│   │   ├── pagos/
│   │   ├── polizas/
│   │   ├── potenciales-clientes/
│   │   ├── admin/
│   │   ├── metricas/
│   │   └── notificaciones/
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── common/
│   │   ├── forms/
│   │   ├── cards/
│   │   ├── tables/
│   │   ├── modals/
│   │   └── feedback/
│   │
│   ├── services/
│   │   ├── api-client.ts
│   │   ├── auth.service.ts
│   │   ├── products.service.ts
│   │   ├── checkout.service.ts
│   │   ├── payments.service.ts
│   │   ├── policies.service.ts
│   │   ├── leads.service.ts
│   │   └── metrics.service.ts
│   │
│   ├── hooks/
│   ├── lib/
│   ├── styles/
│   ├── types/
│   └── main.tsx
│
├── public/
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

La estructura por `features` permitirá organizar el frontend por módulos funcionales y no solamente por tipo de archivo. Esto facilita que cada parte del negocio tenga sus propios componentes, servicios, validaciones y lógica de presentación.

Las rutas principales del frontend serán:

```txt
/
├── Página principal
│
├── /productos
│   └── Catálogo de seguros enlatados
│
├── /productos/:slug
│   └── Detalle de producto
│
├── /checkout/:productSlug
│   ├── Carga de datos personales
│   ├── Resumen de contratación
│   ├── Aceptación de términos
│   ├── Pago
│   └── Resultado del proceso
│
├── /login
│   └── Inicio de sesión
│
├── /registro
│   └── Registro de usuario
│
├── /mis-polizas
│   └── Pólizas contratadas por el cliente
│
└── /admin
    ├── Dashboard
    ├── Productos
    ├── Contrataciones
    ├── Clientes
    ├── Potenciales clientes
    ├── Pólizas
    ├── Pagos
    ├── Métricas
    └── Configuración
```

El panel administrador se incluirá dentro del mismo frontend del e-commerce durante el MVP. Esta decisión reduce complejidad inicial, evita duplicar configuraciones y permite que el equipo trabaje sobre una única aplicación web. El acceso al panel deberá estar protegido por autenticación y roles.

---

### Estructura del backend

La API backend estará ubicada dentro de:

```txt
apps/api/
```

Se desarrollará con Node.js, Express y TypeScript. Su responsabilidad será exponer los endpoints necesarios para el funcionamiento del e-commerce, administrar la lógica de negocio y comunicarse con la base de datos mediante Prisma.

```txt
apps/api/
│
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── customers/
│   │   ├── checkout/
│   │   ├── contracts/
│   │   ├── payments/
│   │   ├── policies/
│   │   ├── leads/
│   │   ├── producers/
│   │   ├── notifications/
│   │   ├── metrics/
│   │   └── audit/
│   │
│   ├── common/
│   │   ├── middlewares/
│   │   ├── guards/
│   │   ├── errors/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── types/
│   │
│   ├── config/
│   │   ├── env.ts
│   │   ├── database.ts
│   │   ├── auth.ts
│   │   ├── cors.ts
│   │   └── payments.ts
│   │
│   ├── database/
│   │   └── prisma.ts
│   │
│   ├── integrations/
│   │   ├── payment-gateway/
│   │   ├── email-provider/
│   │   ├── storage-provider/
│   │   └── maps-internal/
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
├── package.json
└── tsconfig.json
```

Cada módulo del backend deberá tener una estructura interna similar:

```txt
products/
├── products.routes.ts
├── products.controller.ts
├── products.service.ts
├── products.repository.ts
├── products.dto.ts
├── products.validation.ts
└── products.types.ts
```

Esta separación permite distinguir responsabilidades:

* `routes`: define las rutas HTTP.
* `controller`: recibe la request y devuelve la response.
* `service`: contiene la lógica de negocio.
* `repository`: accede a la base de datos mediante Prisma.
* `dto`: define estructuras de entrada y salida.
* `validation`: valida los datos recibidos.
* `types`: define tipos específicos del módulo.

---

### Módulos principales del backend

El backend se organizará en los siguientes módulos:

```txt
auth
users
roles
products
categories
customers
checkout
contracts
payments
policies
leads
producers
notifications
metrics
audit
```

El módulo `auth` gestionará login, registro, recuperación de contraseña, refresh token y protección de rutas privadas.

El módulo `users` gestionará los usuarios internos y externos del sistema.

El módulo `roles` permitirá diferenciar permisos entre cliente, administrador, productor y otros perfiles que MAPS pueda necesitar.

El módulo `products` administrará los seguros enlatados: nombre, descripción, precio, coberturas, exclusiones, requisitos, estado y condiciones comerciales.

El módulo `categories` permitirá clasificar los seguros por tipo o grupo comercial.

El módulo `customers` almacenará los datos de clientes e interesados.

El módulo `checkout` gestionará los intentos de contratación, permitiendo guardar datos de manera temprana antes de que el cliente pague.

El módulo `contracts` representará las contrataciones generadas a partir de un checkout exitoso.

El módulo `payments` centralizará la integración con la futura pasarela de pago.

El módulo `policies` permitirá cargar, enviar, consultar o disponibilizar pólizas.

El módulo `leads` gestionará potenciales clientes, abandonos de checkout, solicitudes de contacto y oportunidades comerciales.

El módulo `producers` permitirá asignar potenciales clientes a productores o responsables comerciales.

El módulo `notifications` gestionará emails o avisos internos asociados a contrataciones, pagos, pólizas y leads.

El módulo `metrics` registrará eventos básicos del comportamiento comercial.

El módulo `audit` permitirá registrar acciones administrativas relevantes, especialmente cambios en productos, pólizas, pagos, usuarios y contrataciones.

---

### Estructura de Prisma

La carpeta `prisma` contendrá el esquema de datos, las migraciones y los datos iniciales del sistema.

```txt
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

Las entidades iniciales recomendadas son:

```txt
User
Role
Customer
Product
Category
Coverage
Exclusion
Requirement
CheckoutSession
Contract
Payment
Policy
Lead
Producer
Notification
MetricEvent
AuditLog
```

El modelo de datos deberá contemplar como mínimo:

* Productos enlatados.
* Categorías de productos.
* Coberturas.
* Exclusiones.
* Requisitos.
* Clientes.
* Usuarios.
* Roles.
* Sesiones de checkout.
* Contrataciones.
* Pagos.
* Pólizas.
* Potenciales clientes.
* Productores.
* Notificaciones.
* Eventos de métricas.
* Auditoría de acciones administrativas.

Una estructura conceptual inicial sería:

```txt
Product
├── Category
├── Coverages
├── Exclusions
├── Requirements
├── Price
├── Payment type
└── Status

Customer
├── Personal data
├── Contact data
└── Location

CheckoutSession
├── Customer
├── Product
├── Current step
├── Status
├── Started at
├── Abandoned at
└── Completed at

Contract
├── Customer
├── Product
├── Payment
├── Policy
└── Status

Lead
├── Customer
├── Product of interest
├── Checkout session
├── Origin
├── Status
├── Assigned producer
└── Notes
```

---

### Paquetes compartidos

La carpeta `packages` contendrá código reutilizable por frontend y backend.

```txt
packages/
│
├── ui/
│   └── Componentes visuales reutilizables
│
├── types/
│   └── Tipos TypeScript compartidos
│
├── validators/
│   └── Esquemas de validación comunes
│
├── config/
│   └── Configuraciones compartidas
│
└── emails/
    └── Templates de emails transaccionales
```

El paquete `types` permitirá compartir definiciones como `Product`, `Customer`, `CheckoutStatus`, `PaymentStatus`, `PolicyStatus` y `LeadStatus`.

El paquete `validators` permitirá centralizar validaciones comunes para evitar inconsistencias entre frontend y backend. Por ejemplo, validaciones de email, teléfono, DNI, CUIT, datos personales, aceptación de términos y formularios de checkout.

El paquete `emails` permitirá definir plantillas para:

* Confirmación de inicio de contratación.
* Confirmación de pago.
* Aviso de pago rechazado.
* Aviso de póliza disponible.
* Notificación interna de nueva contratación.
* Notificación interna de potencial cliente.
* Notificación interna de solicitud de contacto con productor.

---

### Rutas principales de la API

La API expondrá endpoints organizados por módulo.

```txt
/api/auth
/api/users
/api/roles
/api/products
/api/categories
/api/customers
/api/checkout
/api/contracts
/api/payments
/api/policies
/api/leads
/api/producers
/api/notifications
/api/metrics
/api/audit
```

Endpoints iniciales sugeridos:

```txt
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh-token
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/products
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id

GET    /api/categories
POST   /api/categories
PATCH  /api/categories/:id

POST   /api/checkout/start
PATCH  /api/checkout/:id/customer-data
PATCH  /api/checkout/:id/accept-terms
POST   /api/checkout/:id/start-payment
GET    /api/checkout/:id

POST   /api/payments/webhook
GET    /api/payments/:id

GET    /api/contracts
GET    /api/contracts/:id
PATCH  /api/contracts/:id/status

GET    /api/policies
POST   /api/policies/upload
GET    /api/policies/:id
PATCH  /api/policies/:id/status

GET    /api/leads
GET    /api/leads/:id
PATCH  /api/leads/:id/status
PATCH  /api/leads/:id/assign-producer

GET    /api/metrics/dashboard
POST   /api/metrics/events
```

---

### Panel administrador

El panel administrador estará integrado dentro del mismo frontend y consumirá la misma API backend. Su acceso estará restringido por autenticación y roles.

Las secciones iniciales del panel serán:

```txt
/admin
├── Dashboard
├── Productos
├── Categorías
├── Contrataciones
├── Clientes
├── Potenciales clientes
├── Productores
├── Pólizas
├── Pagos
├── Métricas
├── Usuarios
└── Configuración
```

Desde el panel administrador, MAPS deberá poder:

* Crear seguros enlatados.
* Editar seguros existentes.
* Activar o desactivar productos.
* Cargar precios.
* Cargar coberturas.
* Cargar exclusiones.
* Cargar requisitos.
* Ver clientes registrados.
* Ver procesos de contratación iniciados.
* Ver procesos abandonados.
* Ver pagos aprobados, pendientes o rechazados.
* Cargar pólizas.
* Enviar o disponibilizar pólizas.
* Ver potenciales clientes.
* Asignar leads a productores.
* Consultar métricas básicas.
* Administrar usuarios internos.

---

### Autenticación y permisos

El sistema utilizará autenticación propia con email y contraseña.

Se recomienda implementar los siguientes roles iniciales:

```txt
CLIENT
ADMIN
PRODUCER
SUPER_ADMIN
```

El rol `CLIENT` podrá acceder a sus datos, contrataciones y pólizas.

El rol `ADMIN` podrá gestionar productos, contrataciones, clientes, leads, pagos y pólizas.

El rol `PRODUCER` podrá acceder a potenciales clientes asignados y registrar seguimiento comercial.

El rol `SUPER_ADMIN` tendrá permisos completos sobre el sistema, usuarios, configuración y auditoría.

Las contraseñas deberán almacenarse hasheadas. El sistema deberá implementar protección de rutas, expiración de sesión, refresh token y validaciones básicas de seguridad.

---

### Integración de pagos

La integración de pagos queda pendiente de definición por parte de MAPS.

De todas formas, el sistema deberá prepararse para trabajar con una capa desacoplada de pagos:

```txt
integrations/
└── payment-gateway/
    ├── payment-provider.interface.ts
    ├── payment.service.ts
    ├── payment-webhook.handler.ts
    └── providers/
        ├── mercado-pago.provider.ts
        ├── modo.provider.ts
        └── manual-transfer.provider.ts
```

Esta estructura permitirá definir más adelante el proveedor definitivo sin afectar toda la lógica del checkout.

El sistema deberá contemplar los siguientes estados de pago:

```txt
PENDING
APPROVED
REJECTED
CANCELLED
REFUNDED
```

También deberá estar preparado para registrar si el pago será único, recurrente mensual o definido por producto.

---

### Gestión de pólizas

La emisión de pólizas podrá resolverse inicialmente de manera manual desde el panel administrador. El administrador o responsable operativo podrá cargar el archivo correspondiente y dejarlo disponible para el cliente.

Estados sugeridos para pólizas:

```txt
PENDING
UPLOADED
SENT
CANCELLED
```

Flujo inicial recomendado:

```txt
Pago aprobado
↓
Contratación creada
↓
Póliza pendiente de emisión
↓
Administrador carga archivo
↓
Sistema notifica al cliente
↓
Cliente accede desde Mis pólizas
```

---

### Potenciales clientes y abandonos

El sistema deberá guardar información del cliente antes de que el pago se complete. Esto permite que, si una persona inicia el proceso pero no finaliza la contratación, MAPS pueda recuperar esa oportunidad comercial.

Estados sugeridos para leads:

```txt
NEW
TO_CONTACT
CONTACTED
INTERESTED
NOT_RESPONDING
RECOVERED
DISCARDED
PAYMENT_FAILED
CHECKOUT_ABANDONED
PRODUCER_REQUESTED
```

Un lead podrá generarse por:

* Abandono del checkout.
* Solicitud de contacto con productor.
* Pago rechazado.
* Formulario de interés.
* Inicio de contratación incompleto.

---

### Métricas básicas

El MVP deberá contemplar métricas simples para entender el comportamiento comercial del e-commerce.

Métricas iniciales:

```txt
Productos más vistos
Productos más contratados
Cantidad de procesos iniciados
Cantidad de procesos abandonados
Cantidad de pagos aprobados
Cantidad de pagos rechazados
Cantidad de solicitudes de productor
Cantidad de leads generados
Tasa de conversión básica
```

Estas métricas podrán registrarse mediante eventos simples:

```txt
PRODUCT_VIEWED
CHECKOUT_STARTED
CUSTOMER_DATA_COMPLETED
TERMS_ACCEPTED
PAYMENT_STARTED
PAYMENT_APPROVED
PAYMENT_REJECTED
CHECKOUT_ABANDONED
LEAD_CREATED
POLICY_UPLOADED
```

---

### Documentación del proyecto

La documentación se organizará dentro de la carpeta `docs`.

```txt
docs/
├── 00-proyecto/
│   ├── alcance-mvp.md
│   ├── decisiones.md
│   ├── riesgos.md
│   └── minutas.md
│
├── 01-producto/
│   ├── seguros-enlatados.md
│   ├── coberturas.md
│   ├── exclusiones.md
│   ├── requisitos.md
│   └── textos-legales.md
│
├── 02-diseno/
│   ├── flujos-ux.md
│   ├── wireframes.md
│   └── branding.md
│
├── 03-tecnico/
│   ├── arquitectura.md
│   ├── api.md
│   ├── modelo-datos.md
│   ├── seguridad.md
│   └── deploy.md
│
├── 04-operacion/
│   ├── manual-admin.md
│   ├── gestion-polizas.md
│   ├── gestion-pagos.md
│   └── runbook-errores.md
│
├── 05-comercial/
│   ├── potenciales-clientes.md
│   ├── productores.md
│   ├── estados-comerciales.md
│   └── metricas.md
│
└── tdd/
    └── tdd-example.md
```

La carpeta `tdd/` contendrá los Technical Design Documents: uno por cada feature o decisión técnica relevante que requiera diseño previo antes de implementarse.

---

### Ambientes del proyecto

El proyecto deberá contemplar al menos dos ambientes:

```txt
staging
production
```

El ambiente `staging` se utilizará para pruebas internas, validación funcional y revisión con MAPS antes de publicar cambios.

El ambiente `production` será el entorno real utilizado por clientes y administradores.

También se recomienda contar con configuración local para desarrollo:

```txt
local
staging
production
```

Cada ambiente deberá tener sus propias variables de entorno.

```txt
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
FRONTEND_URL=
API_URL=
EMAIL_PROVIDER_API_KEY=
PAYMENT_PROVIDER_API_KEY=
STORAGE_PROVIDER_API_KEY=
```

---

### Seguridad mínima

El sistema deberá contemplar medidas básicas de seguridad desde el inicio:

* Login propio con email y contraseña.
* Contraseñas hasheadas.
* Roles y permisos.
* Validación de formularios.
* Protección de rutas privadas.
* Manejo seguro de tokens.
* No almacenamiento de datos sensibles de tarjetas.
* Uso de proveedor externo para pagos.
* Separación de ambientes.
* Variables de entorno.
* Logs básicos.
* Registro de acciones administrativas.
* Backups de base de datos.
* Revisión de accesos antes del lanzamiento.

---

### Organización de ramas

La estrategia de ramas será simple y orientada a historias de usuario.

```txt
main
develop
feature/HU-001-catalogo-productos
feature/HU-002-detalle-producto
feature/HU-003-checkout-datos-cliente
feature/HU-004-leads-abandono
feature/HU-005-admin-productos
fix/correccion-validacion-dni
hotfix/error-webhook-pagos
release/v1-mvp
```

El desarrollo y las pruebas asociadas a una historia de usuario deberán realizarse dentro de la misma rama `feature`.

Ejemplo:

```txt
feature/HU-003-checkout-datos-cliente
```

Dentro de esa rama se desarrollará la funcionalidad, sus validaciones, sus pruebas y la integración correspondiente.

---

### Resumen de decisión técnica

El proyecto MAPS E-commerce se construirá como un monorepo ordenado, con una aplicación frontend en React, una API backend en Node.js, Express y TypeScript, Prisma como ORM y PostgreSQL como base de datos recomendada.

La aplicación frontend incluirá tanto el sitio público como el panel administrador. La API backend expondrá los servicios necesarios para productos, clientes, checkout, pagos, pólizas, leads, usuarios, roles, métricas y auditoría.

El sistema tendrá login propio, roles diferenciados y una arquitectura preparada para integrar más adelante la pasarela de pagos que MAPS defina. La prioridad del MVP será permitir la publicación de seguros enlatados, la contratación online, el registro temprano de datos, la gestión de pólizas, el rescate de potenciales clientes y la administración básica del negocio desde un panel interno.


