(() => {
  'use strict';
  const core = window.RubyCalculator;
  if (!core) return;
  const $ = id => document.getElementById(id);
  const format = value => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0);
  const signed = value => `${value > 0 ? '+' : ''}${format(value)}`;
  const number = element => Math.max(0, Number(element.value) || 0);
  const selectedStage = () => Math.max(1, Math.min(9, Math.floor(number($('stage-input'))) || 1));
  const roundEstimate = () => core.farmingEstimate(selectedStage(), $('support-ruby').checked);
  const applyRoundEstimate = () => { $('rounds-input').value = String(roundEstimate().rounds); };

  // Amount and interval are editable: recurring rewards are estimates, not guaranteed claims.
  const keySources = [
    { name: 'Daily Missions', amount: 60, days: 1, checked: true },
    { name: 'Daily Check-In', amount: 120, days: 5, checked: true },
    { name: 'Weekend Login Event', amount: 200, days: 7, checked: false, note: 'Chỉ bật khi Event còn hiệu lực.' },
    { name: 'Ruby Shop (Daily)', amount: 60, days: 1, checked: true, note: 'Phần nhận miễn phí.' },
    { name: 'Daily Shop: Free', amount: 30, days: 1, checked: true },
    { name: 'Guild Check-In Reward', amount: 0, days: 1, checked: false, note: 'Nhập số Key thực tế nhận được.' },
    { name: 'Guild Mission Reward', amount: 180, days: 7, checked: false },
    { name: 'Adventure Growth Relay', amount: 30, days: 14, checked: false, note: 'Kiểm tra thời gian và điều kiện nhận.' },
    { name: '7K Pass (Free)', amount: 690, days: 28, checked: false, note: 'Có thể khác theo mùa và tiến độ Pass.' },
    { name: 'Honor Shop (Weekly)', amount: 420, days: 7, checked: false },
    { name: 'Arena Shop (Monthly)', amount: 1680, days: 28, checked: false },
    { name: 'Total War Shop (Monthly)', amount: 600, days: 28, checked: false },
    { name: 'Guild Shop (Weekly)', amount: 420, days: 7, checked: false },
    { name: 'Guild War Shop (Monthly)', amount: 600, days: 28, checked: false },
  ];
  const rubySources = [
    { name: 'Daily Shop: Free', amount: 30, days: 1, checked: true },
    { name: 'Daily Check-In', amount: 600, days: 28, checked: true, note: 'Có thể thay đổi theo tiến độ Check-In.' },
    { name: 'Rate Up Summon Relay', amount: 50, days: 14, checked: false, note: 'Free step; kiểm tra thời gian Event.' },
    { name: 'Adventure Support S (Free)', amount: 100, days: 7, checked: false },
    { name: '7K Pass (Free)', amount: 500, days: 28, checked: false, note: 'Chỉ bật nếu đạt phần thưởng này.' },
    { name: 'Daily Tarot', amount: 500, days: 1, checked: false, note: 'Phần thưởng ngẫu nhiên; sửa theo thực tế.' },
    { name: 'Daily Ruby Support · Daily', amount: 200, days: 1, checked: false, support: 'ruby', note: 'Chỉ tính khi sở hữu Subscription.' },
    { name: 'Daily Ruby Support · Paid Ruby', amount: 330, days: 28, checked: false, support: 'ruby', paid: true },
    { name: 'Daily Power Up Support · Paid Ruby', amount: 200, days: 28, checked: false, support: 'power', paid: true },
    { name: 'Premium 28 Days Check-In', amount: 300, days: 28, checked: false, note: 'Không tự cộng nếu chưa mua/nhận.' },
    { name: 'Tower of Trials', amount: 0, days: 28, checked: false, note: 'Nhập theo Medal và mùa hiện tại.' },
    { name: 'Arena', amount: 0, days: 7, checked: false, note: 'Nhập theo League và Grade.' },
    { name: 'Real-Time Arena', amount: 0, days: 7, checked: false, note: 'Cân nhắc cả thời gian nghỉ mùa.' },
    { name: 'Total War', amount: 0, days: 14, checked: false, note: 'Nhập theo Grade và kỳ thưởng.' },
  ];

  function createRows(containerId, sources, unit) {
    const container = $(containerId);
    for (const source of sources) {
      const row = document.createElement('div');
      row.className = 'source-row';
      if (source.support) row.dataset.support = source.support;
      if (source.paid) row.dataset.paid = 'true';
      const label = document.createElement('label');
      label.className = 'source-name';
      const check = document.createElement('input'); check.type = 'checkbox'; check.checked = source.checked;
      const text = document.createElement('span');
      const name = document.createElement('b'); name.textContent = source.name; text.append(name);
      if (source.note) { const note = document.createElement('small'); note.textContent = source.note; text.append(note); }
      label.append(check, text);
      const amountLabel = document.createElement('label'); amountLabel.className = 'source-number';
      const amountTitle = document.createElement('span'); amountTitle.textContent = unit;
      const amount = document.createElement('input'); amount.type = 'number'; amount.min = '0'; amount.max = '1000000000'; amount.step = 'any'; amount.value = source.amount; amount.className = 'source-amount'; amount.setAttribute('aria-label', `${source.name}: số ${unit}`);
      amountLabel.append(amountTitle, amount);
      const daysLabel = document.createElement('label'); daysLabel.className = 'source-number';
      const daysTitle = document.createElement('span'); daysTitle.textContent = 'ngày';
      const days = document.createElement('input'); days.type = 'number'; days.min = '1'; days.max = '3650'; days.step = '1'; days.value = source.days; days.className = 'source-days'; days.setAttribute('aria-label', `${source.name}: chu kỳ ngày`);
      daysLabel.append(daysTitle, days);
      row.append(label, amountLabel, daysLabel);
      container.append(row);
    }
  }
  createRows('key-source-list', keySources, 'Key');
  createRows('ruby-source-list', rubySources, 'Ruby');
  const defaultSettings = Array.from(document.querySelectorAll('#panel-settings input, #panel-settings select')).map(element => ({ element, value: element.value, checked: element.checked }));

  const readRows = (id, filter = () => true) => Array.from($(id).querySelectorAll('.source-row')).filter(filter).map(row => ({
    enabled: row.querySelector('input[type=checkbox]').checked,
    amount: number(row.querySelector('.source-amount')),
    days: Math.max(1, number(row.querySelector('.source-days'))),
  }));
  function syncSupportRows() {
    document.querySelectorAll('#ruby-source-list .source-row[data-support]').forEach(row => {
      row.querySelector('input[type=checkbox]').checked = row.dataset.support === 'ruby' ? $('support-ruby').checked : $('support-power').checked;
    });
  }
  function presetState() {
    const ruby = $('support-ruby').checked, power = $('support-power').checked;
    for (const [id, selected] of [['preset-f2p', !ruby && !power], ['preset-light', ruby && power]]) {
      $(id).classList.toggle('selected', selected); $(id).setAttribute('aria-pressed', String(selected));
    }
  }
  let latest = { grossRuby: 0, purchaseCost: 0 };
  function renderFarming() {
    const stage = selectedStage();
    const team1 = $('team-one'), team2 = $('team-two');
    team1.max = stage < 4 ? '5' : '4';
    if (number(team1) > Number(team1.max)) team1.value = team1.max;
    team2.disabled = stage < 4;
    if (number(team2) > 4) team2.value = '4';
    const slots = Math.floor(number(team1)) + (stage >= 4 ? Math.floor(number(team2)) : 0);
    const roundsPerCycle = Math.max(1, Math.min(999, Math.floor(number($('rounds-input'))) || 1));
    const fodderLimit = $('fodder-limit').value.trim() === '' ? null : Math.floor(number($('fodder-limit')));
    const stageData = core.STAGES[stage - 1];
    const estimate = roundEstimate();
    const exp = estimate.expPerRound;
    $('rounds-hint').textContent = `Ước tính ${estimate.rounds} Round từ Lv.1. Tự tính lại khi đổi Stage hoặc Daily Ruby Support; bạn có thể sửa theo thực tế.`;
    $('stage-info').textContent = `${stageData.unlock} · ${stage < 4 ? 6 : 12} Key / Round · ${format(exp)} EXP / Round · ${format(stageData.gold)} Gold / Round. Possible Drops: ${stageData.drops}.`;
    $('regen-description').textContent = $('support-power').checked ? '720 Key / 24 giờ nếu Key thường không bị đầy; thêm 80 Key / ngày từ Daily Power Up Support.' : '480 Key / 24 giờ nếu Key thường không bị đầy.';
    const regen = $('key-regen').checked ? ($('support-power').checked ? 720 : 480) : 0;
    const subscriptionKeys = $('support-power').checked ? 80 : 0;
    const estimatedDailyKeys = core.sourceDailyValue(readRows('key-source-list')) + regen + subscriptionKeys + number($('extra-keys'));
    const dailyKeys = $('include-recurring').checked ? estimatedDailyKeys : 0;
    const baseKeys = Math.floor(number($('current-keys')) + Math.floor(number($('current-bundles'))) * core.BUNDLE_KEYS + dailyKeys);
    const support = $('support-ruby').checked && $('support-power').checked ? 'Light Spender' : (!$('support-ruby').checked && !$('support-power').checked ? 'F2P' : 'Tùy chỉnh');
    $('quick-recurring-summary').textContent = $('include-recurring').checked ? `Đang cộng khoảng ${format(estimatedDailyKeys)} Key / 24 giờ theo Cài đặt.` : `Không cộng khoảng ${format(estimatedDailyKeys)} Key / 24 giờ từ các nguồn đã chọn.`;
    const previous = Math.min(core.BUNDLE_LIMIT, Math.floor(number($('bought-before'))));
    $('quick-setting-summary').textContent = `Stage ${stage} · ${format(slots)} Fodder · ${support} · ${format(roundsPerCycle)} Round / nhóm${previous ? ` · Đã mua ${format(previous)} Bundle` : ''}`;
    const purchase = core.purchase(previous, number($('buy-bundles')));
    $('buy-bundles').max = String(core.BUNDLE_LIMIT - previous);
    if (number($('buy-bundles')) !== purchase.count) $('buy-bundles').value = String(purchase.count);
    $('buy-slider').max = String(core.BUNDLE_LIMIT - previous);
    $('buy-slider').value = String(purchase.count);
    $('buy-slider-value').textContent = format(purchase.count);
    $('slider-max-label').textContent = `Tối đa ${format(core.BUNDLE_LIMIT - previous)}`;
    document.querySelectorAll('.quick-bundles [data-bundles]').forEach(button => {
      const selected = Number(button.dataset.bundles) === purchase.count;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const config = { stage, slots, roundsPerCycle, fodderLimit };
    const baseline = core.simulate({ ...config, keys: baseKeys });
    const result = core.simulate({ ...config, keys: baseKeys + purchase.keys });
    const marginalRuby = result.grossRuby - baseline.grossRuby;
    $('metric-keys').textContent = format(result.keys);
    $('metric-cost').textContent = `${format(purchase.cost)} Ruby`;
    $('metric-next').textContent = purchase.nextPrice === null ? 'Đã hết lượt' : `${format(purchase.nextPrice)} Ruby`;
    $('metric-gross').textContent = `${format(result.grossRuby)} Ruby`;
    $('metric-detail').textContent = `${format(result.heroes)} Fodder đạt Lv.30 · ${format(result.roundsPerCycle)} Round / nhóm`;
    $('metric-net').textContent = `${signed(result.grossRuby - purchase.cost)} Ruby`;
    $('metric-marginal').textContent = `${signed(marginalRuby)} Ruby`;
    $('metric-remainder').textContent = `${format(result.keysLeft)} Key / ${format(result.rounds)} Round`;
    latest = { grossRuby: result.grossRuby, purchaseCost: purchase.cost };

    const body = $('ladder-body'); body.replaceChildren();
    for (const target of [20, 70, 120, 170, 1169]) {
      const tr = document.createElement('tr');
      let values;
      if (target <= previous) values = [format(target), 'Đã qua', '—', '—', '—'];
      else {
        const buy = core.purchase(previous, target - previous);
        const projected = core.simulate({ ...config, keys: baseKeys + buy.keys });
        const extra = projected.grossRuby - baseline.grossRuby;
        values = [format(target), format(buy.count), format(buy.cost), signed(extra), signed(extra - buy.cost)];
      }
      values.forEach(value => { const td = document.createElement('td'); td.textContent = value; tr.append(td); });
      body.append(tr);
    }
    presetState();
  }
  function renderIncome() {
    const rows = readRows('ruby-source-list');
    const paidRows = readRows('ruby-source-list', row => row.dataset.paid === 'true');
    const customRows = Array.from($('custom-ruby-list').querySelectorAll('.custom-ruby-row'));
    const customDaily = row => number(row.querySelector('.custom-amount')) / Math.max(1, number(row.querySelector('.custom-days')));
    const customTotal = customRows.reduce((sum, row) => sum + customDaily(row), 0);
    const customPaid = customRows.filter(row => row.querySelector('.custom-type').value === 'paid').reduce((sum, row) => sum + customDaily(row), 0);
    const paid = core.sourceDailyValue(paidRows) + customPaid;
    const all = core.sourceDailyValue(rows) + customTotal + number($('daily-farm-ruby'));
    const free = all - paid;
    const net = all - number($('daily-spend'));
    $('income-daily').textContent = `${format(all)} Ruby`;
    $('income-split').textContent = `Free Ruby ${format(free)} · Paid Ruby ${format(paid)}`;
    for (const days of [7, 14, 28]) $(`income-${days}`).textContent = `${format(all * days)} Ruby`;
    $('income-net').textContent = `${signed(net)} Ruby`;
    $('income-net-28').textContent = `${signed(net * 28)} Ruby`;
  }
  function render() { renderFarming(); renderIncome(); }

  $('add-custom-ruby').addEventListener('click', () => {
    const row = document.createElement('div'); row.className = 'custom-ruby-row';
    const fields = [
      { label: 'Tên nguồn', cls: 'custom-name', type: 'text', value: 'Nguồn khác' },
      { label: 'Ruby / lần', cls: 'custom-amount', type: 'number', value: '0', min: '0' },
      { label: 'Chu kỳ (ngày)', cls: 'custom-days', type: 'number', value: '1', min: '1' },
    ];
    for (const field of fields) {
      const label = document.createElement('label'); label.textContent = field.label;
      const input = document.createElement('input'); input.className = field.cls; input.type = field.type; input.value = field.value;
      if (field.min) input.min = field.min;
      if (field.type === 'number') input.step = '1';
      if (field.type === 'text') input.maxLength = 60;
      label.append(input); row.append(label);
    }
    const typeLabel = document.createElement('label'); typeLabel.textContent = 'Loại Ruby';
    const select = document.createElement('select'); select.className = 'custom-type';
    for (const [value, text] of [['free', 'Free Ruby'], ['paid', 'Paid Ruby']]) { const option = document.createElement('option'); option.value = value; option.textContent = text; select.append(option); }
    typeLabel.append(select); row.append(typeLabel);
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-source'; remove.textContent = 'Xóa'; remove.setAttribute('aria-label', 'Xóa nguồn Ruby tùy chỉnh');
    remove.addEventListener('click', () => { row.remove(); renderIncome(); }); row.append(remove);
    $('custom-ruby-list').append(row); row.querySelector('input').focus(); renderIncome();
  });

  $('buy-slider').addEventListener('input', event => { $('buy-bundles').value = event.target.value; render(); });
  document.querySelectorAll('.quick-bundles [data-bundles]').forEach(button => button.addEventListener('click', () => { $('buy-bundles').value = button.dataset.bundles; render(); }));
  $('stage-input').addEventListener('change', () => { applyRoundEstimate(); render(); });
  $('rounds-auto').addEventListener('click', () => { applyRoundEstimate(); render(); });
  $('support-ruby').addEventListener('change', () => { applyRoundEstimate(); syncSupportRows(); render(); });
  $('support-power').addEventListener('change', () => { syncSupportRows(); render(); });
  for (const [id, enabled] of [['preset-f2p', false], ['preset-light', true]]) $(id).addEventListener('click', () => {
    const rubyChanged = $('support-ruby').checked !== enabled;
    $('support-ruby').checked = enabled; $('support-power').checked = enabled;
    if (rubyChanged) applyRoundEstimate();
    syncSupportRows(); render();
  });
  $('copy-farming').addEventListener('click', () => { $('daily-farm-ruby').value = String(latest.grossRuby); $('daily-spend').value = String(latest.purchaseCost); renderIncome(); });
  document.querySelectorAll('.calc-tabs [role=tab]').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.calc-tabs [role=tab]').forEach(item => { const active = item === tab; item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1; $(`panel-${item.dataset.tab}`).hidden = !active; });
  }));
  document.querySelector('.calc-tabs').addEventListener('keydown', event => {
    const tabs = Array.from(document.querySelectorAll('.calc-tabs [role=tab]'));
    const current = tabs.indexOf(document.activeElement);
    if (current < 0 || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].click(); tabs[next].focus();
  });
  $('open-settings').addEventListener('click', () => { $('tab-settings').click(); $('tab-settings').focus(); });
  $('open-ruby-settings').addEventListener('click', () => { $('tab-settings').click(); $('ruby-settings').open = true; $('ruby-settings').scrollIntoView({ block: 'start', behavior: 'smooth' }); });
  $('back-to-calculation').addEventListener('click', () => { $('tab-quick').click(); $('tab-quick').scrollIntoView({ block: 'center', behavior: 'smooth' }); $('tab-quick').focus(); });
  $('reset-settings').addEventListener('click', () => {
    for (const item of defaultSettings) { item.element.value = item.value; if (item.element.type === 'checkbox') item.element.checked = item.checked; }
    $('custom-ruby-list').replaceChildren(); $('key-settings').open = false; $('ruby-settings').open = false;
    applyRoundEstimate(); syncSupportRows(); render();
  });
  $('tinh-ruby').addEventListener('input', event => { if (event.target.id !== 'buy-slider') render(); });
  $('tinh-ruby').addEventListener('change', event => { if (!['support-ruby', 'support-power'].includes(event.target.id)) render(); });
  applyRoundEstimate(); render();

  const dialog = $('image-dialog'), dialogImage = $('dialog-image');
  document.querySelectorAll('.image-button').forEach(button => button.addEventListener('click', () => { dialogImage.src = button.dataset.image; dialogImage.alt = button.dataset.alt; dialog.showModal(); }));
  $('dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
})();
