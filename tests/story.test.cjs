const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');
const page = name => fs.readFileSync(path.join(root, name), 'utf8');

const STORY_PAGES = ['cot-truyen.html', 'cot-truyen-act-1.html', 'cot-truyen-act-2.html',
  'cot-truyen-act-3.html', 'cot-truyen-act-4.html', 'cot-truyen-act-5.html'];
// chapters / episodes / dialogue lines / cinematic chapters per Act (from the Atlas story data)
const ACTS = {
  1: { chapters: 66, episodes: 11, lines: 1767, cine: 6, special: 0 },
  2: { chapters: 25, episodes: 4, lines: 547, cine: 1, special: 0 },
  3: { chapters: 61, episodes: 7, lines: 1470, cine: 2, special: 1 },
  4: { chapters: 91, episodes: 7, lines: 2018, cine: 2, special: 0 },
  5: { chapters: 27, episodes: 2, lines: 954, cine: 0, special: 0 },
};
const ACT_TITLES = {
  1: 'Khởi đầu hành trình', 2: 'Hành trình tiếp nối', 3: 'Sức mạnh Hủy Diệt',
  4: 'Pháp sư Hủy Diệt', 5: 'Người canh giữ Vết Nứt',
};

test('story hub: 5 act cards with chapter counts and overviews', () => {
  const hub = page('cot-truyen.html');
  assert.ok(hub.includes('<span class="article-tag">CỐT TRUYỆN</span>'), 'hub must carry the CỐT TRUYỆN tag');
  assert.ok(hub.includes('270 chương'), 'hub must state the 270-chapter total');
  const cards = [...hub.matchAll(/<a class="act-card" href="(cot-truyen-act-\d\.html)">([\s\S]*?)<\/a>/g)];
  assert.equal(cards.length, 5, 'hub must list 5 act cards');
  for (const n of [1, 2, 3, 4, 5]) {
    const [, href, body] = cards[n - 1];
    assert.equal(href, `cot-truyen-act-${n}.html`, `card ${n} must link to Act ${n}`);
    assert.ok(body.includes(`<h3>${ACT_TITLES[n]}</h3>`), `card ${n} must be titled ${ACT_TITLES[n]}`);
    assert.ok(body.includes(`${ACTS[n].chapters} chương`), `card ${n} must state ${ACTS[n].chapters} chapters`);
  }
  assert.ok(hub.includes('id="doc-nhu-the-nao"'), 'hub must explain how to read the story');
  assert.ok(hub.includes('href="cot-truyen-act-1.html"'), 'hub must link onward to Act 1');
});

test('story nav: hub and act pages highlight CỐT TRUYỆN in the menu', () => {
  for (const file of STORY_PAGES) {
    const html = page(file);
    assert.ok(html.includes('<a class="nav-active" href="cot-truyen.html" aria-current="page">CỐT TRUYỆN</a>'),
      `${file} must highlight CỐT TRUYỆN in the nav`);
    assert.equal((html.match(/class="(?:snav-active|nav-active)" href="/g) || []).length, 1,
      `${file} must have exactly one active nav item`);
    assert.ok(html.includes('href="cot-truyen.html"'), `${file} must link the story hub`);
  }
  const act1 = page('cot-truyen-act-1.html');
  assert.ok(act1.includes('<a href="cot-truyen.html">Cốt truyện</a>'), 'act pages must breadcrumb back to the hub');
});

test('story act pages: episodes, chapters, summaries, dialogue and thumbnails', () => {
  for (const n of [1, 2, 3, 4, 5]) {
    const html = page(`cot-truyen-act-${n}.html`);
    const exp = ACTS[n];
    assert.ok(html.includes('<span class="article-tag">CỐT TRUYỆN</span>'), `act ${n} must carry the CỐT TRUYỆN tag`);
    assert.ok(html.includes(`<h1>Act ${n} — ${ACT_TITLES[n]}</h1>`), `act ${n} must be titled ${ACT_TITLES[n]}`);
    assert.equal((html.match(/class="article-section"/g) || []).length, exp.episodes,
      `act ${n} must have ${exp.episodes} episode sections`);
    assert.equal((html.match(/<article class="story-ch"/g) || []).length, exp.chapters,
      `act ${n} must have ${exp.chapters} chapters`);
    assert.equal((html.match(/<p class="story-summary">/g) || []).length,
      exp.chapters - exp.special,
      `act ${n} must show a summary on every chapter except the one without summary text`);
    assert.equal((html.match(/<p class="story-line/g) || []).length, exp.lines,
      `act ${n} must show ${exp.lines} dialogue lines`);
    assert.equal((html.match(/CHƯƠNG ĐIỆN ẢNH/g) || []).length, exp.cine,
      `act ${n} must mark ${exp.cine} cinematic chapters`);
    assert.equal((html.match(/CHƯƠNG ĐẶC BIỆT/g) || []).length, exp.special,
      `act ${n} must mark ${exp.special} special chapter`);
    assert.equal((html.match(/<details class="story-dlg">/g) || []).length,
      exp.chapters - exp.cine - exp.special,
      `act ${n} must offer full dialogue on every dialogue chapter`);
    // every chapter thumbnail is a real local image
    const thumbs = [...new Set([...html.matchAll(/src="assets\/story\/([A-Za-z0-9_.-]+)"/g)].map(m => m[1]))];
    assert.ok(thumbs.length >= 10, `act ${n} must show chapter thumbnails, got ${thumbs.length}`);
    for (const img of thumbs) {
      const p = path.join(root, 'assets', 'story', img);
      assert.ok(fs.existsSync(p), `act ${n} references missing thumbnail ${img}`);
      assert.ok(fs.statSync(p).size > 1000, `thumbnail ${img} must be a real image`);
    }
    // chapter characters open the hero popup and exist on the site
    const ids = [...new Set([...html.matchAll(/data-hero-popup="([a-z0-9-]+)"/g)].map(m => m[1]))];
    assert.ok(ids.length >= 5, `act ${n} must name chapter characters, got ${ids.length}`);
    for (const id of ids) {
      assert.ok(fs.existsSync(path.join(root, 'data', 'heroes', `${id}.json`)),
        `act ${n} character ${id} has no hero data`);
      assert.ok(fs.existsSync(path.join(root, 'assets', `hero-${id}.webp`)),
        `act ${n} character ${id} has no portrait`);
    }
    // prev/next act navigation
    if (n > 1) assert.ok(html.includes(`href="cot-truyen-act-${n - 1}.html"`), `act ${n} must link the previous act`);
    if (n < 5) assert.ok(html.includes(`href="cot-truyen-act-${n + 1}.html"`), `act ${n} must link the next act`);
  }
});

test('story pages: no source attribution, every thumbnail exists', () => {
  for (const file of STORY_PAGES) {
    const html = page(file);
    assert.ok(!html.includes('GameWith') && !html.includes('Atlas') && !html.includes('7katlas'),
      `${file} must not attribute sources in the story`);
  }
  const storyDir = path.join(root, 'assets', 'story');
  const files = fs.readdirSync(storyDir).filter(f => f.endsWith('.webp'));
  assert.equal(files.length, 94, 'all 94 story thumbnails must be on disk');
  for (const f of files) {
    assert.ok(fs.statSync(path.join(storyDir, f)).size > 1000, `thumbnail ${f} must be a real image`);
  }
});
