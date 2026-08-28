# Portal de Solicitudes de Seguros MAPS

Documento fundacional para definir el alcance, las responsabilidades, los flujos, las reglas de trabajo y los criterios de aceptación de la nueva versión del proyecto.

| Dato | Definición |
| --- | --- |
| Cliente | MAPS - Organización de seguros |
| Equipo de desarrollo | Kondor |
| Proyecto | Portal de Solicitudes de Seguros MAPS |
| Versión | Fase 0 reformulada - Baseline funcional v2 |
| Fecha | 26 de agosto de 2026 |

## 0.1 Redefinición del producto

El proyecto deja de concebirse como un e-commerce de seguros. La plataforma no realizará ventas directas, no cobrará primas, no confirmará contrataciones y no emitirá pólizas automáticamente.

La nueva solución será un **Portal de Solicitudes de Seguros**. Su propósito será presentar los productos aseguradores ofrecidos por MAPS, permitir que cada cliente cree una cuenta, complete un formulario específico para el seguro elegido, adjunte la información requerida, guarde el trámite como borrador y envíe una solicitud formal.

Una vez recibida la solicitud, un administrador de MAPS seleccionará manualmente al productor responsable. El sistema derivará la solicitud de manera automática mediante la API oficial de WhatsApp, enviando un resumen y un enlace seguro. El productor consultará la información recibida, se pondrá en contacto con el cliente y continuará el proceso de venta por fuera de la plataforma.

La responsabilidad funcional del MVP termina cuando la solicitud fue entregada correctamente al productor. La negociación, la validación aseguradora, la solicitud posterior de documentación, el cierre comercial, el cobro, la emisión y la entrega de la póliza quedan a cargo del productor y de los sistemas externos correspondientes.

### Definición breve del producto

> Plataforma para publicar productos aseguradores, construir formularios particulares para cada seguro, recibir solicitudes con datos y fotografías, conservar borradores recuperables y derivar cada solicitud al productor asignado mediante WhatsApp, de forma segura y trazable.

### Principios fundacionales

- El sistema gestiona solicitudes, no ventas ni contrataciones.
- Cada producto puede requerir un formulario diferente.
- El cliente debe tener una cuenta para iniciar y recuperar una solicitud.
- Toda solicitud puede permanecer como borrador hasta que el cliente decida enviarla.
- La asignación del productor es manual y responsabilidad de un administrador.
- La derivación al productor se realiza automáticamente por la API oficial de WhatsApp.
- WhatsApp recibe un resumen mínimo y un enlace seguro; la información completa y las fotografías no deben exponerse directamente en el mensaje.
- Después de la derivación, el contacto y el cierre de la venta se realizan fuera del sistema.
- Los precios de los paquetes son fijos y pueden mostrarse en el catálogo, aunque no representan un importe que se cobre desde la plataforma.
- Las decisiones sobre formularios, datos personales, archivos y consentimientos deben quedar versionadas y ser auditables.

## 0.2 Participantes y responsabilidades

### MAPS

MAPS es el propietario funcional del producto y de la información comercial publicada. Debe definir los seguros disponibles, sus precios, coberturas, exclusiones, requisitos, formularios, textos legales y productores habilitados.

Roles mínimos:

- **Responsable comercial:** define los productos, precios, coberturas, exclusiones, requisitos y contenido comercial.
- **Administrador del portal:** administra productos y formularios, revisa las solicitudes recibidas, selecciona al productor y ejecuta o supervisa la asignación.
- **Productor de seguros:** recibe la derivación por WhatsApp, consulta la solicitud mediante el enlace seguro, contacta al cliente y gestiona el proceso comercial por fuera de la plataforma.
- **Responsable de aprobación:** valida las decisiones finales de alcance, contenido, operación y cumplimiento legal.

En organizaciones pequeñas, una persona puede desempeñar más de un rol, pero cada decisión o actividad debe tener un responsable identificable.

### Kondor

- **PM / BA:** releva necesidades, mantiene la Fase 0, ordena el backlog, documenta decisiones y coordina las validaciones con MAPS.
- **Tech Lead:** define la arquitectura, las políticas técnicas y de seguridad, y revisa la calidad de la implementación.
- **Desarrollo frontend:** implementa catálogo, autenticación, experiencia de formularios, borradores, área del cliente y panel administrativo.
- **Desarrollo backend / infraestructura:** implementa autenticación, persistencia, formularios dinámicos, archivos, asignaciones, integración con WhatsApp, auditoría, despliegue y observabilidad.

