const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(root, 'guild-war-team.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const heroesIndex = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes-index.json'), 'utf8'));
const heroIds = new Set((heroesIndex.heroes || heroesIndex).map(h => h.id));

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

function extractVarObject(src, name) {
  const i = src.indexOf('var ' + name + ' = ');
  const j = src.indexOf('{', i);
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
  throw new Error(name + ' not found');
}

const data = extractData(html);
const byCode = Object.fromEntries(data.defense.map(d => [d.code, d]));
const popupIds = extractVarObject(html, 'HERO_POPUP_ID');
const counterPets = extractVarObject(html, 'COUNTER_PETS');

// 7k-note Round 18/18 (Pandoara), snapshot 2026-11-03: counter count per target.
const COUNTERS_PER_TARGET = [7, 9, 1, 1, 4, 9, 1, 1, 3, 1, 4, 1, 1, 4, 3, 3, 3, 4, 2, 3, 2, 1, 1, 2, 3, 5, 2, 1, 5, 2, 4, 1, 1, 3, 1, 1, 2, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0];
// Targets with no auto skill set on 7k-note (browser-verified 2026-11-03).
const NO_SKILL_DEFENSE = ['T2', 'T3', 'T4', 'T7', 'T8', 'T9', 'T11', 'T14', 'T17', 'T20', 'T21', 'T22', 'T23', 'T27', 'T31', 'T35', 'T36', 'T47'];

test('every inline script on the page compiles (no stray text outside comments)', () => {
  // Regression guard: a half-replaced comment once left two orphaned lines
  // of prose in the main script, breaking the whole page at runtime while
  // the data-extraction tests still passed.
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.ok(scripts.length >= 2, 'page must have inline scripts to check');
  for (const [i, src] of scripts.entries()) {
    assert.doesNotThrow(() => new Function(src), `inline script #${i} must compile`);
  }
});

test('guild war team page carries build -20: 48 defense (7k-note only) + 114 counters', () => {
  assert.equal(data.defense.length, 48);
  assert.equal(Object.keys(data.counters).length, 114); // counters is an object keyed by code
  assert.deepEqual(data.defense.map(d => d.code), Array.from({ length: 48 }, (_, i) => 'T' + (i + 1)),
    'defense codes must be T1..T48 in 7k-note target order');
  assert.deepEqual(Object.keys(data.counters), Array.from({ length: 114 }, (_, i) => 'C' + (i + 1)),
    'counter codes must be C1..C114 in target order');
  assert.ok(html.includes('v2026.11.03-20'), 'version must be bumped to -20');
  assert.ok(!html.includes('v2026.11.02-19'), 'old version string must be gone');
  // Group split from the browser's 48-target type labels.
  const groups = {};
  for (const d of data.defense) groups[d.group] = (groups[d.group] || 0) + 1;
  assert.deepEqual(groups, { physical: 21, tank: 17, magic: 10 });
  // No team from the old build may survive: old codes (P*, M*, DE*, ST*) are gone.
  for (const d of data.defense) assert.match(d.code, /^T\d+$/, d.code + ' must be a T-code');
  for (const c of Object.keys(data.counters)) assert.match(c, /^C\d+$/, c + ' must be a C-code');
});

test('defense counter links match the 7k-note snapshot, and every defense cites its target', () => {
  for (let n = 1; n <= 48; n++) {
    const d = byCode['T' + n];
    assert.equal(d.counters.length, COUNTERS_PER_TARGET[n - 1], `T${n} must link ${COUNTERS_PER_TARGET[n - 1]} counters`);
    for (const c of d.counters) assert.ok(data.counters[c], `T${n} links to missing counter ${c}`);
    assert.ok(d.note && d.note.includes(`7k-note (Pandoara) target #${n}`), `T${n} note must cite its 7k-note target`);
    assert.ok(d.note.includes('https://7k-note.pages.dev/g/4ZyeEGMZ/t/'), `T${n} note must link the target detail page`);
  }
  // Every counter is linked from exactly one defense team.
  const linked = data.defense.flatMap(d => d.counters);
  assert.equal(linked.length, 114);
  assert.equal(new Set(linked).size, 114, 'no counter may be linked twice');
});

