import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createPrismaClient } from './database/prisma.js';
import { PrismaPublicCatalogReadAdapter } from './modules/catalog/adapters/out/prisma/PrismaPublicCatalogReadAdapter.js';
import { ListPublishedProducts } from './modules/catalog/application/ListPublishedProducts.js';

const { port, databaseUrl } = loadEnv();

// Prisma conecta en la primera consulta: /health sigue respondiendo aunque la base no esté.
const prisma = createPrismaClient(databaseUrl);

const app = createApp({
  catalogPublicQuery: new ListPublishedProducts(new PrismaPublicCatalogReadAdapter(prisma)),
});

app.listen(port, () => {
  console.info(`API escuchando en el puerto ${port}`);
});
