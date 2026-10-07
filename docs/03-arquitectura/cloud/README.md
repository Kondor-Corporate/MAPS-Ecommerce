# F3 — Cloud y plataforma

> **Estado:** `ADR-CLD-000` redactado como `PROPUESTO`; los demás ADR y todos los TDD Cloud siguen previstos. No hay decisiones Cloud aceptadas ni TDD aprobados.

**Owner principal:** Santiago Talavera. El responsable software realiza revisión cruzada cuando la decisión afecta contratos, dominio, transacciones, seguridad de aplicación o entrega. La [baseline F0/F1/F2](../README.md) y la [trazabilidad](../traceability.md) rigen el alcance.

La [Cloud Strategy](./STRATEGY.md) es el documento rector estratégico transversal entre F0/F1/F2 y los ADR/TDD: **Strategy → ADR → TDD → implementación/operación**. No es un ADR ni acepta servicios.

El área diseña hosting, networking, runtime, ambientes, IAM, datos y storage desde plataforma, infraestructura como código, CI/CD, observabilidad, workers/jobs, migraciones operativas, despliegue y recuperación. GCP sigue siendo una **dirección propuesta** hasta la selección explícita de plataforma en `ADR-CLD-000`; Cloud Run, Cloud SQL PostgreSQL, Cloud Storage privado, Artifact Registry, Secret Manager y Terraform son candidatos, no decisiones aceptadas. El PostgreSQL histórico de MAPS no se incorpora como dependencia funcional por esa propuesta.

## Catálogo de ADR Cloud

| Ola | ID | Decisión por trabajar                                                                           |
| --- | ----------- | ----------------------------------------------------------------------------------------------- |
| Gate 0 | [ADR-CLD-000](./adr/MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md) (`PROPUESTO`) | Selección de plataforma cloud: historia [MAPS-161](https://santitalavera.atlassian.net/browse/MAPS-161), subtask documental [MAPS-162](https://santitalavera.atlassian.net/browse/MAPS-162). Plataforma aún abierta. |
| 1   | ADR-CLD-001 | Hosting frontend y entrada pública; comparar hosting estático, routing y frontend en Cloud Run. |
| 1   | ADR-CLD-002 | Estrategia de ambientes, aislamiento y promoción.                                               |
| 1   | ADR-CLD-003 | Runtime de API, worker, jobs y migraciones.                                                     |
| 3   | ADR-CLD-004 | Infrastructure as Code.                                                                         |
| 3   | ADR-CLD-005 | CI/CD y promoción.                                                                              |
| 3   | ADR-CLD-006 | Observabilidad.                                                                                 |
| 3   | ADR-CLD-007 | Seguridad cloud.                                                                                |

## Catálogo de TDD previstos

| Ola | ID previsto | Diseño por trabajar                                 |
| --- | ----------- | --------------------------------------------------- |
| 2   | TDD-CLD-001 | Topología GCP.                                      |
| 2   | TDD-CLD-002 | Cloud Run para API y worker cuando corresponda.     |
| 2   | TDD-CLD-003 | Cloud SQL, conexiones, backups y migraciones.       |
| 4   | TDD-CLD-004 | Cloud Storage privado y controles.                  |
| 4   | TDD-CLD-005 | Operación de worker, email y reintentos.            |
| 4   | TDD-CLD-006 | IAM y Secret Manager.                               |
| 4   | TDD-CLD-007 | Observabilidad y protección de datos en telemetría. |
| 4   | TDD-CLD-008 | CI/CD y Terraform.                                  |

Los IDs de catálogo no sustituyen al work item real. Cada documento nuevo se crea dentro de una carpeta de unidad de trabajo bajo [adr/](./adr/) o [tdd/](./tdd/), con ID permanente independiente. Empezar con las plantillas compartidas de [ADR](../templates/ADR-template.md) y [TDD](../templates/TDD-template.md), y enlazar ADR/TDD software relacionados.

Si decisiones previas aceptadas reducen suficientemente el espacio de solución, Cloud SQL y Cloud Storage podrían justificarse como derivaciones en `TDD-CLD-003/004`, sin ADR de servicio propio. Ambos TDD deberán validar brevemente alternativas y justificar la elección; no basta con que un servicio aparezca en este catálogo. Al evaluar Cloud Run y Cloud SQL, verificar capacidad de conexiones, concurrencia y apagado ordenado; un rollback de revisión de Cloud Run no revierte una migración de base de datos. El TDD operativo de Delivery/worker debe depender de la semántica definida por Software; storage cloud debe depender del contrato de adjuntos y de la retención funcional que MAPS confirme. Son condiciones de diseño, no servicios elegidos.
