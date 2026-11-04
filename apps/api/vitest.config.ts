import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    // La integración necesita Postgres: corre con vitest.integration.config.ts.
    exclude: ['tests/integration/**', 'node_modules/**'],
    environment: 'node',
  },
});
