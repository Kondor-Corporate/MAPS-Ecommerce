import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const aprobar = join(raiz, '.claude/hooks/aprobar-revision.mjs');
const hooks = JSON.parse(readFileSync(join(raiz, '.codex/hooks.json'), 'utf8'));
const comandoHook = hooks.hooks.PreToolUse[0].hooks[0].command;

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function instalarHooks(cwd) {
  mkdirSync(join(cwd, '.claude'));
  symlinkSync(join(raiz, '.claude/hooks'), join(cwd, '.claude/hooks'), 'dir');
  mkdirSync(join(cwd, '.codex'));
  symlinkSync(join(raiz, '.codex/hooks'), join(cwd, '.codex/hooks'), 'dir');
}

function ejecutarGate(cwd, command = 'git commit -m "prueba"', hook = comandoHook) {
  return spawnSync('sh', ['-c', hook], {
    cwd,
    input: JSON.stringify({
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command },
      cwd,
    }),
    encoding: 'utf8',
  });
}

test('Codex descubre la skill y conserva un solo flujo de historias', () => {
  const adapter = readFileSync(join(raiz, '.agents/skills/nueva-historia/SKILL.md'), 'utf8');
  const fuente = readFileSync(join(raiz, '.claude/skills/nueva-historia/SKILL.md'), 'utf8');
  assert.match(adapter, /name: nueva-historia/);
  assert.match(adapter, /\.claude\/skills\/nueva-historia\/SKILL\.md/);
  assert.match(fuente, /Revisión previa \(antes de commitear\)/);
});

test('Codex usa Sol para implementar y Astra para la revisión independiente', () => {
  const config = readFileSync(join(raiz, '.codex/config.toml'), 'utf8');
  const revisor = readFileSync(join(raiz, '.codex/agents/revisor.toml'), 'utf8');
  assert.match(config, /model = "gpt-6\.1-sol"/);
  assert.match(revisor, /model = "gpt-6-astra"/);
  assert.match(revisor, /model_reasoning_effort = "xhigh"/);
  assert.match(revisor, /\.claude\/agents\/revisor\.md/);
});

test('El perfil restringe .env y la política diferencia comandos prohibidos y aprobables', (t) => {
  const config = readFileSync(join(raiz, '.codex/config.toml'), 'utf8');
  const guia = readFileSync(join(raiz, 'AGENTS.md'), 'utf8');
  assert.match(config, /default_permissions = "maps-desarrollo"/);
  assert.match(config, /extends = ":workspace"/);
  assert.match(config, /"\*\*\/\.env\.\*" = "deny"/);
  assert.match(guia, /perfil beta no aplica/);

  const pruebaCli = spawnSync('codex', ['--version'], { encoding: 'utf8' });
  if (pruebaCli.error?.code === 'ENOENT') {
    t.diagnostic('Codex CLI no está instalado: comprobar execpolicy check en un entorno con Codex.');
    return;
  }
  assert.equal(pruebaCli.status, 0, pruebaCli.stderr);
  function decision(args) {
    const salida = execFileSync('codex', [
      'execpolicy', 'check', '--rules', join(raiz, '.codex/rules/seguridad.rules'), '--', ...args,
    ], { cwd: raiz, encoding: 'utf8' });
    return JSON.parse(salida).decision;
  }
  assert.equal(decision(['git', 'push', '--force', 'origin', 'HEAD']), 'forbidden');
  assert.equal(decision(['npx', 'prisma', 'migrate', 'deploy']), 'forbidden');
  assert.equal(decision(['git', 'push', 'origin', 'chore/MAPS-215-codex-flujo-agentes']), 'prompt');
});

test('La configuración llama al gate en Bash y conserva el código de bloqueo en Windows', () => {
  assert.equal(hooks.hooks.PreToolUse[0].matcher, '^Bash$');
  assert.match(comandoHook, /\.codex\/hooks\/gate-commit\.mjs/);
  assert.match(hooks.hooks.PreToolUse[0].hooks[0].commandWindows, /exit \$LASTEXITCODE/);
});

