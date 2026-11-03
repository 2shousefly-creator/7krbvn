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
  /* Filters live behind a funnel button + right-side popup, not a sidebar. */
  assert.ok(html.includes('id="hx-filter-btn"'), 'heroes.html needs the funnel filter button');
  assert.ok(html.includes('id="hx-filter-panel"'), 'heroes.html needs the filter popup panel');
  assert.ok(html.includes('id="hx-filter-backdrop"'), 'heroes.html needs the filter backdrop');
  assert.ok(html.includes('id="hx-filter-body"'), 'heroes.html needs the filter body container');
  assert.ok(!html.includes('id="hx-filters"'), 'heroes.html must not keep the old filter sidebar');
  assert.ok(html.includes('id="hx-grid"'), 'heroes.html needs the hero grid');
  assert.ok(html.includes('href="heroes.css"'), 'heroes.html must load heroes.css');
  assert.ok(html.includes('src="hero-popup.js"'), 'heroes.html must load the popup script');
  assert.ok(html.includes('src="heroes.js"'), 'heroes.html must load the directory script');
  assert.ok(html.includes('href="heroes.html"'), 'heroes.html must be in the nav');
  assert.ok(html.includes('class="nav-active" href="heroes.html"'), 'heroes.html must be the active nav item');
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'heroes.html has duplicate ids');
});

