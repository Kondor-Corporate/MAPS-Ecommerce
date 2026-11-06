import { pathToFileURL } from 'node:url';

import { createPrismaClient, type PrismaClient } from '../src/database/prisma.js';

// CATÁLOGO SEMILLA DEMOSTRATIVO (MAPS-183), tomado del prototipo integrado sin imágenes.
//
// No es una publicación funcional válida: `published: true` se carga sin FormVersion persistida,
// porque el módulo Forms todavía no existe, así que la precondición de publicación de TDD-SW-002
// (versión utilizable) NO está verificada. Precios y publicaciones son los del prototipo:
// demostrativos hasta que MAPS los valide, no tarifas comerciales confirmadas.
// Reconciliación obligatoria al implementar Forms y antes de habilitar CreateDraft: ver TDD-SW-002,
// "Implementado en MAPS-183".
//
// Sólo se cargan productos que en el prototipo tienen formulario (decisión de Kondor, Joaquín
// Rodriguez, 2026-11-04): por eso Responsabilidad Civil no está. Accidentes Personales está cargado
// pero no publicado, como en el prototipo.
// Idempotente: sólo inserta lo que falta, nunca pisa cambios hechos después.

const CATEGORIES = [
  { id: '6f1d2c3b-0a4e-4b5f-8c6d-7e8f9a0b1c01', slug: 'laborales', name: 'Seguros Laborales' },
  { id: '6f1d2c3b-0a4e-4b5f-8c6d-7e8f9a0b1c02', slug: 'personas', name: 'Seguros de Personas' },
  { id: '6f1d2c3b-0a4e-4b5f-8c6d-7e8f9a0b1c03', slug: 'patrimoniales', name: 'Seguros Patrimoniales' },
];

const categoryId = (slug: string) => CATEGORIES.find((c) => c.slug === slug)!.id;

const PRODUCTS = [
  {
    id: '2a7c9e1f-3b5d-4c6e-9f0a-1b2c3d4e5f01',
    priceRevisionId: '8d4b2f6a-1c3e-4a5b-9d7f-0e1a2b3c4d01',
    name: 'Combinado Familiar',
    summary: 'Tu casa no es sólo paredes y techo; es el espacio donde suceden los momentos más importantes de tu vida.',
    category: 'patrimoniales',
    amount: '30000.00',
    published: true,
  },
  {
    id: '2a7c9e1f-3b5d-4c6e-9f0a-1b2c3d4e5f02',
    priceRevisionId: '8d4b2f6a-1c3e-4a5b-9d7f-0e1a2b3c4d02',
    name: 'Seguro de Incendio',
    summary: 'Un incendio puede cambiarlo todo en cuestión de segundos.',
    category: 'patrimoniales',
    amount: '10000.00',
    published: true,
  },
  {
    id: '2a7c9e1f-3b5d-4c6e-9f0a-1b2c3d4e5f03',
    priceRevisionId: '8d4b2f6a-1c3e-4a5b-9d7f-0e1a2b3c4d03',
    name: 'Seguro de Mascotas',
    summary: 'Ellos no son sólo mascotas; son parte de nuestra familia.',
    category: 'personas',
    amount: '15000.00',
    published: true,
  },
  {
    id: '2a7c9e1f-3b5d-4c6e-9f0a-1b2c3d4e5f04',
    priceRevisionId: '8d4b2f6a-1c3e-4a5b-9d7f-0e1a2b3c4d04',
    name: 'Seguro de Ahorro',
    summary: '¿Alguna vez te detuviste a pensar cómo querés vivir cuando decidas bajar el ritmo?',
    category: 'personas',
    amount: '30000.00',
    published: true,
  },
  {
    id: '2a7c9e1f-3b5d-4c6e-9f0a-1b2c3d4e5f05',
    priceRevisionId: '8d4b2f6a-1c3e-4a5b-9d7f-0e1a2b3c4d05',
    name: 'Accidentes Personales',
    summary: 'Protección ante accidentes dentro y fuera del trabajo.',
    category: 'laborales',
    amount: '8500.00',
    published: false,
  },
];

const SEED_ACTOR = 'seed';
const SEED_EFFECTIVE_FROM = new Date('2026-11-01T00:00:00Z');

export async function seedCatalog(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.category.createMany({ data: CATEGORIES, skipDuplicates: true });

    await tx.product.createMany({
      data: PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        summary: p.summary,
        categoryId: categoryId(p.category),
        published: p.published,
      })),
      skipDuplicates: true,
    });

    // Las revisiones son inmutables: sólo se insertan las que faltan.
    await tx.productPriceRevision.createMany({
      data: PRODUCTS.map((p) => ({
        id: p.priceRevisionId,
        productId: p.id,
        amount: p.amount,
        currency: 'ARS',
        effectiveFrom: SEED_EFFECTIVE_FROM,
        createdBy: SEED_ACTOR,
      })),
      skipDuplicates: true,
    });

    // Precio vigente sólo donde todavía no hay uno (no pisa un cambio de precio posterior).
    for (const p of PRODUCTS) {
      await tx.product.updateMany({
        where: { id: p.id, currentPriceRevisionId: null },
        data: { currentPriceRevisionId: p.priceRevisionId },
      });
    }
  });
}

// Ejecución directa: `npm run db:seed -w @maps/api` (prisma db seed).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('Falta DATABASE_URL (ver apps/api/AGENTS.md, "Base de datos").');

  const prisma = createPrismaClient(url);
  seedCatalog(prisma)
    .then(() => console.info('Seed del catálogo aplicado.'))
    .finally(() => prisma.$disconnect());
}
