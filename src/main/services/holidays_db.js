/**
 * HOLIDAYS DB SERVICE — carrega JSONs de feriados nacionais empacotados
 * no app + resolve feriados móveis pro ano corrente.
 *
 * Fonte de verdade dos defaults: `src/main/data/holidays/<XX>.json`.
 * Customizações do usuário (fase 2) virão de storage IPC por usuário.
 *
 * Algoritmo de Páscoa: Meeus/Jones/Butcher (válido pra qualquer ano
 * gregoriano), usado pra derivar Carnaval, Sexta Santa, Corpus Christi
 * etc. Ver `_easter(year)` abaixo.
 *
 * Móveis suportados:
 *   • "easter+N" / "easter-N" — offset em dias da Páscoa
 *   • "us-thanksgiving"        — 4ª quinta-feira de novembro
 *   • "mx-constitution"        — 1ª segunda-feira de fevereiro
 *   • "mx-juarez"              — 3ª segunda-feira de março
 *   • "mx-revolution"          — 3ª segunda-feira de novembro
 */

const fs      = require('fs');
const path    = require('path');
const storage = require('./storage');
const { app, net } = require('electron');

const DATA_DIR = path.join(__dirname, '..', 'data', 'holidays');
// Países importados pelo usuário via Nager.Date ficam aqui (fora do bundle).
function _userCountriesDir() {
  const d = path.join(app.getPath('userData'), 'holidays-user');
  try { fs.mkdirSync(d, { recursive: true }); } catch (_) {}
  return d;
}

function _listFiles() {
  try { return fs.readdirSync(DATA_DIR).filter((n) => /^[A-Z]{2}\.json$/.test(n)); }
  catch (_) { return []; }
}

function _listUserFiles() {
  try { return fs.readdirSync(_userCountriesDir()).filter((n) => /^[A-Z]{2}\.json$/.test(n)); }
  catch (_) { return []; }
}

function listCountries() {
  // Combina países empacotados (DATA_DIR) + importados pelo usuário
  // (userData/holidays-user). Em caso de colisão, o user-imported
  // sobrescreve (usuário acabou de importar uma versão mais nova).
  const map = {};
  _listFiles().forEach((n) => {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(DATA_DIR, n), 'utf-8'));
      map[d.country] = { code: d.country, countryName: d.countryName || {}, source: 'bundle' };
    } catch (_) {}
  });
  _listUserFiles().forEach((n) => {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(_userCountriesDir(), n), 'utf-8'));
      map[d.country] = { code: d.country, countryName: d.countryName || {}, source: 'user' };
    } catch (_) {}
  });
  return Object.values(map);
}

