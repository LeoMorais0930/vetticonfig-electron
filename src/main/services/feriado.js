/**
 * FERIADO SERVICE — CRUD remoto do banco de feriados da central.
 *
 * A central tem até 64 slots (idx 1..64). Cada registro: mês, dia,
 * descrição (≤40 chars, sem acentos). Não há campo de ano — feriado se
 * repete anualmente. Espelha `CtrlFeriadoList.kt`.
 *
 * Comandos protocolo (PDF Rev 2 + CtrlFeriadoList.kt:184, 200, 212):
 *   FERIADO <idx>                    → lê. Resposta com Stat:OK/LIV/DEL/INV
 *   FERIADO <idx> Stat:OK Mes:M Dia:D Desc:"..."  → cria/edita
 *   FERIADO <idx> Stat:DEL           → exclui (libera slot)
 *
 * Este service NÃO acessa central diretamente — repassa pro
 * networkService.sendCommand. A varredura completa (`readAll`) é feita
 * no renderer (que conhece o pipeline de toasts/progresso).
 */

const FERIADO_MAX = 64;
const DESC_MAX = 40;

/* deAccent: NFD + remove combinantes (espelha Func.kt:144-150 e a
   regra que aplicamos em Usuários). */
function _deAccent(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/* Parser da resposta da central: extrai { idx, stat, month, day, desc }. */
function parseFeriadoResponse(body) {
  const s = String(body || '').replace(/^FERIADO\s+/i, '');
  const idxM = /^(\d+)\b/.exec(s);
  if (!idxM) return null;
  function field(re) { const m = re.exec(s); return m ? m[1] : null; }
  const statRaw = field(/\bStat:([A-Za-z]+)/i);
  const stat    = statRaw ? statRaw.toUpperCase() : null;
  const mes     = field(/\bMes:(\d+)/i);
  const dia     = field(/\bDia:(\d+)/i);
  const desc    = field(/\bDesc:"([^"]*)"/);
  return {
    idx:   parseInt(idxM[1], 10),
    stat:  stat,
    month: mes ? parseInt(mes, 10) : null,
    day:   dia ? parseInt(dia, 10) : null,
    desc:  desc || null
  };
}

function buildWriteCommand(idx, month, day, desc) {
  const safeIdx = Math.max(1, Math.min(FERIADO_MAX, parseInt(idx, 10) || 0));
  const m = parseInt(month, 10) || 0;
  const d = parseInt(day, 10) || 0;
  if (m < 1 || m > 12) throw new Error('Mês inválido (1..12): ' + month);
  if (d < 1 || d > 31) throw new Error('Dia inválido (1..31): ' + day);
  const descClean = _deAccent(desc).slice(0, DESC_MAX);
  return 'FERIADO ' + safeIdx +
         ' Stat:OK Mes:' + m + ' Dia:' + d +
         ' Desc:"' + descClean.replace(/"/g, '\\"') + '"';
}

function buildDeleteCommand(idx) {
  const safeIdx = Math.max(1, Math.min(FERIADO_MAX, parseInt(idx, 10) || 0));
  return 'FERIADO ' + safeIdx + ' Stat:DEL';
}

module.exports = {
  FERIADO_MAX,
  DESC_MAX,
  parseFeriadoResponse,
  buildWriteCommand,
  buildDeleteCommand,
  _deAccent
};
