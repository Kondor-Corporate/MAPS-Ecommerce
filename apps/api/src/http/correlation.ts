import { randomUUID } from 'node:crypto';

import type { RequestHandler, Response } from 'express';

// Correlación por request (TDD-SW-008): cada request tiene un traceId que va en los errores y en los
// logs. Se genera en la API; el `traceparent` entrante no se usa todavía (lo define TDD-CLD-007).
export const correlation: RequestHandler = (_req, res, next) => {
  res.locals.traceId = randomUUID().replaceAll('-', '');
  next();
};

export function traceIdOf(res: Response): string {
  const traceId: unknown = res.locals.traceId;
  return typeof traceId === 'string' ? traceId : randomUUID().replaceAll('-', '');
}
