/* Skill-card renderer, shared by the hero detail page and the Guild War
 * skill popup. EXTRACTED VERBATIM from hero-detail.js (skillCardHtml,
 * richLine and the Vietnamese effect/target maps) by
 * ~/workspace/extract_skill_card.py — re-run that script after editing the
 * skill rendering in hero-detail.js, do not hand-edit the extracted blocks
 * below. The Guild War page loads this file so its skill popup shows the
 * exact same skill detail as hero.html, from the same data/heroes JSONs.
 * No source attribution is rendered here (the old GW panel's
 * "Hiệu ứng tối đa (Atlas Codex)" box is gone with it).
 */
(function () {
'use strict';
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}
function skillIcon(sk) {
  return sk.icon ? 'assets/skills-raw/' + sk.icon : null;
}
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
var VI_TO_EN = {};
Object.keys(FX_VI).forEach(function (k) {
  if (FX_VI[k] && !VI_TO_EN[FX_VI[k]]) VI_TO_EN[FX_VI[k]] = k;
});
var BOLD_TERMS = Object.keys(FX_VI).concat(Object.keys(VI_TO_EN)).concat([
  'Physical Attack', 'Magic Attack', 'Physical Damage', 'Magic Damage', 'True Damage'
]).sort(function (a, b) { return b.length - a.length; });
var BOLD_RE = new RegExp('(?<![\\p{L}\\p{N}])(' + BOLD_TERMS.map(function (t) {
  return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}).join('|') + ')(?![\\p{L}\\p{N}])', 'gu');
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
    var key = FX_BAD[m] || FX_GOOD[m] ? m : (VI_TO_EN[m] || m);
    if (!noColor && FX_BAD[key]) return '<b class="hx-fx-bad">' + m + '</b>';
    if (!noColor && FX_GOOD[key]) return '<b class="hx-fx-good">' + m + '</b>';
    return '<b>' + m + '</b>';
  });
  return s;
}
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
  var txOrder = { T2: 1, T4: 2, T6: 3 };
  var tx = (sk.tx || []).slice().sort(function (a, b) { return (txOrder[a.tier] || 99) - (txOrder[b.tier] || 99); });
  var txHtml = tx.length
    ? '<div style="margin-top:8px">' + tx.map(function (t) {
      var idx = sk.tx.indexOf(t);
      var effect = (sk.tx_vi && sk.tx_vi[idx] && sk.tx_vi[idx].effect) || t.effect;
      /* Mốc T2 và T6 nổi bật: tag riêng + khung bao quanh nội dung.
       * T2 nằm trên T6 (đã sắp xếp theo txOrder). Màu phân hóa đẳng cấp:
       * T2 = xanh lá nhạt, T6 = cam nhạt. T4 giữ dạng dòng thường. */
      if (t.tier === 'T2' || t.tier === 'T6') {
        var cls = t.tier === 'T2' ? 'hx-tx-box hx-tx-t2' : 'hx-tx-box hx-tx-t6';
        return '<div class="' + cls + '"><span class="hx-tx-tag">' + esc(t.tier) + '</span><span>' + richLine(effect) + '</span></div>';
      }
      return '<p style="font-size:12.5px;color:#946b25;margin:4px 0"><b>' + esc(t.tier) + '</b> ' + richLine(effect) + '</p>';
    }).join('') + '</div>' : '';
  return '<div class="hx-skill" id="skill-' + esc(sk.key) + '">' + iconHtml
    + '<div style="flex:1;min-width:0"><h4>' + esc(sk.name || 'Basic Attack') + '</h4>'
    + '<span class="hx-skill-type">' + esc(typeLabel) + '</span>' + cd
    + groups + bubbles + enhance + txHtml + fxHtml + '</div></div>';
}
/* Render one skill (by key: s1 / ultimate / ...) from a hero JSON skill list,
 * including its converts TRƯỚC/SAU pair — mirrors renderSkills() in
 * hero-detail.js for a single key. */
function skillDetailHtml(skills, key) {
  var base = null, after = null;
  (skills || []).forEach(function (sk) {
    if (sk.key !== key) return;
    if (sk.converts) after = sk;
    else if (!base) base = sk;
  });
  var sk = base || after;
  if (!sk) return '';
  if (after && base) {
    return '<div class="hx-cardbox" style="margin-bottom:10px"><b style="font-size:13px">⇄ Chuyển đổi kỹ năng — kỹ năng thay đổi sau khi biến hình</b>'
      + '<div style="margin-top:10px"><small style="font-weight:800;color:#8b8578">TRƯỚC</small>' + skillCardHtml(base) + '</div>'
      + '<div style="margin-top:12px"><small style="font-weight:800;color:#b3352c">SAU</small>' + skillCardHtml(after) + '</div>'
      + '</div>';
  }
  return skillCardHtml(sk);
}

window.SkillCard = {
  skillCardHtml: skillCardHtml,
  skillDetailHtml: skillDetailHtml,
  skillIcon: skillIcon,
  targetVi: targetVi,
  richLine: richLine
};
})();
