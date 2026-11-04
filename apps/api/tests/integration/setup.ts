// Guarda de seguridad: la integración sólo corre contra un Postgres local o de test (AGENTS.md §8).
const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('Falta DATABASE_URL. Levantá la base de test con docker compose (ver apps/api/AGENTS.md, "Base de datos").');
}

const host = new URL(url).hostname;
if (!['localhost', '127.0.0.1', 'postgres'].includes(host)) {
  throw new Error(`Los tests de integración sólo corren contra una base local; DATABASE_URL apunta a "${host}".`);
}
