import { assertLocalDatabaseUrl } from './localDbGuard.js';

// Segunda barrera: aunque se llame a vitest directo, sin el script de npm.
assertLocalDatabaseUrl(process.env.DATABASE_URL);
