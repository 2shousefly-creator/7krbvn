const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');

const search = require(path.join(root, 'search.js'));
const index = JSON.parse(fs.readFileSync(path.join(root, 'search-index.json'), 'utf8'));
const heroesIndex = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes-index.json'), 'utf8'));
const heroIds = new Set(heroesIndex.map(h => h.id));
const htmlFiles = fs.readdirSync(root).filter(f => f.endsWith('.html'));

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
// The forbidden word is spelled out in pieces so this test file itself
// stays free of it, like every other new file in this feature.
const FORBIDDEN = new RegExp('atl' + 'as', 'i');

test('search index: counts match the tree (pages + 125 heroes + 284 story chapters)', () => {
  assert.equal(index.counts.heroes, 125, `index must list 125 heroes, got ${index.counts.heroes}`);
  assert.equal(index.counts.chapters, 284, `index must list 284 story chapters, got ${index.counts.chapters}`);
  assert.equal(index.counts.pages, htmlFiles.length,
    `index must cover all ${htmlFiles.length} HTML pages, got ${index.counts.pages}`);
  assert.equal(index.counts.total, index.entries.length, 'total must equal the entries length');
  assert.equal(index.counts.total,
    index.counts.pages + index.counts.heroes + index.counts.chapters,
    'total must be pages + heroes + chapters');
  const byGroup = {};
  for (const e of index.entries) byGroup[e.group] = (byGroup[e.group] || 0) + 1;
  assert.equal(byGroup.hero, 125, 'hero group must hold the 125 heroes');
  assert.equal(byGroup.tool, 2, 'tool group must hold the ruby calculator and coupon redeem pages');
  assert.ok(byGroup.mode > 10, `mode group must hold the PvE/PvP pages, got ${byGroup.mode || 0}`);
  assert.ok(byGroup.article > 100, `article group must hold the guides, got ${byGroup.article || 0}`);
  const sizeKb = fs.statSync(path.join(root, 'search-index.json')).size / 1024;
  assert.ok(sizeKb > 50 && sizeKb < 500, `index should stay a modest download, got ${sizeKb.toFixed(1)} KB`);
});

test('every URL in the index resolves to an existing file (or a valid hero id)', () => {
  const pageUrls = new Set();
  for (const e of index.entries) {
    assert.ok(e.title, `entry ${e.url} needs a title`);
    assert.ok(['hero', 'article', 'mode', 'tool'].includes(e.group),
      `entry ${e.url} has unknown group ${e.group}`);
    const [base, query] = e.url.split('?');
    const file = base.split('#')[0];
    assert.ok(fs.existsSync(path.join(root, file)), `index URL ${e.url} points to missing file ${file}`);
    if (e.url.includes('hero.html?id=')) {
      assert.equal(e.group, 'hero', `${e.url} must be a hero entry`);
      assert.ok(heroIds.has(query.split('#')[0].replace('id=', '')),
        `${e.url} has an unknown hero id`);
    }
    if (!e.url.includes('?') && !e.url.includes('#')) pageUrls.add(e.url);
  }
  // The index must cover every public HTML page present right now.
  for (const f of htmlFiles) {
    assert.ok(pageUrls.has(f), `index is missing page ${f} — re-run build_search_index.py`);
  }
});

test('story chapters link to their Act reader page with a deep link, titles only', () => {
  const chapters = index.entries.filter(e =>
    e.desc.startsWith('Cốt truyện · Act') && e.url.includes('#ch-'));
  assert.equal(chapters.length, 284, `expected 284 chapter entries, got ${chapters.length}`);
  for (const e of chapters) {
    assert.match(e.url, /^cot-truyen-act-[1-5]\.html#ch-\d+$/,
      `${e.title} must link to its Act page with a #ch-<id> deep link`);
    assert.match(e.title, /^Chương \d+ — .+/,
      `${e.url} chapter title must be "Chương N — <tên chương>"`);
    assert.ok(!e.desc.includes('Evan nói') && e.headings.length === 0,
      `${e.url} must carry the title only, no dialogue text`);
  }
  // One entry per chapter number per Act (lead-in chapters share the
  // host page id but keep their own number + title).
  const seen = new Set(chapters.map(e => e.title));
  assert.equal(seen.size, 284, 'chapter titles must be unique across Acts');
});

