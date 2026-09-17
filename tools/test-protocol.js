#!/usr/bin/env node
/**
 * Auditoria de protocolo VettiConfig contra uma central real.
 *
 * Uso:
 *   node tools/test-protocol.js --ip <ip> --password <senha> [--out <arquivo.md>]
 *
 * Faz login UDP na central e dispara TODOS os comandos seguros (não
 * modificadores de estado) — comandos PAR de leitura, ID, INFO, STAT 1-5,
 * BDS, BDX, CMD 2 (read estado), CMD 7 (read clock), LOG 1, etc.
 *
 * NÃO chamados (perigosos):
 *   CMD 1 (reset), CMD 6 (atualiza firmware), CMD 8 (pareamento),
 *   CMD 2 AT/D/P/AP (arme/desarme/pânico), BD <iii> Stat:DEL,
 *   LOG DEL, gravação de PAR, CMD 21/22/25, CMD 4 (teste RF).
 *
 * Saída:
 *   Tabela markdown com Comando | Resposta | Status (OK / ERR <code> / timeout / outro).
 *   Salva em --out (se passado) ou imprime no stdout.
 */

const dgram = require('dgram');

// ─── CLI args ────────────────────────────────────────────────
function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) out[a.slice(2)] = (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[++i] : true;
  }
  return out;
}
const args = parseArgs(process.argv);
if (!args.ip || !args.password) {
  console.error('uso: node tools/test-protocol.js --ip <ip> --password <senha> [--out <arquivo.md>]');
  process.exit(1);
}
const HOST    = args.ip;
const PORT    = 5000;
const PSW     = String(args.password);
const TIMEOUT = 1500;

