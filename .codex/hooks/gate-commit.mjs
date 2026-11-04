#!/usr/bin/env node
// Hook PreToolUse (Bash) de Codex. Bloquea `git commit` si lo stageado no es exactamente
// lo que aprobó el subagente `revisor` (skill nueva-historia §6).
//
// - Sólo afecta comandos que corre un agente; un dev en su terminal commitea normalmente.
// - Exento: cambios que tocan únicamente `docs/` (trabajo documental de F3).
// - El commit debe ir en una llamada separada: el índice puede cambiar en comandos encadenados.
// - Es una red contra olvidos, no contra trampas: no autentica quién corrió la aprobación.
//
// Salida: exit 0 deja pasar; exit 2 bloquea y el texto de stderr le llega al agente.

import { validarIndice } from './revision-codex.mjs';
import { resolve } from 'node:path';

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
  comando = typeof datos?.tool_input?.command === 'string' ? datos.tool_input.command : '';
  if (datos?.cwd) cwd = datos.cwd;
} catch {
  process.exit(0); // entrada inesperada: no interferir
}

// Un hook PreToolUse mira el índice ANTES de ejecutar la llamada entera. Separamos palabras y
// operadores de shell respetando comillas: así no confundimos `rg "git commit"` con un commit,
// ni ignoramos `git -C "directorio con espacios" commit` o un commit en una cadena.
function analizarOrden(orden) {
  const tramos = [[]];
  let valor = '';
  let iniciado = false;
  let cita = null;
  let escape = false;
  let compuesto = false;
  let dinamico = false;
  let commitEnSustitucion = false;
  function cerrar() {
    if (iniciado) tramos.at(-1).push(valor);
    valor = '';
    iniciado = false;
  }
  for (let posicion = 0; posicion < orden.length; posicion++) {
    const caracter = orden[posicion];
    if (escape) {
      valor += caracter;
      escape = false;
      iniciado = true;
      if (caracter === '\n') dinamico = true;
    } else if (caracter === '\\' && cita !== "'") {
      escape = true;
    } else if (cita) {
      if (caracter === cita) cita = null;
      else {
        if (cita === '"' && ((caracter === '$' && orden[posicion + 1] === '(') || caracter === '`')) {
          const inicio = posicion + (caracter === '$' ? 2 : 1);
          const fin = orden.indexOf(caracter === '$' ? ')' : '`', inicio);
          if (fin !== -1) {
            const interior = analizarOrden(orden.slice(inicio, fin));
            if (interior.commitEnSustitucion || interior.tramos.some((t) => encontrarCommit(t))) {
              commitEnSustitucion = true;
            }
          }
        }
        if (cita === '"' && (caracter === '$' || caracter === '`')) dinamico = true;
        valor += caracter;
      }
    } else if (caracter === '"' || caracter === "'") {
      cita = caracter;
      iniciado = true;
    } else if (caracter === '$' && orden[posicion + 1] === '(') {
      const fin = orden.indexOf(')', posicion + 2);
      if (fin !== -1) {
        const interior = analizarOrden(orden.slice(posicion + 2, fin));
        if (interior.commitEnSustitucion || interior.tramos.some((t) => encontrarCommit(t))) {
          commitEnSustitucion = true;
        }
        valor += orden.slice(posicion, fin + 1);
        iniciado = true;
        posicion = fin;
      } else {
        valor += '$(';
        iniciado = true;
        posicion++;
      }
      dinamico = true;
    } else if (caracter === '$') {
      valor += caracter;
      iniciado = true;
      dinamico = true;
    } else if (caracter === '`') {
      const fin = orden.indexOf('`', posicion + 1);
      if (fin !== -1) {
        const interior = analizarOrden(orden.slice(posicion + 1, fin));
        if (interior.commitEnSustitucion || interior.tramos.some((t) => encontrarCommit(t))) {
          commitEnSustitucion = true;
        }
        valor += orden.slice(posicion, fin + 1);
        posicion = fin;
      } else {
        valor += caracter;
      }
      iniciado = true;
      dinamico = true;
    } else if (';&|\r\n()<>'.includes(caracter)) {
      cerrar();
      compuesto = true;
      tramos.push([]);
    } else if (/\s/.test(caracter)) {
      cerrar();
    } else {
      valor += caracter;
      iniciado = true;
    }
  }
  cerrar();
  return { tramos, compuesto, dinamico, commitEnSustitucion, incompleto: Boolean(cita || escape) };
}

