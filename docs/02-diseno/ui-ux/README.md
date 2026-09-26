# Documentación UI/UX

## Propósito

Esta carpeta contiene prototipos y materiales de referencia para validar la experiencia de usuario del Portal de Seguros MAPS antes de su implementación.

## Prototipo incluido

- [Prototipo standalone del Portal de Seguros MAPS](./prototipos/maps-seguros-portal-standalone.html)
- [Fase 2 — Design Handoff](../Fase_2__Design_Handoff.md)

El prototipo está alineado con la baseline funcional vigente (Fase 0), el Discovery (Fase 1) y el Design Handoff (Fase 2): es un **Portal de Solicitudes**, no un e-commerce. Permite recorrer, con datos de demostración, las áreas del MVP.

**Cliente**

- autenticación, registro y recuperación de contraseña; el catálogo es público y el login se exige antes de crear un borrador;
- catálogo y detalle de productos con precio fijo vigente; un producto sin versión de formulario utilizable se muestra como no disponible y no admite nuevas solicitudes;
- inicio, carga, revisión y envío de solicitudes, con formulario dinámico por producto, validación por campo obligatorio y un stepper que se adapta a pantallas chicas;
- **guardado manual**: sólo "Guardar borrador" preserva el progreso y, si hay cambios sin guardar, el prototipo lo advierte antes de salir del formulario;
- aviso de cambio de precio al retomar un borrador y reconfirmación explícita del nuevo valor antes de enviar; la solicitud enviada conserva el precio confirmado, visible en su detalle;
- **Mis solicitudes** con indicadores por estado, búsqueda, filtros y paginado; retomar un borrador conserva la versión de formulario con la que se creó;
- borrador con **versión de formulario retirada**: no se puede continuar ni descartar; el cliente ve el aviso y puede iniciar una nueva solicitud con la versión vigente, sin migración ni copia de respuestas;
- cancelación según estado: descartar un BORRADOR sin motivo obligatorio y sin llevarlo a CANCELADA; cancelar una ENVIADA o ASIGNADA con motivo; y solicitar la cancelación de una DERIVADA con motivo. El cliente ve la decisión del Admin (confirmada o rechazada) en el detalle;
- **Mi perfil**: consulta y edición de los datos habilitados para autogestión; el email no se edita desde el perfil.

**Admin**

- bandeja de solicitudes (desde ENVIADA; los borradores no son visibles para el Admin) con búsqueda, filtros, paginado e indicadores de sin asignar, asignadas, incidencia de entrega, derivadas y cancelación pedida;
- detalle de solicitud propio del Admin, con vuelta a la bandeja y acciones de gestión;
- asignación y reasignación de productores habilitados con confirmación explícita y registro en el historial;
- derivación: al asignar se inicia el envío al productor; **sólo una entrega exitosa lleva la solicitud a DERIVADA**, de forma automática. Si la entrega falla, la solicitud permanece ASIGNADA con la incidencia visible y el Admin puede reintentar o reasignar. El resultado de la entrega se simula con controles marcados como demo;
- confirmación o rechazo, con observación opcional, de las cancelaciones solicitadas sobre solicitudes DERIVADAS;
- productos con estado de publicación (publicado, no publicado, no disponible) y acceso directo a su formulario;
- configuración de formularios por producto, con borrador separado de la versión publicada, validación antes de publicar e histórico de versiones (vigente, publicada, retirada);
- retiro de versiones por causa legal, de seguridad, comercial o de vigencia. El retiro normal de la última versión utilizable está bloqueado; el retiro urgente exige confirmación fuerte y deja el producto no disponible hasta publicar un reemplazo;
- ABM de categorías (crear, editar, renombrar), clientes (alta, edición, baja) y productores (alta, edición, baja, habilitación para asignaciones). Las bajas e inhabilitaciones piden confirmación e informan que sus efectos están pendientes de definición de MAPS.

**Productor**

- inicia sesión con su cuenta y consulta en **Mis solicitudes** únicamente las solicitudes **DERIVADAS** asignadas a él, con búsqueda, filtro por producto, orden y paginado para un alto volumen de casos;
- detalle read-only del expediente autorizado, sin navegación a otros casos; si la solicitud deja de estar autorizada se muestra acceso denegado;
- aviso único, descartable, cuando una solicitud asignada se cancela, con pérdida del acceso al expediente y sin exponer el motivo del cliente.

Fuera del alcance actual (no incluido en el prototipo): **Mis pólizas** / Portal del Asegurado (Fase 0 §0.2), **Potenciales clientes / leads** e Intranet.

### Cobertura del inventario de Fase 2

| Pantalla F2 | Estado en el prototipo |
| --- | --- |
| PUB-01 a PUB-05, CLI-01 a CLI-08 | Presentes. |
| ADM-01 a ADM-08, ADM-10, ADM-11 | Presentes. |
| ADM-09 Versiones | Presente: histórico, vigente y retiro normal/urgente. Sin rollback, diff ni restore (fuera del MVP). |
| PRO-01 a PRO-03 | Presentes. PRO-01 usa el login común; el rol se resuelve por la cuenta. |

### Cambios controlados reflejados en el prototipo

