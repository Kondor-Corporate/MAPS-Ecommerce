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

// El catálogo se agrupa en el front: se pide todo en una página (máximo del contrato).
export function listPublishedProducts(signal?: AbortSignal): Promise<Page<PublicProduct>> {
  return getJson<Page<PublicProduct>>('/catalog/products?pageSize=100', signal);
}
