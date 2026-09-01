# MAPS - Portal de Seguros

Portal para **MAPS Organización de Seguros** con dos capacidades principales: recibir y derivar solicitudes de seguros, y permitir que el asegurado consulte los seguros o servicios que tiene contratados y la información básica disponible de sus pólizas.

Para las solicitudes, el cliente dispone de una cuenta mediante email y contraseña, puede conservar borradores y debe autenticarse antes del envío definitivo; el momento exacto del registro se definirá en Fase 2. Luego, un administrador asigna manualmente un productor y el sistema deriva la solicitud para que la gestión comercial continúe fuera de la plataforma.

La plataforma no incluye carrito, checkout, pagos, contratación automática ni emisión de pólizas. La visualización o descarga del PDF de una póliza no queda comprometida hasta confirmar que Federación Patronal o la fuente correspondiente permita obtenerlo.

Baseline funcional completa: [`Fase_0__Kickoff__Gobierno_del_proyecto_.md`](./Fase_0__Kickoff__Gobierno_del_proyecto_.md).

## Estado actual

Este repositorio está en su **estructura inicial** (HU-000): las carpetas del monorepo están creadas, pero las apps (`apps/web`, `apps/api`) todavía no tienen código ni `package.json` propio. La Fase 0 redefine el producto como Portal de Seguros, separa la visión objetivo del MVP y reserva para las Fases 1–3 el discovery detallado, las decisiones de UX y la arquitectura. La documentación técnica y el backlog anteriores deberán realinearse antes de implementar módulos funcionales.

## Definiciones técnicas pendientes

La estructura actual del monorepo es una base inicial y no constituye por sí sola una arquitectura aprobada. Las decisiones se cerrarán de forma progresiva:

- **Fase 1:** procesos, requerimientos, datos disponibles, productos, reglas y modelo de dominio inicial.
- **Fase 2:** journeys, navegación, wireframes, wireflows y momento exacto de autenticación.
- **Fase 3:** arquitectura de frontend y backend, autenticación y autorización detalladas, persistencia, almacenamiento, formularios configurables e integraciones.

El archivo [`docs/estructura.md`](./docs/estructura.md) conserva una propuesta técnica anterior y no debe considerarse vigente hasta su realineación en Fase 3.

## Estructura del repositorio

```txt
maps-ecommerce/
├── apps/
│   ├── web/          # Frontend (React + Vite)
│   └── api/          # Backend (Node.js + Express + TypeScript)
├── packages/         # Código compartido (ui, types, validators, config, emails)
├── prisma/           # Esquema, migraciones y seed de base de datos
├── docs/             # Documentación viva del proyecto
├── infra/            # Docker, scripts y configuración de deploy
└── .github/          # Workflows de CI/CD
```

## Documentación

- [`Fase_0__Kickoff__Gobierno_del_proyecto_.md`](./Fase_0__Kickoff__Gobierno_del_proyecto_.md): baseline funcional vigente.
- [`docs/estructura.md`](./docs/estructura.md): arquitectura técnica inicial pendiente de realineación.
- [`docs/00-proyecto/`](./docs/00-proyecto): alcance, decisiones, riesgos y minutas.
- [`docs/03-tecnico/`](./docs/03-tecnico): arquitectura, API, modelo de datos, seguridad y deploy.
- [`docs/tdd/`](./docs/tdd): Technical Design Documents por feature.

## Cómo correr el proyecto

Todavía no hay código ejecutable en `apps/web` ni en `apps/api`. Esta sección se completará cuando esas apps tengan sus propios `package.json` y scripts de `dev`, `build`, `lint` y `test`.

## Convenciones

- Commits y PRs siguen `tipo(scope): descripcion` (ver `.githooks/commit-msg` y `.github/pull_request_template.md`).
- Ramas por historia de usuario o documentación: `feature/HU-XXX-descripcion` o `docs/descripcion`.
