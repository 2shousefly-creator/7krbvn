const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');

const NAV = ['index.html', 'newbie.html', 'cap-nhat.html', 'guild-war-team.html',
  'castle-rush.html', 'raid.html', 'dungeon.html', 'celestial-tower.html', 'tower-of-trials.html', 'arena.html',
  'tinh-ruby.html'];

const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));

test('every page carries the full 12-section navigation with exactly one active item', () => {
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const target of NAV) {
      assert.ok(html.includes(`href="${target}"`), `${file} is missing nav link ${target}`);
    }
    // guild-war-team.html uses snav-active (same marker, its own nav bar)
    assert.equal((html.match(/nav-active"/g) || []).length, 1, `${file} must have exactly one active nav item`);
  }
});

test('every internal page link resolves to an existing file', () => {
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const hrefs = [...new Set([...html.matchAll(/href="([a-z0-9-]+\.html)(?:#[^"]*)?"/g)].map(m => m[1]))];
    for (const target of hrefs) {
      assert.ok(fs.existsSync(path.join(root, target)), `${file} links to missing page ${target}`);
    }
  }
});

test('every local image referenced by a page exists on disk', () => {
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const imgs = [...new Set([...html.matchAll(/src="assets\/([A-Za-z0-9_.-]+)"/g)].map(m => m[1]))];
    for (const img of imgs) {
      const p = path.join(root, 'assets', img);
      assert.ok(fs.existsSync(p), `${file} references missing image ${img}`);
      assert.ok(fs.statSync(p).size > 1000, `${img} must be a real image`);
    }
  }
});

test('the home page lists all eleven category cards', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const target of NAV.slice(1)) {
    assert.ok(home.includes(`href="${target}"`), `home is missing category card ${target}`);
  }
  assert.equal((home.match(/class="cat-card"/g) || []).length, 11, 'home must have 11 category cards');
});

test('sticky header: the header stays fixed at the top on every page', () => {
  const css = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(css.includes('.site-header{position:sticky'), 'site-nav.css must make the header sticky');
  assert.ok(css.includes('top:0'), 'sticky header must sit at the top of the viewport');
  assert.ok(css.includes('scroll-margin-top:150px'), 'anchor jumps must clear the sticky header');
});

test('back to top: every article/listing page has a back-to-top button', () => {
  const css = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(css.includes('.back-to-top'), 'site-nav.css must style the back-to-top button');
  assert.ok(css.includes('.back-to-top.show'), 'the button must appear after scrolling down');
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    if (file === 'guild-war-team.html') continue; // interactive tool page, own layout
    assert.ok(html.includes('class="back-to-top"'), `${file} must have a back-to-top button`);
    assert.ok(html.includes("window.scrollTo({top:0,behavior:'smooth'})"), `${file} button must scroll to top`);
  }
});

test('article tags: every article page carries a chip naming its menu', () => {
  const tags = {
    'ruby-farming.html': 'NEWBIE',
    'chon-hero-banner.html': 'NEWBIE',
    'nang-cap-hero.html': 'NEWBIE',
    'doi-hinh-hang-truoc-sau.html': 'NEWBIE',
    'cap-nhat-28-10.html': 'CHI TIẾT CẬP NHẬT',
    'arena.html': 'ARENA',
    'tinh-ruby.html': 'TÍNH RUBY',
    'doi-coupon.html': 'ĐỔI COUPON',
  };
  for (const [file, label] of Object.entries(tags)) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(html.includes(`<span class="article-tag">${label}</span>`), `${file} must carry the ${label} tag`);
  }
});

test('mobile hamburger menu: every page has a collapsible nav toggle', () => {
  const css = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(css.includes('.nav-toggle'), 'site-nav.css must style the hamburger toggle');
  assert.ok(css.includes('.main-nav.open'), 'site-nav.css must show the nav when open on mobile');
  assert.ok(css.includes('.main-nav.open .nav-scroll'), 'open nav must lay out as a vertical column');
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    if (file === 'guild-war-team.html') {
      assert.ok(html.includes('class="snav-toggle"'), 'guild-war-team.html must have its hamburger toggle');
      assert.ok(html.includes("querySelector('.snav-toggle')"), 'guild-war-team.html must wire the toggle');
      assert.ok(html.includes('.snav-bar.open .snav-links'), 'guild-war-team.html must style the open dropdown');
    } else {
      assert.ok(html.includes('class="nav-toggle"'), `${file} must have a hamburger toggle`);
      assert.ok(html.includes('id="site-nav"'), `${file} nav must have the id the toggle controls`);
      assert.ok(html.includes("getElementById('site-nav')"), `${file} must wire the toggle`);
      assert.ok(html.includes('aria-expanded="false"'), `${file} toggle must start collapsed`);
    }
  }
});

test('no page may reuse the same id twice (getElementById returns the first match)', () => {
  // Regression test: doi-coupon.html once had id="uid" on both its section
  // and its input, so the script read the section (no value) instead of the
  // input and every redeem reported "UID not entered".
  // Script contents are excluded: guild-war-team.html builds two sheets from
  // JS templates that both contain a close button, but openSheet() replaces
  // #sheet's innerHTML each time, so only one ever exists in the live DOM.
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8').replace(/<script>[\s\S]*?<\/script>/g, '');
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
    const seen = new Set();
    for (const id of ids) {
      assert.ok(!seen.has(id), `${file} reuses id="${id}"`);
      seen.add(id);
    }
  }
});
