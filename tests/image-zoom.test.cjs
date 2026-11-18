const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');
const page = name => fs.readFileSync(path.join(root, name), 'utf8');

test('every page with a Phóng to image button wires it to the zoom dialog', () => {
  // The two update articles used to carry .image-button with no dialog and no
  // zoom script at all, so clicking Phóng to did literally nothing.
  const files = fs.readdirSync(root).filter(f => f.endsWith('.html'));
  const withButtons = files.filter(f => page(f).includes('class="image-button"'));
  assert.ok(withButtons.length >= 7, `expected at least 7 pages with zoom buttons, found ${withButtons.length}`);
  for (const file of withButtons) {
    const html = page(file);
    assert.match(html, /id="image-dialog"/, `${file}: must carry the zoom dialog`);
    assert.match(html, /id="dialog-image"/, `${file}: dialog must have an image slot`);
    assert.match(html, /id="dialog-close"/, `${file}: dialog must have a close button`);
    assert.ok(/src="guide\.js"|src="app-v4\.js"/.test(html),
      `${file}: must load a script that binds the zoom buttons`);
    for (const [tag] of html.matchAll(/<button class="image-button"[^>]*>/g)) {
      assert.match(tag, /data-image="/, `${file}: every zoom button needs a data-image`);
    }
  }
});

test('guide.js opens the dialog with the clicked button image', () => {
  const js = fs.readFileSync(path.join(root, 'guide.js'), 'utf8');
  assert.match(js, /dialog\.showModal\(\)/, 'guide.js must open the dialog');
  assert.match(js, /button\.dataset\.image/, 'guide.js must take the image from the clicked button');
  assert.match(js, /dialog-close/, 'guide.js must wire the close button');
});
