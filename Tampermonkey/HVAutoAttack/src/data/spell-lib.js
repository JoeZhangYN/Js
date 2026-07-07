// 攻击魔法名称库 + Buff 显示名反查映射。
// OFFENSIVE_SPELL_LIB key 格式 {element}{tier}：element 1=Fire 2=Cold 3=Elec 4=Wind 5=Holy 6=Dark；tier 1/2/3。
// 用于 AoE 目标选择时查 spellAoe 中的目标数。

/** 游戏 buff 显示名 → Code 反查（Channel 技能重施判断用） */
export const NAME_TO_BUFF_CODE = new Map([
  ["Protection", "Pr"],
  ["Spark of Life", "SL"],
  ["Spirit Shield", "SS"],
  ["Hastened", "Ha"],
  ["Arcane Focus", "AF"],
  ["Heartseeker", "He"],
  ["Regen", "Re"],
  ["Shadow Veil", "SV"],
]);

/** 攻击魔法元素身份，用于从同一 spell key 空间派生 UI/配置矩阵。 */
export const OFFENSIVE_SPELL_ELEMENTS = Object.freeze([
  Object.freeze({ code: "1", label: "Fire" }),
  Object.freeze({ code: "2", label: "Cold" }),
  Object.freeze({ code: "3", label: "Elec" }),
  Object.freeze({ code: "4", label: "Wind" }),
  Object.freeze({ code: "5", label: "Holy" }),
  Object.freeze({ code: "6", label: "Dark" }),
]);

export const OFFENSIVE_SPELL_TIERS = Object.freeze(["1", "2", "3"]);

/** 攻击魔法 key→name */
export const OFFENSIVE_SPELL_LIB = new Map([
  ["11", "Firebolt"],
  ["12", "Fiery Blast"],
  ["13", "Inferno"],
  ["21", "Snowball"],
  ["22", "Freeze"],
  ["23", "Blizzard"],
  ["31", "Spark"],
  ["32", "Thunderbolt"],
  ["33", "Chain Lightning"],
  ["41", "Gust"],
  ["42", "Cyclone"],
  ["43", "Tornado"],
  ["51", "Smite"],
  ["52", "Banishment"],
  ["53", "Wrath"],
  ["61", "Corruption"],
  ["62", "Pestilence"],
  ["63", "Disintegrate"],
]);
