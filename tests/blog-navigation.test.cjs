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
