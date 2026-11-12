const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(root, 'ruby-farming.html'), 'utf8');
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

test('the profit is the hero result and the gross ruby is a breakdown row', () => {
  for (const file of ['ruby-farming.html', 'tinh-ruby.html']) {
    const page = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(page, /RUBY LÃI SAU CHI PHÍ<\/small><b id="metric-net"/, `${file}: the hero result must be the net profit`);
    assert.match(page, /Ruby nhận từ Fodder<\/span><b id="metric-gross"/, `${file}: the gross ruby must sit in the breakdown`);
    assert.doesNotMatch(page, /RUBY NHẬN TỪ FODDER/, `${file}: the gross ruby must not be the hero`);
    assert.match(page, /RUBY LÃI \/ NGÀY SAU CHI PHÍ<\/small><b id="income-net"/, `${file}: the daily forecast hero must be the daily net`);
    assert.match(page, /Ruby bình quân \/ ngày trước chi phí<\/span><b id="income-daily"/, `${file}: the daily gross must sit in the breakdown`);
  }
});

test('the guide uses the new game screenshots and hero portraits as local image assets', () => {
  for (const name of ['ruby-mission.webp', 'keys-reserve.webp', 'auto-replace-heroes.webp', 'hero-freyja.webp', 'hero-teo.webp', 'hero-yoongun.webp', 'hero-omok.webp']) {
    assert.ok(html.includes(`assets/${name}`), `${name} must be displayed in the guide`);
    assert.ok(fs.statSync(path.join(root, 'assets', name)).size > 1000, `${name} must be a real image file`);
  }
});
