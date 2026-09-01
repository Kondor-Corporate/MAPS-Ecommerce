# Portal de Seguros MAPS

Documento fundacional de Fase 0 para definir la visión objetivo del producto, el problema, los actores generales, el mapa de capacidades, el alcance del MVP frente a su evolución, las restricciones, los riesgos y el gobierno del proyecto.

| Dato | Definición |
| --- | --- |
| Cliente | MAPS - Organización de seguros |
| Equipo de desarrollo | Kondor |
| Proyecto | Portal de Seguros MAPS |
| Versión | Fase 0 reformulada - Baseline funcional v5 |
| Fecha | 1 de septiembre de 2026 |

## 0.1 Redefinición del producto

El proyecto deja de concebirse como un e-commerce transaccional de seguros. La plataforma no realizará ventas directas, no cobrará primas, no confirmará contrataciones y no emitirá pólizas automáticamente.

La visión objetivo es un **Portal de Seguros MAPS** con tres ciclos funcionales complementarios:

1. **Ciclo de solicitud:** presenta los productos aseguradores, permite completar formularios particulares, conservar borradores y enviar solicitudes formales. MAPS asigna manualmente un productor y la solicitud se deriva de forma segura y trazable para que el proceso comercial continúe fuera de la plataforma.
2. **Ciclo del asegurado:** permite que MAPS registre o asocie clientes con los seguros o servicios que ya tienen contratados y que cada asegurado consulte la información básica disponible de sus pólizas.
3. **Ciclo de potenciales clientes:** permite identificar oportunidades comerciales todavía no convertidas en solicitudes formales y conservar la trazabilidad cuando una oportunidad se recupera y se convierte en una solicitud.

En el ciclo de solicitud, la responsabilidad funcional del MVP termina cuando la solicitud fue entregada correctamente al productor. La negociación, la validación aseguradora, la solicitud posterior de documentación, el cierre comercial, el cobro y la emisión quedan a cargo del productor y de los sistemas externos correspondientes.

El MVP también incluye la consulta de los seguros o servicios contratados y de los datos básicos disponibles de las pólizas. La visualización o descarga del PDF no queda comprometida en esta etapa, porque depende de que Federación Patronal o la fuente correspondiente permita obtenerlo.

### Definición breve del producto

> Portal para publicar productos aseguradores, recibir y derivar solicitudes de forma segura y trazable, recuperar oportunidades comerciales no convertidas y permitir que cada asegurado consulte los seguros o servicios que tiene contratados y la información básica disponible de sus pólizas.

### Principios fundacionales

- El portal diferencia el ciclo de solicitud del ciclo de consulta de seguros o servicios contratados.
- El sistema gestiona solicitudes, pero no realiza ventas, contrataciones, cobros ni emisiones automáticas.
- Cada producto puede requerir un formulario diferente y MAPS debe poder configurarlo sin modificar código, preservando la versión respondida por cada cliente.
- El cliente debe tener una cuenta para enviar una solicitud y recuperar sus borradores; el momento exacto de autenticación se definirá en Fase 2.
- Toda solicitud puede permanecer como borrador hasta que el cliente decida enviarla.
- Una solicitud formal y un potencial cliente representan conceptos distintos y no deben duplicarse automáticamente.
- Un borrador abandonado sólo podrá originar un potencial cliente cuando existan datos de contacto suficientes, consentimiento válido y reglas previamente aprobadas.
- Cuando un potencial cliente se convierta en solicitud formal, deberá conservarse la trazabilidad `Lead → InsuranceRequest` y la oportunidad dejará de permanecer activa.
- La asignación del productor es manual y responsabilidad de un administrador.
- La derivación al productor debe ser automática, segura y trazable.
- WhatsApp será el canal inicial y preferente del MVP, sin impedir que el producto incorpore email u otros canales en su evolución.
- La notificación al productor debe contener un resumen mínimo y un enlace seguro; la información completa y las fotografías no deben exponerse directamente en el mensaje.
- Después de la derivación, el contacto y el cierre de la venta se realizan fuera del sistema.
- El asegurado puede consultar, como mínimo, qué seguros o servicios tiene contratados y los datos básicos disponibles de sus pólizas.
- La visualización o descarga del PDF de la póliza queda condicionada a la disponibilidad de una fuente técnica válida.
- Los precios de los paquetes son fijos y pueden mostrarse en el catálogo, aunque no representan un importe que se cobre desde la plataforma.
- Las decisiones sobre formularios, datos personales, archivos y consentimientos deben quedar versionadas y ser auditables.

