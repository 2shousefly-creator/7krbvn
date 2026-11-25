const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Canonical reading scale, taken from the model article nang-cap-hero.html
// (styles-v3 + blog + site-nav + growth-guide, growth-guide winning where
// it overrides), 2026-11-21:
//   H1 page title : clamp(34.8px,4.44vw,51.6px)   (.guide-title)
//   Lead          : 18px / 16.8px mobile
//   H2 article    : 25px / 22px mobile
//   H3 article    : 19px / 17px mobile
//   H4            : 16px / 14px mobile
//   Body p/li     : 15px / 14px mobile
//   Caption       : 12px / 11px mobile
//   Callout/note  : 14px / 13px mobile
//   Table         : 13px / 12px mobile, th 12px
// Tool/data UI (calculator form labels, card titles, buttons, badges,
// popups, team data, hero/tier/compare/effect-calc internals, nav, footer)
// keeps its own scale and is NOT covered here.
const root = path.join(__dirname, '..', 'public');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const v3 = read('styles-v3.css');
const blog = read('blog.css');
const atlas = read('atlas.css');
const growth = read('growth-guide.css');
const gw = read('guild-war-team.html');
const act1 = read('cot-truyen-act-1.html');
const heroes = read('heroes.css');
const calc = read('effect-calc.css');
const search = read('search.css');
const tier = read('tier-list.css');
const compare = read('compare.css');
const gloss = read('glossary.css');
const castle = read('castle-rush.css');
const coupon = read('doi-coupon.html');
const storySrc = fs.readFileSync(
  path.join(__dirname, '..', '..', 'seven-knights-drafts', 'story-article-style.html'), 'utf8');
const H1 = 'clamp(34.8px,4.44vw,51.6px)';

test('typography: the model article itself still carries the canon (2026-11-21)', () => {
  assert.ok(growth.includes('.growth-guide .article-section h2{font-size:25px'),
    'model h2 must stay 25px — it is the canon everything else matches');
  assert.ok(growth.includes('.growth-guide .article-section p,.growth-guide .article-section li{font-size:15px'),
    'model body must stay 15px');
  assert.ok(growth.includes('.growth-guide .article-section h3{font-size:19px'),
    'model h3 must stay 19px');
  assert.ok(growth.includes('.growth-guide .article-section figcaption{font-size:12px'),
    'model caption must stay 12px');
  assert.ok(growth.includes('.growth-guide .callout p{margin:0;font-size:14px'),
    'model callout must stay 14px');
  assert.ok(growth.includes('.growth-table{width:100%;min-width:520px;border-collapse:collapse;font-size:13px'),
    'model table must stay 13px');
  assert.ok(blog.includes(`.guide-title{font-size:${H1}!important}`),
    'model h1 (.guide-title) must stay the clamp — it is the page-title canon');
});

test('typography: shared article headings and body match the model', () => {
  assert.ok(v3.includes('.article-section h2{font-size:25px'),
    'article h2 must be 25px like the model (was 30px from the x1.2 scaling)');
  assert.ok(v3.includes('.article-section h2{font-size:22px}'),
    'article h2 must be 22px on mobile (was 26.4px)');
  assert.ok(v3.includes('.article-section>p{font-size:15px'),
    'article body must be 15px like the model (was 16.8px)');
  assert.ok(v3.includes('.article-section>p{font-size:14px}'),
    'article body must be 14px on mobile (was 15.6px)');
  assert.ok(blog.includes('.article-section h3{font-size:19px'),
    'article h3 must be 19px like the model (was 19.2px)');
  assert.ok(blog.includes('.article-section h3{font-size:17px}'),
    'article h3 must be 17px on mobile');
  assert.ok(blog.includes('.article-section ul:not(.check-list),.article-section ol{padding-left:20px;color:#5f6675;font-size:15px'),
    'article lists must be 15px like the body (was 16.8px)');
  assert.ok(blog.includes('.article-section ul:not(.check-list),.article-section ol{font-size:14px}'),
    'article lists must be 14px on mobile (was 15.6px)');
  assert.ok(v3.includes('figcaption{font-size:12px'),
    'captions must be 12px like the model (was 13.2px)');
  assert.ok(v3.includes('figcaption{font-size:11px}'),
    'captions must be 11px on mobile');
  assert.ok(v3.includes('.callout p{font-size:14px'),
    'callouts must be 14px like the model (was 15.6px)');
  assert.ok(v3.includes('.callout p{font-size:13px}'),
    'callouts must be 13px on mobile');
  assert.ok(v3.includes('padding:15px 17px;font-size:15px;font-weight:750'),
    'FAQ/details summaries must be 15px like the model (was 15.6px)');
  assert.ok(v3.includes('.guide-details>p,.source-details>p{color:#68707d;font-size:15px'),
    'details body text must be 15px like article body (was 14.4px)');
  assert.ok(v3.includes('.guide-details>p,.source-details>p{font-size:14px}'),
    'details body text must be 14px on mobile');
  assert.ok(v3.includes('.guide-table{border-collapse:collapse;width:100%;min-width:500px;text-align:left;font-size:13px}'),
    'guide tables must be 13px like the model (was 14.4px)');
  assert.ok(v3.includes('.guide-table{font-size:12px}'),
    'guide tables must be 12px on mobile');
  assert.ok(!v3.includes('.article-section h2{font-size:30px'),
    'the old 30px article h2 must be gone');
  assert.ok(!v3.includes('.article-section>p{font-size:16.8px'),
    'the old 16.8px article body must be gone');
  assert.ok(!blog.includes('.article-section h3{font-size:19.2px'),
    'the old 19.2px article h3 must be gone');
});

