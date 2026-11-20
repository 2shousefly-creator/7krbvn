const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..', 'public');

const EXPECTED_MODES = [
  'power-up-dungeon', 'power-up-dungeon-roles', 'raid', 'sudden-raid',
  'castle-rush', 'advent-expedition', 'adventure-infinite-tower', 'farming',
  'arena', 'total-war', 'guild-war',
];
const PVE_MODES = EXPECTED_MODES.slice(0, 8);
const PVP_MODES = ['arena', 'total-war', 'guild-war'];
/* Modes with no counterpart in hero JSON `tiers` — skipped in reconciliation. */
const SKIP_RECONCILE = new Set(['power-up-dungeon', 'adventure-infinite-tower']);
const TIER_KEYS = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D'];

const index = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes-index.json'), 'utf8'));
const indexById = new Map(index.map(h => [h.id, h]));
const heroTiers = new Map(); /* hero_id -> Map(mode -> {tier, tx}) */
for (const f of fs.readdirSync(path.join(root, 'data', 'heroes')).filter(x => x.endsWith('.json'))) {
  const h = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', f), 'utf8'));
  heroTiers.set(h.id, new Map((h.tiers || []).map(t => [t.mode, { tier: t.tier, tx: t.tx }])));
}

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

const dataSrc = read('tier-list-data.js');
/* JSON round-trip: vm arrays come from another realm and fail deepStrictEqual. */
const DATA = JSON.parse(JSON.stringify(vm.runInNewContext(dataSrc + ';TIER_LIST_DATA;', {})));

test('tier-list-data.js: exactly the 11 local modes (8 PvE + 3 PvP), no General', () => {
  assert.deepEqual(DATA.order, EXPECTED_MODES, 'mode order must be the 11 local modes');
  assert.deepEqual(Object.keys(DATA.modes).sort(), [...EXPECTED_MODES].sort());
  assert.ok(!DATA.modes.general, 'there is no General mode in local data — none may be invented');
  assert.equal(DATA.default_mode, 'arena', 'default mode must be Arena');
  for (const m of PVE_MODES) assert.equal(DATA.modes[m].group, 'pve', `${m} must be PvE`);
  for (const m of PVP_MODES) assert.equal(DATA.modes[m].group, 'pvp', `${m} must be PvP`);
  for (const m of EXPECTED_MODES) {
    const mode = DATA.modes[m];
    assert.ok(mode.last_edit, `${m} needs a last_edit date`);
    assert.ok(mode.entries.length > 0, `${m} needs entries`);
    assert.ok(mode.categories.length > 0, `${m} needs categories`);
    assert.ok(Array.isArray(mode.changelog), `${m} needs a changelog array`);
  }
});

test('every tierlist entry names a real hero with a real portrait and a valid tier', () => {
  for (const m of EXPECTED_MODES) {
    const mode = DATA.modes[m];
    const catKeys = new Set(mode.categories.map(c => c.key));
    const tierKeys = new Set(mode.tiers.map(t => t.key));
    for (const e of mode.entries) {
      const hero = indexById.get(e.hero_id);
      assert.ok(hero, `${m}: ${e.hero_id} is not in heroes-index.json`);
      assert.ok(catKeys.has(e.category), `${m}: ${e.hero_id} has unknown category ${e.category}`);
      assert.ok(tierKeys.has(e.tier), `${m}: ${e.hero_id} has unknown tier ${e.tier}`);
      if (e.tier === 'NOT USED') {
        assert.ok(PVP_MODES.includes(m), `${m} is PvE and must not have a NOT USED tier`);
      } else {
        assert.ok(TIER_KEYS.includes(e.tier), `${m}: ${e.hero_id} tier ${e.tier} is not SSS-D`);
      }
      assert.ok(fs.existsSync(path.join(root, hero.portrait)),
        `${m}: portrait missing for ${e.hero_id} (${hero.portrait})`);
      assert.ok(fs.statSync(path.join(root, hero.portrait)).size > 1000,
        `${m}: portrait for ${e.hero_id} must be a real image`);
    }
  }
});

