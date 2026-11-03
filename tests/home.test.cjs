const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');
const page = name => fs.readFileSync(path.join(root, name), 'utf8');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));

const SLIDES = [
  ['Chi tiết cập nhật 28/10/2026', 'cap-nhat-28-10.html'],
  ['Hướng dẫn Newbie', 'newbie.html'],
  ['Cách build trang bị từng Hero', 'heroes.html'],
  ['Cách vượt Celestial Tower tầng 450', 'celestial-tower-tang-450.html'],
  ['Cách vượt Tower of Trials mùa 18', 'tower-of-trials-s18-full.html'],
];

test('home hero slider: 5 slides with titles, descriptions and XEM NGAY CTAs', () => {
  const home = page('index.html');
  assert.ok(home.includes('id="hero-slider"'), 'home must have the hero slider');
  assert.ok(home.includes('<h1 class="sr-only">Sổ tay Seven Knights Re:Birth</h1>'),
    'home must keep its h1 for screen readers');
  const slides = [...home.matchAll(/<article class="hero-slide(?: is-active)?">([\s\S]*?)<\/article>/g)];
  assert.equal(slides.length, 5, 'slider must have exactly 5 slides');
  assert.ok(slides[0][1].includes('is-active') || slides[0][0].includes('is-active'),
    'the first slide must start active');
  for (const [i, [title, href]] of SLIDES.entries()) {
    const body = slides[i][1];
    assert.ok(body.includes(`<h2>${title}</h2>`), `slide ${i + 1} must be titled ${title}`);
    assert.ok(body.includes(`<a class="hero-cta" href="${href}">XEM NGAY`),
      `slide ${i + 1} must link to ${href} with a XEM NGAY CTA`);
    assert.ok(body.includes('<p>') && body.match(/<p>[^<]{20,}<\/p>/),
      `slide ${i + 1} must have a short description`);
    assert.ok(body.includes('<img src="assets/hero-'), `slide ${i + 1} must show a hero portrait`);
  }
  // Controls: prev/next arrows + one dot per slide.
  assert.ok(home.includes('class="hero-arrow hero-prev"'), 'slider must have a previous arrow');
  assert.ok(home.includes('class="hero-arrow hero-next"'), 'slider must have a next arrow');
  assert.equal((home.match(/aria-label="Tới slide \d"/g) || []).length, 5, 'slider must have 5 dots');
});

test('home hero slider: auto-advances every 3s, swipeable, pauses on interaction', () => {
  const home = page('index.html');
  assert.ok(home.includes('setInterval(function(){go(cur+1)},3000)'), 'slider must auto-advance every 3 seconds');
  assert.ok(home.includes("addEventListener('touchstart'"), 'slider must listen for swipe start');
  assert.ok(home.includes("addEventListener('touchend'"), 'slider must listen for swipe end');
  assert.ok(home.includes('Math.abs(dx)>40'), 'swipe must need a real horizontal drag');
  assert.ok(home.includes("addEventListener('mouseenter',stop)"), 'slider must pause on hover');
  assert.ok(home.includes('prefers-reduced-motion'), 'slider must respect reduced-motion');
  const css = page('blog.css');
  assert.ok(css.includes('.hero-track{position:relative;min-height:150px'), 'desktop slides must stay compact (~150px)');
  assert.ok(css.includes('.hero-track{min-height:196px'), 'mobile slides must stay compact (~196px)');
});

test('home structure: banner, pinned posts, latest posts, category cards — in that order', () => {
  const home = page('index.html');
  const order = ['home-hero', 'Bài viết đã ghim', 'Bài viết mới nhất', 'Danh mục']
    .map(t => home.indexOf(t));
  assert.ok(order.every(i => i >= 0), 'home must have all four sections');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'sections must run banner, pinned, latest, categories');
  assert.ok(home.includes('<p>12 chuyên mục</p>'), 'category count must say 12 (there are 12 cards)');
});

test('pinned posts: Ruby Farming is pinned with a pin icon, section holds up to 4', () => {
  const home = page('index.html');
  const pinned = home.slice(home.indexOf('Bài viết đã ghim'),
    home.indexOf('</section>', home.indexOf('Bài viết đã ghim')));
  assert.ok(pinned.includes('href="ruby-farming.html"'), 'Ruby Farming must be pinned');
  assert.ok(pinned.includes('class="pin-badge"'), 'every pinned post must show a pin icon');
  assert.ok(pinned.includes('Tối đa 4 bài'), 'pinned section must state the 4-post cap');
  assert.equal((pinned.match(/<a class="post-card"/g) || []).length, 1, 'one post is pinned for now');
  const latest = home.slice(home.indexOf('Bài viết mới nhất'),
    home.indexOf('</section>', home.indexOf('Bài viết mới nhất')));
  assert.equal((latest.match(/<a class="post-card"/g) || []).length, 4, 'latest must still list 4 articles');
});

test('home post grids: 2 compact cards per row on mobile', () => {
  const css = page('blog.css');
  assert.ok(css.includes('.home-posts .post-grid{grid-template-columns:repeat(2,minmax(0,1fr))'),
    'home grids must show 2 cards per row on mobile');
  assert.ok(css.includes('.home-posts .post-image{height:104px'), 'mobile card images must shrink');
  assert.ok(css.includes('.home-posts .post-body h3{font-size:15px'), 'mobile card titles must shrink');
  assert.ok(css.includes('.home-posts .post-link{display:none'), 'mobile cards hide the redundant read link');
  const home = page('index.html');
  assert.ok(home.includes('<section class="home-posts" aria-labelledby="pinned-title">'),
    'pinned section must use the compact home grid');
  assert.ok(home.includes('<section class="home-posts" aria-labelledby="posts-title">'),
    'latest section must use the compact home grid');
});

test('category cards: no descriptions, 3 compact cards per row on mobile', () => {
  const home = page('index.html');
  const grid = home.slice(home.indexOf('cat-grid'), home.indexOf('</section>', home.indexOf('cat-grid')));
  assert.equal((grid.match(/<a class="cat-card"/g) || []).length, 12, 'home must still list 12 category cards');
  assert.ok(!grid.includes('<p>'), 'category cards must not carry description text');
  assert.ok(grid.includes('<span class="cat-count">'), 'category cards keep their count line');
  const css = page('site-nav.css');
  assert.ok(css.includes('.cat-grid{grid-template-columns:repeat(3,minmax(0,1fr))'),
    'category grid must show 3 cards per row on mobile');
  assert.ok(css.includes('.cat-card h3{font-size:13.5px'), 'mobile category titles must shrink');
});

test('mobile menu button: MENU text sits inside the toggle on every page', () => {
  const css = page('site-nav.css');
  assert.ok(css.includes('.nav-toggle-label{font-size:11px'), 'site-nav.css must style the MENU label');
  assert.ok(css.includes('.nav-toggle-icon'), 'site-nav.css must style the icon wrapper');
  assert.ok(css.includes('.nav-toggle.is-open .nav-toggle-icon span:nth-child(1)'),
    'the open-state X animation must target the icon lines, not the label');
  for (const file of pages) {
    const html = page(file);
    if (file === 'guild-war-team.html') {
      assert.ok(html.includes('<span class="snav-toggle-label">MENU</span>'),
        'guild-war-team.html snav toggle must show MENU');
      assert.ok(html.includes('.snav-toggle-label{font-size:11px'),
        'guild-war-team.html must style its MENU label');
    } else {
      assert.ok(html.includes('<span class="nav-toggle-label">MENU</span>'),
        `${file} toggle must show MENU`);
    }
  }
});