test('typography: every page-title h1 uses the model clamp', () => {
  assert.ok(v3.includes(`.hero h1{font-size:${H1}`),
    'home hero h1 must use the model clamp (was 37.2px/4.32vw/55.2px)');
  assert.ok(blog.includes(`.blog-intro h1{font-size:${H1}`),
    'listing-page h1 must use the model clamp (was 26px/3vw/36px)');
  assert.ok(atlas.includes(`.at-hero h1{font-size:${H1}`),
    'arena/total-war h1 must use the model clamp (was 34px/4.5vw/52px)');
  assert.ok(atlas.includes(`.at-hero--tw h1{color:#fff;font-size:${H1}`),
    'total-war dark-banner h1 must use the model clamp (was 26px/3vw/36px)');
  assert.ok(gw.includes(`h1{font-size:${H1}`),
    'guild-war page h1 must use the model clamp (was 23.8px/5vw/35.7px)');
  assert.ok(!v3.includes('.hero h1{font-size:42px') && !v3.includes('.hero h1{font-size:40.8px') && !v3.includes('.hero h1{font-size:36px}'),
    'no mobile hero-h1 override may survive — the clamp floor (34.8px) governs on mobile');
  assert.ok(!blog.includes('.blog-intro h1{font-size:28px}'),
    'no mobile blog-intro h1 override may survive — the clamp floor governs');
  assert.ok(!atlas.includes('.at-hero--tw h1{font-size:28px}'),
    'no mobile total-war h1 override may survive — the clamp floor governs');
});

test('typography: banner leads use the model 18px', () => {
  assert.ok(v3.includes('.hero p{color:#687080;max-width:475px;font-size:18px'),
    'home hero lead stays 18px (it already matched the model)');
  assert.ok(blog.includes('.blog-intro p{color:#c6ccd6;font-size:18px'),
    'listing-page lead must be 18px like the model (was 13.5px)');
  assert.ok(blog.includes('.blog-intro p{font-size:16.8px}'),
    'listing-page lead must be 16.8px on mobile');
  assert.ok(atlas.includes('.at-hero p{font-size:18px'),
    'arena/total-war lead must be 18px like the model (was 16px)');
  assert.ok(atlas.includes('.at-hero--tw p{color:#c6ccd6;font-size:18px'),
    'total-war dark-banner lead must be 18px like the model (was 13.5px)');
});

test('typography: quick-summary content matches normal body text (2026-11-21)', () => {
  // Two "Tóm tắt nhanh" shapes: .quick-cards (ruby-farming, chon-hero-banner,
  // doi-hinh-hang-truoc-sau) and callout boxes with a <b>Tóm tắt nhanh:</b>
  // label + list (cap-nhat-12-11, corridor). The descriptive content must
  // read at body size (15px / 14px mobile); the card titles stay h3 size.
  assert.ok(v3.includes('.quick-card small{font-size:15px'),
    'quick-card descriptions must be 15px like article body (was 14px)');
  assert.ok(v3.includes('.quick-card small{margin-top:3px;font-size:14px}'),
    'quick-card descriptions must be 14px on mobile');
  assert.ok(v3.includes('.quick-card strong{font-size:19px'),
    'quick-card titles stay 19px (h3) — only the descriptive content syncs to body size');
  assert.ok(v3.includes('.quick-card strong{font-size:17px}'),
    'quick-card titles stay 17px on mobile');
  for (const file of ['cap-nhat-12-11.html', 'cap-nhat-26-11.html', 'corridor.html']) {
    const html = read(file);
    assert.ok(html.includes('<ul style="margin:6px 0 0;padding-left:20px;font-size:15px;line-height:1.7;color:#606a7e">'),
      `${file}: the "Tóm tắt nhanh" callout list must be 15px like article body (was inline 15.6px)`);
    assert.ok(!html.includes('font-size:15.6px'),
      `${file}: no stale inline 15.6px may remain`);
  }
});