Los roles de Kondor pueden rotar o superponerse. Cada tarea debe conservar un responsable y un criterio de aceptación.

## 0.3 Visión y definición de éxito

La primera versión será exitosa cuando MAPS pueda completar el siguiente ciclo sin depender de modificaciones de código para cada nuevo formulario:

1. Un administrador publica un producto con precio fijo, coberturas, exclusiones y requisitos.
2. El administrador crea y publica el formulario específico del producto mediante el constructor dinámico.
3. Un cliente crea una cuenta con email y contraseña e inicia una solicitud.
4. El sistema guarda automáticamente el progreso como borrador.
5. El cliente vuelve a ingresar, recupera el borrador, completa la información y envía la solicitud.
6. MAPS recibe la solicitud en una bandeja de administración.
7. Un administrador selecciona manualmente un productor.
8. El sistema envía automáticamente por WhatsApp un resumen y un enlace seguro.
9. La plataforma registra si la derivación fue aceptada o falló y permite reintentar cuando corresponda.
10. El productor accede a una vista segura de la solicitud y continúa el contacto por fuera del portal.

El éxito del MVP no depende de que la venta se cierre, ya que ese resultado ocurre fuera del sistema. Los indicadores principales serán la finalización de solicitudes, el tiempo hasta la asignación y la entrega correcta al productor.

## 0.4 Problemas que el proyecto busca resolver

- Los formularios genéricos no contemplan los datos particulares de cada seguro.
- La información puede quedar dispersa entre planillas, correos, fotografías y conversaciones de WhatsApp.
- El cliente puede perder su progreso si no completa el trámite en una sola sesión.
- MAPS necesita conocer qué solicitudes están nuevas y cuáles esperan asignación.
- La distribución manual de información puede generar demoras, omisiones o envíos al productor equivocado.
- El productor necesita recibir la información suficiente para iniciar el contacto sin exponer datos sensibles en el mensaje de WhatsApp.
- MAPS necesita poder actualizar los formularios sin requerir un despliegue de software por cada cambio.
- Debe existir trazabilidad sobre qué versión del formulario respondió el cliente, cuándo envió la solicitud, quién asignó al productor y si la derivación fue realizada.

## 0.5 Alcance funcional del MVP

### A. Catálogo público de seguros

- Listado de productos activos.
- Categorías y filtros básicos.
- Página de detalle de cada producto.
- Nombre comercial, descripción y beneficios.
- Precio fijo visible.
- Coberturas.
- Exclusiones.
- Requisitos.
- Documentación o fotografías que podrían solicitarse.
- Llamada a la acción: **Iniciar solicitud**.

El precio mostrado es informativo y no habilita el pago dentro del sistema.

### B. Cuenta del cliente

- Registro mediante email y contraseña.
- Verificación del email.
- Inicio y cierre de sesión.
- Recuperación y cambio de contraseña.
- Aceptación de términos y política de privacidad durante el alta.
- Acceso a borradores propios.
- Acceso a solicitudes ya enviadas y a su estado limitado dentro del portal.

El cliente debe autenticarse antes de comenzar el formulario. Los datos y borradores siempre deben quedar asociados a su cuenta.

### C. Constructor dinámico completo de formularios

El constructor será una función administrativa central. Para que el concepto de “completo” tenga un límite verificable dentro del MVP, deberá incluir como mínimo:

- Creación de formularios sin modificar código.
- Asociación de un formulario a uno o más productos, según la decisión de MAPS.
- Organización por páginas, pasos o secciones.
- Reordenamiento de secciones y campos.
- Campos de texto corto y largo.
- Email, teléfono, número, moneda y porcentaje.
- Fecha y hora.
- Selección simple y múltiple.
- Casillas de verificación.
- Opciones de tipo sí/no.
- Carga de archivos y fotografías.
- Textos informativos, títulos y ayudas contextuales.
- Configuración de campos obligatorios u opcionales.
- Reglas de longitud, rango, formato y tipos de archivo.
- Lógica condicional para mostrar, ocultar o requerir campos según respuestas anteriores.
- Mensajes de validación configurables.
- Previsualización antes de publicar.
- Estados de formulario: borrador, publicado y archivado.
- Duplicación de formularios y secciones.
- Versionado: toda modificación publicada crea una nueva versión.
- Conservación de la versión exacta contestada por cada cliente.
- Imposibilidad de alterar retrospectivamente una solicitud enviada.

