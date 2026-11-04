import { randomUUID } from 'node:crypto';

import type { ErrorRequestHandler, Response } from 'express';

// Modelo único de errores (TDD-SW-008, RFC 9457). La UI decide por `code`, no por `status`.
// MAPS-183 implementa sólo los códigos de la capa HTTP que necesita: PETICION_INVALIDA y ERROR_INTERNO.

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

function sendProblem(
  res: Response,
  status: number,
  code: string,
  title: string,
  traceId: string,
  errors: FieldError[] = [],
) {
  res
    .status(status)
    .type('application/problem+json')
    .send(
      JSON.stringify({
        type: `urn:maps-portal:problem:${code.toLowerCase().replaceAll('_', '-')}`,
        title,
        status,
        code,
        traceId,
        errors,
      }),
    );
}

// Último middleware de la app: traduce errores a problem+json sin filtrar detalle interno.
export const problemErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) return next(err);
  const traceId = randomUUID().replaceAll('-', '');

  if (err instanceof InvalidRequestError) {
    return sendProblem(res, 400, 'PETICION_INVALIDA', 'La petición no es válida', traceId, err.errors);
  }

  // Sin PII: sólo el tipo de error y el traceId para correlacionar (AGENTS.md §5.7).
  console.error(`[${traceId}] Error no controlado: ${err instanceof Error ? err.name : typeof err}`);
  return sendProblem(res, 500, 'ERROR_INTERNO', 'Error interno', traceId);
};
