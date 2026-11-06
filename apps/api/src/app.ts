import express, { type Express } from 'express';

import { correlation } from './http/correlation.js';
import { healthRouter } from './http/health.js';
import { problemErrorHandler } from './http/problem.js';
import { rateLimit } from './http/rateLimit.js';
import { catalogRouter } from './modules/catalog/adapters/in/http/catalogRouter.js';
import type { CatalogPublicQuery } from './modules/catalog/ports/in/CatalogPublicQuery.js';

// Lo que la app HTTP necesita de los módulos. main.ts lo arma con los adaptadores reales;
// los tests de contrato pasan dobles.
export interface AppDeps {
  catalogPublicQuery: CatalogPublicQuery;
}

export interface AppOptions {
  /** Requests por minuto y por IP en las rutas públicas del catálogo. */
  publicRateLimitPerMinute: number;
}

export const DEFAULT_APP_OPTIONS: AppOptions = { publicRateLimitPerMinute: 120 };

// Composition root HTTP (ADR-SW-002): acá se cablean los adaptadores de entrada de cada módulo.
export function createApp(deps: AppDeps, options: AppOptions = DEFAULT_APP_OPTIONS): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(correlation);
  app.use(express.json());

  // /health para la plataforma; /api/v1/health para la SPA (base de TDD-SW-008).
  app.use(healthRouter());
  app.use('/api/v1', healthRouter());

  // Rutas públicas anónimas: con límite de frecuencia (TDD-SW-008).
  app.use(
    '/api/v1/catalog',
    rateLimit({ limit: options.publicRateLimitPerMinute, windowMs: 60_000 }),
  );
  app.use('/api/v1', catalogRouter(deps.catalogPublicQuery));

  app.use(problemErrorHandler);

  return app;
}
