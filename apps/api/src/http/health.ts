import { Router } from 'express';

// Liveness: responde sin consultar base ni proveedores (PROTOCOL-CLD-000).
export function healthRouter(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return router;
}
