import { describe, expect, it } from 'vitest';

import { isDatabaseUnavailable } from '../src/database/errors.js';

// Qué errores de Prisma se traducen a 503 SERVICIO_NO_DISPONIBLE (TDD-SW-008).
describe('MAPS-183 — detección de base no disponible', () => {
  const known = (code: string) => Object.assign(new Error('x'), { name: 'PrismaClientKnownRequestError', code });

  it.each(['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'P1001', 'P1002', 'P1017', 'P2024'])(
    '%s es base no disponible',
    (code) => {
      expect(isDatabaseUnavailable(known(code))).toBe(true);
    },
  );

  it('un error de inicialización de Prisma es base no disponible', () => {
    expect(isDatabaseUnavailable(Object.assign(new Error('x'), { name: 'PrismaClientInitializationError' }))).toBe(true);
  });

  it.each([
    ['credenciales inválidas (configuración, no caída)', known('P1000')],
    ['error de consulta', known('P2002')],
    ['error genérico', new Error('boom')],
    ['valor no error', 'texto'],
  ])('%s no es base no disponible', (_caso, error) => {
    expect(isDatabaseUnavailable(error)).toBe(false);
  });
});
