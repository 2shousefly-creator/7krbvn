/* Tier List (tier-list.html): mode tabs via ?mode= (default Arena),
 * rarity + role filters (ALL modes), diacritic-insensitive name search,
 * "Hiển thị X / Y hero" counter, Compact/Columns layout toggle, per-mode
 * last update + collapsible changelog. Hero cards show PORTRAIT + NAME
 * only (no rarity badge, no role icon, no Transcendence badge, no
 * most-used marker). Clicking a card opens the hero popup (hero-popup.js);
 * the popup's "Chi tiết" button goes to hero.html?id=<id>.
 *
 * Data: tier-list-data.js (built by ~/workspace/build_tierlist.py).
 * Hero meta (name/rarity/type/portrait): data/heroes-index.json.
 */
(function () {
  var TIER_ORDER = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'NOT USED'];
  /* Data key stays "NOT USED"; only the display label is Vietnamese. */
  var TIER_LABEL = { 'NOT USED': 'PHẾ' };
  /* Category group labels in Vietnamese. Element names (FIRE, WATER...)
   * stay in English: they are in-game proper names. */
  var CATEGORY_LABEL = {
    ATTACK: 'Tấn công', MAGIC: 'Phép thuật', DEFENSE: 'Phòng thủ',
    SUPPORT: 'Hỗ trợ', UNIVERSAL: 'Đa năng',
    DAMAGE_DEALERS: 'Gây sát thương',
    BUFFERS_DEBUFFERS: 'Buff / Debuff',
    UNIQUE_TANK_HEAL: 'Vai trò đặc biệt · Tank · Hồi máu',
    SINGLE_TARGET: 'Sát thương đơn mục tiêu',
    '3_4_TARGET_DAMAGE_DEALERS': 'Sát thương 3/4 mục tiêu',
    TRIPLE_TARGET: 'Sát thương 3 mục tiêu',
    QUAD_QUINT_TARGET: 'Sát thương 4/5 mục tiêu',
    DOT: 'DOT', IMMUNITY: 'Miễn nhiễm', MULTI_HIT: 'Đánh nhiều lần'
  };
  var ROLE_LABEL = {
    ATTACK: 'Tấn công', MAGIC: 'Phép thuật', DEFENSE: 'Phòng thủ',
    SUPPORT: 'Hỗ trợ', UNIVERSAL: 'Đa năng'
  };
  var PUD_MODES = ['power-up-dungeon', 'power-up-dungeon-roles'];

  var state = { mode: 'arena', rarity: {}, role: {}, q: '', layout: 'columns' };
  var INDEX = {}; /* hero_id -> {name, rarity, type, portrait} */
  var rowsEl = document.getElementById('tl-rows');
  var countEl = document.getElementById('tl-count');
  var titleEl = document.getElementById('tl-mode-title');
  var updatedEl = document.getElementById('tl-updated');
  var subTabsEl = document.getElementById('tl-subtabs');
  var searchInput = document.getElementById('tl-search');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* Diacritic-insensitive match: heroes.js only lowercases, but names here
   * are matched without diacritics too, so "tuong" finds "tướng"-style
   * input and plain-ASCII typing always works. NFD does not decompose
   * "đ", so it is folded by hand. */
  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  }

  function fmtDate(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  function tierLabel(t) { return TIER_LABEL[t] || t; }
  function catLabel(c) { return CATEGORY_LABEL[c] || c; }
  function displayText(s) { return String(s).replace(/NOT USED/g, 'PHẾ'); }

  function currentMode() { return TIER_LIST_DATA.modes[state.mode]; }

  function matches(hero) {
    if (state.q) {
      var q = norm(state.q);
      var name = norm(hero.name);
      var id = norm(hero.id).replace(/-/g, ' ');
      if (name.indexOf(q) === -1 && id.indexOf(q) === -1) return false;
    }
    if (Object.keys(state.rarity).length && !state.rarity[hero.rarity]) return false;
    /* Role filter applies in EVERY mode (regression fix 20/11: it was
     * PvE-gated while the buttons stayed visible in PvP, so clicking a
     * role in Arena/Total War/Guild War did nothing). In PvP the rows
     * are already grouped by role, so filtering narrows to that group. */
    if (Object.keys(state.role).length
      && !state.role[hero.type.toUpperCase()]) return false;
    return true;
  }

  function cardHtml(hero) {
    return '<article class="tl-card" data-hero-popup="' + esc(hero.id) + '" tabindex="0" role="button" aria-label="' + esc(hero.name) + '">'
      + '<img src="' + esc(hero.portrait) + '" alt="' + esc(hero.name) + '" loading="lazy">'
      + '<b>' + esc(hero.name) + '</b></article>';
  }

  function renderRows() {
    var mode = currentMode();
    var tierColor = {};
    mode.tiers.forEach(function (t) { tierColor[t.key] = t.color; });
    var total = mode.entries.length;
    var shown = 0;
    var html = '';
    TIER_ORDER.forEach(function (tier) {
      var inTier = mode.entries.filter(function (e) { return e.tier === tier; });
      if (!inTier.length) return;
      var groupsHtml = '';
      mode.categories.forEach(function (cat) {
        var cards = inTier.filter(function (e) { return e.category === cat.key; })
          .map(function (e) { return INDEX[e.hero_id]; })
          .filter(function (h) { return h && matches(h); });
        if (!cards.length) return;
        shown += cards.length;
        groupsHtml += '<div class="tl-group"><h3>' + esc(catLabel(cat.key)) + '</h3>'
          + '<div class="tl-grid">' + cards.map(cardHtml).join('') + '</div></div>';
      });
      if (!groupsHtml) return;
      html += '<section class="tl-row"><div class="tl-tier-label" style="background:' + esc(tierColor[tier] || '#e9e8e3') + '">'
        + esc(tierLabel(tier)) + '</div><div class="tl-groups">' + groupsHtml + '</div></section>';
      if (tier === 'NOT USED') {
        html += '<p class="tl-note">PHẾ nghĩa là hero không có đóng góp đáng kể ở chế độ này — không phải là hero không dùng được ở các chế độ khác.</p>';
      }
    });
    rowsEl.innerHTML = html || '<div class="tl-empty">Không tìm thấy hero nào khớp bộ lọc.</div>';
    countEl.textContent = 'Hiển thị ' + shown + ' / ' + total + ' hero';
  }

  function renderChangelog() {
    var mode = currentMode();
    var body = document.getElementById('tl-changelog-body');
    var html = '';
    (mode.changelog || []).forEach(function (entry) {
      html += '<div class="tl-change-date">' + esc(fmtDate(entry.date)) + '</div>';
      Object.keys(entry.by_category || {}).forEach(function (cat) {
        html += '<div class="tl-change-cat">' + esc(catLabel(cat)) + '</div><ul>'
          + entry.by_category[cat].map(function (item) {
            return '<li>' + esc(displayText(item)) + '</li>';
          }).join('') + '</ul>';
      });
    });
    body.innerHTML = html || '<p class="tl-note">Chưa có thay đổi nào được ghi lại cho chế độ này.</p>';
  }

  function renderModeChrome() {
    var mode = currentMode();
    titleEl.textContent = mode.label;
    updatedEl.textContent = 'Cập nhật lần cuối: ' + fmtDate(mode.last_edit);
    document.title = 'Tier List — ' + mode.label + ' | 7K RBVN';
    document.querySelectorAll('.tl-mode-btn[data-mode]').forEach(function (b) {
      var active = b.getAttribute('data-mode') === state.mode;
      b.setAttribute('aria-current', active ? 'true' : 'false');
    });
    subTabsEl.hidden = PUD_MODES.indexOf(state.mode) === -1;
    /* The role filter is always visible now (it filters in every mode),
     * so there is no PvP hide/reset for it any more. */
  }

  function renderAll() {
    renderModeChrome();
    renderRows();
    renderChangelog();
  }

  function setMode(key) {
    if (!TIER_LIST_DATA.modes[key]) key = TIER_LIST_DATA.default_mode;
    state.mode = key;
    try {
      history.replaceState(null, '', 'tier-list.html?mode=' + encodeURIComponent(key));
    } catch (e) { /* file:// or old browser: URL stays as-is */ }
    renderAll();
  }

  function syncFilterButtons() {
    document.querySelectorAll('#tl-rarity [data-rarity]').forEach(function (b) {
      b.setAttribute('aria-pressed', state.rarity[b.getAttribute('data-rarity')] ? 'true' : 'false');
    });
    document.querySelectorAll('#tl-role [data-role]').forEach(function (b) {
      b.setAttribute('aria-pressed', state.role[b.getAttribute('data-role')] ? 'true' : 'false');
    });
  }

  function clearFilters() {
    state.rarity = {}; state.role = {}; state.q = '';
    searchInput.value = '';
    syncFilterButtons();
    renderRows();
  }

  /* Mode buttons are real links (?mode=), intercepted for in-page switching. */
  document.querySelectorAll('.tl-mode-btn[data-mode]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      setMode(b.getAttribute('data-mode'));
    });
  });

  document.querySelectorAll('#tl-rarity [data-rarity]').forEach(function (b) {
    b.addEventListener('click', function () {
      var r = b.getAttribute('data-rarity');
      if (state.rarity[r]) delete state.rarity[r]; else state.rarity[r] = true;
      syncFilterButtons();
      renderRows();
    });
  });
  document.querySelectorAll('#tl-role [data-role]').forEach(function (b) {
    b.addEventListener('click', function () {
      var r = b.getAttribute('data-role');
      if (state.role[r]) delete state.role[r]; else state.role[r] = true;
      syncFilterButtons();
      renderRows();
    });
  });
  document.getElementById('tl-clear').addEventListener('click', clearFilters);
  searchInput.addEventListener('input', function () {
    state.q = searchInput.value;
    renderRows();
  });

  document.getElementById('tl-layout-columns').addEventListener('click', function () {
    state.layout = 'columns';
    rowsEl.classList.remove('tl-compact');
    this.setAttribute('aria-pressed', 'true');
    document.getElementById('tl-layout-compact').setAttribute('aria-pressed', 'false');
  });
  document.getElementById('tl-layout-compact').addEventListener('click', function () {
    state.layout = 'compact';
    rowsEl.classList.add('tl-compact');
    this.setAttribute('aria-pressed', 'true');
    document.getElementById('tl-layout-columns').setAttribute('aria-pressed', 'false');
  });

  /* Keyboard: hero-popup.js only handles clicks, so Enter/Space on a card
   * opens the popup the same way heroes.js does for the directory. */
  rowsEl.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('tl-card')) {
      e.preventDefault();
      window.HeroPopup.open(e.target.getAttribute('data-hero-popup'));
    }
  });

  if (typeof TIER_LIST_DATA === 'undefined') {
    rowsEl.innerHTML = '<div class="tl-empty">Không tải được dữ liệu Tier List.</div>';
    countEl.textContent = '';
    return;
  }
  var params = new URLSearchParams(window.location.search);
  var initial = params.get('mode');
  if (!initial || !TIER_LIST_DATA.modes[initial]) initial = TIER_LIST_DATA.default_mode;

  fetch('data/heroes-index.json').then(function (r) { return r.json(); }).then(function (data) {
    data.forEach(function (h) { INDEX[h.id] = h; });
    state.mode = initial;
    renderAll();
  }).catch(function () {
    rowsEl.innerHTML = '<div class="tl-empty">Không tải được danh sách hero.</div>';
  });
})();
