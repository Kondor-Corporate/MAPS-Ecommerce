# F3 — Cloud y plataforma

> **Estado:** GCP está adoptado para el MVP por `ADR-CLD-000` (`ACEPTADO`). Los artefactos Cloud de Wave 1 indicados abajo ya existen en `main`; cada uno mantiene su estado formal. Integración, revisión o relación con una PR no equivalen por sí solas a aceptación/aprobación ni aceptan servicios automáticamente.

**Owner principal:** Santiago Talavera. El responsable software realiza revisión cruzada cuando la decisión afecta contratos, dominio, transacciones, seguridad de aplicación o entrega. La [baseline F0/F1/F2](../README.md) y la [trazabilidad](../traceability.md) rigen el alcance.

La [Cloud Strategy](./STRATEGY.md) es el documento rector estratégico transversal entre F0/F1/F2 y los ADR/TDD: **Strategy → ADR → TDD → implementación/operación**. No es un ADR ni acepta servicios.

El área diseña hosting, networking, runtime, ambientes, IAM, datos y storage desde plataforma, infraestructura como código, CI/CD, observabilidad, workers/jobs, migraciones operativas, despliegue y recuperación. GCP es la **plataforma aceptada para el MVP** por `ADR-CLD-000`; los servicios concretos mantienen el estado de sus propios ADR/TDD y no quedan aceptados por figurar en catálogos o diseños propuestos. El PostgreSQL histórico de MAPS no se incorpora como dependencia funcional.

## Catálogo de ADR Cloud

