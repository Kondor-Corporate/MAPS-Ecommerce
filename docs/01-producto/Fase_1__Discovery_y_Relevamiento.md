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

- Wireframes, journeys, arquitectura de información, decisiones de autenticación en pantalla o detalle de la experiencia: Fase 2.
- Elección de stack, esquema físico, APIs, integración concreta, proveedor, colas, almacenamiento, estrategia de sincronización o seguridad técnica detallada: Fase 3.
- Construcción, migración, escritura, modificación o limpieza de la base de datos MAPS.
- Validación jurídica definitiva de textos, consentimientos, retenciones o políticas; F1 identifica la necesidad y el responsable de aprobación.

## 3. Entradas desde Fase 0

La Fase 1 toma como baseline el cambio de enfoque desde e-commerce hacia un portal operativo de seguros. Se preservan como punto de partida los siguientes hallazgos; si surge evidencia contradictoria, se registrará como cambio controlado y no se reinterpretará silenciosamente.

| Hallazgo de partida | Estado | Tratamiento en F1 |
| --- | --- | --- |
| El Portal gestiona solicitudes; no cobra, no hace checkout, no emite ni confirma contratación automática. | CONFIRMADO | Delimitar formularios, estados y frontera con la gestión comercial externa. |
| Los productos requieren formularios particulares. Un trámite iniciado puede conservarse como borrador y solo se convierte en solicitud formal al confirmarse el envío. | CONFIRMADO | Relevar campos, reglas, adjuntos y versión funcional por producto. |
| La asignación del productor es manual. | CONFIRMADO | Precisar responsable, criterios, tiempos, reasignación y trazabilidad. |
| Fase 0 estableció WhatsApp como canal inicial/preferente del MVP para la derivación trazable. | CONFIRMADO | Validar operativamente destinatario, información mínima, contingencia, necesidad real de otros canales y quién selecciona el canal. |
| `Lead`/Potencial Cliente no es una `InsuranceRequest`/Solicitud. | CONFIRMADO | Modelar creación, recuperación, conversión y no duplicación. |
| Existe un ciclo de asegurado/pólizas además del ciclo de solicitud. | CONFIRMADO | Relevar datos visibles, administración, asociación y fuentes disponibles. |
| MAPS dispone de una PostgreSQL existente que podrá inspeccionarse en modo read-only. | CONFIRMADO | Hacer discovery de datos; no decidir aún la integración. |
| El PDF de póliza depende de que exista una fuente disponible. | PENDIENTE DATOS | Identificar disponibilidad, origen, permisos y calidad; no prometerlo. |

### Fuente histórica y límite de interpretación

Materiales anteriores que describen checkout, pagos, contratación automática, emisión automática o un constructor visual completo no son definición vigente por sí solos. En F1 se consideran únicamente como contexto histórico o como hipótesis a validar. La autonomía administrativa requerida para formularios se relevará antes de decidir la profundidad de cualquier herramienta.

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
Solicitud formal
Producto -> inicio del trámite -> borrador de solicitud -> envío confirmado -> InsuranceRequest formal -> MAPS -> productor -> gestión comercial externa

Potencial cliente
Interés elegible / borrador abandonado / contacto -> Lead -> recuperación -> posible Solicitud