// ─── lista de comandos a auditar ─────────────────────────────
//
// Cada entrada: { cmd: '<corpo>', label: '<descrição>', group: '<grupo>' }
// O `seq` é injetado no momento do envio (T<NNN>).
const PARAMS = [
  // Identificação
  { key: 'E1010000', label: 'Senha do painel' },
  { key: 'E1020000', label: 'Nome do painel' },
  { key: '61010000', label: 'Versão do firmware' },
  // ContactID
  { key: 'A10A0000', label: 'CID Protocolo' },
  { key: 'A1070000', label: 'CID Prioridade de conexão' },
  { key: 'E1060000', label: 'CID URL 1' },
  { key: 'B1050000', label: 'CID TCP port 1' },
  { key: 'E10B0000', label: 'CID URL 2' },
  { key: 'B1090000', label: 'CID TCP Port 2' },
  { key: 'B1060000', label: 'CID número da conta' },
  { key: 'B1070000', label: 'CID Teste Periódico (min)' },
  { key: 'E9020001', label: 'CID DTMF Tel 1' },
  { key: 'E9020002', label: 'CID DTMF Tel 2' },
  // Rede Ethernet
  { key: '910A0000', label: 'Ether use static IP' },
  { key: 'F1010000', label: 'Ether IP address' },
  { key: 'F1020000', label: 'Ether default gateway' },
  { key: 'F1030000', label: 'Ether subnet mask' },
  { key: 'F1040000', label: 'Ether DNS 1' },
  { key: 'F1050000', label: 'Ether DNS 2' },
  { key: '71010000', label: 'VAR Ether IP' },
  { key: '71020000', label: 'VAR Ether Gateway' },
  { key: '71030000', label: 'VAR Ether Mask' },
  { key: '71040000', label: 'VAR Ether DNS 1' },
  { key: '71050000', label: 'VAR Ether DNS 2' },
  // GPRS
  { key: '910E0000', label: 'GPRS auto/static' },
  { key: '61020000', label: 'Modem COPS' },
  { key: '61030000', label: 'Modem IMEI' },
  { key: '61040000', label: 'Modem MODELO' },
  { key: '61050000', label: 'GPRS Login' },
  { key: '61060000', label: 'GPRS Password' },
  { key: '61070000', label: 'GPRS APN' },
  { key: '61080000', label: 'Modem ICC-ID' },
  { key: 'E1030000', label: 'GPRS Login (alt)' },
  { key: 'E1040000', label: 'GPRS APN Senha' },
  { key: 'E1050000', label: 'GPRS APN URL' },
  // WiFi
  { key: 'E1070000', label: 'SSID Rede WiFi' },
  { key: 'E1080000', label: 'Senha Rede WiFi' },
  { key: 'E1090000', label: 'SSID WiFi do Painel' },
  { key: 'E10A0000', label: 'Senha WiFi do Painel' },
  { key: '91110000', label: 'Mostrar SSID do Painel' },
  { key: 'A10B0000', label: 'Wi-Fi AP channel' },
  { key: 'A10C0000', label: 'Wi-Fi AP encryption' },
  // Telefones
  { key: 'E9010001', label: 'Linha Fixa Tel 1' },
  { key: 'E9010002', label: 'Linha Fixa Tel 2' },
  { key: 'E9010003', label: 'Linha Fixa Tel 3' },
  { key: 'E9010004', label: 'Linha Fixa Tel 4' },
  { key: 'E9010005', label: 'Linha Fixa Tel 5' },
  { key: 'E9030001', label: 'GSM SMS 1' },
  { key: 'E9030002', label: 'GSM SMS 2' },
  { key: 'E9030003', label: 'GSM SMS 3' },
  { key: 'E9030004', label: 'GSM TEL 1' },
  { key: 'E9030005', label: 'GSM TEL 2' },
  { key: 'E9030006', label: 'GSM TEL 3' },
  // SMS
  { key: '91010000', label: 'SMS arme/desarme' },
  { key: '91020000', label: 'SMS sensor no teste' },
  { key: '91040000', label: 'SMS queda-retorno energia' },
  { key: '91070000', label: 'SMS sensor aberto' },
  { key: '91090000', label: 'SMS armado com falha sensor' },
  // Alarme
  { key: '91030000', label: 'Teclas Inferiores Automação' },
  { key: '91060000', label: 'Armar com Zona Aberta' },
  { key: '91080000', label: 'Armar com Sensor sem Comunicação' },
  { key: '91120000', label: 'Padrão Sensores Abertura após reset' },
  { key: '91130000', label: 'Monitorar Sirene com fio' },
  { key: 'A1010000', label: 'DTMF número rings' },
  { key: 'A1020000', label: 'Modo de arme' },
  { key: 'A1030000', label: 'Modo de pânico' },
  { key: 'A1040000', label: 'Tempo rearme auto (h)' },
  { key: 'A1050000', label: 'Tempo arme/disparo (s)' },
  { key: 'A1060000', label: 'Tempo pareamento (s)' },
  { key: 'A1090000', label: 'Tempo de disparo' },
  { key: 'A10E0000', label: 'Tempo portão (min)' },
  { key: 'A10F0000', label: 'Número de ciclos sirene' },
  { key: 'B1040000', label: 'Tempo avaria (min)' },
  // Arme programável
  { key: 'C1010000', label: 'Arme prog Domingo' },
  { key: 'C1020000', label: 'Arme prog Segunda' },
  { key: 'C1030000', label: 'Arme prog Terça' },
  { key: 'C1040000', label: 'Arme prog Quarta' },
  { key: 'C1050000', label: 'Arme prog Quinta' },
  { key: 'C1060000', label: 'Arme prog Sexta' },
  { key: 'C1070000', label: 'Arme prog Sábado' },
  // Desarme programável
  { key: 'C1080000', label: 'Desarme prog Domingo' },
  { key: 'C1090000', label: 'Desarme prog Segunda' },
  { key: 'C10A0000', label: 'Desarme prog Terça' },
  { key: 'C10B0000', label: 'Desarme prog Quarta' },
  { key: 'C10C0000', label: 'Desarme prog Quinta' },
  { key: 'C10D0000', label: 'Desarme prog Sexta' },
  { key: 'C10E0000', label: 'Desarme prog Sábado' },
  // Automação
  { key: 'B1010000', label: 'Periférico Ativado no Disparo' },
  { key: 'B1020000', label: 'Periférico que Pulsa no Arme/Desarme' },
  // Avançado
  { key: '910F0000', label: 'Atualizar Nuvem' },
  { key: '910D0000', label: 'Monitora Sensores desarmado' },
  { key: '91100000', label: 'Impedir auto-update' },
  { key: '91050000', label: 'Beta teste' },
  { key: 'A1080000', label: 'Modo sniffer' },
  { key: 'B1030000', label: 'Ether port UDP debug' },
  { key: 'B1080000', label: 'Wi-Fi port UDP debug' },
  { key: 'B10A0000', label: 'Índice Setor Fio 1' },
  { key: 'B10B0000', label: 'Índice Setor Fio 2' },
  { key: '91120000', label: 'Padrão Sensores após reset' },
  { key: '91130000', label: 'Monitorar Sirene com fio' },
  // Relógio
  { key: '910B0000', label: 'Não atualizar relógio auto' },
  { key: '910C0000', label: 'Horário de verão' },
  { key: 'A10D0000', label: 'Fuso horário' },
  // Nuvem
  { key: '41010000', label: 'CS bd' },
  { key: '41020000', label: 'CS cfg' },
  { key: '41030000', label: 'CS App' },
  { key: '61090000', label: 'Status Atualização Firmware' },
  { key: 'E10C0000', label: 'URL Nuvem' },
  { key: 'E10D0000', label: 'App Token' }
];

