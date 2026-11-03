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
  .replace('<script src="hero-popup.js" defer></script>', '')
  .replace('<script src="skill-card.js"></script>', '');
const popupJs = fs.readFileSync(path.join(root, 'hero-popup.js'), 'utf8');
const skillCardJs = fs.readFileSync(path.join(root, 'skill-card.js'), 'utf8');
const heroHtml = fs.readFileSync(path.join(root, 'hero.html'), 'utf8')
  .replace('<script src="hero-detail.js" defer></script>', '');
const detailJs = fs.readFileSync(path.join(root, 'hero-detail.js'), 'utf8');
const heroesIndex = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes-index.json'), 'utf8'));

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function heroFetchStub(window) {
  window.fetch = (u) => {
    const s = String(u);
    if (s.includes('heroes-index.json')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(heroesIndex) });
    }
    const m = s.match(/data\/heroes\/([^/]+)\.json/);
    if (!m) return Promise.reject(new Error('unexpected fetch ' + u));
    const file = path.join(root, 'data', 'heroes', m[1] + '.json');
    if (!fs.existsSync(file)) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error('404')) });
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
  };
}

function makeDom() {
  const dom = new JSDOM(gwHtml + '<script>' + popupJs + '</script><script>' + skillCardJs + '</script>', {
    url: 'https://7krb.io.vn/guild-war-team.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) { heroFetchStub(window); },
  });
  return dom;
}

/* Render hero.html for one hero (same setup as tests/scroll.test.cjs). */
function makeHeroDom(heroId) {
  const dom = new JSDOM(heroHtml + '<script>' + detailJs + '</script>', {
    url: 'https://7krb.io.vn/hero.html?id=' + heroId,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      heroFetchStub(window);
      window.scrollTo = () => {};
      window.requestAnimationFrame = (cb) => { cb(); return 1; };
    },
  });
  return dom;
}

const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

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

  test('every opener row shows a real skill image from the Heroes data', async () => {
    const { window } = makeDom();
    const doc = window.document;
    await sleep(50);
    doc.querySelector('#list [data-team]').click();
    await sleep(50);
    const rows = [...doc.querySelectorAll('#sheet .op-row')];
    assert.ok(rows.length > 0, 'T1 sheet must have opener rows');
    const imgs = [...doc.querySelectorAll('#sheet .op-ic img')];
    assert.equal(imgs.length, rows.length, 'every opener row must have a skill image (no empty icon boxes)');
    for (const img of imgs) {
      assert.ok(img.getAttribute('src').startsWith('assets/skills-raw/'),
        'opener icon must come from the Heroes skills-raw set, got ' + img.getAttribute('src'));
    }
    // The Li rows (C4 of T1) used to render with an empty icon box: Li has
    // no GW skill panel, so the old code had no image for them.
    const liRows = rows.filter(r => r.textContent.includes('Li:'));
    assert.ok(liRows.length > 0, 'T1 sheet must have Li opener rows');
    for (const r of liRows) {
      assert.ok(r.querySelector('.op-ic img'), 'Li opener row must show a skill image');
    }
  });

  test('skill popup renders the same detail as the hero page (Sunran Skill 2)', async () => {
    const { window } = makeDom();
    const doc = window.document;
    await sleep(50);
    doc.querySelector('#list [data-team]').click();
    await sleep(50);
    const row = [...doc.querySelectorAll('#sheet .op-row')]
      .find(r => r.textContent.includes('Sunran:') && r.textContent.includes('Phantom Flying Blade'));
    assert.ok(row, 'T1 sheet must have the Sunran Phantom Flying Blade opener row');
    click(row);
    await sleep(150);
    const sheet = doc.getElementById('psheet');
    assert.ok(doc.getElementById('poverlay').classList.contains('open'), 'skill popup must open');
    assert.ok(!sheet.textContent.includes('Đang tải'), 'loading note must be replaced by the skill detail');
    assert.ok(sheet.textContent.includes('Phantom Flying Blade'), 'popup must show the skill name');
    assert.ok(sheet.querySelector('.hx-skill img[src^="assets/skills-raw/"]'), 'popup must show the skills-raw icon');
    assert.ok(sheet.textContent.includes('98s'), 'popup must show the 98s cooldown');
    assert.ok(sheet.textContent.includes('3 kẻ địch'), 'popup must show the Vietnamese target scope');
    assert.ok(sheet.querySelector('.hx-tx-t2'), 'popup must show the T2 box');
    assert.ok(sheet.textContent.includes('Xóa Buff'), 'popup must show the effect explanation (Buff Removal)');
    // Note: Sunran's AWAKENED Skill 2 has no enhancement lines in the Atlas
    // data (the 6★ version does) — the popup faithfully shows none, exactly
    // like hero.html's AWK version. No enhancement block is the correct render.
    assert.ok(!sheet.textContent.includes('Atlas Codex'), 'popup must not mention Atlas Codex');
    assert.ok(sheet.textContent.includes('Thức tỉnh'), 'popup must state the awakened kit used by the team');
    // Close button still works after the async content swap.
    doc.getElementById('pclosebtn').click();
    await sleep(50);
    assert.ok(!doc.getElementById('poverlay').classList.contains('open'), 'skill popup must close');
  });

  test('skill popup text matches the hero detail page skill card (parity)', async () => {
    // Yeonhee Skill 2 (C1 of T1) uses the 6★ kit, same as hero.html's
    // default version — so both renders must produce identical skill text.
    const { window } = makeDom();
    const doc = window.document;
    await sleep(50);
    doc.querySelector('#list [data-team]').click();
    await sleep(50);
    const row = [...doc.querySelectorAll('#sheet .op-row')]
      .find(r => r.textContent.includes('Yeonhee:') && r.textContent.includes('Eternal Slumber'));
    assert.ok(row, 'T1 sheet must have the Yeonhee Eternal Slumber opener row');
    click(row);
    await sleep(150);
    const popupSkill = doc.getElementById('psheet').querySelector('.hx-skill');
    assert.ok(popupSkill, 'skill popup must render the hx-skill card');
    const popupText = norm(popupSkill.textContent);

    const heroDom = makeHeroDom('yeonhee');
    await sleep(150);
    const heroDoc = heroDom.window.document;
    const heroSkill = heroDoc.querySelector('#skill-ultimate');
    assert.ok(heroSkill, 'hero page must render the Yeonhee Skill 2 card');
    const heroText = norm(heroSkill.textContent);
    assert.equal(popupText, heroText,
      'GW skill popup text must equal the hero detail page skill card text');
  });
}
