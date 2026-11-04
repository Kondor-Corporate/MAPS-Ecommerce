import type { Money, PublicCategory, PublicProduct } from './api';

export interface CategoryGroup {
  category: PublicCategory;
  products: PublicProduct[];
}

// Agrupa por categoría (PUB-01). Las categorías van por nombre; los productos conservan el
// orden por nombre que ya trae la API.
export function groupByCategory(products: PublicProduct[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();
  for (const product of products) {
    const group = groups.get(product.category.id) ?? { category: product.category, products: [] };
    group.products.push(product);
    groups.set(product.category.id, group);
  }
  return [...groups.values()].sort((a, b) => a.category.name.localeCompare(b.category.name, 'es'));
}

// Precio fijo en pesos: sin decimales si es entero ("$ 30.000"), con dos si no ("$ 8.500,50").
export function formatPrice({ amount, currency }: Money): string {
  const value = Number(amount);
  const decimals = Number.isInteger(value) ? 0 : 2;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
