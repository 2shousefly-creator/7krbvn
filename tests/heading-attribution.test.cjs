const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// First-heading descriptions (the visible banner lead + the meta description)
// must never name another website: no 7k Atlas, no KiChi/KiChiFrame, no
// GameWith, no 7k-note, no community wikis. The data sources stay in the
// builders and research notes — never in the page text a reader sees first.
// Regression: arena.html's lead read "theo tổng hợp của 7k Atlas" and the
// Castle Rush hub + 7 boss pages credited KiChiFrame in their leads
// (2026-11-25). Body content (e.g. an embedded video's own author credit
// in a video list) is out of scope for this test.
const BANNED = ['Atlas', '7k Atlas', 'KiChi', 'GameWith', '7k-note', 'Krit7k',
  'Namu', 'DCInside', 'Fandom', 'PocketGamer', 'Inven'];
const root = path.join(__dirname, '..', 'public');
const stripTags = (s) => s.replace(/<[^>]+>/g, '').trim();

function headingTexts(html) {
  const texts = [];
  const meta = html.match(/<meta name="description" content="([^"]*)"/);
  if (meta) texts.push(['meta description', meta[1]]);
  const banner = html.match(
    /<section class="(?:blog-intro|hero|at-hero|at-hero--tw)[^>]*>([\s\S]*?)<\/section>/);
  if (banner) {
    const p = banner[1].match(/<p[^>]*>([\s\S]*?)<\/p>/);
    if (p) texts.push(['banner lead', stripTags(p[1])]);
  }
  return texts;
}

test('heading descriptions never name another website (2026-11-25)', () => {
  const files = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
  assert.ok(files.length > 200, 'expected 200+ pages to scan');
  let checked = 0;
  for (const file of files) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const [where, text] of headingTexts(html)) {
      checked += 1;
      for (const name of BANNED) {
        assert.ok(!text.toLowerCase().includes(name.toLowerCase()),
          `${file} ${where} must not mention ${name}: ${text.slice(0, 120)}`);
      }
    }
  }
  assert.ok(checked > 200, `expected 200+ heading descriptions checked, got ${checked}`);
});
