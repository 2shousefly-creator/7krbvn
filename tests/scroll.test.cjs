/* Scroll preservation on the hero detail page (hero-detail.js).
 *
 * Tab switching must keep the reader's scroll position, both in place
 * (scrollTo called with the saved scrollY) and across a reload
 * (sessionStorage round-trip on boot). This is a jsdom test; it is skipped
 * when jsdom is not installed (npm install jsdom --no-save to enable).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  // jsdom is a dev-only dependency for this test.
}

const root = path.join(__dirname, '..', 'public');
const heroHtml = fs.readFileSync(path.join(root, 'hero.html'), 'utf8')
  .replace('<script src="hero-detail.js" defer></script>', '');
const detailJs = fs.readFileSync(path.join(root, 'hero-detail.js'), 'utf8');
const indexJson = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes-index.json'), 'utf8'));
const eileeneJson = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'eileene.json'), 'utf8'));

function makeDom(url, seedScroll, fakeScrollY) {
  const calls = { scrollTo: [], fetch: [] };
  const dom = new JSDOM(heroHtml + '<script>' + detailJs + '</script>', {
    url,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.fetch = (u) => {
        calls.fetch.push(u);
        const body = String(u).includes('heroes-index.json') ? indexJson : eileeneJson;
        return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
      };
      window.scrollTo = (x, y) => { calls.scrollTo.push([x, y]); };
      window.requestAnimationFrame = (cb) => { cb(); return 1; };
      Object.defineProperty(window, 'scrollY', { value: fakeScrollY, configurable: true });
      Object.defineProperty(window, 'pageYOffset', { value: fakeScrollY, configurable: true });
      if (seedScroll != null) {
        window.sessionStorage.setItem('hx-scroll:eileene:builds', String(seedScroll));
      }
    },
  });
  return { dom, calls };
}

const tick = () => new Promise((r) => setTimeout(r, 50));

test('tab switching preserves the scroll position in place and across reload', { skip: !JSDOM }, async () => {
  const { dom, calls } = makeDom('https://7krb.io.vn/hero.html?id=eileene', null, 2500);
  await tick();
  const doc = dom.window.document;
  assert.ok(doc.querySelector('#hx-content').textContent.includes('Tổng quan hero'),
    'main tab must render first');
  assert.equal(dom.window.sessionStorage.length, 0, 'no saved scroll before any switch');

  doc.getElementById('hx-tab-builds').click();
  await tick();
  assert.ok(doc.querySelector('#hx-content').textContent.includes('Trang bị'),
    'builds tab must render after click');
  assert.equal(dom.window.sessionStorage.getItem('hx-scroll:eileene:builds'), '2500',
    'tab switch must save the scroll position per hero+tab');
  assert.ok(calls.scrollTo.some(([, y]) => y === 2500),
    `scrollTo must be called with the saved position (got ${JSON.stringify(calls.scrollTo)})`);

  calls.scrollTo.length = 0;
  doc.getElementById('hx-tab-main').click();
  await tick();
  assert.equal(dom.window.sessionStorage.getItem('hx-scroll:eileene:main'), '2500',
    'switching back must save the scroll position for the main tab');
  assert.ok(calls.scrollTo.some(([, y]) => y === 2500),
    'switching back must also restore the scroll position');

  const reloaded = makeDom('https://7krb.io.vn/hero.html?id=eileene&tab=builds', 2500, 0);
  await tick();
  assert.ok(reloaded.calls.scrollTo.some(([, y]) => y === 2500),
    `boot must restore the saved scroll position (got ${JSON.stringify(reloaded.calls.scrollTo)})`);
  assert.equal(reloaded.dom.window.sessionStorage.getItem('hx-scroll:eileene:builds'), null,
    'the saved scroll key must be consumed on boot (no stale restore later)');
});

test('skill targets translate to Vietnamese and effects are explained', { skip: !JSDOM }, async () => {
  const { dom } = makeDom('https://7krb.io.vn/hero.html?id=eileene', null, 0);
  await tick();
  const text = dom.window.document.querySelector('#hx-content').textContent;
  // Eileene's S2 targets All Enemies, her S1 targets 3 Enemies.
  assert.ok(text.includes('Tất cả kẻ địch'), 'All Enemies must render as "Tất cả kẻ địch"');
  assert.ok(text.includes('3 kẻ địch'), '3 Enemies must render as "3 kẻ địch"');
  assert.ok(!text.includes('All Enemies'), 'no English target scope should remain in the skills');
  // Effect explanations: "Pierce - Xuyên thủng: <translated Atlas explanation>".
  assert.ok(text.includes('Pierce - Xuyên thủng:'), 'Pierce must show its Vietnamese name');
  assert.ok(text.includes('Bỏ qua các hiệu ứng miễn nhiễm sát thương trên mục tiêu.'),
    'Pierce must show the translated Atlas explanation');
  assert.ok(text.includes('Shock - Sốc điện:'), 'Shock must show its Vietnamese name');
  /* Target scopes render as a pill tag with a border. */
  const html = dom.window.document.querySelector('#hx-content').innerHTML;
  assert.ok(html.includes('<div class="hx-skill-target">3 kẻ địch</div>'), 'skill target scope must render as a tag');
  /* Bad effects on enemies are bold + red; good effects on self/allies
   * bold + blue; neutral mechanics bold only. Eileene's Lightning Spear:
   * Shock and Defense Reduction are red; Pierce (tx T2) is neutral;
   * Incoming Healing Reduction (tx T6) is red. */
  assert.ok(html.includes('<b class="hx-fx-bad">Shock</b>'), 'Shock in a skill line must be bold + red');
  assert.ok(html.includes('<b class="hx-fx-bad">Defense Reduction</b>'), 'Defense Reduction in a skill line must be bold + red');
  assert.ok(html.includes('<b>Pierce</b>'), 'Pierce must stay bold without a color (neutral damage mechanic)');
  assert.ok(!html.includes('hx-fx-bad">Pierce'), 'Pierce must not be colored red');
  assert.ok(html.includes('<b class="hx-fx-bad">Incoming Healing Reduction</b>'), 'Incoming Healing Reduction (tx T6) must be bold + red');
  /* The "Hiệu ứng" explanation section is NOT colored. */
  const fxlist = dom.window.document.querySelector('.hx-fxlist');
  assert.ok(fxlist && !fxlist.innerHTML.includes('hx-fx-bad') && !fxlist.innerHTML.includes('hx-fx-good'),
    'the effect-explanation section must not be colored');
  /* A good effect: Eileene's Immortal Rage revives (enhancement/tx). */
  assert.ok(html.includes('<b class="hx-fx-good">Revive</b>') || html.includes('hx-fx-good'),
    'a good effect (e.g. Revive) must be bold + blue somewhere in the skills');
});