### Frontera de responsabilidad entre fases

| Fase | Responsabilidad principal |
| --- | --- |
| **Fase 0** | Visión completa del producto, problema, actores generales, mapa de capacidades, principios confirmados, alcance del MVP frente a la evolución, restricciones, dependencias, riesgos y gobierno. |
| **Fase 1** | Discovery detallado de procesos, datos, productos, reglas, requerimientos, responsabilidades operativas y modelo de dominio inicial. |
| **Fase 2** | Journeys, arquitectura de información, navegación, wireframes, wireflows y decisiones de UX, incluido el momento exacto de autenticación. |
| **Fase 3** | Arquitectura, autenticación y autorización detalladas, persistencia, integraciones, adaptadores, almacenamiento, estados técnicos y contratos de API. |

Las decisiones funcionales ya confirmadas se conservan en Fase 0 como principios y capacidades. Su especificación detallada y su mecanismo de implementación deberán cerrarse en la fase correspondiente.

## 0.2 Participantes y responsabilidades

### MAPS

MAPS es el propietario funcional del producto y de la información comercial publicada. Debe definir los seguros disponibles, sus precios, coberturas, exclusiones, requisitos, formularios, textos legales y productores habilitados.

Roles mínimos:

- **Responsable comercial:** define los productos, precios, coberturas, exclusiones, requisitos y contenido comercial.
- **Administrador del portal:** administra productos y formularios, revisa las solicitudes recibidas, selecciona al productor y ejecuta o supervisa la asignación. La gestión de solicitudes formales deberá permanecer separada de la gestión de potenciales clientes en la Intranet.
- **Productor de seguros:** recibe la derivación por el canal habilitado —WhatsApp como canal inicial del MVP—, consulta la solicitud mediante el enlace seguro, contacta al cliente y gestiona el proceso comercial por fuera de la plataforma.
- **Responsable de aprobación:** valida las decisiones finales de alcance, contenido, operación y cumplimiento legal.

En organizaciones pequeñas, una persona puede desempeñar más de un rol, pero cada decisión o actividad debe tener un responsable identificable.

### Kondor

- **PM / BA:** releva necesidades, mantiene la Fase 0, ordena el backlog, documenta decisiones y coordina las validaciones con MAPS.
- **Tech Lead:** define la arquitectura, las políticas técnicas y de seguridad, y revisa la calidad de la implementación.
- **Desarrollo frontend:** implementa catálogo, autenticación, experiencia de formularios, borradores, área del cliente y panel administrativo.
- **Desarrollo backend / infraestructura:** implementa autenticación, persistencia, formularios configurables, archivos, asignaciones, canales de derivación, auditoría, despliegue y observabilidad según las decisiones de Fase 3.

Los roles de Kondor pueden rotar o superponerse. Cada tarea debe conservar un responsable y un criterio de aceptación.

## 0.3 Visión objetivo y definición de éxito

### Visión objetivo del producto completo

El producto completo busca concentrar en un mismo portal la captación de solicitudes y la consulta de la relación vigente del asegurado con MAPS, sin convertir la plataforma en un sistema de cobro o emisión.

Los tres ciclos de negocio son:

`Solicitud → MAPS → productor → gestión comercial externa`

`Administrador → cliente/servicio o póliza → Portal del Asegurado → consulta`

`Interés no convertido → Lead/Potencial cliente → recuperación → InsuranceRequest`

