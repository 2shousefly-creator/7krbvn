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

test('tier-list.html: mode tabs, sub-tabs, filters, search, counter (compact only, no layout toggle)', () => {
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
  assert.ok(html.includes('id="tl-role-wrap"'), 'tier-list.html needs the role filter (all modes)');
  assert.ok(!html.includes('id="tl-layout-columns"'), 'the Columns layout button must be gone');
  assert.ok(!html.includes('id="tl-layout-compact"'), 'the Compact layout button must be gone');
  assert.ok(html.includes('class="tl-rows tl-compact"'),
    'the rows container must always carry the compact class');
  assert.ok(!html.includes('Tướng nào mạnh nhất ở từng chế độ?'),
    'the description paragraph under the Tier List title must be gone');
  assert.ok(html.includes('11 chế độ'), 'the hero meta line (11 chế độ) must stay');
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
  assert.ok(html.includes('data-parent="CÔNG CỤ"'), 'tier-list.html is missing the CÔNG CỤ dropdown');
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
  /* cardHtml ends right before the PvP sort helper now — extract just
   * the function body instead of slicing up to renderRows. */
  const cardFn = /function cardHtml\(hero\) \{[\s\S]*?\n  \}/.exec(js);
  assert.ok(cardFn, 'cardHtml must exist in tier-list.js');
  const card = cardFn[0];
  assert.ok(card.includes('data-hero-popup'), 'hero card must open the popup via data-hero-popup');
  assert.ok(card.includes('portrait'), 'hero card must show the portrait');
  assert.ok(!card.includes('hx-badge') && !card.includes('rarity'),
    'hero card must not show a rarity badge (portrait + name only)');
  assert.ok(!card.includes('tx'), 'hero card must not show a Transcendence badge');
  assert.ok(js.includes('window.HeroPopup.open'), 'keyboard activation must open the popup');
  assert.ok(js.includes("history.replaceState"), 'mode switching must update the ?mode= URL');
  assert.ok(js.includes("'Hiển thị '"), 'the counter must use the Vietnamese "Hiển thị" wording');
  assert.ok(js.includes("'Cập nhật lần cuối: '"), 'the last-update line must read "Cập nhật lần cuối:"');
  assert.ok(!js.includes('tl-layout-columns') && !js.includes('tl-layout-compact'),
    'tier-list.js must not reference the removed layout toggle buttons');
  assert.ok(!js.includes('state.layout'),
    'tier-list.js must not keep a layout state (compact is the only layout)');
  assert.ok(js.includes('RARITY_RANK') && js.includes('byRarityThenName'),
    'tier-list.js must sort merged PvP heroes by rarity then name');
  assert.ok(js.includes("mode.group === 'pvp'"),
    'tier-list.js must treat PvP modes differently in renderRows');
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
  assert.ok(!css.includes('.tl-layout'), 'tier-list.css must not keep the removed toggle styles');
});

test('role filter works in EVERY mode (regression 20/11: PvP buttons were visible but dead)', () => {
  const js = read('tier-list.js');
  const css = read('tier-list.css');
  /* The root cause was CSS: .tl-filter{display:flex} overrode the hidden
   * attribute, so the role filter stayed visible in PvP while matches()
   * ignored the role there. Both halves must be fixed. */
  assert.ok(css.includes('[hidden]') && css.includes('display:none'),
    'tier-list.css must let [hidden] win over author display rules');
  assert.ok(!js.includes("mode.group === 'pve'"),
    'tier-list.js must not gate the role filter on PvE modes');
  assert.ok(js.includes('state.role[hero.type.toUpperCase()]'),
    'the role filter must compare against the hero type');
  /* Data support: in every mode, each role narrows the list (n < total),
   * so clicking a role always visibly filters. n may be 0 for a role a
   * mode has no hero of (e.g. no Defense in Sudden Raid / Farming) —
   * that shows the empty state + counter 0/N, which is still filtering. */
  for (const m of EXPECTED_MODES) {
    const total = DATA.modes[m].entries.length;
    for (const role of ['ATTACK', 'MAGIC', 'DEFENSE', 'SUPPORT', 'UNIVERSAL']) {
      const n = DATA.modes[m].entries.filter(e => {
        const h = indexById.get(e.hero_id);
        return h && h.type.toUpperCase() === role;
      }).length;
      assert.ok(n < total,
        `${m}: role ${role} must narrow the list (got ${n}/${total})`);
    }
  }
});

