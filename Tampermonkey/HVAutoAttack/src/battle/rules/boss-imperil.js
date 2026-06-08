// Boss-Imperil step 的副作用逻辑（含 AoE 覆盖优化 + 可选 Spirit 前置 + 双击）。
// 从 main-loop.js 内联块抽出，单一来源共享给 BATTLE_RULES 的 bossImperil rule（delegate 包装）
// 与（过渡期）main-loop 自身。AoE bestIdx 计算偏复杂，本 chunk 暂以 delegate 形态接入，
// 不强行拆 PURE decide/SHELL（后续 chunk 再拆）。
import { aliveMonstersByOrder } from "../snapshot.js";
import { checkAndActivateSpirit } from "../buff/activate-spirit.js";
import { attemptClickWithTarget } from "../../dom/attempt-click.js";

/**
 * 给未上 Imperil 的 boss 施放 213（含 AoE 覆盖优化：窗口内尽量覆盖多个 needy boss）。
 * 调用前提（由 rule.when 守卫）：opt.debuffSkillSwitch !== false && snap.skillReady["213"]。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 */
export function runBossImperil(opt, snap) {
  if (!snap.skillReady["213"]) return;
  const sortedAlive = aliveMonstersByOrder(snap);
  const isBossNoIm = (m) => m.isBoss && !m.buffs.includes("imperil");
  if (!sortedAlive.some(isBossNoIm)) return;
  // HV AoE 模式 = backward（参 legacy castDebuffOnAll：click i+1 覆盖 [i, i+1]）。窗口 [c-aoe+1, c]。
  // tie-break：相同覆盖时优先 click needy boss 自身——保证它必被击中（防 backward/forward 模式不匹配）。
  const aoe = (snap.spellAoe && snap.spellAoe.Imperil) || opt.debuffSkillAoe?.Im || 1;
  let bestIdx = -1,
    bestCov = -1,
    bestSelfNeed = false;
  for (let c = 0; c < sortedAlive.length; c++) {
    const start = Math.max(0, c - aoe + 1);
    const end = c;
    let cov = 0;
    for (let i = start; i <= end; i++) if (isBossNoIm(sortedAlive[i])) cov++;
    const selfNeed = isBossNoIm(sortedAlive[c]);
    if (cov > bestCov || (cov === bestCov && selfNeed && !bestSelfNeed)) {
      bestCov = cov;
      bestIdx = c;
      bestSelfNeed = selfNeed;
    }
  }
  if (bestIdx < 0 || bestCov <= 0) return;
  if (checkAndActivateSpirit()) return;
  // 探活：snap.skillReady["213"] 是 turn 入口快照，同回合内前序若 click 已 tagEnd+return，
  // 故此处 attemptClickWithTarget 的 isOn 探活与快照一致；保留探活避免 channeling 同构死锁。
  attemptClickWithTarget("213", `#mkey_${sortedAlive[bestIdx].id}`);
}
