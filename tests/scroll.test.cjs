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
});

test('popup shows real gear piece art, "Set 4" and the full dedicated line count', { skip: !JSDOM }, async () => {
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
  const html = dom.window.document.querySelector('.hx-modal-body').innerHTML;
  // Eileene is Universal (Physical weapon), active build set is Spellweaver (ID-Spell).
  // The piece art is a real 126px gear illustration, shown large (72px) next
  // to the main-stat rows — not a small icon on a dark chip.
  assert.ok(html.includes('assets/gearpieces/ID-Spell1.webp'), 'popup must show the real weapon piece art (Spellweaver, Physical)');
  assert.ok(html.includes('assets/gearpieces/ID-Spell3.webp'), 'popup must show the real armor piece art (Spellweaver)');
  assert.ok(html.includes('hx-with-piece'), 'popup gear art must sit in its own large thumbnail layout');
  assert.ok(!html.includes('assets/gearpieces/ID-Spell1.webp" alt="" loading="lazy"'), 'popup gear art must load immediately (no lazy) so it is visible on open');
  assert.ok(!html.includes('assets/gearui/'), 'popup must no longer use the generic weapon/armor icons');
  assert.ok(html.includes('Set 4 - Effect Hit Rate +35%.'), '"4pc" must render as "Set 4" in the popup');
  assert.ok(!html.includes('4pc'), 'no "4pc" should remain in the popup');
  assert.ok(html.includes('Nên build: Resilience +15% × 4'), 'dedicated equipment must show the full line count (Resilience +15% × 4)');
});
