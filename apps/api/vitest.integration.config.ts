import { defineConfig } from 'vitest/config';

// Integración contra Postgres de test (docker). Se corre aparte: `npm run test:integration -w @maps/api`.
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./tests/integration/setup.ts'],
    // Comparten la misma base: un archivo a la vez.
    fileParallelism: false,
  },
});
