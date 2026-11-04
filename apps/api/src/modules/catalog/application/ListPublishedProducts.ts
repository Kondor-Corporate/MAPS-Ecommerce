import type { CatalogPublicQuery } from '../ports/in/CatalogPublicQuery.js';
import type { PublicCatalogReadPort } from '../ports/out/PublicCatalogReadPort.js';
import type { ListPublishedProductsParams, PublishedProductsPage } from '../domain/PublicProduct.js';

// Caso de uso de la consulta pública. Hoy delega en la lectura; cuando exista Forms, acá se suma
// la disponibilidad derivada (publicado ∧ precio vigente ∧ versión utilizable, TDD-SW-002).
export class ListPublishedProducts implements CatalogPublicQuery {
  constructor(private readonly reader: PublicCatalogReadPort) {}

  listPublishedProducts(params: ListPublishedProductsParams): Promise<PublishedProductsPage> {
    return this.reader.listPublishedProducts(params);
  }
}