La visión objetivo podrá incorporar capacidades posteriores al MVP, pero cada una requerirá priorización y análisis de impacto. La definición del producto completo no implica que todas sus capacidades deban implementarse en la primera entrega.

### Delimitación del MVP

| Capacidad | Decisión para el MVP |
| --- | --- |
| Catálogo público de seguros | Incluida. |
| Solicitudes, archivos y borradores recuperables | Incluidos. |
| Cuenta mediante email y contraseña | Obligatoria para enviar y recuperar; el momento exacto de autenticación se define en Fase 2. |
| Asignación manual y derivación al productor | Incluidas; WhatsApp será el canal inicial del MVP y los canales adicionales quedarán como evolución. |
| Consulta de seguros o servicios contratados | Incluida con la información básica disponible. |
| Gestión administrativa de clientes y asociación de pólizas existentes | Incluida en el nivel necesario para alimentar la consulta del asegurado. |
| Integración con Potenciales clientes de la Intranet | Incluida con alcance mínimo, consentimiento, prevención de duplicados y trazabilidad de conversión. |
| Visualización o descarga del PDF de la póliza | No comprometida hasta confirmar disponibilidad técnica. |
| Cobro, contratación y emisión automática | Excluidos. |

La primera versión será exitosa cuando MAPS pueda completar el siguiente ciclo de solicitud:

1. Un administrador publica un producto con precio fijo, coberturas, exclusiones y requisitos.
2. MAPS configura y publica el formulario particular del producto.
3. Un cliente inicia una solicitud y dispone de una cuenta antes del envío definitivo, en el punto de autenticación que se defina durante Fase 2.
4. El sistema conserva el progreso como borrador asociado de forma segura a su identidad.
5. El cliente recupera el borrador, completa la información y envía la solicitud.
6. MAPS recibe la solicitud en una bandeja de administración.
7. Un administrador selecciona manualmente un productor.
8. El sistema deriva automáticamente la solicitud mediante WhatsApp como canal inicial, enviando un resumen y un enlace seguro.
9. La plataforma registra el resultado conocido de la derivación.
10. El productor accede a una vista segura de la solicitud y continúa el contacto por fuera del portal.

En paralelo, MAPS debe poder registrar o asociar un cliente con sus seguros o servicios contratados, y el asegurado debe poder consultar la información básica disponible de sus pólizas.

El MVP también deberá integrar las oportunidades elegibles con Potenciales clientes de la Intranet sin duplicar las solicitudes formales y conservando la trazabilidad cuando un lead se convierta en una solicitud.

El éxito del MVP no depende de que una nueva venta se cierre, ya que ese resultado ocurre fuera del sistema. Los indicadores principales serán la finalización de solicitudes, el tiempo hasta la asignación, la entrega correcta al productor y la disponibilidad coherente de la información contractual mostrada al asegurado.

## 0.4 Problemas que el proyecto busca resolver

- Los formularios genéricos no contemplan los datos particulares de cada seguro.
- El asegurado no dispone de un espacio unificado para consultar qué seguros o servicios tiene contratados y los datos básicos de sus pólizas.
- La información puede quedar dispersa entre planillas, correos, fotografías y distintos canales de comunicación.
- El cliente puede perder su progreso si no completa el trámite en una sola sesión.
- MAPS puede perder oportunidades comerciales cuando existe interés y datos de contacto, pero el usuario no llega a enviar una solicitud formal.
- MAPS necesita conocer qué solicitudes están nuevas y cuáles esperan asignación.
- La distribución manual de información puede generar demoras, omisiones o envíos al productor equivocado.
- El productor necesita recibir la información suficiente para iniciar el contacto sin exponer datos sensibles en la notificación.
- MAPS necesita poder actualizar los formularios sin requerir un despliegue de software por cada cambio.
- Debe existir trazabilidad sobre qué versión del formulario respondió el cliente, cuándo envió la solicitud, quién asignó al productor y si la derivación fue realizada.

