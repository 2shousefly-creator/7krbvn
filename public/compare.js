/* So sánh Hero (so-sanh.html): chọn 2 hero, đặt cạnh nhau theo từng khối
 * kiểu "At a glance" — mỗi phần so sánh là một khối riêng trong thẻ trắng:
 * tiêu đề, ghi chú so sánh ("Eve cao hơn 15% so với Judas", "bằng nhau",
 * "chỉ Eve có"), 2 giá trị đặt cạnh nhau với thanh tỉ lệ bên dưới
 * (rộng theo giá trị / giá trị lớn nhất). Bên thắng tô đậm màu xanh.
 * Ghi chú so sánh luôn nêu rõ tên người thắng trước rồi mới tới % và
 * tên người thua. Kỹ năng hiển thị ĐẦY ĐỦ nội dung tiếng Việt ngay trong
 * trang (tên, hồi chiêu/thanh thức tỉnh, toàn văn hiệu ứng, giải thích
 * hiệu ứng), không cần mở trang hero. Kỹ năng chuyển đổi (Dellons, Jupy,
 * Sun Wukong) hiển thị cả 2 dạng TRƯỚC/SAU như trên trang hero.
 * Build chính hiển thị ĐẦY ĐỦ chi tiết của build Best (đang active) như
 * phần Build đồ của trang hero / popup: set + ảnh món đồ, chỉ số chính
 * (Chính/Phụ), 4 dòng phụ ưu tiên kèm icon, cặp phụ kiện Best, ghi chú
 * (tiếng Việt khi có), trang bị riêng theo cột ded_stat của build.
 * Dữ liệu local: data/heroes-index.json + data/heroes/<id>.json, tải bằng fetch.
 * Link chia sẻ: so-sanh.html?a=<id>&b=<id>.
 * Định dạng hiệu ứng/mục tiêu dùng window.SkillCard (skill-card.js) khi có,
 * nếu không thì dùng bản dự phòng tối giản. Hero chưa thức tỉnh thì phần
 * chỉ số Thức tỉnh để trống kèm ghi chú — không tự điền số.
 */
