const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');

const NAV = ['index.html', 'newbie.html', 'cap-nhat.html', 'guild-war-team.html',
  'castle-rush.html', 'raid.html', 'celestial-tower.html', 'tower-of-trials.html', 'arena.html'];

const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));

test('every page carries the full 9-section navigation with exactly one active item', () => {
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

test('the home page lists all eight category cards', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const target of NAV.slice(1)) {
    assert.ok(home.includes(`href="${target}"`), `home is missing category card ${target}`);
  }
  assert.equal((home.match(/class="cat-card"/g) || []).length, 8, 'home must have 8 category cards');
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
