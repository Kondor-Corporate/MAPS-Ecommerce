# Documentación UI/UX

## Propósito

Esta carpeta contiene prototipos y materiales de referencia para validar la experiencia de usuario del Portal de Seguros MAPS antes de su implementación.

## Prototipo incluido

- [Prototipo standalone del Portal de Seguros MAPS](./prototipos/maps-seguros-portal-standalone.html)

El prototipo permite recorrer, con datos de demostración, las principales áreas previstas:

- autenticación y registro;
- catálogo público y detalle de productos;
- inicio, carga, revisión y envío de solicitudes;
- borradores y consulta del estado de solicitudes;
- consulta de pólizas y servicios contratados;
- perfil del cliente;
- bandeja administrativa;
- configuración de formularios por producto;
- gestión de clientes, pólizas, productores, productos, categorías y potenciales clientes;
- vista de productor para una solicitud asignada.

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
