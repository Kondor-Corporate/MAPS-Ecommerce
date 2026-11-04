import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { seedCatalog } from '../../prisma/seed.js';
import { createPrismaClient } from '../../src/database/prisma.js';
import { PrismaPublicCatalogReadAdapter } from '../../src/modules/catalog/adapters/out/prisma/PrismaPublicCatalogReadAdapter.js';
import { clearCatalog } from './helpers/db.js';

// "Arranca con productos cargados por seed" (criterio de MAPS-183).
// Sólo se cargan productos con formulario (decisión de Joaquín Rodriguez, 2026-11-04).

const prisma = createPrismaClient(process.env.DATABASE_URL!);
const adapter = new PrismaPublicCatalogReadAdapter(prisma);

beforeEach(async () => {
  await clearCatalog(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('MAPS-183 — el catálogo arranca con productos cargados por seed', () => {
  it('después del seed, el catálogo público muestra los productos publicados con su categoría y precio', async () => {
    await seedCatalog(prisma);

    const { items } = await adapter.listPublishedProducts({ page: 1, pageSize: 100 });

    expect(items.map((i) => [i.name, i.category.name, i.price.amount])).toEqual([
      ['Combinado Familiar', 'Seguros Patrimoniales', '30000.00'],
      ['Seguro de Incendio', 'Seguros Patrimoniales', '10000.00'],
      ['Seguro de Mascotas', 'Seguros de Personas', '15000.00'],
    ]);
  });

  it('carga Seguro de Ahorro y Accidentes Personales sin publicar', async () => {
    await seedCatalog(prisma);

    const noPublicados = await prisma.product.findMany({ where: { published: false }, orderBy: { name: 'asc' } });

    expect(noPublicados.map((p) => p.name)).toEqual(['Accidentes Personales', 'Seguro de Ahorro']);
  });

  it('no carga productos sin formulario (Responsabilidad Civil)', async () => {
    await seedCatalog(prisma);

    expect(await prisma.product.count({ where: { name: 'Responsabilidad Civil' } })).toBe(0);
  });

  it('correr el seed dos veces no duplica datos', async () => {
    await seedCatalog(prisma);
    await seedCatalog(prisma);

    expect(await prisma.category.count()).toBe(3);
    expect(await prisma.product.count()).toBe(5);
    expect(await prisma.productPriceRevision.count()).toBe(5);
  });
});
