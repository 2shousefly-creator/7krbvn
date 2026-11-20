const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');

const compare = require(path.join(root, 'compare.js'));
const eve = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'eve.json'), 'utf8'));
const judas = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'judas.json'), 'utf8'));
const ariel = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'ariel.json'), 'utf8'));
const amelia = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'amelia.json'), 'utf8'));

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

test('compare page: pickers, swap, share link, result area and scripts', () => {
  const html = read('so-sanh.html');
  assert.ok(html.includes('id="cp-search-a"'), 'so-sanh.html needs the first hero picker');
  assert.ok(html.includes('id="cp-search-b"'), 'so-sanh.html needs the second hero picker');
  assert.ok(html.includes('id="cp-swap"'), 'so-sanh.html needs the swap button');
  assert.ok(html.includes('id="cp-result"'), 'so-sanh.html needs the result container');
  assert.ok(html.includes('id="cp-copy-link"'), 'so-sanh.html needs the copy-share-link button');
  assert.ok(html.includes('href="compare.css"'), 'so-sanh.html must load compare.css');
  assert.ok(html.includes('src="compare.js"'), 'so-sanh.html must load compare.js');
  assert.ok(html.includes('src="guide.js"'), 'so-sanh.html must load guide.js');
  assert.ok(html.includes('So sánh Hero'), 'so-sanh.html must be titled in Vietnamese');
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'so-sanh.html has duplicate ids');
});

test('compare page keeps the standard nav links', () => {
  const html = read('so-sanh.html');
  for (const link of ['index.html', 'newbie.html', 'cap-nhat.html', 'cot-truyen.html',
    'castle-rush.html', 'advent-expedition.html', 'raid.html', 'dungeon.html',
    'celestial-tower.html', 'tower-of-trials.html', 'arena.html', 'total-war.html',
    'guild-war-team.html', 'heroes.html', 'tier-list.html', 'tu-dien-hieu-ung.html',
    'so-sanh.html', 'tinh-ruby.html', 'doi-coupon.html']) {
    assert.ok(html.includes('href="' + link + '"'), 'so-sanh.html must link to ' + link);
  }
  assert.ok(html.includes('class="nav-active" href="so-sanh.html"'),
    'so-sanh.html must highlight itself in the nav (TRA CỨU submenu)');
  assert.ok(html.includes('data-parent="TRA CỨU"'), 'so-sanh.html nav must have the TRA CỨU dropdown');
});

test('compare script loads its data from the hero JSONs', () => {
  const js = read('compare.js');
  assert.ok(js.includes('data/heroes-index.json'), 'compare.js must fetch heroes-index.json');
  assert.ok(js.includes("data/heroes/'"), 'compare.js must fetch data/heroes/<id>.json');
  assert.ok(js.includes('heroes-index.json') && js.includes('fetch('), 'compare.js must load the index with fetch');
});

test('URL params ?a=&b= are parsed, and swap exchanges the two heroes', () => {
  assert.deepEqual(compare.parseCompareParams('?a=eve&b=judas'), { a: 'eve', b: 'judas' });
  assert.deepEqual(compare.parseCompareParams('a=eve&b=judas'), { a: 'eve', b: 'judas' });
  assert.deepEqual(compare.parseCompareParams('?a=eve'), { a: 'eve', b: null });
  assert.deepEqual(compare.parseCompareParams(''), { a: null, b: null });
  assert.deepEqual(compare.swapSelection({ a: 'eve', b: 'judas' }), { a: 'judas', b: 'eve' });
  assert.deepEqual(compare.swapSelection({ a: 'eve', b: null }), { a: null, b: 'eve' });
});

test('search matches without diacritics', () => {
  assert.equal(compare.norm('EVE'), 'eve');
  assert.equal(compare.norm('  Judas '), 'judas');
  assert.equal(compare.norm('Tướng'), 'tuong');
  assert.equal(compare.norm('Thức tỉnh'), 'thuc tinh');
});

