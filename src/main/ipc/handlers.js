/**
 * IPC HANDLERS - Onde o main responde ao renderer
 * ================================================
 * Cada handler corresponde a uma chamada do preload.js.
 *
 * Padrão:
 *   preload:   ipcRenderer.invoke('network:discover')
 *   handler:   ipcMain.handle('network:discover', async () => { ... })
 *
 * As implementações reais vão em ./services/* — aqui só conectamos.
 */

const { ipcMain, app } = require('electron');

const networkService = require('../services/network');
const storageService = require('../services/storage');
const reportService  = require('../services/report');
const backupsService = require('../services/backups');
const clonesService  = require('../services/clones');
const usersIoService = require('../services/users_io');
const connsIoService = require('../services/connections_io');
const holidaysDbService = require('../services/holidays_db');

function registerIpcHandlers() {

  // ===== App =====
  ipcMain.handle('app:getVersion', () => app.getVersion());

  // ===== Network — Descoberta UDP =====
  ipcMain.handle('network:listInterfaces', () => networkService.listInterfaces());
  ipcMain.handle('network:discover', (_e, broadcasts) => networkService.discover(broadcasts));

  // ===== Network — Sessão autenticada (UDP local OU TCP remoto) =====
  ipcMain.handle('network:authenticate',       (_e, ip, password) => networkService.authenticate(ip, password));
  ipcMain.handle('network:authenticateRemote', (_e, opts)         => networkService.authenticateRemote(opts));
  ipcMain.handle('network:sendCommand',        (_e, body)         => networkService.sendCommand(body));
  ipcMain.handle('network:endSession',         ()                 => networkService.endSession());

  // ===== Network — RTC (CMD 7) =====
  ipcMain.handle('network:getClock',           ()                 => networkService.getClock());
  ipcMain.handle('network:setClock',           (_e, dt)           => networkService.setClock(dt));

  // ===== Network — Estado da conexão + auto-reconnect =====
  ipcMain.handle('network:getConnState',       ()                 => networkService.getConnState());
  ipcMain.handle('network:forceReconnect',     ()                 => networkService.forceReconnect());

  // ===== Storage =====
  ipcMain.handle('storage:get', (_e, key)        => storageService.get(key));
  ipcMain.handle('storage:set', (_e, key, value) => storageService.set(key, value));

  // ===== Report (Status export PDF/CSV) =====
  ipcMain.handle('report:exportPdf', (_e, payload) => reportService.exportPdf(payload));
  ipcMain.handle('report:exportCsv', (_e, payload) => reportService.exportCsv(payload));
  ipcMain.handle('report:exportJson', (_e, payload) => reportService.exportJson(payload));

  // ===== Backups (Exportar/Importar configurações seletivas) =====
  ipcMain.handle('backups:list',       ()              => backupsService.list());
  ipcMain.handle('backups:save',       (_e, payload)   => backupsService.save(payload));
  ipcMain.handle('backups:load',       (_e, file)      => backupsService.load(file));
  ipcMain.handle('backups:remove',     (_e, file)      => backupsService.remove(file));
  ipcMain.handle('backups:exportAs',   (_e, file)      => backupsService.exportAs(file));
  ipcMain.handle('backups:importFile', ()              => backupsService.importFile());

  // ===== Clones (varredura completa pra substituir central) =====
  ipcMain.handle('clones:exportToFile',   (_e, payload) => clonesService.exportToFile(payload));
  ipcMain.handle('clones:importFromFile', ()            => clonesService.importFromFile());

  // ===== Users I/O (exportar/importar só usuários da central) =====
  ipcMain.handle('usersIo:exportToFile',   (_e, payload) => usersIoService.exportToFile(payload));
  ipcMain.handle('usersIo:importFromFile', ()            => usersIoService.importFromFile());

  // ===== Connections I/O (exportar/importar lista de conexões salvas) =====
  ipcMain.handle('connsIo:exportToFile',   (_e, remotes)         => connsIoService.exportToFile(remotes));
  ipcMain.handle('connsIo:importFromFile', ()                    => connsIoService.importFromFile());
  ipcMain.handle('connsIo:applyLocals',    (_e, locals, replace) => connsIoService.applyLocals(locals, replace));
  ipcMain.handle('connsIo:countLocals',    ()                    => connsIoService.countLocals());

  // ===== Holidays DB (defaults nacionais empacotados + cálculo de móveis) =====
  ipcMain.handle('holidaysDb:listCountries',         ()                     => holidaysDbService.listCountries());
  ipcMain.handle('holidaysDb:loadCountry',           (_e, code)             => holidaysDbService.loadCountry(code));
  ipcMain.handle('holidaysDb:resolveCountryHolidays',(_e, code, year, lang) => holidaysDbService.resolveCountryHolidays(code, year, lang));
  // Customização local (overlay por usuário): desativar defaults + adicionar
  // feriados estaduais/municipais.
  ipcMain.handle('holidaysDb:listMergedHolidays',    (_e, code)             => holidaysDbService.listMergedHolidays(code));
  ipcMain.handle('holidaysDb:getUserOverlay',        (_e, code)             => holidaysDbService.getUserOverlay(code));
  ipcMain.handle('holidaysDb:setUserOverlay',        (_e, code, overlay)    => holidaysDbService.setUserOverlay(code, overlay));
  // Importação de novo país via Nager.Date. O HTTP fica no main (Electron
  // net.fetch contorna o CSP `default-src 'self'` do renderer).
  ipcMain.handle('holidaysDb:importCountryFromNager', (_e, code, nagerResp, opts) =>
    holidaysDbService.importCountryFromNager(code, nagerResp, opts));
  ipcMain.handle('holidaysDb:nagerListCountries', () =>
    holidaysDbService.nagerListCountries());
  ipcMain.handle('holidaysDb:nagerImport', (_e, code, year, opts) =>
    holidaysDbService.nagerImport(code, year, opts));
}

module.exports = { registerIpcHandlers };