function loadCountry(code) {
  const safe = String(code || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(safe)) throw new Error('Código de país inválido: ' + code);
  // user-imported tem precedência (caso o usuário tenha importado uma
  // versão mais nova de um país já bundled).
  const userPath   = path.join(_userCountriesDir(), safe + '.json');
  const bundlePath = path.join(DATA_DIR, safe + '.json');
  const file = fs.existsSync(userPath) ? userPath : bundlePath;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

/* ─── Customização local (overlay por usuário) ──────────────────────
   Permite desativar defaults sem editar o JSON empacotado, e adicionar
   feriados locais (estaduais / municipais) por país. Persiste no
   config.json sob a chave `holidays.user.<COUNTRY>`. */

function getUserOverlay(code) {
  const safe = String(code || '').toUpperCase();
  const v = storage.get('holidays.user.' + safe);
  return (v && typeof v === 'object') ? v : { deletedIds: [], custom: [] };
}

function setUserOverlay(code, overlay) {
  const safe = String(code || '').toUpperCase();
  const out = {
    deletedIds: Array.isArray(overlay && overlay.deletedIds)
                  ? overlay.deletedIds.filter((s) => typeof s === 'string')
                  : [],
    custom:     Array.isArray(overlay && overlay.custom)
                  ? overlay.custom.filter((c) => c && c.id)
                  : []
  };
  storage.set('holidays.user.' + safe, out);
  return { ok: true };
}

/* Lista mesclada (defaults + customs), com flag _default e _active.
   _active=false significa que o usuário desativou o default. Customs
   sempre _active=true (pra ocultar, basta excluir).  */
function listMergedHolidays(code) {
  const data = loadCountry(code);
  const overlay = getUserOverlay(code);
  const deletedSet = new Set(overlay.deletedIds);
  const out = [];
  (data.holidays || []).forEach((h) => {
    out.push(Object.assign({}, h, {
      _default: true,
      _active:  !deletedSet.has(h.id),
      type:     h.type || 'national',
      scope:    h.scope || ''
    }));
  });
  overlay.custom.forEach((c) => {
    out.push(Object.assign({}, c, {
      _default: false,
      _active:  true,
      type:     c.type  || 'state',
      scope:    c.scope || ''
    }));
  });
  return out;
}

/* ─── Cálculo de Páscoa (Meeus/Jones/Butcher, calendário gregoriano) ── */
function _easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const L = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * L) / 451);
  const month = Math.floor((h + L - 7 * m + 114) / 31);  // 3 ou 4
  const day   = ((h + L - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function _addDays(date, n) {
  return new Date(date.getTime() + n * 86400000);
}

/**
 * Calcula a data efetiva (year/month/day) de um feriado pra um dado ano.
 * `holiday` é o objeto do JSON. Retorna { year, month, day } ou null se
 * a regra não for reconhecida.
 */
function resolveHolidayDate(holiday, year) {
  if (holiday.month && holiday.day) {
    return { year: year, month: holiday.month, day: holiday.day };
  }
  if (!holiday.mobile) return null;

  // Easter±N
  const mEasterOff = /^easter([+-]\d+)$/.exec(holiday.mobile);
  if (holiday.mobile === 'easter' || mEasterOff) {
    const offset = mEasterOff ? parseInt(mEasterOff[1], 10) : 0;
    const date = _addDays(_easter(year), offset);
    return {
      year:  date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day:   date.getUTCDate()
    };
  }

  // 4ª quinta-feira de novembro (EUA — Thanksgiving)
  if (holiday.mobile === 'us-thanksgiving') {
    return _nthWeekdayOfMonth(year, 11, 4, 4); // 4=Thu (0=Sun..6=Sat)
  }
  // 1ª segunda-feira de fevereiro (MX — Constitución)
  if (holiday.mobile === 'mx-constitution') {
    return _nthWeekdayOfMonth(year, 2, 1, 1);
  }
  // 3ª segunda-feira de março (MX — Juárez)
  if (holiday.mobile === 'mx-juarez') {
    return _nthWeekdayOfMonth(year, 3, 1, 3);
  }
  // 3ª segunda-feira de novembro (MX — Revolución)
  if (holiday.mobile === 'mx-revolution') {
    return _nthWeekdayOfMonth(year, 11, 1, 3);
  }
  return null;
}

function _nthWeekdayOfMonth(year, monthOneBased, weekdayZeroBased, nth) {
  // weekdayZeroBased: 0=Dom, 1=Seg, ..., 6=Sab. nth: 1..5.
  const first = new Date(Date.UTC(year, monthOneBased - 1, 1));
  const firstWd = first.getUTCDay();
  let offset = (weekdayZeroBased - firstWd + 7) % 7;
  offset += (nth - 1) * 7;
  const date = new Date(Date.UTC(year, monthOneBased - 1, 1 + offset));
  return {
    year:  date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day:   date.getUTCDate()
  };
}

/**
 * Devolve TODOS os feriados do país resolvidos pro ano dado, no formato
 * pronto pra gravar na central (sem ano, só mes/dia/desc).
 */
function resolveCountryHolidays(code, year, lang) {
  // Aplica o overlay do usuário: oculta defaults desativados, inclui customs.
  lang = lang || 'pt-BR';
  const merged = listMergedHolidays(code).filter((h) => h._active);
  const out = [];
  merged.forEach((h) => {
    const r = resolveHolidayDate(h, year);
    if (!r) return;
    const name = (h.name && (h.name[lang] || h.name['pt-BR'] || h.name['en'])) || h.id || '';
    out.push({
      id:     h.id,
      name:   name,
      month:  r.month,
      day:    r.day,
      mobile: h.mobile || null,
      type:   h.type   || 'national',
      scope:  h.scope  || '',
      _default: !!h._default
    });
  });
  const data = loadCountry(code);
  return { country: data.country, countryName: data.countryName, year: year, items: out };
}

/* ─── Importação via Nager.Date (Fase 2B) ───────────────────────────
   O renderer faz o fetch (browser, sem `node-fetch`) e manda o JSON
   bruto pra este service converter pro schema vetticonfig-holidays-1
   + salvar em userData. */

function importCountryFromNager(code, nagerResponse, opts) {
  opts = opts || {};
  const safe = String(code || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(safe)) throw new Error('Código de país inválido: ' + code);
  if (!Array.isArray(nagerResponse)) throw new Error('Resposta da Nager.Date inválida (esperava array).');

  // Nager.Date v3 item shape (uma das duas variações encontradas):
  //   { date, localName, name, countryCode, fixed, global, type, counties, ... }
  //   { date, localName, name, countryCode, fixed, global, types: ["Public"], ... }
  //
  // **Atenção**: o campo `fixed` da v3 é pouco confiável — muitos
  // feriados que repetem na mesma data todo ano vêm com `fixed: false`.
  // Pra evitar perder feriados como Australia Day (26/01), Anzac Day (25/04),
  // etc., NÃO filtramos por `fixed`. Filtramos só pelo tipo Public (alguns
  // países retornam tipos extras como Bank/Optional que não interessam).
  //
  // Trade-off: feriados móveis (Páscoa, Carnaval, etc.) vêm com a data
  // do ano consultado e ficam "congelados" naquele dia. O usuário pode
  // re-importar todo ano OU editar manualmente via "Gerenciar" adicionando
  // a regra `mobile`.
  function isPublic(it) {
    if (Array.isArray(it.types)) return it.types.indexOf('Public') >= 0;
    if (typeof it.type === 'string') return it.type === 'Public';
    return true;   // shape desconhecido — aceita
  }

  const holidays = [];
  const usedIds = {};
  nagerResponse.forEach((it) => {
    if (!it || !it.date) return;
    if (!isPublic(it)) return;
    const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(String(it.date));
    if (!m) return;
    const month = parseInt(m[1], 10);
    const day   = parseInt(m[2], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) return;

    let id = (safe + '-' + (it.name || '').toLowerCase()
                .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).slice(0, 60);
    if (!id || id === safe + '-') id = safe + '-holiday';
    // Dedup por id (alguns países têm múltiplas entradas com mesmo nome
    // mas counties distintos — pegamos a primeira "global").
    if (usedIds[id]) return;
    usedIds[id] = true;

    const nameLocal = it.localName || it.name || '';
    const nameEn    = it.name      || '';
    holidays.push({
      id:     id,
      name:   { 'pt-BR': nameLocal, 'en': nameEn, 'es-LA': nameLocal },
      month:  month,
      day:    day,
      // Flag informativa — quando re-importar no próximo ano, podemos
      // reconhecer e atualizar.
      importedDate: it.date
    });
  });

  const data = {
    schema:      'vetticonfig-holidays-1',
    country:     safe,
    countryName: opts.countryName || { 'pt-BR': safe, 'en': safe, 'es-LA': safe },
    importedAt:  new Date().toISOString(),
    importedFrom:'nager.date',
    holidays:    holidays
  };
  fs.writeFileSync(path.join(_userCountriesDir(), safe + '.json'),
                   JSON.stringify(data, null, 2), 'utf-8');
  return { ok: true, country: safe, count: holidays.length };
}

/* ─── Wrappers HTTP pra Nager.Date (rodam no main pra contornar
       o CSP `default-src 'self'` do renderer). Usa Electron.net.fetch
       que vai pelo network stack do Chromium do main process. */

async function nagerListCountries() {
  const r = await net.fetch('https://date.nager.at/api/v3/AvailableCountries');
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const arr = await r.json();
  if (!Array.isArray(arr)) throw new Error('Resposta inválida da Nager.Date.');
  return arr;
}

async function nagerImport(code, year, opts) {
  const safe = String(code || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(safe)) throw new Error('Código de país inválido: ' + code);
  const yr = parseInt(year, 10);
  if (!yr || yr < 1900 || yr > 2200) throw new Error('Ano inválido: ' + year);
  const url = 'https://date.nager.at/api/v3/PublicHolidays/' + yr + '/' + safe;
  const r = await net.fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status + ' em ' + url);
  const data = await r.json();
  return importCountryFromNager(safe, data, opts);
}

module.exports = {
  listCountries,
  loadCountry,
  resolveHolidayDate,
  resolveCountryHolidays,
  getUserOverlay,
  setUserOverlay,
  listMergedHolidays,
  importCountryFromNager,
  nagerListCountries,
  nagerImport
};
