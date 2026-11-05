const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');

// Hierarchical navigation: 7 top-level links + PVE (5 children) + PVP (3 children).
const NAV_TOP = ['index.html', 'newbie.html', 'cap-nhat.html', 'cot-truyen.html', 'heroes.html', 'tinh-ruby.html', 'doi-coupon.html'];
const NAV_PVE = ['castle-rush.html', 'raid.html', 'dungeon.html', 'celestial-tower.html', 'tower-of-trials.html'];
const NAV_PVP = ['arena.html', 'total-war.html', 'guild-war-team.html'];
const NAV = [...NAV_TOP, ...NAV_PVE, ...NAV_PVP];

// Pages whose active item is a submenu child, and the parent that must be highlighted.
const CHILD_PARENT = {};
for (const h of NAV_PVE) CHILD_PARENT[h] = 'PVE';
for (const h of NAV_PVP) CHILD_PARENT[h] = 'PVP';

// Home category cards (12) — unaffected by the menu regrouping.
const CAT_CARDS = ['newbie.html', 'cap-nhat.html', 'guild-war-team.html', 'castle-rush.html',
  'raid.html', 'celestial-tower.html', 'tower-of-trials.html', 'arena.html', 'heroes.html', 'dungeon.html',
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

test('the home page lists all twelve category cards (including the new Heroes card)', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const target of CAT_CARDS) {
    assert.ok(home.includes(`href="${target}"`), `home is missing category card ${target}`);
  }
  assert.equal((home.match(/class="cat-card"/g) || []).length, 12, 'home must have 12 category cards');
});

test('home articles show their tag labels', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const latest = home.slice(home.indexOf('Bài viết mới nhất'),
    home.indexOf('</section>', home.indexOf('Bài viết mới nhất')));
  const latestCards = [...latest.matchAll(/<a class="post-card" href="([^"]+)">([\s\S]*?)<\/a>/g)];
  assert.equal(latestCards.length, 7, 'home must list 7 latest articles');
  for (const [, href, body] of latestCards) {
    assert.ok(body.includes('<span class="article-tag">'), `${href} card must show its tag label`);
  }
  const pinned = home.slice(home.indexOf('Bài viết đã ghim'),
    home.indexOf('</section>', home.indexOf('Bài viết đã ghim')));
  const pinnedCards = [...pinned.matchAll(/<a class="post-card" href="([^"]+)">([\s\S]*?)<\/a>/g)];
  assert.equal(pinnedCards.length, 1, 'home must pin 1 article for now');
  assert.ok(pinnedCards[0][2].includes('<span class="article-tag">'), 'pinned card must show its tag label');
  assert.ok(home.includes('<span class="article-tag">CẬP NHẬT</span>'),
    'update article card must carry the CẬP NHẬT tag');
});

test('sticky header: the header stays fixed at the top on every page', () => {
  const css = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(css.includes('.site-header{position:sticky'), 'site-nav.css must make the header sticky');
  assert.ok(css.includes('top:0'), 'sticky header must sit at the top of the viewport');
  assert.ok(css.includes('scroll-margin-top:150px'), 'anchor jumps must clear the sticky header');
});

test('back to top: every page has a back-to-top button', () => {
  const css = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(css.includes('.back-to-top'), 'site-nav.css must style the back-to-top button');
  assert.ok(css.includes('.back-to-top.show'), 'the button must appear after scrolling down');
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(html.includes('class="back-to-top"'), `${file} must have a back-to-top button`);
    assert.ok(html.includes("window.scrollTo({top:0,behavior:'smooth'})"), `${file} button must scroll to top`);
  }
});

test('no auto dark mode: no page may flip to dark from the system theme', () => {
  // the whole site is light by design; a prefers-color-scheme: dark rule
  // (guild-war-team.html used to have 4) turns pages dark on phones in
  // dark mode while the rest of the site stays light.
  for (const file of fs.readdirSync(root).filter(f => f.endsWith('.html') || f.endsWith('.css'))) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(!text.includes('prefers-color-scheme: dark'), `${file} must not contain a dark-mode rule`);
  }
  const gw = fs.readFileSync(path.join(root, 'guild-war-team.html'), 'utf8');
  assert.ok(gw.includes('color-scheme: light;'), 'guild war page must declare a light-only colour scheme');
});