test('directory cards show only portrait, name and one rarity tag, 4 per row', () => {
  const js = read('heroes.js');
  /* cardHtml must not render the type badge or the role chips. */
  const card = js.slice(js.indexOf('function cardHtml'), js.indexOf('function render'));
  assert.ok(!card.includes('hx-badge type'), 'directory card must not show the type badge');
  assert.ok(!card.includes('hx-roles') && !card.includes('hx-role'), 'directory card must not show role tags');
  assert.ok(card.includes('hx-badge rarity'), 'directory card must show the one rarity tag');
  assert.ok(card.includes('h.rarity'), 'directory card rarity tag must come from the hero rarity');
  const css = read('heroes.css');
  assert.ok(/\.hx-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/.test(css),
    'heroes.css must lay out 4 heroes per row on desktop');
  assert.ok(css.includes('width:min(400px,70vw)'), 'filter popup must not exceed 70% of the viewport width');
  assert.ok(css.includes('.hx-filter-panel'), 'heroes.css must style the filter popup panel');
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

test('detail page drops Utility, Special Sources and Growth; tabs do not scroll', () => {
  const js = read('hero-detail.js');
  assert.ok(!js.includes('Hero Utility by Progression'), 'detail page must not render Hero Utility by Progression');
  assert.ok(!js.includes('Special Sources'), 'detail page must not render Special Sources');
  assert.ok(!js.includes("sectionTitle('Growth')"), 'detail page must not render the Growth section');
  assert.ok(!js.includes('renderGrowth'), 'detail page must not keep the Growth renderer');
  assert.ok(!js.includes('window.scrollTo'), 'switching tabs must not scroll the page to the top');
  /* Vietnamese headings (the small caps labels render in uppercase). */
  var jsLower = js.toLowerCase();
  for (const heading of ['Tổng quan hero', 'Xếp hạng theo chế độ', 'Ưu tiên nâng kỹ năng', 'Trang bị', 'Phụ kiện', 'Trang bị riêng', 'Cốt truyện', 'Chỉ số chính Vũ khí', 'Chỉ số chính Giáp', 'Ưu tiên dòng phụ']) {
    assert.ok(jsLower.includes(heading.toLowerCase()), `hero-detail.js must use the Vietnamese heading "${heading}"`);
  }
  /* Tier grades: mode image + bold grade only, no role / "at T" lines. */
  assert.ok(js.includes('hx-tier-grade'), 'detail page must render tier grades');
  assert.ok(!js.includes("esc(t.role)"), 'tier cards must not show the role line');
  assert.ok(!js.includes("'at ' + esc(t.tx)"), 'tier cards must not show the "at T" line');
  /* Gears: set badge + weapon/armor icons, ALT on its own row. */
  assert.ok(js.includes('assets/seticons/'), 'Gears must show the gear-set badge icon');
  assert.ok(js.includes("assets/gearui/'"), 'Gears must show weapon/armor icons');
  assert.ok(js.includes('hx-ms-row alt'), 'Gears ALT option must sit on its own row');
  assert.ok(js.includes('Chỉ số chính Vũ khí') && js.includes('Chỉ số chính Giáp'), 'main-stat labels must be Vietnamese');
});

test('gear-set badge and weapon/armor icons exist on disk', () => {
  const sets = ['Assassin', 'Avenger', 'Bounty', 'Gatekeeper', 'Guardian', 'Orchestrator', 'Paladin', 'Spellweaver', 'Vanguard'];
  for (const s of sets) {
    assert.ok(fs.existsSync(path.join(root, 'assets', 'seticons', s + '.webp')),
      `gear-set badge icon ${s}.webp is missing from assets/seticons`);
  }
  for (const f of ['weapon.webp', 'armor.webp']) {
    assert.ok(fs.existsSync(path.join(root, 'assets', 'gearui', f)),
      `gear icon ${f} is missing from assets/gearui`);
  }
});

test('quick-build popup keeps full tags, gear images and dedicated substat lines', () => {
  const js = read('hero-popup.js');
  assert.ok(js.includes('hx-modal-tags'), 'popup must show the hero classification tags');
  assert.ok(js.includes('assets/seticons/'), 'popup Gears must show the gear-set badge icon');
  assert.ok(js.includes("assets/gearui/'"), 'popup Gears must show weapon/armor icons');
  assert.ok(js.includes('hx-ms-row alt'), 'popup ALT option must sit on its own row');
  assert.ok(js.includes('Nên build:'), 'popup dedicated equipment must show which substat lines to build');
  assert.ok(js.includes('gear_notes'), 'popup must be able to show the translated build note');
});

test('Vietnamese translations, when merged, follow the _vi schema', () => {
  // Guards the merge (merge_vi.py): every _vi field present must match the
  // English structure it translates. Passes vacuously before the merge.
  for (const f of heroFiles) {
    const rec = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', f), 'utf8'));
    if (!rec.vi) continue;
    const v = rec.vi;
    if (v.overview_desc) assert.equal(typeof v.overview_desc, 'string', `${f} vi.overview_desc must be a string`);
    if (v.lore) assert.equal(typeof v.lore, 'string', `${f} vi.lore must be a string`);
    if (v.builds) {
      assert.equal(v.builds.length, rec.builds.length, `${f} vi.builds must match the English builds`);
    }
    if (v.skills) {
      for (const [key, sk] of Object.entries(v.skills)) {
        const [ver, skey] = key.split(':');
        const orig = (rec.skills[ver] || []).find(s => s.key === skey);
        assert.ok(orig, `${f} vi skill ${key} has no English original`);
        if (sk.effects) assert.equal(sk.effects.length, orig.effects.length, `${f} vi skill ${key} effects must match`);
        if (sk.tips) assert.equal(sk.tips.length, orig.tips.length, `${f} vi skill ${key} tips must match`);
        if (sk.enhancement) assert.equal(sk.enhancement.length, orig.enhancement.length, `${f} vi skill ${key} enhancement must match`);
        if (sk.tx) assert.equal(sk.tx.length, orig.tx.length, `${f} vi skill ${key} tx must match`);
      }
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
  // Regression (2026-11-02): the %-stat icons were first saved as
  // AllATK%25.webp (literal %25 in the filename), but browsers decode %25
  // in the img URL to %, so the server looked for AllATK%.webp and 404'd.
  // Renaming to a literal % did NOT fix it either: worker.js rejects '%'
  // in the URL path (regex ^[a-zA-Z0-9_./-]+$), so every %-stat icon must
  // live under a %-free name (AllATKpct.webp) and be referenced as such.
  const js = read('hero-detail.js');
  const m = js.match(/var STAT_ICONS = \{([^}]*)\}/);
  assert.ok(m, 'hero-detail.js must define STAT_ICONS');
  const names = [...m[1].matchAll(/'([^']+)'\s*:\s*'([^']+)'/g)].map(([, , v]) => v);
  assert.ok(names.length >= 20, `STAT_ICONS must list the substat icons (found ${names.length})`);
  for (const name of names) {
    assert.ok(!name.includes('%'), `substat icon ${name} must not contain % (worker.js rejects it in URLs)`);
    assert.ok(fs.existsSync(path.join(root, 'assets', 'substats', name)),
      `substat icon ${name} is missing from assets/substats`);
  }
  // Dedicated-equipment icons in the hero JSONs must follow the same rule.
  for (const f of heroFiles) {
    const rec = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', f), 'utf8'));
    if (!rec.dedicated) continue;
    for (const col of ['a', 'b']) {
      for (const x of rec.dedicated[col] || []) {
        if (!x.icon) continue;
        assert.ok(!x.icon.includes('%'), `${f} dedicated icon ${x.icon} must not contain %`);
        assert.ok(fs.existsSync(path.join(root, 'assets', 'substats', x.icon)),
          `${f} dedicated icon ${x.icon} is missing from assets/substats`);
      }
    }
  }
});
