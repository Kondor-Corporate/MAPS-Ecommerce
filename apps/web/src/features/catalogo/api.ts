import { getJson } from '../../services/http';

// Contrato de GET /api/v1/catalog/products (TDD-SW-008). Público: sin credenciales.

export interface Money {
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
  price: Money;
}

export interface Page<T> {
  items: T[];
  page: { number: number; size: number; totalItems: number; totalPages: number };
}

/** Máximo de pageSize del contrato. */
export const MAX_PAGE_SIZE = 100;

export function listPublishedProductsPage(page: number, signal?: AbortSignal): Promise<Page<PublicProduct>> {
  return getJson<Page<PublicProduct>>(`/catalog/products?page=${page}&pageSize=${MAX_PAGE_SIZE}`, signal);
}

// El catálogo se agrupa en el front, así que se piden todas las páginas (normalmente es una sola).
export async function listAllPublishedProducts(signal?: AbortSignal): Promise<PublicProduct[]> {
  const first = await listPublishedProductsPage(1, signal);
  const items = [...first.items];
  for (let page = 2; page <= first.page.totalPages; page++) {
    items.push(...(await listPublishedProductsPage(page, signal)).items);
  }
  return items;
}
