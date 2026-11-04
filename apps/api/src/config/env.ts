export interface Env {
  port: number;
  databaseUrl: string;
  /** Default configurable: MAPS no definió el límite (AGENTS.md §5.6; módulo de parámetros MAPS-182). */
  publicRateLimitPerMinute: number;
}

const DEFAULT_PORT = 3000;
const DEFAULT_PUBLIC_RATE_LIMIT_PER_MINUTE = 120;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return {
    port: loadPort(source.PORT),
    databaseUrl: loadDatabaseUrl(source.DATABASE_URL),
    publicRateLimitPerMinute: loadPositiveInt(
      'PUBLIC_RATE_LIMIT_PER_MINUTE',
      source.PUBLIC_RATE_LIMIT_PER_MINUTE,
      DEFAULT_PUBLIC_RATE_LIMIT_PER_MINUTE,
    ),
  };
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

function loadPositiveInt(name: string, raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} inválido: "${raw}"`);
  }
  return value;
}
