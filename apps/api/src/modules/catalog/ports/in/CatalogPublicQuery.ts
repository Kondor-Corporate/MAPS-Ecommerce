import type {
  ListPublishedProductsParams,
  PublicProduct,
  PublishedProductsPage,
} from '../../domain/PublicProduct.js';

export type { ListPublishedProductsParams, PublicProduct, PublishedProductsPage };

// Consulta pública del catálogo (TDD-SW-002 `CatalogPublicQuery`). Sin autenticación.
export interface CatalogPublicQuery {
  /** Products publicados con precio vigente, ordenados por nombre. */
  listPublishedProducts(params: ListPublishedProductsParams): Promise<PublishedProductsPage>;
}
