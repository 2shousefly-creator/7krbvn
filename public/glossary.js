/* Tu dien hieu ung — glossary.js (rieng cho tu-dien-hieu-ung.html).
 * Du lieu tu glossary-data.js (GLOSSARY_DATA): 190 hieu ung, moi muc co
 * en / vi / desc / desc_verified / category (Buff | Debuff | Khac) /
 * examples [{id, name}]. Tim kiem khong dau tieng Viet. */
(function () {
  'use strict';
  var DATA = (typeof GLOSSARY_DATA !== 'undefined') ? GLOSSARY_DATA : [];
  var CAT_LABEL = { Buff: 'Buff', Debuff: 'Debuff', Khac: 'Khác' };

  var searchEl = document.getElementById('gl-search');
  var listEl = document.getElementById('gl-list');
  var countEl = document.getElementById('gl-result-count');
  var emptyEl = document.getElementById('gl-empty');
  var azEl = document.getElementById('gl-az');
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll('.gl-filter'));

  var state = { q: '', cat: 'all', letter: 'all' };

  /* Bo dau tieng Viet: NFD + strip combining marks + đ -> d + lowercase.
   * (heroes.js chi lowercase ten hero; o day can ca khong dau.) */
  function fold(s) {
    return String(s || '').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase();
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Chu cai dau tien A-Z trong ten tieng Anh; "[Mark..." -> M, "7-Dish..." -> #. */
  function firstLetter(en) {
    var m = /[A-Za-z]/.exec(en || '');
    return m ? m[0].toUpperCase() : '#';
  }

  /* Chuoi tim kiem cua 1 muc: ten EN + ten VI + mo ta + ten hero vi du. */
  DATA.forEach(function (e) {
    e._hay = fold([e.en, e.vi, e.desc, (e.examples || []).map(function (x) { return x.name; }).join(' ')].join(' '));
    e._letter = firstLetter(e.en);
  });

  function filtered() {
    var q = fold(state.q.trim());
    return DATA.filter(function (e) {
      if (state.cat !== 'all' && e.category !== state.cat) return false;
      if (state.letter !== 'all' && e._letter !== state.letter) return false;
      if (q && e._hay.indexOf(q) === -1) return false;
      return true;
    });
  }

  function entryHtml(e) {
    var cls = e.category === 'Buff' ? 'gl-buff' : (e.category === 'Debuff' ? 'gl-debuff' : 'gl-khac');
    var h = '<article class="gl-entry" id="gl-' + esc(e._letter.toLowerCase()) + '-' + esc(fold(e.en).replace(/[^a-z0-9]+/g, '-')) + '">';
    h += '<div class="gl-names"><b class="gl-en ' + cls + '">' + esc(e.en) + '</b>'
      + '<span class="gl-sep"> — </span><span class="gl-vi">' + esc(e.vi) + '</span>'
      + '<span class="gl-tag gl-tag-' + cls.slice(3) + '">' + CAT_LABEL[e.category] + '</span>';
    if (e.desc && !e.desc_verified) {
      h += '<span class="gl-unverified">chưa xác minh</span>';
    }
    h += '</div>';
    if (e.desc) {
      h += '<p class="gl-desc">' + esc(e.desc) + '</p>';
    } else {
      h += '<p class="gl-desc gl-missing">đang bổ sung mô tả</p>';
    }
    if (e.examples && e.examples.length) {
      var links = e.examples.map(function (x) {
        return '<a href="hero.html?id=' + encodeURIComponent(x.id) + '">' + esc(x.name) + '</a>';
      }).join(', ');
      h += '<p class="gl-examples">Ví dụ: ' + links + '</p>';
    }
    return h + '</article>';
  }

  function render() {
    var rows = filtered();
    listEl.innerHTML = rows.map(entryHtml).join('');
    countEl.textContent = rows.length === DATA.length
      ? DATA.length + ' hiệu ứng'
      : 'Hiển thị ' + rows.length + ' / ' + DATA.length + ' hiệu ứng';
    emptyEl.hidden = rows.length > 0;
  }

  function renderAz() {
    var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
    var present = {};
    DATA.forEach(function (e) { present[e._letter] = true; });
    azEl.innerHTML = letters.map(function (L) {
      var dis = present[L] ? '' : ' disabled';
      var act = state.letter === L ? ' is-active' : '';
      return '<button type="button" data-letter="' + L + '" class="' + act + '"' + dis + '>' + L + '</button>';
    }).join('');
    azEl.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        state.letter = (state.letter === b.dataset.letter) ? 'all' : b.dataset.letter;
        renderAz();
        render();
      });
    });
  }

  /* Dem so luong moi loai tren nut loc. */
  var counts = { all: DATA.length, Buff: 0, Debuff: 0, Khac: 0 };
  DATA.forEach(function (e) { if (counts[e.category] != null) counts[e.category]++; });
  filterBtns.forEach(function (b) {
    var n = counts[b.dataset.cat];
    var span = b.querySelector('.gl-count');
    if (span && n != null) span.textContent = '(' + n + ')';
    b.addEventListener('click', function () {
      state.cat = b.dataset.cat;
      filterBtns.forEach(function (x) { x.classList.toggle('is-active', x === b); });
      render();
    });
  });

  if (searchEl) {
    searchEl.addEventListener('input', function () {
      state.q = searchEl.value;
      render();
    });
  }

  renderAz();
  render();
})();
