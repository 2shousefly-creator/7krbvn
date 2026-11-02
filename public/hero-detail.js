/* Hero detail page (hero.html): two tabs (Chi tiết / Build đồ) rendered
 * from data/heroes/<id>.json. Version switcher AWK / 6★ changes portrait,
 * base stats, skills and enhancement priority (Atlas behaviour).
 * Data source: 7k Atlas (codex + hero-data), extracted locally.
 */
(function () {
  var STAT_LABELS = { 'AllATK%': 'All Attack %', 'AllATK': 'All Attack', 'Block': 'Block Rate', 'Crit': 'Crit Rate', 'CritDMG': 'Crit Damage', 'Crush': 'Crush', 'DEF%': 'DEF%', 'DEF': 'DEF', 'DMGAmp': 'Damage Amplification', 'DmgTakenReduce': 'Damage Taken Reduction', 'EffectHit': 'Effect Hit Rate', 'EffectRes': 'Effect Resistance', 'HP%': 'HP%', 'HP': 'HP', 'MATK%': 'Magic Attack %', 'MATK': 'Magic Attack', 'PATK%': 'Physical Attack %', 'PATK': 'Physical Attack', 'Rejuvenate': 'Rejuvenate', 'Resilience': 'Resilience', 'SkillAccel': 'Skill Acceleration', 'Speed': 'Speed', 'WeaknessHit': 'Weakness Hit Chance' };
  var STAT_ICONS = { 'AllATK%': 'AllATKpct.webp', 'AllATK': 'AllATK.webp', 'Block': 'Block.webp', 'Crit': 'Crit.webp', 'CritDMG': 'CritDMG.webp', 'Crush': 'Crush.webp', 'DEF%': 'DEFpct.webp', 'DEF': 'DEF.webp', 'DMGAmp': 'DMGAmp.webp', 'DmgTakenReduce': 'DmgTakenReduce.webp', 'EffectHit': 'EffectHit.webp', 'EffectRes': 'EffectRes.webp', 'HP%': 'HPpct.webp', 'HP': 'HP.webp', 'MATK%': 'MATKpct.webp', 'MATK': 'MATK.webp', 'PATK%': 'PATKpct.webp', 'PATK': 'PATK.webp', 'Rejuvenate': 'Rejuvenate.webp', 'Resilience': 'Resilience.webp', 'SkillAccel': 'SkillAccel.webp', 'Speed': 'Speed.webp', 'WeaknessHit': 'WeaknessHit.webp' };
  var MODE_LABELS = { 'ARENA': 'Arena', 'TOTAL WAR': 'Total War', 'GUILD WAR': 'Guild War', 'REAL-TIME ARENA': 'Real-Time Arena', 'ADVENTURE BOTH': 'Adventure (Both)', 'ADVENTURE (NORMAL)': 'Adventure (Normal)', 'ADVENTURE (CHALLENGE)': 'Adventure (Challenge)', 'INFINITE TOWER': 'Infinite Tower', 'TOWER OF TRIALS': 'Tower of Trials', 'ADVENT-GOD': 'God of Destruction', 'ADVENT-PHYS': 'Kyle & Karma', 'PUDUNGEON-EARTH': 'Earth', 'PUDUNGEON-GOLD': 'Gold', 'PUDUNGEON-FIRE': 'Fire', 'PUDUNGEON-WATER': 'Water', 'PUDUNGEON-LIGHT': 'Light', 'PUDUNGEON-DARK': 'Dark', 'SUDDENRAID-LEONID': 'Leonid', 'SUDDENRAID-CALISTRA': 'Calistra', 'CR-456': 'Castle Rush (Thu/Fri/Sat)', 'CR-KRIS': 'Castle Rush: Kris', 'CR-LEONID': 'Castle Rush: Leonid' };
  var TIER_COLORS = { 'SSS': '#EB8DFF', 'SS': '#FF6767', 'S': '#FBBC04', 'A': '#FEFF31', 'B': '#8CE669', 'C': '#58CDDA', 'D': '#699FE6', 'NOT USED': '#D9D9D9' };
  var DASHBOARD_ART = { 'power-up-dungeon-roles': 'powerupdungeon', 'raid': 'raid', 'sudden-raid': 'suddenraid', 'castle-rush': 'castlerush', 'advent-expedition': 'adventexpedition', 'arena': 'arena', 'total-war': 'totalwar', 'guild-war': 'guildwar', 'farming': 'farming' };
  var TX_GOALS = [['pve', 'PVE'], ['tower', 'Towers'], ['pvp', 'PVP'], ['gw', 'Guild War'], ['cp', 'Combat Power']];
  var TX_TIERS = [0, 1, 2, 3, 4, 5, 6, 12];
  var REASON_LABEL = { 'awakened': 'Awakened', 'effect': 'Effect', 'role-single': 'Single-Target DPS', 'role-three': '3-Target DPS', 'role-aoe': '4/5-Target DPS', 'widely-used': 'Widely used' };

  var params = new URLSearchParams(location.search);
  var heroId = params.get('id') || '';
  var tab = params.get('tab') === 'builds' ? 'builds' : 'main';
  var version = 's6';
  var buildIdx = 0;
  var hero = null;
  var index = [];

  var sideEl = document.getElementById('hx-side');
  var mainEl = document.getElementById('hx-content');
  var tabMainBtn = document.getElementById('hx-tab-main');
  var tabBuildsBtn = document.getElementById('hx-tab-builds');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function statLabel(code) { return STAT_LABELS[code] || code; }
  function fmtDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }
  function sectionTitle(t) { return '<h3 class="hx-section-title">' + esc(t) + '</h3>'; }

  function skillsFor(v) {
    return v === 'awk' ? (hero.skills.awk || []) : (hero.skills.s6 || hero.skills.awk || []);
  }
  function statsFor(v) {
    return v === 'awk' ? (hero.stats.awk || hero.stats.s6 || {}) : (hero.stats.s6 || {});
  }
  function enhanceFor(v) {
    return v === 'awk' ? (hero.enhance.awk || []) : (hero.enhance.s6 || []);
  }
  function portraitFor(v) {
    return v === 'awk' ? 'assets/hero-awk-' + hero.id + '.webp' : 'assets/hero-' + hero.id + '.webp';
  }
  function skillIcon(sk) {
    return sk.icon ? 'assets/skills-raw/' + sk.icon : null;
  }

  /* ---------- left column ---------- */
  function renderSide() {
    var versions = hero.awakened_date
      ? [{ key: 'awk', label: 'AWK' }, { key: 's6', label: '6★' }]
      : [{ key: 's6', label: '6★' }];
    if (version === 'awk' && !hero.awakened_date) version = 's6';
    var st = statsFor(version);
    var names = [hero.names.kr, hero.names.cn, hero.names.jp, hero.names.th].filter(Boolean).join(' · ');
    var pve = (hero.used_in || []).filter(function (u) { return u.cat === 'pve'; });
    var pvp = (hero.used_in || []).filter(function (u) { return u.cat === 'pvp'; });
    function usedHtml(list) {
      return list.map(function (u) {
        return '<span class="hx-usedin-item"><img src="assets/modes/' + esc(u.banner) + '" alt="" loading="lazy">' + esc(u.tip) + '</span>';
      }).join('');
    }
    var nav = '';
    if (index.length) {
      var i = index.findIndex(function (h) { return h.id === hero.id; });
      if (i > 0) nav += '<a class="hx-btn" href="hero.html?id=' + esc(index[i - 1].id) + '">← ' + esc(index[i - 1].name) + '</a>';
      if (i >= 0 && i < index.length - 1) nav += '<a class="hx-btn" href="hero.html?id=' + esc(index[i + 1].id) + '">' + esc(index[i + 1].name) + ' →</a>';
    }
    sideEl.innerHTML =
      '<img class="hx-portrait" src="' + esc(portraitFor(version)) + '" alt="' + esc(hero.name) + '">'
      + '<div class="hx-version">' + versions.map(function (v) {
        return '<button type="button" data-version="' + v.key + '" class="' + (v.key === version ? 'active' : '') + '">' + esc(v.label) + '</button>';
      }).join('') + '</div>'
      + '<h1>' + esc(hero.name.toUpperCase()) + '</h1>'
      + (names ? '<div class="hx-names">' + esc(names) + '</div>' : '')
      + '<div class="hx-dates">Phát hành: ' + esc(fmtDate(hero.release))
      + (hero.awakened_date ? '<br>Thức tỉnh: ' + esc(fmtDate(hero.awakened_date)) : '') + '</div>'
      + '<span class="hx-badge type hx-faction">' + esc(hero.faction) + '</span>'
      + '<div class="hx-stats">'
      + '<div class="hx-stat"><small>PATK</small><b>' + esc(st.patk != null ? st.patk.toLocaleString('en-US') : '—') + '</b></div>'
      + '<div class="hx-stat"><small>HP</small><b>' + esc(st.hp != null ? st.hp.toLocaleString('en-US') : '—') + '</b></div>'
      + '<div class="hx-stat"><small>DEF</small><b>' + esc(st.def != null ? st.def.toLocaleString('en-US') : '—') + '</b></div>'
      + '<div class="hx-stat"><small>SPD</small><b>' + esc(st.spd != null ? st.spd : '—') + '</b></div>'
      + '</div>'
      + (pve.length ? '<div class="hx-usedin"><h4>Dùng trong PVE</h4><div class="hx-orb">' + usedHtml(pve) + '</div></div>' : '')
      + (pvp.length ? '<div class="hx-usedin"><h4>Dùng trong PVP</h4><div class="hx-orb">' + usedHtml(pvp) + '</div></div>' : '')
      + (nav ? '<div class="hx-usedin"><h4>Hero khác</h4><div style="display:flex;gap:8px;flex-wrap:wrap">' + nav + '</div></div>' : '');
    sideEl.querySelectorAll('[data-version]').forEach(function (b) {
      b.addEventListener('click', function () {
        version = b.getAttribute('data-version');
        renderAll();
      });
    });
  }

  /* ---------- MAIN tab ---------- */
  function skillCardHtml(sk) {
    var isPassive = /passive/i.test(sk.type || '');
    var isAwakened = sk.key === 'awakened' || /awaken/i.test(sk.type || '');
    var typeLabel = isAwakened && isPassive ? 'Awakened Passive' : (sk.type || '');
    var icon = skillIcon(sk);
    var iconHtml = icon
      ? '<img src="' + esc(icon) + '" alt="" loading="lazy">'
      : '<span style="font-size:26px;line-height:56px;text-align:center;width:56px;flex:none">' + (isPassive ? '🌀' : isAwakened ? '🌊' : sk.key === 'basic' ? '⚔️' : '💥') + '</span>';
    var cd = '';
    if (isAwakened) {
      cd = sk.gauge != null ? '<div class="hx-skill-cd">Awakening Gauge: ' + esc(sk.gauge) + '</div>' : '';
    } else if (sk.cd) {
      cd = '<div class="hx-skill-cd">⏱ Cooldown: ' + esc(sk.cd) + 's</div>';
    } else if (!isPassive && sk.key !== 'basic') {
      cd = '<div class="hx-skill-cd">⏱ Cooldown: –</div>';
    }
    var groups = (sk.effects || []).map(function (g) {
      return (g.target ? '<div class="hx-skill-target">' + esc(g.target) + '</div>' : '')
        + (g.lines || []).map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('');
    }).join('');
    var bubbles = (sk.bubbles || []).length
      ? '<div class="hx-tips">' + sk.bubbles.map(function (b) {
        var suffix = [b.variant, b.note].filter(Boolean).join(', ');
        return '<span class="hx-tip" title="' + esc(b.label) + '">' + esc(b.label + (suffix ? ' (' + suffix + ')' : '')) + '</span>';
      }).join('') + '</div>' : '';
    var enhance = (sk.enhancement || []).length
      ? '<div class="hx-notes" style="background:#f2f7ff;border-color:#c8d8f2"><b>Skill Enhancement</b>'
        + sk.enhancement.map(function (e) {
          return '<p style="margin:6px 0 0">' + (e.target ? '<b>' + esc(e.target) + ':</b> ' : '') + esc(e.effect) + '</p>';
        }).join('') + '</div>' : '';
    var txOrder = { T2: 0, T4: 1, T6: 2 };
    var tx = (sk.tx || []).slice().sort(function (a, b) { return (txOrder[a.tier] || 99) - (txOrder[b.tier] || 99); });
    var txHtml = tx.length
      ? '<div style="margin-top:8px">' + tx.map(function (t) {
        return '<p style="font-size:12.5px;color:#946b25;margin:4px 0"><b>' + esc(t.tier) + '</b> ' + esc(t.effect) + '</p>';
      }).join('') + '</div>' : '';
    return '<div class="hx-skill" id="skill-' + esc(sk.key) + '">' + iconHtml
      + '<div style="flex:1;min-width:0"><h4>' + esc(sk.name || 'Basic Attack') + '</h4>'
      + '<span class="hx-skill-type">' + esc(typeLabel) + '</span>' + cd
      + groups + bubbles + enhance + txHtml + '</div></div>';
  }

  function renderSkills(skills) {
    var out = '';
    var seen = {};
    skills.forEach(function (sk) {
      if (seen[sk.key]) return;
      seen[sk.key] = true;
      var after = skills.find(function (o) { return o.key === sk.key && o.converts; });
      if (after && !sk.converts) {
        out += '<div class="hx-cardbox" style="margin-bottom:10px"><b style="font-size:13px">⇄ Skill Conversion — kỹ năng thay đổi sau khi biến hình</b>'
          + '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:start;margin-top:10px">'
          + '<div><small style="font-weight:800;color:#8b8578">TRƯỚC</small>' + skillCardHtml(sk) + '</div>'
          + '<div style="font-size:22px;padding-top:40px">→</div>'
          + '<div><small style="font-weight:800;color:#b3352c">SAU</small>' + skillCardHtml(after) + '</div>'
          + '</div></div>';
      } else if (!sk.converts) {
        out += skillCardHtml(sk);
      }
    });
    return out;
  }

  function txStarState(i, n) { return n >= 6 + i ? 2 : n >= i ? 1 : 0; }

  function renderGrowth() {
    var tx = (hero.growth || {}).transcendence || {};
    var rows = TX_GOALS.map(function (goal) {
      var key = goal[0], label = goal[1];
      var tiers = TX_TIERS.filter(function (n) { return ((tx['t' + n] || {}).badges || {})[key]; });
      if (!tiers.length) return '';
      var top = tiers[tiers.length - 1];
      var topTier = tx['t' + top] || {};
      var stars = '';
      for (var i = 1; i <= 6; i++) {
        var s = txStarState(i, top);
        stars += '<span style="color:' + (s === 2 ? '#c9a227' : s === 1 ? '#946b25' : '#d8d5cc') + '">★</span>';
      }
      var links = (topTier.skill_links || []).map(function (l) {
        return ' <a href="#skill-' + esc(l.target_id ? l.target_id.split('-')[0] : '') + '">↓ ' + esc(l.label) + '</a>';
      }).join('');
      var tierText = tiers.length > 1 ? 'T' + tiers[0] + ' → T' + top : 'T' + top;
      return '<div class="hx-tx-row"><div style="flex:1"><span class="hx-tx-level">' + esc(label) + ' · ' + tierText + '</span> '
        + '<span style="letter-spacing:2px">' + stars + '</span>'
        + '<div class="hx-tx-effect">' + esc(topTier.effect || '') + links + '</div></div></div>';
    }).join('');
    var pot = (hero.growth || {}).potential || {};
    var potHtml = Object.keys(pot).map(function (k) {
      var p = pot[k];
      // Atlas has no potential-SPD.webp (404); reuse the substat Speed icon.
      var icon = k.toUpperCase() === 'SPD' ? 'assets/substats/Speed.webp'
        : 'assets/ui/potential-' + k.toUpperCase() + '.webp';
      return '<div class="hx-pot-item"><span><img src="' + esc(icon) + '" alt="" style="width:18px;height:18px;vertical-align:-4px;margin-right:6px">' + esc(k.toUpperCase()) + '</span><b>' + esc(p.value || '') + (p.rec ? ' <span style="color:#1f7a74;font-size:11.5px">· Khuyên dùng</span>' : '') + '</b></div>';
    }).join('');
    return '<div class="hx-growth"><div><h4 style="margin:0 0 10px;font-size:13px">Transcendence</h4>' + (rows || '<p style="font-size:13.5px;color:#8b8578">Chưa có dữ liệu.</p>') + '</div>'
      + '<div><h4 style="margin:0 0 10px;font-size:13px">Potential</h4>' + (potHtml || '<p style="font-size:13.5px;color:#8b8578">Chưa có dữ liệu.</p>') + '</div></div>';
  }

  function renderMain() {
    var ov = hero.overview || {};
    var skills = skillsFor(version);
    var enh = enhanceFor(version);
    var util = ov.utility || {};
    var utilHtml = ['none', 'early', 'mid', 'end'].map(function (k) {
      var label = { none: 'None', early: 'Early Game', mid: 'Mid Game', end: 'End Game' }[k];
      var icon = 'assets/ui/utility-' + (k === 'none' ? 'None' : k === 'early' ? 'EarlyGame' : k === 'mid' ? 'MidGame' : 'EndGame') + '.webp';
      return '<div class="hx-util ' + (util[k] ? 'on' : 'off') + '"><img src="' + esc(icon) + '" alt="" style="width:22px;height:22px;display:block;margin:0 auto 4px">' + esc(label) + '</div>';
    }).join('');
    var sources = (ov.sources || []).map(function (s) {
      var label = typeof s === 'string' ? s : (s.label || '');
      var icon = typeof s === 'object' && s.icon ? '<img src="assets/herosource/' + esc(s.icon) + '" alt="" style="width:20px;height:20px;object-fit:contain;vertical-align:-5px;margin-right:5px">' : '✦ ';
      return '<span class="hx-chip">' + icon + esc(label) + '</span>';
    }).join('');
    var tiers = (hero.tiers || []).map(function (t) {
      var art = DASHBOARD_ART[t.mode] || 'arena';
      var color = TIER_COLORS[t.tier] || '#8b8578';
      return '<div class="hx-tier" style="position:relative;overflow:hidden">'
        + '<img src="assets/ui/dashboard-' + esc(art) + '.webp" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.35">'
        + '<div style="position:relative"><b>' + esc(t.label) + '</b>'
        + '<div class="hx-tier-grade" style="color:' + color + '">' + esc(t.tier) + '</div>'
        + '<small>' + (t.role ? esc(t.role) + ' · ' : '') + (t.tx ? 'at ' + esc(t.tx) : '') + '</small></div></div>';
    }).join('');
    var enhHtml = enh.length ? '<div class="hx-enhance">' + enh.map(function (e, i) {
      var sk = skills.find(function (s) { return s.key === e.key; });
      var icon = sk && skillIcon(sk);
      return '<div class="hx-enhance-item"><span class="hx-num">' + (i + 1) + '</span>'
        + (icon ? '<img src="' + esc(icon) + '" alt="" loading="lazy">' : '')
        + '<b>' + esc(e.name) + '</b><span class="hx-enhance-tag">ENHANCE · ' + esc(REASON_LABEL[e.reason] || e.reason) + '</span></div>';
    }).join('') + '</div>' : '<p style="font-size:13.5px;color:#8b8578">Chưa có dữ liệu ưu tiên nâng skill.</p>';
    var bg = hero.lore ? '<details class="hx-bgdetails"><summary>Background</summary><div class="hx-bgbody">'
      + hero.lore.split('\n').filter(function (l) { return l.trim(); }).map(function (l) { return '<p>' + esc(l.trim()) + '</p>'; }).join('') + '</div></details>' : '';
    mainEl.innerHTML =
      sectionTitle('Hero Overview')
      + '<div class="hx-cardbox"><p style="margin:0 0 12px;font-size:14px;line-height:1.65">' + esc(ov.desc || 'Chưa có mô tả.') + '</p>'
      + '<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#8b8578;margin-bottom:6px">TAGS</div>'
      + '<div class="hx-chips">' + (hero.tags || []).map(function (t) { return '<span class="hx-chip">' + esc(t) + '</span>'; }).join('') + '</div>'
      + ((ov.effects || []).length ? '<div class="hx-chips" style="margin-top:8px">' + ov.effects.map(function (b) {
        var suffix = [b.variant, b.note].filter(Boolean).join(', ');
        return '<span class="hx-chip effect">' + esc(b.label + (suffix ? ' (' + suffix + ')' : '')) + '</span>';
      }).join('') + '</div>' : '')
      + '</div>'
      + sectionTitle('Hero Utility by Progression')
      + '<div class="hx-utility">' + utilHtml + '</div>'
      + (sources ? sectionTitle('Special Sources') + '<div class="hx-chips">' + sources + '</div>' : '')
      + (tiers ? sectionTitle('Tier List Grades') + '<div class="hx-tiergrid">' + tiers + '</div>' : '')
      + sectionTitle('Growth') + renderGrowth()
      + sectionTitle(hero.awakened_date ? (version === 'awk' ? 'Skills (Awakened)' : 'Skills (Pre-Awakening)') : 'Skills')
      + renderSkills(skills)
      + sectionTitle('Skill Enhancement Priority') + enhHtml
      + bg;
  }

  /* ---------- BUILDS tab ---------- */
  function renderBuilds() {
    var builds = hero.builds || [];
    if (!builds.length) {
      mainEl.innerHTML = sectionTitle('Build đồ')
        + '<div class="hx-cardbox"><p style="margin:0">Chưa có hướng dẫn build cho hero này.</p></div>';
      return;
    }
    if (buildIdx >= builds.length) buildIdx = 0;
    var b = builds[buildIdx];
    var listHtml = '<div class="hx-build-list">' + builds.map(function (bb, i) {
      var modes = (bb.modes || []).map(function (m) { return MODE_LABELS[m] || m; }).join(', ');
      return '<button type="button" data-build="' + i + '" class="' + (i === buildIdx ? 'active' : '') + '">' + esc(bb.name)
        + (modes ? '<span class="hx-build-modes">' + esc(modes) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
    var set = (b.gear.sets || [])[0] || {};
    function mainStatHtml(label, arr) {
      var best = arr[0], alt = arr.slice(1);
      return '<div class="hx-mainstat"><small>' + esc(label) + '</small><b>BEST</b> ' + esc(statLabel(best || '—'))
        + (alt.length ? '<br><span style="color:#8b8578">ALT</span> ' + esc(alt.map(statLabel).join(' / ')) : '') + '</div>';
    }
    var subs = (b.substats || []).map(function (s) {
      var icon = STAT_ICONS[s];
      return '<li>' + (icon ? '<img src="assets/substats/' + esc(icon) + '" alt="" style="width:20px;height:20px;object-fit:contain">' : '') + esc(statLabel(s)) + '</li>';
    }).join('');
    function accCard(a) {
      function side(info, label) {
        if (!info) return '<div><small>' + esc(label) + '</small><br><b>' + esc('—') + '</b></div>';
        return '<div><small>' + esc(label) + '</small><br><img src="assets/acc/' + esc(info.icon) + '" alt="" loading="lazy"><b>' + esc(info.label) + '</b><br><small>' + esc(info.value || '') + '</small></div>';
      }
      var sub = a.sub_info ? side(a.sub_info, 'SUB ACC')
        : (a.sub === 'Any CC' ? '<div><small>SUB ACC</small><br><b>Bất kỳ nhẫn CC nào</b></div>' : side(null, 'SUB ACC'));
      return '<div class="hx-acc"><div class="hx-acc-label">' + esc(a.label || 'OPTION') + '</div>'
        + side(a.main_info, 'MAIN ACC') + sub + '</div>';
    }
    var accs = (b.acc || []).map(accCard).join('');
    var ded = hero.dedicated;
    var dedHtml = '';
    if (ded) {
      function deList(arr) {
        return '<ul>' + arr.map(function (x) {
          var n = typeof x === 'string' ? x : (x.name || '');
          var val = (typeof x === 'object' && x.value) || '';
          var icon = (typeof x === 'object' && x.icon) || STAT_ICONS[n];
          return '<li style="display:flex;gap:8px;align-items:center">'
            + (icon ? '<img src="assets/substats/' + esc(icon) + '" alt="" style="width:20px;height:20px;object-fit:contain">' : '')
            + '<span>' + esc(statLabel(n)) + '</span>'
            + (val ? '<b style="margin-left:auto">' + esc(val) + '</b>' : '') + '</li>';
        }).join('') + '</ul>';
      }
      var aStat = (ded.a && ded.a[0] && (typeof ded.a[0] === 'string' ? ded.a[0] : ded.a[0].name)) || '';
      var bStat = (ded.b && ded.b[0] && (typeof ded.b[0] === 'string' ? ded.b[0] : ded.b[0].name)) || '';
      var pick = b.ded_stat || '';
      var aOn = pick && aStat === pick;
      var bOn = pick && bStat === pick;
      var second = ded.second === 'yes'
        ? '<span class="hx-pill yes">YES</span>'
        : ded.second === 'no' ? '<span class="hx-pill no">NO</span>'
        : ded.second === 'optional' ? '<span class="hx-pill" style="background:#fdf6e3;color:#946b25">OPTIONAL</span>'
        : esc(ded.second || '');
      var why = pick && ded.why_by_stat ? (ded.why_by_stat[pick] || '') : '';
      dedHtml = '<div class="hx-cardbox hx-dedicated">' + sectionTitle('Dedicated Equipment')
        + '<div class="hx-de-head">'
        + (ded.icon ? '<img src="assets/dedicated/' + esc(ded.icon) + '" alt="" loading="lazy">' : '')
        + '<div><b style="font-size:16px">' + esc(ded.name) + '</b><br><span style="font-size:13.5px;color:#6b6558">Main Stat: ' + esc(ded.main_stat) + '</span></div></div>'
        + '<div class="hx-de-cols"><div class="hx-de-col this" style="' + (aOn ? '' : 'opacity:.55') + '"><h5>Substats A' + (aOn ? ' — Build này' : '') + '</h5>' + deList(ded.a || []) + '</div>'
        + '<div class="hx-de-col" style="' + (bOn ? '' : 'opacity:.55') + '"><h5>Substats B' + (bOn ? ' — Build này' : '') + '</h5>' + deList(ded.b || []) + '</div></div>'
        + '<p style="font-size:13.5px;margin:14px 0 4px"><b>Nên build trang bị riêng thứ 2 ngay?</b> ' + second + '</p>'
        + (pick ? '<p style="font-size:13.5px;margin:4px 0 0"><b>Vì sao ' + esc(statLabel(pick)) + '?</b> ' + esc(why) + '</p>' : '')
        + (ded.story ? '<details class="hx-bgdetails" style="margin-top:12px"><summary>Background</summary><div class="hx-bgbody"><p>' + esc(ded.story) + '</p></div></details>' : '')
        + '</div>';
    }
    mainEl.innerHTML =
      '<div class="hx-builds">' + listHtml
      + '<div class="hx-build-main">'
      + sectionTitle('Gears')
      + '<div class="hx-cardbox"><div class="hx-gear-set"><b>' + esc(set.name || '—') + '</b>'
      + (set.effect ? '<p>' + esc(set.effect) + '</p>' : '') + '</div>'
      + '<div class="hx-mainstats">'
      + mainStatHtml('Weapon Main Stat', b.gear.weapon || [])
      + mainStatHtml('Armor Main Stat', b.gear.armor || [])
      + '</div>'
      + (subs ? '<ol class="hx-substats">' + subs + '</ol>' : '')
      + (b.gear_notes ? '<div class="hx-notes">' + esc(b.gear_notes) + '</div>' : '')
      + '</div>'
      + (accs ? sectionTitle('Accessory Combinations') + '<div class="hx-acc-grid">' + accs + '</div>' : '')
      + '</div></div>'
      + dedHtml;
    mainEl.querySelectorAll('[data-build]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        buildIdx = parseInt(btn.getAttribute('data-build'), 10);
        renderBuilds();
      });
    });
  }

  /* ---------- tabs + boot ---------- */
  function setTab(t) {
    tab = t;
    var u = new URL(location.href);
    u.searchParams.set('tab', t);
    history.replaceState(null, '', u.toString());
    tabMainBtn.classList.toggle('active', t === 'main');
    tabBuildsBtn.classList.toggle('active', t === 'builds');
    if (t === 'main') renderMain(); else renderBuilds();
    window.scrollTo({ top: 0 });
  }

  function renderAll() {
    document.title = hero.name + ' — Heroes | 7K RBVN';
    renderSide();
    if (tab === 'main') renderMain(); else renderBuilds();
  }

  tabMainBtn.addEventListener('click', function () { setTab('main'); });
  tabBuildsBtn.addEventListener('click', function () { setTab('builds'); });

  if (!heroId) {
    mainEl.innerHTML = '<div class="hx-cardbox"><p style="margin:0">Chưa chọn hero. <a href="heroes.html">Về danh sách Heroes →</a></p></div>';
  } else {
    fetch('data/heroes-index.json').then(function (r) { return r.json(); }).then(function (data) {
      index = data;
      return fetch('data/heroes/' + encodeURIComponent(heroId) + '.json');
    }).then(function (r) { if (!r.ok) throw new Error('not found'); return r.json(); }).then(function (data) {
      hero = data;
      version = hero.awakened_date ? 'awk' : 's6';
      tabMainBtn.classList.toggle('active', tab === 'main');
      tabBuildsBtn.classList.toggle('active', tab === 'builds');
      renderAll();
    }).catch(function () {
      mainEl.innerHTML = '<div class="hx-cardbox"><p style="margin:0">Không tìm thấy hero này. <a href="heroes.html">Về danh sách Heroes →</a></p></div>';
    });
  }
})();
