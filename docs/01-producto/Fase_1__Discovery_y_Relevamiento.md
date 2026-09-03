# Fase 1 - Discovery y Relevamiento

> **Documento vivo.** Convierte la baseline funcional aprobada en conocimiento operativo verificable. No define wireframes, flujos de interfaz, arquitectura, modelo físico de datos ni integraciones concretas: esas decisiones corresponden a Fase 2 y Fase 3.

| Dato | Definición |
| --- | --- |
| Proyecto | Portal de Seguros MAPS |
| Fase | 1 - Discovery y Relevamiento |
| Estado | En curso |
| Insumo rector | Fase 0 mergeada y discovery consolidado con MAPS |
| Fecha de inicio documental | 2 de septiembre de 2026 |

## 1. Objetivo

Construir una base funcional y de negocio verificable para el Portal de Seguros MAPS. Al cierre de la fase debe estar claro:

```text
cómo opera MAPS
  -> qué datos y reglas necesita el Portal
  -> qué conceptos de dominio existen y se relacionan
  -> qué requerimientos pasan a diseño (F2) y arquitectura (F3)
```

La fase no busca rediseñar la propuesta ni implementar funcionalidades. Busca reemplazar supuestos por evidencia, registrar explícitamente lo que todavía no se sabe y dejar un alcance apto para diseñar y estimar sin inventar comportamiento.

## 2. Alcance de la fase

### Incluye

- Consolidación del conocimiento vigente de Fase 0 y de las reuniones de discovery.
- Relevamiento funcional de productos, formularios, solicitudes, potenciales clientes, asegurados y pólizas.
- Modelado de procesos, reglas de negocio, excepciones, actores y responsabilidades.
- Inventario **read-only** de la PostgreSQL existente de MAPS cuando se habilite el acceso.
- Modelo conceptual inicial y catálogo preliminar de requerimientos funcionales y no funcionales.
- Registro maestro de decisiones, dependencias, hipótesis y pendientes.

### No incluye

- Wireframes, journeys, arquitectura de información y detalle de la experiencia para presentar registro/login obligatorio: Fase 2.
- Elección de stack, esquema físico, APIs, integración concreta, proveedor, colas, almacenamiento, estrategia de sincronización o seguridad técnica detallada: Fase 3.
- Construcción, migración, escritura, modificación o limpieza de la base de datos MAPS.
- Validación jurídica definitiva de textos, consentimientos, retenciones o políticas; F1 identifica la necesidad y el responsable de aprobación.

## 3. Entradas desde Fase 0

La Fase 1 toma como baseline el cambio de enfoque desde e-commerce hacia un portal operativo de seguros. Se preservan como punto de partida los siguientes hallazgos; si surge evidencia contradictoria, se registrará como cambio controlado y no se reinterpretará silenciosamente.

| Hallazgo de partida | Estado | Tratamiento en F1 |
| --- | --- | --- |
| El Portal gestiona solicitudes; no cobra, no hace checkout, no emite ni confirma contratación automática. | CONFIRMADO | Delimitar formularios, estados y frontera con la gestión comercial externa. |
| Los productos requieren formularios particulares. Una `InsuranceRequest` existe desde el inicio autenticado en **BORRADOR** y sólo se presenta formalmente al confirmarse el envío a **ENVIADA**. | CONFIRMADO | Relevar campos, reglas, adjuntos y versión funcional por producto. |
| Registro/login es obligatorio antes de crear una solicitud; el borrador pertenece a una cuenta autenticada. | CONFIRMADO, cambio controlado respecto de F0 | F2 define sólo copy, transición, pantalla/modal y retorno al producto. |
| La asignación del productor es manual. | CONFIRMADO | Precisar responsable, criterios, tiempos, reasignación y trazabilidad. |
| Email transaccional reemplaza a WhatsApp como canal inicial del MVP para la derivación trazable. | CONFIRMADO, cambio controlado respecto de F0 | Validar destinatario, resumen autorizado, contingencia y operación; proveedor, estados técnicos y reintentos son F3. |
| `Lead`/Potencial Cliente no es una `InsuranceRequest`/Solicitud. | CONFIRMADO | Modelar creación, recuperación, conversión y no duplicación. |
| Existe un ciclo de asegurado/pólizas además del ciclo de solicitud. | CONFIRMADO | Relevar datos visibles, administración, asociación y fuentes disponibles. |
| MAPS dispone de una PostgreSQL existente que podrá inspeccionarse en modo read-only. | CONFIRMADO | Hacer discovery de datos; no decidir aún la integración. |
| El PDF de póliza depende de que exista una fuente disponible. | PENDIENTE DATOS | Identificar disponibilidad, origen, permisos y calidad; no prometerlo. |