test('browser-verified targets 1-2 render exactly (front/back rows, pets, skill order)', () => {
  const t1 = byCode.T1;
  assert.deepEqual(t1.heroes.map(h => h.name), ['Tanjiro Kamado', 'Hayeon', 'Sunran']);
  assert.deepEqual(t1.front, ['Tanjiro Kamado', 'Hayeon']);
  assert.deepEqual(t1.back, ['Sunran']);
  assert.equal(t1.pet, 'Jeo');
  assert.ok(t1.formation.startsWith('Defense (4-1)'));
  // API skill 1 = TOP = game Skill 2; skill 2 = BOTTOM = game Skill 1.
  assert.deepEqual(t1.skills.map(s => [s.hero, s.slot, s.name]), [
    ['Sunran', 'Skill 2', 'Phantom Flying Blade'],
    ['Sunran', 'Skill 1', 'Chained Slash'],
    ['Tanjiro Kamado', 'Skill 2', 'Hinokami Kagura: Dancing Flash'],
  ]);
  const t2 = byCode.T2;
  assert.deepEqual(t2.front, []);
  assert.deepEqual(t2.back, ['Yoongun', 'Dongyoung', 'Shinobu Kocho']);
  assert.equal(t2.pet, 'Yeonji');
  assert.deepEqual(t2.skills, [], 'T2 has no auto skill set on 7k-note');
  assert.deepEqual(t2.petBackup, ['Yu']);
  // T1 counter #1 (C1): Yoongun Skill 2 -> Yeonhee Skill 2 -> Yoongun Skill 1.
  assert.deepEqual(data.counters.C1.skills.map(s => [s.hero, s.slot, s.name]), [
    ['Yoongun', 'Skill 2', 'Rapid Volley'],
    ['Yeonhee', 'Skill 2', 'Eternal Slumber'],
    ['Yoongun', 'Skill 1', 'Tenfold Barrage'],
  ]);
});

test('skill chains: 30 defense teams have 3 skills, 18 have none; every counter has a chain', () => {
  const withSkill = data.defense.filter(d => d.skills.length > 0);
  const withoutSkill = data.defense.filter(d => d.skills.length === 0);
  assert.equal(withSkill.length, 30, '30/48 targets have their skill order set on 7k-note');
  assert.deepEqual(withoutSkill.map(d => d.code).sort(), [...NO_SKILL_DEFENSE].sort());
  for (const d of withSkill) assert.equal(d.skills.length, 3, d.code + ' must have exactly 3 auto skills');
  for (const [code, c] of Object.entries(data.counters)) {
    assert.ok(c.skills.length >= 1, code + ' must have at least 1 auto skill');
    assert.ok(c.skills.length <= 3, code + ' must have at most 3 auto skills');
    for (const s of c.skills) {
      assert.ok(['Skill 1', 'Skill 2'].includes(s.slot), code + ' skill slot must be Skill 1 or Skill 2');
      assert.ok(s.name && s.name.length > 0, code + ' skill must have a resolved name');
    }
  }
  // No old-build skill data may leak in: every skill hero must be on the team.
  for (const t of [...data.defense, ...Object.values(data.counters)]) {
    const names = new Set(t.heroes.map(h => h.name));
    for (const s of t.skills) assert.ok(names.has(s.hero), t.code + ' skill hero ' + s.hero + ' must be on the team');
  }
});

test('every team has front/back rows covering exactly its 3 heroes, with a stated formation', () => {
  for (const t of [...data.defense, ...Object.values(data.counters)]) {
    assert.ok('front' in t && 'back' in t, t.code + ' must have front/back rows');
    assert.equal(new Set([...t.front, ...t.back]).size, 3, t.code + ' rows must cover exactly the 3 heroes');
    for (const h of t.heroes) {
      assert.ok(t.front.includes(h.name) || t.back.includes(h.name), t.code + ' hero ' + h.name + ' must be in a row');
    }
    assert.ok(t.formation.includes('Trước:'), t.code + ' formation must state the front row');
    assert.ok(t.formation.includes('Sau:'), t.code + ' formation must state the back row');
    assert.ok(['Attack (1-4)', 'Basic (2-3)', 'Balanced (3-2)', 'Defense (4-1)'].some(f => t.formation.startsWith(f)),
      t.code + ' formation must be one of the four templates');
  }
});

