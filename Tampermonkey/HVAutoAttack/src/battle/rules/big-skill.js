// PURE: OFC/FRD 即将就绪时跳过全员 Weaken/Imperil 的判定（Phase 5b-5）。
// 从 main-loop.js 抽出共享给 BATTLE_RULES 的 Weaken/Imperil rule 与（过渡期）main-loop 自身，
// 单一来源避免重复。不读 DOM / 不调 g()——只吃 opt + snap。
import {
  BigSkillKillLearningEvent,
  runBigSkillKillLearningAutomation,
} from "../../state/big-skill-kill-learner.js";

const EVENT_READ_CLEAR_READY = "readClearReady";
const EVENT_SHOULD_SKIP_DEBUFF = "shouldSkipDebuff";

export const BigSkillDebuffEvent = Object.freeze({
  READ_CLEAR_READY: EVENT_READ_CLEAR_READY,
  SHOULD_SKIP_DEBUFF: EVENT_SHOULD_SKIP_DEBUFF,
});

/**
 * 清场大招(OFC/FRD)本回合是否「真就绪即可开火」= CD 归零且 OC 已够。
 * 与 decide-attack 实际开火 OFC/FRD 的条件同口径 → 命中即代表本回合就会放大招清场。
 * Feature 5 防守爆发控制复用（OFC 本回合清场则蹦极源即灭，不必再花一回合单点控制）。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @returns {boolean}
 */
function clearSkillReadyNow(opt, snap) {
  for (const skill of ["OFC", "FRD"]) {
    if (!opt[`skill_${skill}`] && !opt.skill?.[skill]) continue;
    const ocNeed = skill === "OFC" ? 205 : 105;
    if ((snap.cdMap[skill] ?? 99) === 0 && (snap.oc ?? 0) >= ocNeed) return true;
  }
  return false;
}

/**
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @param {"We"|"Im"} kind
 * @returns {boolean} true = 应跳过该全员 debuff（让位给即将就绪的大招）
 */
function shouldSkipForBigSkill(opt, snap, kind) {
  if (opt[`skipDebuffForBigSkill_${kind}`] === false) return false;
  // Boss 存活时默认不跳过 Imperil——Imperil 破防让 OFC 打 boss 更狠（一发不够也增伤）。
  // Weaken 减对面伤害，不影响 OFC 杀 boss 速度，仍按 OFC 优化跳过。
  // F4（默认 OFF）：仅当**每只**活 boss 都被结果记忆确认「OFC 能秒（无 imperil）」才放行跳 Imperil。
  if (kind === "Im") {
    const bosses = (snap.view && snap.view.length ? snap.view : snap.monsters || []).filter(
      (m) => m.isBoss && !m.isDead
    );
    if (bosses.length > 0) {
      if (!opt.skipImperilWhenOfcKills) return false; // 默认：boss 存活强保 Imperil
      if (
        !bosses.every(
          (b) =>
            runBigSkillKillLearningAutomation({
              type: BigSkillKillLearningEvent.WILL_KILL_BOSS,
              mid: b.monsterId,
              ofcCooldown: snap?.cdMap?.OFC,
              overcharge: snap?.oc,
              bossHpMax: b.hpMax,
              opt,
            }).skip
        )
      )
        return false;
      return true; // 全确认 OFC 能秒 → 跳过全员 Imperil
    }
    // 无 boss → 落下面原 OFC 优化跳过路
  }
  // Feature 2: 清场大招本回合已就绪 → 全员 Weaken 必废，直接跳（不等下面 OC 窗口/怪数门槛——
  //   怪少的真开场会被 aliveCount 早退误压跳过，白烧一回合 + 蓝逼吃 mana potion）。
  if (kind === "We" && opt.skipWeakenWhenClearReady !== false && clearSkillReadyNow(opt, snap)) {
    return true;
  }
  const N = opt.skipDebuffForBigSkillThreshold ?? 3;
  if (snap.aliveCount <= (opt.physicalDowngradeThreshold || 3)) return false;
  const ocFutureMax = snap.oc + N * 10;
  for (const skill of ["OFC", "FRD"]) {
    if (!opt[`skill_${skill}`] && !opt.skill?.[skill]) continue;
    if ((snap.cdMap[skill] ?? 99) > N) continue;
    const ocNeed = skill === "OFC" ? 205 : 105;
    if (ocFutureMax >= ocNeed) return true;
  }
  return false;
}

export function runBigSkillDebuffAutomation(event = { type: EVENT_SHOULD_SKIP_DEBUFF }) {
  if (event.type === EVENT_READ_CLEAR_READY) return clearSkillReadyNow(event.opt, event.snap);
  if (event.type === EVENT_SHOULD_SKIP_DEBUFF) {
    return shouldSkipForBigSkill(event.opt, event.snap, event.kind);
  }
  return undefined;
}