### Fuente histórica y límite de interpretación

Materiales anteriores que describen checkout, pagos, contratación automática, emisión automática o un constructor visual completo no son definición vigente por sí solos. En F1 se consideran únicamente como contexto histórico o como hipótesis a validar. Está confirmada la autonomía administrativa básica para configurar y publicar formularios por producto sin cambios de código; F1 releva campos y reglas, F2 define experiencia y profundidad de autonomía, y F3 define schema/builder e implementación.

## 4. Metodología y estados de incertidumbre

Todo hallazgo, regla y requerimiento de este documento debe conservar uno de estos estados:

| Estado | Significado | Acción esperada |
| --- | --- | --- |
| **CONFIRMADO** | Aprobado explícitamente por MAPS o establecido por la Fase 0 mergeada. | Usar como restricción de análisis. |
| **PENDIENTE MAPS** | Requiere decisión, explicación operativa o aprobación de MAPS. | Formular pregunta, responsable y fecha objetivo. |
| **PENDIENTE DATOS** | Depende de evidencia de PostgreSQL, archivos, sistemas externos o calidad de datos. | Inspeccionar read-only y documentar evidencia. |
| **DIFERIDO F2/F3** | El qué está suficientemente identificado, pero el cómo de UX o técnico no corresponde a F1. | Entregar una decisión de diseño/arquitectura acotada. |

Reglas de trabajo:

1. Una inferencia no pasa a ser requisito por repetición.
2. Una respuesta de datos no implica una decisión de integración.
3. Un estado funcional no se mezcla con estados internos de una integración técnica.
4. Cada pendiente debe tener una pregunta verificable, dueño y destino; no se cerrará con “a definir”.
5. La evidencia se conservará con fuente y fecha en el registro de decisiones/minutas del proyecto.

## 5. Discovery consolidado

### 5.1 Ciclos funcionales

El Portal se analiza como tres ciclos relacionados, pero diferentes:

```text
Solicitud
Catálogo público -> iniciar solicitud -> registro/login -> InsuranceRequest (BORRADOR) -> completar -> envío confirmado (ENVIADA) -> MAPS -> productor -> gestión comercial externa

Potencial cliente
Interés elegible / borrador abandonado / contacto -> Lead en la sección existente **Potenciales clientes** de la Intranet -> recuperación -> posible Solicitud

Asegurado y pólizas
Cliente/asegurado -> asociación o disponibilidad de pólizas/servicios -> consulta de información disponible
```

Una solicitud enviada no genera automáticamente un lead duplicado. Si un lead deriva luego en una solicitud formal, la relación debe preservar origen, eventos y responsable comercial según las reglas que MAPS confirme. El borrador es una `InsuranceRequest` en **BORRADOR**, aunque todavía no constituye una presentación formal ante MAPS; F3 decide su persistencia técnica, no su significado funcional.

Los estados funcionales confirmados de `InsuranceRequest` son **BORRADOR**, **ENVIADA**, **ASIGNADA**, **DERIVADA** y **CANCELADA**. Los estados técnicos de entrega de email —pendiente, aceptado/enviado, entregado, rebotado o fallido— son independientes de esos estados funcionales.

### 5.2 Productos iniciales de referencia

Como referencia del discovery aparecen Combinado Familiar, Incendio, Mascotas y Ahorro/Retiro. La lista final de MVP, sus nombres oficiales y su contenido no se consideran cerrados hasta recibir ficha funcional de MAPS.

Para cada producto se completará esta ficha. La evidencia comercial existente sirve como insumo de trabajo, pero no equivale a una especificación funcional aprobada:

| Campo de relevamiento | Evidencia disponible | Estado de validación |
| --- | --- | --- |
| Nombre comercial y ramo | Documento comercial para Combinado Familiar, Incendio, Mascotas y Ahorro/Retiro. | PENDIENTE MAPS - validar nombre y ramo oficial. |
| Descripción, coberturas, exclusiones y variantes | Parciales en documento comercial. | PENDIENTE MAPS - validar vigencia y transformar en definición funcional. |
| Precio o condición comercial visible | No disponible o inconsistente según producto. | PENDIENTE MAPS. |
| Datos, opciones, validaciones y condiciones del formulario | No disponible. | PENDIENTE MAPS. |
| Adjuntos/fotografías, obligatoriedad y límites | No disponible. | PENDIENTE MAPS. |
| Consentimientos y textos aplicables | No disponible como texto aprobado. | PENDIENTE MAPS/legal. |
| Destino operativo, productor/especialidad y criterio de asignación | No disponible como regla operativa aprobada. | PENDIENTE MAPS. |
| Datos disponibles en sistemas existentes | Sin evidencia read-only todavía. | PENDIENTE DATOS. |