| Ola / paquete | ID y documento | Estado documental | Tema / Jira |
| --- | --- | --- | --- |
| Gate 0 | [ADR-CLD-000](./adr/MAPS-161-seleccion-plataforma-cloud/ADR-CLD-000-seleccion-plataforma-cloud.md) | `ACEPTADO` | GCP como plataforma del MVP; [MAPS-161](https://santitalavera.atlassian.net/browse/MAPS-161) `Listo`, [MAPS-162](https://santitalavera.atlassian.net/browse/MAPS-162) `Listo`. Servicios y topología quedan abiertos. |
| Wave 1 / C3 | [ADR-CLD-001](./adr/MAPS-146-hosting-frontend-entrada-publica/ADR-CLD-001-hosting-frontend-y-entrada-publica.md) | `PROPUESTO` | Hosting frontend y entrada pública; [MAPS-146](https://santitalavera.atlassian.net/browse/MAPS-146) `En curso`. |
| Wave 1 / C3 | [ADR-CLD-002](./adr/MAPS-147-estrategia-ambientes/ADR-CLD-002-estrategia-de-ambientes-aislamiento-y-promocion.md) | `PROPUESTO` | Ambientes, aislamiento y promoción; [MAPS-147](https://santitalavera.atlassian.net/browse/MAPS-147) `En curso`. |
| Wave 1 / C1 | [ADR-CLD-003](./adr/MAPS-148-runtime-api-worker-jobs-migraciones/ADR-CLD-003-runtime-api-worker-jobs-migraciones.md) | `PROPUESTO` | Runtime de API, worker, jobs y migraciones; [MAPS-148](https://santitalavera.atlassian.net/browse/MAPS-148) `En curso`. |
| Wave 2 / C8 | ADR-CLD-004 (previsto) | — | Infrastructure as Code; [MAPS-149](https://santitalavera.atlassian.net/browse/MAPS-149) `Listo`. |
| Wave 2 / C8 | ADR-CLD-005 (previsto) | — | CI/CD y promoción; [MAPS-150](https://santitalavera.atlassian.net/browse/MAPS-150) `Listo`. |
| Wave 2 / C5 | ADR-CLD-006 (previsto) | — | Observabilidad; [MAPS-151](https://santitalavera.atlassian.net/browse/MAPS-151) `Listo`. |
| Wave 1 / C2 | [ADR-CLD-007](./adr/MAPS-152-seguridad-cloud/ADR-CLD-007-seguridad-cloud.md) | `PROPUESTO` | Seguridad cloud; [MAPS-152](https://santitalavera.atlassian.net/browse/MAPS-152) `En curso`. |

## Catálogo de TDD

| Ola / paquete | ID y documento | Estado documental | Tema / Jira |
| --- | --- | --- | --- |
| Wave 2 / C4 | TDD-CLD-001 (previsto) | — | Topología GCP; [MAPS-153](https://santitalavera.atlassian.net/browse/MAPS-153) `Listo`. |
| Wave 2 / C4 | TDD-CLD-002 (previsto) | — | Materialización de runtime Cloud Run; [MAPS-154](https://santitalavera.atlassian.net/browse/MAPS-154) `Listo`. |
| Wave 1 / C1 | [TDD-CLD-003](./tdd/MAPS-155-cloud-sql-conexiones-backups-migraciones/TDD-CLD-003-cloud-sql-conexiones-backups-migraciones.md) | `BORRADOR` | Cloud SQL, conexiones, backups y migraciones; [MAPS-155](https://santitalavera.atlassian.net/browse/MAPS-155) `En curso`. |
| Wave 3 / C7 | TDD-CLD-004 (previsto) | — | Cloud Storage privado y controles; [MAPS-156](https://santitalavera.atlassian.net/browse/MAPS-156) `Listo`. |
| Wave 3 / C6 | TDD-CLD-005 (previsto) | — | Operación de worker, email y reintentos; [MAPS-157](https://santitalavera.atlassian.net/browse/MAPS-157) `Listo`. |
| Wave 1 / C2 | [TDD-CLD-006](./tdd/MAPS-158-iam-secret-manager/TDD-CLD-006-iam-y-secret-manager.md) | `BORRADOR` | IAM y Secret Manager; [MAPS-158](https://santitalavera.atlassian.net/browse/MAPS-158) `En curso`. |
| Wave 2 / C5 | TDD-CLD-007 (previsto) | — | Observabilidad y protección de datos en telemetría; [MAPS-159](https://santitalavera.atlassian.net/browse/MAPS-159) `Listo`. |
| Wave 2 / C8 | TDD-CLD-008 (previsto) | — | CI/CD y Terraform; [MAPS-160](https://santitalavera.atlassian.net/browse/MAPS-160) `Listo`. |

Wave 1 agrupa C1 (runtime/database), C2 (security/IAM) y C3 (public entry/environments); Wave 2 agrupa C4 (topología), C5 (observabilidad) y C8 (IaC/CI-CD); Wave 3 agrupa C6 (worker/email) y C7 (storage). La asignación de paquete no cambia el ownership ni el estado del documento. Los IDs de catálogo no sustituyen al work item real. Cada documento nuevo se crea dentro de una carpeta de unidad de trabajo bajo [adr/](./adr/) o [tdd/](./tdd/), con ID permanente independiente. Empezar con las plantillas compartidas de [ADR](../templates/ADR-template.md) y [TDD](../templates/TDD-template.md), y enlazar ADR/TDD software relacionados.

Si decisiones previas aceptadas reducen suficientemente el espacio de solución, Cloud SQL y Cloud Storage podrían justificarse como derivaciones en `TDD-CLD-003/004`, sin ADR de servicio propio. Ambos TDD deberán validar brevemente alternativas y justificar la elección; no basta con que un servicio aparezca en este catálogo. Al evaluar Cloud Run y Cloud SQL, verificar capacidad de conexiones, concurrencia y apagado ordenado; un rollback de revisión de Cloud Run no revierte una migración de base de datos. El TDD operativo de Delivery/worker debe depender de la semántica definida por Software; storage cloud debe depender del contrato de adjuntos y de la retención funcional que MAPS confirme. Son condiciones de diseño, no servicios elegidos.
