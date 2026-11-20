/* So sánh Hero (so-sanh.html): chọn 2 hero, đặt cạnh nhau theo từng hàng —
 * chân dung, độ hiếm, vai trò, phe, chỉ số 6★ / thức tỉnh, tên kỹ năng,
 * xếp hạng theo chế độ, build chính, trang bị riêng.
 * Dữ liệu local: data/heroes-index.json + data/heroes/<id>.json, tải bằng fetch.
 * Link chia sẻ: so-sanh.html?a=<id>&b=<id>.
 * Chỉ số cao hơn được tô đậm/xanh. Hero chưa thức tỉnh thì cột thức tỉnh
 * để trống kèm ghi chú — không tự điền số.
 */
(function () {
  'use strict';

  var INDEX_URL = 'data/heroes-index.json';
  var MODE_ORDER = ['arena', 'total-war', 'guild-war', 'advent-expedition', 'raid', 'castle-rush', 'sudden-raid', 'power-up-dungeon-roles', 'farming'];
  var MODE_LABELS = { 'arena': 'Arena', 'total-war': 'Total War', 'guild-war': 'Guild War', 'advent-expedition': 'Advent Expedition', 'raid': 'Raid', 'castle-rush': 'Castle Rush', 'sudden-raid': 'Sudden Raid', 'power-up-dungeon-roles': 'Power Up Dungeon', 'farming': 'Farming' };
  var SKILL_TYPE_VI = { 'Basic Attack': 'Tấn công thường', 'Skill 1': 'Kỹ năng 1', 'Skill 2': 'Kỹ năng 2', 'Passive': 'Nội tại', 'Active Skill': 'Kỹ năng chủ động', 'Awakened Skill': 'Thức tỉnh' };
  var SKILL_TYPE_ORDER = ['Basic Attack', 'Skill 1', 'Skill 2', 'Passive', 'Active Skill', 'Awakened Skill'];
  var STAT_DEFS = [
    { key: 'atk', label: 'Tấn công' },
    { key: 'hp', label: 'HP' },
    { key: 'def', label: 'DEF' },
    { key: 'spd', label: 'SPD' }
  ];

  /* Gõ không dấu vẫn khớp tên: bỏ dấu tiếng Việt rồi so sánh chữ thường. */
  function norm(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  function parseCompareParams(search) {
    var q = String(search || '').replace(/^\?/, '');
    var out = { a: null, b: null };
    if (!q) return out;
    var params = new URLSearchParams(q);
    var a = params.get('a'), b = params.get('b');
    if (a) out.a = a;
    if (b) out.b = b;
    return out;
  }

  function swapSelection(sel) {
    return { a: sel.b || null, b: sel.a || null };
  }

  /* Hạng cuối ở PvP hiển thị là PHẾ (key dữ liệu vẫn giữ "NOT USED"). */
  function tierLabel(tier) {
    return tier === 'NOT USED' ? 'PHẾ' : tier;
  }

  /* Tấn công dùng PATK (vật lý) hoặc MATK (phép) tùy hero. */
  function attackStat(stats) {
    if (!stats) return null;
    if (stats.patk != null) return { key: 'PATK', value: stats.patk };
    if (stats.matk != null) return { key: 'MATK', value: stats.matk };
    return null;
  }

  function statValue(hero, version, key) {
    if (!hero || !hero.stats) return null;
    var st = hero.stats[version];
    if (!st) return null;
    if (key === 'atk') {
      var a = attackStat(st);
      return a ? a.value : null;
    }
    return st[key] == null ? null : st[key];
  }

  /* 'a' / 'b' thắng, 'tie' hòa, null khi thiếu số để so. */
  function winnerFor(a, b) {
    if (a == null || b == null) return null;
    if (a > b) return 'a';
    if (b > a) return 'b';
    return 'tie';
  }

  /* Chỉ liệt kê TÊN kỹ năng theo loại, không bê toàn văn skill.
   * Hero thức tỉnh dùng bộ kỹ năng thức tỉnh (có thêm kỹ năng Thức tỉnh),
   * hero thường dùng bộ 6★. Kỹ năng cơ bản không có tên riêng trong dữ liệu
   * nên hiển thị bằng nhãn loại của nó. */
  function skillList(hero) {
    var kit = (hero.skills && hero.skills.awk && hero.skills.awk.length)
      ? hero.skills.awk
      : ((hero.skills && hero.skills.s6) || []);
    return kit.map(function (s) {
      return {
        type: s.type,
        label: SKILL_TYPE_VI[s.type] || s.type,
        name: (s.name && s.name.trim()) ? s.name : 'Tấn công thường'
      };
    });
  }

  function mainBuild(hero) {
    var builds = (hero && hero.builds) || [];
    for (var i = 0; i < builds.length; i++) {
      if (builds[i].active) return builds[i];
    }
    return builds[0] || null;
  }

  /* Gộp các chế độ có ở 1 trong 2 hero, theo thứ tự cố định. */
  function tierRows(heroA, heroB) {
    var byMode = {};
    [heroA, heroB].forEach(function (hero, i) {
      ((hero && hero.tiers) || []).forEach(function (t) {
        if (!byMode[t.mode]) byMode[t.mode] = { mode: t.mode, label: t.label || MODE_LABELS[t.mode] || t.mode, a: null, b: null };
        byMode[t.mode][i === 0 ? 'a' : 'b'] = { tier: t.tier, tx: t.tx || '' };
      });
    });
    var rows = Object.keys(byMode).map(function (m) { return byMode[m]; });
    rows.sort(function (x, y) {
      var ix = MODE_ORDER.indexOf(x.mode), iy = MODE_ORDER.indexOf(y.mode);
      return (ix === -1 ? 99 : ix) - (iy === -1 ? 99 : iy);
    });
    return rows;
  }

  /* ---- Phần chạy trên trình duyệt (guard để test Node vẫn require được) ---- */
  if (typeof document !== 'undefined') {
    var INDEX = [];
    var CACHE = {};
    var sel = { a: null, b: null };

    var inputA = document.getElementById('cp-search-a');
    var inputB = document.getElementById('cp-search-b');
    var suggestA = document.getElementById('cp-suggest-a');
    var suggestB = document.getElementById('cp-suggest-b');
    var pickedA = document.getElementById('cp-picked-a');
    var pickedB = document.getElementById('cp-picked-b');
    var resultEl = document.getElementById('cp-result');
    var copyBtn = document.getElementById('cp-copy-link');
    var copyMsg = document.getElementById('cp-copy-msg');

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }

    function findById(id) {
      for (var i = 0; i < INDEX.length; i++) if (INDEX[i].id === id) return INDEX[i];
      return null;
    }

    function loadHero(id) {
      if (CACHE[id]) return Promise.resolve(CACHE[id]);
      return fetch('data/heroes/' + encodeURIComponent(id) + '.json').then(function (r) {
        if (!r.ok) throw new Error('missing hero ' + id);
        return r.json();
      }).then(function (data) { CACHE[id] = data; return data; });
    }

    function updateUrl() {
      var p = new URLSearchParams();
      if (sel.a) p.set('a', sel.a);
      if (sel.b) p.set('b', sel.b);
      var qs = p.toString();
      var url = 'so-sanh.html' + (qs ? '?' + qs : '');
      try { window.history.replaceState(null, '', url); } catch (e) { /* bỏ qua */ }
    }

    function portraitFor(hero) {
      var idx = findById(hero.id);
      return (idx && idx.portrait) || ('assets/hero-' + hero.id + '.webp');
    }

    function statCell(value, win, note) {
      if (note) return '<td class="cp-note-cell">' + esc(note) + '</td>';
      if (value == null) return '<td>—</td>';
      return '<td class="' + (win ? 'cp-win' : '') + '">' + esc(String(value)) + '</td>';
    }

    /* Một khối chỉ số (6★ hoặc thức tỉnh). Hero thiếu khối này thì cột của
     * hero đó gộp thành một ô ghi chú duy nhất, không bịa số. */
    function statBlockRows(heroA, heroB, version, title) {
      var aHas = !!(heroA && heroA.stats && heroA.stats[version]);
      var bHas = !!(heroB && heroB.stats && heroB.stats[version]);
      var html = '<tr class="cp-section"><th colspan="3">' + esc(title) + '</th></tr>';
      STAT_DEFS.forEach(function (def, i) {
        var va = heroA ? statValue(heroA, version, def.key) : null;
        var vb = heroB ? statValue(heroB, version, def.key) : null;
        var w = (heroA && heroB) ? winnerFor(va, vb) : null;
        var label = def.label;
        if (def.key === 'atk') {
          var ka = heroA ? attackStat(heroA.stats && heroA.stats[version]) : null;
          var kb = heroB ? attackStat(heroB.stats && heroB.stats[version]) : null;
          if (ka && kb && ka.key === kb.key) label += ' (' + ka.key + ')';
          else if (ka || kb) label += ' (PATK/MATK)';
        }
        html += '<tr><th scope="row">' + esc(label) + '</th>';
        if (!aHas && heroA) {
          if (i === 0) html += '<td rowspan="4" class="cp-note-cell">Hero chưa thức tỉnh — chưa có chỉ số thức tỉnh.</td>';
        } else {
          html += statCell(va, w === 'a', null);
        }
        if (!bHas && heroB) {
          if (i === 0) html += '<td rowspan="4" class="cp-note-cell">Hero chưa thức tỉnh — chưa có chỉ số thức tỉnh.</td>';
        } else {
          html += statCell(vb, w === 'b', null);
        }
        html += '</tr>';
      });
      return html;
    }

    function skillRows(heroA, heroB) {
      var la = heroA ? skillList(heroA) : [];
      var lb = heroB ? skillList(heroB) : [];
      var html = '<tr class="cp-section"><th colspan="3">Kỹ năng — chỉ tên, bấm tên để xem chi tiết</th></tr>';
      SKILL_TYPE_ORDER.forEach(function (type) {
        var sa = null, sb = null;
        la.forEach(function (s) { if (s.type === type) sa = s; });
        lb.forEach(function (s) { if (s.type === type) sb = s; });
        if (!sa && !sb) return;
        html += '<tr><th scope="row">' + esc(SKILL_TYPE_VI[type] || type) + '</th>';
        html += '<td>' + (sa ? '<a href="hero.html?id=' + esc(heroA.id) + '">' + esc(sa.name) + '</a>' : '—') + '</td>';
        html += '<td>' + (sb ? '<a href="hero.html?id=' + esc(heroB.id) + '">' + esc(sb.name) + '</a>' : '—') + '</td></tr>';
      });
      return html;
    }

    function tierCell(entry) {
      if (!entry) return '<td>—</td>';
      var cls = entry.tier === 'NOT USED' ? 'cp-tier cp-tier-phe' : 'cp-tier';
      return '<td><span class="' + cls + '">' + esc(tierLabel(entry.tier)) + '</span>'
        + (entry.tx ? ' <span class="cp-tx">' + esc(entry.tx) + '</span>' : '') + '</td>';
    }

    function headCell(hero) {
      if (!hero) return '<th scope="col" class="cp-hero-empty">Chưa chọn hero</th>';
      return '<th scope="col"><a href="hero.html?id=' + esc(hero.id) + '">'
        + '<img src="' + esc(portraitFor(hero)) + '" alt="' + esc(hero.name) + '" loading="lazy">'
        + '<span>' + esc(hero.name) + '</span></a></th>';
    }

    function buildCell(hero) {
      if (!hero) return '<td>—</td>';
      var b = mainBuild(hero);
      if (!b) return '<td>—</td>';
      var sets = ((b.gear && b.gear.sets) || []).map(function (s) { return s.name; }).filter(Boolean);
      return '<td><b>' + esc(b.name) + '</b>'
        + (sets.length ? '<br><span class="cp-sub">Set: ' + esc(sets.join(', ')) + '</span>' : '')
        + '</td>';
    }

    function dedicatedCell(hero) {
      if (!hero) return '<td>—</td>';
      if (!hero.dedicated || !hero.dedicated.name) return '<td>Chưa có trang bị riêng.</td>';
      return '<td><b>' + esc(hero.dedicated.name) + '</b>'
        + (hero.dedicated.main_stat ? '<br><span class="cp-sub">' + esc(hero.dedicated.main_stat) + '</span>' : '')
        + '</td>';
    }

    function renderTable(heroA, heroB) {
      if (!heroA && !heroB) {
        resultEl.innerHTML = '<p class="cp-empty">Chọn 2 hero ở trên để xem bảng so sánh.</p>';
        return;
      }
      var html = '<div class="table-scroll"><table class="cp-table"><thead><tr><th scope="col"></th>'
        + headCell(heroA) + headCell(heroB) + '</tr></thead><tbody>';
      html += '<tr><th scope="row">Độ hiếm</th><td>' + (heroA ? esc(heroA.rarity) : '—') + '</td><td>' + (heroB ? esc(heroB.rarity) : '—') + '</td></tr>';
      html += '<tr><th scope="row">Vai trò</th><td>' + (heroA ? esc(heroA.type) : '—') + '</td><td>' + (heroB ? esc(heroB.type) : '—') + '</td></tr>';
      html += '<tr><th scope="row">Phe</th><td>' + (heroA ? esc(heroA.faction || '—') : '—') + '</td><td>' + (heroB ? esc(heroB.faction || '—') : '—') + '</td></tr>';
      html += statBlockRows(heroA, heroB, 's6', 'Chỉ số 6★');
      html += statBlockRows(heroA, heroB, 'awk', 'Chỉ số Thức tỉnh');
      html += skillRows(heroA, heroB);
      html += '<tr class="cp-section"><th colspan="3">Xếp hạng theo chế độ</th></tr>';
      tierRows(heroA, heroB).forEach(function (row) {
        html += '<tr><th scope="row">' + esc(row.label) + '</th>' + tierCell(row.a) + tierCell(row.b) + '</tr>';
      });
      html += '<tr class="cp-section"><th colspan="3">Build &amp; trang bị</th></tr>';
      html += '<tr><th scope="row">Build chính</th>' + buildCell(heroA) + buildCell(heroB) + '</tr>';
      html += '<tr><th scope="row">Trang bị riêng</th>' + dedicatedCell(heroA) + dedicatedCell(heroB) + '</tr>';
      html += '<tr><th scope="row">Chi tiết</th>'
        + '<td>' + (heroA ? '<a href="hero.html?id=' + esc(heroA.id) + '">Xem chi tiết ' + esc(heroA.name) + ' →</a>' : '—') + '</td>'
        + '<td>' + (heroB ? '<a href="hero.html?id=' + esc(heroB.id) + '">Xem chi tiết ' + esc(heroB.name) + ' →</a>' : '—') + '</td></tr>';
      html += '</tbody></table></div>';
      resultEl.innerHTML = html;
    }

    function refresh() {
      updateUrl();
      var jobs = [sel.a ? loadHero(sel.a).catch(function () { return null; }) : Promise.resolve(null),
                 sel.b ? loadHero(sel.b).catch(function () { return null; }) : Promise.resolve(null)];
      Promise.all(jobs).then(function (pair) { renderTable(pair[0], pair[1]); });
    }

    function renderPicked(side) {
      var id = sel[side];
      var box = side === 'a' ? pickedA : pickedB;
      var input = side === 'a' ? inputA : inputB;
      if (!id) { box.innerHTML = ''; input.value = ''; return; }
      var idx = findById(id);
      box.innerHTML = '<span class="cp-picked-chip"><img src="' + esc(idx ? idx.portrait : 'assets/hero-' + id + '.webp') + '" alt="">'
        + '<b>' + esc(idx ? idx.name : id) + '</b>'
        + '<button type="button" data-clear="' + side + '" aria-label="Bỏ chọn hero">✕</button></span>';
      input.value = idx ? idx.name : id;
    }

    function selectHero(side, id) {
      if (side === 'a' && sel.b === id) sel.b = sel.a;
      if (side === 'b' && sel.a === id) sel.a = sel.b;
      sel[side] = id;
      renderPicked('a'); renderPicked('b');
      hideSuggest();
      refresh();
    }

    function hideSuggest() {
      suggestA.hidden = true; suggestB.hidden = true;
    }

    function wirePicker(side) {
      var input = side === 'a' ? inputA : inputB;
      var box = side === 'a' ? suggestA : suggestB;
      input.addEventListener('input', function () {
        var q = norm(input.value);
        if (!q) { box.hidden = true; box.innerHTML = ''; return; }
        var hits = INDEX.filter(function (h) {
          return norm(h.name).indexOf(q) !== -1 || norm(h.id).indexOf(q) !== -1;
        }).slice(0, 8);
        if (!hits.length) {
          box.innerHTML = '<div class="cp-suggest-empty">Không tìm thấy hero nào khớp.</div>';
        } else {
          box.innerHTML = hits.map(function (h) {
            return '<button type="button" data-pick="' + esc(h.id) + '" data-side="' + side + '">'
              + '<img src="' + esc(h.portrait) + '" alt="">'
              + '<span>' + esc(h.name) + '</span><small>' + esc(h.rarity) + ' · ' + esc(h.type) + '</small></button>';
          }).join('');
        }
        box.hidden = false;
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var q = norm(input.value);
          var hit = INDEX.find(function (h) { return norm(h.name) === q; })
            || INDEX.find(function (h) { return norm(h.name).indexOf(q) === 0; });
          if (hit) selectHero(side, hit.id);
        }
      });
      box.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-pick]');
        if (btn) selectHero(btn.getAttribute('data-side'), btn.getAttribute('data-pick'));
      });
      input.addEventListener('focus', function () {
        if (input.value.trim()) input.dispatchEvent(new Event('input'));
      });
    }

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.cp-picker')) hideSuggest();
      var clearBtn = e.target.closest('[data-clear]');
      if (clearBtn) {
        var side = clearBtn.getAttribute('data-clear');
        sel[side] = null;
        renderPicked(side);
        refresh();
      }
    });

    document.getElementById('cp-swap').addEventListener('click', function () {
      sel = swapSelection(sel);
      renderPicked('a'); renderPicked('b');
      refresh();
    });

    if (copyBtn) copyBtn.addEventListener('click', function () {
      var url = window.location.href;
      function done() { copyMsg.textContent = 'Đã sao chép link!'; setTimeout(function () { copyMsg.textContent = ''; }, 2500); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { copyMsg.textContent = 'Không sao chép được — copy link trên thanh địa chỉ nhé.'; });
      } else {
        copyMsg.textContent = 'Copy link trên thanh địa chỉ nhé.';
      }
    });

    wirePicker('a');
    wirePicker('b');

    fetch(INDEX_URL).then(function (r) { return r.json(); }).then(function (data) {
      INDEX = data;
      var params = parseCompareParams(window.location.search);
      if (params.a && findById(params.a)) sel.a = params.a;
      if (params.b && findById(params.b)) sel.b = params.b;
      renderPicked('a'); renderPicked('b');
      refresh();
    }).catch(function () {
      resultEl.innerHTML = '<p class="cp-empty">Không tải được danh sách hero.</p>';
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      norm: norm, parseCompareParams: parseCompareParams, swapSelection: swapSelection,
      tierLabel: tierLabel, attackStat: attackStat, statValue: statValue,
      winnerFor: winnerFor, skillList: skillList, mainBuild: mainBuild,
      tierRows: tierRows, MODE_ORDER: MODE_ORDER, SKILL_TYPE_VI: SKILL_TYPE_VI
    };
  }
})();
