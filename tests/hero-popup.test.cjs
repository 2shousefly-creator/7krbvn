/* Hero quick-build popup (hero-popup.js) render test — no jsdom needed.
 *
 * The jsdom popup tests (tests/guild-war-popup.test.cjs) are skipped when
 * jsdom is not installed, so this file renders the popup through a minimal
 * DOM stub instead and asserts on the real HTML it produces for real
 * heroes. Covers: overview below the portrait, build tabs, gear art,
 * accessories, dedicated lines.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..', 'public');
const popupJs = fs.readFileSync(path.join(root, 'hero-popup.js'), 'utf8');

function fakeEl() {
  const children = {};
  const el = {
    innerHTML: '',
    className: '',
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {},
    addEventListener() {},
    appendChild() {},
    querySelector(sel) {
      if (!children[sel]) children[sel] = fakeEl();
      return children[sel];
    },
  };
  return el;
}

function renderPopup(heroId, mutate) {
  const modal = fakeEl();
  const doc = {
    createElement() { return fakeEl(); },
    body: { appendChild() {}, style: {} },
    addEventListener() {},
  };
  const window = { HeroPopup: null };
  const sandbox = {
    document: doc,
    window,
    fetch: (u) => {
      const m = String(u).match(/data\/heroes\/([^/]+)\.json/);
      if (!m) return Promise.reject(new Error('unexpected fetch ' + u));
      const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', m[1] + '.json'), 'utf8'));
      if (mutate) mutate(data);
      return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
    },
    setTimeout,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  /* Capture the modal element the script creates. */
  doc.createElement = () => modal;
  vm.runInContext(popupJs, sandbox);
  sandbox.window.HeroPopup.open(heroId);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(modal.querySelector('.hx-modal-body').innerHTML);
    }, 50);
  });
}

test('popup renders the hero overview below the portrait (Vietnamese when available)', async () => {
  const eve = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'eve.json'), 'utf8'));
  const html = await renderPopup('eve');
  assert.ok(html.includes('hx-modal-hero'), 'popup must keep the portrait + name header');
  assert.ok(html.includes('hx-modal-overview'), 'popup must include the overview paragraph');
  const expected = (eve.vi && eve.vi.overview_desc) || eve.overview.desc;
  assert.ok(expected && html.includes(expected.slice(0, 60)),
    'popup overview must show Eve\'s description text');
  assert.ok(html.indexOf('hx-modal-overview') > html.indexOf('hx-modal-hero'),
    'overview must come after the portrait header');
  assert.ok(html.indexOf('hx-modal-overview') < html.indexOf('hx-modal-build'),
    'overview must come before the build section');
});

test('popup falls back to the English overview when no Vietnamese one exists', async () => {
  /* Every hero currently has vi.overview_desc, so the fallback is exercised
   * by rendering Eve with her Vietnamese overview removed. */
  const eve = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', 'eve.json'), 'utf8'));
  const html = await renderPopup('eve', (data) => { delete data.vi.overview_desc; });
  assert.ok(html.includes('hx-modal-overview'), 'popup must still show an overview');
  assert.ok(html.includes(eve.overview.desc.slice(0, 60)),
    'popup must fall back to the English overview description');
});

test('popup still renders build tabs, gear art, accessories and dedicated lines', async () => {
  const html = await renderPopup('eve');
  assert.ok(html.includes('hx-build-tabs') || html.includes('hx-modal-build'),
    'popup must render the build section');
  assert.ok(html.includes('assets/seticons/'), 'popup must show the gear-set icon');
  assert.ok(html.includes('assets/gearpieces/'), 'popup must show real gear piece art');
  assert.ok(html.includes('assets/acc/'), 'popup must show accessory rings');
  assert.ok(html.includes('Trang bị riêng'), 'popup must show the dedicated equipment');
});
