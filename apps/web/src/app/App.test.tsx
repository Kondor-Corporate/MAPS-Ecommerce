import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';

describe('MAPS-183 — la página de inicio es el catálogo público', () => {
  it('un visitante que entra al portal ve el catálogo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ items: [], page: { number: 1, size: 100, totalItems: 0, totalPages: 0 } })),
    );

    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Catálogo de seguros' })).toBeInTheDocument();
  });
});
