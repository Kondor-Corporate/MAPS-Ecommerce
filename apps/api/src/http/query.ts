import type { Request } from 'express';

import { type FieldError, InvalidRequestError } from './problem.js';

// Parámetros de listados (TDD-SW-008): page desde 1, pageSize 20 por defecto y máximo 100,
// filtros con lista permitida por endpoint. Cualquier otro parámetro responde 400.

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_QUERY_TEXT_LENGTH = 100;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POSITIVE_INT = /^[1-9]\d{0,5}$/;

export type FilterKind = 'uuid' | 'text';

export interface ListQuery {
  page: number;
  pageSize: number;
  filters: Record<string, string>;
}

export function parseListQuery(req: Request, allowedFilters: Record<string, FilterKind>): ListQuery {
  const errors: FieldError[] = [];
  const raw = req.query as Record<string, unknown>;
  const filters: Record<string, string> = {};
  let page = 1;
  let pageSize = DEFAULT_PAGE_SIZE;

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== 'string') {
      errors.push({ field: key, code: 'VALOR_INVALIDO' });
      continue;
    }

    if (key === 'page') {
      if (POSITIVE_INT.test(value)) page = Number(value);
      else errors.push({ field: key, code: 'VALOR_INVALIDO' });
    } else if (key === 'pageSize') {
      if (POSITIVE_INT.test(value) && Number(value) <= MAX_PAGE_SIZE) pageSize = Number(value);
      else errors.push({ field: key, code: 'VALOR_INVALIDO' });
    } else if (key in allowedFilters) {
      const kind = allowedFilters[key];
      if (kind === 'uuid') {
        if (UUID.test(value)) filters[key] = value;
        else errors.push({ field: key, code: 'VALOR_INVALIDO' });
      } else {
        const text = value.trim();
        if (text.length > MAX_QUERY_TEXT_LENGTH) errors.push({ field: key, code: 'VALOR_INVALIDO' });
        else if (text !== '') filters[key] = text;
      }
    } else {
      errors.push({ field: key, code: 'PARAMETRO_NO_PERMITIDO' });
    }
  }

  if (errors.length > 0) throw new InvalidRequestError(errors);
  return { page, pageSize, filters };
}

export function pageInfo(page: number, pageSize: number, totalItems: number) {
  return { number: page, size: pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
}
