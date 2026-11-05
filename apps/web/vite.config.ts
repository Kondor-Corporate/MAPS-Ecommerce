import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// En local, /api va a la API como en el resto de los ambientes (mismo host, ADR-CLD-001).
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': apiTarget,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