(function () {
  'use strict';

  var INDEX_URL = 'data/heroes-index.json';
  var MODE_ORDER = ['arena', 'total-war', 'guild-war', 'advent-expedition', 'raid', 'castle-rush', 'sudden-raid', 'power-up-dungeon-roles', 'farming'];
  var MODE_LABELS = { 'arena': 'Arena', 'total-war': 'Total War', 'guild-war': 'Guild War', 'advent-expedition': 'Advent Expedition', 'raid': 'Raid', 'castle-rush': 'Castle Rush', 'sudden-raid': 'Sudden Raid', 'power-up-dungeon-roles': 'Power Up Dungeon', 'farming': 'Farming' };
  var SKILL_TYPE_VI = { 'Basic Attack': 'Tấn công thường', 'Skill 1': 'Kỹ năng 1', 'Skill 2': 'Kỹ năng 2', 'Passive': 'Nội tại', 'Active Skill': 'Kỹ năng chủ động', 'Awakened Skill': 'Thức tỉnh' };
  var SKILL_TYPE_ORDER = ['Basic Attack', 'Skill 1', 'Skill 2', 'Passive', 'Active Skill', 'Awakened Skill'];
  var STAT_DEFS = [
    { key: 'atk', label: 'Tấn công' },
    { key: 'hp', label: 'HP' },
    { key: 'def', label: 'DEF' },
    { key: 'spd', label: 'SPD' }
  ];

  /* Nhãn / icon chỉ số và ảnh set đồ — sao y hero-popup.js để phần build
   * trong trang so sánh dùng đúng asset như popup và trang hero. */
  var STAT_LABELS = { 'AllATK%': 'All Attack %', 'AllATK': 'All Attack', 'Block': 'Block Rate', 'Crit': 'Crit Rate', 'CritDMG': 'Crit Damage', 'Crush': 'Crush', 'DEF%': 'DEF%', 'DEF': 'DEF', 'DMGAmp': 'Damage Amplification', 'DmgTakenReduce': 'Damage Taken Reduction', 'EffectHit': 'Effect Hit Rate', 'EffectRes': 'Effect Resistance', 'HP%': 'HP%', 'HP': 'HP', 'MATK%': 'Magic Attack %', 'MATK': 'Magic Attack', 'PATK%': 'Physical Attack %', 'PATK': 'Physical Attack', 'Rejuvenate': 'Rejuvenate', 'Resilience': 'Resilience', 'SkillAccel': 'Skill Acceleration', 'Speed': 'Speed', 'WeaknessHit': 'Weakness Hit Chance' };
  var STAT_ICONS = { 'AllATK%': 'AllATKpct.webp', 'AllATK': 'AllATK.webp', 'Block': 'Block.webp', 'Crit': 'Crit.webp', 'CritDMG': 'CritDMG.webp', 'Crush': 'Crush.webp', 'DEF%': 'DEFpct.webp', 'DEF': 'DEF.webp', 'DMGAmp': 'DMGAmp.webp', 'DmgTakenReduce': 'DmgTakenReduce.webp', 'EffectHit': 'EffectHit.webp', 'EffectRes': 'EffectRes.webp', 'HP%': 'HPpct.webp', 'HP': 'HP.webp', 'MATK%': 'MATKpct.webp', 'MATK': 'MATK.webp', 'PATK%': 'PATKpct.webp', 'PATK': 'PATK.webp', 'Rejuvenate': 'Rejuvenate.webp', 'Resilience': 'Resilience.webp', 'SkillAccel': 'SkillAccel.webp', 'Speed': 'Speed.webp', 'WeaknessHit': 'WeaknessHit.webp' };
  var SET_ICONS = { 'Bounty Tracker': 'Bounty.webp', 'Spellweaver': 'Spellweaver.webp', 'Avenger': 'Avenger.webp', 'Gatekeeper': 'Gatekeeper.webp', 'Guardian': 'Guardian.webp', 'Orchestrator': 'Orchestrator.webp', 'Paladin': 'Paladin.webp', 'Assassin': 'Assassin.webp', 'Vanguard': 'Vanguard.webp' };
  /* Tên build tiếng Việt — SAO Y bản trong hero-detail.js (BUILD_VI).
   * Hai bản phải giống hệt nhau; tests/compare.test.cjs có test đồng bộ
   * (thêm/sửa tên build thì sửa cả hai chỗ). Tên nào chưa có trong map
   * thì buildNameVi() trả về tên gốc tiếng Anh. */
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
  function buildNameVi(name) { return BUILD_VI[name] || name; }
  /* Gear piece art: [boss abbr, set stem]. Weapon uses variant 2 for
   * Magic heroes, 1 otherwise; armor always variant 3. */
  var SET_PIECE = { 'Bounty Tracker': ['DG', 'Bounty'], 'Paladin': ['DG', 'Paladin'], 'Vanguard': ['DG', 'Vanguard'], 'Assassin': ['NMW', 'Assassin'], 'Gatekeeper': ['NMW', 'Gatekeeper'], 'Guardian': ['NMW', 'Guardian'], 'Avenger': ['ID', 'Avenger'], 'Orchestrator': ['ID', 'Orchestrator'], 'Spellweaver': ['ID', 'Spell'] };
  function pieceImg(setName, slot, heroType) {
    var p = SET_PIECE[setName];
    if (!p) return null;
    var variant = slot === 'armor' ? 3 : (heroType === 'Magic' ? 2 : 1);
    return p[0] + '-' + p[1] + variant + '.webp';
  }
  function statLabel(code) { return STAT_LABELS[code] || code; }
  function setIcon(setName) {
    return SET_ICONS[setName] || (setName ? setName.replace(/\s+/g, '') + '.webp' : null);
  }

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* Gõ không dấu vẫn khớp tên: bỏ dấu tiếng Việt rồi so sánh chữ thường. */
  function norm(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  function parseCompareParams(search) {
    var q = String(search || '').replace(/^\?/, '');
    var out = { a: null, b: null };
    if (!q) return out;
    var params = new URLSearchParams(q);
    var a = params.get('a'), b = params.get('b');
    if (a) out.a = a;
    if (b) out.b = b;
    return out;
  }

  function swapSelection(sel) {
    return { a: sel.b || null, b: sel.a || null };
  }

  /* Hạng cuối ở PvP hiển thị là PHẾ (key dữ liệu vẫn giữ "NOT USED"). */
  function tierLabel(tier) {
    return tier === 'NOT USED' ? 'PHẾ' : tier;
  }

  /* Tấn công dùng PATK (vật lý) hoặc MATK (phép) tùy hero. */
  function attackStat(stats) {
    if (!stats) return null;
    if (stats.patk != null) return { key: 'PATK', value: stats.patk };
    if (stats.matk != null) return { key: 'MATK', value: stats.matk };
    return null;
  }

  function statValue(hero, version, key) {
    if (!hero || !hero.stats) return null;
    var st = hero.stats[version];
    if (!st) return null;
    if (key === 'atk') {
      var a = attackStat(st);
      return a ? a.value : null;
    }
    return st[key] == null ? null : st[key];
  }

  /* 'a' / 'b' thắng, 'tie' hòa, null khi thiếu số để so. */
  function winnerFor(a, b) {
    if (a == null || b == null) return null;
    if (a > b) return 'a';
    if (b > a) return 'b';
    return 'tie';
  }

  /* Số kiểu Việt Nam: 1500 -> "1.500". */
  function fmtNum(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /* Rộng thanh tỉ lệ (0-100, 1 chữ số thập phân): giá trị / giá trị lớn nhất. */
  function barWidth(value, max) {
    if (value == null || max == null || max <= 0 || value <= 0) return 0;
    var w = Math.round(value / max * 1000) / 10;
    return w > 100 ? 100 : w;
  }

  /* Ghi chú so sánh cho một khối chỉ số. Trả về { text, winner }.
   * opts.atkA/atkB: loại tấn công của 2 bên (PATK/MATK) — khác loại thì
   * không so % vì không cùng đơn vị. opts.suffix: cụm bổ sung khi chỉ
   * một bên có số (vd: "chỉ số Thức tỉnh"). */
  function statNote(va, vb, nameA, nameB, opts) {
    opts = opts || {};
    if (va == null && vb == null) return { text: null, winner: null };
    if (va == null) return { text: 'chỉ ' + nameB + ' có' + (opts.suffix ? ' ' + opts.suffix : ''), winner: null };
    if (vb == null) return { text: 'chỉ ' + nameA + ' có' + (opts.suffix ? ' ' + opts.suffix : ''), winner: null };
    if (opts.atkA && opts.atkB && opts.atkA !== opts.atkB) {
      return { text: nameA + ' dùng ' + opts.atkA + ', ' + nameB + ' dùng ' + opts.atkB, winner: null };
    }
    if (va === vb) return { text: 'bằng nhau', winner: 'tie' };
    var w = va > vb ? 'a' : 'b';
    var hi = Math.max(va, vb), lo = Math.min(va, vb);
    var pct = Math.round((hi - lo) / lo * 100);
    var winnerName = w === 'a' ? nameA : nameB;
    var loser = w === 'a' ? nameB : nameA;
    if (pct === 0) return { text: winnerName + ' cao hơn không đáng kể so với ' + loser, winner: w };
    return { text: winnerName + ' cao hơn ' + pct + '% so với ' + loser, winner: w };
  }

  /* Chỉ liệt kê TÊN kỹ năng theo loại, không bê toàn văn skill.
   * Hero thức tỉnh dùng bộ kỹ năng thức tỉnh (có thêm kỹ năng Thức tỉnh),
   * hero thường dùng bộ 6★. Kỹ năng cơ bản không có tên riêng trong dữ liệu
   * nên hiển thị bằng nhãn loại của nó. Kỹ năng chuyển đổi có 2 bản ghi
   * cùng key — hàm này giữ bản SAU (ghi đè bản TRƯỚC) như trước đây. */
  function skillList(hero) {
    var kit = (hero.skills && hero.skills.awk && hero.skills.awk.length)
      ? hero.skills.awk
      : ((hero.skills && hero.skills.s6) || []);
    return kit.map(function (s) {
      return {
        type: s.type,
        label: SKILL_TYPE_VI[s.type] || s.type,
        name: (s.name && s.name.trim()) ? s.name : 'Tấn công thường'
      };
    });
  }

  /* Toàn bộ chi tiết kỹ năng của một hero, theo từng loại, để hiển thị
   * đầy đủ trong trang so sánh. Mỗi loại có 1 hoặc 2 biến thể: kỹ năng
   * chuyển đổi (Dellons, Jupy, Sun Wukong) có cả TRƯỚC và SAU.
   * Nhóm hiệu ứng: duyệt theo số nhóm lớn nhất của effects / effects_vi —
   * nhóm nào thiếu bản Việt thì dùng tạm dòng tiếng Anh, không bỏ nội dung.
   * Giải thích hiệu ứng (tips): dùng bản Việt khi có, không có thì dùng
   * bản tiếng Anh (chỉ 1 skill trên toàn web rơi vào trường hợp này). */
  function skillVariant(sk, stage) {
    var effects = sk.effects || [];
    var vi = sk.effects_vi || [];
    var n = Math.max(effects.length, vi.length);
    var groups = [];
    for (var i = 0; i < n; i++) {
      var g = effects[i] || null;
      var lines = vi[i] || (g ? g.lines : []) || [];
      groups.push({ target: g ? g.target : '', lines: lines, lang: vi[i] ? 'vi' : 'en' });
    }
    var tips = (sk.tips || []).map(function (t, i) {
      var viBody = sk.tips_vi && sk.tips_vi[i] && sk.tips_vi[i].body;
      return { name: t.name, body: viBody || t.body || '', lang: viBody ? 'vi' : 'en' };
    });
    return {
      key: sk.key,
      name: (sk.name && sk.name.trim()) ? sk.name : 'Tấn công thường',
      cd: sk.cd, gauge: sk.gauge, icon: sk.icon || null,
      stage: stage || null, groups: groups, tips: tips
    };
  }

  function skillDetail(hero) {
    var kit = (hero.skills && hero.skills.awk && hero.skills.awk.length)
      ? hero.skills.awk
      : ((hero.skills && hero.skills.s6) || []);
    var out = [];
    SKILL_TYPE_ORDER.forEach(function (type) {
      var base = null, after = null;
      kit.forEach(function (s) {
        if (s.type !== type) return;
        if (s.converts) after = s;
        else if (!base) base = s;
      });
      if (!base && !after) return;
      var pair = !!(base && after);
      var variants = [];
      if (base) variants.push(skillVariant(base, pair ? 'TRƯỚC' : null));
      if (after) variants.push(skillVariant(after, pair ? 'SAU' : null));
      out.push({ type: type, label: SKILL_TYPE_VI[type] || type, converts: pair, variants: variants });
    });
    return out;
  }

  function mainBuild(hero) {
    var builds = (hero && hero.builds) || [];
    for (var i = 0; i < builds.length; i++) {
      if (builds[i].active) return builds[i];
    }
    return builds[0] || null;
  }

  /* Gộp các chế độ có ở 1 trong 2 hero, theo thứ tự cố định. */
  function tierRows(heroA, heroB) {
    var byMode = {};
    [heroA, heroB].forEach(function (hero, i) {
      ((hero && hero.tiers) || []).forEach(function (t) {
        if (!byMode[t.mode]) byMode[t.mode] = { mode: t.mode, label: t.label || MODE_LABELS[t.mode] || t.mode, a: null, b: null };
        byMode[t.mode][i === 0 ? 'a' : 'b'] = { tier: t.tier, tx: t.tx || '' };
      });
    });
    var rows = Object.keys(byMode).map(function (m) { return byMode[m]; });
    rows.sort(function (x, y) {
      var ix = MODE_ORDER.indexOf(x.mode), iy = MODE_ORDER.indexOf(y.mode);
      return (ix === -1 ? 99 : ix) - (iy === -1 ? 99 : iy);
    });
    return rows;
  }

  /* Dòng trang bị riêng theo cột build chọn (ded_stat): chỉ hiện cột khớp
   * với ded_stat của build chính; không khớp / không có ded_stat thì hiện
   * cả 2 cột (như trước). Gộp các ô giống nhau liên tiếp: 4 ô Crush +12%
   * -> một dòng "Crush +12% ×4" kèm icon của chỉ số đó. */
  function dedicatedGroups(ded, dedStat) {
    var cols = ['a', 'b'];
    if (dedStat) {
      var firstOf = function (side) {
        var arr = ded[side] || [];
        if (!arr.length) return '';
        return typeof arr[0] === 'string' ? arr[0] : (arr[0].name || '');
      };
      if (firstOf('a') === dedStat) cols = ['a'];
      else if (firstOf('b') === dedStat) cols = ['b'];
    }
    var out = [];
    cols.forEach(function (side) {
      var arr = ded[side] || [];
      var i = 0;
      while (i < arr.length) {
        var x = arr[i];
        var name = typeof x === 'string' ? x : (x.name || '');
        var value = (typeof x === 'object' && x.value) || '';
        var icon = (typeof x === 'object' && x.icon) || STAT_ICONS[name] || '';
        var j = i;
        while (j < arr.length) {
          var y = arr[j];
          var yn = typeof y === 'string' ? y : (y.name || '');
          var yv = (typeof y === 'object' && y.value) || '';
          if (yn !== name || yv !== value) break;
          j++;
        }
        out.push({ name: name, value: value, count: j - i, icon: icon });
        i = j;
      }
    });
    return out;
  }

  function dedicatedLines(ded, dedStat) {
    return dedicatedGroups(ded, dedStat).map(function (g) {
      return g.name + ' ' + g.value + (g.count > 1 ? ' ×' + g.count : '');
    });
  }

  /* ---- Định dạng hiệu ứng: dùng SkillCard khi có, bản dự phòng khi không ---- */
  var FALLBACK_FMT = {
    targetVi: function (t) { return t; },
    richLine: function (raw) {
      var s = escHtml(raw == null ? '' : raw);
      return s.replace(/(\d+(?:\.\d+)?%)/g, '<b>$1</b>');
    }
  };
  function getFmt(provided) {
    if (provided && provided.targetVi && provided.richLine) return provided;
    if (typeof window !== 'undefined' && window.SkillCard) return window.SkillCard;
    return FALLBACK_FMT;
  }

  /* ---- Các khối hiển thị (hàm thuần, trả về chuỗi HTML, test được ở Node) ---- */
  function legendHtml(heroA, heroB, portraitFor) {
    function item(hero, side) {
      if (!hero) return '<span class="cp-legend-item cp-' + side + '"><i class="cp-dot"></i><b>Chưa chọn hero</b></span>';
      var p = portraitFor ? portraitFor(hero) : ('assets/hero-' + hero.id + '.webp');
      return '<span class="cp-legend-item cp-' + side + '"><i class="cp-dot"></i><img src="' + escHtml(p) + '" alt=""><b>' + escHtml(hero.name) + '</b></span>';
    }
    return '<div class="cp-legend">' + item(heroA, 'a') + item(heroB, 'b') + '</div>';
  }

  function statValHtml(hero, value, max, isWin, side) {
    var name = hero ? hero.name : 'Chưa chọn hero';
    if (value == null) {
      return '<div class="cp-val cp-' + side + '"><div class="cp-val-name">' + escHtml(name) + '</div><div class="cp-num cp-missing">—</div></div>';
    }
    return '<div class="cp-val cp-' + side + '"><div class="cp-val-name">' + escHtml(name) + '</div>'
      + '<div class="cp-num' + (isWin ? ' cp-win' : '') + '">' + escHtml(fmtNum(value)) + '</div>'
      + '<div class="cp-bar"><i style="width:' + barWidth(value, max) + '%"></i></div></div>';
  }

  function statBlockHtml(def, heroA, heroB, version) {
    var va = heroA ? statValue(heroA, version, def.key) : null;
    var vb = heroB ? statValue(heroB, version, def.key) : null;
    /* Loại tấn công (PATK/MATK) chỉ liên quan tới khối Tấn công. Các khối
     * HP/DEF/SPD phải so % bình thường — truyền atkA/atkB cho mọi khối
     * làm ghi chú "X dùng PATK, Y dùng MATK" lọt xuống cả HP lẫn DEF. */
    var ka = def.key === 'atk' ? (heroA ? attackStat(heroA.stats && heroA.stats[version]) : null) : null;
    var kb = def.key === 'atk' ? (heroB ? attackStat(heroB.stats && heroB.stats[version]) : null) : null;
    var label = def.label;
    if (def.key === 'atk') {
      if (ka && kb && ka.key === kb.key) label += ' (' + ka.key + ')';
      else if (ka || kb) label += ' (PATK/MATK)';
    }
    var note = (heroA && heroB) ? statNote(va, vb, heroA.name, heroB.name,
      { atkA: ka && ka.key, atkB: kb && kb.key, suffix: version === 'awk' ? 'chỉ số Thức tỉnh' : '' })
      : { text: null, winner: null };
    var max = Math.max(va || 0, vb || 0);
    var html = '<div class="cp-block"><div class="cp-block-title">' + escHtml(label) + '</div>';
    if (note.text) html += '<div class="cp-block-note">' + escHtml(note.text) + '</div>';
    html += '<div class="cp-vals">';
    html += statValHtml(heroA, va, max, note.winner === 'a', 'a');
    html += statValHtml(heroB, vb, max, note.winner === 'b', 'b');
    return html + '</div></div>';
  }

  function skillVariantHtml(v, fmt) {
    var f = getFmt(fmt);
    var html = '<div class="cp-skill-var">';
    if (v.stage) html += '<div class="cp-convert-tag cp-convert-' + (v.stage === 'SAU' ? 'sau' : 'truoc') + '">' + v.stage + '</div>';
    html += '<div class="cp-skill-head">';
    if (v.icon) html += '<img src="assets/skills-raw/' + escHtml(v.icon) + '" alt="" loading="lazy">';
    html += '<div><b>' + escHtml(v.name) + '</b>';
    if (v.gauge != null) html += '<span class="cp-cd">Awakening Gauge: ' + escHtml(v.gauge) + '</span>';
    else if (v.cd != null) html += '<span class="cp-cd">⏱ Hồi chiêu: ' + escHtml(v.cd) + 's</span>';
    html += '</div></div>';
    v.groups.forEach(function (g) {
      if (g.target) html += '<div class="hx-skill-target">' + escHtml(f.targetVi(g.target)) + '</div>';
      g.lines.forEach(function (l) { html += '<p>' + f.richLine(l) + '</p>'; });
    });
    var tips = (v.tips || []).filter(function (t) { return t.body && t.body !== 'None'; });
    if (tips.length) {
      html += '<div class="cp-fx"><div class="cp-fx-title">Hiệu ứng</div>' + tips.map(function (t) {
        return '<div class="cp-fx-item"><b>' + escHtml(t.name) + ':</b> ' + f.richLine(t.body, true) + '</div>';
      }).join('') + '</div>';
    }
    return html + '</div>';
  }

  function skillBlockHtml(entry, skillA, skillB, fmt) {
    var html = '<div class="cp-block"><div class="cp-block-title">' + escHtml(entry.label) + '</div><div class="cp-skill-cols">';
    html += '<div class="cp-skill cp-a">' + (skillA
      ? '<div class="cp-col-name">' + escHtml(skillA.heroName) + '</div>' + skillA.variants.map(function (v) { return skillVariantHtml(v, fmt); }).join('')
      : '<div class="cp-skill-missing">—</div><p class="cp-sub">Không có kỹ năng này.</p>') + '</div>';
    html += '<div class="cp-skill cp-b">' + (skillB
      ? '<div class="cp-col-name">' + escHtml(skillB.heroName) + '</div>' + skillB.variants.map(function (v) { return skillVariantHtml(v, fmt); }).join('')
      : '<div class="cp-skill-missing">—</div><p class="cp-sub">Không có kỹ năng này.</p>') + '</div>';
    return html + '</div></div>';
  }

  function findSkillByType(details, type) {
    for (var i = 0; i < details.length; i++) if (details[i].type === type) return details[i];
    return null;
  }

  function rowHtml(label, cellA, cellB) {
    return '<div class="cp-row"><span class="cp-row-label">' + escHtml(label) + '</span>'
      + '<span class="cp-cell cp-a">' + cellA + '</span>'
      + '<span class="cp-cell cp-b">' + cellB + '</span></div>';
  }

  function infoRowsHtml(heroA, heroB) {
    function val(hero, field) {
      if (!hero) return '—';
      return hero[field] ? escHtml(hero[field]) : '—';
    }
    return rowHtml('Độ hiếm', val(heroA, 'rarity'), val(heroB, 'rarity'))
      + rowHtml('Vai trò', val(heroA, 'type'), val(heroB, 'type'))
      + rowHtml('Phe', val(heroA, 'faction'), val(heroB, 'faction'));
  }

  function tierRowsHtml(heroA, heroB) {
    return tierRows(heroA, heroB).map(function (row) {
      function cell(entry) {
        if (!entry) return '—';
        var cls = entry.tier === 'NOT USED' ? 'cp-tier cp-tier-phe' : 'cp-tier';
        return '<span class="' + cls + '">' + escHtml(tierLabel(entry.tier)) + '</span>'
          + (entry.tx ? ' <span class="cp-tx">' + escHtml(entry.tx) + '</span>' : '');
      }
      return rowHtml(row.label, cell(row.a), cell(row.b));
    }).join('');
  }

  /* Vị trí của build đang active trong mảng builds (để tra ghi chú tiếng
   * Việt trong hero.vi.builds, vốn song song theo chỉ số với builds). */
  function activeBuildIndex(hero) {
    var builds = (hero && hero.builds) || [];
    for (var i = 0; i < builds.length; i++) if (builds[i].active) return i;
    return 0;
  }

  /* Ghi chú build: bản tiếng Việt trong hero.vi.builds nếu có, không thì
   * bản tiếng Anh trong build.gear_notes — không tự dịch, không bịa. */
  function gearNoteFor(hero, build) {
    var idx = activeBuildIndex(hero);
    var viNote = hero.vi && hero.vi.builds && hero.vi.builds[idx] && hero.vi.builds[idx].gear_notes;
    return viNote || build.gear_notes || '';
  }

  /* Chỉ số chính của 1 món đồ: ảnh thật của món đồ trong set + dòng Chính
   * (chỉ số tốt nhất × 2, in đậm) và dòng Phụ (các chỉ số còn lại × 2).
   * Dòng trống thì ẩn hẳn. Y hệt phần Build đồ của trang hero. */
  function mainStatHtml(label, pieceFile, arr) {
    if (!arr || !arr.length) return '';
    var best = arr[0], alt = arr.slice(1);
    var row = '<div class="hx-mainstat hx-with-piece">'
      + (pieceFile ? '<img class="hx-piece" src="assets/gearpieces/' + escHtml(pieceFile) + '" alt="" loading="lazy">' : '')
      + '<div class="hx-ms-body"><small>' + escHtml(label) + '</small>'
      + '<div class="hx-ms-row"><span class="hx-ms-tag">Chính</span><span><b>' + escHtml(statLabel(best || '—')) + ' × 2</b></span></div>';
    if (alt.length) {
      row += '<div class="hx-ms-row alt"><span class="hx-ms-tag">Phụ</span><span>' + escHtml(alt.map(function (s) { return statLabel(s) + ' × 2'; }).join(' / ')) + '</span></div>';
    }
    return row + '</div></div>';
  }

  /* Phụ kiện: cặp nhẫn Best — nhẫn chính + nhẫn tinh luyện, kèm icon,
   * tên và giá trị từng nhẫn. Nhẫn tinh luyện là "Any CC" thì ghi rõ
   * "Bất kỳ nhẫn CC nào" như trong popup. */
  function accHtml(acc) {
    function side(info, label) {
      if (!info) return '<div class="hx-acc-side"><small>' + escHtml(label) + '</small><br><b>—</b></div>';
      return '<div class="hx-acc-side"><small>' + escHtml(label) + '</small><br>'
        + (info.icon ? '<img src="assets/acc/' + escHtml(info.icon) + '" alt="" loading="lazy">' : '')
        + '<b>' + escHtml(info.label || '') + '</b><br><small>' + escHtml(info.value || '') + '</small></div>';
    }
    var sub = acc.sub_info ? side(acc.sub_info, 'NHẪN TINH LUYỆN')
      : (acc.sub === 'Any CC' || acc.sub === 'CC'
        ? '<div class="hx-acc-side"><small>NHẪN TINH LUYỆN</small><br><b>Bất kỳ nhẫn CC nào</b></div>'
        : side(null, 'NHẪN TINH LUYỆN'));
    return '<div class="hx-acc-pair">' + side(acc.main_info, 'NHẪN CHÍNH')
      + '<span class="hx-acc-plus">+</span>' + sub + '</div>';
  }

  /* Toàn bộ chi tiết build Best (đang active) của một hero, trình bày
   * như phần Build đồ của trang hero: set + ảnh món đồ, chỉ số chính,
   * 4 dòng phụ ưu tiên kèm icon, cặp phụ kiện Best, ghi chú. Build rỗng
   * hoàn toàn thì chỉ hiện tên build (như popup); hero không có build
   * nào thì báo rõ, không tự bịa đồ. */
  function buildColHtml(hero) {
    if (!hero) return '<div class="cp-col cp-missing">—</div>';
    var b = mainBuild(hero);
    if (!b) return '<div class="cp-col">Chưa có hướng dẫn build cho hero này.</div>';
    var html = '<div class="cp-col-name">' + escHtml(hero.name) + '</div>'
      + '<div class="cp-build-name"><span class="hx-best-tag">BEST</span><b>' + escHtml(buildNameVi(b.name)) + '</b></div>';
    var gearEmpty = !(b.gear && b.gear.sets || []).length && !(b.gear && b.gear.weapon || []).length
      && !(b.gear && b.gear.armor || []).length && !(b.substats || []).length && !(b.acc || []).length;
    if (!gearEmpty) {
      var set = (b.gear.sets || [])[0] || {};
      var setImg = setIcon(set.name || '');
      html += '<div class="hx-gear-set">'
        + (setImg ? '<img src="assets/seticons/' + escHtml(setImg) + '" alt="" loading="lazy">' : '')
        + '<div><b>' + escHtml(set.name || '') + '</b>'
        + (set.effect ? '<p>' + escHtml(set.effect.replace('4pc', 'Set 4')) + '</p>' : '') + '</div></div>';
      html += '<div class="hx-mainstats">'
        + mainStatHtml('Chỉ số chính Vũ khí', pieceImg(set.name || '', 'weapon', hero.type), b.gear.weapon || [])
        + mainStatHtml('Chỉ số chính Giáp', pieceImg(set.name || '', 'armor', hero.type), b.gear.armor || [])
        + '</div>';
      var subs = (b.substats || []).slice(0, 4);
      if (subs.length) {
        html += '<div class="cp-mini-label">ƯU TIÊN DÒNG PHỤ</div><ol class="hx-substats">'
          + subs.map(function (s) {
            var icon = STAT_ICONS[s];
            return '<li>' + (icon ? '<img src="assets/substats/' + escHtml(icon) + '" alt="" loading="lazy">' : '') + escHtml(statLabel(s)) + '</li>';
          }).join('') + '</ol>';
      }
      var acc0 = (b.acc || [])[0];
      if (acc0) html += '<div class="cp-mini-label">PHỤ KIỆN · TỐT NHẤT</div>' + accHtml(acc0);
      var note = gearNoteFor(hero, b);
      if (note) html += '<div class="hx-modal-note">' + escHtml(note) + '</div>';
    }
    return html;
  }

  function buildBlockHtml(heroA, heroB) {
    var ba = heroA ? mainBuild(heroA) : null;
    var bb = heroB ? mainBuild(heroB) : null;
    var note = '';
    if (ba && bb) {
      var sa = ((ba.gear && ba.gear.sets) || []).map(function (s) { return s.name; }).sort().join(',');
      var sb = ((bb.gear && bb.gear.sets) || []).map(function (s) { return s.name; }).sort().join(',');
      if (sa && sa === sb) note = 'cùng dùng set ' + ((ba.gear.sets || []).map(function (s) { return s.name; }).join(', '));
    }
    var html = '<div class="cp-block"><div class="cp-block-title">Build chính</div>';
    if (note) html += '<div class="cp-block-note">' + escHtml(note) + '</div>';
    html += '<div class="cp-cols"><div class="cp-col cp-a cp-build">' + buildColHtml(heroA) + '</div>'
      + '<div class="cp-col cp-b cp-build">' + buildColHtml(heroB) + '</div></div></div>';
    return html;
  }

  function dedicatedColHtml(hero) {
    if (!hero) return '<div class="cp-col cp-missing">—</div>';
    if (!hero.dedicated || !hero.dedicated.name) return '<div class="cp-col">Chưa có trang bị riêng.</div>';
    /* Chỉ hiện cột dòng phụ mà build chính chọn (ded_stat), như popup. */
    var b = mainBuild(hero);
    var groups = dedicatedGroups(hero.dedicated, b && b.ded_stat);
    var lines = groups.map(function (g) {
      var label = statLabel(g.name) + (g.value ? ' ' + g.value : '') + (g.count > 1 ? ' ×' + g.count : '');
      return (g.icon ? '<img src="assets/substats/' + escHtml(g.icon) + '" alt="" class="hx-dedi-icon">' : '') + '<b>' + escHtml(label) + '</b>';
    }).join(' · ');
    var html = '<div class="cp-col-name">' + escHtml(hero.name) + '</div>'
      + '<div class="hx-modal-dedi">'
      + (hero.dedicated.icon ? '<img src="assets/dedicated/' + escHtml(hero.dedicated.icon) + '" alt="" loading="lazy">' : '')
      + '<div><b>' + escHtml(hero.dedicated.name) + '</b>'
      + (hero.dedicated.main_stat ? ' — ' + escHtml(hero.dedicated.main_stat) : '')
      + (lines ? '<span class="hx-dedi-lines">' + lines + '</span>' : '')
      + '</div></div>';
    return html;
  }

  function dedicatedBlockHtml(heroA, heroB) {
    return '<div class="cp-block"><div class="cp-block-title">Trang bị riêng</div><div class="cp-cols">'
      + '<div class="cp-col cp-a">' + dedicatedColHtml(heroA) + '</div>'
      + '<div class="cp-col cp-b">' + dedicatedColHtml(heroB) + '</div></div></div>';
  }

  function detailLinksHtml(heroA, heroB) {
    function link(hero) {
      if (!hero) return '';
      return '<a href="hero.html?id=' + escHtml(hero.id) + '">Xem chi tiết ' + escHtml(hero.name) + ' →</a>';
    }
    var a = link(heroA), b = link(heroB);
    if (!a && !b) return '';
    return '<p class="cp-detail-links">' + [a, b].filter(Boolean).join(' ') + '</p>';
  }

  /* Lắp toàn bộ trang so sánh từ 2 hero đã tải. Trả về '' khi chưa chọn ai. */
  function renderCompareHtml(heroA, heroB, fmt, portraitFor) {
    if (!heroA && !heroB) return '';
    var legend = legendHtml(heroA, heroB, portraitFor);
    var html = '';
    html += '<section class="cp-card"><h2 class="cp-card-title">Tổng quan</h2>' + legend + infoRowsHtml(heroA, heroB) + '</section>';
    html += '<section class="cp-card"><h2 class="cp-card-title">Chỉ số 6★</h2>' + legend
      + STAT_DEFS.map(function (def) { return statBlockHtml(def, heroA, heroB, 's6'); }).join('') + '</section>';
    var aAwk = !!(heroA && heroA.stats && heroA.stats.awk);
    var bAwk = !!(heroB && heroB.stats && heroB.stats.awk);
    html += '<section class="cp-card"><h2 class="cp-card-title">Chỉ số Thức tỉnh</h2>' + legend;
    if (!aAwk && !bAwk) {
      html += '<p class="cp-empty">Cả 2 hero đều chưa thức tỉnh — không có chỉ số Thức tỉnh để so sánh.</p>';
    } else {
      html += STAT_DEFS.map(function (def) { return statBlockHtml(def, heroA, heroB, 'awk'); }).join('');
    }
    html += '</section>';
    var da = heroA ? skillDetail(heroA) : [];
    var db = heroB ? skillDetail(heroB) : [];
    var skillBlocks = '';
    SKILL_TYPE_ORDER.forEach(function (type) {
      var ea = findSkillByType(da, type), eb = findSkillByType(db, type);
      if (!ea && !eb) return;
      if (ea) ea = { type: ea.type, label: ea.label, converts: ea.converts, variants: ea.variants, heroName: heroA.name };
      if (eb) eb = { type: eb.type, label: eb.label, converts: eb.converts, variants: eb.variants, heroName: heroB.name };
      skillBlocks += skillBlockHtml({ label: SKILL_TYPE_VI[type] || type }, ea, eb, fmt);
    });
    html += '<section class="cp-card"><h2 class="cp-card-title">Kỹ năng</h2>' + legend + skillBlocks + '</section>';
    html += '<section class="cp-card"><h2 class="cp-card-title">Xếp hạng theo chế độ</h2>' + legend + tierRowsHtml(heroA, heroB) + '</section>';
    html += '<section class="cp-card"><h2 class="cp-card-title">Build chính</h2>' + legend + buildBlockHtml(heroA, heroB) + '</section>';
    html += '<section class="cp-card"><h2 class="cp-card-title">Trang bị riêng</h2>' + legend + dedicatedBlockHtml(heroA, heroB) + '</section>';
    html += detailLinksHtml(heroA, heroB);
    return html;
  }

  /* ---- Phần chạy trên trình duyệt (guard để test Node vẫn require được) ---- */
  if (typeof document !== 'undefined') {
    var INDEX = [];
    var CACHE = {};
    var sel = { a: null, b: null };

    var inputA = document.getElementById('cp-search-a');
    var inputB = document.getElementById('cp-search-b');
    var suggestA = document.getElementById('cp-suggest-a');
    var suggestB = document.getElementById('cp-suggest-b');
    var pickedA = document.getElementById('cp-picked-a');
    var pickedB = document.getElementById('cp-picked-b');
    var resultEl = document.getElementById('cp-result');
    var copyBtn = document.getElementById('cp-copy-link');
    var copyMsg = document.getElementById('cp-copy-msg');

    function findById(id) {
      for (var i = 0; i < INDEX.length; i++) if (INDEX[i].id === id) return INDEX[i];
      return null;
    }

    function loadHero(id) {
      if (CACHE[id]) return Promise.resolve(CACHE[id]);
      return fetch('data/heroes/' + encodeURIComponent(id) + '.json').then(function (r) {
        if (!r.ok) throw new Error('missing hero ' + id);
        return r.json();
      }).then(function (data) { CACHE[id] = data; return data; });
    }

    function updateUrl() {
      var p = new URLSearchParams();
      if (sel.a) p.set('a', sel.a);
      if (sel.b) p.set('b', sel.b);
      var qs = p.toString();
      var url = 'so-sanh.html' + (qs ? '?' + qs : '');
      try { window.history.replaceState(null, '', url); } catch (e) { /* bỏ qua */ }
    }

    function portraitFor(hero) {
      var idx = findById(hero.id);
      return (idx && idx.portrait) || ('assets/hero-' + hero.id + '.webp');
    }

    function renderCompare(heroA, heroB) {
      if (!heroA && !heroB) {
        resultEl.innerHTML = '<p class="cp-empty">Chọn 2 hero ở trên để xem so sánh chi tiết: chỉ số 6★ và Thức tỉnh với thanh tỉ lệ, toàn bộ nội dung kỹ năng bằng tiếng Việt, xếp hạng theo chế độ, build chính và trang bị riêng. Gõ không dấu vẫn tìm được — ví dụ gõ “eve” hoặc “judas”. Có thể mở thẳng link dạng so-sanh.html?a=eve&amp;b=judas để xem cặp đã chọn sẵn.</p>';
        return;
      }
      resultEl.innerHTML = renderCompareHtml(heroA, heroB, null, portraitFor);
    }

    function refresh() {
      updateUrl();
      var jobs = [sel.a ? loadHero(sel.a).catch(function () { return null; }) : Promise.resolve(null),
                 sel.b ? loadHero(sel.b).catch(function () { return null; }) : Promise.resolve(null)];
      Promise.all(jobs).then(function (pair) { renderCompare(pair[0], pair[1]); });
    }

    function renderPicked(side) {
      var id = sel[side];
      var box = side === 'a' ? pickedA : pickedB;
      var input = side === 'a' ? inputA : inputB;
      if (!id) { box.innerHTML = ''; input.value = ''; return; }
      var idx = findById(id);
      box.innerHTML = '<span class="cp-picked-chip"><img src="' + escHtml(idx ? idx.portrait : 'assets/hero-' + id + '.webp') + '" alt="">'
        + '<b>' + escHtml(idx ? idx.name : id) + '</b>'
        + '<button type="button" data-clear="' + side + '" aria-label="Bỏ chọn hero">✕</button></span>';
      input.value = idx ? idx.name : id;
    }

    function selectHero(side, id) {
      if (side === 'a' && sel.b === id) sel.b = sel.a;
      if (side === 'b' && sel.a === id) sel.a = sel.b;
      sel[side] = id;
      renderPicked('a'); renderPicked('b');
      hideSuggest();
      refresh();
    }

    function hideSuggest() {
      suggestA.hidden = true; suggestB.hidden = true;
    }

    function wirePicker(side) {
      var input = side === 'a' ? inputA : inputB;
      var box = side === 'a' ? suggestA : suggestB;
      input.addEventListener('input', function () {
        var q = norm(input.value);
        if (!q) { box.hidden = true; box.innerHTML = ''; return; }
        var hits = INDEX.filter(function (h) {
          return norm(h.name).indexOf(q) !== -1 || norm(h.id).indexOf(q) !== -1;
        }).slice(0, 8);
        if (!hits.length) {
          box.innerHTML = '<div class="cp-suggest-empty">Không tìm thấy hero nào khớp.</div>';
        } else {
          box.innerHTML = hits.map(function (h) {
            return '<button type="button" data-pick="' + escHtml(h.id) + '" data-side="' + side + '">'
              + '<img src="' + escHtml(h.portrait) + '" alt="">'
              + '<span>' + escHtml(h.name) + '</span><small>' + escHtml(h.rarity) + ' · ' + escHtml(h.type) + '</small></button>';
          }).join('');
        }
        box.hidden = false;
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var q = norm(input.value);
          var hit = INDEX.find(function (h) { return norm(h.name) === q; })
            || INDEX.find(function (h) { return norm(h.name).indexOf(q) === 0; });
          if (hit) selectHero(side, hit.id);
        }
      });
      box.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-pick]');
        if (btn) selectHero(btn.getAttribute('data-side'), btn.getAttribute('data-pick'));
      });
      input.addEventListener('focus', function () {
        if (input.value.trim()) input.dispatchEvent(new Event('input'));
      });
    }

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.cp-picker')) hideSuggest();
      var clearBtn = e.target.closest('[data-clear]');
      if (clearBtn) {
        var side = clearBtn.getAttribute('data-clear');
        sel[side] = null;
        renderPicked(side);
        refresh();
      }
    });

    document.getElementById('cp-swap').addEventListener('click', function () {
      sel = swapSelection(sel);
      renderPicked('a'); renderPicked('b');
      refresh();
    });

    if (copyBtn) copyBtn.addEventListener('click', function () {
      var url = window.location.href;
      function done() { copyMsg.textContent = 'Đã sao chép link!'; setTimeout(function () { copyMsg.textContent = ''; }, 2500); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { copyMsg.textContent = 'Không sao chép được — copy link trên thanh địa chỉ nhé.'; });
      } else {
        copyMsg.textContent = 'Copy link trên thanh địa chỉ nhé.';
      }
    });

    wirePicker('a');
    wirePicker('b');

    fetch(INDEX_URL).then(function (r) { return r.json(); }).then(function (data) {
      INDEX = data;
      var params = parseCompareParams(window.location.search);
      if (params.a && findById(params.a)) sel.a = params.a;
      if (params.b && findById(params.b)) sel.b = params.b;
      renderPicked('a'); renderPicked('b');
      refresh();
    }).catch(function () {
      resultEl.innerHTML = '<p class="cp-empty">Không tải được danh sách hero.</p>';
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      norm: norm, parseCompareParams: parseCompareParams, swapSelection: swapSelection,
      tierLabel: tierLabel, attackStat: attackStat, statValue: statValue,
      winnerFor: winnerFor, skillList: skillList, mainBuild: mainBuild,
      tierRows: tierRows, MODE_ORDER: MODE_ORDER, SKILL_TYPE_VI: SKILL_TYPE_VI,
      fmtNum: fmtNum, barWidth: barWidth, statNote: statNote,
      skillDetail: skillDetail, dedicatedLines: dedicatedLines,
      dedicatedGroups: dedicatedGroups, statLabel: statLabel,
      pieceImg: pieceImg, setIcon: setIcon, gearNoteFor: gearNoteFor,
      buildColHtml: buildColHtml, buildNameVi: buildNameVi, dedicatedColHtml: dedicatedColHtml,
      legendHtml: legendHtml, statBlockHtml: statBlockHtml,
      skillBlockHtml: skillBlockHtml, renderCompareHtml: renderCompareHtml
    };
  }
})();
