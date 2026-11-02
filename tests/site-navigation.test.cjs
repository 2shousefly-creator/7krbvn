const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');

// Hierarchical navigation: 5 top-level links + PVE (5 children) + PVP (3 children).
const NAV_TOP = ['index.html', 'newbie.html', 'cap-nhat.html', 'tinh-ruby.html', 'doi-coupon.html'];
const NAV_PVE = ['castle-rush.html', 'raid.html', 'dungeon.html', 'celestial-tower.html', 'tower-of-trials.html'];
const NAV_PVP = ['arena.html', 'total-war.html', 'guild-war-team.html'];
const NAV = [...NAV_TOP, ...NAV_PVE, ...NAV_PVP];

// Pages whose active item is a submenu child, and the parent that must be highlighted.
const CHILD_PARENT = {};
for (const h of NAV_PVE) CHILD_PARENT[h] = 'PVE';
for (const h of NAV_PVP) CHILD_PARENT[h] = 'PVP';

// Home category cards (11) — unaffected by the menu regrouping.
const CAT_CARDS = ['newbie.html', 'cap-nhat.html', 'guild-war-team.html', 'castle-rush.html',
  'raid.html', 'celestial-tower.html', 'tower-of-trials.html', 'arena.html', 'dungeon.html',
  'tinh-ruby.html', 'doi-coupon.html'];

const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));

function navBlock(html) {
  const i = html.indexOf('<nav class="main-nav"');
  if (i >= 0) return html.slice(i, html.indexOf('</nav>', i));
  const j = html.indexOf('snav-links">');
  return html.slice(j, html.indexOf('</div>', j));
}

function parentActiveCount(html) {
  return (html.match(/class="[^"]*(?:nav|snav)-parent-active[^"]*"/g) || []).length;
}

test('every page carries the hierarchical navigation with exactly one active item', () => {
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const target of NAV) {
      assert.ok(html.includes(`href="${target}"`), `${file} is missing nav link ${target}`);
    }
    assert.ok(html.includes('data-parent="PVE"'), `${file} is missing the PVE dropdown`);
    assert.ok(html.includes('data-parent="PVP"'), `${file} is missing the PVP dropdown`);
    const nav = navBlock(html);
    assert.ok(nav.includes('>CẬP NHẬT</a>'), `${file} nav must label the update section CẬP NHẬT`);
    assert.ok(!nav.includes('CHI TIẾT CẬP NHẬT'), `${file} nav still uses the old label`);
    assert.equal((html.match(/class="(?:snav-active|nav-active)" href="/g) || []).length, 1,
      `${file} must have exactly one active nav item`);
    const active = html.match(/class="(?:snav-active|nav-active)" href="([^"]+)"/)[1];
    const parent = CHILD_PARENT[active];
    assert.equal(parentActiveCount(html), parent ? 1 : 0,
      `${file}: active ${active} must ${parent ? '' : 'not '}highlight a parent`);
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

test('the home page lists all eleven category cards (unaffected by the menu regrouping)', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const target of CAT_CARDS) {
    assert.ok(home.includes(`href="${target}"`), `home is missing category card ${target}`);
  }
  assert.equal((home.match(/class="cat-card"/g) || []).length, 11, 'home must have 11 category cards');
});

test('home articles show their tag labels', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const cards = [...home.matchAll(/<a class="post-card" href="([^"]+)">([\s\S]*?)<\/a>/g)];
  assert.equal(cards.length, 4, 'home must list 4 latest articles');
  for (const [, href, body] of cards) {
    assert.ok(body.includes('<span class="article-tag">'), `${href} card must show its tag label`);
  }
  assert.ok(home.includes('<span class="article-tag">CẬP NHẬT</span>'),
    'update article card must carry the CẬP NHẬT tag');
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
    'cap-nhat-28-10.html': 'CẬP NHẬT',
    'arena.html': 'ARENA',
    'total-war.html': 'TOTAL WAR',
    'tinh-ruby.html': 'TÍNH RUBY',
    'doi-coupon.html': 'ĐỔI COUPON',
  };
  for (const [file, label] of Object.entries(tags)) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(html.includes(`<span class="article-tag">${label}</span>`), `${file} must carry the ${label} tag`);
  }
});

