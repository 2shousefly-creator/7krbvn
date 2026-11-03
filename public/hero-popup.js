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
  /* Gear piece art (Atlas Raid sets): [boss abbr, set stem]. Weapon uses
   * variant 2 for Magic heroes, 1 otherwise; armor always variant 3. */
  var SET_PIECE = { 'Bounty Tracker': ['DG', 'Bounty'], 'Paladin': ['DG', 'Paladin'], 'Vanguard': ['DG', 'Vanguard'], 'Assassin': ['NMW', 'Assassin'], 'Gatekeeper': ['NMW', 'Gatekeeper'], 'Guardian': ['NMW', 'Guardian'], 'Avenger': ['ID', 'Avenger'], 'Orchestrator': ['ID', 'Orchestrator'], 'Spellweaver': ['ID', 'Spell'] };
  function pieceImg(setName, slot, heroType) {
    var p = SET_PIECE[setName];
    if (!p) return null;
    var variant = slot === 'armor' ? 3 : (heroType === 'Magic' ? 2 : 1);
    return p[0] + '-' + p[1] + variant + '.webp';
  }

  var cache = {};
  var modal = null;
  var currentHero = null;
  var currentBuild = 0;

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

  /* Popup build theo kiểu Atlas: các build gộp chung 1 popup, chuyển qua
   * lại bằng tab Build 1 / Build 2 / ... Mỗi tab hiện 1 build đầy đủ
   * (set, chỉ số chính, dòng phụ, phụ kiện, trang bị riêng). Chỉ số chính
   * chỉ hiện giá trị tốt nhất (không còn Chính/Phụ như trước). */
  function buildHtml(h, buildIdx) {
    var builds = h.builds || [];
    var build = builds[buildIdx] || builds[0];
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
      /* Chỉ số chính: chỉ hiện giá trị tốt nhất của build này, kèm hình
       * minh họa thật của món đồ trong set (ảnh 126px). */
      function mainStatHtml(label, pieceFile, arr) {
        var best = arr[0];
        return '<div class="hx-mainstat hx-with-piece">'
          + (pieceFile ? '<img class="hx-piece" src="assets/gearpieces/' + esc(pieceFile) + '" alt="">' : '')
          + '<div class="hx-ms-body"><small>' + esc(label) + '</small>'
          + '<div class="hx-ms-row"><span>' + esc(statLabel(best || '—')) + '</span></div>'
          + '</div></div>';
      }
      /* Phụ kiện: nhẫn chính + nhẫn tinh luyện của option tốt nhất. */
      function accHtml(acc) {
        if (!acc) return '';
        function accSide(info, fallbackText) {
          if (!info) return '<div class="hx-acc-side"><b>' + esc(fallbackText || '—') + '</b></div>';
          return '<div class="hx-acc-side">'
            + (info.icon ? '<img src="assets/acc/' + esc(info.icon) + '" alt="">' : '')
            + '<b>' + esc(info.label || '') + '</b>'
            + (info.value ? '<small>' + esc(info.value) + '</small>' : '') + '</div>';
        }
        var sub = acc.sub_info ? accSide(acc.sub_info)
          : (acc.sub === 'Any CC' || acc.sub === 'CC' ? '<div class="hx-acc-side"><b>Bất kỳ nhẫn CC nào</b></div>' : accSide(null));
        return '<div class="hx-acc-pair">'
          + accSide(acc.main_info)
          + '<span class="hx-acc-plus">+</span>'
          + sub + '</div>';
      }
      var tabs = builds.length > 1
        ? '<div class="hx-build-tabs">' + builds.map(function (bb, i) {
          return '<button type="button" data-popup-build="' + i + '" class="' + (i === buildIdx ? 'active' : '') + '">Build ' + (i + 1) + '</button>';
        }).join('') + '</div>' : '';
      out += '<div class="hx-modal-build">' + tabs
        + '<div class="hx-gear-set">'
        + (setImg ? '<img src="assets/seticons/' + esc(setImg) + '" alt="">' : '')
        + '<div><b>' + esc(set.name || '') + '</b>'
        + (set.effect ? '<p>' + esc(set.effect.replace('4pc', 'Set 4')) + '</p>' : '') + '</div></div>'
        + '<div class="hx-mainstats" style="grid-template-columns:1fr">'
        + mainStatHtml('Chỉ số chính Vũ khí', pieceImg(set.name || '', 'weapon', h.type), build.gear.weapon || [])
        + mainStatHtml('Chỉ số chính Giáp', pieceImg(set.name || '', 'armor', h.type), build.gear.armor || [])
        + '</div>'
        + '<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#8b8578;margin:12px 0 6px">ƯU TIÊN DÒNG PHỤ</div>'
        + '<ul class="hx-substats">'
        + subs.map(function (s, i) {
          var icon = STAT_ICONS[s];
          return '<li>' + (icon ? '<img src="assets/substats/' + esc(icon) + '" alt="" style="width:20px;height:20px;object-fit:contain">' : '') + esc(statLabel(s)) + '</li>';
        }).join('')
        + '</ul>';
      var acc0 = (build.acc || [])[0];
      if (acc0) {
        out += '<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#8b8578;margin:12px 0 6px">PHỤ KIỆN</div>' + accHtml(acc0);
      }
      var gearNotes = (vi.builds && vi.builds[buildIdx] && vi.builds[buildIdx].gear_notes) || build.gear_notes || '';
      if (gearNotes) out += '<div class="hx-modal-note">' + esc(gearNotes) + '</div>';
      if (h.dedicated) {
        /* Trang bị riêng: hiển thị luôn dòng substat nên build (cột khớp
         * với ded_stat của build này), không chỉ tên trang bị. Tên dòng
         * thuộc tính và giá trị in đậm. */
        var pick = build.ded_stat || '';
        var aStat = (h.dedicated.a && h.dedicated.a[0] && (typeof h.dedicated.a[0] === 'string' ? h.dedicated.a[0] : h.dedicated.a[0].name)) || '';
        var col = (pick && aStat === pick) ? (h.dedicated.a || []) : (h.dedicated.b || []);
        if (!col.length && pick) col = (h.dedicated.a || []).concat(h.dedicated.b || []);
        /* Đếm đủ số dòng giống nhau, vd "Crush +12% × 4". */
        var counts = {};
        var order = [];
        col.forEach(function (x) {
          var n = typeof x === 'string' ? x : (x.name || '');
          var val = (typeof x === 'object' && x.value) || '';
          if (!n) return;
          var key = n + '|' + val;
          if (!counts[key]) { counts[key] = 0; order.push(key); }
          counts[key]++;
        });
        var lines = order.map(function (k) {
          var parts = k.split('|');
          var c = counts[k];
          var label = statLabel(parts[0]) + (parts[1] ? ' ' + parts[1] : '');
          return '<b>' + esc(label) + '</b>' + (c > 1 ? ' × ' + c : '');
        });
        out += '<div class="hx-modal-dedi">'
          + (h.dedicated.icon ? '<img src="assets/dedicated/' + esc(h.dedicated.icon) + '" alt="" loading="lazy">' : '')
          + '<div><b>Trang bị riêng:</b> '
          + esc(h.dedicated.name) + ' — ' + esc(h.dedicated.main_stat)
          + (lines.length ? '<span class="hx-dedi-lines">Nên build: ' + lines.join(' · ') + '</span>' : '')
          + '</div></div>';
      }
      out += '</div>';
    }
    out += '<div class="hx-modal-actions">'
      + '<a class="hx-btn primary" href="hero.html?id=' + esc(h.id) + '">Chi tiết</a>'
      + '<a class="hx-btn" href="hero.html?id=' + esc(h.id) + '&amp;tab=builds">Xem build</a>'
      + '</div>';
    return out;
  }

  function renderPopup() {
    if (!currentHero || !modal) return;
    modal.querySelector('.hx-modal-body').innerHTML = buildHtml(currentHero, currentBuild);
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
      currentHero = h;
      /* Mặc định mở tab của build đang active (nếu có), không thì Build 1. */
      var idx = (h.builds || []).findIndex(function (b) { return b.active; });
      currentBuild = idx >= 0 ? idx : 0;
      renderPopup();
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
    var tab = e.target.closest('[data-popup-build]');
    if (tab) {
      currentBuild = parseInt(tab.getAttribute('data-popup-build'), 10) || 0;
      renderPopup();
      return;
    }
    var t = e.target.closest('[data-hero-popup]');
    if (t) {
      e.preventDefault();
      open(t.getAttribute('data-hero-popup'));
    }
  });

  window.HeroPopup = { open: open, close: close };
})();
