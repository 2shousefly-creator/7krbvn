/* Hero quick-build popup (site-wide).
 * Any element with [data-hero-popup="<hero id>"] opens a short modal with
 * that hero's active build (gear set, main stats, substat priority,
 * dedicated equipment) and a "Chi tiết" button to the hero's detail page.
 * Data comes from data/heroes/<id>.json (Atlas data, extracted locally).
 */
(function () {
  var cache = {};
  var modal = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function load(id) {
    if (cache[id]) return Promise.resolve(cache[id]);
    return fetch('data/heroes/' + encodeURIComponent(id) + '.json')
      .then(function (r) { if (!r.ok) throw new Error('hero not found'); return r.json(); })
      .then(function (d) { cache[id] = d; return d; });
  }

  function buildHtml(h) {
    var build = (h.builds || []).find(function (b) { return b.active; }) || h.builds[0];
    var out = '<div class="hx-modal-hero">'
      + '<img src="assets/hero-' + esc(h.id) + '.webp" alt="' + esc(h.name) + '">'
      + '<div><h3>' + esc(h.name) + '</h3>'
      + '<div class="hx-badges"><span class="hx-badge rarity">' + esc(h.rarity) + '</span>'
      + '<span class="hx-badge type">' + esc(h.type) + '</span></div></div></div>';
    if (!build) {
      out += '<div class="hx-modal-build"><h4>Build</h4><p>Chưa có hướng dẫn build cho hero này.</p></div>';
    } else {
      var set = (build.gear.sets || [])[0] || {};
      var subs = (build.substats || []).slice(0, 4);
      out += '<div class="hx-modal-build"><h4>Build: ' + esc(build.name) + '</h4>'
        + '<div class="hx-gear-set"><b>' + esc(set.name || '') + '</b>'
        + (set.effect ? '<p>' + esc(set.effect) + '</p>' : '') + '</div>'
        + '<div class="hx-mainstats">'
        + '<div class="hx-mainstat"><small>Vũ khí</small>' + esc((build.gear.weapon || []).join(' / ') || '—') + '</div>'
        + '<div class="hx-mainstat"><small>Giáp</small>' + esc((build.gear.armor || []).join(' / ') || '—') + '</div>'
        + '</div>'
        + '<ul class="hx-substats">'
        + subs.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('')
        + '</ul>';
      if (h.dedicated) {
        out += '<p style="font-size:13.5px;margin:10px 0 0"><b>Trang bị riêng:</b> '
          + esc(h.dedicated.name) + ' — ' + esc(h.dedicated.main_stat) + '</p>';
      }
      out += '</div>';
    }
    out += '<div class="hx-modal-actions">'
      + '<a class="hx-btn primary" href="hero.html?id=' + esc(h.id) + '">Chi tiết</a>'
      + '<a class="hx-btn" href="hero.html?id=' + esc(h.id) + '&amp;tab=builds">Xem build</a>'
      + '</div>';
    return out;
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'hx-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = '<div class="hx-modal-backdrop"></div>'
      + '<div class="hx-modal-card"><button class="hx-modal-close" type="button" aria-label="Đóng">×</button>'
      + '<div class="hx-modal-body"><p>Đang tải…</p></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('.hx-modal-close').addEventListener('click', close);
    modal.querySelector('.hx-modal-backdrop').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    return modal;
  }

  function open(id) {
    var m = ensureModal();
    var body = m.querySelector('.hx-modal-body');
    body.innerHTML = '<p>Đang tải…</p>';
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
    load(id).then(function (h) {
      body.innerHTML = buildHtml(h);
    }).catch(function () {
      body.innerHTML = '<p>Không tải được dữ liệu hero này.</p>';
    });
  }

  function close() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-hero-popup]');
    if (t) {
      e.preventDefault();
      open(t.getAttribute('data-hero-popup'));
    }
  });

  window.HeroPopup = { open: open, close: close };
})();
