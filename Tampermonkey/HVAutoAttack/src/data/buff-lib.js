// Buff 技能库：9 个支援类法术。SOT。
// Code → { name, id, img } 映射。游戏 Hastened 显示名映射在 spell-lib.js 的 NAME_TO_BUFF_CODE。

export const BUFF_SKILL_LIB = new Map([
  ["Pr", { name: "Protection", id: "411", img: "protection" }],
  ["SL", { name: "Spark of Life", id: "422", img: "sparklife" }],
  ["SS", { name: "Spirit Shield", id: "423", img: "spiritshield" }],
  ["Ha", { name: "Haste", id: "412", img: "haste" }],
  ["AF", { name: "Arcane Focus", id: "432", img: "arcanemeditation" }],
  ["He", { name: "Heartseeker", id: "431", img: "heartseeker" }],
  ["Re", { name: "Regen", id: "312", img: "regen" }],
  ["SV", { name: "Shadow Veil", id: "413", img: "shadowveil" }],
  ["Ab", { name: "Absorb", id: "421", img: "absorb" }],
]);
