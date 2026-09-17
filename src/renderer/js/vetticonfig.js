/* ============================================================
   VettiConfig — JS Compartilhado
   ============================================================ */

/* ─── PASSWORD TOGGLE (ícone olho) ────────────────────────── */
function vcTogglePassword(inputId, btn) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  var willShow = inp.type === 'password';
  inp.type = willShow ? 'text' : 'password';
  if (btn) {
    var icon = btn.querySelector('i');
    if (icon) icon.className = 'bi ' + (willShow ? 'bi-eye-slash' : 'bi-eye');
  }
}

/* ─── SIDEBAR DINÂMICA ────────────────────────────────────── */
// Monta a lista de itens do menu lateral, marcando o item ativo conforme
// a tela (status, sistema, particao+n, zona, config).
function vcRenderFullSidebar(active, opts) {
  var ul = document.getElementById('vcSidebarNav');
  if (!ul) return;
  opts = opts || {};
  var n = opts.n || null;
  var items = [
    { key: 'status',    href: 'vetticonfig-status.html', icon: 'bi-broadcast',   i18n: 'nav.status'             },
    { key: 'sistema',   href: 'sistema.html',            icon: 'bi-display',     i18n: 'nav.sistema'            },
    { key: 'particao1', href: 'particao.html?n=1',       icon: 'bi-lock-fill',   i18n: 'nav.particao', n: 1     },
    { key: 'particao2', href: 'particao.html?n=2',       icon: 'bi-lock-fill',   i18n: 'nav.particao', n: 2     },
    { key: 'particao3', href: 'particao.html?n=3',       icon: 'bi-lock-fill',   i18n: 'nav.particao', n: 3     },
    { key: 'particao4', href: 'particao.html?n=4',       icon: 'bi-lock-fill',   i18n: 'nav.particao', n: 4     },
    { key: 'particao5', href: 'particao.html?n=5',       icon: 'bi-lock-fill',   i18n: 'nav.particao', n: 5     },
    { key: 'particao6', href: 'particao.html?n=6',       icon: 'bi-lock-fill',   i18n: 'nav.particao', n: 6     },
    { key: 'zona',      href: 'zona-compartilhada.html', icon: 'bi-share-fill',  i18n: 'nav.zona_compartilhada' }
  ];
  var activeKey = active === 'particao' && n ? 'particao' + n : active;

  ul.innerHTML = '';
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var li = document.createElement('li');
    var a  = document.createElement('a');
    a.className = 'vc-nav-link' + (it.key === activeKey ? ' active' : '');
    a.href = it.href;
    a.innerHTML =
      '<span class="vc-nav-icon"><i class="bi ' + it.icon + '"></i></span>' +
      '<span data-i18n="' + it.i18n + '"' + (it.n ? ' data-i18n-n="' + it.n + '"' : '') + '>' +
      (it.n ? 'Partição ' + it.n : it.i18n) + '</span>';
    li.appendChild(a);
    ul.appendChild(li);
  }
}

/* ─── SPLASH ──────────────────────────────────────────────── */
// Esconde a tela de splash com fade. Chamada pelo HTML após VCi18n.init,
// com delay mínimo para a animação ser perceptível.
function vcHideSplash() {
  var s = document.getElementById('vcSplash');
  if (!s || s._hiding) return;
  s._hiding = true;
  s.classList.add('vc-splash-hidden');
  setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 400);
}

/* ─── SIDEBAR ─────────────────────────────────────────────── */
var VC_SIDEBAR_COLLAPSED_KEY = 'vc_sidebar_collapsed';

function vcToggleSidebar() {
  var sidebar = document.getElementById('vcSidebar');
  var overlay = document.getElementById('vcOverlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}

function vcSetSidebarCollapsed(collapsed) {
  document.body.classList.toggle('vc-sidebar-collapsed', !!collapsed);
  try { localStorage.setItem(VC_SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0'); } catch (_) {}
}

function vcToggleSidebarCollapsed() {
  vcSetSidebarCollapsed(!document.body.classList.contains('vc-sidebar-collapsed'));
}

document.addEventListener('DOMContentLoaded', function () {
  try {
    vcSetSidebarCollapsed(localStorage.getItem(VC_SIDEBAR_COLLAPSED_KEY) === '1');
  } catch (_) {}
});

document.addEventListener('click', function (e) {
  var sidebar = e.target && e.target.closest ? e.target.closest('.vc-sidebar') : null;
  if (!sidebar) return;

  var rect = sidebar.getBoundingClientRect();
  if (e.clientX > rect.right - 10) {
    e.preventDefault();
    e.stopPropagation();
    vcToggleSidebarCollapsed();
  }
}, true);

document.addEventListener('mousemove', function (e) {
  var sidebar = document.getElementById('vcSidebar');
  if (!sidebar) return;

  var rect = sidebar.getBoundingClientRect();
  var onEdge = e.clientX >= rect.right - 10 && e.clientX <= rect.right &&
    e.clientY >= rect.top && e.clientY <= rect.bottom;
  sidebar.classList.toggle('vc-sidebar-edge-hover', onEdge);
});

document.addEventListener('mouseleave', function () {
  var sidebar = document.getElementById('vcSidebar');
  if (sidebar) sidebar.classList.remove('vc-sidebar-edge-hover');
});

/* ─── TEMA (light/dark) ───────────────────────────────────── */
var VC_THEME_KEY = 'vc_theme';
var VC_SCAN_DETAIL_KEY = 'vc_scan_detailed';
var VC_STATUS_SCAN_CACHE_KEY = 'vc_status_scan_cache_v1';

function vcGetTheme() {
  try {
    var t = localStorage.getItem(VC_THEME_KEY);
    return t === 'dark' ? 'dark' : 'light';
  } catch (_) { return 'light'; }
}
function vcApplyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.vc-theme-toggle .bi').forEach(function (i) {
    i.className = 'bi ' + (theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill');
  });
  // Mantém os cards do painel Aparência (tela Configurações) em sincronia
  // quando o tema é alterado pelo botão lua/sol da sidebar.
  if (typeof _vcCfgRenderThemes === 'function') {
    try { _vcCfgRenderThemes(); } catch (_) {}
  }
}
function vcToggleTheme() {
  var next = vcGetTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(VC_THEME_KEY, next); } catch (_) {}
  vcApplyTheme(next);
}
// Aplica imediatamente ao carregar o script (antes do DOMContentLoaded
// renderizar os elementos), evitando flash do tema padrão.
(function () { vcApplyTheme(vcGetTheme()); })();

/* ─── BARRA GLOBAL DE AÇÕES (Ler / Gravar) ─────────────────── */
var _vcActiveActionCard = null;

function _vcIsStatusPageForActionBar() {
  var path = (window.location && window.location.pathname || '').toLowerCase();
  return path.indexOf('vetticonfig-status.html') >= 0 || path.indexOf('/status.html') >= 0;
}

function _vcFindActionCard() {
  if (_vcActiveActionCard && document.body.contains(_vcActiveActionCard)) {
    var activePanel = _vcActiveActionCard.closest('.vc-sys-panel, .vc-tab-panel');
    if (_vcActiveActionCard.offsetParent !== null &&
        (!activePanel || activePanel.classList.contains('active'))) {
      return _vcActiveActionCard;
    }
  }

  var selectors = [
    '.vc-sys-panel.active .vc-card[data-card]',
    '.vc-tab-panel.active .vc-card[data-card]',
    '.vc-card[data-card]'
  ];
  for (var i = 0; i < selectors.length; i++) {
    var cards = document.querySelectorAll(selectors[i]);
    for (var j = 0; j < cards.length; j++) {
      var card = cards[j];
      if (card.offsetParent === null) continue;
      if (card.querySelector('[data-action="cancel"], [data-action="save"]')) return card;
    }
  }
  return null;
}

function _vcRunActionBarAction(action) {
  var card = _vcFindActionCard();
  if (!card) return;
  var btn = card.querySelector('[data-action="' + action + '"]');
  if (btn) btn.click();
}

function vcInstallActionBar() {
  if (_vcIsStatusPageForActionBar()) return;
  if (document.getElementById('vcGlobalActionBar')) return;
  if (!document.querySelector('.vc-card[data-card] [data-action]')) return;

  document.body.classList.add('vc-action-bar-page');
  document.querySelectorAll('.vc-card-footer').forEach(function (footer) {
    if (footer.querySelector('[data-action]')) footer.classList.add('vc-card-footer-local-actions');
  });

  document.addEventListener('focusin', function (e) {
    var card = e.target && e.target.closest ? e.target.closest('.vc-card[data-card]') : null;
    if (card && card.querySelector('[data-action]')) _vcActiveActionCard = card;
  });
  document.addEventListener('click', function (e) {
    var card = e.target && e.target.closest ? e.target.closest('.vc-card[data-card]') : null;
    if (card && card.querySelector('[data-action]')) _vcActiveActionCard = card;
  }, true);

  var bar = document.createElement('div');
  bar.id = 'vcGlobalActionBar';
  bar.className = 'vc-action-bar';
  bar.innerHTML =
    '<div class="vc-action-bar-inner">' +
      '<button class="vc-btn outline vc-action-bar-btn" type="button" data-global-action="cancel">Ler</button>' +
      '<button class="vc-btn vc-action-bar-btn" type="button" data-global-action="save">Gravar</button>' +
    '</div>';
  bar.querySelector('[data-global-action="cancel"]').addEventListener('click', function () {
    _vcRunActionBarAction('cancel');
  });
  bar.querySelector('[data-global-action="save"]').addEventListener('click', function () {
    _vcRunActionBarAction('save');
  });

  var footer = document.querySelector('.vc-app-footer');
  if (footer && footer.parentNode) footer.parentNode.insertBefore(bar, footer);
  else document.body.appendChild(bar);
}

document.addEventListener('DOMContentLoaded', vcInstallActionBar);

/* ─── TOOLTIP CUSTOM (vcTip) ──────────────────────────────────
   Substitui o tooltip nativo do browser (lento, ~500ms, sem estilo)
   por um elemento posicionado dinamicamente que aparece em 120ms.
   Migra automaticamente todo `title=` para `data-vc-tip=` no init
   e a cada troca de idioma (i18n já seta `data-vc-tip` direto).
   ────────────────────────────────────────────────────────────── */
var _VC_TIP_DELAY = 120;        // delay antes de aparecer
var _VC_TIP_HIDE_DELAY = 260;   // grace period antes de sumir
var _vcTipEl = null;
var _vcTipShowTimer = null;
var _vcTipHideTimer = null;
var _vcTipTarget = null;

function _vcTipMigrateAll() {
  document.querySelectorAll('[title]:not([data-vc-no-tip])').forEach(function (el) {
    var txt = el.getAttribute('title');
    if (!txt) return;
    el.setAttribute('data-vc-tip', txt);
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', txt);
    el.removeAttribute('title');
  });
}

function _vcTipEnsureEl() {
  if (_vcTipEl && document.body.contains(_vcTipEl)) return _vcTipEl;
  _vcTipEl = document.createElement('div');
  _vcTipEl.className = 'vc-tip';
  _vcTipEl.setAttribute('role', 'tooltip');
  // Permite ao cursor "pousar" sobre a tooltip sem sumir.
  _vcTipEl.addEventListener('mouseenter', _vcTipCancelHide);
  _vcTipEl.addEventListener('mouseleave', _vcTipScheduleHide);
  document.body.appendChild(_vcTipEl);
  return _vcTipEl;
}

function _vcTipCancelHide() {
  if (_vcTipHideTimer) { clearTimeout(_vcTipHideTimer); _vcTipHideTimer = null; }
}

function _vcTipScheduleHide() {
  _vcTipCancelHide();
  _vcTipHideTimer = setTimeout(_vcTipHideNow, _VC_TIP_HIDE_DELAY);
}

function _vcTipHideNow() {
  if (_vcTipShowTimer) { clearTimeout(_vcTipShowTimer); _vcTipShowTimer = null; }
  _vcTipCancelHide();
  if (_vcTipEl) _vcTipEl.classList.remove('vc-tip-visible');
  _vcTipTarget = null;
}

function _vcTipPosition(target, el) {
  var r = target.getBoundingClientRect();
  el.style.left = '0px';
  el.style.top  = '0px';
  el.classList.remove('above', 'below');
  // mede após reset
  var w = el.offsetWidth;
  var h = el.offsetHeight;
  var cx = r.left + r.width / 2;
  var top = r.top - h - 10;
  var pos = 'above';
  if (top < 6) { top = r.bottom + 10; pos = 'below'; }
  var left = cx - w / 2;
  if (left < 6) left = 6;
  if (left + w > window.innerWidth - 6) left = window.innerWidth - 6 - w;
  el.style.left = left + 'px';
  el.style.top  = top + 'px';
  el.classList.add(pos);
  // posição horizontal da seta dentro do tooltip (centrada no target)
  var arrowX = Math.max(10, Math.min(w - 10, cx - left));
  el.style.setProperty('--vc-tip-arrow', arrowX + 'px');
}

function _vcTipShow(target) {
  var txt = target.getAttribute('data-vc-tip');
  if (!txt) return;
  var el = _vcTipEnsureEl();
  el.textContent = txt;
  _vcTipPosition(target, el);
  el.classList.add('vc-tip-visible');
}

function _vcTipBind() {
  document.addEventListener('mouseover', function (e) {
    var t = e.target.closest('[data-vc-tip]');
    if (!t) return;
    // Mouse voltou (ou continua) no target — cancela hide pendente.
    _vcTipCancelHide();
    if (t === _vcTipTarget) return;
    if (_vcTipShowTimer) clearTimeout(_vcTipShowTimer);
    _vcTipTarget = t;
    _vcTipShowTimer = setTimeout(function () {
      if (_vcTipTarget === t) _vcTipShow(t);
    }, _VC_TIP_DELAY);
  });
  document.addEventListener('mouseout', function (e) {
    if (!_vcTipTarget) return;
    if (e.relatedTarget && _vcTipTarget.contains(e.relatedTarget)) return;
    // Se o cursor foi para a própria tooltip, não esconde — o mouseenter dela
    // já cancela. Caso contrário, agenda esconder com grace period.
    if (e.relatedTarget && _vcTipEl && _vcTipEl.contains(e.relatedTarget)) return;
    _vcTipScheduleHide();
  });
  document.addEventListener('mousedown', _vcTipHideNow);
  window.addEventListener('scroll', _vcTipHideNow, true);
  document.addEventListener('vc:langchange', _vcTipMigrateAll);
}

document.addEventListener('DOMContentLoaded', function () {
  _vcTipMigrateAll();
  _vcTipBind();
  // Carrega (com migração transparente do localStorage legado) a lista
  // de conexões remotas pro cache in-memory. UIs que dependem disso
  // re-renderizam automaticamente quando o cache resolve.
  if (typeof vcRemoteListEnsureLoaded === 'function') {
    vcRemoteListEnsureLoaded().then(function () {
      if (typeof vcRemoteRenderList === 'function') vcRemoteRenderList();
    });
  }
});

/* ─── MODAL CONEXÃO ───────────────────────────────────────── */
function vcOpenModal() {
  var modal = document.getElementById('vcModalConn');
  if (!modal) return;
  modal.classList.add('open');

  // Defensiva: se nenhuma tab estiver ativa (ex: após um close mal-comportado),
  // ativa a primeira tab real (a que tem data-tab) automaticamente.
  if (!modal.querySelector('.vc-tab-panel.active')) {
    var firstBtn = modal.querySelector('.vc-tab[data-tab]');
    if (firstBtn) {
      firstBtn.classList.add('active');
      var firstPanel = document.getElementById(firstBtn.dataset.tab);
      if (firstPanel) firstPanel.classList.add('active');
    }
  }

  // Se a aba Local está ativa, popula interfaces e dispara discovery.
  var localPanel = document.getElementById('vcPanelLocal');
  if (localPanel && localPanel.classList.contains('active')) {
    vcPopulateInterfaces().then(function () {
      if (_vcBroadcasts.length > 0) vcStartDiscovery();
    });
  }

  // Re-renderiza a lista de conexões remotas salvas (pode ter mudado).
  if (typeof vcRemoteRenderList === 'function') vcRemoteRenderList();

  // Aba Backup: bind dos botões + contagens atualizadas a cada abertura.
  if (typeof vcBackupConnBindButtons === 'function') vcBackupConnBindButtons();
  if (typeof vcBackupConnRefreshCounts === 'function') vcBackupConnRefreshCounts();
}
function vcCloseModal() {
  var modal = document.getElementById('vcModalConn');
  if (modal) modal.classList.remove('open');
}

// Fecha ao clicar no backdrop
document.addEventListener('DOMContentLoaded', function () {
  var backdrop = document.getElementById('vcModalConn');
  if (backdrop) {
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) vcCloseModal();
    });
  }

  // Tabs do modal — IMPORTANTE: só botões com data-tab.
  // O botão "X" (fechar) tem class="vc-tab" para herdar o estilo,
  // mas NÃO é uma tab real. Se incluído, ele desativa todos os painéis
  // ao ser clicado (porque dataset.tab é undefined), deixando o modal vazio
  // na próxima abertura.
  document.querySelectorAll('.vc-tab[data-tab]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.dataset.tab;
      document.querySelectorAll('.vc-tab[data-tab]').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.vc-tab-panel').forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      var panel = document.getElementById(target);
      if (panel) panel.classList.add('active');
      // Ao ativar a aba Backup, re-conta locais/remotas (pode ter mudado).
      if (target === 'vcPanelBackup' && typeof vcBackupConnRefreshCounts === 'function') {
        vcBackupConnRefreshCounts();
      }
    });
  });

  // Seleção de linha na lista de centrais
  document.querySelectorAll('#vcConnList .vc-conn-row').forEach(function (row) {
    row.addEventListener('click', function () {
      document.querySelectorAll('#vcConnList .vc-conn-row').forEach(function (r) { r.classList.remove('selected'); });
      row.classList.add('selected');
    });
  });

  // Seleção de conexão salva (remota)
  document.querySelectorAll('#vcSavedList .vc-saved-row').forEach(function (row) {
    row.addEventListener('click', function () {
      document.querySelectorAll('#vcSavedList .vc-saved-row').forEach(function (r) { r.classList.remove('selected'); });
      row.classList.add('selected');
    });
  });

  // === DISCOVERY UDP: subscriptions e wire-up de botões ===
  if (window.vettiAPI && window.vettiAPI.network) {
    var _vcFoundCount = 0;

    window.vettiAPI.network.onDiscoveryFound(function (d) {
      _vcFoundCount++;
      var label = (d.name && d.name.length) ? d.name : d.ip;
      vcAddCentral('vcCentral_' + d.ip.replace(/\./g, '_') + '_' + (d.generation || 'legacy'), label, {
        ip: d.ip,
        raw: d.raw,
        generation: d.generation || 'legacy'
      });
      vcLogTs(VCi18n.t('discovery.found_so_far', { n: _vcFoundCount }));
    });

    window.vettiAPI.network.onDiscoveryDone(function (data) {
      var total = (data && data.total) || 0;
      vcLogTs(total > 0
        ? VCi18n.t('discovery.found_total', { n: total })
        : VCi18n.t('discovery.empty'));
      _vcFoundCount = 0;
      _vcDiscoveryRunning = false;
      var btn = document.getElementById('vcBtnProcurar');
      if (btn) btn.disabled = false;
    });

    window.vettiAPI.network.onLogEvent(function (ev) {
      vcRenderLogEvent(ev);
    });

    if (typeof window.vettiAPI.network.onAsyncEvent === 'function') {
      window.vettiAPI.network.onAsyncEvent(function (ev) {
        vcLogTs(VCi18n.t('discovery.async_event', { body: (ev && ev.raw) || '' }));
        _vcHandleAsyncEvent(ev);
      });
    }
  }

  var btnProcurar = document.getElementById('vcBtnProcurar');
  if (btnProcurar) {
    btnProcurar.addEventListener('click', function (e) { e.preventDefault(); vcStartDiscovery(); });
  }

  var btnConectar = document.getElementById('vcBtnConectar');
  if (btnConectar) {
    btnConectar.addEventListener('click', function (e) { e.preventDefault(); vcOnConectarLocal(); });
  }

  var btnRemoto = document.getElementById('vcBtnConectarRemoto');
  if (btnRemoto) {
    btnRemoto.addEventListener('click', function (e) { e.preventDefault(); vcOnConectarRemoto(); });
  }

  var btnAddRemoto = document.getElementById('vcBtnAddRemoto');
  if (btnAddRemoto) {
    btnAddRemoto.addEventListener('click', function (e) { e.preventDefault(); vcRemoteAddFromForm(); });
  }

  // Render inicial da lista de conexões remotas salvas (se a tela tem o modal).
  if (document.getElementById('vcSavedList')) vcRemoteRenderList();

  // Injeta um toggle de auto-scroll em todo `.vc-logger-header` da
  // página. Como a estrutura é a mesma em Status / Sistema / Partição /
  // Zona / Configurações / index, fazer aqui evita editar 5 HTMLs.
  _vcInjectLogAutoScrollToggle();
  _vcApplyPageLoggerVisibility();
  _vcSetupPageLoggerWindow();

  // Aplica altura persistida e instala ResizeObserver pra capturar
  // mudanças quando o usuário arrasta a borda inferior do logger.
  _vcSetupLogResize();
});

var VC_PAGE_LOGGER_KEY = 'vc_page_logger_visible';
var VC_PAGE_LOGGER_BOUNDS_KEY = 'vc_page_logger_bounds';
var _vcPageLoggerPrevBounds = null;

function vcIsPageLoggerVisible() {
  try { return localStorage.getItem(VC_PAGE_LOGGER_KEY) === '1'; }
  catch (_) { return false; }
}

function vcSetPageLoggerVisible(on) {
  try { localStorage.setItem(VC_PAGE_LOGGER_KEY, on ? '1' : '0'); } catch (_) {}
  _vcApplyPageLoggerVisibility();
  var chk = document.getElementById('vcCfgShowLogger');
  if (chk) chk.checked = !!on;
}

function _vcApplyPageLoggerVisibility() {
  var visible = vcIsPageLoggerVisible();
  document.querySelectorAll('[data-vc-page-logger]').forEach(function (el) {
    el.hidden = !visible;
  });
}

function _vcReadPageLoggerBounds() {
  try {
    var b = JSON.parse(localStorage.getItem(VC_PAGE_LOGGER_BOUNDS_KEY) || 'null');
    if (b && isFinite(b.left) && isFinite(b.top) && isFinite(b.width) && isFinite(b.height)) return b;
  } catch (_) {}
  return null;
}

function _vcSavePageLoggerBounds(el) {
  if (!el) return;
  var r = el.getBoundingClientRect();
  try {
    localStorage.setItem(VC_PAGE_LOGGER_BOUNDS_KEY, JSON.stringify({
      left: Math.round(r.left),
      top: Math.round(r.top),
      width: Math.round(r.width),
      height: Math.round(r.height)
    }));
  } catch (_) {}
}

function _vcApplyPageLoggerBounds(el, b) {
  if (!el || !b) return;
  var minVisible = 48;
  var maxLeft = Math.max(minVisible - b.width, window.innerWidth - minVisible);
  var maxTop = Math.max(0, window.innerHeight - minVisible);
  var left = Math.max(minVisible - b.width, Math.min(b.left, maxLeft));
  var top = Math.max(0, Math.min(b.top, maxTop));
  el.style.left = left + 'px';
  el.style.top = top + 'px';
  el.style.right = 'auto';
  el.style.bottom = 'auto';
  el.style.width = Math.max(320, b.width) + 'px';
  el.style.height = Math.max(190, b.height) + 'px';
}

function _vcSetupPageLoggerWindow() {
  var popups = document.querySelectorAll('[data-vc-page-logger]');
  if (!popups.length) return;
  var saved = _vcReadPageLoggerBounds();

  popups.forEach(function (popup) {
    if (saved) _vcApplyPageLoggerBounds(popup, saved);
    if (popup._vcWindowBound) return;
    popup._vcWindowBound = true;

    var header = popup.querySelector('.vc-logger-header');
    if (header) {
      header.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        if (e.target.closest('button, input, label, a')) return;
        e.preventDefault();
        var rect = popup.getBoundingClientRect();
        var startX = e.clientX;
        var startY = e.clientY;
        var startLeft = rect.left;
        var startTop = rect.top;
        popup.style.left = startLeft + 'px';
        popup.style.top = startTop + 'px';
        popup.style.right = 'auto';
        popup.style.bottom = 'auto';
        header.setPointerCapture(e.pointerId);

        function move(ev) {
          popup.style.left = (startLeft + ev.clientX - startX) + 'px';
          popup.style.top = (startTop + ev.clientY - startY) + 'px';
        }
        function up(ev) {
          header.releasePointerCapture(ev.pointerId);
          header.removeEventListener('pointermove', move);
          header.removeEventListener('pointerup', up);
          header.removeEventListener('pointercancel', up);
          _vcSavePageLoggerBounds(popup);
        }
        header.addEventListener('pointermove', move);
        header.addEventListener('pointerup', up);
        header.addEventListener('pointercancel', up);
      });
    }

    if (typeof ResizeObserver !== 'undefined') {
      var saveTimer = null;
      var ro = new ResizeObserver(function () {
        if (popup.hidden) return;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(function () { _vcSavePageLoggerBounds(popup); }, 350);
      });
      ro.observe(popup);
    }
  });
}

// Altura do logger ajustável pelo usuário, persistida em localStorage.
// Compartilhada entre todas as telas/sessões (chave 'vc_log_height').
function _vcLogHeight() {
  try {
    var v = parseInt(localStorage.getItem('vc_log_height'), 10);
    if (isFinite(v) && v >= 80 && v <= 2000) return v;
  } catch (_) {}
  return null;
}
function _vcSetLogHeight(px) {
  if (!isFinite(px) || px < 80 || px > 2000) return;
  try { localStorage.setItem('vc_log_height', String(px | 0)); } catch (_) {}
}

// ~5 linhas a 12px com line-height 1.5 ≈ 90px por step.
var _VC_LOG_STEP = 90;
// Altura "expandida" do toggle maximizar — 90% da viewport. Casa com o
// `max-height: 90vh` da CSS (.vc-logger-body); deixa só uma margem
// pequena pra UI continuar visível mas permite o logger dominar o resto.
function _vcLogMaxHeight() {
  return Math.min(2000, Math.max(200, (window.innerHeight * 0.9) | 0));
}

function _vcVisiblePageLoggerPopups() {
  return Array.prototype.slice.call(document.querySelectorAll('[data-vc-page-logger]'))
    .filter(function (el) { return !el.hidden; });
}

function _vcSetupLogResize() {
  var bodies = document.querySelectorAll('.vc-logger-body');
  if (!bodies.length) return;
  var saved = _vcLogHeight();
  if (saved) {
    bodies.forEach(function (b) { b.style.height = saved + 'px'; });
  }
  if (typeof ResizeObserver !== 'undefined') {
    var saveTimer = null;
    bodies.forEach(function (b) {
      var ro = new ResizeObserver(function () {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
          var h = b.getBoundingClientRect().height | 0;
          _vcSetLogHeight(h);
          // Sincroniza os outros loggers da mesma página (ex: modal
          // Conexão tem 2 loggers — local e remoto).
          bodies.forEach(function (other) {
            if (other !== b) other.style.height = h + 'px';
          });
        }, 350);
      });
      ro.observe(b);
    });
  }
}

// Estado do toggle "Maximizar" — guarda altura prévia pra restaurar.
var _vcLogPrevHeight = null;

function _vcLogAdjust(delta) {
  var popups = _vcVisiblePageLoggerPopups();
  if (popups.length) {
    popups.forEach(function (popup) {
      var r = popup.getBoundingClientRect();
      var next = Math.max(190, Math.min(window.innerHeight - 24, r.height + delta));
      popup.style.height = next + 'px';
      _vcSavePageLoggerBounds(popup);
    });
    return;
  }

  var bodies = document.querySelectorAll('.vc-logger-body');
  if (!bodies.length) return;
  var current = bodies[0].getBoundingClientRect().height | 0;
  var next = current + delta;
  next = Math.max(80, Math.min(_vcLogMaxHeight(), next));
  bodies.forEach(function (b) { b.style.height = next + 'px'; });
  _vcSetLogHeight(next);
}

function _vcLogToggleMax() {
  var popups = _vcVisiblePageLoggerPopups();
  if (popups.length) {
    popups.forEach(function (popup) {
      var r = popup.getBoundingClientRect();
      var isMax = r.width >= window.innerWidth - 40 && r.height >= window.innerHeight - 80;
      if (isMax) {
        _vcApplyPageLoggerBounds(popup, _vcPageLoggerPrevBounds || { left: window.innerWidth - 784, top: window.innerHeight - 318, width: 760, height: 260 });
        _vcSavePageLoggerBounds(popup);
      } else {
        _vcPageLoggerPrevBounds = { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
        popup.style.left = '12px';
        popup.style.top = '12px';
        popup.style.right = 'auto';
        popup.style.bottom = 'auto';
        popup.style.width = (window.innerWidth - 24) + 'px';
        popup.style.height = (window.innerHeight - 72) + 'px';
      }
    });
    return;
  }

  var bodies = document.querySelectorAll('.vc-logger-body');
  if (!bodies.length) return;
  var current = bodies[0].getBoundingClientRect().height | 0;
  var max = _vcLogMaxHeight();
  if (current >= max - 20) {
    // Já está maximizado — restaura altura prévia.
    var restore = _vcLogPrevHeight || 140;
    bodies.forEach(function (b) { b.style.height = restore + 'px'; });
    _vcSetLogHeight(restore);
  } else {
    _vcLogPrevHeight = current;
    bodies.forEach(function (b) { b.style.height = max + 'px'; });
    _vcSetLogHeight(max);
  }
}

function _vcInjectLogAutoScrollToggle() {
  var headers = document.querySelectorAll('.vc-logger-header');
  if (!headers.length) return;
  var on = _vcLogAutoScroll();
  headers.forEach(function (h) {
    if (h.querySelector('.vc-log-autoscroll')) return;       // já injetado

    // Auto-scroll toggle
    var label = document.createElement('label');
    label.className = 'vc-log-autoscroll';
    label.setAttribute('data-i18n-title', 'modal.autoscroll_tip');
    label.innerHTML =
      '<input type="checkbox"' + (on ? ' checked' : '') + ' />' +
      '<span class="vc-log-autoscroll-label" data-i18n="modal.autoscroll">Auto-scroll</span>';

    // Insere antes do botão de Limpar (último filho atualmente).
    var clearBtn = h.querySelector('button');
    if (clearBtn) {
      h.insertBefore(label, clearBtn);
    } else {
      h.appendChild(label);
    }
    label.querySelector('input').addEventListener('change', function (e) {
      _vcSetLogAutoScroll(e.target.checked);
      document.querySelectorAll('.vc-log-autoscroll input').forEach(function (i) {
        if (i !== e.target) i.checked = e.target.checked;
      });
    });

    if (h.closest('[data-vc-page-logger]') && !h.querySelector('.vc-log-close')) {
      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'btn btn-sm text-white p-0 vc-log-close';
      closeBtn.setAttribute('data-i18n-title', 'common.close');
      closeBtn.setAttribute('title', 'Fechar logger');
      closeBtn.innerHTML = '<i class="bi bi-x-lg" style="font-size:15px;"></i>';
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        vcSetPageLoggerVisible(false);
      });
      if (clearBtn && clearBtn.parentNode === h) {
        h.insertBefore(closeBtn, clearBtn.nextSibling);
      } else {
        h.appendChild(closeBtn);
      }
    }
  });
  // Aplica i18n nas chaves que acabamos de inserir, caso a engine
  // já tenha rodado antes do _vcInjectLogAutoScrollToggle.
  if (typeof VCi18n !== 'undefined' && VCi18n && VCi18n.apply) VCi18n.apply();
}

/* ─── HELPERS DE CAMPO ────────────────────────────────────── */
function vcSet(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}
function vcSetHTML(id, html) {
  var el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

/* ─── STATUS: PARTIÇÕES ───────────────────────────────────── */
// state: 'armed' | 'stay' | 'disarmed' | 'alarm' | 'panic' | 'unused'
function _vcStatusIconUrl(name) {
  return _vcScanAssetUrl('assets/icons/status/' + name + '.svg');
}

function vcSetPartition(num, state) {
  var card   = document.getElementById('vcPartCard' + num);
  var status = document.getElementById('vcPart'   + num + 'Status');
  if (!card || !status) return;

  // Reset modificadores e ícone
  card.classList.remove('armed', 'stay', 'disarmed', 'alarm', 'unused', 'in-use', 'disabled', 'selected');
  var iconHost = card.querySelector('.vc-part-icon');

  var icon, txtKey, statusClass;
  switch (state) {
    case 'armed':    icon = 'lock-armed-total'; txtKey = 'common.armed';    statusClass = 'armado';        card.classList.add('armed', 'in-use');    break;
    case 'stay':     icon = 'lock-arm-stay';    txtKey = 'common.stay';     statusClass = 'stay';          card.classList.add('stay', 'in-use');     break;
    case 'disarmed': icon = 'lock-disarmed';    txtKey = 'common.disarmed'; statusClass = 'desarmado';     card.classList.add('disarmed', 'in-use'); break;
    case 'alarm':    icon = 'lock-panic';       txtKey = 'common.alarm';    statusClass = 'alarme';        card.classList.add('alarm', 'in-use');    break;
    case 'panic':    icon = 'lock-panic';       txtKey = 'common.panic';    statusClass = 'alarme';        card.classList.add('alarm', 'in-use');    break;
    default:         icon = 'home-unused';      txtKey = 'common.not_used'; statusClass = 'nao-utilizada'; card.classList.add('unused');             break;
  }
  if (iconHost) iconHost.innerHTML = '<img class="vc-part-state-icon" src="' + _vcStatusIconUrl(icon) + '" alt="" aria-hidden="true">';
  status.className = 'vc-part-status ' + statusClass;
  status.setAttribute('data-i18n', txtKey);
  status.textContent = (typeof VCi18n !== 'undefined' && VCi18n) ? VCi18n.t(txtKey) : txtKey;
}

// Conjunto das partições selecionadas (1-6).
function vcSelectedPartitions() {
  return Array.prototype.map.call(
    document.querySelectorAll('#vcPartCard1, #vcPartCard2, #vcPartCard3, #vcPartCard4, #vcPartCard5, #vcPartCard6'),
    function (c) { return c.classList.contains('selected') ? parseInt(c.dataset.part, 10) : null; }
  ).filter(function (n) { return n != null; });
}

function _vcOnPartitionClick(card) {
  if (card.classList.contains('unused')) {
    vcShowInfo(VCi18n.t('status.particao_nao_utilizada'));
    return;
  }
  var wasSelected = card.classList.contains('selected');
  document.querySelectorAll('#vcPartCard1, #vcPartCard2, #vcPartCard3, #vcPartCard4, #vcPartCard5, #vcPartCard6').forEach(function (c) {
    if (c !== card) c.classList.remove('selected');
  });
  if (wasSelected) {
    card.classList.remove('selected');
    return;
  }
  card.classList.toggle('selected');
}

function _vcBindPartitionClicks() {
  for (var i = 1; i <= 6; i++) {
    (function (n) {
      var c = document.getElementById('vcPartCard' + n);
      if (c && !c._vcBound) {
        c._vcBound = true;
        c.addEventListener('click', function () { _vcOnPartitionClick(c); });
      }
    })(i);
  }
}

/* ─── INFO MODAL (informativo simples) ────────────────────── */
function vcShowInfo(message, titleKey) {
  var b = document.getElementById('vcInfoBackdrop');
  var body = document.getElementById('vcInfoBody');
  var ttl = document.getElementById('vcInfoTitle');
  if (!b || !body) return;
  body.textContent = message;
  if (ttl && titleKey) {
    ttl.setAttribute('data-i18n', titleKey);
    ttl.textContent = VCi18n.t(titleKey);
  }
  b.classList.add('open');
}
function vcCloseInfo() {
  var b = document.getElementById('vcInfoBackdrop');
  if (b) b.classList.remove('open');
}

/* ─── TIME PICKER (relógio estilo Android) ────────────────── */
var _vcTp = {
  mode: 'hours',      // 'hours' | 'minutes'
  hour: 0,
  minute: 0,
  onConfirm: null,
  bound: false
};

function _vcPad2(n) { return String(n).padStart(2, '0'); }

function vcOpenTimePicker(initial, onConfirm) {
  var b = document.getElementById('vcTpBackdrop');
  if (!b) return;
  var parts = String(initial || '00:00').split(':');
  _vcTp.hour      = Math.max(0, Math.min(23, parseInt(parts[0], 10) || 0));
  _vcTp.minute    = Math.max(0, Math.min(59, parseInt(parts[1], 10) || 0));
  _vcTp.mode      = 'hours';
  _vcTp.onConfirm = onConfirm || null;

  if (!_vcTp.bound) {
    _vcTp.bound = true;
    document.getElementById('vcTpHourBtn').addEventListener('click',   function () { _vcTp.mode = 'hours';   _vcTpRender(); });
    document.getElementById('vcTpMinuteBtn').addEventListener('click', function () { _vcTp.mode = 'minutes'; _vcTpRender(); });
    document.getElementById('vcTpCancelBtn').addEventListener('click', function () { _vcCloseTimePicker(); });
    document.getElementById('vcTpOkBtn').addEventListener('click',     function () {
      var hh = _vcPad2(_vcTp.hour), mm = _vcPad2(_vcTp.minute);
      _vcCloseTimePicker();
      if (typeof _vcTp.onConfirm === 'function') _vcTp.onConfirm(hh + ':' + mm);
    });
  }
  _vcTpRender();
  b.classList.add('open');
}

function _vcCloseTimePicker() {
  var b = document.getElementById('vcTpBackdrop');
  if (b) b.classList.remove('open');
}

function _vcTpRender() {
  // Atualiza header
  var hBtn = document.getElementById('vcTpHourBtn');
  var mBtn = document.getElementById('vcTpMinuteBtn');
  if (hBtn) hBtn.textContent = _vcPad2(_vcTp.hour);
  if (mBtn) mBtn.textContent = _vcPad2(_vcTp.minute);
  if (hBtn) hBtn.classList.toggle('active', _vcTp.mode === 'hours');
  if (mBtn) mBtn.classList.toggle('active', _vcTp.mode === 'minutes');

  var svg = document.getElementById('vcTpSvg');
  if (!svg) return;
  svg.innerHTML = '';
  var cx = 130, cy = 130, rOuter = 100, rInner = 65, rNum = 14;

  // Fundo circular
  var bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bg.setAttribute('cx', cx); bg.setAttribute('cy', cy); bg.setAttribute('r', 120);
  bg.setAttribute('class', 'vc-tp-bg');
  svg.appendChild(bg);

  function ptFor(idx12, r) {
    // idx 0..11 → posição no relógio. 0 no topo, sentido horário.
    var angle = (idx12 * 30 - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  function drawNum(val, idx12, r, mutedClass, isSelected, onClick) {
    var p = ptFor(idx12, r);
    if (isSelected) {
      // ponteiro do centro até o número
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', cx); line.setAttribute('y1', cy);
      line.setAttribute('x2', p.x); line.setAttribute('y2', p.y);
      line.setAttribute('class', 'vc-tp-hand');
      svg.appendChild(line);
      // bolinha selecionada atrás do número
      var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); dot.setAttribute('r', rNum);
      dot.setAttribute('class', 'vc-tp-dot-sel');
      svg.appendChild(dot);
    }
    var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', p.x); t.setAttribute('y', p.y);
    t.setAttribute('class', 'vc-tp-num' + (mutedClass ? ' muted' : '') + (isSelected ? ' selected' : ''));
    t.textContent = String(val);
    if (onClick) t.addEventListener('click', onClick);
    svg.appendChild(t);
  }

  if (_vcTp.mode === 'hours') {
    // Anel externo: 0..11
    for (var h = 0; h <= 11; h++) {
      (function (hh) {
        drawNum(hh, hh, rOuter, false, _vcTp.hour === hh, function () { _vcTp.hour = hh; _vcTp.mode = 'minutes'; _vcTpRender(); });
      })(h);
    }
    // Anel interno: 12..23
    for (var h2 = 12; h2 <= 23; h2++) {
      (function (hh) {
        var idx12 = hh - 12;
        drawNum(hh, idx12, rInner, true, _vcTp.hour === hh, function () { _vcTp.hour = hh; _vcTp.mode = 'minutes'; _vcTpRender(); });
      })(h2);
    }
  } else {
    // Minutos: 60 marcadores em incrementos de 5 (00, 05, ..., 55) no anel externo.
    // Itens entre múltiplos de 5 ainda são clicáveis via toda a área (TODO opcional).
    for (var m = 0; m <= 55; m += 5) {
      (function (mm) {
        var idx12 = mm / 5;
        drawNum(_vcPad2(mm), idx12, rOuter, false, _vcTp.minute === mm, function () { _vcTp.minute = mm; _vcTpRender(); });
      })(m);
    }
  }

  // Pontinho central
  var center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  center.setAttribute('cx', cx); center.setAttribute('cy', cy); center.setAttribute('r', 3);
  center.setAttribute('class', 'vc-tp-dot-center');
  svg.appendChild(center);
}

/* ─── FILTRO DE SENSORES ─────────────────────────────────── */
// Filtros aplicáveis ficam em data-filter no .vc-device para serem
// classificados sem reprocessar a lista. Cada device recebe um conjunto
// de tags (ex.: 'signal_low absent') quando vcAddDevice é chamado;
// ainda não populamos isso (TODO próximo) — por enquanto o filtro só
// esconde devices cuja tag não bate. Sem filtros marcados → mostra tudo.

function _vcFilterItems() {
  var b = document.getElementById('vcFilterBackdrop');
  if (!b) return [];
  return Array.prototype.slice.call(b.querySelectorAll('input[type=checkbox][value]'));
}
function _vcFilterSetMode(mode) {
  var b = document.getElementById('vcFilterBackdrop');
  if (!b) return;
  b.querySelectorAll('.vc-filter-group').forEach(function (group) {
    group.hidden = false;
  });
}
function vcOpenFilter() {
  var b = document.getElementById('vcFilterBackdrop');
  if (!b) return;
  var mode = document.getElementById('vcFilterMode');
  if (mode && !mode._vcBound) {
    mode._vcBound = true;
    mode.addEventListener('change', function () { _vcFilterSetMode(mode.value); });
  }
  _vcFilterSetMode(mode ? mode.value : 'all');
  b.classList.add('open');
}
function vcCloseFilter() {
  var b = document.getElementById('vcFilterBackdrop');
  if (b) b.classList.remove('open');
}
function vcApplyFilter() {
  var items = _vcFilterItems();
  var checked = items.filter(function (i) { return i.checked; }).map(function (i) { return i.value; });
  var mode = document.getElementById('vcFilterMode');
  var typeFilter = mode && mode.value !== 'all' ? mode.value : '';
  var list = document.getElementById('vcDeviceList');
  if (list) {
    // Mostra todos quando nenhum filtro ou todos filtros estão marcados
    // (interpretação intuitiva: "sem filtro" = "todos"; "tudo marcado" =
    // "qualquer coisa serve" → também sem filtro efetivo).
    var showAll = !typeFilter && ((checked.length === 0) || (checked.length === items.length));
    list.querySelectorAll('.vc-device').forEach(function (d) {
      _vcScanRefreshTypeFilterTags(d);
      if (showAll) { d.style.display = ''; return; }
      var tags = (d.dataset.filter || '').split(/\s+/).filter(Boolean);
      var typeOk = !typeFilter || tags.indexOf(typeFilter) >= 0;
      var conditionOk = (checked.length === 0) || (checked.length === items.length) ||
        checked.some(function (c) { return tags.indexOf(c) >= 0; });
      var ok = typeOk && conditionOk;
      d.style.display = ok ? '' : 'none';
    });
  }
  vcCloseFilter();
}

function _vcScanRefreshTypeFilterTags(deviceEl) {
  if (!deviceEl) return;
  var tags = (deviceEl.dataset.filter || '').split(/\s+/).filter(Boolean).filter(function (tag) {
    return tag.indexOf('type_') !== 0;
  });
  var typeEl = deviceEl.querySelector('.vc-device-type-value');
  var tipo = typeEl && typeEl.dataset ? typeEl.dataset.vcType : '';
  tags = tags.concat(_vcScanFilterTypeTags(tipo));
  deviceEl.dataset.filter = Array.from(new Set(tags)).join(' ');
}

function _vcScanFilterTypeTags(tipo) {
  var raw = String(tipo || '').trim().toUpperCase();
  var tags = [];
  if (!raw) return tags;
  if (raw === 'PLG' || raw === 'INT') tags.push('type_pgm');
  if (raw === 'P' || raw === 'PLR') tags.push('type_presence_internal');
  if (raw === 'REP') tags.push('type_presence_external');
  if (raw === 'SIR') tags.push('type_siren');
  if (raw === 'CR4' || raw === 'CR8') tags.push('type_remote');
  if (raw === 'TEC') tags.push('type_keyboard');
  if (raw === 'A') tags.push('type_opening');
  if (raw === 'SHX') tags.push('type_shox');
  if (raw === 'TLR') tags.push('type_transmitter');
  if (raw === 'BP') tags.push('type_panic');
  return tags;
}

/* ─── STATUS: DEVICES ─────────────────────────────────────── */
function vcSetDeviceAbsent(id, absent) {
  var el = document.getElementById(id);
  if (el) {
    el.classList.toggle('absent', absent);
    var tags = (el.dataset.filter || '').split(/\s+/).filter(Boolean);
    if (absent && tags.indexOf('absent') < 0) tags.push('absent');
    if (!absent) tags = tags.filter(function (t) { return t !== 'absent'; });
    el.dataset.filter = Array.from(new Set(tags)).join(' ');
  }
}

function _vcBindScanDragScroll() {
  var el = document.getElementById('vcDeviceList');
  if (!el || el._vcDragScrollBound) return;
  el._vcDragScrollBound = true;
  var down = false;
  var dragging = false;
  var startX = 0;
  var startY = 0;
  var startLeft = 0;
  var startTop = 0;

  function stop() {
    down = false;
    dragging = false;
    el.classList.remove('dragging');
  }

  el.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    if (e.target && e.target.closest && e.target.closest('button, input, select, textarea, a')) return;
    down = true;
    dragging = false;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = el.scrollLeft;
    startTop = el.scrollTop;
  });

  window.addEventListener('mousemove', function (e) {
    if (!down) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (!dragging && Math.abs(dx) + Math.abs(dy) < 4) return;
    dragging = true;
    el.classList.add('dragging');
    el.scrollLeft = startLeft - dx;
    el.scrollTop = startTop - dy;
    e.preventDefault();
  });

  window.addEventListener('mouseup', stop);
  window.addEventListener('blur', stop);
}

function vcBatHTML(voltage, pct) {
  var low = pct < 40;
  return voltage + ' <span class="vc-bat' + (low ? ' low' : '') + '"><span class="fill" style="width:' + pct + '%"></span></span>';
}

var VC_SCAN_NOT_APPLICABLE = 'Não aplicavel';
var VC_SCAN_NOT_APPLICABLE_COMPACT = 'NP';

function _vcIsScanCompact() {
  var list = document.getElementById('vcDeviceList');
  if (list) return list.classList.contains('compact');
  var sw = document.getElementById('vcToggleScan');
  return !!(sw && !sw.checked);
}

function _vcScanNotApplicableText() {
  return _vcIsScanCompact() ? VC_SCAN_NOT_APPLICABLE_COMPACT : VC_SCAN_NOT_APPLICABLE;
}

function _vcRefreshScanNotApplicableLabels() {
  document.querySelectorAll('[data-vc-na="1"]').forEach(function (el) {
    el.textContent = _vcScanNotApplicableText();
  });
}

function _vcFormatScanPartitions(mask) {
  var raw = String(mask || '').trim();
  if (!raw || raw === '---') return '---';
  var parts = [];
  for (var i = 0; i < raw.length; i++) {
    var ch = raw.charAt(i);
    if (/^[1-6]$/.test(ch) && parts.indexOf(ch) < 0) parts.push(ch);
  }
  return parts.length ? parts.join('-') : '---';
}

function _vcScanTypeRules(tipoRaw) {
  var info = _vcDevTypeInfo(tipoRaw);
  var kind = info && info.knownKind;
  var raw = String(tipoRaw || '').trim();
  var rules = { na: {}, dash: {} };

  function na() {
    Array.prototype.slice.call(arguments).forEach(function (field) { rules.na[field] = true; });
  }
  function dash() {
    Array.prototype.slice.call(arguments).forEach(function (field) { rules.dash[field] = true; });
  }

  if (raw === 'CR4' || raw === 'CR8') {
    na('Status', 'Tamper');
    dash('Temporizado', 'H24', 'Silencioso');
  } else if (kind === 'pir') {
    na('Status');
  } else if (kind === 'pgm') {
    na('Status', 'Tamper');
    dash('H24', 'Temporizado', 'Silencioso');
  } else if (kind === 'sirene') {
    na('Status', 'Tamper');
    dash('H24', 'Temporizado', 'Silencioso');
  } else if (kind === 'teclado') {
    na('Status');
    dash('H24', 'Temporizado', 'Silencioso');
  } else if (kind === 'wired') {
    na('Tamper', 'Rssi');
    dash('Inibido');
  }

  return rules;
}

function _vcApplyScanDisplayRulesToData(num, d) {
  var out = Object.assign({}, d || {});
  var rules = _vcScanTypeRules(out.tipo);

  out.particao = _vcFormatScanPartitions(out.particao);
  Object.keys(rules.na).forEach(function (field) {
    var key = field === 'H24' ? 'h24' : field.charAt(0).toLowerCase() + field.slice(1);
    if (field === 'Rssi') key = 'rssi';
    out[key] = VC_SCAN_NOT_APPLICABLE;
  });
  Object.keys(rules.dash).forEach(function (field) {
    var key = field === 'H24' ? 'h24' : field.charAt(0).toLowerCase() + field.slice(1);
    out[key] = '---';
  });

  return out;
}

function _vcScanRulesForDeviceId(id) {
  var typeEl = document.getElementById('vcDev' + id + 'Tipo');
  return _vcScanTypeRules(typeEl && typeEl.dataset ? typeEl.dataset.vcType : '');
}

var _vcStatusScanState = {
  devices: [],
  byId: {},
  byZone: {},
  absentZones: {}
};

function _vcScanStateReset() {
  _vcStatusScanState.devices = [];
  _vcStatusScanState.byId = {};
  _vcStatusScanState.byZone = {};
}

function _vcScanStatePlain(value) {
  return String(value == null ? '' : value)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function _vcScanZoneKey(value) {
  var n = parseInt(String(value || '').replace(/\D+/g, ''), 10);
  return isNaN(n) ? String(value || '').trim() : String(n).padStart(3, '0');
}

function _vcScanStateSetDevice(num, d) {
  var idx = parseInt(num, 10);
  var id = String(num).padStart(3, '0');
  var zone = _vcScanZoneKey(d.zona || id);
  var item = {
    idx: isNaN(idx) ? _vcStatusScanState.devices.length + 1 : idx,
    id: id,
    name: d.name || '---',
    zone: d.zona || id,
    type: d.tipo || '---',
    version: d.versao || '---',
    partition: d.particao || '---',
    battery: d.bateria || '---',
    rssi: d.rssi || '---',
    status: d.status || '---',
    tamper: d.tamper || '---',
    absent: !!d.absent || !!_vcStatusScanState.absentZones[zone]
  };
  _vcStatusScanState.byId[id] = item;
  _vcStatusScanState.byZone[zone] = item;
  _vcStatusScanState.devices.push(item);
}

function _vcScanStatePatchDevice(idx, patch) {
  var id = String(idx).padStart(3, '0');
  var item = _vcStatusScanState.byId[id];
  if (!item) return;
  Object.keys(patch || {}).forEach(function (k) {
    if (patch[k] !== undefined && patch[k] !== null && patch[k] !== '') item[k] = patch[k];
  });
}

function _vcScanStateMarkAbsentByZone(zone, absent) {
  var zoneKey = _vcScanZoneKey(zone);
  if (absent) _vcStatusScanState.absentZones[zoneKey] = true;
  else delete _vcStatusScanState.absentZones[zoneKey];
  var item = _vcStatusScanState.byZone[zoneKey];
  if (!item) return false;
  item.absent = !!absent;
  vcSetDeviceAbsent('vcDevice' + item.id, !!absent);
  return true;
}

function _vcScanStateClearAbsentByIdx(idx) {
  var item = _vcStatusScanState.byId[String(idx).padStart(3, '0')];
  if (!item) return;
  _vcScanStateMarkAbsentByZone(item.zone, false);
}

function _vcScanStateDevicesForExport() {
  return (_vcStatusScanState.devices || []).map(function (d, i) {
    return {
      idx:       d.idx == null ? i + 1 : d.idx,
      name:      d.name || '',
      zone:      d.zone || '',
      type:      d.type || '',
      version:   d.version || '',
      partition: d.partition || '',
      battery:   d.battery || '',
      rssi:      d.rssi || '',
      status:    d.status || '',
      tamper:    d.tamper || ''
    };
  });
}

function _vcScanStateRestore(devices, absentZones) {
  _vcScanStateReset();
  if (absentZones && typeof absentZones === 'object') {
    _vcStatusScanState.absentZones = Object.assign({}, absentZones);
  }
  (Array.isArray(devices) ? devices : []).forEach(function (d, i) {
    var id = String(d.id || d.idx || i + 1).padStart(3, '0');
    var item = {
      idx: d.idx == null ? i + 1 : d.idx,
      id: id,
      name: d.name || '---',
      zone: d.zone || id,
      type: d.type || '---',
      version: d.version || '---',
      partition: d.partition || '---',
      battery: d.battery || '---',
      rssi: d.rssi || '---',
      status: d.status || '---',
      tamper: d.tamper || '---',
      absent: !!d.absent || !!_vcStatusScanState.absentZones[_vcScanZoneKey(d.zone || id)]
    };
    _vcStatusScanState.devices.push(item);
    _vcStatusScanState.byId[id] = item;
    _vcStatusScanState.byZone[_vcScanZoneKey(item.zone)] = item;
  });
}

function vcAddDevice(num, d) {
  d = _vcApplyScanDisplayRulesToData(num, d);
  if (_vcStatusScanState.absentZones[_vcScanZoneKey(d.zona || num)]) d.absent = true;
  _vcScanStateSetDevice(num, d);
  var id = String(num).padStart(3, '0');
  var el = document.getElementById('vcDeviceList');
  if (!el) return null;
  var div = document.createElement('div');
  div.className = 'vc-device' + (d.absent ? ' absent' : '');
  div.id = 'vcDevice' + id;

  // Tags para o filtro lateral (valores correspondem a value=
  // dos checkboxes em vcFilterBackdrop). Mais tags vêm com STAT 1/2/3.
  var tags = [];
  if (d.absent) tags.push('absent');
  if (d.inibido === VCi18n.t('common.yes')) tags.push('inhibited');
  tags = tags.concat(_vcScanFilterTypeTags(d.tipo));
  // Bateria/Sinal/Tamper: pendente quando STAT 1/2/3 forem consumidos.
  div.dataset.filter = tags.join(' ');

  function L(key) { return VCi18n.t('scan.' + key); }
  div.innerHTML =
    '<div class="vc-device-name" id="vcDev' + id + 'Name">' + (d.name || '---') + '</div>' +
    '<button class="vc-card-refresh-btn vc-device-refresh-btn vc-device-refresh-compact-btn" type="button" data-device-idx="' + num + '"' +
            ' aria-label="Atualizar dispositivo ' + id + '" title="Atualizar dispositivo">' +
      '<i class="bi bi-arrow-clockwise"></i>' +
    '</button>' +
    '<div class="vc-device-grid">' +
      rowName(L('nome'),    'vcDev' + id + 'NomeDisp',  d.name, num, id) +
      row(L('bateria'),     'vcDev' + id + 'Bateria',    d.bateria) +
      row(L('inibido'),     'vcDev' + id + 'Inibido',    d.inibido) +
      row(L('zona'),        'vcDev' + id + 'Zona',       d.zona) +
      row(L('status'),      'vcDev' + id + 'Status',     d.status) +
      row(L('h24'),         'vcDev' + id + 'H24',        d.h24) +
      rowType(L('tipo'),    'vcDev' + id + 'Tipo',       d.tipo) +
      row(L('tamper'),      'vcDev' + id + 'Tamper',     d.tamper) +
      row(L('temporizado'), 'vcDev' + id + 'Temporizado',d.temporizado) +
      row(L('versao'),      'vcDev' + id + 'Versao',     d.versao) +
      row(L('rssi'),        'vcDev' + id + 'Rssi',       d.rssi) +
      row(L('silencioso'),  'vcDev' + id + 'Silencioso', d.silencioso) +
      row(L('particao'),    'vcDev' + id + 'Particao',   d.particao) +
      '<span class="lbl"></span><span class="val empty"></span>' +
      '<span class="lbl"></span><span class="val empty"></span>' +
    '</div>' +
    '<div class="vc-absent-overlay">' + VCi18n.t('common.absent') + '</div>';
  el.appendChild(div);
  return div;
}

function row(label, id, val) {
  if (val === VC_SCAN_NOT_APPLICABLE) {
    return '<span class="lbl">' + label + '</span><span class="val" id="' + id + '" data-vc-na="1">' + _vcScanNotApplicableText() + '</span>';
  }
  return '<span class="lbl">' + label + '</span><span class="val" id="' + id + '">' + (val || '---') + '</span>';
}

function rowName(label, id, val, idx, displayId) {
  return '<span class="lbl">' + label + '</span>' +
         '<span class="val vc-device-name-field" id="' + id + '">' +
           '<span class="vc-device-name-text">' + (val || '---') + '</span>' +
           '<button class="vc-card-refresh-btn vc-device-refresh-btn vc-device-refresh-inline-btn" type="button" data-device-idx="' + idx + '"' +
                   ' aria-label="Atualizar dispositivo ' + displayId + '" title="Atualizar dispositivo">' +
             '<i class="bi bi-arrow-clockwise"></i>' +
           '</button>' +
         '</span>';
}

function rowType(label, id, val) {
  var type = val || '---';
  return '<span class="lbl">' + label + '</span>' +
         '<span class="val vc-device-type-value" id="' + id + '" data-vc-type="' + _vcEscape(type) + '">' +
           _vcScanTypeValueHTML(type) +
         '</span>';
}

function _vcScanAssetUrl(path) {
  var base = (window.location.pathname || '').replace(/\\/g, '/').indexOf('/screens/') >= 0 ? '../' : './';
  return base + String(path || '').split('/').map(encodeURIComponent).join('/');
}

function _vcScanTypeIconSrc(type) {
  var name = String(type || '').trim();
  if (!name || name === '---') return '';
  return _vcScanAssetUrl('assets/icons/scan/' + name.toLowerCase() + '.svg');
}

function _vcScanTypeValueHTML(type) {
  var value = type || '---';
  var icon = _vcScanTypeIconSrc(value);
  return '<span class="vc-device-type-text">' + _vcEscape(value) + '</span>' +
    (icon
      ? '<img class="vc-device-type-icon" src="' + icon + '" alt="" aria-hidden="true" onerror="this.hidden=true">'
      : '');
}

function _vcScanIconValueHTML(value, iconName) {
  var text = value == null || value === '' ? '---' : String(value);
  var icon = iconName ? _vcScanAssetUrl('assets/icons/scan/' + iconName + '.svg') : '';
  var iconClass = iconName ? ' vc-device-value-icon-' + String(iconName).replace(/[^a-z0-9]+/gi, '-').toLowerCase() : '';
  return '<span class="vc-device-value-text">' + _vcEscape(text) + '</span>' +
    (icon
      ? '<span class="vc-device-value-icon-slot"><img class="vc-device-value-icon' + iconClass + '" src="' + icon + '" alt="" aria-hidden="true" onerror="this.hidden=true"></span>'
      : '');
}

function vcClearDevices() {
  _vcScanStateReset();
  var el = document.getElementById('vcDeviceList');
  if (el) el.innerHTML = '';
}

function vcRemoveDevice(id) {
  var el = document.getElementById(id);
  if (el) el.remove();
}

/* ─── LOGGER ──────────────────────────────────────────────── */
// Resolve qual logger usar:
//  - na tela Status (full-width logger): #vcLoggerBody
//  - no modal de Conexão: depende da aba ativa (#vcLoggerBody local ou
//    #vcLoggerBodyRemoto)
function _vcLoggerEl() {
  var remotePanel = document.getElementById('vcPanelRemota');
  if (remotePanel && remotePanel.classList.contains('active')) {
    var rem = document.getElementById('vcLoggerBodyRemoto');
    if (rem) return rem;
  }
  return document.getElementById('vcLoggerBody');
}

// Flag global de auto-scroll do logger (persiste em localStorage).
// Default: ligado.
function _vcLogAutoScroll() {
  try { return localStorage.getItem('vc_log_autoscroll') !== '0'; }
  catch (_) { return true; }
}
function _vcSetLogAutoScroll(on) {
  try { localStorage.setItem('vc_log_autoscroll', on ? '1' : '0'); } catch (_) {}
}

function vcLog(text) {
  var el = _vcLoggerEl();
  if (!el) return;
  el.textContent += text + '\n';
  if (_vcLogAutoScroll()) el.scrollTop = el.scrollHeight;
}
function vcClearLog() {
  var el = _vcLoggerEl();
  if (el) {
    el.textContent = '';
    // Solta o data-i18n="modal.aguardando" para o engine não sobrescrever
    // o histórico ao trocar de idioma.
    el.removeAttribute('data-i18n');
  }
}

/* ─── LISTA DE CENTRAIS ───────────────────────────────────── */
function vcAddCentral(id, text, meta) {
  var list = document.getElementById('vcConnList');
  if (!list) return null;
  var existing = document.getElementById(id);
  if (existing) return existing;
  var row = document.createElement('div');
  row.className = 'vc-conn-row';
  row.id = id;
  row.textContent = text;
  if (meta) {
    if (meta.ip)  row.dataset.ip  = meta.ip;
    if (meta.raw) row.dataset.raw = meta.raw;
    if (meta.generation) row.dataset.generation = meta.generation;
  }
  row.onclick = function () {
    list.querySelectorAll('.vc-conn-row').forEach(function (r) { r.classList.remove('selected'); });
    row.classList.add('selected');
    _vcMaybeFillPasswordForRow(row);
  };
  list.appendChild(row);
  return row;
}

// Sincroniza o campo de senha com a central selecionada:
//   - Se a central tem senha salva no storage e o campo está vazio ou
//     contém uma senha auto-preenchida anteriormente → preenche com a salva.
//   - Se a central NÃO tem senha salva e o campo contém uma senha
//     auto-preenchida (de outra central) → limpa.
//   - Se o usuário digitou senha manualmente (input.value diferente do
//     que foi auto-preenchido), preserva.
function _vcMaybeFillPasswordForRow(row) {
  if (!window.vettiAPI || !window.vettiAPI.storage) return;
  var input = document.getElementById('vcInputSenha');
  if (!input) return;

  var isAutoFilled = (input.value === '' || input.value === input._vcLastFilled);
  var raw = (row && row.dataset && row.dataset.raw) || '';
  var m = /\b([0-9A-F]{2}(?:[-:][0-9A-F]{2}){5})\b/i.exec(raw);

  // Sem MAC identificável — só zera se o valor atual foi auto-preenchido.
  if (!m) {
    if (isAutoFilled) { input.value = ''; input._vcLastFilled = ''; }
    return;
  }

  window.vettiAPI.storage.get('credentials.' + m[1].toUpperCase()).then(function (cred) {
    if (!isAutoFilled) return; // usuário digitou algo, preserva
    if (cred && cred.password) {
      input.value = cred.password;
      input._vcLastFilled = cred.password;
    } else {
      // Esta central não tem senha salva — limpa o que veio de outra.
      input.value = '';
      input._vcLastFilled = '';
    }
  }).catch(function () {});
}
function vcClearCentrais() {
  var el = document.getElementById('vcConnList');
  if (el) el.innerHTML = '';
}

/* ─── DISCOVERY UDP ───────────────────────────────────────── */

// Cache de broadcasts conhecidos; preenchido por vcPopulateInterfaces.
var _vcBroadcasts = [];
var _vcDiscoveryRunning = false;

function vcFormatTimestamp() {
  var now = new Date();
  var day   = String(now.getDate()).padStart(2, '0');
  var month = String(now.getMonth() + 1).padStart(2, '0');
  var year  = now.getFullYear();
  var time  = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  return day + '/' + month + '/' + year + ' ' + time;
}

function vcLogTs(text) {
  vcLog('[' + vcFormatTimestamp() + '] ' + text);
}

/* ─── TOAST ───────────────────────────────────────────────────
   Notificações temporárias no canto inferior direito da tela.
   type = 'info' (default) | 'success' | 'warn' | 'error'
   opts = {
     id:      identificador único — toast com mesmo id substitui o anterior
              (útil para progresso: 'loading...' → 'pronto')
     persist: true = não some sozinho; precisa ser fechado por outra
              chamada com mesmo id ou por vcToastClose(id)
   }
   ─────────────────────────────────────────────────────────── */
function vcToast(msg, type, durationMs, opts) {
  type = type || 'info';
  opts = opts || {};
  if (typeof durationMs !== 'number') durationMs = 4000;
  var host = document.getElementById('vcToastHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'vcToastHost';
    host.className = 'vc-toast-host';
    document.body.appendChild(host);
  }
  // Remove toast pré-existente com o mesmo id
  if (opts.id) {
    var existing = host.querySelector('[data-toast-id="' + opts.id + '"]');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  }
  var t = document.createElement('div');
  t.className = 'vc-toast vc-toast-' + type;
  if (opts.id) t.dataset.toastId = opts.id;
  var icon = type === 'success' ? 'bi-check-circle-fill'
           : type === 'warn'    ? 'bi-exclamation-triangle-fill'
           : type === 'error'   ? 'bi-x-octagon-fill'
           : opts.persist       ? 'bi-arrow-repeat'  // spinner-ish
           :                       'bi-info-circle-fill';
  t.innerHTML = '<i class="bi ' + icon + (opts.persist ? ' vc-toast-spin' : '') + '"></i>' +
                '<span>' + _vcEscape(msg) + '</span>';
  host.appendChild(t);
  if (!opts.persist) {
    setTimeout(function () { t.classList.add('vc-toast-leaving'); }, durationMs - 250);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, durationMs);
  }
}

function vcToastClose(id) {
  var host = document.getElementById('vcToastHost');
  if (!host || !id) return;
  var t = host.querySelector('[data-toast-id="' + id + '"]');
  if (t && t.parentNode) t.parentNode.removeChild(t);
}

/* Modal de confirmação reutilizável. Retorna Promise<boolean>.
   Substitui window.confirm() em fluxos críticos (exclusão, descartar
   alterações). Visual segue tokens vc-* — sem alertas nativos feios.
   Opts: { title, message, okLabel, cancelLabel, danger:boolean,
           subMessage (opcional, ⚠ destaque vermelho) }                  */
function vcConfirm(opts) {
  opts = opts || {};
  return new Promise(function (resolve) {
    var host = document.getElementById('vcConfirmHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'vcConfirmHost';
      document.body.appendChild(host);
    }
    var backdrop = document.createElement('div');
    backdrop.className = 'vc-confirm-backdrop';
    var title  = opts.title       || '';
    var msg    = opts.message     || '';
    var sub    = opts.subMessage  || '';
    var okLbl  = opts.okLabel     || VCi18n.t('common.confirm') || 'Confirmar';
    var caLbl  = opts.cancelLabel || VCi18n.t('common.cancel')  || 'Cancelar';
    var okCls  = opts.danger ? 'vc-btn danger' : 'vc-btn';
    backdrop.innerHTML =
      '<div class="vc-confirm-box" role="dialog" aria-modal="true">' +
        (title ? '<div class="vc-confirm-title">' + _vcEscape(title) + '</div>' : '') +
        '<div class="vc-confirm-body">' + _vcEscape(msg) + '</div>' +
        (sub ? '<div class="vc-confirm-sub"><i class="bi bi-exclamation-triangle-fill"></i> ' +
               _vcEscape(sub) + '</div>' : '') +
        '<div class="vc-confirm-actions">' +
          '<button type="button" class="vc-btn outline" data-act="cancel">' + _vcEscape(caLbl) + '</button>' +
          '<button type="button" class="' + okCls + '" data-act="ok">' + _vcEscape(okLbl) + '</button>' +
        '</div>' +
      '</div>';
    host.appendChild(backdrop);
    function close(v) {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      document.removeEventListener('keydown', onKey);
      resolve(v);
    }
    function onKey(e) {
      if (e.key === 'Escape') close(false);
      else if (e.key === 'Enter') close(true);
    }
    document.addEventListener('keydown', onKey);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close(false);
    });
    backdrop.querySelector('[data-act="ok"]').addEventListener('click', function () { close(true); });
    backdrop.querySelector('[data-act="cancel"]').addEventListener('click', function () { close(false); });
    // Foca o botão default (OK) pra Enter funcionar imediatamente.
    setTimeout(function () { backdrop.querySelector('[data-act="ok"]').focus(); }, 30);
  });
}

function vcRenderLogEvent(ev) {
  var ts = ev.ts || vcFormatTimestamp();
  if (ev.kind === 'sent') {
    vcLog('[' + ts + '] ' + VCi18n.t('discovery.log_sent') + ' ' + ev.payload);
  } else if (ev.kind === 'received') {
    vcLog('[' + ts + '] ' + VCi18n.t('discovery.log_received', {
      payload: ev.payload,
      ip: (ev.peer && ev.peer.ip) || '?',
      port: (ev.peer && ev.peer.port) || '?'
    }));
  } else if (ev.kind === 'error') {
    vcLog('[' + ts + '] ' + VCi18n.t('discovery.log_error', { msg: ev.error }));
  }
}

async function vcPopulateInterfaces() {
  var sel = document.getElementById('vcSelectInterface');
  if (!sel) return;
  vcLogTs(VCi18n.t('discovery.searching_interfaces'));

  var ifaces = [];
  try {
    ifaces = await window.vettiAPI.network.listInterfaces();
  } catch (err) {
    vcLogTs(VCi18n.t('discovery.error', { msg: String((err && err.message) || err) }));
    return;
  }
  _vcBroadcasts = ifaces.map(function (i) { return i.broadcast; });

  // Reconstrói o select preservando "Automático" como primeira opção.
  sel.innerHTML = '';
  var optAuto = document.createElement('option');
  optAuto.value = 'all';
  optAuto.selected = true;
  optAuto.setAttribute('data-i18n', 'modal.interface_auto');
  optAuto.textContent = VCi18n.t('modal.interface_auto');
  sel.appendChild(optAuto);

  if (ifaces.length === 0) {
    vcLogTs(VCi18n.t('discovery.no_interfaces'));
    return;
  }
  ifaces.forEach(function (i) {
    var opt = document.createElement('option');
    opt.value = i.broadcast;
    opt.textContent = VCi18n.t('discovery.iface_label', { name: i.name, broadcast: i.broadcast });
    sel.appendChild(opt);
  });
}

function vcSelectedBroadcasts() {
  var sel = document.getElementById('vcSelectInterface');
  if (!sel) return _vcBroadcasts.slice();
  var v = sel.value;
  if (!v || v === 'all') return _vcBroadcasts.slice();
  return [v];
}

async function vcStartDiscovery() {
  if (_vcDiscoveryRunning) return;
  var btn = document.getElementById('vcBtnProcurar');
  vcClearCentrais();
  vcClearLog();
  vcLogTs(VCi18n.t('discovery.searching'));
  if (btn) btn.disabled = true;
  _vcDiscoveryRunning = true;

  var bcasts = vcSelectedBroadcasts();
  try {
    await window.vettiAPI.network.discover(bcasts);
  } catch (err) {
    vcLogTs(VCi18n.t('discovery.error', { msg: String((err && err.message) || err) }));
    _vcDiscoveryRunning = false;
    if (btn) btn.disabled = false;
  }
  // O onDiscoveryDone reabilita o botão no fluxo normal.
}

// Mapa código de erro → chave i18n (ver §8.5 do protocolo VettiConfig).
var _VC_ERR_KEYS = {
  7:  'discovery.err_invalid_password',
  8:  'discovery.err_unknown_command',
  17: 'discovery.err_param1',
  18: 'discovery.err_param2',
  19: 'discovery.err_param3',
  24: 'discovery.err_zone_open',
  27: 'discovery.err_end_db'
};

function vcErrorMessage(code) {
  var key = _VC_ERR_KEYS[code];
  if (key) return VCi18n.t(key);
  return VCi18n.t('discovery.err_other', { code: code });
}

// Quando a resposta tem ERR mas sem código numérico, tenta interpretar
// padrões conhecidos do body. Hoje cobre PSW (autenticação):
//   "PSW ERR Tent=1 Tmr=0s" → "Senha inválida (tentativa 1)"
function vcErrorMessageFromBody(body) {
  var m = /^PSW\s+ERR(?:\s+Tent=(\d+))?(?:\s+Tmr=(\S+))?/i.exec(body || '');
  if (m) {
    return VCi18n.t('discovery.err_invalid_password_attempts', {
      tent: m[1] || '?',
      tmr:  m[2] || '0s'
    });
  }
  return body || VCi18n.t('common.error');
}

async function vcOnConectarLocal() {
  var selected = document.querySelector('#vcConnList .vc-conn-row.selected');
  if (!selected) {
    vcLogTs(VCi18n.t('discovery.connect_select_first'));
    return;
  }
  var senhaEl = document.getElementById('vcInputSenha');
  var senha = (senhaEl && senhaEl.value) || '';
  if (!senha) {
    vcLogTs(VCi18n.t('discovery.connect_password_required'));
    return;
  }
  if (!/^\d{4}$/.test(senha)) {
    vcLogTs(VCi18n.t('discovery.connect_password_format'));
    return;
  }

  var ip = selected.dataset.ip || '';
  var btn = document.getElementById('vcBtnConectar');
  vcLogTs(VCi18n.t('discovery.connect_authenticating', { ip: ip }));
  if (btn) btn.disabled = true;

  try {
    var resp = await window.vettiAPI.network.authenticate(ip, senha);
    if (resp && resp.ok) {
      vcLogTs(VCi18n.t('discovery.connect_authenticated', { ip: ip }));
      // Persiste a central conectada para a próxima tela ler.
      try {
        sessionStorage.setItem('vcConnectedCentral', JSON.stringify({
          ip: ip,
          raw: selected.dataset.raw || '',
          name: selected.textContent || '',
          generation: selected.dataset.generation || _vcDetectGenerationFromRaw(selected.dataset.raw || '')
        }));
      } catch (_) {}
      // Persiste senha por MAC pra preencher automaticamente na próxima conexão.
      var rawForMac = selected.dataset.raw || '';
      var macMatch = /\b([0-9A-F]{2}(?:[-:][0-9A-F]{2}){5})\b/i.exec(rawForMac);
      if (macMatch && window.vettiAPI && window.vettiAPI.storage) {
        try { window.vettiAPI.storage.set('credentials.' + macMatch[1].toUpperCase(), { password: senha }); } catch (_) {}
      }
      // Pequeno delay para o usuário ver a confirmação no log antes de navegar.
      setTimeout(function () {
        vcCloseModal();
        window.location.href = 'screens/vetticonfig-status.html';
      }, 600);
      return;
    } else if (resp && resp.errorCode !== undefined && resp.errorCode !== null) {
      // Erro com código numérico (ex.: ERR 7 — em outros frames).
      vcLogTs(VCi18n.t('discovery.connect_failed', { msg: vcErrorMessage(resp.errorCode) }));
    } else if (resp && resp.body && /\bERR\b/i.test(resp.body)) {
      // Erro sem código numérico — interpreta o body (ex.: "PSW ERR Tent=1").
      vcLogTs(VCi18n.t('discovery.connect_failed', { msg: vcErrorMessageFromBody(resp.body) }));
    } else if (resp && resp.error === 'timeout') {
      vcLogTs(VCi18n.t('discovery.connect_timeout'));
    } else {
      var msg = (resp && resp.error) || 'unknown';
      vcLogTs(VCi18n.t('discovery.connect_failed', { msg: msg }));
    }
  } catch (err) {
    vcLogTs(VCi18n.t('discovery.connect_failed', { msg: String((err && err.message) || err) }));
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ─── CONEXÃO REMOTA ──────────────────────────────────────── */

function _val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
function _setVal(id, v) { var el = document.getElementById(id); if (el) el.value = (v == null ? '' : String(v)); }

/* Persistência das conexões remotas.
 *
 * HISTÓRICO: até 2026-05-19 vivia em `localStorage['vc_remote_connections']`.
 * Esse storage (LevelDB do renderer Chromium) se mostrou frágil — perdemos
 * a lista uma vez sem causa identificada. Agora a fonte de verdade é o
 * storage IPC (config.json em userData), que tem write atômico + backup
 * rotativo (ver src/main/services/storage.js). Mantemos cache in-memory
 * pra manter `vcRemoteListGet/Save` síncronos (caller não muda).
 *
 * Identificador único = MAC (uppercase, sem separador). Ordem da lista
 * = inserção mais recente primeiro.
 */
var VC_REMOTES_KEY      = 'vc_remote_connections';  // legacy localStorage
var VC_REMOTES_STORE_KEY = 'remote_connections';    // chave nova no config.json

// Cache in-memory. null = ainda não inicializado. Após vcRemoteListEnsureLoaded
// vira sempre um array (vazio se nada salvo).
var _vcRemoteCache = null;
var _vcRemoteLoadPromise = null;

function _vcMacNormalize(mac) {
  var m = String(mac || '').replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  return m.length === 12 ? m : '';
}

// Migração + carga inicial. Idempotente — pode ser chamada várias vezes
// (a partir da segunda só devolve a Promise existente). Chamada uma vez
// no DOMContentLoaded.
function vcRemoteListEnsureLoaded() {
  if (_vcRemoteCache !== null) return Promise.resolve(_vcRemoteCache);
  if (_vcRemoteLoadPromise)    return _vcRemoteLoadPromise;
  _vcRemoteLoadPromise = (async function () {
    var arr = null;
    if (window.vettiAPI && window.vettiAPI.storage) {
      try { arr = await window.vettiAPI.storage.get(VC_REMOTES_STORE_KEY); } catch (_) {}
    }
    // Migração one-shot do localStorage (caso o usuário tenha dados
    // antigos lá e nada ainda no config.json).
    if (!Array.isArray(arr) || arr.length === 0) {
      try {
        var raw = localStorage.getItem(VC_REMOTES_KEY);
        if (raw) {
          var legacy = JSON.parse(raw);
          if (Array.isArray(legacy) && legacy.length > 0) {
            arr = legacy;
            if (window.vettiAPI && window.vettiAPI.storage) {
              try { await window.vettiAPI.storage.set(VC_REMOTES_STORE_KEY, arr); } catch (_) {}
            }
            try { localStorage.removeItem(VC_REMOTES_KEY); } catch (_) {}
          }
        }
      } catch (_) {}
    }
    _vcRemoteCache = Array.isArray(arr) ? arr : [];
    return _vcRemoteCache;
  })();
  return _vcRemoteLoadPromise;
}

function vcRemoteListGet() {
  // Leitura síncrona do cache. Se ainda não carregado, devolve [] e
  // dispara o load em background — UI vai atualizar quando o cache
  // resolver (componentes chamam vcRemoteRenderList de novo).
  if (_vcRemoteCache !== null) return _vcRemoteCache;
  vcRemoteListEnsureLoaded().then(function () {
    if (typeof vcRemoteRenderList === 'function') vcRemoteRenderList();
  });
  return [];
}

function vcRemoteListSave(arr) {
  _vcRemoteCache = (arr || []).slice();
  if (window.vettiAPI && window.vettiAPI.storage) {
    // Fire-and-forget: cache já atualizado, escrita persistente é assíncrona.
    window.vettiAPI.storage.set(VC_REMOTES_STORE_KEY, _vcRemoteCache).catch(function () {});
  }
}
function vcRemoteListUpsert(entry) {
  var key = _vcMacNormalize(entry && entry.mac);
  if (!key) return false;
  var list = vcRemoteListGet().filter(function (e) {
    return _vcMacNormalize(e.mac) !== key;
  });
  list.unshift({
    mac:    entry.mac,
    conta:  entry.conta,
    url:    entry.url,
    porta:  entry.porta,
    nome:   entry.nome || '',
    senha:  entry.senha || ''
  });
  vcRemoteListSave(list);
  return true;
}
function vcRemoteListRemove(mac) {
  var key = _vcMacNormalize(mac);
  if (!key) return;
  var list = vcRemoteListGet().filter(function (e) {
    return _vcMacNormalize(e.mac) !== key;
  });
  vcRemoteListSave(list);
}

function vcRemoteRenderList() {
  var box = document.getElementById('vcSavedList');
  if (!box) return;
  var list = vcRemoteListGet();
  if (list.length === 0) {
    box.innerHTML = '<div class="vc-remote-empty" data-i18n="modal.saved_empty">' +
      VCi18n.t('modal.saved_empty') + '</div>';
    return;
  }
  box.innerHTML = '';
  list.forEach(function (e) {
    var row = document.createElement('div');
    row.className = 'vc-saved-row';
    row.dataset.mac = _vcMacNormalize(e.mac);
    var label = (e.nome || '').trim() || e.mac;
    var hostPort = (e.url || '') + (e.porta ? (':' + e.porta) : '');
    row.innerHTML =
      '<div class="vc-saved-main">' +
      '  <div class="vc-saved-name">' + _vcEscape(label) + '</div>' +
      '  <div class="vc-saved-meta">' +
      _vcEscape(e.mac || '') + ' · ' + VCi18n.t('modal.conta') + ' ' +
      _vcEscape(e.conta || '') + ' · ' + _vcEscape(hostPort) +
      '  </div>' +
      '</div>' +
      '<button class="vc-saved-remove" type="button" data-i18n-title="common.remove" ' +
      'title="' + VCi18n.t('common.remove') + '"><i class="bi bi-x-lg"></i></button>';
    row.addEventListener('click', function (ev) {
      if (ev.target.closest('.vc-saved-remove')) return;
      document.querySelectorAll('#vcSavedList .vc-saved-row').forEach(function (r) { r.classList.remove('selected'); });
      row.classList.add('selected');
      _vcRemoteFillForm(e);
    });
    row.querySelector('.vc-saved-remove').addEventListener('click', function (ev) {
      ev.stopPropagation();
      vcRemoteListRemove(e.mac);
      vcRemoteRenderList();
    });
    box.appendChild(row);
  });
}

function _vcRemoteFillForm(e) {
  _setVal('vcRemoteMac',   e.mac);
  _setVal('vcRemoteConta', e.conta);
  _setVal('vcRemoteUrl',   e.url);
  _setVal('vcRemotePorta', e.porta);
  _setVal('vcRemoteNome',  e.nome);
  _setVal('vcRemoteSenha', e.senha);
}

function _vcEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function vcRemoteAddFromForm() {
  var entry = {
    mac:   _val('vcRemoteMac'),
    conta: _val('vcRemoteConta'),
    url:   _val('vcRemoteUrl'),
    porta: _val('vcRemotePorta') || '9018',
    nome:  _val('vcRemoteNome'),
    senha: _val('vcRemoteSenha')
  };
  if (!_vcMacNormalize(entry.mac)) {
    vcLogTs(VCi18n.t('discovery.remote_invalid_mac'));
    return;
  }
  if (!entry.conta || !entry.url) {
    vcLogTs(VCi18n.t('discovery.remote_url_required'));
    return;
  }
  vcRemoteListUpsert(entry);
  vcRemoteRenderList();
  vcLogTs(VCi18n.t('modal.saved_added', { nome: entry.nome || entry.mac }));
}

/* ═════════════════════════════════════════════════════════════
   BACKUP DE CONEXÕES — aba "Backup de conexões" no modal
   ═════════════════════════════════════════════════════════════
   Locais  → storage IPC (`credentials.<MAC>` em config.json).
   Remotas → localStorage `vc_remote_connections` (puro renderer).

   O service no main faz dialog + dump das `credentials.*`. O renderer
   junta com a lista de remotas e manda no payload export. No import,
   o service valida o JSON e devolve os dados; o renderer mescla na
   localStorage e chama applyLocals pro main escrever no config.json.
   ═════════════════════════════════════════════════════════════ */

function _vcBackupConnLog(msg) {
  // Log na área da aba Backup do modal.
  var body = document.getElementById('vcLoggerBodyBackup');
  if (!body) return;
  var line = '[' + vcFormatTimestamp() + '] ' + msg;
  // Mantém comportamento do logger principal (acumula linhas).
  if (body.dataset.empty !== '0') {
    body.textContent = '';
    body.dataset.empty = '0';
  }
  body.appendChild(document.createTextNode(line + '\n'));
  body.scrollTop = body.scrollHeight;
}

async function vcBackupConnRefreshCounts() {
  // Conta remotas (localStorage) e locais (config.json via IPC).
  var elR = document.getElementById('vcBackupCntRemotas');
  var elL = document.getElementById('vcBackupCntLocais');
  if (elR) elR.textContent = String(vcRemoteListGet().length);
  if (!window.vettiAPI || !window.vettiAPI.connsIo || !elL) return;
  try {
    var n = await window.vettiAPI.connsIo.countLocals();
    elL.textContent = String(typeof n === 'number' ? n : 0);
  } catch (_) {
    elL.textContent = '?';
  }
}

async function vcBackupConnExport() {
  if (!window.vettiAPI || !window.vettiAPI.connsIo) return;
  var remotes = vcRemoteListGet();
  _vcBackupConnLog(VCi18n.t('modal.backup_exportando', { r: remotes.length })
                   || ('Exportando ' + remotes.length + ' remotas + locais salvas…'));
  try {
    var r = await window.vettiAPI.connsIo.exportToFile(remotes);
    if (r && r.ok) {
      window._vcLastLocalCount = (r.counts && r.counts.locals) || 0;
      _vcBackupConnLog(VCi18n.t('modal.backup_ok', {
        path: r.path,
        l: r.counts.locals,
        rm: r.counts.remotes
      }) || ('Salvo em ' + r.path + ' (' + r.counts.locals + ' locais + ' +
             r.counts.remotes + ' remotas)'));
      await vcBackupConnRefreshCounts();
    } else if (r && r.canceled) {
      _vcBackupConnLog(VCi18n.t('common.canceled') || 'Cancelado.');
    } else {
      _vcBackupConnLog(VCi18n.t('modal.backup_falha') || 'Falha ao exportar.');
    }
  } catch (err) {
    _vcBackupConnLog((err && err.message) || 'Erro');
  }
}

async function vcBackupConnImport() {
  if (!window.vettiAPI || !window.vettiAPI.connsIo) return;
  var r;
  try { r = await window.vettiAPI.connsIo.importFromFile(); }
  catch (err) { _vcBackupConnLog((err && err.message) || 'Erro'); return; }
  if (!r || !r.ok) {
    if (r && r.canceled) return;
    _vcBackupConnLog((r && r.error) || (VCi18n.t('modal.backup_falha') || 'Falha ao importar.'));
    return;
  }
  var locals  = (r.data.locals  || []).slice();
  var remotes = (r.data.remotes || []).slice();

  // Pergunta como aplicar: mesclar (mantém existentes, sobrescreve por MAC)
  // ou substituir (apaga tudo antes de aplicar).
  var existingLocals  = window._vcLastLocalCount || 0;
  var existingRemotes = vcRemoteListGet().length;
  var mode = 'merge';
  if (existingLocals > 0 || existingRemotes > 0) {
    var sub = VCi18n.t('modal.backup_modo_pergunta', {
      l: locals.length, rm: remotes.length,
      el: existingLocals, er: existingRemotes
    }) || ('Você já tem ' + existingLocals + ' locais e ' + existingRemotes +
           ' remotas salvas. Como aplicar ' + locals.length + ' locais e ' +
           remotes.length + ' remotas do arquivo?');
    var replace = await vcConfirm({
      title:   VCi18n.t('modal.backup_modo_titulo')   || 'Importar como?',
      message: sub,
      okLabel: VCi18n.t('modal.backup_modo_substituir') || 'Substituir tudo',
      cancelLabel: VCi18n.t('modal.backup_modo_mesclar')  || 'Mesclar',
      danger:  true
    });
    mode = replace ? 'replace' : 'merge';
  }

  // Aplica remotas no localStorage. Em replace, zera antes.
  var current = mode === 'replace' ? [] : vcRemoteListGet();
  var keyset = {};
  current.forEach(function (e) { keyset[_vcMacNormalize(e.mac)] = e; });
  remotes.forEach(function (e) {
    var k = _vcMacNormalize(e && e.mac);
    if (!k) return;
    keyset[k] = e;
  });
  var merged = Object.keys(keyset).map(function (k) { return keyset[k]; });
  vcRemoteListSave(merged);
  vcRemoteRenderList();

  // Aplica locais via main (escreve direto no config.json).
  var lRes = { ok: false };
  try {
    lRes = await window.vettiAPI.connsIo.applyLocals(locals, mode === 'replace');
  } catch (_) {}

  _vcBackupConnLog(VCi18n.t('modal.backup_importado', {
    l: (lRes && lRes.count) || 0,
    rm: remotes.length,
    modo: mode
  }) || ('Importado: ' + ((lRes && lRes.count) || 0) + ' locais + ' +
         remotes.length + ' remotas (' + mode + ').'));
  window._vcLastLocalCount = (lRes && lRes.count) || 0;
  await vcBackupConnRefreshCounts();
}

function vcBackupConnBindButtons() {
  var bExp = document.getElementById('vcBtnExportarConns');
  if (bExp && !bExp._vcBound) {
    bExp._vcBound = true;
    bExp.addEventListener('click', function (e) { e.preventDefault(); vcBackupConnExport(); });
  }
  var bImp = document.getElementById('vcBtnImportarConns');
  if (bImp && !bImp._vcBound) {
    bImp._vcBound = true;
    bImp.addEventListener('click', function (e) { e.preventDefault(); vcBackupConnImport(); });
  }
}

async function vcOnConectarRemoto() {
  var mac    = _val('vcRemoteMac');
  var conta  = _val('vcRemoteConta');
  var url    = _val('vcRemoteUrl');
  var porta  = _val('vcRemotePorta') || '9018';
  var senha  = _val('vcRemoteSenha');

  // Validações simples (i18n nas chaves discovery.remote_*)
  if (!mac || !/^([0-9A-Fa-f]{2}[:-]?){5}[0-9A-Fa-f]{2}$/.test(mac)) {
    vcLogTs(VCi18n.t('discovery.remote_invalid_mac'));
    return;
  }
  if (!conta) {
    vcLogTs(VCi18n.t('discovery.remote_account_required'));
    return;
  }
  if (!url) {
    vcLogTs(VCi18n.t('discovery.remote_url_required'));
    return;
  }
  if (!senha || !/^\d{4}$/.test(senha)) {
    vcLogTs(VCi18n.t('discovery.connect_password_format'));
    return;
  }

  var btn = document.getElementById('vcBtnConectarRemoto');
  vcLogTs(VCi18n.t('discovery.connect_authenticating', { ip: url + ':' + porta }));
  if (btn) btn.disabled = true;

  try {
    var resp = await window.vettiAPI.network.authenticateRemote({
      mac: mac, conta: conta, host: url, port: porta, password: senha
    });
    if (resp && resp.ok) {
      vcLogTs(VCi18n.t('discovery.connect_authenticated', { ip: url }));
      // Persiste/atualiza esta conexão na lista de salvas.
      vcRemoteListUpsert({
        mac: mac, conta: conta, url: url, porta: porta,
        nome: _val('vcRemoteNome'), senha: senha
      });
      try {
        sessionStorage.setItem('vcConnectedCentral', JSON.stringify({
          ip: url + ':' + porta, raw: '', name: mac, remote: true
        }));
      } catch (_) {}
      setTimeout(function () {
        vcCloseModal();
        var inScreens = /[\\/]screens[\\/][^\\/]*$/.test(window.location.pathname);
        window.location.href = inScreens ? 'vetticonfig-status.html' : 'screens/vetticonfig-status.html';
      }, 600);
      return;
    } else if (resp && resp.errorCode !== undefined && resp.errorCode !== null) {
      vcLogTs(VCi18n.t('discovery.connect_failed', { msg: vcErrorMessage(resp.errorCode) }));
    } else if (resp && resp.body && /\bERR\b/i.test(resp.body)) {
      vcLogTs(VCi18n.t('discovery.connect_failed', { msg: vcErrorMessageFromBody(resp.body) }));
    } else if (resp && resp.error === 'timeout') {
      vcLogTs(VCi18n.t('discovery.connect_timeout'));
    } else if (resp && resp.status !== undefined) {
      vcLogTs(VCi18n.t('discovery.remote_login_rejected', { status: '0x' + Number(resp.status).toString(16).toUpperCase() }));
    } else {
      var msg = (resp && resp.error) || 'unknown';
      vcLogTs(VCi18n.t('discovery.connect_failed', { msg: msg }));
    }
  } catch (err) {
    vcLogTs(VCi18n.t('discovery.connect_failed', { msg: String((err && err.message) || err) }));
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ─── TELA STATUS ─────────────────────────────────────────── */

// Keep-alive: o login (válido por 60s) é renovado a cada comando enviado.
// Mandamos STAT 4 a cada 30s para manter a sessão viva quando o usuário
// não está disparando outras ações. Mais barato que STAT 5 e ainda atualiza
// tensões/tamper/sirene no firmware atual.
var _vcKeepAliveTimer = null;   // poll lento (STAT 4 / CMD 7 / keep-alive)
var _vcPartTimer      = null;   // poll rápido só de CMD 2 (estado das partições)
var _vcStatDevTimer   = null;
// Sessão expira ~60s após o PSW na central; mandar a cada 25s mantém
// margem confortável. Caso ainda venha ERR 7, o main faz re-auth
// automático em sendCommand.
var KEEPALIVE_INTERVAL_MS = 25000;
// CMD 2 (estado das partições). 30 s é um compromisso entre detectar
// arm/disarm pelo teclado ou controle remoto sem martelar a central
// com requests. O firmware testado não envia eventos assíncronos
// `[N CSTAT/PSTAT]` para essas ações, então polling é a forma de
// manter a UI viva.
var PART_INTERVAL_MS      = 30000;
// Refresh dos sensores (STAT 6) — atualiza Bat/Status/Tamper/RSSI de
// todos os dispositivos conhecidos a cada N ms.
var STAT_DEV_INTERVAL_MS  = 120000;
// Refresh do relógio da central — separado para não atrasar comandos.
var CLOCK_INTERVAL_MS     = 30000;

function _vcStartKeepAlive() {
  _vcStopKeepAlive();
  var lastClock = 0;

  // Poll rápido: só CMD 2 (estado das partições)
  _vcPartTimer = setInterval(function () {
    if (!window.vettiAPI || !window.vettiAPI.network) return;
    window.vettiAPI.network.sendCommand(_vcIsM4() ? 'PART' : 'CMD 2').then(function (r) {
      if (r && r.ok) {
        var st = _parseCmd2Status(r.body);
        if (st) _vcApplyPartitionStates(st);
      }
    }).catch(function () { /* logado */ });
  }, PART_INTERVAL_MS);

  // Poll lento: STAT 4 (tensões/tamper) + CMD 7 (relógio)
  _vcKeepAliveTimer = setInterval(function () {
    if (!window.vettiAPI || !window.vettiAPI.network) return;
    var net = window.vettiAPI.network;
    net.sendCommand('STAT 4').then(function (r) {
      if (r && r.ok) _vcApplyStat5(_parseStat5(r.body));
    }).catch(function () {});
    var now = Date.now();
    if (now - lastClock >= CLOCK_INTERVAL_MS) {
      lastClock = now;
      net.sendCommand('CMD 7').then(function (r) {
        if (r && r.ok) {
          var dt = _parseCmd7(r.body);
          if (dt) { vcSet('vcAlarmDate', dt.date); vcSet('vcAlarmTime', dt.time); }
        }
      }).catch(function () {});
    }
  }, KEEPALIVE_INTERVAL_MS);

  // Timer dedicado para refresh dos sensores via STAT 6 (intervalo longo).
  _vcStatDevTimer = setInterval(function () {
    if (_vcIsM4()) return;
    _vcRefreshDeviceStatuses();
  }, STAT_DEV_INTERVAL_MS);
}

function _vcStopKeepAlive() {
  if (_vcKeepAliveTimer) { clearInterval(_vcKeepAliveTimer); _vcKeepAliveTimer = null; }
  if (_vcPartTimer)      { clearInterval(_vcPartTimer);      _vcPartTimer      = null; }
  if (_vcStatDevTimer)   { clearInterval(_vcStatDevTimer);   _vcStatDevTimer   = null; }
}

// Lista de índices dos dispositivos descobertos (para refresh periódico
// de STAT 6 e refresh disparado por evento assíncrono).
var _vcKnownIndices = [];

// Refresh imediato de STAT 4 para os campos "Valores em uso" do GPRS/Wi-Fi.
async function _vcRefreshStatNetwork() {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return;
  try {
    var r = await net.sendCommand('STAT 4');
    if (r && r.ok) _vcApplyStat5(_parseStat5(r.body));
  } catch (_) {}
}

var _vcStatDevBusy = false;
async function _vcRefreshDeviceStatuses() {
  if (_vcIsM4()) return;
  if (_vcStatDevBusy) return;                            // pula tick se o anterior ainda roda
  if (!_vcKnownIndices || _vcKnownIndices.length === 0) return;
  _vcStatDevBusy = true;
  try { await _vcLoadDeviceStatuses(_vcKnownIndices.slice()); }
  finally { _vcStatDevBusy = false; }
}

// Processa eventos assíncronos `[N<NNN> ...]` chegando da central:
//   CSTAT ...          → status geral mudou → re-fetch STAT 4
//   PSTAT ...          → estado de partição mudou → re-fetch CMD 2
//   TE P:<n>           → tempo de entrada disparou na partição n (visual)
//   TS P:<n>           → tempo de saída disparou na partição n (visual)
//   <outros>           → refresh leve (CMD 2 + STAT 4)
// O handler é defensivo: na dúvida, dispara um refresh leve. A central
// mantém o estado autoritativo; o app só sincroniza.
function _vcHandleAsyncEvent(ev) {
  // Só agir na tela Status (que tem os elementos a atualizar).
  if (!document.getElementById('vcCentralName')) return;
  if (!window.vettiAPI || !window.vettiAPI.network) return;
  var net = window.vettiAPI.network;
  var body = String((ev && ev.body) || '').trim();
  var raw  = String((ev && ev.raw)  || '');

  // Eventos de dispositivo [N6]/[N7] trazem Bat/Tamper/Rssi/Stat em tempo real.
  // Aplicar direto evita esperar o polling de STAT 6/7 (120s).
  if (ev && (Number(ev.seq) === 6 || Number(ev.seq) === 7)) {
    var devStat = _parseAsyncStatDev(body);
    var devIdx = devStat && parseInt(devStat.Idx, 10);
    if (devIdx) {
      _vcApplyStatDev(devIdx, devStat);
      return;
    }
  }

  // Helpers
  function refreshPartitions() {
    net.sendCommand(_vcIsM4() ? 'PART' : 'CMD 2').then(function (r) {
      if (r && r.ok) {
        var st = _parseCmd2Status(r.body);
        if (st) _vcApplyPartitionStates(st);
      }
    }).catch(function () {});
  }
  function refreshStat4() {
    net.sendCommand('STAT 4').then(function (r) {
      if (r && r.ok) _vcApplyStat5(_parseStat5(r.body));
    }).catch(function () {});
  }

  // Tag visual rápida no card da partição (TE/TS = entrada/saída disparou).
  var mPart = /\bP:?(\d+)\b/.exec(body);
  var partN = mPart ? parseInt(mPart[1], 10) : null;
  function flashPartition(n, cls) {
    var card = document.getElementById('vcPartCard' + n);
    if (!card) return;
    card.classList.add(cls);
    setTimeout(function () { card.classList.remove(cls); }, 4000);
  }

  if (/^CSTAT\b/i.test(body))            { refreshStat4(); refreshPartitions(); }
  else if (/^PSTAT\b/i.test(body))       { refreshPartitions(); }
  else if (/^TE\b/i.test(body))          { if (partN) flashPartition(partN, 'entry-time'); refreshPartitions(); }
  else if (/^TS\b/i.test(body))          { if (partN) flashPartition(partN, 'exit-time');  refreshPartitions(); }
  else                                   { refreshPartitions(); refreshStat4(); }
}

// Encerra a sessão UDP e volta para o welcome.
async function vcDisconnect() {
  _vcStopKeepAlive();
  if (typeof _vcStopDispPolling === 'function') _vcStopDispPolling();
  try { await window.vettiAPI.network.endSession(); } catch (_) {}
  try { sessionStorage.removeItem('vcConnectedCentral'); } catch (_) {}
  window.location.href = '../index.html';
}

// Wire-up específico da tela Status (botão Desconectar etc).
/* ─── EXPORT STATUS (PDF / CSV) ───────────────────────────── */
// Coleta tudo o que está visível na tela Status num payload estruturado
// para o main process renderizar em PDF/CSV. Lê direto do DOM — assim
// o que o usuário vê é o que sai no relatório.
function _vcCollectStatusPayload() {
  function txt(id) {
    var el = document.getElementById(id);
    return el ? (el.textContent || '').trim() : '';
  }
  // Partições — 6 cards (vcPartCard1..6) com status (vcPart1Status..)
  var parts = [];
  for (var n = 1; n <= 6; n++) {
    var card = document.getElementById('vcPartCard' + n);
    if (!card) continue;
    var state = txt('vcPart' + n + 'Status') || '—';
    // Detecta a "intenção" do card via classe: armed/stay/disarmed/alarm/unused
    var cls = ['armed','stay','disarmed','alarm','unused'].find(function (c) { return card.classList.contains(c); }) || '';
    parts.push({
      n: 'P' + n,
      name: 'Partição ' + n,    // central não devolve nome custom (ver §1.2 da doc)
      state: state,
      stateClass: cls
    });
  }
  // Devices visíveis na lista — iteramos pelo DOM
  var devs = [];
  if (_vcStatusScanState && _vcStatusScanState.devices && _vcStatusScanState.devices.length) {
    devs = _vcScanStateDevicesForExport();
  } else {
    var devList = document.querySelectorAll('#vcDeviceList .vc-device');
    devList.forEach(function (d, i) {
      var name = (d.querySelector('.vc-device-name') || {}).textContent || '';
      var get = function (suffix) {
        var el = d.querySelector('[id$="' + suffix + '"]');
        return el ? (el.textContent || '').trim() : '';
      };
      devs.push({
        idx:       i + 1,
        name:      (name || '').trim(),
        zone:      get('Zona'),
        type:      get('Tipo'),
        version:   get('Versao'),
        partition: get('Particao'),
        battery:   get('Bateria'),
        rssi:      get('Rssi'),
        status:    get('Status'),
        tamper:    get('Tamper')
      });
    });
  }
  return {
    central: {
      name:  txt('vcCentralName'),
      model: txt('vcCentralModel'),
      ip:    txt('vcCentralIp').replace(/^IP:\s*/i, ''),
      mac:   txt('vcCentralMac').replace(/^MAC:\s*/i, '')
    },
    partitions: parts,
    boxes: {
      vdc:    txt('vcTensaoFonte'),
      vbat:   txt('vcTensaoBateria'),
      tamper: txt('vcTamperCentral'),
      sirene: txt('vcSireneFio')
    },
    panel: {
      date: txt('vcAlarmDate'),
      time: txt('vcAlarmTime')
    },
    server: {
      status: txt('vcServerStatus'),
      status2: txt('vcServerStatus2'),
      gprs:   txt('vcServerGprs'),
      wifi:   txt('vcServerWifi'),
      ethernet: txt('vcServerEthernet')
    },
    devices: devs
  };
}

// Mini menu que aparece colado no botão "PDF" com 2 opções: PDF e CSV.
function _vcOpenExportMenu(ev) {
  // Remove menu anterior se existir
  var prev = document.getElementById('vcExportMenu');
  if (prev) { prev.remove(); return; }   // toggle: 2º click fecha
  var menu = document.createElement('div');
  menu.id = 'vcExportMenu';
  menu.className = 'vc-export-menu';
  menu.innerHTML =
    '<button type="button" class="vc-export-item" data-fmt="pdf">' +
      '<i class="bi bi-file-earmark-pdf"></i> <span data-i18n="status.export_pdf">Exportar PDF</span>' +
    '</button>' +
    '<button type="button" class="vc-export-item" data-fmt="csv">' +
      '<i class="bi bi-file-earmark-spreadsheet"></i> <span data-i18n="status.export_csv">Exportar CSV</span>' +
    '</button>' +
    '<button type="button" class="vc-export-item" data-fmt="json">' +
      '<i class="bi bi-filetype-json"></i> <span data-i18n="status.export_json">Exportar JSON</span>' +
    '</button>';
  document.body.appendChild(menu);

  // Posiciona abaixo do botão (canto direito alinhado).
  var btn = ev.currentTarget || document.getElementById('vcBtnPdf');
  var r = btn.getBoundingClientRect();
  menu.style.top  = (r.bottom + 6) + 'px';
  menu.style.left = (r.right - menu.offsetWidth) + 'px';

  if (typeof VCi18n !== 'undefined' && VCi18n && VCi18n.apply) VCi18n.apply();

  menu.addEventListener('click', async function (e) {
    var b = e.target.closest('[data-fmt]');
    if (!b) return;
    menu.remove();
    await _vcDoExport(b.dataset.fmt);
  });
  // Fecha ao clicar fora
  setTimeout(function () {
    document.addEventListener('click', function _close(e) {
      if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', _close); }
    }, { once: true });
  }, 0);
}

async function _vcDoExport(fmt) {
  if (!window.vettiAPI || !window.vettiAPI.report) return;
  var payload = _vcCollectStatusPayload();
  vcToast(VCi18n.t('status.exporting'), 'info', 0, { id: 'export', persist: true });
  try {
    var r = (fmt === 'csv')
      ? await window.vettiAPI.report.exportCsv(payload)
      : (fmt === 'json')
        ? await window.vettiAPI.report.exportJson(payload)
        : await window.vettiAPI.report.exportPdf(payload);
    if (r && r.ok) {
      vcToast(VCi18n.t('status.export_ok', { path: r.path }), 'success', 4000, { id: 'export' });
    } else if (r && r.canceled) {
      vcToast(VCi18n.t('status.export_canceled'), 'info', 2000, { id: 'export' });
    } else {
      vcToast(VCi18n.t('status.export_fail', { msg: (r && r.error) || '' }), 'warn', 4000, { id: 'export' });
    }
  } catch (err) {
    vcToast(VCi18n.t('status.export_fail', { msg: (err && err.message) || '' }), 'warn', 4000, { id: 'export' });
  }
}

// Os listeners de onLogEvent/onAsyncEvent ficam no DOMContentLoaded global,
// que rodam para qualquer tela — registrar de novo aqui causaria log duplicado.
function _vcStatusBindEvents() {
  var btnDesc = document.getElementById('vcBtnDesconectar');
  if (btnDesc) btnDesc.addEventListener('click', function (e) { e.preventDefault(); vcDisconnect(); });

  var btnRefreshPartitions = document.getElementById('vcRefreshPartitions');
  if (btnRefreshPartitions) {
    btnRefreshPartitions.addEventListener('click', function (e) {
      e.preventDefault();
      _vcRefreshPartitionsNow(btnRefreshPartitions);
    });
  }

  // Botão de exportação (PDF/CSV) — abre um menu de escolha.
  var btnRefreshAlarmClock = document.getElementById('vcRefreshAlarmClock');
  if (btnRefreshAlarmClock) {
    btnRefreshAlarmClock.addEventListener('click', function (e) {
      e.preventDefault();
      _vcRefreshAlarmClockNow(btnRefreshAlarmClock);
    });
  }

  var btnRefreshServerConn = document.getElementById('vcRefreshServerConn');
  if (btnRefreshServerConn) {
    btnRefreshServerConn.addEventListener('click', function (e) {
      e.preventDefault();
      _vcRefreshServerConnNow(btnRefreshServerConn);
    });
  }

  var btnPdf = document.getElementById('vcBtnPdf');
  if (btnPdf) btnPdf.addEventListener('click', function (e) { e.preventDefault(); _vcOpenExportMenu(e); });

  // Toggle Detalhado/Compacto na lista de dispositivos.
  // TODO: layout compacto atual apenas esconde os rótulos e o título do
  // device. Refinar para parecer com a Imagem #3 (linha única com ícones
  // Tamper/RSSI ao lado) numa próxima rodada.
  var sw = document.getElementById('vcToggleScan');
  var list = document.getElementById('vcDeviceList');
  if (sw && list) {
    try {
      var savedScanDetail = localStorage.getItem(VC_SCAN_DETAIL_KEY);
      if (savedScanDetail === '0' || savedScanDetail === '1') sw.checked = savedScanDetail === '1';
    } catch (_) {}
    list.classList.toggle('compact', !sw.checked);
    _vcRefreshScanNotApplicableLabels();
    sw.addEventListener('change', function () {
      try { localStorage.setItem(VC_SCAN_DETAIL_KEY, sw.checked ? '1' : '0'); } catch (_) {}
      list.classList.toggle('compact', !sw.checked);
      _vcRefreshScanNotApplicableLabels();
    });
  }
  if (list) {
    list.addEventListener('click', function (e) {
      var loadBtn = e.target && e.target.closest ? e.target.closest('#vcScanLoadDevicesBtn') : null;
      if (loadBtn && list.contains(loadBtn)) {
        e.preventDefault();
        e.stopPropagation();
        _vcLoadScanDevicesOnDemand(loadBtn);
        return;
      }

      var btn = e.target && e.target.closest ? e.target.closest('.vc-device-refresh-btn') : null;
      if (!btn || !list.contains(btn)) return;
      e.preventDefault();
      e.stopPropagation();
      _vcRefreshSingleDeviceNow(btn.dataset.deviceIdx, btn);
    });
  }
  _vcBindScanDragScroll();

  var btnF = document.getElementById('vcBtnFilter');
  if (btnF) btnF.addEventListener('click', function (e) { e.preventDefault(); vcOpenFilter(); });

  // Ações nas partições selecionadas.
  // Mapeia botão → prefix do comando [T<seq> CMD 2 <prefix>:p].
  var actionMap = [
    { id: 'vcBtnArme',    prefix: 'AT', requireSel: true,  optimistic: 'armed'    },
    { id: 'vcBtnStay',    prefix: 'AP', requireSel: true,  optimistic: 'armed'    },
    { id: 'vcBtnDesarme', prefix: 'D',  requireSel: true,  optimistic: 'disarmed' },
    { id: 'vcBtnPanico',  prefix: 'P',  requireSel: false, optimistic: null       }
  ];

  for (var i = 0; i < actionMap.length; i++) {
    (function (cfg) {
      var btn = document.getElementById(cfg.id);
      if (!btn) return;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        _vcRunPartitionAction(cfg);
      });
    })(actionMap[i]);
  }
}

async function _vcRefreshPartitionsNow(btn) {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net || typeof net.sendCommand !== 'function') return;
  if (btn) btn.classList.add('is-loading');
  try {
    var rcmd2 = await net.sendCommand(_vcIsM4() ? 'PART' : 'CMD 2');
    if (rcmd2 && rcmd2.ok) {
      var st = _parseCmd2Status(rcmd2.body);
      if (st) _vcApplyPartitionStates(st);
    }
  } finally {
    if (btn) btn.classList.remove('is-loading');
  }
}

async function _vcRefreshAlarmClockNow(btn) {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net || typeof net.sendCommand !== 'function') return;
  if (btn) btn.classList.add('is-loading');
  try {
    var rcmd7 = await net.sendCommand('CMD 7');
    if (rcmd7 && rcmd7.ok) {
      var dt = _parseCmd7(rcmd7.body);
      if (dt) {
        vcSet('vcAlarmDate', dt.date);
        vcSet('vcAlarmTime', dt.time);
      }
    }
  } finally {
    if (btn) btn.classList.remove('is-loading');
  }
}

async function _vcRefreshServerConnNow(btn) {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net || typeof net.sendCommand !== 'function') return;
  if (btn) btn.classList.add('is-loading');
  try {
    var rstat5 = await net.sendCommand('STAT 5');
    if (rstat5 && rstat5.ok) _vcApplyStat5(_parseStat5(rstat5.body));
  } finally {
    if (btn) btn.classList.remove('is-loading');
  }
}

async function _vcRefreshSingleDeviceNow(idx, btn) {
  var net = window.vettiAPI && window.vettiAPI.network;
  idx = parseInt(idx, 10);
  if (!net || typeof net.sendCommand !== 'function' || !idx) return;
  if (btn) btn.classList.add('is-loading');
  try {
    var r = await net.sendCommand('STAT 6 ' + idx);
    if (r && !r.ok && r.errorCode === 8) {
      r = await net.sendCommand('STAT 7 ' + idx);
    }
    if (r && r.ok) {
      var s = _parseStatDev(r.body);
      if (s) _vcApplyStatDev(idx, s);
    }
  } finally {
    if (btn) btn.classList.remove('is-loading');
  }
}

async function _vcRunPartitionAction(cfg) {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return;
  var parts = vcSelectedPartitions();
  var keepSelected = parts.slice();
  if (cfg.requireSel && parts.length === 0) {
    vcShowInfo(VCi18n.t('status.no_partition_selected'));
    return;
  }
  // Pânico sem seleção dispara nas partições em uso.
  if (cfg.prefix === 'P' && parts.length === 0) {
    parts = [];
    for (var n = 1; n <= 6; n++) {
      var c = document.getElementById('vcPartCard' + n);
      if (c && c.classList.contains('in-use')) parts.push(n);
    }
    if (parts.length === 0) parts = [1];
    keepSelected = parts.slice(0, 1);
  }

  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    try {
      var cmd = _vcIsM4()
        ? ('PART ' + (cfg.prefix === 'P' ? 'PSIR' : cfg.prefix) + ' ' + p)
        : ('CMD 2 ' + cfg.prefix + ':' + p);
      var resp = await net.sendCommand(cmd);
      if (resp && resp.ok && cfg.optimistic) {
        vcSetPartition(p, cfg.optimistic);
      }
    } catch (_) { /* logado pelo logEvent */ }
  }
  // Após disparar todas as ações, re-pega o estado real para reconciliar.
  try {
    var rcmd2 = await net.sendCommand(_vcIsM4() ? 'PART' : 'CMD 2');
    if (rcmd2 && rcmd2.ok) {
      var st = _parseCmd2Status(rcmd2.body);
      if (st) _vcApplyPartitionStates(st);
    }
  } catch (_) {}
  _vcRestoreSelectedPartitions(keepSelected);
}

// Pre-popula header com info da central (do sessionStorage).
function _vcStatusFillFromSession() {
  var data = null;
  try { data = JSON.parse(sessionStorage.getItem('vcConnectedCentral') || 'null'); } catch (_) {}
  if (!data) return;
  _vcCentralGeneration = data.generation || _vcDetectGenerationFromRaw(data.raw || '');
  // Tenta extrair MAC e IP do raw da descoberta. O resto será sobrescrito
  // pelos comandos ID/INFO quando responderem.
  var macMatch = /\b([0-9A-F]{2}(?:[-:][0-9A-F]{2}){5})\b/i.exec(data.raw || '');
  if (macMatch) vcSet('vcCentralMac', 'MAC: ' + macMatch[1].toUpperCase());
  var nameMatch = /"([^"]+)"/.exec(data.raw || '');
  if (nameMatch) vcSet('vcCentralName', nameMatch[1]);
}

// ───── Parsers das respostas (cada um isola um campo)
//
// TODO(usuário): confirmar formato exato de cada resposta no firmware
// real. Os parsers abaixo seguem os exemplos do PDF e do log da tela
// antiga, mas podem precisar ajuste se a central retornar variantes.

// Formata número decimal usando o separador correto do idioma atual.
// pt-BR e es-LA usam vírgula; en-US usa ponto. (es-LA mapeado para es-AR
// porque o ICU genérico es-419 usa ponto, mas a maior parte da LA usa
// vírgula — alinha com pt-BR.)
function vcFormatDecimal(num, digits) {
  var lang = (typeof VCi18n !== 'undefined' && VCi18n.getCurrentLang) ? VCi18n.getCurrentLang() : 'pt-BR';
  var locale = ({ 'pt-BR': 'pt-BR', 'en': 'en-US', 'es-LA': 'es-AR' })[lang] || 'en-US';
  var n = Number(num);
  if (!isFinite(n)) return '---';
  return n.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function _parseInfo(body) {
  // [R<seq> INFO SmartAlarm32 V6.68 - Build date:2025/10/15 - Build time:17:28:34]
  // → "SmartAlarm32 V6.68 - 2025/10/15 - 17:28:34"
  var s = String(body || '').replace(/^INFOX?\s+/i, '');
  s = s.replace(/Build date:\s*/i, '').replace(/Build time:\s*/i, '');
  return s.trim();
}

// Cache global do modelo/versão da central. Atualizado a cada conexão
// (set em _vcStatusFetchAll / _vcSysQuickHeader após INFO chegar).
// mod: 1=ME, 2=V1, 3=V2, 4=V3, 5=V4, 6=V5, 7=V6 …  (Java enum ordinal)
// version: padrão Java — VX.YZ → X*100+YZ. Ex: V6.68 → 668; V10.50 → 1050.
var _vcCentralMod = 0;
var _vcCentralVer = 0;
var _vcCentralGeneration = 'legacy';
var _vcCentralBuildPrefix = '';

function _vcDetectGenerationFromRaw(raw) {
  return /\bIDX\b/i.test(raw || '') || /SmartAlarm-M4/i.test(raw || '') ? 'm4' : 'legacy';
}

function _vcIsM4() {
  return _vcCentralGeneration === 'm4';
}

function _parseCentralModelVersion(infoBody) {
  // Aceita "SmartAlarm32 V6.68 …" ou "SmartAlarm32 V10.50 …".
  // Java em Comm.java:279-303 trata 2 casos: V6.68 (4 chars depois do V)
  // ou V10.50 (5 chars). Generalizamos com regex.
  var s = String(infoBody || '');
  var m = /V(\d{1,2})\.(\d{2})\b/.exec(s);
  if (!m) return { mod: 0, version: 0 };
  var modDigit = parseInt(m[1], 10);    // 1..6 (V1..V6)
  var verRest  = parseInt(m[2], 10);    // 00..99
  var version  = modDigit * 100 + verRest;
  // mod no enum Java é offset+1: SMARTALARM32_V1=ordinal 1, V6=ordinal 6.
  // (SMARTALARM_ME=0 só é setado quando type=1, não tratamos aqui.)
  return { mod: modDigit, version: version };
}

function _vcParseCentralBuildPrefix(infoBody) {
  var m = /\(([A-Za-z])[^)]*\)/.exec(String(infoBody || ''));
  return m ? m[1].toUpperCase() : '';
}

function _vcShouldHideM4WiredZone(idx) {
  var n = parseInt(idx, 10);
  return _vcIsM4() && _vcCentralBuildPrefix === 'E' && (n === 255 || n === 256);
}

function _parseId(body) {
  // [R<seq> ID Mac:FC-0F-E7-32-3B-D2 IP:192.168.5.80 - SmartAlarm32 V6.68 -
  //  Nome:"Receptora - Demo" Interface:"Ethernet" - Empresa:""]
  var s = String(body || '').replace(/^(?:ID|IDX)\s+/i, '');
  function field(re) { var m = re.exec(s); return m ? m[1] : null; }
  return {
    mac:       field(/Mac:\s*([0-9A-F:-]+)/i),
    ip:        field(/IP:\s*(\S+)/i),
    nome:      field(/Nome:\s*"([^"]*)"/i),
    interface: field(/Interface:\s*"([^"]*)"/i),
    empresa:   field(/Empresa:\s*"([^"]*)"/i)
  };
}

function _parseCmd7(body) {
  // [R<seq> CMD 7 "2019/09/30 15:45:32"]
  var m = /CMD\s+7\s+"?(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})"?/.exec(body || '');
  if (!m) return null;
  return {
    date: m[3] + '/' + m[2] + '/' + m[1],   // DD/MM/AAAA
    time: m[4] + ':' + m[5] + ':' + m[6]
  };
}

// STAT 5 + extensões observadas no firmware real (Vdc, Vbat, Tamper, Sir).
// TODO(usuário): confirmar unidades — assumindo Vdc/Vbat em mV e
// Tamper/Sir como 0=ok, 1=violado/ausente.
function _parseStat5(body) {
  var out = {};
  var pairs = body.match(/(\w+)=("[^"]*"|\S+)/g) || [];
  for (var i = 0; i < pairs.length; i++) {
    var p = pairs[i].split('=');
    var k = p[0];
    var v = p[1].replace(/^"|"$/g, '');
    out[k] = v;
  }
  return out;
}

function _parseBds(body) {
  // [R<seq> BDS Tot:6 Max:256 Inib:0]
  var m = /BDS\s+Tot:(\d+)(?:\s+Max:(\d+))?(?:\s+Del:(\d+))?(?:\s+Des:(\d+))?(?:\s+Inib:(\d+))?/i.exec(body || '');
  if (!m) return null;
  return {
    tot:  parseInt(m[1], 10),
    max:  m[2] ? parseInt(m[2], 10) : null,
    del:  m[3] ? parseInt(m[3], 10) : null,
    des:  m[4] ? parseInt(m[4], 10) : null,
    inib: m[5] ? parseInt(m[5], 10) : null
  };
}

function _parseCmd2Status(body) {
  // [R<seq> CMD 2 (p:-NNNNN)] → estado de cada partição (6 chars).
  // Códigos: '-' desarmado, 'A' armado, 'S' stay, 'P' pânico, 'D' disparada, 'N' não utilizada.
  var m = /CMD\s+2\s+\(p:([^)\s]+)\)/i.exec(body || '') || /\bPART\b[^\[]*\bp:([^\)\s\]]+)/i.exec(body || '');
  return m ? m[1] : null;
}

function _vcApplyPartitionStates(stateStr) {
  if (!stateStr || stateStr.length < 1) return;
  var map = { '-': 'disarmed', 'A': 'armed', 'S': 'stay', 'P': 'panic', 'Q': 'panic', 'D': 'alarm', 'E': 'alarm', 'N': 'unused' };

  // Snapshot da seleção atual ANTES de re-renderizar — vcSetPartition
  // remove a classe .selected ao resetar os modificadores, e o polling
  // (CMD 2) periódico estava limpando a seleção do usuário.
  var preSelected = vcSelectedPartitions();

  for (var n = 1; n <= 6; n++) {
    var ch = stateStr[n - 1] || 'N';
    var state = map[ch] || 'unused';
    vcSetPartition(n, state);
  }

  // Restaura seleção em partições que continuam em uso (skip 'unused').
  preSelected.forEach(function (n) {
    var card = document.getElementById('vcPartCard' + n);
    if (card && !card.classList.contains('unused')) {
      card.classList.add('selected');
    }
  });

  _vcBindPartitionClicks();
}

function _vcRestoreSelectedPartitions(parts) {
  var keep = Array.isArray(parts) && parts.length ? parseInt(parts[0], 10) : null;
  for (var n = 1; n <= 6; n++) {
    var card = document.getElementById('vcPartCard' + n);
    if (!card) continue;
    card.classList.remove('selected');
    if (keep === n && !card.classList.contains('unused')) {
      card.classList.add('selected');
    }
  }
}

function _parseBdx(body) {
  var m4 = _parseBdxM4(body);
  if (m4) return m4;

  // [R<seq> BD <NN> Stat:OK Tipo:"PLR" End:... V:7.06 Nome:"..." z:2TSIY p:123456 Acao:1]
  // `Acao:` aparece em PGMs (Plg/Int) — valores 1=ON, 2=OFF, 3=Toggle, 4=Pulse
  // (CtrlMain.java:1910-1944 + AppCfg.java enum Action).
  var idxMatch = /^BD\s+(\d+)\s+/i.exec(body || '');
  if (!idxMatch) return null;
  var idx = parseInt(idxMatch[1], 10);
  var rest = body.slice(idxMatch[0].length);

  function field(re) { var m = re.exec(rest); return m ? m[1] : null; }
  var acaoStr = field(/Acao:\s*(\d+)/i);
  return {
    idx:    idx,
    stat:   field(/Stat:\s*(\w+)/i),
    tipo:   field(/Tipo:\s*"([^"]*)"/i) || field(/Tipo:\s*(\S+)/i),
    end:    field(/End:\s*(\S+)/i),
    versao: field(/V:\s*(\S+)/i),
    nome:   field(/Nome:\s*"([^"]*)"/i),
    z:      field(/z:\s*(\S+)/i),
    p:      field(/p:\s*(\S+)/i),
    acao:   acaoStr ? parseInt(acaoStr, 10) : null
  };
}

var _VC_M4_TYPE_SHORT = {
  '01': 'Cen', '81': 'Cen',
  '02': 'CR4', '82': 'CR4',
  '03': 'CR8', '83': 'CR8',
  '04': 'Tec', '84': 'Tec',
  '05': 'BP',  '85': 'BP',
  '06': 'Shx', '86': 'Shx',
  '07': 'P',   '87': 'PLR',
  '08': 'Plg', '88': 'Plg',
  '09': 'Int', '89': 'Int',
  '0A': 'Sir', '8A': 'Sir',
  '0B': 'A',   '8B': 'ALR',
  '0C': 'TLR', '8C': 'TLR',
  '0D': 'Rep', '8D': 'Rep',
  '0E': 'Fio', '8E': 'Fio',
  '0F': 'PD',  '8F': 'PD'
};

function _vcM4HexByte(value) {
  var n = parseInt(String(value || '0'), 16);
  return isNaN(n) ? 0 : n;
}

function _vcM4PartMaskToLegacy(hex) {
  var n = _vcM4HexByte(hex);
  var out = '';
  for (var i = 0; i < 6; i++) out += (n & (1 << i)) ? '1' : '-';
  return out;
}

function _vcM4ZoneMaskToLegacy(hex) {
  var n = _vcM4HexByte(hex);
  var out = '';
  if (n & 0x01) out += '2';
  if (n & 0x02) out += 'T';
  if (n & 0x04) out += 'S';
  if (n & 0x08) out += 'I';
  if (n & 0x10) out += 'Y';
  if (n & 0x20) out += 'P';
  if (n & 0x40) out += 'M';
  return out || '------';
}

function _vcM4Version(hex) {
  var s = String(hex || '').replace(/[^0-9A-F]/gi, '').padStart(6, '0').toUpperCase();
  var major = parseInt(s.slice(0, 2), 16);
  var minor = parseInt(s.slice(2, 4), 16);
  if (isNaN(major) || isNaN(minor)) return '';
  return String(major) + '.' + String(minor).padStart(2, '0');
}

function _vcM4LooksLikeEmptySlot(typeHex, addr, name) {
  var type = String(typeHex || '').toUpperCase();
  var rfAddr = String(addr || '').toUpperCase();
  var desc = String(name || '').trim();
  var knownType = Object.prototype.hasOwnProperty.call(_VC_M4_TYPE_SHORT, type);
  return type === '00' ||
         type === 'FF' ||
         !knownType ||
         rfAddr === '00000000' ||
         rfAddr === 'FFFFFFFF' ||
         !desc;
}

function _parseBdxM4(body) {
  // [R001 BDX 001 002 86 12345678 070900 01 02 10 "Nome"]
  // [R001 BD  002 86 12345678 070900 01 02 10 "Nome"]
  var m = /^BDX\s+(\d{1,3})\s+(\d{1,3})\s+([0-9A-F]{2})\s+([0-9A-F]{8})\s+([0-9A-F]{6})\s+([0-9A-F]{2})\s+([0-9A-F]{2})\s+([0-9A-F]{2})\s+"([^"]*)"/i.exec(body || '');
  if (!m) {
    m = /^BD\s+(\d{1,3})\s+([0-9A-F]{2})\s+([0-9A-F]{8})\s+([0-9A-F]{6})\s+([0-9A-F]{2})\s+([0-9A-F]{2})\s+([0-9A-F]{2})\s+"([^"]*)"/i.exec(body || '');
    if (m) m.splice(1, 0, null);
  }
  if (!m) return null;
  var typeHex = String(m[3] || '').toUpperCase();
  var idx = parseInt(m[2], 10);
  if (_vcM4LooksLikeEmptySlot(typeHex, m[4], m[9])) return null;
  return {
    idx:    idx,
    stat:   'OK',
    tipo:   _VC_M4_TYPE_SHORT[typeHex] || typeHex,
    end:    m[4],
    versao: _vcM4Version(m[5]),
    nome:   m[9],
    z:      _vcM4ZoneMaskToLegacy(m[7]),
    p:      _vcM4PartMaskToLegacy(m[6]),
    cfg:    m[8],
    acao:   null,
    m4:     true
  };
}

// ───── Disparadores

async function _vcStatusFetchAll() {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net || typeof net.sendCommand !== 'function') return;
  _vcCentralBuildPrefix = '';

  // Toast de progresso do status basico; a lista de dispositivos e carregada sob demanda.
  vcToast(VCi18n.t('common.loading_status'), 'info', 0,
          { id: 'status-init', persist: true });

  // 0. Confirma geração quando a descoberta não trouxe essa informação
  // (ex.: conexão remota). No legado, IDX retorna erro/comando inexistente.
  if (!_vcIsM4()) {
    try {
      var rIdxProbe = await net.sendCommand('IDX');
      if (rIdxProbe && rIdxProbe.ok && /SmartAlarm-M4/i.test(rIdxProbe.body || '')) {
        _vcCentralGeneration = 'm4';
      }
    } catch (_) {}
  }

  // 1. INFO/INFOX — modelo + versão
  try {
    var r = await net.sendCommand(_vcIsM4() ? 'INFOX' : 'INFO');
    if (r && r.ok) {
      vcSet('vcCentralModel', _parseInfo(r.body));
      _vcCentralBuildPrefix = _vcParseCentralBuildPrefix(r.body);
      var mv = _parseCentralModelVersion(r.body);
      _vcCentralMod = mv.mod;
      _vcCentralVer = mv.version;
    }
  } catch (_) {}

  // 2. ID/IDX — Mac, IP, Nome, Interface, Empresa
  // Em conexão remota a central retorna IP:0.0.0.0 (não conhece seu IP
  // local através do tunnel TCP). Nesse caso, usamos PAR 71010000 (IP em
  // uso na ethernet) como fallback — esse é o IP real da rede local.
  try {
    var rid = await net.sendCommand(_vcIsM4() ? 'IDX' : 'ID');
    if (rid && rid.ok) {
      var idInfo = _parseId(rid.body);
      if (idInfo.nome) vcSet('vcCentralName', idInfo.nome);
      if (idInfo.mac)  vcSet('vcCentralMac', 'MAC: ' + idInfo.mac);
      if (idInfo.ip && idInfo.ip !== '0.0.0.0') {
        vcSet('vcCentralIp', 'IP: ' + idInfo.ip);
      } else {
        // Fallback: lê o IP em uso direto da central
        try {
          var rIp = await net.sendCommand('PAR 71010000');
          if (rIp && rIp.ok) {
            var p = _parseParResponse(rIp.body);
            if (p && p.value && p.value !== '0.0.0.0') {
              vcSet('vcCentralIp', 'IP: ' + p.value);
            } else {
              vcSet('vcCentralIp', 'IP: ---');
            }
          }
        } catch (_) {}
      }
    }
  } catch (_) {}

  // 2.5. STAT 4 — preenche tensões/tamper/sirene logo no início
  try {
    var rs4 = await net.sendCommand('STAT 4');
    if (rs4 && rs4.ok) _vcApplyStat5(_parseStat5(rs4.body));
  } catch (_) {}

  // 3. CMD 7 — data/hora do painel
  try {
    var r2 = await net.sendCommand('CMD 7');
    if (r2 && r2.ok) {
      var dt = _parseCmd7(r2.body);
      if (dt) { vcSet('vcAlarmDate', dt.date); vcSet('vcAlarmTime', dt.time); }
    }
  } catch (_) {}

  // 4. STAT 5 — CID, GSM, Time, Serv1, Serv2 + (firmware novo) Vdc/Vbat/Tamper/Sir
  try {
    var r3 = await net.sendCommand('STAT 5');
    if (r3 && r3.ok) _vcApplyStat5(_parseStat5(r3.body));
  } catch (_) {}

  // 5/6. Scan de dispositivos: sob demanda no primeiro acesso da sessao.
  _vcPrepareScanDevicesLazy();

  // 7. CMD 2/PART — estado real das partições (sobrescreve o default 'desarmed'
  //    que _vcApplyPartitionsInUse aplica para partições em uso).
  try {
    var rcmd2 = await net.sendCommand(_vcIsM4() ? 'PART' : 'CMD 2');
    if (rcmd2 && rcmd2.ok) {
      var st = _parseCmd2Status(rcmd2.body);
      if (st) _vcApplyPartitionStates(st);
    }
  } catch (_) {}

  vcToast(VCi18n.t('common.loaded_status'), 'success', 2500, { id: 'status-init' });
}

function _vcApplyStat5(kv) {
  var cidNorm = kv.CID !== undefined ? String(kv.CID).toLowerCase() : '';
  if (kv.Serv1 !== undefined) vcSet('vcServerStatus', _vcServerEndpointLabel(kv.Serv1, kv.CID));
  if (kv.Serv2 !== undefined) vcSet('vcServerStatus2', _vcServerEndpointLabel(kv.Serv2, kv.CID));
  if (kv.Eth !== undefined) vcSet('vcServerEthernet', _vcServerConnLabel(kv.Eth));
  else if (kv.Ethernet !== undefined) vcSet('vcServerEthernet', _vcServerConnLabel(kv.Ethernet));
  else if (kv.ETH !== undefined) vcSet('vcServerEthernet', _vcServerConnLabel(kv.ETH));
  // CID
  if (kv.CID !== undefined) {
    if (kv.Serv1 === undefined) vcSet('vcServerStatus', _vcCidLabel(kv.CID));
    if (kv.Serv2 === undefined) vcSet('vcServerStatus2', _vcCidLabel(kv.CID));
    if (kv.Eth === undefined && kv.Ethernet === undefined && kv.ETH === undefined) {
      vcSet('vcServerEthernet', cidNorm === 'ethernet' ? VCi18n.t('common.connected') : VCi18n.t('common.disconnected'));
    }
    // Status GPRS na aba Rede do Sistema: "Conectado" quando CID=GPRS, senão
    // mostra qual é o canal ativo entre parênteses para diferenciar.
    if (cidNorm === 'gprs')          vcSet('vcSysGprsStatus', VCi18n.t('common.connected'));
    else if (cidNorm === 'nc')       vcSet('vcSysGprsStatus', VCi18n.t('status.cid_not_connected'));
    else                              vcSet('vcSysGprsStatus', VCi18n.t('common.disconnected'));
  }
  // GSM (modem) — combina RSSI, tipo (2G/3G/4G) e operadora quando disponíveis.
  if (kv.GSM !== undefined) {
    vcSet('vcServerGprs', kv.GSM === 'NI'
      ? VCi18n.t('common.not_installed')
      : (cidNorm === 'gprs' ? VCi18n.t('common.connected') : VCi18n.t('common.disconnected')));
    // Aba Sistema → Rede: campos separados.
    var rssiOnly = (kv.GSM === 'NI') ? VCi18n.t('common.not_installed')
                 : (kv.GSM === '99') ? VCi18n.t('status.no_signal')
                 : kv.GSM;
    vcSet('vcSysGprsRssi', rssiOnly);
    var info = _vcGsmExtract(kv.Modem, kv.Cops);
    vcSet('vcSysGprsOperadora', info.operadora || '---');
    vcSet('vcSysGprsTipo',      info.tipo      || '---');
  }
  if (kv.CID !== undefined) {
    vcSet('vcServerWifi', cidNorm === 'wi-fi' || cidNorm === 'wifi'
      ? VCi18n.t('common.connected')
      : VCi18n.t('common.not_installed'));
  }

  // Time / data-hora (caso CMD 7 não tenha vindo)
  if (kv.Time) {
    var m = /(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/.exec(kv.Time);
    if (m) {
      vcSet('vcAlarmDate', m[3] + '/' + m[2] + '/' + m[1]);
      vcSet('vcAlarmTime', m[4] + ':' + m[5] + ':' + m[6]);
    }
  }

  // Tensões (em milivolts; central reporta valores tipo 13019 = 13.019V).
  if (kv.Vdc !== undefined) {
    var vdc = parseInt(kv.Vdc, 10);
    if (!isNaN(vdc)) vcSet('vcTensaoFonte', vcFormatDecimal(vdc / 1000, 2) + ' Vcc');
  }
  if (kv.Vbat !== undefined) {
    var vbat = parseInt(kv.Vbat, 10);
    if (!isNaN(vbat)) {
      // Bateria abaixo de 0,5V → considera ausente (no log real central reporta 0).
      vcSet('vcTensaoBateria', (vbat / 1000) < 0.5
        ? VCi18n.t('common.absent')
        : vcFormatDecimal(vbat / 1000, 2) + ' Vcc');
    }
  }
  // Tamper e Sirene (assumido: 0=ok, 1=violado/ausente)
  if (kv.Tamper !== undefined) {
    vcSet('vcTamperCentral', kv.Tamper === '0' ? VCi18n.t('common.ok') : VCi18n.t('common.violated'));
  }
  if (kv.Sir !== undefined) {
    vcSet('vcSireneFio', kv.Sir === '0' ? VCi18n.t('common.ok') : VCi18n.t('common.absent'));
  }
}

function _vcLooksLikeServerAddress(value) {
  var raw = String(value == null ? '' : value).trim();
  if (!raw) return true;
  if (/^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?$/.test(raw)) return true;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?$/i.test(raw)) return true;
  return false;
}

function _vcServerEndpointLabel(value, cid) {
  if (_vcLooksLikeServerAddress(value)) return _vcCidLabel(cid || 'NC');
  return _vcServerConnLabel(value);
}

function _vcServerConnLabel(value) {
  var raw = String(value == null ? '' : value).trim();
  var s = raw.toLowerCase();
  if (!s) return '---';
  if (s === '1' || s === 'true' || s === 'ok' || s === 'on' || s === 'conectado' || s === 'connected') return VCi18n.t('common.connected');
  if (s === '0' || s === 'false' || s === 'nc' || s === 'off' || s === 'desconectado' || s === 'disconnected') return VCi18n.t('common.disconnected');
  return _vcCidLabel(raw);
}

function _vcCidLabel(cid) {
  // CID: NC = não conectado, GPRS, Wi-Fi, ethernet
  switch (String(cid).toLowerCase()) {
    case 'nc':       return VCi18n.t('status.cid_not_connected');
    case 'ethernet': return VCi18n.t('status.cid_ethernet');
    case 'gprs':     return VCi18n.t('status.cid_gprs');
    case 'wi-fi':
    case 'wifi':     return VCi18n.t('status.cid_wifi');
    default:         return cid;
  }
}

function _vcGsmLabel(gsm) {
  // GSM: NI = não instalado, 99 = sem sinal, 0..32 = RSSI
  if (gsm === 'NI') return VCi18n.t('common.not_installed');
  if (gsm === '99') return VCi18n.t('status.no_signal');
  return 'RSSI ' + gsm;
}

// Extrai operadora e tipo (2G/3G/4G) a partir de Modem + Cops.
// Formato Cops: "<mode>,<format>,'<operadora>',<actT>" (ex.: "0,0,'TIM',7").
// Tabela de actT (Quectel UG96/BG95/BG96/EG912Y/EG915U):
//   0,2,3 → 2G   |   4,5,6 → 3G   |   7 → 4G
// GL865: sempre 2G (sem actT na resposta).
function _vcGsmExtract(modem, cops) {
  var oper = '';
  var actT = -1;
  if (cops && cops.length) {
    var quoted = /'([^']+)'/.exec(cops);
    if (quoted) oper = quoted[1];
    var parts = cops.split(',');
    if (parts.length >= 4) {
      var n = parseInt((parts[3] || '').trim(), 10);
      if (!isNaN(n)) actT = n;
    }
  }
  var tipo = '';
  if (modem) {
    var quectel = ['UG96', 'BG96', 'BG95', 'EG912Y', 'EG915U'];
    if (quectel.indexOf(modem) >= 0) {
      if (actT === 0 || actT === 2 || actT === 3) tipo = '2G';
      else if (actT === 4 || actT === 5 || actT === 6) tipo = '3G';
      else if (actT === 7) tipo = '4G';
    } else if (modem.indexOf('GL865') >= 0) {
      tipo = '2G';
    } else if (actT === 0) tipo = '2G';
    else if (actT === 2) tipo = '3G';
  }
  return { operadora: oper, tipo: tipo, actT: actT };
}

// Versão estendida do label do modem para o header da tela Status: combina
// RSSI + Modem + tipo (2G/3G/4G) + operadora num único campo.
function _vcGsmFullLabel(gsm, modem, cops) {
  if (gsm === 'NI') return VCi18n.t('common.not_installed');
  if (gsm === '99') return VCi18n.t('status.no_signal');
  var base = 'RSSI ' + gsm;
  var info = _vcGsmExtract(modem, cops);
  var extras = [];
  if (info.operadora) extras.push(info.operadora);
  if (info.tipo)      extras.push(info.tipo);
  var prefix = modem || '';
  if (extras.length) prefix = (prefix ? prefix + ' ' : '') + '(' + extras.join(' - ') + ')';
  return prefix ? (prefix + ' · ' + base) : base;
}

function _vcScanCacheCentralKey() {
  var mac = (document.getElementById('vcCentralMac') || {}).textContent || '';
  return String(mac || '').replace(/^MAC:\s*/i, '').trim() || 'default';
}

function _vcGetScanCache() {
  try {
    var cache = JSON.parse(sessionStorage.getItem(VC_STATUS_SCAN_CACHE_KEY) || 'null');
    if (!cache || cache.central !== _vcScanCacheCentralKey() || !cache.html) return null;
    return cache;
  } catch (_) { return null; }
}

function _vcSaveScanCache() {
  var list = document.getElementById('vcDeviceList');
  if (!list || list.querySelector('.vc-scan-load-prompt')) return;
  try {
    sessionStorage.setItem(VC_STATUS_SCAN_CACHE_KEY, JSON.stringify({
      central: _vcScanCacheCentralKey(),
      html: list.innerHTML,
      devices: _vcStatusScanState.devices || [],
      absentZones: _vcStatusScanState.absentZones || {}
    }));
  } catch (_) {}
}

function _vcPrepareScanDevicesLazy() {
  var list = document.getElementById('vcDeviceList');
  if (!list) return;
  var cache = _vcGetScanCache();
  if (cache) {
    list.innerHTML = cache.html;
    _vcScanStateRestore(cache.devices || [], cache.absentZones || {});
    _vcRefreshScanNotApplicableLabels();
    vcApplyFilter();
    return;
  }
  vcClearDevices();
  _vcRenderScanLoadPrompt('Deseja carregar a lista de dispositivos?', true);
}

function _vcRenderScanLoadPrompt(message, showButton) {
  var list = document.getElementById('vcDeviceList');
  if (!list) return;
  list.innerHTML =
    '<div class="vc-scan-load-prompt">' +
      '<div class="vc-scan-load-text">' + _vcEscape(message || '') + '</div>' +
      (showButton
        ? '<button class="vc-btn vc-scan-load-btn" type="button" id="vcScanLoadDevicesBtn">Carregar</button>'
        : '') +
    '</div>';
}

async function _vcLoadScanDevicesOnDemand(btn) {
  var net = window.vettiAPI && window.vettiAPI.network;
  var list = document.getElementById('vcDeviceList');
  if (!net || typeof net.sendCommand !== 'function' || !list) return;
  if (btn) btn.disabled = true;
  _vcRenderScanLoadPrompt('Carregando lista de dispositivos...', false);
  var total = 0;
  try {
    var r4 = await net.sendCommand('BDS');
    if (r4 && r4.ok) {
      var b = _parseBds(r4.body);
      if (b) total = b.tot;
    }
  } catch (_) {
    _vcRenderScanLoadPrompt('Nao foi possivel carregar a lista de dispositivos.', true);
    return;
  }

  vcClearDevices();
  if (total > 0) {
    try {
      await _vcLoadDevices(total);
    } catch (_) {
      _vcRenderScanLoadPrompt('Nao foi possivel carregar a lista de dispositivos.', true);
      return;
    }
  } else {
    _vcRenderScanLoadPrompt('Nenhum dispositivo encontrado.', true);
    return;
  }
  if (!list.querySelector('.vc-device')) {
    _vcRenderScanLoadPrompt('Nenhum dispositivo encontrado.', true);
    return;
  }
  _vcSaveScanCache();
  _vcRefreshScanNotApplicableLabels();
  vcApplyFilter();
}

async function _vcLoadDevices(total) {
  var net = window.vettiAPI.network;
  // Acumula em quais partições há periféricos. Partição 1 é sempre em uso.
  var partsInUse = { 1: true, 2: false, 3: false, 4: false, 5: false, 6: false };
  var known = [];   // índices dos dispositivos para depois consultar STAT 6/7
  _vcKnownIndices = known;

  function consume(d) {
    if (!d) return;
    if (_vcShouldHideM4WiredZone(d.idx)) return;
    _vcAddDeviceFromBdx(d);
    if (typeof d.idx === 'number' && d.stat !== 'INV') known.push(d.idx);
    // Campo p:1----- (cada char = uma partição). '1' = pertence.
    if (d.p) {
      for (var k = 0; k < d.p.length && k < 6; k++) {
        if (d.p[k] === '1') partsInUse[k + 1] = true;
      }
    }
  }

  if (_vcIsM4()) {
    var max = Math.max(0, parseInt(total || 0, 10) || 0);
    var miss = 0;
    for (var order = 1; order <= Math.min(max + 8, 256); order++) {
      var rm4;
      try { rm4 = await net.sendCommand('BDX ' + order); } catch (_) { break; }
      if (!rm4) break;
      if (!rm4.ok) {
        if (rm4.errorCode === 14) break;
        continue;
      }
      var dm4 = _parseBdx(rm4.body);
      if (dm4) {
        miss = 0;
        consume(dm4);
      } else {
        miss++;
        if (miss >= 8 && order >= max) break;
      }
    }
  } else {
    try {
      var r = await net.sendCommand('BDX i');
      if (!r || !r.ok) { _vcApplyPartitionsInUse(partsInUse); return; }
      consume(_parseBdx(r.body));
    } catch (_) { _vcApplyPartitionsInUse(partsInUse); return; }

    for (var i = 0; i < 1024; i++) {
      var r2;
      try { r2 = await net.sendCommand('BDX +'); } catch (_) { break; }
      if (!r2) break;
      if (!r2.ok) {
        if (r2.errorCode === 27) break;
        continue;
      }
      consume(_parseBdx(r2.body));
    }
  }

  _vcApplyPartitionsInUse(partsInUse);

  // Após o BDX completo, busca o status detalhado de cada dispositivo
  // (Bat, LowBat, Tamper, RSSI, Stat) via STAT 6 <idx> ou STAT 7 <idx>.
  if (!_vcIsM4()) await _vcLoadDeviceStatuses(known);
}

// Itera pelos dispositivos conhecidos e busca STAT 6 (ou STAT 7 se STAT 6
// retornar ERR 8 — central nova). Atualiza Bateria, Status, Tamper e RSSI
// no card do dispositivo + tags do filtro.
async function _vcLoadDeviceStatuses(indices) {
  var net = window.vettiAPI.network;
  if (!net || !indices || indices.length === 0) return;
  var statCmd = 'STAT 6';   // padrão; fallback automático para STAT 7

  for (var i = 0; i < indices.length; i++) {
    var idx = indices[i];
    var r;
    try { r = await net.sendCommand(statCmd + ' ' + idx); } catch (_) { continue; }
    if (!r) continue;
    if (!r.ok && r.errorCode === 8 && statCmd === 'STAT 6') {
      // Firmware mais novo: tenta STAT 7 e fixa para os próximos.
      statCmd = 'STAT 7';
      try { r = await net.sendCommand(statCmd + ' ' + idx); } catch (_) { continue; }
    }
    if (!r || !r.ok) continue;
    var s = _parseStatDev(r.body);
    if (s) _vcApplyStatDev(idx, s);
  }
}

// Parseia o corpo "STAT 6 Idx=N Tipo=X Ver=Y Bat=Z LowBat=W Tamper=V RSSI=R Stat=S"
// (também aceita STAT 7 que tem SupRf= extra). Retorna objeto { Idx, Tipo, ... }.
function _parseStatDev(body) {
  return _vcParseStatDevPayload(body);
  var b = String(body || '').trim();
  var m = /^STAT\s+[67]\s+(.*)$/i.exec(b);
  if (!m) return null;
  var rest = m[1];
  var out = {};
  // chave=valor (valor sem espaço, ou entre aspas duplas)
  var re = /(\w+)=("([^"]*)"|(\S+))/g;
  var match;
  while ((match = re.exec(rest)) !== null) {
    out[match[1]] = match[3] !== undefined ? match[3] : match[4];
  }
  return _vcNormalizeStatDevKeys(out);
}

function _vcNormalizeStatDevKeys(raw) {
  var out = raw || {};
  Object.keys(out).forEach(function (key) {
    var norm = key.toLowerCase();
    if (norm === 'rssi' && out.RSSI === undefined) out.RSSI = out[key];
    if (norm === 'tamper' && out.Tamper === undefined) out.Tamper = out[key];
    if (norm === 'stat' && out.Stat === undefined) out.Stat = out[key];
    if (norm === 'bat' && out.Bat === undefined) out.Bat = out[key];
    if (norm === 'lowbat' && out.LowBat === undefined) out.LowBat = out[key];
    if (norm === 'tipo' && out.Tipo === undefined) out.Tipo = out[key];
    if (norm === 'ver' && out.Ver === undefined) out.Ver = out[key];
    if (norm === 'idx' && out.Idx === undefined) out.Idx = out[key];
  });
  return out;
}

function _parseAsyncStatDev(body) {
  return _vcParseStatDevPayload(body);
  var b = String(body || '').trim();
  var m = /^(\d+)\s+(.*)$/i.exec(b);
  if (!m) return null;
  var out = { Idx: m[1] };
  var re = /(\w+)=("([^"]*)"|(\S+))/g;
  var match;
  while ((match = re.exec(m[2])) !== null) {
    out[match[1]] = match[3] !== undefined ? match[3] : match[4];
  }
  return _vcNormalizeStatDevKeys(out);
}

// Classifica o RSSI em 0..4 barras (ícones bi-reception-0..4).
// Valores observados na central: 0-255 (positivos). Não é dBm.
// Amostras reais: 213, 206 → sinal bom.
function _vcParseStatDevPayload(body) {
  var b = String(body || '').trim();
  if (!b) return null;

  b = b.replace(/^\[(?:R|N)\d+\s+|\]$/gi, '').trim();
  b = b.replace(/^(?:R|N)\d+\s+/i, '').trim();
  b = b.replace(/^STAT\s+[67]\s+/i, '').trim();
  b = b.replace(/^[67]\s+(?=\S)/i, '').trim();

  var out = {};
  var head = /^(\d+)\b\s*/.exec(b);
  if (head) {
    out.Idx = head[1];
    b = b.substring(head[0].length).trim();
  }

  var re = /(\w+)=("([^"]*)"|(\S+))/g;
  var match;
  while ((match = re.exec(b)) !== null) {
    out[match[1]] = match[3] !== undefined ? match[3] : match[4];
  }

  out = _vcNormalizeStatDevKeys(out);
  return Object.keys(out).length ? out : null;
}

function _vcNormalizeOpenClosed(value) {
  if (value === undefined || value === null) return '';
  var s = String(value).trim().toLowerCase();
  if (!s) return '';
  if (s === '1' || s === 'true' || s === 'aberto' || s === 'open' || s === 'opened' || s === 'disparado' || s === 'ativo' || s === 'on') return '1';
  if (s === '0' || s === 'false' || s === 'fechado' || s === 'closed' || s === 'close' || s === 'normal' || s === 'ok' || s === 'inativo' || s === 'off') return '0';
  return '';
}

function _vcNormalizeTamperState(value) {
  if (value === undefined || value === null) return '';
  var s = String(value).trim().toLowerCase();
  if (!s) return '';
  if (s === '1' || s === 'true' || s === 'violado' || s === 'violada' || s === 'violate' || s === 'violated' || s === 'aberto' || s === 'open' || s === 'ativo' || s === 'on') return '1';
  if (s === '0' || s === 'false' || s === 'ok' || s === 'normal' || s === 'fechado' || s === 'closed' || s === 'inativo' || s === 'off') return '0';
  return '';
}

function _vcRssiBars(rssi) {
  if (isNaN(rssi)) return 0;
  if (rssi >= 200) return 4;   // excelente
  if (rssi >= 160) return 3;   // bom
  if (rssi >= 110) return 2;   // médio
  if (rssi >=  60) return 1;   // baixo
  return 0;                    // muito baixo / sem sinal
}

function _vcFormatDeviceBat(rawBat, lowBat) {
  var bat = parseInt(rawBat, 10);
  if (!isNaN(bat) && bat >= 0) {
    return (bat / 10).toFixed(1) + 'V' + (lowBat === '1' || lowBat === true ? ' ⚠' : '');
  }
  if (lowBat === '1' || lowBat === true) return VCi18n.t('scan.bat_low');
  if (lowBat === '0' || lowBat === false) return 'OK';
  return '---';
}

function _vcBatteryIconName(rawBat, lowBat) {
  var bat = parseInt(rawBat, 10);
  if (lowBat === '1' || lowBat === true) return 'bateria-baixa';
  if (isNaN(bat) || bat < 0) return '';
  if (bat > 28) return 'bateria-alta';
  if (bat >= 24) return 'bateria-media';
  return 'bateria-baixa';
}

function _vcScanBatteryHTML(rawBat, lowBat) {
  return _vcScanIconValueHTML(_vcFormatDeviceBat(rawBat, lowBat), _vcBatteryIconName(rawBat, lowBat));
}

function _vcScanStatusHTML(stat) {
  var state = _vcNormalizeOpenClosed(stat);
  if (state === '1') return _vcScanIconValueHTML(VCi18n.t('scan.stat_open'), 'porta-aberta');
  if (state === '0') return _vcScanIconValueHTML(VCi18n.t('scan.stat_closed'), 'porta-fechada');
  return _vcScanIconValueHTML('---', '');
}

function _vcScanTamperHTML(tamper) {
  var state = _vcNormalizeTamperState(tamper);
  if (state === '1') return _vcScanIconValueHTML(VCi18n.t('scan.tamper_violated'), 'tamper-violado');
  if (state === '0') return _vcScanIconValueHTML('OK', 'tamper-ok');
  return _vcScanIconValueHTML('---', '');
}

function _vcScanRssiHTML(rawRssi) {
  var rssi = parseInt(rawRssi, 10);
  if (rawRssi === undefined || rawRssi === '') return _vcScanIconValueHTML('---', '');
  var bars = _vcRssiBars(rssi);
  return _vcScanIconValueHTML(isNaN(rssi) ? rawRssi : rssi, 'rssi-' + bars);
}

function _vcSetScanTransmissionHint(id, show) {
  var el = document.getElementById('vcDev' + id + 'NomeDisp');
  if (!el) return;
  var textEl = el.querySelector('.vc-device-name-text') || el;

  var old = el.querySelector('.vc-device-rf-update-msg');
  if (old) old.remove();

  if (!el.dataset.baseName) {
    el.dataset.baseName = (textEl.textContent || '').trim() || '---';
  }

  textEl.textContent = el.dataset.baseName;
  if (show) {
    var msg = document.createElement('span');
    msg.className = 'vc-device-rf-update-msg';
    msg.textContent = VCi18n.t('scan.rf_update_hint');
    textEl.appendChild(msg);
  }

  var card = document.getElementById('vcDevice' + id);
  if (card) card.classList.toggle('needs-transmission', show);
}

function _vcApplyStatDev(idx, s) {
  if (!s) return;
  var id = String(idx).padStart(3, '0');
  var rules = _vcScanRulesForDeviceId(id);
  function set(suffix, v) {
    var el = document.getElementById('vcDev' + id + suffix);
    if (el && suffix === 'Tipo') {
      el.dataset.vcType = v || '---';
      el.innerHTML = _vcScanTypeValueHTML(v || '---');
    } else if (el) {
      el.textContent = v;
    }
  }
  function setHTML(suffix, html) {
    var el = document.getElementById('vcDev' + id + suffix);
    if (el) el.innerHTML = html;
  }

  // Bateria dos dispositivos vem em decimos de volt: Bat=31 -> 3.1V.
  var bat = parseInt(s.Bat, 10);
  setHTML('Bateria', _vcScanBatteryHTML(s.Bat, s.LowBat));
  var statState = _vcNormalizeOpenClosed(s.Stat);
  var tamperState = _vcNormalizeTamperState(s.Tamper);

  // Status do sensor: 0=fechado/OK, 1=aberto/disparado
  if (!rules.na.Status && statState) setHTML('Status', _vcScanStatusHTML(statState));

  // Tamper: 0=OK, 1=violado
  if (!rules.na.Tamper && tamperState) setHTML('Tamper', _vcScanTamperHTML(tamperState));

  // RSSI: ícone de barras + número absoluto.
  var rssi = parseInt(s.RSSI, 10);
  var bars = _vcRssiBars(rssi);
  if (!rules.na.Rssi && s.RSSI !== undefined && s.RSSI !== '') {
    setHTML('Rssi', _vcScanRssiHTML(s.RSSI));
  }

  _vcSetScanTransmissionHint(id, bat === 0 && rssi === 0);

  // Atualiza tags para o filtro do scan (classificação por barras 0-4)
  var devEl = document.getElementById('vcDevice' + id);
  _vcScanStatePatchDevice(idx, {
    battery: _vcScanStatePlain(_vcFormatDeviceBat(s.Bat, s.LowBat)),
    status: (!rules.na.Status && statState)
      ? (statState === '1' ? VCi18n.t('scan.stat_open') : VCi18n.t('scan.stat_closed'))
      : undefined,
    tamper: (!rules.na.Tamper && tamperState)
      ? (tamperState === '1' ? VCi18n.t('scan.tamper_violated') : 'OK')
      : undefined,
    rssi: (!rules.na.Rssi && s.RSSI !== undefined && s.RSSI !== '') ? String(s.RSSI) : undefined,
    absent: false
  });
  _vcScanStateClearAbsentByIdx(idx);
  if (devEl) vcSetDeviceAbsent('vcDevice' + id, false);
  _vcSaveScanCache();
  if (devEl) {
    var tags = (devEl.dataset.filter || '').split(/\s+/).filter(Boolean);
    tags = tags.filter(function (tag) {
      return ['battery_low', 'tamper', 'open', 'signal_low', 'signal_med', 'signal_high'].indexOf(tag) < 0;
    });
    if (s.LowBat === '1') tags.push('battery_low');
    if (!rules.na.Tamper && tamperState === '1') tags.push('tamper');
    if (!rules.na.Status && statState === '1')   tags.push('open');
    if (!rules.na.Rssi && !isNaN(rssi)) {
      if (bars <= 1)      tags.push('signal_low');
      else if (bars <= 2) tags.push('signal_med');
      else                tags.push('signal_high');
    }
    devEl.dataset.filter = Array.from(new Set(tags)).join(' ');
  }
}

// Marca cada partição como em-uso (default 'disarmed') ou 'unused'.
// Se a UI já tem evento mais recente (CSTAT), preserva o estado.
function _vcApplyPartitionsInUse(map) {
  for (var n = 1; n <= 6; n++) {
    var card = document.getElementById('vcPartCard' + n);
    if (!card) continue;
    var hasState = card.classList.contains('armed') || card.classList.contains('disarmed') || card.classList.contains('alarm');
    if (map[n] && !hasState) {
      vcSetPartition(n, 'disarmed');
    } else if (!map[n]) {
      vcSetPartition(n, 'unused');
    }
  }
  _vcBindPartitionClicks();
}

function _vcAddDeviceFromBdx(d) {
  // Mapeia o registro BDX para o formato esperado por vcAddDevice.
  vcAddDevice(d.idx, {
    name:        d.nome || ('Dispositivo ' + d.idx),
    zona:        d.idx ? String(d.idx).padStart(3, '0') : '---',
    tipo:        d.tipo || '---',
    versao:      d.versao ? ('V ' + d.versao) : '---',
    particao:    d.p || '---',
    bateria:     '---',          // TODO: vem de STAT 3 (mapa de bits)
    status:      '---',          // TODO: vem de STAT 1
    tamper:      '---',          // TODO: vem de eventos / supervisão
    rssi:        '---',
    inibido:     d.z && d.z.indexOf('I') >= 0 ? VCi18n.t('common.yes') : VCi18n.t('common.no'),
    h24:         d.z && d.z.indexOf('2') >= 0 ? VCi18n.t('common.yes') : VCi18n.t('common.no'),
    temporizado: d.z && d.z.indexOf('T') >= 0 ? VCi18n.t('common.yes') : VCi18n.t('common.no'),
    silencioso:  d.z && d.z.indexOf('S') >= 0 ? VCi18n.t('common.yes') : VCi18n.t('common.no'),
    absent:      d.stat === 'INV'
  });
}

/* ═════════════════════════════════════════════════════════════
   SISTEMA → DISPOSITIVOS (aba)
   Comandos do BD (validados na versão Java em produção):
     BDS                              → sumário (Tot/Max/Inib)
     BDX I / BDX +                    → iterar registros
     BD <idx>                         → ler registro detalhado
     BD <idx> Nome:"..." p:... z:...  → editar (campos combináveis)
     BD <idx> Stat:DEL                → excluir
     BD <idx> Stat:DES / Stat:OK      → desativar / reativar
     CMD 8                            → modo cadastro RF (aguarda sinal)
   ═════════════════════════════════════════════════════════════ */
var _vcDispCache = {};   // idx → { nome, p (string 6 chars), z, zs, stat, tipo, versao, end }
var _vcDispSelected = null;

/* ═════════════════════════════════════════════════════════════
   STATUS DE DISPOSITIVO (eventos assíncronos [N6]/[N7])
   ═════════════════════════════════════════════════════════════
   A central emite [N6 idx Tipo=... Bat=N Tamper=N Rssi=N Stat=N ...]
   ou [N7 ...] (extendido com SupRf) quando os dispositivos transmitem
   por RF. Espelha Comm.java:1080-1170. Gate de FW: mod=5≥554 /
   mod=6≥654 / mod≥7 (`flagCentral_v554_v654`).
   ═════════════════════════════════════════════════════════════ */

var _vcDispStatListenerInstalled = false;

function _vcDispInstallStatusListener() {
  if (_vcDispStatListenerInstalled) return;
  if (!window.vettiAPI || !window.vettiAPI.network) return;
  window.vettiAPI.network.onAsyncEvent(function (ev) {
    if (ev.seq !== 6 && ev.seq !== 7) return;   // só CMD 6/7
    var s = String(ev.body || '');
    // body: "<idx> Tipo=... Ver=... Bat=N LowBat=N Tamper=N Rssi=N Stat=N SupRf=N"
    var head = /^(\d+)\s+/.exec(s);
    if (!head) return;
    var devIdx = parseInt(head[1], 10);
    if (!devIdx) return;
    var d = _vcDispCache[devIdx];
    if (!d) return;
    var rest = s.substring(head[0].length);
    rest.split(/\s+/).forEach(function (tok) {
      var eq = tok.indexOf('=');
      if (eq <= 0) return;
      var k = tok.substring(0, eq);
      var v = tok.substring(eq + 1);
      var n = parseInt(v, 10);
      switch (k) {
        case 'Bat':    if (!isNaN(n)) d.bat    = n;        break; // décimos de V (30 → 3.0V)
        case 'LowBat': d.lowBat = (n === 1);               break;
        case 'Tamper': d.tamper = (n === 1);               break;
        case 'Rssi':   if (!isNaN(n)) d.rssi   = n;        break;
        case 'Stat':   d.devStat = (n === 1);              break; // sensor aberto / PGM ligado
        case 'SupRf':  d.supRf  = (n === 1);               break;
        case 'Tipo':   if (v) d.tipo = v;                  break;
        case 'Ver':    if (v) d.versao = v;                break;
      }
    });
    d.rxAt = new Date();
    _vcDispCache[devIdx] = d;
    // Atualiza spans no painel ativo (Sistema ou Partição) se o
    // dispositivo for o atualmente selecionado.
    if (typeof _vcDispSelected !== 'undefined' && _vcDispSelected === devIdx) _vcDispRenderStatus(d);
    if (typeof _vcParDispSelected !== 'undefined' && _vcParDispSelected === devIdx) _vcParDispRenderStatus(d);
  });
  _vcDispStatListenerInstalled = true;
}

function _vcDispFmtBat(d)    {
  if (d.bat == null) return '---';
  return _vcFormatDeviceBat(d.bat, d.lowBat);
}
function _vcDispFmtTamper(d) {
  if (d.tamper == null) return '---';
  return d.tamper ? (VCi18n.t('pdisp.tamper_violada') || 'Violada') : 'OK';
}
function _vcDispFmtRssi(d)   { return (d.rssi == null) ? '---' : String(d.rssi); }
function _vcDispFmtStatus(d) {
  if (d.devStat == null) return '---';
  // Sensor: aberto/fechado. PGM: ligado/desligado. PIR: normal/disparo.
  var info = _vcDevTypeInfo(d.tipo);
  if (!info) return d.devStat ? 'ON' : 'OFF';
  if (info.knownKind === 'pgm' || info.knownKind === 'sirene') {
    return d.devStat ? (VCi18n.t('pdisp.stat_ligado')  || 'Ligado')
                     : (VCi18n.t('pdisp.stat_desligado') || 'Desligado');
  }
  if (info.knownKind === 'pir') {
    return d.devStat ? (VCi18n.t('pdisp.stat_disparo') || 'Disparo')
                     : (VCi18n.t('pdisp.stat_normal')  || 'Normal');
  }
  return d.devStat ? (VCi18n.t('pdisp.stat_aberto')  || 'Aberto')
                   : (VCi18n.t('pdisp.stat_fechado') || 'Fechado');
}
function _vcDispFmtRx(d) {
  if (!d.rxAt) return '--:--';
  var h = String(d.rxAt.getHours()).padStart(2, '0');
  var m = String(d.rxAt.getMinutes()).padStart(2, '0');
  return h + ':' + m;
}

function _vcDispRenderStatus(d) {
  var bat = document.getElementById('vcDispBat');
  var tam = document.getElementById('vcDispTamper');
  var rss = document.getElementById('vcDispRssi');
  var sta = document.getElementById('vcDispStatus');
  var rx  = document.getElementById('vcDispRx');
  if (bat) bat.textContent = _vcDispFmtBat(d);
  if (tam) tam.textContent = _vcDispFmtTamper(d);
  if (rss) rss.textContent = _vcDispFmtRssi(d);
  if (sta) sta.textContent = _vcDispFmtStatus(d);
  if (rx)  rx.textContent  = 'RX: ' + _vcDispFmtRx(d);
}

function _vcParDispRenderStatus(d) {
  var bat = document.getElementById('vcParDispBat');
  var tam = document.getElementById('vcParDispTamper');
  var rss = document.getElementById('vcParDispRssi');
  var sta = document.getElementById('vcParDispStatus');
  var rx  = document.getElementById('vcParDispRx');
  if (bat) bat.textContent = _vcDispFmtBat(d);
  if (tam) tam.textContent = _vcDispFmtTamper(d);
  if (rss) rss.textContent = _vcDispFmtRssi(d);
  if (sta) sta.textContent = _vcDispFmtStatus(d);
  if (rx)  rx.textContent  = 'RX: ' + _vcDispFmtRx(d);
}

/* Varre o banco de dispositivos (BDX I + BDX +) e popula `_vcDispCache`.
   Independente da tela ativa — pode ser chamada por Sistema → Dispositivos
   OU por Partição → Dispositivos. Não toca em DOM (cabe a quem chama
   renderizar). */
async function _vcDispCacheLoad() {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return;
  _vcDispCache = {};
  try {
    var r = await net.sendCommand('BDX I');
    if (!r || !r.ok) return;
    var d0 = _parseBdx(r.body);
    if (d0) _vcDispCache[d0.idx] = d0;
  } catch (_) { return; }

  for (var i = 0; i < 1024; i++) {
    var r2;
    try { r2 = await net.sendCommand('BDX +'); } catch (_) { break; }
    if (!r2) break;
    if (!r2.ok) { if (r2.errorCode === 27) break; continue; }
    var dN = _parseBdx(r2.body);
    if (dN) _vcDispCache[dN.idx] = dN;
  }
}

async function _vcDispLoad() {
  var panel = document.getElementById('vcSysDispositivos');
  if (!panel) return;
  panel.dataset.loaded = '1';
  vcToast(VCi18n.t('common.loading_tab', { tab: 'Dispositivos' }), 'info', 0,
          { id: 'load-panel-vcSysDispositivos', persist: true });

  var list = document.getElementById('vcDispList');
  if (list) list.innerHTML = '';

  await _vcDispCacheLoad();
  Object.keys(_vcDispCache).forEach(function (k) { _vcDispAppendRow(_vcDispCache[k]); });

  _vcDispBindListClicks();
  _vcDispBindButtons();
  // Carrega card "Acionamentos globais" (PARs B1010000/B1020000)
  _vcDispGlobaisLoad();
  vcToast(VCi18n.t('common.loaded_tab', { tab: 'Dispositivos' }), 'success', 2500,
          { id: 'load-panel-vcSysDispositivos' });
}

function _vcDispAppendRow(d) {
  var list = document.getElementById('vcDispList');
  if (!list) return;
  // Pula registros inválidos (sem dispositivo cadastrado)
  if (d.stat === 'INV') return;
  var row = document.createElement('div');
  row.className = 'vc-disp-row';
  row.dataset.idx = d.idx;
  row.style.cssText = 'display:grid;grid-template-columns:60px 1fr 70px 70px 80px;padding:6px 8px;border-bottom:1px solid #E5E8EB;cursor:pointer;font-size:13px;';
  row.innerHTML =
    '<div>' + String(d.idx).padStart(3, '0') + '</div>' +
    '<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _vcEscape(d.nome || '---') + '</div>' +
    '<div title="' + _vcEscape(d.tipo || '') + '">' + _vcEscape(_vcDevTypeLabel(d.tipo, d.idx)) + '</div>' +
    '<div>' + (d.versao ? 'V ' + _vcEscape(d.versao) : '---') + '</div>' +
    '<div>' + _vcEscape(d.p || '---') + '</div>';
  list.appendChild(row);
}

function _vcDispBindListClicks() {
  var list = document.getElementById('vcDispList');
  if (!list || list._vcBound) return;
  list._vcBound = true;
  list.addEventListener('click', function (e) {
    var row = e.target.closest('.vc-disp-row');
    if (!row) return;
    var idx = parseInt(row.dataset.idx, 10);
    if (isNaN(idx)) return;
    list.querySelectorAll('.vc-disp-row').forEach(function (r) {
      r.style.background = '';
    });
    row.style.background = 'rgba(0,118,203,.10)';
    _vcDispSelectItem(idx);
  });
}

/* ─── Mapeamento DevType (Func.kt:198-215 + Comm.java:214-258) ────
   Códigos crus retornados por `BDX +`/`BD <idx>` no campo Tipo: */
var _VC_DEV_TYPES = {
  'Cen': { key: 'central',         sensor: false, knownKind: 'central'  },
  'CR4': { key: 'cr4',             sensor: false, knownKind: 'remote'   },
  'CR8': { key: 'cr8',             sensor: false, knownKind: 'remote'   },
  'A':   { key: 'mag_curto',       sensor: true,  knownKind: 'sensor'   },
  'ALR': { key: 'mag_longo',       sensor: true,  knownKind: 'sensor'   },
  'P':   { key: 'infra_curto',     sensor: true,  knownKind: 'pir'      },
  'PLR': { key: 'infra_longo',     sensor: true,  knownKind: 'pir'      },
  'PD':  { key: 'presenca_duplo',  sensor: true,  knownKind: 'pir'      },
  'Plg': { key: 'smartplug',       sensor: false, knownKind: 'pgm'      },
  'Ven': { key: 'ventilador',      sensor: false, knownKind: 'pgm'      },
  'Shx': { key: 'abertura_shox',   sensor: true,  knownKind: 'sensor'   },
  'AS':  { key: 'abertura_s',      sensor: true,  knownKind: 'sensor'   },
  'IR':  { key: 'ir_cloner',       sensor: false, knownKind: 'pgm'      },
  'Sir': { key: 'sirene_sem_fio',  sensor: false, knownKind: 'sirene'   },
  'Int': { key: 'interruptor',     sensor: false, knownKind: 'pgm'      },
  'TLR': { key: 'transmissor_lr',  sensor: true,  knownKind: 'sensor'   },
  'Tec': { key: 'smart_teclado',   sensor: false, knownKind: 'teclado'  },
  'BP':  { key: 'botao_panico',    sensor: false, knownKind: 'panico'   },
  'Fio': { key: 'sensor_com_fio',  sensor: true,  knownKind: 'wired'    }
};

function _vcDevTypeInfo(tipoRaw) {
  // Aceita tanto código cru ('PLR') quanto se já vier mapeado.
  return _VC_DEV_TYPES[String(tipoRaw || '').trim()] || null;
}

function _vcDevTypeLabel(tipoRaw, regIdx) {
  // Label traduzido pro tipo de dispositivo. Pra SENSOR_COM_FIO, anexa
  // sufixo " 1" ou " 2" conforme regIdx==256 (CtrlMain.java:2027-2031).
  var info = _vcDevTypeInfo(tipoRaw);
  if (!info) {
    return tipoRaw ? (VCi18n.t('dispositivos.tipo_desconhecido') || '???') : '---';
  }
  var label = VCi18n.t('dispositivos.tipo_' + info.key) || String(tipoRaw);
  if (info.key === 'sensor_com_fio') {
    label += (parseInt(regIdx, 10) === 256 ? ' 2' : ' 1');
  }
  return label;
}

function _vcDevIsSensor(tipoRaw) {
  var info = _vcDevTypeInfo(tipoRaw);
  return !!(info && info.sensor);
}

function _vcDevIsKnown(tipoRaw) {
  return !!_vcDevTypeInfo(tipoRaw);
}

/* Matriz de habilitação dos 6 checkboxes de zona, por tipo. Espelha
   CtrlMain.java:2071-2097.
     • Não-sensor (CR4/CR8/Sir/Plg/Int/IR/Ven/Tec/BP) → só Inibido.
     • INFRA (P/PLR) → todas EXCETO Portão (PIR não monitora portão).
     • Sensores comuns (A/ALR/Shx/AS/TLR/Fio) → todas habilitadas.
     • UNKNOWN/null → tudo desabilitado (form bloqueado também).
   Retorna { h24, temp, silenc, inibido, stay, portao } com booleans. */
function _vcDevZoneEnabled(tipoRaw) {
  var info = _vcDevTypeInfo(tipoRaw);
  if (!info) {
    return { h24: false, temp: false, silenc: false, inibido: false, stay: false, portao: false };
  }
  if (!info.sensor) {
    // Não-sensor: só Inibido (CtrlMain:2071-2079)
    return { h24: false, temp: false, silenc: false, inibido: true, stay: false, portao: false };
  }
  // Sensor — todas habilitadas, exceto Portão se for PIR
  var isPir = (info.knownKind === 'pir');
  return { h24: true, temp: true, silenc: true, inibido: true, stay: true, portao: !isPir };
}

function _vcDispSelectItem(idx) {
  var d = _vcDispCache[idx];
  if (!d) return;
  _vcDispSelected = idx;
  document.getElementById('vcDispEditEmpty').classList.add('d-none');
  document.getElementById('vcDispEditForm').classList.remove('d-none');
  document.getElementById('vcDispEditNome').value = d.nome || '';

  // Tipo do dispositivo (label traduzido + sufixo SENSOR_COM_FIO).
  var lblTipo = document.getElementById('vcDispEditTipo');
  if (lblTipo) lblTipo.textContent = _vcDevTypeLabel(d.tipo, idx);

  // Partições: bitmask "1-3-5-" → checkbox 1, 3, 5 marcados
  var pStr = (d.p || '').padEnd(6, '-');
  document.querySelectorAll('.vc-disp-part').forEach(function (b, i) {
    var ch = pStr.charAt(i);
    b.checked = (ch !== '-' && ch !== '0');
  });

  // Zona: bitmask "2TSIPO" → flags
  // Posições: 0=H24('2'), 1=Temp('T'), 2=Silenc('S'), 3=Inibido('I'),
  //           4=Stay('P' v4+ ou 'Y' v2-v3), 5=Portão('O')
  var zStr = (d.z || '').padEnd(6, '-');
  var enabled = _vcDevZoneEnabled(d.tipo);
  document.querySelectorAll('.vc-disp-zone').forEach(function (b) {
    var isOn = false, on = false;
    switch (b.value) {
      case 'h24':     isOn = zStr.charAt(0) === '2';                              on = enabled.h24;     break;
      case 'temp':    isOn = zStr.charAt(1) === 'T';                              on = enabled.temp;    break;
      case 'silenc':  isOn = zStr.charAt(2) === 'S';                              on = enabled.silenc;  break;
      case 'inibido': isOn = zStr.charAt(3) === 'I';                              on = enabled.inibido; break;
      case 'stay':    isOn = zStr.charAt(4) === 'P' || zStr.charAt(4) === 'Y';    on = enabled.stay;    break;
      case 'portao':  isOn = zStr.charAt(5) === 'O';                              on = enabled.portao;  break;
    }
    b.checked  = isOn && on;   // se a opção é incompatível, força off
    b.disabled = !on;
    // Estilo do label pai (vc-disabled-row) só pra deixar visível ao
    // usuário que aquela opção não se aplica ao tipo dele.
    var lbl = b.closest('.form-check');
    if (lbl) lbl.classList.toggle('vc-form-check-disabled', !on);
  });

  // Botão Desativar/Reativar: alterna label conforme o Stat atual do registro.
  _vcDispUpdateDeactivateBtn(d.stat);

  // UNKNOWN / NONE: bloqueia ações destrutivas (CtrlMain.java:2014, 2355-2358).
  var unknown = !_vcDevIsKnown(d.tipo);
  var btnSalvar     = document.getElementById('vcDispBtnSalvar');
  var btnExcluir    = document.getElementById('vcDispBtnExcluir');
  var btnDeactivate = document.getElementById('vcDispBtnDeactivate');
  if (btnSalvar)     btnSalvar.disabled     = unknown;
  if (btnExcluir)    btnExcluir.disabled    = unknown;
  if (btnDeactivate) btnDeactivate.disabled = unknown;

  // Aplica cards específicos por tipo de dispositivo de automação.
  // Mapa de visibilidade (gates de firmware espelham CtrlMain.java + CtrlCfgAdvanced.kt):
  //   • Plg/Int: card "Atributos da zona" oculto → mostra "Configuração de PGM" (Acao radios) + "Comando direto"
  //   • IR_CLONER: oculta "Atributos da zona" → mostra painel "Módulo IR" (substitui PGM)
  //   • Ven/Sir: mantém zona desabilitada (matriz Tipo×Zona) — sem card extra
  //   • Todos PGMs (Plg/Int/Ven/IR/Sir) em mod>=V5.14: botão "Configurações avançadas"
  var info     = _vcDevTypeInfo(d.tipo);
  var isPlgInt = info && (info.key === 'smartplug'  || info.key === 'interruptor');
  var isIR     = info && info.key === 'ir_cloner';
  var isVen    = info && info.key === 'ventilador';
  var isSir    = info && info.key === 'sirene_sem_fio';
  var isAutom  = isPlgInt || isIR || isVen || isSir;
  var mod = _vcCentralMod || 0;
  var ver = _vcCentralVer || 0;
  var fwSupportsAcao        = (mod === 5 && ver >= 553) || (mod === 6 && ver >= 653) || (mod >= 7);
  var fwSupportsCfgAvancada = (mod === 5 && ver >= 514) || (mod === 6 && ver >= 614) || (mod >= 7);

  _vcDispApplyPgmCard(isPlgInt && fwSupportsAcao, d.acao);

  // Card Comando direto — só Plg/Int (CMD 3 só faz sentido pra eles)
  var cmdDireto = document.getElementById('vcDispCmdDiretoWrap');
  if (cmdDireto) cmdDireto.classList.toggle('d-none', !isPlgInt);

  // Botão Cfg avançadas — todos PGMs + Sir, em FW compatível
  var cfgWrap = document.getElementById('vcDispCfgAvancadaWrap');
  if (cfgWrap) cfgWrap.classList.toggle('d-none', !(isAutom && fwSupportsCfgAvancada));

  // Painel Módulo IR — só IR_CLONER (esconde zona)
  var irWrap = document.getElementById('vcDispIrWrap');
  if (irWrap) {
    irWrap.classList.toggle('d-none', !isIR);
    if (isIR) {
      // Zona não faz sentido pra IR; esconde também
      var zonaWrap = document.getElementById('vcDispZonaWrap');
      if (zonaWrap) zonaWrap.classList.add('d-none');
      _vcDispIrBuildGrid();
    }
  }

  // Status row (Bat/Tamper/RSSI/Stat) — populado pelos eventos [N6]/[N7]
  // assíncronos. Pode estar vazio até o dispositivo transmitir. Gate FW
  // (`flagCentral_v554_v654`): mod=5≥554 / mod=6≥654 / mod≥7.
  var statusWrap = document.getElementById('vcDispStatusWrap');
  if (statusWrap) {
    var fwSupportsStat = (mod === 5 && ver >= 554) || (mod === 6 && ver >= 654) || (mod >= 7);
    statusWrap.classList.toggle('d-none', !fwSupportsStat);
    if (fwSupportsStat) _vcDispRenderStatus(d);
  }
}

function _vcDispApplyPgmCard(showPgm, currentAcao) {
  var zonaWrap = document.getElementById('vcDispZonaWrap');
  var pgmWrap  = document.getElementById('vcDispPgmWrap');
  if (zonaWrap) zonaWrap.classList.toggle('d-none', !!showPgm);
  if (pgmWrap)  pgmWrap.classList.toggle('d-none', !showPgm);
  // Preenche o radio com o valor lido do BD (Acao:N). Default = 1 (Ligar)
  // pra criar registros novos (CtrlMain.java enum Action: ON=1).
  if (showPgm) {
    var v = parseInt(currentAcao, 10);
    if (!v || v < 1 || v > 4) v = 1;
    document.querySelectorAll('input[name="vcDispPgmAcao"]').forEach(function (r) {
      r.checked = (parseInt(r.value, 10) === v);
    });
  }
}

/* ═════════════════════════════════════════════════════════════
   PGM — Helpers CMD 13 / CMD 15 / CMD 3 / CMD 9-12
   ═════════════════════════════════════════════════════════════
   Os comandos CMD 13 (read par) e CMD 15 (write par) enviam um ack
   normal `[R<seq> CMD 13 ...]`, e a central depois emite `[N14 ...]`
   ou `[N16 ...]` ASSÍNCRONO com o payload do parâmetro. Encoding:
     - Request: par e val em DECIMAL
     - Response (body): "<idx> <errLE> <parIdLE> <parValLE>" tokens hex
       little-endian 2-byte cada (errLE só 1 byte). Espelha
       CtrlCfgAdvanced.kt:322-324.

   `_vcWaitAsyncSeq(seqs, timeout)` registra listener em `onAsyncEvent`,
   resolve com o primeiro evento cujo `ev.seq` casar.
   ═════════════════════════════════════════════════════════════ */

function _vcWaitAsyncSeq(seqs, timeoutMs) {
  return new Promise(function (resolve, reject) {
    var unsub = null;
    var timer = null;
    function cleanup() {
      if (unsub) { try { unsub(); } catch (_) {} unsub = null; }
      if (timer) { clearTimeout(timer); timer = null; }
    }
    unsub = window.vettiAPI.network.onAsyncEvent(function (ev) {
      if (seqs.indexOf(ev.seq) >= 0) { cleanup(); resolve(ev); }
    });
    timer = setTimeout(function () {
      cleanup();
      reject(new Error('async timeout'));
    }, timeoutMs || 5000);
  });
}

/* Parser do body [N14 ...]/[N16 ...]. Espera "<idx> <errLE> <parIdLE> <parValLE>"
   ou variantes com pouco/sem espaço. Retorna { ok, errorCode, parId, parVal }. */
function _vcParseNCfgPar(body) {
  var s = String(body || '').trim();
  var tokens = s.split(/\s+/);
  // Forma 1 (tokens separados): "idx err parIdLE parValLE"
  if (tokens.length >= 4 &&
      /^[0-9A-Fa-f]{2}$/.test(tokens[1]) &&
      /^[0-9A-Fa-f]{4}$/.test(tokens[2]) &&
      /^[0-9A-Fa-f]{4}$/.test(tokens[3])) {
    var errorCode = tokens[1].toUpperCase();
    var parId  = parseInt(tokens[2].substr(2, 2) + tokens[2].substr(0, 2), 16);
    var parVal = parseInt(tokens[3].substr(2, 2) + tokens[3].substr(0, 2), 16);
    return { ok: errorCode === '00', errorCode: errorCode, parId: parId, parVal: parVal };
  }
  // Forma 2 (hex contíguo): "idx errparIdparVal" (10 chars hex)
  var m = /^(\d+)\s+([0-9A-Fa-f]{10})$/.exec(s);
  if (m) {
    var hex = m[2];
    var ec   = hex.substr(0, 2).toUpperCase();
    var pid  = parseInt(hex.substr(4, 2) + hex.substr(2, 2), 16);
    var pval = parseInt(hex.substr(8, 2) + hex.substr(6, 2), 16);
    return { ok: ec === '00', errorCode: ec, parId: pid, parVal: pval };
  }
  throw new Error('formato N14/N16 inesperado: ' + body);
}

async function _vcReadDevPar(devIdx, parDec, timeoutMs) {
  var net = window.vettiAPI.network;
  var waiter = _vcWaitAsyncSeq([14], timeoutMs || 5000);
  await net.sendCommand('CMD 13 ' + devIdx + ' ' + parDec);
  var ev = await waiter;
  return _vcParseNCfgPar(ev.body);
}

async function _vcWriteDevPar(devIdx, parDec, valDec, timeoutMs) {
  var net = window.vettiAPI.network;
  var waiter = _vcWaitAsyncSeq([16], timeoutMs || 5000);
  await net.sendCommand('CMD 15 ' + devIdx + ' ' + parDec + ' ' + valDec);
  var ev = await waiter;
  return _vcParseNCfgPar(ev.body);
}

/* PARs avançados conhecidos (CtrlCfgAdvanced.kt + AppCfg.java).
   Valores em DECIMAL (como o protocolo espera). */
var _VC_PGM_PAR_REPEATER = 33;   // 0x21 — Repetidor RF (0/1)
var _VC_PGM_PAR_SIRENE   = 35;   // 0x23 — Ações especiais sirene-sem-fio (bitmask)
var _VC_PGM_PAR_PULSO    = 23;   // 0x17 — Tempo de pulso (1..64800; >=60000 = ms)

/* Bitmask das ações especiais sirene-sem-fio (par 0x23).
   Espelha APP_SIRENE_SEM_FIO_MASK_* em CtrlCfgAdvanced.kt:22-30. */
var _VC_PGM_SIRENE_MASK = {
  armarPulso:        0x0001,
  desarmarPulso:     0x0002,
  dispararLigar:     0x0004,
  dispararDesligar:  0x0008,
  dispararLastState: 0x0010,
  armarLigar:        0x0020,    // v6.05+
  armarDesligar:     0x0040,    // v6.05+
  desarmarLigar:     0x0080,    // v6.05+
  desarmarDesligar:  0x0100     // v6.05+
};

/* ─── Modal "Configurações avançadas" (Tier 2) ─────────────────────── */
async function _vcDispOpenCfgAvancada() {
  if (_vcDispSelected == null) return;
  var d = _vcDispCache[_vcDispSelected];
  if (!d) return;
  var info = _vcDevTypeInfo(d.tipo);
  if (!info) return;
  var isPlgInt = info.key === 'smartplug' || info.key === 'interruptor';
  var mod = _vcCentralMod || 0;
  var ver = _vcCentralVer || 0;
  // Ações especiais sirene-sem-fio: só Plg/Int em v6.04+ (CtrlMain:1438).
  var showSirene = isPlgInt && ((mod === 6 && ver >= 604) || (mod >= 7));
  // Bits Arme/Desarme adicionais existem em v6.05+ (CtrlCfgAdvanced.kt:27-30)
  var showSireneExt = isPlgInt && ((mod === 6 && ver >= 605) || (mod >= 7));
  // Tempo de pulso: só Plg/Int
  var showPulso = isPlgInt;

  var host = document.getElementById('vcDispCfgModal');
  if (!host) {
    host = document.createElement('div');
    host.id = 'vcDispCfgModal';
    document.body.appendChild(host);
  }
  host.innerHTML =
    '<div class="vc-fer-modal-backdrop" id="vcDispCfgBackdrop">' +
      '<div class="vc-fer-modal" role="dialog" aria-modal="true" style="max-width:560px;">' +
        '<div class="vc-fer-modal-header">' +
          '<span data-i18n="dispositivos.cfg_avancada_titulo">Configurações avançadas — ' + _vcEscape(d.nome || '') + '</span>' +
          '<button class="vc-btn sm outline" type="button" id="vcDispCfgClose"><i class="bi bi-x-lg"></i></button>' +
        '</div>' +
        '<div class="vc-fer-modal-body" style="padding:14px 18px;">' +
          '<p class="text-muted small" id="vcDispCfgStatus" data-i18n="dispositivos.cfg_lendo">Lendo configurações…</p>' +
          // Repetidor RF (todos)
          '<div class="vc-card vc-card-inner mt-2">' +
            '<div class="vc-card-header" data-i18n="dispositivos.cfg_repetidor">Repetidor de RF</div>' +
            '<div class="vc-card-body py-2">' +
              '<label class="form-check"><input type="checkbox" id="vcDispCfgRepetidor" class="form-check-input"><span data-i18n="dispositivos.cfg_repetidor_ativo">Ativar função repetidor</span></label>' +
            '</div>' +
          '</div>' +
          (showSirene ? (
            '<div class="vc-card vc-card-inner mt-2">' +
              '<div class="vc-card-header" data-i18n="dispositivos.cfg_sirene">Ações especiais (sirene sem fio)</div>' +
              '<div class="vc-card-body py-2"><div class="row g-1 small">' +
                '<div class="col-12 fw-bold mt-1" data-i18n="dispositivos.cfg_sirene_arme">No arme:</div>' +
                '<div class="col-6"><label class="form-check"><input type="checkbox" id="vcDispCfgArmarPulso" class="form-check-input"><span data-i18n="dispositivos.cfg_pulso">Pulso</span></label></div>' +
                (showSireneExt ? (
                  '<div class="col-6"><label class="form-check"><input type="checkbox" id="vcDispCfgArmarLigar"   class="form-check-input"><span data-i18n="dispositivos.cfg_ligar">Ligar</span></label></div>' +
                  '<div class="col-6"><label class="form-check"><input type="checkbox" id="vcDispCfgArmarDesligar" class="form-check-input"><span data-i18n="dispositivos.cfg_desligar">Desligar</span></label></div>'
                ) : '') +
                '<div class="col-12 fw-bold mt-2" data-i18n="dispositivos.cfg_sirene_desarme">No desarme:</div>' +
                '<div class="col-6"><label class="form-check"><input type="checkbox" id="vcDispCfgDesarmarPulso" class="form-check-input"><span data-i18n="dispositivos.cfg_pulso">Pulso</span></label></div>' +
                (showSireneExt ? (
                  '<div class="col-6"><label class="form-check"><input type="checkbox" id="vcDispCfgDesarmarLigar"   class="form-check-input"><span data-i18n="dispositivos.cfg_ligar">Ligar</span></label></div>' +
                  '<div class="col-6"><label class="form-check"><input type="checkbox" id="vcDispCfgDesarmarDesligar" class="form-check-input"><span data-i18n="dispositivos.cfg_desligar">Desligar</span></label></div>'
                ) : '') +
                '<div class="col-12 fw-bold mt-2" data-i18n="dispositivos.cfg_sirene_disparo">No disparo:</div>' +
                '<div class="col-6"><label class="form-check"><input type="checkbox" id="vcDispCfgDispararLigar"    class="form-check-input"><span data-i18n="dispositivos.cfg_ligar">Ligar</span></label></div>' +
                '<div class="col-6"><label class="form-check"><input type="checkbox" id="vcDispCfgDispararDesligar" class="form-check-input"><span data-i18n="dispositivos.cfg_desligar">Desligar</span></label></div>' +
                '<div class="col-12"><label class="form-check"><input type="checkbox" id="vcDispCfgDispararLastState" class="form-check-input"><span data-i18n="dispositivos.cfg_last_state">Restaurar último estado</span></label></div>' +
              '</div></div>' +
            '</div>'
          ) : '') +
          (showPulso ? (
            '<div class="vc-card vc-card-inner mt-2">' +
              '<div class="vc-card-header" data-i18n="dispositivos.cfg_pulso_tempo">Tempo de pulso</div>' +
              '<div class="vc-card-body py-2">' +
                '<div class="row g-2 align-items-center">' +
                  '<div class="col-5"><input class="vc-input" type="number" id="vcDispCfgPulsoValor" min="1" max="64800" value="1"></div>' +
                  '<div class="col-7">' +
                    '<label class="form-check"><input type="radio" name="vcDispCfgPulsoUnit" id="vcDispCfgPulsoSeg" value="s" checked class="form-check-input"><span data-i18n="dispositivos.cfg_segundos">Segundos</span></label>' +
                    '<label class="form-check"><input type="radio" name="vcDispCfgPulsoUnit" id="vcDispCfgPulsoMs"  value="ms" class="form-check-input"><span data-i18n="dispositivos.cfg_ms">Milissegundos</span></label>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>'
          ) : '') +
        '</div>' +
        '<div class="vc-fer-modal-footer">' +
          '<button class="vc-btn outline" type="button" id="vcDispCfgCancel" data-i18n="common.cancel">Cancelar</button>' +
          '<button class="vc-btn"         type="button" id="vcDispCfgSave" data-i18n="common.save" disabled>Gravar</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  if (typeof VCi18n !== 'undefined' && VCi18n.apply) VCi18n.apply();
  document.getElementById('vcDispCfgClose').onclick  = _vcDispCloseCfgAvancada;
  document.getElementById('vcDispCfgCancel').onclick = _vcDispCloseCfgAvancada;
  document.getElementById('vcDispCfgBackdrop').addEventListener('click', function (e) {
    if (e.target.id === 'vcDispCfgBackdrop') _vcDispCloseCfgAvancada();
  });
  document.getElementById('vcDispCfgSave').onclick = function () {
    _vcDispCfgAvancadaSave(d, { showSirene: showSirene, showSireneExt: showSireneExt, showPulso: showPulso });
  };

  // Lê os PARs em sequência. Cada CMD 13 dispara um [N14] async; o helper
  // _vcReadDevPar correlaciona via seq=14.
  try {
    var rep = await _vcReadDevPar(d.idx, _VC_PGM_PAR_REPEATER);
    if (rep && rep.ok) document.getElementById('vcDispCfgRepetidor').checked = (rep.parVal !== 0);

    if (showSirene) {
      var sir = await _vcReadDevPar(d.idx, _VC_PGM_PAR_SIRENE);
      if (sir && sir.ok) _vcDispCfgApplySireneMask(sir.parVal, showSireneExt);
    }
    if (showPulso) {
      var pul = await _vcReadDevPar(d.idx, _VC_PGM_PAR_PULSO);
      if (pul && pul.ok) {
        var v = pul.parVal;
        var isMs = v >= 60000;
        if (isMs) v -= 60000;
        var inp = document.getElementById('vcDispCfgPulsoValor');
        if (inp) inp.value = v;
        document.getElementById('vcDispCfgPulsoSeg').checked = !isMs;
        document.getElementById('vcDispCfgPulsoMs').checked  = isMs;
      }
    }
    document.getElementById('vcDispCfgStatus').textContent =
      VCi18n.t('dispositivos.cfg_pronto') || 'Pronto.';
    document.getElementById('vcDispCfgSave').disabled = false;
  } catch (err) {
    document.getElementById('vcDispCfgStatus').textContent =
      (VCi18n.t('dispositivos.cfg_erro_ler') || 'Falha ao ler configurações: ') + (err && err.message || '');
  }
}

function _vcDispCloseCfgAvancada() {
  var host = document.getElementById('vcDispCfgModal');
  if (host) host.innerHTML = '';
}

function _vcDispCfgApplySireneMask(val, ext) {
  function set(id, mask) {
    var el = document.getElementById(id);
    if (el) el.checked = (val & mask) !== 0;
  }
  set('vcDispCfgArmarPulso',         _VC_PGM_SIRENE_MASK.armarPulso);
  set('vcDispCfgDesarmarPulso',      _VC_PGM_SIRENE_MASK.desarmarPulso);
  set('vcDispCfgDispararLigar',      _VC_PGM_SIRENE_MASK.dispararLigar);
  set('vcDispCfgDispararDesligar',   _VC_PGM_SIRENE_MASK.dispararDesligar);
  set('vcDispCfgDispararLastState',  _VC_PGM_SIRENE_MASK.dispararLastState);
  if (ext) {
    set('vcDispCfgArmarLigar',       _VC_PGM_SIRENE_MASK.armarLigar);
    set('vcDispCfgArmarDesligar',    _VC_PGM_SIRENE_MASK.armarDesligar);
    set('vcDispCfgDesarmarLigar',    _VC_PGM_SIRENE_MASK.desarmarLigar);
    set('vcDispCfgDesarmarDesligar', _VC_PGM_SIRENE_MASK.desarmarDesligar);
  }
}

async function _vcDispCfgAvancadaSave(d, opts) {
  var status = document.getElementById('vcDispCfgStatus');
  status.textContent = VCi18n.t('dispositivos.cfg_gravando') || 'Gravando…';
  var okN = 0, errN = 0;
  try {
    var rep = document.getElementById('vcDispCfgRepetidor').checked ? 1 : 0;
    var r1 = await _vcWriteDevPar(d.idx, _VC_PGM_PAR_REPEATER, rep);
    if (r1 && r1.ok) okN++; else errN++;

    if (opts.showSirene) {
      var bits = 0;
      function ck(id, mask) { if (document.getElementById(id) && document.getElementById(id).checked) bits |= mask; }
      ck('vcDispCfgArmarPulso',         _VC_PGM_SIRENE_MASK.armarPulso);
      ck('vcDispCfgDesarmarPulso',      _VC_PGM_SIRENE_MASK.desarmarPulso);
      ck('vcDispCfgDispararLigar',      _VC_PGM_SIRENE_MASK.dispararLigar);
      ck('vcDispCfgDispararDesligar',   _VC_PGM_SIRENE_MASK.dispararDesligar);
      ck('vcDispCfgDispararLastState',  _VC_PGM_SIRENE_MASK.dispararLastState);
      if (opts.showSireneExt) {
        ck('vcDispCfgArmarLigar',       _VC_PGM_SIRENE_MASK.armarLigar);
        ck('vcDispCfgArmarDesligar',    _VC_PGM_SIRENE_MASK.armarDesligar);
        ck('vcDispCfgDesarmarLigar',    _VC_PGM_SIRENE_MASK.desarmarLigar);
        ck('vcDispCfgDesarmarDesligar', _VC_PGM_SIRENE_MASK.desarmarDesligar);
      }
      var r2 = await _vcWriteDevPar(d.idx, _VC_PGM_PAR_SIRENE, bits);
      if (r2 && r2.ok) okN++; else errN++;
    }

    if (opts.showPulso) {
      var v = parseInt(document.getElementById('vcDispCfgPulsoValor').value, 10) || 1;
      if (v < 1 || v > 64800) {
        vcToast(VCi18n.t('dispositivos.cfg_pulso_invalido') ||
                'Tempo de pulso deve estar entre 1 e 64800.', 'warn');
        status.textContent = '';
        return;
      }
      if (document.getElementById('vcDispCfgPulsoMs').checked) v += 60000;
      var r3 = await _vcWriteDevPar(d.idx, _VC_PGM_PAR_PULSO, v);
      if (r3 && r3.ok) okN++; else errN++;
    }
  } catch (err) {
    errN++;
    status.textContent = (err && err.message) || 'Erro';
  }
  vcToast(VCi18n.t('dispositivos.cfg_resultado', { ok: okN, err: errN })
          || ('Gravado: ' + okN + ' OK, ' + errN + ' falhas.'),
          errN > 0 ? 'warn' : 'success', 3000);
  _vcDispCloseCfgAvancada();
}

/* ─── Comando direto (Tier 3b) — CMD 3 ─────────────────────────────── */
async function _vcDispCmdDireto(cmdVal) {
  if (_vcDispSelected == null) return;
  var net = window.vettiAPI.network;
  if (!net) return;
  try {
    var r = await net.sendCommand('CMD 3 ' + _vcDispSelected + ' ' + cmdVal);
    if (r && r.ok) {
      vcToast(VCi18n.t('dispositivos.cmd_enviado') || 'Comando enviado.', 'success', 1500);
    } else {
      vcToast(VCi18n.t('dispositivos.cmd_falha') || 'Falha ao enviar comando.', 'warn');
    }
  } catch (err) {
    vcToast((err && err.message) || 'Erro', 'warn');
  }
}

/* ─── Módulo IR (Tier 3a) — CMD 9/10/11/12 ─────────────────────────── */
var _VC_IR_LAST_CMD = '';   // Texto exibido em vcDispIrLastCmd

function _vcDispIrBuildGrid() {
  var grid = document.getElementById('vcDispIrGrid');
  if (!grid || grid.dataset.built === '1') return;
  grid.dataset.built = '1';
  var html = '';
  for (var i = 1; i <= 20; i++) {
    html += '<button class="vc-btn sm outline" type="button" data-slot="' + i + '">' +
            String(i).padStart(2, '0') + '</button>';
  }
  grid.innerHTML = html;
  grid.addEventListener('click', async function (e) {
    var btn = e.target.closest('button[data-slot]');
    if (!btn || _vcDispSelected == null) return;
    var slot = parseInt(btn.dataset.slot, 10);
    var mode = (document.querySelector('input[name="vcDispIrMode"]:checked') || {}).value || 'transmit';
    var cmdMap = { transmit: 9, capture: 10, erase: 11 };
    var cmd = cmdMap[mode];
    var net = window.vettiAPI.network;
    try {
      var r = await net.sendCommand('CMD ' + cmd + ' ' + _vcDispSelected + ' ' + slot);
      var label = document.getElementById('vcDispIrLastCmd');
      if (r && r.ok) {
        _VC_IR_LAST_CMD = (VCi18n.t('dispositivos.ir_last_ok', { mode: mode, slot: slot })
                           || (mode + ' slot ' + slot + ': OK'));
        if (label) label.textContent = _VC_IR_LAST_CMD;
        vcToast(_VC_IR_LAST_CMD, 'success', 1500);
      } else {
        if (label) label.textContent = (mode + ' slot ' + slot + ': falha');
        vcToast(VCi18n.t('dispositivos.cmd_falha') || 'Falha.', 'warn');
      }
    } catch (err) {
      vcToast((err && err.message) || 'Erro', 'warn');
    }
  });
}

async function _vcDispIrRefresh() {
  if (_vcDispSelected == null) return;
  var net = window.vettiAPI.network;
  try { await net.sendCommand('CMD 12 ' + _vcDispSelected); }
  catch (_) {}
  vcToast(VCi18n.t('dispositivos.ir_refreshed') || 'Lista de comandos IR atualizada.', 'info', 1500);
}

/* ─── Combos globais (Tier 3c) — PAR B1010000/B1020000 ─────────────── */
async function _vcDispGlobaisLoad() {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return;
  // Popula os 2 selects com os PGMs do cache (Plg/Int — únicos que fazem
  // sentido pra acionar via PAR B1010000/B1020000).
  var selSir = document.getElementById('vcDispGlobalSirene');
  var selArm = document.getElementById('vcDispGlobalArme');
  if (!selSir || !selArm) return;
  var opts = '<option value="0" data-i18n="dispositivos.global_nenhum">Nenhum</option>';
  Object.keys(_vcDispCache).forEach(function (idx) {
    var d = _vcDispCache[idx];
    var info = _vcDevTypeInfo(d.tipo);
    if (!info) return;
    if (info.key !== 'smartplug' && info.key !== 'interruptor') return;
    if (d.stat === 'INV' || d.stat === 'DEL' || d.stat === 'LIV') return;
    opts += '<option value="' + idx + '">' + String(idx).padStart(3, '0') + ' · ' + _vcEscape(d.nome || '---') + '</option>';
  });
  selSir.innerHTML = opts;
  selArm.innerHTML = opts;
  // Lê os PARs atuais
  try {
    var p1 = await _vcReadParam('B1010000');
    if (p1 != null) selSir.value = String(parseInt(p1, 10) || 0);
  } catch (_) {}
  try {
    var p2 = await _vcReadParam('B1020000');
    if (p2 != null) selArm.value = String(parseInt(p2, 10) || 0);
  } catch (_) {}
}

async function _vcDispGlobaisSave() {
  var selSir = document.getElementById('vcDispGlobalSirene');
  var selArm = document.getElementById('vcDispGlobalArme');
  if (!selSir || !selArm) return;
  var ok = 0, err = 0;
  var r1 = await _vcWriteParam('B1010000', selSir.value, selSir);
  if (r1 && r1.ok) ok++; else err++;
  var r2 = await _vcWriteParam('B1020000', selArm.value, selArm);
  if (r2 && r2.ok) ok++; else err++;
  vcToast(VCi18n.t('dispositivos.globais_resultado', { ok: ok, err: err })
          || ('Gravado: ' + ok + ' OK, ' + err + ' falhas.'),
          err > 0 ? 'warn' : 'success', 2500);
}

function _vcDispUpdateDeactivateBtn(stat) {
  var btn = document.getElementById('vcDispBtnDeactivate');
  var label = document.getElementById('vcDispBtnDeactivateLabel');
  if (!btn || !label) return;
  var s = String(stat || '').toUpperCase();
  if (s === 'DES' || s === 'DEACTIVATED') {
    label.textContent = VCi18n.t('dispositivos.reativar');
    btn.dataset.targetState = 'OK';
  } else {
    label.textContent = VCi18n.t('dispositivos.desativar');
    btn.dataset.targetState = 'DES';
  }
}

function _vcDispBindButtons() {
  var btnSalvar     = document.getElementById('vcDispBtnSalvar');
  var btnExcluir    = document.getElementById('vcDispBtnExcluir');
  var btnGravar     = document.getElementById('vcDispBtnGravar');
  var btnDeactivate = document.getElementById('vcDispBtnDeactivate');
  if (btnSalvar     && !btnSalvar._vcBound)     { btnSalvar._vcBound     = true; btnSalvar.addEventListener('click', _vcDispSave); }
  if (btnExcluir    && !btnExcluir._vcBound)    { btnExcluir._vcBound    = true; btnExcluir.addEventListener('click', _vcDispDelete); }
  if (btnGravar     && !btnGravar._vcBound)     { btnGravar._vcBound     = true; btnGravar.addEventListener('click', _vcDispAddNew); }
  if (btnDeactivate && !btnDeactivate._vcBound) { btnDeactivate._vcBound = true; btnDeactivate.addEventListener('click', _vcDispToggleActive); }

  // Tier 2: botão "Configurações avançadas" → abre modal CMD 13/15
  var btnCfgAv = document.getElementById('vcDispBtnCfgAvancada');
  if (btnCfgAv && !btnCfgAv._vcBound) {
    btnCfgAv._vcBound = true;
    btnCfgAv.addEventListener('click', function (e) { e.preventDefault(); _vcDispOpenCfgAvancada(); });
  }
  // Tier 3b: botões Comando direto (CMD 3 com data-cmd no botão)
  ['vcDispCmdLigar','vcDispCmdDesligar','vcDispCmdInverter','vcDispCmdPulso'].forEach(function (id) {
    var b = document.getElementById(id);
    if (b && !b._vcBound) {
      b._vcBound = true;
      b.addEventListener('click', function (e) {
        e.preventDefault();
        _vcDispCmdDireto(parseInt(b.dataset.cmd, 10));
      });
    }
  });
  // Tier 3a: refresh do painel IR
  var btnIrRefr = document.getElementById('vcDispIrRefresh');
  if (btnIrRefr && !btnIrRefr._vcBound) {
    btnIrRefr._vcBound = true;
    btnIrRefr.addEventListener('click', function (e) { e.preventDefault(); _vcDispIrRefresh(); });
  }
  // Tier 3c: salvar combos globais
  var btnGlobais = document.getElementById('vcDispGlobalSalvar');
  if (btnGlobais && !btnGlobais._vcBound) {
    btnGlobais._vcBound = true;
    btnGlobais.addEventListener('click', function (e) { e.preventDefault(); _vcDispGlobaisSave(); });
  }
}

// Desativa/Reativa o dispositivo selecionado.
//   BD <idx> Stat:DES   → desativa (dispositivo não gera mais eventos)
//   BD <idx> Stat:OK    → reativa
async function _vcDispToggleActive() {
  if (_vcDispSelected == null) return;
  var btn = document.getElementById('vcDispBtnDeactivate');
  var target = btn && btn.dataset.targetState; // 'DES' ou 'OK'
  if (!target) return;
  var idx = _vcDispSelected;
  var net = window.vettiAPI.network;
  var loadKey = target === 'DES' ? 'dispositivos.desativando' : 'dispositivos.reativando';
  var okKey   = target === 'DES' ? 'dispositivos.desativado'  : 'dispositivos.reativado';
  vcToast(VCi18n.t(loadKey), 'info', 0, { id: 'disp-toggle', persist: true });
  try {
    var r = await net.sendCommand('BD ' + idx + ' Stat:' + target);
    if (r && r.ok) {
      // Atualiza cache e UI
      if (_vcDispCache[idx]) _vcDispCache[idx].stat = (target === 'DES' ? 'DES' : 'OK');
      _vcDispUpdateDeactivateBtn(target === 'DES' ? 'DES' : 'OK');
      _vcDispRefreshRow(idx);
      vcToast(VCi18n.t(okKey), 'success', 2500, { id: 'disp-toggle' });
    } else {
      vcToast(VCi18n.t('dispositivos.erro_toggle'), 'error', 4000, { id: 'disp-toggle' });
    }
  } catch (e) {
    vcToast(VCi18n.t('dispositivos.erro_toggle'), 'error', 4000, { id: 'disp-toggle' });
  }
}

async function _vcDispSave() {
  if (_vcDispSelected == null) return;
  var idx = _vcDispSelected;
  var d = _vcDispCache[idx] || {};
  var net = window.vettiAPI.network;
  // Monta os campos modificados
  var parts = [];
  var nome = (document.getElementById('vcDispEditNome').value || '').trim();
  if (nome.length > 20) {
    vcToast(VCi18n.t('dispositivos.nome_longo'), 'error');
    return;
  }
  if (nome !== (d.nome || '')) parts.push('Nome:"' + nome.replace(/"/g, '\\"') + '"');

  // Bitmask de partições — formato Java: 6 chars, cada um é o número da
  // partição (1..6) ou '-'. Ex.: "1-3-5-" (partições 1, 3 e 5).
  var pStr = '';
  document.querySelectorAll('.vc-disp-part').forEach(function (b, i) {
    pStr += b.checked ? String(i + 1) : '-';
  });
  if (pStr !== (d.p || '------').padEnd(6, '-')) parts.push('p:' + pStr);

  // Bitmask de zona — 6 chars com letras específicas (vide _vcDispSelectItem).
  // Stay usa 'P' por padrão (firmware v4+); 'Y' é legado v2-v3.
  var zStr = ['-','-','-','-','-','-'];
  document.querySelectorAll('.vc-disp-zone').forEach(function (b) {
    if (!b.checked) return;
    switch (b.value) {
      case 'h24':     zStr[0] = '2'; break;
      case 'temp':    zStr[1] = 'T'; break;
      case 'silenc':  zStr[2] = 'S'; break;
      case 'inibido': zStr[3] = 'I'; break;
      case 'stay':    zStr[4] = 'P'; break;
      case 'portao':  zStr[5] = 'O'; break;
    }
  });
  var zJoined = zStr.join('');
  var origZ = (d.z || '------').padEnd(6, '-');
  // Normaliza Y → P para comparar com firmware antigo (v2-v3 usavam Y na pos 4)
  var origNorm = origZ.split('').map(function (c, i) { return (i === 4 && c === 'Y') ? 'P' : c; }).join('');
  if (zJoined !== origNorm) parts.push('z:' + zJoined);

  // Acao:N — Ação padrão do PGM (Plg/Int). Só inclui se o card PGM
  // está visível (firmware suporta + tipo é Plg/Int) e o valor mudou.
  // CtrlMain.java:4380-4399 + AppCfg enum Action (ON=1, OFF=2, TOGGLE=3, PULSE=4).
  var pgmWrap = document.getElementById('vcDispPgmWrap');
  if (pgmWrap && !pgmWrap.classList.contains('d-none')) {
    var radio = document.querySelector('input[name="vcDispPgmAcao"]:checked');
    var acao = radio ? parseInt(radio.value, 10) : null;
    if (acao && acao !== (d.acao || null)) parts.push('Acao:' + acao);
  }

  if (parts.length === 0) {
    vcToast(VCi18n.t('sistema.card_no_changes'), 'info');
    return;
  }
  var cmd = 'BD ' + idx + ' ' + parts.join(' ');
  vcToast(VCi18n.t('dispositivos.gravando'), 'info', 0,
          { id: 'disp-save', persist: true });
  try {
    var r = await net.sendCommand(cmd);
    if (r && r.ok) {
      vcToast(VCi18n.t('dispositivos.gravado'), 'success', 2500, { id: 'disp-save' });
      // Recarrega só este registro
      var r2 = await net.sendCommand('BD ' + idx);
      if (r2 && r2.ok) {
        var nd = _parseBdx(r2.body);
        if (nd) {
          _vcDispCache[idx] = nd;
          _vcDispRefreshRow(idx);
        }
      }
    } else {
      vcToast(VCi18n.t('dispositivos.erro_gravar'), 'error', 4000, { id: 'disp-save' });
    }
  } catch (e) {
    vcToast(VCi18n.t('dispositivos.erro_gravar'), 'error', 4000, { id: 'disp-save' });
  }
}

function _vcDispRefreshRow(idx) {
  var row = document.querySelector('.vc-disp-row[data-idx="' + idx + '"]');
  var d = _vcDispCache[idx];
  if (!row || !d) return;
  row.innerHTML =
    '<div>' + String(d.idx).padStart(3, '0') + '</div>' +
    '<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _vcEscape(d.nome || '---') + '</div>' +
    '<div title="' + _vcEscape(d.tipo || '') + '">' + _vcEscape(_vcDevTypeLabel(d.tipo, d.idx)) + '</div>' +
    '<div>' + (d.versao ? 'V ' + _vcEscape(d.versao) : '---') + '</div>' +
    '<div>' + _vcEscape(d.p || '---') + '</div>';
}

async function _vcDispDelete() {
  if (_vcDispSelected == null) return;
  if (!confirm(VCi18n.t('dispositivos.confirmar_excluir'))) return;
  var idx = _vcDispSelected;
  var net = window.vettiAPI.network;
  vcToast(VCi18n.t('dispositivos.excluindo'), 'info', 0,
          { id: 'disp-del', persist: true });
  try {
    var r = await net.sendCommand('BD ' + idx + ' Stat:DEL');
    if (r && r.ok) {
      vcToast(VCi18n.t('dispositivos.excluido'), 'success', 2500, { id: 'disp-del' });
      // Remove a row do DOM e do cache
      var row = document.querySelector('.vc-disp-row[data-idx="' + idx + '"]');
      if (row) row.remove();
      delete _vcDispCache[idx];
      _vcDispSelected = null;
      document.getElementById('vcDispEditEmpty').classList.remove('d-none');
      document.getElementById('vcDispEditForm').classList.add('d-none');
    } else {
      vcToast(VCi18n.t('dispositivos.erro_excluir'), 'error', 4000, { id: 'disp-del' });
    }
  } catch (e) {
    vcToast(VCi18n.t('dispositivos.erro_excluir'), 'error', 4000, { id: 'disp-del' });
  }
}

async function _vcDispAddNew() {
  var net = window.vettiAPI.network;
  vcToast(VCi18n.t('dispositivos.aguardando_rf'), 'info', 0,
          { id: 'disp-add', persist: true });
  try {
    var r = await net.sendCommand('CMD 8');
    if (r && r.ok) {
      var m = /CMD\s*8\s+(\d+)/i.exec(r.body || '');
      var seg = m ? parseInt(m[1], 10) : 0;
      vcToast(VCi18n.t('dispositivos.cadastro_iniciado', { s: seg || '?' }), 'info', 0,
              { id: 'disp-add', persist: true });
      if (seg > 0) _vcStartDispPolling(seg);
    } else {
      vcToast(VCi18n.t('dispositivos.erro_cadastro'), 'error', 4000, { id: 'disp-add' });
    }
  } catch (e) {
    vcToast(VCi18n.t('dispositivos.erro_cadastro'), 'error', 4000, { id: 'disp-add' });
  }
}

// Polling de BDS enquanto o modo cadastro estiver ativo. Quando o total
// de registros aumentar, recarrega a lista — assim o usuário vê o novo
// dispositivo aparecer automaticamente após apertar o pareamento.
var _vcDispPollTimer = null;
var _vcDispPollAbort = false;

function _vcStartDispPolling(timeoutSeconds) {
  _vcStopDispPolling();
  _vcDispPollAbort = false;
  var startTot = Object.keys(_vcDispCache).length;
  var pollMs   = 4000;     // polling a cada 4s
  var slackMs  = 5000;     // margem extra após o timer da central
  var deadline = Date.now() + (timeoutSeconds * 1000) + slackMs;

  async function tick() {
    if (_vcDispPollAbort) return;
    if (Date.now() > deadline) {
      _vcStopDispPolling();
      // Timeout: fecha o toast de "aguardando".
      vcToast(VCi18n.t('dispositivos.cadastro_timeout'), 'warn', 3000, { id: 'disp-add' });
      return;
    }
    var net = window.vettiAPI && window.vettiAPI.network;
    if (!net) { _vcStopDispPolling(); return; }
    try {
      var r = await net.sendCommand('BDS');
      if (r && r.ok) {
        var b = _parseBds(r.body);
        if (b && b.tot > startTot) {
          _vcStopDispPolling();
          vcToast(VCi18n.t('dispositivos.novo_cadastrado'), 'success', 3000, { id: 'disp-add' });
          // Recarrega a lista (sem mostrar o toast genérico de aba)
          _vcDispLoad();
          return;
        }
      }
    } catch (_) {}
    _vcDispPollTimer = setTimeout(tick, pollMs);
  }
  _vcDispPollTimer = setTimeout(tick, pollMs);
}

function _vcStopDispPolling() {
  _vcDispPollAbort = true;
  if (_vcDispPollTimer) { clearTimeout(_vcDispPollTimer); _vcDispPollTimer = null; }
}

/* ═════════════════════════════════════════════════════════════
   SISTEMA → USUÁRIO (aba)
   Comandos (validados na versão Java em produção):
     PAR 610C0000                → string 99 chars: status de cada slot
                                   ('O' = ocupado; outros = livre)
     USER Idx=N                  → lê dados de um usuário
     USER Idx=N Stat=OK Flags=...Nome="..." Senha=... Armar=... Desarmar=...
          Pgm=... Panico=...     → grava (criar ou editar)
     USER Idx=N Stat=DEL         → exclui
   Capacidade do BD: 99 usuários.
   ═════════════════════════════════════════════════════════════ */
var _vcUserCache = {};   // idx → registro parseado
var _vcUserSlots = '';   // string 99 chars do PAR 610C0000
var _vcUserSelected = null;

/* "Controle associado" — vínculo entre usuário e dispositivo remoto
   (CR4/CR8). Esta associação NÃO existe no protocolo USER (confirmado
   contra Kotlin v3 + PDF Rev 2 §8 + UserEdit.fxml em 2026-05-19). Ela
   é mantida só localmente no userData do Electron, indexada pelo MAC
   da central conectada. A central não sabe deste vínculo. */
var _vcUserCtrlAssoc = {};        // { "<userIdx>": "<bdIdx>", ... }
var _vcUserCtrlAssocLoaded = false;  // false até a primeira leitura do storage

function _vcUserCtrlAssocStorageKey() {
  var mac = ((document.getElementById('vcCentralMac') || {}).textContent || '')
              .replace(/^MAC:\s*/i, '').trim().toUpperCase();
  if (!mac) return null;
  return 'users.ctrlAssoc.' + mac;
}

async function _vcUserCtrlAssocLoad() {
  _vcUserCtrlAssoc = {};
  var key = _vcUserCtrlAssocStorageKey();
  if (!key || !window.vettiAPI || !window.vettiAPI.storage) {
    _vcUserCtrlAssocLoaded = true;
    return;
  }
  try {
    var v = await window.vettiAPI.storage.get(key);
    if (v && typeof v === 'object') _vcUserCtrlAssoc = v;
  } catch (_) {}
  _vcUserCtrlAssocLoaded = true;
}

async function _vcUserCtrlAssocPersist() {
  var key = _vcUserCtrlAssocStorageKey();
  if (!key || !window.vettiAPI || !window.vettiAPI.storage) return;
  try { await window.vettiAPI.storage.set(key, _vcUserCtrlAssoc); } catch (_) {}
}

// Identifica dispositivo como controle remoto (RC) — CR4/CR8 são os
// únicos tipos válidos pra associar a usuário. Verificação case-insensitive
// pra cobrir variações do firmware ("CR4" / "cr4" / "Cr4").
function _vcIsRemoteCtrl(tipo) {
  if (!tipo) return false;
  var t = String(tipo).toUpperCase();
  return t === 'CR4' || t === 'CR8';
}

// Constrói lista de TODOS os controles CR4/CR8 do banco de dispositivos,
// marcando os já vinculados a outros usuários (pra aparecer disabled
// na UI). Para o usuário em edição, seu próprio controle não vem
// marcado como "em uso por outro" — pode permanecer selecionado.
function _vcUserBuildCtrlOptions(forUserIdx) {
  forUserIdx = String(forUserIdx || '');
  var usedByOther = {};   // bdIdx → { userIdx, userNome }
  Object.keys(_vcUserCtrlAssoc).forEach(function (uIdx) {
    if (uIdx === forUserIdx) return;
    var c = _vcUserCtrlAssoc[uIdx];
    if (!c) return;
    var u = _vcUserCache[uIdx];
    usedByOther[c] = { userIdx: uIdx, userNome: (u && u.nome) || ('#' + uIdx) };
  });
  var out = [];
  Object.keys(_vcDispCache).forEach(function (bdIdx) {
    var d = _vcDispCache[bdIdx];
    if (!_vcIsRemoteCtrl(d.tipo)) return;
    if (d.stat === 'INV' || d.stat === 'DEL' || d.stat === 'LIV') return;
    var inUseBy = usedByOther[String(bdIdx)] || null;
    var baseLabel = String(bdIdx).padStart(3, '0') + ' · ' + d.tipo + ' · ' +
                    (d.nome || ('Dispositivo ' + bdIdx));
    out.push({
      idx: String(bdIdx),
      tipo: d.tipo,
      nome: d.nome || ('Dispositivo ' + bdIdx),
      label: inUseBy
        ? (baseLabel + ' — ' + (VCi18n.t('usuario.em_uso_por', { nome: inUseBy.userNome })
                                || 'em uso por: ' + inUseBy.userNome))
        : baseLabel,
      disabled: !!inUseBy
    });
  });
  out.sort(function (a, b) { return parseInt(a.idx, 10) - parseInt(b.idx, 10); });
  return out;
}

// Popula o <select> de controle associado pro usuário em edição.
function _vcUserRenderCtrlCombo(forUserIdx) {
  var sel = document.getElementById('vcUserCtrlAssoc');
  if (!sel) return;
  var current = _vcUserCtrlAssoc[String(forUserIdx)] || '';
  var opts = _vcUserBuildCtrlOptions(forUserIdx);
  var html = '<option value="" data-i18n="usuario.sem_controle">' +
             (VCi18n.t('usuario.sem_controle') || '(sem controle)') + '</option>';
  opts.forEach(function (o) {
    var isSel = (o.idx === current);
    html += '<option value="' + _vcEscape(o.idx) + '"' +
            (isSel ? ' selected' : '') +
            (o.disabled ? ' disabled' : '') +
            '>' + _vcEscape(o.label) + '</option>';
  });
  // Caso o controle vinculado tenha sido apagado/desinstalado, ainda
  // permite exibir e remover.
  if (current && !opts.some(function (o) { return o.idx === current; })) {
    html += '<option value="' + _vcEscape(current) + '" selected>' +
            _vcEscape((VCi18n.t('usuario.ctrl_orfao', { idx: current })
                       || 'Controle ' + current + ' (não encontrado)')) + '</option>';
  }
  sel.innerHTML = html;
}

async function _vcUserLoad() {
  var panel = document.getElementById('vcSysUsuario');
  if (!panel) return;
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return;
  panel.dataset.loaded = '1';

  // Gate de compatibilidade (CtrlMain.java:2763 + CtrlUser.kt:607-612):
  //   mod==5&&ver>=550  ou  mod==6&&ver>=650  ou  mod>=7
  // Centrais antigas retornam ERR 8 em USER/PAR 610C0000 — esconde a aba
  // pra evitar ruído. _vcCentralMod/Ver foram preenchidos no boot via INFO.
  var mod = _vcCentralMod || 0;
  var ver = _vcCentralVer || 0;
  var hasUser = (mod === 5 && ver >= 550) || (mod === 6 && ver >= 650) || (mod >= 7);
  _vcUserApplyCompat(hasUser);
  if (!hasUser) {
    vcToast(VCi18n.t('usuario.fw_nao_suporta') ||
            'Firmware da central não suporta cadastro de usuários (precisa >= 5.50 / 6.50).',
            'warn', 4000, { id: 'load-panel-vcSysUsuario' });
    return;
  }

  vcToast(VCi18n.t('common.loading_tab', { tab: 'Usuário' }), 'info', 0,
          { id: 'load-panel-vcSysUsuario', persist: true });

  // Combo "Controle associado" precisa do banco de dispositivos pra
  // listar CR4/CR8. Carrega se ainda não tem (Dispositivos lazy-load
  // pode não ter rodado).
  if (Object.keys(_vcDispCache || {}).length === 0) {
    try { await _vcDispLoad(); } catch (_) {}
  }
  // Carrega o mapa local de associações usuário→controle (por MAC).
  if (!_vcUserCtrlAssocLoaded) await _vcUserCtrlAssocLoad();

  _vcUserCache = {};
  _vcUserSlots = '';
  var list = document.getElementById('vcUserList');
  if (list) list.innerHTML = '';

  // 1. Lê PAR 610C0000 (bitmap de 99 slots)
  try {
    var rs = await net.sendCommand('PAR 610C0000');
    if (rs && rs.ok) {
      var p = _parseParResponse(rs.body);
      if (p && p.value) _vcUserSlots = p.value;
    }
  } catch (_) {}

  // 2. Para cada slot 'O', lê USER Idx=N
  var slots = _vcUserSlots || '';
  for (var i = 0; i < slots.length; i++) {
    if (slots.charAt(i) !== 'O') continue;
    var idx = i + 1;
    try {
      var r = await net.sendCommand('USER Idx=' + idx);
      if (r && r.ok) {
        var u = _parseUser(r.body);
        if (u && u.idx) {
          _vcUserCache[u.idx] = u;
          _vcUserAppendRow(u);
        }
      }
    } catch (_) {}
  }

  _vcUserBindListClicks();
  _vcUserBindButtons();
  vcToast(VCi18n.t('common.loaded_tab', { tab: 'Usuário' }), 'success', 2500,
          { id: 'load-panel-vcSysUsuario' });
}

// Re-lê o bitmap PAR 610C0000 (slots ocupados) e atualiza _vcUserSlots.
// Chamado após save/delete pra que "Novo usuário" enxergue o estado real
// da central — sem isso, escolheríamos um slot que parece livre mas a
// central já marcou como ocupado.
async function _vcUserRefreshSlotBitmap() {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return;
  try {
    var rs = await net.sendCommand('PAR 610C0000');
    if (rs && rs.ok) {
      var p = _parseParResponse(rs.body);
      if (p && p.value) _vcUserSlots = p.value;
    }
  } catch (_) {}
}

// Aplica gate de compatibilidade: se firmware da central não suporta USER,
// esconde lista + botão Novo, mostra mensagem.
function _vcUserApplyCompat(hasUser) {
  var btnNew  = document.getElementById('vcUserBtnNovo');
  var listBox = document.getElementById('vcUserList');
  var form    = document.getElementById('vcUserForm');
  var empty   = document.getElementById('vcUserFormEmpty');
  if (btnNew) btnNew.disabled = !hasUser;
  if (!hasUser) {
    if (listBox) listBox.innerHTML =
      '<p class="text-muted small m-0 p-2" data-i18n="usuario.fw_nao_suporta">' +
      'Firmware da central não suporta cadastro de usuários.</p>';
    if (form) form.classList.add('d-none');
    if (empty) empty.classList.remove('d-none');
  }
}

// Parseia "USER Idx=1 Stat=OK Flags=10101011 Nome="Admin" Senha=1234
//         Armar=1-3---/DST-Q-S/00:00/23:59  Desarmar=...  Pgm=...  Panico=1-----"
function _parseUser(body) {
  var s = String(body || '').replace(/^USER\s+/i, '');
  function take(re) { var m = re.exec(s); return m ? m[1] : null; }
  // Permissões: <part>/<dow>/<hi>/<hf>  ex.: 1-3-5-/DST-Q-S/00:00/23:59
  function takePerm(name) {
    var re = new RegExp('\\b' + name + '=([^\\s]+)', 'i');
    var v = take(re);
    if (!v) return null;
    var parts = v.split('/');
    if (parts.length === 4) {
      return { part: parts[0], dow: parts[1], hi: parts[2], hf: parts[3] };
    }
    if (parts.length === 1) return { part: parts[0] };
    return null;
  }
  return {
    idx:   parseInt(take(/Idx=(\d+)/i), 10) || null,
    stat:  take(/Stat=([A-Za-z]+)/i),
    flags: take(/Flags=([0-9-]+)/i),
    nome:  take(/Nome="([^"]*)"/i),
    senha: take(/Senha=(\S+)/i),
    armar:    takePerm('Armar'),
    desarmar: takePerm('Desarmar'),
    pgm:      takePerm('Pgm'),
    panico:   takePerm('Panico')
  };
}

function _vcUserAppendRow(u) {
  var list = document.getElementById('vcUserList');
  if (!list) return;
  var row = document.createElement('div');
  row.className = 'vc-user-row';
  row.dataset.idx = u.idx;
  row.style.cssText = 'display:grid;grid-template-columns:1fr 80px 130px;padding:6px 10px;border-bottom:1px solid #E5E8EB;cursor:pointer;font-size:13px;align-items:center;';
  row.innerHTML =
    '<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _vcEscape(u.nome || '---') + '</div>' +
    '<div class="text-end">' + String(u.idx).padStart(3, '0') + '</div>' +
    '<div class="text-end vc-user-ctrl-cell">' + _vcEscape(_vcUserCtrlLabel(u.idx)) + '</div>';
  list.appendChild(row);
}

// Texto curto pra coluna "Controle" da lista. Vazio quando não há
// vínculo; "001 · CR4" se houver e o dispositivo ainda existir;
// "Nº ## (?)" se o dispositivo foi removido após o vínculo.
function _vcUserCtrlLabel(userIdx) {
  var bdIdx = _vcUserCtrlAssoc[String(userIdx)];
  if (!bdIdx) return '---';
  var d = _vcDispCache[bdIdx];
  if (!d) return String(bdIdx).padStart(3, '0') + ' · ?';
  return String(bdIdx).padStart(3, '0') + ' · ' + (d.tipo || '?');
}

// Atualiza apenas a célula "Controle" de uma linha já renderizada.
function _vcUserRefreshCtrlCell(userIdx) {
  var row = document.querySelector('.vc-user-row[data-idx="' + userIdx + '"]');
  if (!row) return;
  var cell = row.querySelector('.vc-user-ctrl-cell');
  if (cell) cell.textContent = _vcUserCtrlLabel(userIdx);
}

function _vcUserBindListClicks() {
  var list = document.getElementById('vcUserList');
  if (!list || list._vcBound) return;
  list._vcBound = true;
  list.addEventListener('click', function (e) {
    var row = e.target.closest('.vc-user-row');
    if (!row) return;
    var idx = parseInt(row.dataset.idx, 10);
    if (isNaN(idx)) return;
    list.querySelectorAll('.vc-user-row').forEach(function (r) { r.style.background = ''; });
    row.style.background = 'rgba(0,118,203,.10)';
    _vcUserSelectItem(idx);
  });
}

function _vcUserSelectItem(idx) {
  var u = _vcUserCache[idx];
  if (!u) return;
  _vcUserSelected = idx;
  document.getElementById('vcUserFormEmpty').classList.add('d-none');
  document.getElementById('vcUserForm').classList.remove('d-none');
  document.getElementById('vcUserNome').value  = u.nome  || '';
  document.getElementById('vcUserSenha').value = u.senha || '';
  document.getElementById('vcUserNumAux').value = String(idx);

  // Preenche cada um dos 4 grupos de permissões.
  ['armar', 'desarmar', 'pgm', 'panico'].forEach(function (g) {
    _vcUserApplyPerm(g, u[g]);
  });
  // Popula combo de controle associado com filtro de duplicidade.
  _vcUserRenderCtrlCombo(idx);
  _vcUserOriginalSnapshot = _vcUserCurrentFormSnapshot();
}

function _vcUserApplyPerm(group, perm) {
  perm = perm || {};
  // Partições (chars '1'..'6' marcam; '-' desmarca)
  var pStr = (perm.part || '------').padEnd(6, '-');
  document.querySelectorAll('.vc-user-p[data-perm="' + group + '"]').forEach(function (b) {
    var n = parseInt(b.dataset.p, 10);
    var ch = pStr.charAt(n - 1);
    b.checked = (ch !== '-' && ch !== '0');
  });
  // Dias (D S T Q Q S S) — só Arme/Desarme/PGM têm dow
  var dows = ['dom','seg','ter','qua','qui','sex','sab'];
  var dStr = (perm.dow || '-------').padEnd(7, '-');
  document.querySelectorAll('.vc-user-d[data-perm="' + group + '"]').forEach(function (b) {
    var d = b.dataset.d;
    var i = dows.indexOf(d);
    if (i < 0) return;
    b.checked = (dStr.charAt(i) !== '-' && dStr.charAt(i) !== '0');
  });
  // Horários
  var hi = document.querySelector('input[data-perm="' + group + '"][data-h="ini"]');
  var hf = document.querySelector('input[data-perm="' + group + '"][data-h="fim"]');
  if (hi) hi.value = perm.hi || '00:00';
  if (hf) hf.value = perm.hf || '23:59';
}

function _vcUserBindButtons() {
  var btnSave   = document.getElementById('vcUserBtnEditar');
  var btnDel    = document.getElementById('vcUserBtnExcluir');
  var btnNew    = document.getElementById('vcUserBtnNovo');
  var btnCancel = document.getElementById('vcUserBtnCancelar');
  if (btnSave   && !btnSave._vcBound)   { btnSave._vcBound   = true; btnSave.addEventListener('click', _vcUserSave); }
  if (btnDel    && !btnDel._vcBound)    { btnDel._vcBound    = true; btnDel.addEventListener('click', _vcUserDelete); }
  if (btnNew    && !btnNew._vcBound)    { btnNew._vcBound    = true; btnNew.addEventListener('click', _vcUserNew); }
  if (btnCancel && !btnCancel._vcBound) { btnCancel._vcBound = true; btnCancel.addEventListener('click', _vcUserCancel); }
  _vcUserBindIoButtons();
}

// Cancela edição: se houver pending changes (form != snapshot original),
// pergunta antes de descartar (CtrlUserEdit.kt:624-633). Senão fecha direto.
async function _vcUserCancel() {
  var pending = false;
  try { pending = (_vcUserCurrentFormSnapshot() !== _vcUserOriginalSnapshot); }
  catch (_) { pending = false; }
  if (pending) {
    var ok = await vcConfirm({
      title:   VCi18n.t('usuario.descartar_alteracoes_titulo') || 'Descartar alterações?',
      message: VCi18n.t('usuario.descartar_alteracoes')         || 'Você tem alterações não salvas neste usuário. Descartar?',
      okLabel: VCi18n.t('common.descartar')                     || 'Descartar',
      danger:  true
    });
    if (!ok) return;
  }
  _vcUserSelected = null;
  _vcUserOriginalSnapshot = '';
  var emptyEl = document.getElementById('vcUserFormEmpty');
  var formEl  = document.getElementById('vcUserForm');
  if (emptyEl) emptyEl.classList.remove('d-none');
  if (formEl)  formEl.classList.add('d-none');
  document.querySelectorAll('#vcUserList .vc-user-row').forEach(function (r) {
    r.style.background = '';
  });
}

// Monta as strings de part/dow para cada grupo a partir dos checkboxes.
function _vcUserBuildPart(group) {
  var arr = ['-','-','-','-','-','-'];
  document.querySelectorAll('.vc-user-p[data-perm="' + group + '"]').forEach(function (b) {
    if (!b.checked) return;
    var n = parseInt(b.dataset.p, 10);
    if (n >= 1 && n <= 6) arr[n - 1] = String(n);
  });
  return arr.join('');
}
function _vcUserBuildDow(group) {
  // Java: D S T Q Q S S (Dom Seg Ter Qua Qui Sex Sab)
  var map = { dom: 'D', seg: 'S', ter: 'T', qua: 'Q', qui: 'Q', sex: 'S', sab: 'S' };
  var order = ['dom','seg','ter','qua','qui','sex','sab'];
  var arr = ['-','-','-','-','-','-','-'];
  document.querySelectorAll('.vc-user-d[data-perm="' + group + '"]').forEach(function (b) {
    if (!b.checked) return;
    var i = order.indexOf(b.dataset.d);
    if (i >= 0) arr[i] = map[b.dataset.d] || '-';
  });
  return arr.join('');
}
function _vcUserPermStr(group, withDow) {
  var part = _vcUserBuildPart(group);
  if (!withDow) return part;
  var dow = _vcUserBuildDow(group);
  var hi  = (document.querySelector('input[data-perm="' + group + '"][data-h="ini"]') || { value: '00:00' }).value;
  var hf  = (document.querySelector('input[data-perm="' + group + '"][data-h="fim"]') || { value: '23:59' }).value;
  return part + '/' + dow + '/' + hi + '/' + hf;
}

// Bitmask de flags (8 chars OBRIGATÓRIO — central rejeita len ≠ 8).
// Posições (CtrlUser.kt:670-681, validado por stringToFlags que exige
// length==8 em :1004):
//   [0] armar           [1] armarDataHora
//   [2] desarmar        [3] desarmarDataHora
//   [4] pgm             [5] pgmDataHora
//   [6] panico          [7] enabled
//
// Default "11111111" = usuário totalmente habilitado, sem restrições de
// data/hora. A UI ainda não expõe toggles individuais — quando expor,
// montar a string a partir dos checkboxes (cada `-` ou `0` = bit off).
function _vcUserBuildFlags() {
  return '11111111';
}

// Validações pré-envio espelhando CtrlUserEdit.kt:869-1060.
// Retorna null se OK, ou { key, vars? } com a chave i18n do erro.
//
// Nota: NÃO exigimos ≥1 partição por grupo. Partição vazia em um grupo
// (ex.: "Armar" sem nenhuma partição marcada) significa que o usuário
// não pode realizar essa ação — caso de uso legítimo: usuário que só
// pode desarmar. Quando os toggles individuais de cada grupo forem
// adicionados (Flags armar/desarmar/pgm/panico = 0), a regra do Kotlin
// é gravar partição vazia automaticamente.
function _vcUserValidate(nome, senha) {
  // Nome 1..20 obrigatório (CtrlUser.kt:862, :1028)
  if (!nome || nome.length === 0) return { key: 'usuario.nome_obrigatorio' };
  if (nome.length > 20)            return { key: 'usuario.nome_longo' };
  // Senha só dígitos, 4..10 (CtrlUser.kt:870-883 + :1031)
  if (!senha)                      return { key: 'usuario.senha_invalida' };
  if (!/^\d+$/.test(senha))        return { key: 'usuario.senha_so_digitos' };
  if (senha.length < 4 || senha.length > 10) return { key: 'usuario.senha_qtd_digitos' };
  // Horários HH:MM em armar/desarmar/pgm (panico não tem hora).
  // Valida só se o input existe — campos preenchidos com valor inválido
  // bloqueiam o save; vazios são tratados como "00:00" / "23:59" no
  // _vcUserPermStr default.
  var withHora = ['armar', 'desarmar', 'pgm'];
  for (var j = 0; j < withHora.length; j++) {
    var grp = withHora[j];
    var hi = (document.querySelector('input[data-perm="' + grp + '"][data-h="ini"]') || {}).value || '';
    var hf = (document.querySelector('input[data-perm="' + grp + '"][data-h="fim"]') || {}).value || '';
    if (!_vcUserIsValidTime(hi) || !_vcUserIsValidTime(hf)) {
      return { key: 'usuario.horario_invalido', vars: { grupo: grp } };
    }
  }
  return null;
}

function _vcUserIsValidTime(s) {
  // HH:MM com `:` em pos 2, HH 00-23, MM 00-59 (CtrlUserEdit.kt:894-908)
  if (typeof s !== 'string') return false;
  var m = /^([0-9]{2}):([0-9]{2})$/.exec(s);
  if (!m) return false;
  var hh = parseInt(m[1], 10), mm = parseInt(m[2], 10);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

// Snapshot do form pra detectar pending changes ("Cancelar" pede confirmação
// se mudou em relação ao snapshot original gravado em _vcUserSelectItem/_vcUserNew).
function _vcUserCurrentFormSnapshot() {
  return JSON.stringify({
    nome:  (document.getElementById('vcUserNome')  || {}).value || '',
    senha: (document.getElementById('vcUserSenha') || {}).value || '',
    ctrl:  (document.getElementById('vcUserCtrlAssoc') || {}).value || '',
    armar:    _vcUserPermStr('armar', true),
    desarmar: _vcUserPermStr('desarmar', true),
    pgm:      _vcUserPermStr('pgm', true),
    panico:   _vcUserPermStr('panico', false)
  });
}
var _vcUserOriginalSnapshot = '';

async function _vcUserSave() {
  if (_vcUserSelected == null) return;
  var idx = _vcUserSelected;
  var net = window.vettiAPI.network;
  var nome  = (document.getElementById('vcUserNome').value  || '').trim();
  var senha = (document.getElementById('vcUserSenha').value || '').trim();

  // Validação completa (espelha Kotlin: bloqueia Gravar se inválido).
  var verr = _vcUserValidate(nome, senha);
  if (verr) {
    vcToast(VCi18n.t(verr.key, verr.vars || {}), 'error', 4000);
    return;
  }
  // Remove acentos do nome (espelha Java `deAccent` em Func.kt — usa
  // \p{InCombiningDiacriticalMarks}+ pra varrer o bloco U+0300..U+036F).
  // Antes usávamos `/[̀-ͯ]/g` mas o range tinha caracteres combinantes
  // invisíveis no source que não casavam tudo — trocado por escape Unicode
  // explícito que cobre o bloco inteiro.
  var nomeAscii = nome.normalize('NFD').replace(/[\u0300-\u036F]/g, '');
  var flags = _vcUserBuildFlags();
  var armar    = _vcUserPermStr('armar', true);
  var desarmar = _vcUserPermStr('desarmar', true);
  var pgm      = _vcUserPermStr('pgm', true);
  var panico   = _vcUserPermStr('panico', false);   // panico só tem part
  var cmd = 'USER Idx=' + idx + ' Stat=OK Flags=' + flags +
            ' Nome="' + nomeAscii.replace(/"/g, '\\"') + '"' +
            ' Senha=' + senha +
            ' Armar=' + armar +
            ' Desarmar=' + desarmar +
            ' Pgm=' + pgm +
            ' Panico=' + panico;
  vcToast(VCi18n.t('usuario.gravando'), 'info', 0, { id: 'user-save', persist: true });
  try {
    var r = await net.sendCommand(cmd);
    if (r && r.ok) {
      vcToast(VCi18n.t('usuario.gravado'), 'success', 2500, { id: 'user-save' });
      // Persiste controle associado (vínculo só local).
      var ctrlSel = (document.getElementById('vcUserCtrlAssoc') || {}).value || '';
      if (ctrlSel) _vcUserCtrlAssoc[String(idx)] = ctrlSel;
      else delete _vcUserCtrlAssoc[String(idx)];
      await _vcUserCtrlAssocPersist();
      _vcUserRefreshCtrlCell(idx);
      // Recarrega o registro pra refletir o que a central de fato gravou
      // (acentos removidos, valores normalizados).
      var r2 = await net.sendCommand('USER Idx=' + idx);
      if (r2 && r2.ok) {
        var u = _parseUser(r2.body);
        if (u && u.idx) {
          _vcUserCache[u.idx] = u;
          var row = document.querySelector('.vc-user-row[data-idx="' + idx + '"]');
          if (row) row.querySelector('div').textContent = u.nome || '---';
          else _vcUserAppendRow(u);
        }
      }
      // Re-lê bitmap: slot recém-criado precisa virar 'O' no cache local.
      await _vcUserRefreshSlotBitmap();
      // Fecha o card de edição — espelha o fluxo do Java (CtrlUserEdit.kt:
      // stage.close() após save). Snapshot zerado pra Cancelar não pedir
      // "Descartar?" depois.
      _vcUserSelected = null;
      _vcUserOriginalSnapshot = '';
      var emptyEl = document.getElementById('vcUserFormEmpty');
      var formEl  = document.getElementById('vcUserForm');
      if (emptyEl) emptyEl.classList.remove('d-none');
      if (formEl)  formEl.classList.add('d-none');
      document.querySelectorAll('#vcUserList .vc-user-row').forEach(function (r) {
        r.style.background = '';
      });
    } else {
      vcToast(VCi18n.t('usuario.erro_gravar'), 'error', 4000, { id: 'user-save' });
    }
  } catch (e) {
    vcToast(VCi18n.t('usuario.erro_gravar'), 'error', 4000, { id: 'user-save' });
  }
}

async function _vcUserDelete() {
  if (_vcUserSelected == null) return;
  var ok = await vcConfirm({
    title:      VCi18n.t('usuario.excluir_usuario')      || 'Excluir usuário?',
    message:    VCi18n.t('usuario.confirmar_excluir')    || 'Tem certeza que deseja excluir este usuário?',
    subMessage: VCi18n.t('common.atencao_irreversivel') || 'Atenção: esta operação não poderá ser desfeita.',
    okLabel:    VCi18n.t('usuario.excluir')              || 'Excluir',
    danger:     true
  });
  if (!ok) return;
  var idx = _vcUserSelected;
  var net = window.vettiAPI.network;
  vcToast(VCi18n.t('usuario.excluindo'), 'info', 0, { id: 'user-del', persist: true });
  try {
    var r = await net.sendCommand('USER Idx=' + idx + ' Stat=DEL');
    if (r && r.ok) {
      vcToast(VCi18n.t('usuario.excluido'), 'success', 2500, { id: 'user-del' });
      var row = document.querySelector('.vc-user-row[data-idx="' + idx + '"]');
      if (row) row.remove();
      delete _vcUserCache[idx];
      // Libera o controle associado pra outro usuário reaproveitar.
      if (_vcUserCtrlAssoc[String(idx)]) {
        delete _vcUserCtrlAssoc[String(idx)];
        await _vcUserCtrlAssocPersist();
      }
      _vcUserSelected = null;
      _vcUserOriginalSnapshot = '';
      document.getElementById('vcUserFormEmpty').classList.remove('d-none');
      document.getElementById('vcUserForm').classList.add('d-none');
      // Re-lê bitmap pra slot liberado virar '-' no cache local — "Novo
      // usuário" pode reaproveitar imediatamente.
      await _vcUserRefreshSlotBitmap();
    } else {
      vcToast(VCi18n.t('usuario.erro_excluir'), 'error', 4000, { id: 'user-del' });
    }
  } catch (e) {
    vcToast(VCi18n.t('usuario.erro_excluir'), 'error', 4000, { id: 'user-del' });
  }
}

// Abre o form em branco apontando para o primeiro slot livre.
function _vcUserNew() {
  var slots = _vcUserSlots || '';
  var freeIdx = null;
  for (var i = 0; i < (slots.length || 99); i++) {
    var c = slots.charAt(i) || '-';
    if (c !== 'O') { freeIdx = i + 1; break; }
  }
  if (freeIdx == null) {
    vcToast(VCi18n.t('usuario.bd_cheio'), 'error');
    return;
  }
  _vcUserSelected = freeIdx;
  document.getElementById('vcUserFormEmpty').classList.add('d-none');
  document.getElementById('vcUserForm').classList.remove('d-none');
  document.getElementById('vcUserNome').value  = '';
  document.getElementById('vcUserSenha').value = '';
  document.getElementById('vcUserNumAux').value = String(freeIdx);
  ['armar','desarmar','pgm','panico'].forEach(function (g) {
    _vcUserApplyPerm(g, { part: '------', dow: '-------', hi: '00:00', hf: '23:59' });
  });
  _vcUserRenderCtrlCombo(freeIdx);
  _vcUserOriginalSnapshot = _vcUserCurrentFormSnapshot();
}

/* ═════════════════════════════════════════════════════════════
   EXPORTAR / IMPORTAR usuários (aba Usuários — card próprio)
   ═════════════════════════════════════════════════════════════
   Schema: vetticonfig-users-1 (gerenciado por src/main/services/
   users_io.js — só dialog Save/Open). O renderer:
     • Export: re-fetcha cada USER Idx=N pra ter o body raw atualizado
       (caso a UI tenha cache desatualizado) + snapshot do _vcUserCtrlAssoc.
     • Import: confirma (operação destrutiva) → replay raw "USER ..."
       pra cada registro → mescla ctrlAssoc na chave do MAC corrente.

   Atenção: o controle associado (ctrlAssoc) é vínculo só-local (storage
   por MAC). Importar em uma central com MAC diferente mantém os
   userIdx → bdIdx, mas se a central de destino não tiver os mesmos
   dispositivos no banco BD, os controles ficarão "órfãos" (mostram
   "Controle NN (não encontrado)" e o usuário pode reatribuir).
   ═════════════════════════════════════════════════════════════ */
async function _vcUserExport() {
  if (!window.vettiAPI || !window.vettiAPI.usersIo) return;
  var net = window.vettiAPI.network;
  if (!net) return;
  var slots = _vcUserSlots || '';
  var occupied = [];
  for (var i = 0; i < slots.length; i++) {
    if (slots.charAt(i) === 'O') occupied.push(i + 1);
  }
  if (occupied.length === 0) {
    vcToast(VCi18n.t('usuario.export_vazio') || 'Nenhum usuário cadastrado pra exportar.', 'warn');
    return;
  }
  vcToast(VCi18n.t('usuario.export_lendo', { n: occupied.length })
          || 'Lendo ' + occupied.length + ' usuários…', 'info', 0,
          { id: 'user-export', persist: true });
  var users = [];
  for (var j = 0; j < occupied.length; j++) {
    try {
      var r = await net.sendCommand('USER Idx=' + occupied[j]);
      if (r && r.ok) users.push({ idx: occupied[j], raw: r.body });
    } catch (_) {}
  }
  // Snapshot do mapa de controles SÓ pros usuários incluídos.
  var ctrl = {};
  Object.keys(_vcUserCtrlAssoc).forEach(function (uIdx) {
    if (occupied.indexOf(parseInt(uIdx, 10)) >= 0) ctrl[uIdx] = _vcUserCtrlAssoc[uIdx];
  });
  var payload = {
    schema:    'vetticonfig-users-1',
    createdAt: new Date().toISOString(),
    source: {
      centralName: (document.getElementById('vcCentralName') || {}).textContent || '',
      model:       (document.getElementById('vcCentralModel') || {}).textContent || '',
      mac:         ((document.getElementById('vcCentralMac') || {}).textContent || '').replace(/^MAC:\s*/i, '')
    },
    users: users,
    ctrlAssoc: ctrl
  };
  try {
    var resp = await window.vettiAPI.usersIo.exportToFile(payload);
    if (resp && resp.ok) {
      vcToast(VCi18n.t('usuario.export_ok', { path: resp.path, n: users.length })
              || 'Exportado: ' + resp.path + ' (' + users.length + ' usuários)',
              'success', 5000, { id: 'user-export' });
    } else if (resp && resp.canceled) {
      vcToastClose('user-export');
    } else {
      vcToast((resp && resp.error) || 'Falha ao exportar.', 'warn', 4000, { id: 'user-export' });
    }
  } catch (err) {
    vcToast((err && err.message) || 'Erro ao exportar.', 'warn', 4000, { id: 'user-export' });
  }
}

async function _vcUserImport() {
  if (!window.vettiAPI || !window.vettiAPI.usersIo) return;
  var net = window.vettiAPI.network;
  if (!net) return;

  var r;
  try { r = await window.vettiAPI.usersIo.importFromFile(); }
  catch (err) { vcToast((err && err.message) || 'Erro', 'warn'); return; }
  if (!r || !r.ok) {
    if (r && r.canceled) return;
    vcToast((r && r.error) || 'Falha ao importar.', 'warn');
    return;
  }
  var data = r.data;
  var n = (data.users || []).length;
  var src = (data.source && (data.source.centralName || data.source.mac)) || '';
  var ok = await vcConfirm({
    title:      VCi18n.t('usuario.import_titulo')   || 'Importar usuários?',
    message:    VCi18n.t('usuario.import_confirma', { n: n, source: src })
                || ('Aplicar ' + n + ' usuários do arquivo na central conectada?\nOrigem: ' + src),
    subMessage: VCi18n.t('usuario.import_atencao')
                || 'Os usuários atualmente cadastrados em slots correspondentes serão sobrescritos.',
    okLabel:    VCi18n.t('usuario.importar')        || 'Importar',
    danger:     true
  });
  if (!ok) return;

  vcToast(VCi18n.t('usuario.import_aplicando', { n: n })
          || 'Aplicando ' + n + ' usuários…', 'info', 0,
          { id: 'user-import', persist: true });

  var okN = 0, errN = 0;
  for (var i = 0; i < (data.users || []).length; i++) {
    var u = data.users[i];
    try {
      // u.raw já vem como "USER Idx=N Stat=OK Flags=... Nome=... ...".
      // Replay direto monta o write command — mesmo shape do read response.
      var raw = String(u.raw || '').replace(/^USER\s+/i, '');
      var resp = await net.sendCommand('USER ' + raw);
      if (resp && resp.ok) okN++; else errN++;
    } catch (_) { errN++; }
  }

  // Mescla ctrlAssoc no MAC corrente (não mistura com outras centrais).
  if (data.ctrlAssoc && typeof data.ctrlAssoc === 'object') {
    Object.keys(data.ctrlAssoc).forEach(function (uIdx) {
      _vcUserCtrlAssoc[uIdx] = String(data.ctrlAssoc[uIdx]);
    });
    await _vcUserCtrlAssocPersist();
  }

  // Recarrega bitmap + lista pra UI refletir tudo.
  await _vcUserRefreshSlotBitmap();
  await _vcUserLoad();

  vcToast(VCi18n.t('usuario.import_resultado', { ok: okN, err: errN })
          || ('Importação concluída: ' + okN + ' OK, ' + errN + ' falhas.'),
          errN > 0 ? 'warn' : 'success', 6000, { id: 'user-import' });
}

function _vcUserBindIoButtons() {
  var bExp = document.getElementById('vcUserBtnExportar');
  if (bExp && !bExp._vcBound) {
    bExp._vcBound = true;
    bExp.addEventListener('click', function (e) { e.preventDefault(); _vcUserExport(); });
  }
  var bImp = document.getElementById('vcUserBtnImportar');
  if (bImp && !bImp._vcBound) {
    bImp._vcBound = true;
    bImp.addEventListener('click', function (e) { e.preventDefault(); _vcUserImport(); });
  }
}


/* ═════════════════════════════════════════════════════════════
   SISTEMA → AGENDAMENTO (aba)
   Comandos (validados na versão Java):
     AGENDA <idx>                        → ler
     AGENDA <idx> Stat:OK Hora:hh:mm
            Freq:n Feriado:0|1 Mes:m Dia:d DDS:bitmask
            Acao:n Part:bitmask PGM:idx Desc:"..."  → gravar
     AGENDA <idx> Stat:DEL               → excluir
   Freq: 0=Anual, 1=Mensal, 2=Semanal, 3=Feriado
   Acao: 0=Nenhuma, 1=Armar, 2=Desarmar, 3=PGM On,
         4=PGM Off, 5=PGM Toggle, 6=PGM Pulse
   ═════════════════════════════════════════════════════════════ */
var _vcAgendaCache = {};
var _vcAgendaSelected = null;
// Capacidade confirmada pelo Kotlin (CtrlAgenda.handleAgendaReg:854):
// idx < 64. Iteramos até 64 — o load para antes ao detectar Stat=LIV
// (slot livre, fim da iteração).
var _VC_AGENDA_MAX = 64;

async function _vcAgendaLoad() {
  var panel = document.getElementById('vcSysAgendamento');
  if (!panel) return;
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return;
  panel.dataset.loaded = '1';

  // Compatibilidade de firmware (CtrlAgenda.kt:346-354 + 1410):
  //   AGENDA  → mod=5 ver>=516, mod=6 ver>=605, ou mod>=7
  //   MsgTesteCID → mod=5 ver>=561, mod=6 ver>=661, ou mod>=7
  var mod = _vcCentralMod || 0;
  var ver = _vcCentralVer || 0;
  var hasAgenda = (mod === 5 && ver >= 516) || (mod === 6 && ver >= 605) || (mod >= 7);
  var hasMsgTesteCid = (mod === 5 && ver >= 561) || (mod === 6 && ver >= 661) || (mod >= 7);
  _vcAgendaApplyCompat(hasAgenda, hasMsgTesteCid);
  if (!hasAgenda) {
    vcToast(VCi18n.t('agenda.fw_nao_suporta') || 'Firmware da central não suporta agendamentos (precisa >= 5.16 / 6.05).', 'warn', 4000,
            { id: 'load-panel-vcSysAgendamento' });
    return;
  }

  vcToast(VCi18n.t('common.loading_tab', { tab: 'Agendamento' }), 'info', 0,
          { id: 'load-panel-vcSysAgendamento', persist: true });

  _vcAgendaCache = {};
  var list = document.getElementById('vcAgendList');
  if (list) list.innerHTML = '';

  // Itera por todos os slots — encerra ao detectar Stat=LIV (slot livre,
  // fim natural da iteração no firmware; Java faz a mesma coisa em
  // handleAgendaReg:854). Mantém ERR 27 e contador de erros como
  // segurança para firmwares ligeiramente diferentes.
  var consecutiveErrors = 0;
  for (var i = 1; i <= _VC_AGENDA_MAX; i++) {
    try {
      var r = await net.sendCommand('AGENDA ' + i);
      if (!r || !r.ok) {
        if (r && r.errorCode === 27) break;
        consecutiveErrors++;
        if (consecutiveErrors >= 3) break;
        continue;
      }
      consecutiveErrors = 0;
      var a = _parseAgenda(r.body);
      if (a && a.idx) {
        _vcAgendaCache[a.idx] = a;
        if (a.stat && /OK/i.test(a.stat)) {
          _vcAgendaAppendRow(a);
        } else if (a.stat && /LIV/i.test(a.stat)) {
          break;  // fim natural da lista
        } else if (a.stat && /DEL/i.test(a.stat)) {
          // Slot foi deletado — não mostra na UI mas loga pra debug.
          vcLogTs(VCi18n.t('agenda.slot_del', { idx: a.idx }) || ('Slot ' + a.idx + ' deletado — ignorado.'));
        } else if (a.stat && /INV/i.test(a.stat)) {
          // Registro inválido — pode ser corrupção ou versão antiga.
          vcLogTs(VCi18n.t('agenda.slot_inv', { idx: a.idx }) || ('Slot ' + a.idx + ' inválido — ignorado.'));
        }
      }
    } catch (_) {}
  }

  _vcAgendaBindListClicks();
  _vcAgendaBindButtons();
  vcToast(VCi18n.t('common.loaded_tab', { tab: 'Agendamento' }), 'success', 2500,
          { id: 'load-panel-vcSysAgendamento' });
}

function _parseAgenda(body) {
  // [R<seq> AGENDA 1 Stat:OK Hora:08:00 Freq:2 Feriado:0 Mes:0 Dia:0 DDS:DSTQQSS Acao:1 Part:1----- PGM:0 Desc:"..."]
  var s = String(body || '').replace(/^AGENDA\s+/i, '');
  var idxMatch = /^(\d+)\s+/.exec(s);
  if (!idxMatch) return null;
  var idx = parseInt(idxMatch[1], 10);
  var rest = s.slice(idxMatch[0].length);
  function f(re) { var m = re.exec(rest); return m ? m[1] : null; }
  return {
    idx:     idx,
    stat:    f(/Stat:(\w+)/i),
    hora:    f(/Hora:(\S+)/i),
    freq:    f(/Freq:(\d+)/i),
    feriado: f(/Feriado:(\d+)/i),
    mes:     f(/Mes:(\d+)/i),
    dia:     f(/Dia:(\d+)/i),
    dds:     f(/DDS:(\S+)/i),
    acao:    f(/Acao:(\d+)/i),
    part:    f(/Part:(\S+)/i),
    pgm:     f(/PGM:(\d+)/i),
    desc:    f(/Desc:"([^"]*)"/i)
  };
}

function _vcAgendaAppendRow(a) {
  var list = document.getElementById('vcAgendList');
  if (!list) return;
  var row = document.createElement('div');
  row.className = 'vc-agenda-row';
  row.dataset.idx = a.idx;
  row.style.cssText = 'display:grid;grid-template-columns:50px 70px 1fr 100px;padding:6px 10px;border-bottom:1px solid #E5E8EB;cursor:pointer;font-size:13px;';
  var acaoLabel = _vcAgendaAcaoLabel(a.acao);
  row.innerHTML =
    '<div>' + String(a.idx).padStart(2, '0') + '</div>' +
    '<div>' + _vcEscape(a.hora || '--:--') + '</div>' +
    '<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _vcEscape(a.desc || '---') + '</div>' +
    '<div>' + _vcEscape(acaoLabel) + '</div>';
  list.appendChild(row);
}

function _vcAgendaAcaoLabel(n) {
  var v = parseInt(n, 10);
  // Espelha AgendaAcao do firmware (CtrlAgenda.kt:161-170):
  //   0=NONE 1=Armar 2=Desarmar 3=LigarPGM 4=DesligarPGM 5=PulsarPGM
  //   6=ArmarStay 7=MsgTesteCID
  var k = ['agenda.acao_nenhuma',
           'agenda.acao_armar',
           'agenda.acao_desarmar',
           'agenda.acao_pgm_on',
           'agenda.acao_pgm_off',
           'agenda.acao_pgm_pulse',
           'agenda.acao_armar_stay',
           'agenda.acao_msg_teste'][v];
  return k ? VCi18n.t(k) : '---';
}

function _vcAgendaBindListClicks() {
  var list = document.getElementById('vcAgendList');
  if (!list || list._vcBound) return;
  list._vcBound = true;
  list.addEventListener('click', function (e) {
    var row = e.target.closest('.vc-agenda-row');
    if (!row) return;
    var idx = parseInt(row.dataset.idx, 10);
    if (isNaN(idx)) return;
    list.querySelectorAll('.vc-agenda-row').forEach(function (r) { r.style.background = ''; });
    row.style.background = 'rgba(0,118,203,.10)';
    _vcAgendaSelectItem(idx);
  });
}

function _vcAgendaSelectItem(idx) {
  var a = _vcAgendaCache[idx];
  if (!a) return;
  _vcAgendaSelected = idx;
  var setVal = function (id, v) { var el = document.getElementById(id); if (el) el.value = v == null ? '' : v; };
  setVal('vcAgendIdx',     String(idx).padStart(2, '0'));
  setVal('vcAgendHora',    a.hora || '00:00');
  setVal('vcAgendFreq',    a.freq || '0');
  setVal('vcAgendFeriado', a.feriado || '0');
  setVal('vcAgendMes',     a.mes || '0');
  setVal('vcAgendDia',     a.dia || '0');
  setVal('vcAgendAcao',    a.acao || '0');
  setVal('vcAgendPgm',     a.pgm || '0');
  setVal('vcAgendDesc',    a.desc || '');
  // DDS (7 chars): D S T Q Q S S
  var ddsOrder = ['dom','seg','ter','qua','qui','sex','sab'];
  var ddsStr = (a.dds || '-------').padEnd(7, '-');
  document.querySelectorAll('.vc-agenda-dds').forEach(function (b) {
    var i = ddsOrder.indexOf(b.dataset.d);
    if (i >= 0) b.checked = ddsStr.charAt(i) !== '-' && ddsStr.charAt(i) !== '0';
  });
  // Part (6 chars): 1 2 3 4 5 6
  var pStr = (a.part || '------').padEnd(6, '-');
  document.querySelectorAll('.vc-agenda-part').forEach(function (b, i) {
    var ch = pStr.charAt(i);
    b.checked = ch !== '-' && ch !== '0';
  });
  var emptyEl = document.getElementById('vcAgendFormEmpty');
  var formEl  = document.getElementById('vcAgendForm');
  if (emptyEl) emptyEl.classList.add('d-none');
  if (formEl)  formEl.classList.remove('d-none');
  _vcAgendaRefreshFieldVisibility();
}

// Aplica restrições de compatibilidade de firmware na aba Agendamento.
//   - hasAgenda=false: desabilita o form todo + mostra aviso na lista
//   - hasMsgTesteCid=false: desabilita só a opção "Msg Teste CID" no
//     dropdown de Ação
function _vcAgendaApplyCompat(hasAgenda, hasMsgTesteCid) {
  var form = document.getElementById('vcAgendForm');
  var empty = document.getElementById('vcAgendFormEmpty');
  var list = document.getElementById('vcAgendList');
  var btnNew = document.getElementById('vcAgendBtnNovo');
  if (!hasAgenda) {
    if (form) form.classList.add('d-none');
    if (empty) {
      empty.classList.remove('d-none');
      // Substitui o texto pelo aviso de firmware
      empty.innerHTML = '<div class="text-warning" style="padding:14px;">'
        + (VCi18n.t('agenda.fw_nao_suporta') || 'Firmware da central não suporta agendamentos (precisa >= 5.16 / 6.05).')
        + '</div>';
    }
    if (list)  list.innerHTML = '';
    if (btnNew) btnNew.disabled = true;
  } else {
    if (btnNew) btnNew.disabled = false;
  }
  // Opção 7 = Msg Teste CID
  var opt = document.querySelector('#vcAgendAcao option[value="7"]');
  if (opt) opt.disabled = !hasMsgTesteCid;
}

// Habilita/desabilita campos do form de Agendamento conforme a Freq e
// a Ação selecionadas — espelha radioButtonFreqClicked /
// radioButtonAcaoClicked do CtrlAgenda.kt.
function _vcAgendaRefreshFieldVisibility() {
  var freq = parseInt((document.getElementById('vcAgendFreq') || {}).value, 10);
  var acao = parseInt((document.getElementById('vcAgendAcao') || {}).value, 10);
  var setDis = function (id, dis) {
    var el = document.getElementById(id);
    if (el) el.disabled = !!dis;
  };
  // Freq:
  //   1=Anual    → Mes + Dia
  //   2=Mensal   → Dia
  //   3=Semanal  → DDS (checkboxes)
  //   4=Feriados → nada (somente checkbox feriado, que é forçado)
  setDis('vcAgendMes', !(freq === 1));
  setDis('vcAgendDia', !(freq === 1 || freq === 2));
  setDis('vcAgendFeriado', freq === 4);   // freq feriados já implica nesse comportamento
  document.querySelectorAll('.vc-agenda-dds').forEach(function (b) { b.disabled = (freq !== 3); });

  // Acao:
  //   1=Armar / 2=Desarmar / 6=Stay → Partições
  //   3=LigarPgm / 4=DesligarPgm / 5=PulsarPgm → PGM idx
  //   7=MsgTesteCID → nada extra
  var isPartAcao = (acao === 1 || acao === 2 || acao === 6);
  var isPgmAcao  = (acao === 3 || acao === 4 || acao === 5);
  document.querySelectorAll('.vc-agenda-part').forEach(function (b) { b.disabled = !isPartAcao; });
  setDis('vcAgendPgm', !isPgmAcao);
}

function _vcAgendaBindButtons() {
  var btnSave   = document.getElementById('vcAgendBtnSalvar');
  var btnDel    = document.getElementById('vcAgendBtnExcluir');
  var btnNew    = document.getElementById('vcAgendBtnNovo');
  var btnCancel = document.getElementById('vcAgendBtnCancelar');
  if (btnSave   && !btnSave._vcBound)   { btnSave._vcBound   = true; btnSave.addEventListener('click', _vcAgendaSave); }
  if (btnDel    && !btnDel._vcBound)    { btnDel._vcBound    = true; btnDel.addEventListener('click', _vcAgendaDelete); }
  if (btnNew    && !btnNew._vcBound)    { btnNew._vcBound    = true; btnNew.addEventListener('click', _vcAgendaNew); }
  if (btnCancel && !btnCancel._vcBound) { btnCancel._vcBound = true; btnCancel.addEventListener('click', _vcAgendaCancel); }

  // Change listeners pra atualizar visibilidade dinâmica
  var fSel = document.getElementById('vcAgendFreq');
  var aSel = document.getElementById('vcAgendAcao');
  if (fSel && !fSel._vcBound) { fSel._vcBound = true; fSel.addEventListener('change', _vcAgendaRefreshFieldVisibility); }
  if (aSel && !aSel._vcBound) { aSel._vcBound = true; aSel.addEventListener('change', _vcAgendaRefreshFieldVisibility); }
}

function _vcAgendaCancel() {
  _vcAgendaSelected = null;
  var emptyEl = document.getElementById('vcAgendFormEmpty');
  var formEl  = document.getElementById('vcAgendForm');
  if (emptyEl) emptyEl.classList.remove('d-none');
  if (formEl)  formEl.classList.add('d-none');
  document.querySelectorAll('#vcAgendList .vc-agenda-row').forEach(function (r) {
    r.style.background = '';
  });
}

async function _vcAgendaSave() {
  if (_vcAgendaSelected == null) return;
  var idx = _vcAgendaSelected;
  var net = window.vettiAPI.network;
  var get = function (id, def) { var el = document.getElementById(id); return el ? (el.value || def || '') : (def || ''); };
  var hora = get('vcAgendHora', '00:00');
  var desc = get('vcAgendDesc', '');

  // Validação de Hora — espelha CtrlAgenda.kt:458-466. Exige HH:MM com
  // hour 0..23 e minute 0..59. Se inválido, mostra toast e cancela.
  var hmatch = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!hmatch || +hmatch[1] > 23 || +hmatch[2] > 59) {
    vcToast(VCi18n.t('agenda.hora_invalida') || 'Hora inválida — use HH:MM (00:00–23:59).', 'warn');
    return;
  }
  // Validação de Desc — máximo 40 chars (CtrlAgenda.kt:453, 683).
  if (desc.length > 40) {
    vcToast(VCi18n.t('agenda.desc_longa') || 'Descrição máx. 40 caracteres.', 'warn');
    return;
  }

  var freq = parseInt(get('vcAgendFreq', '3'), 10);   // 1=Anual,2=Mensal,3=Semanal,4=Feriados
  var feriado = get('vcAgendFeriado', '0');
  var mes = parseInt(get('vcAgendMes', '1'), 10);
  var dia = parseInt(get('vcAgendDia', '1'), 10);
  var acao = parseInt(get('vcAgendAcao', '1'), 10);    // 1=Armar,...,7=MsgTesteCID
  var pgm  = parseInt(get('vcAgendPgm', '1'), 10);
  desc = desc.replace(/"/g, '\\"');   // já validado length acima

  // ── Normalização espelhando o validateAllFields do CtrlAgenda.kt:
  //    * Semanal e Feriados → Mes=1, Dia=1 (firmware exige >= 1)
  //    * Mensal             → Mes=1, Dia=user-input (1..31)
  //    * Anual              → Mes=user (1..12), Dia=user (1..31)
  //    * Ações que NÃO são PGM (Armar/Desarmar/Stay/MsgTeste) → PGM=1
  //    * Ações PGM (3/4/5)   → PGM=user (1..256)
  // Firmware rejeita com ERR 24 valores fora do range — daí o bug onde
  // mandávamos Mes:0/Dia:0/PGM:0 e a central recusava.
  if (freq === 3 /* Semanal */ || freq === 4 /* Feriados */) {
    mes = 1; dia = 1;
  } else if (freq === 2 /* Mensal */) {
    mes = 1;
    if (!isFinite(dia) || dia < 1 || dia > 31) dia = 1;
  } else if (freq === 1 /* Anual */) {
    if (!isFinite(mes) || mes < 1 || mes > 12) mes = 1;
    if (!isFinite(dia) || dia < 1 || dia > 31) dia = 1;
  }
  var isPgmAction = (acao === 3 || acao === 4 || acao === 5);
  if (!isPgmAction) {
    pgm = 1;
  } else if (!isFinite(pgm) || pgm < 1 || pgm > 256) {
    pgm = 1;
  }

  // DDS (7 chars) e Part (6 chars)
  var ddsOrder = ['dom','seg','ter','qua','qui','sex','sab'];
  var ddsMap = { dom:'D', seg:'S', ter:'T', qua:'Q', qui:'Q', sex:'S', sab:'S' };
  var ddsArr = ['-','-','-','-','-','-','-'];
  document.querySelectorAll('.vc-agenda-dds').forEach(function (b) {
    if (!b.checked) return;
    var i = ddsOrder.indexOf(b.dataset.d);
    if (i >= 0) ddsArr[i] = ddsMap[b.dataset.d] || '-';
  });
  var partArr = ['-','-','-','-','-','-'];
  document.querySelectorAll('.vc-agenda-part').forEach(function (b, i) {
    if (b.checked) partArr[i] = String(i + 1);
  });

  var cmd = 'AGENDA ' + idx + ' Stat:OK' +
            ' Hora:' + hora +
            ' Freq:' + freq +
            ' Feriado:' + feriado +
            ' Mes:' + mes +
            ' Dia:' + dia +
            ' DDS:' + ddsArr.join('') +
            ' Acao:' + acao +
            ' Part:' + partArr.join('') +
            ' PGM:' + pgm +
            ' Desc:"' + desc + '"';
  vcToast(VCi18n.t('agenda.gravando'), 'info', 0, { id: 'agenda-save', persist: true });
  try {
    var r = await net.sendCommand(cmd);
    if (r && r.ok) {
      vcToast(VCi18n.t('agenda.gravado'), 'success', 2500, { id: 'agenda-save' });
      // Recarrega para refletir
      var r2 = await net.sendCommand('AGENDA ' + idx);
      if (r2 && r2.ok) {
        var a = _parseAgenda(r2.body);
        if (a) {
          _vcAgendaCache[a.idx] = a;
          var row = document.querySelector('.vc-agenda-row[data-idx="' + idx + '"]');
          if (row) row.remove();
          if (a.stat && /OK/i.test(a.stat)) _vcAgendaAppendRow(a);
        }
      }
    } else {
      vcToast(VCi18n.t('agenda.erro_gravar'), 'error', 4000, { id: 'agenda-save' });
    }
  } catch (e) {
    vcToast(VCi18n.t('agenda.erro_gravar'), 'error', 4000, { id: 'agenda-save' });
  }
}

async function _vcAgendaDelete() {
  if (_vcAgendaSelected == null) return;
  if (!confirm(VCi18n.t('agenda.confirmar_excluir'))) return;
  var idx = _vcAgendaSelected;
  var net = window.vettiAPI.network;
  vcToast(VCi18n.t('agenda.excluindo'), 'info', 0, { id: 'agenda-del', persist: true });
  try {
    var r = await net.sendCommand('AGENDA ' + idx + ' Stat:DEL');
    if (r && r.ok) {
      vcToast(VCi18n.t('agenda.excluido'), 'success', 2500, { id: 'agenda-del' });
      var row = document.querySelector('.vc-agenda-row[data-idx="' + idx + '"]');
      if (row) row.remove();
      delete _vcAgendaCache[idx];
      _vcAgendaSelected = null;
      var emptyEl = document.getElementById('vcAgendFormEmpty');
      var formEl  = document.getElementById('vcAgendForm');
      if (emptyEl) emptyEl.classList.remove('d-none');
      if (formEl)  formEl.classList.add('d-none');
    } else {
      vcToast(VCi18n.t('agenda.erro_excluir'), 'error', 4000, { id: 'agenda-del' });
    }
  } catch (e) {
    vcToast(VCi18n.t('agenda.erro_excluir'), 'error', 4000, { id: 'agenda-del' });
  }
}

function _vcAgendaNew() {
  // Procura primeiro slot livre (1..MAX)
  var freeIdx = null;
  for (var i = 1; i <= _VC_AGENDA_MAX; i++) {
    if (!_vcAgendaCache[i] || !/OK/i.test(_vcAgendaCache[i].stat || '')) { freeIdx = i; break; }
  }
  if (freeIdx == null) { vcToast(VCi18n.t('agenda.bd_cheio'), 'error'); return; }
  _vcAgendaSelected = freeIdx;
  var emptyEl = document.getElementById('vcAgendFormEmpty');
  var formEl  = document.getElementById('vcAgendForm');
  if (emptyEl) emptyEl.classList.add('d-none');
  if (formEl)  formEl.classList.remove('d-none');
  var setVal = function (id, v) { var el = document.getElementById(id); if (el) el.value = v; };
  // Defaults espelhando o firmware (mínimo válido em cada campo):
  //   Freq=3 (Semanal) é o caso mais comum no produto
  //   Mes=1, Dia=1, PGM=1 (campos exigem >= 1)
  //   Acao=1 (Armar) é o caso mais comum
  setVal('vcAgendIdx',     String(freeIdx).padStart(2, '0'));
  setVal('vcAgendHora',    '08:00');
  setVal('vcAgendFreq',    '3');
  setVal('vcAgendFeriado', '0');
  setVal('vcAgendMes',     '1');
  setVal('vcAgendDia',     '1');
  setVal('vcAgendAcao',    '1');
  setVal('vcAgendPgm',     '1');
  setVal('vcAgendDesc',    '');
  document.querySelectorAll('.vc-agenda-dds, .vc-agenda-part').forEach(function (b) { b.checked = false; });
  // Aplica visibilidade dinâmica baseada nos defaults.
  _vcAgendaRefreshFieldVisibility();
}


/* ═════════════════════════════════════════════════════════════
   SISTEMA → FERIADOS (aba)
   ═════════════════════════════════════════════════════════════
   CRUD remoto do banco de feriados da central (até 64 slots, dia/mês/
   descrição). Espelha CtrlFeriadoList.kt do Kotlin v3.

   Defaults nacionais vêm de JSONs empacotados (`src/main/data/holidays/`)
   resolvidos via IPC `holidaysDb.*`. Móveis (Páscoa, Carnaval, Corpus,
   etc.) calculados via Meeus pro ano selecionado.
   ═════════════════════════════════════════════════════════════ */

var _VC_FER_MAX = 64;
var _vcFerCache = {};      // idx → { idx, stat, month, day, desc }
var _vcFerSelected = null;
var _vcFerCountriesLoaded = false;

// Remove acentos pra exibição local (já que a central também grava sem).
function _vcFerDeAccent(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function _vcFerParse(body) {
  // Mesmo parser do main (feriado.js parseFeriadoResponse) — duplicado
  // aqui pra não precisar de mais um IPC só pra parsing.
  var s = String(body || '').replace(/^FERIADO\s+/i, '');
  var idxM = /^(\d+)\b/.exec(s);
  if (!idxM) return null;
  function field(re) { var m = re.exec(s); return m ? m[1] : null; }
  var statRaw = field(/\bStat:([A-Za-z]+)/i);
  var mes  = field(/\bMes:(\d+)/i);
  var dia  = field(/\bDia:(\d+)/i);
  var desc = field(/\bDesc:"([^"]*)"/);
  return {
    idx:   parseInt(idxM[1], 10),
    stat:  statRaw ? statRaw.toUpperCase() : null,
    month: mes ? parseInt(mes, 10) : null,
    day:   dia ? parseInt(dia, 10) : null,
    desc:  desc || null
  };
}

async function _vcFerPopulateCountries() {
  if (!window.vettiAPI || !window.vettiAPI.holidaysDb) return;
  var sel = document.getElementById('vcFerPais');
  if (!sel) return;
  try {
    var lst = await window.vettiAPI.holidaysDb.listCountries();
    var lang = (typeof VCi18n !== 'undefined' && VCi18n.lang) ? VCi18n.lang : 'pt-BR';
    var html = '';
    lst.sort(function (a, b) {
      var an = (a.countryName && (a.countryName[lang] || a.countryName['pt-BR'])) || a.code;
      var bn = (b.countryName && (b.countryName[lang] || b.countryName['pt-BR'])) || b.code;
      return an.localeCompare(bn);
    });
    lst.forEach(function (c) {
      var nome = (c.countryName && (c.countryName[lang] || c.countryName['pt-BR'])) || c.code;
      var marker = (c.source === 'user') ? ' ★' : '';
      html += '<option value="' + _vcEscape(c.code) + '">' +
              _vcEscape(nome) + ' (' + c.code + ')' + marker + '</option>';
    });
    sel.innerHTML = html;
    // Default: BR
    if (sel.querySelector('option[value="BR"]')) sel.value = 'BR';
    _vcFerCountriesLoaded = true;
  } catch (_) {}
}

async function _vcFeriadoLoad() {
  var panel = document.getElementById('vcSysFeriados');
  if (!panel) return;
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return;
  panel.dataset.loaded = '1';

  // Combo país + ano default ao ano corrente.
  if (!_vcFerCountriesLoaded) await _vcFerPopulateCountries();
  var anoEl = document.getElementById('vcFerAno');
  if (anoEl && !anoEl.value) anoEl.value = String(new Date().getFullYear());

  _vcFerBindButtons();

  // Varredura serial — mesmo padrão do Kotlin (CtrlFeriadoList.kt:184).
  // Itera 1..64; encerra em ERR 27 (fim do BD) ou Stat:LIV.
  vcToast(VCi18n.t('feriado.carregando') || 'Carregando feriados…', 'info', 0,
          { id: 'fer-load', persist: true });
  _vcFerCache = {};
  var list = document.getElementById('vcFerList');
  if (list) list.innerHTML = '';
  var consecutiveErrors = 0;
  for (var i = 1; i <= _VC_FER_MAX; i++) {
    try {
      var r = await net.sendCommand('FERIADO ' + i);
      if (!r || !r.ok) {
        if (r && r.errorCode === 27) break;
        consecutiveErrors++;
        if (consecutiveErrors >= 3) break;
        continue;
      }
      consecutiveErrors = 0;
      var p = _vcFerParse(r.body);
      if (!p || !p.idx) continue;
      if (p.stat === 'LIV') break;                  // fim natural
      if (p.stat === 'INV' || p.stat === 'DEL') continue;
      _vcFerCache[p.idx] = p;
      _vcFerAppendRow(p);
    } catch (_) {
      consecutiveErrors++; if (consecutiveErrors >= 3) break;
    }
  }
  _vcFerBindListClicks();
  var n = Object.keys(_vcFerCache).length;
  if (n === 0) {
    if (list) list.innerHTML = '<p class="text-muted small m-0 p-2" data-i18n="feriado.lista_vazia">Nenhum feriado cadastrado na central.</p>';
    if (typeof VCi18n !== 'undefined' && VCi18n.apply) VCi18n.apply();
  }
  vcToast(VCi18n.t('feriado.carregado', { n: n }) || ('Carregado: ' + n + ' feriados.'),
          'success', 2500, { id: 'fer-load' });
}

function _vcFerAppendRow(f) {
  var list = document.getElementById('vcFerList');
  if (!list) return;
  // Se ainda tem a mensagem "vazia", remove.
  if (list.querySelector('.text-muted')) list.innerHTML = '';
  var row = document.createElement('div');
  row.className = 'vc-fer-row';
  row.dataset.idx = f.idx;
  var data = String(f.day).padStart(2, '0') + '/' + String(f.month).padStart(2, '0');
  row.innerHTML =
    '<div class="text-end">' + String(f.idx).padStart(2, '0') + '</div>' +
    '<div class="text-end">' + data + '</div>' +
    '<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _vcEscape(f.desc || '---') + '</div>';
  list.appendChild(row);
}

function _vcFerRefreshRow(idx) {
  var row = document.querySelector('.vc-fer-row[data-idx="' + idx + '"]');
  var f = _vcFerCache[idx];
  if (!f) { if (row) row.remove(); return; }
  if (!row) { _vcFerAppendRow(f); return; }
  var data = String(f.day).padStart(2, '0') + '/' + String(f.month).padStart(2, '0');
  row.innerHTML =
    '<div class="text-end">' + String(f.idx).padStart(2, '0') + '</div>' +
    '<div class="text-end">' + data + '</div>' +
    '<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _vcEscape(f.desc || '---') + '</div>';
}

function _vcFerBindListClicks() {
  var list = document.getElementById('vcFerList');
  if (!list || list._vcBound) return;
  list._vcBound = true;
  list.addEventListener('click', function (e) {
    var row = e.target.closest('.vc-fer-row');
    if (!row) return;
    var idx = parseInt(row.dataset.idx, 10);
    if (isNaN(idx)) return;
    list.querySelectorAll('.vc-fer-row').forEach(function (r) { r.classList.remove('selected'); });
    row.classList.add('selected');
    _vcFerSelectItem(idx);
  });
}

function _vcFerSelectItem(idx) {
  var f = _vcFerCache[idx];
  if (!f) return;
  _vcFerSelected = idx;
  document.getElementById('vcFerFormEmpty').classList.add('d-none');
  document.getElementById('vcFerForm').classList.remove('d-none');
  document.getElementById('vcFerSlot').value = String(idx);
  document.getElementById('vcFerDia').value  = String(f.day || '');
  document.getElementById('vcFerMes').value  = String(f.month || '');
  document.getElementById('vcFerDesc').value = f.desc || '';
}

function _vcFerNew() {
  // Encontra o primeiro slot livre (1..64). Os slots ausentes do cache
  // são considerados LIV.
  var freeIdx = null;
  for (var i = 1; i <= _VC_FER_MAX; i++) {
    if (!_vcFerCache[i]) { freeIdx = i; break; }
  }
  if (freeIdx == null) {
    vcToast(VCi18n.t('feriado.bd_cheio') || 'Banco de feriados cheio (64/64).', 'error');
    return;
  }
  _vcFerSelected = freeIdx;
  document.getElementById('vcFerFormEmpty').classList.add('d-none');
  document.getElementById('vcFerForm').classList.remove('d-none');
  document.getElementById('vcFerSlot').value = String(freeIdx);
  document.getElementById('vcFerDia').value  = '';
  document.getElementById('vcFerMes').value  = '';
  document.getElementById('vcFerDesc').value = '';
}

function _vcFerCancel() {
  _vcFerSelected = null;
  document.getElementById('vcFerFormEmpty').classList.remove('d-none');
  document.getElementById('vcFerForm').classList.add('d-none');
  document.querySelectorAll('#vcFerList .vc-fer-row').forEach(function (r) { r.classList.remove('selected'); });
}

function _vcFerValidate(month, day, desc) {
  var m = parseInt(month, 10), d = parseInt(day, 10);
  if (isNaN(m) || m < 1 || m > 12) return { key: 'feriado.mes_invalido' };
  if (isNaN(d) || d < 1 || d > 31) return { key: 'feriado.dia_invalido' };
  // Limites mensais (fev=29 pra cobrir bissexto; usuário cadastra
  // anualmente, central não calcula). Espelha CtrlFeriadoList.kt:296-326.
  var maxDay = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  if (d > maxDay) return { key: 'feriado.dia_invalido_mes', vars: { mes: m, max: maxDay } };
  if (!desc || !String(desc).trim()) return { key: 'feriado.desc_obrigatoria' };
  return null;
}

async function _vcFerSave() {
  if (_vcFerSelected == null) return;
  var net = window.vettiAPI.network;
  var idx = _vcFerSelected;
  var dia = document.getElementById('vcFerDia').value;
  var mes = document.getElementById('vcFerMes').value;
  var desc = document.getElementById('vcFerDesc').value;
  var verr = _vcFerValidate(mes, dia, desc);
  if (verr) {
    vcToast(VCi18n.t(verr.key, verr.vars || {}), 'error', 4000);
    return;
  }
  var descClean = _vcFerDeAccent(desc).slice(0, 40).replace(/"/g, '\\"');
  var cmd = 'FERIADO ' + idx +
            ' Stat:OK Mes:' + parseInt(mes, 10) +
            ' Dia:' + parseInt(dia, 10) +
            ' Desc:"' + descClean + '"';
  vcToast(VCi18n.t('feriado.gravando') || 'Gravando feriado…', 'info', 0, { id: 'fer-save', persist: true });
  try {
    var r = await net.sendCommand(cmd);
    if (r && r.ok) {
      _vcFerCache[idx] = {
        idx: idx, stat: 'OK',
        month: parseInt(mes, 10), day: parseInt(dia, 10),
        desc: _vcFerDeAccent(desc).slice(0, 40)
      };
      _vcFerRefreshRow(idx);
      vcToast(VCi18n.t('feriado.gravado') || 'Feriado gravado.', 'success', 2500, { id: 'fer-save' });
      _vcFerCancel();
    } else {
      vcToast(VCi18n.t('feriado.erro_gravar') || 'Falha ao gravar.', 'error', 4000, { id: 'fer-save' });
    }
  } catch (e) {
    vcToast(VCi18n.t('feriado.erro_gravar') || 'Falha ao gravar.', 'error', 4000, { id: 'fer-save' });
  }
}

async function _vcFerDelete() {
  if (_vcFerSelected == null) return;
  var idx = _vcFerSelected;
  var ok = await vcConfirm({
    title:      VCi18n.t('feriado.excluir_titulo')   || 'Excluir feriado?',
    message:    VCi18n.t('feriado.confirmar_excluir') || 'Remover este feriado do banco da central?',
    subMessage: VCi18n.t('common.atencao_irreversivel') || 'Atenção: esta operação não poderá ser desfeita.',
    okLabel:    VCi18n.t('feriado.excluir')           || 'Excluir',
    danger:     true
  });
  if (!ok) return;
  var net = window.vettiAPI.network;
  vcToast(VCi18n.t('feriado.excluindo') || 'Excluindo feriado…', 'info', 0, { id: 'fer-del', persist: true });
  try {
    var r = await net.sendCommand('FERIADO ' + idx + ' Stat:DEL');
    if (r && r.ok) {
      delete _vcFerCache[idx];
      var row = document.querySelector('.vc-fer-row[data-idx="' + idx + '"]');
      if (row) row.remove();
      vcToast(VCi18n.t('feriado.excluido') || 'Feriado excluído.', 'success', 2500, { id: 'fer-del' });
      _vcFerCancel();
    } else {
      vcToast(VCi18n.t('feriado.erro_excluir') || 'Falha ao excluir.', 'error', 4000, { id: 'fer-del' });
    }
  } catch (e) {
    vcToast(VCi18n.t('feriado.erro_excluir') || 'Falha ao excluir.', 'error', 4000, { id: 'fer-del' });
  }
}

/* ─── Cadastro em massa (defaults nacionais + móveis) ─────────────────
   Dedup por dia/mês: se já houver registro na central com a mesma
   data, sobrescreve só a descrição (não duplica). Caso contrário,
   ocupa o próximo slot livre. */
async function _vcFerCadastrarNacionais() {
  var net = window.vettiAPI.network;
  var code = document.getElementById('vcFerPais').value;
  var ano  = parseInt(document.getElementById('vcFerAno').value, 10) || new Date().getFullYear();
  if (!code || code === '__new__') {
    vcToast(VCi18n.t('feriado.escolha_pais') || 'Selecione um país.', 'warn');
    return;
  }
  var lang = (typeof VCi18n !== 'undefined' && VCi18n.lang) ? VCi18n.lang : 'pt-BR';
  var resolved;
  try {
    resolved = await window.vettiAPI.holidaysDb.resolveCountryHolidays(code, ano, lang);
  } catch (err) {
    vcToast((err && err.message) || 'Erro', 'warn'); return;
  }
  var items = resolved.items || [];
  if (items.length === 0) {
    vcToast(VCi18n.t('feriado.nada_resolver') || 'Sem feriados a gravar.', 'warn'); return;
  }

  // Indexa o cache por "mes/dia" pra detectar duplicidade.
  var byDate = {};
  Object.keys(_vcFerCache).forEach(function (slot) {
    var c = _vcFerCache[slot];
    if (c && c.month && c.day) byDate[c.month + '/' + c.day] = parseInt(slot, 10);
  });

  // Separa itens em 2 listas: os que vão sobrescrever (mesma data já existe)
  // e os que precisam de slot novo.
  var toUpdate = [];   // [{slot, item}]
  var toCreate = [];   // [item]
  items.forEach(function (it) {
    var existing = byDate[it.month + '/' + it.day];
    if (existing) toUpdate.push({ slot: existing, item: it });
    else          toCreate.push(it);
  });

  // Slots livres pra os novos.
  var freeSlots = [];
  for (var i = 1; i <= _VC_FER_MAX; i++) if (!_vcFerCache[i]) freeSlots.push(i);

  if (toCreate.length > freeSlots.length) {
    var msg = VCi18n.t('feriado.poucos_slots', { livres: freeSlots.length, total: toCreate.length })
              || ('Só há ' + freeSlots.length + ' slots livres pra ' + toCreate.length +
                  ' novos feriados (' + toUpdate.length + ' serão só atualizados). Cadastrar parcialmente?');
    var go = await vcConfirm({
      title: VCi18n.t('feriado.poucos_slots_titulo') || 'Slots insuficientes',
      message: msg, danger: false
    });
    if (!go) return;
  }

  var okN = 0, errN = 0, updN = 0;
  var total = toUpdate.length + Math.min(toCreate.length, freeSlots.length);
  vcToast(VCi18n.t('feriado.massa_gravando', { n: total }) || 'Gravando…',
          'info', 0, { id: 'fer-mass', persist: true });

  async function _writeOne(slot, item) {
    var descClean = _vcFerDeAccent(item.name).slice(0, 40).replace(/"/g, '\\"');
    var cmd = 'FERIADO ' + slot +
              ' Stat:OK Mes:' + item.month + ' Dia:' + item.day +
              ' Desc:"' + descClean + '"';
    var r = await net.sendCommand(cmd);
    if (r && r.ok) {
      _vcFerCache[slot] = {
        idx: slot, stat: 'OK', month: item.month, day: item.day,
        desc: _vcFerDeAccent(item.name).slice(0, 40)
      };
      _vcFerRefreshRow(slot);
      return true;
    }
    return false;
  }

  // 1) Atualiza descrição dos que já existem na mesma data.
  for (var u = 0; u < toUpdate.length; u++) {
    try {
      if (await _writeOne(toUpdate[u].slot, toUpdate[u].item)) { okN++; updN++; }
      else errN++;
    } catch (_) { errN++; }
  }
  // 2) Cria os novos em slots livres.
  for (var c = 0; c < toCreate.length && c < freeSlots.length; c++) {
    try {
      if (await _writeOne(freeSlots[c], toCreate[c])) okN++;
      else errN++;
    } catch (_) { errN++; }
  }

  var resultKey = (updN > 0) ? 'feriado.massa_resultado_dedup' : 'feriado.massa_resultado';
  vcToast(VCi18n.t(resultKey, { ok: okN, err: errN, upd: updN })
          || ('Cadastrados: ' + okN + ' OK, ' + errN + ' falhas' +
              (updN > 0 ? ' (' + updN + ' atualizados)' : '') + '.'),
          errN > 0 ? 'warn' : 'success', 5000, { id: 'fer-mass' });
}

async function _vcFerAtualizarMoveis() {
  var net = window.vettiAPI.network;
  var code = document.getElementById('vcFerPais').value;
  var ano  = parseInt(document.getElementById('vcFerAno').value, 10) || new Date().getFullYear();
  if (!code || code === '__new__') {
    vcToast(VCi18n.t('feriado.escolha_pais') || 'Selecione um país.', 'warn');
    return;
  }
  var lang = (typeof VCi18n !== 'undefined' && VCi18n.lang) ? VCi18n.lang : 'pt-BR';
  var resolved;
  try {
    resolved = await window.vettiAPI.holidaysDb.resolveCountryHolidays(code, ano, lang);
  } catch (err) {
    vcToast((err && err.message) || 'Erro', 'warn'); return;
  }
  var moveis = (resolved.items || []).filter(function (h) { return !!h.mobile; });
  if (moveis.length === 0) {
    vcToast(VCi18n.t('feriado.nada_moveis') || 'Nenhum feriado móvel pra este país.', 'info', 3000);
    return;
  }

  // Pra cada móvel, procura o slot existente pelo nome normalizado;
  // se encontrar, sobrescreve com a nova data; se não, usa próximo livre.
  var okN = 0, errN = 0;
  vcToast(VCi18n.t('feriado.moveis_gravando', { n: moveis.length, ano: ano })
          || ('Atualizando ' + moveis.length + ' móveis pra ' + ano + '…'),
          'info', 0, { id: 'fer-mass', persist: true });

  function normalize(s) {
    return _vcFerDeAccent(String(s || '')).toLowerCase().replace(/\s+/g, ' ').trim();
  }
  // Indexa o cache por descrição normalizada → slot.
  var byDesc = {};
  Object.keys(_vcFerCache).forEach(function (slot) {
    byDesc[normalize(_vcFerCache[slot].desc)] = parseInt(slot, 10);
  });

  for (var i = 0; i < moveis.length; i++) {
    var m = moveis[i];
    var key = normalize(m.name);
    var slot = byDesc[key];
    if (!slot) {
      // Procura primeiro slot livre
      for (var s = 1; s <= _VC_FER_MAX; s++) { if (!_vcFerCache[s]) { slot = s; break; } }
      if (!slot) { errN++; continue; }
    }
    var descClean = _vcFerDeAccent(m.name).slice(0, 40).replace(/"/g, '\\"');
    var cmd = 'FERIADO ' + slot +
              ' Stat:OK Mes:' + m.month + ' Dia:' + m.day +
              ' Desc:"' + descClean + '"';
    try {
      var r = await net.sendCommand(cmd);
      if (r && r.ok) {
        _vcFerCache[slot] = {
          idx: slot, stat: 'OK', month: m.month, day: m.day,
          desc: _vcFerDeAccent(m.name).slice(0, 40)
        };
        byDesc[key] = slot;
        _vcFerRefreshRow(slot);
        okN++;
      } else { errN++; }
    } catch (_) { errN++; }
  }
  vcToast(VCi18n.t('feriado.moveis_resultado', { ok: okN, err: errN, ano: ano })
          || ('Móveis atualizados pra ' + ano + ': ' + okN + ' OK, ' + errN + ' falhas.'),
          errN > 0 ? 'warn' : 'success', 5000, { id: 'fer-mass' });
}

/* ─── Fase 2A: Gerenciar feriados do país (overlay local) ──────────── */

// Estado em memória do modal "Gerenciar" pra evitar idas repetidas ao IPC.
var _vcFerGerenciarItems = [];   // lista mesclada (defaults + customs)
var _vcFerGerenciarCode  = null; // país atualmente exibido no modal

async function _vcFerOpenGerenciar() {
  var code = (document.getElementById('vcFerPais') || {}).value || 'BR';
  if (code === '__new__') code = 'BR';
  _vcFerGerenciarCode = code;
  await _vcFerGerenciarReload();
  _vcFerGerenciarRender();
}

async function _vcFerGerenciarReload() {
  if (!window.vettiAPI || !window.vettiAPI.holidaysDb) return;
  try {
    _vcFerGerenciarItems = await window.vettiAPI.holidaysDb.listMergedHolidays(_vcFerGerenciarCode);
  } catch (err) {
    _vcFerGerenciarItems = [];
    vcToast((err && err.message) || 'Erro', 'warn');
  }
}

function _vcFerGerenciarRender() {
  // Constrói/atualiza o modal in-page. O modal vive em #vcFerModalHost,
  // criado on-demand. Fecha clicando fora ou no X.
  var host = document.getElementById('vcFerModalHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'vcFerModalHost';
    document.body.appendChild(host);
  }
  var lang = (typeof VCi18n !== 'undefined' && VCi18n.lang) ? VCi18n.lang : 'pt-BR';
  var rows = _vcFerGerenciarItems.map(function (h, i) {
    var name = (h.name && (h.name[lang] || h.name['pt-BR'] || h.name['en'])) || h.id;
    var date = '';
    if (h.month && h.day) {
      date = String(h.day).padStart(2, '0') + '/' + String(h.month).padStart(2, '0');
    } else if (h.mobile) {
      date = '⟳ ' + h.mobile;
    }
    var typeBadgeKey = 'feriado.tipo_' + (h.type || 'national');
    var scope = h.scope ? (' · ' + _vcEscape(h.scope)) : '';
    return '<div class="vc-fer-mng-row" data-i="' + i + '" data-default="' + (h._default ? '1' : '0') + '">' +
      '<label class="vc-fer-mng-active">' +
        '<input type="checkbox" class="vc-fer-mng-cb" ' + (h._active ? 'checked' : '') + '>' +
      '</label>' +
      '<div class="vc-fer-mng-date">' + _vcEscape(date) + '</div>' +
      '<div class="vc-fer-mng-name">' + _vcEscape(name) +
        ' <span class="vc-fer-mng-type" data-i18n="' + typeBadgeKey + '">' + (h.type || 'national') + '</span>' +
        scope +
      '</div>' +
      '<div class="vc-fer-mng-actions">' +
        (!h._default
          ? '<button class="vc-btn sm outline" data-act="edit" type="button"><i class="bi bi-pencil"></i></button>' +
            '<button class="vc-btn sm danger" data-act="delete" type="button"><i class="bi bi-trash3"></i></button>'
          : '') +
      '</div>' +
    '</div>';
  }).join('');

  var headerTitle = VCi18n.t('feriado.gerenciar_titulo', { pais: _vcFerGerenciarCode })
                    || ('Gerenciar feriados — ' + _vcFerGerenciarCode);

  host.innerHTML =
    '<div class="vc-fer-modal-backdrop" id="vcFerModalBackdrop">' +
      '<div class="vc-fer-modal" role="dialog" aria-modal="true">' +
        '<div class="vc-fer-modal-header">' +
          '<span>' + _vcEscape(headerTitle) + '</span>' +
          '<button class="vc-btn sm outline" type="button" id="vcFerMngClose"><i class="bi bi-x-lg"></i></button>' +
        '</div>' +
        '<div class="vc-fer-modal-toolbar">' +
          '<button class="vc-btn sm" type="button" id="vcFerMngAdd">' +
            '<i class="bi bi-plus-lg"></i> <span data-i18n="feriado.add_local">Adicionar feriado local</span>' +
          '</button>' +
          '<span class="text-muted small ms-2" data-i18n="feriado.gerenciar_dica">' +
            'Desmarque o checkbox pra ignorar um feriado nacional. Customs podem ser editados/excluídos.</span>' +
        '</div>' +
        '<div class="vc-fer-modal-body" id="vcFerMngList">' + rows + '</div>' +
        '<div class="vc-fer-modal-footer">' +
          '<button class="vc-btn outline" type="button" id="vcFerMngCancel" data-i18n="common.cancel">Cancelar</button>' +
          '<button class="vc-btn" type="button" id="vcFerMngSave" data-i18n="common.save">Gravar</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  if (typeof VCi18n !== 'undefined' && VCi18n.apply) VCi18n.apply();

  // Bind dos botões do modal
  document.getElementById('vcFerMngClose').onclick  = _vcFerCloseModal;
  document.getElementById('vcFerMngCancel').onclick = _vcFerCloseModal;
  document.getElementById('vcFerMngAdd').onclick    = function () { _vcFerEditLocal(null); };
  document.getElementById('vcFerMngSave').onclick   = _vcFerGerenciarSave;
  document.getElementById('vcFerModalBackdrop').addEventListener('click', function (e) {
    if (e.target.id === 'vcFerModalBackdrop') _vcFerCloseModal();
  });

  // Bind dos botões edit/delete por linha + checkboxes
  document.querySelectorAll('#vcFerMngList .vc-fer-mng-row').forEach(function (row) {
    var i = parseInt(row.dataset.i, 10);
    var cb = row.querySelector('.vc-fer-mng-cb');
    if (cb) cb.onchange = function () { _vcFerGerenciarItems[i]._active = cb.checked; };
    var btnEdit = row.querySelector('[data-act="edit"]');
    var btnDel  = row.querySelector('[data-act="delete"]');
    if (btnEdit) btnEdit.onclick = function () { _vcFerEditLocal(i); };
    if (btnDel)  btnDel.onclick  = function () {
      _vcFerGerenciarItems.splice(i, 1);
      _vcFerGerenciarRender();
    };
  });
}

function _vcFerCloseModal() {
  var host = document.getElementById('vcFerModalHost');
  if (host) host.innerHTML = '';
}

// Form de edição/criação de feriado local. Reabre o modal principal
// quando salva/cancela. `idx` = null → novo; senão índice em _vcFerGerenciarItems.
function _vcFerEditLocal(idx) {
  var isNew = (idx === null);
  var item = isNew
    ? { id: 'user-' + _vcFerGerenciarCode.toLowerCase() + '-' + Date.now(),
        name: { 'pt-BR': '', 'en': '', 'es-LA': '' },
        month: '', day: '', type: 'state', scope: '', _default: false, _active: true }
    : _vcFerGerenciarItems[idx];

  // Reaproveita o modal — substitui o conteúdo com o form.
  var host = document.getElementById('vcFerModalHost');
  if (!host) return;
  var lang = (typeof VCi18n !== 'undefined' && VCi18n.lang) ? VCi18n.lang : 'pt-BR';
  var nameVal = (item.name && (item.name[lang] || item.name['pt-BR'])) || '';

  host.innerHTML =
    '<div class="vc-fer-modal-backdrop" id="vcFerModalBackdrop">' +
      '<div class="vc-fer-modal" role="dialog" aria-modal="true" style="max-width:500px;">' +
        '<div class="vc-fer-modal-header">' +
          '<span data-i18n="' + (isNew ? 'feriado.add_local' : 'feriado.editar_local') + '">' +
            (isNew ? 'Adicionar feriado local' : 'Editar feriado local') + '</span>' +
          '<button class="vc-btn sm outline" type="button" id="vcFerMngClose"><i class="bi bi-x-lg"></i></button>' +
        '</div>' +
        '<div class="vc-fer-modal-body" style="padding:18px;">' +
          '<div class="row g-2">' +
            '<div class="col-12">' +
              '<label class="vc-label-sm" data-i18n="feriado.nome">Nome:</label>' +
              '<input class="vc-input" id="vcFerEdNome" type="text" maxlength="40" value="' + _vcEscape(nameVal) + '">' +
            '</div>' +
            '<div class="col-6">' +
              '<label class="vc-label-sm" data-i18n="feriado.dia">Dia:</label>' +
              '<input class="vc-input" id="vcFerEdDia" type="number" min="1" max="31" value="' + (item.day || '') + '">' +
            '</div>' +
            '<div class="col-6">' +
              '<label class="vc-label-sm" data-i18n="feriado.mes">Mês:</label>' +
              '<input class="vc-input" id="vcFerEdMes" type="number" min="1" max="12" value="' + (item.month || '') + '">' +
            '</div>' +
            '<div class="col-6">' +
              '<label class="vc-label-sm" data-i18n="feriado.tipo">Tipo:</label>' +
              '<select class="vc-input" id="vcFerEdTipo">' +
                '<option value="national" ' + (item.type === 'national' ? 'selected' : '') + ' data-i18n="feriado.tipo_national">Nacional</option>' +
                '<option value="state"    ' + (item.type === 'state'    ? 'selected' : '') + ' data-i18n="feriado.tipo_state">Estadual</option>' +
                '<option value="municipal"' + (item.type === 'municipal'? 'selected' : '') + ' data-i18n="feriado.tipo_municipal">Municipal</option>' +
              '</select>' +
            '</div>' +
            '<div class="col-6">' +
              '<label class="vc-label-sm" data-i18n="feriado.scope">Escopo (UF/cidade):</label>' +
              '<input class="vc-input" id="vcFerEdScope" type="text" maxlength="30" value="' + _vcEscape(item.scope || '') + '"' +
                ' data-i18n-placeholder="feriado.scope_placeholder" placeholder="Ex.: SP, Campinas, DF">' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="vc-fer-modal-footer">' +
          '<button class="vc-btn outline" type="button" id="vcFerEdCancel" data-i18n="common.cancel">Cancelar</button>' +
          '<button class="vc-btn" type="button" id="vcFerEdSave" data-i18n="common.save">Gravar</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  if (typeof VCi18n !== 'undefined' && VCi18n.apply) VCi18n.apply();

  document.getElementById('vcFerMngClose').onclick   = _vcFerCloseModal;
  document.getElementById('vcFerEdCancel').onclick   = _vcFerGerenciarRender;
  document.getElementById('vcFerEdSave').onclick     = function () {
    var nome  = document.getElementById('vcFerEdNome').value.trim();
    var dia   = parseInt(document.getElementById('vcFerEdDia').value, 10);
    var mes   = parseInt(document.getElementById('vcFerEdMes').value, 10);
    var tipo  = document.getElementById('vcFerEdTipo').value;
    var scope = document.getElementById('vcFerEdScope').value.trim();

    var verr = _vcFerValidate(mes, dia, nome);
    if (verr) {
      vcToast(VCi18n.t(verr.key, verr.vars || {}), 'error', 4000);
      return;
    }
    item.name  = { 'pt-BR': nome, 'en': nome, 'es-LA': nome };
    item.month = mes;
    item.day   = dia;
    item.type  = tipo;
    item.scope = scope;
    if (isNew) _vcFerGerenciarItems.push(item);
    _vcFerGerenciarRender();
  };
}

/* ─── Fase 2B: "Novo país" via Nager.Date ─────────────────────────── */

async function _vcFerOpenNovoPais() {
  var host = document.getElementById('vcFerModalHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'vcFerModalHost';
    document.body.appendChild(host);
  }
  host.innerHTML =
    '<div class="vc-fer-modal-backdrop" id="vcFerModalBackdrop">' +
      '<div class="vc-fer-modal" role="dialog" aria-modal="true" style="max-width:560px;">' +
        '<div class="vc-fer-modal-header">' +
          '<span data-i18n="feriado.novo_pais_titulo">Importar país via internet</span>' +
          '<button class="vc-btn sm outline" type="button" id="vcFerMngClose"><i class="bi bi-x-lg"></i></button>' +
        '</div>' +
        '<div class="vc-fer-modal-body" style="padding:18px;">' +
          '<p class="vc-help small mb-3" data-i18n="feriado.novo_pais_aviso">' +
            'Esta opção baixa os feriados nacionais de um país via API pública Nager.Date. ' +
            'Precisa de conexão com a internet. Apenas feriados fixos são importados — móveis serão calculados localmente.' +
          '</p>' +
          '<div class="row g-2 align-items-end mb-2">' +
            '<div class="col-8">' +
              '<label class="vc-label-sm" data-i18n="feriado.pais">País:</label>' +
              '<select class="vc-input" id="vcFerNpSelect"><option value="" data-i18n="feriado.carregando_lista">Carregando lista…</option></select>' +
            '</div>' +
            '<div class="col-4">' +
              '<label class="vc-label-sm" data-i18n="feriado.ano">Ano:</label>' +
              '<input class="vc-input" type="number" min="2000" max="2099" id="vcFerNpAno" value="' + new Date().getFullYear() + '">' +
            '</div>' +
          '</div>' +
          '<div id="vcFerNpStatus" class="text-muted small"></div>' +
        '</div>' +
        '<div class="vc-fer-modal-footer">' +
          '<button class="vc-btn outline" type="button" id="vcFerNpCancel" data-i18n="common.cancel">Cancelar</button>' +
          '<button class="vc-btn"         type="button" id="vcFerNpImport" data-i18n="feriado.importar_pais">Importar</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  if (typeof VCi18n !== 'undefined' && VCi18n.apply) VCi18n.apply();

  document.getElementById('vcFerMngClose').onclick = _vcFerCloseModal;
  document.getElementById('vcFerNpCancel').onclick = _vcFerCloseModal;
  document.getElementById('vcFerNpImport').onclick = _vcFerNpImport;

  // Carrega lista de países disponíveis
  await _vcFerNpLoadCountriesList();
}

async function _vcFerNpLoadCountriesList() {
  // O fetch externo precisa rodar no main (Electron.net.fetch ignora o
  // CSP `default-src 'self'` do renderer). IPC: holidaysDb.nagerListCountries.
  var sel = document.getElementById('vcFerNpSelect');
  var status = document.getElementById('vcFerNpStatus');
  if (!sel || !status) return;
  status.textContent = VCi18n.t('feriado.np_carregando_paises') || 'Carregando lista de países disponíveis…';
  try {
    var arr = await window.vettiAPI.holidaysDb.nagerListCountries();
    if (!Array.isArray(arr)) throw new Error('Resposta inválida.');
    arr.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    var html = '<option value="">' + _vcEscape(VCi18n.t('feriado.np_escolha_pais') || '— Selecione um país —') + '</option>';
    arr.forEach(function (c) {
      html += '<option value="' + _vcEscape(c.countryCode) + '">' +
              _vcEscape(c.name + ' (' + c.countryCode + ')') + '</option>';
    });
    sel.innerHTML = html;
    status.textContent = VCi18n.t('feriado.np_paises_carregados', { n: arr.length })
                         || (arr.length + ' países disponíveis. Selecione um e clique em Importar.');
  } catch (err) {
    status.textContent = (VCi18n.t('feriado.np_falha_lista') ||
                          'Falha ao carregar lista. Verifique a conexão com a internet.') +
                          ' (' + (err && err.message || 'erro') + ')';
    sel.innerHTML = '<option value="" data-i18n="feriado.np_offline">Offline</option>';
  }
}

async function _vcFerNpImport() {
  // Fetch + parse + grava acontecem em uma única chamada no main, pra
  // evitar 2 round-trips IPC e também o CSP do renderer.
  var sel    = document.getElementById('vcFerNpSelect');
  var anoEl  = document.getElementById('vcFerNpAno');
  var status = document.getElementById('vcFerNpStatus');
  var code = (sel && sel.value || '').toUpperCase();
  var ano  = parseInt(anoEl && anoEl.value, 10) || new Date().getFullYear();
  if (!code) {
    vcToast(VCi18n.t('feriado.np_escolha_pais') || 'Selecione um país.', 'warn');
    return;
  }
  status.textContent = VCi18n.t('feriado.np_baixando', { code: code, ano: ano })
                       || ('Baixando feriados de ' + code + ' (' + ano + ')…');
  // Resolve nome do país (do combo) pra passar como override.
  var countryName = code;
  try {
    var optSel = sel.options[sel.selectedIndex];
    if (optSel && optSel.text) countryName = optSel.text.replace(/\s*\([A-Z]{2}\)$/, '');
  } catch (_) {}
  try {
    var r = await window.vettiAPI.holidaysDb.nagerImport(code, ano, {
      countryName: { 'pt-BR': countryName, 'en': countryName, 'es-LA': countryName }
    });
    if (r && r.ok) {
      vcToast(VCi18n.t('feriado.np_importado', { code: code, n: r.count })
              || ('País ' + code + ' importado (' + r.count + ' feriados).'),
              'success', 4000);
      _vcFerCloseModal();
      // Recarrega combo de países pra incluir o novo + seleciona ele
      _vcFerCountriesLoaded = false;
      await _vcFerPopulateCountries();
      var combo = document.getElementById('vcFerPais');
      if (combo) combo.value = code;
    } else {
      status.textContent = VCi18n.t('feriado.np_falha_import') || 'Falha ao importar.';
    }
  } catch (err) {
    status.textContent = (VCi18n.t('feriado.np_falha_baixar') ||
                          'Falha ao baixar feriados. Verifique a internet.') +
                          ' (' + (err && err.message || 'erro') + ')';
  }
}

async function _vcFerGerenciarSave() {
  if (!window.vettiAPI || !window.vettiAPI.holidaysDb) return;
  // Defaults DESativados → vão pra deletedIds.
  // Customs (não-default) → vão pra custom array.
  var deletedIds = [];
  var custom = [];
  _vcFerGerenciarItems.forEach(function (h) {
    if (h._default) {
      if (!h._active) deletedIds.push(h.id);
    } else {
      // Mantém só campos persistíveis (remove _default/_active).
      custom.push({
        id:    h.id,
        name:  h.name,
        month: h.month, day: h.day,
        mobile: h.mobile || null,
        type:  h.type  || 'state',
        scope: h.scope || ''
      });
    }
  });
  try {
    await window.vettiAPI.holidaysDb.setUserOverlay(_vcFerGerenciarCode, {
      deletedIds: deletedIds, custom: custom
    });
    vcToast(VCi18n.t('feriado.gerenciar_salvo') || 'Customização salva.', 'success', 2500);
    _vcFerCloseModal();
  } catch (err) {
    vcToast((err && err.message) || 'Erro ao salvar.', 'warn');
  }
}

async function _vcFerLimparTudo() {
  var n = Object.keys(_vcFerCache).length;
  if (n === 0) {
    vcToast(VCi18n.t('feriado.nada_a_limpar') || 'Banco da central já está vazio.', 'info', 3000);
    return;
  }
  var ok = await vcConfirm({
    title:      VCi18n.t('feriado.limpar_titulo')    || 'Limpar todos os feriados?',
    message:    VCi18n.t('feriado.limpar_confirmar', { n: n })
                || ('Excluir os ' + n + ' feriados cadastrados na central?'),
    subMessage: VCi18n.t('common.atencao_irreversivel') || 'Atenção: esta operação não poderá ser desfeita.',
    okLabel:    VCi18n.t('feriado.limpar')           || 'Limpar central',
    danger:     true
  });
  if (!ok) return;
  var net = window.vettiAPI.network;
  vcToast(VCi18n.t('feriado.limpando', { n: n }) || ('Limpando ' + n + ' slots…'),
          'info', 0, { id: 'fer-clear', persist: true });
  var okN = 0, errN = 0;
  var slots = Object.keys(_vcFerCache).map(Number).sort(function (a, b) { return a - b; });
  for (var i = 0; i < slots.length; i++) {
    var idx = slots[i];
    try {
      var r = await net.sendCommand('FERIADO ' + idx + ' Stat:DEL');
      if (r && r.ok) {
        delete _vcFerCache[idx];
        var row = document.querySelector('.vc-fer-row[data-idx="' + idx + '"]');
        if (row) row.remove();
        okN++;
      } else { errN++; }
    } catch (_) { errN++; }
  }
  _vcFerCancel();
  vcToast(VCi18n.t('feriado.limpo_resultado', { ok: okN, err: errN })
          || ('Limpeza concluída: ' + okN + ' OK, ' + errN + ' falhas.'),
          errN > 0 ? 'warn' : 'success', 4000, { id: 'fer-clear' });
  // Re-renderiza empty state se zerou
  if (Object.keys(_vcFerCache).length === 0) {
    var list = document.getElementById('vcFerList');
    if (list) list.innerHTML = '<p class="text-muted small m-0 p-2" data-i18n="feriado.lista_vazia">Nenhum feriado cadastrado na central.</p>';
    if (typeof VCi18n !== 'undefined' && VCi18n.apply) VCi18n.apply();
  }
}

function _vcFerBindButtons() {
  function bind(id, fn) {
    var el = document.getElementById(id);
    if (el && !el._vcBound) {
      el._vcBound = true;
      el.addEventListener('click', function (e) { e.preventDefault(); fn(); });
    }
  }
  bind('vcFerBtnNovo',                _vcFerNew);
  bind('vcFerBtnCarregar',            _vcFeriadoLoad);
  bind('vcFerBtnLimpar',              _vcFerLimparTudo);
  bind('vcFerBtnSalvar',              _vcFerSave);
  bind('vcFerBtnExcluir',             _vcFerDelete);
  bind('vcFerBtnCancelar',            _vcFerCancel);
  bind('vcFerBtnCadastrarNacionais',  _vcFerCadastrarNacionais);
  bind('vcFerBtnAtualizarMoveis',     _vcFerAtualizarMoveis);
  bind('vcFerBtnGerenciarPais',       _vcFerOpenGerenciar);
  bind('vcFerBtnNovoPais',            _vcFerOpenNovoPais);
}


/* ═════════════════════════════════════════════════════════════
   SISTEMA → BUFFER (aba)
   Comando LOG <N> retorna ERR 8 na central V0.1.0 testada.
   Java usa LOGX STAT para firmware >= x54 e LOG <N> legacy nos
   demais. Aqui tentamos primeiro LOGX STAT e caímos para LOG <N>;
   se ambos falharem, marcamos a UI como indisponível.
   ═════════════════════════════════════════════════════════════ */
/* ═════════════════════════════════════════════════════════════
   SISTEMA → BUFFER (aba) — implementação V2 (2026-05-19)
   ═════════════════════════════════════════════════════════════
   Espelha CtrlLog.kt do Kotlin v3:
     • LOGX STAT  — preenche TOT/USO/PEND no header.
     • LOGX NEW/OLD <n>  — leitura paginada (32 chars/registro,
       binário hex compactado, separados por espaço, fim em
       0xFFFFFFFF).
     • Loop iterativo: a cada resposta com N registros, dispara
       LOGX NEW/OLD <N+1> até atingir o fim ou a qtde solicitada.
     • Gate de versão: mod≥7 ou mod=5&ver≥554 ou mod=6&ver≥654.

   Limitação consciente: firmware antigo (LOG <n> sem envelope
   [R<seq>]) NÃO é suportado nesta v2 — assunto do produto novo
   ser apenas M4 (ver docs/backlog.md). Em FW antigo, toast informa.
   ═════════════════════════════════════════════════════════════ */

var _vcBufferRows = [];   // array completo de eventos parseados (estado vivo)
var _vcBufferFilter = {   // estado do filtro aplicado; null em cada campo = "todos"
  severity:  'all',       // all | danger | warn | arme | info | success
  partition: 'all',       // all | 1..6
  text:      '',          // substring case-insensitive em desc
  dateFrom:  '',          // yyyy-mm-dd
  dateTo:    ''           // yyyy-mm-dd
};

function _vcScanApplyBufferEvent(rec) {
  if (!rec) return;
  var code = rec.eventInt & 0x0FFF;
  if (code !== 0x0147) return;
  var restored = (rec.eventInt & 0x2000) !== 0;
  _vcScanStateMarkAbsentByZone(rec.zone, !restored);
  _vcSaveScanCache();
}

async function _vcBufferLoad() {
  var panel = document.getElementById('vcSysBuffer');
  if (!panel) return;
  panel.dataset.loaded = '1';
  _vcBufferBindButtons();
  // Carrega só o STAT no boot da aba; eventos vêm via clique "Carregar".
  _vcBufferStat();
  vcToast(VCi18n.t('common.loaded_tab', { tab: 'Buffer' }), 'success', 2500,
          { id: 'load-panel-vcSysBuffer' });
}

function _vcBufferBindButtons() {
  function bind(id, fn) {
    var el = document.getElementById(id);
    if (el && !el._vcBound) {
      el._vcBound = true;
      el.addEventListener('click', function (e) { e.preventDefault(); fn(); });
    }
  }
  bind('vcBufferBtnCarregar',  _vcBufferFetch);
  bind('vcBufferBtnExportPdf', function () { _vcBufferExport('pdf'); });
  bind('vcBufferBtnExportCsv', function () { _vcBufferExport('csv'); });
  bind('vcBufferBtnFiltro',    _vcBufferOpenFilterPopover);
}

function _vcBufferFwSupported() {
  // flagCentralVx54: mod=5&ver≥554 ou mod=6&ver≥654 ou mod≥7.
  var mod = _vcCentralMod || 0;
  var ver = _vcCentralVer || 0;
  return (mod === 5 && ver >= 554) || (mod === 6 && ver >= 654) || (mod >= 7);
}

async function _vcBufferStat() {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return;
  if (!_vcBufferFwSupported()) {
    // Mostra mensagem clara, sem tentar comando que vai falhar.
    var list = document.getElementById('vcBufferList');
    if (list) list.innerHTML = '<p class="text-muted small m-0 p-3">' +
      _vcEscape(VCi18n.t('buffer.fw_nao_suporta') || 'Firmware desta central não suporta LOGX.') + '</p>';
    return;
  }
  try {
    var r = await net.sendCommand('LOGX STAT');
    if (r && r.ok) {
      // Resposta real (confirmado em hardware): "LOGX STAT Tot=1024 Uso=880 Pend=0"
      // Case-insensitive — Kotlin docstring usa UPPERCASE mas a central
      // retorna Title Case.
      var tot  = /\bTot=(\d+)/i.exec(r.body || '');
      var uso  = /\bUso=(\d+)/i.exec(r.body || '');
      var pend = /\bPend=(\d+)/i.exec(r.body || '');
      if (tot)  document.getElementById('vcBufferMax').textContent = tot[1];
      if (uso)  document.getElementById('vcBufferArm').textContent = uso[1];
      if (pend) document.getElementById('vcBufferNE').textContent  = pend[1];
    }
  } catch (_) {}
}

async function _vcBufferFetch() {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return;
  if (!_vcBufferFwSupported()) {
    vcToast(VCi18n.t('buffer.fw_nao_suporta') || 'Firmware desta central não suporta LOGX.',
            'warn', 4000, { id: 'buffer-load' });
    return;
  }

  var modo   = (document.querySelector('input[name="vcBufferModo"]:checked') || {}).value || 'todos';
  var ordem  = (document.querySelector('input[name="vcBufferOrdem"]:checked') || {}).value || 'new';
  var qtdeMax = parseInt((document.getElementById('vcBufferQtde') || {}).value, 10) || 100;
  var limit   = modo === 'apenas' ? Math.max(1, Math.min(1024, qtdeMax)) : 1024;
  var verb    = ordem === 'old' ? 'OLD' : 'NEW';
  var list    = document.getElementById('vcBufferList');
  if (!list) return;
  list.innerHTML = '';
  _vcBufferRows = [];
  vcToast(VCi18n.t('buffer.carregando') || 'Carregando…', 'info', 0,
          { id: 'buffer-load', persist: true });

  // Atualiza STAT — AWAIT pra não competir com o loop pela mesma sessão
  // UDP (sendCommand serializa, mas chamar sem await deixava a 2ª carga
  // do usuário disputar com o LOGX STAT ainda em flight).
  await _vcBufferStat();

  // Loop iterativo. Pra cada LOGX NEW/OLD <n>, a central retorna até ~7
  // registros (32 chars hex cada, separados por espaço). Pedimos
  // novamente com n = total_lido + 1 até receber sentinela 0xFFFFFFFF
  // ou ERR 27, ou atingir o limit do usuário.
  var n = 1;
  var done = false;
  var safety = 0;
  while (!done && _vcBufferRows.length < limit && safety < 4096) {
    safety++;
    var lastErr = null;
    try {
      var r = await net.sendCommand('LOGX ' + verb + ' ' + n);
      if (!r || !r.ok) {
        if (r && r.errorCode === 27) break;  // fim natural
        lastErr = (r && r.error) || 'sem resposta';
        break;
      }
      var parsed = _vcBufferParseLogxBody(r.body);
      if (!parsed || parsed.records.length === 0) {
        lastErr = 'resposta sem registros parseáveis: ' + (r.body || '').slice(0, 80);
        break;
      }
      for (var i = 0; i < parsed.records.length; i++) {
        var rec = parsed.records[i];
        if (rec.endSentinel) { done = true; break; }
        _vcScanApplyBufferEvent(rec);
        _vcBufferRows.push(rec);
        _vcBufferAppendRow(rec, _vcBufferRows.length);
        if (_vcBufferRows.length >= limit) { done = true; break; }
      }
      if (done) break;
      n = _vcBufferRows.length + 1;
    } catch (err) {
      lastErr = (err && err.message) || 'exceção desconhecida';
      break;
    }
    if (lastErr) {
      // Log visível só no DevTools — usuário vê a contagem final no toast.
      try { console.warn('[buffer] loop interrompido:', lastErr); } catch (_) {}
    }
  }

  if (_vcBufferRows.length === 0) {
    list.innerHTML = '<p class="text-muted small m-0 p-3">' +
      _vcEscape(VCi18n.t('buffer.vazio') || 'Sem eventos registrados.') + '</p>';
  }
  _vcBufferUpdateFilterIndicator();
  vcToast(VCi18n.t('buffer.carregado', { n: _vcBufferRows.length })
          || ('Carregado: ' + _vcBufferRows.length + ' eventos.'),
          'success', 2500, { id: 'buffer-load' });
}

/* Parser da resposta LOGX. Body real (sem o envelope [R<seq> ...]):
   "LOGX NEW 1 6A0D779BD7073401000301456A0D779C 6A0D7798D7071401000301456A0D7798 ..."
   Cada registro = 32 chars hex contíguos, separados por whitespace.
   Pode terminar com 00000000... (sentinela = fim do log).
   O número após NEW/OLD é o offset (ignorado aqui — o iterador é feito
   no loop de _vcBufferFetch). */
function _vcBufferParseLogxBody(body) {
  var s = String(body || '');
  // Remove prefixo "LOGX NEW <n>" / "LOGX OLD <n>" (o offset é decimal).
  s = s.replace(/^\s*LOGX\s+(NEW|OLD)\s+\d+\s*/i, '');
  // Tokenize por whitespace e pega só os tokens com exatamente 32 chars hex.
  // Isso lida tanto com a forma "AA... BB... CC..." quanto com colchetes
  // herdados de implementações antigas (caso apareçam).
  var tokens = s.replace(/[\[\]]/g, ' ').split(/\s+/).filter(Boolean);
  var records = [];
  tokens.forEach(function (tok) {
    if (/^[0-9A-Fa-f]{32}$/.test(tok)) {
      records.push(_vcBufferParseLogxRecord(tok));
    }
  });
  return { records: records };
}

/* Parser posicional de 1 registro LOGX (32 chars hex compactados).
   Layout (CtrlLog.kt:511-572):
     [0..8)   timestamp evento (epoch UTC, 4 bytes big-endian hex)
     [8..12)  conta CID (4 chars hex)
     [12..16) evento (4 chars hex, ex "1401")
     [16..20) zona/usuário (4 chars hex)
     [20..22) partição (2 chars hex)
     [22..24) interface (2 chars: char ASCII E/G/W/D ou espaço)
     [24..32) timestamp entrega ao server (epoch UTC) ou FFFFFFFF = não enviado */
function _vcBufferParseLogxRecord(hex) {
  function be32(s) {
    if (!/^[0-9A-Fa-f]{8}$/.test(s)) return 0;
    return parseInt(s, 16) >>> 0;
  }
  var tsEvent = be32(hex.slice(0, 8));
  // Sentinela: APENAS 0xFFFFFFFF marca fim do log (CtrlLog.kt:522).
  // tsEvent=0 é registro válido (timestamp zero = 1970/01/01), aparece
  // pra eventos que ocorreram antes do RTC da central ter sido ajustado.
  var endSentinel = (tsEvent === 0xFFFFFFFF);
  if (endSentinel) return { endSentinel: true };

  var account = hex.slice(8, 12).toUpperCase();
  var eventHex = hex.slice(12, 16);
  var eventInt = parseInt(eventHex, 16) >>> 0;
  var zoneInt  = parseInt(hex.slice(16, 20), 16) >>> 0;
  var partInt  = parseInt(hex.slice(20, 22), 16) >>> 0;
  // Interface (LOGX): byte ASCII (`E`/`G`/`W`/`D` ou ' ' = ' ')
  var ifaceByte = parseInt(hex.slice(22, 24), 16) >>> 0;
  var ifaceChar = (ifaceByte >= 0x20 && ifaceByte < 0x7F)
                  ? String.fromCharCode(ifaceByte) : ' ';
  var tsTxd    = be32(hex.slice(24, 32));

  // Decodifica descrição i18n + tipo (severidade)
  var desc = _vcBufferEventDesc(eventInt);

  return {
    endSentinel: false,
    tsEvent:    tsEvent,
    tsEventStr: _vcBufferEpochToStr(tsEvent),
    account:    account,
    eventHex:   eventHex.toUpperCase(),
    eventInt:   eventInt,
    desc:       desc.text,
    severity:   desc.severity,
    zone:       zoneInt,
    part:       partInt,
    iface:      ifaceChar,
    tsTxd:      tsTxd,
    tsTxdStr:   tsTxd === 0xFFFFFFFF ? '---' : _vcBufferEpochToStr(tsTxd)
  };
}

/* Formata epoch UTC pra "yyyy/MM/dd - HH:mm:ss" (formato CtrlLog.kt:421).
   epoch=0 retorna "1970/01/01 - 00:00:00" (válido — visto em eventos
   gerados antes do RTC da central ser ajustado). Só 0xFFFFFFFF retorna
   "---" (não enviado / não aplicável). */
function _vcBufferEpochToStr(epoch) {
  if (epoch === 0xFFFFFFFF) return '---';
  var d = new Date((epoch >>> 0) * 1000);
  function p(n) { return String(n).padStart(2, '0'); }
  return d.getUTCFullYear() + '/' + p(d.getUTCMonth() + 1) + '/' + p(d.getUTCDate()) +
         ' - ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds());
}

/* Mapa eventInt → { text, severity } espelhando CtrlLog.kt:294-353.
   Bit 0x2000 setado = restauração. Bit 0x0F00==0x0400 = arme/desarme
   (sem prefixo "Evento:/Restauração:"). */
var _VC_BUF_EV = {
  0x0120: { key: 'panico_audivel',                       sev: 'danger' },
  0x0121: { key: 'coacao',                                sev: 'danger' },
  0x0122: { key: 'panico_silencioso',                    sev: 'danger' },
  0x0130: { key: 'disparo_de_zona',                      sev: 'danger' },
  0x0133: { key: 'disparo_de_zona_24_horas',             sev: 'danger' },
  0x0137: { key: 'violacao_da_chave_tamper_da_central',  sev: 'warn'   },
  0x0141: { key: 'tentativa_de_arme_com_porta_janela_aberta', sev: 'warn' },
  0x0144: { key: 'violacao_da_chave_tamper_dos_sensores',sev: 'warn'   },
  0x0146: { key: 'disparo_de_zona_silenciosa',           sev: 'danger' },
  0x0147: { key: 'falha_de_supervisao',                  sev: 'warn'   },
  0x0301: { key: 'ac_power',                              sev: 'warn'   },
  0x0302: { key: 'bateria_principal_baixa',              sev: 'warn'   },
  0x0305: { key: 'reset_do_sistema',                     sev: 'info'   },
  0x0308: { key: 'system_shutdown',                      sev: 'info'   },
  0x0309: { key: 'battery_test_fail',                    sev: 'warn'   },
  0x0311: { key: 'bateria_principal_ausente',            sev: 'warn'   },
  0x0313: { key: 'reset_de_fabrica',                     sev: 'info'   },
  0x0321: { key: 'sirene_com_fio_ausente',               sev: 'warn'   },
  0x0384: { key: 'bateria_baixa_de_sensor_sem_fio',      sev: 'warn'   },
  // 0x0401: contexto arme/desarme — distingue por bit restauração
  0x0401: { key: '__arme_desarme_usuario',               sev: 'arme'   },
  0x0403: { key: '__arme_desarme_auto',                  sev: 'arme'   },
  0x0407: { key: '__arme_desarme_remoto',                sev: 'arme'   },
  0x0441: { key: 'arme_stay',                            sev: 'arme'   },
  0x0454: { key: 'falha_ao_armar',                       sev: 'warn'   },
  0x0456: { key: 'arme_parcial',                         sev: 'arme'   },
  0x0530: { key: 'sensor_zona_inibido',                  sev: 'info'   },
  0x0531: { key: 'sensor_zona_adicionado',               sev: 'info'   },
  0x0532: { key: 'sensor_zona_removido',                 sev: 'info'   },
  0x0570: { key: 'sensor_zona_isolada',                  sev: 'info'   },
  0x0602: { key: 'teste_periodico',                      sev: 'info'   },
  0x0627: { key: 'conexao_do_vetticonfig_na_central',    sev: 'info'   },
  0x0628: { key: 'desconexao_do_vetticonfig_da_central', sev: 'info'   },
  0x0708: { key: 'acionamento_de_pgm_identificacao_do_usuario', sev: 'info' },
  0x0840: { key: 'disparo_causado_por_sensor_shox',      sev: 'danger' },
  0x0850: { key: 'disparo_causado_por_sensor_portao',    sev: 'danger' },
  0x0860: { key: '__pgm_ligado_desligado',               sev: 'info'   },
  0x0861: { key: 'pgm_acionado_no_modo_pulso',           sev: 'info'   },
  0x0870: { key: 'teclado_violacao_da_chave_tamper',     sev: 'warn'   },
  0x0871: { key: 'teclado_excesso_de_tentativas_com_senha_invalida', sev: 'warn' },
  0x0872: { key: 'teclado_bateria_baixa',                sev: 'warn'   },
  0x0873: { key: 'teclado_ac_power',                     sev: 'warn'   },
  0x0874: { key: 'teclado_falha_de_comunicacao',         sev: 'warn'   },
  0x0903: { key: '__fw_start_stop',                      sev: 'info'   },
  0x0904: { key: 'atualizacao_de_firmware_falhou',       sev: 'warn'   },
  0x0905: { key: 'atualizacao_de_firmware_concluida_com_exito', sev: 'success' }
};

function _vcBufferEventDesc(eventInt) {
  // Espelha CtrlLog.kt:294-353. Bit 0x2000 ("alto") TEM significados
  // diferentes conforme o código base (event & 0x0FFF):
  //   • 0x401/0x403/0x407 (arme/desarme): bit setado → ARME, bit OFF → desarme
  //   • 0x860 (PGM): bit setado → DESLIGADO, bit OFF → ligado
  //   • 0x903 (FW): bit setado → TERMINOU, bit OFF → começou
  //   • Outros: bit setado → "Restauração:", bit OFF → "Evento:"
  // O prefixo "Restauração:/Evento:" só aparece se (event & 0x0F00) != 0x0400.
  var bitHigh      = (eventInt & 0x2000) !== 0;
  var isArmeDesarme = (eventInt & 0x0F00) === 0x0400;
  var code = eventInt & 0x0FFF;
  var entry = _VC_BUF_EV[code];
  if (!entry) {
    return { text: VCi18n.t('buffer.eventos.unknown') || '???', severity: 'info' };
  }
  var key = entry.key;
  if (key === '__arme_desarme_usuario')      key = bitHigh ? 'usuario_arme'                    : 'desarme';
  else if (key === '__arme_desarme_auto')    key = bitHigh ? 'arme_automatico_programado'     : 'desarme_automatico_programado';
  else if (key === '__arme_desarme_remoto')  key = bitHigh ? 'arme_remoto'                    : 'desarme_remoto';
  else if (key === '__pgm_ligado_desligado') key = bitHigh ? 'pgm_desligado'                  : 'pgm_ligado';
  else if (key === '__fw_start_stop')        key = bitHigh ? 'atualizacao_de_firmware_terminou' : 'atualizacao_de_firmware_comecou';
  var text = VCi18n.t('buffer.eventos.' + key) || key;
  // Prefixo só pra eventos que NÃO são da família 0x04xx
  if (!isArmeDesarme) {
    var prefix = bitHigh ? (VCi18n.t('buffer.restauracao')   || 'Restauração:')
                         : (VCi18n.t('buffer.evento_prefix') || 'Evento:');
    text = prefix + ' ' + text;
  }
  return { text: text, severity: entry.sev };
}

/* Append direto durante carga: respeita filtro (não mostra registros
   que não casam) mas conserva o índice "real" (#) baseado em _vcBufferRows. */
function _vcBufferAppendRow(e, num) {
  var list = document.getElementById('vcBufferList');
  if (!list) return;
  if (list.querySelector('.text-muted')) list.innerHTML = '';
  if (!_vcBufferMatchesFilter(e)) return;
  list.appendChild(_vcBufferBuildRowEl(e, num));
}

function _vcBufferBuildRowEl(e, num) {
  var row = document.createElement('div');
  row.className = 'vc-buffer-row vc-buffer-sev-' + e.severity;
  row.style.cssText = 'display:grid;grid-template-columns:50px 60px 70px 1fr 60px 70px 90px 130px 130px;padding:6px 8px;border-bottom:1px solid #E5E8EB;font-size:12px;';
  row.innerHTML =
    '<div>' + String(num) + '</div>' +
    '<div>' + _vcEscape(e.account) + '</div>' +
    '<div>' + _vcEscape(e.eventHex) + '</div>' +
    '<div>' + _vcEscape(e.desc) + '</div>' +
    '<div>' + _vcEscape(String(e.zone)) + '</div>' +
    '<div>' + _vcEscape(String(e.part)) + '</div>' +
    '<div>' + _vcEscape(e.iface) + '</div>' +
    '<div>' + _vcEscape(e.tsEventStr) + '</div>' +
    '<div>' + _vcEscape(e.tsTxdStr) + '</div>';
  return row;
}

/* Aplica o filtro atual a 1 registro. Retorna true se passa. */
function _vcBufferMatchesFilter(e) {
  var f = _vcBufferFilter;
  if (f.severity && f.severity !== 'all' && e.severity !== f.severity) return false;
  if (f.partition && f.partition !== 'all' && String(e.part) !== String(f.partition)) return false;
  if (f.text) {
    var needle = f.text.toLowerCase();
    var hay = ((e.desc || '') + ' ' + (e.account || '') + ' ' + (e.eventHex || '')).toLowerCase();
    if (hay.indexOf(needle) === -1) return false;
  }
  if (f.dateFrom || f.dateTo) {
    // tsEvent é epoch UTC. Comparar com dateFrom/dateTo (yyyy-mm-dd local).
    if (!e.tsEvent || e.tsEvent === 0xFFFFFFFF) return false;
    var d = new Date(e.tsEvent * 1000);
    var ymd = d.getUTCFullYear() + '-' +
              String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
              String(d.getUTCDate()).padStart(2, '0');
    if (f.dateFrom && ymd < f.dateFrom) return false;
    if (f.dateTo   && ymd > f.dateTo)   return false;
  }
  return true;
}

/* Re-renderiza a lista inteira aplicando filtro corrente. Chamado quando
   o filtro muda (após carga inicial via append direto). */
function _vcBufferRender() {
  var list = document.getElementById('vcBufferList');
  if (!list) return;
  list.innerHTML = '';
  var shown = 0;
  for (var i = 0; i < _vcBufferRows.length; i++) {
    var r = _vcBufferRows[i];
    if (!_vcBufferMatchesFilter(r)) continue;
    list.appendChild(_vcBufferBuildRowEl(r, i + 1));
    shown++;
  }
  if (shown === 0) {
    list.innerHTML = '<p class="text-muted small m-0 p-3">' +
      _vcEscape(VCi18n.t('buffer.filtro_vazio') ||
                'Nenhum evento corresponde ao filtro atual.') + '</p>';
  }
  _vcBufferUpdateFilterIndicator();
}

/* Atualiza estado visual do botão funil (badge com contagem + classe
   "active" quando há filtro). */
function _vcBufferUpdateFilterIndicator() {
  var btn = document.getElementById('vcBufferBtnFiltro');
  if (!btn) return;
  var active = _vcBufferIsFilterActive();
  btn.classList.toggle('vc-buffer-filtro-on', active);
  // Adiciona/atualiza badge de contagem ao lado
  var badge = document.getElementById('vcBufferFiltroBadge');
  if (active) {
    var total = _vcBufferRows.length;
    var shown = _vcBufferRows.filter(_vcBufferMatchesFilter).length;
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'vcBufferFiltroBadge';
      badge.className = 'vc-buffer-filtro-badge';
      btn.parentNode.insertBefore(badge, btn);
    }
    badge.textContent = shown + ' / ' + total;
  } else if (badge) {
    badge.remove();
  }
}

function _vcBufferIsFilterActive() {
  var f = _vcBufferFilter;
  return (f.severity && f.severity !== 'all') ||
         (f.partition && f.partition !== 'all') ||
         !!f.text || !!f.dateFrom || !!f.dateTo;
}

/* Lista filtrada — usado pelo export (CSV/PDF). */
function _vcBufferFilteredRows() {
  return _vcBufferRows.filter(_vcBufferMatchesFilter);
}

/* ─── Popover de filtro ─────────────────────────────────────── */
function _vcBufferOpenFilterPopover() {
  var anchor = document.getElementById('vcBufferBtnFiltro');
  if (!anchor) return;
  // Se já está aberto, fecha (toggle)
  var existing = document.getElementById('vcBufferFiltroPop');
  if (existing) { existing.remove(); return; }

  var pop = document.createElement('div');
  pop.id = 'vcBufferFiltroPop';
  pop.className = 'vc-buffer-filtro-pop';
  pop.innerHTML =
    '<div class="vc-buffer-filtro-header">' +
      '<span data-i18n="buffer.filtro_titulo">Filtrar eventos</span>' +
      '<button type="button" class="vc-btn sm outline" id="vcBufferFiltroClose"><i class="bi bi-x-lg"></i></button>' +
    '</div>' +
    '<div class="vc-buffer-filtro-body">' +
      '<label class="vc-label-sm" data-i18n="buffer.filtro_severidade">Severidade:</label>' +
      '<select class="vc-input" id="vcBufferFiltroSev">' +
        '<option value="all"      data-i18n="buffer.filtro_sev_todos">Todos</option>' +
        '<option value="danger"   data-i18n="buffer.filtro_sev_disparos">Disparos</option>' +
        '<option value="warn"     data-i18n="buffer.filtro_sev_falhas">Falhas</option>' +
        '<option value="arme"     data-i18n="buffer.filtro_sev_armagem">Armagem</option>' +
        '<option value="info"     data-i18n="buffer.filtro_sev_sistema">Sistema</option>' +
        '<option value="success"  data-i18n="buffer.filtro_sev_sucesso">Sucesso</option>' +
      '</select>' +
      '<label class="vc-label-sm mt-2" data-i18n="buffer.filtro_particao">Partição:</label>' +
      '<select class="vc-input" id="vcBufferFiltroPart">' +
        '<option value="all" data-i18n="buffer.filtro_part_todas">Todas</option>' +
        '<option value="1">P1</option><option value="2">P2</option>' +
        '<option value="3">P3</option><option value="4">P4</option>' +
        '<option value="5">P5</option><option value="6">P6</option>' +
      '</select>' +
      '<label class="vc-label-sm mt-2" data-i18n="buffer.filtro_texto">Texto na descrição:</label>' +
      '<input class="vc-input" type="text" id="vcBufferFiltroText" placeholder="Ex.: bateria">' +
      '<div class="row g-2 mt-2">' +
        '<div class="col-6">' +
          '<label class="vc-label-sm" data-i18n="buffer.filtro_de">De:</label>' +
          '<input class="vc-input" type="date" id="vcBufferFiltroDtFrom">' +
        '</div>' +
        '<div class="col-6">' +
          '<label class="vc-label-sm" data-i18n="buffer.filtro_ate">Até:</label>' +
          '<input class="vc-input" type="date" id="vcBufferFiltroDtTo">' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="vc-buffer-filtro-footer">' +
      '<button type="button" class="vc-btn outline" id="vcBufferFiltroLimpar"><span data-i18n="buffer.filtro_limpar">Limpar</span></button>' +
      '<button type="button" class="vc-btn"         id="vcBufferFiltroAplicar"><span data-i18n="buffer.filtro_aplicar">Aplicar</span></button>' +
    '</div>';

  document.body.appendChild(pop);
  // Posiciona ancorado ao botão (canto inferior direito alinhado).
  var rect = anchor.getBoundingClientRect();
  pop.style.position = 'fixed';
  pop.style.top   = (rect.bottom + 6) + 'px';
  pop.style.right = Math.max(8, window.innerWidth - rect.right) + 'px';
  pop.style.zIndex = '9999';

  // Pré-popula com filtro atual
  document.getElementById('vcBufferFiltroSev').value    = _vcBufferFilter.severity  || 'all';
  document.getElementById('vcBufferFiltroPart').value   = _vcBufferFilter.partition || 'all';
  document.getElementById('vcBufferFiltroText').value   = _vcBufferFilter.text      || '';
  document.getElementById('vcBufferFiltroDtFrom').value = _vcBufferFilter.dateFrom  || '';
  document.getElementById('vcBufferFiltroDtTo').value   = _vcBufferFilter.dateTo    || '';

  if (typeof VCi18n !== 'undefined' && VCi18n.apply) VCi18n.apply();

  document.getElementById('vcBufferFiltroClose').onclick   = function () { pop.remove(); };
  document.getElementById('vcBufferFiltroLimpar').onclick  = function () {
    _vcBufferFilter = { severity: 'all', partition: 'all', text: '', dateFrom: '', dateTo: '' };
    _vcBufferRender();
    pop.remove();
  };
  document.getElementById('vcBufferFiltroAplicar').onclick = function () {
    _vcBufferFilter = {
      severity:  document.getElementById('vcBufferFiltroSev').value || 'all',
      partition: document.getElementById('vcBufferFiltroPart').value || 'all',
      text:      (document.getElementById('vcBufferFiltroText').value || '').trim(),
      dateFrom:  document.getElementById('vcBufferFiltroDtFrom').value || '',
      dateTo:    document.getElementById('vcBufferFiltroDtTo').value || ''
    };
    _vcBufferRender();
    pop.remove();
  };

  // Fecha clicando fora (com pequeno delay pra não fechar com o próprio clique)
  setTimeout(function () {
    function onDocClick(e) {
      if (!pop.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) {
        pop.remove();
        document.removeEventListener('click', onDocClick, true);
      }
    }
    document.addEventListener('click', onDocClick, true);
  }, 50);
}

/* Export PDF/CSV reusando vettiAPI.report. Aplica filtro atual (no MVP
   é a lista inteira; quando filtro for implementado, passar a lista
   filtrada). */
async function _vcBufferExport(fmt) {
  if (!_vcBufferRows || _vcBufferRows.length === 0) {
    vcToast(VCi18n.t('buffer.export_vazio') || 'Sem eventos pra exportar. Clique em Carregar primeiro.', 'warn');
    return;
  }
  // Usa lista filtrada (se filtro ativo) — Exportar PDF/CSV respeita o
  // filtro corrente, como sugerido pelo usuário ("a export aplica ao
  // estado atual da lista, com filtro").
  var exportRows = _vcBufferFilteredRows();
  if (exportRows.length === 0) {
    vcToast(VCi18n.t('buffer.export_vazio_filtro')
            || 'Filtro atual não casa com nenhum evento. Limpe o filtro ou ajuste os critérios.', 'warn');
    return;
  }
  var payload = {
    title:   VCi18n.t('buffer.export_titulo') || 'Buffer de eventos',
    central: {
      name:  (document.getElementById('vcCentralName') || {}).textContent || '',
      model: (document.getElementById('vcCentralModel') || {}).textContent || '',
      mac:   ((document.getElementById('vcCentralMac') || {}).textContent || '').replace(/^MAC:\s*/i, ''),
      ip:    ((document.getElementById('vcCentralIp')  || {}).textContent || '').replace(/^IP:\s*/i,  '')
    },
    columns: [
      { key: 'num',        label: '#'          },
      { key: 'account',    label: VCi18n.t('buffer.conta')     || 'Conta'          },
      { key: 'eventHex',   label: VCi18n.t('buffer.evento')    || 'Evento'         },
      { key: 'desc',       label: VCi18n.t('buffer.descricao') || 'Descrição'      },
      { key: 'zone',       label: VCi18n.t('buffer.zona')      || 'Zona'           },
      { key: 'part',       label: VCi18n.t('buffer.particao')  || 'Partição'       },
      { key: 'iface',      label: VCi18n.t('buffer.interface') || 'Interface'      },
      { key: 'tsEventStr', label: VCi18n.t('buffer.gerado_em') || 'Gerado às'      },
      { key: 'tsTxdStr',   label: VCi18n.t('buffer.entregue1') || 'Entregue às'    }
    ],
    rows: exportRows.map(function (e, i) {
      return Object.assign({ num: i + 1 }, e);
    })
  };
  try {
    if (fmt === 'pdf') {
      var r1 = await window.vettiAPI.report.exportPdf(payload);
      if (r1 && r1.ok)        vcToast(VCi18n.t('buffer.export_ok', { path: r1.path }) || 'Salvo: ' + r1.path, 'success', 4000);
      else if (r1 && r1.canceled) { /* silencioso */ }
      else                    vcToast((r1 && r1.error) || 'Falha ao exportar PDF.', 'warn');
    } else {
      var r2 = await window.vettiAPI.report.exportCsv(payload);
      if (r2 && r2.ok)        vcToast(VCi18n.t('buffer.export_ok', { path: r2.path }) || 'Salvo: ' + r2.path, 'success', 4000);
      else if (r2 && r2.canceled) { /* silencioso */ }
      else                    vcToast((r2 && r2.error) || 'Falha ao exportar CSV.', 'warn');
    }
  } catch (err) {
    vcToast((err && err.message) || 'Erro', 'warn');
  }
}


// Ponto de entrada da tela Status (chamado pelo HTML após VCi18n.init).
function vcStatusInit() {
  if (!document.getElementById('vcCentralName')) return; // não é a tela Status
  _vcStatusBindEvents();
  _vcStatusFillFromSession();
  _vcStatusFetchAll().then(function () {
    // Após a primeira leitura, dispara o keep-alive para a sessão não expirar.
    _vcStartKeepAlive();
  });
}

/* ═════════════════════════════════════════════════════════════
   TELA SISTEMA — abas, leitura/escrita de parâmetros
   ═════════════════════════════════════════════════════════════ */

// Snapshot dos valores carregados da central para diff em "Gravar".
// Chave = código do parâmetro (ex.: 'B1060000'); valor = string (já parsed
// no formato de exibição/edição — ver _VC_PAR_FORMAT).
var _vcSysSnapshot = {};

// Transformações por parâmetro entre o formato "raw" da central e o
// formato exibido ao usuário. Quando não há entrada, o valor é usado
// como string sem conversão (padrão).
//
//   parse(raw)     : valor recebido da central → formato de exibição
//   serialize(disp): formato de exibição → string a enviar para a central
//
var _VC_PAR_FORMAT = {
  // Conta CID — central armazena/retorna como inteiro decimal (uint16),
  // o software exibe como hexadecimal 4 dígitos uppercase (D707 = 55047).
  'B1060000': {
    parse: function (raw) {
      var n = parseInt(String(raw), 10);
      if (isNaN(n)) return raw;
      return n.toString(16).toUpperCase().padStart(4, '0');
    },
    serialize: function (disp) {
      var n = parseInt(String(disp), 16);
      if (isNaN(n)) return disp;
      return String(n);
    }
  }
};

function _vcParParse(key, raw)        { var f = _VC_PAR_FORMAT[key]; return (f && f.parse)     ? f.parse(raw)     : raw; }
function _vcParSerialize(key, disp)   { var f = _VC_PAR_FORMAT[key]; return (f && f.serialize) ? f.serialize(disp): disp; }

// Validadores client-side por PAR. Cada função recebe o `displayValue`
// (string como o usuário digitou) e retorna null se válido, ou a chave
// i18n (com possíveis `vars`) da mensagem de erro a exibir.
//
//   return null;                              // OK
//   return { key: 'sistema.cid_conta_invalid' };
var _VC_PAR_VALIDATE = {
  // Conta CID — regras confirmadas com a engenharia:
  //   • Não pode ser "0000".
  //   • Não pode começar com a letra A.
  //   • Deve ser hexadecimal de 1 a 4 dígitos (0-9, A-F).
  'B1060000': function (displayValue) {
    var s = String(displayValue || '').trim().toUpperCase();
    if (s === '' || /^0+$/.test(s))    return { key: 'sistema.cid_conta_zero' };
    if (s.charAt(0) === 'A')           return { key: 'sistema.cid_conta_a' };
    if (!/^[0-9A-F]{1,4}$/.test(s))    return { key: 'sistema.cid_conta_hex' };
    return null;
  }
};
function _vcParValidate(key, displayValue) {
  var v = _VC_PAR_VALIDATE[key];
  return v ? v(displayValue) : null;
}

// Parser da resposta [R<seq> PAR <key> <valor>...]. Valor pode conter
// espaços e ficar entre aspas duplas (ex.: nome do painel).
function _parseParResponse(body) {
  var s = String(body || '').replace(/^PAR\s+/i, '');
  var m = /^([0-9A-Fa-f]{8})\s+(.*)$/.exec(s);
  if (!m) return null;
  var v = m[2].trim();
  if (v.length >= 2 && v[0] === '"' && v[v.length - 1] === '"') {
    v = v.slice(1, -1).replace(/\\"/g, '"');   // unescape aspas internas
  }
  return { key: m[1].toUpperCase(), value: v };
}

// Lê um parâmetro da central. Retorna o valor já no formato de exibição
// (após _vcParParse), ou null se falhar.
async function _vcReadParam(key) {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return null;
  try {
    var r = await net.sendCommand('PAR ' + key);
    if (!r || !r.ok) return null;
    var p = _parseParResponse(r.body);
    return p ? _vcParParse(key, p.value) : null;
  } catch (_) { return null; }
}

// Grava um parâmetro na central. `displayValue` é o valor no formato de
// exibição/edição; serialize converte para o formato bruto da central.
// `el` é o elemento de origem; serve para determinar o tipo (string/int/bool)
// e aplicar as regras de aspas corretas.
//
// Regra (validada contra a versão Java em produção, `CtrlMain.java` linhas
// 3469-3758): strings vão SEMPRE entre aspas, mesmo vazias. Inteiros e
// booleans vão sem aspas. Inteiros vazios são pulados (não gravados).
async function _vcWriteParam(key, displayValue, el) {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return { ok: false };

  // Validação client-side antes de mandar para a central.
  var verr = _vcParValidate(key, displayValue);
  if (verr) {
    var msg = VCi18n.t(verr.key, verr.vars || {});
    vcToast(msg, 'error');
    vcLogTs(msg);
    return { ok: false, error: 'validation', validationMsg: msg };
  }

  var raw = String(_vcParSerialize(key, displayValue));

  // Determina o tipo do valor. Override opcional: data-par-type="string|int|bool".
  // Default a partir do elemento.
  var type = 'string';
  if (el) {
    if (el.dataset && el.dataset.parType) {
      type = el.dataset.parType;
    } else if (el.tagName === 'INPUT' && el.type === 'checkbox') {
      type = 'bool';
    } else if (el.tagName === 'INPUT' && el.type === 'number') {
      type = 'int';
    } else if (el.tagName === 'SELECT') {
      type = 'int';
    } else if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'password' || el.type === 'email' || el.type === 'url' || el.type === 'tel')) {
      type = 'string';
    }
  }

  if (type === 'string') {
    // Strings: sempre entre aspas, mesmo vazias. Escapa aspas internas.
    raw = '"' + raw.replace(/"/g, '\\"') + '"';
  } else if (type === 'int' || type === 'bool') {
    // Para inteiros, valida vazio e range [min, max] (atributos nativos
    // do <input type="number">). Se inválido: aplica data-par-default
    // ou pula. A central rejeita PAR numérico inválido com ERR 32.
    var defaultValue = el && el.dataset && el.dataset.parDefault;
    var invalid = false, reasonKey = null;
    if (raw === '') {
      invalid = true;
      reasonKey = 'sistema.par_default_applied';   // "estava vazia — usando default X"
    } else if (type === 'int' && el && el.tagName === 'INPUT') {
      var n = Number(raw);
      if (isNaN(n)) {
        invalid = true; reasonKey = 'sistema.par_default_out_of_range';
      } else {
        var min = el.min !== '' && el.min != null ? Number(el.min) : null;
        var max = el.max !== '' && el.max != null ? Number(el.max) : null;
        if ((min !== null && !isNaN(min) && n < min) ||
            (max !== null && !isNaN(max) && n > max)) {
          invalid = true; reasonKey = 'sistema.par_default_out_of_range';
        }
      }
    }
    if (invalid) {
      if (defaultValue !== undefined && String(defaultValue).trim() !== '') {
        raw = String(defaultValue).trim();
        var defaultMsg = VCi18n.t(reasonKey, { key: key, val: raw });
        vcLogTs(defaultMsg);
        vcToast(defaultMsg, 'warn');
      } else {
        var skipMsg = VCi18n.t('sistema.par_skip_empty', { key: key });
        vcLogTs(skipMsg);
        vcToast(skipMsg, 'error');
        return { ok: false, error: 'invalid-value' };
      }
    }
  }

  return await net.sendCommand('PAR ' + key + ' ' + raw);
}

// Aplica valor lido a um campo (input, select ou span readonly).
// Suporte a `data-par-bool-invert`: para PARs cuja lógica é o oposto
// da label visível (ex.: PAR 910A0000 é flag "Static", label "Ativar DHCP";
// PAR 91100000 é "auto update SW" mas label fica em "Atualização automática").
function _vcApplyParToField(el, value) {
  if (!el) return;
  if (el.classList && el.classList.contains('vc-contact-priority-value')) {
    el.value = value || '1';
    _vcSyncContactPriorityRadios(el);
    return;
  }
  if (el.dataset.parReadonly !== undefined || el.tagName === 'SPAN') {
    el.textContent = (value === null || value === undefined || value === '') ? '---' : value;
    return;
  }
  if (el.tagName === 'INPUT' && el.type === 'checkbox') {
    var truthy = (value === '1' || value === 'true' || value === 1);
    if (el.dataset.parBoolInvert !== undefined) truthy = !truthy;
    el.checked = truthy;
    return;
  }
  el.value = value || '';
}

// Lê o valor atual de um campo para enviar à central.
// Aplica a inversão se o campo for `data-par-bool-invert`.
function _vcReadField(el) {
  if (!el) return null;
  if (el.tagName === 'INPUT' && el.type === 'checkbox') {
    var checked = el.checked;
    if (el.dataset.parBoolInvert !== undefined) checked = !checked;
    return checked ? '1' : '0';
  }
  return el.value;
}

function _vcSyncContactPriorityRadios(hidden) {
  if (!hidden) return;
  var group = hidden.closest('[data-priority-group]');
  if (!group) return;
  var value = String(hidden.value || '1');
  group.querySelectorAll('input[type="radio"]').forEach(function (radio) {
    radio.checked = String(radio.value) === value;
  });
}

function _vcBindContactPriorityRadios() {
  document.querySelectorAll('[data-priority-group]').forEach(function (group) {
    var hidden = group.querySelector('.vc-contact-priority-value[data-par]');
    if (!hidden || group.dataset.boundPriority === '1') return;
    group.dataset.boundPriority = '1';
    group.querySelectorAll('input[type="radio"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (!radio.checked) return;
        hidden.value = radio.value;
      });
    });
    _vcSyncContactPriorityRadios(hidden);
  });
}

// Carrega todos os campos com data-par/data-par-readonly de um painel.
// Campos marcados com data-par-todo são placeholders (mapeamento ainda
// não confirmado no doc Vetti) — ignorados na leitura/gravação.
async function _vcLoadPanel(panel) {
  if (!panel) return;
  // Toast de progresso enquanto lê os PARs do painel.
  var tabBtn = document.querySelector('.vc-sys-tab[data-tab="' + panel.id + '"]') ||
               document.querySelector('.vc-tab[data-tab="' + panel.id + '"]');
  var tabName = tabBtn ? (tabBtn.textContent || '').trim() : panel.id;
  var toastId = 'load-panel-' + panel.id;
  vcToast(VCi18n.t('common.loading_tab', { tab: tabName }), 'info', 0, { id: toastId, persist: true });

  var fields = panel.querySelectorAll('[data-par], [data-par-readonly], [data-par-multi]');
  // Cache de leituras para PARs "multi" (mesma chave, sub-campos diferentes).
  // Evita ler 4x o mesmo PAR quando tem 4 sub-campos no painel.
  var multiCache = {};
  for (var i = 0; i < fields.length; i++) {
    var el = fields[i];
    if (el.dataset.parMulti) {
      // formato: "<KEY>:<subkey>" — ex.: "610B0000:STIP"
      var parts = el.dataset.parMulti.split(':');
      var mkey = parts[0]; var sub = parts[1];
      if (!mkey || !sub) continue;
      if (!(mkey in multiCache)) {
        multiCache[mkey] = _parseKvString(await _vcReadRawParam(mkey));
      }
      var dict = multiCache[mkey] || {};
      _vcApplyParToField(el, dict[sub] != null ? dict[sub] : '');
      continue;
    }
    var key = el.dataset.par || el.dataset.parReadonly;
    if (!key) continue;
    var val = await _vcReadParam(key);
    _vcSysSnapshot[key] = val == null ? '' : val;
    _vcApplyParToField(el, val);
  }
  panel.dataset.loaded = '1';
  vcToast(VCi18n.t('common.loaded_tab', { tab: tabName }), 'success', 2500, { id: toastId });
}

// Lê PAR retornando o VALOR cru (sem parse). Para PARs cujo valor é uma
// string composta tipo "STIP=10.0.0.1 STMAC=AA:BB:..." (ex.: 610B0000).
async function _vcReadRawParam(key) {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return null;
  try {
    var r = await net.sendCommand('PAR ' + key);
    if (!r || !r.ok) return null;
    var p = _parseParResponse(r.body);
    return p ? p.value : null;
  } catch (_) { return null; }
}

// Parser genérico "K1=V1 K2=V2 K3=\"V com espaço\"" → { K1, K2, K3 }.
function _parseKvString(s) {
  var out = {};
  if (!s) return out;
  var re = /(\w+)=("([^"]*)"|(\S+))/g;
  var m;
  while ((m = re.exec(s)) !== null) {
    out[m[1]] = m[3] !== undefined ? m[3] : m[4];
  }
  return out;
}

// Verdadeiro se o card contém algum campo com mapeamento pendente.
function _vcCardHasTodos(card) {
  return card && card.querySelector('[data-par-todo]') !== null;
}

// Cancelar: re-lê os campos do card a partir da central, descartando
// qualquer alteração local não gravada.
async function _vcSysCancelCard(card) {
  if (!card) return;
  var fields = card.querySelectorAll('[data-par], [data-par-readonly]');
  for (var i = 0; i < fields.length; i++) {
    var el = fields[i];
    var key = el.dataset.par || el.dataset.parReadonly;
    if (!key) continue;
    var val = await _vcReadParam(key);
    _vcSysSnapshot[key] = val == null ? '' : val;
    _vcApplyParToField(el, val);
  }
  vcLogTs(VCi18n.t('sistema.card_cancelled'));
}

// Gravar: para cada campo editável (data-par sem data-par-readonly),
// compara com o snapshot. Se mudou, manda PAR <key> <valor>. Atualiza
// snapshot ao final.
async function _vcSysSaveCard(card) {
  if (!card) return;
  var fields = card.querySelectorAll('[data-par]');
  var changed = 0, errors = 0;
  for (var i = 0; i < fields.length; i++) {
    var el = fields[i];
    if (el.dataset.parReadonly !== undefined) continue;  // só leitura
    var key = el.dataset.par;
    var current = _vcReadField(el);
    var prev = _vcSysSnapshot[key];
    if (current === prev) continue;
    var resp = await _vcWriteParam(key, current, el);
    if (resp && resp.ok) {
      // Atualiza o campo e o snapshot com o valor que a central efetivamente
      // gravou (lido da própria resposta [R<seq> PAR <key> <valor>]). Isso
      // captura defaults aplicados pela central e qualquer normalização.
      var parsed = _parseParResponse(resp.body);
      var confirmed = parsed ? _vcParParse(key, parsed.value) : current;
      _vcSysSnapshot[key] = confirmed;
      _vcApplyParToField(el, confirmed);
      changed++;
    } else {
      errors++;
    }
  }
  if (changed > 0 && errors === 0) vcLogTs(VCi18n.t('sistema.card_saved', { n: changed }));
  else if (errors > 0)             vcLogTs(VCi18n.t('sistema.card_save_partial', { ok: changed, err: errors }));
  else                             vcLogTs(VCi18n.t('sistema.card_no_changes'));

  if (_vcCardHasTodos(card)) {
    vcLogTs(VCi18n.t('sistema.card_has_todos'));
  }
}

/* ═════════════════════════════════════════════════════════════
   SISTEMA → AVANÇADO (aba escondida — Ctrl+Shift+click no header)
   Espelha a aba "Avançado" do Java (CtrlMain.actionBtnReadAdv /
   actionBtnWriteAdv). PARs e comandos:

   Opções:    91050000 (beta), 91100000 (auto-update INVERTIDO),
              91230000 (preservar senha), 91250000 (autoriza app
              INVERTIDO), E1100000 (empresa).
   Logger:    B1030000 eth-debug, B1080000 wifi-debug,
              E10E0000 url, B1120000/B1130000/B1140000 portas,
              A1120000 dias, 911B0000 modo (lido), CMD 18 0|1 grava
              modo local/remoto.
   Sniffer:   A1080000 → 0=off, 124=sniff+cid, 123=sniff, 125=db.
   Buffer:    LOGX DEL (v554+) / LOG DEL fallback.
   Firmware:  CMD 60 "arquivo.txt".
   Teclado:   F1060000/B1150000 (eth), F1070000/B1160000 (wifi).
   Sirene:    A12C0000 timeOn, A12D0000 timeOff/10, C1020000 tone
              packed (32 bits: freq1/time1/ramp1/freq2/time2/ramp2).
   ═════════════════════════════════════════════════════════════ */

// Tabelas de frequência e tempo do tom da sirene. Os índices entram
// direto no packed; valores aproximados (firmware define o real).
var _VC_ADV_SIR_FREQS = (function () {
  var arr = []; for (var i = 0; i < 64; i++) arr.push('Tom ' + (i + 1)); return arr;
})();
var _VC_ADV_SIR_TIMES = (function () {
  var arr = []; for (var i = 0; i < 32; i++) arr.push((i * 50 + 50) + ' ms'); return arr;
})();

async function _vcAdvLoad() {
  var panel = document.getElementById('vcSysAvancado');
  if (!panel) return;
  panel.dataset.loaded = '1';
  vcToast(VCi18n.t('common.loading_tab', { tab: 'Avançado' }), 'info', 0,
          { id: 'load-panel-vcSysAvancado', persist: true });

  // Popula combos de Tom 1/2 e Tempo 1/2 (uma vez).
  _vcAdvBuildSireneCombos();

  // Lê todos os PARs com data-par (checkboxes + inputs do card "Opções
  // avançadas", do Logger e do MNS teclado).
  await _vcLoadPanel(panel);

  // Lê o modo do logger (PAR 911B0000) — 0=local, 1=remoto.
  try {
    var rLogger = await window.vettiAPI.network.sendCommand('PAR 911B0000');
    if (rLogger && rLogger.ok) {
      var p = _parseParResponse(rLogger.body);
      var mode = p ? parseInt(p.value, 10) : 0;
      var loc = document.getElementById('vcAdvLoggerLocal');
      var rem = document.getElementById('vcAdvLoggerRemote');
      if (loc) loc.checked = (mode === 0);
      if (rem) rem.checked = (mode === 1);
    }
  } catch (_) {}

  // Modo sniffer (PAR A1080000) — 0/123/124/125.
  try {
    var rSn = await window.vettiAPI.network.sendCommand('PAR A1080000');
    if (rSn && rSn.ok) {
      var pSn = _parseParResponse(rSn.body);
      var v = pSn ? parseInt(pSn.value, 10) : 0;
      var map = { 0: 'off', 124: 'cid', 123: 'only', 125: 'db' };
      var which = map[v] || 'off';
      vcLogTs('Modo sniffer lido: A1080000 = ' + v + ' (' + which + ')');
      document.querySelectorAll('input[name="vcAdvSniffer"]').forEach(function (r) {
        r.checked = (r.value === which);
      });
    } else {
      var em = rSn && rSn.errorCode != null ? ('ERR ' + rSn.errorCode) : (rSn && rSn.body) || 'sem resposta';
      vcLogTs('Modo sniffer leitura falhou: ' + em);
    }
  } catch (e) {
    vcLogTs('Modo sniffer exceção: ' + ((e && e.message) || e));
  }

  // Tom da sirene (PAR C1020000) — packed 32 bits.
  try {
    var rTone = await window.vettiAPI.network.sendCommand('PAR C1020000');
    if (rTone && rTone.ok) {
      var pT = _parseParResponse(rTone.body);
      if (pT) _vcAdvDecodeSireneTone(parseInt(pT.value, 10));
    }
  } catch (_) {}

  // Nome do arquivo de firmware — guardado no storage local (não vem
  // da central).
  try {
    if (window.vettiAPI && window.vettiAPI.storage) {
      var saved = await window.vettiAPI.storage.get('advFirmwareFile');
      if (saved) {
        var fld = document.getElementById('vcAdvFirmwareFile');
        if (fld) fld.value = String(saved);
      }
    }
  } catch (_) {}

  _vcAdvBindButtons();
  vcToast(VCi18n.t('common.loaded_tab', { tab: 'Avançado' }), 'success', 2500,
          { id: 'load-panel-vcSysAvancado' });
}

function _vcAdvBuildSireneCombos() {
  var freqOpts = '<option value="-1" disabled selected>--</option>' +
    _VC_ADV_SIR_FREQS.map(function (n, i) { return '<option value="' + i + '">' + n + '</option>'; }).join('');
  var timeOpts = '<option value="-1" disabled selected>--</option>' +
    _VC_ADV_SIR_TIMES.map(function (n, i) { return '<option value="' + i + '">' + n + '</option>'; }).join('');
  ['vcAdvSirFreq1', 'vcAdvSirFreq2'].forEach(function (id) {
    var s = document.getElementById(id);
    if (s && !s._vcBuilt) { s.innerHTML = freqOpts; s._vcBuilt = true; }
  });
  ['vcAdvSirTime1', 'vcAdvSirTime2'].forEach(function (id) {
    var s = document.getElementById(id);
    if (s && !s._vcBuilt) { s.innerHTML = timeOpts; s._vcBuilt = true; }
  });
}

function _vcAdvDecodeSireneTone(val) {
  // Layout (do Java, CtrlMain.java:5445):
  //   freq1: bits 0-5 (6 bits)
  //   time1: bits 6-10 (5 bits)
  //   ramp1: bit 11
  //   freq2: bits 12-17
  //   time2: bits 18-22
  //   ramp2: bit 23
  var freq1 = val & 0x3F;
  var time1 = (val >> 6) & 0x1F;
  var ramp1 = ((val >> 11) & 0x01) !== 0;
  var freq2 = (val >> 12) & 0x3F;
  var time2 = (val >> 18) & 0x1F;
  var ramp2 = ((val >> 23) & 0x01) !== 0;
  var setSel = function (id, idx) {
    var s = document.getElementById(id);
    if (s) s.value = String(idx);
  };
  setSel('vcAdvSirFreq1', freq1);
  setSel('vcAdvSirTime1', time1);
  setSel('vcAdvSirFreq2', freq2);
  setSel('vcAdvSirTime2', time2);
  var setRadio = function (name, which) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (r) {
      r.checked = (r.value === which);
    });
  };
  setRadio('vcAdvSirEdge1', ramp1 ? 'ramp' : 'edge');
  setRadio('vcAdvSirEdge2', ramp2 ? 'ramp' : 'edge');
}

function _vcAdvBindButtons() {
  var panel = document.getElementById('vcSysAvancado');
  if (!panel || panel._vcAdvBound) return;
  panel._vcAdvBound = true;

  // Limpar buffer — LOGX DEL (firmware v554+) com fallback LOG DEL.
  var btnLog = document.getElementById('vcAdvBtnLimparBuffer');
  if (btnLog) {
    btnLog.addEventListener('click', async function (e) {
      e.preventDefault();
      if (!confirm(VCi18n.t('avancado.confirma_limpar'))) return;
      var net = window.vettiAPI && window.vettiAPI.network;
      if (!net) return;
      try {
        var r = await net.sendCommand('LOGX DEL');
        if (r && r.ok) {
          vcToast(VCi18n.t('avancado.buffer_limpo'), 'success');
        } else if (r && r.errorCode === 8) {
          var r2 = await net.sendCommand('LOG DEL');
          if (r2 && r2.ok) vcToast(VCi18n.t('avancado.buffer_limpo'), 'success');
          else vcToast(VCi18n.t('avancado.buffer_falha'), 'warn');
        } else {
          vcToast(VCi18n.t('avancado.buffer_falha'), 'warn');
        }
      } catch (err) {
        vcToast(VCi18n.t('avancado.buffer_falha'), 'warn');
      }
    });
  }

  // Atualizar firmware — CMD 60 "<arquivo>".
  var btnFw = document.getElementById('vcAdvBtnFirmwareUpdate');
  if (btnFw) {
    btnFw.addEventListener('click', async function (e) {
      e.preventDefault();
      var fld = document.getElementById('vcAdvFirmwareFile');
      var fileName = (fld && fld.value || '').trim();
      if (!fileName) {
        vcToast(VCi18n.t('avancado.firmware_vazio'), 'warn');
        return;
      }
      if (!confirm(VCi18n.t('avancado.confirma_firmware', { file: fileName }))) return;

      try {
        if (window.vettiAPI && window.vettiAPI.storage) {
          window.vettiAPI.storage.set('advFirmwareFile', fileName);
        }
      } catch (_) {}

      try {
        var r = await window.vettiAPI.network.sendCommand('CMD 60 "' + fileName + '"');
        if (r && r.ok) vcToast(VCi18n.t('avancado.firmware_ok'), 'success');
        else vcToast(VCi18n.t('avancado.firmware_falha'), 'warn');
      } catch (_) {
        vcToast(VCi18n.t('avancado.firmware_falha'), 'warn');
      }
    });
  }

  // Salvar Logger (modo local/remoto + portas).
  var btnLogSave = document.getElementById('vcAdvBtnSaveLogger');
  if (btnLogSave) {
    btnLogSave.addEventListener('click', async function (e) {
      e.preventDefault();
      await _vcAdvSaveLogger();
    });
  }

  // Salvar Modo sniffer.
  var btnSnSave = document.getElementById('vcAdvBtnSaveSniffer');
  if (btnSnSave) {
    btnSnSave.addEventListener('click', async function (e) {
      e.preventDefault();
      await _vcAdvSaveSniffer();
    });
  }

  // TX da sirene — grava Low Duty Cycle (A12C/A12D) + tom (C1020000).
  var btnTx = document.getElementById('vcAdvBtnSireneTx');
  if (btnTx) {
    btnTx.addEventListener('click', async function (e) {
      e.preventDefault();
      await _vcAdvSaveSireneTone();
    });
  }
}

async function _vcAdvSaveLogger() {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return;
  var changed = 0, errors = 0;
  var pars = [
    { id: 'vcAdvEthDebugPort',    par: 'B1030000' },
    { id: 'vcAdvWifiDebugPort',   par: 'B1080000' },
    { id: 'vcAdvLoggerUrl',       par: 'E10E0000', str: true },
    { id: 'vcAdvLoggerPortEth',   par: 'B1120000' },
    { id: 'vcAdvLoggerPortWifi',  par: 'B1130000' },
    { id: 'vcAdvLoggerPortGprs',  par: 'B1140000' },
    { id: 'vcAdvLoggerMaxDays',   par: 'A1120000' }
  ];
  for (var i = 0; i < pars.length; i++) {
    var el = document.getElementById(pars[i].id);
    if (!el) continue;
    var v = (el.value || '').trim();
    if (!v) continue;
    var cmd = pars[i].str
      ? 'PAR ' + pars[i].par + ' "' + v + '"'
      : 'PAR ' + pars[i].par + ' ' + v;
    try {
      var r = await net.sendCommand(cmd);
      if (r && r.ok) changed++; else errors++;
    } catch (_) { errors++; }
  }
  // CMD 18 1 = remoto, CMD 18 0 = local
  var rem = document.getElementById('vcAdvLoggerRemote');
  var mode = rem && rem.checked ? '1' : '0';
  try {
    var rM = await net.sendCommand('CMD 18 ' + mode);
    if (rM && rM.ok) changed++;
  } catch (_) {}
  if (errors === 0) vcToast(VCi18n.t('sistema.card_saved', { n: changed }), 'success');
  else vcToast(VCi18n.t('sistema.card_save_partial', { ok: changed, err: errors }), 'warn');
}

async function _vcAdvSaveSniffer() {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) {
    vcToast('Sessão inativa — conecte à central primeiro.', 'warn');
    return;
  }
  var sel = document.querySelector('input[name="vcAdvSniffer"]:checked');
  if (!sel) { vcToast(VCi18n.t('avancado.sniffer_escolha'), 'warn'); return; }
  var map = { 'off': 0, 'cid': 124, 'only': 123, 'db': 125 };
  var v = map[sel.value];
  vcLogTs('Gravando PAR A1080000 = ' + v + ' (' + sel.value + ')…');
  try {
    var r = await net.sendCommand('PAR A1080000 ' + v);
    if (!r || !r.ok) {
      var errMsg = r && r.errorCode != null ? ('ERR ' + r.errorCode) : (r && r.body) || 'sem resposta';
      vcLogTs('Falha ao gravar PAR A1080000: ' + errMsg);
      vcToast(VCi18n.t('avancado.sniffer_falha') + ' (' + errMsg + ')', 'warn');
      return;
    }
    vcLogTs('PAR A1080000 gravado: ' + (r.body || ''));

    // Read-back para confirmar persistência (alguns firmwares aceitam o
    // comando mas resetam o valor ao ler).
    var rb = await net.sendCommand('PAR A1080000');
    var rbVal = null;
    if (rb && rb.ok) {
      var prb = _parseParResponse(rb.body);
      if (prb) rbVal = parseInt(prb.value, 10);
    }
    vcLogTs('Read-back PAR A1080000 = ' + (rbVal == null ? '?' : rbVal));
    if (rbVal === v) {
      vcToast(VCi18n.t('avancado.sniffer_ok'), 'success');
    } else {
      vcToast('Central aceitou o comando mas read-back devolveu ' + rbVal +
              ' (esperado ' + v + ') — provavelmente firmware não persiste este PAR.', 'warn', 6000);
    }
  } catch (err) {
    vcLogTs('Erro: ' + ((err && err.message) || err));
    vcToast(VCi18n.t('avancado.sniffer_falha'), 'warn');
  }
}

async function _vcAdvSaveSireneTone() {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return;

  // Low Duty Cycle: timeOn [1..255], timeOff [10..2550] (gravamos /10).
  var onEl  = document.getElementById('vcAdvSirTimeOn');
  var offEl = document.getElementById('vcAdvSirTimeOff');
  var on  = parseInt(onEl  && onEl.value, 10);
  var off = parseInt(offEl && offEl.value, 10);
  var sentLdc = false;
  if (!isNaN(on) && on >= 1 && on <= 255 && !isNaN(off) && off >= 10 && off <= 2550) {
    try {
      await net.sendCommand('PAR A12C0000 ' + on);
      await net.sendCommand('PAR A12D0000 ' + Math.floor(off / 10));
      sentLdc = true;
    } catch (_) {}
  }

  // Tom packed (32 bits) — só envia se TODOS os campos estiverem
  // preenchidos e Borda OU Rampa escolhidos para os 2 tons.
  var f1 = parseInt((document.getElementById('vcAdvSirFreq1') || {}).value, 10);
  var f2 = parseInt((document.getElementById('vcAdvSirFreq2') || {}).value, 10);
  var t1 = parseInt((document.getElementById('vcAdvSirTime1') || {}).value, 10);
  var t2 = parseInt((document.getElementById('vcAdvSirTime2') || {}).value, 10);
  var e1 = document.querySelector('input[name="vcAdvSirEdge1"]:checked');
  var e2 = document.querySelector('input[name="vcAdvSirEdge2"]:checked');

  if ([f1, f2, t1, t2].every(function (n) { return !isNaN(n) && n >= 0; }) && e1 && e2) {
    var ramp1 = e1.value === 'ramp' ? 1 : 0;
    var ramp2 = e2.value === 'ramp' ? 1 : 0;
    var tone = (f1 & 0x3F)
             | ((t1 & 0x1F) << 6)
             | (ramp1 << 11)
             | ((f2 & 0x3F) << 12)
             | ((t2 & 0x1F) << 18)
             | (ramp2 << 23);
    try {
      var r = await net.sendCommand('PAR C1020000 ' + tone);
      if (r && r.ok) {
        vcToast(VCi18n.t('avancado.sirene_ok'), 'success');
        return;
      }
    } catch (_) {}
  }
  if (sentLdc) vcToast(VCi18n.t('avancado.sirene_ldc_ok'), 'success');
  else vcToast(VCi18n.t('avancado.sirene_incompleto'), 'warn');
}

// Ctrl+Shift+click no header revela/esconde a aba Avançado.
// Importante: no macOS, Ctrl+click é tratado como botão direito (dispara
// contextmenu, não click). Por isso ouvimos os dois eventos.
function _vcAdvBindHotkey() {
  var header = document.querySelector('.vc-header');
  if (!header || header._vcAdvHotkey) return;
  header._vcAdvHotkey = true;

  function toggle(e) {
    if (!e.ctrlKey || !e.shiftKey) return;
    e.preventDefault();
    var tab = document.getElementById('vcSysTabAvancado');
    if (!tab) return;
    // Estado atual: aba está escondida se o display computado for 'none'.
    var isHidden = (getComputedStyle(tab).display === 'none');
    tab.style.display = isHidden ? '' : 'none';
    vcToast(VCi18n.t(isHidden ? 'avancado.tab_visivel' : 'avancado.tab_oculta'),
            'info', 2200);
  }

  header.addEventListener('click', toggle);
  header.addEventListener('contextmenu', toggle);
}

/* ═════════════════════════════════════════════════════════════
   EXPORTAR / IMPORTAR configurações da central (aba Alarme)
   ═════════════════════════════════════════════════════════════
   "Backup" = exportação SELETIVA das seções marcadas, salva em
   userData/backups/. Cenário: antes de mexer na config você gera um
   backup, e se algo der errado, restaura via "Aplicar".

   NÃO confundir com "clone" (varredura completa da central pra
   substituí-la por outra) — ver _vcAlarmExportBackup abaixo.

   Schema: vetticonfig-backup-1 (gerenciado pelo main em
   src/main/services/backups.js). Cada checkbox `.vc-backup-sec`
   mapeia pra um conjunto de PARs em _VC_BACKUP_PAR_GROUPS.
   ═════════════════════════════════════════════════════════════ */

// Mapa seção UI → lista de PARs que pertencem àquela seção.
// As seções "usuario", "agendamento", "dispositivos" usam comandos
// específicos (USER/AGENDA/BD), não PAR — ficam de fora desta v1.
var _VC_BACKUP_PAR_GROUPS = {
  identificacao: ['E1020000', 'E1010000', 'E1110000'],
  contactid:     ['B1060000', 'A1070000', 'E1060000', 'B1050000',
                  'E10B0000', 'B1090000', 'E9020001', 'E9020002',
                  'B1070000'],
  rede:          ['910A0000', 'F1010000', 'F1030000', 'F1020000',
                  'F1040000', '61070000', '61050000', '61060000',
                  'E1070000', 'E1080000', 'E1090000', 'E10A0000',
                  '91110000'],
  supervisao:    ['91130000', 'A11A0000', '912A0000', '912B0000',
                  '912C0000', '912D0000', '91170000', 'A1100000',
                  '91140000', '91150000', '91160000', '91240000',
                  '911C0000', '911D0000', '911E0000', '91200000',
                  'A1150000']
};

async function _vcAlarmExportBackup() {
  var nameInput = document.getElementById('vcSysCloneNome');
  var name = (nameInput && nameInput.value || '').trim();
  if (!name) {
    vcToast(VCi18n.t('alarme.nome_obrigatorio') || 'Informe um nome para a configuração.', 'warn');
    if (nameInput) nameInput.focus();
    return;
  }
  // Coleta seções marcadas (somente as suportadas via PAR genérico).
  var sections = [];
  document.querySelectorAll('.vc-backup-sec:checked').forEach(function (cb) {
    if (_VC_BACKUP_PAR_GROUPS[cb.value]) sections.push(cb.value);
  });
  if (sections.length === 0) {
    vcToast(VCi18n.t('alarme.selecione_sec') || 'Selecione ao menos uma seção pra exportar.', 'warn');
    return;
  }

  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return;

  // Coleta lista plana de PARs únicos
  var pars = [];
  sections.forEach(function (s) {
    (_VC_BACKUP_PAR_GROUPS[s] || []).forEach(function (p) {
      if (pars.indexOf(p) === -1) pars.push(p);
    });
  });

  vcToast(VCi18n.t('alarme.exportando', { n: pars.length }) || 'Lendo ' + pars.length + ' PARs…', 'info', 0,
          { id: 'backup-export', persist: true });

  var parsData = {};
  var errors   = 0;
  for (var i = 0; i < pars.length; i++) {
    try {
      var r = await net.sendCommand('PAR ' + pars[i]);
      if (r && r.ok) {
        var parsed = _parseParResponse(r.body);
        if (parsed) parsData[pars[i]] = parsed.value;
        else errors++;
      } else errors++;
    } catch (_) { errors++; }
  }

  var payload = {
    schema:    'vetticonfig-clone-1',
    createdAt: new Date().toISOString(),
    name:      name,
    source: {
      centralName: (document.getElementById('vcCentralName') || {}).textContent || '',
      model:       (document.getElementById('vcCentralModel') || {}).textContent || '',
      mac:         ((document.getElementById('vcCentralMac') || {}).textContent || '').replace(/^MAC:\s*/i, '')
    },
    sections: sections,
    pars:     parsData
  };

  try {
    var saveRes = await window.vettiAPI.backups.save(payload);
    if (saveRes && saveRes.ok) {
      var msg = VCi18n.t('alarme.exportado', { name: name, n: Object.keys(parsData).length })
                || 'Configuração "' + name + '" salva (' + Object.keys(parsData).length + ' PARs).';
      if (errors > 0) msg += ' ⚠ ' + errors + ' PARs falharam.';
      vcToast(msg, errors > 0 ? 'warn' : 'success', 4000, { id: 'backup-export' });
      if (nameInput) nameInput.value = '';
      await _vcAlarmListBackups();   // refresh
    } else {
      vcToast(VCi18n.t('alarme.exportar_falha') || 'Falha ao salvar.', 'warn', 4000, { id: 'backup-export' });
    }
  } catch (err) {
    vcToast((err && err.message) || 'Erro ao salvar.', 'warn', 4000, { id: 'backup-export' });
  }
}

async function _vcAlarmListBackups() {
  var host = document.getElementById('vcSysSavedClones');
  if (!host) return;
  if (!window.vettiAPI || !window.vettiAPI.backups) return;
  try {
    var items = await window.vettiAPI.backups.list();
    if (!items || items.length === 0) {
      host.innerHTML = '<p class="text-muted small m-0 p-2" data-i18n="alarme.sem_clones">Nenhuma configuração salva localmente.</p>';
      if (typeof VCi18n !== 'undefined' && VCi18n && VCi18n.apply) VCi18n.apply();
      return;
    }
    host.innerHTML = items.map(_vcAlarmBackupRowHTML).join('');
  } catch (err) {
    host.innerHTML = '<p class="text-muted small m-0 p-2">' + _vcEscape((err && err.message) || '') + '</p>';
  }
}

function _vcAlarmBackupRowHTML(item) {
  var dt = '';
  try { dt = new Date(item.createdAt).toLocaleString('pt-BR'); } catch (_) {}
  var src = item.source || {};
  return '<div class="vc-backup-row" data-file="' + _vcEscape(item.file) + '">' +
    '<div class="vc-backup-info">' +
      '<div class="vc-backup-name">' + _vcEscape(item.name) + '</div>' +
      '<div class="vc-backup-meta">' +
        _vcEscape(dt) + ' · ' +
        item.sections.length + ' ' + (VCi18n.t('alarme.secoes') || 'seções') + ' · ' +
        item.parCount + ' PARs · ' +
        _vcEscape(src.centralName || src.mac || '') +
      '</div>' +
    '</div>' +
    '<div class="vc-backup-actions">' +
      '<button class="vc-btn sm" data-act="apply" title="' + (VCi18n.t('alarme.aplicar_tip') || 'Aplicar nesta central') + '">' +
        '<i class="bi bi-arrow-down-square"></i></button>' +
      '<button class="vc-btn sm outline" data-act="export" title="' + (VCi18n.t('alarme.exportar_tip') || 'Salvar arquivo') + '">' +
        '<i class="bi bi-download"></i></button>' +
      '<button class="vc-btn sm danger" data-act="delete" title="' + (VCi18n.t('alarme.excluir_tip') || 'Excluir') + '">' +
        '<i class="bi bi-trash3"></i></button>' +
    '</div>' +
  '</div>';
}

function _vcAlarmBindBackupList() {
  var host = document.getElementById('vcSysSavedClones');
  if (!host || host._vcBound) return;
  host._vcBound = true;
  host.addEventListener('click', async function (e) {
    var btn = e.target.closest('button[data-act]');
    if (!btn) return;
    var row = btn.closest('.vc-backup-row');
    var file = row && row.dataset.file;
    if (!file) return;
    var act = btn.dataset.act;
    if (act === 'apply')       await _vcAlarmApplyBackup(file);
    else if (act === 'export') await _vcAlarmExportFile(file);
    else if (act === 'delete') await _vcAlarmDeleteBackup(file);
  });
}

async function _vcAlarmApplyBackup(file) {
  if (!window.vettiAPI || !window.vettiAPI.backups) return;
  var data;
  try { data = await window.vettiAPI.backups.load(file); }
  catch (err) { vcToast((err && err.message) || 'Erro', 'warn'); return; }

  var parCount = Object.keys(data.pars || {}).length;
  var msg = (VCi18n.t('alarme.confirmar_aplicar', { n: parCount, name: data.name })
            || 'Aplicar "' + data.name + '" (' + parCount + ' PARs) na central conectada?\nEsta operação sobrescreve as configurações atuais.');
  if (!confirm(msg)) return;

  var net = window.vettiAPI.network;
  if (!net) return;
  vcToast(VCi18n.t('alarme.aplicando', { n: parCount }) || 'Aplicando ' + parCount + ' PARs…', 'info', 0,
          { id: 'backup-apply', persist: true });

  var ok = 0, err = 0;
  var keys = Object.keys(data.pars);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var rawVal = data.pars[k];
    var r;
    try {
      // Tenta usar o pipeline normal de gravação: se houver um campo
      // [data-par="<key>"] no DOM da tela Sistema, _vcWriteParam infere
      // tipo, valida range e formata aspas/escape corretamente.
      var el = document.querySelector('[data-par="' + k + '"]');
      if (el) {
        var displayVal = _vcParParse(k, rawVal);
        _vcApplyParToField(el, displayVal);
        r = await _vcWriteParam(k, displayVal, el);
      } else {
        // Fallback sem DOM: heurística numérico vs string. Strings
        // precisam de aspas mesmo sem espaço (regra do CtrlMain.java).
        var raw = String(rawVal);
        var isNum = /^-?\d+$/.test(raw);
        var cmd = 'PAR ' + k + ' ' + (isNum ? raw : '"' + raw.replace(/"/g, '\\"') + '"');
        r = await net.sendCommand(cmd);
      }
      if (r && r.ok) ok++; else err++;
    } catch (_) { err++; }
  }

  var resultMsg = VCi18n.t('alarme.aplicado', { ok: ok, err: err })
                  || 'Aplicado: ' + ok + ' OK, ' + err + ' falhas.';
  vcToast(resultMsg, err > 0 ? 'warn' : 'success', 5000, { id: 'backup-apply' });
}

async function _vcAlarmExportFile(file) {
  if (!window.vettiAPI || !window.vettiAPI.backups) return;
  try {
    var r = await window.vettiAPI.backups.exportAs(file);
    if (r && r.ok) vcToast(VCi18n.t('alarme.salvo_em', { path: r.path }) || 'Salvo: ' + r.path, 'success', 4000);
    else if (r && r.canceled) { /* silencioso */ }
    else vcToast(VCi18n.t('alarme.exportar_falha') || 'Falha ao exportar.', 'warn');
  } catch (err) {
    vcToast((err && err.message) || 'Erro', 'warn');
  }
}

async function _vcAlarmDeleteBackup(file) {
  var msg = (VCi18n.t('alarme.confirmar_excluir_clone', { file: file })
            || 'Excluir "' + file + '"?');
  if (!confirm(msg)) return;
  try {
    var r = await window.vettiAPI.backups.remove(file);
    if (r && r.ok) {
      vcToast(VCi18n.t('alarme.excluido') || 'Excluído.', 'success', 2500);
      await _vcAlarmListBackups();
    } else {
      vcToast((r && r.error) || 'Erro', 'warn');
    }
  } catch (err) {
    vcToast((err && err.message) || 'Erro', 'warn');
  }
}

async function _vcAlarmImportFile() {
  if (!window.vettiAPI || !window.vettiAPI.backups) return;
  try {
    var r = await window.vettiAPI.backups.importFile();
    if (r && r.ok) {
      vcToast(VCi18n.t('alarme.importado', { name: r.name }) || 'Importado: ' + r.name, 'success', 3000);
      await _vcAlarmListBackups();
    } else if (r && r.canceled) {
      /* silencioso */
    } else {
      vcToast((r && r.error) || 'Falha ao importar.', 'warn');
    }
  } catch (err) {
    vcToast((err && err.message) || 'Erro', 'warn');
  }
}

function _vcAlarmBindBackupButtons() {
  var btnSave = document.getElementById('vcSysBtnSalvarClone');
  if (btnSave && !btnSave._vcBound) {
    btnSave._vcBound = true;
    btnSave.addEventListener('click', function (e) { e.preventDefault(); _vcAlarmExportBackup(); });
  }
  var btnImport = document.getElementById('vcSysBtnImportarJson');
  if (btnImport && !btnImport._vcBound) {
    btnImport._vcBound = true;
    btnImport.addEventListener('click', function (e) { e.preventDefault(); _vcAlarmImportFile(); });
  }
  _vcAlarmBindBackupList();
}

/* ═════════════════════════════════════════════════════════════
   CLONE — varredura completa pra substituir a central
   ═════════════════════════════════════════════════════════════
   Diferente do BACKUP (que é seletivo), o CLONE coleta TUDO que
   pode ser configurado na central:
     • PARs: união do conjunto de sistema.html + particao.html
       (lê na ordem das telas pra reaproveitar parsing tipado)
     • USER table: bitmap PAR 610C0000 → USER Idx=N pros slots 'O'
     • AGENDA: itera AGENDA 1..64, encerra em Stat=LIV ou ERR 27
     • BD (dispositivos): BDX I + BDX + até ERR 27

   Armazena o BODY CRU de cada registro USER/AGENDA/BD — isso deixa
   o restore trivial: replay do mesmo body. PARs são guardados
   key→value (parsing já feito) porque o write usa `PAR <k> <v>`.

   Limitação conhecida: registros BD reaplicados não fazem
   pareamento RF — o dispositivo físico precisa ser pareado
   manualmente no painel. O JSON guarda o histórico mas o restore
   pula a aplicação dos BDs.
   ═════════════════════════════════════════════════════════════ */

// Conjunto completo de PARs configuráveis (união sistema + partição).
// Manter sincronizado com data-par em sistema.html + particao.html.
var _VC_CLONE_ALL_PARS = [
  // sistema.html (Identificação, Contact ID, Rede, Supervisão, Alarme, Usuário, Avançado)
  '61050000','61060000','61070000','91050000','910A0000','91100000','91110000',
  '91130000','91140000','91150000','91160000','91170000','911A0000','911C0000',
  '911D0000','911E0000','911F0000','91200000','91210000','91230000','91240000',
  '91250000','912A0000','912B0000','912C0000','912D0000','A1070000','A1100000',
  'A1120000','A1150000','A11A0000','A12C0000','A12D0000','B1030000','B1050000',
  'B1060000','B1070000','B1080000','B1090000','B1120000','B1130000','B1140000',
  'B1150000','B1160000','E1010000','E1020000','E1060000','E1070000','E1080000',
  'E1090000','E10A0000','E10B0000','E10E0000','E1100000','E1110000','E9020001',
  'E9020002','F1010000','F1020000','F1030000','F1040000','F1060000','F1070000',
  // particao.html (extra)
  '91060000','91080000','91260000','91270000','91280000','91290000','912E0000',
  'A1030000','A1040000','A1050000','A1060000','A1090000','A10E0000','A10F0000',
  'A1110000','A1160000','A1190000','A12E0000'
];

async function _vcCloneCollectFull() {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) throw new Error('Sem sessão ativa.');

  // Total: 82 PARs + bitmap user + N users + 64 agenda slots + ~50 BD (estimado).
  // Atualizamos o toast a cada bloco com mensagem clara.
  var pars = {};
  var users = [];
  var agenda = [];
  var devices = [];
  var skipped = 0;

  // 1) PARs
  vcToast(VCi18n.t('alarme.clone_lendo_pars', { n: _VC_CLONE_ALL_PARS.length })
          || 'Lendo ' + _VC_CLONE_ALL_PARS.length + ' PARs…', 'info', 0,
          { id: 'clone-export', persist: true });
  for (var i = 0; i < _VC_CLONE_ALL_PARS.length; i++) {
    var k = _VC_CLONE_ALL_PARS[i];
    try {
      var r = await net.sendCommand('PAR ' + k);
      if (r && r.ok) {
        var p = _parseParResponse(r.body);
        if (p) pars[k] = p.value; else skipped++;
      } else { skipped++; }
    } catch (_) { skipped++; }
  }

  // 2) Usuários: bitmap (PAR 610C0000) + USER Idx por slot 'O'
  vcToast(VCi18n.t('alarme.clone_lendo_users') || 'Lendo usuários…', 'info', 0,
          { id: 'clone-export', persist: true });
  var slots = '';
  try {
    var rs = await net.sendCommand('PAR 610C0000');
    if (rs && rs.ok) {
      var ps = _parseParResponse(rs.body);
      if (ps && ps.value) slots = ps.value;
    }
  } catch (_) {}
  for (var s = 0; s < slots.length; s++) {
    if (slots.charAt(s) !== 'O') continue;
    var uIdx = s + 1;
    try {
      var ru = await net.sendCommand('USER Idx=' + uIdx);
      if (ru && ru.ok) users.push({ idx: uIdx, raw: ru.body });
    } catch (_) {}
  }

  // 3) Agenda: itera 1..64, encerra em LIV/ERR27
  vcToast(VCi18n.t('alarme.clone_lendo_agenda') || 'Lendo agendamentos…', 'info', 0,
          { id: 'clone-export', persist: true });
  var consec = 0;
  for (var ai = 1; ai <= _VC_AGENDA_MAX; ai++) {
    try {
      var ra = await net.sendCommand('AGENDA ' + ai);
      if (!ra || !ra.ok) {
        if (ra && ra.errorCode === 27) break;
        consec++; if (consec >= 3) break;
        continue;
      }
      consec = 0;
      // Guarda registros OK; LIV indica fim natural da lista
      if (/\bStat:LIV\b/i.test(ra.body)) break;
      if (/\bStat:OK\b/i.test(ra.body)) {
        agenda.push({ idx: ai, raw: ra.body });
      }
    } catch (_) { consec++; if (consec >= 3) break; }
  }

  // 4) Dispositivos: BDX I + BDX + até ERR 27
  vcToast(VCi18n.t('alarme.clone_lendo_bd') || 'Lendo dispositivos…', 'info', 0,
          { id: 'clone-export', persist: true });
  try {
    var rb = await net.sendCommand('BDX I');
    if (rb && rb.ok) {
      devices.push({ raw: rb.body });
      for (var j = 0; j < 1024; j++) {
        var rb2;
        try { rb2 = await net.sendCommand('BDX +'); } catch (_) { break; }
        if (!rb2) break;
        if (!rb2.ok) { if (rb2.errorCode === 27) break; continue; }
        devices.push({ raw: rb2.body });
      }
    }
  } catch (_) {}

  return {
    schema:    'vetticonfig-clone-1',
    createdAt: new Date().toISOString(),
    source: {
      centralName: (document.getElementById('vcCentralName') || {}).textContent || '',
      model:       (document.getElementById('vcCentralModel') || {}).textContent || '',
      mac:         ((document.getElementById('vcCentralMac') || {}).textContent || '').replace(/^MAC:\s*/i, '')
    },
    counts: {
      pars:    Object.keys(pars).length,
      users:   users.length,
      agenda:  agenda.length,
      devices: devices.length,
      skipped: skipped
    },
    pars:    pars,
    users:   users,
    agenda:  agenda,
    devices: devices
  };
}

async function _vcAlarmExportClone() {
  if (!window.vettiAPI || !window.vettiAPI.clones) return;
  try {
    var payload = await _vcCloneCollectFull();
    var r = await window.vettiAPI.clones.exportToFile(payload);
    if (r && r.ok) {
      var msg = VCi18n.t('alarme.clone_exportado', {
        path: r.path,
        pars: payload.counts.pars,
        users: payload.counts.users,
        agenda: payload.counts.agenda,
        devices: payload.counts.devices
      }) || 'Clone exportado: ' + r.path;
      vcToast(msg, payload.counts.skipped > 0 ? 'warn' : 'success', 6000,
              { id: 'clone-export' });
    } else if (r && r.canceled) {
      vcToast(VCi18n.t('common.canceled') || 'Cancelado.', 'info', 2000,
              { id: 'clone-export' });
    } else {
      vcToast((r && r.error) || 'Falha ao gerar clone.', 'warn', 4000,
              { id: 'clone-export' });
    }
  } catch (err) {
    vcToast((err && err.message) || 'Erro ao gerar clone.', 'warn', 4000,
            { id: 'clone-export' });
  }
}

async function _vcAlarmImportClone() {
  if (!window.vettiAPI || !window.vettiAPI.clones) return;
  var net = window.vettiAPI.network;
  if (!net) return;

  var r;
  try { r = await window.vettiAPI.clones.importFromFile(); }
  catch (err) { vcToast((err && err.message) || 'Erro', 'warn'); return; }
  if (!r || !r.ok) {
    if (r && r.canceled) return;
    vcToast((r && r.error) || 'Falha ao importar.', 'warn');
    return;
  }
  var data = r.data;
  var c = data.counts || {};
  var msg = VCi18n.t('alarme.clone_confirmar', {
    pars: c.pars || Object.keys(data.pars || {}).length,
    users: c.users || (data.users || []).length,
    agenda: c.agenda || (data.agenda || []).length,
    source: (data.source && (data.source.centralName || data.source.mac)) || ''
  }) || ('Aplicar clone (' + (c.pars || 0) + ' PARs, ' + (c.users || 0) + ' usuários, ' +
         (c.agenda || 0) + ' agendamentos) na central conectada?\n' +
         'Esta operação SOBRESCREVE TODAS as configurações atuais.\n' +
         'Dispositivos não são reaplicados (requer pareamento RF).');
  if (!confirm(msg)) return;

  vcToast(VCi18n.t('alarme.clone_aplicando') || 'Aplicando clone…', 'info', 0,
          { id: 'clone-apply', persist: true });

  var okPars = 0, errPars = 0;
  var keys = Object.keys(data.pars || {});
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var raw = data.pars[k];
    try {
      var el = document.querySelector('[data-par="' + k + '"]');
      var resp;
      if (el) {
        var displayVal = _vcParParse(k, raw);
        resp = await _vcWriteParam(k, displayVal, el);
      } else {
        var sraw = String(raw);
        var isNum = /^-?\d+$/.test(sraw);
        resp = await net.sendCommand('PAR ' + k + ' ' +
                 (isNum ? sraw : '"' + sraw.replace(/"/g, '\\"') + '"'));
      }
      if (resp && resp.ok) okPars++; else errPars++;
    } catch (_) { errPars++; }
  }

  // USERS — replay raw como comando de gravação
  var okU = 0, errU = 0;
  var users = data.users || [];
  for (var u = 0; u < users.length; u++) {
    try {
      var ru = await net.sendCommand('USER ' + users[u].raw.replace(/^USER\s+/i, ''));
      if (ru && ru.ok) okU++; else errU++;
    } catch (_) { errU++; }
  }

  // AGENDA — mesma técnica
  var okA = 0, errA = 0;
  var ag = data.agenda || [];
  for (var aIdx = 0; aIdx < ag.length; aIdx++) {
    try {
      var ra = await net.sendCommand('AGENDA ' + ag[aIdx].raw.replace(/^AGENDA\s+/i, ''));
      if (ra && ra.ok) okA++; else errA++;
    } catch (_) { errA++; }
  }

  var msg2 = VCi18n.t('alarme.clone_aplicado', {
    okPars: okPars, errPars: errPars,
    okU: okU, errU: errU,
    okA: okA, errA: errA
  }) || ('Clone aplicado — PARs: ' + okPars + '/' + (okPars + errPars) +
         ' · Usuários: ' + okU + '/' + (okU + errU) +
         ' · Agenda: ' + okA + '/' + (okA + errA));
  var hasErr = errPars > 0 || errU > 0 || errA > 0;
  vcToast(msg2, hasErr ? 'warn' : 'success', 8000, { id: 'clone-apply' });
}

function _vcAlarmBindCloneButtons() {
  var btnGerar = document.getElementById('vcSysBtnGerarClone');
  if (btnGerar && !btnGerar._vcBound) {
    btnGerar._vcBound = true;
    btnGerar.addEventListener('click', function (e) { e.preventDefault(); _vcAlarmExportClone(); });
  }
  var btnImp = document.getElementById('vcSysBtnImportarClone');
  if (btnImp && !btnImp._vcBound) {
    btnImp._vcBound = true;
    btnImp.addEventListener('click', function (e) { e.preventDefault(); _vcAlarmImportClone(); });
  }
}

// Wire-up de tabs e botões da tela Sistema.
function _vcSysBindEvents() {
  // Desconectar (mesmo da Status)
  var btnDesc = document.getElementById('vcBtnDesconectar');
  if (btnDesc) btnDesc.addEventListener('click', function (e) { e.preventDefault(); vcDisconnect(); });

  // Tabs
  document.querySelectorAll('.vc-sys-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.dataset.tab;
      document.querySelectorAll('.vc-sys-tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.vc-sys-panel').forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      var panel = document.getElementById(target);
      if (panel) {
        panel.classList.add('active');
        // Lazy-load: só carrega da central na primeira ativação.
        if (panel.dataset.loaded === '0' && _vcSysIsProgrammed(target)) {
          _vcLoadPanel(panel);
        }
        // Aba Rede: dispara STAT 4 para preencher os campos "Valores em uso"
        // do GPRS (que não vêm de PAR e sim de STAT 4).
        if (target === 'vcSysRede') _vcRefreshStatNetwork();

        // Aba Dispositivos: carrega lista do BD da central
        if (target === 'vcSysDispositivos' && panel.dataset.loaded === '0') {
          _vcDispLoad();
        }
        // Aba Usuário: carrega lista de usuários da central
        if (target === 'vcSysUsuario' && panel.dataset.loaded === '0') {
          _vcUserLoad();
        }
        // Aba Agendamento: carrega lista de agendamentos
        if (target === 'vcSysAgendamento' && panel.dataset.loaded === '0') {
          _vcAgendaLoad();
        }
        // Aba Feriados: carrega banco de feriados da central
        if (target === 'vcSysFeriados' && panel.dataset.loaded === '0') {
          _vcFeriadoLoad();
        }
        // Tela Partição → aba Dispositivos: carrega lista filtrada pela
        // partição corrente (_vcParCurrent setado em vcParticaoInit).
        if (target === 'vcParDispositivos' && panel.dataset.loaded === '0') {
          _vcParDispLoad(_vcParCurrent);
        }
        // Aba Buffer: carrega eventos
        if (target === 'vcSysBuffer' && panel.dataset.loaded === '0') {
          _vcBufferLoad();
        }
        // Aba Avançado: carrega PARs + sniffer + sirene
        if (target === 'vcSysAvancado' && panel.dataset.loaded === '0') {
          _vcAdvLoad();
        }
        // Aba Alarme: refresca a lista de snapshots salvos
        if (target === 'vcSysAlarme') {
          _vcAlarmListBackups();
        }
      }
    });
  });

  // Botões Exportar/Importar configurações + Clones (aba Alarme).
  _vcAlarmBindBackupButtons();
  _vcAlarmBindCloneButtons();
  _vcBindContactPriorityRadios();

  // Botões Cancelar/Gravar dos cards
  document.querySelectorAll('.vc-sys-panel [data-action]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var card = btn.closest('.vc-card[data-card]');
      if (!card) return;
      if (btn.dataset.action === 'cancel') _vcSysCancelCard(card);
      else if (btn.dataset.action === 'save') _vcSysSaveCard(card);
    });
  });

  // Botão Editar do "Horário variável" (aba Supervisão).
  var btnEditHr = document.getElementById('vcSupHorarioEditBtn');
  if (btnEditHr) {
    btnEditHr.addEventListener('click', function (e) {
      e.preventDefault();
      var disp = document.getElementById('vcSupHorarioVar');
      var current = disp ? disp.textContent.trim() : '00:00';
      vcOpenTimePicker(current, function (newTime) {
        if (disp) disp.textContent = newTime;
        // TODO(usuário): mapear este horário para o parâmetro de retransmissão
        // 24h da central (chave PAR ainda não identificada). Quando o usuário
        // confirmar a key, ligar via data-par no vc-time-display ou um campo
        // oculto e o save flow normal levará pra central.
        vcLogTs(VCi18n.t('sistema.horario_atualizado', { time: newTime }));
      });
    });
  }
}

// Quais abas estão programadas. As demais ficam só com placeholder.
// Abas que usam o pipeline genérico de PARs (_vcLoadPanel lê data-par).
// Abas com lógica de carregamento própria (Dispositivos, Usuário,
// Agendamento, Buffer — usam comandos USER/AGENDA/BD/LOGX) NÃO ficam aqui.
function _vcSysIsProgrammed(panelId) {
  return ['vcSysContactId', 'vcSysRede', 'vcSysSupervisao', 'vcSysAlarme'].indexOf(panelId) >= 0;
}

// Ponto de entrada da tela Sistema.
async function vcSistemaInit() {
  if (!document.querySelector('.vc-sys-tabs')) return;  // não é a tela Sistema
  _vcStatusFillFromSession();   // reusa: header (nome/MAC/IP) vem do storage
  _vcSysBindEvents();
  _vcAdvBindHotkey();    // Ctrl+Shift+click no header revela aba Avançado
  _vcAdvBindButtons();   // Bind eager dos botões Gravar/TX/Limpar da aba Avançado
                          // (não esperar a aba ser aberta — evita race de listener).
  _vcDispInstallStatusListener();  // escuta [N6]/[N7] pra Bat/Tamper/RSSI/Stat
  // Render dos 4 boxes de permissões na aba Usuário (esqueleto vazio).
  vcRenderUserPermBoxes();
  // Sequencializa o boot: header → painel → keep-alive. Em conexão remota
  // (TCP via relay) a sessão tem latência alta; disparar tudo em paralelo
  // causa timeouts intermitentes. Serializando, garantimos que cada
  // comando recebe sua resposta antes do próximo.
  await _vcSysQuickHeader();

  // Deep-link: `sistema.html?disp=N#vcSysDispositivos` (vindo da Partição
  // pelo botão "Editar atributos completos"). Pula o load do painel
  // default (Contact ID) e vai DIRETO pra Dispositivos.
  var dispParam = null;
  try { dispParam = new URLSearchParams(window.location.search).get('disp'); } catch (_) {}

  if (dispParam) {
    // Ativa programaticamente a aba Dispositivos (mais confiável que .click()).
    document.querySelectorAll('.vc-sys-tab').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.vc-sys-panel').forEach(function (p) { p.classList.remove('active'); });
    var tabBtn   = document.querySelector('.vc-sys-tab[data-tab="vcSysDispositivos"]');
    var dispPan  = document.getElementById('vcSysDispositivos');
    if (tabBtn)  tabBtn.classList.add('active');
    if (dispPan) {
      dispPan.classList.add('active');
      if (dispPan.dataset.loaded === '0') {
        try { await _vcDispLoad(); } catch (_) {}
      }
      var idx = parseInt(dispParam, 10);
      if (!isNaN(idx) && _vcDispCache[idx]) {
        _vcDispSelectItem(idx);
        var row = document.querySelector('.vc-disp-row[data-idx="' + idx + '"]');
        if (row) {
          row.style.background = 'rgba(0,118,203,.10)';
          row.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
    }
  } else {
    // Boot normal: carrega o painel ativo default (Contact ID).
    var first = document.querySelector('.vc-sys-panel.active');
    if (first && first.dataset.loaded === '0' && _vcSysIsProgrammed(first.id)) {
      await _vcLoadPanel(first);
    }
    if (first && first.id === 'vcSysAlarme') _vcAlarmListBackups();
  }

  _vcStartKeepAlive();
}

// Render dos 4 boxes 2x2 da aba Usuário: Arme | Desarme / Pânico | PGM
// Cada um tem 6 checkboxes de partição + 7 checkboxes de dias + 2 inputs de hora.
function vcRenderUserPermBoxes() {
  var container = document.getElementById('vcUserPermBoxes');
  if (!container) return;
  var groups = [
    { key: 'armar',    label: 'usuario.arme'    },
    { key: 'desarmar', label: 'usuario.desarme' },
    { key: 'panico',   label: 'usuario.panico'  },
    { key: 'pgm',      label: 'usuario.pgm'     }
  ];
  var dias = ['dom','seg','ter','qua','qui','sex','sab'];
  container.innerHTML = '';
  for (var i = 0; i < groups.length; i++) {
    var g = groups[i];
    var col = document.createElement('div');
    col.className = 'col-md-6';
    var inner = '';
    inner += '<div class="vc-card vc-card-inner">';
    inner +=   '<div class="vc-card-header"><span data-i18n="' + g.label + '">' + g.key + '</span></div>';
    inner +=   '<div class="vc-card-body py-2">';
    // Partições
    inner +=     '<div class="d-flex gap-2 flex-wrap mb-2">';
    for (var p = 1; p <= 6; p++) {
      inner +=     '<label class="form-check m-0"><input type="checkbox" class="form-check-input vc-user-p" data-perm="' + g.key + '" data-p="' + p + '"><span class="small">P' + p + '</span></label>';
    }
    inner +=     '</div>';
    inner +=     '<div class="small text-muted mb-1" data-i18n="usuario.dias_permitidos">Dias permitidos</div>';
    inner +=     '<div class="d-flex gap-1 flex-wrap mb-2">';
    for (var d = 0; d < dias.length; d++) {
      inner +=     '<label class="form-check m-0"><input type="checkbox" class="form-check-input vc-user-d" data-perm="' + g.key + '" data-d="' + dias[d] + '"><span class="small" data-i18n="dias.' + dias[d] + '">' + dias[d] + '</span></label>';
    }
    inner +=     '</div>';
    inner +=     '<div class="row g-2">';
    inner +=       '<div class="col-6"><label class="vc-label-sm" data-i18n="usuario.h_inicial">Horário inicial:</label><input class="vc-input" type="time" data-perm="' + g.key + '" data-h="ini" value="00:00"></div>';
    inner +=       '<div class="col-6"><label class="vc-label-sm" data-i18n="usuario.h_final">Horário final:</label><input class="vc-input" type="time" data-perm="' + g.key + '" data-h="fim" value="23:59"></div>';
    inner +=     '</div>';
    inner +=   '</div>';
    inner += '</div>';
    col.innerHTML = inner;
    container.appendChild(col);
  }
  // Aplica i18n nos elementos recém-injetados.
  if (typeof VCi18n !== 'undefined' && typeof VCi18n.apply === 'function') VCi18n.apply();
}

async function _vcSysQuickHeader() {
  var net = window.vettiAPI && window.vettiAPI.network;
  if (!net) return;
  try {
    var rid = await net.sendCommand('ID');
    if (rid && rid.ok) {
      var idInfo = _parseId(rid.body);
      if (idInfo.nome) vcSet('vcCentralName', idInfo.nome);
      if (idInfo.mac)  vcSet('vcCentralMac', 'MAC: ' + idInfo.mac);
      // Em conexão remota a central retorna IP:0.0.0.0 — usa PAR 71010000
      // (IP em uso da ethernet) como fallback. Mesmo comportamento da Status.
      if (idInfo.ip && idInfo.ip !== '0.0.0.0') {
        vcSet('vcCentralIp', 'IP: ' + idInfo.ip);
      } else {
        try {
          var rIp = await net.sendCommand('PAR 71010000');
          if (rIp && rIp.ok) {
            var p = _parseParResponse(rIp.body);
            if (p && p.value && p.value !== '0.0.0.0') {
              vcSet('vcCentralIp', 'IP: ' + p.value);
            } else {
              vcSet('vcCentralIp', 'IP: ---');
            }
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
  try {
    var rinfo = await net.sendCommand('INFO');
    if (rinfo && rinfo.ok) {
      vcSet('vcCentralModel', _parseInfo(rinfo.body));
      var mvHdr = _parseCentralModelVersion(rinfo.body);
      _vcCentralMod = mvHdr.mod;
      _vcCentralVer = mvHdr.version;
    }
  } catch (_) {}
}

/* ═════════════════════════════════════════════════════════════
   TELA PARTIÇÃO (1-6)
   Reusa todo o pipeline de PAR (carregar/cancelar/gravar) do
   módulo Sistema. Apenas adapta as tabs internas (#vcParAlarme...)
   para os mesmos handlers (data-tab, data-action).
   ═════════════════════════════════════════════════════════════ */
// Partição atualmente exibida (1..6). Setada por vcParticaoInit a partir
// do query string ?n=X. Usada pelo _vcParDispLoad pra filtrar dispositivos.
var _vcParCurrent = null;
var _vcParDispSelected = null;

async function vcParticaoInit(n) {
  if (!document.querySelector('.vc-sys-tabs')) return;
  _vcParCurrent = parseInt(n, 10) || 1;
  _vcStatusFillFromSession();
  _vcSysBindEvents();
  _vcParDispBindEvents();          // binds próprios da aba Dispositivos
  _vcDispInstallStatusListener();  // escuta [N6]/[N7] pra Bat/Tamper/RSSI/Stat
  await _vcSysQuickHeader();
  var first = document.querySelector('.vc-sys-panel.active');
  if (first && first.dataset.loaded === '0') {
    if (first.id === 'vcParDispositivos') {
      await _vcParDispLoad(_vcParCurrent);
    } else {
      await _vcLoadPanel(first);
    }
  }
  _vcStartKeepAlive();
}

/* ═════════════════════════════════════════════════════════════
   PARTIÇÃO → DISPOSITIVOS
   ═════════════════════════════════════════════════════════════
   Lista os dispositivos cuja bitmask de partição (`d.p`) tem o bit
   da partição corrente marcado. Reusa o _vcDispCache do módulo
   Sistema → Dispositivos pra evitar duplo BDX (se a tela Sistema já
   foi visitada, o cache já está populado; senão carregamos aqui).

   Form de edição (Fase 1): só nome + bloco de status (bat/tamper/
   rssi/RX) somente leitura. Funções de zona, grupos pareadas e
   monitor tamper vivem na UI mas estão **inertes** — precisarão de
   comandos `cfg:` que ainda não estão mapeados (ver TODO §). */

// Estado do filtro da Partição → Dispositivos. Aplicado ao render
// junto com o filtro de bitmask de partição.
var _vcParDispFilter = { tipo: 'all', nome: '' };

async function _vcParDispLoad(partN) {
  var panel = document.getElementById('vcParDispositivos');
  if (!panel) return;
  panel.dataset.loaded = '1';

  var list = document.getElementById('vcParDispList');
  if (list) list.innerHTML = '<p class="text-muted small m-0 p-2" data-i18n="common.loading">Carregando…</p>';

  // Garante _vcDispCache populado. Como `_vcDispLoad` exige a aba
  // Sistema→Dispositivos no DOM (que não existe na tela Partição), usamos
  // o helper sem-UI `_vcDispCacheLoad`.
  if (Object.keys(_vcDispCache || {}).length === 0) {
    vcToast(VCi18n.t('common.loading_tab', { tab: 'Dispositivos' }), 'info', 0,
            { id: 'load-par-disp', persist: true });
    try { await _vcDispCacheLoad(); } catch (_) {}
    vcToastClose('load-par-disp');
  }
  _vcParDispRender();
}

/* Re-renderiza a lista aplicando o filtro de partição corrente +
   filtros do popover (tipo + nome). Chamado pelo Apply do filtro
   e após carga do cache. */
function _vcParDispRender() {
  var list = document.getElementById('vcParDispList');
  if (!list) return;
  list.innerHTML = '';
  var partN = _vcParCurrent;
  if (!partN) {
    list.innerHTML = '<p class="text-muted small m-0 p-2">Partição inválida.</p>';
    return;
  }
  var pos = partN - 1;
  var matched = 0;
  Object.keys(_vcDispCache).forEach(function (idx) {
    var d = _vcDispCache[idx];
    if (!d || d.stat === 'INV' || d.stat === 'DEL' || d.stat === 'LIV') return;
    var p = (d.p || '').padEnd(6, '-');
    var ch = p.charAt(pos);
    if (ch === '-' || ch === '0' || ch === '') return;
    if (!_vcParDispMatchesFilter(d)) return;
    _vcParDispAppendRow(d);
    matched++;
  });
  if (matched === 0) {
    var msgKey = _vcParDispIsFilterActive() ? 'pdisp.filtro_vazio' : 'pdisp.lista_vazia';
    list.innerHTML =
      '<p class="text-muted small m-0 p-2" data-i18n="' + msgKey + '">' +
      (VCi18n.t(msgKey) || 'Nenhum dispositivo.') + '</p>';
    if (typeof VCi18n !== 'undefined' && VCi18n.apply) VCi18n.apply();
  }
  _vcParDispUpdateFilterIndicator();
}

function _vcParDispMatchesFilter(d) {
  var f = _vcParDispFilter;
  if (f.tipo && f.tipo !== 'all' && (d.tipo || '') !== f.tipo) return false;
  if (f.nome) {
    var n = f.nome.toLowerCase();
    if ((d.nome || '').toLowerCase().indexOf(n) === -1) return false;
  }
  return true;
}

function _vcParDispIsFilterActive() {
  var f = _vcParDispFilter;
  return (f.tipo && f.tipo !== 'all') || !!f.nome;
}

function _vcParDispUpdateFilterIndicator() {
  var btn = document.getElementById('vcParDispBtnFilter');
  if (!btn) return;
  var active = _vcParDispIsFilterActive();
  btn.classList.toggle('vc-buffer-filtro-on', active);
  // Reusa o badge style do Buffer (mesma identidade visual)
  var badge = document.getElementById('vcParDispFiltroBadge');
  if (active) {
    var total = 0, shown = 0;
    var partN = _vcParCurrent, pos = partN - 1;
    Object.keys(_vcDispCache).forEach(function (idx) {
      var d = _vcDispCache[idx];
      if (!d || d.stat === 'INV' || d.stat === 'DEL' || d.stat === 'LIV') return;
      var p = (d.p || '').padEnd(6, '-');
      if (['-','0',''].indexOf(p.charAt(pos)) !== -1) return;
      total++;
      if (_vcParDispMatchesFilter(d)) shown++;
    });
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'vcParDispFiltroBadge';
      badge.className = 'vc-buffer-filtro-badge';
      btn.parentNode.insertBefore(badge, btn);
    }
    badge.textContent = shown + ' / ' + total;
  } else if (badge) {
    badge.remove();
  }
}

/* Lista de tipos únicos presentes nos dispositivos da partição
   corrente — usado pra popular o combo "Tipo" no popover. */
function _vcParDispTiposNaParticao() {
  var partN = _vcParCurrent, pos = partN - 1;
  var seen = {};
  var out = [];
  Object.keys(_vcDispCache).forEach(function (idx) {
    var d = _vcDispCache[idx];
    if (!d || d.stat === 'INV' || d.stat === 'DEL' || d.stat === 'LIV') return;
    var p = (d.p || '').padEnd(6, '-');
    if (['-','0',''].indexOf(p.charAt(pos)) !== -1) return;
    var t = d.tipo || '';
    if (t && !seen[t]) { seen[t] = true; out.push(t); }
  });
  out.sort();
  return out;
}

function _vcParDispOpenFilterPopover() {
  var anchor = document.getElementById('vcParDispBtnFilter');
  if (!anchor) return;
  var existing = document.getElementById('vcParDispFiltroPop');
  if (existing) { existing.remove(); return; }

  var tipos = _vcParDispTiposNaParticao();
  var tiposHtml = '<option value="all" data-i18n="buffer.filtro_part_todas">Todos</option>';
  tipos.forEach(function (t) {
    var label = _vcDevTypeLabel(t) || t;
    tiposHtml += '<option value="' + _vcEscape(t) + '">' + _vcEscape(label) + ' (' + _vcEscape(t) + ')</option>';
  });

  var pop = document.createElement('div');
  pop.id = 'vcParDispFiltroPop';
  pop.className = 'vc-buffer-filtro-pop';
  pop.innerHTML =
    '<div class="vc-buffer-filtro-header">' +
      '<span data-i18n="pdisp.filtro_titulo">Filtrar dispositivos</span>' +
      '<button type="button" class="vc-btn sm outline" id="vcParDispFiltroClose"><i class="bi bi-x-lg"></i></button>' +
    '</div>' +
    '<div class="vc-buffer-filtro-body">' +
      '<label class="vc-label-sm" data-i18n="dispositivos.col_tipo">Tipo</label>' +
      '<select class="vc-input" id="vcParDispFiltroTipo">' + tiposHtml + '</select>' +
      '<label class="vc-label-sm mt-2" data-i18n="pdisp.filtro_nome">Nome contém:</label>' +
      '<input class="vc-input" type="text" id="vcParDispFiltroNome" data-i18n-placeholder="pdisp.filtro_nome_ph" placeholder="Ex.: sala">' +
    '</div>' +
    '<div class="vc-buffer-filtro-footer">' +
      '<button type="button" class="vc-btn outline" id="vcParDispFiltroLimpar"><span data-i18n="buffer.filtro_limpar">Limpar</span></button>' +
      '<button type="button" class="vc-btn"         id="vcParDispFiltroAplicar"><span data-i18n="buffer.filtro_aplicar">Aplicar</span></button>' +
    '</div>';
  document.body.appendChild(pop);

  var rect = anchor.getBoundingClientRect();
  pop.style.position = 'fixed';
  pop.style.top   = (rect.bottom + 6) + 'px';
  pop.style.right = Math.max(8, window.innerWidth - rect.right) + 'px';
  pop.style.zIndex = '9999';

  document.getElementById('vcParDispFiltroTipo').value = _vcParDispFilter.tipo || 'all';
  document.getElementById('vcParDispFiltroNome').value = _vcParDispFilter.nome || '';
  if (typeof VCi18n !== 'undefined' && VCi18n.apply) VCi18n.apply();

  document.getElementById('vcParDispFiltroClose').onclick   = function () { pop.remove(); };
  document.getElementById('vcParDispFiltroLimpar').onclick  = function () {
    _vcParDispFilter = { tipo: 'all', nome: '' };
    _vcParDispRender();
    pop.remove();
  };
  document.getElementById('vcParDispFiltroAplicar').onclick = function () {
    _vcParDispFilter = {
      tipo: document.getElementById('vcParDispFiltroTipo').value || 'all',
      nome: (document.getElementById('vcParDispFiltroNome').value || '').trim()
    };
    _vcParDispRender();
    pop.remove();
  };

  setTimeout(function () {
    function onDocClick(e) {
      if (!pop.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) {
        pop.remove();
        document.removeEventListener('click', onDocClick, true);
      }
    }
    document.addEventListener('click', onDocClick, true);
  }, 50);
}

function _vcParDispAppendRow(d) {
  var list = document.getElementById('vcParDispList');
  if (!list) return;
  var row = document.createElement('div');
  row.className = 'vc-disp-row';
  row.dataset.idx = d.idx;
  row.style.cssText = 'display:grid;grid-template-columns:60px 1fr 90px 70px;padding:6px 8px;border-bottom:1px solid #E5E8EB;cursor:pointer;font-size:13px;';
  row.innerHTML =
    '<div>' + String(d.idx).padStart(3, '0') + '</div>' +
    '<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _vcEscape(d.nome || '---') + '</div>' +
    '<div title="' + _vcEscape(d.tipo || '') + '">' + _vcEscape(_vcDevTypeLabel(d.tipo, d.idx)) + '</div>' +
    '<div>' + (d.versao ? 'V ' + _vcEscape(d.versao) : '---') + '</div>';
  list.appendChild(row);
}

function _vcParDispBindEvents() {
  // Click numa linha → seleciona
  var list = document.getElementById('vcParDispList');
  if (list && !list._vcBound) {
    list._vcBound = true;
    list.addEventListener('click', function (e) {
      var row = e.target.closest('.vc-disp-row');
      if (!row) return;
      var idx = parseInt(row.dataset.idx, 10);
      if (isNaN(idx)) return;
      list.querySelectorAll('.vc-disp-row').forEach(function (r) { r.style.background = ''; });
      row.style.background = 'rgba(0,118,203,.10)';
      _vcParDispSelectItem(idx);
    });
  }
  // Salvar (inline)
  var btnSalvar = document.getElementById('vcParDispBtnSalvar');
  if (btnSalvar && !btnSalvar._vcBound) {
    btnSalvar._vcBound = true;
    btnSalvar.addEventListener('click', function (e) { e.preventDefault(); _vcParDispSave(); });
  }
  // Botão "Editar atributos completos" → leva pra Sistema → Dispositivos
  // com o idx do dispositivo no query string (?disp=N).
  var btnGlobal = document.getElementById('vcParDispBtnEditarGlobal');
  if (btnGlobal && !btnGlobal._vcBound) {
    btnGlobal._vcBound = true;
    btnGlobal.addEventListener('click', function (e) {
      e.preventDefault();
      if (_vcParDispSelected == null) return;
      window.location.href = 'sistema.html?disp=' + encodeURIComponent(_vcParDispSelected) + '#vcSysDispositivos';
    });
  }
  // Cancelar/Salvar do footer (data-action)
  document.querySelectorAll('#vcParDispositivos [data-action]').forEach(function (b) {
    if (b._vcBound) return;
    b._vcBound = true;
    b.addEventListener('click', function (e) {
      e.preventDefault();
      if (b.dataset.action === 'save')   _vcParDispSave();
      if (b.dataset.action === 'cancel') _vcParDispCancel();
    });
  });
  // Botão funil → popover de filtro (tipo + nome)
  var btnFilt = document.getElementById('vcParDispBtnFilter');
  if (btnFilt && !btnFilt._vcBound) {
    btnFilt._vcBound = true;
    btnFilt.addEventListener('click', function (e) { e.preventDefault(); _vcParDispOpenFilterPopover(); });
  }
}

function _vcParDispSelectItem(idx) {
  var d = _vcDispCache[idx];
  if (!d) return;
  _vcParDispSelected = idx;
  document.getElementById('vcParDispEditEmpty').classList.add('d-none');
  document.getElementById('vcParDispEditForm').classList.remove('d-none');
  document.getElementById('vcParDispNome').value = d.nome || '';
  // Status row (Bat/Tamper/RSSI/Stat) — populada por eventos [N6]/[N7].
  _vcParDispRenderStatus(d);
  // Form simplificado: só nome edita aqui. Os outros atributos (zona/
  // partição/status/sinal) são globais → editáveis na aba Sistema →
  // Dispositivos via botão "Editar atributos completos".
}

function _vcParDispCancel() {
  _vcParDispSelected = null;
  document.getElementById('vcParDispEditEmpty').classList.remove('d-none');
  document.getElementById('vcParDispEditForm').classList.add('d-none');
  document.querySelectorAll('#vcParDispList .vc-disp-row').forEach(function (r) {
    r.style.background = '';
  });
}

async function _vcParDispSave() {
  if (_vcParDispSelected == null) return;
  var idx = _vcParDispSelected;
  var d   = _vcDispCache[idx];
  if (!d) return;
  var net = window.vettiAPI.network;
  if (!net) return;

  var nome = (document.getElementById('vcParDispNome') || {}).value || '';
  nome = String(nome).trim().slice(0, 20);
  if (!nome) {
    vcToast(VCi18n.t('dispositivos.nome_longo') || 'Nome do dispositivo: máximo 20 caracteres.', 'error');
    return;
  }
  // Por enquanto só nome — as flags de zona são editadas na aba
  // Sistema → Dispositivos (com matriz Tipo×Zona). Funções zona +
  // grupos pareadas + monitor tamper na partição precisam do comando
  // `cfg:` ainda não mapeado.
  var cmd = 'BD ' + idx + ' Nome:"' + _vcFerDeAccent(nome).replace(/"/g, '\\"') + '"';
  vcToast(VCi18n.t('dispositivos.gravando') || 'Gravando…', 'info', 0,
          { id: 'pdisp-save', persist: true });
  try {
    var r = await net.sendCommand(cmd);
    if (r && r.ok) {
      // Atualiza cache + linha
      d.nome = nome;
      _vcDispCache[idx] = d;
      var row = document.querySelector('#vcParDispList .vc-disp-row[data-idx="' + idx + '"]');
      if (row) row.querySelector('div:nth-child(2)').textContent = nome;
      vcToast(VCi18n.t('dispositivos.gravado') || 'Atualizado.', 'success', 2500,
              { id: 'pdisp-save' });
      _vcParDispCancel();
    } else {
      vcToast(VCi18n.t('dispositivos.erro_gravar') || 'Falha ao gravar.', 'error',
              4000, { id: 'pdisp-save' });
    }
  } catch (e) {
    vcToast(VCi18n.t('dispositivos.erro_gravar') || 'Falha ao gravar.', 'error',
            4000, { id: 'pdisp-save' });
  }
}

/* ═════════════════════════════════════════════════════════════
   TELA ZONA COMPARTILHADA
   ═════════════════════════════════════════════════════════════ */
async function vcZonaInit() {
  if (!document.getElementById('vcZcDispositivos') && !document.getElementById('vcZcPanel')) return;
  _vcStatusFillFromSession();
  // Reusa todo o pipeline de tabs/cards do módulo Sistema.
  _vcSysBindEvents();
  await _vcSysQuickHeader();
  var first = document.querySelector('.vc-sys-panel.active');
  if (first && first.dataset.loaded === '0') await _vcLoadPanel(first);
  _vcStartKeepAlive();
}

/* ═════════════════════════════════════════════════════════════
   TELA CONFIGURAÇÕES (layout próprio com sub-menu)
   ═════════════════════════════════════════════════════════════ */

// Fonte do sistema: lista de fontes comuns disponíveis em macOS/Windows.
// As do Figma (Alfa Slab One, Bakbak One, etc) não estão empacotadas;
// listamos famílias do sistema + Inter (que vem com o app).
var _VC_CFG_FONTS = ['Inter', 'Alexandria', 'Arial', 'Georgia', 'Helvetica', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Courier New', 'Menlo'];
var _VC_CFG_STYLES = ['Normal Regular', 'Bold Regular', 'Bold Italic'];
var _VC_CFG_SIZES  = ['12.0','14.0','16.0','18.0','20.0','22.0','24.0','26.0','28.0'];

function vcCfgClose() {
  // Volta para a tela anterior (Status se houver sessão, index caso contrário).
  if (history.length > 1) history.back();
  else window.location.href = 'vetticonfig-status.html';
}

// Sub-menu (sidebar interna)
function _vcCfgBindAside() {
  document.querySelectorAll('.vc-cfg-aside-item').forEach(function (item) {
    item.addEventListener('click', function () {
      document.querySelectorAll('.vc-cfg-aside-item').forEach(function (i) { i.classList.remove('active'); });
      document.querySelectorAll('.vc-cfg-panel').forEach(function (p) { p.classList.remove('active'); });
      item.classList.add('active');
      var t = item.dataset.cfgTab;
      var panel = document.getElementById(t);
      if (panel) panel.classList.add('active');
      // Atualiza título do menu
      var titleEl = document.getElementById('vcCfgCurrentTitle');
      var label = item.querySelector('span');
      if (titleEl && label) titleEl.textContent = label.textContent;
    });
  });
}

// Renderiza as 3 bandeiras grandes (Geral)
function _vcCfgRenderFlags() {
  var container = document.getElementById('vcCfgFlags');
  if (!container) return;
  container.innerHTML = '';

  // Cria um host temporário e usa o renderSelector compacto para extrair
  // os SVGs das bandeiras (que são privados ao engine i18n).
  var tempHost = document.createElement('div');
  VCi18n.renderSelector(tempHost, { compact: true });

  var current = VCi18n.getCurrentLang();
  VCi18n.getAvailableLangs().forEach(function (lang) {
    var card = document.createElement('div');
    card.className = 'vc-cfg-flag-card' + (lang.code === current ? ' active' : '');
    var match = tempHost.querySelector('.vc-lang-btn[data-lang="' + lang.code + '"] .vc-lang-flag');
    var flagHtml = match ? match.outerHTML : '<span class="vc-lang-flag"></span>';
    var labelKey = 'configs.lang_' + lang.code.replace('-', '_');
    var labelText = VCi18n.t(labelKey);
    if (labelText === labelKey) labelText = lang.name; // fallback se chave não existir
    card.innerHTML = flagHtml + '<span data-i18n="' + labelKey + '">' + labelText + '</span>';
    card.addEventListener('click', function () {
      VCi18n.setLang(lang.code, function () { _vcCfgRenderFlags(); });
    });
    container.appendChild(card);
  });
}

// Renderiza Tema (cards Claro/Escuro)
function _vcCfgRenderThemes() {
  var t = vcGetTheme();
  document.querySelectorAll('.vc-cfg-theme-card').forEach(function (c) {
    c.classList.toggle('active', c.dataset.theme === t);
  });
}
function vcCfgPickTheme(t) {
  try { localStorage.setItem(VC_THEME_KEY, t); } catch (_) {}
  vcApplyTheme(t);
  _vcCfgRenderThemes();
}

// Renderiza os 3 list-boxes do Fonte
function _vcCfgRenderFont() {
  function fill(boxId, items, current) {
    var box = document.getElementById(boxId);
    if (!box) return;
    box.innerHTML = '';
    items.forEach(function (it) {
      var d = document.createElement('div');
      d.className = 'vc-list-item' + (it === current ? ' selected' : '');
      d.textContent = it;
      // Aplica preview do nome da fonte no próprio item (só se for família).
      if (boxId === 'vcCfgFontFamily') d.style.fontFamily = it + ', sans-serif';
      d.addEventListener('click', function () {
        box.querySelectorAll('.vc-list-item').forEach(function (x) { x.classList.remove('selected'); });
        d.classList.add('selected');
        _vcCfgPersistFont();
      });
      box.appendChild(d);
    });
  }
  var saved = _vcCfgReadFont();
  fill('vcCfgFontFamily', _VC_CFG_FONTS, saved.family);
  fill('vcCfgFontStyle',  _VC_CFG_STYLES, saved.style);
  fill('vcCfgFontSize',   _VC_CFG_SIZES,  saved.size);
}
function _vcCfgReadFont() {
  try {
    var raw = localStorage.getItem('vc_font') || '{}';
    var f = JSON.parse(raw);
    return {
      family: f.family || _VC_CFG_FONTS[0],
      style:  f.style  || _VC_CFG_STYLES[0],
      size:   f.size   || _VC_CFG_SIZES[2]    /* 16.0 */
    };
  } catch (_) { return { family: _VC_CFG_FONTS[0], style: _VC_CFG_STYLES[0], size: _VC_CFG_SIZES[2] }; }
}
function _vcCfgPersistFont() {
  var sel = function (id) { var el = document.querySelector('#' + id + ' .vc-list-item.selected'); return el ? el.textContent : null; };
  var f = { family: sel('vcCfgFontFamily'), style: sel('vcCfgFontStyle'), size: sel('vcCfgFontSize') };
  try { localStorage.setItem('vc_font', JSON.stringify(f)); } catch (_) {}
  _vcCfgApplyFont(f);
}
function _vcCfgApplyFont(f) {
  if (!f) f = _vcCfgReadFont();
  var weight = /Bold/.test(f.style) ? 700 : 400;
  var italic = /Italic/.test(f.style) ? 'italic' : 'normal';
  document.body.style.fontFamily = (f.family || 'Inter') + ', sans-serif';
  document.body.style.fontWeight = weight;
  document.body.style.fontStyle  = italic;
  // Tamanho base do app
  document.documentElement.style.setProperty('font-size', (parseFloat(f.size) || 16) + 'px');
}

function _vcCfgBindLoggerVisibility() {
  var chk = document.getElementById('vcCfgShowLogger');
  if (!chk) return;
  chk.checked = vcIsPageLoggerVisible();
  chk.addEventListener('change', function () {
    vcSetPageLoggerVisible(chk.checked);
  });
}

// Padrões de fábrica salvos (local storage por enquanto)
function _vcCfgRenderPadroes() {
  var list = document.getElementById('vcCfgPadroesList');
  if (!list) return;
  var arr = [];
  try { arr = JSON.parse(localStorage.getItem('vc_padroes') || '[]'); } catch (_) {}
  if (arr.length === 0) {
    list.innerHTML = '<div class="text-muted small p-3" data-i18n="configs.padroes_vazio">Nenhum padrão salvo localmente.</div>';
    return;
  }
  list.innerHTML = '';
  arr.forEach(function (p, idx) {
    var row = document.createElement('div');
    row.className = 'vc-cfg-tbl-row';
    row.innerHTML = '<div>' + (p.nome || '---') + '</div><div>' + (p.data || '---') + '</div>';
    row.addEventListener('click', function () {
      list.querySelectorAll('.vc-cfg-tbl-row').forEach(function (r) { r.classList.remove('selected'); });
      row.classList.add('selected');
    });
    list.appendChild(row);
  });
}

// Ponto de entrada
function vcConfigsInit() {
  if (!document.querySelector('.vc-cfg-card')) return;
  _vcCfgBindAside();
  _vcCfgRenderFlags();
  _vcCfgRenderThemes();
  _vcCfgRenderFont();
  _vcCfgBindLoggerVisibility();
  _vcCfgApplyFont();    // aplica fonte salva ao carregar
  _vcCfgRenderPadroes();

  // Versão do app (Sobre)
  if (window.vettiAPI && window.vettiAPI.app && window.vettiAPI.app.getVersion) {
    window.vettiAPI.app.getVersion().then(function (v) {
      var el = document.getElementById('vcCfgVersao');
      if (el) el.textContent = v;
    }).catch(function () {});
  }
  var dt = document.getElementById('vcCfgVersaoCheck');
  if (dt) dt.textContent = new Date().toLocaleDateString();

  // "Novo padrão" → cria entrada local
  var btnNovo = document.getElementById('vcCfgBtnNovoPadrao');
  if (btnNovo) btnNovo.addEventListener('click', function () {
    var nome = prompt(VCi18n.t('configs.prompt_nome_padrao') || 'Nome do padrão:');
    if (!nome) return;
    var arr = [];
    try { arr = JSON.parse(localStorage.getItem('vc_padroes') || '[]'); } catch (_) {}
    arr.push({ nome: nome, data: new Date().toLocaleDateString() });
    try { localStorage.setItem('vc_padroes', JSON.stringify(arr)); } catch (_) {}
    _vcCfgRenderPadroes();
  });
  var btnEx = document.getElementById('vcCfgBtnExcluirPadrao');
  if (btnEx) btnEx.addEventListener('click', function () {
    var sel = document.querySelector('#vcCfgPadroesList .vc-cfg-tbl-row.selected');
    if (!sel) { vcShowInfo(VCi18n.t('configs.selecione_padrao') || 'Selecione um padrão.'); return; }
    var arr = [];
    try { arr = JSON.parse(localStorage.getItem('vc_padroes') || '[]'); } catch (_) {}
    var rows = Array.prototype.slice.call(document.querySelectorAll('#vcCfgPadroesList .vc-cfg-tbl-row'));
    var idx = rows.indexOf(sel);
    if (idx >= 0) arr.splice(idx, 1);
    try { localStorage.setItem('vc_padroes', JSON.stringify(arr)); } catch (_) {}
    _vcCfgRenderPadroes();
  });
}

// Aplica fonte e tema salvos imediatamente quando o script carrega
// (antes do DOMContentLoaded, para evitar flash visual em qualquer tela).
(function () { _vcCfgApplyFont(); })();
