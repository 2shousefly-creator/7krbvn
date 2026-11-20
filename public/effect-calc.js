/* Tính Xác Suất Hiệu Ứng — Seven Knights Re:Birth
 * Công thức (đồng thuận cộng đồng, CHƯA được Netmarble xác nhận chính thức —
 * cùng cơ sở với bài Effect Hit Rate vs Effect Resistance trên site):
 *   final = base × (1 + netProb) × (1 − effRes)
 *   effRes = clamp(oppRes − atkHit, 0, 100)
 *   netProb = atkProb − probRed   (clamp sao cho 1 + netProb >= 0)
 *   atkHit  = sliderHit + petHit + hitBoost
 *   atkProb = sliderProb + petProb + probBoost (+ deathBoost nếu skill gây Death)
 *   oppRes  = max(0, sliderRes + resBoost − resRed)
 * Quy tắc cộng dồn: các nguồn cộng vào từng tổng TRƯỚC khi trừ; hiệu ứng
 * cùng tên không cộng dồn — chỉ lấy giá trị cao nhất (VD: nội tại Spike
 * +34% Hit Boost và ô tick +64% thì chỉ tính 64%).
 * Mọi tỉ lệ base chance và nội tại đều lấy ở mức cường hóa tối đa.
 */
(function () {
  'use strict';

  /* ---------- pure calc (also exported for Node tests) ---------- */
  function calcChance(base, atkHit, atkProb, oppRes, probRed) {
    var effRes = Math.min(100, Math.max(0, oppRes - atkHit));
    var netProb = Math.max(-100, atkProb - (probRed || 0));
    var v = base * (1 + netProb / 100) * (1 - effRes / 100);
    // Snap to 6 decimals: (1 - 0.9) is 0.09999999999999998 in binary, so
    // 65% x 0.1 came out 6.4999... and Math.round() showed 6 instead of 7.
    v = Math.round(v * 1e6) / 1e6;
    return { pct: Math.min(100, Math.max(0, v)), effRes: effRes, netProb: netProb };
  }

  function totals(state, data) {
    var max = data.maxValues;
    var heroAuto = function (kind) {
      var g = state.hero && state.hero.auto && state.hero.auto.grants[kind];
      if (!g) return 0;
      if (g.cond) return state.condOn[kind] ? g.value : 0;
      return g.value;
    };
    var hitBoost = Math.max(heroAuto('hit'), state.checks.hitBoost ? max.hitBoost : 0);
    var probBoost = Math.max(heroAuto('prob'), state.checks.probBoost ? max.probBoost : 0);
    var deathBoost = Math.max(heroAuto('death'), state.checks.deathBoost ? max.deathBoost : 0);
    var resRed = Math.max(heroAuto('resRed'), state.checks.resRed ? max.resRed : 0);
    var resBoost = state.checks.resBoost ? max.resBoost : 0;
    var probRed = state.checks.probRed ? max.probRed : 0;
    var petHit = state.pet ? state.pet.hit : 0;
    var petProb = state.pet ? state.pet.prob : 0;
    return {
      hitBoost: hitBoost, probBoost: probBoost, deathBoost: deathBoost,
      resRed: resRed, resBoost: resBoost, probRed: probRed,
      petHit: petHit, petProb: petProb,
      heroHit: heroAuto('hit'), heroProb: heroAuto('prob'),
      heroDeath: heroAuto('death'), heroResRed: heroAuto('resRed'),
      atkHit: state.sliders.hit + petHit + hitBoost,
      atkProb: state.sliders.prob + petProb + probBoost,
      oppRes: Math.max(0, state.sliders.res + resBoost - resRed)
    };
  }

  // Hero-level vs skill-level Death: the checkbox is enabled as soon as
  // the HERO has any Death debuff (fix 2026-11-20 — it stayed disabled
  // until a Death skill was picked), but the boost only counts when the
  // SELECTED skill inflicts Death.
  function heroHasDeath(hero) {
    if (!hero || !hero.skills) return false;
    return Object.keys(hero.skills).some(function (k) {
      return hero.skills[k].debuffs.some(function (d) { return d.effect === 'Death'; });
    });
  }
  function skillHasDeath(hero, skillKey) {
    return !!(skillKey && hero && hero.skills[skillKey] &&
      hero.skills[skillKey].debuffs.some(function (d) { return d.effect === 'Death'; }));
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calcChance: calcChance, totals: totals, heroHasDeath: heroHasDeath, skillHasDeath: skillHasDeath };
    return;
  }

  /* ---------- browser UI ---------- */
  var data = window.EFFECT_CALC_DATA;
  var heroesById = {};
  data.heroes.forEach(function (h) { heroesById[h.id] = h; });
  var state = {
    hero: null, pet: null, condOn: {},
    checks: { hitBoost: false, resRed: false, probBoost: false, deathBoost: false, resBoost: false, probRed: false },
    sliders: { hit: 0, prob: 0, res: 0 },
    skillKey: null, skillData: null
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function norm(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(n) { return (Math.round(n * 100) / 100).toString().replace('.', ','); }

  /* ---------- hero / pet slots ---------- */
  function heroPortrait(h) { return 'assets/hero-' + h.id + '.webp'; }

  function renderSlots() {
    var hs = $('#ec-hero-slot');
    if (state.hero) {
      hs.classList.add('filled');
      hs.innerHTML = '<button class="ec-remove" type="button" aria-label="Bỏ hero">−</button>' +
        '<img src="' + heroPortrait(state.hero) + '" alt="' + esc(state.hero.name) + '">' +
        '<span class="ec-slot-name">' + esc(state.hero.name) + '</span>' +
        '<span class="ec-slot-sub">' + esc(state.hero.rarity || '') + ' · ' + esc(state.hero.type || '') + '</span>';
      hs.querySelector('.ec-remove').addEventListener('click', function (e) {
        e.stopPropagation(); selectHero(null);
      });
    } else {
      hs.classList.remove('filled');
      hs.innerHTML = '<span class="ec-slot-plus">+</span><span class="ec-slot-label">Chọn hero</span>';
    }
    var ps = $('#ec-pet-slot');
    if (state.pet) {
      ps.classList.add('filled');
      ps.innerHTML = '<button class="ec-remove" type="button" aria-label="Bỏ pet">−</button>' +
        '<img src="' + esc(state.pet.icon) + '" alt="' + esc(state.pet.name) + '">' +
        '<span class="ec-slot-name">' + esc(state.pet.name) + '</span>' +
        '<span class="ec-slot-sub">' + esc(state.pet.rarity || '') +
        (state.pet.hit ? ' · +' + state.pet.hit + '% Hit' : '') +
        (state.pet.prob ? ' · +' + state.pet.prob + '% Prob' : '') + '</span>';
      ps.querySelector('.ec-remove').addEventListener('click', function (e) {
        e.stopPropagation(); selectPet(null);
      });
    } else {
      ps.classList.remove('filled');
      ps.innerHTML = '<span class="ec-slot-plus">+</span><span class="ec-slot-label">Chọn pet</span>';
    }
  }

  /* ---------- pickers (shared modal) ---------- */
  var modal = null, modalList = null, modalSearch = null, modalTitle = null, modalCount = null;
  var pickerMode = null; // 'hero' | 'pet'

  /* Scroll lock (item 4): opening the picker must not jump the page.
     Freeze the body at the current scroll offset, restore it on close. */
  var savedScrollY = 0;
  function lockScroll() {
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = (-savedScrollY) + 'px';
    document.body.style.width = '100%';
  }
  function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, savedScrollY);
  }

  function openPicker(mode) {
    pickerMode = mode;
    lockScroll();
    modal.classList.add('open');
    modalTitle.textContent = mode === 'hero' ? 'Chọn hero' : 'Chọn pet';
    modalSearch.value = '';
    modalSearch.placeholder = mode === 'hero' ? 'Tìm hero theo tên… (gõ không dấu vẫn ra)' : 'Tìm pet theo tên… (gõ không dấu vẫn ra)';
    renderPickerList('');
    // no autofocus: focusing the search would pop the virtual keyboard
    // up the moment the popup opens (fix 2026-11-20)
  }
  function closePicker() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    unlockScroll();
  }

  function heroTile(h) {
    var dis = !h.hasDebuff;
    return '<button type="button" class="ec-tile' + (dis ? ' ec-disabled' : '') + '" data-id="' + h.id + '"' + (dis ? ' disabled' : '') + '>' +
      '<img src="' + heroPortrait(h) + '" alt="' + esc(h.name) + '" loading="lazy">' +
      '<span class="ec-tile-name">' + esc(h.name) + '</span>' +
      '<span class="ec-tile-sub">' + esc(h.rarity || '') + '</span>' +
      (dis ? '<span class="ec-tile-lock">Không có debuff</span>' : '') +
      '</button>';
  }
  function petTile(p) {
    var dis = !p.selectable;
    var why = !p.selectable ? (p.id === 'pike' ? '+Effect Resistance — không giúp gây debuff' : 'Không tăng tỉ lệ gây debuff') : '';
    return '<button type="button" class="ec-tile' + (dis ? ' ec-disabled' : '') + '" data-id="' + p.id + '"' + (dis ? ' disabled' : '') + '>' +
      '<img src="' + esc(p.icon) + '" alt="' + esc(p.name) + '" loading="lazy">' +
      '<span class="ec-tile-name">' + esc(p.name) + '</span>' +
      '<span class="ec-tile-sub">' + esc(p.rarity || '') +
      (p.hit ? ' · +' + p.hit + '% Hit' : '') + (p.prob ? ' · +' + p.prob + '% Prob' : '') + '</span>' +
      (dis ? '<span class="ec-tile-lock">' + esc(why) + '</span>' : '') +
      '</button>';
  }

  function renderPickerList(q) {
    var nq = norm(q);
    var html = '', count = 0;
    if (pickerMode === 'hero') {
      var list;
      if (!nq) {
        html += '<div class="ec-picker-label">Gợi ý — hero có nhiều skill debuff</div>';
        list = data.suggestedHeroes.map(function (id) { return heroesById[id]; });
        count = list.length;
      } else {
        list = data.heroes.filter(function (h) { return norm(h.name).indexOf(nq) !== -1; });
        list.sort(function (a, b) { return (b.hasDebuff - a.hasDebuff) || a.name.localeCompare(b.name); });
        count = list.length;
      }
      html += '<div class="ec-grid">' + list.map(heroTile).join('') + '</div>';
      modalCount.textContent = nq ? ('Tìm thấy ' + count + ' hero') : ('Hiển thị ' + count + ' hero gợi ý — gõ tên để tìm trong 125 hero');
    } else {
      var plist;
      if (!nq) {
        html += '<div class="ec-picker-label">Pet tăng tỉ lệ gây debuff</div>';
        plist = data.pets.filter(function (p) { return p.selectable; });
        html += '<div class="ec-grid">' + plist.map(petTile).join('') + '</div>';
        html += '<div class="ec-picker-label">Pet khác (không tăng tỉ lệ gây debuff)</div>';
        plist = data.pets.filter(function (p) { return !p.selectable; });
        html += '<div class="ec-grid">' + plist.map(petTile).join('') + '</div>';
        count = data.pets.length;
      } else {
        plist = data.pets.filter(function (p) { return norm(p.name).indexOf(nq) !== -1; });
        plist.sort(function (a, b) { return (b.selectable - a.selectable) || a.name.localeCompare(b.name); });
        html += '<div class="ec-grid">' + plist.map(petTile).join('') + '</div>';
        count = plist.length;
      }
      modalCount.textContent = nq ? ('Tìm thấy ' + count + ' pet') : ('Tổng ' + count + ' pet');
    }
    if (count === 0) html += '<p class="ec-empty">Không tìm thấy. Thử gõ tên khác (không dấu vẫn ra).</p>';
    modalList.innerHTML = html;
    capGridRows();
    $$('.ec-tile', modalList).forEach(function (t) {
      t.addEventListener('click', function () {
        if (pickerMode === 'hero') selectHero(heroesById[t.dataset.id]);
        else selectPet(data.pets.filter(function (p) { return p.id === t.dataset.id; })[0]);
        closePicker();
      });
    });
  }

  /* Hero/pet grid shows at most 2 rows; more scrolls inside the grid
     (fix 2026-11-20). The cap is measured from the real tile height so
     it is exactly 2 rows at any width, and the panel top never moves
     while the user types — only the grid content changes. */
  function capGridRows() {
    $$('.ec-grid', modalList).forEach(function (grid) {
      var tile = grid.querySelector('.ec-tile');
      if (!tile) return; // no results: keep the previous cap
      grid.style.maxHeight = (tile.offsetHeight * 2 + 8) + 'px';
    });
  }

  /* ---------- selection ---------- */
  function selectHero(h) {
    state.hero = h;
    state.skillKey = null;
    state.skillData = null;
    state.condOn = {};
    var hs = $('#ec-hero-settings');
    if (hs) hs.hidden = !h;
    renderSlots();
    renderHeroBonus();
    renderSkillSlot();
    recalc();
    if (h) loadHeroJson(h.id);
  }
  function selectPet(p) {
    state.pet = p;
    renderSlots();
    recalc();
  }

  var heroJsonCache = {};
  function loadHeroJson(id) {
    if (heroJsonCache[id]) { renderSkillSlot(); return; }
    fetch('data/heroes/' + id + '.json').then(function (r) { return r.json(); })
      .then(function (d) {
        heroJsonCache[id] = d; renderSkillSlot();
        if (modal && modal.classList.contains('open') && pickerMode === 'skill') renderSkillList(modalSearch.value);
      })
      .catch(function () { /* keep picker data-only */ });
  }
  function currentSkills() {
    var d = heroJsonCache[state.hero.id];
    if (!d) return null;
    // passive included: passives that carry a debuff are pickable too
    return d.skills.awk || d.skills.s6;
  }

  /* ---------- hero auto-bonus box ---------- */
  var AUTO_LABEL = { hit: 'Effect Hit Rate', prob: 'Effect Probability', death: 'Death Effect Probability', resRed: 'Effect Resist Reduction' };
  var AUTO_NOTE = {
    team: 'Điều kiện: đội có từ 3 hero Magic trở lên.',
    scaled: 'Tối đa — cần 9000 Max HP (Diaochan) hoặc 2700 Attack (Dongyoung / Eileene).'
  };
  function renderHeroBonus() {
    var box = $('#ec-hero-bonus');
    var h = state.hero;
    if (!h || !h.auto) { box.innerHTML = ''; box.hidden = true; return; }
    box.hidden = false;
    var rows = [];
    Object.keys(h.auto.grants).forEach(function (kind) {
      var g = h.auto.grants[kind];
      var label = '+' + g.value + '% ' + AUTO_LABEL[kind];
      var src = 'Nội tại ' + h.auto.passive + (g.tier ? ' (chỉ có ở ' + g.tier + ')' : '') + (g.duration ? ' (' + g.duration + ' lượt)' : '');
      if (g.cond) {
        rows.push('<label class="ec-auto-row ec-cond"><input type="checkbox" data-cond="' + kind + '"' + (state.condOn[kind] ? ' checked' : '') + '> ' +
          '<span><b>' + label + '</b> — ' + esc(src) + '<br><small>' + AUTO_NOTE[g.cond] + '</small></span></label>');
      } else {
        // item 7: the hero's own effect is auto-applied and LOCKED — the
        // checkbox is checked and disabled, the manual checkboxes below
        // stay separate and toggleable.
        rows.push('<div class="ec-auto-row ec-locked"><input type="checkbox" checked disabled> ' +
          '<span><b>' + label + '</b> — ' + esc(src) + '</span></div>');
      }
    });
    box.innerHTML = '<div class="ec-box-title">Nội tại của ' + esc(h.name) + '</div>' + rows.join('');
    $$('input[data-cond]', box).forEach(function (cb) {
      cb.addEventListener('change', function () {
        state.condOn[cb.dataset.cond] = cb.checked;
        recalc();
      });
    });
  }

  /* ---------- skill slot + picker ---------- */
  function skillLabel(s) {
    if (s.key === 'basic') return 'Đánh thường';
    if (s.key === 'passive') return 'Nội tại — ' + (s.name || 'Nội tại');
    return (s.name || s.type || 'Skill');
  }
  function renderSkillSlot() {
    var slot = $('#ec-skill-slot');
    var detail = $('#ec-skill-detail');
    if (!state.hero) {
      slot.innerHTML = '<span class="ec-slot-plus">+</span><span class="ec-slot-label">Chọn skill</span>';
      slot.classList.add('ec-disabled-slot');
      detail.innerHTML = '';
      $('#ec-result').innerHTML = '<p class="ec-empty">Chọn hero rồi chọn 1 skill gây debuff để xem tỉ lệ %.</p>';
      return;
    }
    slot.classList.remove('ec-disabled-slot');
    if (!state.skillKey) {
      slot.innerHTML = '<span class="ec-slot-plus">+</span><span class="ec-slot-label">Chọn skill</span>';
      detail.innerHTML = '';
      $('#ec-result').innerHTML = '<p class="ec-empty">Chọn 1 skill của ' + esc(state.hero.name) + ' để xem tỉ lệ gây debuff.</p>';
      return;
    }
    var s = state.skillData;
    if (!s) {
      slot.innerHTML = '<span class="ec-slot-label">Đang tải skill…</span>';
      detail.innerHTML = '';
      return;
    }
    slot.innerHTML = '<img src="assets/skills-raw/' + esc(s.icon || '') + '" alt="" onerror="this.style.display=\'none\'">' +
      '<span class="ec-slot-name">' + esc(skillLabel(s)) + '</span>' +
      '<span class="ec-slot-sub">' + esc(s.type || '') + (s.cd ? ' · ' + s.cd + 's' : '') + '</span>';
    renderSkillDetail();
  }

  function openSkillPicker() {
    if (!state.hero) return;
    pickerMode = 'skill';
    lockScroll();
    modal.classList.add('open');
    modalTitle.textContent = 'Chọn skill — ' + state.hero.name;
    modalSearch.value = '';
    modalSearch.placeholder = 'Tìm skill theo tên…';
    renderSkillList('');
    // no autofocus here either — keyboard only when the user taps the input
  }
  function renderSkillList(q) {
    var nq = norm(q);
    var skills = currentSkills();
    if (!skills) {
      modalList.innerHTML = '<p class="ec-empty">Đang tải dữ liệu skill…</p>';
      modalCount.textContent = '';
      return;
    }
    var rows = skills.filter(function (s) { return !nq || norm(skillLabel(s)).indexOf(nq) !== -1; });
    var html = '<div class="ec-skill-list">' + rows.map(function (s) {
      var sd = state.hero.skills[s.key];
      var ok = !!sd;
      var note = ok ? sd.debuffs.map(function (d) { return d.effect + ' ' + d.max + '%'; }).join(' · ')
                    : 'Không gây debuff';
      return '<button type="button" class="ec-skill-row' + (ok ? '' : ' ec-disabled') + '" data-key="' + s.key + '"' + (ok ? '' : ' disabled') + '>' +
        '<img src="assets/skills-raw/' + esc(s.icon || '') + '" alt="" onerror="this.style.display=\'none\'">' +
        '<span><b>' + esc(skillLabel(s)) + '</b><small>' + esc(s.type || '') + (s.cd ? ' · ' + s.cd + 's' : '') + (s.gauge ? ' · Gauge ' + s.gauge : '') + '</small></span>' +
        '<span class="ec-skill-note">' + esc(note) + '</span></button>';
    }).join('') + '</div>';
    modalList.innerHTML = html || '<p class="ec-empty">Không tìm thấy skill.</p>';
    var okCount = rows.filter(function (s) { return state.hero.skills[s.key]; }).length;
    modalCount.textContent = nq ? ('Tìm thấy ' + rows.length + ' skill') : ('Có ' + okCount + ' skill gây debuff');
    $$('.ec-skill-row', modalList).forEach(function (b) {
      b.addEventListener('click', function () {
        state.skillKey = b.dataset.key;
        closePicker();
        renderSkillSlot();
        recalc();
      });
    });
  }

  function renderSkillDetail() {
    var detail = $('#ec-skill-detail');
    var s = state.skillData;
    var sd = state.hero.skills[state.skillKey];
    if (!s || !sd) { detail.innerHTML = ''; return; }
    var lines = '';
    (s.effects_vi || s.effects || []).forEach(function (grp) {
      var ls = Array.isArray(grp) ? grp : (grp.lines || []);
      ls.forEach(function (line) {
        var txt = line;
        // highlight max-enhanced chances: replace the base % with the max.
        // Tolerant: an optional "N cộng dồn " may sit between "gây" and the
        // effect name, and the name may carry a trailing " (Stacks)".
        sd.debuffs.forEach(function (d) {
          if (!d.enhanced) return;
          var baseName = d.effect.replace(/ \(Stacks\)$/, '');
          var re = new RegExp('(\\d+)% tỉ lệ gây (\\d+ cộng dồn )?' + baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '( \\(Stacks\\))?');
          txt = txt.replace(re, function (m, pct, stack) { return d.max + '% tỉ lệ gây ' + (stack || '') + d.effect; });
        });
        lines += '<li>' + esc(txt.replace(/^- /, '')) + '</li>';
      });
    });
    // Debuffs added by enhancement / Transcendence don't appear in the
    // base description — show their "Thêm hiệu ứng…" lines too.
    var added = [];
    [['enhancement_vi', ''], ['tx_vi', '']].forEach(function (pair) {
      (s[pair[0]] || []).forEach(function (e) {
        var txt = e.effect || '';
        if (txt.indexOf('Thêm hiệu ứng') !== 0) return;
        if (!sd.debuffs.some(function (d) { return txt.indexOf(d.effect) !== -1; })) return;
        txt = txt.replace(/\[Duration: (\d+) Turn\(s\)\]/, 'trong $1 lượt');
        added.push('<li>' + esc(txt) + '</li>');
      });
    });
    var enhBadge = sd.debuffs.some(function (d) { return d.enhanced || d.t6 || d.tier; }) ?
      '<span class="ec-badge">Đã tính cường hóa tối đa</span>' : '';
    detail.innerHTML = '<div class="ec-detail-head">' +
      '<img src="assets/skills-raw/' + esc(s.icon || '') + '" alt="" onerror="this.style.display=\'none\'">' +
      '<div><h3>' + esc(skillLabel(s)) + '</h3><p>' + esc(s.type || '') + (s.cd ? ' · Hồi chiêu ' + s.cd + 's' : '') + (s.gauge ? ' · Gauge ' + s.gauge : '') + '</p></div>' + enhBadge + '</div>' +
      '<ul class="ec-detail-lines">' + lines + added.join('') + '</ul>';
  }

  /* ---------- sliders ---------- */
  function bindSlider(key) {
    var range = $('#ec-slider-' + key), num = $('#ec-num-' + key);
    range.addEventListener('input', function () {
      state.sliders[key] = parseInt(range.value, 10) || 0;
      num.value = state.sliders[key];
      recalc();
    });
    num.addEventListener('input', function () {
      var v = Math.max(parseInt(range.min, 10), Math.min(parseInt(range.max, 10), parseInt(num.value, 10) || 0));
      state.sliders[key] = v;
      range.value = v;
      recalc();
    });
  }

  /* ---------- recalc + render ---------- */
  function recalc() {
    var t = totals(state, data);
    // attacker summary
    var skillDeath = skillHasDeath(state.hero, state.skillKey);
    var atkProbTotal = t.atkProb + (skillDeath ? t.deathBoost : 0);
    $('#ec-sum-hit').innerHTML =
      '<span>Thanh trượt +' + state.sliders.hit + '%</span>' +
      (t.petHit ? '<span>Pet +' + t.petHit + '%</span>' : '') +
      (t.hitBoost ? '<span>Effect Hit Rate Boost +' + t.hitBoost + '%</span>' : '') +
      '<b>Tổng: ' + t.atkHit + '%</b>';
    $('#ec-sum-prob').innerHTML =
      '<span>Thanh trượt +' + state.sliders.prob + '%</span>' +
      (t.petProb ? '<span>Pet +' + t.petProb + '%</span>' : '') +
      (t.probBoost ? '<span>Effect Probability Boost +' + t.probBoost + '%</span>' : '') +
      (skillDeath && t.deathBoost ? '<span>Death Effect Probability Boost +' + t.deathBoost + '% <small>(chỉ Death)</small></span>' : '') +
      '<b>Tổng: ' + atkProbTotal + '%</b>';
    // opponent summary
    $('#ec-sum-res').innerHTML =
      '<span>Thanh trượt +' + state.sliders.res + '%</span>' +
      (t.resBoost ? '<span>Effect Resist Boost +' + t.resBoost + '%</span>' : '') +
      (t.resRed ? '<span>Effect Resist Reduction −' + t.resRed + '%</span>' : '') +
      '<b>Tổng: ' + t.oppRes + '%</b>';
    $('#ec-sum-probred').innerHTML =
      (t.probRed ? '<span>Effect Probability Reduction ' + t.probRed + '%</span>' : '<span>Không có</span>') +
      '<b>Tổng: ' + t.probRed + '%</b>';

    // death checkbox availability — hero-level: enabled as soon as the
    // hero has any Death debuff, even before a skill is picked
    var deathCb = $('#ec-check-deathBoost');
    var heroDeath = heroHasDeath(state.hero);
    deathCb.disabled = !heroDeath;
    if (!heroDeath && state.checks.deathBoost) { state.checks.deathBoost = false; deathCb.checked = false; }
    $('#ec-check-deathBoost-wrap').classList.toggle('ec-off', !heroDeath);

    // result
    var res = $('#ec-result');
    if (!state.hero || !state.skillKey || !state.skillData) {
      if (state.hero && !state.skillKey) res.innerHTML = '<p class="ec-empty">Chọn 1 skill của ' + esc(state.hero.name) + ' để xem tỉ lệ gây debuff.</p>';
      renderBar();
      return;
    }
    var sd = state.hero.skills[state.skillKey];
    var rows = sd.debuffs.map(function (d) {
      // [Always Active] auras cannot be resisted — always 100%.
      var r = d.always ? { pct: 100 } : calcChance(d.max, t.atkHit, atkProbTotal, t.oppRes, t.probRed);
      var targetLabel = /-added$/.test(d.target) ? 'Thêm ở ' + (d.tier || '') : d.target;
      return '<div class="ec-result-row"><div class="ec-result-effect">' + esc(d.effect) +
        (d.tier ? ' <span class="ec-badge">' + esc(d.tier) + '</span>' : '') +
        (d.always ? '<span class="ec-always-tag">Luôn áp dụng</span>' : '') +
        '<small>' + esc(targetLabel) + '</small></div>' +
        '<div class="ec-result-pct">' + Math.round(r.pct) + '<span>%</span></div></div>';
    }).join('');
    res.innerHTML = rows;
    renderBar();
  }

  /* ---------- sticky result bar (item 5) ---------- */
  var bar = null, barInner = null, barHasContent = false, resultVisible = true;
  function renderBar() {
    if (!state.hero || !state.skillKey || !state.skillData) { barHasContent = false; updateBarVisibility(); return; }
    var t = totals(state, data);
    var sd = state.hero.skills[state.skillKey];
    var hasDeath = sd.debuffs.some(function (d) { return d.effect === 'Death'; });
    var atkProbTotal = t.atkProb + (hasDeath ? t.deathBoost : 0);
    var chips = sd.debuffs.map(function (d) {
      if (d.always) return '<span class="ec-bar-chip">' + esc(d.effect) + ' <b>100%</b> <span class="ec-bar-always">Luôn áp dụng</span></span>';
      var r = calcChance(d.max, t.atkHit, atkProbTotal, t.oppRes, t.probRed);
      return '<span class="ec-bar-chip">' + esc(d.effect) + ' <b>' + Math.round(r.pct) + '%</b></span>';
    }).join('');
    barInner.innerHTML = '<span class="ec-bar-skill">' + esc(skillLabel(state.skillData)) + '</span>' + chips;
    barHasContent = true;
    updateBarVisibility();
  }
  function updateBarVisibility() {
    var show = barHasContent && !resultVisible;
    bar.hidden = !show;
    // keep page content from hiding under the bar
    document.body.style.paddingBottom = show ? (bar.offsetHeight + 24) + 'px' : '';
  }

  /* ---------- init ---------- */
  function init() {
    modal = $('#ec-modal'); modalList = $('#ec-modal-list'); modalSearch = $('#ec-modal-search');
    modalTitle = $('#ec-modal-title'); modalCount = $('#ec-modal-count');
    bar = $('#ec-result-bar'); barInner = $('#ec-result-bar-inner');
    if (bar && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        resultVisible = entries[0].isIntersecting;
        updateBarVisibility();
      }, { threshold: 0 }).observe($('#ec-result'));
    }
    $('#ec-hero-slot').addEventListener('click', function () { openPicker('hero'); });
    $('#ec-pet-slot').addEventListener('click', function () { openPicker('pet'); });
    $('#ec-skill-slot').addEventListener('click', openSkillPicker);
    $('#ec-modal-close').addEventListener('click', closePicker);
    modal.addEventListener('click', function (e) { if (e.target === modal) closePicker(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePicker(); });
    modalSearch.addEventListener('input', function () {
      if (pickerMode === 'skill') renderSkillList(modalSearch.value);
      else renderPickerList(modalSearch.value);
    });
    // orientation change / window resize while the picker is open:
    // tile width changes, so re-measure the 2-row cap
    window.addEventListener('resize', function () {
      if (modal && modal.classList.contains('open') && pickerMode !== 'skill') capGridRows();
    });
    ['hitBoost', 'resRed', 'probBoost', 'deathBoost', 'resBoost', 'probRed'].forEach(function (k) {
      var cb = document.querySelector('[data-check="' + k + '"]');
      if (cb) cb.addEventListener('change', function () { state.checks[k] = cb.checked; recalc(); });
    });
    bindSlider('hit'); bindSlider('prob'); bindSlider('res');
    renderSlots();
    renderHeroBonus();
    renderSkillSlot();
    recalc();
  }

  // skillData resolves when hero JSON arrives (skill picker needs it)
  var _renderSkillSlot = renderSkillSlot;
  renderSkillSlot = function () {
    if (state.hero && state.skillKey) {
      var d = heroJsonCache[state.hero.id];
      if (d) {
        var list = d.skills.awk || d.skills.s6;
        state.skillData = list.filter(function (s) { return s.key === state.skillKey; })[0] || null;
      }
    }
    _renderSkillSlot();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
