#!/usr/bin/env node
// Git pre-commit: comprueba el índice real después de que Git procese las opciones del comando.
// Lo invoca .githooks/pre-commit sólo en sesiones de Codex.
import { validarIndice } from './revision-codex.mjs';

try {
  const resultado = validarIndice(process.cwd());
  if (!resultado.permitido) {
    console.error(`⛔ Commit bloqueado: ${resultado.motivo}\n` +
      'Stageá el cambio, pedí APROBAR al revisor y volvé a intentar el commit.');
    process.exit(1);
  }
} catch (error) {
  console.error(`⛔ No se pudo verificar el índice antes del commit: ${error.message}`);
  process.exit(1);
}
