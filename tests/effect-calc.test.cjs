const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..', 'public');
const calc = require(path.join(root, 'effect-calc.js'));

function loadData() {
  const src = fs.readFileSync(path.join(root, 'effect-calc-data.js'), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(src, sandbox);
  // JSON round-trip: normalise vm-realm objects into host-realm ones so
  // deepStrictEqual compares values, not prototypes.
  return JSON.parse(JSON.stringify(sandbox.window.EFFECT_CALC_DATA));
}

/* ---------- formula: worked examples from the Effect Hit article ---------- */
test('formula: base chance passes through untouched with no stats', () => {
  const r = calc.calcChance(65, 0, 0, 0, 0);
  assert.equal(r.pct, 65);
  assert.equal(r.effRes, 0);
});

test('formula: article example — base 70, Hit 10, Res 100 -> 7%', () => {
  const r = calc.calcChance(70, 10, 0, 100, 0);
  assert.equal(Math.round(r.pct), 7);
  assert.equal(r.effRes, 90);
});

test('formula: no float dust — Rudy 65% x (1 - 90%) is exactly 6.5, displayed 7', () => {
  // Regression: (1 - 0.9) is 0.09999999999999998 in binary, so the raw
  // product was 6.4999... and Math.round() showed 6 on the live page.
  const r = calc.calcChance(65, 10, 0, 100, 0);
  assert.equal(r.pct, 6.5);
  assert.equal(Math.round(r.pct), 7);
});

test('formula: article example + Spellweaver — base 70, Hit 45, Prob 10, Res 100 -> 34.65%', () => {
  const r = calc.calcChance(70, 45, 10, 100, 0);
  assert.ok(Math.abs(r.pct - 34.65) < 1e-9, `expected 34.65, got ${r.pct}`);
  assert.equal(Math.round(r.pct), 35);
});

test('formula: Hit >= Res restores the full base chance', () => {
  assert.equal(calc.calcChance(65, 120, 0, 100, 0).pct, 65);
  assert.equal(calc.calcChance(65, 100, 0, 100, 0).pct, 65);
});

test('formula: chance never exceeds 100% even with Probability', () => {
  assert.equal(calc.calcChance(100, 0, 32, 0, 0).pct, 100);
  assert.equal(calc.calcChance(90, 0, 50, 0, 0).pct, 100);
});

test('formula: chance can hit 0% — no minimum floor', () => {
  assert.equal(calc.calcChance(70, 0, 0, 200, 0).pct, 0);
});

test('formula: Effect Probability Reduction subtracts from Probability (additive)', () => {
  // Gelidus 26% reduction vs hero 10% Probability -> net -16%
  const r = calc.calcChance(50, 0, 10, 0, 26);
  assert.equal(r.netProb, -16);
  assert.equal(r.pct, 42);
});

test('formula: totals() — hero passive, pet and checkbox take the max, not the sum', () => {
  const data = loadData();
  const hero = data.heroes.find(h => h.id === 'spike'); // passive Hit Boost 34
  const state = {
    hero, pet: data.pets.find(p => p.id === 'nikki'), // +31 Hit
    condOn: {},
    checks: { hitBoost: true, resRed: false, probBoost: false, deathBoost: false, resBoost: false, probRed: false },
    sliders: { hit: 50, prob: 0, res: 0 }, skillKey: null, skillData: null,
  };
  const t = calc.totals(state, data);
  // Hit Boost: max(hero 34, checkbox 37 — team-wide max, Ace 64 is Self-only) = 37
  assert.equal(t.hitBoost, 37);
  // atkHit = slider 50 + pet 31 + boost 37 = 118
  assert.equal(t.atkHit, 118);
});

test('formula: totals() — Death boost only counts for Death skills (via caller)', () => {
  const data = loadData();
  // totals() itself exposes deathBoost; the UI adds it only when the skill
  // inflicts Death. Aquila passive Death Boost 25 vs checkbox 25 -> max 25.
  const hero = data.heroes.find(h => h.id === 'aquila');
  const state = {
    hero, pet: null, condOn: {},
    checks: { hitBoost: false, resRed: false, probBoost: false, deathBoost: true, resBoost: false, probRed: false },
    sliders: { hit: 0, prob: 0, res: 0 }, skillKey: null, skillData: null,
  };
  assert.equal(calc.totals(state, data).deathBoost, 25);
});

/* ---------- data integrity ---------- */
test('data: 125 heroes, 111 selectable, 14 greyed (no debuff skill)', () => {
  const data = loadData();
  assert.equal(data.heroes.length, 125);
  assert.equal(data.heroes.filter(h => h.hasDebuff).length, 111);
  assert.equal(data.heroes.filter(h => !h.hasDebuff).length, 14);
  for (const h of data.heroes.filter(x => !x.hasDebuff)) {
    assert.deepEqual(h.skills, {}, `${h.id} must have no debuff skills`);
  }
});

test('data: max bonus values are the TEAM-WIDE maxima (item 8 — self-only excluded)', () => {
  const data = loadData();
  // hitBoost 37 (Freyja/Tanjiro — Ace 64 is Self-only), resRed 37 (Knox
  // ultimate active — passive auras are 34), resBoost 37 (Clemyth S1 /
  // Eve awakened — Orkah 49 / Sung Jinwoo 49 are Self-only).
  assert.deepEqual(data.maxValues, {
    hitBoost: 37, resRed: 37, probBoost: 32,
    deathBoost: 25, resBoost: 37, probRed: 26,
  });
});

test('data: every debuff chance is max-enhanced (max >= base) and 1..100; passive entries flagged', () => {
  const data = loadData();
  for (const h of data.heroes) {
    for (const [key, s] of Object.entries(h.skills)) {
      // passive skills are pickable when they carry a debuff (item 6) —
      // they must be flagged so the UI can label them.
      if (key === 'passive') assert.equal(s.passive, true, `${h.id} passive entry must carry passive: true`);
      assert.ok(s.debuffs.length >= 1, `${h.id}/${key} must have a debuff`);
      for (const d of s.debuffs) {
        assert.ok(d.max >= d.base, `${h.id}/${key} ${d.effect}: max ${d.max} < base ${d.base}`);
        assert.ok(d.base >= 1 && d.base <= 100 && d.max >= 1 && d.max <= 100);
      }
    }
  }
});

test('data: known spot values — Rudy Stun 65, Kris Death 60, Spike Freeze split', () => {
  const data = loadData();
  const byId = Object.fromEntries(data.heroes.map(h => [h.id, h]));
  const rudyStun = byId.rudy.skills.s1.debuffs.find(d => d.effect === 'Stun');
  assert.equal(rudyStun.max, 65);
  const krisDeath = byId.kris.skills.s1.debuffs.filter(d => d.effect === 'Death');
  assert.deepEqual(krisDeath.map(d => d.max).sort((a, b) => b - a), [60, 30]);
  const spikeFreeze = byId.spike.skills.s1.debuffs.filter(d => d.effect === 'Freeze');
  assert.deepEqual(spikeFreeze.map(d => d.max).sort((a, b) => b - a), [100, 70]);
});

test('data: item 6 rescues — heroes previously greyed now selectable', () => {
  const data = loadData();
  const byId = Object.fromEntries(data.heroes.map(h => [h.id, h]));
  // Biscuit: ultimate Buff Removal 100 (guaranteed infliction)
  assert.equal(byId.biscuit.skills.ultimate.debuffs.find(d => d.effect === 'Buff Removal').max, 100);
  // Gelidus: basic Extreme Chill 45 -> 50 (enhanced)
  assert.equal(byId.gelidus.skills.basic.debuffs.find(d => d.effect === 'Extreme Chill').max, 50);
  // Omok passive: two always-on-ish debuffs, both 100
  assert.equal(byId.omok.skills.passive.debuffs.length, 2);
  // Randgrid passive: [Always Active] auras — cannot be resisted
  assert.ok(byId.randgrid.skills.passive.debuffs.every(d => d.always === true));
  // Dellons S1 merged across conversion forms: Silence 60 + Buff Removal 100
  const dellons = byId.dellons.skills.s1.debuffs.map(d => `${d.effect}:${d.max}`).sort();
  assert.deepEqual(dellons, ['Buff Removal:100', 'Silence:60']);
  // Feng Yan S1: Defense Reduction added at T2
  const fy = byId['feng-yan'].skills.s1.debuffs.find(d => d.effect === 'Defense Reduction');
  assert.equal(fy.tier, 'T2');
  // all 18 rescued heroes are selectable
  for (const id of ['biscuit', 'black-rose', 'clemyth', 'daisy', 'feng-yan', 'freyja', 'gelidus', 'guan-yu', 'karma', 'kyle', 'noho', 'orly', 'randgrid', 'reginleif', 'sieg', 'sunran', 'taka', 'omok']) {
    assert.ok(byId[id].hasDebuff, `${id} must be selectable after the item 6 audit`);
  }
});

test('data: hero auto-bonuses — 26 heroes, Ace 64 (T6), Freyja conditional, scaled 45', () => {
  const data = loadData();
  const withAuto = data.heroes.filter(h => h.auto);
  assert.equal(withAuto.length, 26);
  const byId = Object.fromEntries(data.heroes.map(h => [h.id, h]));
  assert.equal(byId.ace.auto.grants.hit.value, 64);
  assert.equal(byId.ace.auto.grants.hit.tier, 'T6');
  assert.equal(byId['cha-hae-in'].auto.grants.prob.value, 32);
  assert.equal(byId.aquila.auto.grants.death.value, 25);
  assert.equal(byId['shinobu-kocho'].auto.grants.resRed.value, 34);
  assert.equal(byId.freyja.auto.grants.hit.cond, 'team');
  assert.equal(byId.diaochan.auto.grants.hit.cond, 'scaled');
  assert.equal(byId.diaochan.auto.grants.hit.value, 45);
});

test('data: pets — only Kree, Merparrow, Nikki selectable (max-enhanced)', () => {
  const data = loadData();
  assert.equal(data.pets.length, 35);
  const sel = data.pets.filter(p => p.selectable);
  assert.deepEqual(sel.map(p => p.id), ['nikki', 'merparrow', 'kree']);
  const byId = Object.fromEntries(data.pets.map(p => [p.id, p]));
  assert.equal(byId.nikki.hit, 31);
  assert.equal(byId.merparrow.hit, 25);
  assert.equal(byId.merparrow.prob, 12);
  assert.equal(byId.kree.hit, 25);
  assert.equal(byId.pike.selectable, false);
  for (const p of sel) {
    assert.ok(fs.existsSync(path.join(root, p.icon)), `${p.id} portrait must exist locally`);
  }
});

test('data: 12 suggested heroes are all selectable', () => {
  const data = loadData();
  assert.equal(data.suggestedHeroes.length, 12);
  const byId = Object.fromEntries(data.heroes.map(h => [h.id, h]));
  for (const id of data.suggestedHeroes) assert.ok(byId[id].hasDebuff, `${id} must be selectable`);
});

/* ---------- page ---------- */
test('page: calculator page has slots, sliders, checkboxes, result panel and sticky bar', () => {
  const html = fs.readFileSync(path.join(root, 'xac-suat-hieu-ung.html'), 'utf8');
  assert.ok(html.includes('data-tag="TÍNH XÁC SUẤT HIỆU ỨNG"'), 'page must carry its implicit tag');
  for (const id of ['ec-hero-slot', 'ec-pet-slot', 'ec-skill-slot', 'ec-hero-bonus',
    'ec-hero-settings', 'ec-slider-hit', 'ec-slider-prob', 'ec-slider-res',
    'ec-num-hit', 'ec-num-prob', 'ec-num-res',
    'ec-sum-hit', 'ec-sum-prob', 'ec-sum-res', 'ec-sum-probred',
    'ec-skill-detail', 'ec-result', 'ec-result-bar', 'ec-result-bar-inner', 'ec-modal']) {
    assert.ok(html.includes(`id="${id}"`), `page must have #${id}`);
  }
  // items 1-3: intro, section descriptions, notes section and formula are gone
  assert.ok(!html.includes('ec-intro'), 'intro paragraph must be removed');
  assert.ok(!html.includes('ec-sec-desc'), 'section descriptions must be removed');
  assert.ok(!html.includes('ec-notes'), 'notes/formula section must be removed');
  assert.ok(!html.includes('ec-slider-hint'), 'slider hint must be removed');
  assert.ok(!html.includes('ec-hero-settings-hint'), 'hero settings hint must be removed');
  // item 8: checkbox labels carry the team-wide maxima
  assert.ok(html.includes('Effect Hit Rate Boost +37%'));
  assert.ok(html.includes('Effect Resist Reduction +37%'));
  assert.ok(html.includes('Effect Resist Boost +37%'));
  for (const k of ['hitBoost', 'resRed', 'probBoost', 'deathBoost', 'resBoost', 'probRed']) {
    assert.ok(html.includes(`data-check="${k}"`), `page must have the ${k} checkbox`);
  }
  assert.ok(html.includes('effect-calc-data.js'), 'page must load the data file');
  assert.ok(html.includes('effect-calc.js'), 'page must load the calculator script');
  assert.ok(html.includes('>TÍNH XÁC SUẤT HIỆU ỨNG</a>'), 'page nav must link to itself');
});

test('page: slider ranges match the spec (Hit 0-200, Prob 0-50, Res 0-200)', () => {
  const html = fs.readFileSync(path.join(root, 'xac-suat-hieu-ung.html'), 'utf8');
  assert.ok(html.includes('id="ec-slider-hit" min="0" max="200"'));
  assert.ok(html.includes('id="ec-slider-prob" min="0" max="50"'));
  assert.ok(html.includes('id="ec-slider-res" min="0" max="200"'));
});

test('page: hero portraits referenced by the picker exist for every hero', () => {
  const data = loadData();
  for (const h of data.heroes) {
    assert.ok(fs.existsSync(path.join(root, 'assets', `hero-${h.id}.webp`)), `missing portrait hero-${h.id}.webp`);
  }
});

test('script: no formula line in results; sticky bar + locked auto rows present', () => {
  const js = fs.readFileSync(path.join(root, 'effect-calc.js'), 'utf8');
  assert.ok(!js.includes('ec-result-formula'), 'formula line must be removed from results (item 3)');
  assert.ok(js.includes('ec-result-bar'), 'sticky result bar must be wired (item 5)');
  assert.ok(js.includes('IntersectionObserver'), 'bar visibility must track the result panel');
  assert.ok(js.includes('ec-locked'), 'hero auto-bonus rows must be locked (item 7)');
  assert.ok(js.includes('Luôn áp dụng'), 'always-active debuffs must show the tag');
  assert.ok(js.includes('lockScroll'), 'picker must lock page scroll (item 4)');
  assert.ok(!js.includes('ec-hero-settings-hint'), 'dead hint reference must be removed');
});

test('css: modal is 30% smaller and clears the sticky header', () => {
  const css = fs.readFileSync(path.join(root, 'effect-calc.css'), 'utf8');
  assert.ok(css.includes('max-width: 448px'), 'modal panel must be 448px (640 x 0.7)');
  assert.ok(css.includes('padding: 132px 12px 24px'), 'modal top padding must clear the header');
  assert.ok(css.includes('.ec-result-bar'), 'sticky bar styles must exist');
  assert.ok(!css.includes('.ec-intro'), 'dead intro rule must be removed');
  assert.ok(!css.includes('.ec-sec-desc'), 'dead section-desc rule must be removed');
});
