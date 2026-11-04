# MAPS-215 — Adaptar el flujo de agentes de Claude Code a Codex

- **Jira:** [MAPS-215](https://santitalavera.atlassian.net/browse/MAPS-215)
- **Rama:** `chore/MAPS-215-codex-flujo-agentes`
- **PR:** pendiente
- **Estado:** en revisión
- **Documentos aplicados:** `AGENTS.md`, `CONTRIBUTING.md` §4–6, `.claude/skills/nueva-historia/SKILL.md`, `.claude/agents/revisor.md`, `.claude/settings.json` y `.claude/hooks/`.

## Criterio de aceptación → pruebas

1. Codex descubre la skill nueva-historia del repositorio y aplica la revisión independiente antes de cada commit sobre cambios stageados, con la misma excepción existente en Claude para cambios exclusivos de docs/. — prueba de descubrimiento y prueba del hook.
2. La configuración del proyecto define los modelos de los roles: implementación con GPT-6.1 Sol y revisión con GPT-6 Astra; el revisor mantiene el formato de veredicto y registra la huella aprobada. — validación de configuración y prueba de huella.
3. Las restricciones de acceso a .env y los comandos peligrosos/que requieren aprobación se adaptan a los mecanismos de Codex, con las limitaciones de cada entorno documentadas. — validación de TOML, `codex execpolicy check` y revisión del texto.
4. El control previo al commit funciona para comandos de Codex y falla cuando no hay aprobación, cambió el contenido stageado o se encadena el commit con otros comandos; se valida con pruebas reproducibles. — `.codex/tests/flujo.test.mjs`.
5. AGENTS.md describe cómo iniciar y verificar el flujo en Codex sin duplicar las reglas de negocio ni alterar el funcionamiento de Claude Code. — revisión del diff y fuentes únicas.

## Hecho

- Se comprobó que `development` contiene la revisión previa al commit y la skill vigente; `main` aún no la contiene.
- Se creó la historia MAPS-215 para mantener la trazabilidad exigida por CONTRIBUTING.
- Se agregó el adaptador de la skill, el revisor Astra, el modelo Sol de la sesión, el perfil de
  permisos local, las reglas de ejecución y el hook de Codex que reutiliza el gate de Claude.
- `node --test .codex/tests/flujo.test.mjs`: 8 pruebas OK (incluye gate sin aprobación,
  huella aprobada, comandos compuestos, opciones globales de Git, mensajes repetidos,
  búsquedas de texto, excepción docs/, renombre cruzado, política `execpolicy` y pre-commit real).
- TOML de configuración y agente y JSON del hook: sintaxis OK. `codex execpolicy check`: push a
  `main` y `prisma migrate deploy` prohibidos; push de rama de trabajo pide confirmación.
- Primera revisión Astra: CAMBIOS. Se corrigió el código de salida en Windows, el bypass por
  comandos encadenados y la explicación de límites del perfil `.env` y reglas por prefijos.
- Segunda revisión Astra: CAMBIOS. Se restringió `git commit` a una única orden con un mensaje,
  preservando separadores dentro de comillas; los renombres hacia `docs/` ya no se eximen.
- Tercera revisión Astra: CAMBIOS. Se hallaron commits con `git -C "ruta con espacios"` o
  `git --no-pager` que el gate omitía, y falsos bloqueos de búsquedas y mensajes `-m` repetidos.
  El dev autorizó una cuarta revisión. Se corrigió la detección mediante análisis de palabras y
  operadores de shell y se añadieron casos de regresión, incluida sustitución de comandos.
- Cuarta revisión Astra: CAMBIOS. Se cubrieron condicionales y llaves de shell, `git -C` con ruta
  vacía o variable, y se conservaron `git commit -s` documental y consultas de `git log`.
  Se agregó una prueba de `execpolicy`; la lectura efectiva de `.env` depende del perfil local beta.
- Quinta revisión Astra: CAMBIOS. Se cubrieron Git por ruta absoluta y shell `bash -lc` en el
  feedback previo, y opciones de mensaje `-q` y `-S`. Se agregó un Git pre-commit para sesiones
  Codex, que verifica el índice real aun cuando el comando shell no sea reconocible por el hook;
  no cambia los commits humanos ni los de Claude Code.
- Sexta revisión Astra: CAMBIOS. El gate previo no detectaba `exec git commit` en una cadena,
  y bloqueaba la opción compacta `-qm` que Claude permitía. Se separó el gate estricto de Codex
  bajo `.codex/hooks/` y se restauraron sin cambios los hooks existentes de Claude. Los casos
  `exec` y `-qm` se agregaron a la suite; el pre-commit conserva la verificación del índice real.

## Decisiones y desvíos

- La sesión principal implementa con Sol, el subagente nuevo revisa con Astra, como en la versión vigente de Claude.
- Codex reutiliza la lógica de aprobación de `.claude/hooks/` y el contenido de la skill original.

## Defaults configurables asumidos

- No aplica.

## Bloqueos / dudas

- Ninguno.

## Próximo paso

- Stagear el diff completo, solicitar revisión Astra independiente sobre ese índice, corregir
  hallazgos si los hay y registrar la huella antes de commitear. Abrir PR y enlazarlo a Jira.