test('diacritic-insensitive matching: "tuong" finds "tướng", "doi" finds "Đổi"', () => {
  assert.equal(search.normalize('Tướng mới & Thức tỉnh'), 'tuong moi & thuc tinh');
  assert.equal(search.normalize('Đổi Coupon'), 'doi coupon');
  assert.equal(search.normalize('Ruby Farming'), 'ruby farming');
  const tuong = search.searchEntries(index.entries, 'tuong');
  assert.ok(tuong.length > 0, '"tuong" must return results');
  assert.ok(tuong.some(e => e.url === 'cap-nhat-12-11.html'),
    '"tuong" must find the 12/11 update page (heading "Tướng mới & Thức tỉnh")');
  assert.ok(tuong.some(e => search.normalize(e.title).includes('tuong')),
    '"tuong" must match an entry whose title holds "tướng"');
  const doi = search.searchEntries(index.entries, 'doi coupon');
  assert.ok(doi.some(e => e.url === 'doi-coupon.html'),
    '"doi coupon" must find the coupon page');
});

test('searching a hero name returns hero.html?id=<id> first', () => {
  for (const [name, id] of [['eve', 'eve'], ['rudy', 'rudy'], ['judas', 'judas']]) {
    const hits = search.searchEntries(index.entries, name);
    assert.ok(hits.length > 0, `"${name}" must return results`);
    assert.equal(hits[0].url, `hero.html?id=${id}`,
      `"${name}" must rank the hero page first, got ${hits[0].url}`);
    assert.equal(hits[0].group, 'hero', `"${name}" top hit must be in the hero group`);
  }
});

test('ranking: a title match outranks a description-only match', () => {
  const hits = search.searchEntries(index.entries, 'ruby');
  assert.ok(hits.length > 0, '"ruby" must return results');
  assert.ok(search.normalize(hits[0].title).includes('ruby'),
    `"ruby" top hit must have ruby in its title, got "${hits[0].title}"`);
  assert.ok(hits.some(e => e.url === 'ruby-farming.html'),
    '"ruby" must find the Ruby Farming guide');
  assert.ok(hits.some(e => e.url === 'tinh-ruby.html' && e.group === 'tool'),
    '"ruby" must find the ruby calculator in the tool group');
  // Multi-word query: every token must match somewhere.
  const both = search.searchEntries(index.entries, 'ruby farming');
  assert.ok(both.length > 0, '"ruby farming" must return results');
  assert.equal(both[0].url, 'ruby-farming.html',
    '"ruby farming" must rank the Ruby Farming guide first');
  const groups = search.groupResults(hits);
  assert.deepEqual(groups.map(g => g.label),
    groups.map(g => g.label).filter((l, i, a) => a.indexOf(l) === i),
    'groups must not repeat a label');
  assert.ok(groups.some(g => g.label === 'Bài viết'), 'results must group into Bài viết');
  assert.ok(groups.some(g => g.label === 'Công cụ'), 'results must group into Công cụ');
  assert.deepEqual(search.searchEntries(index.entries, '   '), [], 'blank query returns nothing');
  assert.deepEqual(search.searchEntries(index.entries, 'zzzqqq'), [], 'unknown query returns nothing');
});

