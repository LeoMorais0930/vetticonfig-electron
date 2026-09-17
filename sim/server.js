#!/usr/bin/env node
/**
 * Simulador de central VettiConfig (UDP).
 *
 * Roda como uma "central virtual" que responde aos broadcasts de
 * descoberta, autenticação e comandos VettiConfig. Útil para testar o
 * app sem hardware físico, ou quando a central disponível não suporta
 * todos os campos do protocolo.
 *
 * Uso:
 *   node sim/server.js [--port 5000] [--password 1234]
 *                      [--mac FC-0F-E7-32-3B-D2] [--name "Sim Demo"]
 *                      [--ip <ip>]   (auto-detectado se omitido)
 *                      [--state sim/state.json]
 *                      [--verbose]
 *
 * Encerramento limpo com Ctrl+C — persiste estado em --state se passado.
 */

const dgram = require('dgram');
const os = require('os');
const fs = require('fs');
const path = require('path');

// ─── CLI ─────────────────────────────────────────────────────
const args = (() => {
  const out = {};
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = process.argv[i + 1];
      if (next && !next.startsWith('--')) { out[k] = next; i++; }
      else                                 { out[k] = true; }
    }
  }
  return out;
})();

const PORT     = Number(args.port) || 5000;
const PASSWORD = String(args.password || '1234');
const MAC      = String(args.mac      || 'AA-BB-CC-DD-EE-01');
const NAME     = String(args.name     || 'Sim Demo');
const VERBOSE  = !!args.verbose;
const STATE_FILE = args.state ? String(args.state) : null;

function localIp() {
  const ifs = os.networkInterfaces();
  for (const k of Object.keys(ifs)) {
    for (const x of ifs[k]) {
      if (x.family === 'IPv4' && !x.internal) return x.address;
    }
  }
  return '127.0.0.1';
}
const IP = String(args.ip || localIp());

