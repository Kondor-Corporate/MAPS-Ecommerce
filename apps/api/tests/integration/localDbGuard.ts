// Guarda de seguridad: la integración (y su migración previa) sólo corre contra un Postgres local
// (AGENTS.md §8). La usan `npm run test:integration` antes de `prisma migrate deploy` y el setup de vitest.

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'postgres'];

export function assertLocalDatabaseUrl(url: string | undefined): void {
  if (!url) {
    throw new Error('Falta DATABASE_URL. Levantá la base de test con docker compose (ver apps/api/AGENTS.md, "Base de datos").');
  }

  const host = new URL(url).hostname.replace(/^\[|\]$/g, '');
  if (!LOCAL_HOSTS.includes(host)) {
    throw new Error(`Los tests de integración sólo corren contra una base local; DATABASE_URL apunta a "${host}".`);
  }
}

// Ejecución directa (`tsx tests/integration/localDbGuard.ts`): sale con error si no es local.
if (process.argv[1]?.replaceAll('\\', '/').endsWith('tests/integration/localDbGuard.ts')) {
  try {
    assertLocalDatabaseUrl(process.env.DATABASE_URL);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}
