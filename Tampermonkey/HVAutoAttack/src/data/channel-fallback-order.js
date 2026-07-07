import { BUFF_SKILL_LIB } from "./buff-lib.js";

const CHANNEL_HEAL_FALLBACKS = Object.freeze([
  { key: "Cu", name: "Cure", skillId: "311" },
  { key: "FC", name: "Full-Cure", skillId: "313" },
]);

export const CHANNEL_FALLBACK_ORDER_OPTIONS = Object.freeze([
  ...CHANNEL_HEAL_FALLBACKS,
  ...Array.from(BUFF_SKILL_LIB.entries()).map(([key, skill]) =>
    Object.freeze({ key, name: skill.name, skillId: skill.id })
  ),
]);
