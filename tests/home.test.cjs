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
  const slides = [...home.matchAll(/<article class="hero-slide">([\s\S]*?)<\/article>/g)];
  assert.equal(slides.length, 5, 'slider must have exactly 5 slides');
  // Slide-left: the track is a flex row and the JS moves it with translateX.
  assert.ok(home.includes("track.style.transform='translateX('+(-cur*100)+'%)'"),
    'slider must move the track left with translateX(-N*100%)');
  const css = page('blog.css');
  assert.ok(css.includes('.hero-track{display:flex;min-height:150px;transition:transform .5s ease'),
    'hero track must be a flex row that slides left');
  assert.ok(!css.includes('.hero-slide.is-active'), 'slides must not rely on a fade is-active rule');
  assert.ok(css.includes('.hero-slide-copy{position:relative;z-index:2;padding:16px 26px 16px 56px'),
    'slide copy must clear the prev arrow (56px left padding)');
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
  assert.ok(css.includes('.hero-track{display:flex;min-height:150px'), 'desktop slides must stay compact (~150px)');
  assert.ok(css.includes('.hero-track{min-height:196px'), 'mobile slides must stay compact (~196px)');
});

test('home structure: banner, most-visited categories, pinned posts, latest posts, quick-access categories — in that order', () => {
  const home = page('index.html');
  const order = ['home-hero', 'Danh mục truy cập nhiều', 'Bài viết đã ghim', 'Bài viết mới nhất', 'Danh mục truy cập nhanh']
    .map(t => home.indexOf(t));
  assert.ok(order.every(i => i >= 0), 'home must have all five sections');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'sections must run banner, most-visited, pinned, latest, quick-access');
  assert.ok(home.includes('<p>3 chuyên mục</p>'), 'most-visited section must say 3 categories');
  assert.ok(home.includes('<p>9 chuyên mục</p>'), 'quick-access section must say 9 categories');
  const popular = home.slice(home.indexOf('Danh mục truy cập nhiều'),
    home.indexOf('</section>', home.indexOf('Danh mục truy cập nhiều')));
  assert.deepEqual([...popular.matchAll(/<a class="cat-card" href="([^"]+)">/g)].map(m => m[1]),
    ['newbie.html', 'heroes.html', 'guild-war-team.html'],
    'most-visited must list Newbie, Heroes, Guild War Team in that order');
  assert.ok(!home.includes('<a class="cat-card" href="cot-truyen.html">'), 'the story menu must not appear as a home category card yet');
});

test('pinned posts: Ruby Farming is pinned with a pin icon, no redundant labels', () => {
  const home = page('index.html');
  const pinned = home.slice(home.indexOf('Bài viết đã ghim'),
    home.indexOf('</section>', home.indexOf('Bài viết đã ghim')));
  assert.ok(pinned.includes('href="ruby-farming.html"'), 'Ruby Farming must be pinned');
  assert.ok(pinned.includes('class="pin-badge"'), 'every pinned post must show a pin icon');
  assert.ok(!home.includes('ĐÃ GHIM'), 'pinned section must not repeat a ĐÃ GHIM label');
  assert.ok(!home.includes('Tối đa 4 bài'), 'pinned section must not state the 4-post cap');
  assert.ok(!home.includes('MỚI NHẤT'), 'latest section must not repeat a MỚI NHẤT label');
  assert.equal((pinned.match(/<a class="post-card"/g) || []).length, 1, 'one post is pinned for now');
  const latest = home.slice(home.indexOf('Bài viết mới nhất'),
    home.indexOf('</section>', home.indexOf('Bài viết mới nhất')));
  assert.equal((latest.match(/<a class="post-card"/g) || []).length, 7, 'latest must list 7 articles');
});