test('PHẾ row (NOT USED) exists for PvP modes and never for PvE modes', () => {
  for (const m of PVP_MODES) {
    assert.ok(DATA.modes[m].entries.some(e => e.tier === 'NOT USED'),
      `${m} must keep a NOT USED tier row`);
  }
  for (const m of PVE_MODES) {
    assert.ok(!DATA.modes[m].entries.some(e => e.tier === 'NOT USED'),
      `${m} must not have a NOT USED tier row`);
  }
});

test('tierlist data reconciles with hero JSON tiers (both directions)', () => {
  for (const m of EXPECTED_MODES) {
    if (SKIP_RECONCILE.has(m)) continue;
    const listed = new Set(DATA.modes[m].entries.map(e => `${e.hero_id}|${e.tier}|${e.tx}`));
    for (const e of DATA.modes[m].entries) {
      const jt = heroTiers.get(e.hero_id).get(m);
      assert.ok(jt, `${m}: ${e.hero_id} is in the tierlist but has no hero-JSON tier`);
    }
    for (const [heroId, byMode] of heroTiers) {
      const jt = byMode.get(m);
      if (!jt) continue;
      assert.ok(listed.has(`${heroId}|${jt.tier}|${jt.tx}`),
        `${m}: ${heroId} hero JSON ${jt.tier}/${jt.tx} has no matching tierlist entry`);
    }
  }
});

test('Rachel Advent Expedition exception is preserved (tierlist SS wins)', () => {
  const entries = DATA.modes['advent-expedition'].entries.filter(e => e.hero_id === 'rachel');
  assert.ok(entries.some(e => e.category === 'BUFFERS_DEBUFFERS' && e.tier === 'SS'),
    'Rachel must stay SS in the Advent Expedition Buffers group (18/11 decision)');
  assert.ok(entries.some(e => e.category === 'TRIPLE_TARGET' && e.tier === 'S'),
    'Rachel must stay S as a 3-Target DPS in Advent Expedition (matches hero JSON)');
});

test('tier-list.html: mode tabs, sub-tabs, filters, search, counter, layout toggle', () => {
  const html = read('tier-list.html');
  for (const m of EXPECTED_MODES) {
    assert.ok(html.includes(`href="tier-list.html?mode=${m}" data-mode="${m}"`),
      `tier-list.html needs a mode tab for ${m}`);
  }
  assert.ok(html.includes('id="tl-subtabs"'), 'Power Up Dungeon needs its two sub-tabs');
  assert.ok(html.includes('data-mode="power-up-dungeon-roles"'),
    'the roles sub-tab must select power-up-dungeon-roles');
  assert.ok(html.includes('id="tl-search"'), 'tier-list.html needs a search input');
  assert.ok(html.includes('id="tl-count"'), 'tier-list.html needs the Hiển thị X / Y counter');
  for (const r of ['L++', 'L+', 'L', 'R']) {
    assert.ok(html.includes(`data-rarity="${r}"`), `tier-list.html needs a rarity filter for ${r}`);
  }
  assert.ok(html.includes('id="tl-role-wrap"'), 'tier-list.html needs the role filter (PvE only)');
  assert.ok(html.includes('id="tl-layout-columns"'), 'tier-list.html needs the Columns layout button');
  assert.ok(html.includes('id="tl-layout-compact"'), 'tier-list.html needs the Compact layout button');
  assert.ok(html.includes('id="tl-mode-title"'), 'tier-list.html needs the mode title');
  assert.ok(html.includes('id="tl-updated"'), 'tier-list.html needs the per-mode last-update line');
  assert.ok(html.includes('id="tl-changelog"'), 'tier-list.html needs the changelog section');
  assert.ok(html.includes('Thay đổi gần đây'), 'the changelog must be labelled "Thay đổi gần đây"');
  assert.ok(html.includes('href="tu-dien-hieu-ung.html"'), 'tier-list.html must link the glossary page');
  assert.ok(html.includes('href="tier-list.css"'), 'tier-list.html must load tier-list.css');
  assert.ok(html.includes('src="tier-list-data.js"'), 'tier-list.html must load tier-list-data.js');
  assert.ok(html.includes('src="tier-list.js"'), 'tier-list.html must load tier-list.js');
  assert.ok(html.includes('src="hero-popup.js"'), 'tier-list.html must load the popup script');
  assert.ok(html.includes('src="guide.js"'), 'tier-list.html must load guide.js');
  assert.ok(html.includes('id="image-dialog"'), 'tier-list.html needs the image dialog');
  assert.ok(html.includes('class="back-to-top"'), 'tier-list.html needs a back-to-top button');
  assert.ok(!html.includes('NOT USED'), 'the page must show PHẾ, never the raw NOT USED label');
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'tier-list.html has duplicate ids');
});

