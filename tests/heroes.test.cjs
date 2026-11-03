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
  assert.ok(!js.includes('window.scrollTo({ top: 0 })'), 'switching tabs must not scroll the page to the top');
  assert.ok(js.includes('window.scrollY') && js.includes('window.scrollTo(0, y)'),
    'switching tabs must preserve the current scroll position');
  assert.ok(js.includes('sessionStorage') && js.includes('hx-scroll:'),
    'scroll position must survive a page reload (saved per hero + tab)');
  /* Vietnamese headings (the small caps labels render in uppercase). */
  var jsLower = js.toLowerCase();
  for (const heading of ['Tổng quan hero', 'Xếp hạng theo chế độ', 'Ưu tiên nâng kỹ năng', 'Trang bị', 'Phụ kiện', 'Trang bị riêng', 'Cốt truyện', 'Chỉ số chính Vũ khí', 'Chỉ số chính Giáp', 'Ưu tiên dòng phụ']) {
    assert.ok(jsLower.includes(heading.toLowerCase()), `hero-detail.js must use the Vietnamese heading "${heading}"`);
  }
  /* Tier grades: mode image + bold grade only, no role / "at T" lines. */
  assert.ok(js.includes('hx-tier-grade'), 'detail page must render tier grades');
  assert.ok(!js.includes("esc(t.role)"), 'tier cards must not show the role line');
  assert.ok(!js.includes("'at ' + esc(t.tx)"), 'tier cards must not show the "at T" line');
  /* Gears: set badge + real piece art (like the popup), ALT on its own row,
   * no generic weapon/armor icons anymore. */
  assert.ok(js.includes('assets/seticons/'), 'Gears must show the gear-set badge icon');
  assert.ok(js.includes('assets/gearpieces/'), 'Gears must show the real weapon/armor piece art');
  assert.ok(!js.includes("assets/gearui/'"), 'Gears must no longer use the generic weapon/armor icons');
  assert.ok(js.includes('hx-ms-row alt'), 'Gears ALT option must sit on its own row');
  assert.ok(js.includes('Chỉ số chính Vũ khí') && js.includes('Chỉ số chính Giáp'), 'main-stat labels must be Vietnamese');
  /* Piece art is 110px — on narrow screens the 2-column grid must stack
   * to one column so nothing overflows horizontally. */
  const css = read('heroes.css');
  assert.ok(/@media \(max-width:640px\)\{[^}]*\.hx-mainstats\{grid-template-columns:1fr/.test(css),
    'main-stats grid must collapse to one column on mobile');
});

test('gear-set badge icons exist on disk', () => {
  const sets = ['Assassin', 'Avenger', 'Bounty', 'Gatekeeper', 'Guardian', 'Orchestrator', 'Paladin', 'Spellweaver', 'Vanguard'];
  for (const s of sets) {
    assert.ok(fs.existsSync(path.join(root, 'assets', 'seticons', s + '.webp')),
      `gear-set badge icon ${s}.webp is missing from assets/seticons`);
  }
});

