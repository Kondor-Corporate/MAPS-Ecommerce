import { describe, expect, it } from 'vitest';

import { loadEnv } from '../src/config/env.js';

const DB = 'postgresql://maps:maps@localhost:5433/maps';

describe('MAPS-183 — configuración de la API', () => {
  it('usa los defaults cuando sólo está DATABASE_URL', () => {
    expect(loadEnv({ DATABASE_URL: DB })).toEqual({ port: 3000, databaseUrl: DB, publicRateLimitPerMinute: 120 });
  });

  it('lee PORT y PUBLIC_RATE_LIMIT_PER_MINUTE', () => {
    expect(loadEnv({ DATABASE_URL: DB, PORT: '8080', PUBLIC_RATE_LIMIT_PER_MINUTE: '30' })).toEqual({
      port: 8080,
      databaseUrl: DB,
      publicRateLimitPerMinute: 30,
    });
  });

  it.each([undefined, ''])('falla si DATABASE_URL es %j', (value) => {
    expect(() => loadEnv({ DATABASE_URL: value })).toThrow(/DATABASE_URL/);
  });

  it.each(['0', '-5', '1.5', 'muchos'])('falla si PUBLIC_RATE_LIMIT_PER_MINUTE es "%s"', (value) => {
    expect(() => loadEnv({ DATABASE_URL: DB, PUBLIC_RATE_LIMIT_PER_MINUTE: value })).toThrow(
      /PUBLIC_RATE_LIMIT_PER_MINUTE/,
    );
  });

  it('falla si PORT es inválido', () => {
    expect(() => loadEnv({ DATABASE_URL: DB, PORT: '70000' })).toThrow(/PORT/);
  });
});
