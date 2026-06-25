// Universal CD tracker (Phase 5b-1)。
// 仅追踪 SKILL CD（"何时可再施"）——不管 buff effect duration（那由 snapshot.playerBuffs 直读 DOM）。
// HV 物理/魔法 skill 在 DOM 只显 opacity:0.5，不显剩余回合 → 必须 js-state lastFiredTurn。
// 物品 CD（如 manapot CD 39）由 snapshot.js 直读 .cooldown div。
//
// globalTurn：跨 battle 累计，main() 每 turn +1，持久化到 GM_*。
// skillLastUsed：Map<code, globalTurn>，持久化。
import { g } from "./store.js";
import { setValue, getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { SKILL_REGISTRY, effectiveSkillId } from "./skill-registry.js";
import { getLearnedCd } from "./cd-learner.js";

// SKILL_REGISTRY / effectiveSkillId 已抽到 skill-registry.js（打破 cd-tracker ↔ cd-learner 环）。
// 为兼容既有 import 路径（如有），此处转出口。
export { SKILL_REGISTRY, effectiveSkillId };

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
  // F3：用学到的真实 CD，但 Math.min(learned, cdBase) 夹住 —— 学习永不上调 CD（防被篡改成过大值）。
  // 即便学习值偏小也安全：真正开火仍以 snap.skillReady(DOM) 为权威，学习值只锐化前瞻 lookahead。
  const effectiveCd = Math.min(getLearnedCd(code), entry.cdBase);
  return Math.max(0, effectiveCd - ((g("globalTurn") || 0) - lastUsed));
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
