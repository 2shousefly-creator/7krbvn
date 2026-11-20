const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');

const compare = require(path.join(root, 'compare.js'));
const eve = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'eve.json'), 'utf8'));
const judas = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'judas.json'), 'utf8'));
const ariel = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'ariel.json'), 'utf8'));
const amelia = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'amelia.json'), 'utf8'));
const dellons = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'dellons.json'), 'utf8'));
const jupy = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'jupy.json'), 'utf8'));
const wukong = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'sun-wukong.json'), 'utf8'));
const bane = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'bane.json'), 'utf8'));
const fai = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'fai.json'), 'utf8'));
const melia = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'melia.json'), 'utf8'));

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function strip(html) { return html.replace(/<[^>]+>/g, ''); }

/* skill-card.js chạy trong Node qua vm để test dùng đúng hàm định dạng
 * hiệu ứng/mục tiêu như trên trình duyệt (window.SkillCard). */
function loadSkillCard() {
  const src = read('skill-card.js');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.SkillCard;
}
const SkillCard = loadSkillCard();

test('compare page: pickers, swap, share link, result area and scripts', () => {
  const html = read('so-sanh.html');
  assert.ok(html.includes('id="cp-search-a"'), 'so-sanh.html needs the first hero picker');
  assert.ok(html.includes('id="cp-search-b"'), 'so-sanh.html needs the second hero picker');
  assert.ok(html.includes('id="cp-swap"'), 'so-sanh.html needs the swap button');
  assert.ok(html.includes('id="cp-result"'), 'so-sanh.html needs the result container');
  assert.ok(html.includes('id="cp-copy-link"'), 'so-sanh.html needs the copy-share-link button');
  assert.ok(html.includes('href="compare.css"'), 'so-sanh.html must load compare.css');
  assert.ok(html.includes('src="compare.js"'), 'so-sanh.html must load compare.js');
  assert.ok(html.includes('src="skill-card.js"'), 'so-sanh.html must load skill-card.js for skill text formatting');
  assert.ok(html.indexOf('src="skill-card.js"') < html.indexOf('src="compare.js"'),
    'skill-card.js must load before compare.js');
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
    'so-sanh.html must highlight itself as a top-level nav link');
  assert.ok(!html.includes('data-parent="TRA CỨU"'), 'the retired TRA CỨU dropdown must be gone');
  assert.ok(html.includes('data-parent="CÔNG CỤ"'), 'so-sanh.html nav must have the CÔNG CỤ dropdown');
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

test('number formatting, bar widths and comparison notes', () => {
  assert.equal(compare.fmtNum(1500), '1.500');
  assert.equal(compare.fmtNum(29), '29');
  assert.equal(compare.fmtNum(4565), '4.565');
  // Bar width = value / max, one decimal, winner at 100%.
  assert.equal(compare.barWidth(1500, 1500), 100);
  assert.equal(compare.barWidth(1306, 1500), 87.1);
  assert.equal(compare.barWidth(25, 29), 86.2);
  assert.equal(compare.barWidth(null, 1500), 0);
  assert.equal(compare.barWidth(0, 0), 0);
  // Eve ATK 1500 vs Judas 1306 = 14.85% -> "Eve cao hơn 15% so với Judas".
  // Ghi chú luôn nêu tên người thắng trước, rồi % , rồi tên người thua.
  assert.deepEqual(compare.statNote(1500, 1306, 'Eve', 'Judas', {}),
    { text: 'Eve cao hơn 15% so với Judas', winner: 'a' });
  assert.deepEqual(compare.statNote(1306, 1500, 'Judas', 'Eve', {}),
    { text: 'Eve cao hơn 15% so với Judas', winner: 'b' });
  assert.deepEqual(compare.statNote(1001, 1000, 'Eve', 'Judas', {}),
    { text: 'Eve cao hơn không đáng kể so với Judas', winner: 'a' });
  assert.deepEqual(compare.statNote(29, 29, 'Eve', 'Judas', {}), { text: 'bằng nhau', winner: 'tie' });
  assert.deepEqual(compare.statNote(null, 3836, 'Ariel', 'Eve', { suffix: 'chỉ số Thức tỉnh' }),
    { text: 'chỉ Eve có chỉ số Thức tỉnh', winner: null });
  assert.deepEqual(compare.statNote(null, null, 'Ariel', 'Eve', {}), { text: null, winner: null });
  // PATK vs MATK: attack is attack — compare % like any other stat (user decision 2026-11-20).
  assert.deepEqual(compare.statNote(1500, 1389, 'Eve', 'Ariel', {}),
    { text: 'Eve cao hơn 8% so với Ariel', winner: 'a' });
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

test('skill detail carries the full Vietnamese text, cooldown and gauge', () => {
  const eveDetail = compare.skillDetail(eve);
  assert.equal(eveDetail.length, 5, 'Eve must detail 5 skill types');
  const s1 = eveDetail.find(s => s.type === 'Skill 1');
  assert.equal(s1.variants.length, 1, 'Eve S1 has a single variant (no conversion)');
  assert.equal(s1.variants[0].name, 'Time of Our Lives');
  assert.equal(s1.variants[0].cd, 84, 'Eve S1 cooldown is 84s in the source data');
  assert.equal(s1.variants[0].groups.length, 2, 'Eve S1 has 2 effect groups');
  assert.equal(s1.variants[0].groups[0].target, '3 Enemies');
  assert.ok(s1.variants[0].groups[0].lines[0].includes('100% tỉ lệ gây 8 Awakening Gauge Steal'),
    'Eve S1 full Vietnamese line must be present');
  assert.ok(s1.variants[0].groups[1].lines[0].includes('Nhận Weakness Hit Damage Boost'),
    'Eve S1 ally-group Vietnamese line must be present');
  assert.ok(s1.variants[0].tips.some(t => t.name === 'Buff Duration Reduction' && t.body.includes('Rút ngắn')),
    'Eve S1 effect explanations must be Vietnamese');
  const awk = eveDetail.find(s => s.type === 'Awakened Skill');
  assert.equal(awk.variants[0].name, 'Dancing in Paradise');
  assert.equal(awk.variants[0].gauge, 143, 'Eve Awakened Skill gauge is 143 in the source data');
  const basic = eveDetail.find(s => s.type === 'Basic Attack');
  assert.equal(basic.variants[0].name, 'Tấn công thường', 'nameless Basic Attack shows its type label');
  const arielDetail = compare.skillDetail(ariel);
  assert.equal(arielDetail.length, 4, 'Ariel must detail 4 skill types (no Awakened Skill)');
  assert.ok(!arielDetail.some(s => s.type === 'Awakened Skill'), 'Ariel must not gain an Awakened Skill');
});

test('converting skills render both TRƯỚC and SAU variants', () => {
  const dellonsDetail = compare.skillDetail(dellons);
  for (const type of ['Basic Attack', 'Skill 1', 'Skill 2']) {
    const entry = dellonsDetail.find(s => s.type === type);
    assert.ok(entry, 'Dellons must detail ' + type);
    assert.equal(entry.converts, true, 'Dellons ' + type + ' converts');
    assert.equal(entry.variants.length, 2, 'Dellons ' + type + ' must have 2 variants');
    assert.equal(entry.variants[0].stage, 'TRƯỚC');
    assert.equal(entry.variants[1].stage, 'SAU');
  }
  assert.equal(dellonsDetail.find(s => s.type === 'Passive').variants.length, 1, 'Dellons Passive does not convert');
  const jupyDetail = compare.skillDetail(jupy);
  const jupyS1 = jupyDetail.find(s => s.type === 'Skill 1');
  assert.equal(jupyS1.converts, true, 'Jupy S1 (Sniper Stance) converts to Swift Shots');
  assert.equal(jupyS1.variants.length, 2);
  const wukongDetail = compare.skillDetail(wukong);
  assert.equal(wukongDetail.find(s => s.type === 'Skill 1').variants.length, 2, 'Sun Wukong S1 converts');
  assert.equal(wukongDetail.find(s => s.type === 'Skill 2').variants.length, 2, 'Sun Wukong S2 converts');
});

test('skill detail never drops content: extra Vietnamese groups and English fallbacks', () => {
  // Dellons Basic (TRƯỚC): effects has 1 group, effects_vi has 2 — both render.
  const dellonsBasic = compare.skillDetail(dellons).find(s => s.type === 'Basic Attack');
  assert.equal(dellonsBasic.variants[0].groups.length, 2, 'Dellons Basic TRƯỚC must keep both Vietnamese groups');
  assert.ok(dellonsBasic.variants[0].groups[1].lines[0].includes('Giảm hồi chiêu'),
    'Dellons Basic second Vietnamese group must not be dropped');
  // Sun Wukong S2 (TRƯỚC): effects has 3 groups, effects_vi has 1 — the other
  // 2 groups fall back to the English lines instead of disappearing.
  const wukongS2 = compare.skillDetail(wukong).find(s => s.type === 'Skill 2');
  assert.equal(wukongS2.variants[0].groups.length, 3, 'Sun Wukong S2 TRƯỚC must keep all 3 groups');
  assert.equal(wukongS2.variants[0].groups[0].lang, 'vi');
  assert.equal(wukongS2.variants[0].groups[1].lang, 'en');
  assert.equal(wukongS2.variants[0].groups[2].lang, 'en');
  // Jupy S1 (TRƯỚC): no tips_vi anywhere, so the 3 effect explanations
  // fall back to English instead of vanishing.
  const jupyS1 = compare.skillDetail(jupy).find(s => s.type === 'Skill 1');
  assert.equal(jupyS1.variants[0].tips.length, 3, 'Jupy S1 TRƯỚC must keep its 3 effect explanations');
  assert.ok(jupyS1.variants[0].tips.every(t => t.lang === 'en'), 'Jupy S1 tips fall back to English');
  assert.ok(jupyS1.variants[0].tips[0].body.includes('The skill changes'),
    'Jupy S1 English tip body must be present as fallback');
  assert.equal(jupyS1.variants[1].tips.length, 0, 'Jupy S1 SAU (Swift Shots) has no effect explanations');
});

test('dedicated equipment lines group identical slots', () => {
  assert.deepEqual(compare.dedicatedLines(eve.dedicated), ['Crush +12% ×4', 'DMGAmp +4% ×4']);
  assert.deepEqual(compare.dedicatedLines(judas.dedicated), ['Crush +12% ×4', 'DMGAmp +4% ×4']);
});

test('dedicated equipment follows the active build ded_stat column', () => {
  // Eve build chính chọn Crush -> chỉ hiện cột Crush, không hiện cột DMGAmp.
  assert.deepEqual(compare.dedicatedLines(eve.dedicated, 'Crush'), ['Crush +12% ×4']);
  assert.deepEqual(compare.dedicatedLines(eve.dedicated, 'DMGAmp'), ['DMGAmp +4% ×4']);
  // ded_stat không khớp cột nào -> hiện cả 2 cột như khi không có ded_stat.
  assert.deepEqual(compare.dedicatedLines(eve.dedicated, 'Resilience'), ['Crush +12% ×4', 'DMGAmp +4% ×4']);
  assert.deepEqual(compare.dedicatedLines(eve.dedicated, ''), ['Crush +12% ×4', 'DMGAmp +4% ×4']);
  // Cột đã chọn mang đúng icon của chỉ số đó (Crush).
  assert.deepEqual(compare.dedicatedGroups(eve.dedicated, 'Crush'),
    [{ name: 'Crush', value: '+12%', count: 4, icon: 'Crush.webp' }]);
  // Khối Trang bị riêng trong trang so sánh: icon trang bị + cột ded_stat.
  const eveDedi = compare.dedicatedColHtml(eve);
  assert.ok(eveDedi.includes("assets/dedicated/Eve.webp"), 'dedicated column must show the dedicated art');
  assert.ok(eveDedi.includes("Eve's Not-Eve Eve"), 'dedicated column must name the dedicated equipment');
  assert.ok(eveDedi.includes('PATK +247'), 'dedicated column must show the main stat');
  assert.ok(eveDedi.includes('Crush +12% ×4'), 'dedicated column must show the picked column lines');
  assert.ok(!eveDedi.includes('DMGAmp'), 'dedicated column must not show the unpicked column');
  assert.ok(eveDedi.includes('assets/substats/Crush.webp'), 'dedicated lines must carry the stat icon');
  // Hero không có trang bị riêng (Bane) thì báo rõ, không bịa.
  assert.ok(!bane.dedicated || !bane.dedicated.name, 'Bane has no dedicated equipment in the source data');
  assert.ok(compare.dedicatedColHtml(bane).includes('Chưa có trang bị riêng.'),
    'heroes without dedicated equipment must say so');
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

test('main build detail mirrors the hero page build (set, gear pieces, main stats, substats, accessories, note)', () => {
  const eveBuild = compare.buildColHtml(eve);
  // Build Best (active) + tên build TIẾNG VIỆT.
  assert.ok(eveBuild.includes('BEST'), 'the build column must tag the active build as BEST');
  assert.ok(eveBuild.includes('Tập Trung Crit'), 'the build column must show the Vietnamese build name');
  assert.ok(!eveBuild.includes('Crit-Focused'), 'the build column must not show the English build name');
  // Set: icon + tên + hiệu ứng Set 4.
  assert.ok(eveBuild.includes('assets/seticons/Assassin.webp'), 'the build column must show the set icon');
  assert.ok(eveBuild.includes('Assassin'), 'the build column must name the set');
  assert.ok(eveBuild.includes('Set 4'), 'the set effect must read "Set 4", not "4pc"');
  assert.ok(eveBuild.includes('Crit Rate +30%'), 'the set effect text must be present');
  // Ảnh món đồ thật: Eve là Attack nên vũ khí variant 1, giáp variant 3.
  assert.ok(eveBuild.includes('assets/gearpieces/NMW-Assassin1.webp'), 'weapon piece art must be the set weapon (variant 1 for Attack)');
  assert.ok(eveBuild.includes('assets/gearpieces/NMW-Assassin3.webp'), 'armor piece art must be the set armor (variant 3)');
  // Chỉ số chính: Chính (tốt nhất × 2, in đậm) + Phụ.
  assert.ok(eveBuild.includes('Chỉ số chính Vũ khí'), 'the weapon main stat must be labelled');
  assert.ok(eveBuild.includes('Weakness Hit Chance × 2'), 'the best weapon main stat must render × 2');
  assert.ok(eveBuild.includes('Crit Rate × 2'), 'the alt weapon main stat (Phụ) must render × 2');
  assert.ok(eveBuild.includes('Chỉ số chính Giáp'), 'the armor main stat must be labelled');
  assert.ok(eveBuild.includes('Effect Resistance × 2'), 'the best armor main stat must render × 2');
  assert.ok(eveBuild.includes('All Attack % × 2'), 'the alt armor main stat (Phụ) must render × 2');
  // 4 dòng phụ ưu tiên đầu tiên, kèm icon, theo đúng thứ tự.
  assert.ok(eveBuild.includes('ƯU TIÊN DÒNG PHỤ'), 'the substat priority list must be labelled');
  for (const icon of ['assets/substats/Speed.webp', 'assets/substats/Crit.webp', 'assets/substats/WeaknessHit.webp', 'assets/substats/EffectRes.webp']) {
    assert.ok(eveBuild.includes(icon), 'the first 4 substats must carry their icons (' + icon + ')');
  }
  assert.ok(eveBuild.indexOf('assets/substats/Speed.webp') < eveBuild.indexOf('assets/substats/Crit.webp'),
    'substats must stay in priority order (Speed before Crit)');
  assert.ok(!eveBuild.includes('assets/substats/CritDMG.webp'),
    'only the first 4 substats render — the 5th (CritDMG) must not appear');
  // Cặp phụ kiện Best: nhẫn chính + nhẫn tinh luyện, icon + tên + giá trị.
  assert.ok(eveBuild.includes('PHỤ KIỆN'), 'the accessories must be labelled');
  assert.ok(eveBuild.includes('NHẪN CHÍNH'), 'the main ring must be labelled');
  assert.ok(eveBuild.includes('NHẪN TINH LUYỆN'), 'the sub ring must be labelled');
  assert.ok(eveBuild.includes('assets/acc/L-Revive.webp'), 'the main ring icon must render');
  assert.ok(eveBuild.includes('Revive') && eveBuild.includes('100% HP'), 'the main ring name and value must render');
  assert.ok(eveBuild.includes('assets/acc/L-Immortal.webp'), 'the sub ring icon must render');
  assert.ok(eveBuild.includes('Immortal') && eveBuild.includes('3 turns'), 'the sub ring name and value must render');
  // Ghi chú build bằng tiếng Việt (từ hero.vi.builds), không phải bản tiếng Anh.
  assert.ok(eveBuild.includes('Với 50% Crit Rate'), 'the build note must be the Vietnamese gear note');
  // Hero Phép thuật dùng ảnh vũ khí variant 2.
  const arielBuild = compare.buildColHtml(ariel);
  assert.ok(arielBuild.includes('assets/gearpieces/ID-Avenger2.webp'), 'Magic heroes use weapon variant 2');
  assert.ok(arielBuild.includes('assets/gearpieces/ID-Avenger3.webp'), 'armor is always variant 3');
  assert.ok(arielBuild.includes('assets/seticons/Avenger.webp'), 'Ariel set icon must render');
  // Hero không có build nào thì báo rõ, không bịa đồ.
  assert.equal(compare.mainBuild({ builds: [] }), null);
  assert.ok(compare.buildColHtml({ id: 'x', name: 'X', builds: [] }).includes('Chưa có hướng dẫn build cho hero này.'),
    'heroes without builds must say so');
  // Ghi chú build lấy đúng bản tiếng Việt của build đang active.
  assert.ok(compare.gearNoteFor(eve, compare.mainBuild(eve)).includes('Với 50% Crit Rate'),
    'gearNoteFor must prefer the Vietnamese note of the active build');
  assert.equal(compare.gearNoteFor({ builds: [{ gear_notes: 'English note' }] }, { gear_notes: 'English note' }), 'English note',
    'gearNoteFor falls back to the English note when no Vietnamese note exists');
});

test('build names are Vietnamese (BUILD_VI), falling back to English when unmapped', () => {
  assert.equal(compare.buildNameVi('Crit-Focused'), 'Tập Trung Crit');
  assert.equal(compare.buildNameVi('Some Future Build'), 'Some Future Build',
    'a build name missing from the map must keep its English name');
  assert.ok(compare.buildColHtml(judas).includes('Tập Trung Crit'),
    'both heroes render the Vietnamese build name');
});

test('BUILD_VI map in compare.js stays in sync with hero-detail.js', () => {
  function extractMap(src) {
    const start = src.indexOf('var BUILD_VI = {');
    assert.ok(start >= 0, 'BUILD_VI must exist');
    const end = src.indexOf('\n  };', start);
    return src.slice(start, end + '\n  };'.length);
  }
  const inCompare = extractMap(read('compare.js'));
  const inDetail = extractMap(read('hero-detail.js'));
  assert.equal(inCompare, inDetail,
    'compare.js must mirror hero-detail.js BUILD_VI exactly — edit both files together');
});

test('different attack types compare % like any other stat (no PATK/MATK note)', () => {
  /* Nối tiếp lỗi user báo 2026-11-20 (Fai vs Melia): ghi chú "Fai dùng
   * PATK, Melia dùng MATK" từng lọt xuống cả HP lẫn DEF. User quyết định
   * 2026-11-20: tấn công cũng so % như bình thường. Fai: PATK 1500 / HP
   * 3326 / DEF 571 / SPD 29; Melia: MATK 1500 / HP 7255 / DEF 1580 /
   * SPD 29. */
  const html = compare.renderCompareHtml(fai, melia, SkillCard);
  assert.ok(!html.includes('dùng PATK') && !html.includes('dùng MATK'),
    'no stat block may show the attack-type note any more');
  assert.equal((html.match(/bằng nhau/g) || []).length, 2,
    'Attack (1500 vs 1500) and SPD (29 vs 29) must both say equal');
  assert.ok(html.includes('Melia cao hơn 118% so với Fai'), 'HP block must compare % (7255 vs 3326)');
  assert.ok(html.includes('Melia cao hơn 177% so với Fai'), 'DEF block must compare % (1580 vs 571)');
  assert.ok(html.includes('Tấn công (PATK/MATK)'), 'the Attack title still shows both attack types');
  assert.ok(html.includes('cp-num cp-win'), 'Melia HP/DEF values must carry the winner class');
});

test('rendered comparison: glance blocks, proportional bars, winner note', () => {
  const html = compare.renderCompareHtml(eve, judas, SkillCard);
  assert.ok(!html.includes('<table'), 'the new layout must not use a table');
  assert.ok(html.includes('cp-legend'), 'every card must carry the two-hero legend');
  assert.ok(html.includes('Eve') && html.includes('Judas'), 'the legend must name both heroes');
  for (const title of ['Tổng quan', 'Chỉ số 6★', 'Chỉ số Thức tỉnh', 'Kỹ năng', 'Xếp hạng theo chế độ', 'Build chính', 'Trang bị riêng']) {
    assert.ok(html.includes(title), 'rendered comparison must have the "' + title + '" section');
  }
  // Eve ATK bar is full width, Judas ATK bar is proportional (1306/1500 = 87.1%).
  assert.ok(html.includes('width:100%'), 'the winning value bar must be full width');
  assert.ok(html.includes('width:87.1%'), 'the losing ATK bar must be proportional (87.1%)');
  assert.ok(html.includes('Eve cao hơn 15% so với Judas'), 'the ATK block note must name the winner first');
  assert.ok(html.includes('Judas cao hơn 11% so với Eve'), 'the HP block note must name Judas as the winner');
  assert.ok(html.includes('1.500'), 'values must use Vietnamese thousand separators');
  // Winner value is green and bold.
  assert.ok(html.includes('cp-num cp-win'), 'the winning value must carry the winner class');
  // Skill block: full Vietnamese text, translated target, cooldown, gauge.
  assert.ok(html.includes('3 kẻ địch'), 'skill targets must be translated to Vietnamese');
  assert.ok(strip(html).includes('Gây sát thương bằng 92% Physical Attack cộng 9% Max HP của mục tiêu, 2 lần'),
    'Eve S1 full Vietnamese effect text must render inline');
  assert.ok(html.includes('Hồi chiêu: 84s'), 'Eve S1 cooldown must render');
  assert.ok(html.includes('Awakening Gauge: 143'), 'Eve Awakened Skill gauge must render');
  assert.ok(strip(html).includes('Rút ngắn thời gian duy trì của buff'),
    'skill effect explanations must render inline');
  // Tiers: badges, no bars; PHẾ for Amelia.
  const ameliaHtml = compare.renderCompareHtml(amelia, eve, SkillCard);
  assert.ok(ameliaHtml.includes('cp-tier-phe') && ameliaHtml.includes('PHẾ'), 'Amelia Arena row must show PHẾ');
  // One hero without awakening: the awk section says only Eve has the stats.
  const arielHtml = compare.renderCompareHtml(ariel, eve, SkillCard);
  assert.ok(arielHtml.includes('chỉ Eve có chỉ số Thức tỉnh'), 'Ariel vs Eve must note only Eve has awakened stats');
  // Detail links stay as a secondary option.
  assert.ok(html.includes('hero.html?id=eve') && html.includes('Xem chi tiết Eve'),
    'the rendered comparison must keep the hero detail links');
});

test('rendered comparison without SkillCard still works (plain fallback)', () => {
  const html = compare.renderCompareHtml(eve, judas, null);
  assert.ok(html.includes('cp-card'), 'fallback rendering must still produce the cards');
  assert.ok(html.includes('3 Enemies'), 'without SkillCard the target stays English (fallback)');
  assert.ok(strip(html).includes('Gây sát thương bằng 92%'), 'fallback must still show the Vietnamese lines');
  assert.equal(compare.renderCompareHtml(null, null, SkillCard), '', 'no heroes selected renders nothing');
});

test('compare CSS: glance blocks, bars, legend, mobile stacking', () => {
  const css = read('compare.css');
  assert.ok(css.includes('.cp-card'), 'compare.css must style the glance cards');
  assert.ok(css.includes('.cp-legend'), 'compare.css must style the legend');
  assert.ok(css.includes('.cp-block'), 'compare.css must style the comparison blocks');
  assert.ok(css.includes('.cp-bar'), 'compare.css must style the proportional bars');
  assert.ok(css.includes('.cp-a .cp-bar i'), 'hero A bar must have its own color');
  assert.ok(css.includes('.cp-b .cp-bar i'), 'hero B bar must have its own color');
  assert.ok(css.includes('.cp-win'), 'compare.css must style the winning stat');
  assert.ok(/\.cp-win\{[^}]*color:#15803d/.test(css), 'the winner must be green');
  assert.ok(/\.cp-win\{[^}]*font-weight:700/.test(css), 'the winner must be bold');
  assert.ok(css.includes('@media (max-width:700px)'), 'compare.css must stack the columns on mobile');
  assert.ok(css.includes('.cp-vals{grid-template-columns:1fr'), 'mobile must stack the two value columns');
  assert.ok(css.includes('.cp-skill-cols{grid-template-columns:1fr'), 'mobile must stack the skill columns');
  assert.ok(!css.includes('.cp-table'), 'the old table layout must be gone from compare.css');
  // Full build detail: build column sizing for the shared hx-* classes.
  assert.ok(css.includes('.cp-build'), 'compare.css must style the build detail columns');
  assert.ok(css.includes('.cp-mini-label'), 'compare.css must style the build sub-labels');
  assert.ok(css.includes('.cp-build .hx-mainstats{grid-template-columns:1fr'),
    'the build main stats must stack in one column (half-width compare column)');
  assert.ok(css.includes('.cp-build .hx-mainstat .hx-piece{width:64px;height:64px}'),
    'the gear piece art must use the compact popup size in the compare columns');
  assert.ok(css.includes('.cp-build .hx-substats img'), 'compare.css must size the substat icons');
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
