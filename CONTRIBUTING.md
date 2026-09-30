# Contribuir a MAPS-Ecommerce

Esta guía formaliza cómo coordinamos resultados en Jira y artefactos en GitHub. Aplica a documentación, diseño e implementación; no cambia la [baseline funcional vigente](./README.md) ni aprueba las propuestas técnicas de [Fase 3](./docs/03-arquitectura/README.md).

## 1. Modelo de trabajo: Jira → GitHub

**Jira representa resultados de trabajo.** Las épicas agrupan resultados y cada Historia describe un resultado revisable: objetivo, alcance, criterios de aceptación y dependencias. **GitHub contiene los artefactos** que lo materializan: ramas, commits, ADR, TDD, código, Pull Requests y reviews.

La relación no es 1:1: **1 Historia Jira → N ADR/TDD → N commits → N PR**. También puede requerir análisis, prototipos y revisiones posteriores. Una Historia no representa una PR ni necesariamente un único ADR o TDD. No se crea un work item nuevo por cada documento o PR salvo que aparezca un resultado independiente. Mergear una PR no cierra automáticamente la Historia.

## 2. Workflow de una Historia Jira


| Estado        | Condición de uso                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Por hacer`   | El trabajo todavía no comenzó.                                                                                                          |
| `En curso`    | El responsable inició análisis, diseño o implementación; puede haber artefactos o PR parciales.                                         |
| `En revisión` | El **resultado de la Historia** está suficientemente materializado para evaluar sus criterios. Una PR abierta, por sí sola, no alcanza. |
| `Listo`       | Se cumplieron los criterios de aceptación y los artefactos asociados alcanzaron los estados requeridos.                                 |


Una Historia puede seguir `En curso` aunque una de sus PR ya esté mergeada. El estado Jira describe el resultado, no el ciclo de vida de cada PR.

## 3. Estados de ADR y TDD

Los estados documentales son independientes de los estados Jira:

- ADR: `PROPUESTO` → `ACEPTADO` o `RECHAZADO`; un ADR aceptado puede pasar posteriormente a `REEMPLAZADO` mediante otra decisión.
- TDD: `BORRADOR` → `EN REVISIÓN` → `APROBADO`; un TDD aprobado puede pasar posteriormente a `REEMPLAZADO`.

Un ADR `ACEPTADO` o un TDD `APROBADO` no termina por sí mismo la Historia si quedan otros criterios o artefactos pendientes. El [índice de F3](./docs/03-arquitectura/README.md) define ubicación, IDs, metadatos, relación entre documentos y tratamiento de reemplazos; las [plantillas ADR](./docs/03-arquitectura/templates/ADR-template.md) y [TDD](./docs/03-arquitectura/templates/TDD-template.md) se usan al crear artefactos. Los catálogos previstos no son decisiones aceptadas ni diseños aprobados.

## 4. Ramas y bases de integración



### F0–F3: pre-desarrollo (etapa actual)

F0 cubre kickoff y gobierno; F1, discovery funcional; F2, diseño y UX; F3, arquitectura y diseño técnico. El trabajo es principalmente documentación, análisis, ADR, TDD, prototipos y decisiones. Las ramas revisables de esta etapa parten de `main` y las PR apuntan a `main`. La existencia de `development` no la convierte en base de F0–F3.

Para ramas nuevas asociadas a una Historia, preferir `<tipo>/MAPS-<id>-<descripcion-corta>`, por ejemplo:

```text
docs/MAPS-107-limites-arquitectura
docs/MAPS-108-persistencia-transacciones
docs/MAPS-116-hosting-frontend
```

Una misma rama/PR puede incluir varios ADR/TDD si forman un cambio coherente dentro del resultado Jira; no se exige una rama por documento. No se renombran retroactivamente ramas históricas para cumplir esta pauta. Si un trabajo aún no tiene work item apropiado, identificarlo o acordar su creación antes de abrir la PR; no inventar un `MAPS-XXX`.

### F4+: desarrollo

Al comenzar implementación productiva, las ramas de implementación partirán de `development` y sus PR normales apuntarán a `development`, por ejemplo `feat/MAPS-XXX-autenticacion`, `fix/MAPS-XXX-delivery-retry` o `refactor/MAPS-XXX-domain-boundaries`. `development` será la rama de integración de desarrollo. `main` representará la baseline estable y recibirá luego cambios integrados desde `development` mediante el proceso que se defina. Esta guía no define todavía una estrategia de releases.

```text
F0 ─┐
F1 ─┤
F2 ─┼── pre-desarrollo ──→ main
F3 ─┘