test('hero images resolve: GameWith chara art, or the Atlas portrait fallback', () => {
  const fallback = [];
  for (const t of [...data.defense, ...Object.values(data.counters)]) {
    for (const h of t.heroes) {
      assert.ok(h.img, t.code + ' hero ' + h.name + ' must have an image');
      if (h.img.startsWith('assets/')) {
        fallback.push(h.name);
        assert.ok(fs.existsSync(path.join(root, h.img)), h.img + ' must exist on disk');
      } else {
        assert.match(h.img, /^chara_\d+\.png$/, h.name + ' image must be a GameWith chara file');
      }
    }
  }
  // Only Hellenia, Li and Lina have no GameWith chara image in the old dataset.
  assert.deepEqual([...new Set(fallback)].sort(), ['Hellenia', 'Li', 'Lina']);
  assert.ok(html.includes('h.img.indexOf("assets/") === 0'), 'heroImg must pass through assets/ paths');
});

test('hero popup wiring: every portrait opens the HEROES detail popup', () => {
  assert.ok(html.includes('<link rel="stylesheet" href="heroes.css" />'), 'page must load heroes.css');
  assert.ok(html.includes('<script src="hero-popup.js" defer></script>'), 'page must load hero-popup.js');
  assert.ok(html.includes("data-hero-popup=\"'+heroPopupId(h.name)+'\""), 'heroesHTML must emit data-hero-popup');
  assert.ok(html.includes("data-hero-popup=\"' + heroPopupId(h.name) + '\""), 'boardHeroHTML must emit data-hero-popup');
  assert.ok(!html.includes("data-hero-panel=\"'+esc(h.name)+'\""), 'no portrait may still emit the old data-hero-panel');
  // Card clicks must not open the team detail when the click hit a portrait.
  assert.ok(html.includes('e.target.closest("[data-hero-popup]")'), 'card handlers must ignore portrait clicks');
  // HERO_POPUP_ID covers every hero used on the page, and every id is a real hero.
  const used = new Set();
  for (const t of [...data.defense, ...Object.values(data.counters)]) {
    for (const h of t.heroes) used.add(h.name.replace(' (Awakening)', ''));
  }
  assert.equal(used.size, 52);
  assert.deepEqual(Object.keys(popupIds).sort(), [...used].sort(), 'popup map must cover exactly the 52 heroes used');
  for (const [name, id] of Object.entries(popupIds)) {
    assert.ok(heroIds.has(id), `popup id ${id} for ${name} must exist in heroes-index`);
    assert.ok(fs.existsSync(path.join(root, 'data', 'heroes', id + '.json')), `hero JSON for ${name} must exist`);
  }
});

test('no PROPOSED flags remain: build -20 is 7k-note-verified only', () => {
  assert.deepEqual(extractVarObject(html, 'PROPOSED_DEFENSE'), {});
  assert.deepEqual(extractVarObject(html, 'PROPOSED_COUNTER'), {});
  assert.ok(!html.includes('PROPOSED_DEFENSE = {"T'), 'no old proposed defense codes may remain');
});

test('COUNTER_PETS lists each counter pet plus its reserve pets', () => {
  assert.equal(Object.keys(counterPets).length, 114);
  for (const [code, c] of Object.entries(data.counters)) {
    assert.deepEqual(counterPets[code], [c.pet, ...c.petBackup], code + ' pets must be main + reserves');
  }
});

test('home page counts the new total: 162 teams', () => {
  assert.ok(indexHtml.includes('162 đội mẫu'), 'home Guild War card must say 162 đội mẫu');
  assert.ok(!indexHtml.includes('248 đội mẫu'), 'old 248 count must be gone from home');
});

test('the guild war page has the site navigation with itself active', () => {
  for (const target of ['index.html', 'newbie.html', 'cap-nhat.html', 'guild-war-team.html',
    'castle-rush.html', 'raid.html', 'celestial-tower.html', 'tower-of-trials.html', 'arena.html']) {
    assert.ok(html.includes(`href="${target}"`), `missing nav link ${target}`);
  }
  assert.ok(html.includes('class="snav-active"'), 'guild war team must be the active nav item');
});

test('the guild war page matches the site chrome: light-only, sticky nav, site footer, back-to-top', () => {
  assert.ok(!html.includes('prefers-color-scheme'), 'guild war page must not flip to dark from the system theme');
  assert.ok(html.includes('.snav-bar{position:sticky;top:0;z-index:200'), 'guild war nav must stay sticky like the site header');
  assert.ok(html.includes('class="site-footer"'), 'guild war page must use the standard site footer');
  assert.ok(html.includes('Meta v2026.11.03-20'), 'the meta build version must survive the footer swap');
  assert.ok(html.includes('class="back-to-top"'), 'guild war page must have a back-to-top button');
  assert.ok(html.includes('id="dau-trang"'), 'the footer "Về đầu trang" link needs its anchor');
});
