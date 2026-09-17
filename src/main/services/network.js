/**
 * NETWORK SERVICE
 * ===============
 * Comunicação UDP com a central VettiConfig (família SmartAlarm).
 *
 *   - Descoberta na rede via broadcast UDP porta 5000 (`[T001 ID]`).
 *   - Sessão autenticada via UDP unicast porta 5000:
 *       1. authenticate(ip, password) abre socket, envia [T001 PSW <senha>]
 *          e aguarda [R001 ...]. Se OK, mantém o socket aberto.
 *       2. sendCommand(body) envia [T<NNN> body] com sequencial incremental,
 *          retorna promise que resolve quando [R<NNN> ...] chega (timeout 5s).
 *       3. endSession() fecha o socket.
 *   - Eventos assíncronos da central (`[N<NNN> ...]`) chegam pelo mesmo
 *     socket e são repassados via `network:asyncEvent`.
 *
 * Roda no main process. Renderer acessa via IPC.
 *
 * Referências do protocolo: docs/VETTI - Protocolo - VettiConfig - Rev 2.pdf
 *   §5.3 — encapsulamento de comandos (frame 0xAC; aqui usamos ASCII puro
 *          via UDP local, como o piloto, sem o frame binário).
 *   §7.1.1 — autenticação `[T001 PSW nnnn]` (válida por 60s).
 *   §8.4 — eventos assíncronos `[N<N> CSTAT/TE/TS/PSTAT ...]`.
 *   §8.5 — códigos de erro (7 = senha inválida, 8 = comando inexistente, ...).
 */

const dgram = require('dgram');
const net = require('net');
const os = require('os');
const crypto = require('crypto');
const { Netmask } = require('netmask');
const { BrowserWindow } = require('electron');

const { formatTimestamp } = require('../lib/datetime');
const protocol = require('../lib/protocol');

const CENTRAL_PORT       = 5000;
const DISCOVERY_PAYLOADS = [
  { body: 'ID',  buffer: Buffer.from('[T001 ID]') },
  { body: 'IDX', buffer: Buffer.from('[T001 IDX]') }
];
const DISCOVERY_ATTEMPTS = 4;
const DISCOVERY_TIMEOUT  = 2000;
const COMMAND_TIMEOUT    = 5000;
const REMOTE_KA_INTERVAL = 45000;          // §5.2 manda a cada 45s
const REMOTE_LOGIN_TIMEOUT = 10000;

// Status codes da resposta 0xAA do servidor de monitoramento.
// Descobertos via engenharia reversa da versão Java (TcpCom.java).
const LOGIN_STATUS = {
  0x80: 'ok',
  0x8D: 'unregistered',   // MAC/conta não cadastrada no receptor
  0x8E: 'offline',        // central offline (não conectada ao receptor)
  0x8F: 'bad-hash'        // hash do MAC/conta não confere
};

let session = null; // sessão local UDP ou remota TCP — ver authenticate*/_sendInternal

// ============================================================
// Saúde da conexão — detecção de queda + auto-reconnect
// ============================================================
// Estados:
//   'idle'         — nenhuma sessão ativa (boot ou logout explícito)
//   'alive'        — sessão OK; recebendo respostas normalmente
//   'lost'         — perda detectada (close/error TCP ou N timeouts UDP);
//                    aguardando próxima tentativa
//   'reconnecting' — re-autenticação em andamento
//
// Eventos emitidos pro renderer (via `network:connState`):
//   { state, reason?, attempt?, delayMs? }
//
// Disparadores de "lost":
//   • TCP: `sock.on('close')` ou `sock.on('error')` durante sessão estabelecida
//   • UDP/TCP: TIMEOUT_THRESHOLD comandos consecutivos sem resposta
//
// Backoff: 5s → 15s → 30s → 30s (loop).
let _connState = 'idle';
let _consecutiveTimeouts = 0;
const TIMEOUT_THRESHOLD = 3;
let _reconnectTimer = null;
let _reconnectAttempt = 0;
const RECONNECT_DELAYS_MS = [5000, 15000, 30000];   // demais tentativas = 30s
// Credenciais do último login bem-sucedido — usadas pra auto-reconnect.
let _lastConnOpts = null;
// Flag pra permitir _sendInternal durante reconexão (sendCommand público
// bloqueia comandos do usuário; o PSW interno do reconnect precisa passar).
let _userCommandsBlocked = false;