test('quick-build popup: build tabs, gear images, accessories, bold dedicated lines', () => {
  const js = read('hero-popup.js');
  assert.ok(js.includes('hx-modal-tags'), 'popup must show the hero classification tags');
  assert.ok(js.includes('assets/seticons/'), 'popup Gears must show the gear-set badge icon');
  assert.ok(js.includes('assets/gearpieces/'), 'popup Gears must show the real weapon/armor piece art, not the generic icons');
  assert.ok(js.includes('hx-build-tabs'), 'popup must group all builds under Build 1 / Build 2 tabs (Atlas style)');
  assert.ok(js.includes('data-popup-build'), 'popup build tabs must switch the shown build');
  assert.ok(!js.includes('hx-ms-tag'), 'popup must not show Chính/Phụ main-stat rows (build tabs replace them)');
  assert.ok(js.includes("assets/acc/'"), 'popup must show the accessory rings (main + sub)');
  assert.ok(js.includes('hx-acc-pair'), 'popup accessories must render main + sub side by side');
  assert.ok(js.includes("hx-dedi-icon"), 'popup dedicated lines must show the stat icon from the data');
  assert.ok(!js.includes('Nên build:'), 'popup dedicated must not say "Nên build"');
  assert.ok(js.includes("assets/dedicated/'"), 'popup dedicated equipment must show its illustration image');
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

test('tabs are NOT sticky anymore, but tab switching still preserves scroll', () => {
  const css = read('heroes.css');
  const tabsRule = /\.hx-tabs\{[^}]*\}/.exec(css);
  assert.ok(tabsRule, 'heroes.css must define .hx-tabs');
  assert.ok(!/position:\s*sticky/.test(tabsRule[0]), 'the detail-page tab bar must NOT be sticky (user asked to remove it)');
  const js = read('hero-detail.js');
  assert.ok(js.includes('window.scrollY') && js.includes('sessionStorage'),
    'scroll preservation must stay even without sticky tabs');
});

test('skill target scopes translate to Vietnamese (TARGET_VI, all 66 Atlas strings)', () => {
  const js = read('hero-detail.js');
  assert.ok(js.includes("'All Enemies': 'Tất cả kẻ địch'"), 'All Enemies must translate to "Tất cả kẻ địch"');
  assert.ok(js.includes("'4 Enemies': '4 kẻ địch'"), '4 Enemies must translate to "4 kẻ địch"');
  assert.ok(js.includes("'Self': 'Bản thân'"), 'Self must translate to "Bản thân"');
  assert.ok(js.includes("'Single Enemy': '1 kẻ địch'"), 'Single Enemy must translate to "1 kẻ địch"');
  assert.ok(js.includes("'All Allies': 'Tất cả đồng minh'"), 'All Allies must translate to "Tất cả đồng minh"');
  const m = /var TARGET_VI = \{([\s\S]*?)\n  \};/.exec(js);
  assert.ok(m, 'TARGET_VI map must exist in hero-detail.js');
  const entries = (m[1].match(/': '/g) || []).length;
  assert.ok(entries >= 60, `TARGET_VI must cover the Atlas target strings (found ${entries})`);
  assert.ok(js.includes('targetVi(g.target)') && js.includes('targetVi(e.target)'),
    'skill targets and enhancement targets must go through targetVi()');
});

test('skill effects are explained in Vietnamese (FX_VI glossary + fx list)', () => {
  const js = read('hero-detail.js');
  assert.ok(js.includes('"Pierce": "Xuyên thủng"'), 'Pierce must translate to "Xuyên thủng"');
  assert.ok(js.includes('"Shock": "Sốc điện"'), 'Shock must translate to "Sốc điện"');
  const m = /var FX_VI = \{([\s\S]*?)\n  \};/.exec(js);
  assert.ok(m, 'FX_VI glossary must exist in hero-detail.js');
  const entries = (m[1].match(/": "/g) || []).length;
  assert.ok(entries >= 180, `FX_VI must cover the Atlas effect names (found ${entries})`);
  assert.ok(js.includes('hx-fxlist') && js.includes('Hiệu ứng'),
    'skill cards must render an "Hiệu ứng" explanation list');
  const css = read('heroes.css');
  assert.ok(css.includes('.hx-fxlist'), 'heroes.css must style the effect explanation list');
});

test('popup shows real gear piece art, "Set 4" and bold dedicated lines', () => {
  const js = read('hero-popup.js');
  assert.ok(js.includes('assets/gearpieces/'), 'popup must show the real gear piece art, not the generic icons');
  assert.ok(!js.includes("assets/gearui/"), 'popup must no longer use the generic weapon/armor icons');
  assert.ok(js.includes("replace('4pc', 'Set 4')"), 'popup must render "4pc" as "Set 4"');
  assert.ok(js.includes('hx-with-piece'), 'popup gear art must sit in its own large thumbnail layout');
  assert.ok(js.includes('class="hx-mainstats" style="grid-template-columns:1fr"'),
    'popup main-stats must force a single column inline (the stylesheet override alone did not take effect in the live browser)');
  assert.ok(js.includes("' × ' + c"), 'popup dedicated equipment must show the line count (e.g. "Crush +12% × 4")');
  assert.ok(js.includes("'<b>' + esc(label) + '</b>'"), 'popup dedicated stat name, value and line count must all be bold');
  const css = read('heroes.css');
  assert.ok(/\.hx-mainstat \.hx-piece\{[^}]*width:110px/.test(css),
    'popup gear art must be shown large (110px, near its native 126px), not icon-sized');
  assert.ok(/\.hx-modal-build \.hx-mainstat \.hx-piece\{[^}]*width:64px/.test(css),
    'popup gear art must be compact and uniform (64px) — the 110px size is for the detail page only');
  assert.ok(/\.hx-modal-build \.hx-mainstats\{[^}]*grid-template-columns:1fr/.test(css),
    'popup gear art must sit one item per row so the illustration has room');
  assert.ok(!/\.hx-mainstat small img\.hx-piece/.test(css),
    'popup gear art must not sit on the small dark icon chip anymore');
  // All 27 Raid gear piece images (9 sets x weapon-physical / weapon-magic / armor) on disk.
  const pieces = ['DG-Bounty', 'DG-Paladin', 'DG-Vanguard', 'NMW-Assassin', 'NMW-Gatekeeper', 'NMW-Guardian', 'ID-Avenger', 'ID-Orchestrator', 'ID-Spell'];
  for (const stem of pieces) {
    for (const v of [1, 2, 3]) {
      const f = `${stem}${v}.webp`;
      assert.ok(fs.existsSync(path.join(root, 'assets', 'gearpieces', f)), `gear piece ${f} is missing from assets/gearpieces`);
    }
  }
});

test('detail page also renders "Set 4", not "4pc" (consistent with the popup)', () => {
  const js = read('hero-detail.js');
  assert.ok(js.includes("replace('4pc', 'Set 4')"),
    'the detail-page Builds tab must render "Set 4" like the popup does');
});

test('skill bracket notes translate to Vietnamese and key values are bolded', () => {
  const js = read('hero-detail.js');
  assert.ok(js.includes('function richLine'), 'detail page must render skill lines through richLine');
  assert.ok(js.includes('NOTE_PATTERNS'), 'detail page must translate bracketed skill notes');
  assert.ok(js.includes("Duration: (\\d+) Turn\\(s\\)"), 'Duration notes must be translated');
  assert.ok(js.includes('Kéo dài: $1 lượt'), 'Duration must render as "Kéo dài: N lượt"');
  assert.ok(js.includes('1 lần trong trận'), 'Once per Battle must render as "1 lần trong trận"');
  assert.ok(js.includes('Tối đa $1 cộng dồn'), 'Max Stack notes must render as "Tối đa N cộng dồn"');
  assert.ok(js.includes('BOLD_TERMS') && js.includes('Physical Attack'), 'damage types must be bolded');
  assert.ok(js.includes("richLine(l)"), 'skill effect lines must use richLine');
  assert.ok(js.includes("richLine(tipByName[t.name], true)"), 'effect explanations must use richLine with noColor (no coloring there)');
});

test('builds tab accessories render horizontally (main + sub ring)', () => {
  const js = read('hero-detail.js');
  assert.ok(js.includes('hx-acc-pair'), 'each accessory option must render main + sub side by side');
  assert.ok(js.includes('NHẪN CHÍNH') && js.includes('NHẪN TINH LUYỆN'), 'accessory sides must be labelled in Vietnamese');
  assert.ok(js.includes("accLabelVi"), 'accessory option labels must be translated (Best -> Tốt nhất)');
  const css = read('heroes.css');
  assert.ok(/\.hx-acc-grid\{[^}]*flex-direction:column/.test(css),
    'accessory options must stack as full-width horizontal rows');
  assert.ok(css.includes('.hx-acc-pair'), 'heroes.css must style the horizontal accessory pair');
});

test('builds tab dedicated drops the A/B headings; pink frame marks the pick', () => {
  const js = read('hero-detail.js');
  assert.ok(!js.includes('Dòng phụ A'), 'dedicated must not show the "Dòng phụ A" heading');
  assert.ok(!js.includes('Dòng phụ B'), 'dedicated must not show the "Dòng phụ B" heading');
  assert.ok(!js.includes('— Build này'), 'dedicated must not show the "Build này" label');
  assert.ok(js.includes("hx-de-col' + (aOn ? ' this' : '')"), 'the pink frame must sit on the picked column (A when the pick is A)');
  assert.ok(js.includes("hx-de-col' + (bOn ? ' this' : '')"), 'the pink frame must sit on the picked column (B when the pick is B)');
  assert.ok(js.includes("'<b style=\"min-width:0\">' + esc(statLabel(n)) + '</b>'"), 'dedicated substat names must be bold');
});

test('build names translate to Vietnamese in the build list', () => {
  const js = read('hero-detail.js');
  assert.ok(js.includes('var BUILD_VI'), 'detail page must carry the build-name translations');
  const m = js.match(/var BUILD_VI = \{([\s\S]*?)\n  \};/);
  assert.ok(m, 'BUILD_VI must be an object literal');
  const entries = (m[1].match(/": "/g) || []).length;
  assert.ok(entries >= 200, `BUILD_VI must cover all 200 Atlas build names (found ${entries})`);
  assert.ok(js.includes('BUILD_VI[bb.name]'), 'build list must look up the Vietnamese name');
  assert.ok(js.includes("'Defensive Utility': 'Tiện Ích Phòng Thủ'") || js.includes('"Defensive Utility": "Tiện Ích Phòng Thủ"'),
    'BUILD_VI must translate "Defensive Utility" in Title Case');
});

test('popup actions are a fixed footer at the bottom of the card', () => {
  const js = read('hero-popup.js');
  assert.ok(js.includes('hx-modal-actions'), 'popup must render the actions element');
  assert.ok(js.includes("modal.querySelector('.hx-modal-actions').innerHTML = buildActions(currentHero)"),
    'popup actions must render into their own footer element, outside the scroll body');
  const css = read('heroes.css');
  assert.ok(/\.hx-modal-card\{[^}]*display:flex;flex-direction:column/.test(css),
    'modal card must be a flex column so the footer can sit at the bottom');
  assert.ok(/\.hx-modal-body\{[^}]*overflow-y:auto/.test(css),
    'modal body must scroll while the footer stays fixed');
  assert.ok(/\.hx-modal-actions\{[^}]*border-top:1px solid #e9e8e3/.test(css),
    'fixed footer must have a top border separating it from the scroll content');
});

test('dedicated lines align the icon snug to the left', () => {
  const css = read('heroes.css');
  assert.ok(/\.hx-de-col ul\{[^}]*padding-left:2px/.test(css),
    'dedicated list must not indent (icon sits at the column left edge)');
  const js = read('hero-detail.js');
  assert.ok(js.includes('gap:6px;align-items:center'), 'dedicated rows must use a small gap between icon and text');
  assert.ok(js.includes('white-space:nowrap;flex:none'), 'dedicated values must not wrap onto the next line');
});

test('skill effect coloring: bad effects red, good effects blue, explanation uncolored', () => {
  const js = read('hero-detail.js');
  assert.ok(js.includes('var FX_BAD'), 'hero-detail.js must define the bad-effects (red) list');
  assert.ok(js.includes('var FX_GOOD'), 'hero-detail.js must define the good-effects (blue) list');
  assert.ok(js.includes('VI_TO_EN'), 'hero-detail.js must map Vietnamese effect names back to English for coloring');
  assert.ok(js.includes("'Shock': 1") && js.includes("'Buff Removal': 1"), 'red list must include Shock and Buff Removal');
  assert.ok(js.includes("'Revive': 1") && js.includes("'Crit Damage Boost': 1"), 'blue list must include Revive and Crit Damage Boost');
  assert.ok(js.includes('function richLine(raw, noColor)'), 'richLine must accept a noColor flag');
  assert.ok(js.includes('richLine(tipByName[t.name], true)'), 'the effect-explanation section must call richLine with noColor');
  const css = read('heroes.css');
  assert.ok(/\.hx-fx-bad\{color:#c0392b\}/.test(css), 'bad effects must be red');
  assert.ok(/\.hx-fx-good\{color:#1a6fd4\}/.test(css), 'good effects must be blue');
});

test('skill target scopes render as a pill tag with a border', () => {
  const css = read('heroes.css');
  assert.ok(/\.hx-skill \.hx-skill-target\{[^}]*border:1px solid #b9cdf0/.test(css),
    'skill target scope must have a border (tag look)');
  assert.ok(/\.hx-skill \.hx-skill-target\{[^}]*border-radius:999px/.test(css),
    'skill target scope must be a pill tag');
});

test('skill conversion renders vertically (no horizontal Before/After grid)', () => {
  const js = read('hero-detail.js');
  assert.ok(!js.includes('grid-template-columns:1fr auto 1fr'), 'no horizontal conversion grid');
  assert.ok(js.includes('TRƯỚC') && js.includes('SAU'), 'Before/After labels must remain');
  assert.ok(js.includes('margin-top:12px'), 'SAU card must stack below TRƯỚC with spacing');
});
