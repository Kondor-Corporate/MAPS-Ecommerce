import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CatalogoPage } from './CatalogoPage';

// PUB-01 (F2): catálogo público agrupado por categoría, con estados cargando / vacío / error.

const PATRIMONIALES = { id: 'c-pat', name: 'Seguros Patrimoniales', slug: 'patrimoniales' };
const PERSONAS = { id: 'c-per', name: 'Seguros de Personas', slug: 'personas' };

const respuesta = {
  items: [
    {
      id: 'p-comb',
      name: 'Combinado Familiar',
      summary: 'Tu casa no es sólo paredes y techo.',
      category: PATRIMONIALES,
      price: { amount: '30000.00', currency: 'ARS' },
    },
    {
      id: 'p-inc',
      name: 'Seguro de Incendio',
      summary: 'Un incendio puede cambiarlo todo.',
      category: PATRIMONIALES,
      price: { amount: '10000.00', currency: 'ARS' },
    },
    {
      id: 'p-mas',
      name: 'Seguro de Mascotas',
      summary: 'Son parte de nuestra familia.',
      category: PERSONAS,
      price: { amount: '15000.00', currency: 'ARS' },
    },
  ],
  page: { number: 1, size: 100, totalItems: 3, totalPages: 1 },
};

function stubFetch(impl: () => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('MAPS-183 — un visitante ve los productos publicados con nombre, categoría y precio fijo vigente', () => {
  it('muestra cada producto publicado con su nombre y precio', async () => {
    stubFetch(async () => Response.json(respuesta));

    render(<CatalogoPage />);

    const combinado = await screen.findByRole('article', { name: 'Combinado Familiar' });
    expect(combinado).toHaveTextContent('$ 30.000');
    expect(screen.getByRole('article', { name: 'Seguro de Incendio' })).toHaveTextContent('$ 10.000');
    expect(screen.getByRole('article', { name: 'Seguro de Mascotas' })).toHaveTextContent('$ 15.000');
  });

  it('agrupa los productos por categoría', async () => {
    stubFetch(async () => Response.json(respuesta));

    render(<CatalogoPage />);

    const patrimoniales = await screen.findByRole('region', { name: 'Seguros Patrimoniales' });
    const personas = screen.getByRole('region', { name: 'Seguros de Personas' });

    expect(within(patrimoniales).getAllByRole('article').map((a) => a.getAttribute('aria-label'))).toEqual([
      'Combinado Familiar',
      'Seguro de Incendio',
    ]);
    expect(within(personas).getAllByRole('article').map((a) => a.getAttribute('aria-label'))).toEqual([
      'Seguro de Mascotas',
    ]);
  });

  it('pide el catálogo a la API pública sin credenciales', async () => {
    const fetchMock = stubFetch(async () => Response.json(respuesta));

    render(<CatalogoPage />);
    await screen.findByRole('region', { name: 'Seguros Patrimoniales' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/v1/catalog/products?page=1&pageSize=100');
    expect(new Headers(init.headers).has('Authorization')).toBe(false);
  });

  it('con más de 100 productos pide todas las páginas y no corta el catálogo', async () => {
    const [comb, inc, mas] = respuesta.items;
    const paginas: Record<string, unknown> = {
      '/api/v1/catalog/products?page=1&pageSize=100': {
        items: [comb, inc],
        page: { number: 1, size: 100, totalItems: 3, totalPages: 2 },
      },
      '/api/v1/catalog/products?page=2&pageSize=100': {
        items: [mas],
        page: { number: 2, size: 100, totalItems: 3, totalPages: 2 },
      },
    };
    const fetchMock = vi.fn(async (url: string) => Response.json(paginas[url]));
    vi.stubGlobal('fetch', fetchMock);

    render(<CatalogoPage />);

    expect(await screen.findByRole('article', { name: 'Seguro de Mascotas' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('MAPS-183 — estados de PUB-01 (F2)', () => {
  it('muestra el estado de carga mientras espera la respuesta', () => {
    stubFetch(() => new Promise<Response>(() => {}));

    render(<CatalogoPage />);

    expect(screen.getByText('Cargando catálogo…')).toBeInTheDocument();
  });

  it('muestra el estado vacío si no hay productos publicados', async () => {
    stubFetch(async () =>
      Response.json({ items: [], page: { number: 1, size: 100, totalItems: 0, totalPages: 0 } }),
    );

    render(<CatalogoPage />);

    expect(await screen.findByText('Todavía no hay seguros publicados.')).toBeInTheDocument();
  });

  it('muestra el estado de error si la API responde con error', async () => {
    stubFetch(async () => new Response(null, { status: 500 }));

    render(<CatalogoPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar el catálogo');
  });

  it('muestra el estado de error si la API no responde', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    render(<CatalogoPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar el catálogo');
  });
});
