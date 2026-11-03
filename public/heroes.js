/* Heroes directory (heroes.html): search + filters + sort over
 * data/heroes-index.json. Clicking a card opens the quick-build popup
 * (hero-popup.js); the popup's "Chi tiết" button goes to hero.html.
 *
 * Filters live behind a funnel button: they open a popup panel docked to
 * the right side of the screen (max 70% of the viewport on mobile, so the
 * user can tap the empty area to close it).
 */
(function () {
  var RARITY_RANK = { 'L++': 4, 'L+': 3, 'L': 2, 'R': 1 };
  var state = { q: '', rarity: new Set(), type: new Set(), role: new Set(), faction: new Set(), sort: 'rarity-desc' };
  var INDEX = [];

  var grid = document.getElementById('hx-grid');
  var countEl = document.getElementById('hx-count');
  var filterBtn = document.getElementById('hx-filter-btn');
  var filterBadge = document.getElementById('hx-filter-count');
  var filterPanel = document.getElementById('hx-filter-panel');
  var filterBody = document.getElementById('hx-filter-body');
  var filterBackdrop = document.getElementById('hx-filter-backdrop');
  var searchInput = document.getElementById('hx-search-input');
  var sortSel = document.getElementById('hx-sort');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* Rarity tag colour class: L++ -> rarity-lpp (purple), L+ -> rarity-lp (red),
   * L -> rarity-l (orange), R -> rarity-r (blue). */
  function rarityCls(r) {
    return 'rarity-' + String(r).replace(/\+/g, 'p').toLowerCase();
  }

  function activeFilterCount() {
    return state.rarity.size + state.type.size + state.role.size + state.faction.size;
  }

  function updateBadge() {
    var n = activeFilterCount();
    filterBadge.textContent = n > 0 ? n : '';
    filterBadge.style.display = n > 0 ? '' : 'none';
    filterBtn.classList.toggle('has-filters', n > 0);
  }

  function openFilters() {
    filterPanel.hidden = false;
    filterBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      filterPanel.classList.add('open');
      filterBackdrop.classList.add('open');
    });
  }

  function closeFilters() {
    filterPanel.classList.remove('open');
    filterBackdrop.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () {
      filterPanel.hidden = true;
      filterBackdrop.hidden = true;
    }, 180);
  }

  function groupHtml(title, key, options) {
    var items = options.map(function (o) {
      return '<label><input type="checkbox" data-group="' + key + '" value="' + esc(o) + '"> ' + esc(o) + '</label>';
    }).join('');
    return '<details class="hx-filter-group" open><summary>' + esc(title) + '</summary>' + items + '</details>';
  }

  function buildFilters() {
    var rarities = ['Awakened', 'L++', 'L+', 'L', 'R'];
    var types = [...new Set(INDEX.map(function (h) { return h.type; }))].filter(Boolean).sort();
    var roles = [...new Set(INDEX.flatMap(function (h) { return h.tags || []; }))].sort();
    var factions = [...new Set(INDEX.map(function (h) { return h.faction; }))].filter(Boolean).sort();
    filterBody.innerHTML = groupHtml('Độ hiếm', 'rarity', rarities)
      + groupHtml('Loại', 'type', types)
      + groupHtml('Vai trò', 'role', roles)
      + groupHtml('Phe', 'faction', factions);
    filterBody.querySelectorAll('input[type=checkbox]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var set = state[cb.getAttribute('data-group')];
        if (cb.checked) set.add(cb.value); else set.delete(cb.value);
        updateBadge();
        render();
      });
    });
  }

  function matches(h) {
    var q = state.q.trim().toLowerCase();
    if (q && h.name.toLowerCase().indexOf(q) === -1) return false;
    if (state.rarity.size) {
      var ok = false;
      state.rarity.forEach(function (r) {
        if (r === 'Awakened' && h.awakened) ok = true;
        if (r === h.rarity) ok = true;
      });
      if (!ok) return false;
    }
    if (state.type.size && !state.type.has(h.type)) return false;
    if (state.role.size && !(h.tags || []).some(function (t) { return state.role.has(t); })) return false;
    if (state.faction.size && !state.faction.has(h.faction)) return false;
    return true;
  }

  function sortList(list) {
    var byName = function (a, b) { return a.name.localeCompare(b.name); };
    var byRarityDesc = function (a, b) {
      return (RARITY_RANK[b.rarity] || 0) - (RARITY_RANK[a.rarity] || 0)
        || (b.awakened - a.awakened) || byName(a, b);
    };
    var byDate = function (dir) {
      return function (a, b) {
        var da = a.release || '9999', db = b.release || '9999';
        return dir * (da < db ? -1 : da > db ? 1 : 0) || byName(a, b);
      };
    };
    switch (state.sort) {
      case 'rarity-asc': return list.sort(function (a, b) { return -byRarityDesc(a, b); });
      case 'name-asc': return list.sort(byName);
      case 'name-desc': return list.sort(function (a, b) { return -byName(a, b); });
      case 'newest': return list.sort(byDate(-1));
      case 'oldest': return list.sort(byDate(1));
      default: return list.sort(byRarityDesc);
    }
  }

  /* Directory card: portrait + name + ONE rarity tag (R / L / L+ / L++).
   * Role/type tags are intentionally hidden here (they still show in the
   * quick-build popup and on the detail page). */
  function cardHtml(h) {
    return '<article class="hx-card" data-hero-popup="' + esc(h.id) + '" tabindex="0" role="button" aria-label="' + esc(h.name) + '">'
      + '<img src="' + esc(h.portrait) + '" alt="' + esc(h.name) + '" loading="lazy">'
      + '<div class="hx-card-meta"><b>' + esc(h.name.toUpperCase()) + '</b>'
      + '<span class="hx-badge rarity ' + rarityCls(h.rarity) + '">' + esc(h.rarity) + '</span></div>'
      + '</article>';
  }

  function render() {
    var list = sortList(INDEX.filter(matches));
    grid.innerHTML = list.length ? list.map(cardHtml).join('')
      : '<div class="hx-empty">Không tìm thấy hero nào khớp bộ lọc.</div>';
    countEl.textContent = 'Hiển thị ' + list.length + ' / ' + INDEX.length + ' hero';
  }

  function clearAll() {
    state.q = ''; state.rarity.clear(); state.type.clear(); state.role.clear(); state.faction.clear();
    searchInput.value = '';
    filterBody.querySelectorAll('input[type=checkbox]').forEach(function (cb) { cb.checked = false; });
    updateBadge();
    render();
  }

  function clearFiltersOnly() {
    state.rarity.clear(); state.type.clear(); state.role.clear(); state.faction.clear();
    filterBody.querySelectorAll('input[type=checkbox]').forEach(function (cb) { cb.checked = false; });
    updateBadge();
    render();
  }

  filterBtn.addEventListener('click', function () {
    if (filterPanel.hidden || !filterPanel.classList.contains('open')) openFilters();
    else closeFilters();
  });
  document.getElementById('hx-filter-close').addEventListener('click', closeFilters);
  filterBackdrop.addEventListener('click', closeFilters);
  document.getElementById('hx-filter-clear').addEventListener('click', clearFiltersOnly);
  document.getElementById('hx-filter-done').addEventListener('click', closeFilters);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !filterPanel.hidden) closeFilters();
  });

  searchInput.addEventListener('input', function () { state.q = searchInput.value; render(); });
  document.getElementById('hx-search-btn').addEventListener('click', function () {
    state.q = searchInput.value; render();
  });
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { state.q = searchInput.value; render(); }
  });
  document.getElementById('hx-clear').addEventListener('click', clearAll);
  sortSel.addEventListener('change', function () { state.sort = sortSel.value; render(); });
  grid.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('hx-card')) {
      e.preventDefault();
      window.HeroPopup.open(e.target.getAttribute('data-hero-popup'));
    }
  });

  fetch('data/heroes-index.json').then(function (r) { return r.json(); }).then(function (data) {
    INDEX = data;
    buildFilters();
    render();
  }).catch(function () {
    grid.innerHTML = '<div class="hx-empty">Không tải được danh sách hero.</div>';
  });
})();
