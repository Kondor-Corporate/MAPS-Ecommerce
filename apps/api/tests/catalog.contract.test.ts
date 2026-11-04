import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import type {
  CatalogPublicQuery,
  ListPublishedProductsParams,
  PublishedProductsPage,
  PublicProduct,
} from '../src/modules/catalog/ports/in/CatalogPublicQuery.js';

// Contrato HTTP del catálogo público (TDD-SW-008: rutas, listados, montos y problem+json).
// La consulta se reemplaza por un doble: qué productos se listan lo prueba la integración con Postgres.

const PATRIMONIALES = { id: '0b6f8a52-2f53-4a38-9d0e-0a8f5c1d7a11', name: 'Seguros Patrimoniales', slug: 'patrimoniales' };
const PERSONAS = { id: '5c1e2d34-7a8b-4c9d-8e0f-1a2b3c4d5e6f', name: 'Seguros de Personas', slug: 'personas' };

const COMBINADO: PublicProduct = {
  id: '3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  name: 'Combinado Familiar',
  summary: 'Tu casa no es sólo paredes y techo.',
  category: PATRIMONIALES,
  price: { amount: '30000.00', currency: 'ARS' },
};
const MASCOTAS: PublicProduct = {
  id: '9a8b7c6d-5e4f-4a3b-9c1d-0e9f8a7b6c5d',
  name: 'Seguro de Mascotas',
  summary: 'Ellos no son sólo mascotas; son parte de nuestra familia.',
  category: PERSONAS,
  price: { amount: '15000.00', currency: 'ARS' },
};

function consultaFalsa(resultado: PublishedProductsPage = { items: [COMBINADO, MASCOTAS], totalItems: 2 }) {
  const llamadas: ListPublishedProductsParams[] = [];
  const query: CatalogPublicQuery = {
    async listPublishedProducts(params) {
      llamadas.push(params);
      return resultado;
    },
  };
  return { query, llamadas };
}

function appCon(query: CatalogPublicQuery) {
  return createApp({ catalogPublicQuery: query });
}

describe('MAPS-183 — un visitante ve los productos publicados con nombre, categoría y precio fijo vigente', () => {
  it('un visitante sin login ve el catálogo (200 sin Authorization)', async () => {
    const { query } = consultaFalsa();

    const res = await request(appCon(query)).get('/api/v1/catalog/products');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('cada producto trae nombre, categoría y precio fijo vigente, sin exponer versiones ni históricos', async () => {
    const { query } = consultaFalsa();

    const res = await request(appCon(query)).get('/api/v1/catalog/products');

    expect(res.body.items).toEqual([COMBINADO, MASCOTAS]);
    for (const item of res.body.items) {
      expect(Object.keys(item).sort()).toEqual(['category', 'id', 'name', 'price', 'summary']);
    }
  });

  it('el monto viaja como string decimal con dos decimales y moneda ARS', async () => {
    const { query } = consultaFalsa();

    const res = await request(appCon(query)).get('/api/v1/catalog/products');

    expect(res.body.items[0].price).toEqual({ amount: '30000.00', currency: 'ARS' });
  });
});

describe('MAPS-183 — contrato del listado (TDD-SW-008)', () => {
  it('responde con { items, page } y la página por defecto es 1 de 20', async () => {
    const { query, llamadas } = consultaFalsa({ items: [COMBINADO, MASCOTAS], totalItems: 45 });

    const res = await request(appCon(query)).get('/api/v1/catalog/products');

    expect(res.body.page).toEqual({ number: 1, size: 20, totalItems: 45, totalPages: 3 });
    expect(llamadas).toEqual([{ page: 1, pageSize: 20 }]);
  });

  it('pasa page, pageSize, categoryId y q a la consulta', async () => {
    const { query, llamadas } = consultaFalsa();

    await request(appCon(query))
      .get('/api/v1/catalog/products')
      .query({ page: 2, pageSize: 100, categoryId: PATRIMONIALES.id, q: 'incendio' });

    expect(llamadas).toEqual([{ page: 2, pageSize: 100, categoryId: PATRIMONIALES.id, q: 'incendio' }]);
  });

  it('un catálogo vacío responde 200 con items vacíos y totalPages 0', async () => {
    const { query } = consultaFalsa({ items: [], totalItems: 0 });

    const res = await request(appCon(query)).get('/api/v1/catalog/products');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], page: { number: 1, size: 20, totalItems: 0, totalPages: 0 } });
  });

  it.each([
    ['pageSize mayor a 100', { pageSize: 101 }],
    ['pageSize menor a 1', { pageSize: 0 }],
    ['page menor a 1', { page: 0 }],
    ['page no numérico', { page: 'dos' }],
    ['categoryId que no es UUID', { categoryId: 'patrimoniales' }],
    ['filtro no permitido', { sort: 'precio' }],
  ])('%s responde 400 PETICION_INVALIDA en problem+json', async (_caso, params) => {
    const { query, llamadas } = consultaFalsa();

    const res = await request(appCon(query)).get('/api/v1/catalog/products').query(params);

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({ status: 400, code: 'PETICION_INVALIDA' });
    expect(llamadas).toEqual([]);
  });

  it('un error inesperado responde 500 ERROR_INTERNO sin filtrar el detalle', async () => {
    const query: CatalogPublicQuery = {
      async listPublishedProducts() {
        throw new Error('relation "product" does not exist');
      },
    };

    const res = await request(appCon(query)).get('/api/v1/catalog/products');

    expect(res.status).toBe(500);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({ status: 500, code: 'ERROR_INTERNO' });
    expect(JSON.stringify(res.body)).not.toContain('relation');
  });
});