No se incluye un lenguaje de programación visual ilimitado ni integraciones externas arbitrarias dentro del constructor. Las reglas deberán pertenecer al conjunto soportado y documentado por el sistema.

### D. Solicitudes y borradores recuperables

- Creación de una solicitud al iniciar el formulario.
- Guardado automático del progreso.
- Guardado manual complementario.
- Recuperación del borrador desde cualquier sesión autenticada.
- Indicación visual del progreso.
- Validaciones antes del envío definitivo.
- Resumen previo al envío.
- Registro de consentimientos y de la versión aceptada.
- Confirmación de recepción al cliente por email.
- Bloqueo de edición después del envío, salvo que una futura decisión de alcance disponga lo contrario.

La falta de fotografías o documentación no necesariamente debe impedir el envío. Cada formulario determinará qué archivo es obligatorio y cuál puede ser solicitado posteriormente por el productor.

### E. Bandeja administrativa

- Listado de solicitudes enviadas.
- Filtros por producto, fecha, cliente, estado y productor.
- Identificación clara de solicitudes pendientes de asignación.
- Vista completa de respuestas y archivos.
- Consulta de la versión del formulario respondida.
- Búsqueda por email, DNI u otros campos habilitados.
- Selección manual del productor.
- Confirmación de la asignación.
- Consulta del estado de la derivación por WhatsApp.
- Reintento ante errores de envío.
- Registro mínimo de auditoría.

### F. Administración de productores

- Alta, edición, activación y desactivación de productores.
- Nombre y datos identificatorios mínimos.
- Número de WhatsApp validado.
- Productos o ramos relacionados, con carácter informativo.
- Estado habilitado o inhabilitado para recibir derivaciones.

La relación entre productos y productores no produce una asignación automática. El administrador siempre seleccionará manualmente al destinatario.

### G. Derivación automática mediante WhatsApp

La derivación se ejecutará después de la confirmación de la asignación administrativa.

El mensaje deberá contener únicamente un resumen mínimo:

- Identificador de la solicitud.
- Producto solicitado.
- Nombre del cliente, si la política de privacidad aprobada lo permite.
- Fecha de recepción.
- Enlace seguro para consultar el expediente.

El envío se realizará mediante la API oficial de WhatsApp y una plantilla previamente habilitada cuando la plataforma lo requiera. La implementación dependerá de que MAPS proporcione la cuenta, el número, las credenciales, las plantillas y las aprobaciones necesarias.

El sistema deberá registrar, como mínimo:

- Fecha y hora del intento.
- Productor y número destinatario.
- Identificador devuelto por el proveedor.
- Resultado conocido del envío.
- Error recibido, cuando exista.
- Reintentos efectuados.

### H. Acceso seguro del productor

El enlace de WhatsApp abrirá una vista de sólo lectura con la solicitud completa y sus archivos. No constituye un panel general de productores.

Como controles mínimos, el enlace deberá:

- utilizar transporte cifrado;
- ser difícil de adivinar;
- tener vencimiento;
- poder revocarse;
- quedar vinculado a una única solicitud y asignación;
- impedir la navegación hacia solicitudes de otros clientes;
- registrar accesos relevantes;
- evitar la indexación pública;
- requerir una validación adicional cuando el análisis de seguridad lo determine.

La modalidad exacta de validación adicional se definirá durante el diseño técnico, considerando el equilibrio entre seguridad y facilidad de acceso del productor.

## 0.6 Flujo funcional aprobado

```text
Catálogo de seguros
→ selección del producto
→ registro o inicio de sesión
→ inicio del formulario particular
→ guardado automático como borrador
→ recuperación y continuación
→ validación y envío de la solicitud
→ confirmación al cliente
→ bandeja de solicitudes de MAPS
→ asignación manual por administrador
→ envío automático por WhatsApp
→ acceso del productor mediante enlace seguro
→ contacto y cierre comercial fuera del sistema
```

### Estados mínimos de una solicitud

- **BORRADOR:** el cliente comenzó la carga y todavía puede editarla.
- **ENVIADA:** el cliente confirmó el envío y la solicitud espera revisión o asignación.
- **ASIGNADA:** el administrador seleccionó al productor responsable.
- **DERIVACIÓN_PENDIENTE:** la asignación existe y el mensaje todavía no fue confirmado por la integración.
- **DERIVADA:** la integración registró un envío satisfactorio al productor.
- **ERROR_DE_DERIVACIÓN:** el envío falló y requiere reintento o intervención administrativa.
- **CANCELADA:** MAPS anuló la solicitud antes de una derivación válida, dejando motivo y auditoría.

