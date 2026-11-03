import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HomePage } from './HomePage';

function stubFetch(impl: () => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('MAPS-179 — el front muestra una página base que consume la API', () => {
  it('consulta /api/v1/health y muestra que la API está operativa', async () => {
    const fetchMock = stubFetch(async () => Response.json({ status: 'ok' }));

    render(<HomePage />);

    expect(await screen.findByText('API operativa')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/health', expect.anything());
  });

  it('muestra el estado de carga mientras espera la respuesta', () => {
    stubFetch(() => new Promise<Response>(() => {}));

    render(<HomePage />);

    expect(screen.getByText('Verificando la API…')).toBeInTheDocument();
  });

  it('muestra el estado de error si la API responde con error', async () => {
    stubFetch(async () => new Response(null, { status: 503 }));

    render(<HomePage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectar con la API');
  });

  it('muestra el estado de error si la API no responde', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    render(<HomePage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectar con la API');
  });
});
