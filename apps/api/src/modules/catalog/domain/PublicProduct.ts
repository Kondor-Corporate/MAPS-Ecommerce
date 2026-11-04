// Vista pública de un Product (TDD-SW-002, consulta pública). No expone versiones, esquemas,
// precios históricos ni la bandera de publicación: sólo lo que ve un visitante.

export interface Money {
  /** Decimal con 2 decimales como string, para no perder precisión (TDD-SW-008). */
  amount: string;
  currency: string;
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
}

export interface PublicProduct {
  id: string;
  name: string;
  summary: string;
  category: PublicCategory;
  /** Precio fijo vigente (RN-09): el de la revisión actual, nunca uno histórico. */
  price: Money;
}

export interface ListPublishedProductsParams {
  page: number;
  pageSize: number;
  categoryId?: string;
  q?: string;
}

export interface PublishedProductsPage {
  items: PublicProduct[];
  totalItems: number;
}