test('search page: template, live search box, groups, empty state and dialog', () => {
  const html = read('tim-kiem.html');
  assert.ok(html.includes('<title>Tìm kiếm toàn trang | 7K RBVN</title>'),
    'search page must have its own title');
  assert.ok(html.includes('id="search-input"'), 'search page needs the large search box');
  assert.ok(html.includes('id="search-results"'), 'search page needs a live results container');
  assert.ok(html.includes('id="search-count"'), 'search page needs a result count line');
  assert.ok(html.includes('id="search-empty"'), 'search page needs the empty state');
  assert.ok(html.includes('Thử từ khóa ngắn hơn') && html.toLowerCase().includes('kiểm tra lại chính tả'),
    'empty state must suggest a shorter keyword and a spelling check');
  assert.ok(html.includes('href="search.css"'), 'search page must load its own search.css');
  assert.ok(html.includes('src="search.js"'), 'search page must load its own search.js');
  assert.ok(html.includes('src="guide.js"'), 'search page must load guide.js like the template');
  assert.ok(html.includes('id="image-dialog"'), 'search page must carry the image dialog');
  assert.ok(html.includes('class="back-to-top"'), 'search page must carry the back-to-top button');
  assert.ok(html.includes('href="heroes.html"'), 'search page must breadcrumb back to Heroes');
  assert.ok(html.includes('data-search-q="Eve"'), 'search page must offer suggestion chips');
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'tim-kiem.html has duplicate ids');
  // Standard nav, exactly one active item (Heroes — the page has no menu item).
  for (const target of ['index.html', 'newbie.html', 'cap-nhat.html', 'cot-truyen.html',
    'castle-rush.html', 'advent-expedition.html', 'raid.html', 'dungeon.html',
    'celestial-tower.html', 'tower-of-trials.html', 'arena.html', 'total-war.html',
    'guild-war-team.html', 'heroes.html', 'tier-list.html', 'tu-dien-hieu-ung.html',
    'so-sanh.html', 'tinh-ruby.html', 'doi-coupon.html']) {
    assert.ok(html.includes(`href="${target}"`), `tim-kiem.html is missing nav link ${target}`);
  }
  assert.equal((html.match(/class="(?:snav-active|nav-active)" href="/g) || []).length, 1,
    'tim-kiem.html must have exactly one active nav item');
  assert.ok(html.includes('class="nav-active" href="heroes.html"'),
    'tim-kiem.html must highlight HEROES in the nav');
  assert.ok(!html.includes('CHI TIẾT CẬP NHẬT'), 'tim-kiem.html nav must not keep the template label');
});

test('heroes page no longer links to the full-site search (moved to the home bar)', () => {
  const html = read('heroes.html');
  assert.ok(!html.includes('href="tim-kiem.html"'), 'heroes.html must not link to tim-kiem.html any more');
  assert.ok(!html.includes('Tìm kiếm toàn trang'), 'heroes.html must not carry the full-site search button');
  assert.ok(html.includes('id="hx-search-input"'), 'heroes.html must keep its own hero search box');
  assert.ok(html.includes('id="hx-search-btn"'), 'heroes.html must keep its own Tìm button');
});

test('search index: every entry carries a thumbnail image, or falls back to a group icon', () => {
  // Heroes: their portrait from heroes-index.json, and the file exists.
  const heroes = index.entries.filter(e => e.group === 'hero');
  assert.equal(heroes.length, 125, 'hero group must hold the 125 heroes');
  for (const e of heroes) {
    assert.ok(e.img && e.img.startsWith('assets/hero-'),
      `${e.url} hero entry must carry its portrait, got ${e.img}`);
    assert.ok(fs.existsSync(path.join(root, e.img)), `${e.url} portrait ${e.img} is missing`);
  }
  // Pages + chapters: every local image in the index must exist on disk.
  let withImg = 0;
  const noImg = [];
  for (const e of index.entries) {
    if (e.img) {
      withImg++;
      if (!e.img.startsWith('http')) {
        assert.ok(fs.existsSync(path.join(root, e.img)), `${e.url} image ${e.img} is missing`);
      }
    } else noImg.push(e.url);
  }
  assert.equal(withImg, 649, `649 of 655 entries must carry an image, got ${withImg}`);
  // Only the JS-rendered pages with no static image fall back to an icon.
  assert.deepEqual(noImg.sort(), ['guild-war-team.html', 'hero.html', 'heroes.html',
    'tier-list.html', 'tim-kiem.html', 'xac-suat-hieu-ung.html'],
    'only the six image-less pages may fall back to a group icon');
  // Story chapters inherit their Act page image.
  const chapters = index.entries.filter(e => e.desc.startsWith('Cốt truyện · Act'));
  assert.equal(chapters.length, 284, '284 story chapters must be indexed');
  assert.ok(chapters.every(e => e.img && e.img.startsWith('assets/')),
    'story chapters must carry their Act page image');
  // thumbFor: image when present, group icon otherwise.
  assert.deepEqual(search.thumbFor({ group: 'hero', img: 'assets/hero-eve.webp' }),
    { img: 'assets/hero-eve.webp' }, 'thumbFor must use the entry image when present');
  assert.deepEqual(search.thumbFor({ group: 'hero' }), { icon: '🦸' }, 'hero without image falls back to 🦸');
  assert.deepEqual(search.thumbFor({ group: 'article' }), { icon: '📖' }, 'article without image falls back to 📖');
  assert.deepEqual(search.thumbFor({ group: 'mode' }), { icon: '⚔️' }, 'mode without image falls back to ⚔️');
  assert.deepEqual(search.thumbFor({ group: 'tool' }), { icon: '🧮' }, 'tool without image falls back to 🧮');
  assert.deepEqual(search.thumbFor({}), { icon: '📖' }, 'unknown group falls back to the article icon');
  assert.ok(search.thumbHtml({ group: 'hero', img: 'assets/hero-eve.webp' })
    .includes('<img class="search-thumb" src="assets/hero-eve.webp"'),
    'thumbHtml must render an img for entries with an image');
  assert.ok(search.thumbHtml({ group: 'tool' })
    .includes('<span class="search-thumb search-thumb-icon"'),
    'thumbHtml must render an icon span for entries without an image');
  // CSS: image thumbs and icon fallbacks share one fixed 56px box.
  const css = read('search.css');
  assert.ok(css.includes('.search-thumb{flex:none;width:56px;height:56px'),
    'thumbs must be a fixed 56px box so every row lines up');
  assert.ok(css.includes('.search-item{display:flex'),
    'result rows must lay out thumb + text side by side');
});

test('new search files carry no forbidden source name and no dark-mode rule', () => {
  for (const file of ['tim-kiem.html', 'search.css', 'search.js', 'search-index.json']) {
    assert.ok(!FORBIDDEN.test(read(file)), `${file} must not name the forbidden source`);
  }
  const script = fs.readFileSync(
    path.join(__dirname, '..', '..', 'build_search_index.py'), 'utf8');
  assert.ok(!FORBIDDEN.test(script), 'build_search_index.py must not name the forbidden source');
  assert.ok(!read('search.css').includes('prefers-color-scheme: dark'),
    'search.css must not contain a dark-mode rule');
});

test('home dropdown: live results reuse the same ranking and rows, capped and grouped', () => {
  const js = read('search.js');
  assert.ok(js.includes('home-search-input'), 'search.js must wire the home input');
  assert.ok(js.includes('home-search-results'), 'search.js must wire the home dropdown');
  assert.ok(js.includes('setTimeout(render, 150)'), 'home dropdown must debounce typing by ~150ms');
  assert.ok(js.includes("'Escape'"), 'home dropdown must hide on Escape');
  assert.ok(js.includes("closest('.home-search')"), 'home dropdown must hide when clicking outside the search bar');
  assert.ok(js.includes('dropdownResults(searchEntries(entries, q))'),
    'dropdown must reuse the searchEntries ranking');
  assert.ok(js.includes('thumbHtml(e)'), 'dropdown rows must reuse the 56px thumbnail helper');
  assert.ok(js.includes('aria-expanded'), 'dropdown must expose its open state');
  assert.ok(js.includes('HOME_DROPDOWN_MAX = 10'), 'dropdown must cap its rendered rows at 10');
  // Pure helper: 'eve' returns 241 hits, so the dropdown must cap at 10
  // rows while CSS shows ~5 — the rest scroll into view.
  const eve = search.searchEntries(index.entries, 'eve');
  assert.ok(eve.length > 10, '"eve" must return more than 10 hits');
  const shown = search.dropdownResults(eve);
  assert.equal(shown.length, 10, `dropdown must render exactly 10 rows for "eve", got ${shown.length}`);
  assert.equal(shown[0].url, 'hero.html?id=eve', 'dropdown must keep the top-ranked hit first');
  const order = ['hero', 'article', 'mode', 'tool'];
  const groups = shown.map(e => e.group);
  assert.deepEqual([...groups].sort((a, b) => order.indexOf(a) - order.indexOf(b)), groups,
    'dropdown rows must stay in group order (hero, article, mode, tool)');
  assert.equal(search.dropdownResults(eve, 5).length, 5, 'dropdownResults must honour an explicit cap');
  assert.deepEqual(search.dropdownResults([], 10), [], 'dropdownResults must handle no hits');
  // 'ruby' has 7 hits: all fit in the box, more than the 5 visible rows,
  // so scrolling matters even for short result lists.
  const ruby = search.searchEntries(index.entries, 'ruby');
  assert.ok(ruby.length > 5 && ruby.length <= 10, `"ruby" must return 6-10 hits, got ${ruby.length}`);
  assert.equal(search.dropdownResults(ruby).length, ruby.length, 'short lists must render in full');
  assert.equal(search.dropdownResults(ruby)[0].url, 'ruby-farming.html',
    'dropdown must keep the Ruby Farming guide first for "ruby"');
});