El MVP no utilizará estados como aprobada, rechazada, vendida, pagada, emitida o póliza asignada, porque representan actividades posteriores realizadas fuera de la plataforma.

## 0.7 Modelo conceptual inicial

Sin fijar todavía una arquitectura definitiva, el dominio deberá contemplar al menos:

- Usuario cliente.
- Administrador.
- Productor.
- Producto asegurador.
- Formulario.
- Versión de formulario.
- Sección.
- Definición de campo.
- Regla condicional.
- Solicitud.
- Respuesta.
- Archivo o fotografía.
- Consentimiento.
- Asignación.
- Derivación por WhatsApp.
- Enlace seguro.
- Evento de auditoría.

La solicitud debe conservar una referencia inmutable a la versión del formulario utilizada. Una modificación posterior del producto o formulario no puede cambiar el contenido histórico de una solicitud enviada.

## 0.8 Alcance explícitamente excluido del MVP

- Carrito de compras.
- Checkout.
- Pasarela de pago.
- Mercado Pago u otra integración financiera.
- Pagos únicos o recurrentes.
- Webhooks financieros.
- Conciliación.
- Confirmación automática de contratación.
- Emisión automática de pólizas.
- Carga o consulta de pólizas.
- Portal de pólizas del asegurado.
- Seguimiento del proceso comercial después de la derivación.
- Registro del resultado final de la venta.
- CRM de productores.
- Panel operativo completo para productores.
- Conversaciones de WhatsApp dentro del portal.
- Asignación automática de productores.
- Integración profunda con Federación Patronal o SELF.
- Cotización variable o simulación automática.
- Recomendaciones mediante inteligencia artificial.
- Dashboards analíticos avanzados.
- Aplicación móvil nativa.

Estas capacidades sólo podrán incorporarse mediante una nueva definición de alcance y análisis de impacto.

## 0.9 Restricciones y dependencias

- La venta se cierra fuera del sistema y depende de la gestión del productor.
- El sistema no puede afirmar que una solicitud equivale a una contratación.
- Los paquetes tendrán precios fijos visibles, pero el precio debe poder actualizarse y conservar historial cuando sea necesario.
- MAPS debe proporcionar la información completa de cada producto y formulario.
- La integración de WhatsApp depende de una cuenta oficial, un número habilitado, credenciales válidas, plantillas y condiciones del proveedor.
- Las fotografías y documentos tendrán una permanencia corta; el plazo exacto debe ser definido por MAPS y validado legalmente.
- Los textos legales, consentimientos y política de privacidad todavía requieren definición y aprobación.
- El uso obligatorio de una cuenta mejora la recuperación de borradores, pero agrega fricción al inicio del proceso.
- La asignación manual puede convertirse en un cuello de botella si no se establece un responsable y un tiempo de atención.
- El constructor dinámico es el módulo de mayor complejidad y debe desarrollarse con criterios de aceptación cerrados.

## 0.10 Seguridad y protección de datos

- Cuentas nominadas para clientes y administradores.
- Contraseñas almacenadas mediante mecanismos criptográficos adecuados; nunca en texto plano.
- Verificación de email y recuperación segura de contraseña.
- Roles y permisos diferenciados.
- Separación estricta entre datos de distintos clientes.
- Validación de formularios tanto en frontend como en backend.
- Restricciones de formato, cantidad y tamaño para archivos.
- Análisis y tratamiento seguro de archivos cargados.
- Cifrado en tránsito y protección del almacenamiento.
- URLs de archivos no públicas y con acceso temporal cuando corresponda.
- Expiración y revocación de enlaces de productores.
- Registro de altas, publicaciones de formularios, envíos, asignaciones, accesos y reintentos.
- Consentimiento explícito para tratar datos y derivarlos al productor seleccionado.
- Registro de versión, fecha, hora y usuario asociado a cada consentimiento.
- Política de retención y eliminación de borradores, solicitudes y archivos.
- Backups y procedimiento de recuperación.
- Entornos separados de desarrollo, prueba y producción.
- Gestión segura de secretos y credenciales de WhatsApp.
- Logs sin exposición innecesaria de datos personales.

## 0.11 Notificaciones del MVP

### Cliente

- Verificación de email.
- Recuperación de contraseña.
- Confirmación de solicitud recibida.

### Administrador