/* ---- Live render harness: run the real tier-list.js in a vm with a
 * minimal DOM stub, then inspect the rendered rows HTML. This is the
 * only way to verify merged PvP order and single-group-per-tier. ---- */

function stubEl() {
  return {
    innerHTML: '', textContent: '', hidden: false, value: '',
    _attrs: {},
    setAttribute(k, v) { this._attrs[k] = String(v); },
    getAttribute(k) { return this._attrs[k]; },
    _handlers: {},
    addEventListener(type, fn) {
      (this._handlers[type] = this._handlers[type] || []).push(fn);
    },
  };
}

function stubButton(attrs) {
  const el = stubEl();
  el._attrs = { ...attrs };
  el.click = function () {
    (el._handlers.click || []).forEach(fn => fn.call(el));
  };
  return el;
}

async function renderTierList(search) {
  const els = {};
  for (const id of ['tl-rows', 'tl-count', 'tl-mode-title', 'tl-updated',
    'tl-subtabs', 'tl-search', 'tl-clear', 'tl-changelog-body']) {
    els[id] = stubEl();
  }
  const modeBtns = EXPECTED_MODES.map(m => stubButton({ 'data-mode': m }));
  const rarityBtns = ['L++', 'L+', 'L', 'R'].map(r => stubButton({ 'data-rarity': r }));
  const roleBtns = {};
  for (const r of ['ATTACK', 'MAGIC', 'DEFENSE', 'SUPPORT', 'UNIVERSAL']) {
    roleBtns[r] = stubButton({ 'data-role': r });
  }
  const documentStub = {
    title: '',
    getElementById(id) { return els[id] || null; },
    querySelectorAll(sel) {
      if (sel === '.tl-mode-btn[data-mode]') return modeBtns;
      if (sel === '#tl-rarity [data-rarity]') return rarityBtns;
      if (sel === '#tl-role [data-role]') return Object.values(roleBtns);
      return [];
    },
  };
  const sandbox = {
    document: documentStub,
    window: { location: { search } },
    fetch: () => Promise.resolve({ json: () => Promise.resolve(index) }),
    TIER_LIST_DATA: DATA,
    URLSearchParams,
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(read('tier-list-data.js'), sandbox);
  vm.runInContext(read('tier-list.js'), sandbox);
  /* Flush the fetch promise chain (fetch -> json -> renderAll). */
  await new Promise(r => setTimeout(r, 25));
  return { els, roleBtns, rarityBtns, modeBtns };
}

/* Split rendered rows HTML into per-tier sections with label, card ids,
 * group count and sub-headings. */
function tierSections(rowsHtml) {
  return rowsHtml.split('<section class="tl-row">').slice(1).map(sec => {
    const label = /tl-tier-label[^>]*>([^<]+)</.exec(sec);
    const cards = [...sec.matchAll(/data-hero-popup="([^"]+)"/g)].map(m => m[1]);
    const groups = (sec.match(/<div class="tl-group">/g) || []).length;
    const headings = [...sec.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m => m[1]);
    return { tier: label ? label[1] : null, cards, groups, headings };
  });
}

test('PvP rows render merged: one group per tier, sorted rarity-then-name (live render)', async () => {
  const { els } = await renderTierList('?mode=arena');
  assert.equal(els['tl-count'].textContent, 'Hiển thị 88 / 88 hero');
  const sections = tierSections(els['tl-rows'].innerHTML);
  assert.ok(sections.length > 0, 'arena must render tier rows');
  assert.ok(sections.some(s => s.tier === 'PHẾ'), 'arena must keep the PHẾ row');
  const RANK = { 'L++': 0, 'L+': 1, 'L': 2, 'R': 3 };
  for (const s of sections) {
    assert.equal(s.groups, 1, `arena tier ${s.tier} must have exactly one merged group, got ${s.groups}`);
    assert.equal(s.headings.length, 0, `arena tier ${s.tier} must not have role sub-headings`);
    const heroes = s.cards.map(id => indexById.get(id));
    for (let i = 1; i < heroes.length; i++) {
      const prev = heroes[i - 1], cur = heroes[i];
      const r = RANK[prev.rarity] - RANK[cur.rarity];
      assert.ok(r < 0 || (r === 0 && prev.name.toLowerCase() <= cur.name.toLowerCase()),
        `arena tier ${s.tier}: ${prev.name}[${prev.rarity}] must come before ${cur.name}[${cur.rarity}]`);
    }
  }
  const sss = sections.find(s => s.tier === 'SSS');
  assert.deepEqual(sss.cards, ['aris', 'eileene', 'hayeon', 'judas', 'rudy', 'sunran', 'yoongun'],
    'arena SSS row must list the 7 L+ heroes alphabetically');
  const ss = sections.find(s => s.tier === 'SS');
  assert.equal(ss.cards[0], 'gelidus', 'arena SS row must start with the only L++ hero, Gelidus');
  assert.deepEqual(ss.cards.slice(1),
    ['clemyth', 'dongyoung', 'eve', 'giyu-tomioka', 'omok', 'radgrid', 'shinobu-kocho', 'tanjiro-kamado'],
    'arena SS row must continue with the L+ heroes alphabetically');
});

test('role filter still narrows the merged PvP rows (live render)', async () => {
  const { els, roleBtns } = await renderTierList('?mode=arena');
  roleBtns.ATTACK.click();
  assert.equal(els['tl-count'].textContent, 'Hiển thị 26 / 88 hero');
  const cards = [...els['tl-rows'].innerHTML.matchAll(/data-hero-popup="([^"]+)"/g)].map(m => m[1]);
  assert.equal(cards.length, 26, 'ATTACK filter must leave 26 cards in arena');
  assert.ok(cards.every(id => indexById.get(id).type === 'Attack'),
    'every remaining card must be an Attack hero');
  assert.equal(roleBtns.ATTACK.getAttribute('aria-pressed'), 'true',
    'the ATTACK button must show as pressed after clicking');
  const sections = tierSections(els['tl-rows'].innerHTML);
  assert.ok(sections.every(s => s.groups === 1 && s.headings.length === 0),
    'filtered PvP rows must stay merged with no role headings');
  /* Toggling the same role off restores the full list. */
  roleBtns.ATTACK.click();
  assert.equal(els['tl-count'].textContent, 'Hiển thị 88 / 88 hero');
});

test('PvE rows keep their per-category groups (live render)', async () => {
  const { els } = await renderTierList('?mode=raid');
  assert.equal(els['tl-count'].textContent, 'Hiển thị 42 / 42 hero');
  const sections = tierSections(els['tl-rows'].innerHTML);
  assert.ok(sections.length > 0, 'raid must render tier rows');
  assert.ok(els['tl-rows'].innerHTML.includes('<h3>Gây sát thương</h3>'),
    'raid must keep its category group headings');
  assert.ok(sections.some(s => s.groups > 1),
    'at least one raid tier must keep multiple category groups');
});

test('no new tier-list file mentions Atlas', () => {
  for (const f of ['tier-list.html', 'tier-list.css', 'tier-list.js', 'tier-list-data.js']) {
    assert.ok(!read(f).includes('Atlas'), `${f} must not mention Atlas`);
  }
});

test('tier list page has a representative banner like the other listing pages', () => {
  const html = read('tier-list.html');
  assert.ok(html.includes('<section class="blog-intro"'),
    'tier-list.html must open with a blog-intro banner');
  assert.ok(html.includes('SEVEN KNIGHTS RE:BIRTH · TIER LIST'),
    'tier list banner must carry the TIER LIST kicker');
  assert.ok(html.includes('<h1 id="hero-title">Tier List</h1>'),
    'tier list banner must keep the Tier List title');
  assert.ok(html.includes('11 chế độ'),
    'tier list banner must keep the 11-mode scope in its lead');
  assert.ok(html.includes('assets/hero-eve.webp'), 'tier list banner must show Eve');
  assert.ok(html.includes('assets/hero-judas.webp'), 'tier list banner must show Judas');
  assert.ok(!html.includes('class="hero"'), 'tier-list.html must not keep the old imageless hero header');
  assert.ok(!html.includes('class="hero-meta"'), 'tier-list.html must not keep the old hero-meta row');
});
