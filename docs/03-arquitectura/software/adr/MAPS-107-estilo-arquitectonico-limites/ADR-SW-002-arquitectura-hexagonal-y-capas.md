# ADR — Arquitectura hexagonal y separación de capas

| Dato | Valor |
| --- | --- |
| ID | `ADR-SW-002` |
| Título | Arquitectura hexagonal y separación domain/application/ports/adapters |
| Estado | `PROPUESTO` |
| Fecha | 2026-09-30 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera (revisión cruzada cloud); pendiente de validación final |
| Work item | [MAPS-107](https://santitalavera.atlassian.net/browse/MAPS-107) · subtarea [MAPS-133](https://santitalavera.atlassian.net/browse/MAPS-133) |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-107 |
| Fase origen | [F1 §4/5/7, RN-03/07/08/09/10](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §9/10/12](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-001](./ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-003](../MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md); [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md) |
| Depende de | [ADR-SW-001](./ADR-SW-001-monolito-modular-y-limites.md) |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `PROPUESTO`, `ACEPTADO`, `RECHAZADO`, `REEMPLAZADO`.

## Contexto y problema

[ADR-SW-001](./ADR-SW-001-monolito-modular-y-limites.md) propone dividir la aplicación en módulos por capacidad. Falta decidir cómo se organiza **dentro** de cada módulo y en qué dirección van las dependencias.

Las reglas críticas del Portal son de dominio y deben poder verificarse sin infraestructura: inmutabilidad de `FormVersion` (RN-08), snapshot del precio confirmado (RN-09), transiciones permitidas de `InsuranceRequest` y cancelación por estado (RN-10), y que sólo una entrega exitosa habilite `ASIGNADA → DERIVADA` (RN-07). La estructura de [estructura.md](../../../../estructura.md) ubica esa lógica en servicios que dependen de repositorios Prisma y de Express, lo que ata las reglas a tecnologías que todavía no están aceptadas ([README de arquitectura](../../../README.md)).

## Drivers y criterios

| Driver o criterio | Importancia | Evidencia / fuente |
| --- | --- | --- |
| Reglas de negocio testeables sin base, HTTP ni proveedores | Alta | RN-07/08/09/10 son invariantes de dominio |
| Independencia de frameworks y proveedores no decididos | Alta | Express, Prisma, proveedor de email y storage siguen como propuestas |
| Sustituir adaptadores sin tocar reglas | Media | Email, storage y persistencia pueden cambiar tras ADR cloud |
| Costo de ceremonia proporcional al MVP | Media | Equipo chico; evitar interfaces sin uso real |

## Alternativas consideradas

| Alternativa | Ventajas | Costos / riesgos | Resultado |
| --- | --- | --- | --- |
| Capas tradicionales controller → service → repository (ORM) | Simple y conocida | El dominio depende del ORM y del framework HTTP; reglas dispersas en servicios | Descartada |
| Arquitectura hexagonal (ports & adapters) por módulo | Dominio aislado, adaptadores reemplazables, pruebas sin infraestructura | Más interfaces y mapeos; requiere criterio para no sobre-abstraer | Propuesta elegida |
| Clean Architecture completa con capas adicionales | Separación máxima | Ceremonia desproporcionada para el tamaño del MVP | Descartada |

## Decisión

Se **propone** organizar cada módulo con arquitectura hexagonal:

```text
<modulo>/
├── domain/        entidades, value objects, invariantes, eventos de dominio
├── application/   casos de uso; orquesta dominio y puertos
├── ports/
│   ├── in/        contratos que el módulo ofrece (comandos, consultas)
│   └── out/       contratos que el módulo necesita (repositorios, email, storage, reloj)
└── adapters/
    ├── in/        HTTP, jobs, consumidores de eventos
    └── out/       persistencia, proveedores externos
```

### Reglas de dependencia

- `domain` no depende de ninguna otra capa ni de librerías de infraestructura (Express, ORM, SDK de GCP, cliente de email).
- `application` depende de `domain` y de `ports`; no conoce adaptadores concretos.
- `adapters` implementa `ports` y depende hacia adentro; nunca al revés.
- Otros módulos sólo consumen `ports/in` del módulo owner ([ADR-SW-001](./ADR-SW-001-monolito-modular-y-limites.md)).
- La composición (qué adaptador implementa qué puerto) se resuelve en un único punto de arranque de la aplicación.
- Las reglas se verifican automáticamente con reglas de imports en el lint del repositorio.

### Criterio de proporcionalidad

Un puerto se crea cuando hay una dependencia externa real o una frontera entre módulos. Consultas de sólo lectura para pantallas pueden resolverse con un adaptador de lectura sin pasar por el modelo de dominio, siempre que no escriban ni evadan autorización.

Esta decisión **no** elige ORM, framework HTTP ni proveedores; sólo fija que quedan del lado de los adaptadores.

## Consecuencias y trade-offs

### Positivas

- Invariantes de RN-07/08/09/10 verificables con pruebas unitarias sin infraestructura.
- Elegir o cambiar ORM, email o storage no modifica dominio ni casos de uso.
- Contratos entre módulos explícitos en `ports/in`.

### Negativas y riesgos

- Más archivos, interfaces y mapeos entre modelo de dominio y persistencia.
- Riesgo de abstracciones vacías si no se aplica el criterio de proporcionalidad.
- El equipo necesita convenciones y ejemplos de referencia para aplicarlo de forma homogénea.

## Revisión cruzada cloud

| Impacto | Documento cloud afectado | Estado de revisión |
| --- | --- | --- |
| Adaptadores de salida hacia email, storage y base implican credenciales y configuración inyectadas en el arranque | TDD-CLD-006 (previsto) | Pendiente — Santiago Talavera |
| Adaptadores de entrada para jobs/worker además de HTTP | ADR-CLD-003 (previsto) | Pendiente — Santiago Talavera |

## Riesgos y pendientes

| Riesgo o pendiente | Responsable | Acción / condición de cierre |
| --- | --- | --- |
| Sobre-abstracción | Software | Revisar en code review contra el criterio de proporcionalidad |
| Falta de control automático de dependencias | Software | Configurar reglas de imports antes de iniciar F4 |
| Revisión cruzada cloud sin completar | Santiago Talavera | Completar la tabla de revisión antes de pasar a `ACEPTADO` |

## Criterios de revisión futura

Revisar si el costo de mapeos supera el beneficio en módulos de puro ABM o si surge una tecnología que imponga otra estructura. Si cambia un ADR aceptado, crear uno nuevo que reemplace a `ADR-SW-002`.

## Registro de decisión

| Fecha | Decisión | Participantes | Observaciones |
| --- | --- | --- | --- |
| — | Pendiente: `ACEPTADO` o `RECHAZADO` | — | Requiere validar estructura de referencia, reglas de dependencia y revisión cruzada cloud |

## Referencias y trazabilidad

- Fuentes F0/F1/F2: [F1 §8 RN-07/08/09/10](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §9/10/12](../../../../02-diseno/Fase_2__Design_Handoff.md).
- ADR/TDD relacionados: [ADR-SW-001](./ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-003](../MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [TDD-SW-001](../../tdd/MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md).
- Filas de [traceability.md](../../../traceability.md): Product/FormVersion; lifecycle de InsuranceRequest.
