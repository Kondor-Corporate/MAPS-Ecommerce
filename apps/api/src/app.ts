import express, { type Express } from 'express';

import { healthRouter } from './http/health.js';

// Composition root HTTP (ADR-SW-002): acá se cablean los adaptadores de entrada de cada módulo.
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());

  // /health para la plataforma; /api/v1/health para la SPA (base de TDD-SW-008).
  app.use(healthRouter());
  app.use('/api/v1', healthRouter());

  return app;
}
