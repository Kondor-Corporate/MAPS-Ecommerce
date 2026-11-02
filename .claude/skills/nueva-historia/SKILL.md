---
name: nueva-historia
description: Flujo para implementar una historia del backlog F4 del Portal MAPS (MAPS-<id>) desde la tarjeta Jira hasta el PR. Usar cuando se pida empezar, retomar o continuar una historia.
---

# Implementar una historia MAPS-<id>

## 0. Retomar si ya existe
Si existe `.agents/progress/MAPS-<id>.md`, leelo primero y seguí desde "Próximo paso". No rehagas
lo que ya figura como hecho.

## 1. Entender la tarjeta
- Leé la tarjeta (Jira MCP si está disponible; si no, pedila): objetivo, **criterio de aceptación**,
  etiquetas (`default-configurable`, `pendiente-maps`) y **Documentos de contexto**.
- Leé sólo esos documentos, en la sección indicada. No leas todo `docs/`.
- Si algo del criterio es ambiguo y no se resuelve con los documentos: preguntá antes de seguir.

## 2. Preparar el lugar de trabajo
- Rama `<tipo>/MAPS-<id>-<desc-corta>` desde la base que indica CONTRIBUTING §4,
  en un worktree propio si hay otra historia en curso:
  `git worktree add ../maps-MAPS-<id> -b <rama>`.
- Creá `.agents/progress/MAPS-<id>.md` desde `.agents/progress/_plantilla.md`.

## 3. Tests primero
- Un test por ítem del criterio de aceptación, nombrado con el ítem.
- Corrélos y confirmá que **fallan por la razón correcta**.
- Zona sensible (AGENTS.md §6) → **STOP**: mostrá los tests y esperá aprobación humana.
- Registrá en el progreso qué tests escribiste.

## 4. Implementar
- Lo mínimo para pasar los tests, respetando AGENTS.md §5 y el AGENTS.md de la app.
- Valores no definidos por MAPS → parámetro configurable con default, anotado en el progreso.
- Si te apartás de un ADR/TDD-SW: actualizá el documento en esta misma rama.
- Tope: 3 fallas iguales seguidas → frená y reportá (AGENTS.md §8).

## 5. Verificar
- typecheck, lint, build y tests en verde.
- Front: abrí la pantalla en el navegador y guardá captura para el PR.

## 6. Entregar
- Actualizá el progreso (estado, decisiones, pendientes, próximo paso).
- Commits `tipo(scope): descripcion`. PR con la plantilla, completando la sección "Agentes".
- En la sección **Jira** del PR va el link completo a la tarjeta, no sólo la clave:
  `[MAPS-<id> — <título>](https://santitalavera.atlassian.net/browse/MAPS-<id>)`.
- Después de abrir el PR, agregá su link en la tarjeta (*Web links*) con la herramienta de Jira
  (`createJiraIssueRemoteIssueLink`); antes revisá que no esté ya, para no duplicarlo. Si no tenés
  acceso a Jira, pedile al dev que lo agregue.
- Pedí la revisión al subagente `revisor` en un contexto nuevo y pegá su veredicto en el PR.
- No muevas la tarjeta a `Listo`: eso lo decide el equipo (CONTRIBUTING §9).