function _setConnState(s, extra) {
  if (_connState === s) return;
  _connState = s;
  _emit('network:connState', Object.assign({ state: s }, extra || {}));
}

function _markAlive() {
  _consecutiveTimeouts = 0;
  if (_connState !== 'alive') {
    _userCommandsBlocked = false;
    if (_reconnectTimer) { clearTimeout(_reconnectTimer); _reconnectTimer = null; }
    _reconnectAttempt = 0;
    _setConnState('alive');
  }
}

function _markLost(reason) {
  if (_connState === 'lost' || _connState === 'reconnecting') return;
  if (!_lastConnOpts) return;   // sem credenciais → não tem como reconectar (idle)
  _consecutiveTimeouts = 0;     // zera pra não acumular entre tentativas
  _userCommandsBlocked = true;
  _logError('connection-lost: ' + reason);
  _setConnState('lost', { reason: reason });
  _scheduleReconnect();
}

function _scheduleReconnect() {
  if (_reconnectTimer) clearTimeout(_reconnectTimer);
  if (!_lastConnOpts) return;
  const delay = RECONNECT_DELAYS_MS[Math.min(_reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
  _reconnectAttempt++;
  _emit('network:connState', {
    state: _connState, reason: 'scheduled',
    attempt: _reconnectAttempt, delayMs: delay
  });
  _reconnectTimer = setTimeout(_tryReconnect, delay);
}

async function _tryReconnect() {
  if (!_lastConnOpts) return;
  _setConnState('reconnecting', { attempt: _reconnectAttempt });
  _closeSocketOnly();
  // Guarda uma cópia local — authenticate*/Remote chamam _closeSocketOnly
  // mas não mexem em _lastConnOpts. Mesmo assim, fazer cópia local nos
  // protege contra qualquer mexida acidental futura.
  const opts = _lastConnOpts;
  let result;
  try {
    if (opts.transport === 'udp')      result = await authenticate(opts.ip, opts.password);
    else if (opts.transport === 'tcp') result = await authenticateRemote(opts);
    else                                result = { ok: false, error: 'unknown-transport' };
  } catch (err) { result = { ok: false, error: err && err.message }; }

  if (result && result.ok) {
    // _markAlive já é chamado dentro do authenticate em caso de sucesso.
    _emit('network:connState', { state: 'alive', reason: 'reconnected' });
    return;
  }
  // Falhou — restaura credenciais (authenticate pode ter falhado depois
  // de já ter setado _lastConnOpts; em falha de PSW, ele chama endSession
  // que zera. Restauramos pra próxima tentativa.) e agenda próxima.
  _lastConnOpts = opts;
  _userCommandsBlocked = true;
  _setConnState('lost', {
    reason: 'reconnect-failed',
    lastError: result && (result.error || result.errorCode)
  });
  _logError('reconnect attempt ' + _reconnectAttempt + ' falhou: ' +
            (result && (result.error || ('ERR ' + result.errorCode)) || 'desconhecido'));
  _scheduleReconnect();
}

function forceReconnect() {
  if (!_lastConnOpts) return { ok: false, error: 'no-credentials' };
  if (_reconnectTimer) { clearTimeout(_reconnectTimer); _reconnectTimer = null; }
  _reconnectAttempt = 0;
  _tryReconnect();
  return { ok: true };
}

function getConnState() { return { state: _connState, attempt: _reconnectAttempt }; }

// ============================================================
// Helpers internos
// ============================================================

function _emit(channel, payload) {
  const win = BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function _logSent(payload) {
  _emit('network:logEvent', { kind: 'sent', payload, ts: formatTimestamp() });
}
function _logReceived(payload, peer) {
  _emit('network:logEvent', { kind: 'received', payload, peer, ts: formatTimestamp() });
}
function _logError(error) {
  _emit('network:logEvent', { kind: 'error', error, ts: formatTimestamp() });
}

function _padSeq(n) { return String(n).padStart(3, '0'); }

// Casa frames ASCII do protocolo: [T001 ...], [R001 ...] ou [N001 ...].
// Tolerante: espaços extras, número com 3+ dígitos, body opcional.
function _parseFrame(text) {
  // T/R usam seq de 3-4 dígitos (sequencial do app); N usa contador
  // próprio da central (firmware emite [N14 ...], [N16 ...] etc. com
  // 2 dígitos pra eventos de CMD 13/15, ou 3+ dígitos pra outros).
  const m = /^\[([TRN])(\d{1,4})(?:\s+([\s\S]*?))?\s*\]$/.exec(text);
  if (!m) return null;
  return { kind: m[1], seq: parseInt(m[2], 10), body: (m[3] || '').trim() };
}

// Detecta erro: procura o token `ERR` em qualquer posição do body.
// Retorna `null` se não há erro; `{code: number|null}` se há (code pode
// ser null quando a central reporta ERR sem código numérico — ex.:
// `PSW ERR Tent=1 Tmr=0s` para senha inválida).
function _detectError(body) {
  if (!/\bERR\b/i.test(body)) return null;
  const m = /\bERR\s+(\d+)/i.exec(body);
  return { code: m ? parseInt(m[1], 10) : null };
}

// ============================================================
// Interfaces de rede locais (para popular o select do modal)
// ============================================================

function listInterfaces() {
  const ifaces = os.networkInterfaces();
  const result = [];
  for (const name of Object.keys(ifaces)) {
    for (const addr of ifaces[name]) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      try {
        const block = new Netmask(`${addr.address}/${addr.cidr.split('/')[1]}`);
        result.push({ name, address: addr.address, broadcast: block.broadcast });
      } catch (_) {
        // máscara inválida — ignora
      }
    }
  }
  return result;
}

// ============================================================
// Descoberta UDP (broadcast [T001 ID] + [T001 IDX] → respostas [R001 ...])
// ============================================================

function discover(broadcasts) {
  return new Promise((resolve) => {
    const client = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    const seen = new Set();
    let total = 0;
    let resolved = false;

    const finish = () => {
      if (resolved) return;
      resolved = true;
      try { client.close(); } catch (_) {}
      _emit('network:discoveryDone', { total });
      resolve({ ok: true, total });
    };

    client.on('message', (msg, rinfo) => {
      const ip = rinfo.address;
      const text = msg.toString();
      _logReceived(text, { ip, port: rinfo.port });

      if (text.slice(0, 5) !== '[R001') return;
      const generation = /\bIDX\b/i.test(text) || /SmartAlarm-M4/i.test(text) ? 'm4' : 'legacy';
      const seenKey = ip + ':' + generation;
      if (seen.has(seenKey)) return;
      seen.add(seenKey);
      total++;

      _emit('network:discoveryFound', {
        ip,
        raw: text,
        generation,
        name: text.slice(9).trim()
      });
    });

    client.on('error', (err) => {
      _logError(err.message);
      finish();
    });

    client.bind(0, () => {
      client.setBroadcast(true);

      const targets = (Array.isArray(broadcasts) && broadcasts.length)
        ? broadcasts
        : [];

      if (targets.length === 0) {
        finish();
        return;
      }

      for (let i = 0; i < DISCOVERY_ATTEMPTS; i++) {
        for (const bcast of targets) {
          for (const payload of DISCOVERY_PAYLOADS) {
            client.send(payload.buffer, CENTRAL_PORT, bcast, (err) => {
              if (err) _logError(err.message);
            });
            _logSent(`[T001 ${payload.body}] → ${bcast}:${CENTRAL_PORT}`);
          }
        }
      }

      setTimeout(finish, DISCOVERY_TIMEOUT);
    });
  });
}

// ============================================================
// Sessão autenticada (UDP unicast)
// ============================================================

/**
 * Autentica na central usando `[T<seq> PSW <password>]`.
 * Mantém o socket aberto após sucesso para envios subsequentes
 * e para receber eventos assíncronos `[N<N> ...]`.
 *
 * @param {string} ip — IP da central.
 * @param {string} password — senha de 4 dígitos.
 * @returns {Promise<{ok: boolean, errorCode?: number, raw?: string, error?: string}>}
 */
function authenticate(ip, password) {
  // Fecha socket prévio sem mexer em credenciais salvas (auto-reconnect
  // reusa _lastConnOpts; endSession completo é só pra Desconectar).
  _closeSocketOnly();

  return new Promise((resolve) => {
    const sock = dgram.createSocket('udp4');
    const sess = {
      transport: 'udp',
      socket: sock,
      ip,
      port: CENTRAL_PORT,
      seq: 1,
      pending: new Map(),
      password,        // guardada para re-auth automático em ERR 7
      reauthing: false
    };

    sock.on('message', (msg, rinfo) => {
      const text = msg.toString();
      _logReceived(text, { ip: rinfo.address, port: rinfo.port });

      const f = _parseFrame(text);
      if (!f) return;

      if (f.kind === 'R') {
        _markAlive();   // qualquer resposta válida = sessão saudável
        const p = sess.pending.get(f.seq);
        if (p) {
          clearTimeout(p.timer);
          sess.pending.delete(f.seq);
          p.resolve({ raw: text, body: f.body, error: _detectError(f.body) });
        }
        // Resposta sem request casado: ignora silenciosamente (já foi logada).
      } else if (f.kind === 'N') {
        _markAlive();
        _emit('network:asyncEvent', { seq: f.seq, body: f.body, raw: text });
      }
      // [T...] não deveria chegar do lado da central; ignora.
    });

    sock.on('error', (err) => {
      _logError(err.message);
      // UDP normalmente não emite 'error' por queda — só por bind/ICMP.
      // Mesmo assim, se acontecer durante sessão ativa, marca lost.
      if (session === sess) _markLost('udp-error: ' + err.message);
    });

    sock.bind(0, () => {
      session = sess;
      _sendInternal(`PSW ${password}`)
        .then((resp) => {
          if (resp.error) {
            // PSW rejeitado pela central. Fecha só socket — não zera
            // credenciais salvas (auto-reconnect pode tentar de novo
            // depois que o usuário corrigir a senha ou central voltar).
            _closeSocketOnly();
            resolve({
              ok: false,
              errorCode: resp.error.code,   // pode ser null
              raw: resp.raw,
              body: resp.body
            });
          } else {
            _lastConnOpts = { transport: 'udp', ip, password };
            _markAlive();
            resolve({ ok: true, raw: resp.raw, body: resp.body });
          }
        })
        .catch((err) => {
          _closeSocketOnly();
          resolve({ ok: false, error: err && err.message ? err.message : String(err) });
        });
    });
  });
}

// Envia `[T<seq> <body>]` na sessão atual; resolve com a resposta correlacionada.
// Funciona tanto para sessão UDP local quanto TCP remota (envelopa em
// frame 0xAC quando o transport é 'tcp').
function _sendInternal(commandBody) {
  return new Promise((resolve, reject) => {
    if (!session) {
      reject(new Error('no-session'));
      return;
    }
    const seq = session.seq++;
    const seqStr = _padSeq(seq);
    const frame = `[T${seqStr} ${commandBody}]`;
    const ascii = Buffer.from(frame, 'utf8');

    const timer = setTimeout(() => {
      if (session) session.pending.delete(seq);
      // Conta timeouts consecutivos pra detectar queda silenciosa.
      // Quando atinge TIMEOUT_THRESHOLD, dispara _markLost.
      _consecutiveTimeouts++;
      if (_consecutiveTimeouts >= TIMEOUT_THRESHOLD && _lastConnOpts) {
        _markLost('timeout x' + _consecutiveTimeouts);
      }
      reject(new Error('timeout'));
    }, COMMAND_TIMEOUT);

    session.pending.set(seq, { resolve, reject, timer });

    const onSent = (err) => {
      if (err) {
        clearTimeout(timer);
        if (session) session.pending.delete(seq);
        _logError(err.message);
        reject(err);
        return;
      }
      const peer = session.transport === 'tcp'
        ? `${session.host}:${session.port}`
        : `${session.ip}:${session.port}`;
      _logSent(`${frame} → ${peer}`);
    };

    if (session.transport === 'tcp') {
      const tcpFrame = protocol.buildFrame(protocol.FR.ASCII_CMD, ascii);
      session.socket.write(tcpFrame, onSent);
      _kaSchedule();   // reset keep-alive — qualquer comando conta como atividade
    } else {
      session.socket.send(ascii, session.port, session.ip, onSent);
    }
  });
}

/**
 * Envia comando arbitrário na sessão ativa. Ex.: sendCommand('INFO'),
 * sendCommand('STAT 5'). Retorna `{ok, raw, body, errorCode?}`.
 *
 * Se a central responder ERR 7 (senha inválida — sessão expirou), re-envia
 * automaticamente o PSW guardado em session.password e refaz o comando
 * original, transparente para o chamador. O usuário só vê o ERR 7 final
 * se a re-autenticação também falhar.
 */
async function sendCommand(commandBody) {
  // Bloqueia comandos do usuário enquanto reconectando. Toast amarelo no
  // renderer reage ao { ok:false, error:'connection-lost' }. Não bloqueia
  // o _sendInternal interno do auto-reconnect — ele usa caminho separado
  // via authenticate*/Remote.
  if (_userCommandsBlocked) {
    return { ok: false, error: 'connection-lost', state: _connState };
  }
  if (!session) return { ok: false, error: 'no-session' };
  try {
    let resp = await _sendInternal(commandBody);

    // ERR 7 → senha expirou. Tenta re-auth e refaz o comando, exceto se
    // o próprio comando já é um PSW (evita loop infinito).
    const isPsw = /^PSW\b/i.test(commandBody);
    if (resp.error && resp.error.code === 7 && !isPsw && !session.reauthing && session.password) {
      session.reauthing = true;
      try {
        const auth = await _sendInternal(`PSW ${session.password}`);
        if (auth.error) {
          // Re-auth falhou — propaga o ERR 7 original.
          return { ok: false, errorCode: 7, raw: resp.raw, body: resp.body, reauthFailed: true };
        }
        resp = await _sendInternal(commandBody);
      } finally {
        session.reauthing = false;
      }
    }

    if (resp.error) {
      return { ok: false, errorCode: resp.error.code, raw: resp.raw, body: resp.body };
    }
    return { ok: true, raw: resp.raw, body: resp.body };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

// Fecha SÓ o socket atual (limpa pendings + keepalive). Não mexe em
// credenciais nem em estado da conexão. Usado pelo auto-reconnect e
// no início de authenticate/Remote pra zerar uma sessão prévia sem
// destruir as credenciais que vamos reusar.
function _closeSocketOnly() {
  if (!session) return;
  _kaCancel();
  for (const [, p] of session.pending) {
    clearTimeout(p.timer);
    if (typeof p.reject === 'function') p.reject(new Error('session-closed'));
  }
  session.pending.clear();
  try {
    if (session.transport === 'tcp') session.socket.destroy();
    else                              session.socket.close();
  } catch (_) {}
  session = null;
}

function endSession() {
  // Encerramento explícito (usuário clica Desconectar) — limpa
  // credenciais pra impedir auto-reconnect e zera timer/estado.
  _lastConnOpts = null;
  _userCommandsBlocked = false;
  if (_reconnectTimer) { clearTimeout(_reconnectTimer); _reconnectTimer = null; }
  _reconnectAttempt = 0;
  _setConnState('idle');
  _closeSocketOnly();
  return { ok: true };
}

// ============================================================
// Sessão remota (TCP via servidor de monitoramento)
// ============================================================

// Keep-alive TCP 0xAB (§5.2): enviado a cada 45s de inatividade.
// Qualquer envio (sendCommand etc.) reseta o timer; endSession limpa.
function _kaCancel() {
  if (session && session.kaTimer) {
    clearTimeout(session.kaTimer);
    session.kaTimer = null;
  }
}
function _kaSchedule() {
  if (!session || session.transport !== 'tcp') return;
  _kaCancel();
  session.kaTimer = setTimeout(() => {
    if (!session || session.transport !== 'tcp') return;
    try {
      const ka = protocol.buildFrame(protocol.FR.KEEPALIVE, Buffer.alloc(0));
      session.socket.write(ka, (err) => {
        if (err) _logError('keep-alive write failed: ' + err.message);
        else    _logSent(`KEEPALIVE 0xAB → ${session.host}:${session.port}`);
      });
    } catch (e) {
      _logError('keep-alive exception: ' + (e && e.message));
    }
    _kaSchedule();
  }, REMOTE_KA_INTERVAL);
}

function _macToBytes(mac) {
  // "D8-80-39-AC-D9-03" / "D8:80:..." / "D88039ACD903" → 6 bytes
  const m = String(mac || '').match(/[0-9A-Fa-f]{2}/g);
  if (!m || m.length !== 6) return null;
  return Buffer.from(m.map(s => parseInt(s, 16)));
}

/**
 * Conecta TCP no servidor de monitoramento e autentica como VettiConfig.
 *
 * Fluxo (§5.1, §5.3, §7.1.1):
 *   1. socket.connect(host, port)
 *   2. envia frame 0xAA com MAC + HASH-256(MAC_HEX + CONTA) → servidor valida
 *   3. envia frame 0xAC com `[T001 PSW <senha>]` → central autentica
 *   4. mantém socket aberto; comandos seguintes via _sendInternal envelopam em 0xAC
 *
 * @param {object} opts
 * @param {string} opts.mac      — MAC da central (qualquer formato hex; ex.: "D8-80-39-AC-D9-03").
 * @param {string} opts.conta    — número da conta no software de monitoramento.
 * @param {string} opts.host     — URL/IP do servidor de monitoramento.
 * @param {number|string} opts.port — porta (default 9018).
 * @param {string} opts.password — senha de 4 dígitos da central.
 */
function authenticateRemote(opts) {
  _closeSocketOnly();

  const { mac, conta, host, password } = opts || {};
  const port = Number(opts && opts.port) || 9018;

  return new Promise((resolve) => {
    const macBytes = _macToBytes(mac);
    if (!macBytes) { resolve({ ok: false, error: 'invalid-mac' }); return; }

    const sock = new net.Socket();
    const sess = {
      transport: 'tcp',
      socket: sock,
      host,
      port,
      mac,
      conta,
      password,
      seq: 1,
      pending: new Map(),
      reauthing: false,
      _loginResolve: null
    };

    const decoder = protocol.createStreamDecoder((frame) => {
      if (frame.fr === protocol.FR.LOGIN) {
        const status = frame.payload[0];
        const statusName = LOGIN_STATUS[status] || 'unknown';
        _logReceived(
          `LOGIN response status=0x${status.toString(16).toUpperCase()} (${statusName})`,
          { ip: host, port }
        );
        if (sess._loginResolve) {
          sess._loginResolve(status === 0x80 ? { ok: true } : { ok: false, status, statusName });
          sess._loginResolve = null;
        }
      } else if (frame.fr === protocol.FR.ASCII_CMD) {
        // payload = Status (1 byte) + ASCII
        const ascii = frame.payload.slice(1).toString('utf8');
        _logReceived(ascii, { ip: host, port });
        const f = _parseFrame(ascii);
        if (!f) return;
        if (f.kind === 'R') {
          _markAlive();
          const p = sess.pending.get(f.seq);
          if (p) {
            clearTimeout(p.timer);
            sess.pending.delete(f.seq);
            p.resolve({ raw: ascii, body: f.body, error: _detectError(f.body) });
          }
        } else if (f.kind === 'N') {
          _markAlive();
          _emit('network:asyncEvent', { seq: f.seq, body: f.body, raw: ascii });
        }
      }
      // Frame 0xAB (keep-alive response) é ignorado silenciosamente.
    }, () => _logError('CRC inválido em frame TCP — descartado'));

    sock.on('data', (chunk) => decoder.push(chunk));
    sock.on('error', (err) => {
      _logError(err.message);
      if (sess._loginResolve) {
        sess._loginResolve({ ok: false, error: err.message });
        sess._loginResolve = null;
      }
      // Se sessão já estava estabelecida (não é erro de login), dispara
      // detecção de queda — o servidor de monitoramento pode derrubar
      // por idle, ou a rede caiu.
      if (session === sess && !sess._loginResolve) {
        _markLost('tcp-error: ' + err.message);
      }
    });
    sock.on('close', () => {
      const wasActive = (session === sess);
      if (wasActive) session = null;
      // Detecção rápida de perda em sessão TCP. Só dispara se a sessão
      // estava ATIVA (não estamos em endSession explícito do usuário).
      if (wasActive && _lastConnOpts) _markLost('tcp-close');
    });

    const loginTimeout = setTimeout(() => {
      if (sess._loginResolve) {
        sess._loginResolve({ ok: false, error: 'timeout' });
        sess._loginResolve = null;
      }
    }, REMOTE_LOGIN_TIMEOUT);

    sock.connect(port, host, async () => {
      session = sess;

      // 1. Frame de login 0xAA: MAC (6 bytes) + HASH-256(MAC bytes + CONTA bytes, 32 bytes)
      //
      // A receptora trata `mac+conta` como hex e decodifica para bytes antes do
      // SHA-256 (8 bytes para conta de 4 chars hex). Portanto hasheamos sobre
      // os bytes binários e NÃO sobre a string ASCII.
      const macHex      = Buffer.from(macBytes).toString('hex');
      const contaHex    = String(conta || '').replace(/[^0-9A-Fa-f]/g, '');
      const contaBytes  = (contaHex.length && contaHex.length % 2 === 0)
        ? Buffer.from(contaHex, 'hex')
        : Buffer.from(contaHex, 'utf8');   // fallback se vier não-hex
      const hashInput   = Buffer.concat([macBytes, contaBytes]);
      const hashBytes   = crypto.createHash('sha256').update(hashInput).digest();
      const loginFrame  = protocol.buildFrame(
        protocol.FR.LOGIN,
        Buffer.concat([macBytes, hashBytes])
      );

      const loginResult = await new Promise((res) => {
        sess._loginResolve = res;
        sock.write(loginFrame);
        _logSent(
          `LOGIN 0xAA mac=${macHex} conta=${contaHex} ` +
          `hashInput(bytes)=${hashInput.toString('hex')} ` +
          `hash=${hashBytes.toString('hex')} ` +
          `frame=${loginFrame.toString('hex')} ` +
          `→ ${host}:${port}`
        );
      });
      clearTimeout(loginTimeout);

      if (!loginResult.ok) {
        _closeSocketOnly();
        resolve({
          ok: false,
          error: loginResult.error || 'login-failed',
          status: loginResult.status,
          statusName: loginResult.statusName
        });
        return;
      }

      // Login OK no servidor — inicia keep-alive periódico.
      _kaSchedule();

      // 2. PSW da central via frame 0xAC (passa pelo servidor)
      try {
        const pswResp = await _sendInternal(`PSW ${password}`);
        if (pswResp.error) {
          _closeSocketOnly();
          resolve({
            ok: false,
            errorCode: pswResp.error.code,
            raw: pswResp.raw,
            body: pswResp.body
          });
        } else {
          _lastConnOpts = { transport: 'tcp', host, port, mac, conta, password };
          _markAlive();
          resolve({ ok: true, raw: pswResp.raw, body: pswResp.body });
        }
      } catch (err) {
        _closeSocketOnly();
        resolve({ ok: false, error: err.message || String(err) });
      }
    });
  });
}

/**
 * Lê o RTC da central. `CMD 7` (sem args) retorna `CMD 7 "YYYY/MM/DD HH:MM:SS"`.
 * Resolve `{ok, datetime: 'YYYY/MM/DD HH:MM:SS', raw}` ou `{ok:false, ...}`.
 */
async function getClock() {
  const resp = await sendCommand('CMD 7');
  if (!resp.ok) return resp;
  const m = /CMD\s*7\s*"([0-9/ :\-]+)"/i.exec(resp.body || '');
  return { ok: true, raw: resp.raw, datetime: m ? m[1] : null };
}

/**
 * Grava o RTC da central. `dt` pode ser Date ou string `"YYYY/MM/DD HH:MM:SS"`.
 */
async function setClock(dt) {
  let s;
  if (dt instanceof Date) {
    const p = (n) => String(n).padStart(2, '0');
    s = `${dt.getFullYear()}/${p(dt.getMonth() + 1)}/${p(dt.getDate())} ` +
        `${p(dt.getHours())}:${p(dt.getMinutes())}:${p(dt.getSeconds())}`;
  } else {
    s = String(dt || '').trim();
  }
  return sendCommand(`CMD 7 "${s}"`);
}

module.exports = {
  listInterfaces,
  discover,
  authenticate,
  authenticateRemote,
  sendCommand,
  endSession,
  getClock,
  setClock,
  getConnState,
  forceReconnect
};