## 0.5 Alcance funcional del MVP

Esta sección identifica capacidades funcionales del MVP. Los procesos y datos detallados se relevarán en Fase 1, las decisiones de interacción y navegación se resolverán en Fase 2 y los mecanismos técnicos se definirán en Fase 3.

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

La cuenta es obligatoria para enviar una solicitud y recuperar borradores. Los datos y borradores deberán quedar asociados de forma segura a una identidad. El momento exacto en que se solicitará el registro o la autenticación se definirá en Fase 2, comparando la fricción de acceso con la trazabilidad y la recuperación del progreso.

### C. Formularios configurables por producto

El MVP deberá permitir que MAPS configure y publique formularios diferentes para cada producto sin requerir modificaciones de código.

Como principios funcionales de Fase 0:

- cada producto podrá utilizar un formulario particular;
- MAPS contará con autonomía administrativa para configurar y publicar formularios dentro del alcance que se confirme;
- las respuestas conservarán la versión exacta del formulario utilizado;
- una modificación posterior no podrá alterar retrospectivamente una solicitud enviada;
- los formularios podrán solicitar datos y archivos de acuerdo con las necesidades de cada producto.

La Fase 0 no fija todavía un catálogo cerrado de tipos de campo, reglas condicionales, páginas, duplicación, previsualización ni otras funciones del constructor. En Fase 1 se relevarán los formularios, campos, validaciones y reglas reales; en Fase 2 se definirá la experiencia y el grado de autonomía administrativa; y en Fase 3 se decidirá si la solución será basada en esquemas, un constructor parcial o un constructor completo.

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
- Consulta del estado funcional de la derivación.
- Reintento ante errores de envío.
- Registro mínimo de auditoría.

### F. Administración de productores

- Alta, edición, activación y desactivación de productores.
- Nombre y datos identificatorios mínimos.
- Datos de contacto necesarios para el canal de derivación habilitado; para el MVP, número de WhatsApp validado.
- Productos o ramos relacionados, con carácter informativo.
- Estado habilitado o inhabilitado para recibir derivaciones.

La relación entre productos y productores no produce una asignación automática. El administrador siempre seleccionará manualmente al destinatario.

### G. Derivación automática y trazable

La derivación se ejecutará después de la confirmación de la asignación administrativa. WhatsApp será el canal inicial y preferente confirmado para el MVP, pero la capacidad funcional se define de forma general para no acoplar permanentemente el producto a un único canal.

La notificación al productor deberá contener únicamente un resumen mínimo:

- identificador de la solicitud;
- producto solicitado;
- nombre del cliente, cuando la política de privacidad aprobada lo permita;
- fecha de recepción;
- enlace seguro para consultar el expediente.

Para WhatsApp sólo podrá utilizarse una integración oficial y autorizada. La definición de proveedor, plantillas, credenciales, reintentos, estados técnicos y arquitectura de adaptadores se realizará en Fase 3.

El sistema deberá conservar trazabilidad funcional del destinatario, el canal utilizado, el momento de la derivación y el resultado conocido. Email u otros canales se contemplan como evolución. La selección de canal por parte del administrador sólo se incorporará al MVP si MAPS confirma expresamente esa necesidad.

### H. Acceso seguro del productor

El enlace enviado al productor abrirá una vista de sólo lectura con la solicitud completa y sus archivos. No constituye un panel general de productores.

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

### I. Portal del Asegurado y gestión de información contractual

- Consulta de los seguros o servicios que el cliente tiene contratados.
- Visualización de los datos básicos disponibles, como producto o ramo, número de póliza, estado y vigencia, cuando la fuente los proporcione.
- Gestión administrativa mínima para registrar clientes o asegurados y asociarles servicios contratados o pólizas existentes.
- Separación entre la identidad utilizada para autenticarse y el registro comercial del cliente o asegurado.
- Acceso restringido de cada cliente exclusivamente a su propia información.