test('Git impide el commit indirecto sin aprobación en una sesión de Codex', (t) => {
  const cwd = mkdtempSync(join(tmpdir(), 'maps-codex-precommit-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  git(cwd, 'init', '-q');
  git(cwd, 'config', 'user.name', 'Test');
  git(cwd, 'config', 'user.email', 'test@example.invalid');
  instalarHooks(cwd);
  writeFileSync(join(cwd, 'archivo.txt'), 'inicial\n');
  git(cwd, 'add', 'archivo.txt');
  git(cwd, 'commit', '-qm', 'inicial');
  git(cwd, 'config', 'core.hooksPath', join(raiz, '.githooks'));
  const env = { ...process.env, CODEX_THREAD_ID: 'prueba-codex' };
  writeFileSync(join(cwd, 'archivo.txt'), 'cambio\n');
  git(cwd, 'add', 'archivo.txt');

  for (const command of [
    'git status && /usr/bin/git commit -m prueba',
    "bash -lc 'git commit -m prueba'",
  ]) {
    const resultado = spawnSync('sh', ['-c', command], { cwd, env, encoding: 'utf8' });
    assert.notEqual(resultado.status, 0, command);
    assert.match(resultado.stderr, /no hay ninguna aprobación/, command);
  }

  const aprobado = spawnSync(process.execPath, [aprobar, 'MAPS-215'], { cwd, encoding: 'utf8' });
  assert.equal(aprobado.status, 0, aprobado.stderr);
  const commit = spawnSync('git', ['commit', '-m', 'chore(test): aprobado'], { cwd, env, encoding: 'utf8' });
  assert.equal(commit.status, 0, commit.stderr);
  mkdirSync(join(cwd, 'docs'));
  writeFileSync(join(cwd, 'docs/notas.md'), 'documentación\n');
  git(cwd, 'add', 'docs/notas.md');
  const documental = spawnSync('git', ['commit', '-q', '-m', 'docs(test): documentación'], { cwd, env, encoding: 'utf8' });
  assert.equal(documental.status, 0, documental.stderr);
});

test('El hook de Codex bloquea sin revisión, permite la huella aprobada y bloquea cambios posteriores', (t) => {
  const cwd = mkdtempSync(join(tmpdir(), 'maps-codex-gate-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  git(cwd, 'init', '-q');
  git(cwd, 'config', 'user.name', 'Test');
  git(cwd, 'config', 'user.email', 'test@example.invalid');
  instalarHooks(cwd);
  writeFileSync(join(cwd, 'archivo.txt'), 'inicial\n');
  git(cwd, 'add', 'archivo.txt');
  git(cwd, 'commit', '-qm', 'inicial');
  writeFileSync(join(cwd, 'archivo.txt'), 'cambio\n');

  for (const command of [
    'git commit -m prueba -a',
    'git commit -m prueba archivo.txt',
    'git commit -m prueba --only archivo.txt',
    'git commit -m prueba --amend',
  ]) {
    const noIndexado = ejecutarGate(cwd, command);
    assert.equal(noIndexado.status, 2, `${command}: ${noIndexado.stderr}`);
  }
  git(cwd, 'add', 'archivo.txt');

  const sinAprobar = ejecutarGate(cwd);
  assert.equal(sinAprobar.status, 2, sinAprobar.stderr);
  assert.match(sinAprobar.stderr, /no hay ninguna aprobación/);
  mkdirSync(join(cwd, 'repo con espacio'));
  for (const command of [
    'git -C "repo con espacio" commit -m prueba',
    'git -C "" commit -m prueba',
    'git --no-pager commit -m prueba',
    'git -C "repo con espacio" --no-pager commit -m prueba',
  ]) {
    const resultado = ejecutarGate(cwd, command);
    assert.equal(resultado.status, 2, `${command}: ${resultado.stderr}`);
    assert.match(resultado.stderr, /no hay ninguna aprobación/);
  }
  for (const command of [
    'rg "cómo hacer git commit" README.md',
    'git status commit',
    'git --no-optional-locks log -1 --grep commit',
  ]) {
    assert.equal(ejecutarGate(cwd, command).status, 0, command);
  }

  for (const command of [
    'git add archivo.txt && git commit -m "prueba"',
    'git status\ngit commit -m "prueba"',
    'git status && (git commit -m "prueba")',
    'git status & git commit -m "prueba"',
    'git status && git --no-pager commit -m prueba',
    'git status && /usr/bin/git commit -m prueba',
    'git status && exec git commit -m prueba',
    "git status && bash -lc 'git commit -m prueba'",
    "sh -c 'git commit -m prueba'",
    'if git diff --cached --quiet; then :; else git commit -m prueba; fi',
    'git status && { git commit -m prueba; }',
    'git -C $PWD commit -m prueba',
    'git -C $(pwd) commit -m prueba',
    'git -C `pwd` commit -m prueba',
    'git commit -m "prueba $(date)"',
    'echo "$(git commit -m prueba)"',
    'echo "`git commit -m prueba`"',
    'env GIT_INDEX_FILE=/tmp/otro git commit -m prueba',
    'git --git-dir=.git commit -m prueba',
    'git commit --amend -m "prueba"',
  ]) {
    const compuesto = ejecutarGate(cwd, command);
    assert.equal(compuesto.status, 2, `${command}: ${compuesto.stderr}`);
  }

  const aprobado = spawnSync(process.execPath, [aprobar, 'MAPS-215'], { cwd, encoding: 'utf8' });
  assert.equal(aprobado.status, 0, aprobado.stderr);
  assert.equal(ejecutarGate(cwd).status, 0);
  for (const command of [
    'git commit -m "mensaje; válido"',
    'git commit -m "mensaje\notra línea"',
    'git commit -m "mensaje && otro | más"',
    'git commit -m asunto -m detalle',
    'git commit -s -m asunto',
    'git commit -q -m asunto',
    'git commit -qm asunto',
    'git commit -S -m asunto',
    'git -C "repo con espacio" commit -m asunto -m detalle',
  ]) {
    assert.equal(ejecutarGate(cwd, command).status, 0, command);
  }
  for (const command of [
    'git status && exec git commit -m asunto',
    'git status && command git commit -m asunto',
  ]) {
    assert.equal(ejecutarGate(cwd, command).status, 2, command);
  }

  writeFileSync(join(cwd, 'archivo.txt'), 'otro cambio\n');
  git(cwd, 'add', 'archivo.txt');
  const cambiado = ejecutarGate(cwd);
  assert.equal(cambiado.status, 2, cambiado.stderr);
  assert.match(cambiado.stderr, /Algo cambió después de la revisión/);
});

test('La excepción documental de Claude se conserva en Codex', (t) => {
  const cwd = mkdtempSync(join(tmpdir(), 'maps-codex-docs-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  git(cwd, 'init', '-q');
  instalarHooks(cwd);
  mkdirSync(join(cwd, 'docs'));
  writeFileSync(join(cwd, 'docs/notas.md'), 'Documento F3\n');
  git(cwd, 'add', 'docs/notas.md');
  assert.equal(ejecutarGate(cwd).status, 0);
  assert.equal(ejecutarGate(cwd, 'git commit -m asunto -m detalle').status, 0);
  assert.equal(ejecutarGate(cwd, 'git commit -s -m asunto').status, 0);
  assert.equal(ejecutarGate(cwd, 'git commit -q -m asunto').status, 0);
  assert.equal(ejecutarGate(cwd, 'git commit -qm asunto').status, 0);
  assert.equal(ejecutarGate(cwd, 'git commit -S -m asunto').status, 0);
  const gateClaude = `node "${join(raiz, '.claude/hooks/gate-commit.mjs')}"`;
  assert.equal(ejecutarGate(cwd, 'git commit -qm asunto', gateClaude).status, 0);
});

test('Un archivo movido a docs/ no adquiere la excepción documental', (t) => {
  const cwd = mkdtempSync(join(tmpdir(), 'maps-codex-rename-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  git(cwd, 'init', '-q');
  git(cwd, 'config', 'user.name', 'Test');
  git(cwd, 'config', 'user.email', 'test@example.invalid');
  instalarHooks(cwd);
  writeFileSync(join(cwd, 'archivo.txt'), 'fuera de docs\n');
  git(cwd, 'add', 'archivo.txt');
  git(cwd, 'commit', '-qm', 'inicial');
  mkdirSync(join(cwd, 'docs'));
  git(cwd, 'mv', 'archivo.txt', 'docs/archivo.txt');
  const resultado = ejecutarGate(cwd);
  assert.equal(resultado.status, 2, resultado.stderr);
  assert.match(resultado.stderr, /no hay ninguna aprobación/);
});