const COMMANDS_SAFE = [
  { cmd: 'ID',         label: 'Lista MAC, IP, Nome, Interface' },
  { cmd: 'INFO',       label: 'Versão do firmware (long)' },
  { cmd: 'BDS',        label: 'Total de dispositivos' },
  { cmd: 'BDX i',      label: 'Listar primeiro dispositivo' },
  { cmd: 'BDX +',      label: 'Listar próximo dispositivo' },
  { cmd: 'CMD 2',      label: 'Estado das partições' },
  { cmd: 'CMD 7',      label: 'Ler data/hora do painel' },
  { cmd: 'CMD 17',     label: 'Listar BD no Debug' },
  { cmd: 'CMD 19',     label: 'Listar Central no Debug' },
  { cmd: 'CMD 20',     label: 'Consulta RF (último resultado)' },
  { cmd: 'STAT 1',     label: 'Estado dos dispositivos (mapa)' },
  { cmd: 'STAT 2',     label: 'Supervisão RF (mapa)' },
  { cmd: 'STAT 3',     label: 'Estado das baterias (mapa)' },
  { cmd: 'STAT 4',     label: 'Estado da central (CID, GSM)' },
  { cmd: 'STAT 5',     label: 'Estado central + horário + servers' },
  { cmd: 'LOG 1',      label: 'Log interno: posição 1' },
  { cmd: 'LOG 16',     label: 'Log interno: posição 16' },
  { cmd: 'USER Idx=1', label: 'Ler usuário 1' },
  { cmd: 'USER Idx=2', label: 'Ler usuário 2' },
  { cmd: 'CE 1',       label: 'Calendário feriados pos 1' }
];

// ─── UDP session ─────────────────────────────────────────────
const sock = dgram.createSocket('udp4');
let seq = 1;
const pending = new Map();

sock.on('message', (msg) => {
  const text = msg.toString();
  const m = /^\[([TRN])(\d{3,4})(?:\s+([\s\S]*?))?\s*\]$/.exec(text);
  if (!m) return;
  const kind = m[1], n = parseInt(m[2], 10), body = (m[3] || '').trim();
  if (kind === 'R') {
    const p = pending.get(n);
    if (p) { clearTimeout(p.timer); pending.delete(n); p.resolve({ raw: text, body }); }
  }
  // [N...] eventos assíncronos: ignora na auditoria
});

