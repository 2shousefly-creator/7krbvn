const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');

// Hierarchical navigation: 8 top-level links + PVE (6 children) + PVP (3 children) + CÔNG CỤ (3 children).
// Top-level order: TRANG CHỦ, NEWBIE, CẬP NHẬT, CỐT TRUYỆN, PVE, PVP, HEROES, TIER LIST,
// SO SÁNH HERO, TỪ ĐIỂN HIỆU ỨNG, CÔNG CỤ — 11 rows, same count as before the 2026-11-20 regrouping.
const NAV_TOP = ['index.html', 'newbie.html', 'cap-nhat.html', 'cot-truyen.html', 'heroes.html', 'tier-list.html', 'so-sanh.html', 'tu-dien-hieu-ung.html'];
const NAV_PVE = ['castle-rush.html', 'advent-expedition.html', 'raid.html', 'celestial-tower.html', 'tower-of-trials.html', 'dungeon.html'];
const NAV_PVP = ['guild-war-team.html', 'arena.html', 'total-war.html'];
const NAV_CONG_CU = ['tinh-ruby.html', 'doi-coupon.html', 'xac-suat-hieu-ung.html'];
const NAV = [...NAV_TOP, ...NAV_PVE, ...NAV_PVP, ...NAV_CONG_CU];

// Pages whose active item is a submenu child, and the parent that must be highlighted.
const CHILD_PARENT = {};
for (const h of NAV_PVE) CHILD_PARENT[h] = 'PVE';
for (const h of NAV_PVP) CHILD_PARENT[h] = 'PVP';
for (const h of NAV_CONG_CU) CHILD_PARENT[h] = 'CÔNG CỤ';

// Home category cards (13) — unaffected by the menu regrouping.
const CAT_CARDS = ['newbie.html', 'cap-nhat.html', 'guild-war-team.html', 'castle-rush.html',
  'advent-expedition.html', 'raid.html', 'celestial-tower.html', 'tower-of-trials.html', 'arena.html', 'heroes.html', 'dungeon.html',
  'tinh-ruby.html', 'doi-coupon.html', 'so-sanh.html', 'tier-list.html', 'tu-dien-hieu-ung.html'];

const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));

function navBlock(html) {
  const i = html.indexOf('<nav class="main-nav"');
  return html.slice(i, html.indexOf('</nav>', i));
}

function parentActiveCount(html) {
  return (html.match(/class="[^"]*nav-parent-active[^"]*"/g) || []).length;
}