### 5.3 Tensiones de baseline a validar

Esta sección registra tensiones entre la baseline y la evidencia disponible. No modifica Fase 0: si el discovery la contradice, el cambio deberá quedar documentado y aprobado como cambio controlado.

| Tensión | Baseline/evidencia | Pregunta de F1 | Estado |
| --- | --- | --- | --- |
| Precio fijo vs. Ahorro/Retiro | Un precio fijo sólo se muestra con valor vigente, confiable y aplicable; de otro modo se informa evaluación/cotización externa. Cotizador y simulador quedan fuera del MVP. | ¿Qué condición comercial vigente aplica a cada producto particular? | PENDIENTE MAPS |
| Nombre Ahorro vs. Retiro | El material usa “Seguro de Ahorro”, pero su contenido habla de “Seguro de Retiro”. | ¿Cuál es el nombre oficial del producto y cuál debe mostrarse al cliente? | PENDIENTE MAPS |

### 5.4 Fronteras confirmadas

- El resultado de una solicitud no equivale a venta, emisión ni póliza.
- La gestión comercial posterior puede continuar fuera del Portal.
- El Portal del asegurado no presupone todavía importación, sincronización ni acceso directo a Federación Patronal.
- La información histórica de una solicitud debe poder interpretarse en relación con el producto, respuestas, adjuntos y consentimiento que aplicaban al enviarla; la implementación de versionado se define en F3.
- Email transaccional es el canal inicial del MVP por cambio controlado respecto de F0: reduce costo, dependencia de terceros, complejidad operativa y riesgo de integración, conservando asignación, notificación y acceso seguro. WhatsApp queda como evolución posible. Proveedor, adaptadores, credenciales, plantillas, reintentos y estados técnicos quedan en F3.

## 6. Bloques de trabajo

### A. Productos y formularios

**Propósito:** convertir la oferta comercial en fichas funcionales aprobables, sin elegir todavía el diseño de interfaz ni una solución de formularios.

Actividades:

- Completar una ficha por producto inicial.
- Distinguir campos comunes, específicos, opcionales, condicionales y documentales.
- Clasificar reglas: bloqueante, informativa, de cálculo/derivación o pendiente de validación.
- Determinar qué información es necesaria al iniciar, guardar, enviar y derivar.
- Registrar cambios de producto/formulario que deban preservar historial.

Salida: catálogo funcional de productos y matriz de formularios con evidencia, dueño MAPS y estado.

### B. Proceso de solicitud

**Propósito:** describir el proceso real desde el interés hasta la derivación, incluidos casos alternativos.

| Paso | Actor principal | Preguntas a cerrar |
| --- | --- | --- |
| Descubrimiento e inicio | Visitante/cliente | Catálogo público; al iniciar, registro/login obligatorio antes de crear el borrador. F2 define la presentación UX. |
| Borrador | Cliente/sistema | Guardado, recuperación, vencimiento, edición y abandono. |
| Envío | Cliente | Completitud, validaciones, consentimiento y confirmación. |
| Recepción | MAPS | Bandeja, responsable, prioridad, duplicados y observaciones. |
| Asignación | Responsable MAPS | Quién asigna, criterios, plazo, reasignación y auditoría. |
| Derivación | MAPS/sistema | Canal, datos mínimos, resultado esperado, fallback y trazabilidad. |
| Gestión externa | Productor | Frontera de responsabilidad e información que vuelve o no vuelve al Portal. |

Salida: mapa AS-IS cuando exista evidencia suficiente y modelo funcional TO-BE de los ciclos de Solicitud, Potenciales Clientes y Asegurado/Pólizas, con estados de negocio, excepciones y acuerdos de servicio operativos. El AS-IS no se inferirá desde la solución futura.

### C. Potenciales clientes

**Propósito:** preservar la sección existente **Potenciales clientes** de la Intranet como destino funcional de los leads elegibles y como recuperación comercial, no como duplicado de solicitudes formales.

Preguntas de discovery:

