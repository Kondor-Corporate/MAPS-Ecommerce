---
name: nueva-historia
description: Implementar o retomar una historia MAPS-<id> desde Jira hasta el PR con tests primero y revisión independiente de lo stageado antes de cada commit. Usar en Codex al empezar, continuar o corregir una historia.
---

# Historia MAPS con Codex

Leé íntegramente `.claude/skills/nueva-historia/SKILL.md` antes de actuar y seguí sus pasos.
Ese archivo es la **fuente única del flujo** para Claude Code y Codex; no mantengas una segunda
versión de los pasos aquí. Para Codex, la sesión principal implementa y convoca al agente
`revisor` definido en `.codex/agents/revisor.toml` para cada revisión nueva del índice.

Consultá también `AGENTS.md` y el `AGENTS.md` de la carpeta afectada. En una revisión con
veredicto APROBAR, el revisor registra la huella con el mismo comando indicado por la fuente.