test('tier-list.html carries the standard navigation with exactly one active item', () => {
  const html = read('tier-list.html');
  for (const target of ['index.html', 'newbie.html', 'cap-nhat.html', 'cot-truyen.html',
    'castle-rush.html', 'advent-expedition.html', 'raid.html', 'dungeon.html',
    'celestial-tower.html', 'tower-of-trials.html', 'arena.html', 'total-war.html',
    'guild-war-team.html', 'heroes.html', 'tier-list.html', 'tu-dien-hieu-ung.html',
    'so-sanh.html', 'tinh-ruby.html', 'doi-coupon.html']) {
    assert.ok(html.includes(`href="${target}"`), `tier-list.html is missing nav link ${target}`);
  }
  assert.ok(html.includes('data-parent="PVE"'), 'tier-list.html is missing the PVE dropdown');
  assert.ok(html.includes('data-parent="PVP"'), 'tier-list.html is missing the PVP dropdown');
  assert.ok(html.includes('data-parent="TRA CỨU"'), 'tier-list.html is missing the TRA CỨU dropdown');
  assert.ok(html.includes('class="nav-active" href="tier-list.html"'),
    'tier-list.html must highlight itself in the nav');
  assert.equal((html.match(/class="(?:snav-active|nav-active)" href="/g) || []).length, 1,
    'tier-list.html must have exactly one active nav item');
});

test('tier-list.js: diacritic-insensitive search, PHẾ label, portrait+name cards, popup wiring', () => {
  const js = read('tier-list.js');
  assert.ok(js.includes("normalize('NFD')"), 'search must use String.normalize(NFD)');
  assert.ok(js.includes('\\u0300'), 'search must strip combining marks');
  assert.ok(js.includes("'NOT USED': 'PHẾ'") || js.includes('"NOT USED": "PHẾ"'),
    'the NOT USED data key must display as PHẾ');
  const card = js.slice(js.indexOf('function cardHtml'), js.indexOf('function renderRows'));
  assert.ok(card.includes('data-hero-popup'), 'hero card must open the popup via data-hero-popup');
  assert.ok(card.includes('portrait'), 'hero card must show the portrait');
  assert.ok(!card.includes('hx-badge') && !card.includes('rarity'),
    'hero card must not show a rarity badge (portrait + name only)');
  assert.ok(!card.includes('tx'), 'hero card must not show a Transcendence badge');
  assert.ok(js.includes('window.HeroPopup.open'), 'keyboard activation must open the popup');
  assert.ok(js.includes("history.replaceState"), 'mode switching must update the ?mode= URL');
  assert.ok(js.includes("'Hiển thị '"), 'the counter must use the Vietnamese "Hiển thị" wording');
  assert.ok(js.includes("'Cập nhật lần cuối: '"), 'the last-update line must read "Cập nhật lần cuối:"');
  assert.ok(js.includes('tl-compact'), 'tier-list.js must toggle the Compact layout class');
  assert.ok(js.includes('PHẾ nghĩa là hero không có đóng góp đáng kể'),
    'the PvP PHẾ note must explain what PHẾ means');
});

test('tier-list.css styles the rows, cards and compact layout', () => {
  const css = read('tier-list.css');
  assert.ok(css.includes('.tl-row'), 'tier-list.css must style tier rows');
  assert.ok(css.includes('.tl-tier-label'), 'tier-list.css must style the tier label column');
  assert.ok(css.includes('.tl-card'), 'tier-list.css must style hero cards');
  assert.ok(css.includes('.tl-compact'), 'tier-list.css must style the compact layout');
  assert.ok(css.includes('.tl-mode-btn'), 'tier-list.css must style mode buttons');
});

test('no new tier-list file mentions Atlas', () => {
  for (const f of ['tier-list.html', 'tier-list.css', 'tier-list.js', 'tier-list-data.js']) {
    assert.ok(!read(f).includes('Atlas'), `${f} must not mention Atlas`);
  }
});
