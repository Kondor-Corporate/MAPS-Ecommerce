// Una dependencia (la base, un proveedor) no está disponible. La capa HTTP la traduce a
// 503 SERVICIO_NO_DISPONIBLE (TDD-SW-008). No lleva el detalle técnico de la causa.
export class ServiceUnavailableError extends Error {
  constructor(readonly dependency: string) {
    super(`Dependencia no disponible: ${dependency}`);
    this.name = 'ServiceUnavailableError';
  }
}
