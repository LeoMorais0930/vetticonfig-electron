#!/usr/bin/env node
/**
 * Em macOS, quando rodamos `npm start`/`electron .`, o Dock e o
 * Activity Monitor lêem o nome do app do Info.plist do bundle
 * Electron.app que vive em node_modules/. Por isso aparece "Electron"
 * mesmo com app.setName('VettiConfig').
 *
 * Este script patcha Info.plist do Electron.app (e dos helpers) pra
 * exibir "VettiConfig". Roda no postinstall — idempotente. Em produção
 * (.app empacotado pelo electron-builder) isso não importa: o bundle
 * de release já tem o productName correto.
 *
 * Outras plataformas (Win/Linux) passam batido — o nome do executável
 * vem do package.json e funciona em dev.
 */
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const APP_NAME = 'VettiConfig';

if (process.platform !== 'darwin') {
  // Nada a fazer fora do macOS.
  process.exit(0);
}

const ELECTRON_APP = path.join(
  __dirname, '..', 'node_modules', 'electron', 'dist', 'Electron.app'
);
if (!fs.existsSync(ELECTRON_APP)) {
  console.log('[rename-electron] Electron.app não encontrado — pula.');
  process.exit(0);
}

const HELPERS = [
  '',
  'Frameworks/Electron Helper.app',
  'Frameworks/Electron Helper (GPU).app',
  'Frameworks/Electron Helper (Plugin).app',
  'Frameworks/Electron Helper (Renderer).app'
];

let patched = 0;
for (const helper of HELPERS) {
  const plistPath = path.join(ELECTRON_APP, 'Contents', helper, 'Contents', 'Info.plist')
    .replace('Contents/Contents', 'Contents'); // limpa duplo Contents pro main

  // Pro main app, o caminho é Electron.app/Contents/Info.plist
  const isMain = helper === '';
  const targetPlist = isMain
    ? path.join(ELECTRON_APP, 'Contents', 'Info.plist')
    : path.join(ELECTRON_APP, 'Contents', helper, 'Contents', 'Info.plist');

  if (!fs.existsSync(targetPlist)) continue;

  // Pro helper, o display name segue o padrão "VettiConfig Helper (GPU)" etc.
  // Mantém o sufixo após "Electron ".
  let name = APP_NAME;
  if (!isMain) {
    const match = /Electron Helper(.*)\.app$/.exec(helper);
    if (match) name = `${APP_NAME} Helper${match[1] || ''}`;
  }

  try {
    execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleName ${name}" "${targetPlist}"`,
             { stdio: 'pipe' });
    execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName ${name}" "${targetPlist}"`,
             { stdio: 'pipe' });
    patched++;
  } catch (err) {
    // Algumas chaves podem não existir — adiciona se faltar.
    try {
      execSync(`/usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string ${name}" "${targetPlist}"`,
               { stdio: 'pipe' });
      patched++;
    } catch (_) {}
  }
}

console.log(`[rename-electron] ${patched} plist(s) patcheado(s) para "${APP_NAME}".`);
