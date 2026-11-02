const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const calculator = html.slice(html.indexOf('id="tinh-ruby"'), html.indexOf('id="faq"'));

test('calculator starts on the quick tab and places advanced fields in settings', () => {
  const tabs = [...calculator.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map(match => match[0]);
  assert.equal(tabs.length, 2);
  assert.match(tabs[0], /id="tab-quick"[^>]*aria-selected="true"/);
  assert.match(tabs[1], /id="tab-settings"[^>]*aria-selected="false"/);
  const quick = calculator.slice(calculator.indexOf('id="panel-quick"'), calculator.indexOf('id="panel-settings"'));
  const settings = calculator.slice(calculator.indexOf('id="panel-settings"'));
  assert.match(quick, /id="current-keys"/);
  assert.match(quick, /id="current-bundles"/);
  assert.match(quick, /id="buy-bundles"/);
  for (const id of ['stage-input', 'team-one', 'rounds-input', 'bought-before', 'key-source-list', 'ruby-source-list']) {
    assert.doesNotMatch(quick, new RegExp(`id="${id}"`));
    assert.match(settings, new RegExp(`id="${id}"`));
  }
  assert.match(settings, /id="panel-settings"[^>]*hidden/);
  assert.match(quick, /id="include-recurring"[^>]*checked/);
});

test('the guide uses the new game screenshots and hero portraits as local image assets', () => {
  for (const name of ['ruby-mission.webp', 'keys-reserve.webp', 'auto-replace-heroes.webp', 'hero-freyja.webp', 'hero-teo.webp', 'hero-yoongun.webp', 'hero-omok.webp']) {
    assert.ok(html.includes(`assets/${name}`), `${name} must be displayed in the guide`);
    assert.ok(fs.statSync(path.join(root, 'assets', name)).size > 1000, `${name} must be a real image file`);
  }
});
