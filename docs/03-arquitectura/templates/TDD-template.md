# TDD — [título del diseño]

| Dato | Valor |
| --- | --- |
| ID | `TDD-SW-NNN` o `TDD-CLD-NNN` |
| Título | [título concreto] |
| Estado | `BORRADOR` |
| Fecha | [AAAA-MM-DD] |
| Autor | [responsable principal] |
| Revisores | [responsable de la otra área y otros revisores aplicables] |
| Work item | [ID real o pendiente] |
| URL del work item | [enlace real o pendiente] |
| Fase origen | [enlaces relativos a F0/F1/F2 y reglas pertinentes] |
| Decisiones relacionadas | [ADR que habilitan el diseño y TDD vecinos, con enlaces existentes] |
| Depende de | [decisiones o definiciones funcionales pendientes, o ninguna] |
| Reemplaza | [ID y enlace, o no aplica] |
| Reemplazado por | [ID y enlace, o no aplica] |

> Estados válidos: `BORRADOR`, `EN REVISIÓN`, `APROBADO`, `REEMPLAZADO`. Esta plantilla no constituye un diseño aprobado. El ID permanente del TDD es independiente del work item. Ubicar el archivo dentro de la carpeta del work item bajo `software/tdd/` o `cloud/tdd/` y ajustar los enlaces relativos al copiarlo.

## Propósito y límites

[Qué decisión aceptada o propuesta se diseña, qué parte corresponde a este documento y qué queda en el TDD de la otra área. Enlazar el ADR; si sigue `PROPUESTO`, mantener el TDD condicionado.]

## Baseline y dependencias

| Regla / dependencia | Fuente y estado | Impacto en el diseño |
| --- | --- | --- |
| [RN/RF/RNF o regla UX] | [enlace a F0/F1/F2] | [invariante o contrato] |
| [pendiente funcional, si existe] | `PENDIENTE FUNCIONAL MAPS` | [parte que puede avanzar y parte bloqueada] |

## Vista de componentes y responsabilidades

[Componentes, módulos, ownership, interfaces y límites. Incluir diagrama en `diagrams/` sólo cuando aclare el diseño.]

## Contratos y flujos

[Entradas/salidas, secuencias, autorización, idempotencia, reintentos y fallos observables según corresponda. No agregar estados funcionales de `InsuranceRequest` a partir de estados técnicos de Delivery.]

## Datos, consistencia y migraciones

[Modelo lógico, invariantes, transacciones, persistencia, versionado, migraciones y retención cuando corresponda. Distinguir la base nueva del Portal del PostgreSQL histórico de MAPS descartado como dependencia funcional.]

## Seguridad y privacidad

[Identidad, permisos, aislamiento, secretos, adjuntos, cifrado, auditoría y minimización de PII pertinentes.]

## Operación y observabilidad

[Despliegue, configuración, health, logs, métricas, trazas, alertas, backups/restore y recuperación aplicables.]

## Pruebas y criterios de fallo

[Casos positivos, negativos, concurrencia y fallos; cómo se verifica cada invariante sin confundir simulación con integración real.]

## Implementación y handoff a F4

[Secuencia de implementación, dependencias entre equipos y criterios que permitan descomponer trabajo en F4. No inventar Epic/Issues F4.]

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| [tema o `PENDIENTE FUNCIONAL MAPS`] | [dueño] | [alcance seguro] | [evidencia/decisión requerida] |

## Referencias y trazabilidad

- ADR y TDD relacionados: [enlaces existentes].
- Fuentes F0/F1/F2: [enlaces y reglas concretas].
- Fila de [traceability.md](../traceability.md): [regla o área].
