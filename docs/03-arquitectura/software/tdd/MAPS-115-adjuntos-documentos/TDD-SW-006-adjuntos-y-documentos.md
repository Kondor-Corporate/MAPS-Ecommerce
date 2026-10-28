# TDD — Adjuntos y documentos

| Dato | Valor |
| --- | --- |
| ID | `TDD-SW-006` |
| Título | Adjuntos y documentos: subida, confirmación, acceso y limpieza |
| Estado | `BORRADOR` |
| Fecha | 2026-10-28 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera — revisión cruzada Cloud/storage pendiente |
| Work item | [MAPS-115](https://santitalavera.atlassian.net/browse/MAPS-115) · subtarea [MAPS-143](https://santitalavera.atlassian.net/browse/MAPS-143) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-115 |
| Fase origen | [F0 §0.6/0.7](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §4/6, RN-03/18/19, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §7/9/13](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md); [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md); [ADR-SW-006](../../adr/MAPS-115-archivos-adjuntos/ADR-SW-006-archivos-y-adjuntos.md) (`PROPUESTO`); [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); [TDD-SW-002](../MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md); [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); [TDD-SW-004](../MAPS-111-identidad-rbac-ownership/TDD-SW-004-identidad-rbac-y-ownership.md) (`BORRADOR`); TDD-SW-007, TDD-CLD-004 y TDD-CLD-005 (previstos, sin redactar) |
| Depende de | ADR-SW-006 (`PROPUESTO`): este TDD no pasa a `EN REVISIÓN` hasta que se acepte. TDD-CLD-004 para storage, URLs firmadas y regla de respaldo de limpieza. Tipos, tamaños y cantidades definitivos con formularios reales (MAPS-96). Retención y eliminación (`PENDIENTE FUNCIONAL MAPS`, MAPS-99) |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `BORRADOR`, `EN REVISIÓN`, `APROBADO`, `REEMPLAZADO`. Este documento es un borrador: no constituye un diseño aprobado.

## Propósito y límites

Este TDD baja a diseño ejecutable el contrato de [ADR-SW-006](../../adr/MAPS-115-archivos-adjuntos/ADR-SW-006-archivos-y-adjuntos.md), que sigue `PROPUESTO`: el diseño queda condicionado a su aceptación. Define el módulo `Documents`: estados del `Document`, subida directa con confirmación, vinculación con el guardado manual del BORRADOR, varios archivos por campo, verificación del tipo real, acceso por URL de lectura de corta duración, limpieza de archivos sin uso, errores y pruebas.

**Fuera de este documento:**

- Servicio de storage, bucket, cifrado, IAM, firma de URLs a nivel de plataforma, CORS y regla de ciclo de vida de respaldo: TDD-CLD-004.
- Ejecución del job de limpieza como proceso programado: TDD-CLD-005.
- Escaneo de malware: decisión abierta con Cloud (ADR-SW-006).
- Plazos de retención y eliminación física de archivos de solicitudes enviadas o de BORRADORES descartados: `PENDIENTE FUNCIONAL MAPS` (DEP-11).
- Almacenamiento y consulta de la auditoría: TDD-SW-007.
- Corrección de un archivo mal cargado después de enviar: no existe en el MVP; se resuelve por fuera del Portal (ver [Decisiones abiertas](#decisiones-abiertas)).

## Baseline y dependencias

| Regla / dependencia | Fuente y estado | Impacto en el diseño |
| --- | --- | --- |
| Campos `file` en formularios | F0/F1 §4, F2 §9 — candidato; [TDD-SW-002](../MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md) delega sus reglas aquí | Reglas del campo (tipos, tamaño, cantidad) en el esquema de la FormVersion |
| Guardado sólo manual; lo no guardado se pierde | F2 §9 — CONFIRMADO | Un archivo sólo queda en el BORRADOR cuando el Cliente guarda |
| Guardar admite adjuntos faltantes; sólo rechaza un archivo que no supera la validación técnica | F2 §9, RN-03 — CONFIRMADO | La completitud se exige en `Submit`, no en `SaveDraft` |
| Enviar exige todos los adjuntos requeridos | F2 §9 — CONFIRMADO | `Submit` valida mínimo y máximo por campo |
| Adjuntos privados; acceso autorizado y auditado | RNF-SEC-01, [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) — CONFIRMADO | URL de lectura emitida tras la política y el `AccessScope` |
| Logs, auditoría y analytics sin documentos ni PII innecesaria | F0 §0.7, F1 §6 — CONFIRMADO | Sólo identificadores; nunca nombre de archivo ni contenido |
| Las bajas de Cliente y Productor no eliminan datos | RN-18/RN-19 — CONFIRMADO | La limpieza nunca toca archivos de solicitudes enviadas |
| Retención y eliminación física | `PENDIENTE FUNCIONAL MAPS` (MAPS-99) | Sólo se limpia lo que nunca formó parte de lo guardado |

## Vista de componentes y responsabilidades

```text
Documents (owner de Document)
├── domain/
│   ├── Document                 agregado: estado, objeto, tipo detectado, tamaño, referencia vigente
│   └── DocumentPolicy           reglas puras de transición y de "en uso"
├── application/
│   ├── RequestUpload            autoriza la subida y emite la URL firmada de subida
│   ├── ConfirmUpload            verifica existencia, tamaño y tipo real; PENDIENTE_SUBIDA → DISPONIBLE
│   ├── GetDocumentLink          aplica la política y emite la URL de lectura de corta duración
│   └── CleanupUnusedDocuments   job: elimina lo que nunca quedó guardado
├── ports/in/
│   ├── AttachmentCheckAdapter   implementa el puerto de Requests que verifica y marca referencias
│   └── DocumentQueryPort        metadatos de documentos de una solicitud (Admin, Cliente, Productor)
└── ports/out/
    ├── RequestDocumentContextPort   dueño, estado, FormVersion, reglas del campo y referencias guardadas (Requests)
    ├── ObjectStoragePort            URL de subida y de lectura, metadatos, lectura de los primeros bytes, borrado (adaptador cloud)
    ├── FileTypeDetectorPort         detección del tipo real por firma (librería mantenida)
    ├── AuditPort
    ├── DocumentRepository
    └── Clock
```

**Dirección de dependencias.** [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md) fija que Documents depende de Requests e Identity. Documents consulta a Requests mediante `RequestDocumentContextPort`; las reglas del campo `file` llegan por ese mismo puerto, que Requests resuelve con Forms, para no agregar una dependencia Documents → Forms.

Requests necesita verificar adjuntos al guardar y al enviar sin depender de Documents. Para eso **Requests define** un puerto de salida, `AttachmentCheckPort`, y **Documents lo implementa** (`AttachmentCheckAdapter`). Es inversión de dependencias: en el código Requests no importa nada de Documents, y la conexión se hace al componer la aplicación. Esta solución se somete a la revisión del límite entre módulos.

## Contratos y flujos

### Estados del `Document`

| Estado | Significado | Sale hacia |
| --- | --- | --- |
| `PENDIENTE_SUBIDA` | Se emitió la URL de subida; la aplicación todavía no sabe si el archivo llegó | `DISPONIBLE` (confirmación válida) o `ELIMINADO` (confirmación rechazada o limpieza) |
| `DISPONIBLE` | Confirmado, con tamaño y tipo real permitidos | `ELIMINADO` sólo por limpieza, y sólo si nunca quedó en uso (ver [Limpieza](#limpieza-de-archivos-sin-uso)) |
| `ELIMINADO` | Metadato conservado para trazabilidad; el objeto se borró o se está borrando | — (terminal) |

Los nombres siguen [ADR-SW-006](../../adr/MAPS-115-archivos-adjuntos/ADR-SW-006-archivos-y-adjuntos.md). No hay estado "quitado" ni "reemplazado": que un archivo esté **en uso** se deriva de las respuestas guardadas del BORRADOR o de la solicitud enviada. Un `Document` de una solicitud enviada queda `DISPONIBLE` para siempre, hasta que MAPS defina la retención.

### Subir un archivo (`RequestUpload`)

Entrada: `requestId`, `fieldKey`, nombre original, tipo declarado y tamaño declarado.

1. Política: Cliente con cuenta `ACTIVA`, dueño de la solicitud, BORRADOR utilizable y no descartado ([TDD-SW-004](../MAPS-111-identidad-rbac-ownership/TDD-SW-004-identidad-rbac-y-ownership.md)).
2. `RequestDocumentContextPort` devuelve las reglas del campo: debe ser de tipo `file` en la FormVersion del BORRADOR (`CAMPO_INVALIDO` si no).
3. Validar tipo declarado contra los tipos permitidos del campo (`TIPO_NO_PERMITIDO`) y tamaño declarado contra el máximo (`TAMANO_EXCEDIDO`). Es un primer filtro: lo declarado no es confiable y se revalida al confirmar.
4. Límite anti-abuso: cantidad de documentos `PENDIENTE_SUBIDA` por solicitud y de subidas por Cliente en una ventana de tiempo, configurables (`LIMITE_SUBIDAS`).
5. Crear `Document` en `PENDIENTE_SUBIDA` con una clave de objeto generada por el sistema. El nombre original se guarda como metadato y nunca forma parte de la ruta.
6. `ObjectStoragePort` emite una URL firmada de subida: un solo objeto, vencimiento de pocos minutos y, cuando la plataforma lo permita, tamaño y tipo restringidos (TDD-CLD-004).

Salida: `documentId`, URL de subida y su vencimiento.

### Confirmar la subida (`ConfirmUpload`)

1. Política: el mismo Cliente dueño; `Document` en `PENDIENTE_SUBIDA`. Si ya está `DISPONIBLE`, devuelve el mismo resultado (idempotente).
2. `ObjectStoragePort` verifica que el objeto exista (`ARCHIVO_NO_ENCONTRADO` si no; el Cliente puede reintentar mientras la URL no venció).
3. Tamaño real contra el máximo del campo.
4. `FileTypeDetectorPort` lee los primeros bytes y detecta el tipo real por su firma. Debe estar entre los permitidos del campo. La extensión y el tipo declarado no cuentan.
5. Si todo es válido: `DISPONIBLE`, con tipo detectado, tamaño real y checksum informado por el storage. Si algo falla: `ELIMINADO` con motivo (`TIPO_NO_PERMITIDO` o `TAMANO_EXCEDIDO`) y borrado del objeto; un fallo del borrado lo recupera la limpieza.

Un `Document` `DISPONIBLE` todavía **no** está en el BORRADOR: queda en uso recién cuando el Cliente guarda.

### Vincular al guardar y enviar

La respuesta de un campo `file` en `RequestAnswer` (owner: Requests) es la lista de `documentId` del campo.

- **`SaveDraft`** ([TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md)): Requests llama a `AttachmentCheckPort.verificarYMarcar(requestId, fieldKey, documentIds)` dentro de su unidad de trabajo. Cada documento debe estar `DISPONIBLE` y pertenecer a esa solicitud y a ese campo (`DOCUMENTO_INVALIDO` si no). Documents actualiza su `ultimaReferenciaAt`, lo que serializa el guardado con la limpieza. No valida mínimos: el BORRADOR admite adjuntos faltantes (F2 §9).
- **Quitar o reemplazar** no es un comando aparte: el Cliente saca el archivo de la lista y guarda. El documento que deja de estar referenciado queda sin uso y lo limpia el job. Si el Cliente no guarda, el archivo sigue en el BORRADOR, igual que el resto de sus respuestas.
- **Si el Cliente no guarda**, los archivos subidos en esa sesión nunca quedan en uso y los limpia el job (decisión del 2026-10-28, coherente con F2 §9).
- **`Submit`**: la completitud (Forms) valida para cada campo `file` la cantidad entre `minArchivos` y `maxArchivos`, con `minArchivos ≥ 1` si el campo es requerido (`SOLICITUD_INCOMPLETA`, TDD-SW-003). Requests vuelve a llamar a `verificarYMarcar`. Desde ENVIADA las respuestas no cambian, así que los documentos referenciados quedan fijos.

### Ver o descargar (`GetDocumentLink`)

1. Política según [TDD-SW-004](../MAPS-111-identidad-rbac-ownership/TDD-SW-004-identidad-rbac-y-ownership.md), sobre la solicitud del documento:
   - Cliente dueño: los documentos de su solicitud, en cualquier estado.
   - Admin: desde ENVIADA, sólo documentos referenciados por las respuestas enviadas.
   - Productor: DERIVADA con Assignment `EFECTIVO` propio y cuenta `ACTIVA`, sólo documentos referenciados; lectura.
2. El documento debe estar `DISPONIBLE` (`DOCUMENTO_NO_DISPONIBLE` si no).
3. Auditoría de cada apertura por Admin o Productor: actor, solicitud, documento y fecha, sin nombre de archivo.
4. `ObjectStoragePort` emite una URL de lectura de pocos minutos, que entrega el archivo **como descarga** (no para mostrarse dentro de la página) y con el tipo detectado, no el declarado. El nombre de descarga es el original saneado.

### Limpieza de archivos sin uso

`CleanupUnusedDocuments` corre periódicamente (propuesta: una vez por hora) y procesa en lotes:

| Caso | Condición | Acción |
| --- | --- | --- |
| Subida nunca confirmada | `PENDIENTE_SUBIDA` creado hace más de 24 h | `ELIMINADO`; borrar el objeto si existe |
| Confirmado y nunca guardado, o quitado/reemplazado en BORRADOR | `DISPONIBLE`, no referenciado por las respuestas guardadas y `ultimaReferenciaAt` (o `confirmadoAt`) de hace más de 24 h | `ELIMINADO`; borrar el objeto |
| Objeto sin metadato | Objeto del espacio de subidas sin `Document`, de más de 24 h | Borrar el objeto |
| Confirmación rechazada con borrado fallido | `ELIMINADO` con objeto todavía presente | Reintentar el borrado |

Reglas:

- **Nunca** elimina un documento referenciado por las respuestas guardadas de un BORRADOR (incluso descartado o no utilizable) ni de una solicitud enviada. Esos esperan la retención de MAPS.
- Antes de eliminar, relee la referencia y aplica la transición con control de versión. Si `SaveDraft` lo marcó mientras tanto, la limpieza no lo toca.
- Primero marca `ELIMINADO` y después borra el objeto; si el borrado falla, lo reintenta la próxima corrida. Es idempotente.
- El margen de 24 h y la frecuencia son parámetros configurables.
- Como respaldo, TDD-CLD-004 puede definir una regla de ciclo de vida del storage que borre objetos temporales sin uso después de unos días, por si el job falla. La coordinación la pide la matriz de dependencias (DEP-10).

### Errores observables

| Código | Cuándo |
| --- | --- |
| `ACCESO_DENEGADO` | Ninguna política autoriza la operación (TDD-SW-004) |
| `CAMPO_INVALIDO` | El campo no existe o no es de tipo `file` en la FormVersion del BORRADOR |
| `TIPO_NO_PERMITIDO` | Tipo declarado o detectado fuera de los permitidos del campo |
| `TAMANO_EXCEDIDO` | Tamaño declarado o real mayor al máximo |
| `LIMITE_SUBIDAS` | Se superó el límite anti-abuso |
| `ARCHIVO_NO_ENCONTRADO` | Se confirma una subida cuyo objeto no existe |
| `DOCUMENTO_INVALIDO` | Al guardar o enviar, un documento no está `DISPONIBLE` o no es de esa solicitud y campo |
| `DOCUMENTO_NO_DISPONIBLE` | Se pide ver un documento que no está `DISPONIBLE` |
| `SOLICITUD_INCOMPLETA` | Al enviar, un campo `file` no cumple mínimo o máximo (reutilizado de TDD-SW-003) |

## Datos, consistencia y migraciones

| Entidad | Datos | Restricciones |
| --- | --- | --- |
| `Document` (Documents) | `id`, `requestId`, `fieldKey`, clave de objeto, nombre original, tipo declarado, tipo detectado, tamaño, checksum, estado, motivo de eliminación, `creadoPor`, `creadoAt`, `confirmadoAt`, `ultimaReferenciaAt`, `eliminadoAt`, `version` | Clave de objeto única y generada por el sistema; el binario nunca se guarda en la base ([TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md)) |
| Respuesta de campo `file` (Requests) | Lista de `documentId` | Sólo documentos `DISPONIBLE` de la misma solicitud y campo; inmutable desde ENVIADA |
| Reglas del campo `file` (Forms, esquema de FormVersion) | `tiposPermitidos`, `tamanoMaxBytes`, `minArchivos`, `maxArchivos` | Subconjunto de los tipos y del tamaño máximo globales configurados; propiedades a incorporar al esquema candidato de [TDD-SW-002](../MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md) |

Valores iniciales propuestos, configurables y a validar con formularios reales (MAPS-96): tipos globales PDF, JPG y PNG; tamaño máximo global de 10 MB por archivo. No son requisitos de MAPS.

Consistencia:

- `RequestUpload` y `ConfirmUpload` son unidades de trabajo propias de Documents.
- `SaveDraft` y `Submit` incluyen la verificación y marca de documentos dentro de la unidad de trabajo de Requests, a través de `AttachmentCheckPort` ([ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md) punto 4).
- La limpieza usa control optimista con `version` sobre el `Document`.
- La base es la nueva del Portal; no hay migración desde el PostgreSQL histórico de MAPS.

## Seguridad y privacidad

- Storage privado; ningún enlace permanente. URLs de subida de un solo objeto y URLs de lectura de pocos minutos, emitidas sólo tras la política.
- Tipo real verificado por firma con una librería mantenida (elección en F4), detrás de `FileTypeDetectorPort`.
- Entrega como descarga y con el tipo detectado, para que un archivo no pueda ejecutarse dentro del Portal.
- Claves de objeto aleatorias; el nombre original no aparece en la ruta, en logs ni en eventos.
- Aislamiento por solicitud y campo en cada verificación.
- Auditoría de cada apertura por Admin o Productor y de las confirmaciones rechazadas, sin nombre ni contenido del archivo.
- Escaneo de malware: decisión abierta con Cloud. Mientras no exista, el riesgo de un archivo de tipo permitido con contenido malicioso queda documentado y mitigado por la entrega como descarga.

## Operación y observabilidad

Señales sin PII para que Cloud las recolecte (TDD-CLD-007):

- Subidas pedidas, confirmadas y rechazadas, por motivo.
- Corridas del job de limpieza: documentos y objetos eliminados, fallos de borrado y duración.
- Alerta si el job no corre o falla varias veces seguidas, porque acumula objetos sin uso.

La ejecución programada del job, su concurrencia y sus reintentos se definen en TDD-CLD-005.

## Pruebas y criterios de fallo

De dominio y aplicación (con dobles de puertos):

- Transiciones válidas e inválidas del `Document`; `ELIMINADO` es terminal.
- `RequestUpload`: un Cliente no puede subir a un BORRADOR ajeno, descartado o no utilizable; campo que no es `file`; tipo o tamaño declarado fuera de las reglas; límite anti-abuso.
- `ConfirmUpload`: objeto inexistente; archivo con extensión cambiada (por ejemplo, un ejecutable renombrado a `.pdf`) rechazado por firma; tamaño real excedido; confirmación repetida idempotente.
- `SaveDraft` con un documento de otra solicitud, de otro campo o no `DISPONIBLE`: `DOCUMENTO_INVALIDO`.
- `SaveDraft` sin mínimos: se guarda. `Submit` con menos archivos que el mínimo o más que el máximo: `SOLICITUD_INCOMPLETA`.
- Después de enviada, no se puede cambiar la lista de documentos.
- `GetDocumentLink`: Cliente ajeno, Admin sobre BORRADOR y Productor sin Assignment `EFECTIVO` reciben `ACCESO_DENEGADO`; Admin y Productor no ven documentos no referenciados; cada apertura de Admin o Productor queda auditada sin nombre de archivo.
- Limpieza: elimina subidas sin confirmar, subidas no guardadas y documentos quitados después del margen; nunca toca documentos referenciados por BORRADORES guardados ni por solicitudes enviadas; es idempotente.

De integración, con base real y storage simulado o de prueba:

- Carrera `SaveDraft` contra limpieza sobre el mismo documento: o queda referenciado y no se elimina, o el guardado recibe `DOCUMENTO_INVALIDO`; nunca queda una respuesta apuntando a un documento eliminado.
- Borrado de objeto fallido: la siguiente corrida lo completa.
- La URL de lectura vence en el plazo configurado y entrega el archivo como descarga.

La configuración real del storage (privacidad, firma, CORS, ciclo de vida) se valida en TDD-CLD-004, no aquí.

## Implementación y handoff a F4

Secuencia sugerida, sin crear Epic ni Issues F4:

1. Agregado `Document`, `DocumentPolicy` y repositorio.
2. `RequestUpload` y `ConfirmUpload` con `ObjectStoragePort` y `FileTypeDetectorPort` simulados.
3. `AttachmentCheckPort` en Requests e integración con `SaveDraft` y `Submit`; reglas del campo `file` en el esquema de Forms.
4. `GetDocumentLink` con la política de TDD-SW-004.
5. `CleanupUnusedDocuments`.
6. Adaptadores reales de storage y detección de tipo, cuando TDD-CLD-004 esté definido.

Dependencias: ADR-SW-006 aceptado; TDD-SW-003 (`APROBADO`) para `SaveDraft` y `Submit`; TDD-SW-002 para las reglas del campo; TDD-SW-004 para políticas; TDD-CLD-004 y TDD-CLD-005 para storage y job.

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| Aceptación de ADR-SW-006 | Software + Cloud | Este diseño, condicionado | Revisión cruzada Cloud (PR #28) |
| Tipos, tamaños y cantidades de archivos | MAPS + Kondor | Valores iniciales configurables (PDF, JPG, PNG; 10 MB) | Validar con 1–2 formularios reales (MAPS-96); incluye si hace falta HEIC para fotos de celular |
| Escaneo de malware | Software + Cloud | Verificación por firma y entrega como descarga | TDD-CLD-004 decide si hay un servicio razonable de operar |
| Retención de documentos de solicitudes enviadas y de BORRADORES descartados | MAPS | La limpieza sólo toca lo que nunca quedó guardado | MAPS-99 / DEP-11 |
| Corrección de un archivo mal cargado después de enviar | MAPS | Decisión Kondor para el MVP: se resuelve por fuera del Portal | Si MAPS lo pide, cambio controlado de F1/F2 |
| Vencimiento de URLs, restricciones de subida, CORS y regla de ciclo de vida de respaldo | Cloud | Contratos del puerto | TDD-CLD-004 |
| Ejecución programada del job de limpieza | Cloud | Lógica y parámetros del job | TDD-CLD-005 |
| Puerto `AttachmentCheckPort` definido por Requests e implementado por Documents | Software | Diseño propuesto | Revisión del límite entre módulos; si se rechaza, enmienda de ADR-SW-001 |
| Propiedades del campo `file` en el esquema | Software | Propuesta de este TDD | Incorporar a TDD-SW-002 |

## Referencias y trazabilidad

- ADR y TDD relacionados: [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [ADR-SW-006](../../adr/MAPS-115-archivos-adjuntos/ADR-SW-006-archivos-y-adjuntos.md), [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-002](../MAPS-112-product-category-formularios/TDD-SW-002-product-category-y-formversion.md), [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md), [TDD-SW-004](../MAPS-111-identidad-rbac-ownership/TDD-SW-004-identidad-rbac-y-ownership.md); previstos TDD-SW-007, TDD-CLD-004, TDD-CLD-005, TDD-CLD-007.
- Matriz de dependencias: [DEP-10 y DEP-11](../../../dependency-matrix.md).
- Fuentes F0/F1/F2: [F0 §0.6/0.7](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md); [F1 §4/6, RN-03/18/19, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §7/9/13](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Fila de [traceability.md](../../../traceability.md): adjuntos privados, acceso autorizado y retención pendiente.
