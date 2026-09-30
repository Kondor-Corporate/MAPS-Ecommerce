# Fase 3 — Arquitectura

> **Estado:** estructura documental inicial; ADR y TDD por elaborar. La creación de esta carpeta no aprueba decisiones técnicas ni cierra F1/F2.

F3 traduce la [baseline funcional F0](../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), el [discovery F1](../01-producto/Fase_1__Discovery_y_Relevamiento.md) y el [Design Handoff F2](../02-diseno/Fase_2__Design_Handoff.md) en decisiones y diseños técnicos que permitan preparar un backlog implementable en F4. Si una propuesta contradice esas fuentes, debe señalar la contradicción y tramitarla como cambio controlado; no reinterpretarla silenciosamente.

## Navegación

| Recurso | Uso |
| --- | --- |
| [Trazabilidad F0/F1/F2 → F3 → F4](./traceability.md) | Relacionar reglas, artefactos técnicos y trabajo posterior sin anticipar IDs de tickets. |
| [Plantilla ADR](./templates/ADR-template.md) | Registrar qué decisión se propone o acepta, alternativas y consecuencias. |
| [Plantilla TDD](./templates/TDD-template.md) | Diseñar cómo se materializa una decisión en MAPS. |
| [Software y dominio](./software/README.md) | Alcance, ownership y catálogo previsto de ADR/TDD software. |
| [Cloud y plataforma](./cloud/README.md) | Alcance, ownership y catálogo previsto de ADR/TDD cloud. |

La dirección de trabajo incluye como **propuestas**, todavía sujetas a ADR, un monolito modular con límites hexagonales y TypeScript; y GCP con Cloud Run, Cloud SQL PostgreSQL, Cloud Storage, Terraform, CI/CD y observabilidad. PostgreSQL histórico de MAPS sigue fuera como dependencia funcional del MVP: evaluar una base nueva para el Portal es una decisión distinta. Ni Prisma, ni hosting frontend, ni topología de ambientes quedan aceptados por figurar aquí.

## Convenciones de documentos

- **ADR** responde qué decisión arquitectónica se tomó y por qué. Estados: `PROPUESTO`, `ACEPTADO`, `RECHAZADO`, `REEMPLAZADO`.
- **TDD** responde cómo se diseña técnicamente para MAPS. Estados: `BORRADOR`, `EN REVISIÓN`, `APROBADO`, `REEMPLAZADO`.
- El ID permanente identifica el documento (`ADR-SW-001`, `TDD-CLD-003`); un work item real de Jira o GitHub organiza el trabajo. No se inventan tickets ni se incorpora su ID al identificador permanente.
- Cada artefacto va en una carpeta de su unidad de trabajo: `software/adr/<work-item>-<tema>/ADR-SW-NNN-<tema>.md` o `cloud/tdd/<work-item>-<tema>/TDD-CLD-NNN-<tema>.md`. `diagrams/` puede vivir dentro de esa carpeta cuando haga falta. Si aún no existe work item, registrar la dependencia y asignarlo antes de crear la carpeta definitiva.
- Los ADR/TDD usan la metadata de sus plantillas, enlaces relativos a fuentes y documentos relacionados, y estado real. Un ID de catálogo es una reserva de planificación, no un artefacto escrito ni una decisión aceptada.
- Un ADR `ACEPTADO` conserva su decisión histórica. Si cambia, se crea otro ADR que indica `Reemplaza`, y el anterior pasa a `REEMPLAZADO`; no se reescribe retrospectivamente la decisión.

## Ownership y revisión

| Área | Responsable principal | Revisión cruzada |
| --- | --- | --- |
| Software/dominio | Joaquin Rodriguez | Revisa impactos en runtime, datos, seguridad, operaciones y despliegue. |
| Cloud/plataforma | Santiago Talavera | Revisa impactos en dominio, contratos, transacciones y operación de la aplicación. |

Ownership no es aislamiento. La decisión de identidad y autorización de negocio pertenece a software; IAM y cuentas de servicio a cloud. El modelo de adjuntos pertenece a software; buckets y permisos GCS a cloud. La semántica de Assignment/Delivery/Outbox pertenece a software; la ejecución y los reintentos del worker a cloud. Se enlazan los documentos dependientes en lugar de duplicar la decisión.

## Secuencia de trabajo

1. Leer F0/F1/F2, los ADR/TDD relacionados y el work item real, si existe.
2. Abrir la carpeta del work item y preparar el ADR como `PROPUESTO`, con alternativas y revisión cruzada. Pasarlo a `ACEPTADO` sólo tras la decisión correspondiente.
3. Diseñar el TDD relacionado como `BORRADOR`; revisar límites, datos, fallos, seguridad, observabilidad y operaciones hasta `APROBADO`. Un TDD no convierte por sí mismo un ADR propuesto en aceptado.
4. Actualizar [traceability.md](./traceability.md), con enlaces a artefactos existentes y dependencias pendientes. Completar Epic/Issues F4 sólo cuando existan.

El trabajo se organiza por olas, descritas en los README de [software](./software/README.md) y [cloud](./cloud/README.md). El orden puede variar ante dependencias reales. No se generan todos los ADR/TDD de una vez.

## Pendientes funcionales y gate

F3 puede avanzar sobre decisiones independientes de MAPS. El contrato definitivo de formularios, campos de Mi perfil, efectos de baja de Cliente/Productor, efectos adicionales de inhabilitación y reglas de retención permanecen como **PENDIENTE FUNCIONAL MAPS**. Cada ADR/TDD afectado debe indicar qué falta, qué parte puede diseñarse y qué parte queda condicionada. Ninguna suposición técnica cierra esos pendientes ni F1/F2.

F3 podrá considerarse cerrada cuando los ADR principales estén `ACEPTADO`, los TDD aplicables `APROBADO`, estén definidos límites, dominio, estados, identidad/RBAC, entrega, adjuntos, API, topología, ambientes, runtime, datos y migraciones, IAM, IaC, CI/CD, observabilidad y seguridad, y la trazabilidad hacia F4 esté completa o explicite dependencias externas. Este índice no satisface ese gate.