- ¿Qué eventos y fuentes pueden crear un lead: `InsuranceRequest` en BORRADOR abandonada, pedido de asesoramiento, campaña, landing u otros?
- ¿Qué datos mínimos, tiempo de inactividad y consentimiento hacen elegible una `InsuranceRequest` en BORRADOR?
- ¿Quién recibe, asigna y trabaja el lead?
- ¿Qué datos se transfieren y qué datos se excluyen por privacidad o calidad?
- ¿Cómo se detecta y resuelve un duplicado?
- ¿Qué estado adopta el lead cuando una solicitud formal se vincula a él?

Salida: política de creación/conversión, mapa de trazabilidad `Lead -> InsuranceRequest` y reglas de no duplicación.

### D. Portal del asegurado y pólizas

**Propósito:** determinar el valor funcional del portal del asegurado y los datos realmente sostenibles.

El mínimo mencionado para consulta incluye ramo, producto, número de póliza, estado y vigencia. Deben verificarse además cliente/asegurado, compañía, productor, renovaciones, servicios, identificadores externos y documentos disponibles. Para habilitar un PDF se relevarán fuente oficial, identificador, relación cliente/póliza/documento, versión, estado, renovaciones, reemplazos, vigencia, frecuencia de actualización y permisos. Si no puede identificarse confiablemente como documento vigente/autorizado, el PDF no se mostrará; ello no impide los datos básicos confiables.

También se relevará el proceso administrativo: alta o identificación del cliente, origen de la póliza, asociación cliente-póliza, corrección de errores, actualización y tratamiento de un asegurado sin cuenta. No se decidirá en F1 si la carga es manual, por importación, sincronización o consumo directo.

Salida: matriz “dato deseado / fuente / calidad / responsable / disponibilidad para MVP” y proceso funcional de administración/consulta.

### E. Inspección PostgreSQL MAPS (read-only)

**Propósito:** conocer evidencia disponible, no diseñar ni modificar una base de datos.

Al habilitarse el acceso, se realizará un informe reproducible con:

- Inventario de schemas, tablas, vistas, claves, relaciones e índices relevantes.
- Candidatos a cliente, póliza, productor, ramo, producto, compañía, vigencia, estado, documentos e identificadores externos.
- Perfil de calidad: nulabilidad, duplicados, formatos, completitud, consistencia y volumen aproximado.
- Proveniencia y frecuencia de actualización: MAPS, Federación, proceso manual, importación u otra aplicación.
- Riesgos de acceso, datos personales, permisos, documentación ausente y ambigüedad semántica.

El resultado esperado es evidencia del tipo “la fuente X parece contener Y bajo estas limitaciones”, nunca “la aplicación usará la base X”. Esa decisión será una alternativa a evaluar en Fase 3.

### F. Usuarios y responsabilidades

| Actor | Necesidad/acción a relevar | Estado |
| --- | --- | --- |
| Visitante/interesado | Descubrir producto, entender requisitos e iniciar un trámite. | CONFIRMADO a nivel de rol |
| Cliente solicitante | Completar, guardar, recuperar y enviar solicitud; consultar sus solicitudes. | CONFIRMADO a nivel de rol |
| Asegurado | Consultar pólizas/servicios asociados disponibles. | CONFIRMADO a nivel de rol |
| Administrador MAPS | Operar catálogo, solicitudes, asignaciones, clientes/pólizas y errores según autorización. | PENDIENTE MAPS para distribución concreta |
| Productor | Recibir caso asignado, acceder a la información autorizada y continuar gestión externa. | CONFIRMADO a nivel de rol |
| Responsable comercial/legal/datos | Aprobar producto, reglas, textos, consentimientos y calidad/fuente. | PENDIENTE MAPS |

Salida: matriz RACI por proceso, con sustitutos, plazos de atención y responsabilidades explícitas.

## 7. Reglas de negocio iniciales