- Nueva solicitud enviada, si MAPS decide habilitar el aviso.
- Error de derivación por WhatsApp.

### Productor

- Nueva solicitud asignada, mediante WhatsApp automático con resumen y enlace seguro.

No se incluyen recordatorios comerciales, cambios posteriores de estado, aprobación, rechazo, emisión ni renovación.

## 0.12 Métricas e instrumentación mínima

Aunque no se implemente un dashboard avanzado, se registrarán eventos mínimos para permitir análisis posteriores:

- Vista de producto.
- Cuenta creada.
- Solicitud iniciada.
- Borrador guardado.
- Borrador recuperado.
- Solicitud enviada.
- Solicitud asignada.
- Derivación iniciada.
- Derivación exitosa.
- Error de derivación.

Indicadores iniciales:

- Porcentaje de solicitudes iniciadas que llegan a enviarse.
- Tiempo medio entre envío y asignación.
- Porcentaje de derivaciones exitosas.
- Productos con más solicitudes.
- Campos o pasos con mayor abandono, siempre que la instrumentación respete la privacidad aprobada.

El MVP no podrá medir ventas cerradas ni conversión final a póliza, porque el resultado comercial no vuelve al sistema.

## 0.13 Riesgos principales

| Riesgo | Consecuencia | Tratamiento inicial |
| --- | --- | --- |
| Alcance ilimitado del constructor | Demoras y crecimiento no controlado | Cerrar tipos de campo, reglas y criterios antes del desarrollo |
| Datos o formularios incompletos por producto | Reimplementaciones y solicitudes inválidas | Exigir ficha funcional aprobada antes de publicar |
| Fricción por registro obligatorio | Abandono antes de iniciar | Alta breve, verificación clara y continuidad inmediata |
| Exposición de datos mediante WhatsApp o enlaces | Incidente de privacidad | Resumen mínimo, enlace temporal, revocación y auditoría |
| Fallas o restricciones de la API de WhatsApp | Solicitudes no derivadas | Estado de error, reintentos y bandeja administrativa |
| Productor con número incorrecto o inactivo | Derivación al destinatario equivocado | Validación administrativa y posibilidad de desactivar productores |
| Asignación manual demorada | Pérdida de oportunidades | Responsable definido y métrica de tiempo hasta asignación |
| Fotografías pesadas o inseguras | Costos, lentitud o riesgo técnico | Límites, compresión, validación, almacenamiento privado y retención |
| Cambios en un formulario publicado | Inconsistencia histórica | Versionado obligatorio e inmutabilidad de respuestas enviadas |
| Ausencia de textos legales aprobados | Riesgo de cumplimiento | No publicar producción hasta obtener aprobación formal |

## 0.14 Forma de trabajo y gobierno del proyecto

### Cadencia

Kondor mantendrá sesiones de trabajo de cuatro horas, tres veces por semana, combinando trabajo remoto y presencial según lo acordado. La reunión con MAPS se realizará semanalmente o cuando una decisión bloqueante lo requiera.

En cada instancia se revisará:

- trabajo terminado;
- trabajo siguiente;
- bloqueos;
- decisiones pendientes;
- validaciones requeridas de MAPS;
- cambios de alcance y su impacto.

### Gestión y documentación

Notion será el registro principal de backlog, decisiones y minutas, salvo que el equipo acuerde otra herramienta. El tablero conservará los estados:

- Backlog.
- Ready.
- In progress.
- Review.
- QA.
- Done.

Etiquetas funcionales sugeridas:

- AUTH.
- CATÁLOGO.
- PRODUCTOS.
- FORM BUILDER.
- SOLICITUDES.
- BORRADORES.
- ARCHIVOS.
- ADMIN.
- PRODUCTORES.
- ASIGNACIONES.
- WHATSAPP.
- NOTIFICACIONES.
- AUDITORÍA.
- MÉTRICAS.
- INFRA.
- UX/UI.

Las etiquetas CARRITO, CHECKOUT, PAGOS y MIS PÓLIZAS dejan de pertenecer al MVP.

### Reglas de decisión

- Toda decisión relevante debe registrarse por escrito.
- Los pedidos recibidos por chat o audio deben convertirse en una tarea o decisión documentada.
- Ninguna funcionalidad crítica se desarrolla sin definición mínima y criterio de aceptación.
- Todo cambio de alcance debe analizar su impacto en tiempo, costo, seguridad y cronograma.
- Los formularios de productos deben ser aprobados por MAPS antes de implementarse o publicarse.
- Las decisiones relacionadas con datos personales, archivos, consentimientos o WhatsApp deben quedar documentadas.

