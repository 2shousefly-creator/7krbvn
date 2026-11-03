/* Hero quick-build popup (site-wide).
 * Any element with [data-hero-popup="<hero id>"] opens a short modal with
 * that hero's active build (gear set, main stats, substat priority,
 * dedicated equipment + which substat lines to build) and a "Chi tiết"
 * button to the hero's detail page. The popup keeps the hero's full
 * classification tags (roles + effects). Data comes from
 * data/heroes/<id>.json (Atlas data, extracted locally).
 */
(function () {
  var STAT_LABELS = { 'AllATK%': 'All Attack %', 'AllATK': 'All Attack', 'Block': 'Block Rate', 'Crit': 'Crit Rate', 'CritDMG': 'Crit Damage', 'Crush': 'Crush', 'DEF%': 'DEF%', 'DEF': 'DEF', 'DMGAmp': 'Damage Amplification', 'DmgTakenReduce': 'Damage Taken Reduction', 'EffectHit': 'Effect Hit Rate', 'EffectRes': 'Effect Resistance', 'HP%': 'HP%', 'HP': 'HP', 'MATK%': 'Magic Attack %', 'MATK': 'Magic Attack', 'PATK%': 'Physical Attack %', 'PATK': 'Physical Attack', 'Rejuvenate': 'Rejuvenate', 'Resilience': 'Resilience', 'SkillAccel': 'Skill Acceleration', 'Speed': 'Speed', 'WeaknessHit': 'Weakness Hit Chance' };
  var STAT_ICONS = { 'AllATK%': 'AllATKpct.webp', 'AllATK': 'AllATK.webp', 'Block': 'Block.webp', 'Crit': 'Crit.webp', 'CritDMG': 'CritDMG.webp', 'Crush': 'Crush.webp', 'DEF%': 'DEFpct.webp', 'DEF': 'DEF.webp', 'DMGAmp': 'DMGAmp.webp', 'DmgTakenReduce': 'DmgTakenReduce.webp', 'EffectHit': 'EffectHit.webp', 'EffectRes': 'EffectRes.webp', 'HP%': 'HPpct.webp', 'HP': 'HP.webp', 'MATK%': 'MATKpct.webp', 'MATK': 'MATK.webp', 'PATK%': 'PATKpct.webp', 'PATK': 'PATK.webp', 'Rejuvenate': 'Rejuvenate.webp', 'Resilience': 'Resilience.webp', 'SkillAccel': 'SkillAccel.webp', 'Speed': 'Speed.webp', 'WeaknessHit': 'WeaknessHit.webp' };
  var SET_ICONS = { 'Bounty Tracker': 'Bounty.webp', 'Spellweaver': 'Spellweaver.webp', 'Avenger': 'Avenger.webp', 'Gatekeeper': 'Gatekeeper.webp', 'Guardian': 'Guardian.webp', 'Orchestrator': 'Orchestrator.webp', 'Paladin': 'Paladin.webp', 'Assassin': 'Assassin.webp', 'Vanguard': 'Vanguard.webp' };

  var cache = {};
  var modal = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function statLabel(code) { return STAT_LABELS[code] || code; }
  function setIcon(setName) {
    return SET_ICONS[setName] || (setName ? setName.replace(/\s+/g, '') + '.webp' : null);
  }

  function load(id) {
    if (cache[id]) return Promise.resolve(cache[id]);
    return fetch('data/heroes/' + encodeURIComponent(id) + '.json')
      .then(function (r) { if (!r.ok) throw new Error('hero not found'); return r.json(); })
      .then(function (d) { cache[id] = d; return d; });
  }

  function buildHtml(h) {
    var build = (h.builds || []).find(function (b) { return b.active; }) || h.builds[0];
    var buildIdx = (h.builds || []).indexOf(build);
    var vi = h.vi || {};
    /* Full classification tags (roles + effects) stay in the popup. */
    var tags = (h.tags || []).map(function (t) {
      return '<span class="hx-role">' + esc(t) + '</span>';
    }).join('');
    var effects = ((h.overview || {}).effects || []).map(function (b) {
      var suffix = [b.variant, b.note].filter(Boolean).join(', ');
      return '<span class="hx-role">' + esc(b.label + (suffix ? ' (' + suffix + ')' : '')) + '</span>';
    }).join('');
    var out = '<div class="hx-modal-hero">'
      + '<img src="assets/hero-' + esc(h.id) + '.webp" alt="' + esc(h.name) + '">'
      + '<div><h3>' + esc(h.name) + '</h3>'
      + '<div class="hx-badges"><span class="hx-badge rarity">' + esc(h.rarity) + '</span>'
      + '<span class="hx-badge type">' + esc(h.type) + '</span></div></div></div>'
      + ((tags || effects) ? '<div class="hx-modal-tags">' + tags + effects + '</div>' : '');
    if (!build) {
      out += '<div class="hx-modal-build"><h4>Build</h4><p>Chưa có hướng dẫn build cho hero này.</p></div>';
    } else {
      var set = (build.gear.sets || [])[0] || {};
      var setImg = setIcon(set.name || '');
      var subs = (build.substats || []).slice(0, 4);
      /* Main stat: Chính và Phụ tách thành 2 hàng riêng. */
      function mainStatHtml(label, iconFile, arr) {
        var best = arr[0], alt = arr.slice(1);
        var row = '<div class="hx-mainstat"><small><img src="assets/gearui/' + esc(iconFile) + '" alt="" loading="lazy">' + esc(label) + '</small>'
          + '<div class="hx-ms-row"><span class="hx-ms-tag">Chính</span><span>' + esc(statLabel(best || '—')) + '</span></div>';
        if (alt.length) {
          row += '<div class="hx-ms-row alt"><span class="hx-ms-tag">Phụ</span><span>' + esc(alt.map(statLabel).join(' / ')) + '</span></div>';
        }
        return row + '</div>';
      }
      out += '<div class="hx-modal-build"><h4>Build: ' + esc(build.name) + '</h4>'
        + '<div class="hx-gear-set">'
        + (setImg ? '<img src="assets/seticons/' + esc(setImg) + '" alt="" loading="lazy">' : '')
        + '<div><b>' + esc(set.name || '') + '</b>'
        + (set.effect ? '<p>' + esc(set.effect) + '</p>' : '') + '</div></div>'
        + '<div class="hx-mainstats">'
        + mainStatHtml('Chỉ số chính Vũ khí', 'weapon.webp', build.gear.weapon || [])
        + mainStatHtml('Chỉ số chính Giáp', 'armor.webp', build.gear.armor || [])
        + '</div>'
        + '<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#8b8578;margin:12px 0 6px">ƯU TIÊN DÒNG PHỤ</div>'
        + '<ul class="hx-substats">'
        + subs.map(function (s, i) {
          var icon = STAT_ICONS[s];
          return '<li>' + (icon ? '<img src="assets/substats/' + esc(icon) + '" alt="" style="width:20px;height:20px;object-fit:contain">' : '') + esc(statLabel(s)) + '</li>';
        }).join('')
        + '</ul>';
      var gearNotes = (vi.builds && vi.builds[buildIdx] && vi.builds[buildIdx].gear_notes) || build.gear_notes || '';
      if (gearNotes) out += '<div class="hx-modal-note">' + esc(gearNotes) + '</div>';
      if (h.dedicated) {
        /* Trang bị riêng: hiển thị luôn dòng substat nên build (cột khớp
         * với ded_stat của build này), không chỉ tên trang bị. */
        var pick = build.ded_stat || '';
        var aStat = (h.dedicated.a && h.dedicated.a[0] && (typeof h.dedicated.a[0] === 'string' ? h.dedicated.a[0] : h.dedicated.a[0].name)) || '';
        var col = (pick && aStat === pick) ? (h.dedicated.a || []) : (h.dedicated.b || []);
        if (!col.length && pick) col = (h.dedicated.a || []).concat(h.dedicated.b || []);
        var lines = [];
        var seen = {};
        col.forEach(function (x) {
          var n = typeof x === 'string' ? x : (x.name || '');
          var val = (typeof x === 'object' && x.value) || '';
          if (!n || seen[n]) return;
          seen[n] = true;
          lines.push(statLabel(n) + (val ? ' ' + val : ''));
        });
        out += '<p class="hx-modal-dedi"><b>Trang bị riêng:</b> '
          + esc(h.dedicated.name) + ' — ' + esc(h.dedicated.main_stat)
          + (lines.length ? '<span class="hx-dedi-lines">Nên build: ' + esc(lines.join(' · ')) + '</span>' : '')
          + '</p>';
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
