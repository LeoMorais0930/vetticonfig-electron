/**
 * Protocolo binário VSec (frames com STX/NB/FR/...payload/CRC).
 *
 * Usado pela conexão remota: o VettiConfig fala TCP com o servidor de
 * monitoramento (porta 9018) trocando frames binários:
 *
 *   STX (0x02)           1 byte
 *   NB                   1 byte — total de bytes da mensagem (excluindo STX)
 *   FR                   1 byte — tipo do frame (0xAA login, 0xAB keep-alive,
 *                                                  0xAC comando ASCII)
 *   payload              N bytes
 *   CRC                  1 byte — CRC-8/ITU (poly 0x07, init 0x00) de
 *                                  NB até o último byte antes do CRC.
 *
 * Validado com os exemplos do PDF VettiConfig Rev 2 (§5.1, §5.2, §5.3).
 */

const STX = 0x02;

const FR = {
  LOGIN:        0xAA, // §5.1 — solicitação de acesso remoto
  KEEPALIVE:    0xAB, // §5.2
  ASCII_CMD:    0xAC  // §5.3 — comandos VettiConfig encapsulados (ASCII)
};

// CRC-8/ITU: poly 0x07, init 0x00, sem reflexões, sem XOR final.
function crc8(bytes) {
  let c = 0;
  for (const b of bytes) {
    c ^= b;
    for (let i = 0; i < 8; i++) {
      c = (c & 0x80) ? ((c << 1) ^ 0x07) & 0xFF : (c << 1) & 0xFF;
    }
  }
  return c;
}

// Monta `STX NB FR <payload> CRC`. `payload` é Buffer.
//
// Convenção do NB no protocolo Vetti:
//   NB = total - 1 (= payload.length + 3, contando NB+FR+payload+CRC).
//
// Observado em log real do software legado em produção: login 0xAA com
// payload de 38 bytes usa NB=0x29, não 0x2A. O CRC também depende desse NB.
function _nbFor(fr, payloadLen) {
  return payloadLen + 3;
}

function buildFrame(fr, payload) {
  const pl  = payload || Buffer.alloc(0);
  const nb  = _nbFor(fr, pl.length);
  const buf = Buffer.alloc(1 + 1 + 1 + pl.length + 1);
  buf[0]    = STX;
  buf[1]    = nb;
  buf[2]    = fr;
  pl.copy(buf, 3);
  // CRC calculado sobre NB + FR + payload (tudo entre STX e CRC).
  const crcBytes = Buffer.alloc(1 + 1 + pl.length);
  crcBytes[0] = nb;
  crcBytes[1] = fr;
  pl.copy(crcBytes, 2);
  buf[buf.length - 1] = crc8(crcBytes);
  return buf;
}

/**
 * Tenta extrair UM frame completo a partir do offset 0 do buffer.
 * Retorna `{ fr, payload, frameLen }` se conseguiu (frame consumido tem
 * `frameLen` bytes a partir do início), ou `null` se faltam bytes.
 *
 * Ignora bytes inválidos antes do STX (ressincroniza).
 */
function tryParseFrame(buf) {
  if (!buf || buf.length === 0) return null;

  // Procura STX se o primeiro byte não for.
  let i = 0;
  while (i < buf.length && buf[i] !== STX) i++;
  if (i >= buf.length) return { skip: buf.length };  // joga buffer inteiro fora
  if (i > 0) return { skip: i };                      // pede pra descartar bytes antes do STX

  if (buf.length < 4) return null;                    // STX + NB + FR + CRC mínimo

  const nb = buf[1];
  const fr = buf[2];
  // Respostas do servidor seguem sempre NB = total - 1, então frameLen = nb + 1.
  // (O caso especial do request 0xAA — onde NB = total — afeta só o builder.)
  const frameLen = nb + 1;
  if (buf.length < frameLen) return null;             // ainda não chegou tudo

  const payload = buf.slice(3, frameLen - 1);
  const crcRecv = buf[frameLen - 1];
  const crcCalc = crc8(buf.slice(1, frameLen - 1));   // NB até final-1
  if (crcRecv !== crcCalc) {
    // CRC inválido — joga o STX fora e tenta ressincronizar a partir do próximo byte.
    return { skip: 1, badCrc: true };
  }
  return { fr, payload, frameLen };
}

/**
 * Cria um decoder de stream: passe chunks com `.push(buf)` e ele invoca
 * `onFrame({fr, payload})` para cada frame válido extraído.
 */
function createStreamDecoder(onFrame, onBadCrc) {
  let buf = Buffer.alloc(0);
  return {
    push(chunk) {
      buf = buf.length === 0 ? Buffer.from(chunk) : Buffer.concat([buf, chunk]);
      // Loop extraindo frames até esvaziar ou faltar bytes.
      // Hard cap para não vazar memória se a contraparte mandar lixo.
      let safety = 1024;
      while (safety-- > 0) {
        const r = tryParseFrame(buf);
        if (r === null) return;                       // precisa de mais bytes
        if (r.skip) {
          if (r.badCrc && typeof onBadCrc === 'function') onBadCrc();
          buf = buf.slice(r.skip);
          continue;
        }
        onFrame({ fr: r.fr, payload: r.payload });
        buf = buf.slice(r.frameLen);
      }
    }
  };
}

module.exports = {
  STX,
  FR,
  crc8,
  buildFrame,
  tryParseFrame,
  createStreamDecoder
};