test('every page carries the hierarchical navigation with exactly one active item', () => {
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const target of NAV) {
      assert.ok(html.includes(`href="${target}"`), `${file} is missing nav link ${target}`);
    }
    assert.ok(html.includes('data-parent="PVE"'), `${file} is missing the PVE dropdown`);
    assert.ok(html.includes('data-parent="PVP"'), `${file} is missing the PVP dropdown`);
    assert.ok(html.includes('data-parent="CÔNG CỤ"'), `${file} is missing the CÔNG CỤ dropdown`);
    assert.ok(!html.includes('data-parent="TRA CỨU"'), `${file} still has the retired TRA CỨU dropdown`);
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

test('nav order: top-level groups and submenu orders follow the 2026-11-20 regrouping', () => {
  // The order itself is the feature: hero-reference pages sit together at
  // top level (HEROES, TIER LIST, SO SÁNH HERO, TỪ ĐIỂN HIỆU ỨNG), tools
  // group at the end (CÔNG CỤ), PVE follows the home-card order (Dungeon
  // last), PVP leads with Guild War (a most-visited page).
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const nav = navBlock(html);
  const order = ['>TRANG CHỦ</a>', '>NEWBIE</a>', '>CẬP NHẬT</a>', '>CỐT TRUYỆN</a>',
    'data-parent="PVE"', '>CASTLE RUSH</a>', '>ADVENT EXPEDITION</a>', '>RAID</a>',
    '>CELESTIAL TOWER</a>', '>TOWER OF TRIALS</a>', '>DUNGEON</a>',
    'data-parent="PVP"', '>GUILD WAR</a>', '>ARENA</a>', '>TOTAL WAR</a>',
    '>HEROES</a>', '>TIER LIST</a>', '>SO SÁNH HERO</a>', '>TỪ ĐIỂN HIỆU ỨNG</a>',
    'data-parent="CÔNG CỤ"', '>TÍNH RUBY</a>', '>ĐỔI COUPON</a>', '>TÍNH XÁC SUẤT HIỆU ỨNG</a>'];
  const positions = order.map(t => nav.indexOf(t));
  assert.ok(positions.every(i => i >= 0), 'every nav label must be present in order');
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'nav labels must run in the regrouped order');
  // Guild War's nav is the standard nav (unified 2026-11-21), so the same
  // order check applies to its nav block.
  const gw = fs.readFileSync(path.join(root, 'guild-war-team.html'), 'utf8');
  const gwNav = navBlock(gw);
  const gwPositions = order.map(t => gwNav.indexOf(t));
  assert.ok(gwPositions.every(i => i >= 0), 'guild-war nav must carry the same nav labels');
  assert.deepEqual([...gwPositions].sort((a, b) => a - b), gwPositions, 'guild-war nav must run in the same order');
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

test('the home page lists all sixteen category cards (including So Sánh Hero, Tier List, Từ Điển Hiệu Ứng)', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const target of CAT_CARDS) {
    assert.ok(home.includes(`href="${target}"`), `home is missing category card ${target}`);
  }
  assert.equal((home.match(/class="cat-card"/g) || []).length, 16, 'home must have 16 category cards');
});

