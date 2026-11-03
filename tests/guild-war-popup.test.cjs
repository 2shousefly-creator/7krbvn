/* Hero popup on the Guild War page (build -20).
 *
 * Clicking ANY hero portrait on the Guild War page must open the HEROES
 * detail popup (hero-popup.js) — in list cards, in the team detail sheet
 * and in the formation boards — without opening the team detail sheet
 * underneath. Clicking the rest of a list card still opens its team.
 * This is a jsdom test; it is skipped when jsdom is not installed
 * (npm install jsdom --no-save to enable).
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
const gwHtml = fs.readFileSync(path.join(root, 'guild-war-team.html'), 'utf8')
  .replace('<script src="hero-popup.js" defer></script>', '');
const popupJs = fs.readFileSync(path.join(root, 'hero-popup.js'), 'utf8');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function makeDom() {
  const dom = new JSDOM(gwHtml + '<script>' + popupJs + '</script>', {
    url: 'https://7krb.io.vn/guild-war-team.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.fetch = (u) => {
        const m = String(u).match(/data\/heroes\/([^/]+)\.json/);
        if (!m) return Promise.reject(new Error('unexpected fetch ' + u));
        const file = path.join(root, 'data', 'heroes', m[1] + '.json');
        if (!fs.existsSync(file)) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error('404')) });
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
      };
    },
  });
  return dom;
}

function click(el) {
  el.dispatchEvent(new el.ownerDocument.defaultView.MouseEvent('click', { bubbles: true, cancelable: true }));
}

async function openPopup(doc, el) {
  click(el);
  await sleep(100);
  const modal = doc.querySelector('.hx-modal');
  assert.ok(modal && modal.classList.contains('open'), 'hero popup must open on portrait click');
  return modal;
}

if (!JSDOM) {
  test('guild war hero popup (skipped: jsdom not installed)', () => {
    test.skip('jsdom is not installed');
  });
} else {
  test('guild war page renders 48 defense teams and 114 counters', async () => {
    const { window } = makeDom();
    const doc = window.document;
    await sleep(50);
    const tabs = [...doc.querySelectorAll('#tabs .tab')].map(t => t.textContent.replace(/\s+/g, ''));
    assert.ok(tabs.some(t => t.startsWith('Tấtcả48')), 'Tất cả tab must count 48, got ' + tabs.join('|'));
    assert.ok(tabs.some(t => t.startsWith('Physical21')), 'Physical tab must count 21');
    assert.ok(tabs.some(t => t.startsWith('Magic10')), 'Magic tab must count 10');
    assert.ok(tabs.some(t => t.startsWith('Thưviệnkhắcchế114')), 'counter library tab must count 114');
    assert.equal(doc.querySelectorAll('#list [data-team]').length, 48, 'all tab must render 48 defense cards');
    const ctrTab = [...doc.querySelectorAll('#tabs .tab')].find(t => t.textContent.includes('Thư viện khắc chế'));
    click(ctrTab);
    await sleep(50);
    assert.equal(doc.querySelectorAll('#list [data-counter]').length, 114, 'counter tab must render 114 counter cards');
  });

  test('portrait click in a list card opens the hero popup, not the team sheet', async () => {
    const { window } = makeDom();
    const doc = window.document;
    await sleep(50);
    const firstCard = doc.querySelector('#list [data-team]');
    const portrait = firstCard.querySelector('[data-hero-popup]');
    assert.ok(portrait, 'list card must have a popup portrait');
    assert.equal(portrait.getAttribute('data-hero-popup'), 'tanjiro-kamado', 'T1 first portrait is Tanjiro Kamado');
    const modal = await openPopup(doc, portrait);
    assert.ok(!doc.getElementById('overlay').classList.contains('open'), 'team sheet must NOT open under the popup');
    assert.match(modal.textContent, /Tanjiro/, 'popup must show the clicked hero');
    const closeBtn = modal.querySelector('.hx-modal-close');
    assert.ok(closeBtn, 'popup must have a close button');
    click(closeBtn);
    await sleep(50);
    assert.ok(!modal.classList.contains('open'), 'popup must close');
    // Clicking the card body (outside the portrait) still opens the team.
    click(firstCard);
    await sleep(50);
    assert.ok(doc.getElementById('overlay').classList.contains('open'), 'card-body click must open the team sheet');
  });

  test('formation board portraits in the team sheet open the hero popup', async () => {
    const { window } = makeDom();
    const doc = window.document;
    await sleep(50);
    const firstCard = doc.querySelector('#list [data-team]');
    click(firstCard);
    await sleep(50);
    assert.ok(doc.getElementById('overlay').classList.contains('open'), 'team sheet must open');
    const boardPortraits = doc.querySelectorAll('#sheet [data-hero-popup]');
    // T1 sheet: 3 portraits in the team zone + 3 in its formation board + 7 counters x 3.
    assert.equal(boardPortraits.length, 27, 'T1 sheet must carry 27 popup portraits');
    const ids = [...boardPortraits].map(p => p.getAttribute('data-hero-popup'));
    assert.ok(ids.includes('sunran') && ids.includes('hayeon') && ids.includes('judas'),
      'board portraits must include Sunran, Hayeon and Judas, got ' + ids.join(','));
    const modal = await openPopup(doc, boardPortraits[0]);
    assert.match(modal.textContent, /Tanjiro|Sunran|Hayeon/, 'board portrait popup must show its hero');
  });
}
