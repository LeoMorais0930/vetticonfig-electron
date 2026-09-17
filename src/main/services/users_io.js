/**
 * USERS I/O SERVICE — exportar/importar cadastro de usuários (USER) de
 * uma central específica como arquivo JSON.
 *
 * Diferença pros clones (full central) e backups (snapshot seletivo
 * por PAR): aqui o escopo é APENAS o banco de usuários — usado pra
 * migrar usuários entre centrais sem mexer no resto da configuração.
 *
 * O service é só dialog Save/Open + validação de schema. A coleta dos
 * registros e a aplicação ficam no renderer (que tem acesso ao
 * pipeline de comandos USER da central).
 *
 * Schema:
 *   {
 *     "schema":    "vetticonfig-users-1",
 *     "createdAt": "2026-05-19T...",
 *     "source":    { centralName, model, mac },
 *     "users":     [ { idx, raw }, ... ],            // raw body USER Idx=N ...
 *     "ctrlAssoc": { "<userIdx>": "<bdIdx>", ... }   // só local; ver §8.x docs
 *   }
 */

const { app, dialog } = require('electron');
const fs   = require('fs');
const path = require('path');

const SCHEMA_VERSION = 'vetticonfig-users-1';

function _isValid(p) {
  return p && typeof p === 'object'
      && p.schema === SCHEMA_VERSION
      && Array.isArray(p.users);
}

function _suggestedFilename(payload) {
  var mac = (payload.source && payload.source.mac) || '';
  var date = new Date(payload.createdAt || Date.now()).toISOString().slice(0, 10);
  var base = mac ? mac.replace(/[^\w]/g, '') + '-users-' + date : 'users-' + date;
  return base + '.json';
}

async function exportToFile(payload) {
  if (!_isValid(payload)) throw new Error('Payload inválido (schema).');
  const win = require('electron').BrowserWindow.getFocusedWindow() ||
              require('electron').BrowserWindow.getAllWindows()[0];
  const r = await dialog.showSaveDialog(win || null, {
    title: 'Exportar usuários',
    defaultPath: path.join(app.getPath('documents'), _suggestedFilename(payload)),
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (r.canceled || !r.filePath) return { ok: false, canceled: true };
  try {
    fs.writeFileSync(r.filePath, JSON.stringify(payload, null, 2), 'utf-8');
    return { ok: true, path: r.filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function importFromFile() {
  const win = require('electron').BrowserWindow.getFocusedWindow() ||
              require('electron').BrowserWindow.getAllWindows()[0];
  const r = await dialog.showOpenDialog(win || null, {
    title: 'Importar usuários',
    defaultPath: app.getPath('documents'),
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (r.canceled || !r.filePaths || !r.filePaths[0]) return { ok: false, canceled: true };
  try {
    const data = JSON.parse(fs.readFileSync(r.filePaths[0], 'utf-8'));
    if (!_isValid(data)) throw new Error('JSON não é um arquivo de usuários VettiConfig válido.');
    return { ok: true, path: r.filePaths[0], data: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { SCHEMA_VERSION, exportToFile, importFromFile };
