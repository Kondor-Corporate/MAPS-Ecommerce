# ADR — Estilo arquitectónico y límites del monolito modular

| Dato | Valor |
| --- | --- |
| ID | `ADR-SW-001` |
| Título | Estilo arquitectónico y límites del monolito modular |
| Estado | `PROPUESTO` |
| Fecha | 2026-09-30 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera; pendiente de validación final |
| Work item | [MAPS-107](https://santitalavera.atlassian.net/browse/MAPS-107) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-107 |
| Fase origen | F3 — Arquitectura; baseline F0/F1/F2 |
| Decisiones relacionadas | ADR-SW-003; ADR-CLD-001; ADR-CLD-002; ADR-CLD-003 |
| Depende de | Ninguna |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `PROPUESTO`, `ACEPTADO`, `RECHAZADO`, `REEMPLAZADO`.

## Contexto y problema

MAPS Ecommerce debe soportar catálogo, formularios, solicitudes de seguros, asignación a productores, adjuntos, administración y trazabilidad. El dominio es acotado y comparte reglas, datos y transacciones entre sus capacidades principales.

La aplicación necesita una estructura funcional que evite reproducir una organización puramente horizontal de rutas, controladores, servicios y acceso directo a Prisma. También debe aislar las reglas de negocio de Express, Prisma, GCP, correo y otros detalles externos.

## Drivers y criterios

| Driver o criterio | Importancia | Evidencia / fuente |
| --- | --- | --- |
| Mantener una operación inicial simple | Alta | Dominio acotado y una única aplicación desplegable |
| Proteger los límites del dominio | Alta | Separación de catálogo, formularios, solicitudes y delivery |
| Evitar acoplamiento entre módulos | Alta | Experiencia de la landing con servicios y persistencia directamente acoplados |
| Independencia del dominio respecto de frameworks | Alta | Reglas de negocio probables sin Express, Prisma ni GCP |
| Permitir evolución futura | Media | Extracción sólo si existe evidencia operativa |

## Alternativas consideradas

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| Microservicios desde el inicio | Escalado y despliegue independientes | Complejidad operativa, consistencia distribuida y mayor costo de coordinación | Descartada |
| Monolito no modular | Menor estructura inicial | Dependencias implícitas y acceso cruzado a datos | Descartada |
| Monolito modular con arquitectura hexagonal interna | Operación simple, límites explícitos y dominio aislado | Requiere disciplina de imports, puertos y adaptadores | Propuesta elegida |

## Decisión

Se propone un **monolito modular con arquitectura hexagonal interna** como unidad inicial de despliegue.

La primera descomposición lógica será:

| Módulo | Responsabilidad principal |
| --- | --- |
| Identity | Identidades, sesiones, roles y estado de cuenta |
| Catalog | Categorías, productos, precios y disponibilidad |
| Forms | Definiciones y versiones de formularios |
| Requests | Borradores, respuestas, solicitudes y estados de negocio |
| Assignment / Delivery | Asignación, entrega, reintentos y derivación |
| Files | Adjuntos, metadatos y autorización de acceso |
| Administration | Operaciones administrativas y configuración |
| Audit / Analytics | Auditoría de negocio y eventos de producto |

Cada módulo se organizará internamente mediante:

```text
module/
├── domain/
├── application/
├── ports/
│   ├── in/
│   └── out/
└── adapters/
    ├── in/
    └── out/
```

Reglas principales:

- `domain` no depende de Express, Prisma, GCP ni SDKs externos.
- `application` coordina casos de uso y depende del dominio y de puertos.
- `adapters` implementa la comunicación con HTTP, jobs, Prisma, storage y proveedores externos.
- Un módulo no accede directamente a repositorios ni tablas internas de otro módulo.
- La comunicación entre módulos se realiza mediante contratos de aplicación o eventos definidos.
- La base de datos es compartida como infraestructura, pero el ownership lógico pertenece a un módulo.

## Consecuencias y trade-offs

### Positivas

- Un único despliegue y una operación inicial más simple.
- Límites funcionales explícitos.
- Dominio y casos de uso testeables sin infraestructura.
- Sustitución controlada de persistencia, correo y almacenamiento.
- Camino de evolución si un módulo requiere extracción futura.

### Negativas y riesgos

- La separación debe reforzarse mediante revisión y herramientas.
- Los módulos comparten proceso y, inicialmente, base de datos.
- Una mala definición de ownership puede generar acoplamiento circular.
- La arquitectura hexagonal agrega interfaces y mapeos que deben justificarse.

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Ownership incompleto o ambiguo | Equipo de software | Validar el mapa de módulos y responsabilidades |
| Dependencias cruzadas | Equipo de software | Revisar imports y contratos antes de aceptar el ADR |
| Work item sin cierre | Equipo del proyecto | Validar MAPS-107 y completar la revisión cruzada |

## Criterios de revisión futura

La decisión podrá revisarse si un módulo requiere escalarse, desplegarse, protegerse u operarse de manera independiente, o si aparecen límites de datos y transacciones suficientemente autónomos. Si cambia, deberá crearse un nuevo ADR que reemplace a `ADR-SW-001`.

## Referencias y trazabilidad

- Fuentes F0/F1/F2: dominio, roles, catálogo, formularios, solicitudes y derivación.
- TDD relacionado: `TDD-SW-001` — modelo de dominio y datos.
- Matriz: [traceability.md](../../../../traceability.md).

## Criterio de aceptación

El ADR puede pasar a `ACEPTADO` cuando el equipo valide módulos, ownership, dependencias permitidas, contratos de comunicación y estructura hexagonal de referencia.