// ─── Estado da central ───────────────────────────────────────
//
// Defaults baseados no que vimos da central real (Receptora - Demo).
const DEFAULT_STATE = {
  // PARs (key → valor já no formato "raw" como a central retorna)
  params: {
    // Identificação
    'E1010000': PASSWORD,
    'E1020000': NAME,
    '61010000': 'SmartAlarm32: ' + MAC + ' - v 6.68 - Build: 2026/05/10 12:00:00 (sim)',
    // ContactID
    'A10A0000': '2',
    'A1070000': '1',
    'E1060000': 'receptora.vetti.example',
    'B1050000': '9018',
    'E10B0000': '',
    'B1090000': '9018',
    'B1060000': '55047',     // CID conta — D707 em hex
    'B1070000': '24',
    'E9020001': '',
    'E9020002': '',
    // Ethernet (em uso vs. config manual)
    '910A0000': '0',
    'F1010000': '0.0.0.0',
    'F1020000': '0.0.0.0',
    'F1030000': '0.0.0.0',
    'F1040000': '0.0.0.0',
    'F1050000': '0.0.0.0',
    '71010000': IP,
    '71020000': '192.168.1.1',
    '71030000': '255.255.255.0',
    '71040000': '8.8.8.8',
    '71050000': '8.8.4.4',
    // GPRS
    '910E0000': '0',
    '61020000': 'NotInstalled',
    '61030000': '',
    '61040000': '',
    '61050000': '',
    '61060000': '',
    '61070000': '',
    '61080000': '',
    'E1030000': '',
    'E1040000': '',
    'E1050000': '',
    // WiFi
    'E1070000': '',
    'E1080000': '',
    'E1090000': 'VettiSim',
    'E10A0000': 'sim1234',
    '91110000': '0',
    'A10B0000': '6',
    'A10C0000': '2',
    // Telefones
    'E9010001': '', 'E9010002': '', 'E9010003': '', 'E9010004': '', 'E9010005': '',
    'E9030001': '', 'E9030002': '', 'E9030003': '', 'E9030004': '', 'E9030005': '', 'E9030006': '',
    // SMS
    '91010000': '0', '91020000': '0', '91040000': '0', '91070000': '0', '91090000': '0',
    // Alarme
    '91030000': '0', '91060000': '0', '91080000': '0', '91120000': '0', '91130000': '1',
    'A1010000': '5', 'A1020000': '4', 'A1030000': '3', 'A1040000': '0', 'A1050000': '0',
    'A1060000': '60', 'A1090000': '60', 'A10E0000': '0', 'A10F0000': '3', 'B1040000': '15',
    // Avançado
    '910F0000': '0', '910D0000': '0', '91100000': '0', '91050000': '0', 'A1080000': '0',
    'B1030000': '0', 'B1080000': '0', 'B10A0000': '0', 'B10B0000': '0',
    // Relógio
    '910B0000': '2', '910C0000': '1', 'A10D0000': '253',
    // Nuvem
    '41010000': '', '41020000': '', '61090000': '0', 'E10C0000': '', 'E10D0000': '',
    // Arme/Desarme programável (só Domingo e Segunda funcionam, igual à central real)
    'C1010000': '0', 'C1020000': '0',
    'C1080000': '0', 'C1090000': '0',
    // Automação
    'B1010000': '0', 'B1020000': '0'
  },
  // Estado das partições: '-' desarmado, 'A' armado, 'S' stay, 'P' pânico, 'D' disparada, 'N' não utilizada
  partitions: '-NNNNN',
  // Dispositivos pareados — formato compatível com BDX
  devices: [
    { idx: 1,   stat: 'OK', tipo: 'CR4', end: '0C562FC2', v: '1.13', nome: 'CR 4 botoes (sim 001)', z: '-T----', p: '1-----' },
    { idx: 2,   stat: 'OK', tipo: 'PLR', end: 'AABB1234', v: '7.06', nome: 'Presença LR (sim 002)', z: '2T----', p: '1-----' },
    { idx: 3,   stat: 'OK', tipo: 'Shx', end: 'B66C86F5', v: '6.02', nome: 'Abertura Shox (sim 003)', z: '2T--P-', p: '1-----' },
    { idx: 255, stat: 'OK', tipo: 'Fio', end: '00000001', v: '0.00', nome: 'Sensor com fio (sim 255)', z: '-T--P-', p: '1-----' }
  ],
  // Estado dos sensores (32 bytes hex, 1 = aberto/violado/baixa)
  stat1: new Array(32).fill('00'),  // aberto/fechado
  stat2: new Array(32).fill('00'),  // supervisão RF
  stat3: new Array(32).fill('00'),  // bateria baixa
  // Tensões
  vdc: 12500,
  vbat: 0,
  tamper: 0,
  sirene: 1,
  // Sessão
  session: { authed: false, expiresAt: 0 }
};

// Carrega estado do arquivo (se existir)
let state = JSON.parse(JSON.stringify(DEFAULT_STATE));
if (STATE_FILE && fs.existsSync(STATE_FILE)) {
  try {
    const persisted = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state = Object.assign(state, persisted);
    console.log('[sim] Estado carregado de', STATE_FILE);
  } catch (e) { console.error('[sim] Falha ao carregar estado:', e.message); }
}

function persistState() {
  if (!STATE_FILE) return;
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) { console.error('[sim] Falha ao salvar estado:', e.message); }
}

// ─── Helpers de protocolo ASCII ──────────────────────────────
function makeR(seq, body) { return '[R' + String(seq).padStart(3, '0') + ' ' + body + ']'; }

function parseFrame(text) {
  const m = /^\[T(\d{3,4})(?:\s+([\s\S]*?))?\s*\]$/.exec(text);
  if (!m) return null;
  return { seq: parseInt(m[1], 10), body: (m[2] || '').trim() };
}

function checkAuth() {
  return state.session.authed && Date.now() < state.session.expiresAt;
}

function refreshAuth() {
  state.session.expiresAt = Date.now() + 60000; // 60s
}