## 0.15 Definición de terminado

Una funcionalidad se considera terminada cuando:

- cumple sus criterios de aceptación;
- fue desarrollada y revisada;
- tiene pruebas adecuadas a su criticidad;
- funciona en dispositivos móviles y de escritorio cuando corresponde;
- valida datos en frontend y backend;
- maneja los errores esperados;
- respeta roles, permisos y aislamiento de datos;
- registra los eventos de auditoría definidos;
- fue validada funcionalmente por MAPS;
- no rompe otros módulos;
- posee documentación de uso o técnica cuando corresponde;
- está lista para staging o producción.

Para un formulario publicado, “terminado” implica además que fue previsualizado, probado, versionado y asociado correctamente al producto.

## 0.16 Información y accesos que MAPS debe proporcionar

- Lista de los primeros seguros que integrarán el MVP.
- Ficha de cada producto: nombre, descripción, precio, coberturas, exclusiones y requisitos.
- Campos, opciones, reglas, validaciones y textos de ayuda de cada formulario inicial.
- Fotografías o archivos solicitados por producto.
- Definición de qué archivos son obligatorios y cuáles puede pedir luego el productor.
- Textos legales, política de privacidad y consentimientos aprobados.
- Lista inicial de administradores.
- Lista inicial de productores y números de WhatsApp verificados.
- Responsable de mantener productos, formularios y productores.
- Cuenta oficial, número y credenciales para la integración de WhatsApp.
- Plantilla de mensaje aprobada o contenido que deberá presentarse para aprobación.
- Logo, colores, tipografías, imágenes y tono de comunicación.
- Dominio, DNS y accesos de infraestructura necesarios.
- Dirección de correo desde la cual se enviarán notificaciones a clientes.

## 0.17 Decisiones todavía pendientes

Estas preguntas no invalidan la baseline funcional, pero deben resolverse antes de cerrar el diseño o publicar el sistema:

1. ¿Cuáles son los productos exactos de la primera versión?
2. ¿Qué campos, reglas condicionales y fotografías requiere cada producto?
3. ¿Cuántas fotografías pueden cargarse, en qué formatos y con qué tamaño máximo?
4. ¿Durante cuánto tiempo se conservarán los borradores sin actividad?
5. ¿Durante cuánto tiempo se conservarán las solicitudes y fotografías después de la derivación?
6. ¿Qué textos y consentimientos debe aceptar el cliente y quién los aprueba?
7. ¿Qué datos puede incluir el resumen de WhatsApp sin incumplir las políticas de privacidad?
8. ¿Cuánto tiempo será válido el enlace seguro y qué validación adicional deberá utilizar?
9. ¿Cuál será el procedimiento alternativo cuando WhatsApp no pueda entregar la solicitud?
10. ¿Quién controla diariamente la bandeja de solicitudes sin asignar?
11. ¿En cuánto tiempo máximo debería realizarse la asignación manual?
12. ¿Puede un administrador reasignar una solicitud ya derivada y qué auditoría requiere?
13. ¿Cuándo se elimina o anonimiza una cuenta de cliente?
14. ¿Cómo se tratarán solicitudes duplicadas del mismo cliente para el mismo producto?
15. ¿Se permitirá que un cliente cancele una solicitud enviada antes de su derivación?

## 0.18 Resultado esperado de la Fase 0

La Fase 0 se considerará aprobada cuando Kondor y MAPS hayan aceptado formalmente:

- la redefinición de e-commerce a Portal de Solicitudes de Seguros;
- el límite del sistema en la derivación al productor;
- el flujo funcional del cliente y del administrador;
- el registro obligatorio y los borradores recuperables;
- la asignación manual del productor;
- el uso de la API oficial de WhatsApp;
- el contenido mínimo del mensaje y el acceso mediante enlace seguro;
- el alcance verificable del constructor dinámico;
- los módulos incluidos y excluidos;
- los roles y responsabilidades;
- los riesgos y dependencias principales;
- la lista de decisiones pendientes;
- los insumos necesarios para iniciar análisis detallado, diseño y backlog.

La aprobación de esta baseline habilitará la reescritura del modelo de dominio, la arquitectura, la EAP, las épicas, las historias de usuario y los TDD. El backlog anterior no debe utilizarse como fuente vigente para módulos de pago, checkout, contratación o pólizas.
