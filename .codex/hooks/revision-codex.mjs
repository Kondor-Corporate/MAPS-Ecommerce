// Codex comparte el marcador y la huella de Claude, con detección más estricta de rutas stageadas.
import { execFileSync } from 'node:child_process';
import { huellaStageada, leerAprobacion } from '../../.claude/hooks/revision-comun.mjs';

export function validarIndice(cwd) {
  // Sin detección de renombres: mover un archivo hacia docs/ no lo vuelve documental.
  // -z evita confundir nombres que contienen saltos de línea con rutas distintas.
  const salida = execFileSync('git', ['diff', '--cached', '--name-only', '--no-renames', '-z'], {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
  const archivos = salida ? salida.split('\0').filter(Boolean) : [];
  if (archivos.length === 0 || archivos.every((a) => a.startsWith('docs/'))) {
    return { permitido: true };
  }

  const huella = huellaStageada(cwd);
  const aprobacion = leerAprobacion(cwd);
  if (!aprobacion) return { permitido: false, motivo: 'no hay ninguna aprobación del `revisor` en esta rama/worktree.' };
  if (aprobacion.huella !== huella) {
    return {
      permitido: false,
      motivo: `lo stageado (${huella.slice(0, 12)}) no es lo que aprobó el revisor ` +
        `(${aprobacion.huella.slice(0, 12)}, ${aprobacion.historia}). Algo cambió después de la revisión.`,
    };
  }
  return { permitido: true };
}
