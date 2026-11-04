import type { RequestHandler } from 'express';

// Límite de frecuencia de aplicación para rutas públicas anónimas (TDD-SW-008).
// Ventana fija por IP, en memoria: protege una instancia. La protección de borde la decide
// ADR-CLD-001/ADR-CLD-007. El valor es configurable (MAPS no lo definió; AGENTS.md §5.6).

export class RateLimitExceededError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super('Límite de frecuencia excedido');
    this.name = 'RateLimitExceededError';
  }
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
}

export function rateLimit({ limit, windowMs, now = Date.now }: RateLimitOptions): RequestHandler {
  const windows = new Map<string, { start: number; count: number }>();

  return (req, _res, next) => {
    const t = now();
    // Limpieza perezosa de ventanas vencidas para no crecer sin límite.
    if (windows.size > 10_000) {
      for (const [key, w] of windows) if (t - w.start >= windowMs) windows.delete(key);
    }

    const key = req.ip ?? 'desconocida';
    const current = windows.get(key);
    const window = current && t - current.start < windowMs ? current : { start: t, count: 0 };
    window.count += 1;
    windows.set(key, window);

    if (window.count > limit) {
      return next(new RateLimitExceededError(Math.ceil((window.start + windowMs - t) / 1000)));
    }
    next();
  };
}
