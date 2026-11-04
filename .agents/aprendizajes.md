# Aprendizajes del flujo con agentes

> Bitácora para mejorar la estructura con la experiencia. La lee el `revisor` en cada revisión.
> Mantener corta: una línea por caso. Repasarla con el equipo cada ~5 historias.

## Cómo anotar

`AAAA-MM-DD · MAPS-<id> · qué pasó · dónde se corrigió (o "pendiente")`

Anotar cuando:
- el review humano del PR encontró algo que el `revisor` dejó pasar;
- el `revisor` marcó lo mismo en dos historias distintas;
- el flujo trabó (tope de 3 rondas, hook que bloqueó de más o de menos, instrucciones contradictorias).

## Cómo se corrige (escalera)

Cuanto más se repite, más dura la corrección:

1. **Texto**: regla o aclaración en `AGENTS.md`, el `AGENTS.md` de la app o la skill.
2. **Checklist del revisor**: ítem nuevo en "Qué verificar" de `.claude/agents/revisor.md`.
3. **Automático**: regla de lint, test de arquitectura o hook. Lo que un programa puede verificar
   no debería depender de que un agente se acuerde.

## Registro

- 2026-11-03 · MAPS-179 · el `revisor` corría después del commit, el push y el PR: el flujo estaba
  escrito así en AGENTS.md §7, la skill y `implementador.md`, y nada lo hacía cumplir · revisión
  previa sobre lo stageado (skill §6) + hook `gate-commit.mjs` + flujo con fuente única en la skill.
- 2026-11-03 · MAPS-215 · el gate previo omitía commits con opciones globales y construcciones de
  shell, y bloqueaba algunas búsquedas o mensajes legítimos; la revisión superó tres rondas ·
  análisis de comandos, validación del índice en Git pre-commit para Codex y casos de regresión
  en `.codex/tests/flujo.test.mjs`.
- 2026-11-04 · MAPS-183 · la rama se apiló sobre otra sin mergear (#39) que no tenía el flujo de
  revisión previa (#40/#41); el agente siguió la skill vieja de su worktree, commiteó, pusheó y abrió
  PR (#43) sin revisor previo · #43 cerrado y rehecho en `-v2`; #39 sincronizado con `development` ·
  pendiente: la skill §2 debería pedir verificar que la base tenga el flujo vigente de `development`.
- 2026-11-04 · MAPS-183 · el merge de sincronización de `development` en #39 no está contemplado
  por el flujo (el hook lo habría bloqueado) y además rompió el lint (hooks `.mjs` sin globales de
  Node) · lint corregido en #39 con revisión previa · pendiente: definir cómo se revisa un merge de
  sincronización y lintear `.claude/` y `.codex/` en el PR que los agrega.

## Pendientes de evaluar

- Costo de una revisión con Opus por cada commit atómico. Si pesa, pasar el control del commit al push.
- El `revisor` no tiene el MCP de Atlassian: recibe el criterio de aceptación de la sesión. Revisar
  si conviene darle lectura directa de Jira.