F4+ desarrollo: feat/fix/refactor/... → development → main (integración estable)
```



## 5. Commits

Mantener `tipo(scope): descripción`, con un scope concreto del área modificada. Tipos habituales: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci` y `style`; el [hook existente](./.githooks/commit-msg) también admite `perf` y `revert`. Los commits deben ser pequeños, atómicos y descriptivos.

```text
docs(fase-3): estructura arquitectura y documentos transversales
docs(ui-ux): actualiza prototipo del portal de solicitudes
docs(architecture): define limites modulares
feat(auth): implementa autorizacion por ownership
fix(delivery): preserva ASIGNADA ante fallo de entrega
```

No es obligatorio poner `MAPS-XXX` en todos los mensajes: la trazabilidad principal con Jira está en la rama y la PR. El título de la PR conserva el formato `tipo(scope): descripción`.

## 6. Pull Requests

Toda PR debe identificar el work item Jira real en la sección `Jira` del [template existente](./.github/pull_request_template.md). Indicar qué resultado cubre y, si sólo entrega una parte, qué continúa después. No dejar `MAPS-XXX` como referencia ficticia al publicar. Una PR puede ser parcial sin pasar la Historia a `En revisión` o `Listo`.

```text
Jira: MAPS-107
Esta PR incorpora ADR-SW-001.
ADR-SW-002 continuará en una PR posterior.
La Historia no se cierra con esta PR.
```

Conservar descripción, tipo, área, cambios, verificación, documentación, riesgos y checklists del template. La base se selecciona según la etapa (F0–F3 → `main`; F4+ → `development`). El merge de una PR sólo confirma la integración de sus cambios; el cierre Jira se evalúa por el resultado completo.

## 7. Reviews y ownership de F3

Los responsables principales ya están definidos en [F3](./docs/03-arquitectura/README.md): **Joaquin Rodriguez** para software/dominio y **Santiago Talavera** para cloud/plataforma. Ownership no implica trabajo aislado: una decisión que cruza dominios necesita revisión cruzada y enlaces a los documentos dependientes, no decisiones duplicadas.


| Desde            | Revisión de la otra área cuando impacta en                                                   |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Software → Cloud | Persistencia, runtime, storage, observabilidad, seguridad, despliegue u operaciones.         |
| Cloud → Software | Contratos, dominio, transacciones, autorización, semántica de Delivery o modelo de adjuntos. |


Pares típicos: RBAC de aplicación ↔ IAM cloud; adjuntos ↔ Cloud Storage; Outbox/Delivery ↔ worker/email; persistencia ↔ Cloud SQL/runtime; auditoría/analytics ↔ observabilidad; API ↔ entrada pública/runtime. Cada área conserva su responsabilidad y referencia el artefacto de la otra.

## 8. Pendientes funcionales de MAPS

Una decisión técnica **no puede cerrar silenciosamente** una decisión funcional pendiente. La [matriz de trazabilidad](./docs/03-arquitectura/traceability.md) mantiene visibles, entre otros, el contrato definitivo de formularios, campos de Mi perfil, baja de Cliente/Productor, efectos adicionales de inhabilitación, retención/eliminación y SLA o tratamiento operativo de derivación.

Si una Historia puede avanzar parcialmente, indicar qué se resuelve, qué queda condicionado, quién debe decidirlo y qué Historia o pendiente bloquea el resto. No inventar comportamiento funcional para desbloquear arquitectura ni dar por cerradas F1/F2 por avanzar en F3.

## 9. Definition of Done de una Historia

Antes de pasar una Historia a `Listo`, comprobar que:

- Se cumplieron sus criterios de aceptación y el resultado es revisable.
- Las decisiones necesarias están documentadas; los ADR y TDD requeridos alcanzaron sus estados correspondientes.
- Las PR necesarias están integradas y se realizaron las revisiones de owner y cruzadas que correspondan.
- Las dependencias o pendientes restantes están explícitos y no se presentan como resueltos.
- Se actualizó [traceability.md](./docs/03-arquitectura/traceability.md) cuando el trabajo afecta F3 o su handoff a F4.

Una PR mergeada no equivale automáticamente a una Historia terminada.

## 10. Flujo resumido

```text
Jira: MAPS-XXX
    │
    ▼
Por hacer
    │
    ▼
En curso ── ADR / TDD / análisis / commits / PR parciales
    │
    ▼
En revisión ── review del owner / revisión cruzada / ajustes
    │
    ▼
Listo ── criterios y artefactos requeridos completos
```

