/**
 * BACKUPS SERVICE — exportar / importar / gerenciar snapshots parciais
 * de configuração da central em formato JSON.
 *
 * "Backup" aqui = exportação seletiva (só as seções marcadas) usada
 * antes de mexer na config pra ter como reverter. NÃO confundir com
 * "clone" (varredura completa pra substituir a central por outra),
 * que vive em `./clones.js`.
 *
 * Localização: `<userData>/backups/<nome>.json`. Schema:
 *
 *   {
 *     "schema": "vetticonfig-backup-1",
 *     "createdAt": "2026-05-19T12:34:56.000Z",
 *     "name": "antes-trocar-rede",
 *     "source": { centralName, model, mac },
 *     "sections": ["identificacao","contactid","rede","supervisao"],
 *     "pars": { "B1060000": "1234", ... }
 *   }
 *
 * O service NÃO conhece comandos da central — só persistência. O
 * renderer é responsável por ler os PARs e mandar via `backups:save`,
 * e na restauração aplica cada PAR via `network:sendCommand`.
 */

const { app, dialog } = require('electron');
const fs   = require('fs');
const path = require('path');

const SCHEMA_VERSION = 'vetticonfig-backup-1';

function _dir() {
  const d = path.join(app.getPath('userData'), 'backups');
  try { fs.mkdirSync(d, { recursive: true }); } catch (_) {}
  return d;
}

function _safeName(name) {
  return String(name || '').trim().replace(/[^\w \-]/g, '_').slice(0, 60);
}

function _isValidPayload(p) {
  return p && typeof p === 'object'
      && p.schema === SCHEMA_VERSION
      && p.pars && typeof p.pars === 'object';
}

function list() {
  const dir = _dir();
  let names;
  try { names = fs.readdirSync(dir); }
  catch (_) { return []; }
  const out = [];
  names.filter((n) => n.endsWith('.json')).forEach((n) => {
    const file = path.join(dir, n);
    try {
      const stat = fs.statSync(file);
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (!_isValidPayload(data)) return;
      out.push({
        file:       n,
        name:       data.name || n.replace(/\.json$/, ''),
        createdAt:  data.createdAt || stat.mtime.toISOString(),
        source:     data.source || {},
        sections:   data.sections || [],
        parCount:   Object.keys(data.pars).length,
        size:       stat.size
      });
    } catch (_) { /* ignora malformado */ }
  });
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out;
}

function save(payload) {
  if (!_isValidPayload(payload)) throw new Error('Payload inválido (schema).');
  const name = _safeName(payload.name) || ('snapshot_' + Date.now());
  payload.name = name;
  if (!payload.createdAt) payload.createdAt = new Date().toISOString();
  const file = path.join(_dir(), name + '.json');
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf-8');
  return { ok: true, file: name + '.json', path: file };
}

function load(file) {
  const safe = path.basename(String(file || ''));
  if (!/\.json$/.test(safe)) throw new Error('Arquivo inválido.');
  const full = path.join(_dir(), safe);
  const data = JSON.parse(fs.readFileSync(full, 'utf-8'));
  if (!_isValidPayload(data)) throw new Error('JSON não é um backup VettiConfig válido.');
  return data;
}

function remove(file) {
  const safe = path.basename(String(file || ''));
  if (!/\.json$/.test(safe)) throw new Error('Arquivo inválido.');
  const full = path.join(_dir(), safe);
  try { fs.unlinkSync(full); return { ok: true }; }
  catch (err) { return { ok: false, error: err.message }; }
}

async function exportAs(file) {
  const data = load(file);
  const win = require('electron').BrowserWindow.getFocusedWindow() ||
              require('electron').BrowserWindow.getAllWindows()[0];
  const r = await dialog.showSaveDialog(win || null, {
    title: 'Exportar backup',
    defaultPath: path.join(app.getPath('documents'), file),
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (r.canceled || !r.filePath) return { ok: false, canceled: true };
  try {
    fs.writeFileSync(r.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { ok: true, path: r.filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function importFile() {
  const win = require('electron').BrowserWindow.getFocusedWindow() ||
              require('electron').BrowserWindow.getAllWindows()[0];
  const r = await dialog.showOpenDialog(win || null, {
    title: 'Importar backup',
    defaultPath: app.getPath('documents'),
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (r.canceled || !r.filePaths || !r.filePaths[0]) return { ok: false, canceled: true };
  try {
    const data = JSON.parse(fs.readFileSync(r.filePaths[0], 'utf-8'));
    if (!_isValidPayload(data)) throw new Error('JSON não é um backup VettiConfig válido.');
    save(data);
    return { ok: true, name: data.name };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function paths() { return { dir: _dir() }; }

module.exports = { SCHEMA_VERSION, list, save, load, remove, exportAs, importFile, paths };
