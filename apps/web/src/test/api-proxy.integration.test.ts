// @vitest-environment node
/// <reference types="node" />
// Integración web ↔ API vía el proxy de Vite (criterio: "el front muestra una página base que
// consume la API"). Caja negra: levanta la API real en otro proceso y el dev server de Vite con
// su config real (proxy /api → VITE_API_PROXY_TARGET), y pide /api/v1/health a través de Vite.
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer as createNetServer, type AddressInfo } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createServer, type ViteDevServer } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const apiRoot = resolve(webRoot, '../api');

function freePort(): Promise<number> {
  return new Promise((ok, fail) => {
    const server = createNetServer();
    server.once('error', fail);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      server.close(() => ok(port));
    });
  });
}

async function waitUntilUp(url: string, timeoutMs = 20_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Todavía no escucha.
    }
    if (Date.now() > deadline) throw new Error(`La API no respondió en ${url}`);
    await new Promise((r) => setTimeout(r, 200));
  }
}

describe('integración web ↔ API vía proxy de Vite', () => {
  let api: ChildProcess | undefined;
  let vite: ViteDevServer | undefined;
  let viteUrl = '';

  beforeAll(async () => {
    const apiPort = await freePort();
    api = spawn(process.execPath, ['--import', 'tsx', join(apiRoot, 'src/main.ts')], {
      cwd: apiRoot,
      env: { ...process.env, PORT: String(apiPort) },
      stdio: 'ignore',
    });
    await waitUntilUp(`http://127.0.0.1:${apiPort}/health`);

    // La config de Vite lee el target del proxy al cargarse.
    process.env.VITE_API_PROXY_TARGET = `http://127.0.0.1:${apiPort}`;
    const vitePort = await freePort();
    vite = await createServer({
      root: webRoot,
      configFile: join(webRoot, 'vite.config.ts'),
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: vitePort, strictPort: true },
    });
    await vite.listen();
    viteUrl = `http://127.0.0.1:${vitePort}`;
  }, 40_000);

  afterAll(async () => {
    await vite?.close();
    api?.kill();
    delete process.env.VITE_API_PROXY_TARGET;
  });

  it('GET /api/v1/health por el proxy de la web responde 200 con { status: "ok" }', async () => {
    const response = await fetch(`${viteUrl}/api/v1/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('una ruta inexistente bajo /api la responde la API (404), no la SPA', async () => {
    // Sin proxy, el fallback de la SPA devolvería 200 con index.html.
    const response = await fetch(`${viteUrl}/api/v1/no-existe`);

    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('<div id="root">');
  });
});
