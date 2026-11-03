/* Hero detail page (hero.html): two tabs (Chi tiết / Build đồ) rendered
 * from data/heroes/<id>.json. Version switcher AWK / 6★ changes portrait,
 * base stats, skills and enhancement priority (Atlas behaviour).
 * Data source: 7k Atlas (codex + hero-data), extracted locally.
 */
(function () {
  var STAT_LABELS = { 'AllATK%': 'All Attack %', 'AllATK': 'All Attack', 'Block': 'Block Rate', 'Crit': 'Crit Rate', 'CritDMG': 'Crit Damage', 'Crush': 'Crush', 'DEF%': 'DEF%', 'DEF': 'DEF', 'DMGAmp': 'Damage Amplification', 'DmgTakenReduce': 'Damage Taken Reduction', 'EffectHit': 'Effect Hit Rate', 'EffectRes': 'Effect Resistance', 'HP%': 'HP%', 'HP': 'HP', 'MATK%': 'Magic Attack %', 'MATK': 'Magic Attack', 'PATK%': 'Physical Attack %', 'PATK': 'Physical Attack', 'Rejuvenate': 'Rejuvenate', 'Resilience': 'Resilience', 'SkillAccel': 'Skill Acceleration', 'Speed': 'Speed', 'WeaknessHit': 'Weakness Hit Chance' };
  var STAT_ICONS = { 'AllATK%': 'AllATKpct.webp', 'AllATK': 'AllATK.webp', 'Block': 'Block.webp', 'Crit': 'Crit.webp', 'CritDMG': 'CritDMG.webp', 'Crush': 'Crush.webp', 'DEF%': 'DEFpct.webp', 'DEF': 'DEF.webp', 'DMGAmp': 'DMGAmp.webp', 'DmgTakenReduce': 'DmgTakenReduce.webp', 'EffectHit': 'EffectHit.webp', 'EffectRes': 'EffectRes.webp', 'HP%': 'HPpct.webp', 'HP': 'HP.webp', 'MATK%': 'MATKpct.webp', 'MATK': 'MATK.webp', 'PATK%': 'PATKpct.webp', 'PATK': 'PATK.webp', 'Rejuvenate': 'Rejuvenate.webp', 'Resilience': 'Resilience.webp', 'SkillAccel': 'SkillAccel.webp', 'Speed': 'Speed.webp', 'WeaknessHit': 'WeaknessHit.webp' };
  var MODE_LABELS = { 'ARENA': 'Arena', 'TOTAL WAR': 'Total War', 'GUILD WAR': 'Guild War', 'REAL-TIME ARENA': 'Real-Time Arena', 'ADVENTURE BOTH': 'Adventure (Both)', 'ADVENTURE (NORMAL)': 'Adventure (Normal)', 'ADVENTURE (CHALLENGE)': 'Adventure (Challenge)', 'INFINITE TOWER': 'Infinite Tower', 'TOWER OF TRIALS': 'Tower of Trials', 'ADVENT-GOD': 'God of Destruction', 'ADVENT-PHYS': 'Kyle & Karma', 'PUDUNGEON-EARTH': 'Earth', 'PUDUNGEON-GOLD': 'Gold', 'PUDUNGEON-FIRE': 'Fire', 'PUDUNGEON-WATER': 'Water', 'PUDUNGEON-LIGHT': 'Light', 'PUDUNGEON-DARK': 'Dark', 'SUDDENRAID-LEONID': 'Leonid', 'SUDDENRAID-CALISTRA': 'Calistra', 'CR-456': 'Castle Rush (Thu/Fri/Sat)', 'CR-KRIS': 'Castle Rush: Kris', 'CR-LEONID': 'Castle Rush: Leonid' };
  var TIER_COLORS = { 'SSS': '#EB8DFF', 'SS': '#FF6767', 'S': '#FBBC04', 'A': '#FEFF31', 'B': '#8CE669', 'C': '#58CDDA', 'D': '#699FE6', 'NOT USED': '#D9D9D9' };
  var DASHBOARD_ART = { 'power-up-dungeon-roles': 'powerupdungeon', 'raid': 'raid', 'sudden-raid': 'suddenraid', 'castle-rush': 'castlerush', 'advent-expedition': 'adventexpedition', 'arena': 'arena', 'total-war': 'totalwar', 'guild-war': 'guildwar', 'farming': 'farming' };
  var SET_ICONS = { 'Bounty Tracker': 'Bounty.webp', 'Spellweaver': 'Spellweaver.webp', 'Avenger': 'Avenger.webp', 'Gatekeeper': 'Gatekeeper.webp', 'Guardian': 'Guardian.webp', 'Orchestrator': 'Orchestrator.webp', 'Paladin': 'Paladin.webp', 'Assassin': 'Assassin.webp', 'Vanguard': 'Vanguard.webp' };
  /* Gear piece art (Atlas Raid sets): [boss abbr, set stem]. Weapon uses
   * variant 2 for Magic heroes, 1 otherwise; armor always variant 3. */
  var SET_PIECE = { 'Bounty Tracker': ['DG', 'Bounty'], 'Paladin': ['DG', 'Paladin'], 'Vanguard': ['DG', 'Vanguard'], 'Assassin': ['NMW', 'Assassin'], 'Gatekeeper': ['NMW', 'Gatekeeper'], 'Guardian': ['NMW', 'Guardian'], 'Avenger': ['ID', 'Avenger'], 'Orchestrator': ['ID', 'Orchestrator'], 'Spellweaver': ['ID', 'Spell'] };
  function pieceImg(setName, slot, heroType) {
    var p = SET_PIECE[setName];
    if (!p) return null;
    var variant = slot === 'armor' ? 3 : (heroType === 'Magic' ? 2 : 1);
    return p[0] + '-' + p[1] + variant + '.webp';
  }
  var REASON_LABEL = { 'awakened': 'Awakened', 'effect': 'Effect', 'role-single': 'Single-Target DPS', 'role-three': '3-Target DPS', 'role-aoe': '4/5-Target DPS', 'widely-used': 'Widely used' };

  var params = new URLSearchParams(location.search);
  var heroId = params.get('id') || '';
  var tab = params.get('tab') === 'builds' ? 'builds' : 'main';
  var version = 's6';
  var buildIdx = 0;
  var hero = null;
  var index = [];

  var sideEl = document.getElementById('hx-side');
  var mainEl = document.getElementById('hx-content');
  var tabMainBtn = document.getElementById('hx-tab-main');
  var tabBuildsBtn = document.getElementById('hx-tab-builds');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function statLabel(code) { return STAT_LABELS[code] || code; }
  function fmtDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }
  function sectionTitle(t) { return '<h3 class="hx-section-title">' + esc(t) + '</h3>'; }

  function skillsFor(v) {
    return v === 'awk' ? (hero.skills.awk || []) : (hero.skills.s6 || hero.skills.awk || []);
  }
  function statsFor(v) {
    return v === 'awk' ? (hero.stats.awk || hero.stats.s6 || {}) : (hero.stats.s6 || {});
  }
  function enhanceFor(v) {
    return v === 'awk' ? (hero.enhance.awk || []) : (hero.enhance.s6 || []);
  }
  function portraitFor(v) {
    return v === 'awk' ? 'assets/hero-awk-' + hero.id + '.webp' : 'assets/hero-' + hero.id + '.webp';
  }
  function skillIcon(sk) {
    return sk.icon ? 'assets/skills-raw/' + sk.icon : null;
  }
  /* Vietnamese translation (hero.vi, merged from ~/workspace/i18n/vi/).
   * Every lookup falls back to the original English when no translation
   * exists yet, so the page works before/after the merge. */
  function vi() { return (hero && hero.vi) || {}; }
  /* Dịch phạm vi mục tiêu của kỹ năng sang tiếng Việt (dữ liệu Atlas,
   * 66 chuỗi duy nhất trong toàn bộ 124 hero). Chuỗi nào không có trong
   * bảng sẽ giữ nguyên tiếng Anh để không hiển thị sai. */
  var TARGET_VI = {
    '1 Enemy (Front Row First)': '1 kẻ địch (ưu tiên hàng trước)',
    '1 Enemy When Doing a Follow-Up': '1 kẻ địch (khi đánh tiếp)',
    '2 Allies': '2 đồng minh',
    '2 Allies (Excluding Self)': '2 đồng minh (trừ bản thân)',
    '2 Allies with Lowest Current HP': '2 đồng minh có HP hiện tại thấp nhất',
    '2 Allies with the Highest Attack': '2 đồng minh có Attack cao nhất',
    '2 Allies with the Highest Attack (Excluding Self)': '2 đồng minh có Attack cao nhất (trừ bản thân)',
    '2 Allies with the Lowest Current HP (Excluding Self)': '2 đồng minh có HP hiện tại thấp nhất (trừ bản thân)',
    '2 Back Row Allies': '2 đồng minh hàng sau',
    '2 Enemies': '2 kẻ địch',
    '2 Enemies (By Highest No. of Buffs)': '2 kẻ địch (ưu tiên nhiều buff nhất)',
    '2 Enemies with the Highest Attack': '2 kẻ địch có Attack cao nhất',
    '3 Allies': '3 đồng minh',
    '3 Allies with the Lowest Current HP': '3 đồng minh có HP hiện tại thấp nhất',
    '3 Enemies': '3 kẻ địch',
    '3 Enemies (Back Row First)': '3 kẻ địch (ưu tiên hàng sau)',
    '3 Enemies (By Highest Attack Level)': '3 kẻ địch (ưu tiên Attack cao nhất)',
    '3 Enemies (By Highest No. of Buffs)': '3 kẻ địch (ưu tiên nhiều buff nhất)',
    '3 Enemies (Prioritizes Targets w/ Thunderbolt Mark)': '3 kẻ địch (ưu tiên mục tiêu có Thunderbolt Mark)',
    '3 Enemies with the Highest Attack': '3 kẻ địch có Attack cao nhất',
    '4 Enemies': '4 kẻ địch',
    '4 Enemies (Front Row First)': '4 kẻ địch (ưu tiên hàng trước)',
    '4 Enemies (Prioritize Targets with Mark of Darkness)': '4 kẻ địch (ưu tiên mục tiêu có Mark of Darkness)',
    'All Allies': 'Tất cả đồng minh',
    'All Enemies': 'Tất cả kẻ địch',
    'All Magic Allies': 'Tất cả đồng minh Magic',
    'Allies (Attack)': 'Đồng minh (Attack)',
    'Allies (Attack) (Excluding Self)': 'Đồng minh (Attack) (trừ bản thân)',
    'Allies (Attack, Magic)': 'Đồng minh (Attack, Magic)',
    'Allies (Attack, Universal)': 'Đồng minh (Attack, Universal)',
    'Allies (Defense, Support)': 'Đồng minh (Defense, Support)',
    'Allies (Defense, Universal)': 'Đồng minh (Defense, Universal)',
    'Allies (Magic)': 'Đồng minh (Magic)',
    'Allies (Self, 2 Back Row Allies)': 'Đồng minh (bản thân, 2 đồng minh hàng sau)',
    'Allies (Self, Ally with the Highest ATK)': 'Đồng minh (bản thân, đồng minh có ATK cao nhất)',
    'Allies (Self, Magic)': 'Đồng minh (bản thân, Magic)',
    'Allies (Universal)': 'Đồng minh (Universal)',
    'Allies in Row w/ Self (Magic)': 'Đồng minh cùng hàng với bản thân (Magic)',
    'Ally with Lowest Current HP (Excluding Self)': 'Đồng minh có HP hiện tại thấp nhất (trừ bản thân)',
    'Ally with the Highest ATK': 'Đồng minh có ATK cao nhất',
    'Ally with the Lowest Current HP (Excluding Self)': 'Đồng minh có HP hiện tại thấp nhất (trừ bản thân)',
    'Back Row Allies': 'Đồng minh hàng sau',
    'Back Row Allies (Magic)': 'Đồng minh hàng sau (Magic)',
    'Back Row Allies (Universal)': 'Đồng minh hàng sau (Universal)',
    'Back Row Enemies': 'Kẻ địch hàng sau',
    'Enemies (Attack, Magic)': 'Kẻ địch (Attack, Magic)',
    'Enemies (Defense, Support, Universal)': 'Kẻ địch (Defense, Support, Universal)',
    'Enemies in Row w/ Main Target': 'Kẻ địch cùng hàng với mục tiêu chính',
    'Enemy with the Highest Attack': 'Kẻ địch có Attack cao nhất',
    'Enemy with the Highest Current HP': 'Kẻ địch có HP hiện tại cao nhất',
    'Enemy with the Highest Defense': 'Kẻ địch có Defense cao nhất',
    'Enemy with the highest Max HP': 'Kẻ địch có Max HP cao nhất',
    'Front Row Allies': 'Đồng minh hàng trước',
    'Front Row Enemies': 'Kẻ địch hàng trước',
    'Self': 'Bản thân',
    'Self, 1 Ally (Back Row First)': 'Bản thân, 1 đồng minh (ưu tiên hàng sau)',
    'Self, 2 Allies with the Highest Attack (Excluding Self)': 'Bản thân, 2 đồng minh có Attack cao nhất (trừ bản thân)',
    'Single Ally': '1 đồng minh',
    'Single Enemy': '1 kẻ địch',
    'Single Enemy (Back Row First)': '1 kẻ địch (ưu tiên hàng sau)',
    'Single Enemy (By Highest No. of Buffs)': '1 kẻ địch (ưu tiên nhiều buff nhất)',
    'Single Enemy (Eyes of the Strong)': '1 kẻ địch (Eyes of the Strong)',
    'Single Enemy (Prioritize Targets with Mark of Darkness)': '1 kẻ địch (ưu tiên mục tiêu có Mark of Darkness)',
    'Single Enemy (Prioritizes Targets w/ Thunderbolt Mark)': '1 kẻ địch (ưu tiên mục tiêu có Thunderbolt Mark)',
    'Single Enemy (Prioritizes Targets with Poison)': '1 kẻ địch (ưu tiên mục tiêu đang trúng độc)',
    'Single Enemy When Counterattacking': '1 kẻ địch (khi phản đòn)'
  };
  function targetVi(t) { return TARGET_VI[t] || t; }
  /* Tên tiếng Việt của các hiệu ứng trong kỹ năng (điền từ bảng thuật ngữ
   * ~/workspace/i18n/effect_names_vi.json). Hiệu ứng nào chưa có trong
   * bảng thì hiển thị tên tiếng Anh. */
  var FX_VI = {
   "Pierce": "Xuyên thủng",
   "Barrier": "Khiên",
   "Ignore Defense": "Xuyên giáp",
   "Debuff Removal": "Xóa Debuff",
   "Buff Duration Reduction": "Giảm thời gian Buff",
   "Buff Removal": "Xóa Buff",
   "All Damage Immunity": "Miễn nhiễm mọi sát thương",
   "Revive": "Hồi sinh",
   "Defense Reduction": "Giảm Defense",
   "All Damage Nullification": "Vô hiệu mọi sát thương",
   "Crit Rate Boost": "Tăng Crit Rate",
   "Bleed": "Chảy máu",
   "Crit Damage Boost": "Tăng Crit Damage",
   "Burn": "Thiêu đốt",
   "Cooldown Reduction": "Giảm hồi chiêu",
   "Stun": "Choáng",
   "Weakness Hit Chance Boost": "Tăng tỉ lệ đánh điểm yếu",
   "Guts": "Kiên cường",
   "Effect Hit Rate Boost": "Tăng Effect Hit Rate",
   "Crowd Control Immunity": "Miễn nhiễm khống chế",
   "Physical Attack Boost": "Tăng Physical Attack",
   "HP Alteration": "Đặt lại HP",
   "Deadly Poison": "Kịch độc",
   "Shock": "Sốc điện",
   "Continuous Healing": "Hồi HP liên tục",
   "Defense Boost": "Tăng Defense",
   "Incoming Healing Reduction": "Giảm hồi HP nhận vào",
   "Effect Resist Reduction": "Giảm Effect Resistance",
   "Death": "Tử vong",
   "All Attack Reduction": "Giảm All Attack",
   "Damage Reduction": "Giảm sát thương gây ra",
   "Unable to Recover": "Không thể hồi HP",
   "Poison": "Độc",
   "Silence": "Câm lặng",
   "Cooldown Reset": "Reset hồi chiêu",
   "Effect Resist Boost": "Tăng Effect Resistance",
   "Magic Attack Boost": "Tăng Magic Attack",
   "Blessing": "Phước lành",
   "Physical Vulnerability": "Dễ tổn thương vật lý",
   "Damage Resistance": "Giảm sát thương nhận vào",
   "Magic Damage Boost": "Tăng sát thương Magic",
   "Physical Damage Boost": "Tăng sát thương vật lý",
   "Magic Vulnerability": "Dễ tổn thương Magic",
   "Awakening Gauge Boost": "Tăng thanh thức tỉnh",
   "Camouflage": "Ngụy trang",
   "Immortality": "Bất tử",
   "Taunt": "Khiêu khích",
   "Mark of Darkness": "Dấu ấn bóng tối",
   "Block Rate Reduction": "Giảm Block Rate",
   "Increased Miss Chance": "Tăng tỉ lệ trượt",
   "Paralysis": "Tê liệt",
   "Damage Boost": "Tăng sát thương",
   "Incoming Healing Reduction (Stacks)": "Giảm hồi HP nhận vào (cộng dồn)",
   "Freeze": "Đóng băng",
   "Crit Rate Reduction": "Giảm Crit Rate",
   "Block Rate Boost": "Tăng Block Rate",
   "Defense Reduction (Stacks)": "Giảm Defense (cộng dồn)",
   "Weakness Hit Chance Reduction": "Giảm tỉ lệ đánh điểm yếu",
   "Petrify": "Hóa đá",
   "Indomitable": "Bất khuất",
   "Protection": "Bảo vệ",
   "Buff Block": "Chặn Buff",
   "Skill Cooldown Increase": "Tăng hồi chiêu kỹ năng",
   "Incoming Healing Boost": "Tăng hồi HP nhận vào",
   "Link": "Liên kết",
   "Physical Attack Reduction": "Giảm Physical Attack",
   "Physical Damage Immunity": "Miễn nhiễm sát thương vật lý",
   "Counterattack": "Phản đòn",
   "Confusion": "Hỗn loạn",
   "Demon Face (Stacks)": "Mặt quỷ (cộng dồn)",
   "All Attack Boost": "Tăng All Attack",
   "Execution": "Kết liễu",
   "Ally Role Support": "Hỗ trợ vai trò đồng minh",
   "Silence Immunity": "Miễn nhiễm câm lặng",
   "Fear": "Sợ hãi",
   "Attack-Based Effect Hit Rate Boost": "Tăng Effect Hit Rate theo ATK",
   "Magic Resistance": "Kháng Magic",
   "Extreme Chill": "Cực hàn",
   "Magic Bond": "Liên kết Magic",
   "Weakness Hit Damage Boost": "Tăng sát thương điểm yếu",
   "Bad Debt": "Nợ xấu",
   "Toxic Build-Up (Stacks)": "Tích độc (cộng dồn)",
   "Death Effect Probability Boost": "Tăng tỉ lệ hiệu ứng tử vong",
   "Blind": "Mù",
   "Burn Immunity": "Miễn nhiễm thiêu đốt",
   "Effect Probability Boost": "Tăng Effect Probability",
   "Defense Ignore Efficiency Boost": "Tăng hiệu quả xuyên giáp",
   "Crit Damage Boost (Stacks)": "Tăng Crit Damage (cộng dồn)",
   "Sleep": "Ngủ",
   "Defense-Based Block Rate Boost": "Tăng Block Rate theo Defense",
   "Effect Probability Reduction": "Giảm Effect Probability",
   "Pain Endurance": "Chịu đau",
   "Buff Duration Boost": "Tăng thời gian Buff",
   "HP Swap": "Hoán đổi HP",
   "Eyes of the Strong": "Ánh mắt kẻ mạnh",
   "Physical Resistance": "Kháng vật lý",
   "Crystal Cluster": "Cụm tinh thể",
   "Magic Reflux": "Hồi lưu Magic",
   "[Mark: Energia's Saturation] (Stacks)": "[Dấu ấn: bão hòa Energia] (cộng dồn)",
   "Magic Vulnerability (Stacks)": "Dễ tổn thương Magic (cộng dồn)",
   "Defensive Posture (Stacks)": "Thế thủ (cộng dồn)",
   "Delayed Buff": "Buff trì hoãn",
   "Binding Rope": "Dây trói",
   "Concussion": "Chấn động",
   "Earth Dragon's Fury": "Thịnh nộ rồng đất",
   "Follow-Up Chance Boost": "Tăng tỉ lệ đánh theo",
   "Follow-Up Attack": "Đánh theo",
   "Quintuple-Target Attack Resistance": "Kháng sát thương 5 mục tiêu",
   "Petrify Immunity": "Miễn nhiễm hóa đá",
   "Resets all skill cooldowns": "Reset toàn bộ hồi chiêu",
   "Shock Immunity": "Miễn nhiễm sốc điện",
   "Max HP-Based Block Rate Boost": "Tăng Block Rate theo Max HP",
   "Bomb": "Bom",
   "Speed-Based Attack Boost": "Tăng ATK theo Speed",
   "Transformation": "Biến hình",
   "Shock Probability Boost": "Tăng tỉ lệ sốc điện",
   "Stun Immunity": "Miễn nhiễm choáng",
   "Freeze Immunity": "Miễn nhiễm đóng băng",
   "Cooldown Increase Immunity": "Miễn nhiễm tăng hồi chiêu",
   "Debuff Duration Boost": "Tăng thời gian Debuff",
   "Cover": "Yểm trợ",
   "Magic Damage Immunity": "Miễn nhiễm sát thương Magic",
   "Attack Based Defense Boost": "Tăng Defense theo ATK",
   "Attack-Based Defense Boost": "Tăng Defense theo ATK",
   "Physical Attack Boost (Stacks)": "Tăng Physical Attack (cộng dồn)",
   "Crit Damage Reduction": "Giảm Crit Damage",
   "Bleed Immunity": "Miễn nhiễm chảy máu",
   "Skill Cooldown Reset upon gaining Immortality": "Reset hồi chiêu khi bất tử",
   "Life Drain": "Hút máu",
   "Death Immunity": "Miễn nhiễm tử vong",
   "Revives with 80% HP upon falling in battle": "Hồi sinh với 80% HP",
   "Triple-Target Attack Damage Boost": "Tăng sát thương tấn công 3 mục tiêu",
   "Unfair Contract": "Khế ước bất công",
   "Physical Damage Boost (Stacks)": "Tăng sát thương vật lý (cộng dồn)",
   "Threads of Fate": "Sợi chỉ định mệnh",
   "Incoming Barrier Reduction": "Giảm khiên nhận vào",
   "Upper Hand": "Thế thượng phong",
   "Transparent World": "Thế giới trong suốt",
   "Tower's Benevolence": "Ân huệ của tháp",
   "Paralysis Immunity": "Miễn nhiễm tê liệt",
   "Deep Sleep": "Ngủ sâu",
   "Death Turn Reduction": "Giảm số lượt tử vong",
   "Focus Target": "Mục tiêu ưu tiên",
   "Pinnacle of Martial Arts": "Đỉnh cao võ thuật",
   "Bleed Explosion": "Kích nổ chảy máu",
   "Boss Damage Boost": "Tăng sát thương lên Boss",
   "Detonates Bombs": "Kích nổ bom",
   "7-Dish Meal Set (Stacks)": "Bộ 7 món ăn (cộng dồn)",
   "Max HP-Based Effect Hit Rate Boost": "Tăng Effect Hit Rate theo Max HP",
   "Purified Magic (Stacks)": "Ma thuật thuần khiết (cộng dồn)",
   "Divinity (Stacks)": "Thần tính (cộng dồn)",
   "stack(s) of Divinity": "Cộng dồn thần tính",
   "Spot": "Điểm yếu",
   "Dragonflame": "Lửa rồng",
   "Sniper Stance": "Thế bắn tỉa",
   "Souldeath": "Tử hồn",
   "Crowd Control Immunity upon gaining Immortality": "Miễn nhiễm khống chế khi bất tử",
   "Thunderbolt Mark": "Dấu ấn sấm sét",
   "Perseverance (Stacks)": "Kiên trì (cộng dồn)",
   "Damage Boost (Stacks)": "Tăng sát thương (cộng dồn)",
   "Counterattack Chance Boost": "Tăng tỉ lệ phản đòn",
   "Reckless Valor": "Dũng khí liều lĩnh",
   "[Mark: Heaven Scorcher Halberd's Rage] (Stacks)": "[Dấu ấn: cơn thịnh nộ của Halberd thiêu trời] (cộng dồn)",
   "Poison Immunity": "Miễn nhiễm độc",
   "Crystal Resonance": "Cộng hưởng tinh thể",
   "Physical Enhancement: Crystal Dragon": "Cường hóa vật lý: rồng tinh thể",
   "Attack-Based Weakness Hit Chance Boost": "Tăng tỉ lệ đánh điểm yếu theo ATK",
   "Guardian Spirit": "Linh hồn hộ vệ",
   "Attack-Based Reduced Damage Taken Boost": "Tăng kháng sát thương theo ATK",
   "Resets the cooldown of [Undefeated Cavalier] upon defeating an enemy with damage from this skill": "Reset hồi chiêu [Undefeated Cavalier] khi hạ địch",
   "Final Judgment": "Phán quyết cuối cùng",
   "Resets the cooldown of [Dragon's Descent] upon defeating an enemy with damage from this skill": "Reset hồi chiêu [dragon's Descent] khi hạ địch",
   "Guts upon revival": "Guts khi hồi sinh",
   "Max HP-Based Defense Boost": "Tăng Defense theo Max HP",
   "Damage Resistance (Self)": "Giảm sát thương nhận vào (bản thân)",
   "Damage Resistance (Allies)": "Giảm sát thương nhận vào (đồng minh)",
   "Awakening Gauge Reduction": "Giảm thanh thức tỉnh",
   "Sleep Immunity": "Miễn nhiễm ngủ",
   "Magic Attack Boost (Stacks)": "Tăng Magic Attack (cộng dồn)",
   "Hunter's Expertise (Stacks)": "Chuyên môn thợ săn (cộng dồn)",
   "Max HP-Based Attack Boost": "Tăng ATK theo Max HP",
   "Clone": "Phân thân",
   "Conqueror of Adversity. (Stacks)": "Kẻ chinh phục nghịch cảnh (cộng dồn)",
   "Level Up (Stacks)": "Tăng cấp (cộng dồn)",
   "Conqueror of Adversity (Stacks)": "Kẻ chinh phục nghịch cảnh (cộng dồn)",
   "Hawk's Talons (Stacks)": "Móng diều hâu (cộng dồn)",
   "Single-Target Attack Damage Boost": "Tăng sát thương tấn công đơn mục tiêu",
   "Magic Attack Reduction": "Giảm Magic Attack",
   "Blind Immunity": "Miễn nhiễm mù"
  };
  /* Dịch ghi chú trong ngoặc của kỹ năng + in đậm giá trị quan trọng.
   * Ghi chú là các mẫu có cấu trúc (Duration, Max Stack, Once per Battle,
   * ...) nên dịch bằng regex; tên hiệu ứng trong ngoặc dịch qua FX_VI;
   * tên riêng (dấu ấn, tên kỹ năng) giữ nguyên tiếng Anh. Sau đó in đậm
   * các giá trị % , tên hiệu ứng và loại sát thương. */
  var NOTE_PATTERNS = [
    [/Duration: (\d+) Turn\(s\)/g, 'Kéo dài: $1 lượt'],
    [/Always Active/g, 'Luôn kích hoạt'],
    [/Once per Battle/g, '1 lần trong trận'],
    [/Once per Round/g, '1 lần mỗi vòng'],
    [/(\d+) Time\(s\) per Battle/g, '$1 lần trong trận'],
    [/Reduced by: (\d+) Turn\(s\)/g, 'Giảm: $1 lượt'],
    [/Max: (\d+) Stack\(s\)/g, 'Tối đa: $1 cộng dồn'],
    [/Max (\d+) Stack\(s\)/g, 'Tối đa $1 cộng dồn'],
    [/Max (\d+) Stacks/g, 'Tối đa $1 cộng dồn'],
    [/Max (\d+) Hit\(s\)/g, 'Tối đa $1 đòn'],
    [/Max (\d+) Bomb\(s\)/g, 'Tối đa $1 bom'],
    [/Max (\d+) Level\(s\)/g, 'Tối đa cấp $1'],
    [/Ends After: Taking (\d+) Hit\(s\)/g, 'Kết thúc sau khi nhận $1 đòn'],
    [/Lasts for: (\d+) Hit\(s\)/g, 'Kéo dài: $1 đòn'],
    [/(\d+) Hit\(s\)/g, '$1 đòn'],
    [/(\d+) Time\(s\)/g, '$1 lần'],
    [/Increased by: (\d+)s/g, 'Tăng thêm: $1 giây'],
    [/Additional (\d+)% Crit Rate/g, 'Thêm $1% Crit Rate'],
    [/Unremovable/g, 'Không thể xóa'],
    [/Limit: ([\d,]+)% of (.+?)'s Attack/g, 'Giới hạn: $1% Attack của $2'],
    [/Magic Bond - (\d+) Target\(s\)/g, 'Magic Bond - $1 mục tiêu'],
    [/Mark: (.+)/g, 'Dấu ấn: $1']
  ];
  /* Tên hiệu ứng + loại sát thương cần in đậm (dài trước để khớp cụm dài). */
  var BOLD_TERMS = Object.keys(FX_VI).concat([
    'Physical Attack', 'Magic Attack', 'Physical Damage', 'Magic Damage', 'True Damage'
  ]).sort(function (a, b) { return b.length - a.length; });
  var BOLD_RE = new RegExp('\\b(' + BOLD_TERMS.map(function (t) {
    return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('|') + ')\\b', 'g');
  /* Phân loại hiệu ứng để tô màu trong nội dung chi tiết kỹ năng:
   * FX_BAD = hiệu ứng xấu lên kẻ địch (tô đỏ), FX_GOOD = hiệu ứng tốt
   * lên bản thân/đồng minh (tô xanh dương). Chỉ dựa vào tên hiệu ứng
   * trong dữ liệu Atlas (tên "X Reduction" là debuff lên địch, "X Boost"
   * là buff lên mình). Các hiệu ứng cơ chế/trung tính (Pierce, Ignore
   * Defense, các mốc Stack, ...) không nằm trong 2 danh sách này nên chỉ
   * in đậm như trước, không tô màu. */
  var FX_BAD = {
    'All Attack Reduction': 1, 'Awakening Gauge Reduction': 1, 'Bad Debt': 1,
    'Binding Rope': 1, 'Bleed': 1, 'Bleed Explosion': 1, 'Blind': 1,
    'Block Rate Reduction': 1, 'Bomb': 1, 'Buff Block': 1,
    'Buff Duration Reduction': 1, 'Buff Removal': 1, 'Burn': 1,
    'Concussion': 1, 'Confusion': 1, 'Crit Damage Reduction': 1,
    'Crit Rate Reduction': 1, 'Deadly Poison': 1, 'Death': 1,
    'Debuff Duration Boost': 1, 'Defense Reduction': 1,
    'Defense Reduction (Stacks)': 1, 'Detonates Bombs': 1,
    'Effect Probability Reduction': 1, 'Effect Resist Reduction': 1,
    'Execution': 1, 'Fear': 1, 'Freeze': 1, 'Incoming Barrier Reduction': 1,
    'Incoming Healing Reduction': 1, 'Incoming Healing Reduction (Stacks)': 1,
    'Increased Miss Chance': 1, 'Magic Attack Reduction': 1,
    'Magic Vulnerability': 1, 'Magic Vulnerability (Stacks)': 1,
    'Mark of Darkness': 1, 'Paralysis': 1, 'Petrify': 1,
    'Physical Attack Reduction': 1, 'Physical Vulnerability': 1, 'Poison': 1,
    'Silence': 1, 'Skill Cooldown Increase': 1, 'Sleep': 1, 'Deep Sleep': 1,
    'Shock': 1, 'Souldeath': 1, 'Stun': 1, 'Taunt': 1, 'Thunderbolt Mark': 1,
    'Toxic Build-Up (Stacks)': 1, 'Unable to Recover': 1,
    'Weakness Hit Chance Reduction': 1
  };
  var FX_GOOD = {
    'All Attack Boost': 1, 'All Damage Immunity': 1, 'All Damage Nullification': 1,
    'Ally Role Support': 1, 'Attack Based Defense Boost': 1,
    'Attack-Based Defense Boost': 1, 'Attack-Based Effect Hit Rate Boost': 1,
    'Attack-Based Reduced Damage Taken Boost': 1,
    'Attack-Based Weakness Hit Chance Boost': 1, 'Awakening Gauge Boost': 1,
    'Barrier': 1, 'Blessing': 1, 'Bleed Immunity': 1, 'Blind Immunity': 1,
    'Block Rate Boost': 1, 'Boss Damage Boost': 1, 'Buff Duration Boost': 1,
    'Burn Immunity': 1, 'Camouflage': 1, 'Clone': 1, 'Continuous Healing': 1,
    'Cooldown Increase Immunity': 1, 'Cooldown Reduction': 1, 'Cooldown Reset': 1,
    'Counterattack': 1, 'Counterattack Chance Boost': 1, 'Cover': 1,
    'Crit Damage Boost': 1, 'Crit Damage Boost (Stacks)': 1, 'Crit Rate Boost': 1,
    'Crowd Control Immunity': 1,
    'Crowd Control Immunity upon gaining Immortality': 1, 'Damage Boost': 1,
    'Damage Boost (Stacks)': 1, 'Damage Reduction': 1, 'Damage Resistance': 1,
    'Damage Resistance (Allies)': 1, 'Damage Resistance (Self)': 1,
    'Death Effect Probability Boost': 1, 'Death Immunity': 1, 'Debuff Removal': 1,
    'Defense Boost': 1, 'Defense Ignore Efficiency Boost': 1,
    'Defense-Based Block Rate Boost': 1, 'Effect Hit Rate Boost': 1,
    'Effect Probability Boost': 1, 'Effect Resist Boost': 1, 'Freeze Immunity': 1,
    'Guardian Spirit': 1, 'Guts': 1, 'Guts upon revival': 1, 'Immortality': 1,
    'Incoming Healing Boost': 1, 'Indomitable': 1, 'Link': 1,
    'Magic Attack Boost': 1, 'Magic Attack Boost (Stacks)': 1, 'Magic Bond': 1,
    'Magic Damage Boost': 1, 'Magic Damage Immunity': 1, 'Magic Resistance': 1,
    'Max HP-Based Attack Boost': 1, 'Max HP-Based Block Rate Boost': 1,
    'Max HP-Based Defense Boost': 1, 'Max HP-Based Effect Hit Rate Boost': 1,
    'Pain Endurance': 1, 'Paralysis Immunity': 1, 'Petrify Immunity': 1,
    'Physical Attack Boost': 1, 'Physical Attack Boost (Stacks)': 1,
    'Physical Damage Boost': 1, 'Physical Damage Boost (Stacks)': 1,
    'Physical Damage Immunity': 1, 'Physical Resistance': 1,
    'Poison Immunity': 1, 'Protection': 1,
    'Quintuple-Target Attack Resistance': 1, 'Resets all skill cooldowns': 1,
    "Resets the cooldown of [Dragon's Descent] upon defeating an enemy with damage from this skill": 1,
    "Resets the cooldown of [Undefeated Cavalier] upon defeating an enemy with damage from this skill": 1,
    'Revive': 1, 'Revives with 80% HP upon falling in battle': 1,
    'Shock Immunity': 1, 'Shock Probability Boost': 1, 'Silence Immunity': 1,
    'Single-Target Attack Damage Boost': 1,
    'Skill Cooldown Reset upon gaining Immortality': 1, 'Sleep Immunity': 1,
    'Speed-Based Attack Boost': 1, 'Stun Immunity': 1,
    'Triple-Target Attack Damage Boost': 1, 'Weakness Hit Chance Boost': 1,
    'Weakness Hit Damage Boost': 1
  };
  /* noColor = true: chỉ in đậm, không tô màu (dùng cho mục "Hiệu ứng"
   * giải thích — theo yêu cầu, phần giải thích không tô màu). */
  function richLine(raw, noColor) {
    var s = esc(raw == null ? '' : raw);
    /* Dịch nội dung trong ngoặc [...]. */
    s = s.replace(/\[([^\]]+)\]/g, function (m, inner) {
      var t = inner;
      NOTE_PATTERNS.forEach(function (p) { t = t.replace(p[0], p[1]); });
      if (t === inner && FX_VI[inner]) t = FX_VI[inner];
      return '[' + t + ']';
    });
    /* In đậm giá trị % , tên hiệu ứng, loại sát thương; tô đỏ hiệu ứng xấu
     * lên địch, tô xanh dương hiệu ứng tốt lên mình/đồng minh. */
    s = s.replace(/(\d+(?:\.\d+)?%)/g, '<b>$1</b>');
    s = s.replace(BOLD_RE, function (m) {
      if (!noColor && FX_BAD[m]) return '<b class="hx-fx-bad">' + m + '</b>';
      if (!noColor && FX_GOOD[m]) return '<b class="hx-fx-good">' + m + '</b>';
      return '<b>' + m + '</b>';
    });
    return s;
  }

  /* Tên build dịch sang tiếng Việt, Title Case (200 tên Atlas). */
  var BUILD_VI = {
    "2nd Highest Attack": "Attack Cao Thứ 2",
    "3-Target DPS": "DPS 3 Mục Tiêu",
    "AOE Damage Boost": "Tăng Sát Thương AOE",
    "AOE Slasher": "Chém AOE",
    "AOE Slayer": "Diệt AOE",
    "Absolute Meteorite": "Thiên Thạch Tuyệt Đối",
    "Advent Dream Support": "Hỗ Trợ Advent Dream",
    "Advent Expedition": "Advent Expedition",
    "Advent Snipe": "Bắn Tỉa Advent",
    "All-Out DPS": "DPS Toàn Lực",
    "All-Rounded DPS": "DPS Toàn Diện",
    "All-rounded Utility": "Tiện Ích Toàn Diện",
    "Archer of Paralysis": "Cung Thủ Tê Liệt",
    "Attack Maximizer": "Tối Đa Attack",
    "Baby DPS": "DPS Non",
    "Baby Guan Yu (pre-T6)": "Guan Yu Non (pre-T6)",
    "Baby Pallanus (pre-T6)": "Pallanus Non (pre-T6)",
    "Baby Reginleif (pre-T6)": "Reginleif Non (pre-T6)",
    "Baby Sun Wukong (pre-T6)": "Sun Wukong Non (pre-T6)",
    "Baby Sunran (pre-T6)": "Sunran Non (pre-T6)",
    "Baby Teo (pre-T6)": "Teo Non (pre-T6)",
    "Baby Trude (pre-T6)": "Trude Non (pre-T6)",
    "Barrier Superhero": "Siêu Anh Hùng Khiên",
    "Barrier for Life": "Khiên Cả Đời",
    "Battlefield Domination": "Thống Trị Chiến Trường",
    "Better Healing": "Hồi Máu Tốt Hơn",
    "Big Bomb Damage": "Sát Thương Bom Lớn",
    "Big Chain Damage": "Sát Thương Liên Hoàn Lớn",
    "Big Heals": "Hồi Máu Lớn",
    "Bleed Master": "Bậc Thầy Chảy Máu",
    "Bleed-centric": "Xoay Quanh Chảy Máu",
    "Bleeding Spear": "Giáo Chảy Máu",
    "Block & Burst": "Block Và Burst",
    "Block Survival": "Sống Sót Nhờ Block",
    "Block-Focused": "Tập Trung Block",
    "Boost the Barrier": "Tăng Khiên",
    "Boss DMG Boost": "Tăng Sát Thương Boss",
    "Boss Damage Boost": "Tăng Sát Thương Boss",
    "Boss Killer": "Diệt Boss",
    "Boss Slayer": "Săn Boss",
    "Boss Slayer-EX": "Săn Boss-EX",
    "Boss Support": "Hỗ Trợ Đánh Boss",
    "Bringer of Fear": "Kẻ Gieo Sợ Hãi",
    "Bulky DPS": "DPS Trâu",
    "Burn Boost": "Tăng Thiêu Đốt",
    "Burn It Stun It": "Đốt Rồi Choáng",
    "Burn-Focused": "Tập Trung Thiêu Đốt",
    "Burn-centric": "Xoay Quanh Thiêu Đốt",
    "CC-Focused": "Tập Trung CC",
    "Castle Rush": "Castle Rush",
    "Chonky Tank": "Tank Mũm Mĩm",
    "Clean Up Shots": "Kết Liễu Bằng Đạn",
    "Cleanser": "Tẩy Debuff",
    "Concussion Time!": "Giờ Chấn Động!",
    "Crit Bombardment": "Bắn Phá Crit",
    "Crit Maximizer": "Tối Đa Crit",
    "Crit Zombie": "Zombie Crit",
    "Crit-Focused": "Tập Trung Crit",
    "Crit-Focused Exception": "Ngoại Lệ Tập Trung Crit",
    "Critical Gun Shots": "Đạn Chí Mạng",
    "Crystal Tank": "Tank Pha Lê",
    "DOT-Focused": "Tập Trung DOT",
    "DOT-centric": "Xoay Quanh DOT",
    "Damage Pump": "Bơm Sát Thương",
    "Damage-Focused": "Tập Trung Sát Thương",
    "Death King": "Vua Tử Thần",
    "Death Prayers": "Lời Cầu Tử Thần",
    "Death Tank": "Tank Tử Thần",
    "Debuff Resistance": "Kháng Debuff",
    "Defense Maximizer": "Tối Đa Defense",
    "Defense Survival": "Sống Sót Nhờ Defense",
    "Defensive Disruptor": "Phá Rối Phòng Thủ",
    "Defensive Longevity": "Phòng Thủ Bền Bỉ",
    "Defensive Utility": "Tiện Ích Phòng Thủ",
    "Demon Breathing": "Hơi Thở Quỷ",
    "Desert Disruptor": "Kẻ Phá Rối Sa Mạc",
    "Disruption Specialist": "Chuyên Gia Phá Rối",
    "Disruptor from the Stars": "Kẻ Phá Rối Từ Các Vì Sao",
    "Dragon Nunchucks": "Côn Nhị Khúc Rồng",
    "Early-Game": "Đầu Game",
    "Effect Boost": "Tăng Hiệu Ứng",
    "Every Damage Counts": "Sát Thương Nào Cũng Đáng",
    "Extreme Chiller": "Kẻ Đóng Băng Cực Mạnh",
    "Farmer Things": "Chuyện Cày Cuốc",
    "Farming": "Farm",
    "Firepowered": "Sức Mạnh Lửa",
    "Fixed Damage": "Sát Thương Cố Định",
    "Freeze-centric": "Xoay Quanh Đóng Băng",
    "Gatling Weakness": "Súng Máy Điểm Yếu",
    "Go Souldeath!": "Tử Hồn Lên!",
    "Go to Sleep!": "Đi Ngủ Đi!",
    "Guaranteed Heal": "Hồi Máu Chắc Chắn",
    "Guaranteed Taunt": "Khiêu Khích Chắc Chắn",
    "Guild War Slayer": "Diệt Guild War",
    "HP Boosting Damage": "Sát Thương Tăng Theo HP",
    "HP Maximizer": "Tối Đa HP",
    "HP Survival": "Sống Sót Nhờ HP",
    "HP-Focused": "Tập Trung HP",
    "Hawk Breathing": "Hơi Thở Diều Hâu",
    "Healer": "Hồi Máu",
    "Healer Maxima": "Hồi Máu Tối Đa",
    "Healthy Healer": "Hồi Máu Khỏe Mạnh",
    "Heavy Shots": "Phát Bắn Nặng",
    "High Attack-Focused": "Tập Trung Attack Cao",
    "Ice Age Returns": "Kỷ Băng Hà Trở Lại",
    "Ice Wall": "Bức Tường Băng",
    "Ignore Defense": "Bỏ Qua Defense",
    "Ignore the Defenses": "Bỏ Qua Mọi Defense",
    "Immunity": "Miễn Nhiễm",
    "Immunity (Pre-T6)": "Miễn Nhiễm (pre-T6)",
    "Immunity-Focused": "Tập Trung Miễn Nhiễm",
    "King of DOT": "Vua DOT",
    "King of Paralysis": "Vua Tê Liệt",
    "Lethal Single-Target ": "Đơn Mục Tiêu Chí Mạng",
    "Long Live Ace-sama!": "Ace-sama Muôn Năm!",
    "Magic Booster": "Tăng Magic",
    "Magic Reflux DMG-Focused": "Tập Trung Sát Thương Magic Reflux",
    "Magic Reflux Probability-Focused": "Tập Trung Tỉ Lệ Magic Reflux",
    "Max Defense Reduction": "Giảm Defense Tối Đa",
    "Maximum Defense": "Defense Tối Đa",
    "Minion Killer": "Diệt Lính",
    "Mob Slayer": "Diệt Quái",
    "Multi-Hit Specialist": "Chuyên Gia Đa Đòn",
    "PVE Boss Damage Dealer": "DPS Boss PVE",
    "PVE DPS": "DPS PVE",
    "PVE Destroyer": "Kẻ Hủy Diệt PVE",
    "PVE Healer": "Hồi Máu PVE",
    "PVE Slasher": "Chém PVE",
    "PVE Speed Support": "Hỗ Trợ Tốc Độ PVE",
    "PVE Support": "Hỗ Trợ PVE",
    "PVE Support-ProMax": "Hỗ Trợ PVE-ProMax",
    "PVE Wrecker": "Kẻ Phá Hoại PVE",
    "PVP DPS": "DPS PVP",
    "PVP Healer": "Hồi Máu PVP",
    "PVP Slasher": "Chém PVP",
    "PVP Utility Nuker": "Nuker Đa Dụng PVP",
    "Passive Debuffer": "Gây Debuff Bị Động",
    "Physical Team Support": "Hỗ Trợ Team Physical",
    "Planet Destruction": "Hủy Diệt Hành Tinh",
    "Planet Protection": "Bảo Vệ Hành Tinh",
    "Playful Guild War": "Guild War Vui Vẻ",
    "Poison DMG Boost": "Tăng Sát Thương Độc",
    "Poison Probability Boost": "Tăng Tỉ Lệ Độc",
    "Poison those Pookis!": "Đầu Độc Lũ Pooki!",
    "Poison-centric": "Xoay Quanh Độc",
    "Premium Healing": "Hồi Máu Cao Cấp",
    "Profressional Bait": "Mồi Nhử Chuyên Nghiệp",
    "Pseudo DPS": "DPS Giả",
    "Pseudo Tank": "Tank Giả",
    "Queen of DOT": "Nữ Hoàng DOT",
    "Queen of Death": "Nữ Hoàng Tử Thần",
    "Raid Challenger": "Thách Thức Raid",
    "Rain of Crit Hits": "Mưa Đòn Crit",
    "Rain of Weakness Hits": "Mưa Đòn Điểm Yếu",
    "Resist them all!": "Kháng Tất Cả!",
    "Rider of the Winds": "Kỵ Sĩ Của Gió",
    "ST Damage": "Sát Thương Đơn Mục Tiêu",
    "Secondary DPS": "DPS Phụ",
    "Seventh Form: God Slayer": "Thức Thứ Bảy: Diệt Thần",
    "Sharpshooter": "Xạ Thủ",
    "Sharpshooter-EX": "Xạ Thủ-EX",
    "Shield of Death": "Khiên Tử Thần",
    "Shock 'Em Well": "Choáng Chúng Thật Đã",
    "Shock Them All": "Choáng Tất Cả",
    "Short-Duration Support": "Hỗ Trợ Ngắn Hạn",
    "Shuriken Rain": "Mưa Shuriken",
    "Silence Sicko": "Kẻ Cuồng Câm Lặng",
    "Single Nuker": "Nuker Đơn Mục Tiêu",
    "Single-target Damage Dealer": "DPS Đơn Mục Tiêu",
    "Sky High Resistance": "Kháng Cực Cao",
    "Slayer of the Heavens": "Kẻ Diệt Thiên Đường",
    "Sniper": "Bắn Tỉa",
    "Solo Targetting": "DPS 1 Mục Tiêu",
    "Soothing Disruption": "Phá Rối Êm Dịu",
    "Spear Piercer": "Kẻ Đâm Giáo",
    "Spellcaster": "Pháp Sư",
    "Stat Maximization": "Tối Đa Chỉ Số",
    "Stay Focused!": "Tập Trung Nào!",
    "Sudden Raid": "Sudden Raid",
    "Supportive Damage": "Sát Thương Hỗ Trợ",
    "Supportive Dealer": "DPS Hỗ Trợ",
    "Survive & Slash": "Sống Sót Và Chém",
    "Swift & Potent": "Nhanh Và Mạnh",
    "Tanky Monk": "Nhà Sư Trâu",
    "Tertiary DPS": "DPS Thứ Ba",
    "The Great Wall": "Vạn Lý Trường Thành",
    "Thick Barriers": "Khiên Dày",
    "Thick HP": "HP Dày",
    "Top Speed Farming": "Farm Tốc Độ Cao",
    "Tower Scaler": "Leo Tháp",
    "Tower Wrecker": "Phá Tháp",
    "Tower of Trials": "Tower Of Trials",
    "Toxicity Maxima": "Độc Tính Tối Đa",
    "Utility DPS": "DPS Đa Dụng",
    "Volley Shooter": "Xạ Thủ Loạt Đạn",
    "Weakness Bombardment": "Bắn Phá Điểm Yếu",
    "Weakness Killer": "Diệt Điểm Yếu",
    "Weakness Shaman": "Pháp Sư Điểm Yếu",
    "Weakness-Focused": "Tập Trung Điểm Yếu",
    "Zzeoahhh": "Zzeoahhh"
  };
  function setIcon(setName) {
    return SET_ICONS[setName] || (setName ? setName.replace(/\s+/g, '') + '.webp' : null);
  }

  /* ---------- left column ---------- */
  function renderSide() {
    var versions = hero.awakened_date
      ? [{ key: 'awk', label: 'AWK' }, { key: 's6', label: '6★' }]
      : [{ key: 's6', label: '6★' }];
    if (version === 'awk' && !hero.awakened_date) version = 's6';
    var st = statsFor(version);
    var names = [hero.names.kr, hero.names.cn, hero.names.jp, hero.names.th].filter(Boolean).join(' · ');
    var pve = (hero.used_in || []).filter(function (u) { return u.cat === 'pve'; });
    var pvp = (hero.used_in || []).filter(function (u) { return u.cat === 'pvp'; });
    function usedHtml(list) {
      return list.map(function (u) {
        return '<span class="hx-usedin-item"><img src="assets/modes/' + esc(u.banner) + '" alt="" loading="lazy">' + esc(u.tip) + '</span>';
      }).join('');
    }
    var nav = '';
    if (index.length) {
      var i = index.findIndex(function (h) { return h.id === hero.id; });
      if (i > 0) nav += '<a class="hx-btn" href="hero.html?id=' + esc(index[i - 1].id) + '">← ' + esc(index[i - 1].name) + '</a>';
      if (i >= 0 && i < index.length - 1) nav += '<a class="hx-btn" href="hero.html?id=' + esc(index[i + 1].id) + '">' + esc(index[i + 1].name) + ' →</a>';
    }
    sideEl.innerHTML =
      '<img class="hx-portrait" src="' + esc(portraitFor(version)) + '" alt="' + esc(hero.name) + '">'
      + '<div class="hx-version">' + versions.map(function (v) {
        return '<button type="button" data-version="' + v.key + '" class="' + (v.key === version ? 'active' : '') + '">' + esc(v.label) + '</button>';
      }).join('') + '</div>'
      + '<h1>' + esc(hero.name.toUpperCase()) + '</h1>'
      + (names ? '<div class="hx-names">' + esc(names) + '</div>' : '')
      + '<div class="hx-dates">Phát hành: ' + esc(fmtDate(hero.release))
      + (hero.awakened_date ? '<br>Thức tỉnh: ' + esc(fmtDate(hero.awakened_date)) : '') + '</div>'
      + '<span class="hx-badge type hx-faction">' + esc(hero.faction) + '</span>'
      + '<div class="hx-stats">'
      + '<div class="hx-stat"><small>PATK</small><b>' + esc(st.patk != null ? st.patk.toLocaleString('en-US') : '—') + '</b></div>'
      + '<div class="hx-stat"><small>HP</small><b>' + esc(st.hp != null ? st.hp.toLocaleString('en-US') : '—') + '</b></div>'
      + '<div class="hx-stat"><small>DEF</small><b>' + esc(st.def != null ? st.def.toLocaleString('en-US') : '—') + '</b></div>'
      + '<div class="hx-stat"><small>SPD</small><b>' + esc(st.spd != null ? st.spd : '—') + '</b></div>'
      + '</div>'
      + (pve.length ? '<div class="hx-usedin"><h4>Dùng trong PVE</h4><div class="hx-orb">' + usedHtml(pve) + '</div></div>' : '')
      + (pvp.length ? '<div class="hx-usedin"><h4>Dùng trong PVP</h4><div class="hx-orb">' + usedHtml(pvp) + '</div></div>' : '')
      + (nav ? '<div class="hx-usedin"><h4>Hero khác</h4><div style="display:flex;gap:8px;flex-wrap:wrap">' + nav + '</div></div>' : '');
    sideEl.querySelectorAll('[data-version]').forEach(function (b) {
      b.addEventListener('click', function () {
        version = b.getAttribute('data-version');
        renderAll();
      });
    });
  }

  /* ---------- MAIN tab ---------- */
  function skillCardHtml(sk) {
    var isPassive = /passive/i.test(sk.type || '');
    var isAwakened = sk.key === 'awakened' || /awaken/i.test(sk.type || '');
    var typeLabel = isAwakened && isPassive ? 'Awakened Passive' : (sk.type || '');
    var icon = skillIcon(sk);
    var iconHtml = icon
      ? '<img src="' + esc(icon) + '" alt="" loading="lazy">'
      : '<span style="font-size:26px;line-height:56px;text-align:center;width:56px;flex:none">' + (isPassive ? '🌀' : isAwakened ? '🌊' : sk.key === 'basic' ? '⚔️' : '💥') + '</span>';
    var cd = '';
    if (isAwakened) {
      cd = sk.gauge != null ? '<div class="hx-skill-cd">Awakening Gauge: ' + esc(sk.gauge) + '</div>' : '';
    } else if (sk.cd) {
      cd = '<div class="hx-skill-cd">⏱ Hồi chiêu: ' + esc(sk.cd) + 's</div>';
    } else if (!isPassive && sk.key !== 'basic') {
      cd = '<div class="hx-skill-cd">⏱ Hồi chiêu: –</div>';
    }
    var groups = (sk.effects || []).map(function (g, gi) {
      var lines = (sk.effects_vi && sk.effects_vi[gi]) || g.lines || [];
      return (g.target ? '<div class="hx-skill-target">' + esc(targetVi(g.target)) + '</div>' : '')
        + lines.map(function (l) { return '<p>' + richLine(l) + '</p>'; }).join('');
    }).join('');
    var tipByName = {};
    (sk.tips || []).forEach(function (t, ti) {
      var body = (sk.tips_vi && sk.tips_vi[ti] && sk.tips_vi[ti].body) || t.body || '';
      if (t.name) tipByName[t.name] = body;
    });
    var bubbles = (sk.bubbles || []).length
      ? '<div class="hx-tips">' + sk.bubbles.map(function (b) {
        var suffix = [b.variant, b.note].filter(Boolean).join(', ');
        var tip = tipByName[b.label] || '';
        return '<span class="hx-tip" title="' + esc(tip || b.label) + '">' + esc(b.label + (suffix ? ' (' + suffix + ')' : '')) + '</span>';
      }).join('') + '</div>' : '';
    /* Giải thích các hiệu ứng trong kỹ năng: "Tên EN - Tên VI: giải thích"
     * (giải thích lấy từ tip body của Atlas, đã dịch sang tiếng Việt;
     * hiệu ứng nào không có giải thích thì không liệt kê ở đây). */
    var fxItems = (sk.tips || []).filter(function (t) {
      var body = tipByName[t.name] || '';
      return body && body !== 'None';
    });
    var fxHtml = fxItems.length
      ? '<div class="hx-fxlist"><div class="hx-fx-title">Hiệu ứng</div>' + fxItems.map(function (t) {
        var vname = FX_VI[t.name] || '';
        var label = vname ? (t.name + ' - ' + vname) : t.name;
        return '<div class="hx-fx"><b>' + esc(label) + ':</b> ' + richLine(tipByName[t.name], true) + '</div>';
      }).join('') + '</div>' : '';
    var enhance = (sk.enhancement || []).length
      ? '<div class="hx-notes" style="background:#f2f7ff;border-color:#c8d8f2"><b>Nâng cấp kỹ năng</b>'
        + sk.enhancement.map(function (e, ei) {
          var effect = (sk.enhancement_vi && sk.enhancement_vi[ei] && sk.enhancement_vi[ei].effect) || e.effect;
          return '<p style="margin:6px 0 0">' + (e.target ? '<b>' + esc(targetVi(e.target)) + ':</b> ' : '') + richLine(effect) + '</p>';
        }).join('') + '</div>' : '';
    var txOrder = { T2: 0, T4: 1, T6: 2 };
    var tx = (sk.tx || []).slice().sort(function (a, b) { return (txOrder[a.tier] || 99) - (txOrder[b.tier] || 99); });
    var txHtml = tx.length
      ? '<div style="margin-top:8px">' + tx.map(function (t) {
        var idx = sk.tx.indexOf(t);
        var effect = (sk.tx_vi && sk.tx_vi[idx] && sk.tx_vi[idx].effect) || t.effect;
        /* Mốc T2 và T6 nổi bật: tag riêng + khung bao quanh nội dung.
         * T4 giữ dạng dòng thường. */
        if (t.tier === 'T2' || t.tier === 'T6') {
          return '<div class="hx-tx-box"><span class="hx-tx-tag">' + esc(t.tier) + '</span><span>' + richLine(effect) + '</span></div>';
        }
        return '<p style="font-size:12.5px;color:#946b25;margin:4px 0"><b>' + esc(t.tier) + '</b> ' + richLine(effect) + '</p>';
      }).join('') + '</div>' : '';
    return '<div class="hx-skill" id="skill-' + esc(sk.key) + '">' + iconHtml
      + '<div style="flex:1;min-width:0"><h4>' + esc(sk.name || 'Basic Attack') + '</h4>'
      + '<span class="hx-skill-type">' + esc(typeLabel) + '</span>' + cd
      + groups + bubbles + fxHtml + enhance + txHtml + '</div></div>';
  }

  function renderSkills(skills) {
    var out = '';
    var seen = {};
    skills.forEach(function (sk) {
      if (seen[sk.key]) return;
      seen[sk.key] = true;
      var after = skills.find(function (o) { return o.key === sk.key && o.converts; });
      if (after && !sk.converts) {
        out += '<div class="hx-cardbox" style="margin-bottom:10px"><b style="font-size:13px">⇄ Chuyển đổi kỹ năng — kỹ năng thay đổi sau khi biến hình</b>'
          + '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:start;margin-top:10px">'
          + '<div><small style="font-weight:800;color:#8b8578">TRƯỚC</small>' + skillCardHtml(sk) + '</div>'
          + '<div style="font-size:22px;padding-top:40px">→</div>'
          + '<div><small style="font-weight:800;color:#b3352c">SAU</small>' + skillCardHtml(after) + '</div>'
          + '</div></div>';
      } else if (!sk.converts) {
        out += skillCardHtml(sk);
      }
    });
    return out;
  }

  function renderMain() {
    var ov = hero.overview || {};
    var skills = skillsFor(version);
    var enh = enhanceFor(version);
    /* Tier List Grades: chỉ ảnh đại diện chế độ + điểm đánh giá (to, đậm,
     * nền tối + viền màu tier để nổi trên ảnh). Bỏ dòng role và "at T0". */
    var tiers = (hero.tiers || []).map(function (t) {
      var art = DASHBOARD_ART[t.mode] || 'arena';
      var color = TIER_COLORS[t.tier] || '#8b8578';
      return '<div class="hx-tier">'
        + '<img src="assets/ui/dashboard-' + esc(art) + '.webp" alt="" loading="lazy">'
        + '<span class="hx-tier-mode">' + esc(t.label) + '</span>'
        + '<span class="hx-tier-grade" style="color:' + color + ';border-color:' + color + '">' + esc(t.tier) + '</span></div>';
    }).join('');
    var enhHtml = enh.length ? '<div class="hx-enhance">' + enh.map(function (e, i) {
      var sk = skills.find(function (s) { return s.key === e.key; });
      var icon = sk && skillIcon(sk);
      return '<div class="hx-enhance-item"><span class="hx-num">' + (i + 1) + '</span>'
        + (icon ? '<img src="' + esc(icon) + '" alt="" loading="lazy">' : '')
        + '<b>' + esc(e.name) + '</b><span class="hx-enhance-tag">ENHANCE · ' + esc(REASON_LABEL[e.reason] || e.reason) + '</span></div>';
    }).join('') + '</div>' : '<p style="font-size:13.5px;color:#8b8578">Chưa có dữ liệu ưu tiên nâng skill.</p>';
    var lore = vi().lore || hero.lore || '';
    var bg = lore ? '<details class="hx-bgdetails"><summary>Cốt truyện</summary><div class="hx-bgbody">'
      + lore.split('\n').filter(function (l) { return l.trim(); }).map(function (l) { return '<p>' + esc(l.trim()) + '</p>'; }).join('') + '</div></details>' : '';
    mainEl.innerHTML =
      sectionTitle('Tổng quan hero')
      + '<div class="hx-cardbox"><p style="margin:0 0 12px;font-size:14px;line-height:1.65">' + esc(vi().overview_desc || ov.desc || 'Chưa có mô tả.') + '</p>'
      + '<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#8b8578;margin-bottom:6px">TAGS</div>'
      + '<div class="hx-chips">' + (hero.tags || []).map(function (t) { return '<span class="hx-chip">' + esc(t) + '</span>'; }).join('') + '</div>'
      + ((ov.effects || []).length ? '<div class="hx-chips" style="margin-top:8px">' + ov.effects.map(function (b) {
        var suffix = [b.variant, b.note].filter(Boolean).join(', ');
        return '<span class="hx-chip effect">' + esc(b.label + (suffix ? ' (' + suffix + ')' : '')) + '</span>';
      }).join('') + '</div>' : '')
      + '</div>'
      + (tiers ? sectionTitle('Xếp hạng theo chế độ') + '<div class="hx-tiergrid">' + tiers + '</div>' : '')
      + sectionTitle(hero.awakened_date ? (version === 'awk' ? 'Kỹ năng (Thức tỉnh)' : 'Kỹ năng (Trước thức tỉnh)') : 'Kỹ năng')
      + renderSkills(skills)
      + sectionTitle('Ưu tiên nâng kỹ năng') + enhHtml
      + bg;
  }

  /* ---------- BUILDS tab ---------- */
  function renderBuilds() {
    var builds = hero.builds || [];
    if (!builds.length) {
      mainEl.innerHTML = sectionTitle('Build đồ')
        + '<div class="hx-cardbox"><p style="margin:0">Chưa có hướng dẫn build cho hero này.</p></div>';
      return;
    }
    if (buildIdx >= builds.length) buildIdx = 0;
    var b = builds[buildIdx];
    var listHtml = '<div class="hx-build-list">' + builds.map(function (bb, i) {
      var modes = (bb.modes || []).map(function (m) { return MODE_LABELS[m] || m; }).join(', ');
      var nameVi = BUILD_VI[bb.name] || bb.name;
      return '<button type="button" data-build="' + i + '" class="' + (i === buildIdx ? 'active' : '') + '" title="' + esc(bb.name) + '">'
        + (bb.active ? '<span class="hx-best-tag">BEST</span>' : '') + esc(nameVi)
        + (modes ? '<span class="hx-build-modes">' + esc(modes) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
    var set = (b.gear.sets || [])[0] || {};
    var setImg = setIcon(set.name || '');
    /* Main stat: BEST (Chính) và ALT (Phụ) tách thành 2 hàng riêng.
     * Đồng bộ với popup: hiển thị hình minh họa thật của món đồ trong
     * set (ảnh 126px), không dùng icon chung. Mỗi hero có 2 slot cho vũ
     * khí và 2 slot cho giáp nên mỗi chỉ số ghi "× 2"; dòng Chính in đậm
     * (kể cả "× 2") để nổi bật so với dòng Phụ. */
    function mainStatHtml(label, pieceFile, arr) {
      var best = arr[0], alt = arr.slice(1);
      var row = '<div class="hx-mainstat hx-with-piece">'
        + (pieceFile ? '<img class="hx-piece" src="assets/gearpieces/' + esc(pieceFile) + '" alt="" loading="lazy">' : '')
        + '<div class="hx-ms-body"><small>' + esc(label) + '</small>'
        + '<div class="hx-ms-row"><span class="hx-ms-tag">Chính</span><span><b>' + esc(statLabel(best || '—')) + ' × 2</b></span></div>';
      if (alt.length) {
        row += '<div class="hx-ms-row alt"><span class="hx-ms-tag">Phụ</span><span>' + esc(alt.map(function (s) { return statLabel(s) + ' × 2'; }).join(' / ')) + '</span></div>';
      }
      return row + '</div></div>';
    }
    var subs = (b.substats || []).map(function (s) {
      var icon = STAT_ICONS[s];
      return '<li>' + (icon ? '<img src="assets/substats/' + esc(icon) + '" alt="" style="width:20px;height:20px;object-fit:contain">' : '') + esc(statLabel(s)) + '</li>';
    }).join('');
    /* Phụ kiện: mỗi option trình bày ngang — nhẫn chính + nhẫn tinh luyện
     * nằm cạnh nhau (kiểu Atlas), không xếp dọc như trước. */
    function accLabelVi(label) {
      if (!label) return 'OPTION';
      if (label === 'Best') return 'Tốt nhất';
      var m = /^Alt (\d+)$/.exec(label);
      if (m) return 'Thay thế ' + m[1];
      return label;
    }
    function accCard(a) {
      function side(info, label) {
        if (!info) return '<div class="hx-acc-side"><small>' + esc(label) + '</small><br><b>—</b></div>';
        return '<div class="hx-acc-side"><small>' + esc(label) + '</small><br><img src="assets/acc/' + esc(info.icon) + '" alt="" loading="lazy"><b>' + esc(info.label) + '</b><br><small>' + esc(info.value || '') + '</small></div>';
      }
      var sub = a.sub_info ? side(a.sub_info, 'NHẪN TINH LUYỆN')
        : (a.sub === 'Any CC' ? '<div class="hx-acc-side"><small>NHẪN TINH LUYỆN</small><br><b>Bất kỳ nhẫn CC nào</b></div>' : side(null, 'NHẪN TINH LUYỆN'));
      return '<div class="hx-acc"><div class="hx-acc-label">' + esc(accLabelVi(a.label)) + '</div>'
        + '<div class="hx-acc-pair">' + side(a.main_info, 'NHẪN CHÍNH') + '<span class="hx-acc-plus">+</span>' + sub + '</div></div>';
    }
    var accs = (b.acc || []).map(accCard).join('');
    var ded = hero.dedicated;
    var dedHtml = '';
    if (ded) {
      function deList(arr) {
        return '<ul>' + arr.map(function (x) {
          var n = typeof x === 'string' ? x : (x.name || '');
          var val = (typeof x === 'object' && x.value) || '';
          var icon = (typeof x === 'object' && x.icon) || STAT_ICONS[n];
          return '<li style="display:flex;gap:6px;align-items:center">'
            + (icon ? '<img src="assets/substats/' + esc(icon) + '" alt="" style="width:20px;height:20px;object-fit:contain;flex:none">' : '')
            + '<b style="min-width:0">' + esc(statLabel(n)) + '</b>'
            + (val ? '<b style="margin-left:auto;white-space:nowrap;flex:none">' + esc(val) + '</b>' : '') + '</li>';
        }).join('') + '</ul>';
      }
      var aStat = (ded.a && ded.a[0] && (typeof ded.a[0] === 'string' ? ded.a[0] : ded.a[0].name)) || '';
      var bStat = (ded.b && ded.b[0] && (typeof ded.b[0] === 'string' ? ded.b[0] : ded.b[0].name)) || '';
      var pick = b.ded_stat || '';
      var aOn = pick && aStat === pick;
      var bOn = pick && bStat === pick;
      var second = ded.second === 'yes'
        ? '<span class="hx-pill yes">YES</span>'
        : ded.second === 'no' ? '<span class="hx-pill no">NO</span>'
        : ded.second === 'optional' ? '<span class="hx-pill" style="background:#fdf6e3;color:#946b25">OPTIONAL</span>'
        : esc(ded.second || '');
      var why = pick ? ((vi().dedicated_why && vi().dedicated_why[pick]) || (ded.why_by_stat && ded.why_by_stat[pick]) || '') : '';
      var story = vi().dedicated_story || ded.story || '';
      /* Trang bị riêng: bỏ tiêu đề cột — khung màu hồng (class this) đặt
       * đúng vào cột mà build này chọn, đã đủ ám chỉ đó là cách build
       * chính; cột còn lại mờ đi. */
      dedHtml = '<div class="hx-cardbox hx-dedicated">' + sectionTitle('Trang bị riêng')
        + '<div class="hx-de-head">'
        + (ded.icon ? '<img src="assets/dedicated/' + esc(ded.icon) + '" alt="" loading="lazy">' : '')
        + '<div><b style="font-size:16px">' + esc(ded.name) + '</b><br><span style="font-size:13.5px;color:#6b6558">Chỉ số chính: ' + esc(ded.main_stat) + '</span></div></div>'
        + '<div class="hx-de-cols"><div class="hx-de-col' + (aOn ? ' this' : '') + '" style="' + (aOn ? '' : 'opacity:.55') + '">' + deList(ded.a || []) + '</div>'
        + '<div class="hx-de-col' + (bOn ? ' this' : '') + '" style="' + (bOn ? '' : 'opacity:.55') + '">' + deList(ded.b || []) + '</div></div>'
        + '<p style="font-size:13.5px;margin:14px 0 4px"><b>Nên build trang bị riêng thứ 2 ngay?</b> ' + second + '</p>'
        + (pick ? '<p style="font-size:13.5px;margin:4px 0 0"><b>Vì sao ' + esc(statLabel(pick)) + '?</b> ' + esc(why) + '</p>' : '')
        + (story ? '<details class="hx-bgdetails" style="margin-top:12px"><summary>Cốt truyện</summary><div class="hx-bgbody"><p>' + esc(story) + '</p></div></details>' : '')
        + '</div>';
    }
    var buildNote = (vi().builds && vi().builds[buildIdx] && vi().builds[buildIdx].note) || b.note || '';
    var gearNotes = (vi().builds && vi().builds[buildIdx] && vi().builds[buildIdx].gear_notes) || b.gear_notes || '';
    mainEl.innerHTML =
      '<div class="hx-builds">' + listHtml
      + '<div class="hx-build-main">'
      + (buildNote ? '<p style="font-size:14px;line-height:1.65;margin:0 0 16px">' + esc(buildNote) + '</p>' : '')
      + sectionTitle('Trang bị')
      + '<div class="hx-cardbox"><div class="hx-gear-set">'
      + (setImg ? '<img src="assets/seticons/' + esc(setImg) + '" alt="" loading="lazy">' : '')
      + '<div><b>' + esc(set.name || '—') + '</b>'
      + (set.effect ? '<p>' + esc(set.effect.replace('4pc', 'Set 4')) + '</p>' : '') + '</div></div>'
      + '<div class="hx-mainstats">'
      + mainStatHtml('Chỉ số chính Vũ khí', pieceImg(set.name || '', 'weapon', hero.type), b.gear.weapon || [])
      + mainStatHtml('Chỉ số chính Giáp', pieceImg(set.name || '', 'armor', hero.type), b.gear.armor || [])
      + '</div>'
      + (subs ? '<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#8b8578;margin:14px 0 6px">ƯU TIÊN DÒNG PHỤ</div><ol class="hx-substats">' + subs + '</ol>' : '')
      + (gearNotes ? '<div class="hx-notes"><b style="display:block;font-size:11px;letter-spacing:.08em;color:#946b25;margin-bottom:4px">GHI CHÚ</b>' + esc(gearNotes) + '</div>' : '')
      + '</div>'
      + (accs ? sectionTitle('Phụ kiện') + '<div class="hx-acc-grid">' + accs + '</div>' : '')
      + '</div></div>'
      + dedHtml;
    mainEl.querySelectorAll('[data-build]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        buildIdx = parseInt(btn.getAttribute('data-build'), 10);
        renderBuilds();
      });
    });
  }

  /* ---------- tabs + boot ---------- */
  /* Giữ nguyên vị trí cuộn khi đổi tab. Cơ chế 2 lớp:
   * 1) Đổi tab tại chỗ: lưu scrollY rồi khôi phục ngay sau khi render.
   * 2) Nếu trang tải lại vì bất kỳ lý do gì (cache cũ, điều hướng):
   *    vị trí cuộn được giữ trong sessionStorage theo hero + tab và
   *    khôi phục sau khi trang render xong. */
  function scrollKey(t) { return 'hx-scroll:' + heroId + ':' + t; }
  function saveScroll(t, y) {
    try { sessionStorage.setItem(scrollKey(t), String(y)); } catch (e) {}
  }
  function restoreSavedScroll(t) {
    var raw = null;
    try { raw = sessionStorage.getItem(scrollKey(t)); sessionStorage.removeItem(scrollKey(t)); } catch (e) {}
    if (raw == null) return;
    var y = parseInt(raw, 10);
    if (!isNaN(y) && y > 0) requestAnimationFrame(function () { window.scrollTo(0, y); });
  }

  function setTab(t) {
    tab = t;
    var u = new URL(location.href);
    u.searchParams.set('tab', t);
    history.replaceState(null, '', u.toString());
    tabMainBtn.classList.toggle('active', t === 'main');
    tabBuildsBtn.classList.toggle('active', t === 'builds');
    var y = window.scrollY || window.pageYOffset || 0;
    saveScroll(t, y);
    if (t === 'main') renderMain(); else renderBuilds();
    requestAnimationFrame(function () { window.scrollTo(0, y); });
  }

  function renderAll() {
    document.title = hero.name + ' — Heroes | 7K RBVN';
    renderSide();
    if (tab === 'main') renderMain(); else renderBuilds();
    restoreSavedScroll(tab);
  }

  tabMainBtn.addEventListener('click', function () { setTab('main'); });
  tabBuildsBtn.addEventListener('click', function () { setTab('builds'); });

  if (!heroId) {
    mainEl.innerHTML = '<div class="hx-cardbox"><p style="margin:0">Chưa chọn hero. <a href="heroes.html">Về danh sách Heroes →</a></p></div>';
  } else {
    fetch('data/heroes-index.json').then(function (r) { return r.json(); }).then(function (data) {
      index = data;
      return fetch('data/heroes/' + encodeURIComponent(heroId) + '.json');
    }).then(function (r) { if (!r.ok) throw new Error('not found'); return r.json(); }).then(function (data) {
      hero = data;
      version = hero.awakened_date ? 'awk' : 's6';
      tabMainBtn.classList.toggle('active', tab === 'main');
      tabBuildsBtn.classList.toggle('active', tab === 'builds');
      renderAll();
    }).catch(function () {
      mainEl.innerHTML = '<div class="hx-cardbox"><p style="margin:0">Không tìm thấy hero này. <a href="heroes.html">Về danh sách Heroes →</a></p></div>';
    });
  }
})();
