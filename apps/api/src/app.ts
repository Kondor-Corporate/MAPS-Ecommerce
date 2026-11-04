import express, { type Express } from 'express';

import { healthRouter } from './http/health.js';
import { problemErrorHandler } from './http/problem.js';
import { catalogRouter } from './modules/catalog/adapters/in/http/catalogRouter.js';
import type { CatalogPublicQuery } from './modules/catalog/ports/in/CatalogPublicQuery.js';

// Lo que la app HTTP necesita de los módulos. main.ts lo arma con los adaptadores reales;
// los tests de contrato pasan dobles.
export interface AppDeps {
  catalogPublicQuery: CatalogPublicQuery;
}

// Composition root HTTP (ADR-SW-002): acá se cablean los adaptadores de entrada de cada módulo.
export function createApp(deps: AppDeps): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());

  // /health para la plataforma; /api/v1/health para la SPA (base de TDD-SW-008).
  app.use(healthRouter());
  app.use('/api/v1', healthRouter());

  app.use('/api/v1', catalogRouter(deps.catalogPublicQuery));

  app.use(problemErrorHandler);

  return app;
}