// ─── Handlers de comandos ────────────────────────────────────
function handle(seq, body) {
  // PSW <senha>
  let m = /^PSW\s+(.+)$/i.exec(body);
  if (m) {
    if (m[1] === PASSWORD) {
      state.session.authed = true;
      refreshAuth();
      return makeR(seq, 'PSW OK');
    }
    return makeR(seq, 'PSW ERR Tent=1 Tmr=0s');
  }

  // ID (não exige auth)
  if (/^ID$/i.test(body)) {
    return makeR(seq, 'ID Mac:' + MAC + ' IP:' + IP + ' - SmartAlarm32 V6.68 - Nome:"' + NAME + '" Interface:"Ethernet" - Empresa:""');
  }

  // Demais comandos: exigem auth válida
  if (!checkAuth()) {
    return makeR(seq, 'ERR 7');
  }
  refreshAuth();

  // INFO
  if (/^INFO$/i.test(body)) {
    return makeR(seq, 'INFO SmartAlarm32 V6.68 - Build date:2026/05/10 - Build time:12:00:00 (sim)');
  }

  // CMD 7 [data]
  m = /^CMD\s+7(?:\s+(.+))?$/i.exec(body);
  if (m) {
    if (m[1]) state.params['_clock'] = m[1];
    const now = state.params['_clock'] || new Date().toISOString().replace('T', ' ').replace(/\..+$/, '').replace(/-/g, '/');
    return makeR(seq, 'CMD 7 "' + now + '"');
  }

  // CMD 2 (sem args = estado das partições)
  if (/^CMD\s+2$/i.test(body)) {
    return makeR(seq, 'CMD 2 (p:' + state.partitions + ')');
  }

  // CMD 2 AT:p / D:p / AP:p / P:p
  m = /^CMD\s+2\s+(AT|AP|D|P):(\d)$/i.exec(body);
  if (m) {
    const op = m[1].toUpperCase();
    const p  = parseInt(m[2], 10) - 1;
    if (p < 0 || p >= 6) return makeR(seq, 'ERR 17');
    let ch = state.partitions[p];
    if (ch === 'N') return makeR(seq, 'ERR 17');
    const newCh = (op === 'AT') ? 'A' : (op === 'AP') ? 'S' : (op === 'D') ? '-' : 'P';
    state.partitions = state.partitions.substring(0, p) + newCh + state.partitions.substring(p + 1);
    return makeR(seq, 'CMD 2 ' + m[1] + ':' + (p + 1));
  }

  // STAT 4
  if (/^STAT\s+4$/i.test(body)) {
    return makeR(seq, 'STAT 4 CID=ethernet GSM=NI Vdc=' + state.vdc + ' Vbat=' + state.vbat + ' Tamper=' + state.tamper + ' Sir=' + state.sirene + ' Modem="" Cops=""');
  }

  // STAT 5
  if (/^STAT\s+5$/i.test(body)) {
    const t = new Date().toISOString().replace('T', ' ').replace(/\..+$/, '').replace(/-/g, '/');
    return makeR(seq, 'STAT 5 CID=ethernet GSM=NI Time="' + t + '" Serv1="receptora.sim.local" Serv2=""');
  }

  // STAT 1/2/3 — mapa de bits hex separado por espaço
  m = /^STAT\s+(1|2|3)$/i.exec(body);
  if (m) {
    const arr = m[1] === '1' ? state.stat1 : m[1] === '2' ? state.stat2 : state.stat3;
    return makeR(seq, 'STAT ' + m[1] + ' "' + arr.join(' ') + '"');
  }

  // BDS
  if (/^BDS$/i.test(body)) {
    return makeR(seq, 'BDS Tot:' + state.devices.length + ' Max:256 Inib:0');
  }

  // BDX i / BDX +
  m = /^BDX\s+(i|\+)$/i.exec(body);
  if (m) {
    if (m[1] === 'i') state.session.bdxIdx = 0;
    else              state.session.bdxIdx = (state.session.bdxIdx == null ? 0 : state.session.bdxIdx + 1);
    const i = state.session.bdxIdx;
    if (i >= state.devices.length) return makeR(seq, 'ERR 27');
    const d = state.devices[i];
    return makeR(seq,
      'BD ' + d.idx +
      ' Stat:' + d.stat +
      ' Tipo:' + d.tipo +
      ' End:' + d.end +
      ' V:' + d.v +
      ' Nome:"' + d.nome + '"' +
      ' z:' + d.z +
      ' p:' + d.p +
      ' zs:--------' +
      ' cfg:50' +
      ' Acao:3'
    );
  }

  // PAR <key> [valor]
  m = /^PAR\s+([0-9A-Fa-f]{8})(?:\s+(.+))?$/i.exec(body);
  if (m) {
    const key = m[1].toUpperCase();
    if (m[2] !== undefined) {
      // gravação
      let v = m[2];
      if (v[0] === '"' && v[v.length - 1] === '"') v = v.slice(1, -1);
      state.params[key] = v;
      persistState();
      return makeR(seq, 'PAR ' + key + ' ' + (m[2]));
    }
    // leitura
    if (state.params[key] === undefined) return makeR(seq, 'ERR 17');
    let v = state.params[key];
    // Se contém espaço, retorna entre aspas
    if (/\s/.test(v) || v === '') v = '"' + v + '"';
    return makeR(seq, 'PAR ' + key + ' ' + v);
  }

  // USER Idx=N
  m = /^USER\s+Idx=(\d+)$/i.exec(body);
  if (m) {
    const idx = parseInt(m[1], 10);
    if (idx === 1) return makeR(seq, 'USER Idx=1 Stat=OK Flags=1-1-1-11 Prev=-------- Nome="Admin" Senha=1234 Armar=1-----/DSTQQSS/00:00/23:59 Desarmar=1-----/DSTQQSS/00:00/23:59 Pgm=------/DSTQQSS/00:00/23:59 Panico=1-----');
    return makeR(seq, 'USER Idx=' + idx + ' Stat=LIV');
  }

  // Comandos não suportados / desconhecidos
  return makeR(seq, 'ERR 8');
}