test('typography: guild-war section headings and story pages match the model', () => {
  assert.ok(gw.includes('.group-head h2{font-size:25px'),
    'guild-war group headings must be 25px like article h2 (was 18.7px)');
  assert.ok(gw.includes('.group-head h2{font-size:22px}'),
    'guild-war group headings must be 22px on mobile');
  assert.ok(gw.includes('.p-head h3{margin:0;font-size:19px'),
    'guild-war pet-library heading must be 19px like article h3 (was 20.4px)');
  for (const [name, css] of [['story source', storySrc], ['act-1 page', act1]]) {
    assert.ok(css.includes('.act-card h3{font-size:19px'),
      `${name}: act-card h3 must be 19px like article h3 (was 21.6px)`);
    assert.ok(css.includes('.story-ch-body h3{font-size:19px'),
      `${name}: chapter h3 must be 19px (was 21.6px)`);
    assert.ok(css.includes('.act-card h3{font-size:17px}') && css.includes('.story-ch-body h3{font-size:17px}'),
      `${name}: story h3s must be 17px on mobile (was 18px)`);
    assert.ok(css.includes('.story-lead-text{font-size:15px'),
      `${name}: story lead text must be 15px like article body (was 15.6px)`);
    assert.ok(css.includes('.story-line{display:flex;gap:10px;align-items:flex-start;margin:0 0 10px;font-size:15px'),
      `${name}: story dialogue lines must be 15px like article body (was 16.2px)`);
    assert.ok(css.includes('.story-line{font-size:14px}'),
      `${name}: story dialogue lines must be 14px on mobile (was 15px)`);
  }
});

test('typography: popups, search, dropdowns and team cards match the model (2026-11-25 full sync)', () => {
  // Hero popup (heroes.css): skill descriptions at body size, hero name at h3.
  assert.ok(heroes.includes('.hx-skill p{font-size:15px'),
    'popup skill descriptions must be 15px like article body (was 13.5px)');
  assert.ok(heroes.includes('.hx-skill p{font-size:14px}'),
    'popup skill descriptions must be 14px on mobile');
  assert.ok(heroes.includes('.hx-modal-hero h3{margin:0;font-size:19px}'),
    'popup hero names must be 19px like article h3 (was 20px)');
  assert.ok(heroes.includes('.hx-modal-overview{margin:12px 0 0;font-size:15px'),
    'popup hero overviews must be 15px like article body (was 13.5px)');
  // Guild War cards + detail sheet: hero names and skill text at body size.
  assert.ok(gw.includes('.hero .hn{font-size:15px'),
    'guild-war card hero names must be 15px like article body (was 9.8px)');
  assert.ok(gw.includes('.hero .hn{font-size:14px}'),
    'guild-war card hero names must be 14px on mobile');
  assert.ok(gw.includes('.skill-txt{font-size:15px}'),
    'guild-war sheet skill text must be 15px like article body (was 11.9px)');
  assert.ok(gw.includes('.sheet-head h2{margin:2px 0 4px;font-size:25px'),
    'guild-war sheet titles must be 25px like article h2 (was a 17–22.9px clamp)');
  assert.ok(gw.includes('.sg-item .sg-name{font-weight:700;font-size:15px}'),
    'guild-war search suggestions must be 15px like article body (was 11.9px)');
  // Arena / Total War: mobile hero names no longer halved.
  assert.ok(atlas.includes('.at-hero-cell b{font-size:14px}'),
    'atlas mobile hero names must be 14px — the 2026-11-25 full sync supersedes the 7.5px halving');
  assert.ok(atlas.includes('.at-team-head h3{font-size:19px'),
    'atlas team titles must be 19px like article h3 (was 20px)');
  // Tier list, compare, glossary, search.
  assert.ok(tier.includes('.tl-card b{display:block;font-size:15px'),
    'tier-list hero names must be 15px like article body (was 12.5px)');
  assert.ok(compare.includes('.cp-skill p{margin:6px 0;font-size:15px'),
    'compare skill descriptions must be 15px like article body (was 14.5px)');
  assert.ok(gloss.includes('.gl-names{font-size:19px'),
    'effect dictionary names must be 19px like article h3 (was 17px)');
  assert.ok(search.includes('.search-group-title{margin:0 0 10px;font-size:14px'),
    'search result group labels must be 14px like callouts (was 13px)');
  // Effect calculator picker tiles.
  assert.ok(calc.includes('.ec-tile-name { display: block; font-weight: 700; font-size: 14px;'),
    'effect-calc picker tile names must be 14px like callouts (was 12px)');
  // Castle Rush + coupon: result/content text at body/callout size.
  assert.ok(castle.includes('.cr-hero span{font-weight:700;font-size:15px'),
    'castle-rush hero names must be 15px like article body (was 13px)');
  assert.ok(coupon.includes('#doi-coupon .coupon-status{font-size:14px'),
    'coupon redeem status must be 14px like callouts (was 13px)');
  // No stale halved/off-scale popup sizes may remain.
  assert.ok(!atlas.includes('.at-hero-cell b{font-size:7.5px'),
    'the old 7.5px atlas mobile hero names must be gone');
  assert.ok(!heroes.includes('.hx-skill p{font-size:13.5px'),
    'the old 13.5px popup skill text must be gone');
  assert.ok(!gw.includes('.skill-txt{font-size:11.9px}'),
    'the old 11.9px guild-war sheet skill text must be gone');
});
