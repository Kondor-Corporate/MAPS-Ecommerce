import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ServiceUnavailableError } from '../../src/common/errors/ServiceUnavailableError.js';
import { createPrismaClient } from '../../src/database/prisma.js';
import { PrismaPublicCatalogReadAdapter } from '../../src/modules/catalog/adapters/out/prisma/PrismaPublicCatalogReadAdapter.js';
import { clearCatalog } from './helpers/db.js';

// Integración contra el Postgres de test (docker). Qué se lista y con qué precio lo decide esta consulta.

const prisma = createPrismaClient(process.env.DATABASE_URL!);
const adapter = new PrismaPublicCatalogReadAdapter(prisma);

async function categoria(name: string, slug: string) {
  return prisma.category.create({ data: { name, slug } });
}

async function producto(opts: {
  name: string;
  categoryId: string;
  published: boolean;
  prices?: string[]; // en orden de vigencia; el último es el vigente
}) {
  const p = await prisma.product.create({
    data: {
      name: opts.name,
      summary: `Resumen de ${opts.name}`,
      categoryId: opts.categoryId,
      published: opts.published,
    },
  });
  let currentId: string | null = null;
  for (const [i, amount] of (opts.prices ?? []).entries()) {
    const rev = await prisma.productPriceRevision.create({
      data: {
        productId: p.id,
        amount,
        currency: 'ARS',
        effectiveFrom: new Date(Date.UTC(2026, 0, 1 + i)),
        createdBy: 'test',
      },
    });
    currentId = rev.id;
  }
  if (currentId) await prisma.product.update({ where: { id: p.id }, data: { currentPriceRevisionId: currentId } });
  return p;
}

const todo = { page: 1, pageSize: 100 };