test('eve vs judas 6-star stats match the source JSONs', () => {
  // Eve s6: PATK 1500 / HP 3326 / DEF 571 / SPD 29.
  assert.equal(compare.statValue(eve, 's6', 'atk'), 1500);
  assert.equal(compare.statValue(eve, 's6', 'hp'), 3326);
  assert.equal(compare.statValue(eve, 's6', 'def'), 571);
  assert.equal(compare.statValue(eve, 's6', 'spd'), 29);
  assert.deepEqual(compare.attackStat(eve.stats.s6), { key: 'PATK', value: 1500 });
  // Judas s6: PATK 1306 / HP 3693 / DEF 659 / SPD 25.
  assert.equal(compare.statValue(judas, 's6', 'atk'), 1306);
  assert.equal(compare.statValue(judas, 's6', 'hp'), 3693);
  assert.equal(compare.statValue(judas, 's6', 'def'), 659);
  assert.equal(compare.statValue(judas, 's6', 'spd'), 25);
  // Winners at 6 stars: Eve takes ATK/SPD, Judas takes HP/DEF.
  assert.equal(compare.winnerFor(compare.statValue(eve, 's6', 'atk'), compare.statValue(judas, 's6', 'atk')), 'a');
  assert.equal(compare.winnerFor(compare.statValue(eve, 's6', 'hp'), compare.statValue(judas, 's6', 'hp')), 'b');
  assert.equal(compare.winnerFor(compare.statValue(eve, 's6', 'def'), compare.statValue(judas, 's6', 'def')), 'b');
  assert.equal(compare.winnerFor(compare.statValue(eve, 's6', 'spd'), compare.statValue(judas, 's6', 'spd')), 'a');
  assert.equal(compare.winnerFor(29, 29), 'tie');
});

test('eve vs judas awakened stats match the source JSONs', () => {
  // Eve awk: PATK 1712 / HP 3836 / DEF 668 / SPD 29.
  assert.equal(compare.statValue(eve, 'awk', 'atk'), 1712);
  assert.equal(compare.statValue(eve, 'awk', 'hp'), 3836);
  assert.equal(compare.statValue(eve, 'awk', 'def'), 668);
  assert.equal(compare.statValue(eve, 'awk', 'spd'), 29);
  // Judas awk: PATK 1457 / HP 4565 / DEF 728 / SPD 25.
  assert.equal(compare.statValue(judas, 'awk', 'atk'), 1457);
  assert.equal(compare.statValue(judas, 'awk', 'hp'), 4565);
  assert.equal(compare.statValue(judas, 'awk', 'def'), 728);
  assert.equal(compare.statValue(judas, 'awk', 'spd'), 25);
  // Winners awakened: Eve takes ATK/SPD, Judas takes HP/DEF.
  assert.equal(compare.winnerFor(compare.statValue(eve, 'awk', 'atk'), compare.statValue(judas, 'awk', 'atk')), 'a');
  assert.equal(compare.winnerFor(compare.statValue(eve, 'awk', 'hp'), compare.statValue(judas, 'awk', 'hp')), 'b');
  assert.equal(compare.winnerFor(compare.statValue(eve, 'awk', 'def'), compare.statValue(judas, 'awk', 'def')), 'b');
  assert.equal(compare.winnerFor(compare.statValue(eve, 'awk', 'spd'), compare.statValue(judas, 'awk', 'spd')), 'a');
});

test('heroes without awakening have no awakened stats to invent', () => {
  assert.equal(ariel.stats.awk, null, 'Ariel has no awakened stats in the source data');
  assert.equal(compare.statValue(ariel, 'awk', 'atk'), null);
  assert.equal(compare.statValue(ariel, 'awk', 'hp'), null);
  assert.equal(compare.winnerFor(compare.statValue(ariel, 'awk', 'hp'), compare.statValue(eve, 'awk', 'hp')), null);
  // Magic heroes use MATK, not PATK.
  assert.deepEqual(compare.attackStat(ariel.stats.s6), { key: 'MATK', value: 1389 });
  assert.equal(compare.statValue(ariel, 's6', 'atk'), 1389);
});

