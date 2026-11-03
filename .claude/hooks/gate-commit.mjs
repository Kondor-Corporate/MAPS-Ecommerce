#!/usr/bin/env node
// Hook PreToolUse (Bash) de Claude Code. Bloquea `git commit` si lo stageado no es exactamente
// lo que aprobó el subagente `revisor` (skill nueva-historia §6).
//
// - Sólo afecta comandos que corre un agente; un dev en su terminal commitea normalmente.
// - Exento: cambios que tocan únicamente `docs/` (trabajo documental de F3).
// - Es una red contra olvidos, no contra trampas: no autentica quién corrió la aprobación.
//
// Salida: exit 0 deja pasar; exit 2 bloquea y el texto de stderr le llega al agente.

import { archivosStageados, huellaStageada, leerAprobacion } from './revision-comun.mjs';

function bloquear(motivo) {
  console.error(`⛔ Commit bloqueado: ${motivo}\n` +
    'Flujo: `git add` → subagente `revisor` sobre lo stageado → APROBAR → recién ahí `git commit`.\n' +
    'Ver .claude/skills/nueva-historia/SKILL.md §6.');
  process.exit(2);
}

let entrada = '';
for await (const trozo of process.stdin) entrada += trozo;

let comando = '';
let cwd = process.cwd();
try {
  const datos = JSON.parse(entrada);
  comando = datos?.tool_input?.command ?? '';
  if (datos?.cwd) cwd = datos.cwd;
} catch {
  process.exit(0); // entrada inesperada: no interferir
}

// ¿Algún tramo del comando es un `git ... commit`? (contempla `git -C <dir> commit` y cadenas con && ; |)
const tramos = comando.split(/&&|\|\||;|\|/);
const tramoCommit = tramos.map((t) => t.trim()).find((t) =>
  /^(\S+=\S+\s+)*git(\s+-C\s+\S+|\s+-c\s+\S+)*\s+commit\b/.test(t));
if (!tramoCommit) process.exit(0);

const dirC = tramoCommit.match(/\s-C\s+("[^"]+"|'[^']+'|\S+)/);
if (dirC) cwd = dirC[1].replace(/^["']|["']$/g, '');

// Commits que stagean por su cuenta: lo commiteado no sería lo revisado.
// Se miran sólo las opciones anteriores al mensaje, para no confundir texto del mensaje con flags.
const opciones = tramoCommit.split(/\s(?:-m|--message|-F|--file)(?:\s|=)/)[0];
if (/\s(--all|-[a-zA-Z]*a[a-zA-Z]*|-i|--include|-o|--only)(\s|$)/.test(opciones)) {
  bloquear('no uses `commit -a`, `--include` ni `--only`; stageá con `git add` y hacé revisar eso.');
}

let archivos;
let huella;
try {
  archivos = archivosStageados(cwd);
  huella = huellaStageada(cwd);
} catch {
  process.exit(0); // no es un repo git o git falló: que el propio git reporte el error
}

if (archivos.length === 0) process.exit(0); // nada stageado: git mismo lo rechaza (o es --amend del mensaje)
if (archivos.every((a) => a.startsWith('docs/'))) process.exit(0);

const aprobacion = leerAprobacion(cwd);
if (!aprobacion) bloquear('no hay ninguna aprobación del `revisor` en esta rama/worktree.');
if (aprobacion.huella !== huella) {
  bloquear(`lo stageado (${huella.slice(0, 12)}) no es lo que aprobó el revisor ` +
    `(${aprobacion.huella.slice(0, 12)}, ${aprobacion.historia}). Algo cambió después de la revisión.`);
}

process.exit(0);
