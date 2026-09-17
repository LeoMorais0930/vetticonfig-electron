/* ============================================================
   VettiConfig — i18n Engine
   ============================================================
   Como funciona:
   - Lê arquivos JSON na MESMA pasta deste script (auto-detectado)
   - Aplica traduções nos elementos com data-i18n="chave.subchave"
   - Suporta interpolação: data-i18n="nav.particao" data-i18n-n="1"
     com {{n}} no JSON → "Partição 1"
   - Guarda idioma escolhido em localStorage
   - Bandeiras como SVG inline (renderiza igual em mac/win/linux —
     emojis 🇧🇷 não funcionam no Windows)

   Para adicionar um novo idioma:
   1. Crie i18n/fr.json com as mesmas chaves
   2. Adicione o objeto em AVAILABLE_LANGS abaixo (com SVG da bandeira)
   3. Pronto — o seletor aparece automaticamente
   ============================================================ */

const VCi18n = (function () {

  // ── SVGs das bandeiras ──────────────────────────────────────
  // Tamanho de referência: 24x16 (proporção 3:2). Usar viewBox
  // mantém escala via CSS.
  const FLAGS = {
    // Brasil — verde, losango amarelo, círculo azul
    'pt-BR': '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
             '<rect width="24" height="16" fill="#009C3B"/>' +
             '<polygon points="12,2 22,8 12,14 2,8" fill="#FFDF00"/>' +
             '<circle cx="12" cy="8" r="3.2" fill="#002776"/>' +
             '<path d="M9.2,8.2 Q12,7 14.8,8.2" stroke="#fff" stroke-width="0.5" fill="none"/>' +
             '</svg>',

    // Estados Unidos — listras + cantão azul
    'en':    '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
             '<rect width="24" height="16" fill="#fff"/>' +
             '<g fill="#B22234">' +
               '<rect y="0"     width="24" height="1.23"/>' +
               '<rect y="2.46"  width="24" height="1.23"/>' +
               '<rect y="4.92"  width="24" height="1.23"/>' +
               '<rect y="7.38"  width="24" height="1.23"/>' +
               '<rect y="9.84"  width="24" height="1.23"/>' +
               '<rect y="12.30" width="24" height="1.23"/>' +
               '<rect y="14.77" width="24" height="1.23"/>' +
             '</g>' +
             '<rect width="9.6" height="8.61" fill="#3C3B6E"/>' +
             '<g fill="#fff">' +
               '<circle cx="1.6" cy="1.4" r="0.4"/><circle cx="3.2" cy="1.4" r="0.4"/>' +
               '<circle cx="4.8" cy="1.4" r="0.4"/><circle cx="6.4" cy="1.4" r="0.4"/>' +
               '<circle cx="8.0" cy="1.4" r="0.4"/>' +
               '<circle cx="2.4" cy="3.0" r="0.4"/><circle cx="4.0" cy="3.0" r="0.4"/>' +
               '<circle cx="5.6" cy="3.0" r="0.4"/><circle cx="7.2" cy="3.0" r="0.4"/>' +
               '<circle cx="1.6" cy="4.6" r="0.4"/><circle cx="3.2" cy="4.6" r="0.4"/>' +
               '<circle cx="4.8" cy="4.6" r="0.4"/><circle cx="6.4" cy="4.6" r="0.4"/>' +
               '<circle cx="8.0" cy="4.6" r="0.4"/>' +
               '<circle cx="2.4" cy="6.2" r="0.4"/><circle cx="4.0" cy="6.2" r="0.4"/>' +
               '<circle cx="5.6" cy="6.2" r="0.4"/><circle cx="7.2" cy="6.2" r="0.4"/>' +
               '<circle cx="1.6" cy="7.8" r="0.4"/><circle cx="3.2" cy="7.8" r="0.4"/>' +
               '<circle cx="4.8" cy="7.8" r="0.4"/><circle cx="6.4" cy="7.8" r="0.4"/>' +
               '<circle cx="8.0" cy="7.8" r="0.4"/>' +
             '</g>' +
             '</svg>',

    // Espanha — vermelho/amarelo/vermelho horizontal (3:2:3) com brasão
    // simplificado central. Usado para o code 'es-LA' por consistência
    // com o seletor compartilhado. Para Argentina/México etc. trocar aqui.
    'es-LA': '<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
             '<rect x="0" y="0"     width="24" height="4"  fill="#AA151B"/>' +
             '<rect x="0" y="4"     width="24" height="8"  fill="#F1BF00"/>' +
             '<rect x="0" y="12"    width="24" height="4"  fill="#AA151B"/>' +
             // Brasão simplificado central (escudo + coroa)
             '<g transform="translate(7 5.5)">' +
               '<rect x="0"   y="0.6" width="2"   height="3.2" fill="#AA151B" stroke="#7A4A1A" stroke-width="0.18"/>' +
               '<rect x="2"   y="0.6" width="2"   height="3.2" fill="#F1BF00" stroke="#7A4A1A" stroke-width="0.18"/>' +
               '<path d="M0.6,0.6 Q2,-0.4 3.4,0.6" fill="#F1BF00" stroke="#7A4A1A" stroke-width="0.2"/>' +
             '</g>' +
             '</svg>'
  };

  // ── Configuração ────────────────────────────────────────────
  const AVAILABLE_LANGS = [
    { code: 'pt-BR', name: 'Português (BR)' },
    { code: 'es-LA', name: 'Español (LA)'   },
    { code: 'en',    name: 'English'        }
  ];
  const DEFAULT_LANG = 'pt-BR';
  const STORAGE_KEY  = 'vc_lang';

  // Auto-detecta a pasta deste script — locales JSON moram aqui mesmo.
  // Funciona em qualquer HTML, qualquer profundidade de pasta.
  const _scriptSrc  = (document.currentScript && document.currentScript.src) || '';
  const LOCALES_PATH = _scriptSrc
    ? _scriptSrc.replace(/[^/]*$/, '')   // strip "vetticonfig-i18n.js"
    : './';

  // ── Estado interno ──────────────────────────────────────────
  let _current = DEFAULT_LANG;
  let _strings = {};

  // ── Helpers ─────────────────────────────────────────────────
  function _resolve(obj, path) {
    return path.split('.').reduce(function (o, k) {
      return o && o[k] !== undefined ? o[k] : null;
    }, obj);
  }

  function _interpolate(str, vars) {
    if (!vars || typeof str !== 'string') return str;
    return str.replace(/\{\{(\w+)\}\}/g, function (_, key) {
      return vars[key] !== undefined ? vars[key] : '{{' + key + '}}';
    });
  }

  // ── API pública ─────────────────────────────────────────────
  function t(key, vars) {
    var str = _resolve(_strings, key);
    if (str === null) {
      console.warn('[i18n] Chave não encontrada:', key);
      return key;
    }
    return _interpolate(str, vars);
  }

  function setLang(code, callback) {
    var valid = AVAILABLE_LANGS.find(function (l) { return l.code === code; });
    if (!valid) code = DEFAULT_LANG;

    function _commit(data) {
      _strings = data;
      _current = code;
      try { localStorage.setItem(STORAGE_KEY, code); } catch (e) {}
      document.documentElement.setAttribute('lang', code);
      _applyToPage();
      _updateSelector();
      if (typeof callback === 'function') callback(null, code);
    }

    // Se já temos esse idioma em memória (carregado pelo prefetch ou anterior),
    // aplica imediatamente sem refazer o fetch.
    if (_current === code && _strings && Object.keys(_strings).length > 0) {
      _commit(_strings);
      return;
    }

    var url = LOCALES_PATH + code + '.json';
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(_commit)
      .catch(function (err) {
        console.error('[i18n] Erro ao carregar', url, err);
        if (typeof callback === 'function') callback(err);
      });
  }

  function _applyToPage() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key  = el.getAttribute('data-i18n');
      var vars = _buildVars(el);
      var str  = t(key, vars);
      if (str && str !== key) el.textContent = str;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      var str = t(key);
      if (str && str !== key) el.placeholder = str;
    });

    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      var str = t(key);
      if (str && str !== key) {
        // Tooltip é tratado pela engine custom (vcTip), não pelo title nativo.
        el.setAttribute('data-vc-tip', str);
        if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', str);
        el.removeAttribute('title');
      }
    });

    document.dispatchEvent(new CustomEvent('vc:langchange', { detail: { lang: _current } }));
  }

  function _buildVars(el) {
    var vars = {};
    Array.from(el.attributes).forEach(function (attr) {
      var m = attr.name.match(/^data-i18n-([a-z]+)$/);
      if (m && m[1] !== 'placeholder' && m[1] !== 'title') {
        vars[m[1]] = attr.value;
      }
    });
    return Object.keys(vars).length ? vars : null;
  }

  function _updateSelector() {
    document.querySelectorAll('.vc-lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === _current);
    });
  }

  /**
   * Renderiza o seletor de idioma num elemento container.
   *
   * @param {string|Element} target — id ou elemento
   * @param {object} [opts]
   * @param {boolean} [opts.compact=true]  — true: só bandeiras (lado a lado)
   *                                         false: bandeira + nome (empilhado)
   */
  function renderSelector(target, opts) {
    var el = typeof target === 'string'
      ? document.getElementById(target)
      : target;
    if (!el) return;

    opts = opts || {};
    var compact = opts.compact !== false;   // default true

    el.innerHTML = '';
    el.classList.add('vc-lang-selector');
    el.classList.toggle('compact', compact);

    AVAILABLE_LANGS.forEach(function (lang) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vc-lang-btn' + (lang.code === _current ? ' active' : '');
      btn.dataset.lang = lang.code;
      btn.title = lang.name;
      btn.setAttribute('aria-label', lang.name);

      var flagHtml = '<span class="vc-lang-flag">' + (FLAGS[lang.code] || '') + '</span>';
      btn.innerHTML = compact
        ? flagHtml
        : flagHtml + '<span class="vc-lang-label">' + lang.name + '</span>';

      btn.addEventListener('click', function () { setLang(lang.code); });
      el.appendChild(btn);
    });
  }

  function getCurrentLang()    { return _current; }
  function getAvailableLangs() { return AVAILABLE_LANGS.slice(); }

  function init(callback) {
    var saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    setLang(saved || DEFAULT_LANG, callback);
  }

  // Pré-aquecimento: dispara o fetch do JSON do idioma assim que o script
  // carrega, sem esperar DOMContentLoaded. Quando o init() for chamado mais
  // tarde, o fetch já estará respondido (ou em vôo) e a UI atualiza
  // imediatamente. Não toca no DOM aqui — _applyToPage roda depois.
  (function _prefetch() {
    var saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    var code = saved || DEFAULT_LANG;
    var url  = LOCALES_PATH + code + '.json';
    fetch(url)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (data && _current === DEFAULT_LANG && Object.keys(_strings).length === 0) {
          // Cacheia local; setLang() chamado depois reusa o resultado.
          _strings = data; _current = code;
        }
      })
      .catch(function () { /* init() vai tentar de novo */ });
  })();

  // `apply` re-traduz a página com o idioma atual (usar após injetar
  // HTML dinâmico com data-i18n para que as chaves novas sejam aplicadas).
  function apply() { _applyToPage(); }

  return { init, setLang, apply, t, renderSelector, getCurrentLang, getAvailableLangs };

})();
