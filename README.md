# MAPS - Portal de Solicitudes de Seguros

Portal para **MAPS Organización de Seguros** orientado a publicar productos aseguradores y recibir solicitudes mediante formularios particulares. El cliente crea una cuenta, completa el formulario, guarda borradores y envía la solicitud. Luego, un administrador asigna manualmente un productor y el sistema la deriva mediante la API oficial de WhatsApp. La venta y su cierre se realizan fuera de la plataforma.

La plataforma no incluye carrito, checkout, pagos, contratación automática ni emisión de pólizas.

Baseline funcional completa: [`Fase_0__Kickoff__Gobierno_del_proyecto_.md`](./Fase_0__Kickoff__Gobierno_del_proyecto_.md).

## Estado actual

Este repositorio está en su **estructura inicial** (HU-000): las carpetas del monorepo están creadas, pero las apps (`apps/web`, `apps/api`) todavía no tienen código ni `package.json` propio. La Fase 0 redefine el producto como portal de solicitudes; la arquitectura técnica y el backlog anteriores deberán realinearse con esta nueva baseline antes de implementar módulos funcionales.

## Arquitectura objetivo

- **Monorepo** con `npm` workspaces (`apps/*`, `packages/*`).
- **Frontend** (`apps/web`): React + Vite para catálogo, autenticación, formularios dinámicos, borradores, área del cliente y panel administrador.
- **Backend** (`apps/api`): Node.js + Express + TypeScript, con módulos de autenticación, productos, formularios y versiones, solicitudes, productores, archivos, derivaciones por WhatsApp y auditoría.
- **Base de datos**: PostgreSQL con Prisma ORM (`prisma/`).
- **Paquetes compartidos** (`packages/`): tipos, validadores, configuración y componentes UI reutilizados entre frontend y backend.
- **Autenticación** propia mediante email y contraseña, con JWT de acceso y renovación.
- **Integración externa principal**: API oficial de WhatsApp para enviar al productor un resumen y un enlace seguro de la solicitud.
- **Pagos**: explícitamente excluidos del MVP.

El archivo [`docs/estructura.md`](./docs/estructura.md) conserva la arquitectura técnica inicial y deberá actualizarse para reflejar la Fase 0 vigente.

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