test('Atlas layout (light): Arena and Total War use the Atlas structure with real portraits', () => {
  // team counts come from the Atlas compilations themselves:
  // Arena 16 teams (Attack 4, Magic 4, Tank 6, Hybrid 2) with 3 Meta Prime;
  // Total War 15 teams (Physical 4, Magic 4, Tank 4, Death 3) with 4 Meta Prime.
  const expected = { 'arena.html': { teams: 16, primes: 3 }, 'total-war.html': { teams: 15, primes: 4 } };
  for (const [file, exp] of Object.entries(expected)) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(html.includes('href="atlas.css"'), `${file} must load the Atlas-layout stylesheet`);
    assert.ok(html.includes('class="at-hero"'), `${file} must have the Atlas hero banner`);
    assert.ok(html.includes('class="at-prime"'), `${file} must have META PRIME summary cards`);
    assert.ok(html.includes('class="at-tabs"'), `${file} must have the sticky archetype tab bar`);
    assert.ok(html.includes('id="at-search"'), `${file} must have the hero search box`);
    assert.ok(html.includes('class="at-autoskill"') || html.includes('class="at-askill"'), `${file} must show the auto skill priority for each team`);
    const teams = html.match(/class="at-team"/g) || [];
    assert.equal(teams.length, exp.teams, `${file} must show the ${exp.teams} Atlas teams`);
    const panels = html.match(/class="at-askill-panel"/g) || [];
    assert.equal(panels.length, exp.teams, `${file} must show one Auto Skill Priority panel per team`);
    const badges = html.match(/Priority [123]/g) || [];
    assert.equal(badges.length, exp.teams * 3, `${file} must mark Priority 1/2/3 in every panel`);
    const primes = html.match(/at-prime-card/g) || [];
    assert.equal(primes.length, exp.primes, `${file} must show the ${exp.primes} Meta Prime cards`);
    const cells = html.match(/at-hero-cell/g) || [];
    assert.equal(cells.length, exp.teams * 5, `${file} must show 5 heroes per team`);
    assert.ok(!html.includes('Randgrid'), `${file} must not carry the old Randgrid typo`);
    for (const src of new Set([...html.matchAll(/assets\/(hero(?:-awk)?-[a-z0-9-]+\.webp)/g)].map(m => m[1]))) {
      assert.ok(fs.existsSync(path.join(root, 'assets', src)), `${file} references missing portrait ${src}`);
    }
    for (const src of new Set([...html.matchAll(/assets\/skills\/([A-Za-z0-9-]+\.webp)/g)].map(m => m[1]))) {
      assert.ok(fs.existsSync(path.join(root, 'assets', 'skills', src)), `${file} references missing skill icon ${src}`);
    }
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

test('content text is 20% larger for readability; UI chrome keeps its sizes', () => {
  const base = fs.readFileSync(path.join(root, 'styles-v3.css'), 'utf8');
  const blog = fs.readFileSync(path.join(root, 'blog.css'), 'utf8');
  const nav = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  // article body text: 14px -> 16.8px (mobile 13px -> 15.6px)
  assert.ok(base.includes('.article-section>p{font-size:16.8px'), 'article paragraphs must be 16.8px');
  assert.ok(blog.includes('.post-body p{font-size:15.6px'), 'listing card text must be 15.6px');
  assert.ok(blog.includes('.blog-intro p{color:#c6ccd6;font-size:13.5px'), 'article intro text must be 13.5px');
  // UI chrome must NOT have grown (nav would overflow, inputs must stay >= 16px)
  assert.ok(nav.includes('.main-nav a{font-size:12.5px'), 'main nav must stay 12.5px');
  assert.ok(base.includes('input,textarea,select{font-size:16px!important'), 'inputs must stay 16px (iOS no-zoom floor)');
  assert.ok(nav.includes('.article-tag{display:inline-flex'), 'article tag chip must keep its size');
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
