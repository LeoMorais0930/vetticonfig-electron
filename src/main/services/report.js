/**
 * REPORT SERVICE — exportação de Status em PDF e CSV.
 *
 * O renderer monta o payload (partições, tensões, painel, conexão e
 * lista de dispositivos do que está visível agora) e envia via IPC.
 * Aqui montamos o documento (HTML offscreen renderizado em PDF, ou
 * CSV em texto puro) e salvamos via dialog nativo do SO.
 */

const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function _ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function _suggestedName(payload, ext) {
  const safe = String(payload && payload.central && payload.central.name || 'central')
    .replace(/[^\w-]+/g, '_').slice(0, 40);
  return `vetticonfig_${safe}_${_ts()}.${ext}`;
}

function _esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
  });
}

function _esCsv(s) {
  // Escape CSV: aspas duplas duplicadas, quebra envolvida em aspas.
  const v = String(s == null ? '' : s);
  if (/[",\n;]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
  return v;
}

function _buildHtml(payload) {
  const c = payload.central || {};
  const parts = payload.partitions || [];
  const boxes = payload.boxes || {};
  const panel = payload.panel || {};
  const server = payload.server || {};
  const devices = payload.devices || [];
  const generatedAt = new Date().toLocaleString('pt-BR');

  const partsRows = parts.map((p) => `
    <tr>
      <td>${_esc(p.n)}</td>
      <td>${_esc(p.name)}</td>
      <td>${_esc(p.state)}</td>
    </tr>`).join('');

  const devsRows = devices.map((d, i) => `
    <tr>
      <td>${_esc(d.idx == null ? i + 1 : d.idx)}</td>
      <td>${_esc(d.zone)}</td>
      <td>${_esc(d.name)}</td>
      <td>${_esc(d.type)}</td>
      <td>${_esc(d.version)}</td>
      <td>${_esc(d.partition)}</td>
      <td>${_esc(d.battery)}</td>
      <td>${_esc(d.rssi)}</td>
      <td>${_esc(d.status)}</td>
      <td>${_esc(d.tamper)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>VettiConfig — Relatório de Status</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #1A2332; margin: 0; padding: 0;
    font-size: 11px;
  }
  h1 { color: #003A63; font-size: 18px; margin: 0 0 4px; }
  h2 { color: #003A63; font-size: 13px; margin: 18px 0 6px; border-bottom: 2px solid #0076CB; padding-bottom: 3px; }
  .sub { color: #6E7A8A; font-size: 11px; margin-bottom: 14px; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
  .header .logo { color: #0076CB; font-weight: 800; font-style: italic; font-size: 22px; letter-spacing: 3px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; }
  .kv { display: flex; gap: 6px; font-size: 11px; padding: 2px 0; }
  .kv .k { color: #6E7A8A; font-weight: 600; min-width: 110px; }
  .kv .v { color: #1A2332; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th, td { padding: 4px 6px; border-bottom: 1px solid #DCE3EB; text-align: left; }
  th { background: #DCE3EB; color: #003A63; font-weight: 700; }
  tr:nth-child(even) td { background: #F9F9FA; }
  .badge {
    display: inline-block; padding: 1px 6px; border-radius: 3px;
    font-size: 10px; font-weight: 700; color: #fff;
  }
  .badge.armed    { background: #00B3E4; }
  .badge.stay     { background: #F8CC1C; color: #1A2332; }
  .badge.disarmed { background: #339D57; }
  .badge.alarm    { background: #E05256; }
  .badge.unused   { background: #94A3B5; }
  .footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #DCE3EB; color: #6E7A8A; font-size: 9px; text-align: right; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">VETTI</div>
    <h1>Relatório de Status</h1>
    <div class="sub">Gerado em ${generatedAt}</div>
  </div>
</div>

<h2>Identificação da central</h2>
<div class="grid">
  <div class="kv"><span class="k">Nome:</span><span class="v">${_esc(c.name)}</span></div>
  <div class="kv"><span class="k">Modelo:</span><span class="v">${_esc(c.model)}</span></div>
  <div class="kv"><span class="k">IP:</span><span class="v">${_esc(c.ip)}</span></div>
  <div class="kv"><span class="k">MAC:</span><span class="v">${_esc(c.mac)}</span></div>
</div>

<h2>Partições</h2>
<table>
  <thead><tr><th style="width:60px;">#</th><th>Nome</th><th style="width:140px;">Estado</th></tr></thead>
  <tbody>${partsRows || '<tr><td colspan="3" style="text-align:center;color:#6E7A8A;">—</td></tr>'}</tbody>
</table>

<h2>Status</h2>
<div class="grid">
  <div class="kv"><span class="k">Tensão fonte:</span><span class="v">${_esc(boxes.vdc)}</span></div>
  <div class="kv"><span class="k">Tensão bateria:</span><span class="v">${_esc(boxes.vbat)}</span></div>
  <div class="kv"><span class="k">Tamper central:</span><span class="v">${_esc(boxes.tamper)}</span></div>
  <div class="kv"><span class="k">Sirene com fio:</span><span class="v">${_esc(boxes.sirene)}</span></div>
</div>

<h2>Painel de alarme</h2>
<div class="grid">
  <div class="kv"><span class="k">Data:</span><span class="v">${_esc(panel.date)}</span></div>
  <div class="kv"><span class="k">Hora:</span><span class="v">${_esc(panel.time)}</span></div>
</div>

<h2>Conexão com servidor</h2>
<div class="grid">
  <div class="kv"><span class="k">Status:</span><span class="v">${_esc(server.status)}</span></div>
  <div class="kv"><span class="k">Modem GPRS:</span><span class="v">${_esc(server.gprs)}</span></div>
  <div class="kv"><span class="k">Modem WiFi:</span><span class="v">${_esc(server.wifi)}</span></div>
</div>

<h2>Dispositivos (${devices.length})</h2>
<table>
  <thead>
    <tr>
      <th style="width:40px;">#</th>
      <th style="width:50px;">Zona</th>
      <th>Nome</th>
      <th style="width:70px;">Tipo</th>
      <th style="width:60px;">Versão</th>
      <th style="width:60px;">Partição</th>
      <th style="width:70px;">Bateria</th>
      <th style="width:80px;">Sinal</th>
      <th style="width:90px;">Status</th>
      <th style="width:70px;">Tamper</th>
    </tr>
  </thead>
  <tbody>${devsRows || '<tr><td colspan="10" style="text-align:center;color:#6E7A8A;">Nenhum dispositivo cadastrado.</td></tr>'}</tbody>
</table>

<div class="footer">VettiConfig v${app.getVersion()} — Desenvolvido e Produzido no Brasil</div>

</body>
</html>`;
}

function _buildCsv(payload) {
  const c = payload.central || {};
  const parts = payload.partitions || [];
  const boxes = payload.boxes || {};
  const panel = payload.panel || {};
  const server = payload.server || {};
  const devices = payload.devices || [];
  const generatedAt = new Date().toLocaleString('pt-BR');

  const lines = [];
  lines.push('VettiConfig — Relatório de Status');
  lines.push('Gerado em,' + _esCsv(generatedAt));
  lines.push('');
  lines.push('# Identificação da central');
  lines.push('Nome,' + _esCsv(c.name));
  lines.push('Modelo,' + _esCsv(c.model));
  lines.push('IP,' + _esCsv(c.ip));
  lines.push('MAC,' + _esCsv(c.mac));
  lines.push('');
  lines.push('# Partições');
  lines.push('Numero,Nome,Estado');
  parts.forEach((p) => {
    lines.push([_esCsv(p.n), _esCsv(p.name), _esCsv(p.state)].join(','));
  });
  lines.push('');
  lines.push('# Status');
  lines.push('Tensão fonte,' + _esCsv(boxes.vdc));
  lines.push('Tensão bateria,' + _esCsv(boxes.vbat));
  lines.push('Tamper central,' + _esCsv(boxes.tamper));
  lines.push('Sirene com fio,' + _esCsv(boxes.sirene));
  lines.push('');
  lines.push('# Painel de alarme');
  lines.push('Data,' + _esCsv(panel.date));
  lines.push('Hora,' + _esCsv(panel.time));
  lines.push('');
  lines.push('# Conexão com servidor');
  lines.push('Status,' + _esCsv(server.status));
  lines.push('Modem GPRS,' + _esCsv(server.gprs));
  lines.push('Modem WiFi,' + _esCsv(server.wifi));
  lines.push('');
  lines.push('# Dispositivos');
  lines.push(['#','Zona','Nome','Tipo','Versão','Partição','Bateria','Sinal','Status','Tamper'].join(','));
  devices.forEach((d, i) => {
    lines.push([
      _esCsv(d.idx == null ? i + 1 : d.idx),
      _esCsv(d.zone), _esCsv(d.name), _esCsv(d.type), _esCsv(d.version),
      _esCsv(d.partition), _esCsv(d.battery), _esCsv(d.rssi),
      _esCsv(d.status), _esCsv(d.tamper)
    ].join(','));
  });
  // BOM UTF-8 para Excel reconhecer encoding em pt-BR
  return '﻿' + lines.join('\n') + '\n';
}

/* ─── Tabular genérico ──────────────────────────────────────────────
   Payload alternativo (detecção por presença de `columns` + `rows`):
     { title, central, columns: [{key,label}], rows: [{...}] }
   Usado pelo Buffer e qualquer outra tela que queira exportar uma
   lista tabular simples. Mantém o cabeçalho de central (nome/modelo/
   MAC/IP) e gera tabela com as columns informadas. */

function _buildScanJson(payload) {
  const c = payload.central || {};
  const devices = Array.isArray(payload.devices) ? payload.devices : [];
  return {
    schema: 'vetticonfig-scan-1',
    generatedAt: new Date().toISOString(),
    central: {
      nome: c.name || '',
      modelo: c.model || '',
      ip: c.ip || '',
      mac: c.mac || ''
    },
    devices: devices.map((d) => ({
      nome: d && d.name || '',
      zona: d && d.zone || '',
      particao: d && d.partition || '',
      tipo: d && d.type || ''
    }))
  };
}

function _esHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _buildGenericHtml(payload) {
  const c = payload.central || {};
  const cols = payload.columns || [];
  const rows = payload.rows || [];
  const generatedAt = new Date().toLocaleString('pt-BR');
  const colHead = cols.map((col) => '<th>' + _esHtml(col.label) + '</th>').join('');
  const rowsHtml = rows.map((r) =>
    '<tr>' + cols.map((col) => '<td>' + _esHtml(r[col.key]) + '</td>').join('') + '</tr>'
  ).join('');
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<style>
  body { font-family: -apple-system, system-ui, sans-serif; font-size: 11px; color: #1F2937; margin: 24px; }
  h1 { font-size: 20px; color: #003A63; margin: 0 0 4px; }
  .meta { color: #6E7A8A; font-size: 11px; margin-bottom: 14px; }
  .central { background: #F0F4F8; padding: 8px 12px; border-radius: 6px; margin-bottom: 10px;
             display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
  .central span { color: #003A63; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  thead { background: #003A63; color: #fff; }
  th, td { border: 1px solid #D6DCE5; padding: 4px 6px; text-align: left; vertical-align: top; }
  tbody tr:nth-child(even) { background: #F8FAFC; }
  .footer { margin-top: 18px; text-align: center; color: #6E7A8A; font-size: 10px; }
</style></head><body>
<h1>${_esHtml(payload.title || 'Relatório')}</h1>
<div class="meta">Gerado em ${_esHtml(generatedAt)}</div>
<div class="central">
  <div>Central: <span>${_esHtml(c.name || '---')}</span></div>
  <div>Modelo: <span>${_esHtml(c.model || '---')}</span></div>
  <div>MAC: <span>${_esHtml(c.mac || '---')}</span></div>
  <div>IP: <span>${_esHtml(c.ip || '---')}</span></div>
</div>
<table>
  <thead><tr>${colHead}</tr></thead>
  <tbody>${rowsHtml || '<tr><td colspan="' + cols.length + '" style="text-align:center;color:#6E7A8A;">Sem registros.</td></tr>'}</tbody>
</table>
<div class="footer">VettiConfig v${app.getVersion()} — Desenvolvido e Produzido no Brasil</div>
</body></html>`;
}

function _buildGenericCsv(payload) {
  const c = payload.central || {};
  const cols = payload.columns || [];
  const rows = payload.rows || [];
  const lines = [];
  lines.push((payload.title || 'Relatório') + ' — VettiConfig');
  lines.push('Gerado em,' + _esCsv(new Date().toLocaleString('pt-BR')));
  lines.push('Central,' + _esCsv(c.name) + ',Modelo,' + _esCsv(c.model));
  lines.push('MAC,' + _esCsv(c.mac) + ',IP,' + _esCsv(c.ip));
  lines.push('');
  lines.push(cols.map((col) => _esCsv(col.label)).join(','));
  rows.forEach((r) => {
    lines.push(cols.map((col) => _esCsv(r[col.key])).join(','));
  });
  return '﻿' + lines.join('\n') + '\n';
}

function _isGenericPayload(p) {
  return p && Array.isArray(p.columns) && Array.isArray(p.rows);
}

async function exportPdf(payload) {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  const suggested = _suggestedName(payload, 'pdf');

  const r = await dialog.showSaveDialog(win || null, {
    title: 'Exportar relatório PDF',
    defaultPath: path.join(app.getPath('documents'), suggested),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (r.canceled || !r.filePath) return { ok: false, canceled: true };

  // Cria janela offscreen com o HTML do relatório e gera o PDF via
  // printToPDF do Chromium. Mais robusto que pdfkit + sem dependências.
  const tempWin = new BrowserWindow({
    width: 1024, height: 768,
    show: false,
    webPreferences: { offscreen: false, sandbox: true }
  });
  try {
    const html = _isGenericPayload(payload) ? _buildGenericHtml(payload) : _buildHtml(payload);
    await tempWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const buf = await tempWin.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: { top: 0.5, bottom: 0.5, left: 0.4, right: 0.4 }
    });
    fs.writeFileSync(r.filePath, buf);
    return { ok: true, path: r.filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    try { tempWin.destroy(); } catch (_) {}
  }
}

async function exportCsv(payload) {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  const suggested = _suggestedName(payload, 'csv');
  const r = await dialog.showSaveDialog(win || null, {
    title: 'Exportar relatório CSV',
    defaultPath: path.join(app.getPath('documents'), suggested),
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  });
  if (r.canceled || !r.filePath) return { ok: false, canceled: true };
  try {
    const csv = _isGenericPayload(payload) ? _buildGenericCsv(payload) : _buildCsv(payload);
    fs.writeFileSync(r.filePath, csv, 'utf-8');
    return { ok: true, path: r.filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function exportJson(payload) {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  const suggested = _suggestedName(payload, 'json');
  const r = await dialog.showSaveDialog(win || null, {
    title: 'Exportar Scan JSON',
    defaultPath: path.join(app.getPath('documents'), suggested),
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (r.canceled || !r.filePath) return { ok: false, canceled: true };
  try {
    const json = JSON.stringify(_buildScanJson(payload), null, 2);
    fs.writeFileSync(r.filePath, json, 'utf-8');
    return { ok: true, path: r.filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { exportPdf, exportCsv, exportJson };
