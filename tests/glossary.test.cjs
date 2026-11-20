const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

/* glossary-data.js is a var assignment; parse the JSON payload out of it. */
function loadData() {
  const src = read('glossary-data.js');
  const m = /var GLOSSARY_DATA = (\[[\s\S]*\]);/.exec(src);
  assert.ok(m, 'glossary-data.js must define GLOSSARY_DATA');
  return JSON.parse(m[1]);
}

test('glossary data covers all 190 effects from FX_VI', () => {
  const data = loadData();
  assert.equal(data.length, 190, `glossary-data.js must list 190 effects, got ${data.length}`);
  const ens = data.map(e => e.en);
  assert.equal(new Set(ens).size, ens.length, 'glossary data has duplicate English names');
  /* Cross-check against the FX_VI dictionary in hero-detail.js. */
  const detail = read('hero-detail.js');
  const fx = /var FX_VI = \{([\s\S]*?)\n  \};/.exec(detail);
  assert.ok(fx, 'hero-detail.js must define FX_VI');
  const fxNames = [...fx[1].matchAll(/(?:"([^"]+)"|'([^']+)')\s*:/g)].map(m => m[1] || m[2]);
  assert.equal(fxNames.length, 190, `FX_VI must hold 190 effects, got ${fxNames.length}`);
  for (const name of fxNames) {
    assert.ok(ens.includes(name), `glossary data is missing FX_VI effect "${name}"`);
  }
});

test('every glossary entry has EN + VI names, a category and example heroes', () => {
  const data = loadData();
  const index = JSON.parse(read('data/heroes-index.json'));
  const heroIds = new Set(index.map(h => h.id));
  for (const e of data) {
    assert.ok(e.en && typeof e.en === 'string', 'entry needs an English name');
    assert.ok(e.vi && typeof e.vi === 'string', 'entry needs a Vietnamese name');
    assert.ok(['Buff', 'Debuff', 'Khac'].includes(e.category),
      `"${e.en}" needs a valid category (Buff/Debuff/Khac), got ${e.category}`);
    assert.ok(Array.isArray(e.examples) && e.examples.length > 0,
      `"${e.en}" needs at least one example hero`);
    assert.ok(e.examples.length <= 5, `"${e.en}" lists more than 5 example heroes`);
    for (const x of e.examples) {
      assert.ok(heroIds.has(x.id), `"${e.en}" example hero ${x.id} is not in heroes-index.json`);
      assert.ok(x.name, `"${e.en}" example hero ${x.id} needs a name`);
    }
    /* Description: 1-2 sentences when present; unverified ones are flagged. */
    assert.ok(typeof e.desc_verified === 'boolean', `"${e.en}" needs desc_verified`);
    if (e.desc) {
      assert.equal(typeof e.desc, 'string', `"${e.en}" desc must be a string`);
      const sentences = e.desc.split(/\.\s+/).filter(s => s.trim()).length;
      assert.ok(sentences >= 1 && sentences <= 2,
        `"${e.en}" desc must be 1-2 sentences, got ${sentences}`);
    }
  }
});

test('glossary page: search box, category filter, A-Z index and count', () => {
  const html = read('tu-dien-hieu-ung.html');
  assert.ok(html.includes('id="gl-search"'), 'glossary page needs a search input');
  assert.ok(html.includes('id="gl-list"'), 'glossary page needs the results container');
  assert.ok(html.includes('id="gl-az"'), 'glossary page needs the A-Z index');
  assert.ok(html.includes('id="gl-result-count"'), 'glossary page needs the result count');
  assert.ok(html.includes('190 hiệu ứng'), 'glossary page must show the "190 hiệu ứng" count');
  for (const cat of ['data-cat="Buff"', 'data-cat="Debuff"', 'data-cat="Khac"']) {
    assert.ok(html.includes(cat), `glossary page needs the ${cat} filter`);
  }
  assert.ok(html.includes('src="glossary-data.js"'), 'glossary page must load glossary-data.js');
  assert.ok(html.includes('src="glossary.js"'), 'glossary page must load glossary.js');
  assert.ok(html.includes('href="glossary.css"'), 'glossary page must load glossary.css');
  assert.ok(html.includes('chưa xác minh') || read('glossary.js').includes('chưa xác minh'),
    'glossary must show the "chưa xác minh" label for unverified descriptions');
  assert.ok(html.includes('đang bổ sung mô tả') || read('glossary.js').includes('đang bổ sung mô tả'),
    'glossary must show "đang bổ sung mô tả" for effects without a description');
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'glossary page has duplicate ids');
});

