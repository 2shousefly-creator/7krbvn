const test = require('node:test');
const assert = require('node:assert/strict');
const calc = require('../public/calculator-core-v3.js');

test('all current Ruby Farming Stages estimate Lv.1 to Lv.30 with the selected EXP bonus', () => {
  for (let stage = 1; stage <= 9; stage++) {
    assert.deepEqual(calc.farmingEstimate(stage, false), { expPerRound: 1200, rounds: 11 });
    assert.deepEqual(calc.farmingEstimate(stage, true), { expPerRound: 1320, rounds: 10 });
  }
});

test('the round estimate uses EXP for the selected Stage', () => {
  const stage = calc.STAGES[4];
  const original = stage.expPerRound;
  try {
    stage.expPerRound = 2500;
    assert.deepEqual(calc.farmingEstimate(5, false), { expPerRound: 2500, rounds: 5 });
    assert.deepEqual(calc.farmingEstimate(1, false), { expPerRound: 1200, rounds: 11 });
  } finally {
    stage.expPerRound = original;
  }
});

test('Key Bundle price ladder and an earlier purchase are calculated correctly', () => {
  assert.equal(calc.costThrough(20), 1000);
  assert.equal(calc.costThrough(70), 5000);
  assert.equal(calc.costThrough(120), 10000);
  assert.equal(calc.costThrough(170), 16000);
  assert.equal(calc.costThrough(1169), 165850);
  assert.deepEqual(calc.purchase(19, 3), { previous: 19, count: 3, ending: 22, keys: 180, cost: 210, nextPrice: 80 });
  assert.deepEqual(calc.purchase(1168, 5), { previous: 1168, count: 1, ending: 1169, keys: 60, cost: 150, nextPrice: null });
});

test('the 70-bundle example distinguishes F2P and Daily Ruby Support', () => {
  const bundle = calc.purchase(0, 70);
  const base = { stage: 1, slots: 4, keys: bundle.keys, fodderLimit: null };
  const f2p = calc.simulate({ ...base, roundsPerCycle: 11 });
  const support = calc.simulate({ ...base, roundsPerCycle: 10 });
  assert.equal(f2p.heroes, 252);
  assert.equal(f2p.grossRuby - bundle.cost, 40);
  assert.equal(support.heroes, 280);
  assert.equal(support.grossRuby - bundle.cost, 600);
});

test('Stage 4 uses 12 Key per Round and no more than eight Fodder', () => {
  const result = calc.simulate({ stage: 4, slots: 99, keys: 1320, roundsPerCycle: 11 });
  assert.equal(result.costPerRound, 12);
  assert.equal(result.slots, 8);
  assert.equal(result.heroes, 80);
  assert.equal(result.grossRuby, 1600);
});

test('finite Fodder and incomplete cycles do not produce imaginary Ruby', () => {
  const result = calc.simulate({ stage: 1, slots: 4, keys: 1000, roundsPerCycle: 11, fodderLimit: 5 });
  assert.equal(result.heroes, 5);
  assert.equal(result.grossRuby, 100);
  assert.equal(result.keysUsed, 132);
  assert.equal(result.keysLeft, 868);
  assert.equal(calc.simulate({ stage: 1, slots: 4, keys: 65, roundsPerCycle: 11 }).heroes, 0);
  assert.equal(calc.simulate({ stage: 1, slots: 0, keys: 1000, roundsPerCycle: 11 }).heroes, 0);
});

test('recurring sources are normalized by period and exclude disabled sources', () => {
  const total = calc.sourceDailyValue([{ enabled: true, amount: 120, days: 5 }, { enabled: true, amount: 180, days: 7 }, { enabled: false, amount: 999, days: 1 }]);
  assert.ok(Math.abs(total - (24 + 180 / 7)) < 1e-9);
});
