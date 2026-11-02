const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(root, 'guild-war-team.html'), 'utf8');

// Extract the embedded var DATA = {...}; JSON object (brace matching, string aware).
function extractData(src) {
  const i = src.indexOf('var DATA = ');
  let j = src.indexOf('{', i);
  let depth = 0, instr = false, esc = false;
  for (let k = j; k < src.length; k++) {
    const c = src[k];
    if (instr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') instr = false;
    } else {
      if (c === '"') instr = true;
      else if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) return JSON.parse(src.slice(j, k + 1));
      }
    }
  }
  throw new Error('DATA not found');
}

const data = extractData(html);
const byCode = Object.fromEntries(data.defense.map(d => [d.code, d]));

test('guild war team page carries build -17: 71 defense + 147 counters', () => {
  assert.equal(data.defense.length, 71);
  assert.equal(Object.keys(data.counters).length, 147); // counters is an object keyed by code
  assert.equal(new Set(data.defense.map(d => d.code)).size, 71, 'defense codes must be unique');
  assert.ok(html.includes('v2026.11.02-17'), 'version must be bumped to -17');
  assert.ok(!html.includes('v2026.10.27-16'), 'old version string must be gone');
});

test('the five new 7k-note teams are present with unverified rows flagged', () => {
  const expected = {
    T34: { heroes: ['Giyu Tomioka', 'Aris', 'Judas (Awakening)'], formation: 'Attack (1-4)', pet: 'Ruu' },
    T35: { heroes: ['Giyu Tomioka', 'Gelidus', 'Judas (Awakening)'], formation: 'Attack (1-4)', pet: 'Pike' },
    T36: { heroes: ['Radgrid', 'Aris', 'Judas (Awakening)'], formation: 'Attack (1-4)', pet: 'Ruu' },
    P44: { heroes: ['Clemyth', 'Zenitsu Agatsuma', 'Dellons'], formation: 'Balanced (3-2)', pet: 'Eirin' },
    M32: { heroes: ['Dongyoung', 'Shinobu Kocho', 'Silvesta (Awakening)'], formation: 'Basic (2-3)', pet: 'Yu' },
  };
  for (const [code, want] of Object.entries(expected)) {
    const d = byCode[code];
    assert.ok(d, `${code} must exist`);
    assert.deepEqual(d.heroes.map(h => h.name), want.heroes);
    assert.equal(d.formation, want.formation);
    assert.equal(d.pet, want.pet);
    assert.ok(!d.front && !d.back, `${code} must not claim front/back rows`);
    assert.deepEqual(d.counters, [], `${code} must not claim unverified counters`);
  }
  assert.ok(html.includes('chưa xác minh hàng'), 'unverified-rows marker must be rendered');
  assert.ok(html.includes('Hàng Trước/Sau chưa xác minh'), 'detail warning must be present');
});

test('the three formation changes kept their counters and skills', () => {
  assert.equal(byCode.P1.formation, 'Balanced (3-2)');
  assert.equal(byCode.M1.formation, 'Basic (2-3)');
  assert.equal(byCode.M18.formation, 'Balanced (3-2)');
  for (const code of ['P1', 'M1', 'M18']) {
    assert.ok(!byCode[code].front && !byCode[code].back, `${code} rows must be unverified`);
    assert.ok(byCode[code].counters.length > 0, `${code} must keep its counters`);
    assert.ok(byCode[code].skills.length > 0, `${code} must keep its skill chain`);
  }
  assert.deepEqual(byCode.M1.petBackup, ['Yu']);
});

test('the guild war page has the site navigation with itself active', () => {
  for (const target of ['index.html', 'newbie.html', 'cap-nhat.html', 'guild-war-team.html',
    'castle-rush.html', 'raid.html', 'celestial-tower.html', 'tower-of-trials.html', 'arena.html']) {
    assert.ok(html.includes(`href="${target}"`), `missing nav link ${target}`);
  }
  assert.ok(html.includes('class="snav-active"'), 'guild war team must be the active nav item');
});
