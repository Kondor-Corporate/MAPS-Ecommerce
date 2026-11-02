# ADR — Archivos y adjuntos desde software

| Dato | Valor |
| --- | --- |
| ID | `ADR-SW-006` |
| Título | Contrato de archivos y adjuntos: subida directa, acceso autorizado y ciclo de vida |
| Estado | `PROPUESTO` |
| Fecha | 2026-10-26 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera — revisión cruzada Cloud/seguridad pendiente |
| Work item | [MAPS-115](https://santitalavera.atlassian.net/browse/MAPS-115) · subtarea [MAPS-137](https://santitalavera.atlassian.net/browse/MAPS-137) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-115 |
| Fase origen | [F0 §0.6/0.7/0.9](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §6, RN-18/RN-19, RNF-SEC-01](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §7/14/16](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-001](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-005](../MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md); [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); [TDD-SW-006](../../tdd/MAPS-115-adjuntos-documentos/TDD-SW-006-adjuntos-y-documentos.md) (`BORRADOR`); TDD-CLD-004 (previsto, sin redactar) |
| Depende de | ADR-SW-001, ADR-SW-002 y ADR-SW-005, todos `ACEPTADO`; retención y eliminación funcional `PENDIENTE FUNCIONAL MAPS`; diseño de storage en TDD-CLD-004 |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `PROPUESTO`, `ACEPTADO`, `RECHAZADO`, `REEMPLAZADO`. Este ADR es una propuesta: no constituye una decisión aceptada.

## Contexto y problema

Los formularios de producto admiten campos de tipo `file` (candidato en F0/F1/F2). El Cliente puede guardar un BORRADOR sin adjuntos completos, pero el envío exige todos los adjuntos requeridos ([F2 §7](../../../../02-diseno/Fase_2__Design_Handoff.md)). Los archivos son datos sensibles del Cliente, no se exponen públicamente y sólo los ven quienes están autorizados por [ADR-SW-005](../MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md): el Cliente dueño, el Admin desde ENVIADA y el Productor sólo en DERIVADA con Assignment `EFECTIVO`, en lectura.

El módulo `Documents` guarda los metadatos del archivo y la referencia al objeto privado ([TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md)). Falta definir cómo viaja el archivo, cómo se autoriza el acceso, qué controles se aplican y cómo vive el adjunto durante el ciclo de la solicitud.

**Límite de responsabilidad.** Software define el contrato de la aplicación, las políticas de acceso, el ciclo de vida del adjunto y los metadatos. Cloud define el servicio de storage, bucket privado, cifrado, IAM, URLs firmadas a nivel de plataforma y su operación ([TDD-CLD-004](../../../cloud/README.md)). La retención y la eliminación funcional dependen de MAPS.

## Drivers y criterios

| Driver o criterio | Importancia | Evidencia / fuente |
| --- | --- | --- |
| Archivos privados; nunca públicos ni accesibles por un enlace permanente | Alta | F1 RNF-SEC-01 |
| Misma autorización que la solicitud (RBAC + ownership, deny by default) | Alta | [ADR-SW-005](../MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) |
| Mantener la API liviana en un runtime serverless con límites por request | Alta | Supuesto de Cloud Run, a confirmar en ADR-CLD-003 |
| Minimizar datos personales en logs, auditoría y analytics | Alta | F0 §0.7; F1 §6 |
| El BORRADOR admite adjuntos faltantes; el envío exige completitud | Alta | F2 §7 |
| Lo que ven Admin y Productor no cambia después de enviar | Alta | F2 §7; coherencia con ENVIADA |
| Simplicidad para el MVP y reversibilidad | Media | — |
| Tipos y tamaños definitivos de archivos | Media | Sujetos a validación F1 con 1–2 formularios reales (F2 §7) |

Hechos verificados: los campos `file` son candidatos; las bajas de Cliente y Productor no eliminan datos (RN-18/RN-19). Supuestos: Cloud Storage privado como servicio de objetos y Cloud Run como runtime, ambos a confirmar con Cloud.

## Alternativas consideradas

### Subida

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| A. Subida directa al storage con URL firmada | La API no procesa los bytes; escala con el storage; evita límites de tamaño por request | El control de contenido es posterior a la subida; requiere confirmar la subida | **Elegida** |
| B. Subida a través de la API | Un único punto de validación | La API procesa y reenvía los bytes; límites de request y memoria; más costo y latencia | Descartada |

### Descarga

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| A. URL firmada de corta duración, emitida tras la política | La API autoriza y audita; no mueve bytes | Quien obtiene la URL puede usarla hasta que venza, aunque el permiso en el Portal se revoque antes | **Elegida** |
| B. Streaming a través de la API | Control de cada descarga | La API mueve todos los bytes | Descartada |

### Validación

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| A. Tipo y tamaño máximo; escaneo de malware como decisión abierta | Cubre lo esencial sin sumar componentes | Un archivo malicioso permitido por tipo y tamaño no se detecta | **Elegida** |
| B. Incluir escaneo de malware en el MVP | Más seguro | Nuevo componente y dependencia con Cloud | Pendiente de decisión con Cloud |
| C. Sólo tipo y tamaño, sin escaneo | Mínimo | Riesgo aceptado sin tratamiento | Descartada como estado final |

### Ciclo de vida

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| A. Editable en BORRADOR, inmutable desde ENVIADA; limpieza de huérfanos por job | Coherente con la inmutabilidad de lo que ven Admin y Productor | Requiere un job de limpieza | **Elegida** |
| B. Editable también tras enviar | Más flexible para el Cliente | Rompe lo que Admin y Productor ya vieron | Descartada |

## Decisión

Se propone esta opción (estado `PROPUESTO`):

1. **Subida directa con URL firmada.** El Cliente pide autorización para subir un archivo a un campo de su BORRADOR. La aplicación evalúa la política (Cliente `ACTIVA`, dueño, BORRADOR utilizable), valida tipo declarado y tamaño máximo, crea un `Document` en estado `PENDIENTE_SUBIDA` y devuelve una URL firmada de subida de corta duración, limitada a un único objeto con clave generada por el sistema en un espacio temporal privado. La firma por sí sola no garantiza un solo uso: la URL puede reutilizarse hasta que vence. Contra sobrescrituras se usa una precondición de creación del objeto cuando la plataforma la soporte y, en todo caso, la confirmación fija la versión verificada del objeto (punto 2). El nombre original del archivo se guarda como metadato y nunca forma parte de la ruta.
2. **Confirmación de la subida.** Cuando el cliente termina, confirma a la aplicación. La aplicación verifica que el objeto exista y que tipo y tamaño reales coincidan con lo permitido, copia esa versión verificada del espacio temporal al espacio de documentos y recién entonces marca el `Document` como `DISPONIBLE`. Confirmar **no** vincula el documento a la solicitud: un `Document` `DISPONIBLE` pasa a ser respuesta del campo sólo cuando el Cliente guarda el BORRADOR (`SaveDraft`). Un archivo sin confirmar no puede guardarse como adjunto.
3. **Acceso por URL firmada de lectura.** Para ver o descargar, la aplicación aplica la política y el `AccessScope` de [ADR-SW-005](../MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) (Cliente dueño; Admin desde ENVIADA; Productor en DERIVADA con Assignment `EFECTIVO`, sólo lectura), audita la apertura y devuelve una URL que vence en minutos. Nunca se guarda ni se expone un enlace permanente. La apertura por un Productor queda auditada como la de su expediente. La autorización se evalúa al emitir la URL: una URL ya emitida sigue sirviendo hasta que vence, aunque después se dé de baja la cuenta o se revoque el Assignment. Esa ventana residual, acotada por el vencimiento, se acepta para el MVP; revocar un permiso del Portal no revoca criptográficamente una URL ya emitida.
4. **Controles del archivo en el MVP.** Lista blanca de tipos y tamaño máximo por archivo, validados en la emisión y de nuevo en la confirmación. Los valores concretos se fijan con los formularios reales (F1). Verificar el tipo y entregar como descarga no equivale a analizar malware. Propuesta para el MVP: `DISPONIBLE` significa tipo y tamaño verificados, y el archivo puede leerse sin escaneo; esto exige registrar la aceptación explícita del riesgo residual antes de aceptar este ADR. Si se exige escaneo, se agrega un estado de cuarentena previo a `DISPONIBLE` y no se emiten URLs de lectura hasta superarlo ([TDD-SW-006](../../tdd/MAPS-115-adjuntos-documentos/TDD-SW-006-adjuntos-y-documentos.md); ver Riesgos).
5. **Ciclo de vida.** En BORRADOR el Cliente puede reemplazar o quitar un adjunto al guardar; el documento que deja de estar referenciado queda candidato a limpieza. Desde ENVIADA los adjuntos son inmutables. Los `Document` en `PENDIENTE_SUBIDA` que nunca se confirman, los `DISPONIBLE` que nunca quedaron guardados y los objetos sin metadatos se limpian con un job de la aplicación. La limpieza decide en una transacción que se serializa con el guardado y borra el objeto sólo después de confirmarla, así que nunca borra un objeto referenciado por respuestas guardadas. Una regla automática por antigüedad del storage, si existe, se limita al espacio temporal de subidas, donde nunca hay objetos guardados. Por defecto un BORRADOR descartado no borra de inmediato los adjuntos: eso lo decide la política de retención que defina MAPS.
6. **Sin eliminación física funcional.** Las bajas de Cliente y Productor no eliminan datos (RN-18/RN-19). La eliminación física y los plazos de conservación se definen cuando MAPS los confirme; mientras tanto, el diseño sólo marca para limpieza lo que nunca fue parte de una solicitud enviada.
7. **Datos personales.** Logs, auditoría y analytics registran identificadores (documento, solicitud, actor) y no el nombre del archivo, su contenido ni datos extraídos.

**Qué no resuelve este ADR:** el servicio concreto de storage, bucket, cifrado, IAM, la firma de URLs a nivel de plataforma y la política de CORS (TDD-CLD-004); los tipos y tamaños definitivos; el escaneo de malware; los plazos de retención y la eliminación física (MAPS); el detalle de estados, errores y pruebas (TDD-SW-006).

## Consecuencias y trade-offs

- La API permanece liviana y no procesa archivos. Se acepta que el control del contenido es posterior a la subida, por lo que hace falta la confirmación y, eventualmente, el escaneo.
- Una URL firmada válida puede usarse por quien la obtenga hasta que venza, incluso después de una baja o de la revocación de un Assignment: por eso es corta, de un solo objeto y sólo se emite tras la política y la auditoría. Si MAPS exige revocación inmediata, la alternativa es entregar a través de la API (alternativa B de descarga), con su costo.
- Confirmar cuesta una copia dentro del storage, sin bytes por la API. A cambio separa el espacio temporal del de documentos y fija la versión verificada del objeto.
- Se suma un job de limpieza de objetos huérfanos, a coordinar con Cloud (TDD-CLD-005).
- Cloud debe ofrecer URLs firmadas de subida y lectura con vencimiento corto, bucket privado y cifrado; software no depende de un servicio específico más allá de un puerto de almacenamiento (hexagonal, [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md)).
- El TDD-SW-006 detalla estados del `Document`, contratos, errores y pruebas, y debe enlazar este ADR y el diseño cloud de storage.

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Tipos, tamaños y cantidad de adjuntos definitivos | MAPS + Kondor | Validar con 1–2 formularios reales (F1); hasta entonces, valores configurables |
| Retención, plazos y eliminación física de archivos (`PENDIENTE FUNCIONAL MAPS`) | MAPS | Hasta que se defina, el diseño no elimina adjuntos de solicitudes enviadas |
| Escaneo de malware en el MVP | Software + Cloud; aceptación del riesgo: Kondor + MAPS | Antes de aceptar este ADR: registrar la aceptación explícita del riesgo residual sin escaneo, o adoptar la cuarentena. TDD-CLD-004 evalúa el mecanismo y su costo |
| Ventana residual de URLs de lectura tras una revocación | Software + Cloud | Vencimiento máximo en TDD-CLD-004 (propuesta: 5 minutos); revisar si MAPS exige revocación inmediata |
| Garantías reales de la URL de subida: método, alcance del objeto, precondición de creación, restricciones soportadas e identidad firmante | Cloud | TDD-CLD-004; el contrato de software no promete más de lo que la plataforma demuestre |
| Vencimiento de URLs firmadas y política de CORS | Cloud | Definir en TDD-CLD-004 y TDD-CLD-006 |
| Qué se hace con adjuntos de BORRADORES descartados | MAPS + Kondor | Depende de la retención; por defecto no se borran de inmediato |
| Coordinación del job de limpieza | Software + Cloud | TDD-CLD-005 |

## Criterios de revisión futura

- Si MAPS define tipos, tamaños o requisitos de contenido incompatibles con la subida directa.
- Si Cloud no puede ofrecer URLs firmadas con vencimiento corto o el control de acceso previsto.
- Si aparece un requisito legal de escaneo, retención o eliminación que cambie el ciclo de vida.
- Si cambia el runtime y los límites de request dejan de justificar la subida directa.

Si cambia un ADR aceptado, se crea un ADR nuevo con `Reemplaza` y se marca el anterior `REEMPLAZADO`.

## Referencias y trazabilidad

- Fuentes F0/F1/F2: [F0 §0.6/0.7/0.9](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md); [F1 §6, RNF-SEC-01, RN-18/RN-19](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §7/14/16](../../../../02-diseno/Fase_2__Design_Handoff.md).
- ADR/TDD relacionados: [ADR-SW-001](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-005](../MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md), [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-006](../../tdd/MAPS-115-adjuntos-documentos/TDD-SW-006-adjuntos-y-documentos.md); previsto TDD-CLD-004.
- Fila de [traceability.md](../../../traceability.md): adjuntos privados, acceso autorizado y retención pendiente.
