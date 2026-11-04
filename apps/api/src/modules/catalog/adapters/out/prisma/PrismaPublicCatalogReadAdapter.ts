import type { PrismaClient } from '../../../../../database/prisma.js';
import type { ListPublishedProductsParams, PublishedProductsPage } from '../../../domain/PublicProduct.js';
import type { PublicCatalogReadPort } from '../../../ports/out/PublicCatalogReadPort.js';

export class PrismaPublicCatalogReadAdapter implements PublicCatalogReadPort {
  constructor(private readonly prisma: PrismaClient) {}

  async listPublishedProducts({ page, pageSize, categoryId, q }: ListPublishedProductsParams): Promise<PublishedProductsPage> {
    // Publicado y con precio vigente (RN-09): un Product sin precio no se muestra aunque esté publicado.
    const where = {
      published: true,
      currentPriceRevisionId: { not: null },
      ...(categoryId ? { categoryId } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          summary: true,
          category: { select: { id: true, name: true, slug: true } },
          currentPriceRevision: { select: { amount: true, currency: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      totalItems,
      items: rows.flatMap((row) =>
        row.currentPriceRevision
          ? [
              {
                id: row.id,
                name: row.name,
                summary: row.summary,
                category: row.category,
                price: {
                  amount: row.currentPriceRevision.amount.toFixed(2),
                  currency: row.currentPriceRevision.currency,
                },
              },
            ]
          : [],
      ),
    };
  }
}
