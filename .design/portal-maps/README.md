# Canvas de diseño — Portal de solicitudes MAPS

Revisión y corrección de UI/UX del prototipo del portal, sobre el modelo de **solicitud** (según el baseline de Fase 0: sin checkout, sin pagos, sin emisión automática).

## Ver el prototipo

- **Canvas publicado (recomendado):** https://claude.ai/code/artifact/183ea38a-b100-4fe4-a03a-525a5978af58
- **Standalone local:** abrir `portal-maps-solicitudes.html` en un navegador.

Es un prototipo clickeable de punta a punta, no una maqueta estática. Para ver el backoffice, iniciar sesión con un email que contenga "admin".

## Por qué existe

El prototipo previo (`docs/02-diseno/ui-ux/prototipos/`) tenía problemas de accesibilidad, contraste de color, sistema de diseño inconsistente y bugs de flujo (validación faltante, backoffice sin control de acceso). Este canvas los corrige manteniendo el copy, los datos y la lógica de negocio del original.

Corregido respecto al prototipo previo:

- **Contraste WCAG AA** en toda la paleta (badges de estado, gradiente del hero, botones y su estado hover).
- **Navegación por teclado**: tarjetas y filas pasaron de `<div onClick>` a `<button>` real, con foco visible.
- **Formularios accesibles**: `<form>` + `<label>` asociado, validación del paso de datos de contacto antes de avanzar (antes no validaba nada).
- **Backoffice gateado por rol**: ya no hay enlace público al panel admin.
- **Sistema de tokens único**: tipografía (8 pasos), radios (2 + pill) y espaciado consistentes, en vez de valores sueltos.
- **Responsive real**: el catálogo no desborda a 320px; el stepper colapsa en mobile.
- Íconos de fuente tipográfica (~4 MB) reemplazados por SVG inline; fotos placeholder reemplazadas por ícono + color por categoría.

## Archivos

- `Main.dc.html` — fuente editable del artboard (Design Components).
- `canvas.json` — layout del canvas.
- `logo-maps.png` — isologo recortado desde el asset original del prototipo.
- `portal-maps-solicitudes.html` — build sembrado, publicado como Artifact.

## Alcance y limitaciones

Sigue siendo un prototipo de validación UI/UX, no una implementación productiva: datos simulados en el navegador, sin conexión a API real. La navegación interna usa estado de componente, no URLs de browser — el ruteo real se define en Fase 3 al implementar `apps/web`.