| ID | Regla | Estado |
| --- | --- | --- |
| RN-01 | El Portal registra solicitudes; no ejecuta pago, contratación, emisión ni cobro automático. | CONFIRMADO |
| RN-02 | Cada producto puede requerir datos, validaciones, adjuntos y condiciones diferentes. | CONFIRMADO |
| RN-03 | Una `InsuranceRequest` en **BORRADOR** pertenece a una cuenta autenticada, puede permanecer incompleta según vigencia/retención y no es presentación formal; al confirmar el envío pasa a **ENVIADA**. | CONFIRMADO / plazo PENDIENTE MAPS |
| RN-04 | Una solicitud enviada y un lead son conceptos distintos y no deben duplicarse por defecto. | CONFIRMADO |
| RN-05 | Un `Lead` elegible se integra funcionalmente con la sección existente **Potenciales clientes** de la Intranet y puede vincularse a una solicitud posterior conservando trazabilidad. Su generación/actualización exige contacto suficiente, consentimiento comercial válido y plazo de abandono definido; al enviarse la solicitud, el lead se cierra o convierte según la regla aprobada. | CONFIRMADO / plazo y consentimiento PENDIENTE MAPS |
| RN-06 | La asignación a productor es manual y debe ser atribuible a un responsable autorizado. | CONFIRMADO |
| RN-07 | La derivación debe registrar su resultado funcional y no exponer más datos de los autorizados. | CONFIRMADO |
| RN-08 | Tras asignación manual, el sistema envía email transaccional al email verificado del productor con identificador, producto, fecha, nombre autorizado y enlace seguro. Registra destinatario, fecha/hora, resultado conocido, fallas y reintentos; estados técnicos de entrega no son estados funcionales de `InsuranceRequest`. | CONFIRMADO / implementación DIFERIDA F3 |
| RN-09 | La consulta de pólizas se limita a información realmente disponible, autorizada y asociable al asegurado. | CONFIRMADO |
| RN-10 | La disponibilidad de PDF de póliza no se presume hasta identificar una fuente y permisos válidos. | PENDIENTE DATOS |
| RN-11 | Los cambios posteriores no deben volver ambigua la interpretación histórica de una solicitud enviada. | CONFIRMADO |
| RN-12 | Las notificaciones del Portal son mínimas, relevantes, no redundantes y preferentemente accionables; no se envían emails por cada estado ni confirmaciones in-app redundantes. | CONFIRMADO / implementación DIFERIDA F3 |
| RN-13 | Una `FormVersion` PUBLICADA es inmutable; cada solicitud conserva la versión exacta usada y una enviada no cambia retrospectivamente. | CONFIRMADO |
| RN-14 | Una `InsuranceRequest` en **BORRADOR** continúa con la `FormVersion` de creación; no hay migración automática ni silenciosa. Si la versión se retira expresamente por razones legales, de seguridad, comerciales o de vigencia del producto, el borrador deja de poder utilizarla, el usuario debe ser informado e inicia con la versión vigente. | CONFIRMADO; UX y eventual reutilización de datos DIFERIDO F2/F3 |

## 8. Procesos funcionales a validar

### 8.1 Solicitud formal

```text
Producto elegido
-> inicio de trámite
-> registro/login obligatorio
-> creación de InsuranceRequest (BORRADOR)
-> completar requisitos/consentimientos
-> envío confirmado y transición a ENVIADA
-> recepción MAPS
-> asignación manual
-> derivación trazable
-> gestión comercial externa
```

Casos alternativos a cerrar: abandono, datos inválidos, adjunto faltante, solicitud duplicada, cancelación, observación, productor inhabilitado, reasignación y falla de derivación.

### 8.2 Recuperación de potencial cliente

```text
Interés elegible
-> Lead
-> asignación/seguimiento comercial
-> recuperación
-> Solicitud formal vinculada o cierre del Lead
```

No se presupone automatismo por abandono ni se define aún el tiempo de inactividad.

### 8.3 Asegurado y pólizas

```text
Cliente/asegurado identificado
-> póliza/servicio disponible desde fuente válida
-> asociación administrada o verificada
-> consulta de datos disponibles
-> actualización/corrección según responsable
```

## 9. Matriz maestra de pendientes

