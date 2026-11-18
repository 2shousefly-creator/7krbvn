const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');

// Zone slugs and article counts, mirroring build_advent.py.
const ZONES = { god: 8, teo: 4, kyle: 4, yeonhee: 4, karma: 4 };
const FILES = Object.entries(ZONES).flatMap(([slug, n]) =>
  Array.from({ length: n }, (_, i) => `advent-${slug}-${i + 1}.html`));

// Video ids embedded per article page (order matches build_advent.py).
const VIDEOS = {
  'advent-god-1.html': '2Gj9y6EBt0U', 'advent-god-2.html': 'dYytN8K-n2o',
  'advent-god-3.html': '9Ej4krqCfxU', 'advent-god-4.html': 'cwMpkX333YM',
  'advent-god-5.html': 'ot6iuAcekfQ', 'advent-god-6.html': 'TF0WUlNf4y8',
  'advent-god-7.html': 'Z0J1VxKih1s', 'advent-god-8.html': 'Ggj-Ynjv4F0',
  'advent-teo-1.html': 'X19bysk48Wk', 'advent-teo-2.html': 'Psfc3wp92MM',
  'advent-teo-3.html': 'cRbfEk1zZKU', 'advent-teo-4.html': 'Gi-y6JNXkos',
  'advent-kyle-1.html': 'BN6qBPfNLHs', 'advent-kyle-2.html': 'rfBROn5tdYQ',
  'advent-kyle-3.html': 'ZBXcPwQMZyY', 'advent-kyle-4.html': 'CjM2RLH9GHM',
  'advent-yeonhee-1.html': 'JBdIdF-W_U8', 'advent-yeonhee-2.html': 'CRCHLoBGoAM',
  'advent-yeonhee-3.html': 'drzwk9Ed29k', 'advent-yeonhee-4.html': 'uMbgtx1co-M',
  'advent-karma-1.html': 'bsWtoQXjXp8', 'advent-karma-2.html': '9UlES1iutGA',
  'advent-karma-3.html': 'kRAqlwK8Z5s', 'advent-karma-4.html': 'gS0szsFqtxw',
};

test('hub: 5 boss zones, God of Destruction first, cards link every article', () => {
  const html = fs.readFileSync(path.join(root, 'advent-expedition.html'), 'utf8');
  const godAt = html.indexOf('God of Destruction');
  for (const name of ['Destructive Shadow Teo', 'Destructive Shadow Kyle',
    'Destructive Shadow Yeonhee', 'Destructive Shadow Karma']) {
    const at = html.indexOf(name);
    assert.ok(at > 0, `hub must name ${name}`);
    assert.ok(at > godAt, `${name} must come after God of Destruction`);
  }
  for (const f of FILES) {
    assert.ok(html.includes(`href="${f}"`), `hub must link ${f}`);
  }
  assert.ok(html.includes('Four Lords of Old'), 'hub must explain the Four Lords');
});

test('article pages: one embedded video each, back link to the hub', () => {
  for (const f of FILES) {
    const html = fs.readFileSync(path.join(root, f), 'utf8');
    const vid = VIDEOS[f];
    assert.ok(html.includes(`https://www.youtube.com/embed/${vid}`), `${f}: video embed ${vid}`);
    assert.ok(html.includes(`https://www.youtube.com/watch?v=${vid}`), `${f}: video link ${vid}`);
    assert.ok(html.includes('href="advent-expedition.html"'), `${f}: link back to hub`);
    // Related cards: every other article of the same zone.
    const zone = f.split('-')[1];
    const siblings = FILES.filter(x => x.split('-')[1] === zone && x !== f);
    for (const s of siblings) {
      assert.ok(html.includes(`href="${s}"`), `${f}: related link ${s}`);
    }
    assert.ok(!html.includes(`href="${f}"`), `${f}: must not link to itself`);
  }
});

test('thumbnails: every card uses a local in-combat frame, never a YouTube URL', () => {
  for (const f of FILES) {
    const zone = f.split('-')[1];
    const n = f.split('-')[2].replace('.html', '');
    const thumb = `assets/advent-${zone}-${n}.webp`;
    assert.ok(fs.existsSync(path.join(root, thumb)), `thumbnail file must exist: ${thumb}`);
    const hub = fs.readFileSync(path.join(root, 'advent-expedition.html'), 'utf8');
    assert.ok(hub.includes(`src="${thumb}"`), `hub card ${f} must use ${thumb}`);
  }
  const all = ['advent-expedition.html', ...FILES]
    .map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
  assert.ok(!all.includes('i.ytimg.com'), 'no Advent page may hotlink a YouTube thumbnail');
});

test('no % in any asset URL referenced by the Advent pages', () => {
  for (const file of ['advent-expedition.html', ...FILES]) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const url of [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1])) {
      if (url.startsWith('assets/') || url.startsWith('data/')) {
        assert.ok(!url.includes('%'), `${file}: %-free asset URL ${url}`);
      }
    }
  }
});