test('post grids: 2 compact cards per row on mobile, synced across all menu pages', () => {
  const css = page('blog.css');
  assert.ok(css.includes('.post-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px'),
    'mobile grids must show 2 cards per row on every menu page');
  assert.ok(css.includes('.post-image{height:104px'), 'mobile card images must shrink');
  assert.ok(css.includes('.post-body h3{font-size:15px'), 'mobile card titles must shrink');
  assert.ok(css.includes('.post-link{display:none'), 'mobile cards hide the redundant read link');
  const home = page('index.html');
  assert.ok(home.includes('<section class="home-posts" aria-labelledby="pinned-title">'),
    'pinned section must use the compact home grid');
  assert.ok(home.includes('<section class="home-posts" aria-labelledby="posts-title">'),
    'latest section must use the compact home grid');
});

test('post cards site-wide: image + tag + title + description only', () => {
  const css = page('blog.css');
  assert.ok(css.includes('.post-body .article-tag{align-self:flex-end;order:-1'),
    'card tags must sit at the top-right corner above the title');
  for (const file of ['index.html', 'cap-nhat.html', 'castle-rush.html', 'celestial-tower.html',
    'dungeon.html', 'newbie.html', 'raid.html', 'tower-of-trials.html']) {
    const html = page(file);
    assert.ok(!html.includes('post-badge'), `${file} must not put a tag label on the cover image`);
    assert.ok(!html.includes('post-meta'), `${file} must not show a hashtag line above the title`);
    const cards = [...html.matchAll(/<a class="post-card" href="[^"]+">([\s\S]*?)<\/a>/g)];
    assert.ok(cards.length >= 1, `${file} must list at least one post card`);
    for (const [, body] of cards) {
      assert.equal((body.match(/<span class="article-tag">/g) || []).length, 1,
        `${file} card must carry exactly one tag`);
      assert.ok(body.indexOf('article-tag') < body.indexOf('<h3>'),
        `${file} card tag must sit above the title`);
    }
  }
});

test('menu-page banners: blog-intro is half its old height on every page', () => {
  const css = page('blog.css');
  assert.ok(css.includes('.blog-intro{position:relative;display:grid;grid-template-columns:1.15fr .85fr;overflow:hidden;background:#252d3e;color:#fff;border-radius:20px;min-height:145px'),
    'menu-page banners must be ~145px tall (was 285px)');
  assert.ok(css.includes('.blog-intro h1{font-size:clamp(26px,3vw,36px)'),
    'menu-page banner titles must shrink with the banner');
  assert.ok(css.includes('.blog-intro-art{height:75px'), 'mobile banner art must shrink too');
});

test('raid guide article: third in Latest, 8 sections, every portrait hero exists', () => {
  const home = page('index.html');
  const latest = home.slice(home.indexOf('Bài viết mới nhất'),
    home.indexOf('</section>', home.indexOf('Bài viết mới nhất')));
  assert.ok(latest.indexOf('nhan-va-trang-bi-rieng.html') < latest.indexOf('trang-bi-set-dong-chinh-dong-phu.html'),
    'the ring guide must be the first card in Latest, ahead of the gear guide');
  assert.ok(latest.indexOf('trang-bi-set-dong-chinh-dong-phu.html') < latest.indexOf('raid-farm-trang-bi.html'),
    'the gear guide must be the second card in Latest, ahead of the raid guide');
  assert.ok(latest.indexOf('raid-farm-trang-bi.html') < latest.indexOf('cap-nhat-28-10.html'),
    'the raid guide must be the third card in Latest');
  assert.ok(home.includes('Cập nhật 05/11/2026'), 'home stamp must read 05/11/2026');
  const raidCard = latest.match(/<a class="post-card" href="raid-farm-trang-bi\.html">([\s\S]*?)<\/a>/);
  assert.ok(raidCard && raidCard[1].includes('<span class="article-tag">NEWBIE</span>'),
    'the raid guide card in Latest must carry the NEWBIE tag');
  const raidListing = page('raid.html');
  const raidListCard = raidListing.match(/<a class="post-card" href="raid-farm-trang-bi\.html">([\s\S]*?)<\/a>/);
  assert.ok(raidListCard && raidListCard[1].includes('<span class="article-tag">NEWBIE</span>'),
    'the raid guide card in the Raid listing must carry the NEWBIE tag');
  const newbieListing = page('newbie.html');
  const newbieCards = [...newbieListing.matchAll(/<a class="post-card" href="([^"]+)">/g)].map(m => m[1]);
  assert.equal(newbieCards[2], 'raid-farm-trang-bi.html',
    'the raid guide must be the third card in the Newbie listing');
  assert.ok(newbieListing.includes('<p>7 bài viết</p>'),
    'the Newbie listing count must read 7 articles');
  const article = page('raid-farm-trang-bi.html');
  assert.ok(article.includes('<span class="article-tag">NEWBIE</span>'),
    'the raid guide is a Newbie article, not a Raid-tagged one');
  assert.equal((article.match(/class="article-section"/g) || []).length, 8, 'raid guide must have 8 sections');
  assert.ok(!article.includes('GameWith') && !article.includes('Atlas'), 'raid guide must not attribute sources in the article');
  const ids = [...new Set([...article.matchAll(/data-hero-popup="([a-z0-9-]+)"/g)].map(m => m[1]))];
  assert.ok(ids.length >= 20, `raid guide must show at least 20 popup heroes, got ${ids.length}`);
  for (const id of ids) {
    assert.ok(fs.existsSync(path.join(root, 'data', 'heroes', `${id}.json`)), `raid guide hero ${id} has no hero data`);
    assert.ok(fs.existsSync(path.join(root, 'assets', `hero-${id}.webp`)),
      `raid guide hero ${id} has no portrait`);
  }
  assert.ok(article.includes('href="raid.html"'), 'raid guide must link back to the raid listing');
});

test('gear guide article: second in Latest and Newbie, 9 sections, every portrait hero exists', () => {
  const home = page('index.html');
  const latest = home.slice(home.indexOf('Bài viết mới nhất'),
    home.indexOf('</section>', home.indexOf('Bài viết mới nhất')));
  assert.ok(latest.indexOf('nhan-va-trang-bi-rieng.html') < latest.indexOf('trang-bi-set-dong-chinh-dong-phu.html'),
    'the ring guide must be the first card in Latest, ahead of the gear guide');
  assert.ok(latest.indexOf('trang-bi-set-dong-chinh-dong-phu.html') < latest.indexOf('raid-farm-trang-bi.html'),
    'the gear guide must be the second card in Latest');
  assert.ok(home.includes('Cập nhật 05/11/2026'), 'home stamp must read 05/11/2026');
  const gearCard = latest.match(/<a class="post-card" href="trang-bi-set-dong-chinh-dong-phu\.html">([\s\S]*?)<\/a>/);
  assert.ok(gearCard && gearCard[1].includes('<span class="article-tag">NEWBIE</span>'),
    'the gear guide card in Latest must carry the NEWBIE tag');
  const newbieListing = page('newbie.html');
  const newbieCards = [...newbieListing.matchAll(/<a class="post-card" href="([^"]+)">/g)].map(m => m[1]);
  assert.equal(newbieCards[1], 'trang-bi-set-dong-chinh-dong-phu.html',
    'the gear guide must be the second card in the Newbie listing');
  assert.ok(newbieListing.includes('<p>7 bài viết</p>'),
    'the Newbie listing count must read 7 articles');
  const article = page('trang-bi-set-dong-chinh-dong-phu.html');
  assert.ok(article.includes('<span class="article-tag">NEWBIE</span>'),
    'the gear guide must carry the NEWBIE tag');
  assert.equal((article.match(/class="article-section"/g) || []).length, 9, 'gear guide must have 9 sections');
  assert.ok(!article.includes('GameWith') && !article.includes('Atlas'), 'gear guide must not attribute sources in the article');
  const ids = [...new Set([...article.matchAll(/data-hero-popup="([a-z0-9-]+)"/g)].map(m => m[1]))];
  assert.ok(ids.length >= 8, `gear guide must show at least 8 popup heroes, got ${ids.length}`);
  for (const id of ids) {
    assert.ok(fs.existsSync(path.join(root, 'data', 'heroes', `${id}.json`)), `gear guide hero ${id} has no hero data`);
    assert.ok(fs.existsSync(path.join(root, 'assets', `hero-${id}.webp`)),
      `gear guide hero ${id} has no portrait`);
  }
  assert.ok(article.includes('href="newbie.html"'), 'gear guide must link back to the newbie listing');
});

test('ring guide article: first in Latest and Newbie, 9 sections, every portrait hero exists', () => {
  const home = page('index.html');
  const latest = home.slice(home.indexOf('Bài viết mới nhất'),
    home.indexOf('</section>', home.indexOf('Bài viết mới nhất')));
  assert.ok(latest.indexOf('nhan-va-trang-bi-rieng.html') < latest.indexOf('trang-bi-set-dong-chinh-dong-phu.html'),
    'the ring guide must be the first card in Latest');
  assert.ok(home.includes('Cập nhật 05/11/2026'), 'home stamp must read 05/11/2026');
  const ringCard = latest.match(/<a class="post-card" href="nhan-va-trang-bi-rieng\.html">([\s\S]*?)<\/a>/);
  assert.ok(ringCard && ringCard[1].includes('<span class="article-tag">NEWBIE</span>'),
    'the ring guide card in Latest must carry the NEWBIE tag');
  const newbieListing = page('newbie.html');
  const newbieCards = [...newbieListing.matchAll(/<a class="post-card" href="([^"]+)">/g)].map(m => m[1]);
  assert.equal(newbieCards[0], 'nhan-va-trang-bi-rieng.html',
    'the ring guide must be the first card in the Newbie listing');
  assert.ok(newbieListing.includes('<p>7 bài viết</p>'),
    'the Newbie listing count must read 7 articles');
  const article = page('nhan-va-trang-bi-rieng.html');
  assert.ok(article.includes('<span class="article-tag">NEWBIE</span>'),
    'the ring guide must carry the NEWBIE tag');
  assert.equal((article.match(/class="article-section"/g) || []).length, 9, 'ring guide must have 9 sections');
  assert.ok(!article.includes('GameWith') && !article.includes('Atlas'), 'ring guide must not attribute sources in the article');
  const ids = [...new Set([...article.matchAll(/data-hero-popup="([a-z0-9-]+)"/g)].map(m => m[1]))];
  assert.ok(ids.length >= 6, `ring guide must show at least 6 popup heroes, got ${ids.length}`);
  for (const id of ids) {
    assert.ok(fs.existsSync(path.join(root, 'data', 'heroes', `${id}.json`)), `ring guide hero ${id} has no hero data`);
    assert.ok(fs.existsSync(path.join(root, 'assets', `hero-${id}.webp`)),
      `ring guide hero ${id} has no portrait`);
  }
  assert.ok(article.includes('href="newbie.html"'), 'ring guide must link back to the newbie listing');
});

test('category cards: no descriptions, 3 compact cards per row on mobile', () => {
  const home = page('index.html');
  const grids = [...home.matchAll(/<div class="cat-grid">([\s\S]*?)<\/div>/g)].map(m => m[1]);
  assert.equal(grids.length, 2, 'home must have two category grids (most-visited + quick-access)');
  assert.equal((grids[0].match(/<a class="cat-card"/g) || []).length, 3, 'most-visited grid must list 3 category cards');
  assert.equal((grids[1].match(/<a class="cat-card"/g) || []).length, 9, 'quick-access grid must list 9 category cards');
  assert.equal((home.match(/<a class="cat-card"/g) || []).length, 12, 'home must still list 12 category cards in total');
  for (const grid of grids) {
    assert.ok(!grid.includes('<p>'), 'category cards must not carry description text');
    assert.ok(grid.includes('<span class="cat-count">'), 'category cards keep their count line');
  }
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