test('popup: build tabs (Atlas style), real gear piece art, accessories, bold dedicated lines', { skip: !JSDOM }, async () => {
  const popupJs = fs.readFileSync(path.join(root, 'hero-popup.js'), 'utf8');
  const trigger = '<a href="#" data-hero-popup="eileene">Eileene</a>';
  const dom = new JSDOM('<!doctype html><html><body>' + trigger + '</body></html><script>' + popupJs + '</script>', {
    url: 'https://7krb.io.vn/heroes.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.fetch = (u) => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(String(u).includes('heroes-index.json') ? indexJson : eileeneJson),
      });
    },
  });
  dom.window.document.querySelector('[data-hero-popup]').click();
  await tick();
  await tick();
  const body = dom.window.document.querySelector('.hx-modal-body');
  let html = body.innerHTML;
  /* Build tabs: Eileene has 4 builds; default tab is the active one (Build 1). */
  assert.ok(html.includes('data-popup-build="0"'), 'popup must have a Build 1 tab');
  assert.ok(html.includes('data-popup-build="3"'), 'popup must have a Build 4 tab for Eileene');
  assert.ok(html.includes('Build 1'), 'popup tabs must be labelled Build 1 / Build 2 / ...');
  /* No more Chính/Phụ rows in the popup — build tabs replace them. */
  assert.ok(!html.includes('hx-ms-tag'), 'popup must not show Chính/Phụ main-stat rows (build tabs replace them)');
  assert.ok(!html.includes('Chính') && !html.includes('Phụ'), 'popup must not mention Chính/Phụ at all');
  // Eileene is Universal (Physical weapon), active build set is Spellweaver (ID-Spell).
  // The piece art is a real 126px gear illustration, shown large (72px) next
  // to the main-stat rows — not a small icon on a dark chip.
  assert.ok(html.includes('assets/gearpieces/ID-Spell1.webp'), 'popup must show the real weapon piece art (Spellweaver, Physical)');
  assert.ok(html.includes('assets/gearpieces/ID-Spell3.webp'), 'popup must show the real armor piece art (Spellweaver)');
  assert.ok(html.includes('hx-with-piece'), 'popup gear art must sit in its own large thumbnail layout');
  assert.ok(html.includes('class="hx-mainstats" style="grid-template-columns:1fr"'),
    'popup main-stats must force a single column inline (stylesheet override alone did not take effect in the live browser)');
  assert.ok(!html.includes('assets/gearpieces/ID-Spell1.webp" alt="" loading="lazy"'), 'popup gear art must load immediately (no lazy) so it is visible on open');
  assert.ok(!html.includes('assets/gearui/'), 'popup must no longer use the generic weapon/armor icons');
  assert.ok(html.includes('Set 4 - Effect Hit Rate +35%.'), '"4pc" must render as "Set 4" in the popup');
  assert.ok(!html.includes('4pc'), 'no "4pc" should remain in the popup');
  /* Accessories: Build 1 best option is Immortal (main) + Guts (sub). */
  assert.ok(html.includes('PHỤ KIỆN'), 'popup must have an Accessories section');
  assert.ok(html.includes('assets/acc/L-Immortal.webp'), 'popup must show the main accessory ring image (Immortal)');
  assert.ok(html.includes('assets/acc/L-Guts.webp'), 'popup must show the sub accessory ring image (Guts)');
  /* Dedicated: stat name + value bold, full line count, with the stat icon. */
  assert.ok(html.includes('<b>Resilience +15% × 4</b>'), 'dedicated stat name, value and line count must all be bold');
  assert.ok(html.includes('assets/substats/Resilience.webp'), 'dedicated lines must show the stat icon from the data');
  assert.ok(!html.includes('Nên build'), 'popup dedicated must not say "Nên build"');
  /* Gear art is compact in the popup (64px, uniform), not the 110px detail size. */
  assert.ok(html.includes('assets/gearpieces/ID-Spell1.webp'), 'popup must still show the real weapon piece art');
  /* Main stats show "× 2" (2 slots per weapon/armor) and are bold. */
  assert.ok(html.includes('<b>Crit Rate × 2</b>'), 'popup weapon main stat must be bold with "× 2"');
  assert.ok(html.includes('<b>Damage Taken Reduction × 2</b>'), 'popup armor main stat must be bold with "× 2"');
  /* Substat priority below stays as-is (no "× 2" there). */
  const subs = body.querySelector('.hx-substats');
  assert.ok(subs && !subs.textContent.includes('× 2'), 'substat priority must not show "× 2"');
  /* Actions are fixed at the bottom of the card, outside the scroll body. */
  const card = dom.window.document.querySelector('.hx-modal-card');
  assert.ok(card.querySelector(':scope > .hx-modal-actions'), 'popup actions must sit outside the scrollable body (fixed footer)');
  assert.ok(card.querySelector(':scope > .hx-modal-actions').textContent.includes('Chi tiết'), 'fixed footer must have the Chi tiết button');
  assert.ok(card.querySelector(':scope > .hx-modal-actions').textContent.includes('Xem build'), 'fixed footer must have the Xem build button');
  /* Switch to Build 2 (Avenger set) and confirm the popup re-renders. */
  body.querySelector('[data-popup-build="1"]').click();
  await tick();
  html = body.innerHTML;
  assert.ok(html.includes('assets/gearpieces/ID-Avenger1.webp'), 'Build 2 tab must show the Avenger weapon piece art');
  assert.ok(html.includes('assets/gearpieces/ID-Avenger3.webp'), 'Build 2 tab must show the Avenger armor piece art');
  assert.ok(!html.includes('assets/gearpieces/ID-Spell1.webp'), 'Build 2 tab must not show Build 1 gear art');
  assert.ok(html.includes('<b>Damage Amplification +4% × 4</b>'), 'Build 2 dedicated must show its own pick (Damage Amplification +4% × 4)');
});

