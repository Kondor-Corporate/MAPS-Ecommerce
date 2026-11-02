# AGENTS.md — apps/api

Complementa el [AGENTS.md raíz](../../AGENTS.md). Leelo cuando trabajes en la API.

## Estructura de un módulo (ADR-SW-002)

```
modules/<modulo>/
├── domain/        entidades, value objects, invariantes, eventos. SIN imports de infraestructura.
├── application/   casos de uso; orquesta dominio y puertos.
├── ports/in/      lo que el módulo ofrece a otros (comandos/consultas).
├── ports/out/     lo que necesita (repositorios, email, storage, reloj).
└── adapters/
    ├── in/        HTTP (Express), jobs, consumidores.
    └── out/       persistencia (Prisma), proveedores externos.
```

Un puerto se crea sólo si hay una dependencia externa real o una frontera entre módulos.
Consultas de sólo lectura para pantallas pueden ir por un adaptador de lectura, sin escribir
ni saltear autorización.

## Dependencias entre módulos (ADR-SW-001)

Requests → Catalog, Forms, Identity · Catalog → Forms (sólo lectura) · Assignment → Requests,
Identity · Audit recibe eventos de todos y nadie depende de Audit. Sin ciclos.

## Tests

- `domain/` y `application/`: tests unitarios sin base ni red (puertos con fakes en memoria).
- `adapters/out/`: tests de integración contra PostgreSQL de test (docker), nunca contra Cloud SQL.
- `adapters/in/` HTTP: tests de contrato de los endpoints (status, forma, permisos por rol).
- Un test por cada ítem del criterio de aceptación, nombrado con ese ítem.

## Zonas sensibles

- `requests/domain`: máquina de estados (TDD-SW-003). Probá también las transiciones **prohibidas**.
- `assignment` + `notifications`: outbox e idempotencia (ADR-SW-004, TDD-SW-005). Probá el reintento
  y que un mismo evento no genere dos emails.
- Cualquier endpoint que devuelva solicitudes: probá que otro cliente/productor reciba 403/404.
