# Relevamiento MAPS — Bajas de Cliente y Productor e inhabilitación

| Dato | Valor |
| --- | --- |
| Tipo | Transcripción de evidencia funcional. No es una baseline ni una decisión |
| Documento original | `Relevamiento-MAPS-Ecommerce (1).pdf`, una página. No se versiona en el repositorio |
| Fecha del original | El PDF no indica fecha de respuesta. Su fecha de creación es 2026-10-07 |
| Registrado en la baseline | 2026-10-09, en las bitácoras de [F0](../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md) y [F1 §13](./Fase_1__Discovery_y_Relevamiento.md) |
| Transcripto | 2026-10-12 |
| Preguntas | Kondor |
| Respuestas | MAPS |

> Las reglas vigentes son las de [F1](./Fase_1__Discovery_y_Relevamiento.md) (RN-18, RN-19 y RN-20) y [F2 §12](../02-diseno/Fase_2__Design_Handoff.md). Este archivo sólo conserva las preguntas y respuestas originales para que esas reglas puedan rastrearse a su fuente. Si hay diferencia entre este texto y F1/F2, rige F1/F2.

## Criterio de transcripción

- Preguntas y respuestas se copian **literalmente**, con la redacción y la ortografía del original.
- El PDF es una tabla de tres columnas: "Pregunta", "Respuesta" y "Cuestion". La tercera columna contiene una definición por bloque y aquí se muestra como encabezado de cada bloque.
- En dos celdas el original agrupa varias preguntas con varias respuestas. La correspondencia se tomó de la posición de cada renglón y se indica en la columna "Nota".

## Baja de Cliente

**Definición del original:** "Baja de cliente: Dejar de considerar activa su cuenta/relación operativa con el Portal".

| # | Pregunta | Respuesta de MAPS | Nota |
| --- | --- | --- | --- |
| 1 | Cuando un Cliente es dado de baja por un Admin, ¿debe dejar de poder iniciar sesión inmediatamente? | Si | Comparte celda con la pregunta 2 |
| 2 | ¿Debe poder iniciar nuevas solicitudes después de la baja? | Deberia de poder mandar solicitud de alta para ser analizada | Comparte celda con la pregunta 1 |
| 3 | Una solicitud puede tener estado BORRADOR, ENVIADA, ASIGNADA, DERIVADA. Si se da de baja al cliente, ¿Qué sucede con las solicitudes en ENVIADA, ASIGANDA y DERIVADA? Continuan el ciclo de ida por mas que el cliente no tenga cuenta? | Debe poder seguir su curso. Igualmente no encuentro en este momento situaciones que se pudieran presentar de ese tipo | La pregunta no incluye BORRADOR |
| 4 | ¿El historial del Cliente debe seguir visible para Admin después de la baja? | Si | |
| 5 | ¿El Cliente debe recibir una notificación cuando MAPS da de baja su cuenta? | Si | |
| 6 | ¿"Dar de baja" significa desactivar el acceso operativo o también implica eliminación de datos personales? Si implica eliminación, ¿qué información debe conservar MAPS por trazabilidad, operación o requisitos legales? | Desactivar acceso operativo | |

## Baja de Productor

**Definición del original:** "Baja del productor: Dejar de considerarlo un actor operativo activo del Portal".

| # | Pregunta | Respuesta de MAPS | Nota |
| --- | --- | --- | --- |
| 7 | Cuando un Productor es dado de baja, ¿debe perder inmediatamente el acceso al Portal? | Si | |
| 8 | ¿Debe perder también acceso a solicitudes DERIVADA que ya tenia asignadas? | Si | |
| 9 | Que pasa con las solicitudes ASIGNADA todavia no derivadas, deben reasignarse obligatoriamente antes de permitir la baja? | Reasignar | La respuesta no dice si la reasignación debe ocurrir antes de la baja |
| 10 | ¿Qué ocurre con solicitudes DERIVADA cuya gestión comercial externa continúa con ese Productor: permanecen asociadas históricamente o deben reasignarse? | Reasignar | |
| 11 | ¿El sistema debe impedir la baja si el Productor todavía tiene solicitudes activas? | Debe informar a la Org para analizar cada caso | No responde con un sí o un no al bloqueo |
| 12 | ¿La baja puede revertirse/reactivarse? | Si | |
| 13 | ¿Debe conservarse el Productor en el historial de solicitudes y auditoría aunque ya esté dado de baja? | Si | |
| 14 | ¿El Productor debe ser notificado cuando se da de baja su cuenta? | Si | |

## Inhabilitación de Productor

**Definición del original:** "Inhabilitacion de productor: Suspender una capacidad operativa sin dejar de reconocerlo como Productor del sistema".

| # | Pregunta | Respuesta de MAPS | Nota |
| --- | --- | --- | --- |
| 15 | ¿Un Productor inhabilitado conserva acceso a las solicitudes DERIVADAS que ya tenía? | No van a existir casos inhabilitados | |
| 16 | ¿Las solicitudes ASIGNADAS previamente a él pueden continuar su derivación o deben reasignarse? | No van a existir casos inhabilitados | |
| 17 | ¿Puede el Admin volver a habilitarlo sin ninguna otra consecuencia? | No van a existir casos inhabilitados | |

## Dónde quedó registrada cada respuesta

| Preguntas | Regla o documento |
| --- | --- |
| 1 a 6 | [F1 RN-18](./Fase_1__Discovery_y_Relevamiento.md); [F2 §12](../02-diseno/Fase_2__Design_Handoff.md) |
| 7 a 14 | [F1 RN-19](./Fase_1__Discovery_y_Relevamiento.md); [F2 §12](../02-diseno/Fase_2__Design_Handoff.md) |
| 15 a 17 | [F1 RN-20](./Fase_1__Discovery_y_Relevamiento.md), `PENDIENTE MAPS` |

## Puntos que el relevamiento no cierra

Se listan para que no se lean como respondidos. Ninguno es una decisión de este archivo.

- **BORRADOR de un Cliente dado de baja.** La pregunta 3 sólo cubre ENVIADA, ASIGNADA y DERIVADA.
- **Solicitud de alta de un Cliente dado de baja** (pregunta 2). MAPS la menciona sin definir canal, datos ni circuito. Kondor la difirió fuera del MVP (RN-18).
- **Bloqueo de la baja de Productor** (preguntas 9 y 11). MAPS pide reasignar e informar a la organización, sin afirmar que el sistema deba impedir la baja. El tratamiento previo por un Admin es una decisión de alcance de Kondor (RN-19).
- **Inhabilitación** (preguntas 15 a 17). "No van a existir casos inhabilitados" no aclara si la capacidad se elimina del MVP. Sigue abierto en RN-20.
- **Reactivación de un Cliente.** No se preguntó; sólo se confirmó la del Productor (pregunta 12).
- **Plazos de conservación y eliminación física.** La pregunta 6 confirma que la baja no elimina datos, pero no fija plazos.