function encontrarCommit(palabras) {
  let indice = 0;
  while (/^[A-Za-z_][A-Za-z_0-9]*=/.test(palabras[indice] ?? '')) indice++;
  while (['if', 'then', 'else', 'elif', 'do', 'while', 'until', '!', '{', '}'].includes(palabras[indice])) indice++;
  if (palabras[indice] === 'env') {
    indice++;
    while (/^[A-Za-z_][A-Za-z_0-9]*=/.test(palabras[indice] ?? '')) indice++;
  } else if (palabras[indice] === 'command' || palabras[indice] === 'exec') indice++;
  const ejecutable = palabras[indice]?.split(/[\\/]/).at(-1);
  if (['bash', 'sh', 'dash', 'zsh'].includes(ejecutable)) {
    const opcion = palabras[indice + 1] ?? '';
    if (/^-[a-z]*c[a-z]*$/.test(opcion) && palabras[indice + 2] !== undefined) {
      const interior = analizarOrden(palabras[indice + 2]);
      if (interior.commitEnSustitucion || interior.tramos.some((t) => encontrarCommit(t))) {
        return { indice: -1, inicio: indice, dir: cwd }; // el shell puede cambiar el índice
      }
    }
    return null;
  }
  if (ejecutable !== 'git' && ejecutable !== 'git.exe') return null;
  const inicio = indice;
  indice++;
  let dir = cwd;
  while (indice < palabras.length) {
    const opcion = palabras[indice];
    if (opcion === '-C' || opcion === '-c') {
      if (palabras[indice + 1] === undefined) return null; // git reportará la opción incompleta
      if (opcion === '-C') dir = resolve(dir, palabras[indice + 1]);
      indice += 2;
    } else if (opcion.startsWith('-C') && opcion.length > 2) {
      dir = resolve(dir, opcion.slice(2));
      indice++;
    } else if (opcion === '--no-pager' || opcion === '--no-optional-locks') {
      indice++;
    } else {
      break;
    }
  }
  if (palabras[indice] === 'commit') return { indice, inicio, dir };
  // Una opción global desconocida podría alterar el repo o el índice: no dejar pasar
  // un commit ambiguo. Un subcomando de lectura con una ruta llamada "commit" sí pasa.
  if (palabras[indice]?.startsWith('-') && palabras.slice(indice + 1).includes('commit')) {
    return { indice: -1, inicio, dir };
  }
  return null;
}

const { tramos, compuesto, dinamico, commitEnSustitucion, incompleto } = analizarOrden(comando);
const commits = tramos.map(encontrarCommit).filter(Boolean);
if (commitEnSustitucion) bloquear('ejecutá `git commit` solo, sin sustituciones de shell.');
if (commits.length === 0) process.exit(0);
if (compuesto || dinamico || incompleto || commits.length !== 1 || commits[0].inicio !== 0 || commits[0].indice < 0) {
  bloquear('ejecutá `git commit` solo, sin comandos encadenados ni sustituciones de shell.');
}
cwd = commits[0].dir;
const argumentos = tramos[0].slice(commits[0].indice + 1);
let mensajes = 0;
let valido = true;
for (let i = 0; i < argumentos.length; i++) {
  if (['-s', '--signoff', '-q', '--quiet', '-S', '--gpg-sign', '--no-gpg-sign'].includes(argumentos[i]) ||
      /^(-S.+|--gpg-sign=.+)$/.test(argumentos[i])) {
    continue; // sólo agrega una línea al mensaje, sin cambiar el árbol
  } else if (/^-[qsS]*[mF]$/.test(argumentos[i]) && argumentos[i + 1] !== undefined) {
    i++;
    mensajes++;
  } else if (/^-[qsS]*[mF].+/.test(argumentos[i])) {
    mensajes++;
  } else if (['-m', '--message', '-F', '--file'].includes(argumentos[i]) && argumentos[i + 1] !== undefined) {
    i++;
    mensajes++;
  } else if (/^(--message|--file)=.+/.test(argumentos[i]) || /^-[mF].+/.test(argumentos[i])) {
    mensajes++;
  } else {
    valido = false;
  }
}
if (!valido || mensajes === 0) {
  bloquear('usá sólo `git commit -m <mensaje>` o `-F <archivo>`; opciones como `-a`, `--amend`, `--only` y rutas cambian el contenido a commitear.');
}

try {
  const resultado = validarIndice(cwd);
  if (!resultado.permitido) bloquear(resultado.motivo);
} catch {
  process.exit(0); // no es un repo git o git falló: que el propio git reporte el error
}
process.exit(0);
