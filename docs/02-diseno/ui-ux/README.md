# Documentación UI/UX

## Propósito

Esta carpeta contiene prototipos y materiales de referencia para validar la experiencia de usuario del Portal de Seguros MAPS antes de su implementación.

## Prototipo incluido

- [Prototipo standalone del Portal de Seguros MAPS](./prototipos/maps-seguros-portal-standalone.html)

El prototipo fue adaptado a la baseline funcional vigente (Fase 0) y al Discovery (Fase 1): es un **Portal de Solicitudes**, no un e-commerce. Permite recorrer, con datos de demostración, las áreas del MVP.

**Cliente**

- autenticación y registro; el catálogo es público y el login se exige antes de crear un borrador;
- catálogo y detalle de productos con precio fijo vigente;
- inicio, carga, revisión y envío de solicitudes, con formulario dinámico por producto, validación por campo obligatorio y un stepper que se adapta a pantallas chicas;
- aviso de cambio de precio al retomar un borrador y reconfirmación expresa antes de enviar; la solicitud enviada conserva el precio confirmado;
- borradores recuperables, **Mis solicitudes** con indicadores por estado, búsqueda, filtros y paginado, y retomar borrador conservando la versión de formulario de creación;
- cancelación según estado: descartar un BORRADOR, cancelar una ENVIADA o ASIGNADA, y solicitar la cancelación de una DERIVADA. El motivo es obligatorio en todos los casos;
- perfil del cliente.

**Admin**

- bandeja de solicitudes con búsqueda, filtros y paginado;
- detalle de solicitud propio del Admin, con vuelta a la bandeja y acciones de gestión;
- asignación y reasignación de productores, con registro en el historial;
- trazabilidad de la derivación: intentos de envío, destinatario, resultado y reintento ante fallo. Una solicitud no puede derivarse sin una entrega correcta;
- confirmación o rechazo de las cancelaciones solicitadas sobre solicitudes DERIVADAS;
- configuración de formularios por producto, con borrador separado de la versión publicada;
- ABM de productos, categorías, clientes y productores.

**Productor**

- inicia sesión con su cuenta y consulta en **Mis solicitudes** únicamente las asignadas a él, con indicadores por estado, búsqueda, filtros y paginado que escalan a un alto volumen de casos;
- detalle read-only del expediente autorizado, sin navegación a otros casos;
- aviso cuando una solicitud asignada se cancela, con pérdida del acceso al expediente.

Pendiente / fuera del alcance actual (no habilitado en el prototipo):

- **Mis pólizas** queda como pantalla "próximamente" (Portal del Asegurado diferido; Fase 0 §0.2, Fase 1 §1) y aún no está definida con el cliente;
- **Potenciales clientes / leads** e Intranet no forman parte del prototipo.

### Cambios controlados reflejados en el prototipo

| Tema | Alcance confirmado | Referencia |
| --- | --- | --- |
| **Categorías** (ABM) | MAPS administra las categorías del catálogo (crear, editar, renombrar) para agrupar productos sin cambios de código. | F0 §0.2/§0.4/§0.11, F1 §4/§9 (RF-CAT-01), RN-13 |
| **Clientes** (ABM) | El Admin administra clientes (alta, edición, baja) y los consulta desde el panel, con búsqueda, paginado y detalle de las solicitudes asociadas. | F0 §0.2/§0.4/§0.11, F1 §9 (RF-CLI-01), RN-14 |
| **Productores** (ABM) | El Admin administra productores (alta, edición, baja) y habilita o inhabilita su disponibilidad para recibir asignaciones. | F0 §0.2/§0.11, F1 §9 (RF-PRODUCER-03), RN-15 |
| **Acceso del productor** | Se revoca el enlace seguro por solicitud. El productor accede desde su cuenta autenticada y ve sólo las solicitudes asignadas a él. | F0 §0.1/§0.6/§0.11, F1 §5/§9 (RF-PRODUCER-01, RF-PRODUCER-02), RN-05, RN-16 |

Todas quedan como alcance **CONFIRMADO**; su UX se diseña en F2 y su modelo (Category, Customer y Producer administrables, RBAC) en F3.

### Contrato de formulario cubierto

El constructor de formularios cubre los tipos `text`, `number`, `date`, `select`, `radio`, `checkbox`, `textarea` y `file`, con `required/optional`, edición de opciones para los tipos de selección, placeholder y texto de ayuda (F0 §0.3, F1 §4).

Quedan **pendientes de validación con MAPS**, según el contrato preliminar: `min/max`, orden explícito y agrupación por sección/paso. La condición de cierre sigue siendo validar el contrato contra uno o dos formularios reales (F1 §9, RF-FORM-01).

La versión publicada es inmutable: lo que se edita en el panel queda en un borrador de formulario y no afecta al formulario que ven los clientes hasta publicar. Cada solicitud conserva la versión con la que fue completada y un borrador de cliente sigue usando su versión de creación, sin migración automática (F0 §0.1, RN-08).

## Sistema de diseño y experiencia

El prototipo incorpora, como exploración de UI para Fase 2 (no como decisión técnica de implementación):

- un sistema de **design tokens** (paleta de marca teal, tipografía Manrope, espaciado, radios y colores de estado) y **clases reutilizables** —tarjetas, tablas, badges de estado, indicadores (KPIs), barras de herramientas y paginado— que reemplazan estilos sueltos por componentes consistentes;
- **diseño responsive**: las tablas de solicitudes se reorganizan en tarjetas apiladas en pantallas chicas y la navegación superior se colapsa en un menú;
- **mejoras de accesibilidad**: navegación por teclado, foco visible, controles con etiquetas y estados comunicados con texto además del color;
- las tres vistas de listado de solicitudes (**Cliente**, **Admin** y **Productor**) comparten el mismo patrón de búsqueda, filtros, indicadores por estado y paginado, pensado para escalar a muchos trámites.

Estas mejoras se ofrecen como referencia visual para Fase 2; el detalle definitivo de UX, componentes y sistema de diseño se especifica en el Design Handoff de Fase 2.

## Cómo visualizarlo

Descargar o clonar el repositorio y abrir el archivo HTML directamente en un navegador moderno. El archivo es un export standalone y no requiere instalar dependencias del proyecto para recorrer el prototipo.

## Alcance y limitaciones

- Es un prototipo de referencia para validación UI/UX y no una implementación productiva.
- Utiliza datos y comportamientos simulados en el navegador.
- No se conecta con la API, la base de datos, autenticación real, envío de emails ni sistemas de MAPS.
- La persistencia, los permisos, las integraciones y las reglas técnicas deberán definirse en las fases correspondientes.
- El archivo conserva recursos del export standalone; algunas tipografías o librerías pueden solicitarse desde servicios externos al abrirlo.
- Las pantallas y flujos quedan sujetos a validación funcional y visual antes de transformarse en componentes de la aplicación.

## Relación con las fases del proyecto

El material sirve como insumo de diseño para la Fase 2. No reemplaza el discovery de la Fase 1 ni constituye una decisión técnica de arquitectura o implementación.
