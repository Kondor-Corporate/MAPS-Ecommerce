import { Router } from 'express';

import { pageInfo, parseListQuery } from '../../../../../http/query.js';
import type { CatalogPublicQuery } from '../../../ports/in/CatalogPublicQuery.js';

// Rutas públicas del catálogo (TDD-SW-008 `GET /api/v1/catalog/*`): anónimas, sin sesión.
export function catalogRouter(query: CatalogPublicQuery): Router {
  const router = Router();

  router.get('/catalog/products', async (req, res) => {
    const { page, pageSize, filters } = parseListQuery(req, { categoryId: 'uuid', q: 'text' });

    const result = await query.listPublishedProducts({ page, pageSize, ...filters });

    res.status(200).json({ items: result.items, page: pageInfo(page, pageSize, result.totalItems) });
  });

  return router;
}
