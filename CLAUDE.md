@AGENTS.md

## Específico de Claude Code

- **Roles:**
  - **Sesión principal** (abrila con Sonnet): implementa y orquesta siguiendo la skill `nueva-historia`.
  - **Subagente `revisor`** (Opus, `.claude/agents/revisor.md`): revisa lo stageado **antes de cada
    commit**, en un contexto nuevo. **No edita código.**
- El flujo completo vive en `.claude/skills/nueva-historia/SKILL.md` (fuente única).
  Para empezar una historia: "usá la skill nueva-historia para MAPS-<id>".
- `git commit` está controlado por un hook (`.claude/hooks/gate-commit.mjs`): sólo pasa lo que
  aprobó el `revisor`. Los cambios sólo en `docs/` están exentos.
- Permisos del proyecto en `.claude/settings.json` (lo prohibido está en `deny`, no sólo en este texto).
- Lo que aprendemos de cada historia se anota en `.agents/aprendizajes.md`.
- Jira está en `https://santitalavera.atlassian.net` (proyecto MAPS). Todo PR lleva el link
  `https://santitalavera.atlassian.net/browse/MAPS-<id>` en su descripción, y con el MCP de Atlassian
  se agrega el link del PR en la tarjeta (*Web links*).
