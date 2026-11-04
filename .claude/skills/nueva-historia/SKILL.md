---
name: nueva-historia
description: Flujo para implementar una historia del backlog F4 del Portal MAPS (MAPS-<id>) desde la tarjeta Jira hasta el PR, con revisión del subagente revisor ANTES de cada commit. Usar cuando se pida empezar, retomar o continuar una historia.
---

# Implementar una historia MAPS-<id>

Esta skill es **la fuente única del flujo**. AGENTS.md §7 y CLAUDE.md sólo la resumen: si
difieren, manda esta skill y hay que corregir el resumen.

Roles: **vos (la sesión principal) implementás y orquestás**. El subagente `revisor` revisa en un
contexto nuevo. Vos nunca te autoaprobás y el revisor nunca edita.

## 0. Retomar si ya existe
Si existe `.agents/progress/MAPS-<id>.md`, leelo primero y seguí desde "Próximo paso". No rehagas
lo que ya figura como hecho.

## 1. Entender la tarjeta
- Leé la tarjeta (Jira MCP si está disponible; si no, pedila): objetivo, **criterio de aceptación**,
  etiquetas (`default-configurable`, `pendiente-maps`) y **Documentos de contexto**.
- Copiá el criterio de aceptación **literal** al progreso: el revisor lo va a recibir de ahí.
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
- Actualizá el progreso (estado, decisiones, pendientes, próximo paso).

## 6. Revisión previa (antes de commitear)
**Nada se commitea sin APROBAR del `revisor` sobre exactamente lo que se va a commitear.**
Un hook (`.claude/hooks/gate-commit.mjs`) bloquea el `git commit` si no es así.

1. Stageá el bloque a commitear: `git add -A` (o `git add <rutas>` si vas a hacer commits
   atómicos por bloque lógico). Nada de `git commit -a`.
2. Lanzá el subagente `revisor` (siempre uno nuevo) con este pedido:
   - historia `MAPS-<id>` y base de la rama;
   - el **criterio de aceptación literal** y los Documentos de contexto (del progreso);
   - si el bloque es parcial, qué ítems cubre.
   No le pases tu resumen de lo que hiciste: revisa evidencia, no relatos.
3. **CAMBIOS** → corregí, volvé a stagear y lanzá un revisor **nuevo**. Máximo 3 rondas; si a la
   tercera sigue en CAMBIOS, frená y devolvele el control al dev con los hallazgos pendientes.
4. **APROBAR** → el revisor registró la huella. Guardá su salida para el PR.
5. Si un hallazgo apunta a algo que se repite o que las reglas no cubren, anotalo en
   `.agents/aprendizajes.md` (formato en ese archivo).

## 7. Entregar
- Commit `tipo(scope): descripcion` de lo aprobado. Si hay más bloques, volvé al §6 por cada uno.
- Push de la rama (nunca a `main` ni `development`).
- PR con la plantilla, completando la sección "Agentes" y pegando el/los veredictos del revisor.
- En la sección **Jira** del PR va el link completo a la tarjeta, no sólo la clave:
  `[MAPS-<id> — <título>](https://santitalavera.atlassian.net/browse/MAPS-<id>)`.
- Después de abrir el PR, agregá su link en la tarjeta (*Web links*) con la herramienta de Jira
  (`createJiraIssueRemoteIssueLink`); antes revisá que no esté ya, para no duplicarlo. Si no tenés
  acceso a Jira, pedile al dev que lo agregue.
- Si después del PR llegan cambios (review del otro dev), cada commit nuevo vuelve a pasar por §6.
- No muevas la tarjeta a `Listo`: eso lo decide el equipo (CONTRIBUTING §9).
