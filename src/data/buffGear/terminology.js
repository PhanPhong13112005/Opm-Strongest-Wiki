const term = (id, en, vi, explanationEn, explanationVi, confidence = 'confirmed') =>
  Object.freeze({ id, en, vi, explanationEn, explanationVi, confidence })

export const buffGearTerminology = Object.freeze([
  term('ATK', 'ATK', 'Công', 'Fixed attack value.', 'Giá trị Công cố định.'),
  term('HP', 'HP', 'Máu', 'Fixed health value.', 'Giá trị Máu cố định.'),
  term('DEF', 'DEF', 'Thủ', 'Fixed defense value.', 'Giá trị Thủ cố định.'),
  term('RED_DEF', 'Red. DEF', 'Bỏ qua/Xuyên DEF', "Attacks while disregarding part of the enemy's DEF; the exact amount is not verified.", 'Tấn công bỏ qua một phần DEF địch; mức bỏ qua chính xác chưa được xác minh.'),
  term('ATK_BONUS', 'ATK Bonus', '% ATK Bonus', 'A separate stat layer from ATK Boost.', 'Lớp chỉ số riêng, không đồng nhất với ATK Boost.'),
  term('HP_BONUS', 'HP Bonus', '% HP Bonus', 'A separate stat layer from HP Boost or HP Buff.', 'Lớp chỉ số riêng, không đồng nhất với HP Boost hay HP Buff.'),
  term('DEF_BONUS', 'DEF Bonus', '% DEF Bonus', 'A separate stat layer from DEF Boost.', 'Lớp chỉ số riêng, không đồng nhất với DEF Boost.'),
  term('SPD_BONUS', 'SPD Bonus', 'Tốc độ Bonus', 'The exact formula is not verified.', 'Công thức chính xác chưa được xác minh.'),
  term('CRIT', 'CRIT', 'Tỉ lệ chí mạng', 'Critical hit chance.', 'Tỉ lệ gây chí mạng.'),
  term('BLOCK', 'Block', 'Đỡ đòn', 'Block-related stat.', 'Chỉ số liên quan đến đỡ đòn.'),
  term('EFFECT_HIT', 'Effect Hit', 'Chính xác hiệu ứng', 'Chance-related effect accuracy stat.', 'Chỉ số chính xác hiệu ứng.'),
  term('EFFECT_RESIST', 'Effect Resist', 'Kháng hiệu ứng', 'Effect resistance stat.', 'Chỉ số kháng hiệu ứng.'),
  term('SKILL_DMG', 'Skill DMG', 'Sát thương kỹ năng', 'Skill damage layer.', 'Lớp sát thương kỹ năng.'),
  term('DMG_FREE', 'DMG Free', 'Giảm sát thương', 'Damage reduction layer; not the same as Bonus DMG Free.', 'Lớp giảm sát thương; không đồng nhất với Bonus DMG Free.'),
  term('BONUS_DMG', 'Bonus DMG', 'Sát thương cộng thêm', 'Increases extra damage.', 'Tăng sát thương cộng thêm.'),
  term('BONUS_DMG_FREE', 'Bonus DMG Free', 'Giảm sát thương cộng thêm', 'Reduces extra damage from enemies.', 'Giảm sát thương cộng thêm nhận từ địch.'),
  term('HIT', 'Hit', 'Chính xác', 'Purification Hit stat.', 'Chỉ số Chính xác từ Tẩy luyện.'),
  term('RES', 'Res', 'Kháng', 'Purification resistance stat.', 'Chỉ số Kháng từ Tẩy luyện.'),
  term('FACTION_DMG_PLUS', 'Faction DMG+', 'Tăng sát thương Phe', 'Faction damage increase layer.', 'Lớp tăng sát thương theo Phe.'),
  term('FACTION_DMG_FREE', 'Faction DMG Free', 'Giảm sát thương Phe', 'Faction damage reduction layer.', 'Lớp giảm sát thương theo Phe.'),
  term('ARENA_DMG_PLUS', 'Arena DMG+', 'Tăng sát thương Đấu Trường', 'Arena damage increase layer.', 'Lớp tăng sát thương trong Đấu Trường.'),
  term('ARENA_DMG_FREE', 'Arena DMG Free', 'Giảm sát thương Đấu Trường', 'Arena damage reduction layer.', 'Lớp giảm sát thương trong Đấu Trường.'),
  term('BLOCK_RATE', 'Block Rate', 'Tỉ lệ đỡ đòn', 'Block rate refinement stat.', 'Chỉ số tỉ lệ đỡ đòn từ Tinh luyện.'),
  term('CRIT_DMG', 'CRIT DMG', 'Sát thương chí mạng', 'Critical damage refinement stat.', 'Chỉ số sát thương chí mạng từ Tinh luyện.'),
  term('SPD', 'SPD', 'Tốc độ', 'Speed refinement stat.', 'Chỉ số Tốc độ từ Tinh luyện.'),
  term('CRIT_RES_RATE', 'Crit Res Rate', 'Kháng chí mạng', 'Critical resistance rate.', 'Tỉ lệ kháng chí mạng.'),
  term('DMG_REFLECT', 'DMG Reflect', 'Phản sát thương', 'Damage reflection stat.', 'Chỉ số phản sát thương.'),
  term('DMG_RATE', 'DMG Rate', 'Tăng DMG Rate', 'A separate stat layer from Bonus DMG.', 'Lớp chỉ số riêng, không đồng nhất với Bonus DMG.'),
  term('HP_BUFF', 'HP Buff', 'HP Buff', 'Shown as a main-stat line in the confirmed example; stacking formula is unknown.', 'Dòng Main Stat trong ví dụ đã xác nhận; công thức cộng dồn chưa rõ.'),
])

export const buffGearTermById = Object.freeze(Object.fromEntries(buffGearTerminology.map(item => [item.id, item])))
