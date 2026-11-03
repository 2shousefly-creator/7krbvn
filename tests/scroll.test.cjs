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
