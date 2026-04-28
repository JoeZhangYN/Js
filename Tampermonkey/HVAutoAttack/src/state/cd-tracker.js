// Universal CD tracker (Phase 5b-1)。
// 仅追踪 SKILL CD（"何时可再施"）——不管 buff effect duration（那由 snapshot.playerBuffs 直读 DOM）。
// HV 物理/魔法 skill 在 DOM 只显 opacity:0.5，不显剩余回合 → 必须 js-state lastFiredTurn。
// 物品 CD（如 manapot CD 39）由 snapshot.js 直读 .cooldown div。
//
// globalTurn：跨 battle 累计，main() 每 turn +1，持久化到 GM_*。
// skillLastUsed：Map<code, globalTurn>，持久化。
// file-size-gate: exempt phase-5b-skill-registry
import { g } from "./store.js";
import { setValue, getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";

/**
 * 全 23 个 fixed-CD 技能登记表。
 * - 5 物理技能（盾战 T1/T2/T3 + OFC + FRD）
 * - 18 攻击魔法（6 元素 × 3 阶）
 * 双刀 / 双手流派的 T1-T3 ID 与盾战不同（21x1/2/3, 23x1/2/3），动态由 fightingStyle 解析（见 effectiveSkillId）。
 *
 * cdBase 是基础值——HV 用户 Ability 可能减半，本表保守取上限。
 * @typedef {{ id: string, cdBase: number }} SkillEntry
 */
export const SKILL_REGISTRY = Object.freeze({
  // 物理（id 由 fightingStyle 决定的用 effectiveSkillId 计算）
  OFC: { id: "1111", cdBase: 50 },
  FRD: { id: "1101", cdBase: 10 },
  T1: { id: "2{style}01", cdBase: 10 }, // {style} 占位符，运行时替换
  T2: { id: "2{style}02", cdBase: 5 },
  T3: { id: "2{style}03", cdBase: 10 },
  // 攻击魔法（基础 CD：tier1=0, tier2=4, tier3=7）
  m111: { id: "111", cdBase: 0 },
  m112: { id: "112", cdBase: 4 },
  m113: { id: "113", cdBase: 7 },
  m121: { id: "121", cdBase: 0 },
  m122: { id: "122", cdBase: 4 },
  m123: { id: "123", cdBase: 7 },
  m131: { id: "131", cdBase: 0 },
  m132: { id: "132", cdBase: 4 },
  m133: { id: "133", cdBase: 7 },
  m141: { id: "141", cdBase: 0 },
  m142: { id: "142", cdBase: 4 },
  m143: { id: "143", cdBase: 7 },
  m151: { id: "151", cdBase: 0 },
  m152: { id: "152", cdBase: 4 },
  m153: { id: "153", cdBase: 7 },
  m161: { id: "161", cdBase: 0 },
  m162: { id: "162", cdBase: 4 },
  m163: { id: "163", cdBase: 7 },
});

/**
 * 解析含 {style} 占位符的 skillId（盾战=2, 双刀=1, 双手=3 等）。
 * @param {string} idTemplate
 * @param {string} fightingStyle
 */
export function effectiveSkillId(idTemplate, fightingStyle) {
  return idTemplate.replace("{style}", fightingStyle);
}

/** 启动时把持久化的 globalTurn / skillLastUsed 灌进 g() runtime。Phase 5b-1 由 init.js 调用一次。 */
export function loadCdState() {
  const gt = parseInt(getValue(STORAGE_KEYS.GLOBAL_TURN));
  g("globalTurn", isNaN(gt) ? 0 : gt);
  g("skillLastUsed", getValue(STORAGE_KEYS.SKILL_LAST_USED, true) || {});
}

/** newRound 末尾调用，原子持久化避免 GM_* 写抖动。 */
export function persistCdState() {
  setValue(STORAGE_KEYS.GLOBAL_TURN, g("globalTurn") || 0);
  setValue(STORAGE_KEYS.SKILL_LAST_USED, g("skillLastUsed") || {});
}

/** main() 每 turn 入口调用一次。 */
export function incrementGlobalTurn() {
  g("globalTurn", (g("globalTurn") || 0) + 1);
}

/**
 * 记录技能在当前 globalTurn 释放。dispatch 在 click 后调用。
 * @param {string} code SKILL_REGISTRY 的 key
 */
export function recordFire(code) {
  const map = g("skillLastUsed") || {};
  map[code] = g("globalTurn") || 0;
  g("skillLastUsed", map);
}

/**
 * 计算单技能距离再次可施还有几回合。0=现可用。
 * @param {string} code
 * @returns {number}
 */
export function turnsUntilReady(code) {
  const entry = SKILL_REGISTRY[code];
  if (!entry) return 0;
  const lastUsed = (g("skillLastUsed") || {})[code];
  if (lastUsed == null) return 0;
  return Math.max(0, entry.cdBase - ((g("globalTurn") || 0) - lastUsed));
}

/**
 * 一次性组装全 cdMap。snapshot.js 调用。
 * @returns {Record<string, number>}
 */
export function collectCdMap() {
  const map = {};
  for (const code of Object.keys(SKILL_REGISTRY)) {
    map[code] = turnsUntilReady(code);
  }
  return map;
}
