# ADR — Persistencia y fronteras transaccionales

| Dato | Valor |
| --- | --- |
| ID | `ADR-SW-003` |
| Título | Persistencia y fronteras transaccionales |
| Estado | `PROPUESTO` |
| Fecha | 2026-09-30 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera (revisión cruzada cloud); pendiente de validación final |
| Work item | [MAPS-108](https://santitalavera.atlassian.net/browse/MAPS-108) · subtarea [MAPS-134](https://santitalavera.atlassian.net/browse/MAPS-134) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-108 |
| Fase origen | [F0 §0.1/0.8, decisión 2026-09-11](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §1/4, RN-03/07/08/09/10](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §9/10/12](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-001](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); ADR-SW-004 y TDD-CLD-003 (previstos, sin redactar) |
| Depende de | [ADR-SW-001](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md) |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `PROPUESTO`, `ACEPTADO`, `RECHAZADO`, `REEMPLAZADO`.

## Contexto y problema

El Portal necesita persistir catálogo, formularios versionados, solicitudes, respuestas, consentimientos, asignaciones, intentos de entrega, documentos y auditoría. Algunas operaciones deben confirmarse o rechazarse juntas; otras producen efectos externos (email, storage) que no pueden participar de una transacción de base de datos.

**Frontera con el PostgreSQL histórico de MAPS.** Esa base fue relevada read-only y descartada como dependencia funcional del MVP ([F0 decisión 2026-09-11](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §1](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md)). Este ADR trata sobre una **base nueva y propia del Portal**; no lee, escribe, sincroniza ni migra datos desde la base histórica, y ningún caso de uso depende de ella.

Límite software/cloud: este ADR decide el modelo de persistencia desde la aplicación (ownership, repositorios, unidad de trabajo, atomicidad, snapshots, principios de migración). La instancia gestionada, conexiones, backups, restore y ejecución de migraciones corresponden a TDD-CLD-003 (previsto). La semántica de outbox, asincronía e idempotencia corresponde a ADR-SW-004 (previsto).

## Drivers y criterios

| Driver o criterio | Importancia | Evidencia / fuente |
| --- | --- | --- |
| Consistencia de operaciones que cruzan entidades | Alta | Envío con precio y versión (RN-03/09), cancelación con trazabilidad (RN-10), retiro urgente con Product no disponible ([F2 §10](../../../../02-diseno/Fase_2__Design_Handoff.md)) |
| Preservar significado histórico | Alta | FormVersion inmutable (RN-08); ENVIADA conserva el precio confirmado (RN-09) |
| Ownership por módulo | Alta | [ADR-SW-001](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md) |
| Dominio independiente del ORM | Alta | [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md) |
| Efectos externos confiables | Alta | Entrega exitosa antes de DERIVADA; falla conserva ASIGNADA (RN-06/07) |
| Evolución controlada del esquema | Media | Migraciones versionadas; rollback de contenedor ≠ rollback de datos |

## Alternativas consideradas

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| Base relacional PostgreSQL nueva, única para el Portal, con ownership lógico por módulo | Transacciones ACID locales, integridad referencial, operación simple | La base compartida puede acoplar módulos si no se controla | Propuesta elegida |
| Base de datos por módulo | Aislamiento fuerte | Consistencia distribuida para operaciones que hoy son locales | Descartada para el MVP; reservada para extracción futura |
| Reutilizar o integrar el PostgreSQL histórico de MAPS | Datos existentes | Descartado funcionalmente en F0/F1; semántica insuficiente | Descartada — fuera de alcance |
| Documental/NoSQL | Flexibilidad para respuestas dinámicas | Pierde integridad relacional en Product, versión, solicitud y asignación | Descartada |
| Acceso directo al ORM desde servicios | Rapidez inicial | Rompe ADR-SW-002 y el ownership | Descartada |

## Decisión

Se **propone**:

1. **Base relacional PostgreSQL nueva** para el Portal, inicialmente única, sin dependencia funcional del PostgreSQL histórico de MAPS. La instancia gestionada la define cloud (TDD-CLD-003).
2. **Ownership explícito.** Cada tabla pertenece a un único owner, funcional (un módulo) o técnico (un componente transversal); sólo ese owner escribe. La lectura de datos de otro owner se hace por `ports/in` o por un puerto técnico estrecho del owner correspondiente. El componente técnico Outbox es el owner exclusivo de su tabla y repositorio, según ADR-SW-004. Se permiten claves foráneas entre tablas de distintos owners para integridad, pero una FK no habilita repositorios ni joins cruzados como atajo entre owners, y no se permiten cascadas destructivas entre owners sin una decisión explícita de retención/baja.
3. **Repositorios como puertos de salida.** Cada módulo define sus repositorios en `ports/out`; el ORM es un detalle del adaptador. Prisma es el adaptador candidato ([estructura.md](../../../../estructura.md)) pero no queda aceptado por este ADR.
4. **Unidad de trabajo por caso de uso.** Un caso de uso abre una única transacción que abarca todas las escrituras que deben confirmarse juntas, incluso entre módulos coordinados desde el módulo iniciador. Los repositorios participan de esa transacción; ningún caso de uso abre transacciones anidadas o paralelas.
5. **Efectos externos fuera de la transacción.** Email y operaciones sobre storage no se ejecutan dentro de la transacción. Se registra su intención en la misma transacción que el cambio de negocio y se procesan después; el mecanismo exacto (outbox, reintentos, idempotencia) lo decide ADR-SW-004.
6. **Snapshots** de lo que puede cambiar después del envío: precio confirmado y referencia inmutable a la `FormVersion` usada. Cambios posteriores de catálogo o formularios no alteran una solicitud enviada.
7. **Migraciones** versionadas en el repositorio, revisadas y compatibles hacia atrás con la versión en ejecución (expand/contract). Un rollback de la aplicación no implica rollback de la base.

### Operaciones atómicas y asíncronas

| Operación | Dentro de la transacción | Fuera de la transacción (asíncrono) |
| --- | --- | --- |
| Guardar BORRADOR | Respuestas, referencia a FormVersion, metadata de documentos | Binario fuera de la transacción DB; estrategia explícita de consistencia, staging/recuperación y limpieza entre DB y object storage, a definir en TDD-SW-006/TDD-CLD-004 |
| Enviar solicitud (`BORRADOR → ENVIADA`) | Validación de completitud, snapshot de precio confirmado, FormVersion, consentimientos, cambio de estado, auditoría | Eventos de funnel |
| Asignar/reasignar (`ENVIADA → ASIGNADA`) | Assignment activo, cambio de estado, intención de entrega, auditoría | Envío del email de derivación y reintentos |
| Resultado de entrega exitosa (`ASIGNADA → DERIVADA`) | DeliveryAttempt exitoso, cambio de estado, habilitación de acceso del Productor, auditoría | — |
| Resultado de entrega fallida | DeliveryAttempt fallido; la solicitud **permanece ASIGNADA** | Reintento |
| Cancelar ENVIADA/ASIGNADA | Cambio a CANCELADA con actor, fecha y motivo, auditoría, intención de aviso | Aviso a Admin/Productor |
| Solicitar cancelación DERIVADA | CancellationRequest con motivo, auditoría | Aviso a Admin |
| Decidir cancelación DERIVADA | Decisión, cambio a CANCELADA si se confirma (o se conserva DERIVADA), revocación de acceso, auditoría | Aviso a Cliente/Productor |
| Publicar FormVersion | Estado publicada inmutable, disponibilidad de Product | — |
| Retiro urgente de la última FormVersion | FormVersion retirada, Product no disponible, BORRADOR asociados no utilizables | Avisos |
| Cambiar precio de Product | Nuevo precio vigente (las ENVIADA conservan su snapshot) | — |

### Relación entre entidades con fronteras transaccionales

`Product` referencia su formulario y las `FormVersion` utilizables; `InsuranceRequest` referencia una `FormVersion` concreta y guarda el snapshot de precio; `Assignment` pertenece a una `InsuranceRequest` y a un `Producer`; cada `DeliveryAttempt` pertenece a un `Assignment`. El estado de negocio vive sólo en `InsuranceRequest`; el estado técnico de entrega vive en `DeliveryAttempt`. El detalle de entidades y cardinalidades lo desarrolla [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), que esta decisión habilita.

## Consecuencias y trade-offs

### Positivas

- Transacciones locales para todas las operaciones críticas identificadas.
- Historia preservada por snapshots y versiones inmutables.
- ORM reemplazable sin afectar dominio.
- Límite claro con la base histórica de MAPS.

### Negativas y riesgos

- La base compartida puede volverse punto de acoplamiento si se relaja el ownership.
- La base es un componente crítico: su disponibilidad condiciona todo el Portal.
- Transacciones amplias pueden reducir concurrencia; deben limitarse a lo listado.
- Migraciones expand/contract requieren coordinación entre código y despliegue.

## Revisión cruzada cloud

| Impacto | Documento cloud afectado | Estado de revisión |
| --- | --- | --- |
| Instancia PostgreSQL nueva y gestionada, conexiones y pool | TDD-CLD-003 (previsto) | Pendiente — Santiago Talavera |
| Ejecución de migraciones separada del despliegue de la aplicación | ADR-CLD-003, TDD-CLD-003 (previstos) | Pendiente — Santiago Talavera |
| Procesamiento asíncrono de efectos externos | TDD-CLD-005 (previsto) | Pendiente — Santiago Talavera |

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Acceso cruzado a tablas ajenas | Software | Controlar en code review y reglas de imports |
| Migración destructiva incompatible | Software + Cloud | Aplicar expand/contract y plan de recuperación en TDD-CLD-003 |
| Contrato definitivo de formularios | `PENDIENTE FUNCIONAL MAPS` | Versionado y snapshots avanzan; esquema de respuestas se cierra en TDD-SW-002 tras 1–2 casos reales |
| Retención y eliminación de solicitudes y documentos | `PENDIENTE FUNCIONAL MAPS` | Se modela sin borrado físico; plazos y eliminación quedan condicionados |
| Semántica de outbox y reintentos | Software | Definir en ADR-SW-004 |
| Revisión cruzada cloud sin completar | Santiago Talavera | Completar la tabla antes de pasar a `ACEPTADO` |

## Criterios de revisión futura

Revisar si aparecen necesidades de bases por módulo, persistencia especializada, límites de escalabilidad o requisitos de aislamiento de datos. Si cambia un ADR aceptado, crear uno nuevo que reemplace a `ADR-SW-003`.

## Registro de decisión

| Fecha | Decisión | Participantes | Observaciones |
| --- | --- | --- | --- |
| — | Pendiente: `ACEPTADO` o `RECHAZADO` | — | Requiere validar base nueva, ownership, repositorios, unidad de trabajo, snapshots, migraciones y revisión cruzada cloud |

## Referencias y trazabilidad

- Fuentes F0/F1/F2: [F0 §0.1 y decisión 2026-09-11](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md); [F1 RN-03/06/07/08/09/10](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §10/12](../../../../02-diseno/Fase_2__Design_Handoff.md).
- ADR/TDD relacionados: [ADR-SW-001](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); previstos ADR-SW-004, TDD-SW-002/003/005, TDD-CLD-003.
- Filas de [traceability.md](../../../traceability.md): Product/FormVersion; precio y cancelación; contrato de formularios.
