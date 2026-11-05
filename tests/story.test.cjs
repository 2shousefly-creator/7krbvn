const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');
const page = name => fs.readFileSync(path.join(root, name), 'utf8');

const STORY_PAGES = ['cot-truyen.html', 'cot-truyen-act-1.html', 'cot-truyen-act-2.html',
  'cot-truyen-act-3.html', 'cot-truyen-act-4.html', 'cot-truyen-act-5.html'];
// chapters / episodes / dialogue lines / cinematic chapters per Act (from the Atlas story data)
// pages = dialogue chapters (cinematic chapters merge into the next one as lead-ins)
const ACTS = {
  1: { chapters: 66, pages: 60, episodes: 11, lines: 1767, cine: 6, first: 4 },
  2: { chapters: 25, pages: 24, episodes: 4, lines: 547, cine: 1, first: 2 },
  3: { chapters: 61, pages: 58, episodes: 7, lines: 1470, cine: 3, first: 2 },
  4: { chapters: 91, pages: 89, episodes: 7, lines: 2018, cine: 2, first: 2 },
  5: { chapters: 27, pages: 27, episodes: 2, lines: 954, cine: 0, first: 1 },
};
const ACT_TITLES = {
  1: 'Khởi đầu hành trình', 2: 'Hành trình tiếp nối', 3: 'Sức mạnh Hủy Diệt',
  4: 'Pháp sư Hủy Diệt', 5: 'Người canh giữ Vết Nứt',
};

