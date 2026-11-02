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