Asegurado y pólizas
Cliente/asegurado -> asociación o disponibilidad de pólizas/servicios -> consulta de información disponible
```

Una solicitud formal enviada no genera automáticamente un lead duplicado. Si un lead deriva luego en una solicitud formal, la relación debe preservar origen, eventos y responsable comercial según las reglas que MAPS confirme. El borrador de solicitud todavía no es una `InsuranceRequest` formal; F3 decidirá si ambos conceptos se persisten como una o más entidades técnicas.

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
| Precio fijo vs. Ahorro/Retiro | Fase 0 supone precios fijos visibles; el material comercial de Ahorro/Retiro menciona aportes ajustables y simulador. | ¿Todos los productos del Portal tienen realmente un precio fijo publicable o existen modalidades diferentes? | PENDIENTE MAPS |
| Nombre Ahorro vs. Retiro | El material usa “Seguro de Ahorro”, pero su contenido habla de “Seguro de Retiro”. | ¿Cuál es el nombre oficial del producto y cuál debe mostrarse al cliente? | PENDIENTE MAPS |

### 5.4 Fronteras confirmadas

- El resultado de una solicitud no equivale a venta, emisión ni póliza.
- La gestión comercial posterior puede continuar fuera del Portal.
- El Portal del asegurado no presupone todavía importación, sincronización ni acceso directo a Federación Patronal.
- La información histórica de una solicitud debe poder interpretarse en relación con el producto, respuestas, adjuntos y consentimiento que aplicaban al enviarla; la implementación de versionado se define en F3.
- WhatsApp se preserva como canal inicial/preferente definido por Fase 0. F1 valida su operación; si la evidencia requiere cambiarlo, se registrará como cambio controlado. Proveedor, adaptadores, credenciales, plantillas, reintentos e implementación quedan en F3; la UX de selección de canal, si aplica, queda en F2.

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
| Descubrimiento e inicio | Visitante/cliente | Datos mínimos, condición de autenticación y continuidad del trámite. |
| Borrador | Cliente/sistema | Guardado, recuperación, vencimiento, edición y abandono. |
| Envío | Cliente | Completitud, validaciones, consentimiento y confirmación. |
| Recepción | MAPS | Bandeja, responsable, prioridad, duplicados y observaciones. |
| Asignación | Responsable MAPS | Quién asigna, criterios, plazo, reasignación y auditoría. |
| Derivación | MAPS/sistema | Canal, datos mínimos, resultado esperado, fallback y trazabilidad. |
| Gestión externa | Productor | Frontera de responsabilidad e información que vuelve o no vuelve al Portal. |

Salida: mapa AS-IS cuando exista evidencia suficiente y modelo funcional TO-BE de los ciclos de Solicitud, Potenciales Clientes y Asegurado/Pólizas, con estados de negocio, excepciones y acuerdos de servicio operativos. El AS-IS no se inferirá desde la solución futura.

### C. Potenciales clientes

**Propósito:** preservar Potenciales Clientes como recuperación comercial, no como duplicado de solicitudes formales.

Preguntas de discovery:

- ¿Qué eventos y fuentes pueden crear un lead: borrador abandonado, pedido de asesoramiento, campaña, landing u otros?
- ¿Qué datos mínimos, tiempo de inactividad y consentimiento hacen elegible un borrador?
- ¿Quién recibe, asigna y trabaja el lead?
- ¿Qué datos se transfieren y qué datos se excluyen por privacidad o calidad?
- ¿Cómo se detecta y resuelve un duplicado?
- ¿Qué estado adopta el lead cuando una solicitud formal se vincula a él?

Salida: política de creación/conversión, mapa de trazabilidad `Lead -> InsuranceRequest` y reglas de no duplicación.

### D. Portal del asegurado y pólizas

**Propósito:** determinar el valor funcional del portal del asegurado y los datos realmente sostenibles.

El mínimo mencionado para consulta incluye ramo, producto, número de póliza, estado y vigencia. Deben verificarse además cliente/asegurado, compañía, productor, renovaciones, servicios, identificadores externos y documentos disponibles.

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
| RN-03 | Un borrador de solicitud puede permanecer incompleto hasta que se apliquen las reglas de vigencia/retención aprobadas. Se considera solicitud formal cuando el usuario confirma el envío. | CONFIRMADO / plazo PENDIENTE MAPS |
| RN-04 | Una solicitud enviada y un lead son conceptos distintos y no deben duplicarse por defecto. | CONFIRMADO |
| RN-05 | Un lead puede vincularse a una solicitud posterior conservando trazabilidad; la condición exacta de conversión debe confirmarse. | CONFIRMADO / detalle PENDIENTE MAPS |
| RN-06 | La asignación a productor es manual y debe ser atribuible a un responsable autorizado. | CONFIRMADO |
| RN-07 | La derivación debe registrar su resultado funcional y no exponer más datos de los autorizados. | CONFIRMADO |
| RN-08 | WhatsApp es el canal inicial/preferente establecido por Fase 0. F1 debe validar su operación, destinatario, información mínima, contingencia, necesidad de otros canales y quién selecciona el canal. La UX de selección, si aplica, se define en F2; la implementación concreta se define en F3. | CONFIRMADO / DIFERIDO F2/F3 |
| RN-09 | La consulta de pólizas se limita a información realmente disponible, autorizada y asociable al asegurado. | CONFIRMADO |
| RN-10 | La disponibilidad de PDF de póliza no se presume hasta identificar una fuente y permisos válidos. | PENDIENTE DATOS |
| RN-11 | Los cambios posteriores no deben volver ambigua la interpretación histórica de una solicitud enviada. | CONFIRMADO |

## 8. Procesos funcionales a validar

### 8.1 Solicitud formal

```text
Producto elegido
-> inicio de trámite
-> carga parcial y borrador de solicitud
-> completar requisitos/consentimientos
-> envío confirmado y creación de InsuranceRequest formal
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
| Autonomía de formularios | PENDIENTE MAPS | Fase 0 requiere formularios por producto; no define grado de autonomía confirmado. | ¿Qué cambios podrá operar MAPS sin intervención y con qué gobernanza? | Administrador MAPS | Pendiente | Decisión para F2/F3 |
| Borradores | PENDIENTE MAPS | Baseline funcional. | ¿Cuándo expiran, se eliminan o son recuperables? | MAPS/legal | Pendiente | Regla de ciclo de vida |
| Leads | PENDIENTE MAPS | Discovery consolidado: Lead distinto de solicitud formal. | ¿Qué los crea, con qué datos y consentimiento, y cuándo? | MAPS comercial/legal | Pendiente | Política de recuperación |
| Conversión Lead | PENDIENTE MAPS | Discovery consolidado. | ¿Cómo se vincula/cierra un lead al crear solicitud formal? | MAPS comercial | Pendiente | Regla de trazabilidad |
| Operación de solicitudes | PENDIENTE MAPS | Baseline: asignación manual. | ¿Quién revisa, asigna, reasigna y en qué plazo? | MAPS | Pendiente | RACI y SLA operativo |
| Canal de derivación | PENDIENTE MAPS / DIFERIDO F2/F3 | Fase 0: WhatsApp inicial/preferente. | ¿Destinatario, datos mínimos, contingencia, necesidad de otros canales y quién selecciona el canal? | MAPS + Kondor | Pendiente | Validación operativa; UX F2 y técnica F3 |
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
  - responde una versión de -> Form
  - contiene -> RequestAnswer, Document, Consent
  - puede originarse en -> Lead (0..1)
  - puede ser asignada a -> Producer
  - genera -> Delivery/Derivación