// ─── Servidor UDP ────────────────────────────────────────────
const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });

sock.on('message', (msg, rinfo) => {
  const text = msg.toString().trim();
  if (VERBOSE) console.log('[sim ←]', rinfo.address + ':' + rinfo.port, text);

  // Discovery: [T001 ID] em broadcast — responde com ID padrão (sem auth)
  if (text === '[T001 ID]') {
    const resp = '[R001 ID Mac:' + MAC + ' IP:' + IP + ' - SmartAlarm32 V6.68 - Nome:"' + NAME + '" Interface:"Ethernet" - Empresa:""]';
    sock.send(Buffer.from(resp), rinfo.port, rinfo.address);
    if (VERBOSE) console.log('[sim →]', rinfo.address + ':' + rinfo.port, resp);
    return;
  }

  const f = parseFrame(text);
  if (!f) return;
  const resp = handle(f.seq, f.body);
  sock.send(Buffer.from(resp), rinfo.port, rinfo.address);
  if (VERBOSE) console.log('[sim →]', rinfo.address + ':' + rinfo.port, resp);
});

sock.on('error', (err) => console.error('[sim] erro socket:', err.message));

sock.bind(PORT, () => {
  sock.setBroadcast(true);
  console.log('=========================================');
  console.log(' VettiConfig Simulator');
  console.log('=========================================');
  console.log(' MAC:      ' + MAC);
  console.log(' IP:       ' + IP);
  console.log(' Nome:     ' + NAME);
  console.log(' Senha:    ' + PASSWORD);
  console.log(' Porta UDP: ' + PORT);
  console.log(' Estado:   ' + (STATE_FILE || '(memória)'));
  console.log('-----------------------------------------');
  console.log(' Pronto. Procure pelo app no menu Nova Conexão.');
  console.log(' Ctrl+C para encerrar.');
  console.log('=========================================');
});

// Ctrl+C limpa
process.on('SIGINT', () => {
  console.log('\n[sim] Encerrando...');
  persistState();
  sock.close();
  process.exit(0);
});
