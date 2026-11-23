const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(root, 'guild-war-team.html'), 'utf8');
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

// 7k-note new season Round 3/18 (Pandoara), snapshot 2026-11-23: counter count per target.
const COUNTERS_PER_TARGET = [4, 11, 5, 2, 9, 5, 4, 4, 2, 2, 2, 2, 1, 4, 6, 2, 1, 1, 4, 1, 1, 4, 3, 3, 4, 2, 3, 2, 1, 2, 3, 5, 2, 1, 5, 2, 4, 1, 1, 3, 1, 1, 2, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0];
// Targets with no auto skill set on 7k-note (API snapshot 2026-11-23).
const NO_SKILL_DEFENSE = ['T2', 'T4', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13', 'T16', 'T17', 'T19', 'T22', 'T24', 'T27', 'T28', 'T29', 'T33', 'T37', 'T41', 'T42', 'T53'];

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

test('guild war team page carries build -24: 54 defense (7k-note only) + 140 counters', () => {
  assert.equal(data.defense.length, 54);
  assert.equal(Object.keys(data.counters).length, 140); // counters is an object keyed by code
  assert.deepEqual(data.defense.map(d => d.code), Array.from({ length: 54 }, (_, i) => 'T' + (i + 1)),
    'defense codes must be T1..T54 in 7k-note target order');
  assert.deepEqual(Object.keys(data.counters), Array.from({ length: 140 }, (_, i) => 'C' + (i + 1)),
    'counter codes must be C1..C140 in target order');
  assert.ok(html.includes('v2026.11.23-24'), 'version must be bumped to -24');
  assert.ok(!html.includes('v2026.11.17-23'), 'old version string must be gone');
  // Group split from the 7k-note tags[0] (โจมตี->Physical, ถึก->Tank, เวทย์->Magic).
  const groups = {};
  for (const d of data.defense) groups[d.group] = (groups[d.group] || 0) + 1;
  assert.deepEqual(groups, { physical: 25, tank: 19, magic: 10 });
  // No team from the old build may survive: old codes (P*, M*, DE*, ST*) are gone.
  for (const d of data.defense) assert.match(d.code, /^T\d+$/, d.code + ' must be a T-code');
  for (const c of Object.keys(data.counters)) assert.match(c, /^C\d+$/, c + ' must be a C-code');
});

test('defense counter links match the 7k-note snapshot, and every defense cites its target', () => {
  for (let n = 1; n <= 54; n++) {
    const d = byCode['T' + n];
    assert.equal(d.counters.length, COUNTERS_PER_TARGET[n - 1], `T${n} must link ${COUNTERS_PER_TARGET[n - 1]} counters`);
    for (const c of d.counters) assert.ok(data.counters[c], `T${n} links to missing counter ${c}`);
    assert.ok(d.note && d.note.includes(`7k-note (Pandoara) target #${n}`), `T${n} note must cite its 7k-note target`);
    assert.ok(d.note.includes('https://7k-note.pages.dev/g/4ZyeEGMZ/t/'), `T${n} note must link the target detail page`);
  }
  // Every counter is linked from exactly one defense team.
  const linked = data.defense.flatMap(d => d.counters);
  assert.equal(linked.length, 140);
  assert.equal(new Set(linked).size, 140, 'no counter may be linked twice');
});

test('browser-verified targets 1-2 render exactly (front/back rows, pets, skill order)', () => {
  const t1 = byCode.T1;
  assert.deepEqual(t1.heroes.map(h => h.name), ['Eileene', 'Judas (Awakening)', 'Zenitsu Agatsuma']);
  assert.deepEqual(t1.front, ['Eileene']);
  assert.deepEqual(t1.back, ['Judas (Awakening)', 'Zenitsu Agatsuma']);
  assert.equal(t1.pet, 'Yu');
  assert.deepEqual(t1.petBackup, ['Eirin']);
  assert.ok(t1.formation.startsWith('Balanced (3-2)'));
  // API skill 1 = TOP = game Skill 2; skill 2 = BOTTOM = game Skill 1.
  // Detail page (browser 2026-11-17): Eileene skill dưới, Zenitsu skill trên,
  // Judas skill trên, in that order.
  assert.deepEqual(t1.skills.map(s => [s.hero, s.slot, s.name]), [
    ['Eileene', 'Skill 1', "Empress's Wrath"],
    ['Zenitsu Agatsuma', 'Skill 2', 'Thunder Breathing First Form: Thunderclap and Flash Eightfold'],
    ['Judas (Awakening)', 'Skill 2', 'Final Power'],
  ]);
  // Build -24: 7k-note reordered the top 15 targets. The old T6
  // (Yoongun/Dongyoung/Shinobu) is the new T2; the old T2
  // (Eve/Tanjiro/Sunran) moved to T6. All three sit in Back, so the
  // front row is empty and the team has no auto skill set on 7k-note.
  const t2 = byCode.T2;
  assert.deepEqual(t2.heroes.map(h => h.name), ['Yoongun', 'Dongyoung', 'Shinobu Kocho']);
  assert.deepEqual(t2.front, []);
  assert.deepEqual(t2.back, ['Yoongun', 'Dongyoung', 'Shinobu Kocho']);
  assert.equal(t2.pet, 'Yeonji');
  assert.deepEqual(t2.petBackup, ['Yu']);
  assert.ok(t2.formation.startsWith('Basic (2-3)'));
  assert.deepEqual(t2.skills, []);
  const t6 = byCode.T6;
  assert.deepEqual(t6.heroes.map(h => h.name), ['Eve', 'Tanjiro Kamado', 'Sunran']);
  assert.deepEqual(t6.front, ['Eve', 'Tanjiro Kamado']);
  assert.deepEqual(t6.back, ['Sunran']);
  assert.equal(t6.pet, 'Jeo');
  assert.ok(t6.formation.startsWith('Defense (4-1)'));
  assert.deepEqual(t6.skills.map(s => [s.hero, s.slot, s.name]), [
    ['Tanjiro Kamado', 'Skill 2', 'Hinokami Kagura: Dancing Flash'],
    ['Sunran', 'Skill 2', 'Phantom Flying Blade'],
    ['Eve', 'Skill 1', 'Time of Our Lives'],
  ]);
  // T1 counter #1 (C1): Zenitsu Skill 2 -> Sunran Skill 2 -> Ballista Skill 2.
  assert.deepEqual(data.counters.C1.skills.map(s => [s.hero, s.slot, s.name]), [
    ['Zenitsu Agatsuma', 'Skill 2', 'Thunder Breathing First Form: Thunderclap and Flash Eightfold'],
    ['Sunran', 'Skill 2', 'Phantom Flying Blade'],
    ['Ballista', 'Skill 2', 'Shadow of Death'],
  ]);
  // T45 (Aris + Gelidus + Rudy): the Nov 13 browser read said Front Aris+Rudy
  // with Gelidus in Back — WRONG. The API (front=3) and a fresh detail-page
  // read (browser 2026-11-17) agree: all three are in Front, Back is empty.
  const t45 = byCode.T45;
  assert.deepEqual(t45.heroes.map(h => h.name), ['Aris', 'Gelidus', 'Rudy']);
  assert.deepEqual(t45.front, ['Aris', 'Gelidus', 'Rudy']);
  assert.deepEqual(t45.back, []);
  assert.equal(t45.pet, 'Ruu');
  assert.deepEqual(t45.skills.map(s => [s.hero, s.slot, s.name]), [
    ['Rudy', 'Skill 1', 'Sword of Condemnation'],
    ['Aris', 'Skill 2', 'Finishing Blow'],
    ['Rudy', 'Skill 2', 'Walls of Conviction'],
  ]);
});

test('build -24: 7k-note reordered the top 15 targets (rev 429 -> 461)', () => {
  // Same 54 teams, only the order changed: T1 and T17-T54 keep their codes,
  // T2-T16 are the old teams renumbered. Hero sets, front/back rows, pets
  // and skill chains move with the team, not with the code.
  const expected = {
    T2: ['Yoongun', 'Dongyoung', 'Shinobu Kocho'],
    T3: ['Eileene', 'Zenitsu Agatsuma', 'Tanjiro Kamado'],
    T4: ['Eileene', 'Eve', 'Zenitsu Agatsuma'],
    T5: ['Dellons', 'Eileene', 'Zenitsu Agatsuma'],
    T6: ['Eve', 'Tanjiro Kamado', 'Sunran'],
    T7: ['Giyu Tomioka', 'Judas (Awakening)', 'Eileene'],
    T8: ['Hayeon', 'Yoongun', 'Shinobu Kocho'],
    T9: ['Giyu Tomioka', 'Aris', 'Judas (Awakening)'],
    T10: ['Giyu Tomioka', 'Aris', 'Clemyth'],
    T11: ['Eve', 'Hayeon', 'Sunran'],
    T12: ['Giyu Tomioka', 'Judas (Awakening)', 'Shinobu Kocho'],
    T13: ['Clemyth', 'Zenitsu Agatsuma', 'Dellons'],
    T14: ['Giyu Tomioka', 'Eileene', 'Aris'],
    T15: ['Tanjiro Kamado', 'Hayeon', 'Sunran'],
    T16: ['Giyu Tomioka', 'Gelidus', 'Judas (Awakening)'],
  };
  for (const [code, heroes] of Object.entries(expected)) {
    assert.deepEqual(byCode[code].heroes.map(h => h.name), heroes, code + ' must be the renumbered team');
  }
});

test('build -24 content changes: 2 new counters, T1 C3 replaced, T4 skill order, T5 pet swap', () => {
  // (a) T1 counter #3 (C3) replaced: Freyja out, Dongyoung in, Merparrow
  // added as reserve pet, opening skill order changed.
  assert.deepEqual(data.counters.C3.heroes.map(h => h.name), ['Skuld', 'Dongyoung', 'Yoongun']);
  assert.equal(data.counters.C3.pet, 'Yeonji');
  assert.deepEqual(data.counters.C3.petBackup, ['Merparrow']);
  assert.deepEqual(data.counters.C3.skills.map(s => [s.hero, s.slot, s.name]), [
    ['Skuld', 'Skill 2', "Constellation's Secret"],
    ['Yoongun', 'Skill 2', 'Rapid Volley'],
    ['Yoongun', 'Skill 1', 'Tenfold Barrage'],
  ]);
  assert.deepEqual(counterPets.C3, ['Yeonji', 'Merparrow']);
  // (b) T2 gains an 11th counter (C15): Sunran / Eve / Tanjiro, pet Jeo.
  assert.equal(byCode.T2.counters.length, 11);
  assert.equal(byCode.T2.counters[10], 'C15');
  assert.deepEqual(data.counters.C15.heroes.map(h => h.name), ['Sunran', 'Eve', 'Tanjiro Kamado']);
  assert.equal(data.counters.C15.pet, 'Jeo');
  assert.deepEqual(data.counters.C15.petBackup, ['Eirin']);
  assert.deepEqual(data.counters.C15.skills.map(s => [s.hero, s.slot, s.name]), [
    ['Tanjiro Kamado', 'Skill 2', 'Hinokami Kagura: Dancing Flash'],
    ['Sunran', 'Skill 2', 'Phantom Flying Blade'],
    ['Eve', 'Skill 1', 'Time of Our Lives'],
  ]);
  // (c) T3 gains a 5th counter (C20): Giyu / Shinobu / Aris, pet Ruu.
  assert.equal(byCode.T3.counters.length, 5);
  assert.equal(byCode.T3.counters[4], 'C20');
  assert.deepEqual(data.counters.C20.heroes.map(h => h.name), ['Giyu Tomioka', 'Shinobu Kocho', 'Aris']);
  assert.equal(data.counters.C20.pet, 'Ruu');
  assert.deepEqual(data.counters.C20.petBackup, ['Karam', 'Pike']);
  assert.deepEqual(data.counters.C20.skills.map(s => [s.hero, s.slot, s.name]), [
    ['Shinobu Kocho', 'Skill 2', 'Insect Breathing Dance of the Dragonfly: Compound Eye Hexagon'],
    ['Giyu Tomioka', 'Skill 1', 'Water Breathing Seventh Form: Drop Ripple Thrust'],
    ['Aris', 'Skill 2', 'Finishing Blow'],
  ]);
  // (d) T4 counter #2 (C22): opening skill order changed — Tanjiro now leads.
  assert.deepEqual(data.counters.C22.skills.map(s => [s.hero, s.slot, s.name]), [
    ['Tanjiro Kamado', 'Skill 2', 'Hinokami Kagura: Dancing Flash'],
    ['Sunran', 'Skill 2', 'Phantom Flying Blade'],
    ['Ballista', 'Skill 2', 'Shadow of Death'],
  ]);
  // (e) T5 counter #1 (C23): main and reserve pets swapped Pike <-> Karam.
  assert.equal(data.counters.C23.pet, 'Karam');
  assert.deepEqual(data.counters.C23.petBackup, ['Pike']);
  assert.deepEqual(counterPets.C23, ['Karam', 'Pike']);
});

test('every skill chain entry carries its Heroes icon and kit (build -21)', () => {
  let n = 0;
  for (const t of [...data.defense, ...Object.values(data.counters)]) {
    for (const s of t.skills) {
      n++;
      assert.ok(s.icon && s.icon.endsWith('.webp'), t.code + ' skill ' + s.name + ' must carry a skills-raw icon');
      assert.ok(fs.existsSync(path.join(root, 'assets', 'skills-raw', s.icon)),
        t.code + ' skill icon ' + s.icon + ' must exist on disk');
      assert.ok(['awk', 's6'].includes(s.kit), t.code + ' skill ' + s.name + ' must state its kit (awk/s6)');
    }
  }
  assert.equal(n, 509, 'all 509 chain skills must carry icon + kit');
  // The 13 rows that used to render with an empty icon box (Judas, Li, Rook,
  // Bai Jiao have no GW skill panel) now all have real icons.
  const noPanelHeroes = ['Judas (Awakening)', 'Li', 'Rook', 'Bai Jiao'];
  for (const t of [...data.defense, ...Object.values(data.counters)]) {
    for (const s of t.skills) {
      if (noPanelHeroes.includes(s.hero)) {
        assert.ok(s.icon, t.code + ' ' + s.hero + ' ' + s.slot + ' must have an icon despite having no GW panel');
      }
    }
  }
});

test('skill popup sync: shared renderer loaded, no Atlas Codex attribution anywhere', () => {
  assert.ok(html.includes('<script src="skill-card.js"></script>'), 'page must load the shared skill-card.js renderer');
  assert.ok(!html.includes('Atlas Codex'), 'no Atlas Codex source attribution may remain on the page');
  assert.ok(html.includes("assets/skills-raw/'+esc(s.icon)+"), 'opener rows must use the DATA skill icon (skills-raw)');
  assert.ok(html.includes("data-skill-panel=\"'+esc(s.hero)+'|'+esc(s.slot)+'|'+esc(s.kit || '')+'\""),
    'opener rows must pass the kit to the skill popup');
  assert.ok(html.includes('window.SkillCard.skillDetailHtml'), 'skill popup must render via the shared SkillCard renderer');
  assert.ok(html.includes("gwHeroJson"), 'skill popup must load the hero JSON (same source as the Heroes page)');
});

test('popups sit above the sticky site header (build -21 z-index fix)', () => {
  const z = (sel) => {
    const m = html.match(new RegExp(sel.replace('.', '\\.') + '\\{[^}]*z-index:(\\d+)'));
    assert.ok(m, sel + ' must declare a z-index');
    return Number(m[1]);
  };
  const navCss = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(navCss.includes('.site-header{position:sticky;top:0;z-index:200'),
    'site header must stay sticky at z-200');
  const header = 200;
  assert.ok(z('.overlay') > header, 'team sheet overlay must sit above the site header');
  assert.ok(z('.poverlay') > z('.overlay'), 'skill panel overlay must sit above the team sheet');
  assert.ok(z('.poverlay') < 400, 'skill panel must stay below the hero popup (hx-modal z-400)');
  assert.equal(z('.overlay'), 300);
  assert.equal(z('.poverlay'), 320);
});

test('skill chains: 32 defense teams have 3 skills, 22 have none; every counter has a chain except C34', () => {
  const withSkill = data.defense.filter(d => d.skills.length > 0);
  const withoutSkill = data.defense.filter(d => d.skills.length === 0);
  assert.equal(withSkill.length, 32, '32/54 targets have their skill order set on 7k-note');
  assert.deepEqual(withoutSkill.map(d => d.code).sort(), [...NO_SKILL_DEFENSE].sort());
  for (const d of withSkill) assert.equal(d.skills.length, 3, d.code + ' must have exactly 3 auto skills');
  // C34 (Giyu/Hayeon/Judas counter of T6, the old T2) is the only counter
  // with no skill set on 7k-note itself; every other counter has 1-3.
  assert.deepEqual(data.counters.C34.skills, [], 'C34 must have no auto skill (none set on 7k-note)');
  for (const [code, c] of Object.entries(data.counters)) {
    if (code === 'C34') continue;
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
  // Only Hellenia, Li, Lina — and now Eve — have no GameWith chara image;
  // they use the Atlas portrait fallback (assets/hero-*.webp).
  assert.deepEqual([...new Set(fallback)].sort(), ['Eve', 'Hellenia', 'Li', 'Lina']);
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
  assert.equal(used.size, 53);
  assert.deepEqual(Object.keys(popupIds).sort(), [...used].sort(), 'popup map must cover exactly the 53 heroes used');
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
  assert.equal(Object.keys(counterPets).length, 140);
  for (const [code, c] of Object.entries(data.counters)) {
    assert.deepEqual(counterPets[code], [c.pet, ...c.petBackup], code + ' pets must be main + reserves');
  }
});

test('the guild war page has the site navigation with itself active', () => {
  for (const target of ['index.html', 'newbie.html', 'cap-nhat.html', 'guild-war-team.html',
    'castle-rush.html', 'raid.html', 'celestial-tower.html', 'tower-of-trials.html', 'arena.html']) {
    assert.ok(html.includes(`href="${target}"`), `missing nav link ${target}`);
  }
  assert.ok(html.includes('class="nav-active"'), 'guild war team must be the active nav item');
});

test('the guild war page matches the site chrome: light-only, sticky nav, site footer, back-to-top', () => {
  assert.ok(!html.includes('prefers-color-scheme'), 'guild war page must not flip to dark from the system theme');
  assert.ok(!html.includes('snav-'), 'guild war page must not keep its old separate nav (unified 2026-11-21)');
  assert.ok(!html.includes('fp-btn') && !html.includes('fp-src') && !html.includes('fanpage-row'),
    'guild war page must not keep its content-header Fanpage button or source line (removed 2026-11-21)');
  assert.ok(!html.includes('Truy cập fanpage'), 'guild war page must not link out to the fanpage from its content header');
  assert.ok(html.includes('href="styles-v3.css"'), 'guild war page must load the shared base stylesheet');
  assert.ok(html.includes('href="site-nav.css"'), 'guild war page must load the shared nav stylesheet');
  const navCss = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(navCss.includes('.site-header{position:sticky;top:0;z-index:200'),
    'guild war header must stay sticky like the site header');
  assert.ok(html.includes('class="site-header"'), 'guild war page must use the standard site header');
  assert.ok(html.includes('.hero{display:block'), 'guild war team-hero cells must stay blocks (not the styles-v3 banner grid)');
  assert.ok(html.includes('class="site-footer"'), 'guild war page must use the standard site footer');
  assert.ok(html.includes('Meta v2026.11.23-24'), 'the meta build version must survive the footer swap');
  assert.ok(html.includes('class="back-to-top"'), 'guild war page must have a back-to-top button');
  assert.ok(html.includes('id="dau-trang"'), 'the footer "Về đầu trang" link needs its anchor');
});

test('guild war mobile fixes (2026-11-21): notch-safe viewport, hero cells not stretched, searchbar below header', () => {
  assert.ok(html.includes('<meta name="viewport" content="width=device-width, initial-scale=1"'),
    'guild war viewport meta must be exactly width=device-width, initial-scale=1 (no cover) like every other page');
  assert.ok(html.includes('content="width=device-width, initial-scale=1"'),
    'guild war viewport must match the site-wide convention');
  assert.ok(html.includes('.hero{display:block;flex:1;min-width:0;text-align:center;min-height:0;border:0;border-radius:0;box-shadow:none;overflow:visible;background:transparent;padding:0}'),
    'team-hero cells must neutralize the styles-v3 banner .hero leak (min-height:327px stretched every cell and left a huge empty area under the portraits)');
  assert.ok(html.includes('.searchbar{top:62px}'),
    'on phones the sticky searchbar must pin below the 62px site header, not at top:0 where the header covers it');
});

test('guild war logo fix + half-size cards (2026-11-21): .wrap padding scoped to content, grid at 160px', () => {
  assert.ok(!html.includes('.wrap{max-width:1180px'),
    'the page must not carry a bare .wrap padding rule — it leaked into .header-inner.wrap and shrank the header content box to a negative height (62px − 64px padding), pushing the logo up out of the header');
  assert.ok(html.includes('.gw-page{max-width:1180px;margin:0 auto;padding:0 16px 64px}'),
    'the 64px bottom padding must live on the scoped .gw-page rule only');
  assert.ok(html.includes('<div class="wrap gw-page">'),
    'the content wrapper must carry .gw-page so it keeps its padding');
  assert.ok(html.includes('<div class="header-inner wrap">'),
    'the site header must keep its plain .wrap (styles-v3 width only, no bottom padding)');
  assert.ok(html.includes('.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr))'),
    'team cards must be half their old width (grid min 320px → 160px)');
  assert.ok(html.includes('.grid{grid-template-columns:repeat(2,1fr)}'),
    'on phones the grid must show 2 cards per row (was 1 column)');
});

test('guild war search caret (2026-11-21): typing must not jump the caret to 0', () => {
  assert.ok(html.includes('try { start = qInput.selectionStart; end = qInput.selectionEnd; } catch (e) {}'),
    'the input handler must save the caret before render() + showSuggest() rebuild the list and dropdown below the input');
  assert.ok(html.includes('function restoreCaret(start, end)'),
    'a restoreCaret helper must exist — the round-1 sync-only restore did not hold on iOS, which can reset the caret again after the layout settles');
  assert.ok(html.includes('requestAnimationFrame(function(){'),
    'restoreCaret must put the caret back once more on the next frame, after any async iOS reset');
  assert.ok(html.includes('qInput.selectionStart === 0'),
    'the frame restore must only fire when the caret really sits at 0 — a later keystroke must never be undone by a stale restore');
  assert.ok(html.includes('function scheduleRender(){') && html.includes('renderTimer = setTimeout'),
    'the list render must be debounced on typing so rapid keystrokes no longer rebuild the whole team list every time');
  assert.ok(html.includes('}, 150);'),
    'the debounce delay must be 150ms — the list still updates a beat after the user pauses');
  assert.ok(html.includes('showSuggest();\n  restoreCaret(start, end);\n  scheduleRender();'),
    'the input handler must suggest immediately, restore the caret, and schedule (not run) the list render');
  assert.ok(html.includes('.search .clear{border:0;background:var(--chip);color:var(--ink2);border-radius:8px;padding:4px 10px;font-size:10.6px;font-weight:700;visibility:hidden}'),
    'the clear button must reserve its space with visibility (not display:none) so the input never changes width when the button appears mid-typing');
  assert.ok(!html.includes('style.display = "block"') && !html.includes('style.display = "none"'),
    'nothing may toggle the clear button with display anymore — a width change of the focused input is a caret-reset trigger on mobile browsers');
  assert.ok(html.includes('qInput.setSelectionRange(name.length, name.length)'),
    'after picking a hero suggestion the caret must sit at the end of the filled-in name');
});

test('guild war counter cards compact (2026-11-21): smaller, tighter, less whitespace', () => {
  assert.ok(html.includes('.ctr-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-top:10px}'),
    'counter grids must be narrower than defense grids (140px vs 160px min) with a tighter gap');
  assert.ok(html.includes("'<div class=\"grid ctr-grid\">' + cs.map") && html.includes("'<div class=\"grid ctr-grid\">' + cs2.map"),
    'both counter grids (library tab and search results) must use ctr-grid — defense grids stay on the 160px grid');
  assert.ok(html.includes('.card.ctr{padding:8px}'),
    'counter cards must carry less padding (8px vs 10px)');
  assert.ok(html.includes('.card.ctr .card-top{gap:6px;margin-bottom:7px}'),
    'the counter card header row must be tighter (gap 6px, margin 7px)');
  assert.ok(html.includes('.card.ctr .heroes{gap:4px}') && html.includes('.card.ctr .hero .hn{margin-top:3px}'),
    'the counter hero row must be tighter (gap 4px, name margin 3px)');
  assert.ok(html.includes('.card.ctr .card-meta{gap:6px;margin-top:8px;padding-top:7px}'),
    'the counter card footer must be tighter (gap 6px, margins 8px/7px)');
  assert.ok(html.includes("'<div class=\"card-top\"><span class=\"code\">'+c+'</span>'+ctrPropBadge(c)+'<span class=\"arr\">Chi tiết ›</span></div>'"),
    'the counter card header must be just code + property badge + arrow — the per-card "Đội hình khắc chế" label is gone (the section header already says it and the blue card styling marks counter cards, so the label only wrapped the header row onto two lines; the detail sheet header at openCounter keeps its label)');
});
