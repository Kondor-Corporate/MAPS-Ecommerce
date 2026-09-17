# MAPS - Portal de Solicitudes de Seguros

Portal para publicar productos aseguradores, permitir que una persona autenticada inicie y recupere una `InsuranceRequest`, y derivar de forma segura una solicitud formal a un productor. No es un e-commerce: no incluye checkout, pagos, contratación ni emisión automática.

El catálogo es público y todos los Products publicados del MVP son seguros enlatados con precio fijo vigente, administrado por Admin. Al iniciar una solicitud, el usuario se registra o inicia sesión y se crea una `InsuranceRequest` en **BORRADOR**; al enviar pasa a **ENVIADA** y conserva como snapshot funcional el precio confirmado. Si el precio cambia mientras existe un BORRADOR, el usuario debe ser informado y confirmar el nuevo valor antes de enviar. Un Admin la gestiona y asigna manualmente a un Productor. El sistema intenta una derivación/notificación transaccional con resumen mínimo y enlace seguro read-only; sólo tras la entrega requerida exitosa la solicitud pasa a **DERIVADA**, el Productor accede al expediente y continúa la gestión comercial fuera del Portal.

## Alcance del MVP

- Catálogo y administración de productos por MAPS.
- Formularios dinámicos/versionados por producto, con contrato funcional acotado preliminar a validar con formularios reales.
- Registro/login, borradores recuperables, **Mis solicitudes** y envío formal.
- Bandeja Admin, asignación/reasignación, email transaccional y acceso seguro del Productor.
- Auditoría, cancelación por estado y analítica básica del funnel sin PII innecesaria ni automatismos comerciales.

Fuera del MVP: Leads/Potenciales clientes e integración con Intranet, PostgreSQL MAPS como dependencia funcional, Portal del Asegurado/pólizas/PDF, checkout, pagos, cotizador, simulador, cálculo personalizado, panel general de productores y constructor universal de formularios. Recovery de abandonos sólo podrá evaluarse en una evolución futura con métricas reales del funnel.

## Estado actual

El repositorio mantiene estructura inicial de monorepo. Esta baseline es exclusivamente funcional y documental; no implementa arquitectura ni aplicaciones. El prototipo UX/UI es una referencia visual/interactiva y el Design Handoff de Fase 2 documenta su comportamiento funcional sin definir implementación.

## Documentación vigente

- [Fase 0 — Baseline funcional vigente](./docs/00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md)
- [Fase 1 — Discovery y Relevamiento](./docs/01-producto/Fase_1__Discovery_y_Relevamiento.md)
- [Fase 2 — Design Handoff](./docs/02-diseno/Fase_2__Design_Handoff.md)

`docs/estructura.md`, los TDDs y el material UI/UX previo se conservan como históricos: no definen el alcance vigente cuando contradicen Fase 0/Fase 1.

## Convenciones

- Commits y PRs: `tipo(scope): descripcion`.
- Esta baseline no modifica `apps/web`, `apps/api` ni infraestructura.