test('story hub: 5 act cards with chapter counts, overviews and illustrations', () => {
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
    const thumb = body.match(/<img class="act-thumb" src="assets\/story\/([A-Za-z0-9_.-]+)"/);
    assert.ok(thumb, `card ${n} must carry an illustration`);
    const p = path.join(root, 'assets', 'story', thumb[1]);
    assert.ok(fs.existsSync(p) && fs.statSync(p).size > 1000,
      `card ${n} illustration ${thumb[1]} must be a real image`);
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

test('story act pages: flip-book reader, merged lead-ins, dialogue avatars and thumbnails', () => {
  for (const n of [1, 2, 3, 4, 5]) {
    const html = page(`cot-truyen-act-${n}.html`);
    const exp = ACTS[n];
    assert.ok(html.includes('<span class="article-tag">CỐT TRUYỆN</span>'), `act ${n} must carry the CỐT TRUYỆN tag`);
    assert.ok(html.includes(`<h1>Act ${n} — ${ACT_TITLES[n]}</h1>`), `act ${n} must be titled ${ACT_TITLES[n]}`);
    // reader chrome: table of contents, book, sticky controls, flip script, no-JS fallback
    assert.ok(html.includes('class="story-reader"'), `act ${n} must have the reader`);
    assert.ok(html.includes(`data-total="${exp.chapters}"`), `act ${n} reader must know the chapter total`);
    assert.ok(html.includes('class="story-toc-toggle"'), `act ${n} must have a TOC toggle`);
    assert.ok(html.includes('class="story-toc-panel"'), `act ${n} must have a TOC panel`);
    assert.ok(html.includes('class="story-prev"'), `act ${n} must have a previous-chapter button`);
    assert.ok(html.includes('class="story-next"'), `act ${n} must have a next-chapter button`);
    assert.ok(html.includes('class="story-progress"'), `act ${n} must show the reading progress`);
    assert.ok(html.includes("querySelector('.story-reader')"), `act ${n} must inline the reader script`);
    assert.ok(html.includes('turn-next') && html.includes('turn-prev'),
      `act ${n} must carry the page-turn animation`);
    assert.ok(html.includes('reader.scrollIntoView()'),
      `act ${n} must scroll back to the TOC position after every turn`);
    assert.ok(html.includes('.story-reader{margin:0 0 10px;scroll-margin-top:150px}'),
      `act ${n} reader must clear the sticky header when scrolling to the TOC`);
    assert.ok(html.includes('.story-page[hidden]{display:block'), `act ${n} must show every chapter without JS`);
    // TOC: one episode group + one jump button per chapter (cinematic ones as lead-ins)
    assert.equal((html.match(/<h4>Tập \d+ — /g) || []).length, exp.episodes,
      `act ${n} TOC must list ${exp.episodes} episode groups`);
    assert.equal((html.match(/<button type="button" class="(?:toc-ch|toc-lead)" data-goto="ch-\d+">/g) || []).length, exp.chapters,
      `act ${n} TOC must list all ${exp.chapters} chapters`);
    assert.equal((html.match(/<button type="button" class="toc-lead" data-goto="ch-\d+">/g) || []).length, exp.cine,
      `act ${n} TOC must mark its ${exp.cine} cinematic chapters as lead-ins`);
    // one page per dialogue chapter, only the first visible; progress starts there
    assert.equal((html.match(/<article class="story-ch story-page"/g) || []).length, exp.pages,
      `act ${n} must have ${exp.pages} reader pages`);
    const hiddenPages = (html.match(/<article class="story-ch story-page"[^>]* hidden>/g) || []).length;
    assert.equal(hiddenPages, exp.pages - 1,
      `act ${n} must hide every page except the first`);
    assert.ok(html.includes(`>Chương ${exp.first} / ${exp.chapters}<`),
      `act ${n} progress must start at its first dialogue chapter (${exp.first})`);
    // no per-chapter summaries any more (removed 2026-11-05)
    assert.ok(!html.includes('story-summary'), `act ${n} must not carry chapter summaries`);
    assert.ok(!html.includes('TÓM TẮT'), `act ${n} must not label any summary`);
    // cinematic chapters merge into the next dialogue chapter as lead-ins
    assert.equal((html.match(/<div class="story-lead(?:"| )/g) || []).length, exp.cine,
      `act ${n} must show ${exp.cine} merged lead-in blocks`);
    assert.equal((html.match(/<p class="story-lead-text">/g) || []).length,
      exp.cine - (n === 3 ? 1 : 0),
      `act ${n} lead-ins must carry their summaries (except chapter 129, which has none)`);
    assert.equal((html.match(/<div class="story-lead story-epilogue">/g) || []).length,
      n === 3 ? 1 : 0,
      `act ${n} must ${n === 3 ? '' : 'not '}close with an epilogue lead-in`);
    if (n === 3) {
      // chapter numbers shown on the site are the position in the Act:
      // Atlas id 129 is chapter 38, Atlas id 152 is chapter 61
      assert.ok(html.includes('DẪN TRUYỆN · CHƯƠNG 38'), 'chapter 129 must merge as a lead-in');
      assert.ok(html.includes('KẾT · CHƯƠNG 61'), 'chapter 152 must merge as the closing epilogue');
    }
    assert.equal((html.match(/<p class="story-line/g) || []).length, exp.lines,
      `act ${n} must show ${exp.lines} dialogue lines`);
    // every named dialogue line carries a speaker portrait; narration carries none
    const named = (html.match(/<p class="story-line">/g) || []).length;
    const avatars = (html.match(/class="story-ava"/g) || []).length;
    assert.equal(avatars, named,
      `act ${n} must show one speaker portrait per named line (${named})`);
    for (const src of [...new Set([...html.matchAll(/class="story-ava"[^>]*>\s*<img src="(assets\/[^"]+)"/g)].map(m => m[1]))]) {
      assert.ok(fs.existsSync(path.join(root, src)), `act ${n} avatar ${src} must exist`);
    }
    assert.ok(fs.existsSync(path.join(root, 'assets', 'avatar-npc.svg')),
      `act ${n} needs the NPC silhouette avatar`);
    const nar = [...html.matchAll(/<p class="story-line nar">([\s\S]*?)<\/p>/g)];
    assert.ok(nar.every(m => !m[1].includes('story-ava')),
      `act ${n} narration lines must not carry a portrait`);
    // the game's name-entry prompt is styled as a system line, not a plain line
    if (n === 1) {
      assert.ok(html.includes('<p class="story-line sys"><span class="story-sys-tag">LỜI NHẮC TRONG GAME</span>'),
        'the name-entry prompt must render as a system line');
      assert.ok(html.includes('Nhập tên của bạn.'), 'the name-entry prompt must keep its text');
    }
    // cinematic chapters: title + summary only as lead-ins — no badge, no note, no own page
    assert.ok(!html.includes('CHƯƠNG ĐIỆN ẢNH'), `act ${n} must not label cinematic chapters`);
    assert.ok(!html.includes('story-cine'), `act ${n} must not carry a cinematic badge`);
    assert.ok(!html.includes('story-dlg'), `act ${n} must not use the old expandable dialogue`);
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