test('skill notes in brackets translate to Vietnamese and key values are bold', { skip: !JSDOM }, async () => {
  const { dom } = makeDom('https://7krb.io.vn/hero.html?id=eileene', null, 0);
  await tick();
  const html = dom.window.document.querySelector('#hx-content').innerHTML;
  /* Bracketed notes: Duration / Max Stack / effect names. */
  assert.ok(html.includes('[Kéo dài: 2 lượt]'), '[Duration: 2 Turn(s)] must render as "[Kéo dài: 2 lượt]"');
  assert.ok(html.includes('[Tối đa 4 cộng dồn]'), '[Max 4 Stack(s)] must render as "[Tối đa 4 cộng dồn]"');
  assert.ok(html.includes('[Sốc điện]'), '[Shock] must render as "[Sốc điện]"');
  assert.ok(!html.includes('[Duration:'), 'no English Duration note should remain in the skills');
  assert.ok(!html.includes('[Max 4 Stack'), 'no English Max Stack note should remain in the skills');
  /* Bold: percentages, damage types, effect names. */
  assert.ok(html.includes('<b>61%</b>'), 'damage percentages must be bold');
  assert.ok(html.includes('<b>Physical Attack</b>'), 'damage type Physical Attack must be bold');
  assert.ok(html.includes('<b>Shock</b>'), 'effect name Shock must be bold in the skill text');
});

