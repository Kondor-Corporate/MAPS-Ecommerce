// Utilidades compartidas por el control de revisión previa (ver skill nueva-historia §6).
// La huella de lo stageado es el hash de `git write-tree`: identifica exactamente el contenido
// del índice (archivos nuevos incluidos). Si algo cambia después de la aprobación, cambia la huella.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/** Hash del árbol que quedaría commiteado con el índice actual. */
export function huellaStageada(cwd) {
  return git(cwd, ['write-tree']);
}

/** Archivos stageados respecto de HEAD (vacío si no hay nada para commitear). */
export function archivosStageados(cwd) {
  const salida = git(cwd, ['diff', '--cached', '--name-only']);
  return salida ? salida.split('\n') : [];
}

/** El marcador vive dentro de .git (nunca se commitea) y es propio de cada worktree. */
function rutaMarcador(cwd) {
  const gitDir = resolve(cwd, git(cwd, ['rev-parse', '--git-dir']));
  return join(gitDir, 'maps-review', 'aprobado.json');
}

export function guardarAprobacion(cwd, datos) {
  const ruta = rutaMarcador(cwd);
  mkdirSync(join(ruta, '..'), { recursive: true });
  writeFileSync(ruta, JSON.stringify(datos, null, 2) + '\n');
  return ruta;
}

export function leerAprobacion(cwd) {
  try {
    return JSON.parse(readFileSync(rutaMarcador(cwd), 'utf8'));
  } catch {
    return null;
  }
}