Lead
  - representa una identidad/contacto comercial parcial
  - puede existir sin -> User o Customer formal
  - puede vincularse posteriormente a -> Customer
  - puede convertirse/vincularse a -> InsuranceRequest (0..1)
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
| RF-SOL-01 | El sistema debe permitir iniciar, conservar y recuperar un borrador de solicitud asociado de forma recuperable y segura a la identidad disponible del interesado, según el mecanismo que se defina posteriormente. | CONFIRMADO |
| RF-SOL-02 | El sistema debe validar los requisitos definidos para el producto antes de aceptar el envío formal de una solicitud. | CONFIRMADO |
| RF-SOL-03 | El sistema debe conservar los datos, adjuntos, consentimientos y contexto funcional aplicables a una solicitud enviada. | CONFIRMADO |
| RF-SOL-04 | El sistema debe permitir a un responsable autorizado consultar las solicitudes recibidas y asignarlas manualmente a un productor. | CONFIRMADO |
| RF-SOL-05 | El sistema debe registrar la derivación de una solicitud y su resultado conocido. | CONFIRMADO |
| RF-LEAD-01 | El sistema debe permitir registrar un potencial cliente solo cuando se cumplan las reglas aprobadas de origen, datos mínimos y consentimiento. | PENDIENTE MAPS |
| RF-LEAD-02 | El sistema debe poder vincular una solicitud formal con el lead del que provenga, sin crear un duplicado. | CONFIRMADO |
| RF-POL-01 | El sistema debe permitir consultar al asegurado las pólizas o servicios asociados cuya información esté disponible y autorizada. | CONFIRMADO |
| RF-POL-02 | El sistema debe permitir a un responsable autorizado administrar o corregir la relación cliente/póliza según el proceso aprobado. | PENDIENTE MAPS / DATOS |
| RF-PROD-01 | El sistema debe permitir administrar productores habilitados para recibir asignaciones. | CONFIRMADO a validar detalle |
| RF-CAT-01 | El sistema debe publicar los productos y sus requisitos vigentes definidos por MAPS. | CONFIRMADO |

### No funcionales / restricciones de calidad

| ID | Requerimiento | Estado |
| --- | --- | --- |
| RNF-SEC-01 | El acceso a información personal, solicitudes, documentos y pólizas debe respetar autorización, aislamiento y trazabilidad. | CONFIRMADO; controles técnicos DIFERIDO F3 |
| RNF-SEC-02 | El tratamiento, derivación y retención de datos personales debe contar con consentimiento y política aprobados. | PENDIENTE MAPS/legal |
| RNF-AUD-01 | Deben poder auditarse al menos creación/envío de solicitud, asignación, derivación y cambios administrativos relevantes. | CONFIRMADO |
| RNF-DAT-01 | Cualquier uso de datos de PostgreSQL MAPS debe fundamentarse en procedencia, calidad, permisos y actualización observados. | CONFIRMADO |
| RNF-OPS-01 | Los roles operativos y los plazos de atención deben ser explícitos para evitar solicitudes o leads sin responsable. | PENDIENTE MAPS |
| RNF-COM-01 | La derivación debe minimizar datos expuestos y disponer de un comportamiento operativo ante fallas. | CONFIRMADO; solución DIFERIDO F3 |

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

## Anexo B - Registro de evidencia de datos

| Fecha | Fuente | Objeto revisado | Hallazgo | Calidad/limitación | Impacto |
| --- | --- | --- | --- | --- | --- |
| Pendiente | PostgreSQL MAPS | Pendiente de acceso read-only | Sin evidencia aún. | No tomar decisiones de integración. | Pólizas, clientes, documentos |
