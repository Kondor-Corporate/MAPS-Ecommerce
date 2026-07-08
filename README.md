# MAPS E-commerce

E-commerce de seguros enlatados para **MAPS Organización de Seguros**. Permite publicar productos con condiciones cerradas (precio, coberturas, exclusiones y requisitos ya definidos) para que un cliente pueda contratarlos y pagarlos directamente, sin cotización manual. Los procesos de contratación que se abandonan antes de pagar quedan registrados como potenciales clientes para que un productor los recupere comercialmente.

Contexto funcional completo: [`Fase_0__Kickoff__Gobierno_del_proyecto_.md`](./Fase_0__Kickoff__Gobierno_del_proyecto_.md).

## Estado actual

Este repositorio está en su **estructura inicial** (HU-000): las carpetas del monorepo están creadas, pero las apps (`apps/web`, `apps/api`) todavía no tienen código ni `package.json` propio. Los detalles de arquitectura, stack y modelo de datos se definen en `docs/estructura.md`.

## Arquitectura

- **Monorepo** con `npm` workspaces (`apps/*`, `packages/*`).
- **Frontend** (`apps/web`): React + Vite. Incluye la tienda pública y el panel administrador.
- **Backend** (`apps/api`): Node.js + Express + TypeScript, exponiendo una API REST organizada por módulos (auth, products, checkout, payments, policies, leads, etc.).
- **Base de datos**: PostgreSQL, modelada con Prisma ORM (`prisma/`).
- **Paquetes compartidos** (`packages/`): tipos, validadores, configuración y componentes UI reutilizados entre frontend y backend.
- **Autenticación** propia (email + contraseña) con JWT (access + refresh token).
- **Pagos**: capa de integración desacoplada (`payment-gateway`), proveedor definitivo pendiente de definición por MAPS.

Detalle completo de estructura, módulos, entidades de datos, rutas de API y decisiones técnicas: [`docs/estructura.md`](./docs/estructura.md).

## Estructura del repositorio

```txt
maps-ecommerce/
├── apps/
│   ├── web/        # Frontend (React + Vite)
│   └── api/         # Backend (Node.js + Express + TypeScript)
├── packages/         # Código compartido (ui, types, validators, config, emails)
├── prisma/           # Esquema, migraciones y seed de base de datos
├── docs/             # Documentación viva del proyecto
├── infra/            # Docker, scripts y configuración de deploy
└── .github/          # Workflows de CI/CD
```

## Documentación

- [`docs/estructura.md`](./docs/estructura.md): arquitectura técnica completa.
- [`docs/00-proyecto/`](./docs/00-proyecto): alcance, decisiones, riesgos y minutas.
- [`docs/03-tecnico/`](./docs/03-tecnico): arquitectura, API, modelo de datos, seguridad y deploy.
- [`docs/tdd/`](./docs/tdd): Technical Design Documents por feature.

## Cómo correr el proyecto

Todavía no hay código ejecutable en `apps/web` ni `apps/api` (ver "Estado actual"). Esta sección se completa cuando esas apps tengan su propio `package.json` y scripts de `dev`, `build`, `lint` y `test`.

## Convenciones

- Commits y PRs siguen `tipo(scope): descripcion` (ver `.githooks/commit-msg` y `.github/pull_request_template.md`).
- Ramas por historia de usuario: `feature/HU-XXX-descripcion`.
