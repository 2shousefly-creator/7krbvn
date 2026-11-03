const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'seven-knights-drafts', 'castle-rush-rewrite.json'), 'utf8'));

const SLUGS = ['rudy', 'eileene', 'rachel', 'dellons', 'jave', 'spike', 'kris'];

test('boss pages are minimal: one hero row + pet + video only', () => {
  for (const slug of SLUGS) {
    const html = fs.readFileSync(path.join(root, `castle-rush-${slug}.html`), 'utf8');
    assert.ok(html.includes('<link rel="stylesheet" href="heroes.css">'), `${slug}: heroes.css`);
    assert.ok(html.includes('<link rel="stylesheet" href="castle-rush.css">'), `${slug}: castle-rush.css`);
    assert.ok(html.includes('<script src="hero-popup.js" defer></script>'), `${slug}: hero-popup.js`);
    // One horizontal hero row, no formation diagram, no role table.
    assert.ok(html.includes('class="cr-team-row"'), `${slug}: cr-team-row`);
    assert.ok(!html.includes('class="cr-row"'), `${slug}: no formation rows`);
    assert.ok(!html.includes('class="cr-formation-line"'), `${slug}: no formation line`);
    assert.ok(!html.includes('Hàng Trước'), `${slug}: no front row label`);
    assert.ok(!html.includes('Hàng Sau'), `${slug}: no back row label`);
    assert.ok(html.includes('class="cr-pet-line"'), `${slug}: pet line`);
    assert.ok(html.includes('Pet: <b>Windy</b>'), `${slug}: pet Windy`);
    // Removed sections: equipment, rotation, notes.
    assert.ok(!html.includes('id="trang-bi"'), `${slug}: no equipment section`);
    assert.ok(!html.includes('id="thu-tu-skill"'), `${slug}: no rotation section`);
    assert.ok(!html.includes('id="luu-y"'), `${slug}: no notes section`);
    assert.ok(!/top skill|bottom skill|\bAtas\b|\bBawah\b/i.test(html), `${slug}: no top/bottom wording`);
    assert.ok(!/Điểm trong video/i.test(html), `${slug}: no score text`);
    assert.ok(!/Biskuit/.test(html), `${slug}: no "Biskuit" spelling (in-game name is Biscuit)`);
    // Video embed kept.
    const b = data.bosses.find(x => x.slug === slug);
    assert.ok(html.includes(`https://www.youtube.com/embed/${b.video_id}`), `${slug}: video embed ${b.video_id}`);
    assert.ok(html.includes(`https://www.youtube.com/watch?v=${b.video_id}`), `${slug}: video link ${b.video_id}`);
    assert.ok(html.includes('<div class="article-number">02 <span>/ VIDEO</span></div>'), `${slug}: video is section 02`);
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
