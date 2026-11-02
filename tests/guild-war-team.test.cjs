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

test('guild war team page carries build -18: 71 defense + 175 counters', () => {
  assert.equal(data.defense.length, 71);
  assert.equal(Object.keys(data.counters).length, 175); // counters is an object keyed by code
  assert.equal(new Set(data.defense.map(d => d.code)).size, 71, 'defense codes must be unique');
  assert.ok(html.includes('v2026.11.02-18'), 'version must be bumped to -18');
  assert.ok(!html.includes('v2026.11.02-17'), 'old version string must be gone');
});

test('the five new 7k-note teams are present with verified rows (2026-11-02)', () => {
  const expected = {
    T34: { heroes: ['Giyu Tomioka', 'Aris', 'Judas (Awakening)'], formation: 'Attack (1-4)', pet: 'Ruu',
      front: ['Giyu Tomioka'], back: ['Aris', 'Judas (Awakening)'] },
    T35: { heroes: ['Giyu Tomioka', 'Gelidus', 'Judas (Awakening)'], formation: 'Attack (1-4)', pet: 'Pike',
      front: ['Giyu Tomioka'], back: ['Gelidus', 'Judas (Awakening)'] },
    T36: { heroes: ['Radgrid', 'Aris', 'Judas (Awakening)'], formation: 'Attack (1-4)', pet: 'Ruu',
      front: ['Radgrid'], back: ['Aris', 'Judas (Awakening)'] },
    P44: { heroes: ['Clemyth', 'Zenitsu Agatsuma', 'Dellons'], formation: 'Balanced (3-2)', pet: 'Eirin',
      front: ['Clemyth'], back: ['Zenitsu Agatsuma', 'Dellons'] },
    M32: { heroes: ['Dongyoung', 'Shinobu Kocho', 'Silvesta (Awakening)'], formation: 'Basic (2-3)', pet: 'Yu',
      front: [], back: ['Dongyoung', 'Shinobu Kocho', 'Silvesta (Awakening)'] },
  };
  for (const [code, want] of Object.entries(expected)) {
    const d = byCode[code];
    assert.ok(d, `${code} must exist`);
    assert.deepEqual(d.heroes.map(h => h.name), want.heroes);
    assert.ok(d.formation.startsWith(want.formation), `${code} formation must start with ${want.formation}`);
    assert.ok(d.formation.includes('Trước:'), `${code} formation must state rows`);
    assert.equal(d.pet, want.pet);
    assert.deepEqual(d.front, want.front, `${code} front row`);
    assert.deepEqual(d.back, want.back, `${code} back row`);
    assert.ok(d.note && d.note.includes('7k-note target'), `${code} note must cite the 7k-note target`);
  }
  // 4 of the 5 now have verified counters from the 02/11 full read; T34 stays empty
  // because its only 7k-note counter (Li/Karin/Luke) is blocked by the unidentified hero Luke.
  for (const code of ['T35', 'T36', 'P44', 'M32']) {
    assert.ok(byCode[code].counters.length > 0, `${code} must have its 7k-note counters linked`);
    for (const c of byCode[code].counters) assert.ok(data.counters[c], `${code} links to missing counter ${c}`);
  }
  assert.deepEqual(byCode.T34.counters, [], 'T34 must stay empty until Luke is identified');
});

test('the four row-order fixes from the 02/11 full read (P25, P37, T19, T20)', () => {
  const rows = {
    P25: { front: ['Dellons', 'Eileene'], back: ['Zenitsu Agatsuma'] },
    P37: { front: ['Lu Bu', 'Hayeon'], back: ['Sunran'] },
    T19: { front: ['Giyu Tomioka'], back: ['Eileene', 'Aris'] },
    T20: { front: ['Radgrid'], back: ['Eileene', 'Aris'] },
  };
  for (const [code, want] of Object.entries(rows)) {
    assert.deepEqual(byCode[code].front, want.front, `${code} front row order must match 7k-note`);
    assert.deepEqual(byCode[code].back, want.back, `${code} back row order must match 7k-note`);
    assert.ok(byCode[code].formation.includes('Trước: ' + want.front.join(', ')), `${code} formation string must list the front row in order`);
    assert.ok(byCode[code].formation.includes('Sau: ' + want.back.join(', ')), `${code} formation string must list the back row in order`);
  }
});

