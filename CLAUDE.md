@AGENTS.md

## Específico de Claude Code

- Subagentes del proyecto en `.claude/agents/`:
  - `implementador` (Sonnet): implementa una historia siguiendo la skill `nueva-historia`.
  - `revisor` (Opus): revisa el diff contra la tarjeta y los documentos. **No edita código.**
  Usá siempre el `revisor` en un contexto nuevo, nunca el mismo que implementó.
- Permisos del proyecto en `.claude/settings.json` (lo prohibido está en `deny`, no sólo en este texto).
- Para empezar una historia: pedí "usá la skill nueva-historia para MAPS-<id>".