test('article tags sit at the top-right corner of the article header', () => {
  const css = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(css.includes('.blog-intro-copy,.hero-copy{display:flex;flex-direction:column}'),
    'article headers must lay out as a column so the tag can sit on top');
  assert.ok(css.includes('.blog-intro-copy>.article-tag,.hero-copy>.article-tag{align-self:flex-end;order:-1'),
    'the tag must be the first item, pushed to the right');
});

test('dropdown menus: PVE/PVP open on hover, focus and click on desktop, tap on mobile', () => {
  const css = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(css.includes('.nav-parent'), 'site-nav.css must style the dropdown parent button');
  assert.ok(css.includes('.nav-sub'), 'site-nav.css must style the dropdown');
  assert.ok(css.includes('.nav-item:hover .nav-sub'), 'dropdown must open on hover on desktop');
  assert.ok(css.includes('.nav-item.open .nav-sub'), 'dropdown must open on click/tap');
  assert.ok(css.includes('.nav-parent-active'), 'an active child must highlight its parent');
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    if (file === 'guild-war-team.html') {
      assert.ok(html.includes('class="snav-parent"'), 'guild-war-team.html must have snav parent buttons');
      assert.ok(html.includes("querySelectorAll('.snav-parent')"), 'guild-war-team.html must wire the snav dropdowns');
    } else {
      assert.ok(html.includes('class="nav-parent"'), `${file} must have dropdown parent buttons`);
      assert.ok(html.includes("querySelectorAll('.nav-parent')"), `${file} must wire the dropdowns`);
    }
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

test('site font: every page loads Quicksand (Vietnamese) and uses it first', () => {
  const css = fs.readFileSync(path.join(root, 'styles-v3.css'), 'utf8');
  assert.ok(css.includes('font-family:Quicksand,'), 'styles-v3.css must use Quicksand first');
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(html.includes('family=Quicksand:wght@400;500;600;700'), `${file} must load the Quicksand font`);
    assert.ok(!html.includes('Be Vietnam Pro'), `${file} must not still load Be Vietnam Pro`);
  }
});

test('floor guides sort highest floor first', () => {
  const sectionsOf = (html) => [...html.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/g)].map(m => m[1]);
  const floorsOf = (sec) => [...sec.matchAll(/href="[^"]*tang-(\d+)[^"]*"/g)].map(m => Number(m[1]));
  const desc = (f) => [...f].sort((a, b) => b - a);

  const ct = fs.readFileSync(path.join(root, 'celestial-tower.html'), 'utf8');
  const ctHeads = [...ct.matchAll(/<h2>(Tầng [^<]+)<\/h2>/g)].map(m => m[1]);
  assert.deepEqual(ctHeads, ['Tầng 405–450', 'Tầng 305–400', 'Tầng 205–300', 'Tầng 100–200'],
    'celestial tower sections must run highest range first');
  for (const sec of sectionsOf(ct)) {
    const f = floorsOf(sec);
    if (f.length) assert.deepEqual(f, desc(f), 'celestial tower floors must run highest first within each range');
  }
  const tot = fs.readFileSync(path.join(root, 'tower-of-trials.html'), 'utf8');
  for (const sec of sectionsOf(tot)) {
    const f = floorsOf(sec);
    if (f.length) assert.deepEqual(f, desc(f), 'tower of trials floors must run highest first within each season');
  }
  const dg = fs.readFileSync(path.join(root, 'dungeon.html'), 'utf8');
  assert.ok(dg.indexOf('Tiers 11–15') < dg.indexOf('Particle Dungeon — Tier 6'),
    'dungeon must list Tiers 11–15 before Tier 6');
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
