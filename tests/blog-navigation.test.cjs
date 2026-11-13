const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');
const page = name => fs.readFileSync(path.join(root, name), 'utf8');

test('the Newbie listing links to both individual guides and the guides link back', () => {
  const listing = page('newbie.html');
  for (const file of ['ruby-farming.html', 'chon-hero-banner.html', 'doi-hinh-hang-truoc-sau.html']) {
    assert.match(listing, new RegExp(`href="${file}"`));
    assert.match(page(file), /href="newbie\.html"/);
  }
  assert.match(page('ruby-farming.html'), /href="chon-hero-banner\.html"/);
  assert.match(page('chon-hero-banner.html'), /href="ruby-farming\.html#tinh-ruby"/);
});

test('the home page links to the Newbie listing and the latest guides', () => {
  const home = page('index.html');
  assert.match(home, /href="newbie\.html"/);
  assert.match(home, /href="doi-hinh-hang-truoc-sau\.html"/);
  assert.match(home, /href="cap-nhat-28-10\.html"/);
});

test('legacy Ruby Farming links are routed to the original section in its new page', () => {
  const listing = page('newbie.html');
  const old = page('ruby-farming.html');
  for (const id of ['cach-farm', 'xep-doi', 'stage', 'farmer', 'repeat-battle', 'key', 'key-bundle', 'fodder', 'tinh-ruby', 'faq']) {
    assert.ok(listing.includes(`'${id}'`), `missing legacy redirect for ${id}`);
    assert.ok(old.includes(`id="${id}"`), `missing Ruby Farming section ${id}`);
  }
  assert.match(listing, /location\.replace\('ruby-farming\.html'\+location\.hash\)/);
});

test('both guides use local game illustrations and keep calculator code available', () => {
  const hero = page('chon-hero-banner.html');
  const ruby = page('ruby-farming.html');
  for (const file of ['hero-freyja.webp', 'hero-shane.webp', 'hero-espada.webp', 'hero-pascal.webp', 'hero-biscuit.webp', 'hero-rachel.webp', 'hero-fai.webp', 'hero-gelidus.webp', 'hero-crafting.webp']) {
    assert.ok(hero.includes(`assets/${file}`), `${file} must be shown in the guide`);
    assert.ok(fs.statSync(path.join(root, 'assets', file)).size > 1000, `${file} must be a real image`);
  }
  assert.match(ruby, /src="calculator-core-v3\.js"/);
  assert.match(ruby, /src="app-v4\.js"/);
  assert.match(ruby, /id="rounds-auto"/);
});

test('the standalone Tính Ruby page carries the same working calculator', () => {
  const calc = page('tinh-ruby.html');
  assert.match(calc, /src="calculator-core-v3\.js"/);
  assert.match(calc, /src="app-v4\.js"/);
  assert.match(calc, /id="rounds-auto"/);
  assert.match(calc, /id="current-keys"/);
  assert.match(calc, /id="image-dialog"/); // app-v4.js touches the dialog unguarded
  assert.match(calc, /href="ruby-farming\.html"/); // links back to the full guide
  assert.match(calc, /class="nav-active" href="tinh-ruby\.html"/);
});

