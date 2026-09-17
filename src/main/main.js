/**
 * MAIN PROCESS - Ponto de entrada do Electron
 * ============================================
 * Este arquivo roda em Node.js puro. Tem acesso total ao SO:
 * arquivos, portas seriais, rede, USB. É o "backend" do app.
 *
 * Responsabilidades:
 *   - Criar e gerenciar janelas (BrowserWindow)
 *   - Registrar handlers IPC (que o renderer vai chamar)
 *   - Gerenciar o ciclo de vida do app
 */

const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');

// Importa os handlers IPC (cada serviço registra seus próprios)
const { registerIpcHandlers } = require('./ipc/handlers');

// Sobrescreve o nome do app ANTES de whenReady. Em dev (`npm start`) o
// processo herda o Info.plist do Electron.app empacotado em node_modules
// e o dock/menu do macOS exibem "Electron". Setando app.setName aqui
// garante que dock/menubar/notificações mostrem "VettiConfig".
// Em build de produção o productName do package.json já cuida disso, mas
// chamar setName não faz mal — fica idempotente.
app.setName('VettiConfig');

// Mantemos referência global para evitar garbage collection da janela
let mainWindow = null;

const isDev = process.env.NODE_ENV === 'development';

// Ícone do app — usado no dock (macOS), na barra de tarefas (Win/Linux)
// e na BrowserWindow. Em build de produção o electron-builder converte
// build/icon.png para .icns/.ico automaticamente; em dev usamos o PNG.
const APP_ICON_PATH = path.resolve(__dirname, '../../build/icon.png');

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'VettiConfig',
    icon: APP_ICON_PATH,
    backgroundColor: '#EEF0F3', // cor da memória (sensor bg) — evita flash branco
    show: false, // só mostra quando estiver pronto, evita flicker
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // OBRIGATÓRIO por segurança
      nodeIntegration: false,   // OBRIGATÓRIO por segurança
      sandbox: false            // false porque o preload precisa de require()
    }
  });

  // Carrega o HTML do renderer
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Mostra quando estiver totalmente carregada
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// O Electron está pronto — cria a janela e registra IPC
app.whenReady().then(() => {
  // Em dev no macOS, o dock mostra o ícone padrão do Electron. Setamos o
  // ícone explicitamente. Em produção (.app gerado pelo electron-builder)
  // o ícone do bundle já é usado automaticamente.
  if (process.platform === 'darwin' && app.dock) {
    try { app.dock.setIcon(nativeImage.createFromPath(APP_ICON_PATH)); } catch (_) {}
  }

  registerIpcHandlers();
  createMainWindow();

  // macOS: reabrir janela quando clicar no ícone do dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Fechar app quando todas as janelas fecharem (exceto no macOS, convenção da Apple)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