| Tema | Estado | Fuente/evidencia | Pregunta o evidencia necesaria | Dueño | Fecha objetivo | Salida esperada |
| --- | --- | --- | --- | --- | --- | --- |
| Productos MVP | PENDIENTE MAPS | Documento comercial previo de cuatro productos. | ¿Qué productos entran y con qué ficha aprobada? | Responsable comercial | Pendiente | Fichas por producto |
| Formularios | PENDIENTE MAPS | No disponible. | ¿Campos, reglas, opciones, adjuntos y consentimientos? | Responsable comercial/legal | Pendiente | Matriz de formularios |
| Autonomía de formularios | CONFIRMADO / DIFERIDO F2/F3 | MAPS configura y publica formularios por producto sin cambios de código. | ¿Qué tipos de campo, validaciones, condiciones, adjuntos, secciones y profundidad de autonomía corresponden? | MAPS + Kondor | Pendiente | Relevamiento F1, UX F2 e implementación F3 |
| Borradores | PENDIENTE MAPS | `InsuranceRequest` en BORRADOR asociada a cuenta autenticada. | ¿Cuándo expiran, se eliminan o son recuperables? | MAPS/legal | Pendiente | Regla de ciclo de vida |
| Leads | PENDIENTE MAPS | Discovery consolidado: Lead distinto de solicitud formal. | ¿Qué los crea, con qué datos y consentimiento, y cuándo? | MAPS comercial/legal | Pendiente | Política de recuperación |
| Conversión Lead | PENDIENTE MAPS | Discovery consolidado. | ¿Cómo se vincula/cierra un lead al crear solicitud formal? | MAPS comercial | Pendiente | Regla de trazabilidad |
| Operación de solicitudes | PENDIENTE MAPS | Baseline: asignación manual. | ¿Quién revisa, asigna, reasigna y en qué plazo? | MAPS | Pendiente | RACI y SLA operativo |
| Canal de derivación | CONFIRMADO / DIFERIDO F3 | Email transaccional inicial; WhatsApp es evolución. | ¿Email verificado, contenido autorizado, contingencia y responsable operativo? | MAPS + Kondor | Pendiente | Validación operativa e implementación F3 |
| Pólizas | PENDIENTE MAPS | Discovery: consulta esperada de datos básicos. | ¿Qué atributos desea ver MAPS y quién los mantiene? | MAPS | Pendiente | Matriz de datos funcional |
| PostgreSQL | PENDIENTE DATOS | Acceso read-only previsto. | ¿Qué tablas/relaciones/calidad/frecuencia existen? | MAPS habilita; Kondor releva | Pendiente | Informe read-only |
| PDF | PENDIENTE DATOS | Fuente no verificada. | ¿Existe fuente, permiso y relación confiable con una póliza? | MAPS/Kondor | Pendiente | Decisión de alcance |
| Identidad | PENDIENTE MAPS / DATOS | No existe mecanismo definido. | ¿Cómo se identifica/relaciona interesado, cliente, cuenta y asegurado existente? | MAPS + Kondor | Pendiente | Regla de vinculación |
| Retención y privacidad | PENDIENTE MAPS | Textos legales no aprobados. | ¿Textos, consentimiento, retención y eliminación aprobados? | Legal/MAPS | Pendiente | Insumo para RF/RNF |
| Métricas | PENDIENTE MAPS | Métricas iniciales no validadas. | ¿Qué eventos e indicadores son útiles y permitidos? | MAPS comercial | Pendiente | Catálogo de métricas |

## 10. Modelo de dominio conceptual inicial

Este modelo expresa conceptos y relaciones de negocio; no implica tablas, clases, APIs ni proveedores.

```text
User
  - puede autenticar/representar a -> Customer / Asegurado

Customer
  - puede iniciar/poseer -> InsuranceRequest
  - puede vincularse con -> Lead existente
  - puede poseer/asociar -> Policy (según fuente válida)

Product
  - define requisitos para -> InsuranceRequest

InsuranceRequest
  - existe desde BORRADOR y referencia una -> FormVersion
  - contiene -> RequestAnswer, Document, Consent
  - puede originarse en -> Lead
  - puede ser asignada a -> Producer
  - genera -> Delivery/Derivación

Lead
  - representa una identidad/contacto comercial parcial
  - puede existir sin -> User o Customer formal
  - puede vincularse posteriormente a -> Customer
  - puede convertirse/vincularse a -> InsuranceRequest
  - puede tener un responsable/productor comercial

Policy
  - se relaciona con -> Customer
  - refiere a Product/Ramo/Compañía según disponibilidad de datos

AuditEvent
  - registra eventos relevantes de las entidades anteriores
```

Conceptos a confirmar o delimitar: `Customer` versus `Asegurado`, una o varias cuentas por cliente, identidad externa, `Policy` versus servicio, fuente de la póliza, y el mecanismo de identidad. F3 decidirá cardinalidades técnicas, persistencia y si la asignación de leads y solicitudes comparte o no infraestructura, entidad o módulo.

## 11. Requerimientos preliminares

Los siguientes requerimientos son intencionalmente funcionales y verificables; no prescriben pantallas ni implementación.

### Funcionales