test('Castle Rush listing links 7 boss articles; each article links back and embeds its video', () => {
  const listing = page('castle-rush.html');
  for (const boss of ['rudy', 'eileene', 'rachel', 'dellons', 'jave', 'spike', 'kris']) {
    const file = `castle-rush-${boss}.html`;
    assert.match(listing, new RegExp(`href="${file}"`), `listing must link ${file}`);
    const article = page(file);
    assert.match(article, /href="castle-rush\.html"/, `${file} must link back to the listing`);
    assert.match(article, /youtube\.com\/embed\//, `${file} must embed its video`);
    assert.match(article, /<span class="article-tag">CASTLE RUSH<\/span>/);
  }
});

test('Raid and Dungeon listings link their boss articles; each article links back', () => {
  const raid = page('raid.html');
  assert.ok(raid.includes('href="raid-farm-trang-bi.html"'), 'raid listing must link the beginner guide first');
  assert.ok(raid.includes('<p>5 bài viết</p>'), 'raid listing must count 5 articles');
  for (const file of ['raid-iron-devourer-t6.html', 'raid-ox-king-t6.html', 'raid-destroyer-gaze-t6.html',
    'raid-destroyer-gaze-t7-day2.html', 'raid-sudden-leonid.html', 'raid-sudden-astrea.html', 'raid-sudden-calistra.html']) {
    assert.match(raid, new RegExp(`href="${file}"`), `raid listing must link ${file}`);
    assert.match(page(file), /href="raid\.html"/, `${file} must link back to the raid listing`);
  }
  const dungeon = page('dungeon.html');
  for (const file of ['dungeon-darkness-t6.html', 'dungeon-earth-t6.html', 'dungeon-water-t6.html',
    'dungeon-fire-t6.html', 'dungeon-light-t6.html', 'dungeon-tiers-11-15.html']) {
    assert.match(dungeon, new RegExp(`href="${file}"`), `dungeon listing must link ${file}`);
    assert.match(page(file), /href="dungeon\.html"/, `${file} must link back to the dungeon listing`);
  }
});

test('Celestial Tower and Tower of Trials listings link every video article', () => {
  const celestial = page('celestial-tower.html');
  const celestialFiles = fs.readdirSync(root).filter(f => f.startsWith('celestial-tower-tang-'));
  assert.equal(celestialFiles.length, 62, 'must have 62 floor articles');
  for (const file of celestialFiles) {
    assert.match(celestial, new RegExp(`href="${file}"`), `celestial listing must link ${file}`);
    assert.match(page(file), /youtube\.com\/embed\//, `${file} must embed its video`);
  }
  const trials = page('tower-of-trials.html');
  const trialFiles = fs.readdirSync(root).filter(f => f.startsWith('tower-of-trials-s') || f.startsWith('tower-of-trials-collab') || f.startsWith('tower-of-trials-2025'));
  assert.equal(trialFiles.length, 102, 'must have 102 season/floor articles');
  for (const file of trialFiles) {
    assert.match(trials, new RegExp(`href="${file}"`), `trials listing must link ${file}`);
    assert.match(page(file), /youtube\.com\/embed\//, `${file} must embed its video`);
  }
});

test('the coupon page loads the coupon list and redeems through the Worker API', () => {
  const coupons = JSON.parse(fs.readFileSync(path.join(root, 'coupons.json'), 'utf8'));
  assert.ok(Array.isArray(coupons.coupons), 'coupons.json must be an array of active codes (may be empty when no code is active)');
  for (const code of coupons.coupons) {
    assert.match(code, /^[A-Z0-9]+$/, `coupon code ${code} must be uppercase alphanumeric`);
  }
  const coupon = page('doi-coupon.html');
  assert.match(coupon, /id="uid"/, 'coupon page must have a UID input');
  assert.match(coupon, /fetch\('coupons\.json'\)/, 'coupon page must load the coupon list');
  assert.match(coupon, /fetch\('\/api\/redeem'/, 'coupon page must redeem through /api/redeem');
  assert.match(coupon, /id="redeem-all"/, 'coupon page must have a redeem-all button');
  assert.match(coupon, /id="manual-codes"/, 'coupon page must have a manual code input');
  assert.match(coupon, /id="history-list"/, 'coupon page must show redemption history');
  assert.match(coupon, /7k_uid/, 'UID must persist in localStorage');
  if (coupons.coupons.length === 0) {
    assert.match(coupon, /Hiện chưa có mã đổi nào đang hoạt động/, 'empty coupon list must show the no-active-codes message');
  }
  const worker = fs.readFileSync(path.join(__dirname, '..', 'worker.js'), 'utf8');
  assert.match(worker, /\/api\/redeem/, 'worker.js must serve the redeem route');
  assert.match(worker, /coupon\.netmarble\.com\/api\/coupon/, 'worker must forward to the official Netmarble coupon API');
  assert.match(worker, /CF-Connecting-IP/, 'worker must throttle redeem calls per IP');
});

test('coupon status and history rows wrap instead of overflowing on mobile', () => {
  // Long redeem messages (e.g. "UID không đúng. Kiểm tra lại UID trong game…")
  // used to run off the right edge: .coupon-status was white-space:nowrap and
  // the flex rows never wrapped, so the text clipped on phones.
  const coupon = page('doi-coupon.html');
  assert.match(coupon, /#doi-coupon \.coupon-row\{[^}]*flex-wrap:wrap/, 'coupon rows must wrap so a long status drops to the next line');
  assert.match(coupon, /#doi-coupon \.coupon-status\{[^}]*min-width:0/, 'coupon status must be allowed to shrink below its content width');
  assert.match(coupon, /#doi-coupon \.coupon-status\{[^}]*overflow-wrap:break-word/, 'coupon status must break long text instead of overflowing');
  assert.ok(!/#doi-coupon \.coupon-status\{[^}]*white-space:nowrap/.test(coupon), 'coupon status must not be nowrap');
  assert.match(coupon, /#doi-coupon \.history-row\{[^}]*flex-wrap:wrap/, 'history rows must wrap');
  assert.match(coupon, /#doi-coupon \.history-row \.history-text\{[^}]*min-width:0/, 'history text must be allowed to shrink and wrap');
  assert.match(coupon, /history-row"><span class="history-text"/, 'history rows must render the message inside .history-text');
});

test('no iOS auto-zoom: every input, textarea and select on the site is at least 16px', () => {
  // iOS Safari zooms in when focusing an input smaller than 16px; the safety
  // net below guarantees the minimum everywhere, including future inputs.
  const base = fs.readFileSync(path.join(root, 'styles-v3.css'), 'utf8');
  assert.match(base, /input,textarea,select\{font-size:16px!important\}/, 'styles-v3.css must carry the 16px input safety net');
  assert.ok(!/input[^{]*\{[^}]*font-size:1[0-5]px/.test(base), 'no input/select rule in styles-v3.css may stay below 16px');
  const gw = page('guild-war-team.html');
  assert.match(gw, /input,textarea,select\{font-size:16px!important\}/, 'guild-war-team.html must carry the same safety net inline');
  const coupon = page('doi-coupon.html');
  assert.match(coupon, /#doi-coupon \.coupon-input,#doi-coupon \.coupon-textarea\{[^}]*font-size:16px/, 'coupon inputs must be 16px');
  assert.ok(!coupon.includes('inputmode="numeric"'), 'UID input must not force a numeric keyboard (UIDs are hex, letters + digits)');
  assert.match(coupon, /autocapitalize="off"/, 'UID input must not auto-capitalize');
  assert.match(coupon, /id="redeem-all" type="button" disabled/, 'redeem-all must start disabled until a UID is entered');
  assert.match(coupon, /id="redeem-manual" type="button" disabled/, 'redeem-manual must start disabled until a UID is entered');
  assert.match(coupon, /localStorage\.getItem\(LS_UID\)/, 'UID check must fall back to the saved UID');
});