beforeEach(async () => {
  await clearCatalog(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('MAPS-183 — consulta pública del catálogo (Postgres)', () => {
  it('sólo lista productos publicados', async () => {
    const cat = await categoria('Seguros Patrimoniales', 'patrimoniales');
    await producto({ name: 'Combinado Familiar', categoryId: cat.id, published: true, prices: ['30000'] });
    await producto({ name: 'Seguro de Ahorro', categoryId: cat.id, published: false, prices: ['30000'] });

    const { items, totalItems } = await adapter.listPublishedProducts(todo);

    expect(items.map((i) => i.name)).toEqual(['Combinado Familiar']);
    expect(totalItems).toBe(1);
  });

  it('cada producto trae nombre, categoría y precio de la revisión vigente, no de una histórica', async () => {
    const cat = await categoria('Seguros Patrimoniales', 'patrimoniales');
    const p = await producto({
      name: 'Seguro de Incendio',
      categoryId: cat.id,
      published: true,
      prices: ['9000', '10000'],
    });

    const { items } = await adapter.listPublishedProducts(todo);

    expect(items).toEqual([
      {
        id: p.id,
        name: 'Seguro de Incendio',
        summary: 'Resumen de Seguro de Incendio',
        category: { id: cat.id, name: 'Seguros Patrimoniales', slug: 'patrimoniales' },
        price: { amount: '10000.00', currency: 'ARS' },
      },
    ]);
  });

  it('un producto publicado sin precio vigente no se lista (RN-09)', async () => {
    const cat = await categoria('Seguros Patrimoniales', 'patrimoniales');
    await producto({ name: 'Sin precio', categoryId: cat.id, published: true });

    const { items, totalItems } = await adapter.listPublishedProducts(todo);

    expect(items).toEqual([]);
    expect(totalItems).toBe(0);
  });

  it('el monto siempre tiene dos decimales', async () => {
    const cat = await categoria('Seguros Laborales', 'laborales');
    await producto({ name: 'Accidentes Personales', categoryId: cat.id, published: true, prices: ['8500.5'] });

    const { items } = await adapter.listPublishedProducts(todo);

    expect(items[0]?.price).toEqual({ amount: '8500.50', currency: 'ARS' });
  });

  it('ordena por nombre', async () => {
    const cat = await categoria('Seguros de Personas', 'personas');
    for (const name of ['Seguro de Mascotas', 'Combinado Familiar', 'Seguro de Incendio']) {
      await producto({ name, categoryId: cat.id, published: true, prices: ['1000'] });
    }

    const { items } = await adapter.listPublishedProducts(todo);

    expect(items.map((i) => i.name)).toEqual(['Combinado Familiar', 'Seguro de Incendio', 'Seguro de Mascotas']);
  });

  it('filtra por categoryId', async () => {
    const patrimoniales = await categoria('Seguros Patrimoniales', 'patrimoniales');
    const personas = await categoria('Seguros de Personas', 'personas');
    await producto({ name: 'Seguro de Incendio', categoryId: patrimoniales.id, published: true, prices: ['10000'] });
    await producto({ name: 'Seguro de Mascotas', categoryId: personas.id, published: true, prices: ['15000'] });

    const { items } = await adapter.listPublishedProducts({ ...todo, categoryId: personas.id });

    expect(items.map((i) => i.name)).toEqual(['Seguro de Mascotas']);
  });

  it('q busca por nombre sin distinguir mayúsculas', async () => {
    const cat = await categoria('Seguros de Personas', 'personas');
    await producto({ name: 'Seguro de Mascotas', categoryId: cat.id, published: true, prices: ['15000'] });
    await producto({ name: 'Seguro de Ahorro', categoryId: cat.id, published: true, prices: ['30000'] });

    const { items } = await adapter.listPublishedProducts({ ...todo, q: 'MASCOTA' });

    expect(items.map((i) => i.name)).toEqual(['Seguro de Mascotas']);
  });

  it('pagina y cuenta sólo publicados', async () => {
    const cat = await categoria('Seguros de Personas', 'personas');
    for (const name of ['A', 'B', 'C']) {
      await producto({ name, categoryId: cat.id, published: true, prices: ['1000'] });
    }
    await producto({ name: 'Oculto', categoryId: cat.id, published: false, prices: ['1000'] });

    const pagina2 = await adapter.listPublishedProducts({ page: 2, pageSize: 2 });

    expect(pagina2.items.map((i) => i.name)).toEqual(['C']);
    expect(pagina2.totalItems).toBe(3);
  });

  it('con la base caída informa ServiceUnavailableError (→ 503), sin detalle técnico', async () => {
    const caida = createPrismaClient('postgresql://maps:maps@localhost:1/maps');
    const adapterCaido = new PrismaPublicCatalogReadAdapter(caida);

    try {
      await expect(adapterCaido.listPublishedProducts(todo)).rejects.toBeInstanceOf(ServiceUnavailableError);
    } finally {
      await caida.$disconnect();
    }
  });

  it('no se puede asociar como vigente una revisión de precio de otro producto', async () => {
    const cat = await categoria('Seguros Patrimoniales', 'patrimoniales');
    const incendio = await producto({ name: 'Seguro de Incendio', categoryId: cat.id, published: true, prices: ['10000'] });
    const combinado = await producto({ name: 'Combinado Familiar', categoryId: cat.id, published: true, prices: ['30000'] });
    const revisionDeCombinado = await prisma.productPriceRevision.findFirstOrThrow({ where: { productId: combinado.id } });

    await expect(
      prisma.product.update({ where: { id: incendio.id }, data: { currentPriceRevisionId: revisionDeCombinado.id } }),
    ).rejects.toThrow();

    const { items } = await adapter.listPublishedProducts(todo);
    expect(items.find((i) => i.id === incendio.id)?.price.amount).toBe('10000.00');
  });

  it('una revisión de precio no se puede borrar, ni histórica ni vigente (TDD-SW-002)', async () => {
    const cat = await categoria('Seguros de Personas', 'personas');
    const p = await producto({ name: 'Seguro de Mascotas', categoryId: cat.id, published: true, prices: ['14000', '15000'] });
    const [historica, vigente] = await prisma.productPriceRevision.findMany({
      where: { productId: p.id },
      orderBy: { effectiveFrom: 'asc' },
    });

    await expect(prisma.productPriceRevision.delete({ where: { id: historica!.id } })).rejects.toThrow();
    await expect(prisma.productPriceRevision.delete({ where: { id: vigente!.id } })).rejects.toThrow();
    expect(await prisma.productPriceRevision.count({ where: { productId: p.id } })).toBe(2);
  });

  it('una revisión de precio no se puede modificar (inmutable, TDD-SW-002)', async () => {
    const cat = await categoria('Seguros de Personas', 'personas');
    await producto({ name: 'Seguro de Mascotas', categoryId: cat.id, published: true, prices: ['15000'] });

    await expect(prisma.productPriceRevision.updateMany({ data: { amount: '1' } })).rejects.toThrow();
  });
});
