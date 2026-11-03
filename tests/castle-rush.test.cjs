const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'seven-knights-drafts', 'castle-rush-rewrite.json'), 'utf8'));

const SLUGS = ['rudy', 'eileene', 'rachel', 'dellons', 'jave', 'spike', 'kris'];
const FORMATIONS = {
  rudy: { type: 'Balanced 3-2', front: 3, back: 2 },
  eileene: { type: 'Defense 4-1', front: 4, back: 1 },
  rachel: { type: 'Attack 1-4', front: 1, back: 4 },
  dellons: { type: 'Basic 2-3', front: 2, back: 3 },
  jave: { type: 'Balanced 3-2', front: 3, back: 2 },
  spike: { type: 'Attack 1-4', front: 1, back: 4 },
  kris: { type: 'Defense 4-1', front: 4, back: 1 },
};

test('every boss page has the hero popup wiring and team display', () => {
  for (const slug of SLUGS) {
    const html = fs.readFileSync(path.join(root, `castle-rush-${slug}.html`), 'utf8');
    assert.ok(html.includes('<link rel="stylesheet" href="heroes.css">'), `${slug}: heroes.css`);
    assert.ok(html.includes('<link rel="stylesheet" href="castle-rush.css">'), `${slug}: castle-rush.css`);
    assert.ok(html.includes('<script src="hero-popup.js" defer></script>'), `${slug}: hero-popup.js`);
    assert.ok(html.includes('class="cr-team"'), `${slug}: cr-team`);
    assert.ok(html.includes('class="cr-pet"'), `${slug}: cr-pet`);
    const f = FORMATIONS[slug];
    assert.ok(html.includes(`Trận hình: <b>${f.type}</b>`), `${slug}: formation ${f.type}`);
    assert.ok(html.includes(`Hàng Trước (${f.front})`), `${slug}: front ${f.front}`);
    assert.ok(html.includes(`Hàng Sau (${f.back})`), `${slug}: back ${f.back}`);
    // No leftover top/bottom-skill wording anywhere on the page.
    assert.ok(!/top skill|bottom skill|\bAtas\b|\bBawah\b/i.test(html), `${slug}: no top/bottom wording`);
    assert.ok(!/Biskuit/.test(html), `${slug}: no "Biskuit" spelling (in-game name is Biscuit)`);
    assert.ok(!/không được ghi trong bình luận ghim/i.test(html), `${slug}: old placeholder note gone`);
  }
});

test('every portrait popup id resolves to a hero JSON and a portrait file', () => {
  for (const slug of SLUGS) {
    const html = fs.readFileSync(path.join(root, `castle-rush-${slug}.html`), 'utf8');
    const ids = [...html.matchAll(/data-hero-popup="([^"]+)"/g)].map(m => m[1]);
    assert.ok(ids.length >= 5, `${slug}: at least 5 portraits (got ${ids.length})`);
    for (const id of new Set(ids)) {
      assert.ok(fs.existsSync(path.join(root, 'data', 'heroes', `${id}.json`)), `${slug}: hero JSON ${id}`);
      const portrait = fs.existsSync(path.join(root, 'assets', `hero-${id}.webp`))
        || fs.existsSync(path.join(root, 'assets', `hero-awk-${id}.webp`));
      assert.ok(portrait, `${slug}: portrait ${id}`);
      assert.ok(html.includes(`assets/hero-${id}.webp`) || html.includes(`assets/hero-awk-${id}.webp`), `${slug}: portrait referenced ${id}`);
    }
  }
});

test('rotations use real skill names from the hero JSONs', () => {
  const skillNames = new Set();
  for (const file of fs.readdirSync(path.join(root, 'data', 'heroes'))) {
    const d = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes', file), 'utf8'));
    for (const kit of ['s6', 'awk']) {
      for (const s of (d.skills && d.skills[kit]) || []) {
        if (s.name) skillNames.add(s.name);
      }
    }
  }
  for (const b of data.bosses) {
    const html = fs.readFileSync(path.join(root, `castle-rush-${b.slug}.html`), 'utf8');
    const m = html.match(/<section class="article-section" id="thu-tu-skill">([\s\S]*?)<\/section>/);
    assert.ok(m, `${b.slug}: rotation section`);
    const rendered = [...m[1].matchAll(/<span class="cr-step"><b>([^<]+)<\/b>/g)].map(x => x[1]);
    assert.ok(rendered.length >= 10, `${b.slug}: rotation has steps (got ${rendered.length})`);
    for (const name of rendered) {
      assert.ok(skillNames.has(name), `${b.slug}: skill "${name}" exists in hero data`);
    }
  }
});

test('main page: formation varies, scores on cards, mechanic footnote', () => {
  const html = fs.readFileSync(path.join(root, 'castle-rush.html'), 'utf8');
  assert.ok(html.includes('Trận hình không cố định một kiểu'), 'formation varies note');
  assert.ok(!/Attacker hàng sau/.test(html), 'no "Attacker hàng sau" claim');
  assert.ok(html.includes('Cơ chế trong bảng là mô tả từ hướng dẫn'), 'mechanic footnote');
  for (const b of data.bosses) {
    assert.ok(html.includes(`castle-rush-${b.slug}.html`), `${b.slug}: card link`);
  }
  assert.ok(html.includes('Điểm trong video: Orly 14,33M · Lina 14,19M (Practice).'), 'Rudy card score');
  assert.ok(html.includes('Điểm trong video: 12,17M (Practice).'), 'Rachel card score');
  assert.ok(html.includes('Điểm trong video: 21,85M.'), 'Jave card score');
  // In-game spelling is "Biscuit" (hero id biscuit); the author's "Biskuit" must not leak onto the site.
  assert.ok(!/Biskuit/.test(html), 'no "Biskuit" spelling on the main page');
});

test('no % in any asset URL referenced by the Castle Rush pages', () => {
  for (const slug of [...SLUGS, '']) {
    const file = slug ? `castle-rush-${slug}.html` : 'castle-rush.html';
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const url of [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1])) {
      if (url.startsWith('assets/') || url.startsWith('data/')) {
        assert.ok(!url.includes('%'), `${file}: %-free asset URL ${url}`);
      }
    }
  }
});
