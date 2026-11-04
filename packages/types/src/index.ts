// Contratos compartidos de sólo tipos (TDD-SW-007): AuditRecord, su catálogo de acciones y otros
// contratos que varios módulos declaran en su ports/out. Sólo `type`/`interface`: el lint rechaza
// valores, funciones, clases y enums, y los módulos lo importan únicamente con `import type`.
// Vacío hasta la historia de Audit, que agrega AuditRecord.
export {};