En Fase 1 deberán relevarse la fuente de los datos, los campos disponibles, su calidad, su frecuencia de actualización y el procedimiento administrativo de alta o asociación. La visualización y descarga del PDF sólo se incorporarán si existe una fuente técnica válida; su ausencia no impedirá mostrar la información básica disponible.

Esta capacidad no permite emitir, modificar, renovar ni cobrar pólizas desde el portal.

### J. Integración con Potenciales clientes

El MVP deberá convivir con la sección **Potenciales clientes** de la Intranet, diferenciando expresamente:

- **Solicitud formal (`InsuranceRequest`):** formulario que el cliente completó y envió.
- **Potencial cliente (`Lead`):** oportunidad comercial todavía no convertida en una solicitud formal.
- Una solicitud enviada no se duplicará automáticamente como potencial cliente.
- Un borrador abandonado sólo podrá originar un lead si contiene datos de contacto suficientes y existe consentimiento válido para el tratamiento y contacto comercial.
- Cuando un lead se recupere y el usuario envíe la solicitud, se conservará la relación `Lead → InsuranceRequest` y el lead dejará de estar activo como oportunidad.
- La gestión y asignación de solicitudes formales permanecerá separada de la gestión y asignación de potenciales clientes.
- El cotizador no forma parte de esta integración ni del MVP.

En Fase 1 se definirán el momento de abandono, los datos mínimos, el consentimiento, las reglas de duplicación, la información transferida y los responsables operativos. En Fase 2 se diseñará el recorrido de recuperación. En Fase 3 se definirán relaciones, eventos, APIs y el mecanismo de integración con la Intranet.

## 0.6 Flujos funcionales de referencia

