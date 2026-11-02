const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');

const index = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes-index.json'), 'utf8'));
const heroFiles = fs.readdirSync(path.join(root, 'data', 'heroes')).filter(f => f.endsWith('.json'));

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

test('heroes.html directory page: search, filters, sort, grid and popup wiring', () => {
  const html = read('heroes.html');
  assert.ok(html.includes('id="hx-search-input"'), 'heroes.html needs a search input');
  assert.ok(html.includes('id="hx-sort"'), 'heroes.html needs a sort select');
  assert.ok(html.includes('id="hx-clear"'), 'heroes.html needs a clear-filters button');
  assert.ok(html.includes('id="hx-filters"'), 'heroes.html needs a filters aside');
  assert.ok(html.includes('id="hx-grid"'), 'heroes.html needs the hero grid');
  assert.ok(html.includes('href="heroes.css"'), 'heroes.html must load heroes.css');
  assert.ok(html.includes('src="hero-popup.js"'), 'heroes.html must load the popup script');
  assert.ok(html.includes('src="heroes.js"'), 'heroes.html must load the directory script');
  assert.ok(html.includes('href="heroes.html"'), 'heroes.html must be in the nav');
  assert.ok(html.includes('class="nav-active" href="heroes.html"'), 'heroes.html must be the active nav item');
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'heroes.html has duplicate ids');
});

test('hero.html detail page: two tabs and detail script', () => {
  const html = read('hero.html');
  assert.ok(html.includes('id="hx-tab-main"'), 'hero.html needs the Chi tiết tab');
  assert.ok(html.includes('id="hx-tab-builds"'), 'hero.html needs the Build đồ tab');
  assert.ok(html.includes('Chi tiết'), 'hero.html tabs must be labelled in Vietnamese');
  assert.ok(html.includes('Build đồ'), 'hero.html tabs must be labelled in Vietnamese');
  assert.ok(html.includes('id="hx-side"'), 'hero.html needs the side column');
  assert.ok(html.includes('id="hx-content"'), 'hero.html needs the content container');
  assert.ok(html.includes('src="hero-detail.js"'), 'hero.html must load the detail script');
  assert.ok(html.includes('href="heroes.css"'), 'hero.html must load heroes.css');
  assert.ok(html.includes('class="nav-active" href="heroes.html"'), 'hero.html must highlight HEROES in the nav');
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'hero.html has duplicate ids');
});

test('heroes index covers every playable hero and every hero has a JSON file', () => {
  assert.equal(index.length, 124, `heroes-index.json must list 124 heroes, got ${index.length}`);
  const ids = index.map(h => h.id);
  assert.equal(new Set(ids).size, ids.length, 'heroes index has duplicate ids');
  for (const h of index) {
    assert.ok(heroFiles.includes(h.id + '.json'), `${h.name} is missing data/heroes/${h.id}.json`);
    assert.ok(fs.existsSync(path.join(root, 'assets', `hero-${h.id}.webp`)),
      `${h.name} is missing its s6 portrait`);
    if (h.awakened) {
      assert.ok(fs.existsSync(path.join(root, 'assets', `hero-awk-${h.id}.webp`)),
        `${h.name} is awakened but missing its AWK portrait`);
    }
  }
});

test('every hero JSON has the fields both tabs need', () => {
  for (const f of heroFiles) {
    const rec = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', f), 'utf8'));
    assert.ok(rec.name, `${f} needs a name`);
    assert.ok(rec.rarity, `${f} needs a rarity`);
    assert.ok(rec.type, `${f} needs a type`);
    assert.ok(rec.overview && typeof rec.overview.desc === 'string', `${f} needs an overview description`);
    // Awakened heroes carry both kits (awk + s6); non-awakened heroes carry
    // only their 6-star kit under s6, with awk null.
    const versions = ['awk', 's6'].filter((v) => Array.isArray(rec.skills[v]) && rec.skills[v].length > 0);
    assert.ok(versions.length > 0, `${f} needs skills`);
    assert.ok(rec.stats && (rec.stats.awk || rec.stats.s6), `${f} needs base stats`);
    assert.ok(Array.isArray(rec.tiers), `${f} needs a tiers list`);
    assert.ok(Array.isArray(rec.builds), `${f} needs a builds list`);
    for (const v of versions) {
      for (const sk of rec.skills[v]) {
        assert.ok(sk.icon, `${f} ${v} skill ${sk.key} is missing its icon`);
        assert.ok(fs.existsSync(path.join(root, 'assets', 'skills-raw', sk.icon)),
          `${f} ${v} skill ${sk.key} icon ${sk.icon} is missing from assets/skills-raw`);
      }
    }
    if (rec.dedicated) {
      assert.ok(rec.dedicated.icon && fs.existsSync(path.join(root, 'assets', 'dedicated', rec.dedicated.icon)),
        `${f} dedicated equipment icon is missing`);
    }
  }
});

test('arena and total-war pages wire the quick-build popup into hero portraits', () => {
  for (const file of ['arena.html', 'total-war.html']) {
    const html = read(file);
    assert.ok(html.includes('src="hero-popup.js"'), `${file} must load the popup script`);
    assert.ok(html.includes('href="heroes.css"'), `${file} must load heroes.css for the popup`);
    assert.ok(html.includes('data-hero-popup='), `${file} must mark hero portraits with data-hero-popup`);
  }
});

test('heroes section files do not introduce a dark-mode rule', () => {
  for (const file of ['heroes.html', 'hero.html', 'heroes.css', 'heroes.js', 'hero-detail.js', 'hero-popup.js']) {
    assert.ok(!read(file).includes('prefers-color-scheme: dark'), `${file} must not contain a dark-mode rule`);
  }
});

test('every substat icon referenced by hero-detail.js exists on disk (URL-decoded)', () => {
  // Regression (2026-11-02): the %-stat icons were saved as AllATK%25.webp
  // (literal %25 in the filename), but browsers decode %25 in the img URL
  // to %, so the server looked for AllATK%.webp and 404'd. Files must be
  // named with a literal % so the %25 URL resolves to them.
  const js = read('hero-detail.js');
  const m = js.match(/var STAT_ICONS = \{([^}]*)\}/);
  assert.ok(m, 'hero-detail.js must define STAT_ICONS');
  const names = [...m[1].matchAll(/'([^']+)'\s*:\s*'([^']+)'/g)].map(([, , v]) => v);
  assert.ok(names.length >= 20, `STAT_ICONS must list the substat icons (found ${names.length})`);
  for (const name of names) {
    // The browser requests the URL-encoded form and the server decodes it.
    const decoded = decodeURIComponent(name);
    assert.ok(fs.existsSync(path.join(root, 'assets', 'substats', decoded)),
      `substat icon ${name} (decoded: ${decoded}) is missing from assets/substats`);
  }
});
