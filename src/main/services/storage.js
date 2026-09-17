/**
 * STORAGE SERVICE
 * ===============
 * Armazenamento local persistente (config, conexões, credenciais etc).
 *
 * Local físico em macOS:
 *   ~/Library/Application Support/VettiConfig/config.json
 *   ~/Library/Application Support/VettiConfig/config.backups/   (rotação)
 *
 * Robustez:
 *   • Write ATÔMICO: grava em `config.json.tmp` + `fsyncSync` + `rename`.
 *     Se o app crashar no meio, o arquivo final mantém o estado anterior
 *     (rename é atômico em POSIX/NTFS).
 *   • Backup rotativo: antes de cada write, copia o config.json atual
 *     para `config.backups/config.<ISO-ts>.json`. Mantém no máximo
 *     MAX_BACKUPS arquivos (apaga o mais antigo). Pra recuperar manual,
 *     basta sobrescrever o config.json com um deles.
 *   • Auto-recover: se readAll() falhar ao parsear JSON (corrupção),
 *     varre o config.backups/ do mais recente pro mais antigo, restaura
 *     o primeiro válido e devolve o conteúdo. Operação silenciosa — o
 *     resto do app não precisa saber.
 */

const { app } = require('electron');
const fs   = require('fs');
const path = require('path');

const MAX_BACKUPS = 5;
const BACKUP_FILE_RE = /^config\.\d{4}-\d{2}-\d{2}T.*\.json$/;

const userDataDir = () => app.getPath('userData');
const configPath  = () => path.join(userDataDir(), 'config.json');
const backupDir   = () => path.join(userDataDir(), 'config.backups');

function _ensureBackupDir() {
  try { fs.mkdirSync(backupDir(), { recursive: true }); } catch (_) {}
}

function _listBackupsAsc() {
  try {
    return fs.readdirSync(backupDir())
      .filter((n) => BACKUP_FILE_RE.test(n))
      .sort();                                      // mais antigo primeiro
  } catch (_) { return []; }
}

function _rotateBackups() {
  const list = _listBackupsAsc();
  while (list.length > MAX_BACKUPS) {
    const name = list.shift();
    try { fs.unlinkSync(path.join(backupDir(), name)); } catch (_) {}
  }
}

function _makeBackup() {
  // Snapshot do config.json atual ANTES de sobrescrever. No-op se o
  // arquivo ainda não existe (primeiro write da vida do app).
  try {
    if (!fs.existsSync(configPath())) return;
    _ensureBackupDir();
    const ts = new Date().toISOString().replace(/:/g, '-').replace(/\..+$/, '');
    const dest = path.join(backupDir(), 'config.' + ts + '.json');
    // Evita backup duplicado dentro do mesmo segundo (rename atômico
    // suficiente — se já existe, deixa).
    if (!fs.existsSync(dest)) fs.copyFileSync(configPath(), dest);
    _rotateBackups();
  } catch (_) {}
}

function _tryRestoreFromBackup() {
  // Varre os backups do mais novo pro mais velho; o primeiro JSON
  // válido vira o novo config.json. Devolve o conteúdo ou {} se nada
  // pôde ser recuperado.
  const list = _listBackupsAsc().reverse();
  for (let i = 0; i < list.length; i++) {
    const src = path.join(backupDir(), list[i]);
    try {
      const parsed = JSON.parse(fs.readFileSync(src, 'utf-8'));
      try { fs.copyFileSync(src, configPath()); } catch (_) {}
      return parsed;
    } catch (_) { /* tenta o próximo */ }
  }
  return {};
}

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(configPath(), 'utf-8'));
  } catch (err) {
    if (err && err.code === 'ENOENT') return {};
    // Corrupção: tenta restaurar do backup mais recente.
    return _tryRestoreFromBackup();
  }
}

function writeAll(obj) {
  _makeBackup();
  const tmp  = configPath() + '.tmp';
  const data = JSON.stringify(obj, null, 2);
  const fd   = fs.openSync(tmp, 'w');
  try {
    fs.writeSync(fd, data);
    fs.fsyncSync(fd);            // garante que o conteúdo chegou ao disco
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, configPath());   // rename atômico
}

function get(key) {
  return readAll()[key] ?? null;
}

function set(key, value) {
  const data = readAll();
  data[key] = value;
  writeAll(data);
  return { ok: true };
}

// Retorna pares { key, value } pra todas as chaves que começam com o
// prefixo dado. Usado pelo connections_io pra dump das credentials.*
function listByPrefix(prefix) {
  const data = readAll();
  const pref = String(prefix || '');
  const out = [];
  Object.keys(data).forEach((k) => {
    if (k.indexOf(pref) === 0) out.push({ key: k, value: data[k] });
  });
  return out;
}

// Apaga uma chave (no-op se ausente). Usado no import "substituir".
function del(key) {
  const data = readAll();
  if (!(key in data)) return { ok: true, deleted: false };
  delete data[key];
  writeAll(data);
  return { ok: true, deleted: true };
}

module.exports = { get, set, listByPrefix, del };
