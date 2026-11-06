export interface Env {
  port: number;
}

const DEFAULT_PORT = 3000;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const raw = source.PORT;
  if (raw === undefined || raw === '') return { port: DEFAULT_PORT };

  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`PORT inválido: "${raw}"`);
  }
  return { port };
}
