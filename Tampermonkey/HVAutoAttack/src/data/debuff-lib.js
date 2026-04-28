// Debuff 技能库：9 个可施法 debuff + 4 个武器附加 debuff（仅权重计算用）。
// 武器附加项 id = null（不可主动施放）。

export const DEBUFF_SKILL_LIB = new Map([
  ["Sle", { name: "Sleep", id: "222", img: "sleep" }],
  ["Bl", { name: "Blind", id: "231", img: "blind" }],
  ["Slo", { name: "Slow", id: "221", img: "slow" }],
  ["Im", { name: "Imperil", id: "213", img: "imperil" }],
  ["MN", { name: "MagNet", id: "233", img: "magnet" }],
  ["Si", { name: "Silence", id: "232", img: "silence" }],
  ["Dr", { name: "Drain", id: "211", img: "drainhp" }],
  ["We", { name: "Weaken", id: "212", img: "weaken" }],
  ["Co", { name: "Confuse", id: "223", img: "confuse" }],
  ["CM", { name: "Coalesced Mana", id: null, img: "coalescemana" }],
  ["Stun", { name: "Stunned", id: null, img: "wpn_stun" }],
  ["PA", { name: "Penetrated Armor", id: null, img: "wpn_ap" }],
  ["BW", { name: "Bleeding Wound", id: null, img: "wpn_bleed" }],
]);
