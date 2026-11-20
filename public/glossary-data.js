/* Tu dien hieu ung — du lieu duoc build tu FX_VI (hero-detail.js)
 * va mo ta thu hoach tu skill cua tung hero (public/data/heroes/*.json).
 * Build lai bang: python3 ~/workspace/build_glossary.py
 * desc_verified=false nghia la mo ta chua co nguon xac nhan (hien 'chua xac minh').
 * desc=null nghia la chua co mo ta (hien 'dang bo sung mo ta'). */
var GLOSSARY_DATA = [
 {
  "en": "7-Dish Meal Set (Stacks)",
  "vi": "Bộ 7 món ăn (cộng dồn)",
  "desc": "Giảm sát thương vật lý nhận vào đi một lượng nhất định theo số cộng dồn.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "deo",
    "name": "Deo"
   }
  ]
 },
 {
  "en": "[Mark: Energia's Saturation] (Stacks)",
  "vi": "[Dấu ấn: bão hòa Energia] (cộng dồn)",
  "desc": "Để lại một dấu ấn trên mục tiêu; khi dấu ấn đạt 2 cộng dồn, kích hoạt hiệu ứng: mục tiêu chịu giảm thời gian buff, bản thân nhận cộng dồn tăng sát thương vật lý.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "pallanus",
    "name": "Pallanus"
   }
  ]
 },
 {
  "en": "[Mark: Heaven Scorcher Halberd's Rage] (Stacks)",
  "vi": "[Dấu ấn: cơn thịnh nộ của Halberd thiêu trời] (cộng dồn)",
  "desc": "Để lại dấu ấn trên mục tiêu; khi dấu ấn đạt 2 cộng dồn, kích hoạt hiệu ứng: gây thêm sát thương theo Max HP của mục tiêu, bản thân tăng sát thương điểm yếu.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "lu-bu",
    "name": "Lu Bu"
   }
  ]
 },
 {
  "en": "All Attack Boost",
  "vi": "Tăng All Attack",
  "desc": "Tăng All Attack thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "black-rose",
    "name": "Black Rose"
   },
   {
    "id": "chloe",
    "name": "Chloe"
   },
   {
    "id": "diaochan",
    "name": "Diaochan"
   },
   {
    "id": "leo",
    "name": "Leo"
   }
  ]
 },
 {
  "en": "All Attack Reduction",
  "vi": "Giảm All Attack",
  "desc": "Giảm All Attack đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "aragon",
    "name": "Aragon"
   },
   {
    "id": "chancellor",
    "name": "Chancellor"
   },
   {
    "id": "clemyth",
    "name": "Clemyth"
   },
   {
    "id": "colt",
    "name": "Colt"
   },
   {
    "id": "deo",
    "name": "Deo"
   }
  ]
 },
 {
  "en": "All Damage Immunity",
  "vi": "Miễn nhiễm mọi sát thương",
  "desc": "Miễn nhiễm mọi sát thương.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "bai-jiao",
    "name": "Bai Jiao"
   },
   {
    "id": "branze-bransel",
    "name": "Branze & Bransel"
   },
   {
    "id": "chancellor",
    "name": "Chancellor"
   },
   {
    "id": "clemyth",
    "name": "Clemyth"
   },
   {
    "id": "dongyoung",
    "name": "Dongyoung"
   }
  ]
 },
 {
  "en": "All Damage Nullification",
  "vi": "Vô hiệu mọi sát thương",
  "desc": "Vô hiệu hóa mọi sát thương trong một số đòn nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "ballista",
    "name": "Ballista"
   },
   {
    "id": "branze-bransel",
    "name": "Branze & Bransel"
   },
   {
    "id": "dellons",
    "name": "Dellons"
   },
   {
    "id": "eileene",
    "name": "Eileene"
   },
   {
    "id": "freyja",
    "name": "Freyja"
   }
  ]
 },
 {
  "en": "Ally Role Support",
  "vi": "Hỗ trợ vai trò đồng minh",
  "desc": "Khi bắt đầu trận đấu, nếu trong đội có đủ số đồng minh cùng vai trò, vai trò đó được tính là có thêm 1 thành viên (trận 4/5 tướng: từ 3 tướng cùng vai trò trở lên; trận 3 tướng: từ 2 tướng cùng vai trò trở lên).",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "clemyth",
    "name": "Clemyth"
   },
   {
    "id": "hayeon",
    "name": "Hayeon"
   }
  ]
 },
 {
  "en": "Attack Based Defense Boost",
  "vi": "Tăng Defense theo ATK",
  "desc": "Tăng Defense theo Attack của bản thân.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "jave",
    "name": "Jave"
   },
   {
    "id": "sun-wukong",
    "name": "Sun Wukong"
   }
  ]
 },
 {
  "en": "Attack-Based Defense Boost",
  "vi": "Tăng Defense theo ATK",
  "desc": "Tăng Defense theo Attack của bản thân.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "jave",
    "name": "Jave"
   },
   {
    "id": "sun-wukong",
    "name": "Sun Wukong"
   }
  ]
 },
 {
  "en": "Attack-Based Effect Hit Rate Boost",
  "vi": "Tăng Effect Hit Rate theo ATK",
  "desc": "Tăng Effect Hit Rate theo Attack của bản thân.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "dongyoung",
    "name": "Dongyoung"
   },
   {
    "id": "eileene",
    "name": "Eileene"
   }
  ]
 },
 {
  "en": "Attack-Based Reduced Damage Taken Boost",
  "vi": "Tăng kháng sát thương theo ATK",
  "desc": "Tăng khả năng giảm sát thương nhận vào theo Attack của bản thân.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "pallanus",
    "name": "Pallanus"
   }
  ]
 },
 {
  "en": "Attack-Based Weakness Hit Chance Boost",
  "vi": "Tăng tỉ lệ đánh điểm yếu theo ATK",
  "desc": "Tăng tỉ lệ đánh điểm yếu theo Attack của bản thân.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "mist",
    "name": "Mist"
   }
  ]
 },
 {
  "en": "Awakening Gauge Boost",
  "vi": "Tăng thanh thức tỉnh",
  "desc": "Tăng thanh thức tỉnh thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "aris",
    "name": "Aris"
   },
   {
    "id": "dellons",
    "name": "Dellons"
   },
   {
    "id": "dongyoung",
    "name": "Dongyoung"
   },
   {
    "id": "giyu-tomioka",
    "name": "Giyu Tomioka"
   },
   {
    "id": "hayeon",
    "name": "Hayeon"
   }
  ]
 },
 {
  "en": "Awakening Gauge Reduction",
  "vi": "Giảm thanh thức tỉnh",
  "desc": "Giảm thanh thức tỉnh của mục tiêu đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "eve",
    "name": "Eve"
   },
   {
    "id": "rudy",
    "name": "Rudy"
   }
  ]
 },
 {
  "en": "Awakening Gauge Steal",
  "vi": "Đánh cắp thanh thức tỉnh",
  "desc": "Tăng Awakening Gauge theo lượng đã đánh cắp.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "eve",
    "name": "Eve"
   }
  ]
 },
 {
  "en": "Bad Debt",
  "vi": "Nợ xấu",
  "desc": "Sau khi nhận một số lần trúng đòn nhất định, gây cộng dồn giảm Defense và tăng sát thương vật lý nhận vào lên kẻ tấn công. Không ảnh hưởng đến boss.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "orkah",
    "name": "Orkah"
   }
  ]
 },
 {
  "en": "Barrier",
  "vi": "Khiên",
  "desc": "Hấp thụ sát thương bằng giá trị của Barrier.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "ace",
    "name": "Ace"
   },
   {
    "id": "amelia",
    "name": "Amelia"
   },
   {
    "id": "aquila",
    "name": "Aquila"
   },
   {
    "id": "aris",
    "name": "Aris"
   },
   {
    "id": "asura",
    "name": "Asura"
   }
  ]
 },
 {
  "en": "Binding Rope",
  "vi": "Dây trói",
  "desc": "Không thể hành động trong thời gian hiệu ứng, và khi bị trúng đòn tấn công của địch, mục tiêu bị ảnh hưởng sẽ nhận thêm sát thương cố định bằng một tỉ lệ nhất định của Attack của người dùng.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "yoongun",
    "name": "Yoongun"
   }
  ]
 },
 {
  "en": "Bleed",
  "vi": "Chảy máu",
  "desc": "Mục tiêu chịu sát thương xuyên thủng bằng một tỉ lệ nhất định của Attack của người dùng mỗi lượt. Sát thương tăng theo mỗi cộng dồn Bleed trên mục tiêu, tối đa 5 cộng dồn.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "bai-jiao",
    "name": "Bai Jiao"
   },
   {
    "id": "bi-dam",
    "name": "Bi Dam"
   },
   {
    "id": "branze-bransel",
    "name": "Branze & Bransel"
   },
   {
    "id": "deo",
    "name": "Deo"
   },
   {
    "id": "freyja",
    "name": "Freyja"
   }
  ]
 },
 {
  "en": "Bleed Explosion",
  "vi": "Kích nổ chảy máu",
  "desc": "Kích nổ các stack Bleed đang có trên mục tiêu để gây sát thương. Sát thương tăng theo số lượng và số lượt còn lại của các stack Bleed đã tiêu thụ.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "bi-dam",
    "name": "Bi Dam"
   }
  ]
 },
 {
  "en": "Bleed Immunity",
  "vi": "Miễn nhiễm chảy máu",
  "desc": "Miễn nhiễm Bleed.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "karon",
    "name": "Karon"
   },
   {
    "id": "lee-joohee",
    "name": "Lee Joohee"
   }
  ]
 },
 {
  "en": "Blessing",
  "vi": "Phước lành",
  "desc": "Giới hạn sát thương phải chịu từ một đòn đánh ở mức một tỉ lệ nhất định của Max HP. Sát thương cố định không bị giảm bởi hiệu ứng này.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "eve",
    "name": "Eve"
   },
   {
    "id": "freyja",
    "name": "Freyja"
   },
   {
    "id": "judas",
    "name": "Judas"
   },
   {
    "id": "lu-bu",
    "name": "Lu Bu"
   },
   {
    "id": "mercure",
    "name": "Mercure"
   }
  ]
 },
 {
  "en": "Blind",
  "vi": "Mù",
  "desc": "Trong thời gian hiệu ứng này, đòn đánh thường, đòn phản công và đòn tấn công tiếp nối chắc chắn trượt.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "ariel",
    "name": "Ariel"
   },
   {
    "id": "may",
    "name": "May"
   },
   {
    "id": "ryan",
    "name": "Ryan"
   }
  ]
 },
 {
  "en": "Blind Immunity",
  "vi": "Miễn nhiễm mù",
  "desc": "Miễn nhiễm với Blind.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "zhao-yun",
    "name": "Zhao Yun"
   }
  ]
 },
 {
  "en": "Block Rate Boost",
  "vi": "Tăng Block Rate",
  "desc": "Tăng Block Rate thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "aris",
    "name": "Aris"
   },
   {
    "id": "evan",
    "name": "Evan"
   },
   {
    "id": "karma",
    "name": "Karma"
   },
   {
    "id": "rahkun",
    "name": "Rahkun"
   },
   {
    "id": "rook",
    "name": "Rook"
   }
  ]
 },
 {
  "en": "Block Rate Reduction",
  "vi": "Giảm Block Rate",
  "desc": "Giảm Block Rate đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "ace",
    "name": "Ace"
   },
   {
    "id": "aris",
    "name": "Aris"
   },
   {
    "id": "catty",
    "name": "Catty"
   },
   {
    "id": "randgrid",
    "name": "Randgrid"
   },
   {
    "id": "sun-wukong",
    "name": "Sun Wukong"
   }
  ]
 },
 {
  "en": "Bomb",
  "vi": "Bom",
  "desc": "Khi hết thời gian, bom phát nổ gây sát thương bỏ qua Defense; khi nổ có tỉ lệ gây giảm thời gian buff và Tê liệt. Có thể triển khai tối đa 3 bom cùng lúc.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "colt",
    "name": "Colt"
   }
  ]
 },
 {
  "en": "Boss Damage Boost",
  "vi": "Tăng sát thương lên Boss",
  "desc": "Tăng sát thương gây ra cho boss thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "biscuit",
    "name": "Biscuit"
   }
  ]
 },
 {
  "en": "Buff Block",
  "vi": "Chặn Buff",
  "desc": "Không thể nhận buff.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "hayeon",
    "name": "Hayeon"
   },
   {
    "id": "shinobu-kocho",
    "name": "Shinobu Kocho"
   }
  ]
 },
 {
  "en": "Buff Duration Boost",
  "vi": "Tăng thời gian Buff",
  "desc": "Tăng thời gian duy trì buff. Mức tăng không thể vượt quá thời gian gốc của buff.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "hayeon",
    "name": "Hayeon"
   },
   {
    "id": "juri",
    "name": "Juri"
   }
  ]
 },
 {
  "en": "Buff Duration Reduction",
  "vi": "Giảm thời gian Buff",
  "desc": "Giảm thời gian duy trì buff.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "ace",
    "name": "Ace"
   },
   {
    "id": "aragon",
    "name": "Aragon"
   },
   {
    "id": "aris",
    "name": "Aris"
   },
   {
    "id": "branze-bransel",
    "name": "Branze & Bransel"
   },
   {
    "id": "diaochan",
    "name": "Diaochan"
   }
  ]
 },
 {
  "en": "Buff Removal",
  "vi": "Xóa Buff",
  "desc": "Xóa buff theo thứ tự chúng được áp dụng. Damage Immunity, Damage Nullification và Guts không thể bị xóa.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "biscuit",
    "name": "Biscuit"
   },
   {
    "id": "black-rose",
    "name": "Black Rose"
   },
   {
    "id": "chancellor",
    "name": "Chancellor"
   },
   {
    "id": "chloe",
    "name": "Chloe"
   },
   {
    "id": "daisy",
    "name": "Daisy"
   }
  ]
 },
 {
  "en": "Burn",
  "vi": "Thiêu đốt",
  "desc": "Gây sát thương bằng một tỉ lệ nhất định của Attack của người dùng mỗi lượt.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "eileene",
    "name": "Eileene"
   },
   {
    "id": "fai",
    "name": "Fai"
   },
   {
    "id": "jave",
    "name": "Jave"
   },
   {
    "id": "may",
    "name": "May"
   },
   {
    "id": "rachel",
    "name": "Rachel"
   }
  ]
 },
 {
  "en": "Burn Immunity",
  "vi": "Miễn nhiễm thiêu đốt",
  "desc": "Miễn nhiễm với Burn.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "ariel",
    "name": "Ariel"
   },
   {
    "id": "ryan",
    "name": "Ryan"
   },
   {
    "id": "yui",
    "name": "Yui"
   }
  ]
 },
 {
  "en": "Camouflage",
  "vi": "Ngụy trang",
  "desc": "Không thể trở thành mục tiêu của đòn tấn công đơn mục tiêu; các đòn tấn công diện rộng và debuff nhắm vào mục tiêu sẽ chắc chắn trượt. Nếu tất cả tướng có thể tấn công trong một đội đều đang ngụy trang, hiệu ứng sẽ bị xóa khỏi mọi tướng trong đội đó.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "ballista",
    "name": "Ballista"
   },
   {
    "id": "colt",
    "name": "Colt"
   },
   {
    "id": "jane",
    "name": "Jane"
   },
   {
    "id": "jupy",
    "name": "Jupy"
   },
   {
    "id": "omok",
    "name": "O'Mok"
   }
  ]
 },
 {
  "en": "Clone",
  "vi": "Phân thân",
  "desc": "Triệu hồi một phân thân của bản thân; đòn đánh thường và kỹ năng được đổi dạng trong thời gian hiệu lực.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "sun-wukong",
    "name": "Sun Wukong"
   }
  ]
 },
 {
  "en": "Concussion",
  "vi": "Chấn động",
  "desc": "Không thể hành động trong thời gian hiệu ứng; thời gian hiệu lực tăng thêm khi bị đòn tấn công của địch có từ 2 đòn trở lên, nhưng không thể vượt quá thời gian ban đầu được áp dụng.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "amelia",
    "name": "Amelia"
   },
   {
    "id": "trude",
    "name": "Trude"
   }
  ]
 },
 {
  "en": "Confusion",
  "vi": "Hỗn loạn",
  "desc": "Đòn đánh của mục tiêu chắc chắn trượt trong một số lần đánh nhất định, miễn là còn ít nhất 1 cộng dồn của hiệu ứng.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "li",
    "name": "Li"
   },
   {
    "id": "rin",
    "name": "Rin"
   }
  ]
 },
 {
  "en": "Conqueror of Adversity (Stacks)",
  "vi": "Kẻ chinh phục nghịch cảnh (cộng dồn)",
  "desc": "Tăng sát thương thêm một lượng nhất định, tỉ lệ với cấp độ stage của trận đấu đang diễn ra.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "sung-jinwoo",
    "name": "Sung Jinwoo"
   }
  ]
 },
 {
  "en": "Conqueror of Adversity. (Stacks)",
  "vi": "Kẻ chinh phục nghịch cảnh (cộng dồn)",
  "desc": "Tăng sát thương thêm một lượng nhất định, tỉ lệ với cấp độ stage của trận đấu đang diễn ra.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "sung-jinwoo",
    "name": "Sung Jinwoo"
   }
  ]
 },
 {
  "en": "Continuous Healing",
  "vi": "Hồi HP liên tục",
  "desc": "Hồi HP bằng một tỉ lệ nhất định của Max HP của người dùng mỗi lượt.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "alice",
    "name": "Alice"
   },
   {
    "id": "clemyth",
    "name": "Clemyth"
   },
   {
    "id": "guan-yu",
    "name": "Guan Yu"
   },
   {
    "id": "hayeon",
    "name": "Hayeon"
   },
   {
    "id": "knox",
    "name": "Knox"
   }
  ]
 },
 {
  "en": "Cooldown Increase Immunity",
  "vi": "Miễn nhiễm tăng hồi chiêu",
  "desc": "Miễn nhiễm Cooldown Increase.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "giyu-tomioka",
    "name": "Giyu Tomioka"
   }
  ]
 },
 {
  "en": "Cooldown Reduction",
  "vi": "Giảm hồi chiêu",
  "desc": "Giảm thời gian hồi chiêu của kỹ năng.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "aragon",
    "name": "Aragon"
   },
   {
    "id": "cha-hae-in",
    "name": "Cha Hae-in"
   },
   {
    "id": "colt",
    "name": "Colt"
   },
   {
    "id": "dellons",
    "name": "Dellons"
   },
   {
    "id": "hayeon",
    "name": "Hayeon"
   }
  ]
 },
 {
  "en": "Cooldown Reset",
  "vi": "Reset hồi chiêu",
  "desc": "Đặt lại thời gian hồi chiêu của kỹ năng.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "cha-hae-in",
    "name": "Cha Hae-in"
   },
   {
    "id": "diaochan",
    "name": "Diaochan"
   },
   {
    "id": "hellenia",
    "name": "Hellenia"
   },
   {
    "id": "kris",
    "name": "Kris"
   },
   {
    "id": "lu-bu",
    "name": "Lu Bu"
   }
  ]
 },
 {
  "en": "Counterattack",
  "vi": "Phản đòn",
  "desc": "Phản công kẻ tấn công khi bị trúng đòn.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "jave",
    "name": "Jave"
   },
   {
    "id": "li",
    "name": "Li"
   },
   {
    "id": "rudy",
    "name": "Rudy"
   }
  ]
 },
 {
  "en": "Counterattack Chance Boost",
  "vi": "Tăng tỉ lệ phản đòn",
  "desc": "Tăng Counterattack Chance thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "li",
    "name": "Li"
   }
  ]
 },
 {
  "en": "Cover",
  "vi": "Yểm trợ",
  "desc": "Khi dùng đòn đánh thường, một đồng minh tấn công cùng mục tiêu bằng đòn đánh thường của họ.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "hayeon",
    "name": "Hayeon"
   }
  ]
 },
 {
  "en": "Crit Damage Boost",
  "vi": "Tăng Crit Damage",
  "desc": "Tăng Crit Damage thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "clemyth",
    "name": "Clemyth"
   },
   {
    "id": "deo",
    "name": "Deo"
   },
   {
    "id": "diaochan",
    "name": "Diaochan"
   },
   {
    "id": "feng-yan",
    "name": "Feng Yan"
   },
   {
    "id": "guan-yu",
    "name": "Guan Yu"
   }
  ]
 },
 {
  "en": "Crit Damage Boost (Stacks)",
  "vi": "Tăng Crit Damage (cộng dồn)",
  "desc": "Tăng Crit Damage thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "dellons",
    "name": "Dellons"
   }
  ]
 },
 {
  "en": "Crit Damage Reduction",
  "vi": "Giảm Crit Damage",
  "desc": "Giảm Crit Damage đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "judas",
    "name": "Judas"
   }
  ]
 },
 {
  "en": "Crit Rate Boost",
  "vi": "Tăng Crit Rate",
  "desc": "Tăng Crit Rate thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "bai-long",
    "name": "Bai Long"
   },
   {
    "id": "catty",
    "name": "Catty"
   },
   {
    "id": "chloe",
    "name": "Chloe"
   },
   {
    "id": "eve",
    "name": "Eve"
   },
   {
    "id": "guan-yu",
    "name": "Guan Yu"
   }
  ]
 },
 {
  "en": "Crit Rate Reduction",
  "vi": "Giảm Crit Rate",
  "desc": "Giảm Crit Rate đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "aragon",
    "name": "Aragon"
   },
   {
    "id": "giyu-tomioka",
    "name": "Giyu Tomioka"
   },
   {
    "id": "joker",
    "name": "Joker"
   },
   {
    "id": "radgrid",
    "name": "Radgrid"
   }
  ]
 },
 {
  "en": "Crowd Control Immunity",
  "vi": "Miễn nhiễm khống chế",
  "desc": "Miễn nhiễm Crowd Control.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "clemyth",
    "name": "Clemyth"
   },
   {
    "id": "diaochan",
    "name": "Diaochan"
   },
   {
    "id": "eve",
    "name": "Eve"
   },
   {
    "id": "jave",
    "name": "Jave"
   },
   {
    "id": "judas",
    "name": "Judas"
   }
  ]
 },
 {
  "en": "Crowd Control Immunity upon gaining Immortality",
  "vi": "Miễn nhiễm khống chế khi bất tử",
  "desc": "Miễn nhiễm khống chế khi nhận Immortality.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "juri",
    "name": "Juri"
   }
  ]
 },
 {
  "en": "Crystal Cluster",
  "vi": "Cụm tinh thể",
  "desc": "Sau khi chịu một số lần đánh nhất định, cụm tinh thể phát nổ gây sát thương cố định và có tỉ lệ gây tăng hồi chiêu lên kẻ tấn công.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "melia",
    "name": "Melia"
   }
  ]
 },
 {
  "en": "Crystal Resonance",
  "vi": "Cộng hưởng tinh thể",
  "desc": "Giảm số lần đánh cần thiết để kích nổ Crystal Cluster áp lên mục tiêu.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "melia",
    "name": "Melia"
   }
  ]
 },
 {
  "en": "Damage Boost",
  "vi": "Tăng sát thương",
  "desc": "Tăng sát thương gây ra thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "clemyth",
    "name": "Clemyth"
   },
   {
    "id": "giyu-tomioka",
    "name": "Giyu Tomioka"
   },
   {
    "id": "karma",
    "name": "Karma"
   },
   {
    "id": "lina",
    "name": "Lina"
   },
   {
    "id": "velika",
    "name": "Velika"
   }
  ]
 },
 {
  "en": "Damage Boost (Stacks)",
  "vi": "Tăng sát thương (cộng dồn)",
  "desc": "Tăng sát thương gây ra thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "kyrielle",
    "name": "Kyrielle"
   }
  ]
 },
 {
  "en": "Damage Reduction",
  "vi": "Giảm sát thương gây ra",
  "desc": "Giảm sát thương gây ra đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "biscuit",
    "name": "Biscuit"
   },
   {
    "id": "chancellor",
    "name": "Chancellor"
   },
   {
    "id": "clemyth",
    "name": "Clemyth"
   },
   {
    "id": "judas",
    "name": "Judas"
   },
   {
    "id": "karma",
    "name": "Karma"
   }
  ]
 },
 {
  "en": "Damage Resistance",
  "vi": "Giảm sát thương nhận vào",
  "desc": "Giảm sát thương nhận vào đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "aquila",
    "name": "Aquila"
   },
   {
    "id": "gelidus",
    "name": "Gelidus"
   },
   {
    "id": "judas",
    "name": "Judas"
   },
   {
    "id": "karma",
    "name": "Karma"
   },
   {
    "id": "rook",
    "name": "Rook"
   }
  ]
 },
 {
  "en": "Damage Resistance (Allies)",
  "vi": "Giảm sát thương nhận vào (đồng minh)",
  "desc": "Giảm sát thương nhận vào đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "rudy",
    "name": "Rudy"
   }
  ]
 },
 {
  "en": "Damage Resistance (Self)",
  "vi": "Giảm sát thương nhận vào (bản thân)",
  "desc": "Giảm sát thương nhận vào đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "rudy",
    "name": "Rudy"
   }
  ]
 },
 {
  "en": "Deadly Poison",
  "vi": "Kịch độc",
  "desc": "Gây sát thương bằng một tỉ lệ nhất định của Max HP của mục tiêu mỗi lượt. Hiệu ứng này được tính là hiệu ứng Poison, và sát thương không thể vượt quá một tỉ lệ nhất định của Attack của người dùng.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "dongyoung",
    "name": "Dongyoung"
   },
   {
    "id": "shinobu-kocho",
    "name": "Shinobu Kocho"
   }
  ]
 },
 {
  "en": "Death",
  "vi": "Tử vong",
  "desc": "Mục tiêu chịu sát thương bằng một tỉ lệ nhất định của HP hiện tại mỗi lượt, và chết ngay lập tức ở lượt cuối cùng. Mục tiêu chết ngay lập tức khi đạt 2 cộng dồn Death.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "aquila",
    "name": "Aquila"
   },
   {
    "id": "knox",
    "name": "Knox"
   },
   {
    "id": "kris",
    "name": "Kris"
   },
   {
    "id": "mist",
    "name": "Mist"
   },
   {
    "id": "rosie",
    "name": "Rosie"
   }
  ]
 },
 {
  "en": "Death Effect Probability Boost",
  "vi": "Tăng tỉ lệ hiệu ứng tử vong",
  "desc": "Tăng Death Effect Probability thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "aquila",
    "name": "Aquila"
   },
   {
    "id": "knox",
    "name": "Knox"
   }
  ]
 },
 {
  "en": "Death Immunity",
  "vi": "Miễn nhiễm tử vong",
  "desc": "Miễn nhiễm với Death.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "leo",
    "name": "Leo"
   },
   {
    "id": "xiao",
    "name": "Xiao"
   }
  ]
 },
 {
  "en": "Death Turn Reduction",
  "vi": "Giảm số lượt tử vong",
  "desc": "Giảm thời gian duy trì debuff Death.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "aquila",
    "name": "Aquila"
   }
  ]
 },
 {
  "en": "Debuff Duration Boost",
  "vi": "Tăng thời gian Debuff",
  "desc": "Tăng thời gian duy trì debuff. Mức tăng không thể vượt quá thời gian gốc của debuff.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "hayeon",
    "name": "Hayeon"
   }
  ]
 },
 {
  "en": "Debuff Removal",
  "vi": "Xóa Debuff",
  "desc": "Xóa debuff theo thứ tự chúng được áp dụng.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "ace",
    "name": "Ace"
   },
   {
    "id": "amelia",
    "name": "Amelia"
   },
   {
    "id": "aquila",
    "name": "Aquila"
   },
   {
    "id": "aris",
    "name": "Aris"
   },
   {
    "id": "bai-jiao",
    "name": "Bai Jiao"
   }
  ]
 },
 {
  "en": "Deep Sleep",
  "vi": "Ngủ sâu",
  "desc": "Không thể hành động trong thời gian hiệu ứng, và mọi đòn tấn công vào mục tiêu bị ảnh hưởng đều là Guaranteed Critical Hits. Hiệu ứng bị xóa khi mục tiêu nhận sát thương bằng một tỉ lệ nhất định của Max HP trở lên, bất kể còn bao nhiêu lượt hiệu lực.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "yeonhee",
    "name": "Yeonhee"
   }
  ]
 },
 {
  "en": "Defense Boost",
  "vi": "Tăng Defense",
  "desc": "Tăng Defense thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "alice",
    "name": "Alice"
   },
   {
    "id": "clemyth",
    "name": "Clemyth"
   },
   {
    "id": "evan",
    "name": "Evan"
   },
   {
    "id": "giyu-tomioka",
    "name": "Giyu Tomioka"
   },
   {
    "id": "lucy",
    "name": "Lucy"
   }
  ]
 },
 {
  "en": "Defense Ignore Efficiency Boost",
  "vi": "Tăng hiệu quả xuyên giáp",
  "desc": "Tăng hiệu quả bỏ qua Defense của mục tiêu thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "bai-long",
    "name": "Bai Long"
   },
   {
    "id": "lu-bu",
    "name": "Lu Bu"
   }
  ]
 },
 {
  "en": "Defense Reduction",
  "vi": "Giảm Defense",
  "desc": "Giảm Defense đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "ace",
    "name": "Ace"
   },
   {
    "id": "ariel",
    "name": "Ariel"
   },
   {
    "id": "asura",
    "name": "Asura"
   },
   {
    "id": "biscuit",
    "name": "Biscuit"
   },
   {
    "id": "chancellor",
    "name": "Chancellor"
   }
  ]
 },
 {
  "en": "Defense Reduction (Stacks)",
  "vi": "Giảm Defense (cộng dồn)",
  "desc": "Giảm Defense đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "eileene",
    "name": "Eileene"
   },
   {
    "id": "freyja",
    "name": "Freyja"
   }
  ]
 },
 {
  "en": "Defense-Based Block Rate Boost",
  "vi": "Tăng Block Rate theo Defense",
  "desc": "Tăng Block Rate theo Defense của bản thân.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "gelidus",
    "name": "Gelidus"
   },
   {
    "id": "giyu-tomioka",
    "name": "Giyu Tomioka"
   }
  ]
 },
 {
  "en": "Defensive Posture (Stacks)",
  "vi": "Thế thủ (cộng dồn)",
  "desc": "Tăng Defense thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "rudy",
    "name": "Rudy"
   }
  ]
 },
 {
  "en": "Delayed Buff",
  "vi": "Buff trì hoãn",
  "desc": "Khi buff hết hạn sau một số lượt nhất định, nhận All Damage Nullification và tăng Physical Attack trong một thời gian. Nếu buff hết hạn sớm hơn, hiệu ứng tiếp theo không kích hoạt — trừ khi bị ép hết hạn bởi Buff Duration Reduction.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "tanjiro-kamado",
    "name": "Tanjiro Kamado"
   }
  ]
 },
 {
  "en": "Demon Face (Stacks)",
  "vi": "Mặt quỷ (cộng dồn)",
  "desc": "Tăng Physical Attack và Crit Damage thêm một lượng nhất định theo số cộng dồn.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "sunran",
    "name": "Sunran"
   }
  ]
 },
 {
  "en": "Detonates Bombs",
  "vi": "Kích nổ bom",
  "desc": "Kích nổ bom trên mục tiêu để gây sát thương. Sát thương tăng theo số bom được kích nổ.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "colt",
    "name": "Colt"
   }
  ]
 },
 {
  "en": "Divinity (Stacks)",
  "vi": "Thần tính (cộng dồn)",
  "desc": "Tăng Magic Attack thêm một lượng nhất định theo số cộng dồn.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "freyja",
    "name": "Freyja"
   }
  ]
 },
 {
  "en": "Dragonflame",
  "vi": "Lửa rồng",
  "desc": "Gây sát thương bằng một tỉ lệ nhất định của Attack của người thi triển mỗi lượt. Được tính là hiệu ứng Burn.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "jave",
    "name": "Jave"
   }
  ]
 },
 {
  "en": "Earth Dragon's Fury",
  "vi": "Thịnh nộ rồng đất",
  "desc": "Khi bị địch tấn công, nhận cộng dồn tăng sát thương gây ra và Physical Attack.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "aris",
    "name": "Aris"
   }
  ]
 },
 {
  "en": "Effect Hit Rate Boost",
  "vi": "Tăng Effect Hit Rate",
  "desc": "Tăng Effect Hit Rate thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "ace",
    "name": "Ace"
   },
   {
    "id": "amelia",
    "name": "Amelia"
   },
   {
    "id": "bane",
    "name": "Bane"
   },
   {
    "id": "clemyth",
    "name": "Clemyth"
   },
   {
    "id": "colt",
    "name": "Colt"
   }
  ]
 },
 {
  "en": "Effect Probability Boost",
  "vi": "Tăng Effect Probability",
  "desc": "Tăng Effect Probability thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "bai-jiao",
    "name": "Bai Jiao"
   },
   {
    "id": "cha-hae-in",
    "name": "Cha Hae-in"
   },
   {
    "id": "rosie",
    "name": "Rosie"
   }
  ]
 },
 {
  "en": "Effect Probability Reduction",
  "vi": "Giảm Effect Probability",
  "desc": "Giảm Effect Probability đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "gelidus",
    "name": "Gelidus"
   },
   {
    "id": "orkah",
    "name": "Orkah"
   }
  ]
 },
 {
  "en": "Effect Resist Boost",
  "vi": "Tăng Effect Resistance",
  "desc": "Tăng Effect Resistance thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "clemyth",
    "name": "Clemyth"
   },
   {
    "id": "eve",
    "name": "Eve"
   },
   {
    "id": "juri",
    "name": "Juri"
   },
   {
    "id": "karl-heron",
    "name": "Karl Heron"
   },
   {
    "id": "lina",
    "name": "Lina"
   }
  ]
 },
 {
  "en": "Effect Resist Reduction",
  "vi": "Giảm Effect Resistance",
  "desc": "Giảm Effect Resistance đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "knox",
    "name": "Knox"
   },
   {
    "id": "mercure",
    "name": "Mercure"
   },
   {
    "id": "rosie",
    "name": "Rosie"
   },
   {
    "id": "shinobu-kocho",
    "name": "Shinobu Kocho"
   },
   {
    "id": "skuld",
    "name": "Skuld"
   }
  ]
 },
 {
  "en": "Execution",
  "vi": "Kết liễu",
  "desc": "Hạ gục ngay lập tức các mục tiêu có HP dưới một tỉ lệ nhất định (không có tác dụng với mục tiêu có HP vượt quá 120% Attack của người dùng).",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "branze-bransel",
    "name": "Branze & Bransel"
   },
   {
    "id": "dellons",
    "name": "Dellons"
   },
   {
    "id": "fai",
    "name": "Fai"
   },
   {
    "id": "zenitsu-agatsuma",
    "name": "Zenitsu Agatsuma"
   }
  ]
 },
 {
  "en": "Extreme Chill",
  "vi": "Cực hàn",
  "desc": "Không thể hành động trong thời gian hiệu lực; hiệu ứng bị xóa khi bị đòn đánh của địch trúng, kẻ tấn công được hồi HP theo sát thương gây ra, và khi bị xóa gây sát thương bỏ qua Defense theo Max HP của mục tiêu. Được tính là hiệu ứng Freeze, và mục tiêu đang chịu Extreme Chill không bị ảnh hưởng bởi Freeze.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "gelidus",
    "name": "Gelidus"
   }
  ]
 },
 {
  "en": "Eyes of the Strong",
  "vi": "Ánh mắt kẻ mạnh",
  "desc": "Người dùng nhắm vào một mục tiêu và ưu tiên tấn công chúng; một số kỹ năng gây thêm sát thương lên mục tiêu này. Hiệu ứng cố định một mục tiêu mỗi vòng.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "kyle",
    "name": "Kyle"
   }
  ]
 },
 {
  "en": "Fear",
  "vi": "Sợ hãi",
  "desc": "Không thể hành động trong thời gian hiệu ứng còn tác dụng, và Effect Resistance được đặt thành 0%.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "dongyoung",
    "name": "Dongyoung"
   },
   {
    "id": "mist",
    "name": "Mist"
   }
  ]
 },
 {
  "en": "Final Judgment",
  "vi": "Phán quyết cuối cùng",
  "desc": "Toàn bộ sát thương bỏ qua một tỉ lệ nhất định của Defense của mục tiêu; đồng thời tăng Effect Resistance của người dùng và hồi lại thời gian hồi chiêu của kỹ năng.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "reginleif",
    "name": "Reginleif"
   }
  ]
 },
 {
  "en": "Focus Target",
  "vi": "Mục tiêu ưu tiên",
  "desc": "Trở thành mục tiêu của mọi đòn tấn công của địch, trừ đòn phản công. Chỉ một hero trong đội có thể có hiệu ứng Taunt hoặc Focus Target đang hoạt động tại một thời điểm.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "asura",
    "name": "Asura"
   }
  ]
 },
 {
  "en": "Follow-Up Attack",
  "vi": "Đánh theo",
  "desc": "Khi một đồng minh dùng đòn đánh thường, sẽ thực hiện một đòn follow-up lên cùng mục tiêu đó.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "ballista",
    "name": "Ballista"
   },
   {
    "id": "juri",
    "name": "Juri"
   }
  ]
 },
 {
  "en": "Follow-Up Chance Boost",
  "vi": "Tăng tỉ lệ đánh theo",
  "desc": "Tăng tỉ lệ Follow-Up thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "ballista",
    "name": "Ballista"
   },
   {
    "id": "juri",
    "name": "Juri"
   }
  ]
 },
 {
  "en": "Freeze",
  "vi": "Đóng băng",
  "desc": "Không thể hành động trong thời gian hiệu ứng; Freeze bị xóa khi bị đòn đánh của địch trúng, và khi bị xóa, mục tiêu chịu sát thương bỏ qua Defense theo Max HP của chúng.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "heavenia",
    "name": "Heavenia"
   },
   {
    "id": "lania",
    "name": "Lania"
   },
   {
    "id": "spike",
    "name": "Spike"
   }
  ]
 },
 {
  "en": "Freeze Immunity",
  "vi": "Miễn nhiễm đóng băng",
  "desc": "Miễn nhiễm Freeze.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "feng-yan",
    "name": "Feng Yan"
   },
   {
    "id": "lania",
    "name": "Lania"
   }
  ]
 },
 {
  "en": "Guardian Spirit",
  "vi": "Linh hồn hộ vệ",
  "desc": "Khi buff hết hạn sau một số lượt nhất định, mục tiêu nhận All Damage Immunity và Crowd Control Immunity trong một thời gian. Nếu buff hết hạn sớm hơn, hiệu ứng tiếp theo không kích hoạt — trừ khi bị ép hết hạn bởi Buff Duration Reduction.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "omok",
    "name": "O'Mok"
   }
  ]
 },
 {
  "en": "Guts",
  "vi": "Kiên cường",
  "desc": "Sống sót với 1 HP khi nhận sát thương chí mạng lần đầu tiên.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "ace",
    "name": "Ace"
   },
   {
    "id": "branze-bransel",
    "name": "Branze & Bransel"
   },
   {
    "id": "colt",
    "name": "Colt"
   },
   {
    "id": "dellons",
    "name": "Dellons"
   },
   {
    "id": "eve",
    "name": "Eve"
   }
  ]
 },
 {
  "en": "Guts upon revival",
  "vi": "Guts khi hồi sinh",
  "desc": "Sống sót với 1 HP khi nhận sát thương chí mạng lần đầu tiên.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "rosie",
    "name": "Rosie"
   }
  ]
 },
 {
  "en": "Hawk's Talons (Stacks)",
  "vi": "Móng diều hâu (cộng dồn)",
  "desc": "Tăng sát thương vật lý mục tiêu nhận vào thêm một lượng nhất định theo số cộng dồn.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "taka",
    "name": "Taka"
   }
  ]
 },
 {
  "en": "HP Alteration",
  "vi": "Đặt lại HP",
  "desc": "Đặt HP của mục tiêu về một mức nhất định. Sẽ không thay đổi HP của mục tiêu nếu HP hiện tại của chúng thấp hơn mức đó.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "amelia",
    "name": "Amelia"
   },
   {
    "id": "freyja",
    "name": "Freyja"
   },
   {
    "id": "judas",
    "name": "Judas"
   },
   {
    "id": "li",
    "name": "Li"
   },
   {
    "id": "noho",
    "name": "Noho"
   }
  ]
 },
 {
  "en": "HP Swap",
  "vi": "Hoán đổi HP",
  "desc": "Hoán đổi HP của bạn với mục tiêu. Không kích hoạt nếu HP của người dùng thấp hơn sau khi hoán đổi so với trước đó.",
  "desc_verified": true,
  "category": "Khac",
  "examples": [
   {
    "id": "hayeon",
    "name": "Hayeon"
   },
   {
    "id": "pallanus",
    "name": "Pallanus"
   }
  ]
 },
 {
  "en": "Hunter's Expertise (Stacks)",
  "vi": "Chuyên môn thợ săn (cộng dồn)",
  "desc": "Tăng sát thương vật lý gây ra thêm một lượng nhất định theo số cộng dồn.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "snipper",
    "name": "Snipper"
   }
  ]
 },
 {
  "en": "Ignore Defense",
  "vi": "Xuyên giáp",
  "desc": "Bỏ qua một tỉ lệ nhất định của Defense của mục tiêu.",
  "desc_verified": true,
  "category": "Khac",
  "examples": [
   {
    "id": "ace",
    "name": "Ace"
   },
   {
    "id": "aris",
    "name": "Aris"
   },
   {
    "id": "bai-long",
    "name": "Bai Long"
   },
   {
    "id": "biscuit",
    "name": "Biscuit"
   },
   {
    "id": "eve",
    "name": "Eve"
   }
  ]
 },
 {
  "en": "Immortality",
  "vi": "Bất tử",
  "desc": "HP được đặt thành 1 trong thời gian hiệu ứng còn tác dụng. Tướng sẽ ngã xuống khi hiệu ứng hết hạn.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "bane",
    "name": "Bane"
   },
   {
    "id": "clemyth",
    "name": "Clemyth"
   },
   {
    "id": "eve",
    "name": "Eve"
   },
   {
    "id": "juri",
    "name": "Juri"
   },
   {
    "id": "kris",
    "name": "Kris"
   }
  ]
 },
 {
  "en": "Incoming Barrier Reduction",
  "vi": "Giảm khiên nhận vào",
  "desc": "Giảm Incoming Barrier đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "eve",
    "name": "Eve"
   },
   {
    "id": "skuld",
    "name": "Skuld"
   }
  ]
 },
 {
  "en": "Incoming Healing Boost",
  "vi": "Tăng hồi HP nhận vào",
  "desc": "Tăng Incoming Healing thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "alice",
    "name": "Alice"
   },
   {
    "id": "clemyth",
    "name": "Clemyth"
   },
   {
    "id": "pallanus",
    "name": "Pallanus"
   },
   {
    "id": "silvesta",
    "name": "Silvesta"
   }
  ]
 },
 {
  "en": "Incoming Healing Reduction",
  "vi": "Giảm hồi HP nhận vào",
  "desc": "Giảm Incoming Healing đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "ace",
    "name": "Ace"
   },
   {
    "id": "aris",
    "name": "Aris"
   },
   {
    "id": "diaochan",
    "name": "Diaochan"
   },
   {
    "id": "eve",
    "name": "Eve"
   },
   {
    "id": "kagura",
    "name": "Kagura"
   }
  ]
 },
 {
  "en": "Incoming Healing Reduction (Stacks)",
  "vi": "Giảm hồi HP nhận vào (cộng dồn)",
  "desc": "Giảm Incoming Healing đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "dongyoung",
    "name": "Dongyoung"
   },
   {
    "id": "eileene",
    "name": "Eileene"
   }
  ]
 },
 {
  "en": "Increased Miss Chance",
  "vi": "Tăng tỉ lệ trượt",
  "desc": "Tăng tỉ lệ đánh trượt thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "ariel",
    "name": "Ariel"
   },
   {
    "id": "chancellor",
    "name": "Chancellor"
   },
   {
    "id": "elysia",
    "name": "Elysia"
   },
   {
    "id": "hellenia",
    "name": "Hellenia"
   },
   {
    "id": "li",
    "name": "Li"
   }
  ]
 },
 {
  "en": "Indomitable",
  "vi": "Bất khuất",
  "desc": "Khi ngã xuống, mục tiêu hồi sinh với 1 HP và không thể ngã xuống lần nữa cho đến khi nhận một số đòn đánh nhất định. Khi một địch ngã xuống trong trận, số đòn cần thiết tăng thêm.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "dongyoung",
    "name": "Dongyoung"
   },
   {
    "id": "kagura",
    "name": "Kagura"
   },
   {
    "id": "randgrid",
    "name": "Randgrid"
   },
   {
    "id": "tanjiro-kamado",
    "name": "Tanjiro Kamado"
   }
  ]
 },
 {
  "en": "Level Up (Stacks)",
  "vi": "Tăng cấp (cộng dồn)",
  "desc": "Tăng All Attack thêm một lượng nhất định theo số cộng dồn. Cấp độ đã tăng được duy trì ngay cả khi ngã xuống trong trận đấu.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "sung-jinwoo",
    "name": "Sung Jinwoo"
   }
  ]
 },
 {
  "en": "Life Drain",
  "vi": "Hút máu",
  "desc": "Hồi HP bằng một tỉ lệ nhất định của sát thương gây ra.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "leo",
    "name": "Leo"
   },
   {
    "id": "miho",
    "name": "Miho"
   }
  ]
 },
 {
  "en": "Link",
  "vi": "Liên kết",
  "desc": "Chia đều sát thương nhận vào cho các đồng minh được liên kết. Sát thương cố định không được chia sẻ.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "aquila",
    "name": "Aquila"
   },
   {
    "id": "rudy",
    "name": "Rudy"
   }
  ]
 },
 {
  "en": "Magic Attack Boost",
  "vi": "Tăng Magic Attack",
  "desc": "Tăng Magic Attack thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "cleo",
    "name": "Cleo"
   },
   {
    "id": "daisy",
    "name": "Daisy"
   },
   {
    "id": "lania",
    "name": "Lania"
   },
   {
    "id": "noho",
    "name": "Noho"
   },
   {
    "id": "omok",
    "name": "O'Mok"
   }
  ]
 },
 {
  "en": "Magic Attack Boost (Stacks)",
  "vi": "Tăng Magic Attack (cộng dồn)",
  "desc": "Tăng Magic Attack thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "silvesta",
    "name": "Silvesta"
   }
  ]
 },
 {
  "en": "Magic Attack Reduction",
  "vi": "Giảm Magic Attack",
  "desc": "Giảm Magic Attack đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "yui",
    "name": "Yui"
   }
  ]
 },
 {
  "en": "Magic Bond",
  "vi": "Liên kết Magic",
  "desc": "Khi bắt đầu trận đấu, nhận thêm hiệu ứng dựa trên số đồng minh cùng loại trong đội.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "melia",
    "name": "Melia"
   }
  ]
 },
 {
  "en": "Magic Damage Boost",
  "vi": "Tăng sát thương Magic",
  "desc": "Tăng sát thương Magic gây ra thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "ariel",
    "name": "Ariel"
   },
   {
    "id": "dongyoung",
    "name": "Dongyoung"
   },
   {
    "id": "kyrielle",
    "name": "Kyrielle"
   },
   {
    "id": "omok",
    "name": "O'Mok"
   },
   {
    "id": "ruri",
    "name": "Ruri"
   }
  ]
 },
 {
  "en": "Magic Damage Immunity",
  "vi": "Miễn nhiễm sát thương Magic",
  "desc": "Miễn nhiễm sát thương Magic.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "hellenia",
    "name": "Hellenia"
   }
  ]
 },
 {
  "en": "Magic Reflux",
  "vi": "Hồi lưu Magic",
  "desc": "Khi bị trúng đòn tấn công của địch trong thời gian hiệu lực, mục tiêu chịu sát thương theo Max HP của chúng; nếu hiệu ứng hết thời gian hoặc mục tiêu gục ngã, Magic Reflux có tỉ lệ lan sang các mục tiêu khác trong đội. Tối đa 7 cộng dồn.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "mercure",
    "name": "Mercure"
   }
  ]
 },
 {
  "en": "Magic Resistance",
  "vi": "Kháng Magic",
  "desc": "Giảm sát thương Magic nhận vào đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "espada",
    "name": "Espada"
   },
   {
    "id": "hellenia",
    "name": "Hellenia"
   },
   {
    "id": "shane",
    "name": "Shane"
   }
  ]
 },
 {
  "en": "Magic Vulnerability",
  "vi": "Dễ tổn thương Magic",
  "desc": "Tăng sát thương Magic mục tiêu nhận vào thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "dongyoung",
    "name": "Dongyoung"
   },
   {
    "id": "espada",
    "name": "Espada"
   },
   {
    "id": "melia",
    "name": "Melia"
   },
   {
    "id": "miho",
    "name": "Miho"
   },
   {
    "id": "skuld",
    "name": "Skuld"
   }
  ]
 },
 {
  "en": "Magic Vulnerability (Stacks)",
  "vi": "Dễ tổn thương Magic (cộng dồn)",
  "desc": "Tăng sát thương Magic nhận vào thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "reginleif",
    "name": "Reginleif"
   }
  ]
 },
 {
  "en": "Mark of Darkness",
  "vi": "Dấu ấn bóng tối",
  "desc": "Gây thêm sát thương lên mục tiêu khi người dùng tấn công. Hiệu ứng này được gắn cố định lên một số địch có Attack cao nhất mỗi vòng.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "judas",
    "name": "Judas"
   }
  ]
 },
 {
  "en": "Max HP-Based Attack Boost",
  "vi": "Tăng ATK theo Max HP",
  "desc": "Tăng Attack theo Max HP của bản thân.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "spike",
    "name": "Spike"
   }
  ]
 },
 {
  "en": "Max HP-Based Block Rate Boost",
  "vi": "Tăng Block Rate theo Max HP",
  "desc": "Tăng Block Rate theo Max HP của bản thân.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "clemyth",
    "name": "Clemyth"
   }
  ]
 },
 {
  "en": "Max HP-Based Defense Boost",
  "vi": "Tăng Defense theo Max HP",
  "desc": "Tăng Defense theo Max HP của bản thân.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "rosie",
    "name": "Rosie"
   }
  ]
 },
 {
  "en": "Max HP-Based Effect Hit Rate Boost",
  "vi": "Tăng Effect Hit Rate theo Max HP",
  "desc": "Tăng Effect Hit Rate theo Max HP của bản thân.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "diaochan",
    "name": "Diaochan"
   }
  ]
 },
 {
  "en": "Pain Endurance",
  "vi": "Chịu đau",
  "desc": "Khi nhận sát thương trực tiếp vượt quá một tỉ lệ nhất định của Max HP, một phần sát thương được chia đều trong một số lượt.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "giyu-tomioka",
    "name": "Giyu Tomioka"
   },
   {
    "id": "trude",
    "name": "Trude"
   }
  ]
 },
 {
  "en": "Paralysis",
  "vi": "Tê liệt",
  "desc": "Không thể hành động trong thời gian hiệu ứng, và Block Rate bị đặt về 0%.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "cha-hae-in",
    "name": "Cha Hae-in"
   },
   {
    "id": "hayeon",
    "name": "Hayeon"
   },
   {
    "id": "kyrielle",
    "name": "Kyrielle"
   },
   {
    "id": "reginleif",
    "name": "Reginleif"
   },
   {
    "id": "yu-shin",
    "name": "Yu Shin"
   }
  ]
 },
 {
  "en": "Paralysis Immunity",
  "vi": "Miễn nhiễm tê liệt",
  "desc": "Miễn nhiễm Paralysis.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "victoria",
    "name": "Victoria"
   },
   {
    "id": "xiao-qiao",
    "name": "Xiao Qiao"
   }
  ]
 },
 {
  "en": "Perseverance (Stacks)",
  "vi": "Kiên trì (cộng dồn)",
  "desc": "Tăng Defense thêm một lượng nhất định theo số cộng dồn.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "karma",
    "name": "Karma"
   }
  ]
 },
 {
  "en": "Petrify",
  "vi": "Hóa đá",
  "desc": "Không thể hành động trong thời gian hiệu ứng, và mục tiêu bị ảnh hưởng sẽ nhận sát thương bằng một tỉ lệ nhất định của Attack của người dùng khi hiệu ứng kết thúc.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "cleo",
    "name": "Cleo"
   },
   {
    "id": "kagura",
    "name": "Kagura"
   },
   {
    "id": "sun-wukong",
    "name": "Sun Wukong"
   },
   {
    "id": "vanessa",
    "name": "Vanessa"
   }
  ]
 },
 {
  "en": "Petrify Immunity",
  "vi": "Miễn nhiễm hóa đá",
  "desc": "Miễn nhiễm Petrify.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "black-rose",
    "name": "Black Rose"
   },
   {
    "id": "daisy",
    "name": "Daisy"
   }
  ]
 },
 {
  "en": "Physical Attack Boost",
  "vi": "Tăng Physical Attack",
  "desc": "Tăng Physical Attack thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "black-rose",
    "name": "Black Rose"
   },
   {
    "id": "branze-bransel",
    "name": "Branze & Bransel"
   },
   {
    "id": "catty",
    "name": "Catty"
   },
   {
    "id": "eileene",
    "name": "Eileene"
   },
   {
    "id": "eve",
    "name": "Eve"
   }
  ]
 },
 {
  "en": "Physical Attack Boost (Stacks)",
  "vi": "Tăng Physical Attack (cộng dồn)",
  "desc": "Tăng Physical Attack thêm một lượng nhất định theo số cộng dồn.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "judas",
    "name": "Judas"
   }
  ]
 },
 {
  "en": "Physical Attack Reduction",
  "vi": "Giảm Physical Attack",
  "desc": "Giảm Physical Attack đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "bane",
    "name": "Bane"
   },
   {
    "id": "cleo",
    "name": "Cleo"
   },
   {
    "id": "li",
    "name": "Li"
   },
   {
    "id": "lucy",
    "name": "Lucy"
   }
  ]
 },
 {
  "en": "Physical Damage Boost",
  "vi": "Tăng sát thương vật lý",
  "desc": "Tăng sát thương Physical gây ra thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "bi-dam",
    "name": "Bi Dam"
   },
   {
    "id": "dellons",
    "name": "Dellons"
   },
   {
    "id": "guan-yu",
    "name": "Guan Yu"
   },
   {
    "id": "hokin",
    "name": "Hokin"
   },
   {
    "id": "kagura",
    "name": "Kagura"
   }
  ]
 },
 {
  "en": "Physical Damage Boost (Stacks)",
  "vi": "Tăng sát thương vật lý (cộng dồn)",
  "desc": "Tăng sát thương Physical gây ra thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "pallanus",
    "name": "Pallanus"
   }
  ]
 },
 {
  "en": "Physical Damage Immunity",
  "vi": "Miễn nhiễm sát thương vật lý",
  "desc": "Miễn nhiễm với sát thương Physical.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "hokin",
    "name": "Hokin"
   },
   {
    "id": "li",
    "name": "Li"
   },
   {
    "id": "ryan",
    "name": "Ryan"
   },
   {
    "id": "zhao-yun",
    "name": "Zhao Yun"
   }
  ]
 },
 {
  "en": "Physical Enhancement: Crystal Dragon",
  "vi": "Cường hóa vật lý: rồng tinh thể",
  "desc": "Tăng Defense và HP cơ bản của bản thân.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "melia",
    "name": "Melia"
   }
  ]
 },
 {
  "en": "Physical Resistance",
  "vi": "Kháng vật lý",
  "desc": "Giảm sát thương Physical nhận vào đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "li",
    "name": "Li"
   },
   {
    "id": "rahkun",
    "name": "Rahkun"
   },
   {
    "id": "victoria",
    "name": "Victoria"
   }
  ]
 },
 {
  "en": "Physical Vulnerability",
  "vi": "Dễ tổn thương vật lý",
  "desc": "Tăng sát thương Physical nhận vào thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "ace",
    "name": "Ace"
   },
   {
    "id": "catty",
    "name": "Catty"
   },
   {
    "id": "fai",
    "name": "Fai"
   },
   {
    "id": "heavenia",
    "name": "Heavenia"
   },
   {
    "id": "kagura",
    "name": "Kagura"
   }
  ]
 },
 {
  "en": "Pierce",
  "vi": "Xuyên thủng",
  "desc": "Bỏ qua các hiệu ứng miễn nhiễm sát thương trên mục tiêu.",
  "desc_verified": true,
  "category": "Khac",
  "examples": [
   {
    "id": "aragon",
    "name": "Aragon"
   },
   {
    "id": "aris",
    "name": "Aris"
   },
   {
    "id": "ballista",
    "name": "Ballista"
   },
   {
    "id": "bi-dam",
    "name": "Bi Dam"
   },
   {
    "id": "branze-bransel",
    "name": "Branze & Bransel"
   }
  ]
 },
 {
  "en": "Pinnacle of Martial Arts",
  "vi": "Đỉnh cao võ thuật",
  "desc": "Giảm sát thương vật lý nhận vào, nhưng tăng sát thương Magic nhận vào.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "bai-long",
    "name": "Bai Long"
   }
  ]
 },
 {
  "en": "Poison",
  "vi": "Độc",
  "desc": "Gây sát thương bằng một tỉ lệ nhất định của Max HP của mục tiêu mỗi lượt. Sát thương này không thể vượt quá một tỉ lệ nhất định của Attack của người dùng.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "bai-jiao",
    "name": "Bai Jiao"
   },
   {
    "id": "cleo",
    "name": "Cleo"
   },
   {
    "id": "jane",
    "name": "Jane"
   },
   {
    "id": "jupy",
    "name": "Jupy"
   },
   {
    "id": "may",
    "name": "May"
   }
  ]
 },
 {
  "en": "Poison Immunity",
  "vi": "Miễn nhiễm độc",
  "desc": "Miễn nhiễm với Poison.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "lucy",
    "name": "Lucy"
   }
  ]
 },
 {
  "en": "Protection",
  "vi": "Bảo vệ",
  "desc": "Người dùng chịu một phần sát thương thay cho mục tiêu; lượng sát thương chịu thay được giảm thêm. Mục tiêu đang chịu Protection không thể nhận hiệu ứng Link.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "giyu-tomioka",
    "name": "Giyu Tomioka"
   },
   {
    "id": "hellenia",
    "name": "Hellenia"
   },
   {
    "id": "li",
    "name": "Li"
   },
   {
    "id": "radgrid",
    "name": "Radgrid"
   }
  ]
 },
 {
  "en": "Purified Magic (Stacks)",
  "vi": "Ma thuật thuần khiết (cộng dồn)",
  "desc": "Tăng sát thương Magic gây ra và Crit Rate thêm một lượng nhất định theo số cộng dồn.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "espada",
    "name": "Espada"
   }
  ]
 },
 {
  "en": "Quintuple-Target Attack Resistance",
  "vi": "Kháng sát thương 5 mục tiêu",
  "desc": "Giảm sát thương nhận từ các đòn tấn công 5 mục tiêu đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "biscuit",
    "name": "Biscuit"
   },
   {
    "id": "soi",
    "name": "Soi"
   }
  ]
 },
 {
  "en": "Reckless Valor",
  "vi": "Dũng khí liều lĩnh",
  "desc": "Tăng Physical Attack thêm một lượng nhất định nhưng giảm Magic Attack đi một lượng lớn.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "lu-bu",
    "name": "Lu Bu"
   }
  ]
 },
 {
  "en": "Resets all skill cooldowns",
  "vi": "Reset toàn bộ hồi chiêu",
  "desc": "Reset toàn bộ thời gian hồi chiêu của kỹ năng.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "cha-hae-in",
    "name": "Cha Hae-in"
   },
   {
    "id": "silvesta",
    "name": "Silvesta"
   }
  ]
 },
 {
  "en": "Resets the cooldown of [Dragon's Descent] upon defeating an enemy with damage from this skill",
  "vi": "Reset hồi chiêu [dragon's Descent] khi hạ địch",
  "desc": "Hồi lại thời gian hồi chiêu của kỹ năng Dragon's Descent khi hạ gục một địch bằng sát thương từ kỹ năng này.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "rin",
    "name": "Rin"
   }
  ]
 },
 {
  "en": "Resets the cooldown of [Undefeated Cavalier] upon defeating an enemy with damage from this skill",
  "vi": "Reset hồi chiêu [Undefeated Cavalier] khi hạ địch",
  "desc": "Hồi lại thời gian hồi chiêu của kỹ năng Undefeated Cavalier khi hạ gục một địch bằng sát thương từ kỹ năng này.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "randgrid",
    "name": "Randgrid"
   }
  ]
 },
 {
  "en": "Revive",
  "vi": "Hồi sinh",
  "desc": "Hồi sinh một tướng đã ngã xuống với một lượng HP nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "amelia",
    "name": "Amelia"
   },
   {
    "id": "aris",
    "name": "Aris"
   },
   {
    "id": "branze-bransel",
    "name": "Branze & Bransel"
   },
   {
    "id": "cha-hae-in",
    "name": "Cha Hae-in"
   },
   {
    "id": "clemyth",
    "name": "Clemyth"
   }
  ]
 },
 {
  "en": "Revives with 80% HP upon falling in battle",
  "vi": "Hồi sinh với 80% HP",
  "desc": "Hồi sinh với 80% HP khi ngã xuống trong trận.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "leo",
    "name": "Leo"
   },
   {
    "id": "yuri",
    "name": "Yuri"
   }
  ]
 },
 {
  "en": "Shock",
  "vi": "Sốc điện",
  "desc": "Không thể hành động trong thời gian hiệu ứng còn tác dụng, và khi bị trúng đòn tấn công của địch, mục tiêu bị ảnh hưởng sẽ nhận thêm sát thương bằng một tỉ lệ nhất định của Attack của người dùng.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "eileene",
    "name": "Eileene"
   },
   {
    "id": "karl-heron",
    "name": "Karl Heron"
   },
   {
    "id": "nia",
    "name": "Nia"
   },
   {
    "id": "zenitsu-agatsuma",
    "name": "Zenitsu Agatsuma"
   }
  ]
 },
 {
  "en": "Shock Immunity",
  "vi": "Miễn nhiễm sốc điện",
  "desc": "Miễn nhiễm Shock.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "chloe",
    "name": "Chloe"
   },
   {
    "id": "guan-yu",
    "name": "Guan Yu"
   }
  ]
 },
 {
  "en": "Shock Probability Boost",
  "vi": "Tăng tỉ lệ sốc điện",
  "desc": "Tăng Shock Probability thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "eileene",
    "name": "Eileene"
   }
  ]
 },
 {
  "en": "Silence",
  "vi": "Câm lặng",
  "desc": "Không thể dùng active skill trong thời gian hiệu ứng còn tác dụng.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "bane",
    "name": "Bane"
   },
   {
    "id": "dellons",
    "name": "Dellons"
   },
   {
    "id": "elysia",
    "name": "Elysia"
   },
   {
    "id": "skuld",
    "name": "Skuld"
   },
   {
    "id": "velika",
    "name": "Velika"
   }
  ]
 },
 {
  "en": "Silence Immunity",
  "vi": "Miễn nhiễm câm lặng",
  "desc": "Miễn nhiễm Silence.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "cleo",
    "name": "Cleo"
   },
   {
    "id": "deo",
    "name": "Deo"
   },
   {
    "id": "jin",
    "name": "Jin"
   },
   {
    "id": "yoo-jinho",
    "name": "Yoo Jinho"
   }
  ]
 },
 {
  "en": "Single-Target Attack Damage Boost",
  "vi": "Tăng sát thương tấn công đơn mục tiêu",
  "desc": "Tăng sát thương gây ra lên mục tiêu đơn thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "xiao",
    "name": "Xiao"
   }
  ]
 },
 {
  "en": "Skill Cooldown Increase",
  "vi": "Tăng hồi chiêu kỹ năng",
  "desc": "Tăng thời gian hồi chiêu của kỹ năng.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "hayeon",
    "name": "Hayeon"
   },
   {
    "id": "nia",
    "name": "Nia"
   },
   {
    "id": "skuld",
    "name": "Skuld"
   },
   {
    "id": "vanessa",
    "name": "Vanessa"
   }
  ]
 },
 {
  "en": "Skill Cooldown Reset upon gaining Immortality",
  "vi": "Reset hồi chiêu khi bất tử",
  "desc": "Đặt lại hồi chiêu của kỹ năng khi nhận Immortality.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "kris",
    "name": "Kris"
   },
   {
    "id": "teo",
    "name": "Teo"
   }
  ]
 },
 {
  "en": "Sleep",
  "vi": "Ngủ",
  "desc": "Không thể hành động trong thời gian hiệu ứng, và mọi đòn tấn công vào mục tiêu bị ảnh hưởng đều là Guaranteed Critical Hits. Hiệu ứng bị xóa khi mục tiêu nhận sát thương bằng một tỉ lệ nhất định của Max HP trở lên, bất kể còn bao nhiêu lượt hiệu lực.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "diaochan",
    "name": "Diaochan"
   },
   {
    "id": "yeonhee",
    "name": "Yeonhee"
   }
  ]
 },
 {
  "en": "Sleep Immunity",
  "vi": "Miễn nhiễm ngủ",
  "desc": "Miễn nhiễm với Sleep.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "sarah",
    "name": "Sarah"
   }
  ]
 },
 {
  "en": "Sniper Stance",
  "vi": "Thế bắn tỉa",
  "desc": "Đổi kỹ năng Sniper Stance thành Swift Shots trong thời gian hiệu lực.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "jupy",
    "name": "Jupy"
   }
  ]
 },
 {
  "en": "Souldeath",
  "vi": "Tử hồn",
  "desc": "Ngã xuống trong trận chiến khi đang chịu Souldeath sẽ ngăn Revive, Immortality và Indomitable kích hoạt.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "juri",
    "name": "Juri"
   }
  ]
 },
 {
  "en": "Speed-Based Attack Boost",
  "vi": "Tăng ATK theo Speed",
  "desc": "Tăng Attack theo Speed của bản thân.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "colt",
    "name": "Colt"
   },
   {
    "id": "kyrielle",
    "name": "Kyrielle"
   }
  ]
 },
 {
  "en": "Spot",
  "vi": "Điểm yếu",
  "desc": "Tăng sát thương gây ra và Defense thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "giyu-tomioka",
    "name": "Giyu Tomioka"
   }
  ]
 },
 {
  "en": "stack(s) of Divinity",
  "vi": "Cộng dồn thần tính",
  "desc": "Tăng Magic Attack thêm một lượng nhất định theo số cộng dồn.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "freyja",
    "name": "Freyja"
   }
  ]
 },
 {
  "en": "Stun",
  "vi": "Choáng",
  "desc": "Không thể hành động trong thời gian hiệu ứng.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "aragon",
    "name": "Aragon"
   },
   {
    "id": "aris",
    "name": "Aris"
   },
   {
    "id": "evan",
    "name": "Evan"
   },
   {
    "id": "hokin",
    "name": "Hokin"
   },
   {
    "id": "jave",
    "name": "Jave"
   }
  ]
 },
 {
  "en": "Stun Immunity",
  "vi": "Miễn nhiễm choáng",
  "desc": "Miễn nhiễm Stun.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "evan",
    "name": "Evan"
   },
   {
    "id": "sieg",
    "name": "Sieg"
   }
  ]
 },
 {
  "en": "Taunt",
  "vi": "Khiêu khích",
  "desc": "Khiêu khích địch, trở thành mục tiêu của hầu hết đòn tấn công của chúng. Mỗi đội chỉ có một hero được duy trì hiệu ứng Taunt hoặc Focus Target tại một thời điểm.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "hellenia",
    "name": "Hellenia"
   },
   {
    "id": "knox",
    "name": "Knox"
   },
   {
    "id": "li",
    "name": "Li"
   },
   {
    "id": "melia",
    "name": "Melia"
   },
   {
    "id": "rahkun",
    "name": "Rahkun"
   }
  ]
 },
 {
  "en": "Threads of Fate",
  "vi": "Sợi chỉ định mệnh",
  "desc": "Nếu có 3 Threads of Fate, tiêu hao toàn bộ Threads of Fate rồi nhận All Damage Nullification.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "skuld",
    "name": "Skuld"
   }
  ]
 },
 {
  "en": "Thunderbolt Mark",
  "vi": "Dấu ấn sấm sét",
  "desc": "Áp dụng hiệu ứng bổ sung lên mục tiêu khi người dùng dùng kỹ năng; Crit Rate và Weakness Hit Chance của mục tiêu chịu dấu ấn bị giảm. Hiệu ứng này cố định một mục tiêu mỗi vòng.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "karl-heron",
    "name": "Karl Heron"
   }
  ]
 },
 {
  "en": "Tower's Benevolence",
  "vi": "Ân huệ của tháp",
  "desc": "Có thể triển khai các unit trong Infinite Tower mà không bị giới hạn vai trò.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "velika",
    "name": "Velika"
   }
  ]
 },
 {
  "en": "Toxic Build-Up (Stacks)",
  "vi": "Tích độc (cộng dồn)",
  "desc": "Tăng Magic Attack thêm một lượng nhất định theo số cộng dồn. Khi đủ cộng dồn, các đòn tấn công gây thêm hiệu ứng Không thể hồi HP hoặc Chặn Buff lên địch.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "shinobu-kocho",
    "name": "Shinobu Kocho"
   }
  ]
 },
 {
  "en": "Transformation",
  "vi": "Biến hình",
  "desc": "Biến đổi hình dạng; đòn đánh thường và kỹ năng được đổi dạng trong thời gian hiệu lực, đồng thời miễn nhiễm khống chế.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "dellons",
    "name": "Dellons"
   }
  ]
 },
 {
  "en": "Transparent World",
  "vi": "Thế giới trong suốt",
  "desc": "Mọi đòn tấn công đều có Pierce; tăng tỉ lệ đánh điểm yếu thêm một lượng lớn.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "tanjiro-kamado",
    "name": "Tanjiro Kamado"
   }
  ]
 },
 {
  "en": "Triple-Target Attack Damage Boost",
  "vi": "Tăng sát thương tấn công 3 mục tiêu",
  "desc": "Tăng sát thương Triple-Target Attack gây ra thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "nezha",
    "name": "Nezha"
   },
   {
    "id": "ryan",
    "name": "Ryan"
   }
  ]
 },
 {
  "en": "Unable to Recover",
  "vi": "Không thể hồi HP",
  "desc": "Không thể hồi HP.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "amelia",
    "name": "Amelia"
   },
   {
    "id": "bai-jiao",
    "name": "Bai Jiao"
   },
   {
    "id": "catty",
    "name": "Catty"
   },
   {
    "id": "chloe",
    "name": "Chloe"
   },
   {
    "id": "guan-yu",
    "name": "Guan Yu"
   }
  ]
 },
 {
  "en": "Unfair Contract",
  "vi": "Khế ước bất công",
  "desc": "Nhận các hiệu ứng khác nhau dựa trên vị trí của đồng minh: hàng trước được tăng hồi chiêu nhưng hồi HP, hàng sau được tăng Physical Attack và tăng số lần trúng của Damage Nullification.",
  "desc_verified": true,
  "category": "Khac",
  "examples": [
   {
    "id": "orkah",
    "name": "Orkah"
   }
  ]
 },
 {
  "en": "Upper Hand",
  "vi": "Thế thượng phong",
  "desc": "Khi nhận đòn từ sát thương trực tiếp, nếu Attack của bản thân cao hơn kẻ tấn công, đòn đánh chắc chắn trượt và mọi sát thương nhận vào được giảm. Ngoài ra có tỉ lệ gây giảm Defense và tăng tỉ lệ trượt cho kẻ tấn công trong một thời gian.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "sunran",
    "name": "Sunran"
   }
  ]
 },
 {
  "en": "Weakness Hit Chance Boost",
  "vi": "Tăng tỉ lệ đánh điểm yếu",
  "desc": "Tăng Weakness Hit Chance thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "asura",
    "name": "Asura"
   },
   {
    "id": "biscuit",
    "name": "Biscuit"
   },
   {
    "id": "catty",
    "name": "Catty"
   },
   {
    "id": "eve",
    "name": "Eve"
   },
   {
    "id": "giyu-tomioka",
    "name": "Giyu Tomioka"
   }
  ]
 },
 {
  "en": "Weakness Hit Chance Reduction",
  "vi": "Giảm tỉ lệ đánh điểm yếu",
  "desc": "Giảm Weakness Hit Chance đi một lượng nhất định.",
  "desc_verified": true,
  "category": "Debuff",
  "examples": [
   {
    "id": "aquila",
    "name": "Aquila"
   },
   {
    "id": "hellenia",
    "name": "Hellenia"
   },
   {
    "id": "omok",
    "name": "O'Mok"
   },
   {
    "id": "radgrid",
    "name": "Radgrid"
   },
   {
    "id": "rin",
    "name": "Rin"
   }
  ]
 },
 {
  "en": "Weakness Hit Damage Boost",
  "vi": "Tăng sát thương điểm yếu",
  "desc": "Tăng sát thương Weakness Hit thêm một lượng nhất định.",
  "desc_verified": true,
  "category": "Buff",
  "examples": [
   {
    "id": "eve",
    "name": "Eve"
   },
   {
    "id": "miho",
    "name": "Miho"
   },
   {
    "id": "randgrid",
    "name": "Randgrid"
   },
   {
    "id": "rin",
    "name": "Rin"
   },
   {
    "id": "ruri",
    "name": "Ruri"
   }
  ]
 }
];
