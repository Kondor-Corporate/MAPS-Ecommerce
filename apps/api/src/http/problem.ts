import type { ErrorRequestHandler, Response } from 'express';

import { ServiceUnavailableError } from '../common/errors/ServiceUnavailableError.js';
import { traceIdOf } from './correlation.js';
import { RateLimitExceededError } from './rateLimit.js';

// Modelo único de errores (TDD-SW-008, RFC 9457). La UI decide por `code`, no por `status`.
// Códigos de la capa HTTP implementados: PETICION_INVALIDA, LIMITE_FRECUENCIA,
// SERVICIO_NO_DISPONIBLE y ERROR_INTERNO.

export interface FieldError {
  field: string;
  code: string;
}

export class InvalidRequestError extends Error {
  constructor(readonly errors: FieldError[]) {
    super('Petición inválida');
    this.name = 'InvalidRequestError';
  }
}

function sendProblem(res: Response, status: number, code: string, title: string, errors: FieldError[] = []) {
  res
    .status(status)
    .type('application/problem+json')
    .send(
      JSON.stringify({
        type: `urn:maps-portal:problem:${code.toLowerCase().replaceAll('_', '-')}`,
        title,
        status,
        code,
        traceId: traceIdOf(res),
        errors,
      }),
    );
}

// Último middleware de la app: traduce errores a problem+json sin filtrar detalle interno.
export const problemErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof InvalidRequestError) {
    return sendProblem(res, 400, 'PETICION_INVALIDA', 'La petición no es válida', err.errors);
  }

  if (err instanceof RateLimitExceededError) {
    res.set('Retry-After', String(err.retryAfterSeconds));
    return sendProblem(res, 429, 'LIMITE_FRECUENCIA', 'Demasiadas peticiones');
  }

  // Sin PII: sólo el tipo de error y el traceId para correlacionar (AGENTS.md §5.7).
  if (err instanceof ServiceUnavailableError) {
    console.error(`[${traceIdOf(res)}] Dependencia no disponible: ${err.dependency}`);
    return sendProblem(res, 503, 'SERVICIO_NO_DISPONIBLE', 'Servicio no disponible');
  }

  console.error(`[${traceIdOf(res)}] Error no controlado: ${err instanceof Error ? err.name : typeof err}`);
  return sendProblem(res, 500, 'ERROR_INTERNO', 'Error interno');
};
