#!/usr/bin/env node
// Lo ejecuta SÓLO el subagente `revisor`, y sólo cuando su veredicto es APROBAR.
// Registra la huella de lo stageado; `gate-commit.mjs` deja commitear únicamente esa huella.
//
// Uso: node .claude/hooks/aprobar-revision.mjs MAPS-<id>

import { archivosStageados, guardarAprobacion, huellaStageada } from './revision-comun.mjs';

const historia = process.argv[2];
if (!historia || !/^MAPS-\d+$/.test(historia)) {
  console.error('Uso: node .claude/hooks/aprobar-revision.mjs MAPS-<id>');
  process.exit(1);
}

const cwd = process.cwd();
const archivos = archivosStageados(cwd);
if (archivos.length === 0) {
  console.error('No hay cambios stageados: no hay nada que aprobar. Hacé `git add` antes de revisar.');
  process.exit(1);
}

const huella = huellaStageada(cwd);
const ruta = guardarAprobacion(cwd, {
  historia,
  huella,
  archivos: archivos.length,
  aprobadoEn: new Date().toISOString(),
});

console.log(`Aprobado ${historia}: huella ${huella.slice(0, 12)} (${archivos.length} archivos) → ${ruta}`);
