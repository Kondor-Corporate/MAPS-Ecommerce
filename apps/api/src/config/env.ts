export interface Env {
  port: number;
  databaseUrl: string;
}

const DEFAULT_PORT = 3000;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return { port: loadPort(source.PORT), databaseUrl: loadDatabaseUrl(source.DATABASE_URL) };
}

function loadPort(raw: string | undefined): number {
  if (raw === undefined || raw === '') return DEFAULT_PORT;

  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`PORT inválido: "${raw}"`);
  }
  return port;
}

function loadDatabaseUrl(raw: string | undefined): string {
  if (raw === undefined || raw === '') {
    throw new Error('Falta DATABASE_URL (ver apps/api/AGENTS.md, "Base de datos").');
  }
  return raw;
}