function sendCmd(body) {
  return new Promise((resolve) => {
    const n = seq++;
    const frame = `[T${String(n).padStart(3, '0')} ${body}]`;
    const timer = setTimeout(() => { pending.delete(n); resolve({ timeout: true, sent: frame }); }, TIMEOUT);
    pending.set(n, { resolve, timer });
    sock.send(Buffer.from(frame, 'utf8'), PORT, HOST);
  });
}

function classify(resp) {
  if (resp.timeout) return { status: 'TIMEOUT', body: '' };
  const errMatch = /\bERR\s+(\d+)/i.exec(resp.body || '');
  if (errMatch) return { status: 'ERR ' + errMatch[1], body: resp.body };
  if (/\bERR\b/i.test(resp.body)) return { status: 'ERR (sem código)', body: resp.body };
  return { status: 'OK', body: resp.body };
}

// ─── Main ────────────────────────────────────────────────────
(async () => {
  await new Promise((res) => sock.bind(0, res));

  // 1. Login
  const auth = await sendCmd('PSW ' + PSW);
  const c = classify(auth);
  if (c.status !== 'OK') {
    console.error('[FATAL] Login falhou:', c.status, c.body);
    process.exit(2);
  }

  const results = { params: [], commands: [] };

  // 2. PARs
  process.stderr.write('Lendo ' + PARAMS.length + ' parâmetros...\n');
  for (const p of PARAMS) {
    const r = classify(await sendCmd('PAR ' + p.key));
    results.params.push({ key: p.key, label: p.label, status: r.status, body: r.body });
    process.stderr.write('.');
  }
  process.stderr.write('\n');

  // 3. Comandos
  process.stderr.write('Testando ' + COMMANDS_SAFE.length + ' comandos...\n');
  for (const cm of COMMANDS_SAFE) {
    const r = classify(await sendCmd(cm.cmd));
    results.commands.push({ cmd: cm.cmd, label: cm.label, status: r.status, body: r.body });
    process.stderr.write('.');
  }
  process.stderr.write('\n');

  sock.close();

  // 4. Relatório markdown
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const lines = [];
  lines.push('# Auditoria do protocolo VettiConfig');
  lines.push('');
  lines.push('- Central: `' + HOST + ':' + PORT + '`');
  lines.push('- Data: ' + new Date().toLocaleString('pt-BR'));
  lines.push('- Comandos enviados: ' + (results.params.length + results.commands.length));
  lines.push('');
  const okP = results.params.filter(x => x.status === 'OK').length;
  const errP = results.params.length - okP;
  const okC = results.commands.filter(x => x.status === 'OK').length;
  const errC = results.commands.length - okC;
  lines.push('Resumo: **' + (okP + okC) + ' OK**, **' + (errP + errC) + ' falha** (' + errP + ' params + ' + errC + ' cmds).');
  lines.push('');
  lines.push('## Parâmetros (`[T<seq> PAR <key>]`)');
  lines.push('');
  lines.push('| Key | Label | Status | Resposta |');
  lines.push('|-----|-------|--------|----------|');
  for (const r of results.params) {
    const body = String(r.body || '').replace(/\|/g, '\\|').slice(0, 90);
    lines.push('| `' + r.key + '` | ' + r.label + ' | ' + r.status + ' | `' + body + '` |');
  }
  lines.push('');
  lines.push('## Comandos');
  lines.push('');
  lines.push('| Comando | Descrição | Status | Resposta |');
  lines.push('|---------|-----------|--------|----------|');
  for (const r of results.commands) {
    const body = String(r.body || '').replace(/\|/g, '\\|').slice(0, 120);
    lines.push('| `' + r.cmd + '` | ' + r.label + ' | ' + r.status + ' | `' + body + '` |');
  }
  const md = lines.join('\n') + '\n';

  if (args.out) {
    require('fs').writeFileSync(args.out, md, 'utf8');
    console.error('relatório salvo em', args.out);
  } else {
    process.stdout.write(md);
  }
})();
