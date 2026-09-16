# Documentación UI/UX

## Propósito

Esta carpeta contiene prototipos y materiales de referencia para validar la experiencia de usuario del Portal de Seguros MAPS antes de su implementación.

## Prototipo incluido

- [Prototipo standalone del Portal de Seguros MAPS](./prototipos/maps-seguros-portal-standalone.html)

El prototipo fue adaptado a la baseline funcional vigente (Fase 0) y al Discovery (Fase 1): es un **Portal de Solicitudes**, no un e-commerce. Permite recorrer, con datos de demostración, las áreas del MVP:

- autenticación y registro;
- catálogo público y detalle de productos con precio fijo vigente;
- inicio, carga, revisión y envío de solicitudes;
- confirmación del precio fijo vigente antes de enviar la solicitud;
- borradores, consulta del estado de solicitudes (Mis solicitudes) y retomar borrador;
- perfil del cliente;
- bandeja administrativa;
- configuración de formularios por producto;
- gestión de clientes, productores, productos y categorías;
- vista de productor para una solicitud asignada.

Pendiente / fuera del alcance actual (no habilitado en el prototipo):

- **Mis pólizas** queda como pantalla "próximamente" (Portal del Asegurado diferido; Fase 0 §0.2, Fase 1 §1) y aún no está definida con el cliente;
- **Potenciales clientes / leads** se retiró del panel administrativo por estar fuera del MVP.

### CRUDs administrativos incorporados al MVP

Las secciones **Categorías** y **Clientes** del panel Admin se incorporaron al alcance del MVP como cambio controlado (2026-09-16), tras no estar explicitadas en la baseline original:

| Sección del prototipo | Alcance confirmado | Referencia |
| --- | --- | --- |
| **Categorías** (ABM) | MAPS administra las categorías del catálogo (crear, editar, renombrar) para agrupar productos sin cambios de código. | F0 §0.2/§0.4/§0.11, F1 §4/§9 (RF-CAT-01), RN-13 |
| **Clientes** (ABM) | El Admin administra clientes (alta, edición, baja) y los consulta desde el panel. | F0 §0.2/§0.4/§0.11, F1 §9 (RF-CLI-01), RN-14 |

Ambas quedan como alcance **CONFIRMADO**; su UX se diseña en F2 y su modelo (Category, Customer administrable) en F3.

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
