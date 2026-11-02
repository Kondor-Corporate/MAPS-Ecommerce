# ADR — [título de la decisión]

| Dato | Valor |
| --- | --- |
| ID | `ADR-SW-NNN` o `ADR-CLD-NNN` |
| Título | [título concreto] |
| Estado | `PROPUESTO` |
| Fecha | [AAAA-MM-DD] |
| Autor | [responsable principal] |
| Revisores | [responsable de la otra área y otros revisores aplicables] |
| Work item | [ID real o pendiente] |
| URL del work item | [enlace real o pendiente] |
| Fase origen | [enlaces relativos a F0/F1/F2 y reglas pertinentes] |
| Decisiones relacionadas | [enlaces a ADR/TDD existentes o ninguna] |
| Depende de | [decisiones o definiciones funcionales pendientes, o ninguna] |
| Reemplaza | [ID y enlace, o no aplica] |
| Reemplazado por | [ID y enlace, o no aplica] |

> Estados válidos: `PROPUESTO`, `ACEPTADO`, `RECHAZADO`, `REEMPLAZADO`. Esta plantilla no constituye una decisión. El ID permanente del ADR es independiente del work item. Ubicar el archivo dentro de la carpeta del work item bajo `software/adr/` o `cloud/adr/` y ajustar los enlaces relativos al copiarlo.

## Contexto y problema

[Qué necesidad del Portal y qué restricciones de F0/F1/F2 originan la decisión. Indicar el límite de responsabilidad software/cloud.]

## Drivers y criterios

| Driver o criterio | Importancia | Evidencia / fuente |
| --- | --- | --- |
| [criterio] | [alta/media/baja] | [enlace o fundamento] |

Incluir seguridad, costo, operabilidad, escalabilidad, complejidad y reversibilidad cuando sean relevantes. Separar hechos verificados de supuestos.

## Alternativas consideradas

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| [opción A] | [concreto] | [concreto] | [elegida / descartada / pendiente] |
| [opción B] | [concreto] | [concreto] | [elegida / descartada / pendiente] |

## Decisión

[En `PROPUESTO`, indicar expresamente que es la opción propuesta. En `ACEPTADO`, describir la decisión, su alcance y lo que deliberadamente no resuelve. No presentar una propuesta como aprobada.]

## Consecuencias y trade-offs

[Beneficios, restricciones, costos de operación, dependencias y efectos sobre software/cloud. Enlazar TDD que implementará el diseño cuando exista.]

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| [riesgo o `PENDIENTE FUNCIONAL MAPS`] | [dueño] | [qué permite avanzar y qué permanece condicionado] |

## Criterios de revisión futura

[Hechos o cambios que justificarían reconsiderar la decisión. Si cambia un ADR aceptado, crear un ADR nuevo con `Reemplaza` y marcar el anterior `REEMPLAZADO`; no reescribir su decisión histórica.]

## Referencias y trazabilidad

- Fuentes F0/F1/F2: [enlaces y reglas concretas].
- ADR/TDD relacionados: [enlaces existentes].
- Fila de [traceability.md](../traceability.md): [regla o área].
