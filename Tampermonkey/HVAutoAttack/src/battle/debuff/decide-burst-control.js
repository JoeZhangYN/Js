// PURE 决策（F5，默认 OFF）：学习到的高爆发怪若单发可致血量「蹦极」，单点 Silence/Sleep/Confuse 控住它。
// 不读 DOM / 不调 g()——吃 opt + snap（snap.learnedBurstByMid 由 snapshot attach，保本函数纯）。
// 选择逻辑（load-bearing）：Silence 只挡施法 → 仅法术爆发用；物理/未知 → Sleep（整回合禁用）；再退 Confuse。
import { aliveByOrder } from "../monster-view.js";
import { clearSkillReadyNow } from "../rules/big-skill.js";

const PHYSICAL_TYPES = new Set(["piercing", "crushing", "slashing", "physical"]);
const CONTROL_IMG = { 232: "silence", 222: "sleep", 223: "confuse" };

/** 按致死伤害类型 + 技能就绪挑控制技：法术→Silence，否则 Sleep，再退 Confuse；都不就绪→null。 */
function pickControl(type, snap, opt) {
  const isSpell = !!type && !PHYSICAL_TYPES.has(type) && type !== "unknown";
  if (isSpell && opt.burstControlSilenceForSpell !== false && snap.skillReady?.["232"]) return "232";
  if (snap.skillReady?.["222"]) return "222"; // Sleep 通用（整回合禁用，物理爆发也挡）
  if (snap.skillReady?.["223"]) return "223"; // Confuse 兜底
  return null;
}

/**
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @returns {import("../../core/types.js").ActionResult}
 */
export function decideBurstControl(opt, snap) {
  if (!opt.burstControlSwitch) return { kind: "noop" };
  // OFC 本回合就清场 → 蹦极源即灭，别白费一回合控制（与 F2/F4 同口径，避免过控）。
  if (clearSkillReadyNow(opt, snap)) return { kind: "noop" };
  const burstMap = snap.learnedBurstByMid || {};
  const hpAbs = snap.hpAbs ?? 0;
  if (!(hpAbs > 0)) return { kind: "noop" };
  const frac = (opt.burstControlHpFrac ?? 50) / 100; // 单发 ≥ 当前血 × frac 视为蹦极威胁

  let best = null;
  for (const m of aliveByOrder(snap.view)) {
    const learned = m.monsterId != null ? burstMap[m.monsterId] : null;
    if (!learned || !(learned.maxHit > 0)) continue;
    if (learned.maxHit < hpAbs * frac) continue; // 单发不构成蹦极
    const skillSel = pickControl(learned.type, snap, opt);
    if (!skillSel) continue;
    if ((m.buffs || []).includes(CONTROL_IMG[skillSel])) continue; // 已被该控制覆盖 → 跳
    if (!best || learned.maxHit > best.worst) {
      best = { id: m.id, skillSel, worst: learned.maxHit };
    }
  }
  if (!best) return { kind: "noop" };
  return { kind: "click-skill-then-target", skillSel: best.skillSel, targetSel: `#mkey_${best.id}` };
}