test('builds tab: real gear piece art, horizontal accessories, dedicated without A/B headings, Vietnamese build names', { skip: !JSDOM }, async () => {
  const { dom } = makeDom('https://7krb.io.vn/hero.html?id=eileene&tab=builds', null, 0);
  await tick();
  const doc = dom.window.document;
  const html = doc.querySelector('#hx-content').innerHTML;
  /* Build names translated in Title Case (Eileene build 1 "Shock Them All"). */
  assert.ok(html.includes('Choáng Tất Cả'), 'build list must show the Vietnamese build name in Title Case');
  assert.ok(!html.includes('>Shock Them All<'), 'build list must not show the English build name as the label');
  /* The best (active) build carries a BEST tag. */
  assert.ok(html.includes('<span class="hx-best-tag">BEST</span>'), 'the best build option must carry a BEST tag');
  assert.ok(html.includes('BEST</span>Choáng Tất Cả'), 'the BEST tag must sit before the best build name');
  /* Gears: real piece art like the popup, not the generic icons. */
  assert.ok(html.includes('assets/gearpieces/ID-Spell1.webp'), 'builds tab must show the real weapon piece art');
  assert.ok(html.includes('assets/gearpieces/ID-Spell3.webp'), 'builds tab must show the real armor piece art');
  assert.ok(!html.includes('assets/gearui/'), 'builds tab must no longer use the generic weapon/armor icons');
  /* Main stats: Chính row bold with "× 2", Phụ row "× 2" but not bold. */
  assert.ok(html.includes('<b>Crit Rate × 2</b>'), 'builds tab weapon main stat must be bold with "× 2"');
  assert.ok(html.includes('<b>Damage Taken Reduction × 2</b>'), 'builds tab armor main stat must be bold with "× 2"');
  assert.ok(html.includes('Weakness Hit Chance × 2'), 'builds tab sub main stat must show "× 2"');
  assert.ok(!html.includes('<b>Weakness Hit Chance × 2</b>'), 'builds tab sub main stat must not be bold');
  /* Substat priority below stays as-is (no "× 2" there). */
  const subsEl = doc.querySelector('.hx-substats');
  assert.ok(subsEl && !subsEl.textContent.includes('× 2'), 'substat priority must not show "× 2"');
  /* Accessories: horizontal — main + sub rings side by side with a + between. */
  assert.ok(html.includes('hx-acc-pair'), 'accessories must render horizontally (main + sub in one row)');
  assert.ok(html.includes('assets/acc/L-Immortal.webp'), 'accessories must show the main ring image');
  assert.ok(html.includes('assets/acc/L-Guts.webp'), 'accessories must show the sub ring image');
  assert.ok(html.includes('NHẪN CHÍNH') && html.includes('NHẪN TINH LUYỆN'), 'accessory sides must be labelled in Vietnamese');
  assert.ok(html.includes('Tốt nhất'), 'accessory option "Best" must render as "Tốt nhất"');
  /* Dedicated: no "Dòng phụ A/B" headings; the pink frame marks the pick. */
  assert.ok(!html.includes('Dòng phụ A'), 'dedicated must not show the "Dòng phụ A" heading');
  assert.ok(!html.includes('Dòng phụ B'), 'dedicated must not show the "Dòng phụ B" heading');
  assert.ok(!html.includes('Build này'), 'dedicated must not show the "Build này" label');
  assert.ok(html.includes('hx-de-col this'), 'the picked dedicated column must carry the pink frame');
  assert.ok(html.includes('<b style="min-width:0">Resilience</b>'), 'dedicated substat name must be bold');
});

test('skill Transcendence T2 and T6 get a prominent tag and a frame', { skip: !JSDOM }, async () => {
  const { dom } = makeDom('https://7krb.io.vn/hero.html?id=eileene', null, 0);
  await tick();
  const html = dom.window.document.querySelector('#hx-content').innerHTML;
  /* Eileene's skills have T2/T4/T6 transcendence lines. T2 and T6 get a
   * tag + frame; T4 stays a plain line. */
  assert.ok(html.includes('<span class="hx-tx-tag">T2</span>'), 'T2 must render as a prominent tag');
  assert.ok(html.includes('<span class="hx-tx-tag">T6</span>'), 'T6 must render as a prominent tag');
  assert.ok(html.includes('hx-tx-box'), 'T2/T6 effects must sit inside a frame');
  assert.ok(!html.includes('<span class="hx-tx-tag">T4</span>'), 'T4 must not get the prominent tag');
});