test('the 59-counter reconciliation: 28 new entries C179-C206, 9 blocked by unidentified heroes', () => {
  for (let n = 179; n <= 206; n++) {
    const c = data.counters['C' + n];
    assert.ok(c, `C${n} must exist`);
    assert.equal(c.skills.length, 0, `C${n} has no recorded skill order`);
    assert.ok(c.note && c.note.includes('7k-note target #'), `C${n} note must cite its 7k-note target`);
    assert.ok(c.formation.includes('Trước:'), `C${n} formation must state rows`);
    assert.deepEqual(new Set([...c.front, ...c.back]).size, 3, `C${n} rows must cover its 3 heroes`);
  }
  // No counter may contain an unidentified hero: Luke, Pelton and Ludy are still unresolved.
  for (const [code, c] of Object.entries(data.counters)) {
    for (const h of c.heroes) {
      assert.ok(!['Luke', 'Pelton', 'Ludy'].includes(h.name), `${code} must not contain unidentified hero ${h.name}`);
    }
  }
  // Every defense link must resolve, and every one of the 18 targets must cite its detail page.
  for (const d of data.defense) {
    for (const c of d.counters) assert.ok(data.counters[c], `${d.code} links to missing counter ${c}`);
  }
  const targets = { T34: 1, T35: 2, P10: 3, P1: 4, P25: 5, T36: 6, P44: 7, M1: 8, M17: 9,
    M32: 10, T22: 11, P38: 12, P37: 13, T18: 14, M18: 15, T19: 16, P8: 17, T20: 18 };
  for (const [code, n] of Object.entries(targets)) {
    assert.ok(byCode[code].note && byCode[code].note.includes(`7k-note target #${n}`),
      `${code} note must cite 7k-note target #${n}`);
  }
});

test('the three formation changes kept their counters and skills, rows verified 2026-11-02', () => {
  assert.ok(byCode.P1.formation.startsWith('Balanced (3-2)'));
  assert.ok(byCode.M1.formation.startsWith('Basic (2-3)'));
  assert.ok(byCode.M18.formation.startsWith('Balanced (3-2)'));
  const rows = {
    P1: { front: ['Eileene'], back: ['Zenitsu Agatsuma', 'Tanjiro Kamado'] },
    M1: { front: [], back: ['Yoongun', 'Dongyoung', 'Shinobu Kocho'] },
    M18: { front: ["O'Mok"], back: ['Yoongun', 'Dongyoung'] },
  };
  for (const code of ['P1', 'M1', 'M18']) {
    assert.deepEqual(byCode[code].front, rows[code].front, `${code} front row`);
    assert.deepEqual(byCode[code].back, rows[code].back, `${code} back row`);
    assert.ok(byCode[code].counters.length > 0, `${code} must keep its counters`);
    assert.ok(byCode[code].skills.length > 0, `${code} must keep its skill chain`);
  }
  assert.deepEqual(byCode.M1.petBackup, ['Yu']);
});

test('every defense team has front/back rows covering exactly its 3 heroes', () => {
  const missing = data.defense.filter(d => !('front' in d) || !('back' in d));
  assert.deepEqual(missing.map(d => d.code), [], 'no team may lack rows');
  for (const d of data.defense) {
    assert.equal(new Set([...d.front, ...d.back]).size, 3, d.code + ' rows must cover exactly the 3 heroes');
    for (const h of d.heroes) {
      assert.ok(d.front.includes(h.name) || d.back.includes(h.name), d.code + ' hero ' + h.name + ' must be in a row');
    }
  }
});

test('the guild war page has the site navigation with itself active', () => {
  for (const target of ['index.html', 'newbie.html', 'cap-nhat.html', 'guild-war-team.html',
    'castle-rush.html', 'raid.html', 'celestial-tower.html', 'tower-of-trials.html', 'arena.html']) {
    assert.ok(html.includes(`href="${target}"`), `missing nav link ${target}`);
  }
  assert.ok(html.includes('class="snav-active"'), 'guild war team must be the active nav item');
});
