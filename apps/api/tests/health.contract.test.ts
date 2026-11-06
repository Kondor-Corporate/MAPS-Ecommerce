import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';

describe('MAPS-179 — GET /health responde OK', () => {
  const app = createApp();

  it('GET /health responde 200 con { status: "ok" }', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /api/v1/health responde lo mismo para la SPA', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('una ruta inexistente responde 404', async () => {
    const res = await request(app).get('/api/v1/no-existe');

    expect(res.status).toBe(404);
  });
});