| ID | Requerimiento | Estado |
| --- | --- | --- |
| RF-SOL-01 | El sistema debe exigir registro/login antes de crear una `InsuranceRequest` en **BORRADOR**, y permitir conservarla y recuperarla de forma segura desde esa cuenta. | CONFIRMADO; UX DIFERIDO F2 |
| RF-SOL-02 | El sistema debe validar los requisitos definidos para el producto antes de aceptar el envío formal de una solicitud. | CONFIRMADO |
| RF-SOL-03 | El sistema debe conservar los datos, adjuntos, consentimientos y contexto funcional aplicables a una solicitud enviada. | CONFIRMADO |
| RF-SOL-04 | El sistema debe permitir a un responsable autorizado consultar las solicitudes recibidas y asignarlas manualmente a un productor. | CONFIRMADO |
| RF-SOL-05 | El sistema debe registrar la derivación de una solicitud y su resultado conocido. | CONFIRMADO |
| RF-SOL-06 | El sistema debe distinguir BORRADOR de ENVIADA: BORRADOR es trámite iniciado y ENVIADA es presentación formal ante MAPS. | CONFIRMADO |
| RF-LEAD-01 | El sistema debe permitir registrar un potencial cliente solo cuando se cumplan las reglas aprobadas de origen, datos mínimos y consentimiento. | PENDIENTE MAPS |
| RF-LEAD-02 | El sistema debe poder vincular una solicitud formal con el lead del que provenga, sin crear un duplicado. | CONFIRMADO |
| RF-POL-01 | El sistema debe permitir consultar al asegurado las pólizas o servicios asociados cuya información esté disponible y autorizada. | CONFIRMADO |
| RF-POL-02 | El sistema debe permitir a un responsable autorizado administrar o corregir la relación cliente/póliza según el proceso aprobado. | PENDIENTE MAPS / DATOS |
| RF-PROD-01 | El sistema debe permitir administrar productores habilitados para recibir asignaciones. | CONFIRMADO a validar detalle |
| RF-CAT-01 | El sistema debe publicar los productos y sus requisitos vigentes definidos por MAPS. | CONFIRMADO |
| RF-FORM-01 | El sistema debe permitir a MAPS configurar y publicar formularios diferentes por producto sin cambios de código; una versión PUBLICADA es inmutable. | CONFIRMADO; detalle DIFERIDO F2/F3 |
| RF-PROD-02 | El productor sólo debe acceder read-only mediante enlace seguro, vencible, revocable, no adivinable, vinculado a una asignación, sin navegación a otros casos, con auditoría relevante, no indexación y transporte cifrado. | CONFIRMADO; mecanismo DIFERIDO F3 |

### No funcionales / restricciones de calidad

| ID | Requerimiento | Estado |
| --- | --- | --- |
| RNF-SEC-01 | El acceso a información personal, solicitudes, documentos y pólizas debe respetar autorización, aislamiento y trazabilidad. | CONFIRMADO; controles técnicos DIFERIDO F3 |
| RNF-SEC-02 | El tratamiento, derivación y retención de datos personales debe contar con consentimiento y política aprobados. | PENDIENTE MAPS/legal |
| RNF-AUD-01 | Deben poder auditarse al menos creación/envío de solicitud, asignación, derivación y cambios administrativos relevantes. | CONFIRMADO |
| RNF-DAT-01 | Cualquier uso de datos de PostgreSQL MAPS debe fundamentarse en procedencia, calidad, permisos y actualización observados. | CONFIRMADO |
| RNF-OPS-01 | Los roles operativos y los plazos de atención deben ser explícitos para evitar solicitudes o leads sin responsable. | PENDIENTE MAPS |
| RNF-COM-01 | La derivación debe minimizar datos expuestos y disponer de un comportamiento operativo ante fallas. | CONFIRMADO; solución DIFERIDO F3 |
| RNF-COM-02 | El email de derivación no debe incluir fotografías, archivos, respuestas completas, documentos ni información sensible innecesaria. | CONFIRMADO |

## 12. Entregables de cierre

1. Fichas funcionales aprobadas de los productos del MVP.
2. Mapa AS-IS cuando exista evidencia suficiente y modelo funcional TO-BE de Solicitud, Potenciales Clientes y Asegurado/Pólizas.
3. Matriz RACI de actores, responsabilidades y plazos operativos.
4. Informe de relevamiento PostgreSQL read-only, si el acceso fue habilitado; si no, registro explícito de la dependencia pendiente.
5. Catálogo de reglas de negocio, excepciones y trazabilidad.
6. Modelo de dominio conceptual validado.
7. Catálogo RF/RNF priorizado, con criterios de aceptación iniciales.
8. Matriz de pendientes con dueño, evidencia y destino F2/F3.

