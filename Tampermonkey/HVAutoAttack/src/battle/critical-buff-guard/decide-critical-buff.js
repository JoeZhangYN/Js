// 深度B PURE 化：关键 buff 即将消失 + MP 不足续施 → 暂停 + 告警的 graceful degradation。
// 原 critical-buff-guard.js::checkCriticalBuffGuard 读 DOM(#pane_effects>img) + 6 件副作用，
// 此处拆成 PURE decide（只读 opt/snap）+ critical pause execution（忠实复刻命中分支副作用）。
//
// 灵感来自 Monsterbation L1318 stopOnBuffsExpiring：宁可停下让用户接管，也不要让脚本在
// "续 buff 失败 → 裸 buff 攻击 → 越打越虚" 的死循环里硬扛。
//
// 触发条件（与门，全满足）：
// 1. opt.pauseOnCriticalBuffExpire 开启
// 2. opt.criticalBuffsList 中至少一个 buff 当前 turns <= minTurns（Infinity 永续不算"即将消失"）
// 3. 当前 MP < criticalBuffMpFloor%（续 buff 大概率失败的阈值）
import { CriticalBuffFactsEvent, runCriticalBuffFacts } from "./critical-buff-facts.js";

const EVENT_DECIDE = "decide";

export const CriticalBuffDecisionEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

const criticalBuffDecisionEventHandlers = Object.freeze({
  [EVENT_DECIDE]: decideCriticalBuff,
});

/**
 * PURE：关键 buff 即将消失 + MP 不足 → 触发暂停决策。**不读 DOM**——只读 explicit facts。
 * event.playerEffects = [{img,name,turns}]，name 为显示名（与 opt.criticalBuffsList 同口径）；
 * turns 永续 = Infinity（被 turns<=minTurns 跳过，不算"即将消失"）。
 * @param {object} event
 * @returns {import("../../core/types.js").ActionResult}
 *   命中 → { kind:"critical-pause", name, turns, mp, mpFloor }；否则 { kind:"noop" }
 */
function decideCriticalBuff(event = {}) {
  event = criticalBuffDecisionInput(event);
  const opt = event.opt || {};
  if (!opt.pauseOnCriticalBuffExpire) return { kind: "noop" };

  const minTurns = opt.criticalBuffMinTurns ?? 2;
  const mpFloor = opt.criticalBuffMpFloor ?? 30;
  const list = (opt.criticalBuffsList || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return { kind: "noop" };

  // MP 充足 → 自动续 buff 大概率成功，不触发暂停
  const mp = event.manaPercent ?? 100;
  if (mp >= mpFloor) return { kind: "noop" };

  for (const eff of event.playerEffects || []) {
    const name = eff.name;
    if (!name || !list.includes(name)) continue;
    // 永续 buff → turns=Infinity → 被 > minTurns 跳过（不算"即将消失"）
    if (eff.turns > minTurns) continue;
    return { kind: "critical-pause", name, turns: eff.turns, mp, mpFloor };
  }
  return { kind: "noop" };
}

function criticalBuffDecisionInput(event) {
  if (!event?.snap) return event;
  return {
    opt: event.opt,
    ...runCriticalBuffFacts({
      type: CriticalBuffFactsEvent.READ_DECISION,
      snap: event.snap,
    }),
  };
}

export function runCriticalBuffDecision(event = { type: EVENT_DECIDE }) {
  return criticalBuffDecisionEventHandlers[event?.type]?.(event) ?? { kind: "noop" };
}
