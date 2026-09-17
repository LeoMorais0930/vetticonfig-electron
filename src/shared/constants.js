/**
 * Constantes compartilhadas entre main e renderer.
 * Cores extraídas do Figma (mantidas em sincronia com vetticonfig.css).
 */

const COLORS = {
  SENSOR_BG:    '#EEF0F3',
  ABSENT_BG:    '#DBB1B2',
  TOGGLE_GREEN: '#34C759',
  HEADER_DARK:  '#003A63'
};

const SCREENS = {
  STATUS:         'screens/status.html',
  CONEXAO_LOCAL:  'screens/conexao-local.html',
  CONEXAO_REMOTA: 'screens/conexao-remota.html',
  REDE:           'screens/rede.html',
  DISPOSITIVO:    'screens/dispositivo.html',
  ALARME:         'screens/alarme.html',
  SUPERVISAO:     'screens/supervisao.html',
  CONTACT_ID:     'screens/contact-id.html',
  USUARIO:        'screens/usuario.html',
  AGENDAMENTO:    'screens/agendamento.html'
};

module.exports = { COLORS, SCREENS };