## 13. Criterios de salida de Fase 1

La Fase 1 podrá cerrarse cuando:

- cada producto candidato al MVP tenga una ficha funcional aprobada o sea retirado explícitamente del MVP;
- estén definidos los flujos de negocio y excepciones principales de solicitud, lead y póliza;
- MAPS haya asignado responsables operativos para solicitud, asignación, productor, producto, datos y aprobaciones;
- los pendientes de datos tengan evidencia read-only o una decisión formal de no depender de ellos en el siguiente alcance;
- el modelo conceptual no presente ambigüedades bloqueantes;
- los RF/RNF estén trazados a una necesidad/regla y diferenciados de decisiones F2/F3;
- ningún supuesto de UX, proveedor o arquitectura esté presentado como regla de negocio confirmada;
- exista una lista priorizada de decisiones y preguntas para Fase 2 y Fase 3.

## 14. Próximos pasos

1. Validar esta matriz como registro inicial de F1 con MAPS.
2. Completar fichas de productos y el proceso de solicitud antes de diseñar pantallas.
3. Realizar el relevamiento PostgreSQL en modo read-only cuando MAPS entregue acceso.
4. Cerrar política de leads, operación de asignación y datos de pólizas con los responsables de MAPS.
5. Transformar los hallazgos cerrados en backlog funcional para Fase 2; remitir las alternativas de UX y arquitectura a sus fases correspondientes.

---

## Anexo A - Bitácora de decisiones de F1

| Fecha | Tema | Decisión/evidencia | Estado | Responsable | Impacto |
| --- | --- | --- | --- | --- | --- |
| 2026-09-02 | Inicio F1 | Se crea este documento vivo a partir de Fase 0 mergeada y discovery consolidado. | CONFIRMADO | Kondor/MAPS | Base de relevamiento |
| 2026-09-03 | Autenticación previa | **Cambio controlado respecto de F0:** registro/login obligatorio antes de crear `InsuranceRequest(BORRADOR)`. Simplifica ownership de borradores, recuperación, consentimiento, trazabilidad y relación con potenciales clientes. F2 define sólo UX. | CONFIRMADO | MAPS/Kondor | Actualiza baseline y flujo funcional |
| 2026-09-03 | Modelo de borrador | `InsuranceRequest` existe desde **BORRADOR**; no es presentación formal hasta pasar a **ENVIADA** al confirmarse el envío. | CONFIRMADO | MAPS/Kondor | Ajusta dominio, reglas y requerimientos |
| 2026-09-03 | Canal inicial MVP | **Cambio controlado respecto de F0:** email transaccional reemplaza WhatsApp. Menor costo, dependencia, complejidad y riesgo; valida la misma asignación, notificación y acceso seguro. WhatsApp queda como evolución. | CONFIRMADO | MAPS/Kondor | Ajusta derivación, dependencias y riesgos |
| 2026-09-03 | Notificaciones | Deben ser mínimas, relevantes, accionables y no redundantes; se excluyen emails por cada estado y confirmaciones in-app redundantes. | CONFIRMADO | MAPS/Kondor | Ajusta reglas del MVP |
| 2026-09-03 | Formularios y versiones | Autonomía básica para configurar/publicar formularios confirmada; `FormVersion` PUBLICADA inmutable. Un BORRADOR conserva su versión de creación sin migración automática/silenciosa. Si la versión se retira expresamente por razones legales, de seguridad, comerciales o de vigencia, se informa al usuario y comienza con la versión vigente; UX y eventual reutilización de datos son F2/F3. | CONFIRMADO / DIFERIDO F2/F3 | MAPS/Kondor | Cierra política funcional de continuidad de borradores |
| 2026-09-03 | Política de precio | Precio fijo sólo con valor vigente, confiable y aplicable; en otro caso, sujeto a evaluación externa. Cotizador/simulador fuera del MVP. | CONFIRMADO / validación por producto PENDIENTE MAPS | MAPS/Kondor | Ajusta catálogo y exclusiones |

## Anexo B - Registro de evidencia de datos

| Fecha | Fuente | Objeto revisado | Hallazgo | Calidad/limitación | Impacto |
| --- | --- | --- | --- | --- | --- |
| Pendiente | PostgreSQL MAPS | Pendiente de acceso read-only | Sin evidencia aún. | No tomar decisiones de integración. | Pólizas, clientes, documentos |
