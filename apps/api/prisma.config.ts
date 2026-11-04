import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// DATABASE_URL sale del entorno (o de un .env local que no se commitea).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
