/**
 * Utilitários de data/hora do main process.
 * Formato fixo: DD/MM/AAAA HH:MM:SS — usado em logs do logger UDP.
 */

function formatTimestamp() {
  const now = new Date();
  const day   = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year  = now.getFullYear();
  const time  = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  return `${day}/${month}/${year} ${time}`;
}

module.exports = { formatTimestamp };
