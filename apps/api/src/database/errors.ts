// ¿El error de Prisma significa que la base no está disponible (y no un error de la consulta)?
// Prisma 7 con el driver pg reporta la conexión rechazada como PrismaClientKnownRequestError con el
// código del sistema (ECONNREFUSED…); los P1xxx son errores de conexión de Prisma.

const UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'P1001', // no se puede alcanzar el servidor
  'P1002', // timeout de conexión
  'P1008', // timeout de operación
  'P1017', // el servidor cerró la conexión
  'P2024', // timeout esperando una conexión del pool
]);

export function isDatabaseUnavailable(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { name, code } = error as { name?: unknown; code?: unknown };
  if (name === 'PrismaClientInitializationError') return true;
  return name === 'PrismaClientKnownRequestError' && typeof code === 'string' && UNAVAILABLE_CODES.has(code);
}
