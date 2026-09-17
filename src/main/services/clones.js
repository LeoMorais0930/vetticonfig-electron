/**
 * CLONES SERVICE — varredura completa pra substituir uma central.
 *
 * Cenário: cliente troca a placa Vetti por outra; queremos que a nova
 * fique exatamente igual à antiga. O "clone" carrega TODOS os dados
 * configuráveis (PARs, usuários, agenda, dispositivos), não só uma
 * seleção. Pra exportação parcial pré-mudança, ver `./backups.js`.
 *
 * Este service é só persistência + dialog. O renderer faz a coleta /
 * aplicação via `network:sendCommand` — a varredura completa precisa
 * acontecer no renderer porque ele já tem o pipeline de leitura de
 * PARs, USER, AGENDA e BD.
 *
 * Schema do JSON:
 *
 *   {
 *     "schema":    "vetticonfig-clone-1",
 *     "createdAt": "2026-05-19T12:34:56.000Z",
 *     "source":    { centralName, model, mac, firmware },
 *     "pars":      { "<KEY8>": "<value>", ... },        // todos os PARs lidos
 *     "users":     [ { idx, raw }, ... ],                // resposta crua de USER Idx=N
 *     "agenda":    [ { idx, raw }, ... ],                // resposta crua de AGENDA N
 *     "devices":   [ { idx, raw }, ... ]                 // resposta crua de BD N
 *   }
 *
 * Guardar "raw" pra cada record (em vez de já parseado) deixa o restore
 * trivial: re-monta o comando de gravação a partir do raw. Se mudarmos
 * o parser, o JSON antigo continua aplicável.
 */

const { app, dialog } = require('electron');
const fs   = require('fs');
const path = require('path');

const SCHEMA_VERSION = 'vetticonfig-clone-1';

function _isValid(p) {
  return p && typeof p === 'object'
      && p.schema === SCHEMA_VERSION
      && p.pars && typeof p.pars === 'object';
}

/**
 * Salvar o JSON do clone num path escolhido pelo usuário.
 * O payload vem do renderer pronto (já fez a varredura).
 */
async function exportToFile(payload) {
  if (!_isValid(payload)) throw new Error('Payload inválido (schema).');
  const win = require('electron').BrowserWindow.getFocusedWindow() ||
              require('electron').BrowserWindow.getAllWindows()[0];
  const suggested = _suggestedFilename(payload);
  const r = await dialog.showSaveDialog(win || null, {
    title: 'Exportar clone da central',
    defaultPath: path.join(app.getPath('documents'), suggested),
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

/**
 * Abrir um JSON de clone existente. Retorna o payload pro renderer
 * processar.
 */
async function importFromFile() {
  const win = require('electron').BrowserWindow.getFocusedWindow() ||
              require('electron').BrowserWindow.getAllWindows()[0];
  const r = await dialog.showOpenDialog(win || null, {
    title: 'Importar clone',
    defaultPath: app.getPath('documents'),
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (r.canceled || !r.filePaths || !r.filePaths[0]) return { ok: false, canceled: true };
  try {
    const data = JSON.parse(fs.readFileSync(r.filePaths[0], 'utf-8'));
    if (!_isValid(data)) throw new Error('JSON não é um clone VettiConfig válido.');
    return { ok: true, path: r.filePaths[0], data: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function _suggestedFilename(payload) {
  const mac = (payload.source && payload.source.mac) || '';
  const date = new Date(payload.createdAt || Date.now())
                 .toISOString().slice(0, 10);
  const base = mac ? mac.replace(/[^\w]/g, '') + '-' + date : 'clone-' + date;
  return base + '.json';
}

module.exports = { SCHEMA_VERSION, exportToFile, importFromFile };