| Tema | Alcance confirmado | Referencia |
| --- | --- | --- |
| **Categorías** (ABM) | MAPS administra las categorías del catálogo (crear, editar, renombrar) para agrupar productos sin cambios de código. | F0 §0.2/§0.4/§0.11, F1 §4/§9 (RF-CAT-01), RN-13 |
| **Clientes** (ABM) | El Admin administra clientes (alta, edición, baja) y los consulta desde el panel, con búsqueda, paginado y detalle de las solicitudes asociadas. | F0 §0.2/§0.4/§0.11, F1 §9 (RF-CLI-01), RN-14 |
| **Productores** (ABM) | El Admin administra productores (alta, edición, baja) y habilita o inhabilita su disponibilidad para recibir asignaciones. | F0 §0.2/§0.11, F1 §9 (RF-PRODUCER-03), RN-15 |
| **Acceso del productor** | El enlace individual por solicitud dejó de ser un mecanismo de acceso. El email transaccional sólo dirige al Portal; el Productor accede mediante su cuenta autenticada y ve únicamente las solicitudes DERIVADAS asignadas a él. | F0 §0.1/§0.6/§0.11, F1 §5/§9 (RF-PRODUCER-01, RF-PRODUCER-02), RN-05, RN-16 |
| **Retiro urgente de última FormVersion** | El retiro normal de la última versión utilizable se bloquea; el retiro urgente aprobado deja el producto no disponible hasta publicar un reemplazo. Los borradores afectados no se migran, reutilizan ni copian. | F0 §0.6/§0.11, F1 §4/§13, F2 §10 |

Todas quedan como alcance **CONFIRMADO**; su UX se especifica en F2 y su modelo (Category, Customer y Producer administrables, FormVersion, RBAC) en F3.

### Contrato de formulario cubierto

El constructor de formularios cubre los tipos `text`, `number`, `date`, `select`, `radio`, `checkbox`, `textarea` y `file`, con `required/optional`, edición de opciones para los tipos de selección, placeholder y texto de ayuda (F0 §0.3, F1 §4).

Quedan **pendientes de validación con MAPS**, según el contrato preliminar: `min/max`, orden explícito y agrupación por sección/paso. La condición de cierre sigue siendo validar el contrato contra uno o dos formularios reales (F1 §9, RF-FORM-01).

La versión publicada es inmutable: lo que se edita en el panel queda en un borrador de formulario y no afecta al formulario que ven los clientes hasta publicar. Cada solicitud conserva la versión con la que fue completada y un borrador de cliente sigue usando su versión de creación mientras siga utilizable, sin migración automática (F0 §0.1, RN-08, F2 §10).

### Pendientes funcionales visibles en el prototipo

El prototipo no resuelve decisiones que F2 deja abiertas; las muestra como pendientes:

- campos definitivos de **Mi perfil** (F2 §11);
- efectos de la baja de Cliente/Productor y de la inhabilitación de Productor más allá de excluirlo de nuevas asignaciones (F2 §12);
- si el Cliente puede volver a pedir la cancelación de una DERIVADA después de un rechazo (F2 CLI-08, no definido): el prototipo lo permite;
- contrato definitivo del formulario dinámico (F2 §9).

## Sistema de diseño y experiencia

El prototipo incorpora, como exploración de UI para Fase 2 (no como decisión técnica de implementación):

- un sistema de **design tokens** (paleta de marca teal, tipografía Manrope, espaciado, radios y colores de estado) y **clases reutilizables** —tarjetas, tablas, badges de estado, indicadores (KPIs), barras de herramientas y paginado— que reemplazan estilos sueltos por componentes consistentes;
- **diseño responsive**: las tablas de solicitudes se reorganizan en tarjetas apiladas en pantallas chicas y la navegación superior se colapsa en un menú;
- **mejoras de accesibilidad**: navegación por teclado, foco visible, controles con etiquetas y estados comunicados con texto además del color;
- los listados de solicitudes de **Cliente**, **Admin** y **Productor** comparten el mismo patrón de búsqueda, filtros y paginado, pensado para escalar a muchos trámites.

Estas mejoras se ofrecen como referencia visual; el comportamiento UX funcional se especifica en el Design Handoff de Fase 2.

## Cómo visualizarlo

Descargar o clonar el repositorio y abrir el archivo HTML directamente en un navegador moderno. El archivo es un export standalone y no requiere instalar dependencias del proyecto para recorrer el prototipo.

Accesos de demostración: cualquier email y contraseña ingresan como Cliente; un email que contenga "admin" ingresa como Admin; el email de un productor cargado ingresa como Productor. El pie de página ofrece accesos directos "Entrar como admin (demo)" y "Entrar como productor (demo)".

## Alcance y limitaciones

- Es un prototipo de referencia para validación UI/UX y no una implementación productiva.
- Utiliza datos y comportamientos simulados en el navegador; el resultado de la entrega del email se simula con controles marcados como demo.
- No se conecta con la API, la base de datos, autenticación real, envío de emails ni sistemas de MAPS.
- La persistencia, los permisos, las integraciones y las reglas técnicas deberán definirse en las fases correspondientes.
- El archivo conserva recursos del export standalone; algunas tipografías o librerías pueden solicitarse desde servicios externos al abrirlo.
- Las pantallas y flujos quedan sujetos a validación funcional y visual antes de transformarse en componentes de la aplicación.

## Relación con las fases del proyecto

El prototipo es la referencia visual/interactiva; el [Design Handoff de Fase 2](../Fase_2__Design_Handoff.md) especifica el comportamiento UX funcional. Fase 0 y Fase 1 continúan siendo la baseline funcional; Fase 3 define la implementación técnica. Ninguno de estos materiales constituye una decisión de arquitectura o implementación.