test('home articles keep their tag implicit (no visible chip)', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const latest = home.slice(home.indexOf('Bài viết mới nhất'),
    home.indexOf('</section>', home.indexOf('Bài viết mới nhất')));
  const latestCards = [...latest.matchAll(/<a class="post-card"([^>]*)>([\s\S]*?)<\/a>/g)];
  assert.equal(latestCards.length, 8, 'home must list 8 latest articles');
  for (const [, attrs, body] of latestCards) {
    assert.ok(/data-tag="[^"]+"/.test(attrs), 'latest card must carry an implicit data-tag');
    assert.ok(!body.includes('article-tag'), 'latest card must not show a tag chip');
  }
  const pinned = home.slice(home.indexOf('Bài viết đã ghim'),
    home.indexOf('</section>', home.indexOf('Bài viết đã ghim')));
  const pinnedCards = [...pinned.matchAll(/<a class="post-card"([^>]*)>([\s\S]*?)<\/a>/g)];
  assert.equal(pinnedCards.length, 1, 'home must pin 1 article for now');
  assert.ok(/data-tag="[^"]+"/.test(pinnedCards[0][1]), 'pinned card must carry an implicit data-tag');
  assert.ok(!pinnedCards[0][2].includes('article-tag'), 'pinned card must not show a tag chip');
  assert.ok(home.includes('data-tag="CẬP NHẬT"'),
    'update article card must carry the implicit CẬP NHẬT tag');
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
  // Arena 13 teams (Attack 4, Magic 2, Tank 3, Hybrid 2, Universal 2) with 2 Meta Prime;
  // Total War 16 teams (Physical 3, Magic 4, Tank 5, Universal 1, Death 3) with 4 Meta Prime.
  const expected = { 'arena.html': { teams: 13, primes: 2 }, 'total-war.html': { teams: 16, primes: 4 } };
  for (const [file, exp] of Object.entries(expected)) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(html.includes('href="atlas.css"'), `${file} must load the Atlas-layout stylesheet`);
    assert.ok(html.includes('class="at-hero'), `${file} must have the Atlas hero banner`);
    assert.ok(html.includes('class="at-prime"'), `${file} must have META PRIME summary cards`);
    assert.ok(html.includes('class="at-tabs"'), `${file} must have the sticky archetype tab bar`);
    assert.ok(html.includes('id="at-search"'), `${file} must have the hero search box`);
    assert.ok(html.includes('class="at-autoskill"') || html.includes('class="at-askill"'), `${file} must show the auto skill priority for each team`);
    const teams = html.match(/class="at-team"/g) || [];
    assert.equal(teams.length, exp.teams, `${file} must show the ${exp.teams} Atlas teams`);
    const panels = html.match(/class="at-askill-panel"/g) || [];
    assert.equal(panels.length, exp.teams, `${file} must show one Auto Skill Priority panel per team`);
    const badges = html.match(/(?:Priority|Ưu tiên) [123]/g) || [];
    assert.equal(badges.length, exp.teams * 3, `${file} must mark Priority/Ưu tiên 1/2/3 in every panel`);
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

test('Total War card (Atlas-style, 18/11): Vietnamese labels, one portrait row, bottom-up skill columns', () => {
  const html = fs.readFileSync(path.join(root, 'total-war.html'), 'utf8');
  // Banner: dark friendly variant, still the at-hero block with the implicit tag.
  assert.ok(html.includes('class="at-hero at-hero--tw"'), 'total-war.html must use the dark friendly banner');
  assert.ok(html.includes('<div class="at-hero-copy" data-tag="TOTAL WAR">'), 'total-war.html must keep the implicit TOTAL WAR tag');
  assert.ok(!html.includes('<span class="article-tag">'), 'total-war.html must not show a tag chip');
  // Header: formation dot-icon chip + details toggle on every team.
  assert.equal((html.match(/class="at-form-chip"/g) || []).length, 16, 'every team must show the formation dot-icon');
  assert.equal((html.match(/class="at-details-btn"/g) || []).length, 16, 'every team must have a Xem chi tiết toggle');
  // Info row in Vietnamese: Tốc độ + Hạng phù hợp grade shields.
  assert.ok(html.includes('Không quan trọng'), 'speed must read Không quan trọng, not Negligible');
  assert.ok(!html.includes('Negligible'), 'total-war.html must not show the English speed label');
  assert.ok(html.includes('Hạng phù hợp'), 'total-war.html must label the tier-suitability shields');
  assert.ok((html.match(/totalwar-grade-(normal|elite|superb|legendary)\.webp/g) || []).length >= 16,
    'total-war.html must show grade shield icons');
  // One portrait row per team, back-row heroes raised, no tier letters.
  assert.equal((html.match(/class="at-team-row"/g) || []).length, 16, 'every team must have one portrait row');
  assert.ok(!html.includes('class="at-board"'), 'total-war.html must not keep the old two-row formation board');
  assert.ok(!html.includes('at-tier t-'), 'total-war.html must not put tier badges on portraits');
  assert.ok(!html.includes('class="at-flow"'), 'total-war.html must not keep the old numbered skill flow');
  // Bare portraits (18/11): no AWK/rarity tags, no visible name under the portrait;
  // the name stays in alt/title, the click popup still shows it.
  assert.ok(!html.includes('class="at-awk"'), 'total-war.html must not show AWK tags on team portraits');
  assert.ok(!html.includes('class="at-rarity"'), 'total-war.html must not show rarity tags on team portraits');
  const teamRows = html.match(/<div class="at-team-row">[\s\S]*?<div class="at-row-legend">/g) || [];
  assert.equal(teamRows.length, 16, 'every team must have one portrait row to check for names');
  assert.ok(teamRows.every(r => !r.includes('<b>')), 'team rows must not show hero names under portraits');
  assert.equal((html.match(/hero-[a-z0-9-]+\.webp" alt="[^"]+" title="[^"]+"/g) || []).length, 80,
    'every team portrait must keep the hero name in alt/title');
  // Back row raised double (32px desktop / 20px mobile) vs the front row.
  const css = fs.readFileSync(path.join(root, 'atlas.css'), 'utf8');
  assert.ok(css.includes('width:auto;padding-top:32px'),
    'atlas.css must raise back-row heroes 32px above the front row on desktop');
  assert.ok(css.includes('.at-team-row .at-hero-cell{padding-top:20px}'),
    'atlas.css must raise back-row heroes 20px above the front row on mobile');
  // Vietnamese headings: translated, old English labels gone.
  assert.ok(html.includes('Đội hình Meta Prime'), 'prime section heading must be Vietnamese');
  assert.ok(html.includes('Đội hình đề xuất'), 'lineups heading must be Vietnamese');
  assert.ok(html.includes('Hero thay thế'), 'alternatives heading must be Vietnamese');
  assert.ok(html.includes('Thú cưng'), 'pet label must be Vietnamese');
  assert.ok(html.includes('Xem đội'), 'prime card link must be Vietnamese');
  assert.ok(!html.includes('Recommended Lineups'), 'total-war.html must not keep the English lineups heading');
  assert.ok(!html.includes('Alternatives —'), 'total-war.html must not keep the English alternatives heading');
  assert.ok(!html.includes('XEM ĐỘI'), 'total-war.html must not keep the English prime card link');
  // No inline per-hero build sections (clicking a portrait opens the hero popup with builds).
  assert.ok(!html.includes('class="at-builds"'), 'total-war.html must not keep the per-hero build details');
  assert.ok(!html.includes('Xem build từng hero'), 'total-war.html must not keep the build details heading');
  // Pet portrait next to every pet name in the info row.
  assert.ok((html.match(/class="at-pet-icon"/g) || []).length >= 16,
    'every team must show a pet portrait next to the pet name');
  for (const src of new Set([...html.matchAll(/assets\/(pet-[a-z]+\.webp)/g)].map(m => m[1]))) {
    assert.ok(fs.existsSync(path.join(root, 'assets', src)), `total-war.html references missing pet portrait ${src}`);
  }
  // CSS regression guards: the role icon must be sized by a rule that beats
  // the portrait img rules, and the row must top-align so front/back baselines hold.
  assert.ok(css.includes('.at-team-row .at-portrait img.at-role-icon'),
    'atlas.css must size the role icon with a selector beating .at-portrait img');
  assert.ok(!css.includes('.at-hero-cell.is-back{transform:translateY'),
    'atlas.css must not raise back-row heroes with translateY on uneven cells');
  assert.ok(css.includes('.at-team-row .at-heroes{flex-wrap:nowrap;align-items:flex-start'),
    'atlas.css must top-align the portrait row');
  assert.ok(!css.includes('.at-builds{'), 'atlas.css must not keep the removed build-details styles');
  assert.ok(html.includes('Hàng sau'), 'total-war.html must explain the red back-row dots');
  assert.ok(html.includes('Hàng trước'), 'total-war.html must explain the blue front-row dots');
  // Skill panel: exactly one per team, Vietnamese title, 48 Vietnamese pills.
  assert.ok(html.includes('Thứ tự dùng skill tự động'), 'skill panel title must be Vietnamese');
  assert.ok(!html.includes('Auto Skill Priority'), 'total-war.html must not show the English skill title');
  const vi = html.match(/Ưu tiên [123]/g) || [];
  assert.equal(vi.length, 48, 'total-war.html must mark Ưu tiên 1/2/3 in every panel');
  assert.ok(!html.includes('Priority 1') && !html.includes('Priority 2') && !html.includes('Priority 3'),
    'total-war.html must not keep English Priority badges');
  // No source attribution anywhere visible.
  assert.ok(!/atlas/i.test(html.replace(/href="atlas\.css"/g, '').replace(/href="atlas\.css"/g, '')),
    'total-war.html must not mention Atlas in visible text');
});

test('article tags: every article page keeps its tag implicit (data-tag, no chip)', () => {
  const tags = {
    'ruby-farming.html': 'NEWBIE',
    'chon-hero-banner.html': 'NEWBIE',
    'nang-cap-hero.html': 'NEWBIE',
    'doi-hinh-hang-truoc-sau.html': 'NEWBIE',
    'cap-nhat-28-10.html': 'CẬP NHẬT',
    'cap-nhat-12-11.html': 'CẬP NHẬT',
    'arena.html': 'ARENA',
    'total-war.html': 'TOTAL WAR',
    'tinh-ruby.html': 'TÍNH RUBY',
    'doi-coupon.html': 'ĐỔI COUPON',
    'xac-suat-hieu-ung.html': 'TÍNH XÁC SUẤT HIỆU ỨNG',
  };
  for (const [file, label] of Object.entries(tags)) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(html.includes(`data-tag="${label}"`), `${file} must carry the implicit ${label} tag`);
    assert.ok(!html.includes('<span class="article-tag">'), `${file} must not show a tag chip`);
  }
});

test('no visible tag chip: no stylesheet may style the retired article-tag', () => {
  for (const file of ['site-nav.css', 'blog.css', 'atlas.css']) {
    const css = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(!css.includes('.article-tag'), `${file} must not style the retired tag chip`);
  }
  // the header copy blocks keep their column layout (unchanged by the tag removal)
  const css = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(css.includes('.blog-intro-copy,.hero-copy{display:flex;flex-direction:column}'),
    'article headers must still lay out as a column');
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
    assert.ok(html.includes('class="nav-parent"'), `${file} must have dropdown parent buttons`);
    assert.ok(html.includes("querySelectorAll('.nav-parent')"), `${file} must wire the dropdowns`);
  }
});

test('mobile hamburger menu: every page has a collapsible nav toggle', () => {
  const css = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(css.includes('.nav-toggle'), 'site-nav.css must style the hamburger toggle');
  assert.ok(css.includes('.main-nav.open'), 'site-nav.css must show the nav when open on mobile');
  assert.ok(css.includes('.main-nav.open .nav-scroll'), 'open nav must lay out as a vertical column');
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(html.includes('class="nav-toggle"'), `${file} must have a hamburger toggle`);
    assert.ok(html.includes('id="site-nav"'), `${file} nav must have the id the toggle controls`);
    assert.ok(html.includes("getElementById('site-nav')"), `${file} must wire the toggle`);
    assert.ok(html.includes('aria-expanded="false"'), `${file} toggle must start collapsed`);
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

test('reading text follows the nang-cap-hero model scale; UI chrome keeps its sizes', () => {
  const base = fs.readFileSync(path.join(root, 'styles-v3.css'), 'utf8');
  const blog = fs.readFileSync(path.join(root, 'blog.css'), 'utf8');
  const nav = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  // model scale (2026-11-21): article body 15px, listing-page lead 18px —
  // supersedes the 2026-11-02 x1.2 scaling (16.8px body, 13.5px lead)
  assert.ok(base.includes('.article-section>p{font-size:15px'), 'article paragraphs must be 15px (model scale)');
  assert.ok(blog.includes('.blog-intro p{color:#c6ccd6;font-size:18px'), 'listing-page lead must be 18px (model scale)');
  assert.ok(blog.includes('.post-body p{font-size:15.6px'), 'listing card excerpts keep their own 15.6px (card UI, not article body)');
  // UI chrome must NOT have grown (nav would overflow, inputs must stay >= 16px)
  assert.ok(nav.includes('.main-nav a{font-size:12.5px'), 'main nav must stay 12.5px');
  assert.ok(base.includes('input,textarea,select{font-size:16px!important'), 'inputs must stay 16px (iOS no-zoom floor)');
  assert.ok(!nav.includes('.article-tag'), 'nav CSS must not style the retired tag chip');
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

test('dropdown carets are big and submenus are ruled, not gold', () => {
  const css = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(css.includes('.nav-caret{font-size:13px'),
    'dropdown carets must be 13px (was 9px) so players can see there is a submenu');
  assert.ok(!css.includes('#e8c16c'),
    'no gold divider may remain on any dropdown (removed 2026-11-21 — ruled lines only)');
  assert.ok(css.includes('.nav-sub a{display:block;font-size:12.5px;font-weight:800;padding:10px 12px;border-radius:8px;white-space:nowrap;color:#4a5160;border-bottom:1px solid #e9e2cf'),
    'desktop dropdown links must carry a ruled line underneath, like notebook paper');
});

test('header: no Fanpage button, logo centered on desktop and left on mobile, bigger', () => {
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(!html.includes('fanpage-link'), `${file} must not keep the header Fanpage button`);
    assert.ok(!html.includes('snav-fp'), `${file} must not keep the guild-war Fanpage button`);
    assert.ok(html.includes('class="brand"'), `${file} must keep the site logo`);
  }
  const base = fs.readFileSync(path.join(root, 'styles-v3.css'), 'utf8');
  assert.ok(!base.includes('.fanpage-link'), 'styles-v3.css must not style the removed Fanpage button');
  assert.ok(base.includes('.brand-mark{width:48px;height:48px'),
    'logo mark must be 48px (was 42px)');
  assert.ok(base.includes('.brand-name{font-size:14px'),
    'logo name must be 14px (was 12px)');
  const nav = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(nav.includes('.site-header .header-inner{gap:20px;justify-content:center'),
    'header must center the logo now the Fanpage button is gone');
  assert.ok(nav.includes('.site-header .header-inner{height:62px;position:relative;justify-content:flex-start}'),
    'on mobile the logo must sit at the left (2026-11-21), not centered');
  assert.ok(nav.includes('.nav-toggle{') && nav.includes('position:absolute;right:14px'),
    'mobile MENU button must sit absolute at the header right so the logo stays centered');
});

test('page entrance animations: main slides in, banners fade, reduced motion opts out', () => {
  const css = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(css.includes('@keyframes page-in'), 'site-nav.css must define the page entrance keyframes');
  assert.ok(css.includes('main{animation:page-in'), 'every page must animate in on load');
  assert.ok(css.includes('.blog-intro,.hero,.at-hero{animation:banner-in'),
    'banners must fade in on page entry');
  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'),
    'reduced-motion users must skip the animations');
  assert.ok(css.includes('animation:none'), 'reduced-motion must turn the animations off');
});

test('arena team display is mobile-first: hero names half size on mobile', () => {
  const css = fs.readFileSync(path.join(root, 'atlas.css'), 'utf8');
  assert.ok(css.includes('.at-hero-cell b{display:block;font-size:15px'),
    'hero names must be 15px on desktop');
  assert.ok(css.includes('.at-hero-cell b{font-size:7.5px'),
    'hero names must be half size (7.5px) on mobile');
  assert.ok(css.includes('.at-team{padding:14px}'),
    'team cards must tighten their padding on mobile');
  assert.ok(css.includes('.at-team-head h3{font-size:18px;min-width:0}'),
    'team titles must shrink and wrap freely on mobile');
  assert.ok(css.includes('.at-heroes{gap:8px}'),
    'team portrait rows must tighten their gaps on mobile');
});

test('mobile menu items are ruled like notebook paper: a line under every row', () => {
  const css = fs.readFileSync(path.join(root, 'site-nav.css'), 'utf8');
  assert.ok(css.includes('.main-nav.open a{display:block;padding:11px 12px;font-size:13px;border-bottom:1px solid #e9e2cf'),
    'mobile menu links must carry a ruled line underneath');
  assert.ok(css.includes('.main-nav.open .nav-parent{display:flex;width:100%;justify-content:space-between;padding:11px 12px;font-size:13px;border-bottom:1px solid #e9e2cf'),
    'mobile submenu parent buttons must carry a ruled line underneath');
  assert.ok(!css.includes('.nav-item.open .nav-parent{border-bottom:0}'),
    'an open parent must keep its row line now the gold divider is gone');
});
