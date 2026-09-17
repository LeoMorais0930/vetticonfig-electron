/**
 * CONNECTIONS I/O SERVICE — exportar/importar a lista de conexões
 * (locais + remotas) salvas no app, pra migrar entre máquinas.
 *
 * Onde mora cada dado:
 *   • Locais  → `userData/config.json` chaves `credentials.<MAC>` =
 *               `{ password }`. Cada vez que o usuário entra senha
 *               numa central local, a credencial é cacheada aqui.
 *   • Remotas → `localStorage['vc_remote_connections']` no renderer,
 *               array `[ { mac, conta, url, porta, nome, senha }, … ]`.
 *               Este service NÃO toca em localStorage — o renderer
 *               passa a lista no payload de export e processa o
 *               retorno do import.
 *
 * Schema:
 *   {
 *     "schema":    "vetticonfig-connections-1",
 *     "createdAt": "2026-05-19T…",
 *     "locals":    [ { mac, password }, … ],
 *     "remotes":   [ { mac, conta, url, porta, nome, senha }, … ]
 *   }
 */

const { app, dialog } = require('electron');
const fs   = require('fs');
const path = require('path');
const storage = require('./storage');

const SCHEMA_VERSION = 'vetticonfig-connections-1';

function _collectLocals() {
  // Lê todas as chaves `credentials.<MAC>` do config.json e devolve
  // como array [{ mac, password }, …]. Tolerante a formato inesperado.
  const pref = 'credentials.';
  const out = [];
  storage.listByPrefix(pref).forEach((entry) => {
    const mac = entry.key.slice(pref.length);
    const v = entry.value || {};
    if (!mac || !v.password) return;
    out.push({ mac: mac, password: String(v.password) });
  });
  return out;
}

function _suggestedFilename() {
  const date = new Date().toISOString().slice(0, 10);
  return 'vetticonfig-conexoes-' + date + '.json';
}

function _isValid(p) {
  return p && typeof p === 'object'
      && p.schema === SCHEMA_VERSION
      && (Array.isArray(p.locals) || Array.isArray(p.remotes));
}

/**
 * Coleta locais do storage + remotas passadas pelo renderer, abre
 * dialog Save, grava o JSON. `remotes` vem do localStorage.
 */
async function exportToFile(remotes) {
  // `remotes` historicamente vinha do localStorage do renderer. Agora
  // as remotas ficam em `remote_connections` no config.json — se o
  // renderer mandou lista vazia/nula, fallback pro storage local.
  let resolvedRemotes = Array.isArray(remotes) ? remotes : null;
  if (!resolvedRemotes || resolvedRemotes.length === 0) {
    const fromStorage = storage.get('remote_connections');
    if (Array.isArray(fromStorage)) resolvedRemotes = fromStorage;
  }
  const payload = {
    schema:    SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    locals:    _collectLocals(),
    remotes:   resolvedRemotes || []
  };
  const win = require('electron').BrowserWindow.getFocusedWindow() ||
              require('electron').BrowserWindow.getAllWindows()[0];
  const r = await dialog.showSaveDialog(win || null, {
    title: 'Exportar conexões',
    defaultPath: path.join(app.getPath('documents'), _suggestedFilename()),
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (r.canceled || !r.filePath) return { ok: false, canceled: true };
  try {
    fs.writeFileSync(r.filePath, JSON.stringify(payload, null, 2), 'utf-8');
    return {
      ok: true,
      path: r.filePath,
      counts: { locals: payload.locals.length, remotes: payload.remotes.length }
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Abre dialog Open + lê + valida. Retorna o payload pro renderer
 * processar (merge/replace). `applyLocals(replaceMode)` é feito aqui
 * pra centralizar a escrita do config.json.
 */
async function importFromFile() {
  const win = require('electron').BrowserWindow.getFocusedWindow() ||
              require('electron').BrowserWindow.getAllWindows()[0];
  const r = await dialog.showOpenDialog(win || null, {
    title: 'Importar conexões',
    defaultPath: app.getPath('documents'),
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (r.canceled || !r.filePaths || !r.filePaths[0]) return { ok: false, canceled: true };
  try {
    const data = JSON.parse(fs.readFileSync(r.filePaths[0], 'utf-8'));
    if (!_isValid(data)) throw new Error('JSON não é um backup de conexões VettiConfig válido.');
    return {
      ok: true,
      path: r.filePaths[0],
      data: data,
      counts: {
        locals:  (data.locals  || []).length,
        remotes: (data.remotes || []).length
      }
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Aplica os locais do payload no storage. `replace`=true apaga todas
 * as `credentials.*` existentes antes; false faz merge (upsert).
 */
function applyLocals(locals, replace) {
  if (!Array.isArray(locals)) return { ok: true, count: 0 };
  if (replace) {
    storage.listByPrefix('credentials.').forEach((e) => storage.del(e.key));
  }
  let count = 0;
  locals.forEach((l) => {
    if (!l || !l.mac || !l.password) return;
    storage.set('credentials.' + String(l.mac).toUpperCase(), { password: String(l.password) });
    count++;
  });
  return { ok: true, count: count };
}

function countLocals() {
  return _collectLocals().length;
}

module.exports = { SCHEMA_VERSION, exportToFile, importFromFile, applyLocals, countLocals };
