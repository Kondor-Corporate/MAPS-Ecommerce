import type { ListPublishedProductsParams, PublishedProductsPage } from '../../domain/PublicProduct.js';

// Lectura del catálogo para pantallas (adaptador de lectura, apps/api/AGENTS.md).
// Debe devolver sólo Products publicados y con precio vigente, ordenados por nombre.
export interface PublicCatalogReadPort {
  listPublishedProducts(params: ListPublishedProductsParams): Promise<PublishedProductsPage>;
}
