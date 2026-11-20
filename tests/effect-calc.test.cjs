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
  // Hit Boost: max(hero 34, checkbox 64) = 64 — NOT 98
  assert.equal(t.hitBoost, 64);
  // atkHit = slider 50 + pet 31 + boost 64 = 145
  assert.equal(t.atkHit, 145);
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
test('data: 125 heroes, 93 selectable, 32 greyed (no debuff skill)', () => {
  const data = loadData();
  assert.equal(data.heroes.length, 125);
  assert.equal(data.heroes.filter(h => h.hasDebuff).length, 93);
  assert.equal(data.heroes.filter(h => !h.hasDebuff).length, 32);
  for (const h of data.heroes.filter(x => !x.hasDebuff)) {
    assert.deepEqual(h.skills, {}, `${h.id} must have no debuff skills`);
  }
});

test('data: max bonus values match the researched in-game maxima (enhanced)', () => {
  const data = loadData();
  assert.deepEqual(data.maxValues, {
    hitBoost: 64, resRed: 34, probBoost: 32,
    deathBoost: 25, resBoost: 49, probRed: 26,
  });
});

test('data: every debuff chance is max-enhanced (max >= base) and 1..100', () => {
  const data = loadData();
  for (const h of data.heroes) {
    for (const [key, s] of Object.entries(h.skills)) {
      assert.notEqual(key, 'passive', `${h.id} must not list the passive as a usable skill`);
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
test('page: calculator page has slots, sliders, checkboxes and result panel', () => {
  const html = fs.readFileSync(path.join(root, 'xac-suat-hieu-ung.html'), 'utf8');
  assert.ok(html.includes('data-tag="TÍNH XÁC SUẤT HIỆU ỨNG"'), 'page must carry its implicit tag');
  for (const id of ['ec-hero-slot', 'ec-pet-slot', 'ec-skill-slot', 'ec-hero-bonus',
    'ec-hero-settings', 'ec-slider-hit', 'ec-slider-prob', 'ec-slider-res',
    'ec-num-hit', 'ec-num-prob', 'ec-num-res',
    'ec-sum-hit', 'ec-sum-prob', 'ec-sum-res', 'ec-sum-probred',
    'ec-skill-detail', 'ec-result', 'ec-modal']) {
    assert.ok(html.includes(`id="${id}"`), `page must have #${id}`);
  }
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
