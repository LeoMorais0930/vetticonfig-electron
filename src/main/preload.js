/**
 * PRELOAD SCRIPT - Ponte entre Main e Renderer
 * =============================================
 * Este script roda ANTES do HTML carregar, num contexto privilegiado.
 * É a ÚNICA forma segura do renderer (HTML/JS da tela) acessar o Node.js.
 *
 * Tudo que você expor com contextBridge fica disponível em window.vettiAPI
 * dentro das suas telas. O renderer NÃO tem acesso a require, fs, etc —
 * só ao que você explicitamente liberar aqui.
 *
 * Padrão: para cada operação, o preload chama ipcRenderer.invoke(...)
 * e o main process responde via ipcMain.handle(...) em ipc/handlers.js
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vettiAPI', {

  // ===== Informações do app =====
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => process.platform
  },

  // ===== Comunicação de rede (UDP com a central) =====
  network: {
    // Descoberta UDP
    listInterfaces: ()           => ipcRenderer.invoke('network:listInterfaces'),
    discover:       (broadcasts) => ipcRenderer.invoke('network:discover', broadcasts),

    // Sessão autenticada — local (UDP) ou remota (TCP via servidor de monitoramento)
    authenticate:       (ip, password) => ipcRenderer.invoke('network:authenticate', ip, password),
    authenticateRemote: (opts)         => ipcRenderer.invoke('network:authenticateRemote', opts),
    sendCommand:        (body)         => ipcRenderer.invoke('network:sendCommand', body),
    endSession:         ()             => ipcRenderer.invoke('network:endSession'),

    // RTC (CMD 7) — leitura/escrita do relógio da central
    getClock:           ()             => ipcRenderer.invoke('network:getClock'),
    setClock:           (dt)           => ipcRenderer.invoke('network:setClock', dt),

    // Estado da conexão + auto-reconnect
    getConnState:       ()             => ipcRenderer.invoke('network:getConnState'),
    forceReconnect:     ()             => ipcRenderer.invoke('network:forceReconnect'),
    onConnState: (cb) => {
      const sub = (_e, data) => cb(data);
      ipcRenderer.on('network:connState', sub);
      return () => ipcRenderer.removeListener('network:connState', sub);
    },

    // Eventos do main → renderer (cleanup retornado para uso opcional)
    onDiscoveryFound: (cb) => {
      const sub = (_e, data) => cb(data);
      ipcRenderer.on('network:discoveryFound', sub);
      return () => ipcRenderer.removeListener('network:discoveryFound', sub);
    },
    onDiscoveryDone: (cb) => {
      const sub = (_e, data) => cb(data);
      ipcRenderer.on('network:discoveryDone', sub);
      return () => ipcRenderer.removeListener('network:discoveryDone', sub);
    },
    onLogEvent: (cb) => {
      const sub = (_e, data) => cb(data);
      ipcRenderer.on('network:logEvent', sub);
      return () => ipcRenderer.removeListener('network:logEvent', sub);
    },
    onAsyncEvent: (cb) => {
      const sub = (_e, data) => cb(data);
      ipcRenderer.on('network:asyncEvent', sub);
      return () => ipcRenderer.removeListener('network:asyncEvent', sub);
    }
  },

  // ===== Configuração persistente =====
  storage: {
    get: (key)        => ipcRenderer.invoke('storage:get', key),
    set: (key, value) => ipcRenderer.invoke('storage:set', key, value)
  },

  // ===== Relatórios (export do Status em PDF/CSV) =====
  report: {
    exportPdf: (payload) => ipcRenderer.invoke('report:exportPdf', payload),
    exportCsv: (payload) => ipcRenderer.invoke('report:exportCsv', payload),
    exportJson: (payload) => ipcRenderer.invoke('report:exportJson', payload)
  },

  // ===== Backups (Exportar/Importar configurações seletivas) =====
  backups: {
    list:       ()        => ipcRenderer.invoke('backups:list'),
    save:       (payload) => ipcRenderer.invoke('backups:save', payload),
    load:       (file)    => ipcRenderer.invoke('backups:load', file),
    remove:     (file)    => ipcRenderer.invoke('backups:remove', file),
    exportAs:   (file)    => ipcRenderer.invoke('backups:exportAs', file),
    importFile: ()        => ipcRenderer.invoke('backups:importFile')
  },

  // ===== Clones (varredura completa pra substituir central) =====
  clones: {
    exportToFile:   (payload) => ipcRenderer.invoke('clones:exportToFile', payload),
    importFromFile: ()        => ipcRenderer.invoke('clones:importFromFile')
  },

  // ===== Users I/O (exportar/importar só os usuários da central) =====
  usersIo: {
    exportToFile:   (payload) => ipcRenderer.invoke('usersIo:exportToFile', payload),
    importFromFile: ()        => ipcRenderer.invoke('usersIo:importFromFile')
  },

  // ===== Holidays DB (defaults nacionais empacotados + cálculo de móveis) =====
  holidaysDb: {
    listCountries:           ()                  => ipcRenderer.invoke('holidaysDb:listCountries'),
    loadCountry:             (code)              => ipcRenderer.invoke('holidaysDb:loadCountry', code),
    resolveCountryHolidays:  (code, year, lang)  => ipcRenderer.invoke('holidaysDb:resolveCountryHolidays', code, year, lang),
    listMergedHolidays:      (code)              => ipcRenderer.invoke('holidaysDb:listMergedHolidays', code),
    getUserOverlay:          (code)              => ipcRenderer.invoke('holidaysDb:getUserOverlay', code),
    setUserOverlay:          (code, overlay)     => ipcRenderer.invoke('holidaysDb:setUserOverlay', code, overlay),
    importCountryFromNager:  (code, nagerResp, opts) => ipcRenderer.invoke('holidaysDb:importCountryFromNager', code, nagerResp, opts),
    nagerListCountries:      ()                      => ipcRenderer.invoke('holidaysDb:nagerListCountries'),
    nagerImport:             (code, year, opts)      => ipcRenderer.invoke('holidaysDb:nagerImport', code, year, opts)
  },

  // ===== Connections I/O (lista de conexões salvas: locais + remotas) =====
  connsIo: {
    exportToFile:   (remotes)          => ipcRenderer.invoke('connsIo:exportToFile', remotes),
    importFromFile: ()                 => ipcRenderer.invoke('connsIo:importFromFile'),
    applyLocals:    (locals, replace)  => ipcRenderer.invoke('connsIo:applyLocals', locals, replace),
    countLocals:    ()                 => ipcRenderer.invoke('connsIo:countLocals')
  }
});