```text
Ciclo de solicitud:
Catálogo de seguros
→ selección del producto
→ inicio del formulario e identificación/autenticación en el punto definido durante Fase 2
→ guardado como borrador asociado de forma segura
→ recuperación y continuación
→ validación y envío de la solicitud
→ confirmación al cliente
→ bandeja de solicitudes de MAPS
→ asignación manual por administrador
→ derivación automática mediante WhatsApp como canal inicial
→ acceso del productor mediante enlace seguro
→ contacto y cierre comercial fuera del sistema

Ciclo del asegurado:
Administrador
→ registro o asociación de cliente con servicio contratado o póliza
→ Portal del Asegurado
→ consulta de información básica disponible
→ visualización o descarga del PDF sólo si la fuente técnica lo permite

Ciclo de potenciales clientes:
Interés no convertido o borrador elegible
→ validación de datos mínimos y consentimiento
→ Lead/Potencial cliente en la Intranet
→ recuperación comercial
→ envío de solicitud formal
→ trazabilidad Lead → InsuranceRequest
→ cierre del lead como oportunidad activa
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

- Usuario de autenticación.
- Cliente o asegurado.
- Relación entre usuario y cliente o asegurado.
- Administrador.
- Productor.
- Producto asegurador.
- Servicio contratado o póliza y sus datos básicos disponibles.
- Potencial cliente o `Lead`.
- Relación de conversión entre `Lead` e `InsuranceRequest`.
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
- Derivación.
- Canal de derivación.
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
- Modificación, renovación o cobro de pólizas desde el portal.
- Visualización o descarga del PDF de la póliza mientras no exista una fuente técnica confirmada.
- Seguimiento del proceso comercial después de la derivación.
- Registro del resultado final de la venta.
- CRM de productores.
- Panel operativo completo para productores.
- Conversaciones de WhatsApp dentro del portal.
- Asignación automática de productores.
- Integración profunda con Federación Patronal o SELF.
- Cotizador, cotización variable o simulación automática.
- Recomendaciones mediante inteligencia artificial.
- Dashboards analíticos avanzados.
- Aplicación móvil nativa.

Estas capacidades sólo podrán incorporarse mediante una nueva definición de alcance y análisis de impacto.

## 0.9 Restricciones y dependencias

- La venta se cierra fuera del sistema y depende de la gestión del productor.
- El sistema no puede afirmar que una solicitud equivale a una contratación.
- Los paquetes tendrán precios fijos visibles, pero el precio debe poder actualizarse y conservar historial cuando sea necesario.
- MAPS debe proporcionar la información completa de cada producto y formulario.
- WhatsApp, como canal inicial del MVP, depende de una integración oficial y autorizada; sus credenciales, plantillas, proveedor y comportamiento técnico se definirán en Fase 3.
- Las fotografías y documentos tendrán una permanencia corta; el plazo exacto debe ser definido por MAPS y validado legalmente.
- Los textos legales, consentimientos y política de privacidad todavía requieren definición y aprobación.
- La cuenta obligatoria mejora la trazabilidad y la recuperación de borradores, pero el momento de solicitarla puede generar fricción y deberá validarse en Fase 2.
- La consulta contractual depende de relevar la fuente, calidad, disponibilidad y actualización de los datos de clientes, servicios y pólizas.
- La generación o transferencia de potenciales clientes depende de consentimiento válido, reglas de abandono, prevención de duplicados y coordinación con la Intranet.
- La disponibilidad del PDF de la póliza depende de las capacidades de Federación Patronal o de la fuente correspondiente.
- La asignación manual puede convertirse en un cuello de botella si no se establece un responsable y un tiempo de atención.
- El grado de autonomía de los formularios configurables puede modificar significativamente el costo y deberá cerrarse progresivamente en las Fases 1, 2 y 3.

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
- Consentimiento específico y verificable antes de utilizar datos de un borrador para contacto comercial o generación de un potencial cliente.
- Registro de versión, fecha, hora y usuario asociado a cada consentimiento.
- Política de retención y eliminación de borradores, solicitudes y archivos.
- Backups y procedimiento de recuperación.
- Entornos separados de desarrollo, prueba y producción.
- Gestión segura de secretos y credenciales de los canales de derivación.
- Logs sin exposición innecesaria de datos personales.

## 0.11 Notificaciones del MVP

### Cliente

- Verificación de email.
- Recuperación de contraseña.
- Confirmación de solicitud recibida.

### Administrador

- Nueva solicitud enviada, si MAPS decide habilitar el aviso.
- Error de derivación.

### Productor

- Nueva solicitud asignada, mediante WhatsApp como canal inicial automático con resumen y enlace seguro.

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
- Potencial cliente creado.
- Potencial cliente convertido en solicitud.

Indicadores iniciales:

- Porcentaje de solicitudes iniciadas que llegan a enviarse.
- Tiempo medio entre envío y asignación.
- Porcentaje de derivaciones exitosas.
- Productos con más solicitudes.
- Porcentaje de potenciales clientes que se convierten en solicitudes formales.
- Campos o pasos con mayor abandono, siempre que la instrumentación respete la privacidad aprobada.

El MVP no podrá medir ventas cerradas ni conversión final a póliza, porque el resultado comercial no vuelve al sistema.

## 0.13 Riesgos principales

| Riesgo | Consecuencia | Tratamiento inicial |
| --- | --- | --- |
| Alcance ilimitado de los formularios configurables | Demoras y crecimiento no controlado | Relevar necesidades reales en Fase 1, validar autonomía en Fase 2 y decidir la solución en Fase 3 |
| Datos o formularios incompletos por producto | Reimplementaciones y solicitudes inválidas | Exigir ficha funcional aprobada antes de publicar |
| Fricción por registro obligatorio | Abandono durante el proceso | Prototipar y validar en Fase 2 el momento de autenticación |
| Datos contractuales incompletos o desactualizados | Información incorrecta para el asegurado | Relevar fuente, calidad, responsables y frecuencia de actualización en Fase 1 |
| Leads sin consentimiento o duplicados | Riesgo legal, mala experiencia y datos comerciales inconsistentes | Exigir consentimiento, reglas de abandono, deduplicación y trazabilidad antes de activar la integración |
| PDF de póliza no disponible | El cliente no puede visualizarlo ni descargarlo | Mantener la consulta de datos básicos y no comprometer el PDF hasta validar la fuente |
| Exposición de datos mediante la notificación o el enlace | Incidente de privacidad | Resumen mínimo, enlace temporal, revocación y auditoría |
| Fallas o restricciones del canal inicial de derivación | Solicitudes no derivadas | Trazabilidad, procedimiento alternativo y definición de reintentos/adaptadores en Fase 3 |
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
- FORMULARIOS.
- SOLICITUDES.
- BORRADORES.
- ARCHIVOS.
- ADMIN.
- PRODUCTORES.
- ASIGNACIONES.
- CLIENTES.
- PÓLIZAS.
- MIS PÓLIZAS.
- LEADS.
- POTENCIALES CLIENTES.
- DERIVACIONES.
- WHATSAPP.
- NOTIFICACIONES.
- AUDITORÍA.
- MÉTRICAS.
- INFRA.
- UX/UI.

Las etiquetas CARRITO, CHECKOUT y PAGOS dejan de pertenecer al MVP. MIS PÓLIZAS identifica la consulta básica de seguros o servicios contratados incluida en la primera versión.

### Reglas de decisión

- Toda decisión relevante debe registrarse por escrito.
- Los pedidos recibidos por chat o audio deben convertirse en una tarea o decisión documentada.
- Ninguna funcionalidad crítica se desarrolla sin definición mínima y criterio de aceptación.
- Todo cambio de alcance debe analizar su impacto en tiempo, costo, seguridad y cronograma.
- Los formularios de productos deben ser aprobados por MAPS antes de implementarse o publicarse.
- Las decisiones relacionadas con datos personales, archivos, consentimientos o canales de derivación deben quedar documentadas.

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

Los criterios de terminado específicos para formularios se definirán después de relevar sus necesidades reales, conservando como condición mínima el versionado y la asociación correcta con el producto.

## 0.16 Información y accesos que MAPS debe proporcionar

- Lista de los primeros seguros que integrarán el MVP.
- Ficha de cada producto: nombre, descripción, precio, coberturas, exclusiones y requisitos.
- Campos, opciones, reglas, validaciones y textos de ayuda de cada formulario inicial.
- Fotografías o archivos solicitados por producto.
- Definición de qué archivos son obligatorios y cuáles puede pedir luego el productor.
- Textos legales, política de privacidad y consentimientos aprobados.
- Lista inicial de administradores.
- Lista inicial de productores y datos de contacto requeridos; para el MVP, números de WhatsApp verificados.
- Responsable de mantener productos, formularios y productores.
- Para la definición de Fase 3, disponibilidad de cuenta oficial, número, credenciales y plantillas requeridas por la integración autorizada de WhatsApp.
- Logo, colores, tipografías, imágenes y tono de comunicación.
- Dominio, DNS y accesos de infraestructura necesarios.
- Dirección de correo desde la cual se enviarán notificaciones a clientes.
- Fuente disponible de clientes, seguros contratados y pólizas existentes.
- Campos contractuales disponibles, calidad conocida, frecuencia de actualización y responsable de mantenimiento.
- Procedimiento para dar de alta o asociar clientes con servicios o pólizas existentes.
- Reglas actuales de Potenciales clientes en la Intranet, responsables, datos requeridos y forma de asignación.
- Definición legal y operativa del consentimiento para recuperar oportunidades comerciales.
- Acceso o contrato de integración necesario con la sección Potenciales clientes.
- Confirmación técnica sobre la disponibilidad del PDF de las pólizas y la forma autorizada de obtenerlo.

## 0.17 Decisiones todavía pendientes

Estas preguntas no invalidan la baseline funcional, pero deben resolverse antes de cerrar el diseño o publicar el sistema:

1. ¿Cuáles son los productos exactos de la primera versión?
2. ¿Qué campos, reglas condicionales y fotografías requiere cada producto?
3. ¿Cuántas fotografías pueden cargarse, en qué formatos y con qué tamaño máximo?
4. ¿Durante cuánto tiempo se conservarán los borradores sin actividad?
5. ¿Durante cuánto tiempo se conservarán las solicitudes y fotografías después de la derivación?
6. ¿Qué textos y consentimientos debe aceptar el cliente y quién los aprueba?
7. ¿Qué datos puede incluir la notificación al productor sin incumplir las políticas de privacidad?
8. ¿Cuánto tiempo será válido el enlace seguro y qué validación adicional deberá utilizar?
9. ¿Cuál será el procedimiento alternativo cuando el canal inicial de derivación no pueda entregar la solicitud?
10. ¿Quién controla diariamente la bandeja de solicitudes sin asignar?
11. ¿En cuánto tiempo máximo debería realizarse la asignación manual?
12. ¿Puede un administrador reasignar una solicitud ya derivada y qué auditoría requiere?
13. ¿Cuándo se elimina o anonimiza una cuenta de cliente?
14. ¿Cómo se tratarán solicitudes duplicadas del mismo cliente para el mismo producto?
15. ¿Se permitirá que un cliente cancele una solicitud enviada antes de su derivación?
16. ¿En qué punto del recorrido se solicitará el registro o la autenticación?
17. ¿Cuál es la fuente de los datos de clientes, servicios contratados y pólizas, y con qué frecuencia se actualiza?
18. ¿Federación Patronal u otra fuente permite obtener el PDF de las pólizas para su visualización o descarga?
19. ¿La selección del canal de derivación debe formar parte del MVP o quedar como evolución posterior?
20. ¿Cuándo se considera que un borrador fue abandonado?
21. ¿Qué datos mínimos y qué consentimiento permiten crear un potencial cliente?
22. ¿Cómo se detectarán y evitarán leads duplicados?
23. ¿Qué datos se transferirán a Potenciales clientes y quién será responsable de su gestión?
24. ¿Cómo se cerrará o actualizará el lead cuando se convierta en una solicitud formal?

## 0.18 Resultado esperado de la Fase 0

La Fase 0 se considerará aprobada cuando Kondor y MAPS hayan aceptado formalmente:

- la redefinición de e-commerce a Portal de Seguros MAPS;
- la visión objetivo del producto completo y la delimitación del MVP frente a su evolución;
- la frontera de responsabilidades entre las Fases 0, 1, 2 y 3;
- el límite del ciclo de solicitud en la derivación al productor;
- la coexistencia del ciclo de solicitud con la consulta de seguros o servicios contratados;
- la integración controlada con Potenciales clientes, diferenciando `Lead` de `InsuranceRequest` y conservando la trazabilidad de conversión;
- los flujos funcionales de referencia del cliente, el administrador, el asegurado y la recuperación de oportunidades;
- la cuenta obligatoria para enviar y recuperar solicitudes, dejando su momento exacto para Fase 2;
- la consulta básica de servicios contratados y pólizas, sin comprometer todavía el PDF;
- la asignación manual del productor;
- WhatsApp como canal inicial y preferente del MVP, dentro de una capacidad de derivación automática y trazable;
- el contenido funcional mínimo de la notificación y el acceso mediante enlace seguro, dejando la implementación detallada para Fase 3;
- la capacidad de configurar formularios diferentes por producto sin modificar código, dejando su alcance detallado para las Fases 1, 2 y 3;
- los módulos incluidos y excluidos;
- los roles y responsabilidades;
- los riesgos y dependencias principales;
- la lista de decisiones pendientes;
- los insumos necesarios para iniciar análisis detallado, diseño y backlog.

La aprobación de esta baseline habilitará el discovery detallado, la definición de journeys, la arquitectura, la EAP, las épicas, las historias de usuario y los TDD. El backlog anterior no debe utilizarse como fuente vigente para módulos de pago, checkout, contratación automática o emisión.
