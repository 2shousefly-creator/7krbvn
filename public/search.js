/* Tim kiem toan trang — 7krb.io.vn.
 * Matching logic is kept pure (normalize / scoreEntry / searchEntries)
 * so it can be unit-tested from node: require('./search.js').
 * In the browser the same file wires the live search box on
 * tim-kiem.html (fetch search-index.json, render grouped results).
 */
(function (root, factory) {
  var lib = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = lib;
  } else {
    root.SearchLib = lib;
  }
  if (typeof document !== 'undefined') lib.initPage(document);
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var GROUP_ORDER = ['hero', 'article', 'mode', 'tool'];
  var GROUP_LABELS = {
    hero: 'Hero',
    article: 'Bài viết',
    mode: 'Chế độ',
    tool: 'Công cụ'
  };
  var GROUP_ICONS = {
    hero: '🦸',
    article: '📖',
    mode: '⚔️',
    tool: '🧮'
  };

  /* One thumbnail per result: the entry's own image when the index
   * carries one, else a group icon — both render in the same 56px box
   * (see .search-thumb in search.css), so every row lines up. */
  function thumbFor(entry) {
    if (entry && entry.img) return { img: entry.img };
    var g = (entry && entry.group) || 'article';
    return { icon: GROUP_ICONS[g] || GROUP_ICONS.article };
  }

  function thumbHtml(entry) {
    var t = thumbFor(entry);
    if (t.img) {
      return '<img class="search-thumb" src="' + esc(t.img) + '" alt="" loading="lazy">';
    }
    return '<span class="search-thumb search-thumb-icon" aria-hidden="true">' + t.icon + '</span>';
  }

  /* Diacritic-insensitive Vietnamese: "tuong" matches "tướng",
   * "ruby" matches "Ruby Farming". NFD splits base letters from
   * combining marks; đ/Đ do not decompose, so they are mapped by hand. */
  function normalize(s) {
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase();
  }

  function tokensOf(query) {
    return normalize(query).split(/\s+/).filter(function (t) { return t; });
  }

  function normEntry(entry) {
    return {
      title: normalize(entry.title),
      headings: normalize((entry.headings || []).join(' ')),
      desc: normalize(entry.desc || ''),
      keys: normalize(entry.keys || '')
    };
  }

  /* Ranking: title match > hero-name match > heading match >
   * description match > tag/keyword match. Every query token must
   * appear somewhere in the entry; the score only orders the hits. */
  function scoreEntry(entry, tokens) {
    if (!tokens.length) return 0;
    var n = normEntry(entry);
    var hay = n.title + ' ' + n.headings + ' ' + n.desc + ' ' + n.keys;
    for (var i = 0; i < tokens.length; i++) {
      if (hay.indexOf(tokens[i]) === -1) return 0;
    }
    var score = 0;
    var titleWeight = entry.group === 'hero' ? 80 : 100;
    for (var j = 0; j < tokens.length; j++) {
      var t = tokens[j];
      if (n.title.indexOf(t) !== -1) {
        score += titleWeight;
        if (n.title.indexOf(t) === 0) score += 30;
      } else if (n.headings.indexOf(t) !== -1) {
        score += 50;
      } else if (n.desc.indexOf(t) !== -1) {
        score += 20;
      } else if (n.keys.indexOf(t) !== -1) {
        score += 10;
      }
    }
    return score;
  }

  function searchEntries(entries, query) {
    var tokens = tokensOf(query);
    if (!tokens.length) return [];
    var scored = [];
    for (var i = 0; i < entries.length; i++) {
      var s = scoreEntry(entries[i], tokens);
      if (s > 0) scored.push({ entry: entries[i], score: s });
    }
    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      var at = normalize(a.entry.title), bt = normalize(b.entry.title);
      return at < bt ? -1 : at > bt ? 1 : 0;
    });
    return scored.map(function (x) { return x.entry; });
  }

  function groupResults(results) {
    var groups = [];
    GROUP_ORDER.forEach(function (g) {
      var items = results.filter(function (e) { return e.group === g; });
      if (items.length) groups.push({ group: g, label: GROUP_LABELS[g], items: items });
    });
    return groups;
  }

  /* ---- browser glue (tim-kiem.html only) ---- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initPage(doc) {
    var input = doc.getElementById('search-input');
    if (!input) return;
    var resultsEl = doc.getElementById('search-results');
    var countEl = doc.getElementById('search-count');
    var emptyEl = doc.getElementById('search-empty');
    var hintEl = doc.getElementById('search-hint');
    var clearBtn = doc.getElementById('search-clear');
    var entries = [];
    var timer = null;

    function render(query) {
      var q = (query || '').trim();
      if (!q) {
        resultsEl.innerHTML = '';
        countEl.textContent = '';
        emptyEl.hidden = true;
        if (hintEl) hintEl.hidden = false;
        return;
      }
      if (hintEl) hintEl.hidden = true;
      var hits = searchEntries(entries, q);
      if (!hits.length) {
        resultsEl.innerHTML = '';
        countEl.textContent = 'Không tìm thấy kết quả cho "' + q + '"';
        emptyEl.hidden = false;
        return;
      }
      emptyEl.hidden = true;
      var groups = groupResults(hits);
      var total = hits.length;
      countEl.textContent = 'Tìm thấy ' + total + ' kết quả cho "' + q + '"';
      var html = '';
      groups.forEach(function (g) {
        html += '<section class="search-group"><h2 class="search-group-title">' +
          esc(g.label) + ' <span>(' + g.items.length + ')</span></h2><ul class="search-list">';
        g.items.forEach(function (e) {
          html += '<li><a class="search-item" href="' + esc(e.url) + '">' +
            thumbHtml(e) +
            '<span class="search-item-text"><span class="search-item-title">' + esc(e.title) + '</span>' +
            (e.desc ? '<span class="search-item-desc">' + esc(e.desc) + '</span>' : '') +
            '</span></a></li>';
        });
        html += '</ul></section>';
      });
      resultsEl.innerHTML = html;
    }

    function schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { render(input.value); }, 120);
    }

    input.addEventListener('input', schedule);
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        input.value = '';
        input.focus();
        render('');
      });
    }
    doc.querySelectorAll('[data-search-q]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        input.value = chip.getAttribute('data-search-q');
        render(input.value);
        input.focus();
      });
    });

    fetch('search-index.json').then(function (r) { return r.json(); }).then(function (data) {
      entries = data.entries || [];
      var params = new URLSearchParams(window.location.search);
      var q = params.get('q');
      if (q) {
        input.value = q;
        render(q);
      } else if (hintEl) {
        var c = data.counts || {};
        hintEl.querySelector('.search-hint-count').textContent =
          'Tìm trong ' + (c.pages || 0) + ' trang, ' + (c.heroes || 0) +
          ' hero và ' + (c.chapters || 0) + ' chương Cốt truyện.';
      }
    }).catch(function () {
      countEl.textContent = 'Không tải được dữ liệu tìm kiếm. Hãy tải lại trang.';
    });
  }

  return {
    normalize: normalize,
    tokensOf: tokensOf,
    scoreEntry: scoreEntry,
    searchEntries: searchEntries,
    groupResults: groupResults,
    thumbFor: thumbFor,
    thumbHtml: thumbHtml,
    GROUP_ORDER: GROUP_ORDER,
    GROUP_LABELS: GROUP_LABELS,
    GROUP_ICONS: GROUP_ICONS,
    initPage: initPage
  };
});