test('skills list names only, by type, awakened kit when the hero has one', () => {
  const eveSkills = compare.skillList(eve);
  assert.equal(eveSkills.length, 5, 'Eve must list 5 skills (incl. Awakened Skill)');
  assert.deepEqual(eveSkills.map(s => s.type),
    ['Basic Attack', 'Skill 1', 'Skill 2', 'Passive', 'Awakened Skill']);
  assert.equal(eveSkills.find(s => s.type === 'Skill 1').name, 'Time of Our Lives');
  assert.equal(eveSkills.find(s => s.type === 'Skill 2').name, 'Paradise for Two');
  assert.equal(eveSkills.find(s => s.type === 'Passive').name, 'Maker of Living Dolls');
  assert.equal(eveSkills.find(s => s.type === 'Awakened Skill').name, 'Dancing in Paradise');
  assert.equal(eveSkills.find(s => s.type === 'Basic Attack').label, 'Tấn công thường');
  const arielSkills = compare.skillList(ariel);
  assert.equal(arielSkills.length, 4, 'Ariel must list 4 skills (no Awakened Skill)');
  assert.ok(!arielSkills.some(s => s.type === 'Awakened Skill'), 'Ariel must not gain an Awakened Skill');
  assert.ok(!JSON.stringify(eveSkills).includes('100%'), 'skill list must not carry skill text/numbers');
});

test('tiers merge across both heroes; NOT USED displays as PHẾ', () => {
  assert.equal(compare.tierLabel('NOT USED'), 'PHẾ');
  assert.equal(compare.tierLabel('SS'), 'SS');
  const rows = compare.tierRows(eve, judas);
  const arena = rows.find(r => r.mode === 'arena');
  assert.deepEqual(arena.a, { tier: 'SS', tx: 'T6' });
  assert.deepEqual(arena.b, { tier: 'SSS', tx: 'T6' });
  assert.ok(rows.some(r => r.mode === 'advent-expedition' && r.a === null && r.b.tier === 'SSS'),
    'Judas-only modes must still show, with Eve blank');
  assert.equal(rows[0].mode, 'arena', 'Arena must sort first');
  const ameliaRows = compare.tierRows(amelia, eve);
  const ameliaArena = ameliaRows.find(r => r.mode === 'arena');
  assert.equal(ameliaArena.a.tier, 'NOT USED', 'Amelia is NOT USED in Arena in the source data');
  assert.equal(compare.tierLabel(ameliaArena.a.tier), 'PHẾ');
});

test('main build and dedicated equipment come from the hero JSON', () => {
  assert.equal(compare.mainBuild(eve).name, 'Crit-Focused');
  assert.deepEqual(compare.mainBuild(eve).gear.sets.map(s => s.name), ['Assassin']);
  assert.equal(eve.dedicated.name, "Eve's Not-Eve Eve");
  assert.equal(judas.dedicated.name, "Judas's Broken Sword");
  assert.equal(compare.mainBuild(judas).name, 'Crit-Focused');
});

test('compare CSS highlights the winner and stacks columns on mobile', () => {
  const css = read('compare.css');
  assert.ok(css.includes('.cp-win'), 'compare.css must style the winning stat');
  assert.ok(/\.cp-win\{[^}]*color:#15803d/.test(css), 'the winner must be green');
  assert.ok(/\.cp-win\{[^}]*font-weight:700/.test(css), 'the winner must be bold');
  assert.ok(css.includes('@media (max-width:700px)'), 'compare.css must stack the columns on mobile');
  assert.ok(css.includes('.cp-table td{display:block') || /\.cp-table[^{]*\{[^}]*display:block/.test(css),
    'mobile must render the table rows as stacked blocks');
});

test('new compare files never name the data source and stay light-only', () => {
  for (const file of ['so-sanh.html', 'compare.js', 'compare.css']) {
    assert.ok(!read(file).includes('Atlas'), file + ' must not mention the data source');
    assert.ok(!read(file).includes('prefers-color-scheme: dark'), file + ' must not contain a dark-mode rule');
  }
  const js = read('compare.js');
  assert.ok(js.includes('chưa thức tỉnh'), 'compare.js must note heroes without awakening');
  assert.ok(js.includes('PHẾ'), 'compare.js must display NOT USED as PHẾ');
});

test('heroes directory cards link each hero into the compare page', () => {
  const js = read('heroes.js');
  assert.ok(js.includes("so-sanh.html?a=' + esc(h.id)"), 'hero cards must link to so-sanh.html?a=<id>');
  assert.ok(js.includes('So sánh'), 'hero cards must show a "So sánh" button');
  assert.ok(js.includes("e.target.closest('.hx-compare-btn')") && js.includes('stopPropagation'),
    'clicking "So sánh" must not open the quick-build popup');
});
