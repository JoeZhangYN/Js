// PURE 决策（F5，默认 OFF）：学习到的高爆发怪若单发可致血量「蹦极」，单点 Silence/Sleep/Confuse 控住它。
// 不读 DOM / 不调 g()——吃 opt + explicit burst facts。
// 选择逻辑（load-bearing）：Silence 只挡施法 → 仅法术爆发用；物理/未知 → Sleep（整回合禁用）；再退 Confuse。
import { BattleMonsterViewEvent, runBattleMonsterView } from "../battle-monster-view.js";

const PHYSICAL_TYPES = Object.freeze({
  piercing: true,
  crushing: true,
  slashing: true,
  physical: true,
});
const CONTROL_IMG = Object.freeze({ 232: "silence", 222: "sleep", 223: "confuse" });
const EVENT_DECIDE = "decide";

export const BattleBurstControlDecisionEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

const battleBurstControlDecisionEventHandlers = Object.freeze({
  [EVENT_DECIDE]: decideBurstControl,
});

/** 按致死伤害类型 + 技能就绪挑控制技：法术→Silence，否则 Sleep，再退 Confuse；都不就绪→null。 */
function pickControl(type, skillReady, opt) {
  const isSpell = !!type && !PHYSICAL_TYPES[type] && type !== "unknown";
  if (isSpell && opt.burstControlSilenceForSpell !== false && skillReady?.["232"]) return "232";
  if (skillReady?.["222"]) return "222"; // Sleep 通用（整回合禁用，物理爆发也挡）
  if (skillReady?.["223"]) return "223"; // Confuse 兜底
  return null;
}

/**
 * @param {object} event
 * @returns {import("../../core/types.js").ActionResult}
 */
function decideBurstControl(event = {}) {
  const opt = event.opt || {};
  if (!opt.burstControlSwitch) return { kind: "noop" };
  if (opt.debuffSkillSwitch === false) return { kind: "noop" };
  // 攻击阶段会用 OFC/FRD 清场 → 蹦极源会被清掉，别白费一回合控制。
  if (event.willClearWithBigSkill) return { kind: "noop" };
  const burstMap = event.learnedBurstByMid || {};
  const hpAbs = event.healthAbs ?? 0;
  if (!(hpAbs > 0)) return { kind: "noop" };
  const frac = (opt.burstControlHpFrac ?? 50) / 100; // 单发 ≥ 当前血 × frac 视为蹦极威胁

  let best = null;
  for (const m of runBattleMonsterView({
    type: BattleMonsterViewEvent.READ_ALIVE_BY_ORDER,
    view: event.monsterFacts || [],
  })) {
    const learned = m.monsterId != null ? burstMap[m.monsterId] : null;
    if (!learned || !(learned.maxHit > 0)) continue;
    if (learned.maxHit < hpAbs * frac) continue; // 单发不构成蹦极
    const skillSel = pickControl(learned.type, event.skillReady, opt);
    if (!skillSel) continue;
    if ((m.buffs || []).includes(CONTROL_IMG[skillSel])) continue; // 已被该控制覆盖 → 跳
    if (!best || learned.maxHit > best.worst) {
      best = { id: m.id, skillSel, worst: learned.maxHit };
    }
  }
  if (!best) return { kind: "noop" };
  return {
    kind: "click-skill-then-target",
    skillId: best.skillSel,
    targetId: best.id,
  };
}

export function runBattleBurstControlDecision(event = { type: EVENT_DECIDE }) {
  return battleBurstControlDecisionEventHandlers[event?.type]?.(event) ?? { kind: "noop" };
}