test('glossary page uses the standard nav links', () => {
  const html = read('tu-dien-hieu-ung.html');
  for (const link of ['index.html', 'newbie.html', 'cap-nhat.html', 'cot-truyen.html',
    'castle-rush.html', 'advent-expedition.html', 'raid.html', 'dungeon.html',
    'celestial-tower.html', 'tower-of-trials.html', 'arena.html', 'total-war.html',
    'guild-war-team.html', 'heroes.html', 'tier-list.html', 'tu-dien-hieu-ung.html',
    'so-sanh.html', 'tinh-ruby.html', 'doi-coupon.html']) {
    assert.ok(html.includes(`href="${link}"`), `glossary page nav must link ${link}`);
  }
  assert.ok(html.includes('id="image-dialog"'), 'glossary page needs the image dialog');
  assert.ok(html.includes('class="back-to-top"'), 'glossary page needs the back-to-top button');
  assert.ok(html.includes('src="guide.js"'), 'glossary page must load guide.js');
  /* This page IS a menu item (TRA CỨU submenu child), so it highlights itself
   * and its TRA CỨU parent — exactly one active nav item. */
  assert.ok(html.includes('class="nav-active" href="tu-dien-hieu-ung.html"'),
    'glossary page must highlight itself in the nav (one active item)');
  assert.ok(html.includes('data-parent="TRA CỨU"'), 'glossary page nav must have the TRA CỨU dropdown');
  assert.equal((html.match(/class="nav-active" href="/g) || []).length, 1,
    'glossary page must have exactly one active nav item');
});

test('glossary search is diacritic-insensitive (gõ không dấu vẫn ra)', () => {
  const js = read('glossary.js');
  assert.ok(js.includes("normalize('NFD')"), 'glossary search must use NFD normalization');
  assert.ok(js.includes('[\\u0300-\\u036f]'), 'glossary search must strip combining marks');
  assert.ok(js.includes("replace(/đ/g, 'd')"), 'glossary search must fold đ to d');
  assert.ok(js.includes('toLowerCase()'), 'glossary search must lowercase');
});

test('glossary colors follow the site convention (good blue, bad red, neutral bold only)', () => {
  const css = read('glossary.css');
  assert.ok(css.includes('.gl-en.gl-buff{color:#1a6fd4}'), 'Buff effect names must be blue (#1a6fd4)');
  assert.ok(css.includes('.gl-en.gl-debuff{color:#c0392b}'), 'Debuff effect names must be red (#c0392b)');
  assert.ok(/\.gl-en\.gl-khac\{color:#202638\}/.test(css), 'Khác effect names must be plain bold (no red/blue)');
  assert.ok(!css.includes('prefers-color-scheme: dark'), 'glossary.css must not contain a dark-mode rule');
});

test('glossary icons: every entry has an icon field; mapped icons are real webp files', () => {
  const data = loadData();
  let nReal = 0;
  for (const e of data) {
    assert.ok('icon' in e, `"${e.en}" needs an icon field (path or null)`);
    if (e.icon === null) continue;
    nReal++;
    assert.equal(typeof e.icon, 'string', `"${e.en}" icon must be a path string`);
    assert.ok(e.icon.startsWith('assets/effects/') && e.icon.endsWith('.webp'),
      `"${e.en}" icon must be an assets/effects/*.webp path, got ${e.icon}`);
    const buf = fs.readFileSync(path.join(root, e.icon));
    assert.ok(buf.length > 0, `"${e.en}" icon file ${e.icon} is empty`);
    assert.ok(buf.slice(0, 4).toString('latin1') === 'RIFF'
      && buf.slice(8, 12).toString('latin1') === 'WEBP',
      `"${e.en}" icon file ${e.icon} is not a valid WebP image`);
  }
  assert.ok(nReal > 0, 'at least one effect must have a real icon');
  /* The "?" placeholder must exist and be a valid SVG. */
  const ph = fs.readFileSync(path.join(root, 'assets/effects/unknown.svg'), 'utf8');
  assert.ok(ph.trimStart().startsWith('<svg'), 'unknown.svg placeholder must be an SVG');
  assert.ok(ph.includes('?'), 'unknown.svg placeholder must show a "?"');
  assert.ok(!ph.includes('Atlas'), 'unknown.svg must not mention Atlas');
});

test('glossary icons: renderer shows the icon (lazy, alt = effect name) or the placeholder', () => {
  const js = read('glossary.js');
  assert.ok(js.includes('class="gl-icon"'), 'glossary.js must render an <img class="gl-icon">');
  assert.ok(js.includes('loading="lazy"'), 'glossary icons must load lazily');
  assert.ok(js.includes("assets/effects/unknown.svg"),
    'glossary.js must fall back to the unknown.svg placeholder when icon is null');
  assert.ok(js.includes("e.icon ? e.icon : 'assets/effects/unknown.svg'"),
    'glossary.js must use the mapped icon when present, placeholder otherwise');
  const css = read('glossary.css');
  assert.ok(css.includes('.gl-icon'), 'glossary.css must style .gl-icon');
});

test('glossary icon map (glossary-icons.json) only names FX_VI effects and matches the data', () => {
  const mapPath = path.join(__dirname, '..', '..', 'glossary-icons.json');
  if (!fs.existsSync(mapPath)) return; /* map lives next to build_glossary.py, outside the repo */
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const data = loadData();
  const byEn = new Map(data.map(e => [e.en, e]));
  for (const [en, file] of Object.entries(map)) {
    assert.ok(byEn.has(en), `glossary-icons.json names "${en}", which is not an FX_VI effect`);
    assert.ok(fs.existsSync(path.join(root, file)),
      `glossary-icons.json maps "${en}" to missing file ${file}`);
    assert.equal(byEn.get(en).icon, file,
      `glossary-data.js icon for "${en}" must match glossary-icons.json`);
  }
  for (const e of data) {
    if (e.icon !== null) {
      assert.equal(map[e.en], e.icon,
        `"${e.en}" has an icon in the data but no matching glossary-icons.json entry`);
    }
  }
});

test('glossary files never mention the upstream data source', () => {
  for (const file of ['tu-dien-hieu-ung.html', 'glossary.css', 'glossary.js', 'glossary-data.js']) {
    assert.ok(!read(file).includes('Atlas'), `${file} must not mention Atlas`);
    assert.ok(!read(file).includes('7k Atlas'), `${file} must not mention 7k Atlas`);
  }
});
