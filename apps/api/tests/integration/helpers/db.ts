import type { PrismaClient } from '../../../src/database/prisma.js';

// Deja vacías las tablas de catálogo entre tests. Sólo corre contra una base local (AGENTS.md §8).
export async function clearCatalog(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE product_attribute, product_price_revision, product, category RESTART IDENTITY CASCADE',
  );
}
